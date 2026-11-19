// Minimal static server for the element tests: serves the built dist-elements/ and
// dist/themes/ plus the test pages. Started and stopped by Playwright (webServer).
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';

const root = resolve(import.meta.dirname, '../..');
const allowed = ['dist-elements', join('dist', 'themes'), join('tests', 'elements', 'pages')].map((p) => join(root, p) + sep);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2' };
const port = Number(process.env.PORT ?? 4791);

createServer(async (req, res) => {
	const path = normalize(join(root, decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname)));
	if (!allowed.some((dir) => path.startsWith(dir))) {
		res.writeHead(404).end();
		return;
	}
	try {
		const body = await readFile(path);
		res.writeHead(200, { 'content-type': types[extname(path)] ?? 'application/octet-stream', 'cache-control': 'no-store' }).end(body);
	} catch {
		res.writeHead(404).end();
	}
}).listen(port, '127.0.0.1', () => console.log(`element test server on http://127.0.0.1:${port}`));
