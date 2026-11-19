/**
 * Plain text to nodes (#59), node side: paragraphs, lines, links, and what never becomes a link.
 * The rendered component (escaping, rel, tokens) is tested in tests/components/prose.test.ts.
 */
import { describe, expect, it } from 'vitest';
import { parseProse, type ProseSegment } from '../../src/lib/components/prose.js';

const links = (text: string): ProseSegment[] => parseProse(text).flatMap((p) => p.flatMap((line) => line.filter((s) => s.type === 'link')));

describe('parseProse paragraphs and lines', () => {
	it('splits on blank lines and keeps single line breaks as lines', () => {
		const paragraphs = parseProse('Mara Lind\nBeispielweg 12\n\nKontakt');
		expect(paragraphs).toHaveLength(2);
		expect(paragraphs[0]).toHaveLength(2);
		expect(paragraphs[1]).toEqual([[{ type: 'text', text: 'Kontakt' }]]);
	});

	it('treats whitespace-only lines as blank and many blank lines as one break', () => {
		expect(parseProse('a\n  \t\nb\n\n\n\nc')).toHaveLength(3);
	});

	it('reads CRLF and CR line ends', () => {
		expect(parseProse('a\r\n\r\nb\rc')).toEqual([
			[[{ type: 'text', text: 'a' }]],
			[[{ type: 'text', text: 'b' }], [{ type: 'text', text: 'c' }]]
		]);
	});

	it('returns nothing for empty, blank and non-text input', () => {
		expect(parseProse('')).toEqual([]);
		expect(parseProse(' \n\n ')).toEqual([]);
		expect(parseProse(undefined)).toEqual([]);
		expect(parseProse(null)).toEqual([]);
		expect(parseProse(5 as unknown as string)).toEqual([]);
	});
});

describe('parseProse links', () => {
	it('turns web addresses into external links', () => {
		expect(links('See https://example.com/a?b=1#c now')).toEqual([
			{ type: 'link', text: 'https://example.com/a?b=1#c', href: 'https://example.com/a?b=1#c', external: true }
		]);
		expect(links('http://example.com')[0]).toMatchObject({ href: 'http://example.com', external: true });
	});

	it('turns e-mail addresses into mailto links that are not external', () => {
		expect(links('Write to kontakt@example.com.')).toEqual([
			{ type: 'link', text: 'kontakt@example.com', href: 'mailto:kontakt@example.com', external: false }
		]);
	});

	it('keeps sentence punctuation out of the link', () => {
		for (const trail of ['.', ',', ';', ':', '!', '?', '.)', '")']) {
			const [link] = links(`Visit https://example.com/x${trail}`);
			expect(link, trail).toMatchObject({ text: 'https://example.com/x' });
		}
	});

	it('keeps a closing bracket that belongs to the address and drops one that does not', () => {
		expect(links('https://en.wikipedia.org/wiki/Kern_(Typografie)')[0]).toMatchObject({
			text: 'https://en.wikipedia.org/wiki/Kern_(Typografie)'
		});
		expect(links('(see https://example.com/x)')[0]).toMatchObject({ text: 'https://example.com/x' });
	});

	it('finds several links per line and keeps the text between them', () => {
		const [line] = parseProse('a https://a.example b mail@b.example c')[0] ?? [];
		expect(line?.map((s) => (s.type === 'text' ? s.text : `<${s.href}>`))).toEqual([
			'a ',
			'<https://a.example>',
			' b ',
			'<mailto:mail@b.example>',
			' c'
		]);
	});

	it('never makes a link from other schemes, so no javascript: or data: URL can come out', () => {
		for (const text of [
			'javascript:alert(1)',
			'data:text/html,<script>alert(1)</script>',
			'vbscript:x',
			'ftp://example.com',
			'file:///etc/passwd'
		]) {
			expect(links(text), text).toEqual([]);
		}
		for (const all of parseProse('click javascript:alert(1) or https://ok.example')) {
			for (const line of all) for (const s of line) if (s.type === 'link') expect(s.href).toMatch(/^(https?:\/\/|mailto:)/);
		}
	});

	it('stops a web address at quotes and angle brackets, so it cannot break out of an attribute', () => {
		const [link] = links('https://example.com/"onmouseover="alert(1)');
		expect(link).toMatchObject({ text: 'https://example.com/' });
		expect(links('<a href=https://example.com/x>')[0]).toMatchObject({ text: 'https://example.com/x' });
	});

	it('leaves markup as text', () => {
		const paragraphs = parseProse('<b>bold</b> & <script>alert(1)</script>');
		expect(paragraphs).toEqual([[[{ type: 'text', text: '<b>bold</b> & <script>alert(1)</script>' }]]]);
	});
});
