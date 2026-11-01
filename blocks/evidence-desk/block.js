CA.ready(() => {
  const {
    vars: V, stage: S, safe, time: T, variant,
    make, fit, rgba, seeded, grainUrl, parseStat,
  } = CA;

  const $ = (id) => document.getElementById(id);
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const numeric = (value, fallback) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  };

  const W = S.w;
  const H = S.h;
  const D = T.design;
  const full = variant === "full";
  const overlay = variant === "overlay";
  const small = !full && H < 840;
  const micro = !full && H < 620;
  const minText = full ? 40 : 32;
  const seed = Math.round(numeric(V.seed, 2025));
  const tilt = clamp(numeric(V.paperTilt, 3), 1, 3);
  const push = clamp(numeric(V.cameraPush, 7), 0, 9) / 100;
  const stageEl = $("stage");
  const margin = full ? 42 : 36;
  const fullTop = Math.max(230, numeric(safe.top, 230));
  const bottom = full
    ? Math.max(300, numeric(safe.bottom, 300)) + 16
    : micro ? 24 : 36;

  Object.entries({
    "--ed-paper": V.paper,
    "--ed-label-card": V.labelCard,
    "--ed-ink": V.ink,
    "--ed-muted": V.muted,
    "--ed-marker": V.marker,
    "--ed-highlighter": V.highlighter,
    "--ed-paper-edge": rgba(V.ink, 0.16),
    "--ed-chart-grid": rgba(V.ink, 0.16),
    "--ed-track": rgba(V.ink, 0.085),
    "--ed-tape": rgba(V.tape, 0.84),
    "--ed-tape-light": rgba(V.paper, 0.38),
    "--ed-tape-edge": rgba(V.ink, 0.13),
    "--ed-texture": clamp(numeric(V.textureAmount, 0.42), 0.1, 0.8),
  }).forEach(([name, value]) => stageEl.style.setProperty(name, value));

  const M = full ? {
    chartY: fullTop + 30,
    finalChartH: 732,
    titleY: 128, titlePx: 64,
    subY: 226, subPx: 40,
    metricY: 344, metricPx: 40,
    metaY: 224, metaH: 62,
    rowLabelPx: 52,
    initialPx: 160, heroPx: 360, otherPx: 84,
    barH: 30,
    notePx: 48,
    quoteGap: 24,
    quoteHeaderY: 24, quoteHeaderPx: 40,
    quotePx: 74, quoteLineGap: 8,
    quoteMetaPx: 40, footerPx: 40,
    labelY: fullTop + 2,
    labelH: 110, labelPx: 88,
    tapeW: 164, tapeH: 48,
  } : small ? {
    chartY: micro ? 24 : 28,
    finalChartH: Math.round(H * (micro ? 0.49 : 0.48)),
    titleY: 84, titlePx: 48,
    subY: 150, subPx: 32,
    metricY: 224, metricPx: 32,
    metaY: micro ? 64 : 76,
    metaH: micro ? 44 : 48,
    rowLabelPx: micro ? 36 : 40,
    initialPx: micro ? 120 : 144,
    heroPx: micro ? 180 : 208,
    otherPx: 48,
    barH: 20,
    notePx: 36,
    quoteGap: micro ? 16 : 18,
    quoteHeaderY: 20, quoteHeaderPx: 32,
    quotePx: micro ? 44 : 56,
    quoteLineGap: 10,
    quoteMetaPx: 32, footerPx: 32,
    labelY: 12,
    labelH: micro ? 68 : 80,
    labelPx: micro ? 56 : 66,
    tapeW: 126, tapeH: 36,
  } : {
    chartY: 44,
    finalChartH: Math.round(H * (overlay ? 0.556 : 0.54)),
    titleY: 88, titlePx: overlay ? 56 : 54,
    subY: 174, subPx: 32,
    metricY: 264, metricPx: 32,
    metaY: overlay ? 168 : 164,
    metaH: 52,
    rowLabelPx: 44,
    initialPx: 144,
    heroPx: overlay ? 248 : 240,
    otherPx: 64,
    barH: 26,
    notePx: 42,
    quoteGap: 22,
    quoteHeaderY: 24, quoteHeaderPx: 32,
    quotePx: 64, quoteLineGap: 12,
    quoteMetaPx: 34, footerPx: 32,
    labelY: 20,
    labelH: 104, labelPx: 84,
    tapeW: 150, tapeH: 44,
  };

  M.chartW = W - (full ? 108 : overlay ? 64 : 88);
  M.chartH = small ? M.finalChartH : H - bottom - M.chartY;
  M.quoteY = M.chartY + M.finalChartH + M.quoteGap;
  M.quoteH = H - bottom - M.quoteY;
  M.quoteW = M.chartW - 8;
  M.labelW = Math.min(M.chartW * 0.88, full ? 860 : 870);

  M.initialLabelW = M.chartW * 0.235 - margin;
  M.plotX = M.chartW * 0.27;
  M.initialValueX = M.chartW * 0.71;
  M.initialValueW = M.chartW - margin - M.initialValueX;
  M.plotW = M.initialValueX - M.plotX - 36;
  M.rowCY = full
    ? [M.chartH * 0.42, M.chartH * 0.60, M.chartH * 0.74]
    : [M.chartH * 0.45, M.chartH * 0.63, M.chartH * 0.77];
  M.axisY = M.chartH * (full ? 0.82 : 0.845);
  M.sourceY = M.chartH * (full ? 0.875 : 0.905);

  M.finalValueX = margin;
  M.finalValueW = M.chartW - margin * 2;

  if (micro) {
    M.heroPx = Math.min(M.heroPx, M.finalChartH * 0.63);
    M.finalValueX = M.chartW * 0.42;
    M.finalValueW = M.chartW * 0.54;
    M.circleH = M.heroPx * 1.12 + 16;
    M.valueCY = M.finalChartH * 0.60;
    M.metaY = M.valueCY - M.metaH / 2;
  } else {
    const availableCircleH =
      M.finalChartH - M.metaY - M.metaH - 24;
    M.heroPx = Math.min(
      M.heroPx,
      Math.max(minText, (availableCircleH - 18) / 1.12),
    );
    M.circleH = M.heroPx * 1.12 + 18;
    M.valueCY =
      (M.metaY + M.metaH + 12 + M.finalChartH - 12) / 2;
  }

  M.finalValueH = M.heroPx * 1.05 + 16;
  M.finalValueY = M.valueCY - M.finalValueH / 2;

  function place(el, x, y, w, h) {
    Object.assign(el.style, {
      left: x + "px",
      top: y + "px",
      width: w + "px",
      height: h + "px",
    });
  }

  function svg(parent, width, height, cls) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    el.setAttribute("viewBox", `0 0 ${width} ${height}`);
    el.setAttribute("width", width);
    el.setAttribute("height", height);
    el.setAttribute("aria-hidden", "true");
    if (cls) el.setAttribute("class", cls);
    parent.appendChild(el);
    return el;
  }

  function path(parent, d, cls, width) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", "path");
    el.setAttribute("d", d);
    el.setAttribute("pathLength", "1000");
    el.setAttribute("class", cls);
    if (width) el.setAttribute("stroke-width", width);
    parent.appendChild(el);
    return el;
  }

  const measure = document.createElement("canvas").getContext("2d");

  function balancedPair(content, width, font) {
    const words = String(content).trim().split(/\s+/).filter(Boolean);
    measure.font = font;
    let best = null;

    for (let i = 1; i < words.length; i += 1) {
      if (words.length >= 3 && words.length - i < 2) continue;
      if (words.length >= 4 && i < 2) continue;

      const a = words.slice(0, i).join(" ");
      const b = words.slice(i).join(" ");
      const aw = measure.measureText(a).width;
      const bw = measure.measureText(b).width;

      if (Math.max(aw, bw) > width) continue;

      const score = Math.abs(aw - bw);
      if (!best || score < best.score) best = { a, b, score };
    }

    return best ? [best.a, best.b] : null;
  }

  function printed(el, text, width, size, lines = 1) {
    const content = String(text);
    el.textContent = content;
    el.style.fontSize = Math.max(minText, size) + "px";
    el.style.display = "inline-block";
    el.style.whiteSpace = "nowrap";

    if (lines === 1) {
      fit(el, width, minText);
      return;
    }

    const style = getComputedStyle(el);

    for (let px = Math.floor(Math.max(minText, size)); px >= minText; px -= 1) {
      const font =
        `${style.fontStyle} ${style.fontWeight} ${px}px ${style.fontFamily}`;
      measure.font = font;
      el.style.fontSize = px + "px";

      if (measure.measureText(content).width <= width) return;

      const pair = balancedPair(content, width, font);
      if (pair) {
        el.replaceChildren();
        pair.forEach((line) => make("span", "ed-balanced-line", el, line));
        el.style.whiteSpace = "normal";
        return;
      }
    }

    el.style.width = width + "px";
    el.style.whiteSpace = "normal";
    el.style.textWrap = "balance";
  }

  function surfaceTexture() {
    const c = document.createElement("canvas");
    c.width = c.height = 320;
    const g = c.getContext("2d");
    const rnd = seeded(seed + 11);

    for (let i = 0; i < 1350; i += 1) {
      const x = rnd() * 320;
      const y = rnd() * 320;
      const r = 0.25 + rnd() * 0.8;
      g.fillStyle = rgba(V.ink, 0.025 + rnd() * 0.12);
      g.fillRect(x, y, r, r);
    }

    for (let i = 0; i < 310; i += 1) {
      const x = rnd() * 320;
      const y = rnd() * 320;
      g.strokeStyle = rgba(V.ink, 0.025 + rnd() * 0.065);
      g.lineWidth = 0.35 + rnd() * 0.5;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + 2 + rnd() * 13, y + rnd() * 2 - 1);
      g.stroke();
    }

    return `url("${c.toDataURL("image/png")}")`;
  }

  function matTexture() {
    const c = document.createElement("canvas");
    c.width = Math.ceil(W);
    c.height = Math.ceil(H);
    const g = c.getContext("2d");
    const rnd = seeded(seed + 31);
    const step = 40;

    for (let x = 0; x <= c.width; x += step) {
      g.strokeStyle = rgba(V.grid, x % 200 === 0 ? 0.17 : 0.085);
      g.lineWidth = x % 200 === 0 ? 1.3 : 0.75;
      g.beginPath();
      g.moveTo(x + 0.5, 0);
      g.lineTo(x + 0.5, c.height);
      g.stroke();
    }

    for (let y = 0; y <= c.height; y += step) {
      g.strokeStyle = rgba(V.grid, y % 200 === 0 ? 0.17 : 0.085);
      g.lineWidth = y % 200 === 0 ? 1.3 : 0.75;
      g.beginPath();
      g.moveTo(0, y + 0.5);
      g.lineTo(c.width, y + 0.5);
      g.stroke();
    }

    g.strokeStyle = rgba(V.grid, 0.3);
    g.lineWidth = 1.4;

    for (let y = 20; y < H; y += 20) {
      const length = y % 100 === 0 ? 24 : 11;
      g.beginPath();
      g.moveTo(20, y);
      g.lineTo(20 + length, y);
      g.moveTo(W - 20, y);
      g.lineTo(W - 20 - length, y);
      g.stroke();
    }

    for (let i = 0; i < 145; i += 1) {
      const x = rnd() * W;
      const y = rnd() * H;
      g.lineWidth = 0.5 + rnd() * 1.3;
      g.strokeStyle = rgba(i % 3 ? V.ink : V.grid, 0.035 + rnd() * 0.055);
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + 15 + rnd() * 180, y + (rnd() - 0.5) * 70);
      g.stroke();
    }

    return `url("${c.toDataURL("image/png")}")`;
  }

  const matMarks = $("ed-mat-marks");
  $("ed-mat").style.background =
    `radial-gradient(ellipse at 48% 39%, ${V.matCenter} 0%, ` +
    `${V.mat} 48%, ${V.matEdge} 100%)`;
  matMarks.style.backgroundImage = matTexture();
  matMarks.style.backgroundSize = `${W}px ${H}px`;

  const paperTexture = surfaceTexture();
  document.querySelectorAll(".ed-paper-grain, .ed-tape").forEach((el) => {
    el.style.backgroundImage = paperTexture;
  });

  $("ed-film").style.backgroundImage = grainUrl(200, 0.5, seed + 71);
  $("ed-film").style.opacity =
    clamp(numeric(V.grainOpacity, 0.065), 0.01, 0.15);
  $("ed-light").style.background =
    `radial-gradient(ellipse at var(--ed-light-x, 30%) ` +
    `var(--ed-light-y, 20%), ${rgba(V.paper, 0.29)}, ` +
    `${rgba(V.paper, 0)} 72%)`;
  $("ed-vignette").style.background =
    `radial-gradient(ellipse at 50% 43%, ${rgba(V.ink, 0)} 44%, ` +
    `${rgba(V.ink, 0.23)} 100%)`;

  const chart = $("ed-chart");
  const chartShadow = $("ed-chart-shadow");
  const quote = $("ed-quote");
  const quoteShadow = $("ed-quote-shadow");
  const label = $("ed-label");
  const labelShadow = $("ed-label-shadow");

  const chartX = (W - M.chartW) / 2;
  const quoteX = (W - M.quoteW) / 2 + 4;
  const labelX = (W - M.labelW) / 2;

  place(chart, chartX, M.chartY, M.chartW, M.chartH);
  place(chartShadow, chartX, M.chartY, M.chartW, M.chartH);
  place(quote, quoteX, M.quoteY, M.quoteW, M.quoteH);
  place(quoteShadow, quoteX, M.quoteY, M.quoteW, M.quoteH);
  place(label, labelX, M.labelY, M.labelW, M.labelH);
  place(labelShadow, labelX, M.labelY, M.labelW, M.labelH);

  const contactShadow =
    `1px 2px 2px ${rgba(V.ink, 0.51)}, ` +
    `15px 22px 28px ${rgba(V.ink, 0.29)}`;
  const liftedShadow =
    `4px 8px 12px ${rgba(V.ink, 0.17)}, ` +
    `30px 42px 44px ${rgba(V.ink, 0.31)}`;
  const labelContactShadow =
    `1px 2px 2px ${rgba(V.ink, 0.46)}, ` +
    `5px 8px 10px ${rgba(V.ink, 0.24)}`;
  const labelLiftedShadow =
    `3px 6px 8px ${rgba(V.ink, 0.18)}, ` +
    `18px 28px 26px ${rgba(V.ink, 0.29)}`;

  [chartShadow, quoteShadow].forEach((el) => {
    el.style.boxShadow = contactShadow;
  });
  labelShadow.style.boxShadow = labelContactShadow;

  const title = $("ed-chart-title");
  title.style.left = margin + "px";
  title.style.top = M.titleY + "px";
  printed(title, V.chartTitle, M.chartW - margin * 2, M.titlePx);

  const subtitle = $("ed-chart-subtitle");
  subtitle.style.left = margin + "px";
  subtitle.style.top = M.subY + "px";
  printed(subtitle, V.chartSubtitle, M.chartW - margin * 2, M.subPx, 2);

  const metric = $("ed-metric");
  metric.style.left = margin + "px";
  metric.style.top =
    Math.max(M.metricY, M.subY + subtitle.offsetHeight + 24) + "px";
  printed(metric, V.metric, M.chartW - margin * 2, M.metricPx);

  const source = $("ed-source");
  source.style.left = margin + "px";
  source.style.top = M.sourceY + "px";
  printed(source, V.source, M.chartW - margin * 2, minText, 2);

  const selected = clamp((parseInt(V.keyRow, 10) || 1) - 1, 0, 2);
  const raw = [1, 2, 3].map((i) => ({
    index: i - 1,
    label: V[`row${i}Label`],
    value: V[`row${i}Value`],
  }));
  const ordered = [raw[selected], ...raw.filter((row) => row.index !== selected)];
  const axisMax = Math.max(1, numeric(V.axisMax, 100));

  const rows = ordered.map((data, i) => {
    const key = i === 0;
    const row = make("div", "ed-row", $("ed-rows"));
    place(row, 0, 0, M.chartW, M.chartH);

    const rowH = (key ? M.initialPx : M.otherPx) * 1.15 + 24;
    const rowY = M.rowCY[i] - rowH / 2;

    const rowLabel = make("div", "ed-row-label", row);
    place(rowLabel, margin, rowY, M.initialLabelW, rowH);
    const rowLabelText = make("span", "", rowLabel, data.label);
    printed(rowLabelText, data.label, M.initialLabelW, M.rowLabelPx);

    const track = make("div", "ed-track", row);
    const bar = make("div", "ed-bar", row);

    [track, bar].forEach((el) => {
      el.style.left = M.plotX + "px";
      el.style.top = M.rowCY[i] + "px";
      el.style.height = M.barH + "px";
      el.style.transformOrigin = "left center";
    });

    track.style.width = M.plotW + "px";

    const stat = parseStat(data.value);
    const amount = stat && Number.isFinite(stat.value) ? stat.value : 0;
    bar.style.width = M.plotW * clamp(amount / axisMax, 0, 1) + "px";

    const valueBox = make("div", "ed-value-box", row);
    place(valueBox, M.initialValueX, rowY, M.initialValueW, rowH);

    const wash = key ? make("div", "ed-key-wash", valueBox) : null;
    const value = make("span", "ed-row-value", valueBox, data.value);

    let finalPx = M.otherPx;
    if (key) {
      printed(value, data.value, M.finalValueW - 64, M.heroPx);
      finalPx = parseFloat(value.style.fontSize);
    }

    printed(
      value, data.value, M.initialValueW - 16,
      key ? M.initialPx : M.otherPx,
    );

    const initialPx = parseFloat(value.style.fontSize);

    return {
      row, key, rowLabel, rowLabelText,
      track, bar, valueBox, value, wash,
      initialPx, finalPx,
    };
  });

  const keyRow = rows[0];
  const context = [
    ...document.querySelectorAll(".ed-chart-context"),
    ...rows.slice(1).map((row) => row.row),
  ];

  const grid = $("ed-plot-grid");
  place(
    grid, M.plotX, M.rowCY[0] - 40, M.plotW,
    M.rowCY[2] - M.rowCY[0] + 80,
  );

  for (let i = 0; i < 5; i += 1) {
    const line = make("div", "ed-grid-line", grid);
    line.style.left = M.plotW * i / 4 + "px";
  }

  const axis = $("ed-axis");
  place(axis, 0, M.axisY, M.chartW, minText * 1.2);

  const axisLabels = [
    V.axis0, V.axis25, V.axis50, V.axis75, V.axis100,
  ].map((text, i) => {
    const el = make("span", "ed-axis-label", axis, text);
    el.style.left = M.plotX + M.plotW * i / 4 + "px";
    printed(el, text, M.plotW / 2 - 16, minText);
    return el;
  });

  function ticksFit(indices) {
    return indices.every((index, i) => {
      if (i === 0) return true;
      const previous = indices[i - 1];
      const distance = M.plotW * (index - previous) / 4;
      return distance >=
        (axisLabels[index].offsetWidth + axisLabels[previous].offsetWidth) / 2 + 20;
    });
  }

  const ticks = ticksFit([0, 1, 2, 3, 4])
    ? [0, 1, 2, 3, 4]
    : ticksFit([0, 2, 4]) ? [0, 2, 4] : [0, 4];

  axisLabels.forEach((el, i) => {
    if (!ticks.includes(i)) el.remove();
  });

  const circle = make("div", "ed-circle", keyRow.row);
  const circleW = M.finalValueW + (micro ? 12 : 0);
  place(
    circle,
    M.finalValueX - (micro ? 6 : 0),
    M.valueCY - M.circleH / 2,
    circleW,
    M.circleH,
  );

  const circleSvg = svg(circle, 320, 164);
  circleSvg.setAttribute("width", "100%");
  circleSvg.setAttribute("height", "100%");
  circleSvg.setAttribute("preserveAspectRatio", "none");

  const circleStroke = path(
    circleSvg,
    "M278 34 C226 4 104 7 44 31 C-10 54 9 117 54 139 " +
    "C115 167 244 155 289 122 C326 94 314 52 278 34",
    "ed-marker-stroke", full ? 6 : 5.5,
  );
  const inkStop = path(
    circleSvg, "M274 31 Q292 40 301 59", "ed-ink-stop", 8,
  );

  const underline = make("div", "ed-underline", keyRow.row);
  const underlineSvg = svg(underline, M.chartW, M.chartH, "ed-ink-svg");
  const labelWidth = keyRow.rowLabelText.offsetWidth;
  const underlineY = M.metaY + M.metaH / 2 + M.rowLabelPx * 0.56;
  const underlineStroke = path(
    underlineSvg,
    `M${margin - 2} ${underlineY} ` +
    `Q${margin + labelWidth * 0.45} ${underlineY + 4} ` +
    `${margin + labelWidth + 5} ${underlineY - 1}`,
    "ed-marker-stroke", full ? 6 : 5,
  );

  const note = $("ed-note");
  const noteX = Math.max(
    margin + labelWidth + (full ? 54 : 40),
    M.chartW * 0.28,
  );
  note.style.left = noteX + "px";
  note.style.top = M.metaY + "px";
  printed(note, V.note, M.chartW - margin - noteX, M.notePx);

  const notePx = parseFloat(note.style.fontSize);
  const arrowSvg = svg($("ed-arrow"), M.chartW, M.finalChartH, "ed-ink-svg");
  const targetX = M.finalValueX + M.finalValueW * 0.83;
  const targetY = M.valueCY - M.circleH * 0.37;
  const startX = Math.min(
    noteX + note.offsetWidth + 14,
    targetX - 42,
  );
  const startY = M.metaY + notePx * 0.82;

  const arrowStroke = path(
    arrowSvg,
    `M${startX} ${startY} ` +
    `C${startX + 42} ${startY - 24} ` +
    `${targetX + 26} ${targetY - 34} ${targetX} ${targetY}`,
    "ed-marker-stroke", full ? 6 : 5,
  );
  const arrowHead = path(
    arrowSvg,
    `M${targetX - 13} ${targetY - 15} ` +
    `L${targetX} ${targetY} L${targetX + 17} ${targetY - 10}`,
    "ed-marker-stroke", full ? 6 : 5,
  );

  const quoteHeader = $("ed-quote-header");
  const quoteRule = $("ed-quote-rule");
  const quoteLines = $("ed-quote-lines");
  const attribution = $("ed-attribution");
  const footer = $("ed-quote-footer");
  const quoteWidth = M.quoteW - margin * 2 - 16;

  quoteHeader.style.left = margin + "px";
  quoteHeader.style.right = margin + "px";
  quoteHeader.style.top = M.quoteHeaderY + "px";

  printed($("ed-date"), V.quoteDate, M.quoteW * 0.4, M.quoteHeaderPx);
  printed(
    $("ed-interview"), V.quoteHeader,
    M.quoteW - margin * 2 - $("ed-date").offsetWidth - 24,
    M.quoteHeaderPx,
  );

  [attribution, footer].forEach((el) => {
    el.style.left = margin + "px";
  });

  printed(
    attribution, V.quoteAttribution,
    M.quoteW - margin * 2, M.quoteMetaPx, 2,
  );
  printed(
    footer, V.quoteFooter,
    M.quoteW - margin * 2, M.footerPx, 2,
  );

  const quoteTexts = [String(V.quoteLine1), String(V.quoteLine2)];
  const headerHeight = quoteHeader.offsetHeight;
  const attributionHeight = attribution.offsetHeight;
  const footerHeight = footer.offsetHeight;
  const bodyGap = full ? 26 : micro ? 14 : 20;
  const attributionGap = full ? 22 : micro ? 14 : 20;
  const footerGap = 16;
  const quoteBottom = full ? 24 : micro ? 14 : 20;

  function physicalQuoteLines(px) {
    const font = `400 ${px}px "Libre Caslon Text"`;
    const result = [];

    for (let logical = 0; logical < quoteTexts.length; logical += 1) {
      const text = quoteTexts[logical].trim();
      if (!text) continue;

      measure.font = font;
      const words = text.split(/\s+/);
      const wholeFits = measure.measureText(text).width <= quoteWidth;
      const pair = balancedPair(text, quoteWidth, font);
      let lines;

      if (full && words.length >= 4 && pair) {
        lines = pair;
      } else if (wholeFits) {
        lines = [text];
      } else if (pair) {
        lines = pair;
      } else {
        return null;
      }

      lines.forEach((line, part) => {
        result.push({ text: line, logical, part });
      });
    }

    return result;
  }

  function chooseQuoteLayout(showHeader, showFooter, showAttribution, floor) {
    for (let px = Math.floor(M.quotePx); px >= floor; px -= 1) {
      const lines = physicalQuoteLines(px);
      if (!lines) continue;

      const lineHeight = Math.ceil(px * 1.2);
      const bodyHeight =
        lines.length * lineHeight +
        Math.max(0, lines.length - 1) * M.quoteLineGap;
      const bodyTop = showHeader
        ? M.quoteHeaderY + headerHeight + bodyGap
        : micro ? 14 : 24;
      const attributionTop = bodyTop + bodyHeight + attributionGap;
      const footerTop = showAttribution
        ? attributionTop + attributionHeight + footerGap
        : bodyTop + bodyHeight + footerGap;
      const used = (
        showFooter ? footerTop + footerHeight :
        showAttribution ? attributionTop + attributionHeight :
        bodyTop + bodyHeight
      ) + quoteBottom;

      if (used <= M.quoteH) {
        return {
          px, lines, lineHeight, bodyHeight, bodyTop,
          attributionTop, footerTop, used,
          showHeader, showFooter, showAttribution,
        };
      }
    }

    return null;
  }

  const wantHeader = full || H >= 740;
  const preferredFloor = Math.max(minText, Math.floor(M.quotePx * 0.96));
  let quoteLayout =
    chooseQuoteLayout(wantHeader, !small, true, preferredFloor) ||
    chooseQuoteLayout(wantHeader, false, true, minText) ||
    chooseQuoteLayout(false, false, true, minText) ||
    chooseQuoteLayout(false, false, false, minText);

  if (!quoteLayout) {
    const px = minText;
    const font = `400 ${px}px "Libre Caslon Text"`;
    const lines = [];
    measure.font = font;

    quoteTexts.forEach((content, logical) => {
      const words = content.trim().split(/\s+/).filter(Boolean);
      const groups = [];

      words.forEach((word) => {
        const last = groups[groups.length - 1];
        if (!last || measure.measureText(last.concat(word).join(" ")).width > quoteWidth) {
          groups.push([word]);
        } else {
          last.push(word);
        }
      });

      if (groups.length > 1 && groups[groups.length - 1].length === 1) {
        const previous = groups[groups.length - 2];
        if (previous.length > 2) {
          groups[groups.length - 1].unshift(previous.pop());
        }
      }

      groups.forEach((group, part) => {
        lines.push({ text: group.join(" "), logical, part });
      });
    });

    const lineHeight = Math.ceil(px * 1.2);
    const bodyHeight =
      lines.length * lineHeight +
      Math.max(0, lines.length - 1) * M.quoteLineGap;

    quoteLayout = {
      px, lines, lineHeight, bodyHeight,
      bodyTop: 14,
      attributionTop: 0, footerTop: 0,
      used: bodyHeight + 28,
      showHeader: false,
      showFooter: false,
      showAttribution: false,
    };
  }

  const spare = Math.max(0, M.quoteH - quoteLayout.used);
  quoteLayout.bodyTop += spare * 0.22;
  quoteLayout.attributionTop += spare * 0.58;
  quoteLayout.footerTop += spare * 0.82;

  if (!quoteLayout.showHeader) {
    quoteHeader.style.display = "none";
    quoteRule.style.display = "none";
  } else {
    place(
      quoteRule, margin,
      M.quoteHeaderY + headerHeight + 10,
      M.quoteW - margin * 2, 1,
    );
  }

  if (!quoteLayout.showFooter) footer.style.display = "none";
  if (!quoteLayout.showAttribution) attribution.style.display = "none";

  place(
    quoteLines, margin, quoteLayout.bodyTop,
    quoteWidth, quoteLayout.bodyHeight,
  );
  attribution.style.top = quoteLayout.attributionTop + "px";
  footer.style.top = quoteLayout.footerTop + "px";

  const highlights = [];
  quoteLayout.lines.forEach((data, i) => {
    const line = make("div", "ed-quote-line", quoteLines);
    line.style.height = quoteLayout.lineHeight + "px";
    line.style.marginBottom =
      (i === quoteLayout.lines.length - 1 ? 0 : M.quoteLineGap) + "px";

    // Only the second passage receives highlighter ink.
    if (data.logical === 1) {
      highlights.push(make("div", "ed-highlight", line));
    }

    const text = make("span", "", line, data.text);
    text.style.fontSize = quoteLayout.px + "px";
  });

  const labelText = $("ed-label-text");
  printed(labelText, V.label, M.labelW - 56, M.labelPx);
  place($("ed-tape-a"), -20, -14, M.tapeW, M.tapeH);
  place(
    $("ed-tape-b"),
    M.labelW - M.tapeW + 20,
    M.labelH - M.tapeH + 12,
    M.tapeW, M.tapeH,
  );

  const quoteContents = [
    quoteHeader, quoteRule, quoteLines, attribution, footer,
  ];

  // Measure a fully readable approach pose before applying any transforms.
  // The printed words travel with the paper during its final drop and settle.
  function readingPose(plane, contents, x, y, rotation, scale) {
    const planeRect = plane.getBoundingClientRect();
    const width = plane.offsetWidth;
    const height = plane.offsetHeight;
    const unitX = width / Math.max(1, planeRect.width);
    const unitY = height / Math.max(1, planeRect.height);
    const baseX = parseFloat(plane.style.left) || 0;
    const baseY = parseFloat(plane.style.top) || 0;
    const angle = rotation * Math.PI / 180;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const points = [];

    contents.forEach((el) => {
      if (getComputedStyle(el).display === "none") return;
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const left = (rect.left - planeRect.left) * unitX;
      const right = (rect.right - planeRect.left) * unitX;
      const top = (rect.top - planeRect.top) * unitY;
      const lower = (rect.bottom - planeRect.top) * unitY;

      [
        [left, top], [right, top],
        [right, lower], [left, lower],
      ].forEach(([px, py]) => {
        const dx = (px - width / 2) * scale;
        const dy = (py - height / 2) * scale;
        points.push({
          x: baseX + width / 2 + dx * cos - dy * sin,
          y: baseY + height / 2 + dx * sin + dy * cos,
        });
      });
    });

    if (points.length) {
      const minX = Math.min(...points.map((point) => point.x));
      const maxX = Math.max(...points.map((point) => point.x));
      const minY = Math.min(...points.map((point) => point.y));
      const maxY = Math.max(...points.map((point) => point.y));
      const readTop = full ? fullTop + 4 : 12;
      const readBottom = full ? H - bottom + 4 : H - 12;
      const bounded = (value, low, high) =>
        low <= high ? clamp(value, low, high) : (low + high) / 2;

      x = bounded(x, 18 - minX, W - 18 - maxX);
      y = bounded(y, readTop - minY, readBottom - maxY);
    }

    return { x, y, rotation, scaleX: scale, scaleY: scale };
  }

  const labelRotation = -tilt * 0.60;
  const quoteRotation = tilt * 0.55;
  const labelApproach = readingPose(
    label, [labelText], -92, -12,
    labelRotation - 2.8, 1.06,
  );
  const quoteApproach = readingPose(
    quote, quoteContents, 110, -46,
    quoteRotation + 2.1, 1.035,
  );

  gsap.set(quoteContents, { autoAlpha: 0 });
  gsap.set(labelText, { autoAlpha: 0 });
  gsap.set(keyRow.wash, { scaleX: 0 });

  // The exact finding is printed from the opening frame.
  // Bar endpoint punches add emphasis without delaying or replacing it.
  rows.forEach(({ bar, value }) => {
    gsap.set(bar, { scaleX: 0 });
    gsap.set(value, { autoAlpha: 1 });
  });

  const finalLabelWidth = micro
    ? M.chartW * 0.32
    : Math.max(M.initialLabelW, labelWidth + 12);

  if (small) {
    gsap.set([...context, title, keyRow.track, keyRow.bar], { autoAlpha: 0 });
    place(keyRow.rowLabel, margin, M.metaY, finalLabelWidth, M.metaH);
    place(
      keyRow.valueBox,
      M.finalValueX, M.finalValueY, M.finalValueW, M.finalValueH,
    );
    gsap.set(keyRow.value, {
      fontSize: Math.min(
        keyRow.finalPx,
        Math.max(keyRow.initialPx, keyRow.finalPx * 0.78),
      ),
    });
  }

  const tl = gsap.timeline({ paused: true });
  const build = gsap.timeline();
  const chartRotation = -tilt * 0.55;
  const impact = $("ed-impact");

  function jolt(at, direction, strength = 1) {
    build.to(impact, {
      x: -direction * 1.6 * strength,
      y: 2.8 * strength,
      rotation: direction * 0.065 * strength,
      duration: D * 0.008,
      ease: "power3.out",
    }, at);
    build.to(impact, {
      x: 0, y: 0, rotation: 0,
      duration: D * 0.034,
      ease: "power3.out",
    }, at + D * 0.008);
  }

  // Start inside the reading area, with the hook already visible.
  gsap.set([chart, chartShadow], {
    autoAlpha: 1,
    x: -3, y: -6,
    rotation: chartRotation * 1.10,
    scaleX: 1.008, scaleY: 1.008,
  });
  gsap.set(chartShadow, {
    x: 5, y: 6,
    boxShadow: liftedShadow,
  });

  const chartImpact = D * 0.025;

  [chart, chartShadow].forEach((el) => {
    build.to(el, {
      x: -4, y: 4,
      rotation: chartRotation * 1.10,
      scaleX: 0.998, scaleY: 0.996,
      duration: chartImpact,
      ease: "power3.in",
    }, 0);
    build.to(el, {
      x: 2, y: -2,
      rotation: chartRotation * 0.94,
      scaleX: 1.002, scaleY: 1.002,
      duration: D * 0.016,
      ease: "power2.out",
    }, chartImpact);
    build.to(el, {
      x: 0, y: 0,
      rotation: chartRotation,
      scaleX: 1, scaleY: 1,
      duration: D * 0.032,
      ease: "power3.out",
    }, chartImpact + D * 0.016);
  });

  build.to(chartShadow, {
    boxShadow: contactShadow,
    duration: chartImpact,
    ease: "power3.in",
  }, 0);
  jolt(chartImpact, -1, 0.65);

  rows.forEach(({ bar, value }, i) => {
    if (small && i > 0) return;

    const at = D * i * 0.012;
    const endpoint = small ? chartImpact : at + D * 0.052;

    if (!small) {
      build.fromTo(bar, { scaleX: 0 }, {
        scaleX: 1,
        duration: D * 0.052,
        ease: "power4.out",
        immediateRender: false,
      }, at);
    }

    build.fromTo(value, {
      scaleX: 1.10, scaleY: 1.10,
    }, {
      scaleX: 1, scaleY: 1,
      duration: D * 0.035,
      ease: "back.out(1.5)",
      immediateRender: false,
    }, endpoint);
  });

  function land(
    plane, shadow, contents, at, direction, rotation, approach,
    travel, fall, closeShadow, farShadow,
  ) {
    const readAt = at + travel;
    const impactAt = readAt + fall;
    const offX = direction * W * 1.10;
    const offY = approach.y - 44;
    const offRotation = approach.rotation + direction * 5.5;

    build.set([plane, shadow], { autoAlpha: 1 }, at);

    build.fromTo(plane, {
      x: offX, y: offY,
      rotation: offRotation,
      scaleX: 1.085, scaleY: 1.085,
    }, {
      ...approach,
      duration: travel,
      ease: "power2.out",
      immediateRender: false,
    }, at);

    build.fromTo(shadow, {
      x: offX + 22, y: offY + 30,
      rotation: offRotation,
      scaleX: 1.085, scaleY: 1.085,
      boxShadow: farShadow,
    }, {
      x: approach.x + 16,
      y: approach.y + 24,
      rotation: approach.rotation,
      scaleX: approach.scaleX,
      scaleY: approach.scaleY,
      boxShadow: farShadow,
      duration: travel,
      ease: "power2.out",
      immediateRender: false,
    }, at);

    // All words are safely inside the frame before the accelerated drop.
    build.set(contents, { autoAlpha: 1 }, readAt);

    build.to(plane, {
      x: direction * 7, y: 4,
      rotation: rotation * 1.10,
      scaleX: 0.997, scaleY: 0.993,
      duration: fall,
      ease: "power3.in",
    }, readAt);
    build.to(shadow, {
      x: direction * 7, y: 4,
      rotation: rotation * 1.10,
      scaleX: 0.997, scaleY: 0.993,
      boxShadow: closeShadow,
      duration: fall,
      ease: "power3.in",
    }, readAt);

    [plane, shadow].forEach((el) => {
      build.to(el, {
        x: -direction * 3, y: -2,
        rotation: rotation * 0.94,
        scaleX: 1.002, scaleY: 1.003,
        duration: D * 0.018,
        ease: "power2.out",
      }, impactAt);
      build.to(el, {
        x: 0, y: 0, rotation,
        scaleX: 1, scaleY: 1,
        duration: D * 0.032,
        ease: "power3.out",
      }, impactAt + D * 0.018);
    });

    jolt(impactAt, direction);
    return impactAt;
  }

  const labelImpact = land(
    label, labelShadow, [labelText],
    D * 0.055, -1, labelRotation, labelApproach,
    D * 0.050, D * 0.060,
    labelContactShadow, labelLiftedShadow,
  );

  [$("ed-tape-a"), $("ed-tape-b")].forEach((tape, i) => {
    const at = labelImpact + D * (0.045 + i * 0.042);
    const angle = i ? -12 : -16;

    build.set(tape, { autoAlpha: 1 }, at);
    build.fromTo(tape, {
      y: -34, rotation: angle - 8,
      scaleX: 1.35, scaleY: 1.35,
    }, {
      y: 1, rotation: angle + 1,
      scaleX: 1.025, scaleY: 0.88,
      duration: D * 0.03,
      ease: "power4.in",
      immediateRender: false,
    }, at);
    build.to(tape, {
      y: 0, rotation: angle,
      scaleX: 1, scaleY: 1,
      duration: D * 0.015,
      ease: "back.out(1.3)",
    }, at + D * 0.03);
  });

  const morphAt = D * 0.17;
  const morphDuration = D * 0.30;
  const clearDuration = D * 0.045;
  const contractDelay = D * 0.05;

  // One live value moves and enlarges while the surrounding chart retires.
  // It reaches its full reading size in this single continuous transition.
  build.to(keyRow.value, {
    fontSize: keyRow.finalPx,
    duration: morphDuration,
    ease: "power2.out",
  }, morphAt);

  if (!small) {
    build.to(keyRow.valueBox, {
      left: M.finalValueX,
      top: M.finalValueY,
      width: M.finalValueW,
      height: M.finalValueH,
      duration: morphDuration,
      ease: "power2.out",
    }, morphAt);

    build.to(context, {
      y: -10,
      clipPath: "inset(0% 0% 100% 0%)",
      duration: clearDuration,
      ease: "power3.in",
    }, morphAt);
    build.set(context, { autoAlpha: 0 }, morphAt + clearDuration);

    build.to([keyRow.track, keyRow.bar], {
      scaleX: 0,
      duration: clearDuration,
      ease: "power3.in",
    }, morphAt);
    build.set([keyRow.track, keyRow.bar], {
      autoAlpha: 0,
    }, morphAt + clearDuration);

    // Clear the printed context before contracting its paper or moving
    // the category through the former subtitle and metric positions.
    build.to([chart, chartShadow], {
      height: M.finalChartH,
      duration: morphDuration - contractDelay,
      ease: "power3.out",
    }, morphAt + contractDelay);
    build.to(keyRow.rowLabel, {
      left: margin,
      top: M.metaY,
      width: finalLabelWidth,
      height: M.metaH,
      duration: morphDuration - contractDelay,
      ease: "power3.out",
    }, morphAt + contractDelay);
  }

  // Its readable approach begins after the chart has cleared the quote.
  land(
    quote, quoteShadow, quoteContents,
    D * 0.415, 1, quoteRotation, quoteApproach,
    D * 0.060, D * 0.065,
    contactShadow, liftedShadow,
  );

  if (!micro) {
    build.set(note, { autoAlpha: 1 }, D * 0.595);
    build.fromTo(note, {
      clipPath: "inset(0 100% 0 0)",
    }, {
      clipPath: "inset(0 0% 0 0)",
      duration: D * 0.13,
      ease: "power2.inOut",
      immediateRender: false,
    }, D * 0.595);

    build.set("#ed-arrow", { autoAlpha: 1 }, D * 0.73);
    build.to(arrowStroke, {
      strokeDashoffset: 0,
      duration: D * 0.19,
      ease: "power2.inOut",
    }, D * 0.73);
    build.to(arrowHead, {
      strokeDashoffset: 0,
      duration: D * 0.08,
      ease: "power3.out",
    }, D * 0.92);
  }

  const highlightSlot = D * 0.18 / Math.max(1, highlights.length);
  highlights.forEach((el, i) => {
    const at = D * 0.67 + i * highlightSlot;
    build.set(el, { visibility: "visible" }, at);
    build.fromTo(el, { scaleX: 0 }, {
      scaleX: 1,
      duration: Math.min(D * 0.09, highlightSlot * 0.90),
      ease: "power3.inOut",
      immediateRender: false,
    }, at);
  });

  build.set(circle, { visibility: "visible" }, D * 0.755);
  build.to(circleStroke, {
    strokeDashoffset: 0,
    duration: D * 0.245,
    ease: "power2.inOut",
  }, D * 0.755);

  // The payoff gets a new colour strike and a forward punch.
  // The already enlarged figure stays exact and uses the same text node.
  build.set(keyRow.wash, { autoAlpha: 1 }, D * 0.89);
  build.fromTo(keyRow.wash, { scaleX: 0 }, {
    scaleX: 1,
    duration: D * 0.11,
    ease: "power3.inOut",
    immediateRender: false,
  }, D * 0.89);

  build.set(underline, { visibility: "visible" }, D * 0.945);
  build.to(underlineStroke, {
    strokeDashoffset: 0,
    duration: D * 0.055,
    ease: "power3.out",
  }, D * 0.945);

  build.fromTo(keyRow.valueBox, {
    scaleX: 1, scaleY: 1,
  }, {
    scaleX: 1.045, scaleY: 1.045,
    duration: D * 0.045,
    ease: "power3.in",
    immediateRender: false,
  }, D * 0.955);

  build.to(matMarks, {
    backgroundSize:
      `${W * (1 + push * 0.55)}px ${H * (1 + push * 0.55)}px`,
    duration: D,
    ease: "power1.inOut",
  }, 0);

  build.timeScale(1 / T.scale);
  tl.add(build, 0);

  tl.set(keyRow.value, { fontSize: keyRow.finalPx }, T.key);
  tl.set(keyRow.wash, { scaleX: 1 }, T.key);
  tl.set(inkStop, { visibility: "visible" }, T.key);

  if (T.hold > 0) {
    const kick = Math.min(0.075, T.hold * 0.15);
    const settle = Math.min(0.27, T.hold * 0.45);

    tl.to(keyRow.valueBox, {
      scaleX: 1, scaleY: 1,
      duration: Math.min(0.30, T.hold * 0.55),
      ease: "back.out(1.6)",
    }, T.key);

    tl.fromTo(circle, { scaleX: 1, scaleY: 1 }, {
      scaleX: 1.035, scaleY: 1.035,
      duration: kick,
      ease: "power3.out",
      immediateRender: false,
    }, T.key);
    tl.to(circle, {
      scaleX: 1.012, scaleY: 1.012,
      duration: settle,
      ease: "back.out(1.4)",
    }, T.key + kick);
    tl.to(circle, {
      rotation: 0.65,
      duration: T.hold,
      ease: "sine.inOut",
    }, T.key);

    tl.fromTo("#ed-light", {
      "--ed-light-x": "30%",
      "--ed-light-y": "20%",
      opacity: 0.65,
    }, {
      "--ed-light-x": "53%",
      "--ed-light-y": "35%",
      opacity: 1,
      duration: T.hold,
      ease: "sine.inOut",
      immediateRender: false,
    }, T.key);

    tl.to(matMarks, {
      backgroundSize:
        `${W * (1 + push * 0.85)}px ${H * (1 + push * 0.85)}px`,
      duration: T.hold,
      ease: "sine.inOut",
    }, T.key);

    tl.fromTo("#ed-film", { backgroundPosition: "0px 0px" }, {
      backgroundPosition: "3px -2px",
      duration: T.hold,
      ease: "none",
      immediateRender: false,
    }, T.key);

    tl.to("#ed-tape-b", {
      rotation: -11.3,
      duration: T.hold,
      ease: "sine.inOut",
    }, T.key);

    tl.to(chartShadow, {
      boxShadow:
        `1px 2px 2px ${rgba(V.ink, 0.51)}, ` +
        `18px 23px 30px ${rgba(V.ink, 0.29)}`,
      duration: T.hold,
      ease: "sine.inOut",
    }, T.key);
  }

  const open = "polygon(0% 0%, 118% 0%, 100% 100%, -18% 100%)";
  const closedLeft = "polygon(0% 0%, 0% 0%, -18% 100%, -18% 100%)";
  const closedRight = "polygon(118% 0%, 118% 0%, 100% 100%, 100% 100%)";

  if (overlay) {
    tl.fromTo(stageEl, { clipPath: closedLeft }, {
      clipPath: open,
      duration: Math.min(0.22, T.key * 0.12),
      ease: "power3.out",
    }, 0);
  }

  if (T.exit > 0) {
    tl.to(stageEl, {
      clipPath: closedRight,
      duration: Math.max(0, T.exit - 1 / CA.fps),
      ease: "power3.in",
    }, T.key + T.hold);
  }

  window.__timelines["block"] = tl;
});