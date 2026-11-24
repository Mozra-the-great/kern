/**
 * Navigation and content parity with stuffcloud and nagellacke (#46–#49, #74), on the server-rendered
 * markup: element choice, roles, names and attributes. Mirrors stuffcloud's tabs-cards.test.ts
 * (TabLinks, Tile, TileGrid) and progress-code.test.ts (CodeBlock). Keyboard, clipboard, scrolling
 * and the dialogs' open/close behaviour run in a browser in tests/elements/navigation.spec.ts and
 * tests/elements/feedback.spec.ts.
 */
import type { Snippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import CodeBlock from '../../src/lib/components/CodeBlock.svelte';
import Drawer from '../../src/lib/components/Drawer.svelte';
import Modal from '../../src/lib/components/Modal.svelte';
import TabLinks from '../../src/lib/components/TabLinks.svelte';
import Tabs, { type TabItem } from '../../src/lib/components/Tabs.svelte';
import Tile from '../../src/lib/components/Tile.svelte';
import TileGrid from '../../src/lib/components/TileGrid.svelte';
import { tabName } from '../../src/lib/components/TabBadge.svelte';
import { html, one, snippet, tags, text, type Tag } from './html.js';

const panel = snippet('<p>panel</p>') as unknown as Snippet<[string]>;
const withClass = (list: Tag[], cls: string): Tag[] => list.filter((t) => (t.attrs.class ?? '').split(/\s+/).includes(cls));

describe('CodeBlock (stuffcloud CodeBlock)', () => {
	const code = 'stuffcloud deploy ./dist --expires 7d';

	it('shows the code as text; markup is escaped, whitespace kept', () => {
		const tricky = '<b>x</b>\n  indented & more';
		const markup = html(CodeBlock, { code: tricky });
		expect(tags(markup, 'b')).toHaveLength(0);
		expect(markup).toContain('&lt;b>x&lt;/b>\n  indented &amp; more');
		expect(one(markup, 'pre')).toBeTruthy();
	});

	it('has no copy button unless asked for one', () => {
		expect(tags(html(CodeBlock, { code }), 'button')).toHaveLength(0);
		expect(tags(html(CodeBlock, { code, copy: false, copyLabel: 'Copy' }), 'button')).toHaveLength(0);
	});

	it('copyLabel brings a text button (stuffcloud); copy alone an English default', () => {
		const markup = html(CodeBlock, { code, label: 'Deploy command', copyLabel: 'Kopieren', copiedLabel: 'Kopiert' });
		const button = one(markup, 'button');
		expect(button.attrs['aria-label']).toBeUndefined();
		expect(text(markup)).toContain('Kopieren');
		// The live region exists from the start, empty.
		expect(one(markup, 'span', { role: 'status' }).attrs['aria-live']).toBe('polite');
		expect(text(html(CodeBlock, { code, copy: true }))).toContain('Copy');
		// Icon-only: the label becomes the name.
		expect(one(html(CodeBlock, { code, copyLabel: 'Copy', showCopyLabel: false }), 'button').attrs['aria-label']).toBe('Copy');
	});

	it('hides the scrollbar by default, on the mono code surface; undefined props keep the defaults', () => {
		const markup = html(CodeBlock, { code, label: undefined, language: undefined, hideScrollbar: undefined, showCopyLabel: undefined });
		const scroll = withClass(tags(markup, 'div'), 'scroll');
		expect(scroll).toHaveLength(1);
		expect(scroll[0]?.attrs.class).toContain('no-bar');
		const visible = withClass(tags(html(CodeBlock, { code, hideScrollbar: false }), 'div'), 'scroll');
		expect(visible[0]?.attrs.class).not.toContain('no-bar');
		expect(withClass(tags(markup, 'div'), 'k-code-block')).toHaveLength(1);
	});

	it('language and line numbers work as on Code', () => {
		const markup = html(CodeBlock, { code: 'a\nb\n', language: 'sh', lineNumbers: true, startLine: 9 });
		expect(one(markup, 'code').attrs.class).toContain('language-sh');
		expect(one(markup, 'span', { 'aria-hidden': 'true' })).toBeTruthy();
		expect(markup).toContain('9\n10');
	});
});

describe('Tabs as a tab bar (#48)', () => {
	const tabs: TabItem[] = [
		{ id: 'home', label: 'Home' },
		{ id: 'inbox', label: 'Inbox', badge: 3, badgeLabel: '3 unread' },
		{ id: 'admin', label: 'Admin', hidden: true },
		{ id: 'more', label: 'More', dot: true, badgeLabel: 'Sync error', badgeTone: 'danger', controls: 'page' },
		{ id: 'off', label: 'Off', disabled: true }
	];

	it('without a panel there is no tabpanel; aria-controls only from `controls`', () => {
		const markup = html(Tabs, { tabs, label: 'Main' });
		expect(tags(markup).filter((t) => t.attrs.role === 'tabpanel')).toHaveLength(0);
		const buttons = tags(markup, 'button');
		expect(buttons.map((b) => b.attrs['aria-controls'])).toEqual([undefined, undefined, 'page', undefined]);
	});

	it('with a panel every tab controls it, `controls` is ignored', () => {
		const markup = html(Tabs, { tabs, label: 'Main', panel, value: 'home' });
		const tabpanel = one(markup, 'div', { role: 'tabpanel' });
		expect(tags(markup, 'button')[0]?.attrs['aria-controls']).toBe(tabpanel.attrs.id);
		expect(tags(markup, 'button')[2]?.attrs['aria-controls']).toMatch(/-panel-more$/);
	});

	it('hidden tabs are not rendered; badges are decorative and part of the name', () => {
		const markup = html(Tabs, { tabs, label: 'Main' });
		expect(text(markup)).not.toContain('Admin');
		const inbox = one(markup, 'button', { 'data-id': 'inbox' });
		expect(inbox.attrs['aria-label']).toBe('Inbox 3 unread');
		expect(one(markup, 'button', { 'data-id': 'more' }).attrs['aria-label']).toBe('More Sync error');
		expect(one(markup, 'button', { 'data-id': 'home' }).attrs['aria-label']).toBeUndefined();
		expect(withClass(tags(markup, 'span'), 'k-tab-badge')).toHaveLength(1);
		expect(withClass(tags(markup, 'span'), 'k-tab-dot')).toHaveLength(1);
		for (const t of tags(markup, 'span').filter((s) => /k-tab-(badge|dot)/.test(s.attrs.class ?? '')))
			expect(t.attrs['aria-hidden']).toBe('true');
	});

	it('a hidden or unknown value leaves Tab focus on the first usable tab', () => {
		for (const value of ['admin', 'nope', 'off', undefined]) {
			const markup = html(Tabs, { tabs, label: 'Main', value });
			const focusable = tags(markup, 'button').filter((b) => b.attrs.tabindex === '0');
			expect(
				focusable.map((b) => b.attrs['data-id']),
				String(value)
			).toEqual(['home']);
		}
		const onInbox = tags(html(Tabs, { tabs, value: 'inbox' }), 'button').filter((b) => b.attrs.tabindex === '0');
		expect(onInbox.map((b) => b.attrs['data-id'])).toEqual(['inbox']);
	});

	it('tabName: label first, then badgeLabel or the badge text', () => {
		expect(tabName('Inbox', {})).toBeUndefined();
		expect(tabName('Inbox', { badge: '' })).toBeUndefined();
		expect(tabName('Inbox', { dot: true })).toBeUndefined();
		expect(tabName('Inbox', { badge: 0 })).toBe('Inbox 0');
		expect(tabName('Inbox', { badge: 4, badgeLabel: '' })).toBe('Inbox 4');
		expect(tabName('More', { dot: true, badgeLabel: 'Sync error' })).toBe('More Sync error');
	});
});

describe('TabLinks (stuffcloud TabLinks, #47)', () => {
	const links = [
		{ href: '#convert', label: 'Convert', current: true },
		{ href: '#base64', label: 'Base64' },
		{ href: '#units', label: 'Units', current: false }
	];

	it('renders a navigation landmark with links', () => {
		const markup = html(TabLinks, { links, label: 'Convert tools' });
		expect(one(markup, 'nav').attrs['aria-label']).toBe('Convert tools');
		expect(tags(markup, 'a').map((a) => a.attrs.href)).toEqual(['#convert', '#base64', '#units']);
	});

	it('marks only the current page with aria-current, no tab roles', () => {
		const markup = html(TabLinks, { links, label: 'Convert tools' });
		expect(tags(markup, 'a').map((a) => a.attrs['aria-current'])).toEqual(['page', undefined, undefined]);
		expect(tags(markup).filter((t) => t.attrs.role === 'tab' || t.attrs.role === 'tablist')).toHaveLength(0);
	});

	it('the same href twice is allowed (keyed by position)', () => {
		const markup = html(TabLinks, { links: [links[0] ?? { href: '', label: '' }, { href: '#convert', label: 'Again' }], label: 'x' });
		expect(tags(markup, 'a')).toHaveLength(2);
	});
});

describe('Tile and TileGrid (stuffcloud, #49)', () => {
	it('a tile without href is a plain cell', () => {
		const markup = html(Tile, { children: snippet('<span>Plain</span>'), 'data-testid': 'tile' });
		const cell = one(markup, 'div', { 'data-testid': 'tile' });
		expect(cell.attrs.class).toContain('k-tile');
		expect(tags(markup, 'a')).toHaveLength(0);
		expect(text(markup)).toBe('Plain');
	});

	it('a tile with href is a link around the whole cell and gets the attributes', () => {
		const markup = html(Tile, {
			href: '/pdf',
			target: '_blank',
			rel: 'noopener',
			'aria-describedby': 'd',
			children: snippet('<span>PDF</span>')
		});
		const link = one(markup, 'a');
		expect(link.attrs).toMatchObject({ href: '/pdf', target: '_blank', rel: 'noopener', 'aria-describedby': 'd' });
		expect(link.attrs.class).toContain('k-tile');
		expect(tags(markup, 'div')).toHaveLength(0);
	});

	it('as="li": the item keeps the lines and attributes, the link fills it', () => {
		const markup = html(Tile, { as: 'li', href: '/img', id: 'img', children: snippet('<span>Images</span>') });
		const li = one(markup, 'li');
		expect(li.attrs).toMatchObject({ id: 'img' });
		expect(li.attrs.class).toContain('k-tile');
		const link = one(markup, 'a');
		expect(link.at).toBeGreaterThan(li.at);
		expect(link.attrs.href).toBe('/img');
		// An empty href is no link.
		expect(tags(html(Tile, { href: '', children: snippet('x') }), 'a')).toHaveLength(0);
	});

	it('the grid wraps its tiles, passes attributes through and picks its element', () => {
		const markup = html(TileGrid, { 'aria-label': 'Tools', role: 'group', children: snippet('<span>inside</span>') });
		const grid = one(markup, 'div', { role: 'group' });
		expect(grid.attrs['aria-label']).toBe('Tools');
		expect(text(markup)).toBe('inside');
		expect(one(html(TileGrid, { as: 'ul', children: snippet('') }), 'ul').attrs.class).toContain('k-tile-grid');
		expect(one(html(TileGrid, { min: '200px', children: snippet('') }), 'div').attrs.style).toContain('--k-tile-min: 200px');
		// Unknown element names fall back to div.
		expect(tags(html(TileGrid, { as: 'script' as 'div', children: snippet('') }), 'div')).toHaveLength(1);
	});
});

describe('Drawer parity with Modal (#74)', () => {
	it('dismissible={false} hides the close button and sets closedby="none"', () => {
		const markup = html(Drawer, { title: 'Plan', dismissible: false });
		expect(one(markup, 'dialog').attrs.closedby).toBe('none');
		expect(tags(markup, 'button')).toHaveLength(0);
	});

	it('dismissible by default (also for undefined), with a named close button', () => {
		const markup = html(Drawer, { title: 'Filter', dismissible: undefined, closeLabel: 'Schließen' });
		expect(one(markup, 'dialog').attrs.closedby).toBeUndefined();
		expect(one(markup, 'button').attrs['aria-label']).toBe('Schließen');
	});

	it('Modal renders its description (referenced by the dialog) and its footer', () => {
		const markup = html(Modal, { title: 'T', description: 'About', footer: snippet('<button type="button">OK</button>') });
		expect(one(markup, 'dialog').attrs['aria-describedby']).toBe(one(markup, 'p').attrs.id);
		expect(tags(markup, 'footer')).toHaveLength(1);
		expect(text(markup)).toContain('About');
	});

	it('Drawer renders its footer', () => {
		const markup = html(Drawer, { title: 'T', footer: snippet('<button type="button">OK</button>') });
		expect(tags(markup, 'footer')).toHaveLength(1);
		expect(text(markup)).toContain('OK');
	});
});
