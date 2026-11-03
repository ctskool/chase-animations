CA.ready(() => {
  const { vars: V, time: T, head, fit } = CA;
  const $ = (id) => document.getElementById(id);
  const clamp = (n, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));
  const ease = (p) => 1 - Math.pow(1 - clamp(p), 3);

  const front = $("front");
  front.style.display = CA.layer === "front" || !CA.layer ? "block" : "none";

  const card = $("pc-card");
  const W = Math.round(Number(V.width) || 640);
  card.style.width = W + "px";

  // ---- Header: avatar + "Replying to @handle" ----
  let handle = String(V.handle || "").trim();
  if (handle && handle[0] !== "@") handle = "@" + handle;
  $("pc-handle").textContent = handle;
  const initial = handle.replace(/[^a-z0-9]/gi, "").charAt(0).toUpperCase() || "?";
  $("pc-initial").textContent = initial;
  const av = String(V.avatar || "#8A5CF6");
  $("pc-avatar").style.background = `linear-gradient(140deg, ${av}, #F2994A)`;
  fit($("pc-reply"), W - 60 - 58 - 16, 34);

  // ---- Comment text, one span per character so typing never reflows ----
  const textEl = $("pc-text");
  const chars = Array.from(String(V.text || ""));
  const spans = chars.map((c) => CA.make("span", "", textEl, c));
  const caret = CA.make("div", "", textEl);
  caret.id = "pc-caret";
  // Keep it to three lines on a phone; shrink a little if a long comment needs it (never under 36 px).
  const lineH = () => parseFloat(getComputedStyle(textEl).fontSize) * 1.18;
  let px = 44;
  while (px > 36 && textEl.offsetHeight > lineH() * 3 + 2) {
    px -= 1;
    textEl.style.fontSize = px + "px";
  }
  const fontPx = parseFloat(getComputedStyle(textEl).fontSize);
  const caretH = Math.round(fontPx * 0.95);
  caret.style.height = caretH + "px";
  // Where the caret sits after n characters (measured once).
  const caretAt = [{ x: 0, y: (lineH() - caretH) / 2 }];
  spans.forEach((s) => caretAt.push({ x: s.offsetLeft + s.offsetWidth + 2, y: s.offsetTop + (s.offsetHeight - caretH) / 2 }));

  const H = card.offsetHeight;
  const end = T.duration;
  const key = T.key;
  const enterAt = Math.max(0.02, key - 0.26);
  const typeAt = key - 0.04;
  const speed = Math.max(5, Number(V.typeSpeed) || 42);
  const typedBy = typeAt + chars.length / speed;

  // ---- Drift: follows the head at a fraction of its motion, with lag and a little overshoot ----
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

  const baseLeft = Number(V.left) || 44;
  const tilt = Number(V.tilt) || 0;
  let shown = -1;

  function draw(t) {
    const h = head(t);
    const [dx, dy] = drifted(t);

    // Land: pops out toward its corner nearest the head, overshoots a touch and settles.
    const u = t - enterAt;
    const s = u <= 0 ? 0 : 1 - Math.exp(-8.5 * u) * Math.cos(12 * u);
    const inA = ease(u / 0.12);
    const exitP = clamp((end - t) / 0.3);
    const outK = 1 - ease(exitP);

    // Settled float: a slow, small sway once it has landed.
    const settle = ease((t - key - 0.2) / 0.8);
    const fx = Math.sin(t * 1.1 + 0.6) * 3 * settle;
    const fy = Math.sin(t * 1.7) * 4 * settle;

    const left = baseLeft + dx + fx;
    let bottom = h0.top - 34 + dy + fy;
    // Never over the face: when the card reaches across the head's width, it stays above the top of the head.
    if (left + W > h.cx - h.w / 2 - 12) bottom = Math.min(bottom, h.top - 26);
    let top = bottom - H - outK * 18;
    top = Math.max(top, 80);

    const scale = (0.55 + 0.45 * s) * (1 - outK * 0.05);
    const rot = tilt - (1 - clamp(s, 0, 1.2)) * 6;
    card.style.transform = `translate(${left.toFixed(1)}px, ${top.toFixed(1)}px) rotate(${rot.toFixed(2)}deg) scale(${scale.toFixed(4)})`;
    card.style.opacity = (inA * exitP).toFixed(3);

    // Typing.
    const n = Math.max(0, Math.min(chars.length, Math.floor((t - typeAt) * speed)));
    if (n !== shown) {
      spans.forEach((sp, i) => sp.classList.toggle("on", i < n));
      shown = n;
    }
    const c = caretAt[n];
    caret.style.transform = `translate(${c.x.toFixed(1)}px, ${c.y.toFixed(1)}px)`;
    // Solid while typing, then two soft blinks and gone.
    const after = t - typedBy;
    let ca = 0;
    if (t >= typeAt && after < 0) ca = 1;
    else if (after >= 0 && after < 1.2) ca = Math.cos(after * Math.PI * 2 / 0.6) > 0 ? 1 : 0;
    caret.style.opacity = (ca * inA).toFixed(2);
  }

  const tl = gsap.timeline({ paused: true });
  const clock = { t: 0 };
  tl.to(clock, { t: end, duration: end, ease: "none", onUpdate: () => draw(clock.t) });
  draw(0);
  window.__timelines["block"] = tl;
});
