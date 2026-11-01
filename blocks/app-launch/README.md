# App launch

A large studio phone receives a transaction. Its balance ticks and its chart draws on the same beat. The camera pill becomes a savings card, a percentage chip becomes an income card, and a wide transfer takes over for the finish.

**Key moment:** the exact transfer amount, completion wording, white check and solid accent surface land together.

## Suits

- App launches and product reveals
- SaaS ads
- Showing a client's product inside a talking-head short
- Finance interfaces with one main number

## Doesn't suit

- Dense walkthroughs or long paragraphs
- Flat screenshots pasted onto a phone
- Phones moving at constant speed without a floor shadow
- Cards fading in or arriving together
- Real phone-maker logos
- Dark backdrops with neon glows
- Rolling digits or proportional figures

## What to change

Run `animate vars app-launch` for the full list.

| Variables | What they are |
|---|---|
| `appName`, `appType` | Visible app name and accessible description |
| `clockLabel` | Reserved phone clock; hidden in these layouts |
| `avatarLabel`, `greeting` | Phone header; use two initials |
| `balanceLabel`, `mainNumber`, `deltaLabel` | Main balance and change chip |
| `chartMonday` to `chartSunday` | Seven chart values with currency formatting |
| `chartLabelMonday`, `chartLabelWednesday`, `chartLabelSunday` | Chart labels |
| `chartFocus` | Day inspected by the dark value tag |
| `recentLabel`, `viewAllLabel` | Activity heading |
| `row1Title`, `row1Date`, `row1Amount` | Featured transaction |
| `row2Title` to `row3Amount` | Reserved fields; only one transaction appears |
| `navHome`, `navActivity`, `navGoals` | Navigation in the full phone |
| `card1Title`, `card1Value`, `card1Caption` | Savings card |
| `card2Title`, `card2Value`, `card2Change` | Income card and percentage source |
| `miniBar1` to `miniBar5` | Decorative bar heights |
| `card3PendingTitle`, `card3PendingCaption` | Wording while the transfer counts |
| `card3Title`, `card3Value`, `card3Caption` | Completed transfer |
| `brandColor`, `brandTint` | Accent and pale tint |
| `backdropTop`, `backdropBottom`, `backdropGlow`, `floorColor` | Studio palette |
| `ink`, `muted`, `surface`, `lineColor` | Interface colours |
| `metalColor`, `metalDark` | Phone edge |
| `phoneTurn`, `phonePitch`, `phoneRoll` | Final phone pose |
| `grainOpacity` | Fine backdrop grain |
| `overlayPosition` | `top` or `bottom` |

Keep titles short and captions to one short sentence. Captions wrap with their last two words together.

Use the same currency for the featured transaction and main balance. The opening balance is the final balance minus the featured transaction. Its arrival starts the balance tick, including in shorter layouts where the row is omitted.

Amounts count as complete text on one baseline. The chart uses the entered values; its inspected day can differ from the latest balance. The mini bars are decorative.

Nuvori and all financial figures are fictional sample content.

## Timing

| | |
|---|---|
| Build-up | 4s by default; 2.4s minimum |
| Hold | 1s by default |
| Transparent exit | Circular close in 0.3s |

The phone makes a short weighted turn. The transaction starts the balance count and chart draw together. The exact balance, change chip and chart endpoint then punch together.

The camera pill travels around the phone before striking the savings card's position. The percentage chip makes a shorter move before the income card arrives.

Each source becomes a complete card on its impact frame. Cards appear successively, with their titles, amounts and captions visible together.

The transfer starts as a progress disc. A wide band snaps around it and the amount counts quickly. At the key moment, the amount becomes exact, the wording switches to completion, and the surface turns to the accent colour.

The band and amount punch once. A white ring expands and a reflection crosses the band throughout the hold. The phone reflection, chart halo and floor shadow also keep moving.

The default opaque portrait output is five seconds. Transparent outputs add the closing wipe.

## Outputs

`full` uses a broad phone, a deeper chart and large type. Savings and income take turns in one wide lower dock. A taller transfer band replaces them for the finish. Important copy stays below the top 230px and above the bottom 300px.

`top` starts with the phone centred, then moves it left to make room for successive cards on the right. Its chart and activity fill the phone. Before the wide transfer lands, the curve moves upward and whole labels beneath the band leave together.

`overlay` uses the same sequence with its own phone proportions inside the studio card. It enters and leaves through a circular wipe.

Short stages keep the transfer in the right column. Header details, activity and chart elements leave as complete sections when there is insufficient room.