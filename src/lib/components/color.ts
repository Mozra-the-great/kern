/*
 * Colour math for ColorPicker: hex parsing and formatting, RGB <-> HSV,
 * relative luminance and a short English description. No dependencies.
 */

export interface Rgba {
	/** 0–255 */
	r: number;
	g: number;
	b: number;
	/** 0–1 */
	a: number;
}

export interface Hsv {
	/** Hue in degrees, 0–360 (360 is shown as 0). */
	h: number;
	/** Saturation, 0–1. */
	s: number;
	/** Value (brightness), 0–1. */
	v: number;
}

/** Reads #rgb, #rgba, #rrggbb or #rrggbbaa (the # is optional, case does not matter). */
export function parseHex(input: string): Rgba | null {
	const m = /^#?([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(input.trim());
	if (!m) return null;
	let hex = m[1];
	if (hex.length <= 4) hex = Array.from(hex, (c) => c + c).join('');
	const n = (i: number) => parseInt(hex.slice(i, i + 2), 16);
	return { r: n(0), g: n(2), b: n(4), a: hex.length === 8 ? Math.round((n(6) / 255) * 1000) / 1000 : 1 };
}

function byte(n: number): string {
	return Math.max(0, Math.min(255, Math.round(n)))
		.toString(16)
		.padStart(2, '0');
}

/** Lower-case #rrggbb, or #rrggbbaa when `withAlpha` and the colour is not opaque. */
export function toHex(c: Rgba, withAlpha = false): string {
	const base = `#${byte(c.r)}${byte(c.g)}${byte(c.b)}`;
	return withAlpha && c.a < 1 ? `${base}${byte(c.a * 255)}` : base;
}

/** Normalises any accepted hex form; null when it is not a colour. */
export function normalizeHex(input: string, withAlpha = false): string | null {
	const c = parseHex(input);
	return c ? toHex(c, withAlpha) : null;
}

export function rgbToHsv(r: number, g: number, b: number): Hsv {
	const rn = r / 255;
	const gn = g / 255;
	const bn = b / 255;
	const max = Math.max(rn, gn, bn);
	const min = Math.min(rn, gn, bn);
	const d = max - min;
	let h = 0;
	if (d > 0) {
		if (max === rn) h = ((gn - bn) / d) % 6;
		else if (max === gn) h = (bn - rn) / d + 2;
		else h = (rn - gn) / d + 4;
		h *= 60;
		if (h < 0) h += 360;
	}
	return { h, s: max === 0 ? 0 : d / max, v: max };
}

export function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
	const hh = (((h % 360) + 360) % 360) / 60;
	const c = v * s;
	const x = c * (1 - Math.abs((hh % 2) - 1));
	const m = v - c;
	let rgb: [number, number, number];
	if (hh < 1) rgb = [c, x, 0];
	else if (hh < 2) rgb = [x, c, 0];
	else if (hh < 3) rgb = [0, c, x];
	else if (hh < 4) rgb = [0, x, c];
	else if (hh < 5) rgb = [x, 0, c];
	else rgb = [c, 0, x];
	return { r: Math.round((rgb[0] + m) * 255), g: Math.round((rgb[1] + m) * 255), b: Math.round((rgb[2] + m) * 255) };
}

/** WCAG relative luminance, 0 (black) – 1 (white). */
export function luminance(r: number, g: number, b: number): number {
	const lin = (n: number) => {
		const c = n / 255;
		return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
	};
	return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** True when black text or marks read better on the colour than white ones. */
export function prefersDarkInk(r: number, g: number, b: number): boolean {
	const l = luminance(r, g, b);
	return (l + 0.05) / 0.05 >= 1.05 / (l + 0.05);
}

const HUES: [number, string][] = [
	[15, 'red'],
	[45, 'orange'],
	[70, 'yellow'],
	[160, 'green'],
	[195, 'cyan'],
	[255, 'blue'],
	[290, 'purple'],
	[335, 'pink'],
	[360, 'red']
];

/** A short English name such as "dark blue", "light pink" or "grey". */
export function describeColor(hsv: Hsv): string {
	const { h, s, v } = hsv;
	if (v < 0.12) return 'black';
	if (s < 0.12) return v > 0.92 ? 'white' : v > 0.65 ? 'light grey' : v > 0.35 ? 'grey' : 'dark grey';
	let name = 'red';
	for (const [end, n] of HUES) {
		if (h < end) {
			name = n;
			break;
		}
	}
	if (name === 'orange' && v < 0.65) name = 'brown';
	const tone = v < 0.45 ? 'dark ' : s < 0.45 && v > 0.8 ? 'light ' : s < 0.45 ? 'muted ' : '';
	return `${tone}${name}`;
}
