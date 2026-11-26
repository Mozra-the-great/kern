/**
 * Popover and Tooltip: the non-modal disclosure dialog (trigger ARIA, `bind:open`, `ontoggle` only for user
 * actions, focus into the panel and back, Escape, outside pointer, focus leaving) and the tooltip (description
 * wiring of the trigger, shown on hover and focus, Escape, `aria-description` for triggers in another root).
 */
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { createRawSnippet } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Popover from '../../src/lib/components/Popover.svelte';
import Tooltip from '../../src/lib/components/Tooltip.svelte';
import { triggerResize } from './env.js';
import { flush, textSnippet } from './helpers.js';
import { reactive } from './reactive.svelte.js';

/** jsdom has no layout; without client rects nothing counts as tabbable for `focusFirstIn`. */
function visibleRects(): void {
	vi.spyOn(Element.prototype, 'getClientRects').mockImplementation(() => [{}] as unknown as DOMRectList);
}

const panelContent = createRawSnippet(() => ({ render: () => '<div><button type="button">Inside</button></div>' }));

/** Elements a test adds next to the component; removed after each test, also when it fails. */
const extras: HTMLElement[] = [];
function outsideButton(name: string): HTMLButtonElement {
	const el = document.createElement('button');
	el.textContent = name;
	document.body.append(el);
	extras.push(el);
	return el;
}

afterEach(() => {
	vi.restoreAllMocks();
	for (const el of extras.splice(0)) el.remove();
});

describe('Popover: a scrolling panel without tabbable content (#132)', () => {
	function layout(el: Element, scrollHeight: number, clientHeight: number): void {
		(el as HTMLElement).style.overflow = 'auto'; // jsdom has no UA stylesheet: the box is a scroller
		Object.defineProperty(el, 'scrollHeight', { configurable: true, value: scrollHeight });
		Object.defineProperty(el, 'clientHeight', { configurable: true, value: clientHeight });
	}

	it('is a tab stop while it overflows and holds only text, and not otherwise', async () => {
		const text = createRawSnippet(() => ({ render: () => '<p>Only text</p>' }));
		render(Popover, { label: 'Filters', open: true, children: text });
		const panel = screen.getByRole('dialog', { name: 'Filters' });
		expect(panel.getAttribute('tabindex')).toBe('-1');
		layout(panel, 900, 300);
		triggerResize(panel);
		await vi.waitFor(() => expect(panel.getAttribute('tabindex')).toBe('0'));
		layout(panel, 300, 300);
		triggerResize(panel);
		await vi.waitFor(() => expect(panel.getAttribute('tabindex')).toBe('-1'));
	});

	it('is no extra stop next to a button in the panel', async () => {
		render(Popover, { label: 'Filters', open: true, children: panelContent });
		const panel = screen.getByRole('dialog', { name: 'Filters' });
		layout(panel, 900, 300);
		triggerResize(panel);
		await flush();
		expect(panel.getAttribute('tabindex')).toBe('-1');
	});
});

