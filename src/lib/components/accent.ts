/*
 * Accent API: puts one custom colour on top of any standard kern theme (code, flower, pop, line)
 * without rebuilding the theme. From one hex colour it derives the tokens that carry an accent
 * (`--k-accent`, `--k-primary`, their `on-*`, hover, soft, text, mark and `--k-focus` values) and
 * moves the lightness of the ones that would fail WCAG against the theme's surfaces: text 4.5:1,
 * non-text 3:1, in light and dark. Every call reports what it changed; invalid input returns a
 * typed failure and touches nothing, nothing here throws while a page renders.
 *
 * - `accentTokens` / `accentCss`: pure, SSR-safe, no DOM. The CSS carries a rule per theme, so
 *   switching light/dark afterwards keeps the contrast (a single token set could not).
 * - `installAccent` / `removeAccent`: page-wide `<style id="kern-accent">`, optional storage for the
 *   head script (`createAccentScript`, flash-free) and the `theme-color` meta.
 * - `applyAccent` / `clearAccent`: inline tokens on one element, for the theme it shows right now.
 *
 * Contrast is computed on the final 8-bit hex values, the way WCAG 2.2 defines it (the same
 * numbers tests/tokens/contrast.test.ts asserts for the shipped themes). Lightness is moved in
 * OKLCH, hue and chroma stay, so a pink stays pink.
 */
import { ACCENT_BASE_GROUND, ACCENT_GROUNDS, accentGround, type AccentGround, type AccentScheme } from './accent-themes.js';

export { ACCENT_BASE_GROUND, ACCENT_GROUNDS, accentGround };
export type { AccentGround, AccentScheme };

/** Which groups of tokens an accent sets. */
export type AccentRole = 'primary' | 'accent' | 'focus';

export type AccentErrorCode = 'invalid-color' | 'invalid-ground' | 'unknown-theme' | 'invalid-selector' | 'invalid-element' | 'no-dom';

export interface AccentError {
	code: AccentErrorCode;
	message: string;
}

/** Surfaces to check against when no standard theme fits (a custom theme). Hex colours. */
export interface AccentSurfacesInput {
	/** The page. */
	bg: string;
	/** Cards and fields; defaults to `bg`. */
	raised?: string | undefined;
	/** Tracks and hovered surfaces; defaults to `bg`. */
	sunken?: string | undefined;
	/** Body text; default black on light and white on dark grounds. */
	fg?: string | undefined;
	/** Default: dark when `bg` is darker than the black/white crossover. */
	scheme?: AccentScheme | undefined;
}

export interface AccentOptions {
	/**
	 * `data-theme` value to guarantee the contrast on (`flower-wald`, `code`, …). An id that is
	 * not a standard theme is an `unknown-theme` failure unless `scheme` or `surfaces` is given.
	 */
	theme?: string | null | undefined;
	/**
	 * Without `theme`: guarantee the contrast on *every* standard theme of this scheme at once.
	 * Without `theme` and `scheme` the neutral `base.css` ground is used.
	 */
	scheme?: AccentScheme | undefined;
	/** Your own surfaces; they win over `theme` and `scheme`. */
	surfaces?: AccentSurfacesInput | undefined;
	/** Default: all of `primary`, `accent` and `focus`. */
	roles?: readonly AccentRole[] | undefined;
}

/** A token whose value is not the raw accent because the raw accent failed its contrast. */
export interface AccentAdjustment {
	token: string;
	/** The raw accent, as `#rrggbb`. */
	from: string;
	to: string;
	/** `text`: needed 4.5:1; `ui`: needed 3:1 (borders, marks, focus ring). */
	kind: 'text' | 'ui';
	message: string;
}

/** One contrast pair the result stands for. */
export interface AccentCheck {
	token: string;
	/** The surface or token it sits on. */
	on: string;
	ratio: number;
	min: number;
	pass: boolean;
}

export interface AccentOk {
	ok: true;
	/** The accent as given, normalised to `#rrggbb`. */
	accent: string;
	scheme: AccentScheme;
	/** `--k-*` token to value. */
	tokens: Readonly<Record<string, string>>;
	/** The same as a `style=""` attribute value. */
	style: string;
	adjustments: readonly AccentAdjustment[];
	checks: readonly AccentCheck[];
	/** True when every pair in `checks` passes (always so on the standard themes; a custom ground can make it impossible). */
	guaranteed: boolean;
}

