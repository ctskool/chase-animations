# Bug hunt

A mascot surfs a bright beam through a varied code excerpt. An opening burst throws it off balance. The page accelerates again, brakes past the bug and recoils onto the exact line. A lens punches outward from that line, then the correction earns a high victory hop.

**Key moment:** the magnified bug and exact line number land together. The fix follows just after.

## Suits

- A bug discovered in an overlooked line
- Before-and-after code fixes
- Claude Code debugging stories

## Doesn't suit

- Several bugs or highlighted lines at once
- Long code excerpts that need explanation
- A fix that needs several statements to read

## What to change

Run `animate vars bug-hunt` for the full list.

| Variables | What they are |
|---|---|
| `fileName` | File shown in the header |
| `foundLine` | Exact positive line number stamped at the key |
| `bugLine`, `fixLine` | Original and corrected code |
| `lineLabel`, `foundLabel` | Discovery labels |
| `scanCode` | Earlier search excerpt, with one code line per line |
| `filler1` to `filler8` | Context surrounding the bug; empty lines are removed |
| `accent`, `ground`, `ink`, `muted` | Main colours |
| `keywordColor`, `numberColor`, `stringColor`, `commentColor` | Syntax colours |
| `bugColor`, `fixColor`, `removedGround`, `addedGround` | Operator accents and terminal diff tints |
| `showMascot`, `showLogo` | Independent character and logo switches |
| `overlayPosition` | `top` or `bottom` for the overlay |

Keep individual source lines short, ideally within 28 characters. The default search excerpt supplies varied statements rather than repeating the eight context lines. Leave `scanCode` empty to use the context as a shorter search.

Keep the discovery label short. Conditions stay intact: the sample wraps before `return;`, keeping `total = 0` and `total === 0` together. Both diff rows settle at the same type size.

The changed operator gets the strongest colour accent. The surrounding original code strikes through while the operator remains clear. Panel backgrounds use restrained red and green tints.

Never use tiny code, a gentle scroll or several highlighted source lines. The source disappears before its magnified copy appears.

The sample code is illustrative. Supply the excerpt, bug and correction from your own story.

## Timing

| | |
|---|---|
| Build-up | 3.6s by default; 2.4s minimum |
| Hold | 2.2s by default |
| Transparent exit | A scan shutter closes in 0.34s |

The opening burst, second acceleration and final brake have distinct speeds. The page briefly overshoots the target before returning to it. The mascot counterbalances, searches with its pupils, then locks its gaze on the caught line.

The lens expands from that line, briefly overscales and recoils into the key frame. Its number is already exact when it lands.

The correction slides in horizontally. Its arrival flashes the changed operator, turns the number and outline green, and launches the mascot off its parked board. The character lands with a squash, then continues a small breathing movement and blink. The code stays fixed while the edge light travels and the target pulses.

## Outputs

`full` uses a broad number stamp, large comparison text and a tall lens within the portrait safe area.

`top` has its own header, panel heights and character spacing. Its taller lens header gives the victory hop room beneath the discovery label.

`overlay` uses separate spacing inside the 960px-high card, with a scan shutter for entry and exit.

Short compact stages reduce spacing, panel heights and hop distance. Text retains a minimum font size of 40px in `full` and 32px in compact outputs. Short excerpts give the clearest result.
Claude, Claude Code and the Claude logo are Anthropic's. This pack isn't affiliated with or endorsed by Anthropic.
