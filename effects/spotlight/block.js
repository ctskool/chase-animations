CA.ready(() => {
  const { vars: V, time: T, head, fit } = CA;
  const $ = (id) => document.getElementById(id);
  const clamp = (n, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));
  const ease = (p) => 1 - Math.pow(1 - clamp(p), 3);
  const dark = $("sp-dark");
  const pool = $("sp-pool");
  const word = $("sp-word");
  const text = String(V.word || "").trim();
  $("sp-core").textContent = text;
  $("sp-glow").textContent = text;
  word.style.setProperty("--sp-glow", V.glow);
  const px = fit($("sp-core"), 1000, 120);
  $("sp-glow").style.fontSize = px + "px";

  const K = T.key;
  const end = T.duration;
  // Neon catching: on, off, on, a stutter, then steady.
  const flicker = [[0, 1], [0.05, 0.15], [0.09, 1], [0.2, 0.45], [0.24, 1]];
  const neon = (t) => {
    if (t < 0) return 0;
    let v = 0;
    for (const [at, val] of flicker) if (t >= at) v = val;
    return v;
  };
  const start = head(0);

  function draw(t) {
    const h = head(t);
    const lights = t < K ? 0 : ease((t - K) / 0.08);
    const back = clamp((end - t) / 0.35);
    dark.style.opacity = (clamp(Number(V.dark), 0, 1) * lights * back).toFixed(3);
    pool.style.opacity = (lights * back).toFixed(3);
    pool.style.transform = `translate(${h.cx - 700}px, ${h.chin - 760}px)`;
    // The word drifts with the speaker at a third of the speed, so it reads as further back in the room.
    const x = start.cx + (h.cx - start.cx) * 0.35 - 540;
    const y = h.top + (h.chin - h.top) * Number(V.lift) - px * 0.5;
    word.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    word.style.opacity = (neon(t - K) * back).toFixed(3);
  }

  const tl = gsap.timeline({ paused: true });
  const clock = { t: 0 };
  tl.to(clock, { t: end, duration: end, ease: "none", onUpdate: () => draw(clock.t) });
  draw(0);
  window.__timelines["block"] = tl;
});
