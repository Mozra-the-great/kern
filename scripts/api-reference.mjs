// Generates the API reference of every component and custom element (#57): docs/api/reference.md.
//
// Sources (nothing is written by hand into the output):
// - Svelte components: the public exports of src/lib/index.ts; per component the `interface Props` of its
//   `<script lang="ts">` (members, types, JSDoc, `extends`), the defaults of the `$props()` destructuring
//   (`$bindable(…)` marks a bindable prop; `x ?? strings().a.b` names the catalogue text of a prop without a
//   literal default) and the `--k-<component>-*` custom properties its `<style>` reads;
// - data types: the interfaces and type aliases exported from a component script that
//   src/lib/index.ts re-exports, plus the interfaces they extend;
// - custom elements: custom-elements.json (itself generated from src/elements by elements-manifest.mjs and
//   checked in CI): attributes, properties, defaults, events with their `detail` type, slots, methods.
//
// The explanations that belong to the reference (how to read it, conventions) are hand-written in
// docs/api/README.md and never touched here.
//
// Usage: node scripts/api-reference.mjs           write docs/api/reference.md
//        node scripts/api-reference.mjs --check   exit 1 when the committed file is stale (CI, `npm run docs:check`)
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { parse } from 'svelte/compiler';
import ts from 'typescript';

const root = resolve(import.meta.dirname, '..');
const componentsDir = join(root, 'src/lib/components');
const outFile = join(root, 'docs/api/reference.md');
const check = process.argv.includes('--check');
const PKG = '@mozra-the-great/kern';
const errors = [];

// ── helpers ──────────────────────────────────────────────────────────────────
const kebab = (name) => name.replace(/(?<!^)[A-Z]/g, (c) => `-${c}`).toLowerCase();
const squash = (text) => text.replace(/\s+/g, ' ').trim();
/** A table cell of prose: one line, `|` escaped, `<` outside code spans escaped (GitHub would read it as HTML). */
function prose(text) {
	if (!text) return '';
	return squash(text)
		.split(/(`[^`]*`)/)
		.map((part, i) => (i % 2 === 1 ? part : part.replace(/</g, '&lt;')))
		.join('')
		.replace(/\|/g, '\\|');
}
/** A code span inside a table cell. */
function code(text) {
	if (text === undefined || text === '') return '';
	const t = squash(String(text)).replace(/\|/g, '\\|');
	return t.includes('`') ? `\`\` ${t} \`\`` : `\`${t}\``;
}
function table(head, rows) {
	if (rows.length === 0) return '';
	return (
		[`| ${head.join(' | ')} |`, `| ${head.map(() => '---').join(' | ')} |`, ...rows.map((r) => `| ${r.join(' | ')} |`)].join('\n') + '\n'
	);
}
const rel = (path) => `../../${path}`;

// ── Svelte sources ───────────────────────────────────────────────────────────
const indexSrc = readFileSync(join(root, 'src/lib/index.ts'), 'utf8');
const componentNames = [...indexSrc.matchAll(/export \{ default as (\w+) \} from '\.\/components\/(\w+)\.svelte'/g)].map(
	([, name, file]) => {
		if (name !== file) errors.push(`src/lib/index.ts: ${name} is exported from ${file}.svelte; the reference expects the same name`);
		return name;
	}
);
const exportedTypes = new Map(); // type name → component file
for (const [, list, file] of indexSrc.matchAll(/export type \{([^}]*)\} from '\.\/components\/(\w+)\.svelte'/g))
	for (const t of list
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean))
		exportedTypes.set(t, file);

const parsedFiles = new Map();
/** The instance and module scripts of a component as TypeScript source files. */
function scriptsOf(file) {
	const cached = parsedFiles.get(file);
	if (cached) return cached;
	const path = join(componentsDir, `${file}.svelte`);
	const source = readFileSync(path, 'utf8');
	const ast = parse(source, { modern: true });
	const toTs = (script, kind) =>
		script
			? ts.createSourceFile(`${file}.${kind}.ts`, source.slice(script.content.start, script.content.end), ts.ScriptTarget.Latest, true)
			: undefined;
	const style = ast.css ? source.slice(ast.css.content.start, ast.css.content.end) : '';
	const result = { source, instance: toTs(ast.instance, 'instance'), module: toTs(ast.module, 'module'), style };
	parsedFiles.set(file, result);
	return result;
}

function jsDocOf(node) {
	const docs = ts.getJSDocCommentsAndTags(node).filter((d) => d.kind === ts.SyntaxKind.JSDoc);
	return squash(docs.map((d) => ts.getTextOfJSDocComment(d.comment) ?? '').join(' '));
}

