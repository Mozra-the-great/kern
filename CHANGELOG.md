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

### Added
- Per-brand theme entries `@mozra-the-great/kern/themes/stuffcloud.css`, `…/flower.css`,
  `…/pop.css`: base tokens plus one brand, so a consumer build ships only its brand
  (`themes.css` keeps all of them). Theme rules moved to `themes/brands/<brand>.css`; the old
  two-line import (`themes/base.css` + `themes/stuffcloud.css`) still works.
- `npm test` (Vitest): a contrast test that reads the theme CSS and checks text pairs (4.5:1)
  and borders, focus and accent marks (3:1) for every `data-theme` variant, and a test that
  builds each brand entry with Vite and fails when another brand's selectors or colours are in it.
- `npm run test:targets` (Playwright): measures every interactive element of the demo at 375px
  with a coarse pointer (and at 1280px for Stuffcloud and Pop) and fails below 44px.
- Tokens: `--k-accent-mark`, `--k-line-strong`, `--k-line-dashed`,
  `--k-surface-info|ok|warn|danger|selected`, `--k-bg-code`, `--k-fg-code`, `--k-fg-hint`,
  `--k-fg-soft`, `--k-fg-disabled`, `--k-shadow-sm`, `--k-space-2-5|3-5|6-5` (10/14/28px),
  `--k-tap-min` (44px), `--k-tap-icon`, `--k-tap-target` (0 for the mouse, 44px on touch).
  Mapping of every stuffcloud variable in `docs/themes.md`.

### Changed
- Every interactive part is at least `--k-tap-target`: on touch 44px (small buttons, icon
  buttons, pagination, breadcrumb, carousel dots, rating, menu items and options, tabs, field
  buttons, table sort headers through an invisible hit area, dismiss/remove buttons of Alert,
  Toast and Tag through an invisible hit area). Checkbox, Radio and Switch rows are padded to
  the target and the whole row toggles the control. Several components replace their own
  `pointer: coarse` rules with the token.
- Button, IconButton, Input, Select, DropdownMenu/Popover triggers, Pagination and the Marquee
  pause button use `box-sizing: border-box`: their height is now exactly `--k-control-h`
  (before, the border added 2–3px).
- IconButton and CopyButton are `--k-tap-icon` square (base 44px, unchanged for Flower).
  Dialog and Drawer close buttons are `--k-tap-icon` (were 36px).
- Progress, Slider, Tabs marker, Navbar/TreeView/DataTable markers, Stepper, Breadcrumb current,
  selected Tag and Card hover border, and the focused border of fields use `--k-accent-mark`.
- Card, Modal, Drawer, Toast, Popover and menus draw their edge with `--k-line-strong`; Alert
  backgrounds use `--k-surface-*`; warning and danger Toasts get their surface tint; Toast uses
  `--k-shadow-sm`; FileDrop uses `--k-line-dashed`, `--k-surface-selected` and `--k-fg-hint`;
  Field hints use `--k-fg-hint`; Code blocks use `--k-bg-code`/`--k-fg-code`; disabled menu items
  and options use `--k-fg-disabled` instead of opacity.
- Theme values that change a theme's look:
  - Stuffcloud (all variants): `--k-control-h` 44 → 52px (56px below 760px),
    `--k-control-h-sm` 34 → 44px, `--k-control-h-lg` 52 → 56px, `--k-tap-icon` 48px,
    44px targets for the mouse as well, `--k-shadow-sm` `4px 4px 0 rgba(0,0,0,.4)`.
  - Stuffcloud dark: `--k-line-strong` `#3a3a42` (cards were `#26262b`), `--k-surface-danger`
    `#2a0f1a`, `--k-surface-warn` `#2a200a`, `--k-surface-selected` `#1a1220` (were `#17171a`),
    `--k-fg-hint` `#c7c7cf` (was `#a2a2ab`), `--k-fg-code` `#e8e8ee`, `--k-fg-soft` `#d8d8de`,
    `--k-fg-disabled` `#6a6a74`, `--k-line-dashed` `#6b5a8f` (was `#6e6e78`); code blocks on
    surface-code `#0c0c0e` (were `#17171a`). Light/paper: `--k-line-strong` `#bdbbc3` / `#b5b5b5`,
    code blocks on `#f1f0ee` / `#f4f3f1`.
  - Pop: `--k-tap-icon` 48px (icon buttons were 56px), 44px targets for the mouse as well.
  - Pop light: `--k-accent-mark` `#0e9413` (marks were `#10a916`, 2.8:1 → 3.6:1 on bg, 2.5 → 3.1:1
    on the track); `--k-danger-soft` `#ffe3ee` → `#ffe5ef` (danger text on it 4.46 → 4.52:1).
  - Flower creme: `--k-accent-mark` `#d06557` (marks were `#d77b6f`, 2.66 → 3.25:1 on bg, 2.49 →
    3.05:1 on the track). Flower wald: `--k-accent-mark` `#dd887a` (2.82 → 3.19:1 on raised),
    `--k-warn` `#e1ad57` → `#e4b76a` (4.18 → 4.57:1 on raised).

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
