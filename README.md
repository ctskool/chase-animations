# Chase Animations

Finished animations for vertical video, for members of Chase AI Plus. Pick one, give it your words and numbers, and land its key moment on a word you say.

Each animation is a tested [HyperFrames](https://hyperframes.heygen.com) block with text, numbers and colours you can edit, not a prompt you hope comes out right.

| Animation | What it does | Key moment |
|---|---|---|
| [`head-to-head`](blocks/head-to-head/README.md) | Two options compared row by row, ending on one payoff stat | The last bar lands |
| [`isometric-flow`](blocks/isometric-flow/README.md) | A 3D diorama of a three-step process | The van arrives and the last step checks off |
| [`screen-zoom`](blocks/screen-zoom/README.md) | The cursor leads the camera to one button, and it clicks | The click |

Every animation comes in three outputs:

| Output | Size | Use it for |
|---|---|---|
| `full` | 1080x1920 | A full-screen cutaway |
| `top` | 1080x960 | The top half of a split-screen, with you below |
| `overlay` | 1080x1920, transparent | Floating over you |

## Start here

Follow [docs/INSTALL.md](docs/INSTALL.md). It takes about ten minutes, most of it downloads.

Then in Claude Code:

```text
/animate head-to-head on the word "cheaper" in my-video.mp4, Cursor vs Claude Code
```

Claude asks for anything it's missing, renders it, checks the frames and gives you the file. You can also jump straight in with `/animate-head-to-head`, `/animate-isometric-flow` or `/animate-screen-zoom`.

Prefer the terminal? [docs/COMMANDS.md](docs/COMMANDS.md) has everything.

## What works where

| | |
|---|---|
| Windows 11 | Tested |
| Mac | **Untested.** It may work, but nobody has run it yet. Tell Chase how it goes |
| Linux | Untested |

Finished video is yours to use in your own content. The pack itself is for Chase AI Plus members, so please don't share it. Fonts and third-party licences are listed in [docs/CREDITS.md](docs/CREDITS.md).
