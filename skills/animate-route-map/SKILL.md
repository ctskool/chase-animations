---
name: animate-route-map
description: Shortcut for /animate that makes only the route-map animation. A fictional or real 3D city lifts into view, a blue route draws through its streets and a destination pin and trip card land.
argument-hint: <word> in <video>, and the real route or the trip details
disable-model-invocation: true
---

# /animate-route-map

Read `{{PACK}}/skills/animate/SKILL.md` and run it for: $ARGUMENTS

Make ONLY `route-map`, and skip step 2. Everything else, including setup, word sync, rendering and the frame check, stays in the main skill so a fix lives in one place.

- Looks like: a pale 3D city, a camera lifting behind a blue dot, a route drawing through the streets, a falling red pin and a large white trip sheet.
- Use it when: travel recaps, location beats, real trips, recorded runs and rides, fictional venue illustrations, delivery and logistics explainers.
- If they name real places or give a GPX file, follow "Use a real route" in the block's README before rendering. Show them the places it found and the trip details, and use any real time they gave with `--minutes`.
- If it's a fictional city, keep place names and geography fictional. Keep `finalMinutes` consistent with the exact `tripTime` text.
- Sync the chosen word to the exact trip time landing with the green recommendation.
- Details and limits: `{{PACK}}/blocks/route-map/README.md`.