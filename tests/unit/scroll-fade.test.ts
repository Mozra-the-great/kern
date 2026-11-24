/**
 * watchScrollFade outside a browser (node project): with no `document`, `ResizeObserver` or `MutationObserver` it
 * still measures the strip it is given and cleans up. The browser behaviour is tests/dom/scroll-fade.test.ts.
 */
import { describe, expect, it, vi } from 'vitest';
import { watchScrollFade, type ScrollFade } from '../../src/lib/components/scroll-fade.js';

describe('watchScrollFade without a document', () => {
	it('measures once, listens for scrolling and removes the listener again', () => {
		const listeners = new Set<() => void>();
		const node = {
			scrollWidth: 300,
			clientWidth: 100,
			scrollLeft: 0,
			addEventListener: (_type: string, listener: () => void): void => void listeners.add(listener),
			removeEventListener: (_type: string, listener: () => void): void => void listeners.delete(listener)
		};
		const report = vi.fn<(fade: ScrollFade) => void>();
		const stop = watchScrollFade(node as unknown as HTMLElement, report);
		expect(typeof document).toBe('undefined');
		expect(report).toHaveBeenCalledWith({ start: false, end: true });
		expect(listeners.size).toBe(1);
		stop();
		expect(listeners.size).toBe(0);
	});
});
