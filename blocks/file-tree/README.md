# File tree

A giant root folder opens above a fixed, low running count. Bright, thick branches grow from the pixel mascot's position. Each filename strikes as its endpoint flashes and the whole count ticks.

**Key moment:** the final filename arrives and the exact total slams onto a cream plate with a coral rim. The mascot springs onto the rim, lands with the plate and kicks its hanging feet.

## Suits

- Showing the project one prompt produced
- A build recap with a file count and completion time
- Explaining how a few folders became a working project

## Doesn't suit

- Reading source code or file contents
- Showing every file in a large repository
- Long explanations beside individual files

## What to change

Run `animate vars file-tree` for the full list.

| Variables | What they are |
|---|---|
| `root` | Root folder name |
| `paths` | File paths, one per line; folders appear automatically |
| `filesStat` | Exact final count, including its label |
| `timeStat` | Time beneath the running and final counts; leave empty to hide |
| `headerLabel` | Header beside the Claude logo |
| `accent` | Folders, mascot, Claude logo and coral plate rim |
| `sourceColor`, `testColor`, `docColor`, `otherColor` | File type colours |
| `ground`, `ink`, `muted`, `branchColor` | Background, names, supporting text and branches |
| `plateColor`, `plateInk` | Final result plate and its text |
| `showMascot`, `showLogo` | Show or hide either character element independently |
| `overlayPosition` | `top` or `bottom` for the overlay output |

- Blank path lines are ignored. Duplicate paths appear once.
- Enter file paths; a path ending in `/` is ignored.
- Shared folders are grouped in the order they first appear.
- Around ten short paths works well. Aim for sixteen total tree rows or fewer, including folders.
- Keep root names around fourteen characters or fewer and file names around twenty-four characters or fewer.
- Keep compact trees balanced between at least two top-level folders. A single long folder needs fewer paths.
- Paths can represent a selection from a larger project. The running count advances toward the total in `filesStat`.
- Test paths receive the test colour; documentation receives the documentation colour.
- The defaults illustrate a fictional build. Enter your own paths, total and time.

## Timing

| | |
|---|---|
| Build-up before the key moment | 4.2s by default; 2.6s minimum |
| Hold | 1.9s by default |
| Transparent exit | Closes the card in 0.34s |

The opening root is oversized. The running counter stays anchored near the bottom while growing rows fill the space above it.

Before each branch, the mascot winds up, changes feet and plants both feet. The stem extends, the horizontal branch draws, then the filename strikes. Its endpoint flash and file-count change happen together.

Arrivals accelerate. Once the working tree fills, departing rows disappear whole and the remaining rows jump upward by one complete row spacing. The scroll stops before the next branch draws.

The finale clears the header and gives more room to the named tree. Folder families stay together. New branches continue arriving through the key frame.

The exact total appears on the key frame. The cream and coral plate overshoots, compresses, rebounds once and settles. The mascot catches the rim and then alternates large forward kicks.

During the hold, the words stay fixed. A highlight crosses the plate, a coral signal follows the final branch and the mascot keeps kicking.

## Outputs

`full` uses an especially large opening root, widely spaced working rows and a fixed low counter. Its final tree uses one tall column for the sample paths.

`top` uses larger working names and a two-column final tree. A visible cross-branch joins both descending trunks to the same root.

`overlay` has separate card spacing, the same shared-root finale, and opening and closing wipes.

Compact cards adjust their root, plate and working-row count as their height changes. Use cards at least 640px high and shorter path lists for short cards. Readable text keeps a minimum of 40px in `full` and 32px in the compact outputs.
Claude, Claude Code and the Claude logo are Anthropic's. This pack isn't affiliated with or endorsed by Anthropic.
