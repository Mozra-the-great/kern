# Test fonts

The three families of the Code theme, for the visual regression test (`tests/elements/visual.spec.ts`)
only: with the real fonts the screenshots show the design, not a system fallback. They are not part of
the package (kern ships no fonts; consumers load them themselves).

Copied unmodified from stuffcloud's `web/apps/web/src/assets/fonts/` (Fontsource 5.3.0 builds of the
Google Fonts, Latin subset), SIL Open Font License 1.1 (texts next to the files):

| File | sha256 |
| --- | --- |
| `inter-latin-wght-normal.woff2` | `3100e775e8616cd2611beecfa23a4263d7037586789b43f035236a2e6fbd4c62` |
| `jetbrains-mono-latin-wght-normal.woff2` | `18be452724bfdc236c074ca94a249a7f41a86752c7d04ab258ce9ed5651f6a7e` |
| `silkscreen-latin-400-normal.woff2` | `e6c72ea4702249202bcdd79d3343057e4e25ef1f04e3fcffd8602ab53b40b4cc` |
| `silkscreen-latin-700-normal.woff2` | `5741b7f01a127f40ed70281fa2f686e8fc2cfe241930a120e4d1a1cebe78f995` |
