/**
 * Slider: a labelled native range input. Covers the default value (middle of the range, snapped to the
 * step), `bind:value`, min/max/step, `format` for the display and `aria-valuetext`, `showValue`, the
 * `--ratio` fill, hint and error through Field, and attributes passed through.
 */
import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import Slider from '../../src/lib/components/Slider.svelte';
import { reactive } from './reactive.svelte.js';

function ratio(input: HTMLElement): string {
	return input.style.getPropertyValue('--ratio');
}

describe('Slider', () => {
	it('is a labelled range that starts in the middle of 0..100', async () => {
		render(Slider, { label: 'Volume' });
		const input = screen.getByRole<HTMLInputElement>('slider', { name: 'Volume' });
		await vi.waitFor(() => expect(input.value).toBe('50'));
		expect(input.min).toBe('0');
		expect(input.max).toBe('100');
		expect(input.step).toBe('1');
		expect(ratio(input)).toBe('0.5');
		expect(input.getAttribute('aria-valuetext')).toBeNull();
		expect(input.getAttribute('aria-invalid')).toBeNull();
		expect(document.querySelector('output')).toBeNull();
		expect(input.id).toMatch(/-slider$/);
	});

	it('snaps the default to the step and keeps it in range', async () => {
		const props = reactive<{ label: string; min: number; max: number; step: number; value: number | undefined }>({
			label: 'Size',
			min: 0,
			max: 9,
			step: 2,
			value: undefined
		});
		render(Slider, { props });
		await vi.waitFor(() => expect(props.value).toBe(4));
	});

	it('a step of 0 or less snaps to whole numbers', async () => {
		const props = reactive<{ label: string; min: number; max: number; step: number; value: number | undefined }>({
			label: 'Size',
			min: 0,
			max: 5,
			step: 0,
			value: undefined
		});
		render(Slider, { props });
		await vi.waitFor(() => expect(props.value).toBe(3));
	});

	it('binds the value both ways and updates the fill', async () => {
		const props = reactive<{ label: string; value: number | undefined; min: number; max: number }>({
			label: 'Level',
			value: 20,
			min: 10,
			max: 30
		});
		render(Slider, { props });
		const input = screen.getByRole<HTMLInputElement>('slider');
		expect(input.value).toBe('20');
		expect(ratio(input)).toBe('0.5');
		input.value = '30';
		await fireEvent.input(input);
		expect(props.value).toBe(30);
		expect(ratio(input)).toBe('1');
		props.value = 10;
		await vi.waitFor(() => expect(input.value).toBe('10'));
		expect(ratio(input)).toBe('0');
		props.value = undefined;
		await vi.waitFor(() => expect(props.value).toBe(20));
		expect(input.value).toBe('20');
	});

	it('an empty range has no fill', () => {
		render(Slider, { label: 'Flat', min: 5, max: 5, value: 5 });
		expect(ratio(screen.getByRole('slider'))).toBe('0');
	});

	it('showValue shows the plain value next to it', () => {
		render(Slider, { label: 'Volume', value: 30, showValue: true });
		const input = screen.getByRole('slider');
		const output = document.querySelector('output');
		expect(output?.textContent).toBe('30');
		expect(output?.getAttribute('for')).toBe(input.id);
		expect(input.getAttribute('aria-valuetext')).toBeNull();
	});

	it('format shapes the display and the value text for screen readers', () => {
		render(Slider, { label: 'Opacity', value: 40, showValue: true, format: (v: number) => `${v} %` });
		expect(screen.getByRole('slider').getAttribute('aria-valuetext')).toBe('40 %');
		expect(document.querySelector('output')?.textContent).toBe('40 %');
	});

	it('takes an id, a class and passes other attributes to the input', () => {
		render(Slider, { label: 'Volume', id: 'vol', class: 'sl', name: 'volume', disabled: true, value: 1 });
		const input = screen.getByRole<HTMLInputElement>('slider');
		expect(input.id).toBe('vol');
		expect(input.name).toBe('volume');
		expect(input.disabled).toBe(true);
		expect(document.querySelector('.k-field')?.classList.contains('sl')).toBe(true);
	});

	it('hint describes it; an error invalidates it', () => {
		const { unmount } = render(Slider, { label: 'Volume', hint: 'Not too loud', value: 1 });
		expect(screen.getByRole('slider').getAttribute('aria-describedby')).toBe(screen.getByText('Not too loud').id);
		unmount();
		render(Slider, { label: 'Volume', error: 'Too loud', value: 100 });
		const input = screen.getByRole('slider');
		expect(input.getAttribute('aria-invalid')).toBe('true');
		expect(input.closest('.k-slider')?.classList.contains('invalid')).toBe(true);
		expect(input.getAttribute('aria-describedby')).toBe(screen.getByRole('alert').id);
	});
});
