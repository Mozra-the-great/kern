# Brand assets

Optional artwork per brand, shipped with the package as plain files
(`@mozra-the-great/kern/assets/<brand>/<group>/<file>.svg`). The components never load them;
use them in your own pages, for example as an `EmptyState` icon or seasonal decoration. The
Code pixel art can also be drawn with the `Mascot` component (`<k-mascot>`), which takes any
file of `code/` by name (`stuffy`, `tool-stickers/sticker-qr`) and the URL you serve it from
(README, "Mascot"); the tool stickers have their own component, `Sticker` (`<k-sticker>`, README, "Sticker"). The pop, line and flower art is vector art: show it with a plain `<img>` at any
size (README, "Mascot", last part).

Rules for every brand:

- **Decorative by default.** Give the `<img>` an empty `alt=""`. When a picture carries meaning (a
  mascot that says "done", an empty state), describe it in `alt` or in the surrounding text.
- **Mascots never speak, no filler copy.** No speech bubbles, greetings or marketing text next to a mascot or
  anywhere in the art: pages carry labels, state and data only. A mascot adds company, it is never the only
  carrier of a message.
- **Never in the way.** Art sits beside or behind content: it never covers text or controls, never
  takes focus, is never the only carrier of a state and stands still under `prefers-reduced-motion`.
- **Fixed colours.** No file follows the theme: none uses `currentColor`, a CSS variable or a
  `<style>` element. Each brand's art is drawn for a ground (named below); dark twins exist where the
  source has them. Do not recolour, crop or mirror the art.
- **Safe files.** Only SVG, each with `xmlns` and `viewBox`, without scripts, event handlers,
  `<foreignObject>`, `<image>`, external `href`/`url()` or `data:` URIs (`npm run assets:check`).
- **Same-origin files.** Serve them as files (`img-src 'self'`), not as `data:` URIs (README,
  "Mascot", CSP). The largest flower files are 60 to 135 kB (the banner is 70 kB): load them with
  `loading="lazy"`.

## code

Pixel art from the stuffcloud moodboards, also recorded in the stuffcloud design
system; the kern theme it belongs to is `code` (the folder was called `stuffcloud/` until #85, and
`@mozra-the-great/kern/assets/stuffcloud/*` still resolves here through an `exports` alias until 1.0). One square per pixel, `shape-rendering="crispEdges"`: show each file through
`<img>` at whole-number scales (`image-rendering: pixelated`) so it stays sharp.
The colours are fixed and do not follow the theme; the art is drawn for the dark panel of the Code theme, which is the
token `--k-bg-stage` (violet `#8b5cf6`; paint it on the box that holds the art, `docs/themes.md`, "Stage"). The art
is not outlined: most pieces have a silhouette colour below 3:1 against that violet (43 of the 51 mascots and
stickers), so on the stage give the art a light outline in your own CSS, as the design reference does (a 2px white
outline; white is 4.23:1 on the violet). `tests/tokens/stage-art.test.ts` records the list.

| Group | Files | Use |
| --- | --- | --- |
| `logo/` | 1 | The pixel logo. |
| `mascots/` | 9 | `axo.svg` (Stuffy, the pink axolotl and main mascot) plus the easter-egg cast: cat (Mochi), frog (Hop), bunny (Bun), jellyfish (Bloop), penguin (Waddle), fox (Ember), ghost (Boo) and cloud (Cumulo). Each has a typed name in `Mascot` / `<k-mascot>` (`stuffy`, `mochi`, `hop`, `bun`, `bloop`, `waddle`, `ember`, `boo`, `cumulo`) and aliases (`axo`, `axolotl`, `cat`, `frog`, `bunny`, `jelly`, `jellyfish`, `penguin`, `fox`, `ghost`, `cloudy`, `cloud`; README, "Mascot"). Mascots never speak, never block content and never take focus. One frame per animal; the idle bob is done by the runtime. |
| `tool-stickers/` | 42 | One sticker per tool (drawn with `Sticker`, sorted into categories, see "Tool stickers" below): Base64, burn after reading, colour, cron, diff, download, expiry, hash, image tools (background, convert, crop, EXIF, pixelate, resize), JSON, JWT, lorem ipsum, MAC address, Markdown, password, paste, PDF tools (compress, merge, protect, rotate, split), QR code, regex, report, shield, site, SQL, subnet, text operations, timestamp, trash, units, URL, user agent, UUID, XML, YAML. |
| `marks/` | 11 | Build, convert, dice, document, folder, globe, letter, lock, mountain (image), QR code, template. Always next to a text label. |
| `seasonal/` | 52 | Particles, header and footer strips, corner sprites and mascot accessories for the seasonal sets (winter to Christmas, Advent with one to four candles; summer: bubbles, flowers, flower row, petals, sun, sun hat, waves). One set at a time, behind content, still under reduced motion. |

