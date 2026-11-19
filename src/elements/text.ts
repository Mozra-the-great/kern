/**
 * Text of a code element written inside HTML: blank lines at both ends removed and the common
 * indentation cut, so markup indentation does not end up in the code (<k-code>, <k-code-block>).
 */
export function dedent(raw: string): string {
	const lines = raw.replace(/\r\n?/g, '\n').split('\n');
	while (lines.length > 0 && lines[0].trim() === '') lines.shift();
	while (lines.length > 0 && lines[lines.length - 1].trim() === '') lines.pop();
	const indents = lines.filter((l) => l.trim() !== '').map((l) => (/^[ \t]*/.exec(l) ?? [''])[0].length);
	const cut = indents.length > 0 ? Math.min(...indents) : 0;
	return lines.map((l) => l.slice(cut)).join('\n');
}

/** Keeps `read(dedented text)` in step with the light DOM of `host`; returns the cleanup. */
export function watchText(host: HTMLElement, read: (text: string) => void): () => void {
	const update = () => read(dedent(host.textContent ?? ''));
	update();
	const observer = new MutationObserver(update);
	observer.observe(host, { childList: true, characterData: true, subtree: true });
	return () => observer.disconnect();
}
