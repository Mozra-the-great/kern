/**
 * SortableList and SelectGrid (#68) on the server-rendered markup: roles, names, disabled ends, the single
 * Tab stop, selected state, default texts in English and German (the accessible name of every button
 * contains its visible text, WCAG 2.5.3). The keyboard, focus and drag and drop behaviour runs in a
 * browser in tests/elements/reorder.spec.ts, and its rules as plain functions in tests/unit/reorder.test.ts.
 */
import type { Snippet } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import SelectGrid from '../../src/lib/components/SelectGrid.svelte';
import SortableList from '../../src/lib/components/SortableList.svelte';
import { de } from '../../src/lib/components/strings-de.js';
import { en, resetStrings, setStrings } from '../../src/lib/components/strings.js';
import { html, one, snippet, tags, text, type Tag } from './html.js';

afterEach(() => {
	resetStrings();
});

const files = [
	{ id: 'a', label: 'Report.pdf', description: '3 pages' },
	{ id: 'b', label: 'Invoice.pdf' },
	{ id: 'c', label: 'Notes.pdf' }
];
const pages = [1, 2, 3, 4, 5].map((n) => ({ id: n, label: `Page ${n}`, src: `/p${n}.png` }));
const withClass = (list: Tag[], cls: string): Tag[] => list.filter((t) => (t.attrs.class ?? '').split(/\s+/).includes(cls));

/** Visible text and accessible name of every button of the list, in markup order. */
function buttons(markup: string): { visible: string; name: string; disabled: boolean }[] {
	return [...markup.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)].map((m) => ({
		visible: text(m[2] ?? ''),
		name: /aria-label="([^"]*)"/.exec(m[1] ?? '')?.[1] ?? '',
		disabled: /\bdisabled\b/.test(m[1] ?? '')
	}));
}

