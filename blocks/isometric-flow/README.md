# Isometric flow

A miniature three-step process on a white slab. The headline, first building and first label are visible immediately. Parcels hop into a van, which stops at each remaining building and triggers its label on arrival.

Delivery gets the biggest beat: the van brakes, the building lifts, its enlarged pill checks off, and a green pulse runs back along the road. A green base, door and arrival bay remain after the impact.

**Key moment:** the van reaches the last step and triggers the delivery punch.

## Suits

- “How it works” explainers
- Business models, supply chains and content pipelines
- Three steps with something moving between them

## Doesn't suit

- Fewer or more than three steps
- Processes with no clear handoff
- Precise technical diagrams

## What to change

Run `animate vars isometric-flow` for the full list.

| Variables | What they are |
|---|---|
| `title` | One line above the miniature. Keep it short |
| `step1Name`, `step2Name`, `step3Name` | One short word per stop |
| `step1Time`, `step2Time`, `step3Time` | A short time or supporting detail |
| `step1Number`, `step2Number`, `step3Number` | The numbers inside the chips |
| `parcelCount` | One to five parcels, each with its own loading beat |
| `color1`, `color2`, `color3` | The three building colours. Trees and parcels follow `color1` |
| `chip`, `check` | Number chips and the completed destination |
| `white`, `muted` | Roofs, labels, road dashes and supporting text |
| `slab`, `road`, `ink`, `bgTop`, `bgBottom` | The remaining main colours |
| `overlayPosition` | `top` or `bottom` for the overlay output |

The buildings remain a warehouse, an office block and a shop. The traveller remains a van.

The sample shipping times are illustrative copy. Replace them with your own.

## Timing

| | |
|---|---|
| Build-up before the key moment | 3.2s by default; 1.8s minimum |
| After the key moment | 0.85s for the impact, return pulse and settle |
| Transparent exit | A centre wipe lasting 0.36s |

The first stop is reached on frame one. The second pill appears when the van brakes at the middle building. Delivery lands exactly at the key moment.

The camera settles before delivery. Labels stay anchored through the payoff, while the road pulse, van suspension and small tree movements keep the ending alive.

## Outputs

`full` opens close on the first stop, then reveals the whole slab while keeping the bottom fifth clear.

`top` has its own camera framing, spacing and pill dimensions. Shorter stages adjust the miniature while keeping the labels readable.

`overlay` floats over your footage with a white headline pill and its own framing. The opening wipe already exposes the headline and first stop.

All three use an orthographic camera, solid object colours and physical rises and punches. Buildings and labels never fade on.