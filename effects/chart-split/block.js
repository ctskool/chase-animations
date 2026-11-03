CA.ready(() => {
  const { vars: V, time: T, card, make, fit } = CA;
  const $ = (id) => document.getElementById(id);
  const clamp = (n, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));
  const easeOut = (p) => 1 - Math.pow(1 - clamp(p), 3);
  const back = $("back");
  back.style.setProperty("--page", V.page);
  back.style.setProperty("--accent", V.accent);

  // The page is opaque except the card, where his shot shows through.
  Object.assign($("cs-hole").style, { left: card.x + "px", top: card.y + "px", width: card.w + "px", height: card.h + "px", borderRadius: card.r + "px" });
  $("cs-title").textContent = V.title;
  $("cs-note").textContent = V.note;

  const items = [1, 2, 3, 4, 5]
    .map((i) => ({ i, name: String(V[`s${i}Name`] || "").trim(), by: String(V[`s${i}By`] || "").trim(), value: Number(V[`s${i}Value`]) || 0 }))
    .filter((s) => s.name);
  const find = (ref) => {
    const r = String(ref).trim().toLowerCase();
    if (!r) return null;
    return items.find((s) => String(s.i) === r) || items.find((s) => s.name.toLowerCase() === r)
      || items.find((s) => s.name.toLowerCase().startsWith(r)) || null;
  };
  const hi = new Set(String(V.highlight || "").split(",").map(find).filter(Boolean));
  items.sort((a, b) => b.value - a.value);

  // Rounded the way people say it: 109K, 15K, 6.3K.
  const short = (v) => {
    if (v >= 1e6) return (v / 1e6).toFixed(v >= 1e7 ? 0 : 1).replace(/\.0$/, "") + "M";
    if (v >= 1e4) return Math.round(v / 1e3) + "K";
    if (v >= 1e3) return (v / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
    return String(Math.round(v));
  };

  const TOP = 284;
  const PITCH = Math.min(128, 640 / Math.max(1, items.length));
  const MAX_W = 850;
  const top = Math.max(...items.map((s) => s.value), 1);
  const rows = items.map((s, k) => {
    const row = make("div", "cs-row" + (hi.has(s) ? " hi" : ""), $("cs-rows"));
    row.style.top = TOP + k * PITCH + "px";
    const label = make("div", "cs-label", row);
    const nm = make("span", "cs-name", label, s.name);
    if (s.by) make("span", "cs-by", label, s.by);
    fit(label, 1000, 34);
    const bar = make("div", "cs-bar", row);
    const value = make("div", "cs-value", row, short(s.value));
    const w = Math.max(28, (s.value / top) * MAX_W);
    return { s, row, bar, value, w, hi: hi.has(s), rank: k, nm };
  });

  const K = T.key;
  const ring = (dt, amp, freq, decay) => (dt <= 0 ? 0 : amp * Math.exp(-decay * dt) * Math.sin(freq * dt));
  // The plain bars grow straight away, smallest gap first; the highlighted ones wait for the word.
  const plain = rows.filter((r) => !r.hi);
  plain.forEach((r, k) => { r.start = 0.04 + k * 0.06; });
  const SHOOT = Math.min(0.16, Math.max(0.06, K - 0.02));

  function draw(t) {
    for (const r of rows) {
      let w;
      let vOpacity;
      let vScale = 1;
      if (!r.hi) {
        const p = easeOut((t - r.start) / 0.45);
        w = r.w * p;
        vOpacity = clamp((t - r.start - 0.18) / 0.15);
      } else if (t < K - SHOOT) {
        w = 0;
        vOpacity = 0;
      } else if (t < K) {
        const p = clamp((t - (K - SHOOT)) / SHOOT);
        w = r.w * p * p;
        vOpacity = 0;
      } else {
        const dt = t - K;
        // Overshoots its true length a hair and settles; the number lands big and snaps to size.
        w = r.w * (1 + ring(dt, 0.035, 24, 9));
        vOpacity = 1;
        vScale = 1 + 0.42 * Math.exp(-14 * dt) * Math.cos(18 * dt);
      }
      r.bar.style.width = Math.max(0, w).toFixed(1) + "px";
      r.bar.style.opacity = w > 0.5 ? 1 : 0;
      r.value.style.left = (Math.max(0, w) + 18).toFixed(1) + "px";
      r.value.style.opacity = vOpacity.toFixed(3);
      r.value.style.transform = `scale(${vScale.toFixed(3)})`;
    }
  }

  const tl = gsap.timeline({ paused: true });
  const clock = { t: 0 };
  tl.to(clock, { t: T.duration, duration: T.duration, ease: "none", onUpdate: () => draw(clock.t) });
  draw(0);
  window.__timelines["block"] = tl;
});
