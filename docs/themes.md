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
| `--fg-hint` | `#c7c7cf` | `--k-fg-hint` | `#c7c7cf` | the app's drop-zone hint (Code draws no FileDrop icon; the other themes colour it with this token) |
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
| `body` (no `line-height`) | `normal` | `--k-leading-body` | `normal` | text without a line height of its own; the other themes keep `1.5` (#145, section "Line height") |
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
| Button | `--k-button-font`, `-size`, `-weight`, `-transform`, `-tracking` (default: the label tokens), `-pad-x`, `-gap`, `--k-button-secondary-border`, `-weight`, `-hover-bg`, `--k-button-leading`, `--k-button-press-offset`, `--k-button-danger-hover-as-primary`, `--k-button-danger-hover-filter` | Inter 600 15 px sentence case, 28 px padding, 10 px gap, `line-height: normal`; secondary = the design's ghost button (`line2` edge, 500, no fill on hover); pressed buttons do not move; danger turns pink on hover like every `.btn` |
| Input, Select | `--k-field-font` (`initial` = inherit), `--k-field-size`, `--k-field-bg`, `--k-select-bg`, `--k-field-pad-x`, `--k-field-disabled-opacity`, `--k-field-hover-border`, `--k-field-focus-border` (no default: the component falls back to `--k-accent-mark`), `--k-select-appearance`, `--k-select-chevron` (`display`), `--k-select-pad-end` | JetBrains Mono 15 px, transparent (select on `--k-bg`), 14 px padding, 0.4; the edge stays `--field-border` on hover and focus (focus is the ring); Select uses the browser's arrow |
| Field, Label | `--k-field-label-color`, `--k-field-hint-font`, `--k-field-hint-size`, `--k-field-hint-color`, `--k-field-error-icon` (`display`) | muted label (mono 12 px caps), hint and error mono 13 px, hint muted, error without icon |
| Checkbox | `--k-check-gap`, `--k-check-checked`, `--k-check-mark`, `--k-check-label-size` (`initial` = inherit), `--k-check-disabled-opacity`, `--k-check-appearance`, `--k-check-tick` (`display`), `--k-check-row-h`, `--k-check-disabled-fg` (`initial` = inherit) | 14 px gap, the browser's checkbox filled pink (`accent-color`), 15 px label, 48 px row; disabled greys the label and leaves the box to the browser |
| Card | `--k-card-bg`, `--k-card-pad` (one length), `--k-card-gap` | transparent, 20 px, 10 px |
| Tabs | `--k-tabs-gap`, `--k-tabs-scrollbar`, `--k-tab-h`, `--k-tab-pad-x`, `--k-tab-font`, `-size`, `-weight`, `-selected-weight`, `-transform`, `-tracking`, `--k-tab-fg`, `-hover-fg`, `-selected-bg`, `--k-tab-divider-w`, `--k-tabs-fade-start`, `--k-tabs-fade-end` (0px = no fade) | a strip of cells (1 px `line` after each tab, `look="line"`), 52 px, Inter 15 px, selected 600 on the raised surface with the 2 px accent underline, pink on hover, no scrollbar; only the end edge fades, only below 760 px |
| Modal | `--k-modal-bg`, `-pad`, `-gap`, `-title-size`, `-title-tracking`, `-title-leading`, `--k-modal-actions-direction`, `--k-modal-action-w`, `--k-modal-width` (`initial` = the `size` width), `-margin`, `-border-w`, `-shadow`, `-enter-dur`, `-close-inset`, `-close-icon` | page background, 36/36/32 px, 24 px gap, 32 px/-0.8 px title, no open animation; below 760 px T's sheet: full width at the bottom, top edge only, no shadow, 28/16/24 px, 28 px title, stacked full-width actions (main action on top); every theme stacks the actions below 520 px, `<k-button>` hosts included |
| Modal, Toaster close | `--k-close-fg`, `--k-close-hover-bg`, `--k-close-border-w`, `--k-close-stroke` | the app's ghost icon button: `line2` edge (`--k-fg` on hover), ink cross 12 px wide, 2 px stroke |
| Progress | `--k-progress-track`, `--k-progress-track-border-w` | `line` track without an edge |
| Toaster | `--k-toaster-width` (includes the offset on both sides), `--k-toast-pad`, `--k-toast-msg-size`, `--k-toast-ok-border`, `--k-toast-warn-border`, `--k-toast-dot` (`display`), `--k-toast-align`, `--k-toast-text-offset`, `--k-toast-close-size`, `--k-toast-close-icon`, `--k-toast-enter-dur` | 420 px of toasts, 8/8/8/16 px, 15 px, green and amber edges, no tone dot, text centred, 48 px dismiss, no entrance animation |
| FileDrop | `--k-filedrop-bg`, `--k-filedrop-pad`, `--k-filedrop-prompt-font`, `-size`, `-weight`, `-transform`, `-tracking`, `--k-filedrop-icon` (`display`), `--k-filedrop-drag-ring`, `--k-filedrop-split-gap`, `--k-filedrop-prompt-basis` | transparent, 24/28 px, mono 14 px sentence case, no icon, no inset ring while dragging, 16 px gap, the button wraps as soon as prompt and button do not fit side by side |

**Phone breakpoint.** A custom property cannot be used in a media query, so a theme switches tokens in
its own `@media` rule at its breakpoint (Code: `max-width: 760px`, the design system's `breakpoint`):
`--k-control-h`, the Modal tokens (the sheet), `--k-tabs-fade-end` and `--k-toaster-offset-mobile` change there.

**Forced colours keep kern's own parts.** Where Code hides a drawn part or leaves it to the browser, the
component brings it back under `@media (forced-colors: active)`, because there it carries state that colour no
longer does: the error icon (hint and error have the same system colour), the toast's tone dot (its shape tells
the tones apart) and kern's checkbox (each state in its system colour, a GrayText edge when disabled).

**Remaining differences** to stuffcloud's components (#111). Each item of the former list was compared again
side by side with `web/apps/web/src/ui`, `stuff.css` and the mockups (rendered and in code), and aligned in the Code
theme wherever that is possible without breaking WCAG 2.2 AA, `--k-tap-target`, visible focus, reduced motion,
forced colours or an API that is the same in every theme. Only these remain, each with its reason:

- Modal close button: kern keeps it. The mockup S has none, but `dismissible` (default `true`) means a visible way
  out in every theme, and stuffcloud's own `Dialog.svelte` and its accessibility notes require one too. It now has
  the app's look (48 px ghost icon button with a `line2` edge, ink cross).
- Progress label row: kern keeps the label above the bar. Showing `label` unless `hideLabel` is the component's
  contract in every theme; stuffcloud's bare bar is `hideLabel` (the label stays the accessible name).
- Toaster position: the default stays `bottom-right` in every theme (a prop default cannot depend on the theme);
  stuffcloud passes `position="bottom-left"`, as its toast region sits there.
- Tabs edge fade: the end edge fades only while tabs are hidden behind it. stuffcloud's mask is static and fades
  the last 36 px on phones even when every tab fits, which dims a visible label below 4.5:1 (WCAG 1.4.3).
- FileDrop while dragging: the edge turns solid as well as pink. stuffcloud changes only colours (dashed edge,
  ground); the solid line is the cue that does not rely on colour (WCAG 1.4.1).
- FileDrop picker button: kern's is the secondary button (`size="sm"`), stuffcloud's the filled primary one
  (`size="compact"`). The variant is the component's markup in every theme; a theme token cannot pick it, and
  changing it would change Flower, Pop and Line.
- Forced colours: the error icon, the toast's tone dot and kern's checkbox stay there (see above); stuffcloud has
  no forced-colours rule for them.

Where stuffcloud's sources disagree, kern follows docs/design: the Modal is S and T (520 px, 32 px heading, the
page background; on phones T's sheet), not the generic `Dialog.svelte` (480 px, 22 px heading, 20 px padding), which
has not moved on from the mockups (it is the base component of the first build, older than the last change to S
and T). Where S and T say nothing (the close button), the app is the source.

**Aligned in #111** (Code only, through component tokens; every other theme resolves each new token to what the
component drew before, which `tests/unit/code-theme-source.test.ts` checks): pressed buttons no longer move, the
danger button turns pink on hover, button `line-height: normal`; field edges stay `--field-border` on hover and
focus; Select shows the browser's arrow; field errors without an icon; the browser's checkbox with `accent-color`,
a 48 px row, a grey label when disabled; no tab fade on desktop and only the end edge on phones; no Modal open
animation, T's full-width sheet below 760 px with stacked full-width actions (`<k-button>` hosts too), the app's
close button; toasts without the tone dot, text centred, the 48 px ghost dismiss, no entrance animation; FileDrop
without the upload icon and the inset ring, wrapping as the app does.

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

