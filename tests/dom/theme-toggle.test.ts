/**
 * ThemeToggle: the two-theme switch button (aria-pressed, labels) and the menu for more themes, the starting
 * theme (stored choice, `value`, system, page attribute), the target (element, selector, null), persistence,
 * `followSystem` until the user chooses, and following `data-theme` changes made by other code.
 */
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ThemeToggle from '../../src/lib/components/ThemeToggle.svelte';
import { setMedia } from './env.js';
import { flush } from './helpers.js';
import { reactive } from './reactive.svelte.js';

const DARK = '(prefers-color-scheme: dark)';
const html = document.documentElement;

beforeEach(() => {
	html.removeAttribute('data-theme');
	localStorage.clear();
});
afterEach(() => {
	html.removeAttribute('data-theme');
	localStorage.clear();
	vi.unstubAllGlobals();
});

describe('ThemeToggle as a switch', () => {
	it('defaults to the pair of the page family and toggles it', async () => {
		const user = userEvent.setup();
		html.setAttribute('data-theme', 'flower');
		const onchange = vi.fn();
		render(ThemeToggle, { onchange });
		const button = screen.getByRole('button', { name: 'Dark mode' });
		expect(button.getAttribute('aria-pressed')).toBe('false');
		await user.click(button);
		expect(html.getAttribute('data-theme')).toBe('flower-wald');
		expect(button.getAttribute('aria-pressed')).toBe('true');
		expect(onchange).toHaveBeenCalledWith('flower-wald');
		await user.click(button);
		expect(html.getAttribute('data-theme')).toBe('flower');
		expect(onchange).toHaveBeenLastCalledWith('flower');
	});

	it('binds value, uses a custom label and class, and remembers the choice', async () => {
		const user = userEvent.setup();
		const props = reactive<{ value: string | undefined; label: string; persist: string; class: string }>({
			value: 'pop',
			label: 'Night',
			persist: 'theme-key',
			class: 'extra'
		});
		render(ThemeToggle, { props });
		const button = screen.getByRole('button', { name: 'Night' });
		expect(button.classList.contains('extra')).toBe(true);
		expect(html.getAttribute('data-theme')).toBe('pop');
		await user.click(button);
		expect(props.value).toBe('pop-dark');
		expect(localStorage.getItem('theme-key')).toBe('pop-dark');
		props.value = 'pop';
		await vi.waitFor(() => expect(html.getAttribute('data-theme')).toBe('pop'));
		expect(button.getAttribute('aria-pressed')).toBe('false');
	});

	it('a stored choice wins over the value prop', () => {
		localStorage.setItem('k', 'line');
		render(ThemeToggle, { value: 'line-light', persist: 'k' });
		expect(html.getAttribute('data-theme')).toBe('line');
		expect(screen.getByRole('button').getAttribute('aria-pressed')).toBe('true');
	});

	it('ignores a stored id that is not one of the themes', () => {
		localStorage.setItem('k', 'acme');
		html.setAttribute('data-theme', 'code-light');
		render(ThemeToggle, { persist: 'k' });
		expect(html.getAttribute('data-theme')).toBe('code-light');
	});

	it('is pressed for a dark value that is neither of the two themes', () => {
		render(ThemeToggle, {
			props: {
				themes: [
					{ id: 'a', label: 'A' },
					{ id: 'b', label: 'B' }
				],
				value: 'brand-dark',
				target: null
			}
		});
		expect(screen.getByRole('button').getAttribute('aria-pressed')).toBe('true');
	});

	it('is not pressed without a value', () => {
		render(ThemeToggle, { props: { target: null } });
		expect(screen.getByRole('button').getAttribute('aria-pressed')).toBe('false');
	});

	it('follows data-theme changes that other code makes', async () => {
		html.setAttribute('data-theme', 'code-light');
		const props = reactive<{ value: string | undefined }>({ value: undefined });
		render(ThemeToggle, { props });
		expect(props.value).toBe('code-light');
		html.setAttribute('data-theme', 'code');
		await vi.waitFor(() => expect(props.value).toBe('code'));
		expect(screen.getByRole('button').getAttribute('aria-pressed')).toBe('true');
		html.removeAttribute('data-theme');
		await Promise.resolve();
		expect(props.value).toBe('code');
	});
});

describe('ThemeToggle target', () => {
	it('switches an element given directly', async () => {
		const user = userEvent.setup();
		const box = document.createElement('div');
		box.setAttribute('data-theme', 'line-light');
		document.body.append(box);
		render(ThemeToggle, { props: { target: box } });
		await user.click(screen.getByRole('button'));
		expect(box.getAttribute('data-theme')).toBe('line');
		expect(html.hasAttribute('data-theme')).toBe(false);
		box.remove();
	});

	it('finds the element by selector, and ignores a selector that matches nothing', async () => {
		const user = userEvent.setup();
		const box = document.createElement('section');
		box.id = 'themed';
		box.setAttribute('data-theme', 'pop');
		document.body.append(box);
		const props = reactive<{ target: string }>({ target: '#missing' });
		render(ThemeToggle, { props });
		await user.click(screen.getByRole('button'));
		expect(box.getAttribute('data-theme')).toBe('pop');
		props.target = '#themed';
		await vi.waitFor(() => expect(box.getAttribute('data-theme')).toBe('code'));
		box.remove();
	});

	it('a later target without data-theme gets the current value', async () => {
		const box = document.createElement('div');
		document.body.append(box);
		const props = reactive<{ target: HTMLElement | null; value: string | undefined }>({ target: null, value: 'pop-dark' });
		render(ThemeToggle, { props });
		props.target = html;
		await vi.waitFor(() => expect(html.getAttribute('data-theme')).toBe('pop-dark'));
		props.target = box;
		await vi.waitFor(() => expect(box.getAttribute('data-theme')).toBe('pop-dark'));
		expect(props.value).toBe('pop-dark');
		box.remove();
	});

	it('null waits for a target and switches nothing', async () => {
		const user = userEvent.setup();
		const onchange = vi.fn();
		render(ThemeToggle, { props: { target: null, value: 'code', onchange } });
		await user.click(screen.getByRole('button'));
		expect(onchange).toHaveBeenCalledWith('code-light');
		expect(html.hasAttribute('data-theme')).toBe(false);
	});
});

