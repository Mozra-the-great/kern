/**
 * Skeleton: hidden from assistive technology; the text variant with one or more lines (the last of several is
 * shorter, bad counts give one line), widths and heights as numbers or CSS lengths, and the rect and circle
 * boxes with their default sizes (a circle is as high as it is wide).
 */
import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Skeleton from '../../src/lib/components/Skeleton.svelte';

function root(container: HTMLElement): HTMLElement {
	const el = container.querySelector<HTMLElement>('.k-skeleton');
	if (!el) throw new Error('no skeleton');
	return el;
}

describe('Skeleton', () => {
	it('is one hidden text line by default', () => {
		const { container } = render(Skeleton, {});
		const el = root(container);
		expect(el.getAttribute('aria-hidden')).toBe('true');
		expect(el.classList.contains('text')).toBe(true);
		expect(el.style.width).toBe('');
		expect(el.querySelectorAll('.line')).toHaveLength(1);
		expect(el.querySelector('.last')).toBeNull();
	});

	it('draws several lines, the last one marked, with a width and a line height', () => {
		const { container } = render(Skeleton, { variant: 'text', lines: 3.8, width: 200, height: '1em', class: 'extra' });
		const el = root(container);
		expect(el.classList.contains('extra')).toBe(true);
		expect(el.style.width).toBe('200px');
		const lines = [...el.querySelectorAll<HTMLElement>('.line')];
		expect(lines).toHaveLength(3);
		expect(lines.map((l) => l.classList.contains('last'))).toEqual([false, false, true]);
		expect(lines.every((l) => l.style.height === '1em')).toBe(true);
	});

	it.each([0, -2, Number.NaN])('gives one line for lines=%s', (lines) => {
		const { container } = render(Skeleton, { lines });
		expect(root(container).querySelectorAll('.line')).toHaveLength(1);
	});

	it('rect is a full-width block of 120px by default', () => {
		const { container } = render(Skeleton, { variant: 'rect' });
		const el = root(container);
		expect(el.classList.contains('rect')).toBe(true);
		expect([el.style.width, el.style.height]).toEqual(['100%', '120px']);
	});

	it('circle is 40px round by default and as high as it is wide', () => {
		const plain = render(Skeleton, { variant: 'circle' });
		expect([root(plain.container).style.width, root(plain.container).style.height]).toEqual(['40px', '40px']);
		plain.unmount();
		const sized = render(Skeleton, { variant: 'circle', width: '3rem', class: 'x' });
		const el = root(sized.container);
		expect([el.style.width, el.style.height]).toEqual(['3rem', '3rem']);
		expect(el.classList.contains('x')).toBe(true);
	});

	it('rect takes both sizes', () => {
		const { container } = render(Skeleton, { variant: 'rect', width: 50, height: 20 });
		expect([root(container).style.width, root(container).style.height]).toEqual(['50px', '20px']);
	});
});
