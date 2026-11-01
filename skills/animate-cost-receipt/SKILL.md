---
name: animate-cost-receipt
description: Shortcut for /animate that makes only the cost-receipt animation. A thermal receipt prints item costs, tears free and receives a round stamp with the exact total.
argument-hint: <word> in <video>, or the costs and final total
disable-model-invocation: true
---

# /animate-cost-receipt

Read `{{PACK}}/skills/animate/SKILL.md` and run it for: $ARGUMENTS

Make ONLY `cost-receipt`, and skip step 2. Everything else, including setup, word sync, rendering and the frame check, stays in the main skill so a fix lives in one place.

- Looks like: a white thermal receipt feeding out in mechanical steps, with a Claude shopkeeper mascot pulling the paper and a round red-orange stamp hitting the final total.
- Use it when: revealing what one app, project or session cost, with up to four item prices.
- Details and limits: `{{PACK}}/blocks/cost-receipt/README.md`.