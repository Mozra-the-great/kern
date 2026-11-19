// Generates the API description of the custom elements (#32) from the wrappers in src/elements:
//   custom-elements.json             Custom Elements Manifest 2.1 (committed; CI checks it is current)
//   dist-elements/kern-elements.d.ts tag map, element interfaces, event maps, window.kern
//   dist-elements/react.d.ts (+ .js) React 19 JSX augmentation (opt-in import)
//   dist-elements/elements/*.d.ts    types of the per-element entry points
//
// Sources, per wrapper K<Name>.svelte:
// - tag: from the file name (KDatePicker → k-date-picker), like vite.elements.config.ts;
// - props, attribute names, reflection: `<svelte:options customElement={{ props }}>`;
// - defaults: the `$props()` destructuring;
// - events: every `emit(host, '<name>', …)`; each must have an `@event <name> {Type} text` tag;
// - prop types beyond String/Number/Boolean: `@prop <name> {Type}` (types from src/elements/types.ts);
// - slots: the `<slot>`s of the template, or `@slot <name|-> text` tags when present;
// - description: the text before the first tag of the first doc comment in the script;
// - forwarded native attributes: `forwardAttributes(host, LIST)` with LIST from src/elements/native.ts.
//
// Usage: node scripts/elements-manifest.mjs           (manifest + typings; typings need dist-elements/)
//        node scripts/elements-manifest.mjs --manifest (manifest only)
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parse } from 'svelte/compiler';
import { stringsInterface } from './strings-interface.mjs';

const root = resolve(import.meta.dirname, '..');
const src = join(root, 'src/elements');
const out = join(root, 'dist-elements');
const manifestOnly = process.argv.includes('--manifest');
const errors = [];

const nameOf = (file) =>
	file
		.replace(/\.svelte$/, '')
		.replace(/^K/, '')
		.replace(/(?<!^)[A-Z]/g, (c) => `-${c}`)
		.toLowerCase();
const pascal = (name) => name.replace(/(^|-)([a-z])/g, (_, __, c) => c.toUpperCase());

// ── native attribute lists ───────────────────────────────────────────────────
const nativeSrc = readFileSync(join(src, 'native.ts'), 'utf8');
const nativeLists = Object.fromEntries(
	[...nativeSrc.matchAll(/export const ([A-Z_]+) = \[([^\]]*)\]/g)].map(([, n, body]) => [
		n,
		[...body.matchAll(/'([a-z-]+)'/g)].map((m) => m[1])
	])
);
const booleanAttrs = new Set(nativeLists.BOOLEAN_ATTRS ?? []);
const NATIVE_DOC = {
	maxlength: 'Maximum length in characters.',
	minlength: 'Minimum length in characters.',
	pattern: 'Regular expression the value must match.',
	readonly: 'Not editable; also exempt from validation.',
	required: 'Must be on to submit the form.',
	autocomplete: 'Autofill hint, as on the native control.',
	autocapitalize: 'Virtual keyboard capitalisation.',
	spellcheck: 'Spell checking ("true"/"false").',
	enterkeyhint: 'Label of the Enter key on virtual keyboards.',
	min: 'Smallest allowed value (number, date … as the type expects).',
	max: 'Largest allowed value.',
	step: 'Granularity of the value.',
	size: 'Visible width in characters (input) or visible rows (select).',
	multiple: 'Several comma-separated values (type="email").',
	cols: 'Visible width in characters.',
	wrap: 'Wrapping: soft or hard.',
	title: 'Advisory text (tooltip and accessible description).',
	'aria-label': 'Accessible name when there is no visible label.',
	'aria-description': 'Accessible description.'
};
const nativeType = (a) =>
	booleanAttrs.has(a)
		? 'boolean'
		: ['maxlength', 'minlength', 'size', 'cols'].includes(a)
			? 'number | string'
			: ['min', 'max', 'step'].includes(a)
				? 'number | string'
				: 'string';

