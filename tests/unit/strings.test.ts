/**
 * Strings catalogue (#58), node side: the shared store, merging and resolving, locale selection,
 * the German bundle against the English one, and an audit of the component sources (no English
 * default text left in a component, every catalogue entry used). The rendered result in both
 * builds is tested by tests/elements/strings.spec.ts.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { de } from '../../src/lib/components/strings-de.js';
import {
	createStringsStore,
	en,
	followLang,
	getLang,
	getStrings,
	registerStrings,
	resetStrings,
	resolveStrings,
	setLocale,
	setStrings,
	sharedStringsStore,
	type KernBundle,
	type KernStrings
} from '../../src/lib/components/strings.js';

afterEach(() => {
	resetStrings();
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

describe('the catalogue', () => {
	it('has English as the default bundle', () => {
		expect(en.lang).toBe('en');
		expect(getStrings().modal.closeLabel).toBe('Close');
		expect(getLang()).toBeUndefined();
	});

	it('is complete in German: same texts, same placeholders', () => {
		const english = leaves(en);
		const german = leaves(de);
		expect([...german.keys()].sort()).toEqual([...english.keys()].sort());
		for (const [path, text] of english) {
			const translated = german.get(path) ?? '';
			expect(translated, path).not.toBe('');
			expect(placeholders(translated), path).toEqual(placeholders(text));
		}
		expect(de.lang).toBe('de');
	});

	it('translates every text, except the few that read the same in German', () => {
		const same = new Set(['code.label', 'heatmap.cellLabel', 'historyBar.summaryLabel', 'terminal.label', 'timeline.statuses.current']);
		const german = leaves(de);
		const unchanged = [...leaves(en)].filter(([path, text]) => german.get(path) === text).map(([path]) => path);
		expect(unchanged.filter((p) => !same.has(p))).toEqual([]);
	});

	it('is plain text: no markup in any text', () => {
		for (const bundle of [en, de]) for (const [path, text] of leaves(bundle)) expect(text, path).not.toMatch(/[<>]/);
	});
});

describe('setStrings rejects prototype keys', () => {
	it('a bundle with __proto__, constructor or prototype does not pollute Object.prototype', () => {
		const hostile = JSON.parse(
			'{"__proto__": {"polluted": "yes"}, "constructor": {"prototype": {"polluted": "yes"}}, "modal": {"__proto__": {"polluted": "yes"}, "closeLabel": "Zu"}}'
		) as Parameters<typeof setStrings>[0];
		setStrings(hostile);
		expect(({} as Record<string, unknown>)['polluted']).toBeUndefined();
		expect(Object.prototype).not.toHaveProperty('polluted');
		// The legitimate part of the bundle still applies.
		expect(getStrings().modal.closeLabel).toBe('Zu');
	});
});

describe('setStrings', () => {
	it('replaces texts, keeps the rest English and ignores unknown keys', () => {
		setStrings({ modal: { closeLabel: 'Fermer' }, nothing: { here: 'x' } } as unknown as Parameters<typeof setStrings>[0]);
		const s = getStrings();
		expect(s.modal.closeLabel).toBe('Fermer');
		expect(s.drawer.closeLabel).toBe('Close');
		expect(s).not.toHaveProperty('nothing');
	});

	it('takes a whole bundle and sets the language', () => {
		setStrings(de);
		expect(getStrings().toaster.undoLabel).toBe('Rückgängig');
		expect(getLang()).toBe('de');
	});

	it('merges several inputs, later ones winning, and replaces the earlier choice', () => {
		setStrings(de, { modal: { closeLabel: 'Zu' } });
		expect(getStrings().modal.closeLabel).toBe('Zu');
		expect(getStrings().drawer.closeLabel).toBe('Schließen');
		setStrings({ drawer: { closeLabel: 'X' } });
		expect(getStrings().modal.closeLabel).toBe('Close');
		expect(getStrings().drawer.closeLabel).toBe('X');
	});

	it('goes back to English without arguments and with resetStrings', () => {
		setStrings(de);
		setStrings();
		expect(getStrings().modal.closeLabel).toBe('Close');
		expect(getLang()).toBeUndefined();
		setStrings(de);
		resetStrings();
		expect(getStrings()).toEqual(resolveStrings(createStringsStore()));
	});

	it('treats undefined values like missing ones', () => {
		setStrings({ lang: undefined, modal: { closeLabel: undefined }, drawer: undefined });
		expect(getStrings().modal.closeLabel).toBe('Close');
		expect(getLang()).toBeUndefined();
	});

	it('ignores values that are not text and cannot be used to pollute prototypes', () => {
		const hostile = JSON.parse(
			'{"modal":{"closeLabel":5},"__proto__":{"polluted":"yes"},"constructor":{"prototype":{"polluted":"yes"}}}'
		) as Parameters<typeof setStrings>[0];
		setStrings(hostile);
		expect(getStrings().modal.closeLabel).toBe('Close');
		expect(({} as Record<string, unknown>).polluted).toBeUndefined();
		expect(Object.prototype).not.toHaveProperty('polluted');
	});

	it('does not share objects with its input', () => {
		const input = { modal: { closeLabel: 'A' } };
		setStrings(input);
		input.modal.closeLabel = 'B';
		expect(getStrings().modal.closeLabel).toBe('A');
		const out: KernStrings = getStrings();
		out.modal.closeLabel = 'C';
		expect(getStrings().modal.closeLabel).toBe('A');
	});
});

describe('the shared store', () => {
	it('notifies subscribers after every change and counts revisions', () => {
		const store = sharedStringsStore();
		let calls = 0;
		const off = store.subscribe(() => calls++);
		const before = store.revision;
		setStrings(de);
		resetStrings();
		off();
		setStrings(de);
		expect(calls).toBe(2);
		expect(store.revision).toBe(before + 3);
	});

	it('survives a throwing subscriber', () => {
		const store = createStringsStore();
		const seen: number[] = [];
		const errors: unknown[] = [];
		const original = globalThis.reportError;
		globalThis.reportError = (e: unknown) => void errors.push(e);
		store.subscribe(() => {
			throw new Error('boom');
		});
		store.subscribe(() => seen.push(store.revision));
		store.set([de]);
		globalThis.reportError = original;
		expect(seen).toEqual([1]);
		expect(errors).toHaveLength(1);
	});

	it('is one object on a well-known global, so every build sees the same choice', () => {
		const g = globalThis as typeof globalThis & Record<symbol, unknown>;
		const shared = sharedStringsStore();
		expect(g[Symbol.for('kern.strings')]).toBe(shared);
		expect(sharedStringsStore()).toBe(sharedStringsStore());
	});

	it('resolves against its own catalogue: a text of a newer copy that the store does not know stays English', () => {
		const store = createStringsStore();
		store.set([{ modal: { closeLabel: 'Fermer' } }]);
		const fromOldStore: KernStrings = resolveStrings(store);
		expect(fromOldStore.modal.closeLabel).toBe('Fermer');
		expect(fromOldStore.onlineStatus.onlineText).toBe(en.onlineStatus.onlineText);
	});
});

describe('setLocale', () => {
	it('selects a registered bundle by tag and by its primary language', () => {
		registerStrings('de', de);
		expect(setLocale('de')).toBe(true);
		expect(getStrings().modal.closeLabel).toBe('Schließen');
		expect(getLang()).toBe('de');
		expect(setLocale('de-AT')).toBe(true);
		expect(getLang()).toBe('de-AT');
		expect(setLocale('DE')).toBe(true);
	});

	it('keeps English texts for a language without a bundle but follows its number and date format', () => {
		registerStrings('de', de);
		setLocale('de');
		expect(setLocale('fr-CH')).toBe(false);
		expect(getStrings().modal.closeLabel).toBe('Close');
		expect(getLang()).toBe('fr-CH');
	});

	it('goes back to the defaults for an empty tag', () => {
		registerStrings('de', de);
		setLocale('de');
		expect(setLocale(undefined)).toBe(false);
		expect(getLang()).toBeUndefined();
		expect(getStrings().modal.closeLabel).toBe('Close');
		setLocale('de');
		setLocale('  ');
		expect(getLang()).toBeUndefined();
	});

	it('takes a partial bundle', () => {
		const fr = { lang: 'fr', modal: { closeLabel: 'Fermer' } };
		registerStrings('fr', fr);
		setLocale('fr-FR');
		expect(getStrings().modal.closeLabel).toBe('Fermer');
		expect(getStrings().drawer.closeLabel).toBe('Close');
	});

	it('followLang does nothing without a document', () => {
		expect(typeof document).toBe('undefined');
		expect(followLang()()).toBeUndefined();
	});
});

/* ───────────── audit of the component sources ───────────── */

