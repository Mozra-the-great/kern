/**
 * DownloadButton in jsdom: what a click saves (text, blob, `getContent` with its sync, async and failing forms),
 * the callbacks, the busy state with the focus kept on the button, the icon and its reset, and the two live
 * regions (filled after a pause, emptied on the next click, a slow earlier click never overwrites a later one).
 * jsdom has no object URLs: `URL.createObjectURL` is stubbed and the click on the temporary link is recorded.
 * The real download in a browser is tests/elements/download.spec.ts; markup is tests/components.
 */
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import DownloadButton from '../../src/lib/components/DownloadButton.svelte';
import type { DownloadContent } from '../../src/lib/components/DownloadButton.svelte';
import type { DownloadError, DownloadOk } from '../../src/lib/components/download.js';
import { flush } from './helpers.js';

let created: Blob[];
let downloads: string[];
let clickSpy: MockInstance<() => void>;
const original = { create: URL.createObjectURL, revoke: URL.revokeObjectURL };

beforeEach(() => {
	created = [];
	downloads = [];
	Object.defineProperty(URL, 'createObjectURL', {
		configurable: true,
		writable: true,
		value: (blob: Blob): string => {
			created.push(blob);
			return `blob:test/${String(created.length)}`;
		}
	});
	Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, writable: true, value: (): void => undefined });
	clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
		downloads.push(this.download);
	});
});

afterEach(() => {
	clickSpy.mockRestore();
	Object.defineProperty(URL, 'createObjectURL', { configurable: true, writable: true, value: original.create });
	Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, writable: true, value: original.revoke });
});

const statusText = (): string => screen.getByRole('status').textContent.trim();
const alertText = (): string => screen.getByRole('alert').textContent.trim();
const root = (): HTMLElement => document.querySelector<HTMLElement>('.k-download-button') as HTMLElement;

/** A promise the test settles by hand. */
function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void; reject: (reason: unknown) => void } {
	let resolve: (value: T) => void = () => undefined;
	let reject: (reason: unknown) => void = () => undefined;
	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return { promise, resolve, reject };
}

