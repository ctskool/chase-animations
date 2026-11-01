CA.ready(() => {
  const {
    vars: V, stage: S, safe, time: T, variant,
    make, fit, rgba, seeded, grainUrl,
  } = CA;

  const $ = (id) => document.getElementById(id);
  const stageEl = $("stage");
  const W = S.w;
  const H = S.h;
  const full = variant === "full";
  const minText = full ? 40 : 32;
  const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
  const integer = (value, fallback, lo, hi) => {
    const n = Number(value);
    return clamp(
      Number.isFinite(n) ? Math.round(n) : fallback,
      lo,
      hi,
    );
  };

  const days = integer(V.calendarDays, 30, 1, 31);
  const finalDay = integer(V.finalDay, 30, 1, days);
  const startingDay = integer(V.startingDay, 1, 1, finalDay);
  const seed = integer(V.seed, 11, 1, 9999);
  const random = seeded(seed);
  const weekdayKeys = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  const offset = Math.max(0, weekdayKeys.indexOf(V.firstWeekday));
  const rowCount = Math.ceil((offset + days) / 7);
  const side = Math.max(full ? 48 : 28, safe.side);
  const cardW = W - side * 2;

  const topSafe = full
    ? Math.max(230, safe.top)
    : clamp(safe.top, 16, variant === "overlay" ? 20 : 24);
  const bottomSafe = full
    ? Math.max(300, safe.bottom)
    : clamp(safe.bottom, 16, variant === "overlay" ? 20 : 24);
  const availableH = H - topSafe - bottomSafe;

  Object.entries({
    "--red": V.red,
    "--ink": V.ink,
    "--label-color": V.labelColor,
    "--date-color": V.dateColor,
    "--background-top": V.backgroundTop,
    "--background-bottom": V.backgroundBottom,
    "--paper": V.paperColor,
    "--cell": V.cellColor,
  }).forEach(([name, value]) => {
    stageEl.style.setProperty(name, value);
  });

  $("grain").style.backgroundImage = grainUrl(180, 0.55, seed);
  $("grain").style.opacity = clamp(Number(V.grainOpacity) || 0, 0, 0.12);

  const layouts = {
    full: {
      label: 44, hero: 384, labelGap: 20, calendarGap: 26,
      pad: 28, month: 76, monthGap: 8, weekday: 44,
      gridGap: 10, cellGap: 10, date: 60, dateLeft: 12, dateTop: 7,
      pegW: 24, pegH: 44, pegRise: 18,
      radius: 28, cellRadius: 12, counterGap: 36,
      minimumCell: 108,
    },
    top: {
      label: 36, hero: 284, labelGap: 14, calendarGap: 20,
      pad: 16, month: 48, monthGap: 6, weekday: 34,
      gridGap: 8, cellGap: 8, date: 44, dateLeft: 9, dateTop: 4,
      pegW: 18, pegH: 32, pegRise: 14,
      radius: 22, cellRadius: 10, counterGap: 28,
      minimumCell: 76,
    },
    overlay: {
      label: 36, hero: 272, labelGap: 14, calendarGap: 20,
      pad: 16, month: 48, monthGap: 6, weekday: 34,
      gridGap: 8, cellGap: 8, date: 44, dateLeft: 9, dateTop: 4,
      pegW: 18, pegH: 32, pegRise: 14,
      radius: 26, cellRadius: 10, counterGap: 28,
      minimumCell: 76,
    },
  };
  const L = { ...(layouts[variant] || layouts.full) };

  if (!full && H < 820) {
    Object.assign(L, {
      label: 32, hero: 180, labelGap: 10, calendarGap: 14,
      pad: 14, month: 44, monthGap: 5, weekday: 32,
      gridGap: 7, cellGap: 6, date: 36, dateLeft: 8, dateTop: 4,
      minimumCell: 66, counterGap: 24,
      pegW: 16, pegH: 28, pegRise: 12,
    });
  }

  stageEl.style.setProperty("--calendar-radius", L.radius + "px");
  stageEl.style.setProperty("--cell-radius", L.cellRadius + "px");
  stageEl.style.setProperty("--counter-gap", L.counterGap + "px");

  const label = $("challenge-label");
  const labelRow = $("label-row");
  const labelText = String(V.label ?? "");

  label.textContent = labelText;
  label.style.fontSize = L.label + "px";
  labelRow.style.left = side + "px";
  labelRow.style.width = cardW + "px";

  let labelH = 0;

  if (labelText.trim()) {
    const labelRoom = Math.max(1, cardW - 100);
    fit(label, labelRoom, minText);

    if (label.scrollWidth > labelRoom + 1) {
      const words = labelText.trim().split(/\s+/);
      label.textContent = words.length > 2
        ? words.slice(0, -2).join(" ") + " " +
          words.slice(-2).join("\u00a0")
        : words.join("\u00a0");
      label.style.whiteSpace = "normal";
      label.style.width = labelRoom + "px";
      label.style.textWrap = "balance";
    }

    labelH = Math.ceil(label.offsetHeight);
  } else {
    labelRow.style.display = "none";
    labelRow.style.visibility = "hidden";
    L.labelGap = 0;
  }

  const month = $("month");
  month.textContent = String(V.month ?? "");
  month.style.fontSize = L.month + "px";
  month.style.left = L.pad + "px";
  month.style.top = L.pad + "px";
  fit(month, cardW - L.pad * 2, minText);

  const monthH = Math.max(
    month.offsetHeight,
    Math.ceil(parseFloat(month.style.fontSize) * 1.12),
  );
  const weekH = Math.ceil(L.weekday * 1.2);
  const weekY = L.pad + monthH + L.monthGap;
  const gridY = weekY + weekH + L.gridGap;
  const fixedCardH = gridY + L.pad;
  const minimumCardH =
    fixedCardH +
    rowCount * L.minimumCell +
    (rowCount - 1) * L.cellGap;

  const counterHeightFactor = 1.14;
  let heroPx = Math.min(
    L.hero,
    Math.max(
      minText,
      (
        availableH - labelH - L.labelGap -
        L.calendarGap - minimumCardH
      ) / counterHeightFactor,
    ),
  );

  const counter = $("counter");
  const word = $("day-word");
  const number = $("day-number");

  word.textContent = String(V.headingWord ?? "");

  function measureCounter(px) {
    word.style.fontSize = px + "px";
    number.style.fontSize = px + "px";

    let maximum = 0;
    let finalWidth = 0;

    for (let day = 1; day <= finalDay; day += 1) {
      number.textContent = String(day);
      const width = number.offsetWidth;
      maximum = Math.max(maximum, width);
      if (day === finalDay) finalWidth = width;
    }

    return {
      word: word.offsetWidth,
      number: maximum,
      final: finalWidth,
    };
  }

  // This reserve includes the marker and the larger pose at the key frame.
  const headingRoom = cardW - (full ? 80 : 88);
  let widths = measureCounter(heroPx);

  if (widths.word + L.counterGap + widths.number > headingRoom) {
    heroPx = Math.max(
      minText,
      Math.floor(
        heroPx * (headingRoom - L.counterGap) /
        (widths.word + widths.number),
      ),
    );
    widths = measureCounter(heroPx);
  }

  while (
    widths.word + L.counterGap + widths.number > headingRoom &&
    heroPx > minText
  ) {
    heroPx = Math.max(minText, heroPx - 1);
    widths = measureCounter(heroPx);
  }

  number.textContent = String(startingDay);

  const counterH = Math.ceil(heroPx * counterHeightFactor);
  const remainingCardH =
    availableH - labelH - L.labelGap - counterH - L.calendarGap;
  const innerW = cardW - L.pad * 2;
  const cellW = (innerW - L.cellGap * 6) / 7;
  const cellH = Math.max(
    1,
    (
      remainingCardH - fixedCardH -
      (rowCount - 1) * L.cellGap
    ) / rowCount,
  );
  const gridH = rowCount * cellH + (rowCount - 1) * L.cellGap;
  const cardH = fixedCardH + gridH;
  const counterY = topSafe + labelH + L.labelGap;
  const calendarY = counterY + counterH + L.calendarGap;

  labelRow.style.top = topSafe + "px";
  labelRow.style.height = labelH + "px";
  counter.style.top = counterY + "px";
  counter.style.height = counterH + "px";

  const calendar = $("calendar");
  Object.assign(calendar.style, {
    left: side + "px",
    top: calendarY + "px",
    width: cardW + "px",
    height: cardH + "px",
  });

  const paper = $("calendar-paper");
  paper.style.boxShadow =
    `0 ${full ? 20 : 12}px ${full ? 46 : 30}px ${rgba(V.ink, 0.1)}, ` +
    `0 3px 8px ${rgba(V.ink, 0.035)}`;

  ["peg-left", "peg-right"].forEach((id, i) => {
    Object.assign($(id).style, {
      left: cardW * (i ? 0.74 : 0.26) - L.pegW / 2 + "px",
      top: -L.pegRise + "px",
      width: L.pegW + "px",
      height: L.pegH + "px",
    });
  });

  Object.assign($("weekdays").style, {
    left: L.pad + "px",
    top: weekY + "px",
    width: innerW + "px",
    height: weekH + "px",
  });

  Object.assign($("grid").style, {
    left: L.pad + "px",
    top: gridY + "px",
    width: innerW + "px",
    height: gridH + "px",
  });

  for (let i = 0; i < 7; i += 1) {
    const weekday = make(
      "span", "weekday", $("weekdays"),
      String(V[`weekday${i + 1}`] ?? ""),
    );
    weekday.style.fontSize = L.weekday + "px";
    fit(weekday, cellW, minText);
    weekday.style.left = i * (cellW + L.cellGap) + "px";
    weekday.style.top = "0px";
    weekday.style.width = cellW + "px";
  }

  const ns = "http://www.w3.org/2000/svg";

  function svgElement(tag, attrs, parent) {
    const el = document.createElementNS(ns, tag);
    Object.entries(attrs).forEach(([name, value]) => {
      el.setAttribute(name, String(value));
    });
    parent.appendChild(el);
    return el;
  }

  function looseOval(cx, cy, rx, ry) {
    return (
      `M ${cx + rx * 0.72} ${cy - ry * 0.72} ` +
      `C ${cx + rx * 1.08} ${cy - ry * 0.23}, ` +
      `${cx + rx * 0.97} ${cy + ry * 0.7}, ` +
      `${cx + rx * 0.2} ${cy + ry * 0.99} ` +
      `C ${cx - rx * 0.55} ${cy + ry * 1.13}, ` +
      `${cx - rx * 1.07} ${cy + ry * 0.5}, ` +
      `${cx - rx * 0.98} ${cy - ry * 0.15} ` +
      `C ${cx - rx * 0.93} ${cy - ry * 0.87}, ` +
      `${cx - rx * 0.1} ${cy - ry * 1.1}, ` +
      `${cx + rx * 0.61} ${cy - ry * 0.81} ` +
      `C ${cx + rx * 0.78} ${cy - ry * 0.74}, ` +
      `${cx + rx * 0.85} ${cy - ry * 0.61}, ` +
      `${cx + rx * 0.88} ${cy - ry * 0.49}`
    );
  }

  const markerWidth = clamp(Number(V.markerWidth) || 7, 4, 12);
  const checkWidth = markerWidth * (full ? 1.2 : 1);
  const jitter = (amount) => (random() - 0.5) * amount;
  const cells = [];

  for (let day = 1; day <= days; day += 1) {
    const index = offset + day - 1;
    const x = (index % 7) * (cellW + L.cellGap);
    const y = Math.floor(index / 7) * (cellH + L.cellGap);
    const cell = make("div", "date-cell", $("grid"));

    Object.assign(cell.style, {
      left: x + "px",
      top: y + "px",
      width: cellW + "px",
      height: cellH + "px",
    });

    const wash = make("div", "cell-wash", cell);
    const date = make("span", "date", cell, String(day));

    Object.assign(date.style, {
      left: L.dateLeft + "px",
      top: L.dateTop + "px",
      fontSize: L.date + "px",
    });

    const svg = svgElement("svg", {
      class: "marker-svg",
      viewBox: `0 0 ${cellW} ${cellH}`,
      "aria-hidden": "true",
    }, cell);

    const dateRight = L.dateLeft + date.offsetWidth;
    const dateBottom = L.dateTop + L.date;
    const bottomY = cellH - checkWidth * 0.7 - 5;
    const startY = Math.min(
      bottomY - 10,
      Math.max(dateBottom + 6, cellH * 0.66),
    );
    const valleyX = cellW * 0.39;
    const endX = cellW - checkWidth * 0.75 - 7;
    const endY = Math.max(checkWidth * 0.75 + 5, cellH * 0.28);
    const clearX = Math.min(
      endX - 5,
      Math.max(cellW * 0.58, dateRight + checkWidth * 0.65 + 5),
    );
    const bendY = Math.min(bottomY - 5, dateBottom + 3);

    const check = svgElement("path", {
      class: "check-stroke",
      pathLength: 100,
      "stroke-width": checkWidth,
      d:
        `M ${cellW * 0.16} ${startY + jitter(0.8)} ` +
        `C ${cellW * 0.24} ${startY + 4}, ` +
        `${valleyX - 5} ${bottomY - 2}, ` +
        `${valleyX} ${bottomY} ` +
        `C ${valleyX + 8} ${bottomY - 3}, ` +
        `${clearX - 3} ${bendY + 8}, ` +
        `${clearX} ${bendY} ` +
        `C ${clearX + (endX - clearX) * 0.35} ` +
        `${bendY - (bendY - endY) * 0.42}, ` +
        `${endX - 4} ${endY + 4}, ` +
        `${endX} ${endY + jitter(0.8)}`,
    }, svg);

    if (day <= startingDay) {
      gsap.set(check, { visibility: "visible", strokeDashoffset: 0 });
      gsap.set(wash, { opacity: 0.085 });
    }

    cells.push({ cell, wash, date, svg, check, x, y });
  }

  const focus = $("date-focus");
  const first = cells[startingDay - 1];
  const last = cells[finalDay - 1];

  Object.assign(focus.style, {
    width: cellW + "px",
    height: cellH + "px",
    borderWidth: (full ? 4 : 3) + "px",
  });

  gsap.set(focus, { x: first.x, y: first.y, autoAlpha: 1 });
  gsap.set(first.wash, { opacity: 0.15 });
  gsap.set(first.date, { color: V.ink });

  const heroSvg = $("counter-marker");
  heroSvg.setAttribute("viewBox", `0 0 ${W} ${counterH}`);

  const heroCircleD = looseOval(
    W / 2 + (widths.word + L.counterGap) / 2,
    heroPx * 0.53,
    widths.final / 2 + heroPx * 0.085,
    heroPx * 0.49,
  );
  const heroStroke = checkWidth * 1.4;

  const heroCircle = svgElement("path", {
    class: "counter-circle",
    d: heroCircleD,
    pathLength: 100,
    "stroke-width": heroStroke,
  }, heroSvg);

  const heroTracer = svgElement("path", {
    class: "circle-tracer",
    d: heroCircleD,
    pathLength: 100,
    "stroke-width": heroStroke * 2,
  }, heroSvg);

  const D = T.design;
  const increments = finalDay - startingDay;
  const events = [];

  for (let step = 1; step <= increments; step += 1) {
    let fraction;

    if (increments <= 6) {
      fraction = increments === 1
        ? 0.955
        : 0.16 + 0.795 * (step - 1) / (increments - 1);
    } else if (step <= 3) {
      fraction = [0.105, 0.205, 0.29][step - 1];
    } else if (step > increments - 3) {
      fraction = [0.79, 0.87, 0.955][step - (increments - 3) - 1];
    } else {
      const middleCount = increments - 6;
      const p = (step - 3) / (middleCount + 1);
      const accelerated = 0.5 + Math.asin(2 * p - 1) / Math.PI;
      fraction = 0.33 + 0.4 * accelerated;
    }

    events.push({
      day: startingDay + step,
      at: D * fraction,
    });
  }

  const tl = gsap.timeline({ paused: true });
  const build = gsap.timeline();
  const finalAt = events.length ? events[events.length - 1].at : D * 0.955;
  const finalRun = D - finalAt;
  const keyScale = 1.09;
  const heldScale = 1.025;

  // Keep the final stamp inside its surrounding cell gutters.
  const stampScale = Math.min(
    1.055,
    1 + L.cellGap * 0.7 / Math.max(cellW, cellH),
  );

  build.set(number, { textContent: String(startingDay) }, 0);

  build.fromTo(counter,
    { y: heroPx * 0.035, scaleX: 0.94, scaleY: 0.94 },
    {
      y: 0,
      scaleX: 1,
      scaleY: 1,
      duration: D * 0.075,
      ease: "power3.out",
    }, 0);

  build.fromTo(calendar,
    { scaleX: 0.985, scaleY: 0.985 },
    {
      scaleX: 1,
      scaleY: 1,
      duration: D * 0.075,
      ease: "power3.out",
    }, 0);

  function counterBeat(at, run, final) {
    if (final) {
      // The largest pose lands at the key, rather than settling before it.
      build.set(counter, {
        y: 0,
        scaleX: 1.025,
        scaleY: 1.025,
      }, at);

      build.to(counter, {
        y: 0,
        scaleX: keyScale,
        scaleY: keyScale,
        duration: run,
        ease: "power2.in",
      }, at);

      return;
    }

    const fast = run < 0.075;
    const punch = fast ? 1.014 : 1.035;

    build.set(counter, {
      y: -heroPx * (fast ? 0 : 0.006),
      scaleX: punch,
      scaleY: punch,
    }, at);

    build.to(counter, {
      y: 0,
      scaleX: 1,
      scaleY: 1,
      duration: run,
      ease: "power3.out",
    }, at);
  }

  function finalStamp(at, run) {
    build.set(focus, { autoAlpha: 0 }, at);
    build.set(last.wash, { opacity: 1 }, at);
    build.set(last.date, { color: V.paperColor }, at);
    build.set(last.svg, { color: V.paperColor }, at);
    build.set(last.cell, { scaleX: 1, scaleY: 1 }, at);

    build.to(last.cell, {
      scaleX: stampScale,
      scaleY: stampScale,
      duration: run,
      ease: "power2.in",
    }, at);
  }

  events.forEach((event, index) => {
    const final = event.day === finalDay;
    const nextAt = events[index + 1] ? events[index + 1].at : D;
    const run = final
      ? D - event.at
      : Math.min(0.2, (nextAt - event.at) * 0.75);
    const item = cells[event.day - 1];
    const previous = cells[event.day - 2];

    build.set(number, { textContent: String(event.day) }, event.at);
    counterBeat(event.at, run, final);

    build.set(previous.date, { color: V.dateColor }, event.at);
    build.set(previous.wash, { opacity: 0.085 }, event.at);

    if (final) {
      finalStamp(event.at, run);
    } else {
      build.set(item.date, { color: V.ink }, event.at);
      build.set(focus, {
        x: item.x,
        y: item.y,
        scaleX: 1.045,
        scaleY: 1.045,
      }, event.at);

      build.to(focus, {
        scaleX: 1,
        scaleY: 1,
        duration: run,
        ease: "power3.out",
      }, event.at);

      build.fromTo(item.wash,
        { opacity: 0.26 },
        {
          opacity: 0.15,
          duration: run,
          ease: "power3.out",
          immediateRender: false,
        }, event.at);
    }

    build.set(item.check, { visibility: "visible" }, event.at);
    build.fromTo(item.check,
      { strokeDashoffset: 100 },
      {
        strokeDashoffset: 0,
        duration: final ? run * 0.7 : run,
        ease: "power2.out",
        immediateRender: false,
      }, event.at);
  });

  if (!events.length) {
    counterBeat(finalAt, finalRun, true);
    finalStamp(finalAt, finalRun);
  }

  build.fromTo(calendar,
    { scaleX: 0.996, scaleY: 0.996 },
    {
      scaleX: 1.016,
      scaleY: 1.016,
      duration: finalRun * 0.3,
      ease: "power3.out",
      immediateRender: false,
    }, finalAt);

  build.to(calendar, {
    scaleX: 1,
    scaleY: 1,
    duration: finalRun * 0.7,
    ease: "power3.out",
  }, finalAt + finalRun * 0.3);

  const circleAt = finalAt + finalRun * 0.05;
  build.set(heroCircle, { visibility: "visible" }, circleAt);
  build.fromTo(heroCircle,
    { strokeDashoffset: 100 },
    {
      strokeDashoffset: 0,
      duration: D - circleAt,
      ease: "power2.out",
      immediateRender: false,
    }, circleAt);

  build.set(number, { textContent: String(finalDay) }, D);
  build.set(counter, { y: 0, scaleX: keyScale, scaleY: keyScale }, D);
  build.set(calendar, { scaleX: 1, scaleY: 1 }, D);
  build.set(focus, { autoAlpha: 0 }, D);
  build.set(last.cell, {
    scaleX: stampScale,
    scaleY: stampScale,
  }, D);
  build.set(last.wash, { opacity: 1 }, D);
  build.set(last.date, { color: V.paperColor }, D);
  build.set(last.svg, { color: V.paperColor }, D);
  build.set(last.check, {
    visibility: "visible",
    strokeDashoffset: 0,
  }, D);
  build.set(heroCircle, {
    visibility: "visible",
    strokeDashoffset: 0,
  }, D);

  build.timeScale(1 / T.scale);
  tl.add(build, 0);

  tl.fromTo($("grain"),
    { x: -4, y: 3 },
    {
      x: 10,
      y: -7,
      duration: T.key + T.hold,
      ease: "sine.inOut",
    }, 0);

  if (T.hold > 0) {
    const K = T.key;
    const kick = Math.min(0.075, T.hold * 0.15);
    const settle = Math.min(0.22, T.hold * 0.35);

    tl.fromTo(counter,
      { y: 0, scaleX: keyScale, scaleY: keyScale },
      {
        y: 0,
        scaleX: heldScale,
        scaleY: heldScale,
        duration: Math.min(0.24, T.hold * 0.35),
        ease: "power3.out",
        immediateRender: false,
      }, K);

    tl.fromTo(paper,
      { scaleX: 1, scaleY: 1 },
      {
        scaleX: 1.009,
        scaleY: 1.014,
        duration: kick,
        ease: "power3.out",
        immediateRender: false,
      }, K);

    tl.to(paper, {
      scaleX: 1,
      scaleY: 1,
      duration: settle,
      ease: "power3.out",
    }, K + kick);

    // A broad moving nib makes the hold legible at phone size.
    // Its width changes the silhouette of the completed oval.
    tl.set(heroTracer, { visibility: "visible" }, K);
    tl.fromTo(heroTracer,
      { strokeDashoffset: 0 },
      {
        strokeDashoffset: -100,
        duration: T.hold,
        ease: "none",
        immediateRender: false,
      }, K);
  }

  const closed = "inset(50% 0% 50% 0%)";
  const open = "inset(0% 0% 0% 0%)";

  if (variant === "overlay") {
    tl.fromTo(stageEl,
      { clipPath: closed },
      {
        clipPath: open,
        duration: Math.min(0.24, T.key * 0.15),
        ease: "power3.out",
      }, 0);
  }

  if (T.exit > 0) {
    tl.to(stageEl, {
      clipPath: closed,
      duration: Math.max(0, T.exit - 1 / CA.fps),
      ease: "power3.in",
    }, T.key + T.hold);
  }

  window.__timelines["block"] = tl;
});