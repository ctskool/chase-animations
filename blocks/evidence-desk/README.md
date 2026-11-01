# Evidence desk

Printed evidence lands on a worn green cutting mat. The finding is visible immediately. A taped label names the story, and the chart becomes one large figure above a quotation. Red handwriting and a closing circle connect the evidence. Yellow highlights only the quotation’s second passage.

**Key moment:** the yellow swash strikes behind the featured figure as its red circle, arrow and category underline finish. The figure punches forward, then settles.

## Suits

- Explainers that connect a statistic with a quote
- Commentary built around one clear finding
- Talking-head shorts that need a physical evidence beat

## Doesn't suit

- Dense tables or long quotations
- More than three chart categories
- Several competing annotations

## What to change

Run `animate vars evidence-desk` for the full list.

| Variables | What they are |
|---|---|
| `chartTitle`, `chartSubtitle`, `metric` | Printed heading and context |
| `row1Label`, `row1Value` and so on | Three category names and exact values |
| `keyRow` | Category to feature first and circle |
| `axisMax` | Numeric maximum used to size the bars |
| `axis0` through `axis100` | Axis labels; intermediate labels appear when they fit |
| `source` | Chart source |
| `quoteHeader`, `quoteDate` | Quote sheet identification |
| `quoteLine1` | Opening quote passage, left unhighlighted |
| `quoteLine2` | Quote passage to highlight |
| `quoteAttribution`, `quoteFooter` | Speaker and source context |
| `label`, `note` | Taped label and handwritten annotation |
| `mat`, `matCenter`, `matEdge`, `grid` | Cutting mat colours |
| `paper`, `labelCard`, `ink`, `muted` | Paper and printed text colours |
| `marker`, `highlighter`, `tape` | Marker, highlighter and masking tape |
| `cameraPush` | Slow movement of the mat framing |
| `paperTilt` | Strength of the opposing paper angles |
| `textureAmount`, `grainOpacity`, `seed` | Reproducible surface texture |
| `overlayPosition` | `top` or `bottom` for the overlay output |

- Keep category names short and handwritten notes around 16 characters.
- Keep each quote passage around the length of the sample.
- Put the sentence that makes your case in `quoteLine2`. Only that passage receives highlighter strokes, including when it wraps.
- Full output balances each sample passage across two large printed lines. Compact outputs keep each passage on one line when it fits.
- Values remain exactly as entered. Bars use the numeric value against `axisMax` and stop at the chart maximum.
- Exact figures are printed from the opening frame. Each bar’s endpoint triggers a short punch on its figure.
- The selected figure moves and enlarges continuously while the chart details retire and the paper contracts.
- The label and quotation carry their printed words through the final approach, impact, hop and skid. Words become visible together once their complete reading area is inside the frame.
- Paper rotation overshoots on impact, then settles. Shadows tighten on landing, with a small camera jolt.
- Quote spacing follows measured text height. The footer retires before the main quotation is reduced substantially.
- Use one marker colour and one highlighter colour. Keep the paper neutral.
- Paper lands, tape slaps and ink draws. Never use fades as the main move, flatten the paper treatment or drift the printed text through the hold.
- The supplied people, place, office, quotation and data are fictional. Replace them with your own sourced evidence.

## Timing

| | |
|---|---|
| Build-up before the key moment | 4s by default; 2.4s minimum |
| Hold | 1s by default |
| Transparent exit | A diagonal wipe closes in 0.3s |

The selected finding is readable immediately as the opening chart finishes landing. Bars strike into place and their exact figures punch at the endpoints.

The printed headline slides in, drops with a rotation overshoot and skids to a stop. Two pieces of tape slap onto its corners.

The selected figure begins growing before the surrounding chart details disappear. Its position and size change in one continuous move, reaching the large reading pose before the quotation arrives.

The printed quotation slides in from the opposite side, drops, hops and settles. The handwritten note follows. Highlighter sweeps only the second quote passage, line by line: “The biggest users did not.”

The closing circle, arrowhead, category underline and yellow swash finish at the key moment. The figure punches forward without changing its exact value.

The figure and circle react immediately afterward. The circle retains a small enlargement. Light, grain, mat framing, tape and the paper shadow keep moving while the printed words stay fixed.

## Outputs

`full` uses the safe reading height for a tall opening chart, then stacks a large featured figure above four broad quote lines. Only the second passage’s two lines receive highlighter.

`top` uses a shorter chart, a centred figure and two broad quote lines. The final papers fill the available height, with highlighter restricted to the second passage.

`overlay` has its own paper width, figure size and spacing, with diagonal entry and exit wipes. The finding is already printed when the entry wipe opens.

Stages below 840px begin with the selected category and omit the supporting chart details, chart title and quote footer. Their figure enlarges continuously during the same transition. Below 740px, the quote header retires. Below 620px, the category sits beside the figure and the handwritten note retires. Very short stages may also omit the attribution to preserve the quotation.

Printed type keeps a minimum of 40px in `full` and 32px in compact outputs.