describe('DownloadButton', () => {
	it('saves the text under the fallback name, calls ondownload and announces the start after a pause', async () => {
		const user = userEvent.setup();
		const ondownload = vi.fn<(result: DownloadOk) => void>();
		render(DownloadButton, { text: 'hello', ondownload });
		const button = screen.getByRole('button', { name: 'Download' });
		expect(button.getAttribute('title')).toBe('Download');
		expect(root().dataset.variant).toBe('ghost');
		expect(root().dataset.status).toBe('idle');
		await user.click(button);
		expect(downloads).toEqual(['download']);
		expect(created[0]?.type).toBe('text/plain;charset=utf-8');
		expect(await created[0]?.text()).toBe('hello');
		expect(ondownload).toHaveBeenCalledWith({ ok: true, name: 'download', size: 5, type: 'text/plain;charset=utf-8' });
		expect(root().dataset.status).toBe('started');
		expect(statusText()).toBe('');
		await vi.waitFor(() => expect(statusText()).toBe('Download started'));
		expect(alertText()).toBe('');
	});

	it('uses name and type for text, and the icon goes back to idle after resetAfter while the message stays', async () => {
		const user = userEvent.setup();
		render(DownloadButton, { text: 'a,b', name: 'report.csv', type: 'text/csv', resetAfter: 20 });
		await user.click(screen.getByRole('button'));
		expect(downloads).toEqual(['report.csv']);
		expect(created[0]?.type).toBe('text/csv;charset=utf-8');
		expect(document.querySelector('svg path')?.getAttribute('d')).toBe('M4 10.5l4 4 8-9');
		await vi.waitFor(() => expect(root().dataset.status).toBe('idle'));
		expect(document.querySelector('svg path')?.getAttribute('d')).toBe('M10 3v10M5.5 8.5L10 13l4.5-4.5M3 17h14');
		expect(statusText()).toBe('Download started');
	});

	it('a negative resetAfter resets at once', async () => {
		const user = userEvent.setup();
		render(DownloadButton, { text: 'x', resetAfter: -100 });
		await user.click(screen.getByRole('button'));
		await vi.waitFor(() => expect(root().dataset.status).toBe('idle'));
	});

	it('a blob wins over text and keeps its own type unless type is set', async () => {
		const user = userEvent.setup();
		const ondownload = vi.fn<(result: DownloadOk) => void>();
		const props = { blob: new Blob(['bytes'], { type: 'application/octet-stream' }), text: 'ignored', name: 'a.bin', ondownload };
		const { rerender } = render(DownloadButton, props);
		await user.click(screen.getByRole('button'));
		expect(created[0]?.type).toBe('application/octet-stream');
		expect(await created[0]?.text()).toBe('bytes');
		await rerender({ ...props, type: 'image/png' });
		await user.click(screen.getByRole('button'));
		expect(created[1]?.type).toBe('image/png');
		await rerender({ ...props, type: '' });
		await user.click(screen.getByRole('button'));
		expect(created[2]?.type).toBe('application/octet-stream');
		expect(ondownload).toHaveBeenCalledTimes(3);
	});

	it('getContent wins over blob and text and may return a string or a blob', async () => {
		const user = userEvent.setup();
		let next: DownloadContent = 'made';
		const getContent = vi.fn(() => next);
		render(DownloadButton, { getContent, text: 'ignored', blob: new Blob(['ignored']) });
		await user.click(screen.getByRole('button'));
		expect(await created[0]?.text()).toBe('made');
		next = new Blob(['blob made'], { type: 'text/csv' });
		await user.click(screen.getByRole('button'));
		expect(await created[1]?.text()).toBe('blob made');
		expect(getContent).toHaveBeenCalledTimes(2);
	});

	it('shows a spinner while a promise is pending, ignores clicks and gives the focus back to the button', async () => {
		const user = userEvent.setup();
		const pending = deferred<DownloadContent>();
		const getContent = vi.fn(() => pending.promise);
		const ondownload = vi.fn<(result: DownloadOk) => void>();
		render(DownloadButton, { getContent, ondownload, showLabel: true, label: 'Export' });
		const button = screen.getByRole('button', { name: 'Export' });
		await user.click(button);
		expect(root().dataset.status).toBe('busy');
		expect(button.getAttribute('aria-busy')).toBe('true');
		expect(button.hasAttribute('disabled')).toBe(true);
		expect(document.querySelector('svg')).toBeNull();
		button.click();
		expect(getContent).toHaveBeenCalledTimes(1);
		pending.resolve('done');
		await vi.waitFor(() => expect(ondownload).toHaveBeenCalledTimes(1));
		await vi.waitFor(() => expect(document.activeElement).toBe(button));
		expect(root().dataset.status).toBe('started');
		expect(button.hasAttribute('disabled')).toBe(false);
	});

	it('does not move the focus when it was elsewhere when the promise settled', async () => {
		const pending = deferred<DownloadContent>();
		render(DownloadButton, { getContent: () => pending.promise });
		const button = screen.getByRole('button');
		button.click();
		await vi.waitFor(() => expect(root().dataset.status).toBe('busy'));
		pending.resolve('done');
		await vi.waitFor(() => expect(root().dataset.status).toBe('started'));
		await flush();
		expect(document.activeElement).toBe(document.body);
	});

	it('a function that throws or rejects reports a content error with the cause, shown and announced', async () => {
		const user = userEvent.setup();
		const onerror = vi.fn<(error: DownloadError) => void>();
		const boom = new Error('broken');
		let fail: () => DownloadContent | Promise<DownloadContent> = () => {
			throw boom;
		};
		render(DownloadButton, { getContent: () => fail(), onerror, errorLabel: 'Could not export' });
		await user.click(screen.getByRole('button'));
		expect(onerror).toHaveBeenLastCalledWith({ code: 'content', message: 'broken', cause: boom });
		expect(root().dataset.status).toBe('error');
		expect(document.querySelector('svg path')?.getAttribute('d')).toBe('M5 5l10 10M15 5L5 15');
		await vi.waitFor(() => expect(alertText()).toBe('Could not export'));
		expect(document.querySelectorAll('.line')[1]?.classList.contains('has')).toBe(true);
		fail = () => Promise.reject(new Error('later'));
		await user.click(screen.getByRole('button'));
		expect(alertText()).toBe('');
		await vi.waitFor(() => expect(onerror).toHaveBeenCalledTimes(2));
		expect(onerror.mock.calls[1]?.[0].message).toBe('later');
		fail = () => {
			throw 'plain';
		};
		await user.click(screen.getByRole('button'));
		expect(onerror).toHaveBeenLastCalledWith({ code: 'content', message: 'plain', cause: 'plain' });
		expect(downloads).toEqual([]);
	});

	it('something other than a string or a blob is a content error, and nothing at all says so', async () => {
		const user = userEvent.setup();
		const onerror = vi.fn<(error: DownloadError) => void>();
		const props: { getContent?: () => DownloadContent; onerror: typeof onerror } = {
			getContent: () => 42 as unknown as DownloadContent,
			onerror
		};
		const { rerender } = render(DownloadButton, props);
		await user.click(screen.getByRole('button'));
		expect(onerror).toHaveBeenLastCalledWith({ code: 'content', message: '`getContent` must return a string or a Blob.' });
		await rerender({ onerror, getContent: undefined });
		await user.click(screen.getByRole('button'));
		expect(onerror).toHaveBeenLastCalledWith({ code: 'content', message: 'Nothing to download: set `text`, `blob` or `getContent`.' });
		await vi.waitFor(() => expect(alertText()).toBe('Download failed'));
	});

	it('reports a browser that refuses, with code failed', async () => {
		const user = userEvent.setup();
		const onerror = vi.fn<(error: DownloadError) => void>();
		const ondownload = vi.fn<(result: DownloadOk) => void>();
		Object.defineProperty(URL, 'createObjectURL', {
			configurable: true,
			writable: true,
			value: (): string => {
				throw new Error('refused');
			}
		});
		render(DownloadButton, { text: 'x', onerror, ondownload });
		await user.click(screen.getByRole('button'));
		expect(onerror.mock.calls[0]?.[0].code).toBe('failed');
		expect(ondownload).not.toHaveBeenCalled();
	});

	it('works without callbacks, also when it fails', async () => {
		const user = userEvent.setup();
		render(DownloadButton, { text: 'x' });
		await user.click(screen.getByRole('button'));
		expect(downloads).toHaveLength(1);
		const { unmount } = render(DownloadButton, { getContent: () => 1 as unknown as DownloadContent, label: 'Other' });
		await user.click(screen.getByRole('button', { name: 'Other' }));
		await vi.waitFor(() => expect(screen.getByText('Download failed')).toBeTruthy());
		unmount();
	});

	it('a later click empties the messages and an earlier result never lands after it', async () => {
		const user = userEvent.setup();
		render(DownloadButton, { text: 'x', startedLabel: 'Saved', showStatus: true });
		const button = screen.getByRole('button');
		await user.click(button);
		await vi.waitFor(() => expect(statusText()).toBe('Saved'));
		expect(document.querySelector('.line')?.classList.contains('has')).toBe(true);
		expect(document.querySelector('.line')?.classList.contains('sr')).toBe(false);
		await user.click(button);
		expect(statusText()).toBe('');
		await user.click(button);
		await vi.waitFor(() => expect(statusText()).toBe('Saved'));
		expect(downloads).toHaveLength(3);
	});

	it('the success line is visually hidden without showStatus', () => {
		render(DownloadButton, { text: 'x', showStatus: false });
		expect(document.querySelector('.line')?.classList.contains('sr')).toBe(true);
	});

	it('renders the label, size, variant, class and disabled state it is given', () => {
		render(DownloadButton, {
			text: 'x',
			label: 'Save',
			showLabel: true,
			size: 'lg',
			variant: 'accent',
			disabled: true,
			class: 'extra'
		});
		const button = screen.getByRole('button', { name: 'Save' });
		expect(button.hasAttribute('aria-label')).toBe(false);
		expect(button.dataset.size).toBe('lg');
		expect(button.dataset.variant).toBe('accent');
		expect(button.hasAttribute('disabled')).toBe(true);
		expect(root().classList.contains('extra')).toBe(true);
		expect(screen.getByText('Save').classList.contains('text')).toBe(true);
	});

	it('does nothing after it was unmounted while the content was made or the message was waiting', async () => {
		const pending = deferred<DownloadContent>();
		const ondownload = vi.fn<(result: DownloadOk) => void>();
		const first = render(DownloadButton, { getContent: () => pending.promise, ondownload });
		screen.getByRole('button').click();
		first.unmount();
		pending.resolve('late');
		await flush();
		expect(ondownload).not.toHaveBeenCalled();
		const second = render(DownloadButton, { text: 'x' });
		screen.getByRole('button').click();
		const region = screen.getByRole('status');
		second.unmount();
		await new Promise((resolve) => setTimeout(resolve, 80));
		expect(region.textContent.trim()).toBe('');
	});

	it('a click that starts while another is still busy is ignored, so the result belongs to the first', async () => {
		const pending = deferred<DownloadContent>();
		const onerror = vi.fn<(error: DownloadError) => void>();
		render(DownloadButton, { getContent: () => pending.promise, onerror });
		const button = screen.getByRole('button');
		button.click();
		button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		pending.reject(new Error('nope'));
		await vi.waitFor(() => expect(onerror).toHaveBeenCalledTimes(1));
	});
});
