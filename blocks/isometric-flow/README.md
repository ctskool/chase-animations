# Isometric flow

A miniature town on a white slab, in real 3D. Three buildings pop out of the ground one after another, the road's centre line draws itself, parcels hop into a van, and the van drives to the last building, where the number turns into a check.

**Key moment:** the van brakes at the last step and its number turns into a check.

## Suits

- "How it works" explainers
- Business models, supply chains, content pipelines
- Anything with exactly three steps that hand off to each other

## Doesn't suit

- Fewer or more than three steps
- Processes where nothing really moves from step to step
- Precise diagrams. It's a friendly picture of a process, not a flowchart

## What to change

Run `animate vars isometric-flow` for the full list.

| Variables | What they are |
|---|---|
| `title` | One line above the diorama. Long titles shrink to fit |
| `step1Name`, `step1Time` and so on | The word and small line on each label. Keep names to one or two words |
| `color1`, `color2`, `color3` | One colour per step. Trees and parcels follow `color1` |
| `chip`, `check`, `slab`, `road`, `ink`, `bgTop`, `bgBottom` | The other colours |
| `overlayPosition` | `top` or `bottom`, for the overlay output |

The buildings are always a warehouse, an office block and a shop. The van is always a van. Those aren't variables yet.

## Timing

| | |
|---|---|
| Build-up before the key moment | 3.2s by default, 1.8s at the shortest |
| After the key moment | 1.5s, then it closes in a diamond in 0.36s when placed in a video |

The camera keeps a slow drift through the hold, so it's never frozen mid-video.

## Outputs

`full` centres the diorama with the title above it. `top` fills the frame. `overlay` has no background, so the slab floats over your footage and the title sits on a white pill.

3D frames take longer to render than the other two animations. Add `--draft` while you're changing words.
