/*
 * Theme helpers shared by ThemeToggle and the before-paint script. A kern "family"
 * is the part of a theme id before the first dash (`stuffcloud`, `flower`, `pop`);
 * each family has one light and one dark theme that a two-state toggle switches between.
 * Nothing here touches `window` at module level, so it stays SSR-safe.
 */

export interface ThemeOption {
	/** Value of `data-theme`. */
	id: string;
	/** Visible name, e.g. in the menu. */
	label: string;
}

/** Light and dark theme of each built-in family. */
export const THEME_FAMILIES: Readonly<Record<string, { light: string; dark: string }>> = {
	stuffcloud: { light: 'stuffcloud-light', dark: 'stuffcloud' },
	flower: { light: 'flower', dark: 'flower-wald' },
	pop: { light: 'pop', dark: 'pop-dark' }
};

/** Family used when the current theme is unknown or not a built-in one. */
const FALLBACK_FAMILY = 'stuffcloud';

const DARK_THEMES: ReadonlySet<string> = new Set(['stuffcloud', 'stuffcloud-dark', 'stuffcloud-contrast', 'flower-wald', 'pop-dark']);

/** `stuffcloud-light` → `stuffcloud`. Empty for a missing id. */
export function themeFamily(id: string | null | undefined): string {
	return (id ?? '').split('-')[0] ?? '';
}

/** True for the built-in dark themes and any id ending in `-dark`. */
export function isDarkTheme(id: string): boolean {
	return DARK_THEMES.has(id) || id.endsWith('-dark');
}

export interface ThemePairLabels {
	light?: string | undefined;
	dark?: string | undefined;
}

/**
 * The light/dark pair of the family of `current`, light first.
 * Unknown families fall back to Stuffcloud.
 */
export function themePair(current: string | null | undefined, labels: ThemePairLabels = {}): [ThemeOption, ThemeOption] {
	const family = THEME_FAMILIES[themeFamily(current)] ?? THEME_FAMILIES[FALLBACK_FAMILY];
	return [
		{ id: family.light, label: labels.light ?? 'Light' },
		{ id: family.dark, label: labels.dark ?? 'Dark' }
	];
}

/**
 * Which theme of a two-theme list is "on" (dark) and which "off" (light): the dark one by
 * name, otherwise the second entry.
 */
export function toggleRoles(themes: readonly ThemeOption[]): { on: ThemeOption; off: ThemeOption } | undefined {
	if (themes.length !== 2) return undefined;
	const dark = themes.filter((t) => isDarkTheme(t.id));
	const on = dark.length === 1 ? dark[0] : themes[1];
	const off = themes[0] === on ? themes[1] : themes[0];
	return { on, off };
}

/** The theme of `themes` that fits the system colour scheme, or undefined when none does. */
export function pickBySystem(themes: readonly ThemeOption[], dark: boolean): ThemeOption | undefined {
	const roles = toggleRoles(themes);
	if (roles) return dark ? roles.on : roles.off;
	return themes.find((t) => isDarkTheme(t.id) === dark);
}

/** Reads a stored theme id; null when nothing is stored or storage is unavailable. */
export function readStoredTheme(key: string): string | null {
	try {
		return localStorage.getItem(key);
	} catch {
		return null;
	}
}

/** Stores a theme id; silently does nothing when storage is unavailable. */
export function writeStoredTheme(key: string, id: string): void {
	try {
		localStorage.setItem(key, id);
	} catch {
		/* private mode or blocked storage: the choice just is not remembered */
	}
}

export interface ThemeScriptOptions {
	/**
	 * Without a stored choice, follow `prefers-color-scheme`: pick the dark or light theme
	 * of the family that `<html data-theme>` already names (Stuffcloud when it names none).
	 */
	followSystem?: boolean | undefined;
}

/**
 * Builds a tiny inline script that applies the stored theme to `<html>` before first paint.
 * Put it in `<head>` as `<script>…</script>`, before the stylesheet is needed. `storageKey`
 * must equal the `persist` key of the ThemeToggle. Pass `followSystem` when the toggle uses it.
 * Under a strict CSP the inline script needs a nonce.
 */
export function createThemeScript(storageKey: string, options: ThemeScriptOptions = {}): string {
	// `<` is escaped so a key can never close the surrounding <script> element.
	const js = (value: unknown): string => JSON.stringify(value).replace(/</g, '\\u003c');
	const families = Object.fromEntries(Object.entries(THEME_FAMILIES).map(([name, f]) => [name, [f.light, f.dark]]));
	const follow = options.followSystem
		? `try{var p=M[(d.getAttribute("data-theme")||"").split("-")[0]]||M[${js(FALLBACK_FAMILY)}];` +
			`d.setAttribute("data-theme",matchMedia("(prefers-color-scheme: dark)").matches?p[1]:p[0])}catch(e){}`
		: '';
	return (
		`(function(){var d=document.documentElement,s=null,M=${js(families)};` +
		`try{s=localStorage.getItem(${js(storageKey)})}catch(e){}` +
		`if(s&&/^[\\w-]+$/.test(s)){d.setAttribute("data-theme",s);return}` +
		`${follow}})();`
	);
}

/** Script for the default storage key `kern-theme` (the key the kern demo uses). */
export const themeScript: string = createThemeScript('kern-theme');
