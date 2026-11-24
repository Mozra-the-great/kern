/**
 * Rating: the radiogroup (label, star names, `bind:value`, `onchange` only for a new value, keyboard via the
 * native radios, `name`, `required`, `disabled`, hint and error), the hover preview, the bounds of `max` and
 * `value`, and the readonly image with partly filled stars.
 */
import { fireEvent, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Rating from '../../src/lib/components/Rating.svelte';
import { reactive } from './reactive.svelte.js';

function stars(): HTMLInputElement[] {
	return screen.getAllByRole<HTMLInputElement>('radio');
}
function lit(container: HTMLElement): number {
	return container.querySelectorAll('label.star.on').length;
}

describe('Rating', () => {
	it('is a named radiogroup of five stars by default', () => {
		render(Rating, { label: 'Quality' });
		const group = screen.getByRole('radiogroup', { name: 'Quality' });
		expect(group.getAttribute('aria-required')).toBeNull();
		expect(group.getAttribute('aria-invalid')).toBeNull();
		expect(stars().map((s) => s.labels?.[0]?.textContent?.trim())).toEqual([
			'1 of 5 stars',
			'2 of 5 stars',
			'3 of 5 stars',
			'4 of 5 stars',
			'5 of 5 stars'
		]);
		expect(stars().every((s) => !s.checked)).toBe(true);
		const names = new Set(stars().map((s) => s.name));
		expect(names.size).toBe(1);
	});

	it('binds the value and calls onchange when the user picks a new one', async () => {
		const user = userEvent.setup();
		const onchange = vi.fn();
		const props = reactive<{ label: string; value: number | undefined; onchange: (v: number) => void }>({
			label: 'Quality',
			value: undefined,
			onchange
		});
		const { container } = render(Rating, { props });
		await user.click(screen.getByRole('radio', { name: '3 of 5 stars' }));
		expect(props.value).toBe(3);
		expect(onchange).toHaveBeenCalledWith(3);
		expect(lit(container)).toBe(3);
		props.value = 1;
		await vi.waitFor(() => expect(screen.getByRole<HTMLInputElement>('radio', { name: '1 of 5 stars' }).checked).toBe(true));
	});

	it('moves with the arrow keys like any radio group', async () => {
		const user = userEvent.setup();
		const onchange = vi.fn();
		render(Rating, { label: 'Quality', value: 2, onchange });
		stars()[1].focus();
		await user.keyboard('{ArrowRight}');
		expect(onchange).toHaveBeenCalledWith(3);
	});

	it('does not call onchange for the current value', async () => {
		const onchange = vi.fn();
		render(Rating, { label: 'Q', value: 2, onchange });
		await fireEvent.change(stars()[1]);
		expect(onchange).not.toHaveBeenCalled();
	});

	it('previews on hover and ends the preview when the pointer leaves', async () => {
		const { container } = render(Rating, { label: 'Q', value: 1 });
		const labels = container.querySelectorAll('label.star');
		await fireEvent.pointerEnter(labels[3]);
		expect(lit(container)).toBe(4);
		await fireEvent.pointerLeave(container.querySelector('.k-rating') as Element);
		expect(lit(container)).toBe(1);
	});

	it('disabled ignores hover and picks', async () => {
		const onchange = vi.fn();
		const { container } = render(Rating, { label: 'Q', disabled: true, onchange });
		expect(container.querySelector('.k-rating')?.classList.contains('disabled')).toBe(true);
		expect(stars().every((s) => s.disabled)).toBe(true);
		await fireEvent.pointerEnter(container.querySelectorAll('label.star')[2]);
		expect(lit(container)).toBe(0);
		await fireEvent.change(stars()[2]);
		expect(onchange).not.toHaveBeenCalled();
	});

	it('takes name, required, a star label, hint, error and class', () => {
		const { container } = render(Rating, {
			label: 'Q',
			name: 'score',
			required: true,
			starLabel: '{value}/{max}',
			max: 3,
			hint: 'Pick one',
			error: 'Required',
			class: 'extra'
		});
		const group = screen.getByRole('radiogroup', { name: /Q/ });
		expect(group.getAttribute('aria-required')).toBe('true');
		expect(group.getAttribute('aria-invalid')).toBe('true');
		expect(group.getAttribute('aria-describedby')).toBe(screen.getByRole('alert').id);
		expect(stars().map((s) => s.name)).toEqual(['score', 'score', 'score']);
		expect(stars().every((s) => s.required)).toBe(true);
		expect(stars()[2].labels?.[0]?.textContent?.trim()).toBe('3/3');
		expect(container.querySelector('.k-field')?.classList.contains('extra')).toBe(true);
		expect(container.querySelector('.req')).not.toBeNull();
	});

	it('without a label the group has no labelledby', () => {
		render(Rating, {});
		expect(screen.getByRole('radiogroup').getAttribute('aria-labelledby')).toBeNull();
	});

	it.each([
		[0, 1],
		[50, 20],
		[3.7, 3],
		[Number.NaN, 5]
	])('max %s gives %s stars', (max, count) => {
		render(Rating, { label: 'Q', max });
		expect(stars()).toHaveLength(count);
	});

	it.each([
		[-2, 0],
		[9, 5],
		[Number.NaN, 0]
	])('value %s is shown as %s', (value, shownValue) => {
		const { container } = render(Rating, { label: 'Q', value });
		expect(lit(container)).toBe(shownValue);
	});
});

describe('Rating readonly', () => {
	it('is an image named with label and value, with partly filled stars', () => {
		const { container } = render(Rating, { label: 'Score', value: 3.46, readonly: true, required: true, hint: 'Average' });
		const img = screen.getByRole('img', { name: 'Score: 3.5 of 5 stars' });
		expect(img.getAttribute('aria-describedby')).toBe(screen.getByText('Average').id);
		expect(screen.queryByRole('radio')).toBeNull();
		const fills = [...container.querySelectorAll<SVGElement>('svg.full')].map((s) => s.style.clipPath);
		expect(fills).toHaveLength(4);
		expect(fills[0]).toMatch(/^inset\(0(px)? 0% 0(px)? 0(px)?\)$/);
		expect(fills[3]).toMatch(/^inset\(0(px)? 54(\.\d+)?% 0(px)? 0(px)?\)$/);
		expect(container.querySelector('.req')).toBeNull();
	});

	it('without a label is named by the value alone', () => {
		render(Rating, { value: 2, readonly: true, max: 4 });
		expect(screen.getByRole('img', { name: '2 of 4 stars' })).toBeTruthy();
	});
});
