/**
 * Card, Tile and TileGrid (stuffcloud: tabs-cards.test.ts "Card" and "Tile and TileGrid"). kern's Card is an
 * `article` by default (stuffcloud's is a `div`) and can be a heading card, a whole-card link or a whole-card button.
 */
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { createRawSnippet } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import Card from '../../src/lib/components/Card.svelte';
import Tile from '../../src/lib/components/Tile.svelte';
import TileGrid from '../../src/lib/components/TileGrid.svelte';
import { textSnippet } from './helpers.js';

const tileItem = createRawSnippet(() => ({ render: () => '<li class="k-tile"><a class="cell link" href="/pdf">PDF</a></li>' }));

describe('Card', () => {
	it('is an article by default and keeps its content in the body', () => {
		render(Card, { children: textSnippet('Hello'), 'data-testid': 'card' });
		const card = screen.getByTestId('card');
		expect(card.tagName).toBe('ARTICLE');
		expect(card.querySelector('.body')?.textContent.trim()).toBe('Hello');
		expect(card.getAttribute('data-look')).toBe('raised');
	});

	it('has no banner or contentinfo landmark for its title row and footer (#154)', () => {
		render(Card, { title: 'Plan', description: 'Details', footer: textSnippet('Actions'), children: textSnippet('Hello') });
		expect(screen.queryByRole('banner')).toBeNull();
		expect(screen.queryByRole('contentinfo')).toBeNull();
		expect(screen.getByRole('heading', { name: 'Plan' })).toBeTruthy();
		expect(screen.getByText('Actions')).toBeTruthy();
	});

	it.each(['section', 'div', 'li', 'article'] as const)('can render as %s', (as) => {
		render(Card, { as, children: textSnippet('x'), 'data-testid': 'card' });
		expect(screen.getByTestId('card').tagName).toBe(as.toUpperCase());
	});

	it('passes aria attributes through', () => {
		render(Card, { as: 'section', 'aria-label': 'Storage', children: textSnippet('x') });
		expect(screen.getByRole('region', { name: 'Storage' })).toBeTruthy();
	});

	it('renders the title as a heading of the given level, with the description under it', () => {
		const { unmount } = render(Card, { title: 'Plan', description: 'Billed yearly' });
		expect(screen.getByRole('heading', { level: 3, name: 'Plan' })).toBeTruthy();
		expect(screen.getByText('Billed yearly').tagName).toBe('P');
		unmount();
		render(Card, { title: 'Plan', level: 2 });
		expect(screen.getByRole('heading', { level: 2, name: 'Plan' })).toBeTruthy();
	});

	it('renders media, badges and footer around the body, and no empty wrappers', () => {
		const { container, unmount } = render(Card, {
			title: 'T',
			media: textSnippet('M'),
			badges: textSnippet('B'),
			footer: textSnippet('F'),
			children: textSnippet('Body')
		});
		expect([...container.querySelectorAll('.media, .badges, .body, footer')].map((el) => el.textContent.trim())).toEqual([
			'M',
			'B',
			'Body',
			'F'
		]);
		unmount();
		const bare = render(Card, { title: 'Only a title' });
		expect(bare.container.querySelector('.media, .badges, .body, footer')).toBeNull();
	});

	it('look and muted are exposed for the theme', () => {
		render(Card, { look: 'outline', muted: true, class: 'extra', 'data-testid': 'card' });
		const card = screen.getByTestId('card');
		expect(card.getAttribute('data-look')).toBe('outline');
		expect(card.classList.contains('muted')).toBe(true);
		expect(card.classList.contains('extra')).toBe(true);
		expect(card.classList.contains('linked')).toBe(false);
	});

	it('a card with href and a title links through its heading', () => {
		render(Card, { title: 'Docs', href: '/docs' });
		const link = screen.getByRole('link', { name: 'Docs' });
		expect(link.getAttribute('href')).toBe('/docs');
		expect(screen.getByRole('heading', { name: 'Docs' }).contains(link)).toBe(true);
		expect(document.querySelector('.k-card')?.classList.contains('linked')).toBe(true);
	});

	it('a card with onclick and a title is a button inside the heading and reports clicks and keys', async () => {
		const user = userEvent.setup();
		const onclick = vi.fn();
		render(Card, { title: 'Open file', onclick, actionHaspopup: 'dialog' });
		const button = screen.getByRole('button', { name: 'Open file' });
		expect(button.getAttribute('aria-haspopup')).toBe('dialog');
		await user.click(button);
		await user.tab();
		button.focus();
		await user.keyboard('{Enter}');
		await user.keyboard(' ');
		expect(onclick).toHaveBeenCalledTimes(3);
	});

	it('actionLabel replaces the name of the action', () => {
		render(Card, { title: 'Plan', href: '/plan', actionLabel: 'Open the plan' });
		expect(screen.getByRole('link', { name: 'Open the plan' })).toBeTruthy();
	});

	it('without a title the whole card gets a cover link or button named by label, description or a default', () => {
		const link = render(Card, { href: '/a', actionLabel: 'Open A' });
		expect(screen.getByRole('link', { name: 'Open A' }).classList.contains('cover')).toBe(true);
		link.unmount();
		const described = render(Card, { href: '/b', description: 'About B' });
		expect(screen.getByRole('link', { name: 'About B' })).toBeTruthy();
		described.unmount();
		render(Card, { onclick: () => undefined });
		expect(screen.getByRole('button', { name: 'Open' }).classList.contains('cover')).toBe(true);
	});

	it('the cover link, the cover button and the title link all report clicks to onclick', async () => {
		const user = userEvent.setup();
		const onclick = vi.fn((event: MouseEvent) => event.preventDefault());
		const cover = render(Card, { href: '#a', onclick, actionLabel: 'Open A' });
		await user.click(screen.getByRole('link', { name: 'Open A' }));
		expect(onclick).toHaveBeenCalledTimes(1);
		cover.unmount();
		const button = render(Card, { onclick, actionHaspopup: 'dialog' });
		const cover2 = screen.getByRole('button', { name: 'Open' });
		expect(cover2.getAttribute('aria-haspopup')).toBe('dialog');
		await user.click(cover2);
		expect(onclick).toHaveBeenCalledTimes(2);
		button.unmount();
		render(Card, { title: 'Plan', href: '#plan', onclick });
		await user.click(screen.getByRole('link', { name: 'Plan' }));
		expect(onclick).toHaveBeenCalledTimes(3);
	});

	it('a nullish class from an untyped caller adds no text to the class', () => {
		render(Card, { title: 'T', class: null as unknown as string, 'data-testid': 'card' });
		expect(screen.getByTestId('card').getAttribute('class')).not.toMatch(/null|undefined/);
	});

	it('a plain card without href or onclick has no interactive element', () => {
		render(Card, { title: 'Static', description: 'Nothing to press' });
		expect(screen.queryByRole('link')).toBeNull();
		expect(screen.queryByRole('button')).toBeNull();
	});
});

