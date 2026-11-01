# Blue editorial

An electric-blue editorial cover with huge italic words and smaller black-weight grotesk words. The sample line is “make room for wonder”.

**Key moment:** the complete final word punches to its biggest scale as a thick white underline strikes across the cover. The word settles and the underline contracts to a bold right-aligned accent.

## Suits

- Short four-part statements
- Launch lines and title cards
- Manifesto lines inside a talking-head short

## Doesn't suit

- Paragraphs or long phrases
- Statistics, lists or comparisons
- Copy that needs capitals or additional typefaces

## What to change

Run `animate vars blue-editorial` for the full list.

| Variables | What they are |
|---|---|
| `part1` | Huge italic opening, then the top-left kicker |
| `part2` | Huge italic word with a slanted reveal |
| `part3` | Smaller right-aligned word sliding from a pocket |
| `part4` | Final word arriving in four masked strips |
| `background` | Flat ultramarine; default `#2433F0` |
| `ink`, `ruleColor` | White type, accents and rules |
| `ruleOpacity`, `ruleThickness` | Rule strength; defaults are 55% and 3px |
| `smallTypeSize` | Full-output small type; default 124px |
| `compactSmallTypeSize` | Top and overlay small type; default 96px |
| `impactScale` | Final word's scale punch; default 1.10 |
| `emptyBottomPercent` | Clear full-output footer; default 16% |
| `overlayPosition` | `top` or `bottom` |

Use one short word per part. Text becomes lowercase and stays on one line. Hero words fill their slots using the visible letter shapes. Longer copy becomes smaller; shorten anything that cannot fit at the minimum size.

Keep the cover's limits: one flat electric blue, white type and white rules. No purple, navy, gradients, glow or texture. Use only Instrument Serif Italic and Schibsted Grotesk Black. No capitals, numbered labels, modular grids or centred symmetry. Words move, wipe, slice and slide; they do not fade.

## Timing

| | |
|---|---|
| Build-up | 2.8s by default; 2.2s minimum |
| Hold | 1.5s by default |
| Transparent exit | Slanted closing wipe in 0.3s |

The complete opening word is visible from the first frame. It lands, gathers a little scale, then snaps to the kicker's baseline and changes typeface.

The slanted reveal immediately introduces the second word at its largest width. That word contracts to make space before the third word slides out beneath it. The short rule extends with the arrival.

Four fixed strip windows bring in the final word from alternating directions. They align and switch to one complete word before the final scale punch. The clean word reaches its maximum scale exactly at the key moment.

A thick underline strikes across the available width on the same beat. It contracts toward the right as the word settles, leaving a lasting bold accent. Bright segments travel along both lower rules throughout the hold. Reading text stays fixed after the settle.

## Outputs

`full` fills the portrait safe area with an asymmetric stack. At the standard size, visible type and rules stay clear of the top 230px and bottom 300px.

`top` uses its own margins, hero proportions and spacing. The lower stack moves inward when the final lettering needs additional clearance.

`overlay` uses a 960px-high blue card with its own margins. A slanted wipe opens and closes the stage over a talking head.

All layouts measure the lettering after the fonts load. The final word reserves room for both its visible letters and its complete text bounds at maximum scale. Space beneath it also accommodates the thick underline's strike. Shorter stages tighten the spacing and reduce hero sizes before allowing collisions; very shallow stages need shorter copy or a taller card.