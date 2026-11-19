// Source and drift check of the Code theme (#37).
//
// src/lib/themes/code.tokens.json is the one machine-readable source of the theme: every token with its
// value and, where the design has one, the place in stuffcloud's design it comes from (`from`).
// src/lib/themes/brands/code.css is generated from it. The design lives in the stuffcloud repository
// (docs/design/prototypes: stuff.css and the mockups; the app in web/apps/web/src) and in the claude.ai
// artifact "Stuffcloud - Designsystem" (light, paper, contrast). CI reaches neither, so
// scripts/ci/code-theme-snapshot.json records the design values the theme uses: the contract.
//
// Usage:
//   node scripts/ci/code-theme.mjs                     CI (`npm run tokens:check`): brands/code.css is current,
//                                                      every `from` agrees with the snapshot, every design
//                                                      root token is used or listed in `unused`
//   node scripts/ci/code-theme.mjs --write             regenerate brands/code.css (`npm run tokens:code`)
//   node scripts/ci/code-theme.mjs --against <dir>     also extract the values from a stuffcloud checkout and
//        [--design-system <tokens.json>]               fail on any difference to the snapshot (from kern, or
//                                                      from stuffcloud's CI with a kern checkout)
//   node scripts/ci/code-theme.mjs --refresh <dir>     rewrite the snapshot from a stuffcloud checkout (and the
//        [--design-system <tokens.json>]               artifact's project/tokens.json); then run the check
// Exit code 1 on drift, 2 on wrong arguments. docs/themes.md, "Code theme source", has the procedure.
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(import.meta.dirname, '../..');
export const SOURCE_FILE = join(root, 'src', 'lib', 'themes', 'code.tokens.json');
export const CSS_FILE = join(root, 'src', 'lib', 'themes', 'brands', 'code.css');
export const SNAPSHOT_FILE = join(root, 'scripts', 'ci', 'code-theme-snapshot.json');

/** The root rules whose every custom property the theme must use or list in `unused`. */
export const ROOT_SCOPES = ['design:stuff.css|:root', 'app:styles/theme.css|:root'];

const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

/** Splits on `sep` outside quotes and parentheses. */
function splitTop(text, sep) {
	const out = [];
	let quote = null;
	let depth = 0;
	let cur = '';
	for (const ch of text) {
		if (quote) {
			if (ch === quote) quote = null;
		} else if (ch === '"' || ch === "'") quote = ch;
		else if (ch === '(') depth++;
		else if (ch === ')') depth--;
		else if (ch === sep && depth === 0) {
			out.push(cur);
			cur = '';
			continue;
		}
		cur += ch;
	}
	out.push(cur);
	return out;
}

export const normSelector = (s) =>
	s
		.trim()
		.replace(/\s+/g, ' ')
		.replace(/\s*([,>+~])\s*/g, '$1');
export const normMedia = (m) => m.trim().replace(/\s+/g, '').toLowerCase();

/** Rules of a stylesheet (top level and one level of @media) as { media, selector, decls }. */
export function parseCss(text) {
	const css = stripComments(text);
	const rules = [];
	const walk = (body, media) => {
		let depth = 0;
		let start = 0;
		let open = -1;
		for (let i = 0; i < body.length; i++) {
			const ch = body[i];
			if (ch === '{') {
				if (depth === 0) open = i;
				depth++;
			} else if (ch === '}') {
				depth--;
				if (depth === 0) {
					const prelude = body.slice(start, open).trim();
					const inner = body.slice(open + 1, i);
					start = i + 1;
					if (prelude.startsWith('@media')) walk(inner, normMedia(prelude.slice(6)));
					else if (!prelude.startsWith('@')) {
						const decls = new Map();
						for (const part of splitTop(inner, ';')) {
							const idx = part.indexOf(':');
							if (idx < 0) continue;
							const prop = part.slice(0, idx).trim().toLowerCase();
							if (prop) decls.set(prop, part.slice(idx + 1).trim());
						}
						rules.push({ media, selector: normSelector(prelude), decls });
					}
				}
			}
		}
	};
	walk(css, null);
	return rules;
}

/**
 * A file's text, or `null` when it does not exist. One read, no separate existence check: the file
 * cannot change between a check and the read.
 */
export function readIfExists(path) {
	try {
		return readFileSync(path, 'utf8');
	} catch (e) {
		if (e && e.code === 'ENOENT') return null;
		throw e;
	}
}

/** The CSS in a file's text: a .svelte file's <style> block, anything else as is. */
function cssOf(path, text) {
	if (!path.endsWith('.svelte')) return text;
	const m = /<style[^>]*>([\s\S]*?)<\/style>/.exec(text);
	return m ? m[1] : '';
}