The same spec also takes the forced-colors shots (`fc-<shot>-<dark|light>-<width>`, #27): Button, Input, Checkbox,
Tabs, Progress, FileDrop, a controls board (Switch, RadioGroup, Slider, SegmentedControl, Rating), a status board
(Alert, Badge, Tag, Pagination, Stepper), Modal and the toasts, under `forcedColors: 'active'` in the dark palette
(`code`) and the light palette (`code-light`) at 1280 and 375 px. They are refreshed the same way.

## Forced colors (#27)

Under `@media (forced-colors: active)` the browser paints every colour from the user's system palette and drops
box-shadows, so a theme cannot decide colour there, and must not try. What a theme can still break is covered by
the block at the end of `base.css`: it sets the edge tokens (`--k-border`, `--k-line`, `--k-line-strong`,
`--k-line-dashed`), the focus ring and accent (`--k-focus`, `--k-accent-mark`) to system colours, the dimming of
disabled parts (`--k-disabled-opacity`, `--k-field-disabled-opacity`, `--k-check-disabled-opacity`) to 1,
`--k-fg-disabled` to `GrayText`, the shadows to `none` and the Progress track to `Canvas`, all with `!important`
(a theme's own `[data-theme^=…]` rule has the same specificity and loads later). The rest is per component
(`@media (forced-colors: active)` in each `.svelte` file); `tests/unit/forced-colors.test.ts` fails for a component with
styles but neither such a rule nor an entry in its exemption list, and `tests/elements/forced-colors.spec.ts` for a
custom element without an entry in its table. A theme needs no forced-colors rules; a component token that paints a
shape with a *background* (a fill, a stripe, a dot) must have a forced-colors counterpart in the component.

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

## Base font size (#144)

`[data-theme]` sets background, colour, font family and line height on every themed element. The base size
`--k-text-md` is set as px on theme boxes in the page (`<div data-theme>`, `<body data-theme>`) but **not on the
document root**: `<html data-theme>` takes `calc(var(--k-root-scale) * 1rem)`, and the root's `1rem` is the reader's
default font size (browser setting, 16px unless changed). A px size there replaced the setting and froze every `rem`.

- `--k-root-scale` is `--k-text-md` / 16px as a plain number: `1` in `base.css` (Code, Flower, Pop), `1.0625` in Line
  (`--k-text-md` 17px = 17 / 16). A theme whose `--k-text-md` is not 16px sets both. At the default 16px the root is
  exactly `--k-text-md` (nothing changes, no baseline), at 20px it is 20px (Line 21.25px).
- The specificity of the root rule is 0 (`:where()`), so a page's own `html { font-size }` wins; the rule for boxes keeps
  the specificity of `[data-theme]` (`[data-theme]:where(:not(:root))`).
- `--k-text-*` stay px (Code's values come from stuffcloud's design, `tokens:check`), so component text and heights do not
  follow the setting; text without a size of its own, `rem` and `em` lengths do. The table is in
  [docs/consumer-guide.md](consumer-guide.md#schriftgröße).
- `tests/elements/root-font-size.spec.ts` sets the browser's default font size with the CDP command `Page.setFontSizes`
  (the value of Chrome's Settings > Appearance > Font size) to 16 and 20px and checks every variant.

## Line height (#145)

`[data-theme]` sets `line-height: var(--k-leading-body)`, on `<html data-theme>` and on a theme box alike, and all text
without a line height of its own inherits it. The token is `1.5` in `base.css` (Flower, Pop and Line draw exactly what they
did) and `normal` in Code, all its variants and the `stuffcloud*` aliases: stuffcloud's `stuff.css` sets no `line-height` on
`body` (source `design:stuff.css|body{line-height}`, recorded as `null` in the snapshot), so the browser's `normal` applies.
The design sets its own where it wants one (titles 1.05 to 1.1, textarea 1.6, the toast 1.5, the offline banner 1.5).

- The token is declared on `:root` and on `[data-theme]`: a theme box nested in another theme takes its own theme's value
  (a Flower box in a Code page is 1.5, a Code box in a Flower page is `normal`), not the one it inherits.
- To keep the old look in Code, set `--k-leading-body: 1.5` on the themed element (`html[data-theme] { --k-leading-body: 1.5 }`).
- Components that set their own line height (Prose `--k-prose-leading`, Code, Terminal, Button, Modal title, Badge, Label, Textarea,
  Timeline, ...) do not follow the token. Three take a fixed `1.5` of their own so Code does not move them: Alert (the icon's
  offset is set against a 1.5 line), Toast (the dot and `--k-toast-text-offset` are; stuffcloud's toast sets 1.5 as well) and the
  sort buttons of Table's header (the row is 12px padding plus the button, so a shorter button leaves less than the 44px
  target `tests/targets` demands inside the table box; DataTable has a `min-height` for it). The line that connects the steps of
  a Stepper no longer takes clicks (`pointer-events: none`): a shorter link had moved it into the middle of the link.
  Everything else follows the design: its text now has `normal` leading in Code, as stuffcloud's does.
- `tests/elements/leading-body.spec.ts` checks the computed `line-height` of the root, a theme box and plain text in every
  variant (Code `normal`, the others 1.5), nesting in both directions, the migration override, Alert and Toast.

## Contract

`npm test` checks, for every `data-theme` value a theme file names:

- text 4.5:1: fg, fg-muted, fg-hint, fg-soft on bg / raised / sunken; fg-code on bg-code and
  bg-sunken; on-primary, on-accent, on-danger on their fills; link, accent-text, danger, ok,
  warn, info on bg, raised and their `-soft` and `surface-*`; fg and fg-muted on every `surface-*`.
- non-text 3:1: border on bg / raised / sunken, line-dashed on bg / sunken, focus on bg / raised /
  sunken, accent-mark on bg / raised / sunken, primary on bg / raised, danger on raised.

## Eigene Akzentfarbe

Eine App, deren Betreiber eine eigene Farbe wählt (nagellacke: `branding.accentColor` vom Server),
setzt **nur diese Farbe auf ein Standard-Theme**. kern baut dafür **kein Theme pro Marke**: es gibt kein
`nagellacke`- oder `nailvault`-Theme, und nichts davon bildet das Aussehen einer App nach (Entscheidung
von Moritz, #41). nagellacke und nailvault.de nutzen das Standard-Theme `flower`; die Instanz-Presets
setzen darauf nur den Akzent. Die Akzent-API (`@mozra-the-great/kern`, im Browser `window.kern.accent`)
ist die allgemeine Funktion dafür und gilt für `code`, `flower`, `pop` und `line`, hell und dunkel.

### Welche Tokens ein Akzent setzt

Aus einer Farbe (`#rgb` oder `#rrggbb`) entstehen zehn Tokens in drei Gruppen (`roles`, Standard: alle):

| Gruppe    | Token                  | Wert                                                                                                              | Garantie                                           |
| --------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `accent`  | `--k-accent`           | die Farbe selbst (Füllung von Accent-Button, Badge, TabBadge)                                                     | wird nie verschoben                                |
|           | `--k-on-accent`        | Schrift auf der Füllung: Tinte des Themes (`--k-fg` oder `--k-bg`), sonst Schwarz oder Weiß                       | 4,5:1 auf `--k-accent`                             |
|           | `--k-accent-soft`      | Farbe zu 14 % über `--k-bg-raised` (schwächer, wenn `--k-fg` darauf sonst unter 4,5:1 fiele)                      | `--k-fg` darauf 4,5:1                              |
|           | `--k-accent-mark`      | Marker ohne Text: Fortschritt, aktiver Tab, gewählter Rand                                                        | 3:1 auf bg, raised, sunken                         |
|           | `--k-accent-text`      | Text in Akzentfarbe (Badge, Tabs, Links im Akzent)                                                                | 4,5:1 auf bg, raised, sunken und `--k-accent-soft` |
| `primary` | `--k-primary`          | Haupt-Button, gesetzte Checkbox, Switch, Radio, aktiver Tab (auch als Text)                                       | 4,5:1 auf bg, raised, sunken                       |
|           | `--k-on-primary`       | Schrift auf `--k-primary`                                                                                         | 4,5:1                                              |
|           | `--k-primary-hover`    | eine Stufe weiter von der Seite weg (hell: dunkler, dunkel: heller; am Ende der Skala die andere Richtung)        | 4,5:1 auf bg, raised, sunken                       |
|           | `--k-on-primary-hover` | Schrift auf dem Hover                                                                                             | 4,5:1                                              |
| `focus`   | `--k-focus`            | Fokusring                                                                                                         | 3:1 auf bg, raised, sunken                         |

Nicht angefasst werden `--k-link`, `--k-info`, `--k-danger`, `--k-ok`, `--k-warn`, die Linien und die
Flächen: Status und Links behalten ihre Bedeutung. Wer nur den Fokusring oder nur die Füllung will, nennt die
Gruppen: `{ roles: ['focus'] }`. Die Füllung `--k-accent` ist die Markenfarbe und wird nie verschoben. Steht sie
auf einem Grund, auf dem sie selbst kaum zu sehen ist (dunkles Blau auf einem dunklen Theme), trägt der Button
seine Beschriftung trotzdem mit 4,5:1; wer eine Fläche braucht, die sich vom Grund abhebt, nimmt `--k-primary`.

### Wie angepasst wird

Besteht eine Farbe ihre Prüfung nicht, bleiben Farbton und Sättigung (OKLCH) und nur die Helligkeit wandert: auf
hellem Grund nach dunkel, auf dunklem nach hell, so weit wie nötig und nicht weiter (binäre Suche auf den
fertigen 8-Bit-Hex-Werten, gemessen wie in WCAG 2.2). Besteht sie, bleibt sie unverändert. Reicht selbst Schwarz
oder Weiß nicht (Mittelgrau als eigener Grund), nimmt sie das Ende mit dem besseren Wert und sagt es in
`guaranteed`. **Jedes Ergebnis berichtet, was geschehen ist:**

```ts
const r = accentTokens('#ffc8e6', { theme: 'flower' });
if (r.ok) {
	r.tokens; // { '--k-accent': '#ffc8e6', '--k-primary': '#8a5b76', '--k-focus': '#aa7794', … }
	r.adjustments; // [{ token: '--k-primary', from: '#ffc8e6', to: '#8a5b76', kind: 'text', message: '…' }, …]
	r.checks; // [{ token: '--k-primary', on: '#f6f0e0', ratio: 4.81, min: 4.5, pass: true }, …]
	r.guaranteed; // true: jedes Paar in checks besteht
	r.style; // '--k-accent:#ffc8e6;--k-on-accent:#2c4f38;…' als style-Attribut
} else {
	r.error; // { code: 'invalid-color' | 'unknown-theme' | 'invalid-ground' | 'invalid-selector' | 'invalid-element' | 'no-dom', message }
}
```

Worauf geprüft wird, bestimmt der Aufruf: `theme: 'flower-wald'` prüft auf die Flächen genau dieses Themes (bg,
raised, sunken aus `ACCENT_GROUNDS`); `scheme: 'dark'` ohne Theme prüft auf **alle** Standard-Themes des
Schemas zugleich (etwas vorsichtiger, gilt auf jedem); `surfaces: { bg, raised, sunken, fg }` gilt für ein eigenes
Theme; ohne alles gilt der neutrale Grund von `base.css`. `npm test` hält die Tabelle `ACCENT_GROUNDS`
(`src/lib/components/accent-themes.ts`) gegen die Theme-CSS und misst die Ergebnisse mit der Kontrastfunktion des
Theme-Tests auf den echten Flächen: harte Fälle (sehr hell, sehr dunkel, gesättigtes Gelb, reines Grau,
Fast-Weiß, Fast-Schwarz, reines Weiß und Schwarz, Blau, Rot, Grün) in jedem Theme, hell und dunkel.

### Die Funktionen

| Funktion                                                          | Zweck                                                                      |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `accentTokens(hex, options)`                                      | die Token-Tabelle für ein Theme oder Schema (rein, ohne DOM)               |
| `accentCss(hex, { selector, roles })`                             | ein Stylesheet mit einer Regel je Standard-Theme (rein, SSR-sicher)        |
| `installAccent(hex, { storageKey, themeColor, nonce, roles, selector })` | setzt den Akzent seitenweit: `<style id="kern-accent">` im `<head>`        |
| `removeAccent({ storageKey })`                                    | nimmt ihn zurück (Style, gespeicherte Kopie, `theme-color`)                |
| `createAccentScript(storageKey, { nonce })`                       | Inline-Script gegen das Aufblitzen (unten)                                 |
| `applyAccent(el, hex, options)` / `clearAccent(el)`               | Inline-Tokens auf einem Element, für das Theme, das es gerade zeigt        |

Ungültige Eingabe (`''`, `'pink'`, `'#12'`, `null`, ein Alpha-Hex, ein unbekanntes Theme ohne `scheme`) liefert
`{ ok: false, error }`, ändert nichts und wirft nie, auch nicht beim Rendern. Auf dem Server gibt es kein DOM:
`installAccent` und `applyAccent` melden `no-dom`; dort rendert man `accentCss(…).css`.

`accentCss` schreibt die Regeln als `:root[data-theme='flower-wald']{…}` (Spezifität 0,2,0, gewinnt gegen die
Theme-Regel in jeder Reihenfolge), eine für jeden `data-theme`-Wert samt Aliasen und eine für
`:root:not([data-theme])`. Ein Wechsel hell/dunkel danach (ThemeToggle) wählt die Regel des neuen Themes: der
Kontrast gilt weiter, ohne dass Code läuft. `applyAccent` setzt dagegen feste Werte für das Theme von jetzt
(Flächen aus den berechneten `--k-bg…` des Elements, also auch für ein eigenes Theme) und folgt einem späteren
Wechsel nicht: für eine Seite mit Theme-Wechsel `installAccent` nehmen, `applyAccent` für eine Vorschau oder einen
Teilbaum mit eigenem `data-theme`.

### Beispiel: Akzent vom Server (nagellacke)

```ts
import { installAccent, removeAccent } from '@mozra-the-great/kern';

// branding.accentColor kann fehlen, null oder kein Hex sein.
function showBranding(accent: string | null): void {
	if (accent === null) return removeAccent({ storageKey: 'kern-accent' });
	const result = installAccent(accent, { storageKey: 'kern-accent', themeColor: 'accent' });
	if (!result.ok) removeAccent({ storageKey: 'kern-accent' }); // ungültig: das Standard-Theme bleibt
}
```

Das ersetzt das Setzen von `--md-primary` und `theme-color` per Hand: ein Aufruf, Kontrast für `flower` und
`flower-wald` inbegriffen, und ein späterer Theme-Wechsel bricht ihn nicht.

### Kein Aufblitzen vor dem ersten Frame

Wer den Akzent erst nach dem Laden setzt, zeigt bis dahin das Theme. Zwei Wege davor:

1. **Der Server kennt die Farbe** (Hostname, Cookie): `accentCss(hex)` beim Rendern, als
   `<style id="kern-accent">…</style>` in den `<head>` hinter das Theme-Stylesheet. `installAccent` ersetzt später
   genau diesen Style.
2. **Nur der Client kennt sie** (ab dem zweiten Besuch): `installAccent(hex, { storageKey })` legt das Stylesheet
   in `localStorage`, `createAccentScript(key)` liefert das Inline-Script, das es beim nächsten Laden vor dem ersten
   Frame wieder einsetzt. Das Script prüft den gespeicherten Text gegen die Grammatik von `accentCss` und nimmt **nur
   diese** Form an: Regeln, deren Selektor aus einfachen Selektorzeichen besteht (keine `{ } < @ \ /`, kein Zeilenumbruch) und
   deren Block ausschließlich `--k-…: #rrggbb`-Zeilen der Akzent-Tokens enthält, höchstens 20 000 Zeichen. Alles andere
   (`url()`, `image-set()`, `content`, `display`, `@`-Regeln, Kommentare, fremde Properties) wird verworfen. Ein
   Schreibzugriff auf `localStorage` kann den Akzent also umfärben, aber nichts laden, ausblenden oder hinzufügen. Pro
   Instanz (Origin) der App gilt **ein** Storage-Schlüssel.

```html
<head>
	<meta charset="utf-8" />
	<link rel="stylesheet" href="/kern/themes.css" />
	<script>/* createThemeScript('kern-theme', { followSystem: true }): setzt data-theme */</script>
	<script>/* createAccentScript('kern-accent'): setzt den Akzent */</script>
</head>
```

Beide Scripts erzeugt man beim Build oder auf dem Server und fügt sie als Text ein. Ohne `localStorage` (privater
Modus, gesperrt) tut das Script nichts, und die Seite zeigt das Theme, bis der Code läuft.

**Strenge CSP.** Das Inline-Script braucht ein Nonce oder einen Hash (`script-src`). Der `<style>`, den Script und
`installAccent` anlegen, braucht das Nonce der Seite in `style-src`: `createAccentScript(key, { nonce })` und
`installAccent(hex, { nonce })` setzen es auf das Element (nur base64-artige Werte werden angenommen), und ein
serverseitig gerendertes `<style id="kern-accent" nonce="…">` trägt das Nonce der Seite selbst. `applyAccent` /
`clearAccent` setzen Inline-Tokens über das CSSOM (`style.setProperty`), das `style-src` nicht blockiert: dort ist
kein Nonce nötig.

### `theme-color`

Die Browserleiste sollte normalerweise zur **Seite** passen, nicht zum Akzent: statische Metas mit `media` und den
Flächen des Themes (`ACCENT_GROUNDS['flower'].bg`, `ACCENT_GROUNDS['flower-wald'].bg`, wie `docs/index.html` von
nagellacke es heute tut). Soll die Leiste in der Akzentfarbe stehen, setzt `installAccent(hex, { themeColor: 'accent' })`
den Wert **jeder** vorhandenen `<meta name="theme-color">` (auch mit `media`; gibt es keine, wird eine angelegt), und
`removeAccent` oder ein späteres `installAccent` ohne die Option stellt die alten Werte wieder her. Die Schrift der
Leiste wählt der Browser selbst, hier ist kein Kontrast zu garantieren.

### Nur CSS, ohne JavaScript

`@mozra-the-great/kern/themes/accent.css` (nicht Teil von `themes.css`) setzt mit relativen Farben nur die
**Füllung**: `--k-accent` und `--k-on-accent` (Schwarz oder Weiß, mindestens 4,58:1 für jede sRGB-Farbe; im Browser
über einen Raster des Farbwürfels geprüft):

```html
<html data-theme="flower" data-k-accent style="--k-accent-color: #e91e8c"></html>
```

Mehr ist in CSS allein nicht sicher: `--k-primary`, `--k-accent-text`, `--k-accent-mark`, `--k-accent-soft` und
`--k-focus` brauchen 4,5:1 oder 3:1 auf einem Grund, den ein Stylesheet nicht messen kann (die Helligkeit muss
gesucht werden, je nach Theme in die andere Richtung). Dafür gilt `accentCss` / `installAccent`. Die Datei braucht
`color(from …)` und `round()` (Chrome 125, Safari 16.4, Firefox 128); ohne sie bleibt der Akzent des Themes.
`data-k-accent` nur zusammen mit `--k-accent-color` setzen. Kommt der Wert vom Server oder aus Eingaben, vor dem
Schreiben in ein `style`-Attribut prüfen (`accentTokens(value).ok`, nur dann `value` verwenden): sonst landet fremder Text
im Attribut.

### Custom Elements

`kern-elements.js` und jeder Einstieg, der `window.kern` setzt, bringen `window.kern.accent` mit (`tokens`, `css`,
`install`, `remove`, `apply`, `clear`, `script`, `grounds`, `tokenNames`: dieselben Funktionen und Typen). Ohne
Bundler genügt `import '@mozra-the-great/kern/elements/accent'`: es registriert kein Tag, setzt `window.kern.accent`
und exportiert die Funktionen.
