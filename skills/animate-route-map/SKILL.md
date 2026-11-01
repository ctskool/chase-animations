---
name: animate-route-map
description: Shortcut for /animate that makes only the route-map animation. A fictional 3D city lifts into view, a blue route crosses the river and a destination pin and trip card land.
argument-hint: <word> in <video>, or destination and trip details
disable-model-invocation: true
---

# /animate-route-map

Read `{{PACK}}/skills/animate/SKILL.md` and run it for: $ARGUMENTS

Make ONLY `route-map`, and skip step 2. Everything else, including setup, word sync, rendering and the frame check, stays in the main skill so a fix lives in one place.

- Looks like: a pale 3D city, a camera lifting behind a blue dot, a route drawing through the streets, a falling red pin and a large white trip sheet.
- Use it when: travel recaps, location beats, fictional venue illustrations, delivery and logistics explainers.
- Keep place names and geography fictional. Keep `finalMinutes` consistent with the exact `tripTime` text.
- Sync the chosen word to the exact trip time landing with the green recommendation.
- Details and limits: `{{PACK}}/blocks/route-map/README.md`.