115 files in all: the same set, name for name and byte for byte, as stuffcloud's
`docs/design/prototypes` (generated there from ASCII sources by `docs/design/tools/mascots.py`
and `stickers.py`) when they were copied. That folder is a frozen reference since #181; the art is kern's to maintain (stickers: #182, Stuffy and the easter-egg cast: #183, season sets: #184).

### Tool stickers

The 42 files of `tool-stickers/` are `sticker-<name>.svg` (7 to 12 art pixels wide, 4 to 12 high). `Sticker`
(`<k-sticker>`) draws one by `name` (the file name without `sticker-` and `.svg`: `qr`, `pdf-merge`), at a whole
number of CSS pixels per art pixel (`scale`, default 4), with `image-rendering: pixelated`, through `<img>` (so
`img-src 'self'` is enough). The art keeps its own bright colours in every theme and is drawn for a dark panel; a
sticker never moves and never takes focus. Without `label` it is decoration (`alt=""`, `aria-hidden`); give it a
`label` only where the sticker is the only thing that says what it stands for.

`STICKER_CATEGORY` maps every sticker to a tool category, `STICKERS_BY_CATEGORY` and `stickersOfCategory(category)`
list the stickers of one category in display order. The category names are plain words for the kind of tool, not
product names:

| Category | Stickers |
| --- | --- |
| `pdf` | `pdf-merge`, `pdf-split`, `pdf-rotate`, `pdf-compress`, `pdf-protect` |
| `images` | `img-resize`, `img-crop`, `img-convert`, `img-background`, `img-pixel`, `img-exif` |
| `convert` | `json`, `yaml`, `xml`, `base64`, `colour`, `units` |
| `time` (time and agents) | `cron`, `timestamp`, `useragent` |
| `network` | `subnet`, `mac` |
| `text` (text and generators) | `lorem`, `uuid`, `qr`, `diff`, `textops` |
| `dev` | `hash`, `password`, `regex`, `url`, `jwt`, `markdown`, `sql` |
| `hosting` (hosting and misc) | `paste`, `site`, `expiry`, `report`, `shield`, `trash`, `download`, `burn` |

The grouping is the one of the design reference's sticker table. A consumer's own tool list may use other
categories (an app can have fewer or different areas): `STICKER_CATEGORY` says where the art belongs, not how an
app groups its tools. `src/lib/components/stickers.ts` holds the data; `tests/unit/stickers.test.ts` keeps the
names, the files in `tool-stickers/` and the catalogue in step, in both directions.

## pop

Vector art from the Pop design system: chubby cartoon mascots with an even `#151714` outline, for
Pop's light (`#F3F4F1`) or near-black (`#0E100D`) ground. The outline of the standing mascots
disappears into the dark ground; the source intends that. Mascots, outfits and accessories share one
square 316-unit grid (`viewBox="-16 -6 316 316"`), so a dressed-up Stuffy swaps with the plain one
without a layout change.

| Group | Files | Use |
| --- | --- | --- |
| `logo/` | 1 | The green cloud mark (40 × 28). Set the word "stuffcloud" next to it; not on a green surface. |
| `mascots/` | 11 | Stuffy (axolotl, main mascot), Cumulo (cloud), Hop (frog), Boo (ghost), Mochi (cat), Bun (bunny), Bloop (jellyfish), Waddle (penguin), Ember (fox). `cumulo-dark.svg` and `boo-dark.svg` are the twins of the two floaters with a shadow for a dark ground: the plain file in light, the twin in dark. One mascot per view. |
| `outfits/` | 18 | Stuffy dressed up for each seasonal set (`stuffy-<set>.svg`: new-year, winter, valentine, carnival, womens-day, easter, earth-day, europe-day, pride, autumn, unity-day, harvest, halloween, advent, christmas, st-nicholas, human-rights-day) plus `stuffy-pdf.svg` (Stuffy holding a PDF stack). Use the active set's file wherever plain Stuffy would stand. |
| `accessories/` | 5 | What the other mascots wear in a set: Santa hat, witch hat, bunny ears, headband (for Bun, who has ears) and rainbow. Drawn where they sit on Stuffy, on the same grid; move and scale them onto another mascot's head. |
| `tool-icons/` | 31 | One icon per tool, named `<category>-<tool>` (pdf, images, convert, time, network, text, dev, hosting), 40 × 40, `#151714` ink at stroke 3, white fills, one accent. Made for a pastel tile, not for the dark ground. |
| `seasonal/` | 22 | `badge-<set>.svg`: one round badge per seasonal set (20 × 20, show it larger); `advent-wreath-1` to `-4`: the Advent wreath with one to four candles lit; `christmas-tree.svg`: the small tree of the Christmas footer. One set at a time. |

