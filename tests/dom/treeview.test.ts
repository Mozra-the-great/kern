/**
 * TreeView (WAI-ARIA tree pattern): tree and treeitem roles with level, set size, position, expanded and
 * selected states, roving tabindex, the keys of the pattern (arrows, Home/End, Enter/Space, `*`,
 * type-ahead), pointer selection and the twisty, disabled nodes, `bind:selected` / `bind:expanded`,
 * the callbacks and the custom `item` snippet.
 */
import { fireEvent } from '@testing-library/dom';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import TreeView, { type TreeItemState, type TreeNode } from '../../src/lib/components/TreeView.svelte';
import { mapSnippet2 } from './helpers.js';
import { reactive } from './reactive.svelte.js';

afterEach(() => {
	vi.restoreAllMocks();
});

function nodes(): TreeNode[] {
	return [
		{
			id: 'src',
			label: 'src',
			children: [
				{ id: 'lib', label: 'lib', children: [{ id: 'button', label: 'Button.svelte' }] },
				{ id: 'app', label: 'App.svelte' }
			]
		},
		{ id: 'docs', label: 'docs', children: [{ id: 'readme', label: 'Readme.md' }] },
		{ id: 'empty', label: 'empty', children: [] },
		{ id: 'locked', label: 'Élan', disabled: true }
	];
}

interface TreeProps {
	nodes: TreeNode[];
	selected?: string | undefined;
	expanded?: string[] | undefined;
	label?: string | undefined;
	onselect?: ((id: string) => void) | undefined;
	ontoggle?: ((id: string, expanded: boolean) => void) | undefined;
}

function item(id: string): HTMLElement {
	const el = document.querySelector<HTMLElement>(`[data-id="${id}"]`);
	if (el === null) throw new Error(`no item ${id}`);
	return el;
}
function visibleIds(): string[] {
	return screen.getAllByRole('treeitem').map((el) => el.dataset.id ?? '');
}
function focusedId(): string | undefined {
	return (document.activeElement as HTMLElement | null)?.dataset.id;
}

