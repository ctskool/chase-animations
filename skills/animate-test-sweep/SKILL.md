---
name: animate-test-sweep
description: Shortcut for /animate that makes only the test-sweep animation. A red test wall flips green in an accelerating wave and lands on the exact passing total.
argument-hint: <word> in <video>, or the test total and suite
disable-model-invocation: true
---

# /animate-test-sweep

Read `{{PACK}}/skills/animate/SKILL.md` and run it for: $ARGUMENTS

Make ONLY `test-sweep`, and skip step 2. Everything else, including setup, word sync, rendering and the frame check, stays in the main skill so a fix lives in one place.

- Looks like: a dense wall of red tests flipping green behind a running mascot, ending when the last flip completes the giant counter and the mascot lands on its green plate.
- Use it when: showing a clean test run or the final passing check after a coding session.
- Details and limits: `{{PACK}}/blocks/test-sweep/README.md`.