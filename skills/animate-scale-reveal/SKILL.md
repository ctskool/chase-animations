---
name: animate-scale-reveal
description: Shortcut for /animate that makes only the scale-reveal animation. A stack rises beside a person while the camera pulls back through real comparisons, then the true height punches in huge.
argument-hint: <word> in <video>, or the number to make physical
disable-model-invocation: true
---

# /animate-scale-reveal

Read `{{PACK}}/skills/animate/SKILL.md` and run it for: $ARGUMENTS

Make ONLY `scale-reveal`, and skip step 2. Everything else, including setup, word sync, rendering and the frame check, stays in the main skill so a fix lives in one place.

- Looks like: a low-poly golden-hour world. A person stands by a stack of bills, the stack rises, and the camera pulls back through a house, a tower and the world's tallest building, then clouds and space. The stack slams to a stop and the true height punches in.
- Use it when: a big number means nothing until you can see it next to something real, such as money, tokens, users or tonnes stacked up.
- Work out the true height in metres yourself and set `heightMetres`, then set `heroValue` to match. Check the maths and show it: count times thickness of one item. Never guess a thickness. It works from about 20 m to 400 km.
- Comparisons are chosen by the block from real heights. Don't invent others.
- Set `units` to `imperial` for feet and miles, and write `heroValue` in the same units.
- For anything other than money, change `stack`, `stackMark` and `heroLabel`.
- Sync the stop of the stack to the chosen word. Minimum build-up is 2.8s.
- Details and limits: `{{PACK}}/blocks/scale-reveal/README.md`.
