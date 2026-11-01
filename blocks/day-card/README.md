# Day card

A huge red DAY and dark number sit above a white wall calendar. A red outline follows the active date as handwritten checks draw. The final beat circles the large number and stamps its calendar date solid red.

**Key moment:** the exact final number reaches its largest pose, its circle is complete, and the final calendar date is stamped red with a finished white check.

## Suits

- Daily challenges and streaks
- “30 days of” videos
- Posting, practice and build-in-public progress

## Doesn't suit

- More than one month
- Long counter headings or weekday names
- Progress that needs several different status colours

## What to change

Run `animate vars day-card` for the full list.

| Variables | What they are |
|---|---|
| `label`, `headingWord` | Caption and large DAY heading |
| `startingDay`, `finalDay` | First and last counter values |
| `month`, `calendarDays` | Month name and number of dates |
| `firstWeekday` | Placement of date 1 in the Monday-first grid |
| `weekday1` to `weekday7` | Short weekday labels |
| `red`, `ink` | Marker accent and main dark text |
| `labelColor`, `dateColor` | Supporting text |
| `backgroundTop`, `backgroundBottom`, `paperColor`, `cellColor` | Background, paper and calendar colours |
| `markerWidth`, `grainOpacity`, `seed` | Marker weight, grain and repeatable stroke variations |
| `overlayPosition` | `top` or `bottom` |

- Defaults show THE DAILY PRACTICE, DAY 1 through DAY 30, and APRIL with 30 dates starting on Monday. No year is implied.
- Dates through the starting day are already checked.
- The final day is limited to the calendar length; the starting day is limited to the final day.
- Change the month length and first weekday together to match your calendar.
- Use a short heading and abbreviated weekday labels.
- The final stamp uses `paperColor` for its date and check. Keep that colour clearly readable against `red`.
- Keep one red accent, neutral paper and clean type. Avoid red glows, type shadows and additional accent colours.
- Defaults are sample content; enter your own challenge progress.

## Timing

| | |
|---|---|
| Build-up before the key moment | 4s by default; 2.4s minimum |
| Hold | 1s by default |
| Transparent exit | Centre shutter closes in 0.3s |

The opening days pause clearly. The middle accelerates, then the last three days slow into separate beats.

Each whole number changes on the same frame its date gains focus and its check starts drawing. The heading punches as one piece, with both parts on a shared baseline.

The final number arrives just before the key. Its circle draws quickly while the heading grows into its largest pose exactly at the key. The final calendar stamp stays within its surrounding gutters.

The heading then settles into a slightly enlarged held pose. A short paper reaction follows without shifting the calendar lettering.

During the hold, a broad marker nib travels around the completed oval, visibly changing its outline. The readable text stays fixed after its settle, and fine paper grain drifts.

## Outputs

`full` fills the portrait safe area with the counter and a calendar that stretches to use the remaining height. Dates use 60px type.

`top` gives more height to the hero counter by tightening the calendar header and row spacing. Dates use 44px type and weekday labels use 34px.

`overlay` uses a 960px-high paper card, its own counter size, the compact calendar header and a centre shutter for entry and exit.

Checks curve underneath and beside their dates, keeping the numerals clear. The counter adjusts for five-row and six-row months.

Shorter compact stages reduce the heading and spacing first. Their dates use 36px type, with labels and weekdays at least 32px.