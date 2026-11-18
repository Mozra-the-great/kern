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
Saison-Deko) unter `kern-ui/assets/stuffcloud/…`, siehe [`assets/README.md`](assets/README.md).
Die Komponenten laden sie nie; sie sind für eigene Seiten gedacht.

Ein neues Theme ist eine CSS-Datei, die die Variablen aus `src/lib/themes/base.css`
für `[data-theme^='name']` überschreibt, plus ein `@import` in `themes/index.css`.

## Svelte

```bash
npm i kern-ui
```

```svelte
<script>
	import 'kern-ui/themes.css';
	import { Button, Input, Modal, Toaster, toast } from 'kern-ui';
	let open = $state(false);
</script>

<!-- <html data-theme="flower"> -->
<Input label="Name" />
<Button onclick={() => toast.ok('Gespeichert.')}>Speichern</Button>
<Toaster />
```

## Custom Elements

```html
<html data-theme="stuffcloud">
<link rel="stylesheet" href="kern-ui/dist/themes/index.css" />
<script type="module" src="kern-ui/dist-elements/kern-elements.js"></script>

<form>
	<k-input name="name" label="Name" required></k-input>
	<k-select name="size" label="Größe" options='[{"value":"s","label":"Klein"}]'></k-select>
	<k-button type="submit">Absenden</k-button>
</form>
<k-toaster></k-toaster>
<script> window.kern.toast('Hallo') </script>
```

Listen (`options`, `items`, `tabs`, `columns`, `rows`, `commands`, `nodes`, `expanded`, `steps`,
`suggestions`, `swatches`, `lines`, `format`, `values`, `data`, `status-labels`, bei TagInput `value`, bei Typewriter `text`) werden als
JSON-Attribut übergeben. Attribute mit Vorgabe `true` (`pausable`, `pause-on-hover`, `once`, `in-view`,
`caret`, `blink` …) schaltet `="false"` ab; bei den Daten-Elementen heißen sie umgekehrt (`no-search`,
`no-stack`, `no-legend`, `no-last-dot`, `rising-is-bad`). `<k-stat>` nimmt eine `<k-sparkline>` im Slot `spark`.

Ereignisse:

- `change`: Felder, Tabs, Combobox, DatePicker, Slider, NumberInput (Zahl oder `null`), PinInput,
  Rating, SegmentedControl, ColorPicker (Hex), TagInput (`string[]`), Pagination (Seite), Carousel (Folienindex)
- `complete`: PinInput (alle Felder gefüllt, `detail` = Code), Typewriter (ohne `loop`), Scramble,
  CountUp, Terminal
- `step`: Stepper mit `clickable`, Klick auf einen erledigten Schritt (`detail` = Index)
- `input`: Slider, während des Ziehens
- `select`: DropdownMenu, ContextMenu, CommandPalette, TreeView (`detail` = id), DataTable (`detail` =
  gewählte Schlüssel nach `row-key`), Heatmap (`detail` = `{date, value}`)
- `sort`: DataTable (`detail` = `{key, dir}`)
- `toggle`: Popover (`detail` = offen), TreeView (`detail` = `{id, expanded}`)
- `files`: FileDrop (`detail` = `File[]`, auch als `el.files`)
- `close`: Modal, Drawer, Popover, CommandPalette · `dismiss`: Alert · `remove`: Tag

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

Aktionen: Button, IconButton, Link, DropdownMenu, ContextMenu, CommandPalette ·
Status: Badge, Tag, Avatar, Spinner, Progress, Skeleton, Alert, Toaster/`toast()` ·
Formulare: Field, Label, Input, Textarea, Select, Combobox, DatePicker, NumberInput, PinInput, TagInput, ColorPicker, Slider, Rating, FileDrop, Checkbox, RadioGroup, SegmentedControl, Switch ·
Inhalt: Card, Divider, EmptyState, Table (sortierbar, auf Mobil als Karten), Carousel ·
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
npm install
npm run dev        # Demo: /index.html (Svelte) und /elements.html (Custom Elements)
npm run check      # svelte-check
npm run build      # dist/, dist-elements/, demo-dist/
```

## Lizenz

GNU General Public License v3.0 oder später, siehe [`LICENSE`](LICENSE) und [`NOTICE`](NOTICE).
