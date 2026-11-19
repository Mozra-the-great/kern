# Brand assets

Optional artwork per brand, shipped with the package as plain files
(`@mozra-the-great/kern/assets/<brand>/<group>/<file>.svg`). The components never load them;
use them in your own pages, for example as an `EmptyState` icon or seasonal decoration, or
draw them with the `Mascot` component (`<k-mascot>`), which takes any file below by name
(`stuffy`, `tool-stickers/sticker-qr`) and the URL you serve it from (README, "Mascot").

## stuffcloud

Pixel art from the stuffcloud moodboards, also recorded in the Stuffcloud design
system. One square per pixel, `shape-rendering="crispEdges"`: show each file through
`<img>` at whole-number scales (`image-rendering: pixelated`) so it stays sharp.
The colours are fixed and do not follow the theme.

| Group | Files | Use |
| --- | --- | --- |
| `logo/` | 1 | The pixel logo. |
| `mascots/` | 9 | `axo.svg` (the pink axolotl, main mascot) plus cat, frog, bunny, jellyfish, penguin, fox, ghost and cloud for easter eggs. Mascots never block content or take focus. |
| `tool-stickers/` | 42 | One sticker per stuffcloud tool: Base64, burn after reading, colour, cron, diff, download, expiry, hash, image tools (background, convert, crop, EXIF, pixelate, resize), JSON, JWT, lorem ipsum, MAC address, Markdown, password, paste, PDF tools (compress, merge, protect, rotate, split), QR code, regex, report, shield, site, SQL, subnet, text operations, timestamp, trash, units, URL, user agent, UUID, XML, YAML. |
| `marks/` | 11 | Build, convert, dice, document, folder, globe, letter, lock, mountain (image), QR code, template. Always next to a text label. |
| `seasonal/` | 52 | Particles, header and footer strips, corner sprites and mascot accessories for the seasonal sets (winter to Christmas, Advent with one to four candles; summer: bubbles, flowers, flower row, petals, sun, sun hat, waves). One set at a time, behind content, still under reduced motion. |

115 files in all: the same set, name for name and byte for byte, as stuffcloud's
`docs/design/prototypes` (generated there from ASCII sources by `docs/design/tools/mascots.py`
and `stickers.py`).

Decorative use: give the `<img>` an empty `alt=""`. When a picture carries meaning
(a mascot that says "done"), describe it in `alt` or in the surrounding text.

## Drift check and refresh

`manifest.json` lists every file with its size, sha256 and pixel grid. It is the contract with
stuffcloud: CI cannot reach the stuffcloud repository, so the `build` job runs
`npm run assets:check`, which fails on a missing, extra or changed file, and checks that
`src/lib/components/stuffcloud-art.ts` (the grid catalogue behind `Mascot`) matches the SVGs.

When stuffcloud's art changes:

1. Copy the new or changed SVGs from stuffcloud's `docs/design/prototypes/` into the matching group
   (`axo`/`mascot-*` → `mascots/`, `sticker-*` → `tool-stickers/`, `deco-*` → `seasonal/`,
   `logo` → `logo/`, other marks → `marks/`). Check each new file first: only `<svg>` and `<path>`,
   no `<script>`, `on*=` handlers, `href`/`url()` or `<foreignObject>`.
2. `npm run assets:manifest` rewrites `manifest.json` and the catalogue.
3. `node scripts/ci/assets-drift.mjs --against <stuffcloud>/docs/design/prototypes` compares names
   and bytes with that checkout and must report the same set. stuffcloud's CI can run the same
   command against a kern checkout to catch drift from its side.
4. Commit the files, the manifest and the catalogue together.

Licence: same as the project (GPL-3.0-or-later), see `NOTICE`.
