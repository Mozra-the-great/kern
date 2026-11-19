// Fails when a component exported from the package is not used in this fixture, so a new component
// cannot skip the strict type check. Part of `npm run test:consumer`.
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const here = import.meta.dirname;
const index = readFileSync(resolve(here, '../../../src/lib/index.ts'), 'utf8');
const components = [...index.matchAll(/export \{ default as (\w+) \} from '\.\/components\/[\w-]+\.svelte'/g)].map((m) => m[1]);
const markup = readdirSync(here)
	.filter((f) => f.endsWith('.svelte'))
	.map((f) => readFileSync(join(here, f), 'utf8'))
	.join('\n');
const missing = components.filter((name) => !new RegExp(`<${name}[\\s/>]`).test(markup));

if (components.length === 0) {
	console.error('No component exports found in src/lib/index.ts.');
	process.exit(1);
}
if (missing.length) {
	console.error(`Not used in tests/fixtures/strict-consumer: ${missing.join(', ')}`);
	process.exit(1);
}
console.log(`All ${components.length} exported components are type-checked in the strict consumer fixture.`);
