/**
 * Toaster and the `toast()` API (stuffcloud: toast.test.ts "ToastRegion"; its `Toaster` class cases are
 * kern's framework-free queue, tested in tests/unit/toast-queue.test.ts). Here: the rendered live regions,
 * tone routing, dismiss / undo / action buttons, the pause on hover, focus and hidden tab, and focus return.
 */
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Toaster from '../../src/lib/components/Toaster.svelte';
import { createToastQueue, dismissToast, toast, toasts } from '../../src/lib/components/toast.svelte.js';

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	toast.clear();
	vi.useRealTimers();
	vi.restoreAllMocks();
});

const user = (): ReturnType<typeof userEvent.setup> => userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });
const texts = (el: HTMLElement): string => el.textContent;

describe('Toaster', () => {
	it('renders an empty named region with both live regions present from the start', () => {
		render(Toaster, { queue: createToastQueue() });
		expect(screen.getByRole('region', { name: 'Notifications' })).toBeTruthy();
		expect(screen.getByRole('status')).toBeTruthy();
		expect(screen.getByRole('alert')).toBeTruthy();
		expect(document.querySelectorAll('.toast')).toHaveLength(0);
	});

	it('puts danger in the alert region and every other tone in the status region', async () => {
		const queue = createToastQueue();
		render(Toaster, { queue });
		queue.add({ message: 'saved', tone: 'ok' });
		queue.add({ message: 'heads up', tone: 'warn' });
		queue.add('note');
		queue.add({ message: 'broken', tone: 'danger' });
		await vi.waitFor(() => expect(texts(screen.getByRole('alert'))).toContain('broken'));
		const status = texts(screen.getByRole('status'));
		for (const message of ['saved', 'heads up', 'note']) expect(status).toContain(message);
		expect(status).not.toContain('broken');
		expect(texts(screen.getByRole('alert'))).not.toContain('saved');
	});

	it('shows the title above the message and marks the tone', async () => {
		const queue = createToastQueue();
		render(Toaster, { queue });
		queue.add({ title: 'Upload', message: 'Finished', tone: 'warn' });
		await vi.waitFor(() => expect(document.querySelector('.toast')).not.toBeNull());
		const el = document.querySelector('.toast');
		expect(el?.getAttribute('data-tone')).toBe('warn');
		expect(el?.querySelector('.title')?.textContent).toBe('Upload');
		expect(el?.querySelector('.msg')?.textContent).toBe('Finished');
	});

	it('removes a toast when its time runs out', async () => {
		const queue = createToastQueue();
		render(Toaster, { queue });
		queue.add({ message: 'gone soon', duration: 1000 });
		await screen.findByText('gone soon');
		await vi.advanceTimersByTimeAsync(1000);
		await vi.waitFor(() => expect(screen.queryByText('gone soon')).toBeNull());
	});

	it('dismisses with the button, which has an accessible name, and reports it', async () => {
		const ondismiss = vi.fn();
		const onclose = vi.fn();
		const queue = createToastQueue();
		render(Toaster, { queue, ondismiss });
		queue.add({ message: 'bye', onclose });
		await user().click(await screen.findByRole('button', { name: 'Dismiss' }));
		expect(queue.items).toHaveLength(0);
		expect(onclose).toHaveBeenCalledExactlyOnceWith('dismiss');
		expect(ondismiss).toHaveBeenCalledTimes(1);
		expect(ondismiss.mock.calls[0]?.[0]).toMatchObject({ message: 'bye' });
		await vi.waitFor(() => expect(screen.queryByText('bye')).toBeNull());
	});

	it('undo closes without committing, an action runs and commits, both report to the Toaster', async () => {
		const onundo = vi.fn();
		const oncommit = vi.fn();
		const toasterUndo = vi.fn();
		const toasterAction = vi.fn();
		const run = vi.fn();
		const queue = createToastQueue();
		render(Toaster, { queue, onundo: toasterUndo, onaction: toasterAction });
		queue.add({ message: 'deleted', onundo, oncommit });
		await user().click(await screen.findByRole('button', { name: 'Undo' }));
		expect(onundo).toHaveBeenCalledTimes(1);
		expect(oncommit).not.toHaveBeenCalled();
		expect(toasterUndo).toHaveBeenCalledTimes(1);

		queue.add({ message: 'renamed', action: { label: 'Open', onclick: run }, oncommit });
		await user().click(await screen.findByRole('button', { name: 'Open' }));
		expect(run).toHaveBeenCalledTimes(1);
		expect(oncommit).toHaveBeenCalledTimes(1);
		expect(toasterAction).toHaveBeenCalledTimes(1);
	});

	it('takes custom labels for the region, the dismiss button and the undo button', async () => {
		const queue = createToastQueue();
		render(Toaster, { queue, label: 'Meldungen', dismissLabel: 'Schliessen', undoLabel: 'Rueckgaengig' });
		queue.add({ message: 'x', onundo: () => undefined });
		expect(screen.getByRole('region', { name: 'Meldungen' })).toBeTruthy();
		expect(await screen.findByRole('button', { name: 'Schliessen' })).toBeTruthy();
		expect(screen.getByRole('button', { name: 'Rueckgaengig' })).toBeTruthy();
	});

	it('pauses on hover and resumes when the pointer leaves', async () => {
		const queue = createToastQueue();
		render(Toaster, { queue });
		queue.add({ message: 'hold', duration: 1000 });
		const message = await screen.findByText('hold');
		const pointer = user();
		await pointer.hover(message);
		await vi.advanceTimersByTimeAsync(5000);
		expect(queue.items).toHaveLength(1);
		await pointer.unhover(message);
		await vi.advanceTimersByTimeAsync(1000);
		expect(queue.items).toHaveLength(0);
	});

	it('pauses while a button inside has keyboard focus and resumes on blur', async () => {
		const queue = createToastQueue();
		render(Toaster, { queue });
		queue.add({ message: 'focus me', duration: 1000 });
		await screen.findByText('focus me');
		const keys = user();
		await keys.tab();
		expect(document.activeElement?.getAttribute('aria-label')).toBe('Dismiss');
		await vi.advanceTimersByTimeAsync(5000);
		expect(queue.items).toHaveLength(1);
		await keys.tab();
		await vi.advanceTimersByTimeAsync(1000);
		expect(queue.items).toHaveLength(0);
	});

	it('keeps the timer paused while focus moves between the buttons of one toast', async () => {
		const queue = createToastQueue();
		render(Toaster, { queue });
		queue.add({ message: 'two buttons', duration: 1000, onundo: () => undefined });
		await screen.findByText('two buttons');
		const keys = user();
		await keys.tab();
		await keys.tab();
		await vi.advanceTimersByTimeAsync(5000);
		expect(queue.items).toHaveLength(1);
	});

	it('pauses while the tab is hidden and continues when it is visible again', async () => {
		const queue = createToastQueue();
		const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
		render(Toaster, { queue });
		queue.add({ message: 'background', duration: 1000 });
		await screen.findByText('background');
		await vi.advanceTimersByTimeAsync(5000);
		expect(queue.items).toHaveLength(1);
		visibility.mockReturnValue('visible');
		document.dispatchEvent(new Event('visibilitychange'));
		await vi.advanceTimersByTimeAsync(1000);
		expect(queue.items).toHaveLength(0);
	});

	it('after a keyboard dismiss focus moves to the next toast, and back to where it came from after the last one', async () => {
		const queue = createToastQueue();
		const outside = document.createElement('button');
		document.body.append(outside);
		render(Toaster, { queue });
		queue.add({ message: 'first', duration: 0 });
		queue.add({ message: 'second', duration: 0 });
		await screen.findByText('second');
		const keys = user();
		outside.focus();
		await keys.tab();
		const [firstButton, secondButton] = screen.getAllByRole('button', { name: 'Dismiss' });
		expect(document.activeElement).toBe(firstButton);
		await keys.keyboard('{Enter}');
		await vi.waitFor(() => expect(document.activeElement).toBe(secondButton));
		await keys.keyboard('{Enter}');
		await vi.waitFor(() => expect(document.activeElement).toBe(outside));
		outside.remove();
	});

	it('a mouse dismiss leaves the focus alone', async () => {
		const queue = createToastQueue();
		render(Toaster, { queue });
		queue.add({ message: 'one', duration: 0 });
		queue.add({ message: 'two', duration: 0 });
		await screen.findByText('two');
		const [first] = screen.getAllByRole('button', { name: 'Dismiss' });
		if (first) await user().click(first);
		await vi.waitFor(() => expect(screen.queryByText('one')).toBeNull());
		expect(document.activeElement).not.toBe(screen.getByRole('button', { name: 'Dismiss' }));
	});

	it('uses the shared queue by default: toast() reaches every Toaster, `toasts` mirrors it', async () => {
		render(Toaster, {});
		const id = toast('shared');
		expect(toasts.map((t) => t.message)).toContain('shared');
		expect(await screen.findByText('shared')).toBeTruthy();
		dismissToast(id);
		await vi.waitFor(() => expect(screen.queryByText('shared')).toBeNull());
		expect(toasts).toHaveLength(0);
	});

	it('toast.ok / warn / danger set the tone and toast.clear closes everything with `cleared`', async () => {
		const onclose = vi.fn();
		render(Toaster, {});
		toast.ok('fine', { onclose });
		toast.warn('careful');
		toast.danger('bad');
		toast({ message: 'defaults', duration: undefined, tone: undefined });
		await screen.findByText('bad');
		expect(toasts.map((t) => t.tone)).toEqual(['ok', 'warn', 'danger', 'info']);
		toast.clear();
		expect(onclose).toHaveBeenCalledExactlyOnceWith('cleared');
		await vi.waitFor(() => expect(document.querySelectorAll('.toast')).toHaveLength(0));
	});

	it('an isolated queue does not show shared toasts and vice versa', async () => {
		const queue = createToastQueue();
		render(Toaster, { queue });
		toast('on the shared queue');
		queue.add('on the private queue');
		await screen.findByText('on the private queue');
		expect(screen.queryByText('on the shared queue')).toBeNull();
	});

	it('follows a replaced queue prop', async () => {
		const first = createToastQueue();
		const second = createToastQueue();
		const { rerender } = render(Toaster, { queue: first });
		first.add('one');
		await screen.findByText('one');
		await rerender({ queue: second });
		await vi.waitFor(() => expect(screen.queryByText('one')).toBeNull());
		second.add('two');
		expect(await screen.findByText('two')).toBeTruthy();
	});

	it('max limits the open toasts and the oldest closes as replaced', async () => {
		const onclose = vi.fn();
		const queue = createToastQueue();
		render(Toaster, { queue, max: 2 });
		queue.add({ message: 'a', duration: 0, onclose });
		queue.add({ message: 'b', duration: 0 });
		queue.add({ message: 'c', duration: 0 });
		await vi.waitFor(() => expect(queue.items.map((t) => t.message)).toEqual(['b', 'c']));
		expect(onclose).toHaveBeenCalledExactlyOnceWith('replaced');
	});

	it('position is a data attribute for the theme', () => {
		render(Toaster, { queue: createToastQueue(), position: 'top-left' });
		expect(document.querySelector('.k-toaster')?.getAttribute('data-pos')).toBe('top-left');
	});

	it('stops listening to the queue when it unmounts', async () => {
		const queue = createToastQueue();
		const { unmount } = render(Toaster, { queue });
		unmount();
		queue.add('after unmount');
		await Promise.resolve();
		expect(screen.queryByText('after unmount')).toBeNull();
	});
});
