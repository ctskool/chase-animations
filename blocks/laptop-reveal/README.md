# Laptop reveal

A silver laptop opens in a bright studio. Its screen wakes on your product, scrolls quickly to a second message, and receives a cursor click. A large, heavy product name stamps into place underneath.

**Key moment:** the button confirms, the name hits its largest pose, and the short line and solid blue underline finish together. The name and button spring back immediately afterward.

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
| `headline` | Opening message |
| `projectTitle`, `projectDescription` | Illustrated workspace preview |
| `sectionHeadline`, `sectionDescription` | Message revealed by the scroll |
| `button` | Persistent button |
| `productName`, `shortLine` | Final name and supporting line |
| `headlineSize` | Full opening headline size |
| `nameSize`, `topNameSize`, `overlayNameSize` | Name size for each output |
| `taglineSize`, `topTaglineSize`, `overlayTaglineSize` | Supporting-line size for each output |
| `fullLaptopWidth`, `topLaptopWidth`, `overlayLaptopWidth` | Maximum laptop width for each output |
| `brandImpact` | Name landing overshoot |
| `underlineWidth`, `topUnderlineWidth`, `overlayUnderlineWidth`, `underlineThickness` | Solid underline dimensions |
| `screenPadding` | Breathing room inside the display |
| `screenTitleSize`, `projectTitleSize`, `screenTextSize`, `screenButtonSize` | Preferred screen typography |
| `bgTop`, `bgBottom`, `studioLight` | Studio colours and reflections |
| `silver`, `bezel`, `keys` | Laptop colours |
| `pageBackground`, `pageInk`, `workspaceSurface`, `muted` | Page and supporting-text colours |
| `buttonColor`, `buttonPressedColor`, `buttonInk` | Button and underline colours |
| `nameInk` | Product name |
| `initialLidAngle`, `finalLidAngle` | Lid poses |
| Camera variables | Opening orbit and separate final viewing angles |
| `screenBlur`, `scrollPixels` | Screen wake softness and section travel |
| Variables ending in `Frame`, plus `keyFrame` | Build-up beats relative to the reference key frame |
| `overlayPosition` | Top or bottom placement |

Use brief headlines, a short preview title and a button close to the sample length. Screen copy balances across complete words. Manual line breaks are treated as spaces so the supporting copy can finish with “next steps. Together.” Long copy is shortened at whole-word boundaries.

The full opening headline disappears before any screen copy appears. The compact outputs put the opening message directly on the screen.

The laptop has rounded metal panels, a narrow rounded glass border, connected hinge barrels, shallow staggered keys and a soft floor shadow. Studio reflections are generated locally. Nooklane is fictional sample content.

## Timing

| | |
|---|---|
| Build-up | 4s by default; 2.4s minimum |
| Hold | 1s by default |
| Transparent exit | 0.34s |

The lid and camera land around one second. The full headline hands off to the waking screen at reference frame 14. Top and overlay start waking at frame 4. The entire display brightens through a soft blur and is sharp by frame 30.

The page scrolls over frames 48–54. Reading groups leave before their words reach the bezel, and the incoming headline and description arrive together. The button has its own clear area throughout. Scroll duration is capped at eight reference frames.

The cursor arrives at frame 104. The laptop moves up to make room for the name, which enters from frame 106. The short line follows at frame 113.

At frame 120, the button confirms and releases as the name stamps down. The underline completes one clean draw and stays solid. The brief landing response settles, then the final lockup stays fixed while studio reflections continue moving.

Reference frames use a 30 fps design. Word sync scales the build-up together.

## Outputs

`full` starts with a large headline above the opening laptop. The headline leaves before the screen wakes. The laptop fills the width, then moves up for the oversized name and short line, inside the portrait safe area.

`top` uses its own lower viewing angle, name size and spacing. The laptop occupies the available area before making room for the final lockup.

`overlay` uses a 1000px studio card with separate camera and type sizes. A horizontal wipe opens the card and fully closes it on exit. Place it above or below talking-head footage.