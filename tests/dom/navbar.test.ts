/**
 * Navbar: the named navigation landmark with its links (`aria-current`), the brand and actions snippets
 * and the menu button of narrow widths (expanded state, controls, keyboard activation moving the focus
 * to the first link, Escape giving it back, closing on a link click or a click outside).
 */
import { fireEvent } from '@testing-library/dom';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import Navbar, { type NavbarItem } from '../../src/lib/components/Navbar.svelte';
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

	it('keyboard activation with no links keeps the focus on the button', async () => {
		const user = userEvent.setup();
		render(Navbar, { items: [] });
		toggle().focus();
		await user.keyboard(' ');
		await flush();
		expect(toggle().getAttribute('aria-expanded')).toBe('true');
		expect(document.activeElement).toBe(toggle());
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
});
