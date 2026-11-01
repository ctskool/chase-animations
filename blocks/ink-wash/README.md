# Ink Wash

Large upright lettering and a textured red sun open on warm rice paper. Three mountain washes spread beneath clear title silhouettes. A weathered cliff and pine frame a solitary rower crossing into open water.

The default landscape and wording are fictional.

**Key moment:** the boat completes its arrival and driving oar stroke. A darker water stroke finishes beneath the hull, ripples open at the blade, and a small textured red seal stamps last. The wake remains as the wet ink dries.

## Suits

- Calm openings and chapter cards
- Travel, food and culture stories
- A pause before a story changes direction

## Doesn't suit

- Statistics, comparisons or dense explanations
- Long titles or paragraphs
- Fast, aggressive announcements

## What to change

Run `animate vars ink-wash` for the full list.

| Variables | What they are |
|---|---|
| `title` | Upright lettering, read down the first column and then the second |
| `subtitle` | The larger italic line above the sun |
| `sealInitials` | One or two paper-coloured letters carved into the red impression |
| `chapter` | An optional short vertical line at the outer right edge |
| `paper`, `ink`, `red` | Paper, black pigment and the single accent colour |
| `sunX`, `sunY`, `sunDiameter` | Sun placement and size |
| `titleX`, `titleY`, `titleSize` | Title placement and maximum letter size |
| `subtitleX`, `subtitleSize` | Italic line left position and letter size |
| `sealX`, `sealY`, `sealSize` | Small seal placement and size |
| `landscapeTop`, `landscapeBottom` | The landscape's vertical span |
| `cliffScale` | Cliff and pine size together |
| `boatScale`, `boatDrift` | Rower size and continuing movement after arrival |
| `washStrength` | Mountain pigment strength |
| `paperTexture`, `seed` | Fibre strength and repeatable variation |
| `overlayPosition` | `top` or `bottom` for the overlay output |

Use one or two short title words, ideally five or six letters each. Keep the subtitle brief and the seal to one or two initials. Shorten copy before reducing type size.

Placement controls use portrait reference coordinates. Each compact output arranges the painting separately. The mountain shoulders bend beneath the finished title, leaving open paper around its lower letters.

The seal is a small, nearly upright impression among the lower mountain washes. Keep it smaller than the sun. Red belongs on the sun, seal and subtitle square.

Never use opacity fades to reveal the painting, digital gradients, drop shadows, glow, a second accent colour, or a horizontal title across the landscape.

## Timing

| | |
|---|---|
| Build-up | About 3.97s by default; 2.4s minimum |
| Hold | About 1.03s by default |
| Opaque duration | 5s by default |
| Transparent exit | Ragged paper wipe in 0.3s |

The complete title, visible sun and pale far peaks establish the opening frame. The title settles during frames 0–8. The sun blooms to 110% and settles during frames 0–13. The enlarged italic line brushes on during frames 3–12.

At the default timing and 30 fps, mountain washes spread during frames 0–31, 12–45 and 26–60. The cliff outline starts at frame 34, with the downward wash following immediately and surface strokes finishing by frame 68.

The pine grows in stages. Its trunk draws during frames 57–77, branches during frames 68–98, and needle clusters flick outward during frames 80–114.

The boat brushes into view during frames 78–87 and travels into open water through frame 119. Its trailing wake draws during frames 88–108. The last pine clusters finish next, while the rower completes the driving stroke.

At frame 119, the boat reaches its arrival position, the darker stroke beneath its hull completes, blade ripples open, and the seal stamps at 112%. The seal settles to its final size within 0.2s. Wet ink at the blade dries back to a quieter lasting mark.

The title and subtitle stay fixed during the hold. Mist drifts, the pine sways, and the level boat continues moving while the oar pivots at the rower's hand. Ripples slowly spread.

## Outputs

`full` preserves the large opening title and sun. The landscape falls beneath the lower letters, and the boat crosses the central safe area above the bottom caption space.

`top` uses its own title height, larger italic line, mountain spacing and boat position. The wake draws across the available water, and the small seal sits among the lower washes.

`overlay` uses separate spacing inside a 960px-high paper card. The boat, final tree strokes and stamp follow the same arrival sequence. An uneven wipe reveals the card and closes it completely for the transparent exit.

Paper fibres pass over the painting, lettering and seal. Readable type stays at least 40px in `full` and 32px in compact outputs.