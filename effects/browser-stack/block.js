CA.ready(() => {
  const { vars: V, time: T, head, make, words } = CA;
  const $ = (id) => document.getElementById(id);
  const clamp = (n, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));
  const out3 = (p) => 1 - Math.pow(1 - clamp(p), 3);
  const smooth = (p) => { p = clamp(p); return p * p * (3 - 2 * p); };
  const backOut = (p, s = 1.9) => { p = clamp(p) - 1; return 1 + p * p * ((s + 1) * p + s); };

  // Back layer only: the pile sits behind him.
  $("front").style.display = "none";
  if (CA.layer !== "back") $("back").style.display = "none";

  const end = T.duration;
  const green = V.green || "#22C55E";
  document.documentElement.style.setProperty("--bs-green", green);
  const ghost = clamp(Number(V.ghost ?? 0.8), 0.2, 1);
  const n = Math.round(clamp(Number(V.count) || 8, 4, 8));

  // Cue times from the words, so the effect lands right on any video.
  const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const find = (w, after = -1) => {
    const k = norm(w);
    if (!k) return null;
    const hit = words.find((x) => x.t > after && norm(x.w).startsWith(k));
    return hit ? hit.t : null;
  };
  const exitAt = end - 0.35;
  let spinT = find(V.spinWord) ?? Math.min(0.3, end * 0.1);
  let landT = find(V.landWord, spinT) ?? T.key;
  let testT = find(V.testWord, landT) ?? exitAt - 0.9;
  spinT = clamp(spinT, 0, end);
  landT = clamp(Math.max(landT, spinT + 0.6), 0, end);
  // The ripple must finish (and show the full tally) before the exit.
  testT = clamp(testT - 0.04, landT + 0.3, exitAt - 0.6);

  // The pile: x offset from the head centre, y as a fraction of the head (top of head 0, chin 1), tilt, and depth
  // (how much it follows him). Listed in pop order; later ones sit on top.
  const SLOTS = [
    { x: 0, y: 0.3, r: 1.5, d: 0.2 }, // straight behind the head
    { x: -370, y: -0.21, r: -11, d: 0.24 }, // high on the left, half off the frame
    { x: -285, y: 0.11, r: -7, d: 0.3 },
    { x: 280, y: 0.08, r: 6.5, d: 0.3 },
    { x: -330, y: 0.6, r: -10, d: 0.38 },
    { x: 335, y: 0.58, r: 9, d: 0.38 },
    { x: -175, y: 0.93, r: -4, d: 0.45 },
    { x: 190, y: 0.91, r: 4.5, d: 0.45 },
  ];
  const PICK = { 4: [2, 3, 4, 5], 5: [0, 2, 3, 4, 5], 6: [0, 2, 3, 4, 5, 1], 7: [0, 2, 3, 4, 5, 6, 7], 8: [0, 1, 2, 3, 4, 5, 6, 7] };
  const slots = PICK[n].map((i) => SLOTS[i]);

  const stack = $("bs-stack");
  const wins = slots.map((s, i) => {
    const el = make("div", "bs-win", stack);
    const bar = make("div", "bs-bar", el);
    make("span", "bs-dot", bar);
    make("span", "bs-dot", bar);
    make("span", "bs-dot", bar);
    make("div", "bs-url", bar, String(V.url || ""));
    const body = make("div", "bs-body", el);
    make("div", "bs-field", body, String(V.field1 || ""));
    make("div", "bs-field", body, String(V.field2 || ""));
    const btn = make("div", "bs-btn", body);
    const fill = make("i", "", btn);
    make("span", "", btn, String(V.button || ""));
    const ring = make("div", "bs-ring", el);
    const stamp = make("div", "bs-stamp", el, String(V.stamp || ""));
    return { el, fill, ring, stamp, s, i };
  });

  // Pop-in: evenly from "spin" to just before "Chrome", so the last window lands on the word.
  const popDur = 0.34;
  const popGap = n > 1 ? (landT - 0.06 - spinT) / (n - 1) : 0;
  wins.forEach((w) => { w.pop = spinT + w.i * popGap; });

  // Ripple: left to right across the stack.
  const order = wins.slice().sort((a, b) => a.s.x - b.s.x);
  const rippleGap = Math.min(0.06, (exitAt - 0.25 - testT) / Math.max(1, n - 1));
  order.forEach((w, k) => { w.hit = testT + k * rippleGap; w.stampRot = (k % 2 ? 7 : -8) - w.s.r * 0.4; });
  const hits = order.map((w) => w.hit);

  // Drift with weight: the pile follows the head through a soft spring (it lags, then settles with a small
  // overshoot). Precomputed from t = 0 so any frame can be seeked.
  const h0 = head(0);
  const DT = 1 / 120;
  const steps = Math.ceil(end / DT) + 2;
  const fx = new Float32Array(steps);
  const fy = new Float32Array(steps);
  {
    let x = 0, y = 0, vx = 0, vy = 0;
    const k = 55, c = 2 * 0.5 * Math.sqrt(k);
    for (let i = 0; i < steps; i++) {
      const h = head(i * DT);
      const tx = h.cx - h0.cx, ty = h.top - h0.top;
      vx += (k * (tx - x) - c * vx) * DT;
      vy += (k * (ty - y) - c * vy) * DT;
      x += vx * DT;
      y += vy * DT;
      fx[i] = x;
      fy[i] = y;
    }
  }
  const follow = (t) => {
    const f = clamp(t / DT, 0, steps - 1);
    const i = Math.floor(f), j = Math.min(i + 1, steps - 1), k = f - i;
    return [fx[i] + (fx[j] - fx[i]) * k, fy[i] + (fy[j] - fy[i]) * k];
  };

  const pill = $("bs-pill");
  const count = $("bs-count");
  const tally = String(V.tally || "");
  const W = 540, H = 356;
  const span = h0.chin - h0.top;

  // Pin the pill to its widest text so it does not change size as the count ticks.
  count.textContent = `${n}/${n} ${tally}`.trim();
  const pw = pill.offsetWidth + 4;
  pill.style.width = pw + "px";

  function draw(t) {
    const h = head(t);
    const [ox, oy] = follow(t);
    const exit = smooth((end - t) / 0.35);
    const lift = (1 - exit) * -24;
    // The whole pile is one ghostly layer, so windows hide each other instead of their text bleeding through.
    stack.style.opacity = (ghost * exit).toFixed(3);

    for (const w of wins) {
      const { s } = w;
      const p = (t - w.pop) / popDur;
      if (p <= 0) { w.el.style.opacity = "0"; continue; }
      const sc = 0.82 + 0.18 * backOut(p, 1.6);
      const rise = (1 - out3(p)) * 70;
      const turn = (1 - out3(p)) * (s.x < 0 ? -6 : 6);
      // A stamp landing gives the window a small thud.
      const q = (t - w.hit) / 0.16;
      const thud = q > 0 && q < 1.6 ? Math.sin((q / 1.6) * Math.PI) * 0.025 : 0;
      const cx = h0.cx + s.x + ox * s.d * 2.2;
      const cy = h0.top + s.y * span + oy * s.d * 2.2 + rise + lift;
      w.el.style.transform = `translate(${(cx - W / 2).toFixed(1)}px, ${(cy - H / 2).toFixed(1)}px) rotate(${(s.r + turn).toFixed(2)}deg) scale(${(sc * (1 - thud)).toFixed(4)})`;
      w.el.style.opacity = out3(p * 1.6).toFixed(3);

      // The Passed stamp drops from big to size with a punch; the button and the edge go green.
      if (q <= 0) {
        w.stamp.style.opacity = "0";
        w.ring.style.opacity = "0";
        w.fill.style.opacity = "0";
      } else {
        const ss = 1.9 - 0.9 * backOut(q, 2.2);
        w.stamp.style.opacity = clamp(q * 2.5).toFixed(3);
        w.stamp.style.transform = `translate(-50%, -32%) rotate(${w.stampRot}deg) scale(${ss.toFixed(4)})`;
        w.ring.style.opacity = (0.9 * clamp(q * 2)).toFixed(3);
        w.fill.style.opacity = clamp(q * 2).toFixed(3);
      }
    }

    // The tally above his head, counting each stamp as it lands.
    const done = hits.filter((x) => t >= x + 0.05).length;
    const pp = (t - hits[0]) / 0.3;
    if (pp <= 0) {
      pill.style.opacity = "0";
    } else {
      count.textContent = `${done}/${n} ${tally}`.trim();
      const bump = done === n ? Math.sin(clamp((t - hits[n - 1] - 0.05) / 0.22) * Math.PI) * 0.08 : 0;
      const x = h0.cx + ox * 0.5 - pw / 2;
      const y = Math.min(h.top, h0.top) - 205 + oy * 0.5 + (1 - out3(pp)) * 30 + lift;
      pill.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${(0.9 + 0.1 * backOut(pp, 1.8) + bump).toFixed(4)})`;
      pill.style.opacity = (out3(pp * 1.5) * smooth((end - t) / 0.25)).toFixed(3);
    }
  }

  const tl = gsap.timeline({ paused: true });
  const clock = { t: 0 };
  tl.to(clock, { t: end, duration: end, ease: "none", onUpdate: () => draw(clock.t) });
  draw(0);
  window.__timelines["block"] = tl;
});
