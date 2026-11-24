/**
 * Highlight: the marker starts drawn, is retracted after mount and drawn when the text is in view (after
 * `delay`), or two frames after mount without `inView` or without IntersectionObserver; reduced motion keeps
 * it drawn, and unmounting cancels pending work.
 */
import { render } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Highlight from '../../src/lib/components/Highlight.svelte';
import { setMedia, triggerIntersection } from './env.js';
import { textSnippet } from './helpers.js';

function mark(container: HTMLElement): HTMLElement {
	const el = container.querySelector<HTMLElement>('.k-highlight');
	if (!el) throw new Error('no highlight');
	return el;
}

beforeEach(() => {
	vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'setTimeout', 'clearTimeout'] });
});
afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

describe('Highlight', () => {
	it('is drawn when it scrolls into view, after the delay', async () => {
		const { container } = render(Highlight, { children: textSnippet('key'), delay: 100, class: 'extra' });
		const el = mark(container);
		expect(el.classList.contains('extra')).toBe(true);
		expect(el.textContent).toBe('key');
		expect(el.getAttribute('data-drawn')).toBe('false');
		triggerIntersection(el, false);
		await vi.advanceTimersByTimeAsync(200);
		expect(el.getAttribute('data-drawn')).toBe('false');
		triggerIntersection(el, true);
		await vi.advanceTimersByTimeAsync(99);
		expect(el.getAttribute('data-drawn')).toBe('false');
		await vi.advanceTimersByTimeAsync(1);
		expect(el.getAttribute('data-drawn')).toBe('true');
	});

	it('without inView it is drawn two frames after mount', async () => {
		const { container } = render(Highlight, { inView: false, delay: -1 });
		expect(mark(container).getAttribute('data-drawn')).toBe('false');
		await vi.advanceTimersByTimeAsync(40);
		expect(mark(container).getAttribute('data-drawn')).toBe('true');
	});

	it('without IntersectionObserver it falls back to the frames', async () => {
		vi.stubGlobal('IntersectionObserver', undefined);
		const { container } = render(Highlight, {});
		await vi.advanceTimersByTimeAsync(40);
		expect(mark(container).getAttribute('data-drawn')).toBe('true');
	});

	it('stays drawn with reduced motion', () => {
		setMedia('(prefers-reduced-motion: reduce)', true);
		const { container } = render(Highlight, { children: textSnippet('x') });
		expect(mark(container).getAttribute('data-drawn')).toBe('true');
	});

	it('unmounting cancels the pending frames', async () => {
		const { unmount } = render(Highlight, { inView: false });
		unmount();
		await vi.advanceTimersByTimeAsync(40);
		expect(vi.getTimerCount()).toBe(0);
	});
});