export interface AccentFailure {
	ok: false;
	error: AccentError;
}

export type AccentResult = AccentOk | AccentFailure;

export interface AccentCssOptions {
	/** Element that carries `data-theme`; default `:root`. Rules read `<selector>[data-theme='…']`. */
	selector?: string | undefined;
	roles?: readonly AccentRole[] | undefined;
}

export interface AccentCssOk {
	ok: true;
	accent: string;
	/** One rule per standard theme (equal sets share a rule), plus one for a page without `data-theme`. */
	css: string;
	/** The token result for every standard theme. */
	themes: Readonly<Record<string, AccentOk>>;
	guaranteed: boolean;
}

export type AccentCssResult = AccentCssOk | AccentFailure;

export interface InstallAccentOptions extends AccentCssOptions {
	/** Also store the CSS under this `localStorage` key for `createAccentScript` (flash-free next load). */
	storageKey?: string | undefined;
	/** `accent`: paint the browser UI (`<meta name="theme-color">`) in the accent. Default: leave it. */
	themeColor?: 'accent' | false | undefined;
	/** The document to change; default `document`. */
	document?: Document | undefined;
	/** CSP nonce for the `<style>` element (`style-src 'nonce-…'`); needed under a strict CSP. */
	nonce?: string | undefined;
}

export interface AccentScriptOptions {
	/** CSP nonce the head script puts on the `<style>` it adds: the page's `style-src 'nonce-…'` value. */
	nonce?: string | undefined;
}

export interface RemoveAccentOptions {
	storageKey?: string | undefined;
	document?: Document | undefined;
}

export interface ApplyAccentOptions extends AccentOptions {
	/** Skip reading the element's computed `--k-bg…` and use `theme` / `scheme` / `surfaces` only. */
	computed?: boolean | undefined;
}

/** Every token an accent can set; `clearAccent` removes exactly these. */
export const ACCENT_TOKENS: readonly string[] = [
	'--k-accent',
	'--k-on-accent',
	'--k-accent-soft',
	'--k-accent-mark',
	'--k-accent-text',
	'--k-primary',
	'--k-on-primary',
	'--k-primary-hover',
	'--k-on-primary-hover',
	'--k-focus'
];

const ALL_ROLES: readonly AccentRole[] = ['accent', 'primary', 'focus'];
const TEXT_MIN = 4.5;
const UI_MIN = 3;
/** The relative luminance at which black and white text reach the same contrast. */
const CROSSOVER = 0.179;
/** Share of the accent in `--k-accent-soft`, tried in this order until the body text stays readable on it. */
const SOFT_MIX = [0.14, 0.1, 0.07, 0.04, 0.02];
/** Hover moves the primary this far in OKLab lightness (flower: 0.04, pop: 0.1). */
const HOVER_STEP = 0.06;
const THEME_STYLE_ID = 'kern-accent';
/** Longest stored stylesheet the head script accepts. */
const MAX_STORED_CSS = 20000;

// ---------------------------------------------------------------- colour math

interface Rgb {
	r: number;
	g: number;
	b: number;
}
interface Oklch {
	l: number;
	c: number;
	h: number;
}

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/** `#rgb` or `#rrggbb` (case does not matter); anything else, alpha included, is null. */
function parseHex(input: unknown): Rgb | null {
	if (typeof input !== 'string') return null;
	const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(input.trim());
	if (!m) return null;
	const hex = m[1].length === 3 ? Array.from(m[1], (c) => c + c).join('') : m[1];
	return { r: parseInt(hex.slice(0, 2), 16), g: parseInt(hex.slice(2, 4), 16), b: parseInt(hex.slice(4, 6), 16) };
}

const byteHex = (n: number): string => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0');
const toHex = ({ r, g, b }: Rgb): string => `#${byteHex(r)}${byteHex(g)}${byteHex(b)}`;

const toLinear = (c: number): number => {
	const s = c / 255;
	return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const fromLinear = (v: number): number => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);

