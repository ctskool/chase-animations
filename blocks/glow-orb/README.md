# Glow Orb

A large shaded pink-white orb breathes against warm near-black. One short statement builds beneath it. The closing two words arrive together, with the final word pink from its first visible frame.

**Key moment:** the closing phrase finishes its rise at the orb's breath crest. Its arrival releases the single rim and pushes the supporting circles outward.

## Suits

- Mindset and wellness statements
- Quiet introductions with a clear payoff
- One short sentence beside a talking head

## Doesn't suit

- Lists, comparisons or multiple messages
- Long paragraphs or rapid-fire information
- Heavy type, extra accents or decorative particles

## What to change

Run `animate vars glow-orb` for the full list.

| Variables | What they are |
|---|---|
| `line` | Your short statement; its closing two words arrive together |
| `orbDiameter`, `typeSize`, `tracking` | Requested sizes and letter spacing |
| `initialOrbScale`, `wordPulse` | Opening size and small earlier-word pulses |
| `breathOvershoot` | Size of the final breath crest |
| `keyAttackDuration` | Shared duration of the closing phrase's arrival and rim release |
| `breathAmount`, `breathPeriod` | Slow breathing after the crest |
| `wordStaggerFrames`, `wordRiseDuration` | Earlier-word reveal rhythm |
| `keyRingGap`, `rimWidth`, `keyRimWidth` | Rim separation and stroke weights |
| `ringReleaseDuration`, `orbitScale` | Ring expansion after the key moment |
| `orbitFlattening`, `orbitTurn` | Gentle tipping and turning of the released ring |
| `haloScale`, `hotspotSize`, `grainAmount` | Glow size, white highlight size and moving grain |
| `outlineCircleCount`, `parallaxPush`, `outlineWidth`, `seed` | Supporting circles and repeatable movement |
| `ground`, `haloRose`, `haloEdge`, `orbPink`, `orbWhite`, `ink` | Palette; `orbPink` also colours the final word |
| `overlayPosition` | Overlay at the top or bottom |

Keep the statement under about 35 characters. The default is “Make room for stillness.”

Every output uses one line. Type fits before animation. Earlier words move into the growing phrase; “for stillness.” shares one reveal element. The completed statement stays fixed.

The white highlight blends into pink shading instead of filling a large flat area. Lower `hotspotSize` for more visible shading.

The edge circles sit above the halo and behind the orb. They gather inward, then recoil with the rim release. Nearer circles are larger, clearer and faster.

A wider orbit leaves less room for the body. The default keeps the orb large.

Never fade elements, flood the corners with pink, add particles or introduce a second accent colour. Keep one line of Outfit at medium weight.

## Timing

| | |
|---|---|
| Build-up | 2.5s by default; 1.3s minimum |
| Hold | 1.15s by default |
| Transparent exit | 0.3s iris closure |

The opening orb winds back slightly, then springs into its first breath. Earlier word arrivals give it small pulses. A shallow exhale prepares the final release.

The closing phrase appears pink as the rim starts separating and the edge circles recoil. The phrase settles exactly at the key moment, together with the body's 10% breath crest and expanded halo.

Over the next 0.52 seconds, the rim springs into its wider orbit while the body exhales. The ring also tips and turns, giving the shorter hold a changing silhouette. Slow breathing, delayed light movement, circle drift and grain continue underneath the fixed statement.

## Outputs

`full` keeps the orb large above one clear line. Important content respects the portrait safe area, with the bottom fifth reserved.

`top` uses its own type, gap and circle sizes to fill the shorter stage.

`overlay` has separate spacing inside a 900px-high dark card. An iris reveals and closes the composition.

All three outputs share the same synchronized phrase arrival, rim release and circle recoil. The ring's widest pose is reserved before sizing the orb, keeping it inside the stage and above the caption.

Shorter stages reduce the orb first. Type stays at least 40px in `full` and 32px in compact outputs; keep copy short for generous sizing.