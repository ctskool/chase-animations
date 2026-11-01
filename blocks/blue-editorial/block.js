CA.ready(async () => {
  const { vars: V, stage: S, safe, time: T, variant } = CA;
  const $ = (id) => document.getElementById(id);
  const NS = "http://www.w3.org/2000/svg";
  const full = variant === "full";
  const overlay = variant === "overlay";
  const W = S.w;
  const H = S.h;
  const minText = full ? 40 : 32;
  const stageEl = $("stage");

  const number = (value, fallback) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  };

  const clamp = (value, low, high) =>
    Math.max(low, Math.min(high, value));

  const lower = (value) =>
    String(value == null ? "" : value)
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase();

  const words = [V.part1, V.part2, V.part3, V.part4].map(lower);

  if (words.some((word) => !word)) {
    throw new Error("Blue editorial needs text in all four parts.");
  }

  await Promise.all([
    document.fonts.load('italic 400 400px "Instrument Serif"'),
    document.fonts.load('900 124px "Schibsted Grotesk"'),
  ]);

  const thickness = clamp(number(V.ruleThickness, 3), 1, 6);
  const ruleOpacity = clamp(number(V.ruleOpacity, 0.55), 0.2, 1);
  const peak = clamp(number(V.impactScale, 1.1), 1.03, 1.16);
  const lockHeight = Math.max(10, thickness * 3);

  Object.entries({
    "--be-background": V.background,
    "--be-ink": V.ink,
    "--be-rule": V.ruleColor,
    "--be-rule-opacity": ruleOpacity,
  }).forEach(([key, value]) => {
    stageEl.style.setProperty(key, String(value));
  });

  stageEl.style.background = V.background;

  const side = Math.max(
    number(safe.side, 0),
    full ? 64 : overlay ? 52 : 48,
  );
  const innerW = W - side * 2;

  const top = full
    ? Math.max(230, number(safe.top, 0)) + 18
    : Math.max(32, Math.min(52, number(safe.top, 32)));

  const footerPercent = clamp(
    number(V.emptyBottomPercent, 16),
    16,
    28,
  );

  let bottom = full
    ? Math.min(
        H * (1 - footerPercent / 100),
        H - Math.max(300, number(safe.bottom, 0)),
      ) - 20
    : H - Math.max(32, Math.min(52, number(safe.bottom, 32)));

  let available = bottom - top;

  if (innerW <= 0 || available <= 0) {
    throw new Error("Blue editorial has no usable space inside this stage.");
  }

  const measure = document.createElement("canvas").getContext("2d");
  measure.textAlign = "left";
  measure.textBaseline = "alphabetic";
  measure.fontKerning = "normal";

  if ("letterSpacing" in measure) {
    measure.letterSpacing = "0px";
  }

  function svg(tag, attrs, parent) {
    const el = document.createElementNS(NS, tag);

    Object.entries(attrs || {}).forEach(([key, value]) => {
      el.setAttribute(key, String(value));
    });

    if (parent) parent.appendChild(el);
    return el;
  }

  function resizeWord(word, px) {
    word.fontSize = Math.max(minText, px);

    measure.font = word.kind === "serif"
      ? `italic 400 ${word.fontSize}px "Instrument Serif"`
      : `900 ${word.fontSize}px "Schibsted Grotesk"`;

    const metrics = measure.measureText(word.value);
    const left = number(metrics.actualBoundingBoxLeft, 0);
    const right = number(metrics.actualBoundingBoxRight, metrics.width);
    const ascent = number(
      metrics.actualBoundingBoxAscent,
      word.fontSize * 0.8,
    );
    const descent = Math.max(
      0,
      number(metrics.actualBoundingBoxDescent, word.fontSize * 0.2),
    );

    word.w = left + right;
    word.h = ascent + descent;
    word.ascent = ascent;
    word.baseline = word.pad + ascent;
    word.width = Math.ceil(word.w + word.pad * 2);
    word.height = Math.ceil(word.h + word.pad * 2);

    if (!(word.w > 0 && word.h > 0)) {
      throw new Error("Blue editorial could not measure its text.");
    }

    word.text.style.fontSize = word.fontSize + "px";
    word.text.setAttribute("x", String(word.pad + left));
    word.text.setAttribute("y", String(word.baseline));

    word.svg.setAttribute("width", String(word.width));
    word.svg.setAttribute("height", String(word.height));
    word.svg.setAttribute(
      "viewBox",
      `0 0 ${word.width} ${word.height}`,
    );

    Object.assign(word.el.style, {
      width: word.width + "px",
      height: word.height + "px",
    });

    // Optical spacing follows the ink. Containment also accounts for the
    // browser's SVG text box, which can extend below visible serif letters.
    const bounds = word.text.getBBox();

    if (
      ![bounds.x, bounds.y, bounds.width, bounds.height].every(
        Number.isFinite,
      ) ||
      bounds.width <= 0 ||
      bounds.height <= 0
    ) {
      throw new Error("Blue editorial could not measure its SVG text.");
    }

    word.bounds = {
      left: bounds.x - word.pad,
      top: bounds.y - word.pad,
      right: bounds.x + bounds.width - word.pad,
      bottom: bounds.y + bounds.height - word.pad,
    };

    word.fitW = Math.max(word.w, bounds.width);
  }

  function createWord(id, kind, value, px, maxW, maxH, grow = false) {
    const el = $(id);
    const graphic = svg("svg", {
      xmlns: NS,
      "aria-hidden": "true",
      focusable: "false",
    }, el);

    const text = svg("text", {
      class: kind === "serif" ? "be-serif" : "be-sans",
      "xml:space": "preserve",
    }, graphic);

    text.textContent = value;

    const word = {
      el,
      svg: graphic,
      text,
      value,
      kind,
      pad: 12,
    };

    resizeWord(word, px);

    const ratio = Math.min(maxW / word.fitW, maxH / word.h);

    resizeWord(
      word,
      word.fontSize * (grow ? ratio : Math.min(1, ratio)) * 0.997,
    );

    for (let pass = 0; pass < 4; pass++) {
      const correction = Math.min(1, maxW / word.fitW, maxH / word.h);
      if (correction >= 0.999) break;
      resizeWord(word, word.fontSize * correction * 0.997);
    }

    if (word.fitW > maxW + 1 || word.h > maxH + 1) {
      throw new Error(
        `The text "${value}" needs shortening or a taller stage.`,
      );
    }

    return word;
  }

  function envelope(word, scale) {
    const cx = word.width / 2 - word.pad;
    const cy = word.height / 2 - word.pad;

    return {
      left: cx + (word.bounds.left - cx) * scale,
      right: cx + (word.bounds.right - cx) * scale,
      top: cy + (word.bounds.top - cy) * scale,
      bottom: cy + (word.bounds.bottom - cy) * scale,
    };
  }

  function place(word, x, y) {
    word.x = x;
    word.y = y;

    Object.assign(word.el.style, {
      left: x - word.pad + "px",
      top: y - word.pad + "px",
    });
  }

  function box(id, x, y, width, height) {
    Object.assign($(id).style, {
      left: x + "px",
      top: y + "px",
      width: width + "px",
      height: height + "px",
    });
  }

  const smallPx = full
    ? number(V.smallTypeSize, 124)
    : number(V.compactSmallTypeSize, 96);

  const kicker = createWord(
    "be-kicker",
    "sans",
    words[0],
    smallPx,
    innerW * 0.7,
    available * 0.12,
  );

  const room = createWord(
    "be-room",
    "serif",
    words[1],
    W,
    innerW * (full ? 0.86 : 0.84),
    available * (full ? 0.4 : 0.37),
    true,
  );

  const bridge = createWord(
    "be-for",
    "sans",
    words[2],
    smallPx,
    innerW * 0.55,
    available * 0.12,
  );

  const wonder = createWord(
    "be-wonder",
    "serif",
    words[3],
    W,
    innerW / peak - 8,
    available * (full ? 0.37 : 0.35) / peak,
    true,
  );

  const weights = full
    ? [0.65, 0.8, 1.15, 0.6, 1.05, 0.75]
    : [0.7, 0.75, 0.95, 0.6, 0.85, 0.65];

  const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
  let layout;

  // Preserve optical spacing, then move the lower boundary inward only as
  // much as the actual SVG text box requires at maximum impact scale.
  for (let pass = 0; pass < 14; pass++) {
    available = bottom - top;

    if (available <= 0) {
      throw new Error("This stage is too short for the editorial layout.");
    }

    const minGap = Math.max(
      10,
      Math.min(full ? 22 : 14, available * 0.018),
    );

    const floors = [
      minGap,
      minGap,
      minGap,
      minGap,
      minGap,
      Math.max(minGap, lockHeight * 1.1 + 6),
    ];

    const gapTotal = floors.reduce((sum, gap) => sum + gap, 0);
    const requiredHeight = () =>
      kicker.h +
      room.h +
      bridge.h +
      wonder.h * peak +
      gapTotal +
      thickness * 3;

    for (
      let shrink = 0;
      shrink < 80 && requiredHeight() > available;
      shrink++
    ) {
      resizeWord(room, room.fontSize * 0.96);
      resizeWord(wonder, wonder.fontSize * 0.96);
    }

    if (requiredHeight() > available + 1) {
      throw new Error(
        "This stage is too short for four complete editorial parts.",
      );
    }

    const spare = Math.max(0, available - requiredHeight());
    const gaps = weights.map(
      (weight, i) => floors[i] + spare * weight / weightSum,
    );

    const topRuleY = top + kicker.h + gaps[0];
    const roomY = topRuleY + thickness + gaps[1];
    const roomBottom = roomY + room.h;
    const bridgeY = roomBottom + gaps[2];
    const shortRuleY = bridgeY + bridge.h + gaps[3];
    const wonderEnvelopeY = shortRuleY + thickness + gaps[4];
    const wonderY = wonderEnvelopeY + wonder.h * (peak - 1) / 2;
    const closingRuleY = wonderEnvelopeY + wonder.h * peak + gaps[5];
    const peakBounds = envelope(wonder, peak);

    layout = {
      minGap,
      topRuleY,
      roomY,
      roomBottom,
      bridgeY,
      shortRuleY,
      wonderY,
      closingRuleY,
      peakBounds,
    };

    const overflow = wonderY + peakBounds.bottom - (H - 12);

    if (overflow <= 0) break;
    bottom -= overflow + 2;
  }

  const {
    minGap,
    topRuleY,
    roomY,
    roomBottom,
    bridgeY,
    shortRuleY,
    wonderY,
    closingRuleY,
    peakBounds,
  } = layout;

  if (wonderY + peakBounds.bottom > H - 8) {
    throw new Error(
      "The final word needs shorter copy or a taller stage.",
    );
  }

  place(kicker, side, top);
  place(room, side, roomY);
  place(wonder, W - side - peakBounds.right, wonderY);

  const pocketTop = roomBottom + 1;

  box(
    "be-for-pocket",
    0,
    pocketTop,
    W,
    bridgeY - pocketTop + bridge.h + bridge.pad * 2 + minGap,
  );

  place(bridge, W - side - bridge.w, bridgeY - pocketTop);

  const shortW = Math.min(
    innerW * 0.42,
    Math.max(bridge.w + 42, innerW * 0.27),
  );
  const shortX = W - side - shortW;
  const runnerHeight = Math.max(5, thickness * 1.7);

  box("be-rule-top", side, topRuleY, innerW, thickness);
  box("be-rule-short", shortX, shortRuleY, shortW, thickness);
  box("be-rule-bottom", side, closingRuleY, innerW, thickness);

  box(
    "be-lock",
    side,
    closingRuleY - (lockHeight - thickness) / 2,
    innerW,
    lockHeight,
  );

  box(
    "be-short-window",
    shortX,
    shortRuleY - (runnerHeight - thickness) / 2,
    shortW,
    runnerHeight,
  );

  box(
    "be-bottom-window",
    side,
    closingRuleY - (runnerHeight - thickness) / 2,
    innerW,
    runnerHeight,
  );

  const shortRunnerW = Math.max(36, shortW * 0.26);
  const bottomRunnerW = Math.max(96, innerW * 0.18);

  $("be-short-runner").style.width = shortRunnerW + "px";
  $("be-bottom-runner").style.width = bottomRunnerW + "px";

  const opening = createWord(
    "be-opening",
    "serif",
    words[0],
    W,
    innerW / 1.025,
    available * (full ? 0.64 : 0.7),
    true,
  );

  place(
    opening,
    side + (innerW - opening.w) * 0.25,
    top + (available - opening.h) * (full ? 0.34 : 0.38),
  );

  const roomDefs = svg("defs", {}, room.svg);
  const roomClip = svg("clipPath", {
    id: "be-room-wipe",
    clipPathUnits: "userSpaceOnUse",
  }, roomDefs);

  const slant = Math.tan(14 * Math.PI / 180) * room.height / 2;
  const wipeStart = -slant - 3;
  const wipeEnd = room.width + slant + 3;

  const wipePoints = (x) =>
    `${-room.width},-2 ${x + slant},-2 ` +
    `${x - slant},${room.height + 2} ` +
    `${-room.width},${room.height + 2}`;

  const wipePolygon = svg("polygon", {
    points: wipePoints(wipeStart),
  }, roomClip);

  room.text.setAttribute("clip-path", "url(#be-room-wipe)");

  const wipeEdge = svg("line", {
    class: "be-wipe-edge",
    x1: wipeStart + slant,
    y1: 0,
    x2: wipeStart - slant,
    y2: room.height,
    "stroke-width": thickness,
  }, room.svg);

  const wonderDefs = svg("defs", {}, wonder.svg);
  const wholeWonder = wonder.text;

  const slices = Array.from({ length: 4 }, (_, i) => {
    const clip = svg("clipPath", {
      id: `be-wonder-band-${i}`,
      clipPathUnits: "userSpaceOnUse",
    }, wonderDefs);

    svg("rect", {
      x: 0,
      y: wonder.height * i / 4,
      width: wonder.width,
      height: wonder.height / 4,
    }, clip);

    const windowGroup = svg("g", {
      "clip-path": `url(#be-wonder-band-${i})`,
    }, wonder.svg);

    const mover = svg("g", {}, windowGroup);
    mover.appendChild(wholeWonder.cloneNode(true));

    return { window: windowGroup, mover };
  });

  const topRuleEl = $("be-rule-top");
  const shortRuleEl = $("be-rule-short");
  const bottomRuleEl = $("be-rule-bottom");
  const lockEl = $("be-lock");
  const shortWindow = $("be-short-window");
  const bottomWindow = $("be-bottom-window");
  const shortRunner = $("be-short-runner");
  const bottomRunner = $("be-bottom-runner");

  const roomLaunchScale = Math.min(1.22, innerW / room.fitW);
  const tuckedY = -(
    bridgeY - pocketTop + bridge.h + bridge.pad * 2 + 8
  );

  gsap.set(
    [kicker.el, room.el, bridge.el, wonder.el, opening.el],
    { autoAlpha: 0 },
  );

  gsap.set([topRuleEl, shortRuleEl, bottomRuleEl], {
    scaleX: 0,
    scaleY: 1,
  });

  gsap.set(lockEl, {
    autoAlpha: 0,
    scaleX: 0,
    scaleY: 1,
  });

  gsap.set([shortWindow, bottomWindow], { autoAlpha: 0 });
  gsap.set(shortRunner, { x: -shortRunnerW });
  gsap.set(bottomRunner, { x: -bottomRunnerW });

  gsap.set(room.el, {
    scaleX: roomLaunchScale,
    scaleY: roomLaunchScale,
    transformOrigin: `${room.pad}px ${room.pad}px`,
  });

  gsap.set(bridge.el, { y: tuckedY });

  gsap.set(wonder.el, {
    scaleX: 1,
    scaleY: 1,
    transformOrigin: "50% 50%",
  });

  gsap.set(wholeWonder, { autoAlpha: 0 });

  gsap.set(opening.el, {
    x: 0,
    y: opening.h * 0.055,
    scaleX: 0.97,
    scaleY: 0.97,
    transformOrigin: "0 0",
  });

  slices.forEach((slice, i) => {
    gsap.set(slice.window, { autoAlpha: 0 });
    gsap.set(slice.mover, {
      x: (i % 2 === 0 ? -1 : 1) * (wonder.width + 12),
    });
  });

  const tl = gsap.timeline({ paused: true });
  const build = gsap.timeline();
  const u = (fraction) => fraction * T.design;

  build.set(opening.el, { autoAlpha: 1 }, 0);

  build.to(opening.el, {
    y: 0,
    scaleX: 1,
    scaleY: 1,
    duration: u(0.13),
    ease: "expo.out",
  }, 0);

  build.to(opening.el, {
    scaleX: 1.015,
    scaleY: 1.015,
    duration: u(0.07),
    ease: "power2.in",
  }, u(0.13));

  const snapScale = kicker.w / opening.w;
  const targetLeft = kicker.x - opening.pad * snapScale;
  const targetBaseline = kicker.y + kicker.ascent;
  const targetTop = targetBaseline - opening.baseline * snapScale;

  build.to(opening.el, {
    x: targetLeft - (opening.x - opening.pad),
    y: targetTop - (opening.y - opening.pad),
    scaleX: snapScale,
    scaleY: snapScale,
    duration: u(0.14),
    ease: "expo.inOut",
  }, u(0.2));

  build.set(opening.el, { autoAlpha: 0 }, u(0.34));
  build.set(kicker.el, { autoAlpha: 1 }, u(0.34));

  build.to(topRuleEl, {
    scaleX: 1,
    duration: u(0.1),
    ease: "power4.out",
  }, u(0.34));

  build.set(room.el, { autoAlpha: 1 }, u(0.34));
  build.set(wipeEdge, { autoAlpha: 1 }, u(0.34));

  build.to(wipePolygon, {
    attr: { points: wipePoints(wipeEnd) },
    duration: u(0.09),
    ease: "power3.inOut",
  }, u(0.34));

  build.to(wipeEdge, {
    attr: {
      x1: wipeEnd + slant,
      x2: wipeEnd - slant,
    },
    duration: u(0.09),
    ease: "power3.inOut",
  }, u(0.34));

  build.set(wipeEdge, { autoAlpha: 0 }, u(0.43));

  build.to(room.el, {
    scaleX: 1,
    scaleY: 1,
    duration: u(0.075),
    ease: "power4.inOut",
  }, u(0.53));

  build.set(bridge.el, { autoAlpha: 1 }, u(0.61));

  build.to(bridge.el, {
    y: 0,
    duration: u(0.08),
    ease: "back.out(1.05)",
  }, u(0.61));

  build.to(shortRuleEl, {
    scaleX: 1,
    duration: u(0.235),
    ease: "power3.out",
  }, u(0.62));

  build.set(shortWindow, { autoAlpha: 1 }, u(0.69));

  build.to(shortRunner, {
    x: shortW * 0.16,
    duration: u(0.31),
    ease: "sine.inOut",
  }, u(0.69));

  build.set(wonder.el, { autoAlpha: 1 }, u(0.8));

  slices.forEach((slice, i) => {
    const at = 0.8 + i * 0.014;

    build.set(slice.window, { autoAlpha: 1 }, u(at));

    build.to(slice.mover, {
      x: 0,
      duration: u(0.945 - at),
      ease: "power4.out",
    }, u(at));
  });

  build.to(bottomRuleEl, {
    scaleX: 1,
    duration: u(0.085),
    ease: "power3.out",
  }, u(0.915));

  build.set(bottomWindow, { autoAlpha: 1 }, u(0.915));

  build.to(bottomRunner, {
    x: 0,
    duration: u(0.085),
    ease: "power3.out",
  }, u(0.915));

  // Finish the strips before the punch so the payoff is one clean word.
  build.set(
    slices.map((slice) => slice.window),
    { autoAlpha: 0 },
    u(0.945),
  );

  build.set(wholeWonder, { autoAlpha: 1 }, u(0.945));

  build.to(wonder.el, {
    scaleX: peak,
    scaleY: peak,
    duration: u(0.055),
    ease: "power3.in",
  }, u(0.945));

  build.set(lockEl, { autoAlpha: 1 }, u(0.955));

  build.to(lockEl, {
    scaleX: 1,
    scaleY: 2.2,
    duration: u(0.045),
    ease: "expo.out",
  }, u(0.955));

  build.timeScale(1 / T.scale);
  tl.add(build, 0);

  if (T.hold > 0) {
    tl.fromTo(wonder.el,
      { scaleX: peak, scaleY: peak },
      {
        scaleX: 1,
        scaleY: 1,
        duration: Math.min(0.22, T.hold),
        ease: "power3.out",
        immediateRender: false,
      },
      T.key,
    );

    tl.fromTo(lockEl,
      { scaleX: 1, scaleY: 2.2 },
      {
        scaleX: 0.38,
        scaleY: 1,
        duration: Math.min(0.24, T.hold),
        ease: "power3.out",
        immediateRender: false,
      },
      T.key,
    );

    tl.fromTo(topRuleEl,
      { scaleY: 2 },
      {
        scaleY: 1,
        duration: Math.min(0.18, T.hold),
        ease: "power3.out",
        immediateRender: false,
      },
      T.key,
    );

    tl.fromTo(shortRunner,
      { x: shortW * 0.16 },
      {
        x: Math.max(shortW * 0.16, shortW - shortRunnerW),
        duration: T.hold,
        ease: "sine.inOut",
        immediateRender: false,
      },
      T.key,
    );

    tl.fromTo(bottomRunner,
      { x: 0 },
      {
        x: Math.max(0, innerW - bottomRunnerW),
        duration: T.hold,
        ease: "sine.inOut",
        immediateRender: false,
      },
      T.key,
    );
  }

  const lean = H * Math.tan(14 * Math.PI / 180) / (2 * W) * 100;

  const closed =
    `polygon(${50 + lean}% -10%, ${50 + lean}% -10%, ` +
    `${50 - lean}% 110%, ${50 - lean}% 110%)`;

  const open =
    "polygon(-10% -10%, 110% -10%, 110% 110%, -10% 110%)";

  if (overlay) {
    tl.fromTo(stageEl,
      { clipPath: closed },
      {
        clipPath: open,
        duration: Math.min(0.18, T.key * 0.1),
        ease: "power4.out",
      },
      0,
    );
  }

  if (T.exit > 0) {
    const exitRun = Math.max(0, T.exit - 1 / CA.fps);

    if (exitRun > 0) {
      tl.fromTo(stageEl,
        { clipPath: open },
        {
          clipPath: closed,
          duration: exitRun,
          ease: "power3.in",
          immediateRender: false,
        },
        T.key + T.hold,
      );
    } else {
      tl.set(stageEl, { clipPath: closed }, T.key + T.hold);
    }
  }

  window.__timelines["block"] = tl;
});