/**
 * SkipLink: the link text and fragment, moving the focus to the target without changing the address
 * (a target that cannot take focus gets `tabindex="-1"` until it loses it), the consumer's `onclick`
 * running first and able to cancel, modified clicks and other buttons left to the browser, a missing
 * target, a target inside the link's own shadow root, and passing other attributes through.
 */
import { fireEvent } from '@testing-library/dom';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SkipLink from '../../src/lib/components/SkipLink.svelte';

let main: HTMLElement | undefined;

function addMain(focusable = false): HTMLElement {
	main = document.createElement('main');
	main.id = 'main';
	if (focusable) main.tabIndex = 0;
	document.body.append(main);
	return main;
}

afterEach(() => {
	main?.remove();
	main = undefined;
});

describe('SkipLink', () => {
	it('links to the target with the default text and passes attributes through', () => {
		render(SkipLink, { props: { target: 'main', class: 'extra', title: 'Skip' } });
		const link = screen.getByRole('link', { name: 'Skip to main content' });
		expect(link.getAttribute('href')).toBe('#main');
		expect(link.classList.contains('k-skip-link')).toBe(true);
		expect(link.classList.contains('extra')).toBe(true);
		expect(link.getAttribute('title')).toBe('Skip');
	});

	it('moves the focus to a target that cannot take it, with a tabindex until it leaves', async () => {
		const user = userEvent.setup();
		const target = addMain();
		render(SkipLink, { props: { target: 'main', label: 'Skip navigation' } });
		await user.click(screen.getByRole('link', { name: 'Skip navigation' }));
		expect(document.activeElement).toBe(target);
		expect(target.getAttribute('tabindex')).toBe('-1');
		expect(window.location.hash).toBe('');
		target.blur();
		expect(target.hasAttribute('tabindex')).toBe(false);
	});

	it('keeps the tabindex of a focusable target', async () => {
		const user = userEvent.setup();
		const target = addMain(true);
		render(SkipLink, { props: { target: 'main' } });
		await user.click(screen.getByRole('link'));
		expect(document.activeElement).toBe(target);
		target.blur();
		expect(target.getAttribute('tabindex')).toBe('0');
	});

	it('works from the keyboard', async () => {
		const user = userEvent.setup();
		const target = addMain();
		render(SkipLink, { props: { target: 'main' } });
		await user.tab();
		await user.keyboard('{Enter}');
		expect(document.activeElement).toBe(target);
	});

	it('runs onclick first; preventDefault there keeps the focus where it is', async () => {
		const user = userEvent.setup();
		addMain();
		const onclick = vi.fn((e: MouseEvent) => e.preventDefault());
		render(SkipLink, { props: { target: 'main', onclick } });
		const link = screen.getByRole('link');
		await user.click(link);
		expect(onclick).toHaveBeenCalledTimes(1);
		expect(document.activeElement).not.toBe(main);
	});

	it.each([
		['middle button', { button: 1 }],
		['Meta', { metaKey: true }],
		['Ctrl', { ctrlKey: true }],
		['Shift', { shiftKey: true }],
		['Alt', { altKey: true }]
	])('leaves a click with %s to the browser', (_name, init) => {
		addMain();
		const onclick = vi.fn();
		render(SkipLink, { props: { target: 'main', onclick } });
		const notPrevented = fireEvent.click(screen.getByRole('link'), init);
		expect(notPrevented).toBe(true);
		expect(onclick).toHaveBeenCalledTimes(1);
		expect(document.activeElement).not.toBe(main);
	});

	it('without a target element the link keeps its normal fragment behaviour', () => {
		render(SkipLink, { props: { target: 'nowhere' } });
		expect(fireEvent.click(screen.getByRole('link'))).toBe(true);
	});

	it('finds the target in its own shadow root first', () => {
		const host = document.createElement('div');
		document.body.append(host);
		const shadow = host.attachShadow({ mode: 'open' });
		const inner = document.createElement('div');
		inner.id = 'main';
		shadow.append(inner);
		const outer = addMain();
		render(SkipLink, { target: shadow, props: { target: 'main' } });
		const link = shadow.querySelector('a');
		expect(link).not.toBeNull();
		fireEvent.click(link ?? host);
		expect(shadow.activeElement).toBe(inner);
		expect(outer.hasAttribute('tabindex')).toBe(false);
		host.remove();
	});

	it('falls back to the document from a shadow root without the id', () => {
		const host = document.createElement('div');
		document.body.append(host);
		const shadow = host.attachShadow({ mode: 'open' });
		const outer = addMain();
		render(SkipLink, { target: shadow, props: { target: 'main' } });
		fireEvent.click(shadow.querySelector('a') ?? host);
		expect(document.activeElement).toBe(outer);
		host.remove();
	});
});
