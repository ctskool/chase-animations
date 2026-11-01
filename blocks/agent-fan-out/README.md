# Agent fan-out

One prompt opens inside a branching burst. Six colourful mascots work on separate beats, finish separately and hold their arms up in victory.

The branches then become attached tethers. They pull the mascots through one shared merge point and release them into a crooked pile above the result slab.

**Key moment:** the last agent finishes, its tick appears, the pile lands and the slab punches green. The full count and exact result appear together.

## Suits

- Parallel agents working from one prompt
- An audit split across several specialties
- Agents merging their work into one result
- A spoken “finished” or “all done” beat

## Doesn't suit

- Tasks that wait for each other
- More than six agents
- Long descriptions inside each tile
- Results that need several lines of explanation

## What to change

Run `animate vars agent-fan-out` for the full list.

| Variables | What they are |
|---|---|
| `prompt` | The starting instruction |
| `agent1Name` to `agent6Name` | Agent names, shown in reading order |
| `agent1Color` to `agent6Color` | Each agent's branch, work props and mascot colour |
| `runningWord`, `finishedWord` | Short live statuses |
| `countTemplate` | Counter wording; `{done}` and `{total}` become the counts |
| `doneWord`, `stat` | The result headline and exact final stat |
| `accent`, `success`, `resultInk` | Trunk and logo colour, completed colour and result text |
| `ground`, `panel`, `ink`, `muted` | Background, tiles and readable text colours |
| `showMascot`, `showLogo` | Optional characters and logo |
| `overlayPosition` | `top` or `bottom` for the overlay output |

- Leave an agent name empty to remove it. The total updates automatically.
- Two to six agents work best.
- Keep names to one or two short words.
- Keep statuses short, such as “Working” and “Done”.
- Keep the prompt to a short sentence.
- Keep the result headline on one line.
- Update “All six finished” when changing the agent count.
- The defaults illustrate a possible result; they are not a record of a real run.

## Timing

| | |
|---|---|
| Build-up before the key moment | 4.6s by default; 2.8s minimum |
| Hold | 1.9s by default |
| Transparent exit | Closes onto the central trunk in 0.34s |

The first pair of agents is connected at the opening. The remaining branches burst out immediately and the rest of the tiles arrive within the first third of a second at the default timing.

Security peeks around a scanning shield. Tests stamps a compressing pad. Docs types on visible keys. Types lifts and compares two blocks. UI pushes a pixel frame into place. Speed runs over short ground streaks.

Each early completion replaces its progress marks with a green tick, punches the tile and changes the whole counter on the same frame. Finished mascots raise their arms and keep them raised.

The counter stops one short of the total. The final agent is still unfinished when the merge begins.

Labels disappear together before the tiles wipe toward the central trunk. Branches stay attached to the mascots' feet as they pull inward and then along the trunk into one shared merge point. The mascots spread from that point into the final pile.

The receiving plate rises immediately before the key moment. It carries no result text or completed count during this approach.

At the key moment, the last agent lands and finishes. Its tick, the green slab, the full count, the headline and the exact stat appear together. The first “6 of 6” belongs to this impact.

A compression travels through the pile. The last finisher then overbalances and its neighbour catches the perch. A moving sheen, blinks and gentle character motion continue through the hold while the result text stays in place.

## Outputs

`full` uses tall tiles with protected name headers, mascot windows and full-width status footers.

`top` and `overlay` reserve a text column on the left and a separate mascot window on the right. Status icons use less width so “Working” and “Done” can stay large. Raised arms and work props remain inside the mascot window until the merge begins.

Six agents use two columns and three rows. Fewer agents receive roomier tiles. The final pile overlaps at irregular angles instead of forming tidy rows.

Names and statuses stay at least 40px in `full` and 32px in compact outputs. Standard compact layouts start statuses at 48px. Short copy works best, especially in shorter top outputs.

Either the mascots or the Claude logo can be switched off. With mascots off, visible packets follow the same branch retraction into the result.

The overlay opens and closes through a central wipe inside its 960px-high card.
Claude, Claude Code and the Claude logo are Anthropic's. This pack isn't affiliated with or endorsed by Anthropic.
