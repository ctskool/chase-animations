CA.ready(() => {
  const { vars: V, time: T, head, seeded } = CA;
  const $ = (id) => document.getElementById(id);
  const clamp = (n, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));
  const ease = (p) => 1 - Math.pow(1 - clamp(p), 3);
  const inOut = (p) => { const x = clamp(p); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };

  // A marker pass: off the mark quickly, easing only as it lands.
  const pen = (p) => 0.35 * inOut(p) + 0.65 * ease(p);

  const front = $("front");
  front.style.display = CA.layer === "front" || !CA.layer ? "block" : "none";
  front.style.setProperty("--fm-ink", V.colour || "#FF2E1F");

  const K = T.key;
  const end = T.duration;
  // The engine holds the picture (and the head track) from the key on, so the face sits still under the drawings.
  const h = head(K);
  const pt = (x, y) => `${x.toFixed(1)} ${y.toFixed(1)}`;

  // ---- The circle: a loose, slightly tilted loop round the face that overshoots its start, like a quick marker pass ----
  const ecx = h.cx;
  const ecy = (h.top + h.chin) / 2 - 10;
  const rx = h.w * 0.5 + 72;
  const ry = (h.chin - h.top) * 0.5 + 62;
  const tilt = -0.12;
  const rnd = seeded(23);
  const ph = [rnd() * 6.28, rnd() * 6.28, rnd() * 6.28];
  const ellipse = (a, s) => {
    const x = Math.cos(a) * rx * s;
    const y = Math.sin(a) * ry * s;
    return [ecx + x * Math.cos(tilt) - y * Math.sin(tilt), ecy + x * Math.sin(tilt) + y * Math.cos(tilt)];
  };
  {
    const N = 140;
    const a0 = -2.25; // starts at about eleven o'clock, goes round clockwise
    const turns = 1.13;
    const pts = [];
    for (let i = 0; i <= N; i += 1) {
      const p = i / N;
      const a = a0 + p * turns * Math.PI * 2;
      const wob = 1 + 0.03 * Math.sin(3 * a + ph[0]) + 0.018 * Math.sin(5 * a + ph[1]) + 0.01 * Math.sin(9 * a + ph[2]);
      // The pen drifts outward as it goes, so the end passes outside the start instead of closing neatly.
      pts.push(ellipse(a, wob * (0.975 + 0.06 * p)));
    }
    $("fm-circle").setAttribute("d", "M" + pts.map(([x, y]) => pt(x, y)).join(" L"));
  }
  const circle = $("fm-circle");
  const circleLen = circle.getTotalLength();
  circle.style.strokeDasharray = `${circleLen} ${circleLen + 40}`;

  // ---- The caption: Permanent Marker, wrapped into short lines, tilted, written on line by line ----
  const cap = $("fm-cap");
  const text = String(V.caption || "").trim();
  const MAX_W = 540;
  const MAX_H = 330;
  const measure = CA.make("span", "fm-measure", cap);
  const widthOf = (s) => { measure.textContent = s; return measure.getBoundingClientRect().width; };
  let size = 88;
  let lines = [];
  for (; size >= 40; size -= 2) {
    measure.style.fontSize = size + "px";
    lines = [];
    let line = "";
    for (const word of text.split(/\s+/).filter(Boolean)) {
      const next = line ? line + " " + word : word;
      if (line && widthOf(next) > MAX_W) { lines.push(line); line = word; } else line = next;
    }
    if (line) lines.push(line);
    const widest = Math.max(0, ...lines.map(widthOf));
    if (widest <= MAX_W + 4 && lines.length * size * 1.1 <= MAX_H) break;
  }
  const lineH = size * 1.1;
  const lineEls = lines.map((s, i) => {
    const el = CA.make("div", "fm-line", cap, s);
    el.style.fontSize = size + "px";
    el.style.top = (i * lineH).toFixed(1) + "px";
    // Each line starts a touch further right, the way a hand drifts writing fast.
    el.style.left = (i * 10) + "px";
    return { el, w: widthOf(s), chars: s.length };
  });
  measure.remove();
  const CAP_X = 64;
  const CAP_Y = 132;
  const ROT = -5 * Math.PI / 180;
  cap.style.transform = `translate(${CAP_X}px, ${CAP_Y}px) rotate(-5deg)`;
  const fromCap = (x, y) => [CAP_X + x * Math.cos(ROT) - y * Math.sin(ROT), CAP_Y + x * Math.sin(ROT) + y * Math.cos(ROT)];

  // ---- The arrow: from under the caption, bowing out to the left, hooking into the circle's left side ----
  const last = lineEls[lineEls.length - 1] || { w: 200 };
  const [sx, sy] = fromCap((lineEls.length - 1) * 10 + Math.min(last.w * 0.42, 150), lines.length * lineH + 22);
  const [ex, ey] = ellipse(Math.PI * 1.04, 1.1);
  const len = Math.hypot(ex - sx, ey - sy);
  const dx = (ex - sx) / len;
  const dy = (ey - sy) / len;
  const qx = (sx + ex) / 2 - dy * len * 0.3;
  const qy = (sy + ey) / 2 + dx * len * 0.3;
  {
    const N = 40;
    const pts = [];
    for (let i = 0; i <= N; i += 1) {
      const u = i / N;
      const x = (1 - u) * (1 - u) * sx + 2 * (1 - u) * u * qx + u * u * ex;
      const y = (1 - u) * (1 - u) * sy + 2 * (1 - u) * u * qy + u * u * ey;
      const w = 2.6 * Math.sin(u * Math.PI * 2.3 + ph[1]) * Math.sin(u * Math.PI);
      pts.push([x - dy * w, y + dx * w]);
    }
    $("fm-shaft").setAttribute("d", "M" + pts.map(([x, y]) => pt(x, y)).join(" L"));
  }
  // Barbs point back along the curve's last direction.
  const tx = ex - qx;
  const ty = ey - qy;
  const tl0 = Math.hypot(tx, ty);
  const ux = tx / tl0;
  const uy = ty / tl0;
  const barb = (deg, bend) => {
    const a = (deg * Math.PI) / 180;
    const bx = -(ux * Math.cos(a) - uy * Math.sin(a));
    const by = -(ux * Math.sin(a) + uy * Math.cos(a));
    const L = 52;
    const mx = ex + bx * L * 0.5 - by * bend;
    const my = ey + by * L * 0.5 + bx * bend;
    return `M${pt(ex, ey)} Q${pt(mx, my)} ${pt(ex + bx * L, ey + by * L)}`;
  };
  $("fm-barb1").setAttribute("d", barb(32, 2));
  $("fm-barb2").setAttribute("d", barb(-30, -2));
  const strokes = ["fm-shaft", "fm-barb1", "fm-barb2"].map((id) => {
    const el = $(id);
    const L = el.getTotalLength();
    el.style.strokeDasharray = `${L} ${L + 40}`;
    return { el, L };
  });

  // ---- Timing after the freeze (seconds after the key) ----
  const CIRCLE = [0.0, 0.36];
  const totalChars = lineEls.reduce((a, l) => a + l.chars, 0) || 1;
  const WRITE = [0.16, 0.16 + clamp(totalChars * 0.018, 0.4, 0.7)];
  const SHAFT = [WRITE[1] - 0.14, WRITE[1] + 0.1];
  const BARB1 = [SHAFT[1] - 0.02, SHAFT[1] + 0.07];
  const BARB2 = [BARB1[1] - 0.02, BARB1[1] + 0.07];
  const span = (d, [a, b]) => clamp((d - a) / (b - a));
  const lineSpans = [];
  {
    let c = 0;
    for (const l of lineEls) {
      const a = WRITE[0] + ((WRITE[1] - WRITE[0]) * c) / totalChars;
      c += l.chars;
      lineSpans.push([a, WRITE[0] + ((WRITE[1] - WRITE[0]) * c) / totalChars]);
    }
  }
  const showStroke = (el, L, p) => {
    el.style.opacity = p > 0.001 ? 1 : 0;
    el.style.strokeDashoffset = (L * (1 - p)).toFixed(2);
  };
  const ring = $("fm-ring");
  const arrow = $("fm-arrow");
  const flash = $("fm-flash");
  const svg = $("fm-svg");

  function draw(t) {
    const d = t - K;
    const out = 1 - ease(1 - clamp((end - t) / 0.25));
    flash.style.opacity = d < 0 ? 0 : (0.4 * (1 - ease(d / 0.16))).toFixed(3);

    showStroke(circle, circleLen, d < 0 ? 0 : pen(span(d, CIRCLE)));
    showStroke(strokes[0].el, strokes[0].L, d < 0 ? 0 : pen(span(d, SHAFT)));
    showStroke(strokes[1].el, strokes[1].L, d < 0 ? 0 : ease(span(d, BARB1)));
    showStroke(strokes[2].el, strokes[2].L, d < 0 ? 0 : ease(span(d, BARB2)));

    lineEls.forEach((l, i) => {
      const q = d < 0 ? 0 : span(d, lineSpans[i]);
      const right = (1 - q) * (l.w + 50) - 25;
      l.el.style.clipPath = `inset(-40px ${right.toFixed(1)}px -40px -25px)`;
      l.el.style.visibility = q > 0 ? "visible" : "hidden";
    });

    // A faint hand-drawn boil: the ink shifts a pixel or so eight times a second, so the held frame doesn't feel dead.
    if (d >= 0) {
      const r = seeded(101 + Math.floor(d * 8));
      const j = () => (r() - 0.5) * 2;
      ring.setAttribute("transform", `translate(${(j() * 1.4).toFixed(2)} ${(j() * 1.4).toFixed(2)}) rotate(${(j() * 0.35).toFixed(3)} ${ecx.toFixed(1)} ${ecy.toFixed(1)})`);
      arrow.setAttribute("transform", `translate(${(j() * 1.4).toFixed(2)} ${(j() * 1.4).toFixed(2)})`);
      cap.style.transform = `translate(${(CAP_X + j() * 0.9).toFixed(2)}px, ${(CAP_Y + j() * 0.9).toFixed(2)}px) rotate(${(-5 + j() * 0.2).toFixed(3)}deg)`;
    }
    svg.style.opacity = out.toFixed(3);
    cap.style.opacity = out.toFixed(3);
  }

  const tl = gsap.timeline({ paused: true });
  const clock = { t: 0 };
  tl.to(clock, { t: end, duration: end, ease: "none", onUpdate: () => draw(clock.t) });
  draw(0);
  window.__timelines["block"] = tl;
});