describe('Tile and TileGrid', () => {
	it('a tile without href is a plain cell', () => {
		render(Tile, { children: textSnippet('Plain'), 'data-testid': 'tile' });
		const tile = screen.getByTestId('tile');
		expect(tile.tagName).toBe('DIV');
		expect(tile.textContent.trim()).toBe('Plain');
		expect(tile.classList.contains('cell')).toBe(true);
	});

	it('a tile with href is a link around the whole cell', () => {
		render(Tile, { href: '/pdf', children: textSnippet('PDF') });
		const link = screen.getByRole('link', { name: 'PDF' });
		expect(link.getAttribute('href')).toBe('/pdf');
		expect(link.tagName).toBe('A');
	});

	it('an empty href is not a link, and target and rel go to the anchor', () => {
		const { unmount } = render(Tile, { href: '', children: textSnippet('No link') });
		expect(screen.queryByRole('link')).toBeNull();
		unmount();
		render(Tile, { props: { href: 'https://example.org', target: '_blank', rel: 'noopener', children: textSnippet('Out') } });
		const link = screen.getByRole('link', { name: 'Out' });
		expect(link.getAttribute('target')).toBe('_blank');
		expect(link.getAttribute('rel')).toBe('noopener');
	});

	it('as li keeps the list item and puts the link inside it', () => {
		render(TileGrid, { as: 'ul', 'aria-label': 'Tools', children: tileItem });
		expect(screen.getByRole('list', { name: 'Tools' })).toBeTruthy();
		expect(screen.getAllByRole('listitem')).toHaveLength(1);
		expect(screen.getByRole('link', { name: 'PDF' }).closest('li')).not.toBeNull();
	});

	it('a Tile as="li" with href puts the link inside the list item', () => {
		render(Tile, {
			props: { as: 'li', href: '#doc', target: '_self', rel: 'help', class: 'mine', 'data-testid': 'tile', children: textSnippet('Doc') }
		});
		const item = screen.getByTestId('tile');
		expect(item.tagName).toBe('LI');
		expect(item.classList.contains('mine')).toBe(true);
		expect(item.classList.contains('cell')).toBe(false);
		const link = screen.getByRole('link', { name: 'Doc' });
		expect(link.parentElement).toBe(item);
		expect(link.classList.contains('cell')).toBe(true);
		expect(link.getAttribute('target')).toBe('_self');
		expect(link.getAttribute('rel')).toBe('help');
	});

	it('nullish classes from untyped callers add no text to the class', () => {
		const loose = { class: null as unknown as string };
		const a = render(Tile, { ...loose, href: '#a', children: textSnippet('A') });
		expect(screen.getByRole('link').getAttribute('class')).not.toMatch(/null/);
		a.unmount();
		const b = render(Tile, { ...loose, as: 'li', href: '#b', 'data-testid': 't' });
		expect(screen.getByTestId('t').getAttribute('class')).not.toMatch(/null/);
		b.unmount();
		const c = render(Tile, { ...loose, 'data-testid': 't' });
		expect(screen.getByTestId('t').getAttribute('class')).not.toMatch(/null/);
		c.unmount();
		render(TileGrid, { ...loose, 'data-testid': 'g' });
		expect(screen.getByTestId('g').getAttribute('class')).not.toMatch(/null/);
		expect(screen.getByTestId('g').style.getPropertyValue('--k-tile-min')).toBe('');
	});

	it('an unknown root element falls back to a div', () => {
		render(Tile, { as: 'table' as never, children: textSnippet('x'), 'data-testid': 'tile' });
		expect(screen.getByTestId('tile').tagName).toBe('DIV');
		const { unmount } = render(TileGrid, { as: 'table' as never, 'data-testid': 'grid' });
		expect(screen.getByTestId('grid').tagName).toBe('DIV');
		unmount();
	});

	it('the grid wraps its tiles, passes attributes through and sets the minimum column width', () => {
		render(TileGrid, { 'aria-label': 'Tools', role: 'group', min: '200px', children: textSnippet('inside') });
		const grid = screen.getByRole('group', { name: 'Tools' });
		expect(grid.textContent.trim()).toBe('inside');
		expect(grid.style.getPropertyValue('--k-tile-min')).toBe('200px');
	});
});
