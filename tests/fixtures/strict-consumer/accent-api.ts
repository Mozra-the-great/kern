// The accent API (#41) under the same strict flags: values that may be undefined for every option,
// both result shapes and the element-side API from the elements typings.
import {
	ACCENT_BASE_GROUND,
	ACCENT_GROUNDS,
	ACCENT_TOKENS,
	accentCss,
	accentGround,
	accentTokens,
	applyAccent,
	clearAccent,
	createAccentScript,
	installAccent,
	removeAccent
} from '@mozra-the-great/kern';
import type {
	AccentAdjustment,
	AccentCssResult,
	AccentGround,
	AccentOptions,
	AccentResult,
	AccentRole,
	AccentScheme,
	ApplyAccentOptions,
	InstallAccentOptions
} from '@mozra-the-great/kern';
import type { KernAccentApi } from '@mozra-the-great/kern/elements';

/** nagellacke-style: a server-provided accent on top of a standard theme, theme and scheme may be unknown. */
export function themed(accent: string | null | undefined, theme: string | undefined, scheme: AccentScheme | undefined): AccentResult {
	const options: AccentOptions = { theme, scheme, surfaces: undefined, roles: undefined };
	if (typeof accent !== 'string') return accentTokens('', options);
	const result = accentTokens(accent, options);
	if (!result.ok) {
		const code: string = result.error.code;
		return code.length > 0 ? result : accentTokens('#000000');
	}
	const moved: readonly AccentAdjustment[] = result.adjustments;
	const primary: string | undefined = result.tokens['--k-primary'];
	return moved.length > 0 && primary === undefined ? accentTokens('#000000', { scheme: result.scheme }) : result;
}

export function page(accent: string | undefined, storageKey: string | undefined): AccentCssResult {
	const roles: readonly AccentRole[] = ['primary', 'accent', 'focus'];
	const options: InstallAccentOptions = {
		selector: undefined,
		roles,
		storageKey,
		themeColor: accent ? 'accent' : undefined,
		document: undefined
	};
	const installed = installAccent(accent ?? '#e91e8c', options);
	if (!installed.ok) removeAccent({ storageKey, document: undefined });
	const css = accentCss(accent ?? '#e91e8c', { selector: '.brand', roles: undefined });
	return css.ok && css.guaranteed ? css : installed;
}

export function inline(el: HTMLElement, accent: string, computed: boolean | undefined): AccentResult {
	const options: ApplyAccentOptions = {
		computed,
		theme: undefined,
		surfaces: { bg: '#101012', raised: undefined, sunken: undefined, fg: undefined, scheme: undefined }
	};
	const result = applyAccent(el, accent, options);
	if (!result.ok) clearAccent(el);
	return result;
}

export function grounds(theme: string | undefined): AccentGround {
	return accentGround(theme) ?? ACCENT_GROUNDS['code'] ?? ACCENT_BASE_GROUND;
}

export function scripts(): [string, number] {
	return [createAccentScript('kern-accent'), ACCENT_TOKENS.length];
}

/** `window.kern.accent` from the elements typings. */
export function viaGlobal(api: KernAccentApi, accent: string): string {
	const result = api.tokens(accent, { scheme: 'dark' });
	return result.ok ? result.style : api.script('k');
}
