---
name: animate-file-tree
description: Shortcut for /animate that makes only the file-tree animation. A project tree grows beneath a walking mascot, then the final file count lands on a solid plate.
argument-hint: <word> in <video>, or project paths, file count and time
disable-model-invocation: true
---

# /animate-file-tree

Read `{{PACK}}/skills/animate/SKILL.md` and run it for: $ARGUMENTS

Make ONLY `file-tree`, and skip step 2. Everything else, including setup, word sync, rendering and the frame check, stays in the main skill so a fix lives in one place.

- Looks like: a giant Claude Code folder tree with thick branches and coloured file dots. The mascot walks between branch points, then catches the final count plate and sits kicking its legs.
- Use it when: showing the project one prompt produced, especially a line such as “forty-seven files in four minutes.”
- Details and limits: `{{PACK}}/blocks/file-tree/README.md`.