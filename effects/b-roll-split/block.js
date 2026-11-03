CA.ready(async () => {
  const { vars: V, time: T, card } = CA;
  const $ = (id) => document.getElementById(id);
  const clamp = (n, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));
  const ease = (p) => 1 - Math.pow(1 - clamp(p), 3);
  const back = $("back");
  back.style.display = CA.layer === "back" || !CA.layer ? "block" : "none";
  back.style.setProperty("--page", V.page);
  back.style.setProperty("--accent", V.accent);

  // The page is opaque except the card, where his shot shows through.
  Object.assign($("br-hole").style, { left: card.x + "px", top: card.y + "px", width: card.w + "px", height: card.h + "px", borderRadius: card.r + "px" });

  // ---- Layout: an optional label, then the browser window down to just above where his head breaks the card ----
  const label = String(V.caption || "").trim();
  const LABEL_TOP = 150;
  $("br-label").style.display = label ? "flex" : "none";
  $("br-label").style.top = LABEL_TOP + "px";
  $("br-label-text").textContent = label;
  if (label) CA.fit($("br-label-text"), card.w - 60, 34);
  const winX = card.x;
  const winW = card.w;
  const winY = label ? LABEL_TOP + 44 + 30 : 160;
  const winBottom = card.y - card.rise - 42;
  const winH = winBottom - winY;
  const BAR = 96;
  const win = $("br-win");
  Object.assign(win.style, { left: winX + "px", top: winY + "px", width: winW + "px", height: winH + "px" });
  const view = $("br-view");
  view.style.top = BAR + "px";
  const vw = winW;
  const vh = winH - BAR;

  const url = String(V.url || "").trim();
  const urlEl = $("br-url");
  const caret = $("br-caret");
  urlEl.textContent = url;
  CA.fit(urlEl, winW - 26 * 2 - 3 * 20 - 24 - 26 - 26 * 2 - 28 - 14 - 10, 34);

  // ---- The picture: given, or the built-in designed page. Fitted to the width, anchored at its top ----
  const img = $("br-img");
  img.src = V.image ? V.image : "assets/default.png";
  await img.decode();
  const s = Math.max(vw / img.naturalWidth, vh / img.naturalHeight);
  const iw = img.naturalWidth * s;
  const ih = img.naturalHeight * s;
  img.style.width = iw + "px";
  img.style.height = ih + "px";
  const baseX = -(iw - vw) / 2;
  // Tall pages drift down the page like a slow scroll; wide ones mostly push in.
  const driftY = Math.min(ih - vh, vh * 0.28);

  // ---- Timing ----
  const K = T.key;
  const end = T.duration;
  const ENTER = 0.28;
  const typeFrom = Math.min(0.32, K * 0.3);
  const typeTo = Math.max(typeFrom + 0.3, K - 0.18);
  const LOAD = 0.4;

  function draw(t) {
    // The window rises in from the page (the page itself can cut in straight from another split).
    const e = ease(t / ENTER);
    win.style.opacity = e.toFixed(3);
    win.style.transform = `translateY(${((1 - e) * 36).toFixed(1)}px)`;
    $("br-label").style.opacity = e.toFixed(3);

    // The address types itself in, with a blinking caret, then the page loads on the word.
    const n = Math.round(url.length * clamp((t - typeFrom) / (typeTo - typeFrom)));
    urlEl.textContent = url.slice(0, n);
    const typing = t >= typeFrom && t < typeTo;
    const blinkOn = Math.floor(t / 0.42) % 2 === 0;
    caret.style.opacity = t < K + 0.06 && (typing || blinkOn) ? 1 : 0;

    const d = t - K;
    const bar = d < 0 ? 0 : d < 0.18 ? 0.75 * ease(d / 0.18) : 0.75 + 0.25 * ease((d - 0.18) / (LOAD - 0.18));
    const prog = $("br-progress");
    prog.style.transform = `scaleX(${bar.toFixed(4)})`;
    prog.style.opacity = d < LOAD ? 1 : (1 - clamp((d - LOAD) / 0.14)).toFixed(3);

    // The picture lands a touch big and settles, then drifts for the rest of the stretch.
    const shown = d < 0 ? 0 : ease(d / 0.16);
    const land = d < 0 ? 1.03 : 1 + 0.03 * Math.exp(-9 * d) * Math.cos(7 * d);
    const u = clamp(d / Math.max(0.1, end - K));
    const glide = 0.35 * u + 0.65 * u * u * (3 - 2 * u);
    const zoom = land * (1 + 0.05 * glide);
    img.style.opacity = shown.toFixed(3);
    img.style.transform = `translate(${baseX.toFixed(1)}px, ${(-driftY * glide).toFixed(1)}px) scale(${zoom.toFixed(4)})`;
    $("br-skel").style.opacity = (1 - shown).toFixed(3);
  }

  const tl = gsap.timeline({ paused: true });
  const clock = { t: 0 };
  tl.to(clock, { t: end, duration: end, ease: "none", onUpdate: () => draw(clock.t) });
  draw(0);
  window.__timelines["block"] = tl;
});
