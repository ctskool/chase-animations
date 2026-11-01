CA.ready(() => {
  const {
    vars: V, stage: S, safe, time: T, variant,
    make, fit, rgba, parseStat, grainUrl, seeded
  } = CA;

  const KIT = CA.claude;
  const $ = (id) => document.getElementById(id);
  const stageEl = $("stage");
  const assembly = $("hc-assembly");
  const hoursLayer = $("hc-hours");
  const dustLayer = $("hc-dust");
  const W = S.w;
  const H = S.h;
  const D = T.design;
  const compact = variant !== "full";
  const minText = compact ? 32 : 40;
  const rnd = seeded(316);
  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

  const requestedHours = Number(V.hours);
  const slots = clamp(
    Math.round(Number.isFinite(requestedHours) ? requestedHours : 1),
    1,
    8
  );

  const tasks = Array.from({ length: slots }, (_, i) => ({
    offset: i,
    task: String(V[`task${i + 1}`] || "").trim()
  })).filter((item) => item.task);

  const n = tasks.length;
  const layoutCount = Math.max(1, n);

  const layouts = {
    full: {
      side: 48, top: 238, bottom: 300,
      logo: 52, heading: 44, totalGap: 68,
      before: 184, after: 340, caption: 52, captionGap: 28,
      stackTop: 0.275, stackGap: 26,
      gap: 8, finalGap: 2,
      task: 80, time: 76, timeCol: 212,
      pad: 22, minPad: 12, dividerGap: 24,
      radius: 16, minRow: 112,
      cell: 20, heroScale: 1.1,
      capW: 304, capH: 54, sliver: 10,
      clockD: 990, clockGap: 36,
      minuteWidth: 16, hourWidth: 22,
      ledgeGap: 20, floorGap: 12, jump: 144,
      openingDrop: 132, openingOffset: 22,
      clockKick: 1.075
    },
    top: {
      side: 52, top: 30, bottom: 28,
      logo: 42, heading: 40, totalGap: 54,
      before: 144, after: 300, caption: 40, captionGap: 20,
      stackTop: 0.255, stackGap: 14,
      gap: 7, finalGap: 2,
      task: 64, time: 58, timeCol: 184,
      pad: 18, minPad: 6, dividerGap: 20,
      radius: 13, minRow: 78,
      cell: 20, heroScale: 1.16,
      capW: 320, capH: 54, sliver: 8,
      clockD: 650, clockGap: 18,
      minuteWidth: 12, hourWidth: 18,
      ledgeGap: 18, floorGap: 10, jump: 120,
      openingDrop: 94, openingOffset: 18,
      clockKick: 1.095
    },
    overlay: {
      side: 48, top: 32, bottom: 32,
      logo: 44, heading: 40, totalGap: 56,
      before: 146, after: 308, caption: 42, captionGap: 20,
      stackTop: 0.262, stackGap: 14,
      gap: 7, finalGap: 2,
      task: 64, time: 60, timeCol: 188,
      pad: 18, minPad: 6, dividerGap: 20,
      radius: 15, minRow: 80,
      cell: 19, heroScale: 1.12,
      capW: 300, capH: 50, sliver: 10,
      clockD: 680, clockGap: 20,
      minuteWidth: 13, hourWidth: 19,
      ledgeGap: 20, floorGap: 10, jump: 126,
      openingDrop: 102, openingOffset: 20,
      clockKick: 1.085
    }
  };

  const M = layouts[variant] || layouts.full;
  const density = compact ? clamp((H - 48) / 912, 0.6, 1) : 1;
  const side = compact ? M.side : Math.max(M.side, Number(safe.side) || 0);
  const top = compact
    ? Math.max(24, M.top * density)
    : Math.max(M.top, Number(safe.top) || 0);
  const bottomMargin = compact
    ? Math.max(24, M.bottom * density)
    : Math.max(M.bottom, Number(safe.bottom) || 0);

  const inner = W - side * 2;

  /*
   * One floor for both poses. Every hour has the same height.
   * Full keeps its readable bottom row above the bottom safe margin.
   * There is no stretched bottom slab or ruled-paper continuation.
   */
  const initialBase = H - bottomMargin;
  const finalBase = initialBase;
  const gap = M.gap;
  const finalGap = Math.max(1, Math.round(M.finalGap * density));
  const sliver = Math.max(compact ? 6 : 10, Math.round(M.sliver * density));
  const capH = Math.max(compact ? 32 : 48, Math.round(M.capH * density));
  const flatCap = compact ? 5 : 7;
  const extraRows = Math.max(0, n - 6);
  const cell = compact
    ? Math.max(12, Math.round((M.cell - extraRows) * density))
    : Math.max(14, M.cell - extraRows);

  const heroScale = M.heroScale;
  const palette = [V.calendarA, V.calendarB, V.calendarC, V.calendarD];
  const slabShape =
    "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)";

  const tl = gsap.timeline({ paused: true });
  const build = gsap.timeline();

  stageEl.style.background = V.ground;
  $("hc-ground").style.background = V.ground;
  $("hc-glow").style.background =
    `radial-gradient(ellipse at 50% 73%, ${rgba(V.accent, 0.36)} 0%, ` +
    `${rgba(V.ground, 0)} 76%),` +
    `radial-gradient(ellipse at 50% 100%, ${rgba(V.accent, 0.13)} 0%, ` +
    `${rgba(V.ground, 0)} 55%)`;
  $("hc-grain").style.backgroundImage = grainUrl(96, 0.3, 91);

  const logoSize = Math.max(compact ? 40 : 52, Math.round(M.logo * density));
  const header = $("hc-header");
  header.style.cssText +=
    `;left:${side}px;top:${top}px;width:${inner}px;height:${logoSize}px`;

  let logo = null;
  if (V.showLogo) {
    logo = KIT.logo($("hc-brand"), logoSize, V.accent);
  } else {
    $("hc-brand").style.display = "none";
  }

  const heading = $("hc-heading");
  heading.textContent = String(V.heading || "");
  heading.style.fontSize = Math.max(minText, M.heading * density) + "px";
  heading.style.color = V.ink;
  heading.style.marginLeft = V.showLogo
    ? Math.round(logoSize * 0.28) + "px"
    : "0px";
  fit(heading, inner - (V.showLogo ? logoSize * 1.28 : 0), minText);

  const totalTop = top + Math.max(logoSize + 12, M.totalGap * density);
  $("hc-totals").style.cssText +=
    `;left:${side}px;top:${totalTop}px;width:${inner}px`;

  const pal = $("hc-pal");
  const clawd = KIT.mascot(pal, cell, { color: V.accent });
  pal.style.width = clawd.width + "px";
  pal.style.height = clawd.height + "px";
  if (!V.showMascot) pal.style.display = "none";

  const facePlate = make("div", "hc-face", pal);
  facePlate.setAttribute("aria-hidden", "true");
  facePlate.style.cssText +=
    `;left:${cell}px;top:${cell * 2}px;width:${cell * 9}px;` +
    `height:${cell * 1.86}px;background:${V.accent}`;

  const eyes = [1, 7].map((column) => {
    const eye = make("i", "hc-eye", facePlate);
    eye.style.cssText +=
      `;left:${column * cell}px;top:0;width:${cell}px;height:${cell}px;` +
      `background:${V.ground}`;
    return eye;
  });

  const brows = [1, 7].map((column) => {
    const brow = make("i", "hc-brow", facePlate);
    brow.style.cssText +=
      `;left:${(column - 0.15) * cell}px;top:${-cell * 0.48}px;` +
      `width:${cell * 1.3}px;height:${Math.max(2, cell * 0.2)}px;` +
      `background:${V.ground}`;
    return brow;
  });

  const gulp = make("i", "hc-gulp", pal);
  gulp.setAttribute("aria-hidden", "true");
  gulp.style.cssText +=
    `;left:${cell * 4.9}px;top:${cell * 3.85}px;` +
    `width:${cell * 1.2}px;height:${cell * 1.25}px;background:${V.ground}`;

  const throat = make("i", "hc-throat", pal);
  throat.setAttribute("aria-hidden", "true");
  throat.style.cssText +=
    `;left:${cell * 4.7}px;top:${cell * 4.85}px;` +
    `width:${cell * 1.6}px;height:${cell * 0.36}px;background:${V.pixelColor}`;

  const sweat = make("i", "hc-sweat", pal);
  sweat.setAttribute("aria-hidden", "true");
  sweat.style.cssText +=
    `;left:${cell * 10.2}px;top:${cell * 0.8}px;` +
    `width:${cell * 0.65}px;height:${cell * 1.35}px;background:${V.pixelColor}`;

  const smile = make("i", "hc-smile", pal);
  smile.setAttribute("aria-hidden", "true");
  smile.style.cssText +=
    `;left:${cell * 4.65}px;top:${cell * 3.95}px;` +
    `width:${cell * 1.7}px;height:${cell * 0.7}px;background:${V.ground}`;

  function eyePose(timeline, at, expression) {
    const expressions = {
      open:   { x: 0, y: 0, width: 1, height: 1, brows: false },
      down:   { x: -0.28, y: 0.88, width: 1.05, height: 0.55, brows: true },
      wide:   { x: 0, y: -0.12, width: 1.15, height: 1.3, brows: true },
      closed: { x: 0, y: 0.56, width: 1.12, height: 0.16, brows: false },
      impact: { x: 0, y: 0.62, width: 1.16, height: 0.14, brows: true },
      proud:  { x: 0, y: 0.14, width: 1, height: 0.76, brows: false }
    };
    const pose = expressions[expression] || expressions.open;

    timeline.set(eyes, {
      x: pose.x * cell,
      y: pose.y * cell,
      width: pose.width * cell,
      height: Math.max(2, pose.height * cell)
    }, at);
    timeline.set(brows, { autoAlpha: pose.brows ? 1 : 0 }, at);
    timeline.set(brows[0], {
      rotation: expression === "wide" ? -19 : 16
    }, at);
    timeline.set(brows[1], {
      rotation: expression === "wide" ? 19 : -16
    }, at);
  }

  gsap.set([...brows, gulp, throat, sweat, smile], { autoAlpha: 0 });

  const ledgeW = clawd.width + cell * 4;
  const ledgeInset = cell * 2.7;
  const capW = Math.round(Math.min(
    inner * 0.4,
    M.capW,
    clawd.width * 1.5
  ));
  const minHero = compact ? 76 : 96;
  const headlinePeakX = 1.14;
  const headlinePeakY = 1.58;

  const before = $("hc-before");
  const beforeLabel = String(V.beforeLabel || "");
  before.textContent = beforeLabel;
  before.style.fontSize = Math.round(M.before * density) + "px";
  before.style.color = V.ink;

  const beforeRoom = V.showMascot
    ? Math.max(inner * 0.42, inner - ledgeW - ledgeInset - 24)
    : inner;
  fit(before, beforeRoom, minHero);

  const after = $("hc-after");
  after.textContent = String(V.afterWord || "");
  after.style.fontSize = Math.round(M.after * density) + "px";
  after.style.color = V.accent;

  /*
   * Reserve space for the oversized pose itself, including its width.
   * The slam never relies on cropping the first or last word.
   */
  const afterRoom = Math.min(inner, (W - 56) / headlinePeakX);
  fit(after, afterRoom, minHero);
  const afterWidth = after.offsetWidth;
  after.style.left = Math.round((inner - afterWidth) / 2) + "px";

  const caption = $("hc-caption");
  caption.textContent = String(V.afterLabel || "");
  caption.style.fontSize =
    Math.max(minText, Math.round(M.caption * density)) + "px";
  caption.style.color = V.muted;
  fit(caption, inner, minText);

  const captionTop =
    totalTop + after.offsetHeight + Math.max(18, M.captionGap * density);
  caption.style.left = Math.round((W - caption.offsetWidth) / 2) + "px";
  caption.style.top = captionTop + "px";

  const captionBottom = captionTop + caption.offsetHeight;
  const underline = $("hc-underline");
  const underlineW = Math.min(afterWidth * 1.025, inner);
  underline.style.cssText +=
    `;left:${(W - underlineW) / 2}px;` +
    `top:${totalTop + after.offsetHeight + 10}px;` +
    `width:${underlineW}px;height:${compact ? 5 : 7}px;` +
    `background:${V.finalBlockColor}`;

  gsap.set([after, caption, underline], { autoAlpha: 0 });

  const rawStart = String(V.startTime || "").trim();
  const startMatch = rawStart.match(/^(\d{1,2})(?::([0-5]\d))?\s*(am|pm)?$/i);
  let startHour = 0;
  let startMinute = 0;
  let validStart = false;
  let twelveHour = false;

  if (startMatch) {
    const h = Number(startMatch[1]);
    const suffix = (startMatch[3] || "").toLowerCase();
    if ((suffix && h >= 1 && h <= 12) || (!suffix && h >= 0 && h <= 23)) {
      validStart = true;
      twelveHour = Boolean(suffix);
      startMinute = Number(startMatch[2] || 0);
      startHour = suffix ? h % 12 + (suffix === "pm" ? 12 : 0) : h;
    }
  }

  function hourLabel(offset) {
    if (!validStart) return offset === 0 ? rawStart : "";
    const h = (startHour + offset) % 24;
    const minutes = startMinute ? ":" + String(startMinute).padStart(2, "0") : "";
    if (twelveHour) return `${h % 12 || 12}${minutes}${h < 12 ? "am" : "pm"}`;
    return `${String(h).padStart(2, "0")}:${String(startMinute).padStart(2, "0")}`;
  }

  function wholeEnding(text) {
    const words = text.split(/\s+/);
    if (words.length < 3) return text;
    return words.slice(0, -2).join(" ") + " " + words.slice(-2).join("\u00a0");
  }

  const beforeNumber = beforeLabel.match(/\d[\d,]*(?:\.\d+)?/);
  const beforeValue = beforeNumber
    ? Number(beforeNumber[0].replace(/,/g, ""))
    : NaN;

  function openingLabel(count) {
    if (!n || !beforeNumber || !Number.isFinite(beforeValue)) return beforeLabel;
    if (count >= n) return beforeLabel;
    const progress = beforeValue * count / n;
    const value = Number.isInteger(beforeValue)
      ? Math.round(progress)
      : Math.round(progress * 10) / 10;
    let label = beforeLabel.replace(beforeNumber[0], String(value));
    if (value === 1) label = label.replace(/\bhours\b/i, (word) => word.slice(0, -1));
    return label;
  }

  const dividerW = 2;
  const badgeRightGap = 12;
  const taskRoom =
    inner - M.pad * 2 - M.timeCol - dividerW - M.dividerGap;

  let minimumRow = Math.max(
    minText * 1.1 + M.minPad * 2 + 2,
    M.minRow * density
  );

  tasks.forEach((item) => {
    const probe = make("span", "hc-hour-task", hoursLayer, wholeEnding(item.task));
    probe.style.cssText +=
      `;position:absolute;visibility:hidden;display:block;left:0;top:0;` +
      `width:${Math.max(1, taskRoom)}px;font-size:${minText}px`;
    item.minimumCopyHeight = Math.max(
      probe.scrollHeight,
      Math.ceil(minText * 1.1)
    );
    minimumRow = Math.max(
      minimumRow,
      item.minimumCopyHeight + M.minPad * 2 + 2
    );
    probe.remove();
  });

  const latestStackTop =
    initialBase - minimumRow * layoutCount - gap * (layoutCount - 1);
  const beforeLaneRoom =
    latestStackTop - totalTop - M.stackGap * density;
  const maximumBeforeHeight = Math.max(
    minHero * 0.96,
    Math.min(beforeLaneRoom / 1.12, beforeLaneRoom - 24)
  );

  let beforePx = parseFloat(before.style.fontSize);
  while (before.offsetHeight > maximumBeforeHeight + 1 && beforePx > minHero) {
    beforePx -= 1;
    before.style.fontSize = beforePx + "px";
  }

  /*
   * The headline owns this lane during both its entrance and count pulse.
   * Rows land below it and limit their entrance lift to the available room.
   */
  const headlineBottom = totalTop + Math.max(
    before.offsetHeight * 1.12,
    before.offsetHeight + 24
  );
  const preferredStackTop = Math.max(
    H * M.stackTop,
    headlineBottom + M.stackGap * density
  );
  const stackTopTarget = Math.min(preferredStackTop, latestStackTop);
  const rowH = Math.max(
    1,
    (initialBase - stackTopTarget - gap * (layoutCount - 1)) / layoutCount
  );

  let heights = tasks.map(() => rowH);
  let rowGaps = tasks.map(() => gap);

  function positions(values, gaps, floorY) {
    let cursor = floorY;
    return values.map((height, i) => {
      cursor -= height;
      const y = cursor;
      cursor -= gaps[i];
      return y;
    });
  }

  const initialPositions = positions(heights, rowGaps, initialBase);
  const initialStackTop = n ? initialPositions[n - 1] : stackTopTarget;

  const rows = tasks.map((item, i) => {
    const el = make("div", "hc-hour", hoursLayer);
    const color = palette[i % palette.length];
    el.style.cssText +=
      `;width:${inner}px;height:${rowH}px;border-radius:${M.radius}px;` +
      `background:${color};color:${V.calendarInk};clip-path:${slabShape};` +
      `--hc-edge-color:${rgba(V.calendarInk, 0.16)}`;

    const fold = make("div", "hc-hour-fold", el);
    fold.style.background = rgba(V.calendarInk, 0.24);

    const content = make("div", "hc-hour-content", el);
    const verticalPad = Math.max(
      3,
      Math.min(
        M.pad,
        Math.round(rowH * 0.11),
        (rowH - item.minimumCopyHeight - 2) / 2
      )
    );
    content.style.cssText +=
      `;height:${rowH}px;padding:${verticalPad}px ${M.pad}px`;

    const label = hourLabel(item.offset);
    const timeSlot = make("div", "hc-hour-time-slot", content);
    const badgePad = clamp(Math.floor(rowH * 0.055), 3, 8);
    timeSlot.style.cssText +=
      `;width:${M.timeCol - badgeRightGap}px;` +
      `margin-right:${badgeRightGap}px;padding:${badgePad}px 8px;` +
      `border-radius:${compact ? 7 : 9}px;` +
      `background:${V.calendarInk};color:${V.ink}`;

    const time = make("span", "hc-hour-time", timeSlot, label);
    time.style.fontSize = Math.max(
      minText,
      Math.min(
        Math.round(M.time * density),
        Math.floor((rowH - verticalPad * 2 - badgePad * 2) / 1.1)
      )
    ) + "px";

    const divider = make("div", "hc-hour-divider", content);
    divider.style.width = dividerW + "px";
    divider.style.background = rgba(V.calendarInk, 0.24);
    divider.style.marginRight = M.dividerGap + "px";

    if (!label) {
      timeSlot.style.display = "none";
      divider.style.display = "none";
    } else {
      fit(time, M.timeCol - badgeRightGap - 16, minText);
    }

    const task = make("span", "hc-hour-task", content, wholeEnding(item.task));
    let taskPx = Math.max(
      minText,
      Math.round(M.task * density * (n < 4 ? 1.08 : 1))
    );
    task.style.fontSize = taskPx + "px";

    const taskHeight = rowH - verticalPad * 2;
    while (
      (task.scrollHeight > taskHeight + 1 ||
        task.scrollWidth > task.clientWidth + 1) &&
      taskPx > minText
    ) {
      taskPx -= 1;
      task.style.fontSize = taskPx + "px";
    }

    const openingClearance = Math.max(0, initialPositions[i] - headlineBottom);
    const openingStretch = Math.min(1.1, 1 + openingClearance / rowH);
    const openingDrop = Math.min(
      M.openingDrop * density,
      Math.max(0, openingClearance - rowH * (openingStretch - 1))
    );
    const reboundScaleY = Math.min(
      1.065,
      1 + Math.max(0, openingClearance - inner * 0.003) / rowH
    );

    gsap.set(el, {
      x: side + (i % 2 ? M.openingOffset : -M.openingOffset),
      y: initialPositions[i] - openingDrop,
      scaleX: 0.95,
      scaleY: openingStretch,
      rotation: 0,
      skewX: 0,
      autoAlpha: 0
    });

    return { el, fold, content, color, reboundScaleY };
  });

  const clock = $("hc-clock");
  const clockBottom = finalBase + M.floorGap * 0.5;
  const clockRoom = clockBottom - captionBottom - M.clockGap * density;
  const clockD = Math.max(
    160,
    Math.min(M.clockD * density, inner * 0.98, clockRoom)
  );
  const clockX = (W - clockD) / 2;
  const clockY = clockBottom - clockD;

  clock.style.cssText +=
    `;left:${clockX}px;top:${clockY}px;width:${clockD}px;height:${clockD}px`;

  const NS = "http://www.w3.org/2000/svg";

  function svgNode(tag, attrs, parent) {
    const node = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([key, value]) => {
      node.setAttribute(key, String(value));
    });
    if (parent) parent.appendChild(node);
    return node;
  }

  const face = svgNode("svg", {
    viewBox: "0 0 1000 1000", "aria-hidden": "true"
  }, $("hc-clock-face"));

  svgNode("circle", {
    cx: 500, cy: 500, r: 438,
    fill: rgba(V.accent, 0.075),
    stroke: rgba(V.accent, 0.88),
    "stroke-width": 8
  }, face);

  svgNode("circle", {
    cx: 500, cy: 500, r: 365,
    fill: "none",
    stroke: rgba(V.ink, 0.23),
    "stroke-width": 3
  }, face);

  let majorTicks = "";
  let minorTicks = "";

  for (let i = 0; i < 60; i++) {
    const a = i * Math.PI / 30 - Math.PI / 2;
    const major = i % 5 === 0;
    const inside = major ? 372 : 400;
    const segment =
      `M${500 + Math.cos(a) * inside},${500 + Math.sin(a) * inside}` +
      `L${500 + Math.cos(a) * 423},${500 + Math.sin(a) * 423}`;
    if (major) majorTicks += segment;
    else minorTicks += segment;
  }

  svgNode("path", {
    d: majorTicks, fill: "none",
    stroke: rgba(V.ink, 0.86), "stroke-width": 15
  }, face);

  svgNode("path", {
    d: minorTicks, fill: "none",
    stroke: rgba(V.pixelColor, 0.7), "stroke-width": 7
  }, face);

  const orbit = $("hc-clock-orbit");
  const orbitSvg = svgNode("svg", {
    viewBox: "0 0 1000 1000", "aria-hidden": "true"
  }, orbit);

  svgNode("circle", {
    cx: 500, cy: 500, r: 475,
    fill: "none",
    stroke: rgba(V.accent, 0.72),
    "stroke-width": 6,
    "stroke-dasharray": "88 160"
  }, orbitSvg);

  svgNode("rect", {
    x: 486, y: 11, width: 28, height: 28, fill: V.pixelColor
  }, orbitSvg);

  const minuteHand = $("hc-minute-hand");
  const hourHand = $("hc-hour-hand");
  const hub = $("hc-clock-hub");
  const trailLayer = $("hc-clock-trails");
  const rewindArc = $("hc-rewind-arc");

  function handStyle(el, boxRatio, lengthRatio, width, color) {
    el.style.width = clockD * boxRatio + "px";
    el.style.height = clockD * boxRatio + "px";
    el.style.setProperty("--hand-length", clockD * lengthRatio + "px");
    el.style.setProperty("--hand-width", width + "px");
    el.style.setProperty("--hand-color", color);
  }

  handStyle(minuteHand, 0.7, 0.34, M.minuteWidth, V.pixelColor);
  handStyle(hourHand, 0.5, 0.24, M.hourWidth, V.ink);

  const minuteStart = startMinute * 6;
  const hourStart = (startHour % 12) * 30 + startMinute * 0.5;
  const ghosts = [];

  [20, 48, 86, 135].forEach((offset, i) => {
    const el = make("div", "hc-trail-hand", trailLayer);
    handStyle(
      el, 0.7, 0.34, M.minuteWidth * 0.8,
      rgba(V.pixelColor, [0.48, 0.31, 0.17, 0.075][i])
    );
    gsap.set(el, {
      xPercent: -50, yPercent: -50, rotation: minuteStart + offset
    });
    ghosts.push({ el, offset, hand: "minute" });
  });

  [16, 38].forEach((offset, i) => {
    const el = make("div", "hc-trail-hand", trailLayer);
    handStyle(
      el, 0.5, 0.24, M.hourWidth * 0.8,
      rgba(V.ink, [0.25, 0.1][i])
    );
    gsap.set(el, {
      xPercent: -50, yPercent: -50, rotation: hourStart + offset
    });
    ghosts.push({ el, offset, hand: "hour" });
  });

  const rewindSvg = svgNode("svg", {
    viewBox: "0 0 1000 1000", "aria-hidden": "true"
  }, rewindArc);

  function arcPath(start, end, radius) {
    const point = (degrees) => {
      const a = (degrees - 90) * Math.PI / 180;
      return [500 + Math.cos(a) * radius, 500 + Math.sin(a) * radius];
    };
    const a = point(start);
    const b = point(end);
    return `M${a[0]},${a[1]}A${radius},${radius} 0 0 1 ${b[0]},${b[1]}`;
  }

  [
    [0, 30, 1, 25],
    [33, 67, 0.7, 21],
    [70, 109, 0.4, 16],
    [112, 150, 0.18, 10]
  ].forEach(([start, end, opacity, width]) => {
    svgNode("path", {
      d: arcPath(start, end, 455),
      fill: "none",
      stroke: rgba(V.pixelColor, opacity),
      "stroke-width": width,
      "stroke-linecap": "round"
    }, rewindSvg);
  });

  svgNode("polygon", {
    points: "466,45 516,17 516,73", fill: V.pixelColor
  }, rewindSvg);

  const hubSize = compact ? 28 : 36;
  hub.style.cssText +=
    `;width:${hubSize}px;height:${hubSize}px;background:${V.accent}`;

  gsap.set(minuteHand, {
    xPercent: -50, yPercent: -50, rotation: minuteStart
  });
  gsap.set(hourHand, {
    xPercent: -50, yPercent: -50, rotation: hourStart
  });
  gsap.set(hub, { xPercent: -50, yPercent: -50 });
  gsap.set(clock, {
    x: 0, y: 0, opacity: 0.13, scaleX: 0.86, scaleY: 0.86
  });
  gsap.set([trailLayer, rewindArc], { autoAlpha: 0 });

  const strike = $("hc-strike");
  strike.style.cssText +=
    `;left:${clockX}px;top:${clockY}px;width:${clockD}px;height:${clockD}px;` +
    `border-width:${compact ? 7 : 9}px;border-color:${V.finalBlockColor}`;

  const ledge = $("hc-ledge");
  const ledgeX = W - side - ledgeW - ledgeInset;
  const ledgeY = initialStackTop - M.ledgeGap * density;

  ledge.style.cssText +=
    `;width:${ledgeW}px;height:${compact ? 10 : 14}px;` +
    `background:${rgba(V.muted, 0.34)};border-top-width:${compact ? 4 : 5}px;` +
    `border-top-color:${V.accent}`;

  gsap.set(ledge, { x: ledgeX, y: ledgeY });
  if (!V.showMascot) ledge.style.display = "none";

  const homeX = ledgeX + (ledgeW - clawd.width) / 2;
  const homeY = ledgeY - clawd.height;
  const palCenterX = (W - clawd.width) / 2;
  gsap.set(pal, {
    x: homeX, y: homeY, rotation: 0, scaleX: 1, scaleY: 1
  });

  const floor = $("hc-floor");
  floor.style.cssText +=
    `;width:${inner}px;height:${compact ? 4 : 5}px;` +
    `background:${rgba(V.muted, 0.46)}`;
  gsap.set(floor, { x: side, y: initialBase + M.floorGap });

  const cap = $("hc-cap");
  cap.style.cssText +=
    `;width:${capW}px;height:${flatCap}px;background:${V.accent};` +
    `border-radius:${compact ? 5 : 6}px;` +
    `border-top-color:${rgba(V.pixelColor, 0.9)}`;

  const shine = $("hc-cap-shine");
  shine.style.background = rgba(V.ink, 0.28);
  gsap.set(shine, { x: -capW * 0.12 });
  gsap.set(cap, {
    x: (W - capW) / 2,
    y: initialStackTop - flatCap,
    scaleX: 1,
    scaleY: 1,
    autoAlpha: 0
  });

  /*
   * kick gives a burst a visible spread on its first frame.
   * The key-frame particles therefore do not all occupy one pixel.
   */
  function dustBurst(
    timeline, at, ox, oy, count, life, reach, direction = 0, kick = 0
  ) {
    if (life <= 0 || count < 1) return;
    const colors = [V.accent, V.pixelColor, V.finalBlockColor, V.ink];

    for (let i = 0; i < count; i++) {
      const pixel = make("div", "hc-pixel", dustLayer);
      const size = (compact ? 7 : 9) * (rnd() > 0.84 ? 2 : 1);
      pixel.style.cssText +=
        `;width:${size}px;height:${size}px;background:${colors[i % colors.length]}`;

      const angle = Math.PI + rnd() * Math.PI;
      const radius = kick * (0.4 + rnd() * 0.6);
      const x0 = clamp(ox + Math.cos(angle) * radius - size / 2, 0, W - size);
      const y0 = clamp(oy + Math.sin(angle) * radius - size / 2, 0, H - size);
      const spread = direction
        ? direction * (0.22 + rnd() * 0.78) * reach * 0.55
        : (rnd() - 0.5) * reach;
      const x1 = clamp(x0 + spread, 2, W - size - 2);
      const lift = (compact ? 24 : 38) + rnd() * (compact ? 64 : 112);
      const fall = (compact ? 45 : 72) + rnd() * (compact ? 65 : 124);
      const yUp = clamp(y0 - lift, 2, H - size - 2);
      const yDown = clamp(y0 + fall, 2, H - size - 2);
      const up = Math.min(0.24, life * 0.38);
      const fade = Math.min(0.16, life * 0.3);

      gsap.set(pixel, { x: x0, y: y0, autoAlpha: 0 });
      timeline.set(pixel, { autoAlpha: 1 }, at);
      timeline.to(pixel, {
        x: x1, duration: life, ease: "power3.out"
      }, at);
      timeline.to(pixel, {
        y: yUp, duration: up, ease: "power3.out"
      }, at);
      timeline.to(pixel, {
        y: yDown,
        duration: Math.max(0.001, life - up),
        ease: "power1.in"
      }, at + up);
      timeline.to(pixel, {
        opacity: 0, duration: fade, ease: "power1.in"
      }, at + life - fade);
      timeline.set(pixel, { autoAlpha: 0 }, at + life);
    }
  }

  function impactRays(timeline, at, ox, oy, reach, life) {
    if (life <= 0) return;

    [-158, -137, -112, -68, -43, -22].forEach((angle, i) => {
      const ray = make("div", "hc-impact-ray", dustLayer);
      const radians = angle * Math.PI / 180;
      const length = reach * (i % 2 ? 0.25 : 0.19);
      ray.style.cssText +=
        `;width:${length}px;height:${compact ? 5 : 7}px;` +
        `background:${i % 2 ? V.pixelColor : V.ink}`;

      gsap.set(ray, {
        x: ox + Math.cos(radians) * reach * 0.15,
        y: oy + Math.sin(radians) * reach * 0.15,
        rotation: angle,
        scaleX: 0.6,
        autoAlpha: 0
      });

      timeline.set(ray, { autoAlpha: 1 }, at);
      timeline.to(ray, {
        x: ox + Math.cos(radians) * reach * 0.4,
        y: oy + Math.sin(radians) * reach * 0.4,
        scaleX: 1.25,
        duration: life * 0.5,
        ease: "power4.out"
      }, at);
      timeline.to(ray, {
        scaleX: 0,
        duration: life * 0.5,
        ease: "power3.in"
      }, at + life * 0.5);
      timeline.set(ray, { autoAlpha: 0 }, at + life);
    });
  }

  gsap.set(before, { textContent: openingLabel(0) });

  build.fromTo(before, { y: 24 }, {
    y: 0,
    duration: 0.16,
    ease: "power4.out",
    immediateRender: false
  }, 0);

  if (logo) {
    build.fromTo(logo, {
      rotation: -70, scaleX: 0.35, scaleY: 0.35
    }, {
      rotation: 0, scaleX: 1, scaleY: 1,
      transformOrigin: "50% 50%",
      duration: 0.24,
      ease: "back.out(2.2)",
      immediateRender: false
    }, 0);
  }

  /*
   * Bottom-up arrivals are actual entrances.
   * A row is hidden until its own drop starts; no future rows hover
   * in their final slots while waiting for a small alignment tween.
   */
  const openingEnd = Math.min(0.9, D * 0.25);
  const dropDuration = Math.min(0.11, openingEnd * 0.16);
  const settleDuration = Math.min(0.145, openingEnd * 0.2);
  const arrivalSpacing = n > 1
    ? Math.max(0, openingEnd - dropDuration - settleDuration) / (n - 1)
    : 0;
  const openingPulse = Math.min(
    0.1,
    n > 1 ? arrivalSpacing * 0.8 : 0.1
  );

  rows.forEach((row, i) => {
    const at = i * arrivalSpacing;
    const hit = at + dropDuration;
    const elapsed = tasks[i].offset + 1;
    const rebound = settleDuration * 0.35;

    build.set(row.el, { autoAlpha: 1 }, at);
    build.to(row.el, {
      x: side,
      y: initialPositions[i],
      scaleX: 1,
      scaleY: 1,
      duration: dropDuration,
      ease: "power4.in"
    }, at);

    build.set(row.el, {
      scaleX: 1.045,
      scaleY: 0.78,
      rotation: i % 2 ? 0.65 : -0.65,
      backgroundColor: V.ink
    }, hit);

    build.to(row.el, {
      scaleX: 0.985,
      scaleY: row.reboundScaleY,
      rotation: i % 2 ? -0.25 : 0.25,
      duration: rebound,
      ease: "power4.out"
    }, hit);
    build.to(row.el, {
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      duration: settleDuration - rebound,
      ease: "power3.out"
    }, hit + rebound);
    build.to(row.el, {
      backgroundColor: row.color,
      duration: settleDuration,
      ease: "power3.out"
    }, hit);

    build.set(before, { textContent: openingLabel(i + 1) }, hit);
    build.fromTo(before, {
      scaleX: 1.065, scaleY: 1.12
    }, {
      scaleX: 1, scaleY: 1,
      duration: openingPulse,
      ease: "power4.out",
      immediateRender: false
    }, hit);

    build.to(minuteHand, {
      rotation: minuteStart + elapsed * 360,
      duration: Math.min(0.08, openingPulse),
      ease: "power4.out"
    }, hit);
    build.to(hourHand, {
      rotation: hourStart + elapsed * 30,
      duration: Math.min(0.08, openingPulse),
      ease: "power4.out"
    }, hit);
    build.fromTo(hub, {
      scaleX: 1.5, scaleY: 1.5
    }, {
      scaleX: 1, scaleY: 1,
      duration: openingPulse,
      ease: "power3.out",
      immediateRender: false
    }, hit);

    dustBurst(
      build, hit,
      side + inner * (i % 2 ? 0.88 : 0.12),
      initialPositions[i] + rowH,
      5, 0.22, inner * 0.18
    );
  });

  const beatCount = Math.max(1, n);
  const firstHit = D * (beatCount === 1 ? 0.76 : 0.6);
  const cascadeSpan = D - firstHit;
  const decay = beatCount > 6 ? 0.9 : 0.84;
  const weights = Array.from({ length: beatCount }, (_, i) => Math.pow(decay, i));
  const weightSum = weights.reduce((sum, value) => sum + value, 0);
  let beatCursor = firstHit;

  const beats = weights.map((weight, i) => {
    const at = beatCursor;
    const end = i === beatCount - 1
      ? D
      : at + cascadeSpan * weight / weightSum;
    beatCursor = end;
    return { at, end, window: end - at };
  });

  const flight = Math.min(0.46, D * 0.13);
  const jumpStart = firstHit - flight;
  const anticipation = Math.max(
    0.1,
    Math.min(1.06, jumpStart - openingEnd - 0.04)
  );
  const lookStart = jumpStart - anticipation;
  const gulpAt = lookStart + anticipation * 0.3;
  const recoilAt = lookStart + anticipation * 0.51;
  const crouchAt = lookStart + anticipation * 0.75;
  const crouchEnd = jumpStart - anticipation * 0.075;

  build.to(orbit, {
    rotation: -24,
    duration: firstHit,
    ease: "sine.inOut"
  }, 0);

  build.set(header, { autoAlpha: 0 }, lookStart);
  build.to(before, {
    y: top - totalTop,
    scaleX: compact ? 0.62 : 0.66,
    scaleY: compact ? 0.62 : 0.66,
    duration: 0.14,
    ease: "power3.out"
  }, lookStart);

  if (V.showMascot) {
    clawd.pose(build, 0, {
      eyes: "closed", arms: "down", legs: "stand"
    });
    eyePose(build, 0, "open");

    /*
     * Three separate readable poses:
     * far over the edge, a gulp, then far away from the edge.
     * The crouch finishes early enough to hold before takeoff.
     */
    eyePose(build, lookStart, "down");
    clawd.pose(build, lookStart, {
      eyes: "closed", arms: "left", legs: "stand"
    });
    build.to(pal, {
      x: homeX - cell * 3.2,
      y: homeY,
      rotation: -18,
      scaleX: 1.08,
      scaleY: 0.94,
      duration: anticipation * 0.24,
      ease: "power4.out"
    }, lookStart);

    eyePose(build, gulpAt, "wide");
    build.set(gulp, {
      autoAlpha: 1, y: 0, scaleX: 0.65, scaleY: 0.65
    }, gulpAt);
    build.to(gulp, {
      scaleX: 1.15,
      scaleY: 1.15,
      duration: anticipation * 0.065,
      ease: "power4.out"
    }, gulpAt);
    build.to(gulp, {
      y: cell * 0.85,
      scaleX: 0.45,
      scaleY: 0.4,
      duration: anticipation * 0.1,
      ease: "power3.in"
    }, gulpAt + anticipation * 0.065);
    build.set(gulp, { autoAlpha: 0 }, gulpAt + anticipation * 0.17);

    build.set(throat, { autoAlpha: 1, y: 0 }, gulpAt + anticipation * 0.08);
    build.to(throat, {
      y: cell * 0.95,
      duration: anticipation * 0.12,
      ease: "power3.in"
    }, gulpAt + anticipation * 0.08);
    build.set(throat, { autoAlpha: 0 }, gulpAt + anticipation * 0.2);

    build.set(sweat, { autoAlpha: 1, x: 0, y: 0 }, gulpAt);
    build.to(sweat, {
      x: cell * 1.15,
      y: cell * 2.2,
      duration: anticipation * 0.19,
      ease: "power2.in"
    }, gulpAt);
    build.set(sweat, { autoAlpha: 0 }, gulpAt + anticipation * 0.2);

    build.to(pal, {
      rotation: -12,
      scaleX: 0.98,
      scaleY: 1.12,
      duration: anticipation * 0.075,
      ease: "power4.out"
    }, gulpAt);
    build.to(pal, {
      rotation: -16,
      scaleX: 1.06,
      scaleY: 0.96,
      duration: anticipation * 0.1,
      ease: "power2.in"
    }, gulpAt + anticipation * 0.075);

    clawd.pose(build, recoilAt, {
      eyes: "closed", arms: "right", legs: "stand"
    });
    eyePose(build, recoilAt, "wide");
    build.to(pal, {
      x: homeX + cell * 2.8,
      y: homeY,
      rotation: 20,
      scaleX: 0.92,
      scaleY: 1.12,
      duration: anticipation * 0.18,
      ease: "power4.out"
    }, recoilAt);

    clawd.pose(build, crouchAt, {
      eyes: "closed", arms: "down", legs: "stand"
    });
    eyePose(build, crouchAt, "closed");
    build.to(pal, {
      x: homeX + cell * 0.65,
      y: homeY,
      rotation: -7,
      scaleX: 1.38,
      scaleY: 0.56,
      duration: Math.max(0.01, crouchEnd - crouchAt),
      ease: "power4.in"
    }, crouchAt);

    build.set(before, { autoAlpha: 0 }, jumpStart);
    build.set(before, { autoAlpha: 1 }, firstHit);

    const landingY = initialStackTop - flatCap - clawd.height;
    const apexLimit = variant === "top"
      ? 20 + cell * 3
      : compact ? 20 : top + 8;
    const apex = Math.max(
      apexLimit,
      Math.min(homeY, landingY) - M.jump * density
    );
    const rise = flight * 0.44;

    clawd.pose(build, jumpStart, {
      eyes: "closed", arms: "up", legs: "right"
    });
    eyePose(build, jumpStart, "wide");
    build.to(pal, {
      x: palCenterX + cell * 0.5,
      y: apex,
      rotation: -9,
      scaleX: 0.86,
      scaleY: 1.24,
      duration: rise,
      ease: "power4.out"
    }, jumpStart);

    clawd.pose(build, jumpStart + rise, {
      eyes: "closed", arms: "up", legs: "stand"
    });
    eyePose(build, jumpStart + rise, "down");
    build.to(pal, {
      x: palCenterX,
      y: landingY,
      rotation: 0,
      scaleX: 1,
      scaleY: 1.12,
      duration: flight - rise,
      ease: "power4.in"
    }, jumpStart + rise);

    build.to(ledge, {
      rotation: 9,
      scaleX: 0,
      duration: 0.075,
      ease: "power4.in"
    }, jumpStart + 0.02);
  }

  const finalStat = parseStat(V.afterWord);
  const parsedMinutes = finalStat ? Number(finalStat.value) : 0;
  const minutes = Number.isFinite(parsedMinutes) ? Math.max(0, parsedMinutes) : 0;
  const elapsedHours = n ? tasks[n - 1].offset + 1 : 0;
  const minuteOpeningEnd = minuteStart + elapsedHours * 360;
  const hourOpeningEnd = hourStart + elapsedHours * 30;
  const minuteEnd = minuteStart + minutes * 6;
  const hourEnd = hourStart + minutes * 0.5;

  const rewindMinuteEnd = minuteEnd -
    Math.max(0, Math.ceil((minuteEnd - minuteOpeningEnd + 1) / 360)) * 360;
  const rewindHourEnd = hourEnd -
    Math.max(0, Math.ceil((hourEnd - hourOpeningEnd + 0.01) / 360)) * 360;

  const rewindEase = (p) => 0.16 * p + 0.84 * p * p * p;
  const orbitCrushEnd = -24 - beatCount * 82;

  build.set(clock, { opacity: 0.92 }, firstHit);
  build.to(clock, {
    scaleX: 1,
    scaleY: 1,
    opacity: 1,
    duration: cascadeSpan * 0.62,
    ease: "power3.out"
  }, firstHit);

  build.set([trailLayer, rewindArc], { autoAlpha: 1 }, firstHit);
  build.set(minuteHand, { rotation: minuteOpeningEnd }, firstHit);
  build.set(hourHand, { rotation: hourOpeningEnd }, firstHit);
  build.set(rewindArc, { rotation: minuteOpeningEnd }, firstHit);

  build.to(minuteHand, {
    rotation: rewindMinuteEnd,
    duration: cascadeSpan,
    ease: rewindEase
  }, firstHit);
  build.to(hourHand, {
    rotation: rewindHourEnd,
    duration: cascadeSpan,
    ease: rewindEase
  }, firstHit);
  build.to(rewindArc, {
    rotation: rewindMinuteEnd,
    duration: cascadeSpan,
    ease: rewindEase
  }, firstHit);
  build.to(orbit, {
    rotation: orbitCrushEnd,
    duration: cascadeSpan,
    ease: rewindEase
  }, firstHit);

  ghosts.forEach((ghost) => {
    const startAngle = ghost.hand === "minute"
      ? minuteOpeningEnd : hourOpeningEnd;
    const endAngle = ghost.hand === "minute"
      ? rewindMinuteEnd : rewindHourEnd;
    build.set(ghost.el, { rotation: startAngle + ghost.offset }, firstHit);
    build.to(ghost.el, {
      rotation: endAngle + ghost.offset,
      duration: cascadeSpan,
      ease: rewindEase
    }, firstHit);
  });

  let livePositions = initialPositions.slice();
  let currentTop = initialStackTop;
  let finalTop = initialStackTop;
  let finalPalY = homeY;
  const capSquash = 0.76;

  beats.forEach((beat, k) => {
    const { at, end, window: beatWindow } = beat;
    const index = n - 1 - k;
    const first = k === 0;
    const last = k === beatCount - 1;
    const crushDuration = beatWindow * (last ? 1 : 0.72);
    const buckleDuration = crushDuration * (last ? 0.5 : 0.55);
    const pressDuration = crushDuration - buckleDuration;
    const pressAt = at + buckleDuration;
    const snapEnd = last ? D : at + crushDuration;
    const reboundRoom = Math.max(0, end - snapEnd);
    const previousTop = currentTop;
    const oldHeight = index >= 0 ? heights[index] : 0;
    const kick = k % 2 ? -7 : 7;

    const nextHeights = heights.slice();
    const nextGaps = rowGaps.slice();
    if (index >= 0) {
      nextHeights[index] = sliver;
      if (index > 0) nextGaps[index - 1] = finalGap;
    }

    const nextPositions = positions(nextHeights, nextGaps, finalBase);
    const nextTop = n ? nextPositions[n - 1] : finalBase;
    const thisCapH = last ? capH : flatCap;
    const capStartY = previousTop - flatCap;
    const capEndY = nextTop - thisCapH;
    const loadSquash = first ? 0.72 : 0.76;
    const foldDrop = oldHeight * (1 - loadSquash);
    const palEndY = capEndY - clawd.height;

    if (index >= 0) {
      const row = rows[index];

      /*
       * Labels remain attached through BOTH compression phases.
       * Keep the natural row width and height while transforming it:
       * words cannot reflow or be cropped into partial words.
       * Only the completed sliver loses its label, on the snap frame.
       */
      build.to(row.el, {
        x: side + kick,
        scaleX: 1.03,
        scaleY: loadSquash,
        rotation: 0,
        skewX: 0,
        duration: buckleDuration,
        ease: "power4.out"
      }, at);
      build.to(row.fold, {
        opacity: 0.65,
        duration: buckleDuration * 0.65,
        ease: "power3.out"
      }, at);

      for (let j = index + 1; j < n; j++) {
        build.to(rows[j].el, {
          y: livePositions[j] + foldDrop,
          duration: buckleDuration,
          ease: "power4.out"
        }, at);
      }
    }

    if (first) build.set(cap, { autoAlpha: 1 }, at);

    build.to(cap, {
      y: capStartY + foldDrop,
      duration: buckleDuration,
      ease: "power4.out"
    }, at);

    if (V.showMascot) {
      clawd.pose(build, at, {
        eyes: "closed", arms: "down", legs: "stand"
      });
      eyePose(build, at, "impact");
      build.to(pal, {
        x: palCenterX + kick * 0.2,
        y: capStartY + foldDrop - clawd.height,
        rotation: 0,
        scaleX: 1.24,
        scaleY: first ? 0.64 : 0.72,
        duration: buckleDuration,
        ease: "power4.out"
      }, at);
    }

    if (first) {
      dustBurst(
        build, at, W / 2, previousTop,
        28, Math.min(0.32, D - at), inner * 0.4, 0, cell
      );
      impactRays(
        build, at, W / 2, previousTop,
        clawd.width * 1.2, Math.min(0.18, D - at)
      );
    }

    if (index >= 0) {
      const row = rows[index];
      const narrowW = Math.round(
        capW * 0.87 + ((index % 3) - 1) * (compact ? 8 : 10)
      );

      /*
       * Accelerate through the final squeeze with the complete label
       * still on the slab. No rotated, blank intermediate plank exists.
       */
      build.to(row.el, {
        x: side,
        y: nextPositions[index] - (oldHeight - sliver),
        scaleX: narrowW / inner,
        scaleY: sliver / oldHeight,
        rotation: 0,
        skewX: 0,
        duration: pressDuration,
        ease: "power4.in"
      }, pressAt);

      for (let j = index + 1; j < n; j++) {
        build.to(rows[j].el, {
          y: nextPositions[j],
          duration: pressDuration,
          ease: "power4.in"
        }, pressAt);
      }

      /*
       * These sets preserve the exact silhouette of the transform
       * above, exchanging it for a real, level sliver in one frame.
       */
      build.set(row.content, { autoAlpha: 0 }, snapEnd);
      build.set(row.fold, { opacity: 0 }, snapEnd);
      build.set(row.el, {
        x: (W - narrowW) / 2,
        y: nextPositions[index],
        width: narrowW,
        height: sliver,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        skewX: 0,
        borderRadius: 2,
        backgroundColor: row.color,
        "--hc-edge": "1px"
      }, snapEnd);
    }

    build.to(cap, {
      y: capEndY,
      height: thisCapH,
      scaleX: last ? 1.12 : 1,
      scaleY: last ? capSquash : 1,
      duration: pressDuration,
      ease: "power4.in"
    }, pressAt);

    if (V.showMascot) {
      build.to(pal, {
        x: palCenterX,
        y: palEndY + (last ? capH * (1 - capSquash) : 0),
        rotation: 0,
        scaleX: last ? 1.24 : 1.16,
        scaleY: last ? 0.72 : 0.82,
        duration: pressDuration,
        ease: "power4.in"
      }, pressAt);
    }

    if (!last && reboundRoom > 0) {
      const up = reboundRoom * 0.4;
      const down = reboundRoom - up;
      const pileHop = Math.min(compact ? 6 : 9, sliver * 1.2);
      const characterHop = Math.min(
        compact ? 30 : 38,
        cell * (1.35 + k * 0.12)
      );

      for (let j = Math.max(0, index); j < n; j++) {
        build.to(rows[j].el, {
          y: nextPositions[j] - pileHop,
          duration: up,
          ease: "power4.out"
        }, snapEnd);
        build.to(rows[j].el, {
          y: nextPositions[j],
          duration: down,
          ease: "power3.in"
        }, snapEnd + up);
      }

      build.to(cap, {
        y: capEndY - pileHop,
        duration: up,
        ease: "power4.out"
      }, snapEnd);
      build.to(cap, {
        y: capEndY,
        duration: down,
        ease: "power3.in"
      }, snapEnd + up);

      if (V.showMascot) {
        clawd.pose(build, snapEnd, {
          eyes: "closed", arms: "up", legs: "stand"
        });
        eyePose(build, snapEnd, "wide");
        build.to(pal, {
          x: palCenterX,
          y: palEndY - characterHop,
          rotation: k % 2 ? -5 : 5,
          scaleX: 0.94,
          scaleY: 1.18,
          duration: up,
          ease: "power4.out"
        }, snapEnd);
        eyePose(build, snapEnd + up, "down");
        build.to(pal, {
          x: palCenterX,
          y: palEndY,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          duration: down,
          ease: "power3.in"
        }, snapEnd + up);
      }

      build.fromTo(hub, {
        scaleX: 1.7, scaleY: 1.7
      }, {
        scaleX: 1, scaleY: 1,
        duration: Math.min(0.1, reboundRoom),
        ease: "power3.out",
        immediateRender: false
      }, snapEnd);

      dustBurst(
        build, snapEnd, W / 2, capEndY,
        first ? 10 : 12,
        Math.min(0.26, D - snapEnd),
        inner * 0.52, 0, cell * 0.5
      );
    }

    if (last) {
      const finalFloorW = capW + (compact ? 76 : 110);
      build.to(floor, {
        x: (W - finalFloorW) / 2,
        y: finalBase + M.floorGap,
        width: finalFloorW,
        height: compact ? 5 : 7,
        backgroundColor: V.finalBlockColor,
        duration: pressDuration,
        ease: "power4.in"
      }, pressAt);
    }

    heights = nextHeights;
    rowGaps = nextGaps;
    livePositions = nextPositions.slice();
    currentTop = nextTop;
    finalTop = nextTop;
    finalPalY = palEndY;
  });

  build.set(before, { autoAlpha: 0 }, D);
  build.set([trailLayer, rewindArc], { autoAlpha: 0 }, D);
  build.set(minuteHand, { rotation: minuteEnd }, D);
  build.set(hourHand, { rotation: hourEnd }, D);

  build.timeScale(1 / T.scale);
  tl.add(build, 0);

  const key = T.key;
  const hold = Math.max(0, T.hold);
  const snap = Math.min(0.08, hold * 0.25);
  const headlineSettle = Math.min(0.18, Math.max(0, hold - snap));
  const reaction = Math.min(0.36, hold);
  const launch = reaction * 0.27;
  const fall = reaction * 0.36;
  const plant = reaction - launch - fall;
  const colorFlash = Math.min(2 / CA.fps, snap);
  const supportAt = key + snap;

  /*
   * All impact channels start on the exact key frame:
   * oversized wording, bright block, clock recoil, pile kick and debris.
   */
  tl.set(after, {
    autoAlpha: 1,
    y: 12,
    rotation: 0,
    scaleX: headlinePeakX,
    scaleY: headlinePeakY,
    color: V.ink
  }, key);
  tl.set(after, { color: V.accent }, key + colorFlash);

  tl.to(after, {
    y: -10,
    scaleX: 0.955,
    scaleY: 0.88,
    duration: snap,
    ease: "power4.out"
  }, key);
  tl.to(after, {
    y: 0,
    scaleX: 1,
    scaleY: 1,
    duration: headlineSettle,
    ease: "back.out(2.8)"
  }, key + snap);

  tl.set(header, { autoAlpha: 1 }, supportAt);
  tl.set([caption, underline], { autoAlpha: 1 }, supportAt);
  tl.fromTo(caption, { y: 14 }, {
    y: 0,
    duration: Math.min(0.14, Math.max(0, hold - snap)),
    ease: "power4.out",
    immediateRender: false
  }, supportAt);
  tl.fromTo(underline, { scaleX: 0 }, {
    scaleX: 1,
    duration: Math.min(0.12, Math.max(0, hold - snap)),
    ease: "power4.out",
    immediateRender: false
  }, supportAt);

  tl.set(assembly, { y: compact ? 11 : 16 }, key);
  tl.to(assembly, {
    y: compact ? -5 : -7,
    duration: launch,
    ease: "power4.out"
  }, key);
  tl.to(assembly, {
    y: 0,
    duration: fall + plant,
    ease: "power3.out"
  }, key + launch);

  tl.set(clock, {
    x: 0,
    y: compact ? 10 : 16,
    scaleX: M.clockKick,
    scaleY: M.clockKick
  }, key);
  tl.to(clock, {
    x: compact ? -4 : -6,
    y: compact ? -5 : -7,
    scaleX: 0.985,
    scaleY: 0.985,
    duration: launch,
    ease: "power4.out"
  }, key);
  tl.to(clock, {
    x: 0,
    y: 0,
    scaleX: 1,
    scaleY: 1,
    duration: fall + plant,
    ease: "back.out(1.6)"
  }, key + launch);

  /*
   * The main block stays bright terracotta through the hold.
   * Its broad face is taller and wider than the exposed paper layers.
   */
  tl.set(cap, {
    backgroundColor: V.finalBlockColor,
    borderTopColor: V.pixelColor
  }, key);
  tl.to(cap, {
    scaleX: 0.98,
    scaleY: 1.07,
    duration: launch,
    ease: "power4.out"
  }, key);
  tl.to(cap, {
    scaleX: 1.07,
    scaleY: 0.88,
    duration: fall,
    ease: "power3.in"
  }, key + launch);
  tl.to(cap, {
    scaleX: 1,
    scaleY: 1,
    duration: plant,
    ease: "power3.out"
  }, key + launch + fall);

  tl.fromTo(strike, {
    scaleX: 1.015,
    scaleY: 1.015,
    opacity: 0.95
  }, {
    scaleX: 1.16,
    scaleY: 1.16,
    opacity: 0,
    duration: Math.min(0.26, hold),
    ease: "power4.out",
    immediateRender: false
  }, key);
  tl.fromTo(hub, {
    scaleX: 2.25, scaleY: 2.25
  }, {
    scaleX: 1, scaleY: 1,
    duration: reaction,
    ease: "power4.out",
    immediateRender: false
  }, key);

  tl.to(orbit, {
    rotation: orbitCrushEnd - 74,
    duration: hold,
    ease: "sine.inOut"
  }, key);
  tl.fromTo(shine, {
    x: -capW * 0.12
  }, {
    x: capW * 1.05,
    duration: hold,
    ease: "sine.inOut",
    immediateRender: false
  }, key);
  tl.fromTo($("hc-glow"), { opacity: 1 }, {
    opacity: 0.88,
    duration: hold,
    ease: "sine.inOut",
    immediateRender: false
  }, key);

  if (V.showMascot) {
    clawd.pose(tl, key, {
      eyes: "closed", arms: "up", legs: "stand"
    });
    eyePose(tl, key, "closed");
    tl.set([gulp, throat, sweat], { autoAlpha: 0 }, key);
    tl.set(smile, { autoAlpha: 1 }, key);
    tl.set(pal, {
      x: palCenterX,
      y: finalPalY + capH * (1 - capSquash),
      rotation: 0,
      scaleX: heroScale * 1.18,
      scaleY: heroScale * 0.72
    }, key);

    const finalHop = Math.min(compact ? 28 : 32, cell * 1.4);
    tl.to(pal, {
      y: finalPalY - finalHop,
      scaleX: heroScale * 0.94,
      scaleY: heroScale * 1.1,
      duration: launch,
      ease: "power4.out"
    }, key);

    eyePose(tl, key + launch, "proud");
    tl.to(pal, {
      y: finalPalY + capH * 0.12,
      scaleX: heroScale * 1.1,
      scaleY: heroScale * 0.8,
      duration: fall,
      ease: "power4.in"
    }, key + launch);

    eyePose(tl, key + launch + fall, "closed");
    tl.to(pal, {
      x: palCenterX,
      y: finalPalY,
      rotation: 0,
      scaleX: heroScale,
      scaleY: heroScale,
      duration: plant,
      ease: "power3.out"
    }, key + launch + fall);
    eyePose(tl, key + reaction, "proud");

    let hopIndex = 0;
    for (let at = 0.66; at + 0.3 <= hold; at += 0.64) {
      const hopAt = key + at;
      const hop = cell * (hopIndex % 2 ? 0.6 : 0.82);
      const up = 0.1;
      const down = 0.12;
      const settle = 0.08;

      clawd.pose(tl, hopAt, {
        eyes: "closed", arms: "up", legs: "stand"
      });
      eyePose(tl, hopAt, "proud");
      tl.to(pal, {
        y: finalPalY - hop,
        rotation: hopIndex % 2 ? -3 : 3,
        scaleX: heroScale * 0.97,
        scaleY: heroScale * 1.05,
        duration: up,
        ease: "power4.out"
      }, hopAt);
      tl.to(pal, {
        y: finalPalY,
        rotation: 0,
        scaleX: heroScale * 1.06,
        scaleY: heroScale * 0.9,
        duration: down,
        ease: "power3.in"
      }, hopAt + up);

      eyePose(tl, hopAt + up + down, "closed");
      tl.to(pal, {
        y: finalPalY,
        rotation: 0,
        scaleX: heroScale,
        scaleY: heroScale,
        duration: settle,
        ease: "power3.out"
      }, hopAt + up + down);
      eyePose(tl, hopAt + up + down + settle, "proud");
      hopIndex += 1;
    }

    if (hold > 1.88) {
      eyePose(tl, key + hold - 0.18, "closed");
      eyePose(tl, key + hold - 0.1, "proud");
    }
  }

  const dustY = finalTop - capH * capSquash;

  dustBurst(
    tl, key, W / 2, dustY,
    40, Math.min(0.5, hold), capW * 2, 0, capW * 0.2
  );
  impactRays(
    tl, key, W / 2, dustY,
    capW * 1.12, Math.min(0.22, hold)
  );
  dustBurst(
    tl, key, (W - capW) / 2, dustY,
    10, hold, inner * 0.64, -1, cell
  );
  dustBurst(
    tl, key, (W + capW) / 2, dustY,
    10, hold, inner * 0.64, 1, cell
  );

  if (hold > 0.6) {
    [0.34, 0.68].forEach((fraction) => {
      const driftAt = hold * fraction;
      const driftLife = hold - driftAt;
      dustBurst(
        tl, key + driftAt,
        (W - capW) / 2, finalTop - capH * 0.65,
        5, driftLife, inner * 0.5, -1
      );
      dustBurst(
        tl, key + driftAt,
        (W + capW) / 2, finalTop - capH * 0.65,
        5, driftLife, inner * 0.5, 1
      );
    });
  }

  const open = "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)";
  const shut = "polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)";

  if (variant === "overlay") {
    tl.fromTo(stageEl, { clipPath: shut }, {
      clipPath: open,
      duration: 0.16,
      ease: "power4.out"
    }, 0);
  }

  if (T.exit > 0) {
    const exitDuration = Math.max(0, T.exit - 1 / CA.fps);
    tl.to(stageEl, {
      clipPath: shut,
      duration: exitDuration,
      ease: "power3.in"
    }, key + hold);
    tl.set(stageEl, { clipPath: shut }, key + hold + exitDuration);
  }

  window.__timelines["block"] = tl;
});