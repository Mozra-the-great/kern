/**
 * Smoke test of every component exported from src/lib/index.ts: it renders with minimal props in jsdom,
 * produces its root element and, where the component needs one, an accessible name, and logs no error or
 * warning (Svelte reports its own warnings through console.warn), and it unmounts cleanly.
 *
 * The table below is the contract: a new component export without an entry fails `every export has an
 * entry`, an entry without an export fails the next test. Behaviour lives in the per-component files
 * next to this one; this file only guarantees that nothing in the public API fails to mount.
 */
import { render, screen } from '@testing-library/svelte';
import type { Component } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import * as kern from '../../src/lib/index.js';
import { mapSnippet, mapSnippet2, textSnippet } from './helpers.js';

interface Smoke {
	/** Minimal props. */
	props?: Record<string, unknown>;
	/** CSS selector of the root element; it must exist after render. */
	root: string;
	/** An element the component must expose to assistive technology: ARIA role and accessible name. */
	role?: { role: string; name: string | RegExp };
}

const items = [
	{ id: 'a', label: 'Alpha', title: 'Alpha' },
	{ id: 'b', label: 'Beta', title: 'Beta' }
];
const ok = { props: { children: textSnippet('Content') } };

const SMOKE: Record<string, Smoke> = {
	Accordion: { props: { items: [{ id: 'a', title: 'One' }], content: mapSnippet<string>((id) => `body ${id}`) }, root: '.k-accordion', role: { role: 'group', name: /.*/ } },
	AccordionItem: { props: { title: 'One', children: textSnippet('Body') }, root: '.k-accordion-item', role: { role: 'group', name: /.*/ } },
	Alert: { props: { title: 'Heads up', children: textSnippet('Body') }, root: '.k-alert', role: { role: 'status', name: /.*/ } },
	Avatar: { props: { name: 'Ada Lovelace' }, root: '.k-avatar', role: { role: 'img', name: 'Ada Lovelace' } },
	Badge: { ...ok, root: '.k-badge' },
	Breadcrumb: { props: { items: [{ label: 'Home', href: '/' }, { label: 'Page' }] }, root: '.k-breadcrumb', role: { role: 'navigation', name: /.+/ } },
	Button: { props: { children: textSnippet('Save') }, root: 'button.k-button', role: { role: 'button', name: 'Save' } },
	Card: { props: { title: 'Card title', children: textSnippet('Body') }, root: '.k-card', role: { role: 'heading', name: 'Card title' } },
	Caret: { root: '.k-caret' },
	Carousel: { props: { items: [1, 2, 3], label: 'Gallery', slide: mapSnippet2<number, number>((n, i) => `slide ${n} at ${i}`) }, root: '.k-carousel', role: { role: 'region', name: 'Gallery' } },
	Checkbox: { props: { label: 'Accept' }, root: '.k-check', role: { role: 'checkbox', name: 'Accept' } },
	Code: { props: { code: 'const a = 1;' }, root: '.k-code' },
	CodeBlock: { props: { code: 'const a = 1;', label: 'Snippet' }, root: '.k-code-block' },
	Collapsible: { props: { label: 'More', children: textSnippet('Hidden') }, root: '.k-collapsible', role: { role: 'button', name: /More/ } },
	ColorPicker: { props: { label: 'Colour', value: '#336699' }, root: '.k-color' },
	Combobox: { props: { label: 'Fruit', options: [{ value: 'a', label: 'Apple' }] }, root: '.k-combobox', role: { role: 'combobox', name: 'Fruit' } },
	CommandPalette: { props: { commands: [{ id: 'go', label: 'Go' }] }, root: '.k-command-palette' },
	ContextMenu: { props: { items: [{ id: 'a', label: 'Copy' }], children: textSnippet('Area') }, root: '.k-context-area' },
	CopyButton: { props: { text: 'copy me' }, root: '.k-copy-button', role: { role: 'button', name: /.+/ } },
	CountUp: { props: { value: 5 }, root: '.k-countup' },
	DataTable: { props: { caption: 'People', columns: [{ key: 'name', label: 'Name' }], rows: [{ name: 'Ada' }] }, root: '.k-datatable', role: { role: 'table', name: 'People' } },
	DatePicker: { props: { label: 'Date' }, root: '.k-date', role: { role: 'textbox', name: /Date/ } },
	Divider: { root: '.k-divider' },
	Drawer: { props: { title: 'Menu' }, root: '.k-drawer' },
	DropdownMenu: { props: { label: 'Actions', items: [{ id: 'a', label: 'Open' }] }, root: '.k-dropdown', role: { role: 'button', name: 'Actions' } },
	EmptyState: { props: { title: 'Nothing here' }, root: '.k-empty' },
	Field: { props: { label: 'Name', children: mapSnippet<unknown>(() => 'control') }, root: '.k-field' },
	FileDrop: { props: { label: 'Upload' }, root: '.k-filedrop' },
	GridBackground: { root: '.k-grid-bg' },
	Heatmap: { props: { label: 'Activity', data: [{ date: '2026-01-01', value: 3 }] }, root: '.k-heatmap', role: { role: 'grid', name: /Activity/ } },
	Highlight: { ...ok, root: '.k-highlight' },
	HistoryBar: { props: { label: 'Uptime', items: [{ label: 'Mon', status: 'ok' }] }, root: '.k-history' },
	IconButton: { props: { label: 'Close' }, root: '.k-icon-button', role: { role: 'button', name: 'Close' } },
	Input: { props: { label: 'Email' }, root: '.k-input', role: { role: 'textbox', name: 'Email' } },
	Kbd: { ...ok, root: '.k-kbd' },
	Label: { ...ok, root: '.k-label' },
	Link: { props: { href: '/docs', children: textSnippet('Docs') }, root: 'a.k-link', role: { role: 'link', name: 'Docs' } },
	LiveAnnouncer: { root: '.k-live-announcer' },
	Marquee: { props: { children: textSnippet('News'), label: 'Ticker' }, root: '.k-marquee' },
	Mascot: { props: { name: 'stuffy', base: '/assets/code', label: 'Mascot' }, root: '.k-mascot', role: { role: 'img', name: 'Mascot' } },
	Modal: { props: { title: 'Confirm' }, root: '.k-modal' },
	Navbar: { props: { items: [{ label: 'Home', href: '/', current: true }] }, root: '.k-navbar', role: { role: 'link', name: 'Home' } },
	NumberInput: { props: { label: 'Amount' }, root: '.k-number', role: { role: 'spinbutton', name: 'Amount' } },
	Odometer: { props: { value: 42 }, root: '.k-odometer' },
	OnlineStatus: { root: '.k-online-status' },
	Pagination: { props: { pageCount: 5 }, root: '.k-pagination', role: { role: 'navigation', name: /.+/ } },
	PinInput: { props: { label: 'Code', length: 4 }, root: '.k-pin' },
	Popover: { props: { label: 'Info', children: textSnippet('Details') }, root: '.k-popover', role: { role: 'button', name: 'Info' } },
	Progress: { props: { label: 'Upload', value: 40 }, root: '.k-progress', role: { role: 'progressbar', name: 'Upload' } },
	ProgressRing: { props: { label: 'Sync', value: 40 }, root: '.k-progress-ring', role: { role: 'progressbar', name: 'Sync' } },
	Prose: { props: { text: 'One\n\nTwo' }, root: '.k-prose' },
	RadioGroup: { props: { label: 'Size', options: [{ value: 's', label: 'Small' }, { value: 'm', label: 'Medium' }] }, root: '.k-radio-group', role: { role: 'radio', name: 'Small' } },
	Rating: { props: { label: 'Rating', value: 3 }, root: '.k-rating' },
	RelativeTime: { props: { value: new Date('2026-01-01T00:00:00Z') }, root: '.k-relative-time' },
	Resizable: { props: { panels: [{ id: 'l' }, { id: 'r' }], panel: mapSnippet2<{ id: string }, number>((p) => p.id) }, root: '.k-resizable' },
	Reveal: { ...ok, root: '.k-reveal' },
	Scramble: { props: { text: 'Hello' }, root: '.k-scramble' },
	ScrollArea: { ...ok, root: '.k-scroll-area' },
	SegmentedControl: { props: { label: 'View', options: [{ value: 'a', label: 'List' }, { value: 'b', label: 'Grid' }] }, root: '.k-segmented' },
	Select: { props: { label: 'Country', options: [{ value: 'de', label: 'Germany' }] }, root: '.k-select', role: { role: 'combobox', name: 'Country' } },
	SelectGrid: { props: { items: items, label: 'Pick', key: (i: { id: string }) => i.id, itemLabel: (i: { label: string }) => i.label }, root: '.k-select-grid' },
	Skeleton: { root: '.k-skeleton' },
	SkipLink: { props: { target: 'main', label: 'Skip to content' }, root: '.k-skip-link', role: { role: 'link', name: 'Skip to content' } },
	Slider: { props: { label: 'Volume' }, root: '.k-slider', role: { role: 'slider', name: 'Volume' } },
	SortableList: { props: { items: items, label: 'Order', key: (i: { id: string }) => i.id, itemLabel: (i: { label: string }) => i.label }, root: '.k-sortable-list' },
	Sparkline: { props: { values: [1, 3, 2, 5] }, root: '.k-sparkline' },
	Spinner: { root: '.k-spinner', role: { role: 'status', name: /.*/ } },
	Stat: { props: { label: 'Users', value: 12 }, root: '.k-stat' },
	StatusDot: { props: { status: 'ok' }, root: '.k-status-dot' },
	StatusMessage: { props: { children: textSnippet('Saved') }, root: '.k-status-message' },
	Stepper: { props: { steps: items, current: 0 }, root: '.k-stepper', role: { role: 'navigation', name: /.+/ } },
	Switch: { props: { label: 'Notifications' }, root: '.k-switch', role: { role: 'switch', name: 'Notifications' } },
	TabLinks: { props: { label: 'Sections', links: [{ href: '/a', label: 'A', current: true }, { href: '/b', label: 'B' }] }, root: '.k-tab-links', role: { role: 'navigation', name: 'Sections' } },
	Table: { props: { columns: [{ key: 'name', label: 'Name' }], rows: [{ name: 'Ada' }] }, root: '.k-table', role: { role: 'table', name: /.*/ } },
	Tabs: { props: { tabs: items }, root: '.k-tabs', role: { role: 'tab', name: 'Alpha' } },
	Tag: { ...ok, root: '.k-tag' },
	TagInput: { props: { label: 'Tags' }, root: '.k-tags' },
	Terminal: { props: { lines: [{ text: 'ls' }] }, root: '.k-terminal' },
	Textarea: { props: { label: 'Message' }, root: '.k-textarea', role: { role: 'textbox', name: 'Message' } },
	ThemeToggle: { props: { themes: [{ id: 'light', label: 'Light' }, { id: 'dark', label: 'Dark' }] }, root: '.k-theme-toggle' },
	Tile: { ...ok, root: '.k-tile' },
	TileGrid: { ...ok, root: '.k-tile-grid' },
	Timeline: { props: { items: [{ id: 'a', title: 'Created' }] }, root: '.k-timeline' },
	Toaster: { root: '.k-toaster' },
	Tooltip: { props: { text: 'Hint', children: textSnippet('Target') }, root: '.k-tooltip' },
	TreeView: { props: { nodes: [{ id: 'a', label: 'Root', children: [{ id: 'b', label: 'Leaf' }] }] }, root: '.k-tree', role: { role: 'tree', name: /.*/ } },
	Typewriter: { props: { text: 'Hello' }, root: '.k-typewriter' }
};

