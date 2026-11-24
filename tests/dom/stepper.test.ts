/**
 * Stepper: a named navigation with an ordered list of steps (complete, current with `aria-current="step"`,
 * upcoming), the spoken "completed" suffix, descriptions, orientation, completed steps as buttons with
 * `onstep`, the compact text (step n of total, all done, own templates), the compact back button and the
 * clamping of `current` (negative, beyond the end, non-finite, fractional).
 */
import { render, screen, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Stepper, { type StepItem } from '../../src/lib/components/Stepper.svelte';

const steps: StepItem[] = [
	{ id: 'cart', label: 'Cart' },
	{ id: 'address', label: 'Address', description: 'Where to ship' },
	{ id: 'pay', label: 'Payment' }
];

function states(): (string | undefined)[] {
	return screen.getAllByRole('listitem').map((li) => li.dataset['state']);
}

describe('Stepper', () => {
	it('starts at the first step with the default labels', () => {
		render(Stepper, { steps });
		const nav = screen.getByRole('navigation', { name: 'Progress' });
		expect(nav.dataset['orientation']).toBe('horizontal');
		expect(states()).toEqual(['current', 'upcoming', 'upcoming']);
		const items = screen.getAllByRole('listitem');
		expect(items.map((li) => li.getAttribute('aria-current'))).toEqual(['step', null, null]);
		expect(items[0]?.querySelector('.marker')?.textContent.trim()).toBe('1');
		expect(items[1]?.querySelector('.desc')?.textContent).toBe('Where to ship');
		expect(items[0]?.querySelector('.desc')).toBeNull();
		expect(document.querySelector('.compact-text')?.textContent).toBe('Step 1 of 3: Cart');
		expect(screen.queryByRole('button')).toBeNull();
		expect(Array.from(document.querySelectorAll('.seg')).map((s) => s.getAttribute('data-state'))).toEqual([
			'current',
			'upcoming',
			'upcoming'
		]);
	});

	it('marks earlier steps complete with a check and spoken suffix; own labels and orientation', () => {
		render(Stepper, {
			steps,
			current: 2,
			orientation: 'vertical',
			label: 'Checkout',
			completeLabel: 'done',
			compactLabel: '{current}/{total} {label}',
			class: 'mine'
		});
		const nav = screen.getByRole('navigation', { name: 'Checkout' });
		expect(nav.dataset['orientation']).toBe('vertical');
		expect(nav.classList.contains('mine')).toBe(true);
		expect(states()).toEqual(['complete', 'complete', 'current']);
		const first = screen.getAllByRole('listitem')[0] as HTMLElement;
		expect(first.querySelector('.marker svg')).not.toBeNull();
		expect(first.querySelector('.sr')?.textContent).toBe(', done');
		expect(document.querySelector('.compact-text')?.textContent).toBe('3/3 Payment');
	});

	it('shows the done text once every step is complete', () => {
		const { unmount } = render(Stepper, { steps, current: 3 });
		expect(states()).toEqual(['complete', 'complete', 'complete']);
		expect(document.querySelector('.compact-text')?.textContent).toBe('All 3 steps completed');
		unmount();
		render(Stepper, { steps, current: 3, doneLabel: 'Finished {total}' });
		expect(document.querySelector('.compact-text')?.textContent).toBe('Finished 3');
	});

	it('clamps current', () => {
		const { unmount } = render(Stepper, { steps, current: -2 });
		expect(states()).toEqual(['current', 'upcoming', 'upcoming']);
		unmount();
		const second = render(Stepper, { steps, current: 99 });
		expect(states()).toEqual(['complete', 'complete', 'complete']);
		second.unmount();
		const third = render(Stepper, { steps, current: Number.NaN });
		expect(states()).toEqual(['current', 'upcoming', 'upcoming']);
		third.unmount();
		render(Stepper, { steps, current: 1.8 });
		expect(states()).toEqual(['complete', 'current', 'upcoming']);
	});

	it('with onstep completed steps are buttons and the compact view has a back button', async () => {
		const user = userEvent.setup();
		const onstep = vi.fn();
		render(Stepper, { steps, current: 2, onstep, backLabel: 'Return to {label}' });
		const list = screen.getByRole('list');
		const buttons = within(list).getAllByRole('button');
		expect(buttons.map((b) => b.textContent.replace(/\s+/g, ' ').trim())).toEqual(['Cart, completed', 'Address, completed Where to ship']);
		await user.click(buttons[0] as HTMLElement);
		expect(onstep).toHaveBeenLastCalledWith(0, steps[0]);
		await user.click(screen.getByRole('button', { name: 'Return to Address' }));
		expect(onstep).toHaveBeenLastCalledWith(1, steps[1]);
	});

	it('has no back button on the first step and uses the default back label', () => {
		const { unmount } = render(Stepper, { steps, current: 0, onstep: vi.fn() });
		expect(screen.queryByRole('button')).toBeNull();
		unmount();
		render(Stepper, { steps, current: 1, onstep: vi.fn() });
		expect(screen.getByRole('button', { name: 'Back to Cart' })).toBeTruthy();
	});

	it('handles an empty step list', () => {
		render(Stepper, { steps: [] });
		expect(screen.queryAllByRole('listitem')).toHaveLength(0);
		expect(document.querySelector('.compact-text')?.textContent).toBe('All 0 steps completed');
	});
});
