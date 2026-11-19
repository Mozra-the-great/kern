/// <reference types="node" />
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// Builds src/elements/* as custom elements (<k-button>, <k-modal>, …).
// The core components in src/lib are compiled into them; only the wrappers
// register tags, so warnings about custom-element props in src/lib are noise.
//
// Entry points (#33), one ES build with shared chunks:
// - kern-elements.js          all tags (src/elements/index.ts)
// - elements/<name>.js        one tag each, e.g. elements/date-picker.js → <k-date-picker>
// - chunks/*.js               the Svelte runtime and components, shared by all entries
// Per-element entries are virtual modules generated from the wrapper file names
// (KDatePicker.svelte → date-picker → k-date-picker).

const dir = fileURLToPath(new URL('./src/elements/', import.meta.url)).replaceAll('\\', '/');
const wrappers = readdirSync(dir).filter((f) => /^K[A-Za-z]+\.svelte$/.test(f)).sort();
const nameOf = (file: string) => file.replace(/\.svelte$/, '').replace(/^K/, '').replace(/(?<!^)[A-Z]/g, (c) => `-${c}`).toLowerCase();

/** Tags an entry registers besides its own: items are useless without their container. */
const companions: Record<string, string[]> = { accordion: ['accordion-item'] };
/** Extra modules an entry loads: the toaster also brings window.kern and exports the toast API. */
const extras: Record<string, string> = {
	toaster: `import { installGlobal } from ${JSON.stringify(dir + 'global.ts')};\ninstallGlobal();\nexport { toast, dismissToast } from ${JSON.stringify(dir + 'global.ts')};\n`
};

// Lib mode resolves entries against the project root, so the marker may come back as an absolute path.
const MARK = 'kern-entry:';
const PREFIX = '\0' + MARK;
function entries(): Plugin {
	const files = new Map(wrappers.map((f) => [nameOf(f), f]));
	return {
		name: 'kern-element-entries',
		resolveId(id) {
			const at = id.indexOf(MARK);
			return at === -1 ? null : PREFIX + id.slice(at + MARK.length);
		},
		load(id) {
			if (!id.startsWith(PREFIX)) return null;
			const name = id.slice(PREFIX.length);
			const names = [name, ...(companions[name] ?? [])];
			let code = `import { define } from ${JSON.stringify(dir + 'define.ts')};\n`;
			names.forEach((n, i) => {
				const file = files.get(n);
				if (!file) throw new Error(`No wrapper for ${n}`);
				code += `import C${i} from ${JSON.stringify(dir + file)};\ndefine('k-${n}', C${i});\n`;
			});
			return code + (extras[name] ?? '');
		}
	};
}

// Two passes (package.json "build:elements"): `--mode bundle` writes the all-in-one file as one
// self-contained module (one request, compresses as a whole; ~35 % smaller gzip than the same
// code spread over shared chunks), `--mode entries` adds the per-element entries and their
// shared chunks next to it.
export default defineConfig(({ mode }) => {
	const bundle = mode === 'bundle';
	return {
		plugins: [
			entries(),
			svelte({
				compilerOptions: { customElement: true, css: 'injected' },
				onwarn(w, handler) {
					if (w.code === 'custom_element_props_identifier' && w.filename?.includes('src/lib/')) return;
					handler?.(w);
				}
			})
		],
		build: {
			outDir: 'dist-elements',
			emptyOutDir: bundle,
			minify: true,
			lib: {
				entry: bundle
					? { 'kern-elements': 'src/elements/index.ts' }
					: Object.fromEntries(wrappers.map((f) => [`elements/${nameOf(f)}`, MARK + nameOf(f)])),
				formats: ['es'],
				fileName: (_format, entryName) => `${entryName}.js`
			},
			rollupOptions: {
				output: { chunkFileNames: 'chunks/[name]-[hash].js' }
			}
		}
	};
});
