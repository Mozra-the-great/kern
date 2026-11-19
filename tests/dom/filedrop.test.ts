/**
 * FileDrop (stuffcloud: dropzone.test.ts "FileDropzone"; `matchesAccept` / `splitFiles` are exercised in
 * tests/components/forms-content.test.ts). kern's FileDrop has two layouts (the zone is the button, or a
 * group with a separate `buttonLabel` button) and two modes (`field`: keeps the files, `dispatch`: only reports).
 * jsdom has no DragEvent or DataTransfer: drag events carry a plain `dataTransfer` object (helpers.ts).
 */
import { fireEvent, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import FileDrop from '../../src/lib/components/FileDrop.svelte';
import { dragEvent, fileOf, flush } from './helpers.js';
import { reactive } from './reactive.svelte.js';

function input(): HTMLInputElement {
	const element = document.querySelector('input[type="file"]');
	if (!(element instanceof HTMLInputElement)) throw new Error('no file input');
	return element;
}

/** The element that takes drag events: the wrapper of the zone button, or the group of the split layout. */
function zone(): HTMLElement {
	const element = document.querySelector<HTMLElement>('.drop');
	if (!element) throw new Error('no drop zone');
	return element;
}

const dragging = (): boolean => (document.querySelector('.zone')?.classList.contains('dragging') ?? false);

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe('FileDrop (zone is the button)', () => {
	it('is a labelled button with the prompt, and a hidden native input out of the tab order', () => {
		render(FileDrop, { label: 'Upload', accept: '.pdf', multiple: true });
		// The visible label names the zone; the prompt is its description.
		const button = screen.getByRole('button', { name: 'Upload', description: 'Drop files here or click to choose' });
		expect(button.classList.contains('zone')).toBe(true);
		expect(input().tabIndex).toBe(-1);
		expect(input().getAttribute('aria-hidden')).toBe('true');
		expect(input().accept).toBe('.pdf');
		expect(input().multiple).toBe(true);
	});

	it('picks the single-file prompt without multiple and a custom dropLabel over both', () => {
		const { unmount } = render(FileDrop, { multiple: false });
		expect(screen.getByRole('button', { name: 'Drop a file here or click to choose' })).toBeTruthy();
		unmount();
		render(FileDrop, { dropLabel: 'Hier ablegen' });
		expect(screen.getByRole('button', { name: 'Hier ablegen' })).toBeTruthy();
	});

	it('is not multiple by default', () => {
		render(FileDrop, {});
		expect(input().multiple).toBe(false);
	});

	it('the zone opens the file picker with mouse, Enter and Space', async () => {
		const user = userEvent.setup();
		render(FileDrop, {});
		const click = vi.spyOn(input(), 'click').mockImplementation(() => undefined);
		await user.click(screen.getByRole('button'));
		await user.keyboard('{Enter}');
		await user.keyboard(' ');
		expect(click).toHaveBeenCalledTimes(3);
	});

	it('reports the picked files, shows them in a list and announces the count', async () => {
		const onfiles = vi.fn();
		const props = reactive<{ onfiles: (files: File[]) => void; multiple: boolean; files: File[] | undefined }>({ onfiles, multiple: true, files: undefined });
		render(FileDrop, { props });
		const pdf = fileOf('a.pdf', 'application/pdf', 2048);
		await fireEvent.change(input(), { target: { files: [pdf] } });
		expect(onfiles).toHaveBeenCalledWith([pdf]);
		expect(props.files).toEqual([pdf]);
		const list = screen.getByRole('list', { name: 'Selected files' });
		expect(list.textContent).toContain('a.pdf');
		expect(list.textContent).toContain('2.0 KB');
		expect(screen.getByRole('status').textContent).toBe('Files selected: 1');
	});

	it('ignores an empty selection', async () => {
		const onfiles = vi.fn();
		render(FileDrop, { onfiles });
		await fireEvent.change(input(), { target: { files: [] } });
		expect(onfiles).not.toHaveBeenCalled();
		expect(screen.queryByRole('list')).toBeNull();
	});

	it('adds to the list when several files are allowed, without duplicating the same file', async () => {
		const props = reactive<{ multiple: boolean; files: File[] | undefined }>({ multiple: true, files: undefined });
		render(FileDrop, { props });
		const a = fileOf('a.txt');
		const b = fileOf('b.txt');
		await fireEvent.change(input(), { target: { files: [a] } });
		await fireEvent.change(input(), { target: { files: [a, b] } });
		expect(props.files?.map((f) => f.name)).toEqual(['a.txt', 'b.txt']);
	});

	it('replaces the file when only one is allowed', async () => {
		const props = reactive<{ files: File[] | undefined }>({ files: undefined });
		render(FileDrop, { props });
		await fireEvent.change(input(), { target: { files: [fileOf('a.txt')] } });
		await fireEvent.change(input(), { target: { files: [fileOf('b.txt')] } });
		expect(props.files?.map((f) => f.name)).toEqual(['b.txt']);
	});

	it('delivers dropped files and reports the ones that do not match accept', async () => {
		const onfiles = vi.fn();
		const onreject = vi.fn();
		render(FileDrop, { accept: '.pdf', multiple: true, onfiles, onreject });
		const pdf = fileOf('a.pdf');
		const text = fileOf('b.txt');
		await fireEvent.drop(zone(), { dataTransfer: { files: [pdf, text] } });
		expect(onfiles).toHaveBeenCalledWith([pdf]);
		expect(onreject).toHaveBeenCalledWith([text]);
		// Refused files are reported before the accepted ones.
		expect(onreject.mock.invocationCallOrder[0]).toBeLessThan(onfiles.mock.invocationCallOrder[0] ?? 0);
	});

	it('shows a message per refused file (type, size) and marks the field invalid', async () => {
		render(FileDrop, { label: 'Upload', accept: '.pdf', maxSize: 1024, multiple: true });
		await fireEvent.drop(zone(), { dataTransfer: { files: [fileOf('b.txt'), fileOf('big.pdf', '', 4096)] } });
		const error = document.querySelector('.error')?.textContent ?? '';
		expect(error).toContain('b.txt is not an accepted file type.');
		expect(error).toContain('big.pdf is larger than 1.0 KB.');
		expect(screen.getByRole('button').classList.contains('invalid')).toBe(true);
		expect(screen.getByRole('status').textContent).toContain('is not an accepted file type');
	});

	it('rejectMessages=false leaves the messages to the host', async () => {
		const onreject = vi.fn();
		render(FileDrop, { accept: '.pdf', rejectMessages: false, onreject });
		await fireEvent.drop(zone(), { dataTransfer: { files: [fileOf('b.txt')] } });
		expect(onreject).toHaveBeenCalledTimes(1);
		expect(screen.queryByText(/not an accepted/)).toBeNull();
	});

	it('does not call onfiles when everything was rejected, and works without onreject', async () => {
		const onfiles = vi.fn();
		render(FileDrop, { accept: '.pdf', onfiles });
		await fireEvent.drop(zone(), { dataTransfer: { files: [fileOf('b.txt')] } });
		expect(onfiles).not.toHaveBeenCalled();
	});

	it('does not call onreject when nothing was rejected', async () => {
		const onreject = vi.fn();
		render(FileDrop, { accept: '.pdf', onreject });
		await fireEvent.drop(zone(), { dataTransfer: { files: [fileOf('a.pdf')] } });
		expect(onreject).not.toHaveBeenCalled();
	});

	it('without multiple only the first file of a drop is taken, the rest is rejected with the count message', async () => {
		const onfiles = vi.fn();
		const onreject = vi.fn();
		render(FileDrop, { multiple: false, onfiles, onreject });
		const first = fileOf('1.pdf');
		const second = fileOf('2.pdf');
		await fireEvent.drop(zone(), { dataTransfer: { files: [first, second] } });
		expect(onfiles).toHaveBeenCalledWith([first]);
		expect(onreject).toHaveBeenCalledWith([second]);
		expect(document.querySelector('.error')?.textContent).toContain('Only one file can be selected.');
	});

	it('ignores a drop without files', async () => {
		const onfiles = vi.fn();
		render(FileDrop, { onfiles });
		await fireEvent.drop(zone());
		await fireEvent.drop(zone(), { dataTransfer: { files: [] } });
		expect(onfiles).not.toHaveBeenCalled();
	});

	it('shows the drag state on dragover (copy cursor) and clears it on drop', async () => {
		render(FileDrop, {});
		const transfer = { dataTransfer: { files: [], dropEffect: 'none' } };
		const notCancelled = await fireEvent.dragOver(zone(), transfer);
		expect(notCancelled).toBe(false); // preventDefault: the drop is allowed
		expect(transfer.dataTransfer.dropEffect).toBe('copy');
		expect(dragging()).toBe(true);
		await fireEvent.drop(zone(), { dataTransfer: { files: [] } });
		expect(dragging()).toBe(false);
	});

	it('dragover without a dataTransfer still allows the drop', async () => {
		render(FileDrop, {});
		await fireEvent.dragOver(zone());
		expect(dragging()).toBe(true);
	});

	it('keeps the drag state while the pointer moves between children (enter/leave depth) and clears it on the last leave', async () => {
		render(FileDrop, {});
		await fireEvent.dragEnter(zone());
		await fireEvent.dragEnter(screen.getByRole('button'));
		await fireEvent(screen.getByRole('button'), dragEvent('dragleave'));
		expect(dragging()).toBe(true);
		await fireEvent(zone(), dragEvent('dragleave'));
		expect(dragging()).toBe(false);
	});

	it('when disabled: the zone and input are disabled and drops are neither accepted nor highlighted', async () => {
		const onfiles = vi.fn();
		render(FileDrop, { disabled: true, onfiles });
		expect(screen.getByRole<HTMLButtonElement>('button').disabled).toBe(true);
		expect(input().disabled).toBe(true);
		const transfer = { dataTransfer: { files: [], dropEffect: 'copy' } };
		await fireEvent.dragOver(zone(), transfer);
		expect(transfer.dataTransfer.dropEffect).toBe('none');
		expect(dragging()).toBe(false);
		await fireEvent.dragEnter(zone());
		expect(dragging()).toBe(false);
		await fireEvent.drop(zone(), { dataTransfer: { files: [fileOf('a.pdf')] } });
		expect(onfiles).not.toHaveBeenCalled();
	});

	it('removes a file from the list, announces the new count and focuses the next remove button', async () => {
		const user = userEvent.setup();
		const onfiles = vi.fn();
		render(FileDrop, { multiple: true, files: [fileOf('a.txt'), fileOf('b.txt'), fileOf('c.txt')], onfiles });
		await user.click(screen.getByRole('button', { name: 'Remove b.txt' }));
		expect(screen.queryByText('b.txt')).toBeNull();
		expect(onfiles).toHaveBeenLastCalledWith(expect.arrayContaining([expect.objectContaining({ name: 'a.txt' })]));
		await vi.waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Remove c.txt' })));
		expect(screen.getByRole('status').textContent).toBe('Files selected: 2');
		await user.click(screen.getByRole('button', { name: 'Remove c.txt' }));
		await vi.waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Remove a.txt' })));
	});

	it('focus returns to the zone when the last file is removed', async () => {
		const user = userEvent.setup();
		render(FileDrop, { files: [fileOf('a.txt')] });
		await user.click(screen.getByRole('button', { name: 'Remove a.txt' }));
		await vi.waitFor(() => expect(document.activeElement).toBe(document.querySelector('.zone')));
		expect(screen.queryByRole('list')).toBeNull();
	});

	it('reset() clears files, messages and the status without reporting', async () => {
		const onfiles = vi.fn();
		const props = reactive<{ accept: string; multiple: boolean; files: File[] | undefined; onfiles: (files: File[]) => void }>({
			accept: '.pdf',
			multiple: true,
			files: undefined,
			onfiles
		});
		const { component } = render(FileDrop, { props });
		await fireEvent.drop(zone(), { dataTransfer: { files: [fileOf('a.pdf'), fileOf('b.txt')] } });
		expect(screen.getByRole('list')).toBeTruthy();
		onfiles.mockClear();
		(component as unknown as { reset: () => void }).reset();
		await vi.waitFor(() => expect(screen.queryByRole('list')).toBeNull());
		expect(props.files).toEqual([]);
		expect(screen.queryByText(/not an accepted/)).toBeNull();
		expect(onfiles).not.toHaveBeenCalled();
	});

	it('an error prop is announced and replaces the hint', () => {
		render(FileDrop, { label: 'Upload', hint: 'PDF only', error: 'Required' });
		expect(screen.getByRole('alert').textContent.trim()).toBe('Required');
		expect(screen.queryByText('PDF only')).toBeNull();
	});

	it('submits through the form: name and required go to the native input', () => {
		render(FileDrop, { name: 'attachments', required: true });
		expect(input().name).toBe('attachments');
		expect(input().required).toBe(true);
	});

	it('never reads file content: only name, type and size are looked at (files stay on the device)', async () => {
		const onfiles = vi.fn();
		render(FileDrop, { accept: '.pdf,image/*', onfiles });
		const spied = fileOf('a.pdf', 'application/pdf');
		const reads: string[] = [];
		for (const method of ['arrayBuffer', 'text', 'stream', 'slice', 'bytes']) {
			Object.defineProperty(spied, method, { value: (): void => void reads.push(method) });
		}
		const readerCalls = vi.spyOn(FileReader.prototype, 'readAsArrayBuffer');
		await fireEvent.drop(zone(), { dataTransfer: { files: [spied] } });
		expect(onfiles).toHaveBeenCalledWith([spied]);
		expect(reads).toEqual([]);
		expect(readerCalls).not.toHaveBeenCalled();
	});

	it('makes no network request', async () => {
		const fetchSpy = vi.fn();
		vi.stubGlobal('fetch', fetchSpy);
		render(FileDrop, {});
		await fireEvent.drop(zone(), { dataTransfer: { files: [fileOf('a.pdf')] } });
		expect(fetchSpy).not.toHaveBeenCalled();
	});
});

describe('FileDrop (split layout with a button)', () => {
	const base = { label: 'Attachments', buttonLabel: 'Choose files' } as const;

	it('is a group named by label and prompt, with a real button', () => {
		render(FileDrop, { ...base, multiple: true });
		expect(screen.getByRole('group', { name: 'Attachments Drop files here' })).toBeTruthy();
		expect(screen.getByRole('button', { name: 'Choose files' })).toBeTruthy();
	});

	it('the button opens the file picker, also from the keyboard', async () => {
		const user = userEvent.setup();
		render(FileDrop, base);
		const click = vi.spyOn(input(), 'click').mockImplementation(() => undefined);
		await user.click(screen.getByRole('button', { name: 'Choose files' }));
		await user.keyboard('{Enter}');
		await user.keyboard(' ');
		expect(click).toHaveBeenCalledTimes(3);
	});

	it('delivers a drop on the group and clears the drag state', async () => {
		const onfiles = vi.fn();
		render(FileDrop, { ...base, onfiles });
		await fireEvent.dragOver(zone());
		expect(zone().classList.contains('dragging')).toBe(true);
		const pdf = fileOf('a.pdf');
		await fireEvent.drop(zone(), { dataTransfer: { files: [pdf] } });
		expect(zone().classList.contains('dragging')).toBe(false);
		expect(onfiles).toHaveBeenCalledWith([pdf]);
	});

	it('disabled disables the button and ignores drops', async () => {
		const onfiles = vi.fn();
		render(FileDrop, { ...base, disabled: true, onfiles });
		expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Choose files' }).disabled).toBe(true);
		await fireEvent.drop(zone(), { dataTransfer: { files: [fileOf('a.pdf')] } });
		await flush();
		expect(onfiles).not.toHaveBeenCalled();
	});
});

describe('FileDrop (dispatch mode)', () => {
	it('reports files without keeping them: no list, no form name, status announces the count', async () => {
		const onfiles = vi.fn();
		render(FileDrop, { mode: 'dispatch', name: 'ignored', required: true, onfiles });
		const pdf = fileOf('a.pdf');
		await fireEvent.drop(zone(), { dataTransfer: { files: [pdf] } });
		expect(onfiles).toHaveBeenCalledWith([pdf]);
		expect(screen.queryByRole('list')).toBeNull();
		expect(input().hasAttribute('name')).toBe(false);
		expect(input().required).toBe(false);
		expect(screen.getByRole('status').textContent).toBe('Files selected: 1');
	});

	it('reports every drop again, also the same file twice', async () => {
		const onfiles = vi.fn();
		render(FileDrop, { mode: 'dispatch', multiple: true, onfiles });
		const pdf = fileOf('a.pdf');
		await fireEvent.drop(zone(), { dataTransfer: { files: [pdf] } });
		await fireEvent.drop(zone(), { dataTransfer: { files: [pdf] } });
		expect(onfiles).toHaveBeenCalledTimes(2);
	});
});
