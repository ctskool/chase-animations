# Globe arcs

A large dotted globe on deep navy. Orange routes arch from one origin and land individually. A bold figure changes on each landing. White pins, expanding ripples and three city labels keep the shot clear.

**Key moment:** the final route touches down and the figure reaches the exact final number. The figure punches forward, flashes warm white and settles. A thick orange ring expands around the globe.

## Suits

- Global reach and customer locations
- Shipping, travel and distribution
- Transfers or activity across several locations

## Doesn't suit

- Destinations spread across opposite sides of Earth
- Detailed maps or country-by-country comparisons
- More than four routes
- Long city names or explanatory paragraphs

## What to change

Run `animate vars globe-arcs` for the full list.

| Variables | What they are |
|---|---|
| `label`, `startingNumber`, `finalNumber`, `unit` | Headline and exact starting and ending figures |
| `numberDecimals` | Decimal places shown throughout |
| `originCity`, `originLatitude`, `originLongitude` | Origin name and coordinates |
| `destination1City` through `destination4City` | Destination names; leave one empty to remove its route |
| Each destination's `Latitude`, `Longitude` | Its position on the globe |
| Each destination's `Transfer` | Caption displayed while that route flies |
| Each destination's `Cumulative` | Figure reached on that landing |
| Each destination's `DepartureFrame`, `LandingFrame` | Route timing in reference frames |
| `sourceFps`, `motionStopFrame` | Reference frame rate and settling point |
| `rotationDegrees`, `viewLongitude`, `viewLatitude` | Globe rotation and starting viewpoint |
| `holdDriftDegrees` | Slow globe movement after the main rotation settles |
| `arcLift`, `routeWidth` | Route height and thickness |
| `landDotSize`, `landSamples`, `seed` | Dot size, density and repeatable variation |
| Colour variables | Background, ocean, dots, routes, text, rim and pins |
| `overlayPosition` | `top` or `bottom` for the overlay output |

- The last included destination always lands on `finalNumber`.
- Earlier landings use their cumulative values. The figure changes exactly at contact.
- Keep the origin and destinations on the facing hemisphere throughout the turn. Adjust the starting viewpoint and rotation together.
- Only the origin, first destination and final destination receive map labels.
- Nearby routes use different arch heights to keep them distinct.
- Transfer captions are entered text; they are not calculated from cumulative values.
- Land comes from bundled outline data.
- The defaults use fictional city names and fictional transfer figures. Their coordinates place them on land.

## Timing

| | |
|---|---|
| Build-up before the key moment | 3.6s by default; 2s minimum |
| Hold | 1.4s by default |
| Transparent exit | Horizontal shutter closes in 0.34s |

The default reference is 30 fps. Departures are frames 8, 31, 56 and 83. Landings are frames 28, 53, 80 and 108, reaching 24, 56, 88 and 128.

Changing the key time scales those beats together. The final landing stays on the key moment. Invalid overlapping frame entries are separated to preserve route order.

The headline and starting figure are readable immediately. The globe turns while each route draws. Each landing gives the figure a short punch. The final landing adds the larger figure hit and orange rim reaction. During the hold, bright packets travel along completed routes, the origin pin gently pulses and the globe drifts. Text settles and stays put.

## Outputs

`full` stacks the oversized figure above a large globe. Required text stays clear of the top 230px and bottom 300px.

`top` places the heading and caption on the left of the header and the large figure on the right. The complete globe sits below, with room around its expanding orange ring. Shorter stages switch to a side-by-side layout. City labels stay inside the stage.

`overlay` uses a 1000px-high dark card. The heading and caption sit beside the figure across the top. The globe and its orange ring fit inside the lower card. A horizontal shutter opens on entry and closes fully before the last transparent frame.

Export dimensions and frame rate are controlled by the pack.