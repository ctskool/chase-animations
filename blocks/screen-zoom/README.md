# Screen zoom

A compact dark app floats on a mint backdrop. The title and Publish controls read immediately. The cursor leads a short zoom, the camera settles, and the button presses. Destinations complete under Publishing; the final check reveals Published.

**Key moment:** the cursor clicks the button.

## Suits

- Tutorials with one important click
- Product and SaaS demos
- “How I did it” videos

## Doesn't suit

- Several clicks in a row. Use one block per click
- Playing a screen recording. This block presents one screen and animates the camera and click

## Three ways to show your screen

**1. Recreate it as HTML (best).** The interface remains sharp through the zoom. Mark the target button with `data-target`:

```json
{ "screenHtml": "screen.html", "stepLabel": "Send it" }
```

```html
<div style="flex:1;display:flex;align-items:center;justify-content:center;background:#1B1C20">
  <button data-target style="position:relative;border:0;border-radius:14px;padding:24px 44px;font:600 40px Inter;color:#fff;background:#2563EB">Send invoice</button>
</div>
```

The window body is a flex row, so give the outer element `flex:1`. Inter and JetBrains Mono are available. Custom buttons press; the automatic labels and destination checks belong to the built-in screen.

**2. Your own screenshot.** Use a high-resolution image and supply the target position as percentages:

```json
{ "screenImage": "shot.png", "targetX": 80, "targetY": 12 }
```

Screenshots can soften when enlarged. Use HTML for the sharpest result. Image targets receive the cursor dip and click rings.

**3. The built-in window.** Change the sample labels. A short preview sits beside a larger publish panel. Website, Newsletter and Community remain visible together in the close shot.

Leave real logos, other people's names and private files off the screen. The sample interface illustrates an animation, not a working publishing service.

## What to change

Run `animate vars screen-zoom` for the full list.

| Variables | What they are |
|---|---|
| `appName`, `projectName`, `subtitle`, `side1` to `side3` | App and navigation text |
| `stat1Label`, `stat1Value`, `stat2Label`, `stat2Value`, `timelineTimecode` | Supporting screen details |
| `buttonLabel`, `pendingLabel`, `doneLabel` | Publish, Publishing and Published states |
| `stepNumber`, `stepLabel` | Large instruction pill beneath the destinations |
| `target1` to `target3` | Destinations that complete after the click |
| `zoom` | Requested magnification; each output limits it to preserve breathing room |
| `accent`, `playhead` | Action colours |
| `windowColor`, `chromeColor`, `panelColor`, `lineColor`, `textColor`, `mutedColor`, `previewColor` | Interface palette |
| `backdropA`, `backdropB`, `backdropC` | Mint backdrop |
| `overlayPosition` | Overlay placement: `top` or `bottom` |

Keep all three button labels short and use an accent dark enough for white text.

## Timing

| | |
|---|---|
| Build-up | 1.45s by default; minimum 1s |
| Cursor approach | Lands around 0.75s at default timing |
| Camera | Settles around 0.90s, before the click |
| Hold | 2.3s |
| Transparent exit | Circle closes in 0.32s |

The click changes Publish to Publishing. Three destination checks follow; the final check reveals Published 0.8s after the click at default timing. The larger instruction pill pops in after the click ripple.

The completed state remains readable for over a second. Small check halos, cursor movement, the playhead and a slow backdrop drift keep the hold alive. The camera and reading text stay still.

## Outputs

`full` uses a compact window with a large title, wider controls and a gentler 2.1× default zoom. `top` and `overlay` have separate window, control, row and pill sizes.

The close shot reserves room for all three destinations and the instruction pill. Backdrop remains around the top-right corner. Shorter stages reduce magnification to keep the action together.

Motion blur covers the brief camera move and cursor approach. Both settle before the click. The button has no progress underline; completion is shown by its label and the destination checks.

Grain stays on the backdrop. The interface uses clean, flat surfaces.