/**
 * Forced colors (Windows high contrast, #27) in the browser: every custom element on
 * tests/elements/pages/forced-colors.html under `forcedColors: 'active'`.
 *
 * Per element (the CASES table, one test each; a new element without an entry fails the coverage
 * test): its edge is visible (a border, outline or link underline, never the background alone), the
 * focus ring shows after keyboard focus, its states differ in more than the background colour
 * (selected / checked / current / pressed / invalid / open ...), and disabled parts are GrayText.
 * Overlays are opened and checked for an edge and a visible roving item. A last group checks that no
 * theme colour leaks into the forced palette (every colour that is painted is a system colour), in
 * five themes and both system palettes, and that axe finds no serious or critical violation.
 *
 * Why computed styles: under forced colors the browser replaces the authored colours, so the
 * computed values are what the user sees; the checks read them instead of comparing pixels (the
 * screenshots are in visual.spec.ts).
 */
import { expect, test, type JSHandle, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { axeViolations } from './axe.js';

const PAGE = '/tests/elements/pages/forced-colors.html';

type SystemColor = 'Canvas' | 'CanvasText' | 'ButtonText' | 'GrayText' | 'Highlight' | 'HighlightText' | 'LinkText' | 'MarkText';
type Entry = string | [focus: string, ring: string];

interface Case {
	/** Parts that must show an edge (border, outline, or link underline). `sel::pseudo` is allowed. */
	edge?: string[];
	/** Parts that take keyboard focus; `[focus, ring]` when the ring is drawn on another part. */
	focus?: Entry[];
	/** Two states that must differ in more than the background colour (`bg`: the fill is the data). */
	states?: { name: string; a: string; b: string; bg?: boolean }[];
	/** Parts whose computed colour must be a system colour: [selector, property, colour]. */
	uses?: [selector: string, property: string, color: SystemColor][];
	/** Puts the page in a state first (selection, sorting ...). */
	prepare?: (page: Page) => Promise<void>;
	/** Why the element has no edge or state of its own to check (text, decoration, hidden helpers). */
	exempt?: string;
}

interface FcApi {
	palette: () => Record<SystemColor, string>;
	edge: (el: Element, pseudo?: string) => boolean;
	outline: (el: Element, pseudo?: string) => boolean;
	border: (el: Element, pseudo?: string) => string;
	signature: (el: Element, background: boolean) => string;
	computed: (el: Element, property: string, pseudo?: string) => string;
	leaks: () => string[];
}
interface FcWindow {
	__fc: FcApi;
	errors: string[];
}

/** Defines window.__fc in every page before its scripts run. Runs in the browser. */
function installProbe(): void {
	const NAMES: SystemColor[] = ['Canvas', 'CanvasText', 'ButtonText', 'GrayText', 'Highlight', 'HighlightText', 'LinkText', 'MarkText'];
	const EXTRA = [
		'ButtonFace',
		'ButtonBorder',
		'Field',
		'FieldText',
		'VisitedText',
		'ActiveText',
		'Mark',
		'SelectedItem',
		'SelectedItemText',
		'AccentColor',
		'AccentColorText'
	];
	const SIDES = ['top', 'right', 'bottom', 'left'] as const;
	const visible = (c: string): boolean => c !== 'transparent' && !/^rgba\([^)]*,\s*0\)$/.test(c) && !/\/ 0\)$/.test(c);
	const sideOf = (cs: CSSStyleDeclaration, side: string): string =>
		[
			cs.getPropertyValue(`border-${side}-width`),
			cs.getPropertyValue(`border-${side}-style`),
			cs.getPropertyValue(`border-${side}-color`)
		].join(' ');

	const outline = (el: Element, pseudo?: string): boolean => {
		const cs = getComputedStyle(el, pseudo);
		return cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0 && visible(cs.outlineColor);
	};
	const edge = (el: Element, pseudo?: string): boolean => {
		const cs = getComputedStyle(el, pseudo);
		const border = SIDES.some(
			(s) =>
				parseFloat(cs.getPropertyValue(`border-${s}-width`)) > 0 &&
				cs.getPropertyValue(`border-${s}-style`) !== 'none' &&
				visible(cs.getPropertyValue(`border-${s}-color`))
		);
		const link = el.matches('a') && cs.textDecorationLine.includes('underline');
		return border || link || outline(el, pseudo);
	};
	const border = (el: Element, pseudo?: string): string => {
		const cs = getComputedStyle(el, pseudo);
		return [...SIDES.map((s) => sideOf(cs, s)), cs.outlineStyle, cs.outlineWidth, cs.outlineColor, cs.textDecorationLine].join(';');
	};

	const describe = (el: Element, background: boolean): string => {
		const cs = getComputedStyle(el);
		const r = el.getBoundingClientRect();
		const parts = [
			el.tagName,
			cs.display,
			cs.visibility,
			cs.opacity,
			cs.color,
			cs.fontWeight,
			cs.textDecorationLine,
			cs.transform,
			cs.fill,
			cs.stroke,
			cs.strokeDasharray,
			cs.borderTopLeftRadius,
			el.getAttribute('d') ?? '',
			String(Math.round(r.width)),
			String(Math.round(r.height)),
			SIDES.map((s) => sideOf(cs, s)).join(','),
			`${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}`
		];
		if (background) parts.push(cs.backgroundColor);
		for (const pseudo of ['::before', '::after']) {
			const p = getComputedStyle(el, pseudo);
			if (p.content !== 'none' && p.content !== 'normal')
				parts.push(
					`${pseudo} ${p.content} ${p.display} ${p.opacity} ${p.transform} ${p.width} ${p.height} ${p.borderTopStyle} ${p.borderTopColor}${background ? ` ${p.backgroundColor}` : ''}`
				);
		}
		return parts.join('|');
	};
	/** The element and everything below it, as computed styles without the background colour (unless asked). */
	const signature = (el: Element, background: boolean): string =>
		[el, ...el.querySelectorAll('*')].map((e) => describe(e, background)).join('\n');

	const probeColor = (name: string): string => {
		const probe = document.createElement('div');
		probe.style.cssText = `forced-color-adjust:none;color:${name}`;
		document.body.append(probe);
		const value = getComputedStyle(probe).color;
		probe.remove();
		return value;
	};
	const palette = (): Record<SystemColor, string> =>
		Object.fromEntries(NAMES.map((n) => [n, probeColor(n)])) as Record<SystemColor, string>;

	/** Every painted colour that is not a system colour, outside elements that opt out (forced-color-adjust: none). */
	const leaks = (): string[] => {
		const known = new Set([...NAMES, ...EXTRA].map(probeColor));
		const props = [
			'color',
			'background-color',
			'border-top-color',
			'border-right-color',
			'border-bottom-color',
			'border-left-color',
			'outline-color',
			'fill',
			'stroke'
		];
		const rows: string[] = [];
		const walk = (root: Document | ShadowRoot, host: string): void => {
			for (const el of root.querySelectorAll('*')) {
				if (el.shadowRoot) walk(el.shadowRoot, el.tagName.toLowerCase());
				const cs = getComputedStyle(el);
				if (cs.display === 'none' || cs.visibility === 'hidden' || cs.forcedColorAdjust === 'none') continue;
				const r = el.getBoundingClientRect();
				if (r.width < 1 || r.height < 1) continue;
				for (const p of props) {
					const v = cs.getPropertyValue(p);
					if (!v || v === 'none' || known.has(v) || !visible(v) || v.startsWith('url(')) continue;
					if (p.startsWith('border') && cs.getPropertyValue(p.replace('color', 'style')) === 'none') continue;
					if (p === 'outline-color' && cs.outlineStyle === 'none') continue;
					rows.push(
						`${host} <${el.tagName.toLowerCase()} class="${(el.getAttribute('class') ?? '').replace(/svelte-\w+/g, '').trim()}"> ${p}=${v}`
					);
				}
			}
		};
		walk(document, 'page');
		return [...new Set(rows)];
	};

	(window as unknown as FcWindow).__fc = {
		palette,
		edge,
		outline,
		border,
		signature,
		computed: (el, property, pseudo) => getComputedStyle(el, pseudo).getPropertyValue(property),
		leaks
	};
}

