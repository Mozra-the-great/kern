# Barrierefreiheit

Erklärung zur Barrierefreiheit von kern: welches Ziel gilt, was automatisch geprüft wird, was die Komponenten
zusichern, wo die bekannten Grenzen liegen und was die App selbst beitragen muss. Wie die Prüfungen gebaut sind
(Specs, Matrizen, Abdeckungs-Wächter, Canaries), steht in [`docs/testing.md`](testing.md#the-accessibility-suite).

## Ziel und Geltungsbereich

- **Ziel: WCAG 2.2, Stufe AA**, für jede Komponente in jedem Theme, hell und dunkel, in beiden Builds (Svelte-Paket
  und Custom Elements; die Elemente rendern dieselben Svelte-Komponenten).
- Das ist das Ziel, gegen das kern baut und testet, keine Zertifizierung: es gibt kein externes Audit. Ein Verstoß
  gegen eine der Regeln unten gilt als Bug.
- kern ist eine Bibliothek. Eine Seite wird nicht dadurch konform, dass sie kern benutzt; Beschriftungen, Texte,
  Bilder, Überschriften und Abläufe kommen aus der App ([Was die App beiträgt](#was-die-app-beiträgt)).

## Was automatisch geprüft wird

Jeder Pull Request lässt diese Prüfungen im Pflicht-Check `build` laufen. Die Browser-Prüfungen laufen in Chromium
über **alle** Custom Elements (und damit jede Komponente) in den acht Theme-Varianten `code`, `code-light`, `flower`,
`flower-wald`, `pop`, `pop-dark`, `line` und `line-light`. Ein neues Element ohne Eintrag in den Abdeckungstabellen
lässt den Build scheitern (#25).

| Prüfung | Was | Wo |
| --- | --- | --- |
| axe-core | WCAG 2 A/AA, 2.1, 2.2 AA und Best Practice: keine Verstöße der Stufen *serious* und *critical*, auf einer Seite mit jedem Element und in 15 geöffneten Zuständen (Modal, Drawer, Palette, Popover, Menüs, Kalender, Farbwähler, Vorschläge, Toasts, Tooltip, Fehler an Feldern, sortierte Datentabelle, Telefon-Menü), dazu auf den übrigen Testseiten | `a11y-matrix.spec.ts`, `a11y.spec.ts` |
| Tastatur | jedes bedienbare Element mit Tab erreichbar, mit sichtbarem Fokusring nach Tastatur (keiner nach Mausklick), ohne Tab-Schleife; jedes Element mit den Tasten seines WAI-ARIA-Musters bedienbar | `a11y-keyboard.spec.ts`, `a11y-keys.spec.ts` |
| Overlays | modale Dialoge (Modal, Drawer, Palette): Fokus hinein, Tab bleibt darin, Escape schließt, Fokus zurück zum Auslöser; alle anderen Overlays geben den Fokus frei | `a11y-overlays.spec.ts` |
| Reduzierte Bewegung | unter `prefers-reduced-motion: reduce` keine Animation und kein Übergang länger als einen Frame, auch nach Hover, Fokus und Bedienung; kein weiches Scrollen; Effekte zeigen sofort ihren Endzustand | `a11y-motion.spec.ts` |
| Reflow (WCAG 1.4.10) | bei 320 × 640 px kein horizontales Scrollen der Seite und kein abgeschnittenes Bedienelement, auch in Overlays; beide Demo-Seiten (`index.html`, `elements.html`) scrollen in allen acht Theme-Varianten nicht seitwärts | `a11y-reflow.spec.ts`, `tests/targets/reflow.spec.ts` |
| Kontrastmodus | unter `forced-colors: active` Kanten, Fokusring, Zustände ohne Hintergrundfarbe, `GrayText` für gesperrt, keine durchschlagenden Theme-Farben; axe ohne Kontrastregel | `forced-colors.spec.ts` |
| Kontrast der Tokens | jede `data-theme`-Variante: Text 4,5:1, Ränder, Fokus und Markierungen 3:1; Akzentfarben mit derselben Messung | `tests/tokens/contrast.test.ts`, `tests/unit/accent.test.ts` |
| Touch-Ziele | jedes bedienbare Teil der Demo mindestens `--k-tap-target` groß (44 px bei grobem Zeiger) | `tests/targets/` |
| Rollen und Namen | Verhalten der Komponenten in jsdom (noch nicht jeder, siehe Stufe 2 in `docs/testing.md`): Rollen, zugängliche Namen, `aria-*`, Fokus; jede exportierte Komponente im Smoke-Test (Rolle und Name, wo sie benannt sein muss) | `tests/dom/` |

Jede Browser-Prüfung hat einen Canary, der sie an einem absichtlichen Verstoß scheitern lässt (fehlende
Beschriftung, fehlender Ring, laufende Animation, abgeschnittener Knopf): keine kann grün sein, weil sie nichts
ansieht. Details und wie man eine Spec lokal startet: [`docs/testing.md`](testing.md#the-accessibility-suite).

## Was die Komponenten zusichern

- **Tastatur:** jede Bedienung ohne Maus, nach den Mustern der WAI-ARIA Authoring Practices (Pfeile, Home/End, Enter,
  Leertaste, Escape). Die Tastenbelegung je Komponente steht in ihren Tests und, wo sie besonders ist (SelectGrid,
  Resizable), im README.
- **Fokus:** sichtbarer Ring in `--k-focus` (in jedem Theme mit 3:1 geprüft, im Kontrastmodus `Highlight`);
  modale Dialoge fangen den Fokus und geben ihn zurück; nach dem Entfernen eines Eintrags (Toast, Datei, Listeneintrag)
  wandert der Fokus zu einem sinnvollen Nachbarn statt auf die Seite.
- **Ansagen:** Feldfehler als `role="alert"`, Toaster und LiveAnnouncer mit von Anfang an vorhandenen Live-Regionen,
  `StatusMessage` als sichtbare Live-Region, CopyButton und DownloadButton sagen ihr Ergebnis bei jedem Klick neu an.
- **Zeit:** Toasts halten an, solange sie Fokus oder Mauszeiger haben oder der Tab verborgen ist (WCAG 2.2.1);
  Gefahr-Toasts bleiben bis zum Schließen.
- **Nicht nur Farbe:** Zustände haben eine Form (Haken, Punkt, Rand, Position), auch im Kontrastmodus.
- **Texte:** alle Standardtexte (auch nur gesprochene, etwa „(opens in a new tab)“) kommen aus einem Katalog mit
  vollständigem deutschem Bündel; `lang` der Seite kann ihn steuern (`followLang`).
- **Touch-Ziele:** 44 px bei grobem Zeiger, in Code und Pop für jeden Zeiger; Icon-Buttons 48 px in Code und Pop.

## Bekannte Grenzen

- **Spinner unter reduzierter Bewegung.** `Spinner` und das Lade-Zeichen von `Button loading` drehen sich weiter, aber
  nur einmal pro 2 s statt alle 0,8 s. Ein stehender Ladeindikator sagt nicht, dass etwas läuft; die Bewegung ist
  wesentlich (WCAG 2.3.3). Es ist die einzige Ausnahme, und der Bewegungstest lässt genau diese beiden durch.
  Der Zustand hängt nicht an der Bewegung: `Spinner` ist ein `role="status"` mit unsichtbarem Text, und `Button loading`
  sagt „Loading“ (`loadingLabel`, Katalog `button.loadingLabel`) höflich an, ohne den Namen des Buttons zu ändern (#109).
- **Nur Chromium automatisch.** Alle Browser-Prüfungen laufen in Chromium (Playwright). Firefox und Safari sind nicht
  automatisch geprüft, der Kontrastmodus nur über Chromiums Emulation von `forced-colors`.
- **Kein Test mit Hilfsmitteln.** Nicht automatisiert, weil es Menschen braucht: Ausgabe von NVDA, JAWS und VoiceOver,
  200 % Textgröße und Text-Abstände (WCAG 1.4.4, 1.4.12), Bildschirmlupe, Spracheingabe.
- **Theme-Varianten:** `code-paper` und `code-contrast` laufen nicht durch die Browser-Matrix, nur durch den
  Kontrasttest der Tokens.
- **Shadow DOM (Custom Elements):** ID-Verweise wie `aria-labelledby`, `aria-describedby` und `list` reichen nicht
  durch den Shadow Root; dafür gibt es `label`, `hint` und `error`. `<k-tooltip>` gibt seinen Text einem Auslöser im
  Light DOM als `aria-description`, das nicht jeder Screenreader vorliest.
- **Autofill und Passwort-Manager** sind nur mit Chrome geprüft; Firefox, Safari und Erweiterungen nicht (README
  [Autofill](../README.md#autofill-und-passwort-manager)). Für Login-Formulare im Zweifel native `<input>`.
- **Ansagen brauchen die App:** ohne `<LiveAnnouncer />` bzw. `<k-live-announcer>` gehen `announce()`-Nachrichten ins
  Leere; `SortableList` sagt eine Verschiebung nicht selbst an, weil nur die App die neue Reihenfolge benennen kann.
- **Akzent nur mit CSS:** `themes/accent.css` sichert nur die Füllung (`--k-accent`, `--k-on-accent`); den Kontrast
  aller Akzent-Tokens garantieren nur `installAccent` und `accentCss` ([`docs/themes.md`](themes.md#nur-css-ohne-javascript)).
- **Overlays ohne Portal:** ein Vorfahr mit `transform`, `filter` oder `contain` verschiebt Popover, Menüs und
  Kalender; die Bedienung bleibt, die Lage kann falsch sein.
- **ColorPicker** behält im Kontrastmodus die Farben seiner Muster (sie sind der Inhalt); nur die Ränder werden
  Systemfarben.

## Was die App beiträgt

- Verständliche Beschriftungen, Hinweise und Fehlertexte über die Props (`label`, `hint`, `error`, `aria-label` bei
  Icon-Buttons), Alternativtexte für Bilder (Marken-Grafiken bindet die App selbst ein; `Mascot` ohne `label` ist dekorativ).
- `lang` auf `<html>`, ein Seitentitel, eine sinnvolle Überschriftenfolge; `SkipLink` als erstes Element.
- In einer SPA Seitenwechsel und Ergebnisse über `announce()` ansagen, wenn der Fokus nicht wandert.
- Eigene Komponenten nach denselben Regeln: Fokusring, Tastatur, Kontrastmodus (Checkliste im PR-Template von kern),
  Touch-Ziele über `--k-tap-target`.

## Rückmeldung

Ein Problem bitte als [Issue](https://github.com/Mozra-the-great/kern/issues) melden, mit Komponente, Theme, Browser
und, wenn möglich, Hilfsmittel. Sicherheitsrelevantes nach [`SECURITY.md`](../SECURITY.md).
