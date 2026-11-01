# Cost receipt

A thermal receipt advances in hard mechanical yanks. A huge running cost sits directly beneath its torn edge and moves down as the paper grows. The shopkeeper grips, strains, tears and celebrates.

**Key moment:** an oversized round stamp strikes with the exact total. Its amount is larger than the running cost. The paper compresses, the stamp recoils through a short rotation, then the ink settles.

## Suits

- “This whole app cost me three dollars” reveals
- Token, model and tool cost breakdowns
- A session or project with a small final bill

## Doesn't suit

- More than four line items
- Long explanations inside the receipt
- Comparing multiple bills or currencies

## What to change

Run `animate vars cost-receipt` for the full list.

| Variables | What they are |
|---|---|
| `shopLine`, `subtitle` | Receipt heading and context |
| `item1Label` to `item4Label` | Up to four items; an empty label removes that row |
| `item1Price` to `item4Price` | Item prices, including their currency symbol |
| `subtotalLabel` | Caption above the running cost |
| `totalLabel`, `totalValue` | Final printed label and exact total |
| `stampWord`, `stampAngle` | Stamp wording and tilt |
| `paper`, `ink`, `muted` | Paper, printed ink and running caption colour |
| `stampInk`, `accent`, `ground` | Stamp, character and background colours |
| `slotColor`, `mouthColor` | Printer housing and deep slot interior |
| `showMascot`, `showLogo` | Show or hide the character and logo |
| `overlayPosition` | `top` or `bottom` for the overlay output |

- Two to four items work best.
- Keep item labels around 24 characters or fewer.
- Use shorter labels on cards below 780px high.
- Keep prices short and use one currency throughout.
- A final amount around five characters gives the strongest stamp.
- Keep the stamp word and total label short; “PAID” and “TOTAL” fit well.
- Numeric item prices add into the running cost.
- A nonnumeric item price contributes nothing to that sum.
- Set the exact final total to match your breakdown.
- The printed amount and label become the stamp text, so neither appears twice.
- The defaults are illustrative. Replace them with your own figures.

## Timing

| | |
|---|---|
| Build-up before the key moment | 4.0s by default; 2.4s minimum |
| Hold | 1.9s by default |
| Transparent exit | Upward wipe in 0.34s |

The first item and its subtotal appear immediately. The cost stays close to the paper rather than waiting at a fixed position near the bottom.

Each feed loads a crease, accelerates into a yank, advances in three bites and stops abruptly. The paper briefly buckles, then snaps flat through a short recoil. A complete new row and its exact subtotal appear on the same frame, with an accent-colour punch.

Both hands hook over the upper paper edge. Visible fingers sit on its front face, and the arms follow those grips through each pull. Later feeds produce a stronger backward lean and a deeper body displacement. The mascot keeps its original proportions throughout.

After the last item, one hand keeps hold while the other wipes the mascot’s forehead. A final feed prints the conventional total line and clears the running cost. A stronger diagonal tug tears the receipt away, leaving a stub and a visible gap beneath the slot.

The stamp arrives on the key frame at an oversized contact pose. The paper compresses and kicks sideways. A short opposite rotation follows before the final impression settles. The large amount, rough rings and permanent ink spatter remain on the receipt.

The mascot’s eyes widen at the tear and stay wide through the impact and celebration. It repeatedly jumps with its V-shaped arms raised, including through its landings. Its body moves and rotates without stretching its pixels.

During the hold, the jumps continue, a faint reflection crosses the paper and the curl shadow breathes. The receipt text stays in place once the impact settles.

## Outputs

`full` uses a wide receipt, large item type and a huge running amount. Its stamp takes its size from the whole sheet, allowing the rings to overprint the item area while the hero amount dominates the lower receipt.

`top` uses its own heading, row spacing, slot depth, pull distances and counter size. The stamp fills most of the receipt height, keeping the payoff amount larger than the running cost.

`overlay` has separate layout and motion dimensions. Its receipt and counter move as one event, then give way to the large final impression. It enters through a downward reveal and leaves through an upward wipe.

Cards below 780px high arrange multiple items in two columns. The final stamp still spans the receipt rather than being squeezed into a narrow sidebar.

Prices share one font size and a right-aligned column. Labels and prices share a baseline. Longer labels can wrap at word boundaries. Empty item labels remove their rows.

Text keeps a minimum font size of 40px in `full` and 32px in `top` and `overlay`. The final amount is fitted with room for both the impact and settled stamp poses. The running amount is sized beneath it so the payoff keeps its emphasis.

The slot has a deep black mouth, a shaded housing and a strong contact shadow over the emerging paper.

Hiding the mascot gives more height to the receipt. Hiding the logo keeps the shop name centred.
Claude, Claude Code and the Claude logo are Anthropic's. This pack isn't affiliated with or endorsed by Anthropic.
