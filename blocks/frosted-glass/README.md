# Frosted glass

A smoked-glass search floats over a defocused dusk scene. Your first word opens huge. Complete words build the query, the search docks above three results and a spring highlight stretches onto your choice.

**Key moment:** the chosen result gets a taller coral row, larger lettering and a sharp punch. Its lettering reverses to dark, and its return arrow snaps into a checkmark.

## Suits

- App and tool walkthroughs
- “How I’d find…” explainers
- Recommendations framed as a search
- Choosing one item from three results

## Doesn't suit

- Detailed dashboards or long descriptions
- More than three results
- Comparing numeric evidence
- Real screenshots or photographic backgrounds

## What to change

Run `animate vars frosted-glass` for the full list.

| Variables | What they are |
|---|---|
| `query` | The search being typed |
| `row1Title`, `row2Title`, `row3Title` | The three result names |
| `row1Label`, `row2Label`, `row3Label` | Optional second lines; empty by default |
| `selectedRow` | Result to choose: `1`, `2` or `3` |
| `textScale` | Adjust query and result type together |
| `teal`, `deepSky`, `coral`, `rose` | Dusk palette; coral confirms the choice |
| `textColor`, `labelColor` | Main type, optional labels and quieter unselected titles |
| `caretColor` | The caret’s cool accent |
| `glassTint`, `glassSmoke`, `glassBlur` | Glass colour, darkness and blur strength |
| `rimColor`, `shadowColor` | Glass edges and soft shadows |
| `grainAmount`, `backgroundDrift`, `seed` | Texture, slow movement and repeatable variation |
| `overlayPosition` | `top` or `bottom` for the overlay output |

- Use a short query and result names of roughly two to four words.
- Keep optional labels to a short phrase.
- The opening word grows to use the available width and height.
- New query words arrive whole. Existing words make room before each arrival.
- Full output uses large, deliberate two-line phrases.
- Compact results begin on one line where they fit. The chosen result can switch to larger, balanced lines at confirmation.
- Wrapping keeps whole words together and avoids a single-word final line where the wording permits.
- Text never reduces below 40px in `full` or 32px in compact outputs.
- Longer optional labels leave less room for the chosen title to grow.
- Keep the glass dark enough for the off-white type.
- Keep `deepSky` dark: it becomes the lettering on the confirmed coral row.
- Never add duplicate query text, rolling characters, photographic assets or a fade as the main transition.
- Bellhaven and all three default lodgings are fictional.

## Timing

| | |
|---|---|
| Build-up before the key moment | 3.1s by default; 1.7s minimum |
| Hold | 1.6s by default |
| Transparent exit | A horizontal shutter closes in 0.3s |

The first query word appears immediately at a large reading size. It settles in steps as complete words join it.

The completed search rises and becomes shallower. Once it has cleared the results, the populated panel snaps into place. All three names arrive together, followed by a short settle through their icons.

The highlight’s leading edge outruns its softer trailing edge. As it approaches the choice, the neighbouring rows give the chosen result more room without reducing their type.

Both highlight edges reach their final positions exactly at the key moment. On that frame, the chosen title switches to its larger measured layout, the row punches outward and turns coral, and the return arrow becomes a checkmark. A warm background pulse reinforces the confirmation.

The row settles immediately afterward and keeps its larger coral emphasis. Text stays fixed while the background drifts, a visible light travels around the panel and reflections cross the glass. The caret stops when the choice is confirmed.

The default transparent version lasts five seconds. Build-up follows word-sync timing; reactions and the hold use real seconds.

## Outputs

`full` fills the portrait safe area with a tall result group, a large two-line query and generous result type.

`top` uses its own shallower bar and tighter rows. Its chosen result receives extra height for larger confirmation type.

`overlay` has a separate layout inside a 920px-high card and enters and leaves through a horizontal shutter.

Shorter stages spend spare row padding before reducing type. Keep copy brief in a short custom stage.

Reflections stay within the glass boundaries throughout their movement.

The background and its glass blur are procedural. The block uses no live backdrop filter, external image or texture file.