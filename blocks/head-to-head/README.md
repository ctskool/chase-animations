# Head to head

Two options face off across a slanted seam, like a sports tale of the tape. Rows build one at a time, with bars growing out from the centre, and the last row lands as the payoff.

**Key moment:** the last row's bar lands and its number kicks.

## Suits

- A vs B videos, tool and product comparisons
- Pricing plans
- Any decision with a clear winner on the numbers

## Doesn't suit

- More than two options
- Close calls where the real answer is "it depends". The format declares a winner
- Rows that need more than a few words

## What to change

Run `animate vars head-to-head` for the full list.

| Variables | What they are |
|---|---|
| `nameA`, `nameB` | The two options. Long names shrink to fit |
| `subtitle` | One line on what's being compared |
| `row1Label` to `row4Label`, `row1A`, `row1B` and so on | Up to four rows. Row 4 is the payoff |
| `row1Winner` and so on | `a` (left), `b` (right) or `tie` |
| `colorA`, `colorB`, `ground`, `ink`, `muted` | Colours |
| `overlayPosition` | `top` or `bottom`, for the overlay output |

- **Fewer rows:** leave a row's label empty and it's dropped. The last row left becomes the payoff. Two to four rows works.
- **Numbers count up and drive the bars.** `$2,400`, `38%` and `4.2x` all work, and each bar's length matches its number. So a lower-is-better row still shows the bigger number with the longer bar, with the check on the winner.
- **Text rows:** with `Yes` and `No`, or two words, the winner gets a full bar and the other stays empty. A number against a word gets a half bar.
- **Use your real numbers.** The defaults are only examples.

## Timing

| | |
|---|---|
| Build-up before the key moment | 2.9s by default, 1.5s at the shortest |
| After the key moment | 1.6s, then it closes onto the seam in 0.34s when placed in a video |

Rows share the build-up evenly, so a shorter build-up makes them quicker.

## Outputs

`full` uses the whole 9:16 frame and keeps clear of the app bars at the top and bottom. `top` and `overlay` use a tighter layout at the same text sizes where they can. The overlay is a rounded card that opens from the seam, so it reads on any footage.
