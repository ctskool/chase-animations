# Screen zoom

An app window floats on a soft backdrop. The cursor glides to one button on a curve, the camera follows and zooms in with real motion blur, and the button clicks. The label flips, a progress bar runs, and a step pill pops in.

**Key moment:** the cursor clicks the button.

## Suits

- Tutorials: "click here, then here"
- Product and SaaS demos
- "How I did it" videos, where one click is the whole point

## Doesn't suit

- Several clicks in a row. Use one block per click
- Showing a real screen recording. This shows one still screen

## Three ways to show your screen

**1. Recreate it as HTML (best).** Text stays sharp at any zoom. Write the inside of the window to a file, mark the button with `data-target`, and pass it in:

```json
{ "screenHtml": "screen.html", "stepLabel": "Send it" }
```

```html
<div style="flex:1;display:flex;align-items:center;justify-content:center;background:#14151a">
  <button data-target style="position:relative;border:0;border-radius:14px;padding:20px 44px;font:600 28px Inter;color:#fff;background:#B4380F">Send invoice</button>
</div>
```

The window's body is a flex row, so give your outer element `flex:1`. Inter and JetBrains Mono are available. The button presses when clicked, but the label flip only happens on the built-in screen.

**2. Your own screenshot.** Quick, but use one at least 1900px wide or it softens at 2x zoom. Give the target's position as a percentage of the image:

```json
{ "screenImage": "shot.png", "targetX": 80, "targetY": 12 }
```

There's no button to press, so the click shows as the cursor dip and the white ring.

**3. The built-in window.** A generic dark video app. Change the labels and you're done.

Leave real logos, other people's names and private files off the screen.

## What to change

Run `animate vars screen-zoom` for the full list.

| Variables | What they are |
|---|---|
| `appName`, `projectName`, `subtitle`, `side1` to `side3`, `stat1Label` and so on | Text in the built-in window |
| `buttonLabel`, `doneLabel` | The button before and after the click |
| `stepNumber`, `stepLabel` | The pill that pops in last |
| `zoom` | How far the camera goes in. 2 by default |
| `accent`, `playhead`, `windowColor`, `backdropA`, `backdropB`, `backdropC` | Colours |
| `overlayPosition` | `top` or `bottom`, for the overlay output |

White text needs a dark enough `accent`. The default passes contrast checks, but a bright colour may not.

## Timing

| | |
|---|---|
| Build-up before the key moment | 1.75s by default, 1s at the shortest |
| After the key moment | 2s, then it closes in a circle in 0.32s when placed in a video |

## Outputs

`full` uses a tall window, `top` a wider one. `overlay` is a rounded card, so the zoom happens inside the card and your face stays visible.

The blur layer uses thin stacked copies of the window, so a soft gradient can show faint bands during the fastest frames of the zoom. Flat colours stay clean, which is why the built-in window uses them.
