/**
 * Progress and ProgressRing (stuffcloud: progress-code.test.ts "Progress"). The helper maths
 * (`normaliseMax`, `progressPercent`) is covered in tests/unit/progress.test.ts; the stylesheet cases of
 * stuffcloud (animation only on transform, reduced motion, forced colours) are CSS assertions that kern
 * keeps in tests/tokens and the Playwright suites, not in the component tests.
 */
import { render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import Progress from '../../src/lib/components/Progress.svelte';
import ProgressRing from '../../src/lib/components/ProgressRing.svelte';
import { textSnippet } from './helpers.js';
import { reactive } from './reactive.svelte.js';

const barOf = (): HTMLElement => screen.getByRole('progressbar').querySelector<HTMLElement>('.bar') ?? document.body;

describe('Progress', () => {
	it('is a named progressbar with the ARIA value attributes', () => {
		render(Progress, { label: 'Upload', value: 40 });
		const bar = screen.getByRole('progressbar', { name: 'Upload' });
		expect(bar.getAttribute('aria-valuemin')).toBe('0');
		expect(bar.getAttribute('aria-valuemax')).toBe('100');
		expect(bar.getAttribute('aria-valuenow')).toBe('40');
		expect(bar.getAttribute('aria-valuetext')).toBeNull();
		expect(barOf().style.width).toBe('40%');
	});

	it('scales to a custom maximum and speaks the value text', () => {
		render(Progress, { label: 'Files', value: 3, max: 12, valueText: '3 of 12 files' });
		const bar = screen.getByRole('progressbar');
		expect(bar.getAttribute('aria-valuemax')).toBe('12');
		expect(bar.getAttribute('aria-valuenow')).toBe('3');
		expect(bar.getAttribute('aria-valuetext')).toBe('3 of 12 files');
		expect(barOf().style.width).toBe('25%');
	});

	it('clamps value to the range and survives a bad maximum or a bad value', () => {
		const { unmount } = render(Progress, { label: 'A', value: 250 });
		expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('100');
		unmount();
		const second = render(Progress, { label: 'B', value: 50, max: 0 });
		const bar = screen.getByRole('progressbar');
		expect(bar.getAttribute('aria-valuemax')).toBe('100');
		expect(bar.getAttribute('aria-valuenow')).toBe('50');
		second.unmount();
		render(Progress, { label: 'C', value: Number.NaN });
		expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('0');
		expect(barOf().style.width).toBe('0%');
	});

	it('is indeterminate without a value: no aria-valuenow, no width, animated class', () => {
		render(Progress, { label: 'Working' });
		const bar = screen.getByRole('progressbar');
		expect(bar.getAttribute('aria-valuenow')).toBeNull();
		expect(barOf().classList.contains('indeterminate')).toBe(true);
		expect(barOf().style.width).toBe('');
	});

	it('null is indeterminate too and zero is a determinate empty bar', () => {
		const { unmount } = render(Progress, { label: 'Null', value: null });
		expect(barOf().classList.contains('indeterminate')).toBe(true);
		unmount();
		render(Progress, { label: 'Zero', value: 0 });
		expect(barOf().classList.contains('indeterminate')).toBe(false);
		expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('0');
	});

	it('follows value changes and switches between determinate and indeterminate', async () => {
		const props = reactive<{ label: string; value: number | null | undefined }>({ label: 'Upload', value: 10 });
		render(Progress, { props });
		props.value = 80;
		await vi.waitFor(() => expect(barOf().style.width).toBe('80%'));
		props.value = undefined;
		await vi.waitFor(() => expect(barOf().classList.contains('indeterminate')).toBe(true));
	});

	it('draws the warning tone through data-tone', () => {
		const { unmount } = render(Progress, { label: 'Storage', value: 100, tone: 'warn' });
		expect(document.querySelector('.k-progress')?.getAttribute('data-tone')).toBe('warn');
		unmount();
		render(Progress, { label: 'Storage', value: 100 });
		expect(document.querySelector('.k-progress')?.hasAttribute('data-tone')).toBe(false);
	});

	it('shows the label and the rounded percentage, or hides them while keeping the accessible name', () => {
		const { unmount } = render(Progress, { label: 'Upload', value: 33.4, showValue: true });
		expect(document.querySelector('.label')?.textContent).toBe('Upload');
		expect(document.querySelector('.val')?.textContent).toBe('33%');
		unmount();
		render(Progress, { label: 'Upload', value: 50, hideLabel: true });
		expect(document.querySelector('.head')).toBeNull();
		expect(screen.getByRole('progressbar', { name: 'Upload' })).toBeTruthy();
	});

	it('hideLabel with showValue keeps only the percentage in the head; indeterminate drops the head', () => {
		const { unmount } = render(Progress, { label: 'Upload', value: 20, showValue: true, hideLabel: true });
		expect(document.querySelector('.head')).not.toBeNull();
		expect(document.querySelector('.label')).toBeNull();
		expect(document.querySelector('.val')?.textContent).toBe('20%');
		unmount();
		render(Progress, { label: 'Upload', showValue: true, hideLabel: true });
		expect(document.querySelector('.head')).toBeNull();
	});

	it('shows no percentage for an indeterminate bar even with showValue', () => {
		render(Progress, { label: 'Working', showValue: true });
		expect(document.querySelector('.val')).toBeNull();
	});
});

describe('ProgressRing', () => {
	it('is a named progressbar with value attributes and a percent text', () => {
		render(ProgressRing, { label: 'Sync', value: 25, showValue: true });
		const ring = screen.getByRole('progressbar', { name: 'Sync' });
		expect(ring.getAttribute('aria-valuenow')).toBe('25');
		expect(ring.getAttribute('aria-valuemax')).toBe('100');
		expect(ring.getAttribute('aria-valuetext')).toBe('25%');
		expect(document.querySelector('.val')?.textContent).toBe('25%');
	});

	it('is indeterminate without a value and says it is loading', () => {
		render(ProgressRing, { label: 'Sync' });
		const ring = screen.getByRole('progressbar');
		expect(ring.hasAttribute('aria-valuenow')).toBe(false);
		expect(ring.classList.contains('indeterminate')).toBe(true);
		expect(ring.getAttribute('aria-valuetext')).toBe('Loading');
	});

	it('clamps, scales to a max and tolerates a bad max', () => {
		const { unmount } = render(ProgressRing, { label: 'A', value: 500, max: 200 });
		expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('200');
		expect(screen.getByRole('progressbar').getAttribute('aria-valuetext')).toBe('100%');
		unmount();
		render(ProgressRing, { label: 'B', value: 50, max: 0 });
		expect(screen.getByRole('progressbar').getAttribute('aria-valuemax')).toBe('100');
		expect(screen.getByRole('progressbar').getAttribute('aria-valuetext')).toBe('50%');
	});

	it('treats NaN like no value', () => {
		render(ProgressRing, { label: 'A', value: Number.NaN });
		expect(screen.getByRole('progressbar').classList.contains('indeterminate')).toBe(true);
	});

	it('valueText and format shape the spoken text; the centre snippet replaces the value', () => {
		const { unmount } = render(ProgressRing, { label: 'Disk', value: 40, valueText: '40 GB used' });
		expect(screen.getByRole('progressbar').getAttribute('aria-valuetext')).toBe('40 GB used');
		unmount();
		const second = render(ProgressRing, { label: 'Disk', value: 40, format: (p: number) => `${p / 10} of 10`, showValue: true });
		expect(screen.getByRole('progressbar').getAttribute('aria-valuetext')).toBe('4 of 10');
		second.unmount();
		render(ProgressRing, { label: 'Disk', value: 40, showValue: true, children: textSnippet('custom') });
		expect(document.querySelector('.centre')?.textContent.trim()).toBe('custom');
		expect(document.querySelector('.val')).toBeNull();
	});

	it('the centre is hidden from assistive technology so the name and value are spoken once', () => {
		render(ProgressRing, { label: 'Sync', value: 25, showValue: true });
		expect(document.querySelector('.centre')?.getAttribute('aria-hidden')).toBe('true');
		expect(document.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
	});

	it('size and thickness set the ring geometry within sane limits', () => {
		render(ProgressRing, { label: 'Sync', value: 50, size: 4, thickness: 100 });
		const ring = screen.getByRole('progressbar');
		expect(ring.style.getPropertyValue('--size')).toBe('16px');
		const circle = ring.querySelector('circle.arc');
		// Thickness is limited to half the size: r = (16 - 8) / 2.
		expect(circle?.getAttribute('r')).toBe('4');
	});
});

describe('nullish class from untyped callers', () => {
	it('Progress and ProgressRing add no "null" to the class', () => {
		render(Progress, { label: 'A', class: null as unknown as string });
		render(ProgressRing, { label: 'B', class: null as unknown as string });
		const roots = document.querySelectorAll('.k-progress, .k-progress-ring');
		expect(roots).toHaveLength(2);
		for (const el of roots) expect(el.getAttribute('class')).not.toMatch(/null|undefined/);
	});
});
