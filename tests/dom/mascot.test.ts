/**
 * Mascot (stuffcloud: mascot.test.ts "Mascot markup" and "Mascot motion state"; the catalogue and integer
 * scaling cases of mascots.test.ts are in tests/mascot/mascots.test.ts, the stylesheet cases run against the
 * real CSS in tests/mascot/mascot.spec.ts). jsdom has no layout and no animation clock: the motion state is
 * driven through the observer stand-in of env.ts and the Page Visibility API.
 */
import { render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Mascot from '../../src/lib/components/Mascot.svelte';
import { MASCOT_ALIASES, MASCOT_NAMES, MASCOT_SOURCES, type MascotAlias } from '../../src/lib/components/mascots.js';
import { triggerIntersection } from './env.js';
import { reactive } from './reactive.svelte.js';

const BASE = '/assets/code';

function setVisibility(state: DocumentVisibilityState): void {
	Object.defineProperty(document, 'visibilityState', { configurable: true, value: state });
	document.dispatchEvent(new Event('visibilitychange'));
}

function mascot(container: HTMLElement): HTMLElement {
	const host = container.querySelector<HTMLElement>('.k-mascot');
	if (host === null) throw new Error('no mascot rendered');
	return host;
}

function image(container: HTMLElement): HTMLImageElement {
	const img = container.querySelector('img');
	if (img === null) throw new Error('no image rendered');
	return img;
}

beforeEach(() => {
	setVisibility('visible');
});

afterEach(() => {
	Reflect.deleteProperty(document, 'visibilityState');
	vi.restoreAllMocks();
});

describe('Mascot markup', () => {
	it.each(MASCOT_NAMES)('%s draws its own svg, decoratively, without any text', (name) => {
		const { container } = render(Mascot, { name, base: BASE });
		const img = image(container);
		expect(img.getAttribute('src')).toBe(`${BASE}/${MASCOT_SOURCES[name].art}.svg`);
		expect(img.getAttribute('alt')).toBe('');
		expect(img.getAttribute('aria-hidden')).toBe('true');
		expect(img.getAttribute('draggable')).toBe('false');
		expect(img.getAttribute('decoding')).toBe('async');
		expect(mascot(container).dataset['mascot']).toBe(name);
		// Mascots never speak and carry no filler text.
		expect(container.textContent.trim()).toBe('');
	});

	it.each(MASCOT_NAMES)('%s is a named image with a label, and nothing else changes', (name) => {
		const { container } = render(Mascot, { name, base: BASE, label: `Mascot ${name}` });
		expect(screen.getByRole('img', { name: `Mascot ${name}` }).getAttribute('src')).toBe(`${BASE}/${MASCOT_SOURCES[name].art}.svg`);
		expect(container.textContent.trim()).toBe('');
	});

	it.each(Object.entries(MASCOT_ALIASES))('the alias %s draws %s and reports the canonical name', (alias, name) => {
		const { container } = render(Mascot, { name: alias as MascotAlias, base: BASE });
		expect(image(container).getAttribute('src')).toBe(`${BASE}/${MASCOT_SOURCES[name].art}.svg`);
		expect(mascot(container).dataset['mascot']).toBe(name);
		expect(mascot(container).style.getPropertyValue('--cols')).toBe(String(MASCOT_SOURCES[name].cols));
		expect(image(container).getAttribute('aria-hidden')).toBe('true');
	});

	it('keeps the path as data-mascot for art that is not a mascot name', () => {
		const { container } = render(Mascot, { name: 'mascots/axo', base: BASE });
		expect(mascot(container).dataset['mascot']).toBe('mascots/axo');
	});

	it('gives the image a text alternative (and exposes it) when a label is set', () => {
		const { container } = render(Mascot, { name: 'boo', base: BASE, label: 'Page expired' });
		const img = image(container);
		expect(img.getAttribute('alt')).toBe('Page expired');
		expect(img.hasAttribute('aria-hidden')).toBe(false);
	});

	it('renders no image without a source (name without base, or neither)', () => {
		const first = render(Mascot, { name: 'stuffy' });
		expect(first.container.querySelector('img')).toBeNull();
		expect(mascot(first.container).dataset['mascot']).toBe('stuffy');
		const second = render(Mascot, {});
		expect(second.container.querySelector('img')).toBeNull();
	});

	it('src wins over base, and a path of shipped art works like a name', () => {
		const withSrc = render(Mascot, { name: 'stuffy', base: BASE, src: '/own/stuffy.svg' });
		expect(image(withSrc.container).getAttribute('src')).toBe('/own/stuffy.svg');
		const withPath = render(Mascot, { name: 'mascots/axo', base: `${BASE}/` });
		expect(image(withPath.container).getAttribute('src')).toBe(`${BASE}/mascots/axo.svg`);
	});

	it('reserves its box with width and height attributes at an integer scale', () => {
		const { container } = render(Mascot, { name: 'stuffy', base: BASE, scale: 16 });
		const img = image(container);
		const { cols, rows } = MASCOT_SOURCES.stuffy;
		expect(img.getAttribute('width')).toBe(String(cols * 16));
		expect(img.getAttribute('height')).toBe(String(rows * 16));
		expect(mascot(container).style.getPropertyValue('--scale')).toBe('16');
		expect(mascot(container).style.getPropertyValue('--cols')).toBe(String(cols));
		expect(mascot(container).style.getPropertyValue('--rows')).toBe(String(rows));
	});

	it('cuts fractional and invalid scales to whole pixels', () => {
		const { cols } = MASCOT_SOURCES.mochi;
		const fractional = render(Mascot, { name: 'mochi', base: BASE, scale: 5.8 });
		expect(image(fractional.container).getAttribute('width')).toBe(String(cols * 5));
		expect(mascot(fractional.container).style.getPropertyValue('--scale')).toBe('5');
		const invalid = render(Mascot, { name: 'mochi', base: BASE, scale: Number.NaN });
		expect(image(invalid.container).getAttribute('width')).toBe(String(cols));
		expect(mascot(invalid.container).style.getPropertyValue('--scale')).toBe('1');
	});

	it('uses the same scale on phones unless a compact scale is given (also whole)', () => {
		const same = render(Mascot, { name: 'hop', base: BASE, scale: 6 });
		expect(mascot(same.container).style.getPropertyValue('--scale-compact')).toBe('6');
		const compact = render(Mascot, { name: 'hop', base: BASE, scale: 16, compactScale: 9.9 });
		expect(mascot(compact.container).style.getPropertyValue('--scale-compact')).toBe('9');
	});

	it('defaults to scale 8 and takes an explicit grid for art outside the catalogue', () => {
		const { cols } = MASCOT_SOURCES.bun;
		const defaults = render(Mascot, { name: 'bun', base: BASE });
		expect(image(defaults.container).getAttribute('width')).toBe(String(cols * 8));
		const custom = render(Mascot, { src: '/custom.svg', cols: 10, rows: 5, scale: 3 });
		expect(image(custom.container).getAttribute('width')).toBe('30');
		expect(image(custom.container).getAttribute('height')).toBe('15');
	});

	it('uses only custom-property styling the CSP allows (no inline style text)', () => {
		const { container } = render(Mascot, { name: 'stuffy', base: BASE });
		const declared = mascot(container).style;
		expect(declared.length).toBeGreaterThan(0);
		for (let index = 0; index < declared.length; index += 1) expect(declared.item(index)).toMatch(/^--/);
	});

	it('adds a custom class next to k-mascot', () => {
		const { container } = render(Mascot, { name: 'stuffy', base: BASE, class: 'hero' });
		expect(mascot(container).classList.contains('hero')).toBe(true);
	});

	it('follows prop changes', async () => {
		const props = reactive<{ name: 'stuffy' | 'mochi'; base: string; scale: number }>({ name: 'stuffy', base: BASE, scale: 4 });
		const { container } = render(Mascot, { props });
		props.name = 'mochi';
		props.scale = 2;
		await vi.waitFor(() => expect(image(container).getAttribute('src')).toBe(`${BASE}/${MASCOT_SOURCES.mochi.art}.svg`));
		expect(image(container).getAttribute('width')).toBe(String(MASCOT_SOURCES.mochi.cols * 2));
	});
});

describe('Mascot motion state', () => {
	it('runs by default', () => {
		const { container } = render(Mascot, { name: 'stuffy', base: BASE });
		expect(mascot(container).dataset['motion']).toBe('running');
	});

	it('is still when animated is false, and never listens to the page', () => {
		const add = vi.spyOn(document, 'addEventListener');
		const { container } = render(Mascot, { name: 'stuffy', base: BASE, animated: false });
		expect(mascot(container).dataset['motion']).toBe('still');
		expect(add.mock.calls.filter(([type]) => type === 'visibilitychange')).toHaveLength(0);
	});

	it('pauses while the tab is hidden and resumes when it is shown again', async () => {
		const { container } = render(Mascot, { name: 'stuffy', base: BASE });
		setVisibility('hidden');
		await vi.waitFor(() => expect(mascot(container).dataset['motion']).toBe('paused'));
		setVisibility('visible');
		await vi.waitFor(() => expect(mascot(container).dataset['motion']).toBe('running'));
	});

	it('starts paused when the tab is already hidden on mount', async () => {
		setVisibility('hidden');
		const { container } = render(Mascot, { name: 'stuffy', base: BASE });
		await vi.waitFor(() => expect(mascot(container).dataset['motion']).toBe('paused'));
	});

	it('pauses while it is outside the viewport and runs when it comes back', async () => {
		const { container } = render(Mascot, { name: 'stuffy', base: BASE });
		const host = mascot(container);
		triggerIntersection(host, false);
		await vi.waitFor(() => expect(host.dataset['motion']).toBe('paused'));
		triggerIntersection(host, true);
		await vi.waitFor(() => expect(host.dataset['motion']).toBe('running'));
	});

	it('needs both: in view and the tab visible', async () => {
		const { container } = render(Mascot, { name: 'stuffy', base: BASE });
		const host = mascot(container);
		triggerIntersection(host, false);
		setVisibility('hidden');
		await vi.waitFor(() => expect(host.dataset['motion']).toBe('paused'));
		triggerIntersection(host, true);
		await vi.waitFor(() => expect(host.dataset['motion']).toBe('paused'));
		setVisibility('visible');
		await vi.waitFor(() => expect(host.dataset['motion']).toBe('running'));
	});

	it('keeps running where IntersectionObserver does not exist', () => {
		vi.stubGlobal('IntersectionObserver', undefined);
		const { container } = render(Mascot, { name: 'stuffy', base: BASE });
		expect(mascot(container).dataset['motion']).toBe('running');
		vi.unstubAllGlobals();
	});

	it('stops listening on unmount', () => {
		const remove = vi.spyOn(document, 'removeEventListener');
		const { unmount } = render(Mascot, { name: 'stuffy', base: BASE });
		unmount();
		expect(remove.mock.calls.some(([type]) => type === 'visibilitychange')).toBe(true);
	});

	it('switches to still when animated turns false', async () => {
		const props = reactive<{ name: 'stuffy'; base: string; animated: boolean }>({ name: 'stuffy', base: BASE, animated: true });
		const { container } = render(Mascot, { props });
		props.animated = false;
		await vi.waitFor(() => expect(mascot(container).dataset['motion']).toBe('still'));
	});
});

describe('Mascot class', () => {
	it('a nullish class from an untyped caller adds no "null" to the class', () => {
		const { container } = render(Mascot, { name: 'boo', base: BASE, class: null as unknown as string });
		expect(mascot(container).getAttribute('class')).not.toMatch(/null|undefined/);
	});
});
