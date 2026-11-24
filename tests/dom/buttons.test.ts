/**
 * Button, IconButton and Link (stuffcloud: buttons.test.ts "Button" and "LinkButton"; kern's Button is
 * both: with `href` it renders an anchor). stuffcloud's `buttonClasses` / button.css cases are not
 * portable: kern styles through data attributes and tokens (tests/tokens, tests/targets).
 */
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Button from '../../src/lib/components/Button.svelte';
import IconButton from '../../src/lib/components/IconButton.svelte';
import Link from '../../src/lib/components/Link.svelte';
import { resetStrings, setStrings } from '../../src/lib/components/strings.js';
import { de } from '../../src/lib/components/strings-de.js';
import { flush, textSnippet } from './helpers.js';

afterEach(() => {
	resetStrings();
});

describe('Button', () => {
	it('renders a real button that is type=button unless told otherwise', () => {
		render(Button, { children: textSnippet('Save') });
		const button = screen.getByRole('button', { name: 'Save' });
		expect(button.tagName).toBe('BUTTON');
		expect(button.getAttribute('type')).toBe('button');
		expect(button.getAttribute('data-variant')).toBe('primary');
		expect(button.getAttribute('data-size')).toBe('md');
	});

	it('passes type, disabled and aria attributes through', () => {
		render(Button, { type: 'submit', disabled: true, 'aria-label': 'Send', children: textSnippet('x') });
		const button = screen.getByRole<HTMLButtonElement>('button', { name: 'Send' });
		expect(button.getAttribute('type')).toBe('submit');
		expect(button.disabled).toBe(true);
	});

	it('applies variant, size, block, wide and a custom class', () => {
		render(Button, { variant: 'danger', size: 'lg', wide: true, class: 'extra', children: textSnippet('Delete') });
		const button = screen.getByRole('button');
		expect(button.getAttribute('data-variant')).toBe('danger');
		expect(button.getAttribute('data-size')).toBe('lg');
		expect(button.classList.contains('wide')).toBe(true);
		expect(button.classList.contains('block')).toBe(true);
		expect(button.classList.contains('extra')).toBe(true);
	});

	it('block alone is full width without the wide layout', () => {
		render(Button, { block: true, children: textSnippet('Go') });
		const button = screen.getByRole('button');
		expect(button.classList.contains('block')).toBe(true);
		expect(button.classList.contains('wide')).toBe(false);
	});

	it('calls onclick when clicked and not when disabled', async () => {
		const user = userEvent.setup();
		const onclick = vi.fn();
		const { rerender } = render(Button, { onclick, children: textSnippet('Go') });
		await user.click(screen.getByRole('button'));
		expect(onclick).toHaveBeenCalledTimes(1);

		await rerender({ disabled: true });
		await user.click(screen.getByRole('button'));
		expect(onclick).toHaveBeenCalledTimes(1);
	});

	it('is reachable and operable with the keyboard (Enter and Space)', async () => {
		const user = userEvent.setup();
		const onclick = vi.fn();
		render(Button, { onclick, children: textSnippet('Go') });
		await user.tab();
		expect(screen.getByRole('button')).toBe(document.activeElement);
		await user.keyboard('{Enter}');
		await user.keyboard(' ');
		expect(onclick).toHaveBeenCalledTimes(2);
	});

	it('loading shows a spinner, blocks clicks, sets aria-busy and leaves the tab order', async () => {
		const user = userEvent.setup();
		const onclick = vi.fn();
		render(Button, { loading: true, onclick, children: textSnippet('Save') });
		const button = screen.getByRole<HTMLButtonElement>('button', { name: 'Save' });
		expect(button.disabled).toBe(true);
		expect(button.getAttribute('aria-busy')).toBe('true');
		expect(button.querySelector('.spin')?.getAttribute('aria-hidden')).toBe('true');
		await user.click(button);
		await user.tab();
		expect(document.activeElement).not.toBe(button);
		expect(onclick).not.toHaveBeenCalled();
	});

	it('an idle button has no aria-busy and no spinner', () => {
		render(Button, { children: textSnippet('Save') });
		const button = screen.getByRole('button');
		expect(button.hasAttribute('aria-busy')).toBe(false);
		expect(button.querySelector('.spin')).toBeNull();
	});

	describe('as a link (href)', () => {
		it('renders a link with the button look', () => {
			render(Button, { href: '/tools', children: textSnippet('Tools') });
			const link = screen.getByRole('link', { name: 'Tools' });
			expect(link.tagName).toBe('A');
			expect(link.getAttribute('href')).toBe('/tools');
			expect(link.getAttribute('data-variant')).toBe('primary');
			expect(screen.queryByRole('button')).toBeNull();
		});

		it('passes anchor attributes through and turns download=true into the bare attribute', () => {
			render(Button, {
				props: {
					href: 'https://example.org/f.zip',
					target: '_blank',
					rel: 'noopener noreferrer',
					download: true,
					hreflang: 'en',
					referrerpolicy: 'no-referrer',
					variant: 'ghost',
					wide: true,
					children: textSnippet('External')
				}
			});
			const link = screen.getByRole('link');
			expect(link.getAttribute('target')).toBe('_blank');
			expect(link.getAttribute('rel')).toBe('noopener noreferrer');
			expect(link.getAttribute('download')).toBe('');
			expect(link.getAttribute('hreflang')).toBe('en');
			expect(link.getAttribute('referrerpolicy')).toBe('no-referrer');
			expect(link.getAttribute('data-variant')).toBe('ghost');
			expect(link.classList.contains('wide')).toBe(true);
		});

		it('download as a string is the file name and download=false is left out', () => {
			const { unmount } = render(Button, { href: '/a', download: 'report.pdf', children: textSnippet('A') });
			expect(screen.getByRole('link').getAttribute('download')).toBe('report.pdf');
			unmount();
			render(Button, { href: '/a', download: false, children: textSnippet('A') });
			expect(screen.getByRole('link').hasAttribute('download')).toBe(false);
		});

		it.each([{ disabled: true }, { loading: true }])('a link with %o cannot be followed or clicked and keeps role link', async (state) => {
			const user = userEvent.setup();
			const onclick = vi.fn();
			render(Button, { props: { href: '/tools', target: '_blank', onclick, children: textSnippet('Tools'), ...state } });
			const link = screen.getByRole('link', { name: 'Tools' });
			expect(link.hasAttribute('href')).toBe(false);
			expect(link.hasAttribute('target')).toBe(false);
			expect(link.getAttribute('aria-disabled')).toBe('true');
			await user.click(link);
			expect(onclick).not.toHaveBeenCalled();
		});

		it('a loading link is marked busy', () => {
			render(Button, { href: '/x', loading: true, children: textSnippet('Go') });
			expect(screen.getByRole('link').getAttribute('aria-busy')).toBe('true');
		});
	});
});

