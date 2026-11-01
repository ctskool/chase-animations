# Post receipt

A large social post lands on a pale field. It lifts clear before two replies arrive. Each reply triggers a count jump and a short card punch. The payoff adds a rough red underline, a larger key sentence and the strongest impact.

**Key moment:** the underline finishes, all four counts are exact and the original card, key sentence and liked heart reach their impact peak.

## Suits

- Commentary and reaction videos
- Showing someone's words as evidence
- Fictional social interface demonstrations

## Doesn't suit

- Long threads or screenshot reproductions
- Posts needing several paragraphs of context
- Key lines too long to read on one line

## What to change

Run `animate vars post-receipt` for the full list.

| Variables | What they are |
|---|---|
| `author`, `initials`, `handle`, `company`, `verified` | Original post identity |
| `postText`, `keyLine` | Complete post and exact sentence to emphasize |
| `timestamp`, `setupLine` | Timestamp and optional setup above the stack |
| `repliesStart` through `viewsEnd` | Starting and final counts |
| `quote1Author`, `quote1Initials`, `quote1Handle`, `quote1Text` | First reply |
| `quote2Author`, `quote2Initials`, `quote2Handle`, `quote2Text` | Second reply |
| `quote1Attribution`, `quote1Embedded` and their `quote2` equivalents | Optional additional source text |
| `quote1Likes`, `quote2Likes` | Optional reply likes |
| `fieldTop`, `fieldBottom`, `depthColor`, `paper` | Background and cards |
| `ink`, `muted`, `metricInk`, `lineColor` | Text and hairlines |
| `red`, `blue`, `avatar1`, `avatar2`, `avatar3` | Accent and avatar colours |
| `overlayPosition` | Overlay placement: `top` or `bottom` |

Keep the original short and give the key sentence its own paragraph. The marker uses the first exact match of `keyLine`. Keep replies to one short sentence or two brief sentences.

Embedded quotations that repeat the visible original, their own reply or an earlier embedded quotation are omitted. Repeated original-author attribution is omitted too. The sample shows each sentence once.

Counts use complete grouped numbers with reserved widths and a shared baseline. Optional reply likes accept values such as `240` or `1,240`.

All sample people, handles, company details and posts are fictional.

Never use real platform branding or real people as defaults. Never fade cards in, jiggle the digits, add glows or turn the underline into a straight bar. Reserve red for the liked heart, its count and the marker.

## Timing

| | |
|---|---|
| Build-up | 3.933s by default; 2.5s minimum |
| Hold | 1.067s by default |
| Transparent exit | Downward wipe in 0.32s |

The original lands first. Its entrance finishes before the first count punch. It then lifts completely clear before the first reply becomes visible.

Replies land at 43% and 73% of the build. Each arrival takes a short diagonal step into its own space. Contact starts a count jump, compresses the incoming card and punches the original. Counts briefly darken at their endpoints.

The final count burst and underline finish exactly at the key moment. The original expands upward, the key sentence punches larger and the heart reaches its largest size. The layout reserves room for that expansion.

The impact settles immediately afterward, leaving the rough underline, a slightly larger key sentence and a darker card edge. Reading text stays fixed while a trace travels around the background arc, shadows breathe and the liked heart gives one quiet beat.

## Outputs

`full` uses a broad portrait stack inside the top and bottom safe areas. Its starting reading sizes are 88px for the original, 116px for the key sentence and 64px for replies.

`top` uses its own spacing and starting sizes of 56px, 76px and 46px.

`overlay` uses its own spacing and starting sizes of 60px, 80px and 48px within the 1000px card. It enters and leaves through a wipe.

Spare height increases reading sizes. Shorter stages first reduce padding, then reduce the largest reading sizes. Text never drops below 40px in `full` or 32px in the other outputs. The key sentence also reserves width for its punch. Long replacement copy or unusually short stages may require shorter wording.