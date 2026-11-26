# kern einbinden: Leitfaden für Apps

Dieser Leitfaden beschreibt, wie eine App kern einbindet, pinnt, aktualisiert und gestaltet: als Svelte-5-Paket, als
Custom Elements ohne Framework oder über die Elemente in React 19. Er ist für die Teams geschrieben, die kern nutzen
(zuerst stuffcloud und nagellacke), und verweist für Details auf die Stellen, an denen sie schon stehen.

| Thema | Wo |
| --- | --- |
| Installation, Pinning, Prüfsummen, Aktualisieren | [hier](#installation-und-pinning) |
| Theme, `data-theme`, Schriften, Akzentfarbe, Kontrastmodus | [hier](#themes-einbinden) |
| Bundler, Assets, Content Security Policy | [hier](#bundler-assets-und-csp) |
| Umstieg von stuffclouds `src/ui` | [hier](#umstieg-von-stuffcloud) |
| Props, Ereignisse und Slots jeder Komponente und jedes Elements | [`docs/api/`](api/README.md) (erzeugt) |
| React 19 über die Custom Elements | [`docs/react.md`](react.md) |
| Barrierefreiheit: Ziel, Prüfungen, Grenzen | [`docs/accessibility.md`](accessibility.md) |
| Theme-Tokens, Code-Theme-Quelle, Akzent im Detail | [`docs/themes.md`](themes.md) |
| Tests und was sie abdecken | [`docs/testing.md`](testing.md) |

## Drei Wege, ein Paket

| Weg | Import | Wann |
| --- | --- | --- |
| Svelte 5 | `import { Button } from '@mozra-the-great/kern'` | Svelte-App mit Bundler (Vite, SvelteKit). Nur benutzte Komponenten landen im Bundle. |
| Custom Elements, alle | `import '@mozra-the-great/kern/elements'` oder `<script type="module" src="…/dist-elements/kern-elements.js">` | Seite ohne Svelte, ohne Bundler oder mit vielen Tags. Setzt `window.kern`. |
| Custom Elements, einzeln | `import '@mozra-the-great/kern/elements/button'` | React 19 und andere Apps mit Bundler, die nur einige Tags brauchen. |

Beide Builds teilen sich auf einer Seite Toasts, Ansagen und Texte (über `globalThis`); während einer Migration
dürfen sie nebeneinander laufen. Was dabei zu beachten ist (nur ein Toaster), steht im README unter
[Custom Elements](../README.md#custom-elements) und in [`docs/react.md`](react.md#übergang-von-react-zu-svelte).

## Installation und Pinning

kern liegt nicht auf der npm-Registry, sondern als Tarball an jedem
[GitHub-Release](https://github.com/Mozra-the-great/kern/releases). npm und pnpm schreiben beim Installieren den
sha512-Integritätswert des Tarballs in die Lock-Datei; `npm ci` und `pnpm install --frozen-lockfile` brechen ab,
sobald die Datei hinter der URL eine andere ist. Damit ist die Version gepinnt, ohne Token und ohne Registry.

**Voraussetzungen:** Node ≥ 22, Svelte ≥ 5.20 (Peer-Abhängigkeit, nur für den Svelte-Weg nötig), pnpm ≥ 10 (pnpm 9
speichert für URL-Tarballs keinen Hash).

### Installieren

Die URL folgt einem festen Muster; die Version steht zweimal darin:

```bash
V=0.13.0
URL="https://github.com/Mozra-the-great/kern/releases/download/v$V/mozra-the-great-kern-$V.tgz"

pnpm add "$URL"                      # pnpm (stuffcloud)
npm install "$URL" -w <workspace>    # npm-Workspace (nagellacke), im Paket, das kern braucht
npm install "$URL"                   # npm ohne Workspaces
```

Danach steht in `package.json` die URL als Version, und die Lock-Datei hält URL und `integrity: sha512-…`. Welche
Felder genau, zeigt das README unter [Installation und Pinning](../README.md#installation-und-pinning). In CI immer
`npm ci` bzw. `pnpm install --frozen-lockfile`, nie `npm install`: nur dann wird der Hash geprüft statt
neu geschrieben.

Ein Git-Dependency (`github:Mozra-the-great/kern#vX.Y.Z`) funktioniert auch, pinnt aber nur den Commit, nicht den
Inhalt, und baut beim Installieren mit den Dev-Abhängigkeiten. Der Tarball ist der empfohlene Weg.

### Prüfsummen prüfen

Jedes Release trägt neben dem Tarball `….tgz.sha256` und `….tgz.sha512`, und die Release-Notizen nennen unter
„Integrity“ den Wert, den npm und pnpm in die Lock-Datei schreiben. Vor dem ersten Pinnen einer Version (oder in einem
Review) lässt sich alles gegeneinander prüfen. Die Befehle laufen unter Linux, macOS und in Git Bash unter Windows:

```bash
V=0.13.0
BASE="https://github.com/Mozra-the-great/kern/releases/download/v$V"
curl -fLO "$BASE/mozra-the-great-kern-$V.tgz"
curl -fLO "$BASE/mozra-the-great-kern-$V.tgz.sha256"
curl -fLO "$BASE/mozra-the-great-kern-$V.tgz.sha512"

sha256sum -c "mozra-the-great-kern-$V.tgz.sha256"   # → mozra-the-great-kern-0.13.0.tgz: OK
sha512sum -c "mozra-the-great-kern-$V.tgz.sha512"   # → mozra-the-great-kern-0.13.0.tgz: OK

# Der Wert der Lock-Datei (SRI): sha512, base64
echo "sha512-$(openssl dgst -sha512 -binary "mozra-the-great-kern-$V.tgz" | openssl base64 -A)"
```

Die letzte Zeile muss gleich sein mit:

- dem Wert unter „Integrity“ in den Release-Notizen (`gh release view v$V --repo Mozra-the-great/kern`),
- dem `integrity` des Eintrags in der Lock-Datei: `package-lock.json` unter
  `packages["node_modules/@mozra-the-great/kern"]` (in einem Workspace auch `<workspace>/node_modules/…`), in
  `pnpm-lock.yaml` unter `resolution: {integrity: …}` des Pakets.

Die Prüfsummen-Dateien entstehen im Workflow `release` aus genau dem Tarball, der angehängt wird
(`.github/workflows/release.yml`); ein Release wird nie ersetzt, eine Korrektur ist immer ein neues Patch-Release.

### Aktualisieren

1. Release-Notizen bzw. [`CHANGELOG.md`](../CHANGELOG.md) von der alten bis zur neuen Version lesen. Unter 1.0 kann
   jede Minor-Version (`0.9` → `0.10`) brechen; jeder Bruch steht als **BREAKING:** mit dem Weg zur Migration da.
   Patch-Versionen brechen nie.
2. Denselben Befehl wie beim Installieren mit der neuen URL ausführen.
3. Den Diff prüfen: in `package.json` genau eine neue URL, in der Lock-Datei genau eine neue `resolved`/`tarball`-URL
   und ein neuer `integrity`-Wert. Bei Bedarf wie oben gegen die Release-Notizen prüfen.
4. Tests und Typprüfung der App laufen lassen. Ein neues Pflicht-Attribut, eine strengere Validierung oder ein
   umbenannter Wert zeigt sich dort zuerst.

Veraltete Namen (etwa das Theme `stuffcloud`, jetzt `code`) funktionieren bis 1.0 als Aliase; die Tabelle der neuen
Namen steht im README unter [Themes](../README.md#themes).

**Eine Kopie pro App.** Die Custom Elements registrieren jeden Tag einmal (die erste Kopie gewinnt), Toasts, Ansagen
und Texte liegen auf `globalThis`. Zwei verschiedene kern-Versionen auf einer Seite funktionieren also, laden aber die
Laufzeit doppelt und mischen Verhalten zweier Versionen. `npm ls @mozra-the-great/kern` bzw.
`pnpm why @mozra-the-great/kern` zeigt, ob nur eine aufgelöst wird.

## Themes einbinden

kern liefert kein Aussehen ohne Theme: Komponenten und Elemente lesen nur `--k-*`-Variablen, die ein Theme-Stylesheet
setzt. Die Seite lädt **ein** Stylesheet und setzt `data-theme` auf `<html>` (oder auf einen Teilbaum).

### Einstiege

| Einstieg | Inhalt | Für |
| --- | --- | --- |
| `@mozra-the-great/kern/themes/<marke>.css` (`code`, `flower`, `pop`, `line`) | Basis-Tokens und genau eine Marke | Apps mit einer Marke (empfohlen). `npm test` prüft, dass nichts von einer anderen Marke darin landet. |
| `@mozra-the-great/kern/themes.css` (Datei `dist/themes/index.css`) | alle Marken | Seiten, die zur Laufzeit die Marke wechseln, die Demo |
| `@mozra-the-great/kern/themes/base.css` | nur die Basis-Tokens, kein `data-theme`-Theme | eigenes Theme auf kerns Token-Satz |
| `@mozra-the-great/kern/themes/accent.css` | Akzent-Füllung aus `--k-accent-color`, nur CSS | zusätzlich zu einem der obigen, siehe [Akzentfarbe](#eigene-akzentfarbe) |

Je Weg:

```svelte
<!-- Svelte: einmal in der Wurzel der App, z. B. +layout.svelte oder App.svelte -->
<script>
	import '@mozra-the-great/kern/themes/code.css';
	import { Button } from '@mozra-the-great/kern';
</script>
```

```js
// Custom Elements mit Bundler (auch React): Theme und Elemente getrennt importieren
import '@mozra-the-great/kern/themes/flower.css';
import '@mozra-the-great/kern/elements/button';
```

```html
<!-- Custom Elements ohne Bundler: die Dateien aus node_modules (oder einer Kopie) ausliefern -->
<link rel="stylesheet" href="/kern/dist/themes/pop.css" />
<script type="module" src="/kern/dist-elements/kern-elements.js"></script>
```

Die Elemente bringen nur ihr eigenes Layout im Shadow DOM mit; die Tokens erben sie von der Seite. Ohne Theme-
Stylesheet sehen sie ungestaltet aus. Ohne Bundler lädt `<marke>.css` seine Teile per `@import`
(`base.css`, `brands/<marke>.css`); das Verzeichnis `dist/themes/` muss also vollständig ausgeliefert werden.

### `data-theme`-Werte

| Marke | Werte (der erste ist die Vorgabe der Marke) | Schema |
| --- | --- | --- |
| Code | `code` (= `code-dark`), `code-light`, `code-paper`, `code-contrast` | dunkel, hell, hell, dunkel |
| Flower | `flower` (= `flower-creme`), `flower-wald` | hell, dunkel |
| Pop | `pop` (= `pop-light`), `pop-dark` | hell, dunkel |
| Line | `line` (= `line-dark`), `line-light` | dunkel, hell |

Jede Variante setzt `color-scheme` selbst (Formularfelder und Scrollbalken des Browsers passen dazu) und gibt dem
Element mit `data-theme` Hintergrund, Textfarbe, Schrift und (außer auf `<html>`, siehe [Schriftgröße](#schriftgröße))
die Grundschriftgröße. Die alten `stuffcloud*`-Werte sind Aliase von `code*`
bis 1.0. Herkunft der Themes und alle Tokens: README [Themes](../README.md#themes), [`docs/themes.md`](themes.md).

**Vor dem ersten Paint.** Ein gespeichertes Theme (ThemeToggle mit `persist`) oder das System-Schema setzt
`createThemeScript(key, { followSystem: true })` aus `@mozra-the-great/kern`: es liefert ein kleines Inline-Script
als Text, das in `<head>` vor dem ersten Paint `data-theme` setzt. Ohne Script zeigt die Seite bis zum Start der App
das Theme aus dem HTML. Unter strenger CSP braucht das Script ein Nonce oder seinen Hash, `themeScriptHash(key, options)` (siehe
[CSP](#content-security-policy)).

```html
<html lang="de" data-theme="flower">
	<head>
		<link rel="stylesheet" href="/assets/kern-flower.css" />
		<script nonce="…">/* Text von createThemeScript('kern-theme', { followSystem: true }) */</script>
	</head>
</html>
```

**Schriften** liefert kern nicht mit. Code braucht Inter, JetBrains Mono und Silkscreen, Flower Figtree, Pop Figtree
und JetBrains Mono, Line Outfit, Inter und JetBrains Mono (Schnitte im README unter
[Themes](../README.md#themes)). Die App lädt sie selbst, am besten als eigene Dateien vom eigenen Origin; ohne sie
greifen die System-Ersatzschriften der Token-Stacks (`--k-font-*`).

### Schriftgröße

`data-theme` darf auf `<html>` stehen (so zeigen es die Beispiele); die Schriftgröße, die der Browser dort einstellt,
bleibt dabei erhalten. Wer in den Browser-Einstellungen eine größere Standardschrift wählt (z. B. 20 statt 16 px),
sieht sie auch mit kern. Früher setzte `base.css` auf jedes Element mit `data-theme` eine feste px-Größe, auch auf
`<html>`; sie ersetzte die Einstellung, und jedes `rem` blieb bei 16 px (#144).

| Was | Folgt der Browser-Einstellung? |
| --- | --- |
| `<html data-theme>`: Schriftgröße des Wurzelelements und damit alles, was darauf aufbaut: `rem`, `em`, `%` und Text ohne eigene Größe (Fließtext, eigene Überschriften der Seite) | **ja**. Bei 16 px unverändert `--k-text-md` (Code, Flower, Pop 16 px; Line 17 px), bei 20 px 20 px (Line 21,25 px = 20 × 17 ⁄ 16) |
| Längen in `rem` (in kern die Vorgabehöhe von `Resizable` und `Marquee`, Mindestbreiten in `TagInput` und `SortableList`) | **ja** |
| Text und Maße der Komponenten: Schriftgrößen aus `--k-text-*` und den Komponenten-Tokens (`--k-button-size` …), Steuerhöhen, Abstände, Radien | **nein**. Das sind px-Werte des Designs (die von Code stammen aus stuffclouds Design und bleiben unverändert); Komponenten lesen sie als px |
| `<div data-theme>` (Teilbaum) und `<body data-theme>` | **nein**. Sie setzen weiter `--k-text-md` als px-Grundgröße, auch innerhalb einer Seite mit Wurzel-Theme. Für die Seite selbst `data-theme` auf `<html>` setzen, nicht auf `<body>` |

Eine eigene Regel der Seite (`html { font-size: 62.5% }`) hat Vorrang vor dem Theme, weil dessen Regel auf `<html>` die
Spezifität 0 hat. Ein eigenes Theme auf `base.css`, dessen `--k-text-md` nicht 16 px ist, setzt zusätzlich
`--k-root-scale` (`--k-text-md` ÷ 16 px als Zahl, Line `1.0625`), sonst ist die Wurzel bei 16 px 16 px.
Test: `tests/elements/root-font-size.spec.ts` (Browser-Standardschrift 16 und 20 px, alle Varianten).

**Zeilenhöhe.** Jedes Element mit `data-theme` setzt `line-height: var(--k-leading-body)`, und Text ohne eigene Zeilenhöhe erbt
sie (#145). Das Token ist in Flower, Pop und Line `1.5` wie bisher; in Code (alle Varianten, auch die `stuffcloud*`-Namen) ist es
`normal`, wie in stuffclouds Design, das auf `body` keine Zeilenhöhe setzt. Wer in Code die alte Zeilenhöhe behalten will, setzt
`--k-leading-body: 1.5` auf das Element mit `data-theme`. Komponenten mit eigener Zeilenhöhe (Prose, Code, Terminal, Button,
Textarea …) folgen dem Token nicht; Alert, Toast und die Sortier-Buttons im Kopf von Table haben dafür eine feste `1.5`, weil Icon, Punkt und Trefferfläche darauf abgestimmt sind.

### Eigene Akzentfarbe

Eine App mit eigener Markenfarbe (vom Server, aus Einstellungen) setzt **nur diese Farbe** auf ein Standard-Theme;
eigene Themes pro App gibt es nicht. Aus einer Hex-Farbe leitet kern zehn Tokens ab und verschiebt nur die
Helligkeit, wo der Kontrast sonst fiele (Text 4,5:1, Marker und Fokus 3:1, auf den Flächen des Themes):

| Funktion (`@mozra-the-great/kern`) | Ohne Bundler | Zweck |
| --- | --- | --- |
| `installAccent(hex, { storageKey })` / `removeAccent()` | `window.kern.accent.install` / `.remove` | seitenweit, folgt dem Wechsel hell/dunkel |
| `createAccentScript(storageKey)` | `window.kern.accent.script` | Inline-Script gegen das Aufblitzen beim nächsten Laden |
| `accentCss(hex)` | `window.kern.accent.css` | Stylesheet für den Server-Render |
| `accentTokens(hex, { theme })` | `window.kern.accent.tokens` | nur rechnen, ohne DOM; berichtet jede Anpassung |
| `applyAccent(el, hex)` / `clearAccent(el)` | `window.kern.accent.apply` / `.clear` | ein Teilbaum, etwa eine Vorschau |
| `themes/accent.css` + `data-k-accent` + `--k-accent-color` | dasselbe | nur die Füllung, ohne JavaScript |

Ungültige Eingabe ändert nichts und wirft nie (`{ ok: false, error }`). Garantien, Head-Snippet, CSP-Nonce und
`theme-color`: [`docs/themes.md`, Eigene Akzentfarbe](themes.md#eigene-akzentfarbe); kurz im README unter
[Eigene Akzentfarbe](../README.md#eigene-akzentfarbe).

### Kontrastmodus

Unter Windows-Hochkontrast (`forced-colors: active`) ersetzt der Browser alle Farben durch die Systempalette. Jede
Komponente bringt dafür eigene Regeln mit (Ränder, Fokusring in `Highlight`, Zustände nicht nur über Farbe,
`GrayText` für gesperrt), und `base.css` setzt die Rand-, Fokus- und Akzent-Tokens dort mit `!important` auf
Systemfarben, damit kein Theme und kein Akzent sie aushebelt. Die App muss nichts tun; eigene Komponenten der App
brauchen dieselben Regeln. Muster und Prüfung: README
[Kontrastmodus](../README.md#kontrastmodus-windows-hochkontrast-forced-colors), Tokens:
[`docs/themes.md`](themes.md#forced-colors-27).

## Bundler, Assets und CSP

### Vite und SvelteKit

- **Svelte-Paket:** die App kompiliert kerns `.svelte`-Dateien selbst (Feld `svelte` in den `exports`), braucht also
  `@sveltejs/vite-plugin-svelte` bzw. SvelteKit. Die Typen kommen aus `dist/index.d.ts`; sie sind für
  `strict`, `exactOptionalPropertyTypes` und `noUncheckedIndexedAccess` geprüft.
- **Custom Elements:** fertiges JavaScript, kein Svelte-Plugin nötig. `sideEffects` im Paket markiert die
  Element-Einstiege und alle CSS-Dateien, damit ein Bundler die Imports nicht wegwirft.
- **Assets** (`@mozra-the-great/kern/assets/<marke>/…`, Pixel-Art, Maskottchen): Vite inlined kleine Dateien als
  `data:`-URI. Unter `img-src 'self'` (ohne `data:`) SVGs nie inlinen (`build.assetsInlineLimit` als Funktion, die für
  `.svg` `false` liefert) oder den Ordner nach `public/` kopieren. Beispiel und Hintergrund: README
  [Mascot](../README.md#mascot-pixel-art).
- **Overlays** (Popover, Menüs, Combobox, DatePicker) liegen mit `position: fixed` über der Seite, ohne Portal. Ein
  Vorfahr mit `transform`, `filter` oder `contain` verschiebt sie; solche Container nicht um sie legen.

### Content Security Policy

| Teil | Was die Policy erlauben muss |
| --- | --- |
| Theme-Stylesheets | `style-src 'self'` (eigene Dateien) |
| Svelte-Paket | im Build nichts Besonderes: Vite schreibt das CSS der Komponenten in Dateien (der Dev-Server fügt es dagegen als `<style>` ein). Geprüft mit der Policy unten |
| Custom Elements | `style-src 'unsafe-inline'` (zusätzlich zu `'self'`): jedes Element legt beim Start ein `<style>` in seinen Shadow Root, ohne Nonce. So läuft auch die CSP-Prüfung von `<k-mascot>` in `tests/mascot/`. |
| `createThemeScript`, `createAccentScript` | das Inline-Script braucht in `script-src` ein Nonce oder seinen Hash (`themeScriptHash`, `scriptHash`, siehe unten); `createAccentScript(key, { nonce })` gibt dem eingesetzten `<style>` das Nonce der Seite |
| `installAccent` | `style-src` mit Nonce: `installAccent(hex, { nonce })` |
| `applyAccent`, `ThemeToggle` | nichts: Inline-Tokens über das CSSOM blockiert `style-src` nicht |
| Bilder aus `assets/` | `img-src 'self'`, wenn sie als Dateien ausgeliefert werden (siehe oben) |

**Geprüfte Policy für den Svelte-Weg** ([#125](https://github.com/Mozra-the-great/kern/issues/125)). Diese Policy, Wort
für Wort, läuft in CI im Pflicht-Job `build` (`npm run test:csp`):

```
default-src 'none'; script-src 'self' 'sha256-<createThemeScript>'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'
```

Der Test ([`tests/csp/csp.spec.ts`](../tests/csp/csp.spec.ts)) baut mit Vite eine App
([`tests/fixtures/csp-app`](../tests/fixtures/csp-app)), die jede exportierte Svelte-Komponente einbindet, liefert den
Produktions-Build unter dieser Policy aus ([`tests/csp/server.mjs`](../tests/csp/server.mjs),
[`tests/csp/policy.mjs`](../tests/csp/policy.mjs)) und öffnet in allen acht Theme-Varianten jedes Overlay und jeden
Picker über die Oberfläche (Modal, Drawer, Toasts, Popover, Tooltip, Menüs, Kontextmenü, Befehlspalette, Combobox,
Datum, Farbe, Tags, Handymenü der Navbar). Er schlägt fehl bei jedem `securitypolicyviolation`-Ereignis, bei jeder
CSP-Meldung in der Konsole, bei jedem Seitenfehler und wenn die ausgelieferte Policy `'unsafe-inline'` oder
`'unsafe-eval'` enthält. Eine neue Komponente ohne Eintrag in der App oder in der Tabelle `CASES` lässt ihn ebenfalls
fehlschlagen. Ein Gegenbeweis gehört dazu: unter `/canary/` läuft dieselbe App, nur mit einem statischen
`style="…"` im Template von `Badge`; der Test zeigt, dass die Prüfung dort anschlägt.

Was diese Policy blockiert und kern deshalb nicht tut: ein statisches `style="…"`-Attribut im Template (Svelte klont
Template-HTML, der Browser behandelt es als Inline-Style), ein eingefügtes `<style>`, Inline-Handler (`onclick="…"`),
`javascript:`-URLs, `eval`, Bilder und Schriften als `data:`-URI. Erlaubt ist, was Script über das CSSOM setzt
(`style:prop={…}`, `element.style.x = …`, `style.cssText`): so positioniert kern Overlays und setzt Größen.

**Hash des Theme-Scripts.** `themeScriptHash(key, options)` aus `@mozra-the-great/kern` gibt die fertige Quelle für
`script-src` zurück, mit Anführungszeichen (`'sha256-…'`), als Promise; dieselben Argumente wie `createThemeScript`.
`scriptHash(text)` tut dasselbe für jedes andere feste Inline-Script, etwa `createAccentScript(key)` ohne Nonce. Beide
rechnen mit Web Crypto (`crypto.subtle`, Node ≥ 22). Der Hash gilt für den Text genau so, wie die Funktion ihn
liefert: ohne zusätzliche Leerzeichen oder Zeilenumbrüche zwischen `<script>` und `</script>` einsetzen, und die Seite
als UTF-8 ausliefern (`<meta charset="utf-8">` bzw. `charset=utf-8` im `Content-Type`; ein Schlüssel mit
Nicht-ASCII-Zeichen ergibt in einer anders kodierten Seite einen anderen Hash). Er hängt an der kern-Version und den
Argumenten; nach einem Update neu berechnen, am einfachsten einmal beim Start des Servers.

Nur Script-Text hashen, den die App selbst festlegt: nie Inhalte aus Nutzereingaben oder Daten, die sich pro Anfrage
ändern. Ein Hash erlaubt genau diesen Text auf jeder Seite, für immer; wer fremden Text hasht, gibt fremdem Code die
Freigabe.

**Nonce statt Hash.** `createAccentScript(key, { nonce })` schreibt das Nonce in den Script-Text (für das `<style>`,
das es einsetzt); dieser Text ändert sich also mit jeder Anfrage und hat keinen festen Hash. Mit Nonce braucht es
keinen Hash: das Nonce auf das Element setzen (`<script nonce="…">`), in `script-src 'nonce-…'` und `style-src
'nonce-…'` eintragen und für **jede Anfrage neu** erzeugen (zufällig, mindestens 128 Bit, nie wiederverwenden). Den
Hash einmal beim Serverstart berechnen gilt nur für Scripts ohne Nonce.

```ts
import { createThemeScript, themeScriptHash } from '@mozra-the-great/kern';

const key = 'kern-theme';
const options = { followSystem: true };
const head = `<script>${createThemeScript(key, options)}</script>`; // unverändert in <head>
const csp = [
	"default-src 'none'",
	`script-src 'self' ${await themeScriptHash(key, options)}`,
	"style-src 'self'",
	"img-src 'self'",
	"font-src 'self'",
	"connect-src 'self'",
	"frame-ancestors 'none'",
	"base-uri 'none'",
	"form-action 'self'"
].join('; ');
```

Nicht abgedeckt: der Vite-Dev-Server (er fügt CSS als `<style>` ein), die Custom Elements (siehe Tabelle) und
Server-Rendering. SvelteKit schreibt `style:`-Werte beim Rendern als `style="…"`-Attribut ins HTML, und solche
Attribute blockiert `style-src 'self'`; ein Nonce gilt für sie nicht, ein Hash nur mit `'unsafe-hashes'`. Geprüft ist
nur eine Vite-SPA: eine statische HTML-Datei mit dem Theme-Script als einzigem Inline-Script.

**SvelteKit ist nicht geprüft**, auch nicht mit `ssr = false`: SvelteKit schreibt auch dann ein eigenes Inline-Script
zum Start der App in die HTML-Hülle, und die Policy oben blockiert es. Dafür ist `kit.csp` in `svelte.config.js` da
(`mode: 'hash'` oder `'nonce'`): SvelteKit trägt dann Hash oder Nonce seines eigenen Start-Scripts selbst ein. Der Hash
des Theme-Scripts gehört in `kit.csp.directives['script-src']` (neben `'self'`). Keinen zweiten CSP-Header neben
`kit.csp` senden: zwei Policies gelten beide, und was eine erlaubt, blockiert die andere. `'unsafe-inline'` ist nie
der Ausweg.

kern erzeugt Markup nie aus Strings (kein `{@html}`, kein `innerHTML`; `npm run check:html` in CI), Texte aus Props
sind immer Textknoten. Eine App kann also auch fremden Text ohne Bereinigung übergeben; Links in `Prose` werden nur
für `http(s)://` und E-Mail-Adressen erzeugt ([Text ohne HTML](../README.md#text-ohne-html)).

## Komponenten benutzen

Die vollständige Liste der Props, Callbacks, Snippets, Attribute, Ereignisse und Slots steht in der erzeugten
[API-Referenz](api/reference.md); wie man sie liest, in [`docs/api/README.md`](api/README.md). Die Regeln, die überall
gelten:

- **Ereignisse nur bei Nutzereingaben.** Setzt die App `value`, `open`, `tabs` usw., kommt kein `change`/`close`; ein
  kontrollierter Wrapper läuft nicht in eine Schleife. Svelte meldet über Callback-Props (`onchange`, `onclose`), die
  Elemente über `CustomEvent`s mit dem Wert in `detail` (alle `bubbles` und `composed`).
- **Optionale Props nehmen `undefined`**, und `undefined` wirkt wie eine weggelassene Prop (auch bei `bind:`).
- **Texte** sind englisch und kommen aus einem Katalog; eine Prop gewinnt immer, `setStrings(de)` schaltet die ganze
  Seite auf Deutsch ([Texte und Sprache](../README.md#standardtexte-und-sprache)).
- **Formulare:** die Element-Felder nehmen über `ElementInternals` an `<form>` teil (Wert, Reset, Validierung);
  ID-Verweise (`aria-describedby`, `list`) reichen nicht durch den Shadow Root, dafür gibt es `label`, `hint`, `error`
  ([Formulare](../README.md#formulare-native-attribute-und-validierung)).

## Umstieg von stuffcloud

stuffclouds `web/apps/web/src/ui` und die Gegenstücke in kern. Details zu jeder Zeile stehen im README in den
Abschnitten zum Abgleich; welche Tests stuffclouds Tests ersetzen, steht in
[`docs/testing.md`](testing.md#stuffcloud-mapping).

| stuffcloud | kern | Abweichung, Details |
| --- | --- | --- |
| `Button` (`primary`, `ghost`, `danger`, `size="compact"`, `size="icon"`, `wide`) | `Button` | `ghost` → `variant="secondary"`, `compact` → `size="sm"`; [Tabelle](../README.md#formulare-und-inhalt-abgleich-mit-stuffcloud-und-nagellacke) |
| `LinkButton` | `Button href` | gesperrt bleibt es ein `<a>` ohne `href` |
| `Card` | `Card` | Prop `tag` heißt `as`; klickbar mit `onclick` |
| `Input`, `Select`, `Checkbox`, `field.css`, `field-ids.ts` | `Input`, `Select`, `Checkbox`, `Field` | Fehler als `role="alert"`; `Field`-Snippet liefert `{ describedby, invalid, required }` |
| `Dialog` | `Modal` | `dismissOnBackdrop` → `closeOnBackdrop`; `dismissible`, `initialFocus`, `oncancel` |
| `FileDropzone`, `accept.ts` | `FileDrop mode="dispatch"`, `matchesAccept`, `splitFiles` | [FileDrop](../README.md#formulare-und-inhalt-abgleich-mit-stuffcloud-und-nagellacke) |
| `ToastRegion`, `toast.svelte.ts` (Klasse `Toaster`) | `Toaster`, `toast()`, `createToastQueue()` | eine seitenweite Warteschlange; Rückgängig/Commit |
| `Progress`, `progress.ts` | `Progress` | `tone`, `valueText`, `hideLabel` |
| `CodeBlock` | `CodeBlock` | die Kopier-Ansage bleibt bis zum nächsten Klick |
| `Tabs`, `tabs.css`, `tabs-nav.ts` | `Tabs` (`panel` optional) | Tastatur intern; [Navigation](../README.md#navigation-und-inhalt-abgleich-mit-stuffcloud-und-nagellacke) |
| `TabLinks` | `TabLinks` | `onnavigate` für Routing im Client |
| `Tile`, `TileGrid` | `Tile`, `TileGrid` | |
| `Mascot`, `mascots.ts`, `motion.ts` | `Mascot`, `MASCOT_SOURCES`, `BOB_PERIOD_MS`, `BOB_OFFSET_PX`, `COMPACT_MAX_WIDTH_PX` | [Mascot](../README.md#mascot-pixel-art) |
| `ReorderList`, `PageGrid` | `SortableList`, `SelectGrid` | [Sortieren und Auswählen](../README.md#sortieren-und-auswählen-abgleich-mit-stuffcloud) |
| `button.css`, Design-Tokens | Theme `code` | Token-Zuordnung in [`docs/themes.md`](themes.md#stuffcloud-variables-and-their-kern-tokens-theme-code) |

Was in stuffcloud bleibt: App-Layout, Routen, eigene Seiten und alles, was nur stuffcloud kennt. kern besitzt das
Theme `code`; stuffclouds `docs/design` bleibt die Design-Quelle, ein Drift-Check hält beide zusammen
([Code-Theme-Quelle](themes.md#code-theme-source-37)).
