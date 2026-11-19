# Testing

kern is tested on four levels. Each level has one job; a behaviour is tested where it can be observed
most cheaply and most truthfully.

| Level                        | Where                                                              | Command                                                          | Covers                                                                                   |
| ---------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Node (`node` project)        | `tests/tokens`, `tests/unit`, `tests/components`, `tests/mascot/*.test.ts` | `npm test`                                                | Theme contrast, brand isolation, pure logic, server-rendered markup (`svelte/server`)    |
| DOM (`dom` project)          | `tests/dom`                                                        | `npm test`                                                       | Component behaviour in jsdom: props, `bind:`, callbacks, keyboard, focus, ARIA, states   |
| Browser (Playwright)         | `tests/targets`, `tests/elements`, `tests/mascot/*.spec.ts`        | `npm run test:targets`, `test:elements`, `test:mascot` (after build) | Real layout and CSS: touch targets, overlays, axe, visual regression, custom elements    |
| Types and consumers          | `tests/fixtures`                                                   | `npm run test:types`, `npm run test:consumer`                    | Published typings, strict consumer, React 19                                              |

`npm test` runs both Vitest projects (`vitest.config.ts`). `npm run test:coverage` is the same run with the
v8 coverage provider over `src/lib/**/*.{ts,svelte}` (the themes are CSS and not measured).

## Coverage and the ratchet

```sh
npm run test:coverage      # text summary + per-file table in the terminal, coverage/lcov.info, coverage/coverage-summary.json
```

CI runs it in the `build` job (Node 22), prints the table in the log and uploads `coverage/` as the artifact
`coverage`. The thresholds in `vitest.config.ts` are a **ratchet**: the stage 1 coverage rounded down, so a PR
that lowers coverage fails. Raise them whenever coverage grows; never lower them to get green. The goal is 95 %
lines, functions, branches and statements, raised in stage 2 of
[#24](https://github.com/Mozra-the-great/kern/issues/24).

Stage 1 numbers (node and dom projects together):

| Metric     | Covered       | Threshold |
| ---------- | ------------- | --------- |
| Statements | 65.63 %       | 65        |
| Branches   | 48.51 %       | 48        |
| Functions  | 67.45 %       | 67        |
| Lines      | 63.99 %       | 63        |

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
  re-renders the component.
- Snippets: `textSnippet()`, `mapSnippet()` and `mapSnippet2()` in `tests/dom/helpers.ts`.
- Timers: use `vi.useFakeTimers()` and `userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) })`.
  After the code under test queued a task, `await flush()` before asserting that something did not happen.
- jsdom does not load component styles and has no layout. Whatever depends on them (sizes, positions, what is
  visually hidden, `scrollWidth`) is either stubbed with `vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get')`
  or tested in the Playwright suites.

### Smoke test of every export

`tests/dom/smoke.test.ts` iterates the exports of `src/lib/index.ts` that are components. Each needs an entry in
the `SMOKE` table with minimal props, a root selector and, where the component must be named for assistive
technology, a role and an accessible name. It checks: renders, the root exists, the role and name are found,
nothing is written to `console.error` or `console.warn` (Svelte reports its warnings there), and it unmounts.
`every export has an entry, and every entry an export` fails when a component is added or removed without
touching the table.

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

## Stage 2 (open)

Stage 1 stops at the stuffcloud base components. To reach the 95 % floor, stage 2 needs behaviour tests for the
components that only have a smoke test today (largest gaps first): Popover, DropdownMenu, ContextMenu, Combobox,
DatePicker, ColorPicker, TagInput, PinInput, NumberInput, TreeView, CommandPalette, SelectGrid, SortableList,
Carousel, Terminal, DataTable, Table, Stat, Resizable, Rating, SkipLink, ThemeToggle, and the shared modules
`anchor.ts`, `color.ts`, `data-utils.ts`, `theme.ts`. Then the thresholds in `vitest.config.ts` go to 95.