function memberRows(iface) {
	return iface.members.filter(ts.isPropertySignature).map((m) => ({
		name: m.name.getText(),
		optional: !!m.questionToken,
		type: m.type ? m.type.getText() : 'unknown',
		description: jsDocOf(m)
	}));
}

/** `interface Props` of a component, with defaults from the `$props()` destructuring. */
function propsOf(file) {
	const { instance } = scriptsOf(file);
	if (!instance) {
		errors.push(`${file}.svelte: no <script lang="ts">`);
		return undefined;
	}
	let iface;
	let destructure;
	const visit = (node) => {
		if (ts.isInterfaceDeclaration(node) && node.name.text === 'Props') iface = node;
		if (
			ts.isVariableDeclaration(node) &&
			node.initializer &&
			ts.isCallExpression(node.initializer) &&
			node.initializer.expression.getText() === '$props' &&
			ts.isObjectBindingPattern(node.name)
		)
			destructure = node.name;
		ts.forEachChild(node, visit);
	};
	visit(instance);
	if (!iface) {
		errors.push(`${file}.svelte: no \`interface Props\``);
		return undefined;
	}
	const defaults = new Map();
	const bindable = new Set();
	const locals = new Map(); // local variable → prop name
	for (const el of destructure?.elements ?? []) {
		if (el.dotDotDotToken) continue;
		const prop = (el.propertyName ?? el.name).getText();
		locals.set(el.name.getText(), prop);
		if (!el.initializer) continue;
		let init = el.initializer;
		if (ts.isCallExpression(init) && init.expression.getText() === '$bindable') {
			bindable.add(prop);
			init = init.arguments[0];
		}
		if (init) defaults.set(prop, init.getText());
	}
	// Catalogue texts: `labelProp ?? strings().section.label` in the script.
	const scriptText = instance.getFullText();
	for (const [local, prop] of locals) {
		if (defaults.has(prop)) continue;
		const m = new RegExp(`\\b${local}\\s*\\?\\?\\s*strings\\(\\)\\.([\\w.]+)`).exec(scriptText);
		if (m) defaults.set(prop, { catalogue: m[1] });
	}
	const members = memberRows(iface).map((m) => ({ ...m, default: defaults.get(m.name), bindable: bindable.has(m.name) }));
	// Inherited HTML attributes the component gives its own default (`type = 'button'`).
	for (const [prop, dflt] of defaults)
		if (!members.some((m) => m.name === prop))
			members.push({ name: prop, optional: true, type: '', inherited: true, description: '', default: dflt, bindable: bindable.has(prop) });
	const heritage = (iface.heritageClauses ?? []).flatMap((h) => h.types.map((t) => t.getText()));
	// Type parameters of a generic component: `<script lang="ts" generics="Row extends …">`.
	const generics = /<script\b[^>]*\bgenerics="([^"]*)"/.exec(scriptsOf(file).source)?.[1];
	return { members, heritage, generics: generics ? [generics] : [] };
}

const isSnippet = (m) => /\bSnippet\b/.test(m.type);
const isCallback = (m) => /^on[a-z]/.test(m.name) && /=>/.test(m.type);

