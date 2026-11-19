// ESLint flat config. `npm run lint` runs this and `prettier --check`.
// Type-aware rules (strict-type-checked) cover every file a tsconfig includes: the components, the
// demo and the custom-element helpers. The element wrappers (src/elements/K*.svelte), tests, scripts
// and config files are outside the TypeScript project and get the syntax-only strict set.
import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import svelteConfig from './svelte.config.js';

const extraFileExtensions = ['.svelte'];
const typeChecked = ['src/lib/**/*.ts', 'src/lib/**/*.svelte', 'src/demo/**/*.ts', 'src/demo/**/*.svelte', 'src/elements/*.ts'];
/** The rules of strict-type-checked without its parser block, which would replace the Svelte parser. */
const typeCheckedRules = Object.assign(
	{},
	...tseslint.configs.strictTypeCheckedOnly.filter((c) => c.name === 'typescript-eslint/strict-type-checked-only').map((c) => c.rules ?? {})
);
/** typescript-eslint turns these core rules off for .ts files (TypeScript checks them); same for .svelte. */
const tsHandledRules = tseslint.configs.eslintRecommended.rules ?? {};

export default defineConfig(
	{
		ignores: [
			'dist/',
			'tests/fixtures/react-app/dist/',
			'dist-elements/',
			'demo-dist/',
			'coverage/',
			'test-results/',
			'playwright-report/',
			'tmp/',
			'.claude/',
			'**/.svelte-kit/'
		]
	},
	js.configs.recommended,
	tseslint.configs.strict,
	svelte.configs.recommended,
	{
		languageOptions: { globals: { ...globals.browser, ...globals.node } },
		rules: {
			// `let [a, b] = …` where only one is reassigned stays one statement.
			'prefer-const': ['error', { destructuring: 'all' }]
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts'],
		languageOptions: { parserOptions: { parser: tseslint.parser, extraFileExtensions, svelteConfig } },
		rules: {
			...tsHandledRules,
			// `let { … } = $props()` must stay `let`; the Svelte variant knows the runes.
			'prefer-const': 'off',
			'svelte/prefer-const': ['error', { destructuring: 'all', excludedRunes: ['$props', '$derived'] }]
		}
	},
	{
		files: typeChecked,
		ignores: ['src/elements/index.ts'],
		languageOptions: { parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname, extraFileExtensions } },
		rules: typeCheckedRules
	},
	{
		files: typeChecked,
		ignores: ['src/elements/index.ts'],
		rules: {
			'@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
			'@typescript-eslint/no-confusing-void-expression': ['error', { ignoreArrowShorthand: true }],
			// The components guard against values outside their declared types on purpose: custom
			// elements and plain-JS consumers hand them anything. Removing those guards changes behaviour.
			'@typescript-eslint/no-unnecessary-condition': 'off',
			// `void value;` registers a dependency inside `$effect`.
			'@typescript-eslint/no-meaningless-void-operator': 'off'
		}
	},
	{
		files: ['**/*.svelte'],
		rules: {
			// typescript-eslint cannot resolve types imported from other .svelte files (svelte-check can),
			// so these report every use of such a type as unsafe. `no-explicit-any` still applies.
			'@typescript-eslint/no-unsafe-argument': 'off',
			'@typescript-eslint/no-unsafe-assignment': 'off',
			'@typescript-eslint/no-unsafe-call': 'off',
			'@typescript-eslint/no-unsafe-member-access': 'off',
			'@typescript-eslint/no-unsafe-return': 'off',
			'@typescript-eslint/no-redundant-type-constituents': 'off'
		}
	},
	{
		rules: {
			'@typescript-eslint/no-explicit-any': 'error',
			'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
			// Narrow no-break and thin spaces are meant literally in number formats and patterns.
			'no-irregular-whitespace': ['error', { skipStrings: true, skipRegExps: true, skipTemplates: true }],
			// `code={'line 1\nline 2'}` needs the mustache for the escape.
			'svelte/no-useless-mustaches': ['error', { ignoreStringEscape: true }],
			// Writable `$derived` needs Svelte 5.25; the peer minimum is 5.20.
			'svelte/prefer-writable-derived': 'off',
			// Map/Set/Date here are scratch values inside `$derived` or non-reactive module state, never UI state.
			'svelte/prefer-svelte-reactivity': 'off'
		}
	}
);
