# Oscilloscope

A green beam locks into a sine, folds into a turning figure, contracts and rings down. Your words rise from the zero line left to right. Open letter shapes, a clear word gap and tight phosphor glow keep the phrase readable on a phone.

**Key moment:** the last letter reaches its single overshoot as the complete phrase takes a white-core strike. It settles within 0.12 seconds. The words then stay fixed while a brighter beam section travels through them.

## Suits

- Tech, music and data videos
- Launches and reveals
- An “it all clicked” moment
- A short phrase over a talking head

## Doesn't suit

- Long sentences or paragraphs
- Lowercase lettering or complex punctuation
- Measured audio or scientific signal plots

## What to change

Run `animate vars oscilloscope` for the full list.

| Variables | What they are |
|---|---|
| `words` | Your phrase; 6–12 characters gives the strongest result |
| `readout`, `readoutSize`, `readoutColor` | One optional short instrument readout; empty by default |
| `baseline` | Signal zero line, where the letters stand |
| `letterHeight` | Requested letter height for the full output |
| `topLetterHeight`, `overlayLetterHeight` | Independent requested heights for the compact outputs |
| `letterSpacing` | Clearance between letters |
| `wordSpacing` | Extra clearance between words |
| `overshoot` | Each letter's single opening overshoot |
| `keyPunch` | Beam weight and screen exposure on the key strike |
| `traceInset` | Side clearance for lettering and the figure |
| `waveAmplitude`, `waveCycles` | Opening sine shape |
| `figureWidth`, `figureHeight` | Requested size of the turning figure |
| `persistenceFrames`, `persistenceStrength` | Previous-frame trails through the signal and contraction |
| `strokeWidth`, `glowStrength` | Beam weight and tight halo |
| `scanSpeed` | Moving energy through the held trace |
| `gridSpacing`, `grainOpacity`, `seed` | Square divisions and fine screen grain |
| `screen`, `tubeFace`, `graticule`, `phosphor`, `beamCore` | Main palette |
| `overlayPosition` | `top` or `bottom` for the overlay output |

- Words use geometric capitals A–Z, digits 0–9 and spaces. Accents are simplified; other punctuation becomes spaces.
- The complete phrase stays on one line. Keep the copy short.
- Letter height fits the phrase width as well as the safe area, preserving open counters.
- Full requests 216px letter height; top requests 208px and overlay requests 192px. Proportional fitting may reduce these.
- Each glyph remains attached to the same continuous trace. Branches retrace their own strokes.
- Letters rise left to right, overshoot once and settle. The key strike adds brightness and beam weight.
- The figure uses the whole trace, with no bright horizontal line through its center.
- The figure contracts before releasing into a short damped wave. That wave swings through zero once.
- Persistence clears before the letters become readable.
- The default beam is 11px wide, with a small lasting emphasis after the strike.
- The optional readout enters after the last letter settles. Keep it short and different from the main phrase.
- Never use a broad neon-sign halo; keep the core almost white and the green glow close.
- Never add a screen border or corner labels.
- Never introduce letters separately from the trace.
- Never add a second readout line.

## Timing

| | |
|---|---|
| Build-up before the key moment | 3.5s by default; 2.4s minimum |
| Hold | 1.5s by default |
| Transparent exit | Closes onto the signal center in 0.3s |

At the default 30fps:

| Frames | Motion |
|---|---|
| 0–13 | Scrolling sine catches the trigger |
| 14–21 | Locked sine keeps moving slightly |
| 22–33 | The entire beam folds into a clean 2:3 figure |
| 34–39 | Figure turns briefly at full size |
| 40–59 | Lobes contract inward while continuing to turn |
| 60–71 | Contracted figure unfurls into a damped wave |
| 72–78 | Wave swings through zero and finishes ringing down |
| 79–82 | Trace settles onto the letter baseline |
| 83–104 | Letters rise left to right, each with one controlled overshoot |
| 105 | Last letter reaches its peak; complete phrase takes the white-core strike |
| 106–109 | Last letter settles into its final height |
| 110–149 | Words stay fixed while beam energy travels through them |

The contraction leads directly into the lettering sequence. No broad figure hold or second scale bounce interrupts the reveal.

Changing the key time stretches the build-up together. Letter settlement after the key, the held beam motion and the transparent exit use real seconds. Keep the hold at least 1.5 seconds; use a longer hold for more reading time.

## Outputs

`full` uses the tall opening wave and large figure. The phrase spans the available width with moderate letter height, standing above the zero line. Important content stays clear of the top 230px and bottom 300px.

`top` has its own letter height, proportion limit, wave amplitude and figure proportions. It keeps the counters open across the wider composition.

`overlay` uses a compact 720px-high composition with its own lettering proportions. The screen feathers on all four edges, while the phrase stays inside the solid part of the mask. A shutter opens from the signal center and closes fully before the last frame.

All three outputs fit the full letter overshoot inside their safe area. The sine and final baseline continue off both screen edges; the settled figure contains only its curves.