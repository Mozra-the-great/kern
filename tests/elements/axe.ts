/**
 * Runs axe-core (devDependency, never shipped) on the current page. axe walks open shadow roots
 * itself, so the custom elements' internals are checked too. Returns only the violations at
 * `serious` or `critical` impact, which is what CI fails on (#25, #50, #51).
 */
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import type { Page } from '@playwright/test';

export interface AxeFinding {
	id: string;
	impact: string;
	help: string;
	targets: string[];
}

const require = createRequire(import.meta.url);
let source: string | undefined;

export async function axeViolations(page: Page, options: { disable?: string[] } = {}): Promise<AxeFinding[]> {
	source ??= await readFile(require.resolve('axe-core/axe.min.js'), 'utf8');
	await page.addScriptTag({ content: source });
	return page.evaluate(async (disabled) => {
		interface Node {
			target: unknown[];
			failureSummary?: string;
		}
		interface Result {
			id: string;
			impact?: string | null;
			help: string;
			nodes: Node[];
		}
		const axe = (window as unknown as { axe: { run: (ctx: Document, opts: object) => Promise<{ violations: Result[] }> } }).axe;
		const { violations } = await axe.run(document, {
			runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] },
			resultTypes: ['violations'],
			rules: Object.fromEntries(disabled.map((id) => [id, { enabled: false }]))
		});
		return violations
			.filter((v) => v.impact === 'serious' || v.impact === 'critical')
			.map((v) => ({
				id: v.id,
				impact: v.impact ?? '',
				help: v.help,
				targets: v.nodes.map((n) => `${JSON.stringify(n.target)} ${(n.failureSummary ?? '').replace(/\s+/g, ' ')}`)
			}));
	}, options.disable ?? []);
}