const componentDir = join(import.meta.dirname, '../../src/lib/components');
const sources = new Map(
	readdirSync(componentDir)
		.filter((f) => f.endsWith('.svelte'))
		.map((f) => [f, readFileSync(join(componentDir, f), 'utf8')] as const)
);
const sectionFile = (section: string): string => `${section[0]?.toUpperCase() ?? ''}${section.slice(1)}.svelte`;

describe('the components use the catalogue', () => {
	it('declares no English default for a label, text, error or empty message', () => {
		const offenders: string[] = [];
		// A prop whose name says it is text, with a string literal as its default: `closeLabel = 'Close'`.
		const name = String.raw`(\w*(?:Label|Text|Error|Placeholder)|label|empty|emptyFiltered|noResults|instructions|placeholder)`;
		// One prop per line (`closeLabel = 'Close',`) or several on the `let { … }` line (`, closeLabel = 'Close',`).
		const textual = new RegExp(String.raw`(?:^\s+|[{,]\s*)${name}\s*=\s*(['"` + '`' + String.raw`])([^'"` + '`' + String.raw`]*)\2`, 'gm');
		for (const [file, source] of sources) {
			for (const m of source.matchAll(textual)) {
				// Not text for people: the hex format hint of the ColorPicker, an empty placeholder.
				if ((m[3] ?? '') === '' || (file === 'ColorPicker.svelte' && m[1] === 'placeholder')) continue;
				offenders.push(`${file}: ${m[1]} = ${m[2]}${m[3]}${m[2]}`);
			}
		}
		expect(offenders).toEqual([]);
	});

	it('reads every catalogue entry somewhere', () => {
		const unused: string[] = [];
		const catalogue = en as unknown as Tree;
		for (const [section, entries] of Object.entries(catalogue)) {
			if (section === 'lang') continue;
			const source = sources.get(sectionFile(section));
			if (source === undefined) {
				unused.push(`${section}: no component ${sectionFile(section)}`);
				continue;
			}
			for (const key of Object.keys(entries as Tree)) {
				const direct = source.includes(`strings().${section}.${key}`);
				// Texts read as an object (`strings().kbd`, `strings().statusDot.statuses`).
				const asObject = source.includes(`strings().${section}`) && new RegExp(`\\b${key}\\b`).test(source);
				if (!direct && !asObject) unused.push(`${section}.${key}`);
			}
		}
		expect(unused).toEqual([]);
	});

	it('only imports the strings it renders from the reactive module', () => {
		for (const [file, source] of sources) {
			if (!/strings\(\)|formatLocale\(/.test(source)) continue;
			expect(source, file).toMatch(/from '\.\/strings\.svelte\.js'/);
		}
	});
});

// The bundle type is checked at compile time: a missing German text does not compile.
export const _typed: KernBundle = de;
