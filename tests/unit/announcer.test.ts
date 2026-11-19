/**
 * Announcer store (#64), node side: the text of the two regions, repeated messages, expiry,
 * host bookkeeping and the shared global. The regions in a browser, in both builds, are tested by
 * tests/elements/a11y-primitives.spec.ts.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	ANNOUNCE_CLEAR_MS,
	ANNOUNCE_REPEAT_MS,
	createAnnouncer,
	sharedAnnouncer,
	type Announcer
} from '../../src/lib/components/announcer.js';

beforeEach(() => {
	vi.useFakeTimers();
});
afterEach(() => {
	vi.useRealTimers();
});

describe('announcer', () => {
	it('puts a polite message in the polite region and an assertive one in the assertive region', () => {
		const a = createAnnouncer();
		a.announce('Saved');
		a.announce('Connection lost', 'assertive');
		expect([a.polite, a.assertive]).toEqual(['Saved', 'Connection lost']);
	});

	it('is polite by default and for anything but "assertive"', () => {
		const a = createAnnouncer();
		a.announce('one');
		a.announce('two', 'nonsense' as 'polite');
		expect([a.polite, a.assertive]).toEqual(['two', '']);
	});

	it('ignores empty and non-text messages', () => {
		const a = createAnnouncer();
		a.announce('');
		a.announce('   ');
		a.announce(undefined as unknown as string);
		a.announce(5 as unknown as string);
		expect([a.polite, a.assertive]).toEqual(['', '']);
	});

	it('replaces the previous message of a region at once', () => {
		const a = createAnnouncer();
		a.announce('first');
		a.announce('second');
		expect(a.polite).toBe('second');
	});

	it('says an equal message again: the region is emptied first and set a moment later', () => {
		const a = createAnnouncer();
		const seen: string[] = [];
		a.subscribe(() => seen.push(a.polite));
		a.announce('Saved');
		a.announce('Saved');
		expect(a.polite).toBe('');
		vi.advanceTimersByTime(ANNOUNCE_REPEAT_MS);
		expect(a.polite).toBe('Saved');
		expect(seen).toEqual(['', 'Saved', '', 'Saved']);
	});

	it('lets a different message overtake a pending repeat', () => {
		const a = createAnnouncer();
		a.announce('Saved');
		a.announce('Saved');
		a.announce('Other');
		vi.advanceTimersByTime(ANNOUNCE_REPEAT_MS * 2);
		expect(a.polite).toBe('Other');
	});

	it('removes a message after a while, so no stale text stays for browse mode', () => {
		const a = createAnnouncer();
		a.announce('Saved');
		vi.advanceTimersByTime(ANNOUNCE_CLEAR_MS - 1);
		expect(a.polite).toBe('Saved');
		vi.advanceTimersByTime(1);
		expect(a.polite).toBe('');
	});

	it('does not clear a newer message with the timer of an older one', () => {
		const a = createAnnouncer();
		a.announce('old');
		vi.advanceTimersByTime(ANNOUNCE_CLEAR_MS - 10);
		a.announce('new');
		vi.advanceTimersByTime(10);
		expect(a.polite).toBe('new');
		vi.advanceTimersByTime(ANNOUNCE_CLEAR_MS);
		expect(a.polite).toBe('');
	});

	it('empties both regions with clear() and drops pending repeats', () => {
		const a = createAnnouncer();
		a.announce('x');
		a.announce('x');
		a.announce('y', 'assertive');
		a.clear();
		vi.advanceTimersByTime(ANNOUNCE_CLEAR_MS * 2);
		expect([a.polite, a.assertive]).toEqual(['', '']);
	});

	it('notifies subscribers now and after every change, and stops after unsubscribe', () => {
		const a = createAnnouncer();
		let calls = 0;
		const off = a.subscribe(() => calls++);
		expect(calls).toBe(1);
		a.announce('x');
		expect(calls).toBe(2);
		off();
		a.announce('y');
		expect(calls).toBe(2);
	});

	it('survives a throwing subscriber', () => {
		const a = createAnnouncer();
		const errors: unknown[] = [];
		const original = globalThis.reportError;
		globalThis.reportError = (e: unknown) => void errors.push(e);
		let throwing = false;
		a.subscribe(() => {
			if (throwing) throw new Error('boom');
		});
		const calls: string[] = [];
		a.subscribe(() => calls.push(a.polite));
		throwing = true;
		a.announce('x');
		globalThis.reportError = original;
		expect(calls).toEqual(['', 'x']);
		expect(errors).toHaveLength(1);
	});
});

describe('hosts', () => {
	it('counts the mounted live-region components', () => {
		const a = createAnnouncer();
		expect(a.hosts).toBe(0);
		const one = a.attach();
		const two = a.attach();
		expect(a.hosts).toBe(2);
		one.release();
		one.release();
		expect(a.hosts).toBe(1);
		two.release();
		expect(a.hosts).toBe(0);
	});

	it('makes the first host primary; the next one takes over when it goes', () => {
		const a = createAnnouncer();
		const one = a.attach();
		const two = a.attach();
		expect([one.primary, two.primary]).toEqual([true, false]);
		one.release();
		expect(two.primary).toBe(true);
	});

	it('tells subscribers when a host comes or goes', () => {
		const a = createAnnouncer();
		const seen: number[] = [];
		a.subscribe(() => seen.push(a.hosts));
		const host = a.attach();
		host.release();
		expect(seen).toEqual([0, 1, 0]);
	});
});

describe('the shared announcer', () => {
	it('is one object on a well-known global, so both builds speak through the same regions', () => {
		const g = globalThis as typeof globalThis & Record<symbol, unknown>;
		const shared = sharedAnnouncer();
		expect(g[Symbol.for('kern.announcer')]).toBe(shared);
		expect(sharedAnnouncer()).toBe(sharedAnnouncer());
	});

	it('is a different object from an isolated one', () => {
		const isolated: Announcer = createAnnouncer();
		isolated.announce('only here');
		expect(sharedAnnouncer().polite).not.toBe('only here');
	});
});
