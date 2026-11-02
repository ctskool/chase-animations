# Campaign map

The sweeping arrows on a map from a history documentary, for any story about how something moved or spread: a company expanding, a trend crossing the world, a trade route, an empire, a tour, a voyage. A real map fills the frame, printed like an old atlas with engraved lines along every coast. Big tapered arrows surge across it one at a time, thick at the tail and sharp at the head. Each one plants on a numbered place with a date, a ring pulses out and the count ticks. The camera chases every arrow.

**Key moment:** the final arrow plants with the biggest hit. Every earlier arrow flashes gold, a ring wave and colour wash roll out across the map from the last place, the camera lands on the whole sweep and the total and hero line stamp in together.

## Suits

- A company, product or idea spreading to new places
- Tours, journeys and trade routes
- Historic voyages and campaigns
- Anything said as "from here, to here, to here" at the scale of cities, countries or continents
- Round-the-world and across-the-Pacific stories, which draw as one unbroken line

## Doesn't suit

- A route along real streets. Use `route-map`
- More than five moves
- Places a few streets apart. The map works at city scale and above
- A precise path. The arrows are curved arcs between places, not the route anyone actually took

## Use real places

The default map is offline and shows the bundled world outlines, with a true story as the sample. For a detailed map with coastlines and country borders:

```bash
node shared/animate.mjs campaign --move "Lisbon > Rio de Janeiro" --move "Rio de Janeiro > Manila (west)" --move "Manila > Lisbon (west)" --stage "1519" --stage "1520" --stage "1522"
```

```bash
node shared/animate.mjs render campaign-map --output all --vars animate-vars.json
```

The first command finds the places, prints what it found and downloads the map around them. It saves `campaign-map.json` and writes the details to `animate-vars.json`: `mapData`, each place, a date or stage for each move, the count and a suggested total. It needs an internet connection and no API key. The render doesn't use the network.

| Option | What it does |
|---|---|
| `--move "<place> > <place>"` | One arrow. Add more `>` for a chain, and repeat for more moves, up to five arrows |
| `(east)` or `(west)` after a place | Sends that arrow that way round the world. Otherwise it takes the short way |
| `--stage "<text>"` | The date or stage of each move, in order. Repeat as needed |
| `--units mi\|km` | Units for the suggested total. Default depends on the country |
| `--save <file>` | Where the map goes |
| `--vars <file>` | Where the details go |

- Check the places it prints. A short name can find the wrong town. Add the country, or pass `lat,lon`.
- Your own words go on the map, not the search result.
- Arrows don't have to chain. `--move "London > Tokyo" --move "London > Sydney"` sends two arrows from London.
- `heroValue` starts as the straight-line distance between the places, which isn't the real journey. Replace it with your real total.
- The credit at the foot of the frame is required by the map's licence, so it has its own small plate and strip. Keep it.
- The place names you type are sent to OpenStreetMap's search. It's a free shared service, so don't run this in a loop.

## What to change

Run `animate vars campaign-map` for the full list.

| Variables | What they are |
|---|---|
| `mapData` | A map file from `animate campaign`. Leave empty for the offline world map |
| `mapStyle` | `parchment` or `ink`. A colour you set yourself always wins |
| `title` | Optional title. Leave empty for just the count |
| `origin`, `originStage` | The starting place and its date |
| `place1` to `place5` | Where each arrow lands. Leave one empty to skip that move |
| `stage1` to `stage5` | The date or stage of each move |
| `lat1`, `lon1` and so on | Where each place is, plus `originLat` and `originLon`. Not used with `mapData` |
| `bend1` to `bend5` | Curve of each arrow, from -0.4 to 0.4. Empty picks one that bows away from the middle of the map |
| `routeShape` | `chain` has each arrow leave the last place, `hub` has every arrow leave the first. Not used with `mapData` |
| `countLabel`, `countStart`, `count1` to `count5` | The small count. It can tick up or down, and numbers roll as each arrow flies |
| `heroValue`, `heroLine` | The total and line that stamp in at the key moment |
| `tilt` | Map tilt in degrees. 0 is flat |
| `territory` | `on` tints the land the arrows reach as they pass. Default `off` |
| `land`, `landEdge`, `sea`, `seaDeep`, `coast`, `grid` | The map's colours |
| `arrow`, `arrowTail`, `keyline`, `flash` | Arrows, their cream outline and the key moment flash |
| `plate`, `plateText`, `stageText`, `heroText`, `table` | Plates, text and the table behind the sheet |
| `overlayPosition` | `top` or `bottom` for the overlay output |

- The default story is true: Magellan and Elcano's voyage of 1519 to 1522. Five ships left, four reached the Strait, two reached Tidore and one, the Victoria, came home. Change every word and number when you change the story.
- `territory` suits spread and takeover stories, where the land really was reached or taken. Leave it off for journeys, because it marks land near the arrows and a voyage passing a coast doesn't claim it. `animate campaign` leaves this choice to you.
- Keep place names to about 20 characters and the hero line to one sentence. Long names wrap, and very long ones crowd the short outputs.
- Without `mapData` there are no country borders, because the bundled outlines only have land.
- Small islands are missing from the offline map. A marker can sit in open sea where the island would be.
- The plates between the first and last drop their dates in the finished frame, to keep the sweep clear. Every date is on screen as its arrow lands.
- A route that circles the world ends a full turn from where it began, so the same place shows at both ends of the sheet.

## Timing

| | |
|---|---|
| Build-up before the key moment | 4.6s by default; 2.8s minimum |
| Hold | 1.5s by default |
| Transparent exit | Closes onto the final place in 0.36s |

Each arrow is one beat. Fewer moves means each one takes longer, and the last arrow always lands exactly on the key.

The camera opens tight on the first place, then swings to frame each arrow as it flies, lifting out a little on long moves. During the last arrow it pulls back to the full sweep, arriving as the arrow lands. In flight the arrow's head rides above the map, and its shadow slams shut as it plants. The marker stamps down, a ring pulses and the count settles on the new value. Older plates step aside during the close-ups and return for the reveal.

During the hold a slow sheen travels along the arrows, rings pulse at every place and the camera drifts a little.

## Outputs

`full` uses the map full frame, with a stacked hero plate inside the portrait safe area. A wide route shows as the whole map sheet lying on a table, with the title above and the hero below.

`top` uses a wider framing and a one-row hero plate. Long hero lines stack into two rows. Below 720px high the title drops away and the middle plates leave the finished frame, so the numbers carry it.

`overlay` uses a 1000px-high square card with its own framing and one-row hero plate. It opens from the first place and closes onto the last.

Framing is worked out from the places themselves, in every output. Plates are placed clear of the arrows, first for each close-up and again for the finished frame.
