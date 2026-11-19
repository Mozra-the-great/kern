/**
 * Forms and content parity with stuffcloud and nagellacke (#50–#54, #72), on the server-rendered
 * markup: element choice, attributes, ids and roles. Mirrors the cases of stuffcloud's
 * buttons.test.ts, fields.test.ts and dropzone.test.ts (accept grammar). Clicks, drops, keyboard and
 * live-region timing run in a browser in tests/elements/parity.spec.ts.
 */
import { describe, expect, it } from 'vitest';
import Button from '../../src/lib/components/Button.svelte';
import Card from '../../src/lib/components/Card.svelte';
import CopyButton from '../../src/lib/components/CopyButton.svelte';
import FileDrop from '../../src/lib/components/FileDrop.svelte';
import IconButton from '../../src/lib/components/IconButton.svelte';
import Input from '../../src/lib/components/Input.svelte';
import Select from '../../src/lib/components/Select.svelte';
import StatusMessage from '../../src/lib/components/StatusMessage.svelte';
import Textarea from '../../src/lib/components/Textarea.svelte';
import { matchesAccept, splitFiles } from '../../src/lib/components/accept.js';
import { joinIds } from '../../src/lib/components/data-utils.js';
import FieldHarness from './FieldHarness.svelte';
import { html, one, snippet, tags, text } from './html.js';

const file = (name: string, type = ''): File => new File(['content'], name, { type });
const classes = (attrs: Record<string, string>): string[] => (attrs.class ?? '').split(/\s+/).filter(Boolean);

describe('matchesAccept (stuffcloud accept.ts)', () => {
	it('accepts everything without a list', () => {
		expect(matchesAccept(file('a.bin'), undefined)).toBe(true);
		expect(matchesAccept(file('a.bin'), '')).toBe(true);
		expect(matchesAccept(file('a.bin'), ' , ,')).toBe(true);
	});
	it('matches extensions case-insensitively and only at the end', () => {
		expect(matchesAccept(file('doc.PDF'), '.pdf')).toBe(true);
		expect(matchesAccept(file('doc.pdf'), '.PDF')).toBe(true);
		expect(matchesAccept(file('doc.pdf.exe'), '.pdf')).toBe(false);
		expect(matchesAccept(file('pdf'), '.pdf')).toBe(false);
	});
	it('matches wildcard types by prefix and exact types exactly', () => {
		expect(matchesAccept(file('a', 'IMAGE/JPEG'), 'image/*')).toBe(true);
		expect(matchesAccept(file('a', 'imagex/png'), 'image/*')).toBe(false);
		expect(matchesAccept(file('a', ''), 'image/*')).toBe(false);
		expect(matchesAccept(file('a', 'application/pdf'), 'application/pdf')).toBe(true);
		expect(matchesAccept(file('a', 'application/pdfx'), 'application/pdf')).toBe(false);
	});
	it('accepts a file that matches any entry of the list', () => {
		const accept = ' .pdf , image/* , application/zip ';
		expect(matchesAccept(file('a.pdf'), accept)).toBe(true);
		expect(matchesAccept(file('a', 'image/gif'), accept)).toBe(true);
		expect(matchesAccept(file('a.txt', 'text/plain'), accept)).toBe(false);
	});
	it('splits a drop; without multiple the first accepted file stays and the rest is rejected', () => {
		const [a, b, c] = [file('a.pdf'), file('b.pdf'), file('c.txt')];
		expect(splitFiles([a, c, b], '.pdf', true)).toEqual({ accepted: [a, b], rejected: [c] });
		expect(splitFiles([c, a, b], '.pdf', false)).toEqual({ accepted: [a], rejected: [c, b] });
		expect(splitFiles([], '.pdf', true)).toEqual({ accepted: [], rejected: [] });
	});
});

describe('joinIds', () => {
	it('joins present ids in order, drops empty and repeated ones', () => {
		expect(joinIds('a', undefined, 'b')).toBe('a b');
		expect(joinIds('a b', ' b c ', null)).toBe('a b c');
		expect(joinIds(undefined, '')).toBeUndefined();
	});
});