/** Normalised value for comparing: case, spaces, quotes and `.5` vs `0.5` do not count. */
export function norm(v) {
	if (v === null || typeof v === 'boolean') return v;
	return String(v)
		.trim()
		.toLowerCase()
		.replace(/"/g, "'")
		.replace(/\s+/g, ' ')
		.replace(/\s*([,()])\s*/g, '$1')
		.replace(/(^|[^\d.])\.(\d)/g, '$10.$2');
}

/**
 * Parses a reference: `design:<file>|[@media (…)|]<selector>{<prop>}` (a declaration),
 * `design:<file>#<text>` (a literal in that file), the same with `app:`, or `ds:<token>[@<theme>]`,
 * `ds:type/<style>{<field>}` (the design-system artifact).
 */
export function parseRef(ref) {
	let m = /^(design|app):([^|#]+)#([\s\S]+)$/.exec(ref);
	if (m) return { kind: 'literal', scope: m[1], file: m[2], text: m[3] };
	m = /^(design|app):([^|#]+)\|(?:@media ([^|]+)\|)?(.+)\{([\w-]+)\}$/.exec(ref);
	if (m) return { kind: 'decl', scope: m[1], file: m[2], media: m[3] ? normMedia(m[3]) : null, selector: normSelector(m[4]), prop: m[5] };
	m = /^ds:type\/([\w-]+)\{(\w+)\}$/.exec(ref);
	if (m) return { kind: 'ds-type', style: m[1], field: m[2] };
	m = /^ds:([\w.-]+)(?:@([\w-]+))?$/.exec(ref);
	if (m) return { kind: 'ds', name: m[1], theme: m[2] ?? null };
	throw new Error(`Unknown reference: ${ref}`);
}

/** Every token entry of the source as [block, name, entry] with entry an object. */
export function entries(src) {
	const out = [];
	for (const block of src.blocks)
		for (const [name, raw] of Object.entries(block.tokens)) out.push([block, name, typeof raw === 'string' ? { value: raw } : raw]);
	return out;
}

/** All references the source names (tokens and `unused`). */
export function referencedRefs(src) {
	const refs = new Set(Object.keys(src.unused ?? {}));
	for (const [, , e] of entries(src)) if (e.from) refs.add(e.from);
	return refs;
}

// ── extraction from a stuffcloud checkout ──────────────────────────────────────────────────────

function fileOf(stuffcloud, scope, file) {
	return scope === 'design' ? join(stuffcloud, 'docs', 'design', 'prototypes', file) : join(stuffcloud, 'web', 'apps', 'web', 'src', file);
}

/** Reads values for `refs` (and every root token) from a stuffcloud checkout and the artifact's tokens.json. */
export function extract(stuffcloud, refs, dsTokens) {
	const cache = new Map();
	const rulesOf = (scope, file) => {
		const key = `${scope}:${file}`;
		if (!cache.has(key)) {
			const path = fileOf(stuffcloud, scope, file);
			const text = readIfExists(path);
			cache.set(key, text === null ? null : { rules: parseCss(cssOf(path, text)), text });
		}
		return cache.get(key);
	};
	const values = {};
	const roots = {};
	for (const scopeRef of ROOT_SCOPES) {
		const { scope, file } = parseRef(`${scopeRef}{x}`);
		const got = rulesOf(scope, file);
		const names = [];
		for (const r of got?.rules ?? []) {
			if (r.media !== null || r.selector !== ':root') continue;
			for (const [prop, value] of r.decls) {
				if (!prop.startsWith('--')) continue;
				if (!names.includes(prop)) names.push(prop);
				values[`${scopeRef}{${prop}}`] = value.replace(/\s+/g, ' ');
			}
		}
		roots[scopeRef] = names;
	}
	for (const ref of refs) {
		const p = parseRef(ref);
		if (p.kind === 'literal') {
			const got = rulesOf(p.scope, p.file);
			values[ref] = got ? got.text.replace(/\r\n/g, '\n').includes(p.text) : false;
		} else if (p.kind === 'decl') {
			const got = rulesOf(p.scope, p.file);
			let value = null;
			for (const r of got?.rules ?? [])
				if (r.media === p.media && r.selector === p.selector && r.decls.has(p.prop)) value = r.decls.get(p.prop);
			values[ref] = value === null ? null : value.replace(/\s+/g, ' ');
		} else if (dsTokens) {
			values[ref] = dsValue(dsTokens, p);
		}
	}
	return { values, roots };
}

function dsValue(ds, p) {
	if (p.kind === 'ds-type') {
		for (const g of ds.type?.groups ?? [])
			for (const s of g.styles ?? []) if (s.name === p.style) return s[p.field] === undefined ? null : String(s[p.field]);
		return null;
	}
	for (const [family, body] of Object.entries(ds)) {
		if (family === 'type' || !body || !Array.isArray(body.tokens)) continue;
		const t = body.tokens.find((x) => x.name === p.name);
		if (!t) continue;
		if (typeof t.value === 'string') return t.value;
		const first = ds.color?.themes?.[0]?.id;
		return String(t.value[p.theme ?? first] ?? t.value[first] ?? '');
	}
	return null;
}

// ── generation ─────────────────────────────────────────────────────────────────────────────────

function selectorsOf(src, variants) {
	const names = [src.theme, ...src.aliases];
	if (variants === '*') return names.map((n) => `[data-theme^='${n}']`);
	return variants.flatMap((v) => names.map((n) => `[data-theme='${v ? `${n}-${v}` : n}']`));
}

/** brands/code.css as generated from the source. */
export function generateCss(src) {
	const lines = ['/* ' + src.header[0], ...src.header.slice(1).map((l) => (l ? ` * ${l}` : ' *')), ' */'];
	for (const block of src.blocks) {
		const indent = block.media ? '\t' : '';
		if (block.note) lines.push(`/* ${block.note} */`);
		if (block.media) lines.push(`@media ${block.media} {`);
		const sels = selectorsOf(src, block.variants);
		sels.forEach((s, i) => lines.push(`${indent}${s}${i === sels.length - 1 ? ' {' : ','}`));
		for (const [name, raw] of Object.entries(block.tokens)) {
			const e = typeof raw === 'string' ? { value: raw } : raw;
			if (e.note) lines.push(`${indent}\t/* ${e.note} */`);
			lines.push(`${indent}\t${name}: ${e.value};`);
		}
		lines.push(`${indent}}`);
		if (block.media) lines.push('}');
	}
	return lines.join('\n') + '\n';
}

// ── the check ──────────────────────────────────────────────────────────────────────────────────

/** Problems of the source against the snapshot (empty when they agree). */
export function checkSource(src, snapshot) {
	const problems = [];
	const values = snapshot.values ?? {};
	const used = referencedRefs(src);
	for (const [block, name, e] of entries(src)) {
		const where = `${name}${block.media ? ` @media ${block.media}` : ''} (${block.variants === '*' ? 'every variant' : block.variants.map((v) => v || 'code').join(', ')})`;
		if (!e.from) {
			if (name.startsWith('--') && !e.note) problems.push(`${where}: no \`from\` and no \`note\` saying where the value comes from`);
			continue;
		}
		let p;
		try {
			p = parseRef(e.from);
		} catch (err) {
			problems.push(`${where}: ${err.message}`);
			continue;
		}
		if (!(e.from in values)) {
			problems.push(`${where}: ${e.from} is not in the snapshot (refresh it, docs/themes.md)`);
			continue;
		}
		const got = values[e.from];
		if (p.kind === 'literal') {
			if (got !== true) problems.push(`${where}: the design no longer contains "${p.text}" (${p.file})`);
			continue;
		}
		const want = 'design' in e ? e.design : e.value;
		if (norm(want) !== norm(got))
			problems.push(`${where}: the design has ${JSON.stringify(got)} at ${e.from}, the source records ${JSON.stringify(want)}`);
	}
	for (const ref of Object.keys(src.unused ?? {})) if (!(ref in values)) problems.push(`unused: ${ref} is not in the snapshot`);
	for (const scope of ROOT_SCOPES)
		for (const prop of snapshot.roots?.[scope] ?? []) {
			const ref = `${scope}{${prop}}`;
			if (!used.has(ref)) problems.push(`${ref}: a design token the theme neither uses nor lists in \`unused\``);
		}
	return problems;
}

/** Differences between two snapshots' values and root lists, for --against. */
export function diffSnapshots(old, next, { skipDs }) {
	const out = [];
	for (const [ref, value] of Object.entries(old.values ?? {})) {
		if (skipDs && ref.startsWith('ds:')) continue;
		if (!(ref in next.values)) continue;
		if (norm(value) !== norm(next.values[ref]))
			out.push(`${ref}: snapshot ${JSON.stringify(value)}, now ${JSON.stringify(next.values[ref])}`);
	}
	for (const scope of ROOT_SCOPES) {
		const before = new Set(old.roots?.[scope] ?? []);
		for (const prop of next.roots[scope] ?? []) if (!before.has(prop)) out.push(`${scope}{${prop}}: new design token`);
		for (const prop of before) if (!(next.roots[scope] ?? []).includes(prop)) out.push(`${scope}{${prop}}: removed from the design`);
	}
	return out;
}

function stuffcloudMeta(dir) {
	const meta = {};
	try {
		meta.commit = execFileSync('git', ['-C', dir, 'rev-parse', 'HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
	} catch {
		meta.commit = null;
	}
	const pdf = join(dir, 'docs', 'design', 'pdf-source.sha256');
	meta.pdfSourceSha256 = readIfExists(pdf)?.trim() ?? null;
	return meta;
}

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

function main(args) {
	const flag = (name) => {
		const i = args.indexOf(name);
		if (i === -1) return undefined;
		const v = args[i + 1];
		if (v === undefined || v.startsWith('--')) {
			console.error(`${name} needs a path`);
			process.exit(2);
		}
		return resolve(v);
	};
	const src = JSON.parse(readFileSync(SOURCE_FILE, 'utf8'));
	const css = generateCss(src);
	if (args.includes('--write')) {
		writeFileSync(CSS_FILE, css);
		console.log(`Wrote ${relative(root, CSS_FILE)} from ${relative(root, SOURCE_FILE)}.`);
		return 0;
	}
	const refresh = flag('--refresh');
	const against = flag('--against');
	const dsFile = flag('--design-system');
	const dsBytes = dsFile ? readFileSync(dsFile) : undefined;
	const dsTokens = dsBytes ? JSON.parse(dsBytes.toString('utf8')) : undefined;
	const snapshotText = readIfExists(SNAPSHOT_FILE);
	const snapshot = snapshotText === null ? { values: {}, roots: {} } : JSON.parse(snapshotText);

	if (refresh) {
		const got = extract(refresh, referencedRefs(src), dsTokens);
		const values = {};
		for (const ref of [...new Set([...Object.keys(got.values), ...referencedRefs(src)])].sort()) {
			if (ref.startsWith('ds:') && !dsTokens) {
				if (ref in snapshot.values) values[ref] = snapshot.values[ref];
			} else if (ref in got.values) values[ref] = got.values[ref];
		}
		const next = {
			$comment:
				'Generated by `node scripts/ci/code-theme.mjs --refresh <stuffcloud> --design-system <tokens.json>`. Do not edit by hand; see docs/themes.md, "Code theme source".',
			stuffcloud: stuffcloudMeta(refresh),
			designSystem: dsTokens
				? { artifact: 'claude.ai artifact "Stuffcloud - Designsystem", project/tokens.json', sha256: sha256(dsBytes) }
				: (snapshot.designSystem ?? null),
			roots: got.roots,
			values
		};
		writeFileSync(SNAPSHOT_FILE, JSON.stringify(next, null, '\t') + '\n');
		console.log(`Wrote ${relative(root, SNAPSHOT_FILE)} (${Object.keys(values).length} values).`);
		return 0;
	}

	const problems = [];
	const current = (readIfExists(CSS_FILE) ?? '').replace(/\r\n/g, '\n');
	if (current !== css)
		problems.push(`${relative(root, CSS_FILE)} is not generated from ${relative(root, SOURCE_FILE)}: run \`npm run tokens:code\``);
	problems.push(...checkSource(src, snapshot));
	if (against) {
		const got = extract(against, Object.keys(snapshot.values ?? {}), dsTokens);
		const diff = diffSnapshots(snapshot, got, { skipDs: !dsTokens });
		problems.push(...diff.map((d) => `stuffcloud: ${d}`));
		const meta = stuffcloudMeta(against);
		if (diff.length === 0 && snapshot.stuffcloud?.pdfSourceSha256 && meta.pdfSourceSha256 !== snapshot.stuffcloud.pdfSourceSha256)
			console.log(
				`Note: docs/design changed since the snapshot (pdf-source.sha256 ${String(meta.pdfSourceSha256).slice(0, 12)}…), but no value the theme uses did.`
			);
	}
	if (problems.length > 0) {
		console.error(`Code theme drift (${problems.length}):\n  ${problems.join('\n  ')}`);
		console.error(
			'If the design changed on purpose: refresh the snapshot, update code.tokens.json, run `npm run tokens:code` (docs/themes.md).'
		);
		return 1;
	}
	const n = entries(src).filter(([, , e]) => e.from).length;
	console.log(
		`Code theme: brands/code.css is generated from code.tokens.json; ${n} values agree with the design snapshot${against ? ' and the stuffcloud checkout' : ''}.`
	);
	return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = main(process.argv.slice(2));
