# Contributing

This is primarily a personal/solo-maintained project. If you're proposing a
change:

## Workflow

1. Never commit directly to `main` — create a feature branch.
2. Branch names: English, kebab-case, prefixed by type — `feat/...`,
   `fix/...`, `chore/...`, `docs/...`, `refactor/...`, `test/...`.
3. Commits follow [Conventional Commits](https://www.conventionalcommits.org/):
   `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`.
4. Open a pull request against `main`. CI (and, where configured, Claude Code
   review) must pass before merge.
5. No `git push --force` on `main`.

## CI

Every PR runs the checks below (none has a `paths:` filter, so they run on
docs-only PRs too):

| Check | What it does |
|---|---|
| `build` | Stack lint/test from `.github/workflows/ci.yml` (plus the label-script tests while `scripts/ci/` exists) |
| `workflow-lint` | actionlint + zizmor over the workflows and `dependabot.yml` |
| `gitleaks` | Secret scan over the PR range, using `.gitleaks.toml` |
| `claude-review` | Optional Claude Code review; needs the `CLAUDE_CODE_OAUTH_TOKEN` secret and is **skipped (green)** without it |

Workflow rules: actions are pinned by full commit SHA with a `# vX.Y.Z` comment,
event data (`github.event.*`, branch names, titles) goes through `env:` and
never into `run:` via `${{ }}`, and `permissions:` stays minimal. Run
`actionlint` and `zizmor` locally before pushing a workflow change; the setup
steps, costs and the open runner/ruleset decisions are in
[`docs/TEMPLATE-SETUP.md`](docs/TEMPLATE-SETUP.md).

## Themes and components

- Components read only `--k-*` tokens (`src/lib/themes/base.css`).
- **Every theme must pass `npm test`.** The contrast test (`tests/tokens/contrast.test.ts`)
  reads the theme CSS and checks every `data-theme` variant: text pairs 4.5:1, borders, focus
  and accent marks 3:1. Fix a failing pair in the token value (keep the hue, change the
  lightness, note the deviation in the theme file) rather than in the test.
- `npm test` also builds each per-brand entry (`themes/<brand>.css`) and fails when another
  brand's selectors or colours end up in it.
- **Every component has tests.** A new export from `src/lib/index.ts` needs an entry in the `SMOKE` table of
  `tests/dom/smoke.test.ts` (renders, root element, accessible name, no console output) and, for anything
  interactive, a behaviour test in `tests/dom/` (props, bindable values, callbacks, keyboard, focus, ARIA,
  disabled/invalid/loading). How to write them, the jsdom stand-ins and the stuffcloud mapping:
  [`docs/testing.md`](docs/testing.md).
- `npm run test:coverage` prints the v8 coverage of `src/lib` and fails when it drops below the thresholds in
  `vitest.config.ts`. They are a ratchet (the current numbers rounded down); raise them when you add tests.
- Interactive parts are at least `--k-tap-target` (44px on touch): `npm run build` then
  `npm run test:targets` measures every control of the demo with Playwright.

## Reporting bugs / requesting features

Use the issue templates under `.github/ISSUE_TEMPLATE/`.

## Security issues

Do not open a public issue — see [`SECURITY.md`](SECURITY.md).
