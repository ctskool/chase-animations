---
name: animate-screen-zoom
description: Shortcut for /animate that makes only the screen-zoom animation. A cursor leads the camera to one button and clicks it, inside a sharp app window.
argument-hint: <word> in <video>, or the screen and button
disable-model-invocation: true
---

# /animate-screen-zoom

Read `{{PACK}}/skills/animate/SKILL.md` and run it for: $ARGUMENTS

Make ONLY `screen-zoom`, and skip step 2. Everything else, including setup, word sync, rendering and the frame check, stays in the main skill so a fix lives in one place.

- Looks like: an app window on a soft backdrop. The cursor glides to a button, the camera zooms in with real motion blur, and the button clicks.
- Use it when: tutorials, product demos, one click that matters.
- Details and limits: `{{PACK}}/blocks/screen-zoom/README.md`.
