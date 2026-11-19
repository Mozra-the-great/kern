# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## Versioning and release rules

- Below 1.0 the minor number carries breaking changes: `0.2.x` to `0.3.0` may break,
  `0.2.0` to `0.2.1` never does. Patch releases contain fixes and backwards-compatible
  additions.
- Breaking means: removed or renamed component, prop, event, slot, export or CSS
  variable (`--k-*`), a changed default that alters behaviour, a raised minimum of
  Svelte or Node, a changed package name or entry point. Each breaking change gets a
  `### Changed` or `### Removed` entry that starts with **BREAKING:** and says how to migrate.
- Every change that is visible to consumers goes into `[Unreleased]` in the PR that
  makes it. A release moves `[Unreleased]` into a dated `[X.Y.Z] - YYYY-MM-DD` section,
  leaves an empty `[Unreleased]`, and bumps `version` in `package.json`.
- A release is the tag `vX.Y.Z` on `main`. The `release` workflow then builds the
  tarball and attaches it, with its checksums, to the GitHub release. The release
  notes are this file's section for that version.

## [Unreleased]

## [0.2.0] - 2026-11-19

### Added
- Core set of 27 Svelte 5 components (actions, status, forms, content, overlays,
  navigation), Stuffcloud and Flower themes, custom-elements build.
- 14 more components: Skeleton, EmptyState, Breadcrumb, Pagination, Navbar,
  Slider, FileDrop, Carousel, Popover, Combobox, ContextMenu, CommandPalette,
  TreeView, DatePicker, each with a custom-element wrapper. Overlays share
  `anchor.ts` for viewport-aware placement and shadow-DOM-safe focus handling.
- Repository scaffold from `repo-template-public`: CI (`build`, `workflow-lint`,
  `gitleaks`), Dependabot for GitHub Actions and npm, issue/PR templates.

- 10 primitives and layout helpers: Code, CopyButton, Kbd, RelativeTime, StatusDot,
  ThemeToggle (+ `createThemeScript` against a theme flash), ProgressRing, Collapsible,
  Resizable (APG window splitter), ScrollArea. kern now covers the cock feature set (75 components).
- Brand assets: 77 stuffcloud pixel-art SVGs from the moodboards (logo, mascots,
  tool stickers, marks, seasonal decoration) under `@mozra-the-great/kern/assets/stuffcloud/`,
  shown in a demo gallery.
- 6 data components: DataTable (filter, sort, pages, row selection), Stat,
  Sparkline, Heatmap, HistoryBar, Timeline.
- 10 effects (Typewriter, Caret, Scramble, CountUp, Odometer, Marquee, Reveal,
  Highlight, GridBackground, Terminal), reduced motion shows the final state.
- 8 form controls: Label, NumberInput, PinInput, Rating, SegmentedControl,
  Stepper, TagInput, ColorPicker.
- Pop theme (`pop` / `pop-light`, `pop-dark`) from the Pop design system:
  pill controls, 32px cards, one soft shadow, Figtree 900 display, green accent.
- Release channel: tag `vX.Y.Z` runs the `release` workflow, which checks, builds,
  runs `npm pack` and attaches the tarball plus `.sha256`/`.sha512` to a GitHub
  release. Consumers pin it by URL; npm and pnpm (10+) store its integrity hash in the lock
  file. The `prepare` script builds `dist/` and `dist-elements/` so a git dependency
  works too.
- Package metadata: `repository`, `homepage`, `bugs`, `engines` (`node >=22`),
  `./package.json` export; `NOTICE` and `CHANGELOG.md` are part of the tarball.
- CI builds on Node 22 and 24 and against the lowest and newest supported Svelte
  (`scripts/ci/compile-dist.mjs` compiles every published component for browser and SSR).

### Changed
- **BREAKING:** the package is now `@mozra-the-great/kern` (was `kern-ui`, which on
  npmjs.com belongs to an unrelated library). Replace every `kern-ui` import and
  asset path: `kern-ui/themes.css` becomes `@mozra-the-great/kern/themes.css`,
  `kern-ui/assets/...` becomes `@mozra-the-great/kern/assets/...`. `kern-ui` was
  never published from this repository, so there is nothing to uninstall.
- `peerDependencies.svelte` is `^5.20.0` (was `^5.0.0`): the components call
  `$props.id()`, which Svelte added in 5.20.0 and which fails to compile before.
  CI builds against 5.20.0 and the newest 5.x.
- **Breaking (0.x):** `toasts` is now a read-only live mirror (`readonly ToastItem[]`)
  of one toast store shared on `globalThis[Symbol.for('kern.toasts')]`; mutating it
  directly no longer shows or removes toasts, use `toast()` and `dismissToast()`.
  `toast()`, `toast.ok/warn/danger`, `dismissToast` and `window.kern.toast` are unchanged.
- Custom elements fire `change`/`select`/`toggle`/`files` for user input only, never
  when a property is set from code (`<k-tabs>` no longer fires `change` when `tabs` or
  `value` are set, `<k-radio-group>` no longer when `value` is set).
- `Popover`'s `ontoggle` (and `<k-popover>`'s `toggle`) fire only when the user opens or
  closes it, not when `open` is set from outside.
- `Tabs` and `RadioGroup` take an optional `onchange` for user changes.
- Toolchain: vite 8, @sveltejs/vite-plugin-svelte 7, @sveltejs/package 3,
  TypeScript 6 (`vite/client` types for CSS side-effect imports). Dependabot
  groups vite with the Svelte plugin and skips TypeScript majors for now.
- License is GPL-3.0-or-later (was MIT in the first local import).

### Fixed
- Reduced motion: themes set `--k-dur` on `[data-theme^=…]`, which overrode the
  `prefers-reduced-motion` rule in base.css; the rule now wins for every theme.
- `<k-tabs>` no longer dispatches `change` or hides panels during Svelte's render, which
  threw `state_unsafe_mutation` and unmounted a React 19 tree whose `onchange` handler
  updated another kern element (#29). Panel hiding is an effect now.
- Svelte build and custom-elements bundle share one toast store, so a toast from either
  shows in both `<Toaster />` and `<k-toaster>` (#34).
- Carousel: the scrolling track is keyboard-operable (focusable when there is more than
  one slide; arrow keys, Home, End) and has a focus ring (axe `scrollable-region-focusable`);
  a separate live region announces the settled slide ("2 of 5") instead of an `aria-live`
  track that spoke on every scroll step (#28). A negative or fractional `index` is clamped.
- `Field` no longer stretches inside grid rows (`align-content: start`).
- `package-lock.json` matches `package.json` again, so `npm ci` works.
