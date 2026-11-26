/**
 * `accessibleLabel` of CopyButton and DownloadButton (#166): a short visible `label` and a longer accessible name that
 * contains it (WCAG 2.5.3 Label in Name). Checked in both modes (with and without `showLabel`), with and without the
 * prop, for empty values, and that the visible text and the spoken status texts do not change.
 */
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Code from '../../src/lib/components/Code.svelte';
import CodeBlock from '../../src/lib/components/CodeBlock.svelte';
import CopyButton from '../../src/lib/components/CopyButton.svelte';
import DownloadButton from '../../src/lib/components/DownloadButton.svelte';

interface Case {
	name: string;
	component: typeof CopyButton | typeof DownloadButton;
	base: Record<string, unknown>;
	root: string;
}

const cases: Case[] = [
	{ name: 'CopyButton', component: CopyButton, base: { text: 'abc', label: 'Copy' }, root: '.k-copy-button' },
	{ name: 'DownloadButton', component: DownloadButton, base: { text: 'abc', name: 'a.txt', label: 'Download' }, root: '.k-download-button' }
];

describe.each(cases)('$name accessibleLabel', ({ component, base, root }) => {
	const label = base.label as string;
	const long = `${label} the value`;
	const button = (): HTMLButtonElement => document.querySelector<HTMLButtonElement>(`${root} button`) as HTMLButtonElement;

	it('with showLabel: the name is accessibleLabel, the visible text stays label', () => {
		render(component, { ...base, showLabel: true, accessibleLabel: long });
		expect(screen.getByRole('button', { name: long })).toBe(button());
		expect(screen.queryByRole('button', { name: label })).toBeNull();
		expect(button().getAttribute('aria-label')).toBe(long);
		expect(button().querySelector('.text')?.textContent).toBe(label);
		// The visible label is part of the name (Label in Name).
		expect(button().getAttribute('aria-label')?.includes(label)).toBe(true);
		// No tooltip: the text is visible.
		expect(button().hasAttribute('title')).toBe(false);
	});

	it('with showLabel and without the prop: the visible label is the name, no aria-label', () => {
		render(component, { ...base, showLabel: true });
		expect(screen.getByRole('button', { name: label })).toBe(button());
		expect(button().hasAttribute('aria-label')).toBe(false);
		expect(button().querySelector('.text')?.textContent).toBe(label);
	});

	it('icon-only: accessibleLabel wins over label as the name and the tooltip, there is no visible text', () => {
		render(component, { ...base, accessibleLabel: long });
		expect(screen.getByRole('button', { name: long })).toBe(button());
		expect(button().getAttribute('title')).toBe(long);
		expect(button().querySelector('.text')).toBeNull();
	});

	it('icon-only and without the prop: label is the name and the tooltip', () => {
		render(component, base);
		expect(screen.getByRole('button', { name: label })).toBe(button());
		expect(button().getAttribute('title')).toBe(label);
	});

	it.each([undefined, null, '', '   '])('%j counts as not set', (value) => {
		const { unmount } = render(component, { ...base, showLabel: true, accessibleLabel: value });
		expect(button().hasAttribute('aria-label')).toBe(false);
		expect(screen.getByRole('button', { name: label })).toBe(button());
		unmount();
		render(component, { ...base, accessibleLabel: value });
		expect(button().getAttribute('aria-label')).toBe(label);
		expect(button().getAttribute('title')).toBe(label);
	});

	it('follows a change of the prop', async () => {
		const { rerender } = render(component, { ...base, showLabel: true, accessibleLabel: long });
		expect(button().getAttribute('aria-label')).toBe(long);
		await rerender({ accessibleLabel: undefined });
		expect(button().hasAttribute('aria-label')).toBe(false);
		await rerender({ accessibleLabel: 'Other' });
		expect(button().getAttribute('aria-label')).toBe('Other');
	});

	it('does not warn or throw when the name does not contain the visible label', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		expect(() => render(component, { ...base, showLabel: true, accessibleLabel: 'Something else' })).not.toThrow();
		expect(button().getAttribute('aria-label')).toBe('Something else');
		expect(warn).not.toHaveBeenCalled();
		warn.mockRestore();
	});
});

describe('accessibleLabel leaves the status texts alone', () => {
	beforeEach(() => {
		vi.useFakeTimers({ shouldAdvanceTime: true });
		Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: vi.fn().mockResolvedValue(undefined) } });
		Object.defineProperty(URL, 'createObjectURL', { configurable: true, writable: true, value: () => 'blob:test/1' });
		Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, writable: true, value: () => undefined });
		vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
	});
	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	it('CopyButton announces copiedLabel, not the accessible name', async () => {
		const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });
		render(CopyButton, { text: 'x', label: 'Copy', accessibleLabel: 'Copy SHA-256', showLabel: true, copiedLabel: 'Copied' });
		await user.click(screen.getByRole('button', { name: 'Copy SHA-256' }));
		await vi.advanceTimersByTimeAsync(100);
		expect(document.querySelector('.k-copy-button [role="status"]')?.textContent).toBe('Copied');
		// The name of the button did not change with the result.
		expect(screen.getByRole('button', { name: 'Copy SHA-256' })).toBeTruthy();
	});

	it('DownloadButton announces startedLabel, not the accessible name', async () => {
		const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });
		render(DownloadButton, {
			text: 'x',
			name: 'a.txt',
			label: 'Download',
			accessibleLabel: 'Download a.txt',
			showLabel: true,
			startedLabel: 'Started'
		});
		await user.click(screen.getByRole('button', { name: 'Download a.txt' }));
		await vi.advanceTimersByTimeAsync(100);
		expect(document.querySelector('.k-download-button .k-status-message[role="status"]')?.textContent.trim()).toBe('Started');
		expect(screen.getByRole('button', { name: 'Download a.txt' })).toBeTruthy();
	});
});

