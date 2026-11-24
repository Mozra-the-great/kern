/**
 * Terminal in jsdom: the named group (label, then title, then the catalogue), prompts and output lines, the
 * typewriter (character by character with delay, speed and pause, the full text kept for assistive technology,
 * the box sized by the complete text, `oncomplete`, start when scrolled into view or at once, nothing under
 * reduced motion, restart when the lines change, stop when unmounted) and the copy button (Clipboard API, the
 * textarea fallback, a failed copy, the "Copied" state and its reset).
 */
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { tick } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Terminal, { type TerminalLine } from '../../src/lib/components/Terminal.svelte';
import { setMedia, triggerIntersection } from './env.js';

const lines: TerminalLine[] = [{ text: 'ls', output: 'a.txt' }, { prompt: '#', text: 'rm', output: ['gone', 'done'] }, { text: 'pwd' }];

const rowTexts = (scope: string): string[] =>
	Array.from(document.querySelectorAll(`${scope} .row`)).map((row) => row.textContent.replace(/\s+/g, ' ').trim());
const host = (): HTMLElement => document.querySelector<HTMLElement>('.k-terminal') as HTMLElement;

let writeText: ReturnType<typeof vi.fn<(text: string) => Promise<void>>>;
let execCommand: ReturnType<typeof vi.fn<(command: string) => boolean>>;
const clipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');

beforeEach(() => {
	writeText = vi.fn<(text: string) => Promise<void>>(() => Promise.resolve());
	execCommand = vi.fn<(command: string) => boolean>(() => true);
	Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
	Object.defineProperty(document, 'execCommand', { configurable: true, writable: true, value: execCommand });
});

afterEach(() => {
	if (clipboard) Object.defineProperty(navigator, 'clipboard', clipboard);
	else Reflect.deleteProperty(navigator, 'clipboard');
	Reflect.deleteProperty(document, 'execCommand');
	vi.useRealTimers();
});

