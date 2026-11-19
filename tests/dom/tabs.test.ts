/**
 * Tabs, TabLinks and the tab badge (stuffcloud: tabs-cards.test.ts "Tabs" / "TabLinks", tabs-nav.test.ts).
 * stuffcloud's `nextTabIndex` helper lives inside kern's Tabs, so its cases run through the keyboard here.
 */
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import TabLinks, { type TabLinkItem } from '../../src/lib/components/TabLinks.svelte';
import Tabs, { type TabItem } from '../../src/lib/components/Tabs.svelte';
import { mapSnippet } from './helpers.js';
import { reactive } from './reactive.svelte.js';

const tabs: TabItem[] = [
	{ id: 'json', label: 'JSON' },
	{ id: 'yaml', label: 'YAML' },
	{ id: 'xml', label: 'XML' }
];
const panel = mapSnippet<string>((id) => `panel: ${id}`);

function selectedTab(): string | undefined {
	return screen
		.getAllByRole('tab')
		.find((tab) => tab.getAttribute('aria-selected') === 'true')
		?.textContent.trim();
}

describe('Tabs', () => {
	it('renders a named tablist with the first tab selected by default', () => {
		render(Tabs, { tabs, label: 'Formats', panel });
		expect(screen.getByRole('tablist', { name: 'Formats' })).toBeTruthy();
		expect(screen.getAllByRole('tab').map((tab) => tab.textContent.trim())).toEqual(['JSON', 'YAML', 'XML']);
		expect(selectedTab()).toBe('JSON');
	});

	it('shows only the panel of the selected tab, wired to its tab both ways', () => {
		render(Tabs, { tabs, label: 'Formats', value: 'yaml', panel });
		const tabpanel = screen.getByRole('tabpanel');
		expect(tabpanel.textContent.trim()).toBe('panel: yaml');
		const tab = screen.getByRole('tab', { name: 'YAML' });
		expect(tabpanel.getAttribute('aria-labelledby')).toBe(tab.id);
		expect(tab.getAttribute('aria-controls')).toBe(tabpanel.id);
		expect(screen.queryByText('panel: json')).toBeNull();
		// The panel is focusable so keyboard users can reach scrolling content.
		expect(tabpanel.getAttribute('tabindex')).toBe('0');
	});

	it('falls back to the first tab when nothing is selected', () => {
		render(Tabs, { tabs, label: 'Formats', panel });
		expect(screen.getByRole('tabpanel').textContent.trim()).toBe('panel: json');
	});

	it('only the selected tab is in the tab order (roving tabindex)', () => {
		render(Tabs, { tabs, label: 'Formats', value: 'yaml', panel });
		expect(screen.getAllByRole('tab').map((tab) => tab.getAttribute('tabindex'))).toEqual(['-1', '0', '-1']);
	});

	it('follows `value` set from outside without calling onchange', async () => {
		const onchange = vi.fn();
		const props = reactive<{ tabs: TabItem[]; label: string; value: string; onchange: (id: string) => void }>({
			tabs,
			label: 'Formats',
			value: 'json',
			onchange
		});
		render(Tabs, { props });
		props.value = 'xml';
		await vi.waitFor(() => expect(selectedTab()).toBe('XML'));
		expect(onchange).not.toHaveBeenCalled();
	});

	it('selects a tab by click, updates the bound value and reports the change once', async () => {
		const user = userEvent.setup();
		const onchange = vi.fn();
		const props = reactive<{ tabs: TabItem[]; label: string; value: string | undefined; onchange: (id: string) => void }>({
			tabs,
			label: 'Formats',
			value: undefined,
			onchange
		});
		render(Tabs, { props });
		await user.click(screen.getByRole('tab', { name: 'XML' }));
		expect(props.value).toBe('xml');
		expect(selectedTab()).toBe('XML');
		expect(onchange).toHaveBeenCalledExactlyOnceWith('xml');
		await user.click(screen.getByRole('tab', { name: 'XML' }));
		expect(onchange).toHaveBeenCalledTimes(1);
	});

	it('moves with the arrow keys, wrapping at both ends, and focuses the new tab', async () => {
		const user = userEvent.setup();
		const onchange = vi.fn();
		render(Tabs, { tabs, label: 'Formats', panel, onchange });
		await user.tab();
		expect(document.activeElement?.textContent.trim()).toBe('JSON');

		await user.keyboard('{ArrowRight}');
		expect(selectedTab()).toBe('YAML');
		expect(document.activeElement?.textContent.trim()).toBe('YAML');

		await user.keyboard('{ArrowRight}{ArrowRight}');
		expect(selectedTab()).toBe('JSON');

		await user.keyboard('{ArrowLeft}');
		expect(selectedTab()).toBe('XML');
		await user.keyboard('{ArrowLeft}');
		expect(selectedTab()).toBe('YAML');
		expect(onchange).toHaveBeenLastCalledWith('yaml');
	});

	it('jumps with Home and End and ignores every other key', async () => {
		const user = userEvent.setup();
		render(Tabs, { tabs, label: 'Formats', value: 'yaml', panel });
		await user.tab();
		await user.keyboard('{End}');
		expect(selectedTab()).toBe('XML');
		await user.keyboard('{Home}');
		expect(selectedTab()).toBe('JSON');
		for (const key of ['{ArrowUp}', '{ArrowDown}', '{Enter}', 'a']) await user.keyboard(key);
		expect(selectedTab()).toBe('JSON');
	});

	it('a single tab stays put on every navigation key', async () => {
		const user = userEvent.setup();
		const onchange = vi.fn();
		render(Tabs, { tabs: [{ id: 'one', label: 'One' }], label: 'Single', onchange });
		await user.tab();
		await user.keyboard('{ArrowRight}{ArrowLeft}{End}{Home}');
		expect(selectedTab()).toBe('One');
		expect(onchange).not.toHaveBeenCalled();
	});

	it('skips disabled and hidden tabs with the arrow keys, and renders no hidden tab', async () => {
		const user = userEvent.setup();
		const items: TabItem[] = [
			{ id: 'a', label: 'A' },
			{ id: 'b', label: 'B', disabled: true },
			{ id: 'c', label: 'C', hidden: true },
			{ id: 'd', label: 'D' }
		];
		render(Tabs, { tabs: items, label: 'Mixed' });
		expect(screen.getAllByRole('tab').map((tab) => tab.textContent.trim())).toEqual(['A', 'B', 'D']);
		expect(screen.getByRole<HTMLButtonElement>('tab', { name: 'B' }).disabled).toBe(true);
		await user.tab();
		await user.keyboard('{ArrowRight}');
		expect(selectedTab()).toBe('D');
		await user.keyboard('{ArrowRight}');
		expect(selectedTab()).toBe('A');
		await user.keyboard('{ArrowLeft}');
		expect(selectedTab()).toBe('D');
	});

	it('keeps a usable tab in the tab order when the selected one is disabled', () => {
		const items: TabItem[] = [
			{ id: 'a', label: 'A', disabled: true },
			{ id: 'b', label: 'B' }
		];
		render(Tabs, { tabs: items, label: 'Mixed', value: 'a' });
		expect(screen.getAllByRole('tab').map((tab) => tab.getAttribute('tabindex'))).toEqual(['-1', '0']);
	});

	it('renders the empty tablist for no tabs and ignores the keyboard', async () => {
		const user = userEvent.setup();
		render(Tabs, { tabs: [], label: 'Empty', panel });
		expect(screen.getByRole('tablist').children).toHaveLength(0);
		await user.click(screen.getByRole('tablist'));
		await user.keyboard('{ArrowRight}{Home}');
		expect(screen.queryAllByRole('tab')).toHaveLength(0);
	});

	it('without a panel it is only the tab bar and points aria-controls at the page region', () => {
		render(Tabs, {
			tabs: [
				{ id: 'a', label: 'A', controls: 'main' },
				{ id: 'b', label: 'B' }
			],
			label: 'Pages'
		});
		expect(screen.queryByRole('tabpanel')).toBeNull();
		const [a, b] = screen.getAllByRole('tab');
		expect(a?.getAttribute('aria-controls')).toBe('main');
		expect(b?.hasAttribute('aria-controls')).toBe(false);
	});

	it('speaks the badge after the label and hides the badge itself from assistive technology', () => {
		render(Tabs, {
			tabs: [
				{ id: 'inbox', label: 'Inbox', badge: 3, badgeLabel: '3 unread', badgeTone: 'danger' },
				{ id: 'sync', label: 'Sync', dot: true },
				{ id: 'plain', label: 'Plain' },
				{ id: 'count', label: 'Count', badge: 7 }
			],
			label: 'Mail'
		});
		expect(screen.getByRole('tab', { name: 'Inbox 3 unread' })).toBeTruthy();
		expect(screen.getByRole('tab', { name: 'Count 7' })).toBeTruthy();
		expect(screen.getByRole('tab', { name: 'Sync' }).querySelector('.k-tab-dot')?.getAttribute('aria-hidden')).toBe('true');
		const badge = screen.getByRole('tab', { name: 'Inbox 3 unread' }).querySelector('.k-tab-badge');
		expect(badge?.getAttribute('aria-hidden')).toBe('true');
		expect(badge?.getAttribute('data-tone')).toBe('danger');
		expect(screen.getByRole('tab', { name: 'Plain' }).querySelector('.k-tab-badge, .k-tab-dot')).toBeNull();
	});

	it('switches the look with data-look', () => {
		const { container } = render(Tabs, { tabs, label: 'Formats', look: 'pill' });
		expect(container.querySelector('.k-tabs')?.getAttribute('data-look')).toBe('pill');
	});
});

