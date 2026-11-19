/**
 * Tiny helpers to inspect the markup that `svelte/server` renders (no DOM in Node). Good enough for
 * kern's own output: attribute values are always double-quoted and escaped.
 */
import { render } from 'svelte/server';
import { createRawSnippet, type Component, type Snippet } from 'svelte';

export interface Tag {
	name: string;
	attrs: Record<string, string>;
	/** Index of the tag in the markup, for order checks. */
	at: number;
}

/**
 * Applies `pattern` until the string stops changing, so a removal cannot leave behind a new match
 * built from the surrounding characters (CodeQL js/incomplete-multi-character-sanitization).
 */
function removeAll(input: string, pattern: RegExp, replacement = ''): string {
	let previous: string;
	let current = input;
	do {
		previous = current;
		current = current.replace(pattern, replacement);
	} while (current !== previous);
	return current;
}

/** Server-renders `component` with `props` and returns its body markup without hydration comments. */
export function html<P extends object>(component: Component<P>, props: P): string {
	const generic = component as unknown as Component<Record<string, unknown>>;
	return removeAll(render(generic, { props: props as Record<string, unknown> }).body, /<!--[^>]*-->/g);
}

/** All opening tags named `name` (or every tag with `*`), in document order. */
export function tags(markup: string, name = '*'): Tag[] {
	const out: Tag[] = [];
	for (const m of markup.matchAll(/<([a-z][\w-]*)\b([^>]*)>/g)) {
		const tagName = m[1] ?? '';
		if (name !== '*' && tagName !== name) continue;
		const attrs: Record<string, string> = {};
		for (const a of (m[2] ?? '').matchAll(/([^\s=/]+)(?:="([^"]*)")?/g)) attrs[a[1] ?? ''] = a[2] ?? '';
		out.push({ name: tagName, attrs, at: m.index });
	}
	return out;
}

/** The single tag named `name` whose attributes include `match`; throws when there is not exactly one. */
export function one(markup: string, name: string, match: Record<string, string> = {}): Tag {
	const found = tags(markup, name).filter((t) => Object.entries(match).every(([k, v]) => t.attrs[k] === v));
	if (found.length !== 1) throw new Error(`Expected one <${name}> with ${JSON.stringify(match)}, found ${found.length} in:\n${markup}`);
	return found[0] as Tag;
}

/** Text content of the markup (tags removed, whitespace collapsed). */
export function text(markup: string): string {
	return removeAll(removeAll(markup, /<style[\s\S]*?<\/style>/g), /<[^>]+>/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

/** A snippet that renders fixed markup (children of a component under test). */
export function snippet(markup: string): Snippet {
	return createRawSnippet(() => ({ render: () => markup }));
}
