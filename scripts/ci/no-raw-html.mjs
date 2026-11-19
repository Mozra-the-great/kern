// Fails when kern's source can turn a string into markup (#59): `{@html …}` in a Svelte template, or a
// DOM API that parses HTML (`innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`,
// `createContextualFragment`, `srcdoc`). The kit renders text as text nodes and never takes markup
// from a prop, so a consumer can pass untrusted text without a sanitizer. Comments count too: a
// match in a comment is a reason to reword it, which keeps the rule free of exceptions.
//
// Usage: node scripts/ci/no-raw-html.mjs [dir …]   (default: src/lib and src/elements)
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '../..');
const EXTENSIONS = /\.(svelte|ts|js|mjs|cjs|tsx|jsx|html)$/;

/** What is forbidden, with the name shown in the report. */
export const FORBIDDEN = [
	{ name: '{@html}', pattern: /\{@html\b/ },
	{ name: 'innerHTML', pattern: /\binnerHTML\b/ },
	{ name: 'outerHTML', pattern: /\bouterHTML\b/ },
	{ name: 'insertAdjacentHTML', pattern: /\binsertAdjacentHTML\b/ },
	{ name: 'document.write', pattern: /\bdocument\s*\.\s*write(?:ln)?\s*\(/ },
	{ name: 'createContextualFragment', pattern: /\bcreateContextualFragment\b/ },
	{ name: 'srcdoc', pattern: /\bsrcdoc\b/ },
	{ name: 'dangerouslySetInnerHTML', pattern: /\bdangerouslySetInnerHTML\b/ }
];

function* files(dir) {
	for (const entry of readdirSync(dir)) {
		const path = join(dir, entry);
		if (statSync(path).isDirectory()) yield* files(path);
		else if (EXTENSIONS.test(entry)) yield path;
	}
}

/** Every forbidden use under `dirs`: `{ file, line, name, text }`, file relative to `base`. */
export function findRawHtml(dirs, base = root) {
	const found = [];
	for (const dir of dirs) {
		for (const file of files(dir)) {
			readFileSync(file, 'utf8')
				.split('\n')
				.forEach((text, i) => {
					for (const { name, pattern } of FORBIDDEN) {
						if (pattern.test(text)) found.push({ file: relative(base, file).replaceAll('\\', '/'), line: i + 1, name, text: text.trim() });
					}
				});
		}
	}
	return found;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
	const dirs = process.argv.slice(2).length
		? process.argv.slice(2).map((d) => resolve(d))
		: [join(root, 'src/lib'), join(root, 'src/elements')];
	const found = findRawHtml(dirs);
	if (found.length) {
		console.error('kern renders text as text: markup from strings is not allowed in the library (#59).\n');
		for (const f of found) console.error(`  ${f.file}:${f.line}  ${f.name}  ${f.text}`);
		console.error('\nRender nodes instead (see Prose and parseProse), or reword the comment.');
		process.exit(1);
	}
	console.log(`no-raw-html: no {@html} or HTML-parsing DOM API in ${dirs.map((d) => relative(root, d) || '.').join(', ')}`);
}
