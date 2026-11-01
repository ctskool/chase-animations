CA.ready(() => {
  const {
    vars: V, stage: S, safe, time: T, variant,
    fit, parseStat, formatStat, rgba
  } = CA;

  const $ = (id) => document.getElementById(id);
  const stageEl = $("stage");
  const W = S.w;
  const H = S.h;
  const full = variant === "full";
  const minimum = full ? 40 : 32;
  const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

  function setAttrs(el, attrs) {
    Object.entries(attrs).forEach(([key, value]) => {
      el.setAttribute(key, String(value));
    });
  }

  function place(el, x, y, w, h) {
    el.style.left = x + "px";
    el.style.top = y + "px";
    if (w !== undefined) el.style.width = w + "px";
    if (h !== undefined) el.style.height = h + "px";
  }

  Object.entries({
    "--ms-ground": V.ground,
    "--ms-ink": V.ink,
    "--ms-muted": V.muted,
    "--ms-source": V.sourceColor,
    "--ms-accent": V.accent
  }).forEach(([key, value]) => stageEl.style.setProperty(key, value));

  const layouts = {
    full: {
      top: Math.max(230, safe.top),
      bottom: Math.max(300, safe.bottom),
      side: Math.max(64, safe.side),
      header: 48, headerGap: 24, data: 40,
      label: 58, labelGap: 12,
      hero: 300, heroFloor: 200, heroGap: 16,
      delta: 48, deltaH: 72, deltaGap: 30,
      callDate: 40, callTitle: 52, callImpact: 40, callGap: 8,
      plotGap: 24, ticks: 40, tickBand: 60,
      axis: 164, sourceGap: 16, minimumPlot: 460
    },
    top: {
      top: Math.max(28, safe.top),
      bottom: Math.max(28, safe.bottom),
      side: Math.max(42, safe.side),
      header: 40, headerGap: 14, data: 32,
      label: 44, labelGap: 10,
      hero: 218, heroFloor: 168, heroGap: 12,
      delta: 38, deltaH: 58, deltaGap: 18,
      callDate: 32, callTitle: 40, callImpact: 34, callGap: 6,
      plotGap: 18, ticks: 32, tickBand: 48,
      axis: 146, sourceGap: 12, minimumPlot: 220
    },
    overlay: {
      top: Math.max(30, safe.top),
      bottom: Math.max(30, safe.bottom),
      side: Math.max(44, safe.side),
      header: 40, headerGap: 12, data: 32,
      label: 44, labelGap: 10,
      hero: 216, heroFloor: 168, heroGap: 12,
      delta: 38, deltaH: 58, deltaGap: 18,
      callDate: 32, callTitle: 40, callImpact: 34, callGap: 6,
      plotGap: 18, ticks: 32, tickBand: 48,
      axis: 146, sourceGap: 12, minimumPlot: 220
    }
  };

  const M = { ...(layouts[variant] || layouts.full) };
  const left = M.side;
  const room = W - left * 2;
  const dates = Array.from(
    { length: 8 }, (_, i) => String(V["month" + (i + 1)])
  );
  const values = Array.from({ length: 8 }, (_, i) => {
    const value = Number(V["value" + (i + 1)]);
    return Number.isFinite(value) ? value : 0;
  });

  const final = parseStat(V.finalNumber);
  if (!final || !Number.isFinite(final.value)) {
    throw new Error("money-stat: finalNumber must contain a numeric value.");
  }
  if (final.decimals > 8) {
    throw new Error("money-stat: use at most eight decimal places.");
  }
  values[7] = final.value;

  const normalize = (text) => String(text).trim().toLowerCase();
  const eventIndex = dates.findIndex(
    (date) => normalize(date) === normalize(V.eventMonth)
  );
  if (eventIndex < 0) {
    throw new Error("money-stat: eventMonth must match one of month1 to month8.");
  }

  function shortDate(text) {
    const parts = String(text).trim().split(/\s+/);
    return (
      parts[0].slice(0, 3) +
      (parts.length > 1 ? " " + parts.slice(1).join(" ") : "")
    ).toUpperCase();
  }

  function monthTick(text) {
    return String(text).trim().split(/\s+/)[0].slice(0, 3).toUpperCase();
  }

  const divisor = Math.max(0.000001, Number(V.axisDivisor) || 1000);
  function compactValue(value) {
    const rounded = Math.round(value / divisor * 100) / 100;
    return String(Object.is(rounded, -0) ? 0 : rounded) + V.axisUnit;
  }

  const numericStat = { ...final, prefix: "", suffix: "" };
  const exactMatch = String(V.finalNumber).trim()
    .match(/^([^\d.-]*)(-?[\d,]*\.?\d+)(.*)$/);
  const exactDigits = exactMatch
    ? exactMatch[2]
    : formatStat(numericStat, final.value);

  [
    ["ms-company", V.company],
    ["ms-period", V.periodLine],
    ["ms-kicker", V.headerLine],
    ["ms-metric", V.metricLabel],
    ["ms-prefix", final.prefix],
    ["ms-suffix", final.suffix],
    ["ms-digits", exactDigits],
    ["ms-delta", V.delta],
    ["ms-comparison", V.deltaComparison],
    ["ms-event-date", String(V.eventMonth).toUpperCase()],
    ["ms-event-title", V.eventTitle],
    ["ms-event-impact", V.eventImpact],
    ["ms-source", V.sourceLine],
    ["ms-price", final.prefix + compactValue(final.value) + final.suffix],
    ["ms-date", shortDate(dates[0])]
  ].forEach(([id, text]) => { $(id).textContent = text; });

  // Keep reporting metadata without adding competing opening lines.
  const header = $("ms-header");
  header.title = [V.headerLine, V.periodLine].filter(Boolean).join(" · ");
  place(header, left, M.top, room, M.header);
  header.style.fontSize = M.data + "px";
  fit($("ms-company"), room, minimum);

  const metric = $("ms-metric");
  const metricY = M.top + M.header + M.headerGap;
  metric.style.fontSize = M.label + "px";
  place(metric, left, metricY);
  fit(metric, room, minimum);
  const heroY = metricY +
    Math.ceil(metric.getBoundingClientRect().height) + M.labelGap;

  const date = $("ms-date");
  date.style.fontSize = M.data + "px";
  let dateWidth = 0;
  dates.forEach((text) => {
    date.textContent = shortDate(text);
    dateWidth = Math.max(dateWidth, date.getBoundingClientRect().width);
  });
  dateWidth = Math.ceil(dateWidth);
  date.textContent = shortDate(dates[0]);

  const hero = $("ms-hero");
  const digits = $("ms-digits");
  const punch = 1.075;
  let heroPx = M.hero;

  function measureHero() {
    hero.style.fontSize = heroPx + "px";
    digits.style.width = "auto";
    let widest = 0;
    values.map((value) => formatStat(numericStat, value))
      .concat(exactDigits)
      .forEach((text) => {
        digits.textContent = text;
        widest = Math.max(widest, digits.getBoundingClientRect().width);
      });
    digits.style.width = Math.ceil(widest + 2) + "px";
    digits.textContent = exactDigits;
    return hero.getBoundingClientRect().width;
  }

  while (measureHero() > room / punch && heroPx > minimum) heroPx -= 2;
  measureHero();

  function positionHero() {
    // Leave enough room on both sides for the single final scale punch.
    place(hero, left + (room - hero.offsetWidth) / 2, heroY);
  }
  positionHero();

  const chip = $("ms-chip");
  const comparison = $("ms-comparison");
  const deltaGroup = $("ms-delta-group");
  chip.style.fontSize = M.delta + "px";
  comparison.style.fontSize = M.data + "px";

  const triangle = $("ms-triangle");
  triangle.style.width = (full ? 27 : 23) + "px";
  triangle.style.height = (full ? 27 : 23) + "px";
  if (V.deltaDirection === "down") {
    triangle.style.transform = "rotate(180deg)";
  }

  fit(
    comparison,
    Math.max(minimum * 3, room - dateWidth - chip.offsetWidth - 56),
    minimum
  );
  const deltaH = Math.max(
    M.deltaH,
    Math.ceil(deltaGroup.offsetHeight * 1.12)
  );

  const source = $("ms-source");
  source.style.fontSize = minimum + "px";
  place(source, left, 0, room);
  const sourceH = Math.ceil(source.getBoundingClientRect().height);
  const sourceY = H - M.bottom - sourceH;
  place(source, left, sourceY, room);

  const callout = $("ms-callout");
  callout.style.gap = M.callGap + "px";
  place(callout, left, 0, room);

  [
    ["ms-event-date", M.callDate],
    ["ms-event-title", M.callTitle],
    ["ms-event-impact", M.callImpact]
  ].forEach(([id, size]) => {
    const el = $(id);
    el.style.fontSize = size + "px";
    fit(el, room, minimum);
    el.parentElement.style.height =
      Math.ceil(el.getBoundingClientRect().height) + 4 + "px";
  });

  const calloutH = callout.offsetHeight;
  const plotBottom = sourceY - M.sourceGap - M.tickBand;

  function layoutBands() {
    const deltaY = heroY + Math.ceil(heroPx * 1.05) + M.heroGap;
    const calloutY = deltaY + deltaH + M.deltaGap;
    place($("ms-delta-row"), left, deltaY, room, deltaH);
    place(
      date,
      left + room - dateWidth,
      deltaY + Math.max(0, (deltaGroup.offsetHeight - M.data * 1.2) / 2),
      dateWidth
    );
    place(callout, left, calloutY, room);
    return {
      calloutY,
      plotY: calloutY + calloutH + M.plotGap
    };
  }

  let bands = layoutBands();
  const shortage = Math.max(0, M.minimumPlot - (plotBottom - bands.plotY));
  if (shortage > 0) {
    heroPx -= Math.min(
      Math.ceil(shortage / 1.05),
      Math.max(0, heroPx - M.heroFloor)
    );
    measureHero();
    positionHero();
    bands = layoutBands();
  }

  const plot = {
    x: left,
    y: bands.plotY,
    right: W - left - M.axis,
    bottom: plotBottom
  };
  plot.w = plot.right - plot.x;
  plot.h = plot.bottom - plot.y;

  if (plot.h < 120 || plot.w < 280) {
    throw new Error(
      "money-stat: this stage is too short for the chart and readable callout."
    );
  }

  const rawMin = Math.min(0, ...values);
  const rawMax = Math.max(0, ...values);
  const span = Math.max(1, rawMax - rawMin);
  const roughStep = span / 4;
  const exponent = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const fraction = roughStep / exponent;
  const multiple = [1, 2, 2.5, 5, 10].find((n) => n >= fraction) || 10;
  const step = exponent * multiple;
  const low = Math.floor(rawMin / step) * step;
  const high = Math.max(low + step, Math.ceil(rawMax / step) * step);

  const futureW = full ? 30 : 24;
  const lastX = plot.right - futureW;
  const px = (index) => plot.x + (lastX - plot.x) * index / 7;
  const py = (value) =>
    plot.bottom - (value - low) / (high - low) * plot.h;

  const points = values.map((value, index) => ({
    x: px(index), y: py(value)
  }));
  const eventPoint = points[eventIndex];
  const endPoint = points[7];

  const svg = $("ms-chart");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  const NS = "http://www.w3.org/2000/svg";

  function svgMake(tag, parent, attrs, text) {
    const el = document.createElementNS(NS, tag);
    setAttrs(el, attrs);
    if (text !== undefined) el.textContent = text;
    parent.appendChild(el);
    return el;
  }

  const priceTag = $("ms-price-tag");
  priceTag.style.fontSize = minimum + "px";
  fit($("ms-price"), M.axis - 32, minimum);
  place(priceTag, plot.right + 8, endPoint.y - priceTag.offsetHeight / 2);
  const priceHeight = priceTag.offsetHeight;

  const tickCount = Math.round((high - low) / step);
  const tickStride = Math.max(
    1,
    Math.ceil(minimum * 1.55 / (plot.h / tickCount))
  );

  for (let index = 0; index <= tickCount; index++) {
    const value = low + index * step;
    const tickY = py(value);
    svgMake("path", $("ms-grid"), {
      d: `M${plot.x} ${tickY}H${plot.right}`,
      stroke: rgba(V.ink, 0.07),
      "stroke-width": 1,
      fill: "none"
    });

    if (
      index % tickStride === 0 &&
      Math.abs(tickY - endPoint.y) > priceHeight * 0.5 + minimum * 0.7
    ) {
      svgMake("text", $("ms-ticks"), {
        x: plot.right + 16,
        y: tickY,
        fill: V.muted,
        "font-family": "IBM Plex Mono",
        "font-weight": 500,
        "font-size": M.ticks,
        "dominant-baseline": "middle"
      }, compactValue(value));
    }
  }

  [0, 2, 4, 6, 7].forEach((index) => {
    svgMake("path", $("ms-grid"), {
      d: `M${px(index)} ${plot.y}V${plot.bottom}`,
      stroke: rgba(V.ink, 0.07),
      "stroke-width": 1,
      fill: "none"
    });
  });

  [0, 3, 7].forEach((index) => {
    svgMake("text", $("ms-ticks"), {
      x: px(index),
      y: plot.bottom + M.tickBand * 0.78,
      fill: V.muted,
      "font-family": "IBM Plex Mono",
      "font-weight": 500,
      "font-size": M.ticks,
      "text-anchor": index === 0 ? "start" : index === 7 ? "end" : "middle"
    }, monthTick(dates[index]));
  });

  setAttrs($("ms-future"), {
    x: lastX + 2,
    y: plot.y,
    width: futureW - 2,
    height: plot.h,
    fill: "url(#ms-hatch)"
  });
  $("ms-hatch-line").setAttribute("stroke", rgba(V.ink, 0.15));
  $("ms-hatch").setAttribute("patternTransform", "translate(0 0)");
  $("ms-fill-top").setAttribute("stop-color", V.ink);
  $("ms-fill-bottom").setAttribute("stop-color", V.ink);

  const finalStroke = full ? 9 : 8;
  setAttrs($("ms-before"), {
    stroke: V.beforeColor,
    "stroke-width": full ? 6 : 5
  });
  setAttrs($("ms-after"), {
    stroke: V.accent,
    "stroke-width": finalStroke
  });
  setAttrs($("ms-cursor"), {
    stroke: rgba(V.ink, 0.36),
    "stroke-width": 1.5
  });
  setAttrs($("ms-tip"), {
    r: full ? 7 : 6,
    fill: V.beforeColor
  });
  setAttrs($("ms-event-ring"), {
    cx: eventPoint.x,
    cy: eventPoint.y,
    r: full ? 15 : 12,
    stroke: V.accent,
    "stroke-width": 2.5
  });
  setAttrs($("ms-end-ping"), {
    cx: endPoint.x,
    cy: endPoint.y,
    r: full ? 12 : 10,
    stroke: V.accent,
    "stroke-width": 2.5
  });

  const elbowY = plot.y - M.plotGap * 0.45;
  const leaderD = `M${eventPoint.x} ${eventPoint.y - 16}` +
    `V${elbowY}H${plot.x + 24}`;
  const leaderLength = Math.abs(eventPoint.y - 16 - elbowY) +
    Math.abs(eventPoint.x - plot.x - 24);

  setAttrs($("ms-leader"), {
    d: leaderD,
    stroke: rgba(V.accent, 0.85),
    "stroke-width": 2,
    "stroke-dasharray": leaderLength,
    "stroke-dashoffset": leaderLength
  });

  function sample(progress) {
    const p = clamp(progress, 0, 7);
    const index = Math.min(6, Math.floor(p));
    const f = p - index;
    return {
      x: points[index].x + (points[index + 1].x - points[index].x) * f,
      y: points[index].y + (points[index + 1].y - points[index].y) * f,
      value: values[index] + (values[index + 1] - values[index]) * f
    };
  }

  function segment(start, finish) {
    if (finish < start) return "";
    const first = sample(start);
    let d = `M${first.x} ${first.y}`;
    for (let i = Math.floor(start) + 1; i <= Math.floor(finish); i++) {
      d += `L${points[i].x} ${points[i].y}`;
    }
    if (finish % 1 > 0.000001) {
      const last = sample(finish);
      d += `L${last.x} ${last.y}`;
    }
    return d;
  }

  function renderProgress(raw) {
    const p = clamp(raw, 0, 7);
    const head = sample(p);
    const eventReached = p >= eventIndex;
    const finalReached = p >= 7;

    $("ms-before").setAttribute("d", segment(0, Math.min(p, eventIndex)));
    $("ms-after").setAttribute(
      "d", eventReached ? segment(eventIndex, p) : ""
    );
    $("ms-after").style.visibility = eventReached ? "visible" : "hidden";
    $("ms-area").setAttribute(
      "d",
      segment(0, p) +
        `L${head.x} ${plot.bottom}L${plot.x} ${plot.bottom}Z`
    );

    setAttrs($("ms-tip"), {
      cx: head.x,
      cy: head.y,
      fill: eventReached ? V.accent : V.beforeColor,
      r: eventReached ? (full ? 9 : 8) : (full ? 7 : 6)
    });
    $("ms-cursor").setAttribute(
      "d", `M${head.x} ${plot.y}V${plot.bottom}`
    );

    let shown = head.value;
    const unit = Math.pow(10, -(final.decimals || 0));
    if (
      p > 6 && !finalReached && values[6] !== final.value &&
      Math.abs(final.value - shown) < unit * 0.5
    ) {
      shown = final.value - Math.sign(final.value - values[6]) * unit;
    }

    digits.textContent = finalReached
      ? exactDigits
      : formatStat(numericStat, shown);
    date.textContent = shortDate(dates[finalReached ? 7 : Math.floor(p)]);
  }

  const tl = gsap.timeline({ paused: true });
  const build = gsap.timeline();
  const driver = $("ms-driver");
  const D = T.design;
  const eventAt = eventIndex === 0
    ? 0
    : eventIndex === 7 ? D : D * 0.47;
  const eventDwell = eventIndex > 0 && eventIndex < 7
    ? Math.min(0.12, D * 0.025)
    : 0;

  renderProgress(0);
  gsap.set(driver, { x: 0 });

  function progressModifier(value) {
    const p = parseFloat(value);
    renderProgress(p);
    return p + "px";
  }

  function drive(from, to, at, duration, ease) {
    if (to <= from || duration <= 0) return;
    build.fromTo(driver, { x: from }, {
      x: to,
      duration,
      ease,
      immediateRender: false,
      modifiers: { x: progressModifier }
    }, at);
  }

  function heroPulse(timeline, at, duration, scale) {
    timeline.fromTo(hero, {
      scaleX: scale,
      scaleY: scale
    }, {
      scaleX: 1,
      scaleY: 1,
      duration,
      ease: "power3.out",
      immediateRender: false
    }, at);
  }

  // One continuous approach, one event, one accelerating rise and landing.
  // There are no monthly stops or repeated number punches.
  drive(0, eventIndex, 0, eventAt, "power1.out");

  if (eventIndex < 7) {
    const riseAt = eventAt + eventDwell;
    const riseEnd = riseAt + (D - riseAt) * 0.64;
    const pivot = eventIndex + (7 - eventIndex) * 0.65;
    drive(eventIndex, pivot, riseAt, riseEnd - riseAt, "power2.in");
    drive(pivot, 7, riseEnd, D - riseEnd, "power2.out");
  }

  function eventReaction(timeline, at, unit) {
    const ring = $("ms-event-ring");
    timeline.set([ring, $("ms-leader")], {
      visibility: "visible"
    }, at);

    timeline.fromTo(ring, {
      attr: { r: full ? 5 : 4 }
    }, {
      attr: { r: full ? 29 : 24 },
      duration: 0.08 * unit,
      ease: "power3.out",
      immediateRender: false
    }, at);
    timeline.to(ring, {
      attr: { r: full ? 15 : 12 },
      duration: 0.2 * unit,
      ease: "power3.out"
    }, at + 0.08 * unit);

    timeline.to($("ms-leader"), {
      attr: { "stroke-dashoffset": 0 },
      duration: 0.18 * unit,
      ease: "power3.out"
    }, at);

    ["ms-event-date", "ms-event-title", "ms-event-impact"]
      .forEach((id, index) => {
        const el = $(id);
        const snapAt = at + index * 0.045 * unit;
        timeline.set(el, { visibility: "visible" }, snapAt);
        timeline.fromTo(el, { y: 14 }, {
          y: 0,
          duration: 0.16 * unit,
          ease: "power4.out",
          immediateRender: false
        }, snapAt);
      });
  }

  if (eventIndex < 7) {
    eventReaction(build, eventAt, 1);
    heroPulse(build, eventAt, 0.24, 1.025);
  }

  build.timeScale(1 / T.scale);
  tl.add(build, 0);

  const K = T.key;
  const hold = Math.max(0, T.hold);
  const reactionScale = Math.min(1, Math.max(0.01, hold / 0.6));

  // Modifiers keep the counter, tip, fill and date synchronized during
  // event-suppressed motion-blur seeks as well as ordinary playback.
  tl.set(driver, {
    x: 7,
    modifiers: { x: progressModifier }
  }, K);

  tl.set([chip, comparison, priceTag], {
    visibility: "visible"
  }, K);
  tl.set($("ms-prefix"), { color: V.accent }, K);

  if (eventIndex === 7) {
    if (hold > 0) {
      eventReaction(tl, K, reactionScale);
    } else {
      tl.set([
        $("ms-event-date"), $("ms-event-title"), $("ms-event-impact"),
        $("ms-event-ring"), $("ms-leader")
      ], { visibility: "visible" }, K);
      tl.set($("ms-leader"), {
        attr: { "stroke-dashoffset": 0 }
      }, K);
    }
  }

  if (hold > 0) {
    // The only large punch: exact result, badge, line and tag arrive together.
    heroPulse(tl, K, 0.32 * reactionScale, punch);

    tl.fromTo(chip, {
      scaleX: 1.12,
      scaleY: 1.12
    }, {
      scaleX: 1,
      scaleY: 1,
      duration: 0.28 * reactionScale,
      ease: "back.out(1.2)",
      immediateRender: false
    }, K);

    tl.fromTo(priceTag, { x: 18 }, {
      x: 0,
      duration: 0.2 * reactionScale,
      ease: "power4.out",
      immediateRender: false
    }, K);

    tl.fromTo($("ms-after"), {
      attr: { "stroke-width": full ? 17 : 14 }
    }, {
      attr: { "stroke-width": finalStroke },
      duration: 0.3 * reactionScale,
      ease: "power3.out",
      immediateRender: false
    }, K);

    // A single expanding endpoint ring continues into the short hold.
    // It never resets into a second arrival.
    const ping = $("ms-end-ping");
    const attackDuration = Math.min(hold, 0.42 * reactionScale);
    tl.set(ping, { visibility: "visible", opacity: 0.95 }, K);
    tl.fromTo(ping, {
      attr: { r: full ? 8 : 7 }
    }, {
      attr: { r: full ? 48 : 40 },
      opacity: 0.24,
      duration: attackDuration,
      ease: "power3.out",
      immediateRender: false
    }, K);

    const remaining = Math.max(0, hold - attackDuration);
    if (remaining > 0) {
      tl.to(ping, {
        attr: { r: full ? 65 : 54 },
        opacity: 0.06,
        duration: remaining,
        ease: "sine.out"
      }, K + attackDuration);
    }

    tl.fromTo($("ms-cursor"), {
      attr: { "stroke-dashoffset": 0 }
    }, {
      attr: { "stroke-dashoffset": -28 },
      duration: hold,
      ease: "none",
      immediateRender: false
    }, K);

    tl.fromTo($("ms-hatch"), {
      attr: { patternTransform: "translate(0 0)" }
    }, {
      attr: { patternTransform: "translate(10 0)" },
      duration: hold,
      ease: "none",
      immediateRender: false
    }, K);
  }

  const closed = "inset(50% 0 50% 0)";
  const open = "inset(0% 0 0% 0)";

  if (variant === "overlay") {
    tl.fromTo(stageEl, { clipPath: closed }, {
      clipPath: open,
      duration: Math.min(0.22, K * 0.2),
      ease: "power4.out"
    }, 0);
  }

  if (T.exit > 0) {
    tl.fromTo(stageEl, { clipPath: open }, {
      clipPath: closed,
      duration: Math.max(0, T.exit - 1 / CA.fps),
      ease: "power3.in",
      immediateRender: false
    }, K + hold);
  }

  window.__timelines["block"] = tl;
});