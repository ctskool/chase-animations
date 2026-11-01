# Swiss grid

A huge black circle contracts into firm grid steps and opens a red field. Three heavy phrases arrive whole, each with a numbered caption.

The final phrase is larger and reverses to paper lettering inside a broad black band. Its arrival triggers the circle expansion, a brief paper cut and a heavy ink rule.

Paper, ink and signal red. Public Sans, square grid spacing and hard edges.

**Key moment:** the reversed final phrase and caption settle, the field returns to red, the circle reaches its final size, and the ink rule finishes drawing.

## Suits

- Bold statements and manifesto openers
- Principles, creative direction and chapter introductions
- Three short phrases supporting one idea

## Doesn't suit

- Paragraphs or detailed explanations
- Comparisons, charts or statistical claims
- More than three headline rows

## What to change

Run `animate vars swiss-grid` for the full list.

| Variables | What they are |
|---|---|
| `line1`, `line2`, `line3` | Three short headline phrases |
| `caption1Number`, `caption1Text` and so on | Numbered captions beneath each phrase |
| `captionSeparator` | The slash between each number and caption |
| `mainFontSize`, `mainWeight`, `mainTracking` | Headline typography before fitting |
| `captionFontSize`, `captionWeight`, `captionOpacity` | Caption typography; numbers retain full ink |
| `paper`, `ink`, `signalRed` | The three colours; the final phrase uses paper on ink |
| `gridColumns`, `compactExtraColumns` | Portrait columns and additional compact columns |
| `gridLineWidth`, `gridOpacity` | Grid visibility |
| `gridLeft`, `gridRight`, `gridTop`, `gridRowPitch` | Source grid guides |
| `mainLeft`, `mainBaseline1` and so on | Text inset and relative spacing between headline rows |
| `captionBaseline1` and so on | Spacing beneath each headline |
| `circleRadius`, `circle1X`, `circle1Y` and so on | Travel circle size and five route stops |
| `finalCircleModules` | Final circle diameter |
| `fieldLeft`, `fieldTop`, `fieldRight`, `fieldBottom` | Source field and route guides |
| `gridStaggerFrames`, `lineStaggerFrames` | Minimum spacing between entrances |
| `stepOvershoot`, `typeOvershoot`, `circleWindBack` | Impact, final headline emphasis and anticipation |
| `referenceWidth`, `referenceHeight` | Dimensions used by the source guides |
| `overlayPosition` | `top` or `bottom` for the overlay output |

- Use two or three short words per headline.
- Keep each caption to a short supporting phrase.
- Headlines fit together, with extra size reserved for the final phrase.
- Longer copy wraps at whole words. Shorten copy that creates several lines.
- Text stays at least 40px in `full` and 32px in compact outputs.
- Compact captions retain the selected size before fitting.
- The final black band has padding clear of the surrounding captions.
- The final circle has reserved space clear of every caption and the ink rule.
- Its default diameter is two grid modules; very short stages cap its height.
- The travelling circle keeps a substantial minimum size.
- Diagonal route stops become separate horizontal and vertical steps.
- Preserve the three-colour palette. Avoid gradients, shadows, glow, grain, rounded display faces and decorative corner labels.
- The defaults are sample wording.

## Timing

| | |
|---|---|
| Build-up before the key moment | 3s by default; 1.65s minimum |
| Hold | 2s by default |
| Transparent exit | 0.32s |

The opening circle nearly fills the available area. It contracts, takes crisp rook steps, then triggers the red field.

The field unfolds across, up and down. The first phrase arrives as that opening finishes, reducing the wait before the message appears. The first two phrases pulse the small circle as they land.

A black band opens before the final phrase appears. The larger paper-coloured words punch into that band while the circle expands into its final corner. A brief paper cut returns directly to red before the key moment.

The heavy ink rule finishes at the key moment and reacts just after it.

During the hold, all wording stays fixed. The circle slowly breathes from its lower-right anchor while a substantial ink stroke travels along the perimeter.

Overlay entry and transparent exit use straight wipes along the left field edge.

## Outputs

`full` fills the area between the 230px top and 300px bottom safe margins. Four grid columns support the portrait field, with a larger reversed final phrase and a substantial circle beneath it.

`top` and `overlay` use seven columns by default. They have separate spacing, larger supporting captions and a circle beneath the wording.

Short `top` stages place the circle beside the text. The final black band stays inside the text area.

The overlay uses a 960px-high paper area and respects `overlayPosition`.