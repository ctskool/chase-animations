# Notification stack

Orders flood onto a dark, frosted lock screen beneath a huge running total. Each landing punches the summary, changes the order count and starts a fast count of the complete money value.

**Key moment:** the final order settles with the exact total. The summary slams to 1.08 scale, a teal flash crosses it, the screen buzzes for three frames and the total stays in the accent colour. The large more pill pops below the tucked stack.

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
| `accent`, `iconInk`, `ink` | App icon, final total, bag and text colours |
| `overlayPosition` | `top` or `bottom` for the overlay |

The sample is Wrenlo, a fictional home goods shop. It starts at **18 orders / $1,248.00**. The first $42.00 card is already included. Twenty later arrivals add **$1,312.00**, ending at **38 orders / $2,560.00**.

The wording keeps “items” even when the count is 1. Keep names and messages short enough for one line. Text that cannot fit at the minimum readable size produces a clear error instead of being cropped.

The sample pill counts the 17 arrivals behind four visible cards. Update `pillText` if you choose a shorter output that shows fewer cards.

The shopping-bag icon and fine static grain are drawn locally. No image upload is needed.

## Timing

| | |
|---|---|
| Build-up before the key moment | 3.5s by default; 2s minimum |
| After the key moment | 1.5s, plus a 0.32s closing wipe when transparency is needed |
| Default opaque duration | 5 seconds |

Frame one already contains the lock-screen header, summary and first notification.

The first new order lands about half a second later. The intervals tighten into roughly four-frame arrivals, followed by a short separation before the final order.

Incoming cards slide out from beneath the summary, overshoot and settle. Each impact shoves the older cards downward with a slight squash and a small stagger through the stack. Older cards shrink into two darker backing layers rather than leaving the screen.

The total counts as one complete text value over about seven frames. Faster arrivals smoothly retarget that same count. The order count changes on the landing frame, together with a 1.03 summary punch and teal rim pulse. Every numeral shares one baseline.

At the key moment, the figures are exact and the final cards are settled. The stronger finish reaction clears quickly, leaving the accent total and a restrained outline. The pill has 32px of clear space below the backing layers.

The full lock screen keeps pushing in slowly throughout the 1.5-second hold. The wallpaper light also drifts, while the text remains stable within its cards.

## Outputs

`full` uses a large centered clock, a tall summary and four readable cards, with room reserved for the final punch and the top and bottom app bars.

`top` puts the date and clock beside each other, with its own summary, card and pill sizes.

`overlay` uses its own compact header, frosted surfaces and larger pill. A horizontal wipe opens and fully closes the panel over talking-head footage.

All three outputs use the accelerating cascade, whole-text counts, weighted stack motion and complete finish reaction.

Shorter stages show fewer cards to preserve readable type. Below 620px, the date, clock and phone chrome are removed.