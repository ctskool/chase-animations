# Retro CRT

A horizontal beam opens into two huge phosphor title strikes. Large terminal words arrive beneath the title. The complete status then lands with a sharp title release, a beam flare and a warm glass flash.

**Key moment:** the complete status appears, the red indicator strikes and the title reaches its tallest pose. A bright beam flares between the title lines. The title settles larger than its opening pose.

## Suits

- Announcements and premieres
- Coming-up-next titles
- Throwbacks, night broadcasts and chapter breaks

## Doesn't suit

- Dense copy or paragraphs
- More than two short title lines
- Information that must remain visible during the final tube collapse

## What to change

Run `animate vars retro-crt` for the full list.

| Variables | What they are |
|---|---|
| `titleLine1`, `titleLine2` | Two short title lines |
| `systemText` | Terminal copy; a spaced `//` separates the channel from the status |
| `titleWidth`, `tracking`, `lineGap` | Title width and spacing |
| `fullTitleHeight`, `topTitleHeight`, `overlayTitleHeight` | Separate title proportions for each output |
| `systemSize`, `systemBrightness`, `accentSize` | Terminal type and its red indicator |
| `lockCompression` | Title height before the key moment; lower means a larger release |
| `lockPunch` | Maximum title size at the key moment |
| `shutdownDuration` | Brief final collapse in full and top |
| `bloomStrength`, `curvature`, `fringeAmount` | Warm phosphor and curved glass |
| `scanlineOpacity`, `snowOpacity`, `sheenOpacity` | Tube textures |
| `humOpacity`, `flickerAmount` | Movement during the reading hold |
| `ground`, `glass`, `core`, `bloom`, `accent`, `fringeBlue` | Main colours |
| `seed` | Repeatable texture variation |
| `overlayPosition` | Top or bottom overlay placement |

- Sample copy: AFTER / HOURS and CHANNEL 08 // LINK STABLE.
- Syncopate Bold carries the title; Share Tech Mono carries the terminal message.
- Both title lines share one type size. Empty title lines are removed.
- Keep title lines short and the terminal message near the sample length.
- Every output breaks the terminal message after its first spaced `//`.
- The complete second terminal line arrives at the key moment.
- Without a spaced `//`, the final terminal word arrives at the key moment.
- Terminal width and height are reserved before animation, keeping arriving words at a fixed left edge.
- The red indicator aligns with the final terminal line.
- The white core carries the words. Warm colour belongs in the haze.
- Glass shading and textures stay behind readable content.
- Never add a border, saturated neon outline or settled text jitter.
- Never fade the title in. It strikes as the picture opens.
- Full-output content stays clear of the top 230 and bottom 300 pixels.
- Layout reserves room for the largest punch, including clearance above the terminal.

## Timing

| | |
|---|---|
| Build-up before the key moment | 1.833s by default; 1.1s minimum |
| Hold window | 3.167s by default |
| Full and top sign-off | Final 0.22s, plus one beam frame |
| Transparent exit | 0.3s horizontal closure |

The beam splits, the picture opens and the title lines strike separately. Complete channel words arrive beneath a compressed title.

A short, accelerating release lands exactly at the key moment. The complete status appears on the same frame as the title peak, red indicator and warm flash. A fresh beam flares between the title lines, then contracts away. The title settles over 0.26 seconds.

The words stay put while a hum bar rolls, a diagonal reflection crosses the glass, snow changes and the cursor blinks. The red indicator and a low warm glow remain after the flash.

Full and top provide about 2.91 seconds of reading time after the lock at default timing and 30fps. Transparent outputs preserve the full hold and collapse during their separate exit window.

## Outputs

`full` fills the portrait safe area with tall title proportions and a large terminal block.

`top` uses its own title height and terminal sizing. Its two-line terminal avoids squeezing the sample message into a small caption.

`overlay` fills a 760px-high composition with separate title proportions, a large two-line terminal and horizontal entry and exit wipes.

Short stages reduce title stretch before reducing title size. Type stays at least 40px in full and 32px in compact outputs.

Full and top last five seconds at default timing. The default overlay lasts 5.3 seconds and is completely closed before its last frame.