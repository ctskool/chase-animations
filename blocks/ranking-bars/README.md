# Ranking bars

Six horizontal bars race through changing years. Follow one orange hero through the muted field, then land on its oversized final number.

**Key moment:** every final value and rank becomes exact. The final year arrives as the running caption cuts to the hero's large result. The result is larger than the year; the hero bar thickens and its winner chip punches.

## Suits

- Growth stories with six comparable categories
- Rankings with one category to follow
- A talking-head short that needs a clear numerical payoff

## Doesn't suit

- Negative values or mixed units
- More or fewer than six categories
- Long names or paragraph captions
- Several competing highlights

## What to change

Run `animate vars ranking-bars` for the full list.

| Variables | What they are |
|---|---|
| `title`, `subtitle` | Short headline and context |
| `category1` to `category6` | Six different names, in CSV column order |
| `heroCategory` | Exactly matches the category to follow |
| `yearlyValues` | CSV with a year and six non-negative values per row |
| `firstPlaceChip`, `units` | Short winner chip and shared units |
| `openingCaption` | Opening context, balanced across two lines |
| `passingTemplate` | Overtake wording; `{name}` becomes the category being passed |
| `leadingCaption` | Wording when the hero reaches first |
| `finalCaption` | Short label above the hero's large final number |
| `axisMax`, `valueDecimals` | Shared scale and number precision |
| `color1` to `color6` | Bar colours |
| `backgroundTop`, `backgroundBottom` | Background colours |
| `ink`, `nameInk`, `muted` | Main and supporting text colours |
| `gridColor`, `yearColor`, `chipGround` | Grid, running year, chip and moving highlight |
| `overlayPosition` | `top` or `bottom` |

CSV columns are positional. Renaming a category does not require changing its CSV header. Use at least two data rows; additional years share the build-up duration.

All bars use one fixed scale. The axis expands when necessary. Equal values use category order to break ties.

Only the hero's overtakes change the running caption. Names and values briefly mask actual collisions during swaps; all six return in settled rows.

The final readout always shows the selected hero's last CSV value. Update `finalCaption` when changing the hero or its outcome. The winner chip appears only while that hero ranks first.

Keep one strong bar colour and five muted colours. Never add glow, permanent shadows, extra decoration or competing highlights. Keep text dark enough to read.

All default regions and figures are fictional.

## Timing

| | |
|---|---|
| Build-up | 4s by default; 2.4s minimum |
| Hold | 1s by default |
| Transparent exit | Directional wipe in 0.32s |

Values accelerate into each data boundary. Rank swaps start at the calculated value crossing and settle on short springs. Each year arrives at its data boundary with a brief compression; intermediate values show progress toward the next year.

The final year first appears at the key moment, alongside exact values, exact ranks and the large hero result.

During the hold, the hero bar breathes and a narrow highlight travels across it. Names, numbers and captions stay stationary. Transparent outputs wipe closed after the hold.

## Outputs

`full` uses a two-line headline, larger category labels and an oversized final readout. Important content stays below the top 230px and above the bottom 300px.

`top` uses a single-line headline, larger category labels and its own chart spacing. The final result takes priority over the smaller year.

`overlay` uses a 960px card with its own spacing and directional entry and exit wipes.

Stages below 820px use tighter spacing. Keep stages at least 720px high and copy concise. Required text retains a minimum of 40px in `full` and 32px in compact outputs.