/**
 * Brand isolation (issue #39): a consumer that imports one theme entry
 * (`@mozra-the-great/kern/themes/stuffcloud.css`) must get the base tokens and that
 * brand only. Builds a fixture per entry with Vite, the bundler the consumers use,
 * and inspects the emitted CSS.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { build, type Rollup } from 'vite';
import { describe, expect, it } from 'vitest';

const THEMES = resolve('src/lib/themes');
const BRANDS = ['stuffcloud', 'flower', 'pop'] as const;

/** Bundles `import '<entry>'` and returns the CSS Vite emits for it. */
async function bundleCss(entry: string): Promise<string> {
	const id = '\0kern-theme-fixture';
	const out = await build({
		configFile: false,
		logLevel: 'silent',
		plugins: [
			{
				name: 'kern-theme-fixture',
				resolveId: (source) => (source === 'kern-theme-fixture' ? id : null),
				load: (source) => (source === id ? `import ${JSON.stringify(entry)};` : null)
			}
		],
		build: {
			write: false,
			cssMinify: false,
			cssCodeSplit: false,
			rollupOptions: { input: 'kern-theme-fixture' }
		}
	});
	const outputs = (Array.isArray(out) ? out : [out]) as Rollup.RollupOutput[];
	const css = outputs
		.flatMap((o) => o.output)
		.filter((f): f is Rollup.OutputAsset => f.type === 'asset' && f.fileName.endsWith('.css'))
		.map((f) => (typeof f.source === 'string' ? f.source : new TextDecoder().decode(f.source)))
		.join('\n');
	if (!css) throw new Error(`No CSS emitted for ${entry}`);
	return css.toLowerCase();
}

/** `[data-theme^='brand']` / `[data-theme='brand-x']` in any quoting. */
const selectorOf = (brand: string): RegExp => new RegExp(`\\[data-theme[\\^]?=\\s*['"]?${brand}`);

/** Hex colours a brand file uses that neither base.css nor `other` uses. */
function ownColours(brand: string, other: string): string[] {
	const hex = (file: string): Set<string> =>
		new Set((readFileSync(resolve(THEMES, file), 'utf8').toLowerCase().match(/#[0-9a-f]{6}\b/g) ?? []));
	const mine = hex(`brands/${brand}.css`);
	const shared = new Set([...hex('base.css'), ...hex(`brands/${other}.css`)]);
	return [...mine].filter((c) => !shared.has(c));
}

describe.each(BRANDS)('themes/%s.css', (brand) => {
	it('ships the base tokens and its own brand, nothing else', async () => {
		const css = await bundleCss(resolve(THEMES, `${brand}.css`));
		expect(css).toContain('--k-bg:');
		expect(css).toContain('--k-accent-mark:');
		expect(css).toMatch(selectorOf(brand));
		for (const other of BRANDS.filter((b) => b !== brand)) {
			expect(css, `${other} selector in the ${brand} entry`).not.toMatch(selectorOf(other));
			for (const colour of ownColours(other, brand)) {
				expect(css, `${other} colour ${colour} in the ${brand} entry`).not.toContain(colour);
			}
		}
	}, 30_000);
});

describe('themes.css (index)', () => {
	it('still ships every brand', async () => {
		const css = await bundleCss(resolve(THEMES, 'index.css'));
		for (const brand of BRANDS) expect(css).toMatch(selectorOf(brand));
	}, 30_000);
});