describe('Popover', () => {
	it('renders a closed disclosure trigger with the label as its text', () => {
		render(Popover, { label: 'Filters', children: textSnippet('Body') });
		const trigger = screen.getByRole('button', { name: 'Filters' });
		expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');
		expect(trigger.getAttribute('aria-expanded')).toBe('false');
		expect(trigger.dataset.variant).toBe('secondary');
		expect(trigger.hasAttribute('aria-label')).toBe(false);
		expect(trigger.querySelector('svg')).not.toBeNull();
		expect(screen.queryByRole('dialog')).toBeNull();
	});

	it('takes a custom trigger, variant, placement and class; the label stays the name', async () => {
		const user = userEvent.setup();
		const { container } = render(Popover, {
			label: 'Settings',
			trigger: textSnippet('*'),
			triggerVariant: 'ghost',
			placement: 'top-end',
			class: 'mine',
			children: textSnippet('Body')
		});
		const trigger = screen.getByRole('button', { name: 'Settings' });
		expect(trigger.getAttribute('aria-label')).toBe('Settings');
		expect(trigger.dataset.variant).toBe('ghost');
		expect(trigger.textContent).toBe('*');
		expect(container.querySelector('.k-popover.mine')).not.toBeNull();
		await user.click(trigger);
		expect(screen.getByRole('dialog', { name: 'Settings' }).dataset.placement).toMatch(/-end$/);
	});

	it('opens on click, focuses the first control in the panel and closes again with focus on the trigger', async () => {
		visibleRects();
		const user = userEvent.setup();
		const ontoggle = vi.fn();
		const props = reactive<{ label: string; open?: boolean | undefined; ontoggle: (open: boolean) => void; children: typeof panelContent }>(
			{
				label: 'Filters',
				open: false,
				ontoggle,
				children: panelContent
			}
		);
		render(Popover, { props });
		const trigger = screen.getByRole('button', { name: 'Filters' });
		await user.click(trigger);
		const panel = screen.getByRole('dialog', { name: 'Filters' });
		expect(trigger.getAttribute('aria-expanded')).toBe('true');
		expect(trigger.getAttribute('aria-controls')).toBe(panel.id);
		expect(props.open).toBe(true);
		expect(ontoggle).toHaveBeenLastCalledWith(true);
		await vi.waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Inside' })));
		await user.click(trigger);
		expect(screen.queryByRole('dialog')).toBeNull();
		expect(props.open).toBe(false);
		expect(ontoggle).toHaveBeenLastCalledWith(false);
		expect(document.activeElement).toBe(trigger);
	});

	it('focuses the panel itself when it holds nothing tabbable', async () => {
		const user = userEvent.setup();
		render(Popover, { label: 'Info', children: textSnippet('Just text') });
		await user.click(screen.getByRole('button', { name: 'Info' }));
		await vi.waitFor(() => expect(document.activeElement).toBe(screen.getByRole('dialog')));
	});

	it('Escape in the panel closes it and returns focus', async () => {
		const user = userEvent.setup();
		const ontoggle = vi.fn();
		render(Popover, { label: 'Info', ontoggle, children: textSnippet('Text') });
		const trigger = screen.getByRole('button', { name: 'Info' });
		await user.click(trigger);
		await vi.waitFor(() => expect(document.activeElement).toBe(screen.getByRole('dialog')));
		await user.keyboard('{Shift>}a{/Shift}');
		expect(screen.getByRole('dialog')).toBeTruthy();
		await user.keyboard('{Escape}');
		expect(screen.queryByRole('dialog')).toBeNull();
		expect(document.activeElement).toBe(trigger);
		expect(ontoggle).toHaveBeenCalledTimes(2);
	});

	it('Escape on the trigger closes an open panel, other keys and a closed panel do nothing', async () => {
		const user = userEvent.setup();
		const ontoggle = vi.fn();
		render(Popover, { label: 'Info', ontoggle, children: textSnippet('Text') });
		const trigger = screen.getByRole('button', { name: 'Info' });
		trigger.focus();
		await user.keyboard('{Escape}');
		expect(ontoggle).not.toHaveBeenCalled();
		await user.click(trigger);
		trigger.focus();
		await user.keyboard('x');
		expect(screen.getByRole('dialog')).toBeTruthy();
		await user.keyboard('{Escape}');
		expect(screen.queryByRole('dialog')).toBeNull();
		expect(ontoggle).toHaveBeenLastCalledWith(false);
	});

	it('closes quietly on a pointer down outside, not inside', async () => {
		const user = userEvent.setup();
		const ontoggle = vi.fn();
		render(Popover, { label: 'Info', ontoggle, children: textSnippet('Text') });
		const outside = outsideButton('Outside');
		await user.click(screen.getByRole('button', { name: 'Info' }));
		await user.pointer({ keys: '[MouseLeft]', target: screen.getByRole('dialog') });
		expect(screen.getByRole('dialog')).toBeTruthy();
		await user.pointer({ keys: '[MouseLeft]', target: outside });
		expect(screen.queryByRole('dialog')).toBeNull();
		expect(ontoggle).toHaveBeenLastCalledWith(false);
		// A pointer down while closed changes nothing.
		await user.pointer({ keys: '[MouseLeft]', target: outside });
		expect(ontoggle).toHaveBeenCalledTimes(2);
	});

	it('closes when focus leaves panel and trigger, stays open while it moves inside or to nowhere', async () => {
		visibleRects();
		const user = userEvent.setup();
		render(Popover, { label: 'Filters', children: panelContent });
		const after = outsideButton('After');
		const trigger = screen.getByRole('button', { name: 'Filters' });
		await user.click(trigger);
		const inside = screen.getByRole('button', { name: 'Inside' });
		await vi.waitFor(() => expect(document.activeElement).toBe(inside));
		const panel = screen.getByRole('dialog');
		panel.focus();
		expect(screen.getByRole('dialog')).toBeTruthy();
		inside.focus();
		trigger.focus();
		expect(screen.getByRole('dialog')).toBeTruthy();
		inside.focus();
		inside.blur();
		expect(screen.getByRole('dialog')).toBeTruthy();
		inside.focus();
		after.focus();
		await vi.waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
		expect(document.activeElement).toBe(after);
	});

	it('a pointer down outside followed by the focus moving there closes once', async () => {
		const user = userEvent.setup();
		const ontoggle = vi.fn();
		render(Popover, { label: 'Info', ontoggle, children: textSnippet('Text') });
		const outside = outsideButton('Outside');
		await user.click(screen.getByRole('button', { name: 'Info' }));
		const panel = screen.getByRole('dialog');
		await vi.waitFor(() => expect(document.activeElement).toBe(panel));
		// Same task, like a real click: pointerdown closes, then the focus leaves the (still mounted) panel.
		outside.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
		outside.focus();
		await vi.waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
		expect(ontoggle.mock.calls).toEqual([[true], [false]]);
	});

	it('renders no class for a null class from an untyped consumer', () => {
		const { container } = render(Popover, { label: 'Info', class: null as unknown as string });
		expect(container.querySelector('.k-popover')?.className).not.toContain('null');
	});

	it('opening from outside shows the panel without calling ontoggle', async () => {
		const ontoggle = vi.fn();
		const props = reactive<{ label: string; open?: boolean | undefined; ontoggle: (open: boolean) => void }>({ label: 'Info', ontoggle });
		render(Popover, { props });
		props.open = true;
		await vi.waitFor(() => expect(screen.getByRole('dialog', { name: 'Info' })).toBeTruthy());
		props.open = false;
		await vi.waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
		await flush();
		expect(ontoggle).not.toHaveBeenCalled();
	});
});

