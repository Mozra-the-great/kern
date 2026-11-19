// Compiles every .svelte file in dist/ (the published components) with the
// Svelte compiler that is installed right now, once for the browser and once
// for SSR, the way a consumer's bundler would. CI runs it against the lowest
// supported Svelte (see peerDependencies in package.json) and the newest one.
// Usage: node scripts/ci/compile-dist.mjs [dir]   (default: dist)
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { compile, VERSION } from 'svelte/compiler';

const root = resolve(process.argv[2] ?? 'dist');

/** @param {string} dir @returns {string[]} */
function walk(dir) {
	return readdirSync(dir).flatMap((name) => {
		const path = join(dir, name);
		return statSync(path).isDirectory() ? walk(path) : path.endsWith('.svelte') ? [path] : [];
	});
}

const files = walk(root);
if (files.length === 0) {
	console.error(`No .svelte files below ${root}. Run "npm run package" first.`);
	process.exit(1);
}

let failed = 0;
for (const filename of files) {
	const source = readFileSync(filename, 'utf8');
	for (const generate of /** @type {const} */ (['client', 'server'])) {
		try {
			compile(source, { filename, generate });
		} catch (err) {
			failed++;
			console.error(`FAIL [${generate}] ${filename}: ${err instanceof Error ? err.message : String(err)}`);
		}
	}
}

console.log(`svelte ${VERSION}: compiled ${files.length} components (client + server), ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
