# Notification stack

Orders push onto a dark lock screen beneath a huge running total. Each arrival drops into place with a small rebound while changed digits roll upward in separate masked columns.

**Key moment:** the final order, exact figures and more pill settle together. One complete accent outline pulses outward around the summary, then clears.

## Suits

- Sales and launch recaps
- “My phone after posting” sequences
- Sign-up or client-win stories with your own figures

## Doesn't suit

- Long messages or detailed receipts
- Presenting fictional orders as actual customer activity
- Bright wallpaper, real phone branding or competing accent colours

## What to change

Run `animate vars notification-stack` for the full list.

| Variables | What they are |
|---|---|
| `appName`, `date`, `clock` | Shop name and lock screen text |
| `summaryLabel`, `countLabel` | “Today” and “orders” |
| `startingCount`, `startingTotal` | Opening figures, already including the first visible card |
| `currency` | Three-letter currency code, such as `USD` |
| `timestamp` | The “now” on each card |
| `cardFormat` | Body text; `[AMOUNT]` and `[N]` insert each order's details |
| `order1Amount` through `order21Amount` | Individual order amounts |
| `order1Items` through `order21Items` | Individual item counts |
| `pillText` | Text below the stack |
| `ground`, `blue`, `teal` | Dark wallpaper colours |
| `accent`, `iconInk`, `ink` | App icon, bag and text colours |
| `overlayPosition` | `top` or `bottom` for the overlay |

The sample is Wrenlo, a fictional home goods shop. It starts at **18 orders / $1,248.00**. The first $42.00 card is already included. Twenty later arrivals add **$1,312.00**, ending at **38 orders / $2,560.00**.

The wording keeps “items” even when the count is 1. Keep names and messages short enough to fit one line.

The sample pill counts the 17 arrivals behind four visible cards. Update `pillText` if your chosen output height shows fewer cards or your wording means something else.

The shopping-bag icon is drawn locally. No image upload is needed.

## Timing

| | |
|---|---|
| Build-up before the key moment | 3.667s by default; 2s minimum |
| After the key moment | 1.333s, plus a 0.32s closing wipe when transparency is needed |

At the default timing and 30 fps, arrivals begin on frames **0, 9, 18, 27, 36**, then every four frames through **100**. The final notification, rolling figures and pill finish on frame **110**.

New cards drop from beneath the summary. Existing cards push downward together, then the incoming card completes a small controlled settle. Each entrance finishes before the next begins.

The total and order count use separate masks for every character column. Only changed characters roll. All values share fixed column positions and one fitted font size, with extra room at the total's right edge.

The default opaque composition lasts **150 frames / 5 seconds**. At the key moment, one complete outline expands around the summary and clears within 0.44 seconds. The figures and cards then stay fixed while soft wallpaper light continues moving.

## Outputs

`full` gives the total a taller, larger row and keeps readable content clear of the top and bottom app bars.

`top` places the date and clock beside each other to leave more room for notifications.

`overlay` keeps a centered lock-screen header and uses its own enlarged total and card sizes. A horizontal wipe opens and closes the rounded panel over talking-head footage.

All three outputs use individual digit masks, padded totals, controlled card entrances and the same single finish pulse.

All outputs show up to four cards. Shorter stages show fewer cards to preserve readable type. Below 880px, the header uses one row; below 620px, the date, clock and phone chrome are removed.