async function open(page: Page, options: { theme?: string; scheme?: 'dark' | 'light'; width?: number } = {}): Promise<void> {
	await page.emulateMedia({ forcedColors: 'active', colorScheme: options.scheme ?? 'dark', reducedMotion: 'reduce' });
	await page.setViewportSize({ width: options.width ?? 1280, height: 4000 });
	await page.addInitScript(installProbe);
	await page.goto(`${PAGE}?theme=${options.theme ?? 'code'}`);
	await page.waitForFunction(
		() =>
			[...document.querySelectorAll('*')]
				.filter((el) => el.tagName.startsWith('K-'))
				.every((el) => customElements.get(el.tagName.toLowerCase()) && el.shadowRoot?.firstElementChild),
		undefined,
		{ polling: 100 }
	);
	// the sortable list and the select grid get their items from a module script on the page
	await page.waitForFunction(() => document.querySelector('#selectgrid')?.shadowRoot?.querySelector('[role=option]'), undefined, {
		polling: 100
	});
	await page.evaluate(() => document.fonts.ready);
}

interface Target {
	handle: JSHandle<Element>;
	pseudo: string | undefined;
}

/** The first match of a Playwright CSS selector (it pierces shadow roots); `sel::pseudo` selects a pseudo-element. */
async function target(page: Page, selector: string): Promise<Target | null> {
	const [sel, pseudo] = selector.split('::') as [string, string | undefined];
	const locator = page.locator(sel).first();
	if ((await locator.count()) === 0) return null;
	return { handle: (await locator.elementHandle()) as JSHandle<Element>, pseudo: pseudo ? `::${pseudo}` : undefined };
}

