/**
 * Reveal: content starts visible, is hidden after mount and shown when it enters the viewport or gets focus;
 * `once` stops watching, without it the content hides and replays; `delay` as transition delay, `direction`,
 * the settled state after the transition or the failsafe timer, reduced motion and a missing
 * IntersectionObserver keep it shown.
 */
import { fireEvent, render } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Reveal from '../../src/lib/components/Reveal.svelte';
import { setMedia, triggerIntersection } from './env.js';
import { textSnippet } from './helpers.js';

function parts(container: HTMLElement): { root: HTMLElement; inner: HTMLElement } {
	const root = container.querySelector<HTMLElement>('.k-reveal');
	const inner = container.querySelector<HTMLElement>('.k-reveal > .inner');
	if (!root || !inner) throw new Error('no reveal');
	return { root, inner };
}

beforeEach(() => {
	vi.useFakeTimers();
});
afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

describe('Reveal', () => {
	it('hides after mount and shows once in view, then stops watching', async () => {
		const { container } = render(Reveal, { children: textSnippet('Hello'), class: 'extra' });
		const { root, inner } = parts(container);
		expect(root.classList.contains('extra')).toBe(true);
		expect(root.getAttribute('data-dir')).toBe('up');
		expect(inner.textContent).toBe('Hello');
		expect(inner.getAttribute('data-phase')).toBe('hidden');
		expect(root.hasAttribute('data-settled')).toBe(false);
		expect(inner.style.transitionDelay).toBe('0ms');
		triggerIntersection(root, false);
		await vi.advanceTimersByTimeAsync(0);
		expect(inner.getAttribute('data-phase')).toBe('hidden');
		triggerIntersection(root, true);
		await vi.advanceTimersByTimeAsync(0);
		expect(inner.getAttribute('data-phase')).toBe('shown');
		triggerIntersection(root, false);
		await vi.advanceTimersByTimeAsync(0);
		expect(inner.getAttribute('data-phase')).toBe('shown');
	});

	it('settles after its own transition ends, not after a child transition', async () => {
		const { container } = render(Reveal, { children: textSnippet('x'), direction: 'left' });
		const { root, inner } = parts(container);
		expect(root.getAttribute('data-dir')).toBe('left');
		await fireEvent.transitionEnd(inner);
		expect(root.hasAttribute('data-settled')).toBe(false);
		triggerIntersection(root, true);
		await vi.advanceTimersByTimeAsync(0);
		await fireEvent.transitionEnd(inner.firstElementChild as Element);
		expect(root.hasAttribute('data-settled')).toBe(false);
		await fireEvent.transitionEnd(inner);
		expect(root.hasAttribute('data-settled')).toBe(true);
	});

	it('the failsafe settles it after the delay plus 1.5 s', async () => {
		const { container } = render(Reveal, { children: textSnippet('x'), delay: 200, threshold: 0.5 });
		const { root, inner } = parts(container);
		triggerIntersection(root, true);
		await vi.advanceTimersByTimeAsync(0);
		expect(inner.style.transitionDelay).toBe('200ms');
		await vi.advanceTimersByTimeAsync(1699);
		expect(root.hasAttribute('data-settled')).toBe(false);
		await vi.advanceTimersByTimeAsync(1);
		expect(root.hasAttribute('data-settled')).toBe(true);
	});

	it('without once it hides again when it leaves and replays', async () => {
		const { container } = render(Reveal, { children: textSnippet('x'), once: false, delay: -10, direction: 'none' });
		const { root, inner } = parts(container);
		triggerIntersection(root, true);
		await vi.advanceTimersByTimeAsync(0);
		expect(inner.getAttribute('data-phase')).toBe('shown');
		expect(inner.style.transitionDelay).toBe('0ms');
		triggerIntersection(root, false);
		await vi.advanceTimersByTimeAsync(0);
		expect(inner.getAttribute('data-phase')).toBe('hidden');
		triggerIntersection(root, true);
		await vi.advanceTimersByTimeAsync(0);
		expect(inner.getAttribute('data-phase')).toBe('shown');
	});

	it('shows when something inside gets focus', async () => {
		const once = render(Reveal, { children: textSnippet('x') });
		const a = parts(once.container);
		a.root.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
		await vi.advanceTimersByTimeAsync(0);
		expect(a.inner.getAttribute('data-phase')).toBe('shown');
		once.unmount();
		const repeat = render(Reveal, { children: textSnippet('y'), once: false });
		const b = parts(repeat.container);
		b.root.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
		await vi.advanceTimersByTimeAsync(0);
		expect(b.inner.getAttribute('data-phase')).toBe('shown');
	});

	it('stays shown with reduced motion and without IntersectionObserver', () => {
		setMedia('(prefers-reduced-motion: reduce)', true);
		const reduced = render(Reveal, {});
		expect(parts(reduced.container).inner.getAttribute('data-phase')).toBe('shown');
		expect(parts(reduced.container).root.hasAttribute('data-settled')).toBe(true);
		reduced.unmount();
		setMedia('(prefers-reduced-motion: reduce)', false);
		vi.stubGlobal('IntersectionObserver', undefined);
		const plain = render(Reveal, { children: textSnippet('x') });
		expect(parts(plain.container).inner.getAttribute('data-phase')).toBe('shown');
	});

	it('is shown again when reduced motion is switched on', async () => {
		const { container } = render(Reveal, { children: textSnippet('x') });
		expect(parts(container).inner.getAttribute('data-phase')).toBe('hidden');
		setMedia('(prefers-reduced-motion: reduce)', true);
		await vi.advanceTimersByTimeAsync(0);
		expect(parts(container).inner.getAttribute('data-phase')).toBe('shown');
	});
});