describe('Terminal', () => {
	it('shows every command with its prompt, the output lines and a waiting prompt is not added', () => {
		render(Terminal, { lines });
		expect(screen.getByRole('group', { name: 'Terminal' })).toBe(host());
		expect(rowTexts('.body')).toEqual(['$ls', 'a.txt', '#rm', 'gone', 'done', '$pwd']);
		expect(document.querySelectorAll('.row.out')).toHaveLength(3);
		expect(document.querySelector('.title')).toBeNull();
		expect(screen.queryByRole('button')).toBeNull();
		expect(document.querySelector('.k-caret')).toBeNull();
	});

	it('is named by label, else by the title, and uses the prompt and class it is given', () => {
		const { unmount } = render(Terminal, { lines, title: 'deploy.sh', prompt: '>', class: 'extra' });
		expect(screen.getByRole('group', { name: 'deploy.sh' }).classList.contains('extra')).toBe(true);
		expect(screen.getByText('deploy.sh').classList.contains('title')).toBe(true);
		expect(rowTexts('.body')[0]).toBe('>ls');
		unmount();
		render(Terminal, { lines, title: 'deploy.sh', label: 'Deploy steps' });
		expect(screen.getByRole('group', { name: 'Deploy steps' })).toBeTruthy();
	});

	it('types the commands one after another once it is in view and calls oncomplete', async () => {
		vi.useFakeTimers();
		const oncomplete = vi.fn<() => void>();
		render(Terminal, { lines, typewriter: true, speed: 10, delay: 100, linePause: 40, oncomplete });
		await tick();
		// The full text stays available to assistive technology, the box is sized by it.
		expect(rowTexts('.sr')).toEqual(['$ls', 'a.txt', '#rm', 'gone', 'done', '$pwd']);
		expect(rowTexts('.size')).toEqual(['$ls', 'a.txt', '#rm', 'gone', 'done', '$pwd', '$']);
		expect(document.querySelector('.stack')?.getAttribute('aria-hidden')).toBe('true');
		expect(rowTexts('.live')).toEqual(['$']);
		await vi.advanceTimersByTimeAsync(500);
		expect(rowTexts('.live')).toEqual(['$']);
		triggerIntersection(host(), false);
		await vi.advanceTimersByTimeAsync(500);
		expect(rowTexts('.live')).toEqual(['$']);
		triggerIntersection(host(), true);
		await vi.advanceTimersByTimeAsync(100);
		expect(rowTexts('.live')).toEqual(['$l']);
		expect(document.querySelector('.live .k-caret')?.classList.contains('blink')).toBe(false);
		await vi.advanceTimersByTimeAsync(10);
		expect(rowTexts('.live')).toEqual(['$ls']);
		await vi.advanceTimersByTimeAsync(50);
		expect(rowTexts('.live')).toEqual(['$ls', 'a.txt', '#']);
		await vi.advanceTimersByTimeAsync(1000);
		expect(rowTexts('.live')).toEqual(['$ls', 'a.txt', '#rm', 'gone', 'done', '$pwd', '$']);
		expect(document.querySelector('.live .k-caret')?.classList.contains('blink')).toBe(true);
		expect(oncomplete).toHaveBeenCalledTimes(1);
	});

	it('starts at once without startInView, with the default timings and without oncomplete', async () => {
		vi.useFakeTimers();
		render(Terminal, { lines: [{ text: 'x' }], typewriter: true, startInView: false });
		await tick();
		await vi.advanceTimersByTimeAsync(299);
		expect(rowTexts('.live')).toEqual(['$']);
		await vi.advanceTimersByTimeAsync(1);
		expect(rowTexts('.live')).toEqual(['$x']);
		await vi.advanceTimersByTimeAsync(35 + 450 + 225);
		expect(rowTexts('.live')).toEqual(['$x', '$']);
	});

	it('clamps negative timings to zero', async () => {
		vi.useFakeTimers();
		const oncomplete = vi.fn<() => void>();
		render(Terminal, { lines, typewriter: true, startInView: false, speed: -1, delay: -1, linePause: -1, oncomplete });
		await tick();
		for (let i = 0; i < 40; i++) await vi.advanceTimersByTimeAsync(1);
		expect(rowTexts('.live')).toEqual(['$ls', 'a.txt', '#rm', 'gone', 'done', '$pwd', '$']);
		expect(oncomplete).toHaveBeenCalledTimes(1);
	});

	it('restarts when the lines change and stops when it is unmounted', async () => {
		vi.useFakeTimers();
		const oncomplete = vi.fn<() => void>();
		const { rerender, unmount } = render(Terminal, { lines, typewriter: true, startInView: false, delay: 0, speed: 10, oncomplete });
		await tick();
		await vi.advanceTimersByTimeAsync(10);
		expect(rowTexts('.live')).toEqual(['$ls']);
		await rerender({ lines: [{ text: 'echo' }], typewriter: true, startInView: false, delay: 0, speed: 10, oncomplete });
		await vi.advanceTimersByTimeAsync(0);
		expect(rowTexts('.live')).toEqual(['$e']);
		unmount();
		await vi.advanceTimersByTimeAsync(5000);
		expect(oncomplete).not.toHaveBeenCalled();
	});

	// A step whose timer already fired when the terminal is unmounted must not carry on: the timer is fired
	// synchronously, the unmount follows before the typing code resumes.
	it.each([
		['the start delay', 0, 100],
		['a typed character', 100, 10],
		['the pause after a command', 120, 40],
		['the pause before the next command', 160, 20]
	])('stops after %s when it is unmounted in between', async (_step, before, last) => {
		vi.useFakeTimers();
		const oncomplete = vi.fn<() => void>();
		const { unmount } = render(Terminal, {
			lines: [{ text: 'ab' }],
			typewriter: true,
			startInView: false,
			delay: 100,
			speed: 10,
			linePause: 40,
			oncomplete
		});
		await tick();
		await vi.advanceTimersByTimeAsync(before);
		vi.advanceTimersByTime(last);
		unmount();
		await vi.advanceTimersByTimeAsync(1000);
		expect(oncomplete).not.toHaveBeenCalled();
	});

	it('shows the finished text under reduced motion', async () => {
		setMedia('(prefers-reduced-motion: reduce)', true);
		render(Terminal, { lines, typewriter: true, startInView: false });
		await tick();
		expect(document.querySelector('.live')).toBeNull();
		expect(rowTexts('.body')).toEqual(['$ls', 'a.txt', '#rm', 'gone', 'done', '$pwd']);
	});

	it('copies the commands with the Clipboard API, says so and resets after two seconds', async () => {
		vi.useFakeTimers();
		const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });
		Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
		render(Terminal, { lines, copy: true, copyLabel: 'Copy all', copiedLabel: 'Done' });
		const button = screen.getByRole('button', { name: 'Copy all' });
		expect(screen.getByRole('status').textContent).toBe('');
		await user.click(button);
		expect(writeText).toHaveBeenCalledWith('ls\nrm\npwd');
		expect(button.textContent).toBe('Done');
		expect(screen.getByRole('status').textContent).toBe('Done');
		await user.click(button);
		await vi.advanceTimersByTimeAsync(2000);
		expect(button.textContent).toBe('Copy all');
	});

	it('falls back to a temporary textarea when the Clipboard API fails, with the catalogue labels', async () => {
		const user = userEvent.setup();
		writeText.mockRejectedValue(new Error('blocked'));
		render(Terminal, { lines: [{ text: 'whoami' }], copy: true });
		Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
		const button = screen.getByRole('button', { name: 'Copy' });
		await user.click(button);
		expect(execCommand).toHaveBeenCalledWith('copy');
		expect(document.querySelector('textarea')).toBeNull();
		expect(button.textContent).toBe('Copied');
	});

	it('shows nothing when the fallback fails or throws', async () => {
		const user = userEvent.setup();
		render(Terminal, { lines, copy: true });
		Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
		const button = screen.getByRole('button', { name: 'Copy' });
		execCommand.mockReturnValue(false);
		await user.click(button);
		expect(button.textContent).toBe('Copy');
		execCommand.mockImplementation(() => {
			throw new Error('unsupported');
		});
		await user.click(button);
		expect(button.textContent).toBe('Copy');
		expect(document.querySelector('textarea')).toBeNull();
	});
});
