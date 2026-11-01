# Terminal run

A huge prompt types in beneath the mascot. Enter sends it into the terminal, tool calls arrive faster and faster, and each completion kicks the counters and the character. The mascot crouches, jumps and lands on a green result slab.

**Key moment:** the slab compresses, your done word and exact stats appear, and the mascot squashes onto its top edge with its arms up.

## Suits

- "I typed one sentence and it did all this" moments
- Showing what one prompt got done
- Videos about Claude Code completing a task

## Doesn't suit

- Long code or terminal output
- Sessions that didn't finish: the payoff is a win

## What to change

Run `animate vars terminal-run` for the full list. Tell Claude what the session did and it fills these in.

| Variables | What they are |
|---|---|
| `headerLabel`, `project` | Name and folder in the header |
| `prompt` | The prompt shown at the opening |
| `spinnerWord` | The word beside the spinner |
| `step1Tool` to `step6Tool`, `step1Target`, `step1Result` and so on | Up to six tool calls |
| `doneWord` | The payoff word |
| `filesStat`, `timeStat` | The exact final count and time |
| `doneColor`, `doneInk` | Result slab, completed bullets and payoff text |
| `accent`, `ground` | Claude colour and terminal background |
| `textColor`, `mutedColor`, `promptColor` | Terminal text, secondary text and sent prompt |
| `showMascot`, `showLogo` | Turn the mascot or Claude logo off |
| `overlayPosition` | `top` or `bottom` for the overlay output |

- Leave a step's tool empty to remove it. Three to six steps work best.
- Keep prompts, filenames and results short enough to read during a short video.
- Paths get their own line. Longer paths break between directories, keeping the filename and extension together.
- Counters stay at zero until after Enter. They tick during work and punch on the same frame as each completed result.
- The count accepts a number and label, such as `47 files` or `12 pages`.
- Write the time as `4m 12s` or `58s`. Other formats stay unchanged during the run.
- Use your real numbers. The defaults are illustrative.

## Timing

| | |
|---|---|
| Build-up before the key moment | 4.6s by default; 2.6s minimum |
| Hold | 1.9s by default |
| Transparent exit | Wipes down the card in 0.34s |

The gaps between calls shrink throughout the run. Intermediate counter ticks make that acceleration visible.

The result slab shoots past its resting position, then compresses on impact. Its words appear on the key frame after it has cleared the stage edge. The mascot has a visible crouch, a clean jump and a compressed landing. During the hold it makes planted vertical cheers while pixels and a subtle stripe keep moving.

## Outputs

`full` uses a much larger opening prompt, larger tool type and up to three complete calls within the portrait safe area.

`top` and `overlay` have their own prompt, mascot, status and slab sizes, with up to two complete calls. Shorter stages use tighter layouts and fewer rows when needed.

The status band follows the active calls. Filled feeds advance by complete rows. The feed clears before the payoff, giving the mascot room to jump. Sparks always pass behind the slab and its words.

`overlay` is a 960px-high card that wipes in and out.

Claude, Claude Code and the Claude logo are Anthropic's. This pack isn't affiliated with or endorsed by Anthropic.