describe('Button (#52, stuffcloud buttons.test.ts)', () => {
	const children = snippet('Save');

	it('renders a real button that is type=button unless told otherwise', () => {
		const btn = one(html(Button, { children }), 'button');
		expect(btn.attrs.type).toBe('button');
		expect(one(html(Button, { type: 'submit', children }), 'button').attrs.type).toBe('submit');
	});
	it('passes disabled and aria attributes through', () => {
		const btn = one(html(Button, { disabled: true, 'aria-label': 'Send', children }), 'button');
		expect('disabled' in btn.attrs).toBe(true);
		expect(btn.attrs['aria-label']).toBe('Send');
	});
	it('maps the stuffcloud variants and sizes', () => {
		// stuffcloud primary|ghost|danger → kern primary|secondary|danger; compact → sm; icon → icon.
		const btn = one(html(Button, { variant: 'danger', size: 'sm', wide: true, children }), 'button');
		expect(btn.attrs['data-variant']).toBe('danger');
		expect(btn.attrs['data-size']).toBe('sm');
		expect(classes(btn.attrs)).toEqual(expect.arrayContaining(['wide', 'block']));
		expect(one(html(Button, { size: 'icon', 'aria-label': 'Add', children }), 'button').attrs['data-size']).toBe('icon');
	});
	it('renders a link with href and passes the link attributes through', () => {
		const markup = html(Button, { href: '/tools', target: '_blank', rel: 'noopener', download: 'a.txt', variant: 'secondary', children });
		expect(tags(markup, 'button')).toHaveLength(0);
		const link = one(markup, 'a');
		expect(link.attrs).toMatchObject({ href: '/tools', target: '_blank', rel: 'noopener', download: 'a.txt', 'data-variant': 'secondary' });
		expect(link.attrs.role).toBeUndefined();
		expect(link.attrs['aria-disabled']).toBeUndefined();
	});
	it('keeps a disabled link an <a>, without href and marked aria-disabled', () => {
		for (const props of [{ disabled: true }, { loading: true }]) {
			const markup = html(Button, { href: '/tools', target: '_blank', ...props, children });
			expect(tags(markup, 'button')).toHaveLength(0);
			const link = one(markup, 'a');
			expect(link.attrs.href).toBeUndefined();
			expect(link.attrs.target).toBeUndefined();
			expect(link.attrs.role).toBe('link');
			expect(link.attrs['aria-disabled']).toBe('true');
		}
	});
	it('uses the theme token for the disabled look and handles forced colours', async () => {
		const { readFile } = await import('node:fs/promises');
		for (const path of ['src/lib/components/Button.svelte', 'src/lib/components/IconButton.svelte']) {
			const source = await readFile(path, 'utf8');
			expect(source).toContain('opacity: var(--k-disabled-opacity)');
			expect(source).toContain('@media (forced-colors: active)');
		}
		const stuffcloud = await readFile('src/lib/themes/brands/stuffcloud.css', 'utf8');
		expect(stuffcloud).toContain('--k-disabled-opacity: 0.4');
	});
	it('IconButton keeps its label as the accessible name', () => {
		expect(one(html(IconButton, { label: 'Close', children: snippet('x') }), 'button').attrs['aria-label']).toBe('Close');
	});
});

describe('Card (#50, #51)', () => {
	it('renders an article by default and the chosen element with as', () => {
		expect(tags(html(Card, { title: 'T' }), 'article')).toHaveLength(1);
		for (const as of ['div', 'section', 'li'] as const) {
			const markup = html(Card, { as, children: snippet('Body') });
			expect(tags(markup, as)[0]?.attrs.class).toContain('k-card');
			expect(tags(markup, 'article')).toHaveLength(0);
		}
	});
	it('has no heading without a title', () => {
		expect(tags(html(Card, { children: snippet('Body') })).some((t) => /^h\d$/.test(t.name))).toBe(false);
	});
	it('passes id, aria-*, data-* and role attributes to the root', () => {
		const root = one(html(Card, { as: 'section', id: 'c1', 'aria-labelledby': 'h', 'data-kind': 'x', title: 'T' }), 'section');
		expect(root.attrs).toMatchObject({ id: 'c1', 'aria-labelledby': 'h', 'data-kind': 'x' });
	});
	it('with onclick the title is a button; nothing interactive is nested in it', () => {
		const markup = html(Card, {
			title: 'Ruby Red',
			onclick: () => undefined,
			actionLabel: 'Edit Ruby Red',
			actionHaspopup: 'dialog',
			badges: snippet('<span>2×</span>'),
			footer: snippet('<button type="button">Photo</button><button type="button">Delete</button>')
		});
		const buttons = tags(markup, 'button');
		expect(buttons.map((b) => b.attrs['aria-label'] ?? '')).toEqual(['Edit Ruby Red', '', '']);
		const primary = one(markup, 'button', { 'aria-label': 'Edit Ruby Red' });
		expect(primary.attrs['aria-haspopup']).toBe('dialog');
		expect(primary.attrs.type).toBe('button');
		// The primary button closes before the next control starts: no nesting.
		const close = markup.indexOf('</button>', primary.at);
		expect(close).toBeLessThan(buttons[1]?.at ?? Infinity);
		expect(markup.slice(primary.at, close)).toContain('Ruby Red');
		expect(tags(markup, 'h3')).toHaveLength(1);
		expect(markup).toContain('class="badges');
	});
	it('without a title the button covers the card and is named by actionLabel', () => {
		const btn = one(html(Card, { onclick: () => undefined, actionLabel: 'Open photo', children: snippet('<img alt="">') }), 'button');
		expect(btn.attrs['aria-label']).toBe('Open photo');
		expect(classes(btn.attrs)).toContain('cover');
	});
	it('href wins over onclick and makes the title a link', () => {
		const markup = html(Card, { title: 'T', href: '/x', onclick: () => undefined });
		expect(one(markup, 'a').attrs.href).toBe('/x');
		expect(tags(markup, 'button')).toHaveLength(0);
	});
	it('muted adds the muted look', () => {
		expect(classes(one(html(Card, { title: 'T', muted: true }), 'article').attrs)).toContain('muted');
	});
});