describe('TabLinks', () => {
	const links: TabLinkItem[] = [
		{ href: '#convert', label: 'Convert', current: true },
		{ href: '#base64', label: 'Base64' },
		{ href: '#units', label: 'Units', current: false }
	];

	it('renders a navigation landmark with plain links in tab order (no tablist roles)', async () => {
		const user = userEvent.setup();
		render(TabLinks, { links, label: 'Convert tools' });
		const nav = screen.getByRole('navigation', { name: 'Convert tools' });
		expect(nav.querySelectorAll('a')).toHaveLength(3);
		expect(screen.queryByRole('tablist')).toBeNull();
		expect(screen.getByRole('link', { name: 'Base64' }).getAttribute('href')).toBe('#base64');
		await user.tab();
		expect(document.activeElement?.textContent.trim()).toBe('Convert');
		await user.tab();
		expect(document.activeElement?.textContent.trim()).toBe('Base64');
	});

	it('marks only the current page with aria-current', () => {
		render(TabLinks, { links, label: 'Convert tools' });
		expect(screen.getByRole('link', { name: 'Convert' }).getAttribute('aria-current')).toBe('page');
		expect(screen.getByRole('link', { name: 'Base64' }).getAttribute('aria-current')).toBeNull();
		expect(screen.getByRole('link', { name: 'Units' }).getAttribute('aria-current')).toBeNull();
	});

	it('reports a plain primary click and lets the app route it; modified clicks pass through', async () => {
		const user = userEvent.setup();
		const onnavigate = vi.fn((_link: TabLinkItem, event: MouseEvent) => event.preventDefault());
		render(TabLinks, { links, label: 'Convert tools', onnavigate });
		await user.click(screen.getByRole('link', { name: 'Base64' }));
		expect(onnavigate).toHaveBeenCalledTimes(1);
		expect(onnavigate.mock.calls[0]?.[0]).toEqual({ href: '#base64', label: 'Base64' });
		await user.keyboard('{Control>}');
		await user.click(screen.getByRole('link', { name: 'Units' }));
		await user.keyboard('{/Control}');
		await user.keyboard('{Shift>}');
		await user.click(screen.getByRole('link', { name: 'Units' }));
		await user.keyboard('{/Shift}');
		expect(onnavigate).toHaveBeenCalledTimes(1);
	});

	it('ignores a non-primary mouse button', async () => {
		const user = userEvent.setup();
		const onnavigate = vi.fn();
		render(TabLinks, { links, label: 'Convert tools', onnavigate });
		await user.pointer({ keys: '[MouseRight]', target: screen.getByRole('link', { name: 'Base64' }) });
		expect(onnavigate).not.toHaveBeenCalled();
	});

	it('speaks a badge after the label like Tabs does', () => {
		render(TabLinks, {
			links: [
				{ href: '/inbox', label: 'Inbox', badge: 2, badgeLabel: '2 unread' },
				{ href: '/x', label: 'Alerts', dot: true, badgeLabel: 'Sync error' }
			],
			label: 'Mail'
		});
		expect(screen.getByRole('link', { name: 'Inbox 2 unread' })).toBeTruthy();
		expect(screen.getByRole('link', { name: 'Alerts Sync error' })).toBeTruthy();
	});
});
