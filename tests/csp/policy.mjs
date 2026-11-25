// The strict Content Security Policy of #125, shared by the fixture build (tests/fixtures/csp-app/vite.config.ts,
// which puts the theme script into index.html) and the test server (server.mjs, which sends the header).
// It is the policy of the consumer guide ("Content Security Policy"), word for word: change both together.

/** Storage key of the before-paint theme script in the fixture (and of its ThemeToggle `persist`). */
export const THEME_KEY = 'kern-csp-theme';

/** Options of the theme script: `followSystem` so its longest branch runs too. */
export const THEME_OPTIONS = Object.freeze({ followSystem: true });

/** How the consumer guide writes the theme-script hash; csp.spec.ts compares the guide's policy with this one. */
export const THEME_HASH_PLACEHOLDER = "'sha256-<createThemeScript>'";

/**
 * The policy with the given `'sha256-…'` source of the theme script, or with THEME_HASH_PLACEHOLDER for the
 * documented form.
 * @param {string} themeHash
 * @returns {string}
 */
export function strictPolicy(themeHash) {
	if (themeHash !== THEME_HASH_PLACEHOLDER && !/^'sha256-[A-Za-z0-9+/]{43}='$/.test(themeHash))
		throw new Error(`not a CSP sha256 source: ${themeHash}`);
	return [
		"default-src 'none'",
		`script-src 'self' ${themeHash}`,
		"style-src 'self'",
		"img-src 'self'",
		"font-src 'self'",
		"connect-src 'self'",
		"frame-ancestors 'none'",
		"base-uri 'none'",
		"form-action 'self'"
	].join('; ');
}
