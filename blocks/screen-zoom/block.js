// Screen zoom. Camera and cursor are one function of time, driven through GSAP modifiers: the blur sampler seeks
// with events off, so an onUpdate wouldn't fire for it, but a modifier runs on every seek.
CA.ready(async () => {
  const { vars: V, stage: S, time: T, variant, grainUrl, make } = CA;
  const $ = (id) => document.getElementById(id);
  const W = S.w;
  const H = S.h;
  const stageEl = $("stage");
  stageEl.style.setProperty("--accent", V.accent);
  stageEl.style.setProperty("--playhead", V.playhead);
  $("backdrop").style.background = `radial-gradient(90% 60% at 18% 12%, ${V.backdropA}, transparent 70%),
    linear-gradient(160deg, ${V.backdropB}, ${V.backdropC})`;
  $("grain").style.backgroundImage = grainUrl(200, 0.9, 3);

  // Wide shot.
  const shot = {
    full: { w: 952, h: 1120, cx: W / 2, cy: 900, pillY: 1430, pillPx: 40, goal: [0.68, 0.33] },
    top: { w: 900, h: 690, cx: W / 2, cy: 520, pillY: 800, pillPx: 34, goal: [0.7, 0.34] },
    overlay: { w: 860, h: 660, cx: W / 2, cy: 420, pillY: 730, pillPx: 34, goal: [0.7, 0.32] },
  }[variant];

  const win = $("window");
  win.style.background = V.windowColor;
  $("app-name").textContent = V.appName;
  $("file-size").textContent = V.stat2Value;
  $("project").textContent = V.projectName;
  $("subtitle").textContent = V.subtitle;
  $("s1l").textContent = V.stat1Label;
  $("s1v").textContent = V.stat1Value;
  $("s2l").textContent = V.stat2Label;
  $("s2v").textContent = V.stat2Value;
  [V.side1, V.side2, V.side3].forEach((text, i) => make("div", i === 0 ? "side-item on" : "side-item", $("sidebar"), text));
  $("btn-label").textContent = V.buttonLabel;
  $("btn-done").textContent = V.doneLabel;

  // A member's own screen replaces the built-in one.
  const screen = $("screen");
  let image = null;
  if (V.screenImage) {
    image = new Image();
    image.src = V.screenImage;
    await image.decode();
    screen.replaceChildren(image);
    shot.h = Math.min(shot.h, Math.round((shot.w * image.naturalHeight) / image.naturalWidth) + 58);
  } else if (V.screenHtml) {
    screen.innerHTML = V.screenHtml;
  }

  win.style.width = shot.w + "px";
  win.style.height = shot.h + "px";
  win.style.left = shot.cx - shot.w / 2 + "px";
  win.style.top = shot.cy - shot.h / 2 + "px";

  // World position of the target, measured once before anything moves.
  const stageBox = stageEl.getBoundingClientRect();
  const button = image ? null : screen.querySelector("[data-target]");
  let P;
  if (button) {
    const b = button.getBoundingClientRect();
    P = { x: b.left - stageBox.left + b.width * 0.62, y: b.top - stageBox.top + b.height * 0.56 };
  } else if (image) {
    const b = image.getBoundingClientRect();
    P = { x: b.left - stageBox.left + (b.width * V.targetX) / 100, y: b.top - stageBox.top + (b.height * V.targetY) / 100 };
  } else {
    throw new Error("screenHtml needs an element with data-target on the button");
  }

  const Z = V.zoom;
  const G = { x: W * shot.goal[0], y: H * shot.goal[1] };
  const A = { x: shot.cx - shot.w * 0.14, y: shot.cy + shot.h * 0.12 };
  const dx = P.x - A.x;
  const dy = P.y - A.y;
  const bow = 0.2;
  const C = { x: (A.x + P.x) / 2 + dy * bow, y: (A.y + P.y) / 2 - dx * bow };

  const B = { cursorGo: 0.2, cursorRun: 1.1, camGo: 0.42, camRun: 1.2 };
  const design = (t) => (t <= T.key ? t / T.scale : T.design + (t - T.key));
  const clamp = (x) => Math.min(1, Math.max(0, x));
  const inOut = (p) => (p < 0.5 ? 16 * p ** 5 : 1 - (-2 * p + 2) ** 5 / 2);
  const glide = (p) => (p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2);
  // A critically damped spring, normalised to finish at exactly 1: soft in, soft out, no bounce.
  const spring = (p) => {
    const w = 8.2;
    const f = (x) => 1 - (1 + w * x) * Math.exp(-w * x);
    return f(glide(p) * 0.35 + p * 0.65) / f(1);
  };

  const view = (t) => {
    const d = design(t);
    const z = spring(clamp((d - B.camGo) / B.camRun));
    const s = Z ** z;
    const fx = P.x + (G.x - P.x) * z;
    const fy = P.y + (G.y - P.y) * z;
    return { s, x: fx - s * P.x, y: fy - s * P.y, z };
  };
  const pointer = (t) => {
    const d = design(t);
    const p = inOut(clamp((d - B.cursorGo) / B.cursorRun));
    const a = (1 - p) * (1 - p);
    const b = 2 * p * (1 - p);
    const c = p * p;
    const v = view(t);
    const wob = t > T.key + 0.5 ? Math.sin((t - T.key) * 2.1) * 3 : 0;
    return {
      x: v.s * (a * A.x + b * C.x + c * P.x) + v.x - 6,
      y: v.s * (a * A.y + b * C.y + c * P.y) + v.y - 4 + wob,
      scale: (1 + 0.45 * v.z) * (1 - 0.13 * Math.max(0, Math.sin(clamp((t - T.key + 0.05) / 0.2) * Math.PI))),
    };
  };

  const tl = gsap.timeline({ paused: true });
  tl.fromTo(
    "#cam",
    { x: 0, y: 0, scaleX: 1, scaleY: 1 },
    {
      x: 1, y: 1, scaleX: 2, scaleY: 2, duration: T.duration, ease: "none",
      modifiers: {
        x: () => view(tl.time()).x + "px",
        y: () => view(tl.time()).y + "px",
        scaleX: () => view(tl.time()).s,
        scaleY: () => view(tl.time()).s,
      },
    },
    0,
  );
  tl.fromTo(
    "#cursor",
    { x: 0, y: 0, scaleX: 1, scaleY: 1 },
    {
      x: 1, y: 1, scaleX: 2, scaleY: 2, duration: T.duration, ease: "none",
      modifiers: {
        x: () => pointer(tl.time()).x + "px",
        y: () => pointer(tl.time()).y + "px",
        scaleX: () => pointer(tl.time()).scale,
        scaleY: () => pointer(tl.time()).scale,
      },
    },
    0,
  );

  // The click.
  const K = T.key;
  if (button) {
    tl.to(button, { filter: "brightness(0.82)", duration: 0.12, ease: "none" }, K - 0.22);
    tl.to(button, { scale: 0.95, duration: 0.07, ease: "power2.out" }, K);
    tl.to(button, { scale: 1, filter: "brightness(1)", duration: 0.36, ease: "back.out(3)" }, K + 0.07);
  }
  const ringPx = 180;
  const place = (el, px) => {
    el.style.width = el.style.height = px + "px";
    gsap.set(el, { x: G.x - px / 2, y: G.y - px / 2 });
  };
  place($("ring"), ringPx);
  place($("ripple"), ringPx * 2);
  tl.set("#ring", { opacity: 1 }, K);
  tl.fromTo("#ring", { scale: 0.18 }, { scale: 1, duration: 0.42, ease: "back.out(1.6)", immediateRender: false }, K);
  tl.to("#ring", { opacity: 0, duration: 0.26, ease: "power1.in" }, K + 0.22);
  tl.set("#ripple", { opacity: 0.7 }, K + 0.06);
  tl.fromTo("#ripple", { scale: 0.3 }, { scale: 1, duration: 0.6, ease: "power2.out", immediateRender: false }, K + 0.06);
  tl.to("#ripple", { opacity: 0, duration: 0.42, ease: "power1.in" }, K + 0.24);

  // What the click did: the label flips and the work runs, so the hold keeps moving.
  if (!image && $("btn-done")) {
    tl.set("#btn-label", { visibility: "hidden" }, K + 0.14);
    tl.set("#btn-done", { visibility: "visible" }, K + 0.14);
    if ($("progress")) tl.to("#progress", { scaleX: 1, duration: Math.max(0.6, T.hold - 0.3), ease: "power1.inOut" }, K + 0.12);
    if ($("scrub")) {
      tl.fromTo("#scrub", { x: shot.w * 0.18 }, { x: shot.w * 0.42, duration: T.duration - K, ease: "none", immediateRender: false }, K);
      gsap.set("#scrub", { x: shot.w * 0.18 });
    }
  }

  // Step pill, last.
  const stepEl = $("step");
  const numEl = $("step-num");
  $("step-text").textContent = V.stepLabel;
  numEl.textContent = V.stepNumber;
  stepEl.style.fontSize = shot.pillPx + "px";
  const dot = Math.round(shot.pillPx * 1.5);
  numEl.style.cssText = `width:${dot}px;height:${dot}px;font-size:${Math.round(shot.pillPx * 0.82)}px`;
  CA.fit($("step-text"), W - 200, 22);
  stepEl.style.visibility = "visible";
  stepEl.style.left = (W - stepEl.offsetWidth) / 2 + "px";
  stepEl.style.top = shot.pillY - stepEl.offsetHeight / 2 + "px";
  stepEl.style.visibility = "";
  tl.set(stepEl, { visibility: "visible" }, K + 0.28);
  tl.fromTo(stepEl, { scale: 0.4 }, { scale: 1, duration: 0.36, ease: "back.out(2.4)", immediateRender: false }, K + 0.28);
  tl.fromTo(numEl, { scale: 0 }, { scale: 1, duration: 0.3, ease: "back.out(3)", immediateRender: false }, K + 0.38);

  // In and out as a circle around the click, when there is footage behind it to reveal.
  const Rmax = Math.hypot(W, H);
  const gx = (G.x / W) * 100;
  const gy = (G.y / H) * 100;
  if (variant === "overlay") {
    tl.fromTo(stageEl, { clipPath: `circle(0px at 50% 50%)` }, { clipPath: `circle(${Rmax}px at 50% 50%)`, duration: 0.3, ease: "power3.out" }, 0);
  }
  if (T.exit > 0) {
    tl.fromTo(stageEl, { clipPath: `circle(${Rmax}px at ${gx}% ${gy}%)` }, { clipPath: `circle(0px at ${gx}% ${gy}%)`, duration: T.exit, ease: "power3.in", immediateRender: false }, T.key + T.hold);
  }

  window.__timelines["block"] = tl;
});
