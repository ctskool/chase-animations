CA.ready(() => {
  const { vars: V, time: T, head, fit, words } = CA;
  const $ = (id) => document.getElementById(id);
  const clamp = (n, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));
  const ease = (p) => 1 - Math.pow(1 - clamp(p), 3);
  // Soft spring from 0 to 1 that passes 1 a little and settles.
  const spring = (u, k = 8, w = 11) => (u <= 0 ? 0 : 1 - Math.exp(-k * u) * Math.cos(w * u));

  const front = $("front");
  front.style.display = CA.layer === "front" || !CA.layer ? "block" : "none";

  const W = Math.round(Number(V.width) || 840);
  const stack = $("pg-stack");
  stack.style.setProperty("--pg-green", V.green);

  // ---- Banners and the word each one lands on ----
  const items = [
    { msg: V.msg1, cue: V.cue1 },
    { msg: V.msg2, cue: V.cue2 },
    { msg: V.msg3, cue: V.cue3 },
    { msg: V.final, cue: V.cueFinal, good: true },
  ]
    .map((it) => ({ ...it, msg: String(it.msg || "").trim(), cue: String(it.cue || "").trim() }))
    .filter((it) => it.msg);

  const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, "");
  const same = (a, b) => a === b || a + "s" === b || b + "s" === a || a + "es" === b || b + "es" === a;
  const spoken = words.map((w) => ({ n: norm(w.w), t: w.t }));
  let prev = -Infinity;
  items.forEach((it, i) => {
    const key = norm(it.cue.split(/\s+/)[0] || "");
    const hit = key ? spoken.find((w) => w.t > prev && same(w.n, key)) : null;
    it.at = hit ? hit.t : i === 0 ? T.key : prev + 0.5;
    prev = it.at;
  });

  const tick = '<svg viewBox="0 0 50 50"><path d="M14 26 L22 34 L37 17" fill="none" stroke="' + V.green +
    '" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  items.forEach((it, i) => {
    const b = CA.make("div", "pg-banner" + (it.good ? " pg-good" : ""), stack);
    b.style.width = W + "px";
    b.style.zIndex = String(10 + i);
    const icon = CA.make("div", "pg-icon", b);
    if (it.good) icon.innerHTML = tick;
    else icon.textContent = "</>";
    const body = CA.make("div", "pg-body", b);
    const row = CA.make("div", "pg-row", body);
    const app = CA.make("div", "pg-app", row, String(V.app || ""));
    CA.make("div", "pg-now", row, "now");
    const msg = CA.make("div", "pg-msg", body, it.msg);
    const room = W - 24 - 28 - 80 - 22;
    fit(app, room - 80, 34);
    fit(msg, room, 34);
    it.el = b;
  });

  const H = items.length ? items[0].el.offsetHeight : 130;
  const GAP = 12;
  const P = H + GAP;
  const end = T.duration;
  const SAFE_BOTTOM = 1920 - 300;
  const SAFE_RIGHT = 1080 - 140;

  // ---- Drift: the stack follows the head at a fraction of its motion, with lag ----
  const h0 = head(0);
  const drift = clamp(Number(V.drift), 0, 1);
  const step = 1 / 120;
  const follow = [];
  {
    let x = 0, y = 0, vx = 0, vy = 0;
    const k = 55, c = 8.5;
    for (let t = 0; t <= end + step; t += step) {
      const h = head(t);
      const tx = (h.cx - h0.cx) * drift;
      const ty = (h.top - h0.top) * drift;
      vx += (k * (tx - x) - c * vx) * step;
      vy += (k * (ty - y) - c * vy) * step;
      x += vx * step;
      y += vy * step;
      follow.push([x, y]);
    }
  }
  const drifted = (t) => follow[Math.min(follow.length - 1, Math.max(0, Math.round(t / step)))];

  const baseTop = Number(V.top) || 1078;
  const baseLeft = Number(V.left) || 96;
  const lead = 0.05; // lands a hair before the word so it is there on the word

  function draw(t) {
    const h = head(t);
    const [dx, dy] = drifted(t);
    const exitP = clamp((end - t) / 0.3);
    const outK = 1 - ease(exitP);

    let top = Math.max(baseTop + dy, h.chin + 24);
    top = Math.min(top, SAFE_BOTTOM - (items.length - 1) * P - H);
    let left = baseLeft + dx;
    left = Math.min(left, SAFE_RIGHT - W);
    left = Math.max(left, 24);

    items.forEach((it, i) => {
      const u = t - (it.at - lead);
      if (u <= 0) {
        it.el.style.opacity = 0;
        return;
      }
      // How far later banners have pushed this one down (each push is its own soft spring).
      let pushed = 0;
      for (let j = i + 1; j < items.length; j++) pushed += spring(t - (items[j].at - lead), 9, 12);

      const s = spring(u, 8, 11);
      const y = top + pushed * P - (1 - s) * 34 - outK * 16;
      const scale = (0.9 + 0.1 * s) * (1 - 0.025 * pushed) * (1 - outK * 0.03);
      it.el.style.transform = `translate(${left.toFixed(1)}px, ${y.toFixed(1)}px) scale(${scale.toFixed(4)})`;
      it.el.style.opacity = (ease(u / 0.12) * (1 - 0.05 * pushed) * exitP).toFixed(3);
    });
  }

  const tl = gsap.timeline({ paused: true });
  const clock = { t: 0 };
  tl.to(clock, { t: end, duration: end, ease: "none", onUpdate: () => draw(clock.t) });
  draw(0);
  window.__timelines["block"] = tl;
});