describe('TreeView', () => {
	it('renders a named tree with levels, set sizes, positions and expanded states', () => {
		render(TreeView, { nodes: nodes(), label: 'Files', expanded: ['src'], class: 'extra' });
		const tree = screen.getByRole('tree', { name: 'Files' });
		expect(tree.classList.contains('extra')).toBe(true);
		expect(visibleIds()).toEqual(['src', 'lib', 'app', 'docs', 'empty', 'locked']);
		const src = item('src');
		expect(src.getAttribute('aria-level')).toBe('1');
		expect(src.getAttribute('aria-setsize')).toBe('4');
		expect(src.getAttribute('aria-posinset')).toBe('1');
		expect(src.getAttribute('aria-expanded')).toBe('true');
		expect(item('lib').getAttribute('aria-level')).toBe('2');
		expect(item('lib').getAttribute('aria-expanded')).toBe('false');
		expect(item('app').hasAttribute('aria-expanded')).toBe(false);
		expect(item('empty').hasAttribute('aria-expanded')).toBe(false);
		expect(item('locked').getAttribute('aria-disabled')).toBe('true');
		expect(src.hasAttribute('aria-selected')).toBe(false);
		expect(src.querySelector('[role="group"]')).not.toBeNull();
		expect(src.querySelector('.twisty svg')).not.toBeNull();
		expect(item('app').querySelector('.twisty svg')).toBeNull();
	});

	it('works without expanded, selected or label', () => {
		render(TreeView, { nodes: nodes() });
		expect(screen.getByRole('tree').hasAttribute('aria-label')).toBe(false);
		expect(visibleIds()).toEqual(['src', 'docs', 'empty', 'locked']);
		expect(item('src').tabIndex).toBe(0);
		expect(item('docs').tabIndex).toBe(-1);
	});

	it('puts the selected node in the tab order and marks it', () => {
		render(TreeView, { nodes: nodes(), selected: 'docs' });
		expect(item('docs').tabIndex).toBe(0);
		expect(item('docs').getAttribute('aria-selected')).toBe('true');
		expect(item('docs').querySelector('.row')?.classList.contains('selected')).toBe(true);
		expect(item('src').tabIndex).toBe(-1);
	});

	it('a selected node inside a collapsed branch leaves the first node in the tab order', () => {
		render(TreeView, { nodes: nodes(), selected: 'readme' });
		expect(item('src').tabIndex).toBe(0);
	});

	it('renders nothing focusable for an empty tree', () => {
		render(TreeView, { nodes: [] });
		expect(screen.queryAllByRole('treeitem')).toHaveLength(0);
	});

	it('moves the focus with ArrowUp/ArrowDown and Home/End and keeps one tab stop', async () => {
		const user = userEvent.setup();
		render(TreeView, { nodes: nodes(), expanded: ['src'] });
		await user.tab();
		expect(focusedId()).toBe('src');
		await user.keyboard('{ArrowDown}');
		expect(focusedId()).toBe('lib');
		expect(item('lib').tabIndex).toBe(0);
		expect(item('src').tabIndex).toBe(-1);
		await user.keyboard('{ArrowUp}{ArrowUp}');
		expect(focusedId()).toBe('src');
		await user.keyboard('{End}');
		expect(focusedId()).toBe('locked');
		await user.keyboard('{ArrowDown}');
		expect(focusedId()).toBe('locked');
		await user.keyboard('{Home}');
		expect(focusedId()).toBe('src');
	});

	it('ArrowRight expands, then enters; ArrowLeft collapses, then goes to the parent', async () => {
		const user = userEvent.setup();
		const ontoggle = vi.fn();
		const props = reactive<TreeProps>({ nodes: nodes(), expanded: undefined, ontoggle });
		render(TreeView, { props });
		await user.tab();
		await user.keyboard('{ArrowRight}');
		expect(props.expanded).toEqual(['src']);
		expect(ontoggle).toHaveBeenLastCalledWith('src', true);
		expect(focusedId()).toBe('src');
		await user.keyboard('{ArrowRight}');
		expect(focusedId()).toBe('lib');
		await user.keyboard('{ArrowRight}{ArrowRight}');
		expect(focusedId()).toBe('button');
		await user.keyboard('{ArrowRight}');
		expect(focusedId()).toBe('button');
		await user.keyboard('{ArrowLeft}');
		expect(focusedId()).toBe('lib');
		await user.keyboard('{ArrowLeft}');
		expect(props.expanded).toEqual(['src']);
		expect(ontoggle).toHaveBeenLastCalledWith('lib', false);
		await user.keyboard('{ArrowLeft}{ArrowLeft}');
		expect(focusedId()).toBe('src');
		expect(props.expanded).toEqual([]);
		await user.keyboard('{ArrowLeft}');
		expect(focusedId()).toBe('src');
		expect(ontoggle).toHaveBeenCalledTimes(4);
	});

	it('Enter and Space select; a disabled node stays unselected', async () => {
		const user = userEvent.setup();
		const onselect = vi.fn();
		const props = reactive<TreeProps>({ nodes: nodes(), selected: undefined, expanded: undefined, onselect });
		render(TreeView, { props });
		await user.tab();
		await user.keyboard('{Enter}');
		expect(props.selected).toBe('src');
		await user.keyboard('{ArrowDown} ');
		expect(props.selected).toBe('docs');
		expect(onselect).toHaveBeenLastCalledWith('docs');
		await user.keyboard('{End}{Enter}');
		expect(props.selected).toBe('docs');
		expect(onselect).toHaveBeenCalledTimes(2);
	});

	it('* expands every sibling with children and reports each', async () => {
		const user = userEvent.setup();
		const ontoggle = vi.fn();
		const props = reactive<TreeProps>({ nodes: nodes(), expanded: ['docs'], ontoggle });
		render(TreeView, { props });
		await user.tab();
		await user.keyboard('*');
		expect(props.expanded).toEqual(['docs', 'src']);
		expect(ontoggle).toHaveBeenCalledExactlyOnceWith('src', true);
		await user.keyboard('*');
		expect(ontoggle).toHaveBeenCalledTimes(1);
	});

	it('* works without a bound expanded list and without ontoggle', async () => {
		const user = userEvent.setup();
		render(TreeView, { nodes: nodes() });
		await user.tab();
		await user.keyboard('*');
		expect(visibleIds()).toContain('readme');
	});

	it('type-ahead focuses the next match, cycles on a repeated letter and resets after a pause', async () => {
		const user = userEvent.setup();
		let now = 10_000;
		vi.spyOn(Date, 'now').mockImplementation(() => now);
		render(TreeView, { nodes: nodes(), expanded: ['src', 'docs'] });
		await user.tab();
		await user.keyboard('a');
		expect(focusedId()).toBe('app');
		now += 1000;
		await user.keyboard('e');
		expect(focusedId()).toBe('empty');
		now += 1000;
		await user.keyboard('e');
		expect(focusedId()).toBe('locked');
		now += 100;
		await user.keyboard('e');
		expect(focusedId()).toBe('empty');
		now += 1000;
		await user.keyboard('d');
		expect(focusedId()).toBe('docs');
		now += 100;
		await user.keyboard('o');
		expect(focusedId()).toBe('docs');
		now += 1000;
		await user.keyboard('z');
		expect(focusedId()).toBe('docs');
	});

	it('type-ahead ignores modified keys and passes unrelated keys through', () => {
		render(TreeView, { nodes: nodes() });
		item('src').focus();
		expect(fireEvent.keyDown(item('src'), { key: 'd', ctrlKey: true })).toBe(true);
		expect(fireEvent.keyDown(item('src'), { key: 'd', metaKey: true })).toBe(true);
		expect(fireEvent.keyDown(item('src'), { key: 'd', altKey: true })).toBe(true);
		expect(fireEvent.keyDown(item('src'), { key: 'Tab' })).toBe(true);
		expect(focusedId()).toBe('src');
		expect(fireEvent.keyDown(item('src'), { key: 'd' })).toBe(false);
	});

	it('ignores keys and clicks that do not come from a known item', () => {
		const onselect = vi.fn();
		render(TreeView, { nodes: nodes(), onselect });
		const tree = screen.getByRole('tree');
		expect(fireEvent.keyDown(tree, { key: 'ArrowDown' })).toBe(true);
		fireEvent.click(tree);
		item('src').dataset.id = 'gone';
		fireEvent.click(document.querySelector('[data-id="gone"]') ?? tree);
		expect(fireEvent.keyDown(document.querySelector('[data-id="gone"]') ?? tree, { key: 'Enter' })).toBe(true);
		expect(onselect).not.toHaveBeenCalled();
	});

	it('a click selects, a click on the twisty toggles', async () => {
		const user = userEvent.setup();
		const onselect = vi.fn();
		const props = reactive<TreeProps>({ nodes: nodes(), selected: undefined, expanded: undefined, onselect });
		render(TreeView, { props });
		await user.click(item('docs').querySelector('.text') ?? item('docs'));
		expect(props.selected).toBe('docs');
		expect(onselect).toHaveBeenCalledWith('docs');
		expect(item('docs').tabIndex).toBe(0);
		await user.click(item('src').querySelector('.twisty') ?? item('src'));
		expect(props.expanded).toEqual(['src']);
		expect(props.selected).toBe('docs');
		await user.click(item('src').querySelector('.twisty') ?? item('src'));
		expect(props.expanded).toEqual([]);
		await user.click(item('empty').querySelector('.twisty') ?? item('empty'));
		expect(props.selected).toBe('empty');
		await user.click(item('locked'));
		expect(props.selected).toBe('empty');
	});

	it('focus on a nested part does not move the roving stop; on the item it does', () => {
		render(TreeView, { nodes: nodes(), expanded: ['src'] });
		fireEvent.focus(item('lib'));
		expect(item('lib').tabIndex).toBe(0);
		fireEvent.focus(item('app').querySelector('.row') ?? item('app'));
		expect(item('lib').tabIndex).toBe(0);
	});

	it('follows changes of the bound values from outside', async () => {
		const props = reactive<TreeProps>({ nodes: nodes(), selected: undefined, expanded: undefined });
		render(TreeView, { props });
		props.expanded = ['docs'];
		await vi.waitFor(() => expect(visibleIds()).toContain('readme'));
		props.selected = 'readme';
		await vi.waitFor(() => expect(item('readme').getAttribute('aria-selected')).toBe('true'));
	});

	it('renders the item snippet with the node state', () => {
		const snippet = mapSnippet2<TreeNode, TreeItemState>(
			(n, s) => `${n.label}|${s.level}|${s.expanded ? 'open' : 'closed'}|${s.selected ? 'sel' : '-'}|${s.hasChildren ? 'kids' : 'leaf'}`
		);
		render(TreeView, { nodes: nodes(), expanded: ['src'], selected: 'app', item: snippet });
		expect(item('src').querySelector('[data-snippet]')?.textContent).toBe('src|1|open|-|kids');
		expect(item('app').querySelector('[data-snippet]')?.textContent).toBe('App.svelte|2|closed|sel|leaf');
	});
});
