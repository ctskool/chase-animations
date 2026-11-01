CA.ready(() => {
  const { vars: V, stage: S, safe, time: T, variant, fit, rgba, grainUrl } = CA;
  const $ = (id) => document.getElementById(id);
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const number = (value, fallback) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  };

  const W = S.w;
  const H = S.h;
  const full = variant === "full";
  const overlay = variant === "overlay";
  const stage = $("stage");
  const D = T.design;
  const K = T.key;
  const frameD = D / 55;
  const fps = Math.max(1, number(CA.fps, 30));
  const frame = 1 / fps;
  const minText = full ? 40 : 32;

  const seed = Math.round(number(V.seed, 8)) >>> 0;
  const bloom = clamp(number(V.bloomStrength, 1), 0.3, 1.5);
  const fringe = clamp(number(V.fringeAmount, 0.6), 0, 1.2);
  const snow = clamp(number(V.snowOpacity, 0.045), 0, 0.1);
  const flicker = clamp(number(V.flickerAmount, 0.01), 0, 0.015);
  const punch = clamp(number(V.lockPunch, 1.16), 1.03, 1.18);
  const punchX = 1 + (punch - 1) * 0.48;
  const compression = clamp(number(V.lockCompression, 0.78), 0.65, 0.96);
  const preX = 1 - (1 - compression) * 0.14;

  Object.entries({
    "--crt-ground": V.ground,
    "--crt-core": V.core,
    "--crt-accent": V.accent,
    "--crt-tracking": clamp(number(V.tracking, 4), 0, 10) / 100 + "em",
    "--crt-fringe": fringe,
    "--crt-warm-fringe": rgba(V.bloom, 0.16),
    "--crt-cool-fringe": rgba(V.fringeBlue, 0.13),
    "--crt-core-glow": rgba(V.core, 0.85),
    "--crt-bloom-tight": rgba(V.bloom, Math.min(0.9, 0.58 * bloom)),
    "--crt-bloom-mid": rgba(V.bloom, 0.25 * bloom),
    "--crt-bloom-wide": rgba(V.bloom, 0.105 * bloom),
    "--crt-system-ink": rgba(
      V.core, clamp(number(V.systemBrightness, 0.94), 0.65, 1)
    ),
    "--crt-accent-tight": rgba(V.accent, 0.55),
    "--crt-accent-wide": rgba(V.accent, 0.2),
  }).forEach(([key, value]) => stage.style.setProperty(key, value));

  $("crt-glass").style.background =
    `radial-gradient(ellipse 70% 68% at 50% 48%, ` +
    `${V.glass} 0%, ${V.ground} 94%)`;

  const layout = full
    ? {
        title: 280,
        gap: 40,
        clearance: 30,
        lineFactor: 1,
        systemFactor: 1,
        side: 52,
        stretch: clamp(number(V.fullTitleHeight, 3.35), 1, 3.5),
      }
    : overlay
      ? {
          title: 260,
          gap: 24,
          clearance: 20,
          lineFactor: 0.75,
          systemFactor: 0.8,
          side: 36,
          stretch: clamp(number(V.overlayTitleHeight, 1.75), 1, 2),
        }
      : {
          title: 270,
          gap: 32,
          clearance: 24,
          lineFactor: 0.85,
          systemFactor: 0.85,
          side: 40,
          stretch: clamp(number(V.topTitleHeight, 1.95), 1, 2.4),
        };

  const top = full
    ? Math.max(230, number(safe.top, 0))
    : Math.max(20, Math.min(32, number(safe.top, 0)));
  const bottom = full
    ? H - Math.max(300, number(safe.bottom, 0))
    : H - Math.max(20, Math.min(32, number(safe.bottom, 0)));
  const availableH = Math.max(1, bottom - top);
  const side = Math.max(layout.side, number(safe.side, 0));

  const curvature = clamp(number(V.curvature, 0.018), 0, 0.035);
  const warpRoom = W * curvature * 0.5 + 6;
  const requestedWidth = W * clamp(number(V.titleWidth, 90), 65, 94) / 100;
  const titleW = Math.max(
    1,
    Math.min(requestedWidth, (W - side * 2 - warpRoom * 2) / punchX)
  );
  const titleX = (W - titleW) / 2;

  const content = $("crt-content");
  const title = $("crt-title");
  const shape = $("crt-title-shape");
  const lines = [$("crt-title-1"), $("crt-title-2")];
  const activeLines = [];
  const activeRows = [];
  const texts = [
    String(V.titleLine1 || "").trim(),
    String(V.titleLine2 || "").trim(),
  ];
  const rowGap =
    clamp(number(V.lineGap, 8), 0, 40) * layout.lineFactor;

  title.style.left = titleX + "px";
  title.style.width = titleW + "px";
  shape.style.gap = rowGap + "px";

  lines.forEach((line, i) => {
    line.textContent = texts[i];
    line.style.fontSize = layout.title + "px";

    if (!texts[i]) {
      line.parentElement.style.display = "none";
      line.parentElement.style.visibility = "hidden";
    } else {
      activeLines.push(line);
      activeRows.push(line.parentElement);
    }
  });

  // Measure intrinsic line widths, rather than a max-width-capped box.
  let titlePx = activeLines.length
    ? Math.min(...activeLines.map((line) => fit(line, titleW, minText)))
    : minText;

  activeLines.forEach((line) => {
    line.style.fontSize = titlePx + "px";
    if (line.scrollWidth > titleW + 1) {
      line.style.maxWidth = titleW + "px";
      line.style.whiteSpace = "normal";
      line.style.textWrap = "balance";
    }
  });

  const system = $("crt-system");
  const run = $("crt-system-run");
  const typed = $("crt-typed");
  const cursor = $("crt-cursor");
  const dot = $("crt-dot");
  const sourceMessage = String(V.systemText || "").replace(/\s+/g, " ").trim();
  const hasSystem = Boolean(sourceMessage);

  // All outputs get a readable terminal block. The complete status line
  // is withheld until the lock, rather than appearing a word at a time.
  const message = sourceMessage.replace(/\s+\/\/\s+/, " //\n");
  const lastBreak = message.lastIndexOf("\n");
  const messageWords = Array.from(message.matchAll(/\S+/g));
  const preMessage = lastBreak >= 0
    ? message.slice(0, lastBreak)
    : messageWords.length > 1
      ? message.slice(0, messageWords[messageWords.length - 1].index).trimEnd()
      : "";

  const dotSize =
    clamp(number(V.accentSize, 28), 8, 40) * (full ? 1 : 0.9);
  const dotGap = full ? 20 : 16;
  const runRoom = Math.max(1, titleW - dotSize - dotGap);

  system.style.left = titleX + "px";
  system.style.width = titleW + "px";
  system.style.gap = dotGap + "px";
  dot.style.width = dot.style.height = dotSize + "px";

  run.style.fontSize = Math.max(
    minText,
    number(V.systemSize, 80) * layout.systemFactor
  ) + "px";

  typed.textContent = message;
  fit(run, runRoom, minText);

  if (run.scrollWidth > runRoom + 1) {
    run.style.width = runRoom + "px";
    run.style.maxWidth = runRoom + "px";
    run.style.whiteSpace = "pre-wrap";
    run.style.textWrap = "balance";
  }

  const systemPx = number(parseFloat(run.style.fontSize), minText);
  const measuredRunW = Math.min(runRoom, Math.ceil(run.getBoundingClientRect().width));
  const systemH = hasSystem ? Math.ceil(run.offsetHeight) : 0;
  const systemLineH = systemPx * 1.2;
  // fit() can collapse the "//" break, so count the rows actually laid out.
  const terminalRows = Math.max(1, Math.round(systemH / systemLineH));

  // Reserve the final width as well as the height: centered prefixes
  // must not walk sideways while their text changes.
  run.style.width = measuredRunW + "px";
  run.style.height = systemH + "px";
  dot.style.marginTop =
    Math.max(
      0,
      (terminalRows - 1) * systemLineH + (systemLineH - dotSize) / 2
    ) + "px";

  if (!hasSystem) {
    system.style.display = "none";
    system.style.visibility = "hidden";
  }
  typed.textContent = "";

  let stretch = layout.stretch;
  const rawTitleH = () => activeLines.length ? shape.offsetHeight : 0;
  const renderedTitleH = () => Math.ceil(rawTitleH() * stretch);
  const peakPad = () => renderedTitleH() * (punch - 1) / 2;
  const systemGap = () => {
    if (!activeLines.length) return 0;
    return hasSystem
      ? Math.max(layout.gap, peakPad() + layout.clearance)
      : peakPad();
  };
  const bodyHeight = () => renderedTitleH() + systemGap() + systemH;
  const envelopeHeight = () => bodyHeight() + peakPad();

  // Both the key pose and its terminal clearance must fit the safe area.
  if (envelopeHeight() > availableH && rawTitleH() > 0) {
    const roomForTitle = Math.max(
      0,
      availableH - systemH - (hasSystem ? layout.clearance : 0)
    );
    stretch = Math.max(
      1,
      Math.min(stretch, roomForTitle / (rawTitleH() * punch))
    );
  }

  while (envelopeHeight() > availableH && titlePx > minText) {
    titlePx = Math.max(minText, titlePx - 1);
    activeLines.forEach((line) => {
      line.style.fontSize = titlePx + "px";
    });
  }

  shape.style.transform = `scaleY(${stretch})`;
  title.style.height = renderedTitleH() + "px";

  const groupH = bodyHeight();
  const envelopeH = envelopeHeight();
  const groupY =
    top + peakPad() + Math.max(0, (availableH - envelopeH) / 2);

  content.style.top = groupY + "px";
  content.style.height = groupH + "px";
  system.style.top = renderedTitleH() + systemGap() + "px";
  system.style.height = systemH + "px";

  const glowY = (groupY + renderedTitleH() / 2) / H * 100;
  $("crt-haze").style.background =
    `radial-gradient(ellipse 64% 48% at 50% ${glowY}%, ` +
    `${rgba(V.bloom, 0.065 * bloom)} 0%, transparent 82%)`;
  $("crt-lock-pulse").style.background =
    `radial-gradient(ellipse 78% 62% at 50% ${glowY}%, ` +
    `${rgba(V.bloom, Math.min(0.8, 0.56 * bloom))} 0%, ` +
    `${rgba(V.bloom, 0.16 * bloom)} 52%, transparent 88%)`;

  const humOpacity = clamp(number(V.humOpacity, 0.085), 0.01, 0.12);
  $("crt-hum").style.height = H * 0.28 + "px";
  $("crt-hum").style.background =
    `linear-gradient(180deg, transparent 0%, ` +
    `${rgba(V.bloom, humOpacity * 0.25)} 38%, ` +
    `${rgba(V.bloom, humOpacity)} 49%, ` +
    `${rgba(V.core, humOpacity * 0.85)} 50%, ` +
    `transparent 54%, transparent 100%)`;

  $("crt-sheen").style.background =
    `linear-gradient(114deg, transparent 36%, ` +
    `${rgba(V.core, clamp(number(V.sheenOpacity, 0.07), 0, 0.1))} ` +
    `49%, transparent 62%)`;

  $("crt-snow").style.backgroundImage = grainUrl(192, 1, seed);
  $("crt-snow").style.opacity = snow;
  $("crt-dither").style.backgroundImage = grainUrl(173, 1, seed + 91);

  const mapSize = 129;
  const map = document.createElement("canvas");
  map.width = map.height = mapSize;
  const mapContext = map.getContext("2d");
  const pixels = mapContext.createImageData(mapSize, mapSize);
  const displacementScale = Math.max(W, H) * 0.075;

  for (let y = 0; y < mapSize; y++) {
    for (let x = 0; x < mapSize; x++) {
      const u = x / (mapSize - 1) * 2 - 1;
      const v = y / (mapSize - 1) * 2 - 1;
      const radius = (u * u + v * v) * 0.5;
      const dx = u * W * 0.5 * curvature * radius;
      const dy = v * H * 0.5 * curvature * radius;
      const i = (y * mapSize + x) * 4;

      pixels.data[i] = clamp(
        Math.round(127.5 + dx / displacementScale * 255), 0, 255
      );
      pixels.data[i + 1] = clamp(
        Math.round(127.5 + dy / displacementScale * 255), 0, 255
      );
      pixels.data[i + 2] = 128;
      pixels.data[i + 3] = 255;
    }
  }
  mapContext.putImageData(pixels, 0, 0);

  const warp = $("crt-warp");
  warp.setAttribute("width", String(W));
  warp.setAttribute("height", String(H));

  const mapElement = $("crt-warp-map");
  mapElement.setAttribute("width", String(W));
  mapElement.setAttribute("height", String(H));
  mapElement.setAttribute("href", map.toDataURL("image/png"));
  $("crt-displacement").setAttribute("scale", String(displacementScale));

  const scan = $("crt-scanlines");
  scan.width = Math.ceil(W);
  scan.height = Math.ceil(H);
  const g = scan.getContext("2d");

  g.fillStyle = rgba(
    V.ground, clamp(number(V.scanlineOpacity, 0.12), 0.03, 0.22)
  );
  for (let y = 0; y < H; y += 4) {
    g.fillRect(0, y, W, 1.1);
  }
  g.fillStyle = rgba(V.ground, 0.025);
  for (let x = 0; x < W; x += 3) {
    g.fillRect(x, 0, 1, H);
  }

  const picture = $("crt-picture");
  const raster = $("crt-raster");
  const beam = $("crt-line");
  const edgeTop = $("crt-edge-top");
  const edgeBottom = $("crt-edge-bottom");
  const edges = [edgeTop, edgeBottom];
  const beamY = H / 2;
  const beamW = W * 0.82;
  const strikeY = clamp(
    groupY + (
      activeRows.length > 1
        ? (activeRows[0].offsetHeight + rowGap / 2) * stretch
        : renderedTitleH() + Math.min(systemGap() / 2, 12)
    ),
    12,
    H - 12
  );

  [beam, ...edges].forEach((element) => {
    element.style.left = (W - beamW) / 2 + "px";
    element.style.top = beamY - 1.5 + "px";
    element.style.width = beamW + "px";
  });

  const open = "inset(0% 0% 0% 0%)";
  const slit = "inset(49.92% 0% 49.92% 0%)";
  const closed = "inset(50% 0% 50% 0%)";

  gsap.set(picture, { clipPath: slit });
  gsap.set(raster, { scaleY: 0.025 });
  gsap.set(title, {
    autoAlpha: 0,
    scaleX: preX,
    scaleY: compression,
  });
  if (activeRows.length) gsap.set(activeRows, { autoAlpha: 0 });
  gsap.set(system, { autoAlpha: 0 });
  gsap.set(dot, { autoAlpha: 0 });
  gsap.set(edges, { visibility: "hidden", y: 0 });
  if (overlay) gsap.set(stage, { clipPath: closed });

  const tl = gsap.timeline({ paused: true });
  const build = gsap.timeline();

  build.to(beam, {
    scaleX: 1.06,
    scaleY: 2.4,
    duration: frameD * 1.5,
    ease: "power2.in",
  }, 0);
  build.set(edges, { visibility: "visible" }, frameD);
  build.set(beam, { visibility: "hidden" }, frameD * 3);

  build.to(edgeTop, {
    y: -beamY - 12,
    scaleX: 1.2,
    duration: frameD * 9,
    ease: "power3.out",
  }, frameD);
  build.to(edgeBottom, {
    y: H - beamY + 12,
    scaleX: 1.2,
    duration: frameD * 9,
    ease: "power3.out",
  }, frameD);
  build.to(picture, {
    clipPath: open,
    duration: frameD * 9,
    ease: "power3.out",
  }, frameD);
  build.to(raster, {
    scaleY: 1.06,
    duration: frameD * 6,
    ease: "expo.out",
  }, frameD);
  build.to(raster, {
    scaleY: 1,
    duration: frameD * 5,
    ease: "power3.out",
  }, frameD * 7);

  build.set(edges, { visibility: "hidden" }, frameD * 11);
  if (activeRows.length) {
    build.set(title, { autoAlpha: 1 }, frameD * 2);
  }

  activeRows.forEach((row, i) => {
    const at = D * (0.04 + i * 0.16);

    build.fromTo(row,
      { autoAlpha: 1, y: 28, scaleY: 0.64 },
      {
        autoAlpha: 1,
        y: 0,
        scaleY: 1,
        duration: D * 0.14,
        ease: "expo.out",
        immediateRender: false,
      }, at);
  });

  build.fromTo(stage,
    { "--crt-fringe": fringe + 3.2 },
    {
      "--crt-fringe": fringe,
      duration: frameD * 16,
      ease: "power3.out",
    }, 0);

  if (overlay) {
    build.fromTo(stage,
      { clipPath: closed },
      {
        clipPath: open,
        duration: frameD * 8,
        ease: "power4.out",
      }, 0);
  }

  if (hasSystem) {
    const typingAt = D * 0.42;
    const typingEnd = D * 0.72;
    const words = Array.from(preMessage.matchAll(/\S+/g));

    build.set(system, { autoAlpha: 1 }, typingAt);

    words.forEach((word, i) => {
      const at = typingAt +
        (typingEnd - typingAt) * i / Math.max(1, words.length - 1);
      const prefix = preMessage.slice(0, word.index + word[0].length);

      build.set(typed, { textContent: prefix }, at);
      build.fromTo(cursor,
        { scaleY: 1.3 },
        {
          scaleY: 1,
          duration: frameD * 3,
          ease: "power3.out",
          immediateRender: false,
        }, at);
      build.fromTo("#crt-lock-pulse",
        { opacity: 0.13 },
        {
          opacity: 0.025,
          duration: frameD * 3,
          ease: "power3.out",
          immediateRender: false,
        }, at);
    });
  }

  // Keep the compressed pose until a short, accelerating release.
  // The peak lands at the key, rather than resembling another row strike.
  build.to(title, {
    scaleX: punchX,
    scaleY: punch,
    duration: D * 0.065,
    ease: "power4.in",
  }, D * 0.935);

  build.timeScale(1 / T.scale);
  tl.add(build, 0);

  const settle = Math.min(0.26, Math.max(0, T.hold));

  tl.set(title, { scaleX: punchX, scaleY: punch }, K);
  tl.set("#crt-lock-pulse", { opacity: 1 }, K);
  tl.set(stage, { "--crt-fringe": fringe + 3 }, K);

  if (settle > 0) {
    // A fresh beam flare occupies the gap between the title lines.
    // It contracts in thickness, without covering or duplicating words.
    const flareDuration = Math.min(0.16, settle);
    tl.set(beam, {
      top: strikeY - 1.5,
      visibility: "visible",
      scaleX: 1.08,
      scaleY: 4,
    }, K);
    tl.to(beam, {
      scaleY: 0,
      duration: flareDuration,
      ease: "expo.out",
    }, K);
    tl.set(beam, { visibility: "hidden" }, K + flareDuration);

    tl.to(title, {
      scaleX: 1.004,
      scaleY: 1.008,
      duration: settle,
      ease: "power3.out",
    }, K);
    tl.to("#crt-lock-pulse", {
      opacity: 0.18,
      duration: settle,
      ease: "power3.out",
    }, K);
    tl.to(stage, {
      "--crt-fringe": fringe,
      duration: settle,
      ease: "power3.out",
    }, K);
  }

  if (hasSystem) {
    tl.set(typed, { textContent: message }, K);
    tl.set(run, { color: V.core }, K);
    tl.set(cursor, { opacity: 1, scaleY: 1 }, K);
    tl.set(dot, {
      autoAlpha: 1,
      scaleX: 2.1,
      scaleY: 2.1,
    }, K);

    if (settle > 0) {
      tl.to(dot, {
        scaleX: 1,
        scaleY: 1,
        duration: settle,
        ease: "back.out(1.6)",
      }, K);
    }
  }

  const exitAt = K + T.hold;
  const transparentExit = T.exit > 0;
  const collapseDuration = transparentExit
    ? Math.max(0, T.exit - frame)
    : Math.min(
        clamp(number(V.shutdownDuration, 0.22), 0.12, 0.5),
        Math.max(0, T.hold - 0.5)
      );
  const collapseAt = transparentExit
    ? exitAt
    : Math.max(K, exitAt - frame - collapseDuration);
  const collapseEnd = collapseAt + collapseDuration;

  if (hasSystem) {
    for (let at = K + 0.44; at + 0.26 < collapseAt; at += 0.66) {
      tl.set(cursor, { opacity: 0 }, at);
      tl.set(cursor, { opacity: 1 }, at + 0.26);
    }
  }

  if (collapseDuration > 0) {
    tl.set(edges, { visibility: "visible" }, collapseAt);

    tl.fromTo(edgeTop,
      { y: -beamY - 12, scaleX: 1.2 },
      {
        y: 0,
        scaleX: 1,
        duration: collapseDuration,
        ease: "power3.in",
        immediateRender: false,
      }, collapseAt);
    tl.fromTo(edgeBottom,
      { y: H - beamY + 12, scaleX: 1.2 },
      {
        y: 0,
        scaleX: 1,
        duration: collapseDuration,
        ease: "power3.in",
        immediateRender: false,
      }, collapseAt);
    tl.fromTo(picture,
      { clipPath: open },
      {
        clipPath: slit,
        duration: collapseDuration,
        ease: "power3.in",
        immediateRender: false,
      }, collapseAt);
    tl.fromTo(raster,
      { scaleY: 1 },
      {
        scaleY: 0.025,
        duration: collapseDuration,
        ease: "power3.in",
        immediateRender: false,
      }, collapseAt);

    tl.set([title, system], { autoAlpha: 0 }, collapseEnd);
    tl.set(picture, { autoAlpha: 0 }, collapseEnd);
    tl.set(edges, { visibility: "hidden" }, collapseEnd);
    tl.set(beam, {
      top: beamY - 1.5,
      visibility: "visible",
      scaleX: 1,
      scaleY: 1,
    }, collapseEnd);
  }

  const designTime = (t) => t <= K ? t / T.scale : D + t - K;
  const openingHeat = (t) => {
    const d = designTime(t);
    return Math.pow(1 - clamp(d / (frameD * 16), 0, 1), 2);
  };
  const brightnessAt = (t) => {
    const hum =
      Math.sin(t * 17.1 + seed * 0.37) * 0.6 +
      Math.sin(t * 29.7 + seed * 0.19) * 0.4;
    const lock = t >= K ? 1.05 * Math.exp(-(t - K) * 12) : 0;
    return 1 + openingHeat(t) * 0.65 + lock + hum * flicker;
  };
  const syncAt = (t) => {
    const d = designTime(t);
    if (d >= frameD * 16) return 0;
    return Math.sin(d * 91) * openingHeat(t) * 5;
  };
  const duration = Math.max(0.001, T.duration);

  // Modifiers also run when motion-blur sampling suppresses events.
  tl.fromTo(raster,
    { x: 0, filter: "brightness(1)" },
    {
      x: 1,
      filter: "brightness(1.01)",
      duration,
      ease: "none",
      modifiers: {
        x: () => syncAt(tl.time()) + "px",
        filter: () => `brightness(${brightnessAt(tl.time())})`,
      },
    }, 0);

  tl.fromTo(beam,
    { filter: "brightness(1)" },
    {
      filter: "brightness(1.01)",
      duration,
      ease: "none",
      modifiers: {
        filter: () =>
          `brightness(${1 + Math.sin(tl.time() * 19 + seed) * flicker})`,
      },
    }, 0);

  tl.fromTo("#crt-snow",
    { backgroundPosition: "0px 0px", opacity: snow },
    {
      backgroundPosition: "1px 1px",
      opacity: snow + 0.001,
      duration,
      ease: "none",
      modifiers: {
        backgroundPosition: () => {
          const currentFrame = Math.floor(tl.time() * fps);
          const hash = Math.imul(currentFrame + seed, 1597334677) >>> 0;
          return `${hash % 192}px ${(hash >>> 9) % 192}px`;
        },
        opacity: () => snow * (1 + openingHeat(tl.time()) * 2),
      },
    }, 0);

  tl.fromTo("#crt-hum",
    { y: -H * 0.3 },
    {
      y: H * 1.03,
      duration,
      ease: "none",
      immediateRender: false,
    }, 0);

  tl.fromTo("#crt-sheen",
    { x: -W * 0.75 },
    {
      x: W * 0.75,
      duration,
      ease: "sine.inOut",
      immediateRender: false,
    }, 0);

  if (transparentExit) {
    const exitDuration = Math.max(0, T.exit - frame);
    tl.fromTo(stage,
      { clipPath: open },
      {
        clipPath: closed,
        duration: exitDuration,
        ease: "power3.in",
        immediateRender: false,
      }, exitAt);
    tl.set(stage, {
      clipPath: closed,
      autoAlpha: 0,
    }, exitAt + exitDuration);
  }

  window.__timelines["block"] = tl;
});