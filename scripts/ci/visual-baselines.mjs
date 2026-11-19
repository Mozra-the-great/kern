// Copies the actual screenshots of a failed visual run (the CI artifact `visual-results`, or a local
// tests/elements/test-results folder) into the baselines of tests/elements/visual.spec.ts.
//
// Usage: node scripts/ci/visual-baselines.mjs <dir> [--platform linux|win32|darwin]
//   <dir>  where `gh run download <run id> -n visual-results -D <dir>` put the artifact
// Each `<name>-actual.png` (and each new `<name>-chromium-<platform>.png` the run wrote) becomes `tests/elements/visual.spec.ts-snapshots/<name>-chromium-<platform>.png`
// (default linux, the CI platform). The stuffcloud alias tests write the same names as the code tests;
// two different actuals for one name are reported, since the aliases must render identically.
// Look at every copied image before committing it (docs/themes.md, "Visual regression").
import { createHash } from 'node:crypto';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';

const args = process.argv.slice(2);
const dir = args[0];
const at = args.indexOf('--platform');
const platform = at === -1 ? 'linux' : args[at + 1];
if (!dir || dir.startsWith('--') || !['linux', 'win32', 'darwin'].includes(platform ?? '')) {
	console.error('Usage: node scripts/ci/visual-baselines.mjs <downloaded visual-results dir> [--platform linux|win32|darwin]');
	process.exit(2);
}
const target = resolve(import.meta.dirname, '../../tests/elements/visual.spec.ts-snapshots');
mkdirSync(target, { recursive: true });

const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]));
let files;
try {
	files = walk(resolve(dir));
} catch (e) {
	if (e && e.code === 'ENOENT') {
		console.error(`${dir} does not exist (where did \`gh run download\` put the artifact?)`);
		process.exit(2);
	}
	throw e;
}
const seen = new Map();
let conflicts = 0;
// `-actual.png`: a baseline that differs; `-chromium-<platform>.png`: a missing one the run wrote.
// Plain suffix comparison: `platform` is one of the three allowed names above and never becomes a pattern.
const ownSuffix = `-chromium-${platform}.png`;
for (const file of files.filter((f) => f.endsWith('-actual.png') || f.endsWith(ownSuffix))) {
	const b = basename(file);
	const name = b.endsWith('-actual.png') ? b.slice(0, -'-actual.png'.length) : b.slice(0, -ownSuffix.length);
	// Read once; the copy is written from the same bytes that were hashed.
	const bytes = readFileSync(file);
	const hash = createHash('sha256').update(bytes).digest('hex');
	if (seen.has(name)) {
		if (seen.get(name) !== hash) {
			console.error(`${name}: two different actual screenshots (an alias renders differently from code)`);
			conflicts++;
		}
		continue;
	}
	seen.set(name, hash);
	writeFileSync(join(target, `${name}-chromium-${platform}.png`), bytes);
}
console.log(`Copied ${seen.size} baselines (chromium-${platform}) to tests/elements/visual.spec.ts-snapshots.`);
process.exitCode = conflicts > 0 ? 1 : 0;
