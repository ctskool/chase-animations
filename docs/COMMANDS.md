# Commands

Claude Code runs these for you through `/animate`. To run them yourself, use a terminal in the pack's folder, or anywhere with the full path to `shared/animate.mjs`. Finished files go to `./renders` unless you pass `--out`.

## See what's available

```bash
node shared/animate.mjs list
```

```bash
node shared/animate.mjs vars head-to-head
```

## Edit the content

Put your changes in a JSON file. Leave out anything you're happy with.

```json
{
  "nameA": "Cursor",
  "nameB": "Claude Code",
  "subtitle": "Six months on the same codebase",
  "row4Label": "Time saved",
  "row4A": "12%",
  "row4B": "38%",
  "row4Winner": "b",
  "colorB": "#E8743B"
}
```

Pass it with `--vars my-vars.json`, or change one thing at a time with `--set nameA=Cursor`.

## Use a real route

`route-map` can draw a real trip on real streets. No API key needed.

```bash
node shared/animate.mjs route --from "Willis Tower, Chicago" --to "Navy Pier, Chicago"
```

```bash
node shared/animate.mjs render route-map --output all --vars animate-vars.json
```

Add `--mode walk` or `--mode bike`, force stops with `--via "<place>"`, or pass your exact route with `--track run.gpx`. Use `--minutes <n>` when you know the real time. [The block's README](../blocks/route-map/README.md) has the details.

`campaign-map` works the same way for sweeping arrows between real places. No routing, just bold arcs across a real map:

```bash
node shared/animate.mjs campaign --move "Lisbon > Madrid > Paris > Berlin"
```

```bash
node shared/animate.mjs render campaign-map --output all --vars animate-vars.json
```

[The block's README](../blocks/campaign-map/README.md) has the details, including `--stage` for dates and `(east)` or `(west)` to choose the way round the world.

## Render a clip for your editor

```bash
node shared/animate.mjs render head-to-head --output all --vars my-vars.json
```

`full` and `top` make an `.mp4`. `overlay` makes a transparent `.mov` (ProRes 4444). Add `--format webm` for transparent WebM. Add `--alpha` to give `full` or `top` a transparent exit, as `.mov`, so your own footage shows as it leaves.

## Land it on a word in your video

```bash
node shared/animate.mjs place head-to-head --video my-video.mp4 --word "cheaper" --output top --vars my-vars.json
```

This transcribes the video, finds the word, renders the block so its key moment lands on that word, and writes `renders/my-video-head-to-head-top.mp4` with your audio untouched.

| Option | What it does |
|---|---|
| `--word "<word or phrase>"` | The spoken word to land on |
| `--occurrence <n>` | Which one, when it's said more than once |
| `--at <seconds>` | Use a time instead of a word |
| `--nudge <seconds>` | Move the key moment, for example `--nudge -0.05` |
| `--key-at <seconds>` | How much build-up comes before the key moment |
| `--hold <seconds>` | How long it stays after the key moment |
| `--speaker-y <0-1>` | `top` only. On a full-frame talking head, keeps this height of your video visible in the bottom half. Use about `0.4` |
| `--height <px>` | `top` only. Match your split-screen seam, for example `--height 994` |
| `--transcript <file>` | Use your own `.json`, `.srt` or `.vtt` transcript |
| `--language <code>` | Language of the video, for example `es` |

If a word comes early, the build-up shortens so the key moment still lands on it. If it comes late, the hold shortens so the block ends before the video does. Either way the command tells you.

### How accurate is it?

When the word follows a pause, the pack reads the true start from the audio. In the middle of a sentence it uses the transcript's time, which is good to about 0.1s, and the command says which one it used. Check the result and use `--nudge` if you want it tighter.

## Check a video by eye

```bash
node shared/animate.mjs sheet renders/my-video-head-to-head-top.mp4 --times 12.4,12.9,13.5
```

It makes a contact sheet image with those frames.

## Edit by hand in the browser

```bash
node shared/animate.mjs preview head-to-head --output top --vars my-vars.json
```

This opens HyperFrames Studio, where you can scrub the timeline and click things to change them.

## Check a block

```bash
node shared/animate.mjs check head-to-head --vars my-vars.json
```

This runs HyperFrames' lint, layout and contrast checks on all three outputs.

## Make an explainer

`/explain` runs these for you. To run them yourself:

```bash
node shared/animate.mjs explain new "how solar panels make power"
```

This makes `explain/<slug>/script.json`. Write the script in it. The five examples in `explain-kit/examples/` show the format, and [the skill](../skills/explain/SKILL.md) explains every scene type.

```bash
node shared/animate.mjs explain check explain/solar-panels-make-power
```

This checks the script and writes `script.md`, just the words to record.

```bash
node shared/animate.mjs explain render explain/solar-panels-make-power --preview
```

This is an optional silent preview, timed to a natural reading pace.

```bash
node shared/animate.mjs explain build explain/solar-panels-make-power --audio my-take.m4a
```

This lines your recording up with the script and assembles the video. It tells you if the recording doesn't match the script.

```bash
node shared/animate.mjs explain render explain/solar-panels-make-power
```

This renders the finished video and a contact sheet to check by eye.
