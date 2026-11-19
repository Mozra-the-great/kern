// Size budget of the custom-elements build (#33). Prints raw and gzip sizes of
// - the all-in-one bundle (kern-elements.js and every chunk it imports),
// - a sample app that imports five element entries (button, input, select, modal, tabs),
// - one element (button),
// and fails when one of them grows more than 10 % over scripts/ci/size-baseline.json.
// A size is the sum of the files a browser loads for that import, chunks shared once.
// Usage: node scripts/ci/size-budget.mjs [--update]   (--update rewrites the baseline)
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';

const root = resolve(import.meta.dirname, '../..');
const dist = join(root, 'dist-elements');
const baselineFile = join(import.meta.dirname, 'size-baseline.json');
const TOLERANCE = 1.1;

const groups = {
	'all-in-one': ['kern-elements.js'],
	'5 elements': ['button', 'input', 'select', 'modal', 'tabs'].map((n) => `elements/${n}.js`),
	'1 element': ['elements/button.js']
};

/** Every file loaded for `entry`: the entry and its static imports, transitively. */
function closure(entry, seen = new Set()) {
	if (seen.has(entry)) return seen;
	seen.add(entry);
	const code = readFileSync(join(dist, entry), 'utf8');
	for (const m of code.matchAll(/(?:import|export)\s*(?:[^'"]*?from\s*)?["'](\.{1,2}\/[^"']+)["']/g)) {
		closure(join(dirname(entry), m[1]).replaceAll('\\', '/'), seen);
	}
	return seen;
}

const result = {};
for (const [name, entries] of Object.entries(groups)) {
	const files = new Set();
	for (const e of entries) closure(e, files);
	let raw = 0;
	let gzip = 0;
	for (const f of files) {
		const buf = readFileSync(join(dist, f));
		raw += buf.length;
		gzip += gzipSync(buf, { level: 9 }).length;
	}
	result[name] = { files: files.size, raw, gzip };
}

const kb = (n) => `${(n / 1024).toFixed(1)} kB`;
const baseline = (() => {
	try {
		return JSON.parse(readFileSync(baselineFile, 'utf8'));
	} catch {
		return {};
	}
})();

if (process.argv.includes('--update')) {
	const out = Object.fromEntries(Object.entries(result).map(([k, v]) => [k, { raw: v.raw, gzip: v.gzip }]));
	writeFileSync(baselineFile, JSON.stringify(out, null, '\t') + '\n');
	console.log(`Baseline written: ${baselineFile}`);
}

let failed = false;
console.log('| bundle | files | raw | gzip | budget gzip (+10 %) |');
console.log('|---|---:|---:|---:|---:|');
for (const [name, v] of Object.entries(result)) {
	const b = baseline[name];
	const over = b && (v.raw > b.raw * TOLERANCE || v.gzip > b.gzip * TOLERANCE);
	if (!b) console.log(`(no baseline for "${name}")`);
	if (over) failed = true;
	console.log(`| ${name} | ${v.files} | ${kb(v.raw)} | ${kb(v.gzip)} | ${b ? kb(b.gzip * TOLERANCE) : '-'}${over ? ' **over budget**' : ''} |`);
}
if (failed) {
	console.error('Size budget exceeded. If the growth is intended, run `node scripts/ci/size-budget.mjs --update` and commit the baseline.');
	process.exit(1);
}
