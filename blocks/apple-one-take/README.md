# One-Take Product Morph

One large red dot grows a Start button. A pointer presses it, white opens inside, and the same object becomes a planner and then a phone. Three checkmarks land in sequence. The phone contracts into the O of DO MORE.

**Key moment:** the original dot lands as the full stop. The complete line punches forward and the palette flips to white on ink. An expanding ring marks the impact. The words settle while the underline and dot continue moving.

## Suits

- Product and feature reveals
- Planner, productivity and software openers
- A short promise containing an O

## Doesn't suit

- Detailed tutorials that need reading time
- Long closing sentences
- Several products or competing accent colours

## What to change

Run `animate vars apple-one-take` for the full list.

| Variables | What they are |
|---|---|
| `buttonWord` | Short opening action |
| `productName`, `productPurpose` | Visible name and accessible description |
| `focusLine`, `dateLabel`, `prioritySummary` | Planner heading, date and summary |
| `priority1` to `priority3` | Three priorities; use `Task — time` |
| `nav1` to `nav3` | Phone navigation labels |
| `closingLine` | Short closing line; its first O becomes the phone outline |
| `ground` | Opening background |
| `ink` | Opening type and bezel; final background |
| `paper` | Screen colour; final type and O |
| `accent` | Original dot and its impact ring |
| `overlayPosition` | `top` or `bottom` |

Keep the closing line to roughly 8–12 characters, including spaces. An uppercase O gives the strongest result. The line stays whole; the dot supplies its final full stop.

Keep product names, headings and priorities short. Times sit beneath task names, or beside them in the shortest panels. Checkmarks demonstrate progress without moving or striking through the words.

The sample planner, date, tasks and times are illustrative.

## Timing

| | |
|---|---|
| Build-up before the key moment | 4s by default; 3s minimum |
| Hold | 1s by default |
| Transparent exit | Closes onto the letter O in 0.34s |

The card opens immediately after the click. Its contents arrive as complete groups. Each checkmark gets a sharp stamp and a matching pulse from the original dot. The last check lands after the phone settles.

The UI shutter and phone contraction start together. There is no pause on an empty device. The surrounding words appear together when the outline reaches its O slot.

The original dot follows one continuous arc to the full stop. Its landing triggers the palette change, scale punch and impact ring on the exact key frame. The dark payoff remains through the hold. After settling, the words stay fixed while the underline extends and the dot breathes.

Never introduce cuts between scenes, crossfades, a ground vignette, another accent, constant-speed text slides or blur on a held pose. Soft shadows belong to the object and disappear as it becomes type.

## Outputs

`full` uses a larger opening dot and button, a nearly full-width planner and a broad portrait phone. Important content stays clear of the portrait safe margins.

`top` and `overlay` have their own dimensions. Their wider phones carry larger task labels and navigation. The focus heading and summary share one generous horizontal tile, leaving more height for the priorities.

The overlay occupies a 960px-high card, enters through a rounded wipe and changes to ink at the payoff.

Panels with less than 810px of usable height switch to two columns. The shortest panels put times beside task names and navigation in the right column. Use at least 360px of stage height for the sample content.

Essential type stays at least 40px in `full`, 36px in the standard compact layouts and 32px in the shortest panels. The closing line reserves room for its scale punch and enlarged full stop.