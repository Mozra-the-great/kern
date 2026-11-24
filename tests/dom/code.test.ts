/**
 * Code, CodeBlock and CopyButton (stuffcloud: progress-code.test.ts "CodeBlock"). stuffcloud's
 * CodeBlock is kern's CodeBlock (a block of Code with a copy button). One difference by design: kern
 * names the code box as a focusable region only while it really scrolls sideways.
 */
import { fireEvent, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Code from '../../src/lib/components/Code.svelte';
import CodeBlock from '../../src/lib/components/CodeBlock.svelte';
import CopyButton from '../../src/lib/components/CopyButton.svelte';
import { textSnippet } from './helpers.js';

const code = 'stuffcloud deploy ./dist --expires 7d';

/** user-event installs its own clipboard stub in setup(), so replace it afterwards. */
function setupUser(writeText?: (text: string) => Promise<void>): ReturnType<typeof userEvent.setup> {
	const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });
	Object.defineProperty(navigator, 'clipboard', { configurable: true, value: writeText === undefined ? undefined : { writeText } });
	return user;
}

const ok = (): ReturnType<typeof vi.fn<(text: string) => Promise<void>>> =>
	vi.fn<(text: string) => Promise<void>>().mockResolvedValue(undefined);
const status = (): string => screen.getByRole('status').textContent;

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
	vi.restoreAllMocks();
	Reflect.deleteProperty(navigator, 'clipboard');
});

describe('Code', () => {
	it('is an inline code element by default and shows markup as text', () => {
		render(Code, { code: '<b>x</b> & more' });
		const el = document.querySelector('code.k-code.inline');
		expect(el?.textContent.trim()).toBe('<b>x</b> & more');
		expect(document.querySelector('b')).toBeNull();
	});

	it('renders children when there is no code prop', () => {
		render(Code, { children: textSnippet('npm i') });
		expect(document.querySelector('code')?.textContent.trim()).toBe('npm i');
	});

	it('a block keeps whitespace, drops one trailing newline and normalises line endings', () => {
		render(Code, { block: true, code: 'a\r\n  b\r\n' });
		expect(document.querySelector('pre code')?.textContent).toBe('a\n  b');
	});

	it('numbers the lines from startLine and ignores a non-finite start', () => {
		const { unmount } = render(Code, { block: true, code: 'a\nb\nc', lineNumbers: true, startLine: 8 });
		expect(document.querySelector('.gutter')?.textContent).toBe('8\n9\n10');
		expect(document.querySelector('.gutter')?.getAttribute('aria-hidden')).toBe('true');
		unmount();
		render(Code, { block: true, code: 'a\nb', lineNumbers: true, startLine: Number.NaN });
		expect(document.querySelector('.gutter')?.textContent).toBe('1\n2');
	});

	it('has no gutter without lineNumbers', () => {
		render(Code, { block: true, code: 'a' });
		expect(document.querySelector('.gutter')).toBeNull();
	});

	it('marks the language on the element, with a sanitised class, and shows it in the head', () => {
		render(Code, { block: true, code: 'x', language: 'c++<script>' });
		const el = document.querySelector('pre code');
		expect(el?.getAttribute('data-language')).toBe('c++<script>');
		expect(el?.classList.contains('language-c++script')).toBe(true);
		expect(document.querySelector('.lang')?.textContent).toBe('c++<script>');
	});

	it('shows no head without a language or a copy button', () => {
		render(Code, { block: true, code: 'x' });
		expect(document.querySelector('.head')).toBeNull();
	});

	it('names the code box as a focusable region only while it scrolls sideways', () => {
		const { unmount } = render(Code, { block: true, code, language: 'sh' });
		expect(screen.queryByRole('region')).toBeNull();
		unmount();
		vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(900);
		vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(300);
		render(Code, { block: true, code, language: 'sh' });
		const region = screen.getByRole('region', { name: 'sh code' });
		expect(region.getAttribute('tabindex')).toBe('0');
		expect(region.textContent).toContain(code);
	});

	it('the region takes an explicit label', () => {
		vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(900);
		vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(300);
		render(Code, { block: true, code, label: 'Deploy command' });
		expect(screen.getByRole('region', { name: 'Deploy command' })).toBeTruthy();
	});

	it('hideScrollbar toggles the no-bar class', () => {
		const { unmount } = render(Code, { block: true, code, hideScrollbar: true });
		expect(document.querySelector('.scroll')?.classList.contains('no-bar')).toBe(true);
		unmount();
		render(Code, { block: true, code });
		expect(document.querySelector('.scroll')?.classList.contains('no-bar')).toBe(false);
	});

	it('a block with copy copies the shown text and reports it', async () => {
		const writeText = ok();
		const oncopy = vi.fn();
		const user = setupUser(writeText);
		render(Code, { block: true, code: 'a\nb\n', copy: true, oncopy });
		await user.click(screen.getByRole('button', { name: 'Copy' }));
		expect(writeText).toHaveBeenCalledWith('a\nb');
		expect(oncopy).toHaveBeenCalledWith('a\nb');
	});

	it('copies the rendered children when the block has no code prop', async () => {
		const writeText = ok();
		const user = setupUser(writeText);
		render(Code, { block: true, copy: true, children: textSnippet('from a snippet') });
		await user.click(screen.getByRole('button', { name: 'Copy' }));
		expect(writeText).toHaveBeenCalledWith('from a snippet');
	});

	it('reports a failed copy through oncopyerror', async () => {
		const oncopyerror = vi.fn();
		const user = setupUser();
		render(Code, { block: true, code, copy: true, oncopyerror });
		await user.click(screen.getByRole('button', { name: 'Copy' }));
		expect(oncopyerror).toHaveBeenCalledTimes(1);
	});
});