async function failuresOf(page: Page, c: Case): Promise<string[]> {
	const failures: string[] = [];
	const palette = await page.evaluate(() => (window as unknown as FcWindow).__fc.palette());
	for (const selector of c.edge ?? []) {
		const t = await target(page, selector);
		if (!t) failures.push(`edge: ${selector} not found`);
		else if (
			!(await page.evaluate(([el, p]) => (window as unknown as FcWindow).__fc.edge(el as Element, p as string | undefined), [
				t.handle,
				t.pseudo
			] as const))
		)
			failures.push(`edge: ${selector} has no border, outline or underline`);
	}
	for (const entry of c.focus ?? []) {
		const [focusSel, ringSel] = typeof entry === 'string' ? [entry, entry] : entry;
		const focusTarget = await target(page, focusSel);
		if (!focusTarget) {
			failures.push(`focus: ${focusSel} not found`);
			continue;
		}
		await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
		const ringBefore = await target(page, ringSel);
		const before = ringBefore
			? await page.evaluate(([el, p]) => (window as unknown as FcWindow).__fc.border(el as Element, p as string | undefined), [
					ringBefore.handle,
					ringBefore.pseudo
				] as const)
			: null;
		// a key press first: :focus-visible follows the last input modality
		await page.keyboard.press('Shift');
		await page
			.locator(focusSel.split('::')[0] as string)
			.first()
			.focus();
		const ring = await target(page, ringSel);
		if (!ring) {
			failures.push(`focus: ${ringSel} not found after focusing ${focusSel}`);
			continue;
		}
		const after = await page.evaluate(
			([el, p]) => {
				const api = (window as unknown as FcWindow).__fc;
				return { outline: api.outline(el as Element, p as string | undefined), border: api.border(el as Element, p as string | undefined) };
			},
			[ring.handle, ring.pseudo] as const
		);
		if (!after.outline && (before === null || before === after.border))
			failures.push(`focus: no visible ring on ${ringSel} after focusing ${focusSel}`);
	}
	for (const s of c.states ?? []) {
		const [a, b] = [await target(page, s.a), await target(page, s.b)];
		if (!a || !b) {
			failures.push(`state ${s.name}: ${a ? s.b : s.a} not found`);
			continue;
		}
		const [sa, sb] = await Promise.all(
			[a, b].map((t) =>
				page.evaluate(([el, bg]) => (window as unknown as FcWindow).__fc.signature(el as Element, bg as boolean), [
					t.handle,
					s.bg ?? false
				] as const)
			)
		);
		if (sa === sb) failures.push(`state ${s.name}: ${s.a} and ${s.b} look the same${s.bg ? '' : ' (background colour not counted)'}`);
	}
	for (const [selector, property, color] of c.uses ?? []) {
		const t = await target(page, selector);
		if (!t) {
			failures.push(`uses: ${selector} not found`);
			continue;
		}
		const value = await page.evaluate(
			([el, p, pseudo]) => (window as unknown as FcWindow).__fc.computed(el as Element, p as string, pseudo as string | undefined),
			[t.handle, property, t.pseudo] as const
		);
		if (value !== palette[color]) failures.push(`uses: ${selector} ${property} is ${value}, expected ${color} (${palette[color]})`);
		// disabled is GrayText at full strength: a dimmed GrayText would be unreadable
		if (color === 'GrayText' && !t.pseudo) {
			const opacity = await page.evaluate(([el]) => (window as unknown as FcWindow).__fc.computed(el as Element, 'opacity'), [
				t.handle
			] as const);
			if (opacity !== '1') failures.push(`uses: ${selector} is GrayText but dimmed (opacity ${opacity})`);
		}
	}
	return failures;
}

const input = '#input-invalid .k-input';

