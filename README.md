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
- **Custom Elements** (`dist-elements/kern-elements.js`): `<k-button>`, `<k-modal>` usw.,
  für jede Seite ohne Svelte. Formularfelder nehmen über `ElementInternals` an `<form>` teil.

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
Saison-Deko) unter `@mozra-the-great/kern/assets/stuffcloud/…`, siehe [`assets/README.md`](assets/README.md).
Die Komponenten laden sie nie; sie sind für eigene Seiten gedacht.

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
kompiliert nur die benutzten. Die Pixel-Art unter `assets/stuffcloud/` bleibt vorerst im Paket: keine
Komponente lädt sie, sie landet also nie in einem Bundle, nur in `node_modules` (Entscheidung in #39,
neu bewerten mit der Theme-Quelle in #37).

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
https://github.com/Mozra-the-great/kern/releases/download/v0.2.0/mozra-the-great-kern-0.2.0.tgz
```

**pnpm** (stuffcloud):

```bash
pnpm add https://github.com/Mozra-the-great/kern/releases/download/v0.2.0/mozra-the-great-kern-0.2.0.tgz
```

`package.json` bekommt die URL als Version, `pnpm-lock.yaml` einen Eintrag mit
`resolution: {integrity: sha512-…, tarball: https://…/mozra-the-great-kern-0.2.0.tgz}`.
CI installiert mit `pnpm install --frozen-lockfile`. Den `integrity`-Hash schreibt pnpm ab
Version 10; pnpm 9 speichert für URL-Tarballs nur die URL und prüft nichts.

**npm-Workspace** (nagellacke), im Workspace-Paket, das kern braucht:

```bash
npm install https://github.com/Mozra-the-great/kern/releases/download/v0.2.0/mozra-the-great-kern-0.2.0.tgz -w <workspace>
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
curl -fLO https://github.com/Mozra-the-great/kern/releases/download/v0.2.0/mozra-the-great-kern-0.2.0.tgz
curl -fLO https://github.com/Mozra-the-great/kern/releases/download/v0.2.0/mozra-the-great-kern-0.2.0.tgz.sha256
sha256sum -c mozra-the-great-kern-0.2.0.tgz.sha256
# Wert der Lock-Datei (ohne das Präfix "sha512-"):
openssl dgst -sha512 -binary mozra-the-great-kern-0.2.0.tgz | openssl base64 -A
```

Ein Git-Dependency (`github:Mozra-the-great/kern#v0.2.0`) funktioniert auch, weil `prepare`
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

## Komponenten (Kern-Set)

Aktionen: Button, IconButton, Link, CopyButton, ThemeToggle, DropdownMenu, ContextMenu, CommandPalette ·
Status: Badge, Tag, Avatar, StatusDot, Spinner, Progress, ProgressRing, Skeleton, Alert, Toaster/`toast()` ·
Formulare: Field, Label, Input, Textarea, Select, Combobox, DatePicker, NumberInput, PinInput, TagInput, ColorPicker, Slider, Rating, FileDrop, Checkbox, RadioGroup, SegmentedControl, Switch ·
Inhalt: Card, Divider, EmptyState, Table (sortierbar, auf Mobil als Karten), Carousel, Code, Kbd, RelativeTime,
Collapsible, ScrollArea, Resizable (Paneele mit tastaturbedienbaren Trennern) ·
Daten: DataTable (Filter, Sortierung, Seiten, Zeilenauswahl), Stat, Sparkline, Heatmap, HistoryBar, Timeline ·
Overlays: Modal, Drawer, Tooltip, Popover ·
Navigation: Navbar, Breadcrumb, Pagination, Stepper, Tabs, Accordion/AccordionItem, TreeView ·
Effekte: Typewriter, Caret, Scramble, CountUp, Odometer, Marquee, Reveal, Highlight, GridBackground, Terminal

Ziel ist ein Umfang wie [cock](https://github.com/JoshiCodes/cock) oder größer.

Overlays (Popover, Combobox, DatePicker, ContextMenu) liegen mit `position: fixed`
über der Seite, ohne Portal. Ein Vorfahr mit `transform`, `filter` oder `contain`
verschiebt deshalb ihre Position.

## Entwicklung

```bash
npm ci
npm run dev        # Demo: /index.html (Svelte) und /elements.html (Custom Elements)
npm run check      # svelte-check
npm run build      # dist/, dist-elements/, demo-dist/
npm test           # Vitest: Theme-Kontrast und Marken-Einstiege
npx playwright install chromium   # einmalig
npm run test:targets              # Playwright: Touch-Ziele in der gebauten Demo (nach npm run build)
```

`npm ci` baut über `prepare` bereits `dist/` und `dist-elements/`. Release: `version` in
`package.json` anheben, `[Unreleased]` in `CHANGELOG.md` in einen datierten Abschnitt verschieben,
PR mergen, dann `vX.Y.Z` auf `main` taggen und pushen.

## Lizenz

GNU General Public License v3.0 oder später, siehe [`LICENSE`](LICENSE) und [`NOTICE`](NOTICE).
