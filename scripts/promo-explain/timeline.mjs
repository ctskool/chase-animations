// Every beat of the promo, worked out once. The page animates from it and the sound effects are
// placed from it, so a keystroke's click lands on the frame its letter appears.

const DEMO_PACE = [
  // first demo is fullest, later ones faster, as in the reference reel
  { lead: 0.55, slash: 0.075, char: 0.052, send: 0.22, wait: 1.0 },
  { lead: 0.3, slash: 0.045, char: 0.03, send: 0.14, wait: 0.5 },
  { lead: 0.2, slash: 0.03, char: 0.022, send: 0.1, wait: 0.32 },
];

export function buildTimeline(demos, { endHold = 2.5 } = {}) {
  let t = 0;
  const out = [];
  demos.forEach((d, i) => {
    const pace = DEMO_PACE[Math.min(i, DEMO_PACE.length - 1)];
    const start = t;
    const chars = [];
    let at = start + pace.lead;
    const name = d.command.split(" ")[0];
    [...d.command].forEach((ch, k) => {
      chars.push({ ch, at: Number(at.toFixed(3)) });
      at += k < name.length ? pace.slash : pace.char * (ch === " " ? 1.6 : 1);
    });
    const typed = at;
    const send = typed + pace.send;
    const status = send + 0.18;
    const result = status + pace.wait;
    const end = result + d.seconds;
    out.push({
      index: i,
      start: Number(start.toFixed(3)),
      chars,
      menuOn: chars[0].at,
      menuOff: chars[name.length]?.at ?? typed,
      send: Number(send.toFixed(3)),
      status: Number(status.toFixed(3)),
      result: Number(result.toFixed(3)),
      end: Number(end.toFixed(3)),
      seconds: d.seconds,
    });
    t = end;
  });
  const endStart = Number(t.toFixed(3));
  const duration = Math.ceil((t + endHold) * 30) / 30;
  return { demos: out, endStart, duration };
}
