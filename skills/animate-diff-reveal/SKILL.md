---
name: animate-diff-reveal
description: Shortcut for /animate that makes only the diff-reveal animation. A Claude Code diff crumples into pixels as the mascot eats deleted rows, ending on a huge minus counter.
argument-hint: <word> in <video>, or what code was removed
disable-model-invocation: true
---

# /animate-diff-reveal

Read `{{PACK}}/skills/animate/SKILL.md` and run it for: $ARGUMENTS

Make ONLY `diff-reveal`, and skip step 2. Everything else, including setup, word sync, rendering and the frame check, stays in the main skill so a fix lives in one place.

- Looks like: a large Claude Code diff with red deletions, green replacements and a mascot that eats the removed code. The huge minus counter slams as it gulps the last block.
- Use it when: a deletion, cleanup or reduction in complexity is the punchline. Sync the key moment to the spoken deletion or its total.
- Details and limits: `{{PACK}}/blocks/diff-reveal/README.md`.