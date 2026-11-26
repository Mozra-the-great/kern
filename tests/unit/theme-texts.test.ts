/**
 * The theme texts catalogue (#185), node side: both languages complete with the same placeholders,
 * plain text, instance-neutral (no product, operator, domain, address), the override API, the language
 * selection, and a compile check that a bundle with a missing text does not type-check. The reactive read
 * in a mounted component is tested by tests/dom/theme-texts.test.ts.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import { afterEach, describe, expect, it } from 'vitest';
// @ts-expect-error plain ESM script without types
import { scanText } from '../../scripts/ci/neutrality.mjs';
import {
	THEME_TEXT_SETS,
	createThemeTextsStore,
	fillThemeText,
	getThemeTexts,
	getThemeTextsLang,
	registerThemeTexts,
	resetThemeTexts,
	resolveThemeTexts,
	setThemeTexts,
	setThemeTextsLocale,
	sharedThemeTextsStore,
	themeTextsEn,
	type ThemeTextsBundle
} from '../../src/lib/components/theme-texts.js';
import { deThemeTexts } from '../../src/lib/components/theme-texts-de.js';
import { en } from '../../src/lib/components/strings.js';

afterEach(() => {
	resetThemeTexts();
});

type Tree = { [key: string]: Tree | string };

/** Dotted path of every text in a catalogue. */
function leaves(tree: Tree, prefix = ''): Map<string, string> {
	const out = new Map<string, string>();
	for (const [key, value] of Object.entries(tree)) {
		if (key === 'lang') continue;
		const path = prefix ? `${prefix}.${key}` : key;
		if (typeof value === 'string') out.set(path, value);
		else for (const [p, v] of leaves(value, path)) out.set(p, v);
	}
	return out;
}
const placeholders = (text: string): string[] => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1] ?? '').sort();

/** The 17 sets of the reference, in its order. */
const SETS = [
	'winter',
	'newYear',
	'valentine',
	'carnival',
	'womensDay',
	'earthDay',
	'easter',
	'europeDay',
	'pride',
	'autumn',
	'unityDay',
	'harvest',
	'halloween',
	'stNicholas',
	'humanRightsDay',
	'advent',
	'christmas'
];

