/**
 * SegmentedControl: a radiogroup of native radios. Covers the name (visible label or `ariaLabel`), the
 * shared radio name, `bind:value`, `onchange` for user picks only, disabled group and options, hint and
 * error through Field.
 */
import { fireEvent, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import SegmentedControl, { type SegmentOption } from '../../src/lib/components/SegmentedControl.svelte';
import { reactive } from './reactive.svelte.js';

const options: SegmentOption[] = [
	{ value: 'day', label: 'Day' },
	{ value: 'week', label: 'Week' },
	{ value: 'month', label: 'Month', disabled: true }
];

describe('SegmentedControl', () => {
	it('is a radiogroup named by its visible label, nothing chosen without a value', () => {
		render(SegmentedControl, { label: 'Range', options });
		const group = screen.getByRole('radiogroup', { name: 'Range' });
		expect(group.getAttribute('aria-label')).toBeNull();
		expect(group.getAttribute('aria-invalid')).toBeNull();
		expect(group.getAttribute('aria-disabled')).toBeNull();
		expect(group.classList.contains('block')).toBe(false);
		const radios = screen.getAllByRole<HTMLInputElement>('radio');
		expect(radios.map((r) => r.checked)).toEqual([false, false, false]);
		expect(new Set(radios.map((r) => r.name)).size).toBe(1);
		expect(radios[0]?.name).toMatch(/-seg$/);
		expect(radios[2]?.disabled).toBe(true);
		expect(document.querySelector('.seg.on')).toBeNull();
	});

	it('ariaLabel names it without a visible label', () => {
		render(SegmentedControl, { ariaLabel: 'View', options, name: 'view', block: true, class: 'sc' });
		const group = screen.getByRole('radiogroup', { name: 'View' });
		expect(group.getAttribute('aria-labelledby')).toBeNull();
		expect(group.classList.contains('block')).toBe(true);
		expect(document.querySelector('.k-field')?.classList.contains('sc')).toBe(true);
		expect(screen.getAllByRole<HTMLInputElement>('radio').every((r) => r.name === 'view')).toBe(true);
	});

	it('a pick checks the option, binds the value and reports it once', async () => {
		const user = userEvent.setup();
		const onchange = vi.fn();
		const props = reactive<{ label: string; options: SegmentOption[]; value: string | undefined; onchange: (v: string) => void }>({
			label: 'Range',
			options,
			value: 'day',
			onchange
		});
		render(SegmentedControl, { props });
		const [day, week] = screen.getAllByRole<HTMLInputElement>('radio');
		expect(day?.checked).toBe(true);
		expect(day?.closest('.seg')?.classList.contains('on')).toBe(true);
		await user.click(screen.getByLabelText('Week'));
		expect(week?.checked).toBe(true);
		expect(props.value).toBe('week');
		expect(onchange).toHaveBeenCalledExactlyOnceWith('week');
		props.value = 'day';
		await vi.waitFor(() => expect(day?.checked).toBe(true));
		expect(onchange).toHaveBeenCalledTimes(1);
	});

	it('a change event for the option already chosen does nothing', async () => {
		const onchange = vi.fn();
		render(SegmentedControl, { label: 'Range', options, value: 'day', onchange });
		const day = screen.getByLabelText<HTMLInputElement>('Day');
		await fireEvent.change(day);
		expect(onchange).not.toHaveBeenCalled();
	});

	it('picks without an onchange callback, from no value', async () => {
		const user = userEvent.setup();
		render(SegmentedControl, { label: 'Range', options });
		await user.click(screen.getByLabelText('Day'));
		expect(screen.getByLabelText<HTMLInputElement>('Day').checked).toBe(true);
	});

	it('disabled disables every radio and says so on the group', () => {
		render(SegmentedControl, { label: 'Range', options, disabled: true });
		expect(screen.getByRole('radiogroup').getAttribute('aria-disabled')).toBe('true');
		expect(screen.getAllByRole<HTMLInputElement>('radio').every((r) => r.disabled)).toBe(true);
	});

	it('hint describes the group; an error invalidates it and is announced', () => {
		const { unmount } = render(SegmentedControl, { label: 'Range', options, hint: 'Pick one' });
		expect(screen.getByRole('radiogroup').getAttribute('aria-describedby')).toBe(screen.getByText('Pick one').id);
		unmount();
		render(SegmentedControl, { label: 'Range', options, error: 'Required' });
		const group = screen.getByRole('radiogroup');
		expect(group.getAttribute('aria-invalid')).toBe('true');
		expect(group.classList.contains('invalid')).toBe(true);
		expect(group.getAttribute('aria-describedby')).toBe(screen.getByRole('alert').id);
	});
});