/** The table: one entry per custom element. */
const CASES: Record<string, Case> = {
	'k-accordion': {
		edge: ['#accordion .k-accordion'],
		focus: ['#accordion summary'],
		states: [{ name: 'open vs closed chevron', a: '#accordion details[open] > summary', b: '#accordion details:not([open]) > summary' }]
	},
	'k-accordion-item': { edge: ['#accordion details'], focus: ['#accordion summary'] },
	'k-alert': {
		edge: ['#alert-info .k-alert', '#alert-danger .k-alert', '#alert-warn .x'],
		focus: ['#alert-warn .x'],
		states: [{ name: 'danger vs info', a: '#alert-danger .k-alert', b: '#alert-info .k-alert' }]
	},
	'k-avatar': { edge: ['#avatar .k-avatar'] },
	'k-badge': { edge: ['#badge-neutral .k-badge', '#badge-danger .k-badge', '#badge-warn .k-badge'] },
	'k-breadcrumb': {
		edge: ['#breadcrumb a'],
		focus: ['#breadcrumb a'],
		states: [{ name: 'current vs link', a: '#breadcrumb [aria-current=page]', b: '#breadcrumb li:first-child a' }],
		uses: [['#breadcrumb a', 'color', 'LinkText']]
	},
	'k-button': {
		edge: ['#btn-primary button', '#btn-secondary button', '#btn-ghost button', '#btn-accent button', '#btn-danger button', '#btn-link a'],
		focus: ['#btn-primary button', '#btn-ghost button', '#btn-link a'],
		uses: [
			['#btn-disabled button', 'color', 'GrayText'],
			['#btn-disabled button', 'border-top-color', 'GrayText']
		]
	},
	'k-caret': { exempt: 'a blinking block drawn in CanvasText', uses: [['#caret .k-caret', 'background-color', 'CanvasText']] },
	'k-card': {
		edge: ['#card .k-card', '#card-outline .k-card'],
		focus: [
			['#card-link .primary', '#card-link .k-card'],
			['#card-button .primary', '#card-button .k-card']
		]
	},
	'k-carousel': {
		edge: ['#carousel .nav'],
		focus: ['#carousel .nav[aria-disabled=false]', '#carousel .tab[aria-selected=true]', '#carousel .track'],
		states: [{ name: 'current vs other dot', a: '#carousel .tab[aria-selected=true] .dot', b: '#carousel .tab[aria-selected=false] .dot' }],
		uses: [['#carousel .nav[aria-disabled=true]', 'color', 'GrayText']]
	},
	'k-checkbox': {
		edge: ['#check-off input'],
		focus: ['#check-off input'],
		states: [
			{ name: 'checked vs unchecked', a: '#check-on .box', b: '#check-off .box' },
			{ name: 'indeterminate vs unchecked', a: '#check-mixed .box', b: '#check-off .box' }
		],
		uses: [
			['#check-disabled input', 'border-top-color', 'GrayText'],
			['#check-on svg', 'color', 'CanvasText']
		]
	},
	'k-code': { edge: ['#code-inline .k-code', '#code-block .k-code-block'] },
	'k-code-block': { edge: ['#codeblock .k-code-block'] },
	'k-collapsible': {
		edge: ['#collapsible-open .k-collapsible'],
		focus: ['#collapsible-closed .trigger'],
		states: [{ name: 'open vs closed chevron', a: '#collapsible-open .trigger', b: '#collapsible-closed .trigger' }]
	},
	'k-color-picker': {
		edge: ['#color .k-color', '#color .swatch-btn'],
		focus: [['#color input[type=text]', '#color .k-color'], '#color .swatch-btn']
	},
	'k-combobox': {
		edge: ['#combobox .k-combobox', '#combobox .toggle'],
		focus: [['#combobox input[role=combobox]', '#combobox .k-combobox'], '#combobox .toggle']
	},
	'k-command-palette': { exempt: 'overlay: see the overlay tests' },
	'k-context-menu': { focus: [['#context .k-context-area', '#context .k-context-area']] },
	'k-copy-button': {
		edge: ['#copy .btn'],
		focus: ['#copy .btn'],
		uses: [['#copy-disabled .btn', 'color', 'GrayText']]
	},
	'k-count-up': { exempt: 'text', uses: [['#countup', 'color', 'CanvasText']] },
	'k-data-table': {
		edge: ['#datatable .k-table', '#datatable .chk input'],
		focus: ['#datatable th.sortable button', [`#datatable input[type=search]`, '#datatable .k-input'], '#datatable .chk input'],
		prepare: async (page) => {
			await page.locator('#datatable tbody tr .chk input').first().check({ force: true });
		},
		states: [
			{
				name: 'selected vs other row',
				a: '#datatable tbody tr.selected td:nth-child(2)',
				b: '#datatable tbody tr:not(.selected) td:nth-child(2)'
			},
			{ name: 'checked vs unchecked box', a: '#datatable tbody tr.selected .chk', b: '#datatable tbody tr:not(.selected) .chk' }
		],
		// the selected row opts out of forced colours; the box in it must not keep the theme fill
		uses: [['#datatable tbody tr.selected .chk input', 'background-color', 'Canvas']]
	},
	'k-date-picker': { edge: ['#date .k-date', '#date .cal'], focus: [['#date input[type=text]', '#date .k-date'], '#date .cal'] },
	'k-divider': { exempt: 'a rule drawn by borders, which forced colors keep' },
	'k-download-button': {
		edge: ['#download button'],
		focus: ['#download button'],
		uses: [
			['#download svg', 'color', 'ButtonText'],
			['#download-disabled button', 'color', 'GrayText']
		]
	},
	'k-drawer': { exempt: 'overlay: see the overlay tests' },
	'k-dropdown-menu': { edge: ['#dropdown .trigger'], focus: ['#dropdown .trigger'] },
	'k-empty-state': { exempt: 'text; its action is a k-button' },
	'k-file-drop': {
		edge: ['#filedrop .zone'],
		focus: ['#filedrop .zone'],
		uses: [
			['#filedrop-disabled .zone', 'color', 'GrayText'],
			['#filedrop-disabled .zone', 'border-top-color', 'GrayText']
		]
	},
	'k-grid-background': { exempt: 'a decorative pattern behind content' },
	'k-heatmap': {
		edge: ['#heatmap .cell[data-level="0"]'],
		focus: ['#heatmap .cell[tabindex="0"]'],
		states: [
			{ name: 'level 4 vs level 0', a: '#heatmap .cell[data-level="4"]', b: '#heatmap .cell[data-level="0"]', bg: true },
			{ name: 'level 2 vs level 0', a: '#heatmap .cell[data-level="2"]', b: '#heatmap .cell[data-level="0"]', bg: true }
		]
	},
	'k-highlight': { exempt: 'a marker behind text', uses: [['#highlight .k-highlight', 'color', 'MarkText']] },
	'k-history-bar': {
		edge: ['#history .bar[data-status=down] .fill', '#history .bar[data-status=none] .fill'],
		focus: ['#history .bar[tabindex="0"]'],
		states: [
			{ name: 'warn vs ok', a: '#history .bar[data-status=warn] .fill', b: '#history .bar[data-status=ok] .fill' },
			{ name: 'down vs ok', a: '#history .bar[data-status=down] .fill', b: '#history .bar[data-status=ok] .fill', bg: true },
			{ name: 'none vs ok', a: '#history .bar[data-status=none] .fill', b: '#history .bar[data-status=ok] .fill' }
		]
	},
	'k-icon-button': {
		edge: ['#ib button'],
		focus: ['#ib button'],
		uses: [
			['#ib-disabled button', 'color', 'GrayText'],
			['#ib-disabled button', 'border-top-color', 'GrayText']
		]
	},
	'k-input': {
		edge: ['#input .k-input'],
		focus: [['#input input', '#input .k-input']],
		states: [{ name: 'invalid vs valid', a: input, b: '#input .k-input' }],
		uses: [
			['#input-disabled .k-input', 'color', 'GrayText'],
			['#input-disabled .k-input', 'border-top-color', 'GrayText']
		]
	},
	'k-kbd': { edge: ['#kbd .key'] },
	'k-label': { exempt: 'text' },
	'k-link': { edge: ['#link a'], focus: ['#link a'], uses: [['#link a', 'color', 'LinkText']] },
	'k-live-announcer': { exempt: 'visually hidden live region' },
	'k-marquee': { exempt: 'moving text; the pause button is a bordered button shown on demand' },
	'k-mascot': { exempt: 'a raster or vector image, which forced colors leave alone' },
	'k-modal': { exempt: 'overlay: see the overlay tests' },
	'k-navbar': {
		edge: ['#navbar .k-navbar'],
		focus: ['#navbar a'],
		states: [{ name: 'current vs other link', a: '#navbar a[aria-current=page]', b: '#navbar a:not([aria-current])' }]
	},
	'k-number-input': {
		edge: ['#number .k-number', '#number .step'],
		focus: [['#number input[role=spinbutton]', '#number .k-number']]
	},
	'k-odometer': { exempt: 'text' },
	'k-online-status': { exempt: 'hidden while online; the offline notice is checked in a11y-primitives.spec.ts' },
	'k-pagination': {
		edge: ['#pagination .page', '#pagination .step'],
		focus: ['#pagination .page:not([aria-current])'],
		states: [{ name: 'current vs other page', a: '#pagination .page[aria-current=page]', b: '#pagination .page:not([aria-current])' }]
	},
	'k-pin-input': { edge: ['#pin .box'], focus: ['#pin .box'] },
	'k-popover': { edge: ['#popover .trigger'], focus: ['#popover .trigger'] },
	'k-progress': {
		edge: ['#progress .track'],
		uses: [
			['#progress .bar', 'background-color', 'Highlight'],
			['#progress-warn .bar', 'background-color', 'Highlight']
		]
	},
	'k-progress-ring': {
		uses: [
			['#ring .arc', 'stroke', 'Highlight'],
			['#ring .track', 'stroke', 'GrayText']
		]
	},
	'k-prose': { exempt: 'text', uses: [['#prose a', 'color', 'LinkText']] },
	'k-radio-group': {
		edge: ['#radio .opt:nth-child(2) input'],
		focus: ['#radio input:checked'],
		states: [
			{
				name: 'checked vs unchecked',
				a: '#radio .opt:nth-child(1) .opt, #radio .opt:nth-child(1) input',
				b: '#radio .opt:nth-child(2) input'
			}
		],
		uses: [['#radio input:disabled', 'border-top-color', 'GrayText']]
	},
	'k-rating': {
		focus: [['#rating input:checked', '#rating .star:has(input:focus-visible)']],
		states: [{ name: 'filled vs empty star', a: '#rating .star.on', b: '#rating .star:not(.on)' }],
		exempt: 'stars are SVG outlines'
	},
	'k-relative-time': { exempt: 'text' },
	'k-resizable': { edge: ['#resizable .group'], focus: [['#resizable .handle', '#resizable .handle .grip']] },
	'k-reveal': { exempt: 'a wrapper that animates its child in' },
	'k-scramble': { exempt: 'text' },
	'k-scroll-area': { focus: [['#scroll .scroller', '#scroll .k-scroll-area']] },
	'k-segmented-control': {
		edge: ['#segmented .k-segmented'],
		focus: [['#segmented input:checked', '#segmented .seg:has(input:focus-visible)']],
		states: [{ name: 'selected vs other segment', a: '#segmented .seg.on', b: '#segmented .seg:not(.on)' }]
	},
	'k-select': {
		edge: ['#select select'],
		focus: ['#select select'],
		uses: [
			['#select-disabled select', 'color', 'GrayText'],
			['#select-disabled select', 'border-top-color', 'GrayText']
		]
	},
	'k-select-grid': {
		edge: ['#selectgrid .option'],
		focus: ['#selectgrid .option[tabindex="0"]'],
		states: [
			{ name: 'selected vs other item', a: '#selectgrid .option[aria-selected=true]', b: '#selectgrid .option[aria-selected=false]' }
		]
	},
	'k-skeleton': { edge: ['#skeleton .shape'] },
	'k-skip-link': { edge: [], focus: ['#skip a'] },
	'k-slider': {
		// the track and thumb are vendor pseudo-elements without computed style: see the screenshots in visual.spec.ts
		exempt: 'track and thumb are pseudo-elements',
		focus: ['#slider input'],
		uses: [['#slider-disabled input', 'color', 'GrayText']]
	},
	'k-sortable-list': {
		edge: ['#sortable .item', '#sortable button[data-action=remove]'],
		focus: ['#sortable button[data-action=down]'],
		uses: [['#sortable button:disabled', 'color', 'GrayText']]
	},
	'k-sparkline': {
		exempt: 'a chart: the line and the end dot are CanvasText',
		uses: [
			['#sparkline .line', 'stroke', 'CanvasText'],
			['#sparkline .dot', 'background-color', 'CanvasText']
		]
	},
	'k-spinner': { uses: [['#spinner .ring', 'border-top-color', 'Highlight']] },
	'k-stat': { edge: ['#stat .k-stat'] },
	'k-status-dot': {
		exempt: 'a glyph: the shape carries the status',
		states: [
			{ name: 'ok vs down glyph', a: '#dot-ok .glyph', b: '#dot-down .glyph' },
			{ name: 'ok vs warn glyph', a: '#dot-ok .glyph', b: '#dot-warn .glyph' }
		]
	},
	'k-status-message': { states: [{ name: 'alert vs status', a: '#status-alert .k-status-message', b: '#status .k-status-message' }] },
	'k-stepper': {
		edge: ['#stepper .marker'],
		focus: ['#stepper .body.link'],
		states: [
			{ name: 'complete vs upcoming', a: '#stepper [data-state=complete] .marker', b: '#stepper [data-state=upcoming] .marker' },
			{ name: 'current vs upcoming', a: '#stepper [data-state=current] .marker', b: '#stepper [data-state=upcoming] .marker' }
		]
	},
	'k-switch': {
		edge: ['#switch-off input'],
		focus: ['#switch-off input'],
		states: [{ name: 'on vs off', a: '#switch-on .k-switch', b: '#switch-off .k-switch' }],
		uses: [['#switch-disabled input', 'border-top-color', 'GrayText']]
	},
	'k-tab-links': {
		focus: ['#tablinks a'],
		states: [
			{ name: 'current vs other (line)', a: '#tablinks a[aria-current=page]', b: '#tablinks a:not([aria-current])' },
			{ name: 'current vs other (pill)', a: '#tablinks-pill a[aria-current=page]', b: '#tablinks-pill a:not([aria-current])' }
		]
	},
	'k-table': { edge: ['#table .k-table'], focus: ['#table th button'] },
	'k-tabs': {
		edge: ['#tabs .list'],
		focus: ['#tabs button[aria-selected=true]'],
		states: [
			{
				name: 'selected vs other tab (line)',
				a: '#tabs button[aria-selected=true]',
				b: '#tabs button[aria-selected=false]:not(:disabled)'
			},
			{ name: 'selected vs other tab (pill)', a: '#tabs-pill button[aria-selected=true]', b: '#tabs-pill button[aria-selected=false]' }
		],
		uses: [['#tabs button:disabled', 'color', 'GrayText']]
	},
	'k-tag': {
		edge: ['#tag .k-tag', '#tag-removable .x'],
		focus: ['#tag-removable .x'],
		states: [{ name: 'selected vs plain', a: '#tag-selected .k-tag', b: '#tag .k-tag' }]
	},
	'k-tag-input': {
		edge: ['#taginput .k-tags', '#taginput .tag', '#taginput .x'],
		focus: [['#taginput input[role=combobox]', '#taginput .k-tags'], '#taginput .x']
	},
	'k-terminal': { edge: ['#terminal .k-terminal', '#terminal .copy'], focus: ['#terminal .copy'] },
	'k-textarea': {
		edge: ['#textarea textarea'],
		focus: ['#textarea textarea'],
		states: [{ name: 'invalid vs valid', a: '#textarea-invalid textarea', b: '#textarea textarea' }],
		uses: [['#textarea-disabled textarea', 'color', 'GrayText']]
	},
	'k-theme-toggle': {
		edge: ['#theme-toggle .switch'],
		focus: ['#theme-toggle .switch'],
		states: [{ name: 'active vs inactive mode', a: '#theme-toggle .seg.on', b: '#theme-toggle .seg:not(.on)' }]
	},
	'k-tile': { edge: ['#tile a.k-tile'], focus: ['#tile a.k-tile'] },
	'k-tile-grid': { edge: ['#tile a.k-tile'] },
	'k-timeline': {
		edge: ['#timeline .marker'],
		states: [
			{ name: 'done vs upcoming', a: '#timeline li[data-status=done] .marker', b: '#timeline li[data-status=upcoming] .marker' },
			{ name: 'current vs upcoming', a: '#timeline li[data-status=current] .marker', b: '#timeline li[data-status=upcoming] .marker' }
		]
	},
	'k-toaster': { exempt: 'overlay: see the overlay tests' },
	'k-tooltip': { exempt: 'overlay: see the overlay tests' },
	'k-tree-view': {
		focus: [['#tree [role=treeitem][tabindex="0"]', '#tree [role=treeitem][tabindex="0"] > .row']],
		prepare: async (page) => {
			await page.locator('#tree [data-id=notes] > .row').click();
		},
		states: [{ name: 'selected vs other row', a: '#tree [data-id=notes] > .row', b: '#tree [data-id=docs] > .row' }]
	},
	'k-typewriter': { exempt: 'text' },
	'k-visually-hidden': { exempt: 'not painted: text for assistive technology only' }
};

