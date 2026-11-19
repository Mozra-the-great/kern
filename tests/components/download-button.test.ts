/**
 * DownloadButton (#92), markup level: names, live regions, texts from the catalogue. Clicks, real downloads and
 * announcements are tested in a browser by tests/elements/download.spec.ts.
 */
import { afterEach, describe, expect, it } from 'vitest';
import DownloadButton from '../../src/lib/components/DownloadButton.svelte';
import { de } from '../../src/lib/components/strings-de.js';
import { resetStrings, setStrings } from '../../src/lib/components/strings.js';
import { html, one, tags, text } from './html.js';

afterEach(resetStrings);

describe('DownloadButton', () => {
	it('is an icon-only button named by the catalogue by default', () => {
		const markup = html(DownloadButton, { text: 'x' });
		const button = one(markup, 'button');
		expect(button.attrs['aria-label']).toBe('Download');
		expect(button.attrs.title).toBe('Download');
		expect(button.attrs.type).toBe('button');
		expect(button.attrs['data-size']).toBe('icon');
		expect(button.attrs['data-variant']).toBe('ghost');
		expect(text(markup)).toBe('');
		expect(markup).toContain('<svg');
	});

	it('uses the label prop as the accessible name', () => {
		expect(one(html(DownloadButton, { label: 'Download report' }), 'button').attrs['aria-label']).toBe('Download report');
	});

	it('showLabel makes the label visible text and the name, and the button a text button', () => {
		const markup = html(DownloadButton, { label: 'Download report', showLabel: true, size: 'sm' });
		const button = one(markup, 'button');
		expect(button.attrs['aria-label']).toBeUndefined();
		expect(button.attrs.title).toBeUndefined();
		expect(button.attrs['data-size']).toBe('sm');
		expect(button.attrs['data-variant']).toBe('secondary');
		expect(text(markup)).toBe('Download report');
	});

	it('an explicit variant wins over the default', () => {
		expect(one(html(DownloadButton, { variant: 'primary', showLabel: true }), 'button').attrs['data-variant']).toBe('primary');
		expect(one(html(DownloadButton, { variant: undefined }), 'button').attrs['data-variant']).toBe('ghost');
	});

	it('has an empty polite status region and an empty alert region from the first paint', () => {
		const markup = html(DownloadButton, { text: 'x' });
		expect(one(markup, 'p', { role: 'status' }).attrs['data-kind']).toBe('status');
		expect(one(markup, 'p', { role: 'alert' }).attrs['data-kind']).toBe('alert');
		expect(text(markup)).toBe('');
	});

	it('hides the success message visually unless showStatus is set; the error is never hidden', () => {
		const regions = (markup: string): string[] => [...markup.matchAll(/<div class="([^"]*line[^"]*)"/g)].map((m) => m[1] ?? '');
		const [success, error] = regions(html(DownloadButton, {}));
		expect(success).toContain('sr');
		expect(error).not.toContain('sr');
		const [shown] = regions(html(DownloadButton, { showStatus: true }));
		expect(shown).not.toContain('sr');
	});

	it('is disabled with the disabled prop and takes undefined like a missing prop', () => {
		expect(one(html(DownloadButton, { disabled: true }), 'button').attrs).toHaveProperty('disabled');
		const plain = one(
			html(DownloadButton, {
				text: undefined,
				blob: undefined,
				getContent: undefined,
				name: undefined,
				type: undefined,
				label: undefined,
				startedLabel: undefined,
				errorLabel: undefined,
				variant: undefined,
				size: undefined,
				resetAfter: undefined,
				disabled: undefined,
				ondownload: undefined,
				onerror: undefined
			}),
			'button'
		);
		expect(plain.attrs).not.toHaveProperty('disabled');
		expect(plain.attrs['aria-label']).toBe('Download');
	});

	it('renders on the server without a document or any download', () => {
		expect(() => html(DownloadButton, { text: 'x', name: 'a.txt', getContent: () => 'y' })).not.toThrow();
		expect(tags(html(DownloadButton, {}), 'button')).toHaveLength(1);
	});

	it('reads its name from the German bundle', () => {
		setStrings(de);
		expect(one(html(DownloadButton, {}), 'button').attrs['aria-label']).toBe('Herunterladen');
		expect(text(html(DownloadButton, { showLabel: true }))).toBe('Herunterladen');
	});
});
