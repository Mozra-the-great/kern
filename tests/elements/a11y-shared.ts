/**
 * Shared parts of the accessibility suite (#25): a11y.spec.ts (axe), a11y-matrix.spec.ts (axe on every
 * element in every theme, open states), a11y-keyboard.spec.ts, a11y-motion.spec.ts and a11y-reflow.spec.ts.
 * Forced colors is covered by forced-colors.spec.ts (#27) and not repeated.
 */
import { expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

/** One `data-theme` id per theme family and scheme: the real ids of src/lib/themes/brands/*.css. */
export const THEMES = ['code', 'code-light', 'flower', 'flower-wald', 'pop', 'pop-dark', 'line', 'line-light'] as const;

/** Every page of tests/elements/pages that shows components (entries.html only tests the per-element entry points). */
export const PAGES = [
	'accent',
	'download',
	'feedback',
	'forced-colors',
	'form',
	'navigation',
	'parity',
	'primitives',
	'reorder',
	'strings',
	'visual',
	'visually-hidden'
] as const;

/** The page with every custom element on it; the coverage tests and the open states use it. */
export const ALL = 'forced-colors';

/** All tag names of custom-elements.json, sorted. */
export async function elementTags(): Promise<string[]> {
	const manifest = JSON.parse(await readFile(new URL('../../custom-elements.json', import.meta.url), 'utf8')) as {
		modules: { declarations?: { tagName?: string }[] }[];
	};
	return [...new Set(manifest.modules.flatMap((m) => (m.declarations ?? []).map((d) => d.tagName ?? '')).filter(Boolean))].sort();
}

/** Waits until every kern element of the page is defined and has rendered its shadow root. */
export async function elementsReady(page: Page, timeout?: number): Promise<void> {
	await page.waitForFunction(
		() =>
			[...document.querySelectorAll('*')]
				.filter((el) => el.tagName.startsWith('K-'))
				.every((el) => customElements.get(el.tagName.toLowerCase()) && el.shadowRoot?.firstElementChild),
		undefined,
		{ polling: 100, ...(timeout ? { timeout } : {}) }
	);
}

/** Two frames, then every running animation has finished (a theme switch starts colour transitions). */
export async function settle(page: Page): Promise<void> {
	await page.evaluate(async () => {
		await document.fonts.ready;
		await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
		await Promise.all(document.getAnimations({ subtree: true }).map((a) => a.finished.catch(() => undefined)));
	});
}

export interface OpenOptions {
	theme?: string;
	reducedMotion?: 'reduce' | 'no-preference';
	width?: number;
	height?: number;
}

/**
 * Loads a page and waits until its theme stylesheet has arrived and every kern element has rendered. On a busy
 * Windows machine the loopback connection to the static server sometimes stalls (`net::ERR_CONNECTION_TIMED_OUT`,
 * seen after thousands of page loads in one run): the navigation fails, or the page comes without its stylesheet or
 * its element bundle and axe then measures an unstyled page. Short timeouts and up to four attempts, each starting
 * from a blank page, turn that into a retry instead of a red test; a page that is really broken fails all four.
 */
export async function load(page: Page, url: string, ready?: () => Promise<void>): Promise<void> {
	for (let attempt = 1; ; attempt++) {
		try {
			if (attempt > 1) await page.goto('about:blank').catch(() => undefined);
			await page.goto(url, { timeout: 8000 });
			await page.waitForFunction(
				() => getComputedStyle(document.documentElement).getPropertyValue('--k-space-2').trim() !== '',
				undefined,
				{
					timeout: 4000
				}
			);
			await elementsReady(page, 8000);
			await ready?.();
			return;
		} catch (error) {
			if (attempt === 4) throw error;
		}
	}
}

/** Opens a test page in a theme. The theme is set after load, as the other specs do, so every page works the same. */
export async function openPage(page: Page, name: string, options: OpenOptions = {}): Promise<void> {
	await page.emulateMedia({ reducedMotion: options.reducedMotion ?? 'reduce' });
	if (options.width) await page.setViewportSize({ width: options.width, height: options.height ?? 640 });
	await load(page, `/tests/elements/pages/${name}.html`, async () => {
		if (name !== ALL) return;
		// the sortable list and the select grid get their items from a module script on the page
		await page.waitForFunction(() => document.querySelector('#selectgrid')?.shadowRoot?.querySelector('[role=option]'), undefined, {
			polling: 100,
			timeout: 8000
		});
	});
	await page.evaluate((t) => (document.documentElement.dataset.theme = t), options.theme ?? 'code');
	await elementsReady(page);
	await settle(page);
}

/** A page state that is not visible after load: an open overlay, a menu, a toast, an error. */
export interface State {
	/** Brings the page into the state; resolves when it is visible. */
	prepare: (page: Page) => Promise<void>;
	/** Elements the state shows (documentation and coverage of the matrix). */
	tags: string[];
	/** The state needs a narrow screen (a menu that only exists there). */
	narrow?: boolean;
}

const setOpen = (id: string) => (page: Page) =>
	page.evaluate((i) => ((document.querySelector(i) as HTMLElement & { open: boolean }).open = true), id);

/** The open states of tests/elements/pages/forced-colors.html. */
export const STATES: Record<string, State> = {
	modal: {
		tags: ['k-modal'],
		prepare: async (page) => {
			await setOpen('#modal')(page);
			await expect(page.locator('#modal dialog[open]')).toBeVisible();
		}
	},
	drawer: {
		tags: ['k-drawer'],
		prepare: async (page) => {
			await setOpen('#drawer')(page);
			await expect(page.locator('#drawer dialog[open]')).toBeVisible();
		}
	},
	'command-palette': {
		tags: ['k-command-palette'],
		prepare: async (page) => {
			await setOpen('#palette')(page);
			await expect(page.locator('#palette dialog[open]')).toBeVisible();
		}
	},
	popover: {
		tags: ['k-popover'],
		prepare: async (page) => {
			await page.locator('#popover .trigger').click();
			await expect(page.locator('#popover .panel')).toBeVisible();
		}
	},
	'dropdown-menu': {
		tags: ['k-dropdown-menu', 'k-tooltip'],
		prepare: async (page) => {
			await page.locator('#dropdown .trigger').focus();
			await page.keyboard.press('Enter');
			await expect(page.locator('#dropdown .menu')).toBeVisible();
		}
	},
	'context-menu': {
		tags: ['k-context-menu'],
		prepare: async (page) => {
			// a synthetic contextmenu event: a real right click is followed by a mouse release that can close the menu again
			await page
				.locator('#context .k-context-area')
				.dispatchEvent('contextmenu', { clientX: 120, clientY: 120, bubbles: true, cancelable: true });
			await expect(page.locator('#context .menu')).toBeVisible();
		}
	},
	combobox: {
		tags: ['k-combobox'],
		prepare: async (page) => {
			await page.locator('#combobox input[role=combobox]').focus();
			await page.keyboard.press('ArrowDown');
			await expect(page.locator('#combobox .popup')).toBeVisible();
		}
	},
	'tag-input': {
		tags: ['k-tag-input'],
		prepare: async (page) => {
			await page.locator('#taginput input[role=combobox]').focus();
			await page.keyboard.type('H');
			await expect(page.locator('#taginput .popup')).toBeVisible();
		}
	},
	'date-picker': {
		tags: ['k-date-picker'],
		prepare: async (page) => {
			await page.locator('#date .cal').click();
			await expect(page.locator('#date .dialog')).toBeVisible();
		}
	},
	'color-picker': {
		tags: ['k-color-picker'],
		prepare: async (page) => {
			await page.locator('#color .swatch-btn').click();
			await expect(page.locator('#color .panel')).toBeVisible();
		}
	},
	toaster: {
		tags: ['k-toaster'],
		prepare: async (page) => {
			await page.evaluate(() => {
				const k = (window as unknown as { kern: { toast: (o: object) => number } }).kern;
				k.toast({ message: 'Site published.', tone: 'ok', duration: 0 });
				k.toast({ message: 'Storage almost full.', tone: 'warn', duration: 0 });
				k.toast({ message: 'Upload failed.', tone: 'danger', duration: 0 });
				k.toast({ message: 'Link copied.', duration: 0 });
			});
			await expect(page.getByText('Upload failed.')).toBeVisible();
		}
	},
	tooltip: {
		tags: ['k-tooltip'],
		prepare: async (page) => {
			await page.keyboard.press('Shift');
			await page.locator('#tooltip #dropdown .trigger').focus();
			await expect(page.locator('#tooltip .tip.shown')).toBeVisible();
		}
	},
	'invalid-fields': {
		tags: [
			'k-input',
			'k-textarea',
			'k-select',
			'k-file-drop',
			'k-combobox',
			'k-date-picker',
			'k-color-picker',
			'k-number-input',
			'k-pin-input',
			'k-radio-group',
			'k-rating',
			'k-segmented-control',
			'k-slider',
			'k-tag-input'
		],
		prepare: async (page) => {
			// every field that has an `error` shows one, and the required ones are invalid for the browser too
			await page.evaluate(() => {
				const fields = document.querySelectorAll(
					'#form :is(k-input, k-textarea, k-select, k-file-drop, k-combobox, k-date-picker, k-color-picker, k-number-input, k-pin-input, k-radio-group, k-rating, k-segmented-control, k-slider, k-tag-input)'
				);
				for (const el of fields) el.setAttribute('error', 'This field needs a valid value.');
				for (const id of ['#input', '#textarea', '#check-off', '#combobox', '#date'])
					document.querySelector(id)?.setAttribute('required', '');
				(document.querySelector('#form') as HTMLFormElement).requestSubmit();
			});
			await expect(page.locator('#select [role=alert]').first()).toBeVisible();
			await expect(page.locator('#combobox [role=alert]').first()).toBeVisible();
		}
	},
	'data-table': {
		tags: ['k-data-table', 'k-table'],
		prepare: async (page) => {
			await page.locator('#datatable thead button').first().click();
			await page.locator('#datatable tbody input[type=checkbox], #datatable tbody [role=checkbox]').first().click();
			await expect(page.locator('#datatable [aria-sort=ascending], #datatable [aria-sort=descending]').first()).toBeVisible();
		}
	},
	'navbar-menu': {
		tags: ['k-navbar'],
		narrow: true,
		prepare: async (page) => {
			await page.locator('#navbar button[aria-expanded]').first().click();
			await expect(page.locator('#navbar button[aria-expanded=true]').first()).toBeVisible();
		}
	}
};

/**
 * Interactive elements of the all-elements page that have a tab stop inside them (a11y-keyboard.spec.ts walks the
 * tab order and fails when one of these is not reached). Overlays and elements that need a state are opened by their
 * own tests (a11y-overlays.spec.ts).
 */
export const REACHABLE = [
	'k-accordion-item',
	'k-alert',
	'k-breadcrumb',
	'k-button',
	'k-card',
	'k-carousel',
	'k-checkbox',
	'k-code',
	'k-code-block',
	'k-collapsible',
	'k-color-picker',
	'k-combobox',
	'k-context-menu',
	'k-copy-button',
	'k-data-table',
	'k-date-picker',
	'k-download-button',
	'k-dropdown-menu',
	'k-file-drop',
	'k-heatmap',
	'k-history-bar',
	'k-icon-button',
	'k-input',
	'k-link',
	'k-navbar',
	'k-number-input',
	'k-pagination',
	'k-pin-input',
	'k-popover',
	'k-prose',
	'k-radio-group',
	'k-rating',
	'k-resizable',
	'k-scroll-area',
	'k-segmented-control',
	'k-select',
	'k-select-grid',
	'k-skip-link',
	'k-slider',
	'k-sortable-list',
	'k-stepper',
	'k-switch',
	'k-tab-links',
	'k-table',
	'k-tabs',
	'k-tag',
	'k-tag-input',
	'k-terminal',
	'k-textarea',
	'k-theme-toggle',
	'k-tile',
	'k-tree-view'
];

/**
 * The keyboard coverage table, one entry per custom element (a11y-keyboard.spec.ts fails when the list differs from
 * custom-elements.json):
 * - `keys`: a test in a11y-keys.spec.ts operates it with its keys (its tag is in the test title),
 * - `overlays`: a test in a11y-overlays.spec.ts opens it with the keyboard, closes it, and checks the focus,
 * - `static`: nothing to operate, with the reason; its own shadow root holds no control (checked on the page).
 * Every element that has a tab stop of its own is also in REACHABLE.
 */
export const KEYBOARD: Record<string, 'keys' | 'overlays' | { static: string }> = {
	'k-accordion': 'keys',
	'k-accordion-item': 'keys',
	'k-alert': 'keys',
	'k-avatar': { static: 'an image or initials' },
	'k-badge': { static: 'text' },
	'k-breadcrumb': 'keys',
	'k-button': 'keys',
	'k-caret': { static: 'a blinking block' },
	'k-card': 'keys',
	'k-carousel': 'keys',
	'k-checkbox': 'keys',
	'k-code': 'keys',
	'k-code-block': 'keys',
	'k-collapsible': 'keys',
	'k-color-picker': 'overlays',
	'k-combobox': 'keys',
	'k-command-palette': 'overlays',
	'k-context-menu': 'overlays',
	'k-copy-button': 'keys',
	'k-count-up': { static: 'text' },
	'k-data-table': 'keys',
	'k-date-picker': 'overlays',
	'k-divider': { static: 'a rule' },
	'k-download-button': 'keys',
	'k-drawer': 'overlays',
	'k-dropdown-menu': 'overlays',
	'k-empty-state': { static: 'text; its action is a k-button' },
	'k-file-drop': 'keys',
	'k-grid-background': { static: 'a decorative pattern' },
	'k-heatmap': 'keys',
	'k-highlight': { static: 'a marker behind text' },
	'k-history-bar': 'keys',
	'k-icon-button': 'keys',
	'k-input': 'keys',
	'k-kbd': { static: 'text' },
	'k-label': { static: 'text; it names a control for a click, not for the keyboard' },
	'k-link': 'keys',
	'k-live-announcer': { static: 'a live region' },
	'k-marquee': 'keys',
	'k-mascot': { static: 'an image' },
	'k-modal': 'overlays',
	'k-navbar': 'overlays',
	'k-number-input': 'keys',
	'k-odometer': { static: 'text' },
	'k-online-status': { static: 'a notice while offline' },
	'k-pagination': 'keys',
	'k-pin-input': 'keys',
	'k-popover': 'overlays',
	'k-progress': { static: 'a bar' },
	'k-progress-ring': { static: 'a ring' },
	'k-prose': { static: 'text; its links are native links (they are tab stops, see REACHABLE)' },
	'k-radio-group': 'keys',
	'k-rating': 'keys',
	'k-relative-time': { static: 'text' },
	'k-resizable': 'keys',
	'k-reveal': { static: 'a wrapper that animates its child in' },
	'k-scramble': { static: 'text' },
	'k-scroll-area': 'keys',
	'k-segmented-control': 'keys',
	'k-select': 'keys',
	'k-select-grid': 'keys',
	'k-skeleton': { static: 'a placeholder' },
	'k-skip-link': 'keys',
	'k-slider': 'keys',
	'k-sortable-list': 'keys',
	'k-sparkline': { static: 'a chart with a text alternative' },
	'k-spinner': { static: 'a status image' },
	'k-stat': { static: 'text' },
	'k-status-dot': { static: 'a glyph with a text label' },
	'k-status-message': { static: 'a live region' },
	'k-stepper': 'keys',
	'k-switch': 'keys',
	'k-tab-links': 'keys',
	'k-table': 'keys',
	'k-tabs': 'keys',
	'k-tag': 'keys',
	'k-tag-input': 'keys',
	'k-terminal': 'keys',
	'k-textarea': 'keys',
	'k-theme-toggle': 'keys',
	'k-tile': 'keys',
	'k-tile-grid': { static: 'a layout list; its tiles are k-tile' },
	'k-timeline': { static: 'a list' },
	'k-toaster': 'overlays',
	'k-tooltip': 'overlays',
	'k-tree-view': 'keys',
	'k-typewriter': { static: 'text' },
	'k-visually-hidden': { static: 'text for assistive technology only' }
};
