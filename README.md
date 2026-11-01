# Chase Animations

Finished animations for vertical video, for members of Chase AI Plus. Pick one, give it your words and numbers, and land its key moment on a word you say.

Each animation is a tested [HyperFrames](https://hyperframes.heygen.com) block with text, numbers and colours you can edit, not a prompt you hope comes out right.

## The 28 animations

### Compare and prove

| Animation | What it does | Key moment |
|---|---|---|
| [`head-to-head`](blocks/head-to-head/README.md) | Two options compared row by row, ending on one payoff stat | The final bar and winner tick land |
| [`before-after`](blocks/before-after/README.md) | A handle wipes a website from its old design to its new one | The last product card lands |
| [`ranking-bars`](blocks/ranking-bars/README.md) | Bars race through changing years with one hero to follow | The final year and result land |
| [`money-stat`](blocks/money-stat/README.md) | One huge counter climbs a chart past its turning point | The exact final number punches |
| [`notification-stack`](blocks/notification-stack/README.md) | Orders flood a lock screen while the total counts up | The final order lands and the total slams |
| [`post-receipt`](blocks/post-receipt/README.md) | A social post with racing counts and quote replies | The red underline finishes |
| [`headline-highlight`](blocks/headline-highlight/README.md) | A newspaper flies in and a highlighter marks the evidence | The highlighter stroke ends |
| [`evidence-desk`](blocks/evidence-desk/README.md) | Papers on a desk with a figure circled in red | The circle closes on the figure |
| [`day-card`](blocks/day-card/README.md) | A huge day counter stamps through a calendar | The final number is circled |

### Products and apps

| Animation | What it does | Key moment |
|---|---|---|
| [`screen-zoom`](blocks/screen-zoom/README.md) | The cursor leads the camera to one button, and it clicks | The button turns to Published |
| [`app-launch`](blocks/app-launch/README.md) | A studio phone receives a transaction and completes it | The transfer reaches its exact amount |
| [`laptop-reveal`](blocks/laptop-reveal/README.md) | A laptop opens, wakes on your product and scrolls it | The product name stamps into place |
| [`apple-one-take`](blocks/apple-one-take/README.md) | A dot morphs through a button, a planner and a phone in one take | The red full stop lands |
| [`frosted-glass`](blocks/frosted-glass/README.md) | A glass search bar docks above results and picks one | The highlight seats on the chosen row |
| [`exploded-teardown`](blocks/exploded-teardown/README.md) | A product opens into labelled layers | All five layers lock beside their labels |

### Explain a process or place

| Animation | What it does | Key moment |
|---|---|---|
| [`isometric-flow`](blocks/isometric-flow/README.md) | A 3D diorama of a three-step process | The van arrives and the last step checks off |
| [`timeline-3d`](blocks/timeline-3d/README.md) | A moving rail passes oversized milestone cards | The playhead stops at the final milestone |
| [`globe-arcs`](blocks/globe-arcs/README.md) | Routes cross a dotted globe while a figure counts up | The last route touches down |
| [`route-map`](blocks/route-map/README.md) | A route draws through a pale 3D city with live trip stats | The pin lands and the final time punches |
| [`pencil-blueprint`](blocks/pencil-blueprint/README.md) | A graphite sketch becomes a white-on-blue technical drawing | Both measurements stamp |

### Styled titles

| Animation | What it does | Key moment |
|---|---|---|
| [`blue-editorial`](blocks/blue-editorial/README.md) | An ultramarine cover with frame-filling italic words | The last word peaks and the underline strikes |
| [`swiss-grid`](blocks/swiss-grid/README.md) | A black circle and red field in a strict Swiss grid | The third phrase settles |
| [`magazine-layout`](blocks/magazine-layout/README.md) | A painted image, a serif headline and a real text column | The handwritten underline finishes |
| [`risograph`](blocks/risograph/README.md) | A two-ink poster prints in stepped passes | The ink plates snap into register |
| [`ink-wash`](blocks/ink-wash/README.md) | Mountains, a red sun and a small boat on rice paper | The boat reaches open water |
| [`glow-orb`](blocks/glow-orb/README.md) | A soft breathing orb above one line of type | The closing phrase lands on the breath |
| [`retro-crt`](blocks/retro-crt/README.md) | A beam opens into a huge phosphor title with a terminal line | The status lands and the title snaps tall |
| [`oscilloscope`](blocks/oscilloscope/README.md) | A green signal folds through figures and writes your words | The last letter lands |

Every animation comes in three outputs:

| Output | Size | Use it for |
|---|---|---|
| `full` | 1080x1920 | A full-screen cutaway |
| `top` | 1080x960 | The top half of a split-screen, with you below |
| `overlay` | 1080x1920, transparent | Floating over you |

## Start here

Follow [docs/INSTALL.md](docs/INSTALL.md). It takes a few minutes, most of it downloads.

Then in Claude Code:

```text
/animate head-to-head on the word "cheaper" in my-video.mp4, Cursor vs Claude Code
```

Claude asks for anything it's missing, renders it, checks the frames and gives you the file. Every animation also has its own command, such as `/animate-head-to-head` or `/animate-glow-orb`.

Prefer the terminal? [docs/COMMANDS.md](docs/COMMANDS.md) has everything.

## What works where

| | |
|---|---|
| Windows 11 | Tested |
| Mac | **Untested.** It may work, but nobody has run it yet. Tell Chase how it goes |
| Linux | Untested |

The pack is for Chase AI Plus members, so please don't share it. Fonts and third-party licences are listed in [docs/CREDITS.md](docs/CREDITS.md).
