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
- Brand artwork for Pop, Line and Flower (#84), shipped like the Code pixel art under
  `@mozra-the-great/kern/assets/<brand>/…` (covered by the existing `./assets/*` export): `assets/pop/`
  (88 SVGs: logo, 11 mascots with dark twins of the floaters, 18 Stuffy outfits, 5 accessories,
  31 tool icons, 22 seasonal badges, Advent wreaths and a tree), `assets/line/` (48: logo in ink and
  white, 9 mascots, 17 outfits, 8 tool-category tiles, 6 seasonal pieces, 6 illustrations) and
  `assets/flower/` (46: 16 blossoms, 20 leaves and branches, 10 trees). Vector art from the
  design-system artifacts plus the moodboard art they lack; fixed colours, each file with `xmlns` and
  `viewBox`. Use them with `<img alt="">`; `Mascot` stays the pixel-art runtime (README, "Mascot").
  The demo's "Marken-Assets" section shows every brand on its own ground.

### Changed
- `npm run assets:check` guards every brand: each folder has a `manifest.json` (size, sha256, plus
  the pixel grid or the `viewBox`), and the check also fails on unsafe SVG constructs (scripts,
  handlers, `<foreignObject>`, `<image>`, external references, `data:` URIs, `<style>`) and on an
  unknown brand folder. `npm run assets:manifest` rewrites all manifests.
- The **stuffcloud** design is now called **Code** (#85): kern's themes are general standard designs, and
  the stuffcloud app keeps using this one under the new name. The theme (`data-theme="code"`,
  `code-dark`, `code-light`, `code-paper`, `code-contrast`; `themes/brands/code.css`; entry
  `@mozra-the-great/kern/themes/code.css`), the pixel art (`assets/code/`, with its manifest and
  `@mozra-the-great/kern/assets/code/*`) and the art catalogue (`CODE_ART`, `CodeArt`, `isCodeArt`;
  file `code-art.ts`) carry the new name. The demo, `ThemeToggle` and `createThemeScript` fall back
  to `code` (a stored `stuffcloud` theme still works and toggles within the old spelling). Nothing
  looks different. The old names keep working until 1.0, see Deprecated. `Mascot` and `<k-mascot>`
  behave as before (`base` is your own URL); `artUrl` now reports `unknown Code art "…"`.

### Deprecated
- Every old **stuffcloud** name of the rename above (#85) is a deprecated alias, removed in 1.0.
  Nothing has to change to keep working; migrate when convenient:

  | Old (deprecated) | New |
  | --- | --- |
  | `data-theme="stuffcloud"` (= `stuffcloud-dark`) | `data-theme="code"` (= `code-dark`) |
  | `data-theme="stuffcloud-light"` | `data-theme="code-light"` |
  | `data-theme="stuffcloud-paper"` | `data-theme="code-paper"` |
  | `data-theme="stuffcloud-contrast"` | `data-theme="code-contrast"` |
  | `[data-theme^='stuffcloud']` in your own CSS | `[data-theme^='code']` (both are matched by kern's rules) |
  | `import '@mozra-the-great/kern/themes/stuffcloud.css'` | `import '@mozra-the-great/kern/themes/code.css'` |
  | `<link href="…/dist/themes/stuffcloud.css">` | `<link href="…/dist/themes/code.css">` (`dist/themes/stuffcloud.css` stays as a one-line `@import` of `code.css`) |
  | `@mozra-the-great/kern/assets/stuffcloud/*` | `@mozra-the-great/kern/assets/code/*` |
  | `node_modules/@mozra-the-great/kern/assets/stuffcloud/` (a build step that copies the folder) | `node_modules/@mozra-the-great/kern/assets/code/`. This one is **not** aliased: the `exports` alias covers imports only, the folder on disk is gone, so change the path now |
  | `STUFFCLOUD_ART` | `CODE_ART` |
  | `StuffcloudArt` (type) | `CodeArt` |
  | `isStuffcloudArt()` | `isCodeArt()` |
  | `themePair()` / `THEME_FAMILIES.stuffcloud` | `THEME_FAMILIES.code` (both families exist) |

  How the aliases work: every rule of `brands/code.css` names both spellings (`[data-theme^='code'],
  [data-theme^='stuffcloud']`, likewise each variant), so the old values resolve to exactly the same
  tokens, `@media` rules included; `exports` maps `./themes/stuffcloud.css` to `dist/themes/code.css`
  and `./assets/stuffcloud/*` to `assets/code/*` (one copy of the files in the package; the plain file
  `dist/themes/stuffcloud.css` is a one-line `@import` of `code.css`); the old
  TypeScript names are `@deprecated` re-exports of the new ones. A test proves that both
  spellings compute identical tokens in a browser. Not renamed: the stuffcloud app itself (the
  `consumer/stuffcloud` label, "stuffcloud's TS flags" in the strict-consumer fixture, links to its
  repository and the parity notes).

## [0.6.0] - 2026-11-19

### Added
- `CodeBlock` and `<k-code-block>` (#46): stuffcloud's code block on top of `Code` (block mode): text
  copy button when `copyLabel` is set (or `copy`; `showCopyLabel={false}` / `copy-icon` for an
  icon-only one), polite announcement of `copiedLabel` / `copyErrorLabel`, `oncopy(copied, text)` for
  every attempt (element: `copy` with the text, `copy-error`), no visible scrollbar (`hideScrollbar`,
  element `show-scrollbar`), focusable named region while it scrolls. `Code` gains `copyShowLabel`,
  `hideScrollbar`, `oncopyerror` and a forced-colors rule.
- `TabLinks` and `<k-tab-links>` (#47): navigation tabs as links in a named `<nav>`, `aria-current="page"`
  on the current one, same look as `Tabs` (`look`), sideways scroll with a fade on the hidden side and
  the focus ring inside. `onnavigate(link, event)` / cancelable `navigate` for client-side routers.
  Type `TabLinkItem`.
- `Tabs` as an app tab bar (#48): `panel` is optional; without it (element: without children) there is
  no tabpanel and no `aria-controls` unless an item names one with `controls`. `TabItem` gains `badge`,
  `dot`, `badgeLabel`, `badgeTone` (`accent` | `danger`) and `hidden`; the badge is decorative and its
  meaning is part of the tab's name ("More Sync error"). Arrow keys skip hidden and disabled tabs; a
  hidden, disabled or unknown `value` leaves Tab focus on the first usable tab. The strip fades its
  edge while tabs are hidden, and the selected pill draws its focus ring in `--k-on-primary`.
- `Tile` and `TileGrid`, `<k-tile>` and `<k-tile-grid>` (#49): ruled grid of cells (grid draws the top
  line, each tile its right and bottom one), `min` column width (default 280px), whole-cell links with
  `href` (`target`, `rel`), `as` element choice (`ul`/`li`; the elements set `role="list"` /
  `role="listitem"` on themselves), row layout when the grid is narrower than 760px (container query).
- `Drawer` parity with `Modal` (#74): `dismissible`, `initialFocus`, `closeOnBackdrop` and a cancelable
  `oncancel`; the page scroll lock is shared with Modal (one count, nested overlays keep the page
  locked). `<k-drawer>` gets `dismissible`, `initial-focus`, `close-on-backdrop` and the `cancel` event.

### Changed
- **BREAKING:** `<k-modal>` and `<k-drawer>` fire `close`, and `Modal`/`Drawer` call `onclose`, only when
  the user closes them (Escape, close button, backdrop, a `<form method="dialog">` button in Svelte);
  setting `open` to false from code closes silently (#75). Migration: code that relied on `close` after
  `open = false` runs its follow-up where it sets `open` instead. A controlled React wrapper
  (`open={x}` with `onclose={() => setX(false)}`) needs no change and no longer gets a redundant event.
- `Drawer` locks the page scroll while it is open and sends Escape, the close button and the backdrop
  through `oncancel` / `cancel` first, like Modal. Without the new props it still closes the same way.

- Default texts as a catalogue (#58): every label, accessible name and announcement a component shows
  when no prop is given is an entry of `KernStrings` (by component and name), English built in. New
  exports `setStrings(...bundles)`, `resetStrings()`, `getStrings()`, `getLang()`,
  `registerStrings(lang, bundle)`, `setLocale(lang)`, `followLang(root?)`, `en`, `de` (complete German
  bundle, its own module so it tree-shakes away), `createStringsStore`/`sharedStringsStore` and the types
  `KernStrings`, `KernBundle`, `KernStringsInput`, `StringsStore`. A prop or attribute still wins. The choice is
  reactive (components already on the page switch language) and lives on
  `globalThis[Symbol.for('kern.strings')]`, so the Svelte package and the custom-elements bundle share it;
  `lang` of the chosen bundle is also the default `locale` of CountUp, Odometer, NumberInput, DatePicker,
  RelativeTime, Stat, Sparkline, Heatmap, HistoryBar and Timeline (without a choice they keep using the
  browser's). Elements: `window.kern.strings` (`set`, `reset`, `get`, `register`, `setLocale`, `followLang`,
  `en`, `de`) and the entry `@mozra-the-great/kern/elements/strings`; `kern-elements.js` registers `en` and `de`.
  Texts that were hard-coded and are now overridable: the Card fallback name "Open", the Code region name,
  the Terminal name, the ThemeToggle names, the FileDrop drop prompts, the DatePicker placeholder pattern,
  the spoken key names of Kbd, the status names of StatusDot, HistoryBar and Timeline, and the
  `aria-roledescription` of Carousel (new props `roleDescription` / `slideRoleDescription`,
  `<k-carousel>`: `role-description`, `slide-role-description`). `Link` gets `externalLabel`
  (`<k-link external-label>`) for the hidden "(opens in a new tab)". The generated typings carry
  `KernStrings` (written from the catalogue, so they cannot drift).
- `Prose` / `<k-prose>` (#59): typography for long plain text with a line length of `--k-prose-measure`
  (68ch), `--k-prose-leading` and `--k-prose-gap` (new tokens), link styling and forced-colors support.
  `text` turns blank lines into paragraphs, keeps line breaks and makes links of `http(s)://` and e-mail
  addresses (external ones: `target="_blank"`, `rel="noopener noreferrer"` and a spoken hint; never another
  scheme); without `text` the children get the same typography. Text is never read as HTML.
  `parseProse(text)` is exported.
- CI guard against markup from strings (#59): `npm run check:html` fails on `{@html}`, `innerHTML`,
  `outerHTML`, `insertAdjacentHTML`, `document.write`, `createContextualFragment` and `srcdoc` in
  `src/lib` and `src/elements`; it runs in the `build` job.
- `SkipLink` / `<k-skip-link target label>` (#64): hidden until it has keyboard focus, then shown with a
  focus ring (forced-colors aware); Enter focuses the target element (it gets a temporary `tabindex="-1"`)
  without touching the address bar, and falls back to the normal fragment link when the target is missing.
- `LiveAnnouncer` / `<k-live-announcer>` and `announce(message, politeness)` (#64): one polite
  (`role="status"`) and one assertive (`role="alert"`) region, present from the first render. The state is a
  framework-free store on `globalThis[Symbol.for('kern.announcer')]` (like the toast queue), so `announce()`
  from the Svelte package, `window.kern.announce()` and `elements/live-announcer` reach the same regions;
  only the first live-announcer on a page fills its regions. An equal message is cleared and set again, and
  a message is removed after 10 s. Exports `announce`, `createAnnouncer`, `sharedAnnouncer`,
  `ANNOUNCE_CLEAR_MS`, `ANNOUNCE_REPEAT_MS` and the types `Announcer`, `AnnouncerHost`, `Politeness`.
- `OnlineStatus` / `<k-online-status>` (#64): a non-blocking notice while `navigator.onLine` is false,
  announced through the announcer (the notice is a live region itself when none is mounted or
  `announce` is off). `bind:online`, `onchange` (element: `change` with `{ online }`, only on a change),
  `offlineTitle`, `offlineText`, `onlineText` (or the catalogue), `politeness`, `announcer`.
- The a11y test pages are now checked in the `line` theme as well; new pages `strings` and `primitives`
  (also with the skip link focused and while offline) join the axe run.

## [0.5.0] - 2026-11-19

### Added
- Theme `line` (= `line-dark`) and `line-light` from the Line-Designsystem (#77): pill controls, 1.5px
  borders, no shadows, Outfit / Inter / JetBrains Mono, 44px targets for every pointer, buttons 52px.
  Entry `@mozra-the-great/kern/themes/line.css`, also part of `themes.css`. Control borders and the
  light accent mark are adjusted to kern's 3:1 contract (mapping in `brands/line.css` and
  `docs/themes.md`). `ThemeToggle` and `createThemeScript` know the `line` family.
- `Progress` parity with stuffcloud (#42): `tone` (`'default' | 'warn'`), `valueText`
  (`aria-valuetext`), `hideLabel`; `<k-progress>` gets `tone`, `value-text`, `hide-label`. Inputs are
  normalised (value clamped to 0…max, NaN/Infinity count as 0, a non-positive or non-finite `max`
  falls back to 100; `aria-valuenow`/`aria-valuemax` report the normalised values). The
  indeterminate bar draws stripes moved with `transform` only, tuned by the new tokens
  `--k-progress-period`, `--k-progress-loop`, `--k-progress-ease` (stuffcloud: `steps(4)`);
  forced-colors rules keep the fill visible in `Highlight`.
- `Toaster` parity with stuffcloud (#43): timers pause while a toast is hovered, holds focus or the
  tab is hidden and resume with the remaining time; two live regions (`role="status"`,
  `role="alert"` for danger) exist before the first toast; a limit of open toasts (`max`, default
  5, oldest closes first); positions `bottom-left` and `top-left`; tokens `--k-toaster-offset` and
  `--k-toaster-offset-mobile` (bottom positions below 760px; stuffcloud 76px); forced-colors rules.
  `<k-toaster>` gets `max` and `undo-label`.
- Injectable toast queues: `createToastQueue({ max })`, `sharedToastQueue()` and the `queue` prop
  of `<Toaster>`; the page-wide queue stays the default. Exports `TOAST_DURATIONS`, `TOAST_MAX`
  and the types `ToastQueue`, `ToastCloseReason`.
- Toast lifecycle callbacks for undo/commit (#44, nagellacke Snackbar semantics): `onundo` (shows
  an undo button labelled by the Toaster's `undoLabel`), `oncommit` (exactly once on every close
  except undo), `onclose(reason)` with `timeout | dismiss | action | undo | replaced | cleared`,
  and `key` (a new toast with the same key replaces the old one, which commits first). Same API in
  `window.kern.toast`; `toast.clear()`. `<Toaster>` gets `ondismiss`, `onundo`, `onaction`;
  `<k-toaster>` fires `dismiss`, `undo` and `action` (`detail: { id, key }`) for the buttons the
  user pressed. After a keyboard activation, focus moves to the next toast or back to where it
  came from.
- `Modal` modes for blocking dialogs (#45): `dismissible={false}` (no Escape, no backdrop close,
  no close button; `closedby="none"` plus a fallback for browsers without it), `initialFocus`
  (element or selector), `alert` (`role="alertdialog"`), `oncancel` (cancelable close request).
  `<k-modal>`: `dismissible="false"` attribute or property, `initial-focus`, `alert`, and a
  cancelable `cancel` event. The page behind an open modal no longer scrolls (nested modals
  share one lock).
- Demo section "Rückmeldung" and element demos for the above; Vitest tests of the progress
  normalisation and the toast queue (`tests/unit`), Playwright tests of the elements
  (`tests/elements/feedback.spec.ts`).
- `Button`: `wide` (full width, label at the start and the last child at the end, as stuffcloud's
  `wide`), `size="icon"` (a `--k-tap-icon` square for an icon with `aria-label`) and the typed link
  props `target`, `rel`, `download`, `hreflang`, `referrerpolicy`. `<k-button>` gets `wide`, `target`,
  `rel`, `download` and `label` (accessible name for icon-only content) (#52).
- Token `--k-disabled-opacity` (0.5; stuffcloud 0.4), used by Button, IconButton and CopyButton, and a
  forced-colours state (GrayText) for them (#52).
- `Card`: `as` (`article` | `section` | `div` | `li`) and pass-through of `id`, `aria-*`, `data-*` and
  event attributes to the root (#50). `onclick` makes the title a `<button>` whose hit area covers the
  card, while footer, badge and content controls stay separate (no nested interactive elements);
  `actionLabel`, `actionHaspopup`, a `badges` snippet and `muted` (#51). `<k-card>`: `as` (`li` sets
  `role="listitem"` on the element), `clickable` with the event `action`, `action-label`,
  `action-haspopup`, `muted` and the slot `badges`.
- `FileDrop`: `mode="dispatch"` (no list; each pick or drop goes to `onfiles`; the same file can be
  picked again), `onreject(files)`, `rejectMessages`, `buttonLabel` (a separate picker button) and an
  exported `reset()`; refused files are reported before accepted ones. `<k-file-drop>`: `mode`,
  `button-label`, `no-reject-messages`, the event `reject`, a writable `files` property and `reset()`
  (#53).
- `matchesAccept()`, `splitFiles()` (the `<input accept>` grammar) and the type `SplitFiles` are
  exported (#53).
- `Field`: `keepHint` (hint and error together, the error referenced first), `announce`, `labelId`,
  and `required` in the snippet argument (type `FieldControlProps`, exported). `Input`, `Select` and
  `Textarea` take `keepHint`, their elements `keep-hint` (#54).
- `CopyButton`: `text` (alias of `value`) and `showLabel` (a visible label that is the accessible
  name); `<k-copy-button>`: `text`, `show-label` (#72).
- `StatusMessage` component and `<k-status-message>` element: a visible `role="status"` or
  `role="alert"` paragraph that is present and empty from the first paint (#72).
- The Custom Elements Manifest and typings describe element methods (`@method` tag) and writable
  properties.
- Tests: Vitest renders the components with `svelte/server` (`tests/components`), Playwright checks
  the parity behaviour of the elements (`tests/elements/parity.spec.ts`); both run in the existing CI
  steps.

### Changed
- **BREAKING:** default toast durations follow stuffcloud: info and ok 6000ms (was 5000), warn
  10000ms (was 5000), danger stays until dismissed also through `toast({ tone: 'danger' })` (was
  5000; `toast.danger()` already stayed). At most 5 toasts are open; the oldest closes with reason
  `replaced`. Migrate: pass `duration` to keep the old timing; set `max` on the Toaster (or
  `queue.max = Infinity`) for no limit.
- **BREAKING:** the page-wide toast store on `globalThis[Symbol.for('kern.toasts')]` has a new
  shape (`version: 2`, a `ToastQueue`). A page that mixes this kern with an older copy (Svelte
  package and elements bundle of different versions) gets two separate stores; load both from
  the same version.
- **BREAKING:** `<Toaster>` renders its toasts inside two live regions (`role="status"` and
  `role="alert"`) instead of a `role` on each `<li>`; the markup is `div.list > div.toast`. Styles
  that targeted `.k-toaster ol`/`li` need the new selectors.
- `action.onclick` of a toast now runs after the toast is removed (it ran before); a throwing
  callback no longer leaves the toast open.
- `Progress` `value` also accepts `null` (indeterminate), like `ProgressRing`; the determinate
  width transition follows `--k-dur` (off under reduced motion) instead of a fixed 300ms.
- `<k-modal>` documents that `close` also fires when the app closes it through `open` (unchanged
  behaviour).
- **BREAKING:** `Button` with `href` and `disabled` (or `loading`) stays an `<a>`, without `href`,
  with `role="link"` and `aria-disabled="true"`, instead of turning into a disabled `<button>` (#52).
  Migration: style or query a disabled link as `a[aria-disabled="true"]`; code that looked for a
  `<button disabled>` there must look for the link.
- **BREAKING:** the error paragraph of `Field` (and of every component built on it) has
  `role="alert"`, so an error that appears is announced (#54). Migration: nothing to do for most
  forms; pass `announce={false}` to `Field` where the control announces the error itself.
- `Input`, `Select` and `Textarea` merge a consumer's `aria-describedby` with their own ids instead of
  dropping it; the generated description ids are now `<id>-error` and `<id>-hint` (#54).
- `CopyButton` sets its message fresh on every click (cleared, then set after a short pause, so the
  same result is announced again) and keeps it until the next click; only the icon resets after
  `resetAfter`. The success and error colours apply to the icon only (#72).

## [0.4.0] - 2026-11-19

### Added
- `Mascot` component and `<k-mascot>` element: the pixel-art runtime moves from stuffcloud into kern
  (#55, stuffcloud ADR 0008). Draws any shipped stuffcloud SVG (by mascot name or
  `<group>/<file>` path) or a consumer URL through `<img>`: integer scales only (`scale`,
  `compactScale` below 760px), box reserved before the image loads, `transform`-only `steps(1)`
  bob with the tokens `--k-mascot-bob-period` (1.2s) and `--k-mascot-bob-offset` (4px), paused
  off-screen and in hidden tabs, still under `prefers-reduced-motion`, decorative unless `label`
  is set, no canvas, no `data:` URIs.
- Exports `MASCOT_NAMES`, `MASCOT_SOURCES` (stuffcloud names → kern files, same shape as
  stuffcloud's), `STUFFCLOUD_ART` (pixel grid of every shipped SVG), `artPath`, `artUrl`,
  `normaliseScale`, `integerScale`, `mascotSize`, `BOB_PERIOD_MS`, `BOB_OFFSET_PX`,
  `COMPACT_MAX_WIDTH_PX` and the types `MascotName`, `MascotSource`, `MascotArt`, `MascotMotion`,
  `PixelGrid`, `StuffcloudArt`.
- The missing stuffcloud pixel art (#56): 31 tool stickers and 7 seasonal decorations; kern now
  ships the same 115 SVGs as stuffcloud's `docs/design/prototypes`, byte for byte.
- `assets/stuffcloud/manifest.json` (size, sha256 and grid per file) and a drift check
  (`npm run assets:check`, in the `build` job; `--against <dir>` compares with a stuffcloud
  checkout); refresh with `npm run assets:manifest` (see `assets/README.md`).
- Playwright tests of `<k-mascot>` under a strict CSP (`npm run test:mascot`, in the `build` job)
  and Vitest tests of the catalogue, the name mapping and the stylesheet rules.
- CI type-checks a Svelte app with stuffcloud's compiler flags (`strict`,
  `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`,
  `noPropertyAccessFromIndexSignature`, `noUnusedLocals`, `svelte-check --fail-on-warnings`)
  against the built package, using every component (`npm run test:consumer`), and fails on the
  type `any` in the published `.d.ts` files (`npm run check:dts`).
- ESLint (typescript-eslint strict and strict-type-checked, eslint-plugin-svelte,
  `no-explicit-any` as an error) and Prettier with prettier-plugin-svelte; `npm run lint` runs
  in CI, `npm run format` formats (#23). The code base is formatted once; the commit is listed
  in `.git-blame-ignore-revs`.

### Changed
- The demo build no longer inlines SVGs as `data:` URIs (`build.assetsInlineLimit`).
- The last uses of `any` are gone (`Button` link branch, `formAssociated()`, the menu element
  wrappers); kern itself now compiles with `exactOptionalPropertyTypes`.

### Fixed
- Strict TypeScript consumers (#22): every optional prop of every component, every optional
  field of the exported types (`TabItem`, `SelectOption`, `MenuEntry`, `ToastInput`, the element
  types …) and the `statusLabels` maps accept an explicit `undefined`, so apps compiled with
  `exactOptionalPropertyTypes` can pass `string | undefined` values. `undefined` behaves like a
  prop that is left out.
- Bindable props can be bound to state that is `undefined` (`bind:value={x}` with
  `x: string | undefined`, also `checked`, `open`, `page`, `files`, `selected` …). Before, the
  components gave these props a fallback, and Svelte throws `props_invalid_value` for such a
  binding; now the default applies where the value is read and the bound variable stays
  `undefined` until the user changes something.
- `toast({ duration: undefined })` (or `tone: undefined`) keeps the default instead of a toast
  that never closes.

## [0.3.0] - 2026-11-19

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
- Custom elements forward native attributes to their inner control (#31): `k-input`
  (`maxlength`, `minlength`, `pattern`, `readonly`, `min`, `max`, `step`, `size`, `multiple`,
  `autocapitalize`, `spellcheck`, `enterkeyhint`, `title`, `aria-label`, `aria-description`),
  `k-textarea` (also `autocomplete`, `cols`, `wrap`), `k-select` (`size`, `autocomplete`),
  `k-checkbox`/`k-switch`/`k-slider` (`title`, `aria-*`; `k-switch` also `required`). One typed
  mechanism (`src/elements/native.ts`, `control.svelte.ts`) instead of per-wrapper code.
- Constraint validation of every form element reflects into `ElementInternals`:
  `form.checkValidity()`/`reportValidity()`, the submit-time check and `:invalid` work; the
  browser's message points at the inner control. Elements get `validity`, `validationMessage`,
  `willValidate`, `checkValidity()`, `reportValidity()` and `setCustomValidity()`; `autofocus`
  focuses the inner control. `k-radio-group` gets `required`.
- TypeScript declarations for the elements (#32): `@mozra-the-great/kern/elements` types
  `HTMLElementTagNameMap`, per-tag element interfaces with typed `addEventListener`, event maps
  with typed `detail`, data shapes (`TabItem`, `SelectOption`, `MenuEntry` …) and `window.kern`.
  React 19 JSX types via `import type {} from '@mozra-the-great/kern/elements/react'`
  (`on<event>` handlers typed per element).
- `custom-elements.json` (Custom Elements Manifest 2.1) in the package, generated from the
  wrappers by `scripts/elements-manifest.mjs`; CI checks it is up to date.
- Per-element entry points (#33): `@mozra-the-great/kern/elements/<name>` registers one tag
  (`elements/accordion` also `k-accordion-item`; `elements/toaster` exports `toast`/`dismissToast`).
  Shared code lives in chunks; five elements load 38 kB gzip instead of 146 kB.
  `kern-elements.js` stays one self-contained file.
- CI: Playwright tests of the built elements (`npm run test:elements`: native attributes,
  validity, a full `<form>` submit with `FormData`, reset, entry points), a strict TS + React 19
  typings fixture (`npm run test:types`) and a size budget (`npm run size`, +10 % over
  `scripts/ci/size-baseline.json` fails).

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
- **BREAKING:** form elements now take part in constraint validation like native fields. A form
  with an empty `<k-input required>` (or a `pattern`/`min`/`max` mismatch, an empty required
  `k-checkbox`, `k-select`, `k-combobox`, `k-tag-input` …, or a half-filled `k-pin-input`) no
  longer submits; the browser shows its message. To keep the old behaviour, drop the constraint
  or set `novalidate` on the form.
- Tags are registered through one idempotent `define()`: loading two entry points or two copies
  of kern registers each tag once (first wins); a `k-*` tag owned by another library is left
  alone with a console warning. The `k-` prefix is fixed and reserved for kern.
- `window.kern` is set only when it is not set yet.

### Fixed
- `form.reset()` now also resets `k-checkbox`, `k-switch`, `k-radio-group` and `k-select`.

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
