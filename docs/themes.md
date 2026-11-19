# Theme tokens

Every component reads only `--k-*` variables. `src/lib/themes/base.css` defines all of them
with neutral values; a brand file under `src/lib/themes/brands/` overrides what its design
differs in. Derived tokens (`--k-accent-mark`, `--k-line-strong`, `--k-surface-*`, ...) point at
another token by default, so a theme only sets them when its design has its own value.

## stuffcloud variables and their kern tokens (theme `code`)

Source: stuffcloud's `docs/design/prototypes/stuff.css` and mockups, the app's `web/apps/web/src/styles/theme.css`
(named literals of the mockups) and, for light, paper and contrast, the stuffcloud design system artifact
(`tokens.json`). The design is the kern theme `code` (called `stuffcloud` until #85; the old `data-theme` values
stay as aliases until 1.0). Values are for `data-theme="code"` (= `code-dark`). The complete, machine-readable
list with the source of every value is `src/lib/themes/code.tokens.json` (next section).

| stuffcloud | value | kern token | kern value | note |
| --- | --- | --- | --- | --- |
| `--bg` / surface | `#101012` | `--k-bg` | `#101012` | |
| surface-raised | `#17171a` | `--k-bg-raised` | `#17171a` | |
| surface-code | `#0c0c0e` | `--k-bg-code`, `--k-bg-sunken` | `#0c0c0e` | |
| ink / `--fg` | `#f4f4f0` | `--k-fg`, `--k-primary`, `--k-focus` | `#f4f4f0` | |
| ink-muted | `#a2a2ab` | `--k-fg-muted` | `#a2a2ab` | |
| `--fg-soft` | `#d8d8de` | `--k-fg-soft` | `#d8d8de` | long copy; no component reads it |
| `--fg-hint` | `#c7c7cf` | `--k-fg-hint` | `#c7c7cf` | Field hint, FileDrop icon |
| `--fg-code` | `#e8e8ee` | `--k-fg-code` | `#e8e8ee` | Code |
| `--fg-disabled` | `#6a6a74` | `--k-fg-disabled` | `#6a6a74` | disabled menu items and options |
| line | `#26262b` | `--k-line` | `#26262b` | dividers |
| `--line2` | `#3a3a42` | `--k-line-strong` | `#3a3a42` | Card, Modal, Drawer, Toast, Popover, menus |
| `--field-border` | `#6c6c76` | `--k-border` | `#6c6c76` | the design-system artifact's border-control is `#6e6e78`; docs/design wins (#37) |
| `--line-drop` | `#6b5a8f` | `--k-line-dashed` | `#6b5a8f` | FileDrop edge |
| accent | `#ff79b0` | `--k-accent`, `--k-accent-mark`, `--k-accent-text`, `--k-primary-hover` | `#ff79b0` | |
| on-accent | `#101012` | `--k-on-accent`, `--k-on-primary` | `#101012` | |
| link | `#c78bff` | `--k-link`, `--k-info` | `#c78bff` | |
| ok / warn / danger | `#3ddc84` / `#ffb000` / `#ff4f8b` | `--k-ok` / `--k-warn` / `--k-danger` | same | |
| `--bg-error` | `#2a0f1a` | `--k-surface-danger` | `#2a0f1a` | Alert, error Toast |
| `--bg-warn` | `#2a200a` | `--k-surface-warn` | `#2a200a` | Alert, warning Toast |
| `--bg-selected` | `#1a1220` | `--k-surface-selected` | `#1a1220` | drop zone while dragging, selected Tag, TreeView row, Navbar current page |
| `--violet` / panel | `#8b5cf6` | not used | | decorative panel behind the mascot |
| `--gray` | `#5a5a64` | not used | | |
| shadow-pixel | `8px 8px 0 rgba(16,16,18,.6)` | `--k-shadow-overlay` | same | dialogs, popovers |
| delete-site dialog scrim | `rgba(16,16,18,.55)` | `--k-backdrop` | same | was `rgba(0,0,0,.6)`, no design source (#37) |
| `--sans` / `--mono` / `--pix` | `'Inter',system-ui,sans-serif` / `'JetBrains Mono',ui-monospace,monospace` / `'Silkscreen',monospace` | `--k-font-sans` / `--k-font-mono` / `--k-font-display` | same | the artifact's longer fallback stacks gave way to docs/design (#37) |
| shadow-pixel-sm / toast `--shadow` | `4px 4px 0 rgba(0,0,0,.4)` | `--k-shadow-sm` | same | Toast |
| target-min | 44px | `--k-tap-min`, `--k-tap-target`, `--k-control-h-sm` | 44px | every pointer |
| target-icon | 48px | `--k-tap-icon` | 48px | IconButton, CopyButton, dialog close |
| target-field / `--control-h` | 52px (56px below 760px) | `--k-control-h` | 52px / 56px | Button, Input, Select, ... |
| spacing 4 … 56 | | `--k-space-1` … `--k-space-9` | same | |
| spacing 10 / 14 / 28 | | `--k-space-2-5` / `--k-space-3-5` / `--k-space-6-5` | same | |

The light, paper and contrast variants exist only in the design system; it has no tinted
state surfaces, code/hint colours or drop line for them, so they keep the base defaults.
`--k-line-strong` there is derived (30 % from `line` toward `border`, the ratio of the dark pair).

**The extra variants** (`code-light`, `code-paper`, `code-contrast`) are **not part of stuffcloud's
design**: docs/design is dark only (stuffcloud ADR 0008, "the UI is dark only"). kern keeps them for
other consumers, with the values of the design-system artifact; stuffcloud uses `code` (= `code-dark`).

## Code theme source (#37)

**Decision: kern owns the Code theme** (option a of #37); stuffcloud's `docs/design` stays the design it
is drawn from. The theme has one machine-readable source:

| File | What |
| --- | --- |
| `src/lib/themes/code.tokens.json` | Every token of every variant with its value and its source (`from`). Shipped as `@mozra-the-great/kern/themes/code.tokens.json`, so stuffcloud can read the kit's values. |
| `src/lib/themes/brands/code.css` | **Generated** from the JSON (`npm run tokens:code`); never edited by hand. |
| `scripts/ci/code-theme-snapshot.json` | The design values the theme uses, read from a stuffcloud checkout and the artifact: the contract, because CI reaches neither. Records the stuffcloud commit and its `docs/design/pdf-source.sha256`. |
| `scripts/ci/code-theme.mjs` | Generator and drift check. |

A `from` names the place a value comes from:

- `design:stuff.css|.btn{font}` a declaration in `docs/design/prototypes/stuff.css` (`design:stuff.css|@media (max-width:760px)|.btn{min-height}` inside the media rule),
- `design:S.dc.html#<text>` a literal in a mockup (the delete-site dialog has no class, so its style text is the source),
- `app:ui/field.css|.sc-fld__hint{color}` stuffcloud's `web/apps/web/src` where docs/design has no value (the hint and error text of fields, the toast region, the drop zone, Progress, the named colours of `theme.css`),
- `ds:surface@light` a colour of the design-system artifact for a variant, `ds:target-min` another of its tokens.

`design` records the source value when the kern value is derived from it (a `font` shorthand split into
family and size, `0 28px` mapped onto `--k-space-6-5`); a token without a source carries a `note` that
says why (`--k-dur`, `--k-ease`, the light backdrops). `unused` lists the design's root tokens the theme
does not take, with the reason.

**Where the sources disagree, docs/design wins** (Moritz' rule): `--k-border` is `#6c6c76`
(`--field-border`; the artifact has `#6e6e78`), the font stacks are those of `stuff.css`, the backdrop is
the scrim behind the delete-site dialog (`rgba(16,16,18,.55)`; it was `rgba(0,0,0,.6)` without a source),
and the Modal follows the design's one dialog (S/T: 520 px, 32 px heading, page background) rather than
the app's `Dialog.svelte` (480 px, 22 px).

**The drift check.** `npm run tokens:check` runs in the `build` job: it fails when `brands/code.css` is
not the generated file, when a recorded value disagrees with the snapshot, when the snapshot lacks a
reference, when a mockup literal is gone, or when the design has a root token (`stuff.css :root`, the
app's `theme.css :root`) that the theme neither uses nor lists in `unused`. Against stuffcloud itself:

```sh
node scripts/ci/code-theme.mjs --against <stuffcloud checkout>            # docs/design and the app
node scripts/ci/code-theme.mjs --against <stuffcloud> --design-system tokens.json   # plus the artifact
```

It reads every snapshot value again and fails on any change, a new root token or a removed one, so
stuffcloud's CI can run it with a checkout of kern at the pinned tag (`actions/checkout` of
`Mozra-the-great/kern`, then `node kern/scripts/ci/code-theme.mjs --against .`): a design token that
changes without the kit theme changing fails there. When only unrelated parts of docs/design changed
(the PDF fingerprint moved, no used value did) it passes with a note.

**Refresh when the design changes:**

1. `node scripts/ci/code-theme.mjs --against <stuffcloud>` shows what changed. For light, paper and
   contrast, save the artifact's `project/tokens.json` ("Stuffcloud - Designsystem") and add
   `--design-system <file>`.
2. `node scripts/ci/code-theme.mjs --refresh <stuffcloud> [--design-system <file>]` rewrites the snapshot
   (without `--design-system` the artifact values stay as they were).
3. `npm run tokens:check` now lists every token whose recorded source value is stale: update its `value`
   (and `design`) in `code.tokens.json`, or add a new design token to a block or to `unused`.
4. `npm run tokens:code`, `npm test` (contrast: a value the contract forces stays and gets a `note`),
   and new visual baselines (below). Commit the JSON, the CSS and the snapshot together.

**Instance neutrality.** `npm run neutrality:check` (also in `build`) fails on an e-mail address, a URL,
a domain name or an IPv4 address in `src/lib/themes/**`, the snapshot or `assets/**` (contents and file
names). Allowed: the SVG namespace, `claude.ai` (the artifacts named in the asset manifests) and the
documentation names of RFC 2606/6761 (`example.com`, `*.test`, ...). The operator's own names and
domains cannot be listed in a public repository: set them as the Actions secret or variable
`KERN_FORBIDDEN_TERMS` (one per line or comma separated, `#` comments); findings name the entry number,
never the term. Without it (forks, Dependabot) only the generic patterns run.

## Component tokens (#38)

A theme draws components through tokens, not through component CSS (custom elements have shadow roots
that page CSS does not reach). Each token's default in `base.css` is exactly what the component read
before, so a theme that sets none of them looks as it did; `npm test` checks that for every variant of
Flower, Pop and Line.

| Component | Tokens | Code value |
| --- | --- | --- |
| Button | `--k-button-font`, `-size`, `-weight`, `-transform`, `-tracking` (default: the label tokens), `-pad-x`, `-gap`, `--k-button-secondary-border`, `-weight`, `-hover-bg` | Inter 600 15 px sentence case, 28 px padding, 10 px gap; secondary = the design's ghost button (`line2` edge, 500, no fill on hover) |
| Input, Select | `--k-field-font` (`initial` = inherit), `--k-field-size`, `--k-field-bg`, `--k-select-bg`, `--k-field-pad-x`, `--k-field-disabled-opacity` | JetBrains Mono 15 px, transparent (select on `--k-bg`), 14 px padding, 0.4 |
| Field, Label | `--k-field-label-color`, `--k-field-hint-font`, `--k-field-hint-size`, `--k-field-hint-color` | muted label (mono 12 px caps), hint and error mono 13 px, hint muted |
| Checkbox | `--k-check-gap`, `--k-check-checked`, `--k-check-mark`, `--k-check-label-size` (`initial` = inherit), `--k-check-disabled-opacity` | 14 px gap, pink box with dark tick, 15 px label |
| Card | `--k-card-bg`, `--k-card-pad` (one length), `--k-card-gap` | transparent, 20 px, 10 px |
| Tabs | `--k-tabs-gap`, `--k-tabs-scrollbar`, `--k-tab-h`, `--k-tab-pad-x`, `--k-tab-font`, `-size`, `-weight`, `-selected-weight`, `-transform`, `-tracking`, `--k-tab-fg`, `-hover-fg`, `-selected-bg`, `--k-tab-divider-w` | a strip of cells (1 px `line` after each tab, `look="line"`), 52 px, Inter 15 px, selected 600 on the raised surface with the 2 px accent underline, pink on hover, no scrollbar |
| Modal | `--k-modal-bg`, `-pad`, `-gap`, `-title-size`, `-title-tracking`, `-title-leading`, `--k-modal-actions-direction` | page background, 36/36/32 px, 24 px gap, 32 px/-0.8 px title; below 760 px 28/16/24 px, 28 px title, stacked actions (main action on top) |
| Progress | `--k-progress-track`, `--k-progress-track-border-w` | `line` track without an edge |
| Toaster | `--k-toaster-width` (includes the offset on both sides), `--k-toast-pad`, `--k-toast-msg-size`, `--k-toast-ok-border`, `--k-toast-warn-border` | 420 px of toasts, 8/8/8/16 px, 15 px, green and amber edges |
| FileDrop | `--k-filedrop-bg`, `--k-filedrop-pad`, `--k-filedrop-prompt-font`, `-size`, `-weight`, `-transform`, `-tracking` | transparent, 24/28 px, mono 14 px sentence case |

**Phone breakpoint.** A custom property cannot be used in a media query, so a theme switches tokens in
its own `@media` rule at its breakpoint (Code: `max-width: 760px`, the design system's `breakpoint`):
`--k-control-h`, the Modal tokens and `--k-toaster-offset-mobile` change there.

**Approved differences** to stuffcloud's components (side by side with `web/apps/web/src/ui`); each needs
Moritz' approval in stuffcloud's ADR (stuffcloud#121), or a follow-up that removes it:

- Button: kern moves pressed buttons 1 px down; a danger button darkens on hover, while `.btn:hover` in
  `stuff.css` also turns it pink; `line-height: 1.2` instead of `normal` (same 52/56 px height).
- Input, Select: kern adds the accent border on focus and a muted border on hover to the design's focus
  ring; Select draws its own chevron instead of the native arrow; an error carries an icon.
- Checkbox: kern draws a 22 px box with a tick (native `accent-color` boxes differ per browser); the row
  is 44 px (`--k-tap-target`), the design's `.toggle` 48 px; disabled fades the box instead of greying
  the label.
- Tabs: the edge fade shows whenever tabs are hidden on that side, at any width; the design fades the
  right edge on phones only.
- Modal: follows docs/design (S/T), not the app's `Dialog.svelte` (480 px, 22 px heading, 20 px padding);
  it keeps a close button and its open animation (none under reduced motion); on phones it stays a
  centred dialog, not T's full-width sheet. In custom elements, `<k-button>` hosts in a stacked footer
  keep their own width (the Svelte `Button` stretches).
- Progress: kern shows the label row above the bar.
- Toaster: each toast keeps its tone dot; the dismiss button is 32 px with a 44 px hit area (the app: a
  48 px ghost icon button); the default position is bottom right (pass `position="bottom-left"` as the
  app does); text aligns to the top.
- FileDrop: kern shows an upload icon and an inset ring while dragging; with a button the zone wraps the
  button under the prompt when narrow.

**Visual regression.** `tests/elements/visual.spec.ts` (part of `npm run test:elements`, so of the
`build` job) screenshots Button, Input, Select, Checkbox, Card, Tabs, Progress, FileDrop, Modal and the
toasts in `code` and `code-light` at 1280, 375 and 320 px on `tests/elements/pages/visual.html`, with
the real fonts (`tests/elements/pages/fonts`, OFL), reduced motion and frozen animations. `stuffcloud`
and `stuffcloud-light` render against the same baselines. Baselines are per platform in
`tests/elements/visual.spec.ts-snapshots/` (`-chromium-linux.png` for CI, `-chromium-win32.png` for
local runs on Windows); fonts rasterise differently on the two, so each has its own. A missing
baseline is written, but in CI the test still fails (nothing to compare is never a pass), and the file
is never retried. New baselines after an intended change:

1. Windows: `npm run build`, then
   `npx playwright test -c tests/elements/playwright.config.ts visual.spec.ts --update-snapshots`.
2. Linux: push; the failed `build` job uploads the artifact `visual-results` (the actual screenshots of
   changed baselines and the files it wrote for missing ones). `gh run download <run id> -n visual-results -D <dir>`,
   then `node scripts/ci/visual-baselines.mjs <dir>` copies each to its Linux baseline (and reports an
   alias that rendered differently from `code`).
3. Look at every changed image before committing it.

## Choices for Flower and Pop

- `--k-accent-mark`: Flower creme `#d06557` (coral-600 with 6 % less lightness), Flower wald
  coral-500 `#dd887a`, Pop light `#0e9413` (Pop's `green-hover` of the dark theme); Pop dark keeps
  `green`. Their accents reach only 2.5–2.9:1 as marks on the page.
- Pop `--k-danger-soft` light: `#ffe5ef` (pink-tint a touch lighter, so `pink-lo` on it reaches 4.5:1).
- Flower wald `--k-warn`: `#e4b76a` (ochre-500 a touch lighter, 4.5:1 on the raised surface).
- Pop sizes: `tap-s` 44px for every pointer (`--k-tap-target`), `tap-m` 48px for icon buttons.
  Pop's `drop-line` (about 1.4:1) is not used; the drop zone keeps the 3:1 `mut` border.
- Every other derived token keeps its base default in both brands (their designs have no
  separate value), so their look does not change.

## Line variables and their kern tokens

Source: the Line-Designsystem (`tokens.json`, README). `line` (= `line-dark`) is the first theme
and the fallback, `line-light` a full second theme. Values are dark / light.

| Line | value (dark / light) | kern token | kern value (dark / light) | note |
| --- | --- | --- | --- | --- |
| `bg` | `#19191c` / `#f2f2f3` | `--k-bg` | same | |
| `surface` | `#232327` / `#ffffff` | `--k-bg-raised` | same | |
| `bg2` | `#121214` / `#e6e6e9` | `--k-bg-sunken` | same | |
| `surface2` | `#2d2d32` / `#f0f0f2` | `--k-selected` | same | hover and active items |
| `ink` | `#ffffff` / `#18181a` | `--k-fg` | same | |
| `ink2` | `#d6d6dc` / `#3a3a41` | `--k-fg-soft` | same | |
| `mut` | `#a4a4af` / `#5f5f69` | `--k-fg-muted` (= `--k-fg-hint`) | same | |
| `line` | `#3b3b42` / `#d4d4da` | `--k-line` (= `--k-line-strong`) | same | dividers, panel edges |
| `line2` | `#5a5a63` / `#9c9ca6` | `--k-border` | `#70707a` / `#7e7e88` | **deviation**: `line2` is 2.3-2.7:1 (dark) and 2.2-2.7:1 (light); moved towards `mut` to reach 3:1 on bg, raised and sunken (3.2:1 worst case) |
| `solid` / `on-solid` / `solid-h` | `#f2f2f3` `#18181a` `#ffffff` / `#18181a` `#ffffff` `#000000` | `--k-primary` / `--k-on-primary` / `--k-primary-hover` | same | |
| `sun` / `art` | `#ffb81c` / `#18181a` | `--k-accent` / `--k-on-accent` | same | |
| `sun` as mark | `#ffb81c` | `--k-accent-mark` | `#ffb81c` / `#a67812` | **deviation** in light: `sun` is 1.4-1.7:1 on a light ground; `sun` at 65 % brightness reaches 3.2:1 on bg-sunken |
| `sun` / `warn` as text | | `--k-accent-text` | `#ffb81c` / `#8a5a00` | light `sun` text would be 1.5:1 |
| `link` | `#c5bdff` / `#4b3bd1` | `--k-link`, `--k-info` | same | |
| `focus` | `#ffb81c` / `#4b3bd1` | `--k-focus` | same | 2.5px, offset 3px |
| `sel-bg` | `#232327` / `#fff1c9` | `--k-surface-selected`; light `--k-accent-soft` | same | |
| `sel` | `#ffb81c` / `#18181a` | not a token | | kern draws selection with the accent mark and focus |
| `ok` | `#8fd86b` / `#2b7a1c` | `--k-ok` | same | |
| `warn` | `#ffb81c` / `#8a5a00` | `--k-warn` | same | |
| `danger` / `danger-bg` | `#ff8a7a` `#c9372c` / `#b92f26` `#c9372c` | `--k-danger` / `--k-on-danger` | `#ff8a7a` + `#18181a` / `#b92f26` + `#ffffff` | **deviation**: one kern token is both error text and destructive fill; dark takes the text value with `art` text (7.7:1), as `danger-bg` is 3.4:1 as text on bg; light takes the text value (`paper` on it 6.0:1; `danger-bg` would be 4.2:1 as text on bg-sunken) |
| (none) | | `--k-ok-soft`, `--k-warn-soft`, `--k-danger-soft`, `--k-info-soft`, dark `--k-accent-soft` | dark `#30392f` `#3d3526` `#3d2f31` `#363541`; light `#eaf2e8` `#f3efe6` `#f8eae9` `#edebfa` | derived: status colour at 12 % over raised (dark) / 10 % over white (light); status text keeps >= 4.7:1 |
| `term` / `term-ink` | `#101012` / `#ededf0` | `--k-bg-code` / `--k-fg-code` | dark same; light `#e6e6e9` / `#18181a` | **deviation** in light: kern sets `--k-fg-muted` on bg-code and light `mut` is 2.8:1 on `term` |
| `stroke-ui` | 1.5px | `--k-border-w` | 1.5px | |
| `stroke-focus` / focus offset | 2.5px / 3px | `--k-focus-w` / `--k-focus-offset` | same | |
| `radius-pill` | 999px | `--k-radius-control`, `--k-radius-badge`, `--k-radius-avatar` | same | |
| `radius-lg` | 22px | `--k-radius-card`, `--k-radius-overlay` | same | |
| `size-field` pill | 54px | `--k-radius-field` | 27px | exactly a pill at 54px; a 999px radius would turn Alert, FileDrop and Collapsible into ovals (the design's drop zone is 26px) |
| `size-touch` | 44px | `--k-tap-min`, `--k-tap-target`, `--k-tap-icon`, `--k-control-h-sm` | 44px | every pointer |
| `size-button` / `size-field` | 52px / 54px | `--k-control-h` / `--k-control-h-lg` | 52px / 54px | Button, Input and Select use `--k-control-h` (52px); `--k-control-h-lg` (54px) is the large Button and Accordion; fields are 52px, not 54px, as kern has no separate field height |
| `display` / `sans` / `mono` | Outfit / Inter / JetBrains Mono | `--k-font-display` / `--k-font-sans` / `--k-font-mono` | same | weights 600 / 600 / 500 |
| text styles | 14 / 15 / 17 / 20 / 30 / 68px | `--k-text-xs` ... `--k-text-2xl` | same; 26px and 44px for xl and 2xl up to 760px | |
| no shadows | | `--k-shadow-raised`, `--k-shadow-overlay`, `--k-shadow-sm` | `none` | |
| motion | 0.15s | `--k-dur` | 150ms | |

Not used: `lav`, `green`, `orange`, `sky`, `pink`, `peach`, `teal`, `fog`, `alert`, `hot`,
`term-mut`, `term-str` (illustration and tile colours), the hand font, `danger-h`, `sun-h`.
Inter's contextual alternates are switched off in the design; kern has no token for font
features, so that is left to the page (`font-feature-settings: 'calt' 0`).

## Contract

`npm test` checks, for every `data-theme` value a theme file names:

- text 4.5:1: fg, fg-muted, fg-hint, fg-soft on bg / raised / sunken; fg-code on bg-code and
  bg-sunken; on-primary, on-accent, on-danger on their fills; link, accent-text, danger, ok,
  warn, info on bg, raised and their `-soft` and `surface-*`; fg and fg-muted on every `surface-*`.
- non-text 3:1: border on bg / raised / sunken, line-dashed on bg / sunken, focus on bg / raised /
  sunken, accent-mark on bg / raised / sunken, primary on bg / raised, danger on raised.
