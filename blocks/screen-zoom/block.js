// Camera and pointer positions remain correct during event-suppressed
// motion-blur sampling. All interface text stays live DOM.
CA.ready(async () => {
  const { vars: V, stage: S, safe, time: T, variant, grainUrl, make } = CA;
  const $ = (id) => document.getElementById(id);
  const W = S.w;
  const H = S.h;
  const stageEl = $("stage");
  const isFull = variant === "full";
  const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));

  Object.entries({
    "--accent": V.accent,
    "--playhead": V.playhead,
    "--window": V.windowColor,
    "--chrome": V.chromeColor,
    "--panel": V.panelColor,
    "--line": V.lineColor,
    "--text": V.textColor,
    "--muted": V.mutedColor,
    "--preview": V.previewColor,
  }).forEach(([name, value]) => stageEl.style.setProperty(name, value));

  $("backdrop").style.background =
    `radial-gradient(90% 60% at 18% 12%, ${V.backdropA}, transparent 70%), ` +
    `linear-gradient(160deg, ${V.backdropB}, ${V.backdropC})`;
  $("grain").style.backgroundImage = grainUrl(200, 0.9, 3);

  // The opening is a compact editing window, not a tall empty preview.
  // Larger publish controls are visible before the camera starts.
  const shot = {
    full: {
      w: 1000, h: 780, cy: H * 0.49,
      bar: 60, side: 112, pad: 24, head: 128, gap: 20,
      contentGap: 20, workspaceGap: 18, previewH: 260,
      panel: 420, panelPad: 28,
      buttonH: 104, buttonPx: 48, titlePx: 54, subtitlePx: 40,
      rowH: 76, rowPx: 40, tickPx: 34, targetsGap: 20,
      statPx: 36, statLabelPx: 28, trackH: 30,
      zoomFactor: 1, goalY: 0.44,
      pillPx: 58, pillGap: 32,
      cornerTop: 40, cornerRight: 64,
      bottom: Math.max(300, safe.bottom),
      ringPx: 220,
    },
    top: {
      w: 1000, h: Math.min(720, H - 88), cy: H * 0.5,
      bar: 52, side: 112, pad: 22, head: 112, gap: 18,
      contentGap: 18, workspaceGap: 16, previewH: 230,
      panel: 420, panelPad: 24,
      buttonH: 94, buttonPx: 44, titlePx: 48, subtitlePx: 34,
      rowH: 70, rowPx: 36, tickPx: 32, targetsGap: 18,
      statPx: 34, statLabelPx: 26, trackH: 26,
      zoomFactor: 0.79, goalY: 0.43,
      pillPx: 50, pillGap: 26,
      cornerTop: 24, cornerRight: 64, bottom: 28,
      ringPx: 190,
    },
    overlay: {
      w: 1000, h: Math.min(672, H - 72), cy: H * 0.5,
      bar: 48, side: 112, pad: 20, head: 100, gap: 16,
      contentGap: 16, workspaceGap: 14, previewH: 210,
      panel: 410, panelPad: 22,
      buttonH: 88, buttonPx: 42, titlePx: 46, subtitlePx: 32,
      rowH: 64, rowPx: 34, tickPx: 30, targetsGap: 18,
      statPx: 32, statLabelPx: 26, trackH: 24,
      zoomFactor: 0.74, goalY: 0.42,
      pillPx: 48, pillGap: 24,
      cornerTop: 20, cornerRight: 60, bottom: 28,
      ringPx: 180,
    },
  }[variant];

  // Preserve a complete opening on unusually short compact stages.
  shot.w = Math.min(shot.w, W - 64);
  shot.h = Math.max(240, shot.h);
  if (!isFull && H < 720) {
    shot.bar = 40;
    shot.pad = 14;
    shot.head = 80;
    shot.gap = 12;
    shot.buttonH = 76;
    shot.panelPad = 16;
    shot.rowH = 48;
    shot.targetsGap = 12;
    shot.pillPx = 40;
    shot.pillGap = 18;
    shot.cornerTop = 16;
    shot.bottom = 20;
  }

  Object.entries({
    "--bar-h": shot.bar,
    "--side-w": shot.side,
    "--main-pad": shot.pad,
    "--head-h": shot.head,
    "--main-gap": shot.gap,
    "--content-gap": shot.contentGap,
    "--workspace-gap": shot.workspaceGap,
    "--preview-h": shot.previewH,
    "--panel-w": shot.panel,
    "--panel-pad": shot.panelPad,
    "--button-h": shot.buttonH,
    "--button-px": shot.buttonPx,
    "--title-px": shot.titlePx,
    "--subtitle-px": shot.subtitlePx,
    "--row-h": shot.rowH,
    "--row-px": shot.rowPx,
    "--tick-px": shot.tickPx,
    "--targets-gap": shot.targetsGap,
    "--stat-px": shot.statPx,
    "--stat-label-px": shot.statLabelPx,
    "--track-h": shot.trackH,
  }).forEach(([name, value]) => stageEl.style.setProperty(name, value + "px"));

  const win = $("window");
  win.style.background = V.windowColor;
  [
    ["app-name", V.appName],
    ["file-size", V.stat2Value],
    ["project", V.projectName],
    ["subtitle", V.subtitle],
    ["s1l", V.stat1Label],
    ["s1v", V.stat1Value],
    ["s2l", V.stat2Label],
    ["s2v", V.stat2Value],
    ["timecode", V.timelineTimecode],
    ["btn-label", V.buttonLabel],
    ["btn-pending", V.pendingLabel],
    ["btn-done", V.doneLabel],
  ].forEach(([id, text]) => { $(id).textContent = text; });

  [V.side1, V.side2, V.side3].forEach((text, i) => {
    make("div", i === 0 ? "side-item on" : "side-item", $("sidebar"), text);
  });

  const ticks = [V.target1, V.target2, V.target3].map((text) => {
    const row = make("div", "target", $("targets"));
    const tick = make("span", "tick", row);
    const halo = make("span", "tick-halo", tick);
    const on = make("span", "tick-on", tick);
    on.innerHTML =
      `<svg viewBox="0 0 24 24" fill="none" stroke="#fff" ` +
      `stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round">` +
      `<path d="M5 13l4.6 4.6L19 7.4"/></svg>`;
    make("span", "target-label", row, text);
    return { on, halo };
  });

  const screen = $("screen");
  const builtIn = !V.screenImage && !V.screenHtml;
  let image = null;
  if (V.screenImage) {
    image = new Image();
    image.src = V.screenImage;
    await image.decode();
    screen.replaceChildren(image);
    shot.h = Math.min(
      shot.h,
      Math.round(shot.w * image.naturalHeight / image.naturalWidth) + shot.bar,
    );
  } else if (V.screenHtml) {
    screen.innerHTML = V.screenHtml;
  }

  const winX = (W - shot.w) / 2;
  const winY = shot.cy - shot.h / 2;
  Object.assign(win.style, {
    width: shot.w + "px",
    height: shot.h + "px",
    left: winX + "px",
    top: winY + "px",
  });
  const shadow = $("shadow");
  shadow.style.width = shot.w + "px";
  shadow.style.height = shot.h + "px";

  const stageBox = stageEl.getBoundingClientRect();
  const rect = (el) => {
    const b = el.getBoundingClientRect();
    return {
      x: (b.left - stageBox.left) * W / stageBox.width,
      y: (b.top - stageBox.top) * H / stageBox.height,
      w: b.width * W / stageBox.width,
      h: b.height * H / stageBox.height,
    };
  };

  const button = image ? null : screen.querySelector("[data-target]");
  let targetRect;
  let P;
  if (button) {
    targetRect = rect(button);
    P = {
      x: targetRect.x + targetRect.w * 0.56,
      y: targetRect.y + targetRect.h * 0.56,
    };
  } else if (image) {
    const b = rect(image);
    P = {
      x: b.x + b.w * V.targetX / 100,
      y: b.y + b.h * V.targetY / 100,
    };
    targetRect = { x: P.x - 60, y: P.y - 25, w: 120, h: 50 };
  } else {
    throw new Error("screenHtml needs an element with data-target on the button");
  }

  const stepEl = $("step");
  const numEl = $("step-num");
  const stepText = $("step-text");
  stepText.textContent = V.stepLabel;
  numEl.textContent = V.stepNumber;
  stepEl.style.fontSize = shot.pillPx + "px";
  const dot = Math.round(shot.pillPx * 1.3);
  Object.assign(numEl.style, {
    width: dot + "px",
    height: dot + "px",
    fontSize: Math.round(shot.pillPx * 0.8) + "px",
  });
  const maxStepText = W - 96 - dot - 16 - 44;
  stepText.style.maxWidth = maxStepText + "px";
  CA.fit(stepText, maxStepText, isFull ? 40 : 32);
  const stepBox = rect(stepEl);

  let Z = Math.max(1, V.zoom * shot.zoomFactor);
  let focusBottom = targetRect.y + targetRect.h;
  const maxBottom = H - shot.bottom;
  let panelRect = null;
  if (builtIn) {
    panelRect = rect($("publish-panel"));
    const destinations = rect($("targets"));
    focusBottom = destinations.y + destinations.h;
    const available =
      maxBottom - stepBox.h - shot.pillGap - shot.cornerTop;
    const heightLimit = available / Math.max(1, focusBottom - winY);
    const widthLimit =
      (W - shot.cornerRight - 72) / Math.max(1, panelRect.w);
    // Breathing room belongs to the entire destination panel.
    // Very short stages may need a close scale below 1 to retain every row.
    Z = Math.min(Z, heightLimit, widthLimit);
    Z = Math.max(0.4, Z);
  }

  const G = {
    x: W - shot.cornerRight - Z * (winX + shot.w - P.x),
    y: H * shot.goalY,
  };
  if (builtIn) {
    const minY = shot.cornerTop + Z * (P.y - winY);
    const maxY =
      maxBottom - stepBox.h - shot.pillGap - Z * (focusBottom - P.y);
    G.y = clamp(G.y, minY, Math.max(minY, maxY));
  } else {
    const leftExtent = Z * (P.x - targetRect.x);
    const rightExtent = Z * (targetRect.x + targetRect.w - P.x);
    G.x = clamp(
      G.x, 48 + leftExtent,
      Math.max(48 + leftExtent, W - 48 - rightExtent),
    );
    const topExtent = Z * (P.y - targetRect.y);
    const bottomExtent = Z * (focusBottom - P.y);
    const minY = (isFull ? Math.max(230, safe.top) : 32) + topExtent;
    const maxY = maxBottom - stepBox.h - shot.pillGap - bottomExtent;
    G.y = clamp(G.y, minY, Math.max(minY, maxY));
  }

  const finalFocusBottom = G.y + Z * (focusBottom - P.y);
  const subjectCenterX = panelRect
    ? G.x + Z * (panelRect.x + panelRect.w / 2 - P.x)
    : G.x + Z * (targetRect.x + targetRect.w / 2 - P.x);
  const stepCenterX = clamp(
    subjectCenterX, 48 + stepBox.w / 2,
    W - 48 - stepBox.w / 2,
  );
  // Keep the instruction close to the action, rather than stranding it
  // in a separate empty band at a fixed percentage of the frame.
  const stepTop = Math.min(
    maxBottom - stepBox.h,
    finalFocusBottom + shot.pillGap,
  );
  stepEl.style.left = stepCenterX - stepBox.w / 2 + "px";
  stepEl.style.top = stepTop + "px";

  let A = builtIn
    ? { x: winX + shot.w * 0.36, y: winY + shot.h * 0.5 }
    : { x: P.x - shot.w * 0.35, y: P.y + shot.h * 0.28 };
  A = {
    x: clamp(A.x, winX + 40, winX + shot.w - 40),
    y: clamp(A.y, winY + shot.bar + 30, winY + shot.h - 40),
  };
  const dx = P.x - A.x;
  const dy = P.y - A.y;
  const C = {
    x: (A.x + P.x) / 2 + dy * 0.24,
    y: (A.y + P.y) / 2 - dx * 0.24,
  };

  // At default timing: cursor lands at 0.75s, camera settles at 0.90s,
  // and the click arrives at 1.45s. No blur remains during the press.
  const B = {
    cursorGo: T.design * 0.06,
    cursorRun: T.design * 0.46,
    camGo: T.design * 0.2,
    camRun: T.design * 0.42,
  };
  const design = (t) =>
    t <= T.key ? t / T.scale : T.design + t - T.key;
  const glide = (p) =>
    p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2;
  const spring = (p) => {
    const w = 7.4;
    const f = (x) => 1 - (1 + w * x) * Math.exp(-w * x);
    // Critical damping without overshoot; zero velocity at both ends.
    return f(glide(p)) / f(1);
  };
  const view = (t) => {
    const d = design(t);
    const z = spring(clamp((d - B.camGo) / B.camRun));
    const s = Math.exp(Math.log(Z) * z);
    return {
      s,
      x: P.x + (G.x - P.x) * z - s * P.x,
      y: P.y + (G.y - P.y) * z - s * P.y,
      z,
    };
  };
  const pointer = (t) => {
    const d = design(t);
    const p = glide(clamp((d - B.cursorGo) / B.cursorRun));
    const a = (1 - p) ** 2;
    const b = 2 * p * (1 - p);
    const c = p ** 2;
    const v = view(t);
    const holdTime = Math.max(0, t - T.key - 0.4);
    const dip = Math.sin(clamp((t - T.key + 0.07) / 0.2) * Math.PI);
    return {
      x: v.s * (a * A.x + b * C.x + c * P.x) + v.x - 6
        + Math.sin(holdTime * 1.3) * 2,
      y: v.s * (a * A.y + b * C.y + c * P.y) + v.y - 4
        + Math.sin(holdTime * 1.8) * 3,
      scale: (1 + 0.24 * v.z) * (1 - 0.12 * dip),
    };
  };

  const tl = gsap.timeline({ paused: true });
  const build = gsap.timeline();
  if (button) {
    build.to(button, {
      filter: "brightness(0.88)",
      duration: T.design * 0.08,
      ease: "power1.out",
    }, T.design * 0.56);
  }
  build.timeScale(1 / T.scale);
  tl.add(build, 0);

  tl.fromTo("#cam",
    { x: 0, y: 0, scaleX: 1, scaleY: 1 },
    {
      x: 1, y: 1, scaleX: 2, scaleY: 2,
      duration: T.duration,
      ease: "none",
      modifiers: {
        x: () => view(tl.time()).x + "px",
        y: () => view(tl.time()).y + "px",
        scaleX: () => view(tl.time()).s,
        scaleY: () => view(tl.time()).s,
      },
    }, 0);

  tl.fromTo("#cursor",
    { x: 0, y: 0, scaleX: 1, scaleY: 1 },
    {
      x: 1, y: 1, scaleX: 2, scaleY: 2,
      duration: T.duration,
      ease: "none",
      modifiers: {
        x: () => pointer(tl.time()).x + "px",
        y: () => pointer(tl.time()).y + "px",
        scaleX: () => pointer(tl.time()).scale,
        scaleY: () => pointer(tl.time()).scale,
      },
    }, 0);

  tl.fromTo(shadow,
    { x: winX, y: winY, scaleX: 1, scaleY: 1 },
    {
      x: 1, y: 1, scaleX: 2, scaleY: 2,
      duration: T.duration,
      ease: "none",
      modifiers: {
        x: () => {
          const v = view(tl.time());
          return v.s * winX + v.x + "px";
        },
        y: () => {
          const v = view(tl.time());
          return v.s * winY + v.y + "px";
        },
        scaleX: () => view(tl.time()).s,
        scaleY: () => view(tl.time()).s,
      },
    }, 0);

  const K = T.key;
  const q = Math.min(1, Math.max(0.01, T.hold / 2.3));
  if (button) {
    tl.to(button, {
      scaleX: 0.95,
      scaleY: 0.95,
      duration: 0.07,
      ease: "power2.out",
    }, K - 0.07);
    tl.to(button, {
      scaleX: 1,
      scaleY: 1,
      filter: "brightness(1)",
      duration: 0.28 * q,
      ease: "back.out(1.6)",
    }, K);
  }

  const placeRing = (el, px) => {
    el.style.width = el.style.height = px + "px";
    gsap.set(el, { x: G.x - px / 2, y: G.y - px / 2 });
  };
  placeRing($("ring"), shot.ringPx);
  placeRing($("ripple"), shot.ringPx * 1.65);

  tl.set("#ring", { opacity: 0.85 }, K);
  tl.fromTo("#ring",
    { scaleX: 0.16, scaleY: 0.16 },
    {
      scaleX: 1, scaleY: 1,
      duration: 0.3 * q,
      ease: "power3.out",
      immediateRender: false,
    }, K);
  tl.to("#ring", {
    opacity: 0, duration: 0.2 * q, ease: "power1.in",
  }, K + 0.1 * q);
  tl.set("#ripple", { opacity: 0.35 }, K + 0.035 * q);
  tl.fromTo("#ripple",
    { scaleX: 0.24, scaleY: 0.24 },
    {
      scaleX: 1, scaleY: 1,
      duration: 0.4 * q,
      ease: "power2.out",
      immediateRender: false,
    }, K + 0.035 * q);
  tl.to("#ripple", {
    opacity: 0, duration: 0.25 * q, ease: "power1.in",
  }, K + 0.16 * q);

  if (builtIn) {
    tl.set("#btn-label", { visibility: "hidden" }, K + 0.06 * q);
    tl.set("#btn-pending", { visibility: "visible" }, K + 0.06 * q);

    ticks.forEach(({ on }, i) => {
      gsap.set(on, { scaleX: 0, scaleY: 0 });
      tl.to(on, {
        scaleX: 1,
        scaleY: 1,
        duration: 0.24 * q,
        ease: "back.out(2)",
      }, K + (0.24 + i * 0.28) * q);
    });

    // Published appears with the final destination check, never before it.
    const completeAt = K + 0.8 * q;
    tl.set("#btn-pending", { visibility: "hidden" }, completeAt);
    tl.set("#btn-done", { visibility: "visible" }, completeAt);

    // A small completion halo and the playhead keep the held shot alive.
    // Reading text, the panel and the camera remain stationary.
    const haloAt = completeAt + 0.24 * q;
    const haloRun = Math.max(0.01, K + T.hold - haloAt);
    ticks.forEach(({ halo }, i) => {
      tl.fromTo(halo,
        { scaleX: 0.9, scaleY: 0.9, opacity: 0.24 },
        {
          scaleX: 1.45,
          scaleY: 1.45,
          opacity: 0,
          duration: haloRun / 3,
          repeat: 2,
          ease: "sine.out",
          immediateRender: false,
        }, haloAt + i * 0.015 * q);
    });

    const timelineWidth = rect($("scrub").parentElement).w;
    gsap.set("#scrub", { x: timelineWidth * 0.18 });
    tl.fromTo("#scrub",
      { x: timelineWidth * 0.18 },
      {
        x: timelineWidth * 0.72,
        duration: Math.max(0.01, T.hold),
        ease: "none",
        immediateRender: false,
      }, K);
  }

  tl.set(stepEl, { visibility: "visible" }, K + 0.36 * q);
  tl.fromTo(stepEl,
    { scaleX: 0.72, scaleY: 0.72 },
    {
      scaleX: 1,
      scaleY: 1,
      duration: 0.3 * q,
      ease: "back.out(1.7)",
      immediateRender: false,
    }, K + 0.36 * q);
  tl.fromTo(numEl,
    { scaleX: 0, scaleY: 0 },
    {
      scaleX: 1,
      scaleY: 1,
      duration: 0.24 * q,
      ease: "back.out(2.2)",
      immediateRender: false,
    }, K + 0.43 * q);

  tl.fromTo("#backdrop",
    { scaleX: 1.04, scaleY: 1.04, x: -8, y: 6 },
    {
      scaleX: 1.07, scaleY: 1.07, x: 8, y: -6,
      duration: Math.max(0.01, T.hold),
      ease: "sine.inOut",
      immediateRender: false,
    }, K);

  const Rmax = Math.hypot(W, H);
  const gx = G.x / W * 100;
  const gy = G.y / H * 100;
  if (variant === "overlay") {
    tl.fromTo(stageEl,
      { clipPath: "circle(0px at 50% 50%)" },
      {
        clipPath: `circle(${Rmax}px at 50% 50%)`,
        duration: Math.min(0.24, T.key * 0.24),
        ease: "power3.out",
      }, 0);
  }
  if (T.exit > 0) {
    tl.fromTo(stageEl,
      { clipPath: `circle(${Rmax}px at ${gx}% ${gy}%)` },
      {
        clipPath: `circle(0px at ${gx}% ${gy}%)`,
        duration: Math.max(0, T.exit - 1 / CA.fps),
        ease: "power3.in",
        immediateRender: false,
      }, K + T.hold);
  }

  window.__timelines["block"] = tl;
});