---
name: animate
description: Make a finished animation for a vertical video and land it on a spoken word, from the Chase Animations pack. Use when someone wants a head-to-head comparison, an isometric process diagram, a screen-recording zoom, or asks for an animation, motion graphic or explainer graphic in a short, reel or TikTok.
argument-hint: [animation] [video] [what it should say]
---

# /animate

Chase Animations pack. Everything runs through one command:

```bash
node "{{PACK}}/shared/animate.mjs" <command>
```

Below, `animate` means that command. Run `animate` with no arguments to see every option. Work in the member's current folder, so finished files land in `./renders`.

Request: $ARGUMENTS

## 1. Check setup

Run `animate list`. If it says dependencies are missing, tell the member to follow `{{PACK}}/docs/INSTALL.md`, and stop.

## 2. Pick the animation

If they haven't said which, run `animate list`, show them the options that fit what they're making, and ask.

Each block's README (`{{PACK}}/blocks/<name>/README.md`) says what it suits, what it doesn't and how to feed it.

## 3. Get the content

Run `animate vars <name>` for every editable field and its default.

- Use the member's real words and numbers. Never invent a statistic, price or claim to fill a row. If a value is missing, ask.
- Keep labels short: one line each.
- Write the values to `animate-vars.json` in the current folder. Only include what changes from the defaults. Variables are flat, for example `{"nameA": "Cursor", "nameB": "Claude Code", "row1Label": "Price"}`.

For `screen-zoom`, three choices of screen, best first:

1. **Recreate their app as HTML.** Write the screen to `screen.html`, put `data-target` on the button, and pass `"screenHtml": "screen.html"`. Text stays sharp at any zoom. No real logos or other people's files.
2. **Their own screenshot.** Pass `"screenImage": "shot.png"` plus `targetX` and `targetY` as percentages. Use at least 2400px wide or it softens at the default zoom.
3. **The built-in window.** Change the labels only.

## 4. Pick the output

| Output | Size | Use it for |
|---|---|---|
| `full` | 1080x1920 | Full-screen cutaway |
| `top` | 1080x960 | Top half of a split-screen, speaker below |
| `overlay` | 1080x1920, transparent | Floating over the speaker, top or bottom (`overlayPosition`) |

Default to `top` for a talking-head short. Use `overlay` when the speaker must stay full screen.

## 5. Make it

**They gave a video and a word:** the key moment lands on that word.

```bash
animate words "<video>" --find "<word>"
animate place <name> --video "<video>" --word "<word>" --output top --vars animate-vars.json
```

If the word is said more than once, show them the numbered list and ask which, then add `--occurrence <n>`. If the word isn't found, it may be misheard: run `animate words "<video>"`, find what it was heard as, and use that.

For `top` on a full-frame talking head, add `--speaker-y <0-1>`, the height of their face in the frame, so their face stays visible in the bottom half. Skip it on footage that's already split-screen.

**No video:** render a clip for their editor.

```bash
animate render <name> --output all --vars animate-vars.json
```

`full` and `top` come out as `.mp4`. `overlay` comes out as `.mov` with transparency.

Render one at a time. Use `--draft` while changing wording, and drop it for the final.

## 6. Check it before handing it over

Don't report success from the command alone. Look at the frames:

```bash
animate sheet "<file>" --times <t1>,<t2>,<t3>
```

Read the image it prints. Check the key frame, a frame just before it and the last frame. Look for clipped text, overflowing labels and a wrong number. On a placed video, check the key moment sits on the word. If it's slightly off, re-run with `--nudge -0.05` or similar.

## 7. Hand over

Give them the file path, the key moment's time and anything you chose for them. If they want more changes, change `animate-vars.json` and re-run.