function luminance({ r, g, b }: Rgb): number {
	return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/** WCAG 2 contrast of two hex colours. */
function ratio(a: string, b: string): number {
	const [hi, lo] = [luminance(parseHex(a) ?? { r: 0, g: 0, b: 0 }), luminance(parseHex(b) ?? { r: 0, g: 0, b: 0 })].sort((x, y) => y - x);
	return (hi + 0.05) / (lo + 0.05);
}

function toOklch(rgb: Rgb): Oklch {
	const r = toLinear(rgb.r);
	const g = toLinear(rgb.g);
	const b = toLinear(rgb.b);
	const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
	const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
	const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
	const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
	const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
	const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
	const c = Math.hypot(a, bb);
	return { l: L, c, h: c < 1e-4 ? 0 : Math.atan2(bb, a) };
}

/** Linear sRGB of an OKLCH colour, not clamped. */
function oklchToLinear({ l, c, h }: Oklch): [number, number, number] {
	const a = c * Math.cos(h);
	const b = c * Math.sin(h);
	const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
	const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
	const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
	return [
		4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
		-1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
		-0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_
	];
}

const inGamut = (rgb: readonly number[]): boolean => rgb.every((v) => v >= -0.0005 && v <= 1.0005);

/** Hex of an OKLCH colour; chroma shrinks until the colour fits sRGB, lightness and hue stay. */
function oklchToHex(color: Oklch): string {
	const l = clamp(color.l, 0, 1);
	let c = color.c;
	if (!inGamut(oklchToLinear({ l, c, h: color.h }))) {
		let lo = 0;
		let hi = c;
		for (let i = 0; i < 24; i++) {
			const mid = (lo + hi) / 2;
			if (inGamut(oklchToLinear({ l, c: mid, h: color.h }))) lo = mid;
			else hi = mid;
		}
		c = lo;
	}
	const [r, g, b] = oklchToLinear({ l, c, h: color.h }).map((v) => fromLinear(clamp(v, 0, 1)) * 255);
	return toHex({ r, g, b });
}

/** `fg` over `bg` in sRGB, like `color-mix(in srgb, fg p, bg)`. */
function mix(fg: string, bg: string, p: number): string {
	const a = parseHex(fg) ?? { r: 0, g: 0, b: 0 };
	const b = parseHex(bg) ?? { r: 0, g: 0, b: 0 };
	return toHex({ r: a.r * p + b.r * (1 - p), g: a.g * p + b.g * (1 - p), b: a.b * p + b.b * (1 - p) });
}

const worst = (color: string, surfaces: readonly string[]): number => Math.min(...surfaces.map((s) => ratio(color, s)));

interface Fit {
	hex: string;
	/** The raw colour failed and was moved. */
	moved: boolean;
}

/**
 * The colour closest to `raw` (same hue and chroma, other lightness) that reaches `min` on every
 * surface. It goes toward black on a light ground and toward white on a dark one. When even the
 * end of that range falls short (a mid-grey custom ground) the better end is returned and the
 * result's `checks` say so.
 */
function fit(raw: string, surfaces: readonly string[], min: number, scheme: AccentScheme): Fit {
	if (worst(raw, surfaces) >= min) return { hex: raw, moved: false };
	const from = toOklch(parseHex(raw) ?? { r: 0, g: 0, b: 0 });
	const at = (l: number): string => oklchToHex({ ...from, l });
	const end = scheme === 'dark' ? 1 : 0;
	if (worst(at(end), surfaces) < min) {
		const other = at(1 - end);
		return { hex: worst(other, surfaces) > worst(at(end), surfaces) ? other : at(end), moved: true };
	}
	let lo = from.l;
	let hi = end;
	for (let i = 0; i < 28; i++) {
		const mid = (lo + hi) / 2;
		if (worst(at(mid), surfaces) >= min) hi = mid;
		else lo = mid;
	}
	return { hex: at(hi), moved: true };
}

/** The ink for text on `fill`: a theme ink when it reaches 4.5:1 (the higher one), else black or white. */
function pickInk(fill: string, inks: readonly string[]): string {
	const themed = [...inks].sort((a, b) => ratio(b, fill) - ratio(a, fill))[0];
	if (themed !== undefined && ratio(themed, fill) >= TEXT_MIN) return themed;
	return ratio('#000000', fill) >= ratio('#ffffff', fill) ? '#000000' : '#ffffff';
}

/** `primary` one step further from the page (darker on light, lighter on dark); the other way at the end of the range. */
function hoverOf(primary: string, surfaces: readonly string[], scheme: AccentScheme): string {
	const from = toOklch(parseHex(primary) ?? { r: 0, g: 0, b: 0 });
	const sign = scheme === 'dark' ? 1 : -1;
	for (const dir of [sign, -sign]) {
		const next = oklchToHex({ ...from, l: from.l + dir * HOVER_STEP });
		if (next !== primary && worst(next, surfaces) >= TEXT_MIN) return next;
	}
	return primary;
}

// ---------------------------------------------------------------- tokens

interface Context {
	scheme: AccentScheme;
	surfaces: string[];
	softBases: string[];
	inks: string[];
	fgs: string[];
}

const unique = (list: readonly string[]): string[] => [...new Set(list)];

function contextOf(ground: AccentGround): Context {
	return {
		scheme: ground.scheme,
		surfaces: unique([ground.bg, ground.raised, ground.sunken]),
		softBases: [ground.raised],
		inks: unique([ground.fg, ground.bg]),
		fgs: [ground.fg]
	};
}

/** Every standard theme of one scheme at once: the contrast holds on all of them. */
function contextOfScheme(scheme: AccentScheme): Context {
	const grounds = Object.values(ACCENT_GROUNDS).filter((g) => g.scheme === scheme);
	return {
		scheme,
		surfaces: unique(grounds.flatMap((g) => [g.bg, g.raised, g.sunken])),
		// The neutral raised surface first: `--k-accent-soft` is mixed over it.
		softBases: unique([scheme === 'light' ? ACCENT_BASE_GROUND.raised : '#17171a', ...grounds.map((g) => g.raised)]),
		inks: scheme === 'light' ? ['#111111'] : ['#ffffff'],
		fgs: unique(grounds.map((g) => g.fg))
	};
}

function fail(code: AccentErrorCode, message: string): AccentFailure {
	return { ok: false, error: { code, message } };
}

/** A value for an error message: quoted, cut at 64 characters, never throws (a hostile `toString` included). */
function show(value: unknown): string {
	try {
		return JSON.stringify(String(value).slice(0, 64));
	} catch {
		return '"?"';
	}
}

/** Options from untyped callers: anything but an object counts as "no options". */
function opts<T extends object>(value: T | null | undefined): T {
	return typeof value === 'object' && value !== null ? value : ({} as T);
}

function resolveContext(options: AccentOptions): Context | AccentFailure {
	const raw: unknown = options.surfaces;
	if (raw !== undefined && raw !== null && (typeof raw !== 'object' || Array.isArray(raw))) {
		return fail('invalid-ground', 'surfaces must be an object with colours');
	}
	const given = raw === null ? undefined : options.surfaces;
	if (given !== undefined) {
		const bg = parseHex(given.bg);
		const raised = given.raised === undefined ? bg : parseHex(given.raised);
		const sunken = given.sunken === undefined ? bg : parseHex(given.sunken);
		const fg = given.fg === undefined ? null : parseHex(given.fg);
		if (!bg || !raised || !sunken || (given.fg !== undefined && !fg)) {
			return fail('invalid-ground', 'surfaces must be #rgb or #rrggbb colours');
		}
		const scheme = given.scheme ?? (luminance(bg) < CROSSOVER ? 'dark' : 'light');
		return contextOf({
			scheme,
			bg: toHex(bg),
			raised: toHex(raised),
			sunken: toHex(sunken),
			fg: fg ? toHex(fg) : scheme === 'dark' ? '#ffffff' : '#000000'
		});
	}
	const theme = typeof options.theme === 'string' ? options.theme.trim() : '';
	if (theme !== '') {
		const ground = accentGround(theme);
		if (ground) return contextOf(ground);
		if (options.scheme === undefined) {
			return fail('unknown-theme', `${show(theme)} is not a standard kern theme; pass scheme or surfaces`);
		}
	}
	if (options.scheme === 'light' || options.scheme === 'dark') return contextOfScheme(options.scheme);
	return contextOf(ACCENT_BASE_GROUND);
}

function explain(token: string, kind: 'text' | 'ui', from: string, to: string): AccentAdjustment {
	const need = kind === 'text' ? '4.5:1 as text' : '3:1 as a mark';
	return { token, from, to, kind, message: `${token} ${from} did not reach ${need} on the theme surfaces; lightness changed to ${to}` };
}

/**
 * Derives the accent tokens for one ground. Pure; never throws.
 *
 * - `--k-accent` is the colour itself, `--k-on-accent` the ink for text on it (4.5:1).
 * - `--k-accent-mark` and `--k-focus` reach 3:1 on bg, raised and sunken; `--k-accent-text` 4.5:1 on
 *   those and on `--k-accent-soft`, which is the accent tinted into the raised surface.
 * - `--k-primary` reaches 4.5:1 on the three surfaces (Tabs and TabLinks draw text with it, the
 *   checkbox, switch and radio use it as a mark); `--k-on-primary`, `--k-primary-hover` and
 *   `--k-on-primary-hover` follow.
 * A colour that already passes is used unchanged; `adjustments` lists the ones that were moved.
 */
export function accentTokens(accent: string, optionsIn: AccentOptions = {}): AccentResult {
	const rgb = parseHex(accent);
	if (!rgb) return fail('invalid-color', `${typeof accent === 'string' ? show(accent) : typeof accent} is not a #rgb or #rrggbb colour`);
	const raw = toHex(rgb);
	const options = opts(optionsIn);
	const context = resolveContext(options);
	if ('ok' in context) return context;
	const roles: readonly unknown[] = Array.isArray(options.roles) ? (options.roles as readonly unknown[]) : ALL_ROLES;
	const { scheme, surfaces, softBases, inks, fgs } = context;

	const tokens: Record<string, string> = {};
	const adjustments: AccentAdjustment[] = [];
	const checks: AccentCheck[] = [];
	const check = (token: string, on: string, onHex: string, min: number): void => {
		const r = ratio(tokens[token] ?? raw, onHex);
		checks.push({ token, on, ratio: Math.round(r * 100) / 100, min, pass: r >= min });
	};
	const place = (token: string, kind: 'text' | 'ui', surfaceList: readonly string[], min: number): string => {
		const f = fit(raw, surfaceList, min, scheme);
		tokens[token] = f.hex;
		if (f.moved) adjustments.push(explain(token, kind, raw, f.hex));
		return f.hex;
	};

	if (roles.includes('accent')) {
		tokens['--k-accent'] = raw;
		tokens['--k-on-accent'] = pickInk(raw, inks);
		check('--k-on-accent', '--k-accent', raw, TEXT_MIN);
		// Body text must stay readable on the tint; a weaker tint is used when it would not.
		const share = SOFT_MIX.find((p) => softBases.every((base) => fgs.every((fg) => ratio(fg, mix(raw, base, p)) >= TEXT_MIN))) ?? 0.02;
		const softs = softBases.map((base) => mix(raw, base, share));
		tokens['--k-accent-soft'] = softs[0];
		place('--k-accent-mark', 'ui', surfaces, UI_MIN);
		place('--k-accent-text', 'text', [...surfaces, ...softs], TEXT_MIN);
		for (const on of surfaces) {
			check('--k-accent-mark', on, on, UI_MIN);
			check('--k-accent-text', on, on, TEXT_MIN);
		}
		for (const soft of softs) {
			check('--k-accent-text', '--k-accent-soft', soft, TEXT_MIN);
			for (const fg of fgs)
				checks.push({
					token: '--k-fg',
					on: '--k-accent-soft',
					ratio: Math.round(ratio(fg, soft) * 100) / 100,
					min: TEXT_MIN,
					pass: ratio(fg, soft) >= TEXT_MIN
				});
		}
	}
	if (roles.includes('primary')) {
		const primary = place('--k-primary', 'text', surfaces, TEXT_MIN);
		const hover = hoverOf(primary, surfaces, scheme);
		tokens['--k-on-primary'] = pickInk(primary, inks);
		tokens['--k-primary-hover'] = hover;
		tokens['--k-on-primary-hover'] = pickInk(hover, inks);
		for (const on of surfaces) {
			check('--k-primary', on, on, TEXT_MIN);
			check('--k-primary-hover', on, on, TEXT_MIN);
		}
		check('--k-on-primary', '--k-primary', primary, TEXT_MIN);
		check('--k-on-primary-hover', '--k-primary-hover', hover, TEXT_MIN);
	}
	if (roles.includes('focus')) {
		place('--k-focus', 'ui', surfaces, UI_MIN);
		for (const on of surfaces) check('--k-focus', on, on, UI_MIN);
	}

	const ordered: Record<string, string> = {};
	for (const name of ACCENT_TOKENS) if (name in tokens) ordered[name] = tokens[name];
	return {
		ok: true,
		accent: raw,
		scheme,
		tokens: ordered,
		style: Object.entries(ordered)
			.map(([k, v]) => `${k}:${v}`)
			.join(';'),
		adjustments,
		checks,
		guaranteed: checks.every((c) => c.pass)
	};
}

// ---------------------------------------------------------------- stylesheet

/** A selector that cannot leave the rule or the `<style>` element. */
const SAFE_SELECTOR = /^[\w .#:>+~*[\]="'^$|()-]+$/;

/** Brackets and parentheses close in order and quotes come in pairs, so the selector cannot swallow the rest of the rule. */
function balanced(selector: string): boolean {
	const open: string[] = [];
	let quote = '';
	for (const ch of selector) {
		if (quote !== '') {
			if (ch === quote) quote = '';
		} else if (ch === '"' || ch === "'") quote = ch;
		else if (ch === '[' || ch === '(') open.push(ch);
		else if (ch === ']' || ch === ')') {
			if (open.pop() !== (ch === ']' ? '[' : '(')) return false;
		}
	}
	return quote === '' && open.length === 0;
}

/**
 * The accent for every standard theme as CSS: one rule per `data-theme` value (the `stuffcloud*`
 * aliases included), `:root[data-theme='flower-wald']{--k-primary:…}`, specific enough to win
 * over the theme's own rule in any order. A theme switch afterwards (light/dark) picks the rule
 * of the new theme, so the contrast holds without running any code. Put it in `<head>` (SSR) or
 * hand it to `installAccent`.
 */
export function accentCss(accent: string, optionsIn: AccentCssOptions = {}): AccentCssResult {
	const options = opts(optionsIn);
	const given: unknown = options.selector ?? ':root';
	const selector = typeof given === 'string' ? given.trim() : '';
	if (selector === '' || !SAFE_SELECTOR.test(selector) || !balanced(selector)) {
		return fail('invalid-selector', `${show(given)} is not a usable selector`);
	}
	const themes: Record<string, AccentOk> = {};
	const groups = new Map<string, string[]>();
	const add = (head: string, result: AccentOk): void => {
		const list = groups.get(result.style) ?? [];
		list.push(head);
		groups.set(result.style, list);
	};
	for (const theme of Object.keys(ACCENT_GROUNDS)) {
		const result = accentTokens(accent, { theme, roles: options.roles });
		if (!result.ok) return result;
		themes[theme] = result;
		add(`${selector}[data-theme='${theme}']`, result);
	}
	const base = accentTokens(accent, { roles: options.roles });
	if (!base.ok) return base;
	add(`${selector}:not([data-theme])`, base);
	const css = [...groups.entries()].map(([style, heads]) => `${heads.join(',')}{${style}}`).join('\n');
	return { ok: true, accent: base.accent, css, themes, guaranteed: base.guaranteed && Object.values(themes).every((t) => t.guaranteed) };
}

// ---------------------------------------------------------------- DOM

const isBrowser = (): boolean => typeof document !== 'undefined';

/** The given document, else the global one; undefined on the server or for something that is not a document. */
function documentOf(given: Document | undefined): Document | undefined {
	const candidate: Document | undefined = given ?? (typeof document === 'undefined' ? undefined : document);
	return typeof candidate?.getElementById === 'function' && candidate.head ? candidate : undefined;
}

/** Nonces are base64-ish tokens; anything else is not put on an element. */
const NONCE = /^[A-Za-z0-9+/_=-]{1,200}$/;
const validNonce = (nonce: unknown): nonce is string => typeof nonce === 'string' && NONCE.test(nonce);

const savedThemeColors = new WeakMap<Document, { metas: Map<HTMLMetaElement, string | null>; created: HTMLMetaElement | null }>();

function setThemeColor(doc: Document, color: string): void {
	const saved = savedThemeColors.get(doc) ?? { metas: new Map<HTMLMetaElement, string | null>(), created: null };
	const metas = [...doc.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')];
	if (metas.length === 0 && saved.created === null) {
		const meta = doc.createElement('meta');
		meta.name = 'theme-color';
		doc.head.append(meta);
		saved.created = meta;
		metas.push(meta);
	}
	if (saved.created !== null && !metas.includes(saved.created)) metas.push(saved.created);
	for (const meta of metas) {
		if (!saved.metas.has(meta)) saved.metas.set(meta, meta.getAttribute('content'));
		meta.setAttribute('content', color);
	}
	savedThemeColors.set(doc, saved);
}

function restoreThemeColor(doc: Document): void {
	const saved = savedThemeColors.get(doc);
	if (!saved) return;
	for (const [meta, content] of saved.metas) {
		if (meta === saved.created) meta.remove();
		else if (content === null) meta.removeAttribute('content');
		else meta.setAttribute('content', content);
	}
	savedThemeColors.delete(doc);
}

function storage(): Storage | undefined {
	try {
		return typeof localStorage === 'undefined' ? undefined : localStorage;
	} catch {
		return undefined;
	}
}

/**
 * Puts the accent on the whole page: `<style id="kern-accent">` in `<head>` with `accentCss`, replaced
 * on every call. `storageKey` stores the CSS for `createAccentScript` so the next load paints the accent
 * from the first frame. Invalid input returns the failure and leaves the page as it was.
 * Not available during SSR (`no-dom` failure): render `accentCss(…).css` into the HTML there.
 */
export function installAccent(accent: string, optionsIn: InstallAccentOptions = {}): AccentCssResult {
	const options = opts(optionsIn);
	const doc = documentOf(options.document);
	if (doc === undefined) return fail('no-dom', 'installAccent needs a document; use accentCss on the server');
	const result = accentCss(accent, options);
	if (!result.ok) return result;
	let style = doc.getElementById(THEME_STYLE_ID);
	if (style === null) {
		style = doc.createElement('style');
		style.id = THEME_STYLE_ID;
		doc.head.append(style);
	}
	if (validNonce(options.nonce)) style.nonce = options.nonce;
	style.textContent = result.css;
	if (options.storageKey) {
		try {
			storage()?.setItem(options.storageKey, result.css);
		} catch {
			/* blocked storage: the accent just is not remembered for the first paint */
		}
	}
	if (options.themeColor === 'accent') setThemeColor(doc, result.accent);
	else restoreThemeColor(doc);
	return result;
}

/** Undoes `installAccent`: removes the style, the stored copy and a changed `theme-color`. */
export function removeAccent(optionsIn: RemoveAccentOptions = {}): void {
	const options = opts(optionsIn);
	const doc = documentOf(options.document);
	if (doc !== undefined) {
		doc.getElementById(THEME_STYLE_ID)?.remove();
		restoreThemeColor(doc);
	}
	if (options.storageKey) {
		try {
			storage()?.removeItem(options.storageKey);
		} catch {
			/* nothing stored that could be removed */
		}
	}
}

/** `#rrggbb` of a computed custom property: hex or opaque `rgb()`; null for anything else (`color-mix(…)`, names). */
function cssColor(value: string): string | null {
	const v = value.trim();
	const hex = parseHex(v);
	if (hex) return toHex(hex);
	const m = /^rgba?\(\s*(\d+(?:\.\d+)?)[\s,]+(\d+(?:\.\d+)?)[\s,]+(\d+(?:\.\d+)?)\s*(?:[,/]\s*(\d+(?:\.\d+)?%?|\.\d+%?)\s*)?\)$/i.exec(v);
	if (!m) return null;
	if (m[4] !== undefined && parseFloat(m[4]) / (m[4].endsWith('%') ? 100 : 1) < 1) return null;
	return toHex({ r: Number(m[1]), g: Number(m[2]), b: Number(m[3]) });
}

/** The surfaces `el` shows right now (computed `--k-bg`, `--k-bg-raised`, `--k-bg-sunken`, `--k-fg`), if all are plain colours. */
function computedSurfaces(el: Element): AccentSurfacesInput | undefined {
	if (typeof getComputedStyle === 'undefined') return undefined;
	const style = getComputedStyle(el);
	const read = (name: string): string | null => cssColor(style.getPropertyValue(name));
	const bg = read('--k-bg');
	const raised = read('--k-bg-raised');
	const sunken = read('--k-bg-sunken');
	const fg = read('--k-fg');
	return bg && raised && sunken && fg ? { bg, raised, sunken, fg } : undefined;
}

/**
 * Sets the accent tokens inline on `el` for the theme it shows right now. The surfaces come from
 * the element's computed `--k-bg…` (so a custom theme works), else from its `data-theme`, else from
 * `options`. The tokens do not follow a later theme switch: call it again, or use `installAccent`
 * for a page that switches themes. Returns the result; invalid input changes nothing.
 */
export function applyAccent(el: Element & ElementCSSInlineStyle, accent: string, optionsIn: ApplyAccentOptions = {}): AccentResult {
	if (!isBrowser()) return fail('no-dom', 'applyAccent needs a browser; use accentCss on the server');
	if (!hasInlineStyle(el)) return fail('invalid-element', 'applyAccent needs an element with a style');
	const options = opts(optionsIn);
	const theme = options.theme ?? el.closest('[data-theme]')?.getAttribute('data-theme') ?? undefined;
	const surfaces = options.surfaces ?? (options.computed === false ? undefined : computedSurfaces(el));
	const result = accentTokens(accent, { theme, scheme: options.scheme, surfaces, roles: options.roles });
	if (!result.ok) return result;
	for (const name of ACCENT_TOKENS) el.style.removeProperty(name);
	for (const [name, value] of Object.entries(result.tokens)) el.style.setProperty(name, value);
	return result;
}

function hasInlineStyle(el: unknown): el is Element & ElementCSSInlineStyle {
	return typeof el === 'object' && el !== null && typeof (el as Element).closest === 'function' && 'style' in el;
}

/** Removes every token `applyAccent` set on `el`. */
export function clearAccent(el: ElementCSSInlineStyle): void {
	if (!hasInlineStyle(el)) return;
	for (const name of ACCENT_TOKENS) el.style.removeProperty(name);
}

/**
 * Inline script for `<head>` that applies the accent stored by `installAccent({ storageKey })` before
 * the first paint (like `createThemeScript` does for the theme). It accepts nothing but what
 * `accentCss` writes: rules whose selector uses plain selector characters and whose blocks hold only
 * `--k-…: #rrggbb` declarations of the accent tokens, at most 20 000 characters. Anything else in the
 * storage (a `url()`, `content`, `display`, an `@` rule, a comment) is ignored, so a write to
 * `localStorage` can recolour the accent but not load, hide or add anything. Use one storage key per
 * instance (origin) of the app. Under a strict CSP the inline script needs a nonce or a hash, and
 * `options.nonce` is put on the `<style>` it adds (the page's `style-src 'nonce-…'` value).
 */
export function createAccentScript(storageKey: string, optionsIn: AccentScriptOptions = {}): string {
	// `<` is escaped so a value can never close the surrounding <script> element.
	const js = (value: unknown): string => (JSON.stringify(value) ?? 'null').replace(/</g, '\\u003c');
	const nonce = opts(optionsIn).nonce;
	const rawKey: unknown = storageKey;
	const storageName = typeof rawKey === 'string' ? rawKey : String(rawKey);
	const names = ACCENT_TOKENS.map((t) => t.slice('--k-'.length)).join('|');
	const rule = `[\\w .#:>+~*\\[\\]="'^$|(),-]+\\{(?:--k-(?:${names}):#[0-9a-f]{6};?)+\\}\\n?`;
	return (
		`(function(){try{var c=localStorage.getItem(${js(storageName)});` +
		`if(!c||c.length>${MAX_STORED_CSS}||!/^(?:${rule})+$/.test(c))return;` +
		`var s=document.createElement("style");s.id=${js(THEME_STYLE_ID)};` +
		(validNonce(nonce) ? `s.nonce=${js(nonce)};` : '') +
		`s.textContent=c;document.head.appendChild(s)}catch(e){}})();`
	);
}
