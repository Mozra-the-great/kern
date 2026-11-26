/**
 * The Code theme source (#37): brands/code.css is generated from code.tokens.json, every sourced value
 * agrees with the design snapshot, and the drift check fails when the design changes without the theme.
 * The guard against operator-specific values (#37) and the component tokens of #38 are checked here too.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
// @ts-expect-error plain ESM script without types
import {
	checkSource,
	diffSnapshots,
	generateCss,
	norm,
	parseCss,
	parseRef,
	readIfExists,
	SNAPSHOT_FILE,
	SOURCE_FILE
} from '../../scripts/ci/code-theme.mjs';
// @ts-expect-error plain ESM script without types
import { allowedHost, parseTerms, scanText } from '../../scripts/ci/neutrality.mjs';
import { loadRules, resolveTokens, themeVariants } from '../tokens/theme-css.ts';

interface Entry {
	value: string;
	from?: string;
	design?: string | null;
	note?: string;
}
interface Block {
	variants: '*' | string[];
	media?: string;
	tokens: Record<string, string | Entry>;
}
interface Source {
	theme: string;
	aliases: string[];
	blocks: Block[];
	unused: Record<string, string>;
}
interface Snapshot {
	values: Record<string, string | boolean | null>;
	roots: Record<string, string[]>;
}

const source = JSON.parse(readFileSync(SOURCE_FILE, 'utf8')) as Source;
const snapshot = JSON.parse(readFileSync(SNAPSHOT_FILE, 'utf8')) as Snapshot;
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

describe('code.tokens.json is the source of brands/code.css', () => {
	it('the checked-in CSS is exactly the generated one', () => {
		const css = readFileSync('src/lib/themes/brands/code.css', 'utf8').replace(/\r\n/g, '\n');
		expect(css).toBe(generateCss(source));
	});

	it('agrees with the design snapshot', () => {
		expect(checkSource(source, snapshot)).toEqual([]);
	});

	it('fails when a design value changes without the theme', () => {
		const changed = clone(snapshot);
		changed.values['design:stuff.css|:root{--pink}'] = '#ff0099';
		expect(checkSource(source, changed).join('\n')).toContain('--k-accent');
	});

	it('fails when the design gets a token the theme does not decide on', () => {
		const changed = clone(snapshot);
		changed.roots['design:stuff.css|:root'] = [...(changed.roots['design:stuff.css|:root'] ?? []), '--teal'];
		changed.values['design:stuff.css|:root{--teal}'] = '#00b3b3';
		expect(checkSource(source, changed).join('\n')).toContain('--teal');
	});

	it('fails when a mockup literal disappears', () => {
		const changed = clone(snapshot);
		const ref = Object.keys(changed.values).find((r) => r.startsWith('design:S.dc.html#')) ?? '';
		changed.values[ref] = false;
		expect(checkSource(source, changed).join('\n')).toContain('no longer contains');
	});

	it('fails on a token without a source and without a note', () => {
		const changed = clone(source);
		const first = changed.blocks[0];
		if (first) first.tokens['--k-made-up'] = { value: '3px' };
		expect(checkSource(changed, snapshot).join('\n')).toContain('--k-made-up');
	});

	it('reports a changed or new design value against a stuffcloud checkout (--against)', () => {
		const now = clone(snapshot);
		now.values['design:stuff.css|.btn{font}'] = '500 16px var(--sans)';
		now.roots['app:styles/theme.css|:root'] = [...(now.roots['app:styles/theme.css|:root'] ?? []), '--bg-info'];
		const diff = diffSnapshots(snapshot, now, { skipDs: false }).join('\n');
		expect(diff).toContain('.btn{font}');
		expect(diff).toContain('--bg-info');
		expect(diffSnapshots(snapshot, clone(snapshot), { skipDs: false })).toEqual([]);
	});

	it('names every variant with both spellings, so the aliases stay complete', () => {
		expect(source.theme).toBe('code');
		expect(source.aliases).toEqual(['stuffcloud']);
		const css = generateCss(source);
		for (const v of ['', '-dark', '-light', '-paper', '-contrast']) {
			if (v === '') continue;
			expect(css).toContain(`[data-theme='code${v}']`);
			expect(css).toContain(`[data-theme='stuffcloud${v}']`);
		}
	});

	it('reads a file in one step: its text, or null when it is missing (no check-then-read race)', () => {
		expect(readIfExists(SOURCE_FILE)).toContain('"theme": "code"');
		expect(readIfExists('tests/unit/does-not-exist.json')).toBeNull();
		expect(() => readIfExists('tests/unit')).toThrow();
	});

	it('parses the reference forms and normalises values', () => {
		expect(parseRef('design:stuff.css|@media (max-width:760px)|.btn{min-height}')).toMatchObject({
			media: '(max-width:760px)',
			selector: '.btn'
		});
		expect(parseRef('ds:surface@light')).toMatchObject({ kind: 'ds', name: 'surface', theme: 'light' });
		expect(parseRef('design:S.dc.html#gap: 24px')).toMatchObject({ kind: 'literal', text: 'gap: 24px' });
		expect(norm('8px 8px 0 rgba(16,16,18,.6)')).toBe(norm('8px 8px 0 rgba(16, 16, 18, 0.6)'));
		const rules = parseCss('.a{color:red}@media (max-width: 760px){.a{color:blue}}');
		expect(rules).toHaveLength(2);
		expect(rules[1]).toMatchObject({ media: '(max-width:760px)', selector: '.a' });
	});
});

describe('component tokens (#38) leave the other themes as they were', () => {
	const rules = loadRules('src/lib/themes/index.css');
	/** New token -> the token (or value, which may name tokens in `var()`) the component read before. */
	const BEFORE: Record<string, string> = {
		'--k-button-font': '--k-label-font',
		'--k-button-size': '--k-label-size',
		'--k-button-weight': '--k-weight-label',
		'--k-button-transform': '--k-label-transform',
		'--k-button-tracking': '--k-label-tracking',
		'--k-button-pad-x': '--k-space-5',
		'--k-button-gap': '--k-space-2',
		'--k-button-secondary-border': '--k-border',
		'--k-button-secondary-weight': '--k-weight-label',
		'--k-button-secondary-hover-bg': '--k-bg-sunken',
		'--k-button-leading': '1.2',
		'--k-button-press-offset': '1px',
		'--k-button-danger-hover-as-primary': '0',
		'--k-button-danger-hover-filter': 'brightness(0.92)',
		'--k-field-font': 'initial',
		'--k-field-size': '--k-text-md',
		'--k-field-bg': '--k-bg-raised',
		'--k-select-bg': '--k-bg-raised',
		'--k-field-pad-x': '--k-space-4',
		'--k-field-disabled-opacity': '0.55',
		'--k-field-label-color': '--k-fg',
		'--k-field-hint-font': 'initial',
		'--k-field-hint-size': '--k-text-sm',
		'--k-field-hint-color': '--k-fg-hint',
		'--k-field-hover-border': '--k-fg-muted',
		'--k-field-error-icon': 'block',
		'--k-select-appearance': 'none',
		'--k-select-chevron': 'block',
		'--k-select-pad-end': 'calc(var(--k-field-pad-x) + 24px)',
		'--k-check-gap': '--k-space-3',
		'--k-check-checked': '--k-primary',
		'--k-check-mark': '--k-on-primary',
		'--k-check-label-size': 'initial',
		'--k-check-disabled-opacity': '0.5',
		'--k-check-appearance': 'none',
		'--k-check-tick': 'block',
		'--k-check-row-h': '--k-tap-target',
		'--k-check-disabled-fg': 'initial',
		'--k-card-bg': '--k-bg-raised',
		'--k-card-pad': '--k-space-6',
		'--k-card-gap': '--k-space-4',
		'--k-tabs-gap': '--k-space-1',
		'--k-tabs-scrollbar': 'thin',
		'--k-tab-h': '--k-control-h',
		'--k-tab-pad-x': '--k-space-4',
		'--k-tab-font': '--k-label-font',
		'--k-tab-size': '--k-label-size',
		'--k-tab-weight': '--k-weight-label',
		'--k-tab-selected-weight': '--k-weight-label',
		'--k-tab-transform': '--k-label-transform',
		'--k-tab-tracking': '--k-label-tracking',
		'--k-tab-fg': '--k-fg-muted',
		'--k-tab-hover-fg': '--k-fg',
		'--k-tab-selected-bg': 'transparent',
		'--k-tab-divider-w': '0px',
		'--k-tabs-fade-start': '36px',
		'--k-tabs-fade-end': '36px',
		'--k-modal-bg': '--k-bg-raised',
		'--k-modal-pad': '--k-space-6',
		'--k-modal-gap': '--k-space-4',
		'--k-modal-title-size': '--k-text-lg',
		'--k-modal-title-tracking': '0',
		'--k-modal-title-leading': '1.3',
		'--k-modal-actions-direction': 'row',
		'--k-modal-action-w': 'auto',
		'--k-modal-width': 'initial',
		'--k-modal-margin': 'auto',
		'--k-modal-border-w': '--k-border-w',
		'--k-modal-shadow': '--k-shadow-overlay',
		'--k-modal-enter-dur': '--k-dur',
		'--k-modal-close-inset': 'calc(12px - var(--k-tap-icon) / 2)',
		'--k-close-fg': '--k-fg-muted',
		'--k-close-hover-bg': '--k-bg-sunken',
		'--k-close-border-w': '0px',
		'--k-modal-close-icon': '16px',
		'--k-toast-close-icon': '14px',
		'--k-close-stroke': '2',
		'--k-progress-track': '--k-bg-sunken',
		'--k-progress-track-border-w': '--k-border-w',
		'--k-toaster-width': '400px',
		'--k-toast-msg-size': '--k-text-sm',
		'--k-toast-pad': '12px 12px 12px 16px',
		'--k-toast-ok-border': '--k-line-strong',
		'--k-toast-warn-border': '--k-line-strong',
		'--k-toast-dot': 'block',
		'--k-toast-align': 'flex-start',
		'--k-toast-text-offset': '2px',
		'--k-toast-close-size': '32px',
		'--k-toast-enter-dur': '--k-dur',
		'--k-filedrop-bg': '--k-bg-sunken',
		'--k-filedrop-pad': '24px 16px',
		'--k-filedrop-prompt-font': '--k-label-font',
		'--k-filedrop-prompt-size': '--k-label-size',
		'--k-filedrop-prompt-weight': '--k-weight-label',
		'--k-filedrop-prompt-transform': '--k-label-transform',
		'--k-filedrop-prompt-tracking': '--k-label-tracking',
		'--k-filedrop-icon': 'block',
		'--k-filedrop-drag-ring': '--k-border-w',
		'--k-filedrop-split-gap': 'var(--k-space-3) var(--k-space-4)',
		'--k-filedrop-prompt-basis': '10em'
	};
	/** Not a component token: what the themed element read before (its line height was a fixed 1.5). */
	const BEFORE_ELEMENT: Record<string, string> = { '--k-leading-body': '1.5' };
	const others = themeVariants(rules).filter((t) => !/^(code|stuffcloud)/.test(t));

	it('covers every component token of base.css', () => {
		const base = resolveTokens(loadRules('src/lib/themes/base.css'), 'none');
		const listed = Object.keys(BEFORE);
		const start = [...base.keys()].indexOf('--k-button-font');
		expect(start).toBeGreaterThan(0);
		expect([...base.keys()].slice(start)).toEqual(listed);
	});

	it.each(others)('%s resolves each one to what the component read before', (theme) => {
		const t = resolveTokens(rules, theme);
		for (const [name, was] of Object.entries({ ...BEFORE, ...BEFORE_ELEMENT })) {
			const want = was.startsWith('--') ? t.get(was) : was.replace(/var\((--[\w-]+)\)/g, (m, n: string) => t.get(n) ?? m);
			expect(t.get(name), `${name} in ${theme}`).toBe(want);
		}
	});

	it('--k-leading-body (#145): 1.5 for every theme but Code, `normal` for Code, its variants and the aliases', () => {
		const code = themeVariants(rules).filter((t) => /^(code|stuffcloud)/.test(t));
		expect(code).toEqual(
			expect.arrayContaining(['code-dark', 'code-light', 'code-paper', 'code-contrast', 'stuffcloud', 'stuffcloud-light'])
		);
		for (const theme of code) expect(resolveTokens(rules, theme).get('--k-leading-body'), theme).toBe('normal');
		expect(others).toEqual(expect.arrayContaining(['flower', 'pop', 'line']));
		for (const theme of others) expect(resolveTokens(rules, theme).get('--k-leading-body'), theme).toBe('1.5');
		// the unthemed root keeps the base value
		expect(resolveTokens(rules, 'none').get('--k-leading-body')).toBe('1.5');
	});
});

