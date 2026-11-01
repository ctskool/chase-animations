# Hours collapse

Equal-height calendar hours land from the bottom up. Each hits, squashes and rebounds as the original total ticks upward.

The mascot peers far over its ledge, gulps, leans away and sinks into a deep crouch. Its stomp crushes the labelled hours one at a time while the clock rewinds.

**Key moment:** the exact final time slams oversized. The clock, pedestal and debris kick on that same frame. The mascot finishes smiling on a bright terracotta block above a small stack of crushed hours.

## Suits

- Showing hours of work reduced to minutes
- A short task breakdown before a time-saving reveal
- A spoken line with a strong final time

## Doesn't suit

- Detailed schedules or long task descriptions
- Comparisons that need several final figures
- Claims without a time saving you can support

## What to change

Run `animate vars hours-collapse` for the full list.

| Variables | What they are |
|---|---|
| `heading` | Small heading above the original total |
| `hours` | Number of hour slots to use, from 1 to 8 |
| `beforeLabel` | Original total, such as `6 hours` |
| `startTime` | First calendar time, such as `9am`, `9:30am` or `09:00` |
| `task1` to `task8` | One task per slot; an empty task removes that block |
| `afterWord` | Exact final time, shown huge |
| `afterLabel` | Supporting line beneath the final time |
| `accent` | Mascot, final time and Claude details |
| `finalBlockColor` | Bright final pedestal, underline and impact ring |
| `ground`, `ink`, `muted` | Background and supporting colours |
| `calendarA` to `calendarD`, `calendarInk` | Warm hour blocks, badges and task text |
| `pixelColor` | Clock sweep, highlights and drifting dust |
| `showMascot`, `showLogo` | Character and logo switches |
| `overlayPosition` | `top` or `bottom` for the overlay output |

- Four to six short tasks give the strongest column.
- Keep at least one task. Use brief labels when showing eight.
- Task labels wrap with their final two words together.
- `hours` selects slots. Empty tasks remove blocks without renumbering later calendar times.
- Update `beforeLabel` yourself when changing the hours.
- A numeric original total builds toward its exact entered wording as the blocks land.
- Calendar times advance by one hour from `startTime`.
- A numeric `afterWord` is interpreted as elapsed minutes for the clock. Its displayed wording stays exactly as entered.
- Keep both totals short enough for one line.
- Keep the final block brighter than the calendar colours.
- The defaults are illustrative. Use your own tasks and measured times.

## Timing

| | |
|---|---|
| Build-up before the key moment | 3.8s by default; 2.4s minimum |
| Hold | 2.0s by default |
| Transparent exit | Vertical wipe in 0.34s |

The bottom hour arrives first. Future hours remain hidden until their own entrances. Every landing has a sharp drop, deep squash, overshoot and settle. The total changes and punches on the landing frame.

The mascot holds a large downward look before its gulp. A small sweat pixel drops as it recoils. Its lean back and deep crouch are separate poses, with a brief pause before takeoff.

The stomp starts an accelerating cascade. Each complete labelled block visibly compresses under the mascot before snapping into a level sliver. Its label stays attached throughout the squeeze and disappears only when the sliver is complete.

Already crushed hours ride the next impact. Each rebound tosses the mascot upward before both feet return for another stomp.

The clock hands sweep backward, gaining speed through the collapse. They reach the exact final elapsed time on the key frame.

The headline arrives oversized with a brief bright flash and hard recoil. The clock kicks, the pile jolts and an already spread burst of pixels appears on that same frame. Supporting copy follows the headline's first recoil.

The final block stays bright terracotta. The paper slivers are thinner and narrower, leaving its coloured face dominant.

The mascot raises its arms and smiles. Small hops and blinks continue through the hold. The clock's outer edge turns, a highlight crosses the block and fresh dust drifts outward.

Readable text stays still after settling. The whole column never shrinks as one object. Main transitions use impacts and wipes.

## Outputs

`full` uses equal-height hours down to a shared floor above the bottom safe margin. There is no stretched bottom block or ruled-paper extension. Its opening mascot uses 20px cells with six tasks, and settles at 1.1 times normal size.

`top` uses its own spacing and a larger character: 20px cells with six tasks, settling at 1.16 times normal size. Its 320px-wide, 54px-high final block gives the face and pedestal more presence beneath the headline and clock.

`overlay` uses separate spacing, jump dimensions and a 19px-cell opening mascot with six tasks. Its final block is 300px wide and 50px high. Entry and exit use vertical wipes.

All three versions use equal opening rows, visible staggered entrances, the larger comic setup, labelled compression and the simultaneous final impact.

Seven or eight tasks reduce the opening mascot size. Shorter compact stages reduce spacing and character size, keeping cells at least 12px. Full cells stay at least 14px. Settled text sizes stay at least 40px in `full` and 32px in `top` and `overlay`.

For short cards, use fewer tasks or shorter labels.
Claude, Claude Code and the Claude logo are Anthropic's. This pack isn't affiliated with or endorsed by Anthropic.