describe('Field, Input, Select, Textarea (#54, stuffcloud fields.test.ts)', () => {
	it('labels the control and leaves it undescribed without hint and error', () => {
		const markup = html(FieldHarness, { label: 'Name' });
		expect(one(markup, 'label').attrs.for).toBe('ctl');
		expect(one(markup, 'input').attrs['aria-describedby']).toBeUndefined();
	});
	it('links the hint through aria-describedby', () => {
		const markup = html(FieldHarness, { label: 'Name', hint: 'Letters only' });
		const hint = one(markup, 'p');
		expect(one(markup, 'input').attrs['aria-describedby']).toBe(hint.attrs.id);
		expect(hint.attrs.role).toBeUndefined();
	});
	it('the error replaces the hint by default and is an alert', () => {
		const markup = html(FieldHarness, { label: 'Name', hint: 'Letters only', error: 'Too short' });
		const error = one(markup, 'p');
		expect(error.attrs.role).toBe('alert');
		expect(text(markup)).not.toContain('Letters only');
		expect(one(markup, 'input').attrs).toMatchObject({ 'aria-describedby': error.attrs.id, 'aria-invalid': 'true' });
	});
	it('keepHint shows both and references the error before the hint', () => {
		const markup = html(FieldHarness, { label: 'Name', hint: 'Letters only', error: 'Too short', keepHint: true });
		const [error, hint] = tags(markup, 'p');
		expect(error?.attrs.role).toBe('alert');
		expect(one(markup, 'input').attrs['aria-describedby']).toBe(`${error?.attrs.id ?? ''} ${hint?.attrs.id ?? ''}`);
		expect(text(markup)).toContain('Letters only');
	});
	it('announce=false drops the alert role', () => {
		expect(one(html(FieldHarness, { error: 'x', announce: false }), 'p').attrs.role).toBeUndefined();
	});
	it('treats empty hint and error texts as absent', () => {
		const markup = html(FieldHarness, { label: 'Name', hint: '', error: '' });
		expect(tags(markup, 'p')).toHaveLength(0);
		expect(one(markup, 'input').attrs['aria-describedby']).toBeUndefined();
	});
	it('hands required to the control (the visible marker is aria-hidden)', () => {
		const markup = html(FieldHarness, { label: 'Name', required: true });
		expect(one(markup, 'input').attrs['aria-required']).toBe('true');
		expect(one(markup, 'span').attrs['aria-hidden']).toBe('true');
	});
	it('labelId names the label element', () => {
		expect(one(html(FieldHarness, { label: 'Name', labelId: 'lbl' }), 'label').attrs.id).toBe('lbl');
	});

	const options = [{ value: 'a', label: 'A' }];
	const controls = [
		['input', (p: Record<string, unknown>) => html(Input, p)],
		['textarea', (p: Record<string, unknown>) => html(Textarea, p)],
		['select', (p: Record<string, unknown>) => html(Select, { options, ...p })]
	] as const;
	for (const [tag, renderControl] of controls) {
		it(`<${tag}>: error, hint and the consumer's aria-describedby, in that order`, () => {
			const markup = renderControl({ label: 'L', hint: 'H', error: 'E', keepHint: true, 'aria-describedby': 'strength' });
			const [error, hint] = tags(markup, 'p');
			const control = one(markup, tag);
			expect(control.attrs['aria-describedby']).toBe(`${error?.attrs.id ?? ''} ${hint?.attrs.id ?? ''} strength`);
			expect(control.attrs['aria-invalid']).toBe('true');
			expect(one(markup, 'label').attrs.for).toBe(control.attrs.id);
		});
		it(`<${tag}>: a consumer aria-describedby alone survives`, () => {
			expect(one(renderControl({ label: 'L', 'aria-describedby': 'strength' }), tag).attrs['aria-describedby']).toBe('strength');
		});
	}
});

