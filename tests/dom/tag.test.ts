/**
 * Tag: content, the selected state and the optional remove button (only with `onremove`, named by
 * `removeLabel` or the catalogue default).
 */
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Tag from '../../src/lib/components/Tag.svelte';
import { textSnippet } from './helpers.js';

describe('Tag', () => {
	it('shows its content without a remove button by default', () => {
		render(Tag, { children: textSnippet('svelte') });
		const tag = document.querySelector('.k-tag');
		expect(tag?.textContent.trim()).toBe('svelte');
		expect(tag?.classList.contains('selected')).toBe(false);
		expect(screen.queryByRole('button')).toBeNull();
	});

	it('renders empty without children', () => {
		render(Tag, {});
		expect(document.querySelector('.txt')?.textContent).toBe('');
	});

	it('marks the selected state and takes a class', () => {
		render(Tag, { selected: true, class: 'extra', children: textSnippet('svelte') });
		const tag = document.querySelector('.k-tag');
		expect(tag?.classList.contains('selected')).toBe(true);
		expect(tag?.classList.contains('extra')).toBe(true);
	});

	it('a remove button calls onremove, named by default or by removeLabel', async () => {
		const user = userEvent.setup();
		const onremove = vi.fn();
		const { rerender } = render(Tag, { onremove, children: textSnippet('svelte') });
		await user.click(screen.getByRole('button', { name: 'Remove' }));
		expect(onremove).toHaveBeenCalledTimes(1);
		await rerender({ removeLabel: 'Remove svelte' });
		expect(screen.getByRole('button', { name: 'Remove svelte' })).toBeTruthy();
	});
});
