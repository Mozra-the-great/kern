/**
 * Breadcrumb: the named navigation with links and plain-text items, `aria-current="page"` on the last
 * item, separators, and collapsing: with `max` the middle items are removed behind an ellipsis button,
 * without it long trails only mark the middle items for narrow containers. Expanding moves the focus to
 * the first item that was hidden.
 */
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import Breadcrumb, { type BreadcrumbItem } from '../../src/lib/components/Breadcrumb.svelte';

function trail(n: number, linked = true): BreadcrumbItem[] {
	return Array.from({ length: n }, (_, i) => ({ label: `Item ${i}`, href: linked && i < n - 1 ? `#${i}` : undefined }));
}
function visibleLabels(): string[] {
	return Array.from(document.querySelectorAll('ol > li:not(.gap)')).map((li) => li.textContent.trim());
}

describe('Breadcrumb', () => {
	it('renders a named trail with links, the current page and separators between items', () => {
		render(Breadcrumb, { items: [{ label: 'Home', href: '/' }, { label: 'Docs', href: '/docs' }, { label: 'Page' }] });
		expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeTruthy();
		expect(screen.getByRole('link', { name: 'Home' }).hasAttribute('aria-current')).toBe(false);
		const current = screen.getByText('Page');
		expect(current.tagName).toBe('SPAN');
		expect(current.getAttribute('aria-current')).toBe('page');
		expect(screen.getByRole('link', { name: 'Docs' }).hasAttribute('aria-current')).toBe(false);
		expect(document.querySelectorAll('.sep')).toHaveLength(2);
		expect(document.querySelector('.more')).toBeNull();
	});

	it('a linked last item carries aria-current itself; a plain middle item does not', () => {
		render(Breadcrumb, {
			items: [{ label: 'Home', href: '/' }, { label: 'Section' }, { label: 'Page', href: '/page' }],
			label: 'Path',
			class: 'extra'
		});
		expect(screen.getByRole('navigation', { name: 'Path' }).classList.contains('extra')).toBe(true);
		expect(screen.getByRole('link', { name: 'Page' }).getAttribute('aria-current')).toBe('page');
		expect(screen.getByText('Section').hasAttribute('aria-current')).toBe(false);
	});

	it('without max a long trail keeps every item and marks the middle ones for narrow containers', () => {
		render(Breadcrumb, { items: trail(5) });
		expect(visibleLabels()).toHaveLength(5);
		const gap = document.querySelector('.gap');
		expect(gap?.classList.contains('narrow')).toBe(true);
		const mids = Array.from(document.querySelectorAll('li.mid')).map((li) => li.textContent.trim());
		expect(mids).toEqual(['Item 1', 'Item 2']);
	});

	it('three items or fewer never collapse without max', () => {
		render(Breadcrumb, { items: trail(3) });
		expect(document.querySelector('.gap')).toBeNull();
		expect(document.querySelectorAll('li.mid')).toHaveLength(0);
	});

	it('max removes the middle items behind a named ellipsis button; expanding focuses the first hidden one', async () => {
		const user = userEvent.setup();
		render(Breadcrumb, { items: trail(6), max: 3.7, expandLabel: 'Show all' });
		expect(visibleLabels()).toEqual(['Item 0', 'Item 4', 'Item 5']);
		const more = screen.getByRole('button', { name: 'Show all' });
		expect(more.closest('li')?.classList.contains('narrow')).toBe(false);
		await user.click(more);
		expect(visibleLabels()).toHaveLength(6);
		expect(screen.queryByRole('button')).toBeNull();
		expect(document.activeElement).toBe(screen.getByRole('link', { name: 'Item 1' }));
	});

	it('expanding focuses a plain-text item through its tabindex', async () => {
		const user = userEvent.setup();
		render(Breadcrumb, { items: trail(5, false), max: 2 });
		expect(visibleLabels()).toEqual(['Item 0', 'Item 4']);
		await user.click(screen.getByRole('button', { name: 'Show hidden items' }));
		expect(document.activeElement).toBe(screen.getByText('Item 1'));
	});

	it('max below 2 still shows the first and the last item', () => {
		render(Breadcrumb, { items: trail(4), max: 0 });
		expect(visibleLabels()).toEqual(['Item 0', 'Item 3']);
	});

	it('a max that fits shows every item', () => {
		render(Breadcrumb, { items: trail(3), max: 5 });
		expect(visibleLabels()).toHaveLength(3);
		expect(document.querySelector('.gap')).toBeNull();
	});
});
