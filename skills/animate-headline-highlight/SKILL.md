---
name: animate-headline-highlight
description: Shortcut for /animate that makes only the headline-highlight animation. An angled newspaper flies in, lime ink marks a sentence, and a quoted post lands as the receipt.
argument-hint: <word> in <video>, or the article, sentence and quoted post
disable-model-invocation: true
---

# /animate-headline-highlight

Read `{{PACK}}/skills/animate/SKILL.md` and run it for: $ARGUMENTS

Make ONLY `headline-highlight`, and skip step 2. Everything else, including setup, word sync, rendering and the frame check, stays in the main skill so a fix lives in one place.

- Looks like: a newspaper flies in on a weighted 3D tilt over blurred, drifting articles; a dolly approaches the paragraph; rough lime highlighter marks the selected sentence line by line; a quoted post pops in afterward.
- Use it when: news commentary, documentary evidence, or a claim backed by a short source and receipt.
- Put the exact passage to mark in `keySentence`, copied from `paragraph`. Sync the chosen spoken word to the final highlighter stroke.
- Keep the headline short and the quoted post concise. Compact outputs focus on the selected sentence.
- Details and limits: `{{PACK}}/blocks/headline-highlight/README.md`.