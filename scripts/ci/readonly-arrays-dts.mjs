// Fails when a published declaration file types a list property as a mutable array (#142). A consumer
// that keeps its data `readonly` (or `as const`) cannot pass it to `X[]`, so every array a component or
// element only reads must be `readonly X[]`: the list props, and the array fields of exported item
// types (`Command.keywords`, `TreeNode.children`). Run after `npm run build`.
//
// Checked: every property of an interface, type literal or class in dist/ and dist-elements/, including
// arrays inside unions, parentheses and type arguments (`string | string[]`, `(string | Swatch)[]`).
// Not checked: function types (callback parameters and return values such as `onchange: (v: string[]) => void`
// hand the consumer a fresh array; mutable is right there).
//
// Bindable outputs stay mutable on purpose, because a consumer may mutate the array it binds or gets back.
// They are listed in OUTPUTS below. A new array property that is not in the list fails, and so does a stale entry.
// Usage: node scripts/ci/readonly-arrays-dts.mjs
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import ts from 'typescript';

const root = resolve(import.meta.dirname, '../..');
const dirs = ['dist', 'dist-elements'].map((d) => join(root, d));

/**
 * Array properties that are outputs or two-way values (a `bind:` target, or a list the component hands
 * back), as `<file>#<owner>.<property>`. `<file>` is relative to the repository root, `<owner>` the
 * interface or type that declares the property (`Props` for a component's props).
 */
const OUTPUTS = new Set([
	// Bindable props of the components.
	'dist/components/DataTable.svelte.d.ts#Props.selected',
	'dist/components/FileDrop.svelte.d.ts#Props.files',
	'dist/components/Resizable.svelte.d.ts#Props.sizes',
	'dist/components/TagInput.svelte.d.ts#Props.value',
	'dist/components/TreeView.svelte.d.ts#Props.expanded',
	// The same values on the custom elements: attribute/property typings (`K<Name>Props`) and the element itself.
	'dist-elements/kern-elements.d.ts#KDataTableProps.selected',
	'dist-elements/kern-elements.d.ts#KDataTableElement.selected',
	'dist-elements/kern-elements.d.ts#KFileDropElement.files',
	'dist-elements/kern-elements.d.ts#KResizableProps.sizes',
	'dist-elements/kern-elements.d.ts#KResizableElement.sizes',
	'dist-elements/kern-elements.d.ts#KTagInputProps.value',
	'dist-elements/kern-elements.d.ts#KTagInputElement.value',
	'dist-elements/kern-elements.d.ts#KTreeViewProps.expanded',
	'dist-elements/kern-elements.d.ts#KTreeViewElement.expanded',
	// Result of the exported splitFiles(), handed to the caller.
	'dist/components/accept.d.ts#SplitFiles.accepted',
	'dist/components/accept.d.ts#SplitFiles.rejected'
]);

/** Every .d.ts file below `dir`. */
function declarations(dir) {
	return readdirSync(dir, { withFileTypes: true, recursive: true })
		.filter((e) => e.isFile() && e.name.endsWith('.d.ts'))
		.map((e) => join(e.parentPath, e.name));
}

/** True for `X[]`, `Array<X>` and `Array<...>` written as a type reference (not `ReadonlyArray`, not `readonly X[]`). */
function isMutableArray(node) {
	if (ts.isArrayTypeNode(node)) return true;
	return ts.isTypeReferenceNode(node) && ts.isIdentifier(node.typeName) && node.typeName.text === 'Array';
}

/**
 * Mutable array types inside `node`. Not entered: function types (callback signatures), the detail of a
 * `CustomEvent<...>` (an event hands the consumer a fresh array), and nested object types (their members
 * are properties of their own, visited separately).
 */
function mutableArrays(node, found = []) {
	if (ts.isFunctionTypeNode(node) || ts.isConstructorTypeNode(node) || ts.isTypeLiteralNode(node) || ts.isMappedTypeNode(node)) return found;
	if (ts.isTypeReferenceNode(node) && ts.isIdentifier(node.typeName) && node.typeName.text === 'CustomEvent') return found;
	if (isMutableArray(node)) found.push(node);
	// `readonly X[]` is a TypeOperator around an ArrayType; its element type is still checked.
	ts.forEachChild(node, (child) => {
		mutableArrays(child, found); // no return value: a truthy one would stop forEachChild after the first child
	});
	return found;
}

/** Name of the interface, type alias or class a property belongs to; a generic component declares its props in `$$render()`, which counts as `Props`. */
function ownerOf(node) {
	for (let n = node.parent; n; n = n.parent) {
		if (ts.isFunctionDeclaration(n) && n.name?.text === '$$render') return 'Props';
		if ((ts.isInterfaceDeclaration(n) || ts.isTypeAliasDeclaration(n) || ts.isClassDeclaration(n)) && n.name) return n.name.text;
	}
	return '(anonymous)';
}

const problems = [];
const used = new Set();
let files = 0;
for (const dir of dirs) {
	for (const file of declarations(dir)) {
		files++;
		const path = relative(root, file).replaceAll('\\', '/');
		const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
		const visit = (node) => {
			if ((ts.isPropertySignature(node) || ts.isPropertyDeclaration(node)) && node.type) {
				const key = `${path}#${ownerOf(node)}.${node.name.getText(source)}`;
				const arrays = mutableArrays(node.type).filter((a) => !ts.isTypeOperatorNode(a.parent) || a.parent.operator !== ts.SyntaxKind.ReadonlyKeyword);
				if (arrays.length > 0) {
					if (OUTPUTS.has(key)) used.add(key);
					else {
						const { line } = source.getLineAndCharacterOfPosition(node.getStart(source));
						problems.push(`${path}:${line + 1}  ${node.getText(source).split('\n')[0].trim()}`);
					}
				}
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
const stale = [...OUTPUTS.keys()].filter((k) => !used.has(k));
if (stale.length) {
	console.error(`Entries of OUTPUTS in scripts/ci/readonly-arrays-dts.mjs that no longer match a mutable array property:\n${stale.join('\n')}`);
	process.exit(1);
}
if (problems.length) {
	console.error(
		`Mutable array type in ${problems.length} property(ies) of the published types. Input-only lists must be \`readonly X[]\`,\n` +
			`so a consumer's readonly or \`as const\` data is accepted (#142). A bindable output may stay mutable: add it to OUTPUTS.\n${problems.join('\n')}`
	);
	process.exit(1);
}
console.log(`No mutable input array in ${files} published declaration files (${OUTPUTS.size} outputs allowed).`);
