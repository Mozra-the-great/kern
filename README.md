# kern

**Kern**-Komponenten für Svelte 5: ein Satz zugänglicher Bausteine, viele Marken.
Ein Theme setzt über `--k-*`-CSS-Variablen nicht nur Farben, sondern auch Form
(Radien, Randbreite), Tiefe (Schatten), Schrift und Bewegung. Dieselben
Komponenten sehen deshalb in Stuffcloud eckig mit Pixel-Schatten aus und in
Flower-Designs weich mit Pillen.

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
| `pop`, Kagi-basiert | geplant, Entwürfe in Arbeit |

Schriften werden nicht mitgeliefert. Stuffcloud braucht Inter, JetBrains Mono und
Silkscreen, Flower braucht Figtree (siehe `index.html`).

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

Listen (`options`, `items`, `tabs`, `columns`, `rows`, `commands`, `nodes`, `expanded`) werden
als JSON-Attribut übergeben.

Ereignisse:

- `change`: Felder, Tabs, Combobox, DatePicker, Slider (`detail` = Wert), Pagination (Seite),
  Carousel (Folienindex)
- `input`: Slider, während des Ziehens
- `select`: DropdownMenu, ContextMenu, CommandPalette, TreeView (`detail` = id)
- `toggle`: Popover (`detail` = offen), TreeView (`detail` = `{id, expanded}`)
- `files`: FileDrop (`detail` = `File[]`, auch als `el.files`)
- `close`: Modal, Drawer, Popover, CommandPalette · `dismiss`: Alert · `remove`: Tag

Slots: Tab-Inhalte sind Kinder mit `data-tab="<id>"`, Folien von `<k-carousel>` sind seine
Kinder. Benannte Slots: `footer` (Modal, Drawer, Card), `media` (Card), `actions` (Alert,
EmptyState, Navbar), `icon` (EmptyState), `brand` (Navbar), `trigger` (Popover, nur Inhalt
des Buttons). Bei `<k-context-menu>` ist der Standard-Slot die Zielfläche.

Combobox, DatePicker (sendet ISO `yyyy-mm-dd`), Slider und FileDrop nehmen wie Input über
`name` am Formular teil. Texte wie `prev-label`, `menu-label` oder `no-results` lassen sich
per Attribut übersetzen; die Vorgaben sind englisch.

## Komponenten (Kern-Set)

Aktionen: Button, IconButton, Link, DropdownMenu, ContextMenu, CommandPalette ·
Status: Badge, Tag, Avatar, Spinner, Progress, Skeleton, Alert, Toaster/`toast()` ·
Formulare: Field, Input, Textarea, Select, Combobox, DatePicker, Slider, FileDrop, Checkbox, RadioGroup, Switch ·
Inhalt: Card, Divider, EmptyState, Table (sortierbar, auf Mobil als Karten), Carousel ·
Overlays: Modal, Drawer, Tooltip, Popover ·
Navigation: Navbar, Breadcrumb, Pagination, Tabs, Accordion/AccordionItem, TreeView

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
