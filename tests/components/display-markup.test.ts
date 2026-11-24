/**
 * Server-rendered markup of the small display components (svelte/server, no DOM). Their behaviour in the
 * browser runtime is tested in tests/dom/display.test.ts.
 */
import { describe, expect, it } from 'vitest';
import Alert from '../../src/lib/components/Alert.svelte';
import { html, one, snippet, tags, text } from './html.js';

describe('Alert', () => {
	it('renders title, text and actions in order, and the role of its tone', () => {
		const markup = html(Alert, { tone: 'warn', title: 'Heads up', children: snippet('Body'), actions: snippet('<a href="/x">Fix</a>') });
		expect(one(markup, 'div', { 'data-tone': 'warn' }).attrs.role).toBe('alert');
		expect(text(markup)).toBe('Heads up Body Fix');
		expect(tags(markup, 'a')).toHaveLength(1);
	});

	it('leaves out the parts it was not given', () => {
		const markup = html(Alert, {});
		expect(one(markup, 'div', { 'data-tone': 'info' }).attrs.role).toBe('status');
		expect(text(markup)).toBe('');
		expect(tags(markup, 'p')).toHaveLength(0);
	});
});
