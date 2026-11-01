# Test sweep

A dense red test wall slams into place. The mascot backs up, walks across the plate, looks over its shoulder and runs as a diagonal band of flipping tests catches up.

**Key moment:** the final exposed test snaps fully green and the counter punches to the exact total. The wall flashes, the dark-backed plate turns green and the mascot launches from a deep crouch with its arms raised. A larger “All passing” lands a beat later.

## Suits

- “All 214 tests pass, first try.”
- Test results after an AI coding session
- A clean final check before shipping

## Doesn't suit

- Detailed test logs or individual test names
- Results with skipped tests or remaining failures
- Comparing two test suites

## What to change

Run `animate vars test-sweep` for the full list.

| Variables | What they are |
|---|---|
| `suiteName` | Command or suite name above the counter |
| `total` | Positive whole-number total |
| `countSeparator` | Text between the passed count and total |
| `countLabel` | Caption explaining the counter |
| `failWord`, `passWord` | Running state and final payoff |
| `failColor`, `failInk` | Red tiles and their crosses |
| `passColor`, `passInk` | Green tiles, ticks and final plate |
| `plateColor` | Counter plate before completion |
| `ground` | Background, tile gaps and the plate's dark backing |
| `ink`, `muted`, `borderColor` | Plate text, caption and border |
| `accent`, `highlightColor` | Mascot, logo, pixels and reflected light |
| `showMascot`, `showLogo` | Independently hide either character element |
| `overlayPosition` | `top` or `bottom` for the overlay output |

- Totals from 1 to 999,999 give useful creator-facing results.
- Keep the suite name under about 24 characters and state words under about 28.
- Leave the suite name or caption empty to remove its text.
- The default full wall has 96 tiles; the default compact walls have 48.
- Earlier tiles represent groups of tests. The final exposed tile represents the final test.
- Smaller totals use fewer, larger tiles.
- Each completed green landing updates the whole counter and progress rail on the same frame.
- Keep `ground` dark so the green plate retains its contrasting backing.
- Never use a slow, even wipe, finish the counter early or shrink the tests into unreadable dots.
- Use your actual results. The defaults are illustrative.

## Timing

| | |
|---|---|
| Build-up before the key moment | 4.0s by default; 2.4s minimum |
| Hold | 1.8s by default |
| Transparent exit | Sweeps closed to the right in 0.34s |

The wall is already populated when it enters. Every row is visible during the opening slam, which finishes in about a tenth of a second at the default timing.

Whole diagonals turn together. Their thin card edges form a narrow moving band between the red and green faces. The cadence accelerates as the mascot breaks into its run.

The mascot keeps its natural proportions throughout the walk and run. Alternating kit leg poses, planted contacts, airborne steps and an eight-degree running lean carry the movement. Its backward glance gives the approaching wave a brief comic beat.

The mascot stops beside the last exposed red test and crouches to almost half height. That test gets its own bright outline before its final snap.

At the key moment, every test is fully open and green. No card rotation or settlement continues into the hold. The exact total, stronger plate punch, bright wall pulse and raised-arm jump share that frame.

The failing word disappears on the total hit. The larger success word lands about 0.11 seconds later at the default hold, giving the number and wording separate accents.

Large square pixels burst upward and outward for roughly a second. They stay above the plate so the number and success line remain clear.

During the hold, brightness travels diagonally across the finished wall. The mascot adds smaller planted hops and blinks. The plate retains its dark backing and a restrained bright rim; the reading text stays settled.

## Outputs

`full` keeps its eight-column, twelve-row wall and 624px-high central plate. The mascot uses larger 26px cells, a deep crouch and a victory jump of up to 180px within the portrait safe area. A 16px dark backing separates the success plate from the wall.

`top` uses its own eight-column, six-row wall and 344px-high plate. Its 16px-cell mascot gets a dedicated performance area and a victory jump of up to 160px. The larger success word and 12px dark backing preserve the plate's hierarchy.

`overlay` has separate spacing, a 360px-high plate, 16px mascot cells and a 13px dark backing in the default 960px-high area. The populated wall enters through a fast left-to-right wipe and exits through a closing wipe to the right.

Where space permits, the plate's upper edge aligns with a tile landing. The mascot finishes beside the final test's exposed glyph and stands on the plate's dark upper edge.

Shorter compact stages reduce tile rows and plate spacing and use 12px mascot cells. Labels retain a minimum size of 40px in `full` and 32px in compact outputs. Jump heights respect the available headroom.

The diagonal sweep, exact final trigger, large pixel burst and success-word landing also work with the mascot or logo hidden.