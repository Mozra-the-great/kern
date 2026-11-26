/**
 * StatusMessage: the live region of a result. `tone="ok"` colours a `status` line in the success colour
 * (data-tone, styled with `--k-ok`); an alert keeps its danger look. The colour contract itself
 * (`--k-ok` as text on every ground) lives in tests/tokens/contrast.test.ts.
 */
import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import StatusMessage from '../../src/lib/components/StatusMessage.svelte';
import { reactive } from './reactive.svelte.js';

const line = (): HTMLElement => screen.getByRole('status');

describe('StatusMessage tone', () => {
	it('has no tone by default: the plain status look is unchanged', () => {
		render(StatusMessage, { message: 'Copied' });
		expect(line().textContent?.trim()).toBe('Copied');
		expect(line().dataset['kind']).toBe('status');
		expect(line().hasAttribute('data-tone')).toBe(false);
	});

	it('treats tone="default" and undefined like a missing prop', () => {
		const { unmount } = render(StatusMessage, { message: 'a', tone: 'default' });
		expect(line().hasAttribute('data-tone')).toBe(false);
		unmount();
		render(StatusMessage, { message: 'a', tone: undefined });
		expect(line().hasAttribute('data-tone')).toBe(false);
	});

	it('tone="ok" marks a status line and keeps the polite live region', () => {
		render(StatusMessage, { message: '3 matches', tone: 'ok' });
		expect(line().dataset['tone']).toBe('ok');
		expect(line().dataset['kind']).toBe('status');
		expect(line().textContent?.trim()).toBe('3 matches');
	});

	it('an alert ignores tone="ok" and stays an alert', () => {
		render(StatusMessage, { message: 'Failed', kind: 'alert', tone: 'ok' });
		const alert = screen.getByRole('alert');
		expect(alert.dataset['kind']).toBe('alert');
		expect(alert.hasAttribute('data-tone')).toBe(false);
	});

	it('follows tone and kind when they change, without replacing the live region', async () => {
		const props = reactive<{ message: string; kind: 'status' | 'alert'; tone: 'default' | 'ok' }>({
			message: '',
			kind: 'status',
			tone: 'default'
		});
		render(StatusMessage, props);
		const region = line();
		props.message = 'Valid signature';
		props.tone = 'ok';
		await Promise.resolve();
		expect(screen.getByRole('status')).toBe(region);
		expect(region.dataset['tone']).toBe('ok');
		props.kind = 'alert';
		await Promise.resolve();
		expect(region.hasAttribute('data-tone')).toBe(false);
	});
});
