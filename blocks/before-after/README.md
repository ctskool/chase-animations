# Before and after

A large browser holds on a dated blue bakery website, then a pressed handle drives a fast makeover wipe. The modern heading lands, three broad product cards spring into place, and an accent marks the finished page.

**Key moment:** the last product card lands as the complete browser gets a brief tomato outline. A matching header rule remains, and the bread and steam keep moving.

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
| `address`, `beforeLabel`, `afterLabel` | Browser address and comparison labels |
| `oldName`, `oldHeading1`, `oldHeading2`, `oldButton` | Old page’s main copy |
| `sidebarLine1` | Old-page subtitle |
| `oldItem1`, `oldPrice1` and so on | Three old menu names and prices |
| `newName`, `rightHeading1`, `rightHeading2`, `newButton` | Modern page’s main copy |
| `newNav1` | Modern navigation link |
| `card1Name`, `card1Price` and so on | Three modern product names and prices |
| `businessType`, `changeDescription` | Accessible description |
| Colour variables | Backdrop, pages, type, browser and drawn bread |
| `startSplit` | Opening divider position measured from the left |
| `beforeHold` | Time to read the old page before the drag, measured at default timing |
| `handlePress` | Strength of the handle’s initial press and directional squash |
| `overshoot` | Divider overshoot beyond the browser’s left edge |
| `cardLift` | Product cards’ spring travel |
| `productNameSize` | Full-output product name size |
| `compactProductNameSize` | Top and overlay product name size |
| `payoffPulse` | Brief illustration pulse at the key moment |
| `push` | Slow, proportional enlargement of the modern loaf |
| `steamTravel` | Steam rise over the shot |
| `overlayPosition` | Top or bottom overlay placement |

Keep replacement copy close to the sample lengths. Use two short heading lines and short prices.

The product cards run across the browser in three stacked rows. Their names have room to stay on one line: 46px by default in full, 38px in compact layouts and up to 36px in short sections.

Keep the business name, main illustration and corresponding products recognizable across both versions. The sample preserves the same bakery, loaf shape, bread scoring, menu names and prices. The modern cards add distinct croissant, bun and sourdough drawings.

Both websites retain fixed, complete layouts throughout the wipe. Text appears only after the divider and handle clear the whole text run.

The AFTER badge leaves when the reveal finishes. The modern navigation then takes its place, without leaving a blank label row.

The old page uses Libre Caslon Text. The new page uses Manrope and Inter Tight. All artwork is drawn with SVG.

The sample business, address, menu and prices are illustrative.

## Timing

| | |
|---|---|
| Build-up | 2.6s by default; 2.0s minimum |
| Opening read pause | 0.78s at default timing |
| Hold | 1.6s by default |
| Transparent exit | Centre wipe in 0.32s |

Frame one shows almost the entire blue page. The handle presses before the divider starts moving.

The drag accelerates sharply, crosses the browser quickly, then brakes deliberately. A small overshoot and return happen beyond the left edge, keeping the complete redesign exposed.

The revealed illustration reacts first. The modern heading and button land next, followed by three product cards in a quick stagger. Each card’s picture, price and border react on its arrival beat.

The final card lands at the key moment. A brief browser outline and illustration pulse distinguish that frame from the preceding beats. A tomato rule remains under the header.

The divider finishes offscreen. The complete redesign stays visible through the shorter hold.

Only the illustration, steam and fine dither continue moving through the hold. Reading text stays fixed once the cards land. The steam rises and gently sways throughout the shot.

The divider uses seven temporal motion-blur samples. The wipe, handle and text visibility are driven directly by the timeline so event-free sampling follows the same motion.

## Outputs

`full` uses a two-line headline, a larger browser close beneath it, a tall bread arch and three broad product cards. Essential content stays inside the portrait safe area.

`top` uses a single headline row, a shallower browser bar and its own header, hero and product-card dimensions.

`overlay` uses a 960px-high card with separate spacing, type and browser dimensions. It enters and leaves through a centre wipe. The exit closes one frame before the end.

Short compact sections use tighter spacing and smaller artwork while keeping essential type at least 32px. Essential full-output type is at least 40px.

The opening pause, handle press, staggered reveal, badge removal and moving hold apply to all three outputs.