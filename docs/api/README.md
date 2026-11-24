# API-Referenz: Lesehilfe

Die Referenz selbst ist [`reference.md`](reference.md). Sie wird erzeugt und nie von Hand bearbeitet; diese Seite
erklärt, wie man sie liest und woher sie kommt.

## Aufbau

Pro Komponente ein Abschnitt, alphabetisch, mit Import, Element-Tag und Einstieg und Links auf die Quellen. Darunter:

| Tabelle | Inhalt |
| --- | --- |
| **Svelte: Props** | jede Prop des `interface Props` der Komponente: Typ, Vorgabe, Beschreibung. `(Pflicht)` = ohne `?`; `` (`bind:`) `` = mit `bind:` bindbar. `geerbt` = ein HTML-Attribut, das die Komponente mit eigener Vorgabe übernimmt (etwa `type = 'button'`). |
| **Svelte: Callbacks** | Props `on…`, die eine Funktion nehmen. Svelte 5 meldet so, was die Nutzerin getan hat; der Wert kommt als Argument, nicht als `event.detail`. |
| **Svelte: Snippets** | Props vom Typ `Snippet`, also Inhalte (`{#snippet footer()}…{/snippet}`, `children` = Inhalt zwischen den Tags). |
| **Element: Attribute und Properties** | jede Prop des Custom Elements mit HTML-Attribut (kebab-case) und Property (camelCase). `(JSON)` = Liste oder Objekt, als Attribut ein JSON-String, als Property der Wert selbst. `(gespiegelt)` = die Property schreibt das Attribut zurück (für CSS-Selektoren wie `[open]`). |
| **Nur als Property oder Methode** | Mitglieder ohne Attribut, etwa `files` oder `reset()`. |
| **Weitergereichte native Attribute** | Attribute, die das Element unverändert ans innere `<input>`/`<select>`/`<textarea>` gibt (`maxlength`, `pattern` …). |
| **Formular-assoziiert** | das Element nimmt über `ElementInternals` an `<form>` teil und hat die Validierungs-API eines nativen Felds. |
| **Element: Ereignisse** | `CustomEvent`s mit dem Typ von `detail`. Alle `bubbles` und `composed`. |
| **Element: Slots** | `(Standard)` = Kinder ohne `slot`, sonst `slot="<name>"`. |
| **Eigene CSS-Variablen** | `--k-<komponente>-*`, die das Stylesheet der Komponente liest; Themes und Apps können sie setzen. Die allgemeinen Tokens stehen in [`docs/themes.md`](../themes.md). |

Am Ende stehen die exportierten Datentypen, getrennt für das Svelte-Paket (`import type { TabItem } from
'@mozra-the-great/kern'`) und die Elemente (`import type { TabItem } from '@mozra-the-great/kern/elements'`). Die
Element-Formen sind nicht generisch und erlauben nur, was sich als JSON übergeben lässt.

## Vorgaben

- Ein Code-Wert wie `'md'` oder `false` ist die Vorgabe aus der Destrukturierung von `$props()` bzw. aus dem Wrapper.
- „Katalog `modal.closeLabel`“: die Prop hat keinen festen Text, sondern liest ihn aus dem Textkatalog, solange sie
  fehlt. Englisch ist die Vorgabe, `setStrings(de)` schaltet um
  ([Texte und Sprache](../../README.md#standardtexte-und-sprache)); die englischen Texte stehen in
  `src/lib/components/strings.ts`.
- „(wie Button)“ beim Element: der Wrapper setzt keine eigene Vorgabe, die Svelte-Komponente dahinter tut es.
- Eine leere Vorgabe heißt `undefined`, und `undefined` wirkt immer wie eine weggelassene Prop.

## Regeln, die in keiner Tabelle stehen

- **Ereignisse und Callbacks nur bei Nutzereingaben.** Setzt die App `value`, `open`, `tabs` usw., kommt nichts.
  Einzige Ausnahme ist `complete` der Effekte (Ende einer Animation). Ereignisse feuern nie während des Renderns.
- **Boolean-Attribute mit Vorgabe `true`** schaltet `="false"` ab (`pause-on-hover="false"`); bei den Daten-Elementen
  heißen sie umgekehrt (`no-search`, `no-legend`). In React die camelCase-Property mit `false`
  ([`docs/react.md`](../react.md#properties-und-attribute)).
- **Weitere Attribute** einer Svelte-Komponente mit `extends HTML…Attributes` gehen an ihr Wurzelelement
  (`id`, `aria-*`, `data-*`, Ereignis-Handler).
- **Typen der Element-Properties** sind die der `.d.ts` (`dist-elements/kern-elements.d.ts`); ein Attribut ist immer
  ein String und wird beim Lesen umgewandelt.

## Wie die Referenz entsteht

`npm run docs:api` (`scripts/api-reference.mjs`) liest:

- die öffentlichen Komponenten aus `src/lib/index.ts` und je Komponente ihr `interface Props` mit JSDoc, die
  Vorgaben aus `$props()`, Katalogtexte aus `prop ?? strings().…` und die `--k-<komponente>-*`-Variablen ihres
  Stylesheets (über den Svelte-Parser und die TypeScript-API, ohne Build);
- `custom-elements.json` (aus `src/elements` erzeugt von `scripts/elements-manifest.mjs`, CI prüft es) für die
  Elemente;
- `src/elements/types.ts` für die Datentypen der Elemente.

`npm run docs:check` erzeugt die Datei im Speicher und vergleicht sie mit der eingecheckten; CI führt das im Pflicht-
Check `build` aus und schlägt fehl, wenn sie veraltet ist. Wer eine Prop, ein Ereignis oder einen Kommentar ändert,
führt danach `npm run build` (aktualisiert `custom-elements.json`) und `npm run docs:api` aus und committet beides.
Die Beschreibungen sind die Quelltext-Kommentare und deshalb englisch; diese Lesehilfe und die Leitfäden sind deutsch.
