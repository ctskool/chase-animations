# Diff reveal

A hungry mascot eats a large Claude Code diff. Red code tears into recognizable fragments that funnel into its mouth. Each swallow grows its stepped belly and ticks the minus counter.

**Key moment:** the biggest remaining red block finishes entering the mouth. The mascot compresses hard and the exact minus total hits at maximum overshoot with a red counter flash. The number settles, then the summary lands.

## Suits

- Showing a large deletion or cleanup
- Before-and-after code improvements
- A short where removing complexity is the punchline

## Doesn't suit

- Reading a complete function
- Explaining every changed line
- Changes where additions should be the main story

## What to change

Run `animate vars diff-reveal` for the full list.

| Variables | What they are |
|---|---|
| `tool`, `file` | Header tool call |
| `removed1` to `removed5` | Representative deleted lines, in displayed order |
| `removed1Word` to `removed5Word` | Exact substrings highlighted in red |
| `added1`, `added2` | Replacement lines |
| `added1Word`, `added2Word` | Exact substrings highlighted in green |
| `removedStartLine`, `addedStartLine` | Starting line numbers |
| `removedStat`, `addedStat` | Final totals |
| `removedLabel`, `addedLabel`, `summary` | Counter labels and payoff sentence |
| Colour variables | Backgrounds, highlights, text and counters |
| `showMascot`, `showLogo` | Show or hide either character element |
| `overlayPosition` | `top` or `bottom` |

Leave a code row empty to remove it. Keep excerpts around 30 characters or fewer, file names short and line numbers within four digits. Keep the summary under about 40 characters.

Highlights must match their code exactly. Leave a highlight empty to omit it.

The plus counter always includes its plus sign, including intermediate values. The sample reads `+0`, `+19`, then `+38`.

The mascot eats from the bottom upward. With the sample, two individual bites leave three red rows for the much larger final meal. With three or fewer red rows, they all belong to the finale.

Rows are representative excerpts. Early ticks divide the supplied minus total across those excerpts; the final meal accounts for the remainder. The defaults are illustrative. Supply your own totals and summary.

Never turn this into a normal editor, give additions equal weight, or shrink the code into unreadable rows.

## Timing

| | |
|---|---|
| Build-up | 4.2s by default; 2.6s minimum |
| Hold | 1.9s by default |
| Transparent exit | Horizontal seam wipe in 0.34s |

The opening shows the mascot already approaching the red block with its arms raised and mouth opening. The initial `0` is deliberately small and secondary. The first sample swallow happens at 0.68s at the default timing.

Walking uses the kit's alternating kicking legs, with a separate lift and landing for each footfall. Before every meal, the mascot recoils, braces and reaches up with the kit's V arms.

Each row briefly crumples, then becomes fragments carrying its own code, gutter and word highlight. The fragments travel immediately along tight curves, accelerate into the mouth and shrink during the final approach. They arrive as a short stream rather than hovering as a horizontal shelf.

The last fragment disappears on the exact frame that the mouth closes, belly advances and minus counter ticks. Green rows become readable and tick the signed plus counter on their landing frame.

Before the finale, the remaining red rows grow taller and receive one red outline. Their suction hoists the mascot and raises the counter slab into its final layout. Fragments follow the moving mouth while its feet kick.

At the key moment, both totals are exact. The mascot hits a deep compression and the minus number hits its largest overshoot. A red flash stays inside the counter band. The number rebounds and settles by 0.32s after key; the summary lands at 0.42s.

The overshoot changes the number's physical size, never its numeric value. A thicker red edge and fine border remain after impact.

During the hold, the stuffed mascot pauses, burps a small puff of pixels and shrinks through the existing stepped belly shapes. It finishes smiling with its V arms raised, blinks and makes two pleased hops.

Readable text stays still after settling. The mascot, background light and travelling counter edge keep the held frame moving. Shorter holds compress the reaction timings.

## Outputs

`full` uses a portrait stack between the top and bottom safe areas. At the default stage size, opening rows are 112px tall with 54px code, 44px line numbers and a 36px mascot cell. Final green rows expand to 144px.

`top` has its own 76px opening rows, 48px code, 36px line numbers and 20px mascot cell. Final green rows expand to 84px.

`overlay` uses separate spacing inside its 960px card, with 76px opening rows, 48px code, 36px line numbers and a 21px mascot cell. Final green rows expand to 86px.

The counter band reaches the bottom of the available area in every output. Its final height is claimed during the last fragment flight, so the key frame already has the large final composition.

Shorter compact stages use tighter spacing and smaller mascot cells, down to 12px. Readable labels and code stay at least 40px in `full` and 32px in `top` and `overlay`. For compact stages below about 640px tall, use fewer representative rows.

With the mascot hidden, its rail closes and the row fragments feed directly into the counter. With the logo hidden, the header uses the released width.
Claude, Claude Code and the Claude logo are Anthropic's. This pack isn't affiliated with or endorsed by Anthropic.
