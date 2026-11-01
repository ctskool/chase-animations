---
name: animate-money-stat
description: Shortcut for /animate that makes only the money-stat animation. A huge counter follows one monthly line chart, turning orange at a named event.
argument-hint: <word> in <video>, or your metric, monthly values and turning point
disable-model-invocation: true
---

# /animate-money-stat

Read `{{PACK}}/skills/animate/SKILL.md` and run it for: $ARGUMENTS

Make ONLY `money-stat`, and skip step 2. Everything else, including setup, word sync, rendering and the frame check, stays in the main skill so a fix lives in one place.

- Looks like: terminal-dark finance typography, one huge exact counter, a white line that turns orange at the event, and a delta chip that lands with the endpoint.
- Use it when: finance and business explainers, growth recaps or client results with eight monthly observations and one turning point.
- Match `eventMonth` to one of the month variables. Keep `value8` consistent with `finalNumber`, and supply a verified delta and source.
- Keep the event title and impact to one line each. Orange must appear only when the chart reaches the event.
- The default company and data are fictional. Never describe them as real filings.
- Details and limits: `{{PACK}}/blocks/money-stat/README.md`.