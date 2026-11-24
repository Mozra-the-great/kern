# React 19 über die Custom Elements

React 19 unterstützt Custom Elements vollständig: es setzt Props als Properties, wenn das Element sie kennt, und
hängt Listener für `on<ereignis>` direkt an. kern braucht deshalb keinen eigenen React-Wrapper; eine React-App nimmt
die Elemente (`<k-input>`, `<k-modal>` …) und bekommt dazu Typen für JSX. Dieser Weg ist für nagellacke gedacht
(React heute, später Svelte) und durch eine Test-App in CI belegt ([Beweis](#was-die-test-app-belegt)).

Die vollständige Liste der Attribute, Properties, Ereignisse und Slots jedes Elements steht in der
[API-Referenz](api/reference.md). Installation und Theme: [Leitfaden](consumer-guide.md).

## Einrichten

```tsx
// main.tsx: vor dem ersten Render, statisch importiert
import '@mozra-the-great/kern/themes/flower.css';
import '@mozra-the-great/kern/elements/input';
import '@mozra-the-great/kern/elements/modal';
import '@mozra-the-great/kern/elements/toaster'; // setzt auch window.kern (toast, strings, accent)
import type {} from '@mozra-the-great/kern/elements/react'; // JSX-Typen, einmal in der App
```

- **Elemente vor dem ersten Render registrieren.** Kennt der Browser den Tag beim Render noch nicht, schreibt React
  ein Array als Attribut (`options="[object Object]"`), und das Element startet beim späteren Upgrade mit einem Fehler.
  Also statisch importieren, nicht per `import()` nach dem Mount.
- **Einzelne Einstiege** (`elements/<name>`) teilen sich die Laufzeit in gemeinsamen Chunks; nur benutzte Elemente
  landen im Bundle. `@mozra-the-great/kern/elements` lädt alle (Größen: README
  [Einzelne Elemente laden](../README.md#einzelne-elemente-laden)).
- **Typen:** `import type {} from '@mozra-the-great/kern/elements/react'` ergänzt `JSX.IntrinsicElements` um jeden
  `k-*`-Tag mit seinen Props, Ereignissen (mit typisiertem `detail`), `ref`, `key`, `class` und den üblichen
  HTML-Attributen. `document.querySelector('k-input')` ist ein `KInputElement`. Datentypen wie `SelectOption` oder
  `TabItem` kommen aus `@mozra-the-great/kern/elements`.

## Properties und Attribute

React 19 prüft `name in element`: was das Element als Property kennt, wird Property, alles andere Attribut.

| Was | In React | Beispiel |
| --- | --- | --- |
| kern-Props, auch Listen und Objekte | als Property; neue Arrays bei jedem Render lösen nichts aus | `options={SIZES}`, `tabs={tabs}`, `rows={rows}` |
| Strings, Zahlen, Booleans | als Property, unter dem camelCase-Namen der Referenz | `label="Name"`, `keepHint`, `max={5}` |
| Boolean mit Vorgabe `true` abschalten | camelCase-Property mit `false` | `closeOnBackdrop={false}`, `dismissible={false}` |
| weitergereichte native Attribute | als Attribut; das Element gibt sie ans innere Feld | `maxlength="60"`, `pattern="[a-z]+"`, `aria-label` |
| `name`, `disabled`, `form`, `required` | als Property; Formular-Teilnahme wie nativ | `name="email"`, `form="checkout"` |
| `class`, `id`, `data-*`, `slot` | wie bei jedem Element | `class="wide"`, `slot="footer"` |
| nur Property (ohne Attribut) | nur über Prop oder `ref` | `files` bei `<k-file-drop>`, `getContent` bei `<k-download-button>` |

Die Spalten „Attribut“ und „Property“ der [Referenz](api/reference.md) zeigen beide Namen. Ein kebab-case-Attribut
in JSX (`close-on-backdrop={false}`) wäre in React nur ein entferntes Attribut; für `false` deshalb immer die
camelCase-Property. JSON-Strings (`options='[…]'`) funktionieren, sind in React aber unnötig.

## Ereignisse

- Handler heißen `on` plus **exakter Ereignisname**, klein geschrieben: `onchange` → `change`, `onclose`,
  `oncancel`, `oncopy-error`. `onChange` (camelCase) bekommt das kern-Ereignis nicht; die Typen lassen es für kern-
  Ereignisse deshalb weg.
- Der Wert steht in `event.detail` und ist typisiert (`(e) => setName(e.detail)`).
- Native Ereignisse gehen klein geschrieben auch: `onclick`, `oninput`, `onfocus`.
- **Nur Nutzereingaben** lösen Ereignisse aus, nie das Setzen von Props aus React, nie das Mounten (auch nicht der
  doppelte Mount von StrictMode). `<k-modal open={false}>` aus React meldet kein `close`.
- `change` kommt beim Bestätigen (Blur, Enter). Für jeden Tastendruck das native `oninput` nehmen und
  `e.currentTarget.value` lesen; die Cursorposition bleibt erhalten, auch wenn der State bei jedem Tastendruck
  zurückgeschrieben wird.
- `cancel` (Modal, Drawer) ist abbrechbar: `oncancel={(e) => e.preventDefault()}` hält den Dialog offen.

## Kontrollierte Felder

```tsx
const [name, setName] = useState('');
const [open, setOpen] = useState(false);
const [tab, setTab] = useState('lacke');

<k-input label="Name" value={name} onchange={(e) => setName(e.detail)} />
<k-modal open={open} title="Löschen?" onclose={() => setOpen(false)}>
	<p>Der Lack wird entfernt.</p>
	<div slot="footer"><k-button onclick={() => setOpen(false)}>Abbrechen</k-button></div>
</k-modal>
<k-tabs tabs={tabs} value={tab} label="Hauptnavigation" onchange={(e) => setTab(e.detail)} />
```

State → Element → Eingabe → `onchange` → State: ein Commit pro Eingabe, keine Schleife, weil das Setzen von
`value` kein Ereignis auslöst. Kinder, die React rendert (auch mit `slot="footer"`), bleiben React-Kinder.

## Formulare

Die Formular-Elemente sind echte Formularfelder über `ElementInternals`:

- `name` bringt den Wert in `FormData`; `<form onSubmit>` sieht sie wie native Felder. Abschicken mit
  `<k-button type="submit">`.
- `required`, `pattern`, `minlength`, `min`/`max` blockieren das Absenden; `onSubmit` läuft nur, wenn alles gültig ist.
- `disabled` nimmt ein Feld aus Validierung und Versand; `form="id"` verbindet ein Feld außerhalb des `<form>`.
- Reset: `<k-button type="reset">` oder `form.reset()` setzt jedes Element auf seinen Anfangswert, ohne Ereignis;
  `<form onReset>` setzt den React-State zurück.
- Serverfehler: `ref.current.setCustomValidity('Name ist vergeben')` markiert ein Feld als ungültig; `''` hebt es auf.
  `ref.current` hat `validity`, `checkValidity()`, `reportValidity()`, `form` und die Methoden des Elements
  (`reset()` bei `<k-file-drop>`).

Das vollständige Formular-Beispiel (Input, Select, Checkbox, Toast, Absenden, Zurücksetzen) steht im README unter
[React 19: ein getestetes Beispiel](../README.md#react-19-ein-getestetes-beispiel); es läuft genau so als Test.

## Toasts, Texte, mehrere Roots

- `window.kern.toast(...)` (oder `import { toast } from '@mozra-the-great/kern/elements/toaster'`) schreibt in eine
  seitenweite Warteschlange; jeder `<k-toaster>` zeigt sie. Ein Toaster pro Seite genügt, auch bei mehreren React-Roots.
- `window.kern.strings.set(window.kern.strings.de)` schaltet die Texte aller eingehängten Elemente in allen Roots um,
  ohne React-Render.
- `window.kern.announce('Gespeichert')` mit einem `<k-live-announcer>` in der Seite sagt etwas an, ohne dass der Fokus
  wandert.

## Übergang von React zu Svelte

Beide Builds teilen sich auf einer Seite Toast-Warteschlange, Ansagen und Textkatalog (über
`globalThis[Symbol.for('kern.…')]`). Während einer schrittweisen Migration:

- **Genau einen Toaster** einbinden: solange React-Seiten da sind `<k-toaster>` im gemeinsamen Layout, danach
  `<Toaster />`. Zwei Toaster zeigen jeden Toast doppelt. Dasselbe gilt für LiveAnnouncer (der erste füllt seine
  Regionen, weitere bleiben still).
- Props heißen in beiden Builds meist gleich (camelCase); Ausnahmen sind abschaltende Attribute der Elemente wie
  `noRejectMessages` (Svelte: `rejectMessages={false}`). Aus `onchange={(e) => set(e.detail)}` wird in Svelte
  `bind:value` oder eine Callback-Prop, die den Wert direkt bekommt (Tabs: `onchange={(id) => …}`). Die
  [Referenz](api/reference.md) zeigt für jede Komponente beide Seiten untereinander.
- Elemente-Slots (`slot="footer"`) werden in Svelte zu Snippets (`{#snippet footer()}`).

## Was die Test-App belegt

`tests/fixtures/react-app` ist eine React-19-App (StrictMode, Entwicklungsmodus, ein Root pro Szenario), die die
Elemente wie eine echte App über die Paket-Einstiege importiert (`src/kern.ts`). Playwright fährt sie in Chromium;
jeder Konsolenfehler und jeder `pageerror` lässt den Test scheitern. `npm run test:types` prüft dieselbe App mit
strengem TypeScript (`skipLibCheck: false`, also auch die erzeugten `.d.ts`). Beides läuft im Pflicht-Check `build`.

| Spec (`tests/elements/`) | Belegt |
| --- | --- |
| `react-readme.spec.ts` | das README-Beispiel: Validierung blockiert, gültiges Formular sendet, Reset leert |
| `react-forms.spec.ts` | Arrays als Properties, Strings als Attribute; kein Ereignis beim Mount und bei neuen Props; Eingabe-Rundlauf ohne Schleife; Cursor bleibt; ein Ereignis pro Nutzeraktion; Pflichtfelder blockieren über `ElementInternals`; Reset ohne Ereignis; Refs mit Formular-API |
| `react-overlays.spec.ts` | Modal aus State, Fokus, React-Kinder, Escape mit `cancel` + `close`; Schließen aus React meldet nichts; Hintergrund und ✕; `dismissible={false}`; `preventDefault()` in `oncancel`; `closeOnBackdrop={false}`; Drawer; Popover |
| `react-nav-data.spec.ts` | Tabs (ein Ereignis, kein Absturz, kein Echo), Tastatur, TabLinks mit Routing im Client; DataTable sortieren und auswählen, Pagination |
| `react-lists.spec.ts` | SortableList, SelectGrid, FileDrop (`el.files`, `reset()` aus React) |
| `react-toasts.spec.ts` | Toasts über Roots hinweg, Rückgängig/Schließen/Aktion je einmal, Textwechsel in allen Roots, Toasts ohne Toaster warten |
| `react-lifecycle.spec.ts` | Aushängen entfernt Elemente, Listener und Scroll-Sperre; Ein-/Aushängen in Schleife häuft nichts an; Listen mit `key` sortieren um, ohne Zustand zu verlieren |

Lokal: `npm run build`, dann `npm run test:elements` (baut die App vorher mit `npm run build:react-app`) und
`npm run test:types`.

**Nicht belegt:** Server-Rendering (Next.js, Remix): die Elemente rendern erst im Browser, ein Server-Render liefert
nur den leeren Tag; React-Versionen vor 19 (sie setzen alles als Attribut und kennen `on<ereignis>` für Custom
Events nicht); andere Browser als Chromium.
