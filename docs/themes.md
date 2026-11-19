# Theme tokens

Every component reads only `--k-*` variables. `src/lib/themes/base.css` defines all of them
with neutral values; a brand file under `src/lib/themes/brands/` overrides what its design
differs in. Derived tokens (`--k-accent-mark`, `--k-line-strong`, `--k-surface-*`, ...) point at
another token by default, so a theme only sets them when its design has its own value.

## stuffcloud variables and their kern tokens (theme `code`)

Source: stuffcloud's `web/apps/web/src/styles/tokens.css` + `theme.css` (dark theme, from
`docs/design/prototypes/stuff.css`) and the stuffcloud design system (`tokens.json`). The design is the kern theme `code` (called
`stuffcloud` until #85; the old `data-theme` values stay as aliases until 1.0). Values are for
`data-theme="code"` (= `code-dark`).

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
| border-control | `#6e6e78` | `--k-border` | `#6e6e78` | the app's `--field-border` is `#6c6c76`; kern follows the design system (decided in #37) |
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
| shadow-pixel-sm / toast `--shadow` | `4px 4px 0 rgba(0,0,0,.4)` | `--k-shadow-sm` | same | Toast |
| target-min | 44px | `--k-tap-min`, `--k-tap-target`, `--k-control-h-sm` | 44px | every pointer |
| target-icon | 48px | `--k-tap-icon` | 48px | IconButton, CopyButton, dialog close |
| target-field / `--control-h` | 52px (56px below 760px) | `--k-control-h` | 52px / 56px | Button, Input, Select, ... |
| spacing 4 … 56 | | `--k-space-1` … `--k-space-9` | same | |
| spacing 10 / 14 / 28 | | `--k-space-2-5` / `--k-space-3-5` / `--k-space-6-5` | same | |

The light, paper and contrast variants exist only in the design system; it has no tinted
state surfaces, code/hint colours or drop line for them, so they keep the base defaults.
`--k-line-strong` there is derived (30 % from `line` toward `border`, the ratio of the dark pair).

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
