/**
 * Navbar: the named navigation landmark with its links (`aria-current`), the brand and actions snippets
 * and the menu button of narrow widths (expanded state, controls, keyboard activation moving the focus
 * to the first link, Escape giving it back, closing on a link click or a click outside), and the bar without items
 * (#131: brand and actions only, no menu button, no empty landmark).
 */
import { fireEvent } from '@testing-library/dom';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import Navbar, { type NavbarItem } from '../../src/lib/components/Navbar.svelte';
import { setMedia } from './env.js';
import { flush, textSnippet } from './helpers.js';

const items: NavbarItem[] = [
	{ label: 'Home', href: '#home', current: true },
	{ label: 'Docs', href: '#docs' }
];

function toggle(name = 'Menu'): HTMLButtonElement {
	return screen.getByRole<HTMLButtonElement>('button', { name });
}

describe('Navbar', () => {
	it('renders a named navigation with the current page marked', () => {
		render(Navbar, { items });
		const nav = screen.getByRole('navigation', { name: 'Main' });
		expect(nav.dataset.open).toBe('false');
		expect(screen.getByRole('link', { name: 'Home' }).getAttribute('aria-current')).toBe('page');
		expect(screen.getByRole('link', { name: 'Docs' }).hasAttribute('aria-current')).toBe(false);
		expect(toggle().getAttribute('aria-expanded')).toBe('false');
		expect(toggle().getAttribute('aria-controls')).toBe(nav.id);
		expect(document.querySelector('.brand')).toBeNull();
		expect(document.querySelector('.actions')).toBeNull();
	});

	it('uses the given texts, class, brand and actions', () => {
		render(Navbar, {
			items,
			label: 'Site',
			menuLabel: 'Open menu',
			class: 'extra',
			brand: textSnippet('kern'),
			actions: textSnippet('Sign in')
		});
		expect(screen.getByRole('navigation', { name: 'Site' })).toBeTruthy();
		expect(toggle('Open menu')).toBeTruthy();
		expect(document.querySelector('header')?.classList.contains('extra')).toBe(true);
		expect(document.querySelector('.brand')?.textContent).toBe('kern');
		expect(document.querySelector('.actions')?.textContent).toBe('Sign in');
	});

	it('a pointer click opens and closes the menu without moving the focus', async () => {
		const user = userEvent.setup();
		render(Navbar, { items });
		await user.click(toggle());
		expect(toggle().getAttribute('aria-expanded')).toBe('true');
		expect(document.querySelector('header')?.classList.contains('open')).toBe(true);
		expect(screen.getByRole('navigation').dataset.open).toBe('true');
		expect(document.activeElement).toBe(toggle());
		await user.click(toggle());
		expect(toggle().getAttribute('aria-expanded')).toBe('false');
	});

	it('keyboard activation moves the focus to the first link, Escape closes and returns it', async () => {
		const user = userEvent.setup();
		render(Navbar, { items });
		toggle().focus();
		await user.keyboard('{Enter}');
		await flush();
		expect(document.activeElement).toBe(screen.getByRole('link', { name: 'Home' }));
		await user.keyboard('{Escape}');
		expect(toggle().getAttribute('aria-expanded')).toBe('false');
		expect(document.activeElement).toBe(toggle());
	});

	it('Escape while closed and other keys leave everything alone', async () => {
		const user = userEvent.setup();
		render(Navbar, { items });
		toggle().focus();
		expect(fireEvent.keyDown(toggle(), { key: 'Escape' })).toBe(true);
		await user.click(toggle());
		expect(fireEvent.keyDown(toggle(), { key: 'a' })).toBe(true);
		expect(toggle().getAttribute('aria-expanded')).toBe('true');
	});

	it('closes when a link is followed or on a click outside, not on a click inside', async () => {
		const user = userEvent.setup();
		render(Navbar, { items, brand: textSnippet('kern') });
		await user.click(document.body);
		await user.click(toggle());
		await user.click(document.querySelector('.brand') ?? document.body);
		expect(toggle().getAttribute('aria-expanded')).toBe('true');
		await user.click(screen.getByRole('link', { name: 'Docs' }));
		expect(toggle().getAttribute('aria-expanded')).toBe('false');
		await user.click(toggle());
		await user.click(document.body);
		expect(toggle().getAttribute('aria-expanded')).toBe('false');
	});

	describe('without items (#131)', () => {
		/* The wide/narrow switch is a CSS container query, not script, and jsdom does not evaluate it: setMedia only
		 * proves that no media state brings a menu button or a nav landmark back. */
		const PHONE = '(max-width: 719px)';
		const cases: [string, { items?: NavbarItem[] | undefined }][] = [
			['empty items', { items: [] }],
			['omitted items', {}],
			['undefined items', { items: undefined }]
		];

		it.each(cases)('%s: brand and actions only, no menu button, no nav, no list', (_name, props) => {
			render(Navbar, { ...props, brand: textSnippet('kern'), actions: textSnippet('Sign in') });
			expect(document.querySelector('.brand')?.textContent).toBe('kern');
			expect(document.querySelector('.actions')?.textContent).toBe('Sign in');
			expect(screen.queryByRole('navigation')).toBeNull();
			expect(screen.queryByRole('button')).toBeNull();
			expect(document.querySelector('nav, .panel, ul, button, svg')).toBeNull();
			expect(document.querySelector('header')?.classList.contains('open')).toBe(false);
		});

		it.each(cases)('%s: nothing comes back at the phone breakpoint', (_name, props) => {
			setMedia(PHONE, true);
			try {
				render(Navbar, { ...props, label: 'Site', menuLabel: 'Open menu', brand: textSnippet('kern') });
				expect(screen.queryByRole('navigation')).toBeNull();
				expect(screen.queryByRole('button', { name: 'Open menu' })).toBeNull();
				expect(document.querySelector('nav, .panel, button')).toBeNull();
			} finally {
				setMedia(PHONE, false);
			}
		});

		it('with items the menu button and the landmark stay at both widths', () => {
			try {
				for (const phone of [false, true]) {
					setMedia(PHONE, phone);
					const { unmount } = render(Navbar, { items, brand: textSnippet('kern') });
					expect(screen.getByRole('navigation', { name: 'Main' })).toBeTruthy();
					expect(toggle()).toBeTruthy();
					expect(screen.getAllByRole('link')).toHaveLength(2);
					unmount();
				}
			} finally {
				setMedia(PHONE, false);
			}
		});

		it('removing the last item removes the button and closes the menu; items coming back start closed', async () => {
			const user = userEvent.setup();
			const { rerender } = render(Navbar, { items, brand: textSnippet('kern') });
			await user.click(toggle());
			expect(document.querySelector('header')?.classList.contains('open')).toBe(true);
			await rerender({ items: [] });
			await flush();
			expect(screen.queryByRole('button')).toBeNull();
			expect(screen.queryByRole('navigation')).toBeNull();
			expect(document.querySelector('header')?.classList.contains('open')).toBe(false);
			await rerender({ items });
			expect(toggle().getAttribute('aria-expanded')).toBe('false');
			expect(screen.getByRole('navigation').dataset.open).toBe('false');
		});

		it('Escape and an outside click on a bar without items do nothing', async () => {
			const user = userEvent.setup();
			render(Navbar, { items: [], brand: textSnippet('kern') });
			expect(fireEvent.keyDown(document.querySelector('header') ?? document.body, { key: 'Escape' })).toBe(true);
			await user.click(document.body);
			expect(document.querySelector('header')?.classList.contains('open')).toBe(false);
		});
	});
});
