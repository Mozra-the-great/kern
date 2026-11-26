/**
 * Keyboard access to the scrolling body of Drawer and Modal (#132, axe `scrollable-region-focusable`): a body that
 * overflows and holds nothing tabbable becomes a named tab stop, in every other case there is no extra stop, and it
 * follows the content. Also the helper behind it (scroll-region.ts): what counts as tabbable, shadow roots and slots,
 * what it observes, the cleanup. jsdom has no layout: the sizes of the scrolling box are set on the element and the
 * resize observer of env.ts is triggered by hand; DOM changes reach the real MutationObserver of jsdom.
 */
import { render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Drawer from '../../src/lib/components/Drawer.svelte';
import Modal from '../../src/lib/components/Modal.svelte';
import { de } from '../../src/lib/components/strings-de.js';
import { resetStrings, setStrings } from '../../src/lib/components/strings.js';
import { hasTabbable, watchScrollRegion } from '../../src/lib/components/scroll-region.js';
import { createRawSnippet } from 'svelte';
import { triggerResize } from './env.js';
import { flush } from './helpers.js';

afterEach(() => {
	resetStrings();
	vi.unstubAllGlobals();
	document.body.replaceChildren();
});

/** Gives an element the box sizes jsdom does not compute (and makes it a scroller: overflow `visible` spills instead of scrolling). */
function layout(el: Element, scrollHeight: number, clientHeight: number): void {
	(el as HTMLElement).style.overflow = 'auto'; // jsdom has no UA stylesheet: the box is a scroller
	Object.defineProperty(el, 'scrollHeight', { configurable: true, value: scrollHeight });
	Object.defineProperty(el, 'clientHeight', { configurable: true, value: clientHeight });
}

/** The element a selector finds, or a failure that names the selector. */
function find<T extends Element = HTMLElement>(root: ParentNode, selector: string): T {
	const el = root.querySelector<T>(selector);
	if (el === null) throw new Error(`nothing matches ${selector}`);
	return el;
}

function dialog(): HTMLDialogElement {
	const el = document.querySelector('dialog');
	if (el === null) throw new Error('no dialog in the document');
	return el;
}

const LONG = createRawSnippet(() => ({ render: () => '<p id="text">A long text without a link or a button.</p>' }));
const WITH_BUTTON = createRawSnippet(() => ({ render: () => '<div><p>Text</p><button id="inside">Retry</button></div>' }));

interface Case {
	name: string;
	Component: typeof Drawer | typeof Modal;
	/** The element that scrolls. */
	scroller: () => HTMLElement;
	/** The element that becomes the tab stop. */
	stop: () => HTMLElement;
	/** Props that leave nothing tabbable outside the body. */
	props: { dismissible: false };
}
const cases: Case[] = [
	{
		name: 'Drawer',
		Component: Drawer,
		scroller: () => find(dialog(), '.body'),
		stop: () => find(dialog(), '.body'),
		props: { dismissible: false }
	},
	{
		name: 'Modal',
		Component: Modal,
		scroller: () => dialog(),
		stop: () => find(dialog(), '.inner'),
		props: { dismissible: false }
	}
];

describe.each(cases)('$name: a scrolling body without tabbable content', ({ Component, scroller, stop, props }) => {
	const open = { title: 'Details', open: true, children: LONG, ...props };

	it('is a tab stop named by the title while it overflows, and reports no event for it', async () => {
		const onclose = vi.fn();
		const oncancel = vi.fn();
		render(Component, { ...open, onclose, oncancel });
		expect(stop().hasAttribute('tabindex')).toBe(false);
		layout(scroller(), 900, 300);
		triggerResize(scroller());
		await vi.waitFor(() => expect(stop().getAttribute('tabindex')).toBe('0'));
		const region = screen.getByRole('region', { name: 'Details' });
		expect(region).toBe(stop());
		expect(region.hasAttribute('aria-label')).toBe(false);
		region.focus();
		expect(document.activeElement).toBe(region);
		await flush();
		expect(onclose).not.toHaveBeenCalled();
		expect(oncancel).not.toHaveBeenCalled();
	});

	it('is no tab stop and no region while it does not overflow', async () => {
		render(Component, open);
		layout(scroller(), 300, 300);
		triggerResize(scroller());
		await flush();
		expect(stop().hasAttribute('tabindex')).toBe(false);
		expect(stop().hasAttribute('role')).toBe(false);
		expect(screen.queryByRole('region')).toBeNull();
	});

	it('adds no stop next to a button inside the body', async () => {
		render(Component, { ...open, children: WITH_BUTTON });
		layout(scroller(), 900, 300);
		triggerResize(scroller());
		await flush();
		expect(stop().hasAttribute('tabindex')).toBe(false);
		expect(screen.queryByRole('region')).toBeNull();
	});

	it('does not count a disabled or a tabindex="-1" element as a way in', async () => {
		const inert = createRawSnippet(() => ({ render: () => '<div><button disabled>Off</button><span tabindex="-1">x</span></div>' }));
		render(Component, { ...open, children: inert });
		layout(scroller(), 900, 300);
		triggerResize(scroller());
		await vi.waitFor(() => expect(stop().getAttribute('tabindex')).toBe('0'));
	});

	it('follows the content: a button added later removes the stop, removing it brings the stop back', async () => {
		render(Component, open);
		layout(scroller(), 900, 300);
		triggerResize(scroller());
		await vi.waitFor(() => expect(stop().getAttribute('tabindex')).toBe('0'));
		const button = document.createElement('button');
		button.textContent = 'More';
		document.getElementById('text')?.after(button);
		await vi.waitFor(() => expect(stop().hasAttribute('tabindex')).toBe(false));
		button.remove();
		await vi.waitFor(() => expect(stop().getAttribute('tabindex')).toBe('0'));
		layout(scroller(), 300, 300);
		find(document, '#text').textContent = 'Short.';
		await vi.waitFor(() => expect(stop().hasAttribute('tabindex')).toBe(false));
	});

	it('keeps the focus when the content starts to fit while the stop has it: it stays focusable, only not a stop', async () => {
		render(Component, open);
		layout(scroller(), 900, 300);
		triggerResize(scroller());
		await vi.waitFor(() => expect(stop().getAttribute('tabindex')).toBe('0'));
		stop().focus();
		layout(scroller(), 300, 300);
		triggerResize(scroller());
		await vi.waitFor(() => expect(stop().getAttribute('tabindex')).toBe('-1'));
		expect(stop().hasAttribute('role')).toBe(false);
		expect(document.activeElement).toBe(stop());
		// once the focus has moved on it is no longer held: no tabindex at all
		stop().blur();
		await vi.waitFor(() => expect(stop().hasAttribute('tabindex')).toBe(false));
	});

	it('a button that is disabled later no longer counts', async () => {
		render(Component, { ...open, children: WITH_BUTTON });
		layout(scroller(), 900, 300);
		triggerResize(scroller());
		await flush();
		expect(stop().hasAttribute('tabindex')).toBe(false);
		document.getElementById('inside')?.setAttribute('disabled', '');
		await vi.waitFor(() => expect(stop().getAttribute('tabindex')).toBe('0'));
	});

	it('keeps the name when the title is empty: the catalogue text, in the language of the catalogue', async () => {
		render(Component, { ...open, title: '' });
		layout(scroller(), 900, 300);
		triggerResize(scroller());
		await vi.waitFor(() => expect(stop().getAttribute('tabindex')).toBe('0'));
		expect(screen.getByRole('region', { name: 'Scrollable content' })).toBe(stop());
		expect(stop().hasAttribute('aria-labelledby')).toBe(false);
		setStrings(de);
		await vi.waitFor(() => expect(screen.getByRole('region', { name: 'Scrollbarer Inhalt' })).toBe(stop()));
	});

	it('stays out of the way while the dialog is closed', async () => {
		render(Component, { ...open, open: false });
		layout(scroller(), 0, 0);
		triggerResize(scroller());
		await flush();
		expect(stop().hasAttribute('tabindex')).toBe(false);
	});

	it('is the first tab stop once the dialog has nothing else, and Escape-less focus order stays as before', async () => {
		render(Component, open);
		layout(scroller(), 900, 300);
		triggerResize(scroller());
		await vi.waitFor(() => expect(stop().getAttribute('tabindex')).toBe('0'));
		const tabbable = [...dialog().querySelectorAll<HTMLElement>('[tabindex], button, a[href], input, select, textarea')];
		expect(tabbable).toEqual([stop()]);
	});
});

describe('Drawer: the close button is outside the body', () => {
	it('the body is still a stop next to the close button', async () => {
		render(Drawer, { title: 'Details', open: true, children: LONG });
		const body = find(dialog(), '.body');
		layout(body, 900, 300);
		triggerResize(body);
		await vi.waitFor(() => expect(body.getAttribute('tabindex')).toBe('0'));
		expect(screen.getByRole('button', { name: 'Close' })).toBeTruthy();
	});

	it('keeps the initial focus where it was: the close button, not the body', async () => {
		render(Drawer, { title: 'Details', open: true, children: LONG });
		const body = find(dialog(), '.body');
		layout(body, 900, 300);
		triggerResize(body);
		await vi.waitFor(() => expect(body.getAttribute('tabindex')).toBe('0'));
		expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Close' }));
	});
});

describe('Modal: the dialog scrolls as a whole', () => {
	it('with a close button the dialog has something to focus, so there is no extra stop', async () => {
		render(Modal, { title: 'Terms', open: true, children: LONG });
		layout(dialog(), 1700, 600);
		triggerResize(dialog());
		await flush();
		expect(dialog().querySelector('.inner')?.hasAttribute('tabindex')).toBe(false);
	});

	it('a footer button also counts', async () => {
		const footer = createRawSnippet(() => ({ render: () => '<button>Agree</button>' }));
		render(Modal, { title: 'Terms', open: true, dismissible: false, children: LONG, footer });
		layout(dialog(), 1700, 600);
		triggerResize(dialog());
		await flush();
		expect(dialog().querySelector('.inner')?.hasAttribute('tabindex')).toBe(false);
	});

	it('without children the wrapper is the stop', async () => {
		render(Modal, { title: 'Terms', description: 'A very long description', open: true, dismissible: false });
		layout(dialog(), 1700, 600);
		triggerResize(dialog());
		await vi.waitFor(() => expect(dialog().querySelector('.inner')?.getAttribute('tabindex')).toBe('0'));
	});
});

describe('hasTabbable', () => {
	function box(html: string): HTMLElement {
		const el = document.createElement('div');
		el.innerHTML = html;
		document.body.append(el);
		return el;
	}

	it('finds links, form controls, summaries, editable and tabindex >= 0 elements', () => {
		for (const html of [
			'<a href="#x">a</a>',
			'<button>b</button>',
			'<input />',
			'<select></select>',
			'<textarea></textarea>',
			'<details><summary>s</summary>t</details>',
			'<div contenteditable="true">e</div>',
			'<span tabindex="0">t</span>',
			'<span tabindex="3">t</span>'
		]) {
			expect(hasTabbable(box(html)), html).toBe(true);
		}
	});

	it('ignores text, anchors without href, hidden inputs, disabled controls, tabindex -1, inert and hidden content', () => {
		for (const html of [
			'<p>text</p>',
			'<a>no href</a>',
			'<input type="hidden" />',
			'<button disabled>b</button>',
			'<fieldset disabled><input /></fieldset>',
			'<span tabindex="-1">t</span>',
			'<div inert><button>b</button></div>',
			'<div contenteditable="false">e</div>'
		]) {
			expect(hasTabbable(box(html)), html).toBe(false);
		}
	});

	it('uses the browser visibility check where there is one', () => {
		const el = box('<button>b</button>');
		const button = find(el, 'button');
		Object.defineProperty(button, 'checkVisibility', { configurable: true, value: () => false });
		expect(hasTabbable(el)).toBe(false);
		Object.defineProperty(button, 'checkVisibility', { configurable: true, value: () => true });
		expect(hasTabbable(el)).toBe(true);
	});

	it('does not count the element it is told to except', () => {
		const el = box('<div id="stop" tabindex="0"><p>text</p></div>');
		expect(hasTabbable(el)).toBe(true);
		expect(hasTabbable(el, find(el, '#stop'))).toBe(false);
	});

	it('looks into the open shadow root of an element, such as a <k-button> in the body', () => {
		const el = box('<div id="host"><p>text</p></div>');
		const host = find(el, '#host');
		host.attachShadow({ mode: 'open' }).innerHTML = '<button>in shadow</button>';
		expect(hasTabbable(el)).toBe(true);
		find(host.shadowRoot ?? el, 'button').remove();
		expect(hasTabbable(el)).toBe(false);
	});

	it('looks at what a slot shows: light DOM content of a custom element is not a descendant of the body', () => {
		const host = find(box('<div id="host"><button id="slotted">Slotted</button></div>'), '#host');
		const root = host.attachShadow({ mode: 'open' });
		root.innerHTML = '<div class="body"><slot></slot></div>';
		expect(hasTabbable(root)).toBe(true);
		find(host, '#slotted').remove();
		host.innerHTML = '<p>text only</p>';
		expect(hasTabbable(root)).toBe(false);
		host.innerHTML = '<section><a href="#x">link</a></section>';
		expect(hasTabbable(root)).toBe(true);
	});
});

describe('watchScrollRegion', () => {
	function scroller(): HTMLElement {
		const el = document.createElement('div');
		el.innerHTML = '<p>text</p>';
		document.body.append(el);
		layout(el, 900, 300);
		return el;
	}

	it('reports the current state at once and then only changes', async () => {
		const el = scroller();
		const report = vi.fn<(needs: boolean) => void>();
		const stopWatching = watchScrollRegion(el, report);
		expect(report).toHaveBeenCalledExactlyOnceWith(true);
		triggerResize(el);
		triggerResize(el);
		expect(report).toHaveBeenCalledTimes(1);
		layout(el, 300, 300);
		triggerResize(el);
		expect(report).toHaveBeenLastCalledWith(false);
		stopWatching();
	});

	it('counts sideways overflow too', () => {
		const el = scroller();
		layout(el, 300, 300);
		Object.defineProperty(el, 'scrollWidth', { configurable: true, value: 500 });
		Object.defineProperty(el, 'clientWidth', { configurable: true, value: 300 });
		const report = vi.fn<(needs: boolean) => void>();
		watchScrollRegion(el, report)();
		expect(report).toHaveBeenCalledWith(true);
	});

	it('re-measures when a child resizes (an image that loaded)', () => {
		const el = scroller();
		layout(el, 300, 300);
		const report = vi.fn<(needs: boolean) => void>();
		const stopWatching = watchScrollRegion(el, report);
		expect(report).toHaveBeenLastCalledWith(false);
		layout(el, 900, 300);
		triggerResize(find(el, 'p'));
		expect(report).toHaveBeenLastCalledWith(true);
		stopWatching();
	});

	it('observes children that come and go, and slotted content of a custom element host', async () => {
		const host = document.createElement('div');
		const light = document.createElement('button');
		host.append(light);
		document.body.append(host);
		const root = host.attachShadow({ mode: 'open' });
		root.innerHTML = '<div class="body"><slot></slot></div>';
		const body = find(root, '.body');
		layout(body, 900, 300);
		const report = vi.fn<(needs: boolean) => void>();
		const stopWatching = watchScrollRegion(body, report);
		expect(report).toHaveBeenLastCalledWith(false);
		// the light DOM of the host changes: no mutation inside the shadow root
		light.remove();
		await vi.waitFor(() => expect(report).toHaveBeenLastCalledWith(true));
		stopWatching();
	});

	it('reacts to the slotchange event', () => {
		const host = document.createElement('div');
		document.body.append(host);
		const root = host.attachShadow({ mode: 'open' });
		root.innerHTML = '<div class="body"><slot></slot></div>';
		const body = find(root, '.body');
		layout(body, 900, 300);
		const report = vi.fn<(needs: boolean) => void>();
		const stopWatching = watchScrollRegion(body, report);
		expect(report).toHaveBeenLastCalledWith(true);
		const button = document.createElement('button');
		host.append(button);
		find(body, 'slot').dispatchEvent(new Event('slotchange', { bubbles: true }));
		expect(report).toHaveBeenLastCalledWith(false);
		stopWatching();
	});

	it('works without the observers', () => {
		vi.stubGlobal('ResizeObserver', undefined);
		vi.stubGlobal('MutationObserver', undefined);
		const el = scroller();
		const report = vi.fn<(needs: boolean) => void>();
		watchScrollRegion(el, report)();
		expect(report).toHaveBeenCalledExactlyOnceWith(true);
	});

	it('re-measures when the web fonts have loaded', async () => {
		const el = scroller();
		layout(el, 300, 300);
		Object.defineProperty(document, 'fonts', { configurable: true, value: { ready: Promise.resolve() } });
		const report = vi.fn<(needs: boolean) => void>();
		const stopWatching = watchScrollRegion(el, report);
		layout(el, 900, 300);
		await flush();
		expect(report).toHaveBeenLastCalledWith(true);
		stopWatching();
		Reflect.deleteProperty(document, 'fonts');
	});

	it('does nothing after the cleanup', async () => {
		const el = scroller();
		const report = vi.fn<(needs: boolean) => void>();
		const stopWatching = watchScrollRegion(el, report);
		stopWatching();
		report.mockClear();
		layout(el, 300, 300);
		triggerResize(el);
		el.append(document.createElement('button'));
		await flush();
		expect(report).not.toHaveBeenCalled();
	});
});
