# Laptop reveal

A silver laptop springs open in a bright studio. Its product page wakes, scrolls to a second headline, and receives a cursor click. The complete product name rises into place underneath.

**Key moment:** the complete name, short line, blue underline and button check are visible together. A click outline expands immediately afterward.

## Suits

- Product and SaaS launches
- Website and portfolio introductions
- A product reveal inside a talking-head short

## Doesn't suit

- Detailed software tutorials
- Dense dashboards or long paragraphs
- Imported screenshots, photographs or video
- Several products sharing the frame

## What to change

Run `animate vars laptop-reveal` for the full list.

| Variables | What they change |
|---|---|
| `product`, `productDescription` | Accessible description |
| `headline` | Opening screen headline and portrait heading |
| `projectTitle`, `projectDescription` | Product preview |
| `sectionHeadline`, `sectionDescription` | Copy revealed by the scroll |
| `button` | Persistent button |
| `productName`, `shortLine` | Copy underneath the laptop |
| `headlineSize`, `nameSize`, `taglineSize` | Preferred exterior text sizes |
| `screenTitleSize`, `screenTextSize`, `screenButtonSize` | Screen typography in texture pixels |
| `bgTop`, `bgBottom` | Studio colours |
| `silver`, `bezel`, `keys` | Laptop colours |
| `pageBackground`, `pageInk`, `workspaceSurface`, `muted` | Page and secondary-text colours |
| `buttonColor`, `buttonPressedColor`, `buttonInk` | Button, underline and light colours |
| `nameInk` | Product name |
| `initialLidAngle`, `finalLidAngle` | Lid poses |
| `cameraOrbit`, `cameraElevation` | Camera angles |
| `screenBlur`, `scrollPixels` | Screen wake softness and page travel |
| Variables ending in `Frame`, plus `keyFrame` | Build-up beats relative to the reference key frame |
| `overlayPosition` | Top or bottom placement |

Use two short headline lines, a short preview title, and brief descriptions. Keep the button close to the sample length. Long screen copy is shortened with an ellipsis.

The display wakes as a complete page. The product name and short line enter vertically rather than revealing fragments of words.

The laptop has no logo. Its geometry, lighting and contact shadow are generated locally. Nooklane is fictional sample content.

## Timing

| | |
|---|---|
| Build-up | 4s by default; 2.4s minimum |
| Hold | 1s by default |
| Transparent exit | 0.34s |

The lid and camera settle around one second. The page scrolls over reference frames 40–74.

During that scroll, the portrait heading slides away and the laptop expands into the released space. The final screen headline becomes the main message.

The cursor arrives at frame 104 and presses the button over frames 110–120. The name starts at frame 94 and the short line at frame 103. Each rises quickly into its reading position. The underline finishes at the key moment.

The button check appears exactly at the key moment. The button releases, a click outline expands, and the laptop gives a short forward response.

Reference frames use a 30 fps design. Word sync scales the build-up together. Through the hold, studio lights and thin highlights keep moving while readable text stays in place.

## Outputs

`full` opens with a large portrait headline. The heading exits during the scroll, giving the laptop more space above the oversized name and short line.

`top` uses a lower camera angle, a large laptop and a compact name treatment underneath.

`overlay` uses a 1000px studio card with its own spacing. A horizontal wipe opens the card and fully closes it on exit. Place it above or below talking-head footage.