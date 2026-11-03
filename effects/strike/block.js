CA.ready(() => {
  const { vars: V, time: T, head, words, seeded } = CA;
  const $ = (id) => document.getElementById(id);
  const clamp = (n, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));
  const ease = (p) => 1 - Math.pow(1 - clamp(p), 3);
  const easeIn = (p) => Math.pow(clamp(p), 2);

  const back = $("back");
  back.style.display = CA.layer === "back" || !CA.layer ? "block" : "none";
  back.style.setProperty("--st-ink", V.color);
  back.style.setProperty("--st-red", V.red);

  // ---- Cue times from the spoken words, each one after the last ----
  const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, "");
  const same = (a, b) => a === b || a + "s" === b || b + "s" === a;
  const spoken = words.map((w) => ({ n: norm(w.w), t: w.t }));
  function find(phrase, after) {
    const toks = String(phrase || "").split(/\s+/).map(norm).filter(Boolean);
    if (!toks.length) return null;
    for (let i = 0; i < spoken.length; i++) {
      if (spoken[i].t <= after) continue;
      if (toks.every((tk, j) => spoken[i + j] && same(spoken[i + j].n, tk))) return spoken[i].t;
    }
    return null;
  }
  const end = T.duration;
  const tWord = find(V.word, -1) ?? T.key;
  const tStrike = find(V.strikeOn, tWord) ?? tWord + 1.2;
  const tSwap = find(V.replaceOn, tStrike) ?? tStrike + 1.2;

  // ---- Type: one size for both words, as big as fits the width ----
  const oldText = String(V.word || "").trim().toUpperCase();
  const newText = String(V.replacement || "").trim().toUpperCase();
  const MAXW = 990;
  const TOP = 70;
  const LH = 0.88;
  const cap = Math.max(120, Number(V.size) || 330);
  const ctx = document.createElement("canvas").getContext("2d");
  const width = (s, px) => { ctx.font = `400 ${px}px Anton`; return ctx.measureText(s).width * 1.01; };
  const h0 = head(0);
  const show = clamp(Number(V.show), 0.5, 1);
  const widest = Math.max(width(oldText, cap), width(newText || "X", cap));
  const px = Math.floor(Math.min(cap, (cap * MAXW) / widest, (h0.top - TOP) / (show * LH)));
  const lineH = px * LH;
  const baseTop = h0.top - show * lineH;

  const oldEl = $("st-old"), newEl = $("st-new");
  const oldSpan = $("st-old-text"), newSpan = $("st-new-text");
  oldSpan.textContent = oldText;
  newSpan.textContent = newText;
  oldSpan.style.fontSize = newSpan.style.fontSize = px + "px";

  // ---- The marker line: a slightly rising, hand-wobbled stroke through the middle of the capitals ----
  ctx.font = `400 ${px}px Anton`;
  const capH = ctx.measureText("H").actualBoundingBoxAscent;
  const probe = document.createElement("span");
  probe.style.cssText = "display:inline-block;width:0;height:0;vertical-align:baseline";
  oldSpan.appendChild(probe);
  const baseline = oldSpan.offsetTop + probe.offsetTop;
  oldSpan.removeChild(probe);
  const L = oldSpan.offsetLeft, R = L + oldSpan.offsetWidth;
  const midY = baseline - capH * 0.5;
  const rnd = seeded(31);
  const pts = [];
  const N = 7;
  for (let i = 0; i <= N; i++) {
    const k = i / N;
    const x = L - 46 + (R - L + 92) * k;
    const y = midY + 18 - 36 * k + Math.sin(k * Math.PI) * -6 + (i && i < N ? (rnd() - 0.5) * 12 : 0);
    pts.push([x, y]);
  }
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  const svg = $("st-svg"), line = $("st-line");
  svg.setAttribute("width", 1080);
  svg.setAttribute("height", oldEl.offsetHeight);
  line.setAttribute("d", d);
  line.style.strokeWidth = Math.round(px * 0.1) + "px";
  const len = line.getTotalLength();
  line.style.strokeDasharray = len;

  // ---- Drift: trails the head at a fraction of its motion, settles a touch past it ----
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
  const DRAW = 0.24; // how long the hand takes to cross the word

  function draw(t) {
    const [dx, dy] = drifted(t);
    const out = clamp((end - t) / 0.3);
    const x0 = h0.cx - 540 + dx;

    // Old word: slams in on its word, takes a jolt as the line rips through, gets knocked down by the new one.
    const a = t - tWord;
    if (a < 0) {
      oldEl.style.opacity = 0;
    } else {
      const wob = Math.exp(-10 * a) * Math.cos(15 * a);
      let scale = 1 + 0.15 * wob;
      let y = -26 * wob;
      let x = 0;
      let alpha = ease(a / 0.05);
      const s = t - tStrike - DRAW * 0.5;
      if (s > 0) x += 14 * Math.exp(-9 * s) * Math.sin(16 * s);
      const k = t - tSwap;
      if (k > 0) {
        y += 320 * easeIn(k / 0.24);
        scale *= 1 - 0.08 * ease(k / 0.24);
        alpha *= 1 - ease(k / 0.18);
      }
      oldEl.style.opacity = (alpha * out).toFixed(3);
      oldEl.style.transform = `translate(${(x0 + x).toFixed(1)}px, ${(baseTop + dy + y).toFixed(1)}px) scale(${scale.toFixed(4)})`;
      oldSpan.style.opacity = (1 - 0.22 * ease((t - tStrike - DRAW) / 0.25)).toFixed(3);
    }
    const p = (t - tStrike) / DRAW;
    line.style.opacity = p > 0 ? 1 : 0;
    line.style.strokeDashoffset = (len * (1 - (1 - Math.pow(1 - clamp(p), 2)))).toFixed(2);

    // New word: drops in from above on its word and lands with a damped thud.
    const n = t - tSwap;
    if (n < 0 || !newText) {
      newEl.style.opacity = 0;
    } else {
      const wob = Math.exp(-10 * n) * Math.cos(15 * n);
      const scale = 1 + 0.15 * wob;
      const y = -150 * wob;
      newEl.style.opacity = (ease(n / 0.05) * out).toFixed(3);
      newEl.style.transform = `translate(${x0.toFixed(1)}px, ${(baseTop + dy + y).toFixed(1)}px) scale(${scale.toFixed(4)})`;
    }
  }

  const tl = gsap.timeline({ paused: true });
  const clock = { t: 0 };
  tl.to(clock, { t: end, duration: end, ease: "none", onUpdate: () => draw(clock.t) });
  draw(0);
  window.__timelines["block"] = tl;
});
