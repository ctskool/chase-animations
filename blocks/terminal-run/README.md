# Terminal run

A Claude Code session plays out in huge type. The prompt types in with the mascot standing on it, then the box shoots up, the mascot drops down to work and tool calls stack up while the file count and timer climb. A green result slab slams in and the mascot lands on it with its arms up.

**Key moment:** the mascot lands on the slab as your done word and the exact count and time hit.

## Suits

- "I typed one sentence and it did all this" moments
- Showing what one prompt got done
- Any video about Claude Code doing real work

## Doesn't suit

- Long code or terminal output: this shows short labels, not real logs
- Sessions that didn't finish: the payoff is a win

## What to change

Run `animate vars terminal-run` for the full list. Tell Claude what the session did and it fills these in.

| Variables | What they are |
|---|---|
| `prompt` | The prompt that types in |
| `project` | The folder in the header |
| `spinnerWord` | The word beside the spinner |
| `step1Tool` to `step6Tool`, `step1Target`, `step1Result` and so on | Up to six tool calls, such as `Write`, `billing/page.tsx`, `Wrote 212 lines` |
| `doneWord` | The payoff word |
| `filesStat`, `timeStat` | The final count and time. Both count up as steps land |
| `doneColor`, `doneInk`, `accent`, `ground` | Main colours |
| `showMascot`, `showLogo` | Turn the mascot or Claude logo off |
| `overlayPosition` | `top` or `bottom` for the overlay output |

- Leave a step's tool empty to remove it. Three to six steps work best.
- Steps land faster as the run goes on, so more steps feels busier, not slower.
- The count works with any number and a word after it, such as `47 files` or `12 pages`.
- Write the time as `4m 12s` or `58s`. Anything else stays still until the key moment.
- Use your real numbers. The defaults are illustrative.

## Timing

| | |
|---|---|
| Build-up before the key moment | 4.6s by default; 2.6s minimum |
| Hold | 1.9s by default |
| Transparent exit | Wipes down the card in 0.34s |

Each result lands on one frame: the bullet turns green, the counters tick and the mascot hops and reacts. Through the hold the mascot keeps hopping while pixels drift, and the text stays still.

## Outputs

`full` uses the portrait safe area with five rows on screen at once. `top` and `overlay` have their own tighter layouts. When there are more rows than fit, the feed steps up by whole rows, so a row is never cut in half. `overlay` is a 960px-high card that wipes in and out.

Claude, Claude Code and the Claude logo are Anthropic's. This pack isn't affiliated with or endorsed by Anthropic.