describe('CodeBlock', () => {
	it('shows the code in a block and has no copy button unless asked for one', () => {
		render(CodeBlock, { code, label: 'Deploy command' });
		expect(document.querySelector('pre code')?.textContent).toBe(code);
		expect(screen.queryByRole('button')).toBeNull();
	});

	it('keeps whitespace and shows markup as text', () => {
		const tricky = '<b>x</b>\n  indented & more';
		render(CodeBlock, { code: tricky, label: 'Code' });
		expect(document.querySelector('pre code')?.textContent).toBe(tricky);
		expect(document.querySelector('b')).toBeNull();
	});

	it('copies the code, announces it, and forgets after two seconds', async () => {
		const writeText = ok();
		const oncopy = vi.fn();
		const user = setupUser(writeText);
		render(CodeBlock, { code, label: 'Deploy command', copyLabel: 'Copy', copiedLabel: 'Copied', oncopy });

		expect(status()).toBe('');
		await user.click(screen.getByRole('button', { name: 'Copy' }));
		expect(writeText).toHaveBeenCalledWith(code);
		expect(oncopy).toHaveBeenCalledWith(true, code);
		await vi.advanceTimersByTimeAsync(60);
		expect(status()).toBe('Copied');
		expect(screen.getByRole('button', { name: 'Copy' }).getAttribute('data-status')).toBe('copied');

		await vi.advanceTimersByTimeAsync(1930);
		expect(screen.getByRole('button', { name: 'Copy' }).getAttribute('data-status')).toBe('copied');
		await vi.advanceTimersByTimeAsync(20);
		expect(screen.getByRole('button', { name: 'Copy' }).getAttribute('data-status')).toBe('idle');
	});

	it('reports a rejected copy as failed and announces the error text', async () => {
		const oncopy = vi.fn();
		const user = setupUser(vi.fn<(text: string) => Promise<void>>().mockRejectedValue(new Error('denied')));
		render(CodeBlock, { code, label: 'c', copyLabel: 'Copy', oncopy });
		await user.click(screen.getByRole('button', { name: 'Copy' }));
		expect(oncopy).toHaveBeenCalledWith(false, code);
		await vi.advanceTimersByTimeAsync(60);
		expect(status()).toBe('Copy failed');
	});

	it('reports a missing clipboard (insecure context) as a failed copy, without a callback too', async () => {
		const oncopy = vi.fn();
		const user = setupUser();
		render(CodeBlock, { code, label: 'c', copyLabel: 'Copy', oncopy });
		await user.click(screen.getByRole('button', { name: 'Copy' }));
		expect(oncopy).toHaveBeenCalledWith(false, code);
		await vi.advanceTimersByTimeAsync(60);
		expect(status()).toBe('Copy failed');
	});

	it('copy=true uses the default labels and copy=false wins over a copyLabel', () => {
		const { unmount } = render(CodeBlock, { code, copy: true });
		expect(screen.getByRole('button', { name: 'Copy' })).toBeTruthy();
		unmount();
		render(CodeBlock, { code, copy: false, copyLabel: 'Kopieren' });
		expect(screen.queryByRole('button')).toBeNull();
	});

	it('showCopyLabel puts the label into the button text (visible name)', () => {
		render(CodeBlock, { code, copyLabel: 'Kopieren', showCopyLabel: true });
		const button = screen.getByRole('button', { name: 'Kopieren' });
		expect(button.textContent.trim()).toBe('Kopieren');
	});
});

