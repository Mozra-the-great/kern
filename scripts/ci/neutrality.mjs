// Instance-neutrality guard (#37): the themes, their token source and snapshot, and the packaged brand art
// carry no operator-specific values. kern is a general kit; stuffcloud (and any other app) is an instance
// that brings its own domain, names and contact data, never the kit. The theme texts (#185) are shipped words,
// so their two catalogue files are in scope too.
//
// Always checked (no configuration): e-mail addresses, URLs, domain names and IPv4 addresses in
// src/lib/themes/**, scripts/ci/code-theme-snapshot.json, assets/** and the theme texts (src/lib/components/theme-texts*.ts)
// (file contents and file names).
// Allowed: the SVG namespace (www.w3.org), claude.ai (where the design-system artifacts live, named in
// the asset manifests) and the names reserved for documentation (RFC 2606 / 6761: example.com/.org/.net,
// *.example, *.test, *.invalid, *.localhost).
//
// Also checked when set: KERN_FORBIDDEN_TERMS, a list of operator names, domains and addresses that must
// not appear (newlines, commas or semicolons between entries, `#` starts a comment). It cannot live in
// this public repository, so CI reads it from the Actions secret or variable of the same name; without
// it (forks, Dependabot) the generic check above still runs. Findings never print a listed term: a hit
// is `path:line: forbidden term (entry N)`.
//
// Usage: node scripts/ci/neutrality.mjs        exit 1 on a finding, 2 on a malformed list
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(import.meta.dirname, '../..');
export const SCOPE = [
	'src/lib/themes',
	'scripts/ci/code-theme-snapshot.json',
	'assets',
	'src/lib/components/theme-texts.ts',
	'src/lib/components/theme-texts-de.ts'
];

const ALLOWED_HOSTS = ['www.w3.org', 'w3.org', 'claude.ai'];
const RESERVED_DOMAINS = ['example.com', 'example.org', 'example.net'];
const RESERVED_TLDS = ['example', 'test', 'invalid', 'localhost'];
// Top-level domains common enough to catch a real host; file extensions (.css, .svg, .json, .html) are not among them.
const TLDS =
	'com|net|org|de|eu|io|dev|app|cloud|ai|co|me|info|biz|xyz|online|site|page|tech|host|space|uk|at|ch|nl|fr|it|es|pl|se|no|dk|fi|be|cz|us|ca|au|example|test|invalid|localhost';

const EMAIL = /[\w.+-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+/gi;
const URL_RE = /\b[a-z][a-z0-9+.-]*:\/\/([^\s"'<>)\]/]+)/gi;
const DOMAIN = new RegExp(`(?<![\\w.-])((?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+(?:${TLDS}))(?![\\w-])`, 'gi');
const IPV4 = /(?<![\d.])(?:25[0-5]|2[0-4]\d|1?\d?\d)(?:\.(?:25[0-5]|2[0-4]\d|1?\d?\d)){3}(?![\d.])/g;

/** Whether a host may appear: an allowed one or a name reserved for documentation. */
export function allowedHost(host) {
	const h = host.toLowerCase().replace(/:\d+$/, '').replace(/\.$/, '');
	if (ALLOWED_HOSTS.includes(h)) return true;
	const labels = h.split('.');
	if (RESERVED_TLDS.includes(labels.at(-1) ?? '')) return true;
	return RESERVED_DOMAINS.includes(labels.slice(-2).join('.'));
}

/** Reads KERN_FORBIDDEN_TERMS: the entries in order, or `null` for a malformed one. */
export function parseTerms(raw) {
	const items = [];
	for (const line of (raw ?? '').split(/\r?\n/)) items.push(...line.split('#')[0].split(/[,;]/));
	const terms = items.map((t) => t.trim()).filter(Boolean);
	return terms.every((t) => t.length >= 3) ? terms : null;
}

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Findings in one text (a file's content or its path): [line, message]. `svg` skips the IPv4 rule (path data). */
export function scanText(text, terms, { svg = false } = {}) {
	const out = [];
	const termRes = terms.map((t, i) => [i + 1, new RegExp(`(?<![\\w-])${escape(t)}(?![\\w-])`, 'i')]);
	text.split(/\r?\n/).forEach((line, idx) => {
		const n = idx + 1;
		for (const m of line.matchAll(EMAIL)) if (!allowedHost(m[0].split('@')[1])) out.push([n, 'an e-mail address']);
		for (const m of line.matchAll(URL_RE)) if (!allowedHost(m[1])) out.push([n, `a URL (${m[0].slice(0, 60)})`]);
		for (const m of line.replace(URL_RE, ' ').replace(EMAIL, ' ').matchAll(DOMAIN))
			if (!allowedHost(m[1])) out.push([n, `a domain name (${m[1]})`]);
		if (!svg) for (const m of line.matchAll(IPV4)) out.push([n, `an IPv4 address (${m[0]})`]);
		for (const [entry, re] of termRes) if (re.test(line)) out.push([n, `forbidden term (entry ${entry})`]);
	});
	return out;
}

function listFiles(path) {
	const abs = join(root, path);
	if (statSync(abs).isFile()) return [path];
	return readdirSync(abs, { withFileTypes: true }).flatMap((e) => listFiles(`${path}/${e.name}`));
}

function main() {
	const raw = process.env.KERN_FORBIDDEN_TERMS ?? '';
	const terms = parseTerms(raw);
	if (terms === null) {
		console.error('KERN_FORBIDDEN_TERMS has an entry shorter than 3 characters (malformed list).');
		return 2;
	}
	const findings = [];
	let files = 0;
	let hidden = 0;
	for (const path of SCOPE.flatMap(listFiles)) {
		files++;
		const nameHits = scanText(path, terms);
		const shown = nameHits.length > 0 ? `<file name hidden #${++hidden}>` : path;
		for (const [, msg] of nameHits) findings.push(`${shown}: the file name contains ${msg}`);
		const buf = readFileSync(join(root, path));
		if (buf.subarray(0, 8192).includes(0)) continue;
		for (const [line, msg] of scanText(buf.toString('utf8'), terms, { svg: path.endsWith('.svg') }))
			findings.push(`${shown}:${line}: ${msg}`);
	}
	if (findings.length > 0) {
		console.error(`Instance-neutrality guard (${findings.length}):\n  ${findings.join('\n  ')}`);
		console.error(
			'Themes, brand art and theme texts carry no operator-specific values (domains, names, e-mail, hostnames); see docs/themes.md.'
		);
		return 1;
	}
	const mode = terms.length > 0 ? `and ${terms.length} forbidden terms` : '(generic patterns only: KERN_FORBIDDEN_TERMS is not set)';
	console.log(`Instance-neutral: ${files} files in ${SCOPE.join(', ')} checked ${mode}.`);
	return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = main();
