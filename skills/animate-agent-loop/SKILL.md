---
name: animate-agent-loop
description: Shortcut for /animate that makes only the agent-loop animation. Plan, Act and Check accelerate around a huge ring until a green check breaks it open.
argument-hint: <word> in <video>, or what the agent kept trying until it passed
disable-model-invocation: true
---

# /animate-agent-loop

Read `{{PACK}}/skills/animate/SKILL.md` and run it for: $ARGUMENTS

Make ONLY `agent-loop`, and skip step 2. Everything else, including setup, word sync, rendering and the frame check, stays in the main skill so a fix lives in one place.

- Looks like: a huge Plan, Act and Check track, a running mascot, an attempt counter that punches upward on failed checks, then a green breakout and a celebratory landing on the pass word.
- Use it when: explaining an agent loop or showing repeated attempts until a check passes. Sync the key moment to the spoken success word.
- Details and limits: `{{PACK}}/blocks/agent-loop/README.md`.