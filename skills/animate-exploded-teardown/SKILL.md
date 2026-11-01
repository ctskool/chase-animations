---
name: animate-exploded-teardown
description: Shortcut for /animate that makes only the exploded-teardown animation. A real 3D speaker opens into five labelled layers, then lands a two-line title.
argument-hint: <word> in <video>, or what to explain inside the speaker
disable-model-invocation: true
---

# /animate-exploded-teardown

Read `{{PACK}}/skills/animate/SKILL.md` and run it for: $ARGUMENTS

Make ONLY `exploded-teardown`, and skip step 2. Everything else, including setup, word sync, rendering and the frame check, stays in the main skill so a fix lives in one place.

- Looks like: a large assembled speaker pulls back and slides left; five layers spring apart from the top down, numbered leaders draw to the right, and a two-line title rises under an orange bar.
- Use it when: speaker launches, tech reviews and “what's inside” explanations.
- The geometry is a five-layer portable speaker. Changing its words does not model a different product.
- Keep the five lift beats evenly spaced and sync the final title landing to the chosen word.
- Details and limits: `{{PACK}}/blocks/exploded-teardown/README.md`.