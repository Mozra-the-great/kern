/**
 * Toast queue (#43, #44), node side: the cases of stuffcloud's `toast.test.ts` (default durations,
 * pause/resume with the time that was left, limit, clear) and nagellacke's Snackbar contract
 * (undo vs. commit, exactly once, replace commits the outgoing toast). The rendered regions,
 * hover/focus pause and the custom-element path are tested by tests/elements/feedback.spec.ts.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	createToastQueue,
	sharedToastQueue,
	TOAST_DURATIONS,
	TOAST_MAX,
	type ToastCloseReason,
	type ToastQueue
} from '../../src/lib/components/toast-queue.js';

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
});

const messages = (q: ToastQueue) => q.items.map((t) => t.message);

describe('toast queue', () => {
	it('has the documented default durations: danger stays until dismissed', () => {
		expect(TOAST_DURATIONS).toEqual({ info: 6000, ok: 6000, warn: 10_000, danger: 0 });
		expect(TOAST_MAX).toBe(5);
	});

	it('adds toasts with increasing ids and the info tone by default', () => {
		const q = createToastQueue();
		const a = q.add('one');
		const b = q.add({ message: 'two', title: 'T' });
		expect(b).toBe(a + 1);
		expect(q.items).toEqual([
			{ id: a, message: 'one', tone: 'info', duration: 6000 },
			{ id: b, message: 'two', title: 'T', tone: 'info', duration: 6000 }
		]);
	});

	it.each([
		['info', 6000],
		['ok', 6000],
		['warn', 10_000]
	] as const)('closes a %s toast after its default time, not before', (tone, ms) => {
		const q = createToastQueue();
		q.add({ message: 'm', tone });
		vi.advanceTimersByTime(ms - 1);
		expect(q.items).toHaveLength(1);
		vi.advanceTimersByTime(1);
		expect(q.items).toHaveLength(0);
	});

	it('keeps a danger toast until it is dismissed', () => {
		const q = createToastQueue();
		const id = q.add({ message: 'bad', tone: 'danger' });
		vi.advanceTimersByTime(24 * 60 * 60 * 1000);
		expect(q.items).toHaveLength(1);
		q.dismiss(id);
		expect(q.items).toHaveLength(0);
	});

	it('honours an explicit duration; 0, negative and Infinity mean sticky, NaN the default', () => {
		const q = createToastQueue({ max: 10 });
		q.add({ message: 'short', duration: 100 });
		q.add({ message: 'sticky', duration: 0 });
		q.add({ message: 'danger with timer', tone: 'danger', duration: 200 });
		q.add({ message: 'infinite', duration: Infinity });
		q.add({ message: 'negative', duration: -5 });
		q.add({ message: 'nan', duration: Number.NaN });
		vi.advanceTimersByTime(100);
		expect(messages(q)).toEqual(['sticky', 'danger with timer', 'infinite', 'negative', 'nan']);
		vi.advanceTimersByTime(100);
		expect(messages(q)).toEqual(['sticky', 'infinite', 'negative', 'nan']);
		vi.advanceTimersByTime(5800);
		expect(messages(q)).toEqual(['sticky', 'infinite', 'negative']);
	});

	it('dismiss removes one toast, cancels its timer and ignores unknown ids', () => {
		const q = createToastQueue();
		const keep = q.add('keep');
		const drop = q.add('drop');
		q.dismiss(drop);
		q.dismiss(999);
		expect(messages(q)).toEqual(['keep']);
		expect(vi.getTimerCount()).toBe(1);
		q.dismiss(keep);
		expect(vi.getTimerCount()).toBe(0);
	});

	it('clear removes everything and every timer', () => {
		const q = createToastQueue();
		q.add('a');
		q.add({ message: 'b', tone: 'danger' });
		q.add({ message: 'c', tone: 'warn' });
		q.clear();
		expect(q.items).toEqual([]);
		expect(vi.getTimerCount()).toBe(0);
	});

	it('pause stops the countdown and resume continues with the time that was left', () => {
		const q = createToastQueue();
		const id = q.add({ message: 'm', duration: 1000 });
		vi.advanceTimersByTime(400);
		q.pause(id);
		vi.advanceTimersByTime(60_000);
		expect(q.items).toHaveLength(1);
		q.resume(id);
		vi.advanceTimersByTime(599);
		expect(q.items).toHaveLength(1);
		vi.advanceTimersByTime(1);
		expect(q.items).toHaveLength(0);
	});

	it('pauses nest (hover and focus at once); unknown ids, sticky toasts and extra resumes are ignored', () => {
		const q = createToastQueue();
		const id = q.add({ message: 'm', duration: 1000 });
		const sticky = q.add({ message: 's', tone: 'danger' });
		vi.advanceTimersByTime(300);
		q.pause(id);
		q.pause(id);
		q.pause(999);
		q.pause(sticky);
		q.resume(id);
		vi.advanceTimersByTime(5000);
		expect(messages(q)).toEqual(['m', 's']);
		q.resume(id);
		q.resume(id);
		q.resume(999);
		q.resume(sticky);
		vi.advanceTimersByTime(699);
		expect(messages(q)).toEqual(['m', 's']);
		vi.advanceTimersByTime(1);
		expect(messages(q)).toEqual(['s']);
	});

	it('never lets the time left go below zero', () => {
		const q = createToastQueue();
		const id = q.add({ message: 'm', duration: 100 });
		vi.setSystemTime(Date.now() + 10_000);
		q.pause(id);
		q.resume(id);
		vi.advanceTimersByTime(0);
		expect(q.items).toHaveLength(0);
	});

	it(`closes the oldest toast beyond ${TOAST_MAX} with reason "replaced"`, () => {
		const q = createToastQueue();
		const reasons: ToastCloseReason[] = [];
		for (let i = 1; i <= TOAST_MAX + 2; i++) q.add({ message: `m${i}`, duration: 0, onclose: (r) => reasons.push(r) });
		expect(q.items).toHaveLength(TOAST_MAX);
		expect(messages(q)[0]).toBe('m3');
		expect(messages(q).at(-1)).toBe(`m${TOAST_MAX + 2}`);
		expect(reasons).toEqual(['replaced', 'replaced']);
	});

	it('a lower max closes the oldest at once; invalid values are ignored', () => {
		const q = createToastQueue();
		for (let i = 1; i <= 4; i++) q.add(`m${i}`);
		q.max = 2;
		expect(messages(q)).toEqual(['m3', 'm4']);
		q.max = 0;
		q.max = Number.NaN;
		expect(q.max).toBe(2);
		q.max = Infinity;
		for (let i = 5; i <= 9; i++) q.add(`m${i}`);
		expect(q.items).toHaveLength(7);
	});

	it('notifies subscribers now and after every change, until they unsubscribe', () => {
		const q = createToastQueue();
		const seen: number[] = [];
		const off = q.subscribe((items) => seen.push(items.length));
		q.add('a');
		q.add('b');
		q.dismiss(q.items[0]?.id ?? -1);
		off();
		q.clear();
		expect(seen).toEqual([0, 1, 2, 1]);
	});

	it('the shared queue is one instance on a well-known global', () => {
		const a = sharedToastQueue();
		expect(sharedToastQueue()).toBe(a);
		expect((globalThis as Record<symbol, unknown>)[Symbol.for('kern.toasts')]).toBe(a);
		expect(a.version).toBe(2);
	});
});

describe('close callbacks (nagellacke Snackbar contract)', () => {
	function undoable(q: ToastQueue, message: string, key?: string) {
		const log = { commit: 0, undo: 0, reasons: [] as ToastCloseReason[] };
		const id = q.add({
			message,
			key,
			duration: 3000,
			onundo: () => log.undo++,
			oncommit: () => log.commit++,
			onclose: (r) => log.reasons.push(r)
		});
		return { id, log };
	}

	it('show with undo, hover, timeout: commits exactly once', () => {
		const q = createToastQueue();
		const { id, log } = undoable(q, 'Deleted');
		vi.advanceTimersByTime(2000);
		q.pause(id); // hover
		vi.advanceTimersByTime(30_000);
		expect(log.commit).toBe(0);
		q.resume(id); // pointer leaves
		vi.advanceTimersByTime(1000);
		expect(q.items).toHaveLength(0);
		q.dismiss(id);
		q.clear();
		vi.advanceTimersByTime(10_000);
		expect(log).toEqual({ commit: 1, undo: 0, reasons: ['timeout'] });
	});

	it('show with undo, click undo: no commit, ever', () => {
		const q = createToastQueue();
		const { id, log } = undoable(q, 'Deleted');
		q.undo(id);
		q.dismiss(id);
		vi.advanceTimersByTime(10_000);
		q.clear();
		expect(log).toEqual({ commit: 0, undo: 1, reasons: ['undo'] });
	});

	it('show A, show B with the same key: A commits once, B stays', () => {
		const q = createToastQueue();
		const a = undoable(q, 'A', 'undo');
		const b = undoable(q, 'B', 'undo');
		expect(messages(q)).toEqual(['B']);
		expect(a.log).toEqual({ commit: 1, undo: 0, reasons: ['replaced'] });
		expect(b.log.commit).toBe(0);
		vi.advanceTimersByTime(3000);
		expect(a.log.commit).toBe(1);
		expect(b.log).toEqual({ commit: 1, undo: 0, reasons: ['timeout'] });
	});

	it('the outgoing toast commits before the new one is in the list', () => {
		const q = createToastQueue();
		let seen: string[] = [];
		q.add({ message: 'A', key: 'k', oncommit: () => (seen = messages(q)) });
		q.add({ message: 'B', key: 'k' });
		expect(seen).toEqual(['B']);
	});

	it('dismiss, action and clear commit once with their reason', () => {
		const q = createToastQueue();
		const d = undoable(q, 'd');
		const clicked = vi.fn();
		const commitA = vi.fn();
		const closeA = vi.fn();
		const a = q.add({ message: 'a', action: { label: 'Open', onclick: clicked }, oncommit: commitA, onclose: closeA });
		const c = undoable(q, 'c');
		q.dismiss(d.id);
		q.runAction(a);
		q.clear();
		q.clear();
		expect(d.log).toEqual({ commit: 1, undo: 0, reasons: ['dismiss'] });
		expect(clicked).toHaveBeenCalledOnce();
		expect(commitA).toHaveBeenCalledOnce();
		expect(closeA).toHaveBeenCalledExactlyOnceWith('action');
		expect(c.log).toEqual({ commit: 1, undo: 0, reasons: ['cleared'] });
	});

	it('runs callbacks after the toast is gone, and a throwing callback breaks nothing', () => {
		const q = createToastQueue();
		const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
		const later = vi.fn();
		let during: number | undefined;
		const id = q.add({
			message: 'x',
			oncommit: () => {
				during = q.items.length;
				throw new Error('boom');
			},
			onclose: later
		});
		q.dismiss(id);
		expect(during).toBe(0);
		expect(later).toHaveBeenCalledWith('dismiss');
		expect(q.items).toHaveLength(0);
		q.add('next');
		expect(q.items).toHaveLength(1);
		error.mockRestore();
	});
});
