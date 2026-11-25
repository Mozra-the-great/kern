/**
 * The Svelte build path under a strict Content Security Policy (#125). The production Vite build of
 * tests/fixtures/csp-app mounts every component exported from src/lib/index.ts; server.mjs serves it with the policy
 * of policy.mjs (`style-src 'self'`, `script-src 'self'` plus the sha256 of the theme script, nothing inline). Each
 * test fails on any `securitypolicyviolation` event, on any console message about the policy and on any page error.
 *
 * What a policy blocks there: a static `style="…"` attribute in a component template (Svelte clones template HTML),
 * an injected `<style>` element, an inline event handler or `javascript:` URL, `eval`, a `data:` image or font.
 * What it allows: inline styles set through the CSSOM from script (`style:prop`, `element.style.x = …`), which is
 * how kern positions overlays and sets sizes.
 *
 * Coverage guard: CASES needs an entry for every component export (an overlay or picker opens through the UI, a
 * static component only renders), and the page needs a `data-csp-case` section for each. Canary: /canary/ is the same
 * app with a static style attribute injected into Badge's template (vite.config.ts, KERN_CSP_CANARY); the last test
 * shows that the check fails on it.
 */
import { readFileSync } from 'node:fs';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { createThemeScript, themeScriptHash } from '../../src/lib/components/theme.ts';
import { THEME_HASH_PLACEHOLDER, THEME_KEY, THEME_OPTIONS, strictPolicy } from './policy.mjs';

const root = new URL('../../', import.meta.url);
const source = (path: string): string => readFileSync(new URL(path, root), 'utf8');

/** The component exports of the package, as the other coverage tables read them. */
const EXPORTS = [...source('src/lib/index.ts').matchAll(/export \{ default as (\w+) \} from '\.\/components\/[\w-]+\.svelte'/g)]
	.map((m) => m[1] ?? '')
	.sort();

/** Every theme variant: the stylesheet differs per theme, and so could what a policy blocks. */
const THEMES = ['code', 'code-light', 'flower', 'flower-wald', 'pop', 'pop-dark', 'line', 'line-light'] as const;

interface Report {
	violations: string[];
	console: string[];
	errors: string[];
}

interface Probe {
	violations: string[];
	/** data-theme as the inline theme script set it, before any module script ran. */
	scriptTheme: string | null;
}

/**
 * Listeners that must exist before the first script of the page: an init script runs before the document's own
 * scripts and is not subject to the page's policy.
 */
async function watch(page: Page, theme?: string): Promise<Report> {
	const report: Report = { violations: [], console: [], errors: [] };
	page.on('console', (msg) => {
		const text = msg.text();
		if (/content security policy|refused to|unsafe-inline|unsafe-eval/i.test(text)) report.console.push(`${msg.type()}: ${text}`);
	});
	page.on('pageerror', (error) => report.errors.push(error.message));
	await page.addInitScript(
		([key, stored]) => {
			const probe: Probe = { violations: [], scriptTheme: null };
			(window as unknown as { __csp: Probe }).__csp = probe;
			if (stored) localStorage.setItem(key, stored);
			else localStorage.removeItem(key);
			document.addEventListener(
				'securitypolicyviolation',
				(e) => {
					const where = e.target instanceof Element ? e.target.outerHTML.slice(0, 120) : String(e.target);
					probe.violations.push(
						`${e.effectiveDirective} blocked ${e.blockedURI || '(inline)'} at ${e.sourceFile}:${e.lineNumber} "${e.sample}" ${where}`
					);
				},
				true
			);
			const observer = new MutationObserver((records) => {
				for (const r of records) {
					if (r.target === document.documentElement && probe.scriptTheme === null) {
						probe.scriptTheme = document.documentElement.getAttribute('data-theme');
						observer.disconnect();
					}
				}
			});
			observer.observe(document, { attributes: true, attributeFilter: ['data-theme'], subtree: true });
		},
		[THEME_KEY, theme ?? ''] as const
	);
	return report;
}

/** Violation events are queued tasks: let them arrive, then read them. */
async function settle(page: Page, report: Report): Promise<Report> {
	await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 50))));
	report.violations = await page.evaluate(() => (window as unknown as { __csp: Probe }).__csp.violations.slice());
	return report;
}

const all = (r: Report): string[] => [...r.violations, ...r.console, ...r.errors];

async function open(page: Page, path: string, theme?: string): Promise<Report> {
	const report = await watch(page, theme);
	const response = await page.goto(path);
	expect(response?.status()).toBe(200);
	await expect(page.locator('[data-csp-case]').first()).toBeVisible();
	return report;
}