/**
 * `copyAccessibleLabel` of Code and CodeBlock (#168): forwarded to the inner CopyButton's `accessibleLabel`, with the same
 * rules as #166 (name with and without the visible copy label, empty/whitespace/`null` counts as not set).
 */
interface CodeCase {
	name: string;
	component: typeof Code | typeof CodeBlock;
	/** Props for a copy button with a visible text. */
	visible: Record<string, unknown>;
	/** Props for an icon-only copy button. */
	iconOnly: Record<string, unknown>;
	/** Props without a copy button. */
	off: Record<string, unknown>;
}

const code = 'npm ci';
const codeCases: CodeCase[] = [
	{
		name: 'Code',
		component: Code,
		visible: { block: true, code, copy: true, copyLabel: 'Copy', copyShowLabel: true },
		iconOnly: { block: true, code, copy: true, copyLabel: 'Copy' },
		off: { block: true, code }
	},
	{
		name: 'CodeBlock',
		component: CodeBlock,
		visible: { code, copyLabel: 'Copy' },
		iconOnly: { code, copyLabel: 'Copy', showCopyLabel: false },
		off: { code, copy: false }
	}
];

describe.each(codeCases)('$name copyAccessibleLabel', ({ component, visible, iconOnly, off }) => {
	const long = 'Copy command';
	const button = (): HTMLButtonElement => document.querySelector<HTMLButtonElement>('.k-copy-button button') as HTMLButtonElement;

	it('with the visible copy label: the name is copyAccessibleLabel, the visible text stays copyLabel', () => {
		render(component, { ...visible, copyAccessibleLabel: long });
		expect(screen.getByRole('button', { name: long })).toBe(button());
		expect(screen.queryByRole('button', { name: 'Copy' })).toBeNull();
		expect(button().getAttribute('aria-label')).toBe(long);
		expect(button().querySelector('.text')?.textContent).toBe('Copy');
		expect(button().hasAttribute('title')).toBe(false);
	});

	it('with the visible copy label and without the prop: the visible label is the name, no aria-label', () => {
		render(component, visible);
		expect(screen.getByRole('button', { name: 'Copy' })).toBe(button());
		expect(button().hasAttribute('aria-label')).toBe(false);
	});

	it('icon-only: copyAccessibleLabel is the name and the tooltip, there is no visible text', () => {
		render(component, { ...iconOnly, copyAccessibleLabel: long });
		expect(screen.getByRole('button', { name: long })).toBe(button());
		expect(button().getAttribute('title')).toBe(long);
		expect(button().querySelector('.text')).toBeNull();
	});

	it('icon-only and without the prop: copyLabel is the name and the tooltip', () => {
		render(component, iconOnly);
		expect(screen.getByRole('button', { name: 'Copy' })).toBe(button());
		expect(button().getAttribute('title')).toBe('Copy');
	});

	it.each([undefined, null, '', '   '])('%j counts as not set', (value) => {
		const { unmount } = render(component, { ...visible, copyAccessibleLabel: value });
		expect(button().hasAttribute('aria-label')).toBe(false);
		expect(screen.getByRole('button', { name: 'Copy' })).toBe(button());
		unmount();
		render(component, { ...iconOnly, copyAccessibleLabel: value });
		expect(button().getAttribute('aria-label')).toBe('Copy');
		expect(button().getAttribute('title')).toBe('Copy');
	});

	it('follows a change of the prop', async () => {
		const { rerender } = render(component, { ...visible, copyAccessibleLabel: long });
		expect(button().getAttribute('aria-label')).toBe(long);
		await rerender({ copyAccessibleLabel: undefined });
		expect(button().hasAttribute('aria-label')).toBe(false);
		await rerender({ copyAccessibleLabel: 'Other' });
		expect(button().getAttribute('aria-label')).toBe('Other');
	});

	it('has no effect without a copy button', () => {
		render(component, { ...off, copyAccessibleLabel: long });
		expect(screen.queryByRole('button')).toBeNull();
	});
});

describe('copyAccessibleLabel leaves the copy result alone', () => {
	beforeEach(() => {
		vi.useFakeTimers({ shouldAdvanceTime: true });
	});
	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	it('CodeBlock copies the code and announces copiedLabel, the name does not change', async () => {
		const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });
		const writeText = vi.fn<(text: string) => Promise<void>>().mockResolvedValue(undefined);
		Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
		const oncopy = vi.fn();
		render(CodeBlock, { code, copyLabel: 'Copy', copyAccessibleLabel: 'Copy command', copiedLabel: 'Copied', oncopy });
		await user.click(screen.getByRole('button', { name: 'Copy command' }));
		await vi.advanceTimersByTimeAsync(100);
		expect(writeText).toHaveBeenCalledWith(code);
		expect(oncopy).toHaveBeenCalledWith(true, code);
		expect(document.querySelector('.k-copy-button [role="status"]')?.textContent).toBe('Copied');
		expect(screen.getByRole('button', { name: 'Copy command' })).toBeTruthy();
	});
});