describe('ThemeToggle followSystem', () => {
	it('starts with the system scheme and follows it until the user chooses', async () => {
		const user = userEvent.setup();
		setMedia(DARK, true);
		html.setAttribute('data-theme', 'flower');
		const props = reactive<{ value: string | undefined; followSystem: boolean }>({ value: undefined, followSystem: true });
		render(ThemeToggle, { props });
		expect(html.getAttribute('data-theme')).toBe('flower-wald');
		// Let the observer see its own first write before the system changes.
		await flush();
		setMedia(DARK, false);
		await vi.waitFor(() => expect(html.getAttribute('data-theme')).toBe('flower'));
		await user.click(screen.getByRole('button'));
		expect(props.value).toBe('flower-wald');
		setMedia(DARK, false);
		await Promise.resolve();
		expect(props.value).toBe('flower-wald');
	});

	it('the system does not override a value prop', () => {
		setMedia(DARK, false);
		render(ThemeToggle, { value: 'pop-dark', followSystem: true });
		expect(html.getAttribute('data-theme')).toBe('pop-dark');
	});

	it('in a list without a theme of the system scheme keeps the page theme', () => {
		setMedia(DARK, true);
		html.setAttribute('data-theme', 'pop');
		render(ThemeToggle, {
			themes: [
				{ id: 'pop', label: 'Pop' },
				{ id: 'flower', label: 'Flower' },
				{ id: 'code-light', label: 'Code' }
			],
			followSystem: true
		});
		expect(html.getAttribute('data-theme')).toBe('pop');
		setMedia(DARK, true);
		expect(html.getAttribute('data-theme')).toBe('pop');
	});

	it('without matchMedia it uses the page theme', () => {
		vi.stubGlobal('matchMedia', undefined);
		html.setAttribute('data-theme', 'line');
		render(ThemeToggle, { followSystem: true });
		expect(screen.getByRole('button').getAttribute('aria-pressed')).toBe('true');
	});
});

describe('ThemeToggle as a menu', () => {
	const themes = [
		{ id: 'code', label: 'Code' },
		{ id: 'flower', label: 'Flower' },
		{ id: 'pop', label: 'Pop' }
	];

	it('renders a labelled select of the themes and switches on change', async () => {
		const user = userEvent.setup();
		const onchange = vi.fn();
		render(ThemeToggle, { themes, value: 'flower', persist: 'menu', onchange, class: 'mine' });
		const select = screen.getByRole<HTMLSelectElement>('combobox', { name: 'Theme' });
		expect(select.closest('.k-theme-toggle')?.classList.contains('mine')).toBe(true);
		expect(select.value).toBe('flower');
		expect([...select.options].map((o) => o.textContent)).toEqual(['Code', 'Flower', 'Pop']);
		await user.selectOptions(select, 'pop');
		expect(html.getAttribute('data-theme')).toBe('pop');
		expect(localStorage.getItem('menu')).toBe('pop');
		expect(onchange).toHaveBeenCalledWith('pop');
	});

	it('uses a custom label and shows no selection without a value', async () => {
		const props = reactive<{ themes: typeof themes; label: string | undefined; target: null; value: string | undefined }>({
			themes,
			label: 'Look',
			target: null,
			value: undefined
		});
		render(ThemeToggle, { props });
		const select = screen.getByRole<HTMLSelectElement>('combobox', { name: 'Look' });
		expect(select.selectedIndex).toBe(-1);
		props.value = 'pop';
		props.label = undefined;
		await vi.waitFor(() => expect(select.value).toBe('pop'));
		expect(select.getAttribute('aria-label')).toBe('Theme');
		props.value = undefined;
		await vi.waitFor(() => expect(select.selectedIndex).toBe(-1));
	});

	it('switches between toggle and menu when the themes change', async () => {
		const props = reactive<{ themes: typeof themes; target: null; label: string | undefined }>({
			themes: themes.slice(0, 2),
			target: null,
			label: 'Mode'
		});
		render(ThemeToggle, { props });
		expect(screen.getByRole('button', { name: 'Mode' })).toBeTruthy();
		props.label = undefined;
		await vi.waitFor(() => expect(screen.getByRole('button', { name: 'Dark mode' })).toBeTruthy());
		props.themes = themes;
		await vi.waitFor(() => expect(screen.getByRole('combobox', { name: 'Theme' })).toBeTruthy());
		props.themes = themes.map((t) => ({ ...t, label: `${t.label}!` }));
		await vi.waitFor(() => expect(screen.getByRole('option', { name: 'Pop!' })).toBeTruthy());
	});
});

describe('ThemeToggle with fewer than two themes', () => {
	it('renders nothing for a single theme', () => {
		const { container } = render(ThemeToggle, { props: { themes: [{ id: 'code', label: 'Code' }], target: null } });
		expect(container.querySelector('.k-theme-toggle')).toBeNull();
	});
});