/** The live region of a Button (#109): the polite status that is a sibling of the button or link. */
function statusOf(container: HTMLElement): HTMLElement {
	const region = container.querySelector<HTMLElement>('[role="status"]');
	if (!region) throw new Error('no status region');
	return region;
}

describe('Button loading status (#109)', () => {
	it('has a polite status region that is empty while idle, so nothing is announced on first render', async () => {
		const { container } = render(Button, { loading: false, children: textSnippet('Save') });
		await flush();
		const region = statusOf(container);
		expect(region.textContent).toBe('');
		expect(region.getAttribute('aria-live')).toBe('polite');
		expect(container.querySelectorAll('[aria-live="assertive"], [role="alert"]')).toHaveLength(0);
	});

	it('says "Loading" in the region when loading starts, and empties it when loading ends', async () => {
		const { container, rerender } = render(Button, { loading: false, children: textSnippet('Save') });
		const region = statusOf(container);
		await rerender({ loading: true });
		expect(region.textContent).toBe('Loading');
		await rerender({ loading: false });
		expect(region.textContent).toBe('');
		await rerender({ loading: true });
		expect(region.textContent).toBe('Loading');
	});

	it('has no status region when `loading` is never passed (buttons inside other components)', async () => {
		const { container, rerender } = render(Button, { children: textSnippet('Save') });
		await flush();
		expect(container.querySelector('[role="status"]')).toBeNull();
		// passing it later still announces: the region is inserted, then filled
		await rerender({ loading: true });
		await flush();
		expect(statusOf(container).textContent).toBe('Loading');
	});

	it('the region exists before the text appears: the same node is filled, not inserted with its text', async () => {
		const { container, rerender } = render(Button, { loading: false, children: textSnippet('Save') });
		const before = statusOf(container);
		await rerender({ loading: true });
		expect(statusOf(container)).toBe(before);
	});

	it('speaks also when it is loading from the start, but only after the region is in the DOM', async () => {
		const { container } = render(Button, { loading: true, children: textSnippet('Save') });
		await flush();
		expect(statusOf(container).textContent).toBe('Loading');
		expect(container.querySelectorAll('[role="status"]')).toHaveLength(1);
	});

	it('keeps the visible label as the accessible name and keeps aria-busy', async () => {
		const { container, rerender } = render(Button, { loading: false, children: textSnippet('Save') });
		await rerender({ loading: true });
		const button = screen.getByRole('button', { name: 'Save' });
		expect(button.getAttribute('aria-busy')).toBe('true');
		expect(button.textContent).not.toContain('Loading');
		expect(button.contains(statusOf(container))).toBe(false);
		// the status text is not in a name either: it is a sibling, outside the control
		expect(screen.queryByRole('button', { name: /Loading/ })).toBeNull();
	});

	it('loadingLabel overrides the catalogue text and undefined behaves like a missing prop', async () => {
		const { container, rerender } = render(Button, { loading: true, loadingLabel: 'Saving …', children: textSnippet('Save') });
		expect(statusOf(container).textContent).toBe('Saving …');
		await rerender({ loadingLabel: undefined });
		expect(statusOf(container).textContent).toBe('Loading');
	});

	it('follows the language of the catalogue', async () => {
		setStrings(de);
		const { container } = render(Button, { loading: true, children: textSnippet('Speichern') });
		await flush();
		expect(statusOf(container).textContent).toBe('Lädt');
	});

	it('announces once per loading phase: one region, text set once', async () => {
		const { container, rerender } = render(Button, { loading: false, children: textSnippet('Save') });
		const region = statusOf(container);
		const texts: string[] = [];
		new MutationObserver(() => texts.push(region.textContent ?? '')).observe(region, {
			childList: true,
			characterData: true,
			subtree: true
		});
		await rerender({ loading: true });
		await rerender({ loading: true, variant: 'secondary' });
		await flush();
		expect(texts.filter((t) => t !== '')).toEqual(['Loading']);
	});

	it('does the same for the link variant, which stays a link named by its label', async () => {
		const { container, rerender } = render(Button, { href: '/x', loading: false, children: textSnippet('Go') });
		const region = statusOf(container);
		expect(region.textContent).toBe('');
		await rerender({ loading: true });
		expect(region.textContent).toBe('Loading');
		const link = screen.getByRole('link', { name: 'Go' });
		expect(link.getAttribute('aria-busy')).toBe('true');
		expect(link.contains(region)).toBe(false);
	});
});

