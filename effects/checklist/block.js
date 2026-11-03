CA.ready(() => {
  const { vars: V, time: T, head, fit, words, rgba } = CA;
  const KIT = CA.claude;
  const $ = (id) => document.getElementById(id);
  const clamp = (n, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));
  const ease = (p) => 1 - Math.pow(1 - clamp(p), 3);
  const lerp = (a, b, k) => a + (b - a) * k;
  // Back-out: overshoots then lands on 1, for the tick pop.
  const backOut = (p, s = 2.2) => { const q = clamp(p) - 1; return 1 + q * q * ((s + 1) * q + s); };

  const front = $("front");
  front.style.display = CA.layer === "front" || !CA.layer ? "block" : "none";

  const card = $("cl-card");
  const W = Math.round(Number(V.width) || 700);
  card.style.width = W + "px";
  card.style.setProperty("--cl-ground", V.ground);
  card.style.setProperty("--cl-done", V.doneColor);
  card.style.setProperty("--cl-done-soft", rgba(V.doneColor, 0.35));

  KIT.logo($("cl-logo"), 64, V.accent);
  $("cl-title").textContent = String(V.title || "");
  $("cl-sub").textContent = String(V.sub || "");
  const textRoom = W - 88 - 64 - 24;
  fit($("cl-title"), textRoom, 40);
  fit($("cl-sub"), textRoom, 34);

  // ---- Items, and when each one is said ----
  const labels = [V.item1, V.item2, V.item3, V.item4, V.item5].map((s) => String(s || "").trim()).filter(Boolean);
  const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, "");
  const same = (a, b) => a === b || a + "s" === b || b + "s" === a || a + "es" === b || b + "es" === a;
  const spoken = words.map((w) => ({ n: norm(w.w), t: w.t }));
  const times = [];
  let prev = -Infinity;
  labels.forEach((label, i) => {
    const key = norm(label.split(/\s+/)[0]);
    const hit = spoken.find((w) => w.t > prev && same(w.n, key));
    const at = hit ? hit.t : i === 0 ? T.key : prev + 0.6;
    times.push(at);
    prev = at;
  });

  const list = $("cl-list");
  const rows = labels.map((label) => {
    const row = CA.make("div", "cl-row", list);
    const mark = CA.make("div", "cl-mark", row);
    const ring = CA.make("div", "cl-ring", mark);
    const burst = CA.make("div", "cl-ring", mark);
    burst.style.borderColor = V.doneColor;
    burst.style.opacity = 0;
    const dot = CA.make("div", "cl-dot", mark);
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 46 46");
    svg.setAttribute("class", "cl-tick");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M13 24 L20 31 L33 16");
    svg.appendChild(path);
    mark.appendChild(svg);
    const len = path.getTotalLength();
    path.style.strokeDasharray = len;
    path.style.strokeDashoffset = len;
    const text = CA.make("div", "cl-text", row, label);
    fit(text, W - 88 - 72, 34);
    return { row, mark, ring, burst, dot, path, len, text };
  });

  // One spinner that sits on whichever item is being worked on.
  const spinHost = CA.make("div", "cl-spin", null);
  spinHost.style.position = "absolute";
  const spin = KIT.spinner(spinHost, 40, V.accent);

  const end = T.duration;
  const firstTick = times.length ? times[0] : T.key;
  const lastTick = times.length ? times[times.length - 1] : T.key;
  const enterAt = clamp(firstTick - 1.0, 0.05, Math.max(0.05, end - 1.5));

  // ---- Placement: centred, below the chin, drifting after the head with a little lag and overshoot ----
  const H = card.offsetHeight;
  const h0 = head(0);
  const baseTop = Number(V.top) || 1092;
  const drift = clamp(Number(V.drift), 0, 1);
  const step = 1 / 120;
  const follow = [];
  {
    let x = 0, y = 0, vx = 0, vy = 0;
    const k = 60, c = 9; // stiff enough to keep up, soft enough to settle past the target a touch
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

  function draw(t) {
    const h = head(t);
    const [dx, dy] = drifted(t);

    // Enter from below with weight: a heavy rise that settles a few px past home and back.
    const u = t - enterAt;
    const rise = u <= 0 ? 0 : 1 - Math.exp(-7.5 * u) * Math.cos(9.5 * u);
    const inA = ease(u / 0.22);
    const exitP = clamp((end - t) / 0.35);
    const outK = 1 - ease(exitP);

    // Last item: the whole card settles with a small pulse.
    const pu = t - lastTick - 0.04;
    const pulse = pu > 0 && pu < 0.5 ? Math.sin((pu / 0.5) * Math.PI) * Math.exp(-3 * pu) : 0;

    let top = baseTop + dy + (1 - rise) * 320 + outK * 60;
    top = Math.max(top, h.chin + 24);
    const left = 540 - W / 2 + dx;
    const scale = lerp(0.93, 1, clamp(rise)) * (1 - outK * 0.03) * (1 + pulse * 0.035);
    card.style.transform = `translate(${left.toFixed(1)}px, ${top.toFixed(1)}px) scale(${scale.toFixed(4)})`;
    card.style.opacity = (inA * exitP).toFixed(3);
    $("cl-flash").style.opacity = (pulse * 1.1).toFixed(3);

    // Items.
    let active = -1;
    rows.forEach((r, i) => {
      const d = t - times[i];
      if (d < 0) {
        if (active < 0) active = i;
        r.ring.style.opacity = 1;
        r.dot.style.opacity = 0;
        r.dot.style.transform = "scale(0.4)";
        r.path.style.strokeDashoffset = r.len;
        r.burst.style.opacity = 0;
        r.text.style.color = "#8d8782";
        r.text.style.transform = "none";
        return;
      }
      const pop = lerp(0.35, 1, backOut(d / 0.24));
      r.ring.style.opacity = (1 - ease(d / 0.08)).toFixed(3);
      r.dot.style.opacity = ease(d / 0.05).toFixed(3);
      r.dot.style.transform = `scale(${pop.toFixed(3)})`;
      r.path.style.strokeDashoffset = (r.len * (1 - ease((d - 0.05) / 0.16))).toFixed(2);
      const b = clamp(d / 0.4);
      r.burst.style.opacity = (0.75 * (1 - b)).toFixed(3);
      r.burst.style.transform = `scale(${(1 + ease(b) * 0.9).toFixed(3)})`;
      const lit = ease(d / 0.12);
      const c = Math.round(lerp(141, 255, lit));
      r.text.style.color = `rgb(${c}, ${Math.round(lerp(135, 255, lit))}, ${Math.round(lerp(130, 255, lit))})`;
      const nudge = d < 0.3 ? Math.sin((d / 0.3) * Math.PI) * 8 : 0;
      r.text.style.transform = `translateX(${nudge.toFixed(1)}px)`;
    });

    if (active >= 0) {
      const r = rows[active];
      if (spinHost.parentNode !== r.mark) r.mark.appendChild(spinHost);
      spinHost.style.display = "block";
      r.ring.style.opacity = 0;
      r.text.style.color = "#d8d2cc";
    } else {
      spinHost.style.display = "none";
    }
  }

  const tl = gsap.timeline({ paused: true });
  const clock = { t: 0 };
  tl.to(clock, { t: end, duration: end, ease: "none", onUpdate: () => draw(clock.t) });
  spin.run(tl, 0, end);
  draw(0);
  window.__timelines["block"] = tl;
});
