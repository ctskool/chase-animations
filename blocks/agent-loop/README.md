# Agent loop

A huge round track frames the attempt counter. The mascot takes visible alternating strides between Plan, Act and Check. Each lap accelerates, stretching its short orange wake into a long, pointed smear.

**Key moment:** Check turns green, six chunky fragments break away, and the orange trail shoots through the exact opening. Your pass word and result replace the counter. The mascot follows the trail through the gap, returns and lands on the lettering.

## Suits

- Explaining an agent's plan, act and check cycle
- Showing repeated attempts before a successful result
- A spoken line about continuing until tests pass

## Doesn't suit

- A detailed session log
- Comparisons between several agents
- Long station names or paragraphs of results

## What to change

Run `animate vars agent-loop` for the full list.

| Variables | What they are |
|---|---|
| `title` | Short header |
| `planLabel`, `actLabel`, `checkLabel` | The three station names |
| `attemptLabel`, `attempts` | Counter label and total attempts, including the successful last lap |
| `failWord`, `passWord` | Failed-check plate and large final word |
| `stat` | Exact result shown at the key moment |
| `line`, `lineFocus` | Bottom sentence and the exact substring to accent |
| `accent`, `ground`, `ink`, `muted` | Main colours |
| `plate`, `plateBorder`, `track` | Station plates and ring |
| `error`, `success`, `successInk` | Failed and successful check colours |
| `showMascot`, `showLogo` | Character and Claude logo switches |
| `overlayPosition` | `top` or `bottom` for the overlay output |

- Two to five attempts read best. One to eight are supported; values are rounded and limited to that range.
- Keep station names to one short word and the final word to one short phrase.
- An empty station label removes its plate while preserving the circuit.
- Leave `title`, `attemptLabel`, `stat` or `line` empty to remove that text.
- Longer bottom sentences wrap into balanced lines.
- `lineFocus` matches the first exact occurrence in `line`. Leave it empty for plain text.
- Every failed contact changes the whole counter by one.
- The final word and stat appear once, exactly as entered.
- The supplied attempt count and test result are illustrative. Enter your own result.

## Timing

| | |
|---|---|
| Build-up before the key moment | 4.4s by default; 2.8s minimum |
| Hold | 1.8s by default |
| Transparent exit | Closes upward in 0.34s |

The mascot springs from Plan at its native proportions. Each stride has a planted beat, an alternating outward leg kick, a counter-swinging arm and a visible hop. Small contact streaks mark the footfalls. Its body stays unstretched throughout the run and leans no more than 12 degrees.

Before each failed Check, the feet brace and draw a skid. On contact, the body briefly flattens, the plate kicks, pixels spray and the next whole attempt number slams in. The backward recoil starts on that same frame. The body quickly regains its true shape as it springs away.

After the first collision, the mascot looks back at the increased counter, then double-takes toward Check. The next failure earns a frustrated blink and foot kick before it tries again.

Each lap takes substantially less time. The orange wake grows in both length and weight, with a thin trailing point and a broad moving head. The final lap becomes a long tapered smear. Check stays red until the mascot reaches Plan again.

At the key moment, the ring has a broad missing sector and six separated fragments. The running trail continues into an outward jet through the centre of that opening. The character's flight follows the same route. Check's plate sits below the jet so the break remains visible.

The mascot returns above the middle of the pass word and lands in a deep, foot-anchored squash. The entire word takes a short impact together. The mascot rebounds with the kit's large V-shaped raised arms, lands again and settles into victory hops and blinks.

After the landing reaction, the result text stays put. The raised-arm celebration and green current around the broken ring keep the hold alive.

## Outputs

`full` uses a large circle across the portrait safe area, a counter up to 430px and 26px mascot cells. Plan sits beneath the lower rim. The running lane keeps the mascot's full silhouette inside the stage.

`top` has its own circular composition, plate sizes and counter placement. Attempt sits below the upper running lane, clear of the kicking legs. Plan sits inside the lower rim. Mascot cells are 20px at the default height.

`overlay` uses its own circle, spacing and typography inside the 960px-high card, with 21px mascot cells. Its counter label also sits below the upper running lane. It enters through a wipe, and complete text groups clear before the closing wipe reaches them.

All three outputs use alternating planted footfalls, immediate collision recoil, a tapered final trail, a flight through the actual break and an impact-led victory landing.

Shorter compact stages reduce the circle's radius and spacing together. They preserve the round ring and keep mascot cells at least 12px.

Text stays at least 40px in `full` and 32px in compact outputs.