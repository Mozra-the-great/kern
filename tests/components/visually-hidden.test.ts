/**
 * VisuallyHidden (#100) on the server-rendered markup: the element, the text, the focusable marker and
 * passed-through attributes. Whether it is really hidden (and shown on focus) is checked in a browser:
 * tests/elements/visually-hidden.spec.ts.
 */
import { describe, expect, it } from 'vitest';
import VisuallyHidden from '../../src/lib/components/VisuallyHidden.svelte';
import { html, one, snippet, text } from './html.js';

describe('VisuallyHidden', () => {
	it('renders a span with the text by default', () => {
		const markup = html(VisuallyHidden, { children: snippet('added line') });
		const span = one(markup, 'span');
		expect(span.attrs.class).toContain('vh');
		expect(span.attrs.class).not.toContain('focusable');
		expect(text(markup)).toBe('added line');
	});

	it('renders the element chosen with `as`, passes attributes through and keeps a consumer class', () => {
		const markup = html(VisuallyHidden, { as: 'h2', id: 'tools', class: 'mine', children: snippet('Tools') });
		const heading = one(markup, 'h2');
		expect(heading.attrs.id).toBe('tools');
		expect(heading.attrs.class).toContain('vh');
		expect(heading.attrs.class).toContain('mine');
	});

	it('marks the focusable variant, and `undefined` behaves like a missing prop', () => {
		expect(one(html(VisuallyHidden, { focusable: true, children: snippet('x') }), 'span').attrs.class).toContain('focusable');
		const plain = html(VisuallyHidden, { as: undefined, focusable: undefined, children: snippet('x') });
		expect(one(plain, 'span').attrs.class).not.toContain('focusable');
	});
});
