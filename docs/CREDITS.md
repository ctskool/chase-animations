# Credits

| What | Licence | Where |
|---|---|---|
| Anton, Barlow Condensed, Inter, Inter Tight, JetBrains Mono | SIL Open Font License 1.1 | `shared/fonts/`, licence texts in `shared/fonts/licenses/` |
| Barlow Semi Condensed, Bodoni Moda, Bricolage Grotesque, Cormorant Garamond, Cormorant SC, IBM Plex Mono, IBM Plex Sans, Instrument Serif, Libre Caslon Text, Manrope, Newsreader, Outfit, Plus Jakarta Sans, Public Sans, Schibsted Grotesk, Share Tech Mono | SIL Open Font License 1.1 | `blocks/<name>/assets/fonts/`, each with its licence text |
| Permanent Marker, Syncopate | Apache 2.0 | `blocks/evidence-desk/assets/fonts/`, `blocks/retro-crt/assets/fonts/`, `effects/freeze-mark/assets/fonts/`, each with its licence text |
| World land outlines from [world-atlas](https://github.com/topojson/world-atlas) 2.0.2 | ISC, based on public-domain Natural Earth data | `blocks/globe-arcs/assets/data/land-110m.json`, `blocks/campaign-map/assets/data/land-110m.json` |
| Real maps for `route-map` and `campaign-map`, from [OpenFreeMap](https://openfreemap.org), [OpenMapTiles](https://openmaptiles.org) and [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors | ODbL for the data, with credit required. The credit is drawn on every real-map render | Downloaded by `animate route` and `animate campaign`, never bundled |
| Place search from [Nominatim](https://nominatim.org), routes from [OSRM](https://project-osrm.org) and [routing.openstreetmap.de](https://routing.openstreetmap.de) | Free shared services, for light use | Called by `animate route` and `animate campaign` |
| HyperFrames | Apache 2.0 | Installed by `npm install` |
| motion-blur component from the HyperFrames registry | Apache 2.0 | `shared/vendor/motion-blur.js` |
| GSAP | [GSAP standard licence](https://gsap.com/standard-license) | Installed by `npm install` |
| Three.js | MIT | Installed by `npm install` |
| @mapbox/vector-tile, pbf | BSD 3-Clause | Installed by `npm install` |
| Parakeet TDT speech model | Downloaded by HyperFrames when you run `npm run setup -- --speech` | Stored in your HyperFrames cache |
| [Robust Video Matting](https://github.com/PeterL1n/RobustVideoMatting) (Peter Lin), the `/vfx` cut-out on NVIDIA cards | GPL-3.0 | Downloaded from its own GitHub by `npm run setup -- --vfx`, never bundled. `shared/vfx-matte/rvm.py` only runs it |
| u2net human segmentation, HyperFrames' remover, the `/vfx` cut-out everywhere else | Apache 2.0 | Downloaded by HyperFrames on first use, stored in your HyperFrames cache |
| `/vfx` reference footage in `examples/vfx/` | Chase's own, shared for trying the pack | `examples/vfx/` |

## Claude brand

Claude, Claude Code, the Claude logo and the Claude Code mascot are Anthropic's. The pack isn't affiliated with or endorsed by Anthropic. The logo outline comes from [Simple Icons](https://simpleicons.org) (CC0), which covers the drawing, not the trademark. The mascot, colours and spinner words match Claude Code's own interface.
