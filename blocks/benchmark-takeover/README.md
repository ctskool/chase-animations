# Benchmark takeover

A tall grey leaderboard shudders. An oversized orange challenger falls in with a panicking mascot aboard, drives the ranks down and knocks the last entry out.

**Key moment:** the huge rank word stamps oversized, then settles hard. The winning row has already landed, rebounded and locked its exact score.

## Suits

- “And it just took first place” moments
- A new leader on a shared, higher-is-better score scale
- Three to five existing entries with short names

## Doesn't suit

- Lower-is-better results
- Ties or results that need qualification
- Long descriptions instead of names
- Unrelated score scales

## What to change

Run `animate vars benchmark-takeover` for the full list.

| Variables | What they change |
|---|---|
| `boardTitle` | The leaderboard title |
| `row1Name` to `row5Name` | Existing entries, highest first; an empty name removes its row |
| `row1Score` to `row5Score` | Exact displayed scores |
| `newName`, `newScore` | The incoming winner and its exact score |
| `rankWord` | The large stamp; keep it short, like `#1` |
| `rankStart` | The opening first rank, normally `1` |
| `scoreMax` | The shared maximum for the bars |
| `ground`, `rowGround`, `trackColor`, `barColor` | Background, grey rows and grey bars |
| `ink`, `muted`, `rule` | Neutral text, ranks and outlines |
| `accent`, `accentInk` | Winning row and its contrasting text |
| `warmHighlight` | The thin bar sweep and winning impact light |
| `showMascot`, `showLogo` | Hide either independently |
| `overlayPosition` | Overlay position and wipe edge |

Keep titles on one line and names short. The winner has a separate logo/name header above its dominant score. Scores stay at least as large as names.

Scores accept decimals, commas, prefixes and suffixes. Numeric scores set the bar lengths; values above `scoreMax` expand the shared scale.

The final board keeps the opening entry count: the last existing entry is ejected.

Keep rivals grey and reserve orange for the winner and mascot. Never use a polite slide-in, coloured rival rows or scores smaller than names.

The defaults are illustrative sample scores, not benchmark claims. Replace them with your own verified results.

## Timing

| | |
|---|---|
| Build-up | 3.6s by default; 2.4s minimum |
| Hold | 2.0s by default |
| Transparent exit | Edge wipe in 0.34s |

The opening is entirely grey. Tall rows begin directly below the title and fill down to the lower safe boundary. Thick bars load quickly, with a score punch and neutral endpoint flash.

A slight tension drift becomes a short shudder. Nothing orange appears before the drop.

The entire orange row enters from beyond the frame. The mascot rides it with the kit’s raised V arms and panicked eyes. Its first appearance is part of that falling assembly.

The initial fall accelerates and reserves visible output frames, including at the minimum key time. Its leading edge drives a staggered collision through the board. Each struck row jolts, compresses and visibly flips its whole rank face. Unstruck rows stay in place.

The challenger’s whole-number score ticks and punches on each collision. The last existing entry flips its rank while tumbling rapidly beyond the frame.

The final approach leads into a flattened impact, pixel sparks and a frame shake. The mascot briefly compresses with its arms down, then raises them as the row rebounds. Both return upright and seat before the key.

The score locks exactly when the row seats. After a separate reading beat, the rank stamps at the key in an oversized pose and settles hard. A faint winning outline remains.

During the hold, the mascot stands upright with raised arms, makes small victory hops and blinks. It does not tilt. A thin warm highlight travels along the black winning bar, including when the mascot is hidden.

## Outputs

`full` uses tall opening rows and a final board that reaches the bottom safe boundary. The winner’s large score sits below its logo/name header, beside a separate rank column. The final mascot and its hops stay below the upper safe boundary.

`top` has its own roof, row heights and winner layout. The score dominates the right side, with clear space around the logo above it. The rank stamps in its own left column.

`overlay` has separate margins, bar sizes and winner proportions. Its board fills the card through the lower margin.

The opening rows use the space that the arriving mascot later occupies. The takeover compresses and pushes them into the final stack rather than swapping layouts.

The mascot uses 27px cells in `full` and 24px cells in standard compact outputs. Short compact stages adapt to a minimum of 18px cells. Text fitting keeps a minimum of 40px in `full` and 32px in compact outputs. Remove an optional row for unusually short cards.

Hiding the mascot releases its roof space. Hiding the logo releases space beside the winner’s name.

The overlay uses a 960px-high card by default and enters and exits through an edge wipe.