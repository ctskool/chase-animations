---
name: animate-terminal-run
description: Shortcut for /animate that makes only the terminal-run animation. A Claude Code session types a prompt, stacks up tool calls, and ends on a green result slab.
argument-hint: <word> in <video>, or what the session did
disable-model-invocation: true
---

# /animate-terminal-run

Read `{{PACK}}/skills/animate/SKILL.md` and run it for: $ARGUMENTS

Make ONLY `terminal-run`, and skip step 2. Everything else, including setup, word sync, rendering and the frame check, stays in the main skill so a fix lives in one place.

- Looks like: a real Claude Code session with the mascot working in the status bar, ending when it lands on a big result slab.
- Use it when: showing what one prompt got done.
- Details and limits: `{{PACK}}/blocks/terminal-run/README.md`.
