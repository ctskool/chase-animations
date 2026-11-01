---
name: animate-agent-fan-out
description: Shortcut for /animate that makes only the agent-fan-out animation. One prompt branches into parallel agents with live statuses, then their mascots merge onto one result slab.
argument-hint: <word> in <video>, or the agents and what they finished
disable-model-invocation: true
---

# /animate-agent-fan-out

Read `{{PACK}}/skills/animate/SKILL.md` and run it for: $ARGUMENTS

Make ONLY `agent-fan-out`, and skip step 2. Everything else, including setup, word sync, rendering and the frame check, stays in the main skill so a fix lives in one place.

- Looks like: one Claude Code prompt branching into a two-column grid of coloured subagents, each with its own working mascot and completion beat, ending with every mascot landing on one green result slab.
- Use it when: showing parallel work that all finished, with the last completion synced to the spoken payoff.
- Details and limits: `{{PACK}}/blocks/agent-fan-out/README.md`.