/**
 * watchScrollFade (scroll-fade.ts), the edge hint of the sideways scrolling strips of Tabs and TabLinks: which
 * edge has hidden content (also RTL, where scrollLeft is negative), reports only on change, re-measures on scroll,
 * resize, content changes and font loading, works without the observers, and stops after the cleanup.
 * jsdom has no layout: the strip's sizes and offset are set on the element.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { watchScrollFade, type ScrollFade } from '../../src/lib/components/scroll-fade.js';
import { flush } from './helpers.js';

const resized: ResizeObserverCallback[] = [];

class RecordingResizeObserver {
	constructor(callback: ResizeObserverCallback) {
		resized.push(callback);
	}
	observe(): void {}
	unobserve(): void {}
	disconnect(): void {}
}

let node: HTMLElement;

function setMetrics(metrics: { scrollWidth?: number; clientWidth?: number; scrollLeft?: number }): void {
	for (const [name, value] of Object.entries(metrics)) Object.defineProperty(node, name, { configurable: true, value });
}

beforeEach(() => {
	resized.length = 0;
	vi.stubGlobal('ResizeObserver', RecordingResizeObserver);
	node = document.createElement('div');
	document.body.append(node);
	setMetrics({ scrollWidth: 100, clientWidth: 100, scrollLeft: 0 });
});

afterEach(() => {
	vi.unstubAllGlobals();
	node.remove();
});

describe('watchScrollFade', () => {
	it('reports no fade for a strip that does not overflow', () => {
		const report = vi.fn<(fade: ScrollFade) => void>();
		const stop = watchScrollFade(node, report);
		expect(report).toHaveBeenCalledWith({ start: false, end: false });
		stop();
	});

	it('reports the end, both edges and the start as the strip scrolls, once per change', () => {
		const report = vi.fn<(fade: ScrollFade) => void>();
		setMetrics({ scrollWidth: 300, clientWidth: 100, scrollLeft: 0 });
		const stop = watchScrollFade(node, report);
		expect(report).toHaveBeenLastCalledWith({ start: false, end: true });
		setMetrics({ scrollLeft: 100 });
		node.dispatchEvent(new Event('scroll'));
		expect(report).toHaveBeenLastCalledWith({ start: true, end: true });
		setMetrics({ scrollLeft: 120 });
		node.dispatchEvent(new Event('scroll'));
		expect(report).toHaveBeenCalledTimes(2);
		setMetrics({ scrollLeft: 200 });
		node.dispatchEvent(new Event('scroll'));
		expect(report).toHaveBeenLastCalledWith({ start: true, end: false });
		stop();
	});

	it('uses the distance from the start in RTL, where scrollLeft is negative', () => {
		const report = vi.fn<(fade: ScrollFade) => void>();
		setMetrics({ scrollWidth: 300, clientWidth: 100, scrollLeft: -200 });
		const stop = watchScrollFade(node, report);
		expect(report).toHaveBeenLastCalledWith({ start: true, end: false });
		stop();
	});

	it('measures again on resize, on content changes and once the fonts are loaded', async () => {
		const report = vi.fn<(fade: ScrollFade) => void>();
		const fonts = { ready: Promise.resolve() };
		Object.defineProperty(document, 'fonts', { configurable: true, value: fonts });
		const stop = watchScrollFade(node, report);
		expect(report).toHaveBeenCalledTimes(1);
		setMetrics({ scrollWidth: 300 });
		for (const callback of resized) callback([], {} as ResizeObserver);
		expect(report).toHaveBeenLastCalledWith({ start: false, end: true });
		setMetrics({ scrollWidth: 100 });
		node.append(document.createElement('span'));
		await flush();
		expect(report).toHaveBeenLastCalledWith({ start: false, end: false });
		setMetrics({ scrollWidth: 400, scrollLeft: 300 });
		await fonts.ready;
		await flush();
		stop();
		Reflect.deleteProperty(document, 'fonts');
	});

	it('works without the observers and without document.fonts', () => {
		vi.stubGlobal('ResizeObserver', undefined);
		vi.stubGlobal('MutationObserver', undefined);
		const report = vi.fn<(fade: ScrollFade) => void>();
		const stop = watchScrollFade(node, report);
		setMetrics({ scrollWidth: 300 });
		node.dispatchEvent(new Event('scroll'));
		expect(report).toHaveBeenLastCalledWith({ start: false, end: true });
		stop();
	});

	it('stops listening after the cleanup, also for updates already on their way', async () => {
		const report = vi.fn<(fade: ScrollFade) => void>();
		let release: () => void = () => undefined;
		const ready = new Promise<void>((resolve) => {
			release = resolve;
		});
		Object.defineProperty(document, 'fonts', { configurable: true, value: { ready } });
		const stop = watchScrollFade(node, report);
		stop();
		setMetrics({ scrollWidth: 300 });
		node.dispatchEvent(new Event('scroll'));
		for (const callback of resized) callback([], {} as ResizeObserver);
		release();
		await flush();
		expect(report).toHaveBeenCalledTimes(1);
		Reflect.deleteProperty(document, 'fonts');
	});
});