describe('SortableList', () => {
	it('is a named list with one item per entry, in order', () => {
		const markup = html(SortableList, { items: files, label: 'Files' });
		expect(one(markup, 'ul').attrs['aria-label']).toBe('Files');
		expect(tags(markup, 'li')).toHaveLength(3);
		const names = [...markup.matchAll(/<span class="name[^"]*">([^<]*)</g)].map((m) => m[1]);
		expect(names).toEqual(['Report.pdf', 'Invoice.pdf', 'Notes.pdf']);
		expect(text(markup)).toContain('3 pages');
	});

	it('names the list from the catalogue when there is no label', () => {
		expect(one(html(SortableList, { items: files }), 'ul').attrs['aria-label']).toBe('Items');
		setStrings(de);
		expect(one(html(SortableList, { items: files }), 'ul').attrs['aria-label']).toBe('Einträge');
		expect(one(html(SortableList, { items: files, label: undefined }), 'ul').attrs['aria-label']).toBe('Einträge');
	});

	it('gives every button the item name, and disables the ones that cannot move', () => {
		const list = buttons(html(SortableList, { items: files }));
		expect(list.map((b) => b.name)).toEqual([
			'Move Report.pdf up',
			'Move Report.pdf down',
			'Remove Report.pdf',
			'Move Invoice.pdf up',
			'Move Invoice.pdf down',
			'Remove Invoice.pdf',
			'Move Notes.pdf up',
			'Move Notes.pdf down',
			'Remove Notes.pdf'
		]);
		expect(list.map((b) => b.disabled)).toEqual([true, false, false, false, false, false, false, true, false]);
		expect(list.map((b) => b.visible).slice(0, 3)).toEqual(['Up', 'Down', 'Remove']);
	});

	it('a single item can neither move up nor down', () => {
		const list = buttons(html(SortableList, { items: [files[0]] }));
		expect(list.map((b) => b.disabled)).toEqual([true, true, false]);
	});

	it('the accessible name of every button contains its visible text, in English and in German', () => {
		for (const bundle of [en, de]) {
			setStrings(bundle);
			for (const b of buttons(html(SortableList, { items: files }))) {
				expect(b.name.toLowerCase(), `${bundle.lang}: ${b.visible}`).toContain(b.visible.toLowerCase());
			}
		}
		setStrings(de);
		expect(
			buttons(html(SortableList, { items: [files[1], files[0]] }))
				.map((b) => [b.visible, b.name])
				.slice(3, 6)
		).toEqual([
			['Nach oben', 'Report.pdf nach oben verschieben'],
			['Nach unten', 'Report.pdf nach unten verschieben'],
			['Entfernen', 'Report.pdf entfernen']
		]);
	});

	it('props win over the catalogue; {name} is replaced', () => {
		const markup = html(SortableList, {
			items: files,
			upText: 'Hoch',
			downText: 'Runter',
			removeText: 'Weg',
			upLabel: 'Hoch: {name}',
			downLabel: 'Runter: {name}',
			removeLabel: 'Weg mit {name}'
		});
		const list = buttons(markup);
		expect(list.slice(3, 6).map((b) => [b.visible, b.name])).toEqual([
			['Hoch', 'Hoch: Invoice.pdf'],
			['Runter', 'Runter: Invoice.pdf'],
			['Weg', 'Weg mit Invoice.pdf']
		]);
	});

	it('removable=false leaves out the remove buttons', () => {
		const list = buttons(html(SortableList, { items: files, removable: false }));
		expect(list).toHaveLength(6);
		expect(list.some((b) => b.visible === 'Remove')).toBe(false);
		expect(buttons(html(SortableList, { items: files, removable: undefined }))).toHaveLength(9);
	});

	it('dragDrop=false turns dragging off; it is on by default and for undefined', () => {
		expect(tags(html(SortableList, { items: files }), 'li').every((li) => li.attrs.draggable === 'true')).toBe(true);
		expect(tags(html(SortableList, { items: files, dragDrop: undefined }), 'li').every((li) => li.attrs.draggable === 'true')).toBe(true);
		expect(tags(html(SortableList, { items: files, dragDrop: false }), 'li').some((li) => 'draggable' in li.attrs)).toBe(false);
	});

	it('works with any item type through key, itemLabel and the item snippet', () => {
		const entries = [
			{ uid: 7, file: 'one.pdf', size: 10 },
			{ uid: 8, file: 'two.pdf', size: 20 }
		];
		const item = ((_anchor: unknown, entry: (typeof entries)[number], index: number): void => void [entry, index]) as unknown as Snippet<
			[(typeof entries)[number], number]
		>;
		const markup = html(SortableList, {
			items: entries,
			key: (entry: (typeof entries)[number]) => entry.uid,
			itemLabel: (entry: (typeof entries)[number]) => entry.file,
			item
		});
		expect(
			buttons(markup)
				.map((b) => b.name)
				.slice(0, 3)
		).toEqual(['Move one.pdf up', 'Move one.pdf down', 'Remove one.pdf']);
	});

	it('plain strings are items too; the markup of a label is text', () => {
		const markup = html(SortableList, { items: ['one', '<b>two</b>'] });
		expect(tags(markup, 'b')).toHaveLength(0);
		expect(markup).toContain('&lt;b>two&lt;/b>');
		expect(markup).toContain('aria-label="Move &lt;b>two&lt;/b> up"');
	});

	it('an empty list or no items at all renders an empty list', () => {
		expect(tags(html(SortableList, { items: [] }), 'li')).toHaveLength(0);
		expect(tags(html(SortableList, { items: undefined as unknown as never[] }), 'li')).toHaveLength(0);
		expect(tags(html(SortableList, { items: [] }), 'ul')).toHaveLength(1);
	});

	it('keeps id and class on the list', () => {
		const ul = one(html(SortableList, { items: files, id: 'files', class: 'wide' }), 'ul');
		expect(ul.attrs.id).toBe('files');
		expect(ul.attrs.class).toContain('wide');
		expect(ul.attrs.class).toContain('k-sortable-list');
	});
});

describe('SelectGrid', () => {
	const options = (markup: string): Tag[] => tags(markup, 'div').filter((d) => d.attrs.role === 'option');

	it('is a multi-select listbox with a name and one option per entry', () => {
		const markup = html(SelectGrid, { items: pages, label: 'Pages' });
		const listbox = tags(markup, 'div').find((d) => d.attrs.role === 'listbox');
		expect(listbox?.attrs['aria-label']).toBe('Pages');
		expect(listbox?.attrs['aria-multiselectable']).toBe('true');
		expect(options(markup).map((o) => o.attrs['aria-label'])).toEqual(['Page 1', 'Page 2', 'Page 3', 'Page 4', 'Page 5']);
	});

	it('names the grid from the catalogue when there is no label', () => {
		const name = (markup: string): string | undefined => tags(markup, 'div').find((d) => d.attrs.role === 'listbox')?.attrs['aria-label'];
		expect(name(html(SelectGrid, { items: pages }))).toBe('Selectable items');
		setStrings(de);
		expect(name(html(SelectGrid, { items: pages }))).toBe('Auswählbare Einträge');
	});

	it('has one Tab stop: the first option, the others are reachable by arrow keys only', () => {
		const list = options(html(SelectGrid, { items: pages }));
		expect(list.map((o) => o.attrs.tabindex)).toEqual(['0', '-1', '-1', '-1', '-1']);
	});

	it('marks the selected options with aria-selected on every option, and with the selected class', () => {
		const markup = html(SelectGrid, { items: pages, selected: [2, 4] });
		expect(options(markup).map((o) => o.attrs['aria-selected'])).toEqual(['false', 'true', 'false', 'true', 'false']);
		expect(withClass(options(markup), 'selected')).toHaveLength(2);
		// Unknown keys are ignored, and undefined or a missing prop mean nothing is selected.
		expect(withClass(options(html(SelectGrid, { items: pages, selected: [99] })), 'selected')).toHaveLength(0);
		expect(withClass(options(html(SelectGrid, { items: pages, selected: undefined })), 'selected')).toHaveLength(0);
		expect(options(html(SelectGrid, { items: pages })).every((o) => o.attrs['aria-selected'] === 'false')).toBe(true);
	});

	it('draws the check box for every option and the picture as a decorative image with a caption', () => {
		const markup = html(SelectGrid, { items: pages });
		expect(withClass(tags(markup, 'span'), 'check')).toHaveLength(5);
		expect(withClass(tags(markup, 'span'), 'check').every((c) => c.attrs['aria-hidden'] === 'true')).toBe(true);
		const images = tags(markup, 'img');
		expect(images).toHaveLength(5);
		expect(images.every((i) => i.attrs.alt === '')).toBe(true);
		expect(images[0]?.attrs.src).toBe('/p1.png');
		expect(withClass(tags(markup, 'span'), 'caption')).toHaveLength(5);
		expect(text(markup)).toContain('Page 3');
	});

	it('caption=false hides the caption, and a snippet hides it by default', () => {
		expect(withClass(tags(html(SelectGrid, { items: pages, caption: false }), 'span'), 'caption')).toHaveLength(0);
		expect(withClass(tags(html(SelectGrid, { items: pages, caption: undefined }), 'span'), 'caption')).toHaveLength(5);
		const item = snippet('<i>pic</i>') as unknown as Snippet<[(typeof pages)[number], number, boolean]>;
		const markup = html(SelectGrid, { items: pages, item });
		expect(withClass(tags(markup, 'span'), 'caption')).toHaveLength(0);
		expect(tags(markup, 'i')).toHaveLength(5);
		expect(withClass(tags(html(SelectGrid, { items: pages, item, caption: true }), 'span'), 'caption')).toHaveLength(5);
	});

	it('is draggable and points to the keyboard hint only when reorderable', () => {
		const plain = html(SelectGrid, { items: pages });
		expect(options(plain).some((o) => 'draggable' in o.attrs || 'aria-describedby' in o.attrs)).toBe(false);
		expect(text(plain)).not.toContain('Alt');
		const markup = html(SelectGrid, { items: pages, reorderable: true });
		const hint = withClass(tags(markup, 'span'), 'hint')[0];
		expect(hint?.attrs.id).toBeTruthy();
		expect(options(markup).every((o) => o.attrs.draggable === 'true' && o.attrs['aria-describedby'] === hint?.attrs.id)).toBe(true);
		expect(text(markup)).toContain('Hold Alt and press an arrow key to move the focused item.');
		setStrings(de);
		expect(text(html(SelectGrid, { items: pages, reorderable: true }))).toContain('Alt gedrückt halten');
		expect(text(html(SelectGrid, { items: pages, reorderable: true, reorderHint: 'Alt + Pfeil' }))).toContain('Alt + Pfeil');
		expect(options(html(SelectGrid, { items: pages, reorderable: undefined })).some((o) => 'draggable' in o.attrs)).toBe(false);
	});

	it('min sets the smallest column width', () => {
		const style = (markup: string): string | undefined => tags(markup, 'div').find((d) => d.attrs.role === 'listbox')?.attrs.style;
		expect(style(html(SelectGrid, { items: pages, min: '90px' }))).toContain('--k-select-grid-min: 90px');
		expect(style(html(SelectGrid, { items: pages, min: undefined }))).toBeUndefined();
		expect(style(html(SelectGrid, { items: pages, min: '' }))).toBeUndefined();
	});

	it('renders nothing for no items (an empty listbox is invalid)', () => {
		expect(tags(html(SelectGrid, { items: [] }), 'div')).toHaveLength(0);
		expect(html(SelectGrid, { items: undefined as unknown as never[] })).not.toContain('listbox');
	});

	it('works with any item type through key and itemLabel', () => {
		const entries = [
			{ uid: 'x', name: 'first', turn: 90 },
			{ uid: 'y', name: 'second', turn: 0 }
		];
		const markup = html(SelectGrid, {
			items: entries,
			key: (entry: (typeof entries)[number]) => entry.uid,
			itemLabel: (entry: (typeof entries)[number], index: number) => `Position ${index + 1}: ${entry.name}, turned ${entry.turn}`,
			selected: ['y']
		});
		expect(options(markup).map((o) => o.attrs['aria-label'])).toEqual(['Position 1: first, turned 90', 'Position 2: second, turned 0']);
		expect(options(markup).map((o) => o.attrs['aria-selected'])).toEqual(['false', 'true']);
	});

	it('shows the text of a label as text', () => {
		const markup = html(SelectGrid, { items: [{ id: 1, label: '<b>x</b>' }] });
		expect(tags(markup, 'b')).toHaveLength(0);
		expect(markup).toContain('&lt;b>x&lt;/b>');
	});

	it('keeps id and class on the listbox', () => {
		const listbox = tags(html(SelectGrid, { items: pages, id: 'grid', class: 'big' }), 'div').find((d) => d.attrs.role === 'listbox');
		expect(listbox?.attrs.id).toBe('grid');
		expect(listbox?.attrs.class).toContain('big');
	});
});
