# Testing

kern is tested on four levels, plus a check of the Svelte build path under a strict CSP. Each level has one job; a behaviour is tested where it can be observed
most cheaply and most truthfully.

| Level                        | Where                                                              | Command                                                          | Covers                                                                                   |
| ---------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Node (`node` project)        | `tests/tokens`, `tests/unit`, `tests/components`, `tests/mascot/*.test.ts` | `npm test`                                                | Theme contrast, brand isolation, pure logic, server-rendered markup (`svelte/server`)    |
| DOM (`dom` project)          | `tests/dom`                                                        | `npm test`                                                       | Component behaviour in jsdom: props, `bind:`, callbacks, keyboard, focus, ARIA, states   |
| Browser (Playwright)         | `tests/targets`, `tests/elements`, `tests/mascot/*.spec.ts`        | `npm run test:targets`, `test:elements`, `test:mascot` (after build) | Real layout and CSS: touch targets, 320 px reflow of the demo, overlays, axe, visual regression, custom elements    |
| Types and consumers          | `tests/fixtures`                                                   | `npm run test:types`, `npm run test:consumer`                    | Published typings, strict consumer, React 19                                              |
| Strict CSP (Playwright)      | `tests/csp`, `tests/fixtures/csp-app`                              | `npm run test:csp` (after build)                                 | Production Vite build of every Svelte component under `style-src 'self'`, no `'unsafe-inline'` ([#125](https://github.com/Mozra-the-great/kern/issues/125)) |

`npm test` runs both Vitest projects (`vitest.config.ts`). `npm run test:coverage` is the same run with the
v8 coverage provider over `src/lib/**/*.{ts,svelte}` (the themes are CSS and not measured).

## Coverage and the ratchet

```sh
npm run test:coverage      # text summary + per-file table in the terminal, coverage/lcov.info, coverage/coverage-summary.json
```

CI runs it in the `build` job (Node 22), prints the table in the log and uploads `coverage/` as the artifact
`coverage`. The floor is 95 % lines, functions, branches and statements (stage 2 of
[#24](https://github.com/Mozra-the-great/kern/issues/24)). The thresholds in `vitest.config.ts` are a **ratchet** above
that floor: the stage 2 coverage rounded down, so a PR that lowers coverage fails. Raise them whenever coverage grows;
never lower them to get green, and never exclude source files.

| Metric     | Stage 1 | Stage 2  | Threshold |
| ---------- | ------- | -------- | --------- |
| Statements | 65.63 % | 99.53 %  | 99        |
| Branches   | 48.51 % | 96.25 %  | 96        |
| Functions  | 67.45 % | 99.95 %  | 99        |
| Lines      | 63.99 % | 100 %    | 100       |

What the remaining branches are (about 200 of 5344, none excluded): Svelte compiles every interpolation in an
attribute or text (`class="k-x {cls}"`, `id="{uid}-opt"`, `style:left="{x}px"`) to `value ?? ''`, and that fallback
runs only for `null`, which typed props never pass; guards on `bind:this` elements that are always bound when the
effect runs (`if (!el) return`); and `$derived` values read only in the other branch of the template. Tests may pass
`null as unknown as string` for a `class` to check that an untyped (JavaScript or custom-element) caller gets no
`null` text; do not add casts to reach other compiler fallbacks.

Two things that change the numbers: a component that a node test renders with `svelte/server` (tests/components)
adds the branches of its server compile to the same file, so its server paths need markup tests too; and the text
reporter omits rows at 100 %, so read `coverage/coverage-summary.json` for per-file numbers.

## The DOM project

`tests/dom/setup.ts` loads `tests/dom/env.ts`, which gives jsdom the few platform APIs the components need:

- `<dialog>`: `show()`, `showModal()` (moves focus into the dialog like a browser), `close()` (the `close` event is
  queued, like the platform's) and Escape on a modal dialog, which fires the cancelable `cancel` event first.
- `matchMedia` (`setMedia(query, matches)` changes an answer), `IntersectionObserver`
  (`triggerIntersection(element, visible)`), `ResizeObserver`, `scrollTo`, `scrollIntoView`, pointer capture.

Rules that keep the tests honest:

- Test what a user or assistive technology perceives: roles and accessible names (`getByRole`), `aria-*`
  attributes, focus (`document.activeElement`), the values a callback receives. CSS classes only where the
  component itself sets them as a state (`.invalid`, `.dragging`, `data-motion`).
- Keyboard through `@testing-library/user-event` (`user.tab()`, `user.keyboard('{ArrowRight}')`).
- A prop named like a Svelte mount option (`target`, `props`, `context`, `events`, `anchor`, `intro`) must go
  under `render(Component, { props: { ... } })`.
- **Bindable values**: `reactive()` from `tests/dom/reactive.svelte.ts` returns a `$state` object. Mount the
  component with it as `props`; a `bind:` write of the component lands on the object, and assigning to the object
  re-renders the component. Only keys present on the object receive `bind:` writes, so list every bindable key,
  even as `undefined`.
- `fireEvent` from `@testing-library/svelte` returns a Promise; import it from `@testing-library/dom` when the test
  needs the synchronous `defaultPrevented` result.
- Snippets: `textSnippet()`, `mapSnippet()` and `mapSnippet2()` in `tests/dom/helpers.ts`.
- Timers: use `vi.useFakeTimers()` and `userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) })`.
  After the code under test queued a task, `await flush()` before asserting that something did not happen.
- jsdom does not load component styles and has no layout. Whatever depends on them (sizes, positions, what is
  visually hidden, `scrollWidth`) is either stubbed with `vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get')`
  or tested in the Playwright suites.

Every component and shared module has behaviour tests: `tests/dom/<component>.test.ts` (several small display
components share `tests/dom/display.test.ts`; harness components live in `tests/dom/harness/`), and DOM-free modules
(`color.ts`, `data-utils.ts`, `theme.ts`, ...) in `tests/unit`. Stand-ins a single file needs (layout via
`getBoundingClientRect` / `clientWidth`, a recording `ResizeObserver`, `navigator.clipboard`) are set up and restored
inside that file, not in `env.ts`.

### Smoke test of every export

`tests/dom/smoke.test.ts` iterates the exports of `src/lib/index.ts` that are components. Each needs an entry in
the `SMOKE` table with minimal props, a root selector and, where the component must be named for assistive
technology, a role and an accessible name. It checks: renders, the root exists, the role and name are found,
nothing is written to `console.error` or `console.warn` (Svelte reports its warnings there), and it unmounts.
`every export has an entry, and every entry an export` fails when a component is added or removed without
touching the table.

## Strict CSP

[#125](https://github.com/Mozra-the-great/kern/issues/125), in the `build` job (`npm run test:csp`). `tests/fixtures/csp-app` is a
Vite app that imports the built package and mounts every exported component in a `data-csp-case` section;
`npm run build:csp-app` builds it into `dist/` and, with `--mode canary`, into `dist-canary/` with a static
`style="outline: 0"` injected into Badge's template. `tests/csp/server.mjs` serves both under the policy of
`tests/csp/policy.mjs` (the one the consumer guide documents), with the theme-script hash from `themeScriptHash()` of the
built package. `tests/csp/csp.spec.ts`:

- asserts that the policy block of the consumer guide is the tested policy, and the served policy word for word with no `'unsafe-inline'`, `'unsafe-eval'`, `data:` or `*`;
- checks that the hashed theme script runs (stored theme, system dark and light);
- in each of the eight theme variants renders the page and runs every entry of `CASES` (overlays, pickers, menus, toasts,
  tooltips, drag and keyboard interactions that set inline styles), failing on any `securitypolicyviolation` event, any
  console message about the policy and any page error;
- coverage guard: `CASES` must have exactly one entry per component export (`'static'` or an interaction), and the
  fixture must mount each export in its own section;
- canary: on `/canary/` the same check reports the `style-src-attr` violation of Badge, so it cannot pass by looking at
  nothing.

Adding a component: mount it in `tests/fixtures/csp-app/src/App.svelte` inside `<section data-csp-case="Name">` and give
it a `CASES` entry; one that opens something gets a function that opens it, asserts it is visible and closes it.

## The accessibility suite

[#25](https://github.com/Mozra-the-great/kern/issues/25). It runs in Chromium as part of `npm run test:elements`, which
is the required `build` job. Every check goes over **every custom element** (and so every component) in the eight
theme variants of `THEMES` in `tests/elements/a11y-shared.ts`: `code`, `code-light`, `flower`, `flower-wald`, `pop`,
`pop-dark`, `line`, `line-light`. Forced colors is [#27](https://github.com/Mozra-the-great/kern/issues/27)
(`forced-colors.spec.ts`) and is not repeated here.

The page behind the matrix is `tests/elements/pages/forced-colors.html`: it holds every element (`ALL` in
`a11y-shared.ts`). The open states (`STATES`: modal, drawer, a drawer, a modal and a popover with long text only, a resizable with long text, a table and a data table wider than their box, command palette, popover, dropdown menu, context menu,
combobox, tag input, date picker, colour picker, toaster, tooltip, invalid fields, sorted and selected data table, the
phone menu of the navbar) put it in the state an overlay or error shows. axe fails on `serious` and `critical` findings
and, whatever its rating, on `scrollable-region-focusable` (rated `moderate`, a WCAG 2.1.1 failure: a box that scrolls and
holds nothing the keyboard can focus, [#132](https://github.com/Mozra-the-great/kern/issues/132)). On
`tests/elements/pages/landmarks.html` (an app shell with its own header, main and footer, and the open modal, the open drawer
and a `div` card at the top level of the body) every `landmark-*` rule fails as well, whatever its rating: the duplicate
banner is `moderate`, and it is what the `<header>` of an overlay used to cause ([#154](https://github.com/Mozra-the-great/kern/issues/154)).

| Spec                              | Checks                                                                                                                                                                         | Matrix                                        |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------- |
| `a11y-matrix.spec.ts`             | axe (serious and critical fail) on the all-elements page, closed and in every open state; coverage test: the page has every element, every overlay has a state; canaries that axe finds a violation (also a second banner and contentinfo); `landmarks.html`: every `landmark-*` rule fails (closed with card, modal open, drawer open) | 8 themes x (1 page + 21 states + 3 landmark states) |
| `a11y.spec.ts`                    | axe on the other pages (parity, feedback, form, navigation, reorder, download, strings, primitives and their states)                                                           | 8 themes x 11 cases                           |
| `a11y-keyboard.spec.ts`           | tab order of the whole page: a computed focus ring on every stop, no loop, every control of `REACHABLE` reached; ring after Tab and none after a mouse click; coverage table `KEYBOARD` | 8 themes (tab order), 1 (the rest)            |
| `a11y-keys.spec.ts`               | each interactive element with the keys of its WAI-ARIA pattern, no mouse                                                                                                       | one test per element (Code)                   |
| `a11y-overlays.spec.ts`           | modal dialogs (focus in, Tab trapped, Escape closes, focus back on the opener) and every other overlay (Escape closes, focus back, Tab leaves); a drawer and a modal whose scrolling body holds only text, and a popover whose scrolling panel does: Tab reaches it, it has a ring, PageDown and the arrows scroll it, no extra stop otherwise | one test per overlay (Code), 8 themes x 2 (scrolling body) |
| `a11y-scroll-regions.spec.ts`     | a `k-resizable` panel or a `k-table` / `k-data-table` wrapper that scrolls and holds only text ([#137](https://github.com/Mozra-the-great/kern/issues/137)): Tab reaches it, it has a name and a ring in `--k-focus`, the arrows and PageDown scroll it, Tab goes on to the next control; no stop with a sortable header, a checkbox or a button, nor for the stacked cards of a phone | 8 themes x 3 boxes (1280 px), 3 single tests (Code) |
| `a11y-tab-strip.spec.ts`          | the strip of `k-tabs` / `k-tab-links` ([#153](https://github.com/Mozra-the-great/kern/issues/153)), both looks, short and sideways scrolling, 1280 / 375 / 320 px: `scrollHeight <= clientHeight` (also for every other sideways scroller of the page), Tab from a button before it lands on the first tab / each link with no stop for the strip itself, Shift+Tab walks back, the focus ring lies inside the strip; a strip with more tabs than fit scrolls sideways on a phone and fades its end edge, the pill look too ([#159](https://github.com/Mozra-the-great/kern/issues/159)). **Also runs in Firefox** (project `firefox` of the elements config, `npx playwright install firefox`): Firefox makes a scroll container a Tab stop, Chromium does not |
| `a11y-motion.spec.ts`             | reduced motion: no running animation or transition longer than a frame (`getAnimations()` on the document and every shadow root), no smooth scrolling, effects at their end state | 8 themes x 12 pages, 2 themes x 21 states, 8 themes x an interaction run |
| `a11y-reflow.spec.ts`             | 320 x 640: no horizontal page scroll, no control cut off by a container or the screen; a long or unbreakable `<k-button>` label wraps inside a 200 px box ([#121](https://github.com/Mozra-the-great/kern/issues/121)); a pill `<k-tabs>` strip with 40 tabs scrolls inside its container instead of widening the page ([#159](https://github.com/Mozra-the-great/kern/issues/159), reproduces in Firefox only, so that test also runs in the `firefox-reflow` project) | 8 themes x (12 pages + 21 states + 1 label + 3 widths)   |
| `hit-target.spec.ts`              | `<k-checkbox>`, `<k-switch>` and `<k-radio-group>` ([#150](https://github.com/Mozra-the-great/kern/issues/150)): the row-wide `label::after` must not cover the box. `shadowRoot.elementFromPoint` at the centre and inside the edges is the `<input>`, `check()` / `uncheck()` work without `force`, the focused control is not obscured (WCAG 2.4.11), a click on the label text or at the far end of the row still toggles; a canary without the stacking fails. The same probes run on the Svelte demo in `tests/targets/hit-target.spec.ts` (`tests/shared/hit-target.ts`) | 8 themes x 2 (normal, forced colors) x 4 + 1 canary |
| `modal-footer.spec.ts`            | `<k-button>` in the `<k-modal>` footer ([#120](https://github.com/Mozra-the-great/kern/issues/120)): stacked below 520 px (Code up to 760 px) the host and the button fill the row, in a row footer they keep their width | 8 themes x 3 widths                           |

The demo itself has a reflow guard of its own ([#116](https://github.com/Mozra-the-great/kern/issues/116)):
`tests/targets/reflow.spec.ts` asserts `document.documentElement.scrollWidth <= window.innerWidth` at 320 x 640 on the
built `index.html` and `elements.html` in the same eight variants (it runs with `npm run test:targets`, in the `build`
job). The page-level check of `a11y-reflow.spec.ts` covers the components; this one covers the layout around them (a
long button label, unbreakable code in a paragraph, a grid track that grows with its content).

Coverage guards, so a new element cannot slip through: `a11y-matrix.spec.ts` fails when `forced-colors.html` lacks an
element of `custom-elements.json` or an overlay has no open state; `a11y-keyboard.spec.ts` fails when `KEYBOARD` (one
entry per element: `keys`, `overlays` or `static` with a reason) differs from the manifest, an entry names a test that
does not exist, or an element marked `static` renders a control. Every check also has a canary test that makes it fail
on a deliberate violation (a missing label, a missing ring, a running animation, a clipped button), so none of them can
pass because it looks at nothing.

Adding an element: put it on `forced-colors.html` (also needed by #27), give it an entry in `KEYBOARD` and, if it
is interactive, a test in `a11y-keys.spec.ts` or `a11y-overlays.spec.ts` that names its tag in the title, add it to
`REACHABLE` when it has a tab stop on the page, and add a `STATES` entry when it needs a state to show its main part.

Rules the checks encode:

- **Focus ring**: after keyboard focus the focused element, a wrapper with the focus within, a part inside it or a
  neighbour in the same component has a visible outline (or a box-shadow or border that differs from the blurred state).
  A ring that only the mouse shows does not count; `:focus-visible` must match after Tab.
- **Modal dialogs** are the one keyboard trap. The native dialog makes the page behind inert, so after the last control
  Tab passes through the browser's own UI; the focus must never land on the page behind.
- **Reduced motion**: the only running animation allowed is the rotation of `Spinner` and of the loading mark of
  `Button`, slowed to 2 s per turn (WCAG 2.3.3, essential: a standing loading indicator says nothing). Everything
  else, including transitions started by hover, focus and operation, must be 20 ms or shorter.
- **Reflow**: a control inside a container that scrolls on purpose (table, code, carousel track) counts as reachable;
  inside `overflow: hidden` or beyond the screen it counts as cut off. Boxes of 1-2 px (text for assistive technology)
  are ignored.

Not automated, because it needs people and assistive technology: screen reader output (NVDA, JAWS, VoiceOver), 200 %
text size and text spacing, magnifier use, voice control, and the quality of the texts an app passes in.

Firefox: CI also runs `a11y-tab-strip.spec.ts` in Firefox (the `firefox` project of the elements config, #153) and the pill-strip
test of `a11y-reflow.spec.ts` (the `firefox-reflow` project, #159); CI installs Firefox. The hit-target specs also pass in Firefox, run by hand: `npx playwright install firefox`, then
`KERN_FIREFOX=1 npx playwright test -c tests/elements/playwright.config.ts --project=firefox` (and
`-c tests/targets` for the demo). In the elements config the `firefox` project always exists and `KERN_FIREFOX` adds
`hit-target.spec.ts` to it; in `tests/targets` the project exists only with `KERN_FIREFOX`.

Run one spec while working: `npm run build`, then
`npx playwright test -c tests/elements/playwright.config.ts a11y-keys` (add `-g "k-tabs"` for one test, `KERN_TEST_PORT`
if the default port 4791 is busy). A new spec must pass `--repeat-each=3 --retries=0 --workers=2` before it is merged.

A test that waits for a Playwright event which the page only triggers once must not start the wait right before the
action. `page.waitForEvent('filechooser')` (and `page.on('filechooser')`) enable the file chooser interception in the
browser with a fire-and-forget message, so a chooser opened by a key press right after it is sometimes a real one that
nobody sees and the wait times out ([#138](https://github.com/Mozra-the-great/kern/issues/138), up to every second run of
the k-file-drop test). `watchFileChoosers` in `a11y-keys.spec.ts` registers the listener first and opens a throwaway
file input until a chooser arrives, so the key press that follows cannot be missed. Check such a test with
`--repeat-each=100 --workers=4`; never "fix" it with a longer timeout or a retry.

## stuffcloud mapping

stuffcloud (`web/apps/web/tests/`) may remove a local copy of a component only when the kit covers the same
behaviour ([stuffcloud#121](https://github.com/Mozra-the-great/stuffcloud/issues/121)). This table maps each of the
test files named in [#24](https://github.com/Mozra-the-great/kern/issues/24) to the kern tests.

| stuffcloud test       | kern test                                                                                                                                                      | Notes                                                                                                                                                                                                                                  |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `buttons.test.ts`     | `tests/dom/buttons.test.ts` (Button, IconButton, Link); `tests/components/forms-content.test.ts` (markup)                                                      | stuffcloud's `LinkButton` is `<Button href>` in kern (disabled link, download, rel/target also covered). `buttonClasses` and `button.css` cases do not port: kern styles through data attributes and tokens (`tests/tokens`, `tests/targets`). |
| `fields.test.ts`      | `tests/dom/fields.test.ts` (Field, Input, Textarea, Select, Checkbox, Switch, RadioGroup); `tests/components/forms-content.test.ts`                              | `hasText` / `describedBy` are `joinIds` (`tests/components`). By design kern hides the hint while an error shows (`keepHint` keeps both) and announces the error as `role="alert"` (`announce={false}` turns that off; every Field-based component forwards it).                                                    |
| `dialog.test.ts`      | `tests/dom/modal.test.ts` (Modal and Drawer, same cases for both)                                                                                              | Adds Escape and `oncancel` veto, `dismissible`, `initialFocus`, scroll lock, `alert`, description. `dismissOnBackdrop` is `closeOnBackdrop`.                                                                                           |
| `dropzone.test.ts`    | `tests/dom/filedrop.test.ts`; `tests/components/forms-content.test.ts` (`matchesAccept`, `splitFiles`)                                                          | All cases ported, for both layouts (zone button and `buttonLabel`) and both modes (`field`, `dispatch`); adds the file list, remove with focus return, `maxSize`, messages, `reset()`.                                                  |
| `progress-code.test.ts` | `tests/dom/progress.test.ts` (Progress, ProgressRing), `tests/dom/code.test.ts` (Code, CodeBlock, CopyButton); `tests/unit/progress.test.ts` (`normaliseMax`, `progressPercent`) | The stylesheet cases (transform-only animation, reduced motion, forced colours) are CSS assertions: `tests/unit/progress.test.ts` and the Playwright suites. kern names the code box as a focusable region only while it scrolls.        |
| `tabs-cards.test.ts`  | `tests/dom/tabs.test.ts` (Tabs, TabLinks, badges), `tests/dom/cards.test.ts` (Card, Tile, TileGrid)                                                             | kern's Card is an `article` by default and can be a link or a button; its `tag` prop is `as`.                                                                                                                                          |
| `tabs-nav.test.ts`    | `tests/dom/tabs.test.ts` (arrow keys, wrap, Home/End, other keys ignored, single tab)                                                                           | `nextTabIndex` is internal to `Tabs.svelte`; the same cases run through the keyboard.                                                                                                                                                  |
| `toast.test.ts`       | `tests/dom/toast.test.ts` (Toaster, `toast()`); `tests/unit/toast-queue.test.ts` (the queue: durations, pause/resume, limit, clear)                              | `Toaster` class = `createToastQueue()`, `ToastRegion` = `<Toaster>`. Adds undo/commit/action, tone routing, hidden-tab pause and focus return.                                                                                         |
| `mascot.test.ts`      | `tests/dom/mascot.test.ts` (markup for every name and alias, labelled and decorative, scale, motion state); `tests/mascot/mascot.spec.ts` (built `<k-mascot>` under a strict CSP; every name and alias loads its SVG; reduced motion) | Stylesheet cases run against the real CSS in the Playwright suite.                                                                                                                                                                     |
| `mascots.test.ts`     | `tests/mascot/mascots.test.ts` (catalogue, name mapping, roles, aliases, integer scaling)                                                                       | Aliases and roles are kern additions (#183); `npm run assets:check` also fails when a file in `mascots/` has no name.                                                                                                                                                                                                                   |
| `contrast.test.ts`    | `tests/tokens/contrast.test.ts` (+ `theme-css.ts`), `tests/unit/accent.test.ts`                                                                                  | Reads the shipped theme CSS for every `data-theme` variant: text 4.5:1, borders, focus and accent marks 3:1.                                                                                                                           |
| `tokens.test.ts`      | `tests/tokens/theme-entries.test.ts`, `tests/tokens/theme-alias.test.ts`, `tests/unit/code-theme-source.test.ts` (+ `npm run tokens:check`)                       | stuffcloud generated `tokens.css` from its design stylesheet (stuffcloud#199 replaces that with kern's `--k-*` tokens); kern generates `brands/code.css` from `code.tokens.json` and checks it against the frozen reference snapshot.                                                                                        |
| `fonts.test.ts`       | not applicable                                                                                                                                                 | kern ships no font files; themes only name font stacks in `--k-font-*`. Fonts stay in the consumer.                                                                                                                                    |
| `gallery.test.ts`     | `tests/targets/targets.spec.ts` (every control of the demo), `tests/elements/a11y.spec.ts` (axe over the demo pages), `tests/dom/smoke.test.ts`                  | stuffcloud's gallery is its own page; kern's counterpart is the demo plus the per-export smoke test.                                                                                                                                  |
| `pdf-ui.test.ts` (`ReorderList`) | `tests/dom/sortablelist.test.ts` (buttons, focus after move and removal, dragging, emptied and refilled); `tests/unit/reorder.test.ts` (`moveItem`, item fields) | stuffcloud's `ReorderList` is `SortableList` in kern; the list does not reorder by itself, the host applies `onmove`/`onremove` (with `moveItem`). |
| `pdf-ui.test.ts` (grid navigation, `grid-nav.ts`) | `tests/unit/reorder.test.ts` ("grid navigation": `isNavKey`, `nextIndex`, `moveStep`, `between`, `columnsOf`) | The pure helpers of `grid-nav.ts` live in kern's `reorder.ts`; the keyboard cases also run through `SelectGrid` in `tests/dom/selectgrid.test.ts`. |
| `pdf-ui.test.ts` (`PageGrid`) | `tests/dom/selectgrid.test.ts` (selection with click, Shift and keys, Ctrl+A, Escape, arrow/Home/End/Page keys, right-to-left, reorderable with Alt+arrow and drag, emptied and refilled) | `PageGrid` is `SelectGrid` in kern. The transition to an empty grid (all pages deleted) is covered since #175. |
| `ToolStatus` | `tests/dom/status-message.test.ts` (`tone`, `kind`, live region kept on change); `tests/components/forms-content.test.ts` (empty status region from the first paint, `kind="alert"`) | `ToolStatus` is `StatusMessage` in kern; `tone="ok"` is the success colour of a result line (#173). |
| `Sticker` | `tests/dom/mascot.test.ts` (markup, scale, motion state); `tests/mascot/mascots.test.ts` (the `tool-stickers/*` names); `tests/mascot/mascot.spec.ts` | A sticker is `Mascot` with a name from the Code art (`tool-stickers/sticker-qr`). |
