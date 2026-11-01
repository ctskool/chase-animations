# Risograph

A cool-paper poster prints itself in fluorescent pink and blue. Huge lettering, screened circles and a striped paper-knockout word form one bold announcement.

NIGHT prints first. The pink circle travels in from the left, then the blue circle from the right. Each stops with a single impact frame. They pause apart before converging: the violet lens appears when the inks meet, followed by a small recoil.

SHIFT descends larger than its finished size and stamps onto the overlap. Its impact shoves NIGHT and both circles, then everything settles before the dots and practical details finish printing.

**Key moment:** one brief misregistration snaps into the fixed reading register exactly at the key time. The entire poster punches to 1.03 scale and settles. The dot ramp stays one step denser as proof that the print finished.

## Suits

- Event promos, music nights and print fairs
- Zines and handmade announcements
- Short headlines inside talking-head videos

## Doesn't suit

- Paragraphs or detailed schedules
- Long headline sentences
- Smooth corporate motion

## What to change

Run `animate vars risograph` for the full list.

| Variables | What they are |
|---|---|
| `headlineLine1`, `headlineLine2` | The large top word and paper-knockout word |
| `topLine` | Organizer and edition, or another short introduction |
| `footerLine1`, `footerLine2` | Event name and practical details |
| `paper`, `pink`, `blue` | Paper and the only two inks |
| `tracking` | Headline letter spacing |
| `registration` | The normal ink fringe, fixed after the snap |
| `slipDistance` | Total separation between both inks during the brief misregistration; maximum 18px |
| `slipFrames` | Two or three frames immediately before the key moment |
| `impactShove` | The 8–12px shove caused by the knockout stamp |
| `finishOvershoot` | The completed poster's scale punch, up to 1.03 |
| `holdPush` | The slow push after the poster settles, up to one percent |
| `knockoutClearance` | Width of the quiet ink contour around the white lettering |
| `grainAmount`, `paperTexture`, `edgeRoughness` | Ink density, fibres, pinholes and irregular edges |
| `halftoneCell`, `dotCount` | Screen size and the growing dot ramp |
| `stripeWidth`, `stripeCrawl` | Diagonal stripes and their slow travel |
| `seed` | A repeatable variation of the print |
| `overlayPosition` | `top` or `bottom` |

- Use one short word per headline. Four to eight letters work best.
- Keep the introduction and event name concise. All lettering prints in capitals.
- Practical details use up to two lines. With three slash-separated sections, the last section becomes the venue line. A `|` also sets a line break.
- Longer supporting lines wrap between whole words.
- Supporting copy uses real text elements so the checks can inspect it.
- The violet is produced by multiplying the pink and blue plates. It is never a separate ink.
- The sample club, venue and event details are fictional.
- Never use warm cream or bone paper, extra inks, smooth motion or motion blur.
- Never remove the grain to leave flat colour and clean vector edges.
- Never use gradients for shading. The screened tones are individual dots.

## Timing

| | |
|---|---|
| Build-up before the key moment | 3.2s by default; 2.9s minimum |
| Registration snap | Final three frames before the key moment; adjustable to two |
| Hold | 1.5s by default |
| Transparent exit | Stepped paper wipe in 0.3s |

At the default timing and 30 fps:

- NIGHT is already printing on frame 0.
- The pink pass starts on frame 4 and stops on frame 8.
- The blue pass starts on frame 10 and stops on frame 14.
- Both circles remain visibly separate before their approach on frame 18.
- Their overlap prints on frame 20, recoils and settles.
- SHIFT begins its enlarged descent on frame 24 and hits on frame 26. NIGHT and the circles move on that same impact frame.
- The dot ramp starts on frame 30. Event and practical details follow, with their final pass stopping on frame 40.

The completed build has more than a second to read before the registration snap. There is no long anticipation, held text split or repeated ghosting.

The default misregistration occupies only the three frames immediately before 3.2 seconds. Its maximum total separation is 16px. At 3.2 seconds, the plates return to their normal fringe exactly, the dots become denser and the entire composition hits its finishing scale.

The finishing rebound settles over four paired drawings. Keep a hold of at least 1.3 seconds to leave a full second of reading after it settles.

The settled hold keeps all words locked to the poster. A slow one-percent push, faint movement in the paper texture and crawling stripes keep it alive. Grain refreshes between drawings; the type's registration stays fixed after the snap.

Motion holds on twos except for the deliberate single-frame impacts and the two- or three-frame registration snap. Changing the key time scales the build; the brief snap retains its selected real frame count.

## Outputs

`full` keeps the portrait poster, stacked practical details and empty bottom fifth. Supporting fonts start at 68px for the introduction, 80px for the event and 72px for the date and venue.

`top` uses its own shorter headline and banner proportions, circle size and two-column footer. Supporting fonts start at 56px, 66px and 60px.

`overlay` uses the 1040px paper card, with larger headline, banner and circle allowances than `top`. Supporting fonts start at 58px, 70px and 64px. The paper and printing stay inside the card; stepped stage wipes control entry and exit and close fully before the last frame.

Longer supporting copy can reduce to 60px in `full`, 48px in `top` and 52px in `overlay`. Keep the copy short for the clearest phone-sized result.

All three layouts preserve the separated circle poses, visible violet collision, descending knockout stamp, shared impact shove and brief registration snap. The finishing scale affects the artwork and supporting copy together, with margins reserved for its overshoot.