describe('CopyButton', () => {
	it('is an icon button named and titled by its label, with a polite live region', () => {
		render(CopyButton, { text: 'x' });
		const button = screen.getByRole('button', { name: 'Copy' });
		expect(button.getAttribute('title')).toBe('Copy');
		expect(button.getAttribute('data-status')).toBe('idle');
		expect(document.querySelector('[role=status]')?.getAttribute('aria-live')).toBe('polite');
	});

	it('copies text, value or getValue() in that order of preference and reports the copied text', async () => {
		const writeText = ok();
		const oncopy = vi.fn();
		const user = setupUser(writeText);
		const first = render(CopyButton, { text: 'from text', value: 'from value', oncopy });
		await user.click(screen.getByRole('button'));
		expect(writeText).toHaveBeenLastCalledWith('from text');
		first.unmount();
		const second = render(CopyButton, { value: 'from value', oncopy });
		await user.click(screen.getByRole('button'));
		expect(writeText).toHaveBeenLastCalledWith('from value');
		second.unmount();
		render(CopyButton, { text: 'ignored', getValue: () => Promise.resolve('lazy'), oncopy });
		await user.click(screen.getByRole('button'));
		expect(writeText).toHaveBeenLastCalledWith('lazy');
		expect(oncopy).toHaveBeenLastCalledWith('lazy');
	});

	it('a failing getValue reports the error and shows the error state', async () => {
		const onerror = vi.fn();
		const failure = new Error('no value');
		const user = setupUser(ok());
		render(CopyButton, {
			getValue: () => {
				throw failure;
			},
			onerror
		});
		await user.click(screen.getByRole('button'));
		expect(onerror).toHaveBeenCalledWith(failure);
		await vi.advanceTimersByTimeAsync(60);
		expect(status()).toBe('Copy failed');
		expect(screen.getByRole('button').getAttribute('data-status')).toBe('error');
	});

	it('falls back to execCommand when the clipboard API is missing and fails when that fails too', async () => {
		const user = setupUser();
		const onerror = vi.fn();
		const oncopy = vi.fn();
		Object.defineProperty(document, 'execCommand', { configurable: true, writable: true, value: vi.fn(() => true) });
		render(CopyButton, { text: 'legacy', oncopy, onerror });
		await user.click(screen.getByRole('button'));
		expect(document.execCommand).toHaveBeenCalledWith('copy');
		expect(oncopy).toHaveBeenCalledWith('legacy');
		expect(document.querySelector('textarea')).toBeNull();
		vi.mocked(document.execCommand).mockReturnValue(false);
		await user.click(screen.getByRole('button'));
		expect(onerror).toHaveBeenCalledTimes(1);
		Reflect.deleteProperty(document, 'execCommand');
	});

	it('falls back too when the clipboard API rejects (permission denied)', async () => {
		const user = setupUser(vi.fn<(text: string) => Promise<void>>().mockRejectedValue(new Error('denied')));
		Object.defineProperty(document, 'execCommand', { configurable: true, writable: true, value: vi.fn(() => true) });
		const oncopy = vi.fn();
		render(CopyButton, { text: 'legacy', oncopy });
		await user.click(screen.getByRole('button'));
		expect(oncopy).toHaveBeenCalledWith('legacy');
		Reflect.deleteProperty(document, 'execCommand');
	});

	it('a second copy restarts the reset timer and the message stays until the next click', async () => {
		const user = setupUser(ok());
		render(CopyButton, { text: 'x', resetAfter: 2000 });
		await user.click(screen.getByRole('button'));
		await vi.advanceTimersByTimeAsync(1500);
		await user.click(screen.getByRole('button'));
		await vi.advanceTimersByTimeAsync(1500);
		expect(screen.getByRole('button').getAttribute('data-status')).toBe('copied');
		await vi.advanceTimersByTimeAsync(600);
		expect(screen.getByRole('button').getAttribute('data-status')).toBe('idle');
		expect(status()).toBe('Copied');
	});

	it('the result of the latest click wins over a slower earlier one', async () => {
		let release: (() => void) | undefined;
		const slow = vi.fn<(text: string) => Promise<void>>().mockImplementationOnce(() => new Promise<void>((resolve) => (release = resolve)));
		slow.mockResolvedValue(undefined);
		const user = setupUser(slow);
		render(CopyButton, { text: 'x', copiedLabel: 'Done' });
		await user.click(screen.getByRole('button'));
		await user.click(screen.getByRole('button'));
		release?.();
		await vi.advanceTimersByTimeAsync(100);
		expect(status()).toBe('Done');
	});

	it('is disabled, shows a visible label and takes custom texts', async () => {
		const user = setupUser(ok());
		const onclickless = vi.fn();
		const { unmount } = render(CopyButton, { text: 'x', disabled: true, oncopy: onclickless });
		await user.click(screen.getByRole('button'));
		expect(onclickless).not.toHaveBeenCalled();
		unmount();
		render(CopyButton, { text: 'x', showLabel: true, label: 'Link kopieren', copiedLabel: 'Kopiert' });
		const button = screen.getByRole('button', { name: 'Link kopieren' });
		expect(button.hasAttribute('title')).toBe(false);
		await user.click(button);
		await vi.advanceTimersByTimeAsync(60);
		expect(status()).toBe('Kopiert');
	});

	it('is operable with the keyboard', async () => {
		const writeText = ok();
		const user = setupUser(writeText);
		render(CopyButton, { text: 'kbd' });
		await user.tab();
		await user.keyboard('{Enter}');
		await user.keyboard(' ');
		expect(writeText).toHaveBeenCalledTimes(2);
	});
});

