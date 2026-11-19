/**
 * Helpers of the React 19 specs (#35): a Playwright `test` whose `app` fixture opens the built React app
 * (tests/fixtures/react-app) and fails the test on any `pageerror`, any `console.error` or `console.warn`
 * (React's own warnings arrive as console errors) and any unhandled rejection. Run `npm run build:react-app`
 * first (`npm run test:elements` does).
 */
import { expect, test as base, type Locator, type Page } from '@playwright/test';
import type { HandledEvent, Harness, SeenEvent } from '../fixtures/react-app/src/harness.js';

export type { HandledEvent, SeenEvent };

const APP = '/tests/fixtures/react-app/dist/index.html';

interface HarnessWindow {
	harness: Harness;
	errors: string[];
}

export class ReactApp {
	constructor(
		readonly page: Page,
		/** Everything that went wrong in the page so far; the fixture asserts it is empty at the end of the test. */
		readonly problems: string[]
	) {}

	/**
	 * Loads the app with the given scenarios (each in its own StrictMode root) and waits until every kern
	 * element in the page is upgraded and has rendered its shadow root.
	 */
	async open(scenarios: readonly string[], query = ''): Promise<void> {
		const params = new URLSearchParams(query);
		params.set('s', scenarios.join(','));
		await this.page.goto(`${APP}?${params.toString()}`);
		await this.page.waitForFunction((count) => {
			const roots = document.querySelectorAll('#app > section');
			if (roots.length < count) return false;
			return [...document.querySelectorAll('*')]
				.filter((el) => el.tagName.startsWith('K-'))
				.every((el) => customElements.get(el.tagName.toLowerCase()) && el.shadowRoot?.firstElementChild);
		}, scenarios.length);
		// React runs the passive effects, and StrictMode its second pass, after the paint: let it finish.
		await this.settle();
	}

	/** Every kern event that reached the document since the last `reset()`. */
	events(): Promise<SeenEvent[]> {
		return this.page.evaluate(() => (window as unknown as HarnessWindow).harness.events);
	}
	/** The events kern elements dispatched themselves (not the browser's own `input` events), since the last `reset()`. */
	async emitted(): Promise<SeenEvent[]> {
		return (await this.events()).filter((e) => !e.trusted);
	}
	/** What the React `on<event>` props received since the last `reset()`. */
	handled(): Promise<HandledEvent[]> {
		return this.page.evaluate(() => (window as unknown as HarnessWindow).harness.handled);
	}
	reset(): Promise<void> {
		return this.page.evaluate(() => (window as unknown as HarnessWindow).harness.reset());
	}
	commits(name: string): Promise<number> {
		return this.page.evaluate((name) => (window as unknown as HarnessWindow).harness.commits[name] ?? 0, name);
	}
	submissions(): Promise<[string, string][][]> {
		return this.page.evaluate(() => (window as unknown as HarnessWindow).harness.submissions);
	}
	listeners(): Promise<string[]> {
		return this.page.evaluate(() => (window as unknown as HarnessWindow).harness.listeners());
	}
	/** The JSON of an `<output>` the scenario fills with its React state. */
	async state<T>(id: string): Promise<T> {
		return JSON.parse((await this.page.locator(`#${id}`).textContent()) ?? 'null') as T;
	}
	async mount(scenario: string, rootId?: string): Promise<void> {
		await this.page.evaluate(([scenario, rootId]) => (window as unknown as HarnessWindow).harness.mount(scenario as string, rootId), [
			scenario,
			rootId
		] as const);
		await this.settle();
	}
	unmount(rootId: string): Promise<void> {
		return this.page.evaluate((rootId) => (window as unknown as HarnessWindow).harness.unmount(rootId), rootId);
	}
	/** Reads a property of an element in the page. */
	prop(id: string, name: string): Promise<unknown> {
		return this.page.evaluate(
			([id, name]) => (document.getElementById(id as string) as unknown as Record<string, unknown>)[name as string],
			[id, name] as const
		);
	}
	/** Resolves after React and Svelte flushed (two animation frames and 60 ms). */
	settle(): Promise<void> {
		return this.page.evaluate(
			() => new Promise<void>((done) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(done, 60))))
		);
	}
	/** The inner control of a kern field: `<input>`, `<textarea>` or `<select>` in its shadow root (Playwright pierces it). */
	control(id: string): Locator {
		return this.page.locator(`#${id}`).locator('input, textarea, select').first();
	}
}

export const test = base.extend<{ app: ReactApp }>({
	app: async ({ page }, use) => {
		const problems: string[] = [];
		page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
		page.on('console', (m) => {
			if (m.type() !== 'error' && m.type() !== 'warning') return;
			if (m.location().url.endsWith('/favicon.ico')) return;
			problems.push(`console.${m.type()}: ${m.text()}`);
		});
		const app = new ReactApp(page, problems);
		await use(app);
		const errors = await page.evaluate(() => (window as unknown as HarnessWindow).errors ?? []).catch(() => [] as string[]);
		expect([...problems, ...errors], 'page errors and console errors').toEqual([]);
	}
});

export { expect };
