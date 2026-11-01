# Screen zoom

A large dark editing app fills the opening width. The cursor leads a smooth push toward the complete publish panel. The surrounding interface clears before the crop reaches any words.

Published lands in green with a button pop, a white burst and the final destination check. A large instruction pill appears clearly below the framed panel.

**Key moment:** Published turns green as the third destination checks.

## Suits

- Tutorials with one important click
- Product and SaaS demos
- “How I did it” videos

## Doesn't suit

- Several clicks in a row. Use one block per click
- Playing a screen recording. This block presents one screen and animates its framing and click

## Three ways to show your screen

**1. Recreate it as HTML (best).** Live interface text stays sharp. Put `data-target` on the button and `data-focus` on the complete panel that must remain visible:

```json
{ "screenHtml": "screen.html", "stepLabel": "Send it" }
```

```html
<div style="flex:1;display:grid;place-items:center;background:#1B1C20">
  <section data-focus style="padding:32px;border-radius:22px;background:#26272C">
    <button data-target style="position:relative;border:0;border-radius:14px;padding:28px 44px;font:600 48px Inter;color:#fff;background:#2563EB">Send invoice</button>
  </section>
</div>
```

Inter and JetBrains Mono are available. The camera preserves the complete `data-focus` panel. Without that marker, it uses the button's parent.

Custom buttons receive the hover, press and release. The automatic Publishing, Published and destination checks belong to the built-in screen.

**2. Your own screenshot.** Supply the target position as percentages:

```json
{ "screenImage": "shot.png", "targetX": 80, "targetY": 12 }
```

The screenshot stays whole and is never enlarged. It receives the cursor and click rings. Use HTML for the full zoom treatment and crisp enlarged text.

**3. The built-in window.** Change the sample labels. The opening includes navigation, a preview, project details and a large publish panel. The close shot isolates that entire panel with a narrow dark surround.

The sample interface illustrates an animation, not a working publishing service. Use fictional names and keep private files and real logos off screen.

## What to change

Run `animate vars screen-zoom` for the full list.

| Variables | What they are |
|---|---|
| `appName`, `projectName`, `subtitle`, `side1` to `side3` | Opening app and navigation text |
| `stat1Label`, `stat1Value`, `stat2Label`, `stat2Value`, `timelineTimecode` | Supporting screen details |
| `buttonLabel`, `pendingLabel`, `doneLabel` | Publish, Publishing and Published states |
| `target1` to `target3` | Three destinations |
| `stepNumber`, `stepLabel` | Instruction pill below the complete panel |
| `zoom` | Requested magnification; framing limits it to keep the panel and pill visible |
| `accent`, `successColor`, `buttonTextColor` | Action and completion colours |
| `stepBackground`, `stepInk` | Instruction pill and cursor colours |
| `playhead` | Timeline marker |
| `windowColor`, `chromeColor`, `panelColor`, `lineColor`, `textColor`, `mutedColor`, `previewColor` | Interface palette |
| `backdropA`, `backdropB`, `backdropC`, `grainOpacity` | Mint backdrop and grain |
| `overlayPosition` | Overlay placement: `top` or `bottom` |

Use short button and destination labels. Keep the step instruction to a short phrase. Choose button colours with enough contrast for the button text.

## Timing

| | |
|---|---|
| Build-up | 1.45s by default; minimum 1s |
| Cursor approach | Lands around 0.78s at default timing |
| Camera | Settles around 1.02s without overshoot |
| Click | Around 1.22s; the button presses and shows Publishing |
| Destination checks | Around 1.28s, 1.36s and 1.45s |
| Key moment | Published, green completion and the third check at 1.45s |
| Hold | 1.6s |
| Transparent exit | Circle closes in 0.3s |

The completion burst begins at the key moment. The instruction pill pops in last, followed by its number.

After the short reaction, the reading text and camera stay fixed. A slow highlight travels around the green panel border, the backdrop drifts, and the cursor retreats from the button. The completed state remains readable for over a second without a long repeated ending.

## Outputs

`full` uses a tall app window with large controls and supporting details. `top` uses a shorter editing layout. `overlay` has its own window, row and caption sizes for the 860px card.

Every close shot retains the complete publish panel, its rounded surround and mint backdrop. The caption sits below the surround with a measured gap. There is no unused dark shelf under the checklist.

Short stages remove supporting sections before reducing the space reserved for the action. Magnification adjusts to keep all destinations and the caption visible.

Camera and cursor motion use blur during the approach. The interface is live DOM, with flat clean surfaces and grain confined to the backdrop.