// ── doc comment tags ─────────────────────────────────────────────────────────
/** Reads `{…}` with nested braces starting at s[i] === '{'. */
function braced(s, i) {
	let depth = 0;
	for (let j = i; j < s.length; j++) {
		if (s[j] === '{') depth++;
		else if (s[j] === '}' && --depth === 0) return [s.slice(i + 1, j).trim(), j + 1];
	}
	throw new Error(`Unbalanced braces in: ${s}`);
}
function docTags(script) {
	const m = /\/\*\*([\s\S]*?)\*\//.exec(script);
	const plain = /\/\*(?!\*)([\s\S]*?)\*\//.exec(script);
	const text = (m ? m[1] : '')
		.split('\n')
		.map((l) => l.replace(/^\s*\*\s?/, ''))
		.join('\n');
	const parts = text.split(/\n(?=@)/);
	// The doc comment's text before its tags, else the first plain /* … */ comment.
	const docLead = m && !parts[0].trim().startsWith('@') ? parts[0] : '';
	const lead = (
		docLead ||
		(plain
			? plain[1]
					.split('\n')
					.map((l) => l.replace(/^\s*\*?\s?/, ''))
					.join('\n')
			: '')
	).trim();
	const description = lead.startsWith('@') ? '' : lead.replace(/\s+/g, ' ');
	const tags = { prop: new Map(), event: new Map(), slot: new Map(), method: new Map() };
	for (const part of parts) {
		const t = /^@(prop|event|slot|method)\s+([\w-]+)\s*/.exec(part);
		if (!t) continue;
		let rest = part.slice(t[0].length);
		let type;
		if (rest.startsWith('{')) {
			let end;
			[type, end] = braced(rest, 0);
			rest = rest.slice(end);
		}
		tags[t[1]].set(t[2] === '-' ? '' : t[2], {
			type,
			description: rest
				.replace(/^\s*-?\s*/, '')
				.replace(/\s+/g, ' ')
				.trim()
		});
	}
	return { description, tags };
}

// ── wrappers ─────────────────────────────────────────────────────────────────
const BASE_TYPES = { String: 'string', Number: 'number', Boolean: 'boolean', Array: 'unknown[]', Object: 'Record<string, unknown>' };
// Members of HTMLElement a prop shadows; their type stays the DOM one.
const HTML_MEMBERS = new Set([
	'title',
	'hidden',
	'id',
	'lang',
	'dir',
	'slot',
	'translate',
	'inert',
	'draggable',
	'spellcheck',
	'autocapitalize',
	'autofocus',
	'tabIndex',
	'accessKey',
	'role',
	'popover',
	'nonce',
	'className'
]);
const FORM_MEMBERS = [
	{ name: 'form', type: 'HTMLFormElement | null', readonly: true, description: 'The form the element belongs to.' },
	{ name: 'validity', type: 'ValidityState', readonly: true, description: 'Constraint validation state, mirrored from the inner control.' },
	{ name: 'validationMessage', type: 'string', readonly: true, description: "The browser's validation message." },
	{ name: 'willValidate', type: 'boolean', readonly: true, description: 'Whether the element takes part in constraint validation.' }
];
const FORM_METHODS = [
	{ name: 'checkValidity', signature: '(): boolean', description: 'Like the native method; fires `invalid` when the value is invalid.' },
	{ name: 'reportValidity', signature: '(): boolean', description: 'Like the native method; also shows the message at the inner control.' },
	{
		name: 'setCustomValidity',
		signature: '(message: string): void',
		description: 'A non-empty message makes the element invalid (customError).'
	}
];

const files = readdirSync(src)
	.filter((f) => /^K[A-Za-z]+\.svelte$/.test(f))
	.sort();
