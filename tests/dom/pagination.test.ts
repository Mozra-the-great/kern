/**
 * Pagination: the navigation landmark and its labels (defaults and own texts), the page buttons with
 * `aria-current`, the gaps for long ranges (right, left, both, none; `siblings`), previous and next with
 * `aria-disabled` at the edges, `bind:page` and `onchange` (not called for the current page), clamping of
 * out-of-range, fractional and missing values, and the compact "Page 3 of 12" text.
 */
import { render, screen, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Pagination from '../../src/lib/components/Pagination.svelte';
import { reactive } from './reactive.svelte.js';

/** The visible slots: page numbers and `…` for gaps. */
function slots(): string[] {
	return Array.from(document.querySelectorAll('li.num')).map((li) => (li.classList.contains('gap') ? '…' : li.textContent.trim()));
}

describe('Pagination', () => {
	it('is a named navigation with default labels and a disabled previous button on the first page', () => {
		render(Pagination, { pageCount: 3 });
		const nav = screen.getByRole('navigation', { name: 'Pagination' });
		expect(within(nav).getByRole('button', { name: 'Previous' }).getAttribute('aria-disabled')).toBe('true');
		expect(within(nav).getByRole('button', { name: 'Next' }).getAttribute('aria-disabled')).toBe('false');
		expect(screen.getByRole('button', { name: 'Page 1' }).getAttribute('aria-current')).toBe('page');
		expect(screen.getByRole('button', { name: 'Page 2' }).getAttribute('aria-current')).toBeNull();
		expect(slots()).toEqual(['1', '2', '3']);
		expect(document.querySelector('.compact .sr')?.textContent).toBe('Page 1 of 3');
		expect(document.querySelector('.compact [aria-hidden]')?.textContent).toBe('1 / 3');
	});

	it('uses its own labels and class', () => {
		render(Pagination, {
			page: 2,
			pageCount: 4,
			label: 'Results',
			prevLabel: 'Back',
			nextLabel: 'Forward',
			pageLabel: 'Seite',
			ofLabel: 'von',
			class: 'mine'
		});
		const nav = screen.getByRole('navigation', { name: 'Results' });
		expect(nav.classList.contains('mine')).toBe(true);
		expect(screen.getByRole('button', { name: 'Back' })).toBeTruthy();
		expect(screen.getByRole('button', { name: 'Forward' })).toBeTruthy();
		expect(screen.getByRole('button', { name: 'Seite 2' }).getAttribute('aria-current')).toBe('page');
		expect(document.querySelector('.compact .sr')?.textContent).toBe('Seite 2 von 4');
	});

	it('shows gaps on the right, on the left and on both sides of a long range', async () => {
		const props = reactive({ page: 1, pageCount: 20 });
		render(Pagination, { props });
		expect(slots()).toEqual(['1', '2', '3', '4', '5', '…', '20']);
		props.page = 10;
		await vi.waitFor(() => expect(slots()).toEqual(['1', '…', '9', '10', '11', '…', '20']));
		props.page = 20;
		await vi.waitFor(() => expect(slots()).toEqual(['1', '…', '16', '17', '18', '19', '20']));
	});

	it('siblings widens the window and 0 or an invalid value shows only the current page between gaps', async () => {
		const props = reactive<{ page: number; pageCount: number; siblings: number }>({ page: 10, pageCount: 20, siblings: 2 });
		render(Pagination, { props });
		expect(slots()).toEqual(['1', '…', '8', '9', '10', '11', '12', '…', '20']);
		props.siblings = 0;
		await vi.waitFor(() => expect(slots()).toEqual(['1', '…', '10', '…', '20']));
		props.siblings = Number.NaN;
		await vi.waitFor(() => expect(slots()).toEqual(['1', '…', '10', '…', '20']));
	});

	it('next, previous and page buttons update the bound page and call onchange', async () => {
		const user = userEvent.setup();
		const onchange = vi.fn();
		const props = reactive<{ page: number | undefined; pageCount: number; onchange: (page: number) => void }>({
			page: undefined,
			pageCount: 5,
			onchange
		});
		render(Pagination, { props });
		await user.click(screen.getByRole('button', { name: 'Next' }));
		expect(props.page).toBe(2);
		expect(onchange).toHaveBeenLastCalledWith(2);
		await user.click(screen.getByRole('button', { name: 'Page 5' }));
		expect(props.page).toBe(5);
		expect(screen.getByRole('button', { name: 'Next' }).getAttribute('aria-disabled')).toBe('true');
		onchange.mockClear();
		// At the edge and on the current page nothing changes.
		await user.click(screen.getByRole('button', { name: 'Next' }));
		await user.click(screen.getByRole('button', { name: 'Page 5' }));
		expect(onchange).not.toHaveBeenCalled();
		await user.click(screen.getByRole('button', { name: 'Previous' }));
		expect(props.page).toBe(4);
		expect(onchange).toHaveBeenCalledWith(4);
	});

	it('works without onchange', async () => {
		const user = userEvent.setup();
		const props = reactive({ page: 1, pageCount: 2 });
		render(Pagination, { props });
		await user.click(screen.getByRole('button', { name: 'Page 2' }));
		expect(props.page).toBe(2);
	});

	it('clamps the page and the page count', () => {
		const { unmount } = render(Pagination, { page: 99, pageCount: 3.7 });
		expect(screen.getByRole('button', { name: 'Page 3' }).getAttribute('aria-current')).toBe('page');
		expect(slots()).toEqual(['1', '2', '3']);
		unmount();
		const second = render(Pagination, { page: Number.NaN, pageCount: 0 });
		expect(slots()).toEqual(['1']);
		expect(screen.getByRole('button', { name: 'Page 1' }).getAttribute('aria-current')).toBe('page');
		expect(screen.getByRole('button', { name: 'Next' }).getAttribute('aria-disabled')).toBe('true');
		second.unmount();
		render(Pagination, { page: -4, pageCount: Number.NaN });
		expect(slots()).toEqual(['1']);
	});
});