describe('Code and CopyButton edge cases', () => {
	it('a scrolling block without language or label is named "Code"', () => {
		vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(900);
		vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(300);
		render(Code, { block: true, code });
		expect(screen.getByRole('region', { name: 'Code' })).toBeTruthy();
	});

	it('measures once without ResizeObserver', () => {
		vi.stubGlobal('ResizeObserver', undefined);
		try {
			vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(900);
			vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(300);
			render(Code, { block: true, code, language: 'sh' });
			expect(screen.getByRole('region', { name: 'sh code' })).toBeTruthy();
		} finally {
			vi.unstubAllGlobals();
		}
	});

	it('nullish classes from untyped callers add no "null" to the class', () => {
		const loose = { class: null as unknown as string };
		render(Code, { ...loose, code: 'a' });
		render(Code, { ...loose, code: 'b', block: true });
		render(CopyButton, { ...loose, text: 'c' });
		for (const el of document.querySelectorAll('.k-code, .k-code-block, .k-copy-button'))
			expect(el.getAttribute('class')).not.toMatch(/null|undefined/);
		expect(document.querySelectorAll('.k-code, .k-code-block, .k-copy-button')).toHaveLength(3);
	});

	it('copies an empty text without text, value or getValue', async () => {
		const writeText = ok();
		const oncopy = vi.fn();
		const user = setupUser(writeText);
		render(CopyButton, { oncopy });
		await user.click(screen.getByRole('button'));
		expect(writeText).toHaveBeenCalledWith('');
		expect(oncopy).toHaveBeenCalledWith('');
	});

	it('the fallback leaves the focus alone when the button did not have it', async () => {
		setupUser();
		Object.defineProperty(document, 'execCommand', { configurable: true, writable: true, value: vi.fn(() => true) });
		const outside = document.body.appendChild(document.createElement('input'));
		try {
			const oncopy = vi.fn();
			render(CopyButton, { text: 'legacy', oncopy });
			outside.focus();
			await fireEvent.click(screen.getByRole('button'));
			await vi.waitFor(() => expect(oncopy).toHaveBeenCalledWith('legacy'));
			expect(document.activeElement).toBe(outside);
		} finally {
			outside.remove();
			Reflect.deleteProperty(document, 'execCommand');
		}
	});

	it('the fallback reports a throwing execCommand as a failed copy', async () => {
		setupUser();
		Object.defineProperty(document, 'execCommand', {
			configurable: true,
			writable: true,
			value: vi.fn(() => {
				throw new Error('blocked');
			})
		});
		try {
			const onerror = vi.fn();
			render(CopyButton, { text: 'legacy', onerror });
			await fireEvent.click(screen.getByRole('button'));
			await vi.waitFor(() => expect(onerror).toHaveBeenCalledTimes(1));
			expect(document.querySelector('textarea')).toBeNull();
		} finally {
			Reflect.deleteProperty(document, 'execCommand');
		}
	});
});
