# Pencil to blueprint

A large pencil lamp fills the sheet from the opening frame. Dark graphite traces its structure, then blue ink spreads from the elbow. The same strokes turn white and spring straight as the wet edge passes.

**Key moment:** both measurements reach their exact values together. White specification plates stamp behind the numbers, arrowheads and heavy endpoint ticks lock, and a brief ink flash sends a reaction around the elbow. The plates remain as the final emphasis.

## Suits

- Idea-to-product stories
- Design and engineering explanations
- Turning a rough plan into something ready to build

## Doesn't suit

- Replacing the lamp with a different object through text alone
- More than two numeric dimensions
- Long titles or detailed specification sheets

## What to change

Run `animate vars pencil-blueprint` for the full list.

| Variables | What they are |
|---|---|
| `label` | Drawing title; three to five short words work best |
| `heightValue`, `widthValue` | Overall height and base width |
| `heightStart`, `widthStart` | Starting numbers for the two counts |
| `unit`, `measurementDecimals` | Shared measurement format |
| `objectDescription` | Accessible description; does not replace the lamp |
| `paper`, `grid`, `graphite` | Paper and pencil colours |
| `blueprint`, `tideLine`, `ink` | Blue sheet, wet edge and technical ink |
| `gridOpacity`, `grainOpacity` | Texture strength |
| `sketchRoughness`, `seed` | Pencil character and repeatable texture |
| `overlayPosition` | `top` or `bottom` for the overlay output |

The defaults are sample specifications: a 560 mm overall height and a 360 mm base width. Both counts begin at 0 mm.

Changing the measurements changes the base-to-overall-height proportion. Stay reasonably close to the sample proportions for a clear lamp silhouette.

Keep the original look:

- Never cut or crossfade between the sketch and blueprint.
- Never add glow to the white lines or a gradient to the blue.
- Never swap objects during the flood or add more than three dimensions.
- Never use handwriting for the title.
- Never show a pencil or hand.

## Timing

| | |
|---|---|
| Build-up before the key moment | 3.2s by default; 1.8s minimum |
| Hold | 1.5s by default |
| Transparent exit | Diagonal wipe in 0.3s |

A complete light silhouette is visible immediately. Darker pencil strokes trace the base, arms, joints and shade in quick overlapping gestures.

Blue ink spreads just after the pencil drawing completes. Its uneven edge changes local graphite into precise white ink. The complete title stamps into the upper-left corner after the flood.

Centre marks and extension lines assemble next. Both measurements then make four quick whole-number jumps. Every change punches the readouts and advances the bright dimension lines on the same frame.

The final jump lands exactly at the key moment. The numbers punch larger, their white specification plates stamp into place, and the endpoint arrowheads lock. The drawing flashes and a reaction expands around the elbow.

The impact settles quickly. Words and measurements then stay fixed while inspection arcs rotate, centre-line dashes travel, and a heavier trace moves along the lamp's arms.

## Outputs

`full` uses the tall lamp pose through the portrait safe area, with a larger corner title and larger measurements.

`top` opens the lamp's arms sideways to fill the wider frame. The shade keeps its shape, and the title occupies the space above the elbow. Shorter stages use a flatter arm pose and their own type sizes.

`overlay` uses the wider pose inside a 960px-high card. The title arrives whole. A diagonal wipe opens the paper and fully closes the blueprint at the end.

Type stays at least 40px in `full` and 32px in compact outputs. Use a card at least 640px high and keep titles short.