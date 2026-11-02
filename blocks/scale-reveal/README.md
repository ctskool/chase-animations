# Scale reveal

Make a number physical. A person stands beside a small stack of bills, and the stack starts to rise. The camera pulls back faster and faster through real things at their true heights: a person, a house, a tree, a city tower, the world's tallest building. Each one gets a beat, then shrinks away. The stack keeps going past the last of them.

**Key moment:** the stack stops dead above the last comparison. A ring of light that climbed the stack bursts outward from the top, the stack flashes gold, loose sheets blow off the top, the frame kicks and the true height punches in huge. Heights on the ruler flash on the same frame.

The default is true: $1 billion in $100 bills is 10 million bills. At 0.109 mm each, that's a stack 1.09 km tall.

## Suits

- Money, debt, budgets and valuations
- Anything counted in huge numbers: users, tokens, tonnes, sheets of paper
- "How tall would it be if you stacked it?" facts
- Heights and distances that are hard to picture, from 20 m to 400 km

## Doesn't suit

- Comparing two numbers side by side
- Small numbers: under about 20 m there's nothing to pull back from
- Anything that doesn't stack, unless the stack is the joke
- Numbers you haven't checked. The block draws whatever height it's given as if it were true

## What to change

Run `animate vars scale-reveal` for the full list.

| Variables | What they are |
|---|---|
| `heroLabel` | What the stack is, such as `$1 billion in $100 bills`. Shown from the first frame |
| `heroValue` | The exact text at the key moment, such as `1.09 km` or `3,576 ft` |
| `heightMetres` | The true height, always in metres. This builds the scene |
| `caption` | Optional line under the height. Leave empty for none |
| `units` | `metric` or `imperial`, for the running counter and every comparison |
| `stackMark` | Short mark printed on the paper bands, such as `$100`. Leave empty for plain bands |
| `stack`, `stackPaper` | The stack, and its paper bands and sheet edges |
| `skyTop`, `skyHorizon`, `space` | Upper sky, warm horizon, and space at the very top of the range |
| `ground`, `groundAlt`, `building`, `person` | Land, fields, buildings and the person's top |
| `text`, `accent`, `ink` | Big text, the key-moment colour, dark text and shadows |
| `overlayPosition` | `top` or `bottom` for the overlay output |

- Work out `heightMetres` properly, then write `heroValue` to match. The block doesn't check one against the other.
- The block picks its own comparisons from the list below. It takes things shorter than the stack, always includes the tallest of them, and spaces the rest evenly so each fills the frame in its turn. Two to six comparisons appear.
- Keep `stackMark` to about six characters so it fits the band.
- Keep `heroLabel` under about 40 characters. Longer labels shrink, then take a second line.
- `heroValue` shrinks to fit the width. Short values land biggest.

## The comparisons

| Comparison | Height |
|---|---|
| A person | 1.8 m |
| A city bus | 3 m |
| A house | 9 m |
| A tall tree | 30 m |
| A city tower | 150 m |
| World's tallest building | 828 m |
| Highest peak in the Alps | 4,806 m |
| World's highest mountain | 8,849 m |
| Jet cruising height | 10,700 m |
| Weather balloon | 30 km |
| Edge of space | 100 km |
| Space station | 400 km |

## What's to scale

Heights are true. The stack, the buildings and the mountains all stand in one plane, facing the camera, in real metres, so their heights on screen compare directly. The camera never tilts, so verticals stay straight.

A few things are drawn for the picture, not to scale:

- **The stack's width.** A real stack of bills is 16 cm wide, which vanishes at this range. The block holds it at a readable width on screen.
- **The sideways spacing.** Comparisons are spaced so each is visible in its turn. Only their heights are data.
- **Mountains** are drawn steeper than real ones, so the peak fits the frame.
- **The jet, balloon and space station** would be too small to see. Their height is true, their size isn't.
- **The curve of the horizon** is stronger than real at low altitude.
- **Earth from high up** is a generic planet, not a real map. Its land and clouds are invented.
- **The town and city** are generic and fictional. The world's tallest building is a generic tower of the right height, not a model of a real one.

## Timing

| | |
|---|---|
| Build-up before the key moment | 4.4s by default; 2.8s minimum |
| Hold | 1.5s by default |
| Transparent exit | Closes onto the top of the stack in 0.36s |

The camera pull-back is exponential. Comparison beats get closer together as it goes, so it feels like it's accelerating away from you. The stack's top reaches each comparison's height on that comparison's beat.

The camera eases off in the last half second while the stack keeps climbing, so you see the top rise past the last comparison. The ring of light climbs the stack over those same frames and reaches the top exactly on the key.

The stack keeps its paper bands and bundle lines as it rises, then thins to bundle lines alone at long range. Loose sheets blow sideways and down, away from the text. On `top` and `overlay` some shake off the side of the stack below the caption.

During the hold, sheets drift down, clouds keep moving, a glint climbs the stack, the number breathes and stars twinkle at high altitude.

## Outputs

`full` puts the stack on the left third with comparisons to its right. The label, height and caption sit above it, so the top of the stack lands directly under the number.

`top` and `overlay` have their own composition: the stack stands at the left almost the full height of the frame, with the label and height beside it. The scene shrinks if needed so the last comparison stays clear of the number. Below about 700px high the number gets noticeably smaller, so use the default 960 where you can.

`overlay` is a 1000px card that opens from the foot of the stack and closes onto its top.
