# Cutaway

A solid 3D object turns in a dark studio. A blade of light crosses it, a section lifts away and five solid layers are labelled one by one, on leader lines, down to the core. It works for any topic that has layers: a brand, a business, a market, a skill, an idea or an actual planet.

**Key moment:** the camera arrives at the centre, the last layer label lands and the core ignites. On that frame the hero line stamps in, the object punches and a burst of light leaves the core. The light then ripples out through every ring in turn, and each row of text flashes as its ring is hit.

## Suits

- "What's underneath" explanations: what a brand, habit or company is really made of
- Anything that has a surface and a hidden centre
- Peeling a topic back layer by layer to land one idea

## Doesn't suit

- More or fewer than five layers
- A sequence of steps, which reads better on `timeline-3d` or `isometric-flow`
- Taking a real product apart, which is what `exploded-teardown` is for
- Long sentences as labels

## What to change

Run `animate vars cutaway` for the full list.

| Variables | What they are |
|---|---|
| `object` | `planet`, `capsule` or `gem`, all built by the same section system |
| `title` | Heading. On `full` it leaves as the camera pushes in; on `top` and `overlay` it stays |
| `layer1` to `layer5` | The labels, from the outer shell to the core |
| `finalLabel` | The hero line. It picks one, two or three lines, whichever sets biggest |
| `accent` | The blade of light, the glow in the seams, the core and the burst |
| `layer1Color` to `layer4Color` | Polished shell, brushed metal, ceramic and machined rings |
| `layer5Color` | The hot centre of the core |
| `ink`, `muted` | Text and leader lines |
| `bgCenter`, `bgEdge` | The studio background |
| `holdTurn` | How far the object turns during the hold, in degrees per second |
| `keyPunch`, `glow` | The punch at the key moment and the overall bloom |
| `shutterAngle`, `temporalSamples` | Motion blur on the lift and the punch |
| `overlayPosition` | `top` or `bottom` |

- Labels set at about 70px on `full`. Each row fits on its own, so a long label shrinks without touching the others. 23 characters still sets at about 55px or more on `full`. Long labels push the rules outward, so the leaders sit closer together.
- The default brand content is an illustration, not a claim. Nothing here is a statistic.
- The planet is a machined sphere with an engraved graticule. To make it read as the Earth, use the words and colours, for example `layer1` to `layer5` Crust, Upper mantle, Lower mantle, Outer core, Inner core, with the colours to match.
- Never fade a label on. Text rises out from behind its rule, lines draw and the hero stamps.
- Never add a sixth layer by editing the colours. The geometry is fixed at five.

## How the section is built

Each object is five nested profiles in the radius and height half-plane. Each layer is revolved around the upright axis, and three capped faces close it: two walls and a floor. A matching piece fills the opening and is the part that lifts away. There are no stencil tricks and no back faces on show, so every cut is solid.

Inner layers stand slightly proud of the ones around them, in steps. That shows a strip of each layer's own outer surface, and it gives the section real depth. The core stays whole and bulges out into the corner. In the `gem` it is a true ball, so it shades as cleanly as the planet's.

Materials and fine detail (tick marks, engraved rings, brushed grain, machined ribs) are worked out in the fragment shader in world units. They stay sharp when the camera arrives at the core.

## Timing

| | |
|---|---|
| Default opaque shot | 5.9 seconds |
| Key moment | 4.4 seconds |
| Minimum build-up | 2.6 seconds |
| Hold after key moment | 1.5 seconds |
| Transparent exit | 0.36 seconds |

At the default timing the blade enters the frame at 0.12s and crosses the object between 0.62s and 1.14s, leaving the lit seam and sparks behind it. The section starts to lift at 1.2s and is out of frame by 2.2s. Labels 1 to 4 land at about 1.96s, 2.52s, 3.08s and 3.64s, and each gives the camera a small push. From 3.68s a charge of light runs inward through the rings. Label 5, the ignition and the hero all land on the key frame.

The build-up scales to fit `--key-at`, and the key moment lands on one exact frame. The motion blur never reaches across it, so the frame before is clean.

During the hold the object keeps turning slowly, the core pulses, comets of light run along the inlays, a soft band of light crosses the cut faces and embers drift out of the core.

## Outputs

`full` puts the object in the upper part, with the five rows stacked beneath it and the hero line under them, inside the 230px top and 300px bottom margins. The rows land large, over the dark lower half of the object, and shrink together only if a long hero line needs more room, so the hero stays the biggest thing on screen. The object itself is allowed to fill the frame above the safe area, because no text sits there once the title has left.

`top` puts the object on the left and the title and rows in a right-hand column. The hero line runs across the bottom. It stays clean down to `--height 720`.

`overlay` uses the same arrangement in a 1000px card. An iris opens the card from the object and closes it on the core before the transparent exit ends.

Every leader is a ray out of the visible core, ending on a point found by walking that ray over the key frame until it reaches the layer's own cut face. Rays from one point can't cross, and each one crosses only the rings outside its own, by the shortest path.

The hero is sized for its peak stamp scale, so it stays inside the side margins on the key frame.

Type stays at least 40px on `full` and 32px on `top` and `overlay`. Long titles wrap to a second line and the rows make room for them.
