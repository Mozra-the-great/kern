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
