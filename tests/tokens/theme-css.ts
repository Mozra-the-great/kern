/**
 * Reads the theme CSS the way a browser would for one `data-theme` value, without a
 * browser: follows `@import`, applies every rule whose selector matches
 * `<html data-theme="…">` in source order, then resolves `var()` references.
 * Rules inside `@media` are skipped: they only switch sizes and motion, never colours
 * (the contrast test asserts that).
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export interface Rule {
	selectors: string[];
	decls: Map<string, string>;
	/** Media condition of the enclosing `@media` block, `null` at top level. */
	media: string | null;
	file: string;
}

const stripComments = (css: string): string => css.replace(/\/\*[\s\S]*?\*\//g, '');

/** Splits `a { … } b { … }` into blocks, keeping nested braces of `@media` together. */
function blocks(css: string): { prelude: string; body: string }[] {
	const out: { prelude: string; body: string }[] = [];
	let depth = 0;
	let start = 0;
	let open = -1;
	for (let i = 0; i < css.length; i++) {
		const ch = css[i];
		if (ch === '{') {
			if (depth === 0) open = i;
			depth++;
		} else if (ch === '}') {
			depth--;
			if (depth === 0) {
				out.push({ prelude: css.slice(start, open).trim(), body: css.slice(open + 1, i) });
				start = i + 1;
			}
		}
	}
	return out;
}

function parseDecls(body: string): Map<string, string> {
	const decls = new Map<string, string>();
	for (const part of body.split(';')) {
		const idx = part.indexOf(':');
		if (idx < 0) continue;
		const prop = part.slice(0, idx).trim();
		const value = part.slice(idx + 1).trim();
		if (prop) decls.set(prop, value);
	}
	return decls;
}

/** All rules of `file` and the files it imports, in cascade order. */
export function loadRules(file: string, seen: Set<string> = new Set()): Rule[] {
	const path = resolve(file);
	if (seen.has(path)) return [];
	seen.add(path);
	let css = stripComments(readFileSync(path, 'utf8'));
	const rules: Rule[] = [];
	css = css.replace(/@import\s+(?:url\()?['"]([^'"]+)['"]\)?\s*;/g, (_m, rel: string) => {
		rules.push(...loadRules(resolve(dirname(path), rel), seen));
		return '';
	});
	for (const { prelude, body } of blocks(css)) {
		if (prelude.startsWith('@media')) {
			const media = prelude.slice('@media'.length).trim();
			for (const inner of blocks(body)) {
				rules.push({ selectors: splitSelectors(inner.prelude), decls: parseDecls(inner.body), media, file: path });
			}
		} else if (!prelude.startsWith('@')) {
			rules.push({ selectors: splitSelectors(prelude), decls: parseDecls(body), media: null, file: path });
		}
	}
	return rules;
}

const splitSelectors = (prelude: string): string[] =>
	prelude
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean);

const ATTR = /^\[data-theme(?:([\^]?=)\s*['"]([^'"]*)['"])?\]$/;

/** Does `selector` match `<html data-theme="theme">`? Only the forms themes use are understood. */
export function matches(selector: string, theme: string): boolean {
	if (selector === ':root') return true;
	const m = ATTR.exec(selector);
	if (!m) return false;
	const [, op, value] = m;
	if (!op) return true;
	return op === '=' ? theme === value : theme.startsWith(value);
}

/** Every exact `data-theme` value a theme file defines colours for, in source order. */
export function themeVariants(rules: Rule[]): string[] {
	const out: string[] = [];
	for (const r of rules) {
		for (const s of r.selectors) {
			const m = ATTR.exec(s);
			if (m && m[1] === '=' && !out.includes(m[2])) out.push(m[2]);
		}
	}
	return out;
}

/** Custom properties of `<html data-theme="theme">`, with `var()` resolved. */
export function resolveTokens(rules: Rule[], theme: string): Map<string, string> {
	const raw = new Map<string, string>();
	for (const r of rules) {
		if (r.media !== null) continue;
		if (!r.selectors.some((s) => matches(s, theme))) continue;
		for (const [k, v] of r.decls) if (k.startsWith('--')) raw.set(k, v);
	}
	const done = new Map<string, string>();
	const resolveValue = (value: string, stack: string[]): string =>
		value.replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^()]*(?:\([^()]*\)[^()]*)*))?\)/g, (_m, name: string, fallback?: string) => {
			if (stack.includes(name)) throw new Error(`Cycle in ${[...stack, name].join(' -> ')}`);
			const got = get(name, stack);
			if (got !== undefined) return got;
			if (fallback !== undefined) return resolveValue(fallback.trim(), stack);
			throw new Error(`${name} is not defined for data-theme="${theme}"`);
		});
	function get(name: string, stack: string[]): string | undefined {
		if (done.has(name)) return done.get(name);
		const v = raw.get(name);
		if (v === undefined) return undefined;
		const out = resolveValue(v, [...stack, name]);
		done.set(name, out);
		return out;
	}
	for (const name of raw.keys()) get(name, []);
	return done;
}

export interface Rgba {
	r: number;
	g: number;
	b: number;
	a: number;
}

/** Parses `#rgb`, `#rrggbb`, `#rrggbbaa`, `rgb()` and `rgba()`. */
export function parseColor(value: string): Rgba {
	const v = value.trim().toLowerCase();
	let m = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/.exec(v);
	if (m) {
		let hex = m[1];
		if (hex.length === 3) hex = [...hex].map((c) => c + c).join('');
		const n = (i: number): number => parseInt(hex.slice(i, i + 2), 16);
		return { r: n(0), g: n(2), b: n(4), a: hex.length === 8 ? n(6) / 255 : 1 };
	}
	m = /^rgba?\(([^)]+)\)$/.exec(v);
	if (m) {
		const parts = m[1]
			.split(/[\s,/]+/)
			.filter(Boolean)
			.map(Number);
		return { r: parts[0], g: parts[1], b: parts[2], a: parts[3] ?? 1 };
	}
	throw new Error(`Unsupported colour: ${value}`);
}

/** `fg` painted over an opaque `bg`. */
function over(fg: Rgba, bg: Rgba): Rgba {
	return {
		r: fg.r * fg.a + bg.r * (1 - fg.a),
		g: fg.g * fg.a + bg.g * (1 - fg.a),
		b: fg.b * fg.a + bg.b * (1 - fg.a),
		a: 1
	};
}

function luminance({ r, g, b }: Rgba): number {
	const ch = (c: number): number => {
		const s = c / 255;
		return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
	};
	return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
}

/** WCAG 2 contrast ratio. A translucent `fg` is composited over `bg` first. */
export function contrast(fg: string, bg: string): number {
	const b = parseColor(bg);
	if (b.a !== 1) throw new Error(`Background must be opaque: ${bg}`);
	const f = over(parseColor(fg), b);
	const [hi, lo] = [luminance(f), luminance(b)].sort((x, y) => y - x);
	return (hi + 0.05) / (lo + 0.05);
}