const section = (page: Page, name: string): Locator => page.locator(`[data-csp-case="${name}"]`);

type Case = 'static' | ((page: Page, s: Locator) => Promise<void>);

/** Escape closes the overlay that has the focus; the next case starts on a closed page. */
const escape = async (page: Page, gone: Locator): Promise<void> => {
	await page.keyboard.press('Escape');
	await expect(gone).toBeHidden();
};

/**
 * One entry per component export. A function opens the component's overlay or runs the interaction that sets
 * inline styles (positions, sizes, drag), asserts that it shows, and closes it again.
 */
const CASES: Record<string, Case> = {
	Accordion: async (_page, s) => {
		await s.getByText('Two', { exact: true }).click();
		await expect(s.getByText('Body two')).toBeVisible();
	},
	AccordionItem: async (_page, s) => {
		await s.getByText('Item', { exact: true }).click();
		await expect(s.getByText('Body', { exact: true })).toBeVisible();
	},
	Alert: 'static',
	Avatar: 'static',
	Badge: 'static',
	Breadcrumb: 'static',
	Button: 'static',
	Card: 'static',
	Caret: 'static',
	Carousel: async (_page, s) => {
		await s.getByRole('button').last().click();
		await expect(s.getByText('Two')).toBeVisible();
	},
	Checkbox: async (_page, s) => {
		await s.getByText('Accept').click();
		await expect(s.getByRole('checkbox')).not.toBeChecked();
	},
	Code: 'static',
	CodeBlock: 'static',
	Collapsible: async (_page, s) => {
		await s.getByRole('button', { name: /More/ }).click();
		await expect(s.getByText('Hidden content')).toBeVisible();
	},
	ColorPicker: async (page, s) => {
		await s.getByRole('button').first().click();
		const area = s.getByRole('slider').first();
		await expect(area).toBeVisible();
		const box = await area.boundingBox();
		if (box) await page.mouse.click(box.x + box.width * 0.7, box.y + box.height * 0.3);
		await page.keyboard.press('ArrowLeft');
		await escape(page, area);
	},
	Combobox: async (page, s) => {
		await s.getByRole('combobox').fill('a');
		await expect(page.getByRole('option', { name: 'Banana' })).toBeVisible();
		await page.keyboard.press('ArrowDown');
		await escape(page, page.getByRole('option', { name: 'Banana' }));
	},
	CommandPalette: async (page) => {
		await page.getByRole('button', { name: 'Open palette' }).click();
		const input = page.getByRole('dialog').getByRole('combobox');
		await expect(input).toBeVisible();
		await input.fill('new');
		await expect(page.getByRole('option', { name: /New file/ })).toBeVisible();
		await escape(page, input);
	},
	ContextMenu: async (page, s) => {
		await s.getByText('Right-click here').click({ button: 'right' });
		const menu = page.getByRole('menu');
		await expect(menu).toBeVisible();
		await page.keyboard.press('ArrowDown');
		await escape(page, menu);
	},
	CopyButton: async (_page, s) => {
		await s.getByRole('button').click();
	},
	CountUp: 'static',
	DataTable: async (_page, s) => {
		await s.getByRole('button', { name: /Name/ }).click();
		await s.getByRole('checkbox').nth(1).check();
		await expect(s.getByRole('checkbox').nth(1)).toBeChecked();
	},
	DatePicker: async (page, s) => {
		await s.getByRole('button', { name: 'Choose date' }).click();
		const grid = s.getByRole('grid');
		await expect(grid).toBeVisible();
		await page.keyboard.press('ArrowRight');
		await escape(page, grid);
	},
	Divider: 'static',
	DownloadButton: async (page, s) => {
		const download = page.waitForEvent('download');
		await s.getByRole('button').click();
		await download;
	},
	Drawer: async (page) => {
		await page.getByRole('button', { name: 'Open drawer' }).click();
		const dialog = page.getByRole('dialog', { name: 'Drawer' });
		await expect(dialog).toBeVisible();
		await escape(page, dialog);
	},
	DropdownMenu: async (page, s) => {
		await s.getByRole('button', { name: 'Actions' }).click();
		const menu = page.getByRole('menu');
		await expect(menu).toBeVisible();
		await page.keyboard.press('ArrowDown');
		await escape(page, menu);
	},
	EmptyState: 'static',
	Field: 'static',
	FileDrop: async (_page, s) => {
		await s.locator('input[type=file]').setInputFiles([{ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('notes') }]);
		await expect(s.getByText('notes.txt')).toBeVisible();
	},
	GridBackground: 'static',
	Heatmap: async (page, s) => {
		await s.locator('.cell[data-day]').nth(10).hover();
		await expect(s.locator('.tip')).toBeVisible();
		await page.mouse.move(0, 0);
	},
	Highlight: 'static',
	HistoryBar: async (page, s) => {
		await s.locator('.bar').nth(1).hover();
		await expect(s.locator('.tip')).toBeVisible();
		await page.mouse.move(0, 0);
	},
	IconButton: 'static',
	Input: async (_page, s) => {
		await s.getByRole('textbox').fill('ada@example.org');
	},
	Kbd: 'static',
	Label: 'static',
	Link: 'static',
	LiveAnnouncer: async (page) => {
		await page.getByRole('button', { name: 'Announce' }).click();
	},
	Marquee: async (_page, s) => {
		await s.hover();
	},
	Mascot: async (_page, s) => {
		await expect.poll(() => s.locator('img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
	},
	Modal: async (page) => {
		await page.getByRole('button', { name: 'Open modal' }).click();
		const dialog = page.getByRole('dialog', { name: 'Modal' });
		await expect(dialog).toBeVisible();
		await dialog.getByRole('button', { name: 'Close modal' }).click();
		await expect(dialog).toBeHidden();
	},
	Navbar: async (page, s) => {
		await page.setViewportSize({ width: 375, height: 800 });
		const toggle = s.getByRole('button');
		await toggle.click();
		await expect(s.getByRole('link', { name: 'Docs' })).toBeVisible();
		await toggle.click();
		await page.setViewportSize({ width: 1280, height: 900 });
	},
	NumberInput: async (page, s) => {
		await s.getByRole('spinbutton').focus();
		await page.keyboard.press('ArrowUp');
	},
	Odometer: 'static',
	OnlineStatus: 'static',
	Pagination: async (_page, s) => {
		await s.getByRole('button').last().click();
	},
	PinInput: async (page, s) => {
		await s.getByRole('textbox').first().click();
		await page.keyboard.type('1234');
	},
	Popover: async (page, s) => {
		await s.getByRole('button', { name: 'Info' }).click();
		const body = page.getByText('Popover details');
		await expect(body).toBeVisible();
		await escape(page, body);
	},
	Progress: 'static',
	ProgressRing: 'static',
	Prose: 'static',
	RadioGroup: async (_page, s) => {
		await s.getByText('Small').click();
		await expect(s.getByRole('radio', { name: 'Small' })).toBeChecked();
	},
	Rating: async (_page, s) => {
		await s.getByRole('radio').nth(3).hover();
		await s.getByRole('radio').nth(3).click();
	},
	RelativeTime: 'static',
	Resizable: async (page, s) => {
		const handle = s.locator('[role=separator]');
		await handle.focus();
		await page.keyboard.press('ArrowRight');
		const box = await handle.boundingBox();
		if (box) {
			await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
			await page.mouse.down();
			await page.mouse.move(box.x - 30, box.y + box.height / 2, { steps: 4 });
			await page.mouse.up();
		}
	},
	Reveal: 'static',
	Scramble: async (_page, s) => {
		await s.hover();
	},
	ScrollArea: async (_page, s) => {
		await s.getByRole('region').evaluate((el) => el.scrollTo({ top: 100 }));
	},
	SegmentedControl: async (_page, s) => {
		await s.getByRole('radio', { name: 'Grid' }).click();
	},
	Select: async (_page, s) => {
		await s.getByRole('combobox').selectOption('fr');
	},
	SelectGrid: async (_page, s) => {
		await s.getByText('Beta').click();
	},
	Skeleton: 'static',
	SkipLink: async (page) => {
		const link = page.getByRole('link', { name: 'Skip to content' });
		await link.focus();
		await expect(link).toBeInViewport();
		await link.blur();
	},
	Slider: async (page, s) => {
		await s.getByRole('slider').focus();
		await page.keyboard.press('ArrowRight');
	},
	SortableList: async (_page, s) => {
		await s.getByRole('button', { name: 'Move Alpha down' }).click();
		await expect(s.locator('.name').first()).toHaveText('Beta');
	},
	Sparkline: 'static',
	Spinner: 'static',
	Stat: 'static',
	StatusDot: 'static',
	StatusMessage: 'static',
	Stepper: 'static',
	Switch: async (_page, s) => {
		await s.getByText('Notifications').click();
		await expect(s.getByRole('switch')).toBeChecked();
	},
	TabLinks: 'static',
	Table: 'static',
	Tabs: async (_page, s) => {
		await s.getByRole('tab', { name: 'Two' }).click();
		await expect(s.getByText('Panel two')).toBeVisible();
	},
	Tag: 'static',
	TagInput: async (page, s) => {
		await s.getByRole('combobox').click();
		await s.getByRole('combobox').pressSequentially('ty');
		const option = page.getByRole('option', { name: 'typescript' });
		await expect(option).toBeVisible();
		await page.keyboard.press('ArrowDown');
		await page.keyboard.press('Enter');
		await expect(s.locator('.tag')).toHaveCount(2);
	},
	Terminal: 'static',
	Textarea: async (_page, s) => {
		await s.getByRole('textbox').fill('one\ntwo\nthree\nfour\nfive');
	},
	ThemeToggle: async (_page, s) => {
		const toggle = s.getByRole('button');
		await toggle.click();
		await toggle.click();
	},
	Tile: 'static',
	TileGrid: 'static',
	Timeline: 'static',
	Toaster: async (page) => {
		await page.getByRole('button', { name: 'Toast', exact: true }).click();
		await page.getByRole('button', { name: 'Error toast' }).click();
		await expect(page.getByText('Saved the file')).toBeVisible();
		await expect(page.getByText('Upload failed')).toBeVisible();
		await page.getByText('Saved the file').hover();
	},
	Tooltip: async (page, s) => {
		await s.getByRole('button', { name: 'Hover me' }).hover();
		await expect(page.getByRole('tooltip', { name: 'Tooltip text' })).toBeVisible();
		await page.mouse.move(0, 0);
	},
	TreeView: async (page, s) => {
		await s.getByRole('treeitem', { name: 'main.ts' }).click();
		await page.keyboard.press('ArrowUp');
	},
	Typewriter: 'static',
	VisuallyHidden: 'static'
};

test.describe('strict CSP: the served policy', () => {
	test('the consumer guide documents exactly the tested policy', () => {
		const section = source('docs/consumer-guide.md').split('**Geprüfte Policy für den Svelte-Weg**')[1];
		expect(section, 'docs/consumer-guide.md lost the section "Geprüfte Policy für den Svelte-Weg"').toBeDefined();
		const block = /\n```\r?\n([^\r\n]+)\r?\n```/.exec(section ?? '')?.[1];
		expect(block).toBe(strictPolicy(THEME_HASH_PLACEHOLDER));
	});

	test('is the documented policy word for word, with the theme-script hash and nothing inline', async ({ page }) => {
		const expected = strictPolicy(await themeScriptHash(THEME_KEY, THEME_OPTIONS));
		for (const path of ['/index.html', '/canary/index.html']) {
			const response = await page.request.get(path);
			const csp = response.headers()['content-security-policy'];
			expect(csp, path).toBe(expected);
			expect(csp).not.toMatch(/'unsafe-inline'|'unsafe-eval'|'unsafe-hashes'|'wasm-unsafe-eval'|\bdata:|\bblob:|\*/);
			expect(csp).toMatch(/(^|; )style-src 'self'(;|$)/);
		}
		// The fixture's only inline script is byte for byte the one the hash is of. The browser parses the HTML (no
		// regular expression over markup); the static attributes are read before any script of the page runs.
		await page.route('**/*.js', (route) => route.abort());
		await page.goto('/index.html');
		const parsed = await page.evaluate(() => ({
			inline: [...document.querySelectorAll('script:not([src])')].map((s) => s.textContent),
			attributes: [...document.querySelectorAll('*')].flatMap((el) =>
				el.getAttributeNames().filter((a) => a === 'style' || a.startsWith('on') || /^\s*javascript:/i.test(el.getAttribute(a) ?? ''))
			)
		}));
		expect(parsed.inline).toEqual([createThemeScript(THEME_KEY, THEME_OPTIONS)]);
		expect(parsed.attributes).toEqual([]);
	});

	test('the hashed theme script runs: a stored theme and, without one, the system scheme', async ({ page }) => {
		const stored = await watch(page, 'pop-dark');
		await page.goto('/index.html');
		expect(await page.evaluate(() => (window as unknown as { __csp: Probe }).__csp.scriptTheme)).toBe('pop-dark');
		expect(all(await settle(page, stored))).toEqual([]);

		for (const [scheme, theme] of [
			['dark', 'code'],
			['light', 'code-light']
		] as const) {
			const context = await page.context().browser()?.newContext({ colorScheme: scheme });
			if (!context) throw new Error('no browser');
			const fresh = await context.newPage();
			const report = await watch(fresh);
			await fresh.goto(`${test.info().project.use.baseURL ?? ''}/index.html`);
			expect(await fresh.evaluate(() => (window as unknown as { __csp: Probe }).__csp.scriptTheme), scheme).toBe(theme);
			expect(all(await settle(fresh, report))).toEqual([]);
			await context.close();
		}
	});
});

test.describe('strict CSP: every exported component', () => {
	test('CASES and the fixture cover every component export, and nothing else', async ({ page }) => {
		expect(EXPORTS.length).toBeGreaterThan(80);
		expect(Object.keys(CASES).sort()).toEqual(EXPORTS);
		const app = source('tests/fixtures/csp-app/src/App.svelte');
		const unused = EXPORTS.filter((name) => !new RegExp(`<${name}[\\s/>]`).test(app));
		expect(unused, 'exports not mounted in tests/fixtures/csp-app/src/App.svelte').toEqual([]);
		await open(page, '/index.html');
		const sections = await page.locator('[data-csp-case]').evaluateAll((els) => els.map((el) => el.getAttribute('data-csp-case') ?? ''));
		expect(sections.slice().sort()).toEqual(EXPORTS);
		// every section rendered something: a component that failed to mount leaves it empty
		const empty = await page
			.locator('[data-csp-case]')
			.evaluateAll((els) => els.filter((el) => el.children.length === 0).map((el) => el.getAttribute('data-csp-case')));
		expect(empty).toEqual([]);
	});

	for (const theme of THEMES) {
		test(`${theme}: renders and opens every overlay without a violation`, async ({ page }) => {
			const report = await open(page, '/index.html', theme);
			await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
			// The stylesheets applied and CSSOM inline styles (style:width of Progress) work under the policy.
			expect(
				await section(page, 'Badge')
					.locator('.k-badge')
					.evaluate((el) => getComputedStyle(el).display)
			).toBe('inline-flex');
			expect(
				await section(page, 'Progress')
					.locator('[style*="width"]')
					.first()
					.evaluate((el) => el.style.width)
			).toBe('40%');
			expect(all(await settle(page, report)), 'after the first render').toEqual([]);

			// A case that cannot open its overlay is a failure too (the check would look at nothing), but it does not
			// stop the run: the report names every such case at once. Violations fail the case that caused them.
			const broken: string[] = [];
			for (const [name, run] of Object.entries(CASES)) {
				if (run === 'static') continue;
				await test.step(name, async () => {
					const s = section(page, name);
					try {
						await s.scrollIntoViewIfNeeded();
						await run(page, s);
					} catch (error) {
						broken.push(`${name}: ${(error instanceof Error ? error.message : String(error)).split('\n')[0] ?? ''}`);
						await page.keyboard.press('Escape');
					}
					expect(all(await settle(page, report)), name).toEqual([]);
				});
			}
			expect(broken, 'cases whose interaction failed').toEqual([]);
		});
	}
});

test.describe('strict CSP: the check itself', () => {
	test('canary: a static style attribute in a component template is reported, so the check fails', async ({ page }) => {
		const report = await open(page, '/canary/index.html', 'code');
		const found = all(await settle(page, report));
		expect(found.length, 'the injected style="outline: 0" on Badge must be caught').toBeGreaterThan(0);
		// both channels see it: the event (directive style-src-attr, nothing else on the page) and the console
		expect(report.violations.length).toBeGreaterThan(0);
		expect(
			report.violations.every((v) => v.startsWith('style-src-attr blocked inline ')),
			report.violations.join('\n')
		).toBe(true);
		expect(report.console.length).toBeGreaterThan(0);
		// the assertion every other test makes fails on this page
		expect(() => expect(found).toEqual([])).toThrow();
		// and the clean build of the same app has none: the difference is the one injected attribute
		const clean = await open(page, '/index.html', 'code');
		expect(all(await settle(page, clean))).toEqual([]);
	});

	test('canary: an injected <style>, an inline handler and a javascript: URL are reported too', async ({ page }) => {
		const report = await open(page, '/index.html', 'code');
		expect(all(await settle(page, report))).toEqual([]);
		await page.evaluate(() => {
			const style = document.createElement('style');
			style.textContent = '.k-badge { outline: 1px solid red; }';
			document.head.append(style);
			const button = document.createElement('button');
			button.setAttribute('onclick', 'document.title = "ran"');
			document.body.append(button);
			button.click();
			const link = document.createElement('a');
			link.href = 'javascript:void(document.title = "ran")';
			document.body.append(link);
			link.click();
		});
		await settle(page, report);
		const directives = report.violations.map((v) => v.split(' ')[0]).sort();
		expect(directives).toEqual(['script-src-attr', 'script-src-elem', 'style-src-elem']);
		expect(await page.title()).not.toBe('ran');
	});
});
