/**
 * color.ts, the colour math behind ColorPicker: hex parsing in every accepted form, formatting with and
 * without alpha, RGB <-> HSV round trips in each hue sector, WCAG luminance, ink choice and the short
 * English description.
 */
import { describe, expect, it } from 'vitest';
import {
	describeColor,
	hsvToRgb,
	luminance,
	normalizeHex,
	parseHex,
	prefersDarkInk,
	rgbToHsv,
	toHex
} from '../../src/lib/components/color.js';

describe('parseHex', () => {
	it('reads #rgb, #rgba, #rrggbb and #rrggbbaa, with or without #, any case, trimmed', () => {
		expect(parseHex('#f80')).toEqual({ r: 255, g: 136, b: 0, a: 1 });
		expect(parseHex('F80')).toEqual({ r: 255, g: 136, b: 0, a: 1 });
		expect(parseHex('#f808')).toEqual({ r: 255, g: 136, b: 0, a: 0.533 });
		expect(parseHex('  #1A2b3C ')).toEqual({ r: 26, g: 43, b: 60, a: 1 });
		expect(parseHex('#00000080')).toEqual({ r: 0, g: 0, b: 0, a: 0.502 });
		expect(parseHex('#000000ff')?.a).toBe(1);
	});

	it('rejects everything else', () => {
		for (const bad of ['', '#', '#12', '#12345', '#1234567', '#123456789', 'red', '#ggg', 'rgb(0,0,0)']) {
			expect(parseHex(bad)).toBeNull();
		}
	});
});

describe('toHex and normalizeHex', () => {
	it('formats lower-case #rrggbb and clamps and rounds the channels', () => {
		expect(toHex({ r: 255, g: 136, b: 0, a: 1 })).toBe('#ff8800');
		expect(toHex({ r: 300, g: -5, b: 12.6, a: 1 })).toBe('#ff000d');
	});

	it('adds the alpha byte only when asked and the colour is not opaque', () => {
		const half = { r: 0, g: 0, b: 0, a: 0.5 };
		expect(toHex(half)).toBe('#000000');
		expect(toHex(half, true)).toBe('#00000080');
		expect(toHex({ r: 0, g: 0, b: 0, a: 1 }, true)).toBe('#000000');
	});

	it('normalises any accepted form and returns null for non-colours', () => {
		expect(normalizeHex('#ABC')).toBe('#aabbcc');
		expect(normalizeHex('abc8', true)).toBe('#aabbcc88');
		expect(normalizeHex('abc8')).toBe('#aabbcc');
		expect(normalizeHex('nope')).toBeNull();
	});
});

describe('rgbToHsv and hsvToRgb', () => {
	it('converts greys and black without a hue', () => {
		expect(rgbToHsv(0, 0, 0)).toEqual({ h: 0, s: 0, v: 0 });
		expect(rgbToHsv(255, 255, 255)).toEqual({ h: 0, s: 0, v: 1 });
	});

	it('finds the hue when red, green or blue is the largest channel', () => {
		expect(rgbToHsv(255, 0, 0).h).toBe(0);
		expect(rgbToHsv(255, 0, 128).h).toBeCloseTo(329.88, 1);
		expect(rgbToHsv(0, 255, 0).h).toBe(120);
		expect(rgbToHsv(0, 0, 255).h).toBe(240);
	});

	it('covers every 60 degree sector and wraps the hue', () => {
		const cases: [number, [number, number, number]][] = [
			[0, [255, 0, 0]],
			[60, [255, 255, 0]],
			[120, [0, 255, 0]],
			[180, [0, 255, 255]],
			[240, [0, 0, 255]],
			[300, [255, 0, 255]],
			[330, [255, 0, 128]]
		];
		for (const [h, [r, g, b]] of cases) expect(hsvToRgb(h, 1, 1)).toEqual({ r, g, b });
		expect(hsvToRgb(360, 1, 1)).toEqual({ r: 255, g: 0, b: 0 });
		expect(hsvToRgb(-120, 1, 1)).toEqual({ r: 0, g: 0, b: 255 });
	});

	it('round-trips colours', () => {
		for (const [r, g, b] of [
			[12, 200, 99],
			[250, 10, 180],
			[60, 60, 200]
		]) {
			const hsv = rgbToHsv(r, g, b);
			expect(hsvToRgb(hsv.h, hsv.s, hsv.v)).toEqual({ r, g, b });
		}
	});
});

describe('luminance and prefersDarkInk', () => {
	it('is 0 for black and 1 for white, with the linear segment for very dark channels', () => {
		expect(luminance(0, 0, 0)).toBe(0);
		expect(luminance(255, 255, 255)).toBeCloseTo(1, 6);
		expect(luminance(5, 5, 5)).toBeCloseTo(5 / 255 / 12.92, 6);
	});

	it('picks dark ink on light colours and light ink on dark ones', () => {
		expect(prefersDarkInk(255, 255, 255)).toBe(true);
		expect(prefersDarkInk(255, 220, 0)).toBe(true);
		expect(prefersDarkInk(0, 0, 0)).toBe(false);
		expect(prefersDarkInk(0, 0, 160)).toBe(false);
	});
});

describe('describeColor', () => {
	it('names black, white and the greys', () => {
		expect(describeColor({ h: 0, s: 0, v: 0.05 })).toBe('black');
		expect(describeColor({ h: 0, s: 0, v: 1 })).toBe('white');
		expect(describeColor({ h: 0, s: 0.05, v: 0.8 })).toBe('light grey');
		expect(describeColor({ h: 0, s: 0.05, v: 0.5 })).toBe('grey');
		expect(describeColor({ h: 0, s: 0.05, v: 0.2 })).toBe('dark grey');
	});

	it('names each hue band', () => {
		const names: [number, string][] = [
			[5, 'red'],
			[30, 'orange'],
			[60, 'yellow'],
			[120, 'green'],
			[180, 'cyan'],
			[220, 'blue'],
			[270, 'purple'],
			[310, 'pink'],
			[350, 'red']
		];
		for (const [h, name] of names) expect(describeColor({ h, s: 1, v: 1 })).toBe(name);
	});

	it('falls back to red for a hue outside 0-360 and calls dark orange brown', () => {
		expect(describeColor({ h: 400, s: 1, v: 1 })).toBe('red');
		expect(describeColor({ h: 30, s: 1, v: 0.6 })).toBe('brown');
	});

	it('adds dark, light and muted tones', () => {
		expect(describeColor({ h: 220, s: 1, v: 0.3 })).toBe('dark blue');
		expect(describeColor({ h: 220, s: 0.3, v: 0.9 })).toBe('light blue');
		expect(describeColor({ h: 220, s: 0.3, v: 0.6 })).toBe('muted blue');
	});
});
