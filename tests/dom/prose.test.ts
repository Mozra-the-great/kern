/**
 * Prose in the DOM: plain text becomes paragraphs, line breaks and links as text nodes and anchors
 * (never HTML); without `text` the children are rendered. The parser itself is tested in
 * tests/unit/prose.test.ts.
 */
import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Prose from '../../src/lib/components/Prose.svelte';
import { textSnippet } from './helpers.js';

describe('Prose', () => {
	it('sets paragraphs, line breaks and links from plain text', () => {
		const { container } = render(Prose, {
			text: 'Mara Lind\nmail@example.org\n\nSee https://example.org/a. <b>not bold</b>',
			class: 'legal'
		});
		const root = container.querySelector('.k-prose');
		expect(root?.classList.contains('legal')).toBe(true);
		const paragraphs = container.querySelectorAll('p');
		expect(paragraphs).toHaveLength(2);
		expect(paragraphs[0]?.querySelectorAll('br')).toHaveLength(1);
		const mail = screen.getByRole('link', { name: 'mail@example.org' });
		expect(mail.getAttribute('href')).toBe('mailto:mail@example.org');
		expect(mail.hasAttribute('target')).toBe(false);
		const web = screen.getByRole('link', { name: /https:\/\/example\.org\/a/ });
		expect(web.getAttribute('href')).toBe('https://example.org/a');
		expect(web.getAttribute('target')).toBe('_blank');
		expect(web.querySelector('.sr')?.textContent.trim()).toBe('(opens in a new tab)');
		expect(container.querySelector('b')).toBeNull();
		expect(paragraphs[1]?.textContent).toContain('<b>not bold</b>');
	});

	it('externalLabel replaces the new-tab text of external links', () => {
		render(Prose, { text: 'https://example.org', externalLabel: 'neuer Tab' });
		expect(screen.getByRole('link').querySelector('.sr')?.textContent.trim()).toBe('neuer Tab');
	});

	it('renders the children without text, also for null', () => {
		const { container, unmount } = render(Prose, { children: textSnippet('Own markup') });
		expect(container.querySelector('.k-prose')?.textContent.trim()).toBe('Own markup');
		unmount();
		const second = render(Prose, { text: null, children: textSnippet('Fallback') });
		expect(second.container.querySelector('.k-prose')?.textContent.trim()).toBe('Fallback');
		second.unmount();
		const empty = render(Prose, {});
		expect(empty.container.querySelector('.k-prose')?.textContent.trim()).toBe('');
	});

	it('an empty text renders no paragraph and no children', () => {
		const { container } = render(Prose, { text: '', children: textSnippet('hidden') });
		expect(container.querySelector('p')).toBeNull();
		expect(container.textContent.trim()).toBe('');
	});

	it('a nullish class from an untyped caller adds no "null" to the class', () => {
		const { container } = render(Prose, { text: 'x', class: null as unknown as string });
		expect(container.querySelector('.k-prose')?.getAttribute('class')).not.toMatch(/null|undefined/);
	});
});
