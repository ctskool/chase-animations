# Headline Highlight

A large newspaper arrives on a weighted 3D tilt over drifting article shapes. The camera glides toward the evidence, rough lime ink sweeps across the selected sentence, and an attributed reaction pops in after a short reading beat.

**Key moment:** the last stroke reaches its chisel end, a slim margin mark locks beside the passage, and the page gives a small depth punch.

## Suits

- News commentary and documentary source shots
- A claim followed by an attributed reaction
- Talking-head shorts that need one clear piece of evidence

## Doesn't suit

- Long passages that need uninterrupted reading
- Several competing claims or sources
- A screenshot that must retain its exact original layout

## What to change

Run `animate vars headline-highlight` for the full list.

| Variables | What they are |
|---|---|
| `masthead`, `headline`, `paragraph` | Publication and source copy |
| `keySentence` | Exact passage from the paragraph to display and highlight |
| `section`, `byline`, `readingTime` | Visible article details when space allows |
| `articleDate`, `navigation`, `strapline`, `edition`, `footer` | Retained publication fields, omitted from these layouts |
| `post` | Reaction arriving after the highlight |
| `postName`, `postHandle`, `postInitials`, `postDate` | Post identity |
| `verified` | Whether the blue verification tick appears |
| `backgroundHeadline1` to `backgroundHeadline9` | Influence the decorative wall's headline shapes |
| `headlineSize`, `bodySize`, `postSize` | Starting type sizes, adapted separately for each output |
| `pushIn` | Strength of the dolly toward the passage |
| Colour variables | Paper, ink, lime, section red, post, background and shadows |
| `overlayPosition` | `top` or `bottom` for the overlay output |

- Copy `keySentence` directly from `paragraph`, including punctuation.
- An empty or unmatched key sentence displays and highlights the whole paragraph.
- Aim for a headline under 75 characters, a selected passage under 125 characters and a post under 100 characters.
- Surrounding paragraph copy is omitted so the evidence can stay large.
- Whole-word lines are balanced before animation to discourage short final lines.
- Reading sizes start large and reduce together only when the article and reaction need more room.
- Font sizes retain a 40px minimum in full and 32px in compact outputs.
- Before the reaction arrives, the paper owns the available reading area.
- On unusually short custom stages, the reaction replaces the paper after the key moment.
- Defaults are fictional. Names, publications, places, events and figures are illustrative; replace them with your own attributed source.

## Timing

| | |
|---|---|
| Build-up before the key moment | 2.8s by default; 1.6s minimum |
| Hold after the highlight | 2.2s by default |
| Paper docking | Starts 0.06s after the key and lasts 0.24s |
| Reaction arrival | Starts 0.4s after the key |
| Reaction settle | Scale lands first; tilt finishes 0.41s after arrival |
| Transparent exit | A closing slit over 0.3s |

The opening paper makes a short diagonal move with a pronounced 3D tilt. A quick attack carries it slightly past rest, followed by a controlled counter-swing. The slower dolly overlaps this settle and lands gently during the highlighting sequence.

Each ink stroke starts quickly and brakes toward its chisel end. A brief pause separates the lines. The final stroke completes exactly at the key moment, accompanied by a small depth punch and a slim margin mark. Lime stays beside and behind the evidence; there is no fluorescent page border.

The paper docks upward after the highlight finishes. A short reading beat follows before the reaction snaps up with a scale overshoot. Its tilt settles slightly later, keeping the two layers distinct. These timings compress when the hold is shorter than 1.2s.

After settling, reading text stays fixed while the blurred wall continues drifting and the page shadow changes gently.

Changing the key time retimes the arrival, dolly and highlighting together. Transparent outputs close completely before the last frame.

## Outputs

`full` uses a broad paper and large passage, with the final article-and-reaction stack between the portrait safe margins.

`top` uses its own larger compact type and tighter spacing to occupy the shorter frame.

`overlay` has a separate compact layout inside the 960px-high card, with a transparent surround and slit entry and exit.

Ink follows the measured, balanced lines. Rough edges, faint streaks, darker first touches and chisel ends retain the physical highlighter look.

Keep the weighted paper arrival, smooth dolly, rough lime ink, pause before the reaction and drifting article wall. Avoid flat screenshots, clean rectangular highlights, fading entrances and real brands or logos in defaults.