test.describe('every element is covered', () => {
	test('the table has an entry for each custom element and the page renders it', async ({ page }) => {
		const manifest = JSON.parse(await readFile(new URL('../../custom-elements.json', import.meta.url), 'utf8')) as {
			modules: { declarations?: { tagName?: string }[] }[];
		};
		const tags = [...new Set(manifest.modules.flatMap((m) => (m.declarations ?? []).map((d) => d.tagName ?? '')).filter(Boolean))].sort();
		expect(tags.length).toBeGreaterThan(80);
		expect(Object.keys(CASES).sort(), 'CASES must list exactly the elements of custom-elements.json').toEqual(tags);
		await open(page);
		const missing = await page.evaluate((list) => list.filter((t) => !document.querySelector(t)), tags);
		expect(missing, 'forced-colors.html must contain every element').toEqual([]);
		expect(await page.evaluate(() => (window as unknown as FcWindow).errors)).toEqual([]);
	});
});

test.describe('forced colors: elements', () => {
	for (const [tag, c] of Object.entries(CASES)) {
		test(`${tag}: edge, focus ring, states, disabled`, async ({ page }) => {
			await open(page);
			await c.prepare?.(page);
			const failures = await failuresOf(page, c);
			expect(failures, failures.join('\n')).toEqual([]);
			if (c.exempt) expect(c.exempt.length).toBeGreaterThan(3);
			else
				expect(
					(c.edge?.length ?? 0) + (c.focus?.length ?? 0) + (c.states?.length ?? 0) + (c.uses?.length ?? 0),
					`${tag} checks something`
				).toBeGreaterThan(0);
		});
	}
});

