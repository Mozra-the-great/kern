/**
 * saveBlob / saveText (#92), node side: file name cleaning, MIME defaults, the typed results, the server
 * (no document) case, and the DOM sequence against a stand-in document (object URL, clicked link, URL revoked
 * after the click). The real download in a browser is tested by tests/elements/download.spec.ts.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetStrings, setStrings } from '../../src/lib/components/strings.js';
import {
	REVOKE_DELAY_MS,
	isBlob,
	sanitizeFileName,
	saveBlob,
	saveText,
	textMimeType,
	type DownloadResult
} from '../../src/lib/components/download.js';

afterEach(() => {
	resetStrings();
	vi.useRealTimers();
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe('sanitizeFileName', () => {
	it('stays linear on long runs of dots and spaces (no ReDoS, CodeQL js/polynomial-redos)', () => {
		const hostile = `${' .'.repeat(50_000)}x`;
		const start = performance.now();
		expect(sanitizeFileName(hostile)).toMatch(/x$/);
		expect(sanitizeFileName(`${'. '.repeat(50_000)}`)).toBe('download');
		expect(performance.now() - start).toBeLessThan(500);
		// Trailing dots and spaces are still dropped, also after shortening.
		expect(sanitizeFileName('name. . .')).toBe('name');
		expect(sanitizeFileName(`${'a'.repeat(170)}. . . . . . . . . .txt`)).toMatch(/^a+\.txt$/);
	});

	it('keeps an ordinary name, with spaces, dots and non-Latin letters', () => {
		expect(sanitizeFileName('report.csv')).toBe('report.csv');
		expect(sanitizeFileName('Quartals bericht 2026.final.xlsx')).toBe('Quartals bericht 2026.final.xlsx');
		expect(sanitizeFileName('Übersicht – 日本語 😀.txt')).toBe('Übersicht – 日本語 😀.txt');
		expect(sanitizeFileName('.gitignore')).toBe('.gitignore');
	});

	it('turns path separators and the characters Windows forbids into underscores', () => {
		expect(sanitizeFileName('../../etc/passwd')).toBe('.._.._etc_passwd');
		expect(sanitizeFileName('C:\\Users\\me\\a.txt')).toBe('C__Users_me_a.txt');
		expect(sanitizeFileName('a<b>c:d"e|f?g*h.txt')).toBe('a_b_c_d_e_f_g_h.txt');
	});

	it('removes control, zero-width and direction-override characters', () => {
		expect(sanitizeFileName('a\u0000b\u001fc\u007fd\u0085e.txt')).toBe('abcde.txt');
		expect(sanitizeFileName('a\n\r\tb.txt')).toBe('ab.txt');
		// "evil" + RIGHT-TO-LEFT OVERRIDE + "gnp.exe" would display as "evilexe.png".
		expect(sanitizeFileName('evil\u202Egnp.exe')).toBe('evilgnp.exe');
		expect(sanitizeFileName('\ufeffname\u200b.txt')).toBe('name.txt');
		expect(sanitizeFileName('a\u2028b.txt')).toBe('a b.txt');
		expect(sanitizeFileName('lone\ud800surrogate.txt')).toBe('lonesurrogate.txt');
	});

	it('trims spaces and trailing dots, which Windows drops silently', () => {
		expect(sanitizeFileName('  name.txt  ')).toBe('name.txt');
		expect(sanitizeFileName('name.')).toBe('name');
		expect(sanitizeFileName('name. . ')).toBe('name');
	});

	it('falls back for names that are empty after cleaning', () => {
		expect(sanitizeFileName('')).toBe('download');
		expect(sanitizeFileName('   ')).toBe('download');
		expect(sanitizeFileName('.')).toBe('download');
		expect(sanitizeFileName('..')).toBe('download');
		expect(sanitizeFileName('\u0000\u202e')).toBe('download');
		expect(sanitizeFileName(undefined)).toBe('download');
		expect(sanitizeFileName(42)).toBe('download');
		expect(sanitizeFileName(null, 'data.bin')).toBe('data.bin');
	});

	it('cleans the fallback by the same rules and never returns an empty name', () => {
		expect(sanitizeFileName('', '../x')).toBe('.._x');
		expect(sanitizeFileName('', '')).toBe('download');
		expect(sanitizeFileName('', '..')).toBe('download');
	});

	it('takes the fallback from the catalogue', () => {
		setStrings({ downloadButton: { fallbackName: 'datei' } });
		expect(sanitizeFileName('')).toBe('datei');
		expect(sanitizeFileName('x.txt')).toBe('x.txt');
		setStrings({ downloadButton: { fallbackName: '' } });
		expect(sanitizeFileName('')).toBe('download');
	});

	it('prefixes names Windows reserves', () => {
		expect(sanitizeFileName('CON')).toBe('_CON');
		expect(sanitizeFileName('nul.txt')).toBe('_nul.txt');
		expect(sanitizeFileName('com1.log')).toBe('_com1.log');
		expect(sanitizeFileName('LPT9')).toBe('_LPT9');
		expect(sanitizeFileName('console.txt')).toBe('console.txt');
		expect(sanitizeFileName('com0.txt')).toBe('com0.txt');
	});

	it('shortens a very long name and keeps its extension', () => {
		const long = `${'a'.repeat(400)}.json`;
		const out = sanitizeFileName(long);
		expect(Array.from(out)).toHaveLength(180);
		expect(out.endsWith('.json')).toBe(true);
		const noExtension = sanitizeFileName('b'.repeat(400));
		expect(Array.from(noExtension)).toHaveLength(180);
		// A "extension" that is itself too long is cut like the rest, and a cut never splits a surrogate pair.
		const emoji = sanitizeFileName('😀'.repeat(300));
		expect(Array.from(emoji)).toHaveLength(180);
		expect(emoji).not.toMatch(/[\ud800-\udbff](?![\udc00-\udfff])/);
	});
});

describe('textMimeType', () => {
	it('defaults to text/plain and adds UTF-8', () => {
		expect(textMimeType()).toBe('text/plain;charset=utf-8');
		expect(textMimeType('')).toBe('text/plain;charset=utf-8');
		expect(textMimeType('   ')).toBe('text/plain;charset=utf-8');
		expect(textMimeType('text/csv')).toBe('text/csv;charset=utf-8');
		expect(textMimeType('application/json')).toBe('application/json;charset=utf-8');
		expect(textMimeType('image/svg+xml')).toBe('image/svg+xml;charset=utf-8');
		expect(textMimeType(' Text/CSV ')).toBe('text/csv;charset=utf-8');
	});

	it('keeps a charset the caller chose', () => {
		expect(textMimeType('text/html; charset=iso-8859-1')).toBe('text/html; charset=iso-8859-1');
		expect(textMimeType('text/csv;charset=utf-16')).toBe('text/csv;charset=utf-16');
	});

	it('keeps other parameters and still adds the charset', () => {
		expect(textMimeType('text/csv; header=present')).toBe('text/csv; header=present;charset=utf-8');
	});

	it('replaces what is not a MIME type by text/plain', () => {
		for (const bad of ['csv', 'text/', '/csv', 'text csv/x', 'text/csv\r\nX-Evil: 1', 'text/csv;', 'text/csv; x', '😀/x']) {
			expect(textMimeType(bad), bad).toBe('text/plain;charset=utf-8');
		}
		expect(textMimeType(5 as unknown as string)).toBe('text/plain;charset=utf-8');
	});
});

describe('isBlob', () => {
	it('accepts Blob and File and nothing else', () => {
		expect(isBlob(new Blob(['x']))).toBe(true);
		expect(isBlob(new File(['x'], 'a.txt'))).toBe(true);
		for (const other of [undefined, null, 'x', 1, {}, { size: 1 }, [], new ArrayBuffer(1)]) expect(isBlob(other)).toBe(false);
	});
});

describe('on the server (no document)', () => {
	it('returns a typed failure and never throws', () => {
		expect(typeof document).toBe('undefined');
		expect(saveBlob('a.txt', new Blob(['x']))).toEqual({ ok: false, error: { code: 'no-dom', message: expect.any(String) as string } });
		expect(saveText('a.txt', 'x')).toMatchObject({ ok: false, error: { code: 'no-dom' } });
		// Invalid input does not change that: there is nothing to download from either way.
		expect(saveBlob('a.txt', 'x' as unknown as Blob)).toMatchObject({ ok: false, error: { code: 'no-dom' } });
		expect(saveText('a.txt', 5 as unknown as string)).toMatchObject({ ok: false, error: { code: 'no-dom' } });
	});
});

/** A document that records what the helper does to it. */
function fakeDocument() {
	const log: string[] = [];
	const links: Array<{
		href: string;
		download: string;
		rel: string;
		style: { display: string };
		clicks: number;
		bubbled: boolean;
		removed: boolean;
	}> = [];
	const body = {
		append(node: unknown) {
			log.push('append');
			expect(links).toContain(node);
		}
	};
	const document = {
		body,
		documentElement: body,
		createElement(tag: string) {
			expect(tag).toBe('a');
			let handler: ((event: { stopPropagation(): void }) => void) | undefined;
			const link = {
				href: '',
				download: '',
				rel: '',
				style: { display: '' },
				clicks: 0,
				bubbled: true,
				removed: false,
				addEventListener(type: string, fn: (event: { stopPropagation(): void }) => void) {
					expect(type).toBe('click');
					handler = fn;
				},
				click() {
					log.push('click');
					link.clicks++;
					handler?.({
						stopPropagation() {
							link.bubbled = false;
						}
					});
				},
				remove() {
					log.push('remove');
					link.removed = true;
				}
			};
			links.push(link);
			return link;
		}
	};
	return { document, links, log };
}

