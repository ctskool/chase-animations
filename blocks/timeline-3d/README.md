# Timeline 3D

One huge illustrated milestone sits above a blue perspective rail. Each new card opens over the previous card, which stays standing through the handoff. The last milestone turns blue and lands with one decisive scale accent.

**Key moment:** the blue sweep finishes, the playhead stops just beyond the final milestone, and the complete final card reaches its largest scale. It settles to a slightly larger footprint. The NOW badge snaps on a beat later.

## Suits

- Personal journeys and studio stories
- Company milestones
- History explainers with three or four clear moments

## Doesn't suit

- Dense biographies or long paragraphs
- Charts that need mathematically proportional time spacing
- Stories with several competing outcomes

## What to change

Run `animate vars timeline-3d` for the full list.

| Variables | What they are |
|---|---|
| `headline`, `highlight` | Complete headline and the exact phrase to colour blue |
| `name`, `startYear`, `nowYear` | Story identity and year range |
| `kicker` | Complete kicker; leave empty to use the name and year range |
| `milestone1Year` to `milestone4Year` | Years, in increasing order |
| `milestone1Title` to `milestone4Title` | Short milestone titles |
| `milestone1Detail` to `milestone4Detail` | One short sentence per milestone |
| `nowPill` | Short badge on the final card |
| `accent` | The single accent colour |
| `ink`, `muted`, `future`, `card` | Text, unfinished rail and card colours |
| `floorTop`, `floorBottom`, `grid` | Off-white backing and inset floor strip |
| `overlayPosition` | `top` or `bottom` |

- Leave an earlier milestone’s title empty to remove that milestone.
- Milestone 4 is always the NOW card.
- Match the start and now years to the first and final milestone.
- Keep titles and details close to the sample lengths.
- One milestone leads; the outgoing card remains behind it during transitions.
- The final card settles slightly larger than the earlier cards.
- Rail spacing shows sequence rather than elapsed time.
- Small floor marks indicate intervening years.
- Illustrations are drawn shapes, with no external photos.
- Mara Vale and this story are fictional sample content.

## Timing

| | |
|---|---|
| Build-up before the key moment | 4.0s by default; 1.9s minimum |
| Hold after the key moment | 1.0s |
| Transparent exit | Diagonal slice closes in 0.34s |

The opening card is already standing while its pencil traces the room plan. The playhead advances immediately, accelerating between stops and slowing around each milestone.

The current card stays upright as the playhead approaches the next stop. Crossing that stop turns its dot blue, pops the base and brings in the next card on its own stem.

The new face begins at a readable 32-degree tilt. Its hinge opens in 0.16 design seconds, with a small overshoot, while the card moves into place over the outgoing milestone. Both cards and their stems remain present for a 0.34-design-second handoff. The outgoing card is hidden only after the incoming card has settled over it. These timings compress with the build-up.

Each illustration has its own action. The pencil follows the sketch strokes. The reading chair pops into the room while the lamp swings into place. The studio’s blue worktop extends, its plan unrolls and its chair slides up. The final sofa draws on and the plant leaves unfold.

The final milestone arrives shortly before the key moment. Its card opens over the studio card, then blue sweeps across from the endpoint side. The final tenth of a design second drives one whole-card scale attack. At the key moment the surface is fully blue, the illustration is complete, and the card reaches its scale peak. The year scales with the card.

The card settles over the next 0.24 real seconds, retaining a small size emphasis. The badge snaps on 0.07 seconds after the key moment. The playhead keeps a fixed soft ring; there are no expanding endpoint rings or repeated pulses.

The floor camera finishes settling 0.28 seconds after the key moment and stays fixed. A lower-edge highlight and slight leaf movement continue through the hold while readable text stays put.

The default opaque composition is five seconds. Transparent outputs append the exit.

## Outputs

`full` uses the full safe width for a large year, a wide interior illustration and a clear title and detail. A raised perspective rail sits directly below the card. The header gap reserves room for the final scale accent.

`top` gives the year and illustration a shared upper band, with the title and detail below. Its rail, arrival distance and spacing use compact dimensions.

`overlay` uses its own 1000px-high layout on a bounded off-white panel, with transparent surroundings and diagonal entry and exit wipes.

All three outputs use the same overlapping card handoffs, short readable hinges, animated illustration strokes and single final scale accent. Compact illustrations retain the pencil, chair, worktop, plan and plant actions.

In compact outputs, the NOW badge occupies a reserved corner beside the detail. It stays clear of the year and illustration.

Text is measured before animation. Artwork yields space first in shorter stages. Titles and details keep their last two words together when wrapping. Settled readable text stays at least 40px in full and 32px in compact outputs.