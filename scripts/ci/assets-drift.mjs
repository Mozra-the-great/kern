// Drift check of the shipped brand artwork (#56, #84).
//
// Every brand under assets/<brand>/<group>/ has a checked-in manifest.json that lists each file with
// its size and sha256: the contract with the art's source. The Code pixel art (called stuffcloud before the rename) is drawn in the
// stuffcloud repository (docs/design/prototypes, a frozen reference since #181; generated from ASCII sources by
// docs/design/tools/mascots.py and stickers.py) and its manifest also records the pixel grid; the
// pop, line and flower art is vector art from their design-system artifacts and moodboards (plus the
// flower banner, drawn for kern in #110 because its source is a raster picture with text), and its
// manifest records the SVG viewBox. CI cannot reach any of these sources, so the manifests are the
// contract.
//
// Usage:
//   node scripts/ci/assets-drift.mjs                    check every brand against its manifest, the
//                                                       Code catalogue and the SVG safety rules
//                                                       (CI, `build` job)
//   node scripts/ci/assets-drift.mjs --write            rewrite the manifests and the catalogue
//                                                       (src/lib/components/code-art.ts) from the tree
//   node scripts/ci/assets-drift.mjs --against <dir>    also compare the Code art's names and bytes with a
//                                                       stuffcloud checkout's docs/design/prototypes folder
//                                                       (usable from stuffcloud's CI with a kern checkout)
// Exit code 1 on any drift: a missing, extra or changed file, a missing viewBox or an unsafe SVG.
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, join, relative, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../..');
const assetsDir = join(root, 'assets');
const catalogueFile = join(root, 'src', 'lib', 'components', 'code-art.ts');

/** The brands and where their art comes from (the `source` line of each manifest). */
const BRANDS = {
	code: { source: 'Mozra-the-great/stuffcloud docs/design/prototypes', pixel: true },
	pop: {
		source:
			'claude.ai artifacts "Pop-Designsystem" (logo, mascots, outfits, accessories, tool icons) and "stuffcloud Design Explorations (ENTE Trys)", page Pop (seasonal)',
		pixel: false
	},
	line: {
		source:
			'claude.ai artifacts "Line-Designsystem" (logo, mascots, outfits, tool icons) and the stuffcloud Line design canvas (seasonal, illustrations)',
		pixel: false
	},
	flower: {
		source:
			'claude.ai artifacts "Flower-Designs" and "Mozra Botanik-Bausteine" (identical files: blossoms, leaves, trees); banners/ is drawn for kern after the Flower banner (#110)',
		pixel: false
	}
};

