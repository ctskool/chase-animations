CA.ready(() => {
  const {
    vars: V, stage: S, safe, time: T, variant,
    make, fit, rgba, parseStat, formatStat, grainUrl, seeded
  } = CA;

  const KIT = CA.claude;
  const $ = (id) => document.getElementById(id);
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const mix = (a, b, u) => a + (b - a) * u;
  const liftEase = (p) => p * p * (3 - 2 * p);
  const stageEl = $("stage");
  const W = S.w;
  const H = S.h;
  const D = T.design;
  const compact = variant !== "full";
  const minText = compact ? 32 : 40;
  const hasPal = Boolean(V.showMascot);

  const layouts = {
    full: {
      side: 40, top: 230, bottom: 300,
      header: 70, headerPx: 56, bullet: 36, logo: 60,
      headerGap: 10,
      row: 112, finalRow: 144, minRow: 86,
      code: 54, line: 44, lineW: 92, signW: 54, rowPad: 16,
      cell: 36, railTop: 12, railBottom: 8,
      number: 450, zero: 112, minCounter: 270,
      label: 44, plus: 54, summary: 66,
      summaryTick: 54, summaryGap: 16,
      gap: 10, pad: 22
    },
    top: {
      side: 26, top: 18, bottom: 18,
      header: 56, headerPx: 46, bullet: 32, logo: 48,
      headerGap: 8,
      row: 76, finalRow: 84, minRow: 50,
      code: 48, line: 36, lineW: 80, signW: 46, rowPad: 12,
      cell: 20, railTop: 8, railBottom: 6,
      number: 390, zero: 82, minCounter: 174,
      label: 32, plus: 40, summary: 50,
      summaryTick: 40, summaryGap: 12,
      gap: 7, pad: 16
    },
    overlay: {
      side: 26, top: 22, bottom: 22,
      header: 58, headerPx: 48, bullet: 32, logo: 50,
      headerGap: 8,
      row: 76, finalRow: 86, minRow: 50,
      code: 48, line: 36, lineW: 80, signW: 48, rowPad: 12,
      cell: 21, railTop: 8, railBottom: 6,
      number: 390, zero: 84, minCounter: 174,
      label: 34, plus: 40, summary: 50,
      summaryTick: 40, summaryGap: 12,
      gap: 7, pad: 16
    }
  };

  const M = { ...(layouts[variant] || layouts.full) };

  if (compact && H < 840) {
    Object.assign(M, {
      top: 16, bottom: 16,
      header: 46, headerPx: 40, headerGap: 6,
      row: 60, finalRow: 72, minRow: 46,
      code: 42, line: 32, lineW: 74, signW: 42,
      cell: variant === "overlay" ? 17 : 16,
      railTop: 6, railBottom: 5,
      number: 320, zero: 72, minCounter: 150,
      label: 32, plus: 34, summary: 42,
      summaryTick: 34, summaryGap: 10,
      gap: 6, pad: 12
    });
  }

  if (compact && H < 700) {
    Object.assign(M, {
      top: 14, bottom: 14,
      header: 42, headerPx: 36, headerGap: 6,
      row: 48, finalRow: 56, minRow: 42,
      code: 36, cell: 12,
      railTop: 5, railBottom: 4,
      number: 270, zero: 64, minCounter: 134,
      label: 32, plus: 32, summary: 38,
      summaryTick: 32, summaryGap: 8,
      gap: 4, pad: 10
    });
  }

  const left = compact
    ? M.side
    : Math.max(M.side, Number(safe.side) || 0);
  const inner = W - left * 2;
  const top = compact
    ? M.top
    : Math.max(M.top, Number(safe.top) || 0) + 6;

  /*
   * Extend the stack into the unused lower frame. The added room
   * belongs to the composition rather than shrinking the counter.
   */
  const bottom = H - (
    compact
      ? Math.max(8, M.bottom - 12)
      : Math.max(
        96,
        Math.max(M.bottom, Number(safe.bottom) || 0) - 140
      )
  );
  const usableH = bottom - top;
  const panelY = top + M.header + M.headerGap;
  const C = M.cell;

  const removedData = [1, 2, 3, 4, 5]
    .map((i) => ({
      text: String(V[`removed${i}`] || ""),
      word: String(V[`removed${i}Word`] || "")
    }))
    .filter((r) => r.text.trim());

  const addedData = [1, 2]
    .map((i) => ({
      text: String(V[`added${i}`] || ""),
      word: String(V[`added${i}Word`] || "")
    }))
    .filter((r) => r.text.trim());

  const tl = gsap.timeline({ paused: true });
  const build = gsap.timeline();

  stageEl.style.background = V.ground;
  $("ground").style.background = V.ground;
  $("glow").style.background =
    `radial-gradient(90% 78% at 54% 77%, ${rgba(V.removedColor, 0.14)}, transparent 76%)`;
  $("grain").style.backgroundImage = grainUrl(220, 0.45, 41);

  const header = $("header");
  header.style.cssText +=
    `;left:${left}px;top:${top}px;width:${inner}px;height:${M.header}px`;

  const bulletBox = $("tool-bullet");
  bulletBox.style.width = bulletBox.style.height = M.bullet + "px";
  bulletBox.style.marginRight = Math.round(M.bullet * 0.4) + "px";
  const bullet = KIT.glyph(bulletBox, "bullet", M.bullet, V.addedColor);

  const call = $("tool-call");
  call.textContent = String(V.tool || "") + (V.file ? `(${V.file})` : "");
  call.style.fontSize = M.headerPx + "px";
  call.style.color = V.ink;

  let logo = null;
  if (V.showLogo) {
    logo = KIT.logo($("brand"), M.logo, V.accent);
  } else {
    $("brand").style.display = "none";
  }

  fit(
    call,
    inner - M.bullet * 1.4 - (V.showLogo ? M.logo + 20 : 0),
    minText
  );

  const pal = $("pal");
  const body = make("div", "pal-body", pal);
  const clawd = KIT.mascot(body, C, { color: V.accent });
  clawd.el.style.position = "absolute";
  clawd.el.style.left = "0";
  clawd.el.style.top = "0";
  clawd.el.style.zIndex = "1";

  pal.style.width = clawd.width + "px";
  pal.style.height = clawd.height + "px";
  if (!hasPal) pal.style.display = "none";

  /*
   * Keep the existing stepped belly and the kit's original limbs.
   * Whole-body compression is reserved for short impact poses.
   */
  const bellyPoses = [9, 11, 13, 15].map((widthCells) => {
    const pose = make("div", "pal-belly", body);
    const bands = [
      { y: 3, h: 1, w: widthCells - 4 },
      { y: 4, h: 1, w: widthCells },
      { y: 5, h: 1, w: widthCells - 2 },
      { y: 6, h: 0.5, w: widthCells - 4 }
    ];

    bands.forEach((band) => {
      const strip = make("div", "belly-step", pose);
      strip.style.cssText +=
        `;left:${(11 - band.w) * C / 2}px;top:${band.y * C}px;width:${band.w * C}px;height:${band.h * C}px;background:${V.accent}`;
    });

    const seam = make("div", "belly-seam", pose);
    seam.style.cssText +=
      `;left:${C * 4.5}px;top:${C * 5.72}px;width:${C * 2}px;height:${Math.max(2, C * 0.12)}px;background:${rgba(V.ground, 0.32)}`;

    gsap.set(pose, { autoAlpha: 0 });
    return pose;
  });

  const facePatch = make("div", "pal-face-patch", body);
  facePatch.style.cssText +=
    `;left:${C * 3.75}px;top:${C * 3.05}px;width:${C * 3.5}px;height:${C * 2.15}px;background:${V.accent}`;

  const mouth = make("div", "chew-mouth", body);
  mouth.style.cssText +=
    `;left:${C * 4}px;top:${C * 3.25}px;width:${C * 3}px;height:${C * 1.7}px;background:${V.ground}`;

  const teeth = [
    make("div", "mouth-tooth mouth-tooth-left", mouth),
    make("div", "mouth-tooth mouth-tooth-right", mouth)
  ];
  teeth.forEach((tooth) => {
    tooth.style.background = V.ink;
  });

  const relief = make("div", "relief-mouth", body);
  relief.style.cssText +=
    `;left:${C * 4.5}px;top:${C * 3.85}px;width:${C * 2}px;height:${C * 0.75}px;background:${V.ground}`;

  const gulp = make("div", "pal-gulp", body);
  gulp.style.cssText +=
    `;left:${C * 4.75}px;top:${C * 4.7}px;width:${C * 1.5}px;height:${C * 0.45}px;background:${rgba(V.ground, 0.28)}`;

  gsap.set(body, {
    x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1
  });
  gsap.set([relief, gulp], { autoAlpha: 0 });
  gsap.set(teeth, { autoAlpha: 1 });
  gsap.set(mouth, {
    autoAlpha: 1, scaleX: 0.9, scaleY: 0.62
  });

  const hero = $("hero");
  const heroImpact = $("hero-impact");
  const numberWrap = $("number-wrap");
  const removedCount = $("removed-count");

  hero.style.cssText +=
    `;left:${left}px;width:${inner}px;background:${V.counterGround}`;
  $("hero-edge").style.background = V.removedWordColor;
  heroImpact.style.background = V.removedColor;

  const trace = $("hero-trace");
  const traceW = Math.round(inner * 0.22);
  trace.style.width = traceW + "px";
  trace.style.background = V.removedColor;
  gsap.set(trace, { x: 12, autoAlpha: 0 });

  const removedLabel = $("removed-label");
  const hasLabel = Boolean(String(V.removedLabel || "").trim());
  removedLabel.textContent = V.removedLabel || "";
  removedLabel.style.fontSize = M.label + "px";
  removedLabel.style.color = V.muted;
  fit(removedLabel, inner - M.pad * 2, minText);
  gsap.set(removedLabel, { xPercent: -50 });
  if (!hasLabel) removedLabel.style.display = "none";

  const plusLine = $("plus-line");
  const addedCount = $("added-count");
  const hasPlus = Boolean(
    String(V.addedStat || "").trim() || String(V.addedLabel || "").trim()
  );

  plusLine.style.fontSize = M.plus + "px";
  addedCount.style.color = V.addedColor;
  $("added-label").textContent = V.addedLabel || "";
  $("added-label").style.color = V.muted;

  /*
   * formatStat may omit a positive sign. Enforce it explicitly at
   * setup, every intermediate tick and the exact final value.
   */
  function statAt(exact, u, forcePlus) {
    const raw = String(exact == null ? "" : exact).trim();
    if (!raw) return forcePlus ? "" : "0";

    const stat = parseStat(raw);
    let result;

    if (u >= 1) {
      result = raw;
    } else if (stat && Number.isFinite(Number(stat.value))) {
      const decimals = Math.max(0, Number(stat.decimals) || 0);
      const scaled = Number(stat.value) * clamp(u, 0, 1);
      const value = decimals
        ? Number(scaled.toFixed(decimals))
        : Math.round(scaled);

      result = String(formatStat(stat, value));

      if (value === 0) {
        result = result.replace(/^\s*[-−]\s*/, "");
      } else if (
        Number(stat.value) < 0 &&
        !/^\s*[-−]/.test(result)
      ) {
        result = "-" + result;
      }
    } else {
      result = u > 0 ? raw : "0";
    }

    // The zero-width space stops GSAP reading "+38" as the number 38.
    return forcePlus
      ? "​+" + String(result).replace(/^\s*[+\-−]\s*/, "")
      : String(result);
  }

  addedCount.textContent = statAt(V.addedStat, 1, true);
  fit(plusLine, inner - M.pad * 2, minText);
  gsap.set(plusLine, { xPercent: -50 });
  if (!hasPlus) plusLine.style.display = "none";

  const summary = $("summary");
  const summaryHolder = $("summary-holder");
  const hasSummary = Boolean(String(V.summary || "").trim());

  summary.textContent = V.summary || "";
  summary.style.fontSize = M.summary + "px";
  summary.style.color = V.ink;
  summaryHolder.style.left = M.pad + "px";
  summaryHolder.style.width = inner - M.pad * 2 + "px";
  summaryHolder.style.gap = M.summaryGap + "px";

  const summaryMark = make("div", "summary-mark", summaryHolder);
  summaryHolder.insertBefore(summaryMark, summary);
  summaryMark.style.width = summaryMark.style.height = M.summaryTick + "px";
  KIT.glyph(summaryMark, "tick", M.summaryTick, V.addedColor);

  fit(
    summary,
    inner - M.pad * 2 - M.summaryTick - M.summaryGap - 8,
    minText
  );

  const summaryH = hasSummary
    ? Math.max(Math.ceil(summary.offsetHeight), M.summaryTick)
    : 0;
  const labelH = hasLabel ? Math.ceil(removedLabel.offsetHeight) : 0;
  const plusH = hasPlus ? Math.ceil(plusLine.offsetHeight) : 0;

  gsap.set(summaryHolder, { autoAlpha: 0, height: 0 });
  if (!hasSummary) summaryHolder.style.display = "none";

  removedCount.textContent = statAt(V.removedStat, 1, false);
  removedCount.style.fontSize = M.number + "px";
  removedCount.style.color = V.removedWordColor;

  /*
   * Reserve horizontal room for the final physical overshoot.
   * Every value uses this one text element and one baseline.
   */
  fit(
    removedCount,
    (inner - M.pad * 2) / 1.14,
    compact ? 72 : 120
  );
  const maxNumberFont = parseFloat(removedCount.style.fontSize) || M.number;

  removedCount.textContent = statAt(V.removedStat, 0, false);
  addedCount.textContent = statAt(V.addedStat, 0, true);

  const rail = hasPal
    ? clawd.height + M.railTop + M.railBottom
    : M.gap;
  const earlyCount = Math.max(0, removedData.length - 3);
  const finalRedCount = removedData.length - earlyCount;
  const finalRatio = M.finalRow / M.row;
  const feastRatio = 1.18;
  const weightedRows = Math.max(
    1,
    removedData.length,
    addedData.length + finalRedCount,
    addedData.length * finalRatio + finalRedCount * feastRatio
  );

  function counterChrome(showSummary) {
    const items = 1 + Number(hasLabel) + Number(hasPlus) +
      Number(showSummary);
    return M.pad * 2 + labelH + plusH +
      (showSummary ? summaryH : 0) +
      Math.max(0, items - 1) * M.gap;
  }

  /*
   * Choose the counter size once, before budgeting the rows.
   * Neither the feast nor a belly change can take its space.
   */
  const workChrome = counterChrome(false);
  const finalChrome = counterChrome(hasSummary);
  const rowRoundRoom = addedData.length + finalRedCount;
  const panelRoom = bottom - panelY;
  const minimumWorkRows = weightedRows * M.minRow + rowRoundRoom;
  const minimumFinalRows =
    addedData.length * Math.round(M.minRow * finalRatio);
  const counterFont = Math.max(
    1,
    Math.min(
      maxNumberFont,
      (panelRoom - rail - minimumWorkRows - workChrome) / (0.94 * 1.12),
      (panelRoom - rail - minimumFinalRows - finalChrome) / (0.94 * 1.23)
    )
  );
  const reservedNumberH = Math.ceil(counterFont * 0.94 * 1.12);
  removedCount.style.fontSize = counterFont + "px";

  const rowBudget =
    usableH - M.header - M.headerGap - rail -
    workChrome - reservedNumberH - rowRoundRoom;
  const rowH = Math.max(
    M.minRow,
    Math.min(M.row, Math.floor(rowBudget / weightedRows))
  );
  const finalRowH = Math.max(rowH, Math.round(rowH * finalRatio));
  const feastRowH = Math.max(rowH, Math.round(rowH * feastRatio));

  const diff = $("diff");
  diff.style.cssText +=
    `;left:${left}px;top:${panelY}px;width:${inner}px`;
  diff.style.setProperty("--gutter-stroke", compact ? "5px" : "6px");
  $("diff-frame").style.background = V.panelGround;
  $("diff-frame").style.borderColor = rgba(V.muted, 0.24);

  function startLine(value) {
    const n = Number(value);
    return Math.max(0, Math.round(Number.isFinite(n) ? n : 0));
  }

  const redStart = startLine(V.removedStartLine);
  const greenStart = startLine(V.addedStartLine);
  const lineDigits = Math.max(
    3,
    String(redStart + Math.max(0, removedData.length - 1)).length,
    String(greenStart + Math.max(0, addedData.length - 1)).length
  );
  const lineW = Math.max(
    M.lineW,
    Math.ceil(lineDigits * M.line * 0.61) + 10
  );
  const codeRoom = inner - M.rowPad * 2 - lineW - M.signW - 10;

  function addCode(parent, text, word) {
    const code = make("span", "code", parent);
    const index = word ? text.indexOf(word) : -1;

    if (index < 0) {
      code.textContent = text;
    } else {
      make("span", "", code, text.slice(0, index));
      make("span", "word-highlight", code, word);
      make("span", "", code, text.slice(index + word.length));
    }
    return code;
  }

  function createRow(data, index, added) {
    const row = make(
      "div",
      "diff-row " + (added ? "row-added" : "row-removed"),
      $(added ? "added-rows" : "removed-rows")
    );
    row.style.height = rowH + "px";

    const fold = make("div", "row-fold", row);
    const shell = make("div", "row-shell", fold);
    shell.style.background = added ? V.addedBackground : V.removedBackground;

    const reading = make("div", "row-reading", fold);
    reading.style.padding = `0 ${M.rowPad}px`;
    reading.style.color = V.ink;

    const line = make(
      "span",
      "line-number",
      reading,
      String((added ? greenStart : redStart) + index)
    );
    line.style.width = lineW + "px";
    line.style.fontSize = M.line + "px";
    line.style.color = rgba(V.ink, 0.88);

    const sign = make("div", "gutter-mark", reading);
    sign.style.width = M.signW + "px";
    sign.style.color = V.ink;

    const code = addCode(reading, data.text, data.word);
    code.style.fontSize = M.code + "px";
    fit(code, codeRoom, minText);
    const codePx = parseFloat(code.style.fontSize) || M.code;

    const highlight = code.querySelector(".word-highlight");
    if (highlight) {
      highlight.style.background = added
        ? V.addedWordColor
        : V.removedWordColor;
    }

    let finalCodePx = codePx;
    if (added) {
      code.style.fontSize = codePx * 1.1 + "px";
      fit(code, codeRoom, minText);
      finalCodePx = parseFloat(code.style.fontSize) || codePx;
      code.style.fontSize = codePx + "px";
    }

    return {
      row, fold, shell, reading, line, code,
      index, added, data, codePx, finalCodePx
    };
  }

  const redRows = removedData.map((r, i) => createRow(r, i, false));
  const greenRows = addedData.map((r, i) => createRow(r, i, true));

  greenRows.forEach((r) => {
    gsap.set([r.row, r.reading], { autoAlpha: 0 });
  });

  const feastOutline = make("div", "feast-outline", diff);
  feastOutline.style.borderColor = V.removedColor;
  gsap.set(feastOutline, { autoAlpha: 0 });

  function layoutFor(rows, mode) {
    let total = 0;
    const entries = rows.map((r) => {
      const h = mode === "feast"
        ? (r.added ? finalRowH : feastRowH)
        : (mode === "final" ? finalRowH : rowH);
      const entry = { r, y: total, h };
      total += h;
      return entry;
    });

    const palY = panelY + total + M.railTop;
    const heroY = hasPal
      ? palY + clawd.height + M.railBottom
      : panelY + total + M.gap;
    const showSummary = mode === "final" && hasSummary;
    const fixed = counterChrome(showSummary);
    const heroH = Math.max(fixed + reservedNumberH, bottom - heroY);
    const numberH = Math.max(reservedNumberH, heroH - fixed);

    let cursor = M.pad;
    const labelTop = cursor;
    if (hasLabel) cursor += labelH + M.gap;

    const numberTop = cursor;
    cursor += numberH;

    let plusTop = cursor;
    if (hasPlus) {
      cursor += M.gap;
      plusTop = cursor;
      cursor += plusH;
    }

    const summaryTop = cursor + (showSummary ? M.gap : 0);

    return {
      entries, diffH: total, palY, heroY, heroH,
      numberH, numberTop, labelTop,
      plusTop, summaryTop,
      summaryH: showSummary ? summaryH : 0
    };
  }

  let currentLayout = layoutFor(redRows, "opening");

  function applyLayout(timeline, rows, at, duration, mode, ease) {
    const next = layoutFor(rows, mode);

    function put(target, values) {
      if (duration > 0) {
        timeline.to(target, {
          ...values,
          duration,
          ease: ease || "power3.out"
        }, at);
      } else {
        timeline.set(target, values, at);
      }
    }

    next.entries.forEach(({ r, y, h }) => {
      put(r.row, { y, height: h });
      if (r.added) {
        put(r.code, {
          fontSize: mode === "feast" || mode === "final"
            ? r.finalCodePx
            : r.codePx
        });
      }
    });

    put(diff, { height: next.diffH });
    put(hero, { top: next.heroY, height: next.heroH });
    put(removedLabel, { top: next.labelTop });
    put(numberWrap, { top: next.numberTop, height: next.numberH });
    put(plusLine, { top: next.plusTop });
    put(summaryHolder, { top: next.summaryTop, height: next.summaryH });
    if (hasPal) put(pal, { y: next.palY });

    timeline.set($("diff-frame"), {
      autoAlpha: rows.length ? 1 : 0
    }, rows.length ? at : at + duration);

    currentLayout = next;
    return next;
  }

  applyLayout(build, redRows, 0, 0, "opening");

  build.fromTo(header, { x: -16 }, {
    x: 0, duration: 0.13, ease: "power4.out"
  }, 0);
  build.fromTo(bullet, { scaleX: 1.35, scaleY: 1.35 }, {
    scaleX: 1, scaleY: 1,
    duration: 0.18, ease: "back.out(2)"
  }, 0);

  if (logo) {
    build.fromTo(logo, { rotation: -24 }, {
      rotation: 0, duration: 0.22, ease: "back.out(2)"
    }, 0);
  }

  build.to($("glow"), {
    x: -18, y: 8,
    duration: D, ease: "sine.inOut"
  }, 0);

  function setBelly(timeline, level, at) {
    timeline.set(bellyPoses, { autoAlpha: 0 }, at);
    if (level > 0) {
      timeline.set(bellyPoses[Math.min(4, level) - 1], {
        autoAlpha: 1
      }, at);
    }
  }

  /*
   * The new kit supplies the kicking legs. Give each footfall
   * a corresponding body lift and landing, rather than sliding
   * an otherwise motionless character across the rail.
   */
  function walkTo(timeline, center, at, duration, first) {
    if (!hasPal || duration <= 0) return;

    clawd.pose(timeline, at, {
      eyes: first ? "right" : "open",
      arms: first ? "up" : "right"
    });
    clawd.walk(timeline, at, at + duration, duration / 3);

    timeline.to(pal, {
      x: center - clawd.width / 2,
      duration,
      ease: "power1.inOut"
    }, at);

    const step = duration / 3;
    for (let i = 0; i < 3; i++) {
      const footAt = at + i * step;
      timeline.to(body, {
        y: -C * 0.12,
        rotation: i % 2 ? 1.5 : -1.5,
        duration: step * 0.42,
        ease: "power2.out"
      }, footAt);
      timeline.to(body, {
        y: 0, rotation: 0,
        duration: step * 0.58,
        ease: "power2.in"
      }, footAt + step * 0.42);
    }

    clawd.pose(timeline, at + duration, { legs: "stand" });
  }

  const firstCenter = W * 0.31;
  if (hasPal) {
    const startX = Math.max(
      left,
      firstCenter - clawd.width / 2 - C * 3.2
    );
    build.set(pal, { x: startX }, 0);
    clawd.pose(build, 0, {
      eyes: "right", arms: "up", legs: "left"
    });
    build.set(mouth, {
      autoAlpha: 1, scaleX: 0.9, scaleY: 0.62
    }, 0);
    build.set(teeth, { autoAlpha: 1 }, 0);
    walkTo(build, firstCenter, 0, 0.18, true);
  }

  function pointInLayout(layout, center) {
    if (!hasPal) {
      return {
        x: W * 0.5,
        y: layout.heroY + layout.numberTop + layout.numberH * 0.5
      };
    }
    return {
      x: center,
      y: layout.palY + C * (4.1 - 0.18)
    };
  }

  function anticipateMeal(hit, flight, center, index, finalMeal) {
    if (!hasPal) return;

    const start = hit - flight;
    const openAt = Math.max(0, start - (finalMeal ? 0.12 : 0.1));
    const prepAt = Math.max(0.19, openAt - (finalMeal ? 0.16 : 0.1));

    if (index > 0 || finalMeal) {
      const walkDuration = finalMeal ? 0.24 : 0.22;
      const walkAt = Math.max(0.2, prepAt - walkDuration - 0.015);
      walkTo(build, center, walkAt, walkDuration, false);
    }

    clawd.pose(build, prepAt, {
      eyes: finalMeal ? "closed" : (index % 2 ? "right" : "left"),
      arms: "down", legs: "stand"
    });
    build.set(relief, { autoAlpha: 0 }, prepAt);
    build.set(mouth, { autoAlpha: 1, x: 0 }, prepAt);
    build.set(teeth, { autoAlpha: 0 }, prepAt);

    /*
     * A visible backward brace precedes every reach.
     * The last meal gets a deeper crouch and a longer pause.
     */
    build.to(body, {
      x: -C * (finalMeal ? 0.32 : 0.18),
      y: C * (finalMeal ? 0.2 : 0.11),
      rotation: finalMeal ? -3 : -2,
      scaleX: finalMeal ? 1.09 : 1.035,
      scaleY: finalMeal ? 0.86 : 0.95,
      duration: finalMeal ? 0.12 : 0.075,
      ease: "power3.in"
    }, prepAt);
    build.to(mouth, {
      scaleX: finalMeal ? 0.65 : 0.75,
      scaleY: 0.18,
      duration: finalMeal ? 0.1 : 0.065,
      ease: "power2.in"
    }, prepAt);

    clawd.pose(build, openAt, {
      eyes: "open", arms: "up", legs: "stand"
    });
    build.set(teeth, { autoAlpha: 1 }, openAt);
    build.to(body, {
      x: 0, y: -C * 0.18, rotation: 0,
      scaleX: 1, scaleY: 1,
      duration: 0.085,
      ease: "power4.out"
    }, openAt);
    build.to(mouth, {
      scaleX: finalMeal ? 1.48 : 1.08,
      scaleY: finalMeal ? 1.42 : 1.08,
      duration: 0.075,
      ease: "power4.out"
    }, openAt);
  }

  const particleLayer = $("particles");

  /*
   * The early bites retain recognizable pieces of the authored
   * row, including its gutter, glyphs and word highlight.
   */
  function paintRow(r, height) {
    const source = document.createElement("canvas");
    const density = 2;
    source.width = Math.ceil(inner * density);
    source.height = Math.ceil(height * density);
    const ctx = source.getContext("2d");
    ctx.scale(density, density);

    ctx.fillStyle = V.removedBackground;
    ctx.fillRect(0, 1, inner, height - 2);
    ctx.textBaseline = "middle";

    ctx.font = `500 ${M.line}px "JetBrains Mono"`;
    ctx.textAlign = "right";
    ctx.fillStyle = rgba(V.ink, 0.88);
    ctx.fillText(
      String(redStart + r.index),
      M.rowPad + lineW,
      height / 2 + M.line * 0.025
    );

    const stroke = compact ? 5 : 6;
    const signX = M.rowPad + lineW + M.signW / 2;
    ctx.fillStyle = V.ink;
    ctx.fillRect(
      signX - M.signW * 0.29,
      height / 2 - stroke / 2,
      M.signW * 0.58,
      stroke
    );

    ctx.font = `500 ${r.codePx}px "JetBrains Mono"`;
    ctx.textAlign = "left";
    const codeX = M.rowPad + lineW + M.signW;
    const codeY = height / 2 + r.codePx * 0.025;
    const wordIndex = r.data.word
      ? r.data.text.indexOf(r.data.word)
      : -1;

    if (wordIndex < 0) {
      ctx.fillText(r.data.text, codeX, codeY);
    } else {
      const before = r.data.text.slice(0, wordIndex);
      const after = r.data.text.slice(wordIndex + r.data.word.length);
      const beforeW = ctx.measureText(before).width;
      const wordW = ctx.measureText(r.data.word).width;

      ctx.fillStyle = V.removedWordColor;
      ctx.fillRect(
        codeX + beforeW,
        (height - r.codePx * 1.05) / 2 - 2,
        wordW + 6,
        r.codePx * 1.05 + 4
      );
      ctx.fillStyle = V.ink;
      ctx.fillText(before, codeX, codeY);
      ctx.fillText(r.data.word, codeX + beforeW + 3, codeY);
      ctx.fillText(after, codeX + beforeW + wordW + 6, codeY);
    }

    return source;
  }

  function bezier(a, b, c, d, u) {
    const v = 1 - u;
    return v * v * v * a +
      3 * v * v * u * b +
      3 * v * u * u * c +
      u * u * u * d;
  }

  function eatRow(r, hit, flight, sourceLayout, pointAt, finalMeal) {
    const entry = sourceLayout.entries.find((item) => item.r === r);
    if (!entry) return;

    const start = hit - flight;
    const foldFor = finalMeal ? 0.075 : 0.05;
    const breakAt = start + foldFor;
    const rowTop = panelY + entry.y;
    const source = finalMeal ? null : paintRow(r, entry.h);
    const rnd = seeded(113 + r.index * 97 + (finalMeal ? 701 : 0));

    build.to(r.fold, {
      scaleX: 0.985,
      scaleY: finalMeal ? 0.82 : 0.9,
      rotation: r.index % 2 ? 1.1 : -1.1,
      duration: foldFor,
      ease: "power3.in"
    }, start);

    /*
     * The final block crumples into small square pixels. The
     * original text disappears before anything reaches the face.
     * Earlier bites keep their existing text fragments.
     */
    build.set([r.row, r.reading], { autoAlpha: 0 }, breakAt);

    const columns = finalMeal
      ? clamp(Math.ceil(inner / (C * 1.6)), 14, 28)
      : Math.max(8, Math.ceil(inner / (entry.h * 1.08)));
    const pixelRows = finalMeal
      ? clamp(Math.ceil(entry.h / (C * 1.2)), 2, 5)
      : 1;
    const pitch = inner / columns;
    const pitchY = entry.h / pixelRows;
    const pieceCount = columns * pixelRows;

    for (let i = 0; i < pieceCount; i++) {
      const piece = make(
        finalMeal ? "div" : "canvas",
        finalMeal ? "pixel" : "row-fragment",
        particleLayer
      );
      piece.setAttribute("aria-hidden", "true");

      const localX = (i % columns) * pitch;
      let width;
      let height;
      let sx;
      let sy;

      if (finalMeal) {
        const size = Math.max(
          3,
          Math.min(
            C * 0.48,
            Math.min(pitch, pitchY) * (0.34 + rnd() * 0.12)
          )
        );
        width = height = size;
        piece.style.width = size + "px";
        piece.style.height = size + "px";
        piece.style.background = rnd() < 0.3
          ? V.removedWordColor
          : V.removedBackground;

        const cellX = localX + pitch * (0.35 + rnd() * 0.3);
        const cellY = Math.floor(i / columns) * pitchY +
          pitchY * (0.35 + rnd() * 0.3);

        sx = left + inner * 0.5 +
          (cellX - inner * 0.5) * 0.985 - size / 2;
        sy = rowTop + entry.h * 0.85 +
          (cellY - entry.h * 0.85) * 0.82 - size / 2;
      } else {
        width = Math.min(pitch - 1, inner - localX);
        height = entry.h - 2;
        piece.width = Math.ceil(width * 2);
        piece.height = Math.ceil(height * 2);
        piece.style.width = width + "px";
        piece.style.height = height + "px";

        const ctx = piece.getContext("2d");
        ctx.drawImage(
          source,
          localX * 2, 2, width * 2, height * 2,
          0, 0, piece.width, piece.height
        );

        sx = left + localX;
        sy = rowTop + 1;
      }

      const origin = {
        x: sx + width / 2,
        y: sy + height / 2
      };
      const endPoint = pointAt(hit);
      const distance = Math.abs(origin.x - endPoint.x) / Math.max(1, inner);
      const earlyArrival =
        (0.025 + (1 - clamp(distance * 2, 0, 1)) * 0.055) *
        (0.8 + rnd() * 0.2);
      const lastPiece = i === (r.index % 2 ? 0 : pieceCount - 1);
      const arrival = lastPiece ? hit : hit - earlyArrival;
      const duration = Math.max(0.04, arrival - breakAt);
      const bend = (rnd() - 0.5) * C * 0.24;
      const turn = finalMeal
        ? 0
        : (origin.x < endPoint.x ? 1 : -1) * (55 + rnd() * 45);

      /*
       * All pieces travel immediately. Final pixels contract into
       * a tight funnel and stay square instead of rotating paper
       * rectangles over the mascot.
       *
       * Modifiers also run for event-suppressed blur seeks. The
       * endpoint follows the mascot during the final hoist.
       */
      function position(raw) {
        const p = clamp(parseFloat(raw) || 0, 0, 1);
        const u = 0.45 * p + 0.55 * p * p;
        const target = pointAt(breakAt + duration * p);
        const c1 = {
          x: mix(origin.x, target.x, finalMeal ? 0.58 : 0.29),
          y: mix(origin.y, target.y, finalMeal ? 0.24 : 0.14) + bend
        };
        const c2 = {
          x: target.x + (origin.x - target.x) * (finalMeal ? 0.018 : 0.045),
          y: target.y - C * 0.55
        };

        return {
          x: bezier(origin.x, c1.x, c2.x, target.x, u) - width / 2,
          y: bezier(origin.y, c1.y, c2.y, target.y, u) - height / 2
        };
      }

      gsap.set(piece, { autoAlpha: 0 });
      build.set(piece, {
        autoAlpha: 1,
        scaleX: 1, scaleY: 1, rotation: 0
      }, breakAt);

      build.fromTo(piece, { x: 0, y: 0 }, {
        x: 1, y: 1,
        duration,
        ease: "none",
        modifiers: {
          x: (value) => position(value).x.toFixed(3) + "px",
          y: (value) => position(value).y.toFixed(3) + "px"
        },
        immediateRender: false
      }, breakAt);

      if (!finalMeal) {
        build.to(piece, {
          rotation: turn,
          duration,
          ease: "power1.in"
        }, breakAt);
      }
      build.to(piece, {
        scaleX: 0.035, scaleY: 0.035,
        duration: duration * 0.48,
        ease: "power2.in"
      }, breakAt + duration * 0.52);
      build.set(piece, { autoAlpha: 0 }, arrival);
    }
  }

  function swallow(timeline, hit, level, finalMeal, speed) {
    if (!hasPal) return;
    const q = Math.max(0, speed);

    clawd.pose(timeline, hit, {
      eyes: "closed", arms: "down", legs: "stand"
    });
    timeline.set(mouth, {
      x: 0, scaleX: 0.8, scaleY: 0.08
    }, hit);
    timeline.set(teeth, { autoAlpha: 0 }, hit);
    setBelly(timeline, level, hit);

    if (finalMeal) {
      /*
       * The big gulp begins at maximum compression on the key
       * frame. It is not another small chewing bounce.
       */
      timeline.set(body, {
        x: 0, y: C * 0.18, rotation: 0,
        scaleX: 1.18, scaleY: 0.68
      }, hit);
      timeline.to(body, {
        y: -C * 0.22,
        scaleX: 0.98, scaleY: 1.1,
        duration: 0.1 * q,
        ease: "power4.out"
      }, hit);
      timeline.to(body, {
        y: C * 0.035,
        scaleX: 1.035, scaleY: 0.97,
        duration: 0.1 * q,
        ease: "power3.in"
      }, hit + 0.1 * q);
      timeline.to(body, {
        x: 0, y: 0, rotation: 0,
        scaleX: 1, scaleY: 1,
        duration: 0.1 * q,
        ease: "power3.out"
      }, hit + 0.2 * q);
    } else {
      timeline.set(body, {
        x: 0, y: C * 0.08, rotation: 0,
        scaleX: 1.045, scaleY: 0.92
      }, hit);
      timeline.to(body, {
        y: -C * 0.14, scaleX: 1, scaleY: 1,
        duration: 0.085 * q,
        ease: "power3.out"
      }, hit);
      timeline.to(body, {
        y: 0, rotation: 0,
        duration: 0.12 * q,
        ease: "power3.in"
      }, hit + 0.085 * q);

      timeline.to(mouth, {
        scaleX: 0.64, scaleY: 0.23,
        duration: 0.045 * q,
        ease: "power3.out"
      }, hit + 0.085 * q);
      timeline.to(mouth, {
        scaleX: 0.8, scaleY: 0.08,
        duration: 0.045 * q,
        ease: "power3.in"
      }, hit + 0.13 * q);
      clawd.pose(timeline, hit + 0.22 * q, {
        eyes: level % 2 ? "right" : "left",
        arms: "right"
      });
      clawd.pose(timeline, hit + 0.34 * q, { arms: "down" });
    }

    timeline.set(gulp, { autoAlpha: 1, y: -C * 0.3 }, hit);
    timeline.to(gulp, {
      y: C * (finalMeal ? 1.05 : 0.75),
      duration: 0.12 * q,
      ease: "power3.in"
    }, hit);
    timeline.set(gulp, { autoAlpha: 0 }, hit + 0.12 * q);
  }

  function counterHit(timeline, at) {
    timeline.fromTo(numberWrap, {
      scaleX: 1.055, scaleY: 1.09, y: -4
    }, {
      scaleX: 1, scaleY: 1, y: 0,
      duration: 0.18,
      ease: "power3.out",
      immediateRender: false
    }, at);
    timeline.fromTo(heroImpact, { opacity: 0.2 }, {
      opacity: 0,
      duration: 0.18,
      ease: "power3.out",
      immediateRender: false
    }, at);
  }

  function landGreen(timeline, r, hit, duration) {
    const start = hit - duration;

    timeline.set(r.row, { autoAlpha: 1 }, start);
    timeline.set(r.reading, { autoAlpha: 0 }, start);
    timeline.set(r.shell, { background: V.addedWordColor }, start);
    timeline.fromTo(r.fold, {
      y: -Math.min(30, rowH * 0.4),
      scaleX: 0.98, scaleY: 0.12
    }, {
      y: 0, scaleX: 1, scaleY: 1,
      duration,
      ease: "power4.in",
      immediateRender: false
    }, start);
    timeline.set(r.reading, { autoAlpha: 1 }, hit);
    timeline.set(addedCount, {
      textContent: statAt(
        V.addedStat,
        (r.index + 1) / Math.max(1, greenRows.length),
        true
      )
    }, hit);
    timeline.to(r.shell, {
      background: V.addedBackground,
      duration: 0.16,
      ease: "power3.out"
    }, hit);

    if (hasPlus) {
      timeline.fromTo(plusLine, {
        scaleX: 1.12, scaleY: 1.12
      }, {
        scaleX: 1, scaleY: 1,
        duration: 0.19,
        ease: "back.out(2)",
        immediateRender: false
      }, hit);
    }
    timeline.fromTo(bullet, { scaleX: 1.3, scaleY: 1.3 }, {
      scaleX: 1, scaleY: 1,
      duration: 0.17,
      ease: "power3.out",
      immediateRender: false
    }, hit);
  }

  const firstHit = Math.min(0.68, D * 0.18);
  const earlyHits = Array.from({ length: earlyCount }, (_, i) => (
    earlyCount <= 1
      ? firstHit
      : mix(firstHit, D * 0.5, i / (earlyCount - 1))
  ));

  const actions = [];
  earlyHits.forEach((hit, index) => {
    actions.push({ type: "eat", at: hit, hit, index });
  });

  greenRows.forEach((r, index) => {
    let hit;
    if (!redRows.length) {
      hit = Math.min(D * 0.6, 0.42 + index * 0.56);
    } else if (index < earlyCount) {
      hit = earlyHits[index] + 0.3;
    } else {
      hit = D * (0.3 + index * 0.16);
    }
    actions.push({
      type: "add", at: hit - 0.14, hit, index
    });
  });

  actions.sort((a, b) => a.at - b.at);

  const feedingOrder = redRows.slice().reverse();
  let activeRed = redRows.slice();
  const activeGreen = [];

  const activeRows = () => [
    ...activeGreen.slice().sort((a, b) => a.index - b.index),
    ...activeRed
  ];

  actions.forEach((action) => {
    if (action.type === "add") {
      const r = greenRows[action.index];
      activeGreen.push(r);
      applyLayout(build, activeRows(), action.at, 0.14, "work");
      landGreen(build, r, action.hit, 0.14);
      return;
    }

    const i = action.index;
    const r = feedingOrder[i];
    const sourceLayout = currentLayout;
    const center = W * (i % 2 ? 0.65 : 0.31);
    const flight = i === 0 ? 0.28 : 0.3;
    const point = pointInLayout(sourceLayout, center);

    anticipateMeal(action.hit, flight, center, i, false);
    eatRow(
      r, action.hit, flight, sourceLayout,
      () => point, false
    );

    /*
     * The final fragment disappears, mouth closes, belly advances
     * and whole-number counter ticks on precisely the same frame.
     */
    build.set(removedCount, {
      textContent: statAt(
        V.removedStat,
        (i + 1) / Math.max(1, redRows.length),
        false
      ),
      color: V.removedColor
    }, action.hit);
    swallow(build, action.hit, i + 1, false, 1);
    counterHit(build, action.hit);

    activeRed = activeRed.filter((item) => item !== r);
    applyLayout(build, activeRows(), action.hit, 0.18, "work");

    if (hasPal) clawd.blink(build, action.hit + 0.47);
  });

  /*
   * The sample reserves three rows for the finale. Give this whole
   * block more height and one red outline before it is eaten.
   */
  const feastAt = Math.max(0, D - 1.02);
  const feastLayout = applyLayout(
    build, activeRows(), feastAt, 0.2, "feast"
  );

  if (activeRed.length) {
    const firstRed = feastLayout.entries.find((e) => !e.r.added);
    const redHeight = feastLayout.entries
      .filter((e) => !e.r.added)
      .reduce((sum, e) => sum + e.h, 0);

    build.set(feastOutline, {
      top: firstRed ? firstRed.y : 0,
      height: redHeight,
      autoAlpha: 1
    }, feastAt + 0.2);

    activeRed.forEach((r) => {
      build.to(r.shell, {
        background: V.removedWordColor,
        duration: 0.045,
        ease: "power3.out"
      }, feastAt + 0.2);
      build.to(r.shell, {
        background: V.removedBackground,
        duration: 0.12,
        ease: "power3.in"
      }, feastAt + 0.245);
    });
  }

  const finalCenter = W * 0.5;
  const finalPalX = finalCenter - clawd.width / 2;
  const finalFlight = Math.min(0.54, D * 0.2);
  const finalStart = D - finalFlight;
  const finalLayout = layoutFor(greenRows, "final");

  if (activeRed.length) {
    anticipateMeal(D, finalFlight, finalCenter, earlyCount, true);
  } else if (hasPal) {
    walkTo(build, finalCenter, Math.max(0, finalStart - 0.3), 0.24, false);
    build.to(body, {
      x: 0, y: -C * 0.18, rotation: 0,
      scaleX: 1, scaleY: 1,
      duration: 0.06,
      ease: "power3.out"
    }, finalStart - 0.06);
  }

  /*
   * Suction hoists the mascot and raises the counter slab into its
   * final composition before key. Pixels chase the moving mouth.
   * There is no position jump when the final number arrives.
   */
  function finalPointAt(designTime) {
    const p = clamp((designTime - finalStart) / finalFlight, 0, 1);
    const u = liftEase(p);
    const a = pointInLayout(feastLayout, finalCenter);
    const b = pointInLayout(finalLayout, finalCenter);
    return { x: mix(a.x, b.x, u), y: mix(a.y, b.y, u) };
  }

  activeRed.forEach((r) => {
    eatRow(
      r, D, finalFlight, feastLayout,
      finalPointAt, true
    );
  });

  applyLayout(
    build, greenRows, finalStart, finalFlight,
    "final", liftEase
  );

  if (hasPal && activeRed.length) {
    /*
     * The final meal briefly lifts its feet off the rail.
     * Use the kit's actual alternating kicks, keeping the V reach.
     */
    clawd.walk(build, finalStart, D - 0.015, 0.085);
  }

  build.to(numberWrap, {
    scaleX: 0.96, scaleY: 0.88, y: 7,
    duration: 0.075,
    ease: "power3.in"
  }, D - 0.075);

  build.set(removedCount, {
    textContent: statAt(V.removedStat, 1, false)
  }, D);
  build.set(addedCount, {
    textContent: statAt(V.addedStat, 1, true)
  }, D);
  build.set(feastOutline, { autoAlpha: 0 }, D);

  build.timeScale(1 / T.scale);
  tl.add(build, 0);

  const key = T.key;
  const hold = Math.max(0, T.hold);
  const R = hold > 0 ? Math.min(1, hold / 1.9) : 0;

  /*
   * At key all layout coordinates are final, both totals are exact
   * and the number is at the peak of its physical overshoot.
   * No false numeric total is used to simulate overshoot.
   */
  tl.set(removedCount, {
    textContent: statAt(V.removedStat, 1, false),
    color: V.ink
  }, key);
  tl.set(addedCount, {
    textContent: statAt(V.addedStat, 1, true)
  }, key);
  tl.set(numberWrap, {
    scaleX: 1.12, scaleY: 1.23, y: -12
  }, key);
  tl.to(numberWrap, {
    scaleX: 0.965, scaleY: 0.94, y: 7,
    duration: 0.09 * R,
    ease: "power3.in"
  }, key);
  tl.to(numberWrap, {
    scaleX: 1.035, scaleY: 1.045, y: -3,
    duration: 0.095 * R,
    ease: "power3.out"
  }, key + 0.09 * R);
  tl.to(numberWrap, {
    scaleX: 1, scaleY: 1, y: 0,
    duration: 0.135 * R,
    ease: "power3.out"
  }, key + 0.185 * R);

  tl.to(removedCount, {
    color: V.removedColor,
    duration: 0.17 * R,
    ease: "power3.out"
  }, key + 0.035 * R);

  /*
   * The red impact belongs to the counter slab. The entire output
   * never becomes a red wash, and the diff retains its own colours.
   */
  tl.fromTo(heroImpact, {
    opacity: 0.68, scaleX: 0.96, scaleY: 0.78
  }, {
    opacity: 0.065, scaleX: 1, scaleY: 1,
    duration: 0.3 * R,
    ease: "power4.out",
    immediateRender: false
  }, key);
  tl.fromTo(hero, { y: 12 }, {
    y: 0,
    duration: 0.19 * R,
    ease: "power4.out",
    immediateRender: false
  }, key);
  tl.set($("hero-edge"), {
    height: 7, background: V.removedColor
  }, key);
  tl.set(hero, {
    boxShadow: `inset 0 0 0 3px ${rgba(V.removedColor, 0.58)}`
  }, key);

  /*
   * Number settles by +0.32. Summary begins at +0.42, giving the
   * result and its reassurance separate readable beats.
   */
  if (hasSummary) {
    const summaryAt = key + 0.42 * R;
    tl.set(summaryHolder, { autoAlpha: 1 }, summaryAt);
    tl.fromTo(summaryHolder, {
      y: 20, scaleX: 0.98, scaleY: 0.84
    }, {
      y: 0, scaleX: 1, scaleY: 1,
      duration: 0.17 * R,
      ease: "back.out(1.7)",
      immediateRender: false
    }, summaryAt);
    tl.fromTo(summaryMark, {
      rotation: -12, scaleX: 1.35, scaleY: 1.35
    }, {
      rotation: 0, scaleX: 1, scaleY: 1,
      duration: 0.2 * R,
      ease: "back.out(2)",
      immediateRender: false
    }, summaryAt);
  }

  if (hasPal) {
    swallow(tl, key, activeRed.length ? 4 : earlyCount, true, R);
    tl.set(pal, { x: finalPalX }, key);
    clawd.pose(tl, key + 0.31 * R, {
      eyes: "open", arms: "down", legs: "stand"
    });

    const burpPrep = key + 0.72 * R;
    const burpAt = key + 0.87 * R;

    clawd.pose(tl, burpPrep, {
      eyes: "right", arms: "right", legs: "stand"
    });
    tl.to(body, {
      y: C * 0.12, rotation: -3,
      duration: 0.11 * R,
      ease: "power3.in"
    }, burpPrep);
    tl.to(mouth, {
      x: C * 0.25, scaleX: 0.55, scaleY: 0.08,
      duration: 0.11 * R,
      ease: "power3.in"
    }, burpPrep);

    tl.set(mouth, { scaleY: 0.75 }, burpAt);
    tl.to(body, {
      x: -C * 0.18, y: -C * 0.12, rotation: 3,
      duration: 0.05 * R,
      ease: "power4.out"
    }, burpAt);

    if (hold > 0.04) {
      const rnd = seeded(907);
      const originX = finalCenter + C * 0.25;
      const originY = finalLayout.palY + C * 4.1;

      for (let i = 0; i < 15; i++) {
        const p = make("div", "pixel", particleLayer);
        const size = C * (i < 4 ? 0.45 : 0.2 + rnd() * 0.15);
        const at = burpAt + (i % 3) * 0.012 * R;
        const endX = Math.min(
          W - left - size,
          originX + C * (1.9 + rnd() * 2.7)
        );
        const endY = originY - C * (0.8 + rnd() * 1.7);

        p.style.cssText +=
          `;width:${size}px;height:${size}px;background:${i % 5 ? V.accent : V.removedWordColor}`;
        gsap.set(p, { autoAlpha: 0 });

        tl.set(p, {
          autoAlpha: 1,
          x: originX - size / 2,
          y: originY - size / 2,
          scaleX: 1, scaleY: 1, rotation: 0
        }, at);
        tl.to(p, {
          x: endX, y: endY,
          rotation: i % 2 ? 90 : -90,
          duration: 0.14 * R,
          ease: "power4.out"
        }, at);
        tl.to(p, {
          x: Math.min(W - left - size, endX + C * 0.45),
          y: endY - C * 0.45,
          scaleX: 0.06, scaleY: 0.06,
          duration: 0.12 * R,
          ease: "power2.in"
        }, at + 0.14 * R);
        tl.set(p, { autoAlpha: 0 }, at + 0.26 * R);
      }
    }

    /*
     * Deflation uses the existing pixel silhouettes. Head, V arms
     * and kicking feet return to their original proportions.
     */
    setBelly(tl, 2, burpAt + 0.05 * R);
    setBelly(tl, 1, burpAt + 0.1 * R);
    setBelly(tl, 0, burpAt + 0.16 * R);

    tl.to(body, {
      x: C * 0.12, y: C * 0.07, rotation: -3,
      duration: 0.06 * R,
      ease: "power3.inOut"
    }, burpAt + 0.05 * R);
    tl.to(body, {
      x: -C * 0.06, y: -C * 0.09, rotation: 2,
      duration: 0.06 * R,
      ease: "power3.inOut"
    }, burpAt + 0.11 * R);
    tl.to(body, {
      x: 0, y: 0, rotation: 0,
      scaleX: 1, scaleY: 1,
      duration: 0.11 * R,
      ease: "power3.out"
    }, burpAt + 0.17 * R);

    tl.set(mouth, { autoAlpha: 0 }, burpAt + 0.16 * R);
    tl.set(relief, { autoAlpha: 1 }, burpAt + 0.16 * R);
    clawd.pose(tl, burpAt + 0.16 * R, {
      eyes: "closed", arms: "up", legs: "stand"
    });
    clawd.pose(tl, burpAt + 0.29 * R, {
      eyes: "open", arms: "up", legs: "stand"
    });

    function pleasedHop(at, height) {
      tl.to(body, {
        y: C * 0.09,
        duration: 0.045 * R,
        ease: "power3.in"
      }, at);
      clawd.pose(tl, at + 0.045 * R, {
        legs: "left", arms: "up"
      });
      tl.to(body, {
        y: -C * height,
        duration: 0.07 * R,
        ease: "power3.out"
      }, at + 0.045 * R);
      clawd.pose(tl, at + 0.115 * R, { legs: "right" });
      tl.to(body, {
        y: C * 0.035,
        duration: 0.085 * R,
        ease: "power3.in"
      }, at + 0.115 * R);
      clawd.pose(tl, at + 0.2 * R, { legs: "stand" });
      tl.to(body, {
        y: 0,
        duration: 0.055 * R,
        ease: "power3.out"
      }, at + 0.2 * R);
    }

    if (hold > 0.1) {
      pleasedHop(key + 1.28 * R, 0.36);
      pleasedHop(key + 1.6 * R, 0.22);
    }
    if (hold > 0.6) {
      clawd.blink(tl, key + hold * 0.88);
    }
  }

  /*
   * Readable text stays fixed during hold. The character, light
   * and moving edge continue even after the reaction finishes.
   */
  tl.set(trace, { autoAlpha: 1 }, key);
  tl.fromTo(trace, { x: 12 }, {
    x: inner - traceW - 12,
    duration: Math.max(0.001, hold),
    ease: "sine.inOut",
    immediateRender: false
  }, key);
  tl.to($("glow"), {
    x: compact ? 24 : 42,
    y: -14, scaleX: 1.08, scaleY: 1.04,
    duration: Math.max(0.001, hold),
    ease: "sine.inOut"
  }, key);

  const open = "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)";
  const shut = "polygon(0% 50%, 100% 50%, 100% 50%, 0% 50%)";

  if (variant === "overlay") {
    tl.fromTo(stageEl, { clipPath: shut }, {
      clipPath: open,
      duration: 0.1,
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