# Theme tokens

Every component reads only `--k-*` variables. `src/lib/themes/base.css` defines all of them
with neutral values; a brand file under `src/lib/themes/brands/` overrides what its design
differs in. Derived tokens (`--k-accent-mark`, `--k-line-strong`, `--k-surface-*`, ...) point at
another token by default, so a theme only sets them when its design has its own value.

## Stuffcloud variables and their kern tokens

Source: stuffcloud's `web/apps/web/src/styles/tokens.css` + `theme.css` (dark theme, from
`docs/design/prototypes/stuff.css`) and the Stuffcloud design system (`tokens.json`). Values are
for `data-theme="stuffcloud"` (= `stuffcloud-dark`).

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

## Contract

`npm test` checks, for every `data-theme` value a theme file names:

- text 4.5:1: fg, fg-muted, fg-hint, fg-soft on bg / raised / sunken; fg-code on bg-code and
  bg-sunken; on-primary, on-accent, on-danger on their fills; link, accent-text, danger, ok,
  warn, info on bg, raised and their `-soft` and `surface-*`; fg and fg-muted on every `surface-*`.
- non-text 3:1: border on bg / raised / sunken, line-dashed on bg / sunken, focus on bg / raised /
  sunken, accent-mark on bg / raised / sunken, primary on bg / raised, danger on raised.
