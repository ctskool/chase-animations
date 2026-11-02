---
name: explain
description: Make a short vertical explainer video narrated in the member's own voice, from one sentence, with the Chase Animations pack. Use when someone types /explain, or asks for an explainer, a "how X works" video, a full-visual explanation, or a narrated 3D explainer reel.
argument-hint: how <thing> works
---

# /explain

Chase Animations pack. A 15 to 25 second, 9:16, dark cinematic explainer: real-feeling 3D scenes from a kit, captions two to four words at a time with the key word in a selection box, and an end card. The voice is the member's own recording.

Everything runs through one command:

```bash
node "{{PACK}}/shared/animate.mjs" explain <step>
```

Below, `animate` means `node "{{PACK}}/shared/animate.mjs"`. Work in the member's current folder.

Request: $ARGUMENTS

The flow has a break in the middle: you write the script, the member records it, then you build to their recording.

## 1. Start the folder

```bash
animate explain new "how solar panels make power"
```

This makes `explain/<slug>/script.json`. If `animate` says dependencies are missing, send them to `{{PACK}}/docs/INSTALL.md` and stop.

## 2. Research and check the facts

Use what you know, plus web search when you have it. Every claim in the script must be right and plainly worded. Hedge where the truth varies ("may", "about", "hundreds of"). Never invent a statistic. Put each fact you rely on, in one line, in `"facts"` in script.json, so the member can see why the script says what it says.

## 3. Write script.json

About 45 to 70 words, in four to six scenes. Short, punchy sentences a person would say out loud. Open with the hook; the last scene can be a tip, spoken over the end card.

```json
{
  "topic": "how solar panels make power",
  "title": "Solar panels",
  "subtitle": "how sunlight becomes power",
  "accent": "#FFB23F",
  "facts": ["Typical home panels convert about 20% of the sunlight that hits them into electricity."],
  "scenes": [
    { "text": "A solar [panel] turns [sunlight] straight into [electricity].",
      "visual": { "type": "hero", "object": "solar" } }
  ]
}
```

- `text` is what gets said and captioned. Put **one key word in brackets about every three words**, so every caption phrase has one: `[sunlight]`, `[one-in-a-million]`. That word gets the selection box. Mark the word that carries the meaning, not "the" or "is".
- `title` is the bold line on the end card, `subtitle` the smaller italic line under it.
- `accent` is the one warm or cool colour that glows through everything. Optional `"theme": {"bgCenter", "bgEdge", "ink", "muted"}`.
- Any `"on": "<word>"` inside a visual makes that thing happen when the word is said. So do the other cue names ending in `On`, such as `"landOn"`, `"pickOn"`, `"splitOn"`, `"depthOn"`, `"unlockOn"`, `"sumOn"`. The word must be in that scene's text.

Five complete, fact-checked examples in `{{PACK}}/explain-kit/examples/`: `next-word.json` (how AI picks its next word), `ai-training.json` (how AI learns from data), `face-unlock.json`, `solar-panel.json` and `fiber-internet.json`. Numbers that are only illustrative are tagged "example" on screen (`rank` with `"example": true`, the `network` meter).

## 4. Pick a visual for each scene

Pick from the kit. `{{PACK}}/explain-kit/kit.json` lists every parameter.

| Type | Use it for | Key parameters |
|---|---|---|
| `hero` | The thing itself: the opening shot | `object`, `options`, `charger`, `heat`, `labels` |
| `flow` | Something moving between parts: ions, electrons, data, heat, water, a signal | `nodes` (2 or 3, each with `label` and `object`), `particle`, `direction` forth, back or both, `reverseOn`, `separator`, `path` |
| `stack` | What it's made of, in layers, top first: a solar cell, a screen, skin, soil, a road | `layers` (2 to 5: `label`, `look` glass, metal, grid, crust, solid, porous, film, layers, dots, plus `glow`, `grow`, `particles`), `prop` finger or stylus, `touchOn`, `rain` (particles falling into a layer, with `release` freeing others) |
| `tokens` | Text as glowing chips: a sentence splitting into tokens, or new tokens dropping onto the end | `sentence` (or `tokens`), `mode` split or append, `splitOn`, `next`, `stampOn`, `stamp2On` |
| `network` | A layered model: signals sweeping through it, or training rounds where guesses flash red or green and the weights shift | `mode` forward or train, `inputs`, `stream`, `output`, `rounds`, `outcome`, `meter` (always tagged "example"), `labels` |
| `rank` | A short ranked list, top choice first: probabilities, top picks, a league table | `items` (`label`, `value`), `unit`, `example`, `growOn`, `pickOn` |
| `scan` | Measuring a face (or anything) in 3D: dots spray on, a depth map lifts, a match, a padlock opens | `show` (dots, depth, match, unlock), `dotsOn`, `depthOn`, `matchOn`, `unlockOn`, `labels` |
| `fiber` | Light in glass: strands carrying pulses, the layers of a strand, a pulse zig-zagging down the core | `view` overview, layers or bounce, `layers` (core, cladding, coating labels), `color` |
| `burst` | Failure, wear, breaking, overload | `object` (a slab: battery, phone, card, chip, panel, box), `beatOn` |
| `compare` | Two states side by side: before and after | `left` and `right` (`label`, `value`, `fill` 0 to 1, `worn`), `fillOn` |
| `wave` | Sound, radio, light, vibration, cancelling | `waves` (two, the second with `invert`), `mode` cancel, add or single, `sumOn`, `result` |
| `number` | One stat that lands, at its true value on its word (it never counts up) | `value`, `label`, `landOn` |
| `title` | The end card, last scene only. Added for you if the script has none | `object` |
| `custom` | Nothing fits | `module` |