describe('Tooltip', () => {
	const button = createRawSnippet(() => ({ render: () => '<button type="button">Save</button>' }));
	const described = createRawSnippet(() => ({ render: () => '<button type="button" aria-describedby="own">Save</button>' }));

	it('describes the trigger and is hidden until hover or focus', async () => {
		const user = userEvent.setup();
		const { container } = render(Tooltip, { text: 'Saves the draft', children: button });
		const trigger = screen.getByRole('button', { name: 'Save' });
		const tip = screen.getByRole('tooltip', { hidden: true });
		expect(trigger.getAttribute('aria-describedby')).toBe(tip.id);
		expect(tip.textContent).toBe('Saves the draft');
		expect(tip.dataset.placement).toBe('top');
		expect(tip.classList.contains('shown')).toBe(false);
		const wrap = container.querySelector<HTMLElement>('.k-tooltip');
		await user.hover(wrap as HTMLElement);
		expect(tip.classList.contains('shown')).toBe(true);
		await user.unhover(wrap as HTMLElement);
		expect(tip.classList.contains('shown')).toBe(false);
	});

	it('shows on focus, hides on Escape and blur; other keys keep it', async () => {
		const user = userEvent.setup();
		render(Tooltip, { text: 'Tip', placement: 'right', class: 'x', children: button });
		const tip = screen.getByRole('tooltip', { hidden: true });
		expect(tip.dataset.placement).toBe('right');
		await user.tab();
		expect(tip.classList.contains('shown')).toBe(true);
		// Same root: no aria-description is needed, the id reference works.
		expect(screen.getByRole('button').hasAttribute('aria-description')).toBe(false);
		await user.keyboard('a');
		expect(tip.classList.contains('shown')).toBe(true);
		await user.keyboard('{Escape}');
		expect(tip.classList.contains('shown')).toBe(false);
		await user.tab({ shift: true });
		await user.tab();
		expect(tip.classList.contains('shown')).toBe(true);
		await user.tab();
		expect(tip.classList.contains('shown')).toBe(false);
	});

	it('keeps an existing description and restores it on unmount', () => {
		const { unmount } = render(Tooltip, { text: 'Tip', children: described });
		const trigger = screen.getByRole('button');
		const tip = screen.getByRole('tooltip', { hidden: true });
		expect(trigger.getAttribute('aria-describedby')).toBe(`own ${tip.id}`);
		unmount();
		expect(trigger.getAttribute('aria-describedby')).toBe('own');
	});

	it('removes its description from the trigger on unmount', () => {
		const { unmount } = render(Tooltip, { text: 'Tip', children: button });
		const trigger = screen.getByRole('button');
		unmount();
		expect(trigger.hasAttribute('aria-describedby')).toBe(false);
	});

	it('renders no class for a null class from an untyped consumer', () => {
		const { container } = render(Tooltip, { text: 'Tip', class: null as unknown as string, children: button });
		expect(container.querySelector('.k-tooltip')?.className).not.toContain('null');
	});

	it('does nothing to wire when the content has no focusable trigger', () => {
		render(Tooltip, { text: 'Tip', children: textSnippet('plain') });
		expect(screen.getByRole('tooltip', { hidden: true }).textContent).toBe('Tip');
	});

	it('gives a trigger in another root aria-description while it has focus', async () => {
		const host = createRawSnippet(() => ({ render: () => '<span class="host"></span>' }));
		const { unmount } = render(Tooltip, { text: 'Shadow tip', children: host });
		const hostEl = document.querySelector('.host') as HTMLElement;
		const shadow = hostEl.attachShadow({ mode: 'open' });
		const inner = document.createElement('button');
		inner.textContent = 'Inner';
		const marked = document.createElement('button');
		marked.setAttribute('aria-description', 'own');
		shadow.append(inner, marked);
		const tip = screen.getByRole('tooltip', { hidden: true });

		inner.focus();
		expect(inner.getAttribute('aria-description')).toBe('Shadow tip');
		await vi.waitFor(() => expect(tip.classList.contains('shown')).toBe(true));
		inner.blur();
		expect(inner.hasAttribute('aria-description')).toBe(false);
		await vi.waitFor(() => expect(tip.classList.contains('shown')).toBe(false));

		// A trigger that already has a description keeps it.
		marked.focus();
		expect(marked.getAttribute('aria-description')).toBe('own');
		marked.blur();
		expect(marked.getAttribute('aria-description')).toBe('own');

		// Unmounting while focused removes the description too.
		inner.focus();
		const kept = inner;
		unmount();
		expect(kept.hasAttribute('aria-description')).toBe(false);
	});
});
