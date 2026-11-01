# Magazine layout

A large dusk painting bleeds to the left edge of cool paper. A confident two-line serif headline and one complete excerpt are readable immediately. Red handwriting points to a specific silver reflection.

**Key moment:** the underline and a short reinforcing stroke on the reflection circle finish together. The circled light punches on that frame. The pen settles into a slightly heavier lasting mark.

## Suits

- Short essays, quotes and reading recommendations
- Considered product stories
- A quiet visual passage inside a talking-head short

## Doesn't suit

- Dense articles or long annotations
- Fast lists, statistics or loud announcements
- Notes requiring characters outside the supported handwriting alphabet

## What to change

Run `animate vars magazine-layout` for the full list.

- `headlineLine1`, `headlineLine2`: two short phrases; the second is italic.
- `bodyText`: the source passage. Other line breaks reflow; blank lines separate paragraphs.
- `excerptSentences`, `compactExcerptSentences`, `overlayExcerptSentences`: maximum complete sentences to show in each output.
- `note`: two or three short handwritten words.
- `caption`: an optional short italic caption.
- The headline, body and note size controls: independent maximum sizes for full, top and overlay.
- `headlineIndent`, `bodyLineSpacing`, `paragraphSpacing`, `columnGutter`: spacing.
- The three painting width controls: how much of each stage the painting occupies.
- `noteTilt`, `penWidth`, `handwritingSpeed`: the pen's character and pace.
- `reflectionX`, `reflectionY`, `focusRadius`: position and size of the circled detail. The painted glint and arrow follow these controls together.
- `photoPush`, `photoOffset`: the opening image settle.
- `payoffPunch`: the circled light's enlargement at the key moment.
- `holdDrift`: slow movement in the water and reflected light.
- `paperColor`, `inkColor`, `penColor`: cool paper, print and ballpoint colours.
- `seaDark`, `seaLight`, `skyColor`: painting colours.
- `ruleThickness`, `grainStrength`, `seed`: rule, texture and reproducible variations.
- `imageDescription`: accessible painting description.
- `overlayPosition`: `top` or `bottom`.

The sample passage is preserved in the controls. Full defaults to its first two complete sentences; top and overlay default to its first sentence.

The excerpt is selected once before animation. It always starts at the beginning of the passage and stays unchanged. Sentences that do not fit are left out entirely. There are no later pages or scrolling columns.

Body size starts at 52px in full, 44px in top and 42px in overlay. The block retains that size when the first sentence fits. If necessary, it reduces size to fit the complete first sentence, stopping at 40px in full and 32px in compact outputs. If that sentence still cannot fit, shorten it; an incomplete fragment is never substituted.

Line wrapping balances whole words and avoids a lone final word. Keep headline phrases short so the headline can remain large.

Captions must fit in three lines in full or two lines in compact outputs. An overlong caption is omitted as a whole.

Handwriting reserves room for rotation, descenders and its underline. It supports Latin letters, digits and basic punctuation; accents reduce to their base letters. Each letter uses drawn pen strokes, with dots and crossbars added after the main writing.

Bodoni Moda and Newsreader use local font files. The painting, paper and pen strokes are drawn locally. Orlen and the sample passage are fictional.

**Never:**

- Warm cream, beige or sepia paper.
- A straight wipe or typewriter reveal for the note.
- Drop shadows, page curls or photo frames.
- Fade entrances.

## Timing

| | |
|---|---|
| Build-up before the key moment | 2.9s by default; 2.3s minimum |
| Hold | 1s by default |
| Transparent exit | Upward blind closure in 0.3s |

Frame one already contains both headline phrases, the complete selected excerpt, the rule and most of the painting. Individual type lines make a small pressure settle. The painting's remaining upper edge opens upward as its gentle push settles.

The tight circle draws quickly at 0.56s. A looped arrow follows, with its arrowhead flicked on separately. After a short beat, “stay here” writes along the actual letter strokes at about eight letters a second.

The writing finishes just before the concluding beat. The underline and a short confirming stroke on the circle both finish exactly at the key moment. The named reflection enlarges sharply and settles just after it.

The painting's crop stays fixed after its opening settle, keeping the arrow and circle registered to their target. Independent water marks and light layers continue moving through the shorter hold. Printed text and handwriting stay put.

Word synchronization scales the build-up. Hold and exit use real seconds. The exit is fully closed one frame before the end.

## Outputs

`full` uses the portrait safe area, a large two-line headline, a tall painting bleeding left and a reading column separated by a wider gutter. The large handwritten note occupies the lower right margin.

`top` uses its own headline size, painting width, gutter and handwriting reserve. It keeps the two-line headline and a shorter complete excerpt beside the broad painting.

`overlay` uses a wider painting, its own type sizes and a slightly shallower handwritten margin on a 960px-high paper card. The card enters and exits through a vertical blind.

Shorter compact stages reduce headline size and reserve a shallower note area. Their excerpt still begins with the first sentence and never changes during playback.