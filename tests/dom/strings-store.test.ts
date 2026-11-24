/**
 * strings.ts, the parts tests/unit/strings.test.ts (node) cannot reach: `followLang` on a real document (the
 * `lang` of <html> or of another root, now and on every change, stop, no MutationObserver), subscriber errors
 * without `reportError`, inputs that are not objects, `register` with an empty tag or a bad bundle, and which
 * global values count as a shared store (each case loads a fresh module).
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { StringsStore } from '../../src/lib/components/strings.js';
import { de } from '../../src/lib/components/strings-de.js';

const KEY = Symbol.for('kern.strings');
const g = globalThis as typeof globalThis & Record<symbol, unknown>;
const html = document.documentElement;

async function freshModule(): Promise<typeof import('../../src/lib/components/strings.js')> {
	vi.resetModules();
	return import('../../src/lib/components/strings.js');
}

afterEach(() => {
	Reflect.deleteProperty(g, KEY);
	html.removeAttribute('lang');
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe('followLang', () => {
	it('follows the lang of <html> now and on every change until stopped', async () => {
		const { followLang, getLang, getStrings, registerStrings } = await freshModule();
		registerStrings('de', de);
		html.setAttribute('lang', 'de-AT');
		const stop = followLang();
		expect(getLang()).toBe('de-AT');
		expect(getStrings().modal.closeLabel).toBe(de.modal?.closeLabel);
		html.setAttribute('lang', 'en');
		await vi.waitFor(() => expect(getLang()).toBe('en'));
		html.removeAttribute('lang');
		await vi.waitFor(() => expect(getLang()).toBeUndefined());
		stop();
		html.setAttribute('lang', 'fr');
		await Promise.resolve();
		expect(getLang()).toBeUndefined();
	});

	it('follows another root', async () => {
		const { followLang, getLang } = await freshModule();
		const root = document.createElement('section');
		root.setAttribute('lang', 'nl');
		const stop = followLang(root);
		expect(getLang()).toBe('nl');
		stop();
	});

	it('applies once without MutationObserver', async () => {
		const { followLang, getLang } = await freshModule();
		vi.stubGlobal('MutationObserver', undefined);
		html.setAttribute('lang', 'sv');
		const stop = followLang();
		expect(getLang()).toBe('sv');
		expect(stop()).toBeUndefined();
	});
});

describe('the store', () => {
	it('reports a throwing subscriber through console.error without reportError', async () => {
		const { createStringsStore } = await freshModule();
		vi.stubGlobal('reportError', undefined);
		const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
		const store = createStringsStore();
		store.subscribe(() => {
			throw new Error('boom');
		});
		const seen: number[] = [];
		store.subscribe(() => seen.push(store.revision));
		store.reset();
		expect(error).toHaveBeenCalledTimes(1);
		expect(seen).toEqual([1]);
	});

	it('skips inputs that are not objects and ignores bad registrations', async () => {
		const { createStringsStore } = await freshModule();
		const store = createStringsStore();
		store.set([null, 'text', ['array'], { lang: '  ', modal: { closeLabel: 'Zu' } }] as unknown as never[]);
		expect(store.overrides).toEqual({ modal: { closeLabel: 'Zu' } });
		expect(store.lang).toBeUndefined();
		store.register('  ', de);
		store.register('xx', 'nope' as unknown as typeof de);
		expect(store.bundle('')).toBeUndefined();
		expect(store.bundle('xx')).toBeUndefined();
	});
});

describe('sharedStringsStore', () => {
	it('adopts a compatible store that another copy put on the global', async () => {
		const other = await freshModule();
		const foreign: StringsStore = other.createStringsStore();
		g[KEY] = foreign;
		const { sharedStringsStore } = await freshModule();
		expect(sharedStringsStore()).toBe(foreign);
	});

	it.each([
		['a string', 'kern'],
		['an older shape', { version: 0, set() {}, subscribe() {} }],
		['one without set', { version: 1, subscribe() {} }],
		['one without subscribe', { version: 1, set() {} }]
	])('keeps its own store and leaves %s on the global untouched', async (_name, value) => {
		g[KEY] = value;
		const { sharedStringsStore } = await freshModule();
		const own = sharedStringsStore();
		expect(own).not.toBe(value);
		expect(own.version).toBe(1);
		expect(g[KEY]).toBe(value);
	});
});
