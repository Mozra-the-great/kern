/**
 * StatusDot: one shape per status (the colour is never the only signal), the spoken text (status name by
 * default, a custom label or snippet followed by the status name unless it already says it), translated
 * status names, `labelHidden`, `size`, and the busy pulse.
 */
import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import StatusDot, { type DotStatus } from '../../src/lib/components/StatusDot.svelte';
import { textSnippet } from './helpers.js';

function text(container: HTMLElement): string {
	return (container.querySelector('.k-status-dot')?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

describe('StatusDot', () => {
	it.each<[DotStatus, string, string]>([
		['ok', 'OK', 'circle[mask]'],
		['warn', 'Degraded', 'path[mask]'],
		['down', 'Down', 'rect[mask]'],
		['busy', 'Busy', 'circle + circle'],
		['idle', 'Idle', 'circle']
	])('%s has its own shape and says "%s"', (status, name, shape) => {
		const { container } = render(StatusDot, { status });
		const root = container.querySelector('.k-status-dot');
		expect(root?.getAttribute('data-status')).toBe(status);
		expect(root?.getAttribute('data-size')).toBe('md');
		expect(root?.querySelector('.glyph')?.getAttribute('aria-hidden')).toBe('true');
		expect(root?.querySelector(`.glyph svg ${shape}`)).not.toBeNull();
		expect(text(container)).toBe(name);
	});

	it('pulses while busy unless pulse is off', () => {
		const on = render(StatusDot, { status: 'busy' });
		expect(on.container.querySelector('.halo')).not.toBeNull();
		on.unmount();
		const off = render(StatusDot, { status: 'busy', pulse: false });
		expect(off.container.querySelector('.halo')).toBeNull();
		off.unmount();
		const ok = render(StatusDot, { status: 'ok', pulse: true });
		expect(ok.container.querySelector('.halo')).toBeNull();
	});

	it('a custom label is followed by the spoken status name', () => {
		const { container } = render(StatusDot, { status: 'down', label: 'Database', size: 'sm', class: 'extra' });
		const root = container.querySelector('.k-status-dot');
		expect(root?.getAttribute('data-size')).toBe('sm');
		expect(root?.classList.contains('extra')).toBe(true);
		expect(container.querySelector('.text')?.textContent?.trim()).toBe('Database');
		expect(container.querySelector('.text + .sr')?.textContent).toBe(', Down');
	});

	it('a label equal to the status name is not repeated', () => {
		const { container } = render(StatusDot, { status: 'ok', label: 'OK' });
		expect(text(container)).toBe('OK');
		expect(container.querySelector('.text + .sr')).toBeNull();
	});

	it('an empty label falls back to the status name', () => {
		const { container } = render(StatusDot, { status: 'idle', label: '' });
		expect(text(container)).toBe('Idle');
	});

	it('a snippet replaces the label and still gets the status name', () => {
		const { container } = render(StatusDot, { status: 'warn', label: 'ignored', children: textSnippet('API') });
		expect(container.querySelector('.text')?.textContent?.trim()).toBe('API');
		expect(container.querySelector('.text + .sr')?.textContent).toBe(', Degraded');
	});

	it('translates the status names, keeping the defaults for the rest', () => {
		const { container } = render(StatusDot, { status: 'ok', statusLabels: { ok: 'Läuft', down: undefined } });
		expect(text(container)).toBe('Läuft');
	});

	it('falls back to the status id for an unknown status', () => {
		const { container } = render(StatusDot, { status: 'paused' as DotStatus });
		expect(text(container)).toBe('paused');
	});

	it('labelHidden hides the text visually only', () => {
		const custom = render(StatusDot, { status: 'ok', label: 'Web', labelHidden: true });
		expect(custom.container.querySelector('.text')?.classList.contains('sr')).toBe(true);
		custom.unmount();
		const plain = render(StatusDot, { status: 'ok', labelHidden: true });
		expect(plain.container.querySelector('.text')?.classList.contains('sr')).toBe(true);
		expect(text(plain.container)).toBe('OK');
	});
});
