# /vfx reference footage

Chase's own footage, shared so you can try `/vfx` before filming anything yourself.

| File | What it is |
|---|---|
| `sample.mp4` | 15 seconds of the untouched shot: the hook, "skill number one is Impeccable" and "defeating AI slop" |
| `vfx-edit.mp4` | The finished 85 second video with all seven effects on it |
| `plan.json` | Three effects on `sample.mp4`: glass widgets on the hook, the first tier-list drop, and spotlight on "AI slop" |

Try it from the pack's folder, after `npm run setup -- --vfx` and `npm run setup -- --speech`:

```bash
node shared/animate.mjs vfx prep examples/vfx/sample.mp4
```

```bash
node shared/animate.mjs vfx plan examples/vfx/plan.json
```

It writes `examples/vfx/sample-vfx.mp4`.

## How it was filmed

The camera is turned on its side so it shoots portrait. At the same distance that gives about 1.8x more view than cropping a landscape shot, which leaves room around the head for the effects behind it. Head centred, its top about a fifth of the way down the frame, a plain-ish wall a couple of metres back, the mic low on the chest.
