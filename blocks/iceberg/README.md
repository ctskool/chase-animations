# Iceberg

A small bright tip sits on a calm dawn sea, then the camera sinks through the waterline into a colossal faceted mass. Four strata get a label each on the way down, each one heavier than the last.

**Key moment:** the camera slams to a stop with the whole berg in frame as a cutaway, tiny tip at the top. On that frame the base ignites from within, the water jumps bright, a shockwave leaves the base and the hero line stamps in huge. A pulse then climbs the whole mass and flashes the tip.

## Suits

- "What you see vs what's really underneath", for any topic
- The work, cost or history behind something that looks easy
- Business stories, personal stories, hidden complexity, root causes

## Doesn't suit

- More or fewer than four layers
- Long sentences. Labels are short phrases and the hero is two to four words
- Comparisons with real numbers. The strata are equal in height, so they don't show proportions

## What to change

Run `animate vars iceberg` for the full list.

| Variables | What they are |
|---|---|
| `tipLabel` | The label on the tip, big at the start, small beside the tip at the end |
| `layer1` to `layer4` | One label per stratum, top to bottom. Each gets a heavier plate and larger type |
| `finalLabel` | The hero line that stamps on the key frame |
| `finalSub` | Optional small line under the hero. Empty by default |
| `skyTop`, `skyLow` | Dawn sky, high up and at the horizon |
| `surfaceWater`, `midWater`, `deepWater` | The colour journey down the water |
| `ice`, `iceDeep` | Ice at the surface and at the bottom. The strata are mixed between them |
| `glow` | Base, cracks, pulse and the last plate's edge |
| `text`, `textDark` | Light and dark text. Plates pick whichever reads on their colour |
| `iceSeed` | A different whole number gives a different iceberg. The same number always gives the same one |
| `overlayPosition` | `top` or `bottom` |

- Keep the sample's order: light things near the surface, the heaviest last.
- `iceDeep` should stay lighter than `midWater` or the lower strata melt into the water.
- Long labels shrink to the minimum size, then wrap to two lines. A three-line hero will cover part of the base, so keep it short.
- The default text is generic sample copy. It isn't a claim about anyone.

## Timing

| | |
|---|---|
| Default opaque shot | 5.9 seconds |
| Key moment | 4.4 seconds |
| Minimum build-up | 2.4 seconds |
| Hold after key moment | 1.5 seconds |
| Transparent exit | 0.36 seconds |

At the default timing the camera holds above the sea for about 0.8 seconds, reaches the surface at 1.05 and is fully under by 1.35. It stops almost level with the waterline for a beat, so the half-sky, half-ice frame reads. Layers land at 1.52, 2.08, 2.58 and 3.02 seconds, and the gaps shorten so the dive speeds up. It brakes at the base at 3.66, then pulls back until the whole mass is in frame, stopping dead on the key frame.

The build-up scales to any `--key-at` from 2.4 seconds upward. Below about 3 seconds each layer is on screen briefly, but all four stay visible on the final frame.

The hero, base glow, flash and shockwave are hidden until the key frame. The pulse reaches the surface about 0.7 seconds into the hold. After that the base breathes, the cracks stay lit, shafts shimmer, particles drift and the camera keeps easing back.

## Outputs

`full` puts the dive centre frame with the labels riding on their strata. The final frame is a tall cutaway with sky above, the mass filling the middle, the labels stacked on it and the hero under the base, inside the 230px top and 300px bottom margins.

`top` uses a longer lens, keeps the berg to the left of the frame and runs the labels down the right-hand side with leaders pointing at each stratum, so the depth survives in a shallow frame. The hero runs across the bottom. Shorter `--height` values scale the composition down.

`overlay` is the same side-labelled composition in a 1000px card. It opens with a circular reveal and closes the same way before the transparent exit ends.

Type stays at least 40px on `full` and 32px on `top` and `overlay`.
