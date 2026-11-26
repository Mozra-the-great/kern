/**
 * The theme texts (#185) in the DOM: the reactive read reaches a mounted component when the language
 * changes (setThemeTexts, setThemeTextsLocale, the other build's call on the shared store), the texts
 * render as text nodes, and a fresh module copy adopts the store another copy put on the global.
 */
import { render, screen } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	getThemeTexts,
	registerThemeTexts,
	resetThemeTexts,
	setThemeTexts,
	setThemeTextsLocale,
	sharedThemeTextsStore,
	type ThemeTextsStore
} from '../../src/lib/components/theme-texts.js';
import { deThemeTexts } from '../../src/lib/components/theme-texts-de.js';
import Reader from './harness/ThemeTextsReader.svelte';

const KEY = Symbol.for('kern.themeTexts');
const g = globalThis as typeof globalThis & Record<symbol, unknown>;

afterEach(() => {
	resetThemeTexts();
});

describe('the reactive read', () => {
	it('renders the English texts and fills the placeholders', () => {
		render(Reader);
		expect(screen.getByTestId('first').textContent).toBe('Advent counts down to Christmas: one more candle is lit each Sunday.');
		expect(screen.getByTestId('second').textContent).toBe('Today: 3 of 4 candles.');
		expect(screen.getByTestId('lang').textContent).toBe('none');
	});

	it('updates a mounted component when a bundle is set and when it is reset', () => {
		render(Reader);
		setThemeTexts(deThemeTexts);
		flushSync();
		expect(screen.getByTestId('second').textContent).toBe('Heute: 3 von 4 Kerzen.');
		expect(screen.getByTestId('lang').textContent).toBe('de');
		resetThemeTexts();
		flushSync();
		expect(screen.getByTestId('second').textContent).toBe('Today: 3 of 4 candles.');
		expect(screen.getByTestId('lang').textContent).toBe('none');
	});

	it('follows the locale registered for a tag', () => {
		registerThemeTexts('de', deThemeTexts);
		render(Reader);
		expect(setThemeTextsLocale('de-AT')).toBe(true);
		flushSync();
		expect(screen.getByTestId('first').textContent).toBe(deThemeTexts.advent.first);
		expect(screen.getByTestId('lang').textContent).toBe('de-AT');
	});

	it('shows a consumer override and keeps the rest English', () => {
		render(Reader);
		setThemeTexts({ advent: { first: 'Our own line.' } });
		flushSync();
		expect(screen.getByTestId('first').textContent).toBe('Our own line.');
		expect(screen.getByTestId('second').textContent).toBe('Today: 3 of 4 candles.');
	});

	it('renders markup in a text as text, never as elements', () => {
		const { container } = render(Reader);
		setThemeTexts({ advent: { first: '<img src=x onerror=alert(1)>' } });
		flushSync();
		expect(screen.getByTestId('first').textContent).toBe('<img src=x onerror=alert(1)>');
		expect(container.querySelector('img')).toBeNull();
	});
});

describe('the shared store', () => {
	async function freshModule(): Promise<typeof import('../../src/lib/components/theme-texts.js')> {
		vi.resetModules();
		return import('../../src/lib/components/theme-texts.js');
	}

	it('is one object on a well-known global', () => {
		expect(g[KEY]).toBe(sharedThemeTextsStore());
	});

	it('is adopted by another copy of the module, which then sees the same choice', async () => {
		setThemeTexts(deThemeTexts);
		const other = await freshModule();
		expect(other.sharedThemeTextsStore()).toBe(sharedThemeTextsStore());
		expect(other.getThemeTexts().easter.first).toBe(getThemeTexts().easter.first);
		expect(other.getThemeTextsLang()).toBe('de');
	});

	it('keeps its own store when the global holds something else, and leaves it alone', async () => {
		const saved = g[KEY];
		g[KEY] = { version: 0, set() {}, subscribe() {} };
		try {
			const other = await freshModule();
			const own: ThemeTextsStore = other.sharedThemeTextsStore();
			expect(own.version).toBe(1);
			expect(own).not.toBe(g[KEY]);
			expect(g[KEY]).toEqual({ version: 0, set: expect.any(Function), subscribe: expect.any(Function) });
		} finally {
			g[KEY] = saved;
		}
	});
});