describe('FileDrop (#53)', () => {
	it('is one button by default', () => {
		const markup = html(FileDrop, { label: 'Files' });
		expect(tags(markup, 'button')).toHaveLength(1);
		expect(tags(markup, 'div').some((t) => t.attrs.role === 'group')).toBe(false);
	});
	it('with buttonLabel: a group named by label and drop text, holding a real button', () => {
		const markup = html(FileDrop, { label: 'Files', buttonLabel: 'Choose files', dropLabel: 'Drop PDFs here', accept: '.pdf' });
		const group = tags(markup, 'div').find((t) => t.attrs.role === 'group');
		const label = one(markup, 'label');
		const prompt = one(markup, 'span', {
			class: tags(markup, 'span').find((s) => (s.attrs.class ?? '').includes('prompt'))?.attrs.class ?? ''
		});
		expect(group?.attrs['aria-labelledby']).toBe(`${label.attrs.id ?? ''} ${prompt.attrs.id ?? ''}`);
		expect(label.attrs.for).toBeUndefined();
		expect(text(markup)).toContain('Choose files');
		expect(one(markup, 'input').attrs).toMatchObject({ type: 'file', tabindex: '-1', accept: '.pdf' });
	});
	it('dispatch mode keeps no form name and no list', () => {
		const markup = html(FileDrop, { mode: 'dispatch', name: 'docs', files: [file('a.pdf')] });
		expect(one(markup, 'input').attrs.name).toBeUndefined();
		expect(tags(markup, 'ul')).toHaveLength(0);
		const field = html(FileDrop, { name: 'docs', files: [file('a.pdf')] });
		expect(one(field, 'input').attrs.name).toBe('docs');
		expect(tags(field, 'ul')).toHaveLength(1);
	});
	it('never reads file content (no FileReader, arrayBuffer or text in the source)', async () => {
		const { readFile } = await import('node:fs/promises');
		for (const path of ['src/lib/components/FileDrop.svelte', 'src/lib/components/accept.ts']) {
			expect(await readFile(path, 'utf8')).not.toMatch(/FileReader|\.arrayBuffer\(|\.text\(\)|\.stream\(|\.bytes\(|fetch\(/);
		}
	});
});

describe('CopyButton and StatusMessage (#72)', () => {
	it('is icon-only with the label as aria-label by default', () => {
		const btn = one(html(CopyButton, { text: 'x', label: 'Copy HEX' }), 'button');
		expect(btn.attrs['aria-label']).toBe('Copy HEX');
	});
	it('showLabel makes the label visible text and the accessible name', () => {
		const markup = html(CopyButton, { text: 'x', label: 'Copy HEX', showLabel: true });
		expect(one(markup, 'button').attrs['aria-label']).toBeUndefined();
		expect(text(markup)).toBe('Copy HEX');
	});
	it('the live region exists and is empty before the first click', () => {
		const region = one(html(CopyButton, { text: 'x' }), 'span', { role: 'status' });
		expect(region.attrs['aria-live']).toBe('polite');
	});
	it('StatusMessage is a visible status, empty from the first paint', () => {
		const markup = html(StatusMessage, {});
		const p = one(markup, 'p');
		expect(p.attrs.role).toBe('status');
		expect(text(markup)).toBe('');
		expect(classes(p.attrs)).toContain('reserve');
	});
	it('StatusMessage kind=alert is an alert and passes attributes through', () => {
		const p = one(html(StatusMessage, { kind: 'alert', message: 'Failed', id: 's', reserve: false }), 'p');
		expect(p.attrs).toMatchObject({ role: 'alert', id: 's', 'data-kind': 'alert' });
		expect(classes(p.attrs)).not.toContain('reserve');
	});
});
