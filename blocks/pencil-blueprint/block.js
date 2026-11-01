CA.ready(() => {
  const {
    vars: V, stage: S, safe, time: T, variant,
    fit, make, rgba, seeded, grainUrl,
  } = CA;

  const $ = (id) => document.getElementById(id);
  const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n));
  const mix = (a, b, p) => a + (b - a) * p;
  const out = (p) => 1 - (1 - clamp(p)) ** 3;
  const inOut = (p) => {
    p = clamp(p);
    return p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2;
  };
  const back = (p) => {
    p = clamp(p) - 1;
    return 1 + 2.4 * p ** 3 + 1.4 * p ** 2;
  };
  const number = (value, fallback) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  };

  const full = variant === "full";
  const short = !full && S.h < 800;
  const W = S.w;
  const H = S.h;
  const D = T.design;
  const stageEl = $("stage");
  const content = $("pb-content");
  const canvas = $("pb-drawing");
  const ctx = canvas.getContext("2d");
  const titleWindow = $("pb-title-window");
  const title = $("pb-title");
  const rule = $("pb-rule");
  const heightEl = $("pb-height");
  const widthEl = $("pb-width");
  const readouts = [heightEl, widthEl];

  const seed = Math.round(number(V.seed, 17));
  const rnd = seeded(seed);
  const roughness = clamp(number(V.sketchRoughness, 1.25), 0.3, 2.5);
  const decimals = clamp(Math.round(number(V.measurementDecimals, 0)), 0, 2);
  const unit = String(V.unit || "").trim();
  const heightValue = Math.max(1, number(V.heightValue, 560));
  const widthValue = Math.max(1, number(V.widthValue, 360));
  const heightStart = Math.max(0, number(V.heightStart, 0));
  const widthStart = Math.max(0, number(V.widthStart, 0));
  const measure = (n) =>
    Number(n).toFixed(decimals) + (unit ? " " + unit : "");

  const layouts = {
    full: {
      side: 84, top: 24, plotTop: 18,
      title: 120, number: 104, titleWidth: 0.45,
      ruleGap: 14, drawingGap: 26, impactInset: 36,
      dimensionGap: 42, dimensionSide: 36,
      numberGap: 20, labelGap: 48,
      outline: 8.4, fine: 3.4, arrow: 22,
    },
    top: {
      side: 50, top: 20, plotTop: 14,
      title: 104, number: 88, titleWidth: 0.43,
      ruleGap: 12, drawingGap: 22, impactInset: 30,
      dimensionGap: 32, dimensionSide: 30,
      numberGap: 16, labelGap: 38,
      outline: 7.7, fine: 3, arrow: 19,
    },
    overlay: {
      side: 54, top: 20, plotTop: 14,
      title: 104, number: 90, titleWidth: 0.43,
      ruleGap: 12, drawingGap: 22, impactInset: 30,
      dimensionGap: 34, dimensionSide: 32,
      numberGap: 16, labelGap: 40,
      outline: 7.9, fine: 3.1, arrow: 20,
    },
  };
  const M = { ...(layouts[variant] || layouts.full) };

  if (short) {
    Object.assign(M, {
      side: 36, top: 20, plotTop: 14,
      title: 80, number: 68, titleWidth: 0.41,
      ruleGap: 10, drawingGap: 18, impactInset: 24,
      dimensionGap: 26, dimensionSide: 26,
      numberGap: 12, labelGap: 34,
      outline: 6.6, fine: 2.6, arrow: 16,
    });
  }

  const minText = full ? 40 : 32;
  const side = Math.max(M.side, safe.side + 12);
  const topSafe = full
    ? Math.max(230, safe.top)
    : Math.max(24, Math.min(40, safe.top));
  const bottomSafe = full
    ? Math.max(300, safe.bottom)
    : Math.max(24, Math.min(40, safe.bottom));
  const titleTop = topSafe + M.top;

  stageEl.style.background = V.paper;
  canvas.setAttribute("aria-label", String(V.objectDescription));
  title.style.color = V.ink;
  content.style.setProperty("--pb-ink", V.ink);

  const words = String(V.label || "").trim().split(/\s+/).filter(Boolean);

  function textWidth(text) {
    ctx.font = `600 ${M.title}px "Barlow Semi Condensed"`;
    return ctx.measureText(text.toUpperCase()).width +
      Math.max(0, text.length - 1) * M.title * 0.025;
  }

  function balancedLines(count) {
    if (count === 1 || words.length < 3) return [words.join(" ")];

    let best = null;
    let bestScore = Infinity;

    function consider(lines) {
      if (lines[lines.length - 1].split(" ").length < 2) return;
      const widths = lines.map(textWidth);
      const widest = Math.max(...widths);
      const score = widest + (widest - Math.min(...widths)) * 0.2;
      if (score < bestScore) {
        best = lines;
        bestScore = score;
      }
    }

    if (count === 2) {
      for (let i = 1; i <= words.length - 2; i++) {
        consider([
          words.slice(0, i).join(" "),
          words.slice(i).join(" "),
        ]);
      }
    } else {
      for (let i = 1; i <= words.length - 3; i++) {
        for (let j = i + 1; j <= words.length - 2; j++) {
          consider([
            words.slice(0, i).join(" "),
            words.slice(i, j).join(" "),
            words.slice(j).join(" "),
          ]);
        }
      }
    }

    return best || [words.join(" ")];
  }

  function planTitle(room, maxHeight) {
    const counts = [words.length >= 3 ? 2 : 1];
    if (words.length >= 5) counts.push(3);
    let best = null;

    counts.forEach((count) => {
      const lines = balancedLines(count);
      const widest = Math.max(1, ...lines.map(textWidth));
      const px = Math.min(
        M.title,
        M.title * room / widest,
        maxHeight / (lines.length * 1.04),
      );
      const score = px - Math.max(0, lines.length - 2) * 3;
      if (!best || score > best.score) best = { lines, px, score };
    });

    return best;
  }

  let titleRoom = Math.min(W - side * 2, W * M.titleWidth);
  let titlePlan = planTitle(titleRoom, full ? 270 : H * 0.28);
  const headerMode = titlePlan.px < minText;

  if (headerMode) {
    titleRoom = Math.max(1, W - side * 2);
    titlePlan = planTitle(titleRoom, H * 0.3);
  }

  let titlePx = Math.max(minText, Math.floor(titlePlan.px));
  titleWindow.style.width = titleRoom + "px";
  title.style.fontSize = titlePx + "px";
  title.textContent = "";

  const titleSpans = [];
  titlePlan.lines.forEach((text, i) => {
    if (i) make("br", "", title);
    const span = make("span", "pb-title-line", title, text);
    span.style.fontSize = titlePx + "px";
    fit(span, titleRoom, minText);
    titlePx = Math.min(titlePx, parseFloat(span.style.fontSize) || titlePx);
    titleSpans.push(span);
  });

  title.style.fontSize = titlePx + "px";
  titleSpans.forEach((span) => {
    span.style.fontSize = titlePx + "px";
  });

  function prepareNumber(el, start, finish) {
    el.style.color = V.ink;
    el.style.fontSize = M.number + "px";

    el.textContent = measure(start);
    const startWidth = el.offsetWidth;
    el.textContent = measure(finish);
    if (startWidth > el.offsetWidth) el.textContent = measure(start);

    fit(el, Math.min(W * 0.3, H * 0.37), minText);
    const result = {
      width: Math.ceil(el.offsetWidth) + 4,
      px: parseFloat(el.style.fontSize) || M.number,
    };
    el.style.width = result.width + "px";
    el.textContent = measure(start);
    return result;
  }

  const heightType = prepareNumber(heightEl, heightStart, heightValue);
  const widthType = prepareNumber(widthEl, widthStart, widthValue);
  const numberH = Math.ceil(Math.max(heightType.px, widthType.px) * 1.1);
  const titleH = Math.ceil(title.offsetHeight);
  const ruleY = titleTop + titleH + M.ruleGap;
  const plotTop = headerMode
    ? ruleY + 3 + M.drawingGap
    : topSafe + M.plotTop;
  const bottomLimit = H - bottomSafe - M.impactInset;
  const baseLimit = bottomLimit - numberH - M.numberGap - M.dimensionGap;

  // Compact outputs use a wider articulated pose, rather than a smaller
  // copy of the portrait lamp. The shade itself keeps its original shape.
  const compactness = full ? 0 : clamp((900 - H) / 300);
  const B = [0, 493];
  const E = full
    ? [-104, 302]
    : [mix(-190, -213, compactness), mix(390, 458, compactness)];
  const U = full
    ? [92, 122]
    : [78, mix(300, 430, compactness)];
  const shade = ([x, y]) => [U[0] + x - 92, U[1] + y - 122];

  const modelTop = U[1] - 122;
  const modelHeight = 560 - modelTop;
  const baseW = modelHeight * widthValue / heightValue;
  const modelMinX = Math.min(-baseW / 2 - 30, E[0] - 45);
  const modelMaxX = Math.max(baseW / 2 + 30, U[0] + 128);
  const availableW = Math.max(1, W - side * 2 - M.dimensionSide);
  const modelScale = Math.min(
    availableW / (modelMaxX - modelMinX),
    Math.max(1, baseLimit - plotTop) / modelHeight,
  );
  const drawingW = (modelMaxX - modelMinX) * modelScale;
  const originX = side - modelMinX * modelScale +
    (availableW - drawingW) / 2;
  const drawingTop = plotTop +
    Math.max(0, baseLimit - plotTop - modelHeight * modelScale) * 0.25;
  const world = ([x, y]) => [
    originX + x * modelScale,
    drawingTop + (y - modelTop) * modelScale,
  ];
  const baseLeft = originX - baseW / 2 * modelScale;
  const baseRight = originX + baseW / 2 * modelScale;
  const baseY = drawingTop + modelHeight * modelScale;
  const dimensionX = originX + modelMaxX * modelScale + M.dimensionSide;
  const widthDimensionY = baseY + M.dimensionGap;

  Object.assign(titleWindow.style, {
    left: side + "px",
    top: titleTop + "px",
    height: titleH + 4 + "px",
  });
  Object.assign(rule.style, {
    left: side + "px",
    top: ruleY + "px",
    width: titleRoom + "px",
    background: V.ink,
  });
  Object.assign(heightEl.style, {
    left: dimensionX - M.labelGap - heightType.width + "px",
    top: (drawingTop + baseY - numberH) / 2 + "px",
    textAlign: "right",
  });
  Object.assign(widthEl.style, {
    left: (baseLeft + baseRight - widthType.width) / 2 + "px",
    top: widthDimensionY + M.numberGap + "px",
    textAlign: "center",
  });

  $("pb-grain").style.backgroundImage = grainUrl(192, 0.8, seed + 51);
  $("pb-grain").style.opacity = clamp(number(V.grainOpacity, 0.09), 0, 1);

  const pixelRatio = 2;
  canvas.width = Math.ceil(W * pixelRatio);
  canvas.height = Math.ceil(H * pixelRatio);

  const sketchEnd = D * 0.34;
  const floodStart = D * 0.36;
  const floodDuration = D * 0.24;
  const floodEnd = floodStart + floodDuration;
  const titleAt = D * 0.625;
  const titleDuration = Math.min(0.2, D * 0.1);
  const countDuration = Math.min(0.34, D * 0.14);
  const countAt = D - countDuration;
  const floodCentre = world(E);
  const wetPhase = rnd() * Math.PI * 2;
  const wetFactor = (a) =>
    1 +
    0.032 * Math.sin(a * 5 + wetPhase) +
    0.018 * Math.sin(a * 9 - wetPhase * 0.7) +
    0.009 * Math.sin(a * 23 + wetPhase * 1.4) +
    0.004 * Math.cos(a * 41 - wetPhase);

  let floodReach = 0;
  [[0, 0], [W, 0], [W, H], [0, H]].forEach(([x, y]) => {
    const dx = x - floodCentre[0];
    const dy = y - floodCentre[1];
    floodReach = Math.max(
      floodReach,
      Math.hypot(dx, dy) / wetFactor(Math.atan2(dy, dx)),
    );
  });
  floodReach *= 1.04;

  function passage(point) {
    const dx = point[0] - floodCentre[0];
    const dy = point[1] - floodCentre[1];
    const q = clamp(
      Math.hypot(dx, dy) /
      wetFactor(Math.atan2(dy, dx)) / floodReach,
    );
    return floodStart + floodDuration * (1 - Math.cbrt(1 - q));
  }

  function polyline(points) {
    const result = [];
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i];
      const b = points[i + 1];
      const steps = Math.max(
        1,
        Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 5),
      );
      for (let j = 0; j < steps; j++) {
        result.push([
          mix(a[0], b[0], j / steps),
          mix(a[1], b[1], j / steps),
        ]);
      }
    }
    result.push(points[points.length - 1].slice());
    return result;
  }

  function ellipse(x, y, rx, ry, angle = 0, start = 0, sweep = Math.PI * 2) {
    const result = [];
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    for (let i = 0; i <= 80; i++) {
      const a = start + sweep * i / 80;
      const u = Math.cos(a) * rx;
      const v = Math.sin(a) * ry;
      result.push([x + u * c - v * s, y + u * s + v * c]);
    }
    return result;
  }

  function normal(a, b, amount) {
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [
      -(b[1] - a[1]) / length * amount,
      (b[0] - a[0]) / length * amount,
    ];
  }

  const offset = (point, delta) => [
    point[0] + delta[0], point[1] + delta[1],
  ];

  function bar(a, b, thickness) {
    const n = normal(a, b, thickness / 2);
    return polyline([
      offset(a, n),
      offset(b, n),
      [b[0] - n[0], b[1] - n[1]],
      [a[0] - n[0], a[1] - n[1]],
      offset(a, n),
    ]);
  }

  const strokes = [];

  function addStroke(points, start, end, kind = "outline", closed = false) {
    const phase = rnd() * Math.PI * 2;
    const bow = (rnd() - 0.5) * 1.9 * roughness;
    const rough = points.map((point, i) => {
      const p = i / Math.max(1, points.length - 1);
      const amount = roughness * (kind === "axis" ? 0.85 : 0.5);
      return [
        point[0] + Math.sin(p * 9 + phase) * amount +
          (rnd() - 0.5) * amount + Math.sin(p * Math.PI) * bow,
        point[1] + Math.cos(p * 11 + phase) * amount +
          (rnd() - 0.5) * amount - Math.sin(p * Math.PI) * bow * 0.7,
      ];
    });

    if (!closed && rough.length > 2) {
      const a = rough[0];
      const b = rough[1];
      const z = rough[rough.length - 1];
      const y = rough[rough.length - 2];
      const first = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      const last = Math.hypot(z[0] - y[0], z[1] - y[1]) || 1;
      a[0] -= (b[0] - a[0]) / first * 2.4 * roughness;
      a[1] -= (b[1] - a[1]) / first * 2.4 * roughness;
      z[0] += (z[0] - y[0]) / last * 2.4 * roughness;
      z[1] += (z[1] - y[1]) / last * 2.4 * roughness;
    }

    const roughWorld = rough.map(world);
    strokes.push({
      ideal: points.map(world),
      rough: roughWorld,
      passage: roughWorld.map(passage),
      start: start * sketchEnd,
      end: end * sketchEnd,
      kind,
    });
  }

  const line = (a, b, start, end, kind = "outline") =>
    addStroke(polyline([a, b]), start, end, kind);

  line(
    [-baseW / 2 - 30, 560],
    [modelMaxX, 560],
    -0.18, 0.12, "ground",
  );
  line([0, 580], [0, 451], -0.12, 0.16, "axis");
  line(
    offset(B, [10, 18]), offset(E, [-15, -23]),
    -0.08, 0.22, "axis",
  );
  line(
    offset(E, [-18, 18]), offset(U, [17, -16]),
    -0.04, 0.28, "axis",
  );
  line(shade([58, 2]), shade([207, 130]), 0.02, 0.29, "axis");

  addStroke(polyline([
    [-baseW / 2, 560],
    [-baseW / 2, 545],
    [-baseW * 0.46, 534],
    [-baseW * 0.31, 523],
    [baseW * 0.31, 523],
    [baseW * 0.46, 534],
    [baseW / 2, 545],
    [baseW / 2, 560],
    [-baseW / 2, 560],
  ]), -0.13, 0.24, "outline", true);

  line([-baseW * 0.46, 545], [baseW * 0.46, 545], 0.12, 0.29);
  addStroke(polyline([
    [-20, 523], [-20, 492], [20, 492], [20, 523],
  ]), 0.13, 0.32);

  const lowerOffset = normal(B, E, 24);
  const upperOffset = normal(E, U, 25);
  const lowerB = offset(B, lowerOffset);
  const lowerE = offset(E, lowerOffset);
  const upperE = offset(E, upperOffset);
  const upperU = offset(U, upperOffset);

  addStroke(bar(B, E, 19), 0.16, 0.46, "outline", true);
  addStroke(bar(lowerB, lowerE, 8), 0.29, 0.52, "outline", true);
  addStroke(ellipse(B[0], B[1], 24, 24), 0.28, 0.46, "joint", true);
  addStroke(bar(E, U, 18), 0.36, 0.68, "outline", true);
  addStroke(bar(upperE, upperU, 8), 0.49, 0.75, "outline", true);
  line(E, upperE, 0.53, 0.63);
  line(U, upperU, 0.66, 0.76);

  addStroke(
    ellipse(E[0], E[1], 39, 39, 0, -1.2, Math.PI * 1.35),
    0.18, 0.35, "guide",
  );
  addStroke(ellipse(E[0], E[1], 24, 24), 0.52, 0.7, "joint", true);
  addStroke(ellipse(U[0], U[1], 17, 17), 0.68, 0.84, "joint", true);

  addStroke(polyline([
    [84, 107], [84, 89], [101, 73], [115, 88], [104, 111],
  ].map(shade)), 0.66, 0.81);

  const shadeOutline = [
    [76, 22], [111, 0], [194, 83], [134, 117], [76, 22],
  ].map(shade);
  addStroke(polyline(shadeOutline), 0.63, 0.87, "outline", true);
  addStroke(
    ellipse(164, 101, 40, 6, -0.515).map(shade),
    0.79, 0.94, "outline", true,
  );
  addStroke(polyline([
    [78, 25], [66, 37], [78, 57],
  ].map(shade)), 0.77, 0.91);
  addStroke(
    ellipse(164, 100, 11, 4.2, -0.515).map(shade),
    0.87, 0.98, "detail", true,
  );

  const spring = [];
  const springNormal = normal(B, E, 1);
  for (let i = 0; i <= 22; i++) {
    const p = mix(0.27, 0.69, i / 22);
    const zig = i === 0 || i === 22 ? 0 : (i % 2 ? 3.8 : -3.8);
    spring.push([
      mix(B[0], E[0], p) + springNormal[0] * zig,
      mix(B[1], E[1], p) + springNormal[1] * zig,
    ]);
  }
  addStroke(polyline(spring), 0.77, 0.96, "detail");

  for (let i = 0; i < 6; i++) {
    const x = -baseW * 0.3 + i * baseW * 0.105;
    line([x, 549], [x + 5, 556],
      0.84 + i * 0.012, 0.91 + i * 0.015, "hatch");
  }
  for (let i = 0; i < 5; i++) {
    line(
      shade([96 + i * 5.5, 23 + i * 8]),
      shade([109 + i * 5.5, 19 + i * 8]),
      0.85 + i * 0.014, 0.94 + i * 0.012, "hatch",
    );
  }

  const mottle = document.createElement("canvas");
  mottle.width = mottle.height = 256;
  const mg = mottle.getContext("2d");
  for (let i = 0; i < 420; i++) {
    mg.fillStyle = rgba(
      i % 3 ? V.ink : V.tideLine,
      0.014 + rnd() * 0.022,
    );
    mg.beginPath();
    mg.ellipse(
      rnd() * 256, rnd() * 256,
      0.8 + rnd() * 7, 0.5 + rnd() * 3,
      rnd() * Math.PI, 0, Math.PI * 2,
    );
    mg.fill();
  }
  const mottlePattern = ctx.createPattern(mottle, "repeat");

  function grid(color, alpha) {
    ctx.save();
    ctx.strokeStyle = color;
    const spacing = full ? 34 : short ? 28 : 32;
    for (let major = 0; major < 2; major++) {
      ctx.globalAlpha = alpha * (major ? 1.35 : 0.7);
      ctx.lineWidth = major ? 1.05 : 0.75;
      ctx.beginPath();
      for (let x = 0, n = 0; x <= W; x += spacing, n++) {
        if ((n % 5 === 0) !== Boolean(major)) continue;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
      }
      for (let y = 0, n = 0; y <= H; y += spacing, n++) {
        if ((n % 5 === 0) !== Boolean(major)) continue;
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  function wetPath(radius) {
    ctx.beginPath();
    for (let i = 0; i <= 240; i++) {
      const a = i / 240 * Math.PI * 2;
      const r = radius * wetFactor(a);
      const x = floodCentre[0] + Math.cos(a) * r;
      const y = floodCentre[1] + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  function partialPath(points, progress) {
    if (progress <= 0 || points.length < 2) return false;
    const end = clamp(progress) * (points.length - 1);
    const whole = Math.floor(end);
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i <= whole; i++) {
      ctx.lineTo(points[i][0], points[i][1]);
    }
    if (whole < points.length - 1) {
      const p = end - whole;
      ctx.lineTo(
        mix(points[whole][0], points[whole + 1][0], p),
        mix(points[whole][1], points[whole + 1][1], p),
      );
    }
    return true;
  }

  function straightening(age) {
    if (age <= 0) return 0;
    const u = age / 0.16;
    if (u >= 1.8) return 1;
    return 1 - Math.exp(-5.2 * u) * Math.cos(9 * u);
  }

  function drawStrokes(blue, d, hold, impact) {
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = blue ? V.ink : V.graphite;

    if (!blue) {
      strokes.forEach((stroke) => {
        if (stroke.kind !== "outline" && stroke.kind !== "joint") return;
        ctx.globalAlpha = 0.5;
        ctx.lineWidth = M.outline * 0.72;
        ctx.setLineDash([]);
        if (partialPath(stroke.rough, 1)) ctx.stroke();
      });
    }

    strokes.forEach((stroke) => {
      const progress = out((d - stroke.start) / (stroke.end - stroke.start));
      if (progress <= 0) return;

      const construction = stroke.kind === "axis" || stroke.kind === "guide";
      const fine = construction || stroke.kind === "detail" ||
        stroke.kind === "hatch";
      ctx.globalAlpha = construction
        ? (blue ? 0.45 : 0.3)
        : stroke.kind === "hatch" ? (blue ? 0.7 : 0.5)
        : blue ? 1 : 0.94;
      ctx.lineWidth = fine
        ? M.fine
        : M.outline * (blue ? 0.98 + impact * 0.8 : 1);
      ctx.setLineDash(
        blue && stroke.kind === "axis" ? [15, 6, 2, 6] : [],
      );
      ctx.lineDashOffset =
        blue && stroke.kind === "axis" ? -hold * 19 : 0;

      const points = blue
        ? stroke.rough.map((point, i) => {
            const p = straightening(d - stroke.passage[i]);
            return [
              mix(point[0], stroke.ideal[i][0], p),
              mix(point[1], stroke.ideal[i][1], p),
            ];
          })
        : stroke.rough;

      if (!partialPath(points, progress)) return;
      ctx.stroke();

      if (!blue && !construction) {
        ctx.save();
        ctx.translate(0.9 * roughness, -0.65 * roughness);
        ctx.globalAlpha = 0.24;
        ctx.lineWidth = fine ? 0.95 : 1.65;
        ctx.setLineDash([3.2, 2.1, 6.4, 1.8]);
        ctx.stroke();
        ctx.restore();
      }
    });
    ctx.restore();
  }

  function segment(x1, y1, x2, y2, p = 1) {
    if (p <= 0) return;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(mix(x1, x2, clamp(p)), mix(y1, y2, clamp(p)));
    ctx.stroke();
  }

  function arrow(x, y, angle, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(scale, scale);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-M.arrow, -M.arrow * 0.36);
    ctx.lineTo(-M.arrow, M.arrow * 0.36);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  const joints = [B, E, U].map(world);
  const inspectionPath = polyline([B, E, U]).map(world);
  const shadeWorld = shadeOutline.map(world);
  const countSteps = [0, 0.28, 0.62, 0.84];

  function countFraction(progress) {
    const p = clamp(progress);
    return p >= 1 ? 1 : countSteps[Math.min(3, Math.floor(p * 4 + 1e-7))];
  }

  function countProgress(d) {
    return d >= D - 1e-8
      ? 1
      : countFraction((d - countAt) / countDuration);
  }

  function countBeat(d, hold) {
    if (d >= D - 1e-8) return Math.exp(-hold / 0.1);
    if (d < countAt) return 0;
    const p = clamp((d - countAt) / countDuration);
    const step = Math.min(3, Math.floor(p * 4 + 1e-7));
    const beatAt = countAt + countDuration * step / 4;
    return Math.exp(-Math.max(0, d - beatAt) / 0.037);
  }

  function inspection(hold) {
    if (hold <= 0) return;
    const p = (0.08 + hold * 0.2) % 1;
    const start = Math.floor(p * (inspectionPath.length - 1));
    const length = Math.max(3, Math.floor(inspectionPath.length * 0.13));
    const points = inspectionPath.slice(
      start,
      Math.min(inspectionPath.length, start + length + 1),
    );

    ctx.save();
    ctx.strokeStyle = V.ink;
    ctx.globalAlpha = 0.85;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = M.outline * 1.55;
    if (partialPath(points, 1)) ctx.stroke();
    ctx.restore();
  }

  function dimensions(d, hold, impact) {
    const extension = out((d - D * 0.7) / (D * 0.07));
    if (extension <= 0) return;

    ctx.save();
    ctx.strokeStyle = V.ink;
    ctx.fillStyle = V.ink;
    ctx.lineWidth = M.fine;
    ctx.lineCap = "butt";
    ctx.globalAlpha = 0.8;

    const highestPoint = world(shade([111, 0]));
    segment(
      highestPoint[0] + 9, drawingTop,
      dimensionX + 12, drawingTop, extension,
    );
    segment(
      baseRight + 9, baseY,
      dimensionX + 12, baseY, extension,
    );
    [baseLeft, baseRight].forEach((x) => {
      segment(x, baseY + 9, x, widthDimensionY + 12, extension);
    });

    const midY = (drawingTop + baseY) / 2;
    const midX = (baseLeft + baseRight) / 2;
    const guide = out((d - D * 0.78) / (D * 0.1));

    ctx.globalAlpha = 0.24;
    segment(dimensionX, midY, dimensionX, drawingTop, guide);
    segment(dimensionX, midY, dimensionX, baseY, guide);
    segment(midX, widthDimensionY, baseLeft, widthDimensionY, guide);
    segment(midX, widthDimensionY, baseRight, widthDimensionY, guide);

    const p = countProgress(d);
    const beat = countBeat(d, hold);
    const locked = d >= D - 1e-8;
    ctx.globalAlpha = 1;
    ctx.lineWidth = M.fine * (locked ? 1.5 + beat : 1 + beat * 0.8);

    segment(dimensionX, midY, dimensionX, drawingTop, p);
    segment(dimensionX, midY, dimensionX, baseY, p);
    segment(midX, widthDimensionY, baseLeft, widthDimensionY, p);
    segment(midX, widthDimensionY, baseRight, widthDimensionY, p);

    if (p > 0 && beat > 0.01) {
      const endpoints = [
        [dimensionX, mix(midY, drawingTop, p)],
        [dimensionX, mix(midY, baseY, p)],
        [mix(midX, baseLeft, p), widthDimensionY],
        [mix(midX, baseRight, p), widthDimensionY],
      ];
      ctx.globalAlpha = beat * 0.36;
      endpoints.forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, (full ? 24 : 20) * (1 + impact * 0.5), 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    }

    joints.forEach(([x, y], i) => {
      const mark = clamp((d - D * (0.75 + i * 0.035)) / (D * 0.05));
      if (mark <= 0) return;
      ctx.lineWidth = M.fine;
      const size = (full ? 15 : 12) * back(mark) * (1 + impact * 0.5);
      segment(x - size, y, x + size, y);
      segment(x, y - size, x, y + size);

      if (hold > 0) {
        const angle = hold * 0.85 + i * 1.7;
        const radius = (i === 2 ? 28 : 39) * modelScale;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(x, y, radius, angle, angle + 0.92);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, y, radius, angle + Math.PI, angle + Math.PI + 0.35);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    });

    if (locked) {
      const size = 1 + impact * 0.6;
      arrow(dimensionX, drawingTop, -Math.PI / 2, size);
      arrow(dimensionX, baseY, Math.PI / 2, size);
      arrow(baseLeft, widthDimensionY, Math.PI, size);
      arrow(baseRight, widthDimensionY, 0, size);

      ctx.lineWidth = M.fine * 2;
      const tick = full ? 17 : 14;
      segment(dimensionX - tick, drawingTop, dimensionX + tick, drawingTop);
      segment(dimensionX - tick, baseY, dimensionX + tick, baseY);
      segment(baseLeft, widthDimensionY - tick, baseLeft, widthDimensionY + tick);
      segment(baseRight, widthDimensionY - tick, baseRight, widthDimensionY + tick);
    }

    if (hold > 0 && hold < 0.42) {
      const reaction = hold / 0.42;
      ctx.globalAlpha = (1 - reaction) * 0.9;
      ctx.lineWidth = M.fine * 1.5;
      const radius = (40 + out(reaction) * 72) * modelScale;
      [-0.7, Math.PI - 0.7].forEach((angle) => {
        ctx.beginPath();
        ctx.arc(joints[1][0], joints[1][1], radius, angle, angle + 1.5);
        ctx.stroke();
      });
    }

    ctx.restore();
  }

  function drawFrame(d, hold) {
    const impact = d >= D - 1e-8 ? Math.exp(-hold / 0.095) : 0;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = V.paper;
    ctx.fillRect(0, 0, W, H);
    grid(V.grid, clamp(number(V.gridOpacity, 0.19), 0, 1));

    drawStrokes(false, d, 0, 0);

    const flood = clamp((d - floodStart) / floodDuration);
    if (flood <= 0) return;

    ctx.save();
    wetPath(floodReach * out(flood));
    ctx.clip();
    ctx.fillStyle = V.blueprint;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.translate(hold * 2.4, -hold * 1.1);
    ctx.fillStyle = mottlePattern;
    ctx.fillRect(-W, -H, W * 3, H * 3);
    ctx.restore();
    grid(V.ink, 0.085);

    if (flood < 1) {
      wetPath(floodReach * out(flood));
      ctx.strokeStyle = V.tideLine;
      ctx.lineWidth = full ? 24 : 20;
      ctx.lineJoin = "round";
      ctx.stroke();
    }

    if (impact > 0) {
      ctx.save();
      ctx.globalAlpha = impact * 0.19;
      ctx.fillStyle = V.ink;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = impact * 0.5;
      if (partialPath(shadeWorld, 1)) ctx.fill();
      ctx.restore();
    }

    drawStrokes(true, d, hold, impact);
    inspection(hold);
    dimensions(d, hold, impact);
    ctx.restore();
  }

  function countedValue(start, finish, fraction) {
    if (fraction >= 1) return measure(finish);
    const factor = 10 ** decimals;
    const a = Math.round(start * factor);
    const b = Math.round(finish * factor);
    const raw = mix(a, b, fraction);
    let step = b >= a ? Math.floor(raw) : Math.ceil(raw);
    if (b > a) step = Math.min(b - 1, step);
    if (b < a) step = Math.max(b + 1, step);
    return measure(step / factor);
  }

  // Canvas, counts, visibility and punches share one seekable clock.
  // Property setters run even when capture seeks suppress callbacks.
  function renderClock(value) {
    const d = Math.min(D, Math.max(0, value));
    const hold = Math.max(0, value - D);
    const locked = d >= D - 1e-8;
    const impact = locked ? Math.exp(-hold / 0.095) : 0;

    const stamp = clamp((d - titleAt) / titleDuration);
    title.style.visibility = d >= titleAt ? "visible" : "hidden";
    title.style.transform =
      `translate(${mix(-18, 0, out(stamp))}px,` +
      `${mix(-12, 0, out(stamp))}px) ` +
      `scale(${mix(1.09, 1, out(stamp))})`;
    rule.style.visibility = d >= titleAt ? "visible" : "hidden";
    rule.style.transform = `scaleX(${out(stamp)})`;

    const fraction = countProgress(d);
    const beat = countBeat(d, hold);
    const visible = d >= countAt;
    const arrival = out((d - countAt) / Math.min(0.055, countDuration * 0.2));
    const readoutScale = locked ? 1 + impact * 0.22 : 1 + beat * 0.07;

    heightEl.textContent = countedValue(heightStart, heightValue, fraction);
    widthEl.textContent = countedValue(widthStart, widthValue, fraction);

    readouts.forEach((el) => {
      el.style.visibility = visible ? "visible" : "hidden";
      el.style.color = locked ? V.blueprint : V.ink;
      el.style.setProperty("--pb-lock", locked ? "1" : "0");
      el.style.transform =
        `translateY(${mix(12, 0, arrival)}px) scale(${readoutScale})`;
    });

    // The drawing receives the anticipation; reading positions stay fixed.
    const anticipation = locked
      ? 0
      : clamp((d - (D - 0.075)) / 0.075) ** 3;
    canvas.style.transformOrigin = `${originX}px ${(drawingTop + baseY) / 2}px`;
    const drawingPunch = full ? 0.026 : 0.018;
    canvas.style.transform =
      `scale(${1 + drawingPunch * (locked ? impact : anticipation)})`;

    drawFrame(d, hold);
  }

  let clockValue = 0;
  const paint = {};
  Object.defineProperty(paint, "clock", {
    enumerable: true,
    get() {
      return clockValue;
    },
    set(value) {
      clockValue = Number(value);
      renderClock(clockValue);
    },
  });

  renderClock(0);

  const tl = gsap.timeline({ paused: true });
  const build = gsap.timeline();
  build.fromTo(paint,
    { clock: 0 },
    { clock: D, duration: D, ease: "none" }, 0);
  build.timeScale(1 / T.scale);
  tl.add(build, 0);

  const post = T.hold + T.exit;
  if (post > 0) {
    tl.fromTo(paint,
      { clock: D },
      {
        clock: D + post,
        duration: post,
        ease: "none",
        immediateRender: false,
      }, T.key);
  }

  const closed =
    "polygon(54% -5%,54% -5%,46% 105%,46% 105%)";
  const open =
    "polygon(-6% -5%,106% -5%,106% 105%,-6% 105%)";

  if (variant === "overlay") {
    tl.fromTo(stageEl,
      { clipPath: closed },
      {
        clipPath: open,
        duration: Math.min(0.2, T.key * 0.16),
        ease: "power4.out",
      }, 0);
  }

  if (T.exit > 0) {
    tl.fromTo(stageEl,
      { clipPath: open },
      {
        clipPath: closed,
        duration: Math.max(0, T.exit - 1 / CA.fps),
        ease: "power3.in",
        immediateRender: false,
      }, T.key + T.hold);
  }

  window.__timelines["block"] = tl;
});