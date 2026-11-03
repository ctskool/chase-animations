CA.ready(() => {
  const { vars: V, time: T, head, words } = CA;
  const $ = (id) => document.getElementById(id);
  const clamp = (n, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));
  const ease = (p) => 1 - Math.pow(1 - clamp(p), 3);

  const back = $("back");
  back.style.display = CA.layer === "back" || !CA.layer ? "block" : "none";
  const host = $("ec-host");
  host.style.setProperty("--ec-ink", V.color);

  // ---- Which phrases, and when each one starts being said ----
  const phrases = String(V.phrases || "").split("|").map((s) => s.trim()).filter(Boolean);
  const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, "");
  const spoken = words.map((w) => ({ n: norm(w.w), t: w.t }));
  // "in-app browser" matches the spoken run "in-app", "browser"; a token may also carry a plural s.
  const same = (a, b) => a === b || a + "s" === b || b + "s" === a;
  function find(phrase, after) {
    const toks = phrase.split(/\s+/).map(norm).filter(Boolean);
    for (let i = 0; i < spoken.length; i++) {
      if (spoken[i].t <= after) continue;
      if (toks.every((tk, j) => spoken[i + j] && same(spoken[i + j].n, tk))) return spoken[i].t;
    }
    return null;
  }
  const times = [];
  let prev = -Infinity;
  phrases.forEach((p, i) => {
    const hit = find(p, prev);
    const at = hit !== null ? hit : i === 0 ? T.key : prev + 0.8;
    times.push(at);
    prev = at;
  });

  // ---- Layout: break each phrase into lines that fit, one shared size per phrase ----
  const MAXW = 990;
  const TOP = 70; // highest the type may reach, px
  const LH = 0.88; // line height of .ec-line, in em
  const h0 = head(0);
  const show = clamp(Number(V.show), 0.2, 1);
  const cap = Math.max(120, Number(V.size) || 330);
  const ctx = document.createElement("canvas").getContext("2d");
  const width = (s, px) => { ctx.font = `400 ${px}px Anton`; return ctx.measureText(s).width * 1.01; };
  const cards = phrases.map((p) => {
    const parts = p.toUpperCase().split(/\s+/);
    const lines = [];
    for (const w of parts) {
      const last = lines[lines.length - 1];
      if (last && width(last + " " + w, cap) <= MAXW) lines[lines.length - 1] = last + " " + w;
      else lines.push(w);
    }
    const widest = Math.max(...lines.map((l) => width(l, cap)));
    // Tall enough to fill the room above the head, but the block never runs off the top of the frame:
    // the last line shows `show` of itself above the crown, the rest is hidden by the head.
    const room = (h0.top - TOP) / ((lines.length - 1 + show) * LH);
    const px = Math.floor(Math.min(cap, (cap * MAXW) / widest, room));
    const el = CA.make("div", "ec-word", host);
    lines.forEach((l) => { const ln = CA.make("div", "ec-line", el, l); ln.style.fontSize = px + "px"; });
    const lineH = px * LH;
    return { el, h: el.offsetHeight, top: h0.top - (lines.length - 1 + show) * lineH };
  });

  // ---- Drift: the type trails the head at a fraction of its motion and settles a touch past it ----
  const end = T.duration;
  const drift = clamp(Number(V.drift), 0, 1);
  const step = 1 / 120;
  const follow = [];
  {
    let x = 0, y = 0, vx = 0, vy = 0;
    const k = 55, c = 8.5;
    for (let t = 0; t <= end + step; t += step) {
      const h = head(t);
      vx += (k * ((h.cx - h0.cx) * drift - x) - c * vx) * step;
      vy += (k * ((h.top - h0.top) * drift - y) - c * vy) * step;
      x += vx * step;
      y += vy * step;
      follow.push([x, y]);
    }
  }
  const drifted = (t) => follow[Math.min(follow.length - 1, Math.max(0, Math.round(t / step)))];
  const GONE = 0.04; // the old word clears in about a frame, so the slam reads as a hard replace

  function draw(t) {
    const [dx, dy] = drifted(t);
    const out = clamp((end - t) / 0.3);
    cards.forEach((c, i) => {
      const d = t - times[i];
      const next = i + 1 < times.length ? t - times[i + 1] : -1;
      if (d < 0 || next > GONE) { c.el.style.opacity = 0; return; }
      // The slam: starts 15% too big and a little high, lands with a damped thud.
      const wob = Math.exp(-10 * d) * Math.cos(15 * d);
      let scale = 1 + 0.15 * wob;
      let y = -26 * wob;
      let alpha = ease(d / 0.05);
      // Replaced: the old word gives way fast, a small step back as the next one hits.
      if (next >= 0) {
        const k = ease(next / GONE);
        alpha *= 1 - k;
        scale *= 1 - 0.07 * k;
        y += 18 * k;
      }
      c.el.style.opacity = (alpha * out).toFixed(3);
      c.el.style.transform =
        `translate(${(h0.cx - 540 + dx).toFixed(1)}px,${(c.top + dy + y).toFixed(1)}px) scale(${scale.toFixed(4)})`;
    });
  }

  const tl = gsap.timeline({ paused: true });
  const clock = { t: 0 };
  tl.to(clock, { t: end, duration: end, ease: "none", onUpdate: () => draw(clock.t) });
  draw(0);
  window.__timelines["block"] = tl;
});
