# Head to head

Two options face off around a large VS badge. Rows snap into place, then the final comparison lands in a padded result box with thick blue and orange bars. Bright silver keeps the losing figures readable.

**Key moment:** the final figures become exact as their bars and winner tick land. The result box punches in scale, followed by a flash through the winning side.

## Suits

- A vs B videos, tool and product comparisons
- Pricing plans
- Decisions with a clear winner on the numbers

## Doesn't suit

- More than two options
- Close calls where the answer needs explanation
- Labels that need a second line

## What to change

Run `animate vars head-to-head` for the full list.

| Variables | What they are |
|---|---|
| `nameA`, `nameB` | The two options; keep names short for the strongest opening |
| `vsLabel`, `subtitle` | Centre badge and comparison context |
| `row1Label` to `row4Label`, `row1A`, `row1B` and so on | Up to four rows; the last included row becomes the payoff |
| `row1Winner` and so on | `a` (left), `b` (right) or `tie` |
| `colorA`, `colorB`, `ground`, `ink`, `muted` | Main colours |
| `secondaryInk` | Bright silver for losing figures |
| `overlayPosition` | `top` or `bottom` for the overlay output |

- Leave a row's label empty to remove it. Two to four rows work best.
- Keep labels on one line.
- Each numeric row appears once and counts once, finishing on the exact text you enter.
- Both values in a row share a type size and baseline.
- Numeric bars use one common scale: their lengths preserve the ratio between the values. A lower-is-better winner can have the shorter bar.
- Text rows give the winner a full bar and the other option an empty bar. A number against a word gives the losing side a half bar.
- Every bar grows outward from the central seam. The thick payoff bars meet at the seam.
- The final winner keeps its white figure, coloured tick and a lasting accent along its side of the result box.
- Use your real numbers. The defaults are illustrative.

## Timing

| | |
|---|---|
| Build-up before the key moment | 2.9s by default; 1.5s minimum |
| Hold | 1.6s by default |
| Transparent exit | Closes onto the seam in 0.34s |

The names and large VS badge begin mid slam. Supporting rows arrive about half a second apart, with a sharp attack and a deliberate settle. Each count finishes as its bar and winner tick land.

The payoff gets a longer count, larger figures, generous padding and much thicker bars. Its exact figures land at the key moment with a scale punch. A light sweep and the outline react immediately afterward. Once that brief reaction settles, the text stays fixed while edge light and a bar sheen continue moving through the hold.

## Outputs

`full` uses the portrait safe area, a 150px VS badge and large comparison rows. `top` uses its own shorter header, row spacing and padded payoff. `overlay` has a separate layout inside a 960px-high card, with seam wipes for entry and exit.

Shorter stages surrender spacing before figure size. Labels and the subtitle retain a minimum of 40px in `full` and 32px in the compact outputs. For very short cards, remove a row rather than crowding the comparison.