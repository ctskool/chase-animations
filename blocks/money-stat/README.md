# Money stat

A business-documentary graphic with one huge number and one line chart. The counter follows the chart tip continuously. At the named event, the line turns orange and the explanation snaps into place.

**Key moment:** the exact final result takes its only large scale punch. The growth badge and endpoint tag arrive together, the chart stroke briefly thickens and one endpoint ring expands. The orange currency prefix remains after settling.

## Suits

- Finance and business explainers
- Growth recaps and client results
- A result with one clear turning point

## Doesn't suit

- Multiple series or competing metrics
- More than eight monthly observations
- Events or explanations that need several paragraphs

## What to change

Run `animate vars money-stat` for the full list.

| Variables | What they are |
|---|---|
| `company`, `metricLabel` | Company and metric |
| `headerLine`, `periodLine` | Retained reporting metadata; excluded from the visible opening |
| `month1` to `month8` | Eight month labels, in order |
| `value1` to `value8` | Monthly numeric values |
| `finalNumber` | Exact endpoint, including currency, commas and unit |
| `eventMonth` | Must match one of the eight month labels |
| `eventTitle`, `eventImpact` | Two short lines explaining the turning point |
| `delta`, `deltaComparison`, `deltaDirection` | Final badge, comparison and triangle |
| `axisDivisor`, `axisUnit` | Compact axis notation; 1000 and K show thousands |
| `sourceLine` | Your source or disclosure |
| `ground`, `ink`, `muted`, `sourceColor`, `beforeColor`, `accent` | Main colours |
| `overlayPosition` | `top` or `bottom` for the overlay output |

- `finalNumber` supplies the chart's final endpoint and counter. Keep `value8` consistent with it.
- The counter follows the currency and precision in `finalNumber`. Its digit width stays fixed.
- The delta is supplied copy, not an automatic calculation. The sample's +73.2% is `(168000 / 97000 - 1) × 100`, rounded to one decimal place.
- Keep the event title and impact to one line each.
- The opening header shows only the company name.
- The growth badge has its own row beneath the number. The live month sits at the right of that row.
- The event date and explanation occupy a separate band above the chart.
- Labels use Inter, the hero uses Inter Tight ExtraBold and chart data uses IBM Plex Mono.
- The disclosure uses compact sentence-case Inter to leave more room for the chart.
- The hatched strip represents unreported time beyond the last observation.
- All sample company details and data are fictional. Replace them with supported figures and your source.

**Never:**

- Roll digits, jiggle their width or overshoot the real number.
- Add rainbow series, gradients on the line or a glow behind it.
- Show orange before the event.
- Present the fictional defaults as real company filings.

## Timing

| | |
|---|---|
| Build-up before the key moment | 3.8s by default; 1.8s minimum |
| Hold | 0.88s by default |
| Transparent exit | Centre-strip wipe in 0.32s |

The chart starts moving immediately and slows into the event. The event ring appears on the same frame as the colour switch. Its leader draws and the three callout lines snap upward in quick sequence.

After a brief pause at the event, the rise accelerates and then slows into the exact endpoint. Monthly observations do not interrupt the draw with repeated stops or punches.

The final result gets the largest punch, growth badge, thicker orange stroke and endpoint tag together. One expanding ring carries that arrival through the shorter hold. Cursor dashes and hatching continue moving while reading text stays fixed.

## Outputs

`full` uses the portrait safe area, a large counter and a deep chart. The company-only header and compact disclosure give the main figure and plot more room.

`top` uses its own smaller gaps, readable callout and chart dimensions. `overlay` uses separate spacing inside a 960px-high dark card, with centre-strip entry and exit wipes.

All three outputs separate the growth badge from the event date and omit the orange horizontal rule. Dates and secondary copy use brighter grey. Reading text stays at least 40px in `full` and 32px in compact outputs. Tight plots omit alternate axis values to prevent collisions. Very short stages that cannot fit the readable callout and plot report an error.