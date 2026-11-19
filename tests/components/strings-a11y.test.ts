/**
 * Strings, Prose and the accessibility primitives (#58, #59, #64) on the server-rendered markup:
 * defaults from the catalogue (English and German), props winning, escaping, rel and roles. Focus
 * movement, live-region timing and the other build run in a browser:
 * tests/elements/strings.spec.ts and tests/elements/a11y-primitives.spec.ts.
 */
import { afterEach, describe, expect, it } from 'vitest';
import Alert from '../../src/lib/components/Alert.svelte';
import Kbd from '../../src/lib/components/Kbd.svelte';
import Link from '../../src/lib/components/Link.svelte';
import LiveAnnouncer from '../../src/lib/components/LiveAnnouncer.svelte';
import Modal from '../../src/lib/components/Modal.svelte';
import OnlineStatus from '../../src/lib/components/OnlineStatus.svelte';
import Pagination from '../../src/lib/components/Pagination.svelte';
import Prose from '../../src/lib/components/Prose.svelte';
import SkipLink from '../../src/lib/components/SkipLink.svelte';
import Spinner from '../../src/lib/components/Spinner.svelte';
import StatusDot from '../../src/lib/components/StatusDot.svelte';
import { de } from '../../src/lib/components/strings-de.js';
import { resetStrings, setStrings } from '../../src/lib/components/strings.js';
import { html, one, snippet, tags, text } from './html.js';

afterEach(() => {
	resetStrings();
});

describe('default texts from the catalogue', () => {
	it('are English without a choice', () => {
		expect(text(html(Spinner, {}))).toBe('Loading');
		expect(one(html(Alert, { ondismiss: () => undefined }), 'button').attrs['aria-label']).toBe('Dismiss');
	});

	it('follow setStrings(de), for components rendered afterwards', () => {
		setStrings(de);
		expect(text(html(Spinner, {}))).toBe('Lädt');
		expect(one(html(Alert, { ondismiss: () => undefined }), 'button').attrs['aria-label']).toBe('Schließen');
		const pagination = html(Pagination, { page: 2, pageCount: 5 });
		expect(text(pagination)).toContain('Seite 2 von 5');
	});

	it('are replaced one by one, and the rest stays', () => {
		setStrings({ spinner: { label: 'Un instant' } });
		expect(text(html(Spinner, {}))).toBe('Un instant');
		expect(one(html(Alert, { ondismiss: () => undefined }), 'button').attrs['aria-label']).toBe('Dismiss');
	});

	it('lose against a prop, also an empty one', () => {
		setStrings(de);
		expect(text(html(Spinner, { label: 'Working' }))).toBe('Working');
		expect(one(html(Alert, { ondismiss: () => undefined, dismissLabel: 'Close it' }), 'button').attrs['aria-label']).toBe('Close it');
		expect(one(html(Alert, { ondismiss: () => undefined, dismissLabel: '' }), 'button').attrs['aria-label']).toBe('');
	});

	it('treat an undefined prop like a missing one', () => {
		setStrings(de);
		expect(text(html(Spinner, { label: undefined }))).toBe('Lädt');
	});

	it('reach the labels that are not props: key names, statuses and the title of a dialog', () => {
		setStrings(de);
		expect(text(html(Kbd, { keys: ['shift', 'enter'], platform: 'other' }))).toContain('Umschalttaste');
		expect(text(html(StatusDot, { status: 'down' }))).toContain('Ausgefallen');
		expect(one(html(Modal, { open: true, title: 'T', children: snippet('<p>x</p>') }), 'button').attrs['aria-label']).toBe('Schließen');
	});

	it('are merged per status: a partial statusLabels keeps the catalogue for the rest', () => {
		setStrings(de);
		const markup = html(StatusDot, { status: 'warn', statusLabels: { ok: 'Läuft' } });
		expect(text(markup)).toContain('Beeinträchtigt');
	});

	it('give the external-link hint its own prop and catalogue entry', () => {
		const external = (props: object) =>
			text(html(Link, { href: 'https://example.com', external: true, children: snippet('Docs'), ...props }));
		expect(external({})).toContain('(opens in a new tab)');
		setStrings(de);
		expect(external({})).toContain('(öffnet in einem neuen Tab)');
		expect(external({ externalLabel: '(new window)' })).toContain('(new window)');
	});
});