/** Component exports: Svelte compiles a component to a function; every other export is a lowercase function, a constant or a type. */
const componentExports = Object.entries(kern).filter(
	(entry): entry is [string, Component<Record<string, unknown>>] => typeof entry[1] === 'function' && /^[A-Z]/.test(entry[0])
);

describe('smoke: every exported component', () => {
	let errors: MockInstance<typeof console.error>;
	let warnings: MockInstance<typeof console.warn>;

	beforeEach(() => {
		errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
		warnings = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
	});
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('every export has an entry, and every entry an export', () => {
		const exported = componentExports.map(([name]) => name).sort();
		expect(Object.keys(SMOKE).sort()).toEqual(exported);
		expect(exported.length).toBeGreaterThan(80);
	});

	for (const [name, component] of componentExports) {
		const entry = SMOKE[name];
		if (!entry) continue;
		it(`${name} renders, exposes its root and unmounts without errors`, () => {
			const { container, unmount } = render(component, { props: entry.props ?? {} });
			expect(document.body.querySelector(entry.root), `root ${entry.root}`).not.toBeNull();
			expect(container.firstElementChild ?? document.body.querySelector(entry.root)).not.toBeNull();
			if (entry.role) {
				expect(screen.getAllByRole(entry.role.role, { name: entry.role.name, hidden: true }).length).toBeGreaterThan(0);
			}
			unmount();
			expect(errors).not.toHaveBeenCalled();
			expect(warnings).not.toHaveBeenCalled();
		});
	}
});
