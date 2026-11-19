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
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';

const args = process.argv.slice(2);
const dir = args[0];
const at = args.indexOf('--platform');
const platform = at === -1 ? 'linux' : args[at + 1];
if (!dir || dir.startsWith('--') || !existsSync(dir) || !['linux', 'win32', 'darwin'].includes(platform ?? '')) {
	console.error('Usage: node scripts/ci/visual-baselines.mjs <downloaded visual-results dir> [--platform linux|win32|darwin]');
	process.exit(2);
}
const target = resolve(import.meta.dirname, '../../tests/elements/visual.spec.ts-snapshots');
mkdirSync(target, { recursive: true });

const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]));
const sha = (f) => createHash('sha256').update(readFileSync(f)).digest('hex');
const seen = new Map();
let conflicts = 0;
// `-actual.png`: a baseline that differs; `-chromium-<platform>.png`: a missing one the run wrote.
const own = new RegExp(`-chromium-${platform}\\.png$`);
for (const file of walk(resolve(dir)).filter((f) => f.endsWith('-actual.png') || own.test(f))) {
	const name = basename(file)
		.replace(/-actual\.png$/, '')
		.replace(own, '');
	const hash = sha(file);
	if (seen.has(name)) {
		if (seen.get(name) !== hash) {
			console.error(`${name}: two different actual screenshots (an alias renders differently from code)`);
			conflicts++;
		}
		continue;
	}
	seen.set(name, hash);
	copyFileSync(file, join(target, `${name}-chromium-${platform}.png`));
}
console.log(`Copied ${seen.size} baselines (chromium-${platform}) to tests/elements/visual.spec.ts-snapshots.`);
process.exitCode = conflicts > 0 ? 1 : 0;