describe('Prose', () => {
	it('renders plain text as paragraphs and lines', () => {
		const markup = html(Prose, { text: 'Mara Lind\nBeispielweg 12\n\nKontakt' });
		expect(tags(markup, 'p')).toHaveLength(2);
		expect(tags(markup, 'br')).toHaveLength(1);
		expect(text(markup)).toBe('Mara Lind Beispielweg 12 Kontakt');
	});

	it('never reads text as HTML', () => {
		const markup = html(Prose, { text: '<img src=x onerror=alert(1)> <b>bold</b> <script>alert(1)</script> &amp;' });
		expect(tags(markup, 'img')).toHaveLength(0);
		expect(tags(markup, 'b')).toHaveLength(0);
		expect(tags(markup, 'script')).toHaveLength(0);
		expect(markup).toContain('&lt;img src=x onerror=alert(1)>');
		expect(markup).toContain('&amp;amp;');
	});

	it('makes external links that keep rel="noopener noreferrer"', () => {
		const markup = html(Prose, { text: 'Siehe https://example.com/impressum.' });
		const link = one(markup, 'a');
		expect(link.attrs).toMatchObject({ href: 'https://example.com/impressum', target: '_blank', rel: 'noopener noreferrer' });
		expect(text(markup)).toContain('(opens in a new tab)');
	});

	it('makes e-mail links without a new tab', () => {
		const link = one(html(Prose, { text: 'Mail: kontakt@example.com' }), 'a');
		expect(link.attrs.href).toBe('mailto:kontakt@example.com');
		expect(link.attrs).not.toHaveProperty('target');
		expect(link.attrs).not.toHaveProperty('rel');
	});

	it('takes the hint of external links from the catalogue or from externalLabel', () => {
		const external = (props: object) => text(html(Prose, { text: 'https://example.com', ...props }));
		setStrings(de);
		expect(external({})).toContain('(öffnet in einem neuen Tab)');
		expect(external({ externalLabel: '(neues Fenster)' })).toContain('(neues Fenster)');
	});

	it('creates no link from other schemes', () => {
		const markup = html(Prose, { text: 'javascript:alert(1) data:text/html,x ftp://example.com' });
		expect(tags(markup, 'a')).toHaveLength(0);
	});

	it('sets children in the same block when there is no text', () => {
		const markup = html(Prose, { children: snippet('<h2>Title</h2><p>Body</p>') });
		expect(one(markup, 'div').attrs.class).toContain('k-prose');
		expect(tags(markup, 'h2')).toHaveLength(1);
	});

	it('treats null like no text and sets the children', () => {
		const markup = html(Prose, { text: null, children: snippet('<p>child</p>') });
		expect(text(markup)).toBe('child');
	});

	it('treats null like no text and sets the children', () => {
		expect(text(html(Prose, { text: null, children: snippet('<p>child</p>') }))).toBe('child');
	});

	it('renders an empty block for empty or blank text, and does not fall back to children', () => {
		for (const value of ['', '  \n\n  ']) {
			const markup = html(Prose, { text: value, children: snippet('<p>child</p>') });
			expect(tags(markup, 'p'), String(value)).toHaveLength(0);
		}
	});
});

describe('SkipLink', () => {
	it('is a link to the target id with the default text', () => {
		const link = one(html(SkipLink, { target: 'main' }), 'a');
		expect(link.attrs).toMatchObject({ href: '#main', class: expect.stringContaining('k-skip-link') as unknown });
		expect(text(html(SkipLink, { target: 'main' }))).toBe('Skip to main content');
	});

	it('takes its text from the label, the catalogue and the language', () => {
		expect(text(html(SkipLink, { target: 'main', label: 'Zum Inhalt' }))).toBe('Zum Inhalt');
		setStrings(de);
		expect(text(html(SkipLink, { target: 'main' }))).toBe('Zum Hauptinhalt springen');
		expect(text(html(SkipLink, { target: 'main', label: undefined }))).toBe('Zum Hauptinhalt springen');
	});

	it('passes other attributes and classes on, and keeps href and target out of reach', () => {
		const link = one(html(SkipLink, { target: 'content', class: 'mine', id: 'skip', href: '#other' }), 'a');
		expect(link.attrs).toMatchObject({ id: 'skip', href: '#content' });
		expect(link.attrs.class).toContain('mine');
	});
});

describe('LiveAnnouncer', () => {
	it('renders both regions, empty, from the first render', () => {
		const markup = html(LiveAnnouncer, {});
		const status = one(markup, 'div', { role: 'status' });
		const alert = one(markup, 'div', { role: 'alert' });
		expect(status.attrs).toMatchObject({ 'aria-live': 'polite', 'aria-atomic': 'true' });
		expect(alert.attrs).toMatchObject({ 'aria-live': 'assertive', 'aria-atomic': 'true' });
		expect(text(markup)).toBe('');
	});
});

describe('OnlineStatus', () => {
	it('renders its region and no notice while the page is assumed online', () => {
		const markup = html(OnlineStatus, {});
		expect(tags(markup, 'div').length).toBe(1);
		expect(text(markup)).toBe('');
		// No announcer is mounted on the server: the region is live itself, so a notice would be spoken.
		expect(one(markup, 'div').attrs.role).toBe('status');
	});
});
