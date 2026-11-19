/**
 * Progress (#42), node side: input normalisation (mirrors stuffcloud's `progress-code.test.ts`) and
 * the stylesheet rules of the indeterminate bar. The rendered ARIA values, the compositor-only
 * animation, reduced motion and forced colours are checked in the browser by
 * tests/elements/feedback.spec.ts.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { normaliseMax, progressPercent, progressValue } from '../../src/lib/components/progress.js';

describe('normaliseMax', () => {
	it('keeps a positive finite maximum', () => {
		expect(normaliseMax(1)).toBe(1);
		expect(normaliseMax(0.5)).toBe(0.5);
		expect(normaliseMax(500)).toBe(500);
	});

	it('falls back to 100 for zero, negative, non-finite and missing values', () => {
		for (const bad of [0, -1, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, undefined, null]) {
			expect(normaliseMax(bad)).toBe(100);
		}
	});
});

describe('progressPercent', () => {
	it.each([
		[0, 100, 0],
		[40, 100, 40],
		[100, 100, 100],
		[5, 10, 50],
		[1, 4, 25],
		[3, 12, 25]
	])('%s of %s is %s percent', (value, max, expected) => {
		expect(progressPercent(value, max)).toBeCloseTo(expected, 10);
	});

	it('clamps to the range on both sides', () => {
		expect(progressPercent(-5, 100)).toBe(0);
		expect(progressPercent(150, 100)).toBe(100);
		expect(progressPercent(11, 10)).toBe(100);
	});

	it('defaults the maximum to 100', () => {
		expect(progressPercent(30)).toBe(30);
	});

	it('never draws a broken bar for bad input', () => {
		expect(progressPercent(Number.NaN, 100)).toBe(0);
		expect(progressPercent(Number.POSITIVE_INFINITY, 100)).toBe(0);
		expect(progressPercent(50, 0)).toBe(50);
		expect(progressPercent(50, -3)).toBe(50);
		expect(progressPercent(50, Number.NaN)).toBe(50);
	});

	it('is undefined (indeterminate) without a value', () => {
		expect(progressPercent(undefined, 100)).toBeUndefined();
		expect(progressPercent(null, 100)).toBeUndefined();
	});
});

describe('progressValue (aria-valuenow)', () => {
	it('is the value clamped to [0, max]', () => {
		expect(progressValue(3, 12)).toBe(3);
		expect(progressValue(250, 100)).toBe(100);
		expect(progressValue(-1, 100)).toBe(0);
		expect(progressValue(50, 0)).toBe(50);
		expect(progressValue(Number.NaN, 10)).toBe(0);
		expect(progressValue(undefined, 10)).toBeUndefined();
	});
});

describe('Progress stylesheet (indeterminate stripes)', () => {
	const source = readFileSync(resolve(import.meta.dirname, '../../src/lib/components/Progress.svelte'), 'utf8');
	const style = source.slice(source.indexOf('<style>'));
	const keyframes = /@keyframes k-progress-stripes \{[\s\S]*?\n\t\}/.exec(style)?.[0] ?? '';

	it('animates only transform, never a layout or paint property', () => {
		expect(keyframes).not.toBe('');
		const properties = [...keyframes.matchAll(/^\s+([a-z-]+):/gm)].map((m) => m[1]);
		expect(new Set(properties)).toEqual(new Set(['transform']));
		expect(style).not.toContain('background-position');
	});

	it('moves the stripes by exactly one period, so the loop is seamless', () => {
		expect(keyframes).toContain('transform: translateX(0);');
		expect(keyframes).toContain('transform: translateX(var(--k-progress-period));');
		expect(style).toContain('left: calc(var(--k-progress-period) * -1);');
		expect(style).toContain('width: calc(100% + var(--k-progress-period));');
		expect(style).toContain('animation: k-progress-stripes var(--k-progress-loop) var(--k-progress-ease) infinite;');
	});

	it('stops every animation and transition under prefers-reduced-motion', () => {
		expect(style).toMatch(
			/@media \(prefers-reduced-motion: reduce\) \{\s*\.bar \{\s*transition: none;\s*\}\s*\.indeterminate \{\s*animation: none;\s*\}\s*\}/
		);
	});

	it('draws the fill and the stripes in Highlight under forced colours', () => {
		const forced = style.slice(style.indexOf('@media (forced-colors: active)'));
		expect(forced).toContain('border: 1px solid CanvasText;');
		expect(forced).toMatch(/\.bar \{\s*forced-color-adjust: none;\s*background: Highlight;/);
		expect(forced).toMatch(/\.indeterminate \{\s*background: repeating-linear-gradient\(\s*90deg,\s*Highlight 0/);
	});

	it('stuffcloud steps the stripes in four steps', () => {
		const brand = readFileSync(resolve(import.meta.dirname, '../../src/lib/themes/brands/stuffcloud.css'), 'utf8');
		expect(brand).toContain('--k-progress-ease: steps(4);');
		expect(brand).toContain('--k-progress-period: 32px;');
	});
});