/** Overlays: opened first, then the same checks as above on the part that appears. */
const OVERLAYS: Record<string, Case> = {
	'k-modal': {
		prepare: async (page) => {
			await page.evaluate(() => ((document.querySelector('#modal') as HTMLElement & { open: boolean }).open = true));
			await expect(page.locator('#modal dialog[open]')).toBeVisible();
		},
		edge: ['#modal dialog.k-modal', '#modal .x'],
		focus: ['#modal .x']
	},
	'k-drawer': {
		prepare: async (page) => {
			await page.evaluate(() => ((document.querySelector('#drawer') as HTMLElement & { open: boolean }).open = true));
			await expect(page.locator('#drawer dialog[open]')).toBeVisible();
		},
		edge: ['#drawer dialog.k-drawer', '#drawer .x'],
		focus: ['#drawer .x']
	},
	'k-command-palette': {
		prepare: async (page) => {
			await page.evaluate(() => ((document.querySelector('#palette') as HTMLElement & { open: boolean }).open = true));
			await expect(page.locator('#palette dialog[open]')).toBeVisible();
		},
		edge: ['#palette dialog.k-command-palette', '#palette .x', '#palette .option.active'],
		focus: [['#palette input[role=combobox]', '#palette .search']]
	},
	'k-popover': {
		prepare: async (page) => {
			await page.locator('#popover .trigger').click();
			await expect(page.locator('#popover .panel')).toBeVisible();
		},
		edge: ['#popover .panel', '#popover .trigger']
	},
	'k-dropdown-menu': {
		prepare: async (page) => {
			await page.locator('#dropdown .trigger').focus();
			await page.keyboard.press('Enter');
			await expect(page.locator('#dropdown .menu')).toBeVisible();
		},
		edge: ['#dropdown .menu'],
		focus: ['#dropdown [role=menuitem]:not([aria-disabled=true])'],
		uses: [['#dropdown [role=menuitem][aria-disabled=true]', 'color', 'GrayText']]
	},
	'k-context-menu': {
		prepare: async (page) => {
			// a synthetic contextmenu event: a real right click is followed by a mouse release that can close the menu again
			await page
				.locator('#context .k-context-area')
				.dispatchEvent('contextmenu', { clientX: 120, clientY: 120, bubbles: true, cancelable: true });
			await expect(page.locator('#context .menu')).toBeVisible();
		},
		edge: ['#context .menu'],
		focus: ['#context [role=menuitem]']
	},
	'k-combobox': {
		prepare: async (page) => {
			await page.locator('#combobox input[role=combobox]').focus();
			await page.keyboard.press('ArrowDown');
			await expect(page.locator('#combobox .popup')).toBeVisible();
		},
		edge: ['#combobox .popup', '#combobox [role=option].active'],
		states: [{ name: 'active vs other option', a: '#combobox [role=option].active', b: '#combobox [role=option]:not(.active)' }]
	},
	'k-tag-input': {
		prepare: async (page) => {
			await page.locator('#taginput input[role=combobox]').focus();
			await page.keyboard.type('H');
			await expect(page.locator('#taginput .popup')).toBeVisible();
		},
		edge: ['#taginput .popup']
	},
	'k-date-picker': {
		prepare: async (page) => {
			await page.locator('#date .cal').click();
			await expect(page.locator('#date .dialog')).toBeVisible();
		},
		edge: ['#date .dialog', '#date .nav'],
		focus: ['#date [role=gridcell][tabindex="0"]', '#date .nav'],
		states: [
			{
				name: 'selected vs other day',
				a: '#date [role=gridcell][aria-selected=true]',
				b: '#date [role=gridcell][aria-selected=true] ~ [role=gridcell]'
			}
		]
	},
	'k-color-picker': {
		prepare: async (page) => {
			await page.locator('#color .swatch-btn').click();
			await expect(page.locator('#color .panel')).toBeVisible();
		},
		edge: ['#color .panel', '#color .swatch', '#color .area'],
		focus: ['#color .swatch', '#color .area'],
		states: [{ name: 'pressed vs other swatch', a: '#color .swatch[aria-pressed=true]', b: '#color .swatch[aria-pressed=false]' }]
	},
	'k-toaster': {
		prepare: async (page) => {
			await page.evaluate(() => {
				const k = (window as unknown as { kern: { toast: (o: object) => number } }).kern;
				k.toast({ message: 'Site published.', tone: 'ok', duration: 0 });
				k.toast({ message: 'Storage almost full.', tone: 'warn', duration: 0 });
				k.toast({ message: 'Upload failed.', tone: 'danger', duration: 0 });
				k.toast({ message: 'Link copied.', duration: 0 });
			});
			await expect(page.getByText('Upload failed.')).toBeVisible();
		},
		edge: ['#toaster .toast', '#toaster .toast button'],
		states: [
			{ name: 'danger vs ok toast', a: '#toaster [data-tone=danger]', b: '#toaster [data-tone=ok]' },
			{ name: 'ok vs warn toast', a: '#toaster [data-tone=ok]', b: '#toaster [data-tone=warn]' },
			// the dot shape must not depend on the theme's badge radius (Flower rounds it)
			{ name: 'ok vs plain toast dot', a: '#toaster [data-tone=ok] .dot', b: '#toaster [data-tone=info] .dot' },
			{ name: 'warn vs plain toast dot', a: '#toaster [data-tone=warn] .dot', b: '#toaster [data-tone=info] .dot' }
		]
	},
	'k-tooltip': {
		prepare: async (page) => {
			await page.keyboard.press('Shift');
			await page.locator('#tooltip #dropdown .trigger').focus();
			await expect(page.locator('#tooltip .tip.shown')).toBeVisible();
		},
		edge: ['#tooltip .tip']
	}
};

