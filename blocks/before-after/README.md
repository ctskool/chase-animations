# Before and after

A large browser transforms a dated blue bakery website into a spacious modern redesign. One smooth wipe reveals the complete new page and leaves it on screen.

**Key moment:** the redesign is fully visible, all three product cards have landed, and their prices give a brief confirming pop.

## Suits

- Website redesigns and business makeovers
- Client case studies with a clear before and after
- Talking-head videos explaining a visual change

## Doesn't suit

- Comparisons requiring photographs or actual screenshots
- More than two versions
- Dense page copy or long product names
- Very short top sections

## What to change

Run `animate vars before-after` for the full list.

| Variables | What they are |
|---|---|
| `headline1`, `headline2` | Main headline; full stops use the accent colour |
| `address`, `beforeLabel`, `afterLabel` | Browser address and horizontal corner labels |
| `oldName`, `oldHeading1`, `oldHeading2`, `oldButton` | Old page’s main copy |
| `sidebarLine1` | Old-page subtitle |
| `oldItem1`, `oldPrice1` and so on | Three old menu names and prices |
| `newName`, `rightHeading1`, `rightHeading2`, `newButton` | Modern page’s main copy |
| `newNav1` | Modern navigation link |
| `card1Name`, `card1Price` and so on | Three modern product names and prices |
| `businessType`, `changeDescription` | Accessible description |
| Colour variables | Backdrop, pages, type, browser and drawn bread |
| `startSplit` | Opening divider position measured from the left |
| `overshoot` | Small divider recovery beyond the browser’s left edge |
| `cardLift` | Product cards’ spring travel |
| `push` | Slow, proportional enlargement of the modern loaf |
| `overlayPosition` | Top or bottom overlay placement |

Keep replacement copy close to the sample lengths. Use two short heading lines, short prices and menu names of about three words.

Both websites occupy the complete browser throughout the shot. The wipe clips the modern page without resizing either layout. Bread keeps its proportions, and product names keep their original line breaks during the reveal.

The modern page adds generous space around its headline, a separate navigation link, a large tomato arch and three distinct product cards.

The old page uses Libre Caslon Text. The new page uses Manrope and Inter Tight. All artwork is drawn with SVG.

The sample business, address, menu and prices are illustrative.

## Timing

| | |
|---|---|
| Build-up | 1.9s by default; 1.3s minimum |
| Hold | 3.1s by default |
| Transparent exit | Centre wipe in 0.32s |

The opening briefly establishes the old page. The divider then makes one eased sweep from right to left.

Its small overshoot and recovery happen beyond the browser’s left edge. The new page stays completely revealed throughout that recovery.

Three product cards spring into place in sequence before the key moment. Their prices react immediately after it.

The divider does not return to a halfway comparison. The complete redesign remains on screen for the longer hold.

Only the illustration, steam and fine dither continue moving. Reading text stays fixed after the brief price reaction.

The divider uses seven temporal motion-blur samples. Its movement and the clipping edge use matching direct timeline tweens.

## Outputs

`full` uses a two-line headline and a tall browser within the portrait safe area. The website hero pairs large copy with a large bread illustration.

`top` uses a single headline row, its own spacing and three product cards across the browser. Shorter sections use tighter layout numbers.

`overlay` uses a 960px-high card with the compact layout and a centre wipe for entry and exit. The exit closes one frame before the end.

Essential type is at least 40px in `full` and 32px in compact outputs. Both complete page layouts remain fixed in every output.