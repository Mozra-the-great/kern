/**
 * The guard against markup from strings (#59): the scanner finds every forbidden use, and the
 * library as it is has none. CI runs the same scan as `npm run check:html`.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
// @ts-expect-error the script is plain JavaScript without declarations
import { findRawHtml } from '../../scripts/ci/no-raw-html.mjs';

interface Found {
	file: string;
	line: number;
	name: string;
}
const scan = findRawHtml as (dirs: string[], base?: string) => Found[];

const dirs: string[] = [];
function tree(files: Record<string, string>): string {
	const dir = mkdtempSync(join(tmpdir(), 'kern-html-'));
	dirs.push(dir);
	for (const [name, content] of Object.entries(files)) {
		const path = join(dir, name);
		mkdirSync(join(path, '..'), { recursive: true });
		writeFileSync(path, content);
	}
	return dir;
}
afterEach(() => {
	for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('no-raw-html', () => {
	it('finds {@html} in a Svelte template, with file and line', () => {
		const dir = tree({ 'A.svelte': '<div>\n\t{@html text}\n</div>\n' });
		expect(scan([dir], dir)).toEqual([expect.objectContaining({ file: 'A.svelte', line: 2, name: '{@html}' })]);
	});

	it('finds the DOM APIs that parse HTML, also in nested folders and in other script files', () => {
		const dir = tree({
			'a/b/one.ts': 'el.innerHTML = value;',
			'two.js': 'el.outerHTML = value;',
			'three.mjs': "el.insertAdjacentHTML('beforeend', value);",
			'four.ts': 'document.write(value);',
			'five.ts': 'range.createContextualFragment(value);',
			'six.svelte': '<iframe srcdoc={value}></iframe>',
			'seven.tsx': '<div dangerouslySetInnerHTML={{ __html: value }} />'
		});
		expect(
			scan([dir], dir)
				.map((f) => f.name)
				.sort()
		).toEqual([
			'createContextualFragment',
			'dangerouslySetInnerHTML',
			'document.write',
			'innerHTML',
			'insertAdjacentHTML',
			'outerHTML',
			'srcdoc'
		]);
	});

	it('also counts a match in a comment: reword it', () => {
		const dir = tree({ 'a.ts': '// never use innerHTML here\n' });
		expect(scan([dir], dir)).toHaveLength(1);
	});

	it('does not flag safe look-alikes', () => {
		const dir = tree({
			'a.svelte': '<p>{text}</p>\n<!-- @html is a Svelte tag -->',
			'b.ts': 'el.textContent = value; const innerHTMLLike = 1; el.append(document.createTextNode(value)); document.writer = 1;',
			'c.css': '.innerHTML { color: red }',
			'notes.md': 'innerHTML'
		});
		expect(scan([dir], dir)).toEqual([]);
	});

	it('finds nothing in the library or the custom elements', () => {
		const root = resolve(import.meta.dirname, '../..');
		expect(scan([join(root, 'src/lib'), join(root, 'src/elements')], root)).toEqual([]);
	});
});
