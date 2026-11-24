/**
 * Announcer store (#64), the rest of announcer.test.ts: subscriber errors without `reportError`, which
 * global values count as a shared announcer (each case loads a fresh module, the cache is module state),
 * and `announce()`, which does nothing without a document (node) and speaks through the shared one with it.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Announcer } from '../../src/lib/components/announcer.js';

const KEY = Symbol.for('kern.announcer');
const g = globalThis as typeof globalThis & Record<symbol, unknown>;

async function freshModule(): Promise<typeof import('../../src/lib/components/announcer.js')> {
	vi.resetModules();
	return import('../../src/lib/components/announcer.js');
}

afterEach(() => {
	Reflect.deleteProperty(g, KEY);
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe('subscriber errors without reportError', () => {
	it('go to console.error, at subscribe time and on a change', async () => {
		const { createAnnouncer } = await freshModule();
		vi.stubGlobal('reportError', undefined);
		const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
		const a = createAnnouncer();
		a.subscribe(() => {
			throw new Error('boom');
		});
		expect(error).toHaveBeenCalledTimes(1);
		a.announce('x');
		expect(error).toHaveBeenCalledTimes(2);
	});

	it('go to reportError at subscribe time when it exists', async () => {
		const { createAnnouncer } = await freshModule();
		const report = vi.fn();
		vi.stubGlobal('reportError', report);
		createAnnouncer().subscribe(() => {
			throw new Error('boom');
		});
		expect(report).toHaveBeenCalledTimes(1);
	});
});

describe('sharedAnnouncer', () => {
	it('adopts a compatible announcer that another copy put on the global', async () => {
		const other = await freshModule();
		const foreign: Announcer = other.createAnnouncer();
		g[KEY] = foreign;
		const { sharedAnnouncer } = await freshModule();
		expect(sharedAnnouncer()).toBe(foreign);
	});

	it.each([
		['a string', 'kern'],
		['null', null],
		['an older shape', { version: 0, announce() {}, attach() {}, subscribe() {} }],
		['one without announce', { version: 1, attach() {}, subscribe() {} }],
		['one without attach', { version: 1, announce() {}, subscribe() {} }],
		['one without subscribe', { version: 1, announce() {}, attach() {} }]
	])('keeps its own announcer and leaves %s on the global untouched', async (_name, value) => {
		g[KEY] = value;
		const { sharedAnnouncer } = await freshModule();
		const own = sharedAnnouncer();
		expect(own).not.toBe(value);
		expect(own.version).toBe(1);
		expect(g[KEY]).toBe(value);
		expect(sharedAnnouncer()).toBe(own);
	});
});

describe('announce()', () => {
	it('does nothing without a document', async () => {
		const { announce, sharedAnnouncer } = await freshModule();
		announce('Saved');
		expect(sharedAnnouncer().polite).toBe('');
	});

	it('speaks through the shared announcer, polite by default', async () => {
		vi.stubGlobal('document', {});
		const { announce, sharedAnnouncer } = await freshModule();
		announce('Saved');
		announce('Lost', 'assertive');
		expect([sharedAnnouncer().polite, sharedAnnouncer().assertive]).toEqual(['Saved', 'Lost']);
		sharedAnnouncer().clear();
	});
});