/** Constructs no shipped SVG may contain: they are shown via <img>, but consumers may inline them. */
const UNSAFE = [
	[/<script/i, '<script>'],
	[/\son[a-z]+\s*=/i, 'an on* event handler'],
	[/<foreignObject/i, '<foreignObject>'],
	[/<image\b/i, '<image>'],
	[/href\s*=\s*["'](?!#)/i, 'an href that is not a local #fragment'],
	[/url\(\s*["']?(?!#)/i, 'a url() that is not a local #fragment'],
	[/data:/i, 'a data: URI'],
	[/<!ENTITY|<!DOCTYPE/i, 'a DTD or entity'],
	[/<style/i, 'a <style> element (the art has fixed colours)']
];

const args = process.argv.slice(2);
const write = args.includes('--write');
const againstAt = args.indexOf('--against');
const against = againstAt === -1 ? undefined : args[againstAt + 1];
if (againstAt !== -1 && (against === undefined || against.startsWith('--'))) {
	console.error('--against needs the path of a stuffcloud docs/design/prototypes folder');
	process.exit(2);
}

/** Every file under a brand folder except the manifest itself, as posix paths relative to it. */
function listTree(dir, prefix = '') {
	const out = [];
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
		if (entry.isDirectory()) out.push(...listTree(join(dir, entry.name), rel));
		else if (rel !== 'manifest.json') out.push(rel);
	}
	return out.sort();
}

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

/** The pixel grid of a Code SVG: its integer viewBox `0 0 cols rows`. */
function gridOf(text) {
	const m = /viewBox="0 0 (\d+) (\d+)"/.exec(text);
	return m ? { cols: Number(m[1]), rows: Number(m[2]) } : undefined;
}

/** The viewBox of the root <svg> of a vector file. */
function viewBoxOf(text) {
	const m = /<svg\b[^>]*\sviewBox="([^"]+)"/.exec(text);
	return m
		? m[1]
				.trim()
				.split(/[\s,]+/)
				.join(' ')
		: undefined;
}

function describeBrand(brand) {
	const dir = join(assetsDir, brand);
	const files = {};
	const invalid = [];
	for (const rel of listTree(dir)) {
		const buf = readFileSync(join(dir, rel));
		let shape = {};
		if (rel.endsWith('.svg')) {
			const text = buf.toString('utf8');
			if (!/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/.test(text)) invalid.push(`${brand}/${rel}: no SVG xmlns`);
			for (const [re, what] of UNSAFE) if (re.test(text)) invalid.push(`${brand}/${rel}: contains ${what}`);
			if (BRANDS[brand].pixel) {
				const grid = gridOf(text);
				if (!grid) invalid.push(`${brand}/${rel}: no integer viewBox "0 0 <cols> <rows>" (pixel art needs one)`);
				shape = { ...grid };
			} else {
				const viewBox = viewBoxOf(text);
				if (!viewBox) invalid.push(`${brand}/${rel}: no viewBox`);
				shape = { viewBox };
			}
		} else {
			invalid.push(`${brand}/${rel}: only .svg files belong in assets/${brand}`);
		}
		files[rel] = { bytes: buf.length, sha256: sha256(buf), ...shape };
	}
	return { files, invalid };
}

function manifestText(brand, files) {
	const manifest = {
		$comment: 'Generated by `npm run assets:manifest` (scripts/ci/assets-drift.mjs --write). Do not edit by hand; see assets/README.md.',
		source: BRANDS[brand].source,
		files
	};
	return JSON.stringify(manifest, null, '\t') + '\n';
}

function catalogueText(files) {
	const lines = Object.entries(files)
		.filter(([rel]) => rel.endsWith('.svg'))
		.map(([rel, f]) => `\t'${rel.replace(/\.svg$/, '')}': { cols: ${f.cols}, rows: ${f.rows} },`);
	return [
		'// Generated by `npm run assets:manifest` (scripts/ci/assets-drift.mjs --write) from',
		'// assets/code. Do not edit by hand: change the art, then regenerate.',
		'',
		'/** Size of a piece of pixel art in art pixels (the integer `viewBox` of its SVG). */',
		'export interface PixelGrid {',
		'\treadonly cols: number;',
		'\treadonly rows: number;',
		'}',
		'',
		'/** Every shipped Code SVG, keyed `<group>/<file>` (path under `assets/code/`, without `.svg`). */',
		'export const CODE_ART = {',
		...lines,
		'} as const satisfies Readonly<Record<string, PixelGrid>>;',
		'',
		'/** Path of a shipped Code SVG under `assets/code/`, without `.svg`, e.g. `mascots/axo`. */',
		'export type CodeArt = keyof typeof CODE_ART;',
		''
	].join('\n');
}

const problems = [];
const described = {};

// A brand folder without an entry in BRANDS would ship unchecked.
for (const entry of readdirSync(assetsDir, { withFileTypes: true }))
	if (entry.isDirectory() && !(entry.name in BRANDS))
		problems.push(`assets/${entry.name}: unknown brand (add it to BRANDS in scripts/ci/assets-drift.mjs)`);

for (const brand of Object.keys(BRANDS)) {
	if (!existsSync(join(assetsDir, brand))) {
		problems.push(`assets/${brand}: missing`);
		continue;
	}
	const { files, invalid } = describeBrand(brand);
	described[brand] = files;
	problems.push(...invalid);
}

if (write && problems.length > 0) {
	console.error(`Not written:\n  ${problems.join('\n  ')}`);
	process.exit(1);
} else if (write) {
	for (const [brand, files] of Object.entries(described))
		writeFileSync(join(assetsDir, brand, 'manifest.json'), manifestText(brand, files));
	writeFileSync(catalogueFile, catalogueText(described.code ?? {}));
	const counts = Object.entries(described).map(([b, f]) => `${b} ${Object.keys(f).length}`);
	console.log(`Wrote assets/*/manifest.json (${counts.join(', ')}) and ${relative(root, catalogueFile)}.`);
} else {
	// 1. Each tree against its manifest.
	for (const [brand, files] of Object.entries(described)) {
		const manifestFile = join(assetsDir, brand, 'manifest.json');
		let expected = {};
		try {
			expected = JSON.parse(readFileSync(manifestFile, 'utf8')).files ?? {};
		} catch (e) {
			problems.push(`cannot read ${relative(root, manifestFile)}: ${e.message}`);
		}
		for (const rel of Object.keys(expected))
			if (!(rel in files)) problems.push(`missing: ${brand}/${rel} (listed in the manifest, not in assets/${brand})`);
		for (const [rel, f] of Object.entries(files)) {
			const want = expected[rel];
			if (!want) problems.push(`extra: ${brand}/${rel} (in assets/${brand}, not in the manifest)`);
			else if (want.sha256 !== f.sha256 || want.bytes !== f.bytes)
				problems.push(
					`changed: ${brand}/${rel} (${f.bytes} bytes, sha256 ${f.sha256.slice(0, 12)}…; manifest: ${want.bytes} bytes, ${String(want.sha256).slice(0, 12)}…)`
				);
			else if (want.cols !== f.cols || want.rows !== f.rows || want.viewBox !== f.viewBox)
				problems.push(`changed ${BRANDS[brand].pixel ? 'grid' : 'viewBox'}: ${brand}/${rel}`);
		}
	}
	// 2. Catalogue (src/lib/components/code-art.ts) against the Code tree. Parsed loosely,
	// so a formatter may restyle the generated file without failing the check.
	const catalogue = existsSync(catalogueFile) ? readFileSync(catalogueFile, 'utf8') : '';
	const listed = new Map(
		[...catalogue.matchAll(/['"]([\w/-]+)['"]\s*:\s*\{\s*cols:\s*(\d+),\s*rows:\s*(\d+)\s*,?\s*\}/g)].map((m) => [
			m[1],
			{ cols: Number(m[2]), rows: Number(m[3]) }
		])
	);
	const svgs = Object.entries(described.code ?? {}).filter(([rel]) => rel.endsWith('.svg'));
	for (const [rel, f] of svgs) {
		const key = rel.replace(/\.svg$/, '');
		const got = listed.get(key);
		if (!got) problems.push(`catalogue: ${key} is missing in ${relative(root, catalogueFile)}`);
		else if (got.cols !== f.cols || got.rows !== f.rows)
			problems.push(`catalogue: ${key} is ${got.cols}x${got.rows}, the SVG is ${f.cols}x${f.rows}`);
	}
	const keys = new Set(svgs.map(([rel]) => rel.replace(/\.svg$/, '')));
	for (const key of listed.keys()) if (!keys.has(key)) problems.push(`catalogue: ${key} has no SVG`);
	// 2b. The mascot cast (#183): every mascots/* file has exactly one name in MASCOT_SOURCES
	// (src/lib/components/mascots.ts), and every name points at a file. A new animal without a name,
	// or a name without art, fails here instead of surfacing at runtime.
	const castFile = join(root, 'src', 'lib', 'components', 'mascots.ts');
	const cast = existsSync(castFile) ? readFileSync(castFile, 'utf8') : '';
	const named = [...cast.matchAll(/source\(\s*['"](mascots\/[\w-]+)['"]/g)].map((m) => m[1]);
	for (const key of keys)
		if (key.startsWith('mascots/') && !named.includes(key)) problems.push(`mascot cast: ${key} has no name in MASCOT_SOURCES`);
	for (const key of named) {
		if (!keys.has(key)) problems.push(`mascot cast: MASCOT_SOURCES names ${key}, which has no SVG`);
		if (named.indexOf(key) !== named.lastIndexOf(key)) problems.push(`mascot cast: ${key} is named twice in MASCOT_SOURCES`);
	}
}

// 3. Optional: Code art names and bytes against a stuffcloud prototypes folder (flat, *.svg).
if (against !== undefined) {
	const files = described.code ?? {};
	const dir = resolve(against);
	if (!existsSync(dir) || !statSync(dir).isDirectory()) {
		problems.push(`--against: ${dir} is not a directory`);
	} else {
		const theirs = new Map(
			readdirSync(dir)
				.filter((f) => f.endsWith('.svg'))
				.map((f) => [f, join(dir, f)])
		);
		const ours = new Map();
		for (const rel of Object.keys(files).filter((r) => r.endsWith('.svg'))) {
			const name = basename(rel);
			if (ours.has(name)) problems.push(`stuffcloud: ${name} exists twice in kern (${ours.get(name)}, ${rel})`);
			ours.set(name, rel);
		}
		for (const [name, path] of theirs) {
			const rel = ours.get(name);
			if (!rel) problems.push(`stuffcloud: ${name} is not shipped by kern (copy it into the right assets/code/<group>/)`);
			else if (sha256(readFileSync(path)) !== files[rel].sha256) problems.push(`stuffcloud: ${name} differs from kern's ${rel}`);
		}
		for (const [name, rel] of ours) if (!theirs.has(name)) problems.push(`stuffcloud: kern's ${rel} does not exist in ${dir}`);
		if (problems.length === 0) console.log(`Same ${theirs.size} SVG files (names and bytes) as ${dir}.`);
	}
}

if (problems.length > 0) {
	console.error(`Brand-art drift (${problems.length}):\n  ${problems.join('\n  ')}`);
	console.error(
		'If the art changed on purpose: update the files from their source, run `npm run assets:manifest`, commit (see assets/README.md).'
	);
	process.exit(1);
}
if (!write) {
	const counts = Object.entries(described).map(([b, f]) => `${b} ${Object.keys(f).length}`);
	console.log(`assets/* match their manifests, the Code catalogue and the SVG rules (${counts.join(', ')} files).`);
}