test.describe('forced colors: overlays', () => {
	test('every overlay of the table is opened here', () => {
		const overlays = Object.entries(CASES)
			.filter(([, c]) => c.exempt?.startsWith('overlay'))
			.map(([tag]) => tag);
		for (const tag of overlays) expect(OVERLAYS, `${tag} has an overlay test`).toHaveProperty(tag);
	});
	for (const [tag, c] of Object.entries(OVERLAYS)) {
		for (const theme of ['code', 'flower']) {
			test(`${tag}: opened, edge, focus, no theme colour in ${theme}`, async ({ page }) => {
				await open(page, { theme, scheme: theme === 'code' ? 'dark' : 'light' });
				await c.prepare?.(page);
				const failures = await failuresOf(page, c);
				const leaks = await page.evaluate(() => (window as unknown as FcWindow).__fc.leaks());
				expect(failures, failures.join('\n')).toEqual([]);
				expect(leaks, 'colours that are not system colours').toEqual([]);
			});
		}
	}
});

test.describe('forced colors: no theme colour reaches the screen', () => {
	// Five themes and both system palettes (the emulated palette follows the colour scheme), at desktop and phone width.
	const themes: [string, 'dark' | 'light'][] = [
		['code', 'dark'],
		['code-light', 'light'],
		['flower', 'light'],
		['pop-dark', 'dark'],
		['line', 'dark'],
		['code', 'light'],
		['flower', 'dark']
	];
	for (const [theme, scheme] of themes) {
		for (const width of [1280, 375]) {
			test(`${theme} in a ${scheme} palette at ${width}px`, async ({ page }) => {
				await open(page, { theme, scheme, width });
				const leaks = await page.evaluate(() => (window as unknown as FcWindow).__fc.leaks());
				expect(leaks, 'colours that are not system colours').toEqual([]);
			});
		}
	}
});

