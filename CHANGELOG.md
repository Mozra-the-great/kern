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

## [0.12.1] - 2026-11-25

### Fixed
- `<k-button>` in a stacked `<k-modal>` footer (below 520 px; in the Code theme up to 760 px) fills the row in every
  theme, like the Svelte `Button` (#120): the host and the button inside it. Before, Flower, Pop and Line kept the
  button's own width; since #119 only Code stretched it. `Modal` now sets `--k-modal-action-w: 100%` on its footer
  below 520 px and `KModal` reads the token for the slotted hosts, replacing the width rule on the children, so Code
  and the other themes share one mechanism. The Code theme looks as before; a row footer is unchanged.
- A `Button` label wider than its container no longer overflows it (#121, WCAG 1.4.10 reflow): `white-space: nowrap`
  is gone, the button is never wider than its container (`max-width: 100%`), a long label wraps (centred, `wide`
  keeps it at the start) and a word wider than the container breaks (`overflow-wrap: anywhere`). A label that fits
  stays on one line and every size keeps its height: the vertical padding (`--k-space-1`) stays below each size's
  minimum height, and the screenshots of the Code baselines and of the demo in all eight theme variants did not
  change. Applies to `<k-button>`, and to every component that renders a `Button`.

## [0.12.0] - 2026-11-25

### Changed
- Code theme parity with stuffcloud (#111): every item of the former "Approved differences" list was compared again
  with stuffcloud's `src/ui`, `stuff.css` and the mockups S/T, and aligned where WCAG 2.2 AA, the tap target, focus,
  reduced motion, forced colours and the cross-theme API allow it. Visible in `code` and its variants (and the
  `stuffcloud*` aliases) only: pressed buttons no longer move, the danger button turns pink on hover, button text
  uses `line-height: normal`; Input and Select keep their edge on hover and focus (the focus ring stays); Select
  shows the browser's arrow; a field error has no icon; Checkbox is the browser's checkbox filled pink
  (`accent-color`) in a 48 px row, disabled greys the label; Tabs fade no edge on desktop and only the end edge
  below 760 px; Modal opens without animation and below 760 px is T's sheet (full width at the bottom, top edge,
  no shadow) with full-width stacked actions, `<k-button>` in the footer included; the Modal and toast close
  buttons are the app's 48 px ghost icon button; toasts have no tone dot, centred text and no entrance animation;
  FileDrop has no upload icon and no inset ring while dragging, and its button wraps under the prompt as in the app.
  Under forced colours the error icon, the tone dot and kern's own checkbox stay. The few remaining differences
  and their reasons are in `docs/themes.md` ("Remaining differences"). New component tokens (defaults are exactly
  what the components drew before, so Flower, Pop and Line do not change): `--k-button-leading`,
  `--k-button-press-offset`, `--k-button-danger-hover-as-primary`, `-filter`, `--k-field-hover-border`,
  `--k-field-focus-border`, `--k-field-error-icon`, `--k-select-appearance`, `--k-select-chevron`,
  `--k-select-pad-end`, `--k-check-appearance`, `--k-check-tick`, `--k-check-row-h`, `--k-check-disabled-fg`,
  `--k-tabs-fade-start`, `--k-tabs-fade-end`, `--k-modal-action-w`, `--k-modal-width`, `-margin`, `-border-w`,
  `-shadow`, `-enter-dur`, `-close-inset`, `-close-icon`, `--k-close-fg`, `--k-close-hover-bg`, `--k-close-border-w`,
  `--k-close-stroke`, `--k-toast-dot`, `--k-toast-align`, `--k-toast-text-offset`, `--k-toast-close-size`,
  `--k-toast-close-icon`, `--k-toast-enter-dur`, `--k-filedrop-icon`, `--k-filedrop-drag-ring`,
  `--k-filedrop-split-gap`, `--k-filedrop-prompt-basis`. No prop, default or event changed.
  Migration: nothing to do. An app on `code` that wants a part of the old look back sets the token on its
  `[data-theme^='code']` element, e.g. `--k-check-appearance: none; --k-check-tick: block` for kern's drawn
  checkbox, or `--k-modal-width: initial; --k-modal-margin: auto` (inside its own `@media (max-width: 760px)`)
  for the centred phone dialog.
- Demo: no horizontal scrolling at 320 px in any theme (#116); `tests/targets/reflow.spec.ts` checks both demo pages in all
  eight theme variants at 320 x 640 as part of the required `build` job.

## [0.11.0] - 2026-11-25

### Added
- `Button` and `<k-button>` say that they are loading (#109): while `loading`, a visually hidden polite status text
  ("Loading", German "Lädt") is announced, so the state does not depend on the motion of the spinner mark (which
  keeps turning, slowed, under `prefers-reduced-motion`). The text is the new catalogue entry `button.loadingLabel`
  (`strings.ts`, German in `strings-de.ts`) and is overridable with the new optional prop `loadingLabel`
  (`<k-button loading-label="…">`). It is a live region next to the button or link, empty until loading starts, so it is
  not part of the accessible name (that stays the visible label), nothing is announced while idle, and `aria-busy`
  stays. A button that is given `loading` (true or false) renders one more hidden, out-of-flow `<span role="status">` after the control; one that is never given `loading` (e.g. the buttons inside `SortableList`) does not.
- Consumer documentation (#57), in German like the README and linked from it: `docs/consumer-guide.md` (install from
  the release tarball, check the sha256/sha512 files and the lock file's integrity against the release notes, update
  steps, one theme entry per app, `data-theme` values and their colour scheme, theme before first paint, fonts, accent
  API, forced colours, Vite and asset notes, a Content Security Policy table, the component mapping from stuffcloud's
  `src/ui`), `docs/react.md` (React 19 over the custom elements: setup, properties vs attributes, events, controlled
  fields, forms, moving to Svelte, and which `react-*.spec.ts` proves what), `docs/accessibility.md` (the
  accessibility statement: WCAG 2.2 AA target, what is checked automatically, what the components guarantee, known
  limits such as the slowed spinner under reduced motion, what the app has to provide).
- Generated API reference `docs/api/reference.md`: props (type, default, bindable, catalogue text), callbacks and
  snippets of every Svelte component, attributes, properties, events with their `detail` type, slots and methods of
  every custom element, the component's own `--k-<name>-*` variables and the exported data types. It is built by
  `scripts/api-reference.mjs` from `src/lib/components/*.svelte` (Svelte parser and TypeScript API, no build needed),
  `custom-elements.json` and `src/elements/types.ts`; `npm run docs:api` writes it, `npm run docs:check` fails when the
  committed file is stale and runs in the required `build` job. How to read it: `docs/api/README.md`.
- Flower banner as vector art (#110): `@mozra-the-great/kern/assets/flower/banners/garden-frame.svg`
  (`viewBox="0 0 1536 650"`, 70 kB). The design system's `banner.png` (500 kB raster with a title and account names
  in the picture) was redrawn as a text-free SVG with the same composition and palette: plants from all four edges,
  three flat hills along the lower edge, an empty middle, its own cream ground. Filled paths in the fixed Flower
  colours only, like the other flower motifs. `assets/flower/` now has 47 files; `assets/README.md` documents the new
  `banners/` group and the demo's "Marken-Assets" section shows it at full width.

### Changed
- README: a "Dokumentation" list at the top links the new pages; the accessibility statement moved to
  `docs/accessibility.md` and the README keeps a short summary with the link.
- Component test suite, stage 2 (#24): behaviour tests in jsdom for every component that only had a smoke test
  (Popover, Tooltip, DropdownMenu, ContextMenu, Combobox, TagInput, DatePicker, ColorPicker, PinInput, NumberInput,
  TreeView, CommandPalette, SelectGrid, SortableList, Carousel, Resizable, ScrollArea, Marquee, Terminal, DataTable,
  Table, Heatmap, Sparkline, Stat, Pagination, Timeline, Stepper, Navbar, Breadcrumb, Kbd, SkipLink, Tag, HistoryBar,
  DownloadButton, ThemeToggle, Rating, OnlineStatus, RelativeTime, StatusDot, Typewriter, Skeleton, CountUp, Reveal,
  Scramble, Odometer, Highlight, SegmentedControl, Slider, Prose and the small display components) and for the shared
  modules (`anchor.ts`, `color.ts`, `data-utils.ts`, `theme.ts`, `accent.ts`, `announcer.ts`, `strings.ts`,
  `modal-dialog.ts`, `scroll-lock.ts`, `scroll-fade.ts`, `motion.svelte.ts`). Coverage over `src/lib` went from
  65.49 / 48.35 / 67.4 / 63.76 % to 99.53 / 96.25 / 99.95 / 100 % (statements / branches / functions / lines); the ratchet
  in `vitest.config.ts` is now 99 / 96 / 99 / 100, above the 95 % floor. No source file is excluded.

### Fixed
- `Odometer` and `CountUp` (`makeNumberFormatter`) kept their `format` options when `locale` is invalid: they fell
  back to a bare `Intl.NumberFormat()`, so `minimumIntegerDigits`, currency and similar options were dropped. They now
  fall back to the default locale with the same options, and only to the plain default format when the options are
  invalid too.

## [0.10.0] - 2026-11-20

### Added
- Accessibility suite (#25), part of `npm run test:elements` and so of the required `build` job. Every custom element
  (and so every component) is checked in the eight theme variants `code`, `code-light`, `flower`, `flower-wald`, `pop`,
  `pop-dark`, `line` and `line-light`: axe with serious and critical findings failing, on one page with every element
  and in 15 open states (modal, drawer, palette, popover, menus, pickers, suggestions, toasts, tooltip, invalid
  fields, sorted data table, phone menu); keyboard (tab order with a computed focus ring on every stop and no loop,
  ring after Tab and none after a click, each element operated with the keys of its WAI-ARIA pattern, modal dialogs
  trap Tab and give the focus back on Escape, all other overlays release it); reduced motion (no animation or
  transition longer than a frame on any page, in open states and after hover, focus and operation, no smooth
  scrolling; the slowed spinner is the one documented exception); reflow at 320 x 640 (no horizontal scroll, no
  control cut off). New specs `a11y-matrix`, `a11y-keyboard`, `a11y-keys`, `a11y-overlays`, `a11y-motion` and
  `a11y-reflow` in `tests/elements` with shared parts in `a11y-shared.ts`; `a11y.spec.ts` now runs its pages in all
  eight variants. Coverage tables fail the build when a new element is not covered (the page, `STATES`, `KEYBOARD`),
  and every check has a canary that makes it fail on a deliberate violation. See `docs/testing.md`.
- README: accessibility statement ("Barrierefreiheit: Erklärung und was automatisch geprüft wird") with what is
  checked, the one reduced-motion exception and what is not automated.

### Fixed
- `<k-dropdown-menu>`: a click on the button did not open the menu, and the arrow keys did not move past the first
  item. Inside the element's shadow root the window click listener saw the host instead of the button (it closed the
  menu at once) and `document.activeElement` was the host (so no item was current). Both now look through the
  shadow root (`eventWithin`, `activeElementOf`).
- `DropdownMenu` / `<k-dropdown-menu>` on a narrow screen: a button in the middle of a 320 px screen put the menu's
  right edge past the viewport (the page scrolled sideways and items were cut off). The menu is now shifted sideways
  until it fits and is at most as wide as the viewport; it still hangs from the button and scrolls with the page.
- `Pagination` below 300 px: the previous and next buttons show only their arrow (the text stays as the accessible
  name). With a wide label font the two words and the page counter made the page scroll sideways at 320 px.
- `<k-navbar>` on a narrow screen: after opening the menu with Enter or Space the next Tab left the navbar and
  skipped the panel (it comes before the button in the DOM). The focus now moves to the first link; Escape still
  returns it to the button.
- `<k-tooltip>`: the text never reached assistive technology when the trigger was slotted light DOM or inside another
  element (an id reference cannot cross a shadow root). While the focus is in such a trigger it gets `aria-description`
  with the tooltip text; the `aria-describedby` of the Svelte component is unchanged.
- `Table` with sortable columns at 760 px and below: the header was visually hidden but its sort buttons stayed
  focusable, so keyboard users tabbed into invisible controls and nobody could sort on a phone. The sortable headers
  now show as a row of bordered chips above the stacked rows (a table without sortable columns keeps the hidden header).
- `Field` (so Input, Select, NumberInput, Combobox ... ): a control with a wide intrinsic size, such as the text input
  of `NumberInput`, stretched the field past its container at 320 px and made the page scroll sideways. The field's grid
  column is now `minmax(0, 1fr)`.

## [0.9.0] - 2026-11-20

### Added
- Text for assistive technology only (#100): `VisuallyHidden` (`as`: `span` (default), `div`, `p`, `label`,
  `h2`–`h4`; `focusable` shows the content while it has focus; other attributes go to the element),
  `<k-visually-hidden>` (attribute `focusable`) and the global classes `.k-visually-hidden` and
  `.k-visually-hidden-focusable` in `base.css`, so every theme entry ships them. All use the same rule
  (1 × 1 px, `clip-path: inset(50%)`, no wrapping); the text stays in the accessibility tree.
- Save-as-download helpers (#92): `saveBlob(name, blob)` and `saveText(name, text, type?)` offer data the page holds as
  a file: an object URL on a temporary `<a download>` that is clicked once (its click does not bubble to the
  document) and revoked `REVOKE_DELAY_MS` (1 s) later; nothing is sent anywhere. They never throw and return
  `{ ok: true, name, size, type }` or `{ ok: false, error: { code, message, cause? } }` with `code` `no-dom` (no
  document: server rendering, a worker), `invalid` or `failed`. File names go through `sanitizeFileName` (no path
  separators, control, zero-width or direction-override characters, no characters Windows forbids, reserved names
  prefixed, long names shortened keeping the extension; the catalogue's `downloadButton.fallbackName` when nothing is
  left). `saveText` writes UTF-8 with `text/plain` as the default type (`textMimeType`). Types:
  `DownloadResult`, `DownloadOk`, `DownloadFailure`, `DownloadError`, `DownloadErrorCode`, `SaveOptions`.
- `DownloadButton` / `<k-download-button>` (#92), built like `CopyButton`: icon-only with `label` as the accessible name,
  or `showLabel` / `show-label`. Content from `getContent` (a string or `Blob`, also async, called at click time; a spinner
  and ignored clicks while it runs), `blob` or `text`; `name`, `type`. A polite live message (`startedLabel`) set fresh per
  click, visible with `showStatus`; a failure (`getContent` throws or rejects, no content, the browser refuses) shows
  `errorLabel` as an alert under the button. `ondownload(result)` / `onerror(error)`; element events `download`
  (`{ name, size, type }`) and `download-error` (`{ code, message }`, code `content` for a failing producer), for user input
  only. Attributes `text`, `name`, `type`, `label`, `show-label`, `started-label`, `error-label`, `show-status`, `variant`,
  `size`, `reset-after`, `disabled`; the Blob and the producer are the properties `blob` and `getContent`.
- Catalogue `downloadButton` (`label`, `startedLabel`, `errorLabel`, `fallbackName`) in English and German.
- React 19 bridge tests (#35): a real React 19 app (`tests/fixtures/react-app`, StrictMode, development build, strict
  TypeScript with the shipped element typings) runs in Chromium against the built element entries. The Playwright
  specs `tests/elements/react-*.spec.ts` cover form controls with `FormData`, validity and reset, modal, drawer,
  popover and toasts, tabs, tab links, data table, pagination, sortable list, select grid and file drop, controlled
  values, refs, unmount and remount, two roots on one page and `setStrings(de)`. Every test fails on a `pageerror` or a
  console error or warning. They run in `npm run test:elements` (which builds the app first, `npm run build:react-app`);
  `npm run test:types` also type-checks the app. New devDependencies: `react`, `react-dom`, `@types/react-dom`.
- README: "React 19" section with a tested example and the rules for properties, attributes, events and forms.
- Forced colors (Windows high contrast) in every component (#27): under `@media (forced-colors: active)` each
  control keeps a visible edge (border or outline in `ButtonText`/`CanvasText`), the focus ring is `Highlight`,
  selected, current, checked, pressed, open and invalid states differ in more than colour (inverted
  `Highlight`/`HighlightText`, a shape, a heavier or double edge), disabled parts are `GrayText` at full opacity,
  SVG icons take a system colour, and fills drawn only by `background` or `box-shadow` (Switch, Radio, Slider,
  Progress ring, Heatmap, HistoryBar, Stepper, Timeline, TreeView and DataTable selection, Carousel dots,
  Highlight, Caret, Skeleton, Resizable, Sparkline, Spinner, Terminal, Toaster dots, DownloadButton icon, overlays) are redrawn in system
  colours. `base.css` sets the edge, focus, accent, shadow and disabled tokens to system colours with `!important`
  inside the media query, so a theme cannot defeat them. ColorPicker keeps the colours of its swatches. Normal
  rendering is unchanged (all rules sit inside the media query; the visual-regression baselines are untouched).
- Tests: `tests/elements/forced-colors.spec.ts` (a table with one entry per custom element: edge, focus ring after
  keyboard focus, state differences without the background colour, `GrayText`; opened overlays; no theme colour in
  five themes and both system palettes at 1280 and 375 px; axe without serious or critical violations in Code and
  Flower), forced-colors screenshots in `visual.spec.ts` (`fc-*`, dark and light palette), and
  `tests/unit/forced-colors.test.ts` (a styled component needs a forced-colors rule or a documented exemption).
  The PR template has a checklist item for it. `tests/elements/axe.ts` can leave rules out (`disable`).
- Component behaviour tests (#24, stage 1): a second Vitest project (`dom`, jsdom with
  `@testing-library/svelte` and `user-event`) next to the node tests. A smoke test renders every
  component exported from `src/lib/index.ts` (and fails when a new export has no entry); behaviour suites
  cover Button, IconButton, Link, Card, Tile, Field, Input, Textarea, Select, Checkbox, Switch, RadioGroup,
  Tabs, TabLinks, Modal, Drawer, FileDrop, Progress, ProgressRing, Toaster, Code, CodeBlock, CopyButton and
  Mascot. `docs/testing.md` maps each stuffcloud test file to its kern counterpart.
- `npm run test:coverage`: v8 coverage over `src/lib` (text report, `coverage/lcov.info`), uploaded as a CI
  artifact, with a ratchet at the current numbers rounded down (raised to 95 % in stage 2).

### Changed
- CI review (#102): the tiered `claude-review` runs two more reviewers in parallel, `review-security` (opus, after
  Anthropic's `/security-review`, confidence ≥ 8/10) and `review-docs` (sonnet, documentation the change makes wrong);
  every review agent gets a working-environment note (single `gh pr diff` / `gh pr view` calls only), the validator
  rules for security and docs findings, and security findings are posted as `**Security (<severity>):**`. Files taken
  unchanged from Mozra-the-great/StressMySite `main` (identical in nagellacke and stuffcloud); job name and the
  `claude-code-action` pin (v1.0.283) are unchanged.

### Fixed
- `<k-button type="submit">` and `type="reset"` failed with `TypeError: form.reset is not a function` when a control in
  the form had the id or name `reset` or `submit` (the control shadows the form's method). They now call the
  `HTMLFormElement` methods directly.
- A kern form element whose `name` was set as a property (what React 19 does for `name="…"`) was missing from
  `FormData` and the submit: a form-associated element is named by its `name` attribute. `name` is reflected to the
  attribute now, on every form element.
- `disabled={true}` set as a property (React 19) did not disable the host for the form: the field was still submitted
  and matched `:enabled`. `disabled` is reflected to the attribute, so the host is disabled like a native field.
- `form="id"` on a kern form element threw `Cannot set property form … which has only a getter` in React 19 (it sets
  the property because the element has one) and unmounted the tree. `form` accepts the id now and sets the attribute.
- Under forced colors the checkbox mark, Switch thumb, Radio dot, Slider fill, ProgressRing arc, Spinner arc, Heatmap
  cells, HistoryBar bars, Stepper connectors, tree and table row selection, the current Navbar link and the
  selected segment, day and pagination page were invisible or looked like their unselected neighbour.

## [0.8.0] - 2026-11-19

### Added
- Code theme source of truth (#37): `src/lib/themes/code.tokens.json`, shipped as
  `@mozra-the-great/kern/themes/code.tokens.json`, lists every token of every Code variant with its value and
  where it comes from in stuffcloud's `docs/design` (or the app, or the design-system artifact for light, paper and
  contrast). `brands/code.css` is generated from it (`npm run tokens:code`). `npm run tokens:check` (CI) compares it
  with the checked-in design snapshot `scripts/ci/code-theme-snapshot.json`; `node scripts/ci/code-theme.mjs
  --against <stuffcloud>` compares the snapshot with a stuffcloud checkout (also runnable from stuffcloud's CI) and
  `--refresh` rewrites it (docs/themes.md, "Code theme source").
- Instance-neutrality guard (#37): `npm run neutrality:check` (CI) fails on e-mail addresses, URLs, domains and IPv4
  addresses in the themes, the snapshot and `assets/**`, plus an operator list from the Actions secret or variable
  `KERN_FORBIDDEN_TERMS` (never printed).
- Component tokens (#38): Button (`--k-button-*`), Input and Select (`--k-field-font`, `-size`, `-bg`,
  `--k-select-bg`, `--k-field-pad-x`, `-disabled-opacity`), Field and Label (`--k-field-label-color`, `-hint-font`,
  `-hint-size`, `-hint-color`), Checkbox (`--k-check-*`), Card (`--k-card-bg`, `-pad`, `-gap`), Tabs (`--k-tabs-gap`,
  `-scrollbar`, `--k-tab-*`, including `--k-tab-divider-w` for a strip of cells), Modal (`--k-modal-*`, including
  `--k-modal-actions-direction` for stacked actions at a theme's phone breakpoint), Progress
  (`--k-progress-track`, `-track-border-w`), Toaster (`--k-toaster-width`, `--k-toast-pad`, `-msg-size`, `-ok-border`,
  `-warn-border`) and FileDrop (`--k-filedrop-*`). Every default is the previous look: Flower, Pop and Line do not
  change (`npm test` checks every variant).
- Visual regression of the Code theme (#38): Playwright screenshots of those components in `code` and `code-light`
  at 1280, 375 and 320 px (`tests/elements/visual.spec.ts`, in the `build` job); the `stuffcloud` aliases render
  against the same baselines.
- Accent API (#41, generic part): a custom accent colour on top of any standard theme, with WCAG contrast guaranteed.
  `accentTokens(hex, { theme | scheme | surfaces, roles })` derives `--k-accent`, `--k-on-accent`, `--k-accent-soft`,
  `--k-accent-mark`, `--k-accent-text`, `--k-primary`, `--k-on-primary`, `--k-primary-hover`, `--k-on-primary-hover` and
  `--k-focus` (text 4.5:1, marks and focus 3:1 on bg, raised and sunken, light and dark; a colour that already passes is
  kept, otherwise only its OKLCH lightness moves) and reports `adjustments`, `checks` and `guaranteed`. `accentCss(hex)`
  writes one rule per standard theme (aliases included), so a later light/dark switch keeps the contrast;
  `installAccent` / `removeAccent` put it on the page (`<style id="kern-accent">`, optional `localStorage` copy and
  `theme-color` meta); `createAccentScript(key, { nonce })` is the head snippet that paints a stored accent before the first frame (it accepts only
  the exact shape `accentCss` writes: `--k-…: #rrggbb` declarations of the accent tokens, no `url()`, `content`, `display` or `@` rules);
  `installAccent` takes a CSP `nonce` too;
  `applyAccent(el, hex)` / `clearAccent(el)` set inline tokens on one element (surfaces read from its computed `--k-bg…`,
  so a custom theme works). Invalid input returns `{ ok: false, error }` (typed code), changes nothing and never throws;
  server-side the DOM functions return `no-dom`. Also `ACCENT_GROUNDS` (the surfaces of every `data-theme` value, kept in
  step with the theme CSS by a test), `ACCENT_TOKENS` and the types. `window.kern.accent` and the new entry
  `@mozra-the-great/kern/elements/accent` (no tag) expose the same functions in the elements build, typed.
- `@mozra-the-great/kern/themes/accent.css`: CSS-only accent fill (`data-k-accent` + `--k-accent-color` set `--k-accent` and a
  black or white `--k-on-accent`, at least 4.58:1 for every sRGB colour); text, mark, primary and focus need the JavaScript API.
- Demo section "Eigene Akzentfarbe". kern does not build a theme per brand: an app picks a standard theme and sets only the
  accent (there is no `nagellacke` or `nailvault` theme; docs/themes.md, "Eigene Akzentfarbe").

### Changed
- The **Code** theme reproduces stuffcloud's component look (#38): sentence-case Inter 600 15 px buttons with
  28 px padding and the ghost-style secondary button, JetBrains Mono 15 px fields on a transparent ground with
  muted labels and mono hints, a pink checkbox, transparent cards with 20 px padding, tabs as a strip of cells
  (selected cell raised, 600, accent underline, pink on hover), the design's dialog (page background, 32 px title,
  36/36/32 px padding; 28 px title and stacked actions below 760 px), a `line` progress track, 420 px toasts with
  green and amber edges, and a transparent drop zone with a mono prompt. The remaining differences are listed in
  docs/themes.md for approval.
- Code theme values now follow stuffcloud's `docs/design` where it and the design-system artifact disagreed (#37):
  `--k-border` (dark) `#6e6e78` → `#6c6c76` (`--field-border`), `--k-backdrop` (dark) `rgba(0,0,0,.6)` →
  `rgba(16,16,18,.55)` (the delete-site dialog), and the font stacks of `stuff.css` (`'Inter', system-ui, sans-serif`;
  `'JetBrains Mono', ui-monospace, monospace`; `'Silkscreen', monospace`). Same under the `stuffcloud` aliases.

## [0.7.0] - 2026-11-19

### Added
- `SortableList` and `<k-sortable-list>` (#68): an ordered list whose items have Up, Down and Remove buttons with the
  item name in their accessible name (`Move {name} up`; it contains the visible text, WCAG 2.5.3, English
  and German in the catalogue). The focus stays on the pressed button after a move, moves to its partner when
  that button is disabled at an end of the list, and after a removal goes to the next item. The list never
  reorders itself: `onmove(from, to)` / `onremove(index)` (element: `move` with `{ from, to }`, `remove` with
  `{ index }`, user input only), a host that applies the change later (a framework re-render) keeps the focus
  rules for up to 1.5 s. Props `items`, `key`, `itemLabel`, `label`, `upText`, `downText`, `removeText`,
  `upLabel`, `downLabel`, `removeLabel`, `removable`, `dragDrop` (dragging with the mouse is an extra) and an
  `item` snippet; the element reads `{ id, label, description? }` items. Announcing a move is the host's job
  with `announce()` (README, demo).
- `SelectGrid` and `<k-select-grid>` (#68): pictures as a multi-select `role="listbox"` (`aria-multiselectable`) with
  one Tab stop (roving tabindex), arrow keys by one place and by one row (columns measured from the layout,
  Left and Right swap in `dir="rtl"`), Home, End, PageUp, PageDown, Space and Enter toggle, Shift+arrow and
  Shift+Space extend, Ctrl/Cmd+A selects all, Esc clears, Alt+arrow reorders with `reorderable` (plus
  dragging); the selection shows as a check mark and heavier outline, not by colour alone, and in
  `forced-colors`. `bind:selected` / `onchange` (keys in the order of `items`; element: `selected` and `change`),
  `onmove(from, to)` (element: `move`), `key`, `itemLabel`, `min`, `caption`, `reorderHint`, an `item` snippet
  (picture, with the selected state) and `--k-select-grid-ratio`. The element reads `{ id, label, src?, description? }`.
  The focus returns to the Tab stop when the focused item goes away.
- `moveItem(items, from, to)` and the types `SortableItem`, `SelectGridItem` and `ItemKey`; catalogue entries
  `sortableList` and `selectGrid` with a complete German translation.
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
