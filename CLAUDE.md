# kern

> Svelte 5 component kit (npm name `@mozra-the-great/kern`): one set of accessible components,
> many brands. Themes set colour, shape, depth, type and motion via `--k-*` CSS
> variables. Also shipped as framework-free custom elements (`<k-button>` …).

## Type
Library (UI component kit) with a demo site.

## Stack
Svelte 5 (runes, snippets), TypeScript 6, Vite 8, `@sveltejs/package` 3, svelte-check 4.
TypeScript 7 waits for svelte-check support (Dependabot ignores its major).
No runtime dependencies besides Svelte, no Tailwind.

## Structure
```
src/lib/components/   Svelte components (one file each) + anchor.ts, toast.svelte.ts
src/lib/themes/       base.css (all --k-* tokens), brands/<brand>.css (theme rules),
                      <brand>.css (self-contained entry: base + one brand), index.css (all)
tests/tokens/         Vitest: theme contrast, per-brand entry isolation (npm test)
tests/targets/        Playwright: touch targets in the built demo (npm run test:targets)
src/lib/index.ts      public exports (components + types)
src/elements/         custom-element wrappers K<Name>.svelte, form.ts helpers, index.ts
src/demo/             demo app (App.svelte + sections/), themes.ts
assets/<brand>/       optional brand artwork (stuffcloud pixel art), exported as @mozra-the-great/kern/assets/*
index.html            Svelte demo · elements.html: custom-elements demo
```

## Commands
```sh
npm install
npm run dev     # demo: /index.html and /elements.html
npm run check   # svelte-check, must end with 0 errors / 0 warnings
npm run build   # dist/ (package), dist-elements/kern-elements.js, demo-dist/
npm test        # Vitest: theme contrast + brand isolation
npm run test:targets  # Playwright touch targets (after build; npx playwright install chromium)
```

Release: bump `version`, move `[Unreleased]` in CHANGELOG.md to a dated section, merge, then
push tag `vX.Y.Z` on `main`; `.github/workflows/release.yml` attaches the `npm pack` tarball
and checksums to the GitHub release. Consumers pin that tarball URL (README, "Installation
und Pinning"). 0.x: minor = may break, patch = no break. Svelte minimum is `^5.20.0`;
CI builds on Node 22 + 24 and on the lowest/newest Svelte inside the `build` job
(keep the job id `build`, it is the required check).

## Notes
- Components read only `--k-*` tokens. Every component must look right in
  Stuffcloud (square, hard offset shadows, mono uppercase labels, `steps()` easing)
  and Flower (soft, pills); check both themes, light and dark, desktop and 320 px.
- A new theme = `themes/brands/<name>.css` overriding the tokens of `base.css` for
  `[data-theme^='name']`, an entry `themes/<name>.css`, an `@import` in `themes/index.css`
  and an `exports` entry; it must pass `npm test` (contrast). Interactive parts use
  `--k-tap-target` (min size or invisible `::after` hit area). Themes: stuffcloud,
  flower, pop (each from its design-system artifact); planned: a Kagi-based theme.
- `src/elements/` is not in `tsconfig.include`, so `npm run check` does not see
  the wrappers; `npm run build` compiles them. In a wrapper, a `<slot>` inside a
  `{#snippet}` needs the snippet to read a variable (`{#if footer}`), otherwise
  Svelte hoists it and it throws `$$props is not defined`.
- Overlays use `position: fixed` without a portal; inside shadow DOM, compare
  focus via `getRootNode().activeElement` and outside clicks via `composedPath()`
  (helpers in `anchor.ts`).
- Default UI strings are English and overridable via props; the demo and README
  are German.

---

## Working rules

These rules apply regardless of what's above. They mirror the operator's global
Claude Code configuration so this repo behaves consistently even if opened on a
different machine or by a collaborator.

### Language
- Chat responses: German
- Everything that goes into the repo — code, comments, commit messages, branch
  names, PR descriptions, CHANGELOG: English (default, more compact)
- Respect a project's already-established language convention if one exists

### Approach — get it right once instead of fixing it ten times
1. Fully understand the task before starting
2. Think through the solution: edge cases, error handling, dependencies, blast radius
3. Only then implement it completely and correctly

No placeholders. No `// TODO` without a resolution attached. No half-finished
implementations.

For larger tasks: use Plan Mode before writing code. If something is fundamentally
unclear and would change the direction of the solution, ask once rather than
building in the wrong direction.

### Coding rules
- TypeScript: no `any`, explicit types
- Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`
- Follow the project's existing conventions over these defaults when they conflict

### Git workflow
- Never commit directly to `main`/`master` — always a feature branch
- Branch names in English, kebab-case (`feat/...`, `fix/...`)
- Before every push: check `git status` and `git diff --staged`
- No `git push --force` on main/master

### Security
- `.env`, `.env.*`, `*.pem`, `*.key`, `*.secret` — never read, log, or commit
- No credentials/tokens/passwords in code
- Secrets via environment variables or a secrets manager, never in plaintext

### Subagents — delegate proactively
Use these specialists without being asked each time, as soon as the situation fits:

- **test-runner** → right after writing or changing application code
- **security-reviewer** → after auth/input/dependency changes, and before any release
- **code-reviewer** → before a merge / after finishing a feature
- **debugger** → as soon as a test fails, a stack trace shows up, or behavior is unexpected

Run independent analyses (e.g. security + tests) in parallel. Skip subagents for
trivial changes — the overhead isn't worth it.