describe('in a document', () => {
	let created: Blob[];
	let revoked: string[];
	beforeEach(() => {
		created = [];
		revoked = [];
		vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
			created.push(blob as Blob);
			return `blob:test/${String(created.length)}`;
		});
		vi.spyOn(URL, 'revokeObjectURL').mockImplementation((url) => void revoked.push(url));
		vi.useFakeTimers();
	});

	it('clicks a temporary <a download> with an object URL and revokes it after the click, not during it', () => {
		const dom = fakeDocument();
		vi.stubGlobal('document', dom.document);
		const blob = new Blob(['a,b\n'], { type: 'text/csv' });
		const result = saveBlob('report.csv', blob);
		expect(result).toEqual({ ok: true, name: 'report.csv', size: 4, type: 'text/csv' });
		expect(created).toEqual([blob]);
		const [link] = dom.links;
		expect(link).toMatchObject({ href: 'blob:test/1', download: 'report.csv', rel: 'noopener', clicks: 1, removed: true });
		expect(dom.log).toEqual(['append', 'click', 'remove']);
		// The synthetic click does not reach handlers of the page.
		expect(link?.bubbled).toBe(false);
		// Not revoked inside the call (the click handler of the caller is still running) …
		expect(revoked).toEqual([]);
		vi.advanceTimersByTime(REVOKE_DELAY_MS - 1);
		expect(revoked).toEqual([]);
		// … but a moment later, once.
		vi.advanceTimersByTime(1);
		expect(revoked).toEqual(['blob:test/1']);
		vi.runAllTimers();
		expect(revoked).toEqual(['blob:test/1']);
	});

	it('cleans the name and reports the name it used', () => {
		vi.stubGlobal('document', fakeDocument().document);
		expect(saveBlob('../../a:b.txt', new Blob(['x']))).toMatchObject({ ok: true, name: '.._.._a_b.txt', type: '' });
		expect(saveBlob('', new Blob(['x']))).toMatchObject({ ok: true, name: 'download' });
		expect(saveBlob('', new Blob(['x']), { fallbackName: 'export.bin' })).toMatchObject({ ok: true, name: 'export.bin' });
		setStrings({ downloadButton: { fallbackName: 'datei' } });
		expect(saveBlob('', new Blob(['x']))).toMatchObject({ ok: true, name: 'datei' });
	});

	it('saveText writes UTF-8 with the MIME default, or the type given', async () => {
		vi.stubGlobal('document', fakeDocument().document);
		const text = 'Grüße, 日本語, 😀';
		expect(saveText('a.txt', text)).toMatchObject({ ok: true, name: 'a.txt', type: 'text/plain;charset=utf-8' });
		expect(saveText('a.json', '{}', 'application/json')).toMatchObject({ type: 'application/json;charset=utf-8' });
		expect(saveText('a.csv', 'x', 'csv')).toMatchObject({ type: 'text/plain;charset=utf-8' });
		const [first] = created;
		expect(first?.type).toBe('text/plain;charset=utf-8');
		expect(first?.size).toBe(new TextEncoder().encode(text).length);
		expect(await first?.text()).toBe(text);
		expect((saveText('a.txt', 'abc') as DownloadResult & { ok: true }).size).toBe(3);
	});

	it('an empty text is a valid, empty file', () => {
		vi.stubGlobal('document', fakeDocument().document);
		expect(saveText('empty.txt', '')).toMatchObject({ ok: true, size: 0 });
	});

	it('rejects what is not a Blob or a string with code "invalid", without touching the document', () => {
		const dom = fakeDocument();
		vi.stubGlobal('document', dom.document);
		expect(saveBlob('a.txt', 'text' as unknown as Blob)).toMatchObject({ ok: false, error: { code: 'invalid' } });
		expect(saveBlob('a.txt', undefined as unknown as Blob)).toMatchObject({ ok: false, error: { code: 'invalid' } });
		expect(saveText('a.txt', 5 as unknown as string)).toMatchObject({ ok: false, error: { code: 'invalid' } });
		expect(created).toEqual([]);
		expect(dom.links).toEqual([]);
	});

	it('returns code "failed" with the cause when the browser throws, and gives the URL back', () => {
		const boom = new Error('blocked');
		const dom = fakeDocument();
		vi.stubGlobal('document', dom.document);
		const link = dom.document.createElement;
		dom.document.createElement = (tag: string) => {
			const made = link(tag);
			made.click = () => {
				throw boom;
			};
			return made;
		};
		const result = saveBlob('a.txt', new Blob(['x']));
		expect(result).toMatchObject({ ok: false, error: { code: 'failed', cause: boom } });
		// The link is removed anyway, and the URL does not leak.
		expect(dom.links[0]?.removed).toBe(true);
		vi.runAllTimers();
		expect(revoked).toEqual(['blob:test/1']);
	});

	it('returns code "failed" when the object URL cannot be created', () => {
		vi.stubGlobal('document', fakeDocument().document);
		vi.spyOn(URL, 'createObjectURL').mockImplementation(() => {
			throw new Error('quota');
		});
		expect(saveBlob('a.txt', new Blob(['x']))).toMatchObject({ ok: false, error: { code: 'failed' } });
		vi.runAllTimers();
		expect(revoked).toEqual([]);
	});

	it('does not throw when revoking fails', () => {
		vi.stubGlobal('document', fakeDocument().document);
		vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {
			throw new Error('gone');
		});
		expect(saveBlob('a.txt', new Blob(['x'])).ok).toBe(true);
		expect(() => vi.runAllTimers()).not.toThrow();
	});
});
