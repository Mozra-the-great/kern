# kern

**Kern**-Komponenten für Svelte 5: ein Satz zugänglicher Bausteine, viele Marken.
Ein Theme setzt über `--k-*`-CSS-Variablen nicht nur Farben, sondern auch Form
(Radien, Randbreite), Tiefe (Schatten), Schrift und Bewegung. Dieselben
Komponenten sehen deshalb in Code eckig mit Pixel-Schatten aus und in
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

**Dokumentation für Apps, die kern nutzen:**

- [Leitfaden](docs/consumer-guide.md): Installation und Pinning mit Prüfsummen, Aktualisieren, Theme-Einstiege,
  `data-theme`, Schriften, Akzentfarbe, Kontrastmodus, Bundler und CSP, Umstieg von stuffcloud
- [API-Referenz](docs/api/reference.md): Props, Callbacks, Snippets, Attribute, Ereignisse und Slots jeder Komponente
  und jedes Elements, aus den Quellen erzeugt ([Lesehilfe](docs/api/README.md))
- [React 19](docs/react.md): die Custom Elements in React, Properties und Attribute, Ereignisse, Formulare, was die
  Test-App belegt
- [Barrierefreiheit](docs/accessibility.md): Ziel WCAG 2.2 AA, Prüfungen, bekannte Grenzen
- [Themes und Tokens](docs/themes.md), [Tests](docs/testing.md)

## Themes

| `data-theme` | Quelle |
| --- | --- |
| `code` (= `code-dark`), `code-light`, `code-paper`, `code-contrast` | Code-Designsystem (zuerst für stuffcloud gezeichnet) |
| `flower` (= `flower-creme`), `flower-wald` | Flower-Designs |
| `pop` (= `pop-light`), `pop-dark` | Pop-Designsystem (Look von stuffcloud) |
| `line` (= `line-dark`), `line-light` | Line-Designsystem (Kagi-basierte Richtung) |

**Umbenannt (#85):** das Theme `stuffcloud` heißt jetzt `code` (kerns Themes sind allgemeine Standard-Designs; die
stuffcloud-App nutzt Code weiter). Die alten Namen bleiben **bis 1.0 als veraltete Aliase** erhalten und liefern genau
dieselben Tokens: `data-theme="stuffcloud"` (= `code`), `stuffcloud-dark`, `stuffcloud-light`, `stuffcloud-paper`,
`stuffcloud-contrast`, jeweils samt `@media`-Regeln wie der 56-px-Höhe unter 760 px;
`@mozra-the-great/kern/themes/stuffcloud.css` zeigt auf dieselbe Datei wie `themes/code.css` (`dist/themes/stuffcloud.css` bleibt als Einzeiler-`@import` für Pfade ohne Bundler). Neu schreiben:

| bisher | neu |
| --- | --- |
| `data-theme="stuffcloud"`, `stuffcloud-dark`, `-light`, `-paper`, `-contrast` | `code`, `code-dark`, `code-light`, `code-paper`, `code-contrast` |
| `@mozra-the-great/kern/themes/stuffcloud.css` | `@mozra-the-great/kern/themes/code.css` |
| `@mozra-the-great/kern/assets/stuffcloud/…` | `@mozra-the-great/kern/assets/code/…` |
| `STUFFCLOUD_ART`, `StuffcloudArt`, `isStuffcloudArt` | `CODE_ART`, `CodeArt`, `isCodeArt` |

Ein im Browser gespeichertes `stuffcloud`-Theme (ThemeToggle, `createThemeScript`) bleibt gültig und wechselt
weiter innerhalb der alten Schreibweise (`stuffcloud` ↔ `stuffcloud-light`).

Schriften werden nicht mitgeliefert. Code braucht Inter, JetBrains Mono und
Silkscreen, Flower braucht Figtree, Pop Figtree 400–900 und JetBrains Mono, Line Outfit 400–700, Inter und JetBrains Mono (siehe `index.html`).

