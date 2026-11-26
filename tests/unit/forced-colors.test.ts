/**
 * Forced colors (#27): the rule that no component is added without one. Every component with a
 * <style> block either carries an `@media (forced-colors: active)` rule or is listed here with the
 * reason it needs none (text, a border that forced colors keep, a decoration). The behaviour of the
 * rules is tested in the browser (tests/elements/forced-colors.spec.ts).
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const COMPONENTS = 'src/lib/components';
const FORCED = '@media (forced-colors: active)';

/** Components without a rule of their own, and why they do not need one. */
const EXEMPT: Record<string, string> = {
	Accordion: 'one border-top, drawn with a border (kept); the items carry the rules',
	Avatar: 'a bordered circle with text or an image',
	Badge: 'a bordered pill (transparent border is still drawn); tone is in the text',
	CodeBlock: 'wraps Code, which carries the rules',
	CountUp: 'text',
	Divider: 'a rule drawn with borders (kept)',
	EmptyState: 'text, a bordered icon box and slotted actions',
	GridBackground: 'a decorative pattern behind content',
	Kbd: 'bordered keys',
	Label: 'text',
	Link: 'a link: LinkText with an underline and an outline ring, from the user agent palette',
	LiveAnnouncer: 'visually hidden live regions',
	Marquee: 'moving text; its pause button has a border',
	Mascot: 'an image, which forced colors leave alone',
	Odometer: 'text',
	RelativeTime: 'text with a dotted underline',
	Reveal: 'an animation wrapper',
	Scramble: 'text',
	ScrollArea: 'a region whose focus ring is an outline (kept); scrollbars follow the system',
	Stat: 'a bordered card of text; the delta has an arrow glyph',
	StatusDot: 'a glyph whose shape (not its colour) carries the status',
	Sticker: 'an image, which forced colors leave alone',
	Typewriter: 'text',
	VisuallyHidden: 'not painted at all: text for assistive technology only'
};

const files = readdirSync(COMPONENTS).filter((f) => f.endsWith('.svelte'));
const source = (file: string): string => readFileSync(join(COMPONENTS, file), 'utf8');
const hasStyle = (file: string): boolean => source(file).includes('<style>');

describe('forced colors rules', () => {
	it('finds the components', () => {
		expect(files.length).toBeGreaterThan(80);
	});

	it('every component with styles has a forced-colors rule or a reason in EXEMPT', () => {
		const missing = files.filter((f) => hasStyle(f) && !source(f).includes(FORCED) && !(f.replace('.svelte', '') in EXEMPT));
		expect(
			missing,
			'add an `@media (forced-colors: active)` rule (see CONTRIBUTING.md) or list the component in EXEMPT with a reason'
		).toEqual([]);
	});

	it('EXEMPT lists only components that exist and still have no rule', () => {
		for (const name of Object.keys(EXEMPT)) {
			expect(files, `${name} exists`).toContain(`${name}.svelte`);
			expect(source(`${name}.svelte`), `${name} has a rule now: remove it from EXEMPT`).not.toContain(FORCED);
			expect(EXEMPT[name]?.length, `${name} has a reason`).toBeGreaterThan(3);
		}
	});

	it('components use system colours inside the rule, never a theme token as a colour', () => {
		for (const file of files) {
			const css = source(file);
			let from = css.indexOf(FORCED);
			while (from !== -1) {
				// the block ends at its matching closing brace
				let depth = 0;
				let end = from;
				for (let i = css.indexOf('{', from); i < css.length; i++) {
					if (css[i] === '{') depth++;
					if (css[i] === '}' && --depth === 0) {
						end = i;
						break;
					}
				}
				const block = css.slice(from, end);
				const tokens = [
					...block.matchAll(
						/(?:color|background(?:-color)?|border(?:-[a-z]+)?|outline|fill|stroke):[^;]*var\(--k-(?!tap|focus-w|focus-offset|border-w|dur|ease|progress|space|radius)([a-z-]+)\)/g
					)
				];
				expect(
					tokens.map((m) => m[0]),
					`${file}: a forced-colors rule paints with a theme colour token`
				).toEqual([]);
				from = css.indexOf(FORCED, end);
			}
		}
	});

	it('base.css keeps the shared block theme-proof: every declaration is !important', () => {
		const css = readFileSync('src/lib/themes/base.css', 'utf8');
		const start = css.indexOf(FORCED);
		expect(start, 'base.css has the forced-colors block').toBeGreaterThan(0);
		const block = css.slice(start, css.indexOf('\n}\n', start));
		const declarations = block.split('\n').filter((l) => /^\s*--k-[a-z-]+:/.test(l));
		expect(declarations.length).toBeGreaterThan(10);
		for (const line of declarations) expect(line, 'a theme could override it').toContain('!important');
	});

	it('the shared block sets the edge, focus, accent and disabled tokens to system colours', () => {
		const css = readFileSync('src/lib/themes/base.css', 'utf8');
		const block = css.slice(css.indexOf(FORCED), css.indexOf('\n}\n', css.indexOf(FORCED)));
		for (const [token, value] of [
			['--k-border', 'ButtonText'],
			['--k-line', 'CanvasText'],
			['--k-focus', 'Highlight'],
			['--k-accent-mark', 'Highlight'],
			['--k-fg-disabled', 'GrayText'],
			['--k-disabled-opacity', '1']
		] as const)
			expect(block).toContain(`${token}: ${value} !important`);
	});
});