Sources: the claude.ai artifact **"Pop-Designsystem"** (logo, mascots, outfits, accessories, tool
icons; for the first four groups kern ships the drawings in their original serialisation from the
moodboard, which the design system holds re-serialised) and the moodboard **"stuffcloud Design
Explorations (ENTE Trys)"**, page "Pop (neu)", for the art the design system does not have
(`seasonal/`: badges and wreaths from "Pop 61 · Seasonal decorations", the tree from "Pop 65 · All
tools in Christmas"). One stroke of `badge-autumn.svg` lost a page class whose rule only applied to
the dark page; its own stroke colour is unchanged.

## line

Line art from the Line design system: `#18181A` ink, white paper fills and one accent each, with a
white rim round every figure so it reads on Line's dark ground and on colour.

| Group | Files | Use |
| --- | --- | --- |
| `logo/` | 2 | The cloud mark: `mark-ink.svg` on a light ground, `mark-white.svg` on a dark one. |
| `mascots/` | 9 | The gang (Stuffy, Cumulo, Hop, Boo, Mochi, Bun, Bloop, Waddle, Ember), each on a floor line (the floaters over two short dashes). One figure per view. |
| `outfits/` | 17 | Stuffy dressed up for each seasonal set, the same names as in pop (`stuffy-<set>.svg`), all in one frame (`viewBox="0 -14 468 418"`). |
| `tool-icons/` | 8 | One tile per tool category (pdf, images, convert, network, text, dev-extras, hosting, account): a rounded colour square with a line glyph, 64 × 64. Beside a visible name it is decoration. |
| `seasonal/` | 6 | `advent-wreath-1` to `-4` (one to four candles lit) and the header garlands `garland-christmas.svg` and `garland-halloween.svg` (1200 × 88, along the top edge of a page). One set at a time. |
| `illustrations/` | 6 | Spot illustrations: `stuffy-folder` (Stuffy next to a folder), `host-site` (a small site in a browser window with Cumulo), `site-live` (a published site), `burn-letter` (Ember with a sealed letter), `build-page` (Bun and a page of blocks), `gang-row` (Hop, Stuffy and Mochi in a row). |

Sources: the claude.ai artifact **"Line-Designsystem"** (logo, mascots, outfits, tool icons; byte for
byte its uploaded files, which keep their `width`, `height`, `role="img"` and `aria-label`; an `<img>`
ignores the last two, so set `alt` yourself) and the **stuffcloud Line design canvas** for the art the
design system does not have (`seasonal/` from "line-seasons" and the Christmas and Halloween tool
pages, `illustrations/` from "line-home" and "line-live"). The `class` attributes left in the files
(`hl` for the rim, `pt-*` for particles) only drive the canvas' animations; in a file they do nothing
and the art shows its still pose.

## flower

Botanical motifs from the Flower designs, drawn after the "Mozra-the-great" banner: soft flat
shapes in fixed colours, made for Flower's cream ground (`#F6F0E0`). The blossoms, leaves and trees
are transparent; the banner brings its own cream ground.

| Group | Files | Use |
| --- | --- | --- |
| `blossoms/` | 16 | Single blossoms (pink, red, purple, ochre, white), blossoms on a stem, buds, lavender, a pink panicle and `bouquet.svg` (a main motif on its own). The white ones need their foliage or a darker ground for contrast. |
| `leaves/` | 20 | Ten single leaves (olive, green, dark) and ten branches, tendrils and plants. Dark leaves not on a dark green ground. |
| `trees/` | 10 | Trees and bushes on an oval ground shadow (`viewBox="0 0 300 360"`): round dark tree, olive tree, conifer, blossom tree, cypress, fruit tree, young tree, bush with white blossoms, shrub with buds, and `hill-with-trees.svg`, a finished small scene (not mixed with single trees). |
| `banners/` | 1 | `garden-frame.svg`: the Flower banner as a picture without any text (`viewBox="0 0 1536 650"`, the 1536:650 ratio of the original). Plants grow in from all four edges (pink blossom, lavender and white blossoms on the left, a red blossom and a large split leaf on the right, hanging twigs at the top), three flat hills lie along the lower edge, and the middle stays empty. It is opaque: its own cream ground (`#F6F0E0`) makes it a light panel on Flower's dark `wald` ground too. Show it whole, as a page or section header (`<img alt="" width="1536" height="650" loading="lazy">`, `width: 100%; height: auto`; 70 kB); round the corners in CSS if you like. A heading may stand in the empty middle (about the central 40 % of the width and half of the height) as real text in your page, in ink `#2C4F38`; nothing else goes on top. |

Sources: the claude.ai artifact **"Flower-Designs"** (design system); its 46 SVGs are byte-identical
to the motifs on the canvas **"Mozra Botanik-Bausteine"**. The file names translate the German
originals (`rosa-bluete.svg` → `blossoms/pink-blossom.svg`, `olivbaum.svg` → `trees/olive-tree.svg`, …).
`banners/garden-frame.svg` is the one file drawn for kern (#110): the design system's `banner.png` is a
500 kB raster picture with a title and account names in it, so the banner was redrawn as vector art
with the same composition and the palette of the design system's tokens, and without text. It is built
like the other motifs: filled shapes only (`<path fill d>`), no outlines, no gradients, a few tones per
colour family with the light from the upper left.

## Drift check and refresh

Each brand folder has a `manifest.json` that lists every file with its size and sha256, plus the
pixel grid (code) or the `viewBox` (pop, line, flower). It is the contract with the art's
source: CI cannot reach the stuffcloud repository or the claude.ai artifacts, so the `build` job runs
`npm run assets:check`. It fails on a missing, extra or changed file, on an SVG without `xmlns` or
`viewBox`, on an unsafe construct (list above) and on a brand folder it does not know, and it checks
that `src/lib/components/code-art.ts` (the grid catalogue behind `Mascot`) matches the
code SVGs and that every file in `code/mascots/` has exactly one name in `MASCOT_SOURCES`
(`src/lib/components/mascots.ts`) and every name a file.

When the art changes (kern owns it since #181; copy from the stuffcloud reference only for art that kern does not have yet):

1. Copy the new or changed SVGs from stuffcloud's `docs/design/prototypes/` into the matching group
   (`axo`/`mascot-*` → `mascots/`, `sticker-*` → `tool-stickers/`, `deco-*` → `seasonal/`,
   `logo` → `logo/`, other marks → `marks/`). Check each new file first: only `<svg>` and `<path>`,
   no `<script>`, `on*=` handlers, `href`/`url()` or `<foreignObject>`.
2. `npm run assets:manifest` rewrites the manifests and the catalogue.
3. `node scripts/ci/assets-drift.mjs --against <stuffcloud>/docs/design/prototypes` compares names
   and bytes with that checkout and must report the same set. stuffcloud's CI can run the same
   command against a kern checkout to catch drift from its side.
4. Commit the files, the manifest and the catalogue together.

When pop, line or flower art changes in its artifact: take the changed file from the artifact's
assets, or extract the inline `<svg>` from the canvas page (add `xmlns`, keep the `viewBox`, drop only
presentation attributes of the root such as `class`, `width` or `aria-hidden`), keep the kern file
name, run `npm run assets:manifest` and commit file and manifest together. New art comes from the
sources only; kern does not draw its own (the one exception is the text-free flower banner, see above).

## Licence and attribution

Same as the project: GPL-3.0-or-later, see `NOTICE` (copyright holder: the author named there).

- **code (pixel art, including the 42 tool stickers):** original artwork of the same author, generated from ASCII
  sources by the author's own scripts (`mascots.py`, `stickers.py`) and not derived from third-party material. The
  source repository records it as original work under GPL-3.0-or-later like its code and lists no attribution
  duty for it (its register of third-party assets holds only fonts, models and WASM builds, none of them
  shipped here). Nothing in `assets/code/` needs an attribution notice; keep this licence note when you
  redistribute the files.
- **pop, line, flower:** art from the design-system artifacts named in their sections; same licence as the project.

Where a file carries third-party material, it gets its own entry here and its licence in `NOTICE` in the PR that
adds it.