const elements = files.map((file) => {
	const source = readFileSync(join(src, file), 'utf8');
	const ast = parse(source, { modern: true });
	const ce = ast.options?.customElement;
	if (!ce || typeof ce !== 'object') errors.push(`${file}: no customElement options`);
	if (ce?.tag) errors.push(`${file}: remove \`tag\` from customElement; entries register tags through define()`);
	const name = nameOf(file);
	const tag = `k-${name}`;
	const script = ast.instance ? source.slice(ast.instance.start, ast.instance.end) : '';
	const { description, tags } = docTags(script);
	const formAssociated = /extend:\s*formAssociated/.test(source);

	// Defaults from `let { a = 1, b = $bindable(x) } = $props()`.
	const defaults = new Map();
	for (const node of ast.instance?.content.body ?? []) {
		if (node.type !== 'VariableDeclaration') continue;
		for (const d of node.declarations) {
			if (d.init?.type !== 'CallExpression' || d.init.callee.name !== '$props' || d.id.type !== 'ObjectPattern') continue;
			for (const p of d.id.properties) {
				if (p.type !== 'Property') continue;
				const key = p.key.name ?? p.key.value;
				if (p.value.type === 'AssignmentPattern') {
					let text = source.slice(p.value.right.start, p.value.right.end);
					const bindable = /^\$bindable\(([\s\S]*)\)$/.exec(text);
					if (bindable) text = bindable[1].trim();
					if (text) defaults.set(key, text);
				}
			}
		}
	}

	const props = Object.entries(ce?.props ?? {}).map(([prop, def]) => {
		const doc = tags.prop.get(prop);
		const base = BASE_TYPES[def.type] ?? 'unknown';
		const dflt = defaults.get(prop);
		const type = doc?.type ?? base;
		return {
			name: prop,
			kind: def.type,
			attribute: (def.attribute ?? prop).toLowerCase(),
			type,
			default: dflt,
			reflects: !!def.reflect,
			optional: dflt === undefined || dflt === 'undefined',
			description: doc?.description || undefined
		};
	});
	for (const p of tags.prop.keys()) if (!props.some((x) => x.name === p)) errors.push(`${file}: @prop ${p} is not a prop`);

	const emitted = new Set([...source.matchAll(/emit\(host,\s*'([a-z-]+)'/g)].map((m) => m[1]));
	for (const e of emitted) if (!tags.event.has(e)) errors.push(`${file}: emits "${e}" without an @event tag`);
	for (const e of tags.event.keys()) if (!emitted.has(e)) errors.push(`${file}: @event ${e} is never emitted`);
	const events = [...tags.event].map(([ev, d]) => ({ name: ev, detail: d.type ?? 'null', description: d.description || undefined }));

	let slots;
	if (tags.slot.size > 0) slots = [...tags.slot].map(([s, d]) => ({ name: s, description: d.description || undefined }));
	else {
		const found = new Set([...source.matchAll(/<slot(?:\s+name="([\w-]+)")?\s*\/?>/g)].map((m) => m[1] ?? ''));
		slots = [...found].sort().map((s) => ({ name: s }));
	}

	const listName = /forwardAttributes\(host,\s*([A-Z_]+)\)/.exec(source)?.[1];
	const forwarded = listName ? (nativeLists[listName] ?? (errors.push(`${file}: unknown list ${listName}`), [])) : [];
	for (const a of forwarded) if (props.some((p) => p.attribute === a)) errors.push(`${file}: ${a} is a prop and forwarded`);
	const nativeAttrs = [
		...forwarded.map((a) => ({
			name: a,
			type: nativeType(a),
			description: `Forwarded to the inner control. ${NATIVE_DOC[a] ?? ''}`.trim()
		}))
	];
	if (formAssociated) {
		nativeAttrs.push({ name: 'autofocus', type: 'boolean', description: 'Focuses the inner control when the element is connected.' });
		nativeAttrs.push({ name: 'form', type: 'string', description: 'Id of the form owner (native form association).' });
	}
	const members = [];
	const filesProp = /Object\.defineProperty\(host, 'files', \{[\s\S]*?configurable/.exec(source)?.[0];
	if (filesProp) {
		const settable = /\bset:/.test(filesProp);
		members.push({
			name: 'files',
			type: settable ? 'File[]' : 'readonly File[]',
			readonly: !settable,
			description: settable ? 'The chosen files. Setting it (e.g. to `[]`) replaces them without an event.' : 'The chosen files.'
		});
	}
	if (formAssociated) members.push(...FORM_MEMBERS);
	// Own methods: `@method name {(args): ret} text`, defined on the host with Object.defineProperty.
	const methods = [...tags.method].map(([m, d]) => {
		if (!source.includes(`Object.defineProperty(host, '${m}'`)) errors.push(`${file}: @method ${m} is not defined on the host`);
		if (!d.type || !/^\(.*\):\s*\S/.test(d.type)) errors.push(`${file}: @method ${m} needs a signature like {(): void}`);
		return { name: m, signature: d.type ?? '(): void', description: d.description || undefined };
	});

	return {
		file,
		name,
		tag,
		className: `K${pascal(name)}Element`,
		description,
		formAssociated,
		props,
		events,
		slots,
		nativeAttrs,
		members,
		methods
	};
});

// ── custom-elements.json ─────────────────────────────────────────────────────
/** JS exports of the entries that bring more than their tag (see extras in vite.elements.config.ts). */
const ENTRY_EXPORTS = {
	toaster: ['toast', 'dismissToast'].map((name) => ({ name, module: 'src/lib/components/toast.svelte.ts' })),
	'live-announcer': [{ name: 'announce', module: 'src/lib/components/announcer.ts' }]
};
/** What `elements/strings` and the all-in-one bundle export besides the tags. */
const STRINGS_EXPORTS = ['setStrings', 'resetStrings', 'getStrings', 'getLang', 'registerStrings', 'setLocale', 'followLang', 'en', 'de'];
const typeObj = (text) => ({ text });
const manifest = {
	schemaVersion: '2.1.0',
	readme: 'README.md',
	modules: [
		...elements.map((el) => ({
			kind: 'javascript-module',
			path: `dist-elements/elements/${el.name}.js`,
			declarations: [
				{
					kind: 'class',
					customElement: true,
					tagName: el.tag,
					name: el.className,
					...(el.description ? { description: el.description } : {}),
					superclass: { name: 'HTMLElement' },
					members: [
						...el.props.map((p) => ({
							kind: 'field',
							name: p.name,
							type: typeObj(p.optional && p.type !== 'boolean' ? `${p.type} | undefined` : p.type),
							...(p.default !== undefined ? { default: p.default } : {}),
							attribute: p.attribute,
							...(p.reflects ? { reflects: true } : {}),
							...(p.description ? { description: p.description } : {})
						})),
						...el.members.map((m) => ({
							kind: 'field',
							name: m.name,
							type: typeObj(m.type),
							...(m.readonly ? { readonly: true } : {}),
							description: m.description
						})),
						...el.methods.map((m) => ({
							kind: 'method',
							name: m.name,
							...(m.description ? { description: m.description } : {}),
							return: { type: typeObj(m.signature.replace(/^\(.*\):\s*/, '')) }
						})),
						...(el.formAssociated
							? FORM_METHODS.map((m) => ({ kind: 'method', name: m.name, description: m.description, signature: m.signature }))
							: []
						).map(({ signature, ...m }) => ({
							...m,
							...(signature.includes('message') ? { parameters: [{ name: 'message', type: typeObj('string') }] } : {}),
							return: { type: typeObj(signature.endsWith('boolean') ? 'boolean' : 'void') }
						}))
					],
					attributes: [
						...el.props.map((p) => ({
							name: p.attribute,
							type: typeObj(p.kind === 'Array' || p.kind === 'Object' ? `${p.type} (JSON)` : p.type),
							...(p.default !== undefined ? { default: p.default } : {}),
							fieldName: p.name
						})),
						...el.nativeAttrs.map((a) => ({ name: a.name, type: typeObj(a.type), description: a.description }))
					],
					events: el.events.map((e) => ({
						name: e.name,
						type: typeObj(`CustomEvent<${e.detail}>`),
						...(e.description ? { description: e.description } : {})
					})),
					slots: el.slots.map((s) => ({ name: s.name, ...(s.description ? { description: s.description } : {}) }))
				}
			],
			exports: [
				{
					kind: 'custom-element-definition',
					name: el.tag,
					declaration: { name: el.className, module: `dist-elements/elements/${el.name}.js` }
				},
				...(ENTRY_EXPORTS[el.name] ?? []).map(({ name, module }) => ({
					kind: 'js',
					name,
					declaration: { name, module }
				}))
			]
		})),
		{
			kind: 'javascript-module',
			path: 'dist-elements/elements/strings.js',
			declarations: [],
			exports: STRINGS_EXPORTS.map((name) => ({ kind: 'js', name, declaration: { name, module: 'src/lib/components/strings.ts' } }))
		},
		{
			kind: 'javascript-module',
			path: 'dist-elements/kern-elements.js',
			declarations: [],
			exports: [
				...elements.map((el) => ({
					kind: 'custom-element-definition',
					name: el.tag,
					declaration: { name: el.className, module: `dist-elements/elements/${el.name}.js` }
				})),
				...['toast', 'dismissToast', 'announce', ...STRINGS_EXPORTS, 'elements'].map((n) => ({
					kind: 'js',
					name: n,
					declaration: { name: n, module: 'src/elements/index.ts' }
				}))
			]
		}
	]
};

if (errors.length) {
	for (const e of errors) console.error(`elements-manifest: ${e}`);
	process.exit(1);
}
writeFileSync(join(root, 'custom-elements.json'), JSON.stringify(manifest, null, '\t') + '\n');
console.log(`custom-elements.json: ${elements.length} elements, ${elements.reduce((n, e) => n + e.events.length, 0)} events`);
if (manifestOnly) process.exit(0);

// ── typings ──────────────────────────────────────────────────────────────────
if (!existsSync(join(out, 'kern-elements.js'))) {
	console.error('elements-manifest: dist-elements/kern-elements.js is missing; run the elements build first.');
	process.exit(1);
}
// types.ts imports `KernStrings` from the library for the repo's own type check; the shipped d.ts
// carries the interface instead, so consumers need no source file.
const shapes = readFileSync(join(src, 'types.ts'), 'utf8')
	.replace(/^\/\*[\s\S]*?\*\/\n+/, '')
	.replace(/\/\/ The generator replaces[^\n]*\n\/\/[^\n]*\nimport type \{ KernStrings \}[^\n]*\nexport type \{ KernStrings \};\n/, () =>
		stringsInterface(root)
	);
if (shapes.includes("from '../lib/")) throw new Error('elements-manifest: types.ts still imports from ../lib after generating KernStrings');
const doc = (text, indent = '') => (text ? `${indent}/** ${text.replace(/\*\//g, '*\\/')} */\n` : '');
const quote = (n) => (/^[A-Za-z_$][\w$]*$/.test(n) ? n : `'${n}'`);

let dts = `// Generated by scripts/elements-manifest.mjs from src/elements. Do not edit.
// Types of the kern custom elements: \`import '@mozra-the-great/kern/elements'\` (all tags) or
// \`import '@mozra-the-great/kern/elements/<name>'\` (one tag). React 19 JSX: also
// \`import type {} from '@mozra-the-great/kern/elements/react'\` once in the app.

${shapes.trim()}
`;

for (const el of elements) {
	const evName = `K${pascal(el.name)}Events`;
	dts += `\n/** Custom events of \`<${el.tag}>\` (bubbling, composed; the value is in \`detail\`). */\nexport interface ${evName} {\n`;
	for (const e of el.events) dts += doc(e.description, '\t') + `\t${quote(e.name)}: CustomEvent<${e.detail}>;\n`;
	dts += `}\n`;
	dts += `export type ${el.className.replace(/Element$/, 'EventMap')} = Omit<HTMLElementEventMap, keyof ${evName}> & ${evName};\n`;
	dts += `\n/** Properties and attributes of \`<${el.tag}>\`, as JSX/props. */\nexport interface K${pascal(el.name)}Props {\n`;
	for (const p of el.props)
		dts +=
			doc(
				[
					p.description,
					p.default !== undefined ? `@default ${p.default}` : '',
					p.attribute !== p.name ? `Attribute: \`${p.attribute}\`.` : ''
				]
					.filter(Boolean)
					.join(' '),
				'\t'
			) + `\t${quote(p.name)}?: ${p.type}${p.kind === 'Array' || p.kind === 'Object' ? ' | string' : ''};\n`;
	for (const a of el.nativeAttrs) dts += doc(a.description, '\t') + `\t${quote(a.name)}?: ${a.type};\n`;
	dts += `}\n`;
	const map = el.className.replace(/Element$/, 'EventMap');
	dts += `\n${doc(el.description)}export interface ${el.className} extends HTMLElement {\n`;
	// Listener overloads typed by the event map, as lib.dom does for its elements.
	dts += `\taddEventListener<K extends keyof ${map}>(type: K, listener: (this: ${el.className}, ev: ${map}[K]) => unknown, options?: boolean | AddEventListenerOptions): void;\n`;
	dts += `\taddEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;\n`;
	dts += `\tremoveEventListener<K extends keyof ${map}>(type: K, listener: (this: ${el.className}, ev: ${map}[K]) => unknown, options?: boolean | EventListenerOptions): void;\n`;
	dts += `\tremoveEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;\n`;
	for (const p of el.props) {
		if (HTML_MEMBERS.has(p.name)) continue;
		dts += doc(p.description, '\t') + `\t${quote(p.name)}: ${p.type}${p.optional && p.type !== 'boolean' ? ' | undefined' : ''};\n`;
	}
	for (const m of el.members) dts += doc(m.description, '\t') + `\t${m.readonly ? 'readonly ' : ''}${m.name}: ${m.type};\n`;
	for (const m of el.methods) dts += doc(m.description, '\t') + `\t${m.name}${m.signature};\n`;
	if (el.formAssociated) for (const m of FORM_METHODS) dts += doc(m.description, '\t') + `\t${m.name}${m.signature};\n`;
	dts += `}\n`;
}

dts += `
/** Per tag: the element's properties/attributes (all optional). */
export interface KernElementProps {
${elements.map((el) => `\t'${el.tag}': K${pascal(el.name)}Props;`).join('\n')}
}
/** Per tag: the element's custom events. */
export interface KernElementEvents {
${elements.map((el) => `\t'${el.tag}': K${pascal(el.name)}Events;`).join('\n')}
}
/** Per tag: the element interface. */
export interface KernElements {
${elements.map((el) => `\t'${el.tag}': ${el.className};`).join('\n')}
}

/** The Svelte components behind the tags (\`element\` is the registered class). */
export declare const elements: Readonly<Record<string, { element?: CustomElementConstructor }>>;
export declare const toast: ToastFunction;
export declare function dismissToast(id: number): void;
export declare function announce(message: string, politeness?: AnnouncePoliteness): void;
export declare const setStrings: KernStringsApi['set'];
export declare const resetStrings: KernStringsApi['reset'];
export declare const getStrings: KernStringsApi['get'];
export declare function getLang(): string | undefined;
export declare const registerStrings: KernStringsApi['register'];
export declare const setLocale: KernStringsApi['setLocale'];
export declare const followLang: KernStringsApi['followLang'];
export declare const en: KernBundle;
export declare const de: KernBundle;

declare global {
	interface HTMLElementTagNameMap extends KernElements {}
	interface Window {
		/** Set by kern-elements.js and the entries of the toaster, the live announcer and the strings. */
		kern?: KernGlobal;
	}
}
`;

const react = `// Generated by scripts/elements-manifest.mjs. Do not edit.
// React 19 JSX types for the kern custom elements. Opt in once per app:
//   import type {} from '@mozra-the-great/kern/elements/react';
// React 19 sets properties when the element has them (arrays/objects work) and attributes
// otherwise. Event handlers use the exact event name: \`onchange\` → "change", \`oncopy-error\`.
import type { HTMLAttributes, Key, Ref } from 'react';
import type { KernElementEvents, KernElementProps, KernElements } from './kern-elements.js';

type KernHandlers<E> = { [K in keyof E as \`on\${K & string}\`]?: (event: E[K]) => void };
type Own<T extends keyof KernElements> = KernElementProps[T] & KernHandlers<KernElementEvents[T]>;
/** Lower-case native listeners (\`onclick\`, \`oninput\` …): React 19 adds them with addEventListener. */
type NativeHandlers = KernHandlers<HTMLElementEventMap>;
/** JSX props of a kern tag: its own props and events, native lower-case listeners and the common HTML attributes. */
export type KernJSXProps<T extends keyof KernElements> = Own<T> &
	Omit<NativeHandlers, keyof Own<T>> &
	// React's camel-case handlers (\`onChange\` …) do not receive the kern event; left out for kern's own events.
	Omit<HTMLAttributes<KernElements[T]>, keyof Own<T> | \`on\${Capitalize<keyof KernElementEvents[T] & string>}\`> & {
		ref?: Ref<KernElements[T]>;
		key?: Key | null;
		/** React 19 passes \`class\` through on custom elements; \`className\` works too. */
		class?: string;
	};

declare module 'react' {
	namespace JSX {
		interface IntrinsicElements {
${elements.map((el) => `\t\t\t'${el.tag}': KernJSXProps<'${el.tag}'>;`).join('\n')}
		}
	}
}
`;

writeFileSync(join(out, 'kern-elements.d.ts'), dts);
writeFileSync(join(out, 'react.d.ts'), react);
writeFileSync(join(out, 'react.js'), '// Types only: see react.d.ts.\nexport {};\n');
mkdirSync(join(out, 'elements'), { recursive: true });
for (const el of elements) {
	const body =
		el.name === 'toaster'
			? `export { toast, dismissToast } from '../kern-elements.js';\n`
			: el.name === 'live-announcer'
				? `export { announce } from '../kern-elements.js';\n`
				: `import '../kern-elements.js';\nexport {};\n`;
	writeFileSync(
		join(out, 'elements', `${el.name}.d.ts`),
		`// Registers <${el.tag}>${el.name === 'accordion' ? ' and <k-accordion-item>' : ''}. Generated; do not edit.\n${body}`
	);
}
writeFileSync(
	join(out, 'elements', 'strings.d.ts'),
	`// Sets the default texts of every element and registers the built-in bundles \`en\` and \`de\`. Generated; do not edit.\nexport { ${STRINGS_EXPORTS.join(', ')} } from '../kern-elements.js';\n`
);
console.log(`typings: dist-elements/kern-elements.d.ts, react.d.ts, ${elements.length + 1} entry .d.ts`);
