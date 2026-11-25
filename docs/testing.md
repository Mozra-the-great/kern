# Testing

kern is tested on four levels. Each level has one job; a behaviour is tested where it can be observed
most cheaply and most truthfully.

| Level                        | Where                                                              | Command                                                          | Covers                                                                                   |
| ---------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Node (`node` project)        | `tests/tokens`, `tests/unit`, `tests/components`, `tests/mascot/*.test.ts` | `npm test`                                                | Theme contrast, brand isolation, pure logic, server-rendered markup (`svelte/server`)    |
| DOM (`dom` project)          | `tests/dom`                                                        | `npm test`                                                       | Component behaviour in jsdom: props, `bind:`, callbacks, keyboard, focus, ARIA, states   |
| Browser (Playwright)         | `tests/targets`, `tests/elements`, `tests/mascot/*.spec.ts`        | `npm run test:targets`, `test:elements`, `test:mascot` (after build) | Real layout and CSS: touch targets, 320 px reflow of the demo, overlays, axe, visual regression, custom elements    |
| Types and consumers          | `tests/fixtures`                                                   | `npm run test:types`, `npm run test:consumer`                    | Published typings, strict consumer, React 19                                              |

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

## The accessibility suite

[#25](https://github.com/Mozra-the-great/kern/issues/25). It runs in Chromium as part of `npm run test:elements`, which
is the required `build` job. Every check goes over **every custom element** (and so every component) in the eight
theme variants of `THEMES` in `tests/elements/a11y-shared.ts`: `code`, `code-light`, `flower`, `flower-wald`, `pop`,
`pop-dark`, `line`, `line-light`. Forced colors is [#27](https://github.com/Mozra-the-great/kern/issues/27)
(`forced-colors.spec.ts`) and is not repeated here.

The page behind the matrix is `tests/elements/pages/forced-colors.html`: it holds every element (`ALL` in
`a11y-shared.ts`). The open states (`STATES`: modal, drawer, command palette, popover, dropdown menu, context menu,
combobox, tag input, date picker, colour picker, toaster, tooltip, invalid fields, sorted and selected data table, the
phone menu of the navbar) put it in the state an overlay or error shows.

| Spec                              | Checks                                                                                                                                                                         | Matrix                                        |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------- |
| `a11y-matrix.spec.ts`             | axe (serious and critical fail) on the all-elements page, closed and in every open state; coverage test: the page has every element, every overlay has a state; a canary that axe finds a violation | 8 themes x (1 page + 15 states)               |
| `a11y.spec.ts`                    | axe on the other pages (parity, feedback, form, navigation, reorder, download, strings, primitives and their states)                                                           | 8 themes x 11 cases                           |
| `a11y-keyboard.spec.ts`           | tab order of the whole page: a computed focus ring on every stop, no loop, every control of `REACHABLE` reached; ring after Tab and none after a mouse click; coverage table `KEYBOARD` | 8 themes (tab order), 1 (the rest)            |
| `a11y-keys.spec.ts`               | each interactive element with the keys of its WAI-ARIA pattern, no mouse                                                                                                       | one test per element (Code)                   |
| `a11y-overlays.spec.ts`           | modal dialogs (focus in, Tab trapped, Escape closes, focus back on the opener) and every other overlay (Escape closes, focus back, Tab leaves)                                 | one test per overlay (Code)                   |
| `a11y-motion.spec.ts`             | reduced motion: no running animation or transition longer than a frame (`getAnimations()` on the document and every shadow root), no smooth scrolling, effects at their end state | 8 themes x 12 pages, 2 themes x 15 states, 8 themes x an interaction run |
| `a11y-reflow.spec.ts`             | 320 x 640: no horizontal page scroll, no control cut off by a container or the screen                                                                                          | 8 themes x (12 pages + 15 states)             |

The demo itself has a reflow guard of its own ([#116](https://github.com/Mozra-the-great/kern/issues/116)):
`tests/targets/reflow.spec.ts` asserts `document.documentElement.scrollWidth <= window.innerWidth` at 320 x 640 on the
built `index.html` and `elements.html` in the same eight variants (it runs with `npm run test:targets`, in the `build`
job). The page-level check of `a11y-reflow.spec.ts` covers the components; this one covers the layout around them (a
long label on a `nowrap` button, unbreakable code in a paragraph, a grid track that grows with its content).

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

Run one spec while working: `npm run build`, then
`npx playwright test -c tests/elements/playwright.config.ts a11y-keys` (add `-g "k-tabs"` for one test, `KERN_TEST_PORT`
if the default port 4791 is busy). A new spec must pass `--repeat-each=3 --retries=0 --workers=2` before it is merged.

## stuffcloud mapping

stuffcloud (`web/apps/web/tests/`) may remove a local copy of a component only when the kit covers the same
behaviour ([stuffcloud#121](https://github.com/Mozra-the-great/stuffcloud/issues/121)). This table maps each of the
test files named in [#24](https://github.com/Mozra-the-great/kern/issues/24) to the kern tests.

| stuffcloud test       | kern test                                                                                                                                                      | Notes                                                                                                                                                                                                                                  |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `buttons.test.ts`     | `tests/dom/buttons.test.ts` (Button, IconButton, Link); `tests/components/forms-content.test.ts` (markup)                                                      | stuffcloud's `LinkButton` is `<Button href>` in kern (disabled link, download, rel/target also covered). `buttonClasses` and `button.css` cases do not port: kern styles through data attributes and tokens (`tests/tokens`, `tests/targets`). |
| `fields.test.ts`      | `tests/dom/fields.test.ts` (Field, Input, Textarea, Select, Checkbox, Switch, RadioGroup); `tests/components/forms-content.test.ts`                              | `hasText` / `describedBy` are `joinIds` (`tests/components`). By design kern hides the hint while an error shows (`keepHint` keeps both) and announces the error as `role="alert"`.                                                    |
| `dialog.test.ts`      | `tests/dom/modal.test.ts` (Modal and Drawer, same cases for both)                                                                                              | Adds Escape and `oncancel` veto, `dismissible`, `initialFocus`, scroll lock, `alert`, description. `dismissOnBackdrop` is `closeOnBackdrop`.                                                                                           |
| `dropzone.test.ts`    | `tests/dom/filedrop.test.ts`; `tests/components/forms-content.test.ts` (`matchesAccept`, `splitFiles`)                                                          | All cases ported, for both layouts (zone button and `buttonLabel`) and both modes (`field`, `dispatch`); adds the file list, remove with focus return, `maxSize`, messages, `reset()`.                                                  |
| `progress-code.test.ts` | `tests/dom/progress.test.ts` (Progress, ProgressRing), `tests/dom/code.test.ts` (Code, CodeBlock, CopyButton); `tests/unit/progress.test.ts` (`normaliseMax`, `progressPercent`) | The stylesheet cases (transform-only animation, reduced motion, forced colours) are CSS assertions: `tests/unit/progress.test.ts` and the Playwright suites. kern names the code box as a focusable region only while it scrolls.        |
| `tabs-cards.test.ts`  | `tests/dom/tabs.test.ts` (Tabs, TabLinks, badges), `tests/dom/cards.test.ts` (Card, Tile, TileGrid)                                                             | kern's Card is an `article` by default and can be a link or a button; its `tag` prop is `as`.                                                                                                                                          |
| `tabs-nav.test.ts`    | `tests/dom/tabs.test.ts` (arrow keys, wrap, Home/End, other keys ignored, single tab)                                                                           | `nextTabIndex` is internal to `Tabs.svelte`; the same cases run through the keyboard.                                                                                                                                                  |
| `toast.test.ts`       | `tests/dom/toast.test.ts` (Toaster, `toast()`); `tests/unit/toast-queue.test.ts` (the queue: durations, pause/resume, limit, clear)                              | `Toaster` class = `createToastQueue()`, `ToastRegion` = `<Toaster>`. Adds undo/commit/action, tone routing, hidden-tab pause and focus return.                                                                                         |
| `mascot.test.ts`      | `tests/dom/mascot.test.ts` (markup, scale, motion state); `tests/mascot/mascot.spec.ts` (built `<k-mascot>` under a strict CSP)                                  | Stylesheet cases run against the real CSS in the Playwright suite.                                                                                                                                                                     |
| `mascots.test.ts`     | `tests/mascot/mascots.test.ts` (catalogue, name mapping, integer scaling)                                                                                       | Existing; unchanged.                                                                                                                                                                                                                   |
| `contrast.test.ts`    | `tests/tokens/contrast.test.ts` (+ `theme-css.ts`), `tests/unit/accent.test.ts`                                                                                  | Reads the shipped theme CSS for every `data-theme` variant: text 4.5:1, borders, focus and accent marks 3:1.                                                                                                                           |
| `tokens.test.ts`      | `tests/tokens/theme-entries.test.ts`, `tests/tokens/theme-alias.test.ts`, `tests/unit/code-theme-source.test.ts` (+ `npm run tokens:check`)                       | stuffcloud generates `tokens.css` from its design stylesheet; kern generates `brands/code.css` from `code.tokens.json` and checks the snapshot.                                                                                        |
| `fonts.test.ts`       | not applicable                                                                                                                                                 | kern ships no font files; themes only name font stacks in `--k-font-*`. Fonts stay in the consumer.                                                                                                                                    |
| `gallery.test.ts`     | `tests/targets/targets.spec.ts` (every control of the demo), `tests/elements/a11y.spec.ts` (axe over the demo pages), `tests/dom/smoke.test.ts`                  | stuffcloud's gallery is its own page; kern's counterpart is the demo plus the per-export smoke test.                                                                                                                                  |
