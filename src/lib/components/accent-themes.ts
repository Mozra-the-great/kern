/*
 * The grounds of every standard kern theme, for the accent API (accent.ts). An accent has to
 * reach its contrast on the surfaces a theme paints, so the helper needs them without a
 * browser (SSR, the head snippet, tests). The values mirror `--k-bg`, `--k-bg-raised`,
 * `--k-bg-sunken` and `--k-fg` of src/lib/themes/brands/*.css; tests/tokens/accent-themes.test.ts
 * fails when a theme changes and this table does not (fix: copy the values it prints).
 * Nothing here touches `window`, so it stays SSR-safe.
 */

export type AccentScheme = 'light' | 'dark';

/** What an accent has to be readable against, for one theme. */
export interface AccentGround {
	scheme: AccentScheme;
	/** `--k-bg`: the page. */
	bg: string;
	/** `--k-bg-raised`: cards, fields, overlays. */
	raised: string;
	/** `--k-bg-sunken`: tracks, hovered surfaces. */
	sunken: string;
	/** `--k-fg`: body text; also the dark (light themes) or light (dark themes) ink of the accent fills. */
	fg: string;
}

const dark = (bg: string, raised: string, sunken: string, fg: string): AccentGround => ({ scheme: 'dark', bg, raised, sunken, fg });
const light = (bg: string, raised: string, sunken: string, fg: string): AccentGround => ({ scheme: 'light', bg, raised, sunken, fg });

const codeDark = dark('#101012', '#17171a', '#0c0c0e', '#f4f4f0');
const codeLight = light('#fbfaf8', '#ffffff', '#f1f0ee', '#16141a');
const codePaper = light('#ffffff', '#f4f3f1', '#f4f3f1', '#111111');
const codeContrast = dark('#000000', '#0a0a0a', '#000000', '#ffffff');
const flowerCreme = light('#f6f0e0', '#fcf9f0', '#edead6', '#2c4f38');
const popLight = light('#f3f4f1', '#ffffff', '#e2e5df', '#151714');
const lineDark = dark('#19191c', '#232327', '#121214', '#ffffff');

/**
 * Grounds by `data-theme` value, including the aliases (`stuffcloud*` until 1.0, `flower-creme`,
 * `pop-light`, `line-dark`). The key is exactly what `<html data-theme>` holds.
 */
export const ACCENT_GROUNDS: Readonly<Record<string, AccentGround>> = {
	code: codeDark,
	'code-dark': codeDark,
	'code-light': codeLight,
	'code-paper': codePaper,
	'code-contrast': codeContrast,
	stuffcloud: codeDark,
	'stuffcloud-dark': codeDark,
	'stuffcloud-light': codeLight,
	'stuffcloud-paper': codePaper,
	'stuffcloud-contrast': codeContrast,
	flower: flowerCreme,
	'flower-creme': flowerCreme,
	'flower-wald': dark('#254538', '#2d5446', '#1f3b30', '#f6f0e0'),
	pop: popLight,
	'pop-light': popLight,
	'pop-dark': dark('#0e100d', '#1a1d18', '#2e332b', '#f2f4ef'),
	line: lineDark,
	'line-dark': lineDark,
	'line-light': light('#f2f2f3', '#ffffff', '#e6e6e9', '#18181a')
};

/** The neutral ground of `base.css`, used when `<html>` has no `data-theme`. */
export const ACCENT_BASE_GROUND: AccentGround = light('#fbfbfd', '#ffffff', '#f2f2f6', '#1d1b26');

/** The ground of a `data-theme` value; undefined for an id that is not a standard theme. */
export function accentGround(theme: string | null | undefined): AccentGround | undefined {
	if (typeof theme !== 'string') return undefined;
	return Object.hasOwn(ACCENT_GROUNDS, theme) ? ACCENT_GROUNDS[theme] : undefined;
}