describe('instance-neutrality guard', () => {
	it('finds addresses, URLs, domains and IPs, and allows the reserved names', () => {
		const hits = (text: string, svg = false): string[] => (scanText(text, [], { svg }) as [number, string][]).map(([, m]) => m);
		expect(hits('mail me at someone@stuff.example.de')).toEqual(expect.arrayContaining(['an e-mail address']));
		expect(hits('see https://files.example-operator.com/x').join()).toContain('a URL');
		expect(hits('served from cloud.someoperator.de').join()).toContain('a domain name');
		expect(hits('host 192.168.0.10').join()).toContain('IPv4');
		expect(hits('<path d="M1.5.3.2.4"/>', true)).toEqual([]);
		expect(hits('xmlns="http://www.w3.org/2000/svg" from claude.ai artifacts, site.example.com, a.sites.test')).toEqual([]);
		expect(hits('brands/code.css, manifest.json, stuff.css, S.dc.html, .k-button')).toEqual([]);
		expect(allowedHost('example.org')).toBe(true);
		expect(allowedHost('real-operator.net')).toBe(false);
	});

	it('matches the forbidden terms by entry number without printing them', () => {
		const terms = parseTerms('# operator\nJane Doe, ops-host;\nmy-instance.de');
		expect(terms).toEqual(['Jane Doe', 'ops-host', 'my-instance.de']);
		const found = (scanText('built by jane doe on OPS-HOST', terms) as [number, string][]).map(([, m]) => m);
		expect(found).toEqual(['forbidden term (entry 1)', 'forbidden term (entry 2)']);
		expect(found.join()).not.toMatch(/jane|ops-host/i);
		expect(parseTerms('ab')).toBeNull();
		expect(parseTerms('')).toEqual([]);
	});
});
