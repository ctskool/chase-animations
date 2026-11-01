CA.ready(async () => {
  const { vars: V, stage: S, safe, time: T, variant, make, grainUrl } = CA;
  const $ = (id) => document.getElementById(id);
  const W = S.w;
  const H = S.h;
  const full = variant === "full";
  const stageEl = $("stage");
  const clamp = (n, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));
  const lerp = (a, b, p) => a + (b - a) * p;
  const smooth = (p) => p * p * p * (p * (p * 6 - 15) + 10);

  Object.entries({
    "--accent": V.accent,
    "--success": V.successColor,
    "--bright": V.buttonTextColor,
    "--step-bg": V.stepBackground,
    "--step-ink": V.stepInk,
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
    `radial-gradient(90% 65% at 16% 10%, ${V.backdropA}, transparent 72%), ` +
    `linear-gradient(155deg, ${V.backdropB}, ${V.backdropC})`;
  $("grain").style.backgroundImage = grainUrl(200, 0.9, 3);
  $("grain").style.opacity = V.grainOpacity;

  // These are separate compositions, not a scaled portrait layout.
  const layouts = {
    full: {
      bar: 76, nav: 84, pad: 40, head: 170, gap: 26,
      contentGap: 24, workspaceGap: 20,
      panel: 610, panelPad: 32, buttonH: 138, buttonPx: 64,
      rowH: 148, rowPx: 48, tickPx: 44, targetsGap: 26,
      appPx: 40, navPx: 40, titlePx: 64, subtitlePx: 42,
      statPx: 44, statLabelPx: 40, statPad: 12, statGap: 12,
      timecodePx: 40, timelineHead: 50, trackH: 30,
      pillPx: 60, pillPad: 16, pillGap: 46, focusPad: 20,
      edge: 48, ringPx: 270, clickRingPx: 138,
    },
    top: {
      bar: 60, nav: 64, pad: 24, head: 112, gap: 18,
      contentGap: 18, workspaceGap: 14,
      panel: 600, panelPad: 24, buttonH: 106, buttonPx: 52,
      rowH: 86, rowPx: 40, tickPx: 36, targetsGap: 18,
      appPx: 34, navPx: 34, titlePx: 48, subtitlePx: 34,
      statPx: 38, statLabelPx: 32, statPad: 8, statGap: 8,
      timecodePx: 32, timelineHead: 40, trackH: 20,
      pillPx: 50, pillPad: 14, pillGap: 32, focusPad: 14,
      edge: 36, ringPx: 220, clickRingPx: 112,
    },
    overlay: {
      bar: 52, nav: 56, pad: 20, head: 104, gap: 16,
      contentGap: 16, workspaceGap: 12,
      panel: 610, panelPad: 22, buttonH: 98, buttonPx: 50,
      rowH: 76, rowPx: 38, tickPx: 34, targetsGap: 16,
      appPx: 32, navPx: 32, titlePx: 46, subtitlePx: 32,
      statPx: 36, statLabelPx: 32, statPad: 6, statGap: 8,
      timecodePx: 32, timelineHead: 38, trackH: 18,
      pillPx: 48, pillPad: 12, pillGap: 28, focusPad: 12,
      edge: 36, ringPx: 200, clickRingPx: 104,
    },
  };
  const shot = { ...(layouts[variant] || layouts.full) };
  const winW = W - 32;

  const topSafe = full
    ? Math.max(230, safe.top)
    : Math.max(20, Math.min(36, safe.top));
  const bottomSafe = full
    ? Math.max(300, safe.bottom)
    : Math.max(20, Math.min(36, safe.bottom));
  const availableH = H - topSafe - bottomSafe;

  if (!full && H < 760) {
    Object.assign(shot, {
      bar: 44, nav: 50, pad: 16, head: 86, gap: 12,
      contentGap: 14, workspaceGap: 10,
      panel: 610, panelPad: 18, buttonH: 84, buttonPx: 46,
      rowH: 66, rowPx: 34, tickPx: 32, targetsGap: 14,
      appPx: 32, navPx: 32, titlePx: 44, subtitlePx: 32,
      statPx: 34, statLabelPx: 32, statPad: 4, statGap: 6,
      timecodePx: 32, timelineHead: 36, trackH: 14,
      pillPx: 44, pillPad: 12, pillGap: 24, focusPad: 12,
      edge: 32, ringPx: 180, clickRingPx: 96,
    });
  }

  const panelHeight = () =>
    shot.panelPad * 2 + shot.buttonH +
    shot.targetsGap + shot.rowH * 3 + 4;
  const windowHeight = () =>
    shot.bar + shot.nav + shot.pad * 2 +
    shot.head + shot.gap + panelHeight();

  let hideWorkspace = false;
  if (!full && windowHeight() > availableH) {
    shot.head = 0;
    shot.gap = 0;
  }
  if (!full && windowHeight() > availableH) {
    shot.nav = 0;
    hideWorkspace = true;
    shot.panel = winW - shot.pad * 2;
    shot.rowH = Math.max(48, Math.min(
      shot.rowH,
      Math.floor((
        availableH - shot.bar - shot.pad * 2 -
        shot.panelPad * 2 - shot.buttonH - shot.targetsGap - 4
      ) / 3),
    ));
  }

  const panelH = panelHeight();

  Object.entries({
    "--bar-h": shot.bar,
    "--nav-h": shot.nav,
    "--main-pad": shot.pad,
    "--head-h": shot.head,
    "--main-gap": shot.gap,
    "--content-gap": shot.contentGap,
    "--workspace-gap": shot.workspaceGap,
    "--panel-w": shot.panel,
    "--panel-h": panelH,
    "--panel-pad": shot.panelPad,
    "--button-h": shot.buttonH,
    "--button-px": shot.buttonPx,
    "--row-h": shot.rowH,
    "--row-px": shot.rowPx,
    "--tick-px": shot.tickPx,
    "--targets-gap": shot.targetsGap,
    "--app-px": shot.appPx,
    "--nav-px": shot.navPx,
    "--title-px": shot.titlePx,
    "--subtitle-px": shot.subtitlePx,
    "--stat-px": shot.statPx,
    "--stat-label-px": shot.statLabelPx,
    "--stat-pad": shot.statPad,
    "--stat-gap": shot.statGap,
    "--timecode-px": shot.timecodePx,
    "--timeline-head": shot.timelineHead,
    "--track-h": shot.trackH,
  }).forEach(([name, value]) =>
    stageEl.style.setProperty(name, value + "px"),
  );

  [
    ["app-name", V.appName],
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

  const navLabels = [V.side1, V.side2, V.side3].map((text, i) => {
    const item = make("div", i === 0 ? "side-item on" : "side-item", $("sidebar"));
    return make("span", "side-label", item, text);
  });

  const ticks = [V.target1, V.target2, V.target3].map((text) => {
    const row = make("div", "target", $("targets"));
    const tick = make("span", "tick", row);
    const halo = make("span", "tick-halo", tick);
    const on = make("span", "tick-on", tick);
    on.innerHTML =
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ` +
      `stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" ` +
      `aria-hidden="true"><path d="M5 13l4.6 4.6L19 7.4"/></svg>`;
    const label = make("span", "target-label", row, text);
    return { row, tick, on, halo, label };
  });

  if (!shot.head) {
    $("head").style.display = "none";
    $("head").style.visibility = "hidden";
  }
  if (!shot.nav) {
    $("sidebar").style.display = "none";
    $("sidebar").style.visibility = "hidden";
  }
  if (hideWorkspace) {
    $("workspace").style.display = "none";
    $("workspace").style.visibility = "hidden";
  }

  const screen = $("screen");
  const builtIn = !V.screenImage && !V.screenHtml;
  const win = $("window");
  let image = null;
  let winH = windowHeight();

  if (V.screenImage) {
    image = new Image();
    image.alt = "";
    image.src = V.screenImage;
    await image.decode();
    screen.replaceChildren(image);
    winH = Math.min(
      availableH,
      shot.bar + winW * image.naturalHeight / image.naturalWidth,
    );
  } else if (V.screenHtml) {
    screen.innerHTML = V.screenHtml;
  }

  const winX = (W - winW) / 2;
  const winY = topSafe + Math.max(0, availableH - winH) * 0.46;
  Object.assign(win.style, {
    left: winX + "px",
    top: winY + "px",
    width: winW + "px",
    height: winH + "px",
  });

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

  const fitText = (el, width, minPx) => {
    if (!el || !el.textContent || width <= 0) return;
    el.style.display = "inline-block";
    CA.fit(el, width, minPx);
  };
  const minText = full ? 40 : 32;
  fitText($("app-name"), winW - 156, minText);

  if (builtIn) {
    const mainWidth = winW - shot.pad * 2;
    fitText($("project"), mainWidth, minText);
    fitText($("subtitle"), mainWidth, minText);

    if (shot.nav) {
      navLabels.forEach((el) =>
        fitText(el, rect(el.parentElement).w - 24, minText),
      );
    }
    if (!hideWorkspace) {
      ["s1l", "s1v", "s2l", "s2v"].forEach((id) => {
        const el = $(id);
        fitText(el, rect(el.parentElement).w - 28, minText);
      });
      fitText($("timecode"), rect($("workspace")).w, minText);
    }

    const buttonWidth = rect($("target")).w - 28;
    ["btn-label", "btn-pending", "btn-done"].forEach((id) =>
      fitText($(id), buttonWidth, minText),
    );
    ticks.forEach(({ row, label }) =>
      fitText(label, rect(row).w - shot.tickPx - 18, minText),
    );

    const outline = $("panel-outline");
    outline.setAttribute("viewBox", `0 0 ${shot.panel} ${panelH}`);
    const energy = $("energy-line");
    energy.setAttribute("x", "1.5");
    energy.setAttribute("y", "1.5");
    energy.setAttribute("width", String(shot.panel - 3));
    energy.setAttribute("height", String(panelH - 3));
    energy.setAttribute("rx", "20");
  }

  const button = image ? null : screen.querySelector("[data-target]");
  if (!image && !button) {
    throw new Error("screenHtml needs data-target on its button");
  }

  let targetRect;
  let P;
  if (button) {
    targetRect = rect(button);
    // Click the clear end of the control, leaving its label readable.
    P = {
      x: targetRect.x + targetRect.w * 0.87,
      y: targetRect.y + targetRect.h * 0.58,
    };
  } else {
    const b = rect(image);
    P = {
      x: b.x + b.w * V.targetX / 100,
      y: b.y + b.h * V.targetY / 100,
    };
    targetRect = { x: P.x - 60, y: P.y - 25, w: 120, h: 50 };
  }

  let focusEl;
  if (builtIn) {
    focusEl = $("publish-panel");
  } else if (image) {
    focusEl = image;
  } else {
    focusEl = button.closest("[data-focus]") || button.parentElement || button;
    if (!screen.contains(focusEl)) focusEl = button;
  }

  const focus = rect(focusEl);
  const focusLeft = Math.max(winX, focus.x - shot.focusPad);
  const focusTop = Math.max(winY, focus.y - shot.focusPad);
  const focusRight = Math.min(winX + winW, focus.x + focus.w + shot.focusPad);
  const focusBottom = Math.min(winY + winH, focus.y + focus.h + shot.focusPad);
  const F = {
    x: focusLeft,
    y: focusTop,
    w: Math.max(1, focusRight - focusLeft),
    h: Math.max(1, focusBottom - focusTop),
  };

  const contexts = Array.from(win.querySelectorAll("[data-context]"))
    .filter((el) => el.getClientRects().length > 0);

  // Custom HTML can mark a complete panel with data-focus.
  // Retire siblings of that panel before any camera crop can reach them.
  if (!builtIn && !image) {
    let node = focusEl;
    while (node && node !== screen) {
      const parent = node.parentElement;
      if (!parent) break;
      Array.from(parent.children).forEach((sibling) => {
        if (sibling !== node && !contexts.includes(sibling)) contexts.push(sibling);
      });
      node = parent;
    }
  }

  const stepEl = $("step");
  const numEl = $("step-num");
  const stepText = $("step-text");
  stepText.textContent = V.stepLabel;
  numEl.textContent = V.stepNumber;
  stepEl.style.fontSize = shot.pillPx + "px";
  stepEl.style.padding =
    `${shot.pillPad}px ${shot.pillPad + 14}px ${shot.pillPad}px ${shot.pillPad}px`;

  const dot = Math.round(shot.pillPx * 1.33);
  Object.assign(numEl.style, {
    width: dot + "px",
    height: dot + "px",
    fontSize: Math.round(shot.pillPx * 0.8) + "px",
  });

  const stepMax = W - shot.edge * 2;
  const textMax = stepMax - dot - 16 - shot.pillPad * 2 - 14;
  fitText(stepText, textMax, minText);
  if (stepText.scrollWidth > textMax + 1) {
    stepText.style.maxWidth = textMax + "px";
    stepText.style.whiteSpace = "normal";
    stepEl.style.whiteSpace = "normal";
  }
  const stepBox = rect(stepEl);

  const widthLimit = (W - shot.edge * 2) / F.w;
  const heightLimit = Math.max(
    1,
    availableH - stepBox.h - shot.pillGap,
  ) / F.h;
  let Z = Math.max(0.1, Math.min(V.zoom, widthLimit, heightLimit));
  // A supplied bitmap is kept whole rather than enlarged and cropped.
  if (image) Z = Math.min(1, Z);

  const groupH = F.h * Z + shot.pillGap + stepBox.h;
  const finalLeft = (W - F.w * Z) / 2;
  const finalTop = topSafe + Math.max(0, availableH - groupH) * 0.45;
  const G = {
    x: finalLeft + (P.x - F.x) * Z,
    y: finalTop + (P.y - F.y) * Z,
  };

  // Separation is measured from the entire framed panel, not its last row.
  stepEl.style.left = (W - stepBox.w) / 2 + "px";
  stepEl.style.top = finalTop + F.h * Z + shot.pillGap + "px";

  const A = builtIn && !hideWorkspace
    ? {
        x: rect($("workspace")).x + rect($("workspace")).w * 0.38,
        y: rect($("workspace")).y + panelH * 0.25,
      }
    : {
        x: clamp(P.x - winW * 0.38, winX + 36, winX + winW - 36),
        y: clamp(P.y + winH * 0.18, winY + shot.bar + 24, winY + winH - 32),
      };
  const dx = P.x - A.x;
  const dy = P.y - A.y;
  const C = {
    x: (A.x + P.x) / 2 + dy * 0.23,
    y: (A.y + P.y) / 2 - dx * 0.23,
  };

  const D = T.design;
  const K = T.key;
  const q = Math.min(1, Math.max(0.02, T.hold / 1.6));
  const clickD = builtIn ? D * 0.84 : D;
  const pressD = builtIn ? D * 0.79 : D * 0.95;
  const B = {
    cursorGo: D * 0.04,
    cursorRun: D * 0.5,
    camGo: D * 0.26,
    camRun: D * 0.44,
  };

  const designTime = (t) => t <= K ? t / T.scale : D + t - K;
  const spring = (p) => {
    const f = (x) => 1 - (1 + 8 * x) * Math.exp(-8 * x);
    return f(smooth(p)) / f(1);
  };
  const view = (t) => {
    const d = designTime(t);
    const z = spring(clamp((d - B.camGo) / B.camRun));
    const s = Math.exp(Math.log(Z) * z);
    return {
      z,
      s,
      x: P.x + (G.x - P.x) * z - P.x * s,
      y: P.y + (G.y - P.y) * z - P.y * s,
    };
  };

  const pointer = (t) => {
    const d = designTime(t);
    const p = smooth(clamp((d - B.cursorGo) / B.cursorRun));
    const a = (1 - p) ** 2;
    const b = 2 * p * (1 - p);
    const c = p ** 2;
    const v = view(t);

    let press = smooth(clamp((d - pressD) / (clickD - pressD)));
    if (d > clickD) {
      press = 1 - smooth(clamp((d - clickD) / (D * 0.1)));
    }
    const rest = smooth(clamp((t - K - 0.38 * q) / (0.28 * q)));
    return {
      x: v.s * (a * A.x + b * C.x + c * P.x) + v.x - 46 * 4 / 28
        + rest * 16 + Math.sin(rest * Math.PI) * 14,
      y: v.s * (a * A.y + b * C.y + c * P.y) + v.y - 56 * 2.5 / 34
        + rest * (full ? 70 : 50),
      scale: (1 + 0.14 * v.z) * (1 - press * 0.13),
    };
  };

  const shadowFrame = (t) => {
    const v = view(t);
    return {
      x: v.x + v.s * lerp(winX, F.x, v.z),
      y: v.y + v.s * lerp(winY, F.y, v.z),
      w: lerp(winW, F.w, v.z),
      h: lerp(winH, F.h, v.z),
      s: v.s,
    };
  };

  const tl = gsap.timeline({ paused: true });
  const build = gsap.timeline();
  const shadow = $("shadow");
  const initialPointer = pointer(0);

  gsap.set(shadow, { x: winX, y: winY, width: winW, height: winH });
  gsap.set("#cursor", {
    x: initialPointer.x,
    y: initialPointer.y,
    scaleX: initialPointer.scale,
    scaleY: initialPointer.scale,
  });

  // Whole context elements disappear before the first changing crop.
  // No partial title, neighboring label or navigation sliver survives.
  if (contexts.length) {
    build.fromTo(contexts,
      { autoAlpha: 1 },
      {
        autoAlpha: 0,
        duration: D * 0.06,
        ease: "power2.in",
        immediateRender: false,
      }, D * 0.16);
  }

  const insetTop = F.y - winY;
  const insetRight = winX + winW - F.x - F.w;
  const insetBottom = winY + winH - F.y - F.h;
  const insetLeft = F.x - winX;

  build.fromTo(win,
    { clipPath: "inset(0px 0px 0px 0px round 24px)" },
    {
      clipPath:
        `inset(${insetTop}px ${insetRight}px ${insetBottom}px ${insetLeft}px round 24px)`,
      duration: B.camRun,
      ease: spring,
      immediateRender: false,
    }, B.camGo);

  if (button) {
    build.to(button, {
      filter: "brightness(0.87)",
      duration: D * 0.08,
      ease: "power2.out",
    }, D * 0.54);

    build.to(button, {
      scaleX: 0.95,
      scaleY: 0.95,
      duration: clickD - pressD,
      ease: "power2.in",
    }, pressD);

    if (builtIn) {
      build.to(button, {
        scaleX: 1.01,
        scaleY: 1.01,
        duration: D * 0.1,
        ease: "power3.out",
      }, clickD);
      build.to(button, {
        scaleX: 1.065,
        scaleY: 1.065,
        duration: D * 0.06,
        ease: "power3.out",
      }, D * 0.94);
    }
  }

  const placeRing = (id, size) => {
    const el = $(id);
    el.style.width = size + "px";
    el.style.height = size + "px";
    gsap.set(el, { x: G.x - size / 2, y: G.y - size / 2 });
  };
  placeRing("click-ring", shot.clickRingPx);
  placeRing("ring", shot.ringPx);
  placeRing("ripple", shot.ringPx * 1.6);

  if (builtIn) {
    gsap.set(["#btn-pending", "#btn-done"], { autoAlpha: 0 });
    gsap.set(ticks.map(({ on }) => on), { autoAlpha: 0 });
    gsap.set("#step-num", { autoAlpha: 0 });

    build.set("#btn-label", { autoAlpha: 0 }, clickD);
    build.set("#btn-pending", { autoAlpha: 1 }, clickD);

    build.fromTo("#click-ring",
      { opacity: 0.8, scaleX: 0.12, scaleY: 0.12 },
      {
        opacity: 0,
        scaleX: 1,
        scaleY: 1,
        duration: D * 0.16,
        ease: "power3.out",
        immediateRender: false,
      }, clickD);

    ticks.slice(0, 2).forEach(({ on, halo }, i) => {
      const at = D * (0.88 + i * 0.06);
      const run = D - at;
      build.set(on, { autoAlpha: 1, scaleX: 1.18, scaleY: 1.18 }, at);
      build.to(on, {
        scaleX: 1,
        scaleY: 1,
        duration: run,
        ease: "power3.out",
      }, at);
      build.fromTo(halo,
        { opacity: 0.55, scaleX: 0.85, scaleY: 0.85 },
        {
          opacity: 0,
          scaleX: 1.7,
          scaleY: 1.7,
          duration: run,
          ease: "power2.out",
          immediateRender: false,
        }, at);
    });
  }

  build.timeScale(1 / T.scale);
  tl.add(build, 0);

  // Modifier-driven transforms survive event-suppressed blur sampling.
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
    {
      x: initialPointer.x, y: initialPointer.y,
      scaleX: initialPointer.scale, scaleY: initialPointer.scale,
    },
    {
      x: initialPointer.x + 1, y: initialPointer.y + 1,
      scaleX: 2, scaleY: 2,
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
    { x: winX, y: winY, width: winW, height: winH, scaleX: 1, scaleY: 1 },
    {
      x: winX + 1, y: winY + 1,
      width: winW + 1, height: winH + 1,
      scaleX: 2, scaleY: 2,
      duration: T.duration,
      ease: "none",
      modifiers: {
        x: () => shadowFrame(tl.time()).x + "px",
        y: () => shadowFrame(tl.time()).y + "px",
        width: () => shadowFrame(tl.time()).w + "px",
        height: () => shadowFrame(tl.time()).h + "px",
        scaleX: () => shadowFrame(tl.time()).s,
        scaleY: () => shadowFrame(tl.time()).s,
      },
    }, 0);

  if (button) {
    tl.to(button, {
      scaleX: 1,
      scaleY: 1,
      filter: "brightness(1)",
      duration: 0.28 * q,
      ease: "back.out(1.35)",
    }, K);
  }

  if (builtIn) {
    // The exact key frame contains Published, success green and all checks.
    tl.set("#btn-pending", { autoAlpha: 0 }, K);
    tl.set("#btn-done", { autoAlpha: 1 }, K);
    tl.set(button, { backgroundColor: V.successColor }, K);
    tl.set("#publish-panel", { borderColor: V.successColor }, K);
    tl.set(ticks.map(({ on }) => on), { backgroundColor: V.successColor }, K);
    tl.set(ticks.map(({ tick }) => tick), { borderColor: V.successColor }, K);

    const last = ticks[2];
    tl.set(last.on, { autoAlpha: 1, scaleX: 1.18, scaleY: 1.18 }, K);
    tl.to(last.on, {
      scaleX: 1,
      scaleY: 1,
      duration: 0.2 * q,
      ease: "power3.out",
    }, K);
    tl.fromTo(last.halo,
      { opacity: 0.65, scaleX: 0.85, scaleY: 0.85 },
      {
        opacity: 0,
        scaleX: 1.8,
        scaleY: 1.8,
        duration: 0.3 * q,
        ease: "power2.out",
        immediateRender: false,
      }, K);

    tl.set("#panel-wash", { opacity: 0.16 }, K);
    tl.to("#panel-wash", {
      opacity: 0.045,
      duration: 0.3 * q,
      ease: "power2.out",
    }, K);

    tl.set("#panel-outline", { autoAlpha: 0.65 }, K);
    tl.fromTo("#energy-line",
      { strokeDashoffset: 0 },
      {
        strokeDashoffset: -360,
        duration: Math.max(0.01, T.hold),
        ease: "sine.inOut",
        immediateRender: false,
      }, K);
    tl.to("#panel-outline", {
      opacity: 0.3,
      duration: 0.35 * q,
      ease: "power2.out",
    }, K);
  }

  tl.fromTo("#ring",
    { opacity: 0.95, scaleX: 0.1, scaleY: 0.1 },
    {
      opacity: 0,
      scaleX: 1,
      scaleY: 1,
      duration: 0.32 * q,
      ease: "power3.out",
      immediateRender: false,
    }, K);
  tl.fromTo("#ripple",
    { opacity: 0.4, scaleX: 0.2, scaleY: 0.2 },
    {
      opacity: 0,
      scaleX: 1,
      scaleY: 1,
      duration: 0.42 * q,
      ease: "power2.out",
      immediateRender: false,
    }, K + 0.025 * q);

  tl.set(stepEl, { autoAlpha: 1 }, K + 0.12 * q);
  tl.fromTo(stepEl,
    { scaleX: 0.78, scaleY: 0.78 },
    {
      scaleX: 1,
      scaleY: 1,
      duration: 0.28 * q,
      ease: "back.out(1.45)",
      immediateRender: false,
    }, K + 0.12 * q);
  tl.set(numEl, { autoAlpha: 1 }, K + 0.18 * q);
  tl.fromTo(numEl,
    { scaleX: 0.55, scaleY: 0.55 },
    {
      scaleX: 1,
      scaleY: 1,
      duration: 0.24 * q,
      ease: "back.out(1.8)",
      immediateRender: false,
    }, K + 0.18 * q);

  tl.fromTo("#backdrop",
    { scaleX: 1.035, scaleY: 1.035, x: -7, y: 5 },
    {
      scaleX: 1.065,
      scaleY: 1.065,
      x: 7,
      y: -5,
      duration: Math.max(0.01, T.hold),
      ease: "sine.inOut",
      immediateRender: false,
    }, K);

  const radius = Math.hypot(W, H);
  const gx = G.x / W * 100;
  const gy = G.y / H * 100;

  if (variant === "overlay") {
    tl.fromTo(stageEl,
      { clipPath: "circle(0px at 50% 50%)" },
      {
        clipPath: `circle(${radius}px at 50% 50%)`,
        duration: Math.min(0.22, K * 0.2),
        ease: "power3.out",
      }, 0);
  }

  if (T.exit > 0) {
    tl.fromTo(stageEl,
      { clipPath: `circle(${radius}px at ${gx}% ${gy}%)` },
      {
        clipPath: `circle(0px at ${gx}% ${gy}%)`,
        duration: Math.max(0, T.exit - 1 / CA.fps),
        ease: "power3.in",
        immediateRender: false,
      }, K + T.hold);
  }

  window.__timelines["block"] = tl;
});