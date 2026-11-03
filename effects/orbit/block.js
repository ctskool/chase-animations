CA.ready(() => {
  const { vars: V, time: T, head, fit, make } = CA;
  const $ = (id) => document.getElementById(id);
  const clamp = (n, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));
  const lerp = (a, b, k) => a + (b - a) * k;
  const easeOut = (p) => 1 - Math.pow(1 - clamp(p), 3);
  const smooth = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
  const DEG = Math.PI / 180;

  const end = T.duration;
  const K = T.key;
  const layer = CA.layer;
  const W = 276;
  const H = 360;
  const STAR = '<svg viewBox="0 0 24 24"><path d="M12 2.4l2.95 6.06 6.6.93-4.8 4.66 1.15 6.6L12 17.53l-5.9 3.12 1.15-6.6-4.8-4.66 6.6-.93z"/></svg>';

  // Lighter and darker versions of each card's colour for its gradient.
  const mix = (hex, to, k) => {
    const [r, g, b] = hex.replace("#", "").match(/../g).map((h) => parseInt(h, 16));
    const t = to === "white" ? 255 : 0;
    return `rgb(${Math.round(lerp(r, t, k))},${Math.round(lerp(g, t, k))},${Math.round(lerp(b, t, k))})`;
  };

  const items = [1, 2, 3, 4, 5]
    .map((i) => ({ name: String(V["name" + i] || "").trim(), by: String(V["by" + i] || "").trim(), stars: String(V["stars" + i] || "").trim(), color: V["color" + i] || "#555555" }))
    .filter((c) => c.name);
  const n = items.length;

  // The same card set goes in both layers; each frame a card shows in the layer that matches its depth.
  function build(parent) {
    return items.map((c, i) => {
      const el = make("div", "or-card", parent);
      el.style.setProperty("--c", c.color);
      el.style.setProperty("--c-hi", mix(c.color, "white", 0.16));
      el.style.setProperty("--c-lo", mix(c.color, "black", 0.32));
      make("div", "or-num", el, String(i + 1).padStart(2, "0"));
      const name = make("div", "or-name", el);
      const lines = c.name.split(/\s+/).map((w) => make("div", "", name, w));
      const by = make("div", "or-by", el, c.by);
      const stars = make("div", "or-stars", el);
      stars.innerHTML = STAR + "<span></span>";
      stars.lastChild.textContent = c.stars;
      const px = Math.min(...lines.map((l) => fit(l, W - 46, 36)));
      lines.forEach((l) => { l.style.fontSize = px + "px"; });
      fit(by, W - 46, 34);
      return el;
    });
  }
  const back = $("or-back");
  const front = $("or-front");
  const cards = { back: build(back), front: build(front) };
  if (layer === "back") front.style.display = "none";
  if (layer === "front") back.style.display = "none";

  // Spin: how far the ring has turned by t, in degrees. Starts slow, cruises, eases off on the key word.
  const STEP = 1 / 240;
  const spinTable = [0];
  const omega = (t) => (0.3 + 0.7 * smooth(0, 0.9, t)) * (1 - 0.42 * smooth(K - 0.15, K + 0.25, t));
  for (let t = STEP; t <= end + STEP; t += STEP) spinTable.push(spinTable[spinTable.length - 1] + omega(t) * STEP);
  const spinScale = (Number(V.turns) * 360) / spinTable[Math.min(spinTable.length - 1, Math.round(end / STEP))];
  const spin = (t) => {
    const f = clamp(t / STEP, 0, spinTable.length - 1);
    const i = Math.floor(f);
    const b = spinTable[Math.min(i + 1, spinTable.length - 1)];
    return lerp(spinTable[i], b, f - i) * spinScale;
  };

  // Drift: the ring follows the head at 60% of its motion through a soft spring, so it settles with a little overshoot.
  const s0 = head(0);
  const span = s0.chin - s0.top;
  const DT = 1 / 120;
  const drift = [];
  {
    let x = s0.cx, y = s0.top, vx = 0, vy = 0;
    const k = 90, c = 9.5;
    for (let t = 0; t <= end + DT; t += DT) {
      const h = head(t);
      const tx = s0.cx + (h.cx - s0.cx) * 0.6;
      const ty = s0.top + (h.top - s0.top) * 0.6;
      vx += (k * (tx - x) - c * vx) * DT; x += vx * DT;
      vy += (k * (ty - y) - c * vy) * DT; y += vy * DT;
      drift.push([x, y]);
    }
  }
  const driftAt = (t) => {
    const f = clamp(t / DT, 0, drift.length - 1);
    const i = Math.floor(f);
    const a = drift[i];
    const b = drift[Math.min(i + 1, drift.length - 1)];
    return [lerp(a[0], b[0], f - i), lerp(a[1], b[1], f - i)];
  };

  // The ring: a rounded (superellipse) loop, so the near side stays wide until it is below the chin and never
  // swings across the face. The far side runs at forehead height, so each far card slides fully behind the head
  // and comes out the other side; the near side runs well under the chin.
  const P = 3.3;
  const tilt = Number(V.tilt) * DEG;
  const rx = Number(V.width);
  function place(theta, r, cx, top) {
    const cy = top + 0.58 * span;
    const ryBack = 0.33 * span;
    const ryFront = 0.42 * span + 300;
    const c = Math.cos(theta);
    const s = Math.sin(theta);
    const px = Math.sign(c) * Math.pow(Math.abs(c), 2 / P) * rx * r;
    const py = Math.sign(s) * Math.pow(Math.abs(s), 2 / P) * (s > 0 ? ryFront : ryBack) * r;
    return {
      x: cx + px * Math.cos(tilt) - py * Math.sin(tilt),
      y: cy + px * Math.sin(tilt) + py * Math.cos(tilt),
      z: s,
      c,
    };
  }

  function draw(t) {
    const [cx, top] = driftAt(t);
    // Fan out: the cards start stacked small behind the head, rise out and spread round the ring. Each one is
    // almost at full radius before it reaches the side, so it never swings in front of the face.
    const grow = easeOut(t / 0.8);
    const r = lerp(0.25, 1, grow);
    const spread = easeOut((t - 0.05) / 1.3);
    // In from nothing, and fully gone by the last frame so the cut back to the plain shot doesn't pop.
    const fade = smooth(0, 0.25, t) * smooth(0, 0.32, end - 1 / CA.fps - t);
    const turn = spin(t);
    for (let i = 0; i < n; i += 1) {
      const off = (i - (n - 1) / 2) * (360 / n);
      const theta = (270 + spread * off + turn) * DEG;
      const p = place(theta, r, cx, top);
      const depth = (p.z + 1) / 2;
      const scale = lerp(0.64, 1.04, depth) * lerp(0.86, 1, grow) * lerp(0.94, 1, fade);
      const lit = lerp(0.74, 1, depth);
      const inFront = p.z > 0;
      const tf = `translate(${(p.x - W / 2).toFixed(1)}px, ${(p.y - H / 2).toFixed(1)}px) perspective(1100px) rotateY(${(-p.c * 22).toFixed(2)}deg) rotateZ(${(Number(V.tilt) * 0.8).toFixed(2)}deg) scale(${scale.toFixed(4)})`;
      for (const name of ["back", "front"]) {
        const el = cards[name][i];
        const mine = layer ? name === layer : name === "front";
        const show = mine && (layer ? (name === "front") === inFront : true);
        el.style.visibility = show ? "visible" : "hidden";
        if (!show) continue;
        el.style.transform = tf;
        el.style.opacity = fade.toFixed(3);
        el.style.filter = `brightness(${lit.toFixed(3)})`;
        el.style.zIndex = String(Math.round(500 + p.z * 400));
      }
    }
  }

  const tl = gsap.timeline({ paused: true });
  const clock = { t: 0 };
  tl.to(clock, { t: end, duration: end, ease: "none", onUpdate: () => draw(clock.t) });
  draw(0);
  window.__timelines["block"] = tl;
});
