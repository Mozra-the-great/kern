import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

// Builds the React 19 test app (#35) into dist/ next to it. The kern imports resolve through the package's
// own "exports" (self-reference), so run `npm run build:elements` first. No React plugin: Vite's own JSX
// transform covers it (jsx: react-jsx in the tsconfig). React runs in development mode on purpose:
// StrictMode's double effects, the double render and React's console warnings only exist there.
const root = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
	root,
	base: './',
	define: { 'process.env.NODE_ENV': JSON.stringify('development') },
	build: { outDir: 'dist', emptyOutDir: true, minify: false, sourcemap: false, target: 'es2022' }
});