describe('IconButton', () => {
	it('is named by its label and shows it as a tooltip', () => {
		render(IconButton, { label: 'Close' });
		const button = screen.getByRole('button', { name: 'Close' });
		expect(button.getAttribute('title')).toBe('Close');
		expect(button.getAttribute('type')).toBe('button');
	});

	it('calls onclick and ignores clicks while disabled', async () => {
		const user = userEvent.setup();
		const onclick = vi.fn();
		const { rerender } = render(IconButton, { label: 'Close', onclick });
		await user.click(screen.getByRole('button'));
		expect(onclick).toHaveBeenCalledTimes(1);
		await rerender({ disabled: true });
		await user.click(screen.getByRole('button'));
		expect(onclick).toHaveBeenCalledTimes(1);
	});
});

describe('Link', () => {
	it('renders a plain anchor with its href', () => {
		render(Link, { href: '/docs', children: textSnippet('Docs') });
		const link = screen.getByRole('link', { name: 'Docs' });
		expect(link.getAttribute('href')).toBe('/docs');
		expect(link.hasAttribute('target')).toBe(false);
	});

	it('external opens in a new tab, protects the opener and announces it', () => {
		render(Link, { href: 'https://example.org', external: true, children: textSnippet('Site') });
		const link = screen.getByRole('link', { name: /Site/ });
		expect(link.getAttribute('target')).toBe('_blank');
		expect(link.getAttribute('rel')).toBe('noopener noreferrer');
		expect(link.querySelector('.ext')?.getAttribute('aria-hidden')).toBe('true');
		expect(link.querySelector('.sr')?.textContent.trim()).toBe('(opens in a new tab)');
	});

	it('the announcement text can be replaced', () => {
		render(Link, { href: 'https://example.org', external: true, externalLabel: 'neuer Tab', children: textSnippet('Site') });
		// The `.sr` span is positioned out of the flow in the browser, which is what separates it from the text.
		expect(screen.getByRole('link').querySelector('.sr')?.textContent.trim()).toBe('neuer Tab');
	});
});

describe('nullish class from untyped callers', () => {
	const loose = { class: null as unknown as string };

	it('Button, Button as a link, IconButton and Link add no "null" to the class', () => {
		render(Button, { ...loose, children: textSnippet('Save') });
		render(Button, { ...loose, href: '/x', children: textSnippet('Go') });
		render(IconButton, { ...loose, label: 'Close', children: textSnippet('x') });
		render(Link, { ...loose, href: '/docs', children: textSnippet('Docs') });
		for (const el of [...screen.getAllByRole('button'), ...screen.getAllByRole('link')])
			expect(el.getAttribute('class')).not.toMatch(/null|undefined/);
		expect(screen.getAllByRole('button')).toHaveLength(2);
		expect(screen.getAllByRole('link')).toHaveLength(2);
	});
});
