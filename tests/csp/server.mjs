// Static server of the strict-CSP test (#125). Serves the production build of the fixture app
// (tests/fixtures/csp-app/dist/) at / and the negative fixture (dist-canary/) at /canary/, every response under the
// strict policy of policy.mjs. The theme-script hash comes from the BUILT package (dist/), the way a consumer
// server gets it. Started and stopped by Playwright (webServer).
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { themeScriptHash } from '../../dist/components/theme.js';
import { THEME_KEY, THEME_OPTIONS, strictPolicy } from './policy.mjs';

const fixture = resolve(import.meta.dirname, '../fixtures/csp-app');
const roots = [
	['/canary/', join(fixture, 'dist-canary')],
	['/', join(fixture, 'dist')]
];
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
const port = Number(process.env.PORT ?? 4793);
const csp = strictPolicy(await themeScriptHash(THEME_KEY, THEME_OPTIONS));

createServer(async (req, res) => {
	const headers = { 'content-security-policy': csp, 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' };
	let pathname;
	try {
		pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname);
	} catch {
		res.writeHead(400, headers).end();
		return;
	}
	const [prefix, dir] = roots.find(([p]) => pathname.startsWith(p)) ?? roots[1];
	const rest = pathname.slice(prefix.length);
	const path = normalize(join(dir, rest === '' || rest.endsWith('/') ? `${rest}index.html` : rest));
	if (!path.startsWith(dir + sep)) {
		res.writeHead(404, headers).end();
		return;
	}
	try {
		const body = await readFile(path);
		res.writeHead(200, { ...headers, 'content-type': types[extname(path)] ?? 'application/octet-stream' }).end(body);
	} catch {
		res.writeHead(404, headers).end();
	}
}).listen(port, '127.0.0.1', () => console.log(`strict CSP test server on http://127.0.0.1:${port}`));