Objects: `phone`, `laptop`, `solar` (a panel on a stand), `bulb`, `chip`, `battery`, `headphones`, `speaker`, `mic`, `card`, `panel`, `box`, `cylinder`, `sphere`, plus `finger` and `stylus` as props. Flow nodes also take `electrode`. Any object takes a word as a chip: see `chips.js`.

Choose for the story, not for variety: one visual per idea, and a burst or number only on the beat that earns it. Don't put a `number` label that repeats the caption word for word.

**Custom scene**, only when no kit scene can show the idea: copy `{{PACK}}/explain-kit/scenes/custom-template.js` into the explainer folder, rename it, and use `{ "type": "custom", "module": "my-scene.js" }`. The template explains the contract. It must stay deterministic: everything from the time it's given, `kit.rng()` for randomness, no clocks, no network.

## 5. Check it and hand it over to record

```bash
animate explain check explain/<slug>
```

Fix anything it reports. Notes about phrases without a key word mean you should bracket another word. It writes `script.md`, the words alone.

**Get the script approved before anything else.** Show the member the script, the scene each line goes with, and the facts behind it. Ask whether they're happy with it or want changes. Revise and show it again until they say it's good. Nothing gets recorded or built until then.

**Optional preview, only after approval.** You may offer to show them the video before they record. If they want it:

```bash
animate explain render explain/<slug> --preview --draft
```

It times every word to a natural reading pace (about 2.75 words a second, with pauses at commas, full stops and scene changes) and renders `<slug>-preview-draft.mp4`, **silent**. Say plainly that it has no sound and that the real timing will follow their recording. Use it to settle visuals and wording; if they change the script, check it and preview again. A preview never replaces the recording, and you never add a voice to it.

Once it's approved, ask them to record it **in one take, in their own voice**, on a phone or mic, at a natural, slightly brisk pace. Any audio or video file works. A slip or a restart is fine: they should just carry on. Ask them for the file's path when they're done.

Then stop and wait for the recording. Never make a stand-in voice: the video is always narrated by the member.

## 6. Build to their recording

```bash
animate explain build explain/<slug> --audio "<their file>"
```

It transcribes locally, lines the speech up with the script, and times every scene and caption word to it. This replaces any preview timing completely; after it, plain `build` and `render` keep using the recording. Read what it prints:

- `Alignment: good` — carry on.
- `poor` — timing may be off where it says. Look at the sheet in step 7; if a scene is wrong, the take probably strays from the script there. Update `text` to match what they said and build again, or ask for that line again.
- `failed` — the recording doesn't match the script (wrong file, or a different script). It stops. Find out which, don't force it.
- "said but not in the script" lists ad-libs. They get no caption. If one matters, add it to `text`.

## 7. Render and look at it

```bash
animate explain render explain/<slug>
```

Add `--draft` while iterating. It writes `<slug>.mp4` and `<slug>-sheet.jpg` in the folder. Read the sheet. Then pull full-size frames at the moments that matter and look at those too:

```bash
animate sheet explain/<slug>/<slug>.mp4 --times <first caption>,<each scene start + 0.3>,<the burst or number beat>,<end card>
```

Check: captions read in the upper third and never cover the subject; the box sits on the right word; labels don't collide; nothing clips; the number and facts are right; the end card spells the title right.

## 8. Hand over

Give the video path, the sheet, and anything you chose for them. To change words, edit script.json and build again; to change only the look, render again. The recording is remembered after the first build.
