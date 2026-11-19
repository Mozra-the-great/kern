# kern

**Kern**-Komponenten für Svelte 5: ein Satz zugänglicher Bausteine, viele Marken.
Ein Theme setzt über `--k-*`-CSS-Variablen nicht nur Farben, sondern auch Form
(Radien, Randbreite), Tiefe (Schatten), Schrift und Bewegung. Dieselben
Komponenten sehen deshalb in Stuffcloud eckig mit Pixel-Schatten aus und in
Flower-Designs weich mit Pillen.

**Vorschau:** [alle Komponenten](https://mozra-the-great.github.io/kern/) ·
[als Custom Elements](https://mozra-the-great.github.io/kern/elements.html), mit Theme-Umschalter.
Die Seite wird bei jedem Push auf `main` neu gebaut.

Es gibt zwei Builds:

- **Svelte 5** (`dist/`): Komponenten mit Runes, Snippets und `bind:`.
- **Custom Elements** (`dist-elements/`): `<k-button>`, `<k-modal>` usw., für jede Seite ohne
  Svelte, als eine Datei mit allen Tags oder pro Element einzeln. Formularfelder nehmen über
  `ElementInternals` an `<form>` teil (Werte, Reset, Validierung). Mit TypeScript-Typen,
  React-19-JSX-Typen und `custom-elements.json`.

Keine Laufzeit-Abhängigkeiten außer Svelte selbst. Kein Tailwind.

## Themes

| `data-theme` | Quelle |
| --- | --- |
| `stuffcloud` (= `stuffcloud-dark`), `stuffcloud-light`, `stuffcloud-paper`, `stuffcloud-contrast` | Stuffcloud-Designsystem |
| `flower` (= `flower-creme`), `flower-wald` | Flower-Designs |
| `pop` (= `pop-light`), `pop-dark` | Pop-Designsystem (Look von stuffcloud) |
| Kagi-basiert | geplant |

Schriften werden nicht mitgeliefert. Stuffcloud braucht Inter, JetBrains Mono und
Silkscreen, Flower braucht Figtree, Pop Figtree 400–900 und JetBrains Mono (siehe `index.html`).

Zu Stuffcloud gehört Pixel-Art aus den Moodboards (Logo, Maskottchen, Tool-Sticker, Zeichen,
Saison-Deko, 115 Dateien) unter `@mozra-the-great/kern/assets/stuffcloud/…`, siehe [`assets/README.md`](assets/README.md).
Nur `Mascot` zeigt sie, und nur von einer URL, die du übergibst (siehe [Mascot](#mascot-pixel-art)).

Gegen das Aufblitzen des falschen Themes beim Laden liefert `createThemeScript('kern-theme', { followSystem: true })`
ein kleines Inline-Script für `<head>` (Schlüssel = `persist` des ThemeToggle; unter strenger CSP mit Nonce).
`<k-theme-toggle target="#id">` wirkt auf ein Element statt auf `<html>`. `<k-resizable>`-Paneele sind Kinder mit
`data-panel` (bis zu 8); unter 520 px Containerbreite stapeln sie sich. `<k-relative-time>` nennt die Stilvariante
`format-style`, weil `style` das HTML-Attribut ist.

**Nur eine Marke ausliefern.** `themes.css` enthält alle Marken (für die Demo und Seiten, die zur
Laufzeit wechseln). Eine App mit einer Marke importiert stattdessen deren Einstieg; er bringt die
Basis-Tokens mit und sonst nichts:

```js
import '@mozra-the-great/kern/themes/stuffcloud.css'; // oder flower.css, pop.css
```

Für Custom Elements ohne Bundler dasselbe als `<link rel="stylesheet" href="…/dist/themes/stuffcloud.css">`
(die Datei lädt `base.css` und `brands/stuffcloud.css` per `@import`). `npm test` baut jeden Einstieg mit
Vite und prüft, dass kein Selektor und keine Farbe einer anderen Marke darin landet. Komponenten
werden einzeln importiert (`import { Button } from '@mozra-the-great/kern'`): ein Svelte-Bundler
kompiliert nur die benutzten. Die Pixel-Art unter `assets/stuffcloud/` bleibt im Paket als einzelne
Dateien: keine Komponente importiert sie, sie landet also nur in einem Bundle, wenn du sie selbst
importierst (Entscheidung in #39, neu bewerten mit der Theme-Quelle in #37).

**Touch-Ziele.** Jedes bedienbare Teil ist mindestens `--k-tap-target` groß, sichtbar oder über eine
unsichtbare Trefferfläche: 44 px (`--k-tap-min`) bei grobem Zeiger (`pointer: coarse`), bei der Maus 0,
außer das Theme verlangt es (Stuffcloud und Pop: 44 px für jeden Zeiger, Icon-Buttons
`--k-tap-icon` 48 px; Stuffcloud-Buttons und -Felder 52 px, unter 760 px 56 px). Alle Höhen sind
Außenmaße, der Rand zählt mit.

**Tokens für Marken.** Neben Farbe, Form, Schrift und Größe gibt es abgeleitete Tokens, die ohne
eigenen Wert auf einen anderen zeigen: `--k-accent-mark` (Akzent als Markierung ohne Text: Fortschritt,
aktiver Tab, gewählter Rand; braucht 3:1), `--k-line-strong` (Rand von Karten, Dialogen, Toasts,
Menüs), `--k-line-dashed` (Ablagefläche), `--k-surface-info|ok|warn|danger|selected` (Grund ganzer
Statusflächen), `--k-bg-code`/`--k-fg-code`, `--k-fg-hint`, `--k-fg-soft`, `--k-fg-disabled`,
`--k-shadow-sm` und die Zwischenabstände `--k-space-2-5|3-5|6-5` (10/14/28 px). Welche
Stuffcloud-Variable welchem Token entspricht, steht in [`docs/themes.md`](docs/themes.md).

**Neues Theme.** Eine CSS-Datei `src/lib/themes/brands/<name>.css`, die die Variablen aus
`src/lib/themes/base.css` für `[data-theme^='<name>']` (Form, Schrift, Größe) und
`[data-theme='<name>-<variante>']` (Farben, nicht in `@media`) überschreibt, ein Einstieg
`src/lib/themes/<name>.css` (`@import './base.css'; @import './brands/<name>.css';`), ein `@import` in
`themes/index.css` und ein Eintrag in `exports`. **Jedes Theme muss `npm test` bestehen:** der
Kontrasttest liest die Theme-Dateien selbst und prüft für jede `data-theme`-Variante Textpaare (4,5:1)
und Ränder, Fokus und Markierungen (3:1).

## Installation und Pinning

Das Paket heißt `@mozra-the-great/kern` (der frühere Name ist auf npmjs.com an eine fremde Bibliothek vergeben).
Es liegt **nicht** auf der npm-Registry, sondern als Tarball an jedem
[GitHub-Release](https://github.com/Mozra-the-great/kern/releases). Das braucht kein Token,
und npm wie pnpm schreiben den Integritäts-Hash des Tarballs in die Lock-Datei: `npm ci` und
`pnpm install --frozen-lockfile` brechen ab, wenn die Datei hinter der URL nicht mehr dieselbe ist.
Voraussetzungen: Node ≥ 22 und Svelte ≥ 5.20 (Peer-Abhängigkeit, nötig für `$props.id()`).

URL-Muster (Version einsetzen, der Dateiname enthält sie ebenfalls):

```text
https://github.com/Mozra-the-great/kern/releases/download/v0.3.0/mozra-the-great-kern-0.3.0.tgz
```

**pnpm** (stuffcloud):

```bash
pnpm add https://github.com/Mozra-the-great/kern/releases/download/v0.3.0/mozra-the-great-kern-0.3.0.tgz
```

`package.json` bekommt die URL als Version, `pnpm-lock.yaml` einen Eintrag mit
`resolution: {integrity: sha512-…, tarball: https://…/mozra-the-great-kern-0.3.0.tgz}`.
CI installiert mit `pnpm install --frozen-lockfile`. Den `integrity`-Hash schreibt pnpm ab
Version 10; pnpm 9 speichert für URL-Tarballs nur die URL und prüft nichts.

**npm-Workspace** (nagellacke), im Workspace-Paket, das kern braucht:

```bash
npm install https://github.com/Mozra-the-great/kern/releases/download/v0.3.0/mozra-the-great-kern-0.3.0.tgz -w <workspace>
```

`package.json` bekommt die URL als Version, `package-lock.json` unter
`node_modules/@mozra-the-great/kern` die Felder `version`, `resolved` (die URL) und
`integrity` (`sha512-…`). CI installiert mit `npm ci`.

**Aktualisieren:** Release-Notizen und [`CHANGELOG.md`](CHANGELOG.md) lesen (unter 1.0 ist jede
Minor-Version potenziell ein Breaking Change), dann denselben Befehl mit der neuen URL ausführen.
Der Diff aus `package.json` und Lock-Datei zeigt genau eine neue Version und einen neuen Hash.
Eine Version nie überschreiben: ein Release wird nicht nachträglich ersetzt, sondern es gibt
ein neues Patch-Release.

**Hash prüfen:** Jedes Release enthält neben dem Tarball `….tgz.sha256` und `….tgz.sha512`
sowie den npm-Integritätswert in den Release-Notizen.

```bash
curl -fLO https://github.com/Mozra-the-great/kern/releases/download/v0.3.0/mozra-the-great-kern-0.3.0.tgz
curl -fLO https://github.com/Mozra-the-great/kern/releases/download/v0.3.0/mozra-the-great-kern-0.3.0.tgz.sha256
sha256sum -c mozra-the-great-kern-0.3.0.tgz.sha256
# Wert der Lock-Datei (ohne das Präfix "sha512-"):
openssl dgst -sha512 -binary mozra-the-great-kern-0.3.0.tgz | openssl base64 -A
```

Ein Git-Dependency (`github:Mozra-the-great/kern#v0.3.0`) funktioniert auch, weil `prepare`
`dist/` und `dist-elements/` baut. Die Lock-Datei hält dann nur den Commit, keinen Hash des
Inhalts, und die Installation braucht die Dev-Abhängigkeiten; deshalb ist der Tarball der
empfohlene Weg. Eine Veröffentlichung auf npm (mit Provenance) ist möglich, aber nicht eingerichtet.

**Versionierung:** SemVer, unter 1.0 bedeutet eine neue Minor-Version (`0.2` → `0.3`) mögliche
Breaking Changes, Patch-Versionen (`0.2.0` → `0.2.1`) enthalten Fixes und rückwärtskompatible
Ergänzungen. Die Regeln stehen oben in [`CHANGELOG.md`](CHANGELOG.md). Ein Release entsteht durch das
Tag `vX.Y.Z` auf `main`; der Workflow `release` baut den Tarball und legt das GitHub-Release an.

## Svelte

```svelte
<script>
	import '@mozra-the-great/kern/themes.css';
	import { Button, Input, Modal, Toaster, toast } from '@mozra-the-great/kern';
	let open = $state(false);
</script>

<!-- <html data-theme="flower"> -->
<Input label="Name" />
<Button onclick={() => toast.ok('Gespeichert.')}>Speichern</Button>
<Toaster />
```

## Custom Elements

```html
<!-- Mit Bundler: import '@mozra-the-great/kern/themes.css' (oder nur eine Marke: themes/stuffcloud.css)
     und '@mozra-the-great/kern/elements'.
     Ohne Bundler die Dateien aus node_modules ausliefern (Pfade hier relativ zur Seite). -->
<html data-theme="stuffcloud">
<link rel="stylesheet" href="node_modules/@mozra-the-great/kern/dist/themes/index.css" />
<script type="module" src="node_modules/@mozra-the-great/kern/dist-elements/kern-elements.js"></script>

<form>
	<k-input name="name" label="Name" required></k-input>
	<k-select name="size" label="Größe" options='[{"value":"s","label":"Klein"}]'></k-select>
	<k-button type="submit">Absenden</k-button>
</form>
<k-toaster></k-toaster>
<script> window.kern.toast('Hallo') </script>
```

Listen (`options`, `items`, `tabs`, `columns`, `rows`, `commands`, `nodes`, `expanded`, `steps`,
`suggestions`, `swatches`, `lines`, `format`, `values`, `data`, `status-labels`, `keys`, `labels`, `themes`, `sizes`,
`panels`, bei TagInput `value`, bei Typewriter `text`) werden als
JSON-Attribut übergeben. Attribute mit Vorgabe `true` (`pausable`, `pause-on-hover`, `once`, `in-view`,
`caret`, `blink` …) schaltet `="false"` ab; bei den Daten-Elementen heißen sie umgekehrt (`no-search`,
`no-stack`, `no-legend`, `no-last-dot`, `rising-is-bad`, `no-pulse`). `<k-stat>` nimmt eine `<k-sparkline>` im Slot `spark`.

Ereignisse (alle `bubbles` und `composed`, Wert in `detail`). **Ereignisse feuern nur bei
Nutzereingaben:** Setzt der Code `value`, `tabs`, `options`, `open`, `index` usw., kommt kein
`change`/`select`/`toggle`/`files`, wie bei nativen Feldern. Ein kontrollierter Wrapper (React
`value={x}` plus `onchange`) läuft so nicht in eine Schleife. Ereignisse werden nie während des
Renderns ausgelöst; ein Handler darf also sofort andere kern-Elemente ändern. Ausnahme `complete`:
es meldet das Ende einer Animation.

- `change`: Felder, Tabs, Combobox, DatePicker, Slider, NumberInput (Zahl oder `null`), PinInput,
  Rating, SegmentedControl, ColorPicker (Hex), TagInput (`string[]`), Pagination (Seite), Carousel (Folienindex)
- `complete`: PinInput (alle Felder gefüllt, `detail` = Code), Typewriter (ohne `loop`), Scramble,
  CountUp, Terminal
- `step`: Stepper mit `clickable`, Klick auf einen erledigten Schritt (`detail` = Index)
- `input`: Slider, während des Ziehens
- `select`: DropdownMenu, ContextMenu, CommandPalette, TreeView (`detail` = id), DataTable (`detail` =
  gewählte Schlüssel nach `row-key`), Heatmap (`detail` = `{date, value}`)
- `sort`: DataTable (`detail` = `{key, dir}`)
- `copy`: CopyButton und Code (`detail` = kopierter Text) · `copy-error`: CopyButton
- `change` außerdem: ThemeToggle (Theme-Id), Resizable (Größen in %, `number[]`) · `toggle` außerdem: Collapsible
- `toggle`: Popover (`detail` = offen), TreeView (`detail` = `{id, expanded}`)
- `files`: FileDrop (`detail` = `File[]`, auch als `el.files`)
- `close`: Modal, Drawer, Popover, CommandPalette · `dismiss`: Alert · `remove`: Tag

Toasts: `toast()` aus `@mozra-the-great/kern` und `window.kern.toast()` aus `kern-elements.js` schreiben in
denselben Speicher (`globalThis[Symbol.for('kern.toasts')]`). Ein Toast erscheint in jedem
`<Toaster />` und jedem `<k-toaster>` der Seite. Während einer Migration von React zu Svelte
(beide Builds auf einer Seite) also nur **einen** Toaster einbinden, sonst erscheint jeder Toast
doppelt: solange React-Seiten noch da sind `<k-toaster>` im gemeinsamen Layout, danach
`<Toaster />`. Aufrufen lässt sich `toast()` von beiden Seiten. `toasts` ist eine
schreibgeschützte Live-Liste; ändern nur über `toast()` und `dismissToast()`.

Slots: Tab-Inhalte sind Kinder mit `data-tab="<id>"`, Folien von `<k-carousel>` sind seine
Kinder. Benannte Slots: `footer` (Modal, Drawer, Card), `media` (Card), `actions` (Alert,
EmptyState, Navbar), `icon` (EmptyState), `brand` (Navbar), `trigger` (Popover, nur Inhalt
des Buttons). Bei `<k-context-menu>` ist der Standard-Slot die Zielfläche.

Combobox, DatePicker (sendet ISO `yyyy-mm-dd`), Slider, FileDrop, NumberInput, PinInput, Rating,
SegmentedControl und ColorPicker nehmen wie Input über `name` am Formular teil, TagInput mit einem
Eintrag pro Schlagwort (wiederholter `name`). Marquee, Reveal, Highlight und GridBackground zeigen ihren
Standard-Slot. Alle Effekte zeigen bei „Bewegung reduzieren“ sofort ihren Endzustand. Texte wie `prev-label`, `menu-label` oder `no-results` lassen sich
per Attribut übersetzen; die Vorgaben sind englisch.

### Einzelne Elemente laden

`kern-elements.js` registriert alle Tags in einer Datei. Wer nur einige braucht, lädt sie einzeln;
jeder Einstiegspunkt registriert genau sein Element, gemeinsamer Code (Svelte-Laufzeit, Bausteine)
liegt in geteilten Chunks und wird nur einmal geladen:

```js
import '@mozra-the-great/kern/elements/button';      // <k-button>
import '@mozra-the-great/kern/elements/input';       // <k-input>
import '@mozra-the-great/kern/elements/date-picker'; // <k-date-picker>
import { toast } from '@mozra-the-great/kern/elements/toaster'; // <k-toaster> + window.kern
```

Der Name ist der Tag ohne `k-` (`k-segmented-control` → `elements/segmented-control`).
`elements/accordion` registriert auch `<k-accordion-item>`; `elements/toaster` exportiert `toast`
und `dismissToast` und setzt `window.kern`. Ohne Bundler liegen die Dateien unter
`dist-elements/elements/<name>.js`. Beide Wege lassen sich mischen (die Registrierung ist
idempotent), dann lädt die Seite aber zwei Kopien der Laufzeit; besser einen Weg wählen.

| Bundle (gemessen beim Einführen, je Datei gzip) | roh | gzip |
|---|---:|---:|
| `kern-elements.js` (alle 74 Tags) | 674 kB | 146 kB |
| 5 Elemente (button, input, select, modal, tabs) | 118 kB | 38 kB |
| 1 Element (button) | 85 kB | 26 kB |

CI misst die Größen (`npm run size`) und schlägt fehl, wenn eine um mehr als 10 % über
`scripts/ci/size-baseline.json` wächst.

**Tag-Präfix und Kollisionen:** Das Präfix `k-` ist für kern reserviert und fest (Svelte kompiliert
jede Element-Klasse einmal, und eine Klasse lässt sich nur unter einem Namen registrieren). Die
Registrierung ist idempotent (`customElements.get(tag)` vor `define`): mehrere Einstiegspunkte oder
zwei kern-Kopien auf einer Seite registrieren jeden Tag einmal, die erste gewinnt. Gehört ein
`k-*`-Tag schon einer anderen Bibliothek, lässt kern ihn in Ruhe und warnt einmal in der Konsole.

### Formulare: native Attribute und Validierung

Die Formular-Elemente reichen native Attribute an ihr inneres Feld weiter; Änderungen nach dem
Laden folgen, Entfernen entfernt sie auch innen:

| Element | weitergereichte Attribute (zusätzlich zu den eigenen Props) |
|---|---|
| `k-input` | `maxlength`, `minlength`, `pattern`, `readonly`, `autocapitalize`, `spellcheck`, `enterkeyhint`, `min`, `max`, `step`, `size`, `multiple`, `title`, `aria-label`, `aria-description` |
| `k-textarea` | `maxlength`, `minlength`, `readonly`, `autocomplete`, `autocapitalize`, `spellcheck`, `enterkeyhint`, `cols`, `wrap`, `title`, `aria-label`, `aria-description` (`rows` ist Prop) |
| `k-select` | `size`, `autocomplete`, `title`, `aria-label`, `aria-description` (`multiple` nicht: der Wert ist ein String; dafür `k-tag-input` oder Checkboxen) |
| `k-checkbox`, `k-slider` | `title`, `aria-label`, `aria-description` |
| `k-switch` | `required`, `title`, `aria-label`, `aria-description` |
| NumberInput, DatePicker | `min`, `max`, `readonly` (NumberInput) als Props; NumberInput-`step` ist die Pfeil-Schrittweite, keine Bedingung |

Für alle Formular-Elemente gilt außerdem: `autofocus` fokussiert das innere Feld, `form="id"`
verknüpft mit einem Formular außerhalb, `disabled` nimmt das Element aus Validierung und Versand
(beides nativ über `ElementInternals`). ID-Verweise (`aria-labelledby`, `aria-describedby`,
`list`) reichen nicht durch die Shadow-Grenze; dafür gibt es `label`, `hint` und `error`.

Die Validierung läuft wie bei nativen Feldern: `required`, `pattern`, `minlength`, `maxlength`,
`min`, `max` und `step` landen in `ElementInternals`, also wirken `form.checkValidity()`,
`form.reportValidity()`, die Prüfung beim Absenden, `:invalid`/`:user-invalid` und die Meldung des
Browsers am inneren Feld. Jedes Formular-Element hat `validity`, `validationMessage`,
`checkValidity()`, `reportValidity()` und `setCustomValidity()` wie ein natives Feld.
NumberInput und DatePicker prüfen `min`/`max`, RadioGroup (neu: `required`), Rating, Combobox,
ColorPicker, TagInput (mindestens ein Schlagwort) und FileDrop `required`; ein halb gefüllter
PinInput ist ungültig. Nach `el.value = …` sind `el.validity` und `el.checkValidity()` sofort aktuell;
`form.checkValidity()` im selben Task sieht die Änderung erst nach einem Mikrotask.
`form.reset()` setzt alle Felder auf ihren Anfangswert zurück.

### Autofill und Passwort-Manager

Geprüft mit Chrome 157 (Windows) und den Autofill-Diagnose-Schaltern
(`--show-autofill-type-predictions`, `--show-autofill-signatures`): Chrome erkennt die Felder in
`<k-input>` genauso wie native Felder. `autocomplete="username"`, `current-password`, `email` und
`one-time-code` ergeben dieselben Typen; der Passwort-Manager markiert Benutzername- und
Passwortfeld (`username_element`, `password_element`), und die Felder eines `<form>` aus
kern-Elementen bilden ein gemeinsames Formular. `autocomplete` und `name` gehen ans innere Feld,
`<k-pin-input>` setzt `one-time-code` selbst. Nicht geprüft: Firefox, Safari und
Passwort-Manager-Erweiterungen (die meisten durchsuchen offene Shadow Roots). Erkennt ein Manager
die Felder nicht, für Login, Registrierung und Passwort-Reset native `<input>` mit den Theme-Tokens
verwenden; die Werte gehen dann ohnehin direkt ins Formular.

### TypeScript und React 19

Das Paket bringt Typen mit: `import '@mozra-the-great/kern/elements'` (oder ein einzelnes Element)
ergänzt `HTMLElementTagNameMap`, also ist `document.querySelector('k-input')` ein `KInputElement`
mit typisierten Props, `addEventListener('change', e => e.detail)` und `window.kern`. Datenformen wie
`TabItem`, `SelectOption` oder `MenuEntry` und pro Tag `K…Props`/`K…Events` sind exportiert.
Für JSX in React 19 einmal in der App:

```tsx
import '@mozra-the-great/kern/elements';
import type {} from '@mozra-the-great/kern/elements/react';

<k-input label="Name" value={name} required maxlength={60} onchange={(e) => setName(e.detail)} />
<k-modal open={open} title="Löschen?" onclose={() => setOpen(false)}>
	<p>…</p>
	<div slot="footer"><k-button onclick={() => setOpen(false)}>OK</k-button></div>
</k-modal>
<k-tabs tabs={tabs} value={tab} onchange={(e) => setTab(e.detail)} />
```

- **Properties vs. Attribute:** React 19 setzt eine Prop als Property, wenn das Element sie kennt
  (alle kern-Props, auch Arrays und Objekte wie `tabs` oder `options`), sonst als Attribut
  (`maxlength`, `pattern`, `aria-*`). JSON-Strings gehen auch, sind in React aber unnötig.
- **Ereignisse:** `on` plus exakter Ereignisname, klein geschrieben: `onchange` → `change`,
  `onclose`, `oncopy-error`; für die kern-Ereignisse kennen die Typen nur diese Schreibweise (`onChange` usw. sind dort weggelassen).
  Der Wert steht in `event.detail` und ist typisiert; native Ereignisse gehen klein geschrieben
  auch (`onclick`, `oninput`).
- **Slots:** Kinder mit `slot="footer"` usw.; Tab-Inhalte mit `data-tab`.
- **Kontrollierte Felder:** `value={x}` plus `onchange`. Ereignisse feuern nur bei
  Nutzereingaben, nie beim Setzen von `value`; das läuft also nicht in eine Schleife. `change`
  kommt beim Bestätigen (Blur/Enter), für jeden Tastendruck das native `oninput` nutzen und
  den Wert aus `e.currentTarget.value` lesen.
- **Formulare:** die Elemente sind echte Formularfelder (`name`, `FormData`, Reset, Validierung,
  `form`-Attribut); ein `<form onSubmit>` sieht sie wie native Felder. Absenden mit
  `<k-button type="submit">`.

### Manifest

`custom-elements.json` (Custom Elements Manifest 2.1, im Paket und als
`@mozra-the-great/kern/custom-elements.json`) beschreibt alle Tags mit Attributen, Properties,
Typen, Ereignissen samt `detail`-Typ und Slots, z. B. für Editor-Unterstützung und Doku-Werkzeuge.
`scripts/elements-manifest.mjs` erzeugt es und die Typen aus den Wrappern in `src/elements/`;
CI prüft, dass die eingecheckte Datei aktuell ist.

## Mascot (Pixel-Art)

Die Laufzeit für Stuffclouds Pixel-Art liegt in kern (Entscheidung in #55; Verhalten nach
stuffclouds ADR 0008). `Mascot` (Custom Element `<k-mascot>`) zeigt **jede** mitgelieferte SVG aus
`assets/stuffcloud/` (oder eine eigene) als `<img>`:

- nur ganzzahlige Skalen: `scale` (Standard 8) und `compactScale` unter 760 px; Bruchteile werden
  abgeschnitten, alles unter 1 wird 1. `width`/`height` reservieren die Box, bevor das Bild lädt
  (kein Layout-Shift);
- Leerlauf-Wippen nur mit `transform` und `steps(1)`, Periode und Höhe über die Tokens
  `--k-mascot-bob-period` (1.2s) und `--k-mascot-bob-offset` (4px);
- pausiert außerhalb des Viewports (`IntersectionObserver`) und in Hintergrund-Tabs
  (`visibilitychange`); `data-motion` ist `running`, `paused` oder `still`;
- bei `prefers-reduced-motion: reduce` die stille Pose (per CSS, folgt einer Änderung ohne Reload),
  `animated={false}` ebenso;
- dekorativ (`alt=""`, `aria-hidden`), mit `label` ein benanntes Bild; kein Text, kein Canvas.

```svelte
<script>
  import { Mascot } from '@mozra-the-great/kern';
  import axo from '@mozra-the-great/kern/assets/stuffcloud/mascots/axo.svg?url';
</script>

<Mascot name="stuffy" src={axo} scale={16} compactScale={10} />
<Mascot name="tool-stickers/sticker-qr" base="/art/stuffcloud" scale={4} animated={false} />
<Mascot src="/eigene/art.svg" cols={12} rows={9} label="Seite abgelaufen" />
```

`name` ist ein Stuffcloud-Name oder ein Pfad unter `assets/stuffcloud/` ohne `.svg`; daraus kommt
das Pixelraster (`STUFFCLOUD_ART`). Die URL kommt aus `src` oder aus `base` (wo du den Ordner
`assets/stuffcloud/` ausspielst) plus Pfad. Für Art außerhalb des Katalogs `cols`/`rows` angeben.

**CSP:** Die Bilder müssen Dateien vom eigenen Origin sein (`img-src 'self'`), keine `data:`-URIs.
Vite inlined kleine Assets per Standard als `data:` – die SVGs sind alle unter 4 kB. Deshalb entweder
SVGs nie inlinen:

```js
// vite.config.js
export default { build: { assetsInlineLimit: (file) => (file.endsWith('.svg') ? false : undefined) } };
```

oder den Ordner `node_modules/@mozra-the-great/kern/assets/stuffcloud/` beim Build nach `public/`
kopieren und `base` setzen. Ohne Bundler: `<k-mascot name="stuffy" base="/art/stuffcloud"></k-mascot>`.

Namen für den 1:1-Umstieg aus stuffcloud (`MASCOT_SOURCES`, gleiche Felder `file`/`animal`/`cols`/`rows`,
dazu `art`):

| Name | Datei | Tier |
| --- | --- | --- |
| `stuffy` | `mascots/axo.svg` | Axolotl |
| `mochi` | `mascots/mascot-cat.svg` | Katze |
| `hop` | `mascots/mascot-frog.svg` | Frosch |
| `bun` | `mascots/mascot-bunny.svg` | Hase |
| `bloop` | `mascots/mascot-jelly.svg` | Qualle |
| `waddle` | `mascots/mascot-penguin.svg` | Pinguin |
| `ember` | `mascots/mascot-fox.svg` | Fuchs |
| `boo` | `mascots/mascot-ghost.svg` | Geist |
| `cumulo` | `mascots/mascot-cloudy.svg` | Wolke |

Weitere Exporte: `MASCOT_NAMES`, `artPath`, `artUrl(base, name)`, `normaliseScale`, `integerScale`
(größte ganze Skala für eine Zielbreite), `mascotSize`, `BOB_PERIOD_MS`, `BOB_OFFSET_PX`,
`COMPACT_MAX_WIDTH_PX`. Stuffclouds Benchmark (`bench/`) bleibt in stuffcloud; kern prüft dasselbe
Verhalten mit Playwright (`tests/mascot/`).

## Komponenten (Kern-Set)

Aktionen: Button, IconButton, Link, CopyButton, ThemeToggle, DropdownMenu, ContextMenu, CommandPalette ·
Status: Badge, Tag, Avatar, StatusDot, Spinner, Progress, ProgressRing, Skeleton, Alert, Toaster/`toast()` ·
Formulare: Field, Label, Input, Textarea, Select, Combobox, DatePicker, NumberInput, PinInput, TagInput, ColorPicker, Slider, Rating, FileDrop, Checkbox, RadioGroup, SegmentedControl, Switch ·
Inhalt: Card, Divider, EmptyState, Table (sortierbar, auf Mobil als Karten), Carousel, Code, Kbd, RelativeTime,
Collapsible, ScrollArea, Resizable (Paneele mit tastaturbedienbaren Trennern) ·
Daten: DataTable (Filter, Sortierung, Seiten, Zeilenauswahl), Stat, Sparkline, Heatmap, HistoryBar, Timeline ·
Overlays: Modal, Drawer, Tooltip, Popover ·
Navigation: Navbar, Breadcrumb, Pagination, Stepper, Tabs, Accordion/AccordionItem, TreeView ·
Effekte: Typewriter, Caret, Scramble, CountUp, Odometer, Marquee, Reveal, Highlight, GridBackground, Terminal ·
Pixel-Art: Mascot

Ziel ist ein Umfang wie [cock](https://github.com/JoshiCodes/cock) oder größer.

Overlays (Popover, Combobox, DatePicker, ContextMenu) liegen mit `position: fixed`
über der Seite, ohne Portal. Ein Vorfahr mit `transform`, `filter` oder `contain`
verschiebt deshalb ihre Position.

## Entwicklung

```bash
npm ci
npm run dev        # Demo: /index.html (Svelte) und /elements.html (Custom Elements)
npm run check      # svelte-check
npm run build      # dist/, dist-elements/ (+ Typen, custom-elements.json), demo-dist/
npm test           # Vitest: Theme-Kontrast, Marken-Einstiege, Pixel-Art-Katalog
npx playwright install chromium   # einmalig
npm run test:targets              # Playwright: Touch-Ziele in der gebauten Demo (nach npm run build)
npm run test:elements             # Playwright: gebaute Custom Elements (nach npm run build)
npm run test:types                # Element-Typen gegen eine strikte React-19-Fixture (nach dem Build)
npm run size                      # Größenbudget der Custom Elements
npm run test:mascot               # Playwright: <k-mascot> unter strenger CSP (nach npm run build)
npm run assets:check              # Pixel-Art gegen assets/stuffcloud/manifest.json (Drift-Check)
```

`npm ci` baut über `prepare` bereits `dist/` und `dist-elements/`. Release: `version` in
`package.json` anheben, `[Unreleased]` in `CHANGELOG.md` in einen datierten Abschnitt verschieben,
PR mergen, dann `vX.Y.Z` auf `main` taggen und pushen.

## Lizenz

GNU General Public License v3.0 oder später, siehe [`LICENSE`](LICENSE) und [`NOTICE`](NOTICE).
