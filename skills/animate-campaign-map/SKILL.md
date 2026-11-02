---
name: animate-campaign-map
description: Shortcut for /animate that makes only the campaign-map animation. Big tapered arrows surge across a printed map from place to place, then the camera pulls back to the full sweep as a hero total lands.
argument-hint: <word> in <video>, or the places and what the story is
disable-model-invocation: true
---

# /animate-campaign-map

Read `{{PACK}}/skills/animate/SKILL.md` and run it for: $ARGUMENTS

Make ONLY `campaign-map`, and skip step 2. Everything else, including setup, word sync, rendering and the frame check, stays in the main skill so a fix lives in one place.

- Looks like: the arrows on a history documentary's map. A printed atlas fills the frame, thick red arrows plant on numbered places one at a time while the camera chases them, then it pulls back to the whole sweep as every arrow flashes and the total stamps in.
- Use it when: something moved or spread, such as a company expanding, a tour, a trade route, a voyage or a campaign, at the scale of cities, countries or continents.
- For real places, run `node {{PACK}}/shared/animate.mjs campaign --move "<place> > <place>"` first and show the member the places it found. Then render with `--vars animate-vars.json`. It needs the internet once; rendering doesn't.
- Add `(east)` or `(west)` after a place to send an arrow that way round the world.
- The suggested `heroValue` is a straight-line distance. Ask for the real total, and replace the sample story's words, dates and count. Never leave invented numbers presented as real.
- `territory=on` hatches the land the arrows reach. It suits spread and takeover stories. Leave it off for journeys, because passing a coast doesn't mean holding it. `animate campaign` never sets it, so choose it with the member.
- Sync the final arrow's landing to the chosen word. Up to five moves.
- Details and limits: `{{PACK}}/blocks/campaign-map/README.md`.