Zu jeder Marke gehören Grafiken unter `@mozra-the-great/kern/assets/<marke>/…`, siehe [`assets/README.md`](assets/README.md):
Code Pixel-Art aus den stuffcloud-Moodboards (Logo, Maskottchen, Tool-Sticker, Zeichen, Saison-Deko, 115 Dateien),
Pop Vektor-Maskottchen, Outfits, Accessoires, Tool-Icons und Saison-Abzeichen (88), Line Strich-Maskottchen,
Outfits, Tool-Icons, Saison-Deko und Illustrationen (48), Flower Blüten, Blätter, Bäume und ein Banner ohne Text (47). Die Komponenten
laden keine davon; du bindest sie per `<img alt="">` ein. Die Code-Pixel-Art zeigt auch `Mascot`
(siehe [Mascot](#mascot-pixel-art)). Der Ordner der Pixel-Art heißt `assets/code/` (bis zur Umbenennung #85:
`assets/stuffcloud/`); `@mozra-the-great/kern/assets/stuffcloud/…` löst bis 1.0 weiter auf dieselben Dateien auf
(Alias in `exports`, kein zweiter Satz Dateien im Paket; gilt für Imports, nicht für Dateipfade in `node_modules`).

Gegen das Aufblitzen des falschen Themes beim Laden liefert `createThemeScript('kern-theme', { followSystem: true })`
ein kleines Inline-Script für `<head>` (Schlüssel = `persist` des ThemeToggle; unter strenger CSP mit Nonce).
`<k-theme-toggle target="#id">` wirkt auf ein Element statt auf `<html>`. `<k-resizable>`-Paneele sind Kinder mit
`data-panel` (bis zu 8); unter 520 px Containerbreite stapeln sie sich. `<k-relative-time>` nennt die Stilvariante
`format-style`, weil `style` das HTML-Attribut ist.

**Nur eine Marke ausliefern.** `themes.css` enthält alle Marken (für die Demo und Seiten, die zur
Laufzeit wechseln). Eine App mit einer Marke importiert stattdessen deren Einstieg; er bringt die
Basis-Tokens mit und sonst nichts:

```js
import '@mozra-the-great/kern/themes/code.css'; // oder flower.css, pop.css, line.css
```

Für Custom Elements ohne Bundler dasselbe als `<link rel="stylesheet" href="…/dist/themes/code.css">`
(die Datei lädt `base.css` und `brands/code.css` per `@import`). `npm test` baut jeden Einstieg mit
Vite und prüft, dass kein Selektor und keine Farbe einer anderen Marke darin landet. Komponenten
werden einzeln importiert (`import { Button } from '@mozra-the-great/kern'`): ein Svelte-Bundler
kompiliert nur die benutzten. Die Pixel-Art unter `assets/code/` bleibt im Paket als einzelne
Dateien: keine Komponente importiert sie, sie landet also nur in einem Bundle, wenn du sie selbst
importierst (Entscheidung in #39, mit der Theme-Quelle in #37 bestätigt: die Pixel-Art ist kein Token, ihr Vertrag bleibt `assets/code/manifest.json`).

**Touch-Ziele.** Jedes bedienbare Teil ist mindestens `--k-tap-target` groß, sichtbar oder über eine
unsichtbare Trefferfläche: 44 px (`--k-tap-min`) bei grobem Zeiger (`pointer: coarse`), bei der Maus 0,
außer das Theme verlangt es (Code und Pop: 44 px für jeden Zeiger, Icon-Buttons
`--k-tap-icon` 48 px; Code-Buttons und -Felder 52 px, unter 760 px 56 px). Alle Höhen sind
Außenmaße, der Rand zählt mit.

**Tokens für Marken.** Neben Farbe, Form, Schrift und Größe gibt es abgeleitete Tokens, die ohne
eigenen Wert auf einen anderen zeigen: `--k-accent-mark` (Akzent als Markierung ohne Text: Fortschritt,
aktiver Tab, gewählter Rand; braucht 3:1), `--k-line-strong` (Rand von Karten, Dialogen, Toasts,
Menüs), `--k-line-dashed` (Ablagefläche), `--k-surface-info|ok|warn|danger|selected` (Grund ganzer
Statusflächen), `--k-bg-code`/`--k-fg-code`, `--k-fg-hint`, `--k-fg-soft`, `--k-fg-disabled`,
`--k-shadow-sm` und die Zwischenabstände `--k-space-2-5|3-5|6-5` (10/14/28 px). Welche
Stuffcloud-Variable welchem Token entspricht, steht in [`docs/themes.md`](docs/themes.md).

**Quelle des Code-Themes (#37).** kern besitzt das Theme `code`; gezeichnet ist es nach stuffclouds
`docs/design` (`stuff.css` und Mockups), und wo die Quellen sich widersprechen, gilt `docs/design`. Die
eine maschinenlesbare Quelle ist `src/lib/themes/code.tokens.json` (im Paket als
`@mozra-the-great/kern/themes/code.tokens.json`): jeder Token mit Wert und Herkunft im Design.
`brands/code.css` wird daraus erzeugt (`npm run tokens:code`). Ein eingecheckter Schnappschuss der
Designwerte (`scripts/ci/code-theme-snapshot.json`) ist der Vertrag mit stuffcloud; `npm run tokens:check`
läuft in CI und schlägt fehl, wenn CSS, Quelle und Schnappschuss auseinanderlaufen oder das Design einen
Token bekommt, über den das Theme nicht entschieden hat. Gegen einen stuffcloud-Checkout (auch aus
stuffclouds CI mit einem kern-Checkout): `node scripts/ci/code-theme.mjs --against <stuffcloud>`.
Die Varianten `code-light`, `-paper` und `-contrast` gehören **nicht** zu stuffclouds Design (das ist nur
dunkel); kern behält sie für andere Nutzer, mit den Werten des Designsystem-Artefakts.
`npm run neutrality:check` stellt sicher, dass Themes und Marken-Grafiken keine betreiberspezifischen Werte
enthalten (Domains, Namen, E-Mail, Hostnamen; eigene Liste über das Actions-Secret `KERN_FORBIDDEN_TERMS`).
Ablauf zum Auffrischen und alle Details: [`docs/themes.md`](docs/themes.md#code-theme-source-37).

**Komponenten-Look je Theme (#38).** Button, Input, Select, Field, Checkbox, Card, Tabs, Modal, Progress,
Toaster und FileDrop lesen eigene Tokens (`--k-button-font`, `--k-field-font`, `--k-tab-divider-w`,
`--k-modal-title-size`, ...). Ihre Standardwerte sind genau das bisherige Aussehen; Flower, Pop und Line
sehen unverändert aus. Code setzt sie so, dass die Komponenten wie stuffclouds eigene aussehen:
Buttons in Inter 600 15 px ohne Versalien, Felder in JetBrains Mono 15 px auf transparentem Grund,
Tabs als Zellenleiste, der Dialog wie im Design (32-px-Titel, unter 760 px gestapelte Aktionen). Die
Tabelle der Tokens und die Liste der bewusst verbleibenden Unterschiede steht in
[`docs/themes.md`](docs/themes.md#component-tokens-38). Screenshot-Tests (`tests/elements/visual.spec.ts`)
prüfen Code hell und dunkel bei 1280, 375 und 320 px, auch unter den alten `stuffcloud`-Namen.

**Neues Theme.** Eine CSS-Datei `src/lib/themes/brands/<name>.css`, die die Variablen aus
`src/lib/themes/base.css` für `[data-theme^='<name>']` (Form, Schrift, Größe) und
`[data-theme='<name>-<variante>']` (Farben, nicht in `@media`) überschreibt, ein Einstieg
`src/lib/themes/<name>.css` (`@import './base.css'; @import './brands/<name>.css';`), ein `@import` in
`themes/index.css` und ein Eintrag in `exports`. **Jedes Theme muss `npm test` bestehen:** der
Kontrasttest liest die Theme-Dateien selbst und prüft für jede `data-theme`-Variante Textpaare (4,5:1)
und Ränder, Fokus und Markierungen (3:1).

## Eigene Akzentfarbe

Eine App, die eine eigene Farbe braucht (etwa vom Server oder aus den Einstellungen), setzt **nur diese Farbe auf
ein Standard-Theme**. kern baut kein Theme pro Marke und bildet kein App-Design nach: es gibt kein `nagellacke`- oder
`nailvault`-Theme (nagellacke und nailvault.de nutzen `flower`, die Instanz-Presets setzen darauf den Akzent). Aus einer Farbe leitet
`@mozra-the-great/kern` zehn Tokens ab (`--k-accent`, `--k-on-accent`, `--k-accent-soft`, `--k-accent-mark`,
`--k-accent-text`, `--k-primary`, `--k-on-primary`, `--k-primary-hover`, `--k-on-primary-hover`, `--k-focus`) und
verschiebt nur die Helligkeit, wo die Farbe ihren Kontrast verfehlen würde (Text 4,5:1, Marker und Fokus 3:1, auf
den Flächen des Themes, hell und dunkel). Ungültige Eingabe ändert nichts und wirft nie.

```ts
import { accentTokens, installAccent, removeAccent, createAccentScript } from '@mozra-the-great/kern';

const r = accentTokens('#ffc8e6', { theme: 'flower' }); // rein, ohne DOM
if (r.ok) console.log(r.tokens, r.adjustments, r.guaranteed); // was geändert wurde, und dass der Kontrast hält

installAccent(branding.accentColor, { storageKey: 'kern-accent', themeColor: 'accent' }); // seitenweit, folgt dem Theme-Wechsel
removeAccent({ storageKey: 'kern-accent' }); // zurück zum Theme
// <head>: <script>${createAccentScript('kern-accent')}</script>  → kein Aufblitzen vor dem ersten Frame
```

`accentCss(hex)` liefert dasselbe als Stylesheet (eine Regel je Theme) für den Server, `applyAccent(el, hex)` setzt die
Tokens auf einem Element. Ohne JavaScript setzt `@mozra-the-great/kern/themes/accent.css` die Füllung (`--k-accent`,
`--k-on-accent`) aus `--k-accent-color`. Ohne Bundler: `window.kern.accent` (`kern-elements.js`) oder
`import '@mozra-the-great/kern/elements/accent'`. Tokens, Garantien, Head-Snippet und `theme-color`: [`docs/themes.md`](docs/themes.md#eigene-akzentfarbe).

## Installation und Pinning

Das Paket heißt `@mozra-the-great/kern` (der frühere Name ist auf npmjs.com an eine fremde Bibliothek vergeben).
Es liegt **nicht** auf der npm-Registry, sondern als Tarball an jedem
[GitHub-Release](https://github.com/Mozra-the-great/kern/releases). Das braucht kein Token,
und npm wie pnpm schreiben den Integritäts-Hash des Tarballs in die Lock-Datei: `npm ci` und
`pnpm install --frozen-lockfile` brechen ab, wenn die Datei hinter der URL nicht mehr dieselbe ist.
Voraussetzungen: Node ≥ 22 und Svelte ≥ 5.20 (Peer-Abhängigkeit, nötig für `$props.id()`).

URL-Muster (Version einsetzen, der Dateiname enthält sie ebenfalls):

```text
https://github.com/Mozra-the-great/kern/releases/download/v0.13.4/mozra-the-great-kern-0.13.4.tgz
```

**pnpm** (stuffcloud):

```bash
pnpm add https://github.com/Mozra-the-great/kern/releases/download/v0.13.4/mozra-the-great-kern-0.13.4.tgz
```

`package.json` bekommt die URL als Version, `pnpm-lock.yaml` einen Eintrag mit
`resolution: {integrity: sha512-…, tarball: https://…/mozra-the-great-kern-0.13.4.tgz}`.
CI installiert mit `pnpm install --frozen-lockfile`. Den `integrity`-Hash schreibt pnpm ab
Version 10; pnpm 9 speichert für URL-Tarballs nur die URL und prüft nichts.

**npm-Workspace** (nagellacke), im Workspace-Paket, das kern braucht:

```bash
npm install https://github.com/Mozra-the-great/kern/releases/download/v0.13.4/mozra-the-great-kern-0.13.4.tgz -w <workspace>
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
sowie den npm-Integritätswert in den Release-Notizen. Alle drei gegeneinander und gegen die Lock-Datei prüfen:
[Leitfaden, Prüfsummen prüfen](docs/consumer-guide.md#prüfsummen-prüfen).

```bash
curl -fLO https://github.com/Mozra-the-great/kern/releases/download/v0.13.4/mozra-the-great-kern-0.13.4.tgz
curl -fLO https://github.com/Mozra-the-great/kern/releases/download/v0.13.4/mozra-the-great-kern-0.13.4.tgz.sha256
sha256sum -c mozra-the-great-kern-0.13.4.tgz.sha256
# Wert der Lock-Datei (ohne das Präfix "sha512-"):
openssl dgst -sha512 -binary mozra-the-great-kern-0.13.4.tgz | openssl base64 -A
```

Ein Git-Dependency (`github:Mozra-the-great/kern#v0.13.4`) funktioniert auch, weil `prepare`
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

Die Typen funktionieren auch in strengen Projekten: `strict`, `exactOptionalPropertyTypes`,
`noUncheckedIndexedAccess` und `svelte-check --fail-on-warnings` (CI prüft das mit einer
Fixture). Optionale Props nehmen auch `undefined`, das wie eine weggelassene Prop wirkt; auch
`bind:value={x}` mit `x: string | undefined` geht.

## Custom Elements

```html
<!-- Mit Bundler: import '@mozra-the-great/kern/themes.css' (oder nur eine Marke: themes/code.css)
     und '@mozra-the-great/kern/elements'.
     Ohne Bundler die Dateien aus node_modules ausliefern (Pfade hier relativ zur Seite). -->
<html data-theme="code">
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
`no-stack`, `no-legend`, `no-last-dot`, `rising-is-bad`, `no-pulse`) und bei den Formularfeldern (`no-announce`,
`no-reject-messages`). `<k-stat>` nimmt eine `<k-sparkline>` im Slot `spark`.

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
- `copy`: CopyButton, Code und CodeBlock (`detail` = kopierter Text) · `copy-error`: CopyButton, CodeBlock
- `download`: DownloadButton (`detail` = `{name, size, type}`) · `download-error`: DownloadButton (`detail` = `{code, message}`)
- `action`: Card mit `clickable` (Klick, Enter oder Leertaste auf den Karten-Button)
- `change` außerdem: ThemeToggle (Theme-Id), Resizable (Größen in %, `number[]`) · `toggle` außerdem: Collapsible
- `toggle`: Popover (`detail` = offen), TreeView (`detail` = `{id, expanded}`)
- `files`: FileDrop (`detail` = `File[]`, auch als `el.files`) · `reject`: FileDrop (abgelehnte Dateien, `File[]`)
- `close`: Modal, Drawer, Popover, CommandPalette · `dismiss`: Alert · `remove`: Tag. Modal und Drawer
  melden `close` nur, wenn die Nutzerin schließt (Escape, ✕, Hintergrund), nie für `open = false` aus dem Code
- `cancel`: Modal und Drawer, bevor Escape, ✕ oder Hintergrund sie schließen; abbrechbar (`preventDefault()` hält sie offen)
- `navigate`: TabLinks, normaler Klick auf einen Link (`detail` = der Link); abbrechbar für Routing im Client
- `dismiss`, `undo`, `action`: Toaster, Klick auf ✕, „Rückgängig“ oder die Aktion eines Toasts (`detail` = `{id, key}`)

Toasts: `toast()` aus `@mozra-the-great/kern` und `window.kern.toast()` aus `kern-elements.js` schreiben in
denselben Speicher (`globalThis[Symbol.for('kern.toasts')]`). Ein Toast erscheint in jedem
`<Toaster />` und jedem `<k-toaster>` der Seite. Während einer Migration von React zu Svelte
(beide Builds auf einer Seite) also nur **einen** Toaster einbinden, sonst erscheint jeder Toast
doppelt: solange React-Seiten noch da sind `<k-toaster>` im gemeinsamen Layout, danach
`<Toaster />`. Aufrufen lässt sich `toast()` von beiden Seiten. `toasts` ist eine
schreibgeschützte Live-Liste; ändern nur über `toast()` und `dismissToast()`.

Toasts mit Rückgängig (Snackbar wie in nagellacke): `onundo` zeigt einen Knopf mit dem Text aus
`undoLabel` (`undo-label`), `oncommit` läuft **genau einmal**, wenn der Toast aus einem anderen
Grund schließt (Zeit abgelaufen, ✕, Aktion, ersetzt, `toast.clear()`), nach „Rückgängig“ nie.
`onclose(reason)` meldet jeden Grund: `timeout`, `dismiss`, `action`, `undo`, `replaced`, `cleared`.
Ein neuer Toast mit demselben `key` ersetzt den alten; der alte committet vorher.

```js
window.kern.toast({
	message: '„Rosé“ gelöscht',
	key: 'undo', // der nächste Löschen-Toast ersetzt diesen und committet ihn
	onundo: () => restore(id),
	oncommit: () => deleteOnServer(id)
});
```

Die Zeit läuft nicht, solange der Toast unter dem Mauszeiger liegt, den Fokus hat oder der Tab
verborgen ist, und läuft danach mit der Restzeit weiter (WCAG 2.2.1). Vorgaben: info/ok 6 s,
warn 10 s, danger bleibt bis zum Schließen; höchstens 5 offen (`max`), der älteste schließt
zuerst. Der Toaster hat von Anfang an zwei Live-Regionen (`role="status"`, danger in
`role="alert"`), damit Screenreader auch den ersten Toast ansagen. Nach „Rückgängig“ oder ✕ per
Tastatur geht der Fokus zum nächsten Toast, sonst dorthin zurück, wo er herkam. Positionen:
`bottom-right` (Vorgabe), `bottom-left`, `bottom-center`, `top-right`, `top-left`, `top-center`;
Abstand zum Rand `--k-toaster-offset`, unten unter 760 px `--k-toaster-offset-mobile`
(Code: 76 px über der Tab-Leiste). In Svelte rendert `<Toaster queue={createToastQueue()} />`
eine eigene Warteschlange, etwa für Tests; ohne `queue` die gemeinsame.

Dialoge, die beantwortet werden müssen: `dismissible={false}` (Element: `dismissible="false"`
oder die Eigenschaft `false`) blendet ✕ aus, Escape und Hintergrund tun nichts; schließen kann
nur die App über `open`. `initialFocus` (`initial-focus`, CSS-Selektor oder Element) bestimmt,
was beim Öffnen den Fokus bekommt, etwa die Hauptaktion statt ✕. `alert` setzt
`role="alertdialog"`. Solange ein Modal offen ist, scrollt die Seite dahinter nicht (auch
verschachtelt); langer Inhalt scrollt im Dialog. Fokusfalle, inerte Seite und Rückgabe des
Fokus an den Öffner kommen vom nativen `<dialog>`. `close` (Svelte: `onclose`) meldet nur ein Schließen
durch die Nutzerin (Escape, ✕, Hintergrund, in Svelte auch ein `<form method="dialog">`); schließt die
App über `open = false`, kommt kein Ereignis. Ein kontrollierter Wrapper (React `open={x}` plus
`onclose={() => setX(false)}`) bekommt so genau ein `close` pro Schließen. Der Drawer kann dasselbe:
`dismissible`, `initialFocus`, `closeOnBackdrop`, abbrechbares `cancel` und dieselbe Scroll-Sperre
(ein Drawer über einem Modal hält die Seite gesperrt, bis beide zu sind).

Progress: `tone="warn"` (Speicher voll), `valueText` (`value-text`, gesprochen statt der Zahl,
etwa „3 von 12 Dateien“), `hideLabel` (`hide-label`, Beschriftung nur für Screenreader). Werte
werden auf 0 … `max` begrenzt, `NaN` zählt als 0, ein `max` ≤ 0 als 100. Ohne `value` laufen
Streifen (Code: `steps(4)`, nur `transform`), bei „Bewegung reduzieren“ stehen sie still;
Themes stellen `--k-progress-period`, `--k-progress-loop` und `--k-progress-ease` ein. Im
Kontrastmodus (`forced-colors`) bleibt der Balken in `Highlight` sichtbar.

Slots: Tab-Inhalte sind Kinder mit `data-tab="<id>"` (ohne Kinder ist `<k-tabs>` nur die Tab-Leiste), Folien von `<k-carousel>` sind seine
Kinder. Benannte Slots: `footer` (Modal, Drawer, Card), `media` und `badges` (Card), `actions` (Alert,
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
und `dismissToast` und setzt `window.kern`; `elements/live-announcer` exportiert `announce`;
`elements/strings` (kein Tag) exportiert `setStrings`, `setLocale`, `followLang`, `en`, `de` und weitere
(siehe [Texte und Sprache](#standardtexte-und-sprache)). Ohne Bundler liegen die Dateien unter
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

Die ausführliche Anleitung für React (Einrichten, Properties und Attribute, Ereignisse, Formulare, Übergang zu
Svelte, was die Test-App belegt) steht in [`docs/react.md`](docs/react.md).

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

### React 19: ein getestetes Beispiel

Das Beispiel läuft als Test (`tests/fixtures/react-app`, Chromium, StrictMode, React im Entwicklungsmodus;
`tests/elements/react-*.spec.ts`). Ein Fehler in der Konsole oder ein `pageerror` lässt jeden dieser Tests
fehlschlagen.

```tsx
import { useState } from 'react';
import type { FormEvent } from 'react';
import '@mozra-the-great/kern/elements/button';
import '@mozra-the-great/kern/elements/input';
import '@mozra-the-great/kern/elements/select';
import '@mozra-the-great/kern/elements/checkbox';
import '@mozra-the-great/kern/elements/toaster'; // bringt auch window.kern.toast
import type {} from '@mozra-the-great/kern/elements/react';

const SIZES = [
	{ value: 's', label: 'Klein' },
	{ value: 'l', label: 'Groß' }
];

export function Example() {
	const [name, setName] = useState('');
	const [size, setSize] = useState('');
	const [agree, setAgree] = useState(false);

	function onSubmit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault(); // nur aufgerufen, wenn alle Pflichtfelder gültig sind
		console.log(Object.fromEntries(new FormData(e.currentTarget)));
		window.kern?.toast.ok('Gespeichert');
	}

	return (
		<>
			<form
				onSubmit={onSubmit}
				onReset={() => {
					setName('');
					setSize('');
					setAgree(false);
				}}
			>
				<k-input name="name" label="Name" value={name} required minlength="3" onchange={(e) => setName(e.detail)} />
				<k-select name="size" label="Größe" value={size} options={SIZES} required onchange={(e) => setSize(e.detail)} />
				<k-checkbox name="agree" label="Einverstanden" checked={agree} required onchange={(e) => setAgree(e.detail)} />
				<k-button type="submit">Speichern</k-button>
				<k-button type="reset" variant="ghost">
					Zurücksetzen
				</k-button>
			</form>
			<k-toaster />
		</>
	);
}
```

Was die Tests festhalten (und worauf du dich verlassen kannst):

- **Elemente vor dem ersten Render registrieren**, also statisch importieren wie oben. Rendert React ein
  `<k-select options={…}>`, bevor das Element definiert ist, schreibt es das Array als Attribut
  (`"[object Object]"`); beim späteren Upgrade wirft das einen `SyntaxError` und die Option fehlt, bis React die Prop
  neu setzt.
- **Properties, Attribute, Ereignisse:** Arrays und Objekte (`options`, `tabs`, `rows`, `items`) kommen als Property
  an, auch wenn sie bei jedem Render neu erzeugt werden (kein Ereignis, keine Schleife). `maxlength`, `pattern`,
  `minlength` und `aria-*` bleiben Attribute und erreichen das innere Feld. `on<ereignis>` kleingeschrieben
  (`onchange`, `onclose`, `oncancel`) bekommt das richtige `detail`; `onChange` kennen die Typen für kern-Ereignisse nicht.
  Boolean-Props mit Vorgabe `true` schaltest du über die camelCase-Property ab (`closeOnBackdrop={false}`,
  `dismissible={false}`); `close-on-backdrop={false}` wäre in React nur ein entferntes Attribut.
- **Kein Ereignis außer bei Nutzereingaben:** weder beim Mounten (auch nicht im doppelten Mount von StrictMode) noch
  bei geänderten Props, noch beim Schließen aus React (`open={false}`). Ein kontrollierter Wert (React-State →
  Element → Eingabe → `onchange` → State) braucht pro Eingabe einen Commit und verliert die Cursorposition nicht,
  auch wenn `oninput` den State bei jedem Tastendruck zurückschreibt.
- **Formulare:** `name`, `disabled` und `form="id"` funktionieren als Props (React setzt sie als Property): die Felder
  stehen in `FormData`, ein `disabled` Feld wird nicht gesendet und nicht validiert, `form` verbindet ein Feld
  außerhalb des `<form>`. `required`, `pattern`, `minlength` blockieren das Absenden über ElementInternals;
  `ref.current.setCustomValidity('…')` markiert ein Feld als ungültig (Serverfehler). `<form onReset>` setzt
  den State zurück, die Elemente kehren selbst auf ihren Anfangswert zurück (`k-button type="reset"` auch bei
  Elementen mit der id `reset` oder `submit`).
- **Refs:** `ref` liefert die Elementinstanz mit `form`, `validity`, `checkValidity()`, `setCustomValidity()` und den
  Methoden des Elements (`reset()` bei `<k-file-drop>`). Ein Callback-Ref mit Cleanup funktioniert.
- **Overlays:** `open={state}` öffnet und schließt `k-modal`, `k-drawer` und `k-popover`; Escape, ✕ und Hintergrund
  melden `cancel` und `close` (`preventDefault()` in `oncancel` hält offen). Kinder, die React rendert (auch
  `slot="footer"`), bleiben lebendig. Wird das Element ausgehängt, solange es offen ist, wird auch die
  Scroll-Sperre der Seite wieder gelöst.
- **Toasts und Texte sind seitenweit:** zwei React-Roots teilen sich Toast-Speicher und Textkatalog. Ein Toast aus
  einem Root erscheint in jedem `<k-toaster>`; `window.kern.strings.set(window.kern.strings.de)` schaltet alle
  eingehängten Elemente in allen Roots ohne React-Render um.
- **Aufräumen:** Aushängen eines Roots entfernt Elemente und Listener auf `window`/`document`; erneutes Einhängen
  funktioniert und verdoppelt keine Handler. Schlüssel-Listen (`key`) dürfen umsortiert werden: die Elemente behalten
  Wert und Shadow DOM.

Lokal: `npm run build`, dann `npm run test:elements` (baut die App mit `npm run build:react-app`);
`npm run test:types` prüft die App zusätzlich mit strengem TypeScript.

### Manifest

`custom-elements.json` (Custom Elements Manifest 2.1, im Paket und als
`@mozra-the-great/kern/custom-elements.json`) beschreibt alle Tags mit Attributen, Properties,
Typen, Ereignissen samt `detail`-Typ und Slots, z. B. für Editor-Unterstützung und Doku-Werkzeuge.
`scripts/elements-manifest.mjs` erzeugt es und die Typen aus den Wrappern in `src/elements/`;
CI prüft, dass die eingecheckte Datei aktuell ist. Aus dem Manifest und den Svelte-Typen entsteht die
[API-Referenz](docs/api/reference.md) (`npm run docs:api`, in CI `npm run docs:check`).

## Mascot (Pixel-Art)

Die Laufzeit für die Pixel-Art von Code (gezeichnet für stuffcloud) liegt in kern (Entscheidung in #55; Verhalten nach
stuffclouds ADR 0008). `Mascot` (Custom Element `<k-mascot>`) zeigt **jede** mitgelieferte SVG aus
`assets/code/` (oder eine eigene) als `<img>`:

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
  import axo from '@mozra-the-great/kern/assets/code/mascots/axo.svg?url';
</script>

<Mascot name="stuffy" src={axo} scale={16} compactScale={10} />
<Mascot name="tool-stickers/sticker-qr" base="/art/code" scale={4} animated={false} />
<Mascot src="/eigene/art.svg" cols={12} rows={9} label="Seite abgelaufen" />
```

`name` ist ein Maskottchen-Name oder ein Pfad unter `assets/code/` ohne `.svg`; daraus kommt
das Pixelraster (`CODE_ART`). Die URL kommt aus `src` oder aus `base` (wo du den Ordner
`assets/code/` ausspielst) plus Pfad. Für Art außerhalb des Katalogs `cols`/`rows` angeben.

**CSP:** Die Bilder müssen Dateien vom eigenen Origin sein (`img-src 'self'`), keine `data:`-URIs.
Vite inlined kleine Assets per Standard als `data:` – die SVGs sind alle unter 4 kB. Deshalb entweder
SVGs nie inlinen:

```js
// vite.config.js
export default { build: { assetsInlineLimit: (file) => (file.endsWith('.svg') ? false : undefined) } };
```

oder den Ordner `node_modules/@mozra-the-great/kern/assets/code/` beim Build nach `public/`
kopieren und `base` setzen. Ohne Bundler: `<k-mascot name="stuffy" base="/art/code"></k-mascot>`.

Namen für den 1:1-Umstieg aus stuffcloud (`MASCOT_SOURCES`, gleiche Felder `file`/`animal`/`cols`/`rows`,
dazu `art`). Der alte Pfad `@mozra-the-great/kern/assets/stuffcloud/*` löst bis 1.0 weiter auf `assets/code/*` auf (Alias in `exports`); `base` ist deine
eigene URL und bleibt, wie sie ist:

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

**Maskottchen der anderen Marken** (Pop, Line) sind Vektorgrafiken, keine Pixel-Art. `Mascot` ist für
ganzzahlige Pixelraster gebaut (`scale` = CSS-Pixel pro Art-Pixel, Wippen in `steps(1)`), deshalb gibt es
dafür keinen `brand`-Schalter. Zeig sie als normales Bild in der Größe, die du brauchst:

```svelte
<script>
  import stuffy from '@mozra-the-great/kern/assets/pop/mascots/stuffy.svg?url';
  import cumulo from '@mozra-the-great/kern/assets/line/mascots/cumulo.svg?url';
</script>

<img src={stuffy} alt="" width="160" height="160" loading="lazy" />
<img src={cumulo} alt="Cumulo, eine kleine Wolke" width="180" height="135" />
```

`width`/`height` im Seitenverhältnis des `viewBox` (steht in `assets/<marke>/manifest.json`) reservieren
die Box. Wer trotzdem `<k-mascot>` nimmt (`src` plus `cols`/`rows` = `viewBox`-Breite/-Höhe, `scale={1}`),
bekommt die Grafik in ihrer `viewBox`-Größe; andere Größen gehen damit nicht.

## Formulare und Inhalt: Abgleich mit stuffcloud und nagellacke

**Button / LinkButton (stuffcloud → kern):**

| stuffcloud                   | kern                                                                                     |
| ---------------------------- | ---------------------------------------------------------------------------------------- |
| `Button variant="primary"`   | `Button` (Vorgabe `primary`)                                                             |
| `variant="ghost"`            | `variant="secondary"` (mit Rahmen; kerns `ghost` hat keinen)                             |
| `variant="danger"`           | `variant="danger"`                                                                       |
| `size="compact"` (44 px)     | `size="sm"` (`--k-control-h-sm`, im Code-Theme 44 px, nie unter `--k-tap-target`)  |
| `size="icon"` (48 px)        | `size="icon"` (Quadrat `--k-tap-icon`, mit `aria-label`) oder `IconButton`               |
| `wide`                       | `wide` (volle Breite, Text links, letztes Kind rechts)                                   |
| `LinkButton href`            | `Button href` (dazu `target`, `rel`, `download`, `hreflang`, `referrerpolicy`)           |

Ein Link mit `disabled` oder `loading` bleibt ein `<a>`: ohne `href`, mit `role="link"` und
`aria-disabled="true"`, nicht im Tab-Fokus und nicht klickbar. Die gesperrte Optik kommt aus
`--k-disabled-opacity` (Basis 0,5, Code 0,4); im Kontrastmodus (`forced-colors`) GrayText.

**Ladezustand (#109):** Solange `loading` gesetzt ist, sagt der Button es auch an, nicht nur mit dem drehenden
Zeichen: ein unsichtbarer Statustext (`role="status"`, `aria-live="polite"`, vorgegeben „Loading“, in
`strings-de` „Lädt“) wird beim Start des Ladens vorgelesen, nicht unterbrechend und nur einmal. Der Text ist
überschreibbar mit `loadingLabel` (`<k-button loading-label="Speichert …">`) oder über die Texte (`button.loadingLabel`).
Er steht als Geschwister hinter dem Button bzw. Link (nur wenn `loading` übergeben wird, auch als `false`), nicht darin: der zugängliche Name bleibt die sichtbare Beschriftung,
`aria-busy` bleibt gesetzt, ein ruhender Button sagt nichts. Der Statusbereich ist beim ersten Rendern leer und wird erst
danach gefüllt; ein Screenreader liest ihn dadurch auch, wenn der Button schon mit `loading` startet. Das Ende des
Ladens wird nicht angesagt (den Ausgang melden `StatusMessage`, `toast` oder `announce`).

**Card:** `as` wählt das Wurzelelement: `article` (Vorgabe), `section`, `div` oder `li` (Karten
direkt in einer `<ul>`). Ohne `title` gibt es keine Überschrift. `id`, `aria-*`, `data-*` und
Ereignisse gehen an das Wurzelelement; `<k-card as="li">` bekommt selbst `role="listitem"`.

Klickbare Karte wie nagellackes `PolishCard`: `onclick` (Element: `clickable` und Ereignis
`action`) macht den Titel zu einem `<button>`, dessen Trefferfläche die ganze Karte abdeckt.
Bedienelemente in `footer`, `badges` und im Inhalt bleiben eigene Buttons darüber, nie darin
verschachtelt; per Tastatur kommt erst die Karte, dann Inhalt, dann Fußzeile. Dazu
`actionLabel` (Name, soll den Titel enthalten, z. B. „Rubinrot bearbeiten“), `actionHaspopup`
(z. B. `dialog`), `badges` (in der Ecke über `media`, ohne `media` unter dem Titel) und `muted`
(gestrichelt, Bild grau, für „leer“ oder „weg“; den Zustand zusätzlich als Text nennen).

```svelte
<ul class="grid">
	{#each polishes as p (p.id)}
		<Card as="li" title={p.name} actionLabel="{p.name} bearbeiten" actionHaspopup="dialog" muted={p.empty} onclick={() => edit(p)}>
			{#snippet badges()}{#if p.count > 1}<Badge>{p.count}×</Badge>{/if}{/snippet}
			{#snippet footer()}
				<Button size="sm" variant="secondary" onclick={() => togglePhoto(p)}>Foto</Button>
				<Button size="sm" variant="danger" aria-label="{p.name} löschen" onclick={() => remove(p)}>Löschen</Button>
			{/snippet}
		</Card>
	{/each}
</ul>
```

**FileDrop:** `mode="dispatch"` ist für Werkzeuge, die Dateien sofort verarbeiten (stuffcloud
`FileDropzone`): keine Liste, `onfiles` bekommt nur die Dateien dieser Auswahl, dieselbe Datei
lässt sich erneut wählen, kein Formularwert. `onreject(files)` (Element: `reject`) meldet
abgelehnte Dateien (Typ, Größe, ohne `multiple` alle außer der ersten), vor den angenommenen.
`rejectMessages={false}` (Element: `no-reject-messages`), wenn die Seite die Meldung selbst zeigt.
`buttonLabel` zeigt einen eigenen Button zum Auswählen; die Zone ist dann eine Gruppe aus Label
und Ablegetext. Leeren: `reset()` (Svelte über `bind:this`, Element `el.reset()`) oder
`el.files = []`, beides ohne Ereignis. `matchesAccept(file, accept)` und `splitFiles()` sind
exportiert (Grammatik von `<input accept>`). FileDrop liest nur Name, Typ und Größe einer Datei,
nie ihren Inhalt, und sendet nichts.

**Field, Input, Select, Textarea:** Ein Fehler ist ein `role="alert"`-Absatz: angesagt, wenn er
erscheint oder sich ändert, nicht bei jedem Rendern. `keepHint` (Element: `keep-hint`) zeigt
Hinweis und Fehler zusammen; `aria-describedby` nennt zuerst den Fehler, dann den Hinweis, dann
ein eigenes `aria-describedby` des Aufrufers (wird nicht mehr überschrieben). Wer `Field` um ein
eigenes Steuerelement legt, bekommt im Snippet `{ describedby, invalid, required }`. Sagt die Seite die Meldung
schon selbst an (eine eigene `role="status"`-Region), macht `announce={false}` den Fehler stumm: er bleibt
sichtbar, `aria-describedby` nennt ihn weiter zuerst und das Steuerelement bleibt `aria-invalid`, nur das
`role="alert"` entfällt. `announce` (Vorgabe `true`) gibt es an `Input`, `Select`, `Textarea`, `Combobox`,
`NumberInput`, `DatePicker`, `ColorPicker`, `TagInput`, `PinInput`, `Rating`, `SegmentedControl`, `Slider` und
`FileDrop` (dort nur für den `error`-Prop, die eigenen Meldungen zu abgelehnten Dateien bleiben still). Die
Elemente schalten es mit dem Attribut `no-announce` (Property `noAnnounce`) ab, wie `no-reject-messages`.

**CopyButton und StatusMessage:** `text` ist gleichbedeutend mit `value`. `showLabel` zeigt
`label` als Text („HEX kopieren“), der dann der zugängliche Name ist. Soll der Name mehr sagen als
der sichtbare Text (viele „Kopieren“-Knöpfe in einer Tabelle), setzt `accessibleLabel` (Element:
`accessible-label`) den Namen („SHA-256 kopieren“), `label` bleibt der sichtbare Text. Das gilt mit
und ohne `showLabel` (ohne: auch als Tooltip) und hat Vorrang vor `label`; leer oder nur
Leerzeichen zählt als nicht gesetzt. Mit `showLabel` muss der Name den sichtbaren Text enthalten,
am besten am Anfang (WCAG 2.5.3, Label in Name): Sprachsteuerung („Kopieren klicken“) findet den
Knopf sonst nicht. kern prüft das nicht und warnt nicht; die Texte der Meldung (`copiedLabel`,
`errorLabel`) bleiben unberührt. Die Meldung
(`copiedLabel`/`errorLabel`) wird bei jedem Klick geleert und neu gesetzt, also auch beim
gleichen Ergebnis erneut angesagt, und bleibt bis zum nächsten Klick; nur das Symbol springt
nach `resetAfter` zurück. `StatusMessage` ist eine sichtbare Live-Region (`kind="status"`
höflich, `kind="alert"` für Fehler): von Anfang an leer einbinden und nur `message` ändern.
`tone="ok"` (Standard `default`, Attribut `tone` an `<k-status-message>`) färbt eine Ergebniszeile
(„Kopiert“, „3 Treffer“) in der Erfolgsfarbe `--k-ok`; nur `kind="status"` nimmt sie an, ein Alert bleibt
in der Gefahrfarbe. Der Text sagt, was passiert ist, die Farbe verstärkt es nur (kein Symbol nötig).
`--k-ok` erreicht als Text auf `--k-bg` und `--k-bg-raised` in jeder Variante 4,5:1 (Kontrasttest).

```svelte
<CopyButton text={hex} label="HEX kopieren" showLabel copiedLabel="{hex} kopiert" />
<CopyButton text={sha} label="Kopieren" accessibleLabel="SHA-256 kopieren" showLabel />
<StatusMessage message={result} />
<StatusMessage message={result} tone="ok" />
<StatusMessage message={problem} kind="alert" />
```

## Navigation und Inhalt: Abgleich mit stuffcloud und nagellacke

| stuffcloud / nagellacke                   | kern                                                                         |
| ----------------------------------------- | ---------------------------------------------------------------------------- |
| `CodeBlock code label copyLabel`          | `CodeBlock` (auf `Code` aufgebaut), Element `<k-code-block>`                 |
| `TabLinks links label` (`tabs.css`)       | `TabLinks`, Element `<k-tab-links>`, gleiche Optik wie `Tabs`                |
| `Tabs … panel`                            | `Tabs`; `panel` ist optional (Tab-Leiste ohne Panel)                         |
| nagellacke `navRow` mit Sync-Fehler-Punkt | `Tabs` ohne `panel`, Eintrag mit `dot`, `badgeLabel`, `badgeTone="danger"`  |
| `Tile`, `TileGrid`                        | `Tile`, `TileGrid`, Elemente `<k-tile>`, `<k-tile-grid>`                     |

**CodeBlock:** ein Block mit Rahmen in `--k-bg-code`/`--k-fg-code`, Monospace, seitlich scrollbar
ohne sichtbare Scrollleiste (`hideScrollbar={false}` bzw. `show-scrollbar` zeigt sie). Solange er
seitlich scrollt, ist er eine benannte, fokussierbare Region (`label`, axe
`scrollable-region-focusable`); passt der Code, ist er weder Region noch Tab-Stopp. `copyLabel`
schaltet wie in stuffcloud den Kopieren-Button ein (Text-Button; `showCopyLabel={false}` bzw.
`copy-icon` nur Symbol), `copy` erzwingt oder unterdrückt ihn. Soll der Name des Knopfs mehr sagen
als der sichtbare Text (mehrere Blöcke auf einer Seite), setzt `copyAccessibleLabel` (Element:
`copy-accessible-label`) ihn („Installationsbefehl kopieren“), `copyLabel` bleibt der sichtbare Text.
Der Wert geht an `accessibleLabel` von `CopyButton` (siehe dort): er gilt mit und ohne sichtbaren
Text (ohne: auch als Tooltip), muss mit sichtbarem Text diesen enthalten (WCAG 2.5.3), und leer oder
nur Leerzeichen zählt als nicht gesetzt. `Code` (`block`, `copy`) hat dasselbe als
`copyAccessibleLabel`, `<k-code>` als `copy-accessible-label`. Das Ergebnis wird höflich angesagt
(`copiedLabel`, `copyErrorLabel`); ohne Clipboard-API oder bei verweigerter Berechtigung greift der
Rückfall von CopyButton, scheitert auch der, kommt die Fehlermeldung. `oncopy(copied, text)` läuft
bei jedem Versuch (Element: `copy` mit dem Text, `copy-error`). Unterschied zu stuffcloud: die Ansage
bleibt bis zum nächsten Klick stehen (CopyButton-Verhalten), nur das Symbol springt nach 2 s
zurück. `language`, `lineNumbers` und `startLine` wie bei `Code`. Das Element nimmt den Code aus
`code` oder aus seinem Text (Einrückung entfernt).

```svelte
<CodeBlock code="stuffcloud deploy ./dist" label="Befehl" copyLabel="Kopieren" copiedLabel="Kopiert" />
<CodeBlock code="npm ci" copyLabel="Kopieren" copyAccessibleLabel="Installationsbefehl kopieren" />
```

**TabLinks:** Seiten-Navigation als Links, die wie Tabs aussehen: `<nav aria-label={label}>`, der
Link mit `current` bekommt `aria-current="page"`. Keine Tab-Rollen und keine Pfeiltasten, Tab geht
von Link zu Link. `look` wie bei Tabs (`line`, `pill`). Router im Client: `onnavigate(link, event)`
(Element: abbrechbares `navigate`) kommt bei einem normalen Klick ohne Zusatztaste;
`event.preventDefault()` verhindert das Laden der Seite. Links im Shadow DOM sieht ein Router sonst
nicht.

**Tabs als App-Navigation (nagellacke):** Ohne `panel` (Element: ohne Kinder) rendert Tabs nur die
Tab-Leiste, kein `tabpanel` und kein `aria-controls`; die App zeigt den Inhalt selbst und kann mit
`controls` je Eintrag auf ihn verweisen. Einträge können `badge` (Zahl oder kurzer Text), `dot`,
`badgeLabel` (gesprochen statt des Badges, z. B. „3 neu“ oder „Sync-Fehler“; ein Punkt ohne
`badgeLabel` bleibt stumm), `badgeTone` (`accent`, `danger`), `disabled` und `hidden` (nicht
gerendert, z. B. ein Admin-Tab) haben. Der Name des Tabs lautet dann „Mehr Sync-Fehler“. Pfeiltasten
überspringen gesperrte und versteckte Tabs. Auf schmalen Bildschirmen scrollt die Leiste seitlich;
die Kante mit verdeckten Tabs blendet aus (im Code-Theme wie in stuffcloud nur die Endkante und nur unter
760 px), der Fokusring liegt innen. Wie bisher kommt `change` nur
bei Nutzereingaben.

```svelte
<Tabs
	tabs={[
		{ id: 'lacke', label: 'Lacke', badge: 3, badgeLabel: '3 neu' },
		{ id: 'mehr', label: 'Mehr', dot: syncError, badgeLabel: syncError ? 'Sync-Fehler' : undefined, badgeTone: 'danger' },
		{ id: 'admin', label: 'Admin', hidden: role !== 'admin' }
	]}
	bind:value={page}
	label="Hauptnavigation"
	look="pill"
/>
{#if page === 'lacke'}<CollectionPage />{:else if page === 'mehr'}<SettingsPage />{/if}
```

```tsx
<k-tabs tabs={tabs} value={tab} look="pill" label="Hauptnavigation" onchange={(e) => setTab(e.detail)} />
```

**Tile und TileGrid:** ein liniertes Raster wie stuffclouds Werkzeugübersicht. `TileGrid` legt so viele
Spalten von mindestens `min` (Vorgabe 280px) an, wie passen, und zieht die obere Linie; jede `Tile`
zieht ihre rechte und untere. Mit `href` ist die ganze Zelle ein Link (Hover-Fläche, Fokusring
innen). Ist das Raster schmaler als 760 px (Container-Query), stehen Symbol und Text nebeneinander.
`as` wählt das Element (`TileGrid as="ul"` mit `Tile as="li"`; das Element setzt dafür `role="list"`
bzw. `role="listitem"` auf sich); weitere Attribute gehen an das Wurzelelement.

```svelte
<TileGrid as="ul" aria-label="Werkzeuge">
	<Tile as="li" href="/pdf"><PdfIcon /><span>PDF</span></Tile>
	<Tile as="li"><span>Bald mehr</span></Tile>
</TileGrid>
```

## Sortieren und Auswählen: Abgleich mit stuffcloud

| stuffcloud                                      | kern                                                                    |
| ----------------------------------------------- | ----------------------------------------------------------------------- |
| `ReorderList` (Hoch, Runter, Entfernen, Ziehen) | `SortableList`, Element `<k-sortable-list>`                             |
| `PageGrid` (Bilder als Mehrfachauswahl)         | `SelectGrid`, Element `<k-select-grid>`                                 |
| `keyOf`, `texts.upLabel(item)` …                | `key`, `itemLabel` und `upLabel="Move {name} up"` (Katalog en/de)       |
| `pageLabel(page, position)`                     | `itemLabel(item, index)`                                                |
| `selected: Set<number>`, `onselect(set)`        | `bind:selected` / `onchange` mit einer Liste von Schlüsseln (`ItemKey[]`) |
| `onmove` nur mit `onmove`-Prop                  | `reorderable` und `onmove(from, to)`                                    |

**SortableList:** eine Liste, deren Einträge Knöpfe zum Verschieben und Entfernen haben. Die Liste
sortiert nie selbst: `onmove(from, to)` und `onremove(index)` melden den Wunsch, die App ändert `items`
(Svelte: `moveItem(items, from, to)`). Jeder Knopf zeigt einen sichtbaren Text („Up“, „Nach oben“) und
trägt einen zugänglichen Namen mit dem Eintragsnamen, der den sichtbaren Text enthält (WCAG 2.5.3):
„Move Report.pdf up“, „Report.pdf nach oben verschieben“. Texte: Props (`upText`, `downText`,
`removeText`, `upLabel`, `downLabel`, `removeLabel` mit `{name}`) oder der Katalog (`sortableList`).
Der Fokus bleibt nach einer Verschiebung auf dem gedrückten Knopf; wird er am Listenende deaktiviert,
wandert er zum Partner (Hoch/Runter). Nach „Entfernen“ geht der Fokus zum Knopf des nachrückenden Eintrags
(am Ende zum neuen letzten); ist die Liste leer, entscheidet die App. Wendet die App die Änderung
erst später an (Framework-Rendering, Serveraufruf), gilt der Fokuswunsch bis zu 1,5 s; lehnt die App
ab, bleibt der Fokus unberührt. `removable={false}` blendet „Entfernen“ aus, `dragDrop={false}` schaltet
das Ziehen ab: Ziehen mit der Maus ist nur ein Extra, die Knöpfe sind der Weg für Tastatur, Touch und
Screenreader. Ohne `item`-Snippet zeigt ein Eintrag `label` (fett) und `description`; `key` (Vorgabe:
`item.id`, sonst der Index) und `itemLabel` (Vorgabe: `item.label`) erlauben beliebige Typen.

**Ansagen sind Sache der App.** Die Liste spricht nicht selbst, weil nur die App weiß, wie die neue
Reihenfolge heißt: ein `<LiveAnnouncer />` in die Seite und `announce()` im Handler:

```svelte
<script lang="ts">
	import { SortableList, announce, moveItem } from '@mozra-the-great/kern';
	let files = $state([
		{ id: 1, label: 'Rechnung.pdf', description: '3 Seiten' },
		{ id: 2, label: 'Vertrag.pdf', description: '12 Seiten' }
	]);
	function move(from: number, to: number): void {
		const name = files[from]?.label;
		files = moveItem(files, from, to);
		announce(`${name} verschoben, Position ${to + 1} von ${files.length}`);
	}
</script>

<SortableList items={files} label="Dateien" onmove={move} onremove={(i: number) => (files = files.filter((_, n) => n !== i))} />
```

```tsx
// React 19: Element, Handler ersetzt `items`; announce kommt aus dem Elemente-Paket
<k-sortable-list
	items={files}
	label="Dateien"
	up-text="Nach oben"
	up-label="{name} nach oben verschieben"
	onmove={(e) => {
		setFiles(move(files, e.detail.from, e.detail.to));
		announce(`${files[e.detail.from].label} verschoben, Position ${e.detail.to + 1} von ${files.length}`);
	}}
	onremove={(e) => setFiles(files.filter((_, i) => i !== e.detail.index))}
/>
```

Das Element liest `items` als `{ id, label, description? }`; Inhalte darüber hinaus (Vorschaubild, eigene
Zeile) gehen nur über das `item`-Snippet der Svelte-Komponente, weil ein Element keine Snippets kennt.
Attribute: `label`, `up-text`, `down-text`, `remove-text`, `up-label`, `down-label`, `remove-label`,
`removable="false"`, `drag-drop="false"`. Ereignisse: `move` (`{ from, to }`) und `remove` (`{ index }`),
beide nur bei Nutzereingaben, nie beim Setzen von `items`.

**SelectGrid:** Bilder als Mehrfachauswahl (`role="listbox"`, `aria-multiselectable`, jede Auswahl mit
`aria-selected`). Ein Tab-Stopp (roving tabindex), Tab verlässt das Raster, Umschalt+Tab kehrt zum zuletzt
fokussierten Bild zurück.

| Taste                          | Wirkung                                                                              |
| ------------------------------ | ------------------------------------------------------------------------------------ |
| Pfeil links/rechts             | ein Bild weiter (in `dir="rtl"` vertauscht)                                          |
| Pfeil auf/ab                   | eine Zeile weiter; die Spaltenzahl wird aus dem Layout gemessen, am Rand passiert nichts |
| Pos1/Ende, Bild auf/ab         | erstes/letztes Bild, fünf Zeilen weiter                                              |
| Leertaste, Enter               | Bild wählen/abwählen; Klick tut dasselbe                                             |
| Umschalt+Pfeil, Umschalt+Leertaste, Umschalt+Klick | Bereich ab dem Ankerbild wählen (ersetzt die Auswahl)        |
| Strg/Cmd+A, Esc                | alle wählen, Auswahl leeren (Esc ohne Auswahl wird nicht abgefangen)                 |
| Alt+Pfeil (mit `reorderable`)  | fokussiertes Bild um einen Platz oder eine Zeile verschieben, der Fokus geht mit     |

Pfeiltasten ändern die Auswahl nie; die Auswahl hält Schlüssel statt Positionen und folgt dem Bild
beim Verschieben. `reorderable` aktiviert Alt+Pfeil und Ziehen (nur das fokussierte bzw. gezogene Bild,
ein Extra für die Maus) und meldet `onmove(from, to)`; jedes Bild verweist dann per `aria-describedby`
auf einen unsichtbaren Hinweis (`reorderHint`, Katalog `selectGrid.reorderHint`). Ohne `reorderable`
bleibt Alt+Pfeil beim Browser („Zurück“). Verschwindet das fokussierte Bild, geht der Fokus zum Tab-Stopp
zurück statt auf die Seite zu fallen. Die Auswahl zeigt sich nicht nur durch Farbe: jedes Bild hat
oben rechts ein Kästchen, das ausgewählt ein Häkchen trägt, dazu Rahmen und Fläche in der Akzentfarbe;
im Kontrastmodus (`forced-colors`) wird daraus ein 4 px dicker `Highlight`-Rahmen und ein `Highlight`-Haken.
Übergänge laufen über `--k-dur` und stehen bei `prefers-reduced-motion` still. Ohne Bilder rendert das
Raster nichts (eine leere Listbox wäre ungültig).

```svelte
<script lang="ts">
	import { SelectGrid, moveItem } from '@mozra-the-great/kern';
	let pages = $state([
		{ id: 1, label: 'Seite 1', src: '/thumbs/1.png' },
		{ id: 2, label: 'Seite 2', src: '/thumbs/2.png' }
	]);
	let selected = $state<(string | number)[]>([]);
</script>

<SelectGrid items={pages} bind:selected label="Seiten" min="120px" reorderable onmove={(from, to) => (pages = moveItem(pages, from, to))} />

<!-- eigene Bilder, z. B. ein Canvas: -->
<SelectGrid items={pages} itemLabel={(p, i) => `Position ${i + 1}: ${p.label}`} bind:selected>
	{#snippet item(page, index, isSelected)}<MyThumb {page} {isSelected} />{/snippet}
</SelectGrid>
```

```tsx
<k-select-grid
	items={pages}
	selected={selected}
	label="Seiten"
	reorderable
	onchange={(e) => setSelected(e.detail)}
	onmove={(e) => setPages(move(pages, e.detail.from, e.detail.to))}
/>
```

Das Element liest `items` als `{ id, label, src?, description? }` (`src` als Bild, `label` und `description`
als Bildunterschrift; `caption="false"` blendet sie aus) und `selected` als Liste der `id`. Attribute:
`label`, `min` (kleinste Spaltenbreite, Vorgabe `150px`), `reorderable`, `caption`, `reorder-hint`.
Ereignisse: `change` (Liste der `id` in der Reihenfolge von `items`) und `move` (`{ from, to }`), beide nur
bei Nutzereingaben. Das Seitenverhältnis des Bildfelds ist über `--k-select-grid-ratio` (Vorgabe `1 / 1`)
einstellbar. Auch hier gilt: Das Element sortiert nicht selbst, der `move`-Handler setzt `items` neu.

## Texte, Sprache und Barrierefreiheit

### Standardtexte und Sprache

Jede Komponente bringt englische Standardtexte mit (Schließen-Knopf, „Loading“, „No results“,
Seitenzahlen, Statusnamen, Tastennamen …). Alle stehen in einem Katalog (`KernStrings`, nach
Komponente und Name geordnet); eine Prop oder ein Attribut gewinnt immer gegen den Katalog.
Auch Texte, die nur gesprochen werden (`aria-roledescription` des Karussells, „(opens in a new tab)“
bei externen Links), und das Datumsmuster im Platzhalter des DatePicker (`dd.mm.yyyy`) stehen im Katalog.
Keine Sprache haben nur Formathinweise wie `#rrggbb` im ColorPicker und der `$`-Prompt des Terminals. Ein Test prüft, dass
keine Komponente einen englischen Text als Vorgabe im Code trägt und dass jeder Katalogeintrag
gelesen wird.

```svelte
<script>
	import { setStrings, de } from '@mozra-the-great/kern';
	setStrings(de); // einmal beim Start: gilt für die ganze Seite, auch für schon sichtbare Komponenten
</script>
```

```js
setStrings(de, { modal: { closeLabel: 'Zu' } }); // Bündel plus eigene Texte; spätere gewinnen
setStrings(); // zurück zu Englisch
```

Ohne Bundler: `kern.strings.set(kern.strings.de)`; `kern.strings.en` und `.de` sind dabei. Wer nur die
Texte braucht, lädt `@mozra-the-great/kern/elements/strings` (setzt auch `window.kern`).

| Funktion | Wirkung |
| --- | --- |
| `setStrings(...bündel)` | Setzt die Texte der Seite: ein Bündel (`de`), ein Teil des Katalogs oder mehrere (spätere gewinnen). Ersetzt die frühere Wahl; ohne Argumente: Englisch. `lang` im Bündel setzt zugleich das Zahlen- und Datumsformat. |
| `resetStrings()` | Englisch, Format wieder vom Browser. |
| `getStrings()` | Die Texte, die gerade gelten (Englisch mit der Wahl darüber). |
| `registerStrings(lang, bündel)` | Macht ein Bündel für `setLocale` und `followLang` verfügbar. |
| `setLocale(lang)` | Wählt das registrierte Bündel (`de-AT` findet `de`). Ohne Bündel bleiben die Texte englisch und nur das Format folgt dem Tag (Ergebnis `false`). |
| `followLang(root?)` | Folgt dem `lang`-Attribut von `<html>` (oder `root`), sofort und bei jeder Änderung; gibt die Stopp-Funktion zurück. Im Server-Render ohne Wirkung. |

Die Texte sind reaktiv: Wer die Sprache zur Laufzeit wechselt, sieht sie in allen Komponenten
umspringen, die schon da sind. Der Katalog liegt auf `globalThis[Symbol.for('kern.strings')]`;
das Svelte-Paket und `kern-elements.js` auf einer Seite teilen also eine Wahl, so wie sie sich
den Toast-Speicher teilen. Das deutsche Bündel `de` ist eine eigene Datei: wer es nicht importiert,
liefert es nicht aus (im All-in-one-Bundle der Elemente ist es dabei).

**Eine Sprache hinzufügen.** Der Typ `KernBundle` ist der ganze Katalog plus `lang`; `KernStringsInput`
erlaubt jeden Teil davon. Fehlende Texte bleiben englisch:

```ts
import { registerStrings, followLang, type KernBundle } from '@mozra-the-great/kern';

const fr: KernBundle = { lang: 'fr', modal: { closeLabel: 'Fermer' } /* … alle Abschnitte … */ };
registerStrings('fr', fr);
followLang(); // <html lang="fr"> wählt es
```

Platzhalter wie `{count}` oder `{tag}` bleiben in der Übersetzung stehen; welche ein Text hat, zeigt
der englische Katalog (`src/lib/components/strings.ts`). Neue Sprache im Repo: `strings-de.ts` ist
vollständig getypt, ein neuer englischer Text kompiliert erst, wenn er auch dort steht.

**Zahlen und Datum.** `CountUp`, `Odometer`, `NumberInput`, `DatePicker`, `RelativeTime`, `Stat`,
`Sparkline`, `Heatmap`, `HistoryBar` und `Timeline` nehmen `locale`, sonst die Sprache des gewählten
Bündels (`lang`), sonst die des Browsers. Wer nie ein Bündel wählt, merkt keine Änderung.

### Nur für Screenreader

Text, den Screenreader vorlesen, der aber nicht sichtbar ist (eine Spaltenüberschrift, die nur ein
Symbol zeigt, die Worte „hinzugefügte Zeile“ neben einem `+`): `VisuallyHidden`, `<k-visually-hidden>` oder
ohne Komponente die globale Klasse `.k-visually-hidden` aus jeder Theme-Datei. Der Text bleibt im
Barrierefreiheitsbaum, wird aber auf 1 × 1 px abgeschnitten. Die Variante `focusable`
(`.k-visually-hidden-focusable`) zeigt ihren Inhalt, solange er oder etwas darin den Fokus hat, etwa für einen
„Zum Inhalt springen“-Link.

```svelte
<th><TimerIcon aria-hidden="true" /><VisuallyHidden>Zeitstempel</VisuallyHidden></th>
<VisuallyHidden as="h2">Werkzeuge</VisuallyHidden>
```

```html
<span aria-hidden="true">+</span><span class="k-visually-hidden">hinzugefügte Zeile</span>
<k-visually-hidden focusable><a href="#ende">Zum Ende springen</a></k-visually-hidden>
```

`as` wählt das Element (`span`, Vorgabe, oder `div`, `p`, `label`, `h2`–`h4`); weitere Attribute gehen an
das Element.

### Text ohne HTML

kern erzeugt Markup nie aus einem String: kein `{@html}`, kein `innerHTML`, `outerHTML`,
`insertAdjacentHTML`, `document.write`, `srcdoc` in `src/lib` und `src/elements`. `npm run check:html`
(und ein CI-Schritt) schlägt fehl, wenn eines davon auftaucht. Texte aus Props sind immer Textknoten;
eine Bereinigungsbibliothek braucht man dafür nicht.

**Prose** setzt langen Text: Absätze, Listen, Überschriften und Links mit begrenzter Zeilenlänge
(`--k-prose-measure`, 68ch), Zeilenhöhe (`--k-prose-leading`, 1,6) und Blockabstand (`--k-prose-gap`);
Farben nur aus Tokens (`--k-fg-soft`, `--k-link`, `--k-focus`), im Kontrastmodus `LinkText`.

```svelte
<!-- Reiner Text, z. B. Impressum und Datenschutz vom Server -->
<Prose text={impressum} />

<!-- Eigenes Markup -->
<Prose>
	<h2>Datenschutz</h2>
	<p>Wir speichern <a href="/daten">diese Daten</a>.</p>
</Prose>
```

Mit `text` werden Leerzeilen zu Absätzen, einfache Zeilenumbrüche bleiben Zeilen, und `http(s)://`-Adressen
und E-Mail-Adressen werden Links (Satzzeichen am Ende gehören nicht dazu; andere Schemata wie `javascript:`
nie). Externe Links öffnen in einem neuen Tab mit `rel="noopener noreferrer"` und einem gesprochenen
Hinweis (`externalLabel`, sonst der Katalog); E-Mail-Links nicht. `<k-prose text="…">` ist dasselbe; im
Element gestaltet der Shadow-Root nur Elemente, die direkt darin stehen (Überschriften, Absätze, Listen,
Links), tiefer verschachteltes Markup behält die Stile der Seite. `parseProse(text)` ist exportiert (Absätze →
Zeilen → Segmente), für eigene Darstellung. `Link external` setzt `target="_blank"` und
`rel="noopener noreferrer"` und hängt „(opens in a new tab)“ für Screenreader an (`externalLabel`). Fokus und
Kontrast von `--k-link` prüft der Kontrasttest in jedem Theme.

### Skip-Link, Ansagen, Verbindung

**SkipLink** (`<k-skip-link target="main">`) als erstes Element der Seite: unsichtbar, bis er per Tastatur
Fokus bekommt; dann mit Fokusring, im Kontrastmodus mit `Canvas`/`LinkText`. Enter setzt den Fokus
auf das Ziel (ein Element mit dieser `id`; es braucht kein `tabindex`, der Link setzt es bis zum
Verlassen) und lässt die Adresszeile in Ruhe, damit Hash-Router nicht anspringen. Ohne Ziel verhält
er sich wie ein normaler Fragment-Link. Text: `label` oder der Katalog.

**LiveAnnouncer** (`<k-live-announcer>`) einmal in die Seite (z. B. in die Shell): zwei unsichtbare
Regionen, `role="status"` (höflich) und `role="alert"` (sofort), von Anfang an leer vorhanden.
`announce(message, politeness)` sagt etwas an, wenn der Fokus nicht wandert: Seitenwechsel in einer SPA,
Ergebnis, Statuswechsel. Dieselbe Nachricht zweimal wird erneut gesprochen (die Region wird dazwischen
geleert); nach zehn Sekunden verschwindet der Text. Svelte: `announce()` aus dem Paket; Elemente:
`window.kern.announce()` oder `import { announce } from '@mozra-the-great/kern/elements/live-announcer'`.
Wie beim Toast-Speicher gibt es einen Zustand auf `globalThis[Symbol.for('kern.announcer')]`: ein
Aufruf aus dem Svelte-Paket erreicht ein `<k-live-announcer>` und umgekehrt. Stehen mehrere
LiveAnnouncer auf einer Seite (je einer pro Build), füllt nur der erste seine Regionen, damit nichts
doppelt gesprochen wird. Ohne LiveAnnouncer gehen Nachrichten ins Leere.

**OnlineStatus** (`<k-online-status>`, Svelte `bind:online`) zeigt unter dem Kopf einen nicht blockierenden
Hinweis, solange der Browser offline ist (`navigator.onLine`, Ereignisse `online`/`offline`; das ist ein
Hinweis auf das Netz, keine Zusage, dass der Server antwortet), und sagt den Wechsel über den
LiveAnnouncer an: Verlust sofort beim Auftreten (auch beim Laden ohne Netz), „Wieder online“ nur nach
einem Verlust. Gibt es keinen LiveAnnouncer (oder `announce="false"`), ist der Hinweis selbst eine
Live-Region. Texte: `offlineTitle`, `offlineText`, `onlineText` (`offline-title` …) oder der Katalog;
`politeness`; das Element feuert `change` (`{ online }`) bei einem Wechsel, nicht beim Laden.

```svelte
<SkipLink target="main" label="Zum Inhalt" />
<OnlineStatus />
<main id="main">…</main>
<LiveAnnouncer />
<!-- irgendwo: announce('Gespeichert'); announce('Verbindung verloren', 'assertive'); -->
```

### Kontrastmodus (Windows Hochkontrast, `forced-colors`)

Alle Komponenten bleiben unter `@media (forced-colors: active)` benutzbar (#27). Der Browser ersetzt dann
jede Farbe durch die Systempalette der Nutzerin und entfernt Schatten; was nur über `background` oder
`box-shadow` gezeichnet war (Progress-Füllung, Switch, gewählter Tab, Heatmap-Zelle, Toast-Rand), würde
verschwinden. Jede Komponente bringt deshalb eine eigene Regel mit, nach diesem Muster:

- **Kanten**: jedes bedienbare Teil hat Rand oder Outline (`ButtonText`/`CanvasText`), auch Knöpfe ohne
  Rahmen (Schließen-Knöpfe, Stepper, Tag-Entfernen); Overlays (Modal, Drawer, Popover, Menüs, Tooltip, Toast,
  Palette, Kalender) haben einen sichtbaren Rand.
- **Fokus**: der Ring bleibt, in `Highlight`; ein ausgewähltes Element mit Highlight-Fläche bekommt ihn in
  `HighlightText`.
- **Zustand ohne Farbe allein**: gewählt, aktuell, an, markiert = invertiert (`Highlight`/`HighlightText`) oder
  mit Form (Haken, Punkt, Position des Switch-Daumens, doppelter Rand bei ungültig, dicker Rand bei
  Gefahr, Rautenpunkt bei Warnung im Toast, Schraffur bei „Ausfall“ in HistoryBar); Stufen von Heatmap und
  Füllungen von Progress, Slider und ProgressRing bleiben als Mischung aus `Highlight` und `Canvas` sichtbar.
- **Deaktiviert** ist `GrayText` in voller Deckkraft, nie nur gedimmt.
- **Links** sind `LinkText` mit Unterstrich; Icons folgen `currentColor` oder bekommen ihre Systemfarbe
  (SVG behalten sonst ihre eigene Farbe). ColorPicker behält die Farben seiner Muster, nur die Ränder sind
  Systemfarben.

Die Themes ändern daran nichts: `themes/base.css` setzt in der Media Query Rand-, Linien-, Fokus-, Akzent- und
Deaktiviert-Tokens mit `!important` auf Systemfarben und die Deckkraft deaktivierter Teile auf 1, damit auch ein
Theme, das diese Tokens auf `[data-theme^='…']` setzt, sie nicht aushebeln kann. Ohne Kontrastmodus ändert sich
nichts (alles steckt in der Media Query). Eigene Komponenten brauchen dieselbe Regel (Checkliste im PR-Template).

Geprüft wird in Chromium mit `forcedColors: 'active'` (`tests/elements/forced-colors.spec.ts`, Seite
`pages/forced-colors.html` mit jedem Element in seinen Zuständen): Kante, Fokusring, Zustandsunterschiede ohne
Hintergrundfarbe, `GrayText` bei deaktiviert und geöffnete Overlays je Element; dass in fünf Themes und beiden
Systempaletten keine Themenfarbe durchschlägt; axe ohne schwere Verstöße (ohne die Kontrastregel, die unter
Hochkontrast die Palette der Nutzerin misst); dazu Screenshots (`visual.spec.ts`, `fc-*`). Ansehen:
Edge/Chrome → DevTools → Rendering → „Emulate CSS media feature forced-colors: active“.

### Barrierefreiheit: Erklärung und was automatisch geprüft wird

Ziel ist WCAG 2.2, Stufe AA, für jede Komponente in jedem Theme. Jeder Pull Request prüft im Pflicht-Check `build` in
Chromium alle Custom Elements in acht Theme-Varianten: axe-core (keine Verstöße *serious* oder *critical*, auch in 15
geöffneten Zuständen), Tastatur (Tab-Reihenfolge, sichtbarer Fokusring, die Tasten jedes WAI-ARIA-Musters, Fokusfalle
nur in modalen Dialogen), reduzierte Bewegung, Reflow bei 320 px und den Kontrastmodus; dazu den Kontrast der Tokens und
die Touch-Ziele (#25). **Einzige Ausnahme** unter reduzierter Bewegung: `Spinner` und das Lade-Zeichen von
`Button loading` drehen sich weiter, nur langsamer (2 s pro Umdrehung, WCAG 2.3.3).

Die vollständige Erklärung mit allen Prüfungen, den Zusicherungen der Komponenten, den bekannten Grenzen und dem, was
die App beitragen muss, steht in [`docs/accessibility.md`](docs/accessibility.md); wie die Prüfungen gebaut sind, in
[`docs/testing.md`](docs/testing.md#the-accessibility-suite). Einen Fehler bitte als Issue melden; ein Verstoß gegen
eine der Regeln gilt als Bug.

## Dateien speichern: `saveBlob`, `saveText`, DownloadButton

Für Daten, die die Seite schon hat (Ergebnis eines Werkzeugs, Export, erzeugte Datei). Es wird nichts
gesendet: der Browser bekommt eine Object-URL dieser Seite auf einen kurz eingehängten `<a download>`,
der einmal geklickt wird; die URL wird danach wieder freigegeben.

```ts
import { saveBlob, saveText } from '@mozra-the-great/kern';

const result = saveText('bericht.csv', csv, 'text/csv'); // UTF-8, MIME-Typ text/csv;charset=utf-8
saveBlob('bild.png', blob); // Bytes unverändert
if (!result.ok) console.warn(result.error.code, result.error.message);
```

- **Ergebnis, nie eine Ausnahme:** `{ ok: true, name, size, type }` mit dem tatsächlich benutzten Namen,
  sonst `{ ok: false, error: { code, message, cause? } }`. `code`: `no-dom` (kein `document`, etwa beim
  Server-Rendering: dann passiert nichts), `invalid` (kein `Blob` bzw. kein Text), `failed` (der Browser hat
  abgelehnt; `cause` ist der Fehler) und `content` (nur DownloadButton: kein Inhalt oder `getContent` ist
  gescheitert).
- **Dateiname:** `sanitizeFileName` läuft immer: Steuer-, Unsichtbar- und Richtungsumkehr-Zeichen
  fallen weg, Pfadtrenner und die unter Windows verbotenen Zeichen (`\ / : * ? " < > |`) werden zu `_`,
  Leerzeichen am Rand und Punkte am Ende entfallen, reservierte Namen (`CON`, `NUL` …) bekommen ein `_`,
  sehr lange Namen werden unter Erhalt der Endung gekürzt. Bleibt nichts übrig, gilt der Katalogtext
  `downloadButton.fallbackName` („download“, deutsch „datei“) oder `options.fallbackName`.
- **Typ:** `saveText` nimmt `text/plain`, hängt `;charset=utf-8` an (außer der Typ nennt selbst ein
  Charset) und ersetzt etwas, das kein MIME-Typ ist, durch `text/plain`. `saveBlob` behält den Typ des Blobs.
- **Zeitpunkt:** aus einem Klick- oder Tasten-Handler aufrufen; Browser erlauben mehrere Downloads ohne
  Geste nicht oder fragen nach. Der synthetische Klick steigt nicht zum `document` auf, ein Popover oder
  Router sieht ihn nicht. Die Object-URL wird `REVOKE_DELAY_MS` (1 s) nach dem Klick widerrufen, nicht in
  derselben Task: Chromium und Firefox nehmen die Datei sofort, bei Safari ist ein sofortiger Widerruf
  dafür bekannt, den Download zu verlieren (hier nicht getestet).

**DownloadButton** (`<k-download-button>`) ist der Button dazu, nach dem Vorbild von CopyButton:
Symbol allein, `label` ist dann der zugängliche Name; `showLabel` (Element: `show-label`) zeigt ihn als
Text. `accessibleLabel` (Element: `accessible-label`) setzt einen längeren Namen („Bericht.csv
herunterladen“) neben dem kurzen sichtbaren `label` („Herunterladen“), mit und ohne `showLabel` und mit
Vorrang vor `label`; mit `showLabel` muss er den sichtbaren Text enthalten (WCAG 2.5.3, wie bei CopyButton,
keine Warnung). Den Inhalt liefert `getContent`, sonst `blob`, sonst `text`; `getContent` darf einen String oder `Blob` auch asynchron liefern
und läuft erst beim Klick. Währenddessen zeigt der Button einen Spinner und ignoriert weitere Klicks;
danach bekommt er den Fokus zurück. `name` ist der Dateiname, `type` der MIME-Typ (bei einem `Blob`
ersetzt er dessen Typ). Ohne Inhalt gibt es keine leere Datei, sondern einen Fehler.

Die Meldung steht in einer höflichen Live-Region (`startedLabel`, „Download gestartet“): sie wird bei
jedem Klick geleert und neu gesetzt und bleibt bis zum nächsten Klick, nur das Symbol springt nach
`resetAfter` zurück. Sie ist unsichtbar, außer mit `showStatus`. Ein Fehler (`errorLabel`, „Download
fehlgeschlagen“) ist immer sichtbarer Text mit `role="alert"` unter dem Button. `ondownload(result)` und
`onerror(error)` laufen nach dem Ergebnis; Element: `download` (`detail` = `{ name, size, type }`) und
`download-error` (`detail` = `{ code, message }`), beide nur nach Nutzereingabe. Am Element sind `text`,
`name`, `type`, `label` & Co. Attribute, `blob` und `getContent` nur Eigenschaften.

```svelte
<DownloadButton text={csv} name="bericht.csv" type="text/csv" label="Bericht herunterladen" showLabel />
<DownloadButton text={csv} name="bericht.csv" label="Herunterladen" accessibleLabel="Bericht.csv herunterladen" showLabel />
<DownloadButton getContent={buildReport} name="bericht.pdf" label="Bericht" showLabel showStatus
	ondownload={(r) => log(r.name, r.size)} onerror={(e) => report(e.code)} />
```

```html
<k-download-button id="dl" name="bericht.csv" type="text/csv" label="Bericht herunterladen" show-label></k-download-button>
<script>
	dl.getContent = async () => (await fetch('/api/bericht')).text(); // oder dl.blob = new Blob([...])
	dl.addEventListener('download-error', (e) => console.warn(e.detail.code));
</script>
```

## Komponenten (Kern-Set)

Aktionen: Button, IconButton, Link, CopyButton, DownloadButton, ThemeToggle, DropdownMenu, ContextMenu, CommandPalette ·
Status: Badge, Tag, Avatar, StatusDot, StatusMessage, Spinner, Progress, ProgressRing, Skeleton, Alert, Toaster/`toast()` ·
Formulare: Field, Label, Input, Textarea, Select, Combobox, DatePicker, NumberInput, PinInput, TagInput, ColorPicker, Slider, Rating, FileDrop, Checkbox, RadioGroup, SegmentedControl, Switch ·
Inhalt: Card, Tile/TileGrid, Divider, EmptyState, Table (sortierbar, auf Mobil als Karten), Carousel, Code, CodeBlock, Kbd, RelativeTime,
Collapsible, ScrollArea, Resizable (Paneele mit tastaturbedienbaren Trennern), SortableList, SelectGrid ·
Daten: DataTable (Filter, Sortierung, Seiten, Zeilenauswahl), Stat, Sparkline, Heatmap, HistoryBar, Timeline ·
Overlays: Modal, Drawer, Tooltip, Popover ·
Navigation: Navbar, Breadcrumb, Pagination, Stepper, Tabs, TabLinks, Accordion/AccordionItem, TreeView ·
Effekte: Typewriter, Caret, Scramble, CountUp, Odometer, Marquee, Reveal, Highlight, GridBackground, Terminal ·
Pixel-Art: Mascot ·
Text und Barrierefreiheit: Prose, SkipLink, LiveAnnouncer, OnlineStatus

Ziel ist ein Umfang wie [cock](https://github.com/JoshiCodes/cock) oder größer.

Overlays (Popover, Combobox, DatePicker, ContextMenu) liegen mit `position: fixed`
über der Seite, ohne Portal. Ein Vorfahr mit `transform`, `filter` oder `contain`
verschiebt deshalb ihre Position.

## Entwicklung

```bash
npm ci
npm run dev        # Demo: /index.html (Svelte) und /elements.html (Custom Elements)
npm run check      # svelte-check
npm run lint       # ESLint (typescript-eslint strict, eslint-plugin-svelte) + Prettier --check
npm run format     # Prettier --write + eslint --fix
npm run build      # dist/, dist-elements/ (+ Typen, custom-elements.json), demo-dist/
npm test           # Vitest: Theme-Kontrast, Marken-Einstiege, Pixel-Art-Katalog, Komponenten-Markup, Komponentenverhalten (jsdom)
npm run test:coverage             # wie npm test, mit v8-Coverage über src/lib (Mindestwerte: vitest.config.ts, docs/testing.md)
npx playwright install chromium firefox   # einmalig (Firefox nur für tests/elements/a11y-tab-strip.spec.ts und den Pill-Tabs-Test in a11y-reflow.spec.ts)
npm run test:targets              # Playwright: Touch-Ziele in der gebauten Demo (nach npm run build)
npm run test:elements             # Playwright: gebaute Custom Elements (nach npm run build)
npm run test:types                # Element-Typen gegen eine strikte React-19-Fixture (nach dem Build)
npm run test:consumer             # Svelte-App mit strengen TS-Flags gegen dist/ (nach dem Build)
npm run check:dts                 # kein `any` und keine veränderlichen Listen-Props in den veröffentlichten .d.ts (nach dem Build)
npm run check:html                # kein {@html}/innerHTML in src/lib und src/elements
npm run size                      # Größenbudget der Custom Elements
npm run test:mascot               # Playwright: <k-mascot> unter strenger CSP (nach npm run build)
npm run assets:check              # Marken-Grafiken gegen assets/*/manifest.json (Drift- und SVG-Check)
npm run docs:api                  # API-Referenz docs/api/reference.md neu erzeugen (nach Änderungen an Props, Ereignissen, Kommentaren)
npm run docs:check                # CI: schlägt fehl, wenn docs/api/reference.md veraltet ist
```

`npm ci` baut über `prepare` bereits `dist/` und `dist-elements/`. Release: `version` in
`package.json` anheben, `[Unreleased]` in `CHANGELOG.md` in einen datierten Abschnitt verschieben,
PR mergen, dann `vX.Y.Z` auf `main` taggen und pushen.

## Lizenz

GNU General Public License v3.0 oder später, siehe [`LICENSE`](LICENSE) und [`NOTICE`](NOTICE).
