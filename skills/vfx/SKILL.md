---
name: vfx
description: Put an effect on the member's own talking-head video, landed on a spoken word, from the Chase Animations pack. Cards that fall behind their head, an orbit around it, the lights dropping, a checklist that ticks as they talk, a tier list or chart above them. Use when someone types /vfx, or asks to add an effect, a "behind my head" moment, a spotlight, an orbit, a tier list or a checklist to their own clip.
argument-hint: [effect] [video] [when it should happen]
---

# /vfx

Chase Animations pack. Everything runs through one command:

```bash
node "{{PACK}}/shared/animate.mjs" vfx <command>
```

Below, `vfx` means that command. Work in the member's current folder.

Request: $ARGUMENTS

## 1. Check setup

/vfx needs a cut-out model once, picked for their computer. Run:

```bash
cd "{{PACK}}" && npm run setup -- --vfx --check
```

It says what the computer is and what it would use. If nothing is installed yet, tell them in one line and **ask before installing**, with the size:

- **Windows or Linux with an NVIDIA card:** RVM (best edges, fast). About 2.5 GB, downloaded from RVM's own GitHub. RVM is GPL-3.0; it is installed on their machine, never part of the pack.
- **Mac, or any computer without an NVIDIA card:** HyperFrames' own remover. About 170 MB. Slower (about a minute per effect on a laptop), but it runs anywhere.

On a yes, run `npm run setup -- --vfx` (or `--engine hyperframes` if they'd rather skip the big download). Speech is needed for word timing too: `npm run setup -- --speech` if it isn't installed.

## 2. Prepare their video, once

It must be vertical. Then:

```bash
vfx prep "<video>"
```

This writes `<video>.vfx/` beside it: a 1080x1920 working copy and the words with their times. Read `<video>.vfx/words.json` to find when things are said.

**Framing check.** Behind-the-head effects need room around the head. Look at one frame: if the top of their head is in the top tenth of the frame or their head fills most of the width, say so plainly. Split layouts (tier-list, chart-split) and checklist still work; glass-widgets, orbit and spotlight's word won't have room. The fix is filming wider (turning the camera sideways and shooting portrait gives about 1.8x more view).

## 3. Pick the effect and the moment

Run `vfx list`. Match their words to an effect, or show the list and ask.

| Effect | What it does | Lands on |
|---|---|---|
| `glass-widgets` | Frosted cards drop in around the head; the upper ones fall behind it | A hook, a list of things |
| `orbit` | Cards circle the head, behind it on the far side | "all five", "these tools" |
| `spotlight` | The room drops to black, a glowing word behind the head | One punchy word |
| `checklist` | A Claude Code task card ticks each item as it's said | A spoken list |
| `browser-stack` | Browser windows pile up behind, then each gets "Passed" | Testing, "a bunch of" |
| `tier-list` | Split: a tier board above, the named item slams into its row | "Number three is…" |
| `chart-split` | Split: a bar chart above, the highlighted bars slam in | Comparing numbers |
| `snap` | A hard punch-in on the face, held to the end of the stretch | One word to hit hard |
| `push` | A slow push-in while the room goes soft and they stay sharp | A sincere or important line |
| `backdrop` | Any `/animate` animation becomes the room behind them (`animation`, `animationVars`) | A line the animation illustrates |
| `echo` | Keywords land huge behind the head as they're said (`phrases`, separated by a vertical bar) | Two or three key phrases |
| `strike` | A giant word behind them is crossed out, then replaced | "not X, but Y" |
| `pinned-comment` | The comment they're answering pins beside the head and types out | Answering a viewer; use the real comment |
| `pings` | Notifications stack around them, each on a cue word | A list of problems or wins |
| `freeze-mark` | The frame freezes, the room goes black and white, marker circles them with a caption | A self-aware aside |
| `b-roll-split` | Split: a screenshot in a browser window above (`image`, `url`) | Showing a site, an app or a result |

Choose `--from` and `--to` (2 to 6 seconds) from the word times, and `--at` on the word it should land on. Effects that tick or drop per item (checklist, browser-stack, echo, strike, pings) find their own cue words inside the window, so the window just has to contain them.

A split effect (tier-list, chart-split, b-roll-split) can start exactly on a jump cut: it hides the cut. For backdrop, `animate vars <animation>` lists what the animation takes; the stretch must give it at least its minimum build-up before the key word.

## 4. Get the content

Run `vfx vars <effect>`. Use their real words, names and numbers. Never invent a statistic, star count or view count; if a number is missing, ask or look it up and say where it came from. Write only what changes to a JSON file, for example `vfx-vars.json`.

## 5. Make it

```bash
vfx render <effect> --prep "<video>.vfx" --from <s> --to <s> --at <s> --vars vfx-vars.json --draft
```

The first render of a stretch cuts the speaker out of it (cached after that). Drop `--draft` for the final. The result is `<video>.vfx/<effect>-<from>.mp4` with their audio untouched.

Several effects across one video: write a plan and render it in one go.

```json
{ "prep": "my-video.vfx", "out": "my-video-vfx.mp4",
  "effects": [
    { "fx": "glass-widgets", "from": 0, "to": 4.8, "key": 2.0, "vars": {} },
    { "fx": "spotlight", "from": 7.0, "to": 10.4, "key": 8.55, "vars": { "word": "AI SLOP" } }
  ] }
```

```bash
vfx plan plan.json
```

Effects must not overlap in time.

## 6. Check it before handing it over

Don't report success from the command alone. Look at the frames:

```bash
node "{{PACK}}/shared/animate.mjs" sheet "<the mp4>" --times <a few times, including the --at moment>
```

Read the sheet image yourself. Check: nothing covers their face; things meant to be behind the head are behind it; text is readable; the moment lands on the word. Fix and re-render before showing them.

Tell them where the file is, and that the draft is theirs to approve before posting.
