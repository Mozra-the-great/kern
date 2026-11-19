// Fails when a published declaration file uses the type `any` (#22). Run after `npm run build`.
// Parses every .d.ts in dist/ and dist-elements/ with the TypeScript compiler, so comments and
// words like "any CSS length" do not count. One construct is allowed: svelte2tsx writes
// `z_$$bindings?: ReturnType<__sveltets_Render<any>['bindings']>` into every generic component; it
// names the bindable prop keys, not a prop type, and is not something the component source controls.
// Usage: node scripts/ci/no-any-dts.mjs
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import ts from 'typescript';

const root = resolve(import.meta.dirname, '../..');
const dirs = ['dist', 'dist-elements'].map((d) => join(root, d));

/** Every .d.ts file below `dir`. */
function declarations(dir) {
	return readdirSync(dir, { withFileTypes: true, recursive: true })
		.filter((e) => e.isFile() && e.name.endsWith('.d.ts'))
		.map((e) => join(e.parentPath, e.name));
}

/** True for the `any` inside svelte2tsx's `z_$$bindings` marker property. */
function isBindingsMarker(node) {
	for (let n = node.parent; n; n = n.parent) {
		if (ts.isPropertySignature(n)) return n.name.getText() === 'z_$$bindings';
	}
	return false;
}

const problems = [];
let files = 0;
for (const dir of dirs) {
	for (const file of declarations(dir)) {
		files++;
		const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
		const visit = (node) => {
			if (node.kind === ts.SyntaxKind.AnyKeyword && !isBindingsMarker(node)) {
				const { line, character } = source.getLineAndCharacterOfPosition(node.getStart(source));
				const text = source.text.split('\n')[line].trim();
				problems.push(`${relative(root, file).replaceAll('\\', '/')}:${line + 1}:${character + 1}  ${text}`);
			}
			ts.forEachChild(node, visit);
		};
		visit(source);
	}
}

if (files === 0) {
	console.error('No .d.ts files found. Run `npm run build` first.');
	process.exit(1);
}
if (problems.length) {
	console.error(`\`any\` in ${problems.length} place(s) of the published types:\n${problems.join('\n')}`);
	process.exit(1);
}
console.log(`No \`any\` in ${files} published declaration files.`);
