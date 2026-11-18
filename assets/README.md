# Brand assets

Optional artwork per brand, shipped with the package as plain files
(`kern-ui/assets/<brand>/<group>/<file>.svg`). The components never load them;
use them in your own pages, for example as an `EmptyState` icon or seasonal decoration.

## stuffcloud

Pixel art from the stuffcloud moodboards, also recorded in the Stuffcloud design
system. One square per pixel, `shape-rendering="crispEdges"`: show each file through
`<img>` at whole-number scales (`image-rendering: pixelated`) so it stays sharp.
The colours are fixed and do not follow the theme.

| Group | Files | Use |
| --- | --- | --- |
| `logo/` | 1 | The pixel logo. |
| `mascots/` | 9 | `axo.svg` (the pink axolotl, main mascot) plus cat, frog, bunny, jellyfish, penguin, fox, ghost and cloud for easter eggs. Mascots never block content or take focus. |
| `tool-stickers/` | 11 | Base64, hash, JSON, JWT, lorem ipsum, Markdown, regex, text operations, UUID, XML, YAML. |
| `marks/` | 11 | Build, convert, dice, document, folder, globe, letter, lock, mountain (image), QR code, template. Always next to a text label. |
| `seasonal/` | 45 | Particles, header and footer strips, corner sprites and mascot accessories for the seasonal sets (winter to Christmas, Advent with one to four candles). One set at a time, behind content, still under reduced motion. |

Decorative use: give the `<img>` an empty `alt=""`. When a picture carries meaning
(a mascot that says "done"), describe it in `alt` or in the surrounding text.

Licence: same as the project (GPL-3.0-or-later), see `NOTICE`.
