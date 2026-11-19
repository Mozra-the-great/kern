// Static server for the mascot runtime tests: serves the built dist-elements/ and dist/themes/,
// the shipped art under assets/ and the test pages, every page under a strict CSP (images from
// the own origin only, no data: URIs). Started and stopped by Playwright (webServer).
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';

const root = resolve(import.meta.dirname, '../..');
const allowed = ['dist-elements', join('dist', 'themes'), 'assets', join('tests', 'mascot', 'pages')].map((p) => join(root, p) + sep);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
const port = Number(process.env.PORT ?? 4792);
// Svelte injects each element's CSS as a <style> in its shadow root, hence 'unsafe-inline' for styles.
const csp = "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self'; connect-src 'self'";

createServer(async (req, res) => {
	const path = normalize(join(root, decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname)));
	if (!allowed.some((dir) => path.startsWith(dir))) {
		res.writeHead(404).end();
		return;
	}
	try {
		const body = await readFile(path);
		const headers = { 'content-type': types[extname(path)] ?? 'application/octet-stream', 'cache-control': 'no-store' };
		if (extname(path) === '.html') headers['content-security-policy'] = csp;
		res.writeHead(200, headers).end(body);
	} catch {
		res.writeHead(404).end();
	}
}).listen(port, '127.0.0.1', () => console.log(`mascot test server on http://127.0.0.1:${port}`));
