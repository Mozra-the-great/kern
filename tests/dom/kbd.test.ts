/**
 * Kbd: a shortcut drawn as keys with a separator, the symbols for named keys with their spoken names
 * (visually hidden text, the glyph `aria-hidden`), the platform (`mac`, `other`, and `auto` read from
 * `userAgentData`, `navigator.platform` or the user agent after mount), spoken-name overrides, the
 * single-key `children` form, size and class.
 */
import { render } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Kbd from '../../src/lib/components/Kbd.svelte';
import { textSnippet } from './helpers.js';

afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

interface Drawn {
	glyph: string;
	spoken: string | null;
}

function keys(): Drawn[] {
	return Array.from(document.querySelectorAll('.k-kbd > .key')).map((key) => {
		const glyph = key.querySelector('[aria-hidden="true"]');
		return glyph
			? { glyph: glyph.textContent, spoken: key.querySelector('.sr')?.textContent.trim() ?? null }
			: { glyph: key.textContent.trim(), spoken: null };
	});
}
function separators(): string[] {
	return Array.from(document.querySelectorAll('.sep')).map((s) => s.textContent);
}

const ALL = ['mod', 'cmd', 'command', 'meta', 'ctrl', 'control', 'alt', 'option', 'opt', 'shift'];
const SAME = [
	'enter',
	'return',
	'esc',
	'escape',
	'backspace',
	'delete',
	'del',
	'up',
	'arrowup',
	'down',
	'arrowdown',
	'left',
	'arrowleft',
	'right',
	'arrowright'
];

describe('Kbd', () => {
	it('draws the keys of a shortcut with the default separator and medium size', () => {
		render(Kbd, { keys: ['mod', 'K'], platform: 'other' });
		const root = document.querySelector('.k-kbd');
		expect(root?.getAttribute('data-size')).toBe('md');
		expect(keys()).toEqual([
			{ glyph: 'Ctrl', spoken: 'Control' },
			{ glyph: 'K', spoken: null }
		]);
		expect(separators()).toEqual(['+']);
	});

	it('names modifiers on other platforms', () => {
		render(Kbd, { keys: ALL, platform: 'other' });
		expect(keys()).toEqual([
			{ glyph: 'Ctrl', spoken: 'Control' },
			{ glyph: '⌘', spoken: 'Command' },
			{ glyph: '⌘', spoken: 'Command' },
			{ glyph: 'Win', spoken: 'Windows' },
			{ glyph: 'Ctrl', spoken: 'Control' },
			{ glyph: 'Ctrl', spoken: 'Control' },
			{ glyph: 'Alt', spoken: null },
			{ glyph: 'Alt', spoken: null },
			{ glyph: 'Alt', spoken: null },
			{ glyph: 'Shift', spoken: null }
		]);
	});

	it('names modifiers on Apple platforms', () => {
		render(Kbd, { keys: ALL, platform: 'mac' });
		expect(keys().map((k) => k.glyph)).toEqual(['⌘', '⌘', '⌘', '⌘', '⌃', '⌃', '⌥', '⌥', '⌥', '⇧']);
		expect(keys().map((k) => k.spoken)).toEqual([
			'Command',
			'Command',
			'Command',
			'Command',
			'Control',
			'Control',
			'Option',
			'Option',
			'Option',
			'Shift'
		]);
	});

	it('draws the other named keys as symbols with their spoken names, ignoring case and blanks', () => {
		render(Kbd, { keys: [...SAME, ' Enter ', '', '  '], separator: '', size: 'sm', class: 'extra' });
		expect(document.querySelector('.k-kbd')?.getAttribute('data-size')).toBe('sm');
		expect(document.querySelector('.k-kbd')?.classList.contains('extra')).toBe(true);
		expect(separators()).toEqual([]);
		expect(keys()).toEqual([
			{ glyph: '↵', spoken: 'Enter' },
			{ glyph: '↵', spoken: 'Enter' },
			{ glyph: 'Esc', spoken: 'Escape' },
			{ glyph: 'Esc', spoken: 'Escape' },
			{ glyph: '⌫', spoken: 'Backspace' },
			{ glyph: 'Del', spoken: 'Delete' },
			{ glyph: 'Del', spoken: 'Delete' },
			{ glyph: '↑', spoken: 'Up arrow' },
			{ glyph: '↑', spoken: 'Up arrow' },
			{ glyph: '↓', spoken: 'Down arrow' },
			{ glyph: '↓', spoken: 'Down arrow' },
			{ glyph: '←', spoken: 'Left arrow' },
			{ glyph: '←', spoken: 'Left arrow' },
			{ glyph: '→', spoken: 'Right arrow' },
			{ glyph: '→', spoken: 'Right arrow' },
			{ glyph: '↵', spoken: 'Enter' }
		]);
	});

	it('spoken names come from labels by lower-case id, then by the name as written', () => {
		render(Kbd, { keys: ['mod', 'K', 'Fn'], platform: 'other', separator: ' then ', labels: { mod: 'Steuerung', Fn: 'Funktion' } });
		expect(keys()).toEqual([
			{ glyph: 'Ctrl', spoken: 'Steuerung' },
			{ glyph: 'K', spoken: null },
			{ glyph: 'Fn', spoken: 'Funktion' }
		]);
		expect(separators()).toEqual([' then ', ' then ']);
	});

	it('renders a single key from children when keys is empty or missing', () => {
		const { unmount } = render(Kbd, { children: textSnippet('F5') });
		expect(document.querySelector('.key')?.textContent).toBe('F5');
		unmount();
		render(Kbd, { keys: [], children: textSnippet('F6') });
		expect(document.querySelector('.key')?.textContent).toBe('F6');
	});

	it('renders an empty key without keys or children', () => {
		render(Kbd, {});
		expect(document.querySelector('.key')?.textContent).toBe('');
	});

	describe('platform auto', () => {
		it('reads userAgentData.platform', async () => {
			vi.stubGlobal('navigator', { userAgentData: { platform: 'macOS' }, platform: 'Win32', userAgent: 'x' });
			render(Kbd, { keys: ['mod'] });
			await vi.waitFor(() => expect(keys()[0].glyph).toBe('⌘'));
		});

		it('falls back to navigator.platform', async () => {
			vi.stubGlobal('navigator', { userAgentData: {}, platform: 'iPhone', userAgent: 'x' });
			render(Kbd, { keys: ['mod'], platform: 'auto' });
			await vi.waitFor(() => expect(keys()[0].glyph).toBe('⌘'));
		});

		it('falls back to the user agent', async () => {
			vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' });
			render(Kbd, { keys: ['mod'] });
			await vi.waitFor(() => expect(keys()[0].glyph).toBe('⌘'));
		});

		it('is not Apple without any platform data', async () => {
			vi.stubGlobal('navigator', {});
			render(Kbd, { keys: ['mod'] });
			await Promise.resolve();
			expect(keys()[0].glyph).toBe('Ctrl');
		});

		it('is not Apple on Windows', () => {
			vi.stubGlobal('navigator', { platform: 'Win32', userAgent: 'Mozilla/5.0 (Windows NT 10.0)' });
			render(Kbd, { keys: ['mod'] });
			expect(keys()[0].glyph).toBe('Ctrl');
		});

		it('is not Apple where there is no navigator', () => {
			vi.stubGlobal('navigator', undefined);
			render(Kbd, { keys: ['meta'] });
			expect(keys()[0].glyph).toBe('Win');
		});
	});
});
