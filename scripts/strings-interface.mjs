// Writes the `KernStrings` interface of the elements typings (dist-elements/kern-elements.d.ts) from
// the English catalogue in src/lib/components/strings.ts. The catalogue is a plain object literal
// (no TypeScript syntax), so it can be read without compiling the file; the interface can then not
// drift from the components' defaults. Used by scripts/elements-manifest.mjs.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const OPEN = 'const catalogue = {';

/** The catalogue object of strings.ts. */
export function readCatalogue(root) {
	const source = readFileSync(join(root, 'src/lib/components/strings.ts'), 'utf8');
	const start = source.indexOf(OPEN);
	const end = source.indexOf('\n};\n', start);
	if (start === -1 || end === -1) throw new Error('strings-interface: cannot find `const catalogue = {…};` in strings.ts');
	return new Function(`return (${source.slice(start + 'const catalogue = '.length, end + 2)});`)();
}

const quote = (n) => (/^[A-Za-z_$][\w$]*$/.test(n) ? n : `'${n}'`);

function render(obj, indent) {
	return Object.entries(obj)
		.map(([key, value]) =>
			typeof value === 'string'
				? `${indent}${quote(key)}: string;\n`
				: `${indent}${quote(key)}: {\n${render(value, indent + '\t')}${indent}};\n`
		)
		.join('');
}

/** `export interface KernStrings { … }` with a doc comment, ending in a newline. */
export function stringsInterface(root) {
	return (
		'/** The default text of every component, by component and name. Placeholders such as `{count}` are replaced by the component. */\n' +
		`export interface KernStrings {\n${render(readCatalogue(root), '\t')}}\n`
	);
}
