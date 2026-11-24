/**
 * Server-rendered markup of StatusDot and OnlineStatus (svelte/server): the first paint before hydration must
 * already say the state in words (a custom label or snippet followed by the status name) and OnlineStatus must
 * render its live region empty and "online", because the server cannot know the connection.
 */
import { describe, expect, it } from 'vitest';
import OnlineStatus from '../../src/lib/components/OnlineStatus.svelte';
import StatusDot from '../../src/lib/components/StatusDot.svelte';
import { html, one, snippet, text } from './html.js';

describe('StatusDot on the server', () => {
	it('renders a snippet as the text, followed by the status name', () => {
		const markup = html(StatusDot, { status: 'busy', children: snippet('<b>Queue</b>'), labelHidden: true, size: 'sm', class: 'x' });
		expect(text(markup)).toBe('Queue , Busy');
		expect(one(markup, 'span', { 'data-status': 'busy' }).attrs['data-size']).toBe('sm');
		expect(markup).toMatch(/class="halo[ "]/);
	});

	it('renders a label that names the status once', () => {
		expect(text(html(StatusDot, { status: 'ok', label: 'OK' }))).toBe('OK');
		expect(text(html(StatusDot, { status: 'idle', label: 'Cache' }))).toBe('Cache , Idle');
	});
});

describe('OnlineStatus on the server', () => {
	it('is an empty live region until the browser reports the connection', () => {
		const markup = html(OnlineStatus, { class: 'x', announce: false });
		expect(one(markup, 'div', { role: 'status' }).attrs.class).toContain('k-online-status');
		expect(text(markup)).toBe('');
	});
});