describe('the catalogue', () => {
	it('has the 17 sets with two texts each, English as the default bundle', () => {
		expect([...THEME_TEXT_SETS]).toEqual(SETS);
		const english = leaves(themeTextsEn);
		expect(english.size).toBe(34);
		for (const set of SETS) {
			expect(english.has(`${set}.first`), set).toBe(true);
			expect(english.has(`${set}.second`), set).toBe(true);
		}
		expect(themeTextsEn.lang).toBe('en');
		expect(getThemeTexts().winter.first).toBe('From Dec 21 the days get longer again.');
		expect(getThemeTextsLang()).toBeUndefined();
	});

	it('is complete in German: same texts, same placeholders, none left in English', () => {
		const english = leaves(themeTextsEn);
		const german = leaves(deThemeTexts);
		expect([...german.keys()].sort()).toEqual([...english.keys()].sort());
		for (const [path, text] of english) {
			const translated = german.get(path) ?? '';
			expect(translated, path).not.toBe('');
			expect(translated, path).not.toBe(text);
			expect(placeholders(translated), path).toEqual(placeholders(text));
		}
		expect(deThemeTexts.lang).toBe('de');
	});

	it('uses placeholders only where the text is a template (the Advent candles)', () => {
		const withPlaceholders = [...leaves(themeTextsEn)].filter(([, text]) => placeholders(text).length > 0).map(([path]) => path);
		expect(withPlaceholders).toEqual(['advent.second']);
		expect(placeholders(themeTextsEn.advent.second)).toEqual(['lit', 'total']);
		expect(fillThemeText(themeTextsEn.advent.second, { lit: 3, total: 4 })).toBe('Today: 3 of 4 candles.');
		expect(fillThemeText(deThemeTexts.advent.second, { lit: 1, total: 4 })).toBe('Heute: 1 von 4 Kerzen.');
		expect(fillThemeText('{lit} of {other}', { lit: 2 })).toBe('2 of {other}');
	});

	it('is plain text: no markup, no line breaks, no stray whitespace', () => {
		for (const bundle of [themeTextsEn, deThemeTexts]) {
			for (const [path, text] of leaves(bundle)) {
				expect(text, path).not.toMatch(/[<>]|\n|\r/);
				expect(text, path).toBe(text.trim());
				expect(text.length, path).toBeLessThan(140);
			}
		}
	});

	it('is positive and factual: no marketing copy, no mascot speaking (no quotes, no exclamations but the greeting)', () => {
		const loud = [...leaves(themeTextsEn)].filter(([, text]) => text.includes('!')).map(([path]) => path);
		expect(loud).toEqual(['newYear.first']);
		for (const bundle of [themeTextsEn, deThemeTexts]) {
			for (const [path, text] of leaves(bundle)) expect(text, path).not.toMatch(/["„“”]|\b(?:Stuffy|axolotl|Axolotl|mascot|Maskottchen)\b/);
		}
	});

	it('is instance-neutral: no product or operator name, address, URL, domain or IP', () => {
		for (const bundle of [themeTextsEn, deThemeTexts]) {
			for (const [path, text] of leaves(bundle)) {
				expect(scanText(text, ['stuffcloud', 'stuff cloud', 'stuffy']), path).toEqual([]);
				expect(text, path).not.toMatch(/@|https?:|www\./i);
			}
		}
		// The source files hold nothing else either: names in comments would ship in the package too.
		for (const file of ['theme-texts.ts', 'theme-texts-de.ts', 'theme-texts.svelte.ts']) {
			const source = readFileSync(join(import.meta.dirname, '../../src/lib/components', file), 'utf8');
			expect(scanText(source, ['stuffcloud', 'stuff cloud']), file).toEqual([]);
		}
	});

	it('does not repeat itself: every text of a language is unique', () => {
		for (const bundle of [themeTextsEn, deThemeTexts]) {
			const texts = [...leaves(bundle).values()];
			expect(new Set(texts).size).toBe(texts.length);
		}
	});

	it('is not part of the component defaults', () => {
		const sections = Object.keys(en);
		for (const set of SETS) expect(sections).not.toContain(set);
	});
});

describe('setThemeTexts', () => {
	it('replaces texts, keeps the rest English and ignores unknown keys', () => {
		setThemeTexts({ pride: { second: 'All welcome.' }, nothing: { here: 'x' } } as unknown as Parameters<typeof setThemeTexts>[0]);
		const texts = getThemeTexts();
		expect(texts.pride.second).toBe('All welcome.');
		expect(texts.pride.first).toBe(themeTextsEn.pride.first);
		expect(texts.easter).toEqual(themeTextsEn.easter);
		expect(texts).not.toHaveProperty('nothing');
	});

	it('takes a whole bundle and sets the language', () => {
		setThemeTexts(deThemeTexts);
		expect(getThemeTexts().christmas.second).toBe('Der Schnee ist nur Dekoration.');
		expect(getThemeTextsLang()).toBe('de');
	});

	it('merges several inputs, later ones winning, and replaces the earlier choice', () => {
		setThemeTexts(deThemeTexts, { advent: { second: 'Kerzen: {lit}' } });
		expect(getThemeTexts().advent.second).toBe('Kerzen: {lit}');
		expect(getThemeTexts().advent.first).toBe(deThemeTexts.advent.first);
		setThemeTexts({ easter: { first: 'Hop.' } });
		expect(getThemeTexts().advent.first).toBe(themeTextsEn.advent.first);
		expect(getThemeTexts().easter.first).toBe('Hop.');
	});

	it('goes back to English without arguments and with resetThemeTexts', () => {
		setThemeTexts(deThemeTexts);
		setThemeTexts();
		expect(getThemeTexts()).toEqual(resolveThemeTexts(createThemeTextsStore()));
		expect(getThemeTextsLang()).toBeUndefined();
		setThemeTexts(deThemeTexts);
		resetThemeTexts();
		expect(getThemeTexts().winter.first).toBe(themeTextsEn.winter.first);
	});

	it('treats undefined values like missing ones and ignores values that are not text', () => {
		setThemeTexts({ lang: undefined, winter: { first: undefined }, easter: undefined });
		expect(getThemeTexts().winter.first).toBe(themeTextsEn.winter.first);
		expect(getThemeTextsLang()).toBeUndefined();
		setThemeTexts(JSON.parse('{"winter":{"first":5,"second":["x"]}}') as Parameters<typeof setThemeTexts>[0]);
		expect(getThemeTexts().winter).toEqual(themeTextsEn.winter);
	});

	it('does not let a hostile bundle reach Object.prototype', () => {
		const hostile = JSON.parse(
			'{"__proto__":{"polluted":"yes"},"constructor":{"prototype":{"polluted":"yes"}},"winter":{"__proto__":{"polluted":"yes"},"first":"Cold."}}'
		) as Parameters<typeof setThemeTexts>[0];
		setThemeTexts(hostile);
		expect(({} as Record<string, unknown>)['polluted']).toBeUndefined();
		expect(Object.prototype).not.toHaveProperty('polluted');
		expect(getThemeTexts().winter.first).toBe('Cold.');
	});

	it('does not share objects with its input or its result', () => {
		const input = { winter: { first: 'A' } };
		setThemeTexts(input);
		input.winter.first = 'B';
		expect(getThemeTexts().winter.first).toBe('A');
		const out = getThemeTexts();
		out.winter.first = 'C';
		expect(getThemeTexts().winter.first).toBe('A');
	});
});

describe('the language selection', () => {
	it('selects a registered bundle by tag and by its primary language', () => {
		registerThemeTexts('de', deThemeTexts);
		expect(setThemeTextsLocale('de')).toBe(true);
		expect(getThemeTexts().winter.first).toBe(deThemeTexts.winter.first);
		expect(getThemeTextsLang()).toBe('de');
		expect(setThemeTextsLocale('de-AT')).toBe(true);
		expect(getThemeTextsLang()).toBe('de-AT');
		expect(setThemeTextsLocale('DE')).toBe(true);
	});

	it('keeps English for a language without a bundle', () => {
		registerThemeTexts('de', deThemeTexts);
		setThemeTextsLocale('de');
		expect(setThemeTextsLocale('fr-CH')).toBe(false);
		expect(getThemeTexts().winter.first).toBe(themeTextsEn.winter.first);
		expect(getThemeTextsLang()).toBe('fr-CH');
	});

	it('goes back to the defaults for an empty tag', () => {
		registerThemeTexts('de', deThemeTexts);
		setThemeTextsLocale('de');
		expect(setThemeTextsLocale(undefined)).toBe(false);
		expect(getThemeTextsLang()).toBeUndefined();
		setThemeTextsLocale('de');
		setThemeTextsLocale('  ');
		expect(getThemeTextsLang()).toBeUndefined();
	});

	it('takes a partial bundle', () => {
		registerThemeTexts('fr', { lang: 'fr', winter: { first: 'Les jours rallongent.' } });
		setThemeTextsLocale('fr-FR');
		expect(getThemeTexts().winter.first).toBe('Les jours rallongent.');
		expect(getThemeTexts().winter.second).toBe(themeTextsEn.winter.second);
	});

	it('is independent of the component strings: setStrings does not touch it', async () => {
		const { setStrings, resetStrings } = await import('../../src/lib/components/strings.js');
		const { de } = await import('../../src/lib/components/strings-de.js');
		setStrings(de);
		expect(getThemeTextsLang()).toBeUndefined();
		setThemeTexts(deThemeTexts);
		resetStrings();
		expect(getThemeTextsLang()).toBe('de');
	});
});

describe('the shared store', () => {
	it('is one object on its own well-known global, not the one of the strings', () => {
		const g = globalThis as typeof globalThis & Record<symbol, unknown>;
		const shared = sharedThemeTextsStore();
		expect(g[Symbol.for('kern.themeTexts')]).toBe(shared);
		expect(g[Symbol.for('kern.themeTexts')]).not.toBe(g[Symbol.for('kern.strings')]);
		expect(sharedThemeTextsStore()).toBe(sharedThemeTextsStore());
	});

	it('notifies subscribers after every change', () => {
		const store = sharedThemeTextsStore();
		let calls = 0;
		const off = store.subscribe(() => calls++);
		setThemeTexts(deThemeTexts);
		resetThemeTexts();
		off();
		setThemeTexts(deThemeTexts);
		expect(calls).toBe(2);
	});

	it('resolves against its own catalogue: a set of a newer copy that this copy does not know is ignored', () => {
		const store = createThemeTextsStore();
		store.set([{ winter: { first: 'Brr.' }, solstice: { first: 'x' } } as unknown as ThemeTextsBundle]);
		const resolved = resolveThemeTexts(store);
		expect(resolved.winter.first).toBe('Brr.');
		expect(resolved).not.toHaveProperty('solstice');
	});
});

/* ───────────── a missing text does not compile ───────────── */

/**
 * Type-checks `body` against theme-texts.ts and returns the diagnostics. The in-memory file sits next to the
 * real sources, so it imports them like a consumer of the package would.
 */
/** The previous program: later calls reuse the parsed library files, so only the first one is slow. */
let previous: ts.Program | undefined;

function diagnose(body: string): string[] {
	const dir = join(import.meta.dirname, '../../src/lib/components');
	const file = join(dir, '__theme-texts-fixture.ts').split('\\').join('/');
	const options: ts.CompilerOptions = {
		strict: true,
		exactOptionalPropertyTypes: true,
		noEmit: true,
		skipLibCheck: true,
		target: ts.ScriptTarget.ES2022,
		module: ts.ModuleKind.ESNext,
		moduleResolution: ts.ModuleResolutionKind.Bundler,
		lib: ['lib.es2022.d.ts', 'lib.dom.d.ts'],
		types: []
	};
	const host = ts.createCompilerHost(options);
	const read = host.readFile.bind(host);
	host.readFile = (name) => (name === file ? body : read(name));
	host.fileExists = (
		(exists) => (name: string) =>
			name === file || exists(name)
	)(host.fileExists.bind(host));
	const original = host.getSourceFile.bind(host);
	host.getSourceFile = (name, lang, ...rest) => (name === file ? ts.createSourceFile(name, body, lang) : original(name, lang, ...rest));
	const program = ts.createProgram([file], options, host, previous);
	previous = program;
	return ts.getPreEmitDiagnostics(program).map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n'));
}

// A cold TypeScript program takes seconds on a busy CI runner.
describe('the types', { timeout: 60_000 }, () => {
	const head = `import type { ThemeTextsBundle, ThemeTextsInput, ThemeTextSet } from './theme-texts.js';\nimport { deThemeTexts } from './theme-texts-de.js';\n`;

	it('accept the German bundle, a partial input and a set id', () => {
		expect(
			diagnose(
				head +
					`const bundle: ThemeTextsBundle = deThemeTexts;\nconst input: ThemeTextsInput = { lang: 'fr', pride: { second: 'x' } };\nconst set: ThemeTextSet = 'advent';\nexport { bundle, input, set };\n`
			)
		).toEqual([]);
	});

	it('reject a bundle that lacks a text', () => {
		const found = diagnose(head + `export const incomplete: ThemeTextsBundle = { ...deThemeTexts, winter: { first: 'x' } };\n`);
		expect(found.join('\n')).toMatch(/second/);
		const noSet = diagnose(
			head + `const { advent, ...rest } = deThemeTexts;\nexport const incomplete: ThemeTextsBundle = rest;\nvoid advent;\n`
		);
		expect(noSet.join('\n')).toMatch(/advent/);
	});

	it('reject an unknown set, an unknown slot and a text that is not a string', () => {
		expect(diagnose(head + `export const set: ThemeTextSet = 'solstice';\n`).length).toBeGreaterThan(0);
		expect(diagnose(head + `export const input: ThemeTextsInput = { winter: { third: 'x' } };\n`).length).toBeGreaterThan(0);
		expect(diagnose(head + `export const input: ThemeTextsInput = { winter: { first: 5 } };\n`).length).toBeGreaterThan(0);
	});
});
