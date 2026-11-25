import { fileURLToPath } from 'node:url';
import { svelte, vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { defineConfig, type Plugin } from 'vite';
import { createThemeScript } from '../../../dist/components/theme.js';
import { THEME_KEY, THEME_OPTIONS } from '../../csp/policy.mjs';

// The strict-CSP fixture app (#125): a production Vite build of every exported Svelte component, the way a consumer
// builds kern. The kern imports resolve through package.json "exports" (self-reference), so run `npm run build`
// first. tests/csp/server.mjs serves dist/ under the strict policy; tests/csp/csp.spec.ts drives it.
//
// `--mode canary` builds the negative fixture into dist-canary/: the same app with a static `style="…"` attribute
// injected into the template of the built Badge component, the case #125 names first. csp.spec.ts proves the check
// fails on it, so the check cannot pass because it looks at nothing.
const root = fileURLToPath(new URL('.', import.meta.url));

/** The before-paint theme script, inline and unchanged: its sha256 is in the policy (themeScriptHash). */
const themeScript: Plugin = {
	name: 'kern-csp-theme-script',
	transformIndexHtml(html) {
		const marker = '<!--kern-theme-script-->';
		if (!html.includes(marker)) throw new Error('index.html lost the theme-script marker');
		return html.replace(marker, `<script>${createThemeScript(THEME_KEY, THEME_OPTIONS)}</script>`);
	}
};

/** The negative fixture: Badge's root element gets a static style attribute in the cloned template HTML. */
const BADGE_ROOT = '<span class="k-badge {cls}"';
function staticStyle(canary: boolean): Plugin {
	let injected = false;
	return {
		name: 'kern-csp-canary',
		enforce: 'pre',
		transform(code, id) {
			if (!canary || !id.replaceAll('\\', '/').endsWith('/dist/components/Badge.svelte')) return undefined;
			if (!code.includes(BADGE_ROOT)) throw new Error('canary: the root element of Badge.svelte changed, update BADGE_ROOT');
			injected = true;
			return code.replace(BADGE_ROOT, '<span style="outline: 0" class="k-badge {cls}"');
		},
		buildEnd() {
			if (canary && !injected) throw new Error('canary: Badge.svelte was not transformed, the negative fixture is not negative');
		}
	};
}

export default defineConfig(({ mode }) => ({
	root,
	base: './',
	plugins: [
		staticStyle(mode === 'canary'),
		svelte({ configFile: false, preprocess: vitePreprocess(), compilerOptions: { runes: true } }),
		themeScript
	],
	build: {
		outDir: mode === 'canary' ? 'dist-canary' : 'dist',
		emptyOutDir: true,
		target: 'es2022',
		// Art and other assets stay files: a data: URI is blocked by img-src 'self' (consumer guide, "Bundler").
		assetsInlineLimit: 0
	}
}));