test.describe('forced colors: axe', () => {
	// The pages of the other specs plus the forced-colors page, in the two themes with their own look
	// (Code: mono and hard edges, Flower: soft): no serious or critical violation under forced colors.
	for (const name of ['parity', 'feedback', 'form', 'navigation', 'reorder', 'strings', 'primitives', 'forced-colors']) {
		for (const theme of ['code', 'flower']) {
			test(`${name} page in ${theme}`, async ({ page }) => {
				await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
				await page.goto(`/tests/elements/pages/${name}.html`);
				await page.evaluate((t) => (document.documentElement.dataset.theme = t), theme);
				await page.waitForFunction(() =>
					[...document.querySelectorAll('*')]
						.filter((el) => el.tagName.startsWith('K-'))
						.every((el) => customElements.get(el.tagName.toLowerCase()) && el.shadowRoot)
				);
				await page.evaluate(async () => {
					await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
					await Promise.all(document.getAnimations({ subtree: true }).map((a) => a.finished.catch(() => undefined)));
				});
				// colour contrast is the user's palette under forced colors, and axe reads the authored colours instead
				// of the forced ones (it reports #101012 on #000000 for text that is white on black): leave that rule out
				const findings = await axeViolations(page, { disable: ['color-contrast'] });
				expect(findings, JSON.stringify(findings, null, 2)).toEqual([]);
			});
		}
	}
});
