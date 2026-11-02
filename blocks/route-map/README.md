# Route map

A huge blue location dot opens a pale city, either a fictional one or a real place with its real streets, water, parks and 3D buildings. The camera lifts and settles early, leaving the route to drive the action. A complete trip card arrives during the journey; the default countdown changes at road turns, with a matching pulse at each turn.

**Key moment:** the last street completes, the red pin lands and the exact final time punches forward together. The route flashes green, destination rings expand and the recommendation stamps in. Dark green time text, a tinted card, a green edge and a full top rail remain after the impact.

## Suits

- Travel recaps and “where we went” reels
- A real trip, from a city walk to a cross-country drive
- A run or ride recorded on a watch or phone
- Fictional venue or store-location illustrations
- Delivery and logistics explainers
- A quick location beat inside a talking-head short

## Doesn't suit

- Turn-by-turn directions someone will rely on
- Showing several pins, or comparing two routes
- Long descriptions inside place labels
- Dark, neon or heavily branded maps

## Use a real route

```bash
node shared/animate.mjs route --from "Tower Bridge, London" --to "St Paul's Cathedral, London" --mode walk
```

```bash
node shared/animate.mjs render route-map --output all --vars animate-vars.json
```

The first command finds both places, works out the route, downloads the map around it and saves `route-map.json`. It also writes the trip's real details to `animate-vars.json`: `mapData`, `destination`, the time, the countdown, the distance and the main road. It needs an internet connection and no API key. The render doesn't use the network.

| Option | What it does |
|---|---|
| `--mode drive\|bike\|walk` | How the route is worked out. Default `drive` |
| `--via "<place>"` | Force the route through a stop or road. Repeat as needed |
| `--track <file>` | Use your exact route from a GPX or GeoJSON file. Add `--to "<name>"` to name the finish |
| `--minutes <n>` | Use the real trip time instead of the estimate |
| `--units mi\|km` | Distance units. Default depends on the country |

- Places can be names or `lat,lon`. The command prints what it found, so check it's the right one.
- The route is the routing service's pick, so it may not be the way you actually went. If it isn't, add `--via` stops or pass `--track`.
- Trip times are estimates without live traffic. Use `--minutes` when you know the real time. A GPX file with times uses those.
- The route can start with a short loop when the start sits on a one-way street. That's the real drive. Move `--from` to a nearby street to avoid it.
- The map turns so the route fills the frame. Set `mapOrientation` to `north` to keep north at the top.
- Place labels are real names beside their real locations. A name that can't sit near its place isn't shown.
- 3D buildings appear on routes up to about 15 km. Longer routes show water, green space and main roads. The very tallest towers are shortened so they don't block the route.
- The credit line above the card is required by the map's licence. Keep it.
- The place names you type are sent to OpenStreetMap's search and the routing service. Both are free shared services, so don't run this in a loop.

## What to change

Run `animate vars route-map` for the full list.

| Variables | What they are |
|---|---|
| `mapData` | A real map file from `animate route`. Leave empty for the fictional city |
| `mapOrientation` | `fit` turns the real map to fill the frame, `north` keeps north up |
| `destination` | The red pin's place name |
| `finalMinutes` | The final numeric countdown value |
| `tripTime` | Exact text shown at the key moment, such as `8 min` |
| `countdown` | Comma-separated whole values, such as `12, 11, 10, 9, 8` |
| `distance`, `button`, `fastestLabel` | Trip details, button copy and green recommendation |
| `place1`, `place2`, `place3` | Surrounding place labels on the fictional city. A real map uses real names |
| `building`, `buildingTall`, `land`, `streets`, `haze` | City and sky colours |
| `water`, `park`, `tree`, `mainRoad` | River, green spaces and pale main road |
| `route`, `pin`, `surface` | Blue route and button, red pin, white card and rims |
| `ink`, `muted`, `fastest` | Main text, grey details and green recommendation |
| `overlayPosition` | `top` or `bottom` for the overlay output |

- Keep `finalMinutes` and `tripTime` consistent.
- Four or five countdown values work best. Short lists lock to road turns; lists longer than the available streets distribute their changes along the journey.
- Values change as complete text on one baseline. The time, card and route pulse answer together.
- The countdown ends at `finalMinutes`. The key frame uses `tripTime` exactly.
- Keep map labels around 20 characters and the destination around 24. Keep the button to a short word.
- Surrounding names appear after the camera settles. A name yields its space when it cannot clear the route, pin and other names.
- Without `mapData`, all places and the city are fictional. The defaults illustrate a trip; they are not travel estimates.
- Keep the city pale and recommendation text dark. The recommendation has an opaque badge that preserves its contrast through the green flash.
- Keep numbers whole, names clear of the route and reading positions stable through the hold.

## Timing

| | |
|---|---|
| Build-up before the key moment | 3.2s by default; 1.8s minimum |
| Hold | 1.5s by default |
| Transparent exit | Closes onto the destination in 0.36s |

The opening dot is largest on the first frame. The camera rises and backs away quickly, then settles before the surrounding names appear.

The route attacks each street and brakes at its next turn. The card enters with its first time, distance and button together. Subsequent default countdown changes share their frame with a route turn and expanding pulse.

The destination name arrives just before the key. At the key, the final street completes and the pin hits the map. The final time gets the strongest punch, with a green route flash, recommendation, card rail and destination response on the same frame.

During the hold, the text settles into fixed reading positions. A travelling route glint, location pulses, destination rings, river currents and button-arrow movement keep the shot alive.

## Outputs

`full` uses a tall street plan, an oversized opening location dot and a 440px trip card inside the portrait safe area. Larger place names and details support phone viewing.

`top` uses a wide route, thicker route strokes and its own 352px card. Shorter stages use a shallower card; below 720px high, the distance and recommendation share the lower row so the map retains space.

`overlay` uses a 1000px-high city card with its own trip time and 370px trip card. It opens from the blue location dot and closes onto the red destination pin, ready to sit above or below a talking head.

The route stays clear above the 3D buildings. Its leading marker disappears on the frame the pin lands.