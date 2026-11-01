# Exploded teardown

A large speaker opens into five real 3D layers. Each release gets one oversized numbered callout and an orange rim pulse.

**Key moment:** all five layers lock beside their annotations. Five orange rims, expanding corner marks, a headline flash and a product punch mark the complete teardown. The shell keeps an orange rim while the product and studio lights continue moving.

## Suits

- Speaker launches and tech reviews
- “What's inside” explainers
- A talking-head insert explaining five physical parts

## Doesn't suit

- Changing the model into another product using words alone
- More or fewer than five layers
- Long names, paragraphs or engineering drawings

## What to change

Run `animate vars exploded-teardown` for the full list.

| Variables | What they are |
|---|---|
| `titleLine1`, `titleLine2` | Product heading and closing headline |
| `layer1Number`, `layer1Name`, `layer1Spec`, and so on | Five callouts, ordered from top to bottom |
| `productDiameter`, `productHeight`, `dimensionUnit` | Model dimensions and closing dimensional line |
| `grilleThickness`, `driverDiameter` | Grille and driver geometry |
| `accent`, `ink`, `muted`, `leader`, `bgCenter`, `bgEdge` | Type, annotations and graphite background |
| Material colour variables | Aluminum, rubber, paper, copper, batteries and circuit board |
| `firstLiftFrame`, `liftIntervalFrames`, `leaderDelayFrames` | Release rhythm and callout delay |
| Spring variables | Attack, overshoot and settle |
| `layerGapMm`, `compactGapMm` | Minimum physical separation |
| `projectionClearanceMm` | Visible space between neighboring layer silhouettes |
| `fullElevation`, `compactElevation` | Final viewing angles |
| `cameraPullFrames`, `cameraOrbit` | Closing composition move and build camera turn |
| `holdOrbit`, `impactScale` | Held product turn and closing punch |
| Title frame variables | Heading, progress rule, headline and dimensions |
| `shutterAngle`, `temporalSamples` | Geometry motion blur |
| `overlayPosition` | `top` or `bottom` |

- Use short names and two-digit part numbers.
- Keep specifications brief. A slash can separate two short phrases; long final specifications split there instead of shrinking below the minimum type size.
- Keep dimensional claims in the callout strings consistent with geometry changes.
- Geometry dimensions use millimetres. `dimensionUnit` changes the displayed suffix.
- Layer spacing grows when needed to keep neighboring silhouettes visibly separate at the chosen viewing angle.
- `productName` describes the model for accessibility.
- `brand` records the fictional brand; edit `titleLine1` to change its visible heading.
- Neruq is fictional. The default specifications are illustrative.
- Never fade parts or labels on. Parts spring, lines draw and complete text pops into place.
- Never lift every layer together or break the even release spacing.
- Never cross leaders or place labels over the product.
- Never replace the model with flat cut-outs, add type glows or introduce a busy background.
- Never show a part's large build callout and its final column callout at the same time.

## Timing

| | |
|---|---|
| Default opaque shot | 5.3 seconds |
| Key moment | 4.4 seconds |
| Minimum build-up | 2.6 seconds |
| Hold after key moment | 0.9 seconds |
| Transparent exit | 0.34 seconds |

At the default timing, releases begin at frames 10, 30, 50, 70 and 90. Each release carries the already released parts above it. Its callout arrives four frames later with an orange rim pulse and a step in the progress rule.

The heading is visible from the opening frame. The model stays centered through the releases. Each large build callout replaces the previous one in the footer.

The closing move starts one second before the key moment. The five final annotations arrive during the last 0.24 design seconds. All text is settled by the key moment.

The closing headline starts at frame 126. The headline and dimensions finish at frame 132. On that frame, all five rims flash orange, corner marks stamp the model, the headline flashes and the rule reaches full width.

The thicker rule and orange shell rim remain. The product turns and its lighting travels through the hold; reading text stays fixed.

## Outputs

`full` respects the 230px top and 300px bottom safety margins. The large heading anchors the top, the speaker fills the center and the active callout occupies the footer. At the payoff, the footer becomes a large closing headline with dimensions beneath it.

`top` uses a lower final viewing angle and visible gaps between all five layers. Its closing headline and dimensions share a shallow footer, giving more height to the completed model. Below 780px stage height, final annotations show names only; specifications still appear in their large build callouts.

`overlay` has its own sizes in a 1000px graphite card. It also uses a shallow closing footer. A vertical aperture opens the card and closes completely before the transparent exit ends. Text appears whole after the entrance opens and clears before the exit closes.

Full-output type stays at least 40px. Compact type stays at least 32px. Part numbers keep their measured width throughout each entrance; the orange rims and dots provide the pulse.