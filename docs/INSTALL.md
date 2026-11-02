# Install

Windows 11 is tested. Mac and Linux are untested, so expect to troubleshoot there.

## 1. What you need first

- **Claude Code**
- **Node.js 22 or newer**, from [nodejs.org](https://nodejs.org). Check with `node -v`.
- **FFmpeg**. Check with `ffmpeg -version`. To install it:

  Windows:

  ```bash
  winget install Gyan.FFmpeg
  ```

  Mac (untested):

  ```bash
  brew install ffmpeg
  ```

  Close and reopen your terminal afterwards.

About 1.5 GB of free space covers the render browser and the speech model.

## 2. Put the pack somewhere permanent

Clone it into a folder you'll keep, like `Documents`:

```bash
git clone https://github.com/ctskool/chase-animations.git
```

No Git? Use **Code > Download ZIP** on GitHub and unzip it somewhere permanent. The slash commands point at this folder, so if you move it, run step 4 again.

## 3. Install what it depends on

Open a terminal in that folder:

```bash
npm install
```

## 4. Set up the slash commands and render browser

```bash
npm run setup
```

This adds `/animate`, its shortcuts and `/explain` to `~/.claude/skills`, and downloads the browser that renders your video.

## 5. Add word sync

Word sync and `/explain` need a speech model. It's about 640 MB and runs on your computer, so your video never leaves your machine.

```bash
npm run setup -- --speech
```

Skip this if you only want `/animate` clips for your own editor. You can run it later.

## 6. Prove it works

```bash
npm test
```

```bash
node shared/animate.mjs render head-to-head --output top --draft
```

You should get `renders/head-to-head-top.mp4` after a minute or so. Open it and watch it.

Restart Claude Code, then type `/animate`.

## Updating

Run `git pull` in the pack's folder, or unzip the new version over the old one. Then run `npm install` and `npm run setup`.

## When something goes wrong

| What you see | What to do |
|---|---|
| `ffmpeg isn't installed` | Install it (step 1), then open a new terminal |
| `Dependencies aren't installed yet` | Run `npm install` in the pack's folder |
| `Couldn't transcribe` | Run `npm run setup -- --speech`, or pass `--at <seconds>` instead of a word |
| `/animate` isn't there | Restart Claude Code. If it's still missing, run `npm run setup` again |
| Render is very slow | Add `--draft` while you're making changes |
| Render fails on a machine with 8 GB of memory or less | Close Chrome and other heavy apps, and render one output at a time |
| Anything else | Run `npx hyperframes doctor` and post the result in [an issue](https://github.com/ctskool/chase-animations/issues) |
