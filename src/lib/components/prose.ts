/*
 * Plain text to nodes, without HTML (#59): paragraphs (blank lines), lines (line breaks) and links.
 * The text is never interpreted as markup: the components render the segments as text nodes and
 * as <a> elements whose `href` comes from the two patterns below, so only `http:`, `https:` and
 * `mailto:` can come out. Written for legal pages (Impressum, Datenschutz) that a backend maintains
 * as plain text.
 */

export type ProseSegment =
	| { type: 'text'; text: string }
	/** `external` links leave the site: `target="_blank"` and `rel="noopener noreferrer"` belong on them. */
	| { type: 'link'; text: string; href: string; external: boolean };

/** One paragraph: its lines, each a list of segments. */
export type ProseParagraph = ProseSegment[][];

// A web address runs to the next whitespace; sentence punctuation after it is not part of it.
const TOKEN = /(https?:\/\/[^\s<>"]+)|([A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+)/g;

/** Removes the sentence punctuation at the end of a link; a closing bracket stays when its opening one is part of the link. */
function trimTrail(raw: string): string {
	let out = raw;
	for (;;) {
		const last = out.at(-1);
		if (last === undefined) return out;
		if (/[.,;:!?'"]/.test(last)) out = out.slice(0, -1);
		else if (last === ')' || last === ']') {
			const open = last === ')' ? '(' : '[';
			const opened = out.split(open).length - 1;
			const closed = out.split(last).length - 1;
			if (closed > opened) out = out.slice(0, -1);
			else return out;
		} else return out;
	}
}

function segmentLine(line: string): ProseSegment[] {
	const out: ProseSegment[] = [];
	let last = 0;
	for (const m of line.matchAll(TOKEN)) {
		const start = m.index;
		const raw = trimTrail(m[0]);
		if (raw === '') continue;
		if (start > last) out.push({ type: 'text', text: line.slice(last, start) });
		out.push(
			m[1] ? { type: 'link', text: raw, href: raw, external: true } : { type: 'link', text: raw, href: `mailto:${raw}`, external: false }
		);
		last = start + raw.length;
	}
	if (last < line.length) out.push({ type: 'text', text: line.slice(last) });
	return out;
}

/**
 * Splits plain text into paragraphs (separated by blank lines) of lines of segments. Web addresses
 * (`http://`, `https://`) and e-mail addresses become link segments; everything else stays text.
 */
export function parseProse(text: string | null | undefined): ProseParagraph[] {
	if (typeof text !== 'string') return [];
	return text
		.replace(/\r\n?/g, '\n')
		.split(/\n[^\S\n]*\n/)
		.map((p) => p.trim())
		.filter((p) => p !== '')
		.map((p) => p.split('\n').map((line) => segmentLine(line.trim())));
}