/** Custom properties of the component's own namespace that its stylesheet reads. */
function ownTokens(file) {
	const prefix = `--k-${kebab(file)}-`;
	const found = new Set(
		[...scriptsOf(file).style.matchAll(/var\(\s*(--k-[a-z0-9-]+)/g)].map((m) => m[1]).filter((t) => t.startsWith(prefix))
	);
	return [...found].sort();
}

/** Exported data types of the component scripts (re-exported by index.ts) and the interfaces they extend. */
function dataTypes() {
	const declared = new Map(); // name → { file, node }
	for (const file of new Set([...exportedTypes.values(), ...componentNames, 'TabBadge'])) {
		const { module, instance } = scriptsOf(file);
		for (const st of [...(module?.statements ?? []), ...(instance?.statements ?? [])])
			if (
				(ts.isInterfaceDeclaration(st) || ts.isTypeAliasDeclaration(st)) &&
				st.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
			)
				declared.set(st.name.text, { path: `src/lib/components/${file}.svelte`, node: st });
	}
	const wanted = [...exportedTypes.keys()];
	for (const name of wanted)
		if (!declared.has(name))
			errors.push(`src/lib/index.ts: type ${name} is not declared in the module script of ${exportedTypes.get(name)}.svelte`);
	const out = new Map();
	const add = (name) => {
		const d = declared.get(name);
		if (!d || out.has(name)) return;
		out.set(name, d);
		if (ts.isInterfaceDeclaration(d.node))
			for (const h of d.node.heritageClauses ?? []) for (const t of h.types) add(t.expression.getText());
	};
	wanted.forEach(add);
	return [...out].sort(([a], [b]) => a.localeCompare(b));
}

// ── custom elements ──────────────────────────────────────────────────────────
const manifest = JSON.parse(readFileSync(join(root, 'custom-elements.json'), 'utf8'));
const elements = new Map();
for (const mod of manifest.modules)
	for (const d of mod.declarations ?? [])
		if (d.customElement)
			elements.set(d.tagName, { ...d, module: mod.path, entry: mod.path.replace(/^dist-elements\/elements\/(.*)\.js$/, '$1') });
const FORM_MEMBERS = new Set([
	'form',
	'validity',
	'validationMessage',
	'willValidate',
	'checkValidity',
	'reportValidity',
	'setCustomValidity'
]);

// ── rendering ────────────────────────────────────────────────────────────────
function renderDefault(d) {
	if (d === undefined) return '';
	if (typeof d === 'object') return `Katalog ${code(d.catalogue)}`;
	return code(d);
}

function renderComponent(name) {
	const tag = `k-${kebab(name)}`;
	const el = elements.get(tag);
	const props = propsOf(name);
	let md = `## ${name}\n\n`;
	const where = [`Svelte: \`import { ${name} } from '${PKG}'\``];
	if (el) where.push(`Element: \`<${tag}>\` aus \`${PKG}/elements/${el.entry}\``);
	else where.push('kein Custom Element');
	md += `${where.join(' · ')}\n\n`;
	md += `Quelle: [\`${name}.svelte\`](${rel(`src/lib/components/${name}.svelte`)})`;
	if (el) md += `, [\`K${name}.svelte\`](${rel(`src/elements/K${name}.svelte`)})`;
	md += '\n\n';
	if (el?.description) md += `${prose(el.description).replace(/\\\|/g, '|')}\n\n`;

	if (props) {
		const plain = props.members.filter((m) => !isSnippet(m) && !isCallback(m));
		const callbacks = props.members.filter(isCallback);
		const snippets = props.members.filter(isSnippet);
		md += `### Svelte: Props\n\n`;
		if (props.generics.length) md += `Generisch über ${props.generics.map(code).join(', ')}.\n\n`;
		md += table(
			['Prop', 'Typ', 'Vorgabe', 'Beschreibung'],
			plain.map((m) => [
				`${code(m.name)}${m.optional ? '' : ' (Pflicht)'}${m.bindable ? ' (`bind:`)' : ''}`,
				m.inherited ? 'geerbt' : code(m.type.replace(/\s*\|\s*undefined$/, '')),
				renderDefault(m.default),
				prose(m.description)
			])
		);
		if (plain.length === 0) md += 'Keine eigenen Props.\n';
		if (props.heritage.length) md += `\nWeitere Attribute aus ${props.heritage.map(code).join(', ')} gehen an das Wurzelelement.\n`;
		md += '\n';
		if (callbacks.length) {
			md += `### Svelte: Callbacks\n\n`;
			md += table(
				['Prop', 'Typ', 'Beschreibung'],
				callbacks.map((m) => [code(m.name), code(m.type.replace(/^\((.*)\)\s*\|\s*undefined$/, '$1')), prose(m.description)])
			);
			md += '\n';
		}
		if (snippets.length) {
			md += `### Svelte: Snippets\n\n`;
			md += table(
				['Snippet', 'Typ', 'Beschreibung'],
				snippets.map((m) => [
					`${code(m.name)}${m.optional ? '' : ' (Pflicht)'}`,
					code(m.type.replace(/\s*\|\s*undefined$/, '')),
					prose(m.description)
				])
			);
			md += '\n';
		}
	}

	if (el) {
		const svelteDefaults = new Map((props?.members ?? []).map((m) => [m.name, m]));
		const fields = (el.members ?? []).filter((m) => m.kind === 'field');
		const attrFields = fields.filter((f) => f.attribute !== undefined);
		const extraFields = fields.filter((f) => f.attribute === undefined && !FORM_MEMBERS.has(f.name));
		const methods = (el.members ?? []).filter((m) => m.kind === 'method' && !FORM_MEMBERS.has(m.name));
		const native = (el.attributes ?? []).filter((a) => a.fieldName === undefined && a.name !== 'form' && a.name !== 'autofocus');
		const formAssociated = fields.some((f) => f.name === 'validity');
		md += `### Element: Attribute und Properties\n\n`;
		md += table(
			['Attribut', 'Property', 'Typ', 'Vorgabe', 'Beschreibung'],
			attrFields.map((f) => {
				const attr = (el.attributes ?? []).find((a) => a.fieldName === f.name);
				const sv = svelteDefaults.get(f.name);
				let dflt = f.default !== undefined ? code(f.default) : '';
				if (!dflt && sv?.default !== undefined) dflt = `${renderDefault(sv.default)} (wie ${name})`;
				const json = attr?.type?.text.endsWith('(JSON)') ? ' (JSON)' : '';
				return [
					`${code(f.attribute)}${json}`,
					`${code(f.name)}${f.reflects ? ' (gespiegelt)' : ''}`,
					code(f.type.text.replace(/\s*\|\s*undefined$/, '')),
					dflt,
					prose(f.description ?? sv?.description ?? '')
				];
			})
		);
		if (attrFields.length === 0) md += 'Keine eigenen Attribute.\n';
		if (extraFields.length || methods.length) {
			md += `\nNur als Property oder Methode:\n\n`;
			md += table(
				['Name', 'Typ', 'Beschreibung'],
				[
					...extraFields.map((f) => [`${code(f.name)}${f.readonly ? ' (nur lesen)' : ''}`, code(f.type.text), prose(f.description)]),
					...methods.map((m) => [code(`${m.name}()`), code(m.return?.type?.text ?? 'void'), prose(m.description)])
				]
			);
		}
		if (native.length) md += `\nWeitergereichte native Attribute (ans innere Feld): ${native.map((a) => code(a.name)).join(', ')}.\n`;
		if (formAssociated)
			md += `\nFormular-assoziiert (\`ElementInternals\`), wie ein natives Feld: \`form\`, \`validity\`, \`validationMessage\`, \`willValidate\`, \`checkValidity()\`, \`reportValidity()\`, \`setCustomValidity()\` und die Attribute \`form\` (Id des Formulars) und \`autofocus\`.\n`;
		md += '\n';
		md += `### Element: Ereignisse\n\n`;
		md +=
			(el.events ?? []).length > 0
				? table(
						['Ereignis', '`detail`', 'Beschreibung'],
						el.events.map((e) => [code(e.name), code(e.type.text.replace(/^CustomEvent<([\s\S]*)>$/, '$1')), prose(e.description)])
					)
				: 'Keine eigenen Ereignisse.\n';
		md += '\n';
		md += `### Element: Slots\n\n`;
		md +=
			(el.slots ?? []).length > 0
				? table(
						['Slot', 'Beschreibung'],
						el.slots.map((s) => [s.name === '' ? '(Standard)' : code(s.name), prose(s.description)])
					)
				: 'Keine Slots.\n';
		md += '\n';
	}

	const tokens = ownTokens(name);
	if (tokens.length) md += `### Eigene CSS-Variablen\n\n${tokens.map(code).join(', ')}\n\n`;
	return md;
}

/** Exported interfaces and type aliases of src/elements/types.ts that the manifest refers to (and what they extend). */
function elementTypes() {
	const path = 'src/elements/types.ts';
	const sf = ts.createSourceFile(path, readFileSync(join(root, path), 'utf8'), ts.ScriptTarget.Latest, true);
	const declared = new Map();
	for (const st of sf.statements)
		if (
			(ts.isInterfaceDeclaration(st) || ts.isTypeAliasDeclaration(st)) &&
			st.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
		)
			declared.set(st.name.text, { path, node: st });
	const texts = [];
	for (const el of elements.values()) {
		for (const m of el.members ?? []) if (m.type) texts.push(m.type.text);
		for (const e of el.events ?? []) texts.push(e.type.text);
	}
	const out = new Map();
	const add = (name) => {
		const d = declared.get(name);
		if (!d || out.has(name)) return;
		out.set(name, d);
		if (ts.isInterfaceDeclaration(d.node))
			for (const h of d.node.heritageClauses ?? []) for (const t of h.types) add(t.expression.getText());
	};
	for (const t of texts) for (const [id] of t.matchAll(/\b[A-Z]\w*\b/g)) add(id);
	return [...out].sort(([a], [b]) => a.localeCompare(b));
}

/** One section of data types; `suffix` keeps the headings (and so the anchors) unique across sections. */
function renderTypes(title, intro, types, suffix) {
	const anchor = (n) => `#${n.toLowerCase()}${suffix ? `-${suffix.toLowerCase()}` : ''}`;
	let md = `## ${title}\n\n${intro}\n\n`;
	for (const [name, { path, node }] of types) {
		md += `### ${name}${suffix ? ` (${suffix})` : ''}\n\n`;
		md += `Aus [${code(path.split('/').pop())}](${rel(path)})`;
		const doc = jsDocOf(node);
		md += doc ? `: ${prose(doc).replace(/\\\|/g, '|')}\n\n` : '.\n\n';
		if (ts.isInterfaceDeclaration(node)) {
			const params = node.typeParameters?.map((p) => p.getText()) ?? [];
			if (params.length) md += `Generisch über ${params.map(code).join(', ')}.\n\n`;
			const ext = (node.heritageClauses ?? []).flatMap((h) => h.types.map((t) => t.getText()));
			if (ext.length)
				md += `Erweitert ${ext.map((e) => (types.some(([n]) => n === e) ? `[${code(e)}](${anchor(e)})` : code(e))).join(', ')}.\n\n`;
			const rows = memberRows(node);
			md += table(
				['Feld', 'Typ', 'Beschreibung'],
				rows.map((m) => [
					`${code(m.name)}${m.optional ? '' : ' (Pflicht)'}`,
					code(m.type.replace(/\s*\|\s*undefined$/, '')),
					prose(m.description)
				])
			);
		} else {
			md += '```ts\n' + node.getText().replace(/^export /, '') + '\n```\n';
		}
		md += '\n';
	}
	return md;
}

// ── document ─────────────────────────────────────────────────────────────────
const names = [...componentNames].sort((a, b) => a.localeCompare(b));
for (const tag of elements.keys()) {
	const pascal = tag.replace(/^k-/, '').replace(/(^|-)([a-z])/g, (_, __, c) => c.toUpperCase());
	if (!componentNames.includes(pascal)) errors.push(`custom-elements.json: <${tag}> has no Svelte component ${pascal} in src/lib/index.ts`);
}
const sections = names.map(renderComponent);
const types = dataTypes();
const elTypes = elementTypes();

let doc = `<!-- Generated by scripts/api-reference.mjs from src/lib/components/*.svelte and custom-elements.json. Do not edit: run \`npm run docs:api\`. CI fails when this file is stale (\`npm run docs:check\`). -->

# API-Referenz

Props, Callbacks und Snippets jeder Svelte-Komponente, Attribute, Properties, Ereignisse und Slots jedes Custom
Elements, erzeugt aus den Quellen. Wie man die Tabellen liest (Attribut oder Property, JSON-Attribute, Ereignisse nur
bei Nutzereingaben, Katalogtexte), steht in [\`docs/api/README.md\`](README.md). Die Beschreibungen stammen aus den
Quelltext-Kommentaren und sind deshalb englisch.

${names.length} Komponenten, ${elements.size} Custom Elements, ${types.length} Datentypen der Svelte-Komponenten und ${elTypes.length} der
Elemente.

${names.map((n) => `[${n}](#${n.toLowerCase()})`).join(' · ')} · [Datentypen (Svelte)](#datentypen-svelte) · [Datentypen (Elemente)](#datentypen-elemente)

${sections.join('')}${renderTypes(
	'Datentypen (Svelte)',
	`Exportiert aus \`${PKG}\` (\`import type { … }\`), so wie die Props sie nennen.`,
	types,
	''
)}${renderTypes(
	'Datentypen (Elemente)',
	`Exportiert aus \`${PKG}/elements\` (\`import type { … }\`), so wie die Properties und \`detail\` der Elemente sie nennen. Listen und Objekte gehen als Property oder als JSON-Attribut.`,
	elTypes,
	'Element'
)}`;
doc = doc.replace(/\n{3,}/g, '\n\n').replace(/\s*$/, '\n');

if (errors.length) {
	for (const e of errors) console.error(`api-reference: ${e}`);
	process.exit(1);
}
if (check) {
	const current = existsSync(outFile) ? readFileSync(outFile, 'utf8').replace(/\r\n/g, '\n') : '';
	if (current !== doc) {
		console.error('api-reference: docs/api/reference.md is stale. Run `npm run docs:api` and commit the result.');
		process.exit(1);
	}
	console.log(`docs/api/reference.md is up to date (${names.length} components, ${elements.size} elements).`);
} else {
	mkdirSync(dirname(outFile), { recursive: true });
	writeFileSync(outFile, doc);
	console.log(
		`docs/api/reference.md: ${names.length} components, ${elements.size} elements, ${types.length} + ${elTypes.length} data types`
	);
}
