CA.ready(() => {
  const { vars: V, stage: S, safe, time: T, variant, fit, grainUrl } = CA;
  const $ = (id) => document.getElementById(id);
  const clamp = (n, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));
  const lerp = (a, b, p) => a + (b - a) * p;
  const smooth = (p) => {
    const q = clamp(p);
    return q * q * (3 - 2 * q);
  };
  const number = (value, fallback) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  };

  const stageEl = $("stage");
  const full = variant === "full";
  const overlay = variant === "overlay";
  const W = S.w;
  const H = S.h;
  const D = Math.max(0.001, number(T.design, 3.5));
  const K = Math.max(0.001, number(T.key, D));
  const hold = Math.max(0, number(T.hold, 1.5));
  const exit = Math.max(0, number(T.exit, 0));
  const fps = Math.max(1, number(CA.fps, 30));
  const timeScale = Math.max(0.0001, number(T.scale, K / D));
  const duration = Math.max(K, number(T.duration, K + hold + exit));
  const TAU = Math.PI * 2;
  const sizeScale = W / 1080;
  const pixelRatio = 2;

  const layouts = {
    full: {
      center: 980 / 1920,
      wave: 1,
      figureY: 1,
      grid: 1,
      turn: 0.24,
      maxAspect: 2.05,
    },
    top: {
      center: 0.5,
      wave: 0.7,
      figureY: 0.68,
      grid: 0.86,
      turn: 0.16,
      maxAspect: 1.95,
    },
    overlay: {
      center: 0.5,
      wave: 0.52,
      figureY: 0.52,
      grid: 0.8,
      turn: 0.1,
      maxAspect: 1.85,
    },
  };
  const L = layouts[variant] || layouts.full;

  const minimumText = (full ? 40 : 32) * sizeScale;
  const strokeWidth = clamp(number(V.strokeWidth, 11), 2, 18) * sizeScale;
  const glowStrength = clamp(number(V.glowStrength, 0.65));
  const overshoot = clamp(number(V.overshoot, 8), 0, 20) / 100;
  const keyPunch = clamp(number(V.keyPunch, 12), 0, 18) / 100;
  const tracking = clamp(number(V.letterSpacing, 0.16), 0.04, 0.3);
  const spaceWidth = clamp(number(V.wordSpacing, 1.1), 0.6, 1.8);
  const scanSpeed = clamp(number(V.scanSpeed, 0.42), 0.1, 0.8);
  const persistenceFrames = Math.round(
    clamp(number(V.persistenceFrames, 3), 0, 6),
  );
  const persistenceStrength = clamp(
    number(V.persistenceStrength, 0.18),
    0,
    0.35,
  );

  stageEl.style.setProperty("--osc-screen", V.screen);
  stageEl.style.setProperty("--osc-face", V.tubeFace);
  stageEl.style.setProperty("--osc-readout", V.readoutColor);
  stageEl.style.background = overlay ? "transparent" : V.screen;

  $("osc-grain").style.backgroundImage =
    grainUrl(180, 1, Math.floor(number(V.seed, 7)));
  $("osc-grain").style.opacity =
    clamp(number(V.grainOpacity, 0.055), 0, 0.12);

  const FONT = {
    A: { w: 0.7, p: [[0,0],[0.35,1],[0.7,0],[0.525,0.5],[0.175,0.5],[0,0]] },
    B: { w: 0.68, p: [[0,0],[0,1],[0.44,1],[0.64,0.84],[0.64,0.66],[0.44,0.5],[0,0.5],[0.44,0.5],[0.66,0.34],[0.66,0.16],[0.44,0],[0,0]] },
    C: { w: 0.66, p: [[0.5,0],[0.66,0.14],[0.5,0],[0.18,0],[0,0.18],[0,0.82],[0.18,1],[0.5,1],[0.66,0.86]] },
    D: { w: 0.68, p: [[0,0],[0,1],[0.42,1],[0.68,0.75],[0.68,0.25],[0.42,0],[0,0]] },
    E: { w: 0.62, p: [[0.62,0],[0,0],[0,1],[0.62,1],[0,1],[0,0.5],[0.48,0.5],[0,0.5],[0,0]] },
    F: { w: 0.62, p: [[0,0],[0,1],[0.62,1],[0,1],[0,0.52],[0.48,0.52],[0,0.52],[0,0]] },
    G: { w: 0.68, p: [[0.48,0],[0.18,0],[0,0.18],[0,0.82],[0.18,1],[0.5,1],[0.68,0.84],[0.5,1],[0.18,1],[0,0.82],[0,0.18],[0.18,0],[0.48,0],[0.68,0.18],[0.68,0.48],[0.4,0.48]] },
    H: { w: 0.66, p: [[0,0],[0,1],[0,0.5],[0.66,0.5],[0.66,1],[0.66,0]] },
    I: { w: 0.28, p: [[0,0],[0.28,0],[0.14,0],[0.14,1],[0,1],[0.28,1]] },
    J: { w: 0.62, p: [[0.16,0],[0,0.2],[0.16,0],[0.42,0],[0.62,0.2],[0.62,1],[0.28,1]] },
    K: { w: 0.66, p: [[0,0],[0,1],[0,0.48],[0.66,1],[0,0.48],[0.66,0]] },
    L: { w: 0.62, p: [[0,0],[0,1],[0,0],[0.62,0]] },
    M: { w: 0.84, p: [[0,0],[0,1],[0.42,0.46],[0.84,1],[0.84,0]] },
    N: { w: 0.7, p: [[0,0],[0,1],[0.7,0],[0.7,1]] },
    O: { w: 0.7, p: [[0.18,0],[0,0.18],[0,0.82],[0.18,1],[0.52,1],[0.7,0.82],[0.7,0.18],[0.52,0],[0.18,0]] },
    P: { w: 0.64, p: [[0,0],[0,1],[0.46,1],[0.64,0.82],[0.64,0.64],[0.46,0.48],[0,0.48]] },
    Q: { w: 0.75, p: [[0.18,0],[0,0.18],[0,0.82],[0.18,1],[0.52,1],[0.7,0.82],[0.7,0.18],[0.52,0],[0.18,0],[0.52,0],[0.7,0.18],[0.45,0.4],[0.75,0]] },
    R: { w: 0.7, p: [[0,0],[0,1],[0.46,1],[0.64,0.82],[0.64,0.64],[0.46,0.48],[0,0.48],[0.38,0.48],[0.7,0]] },
    S: { w: 0.64, p: [[0.16,0],[0.48,0],[0.64,0.16],[0.64,0.36],[0.48,0.5],[0.16,0.5],[0,0.66],[0,0.84],[0.16,1],[0.64,1]] },
    T: { w: 0.7, p: [[0.35,0],[0.35,1],[0,1],[0.7,1],[0.35,1],[0.35,0]] },
    U: { w: 0.68, p: [[0.18,0],[0,0.18],[0,1],[0,0.18],[0.18,0],[0.5,0],[0.68,0.18],[0.68,1]] },
    V: { w: 0.7, p: [[0.35,0],[0,1],[0.35,0],[0.7,1]] },
    W: { w: 0.92, p: [[0.22,0],[0,1],[0.22,0],[0.46,0.6],[0.7,0],[0.92,1]] },
    X: { w: 0.68, p: [[0,0],[0.68,1],[0.34,0.5],[0,1],[0.68,0]] },
    Y: { w: 0.68, p: [[0.34,0],[0.34,0.5],[0,1],[0.34,0.5],[0.68,1]] },
    Z: { w: 0.68, p: [[0,0],[0.68,1],[0,1],[0.68,1],[0,0],[0.68,0]] },
    "1": { w: 0.42, p: [[0.42,0],[0.18,0],[0.18,1],[0,0.82],[0.18,1],[0.18,0],[0,0]] },
    "2": { w: 0.64, p: [[0,0],[0.64,0.72],[0.64,0.84],[0.48,1],[0.16,1],[0,0.84],[0.16,1],[0.48,1],[0.64,0.84],[0.64,0.72],[0,0],[0.64,0]] },
    "3": { w: 0.64, p: [[0,0],[0.46,0],[0.64,0.16],[0.64,0.34],[0.46,0.5],[0.2,0.5],[0.46,0.5],[0.64,0.66],[0.64,0.84],[0.46,1],[0,1]] },
    "4": { w: 0.66, p: [[0.52,0],[0.52,1],[0,0.35],[0.66,0.35]] },
    "5": { w: 0.64, p: [[0,0],[0.48,0],[0.64,0.16],[0.64,0.4],[0.48,0.56],[0,0.56],[0,1],[0.64,1]] },
    "6": { w: 0.64, p: [[0.16,0],[0,0.18],[0,0.8],[0.2,1],[0.6,1],[0.2,1],[0,0.8],[0,0.48],[0.44,0.48],[0.64,0.3],[0.64,0.16],[0.48,0],[0.16,0]] },
    "7": { w: 0.64, p: [[0.12,0],[0.64,1],[0,1]] },
    "8": { w: 0.64, p: [[0.18,0],[0,0.16],[0,0.34],[0.18,0.5],[0.46,0.5],[0.64,0.66],[0.64,0.84],[0.46,1],[0.18,1],[0,0.84],[0,0.66],[0.18,0.5],[0.46,0.5],[0.64,0.34],[0.64,0.16],[0.46,0],[0.18,0]] },
    "9": { w: 0.64, p: [[0.04,0],[0.44,0],[0.64,0.2],[0.64,0.84],[0.48,1],[0.16,1],[0,0.84],[0,0.66],[0.16,0.5],[0.64,0.5]] },
  };
  FONT["0"] = FONT.O;

  const normalizeWords = (value) => String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const words = normalizeWords(V.words);
  const characters = Array.from(words);
  const glyphCount = characters.filter((ch) => ch !== " ").length;
  const units = characters.reduce(
    (sum, ch, index) =>
      sum + (ch === " " ? spaceWidth : FONT[ch].w) +
      (index < characters.length - 1 ? tracking : 0),
    0,
  );

  const suppliedReadout = String(V.readout || "").trim();
  const readoutText = normalizeWords(suppliedReadout) === words
    ? ""
    : suppliedReadout;
  const readoutSize = Math.max(
    minimumText,
    number(V.readoutSize, 44) * sizeScale,
  );
  const readoutGap = Math.max(32 * sizeScale, readoutSize * 0.85);
  const readoutReserve = readoutText
    ? readoutSize * 1.45 + readoutGap
    : 0;

  const side = Math.max(
    number(safe.side, 0),
    clamp(number(V.traceInset, 40), 32, 160) * sizeScale,
  );
  const guard = Math.max(22 * sizeScale, strokeWidth * 2.2);
  const signalLeft = side + guard;
  const signalRight = W - signalLeft;
  const signalWidth = Math.max(1, signalRight - signalLeft);
  const textRoom = signalWidth;

  // The signal and zero line continue beyond the canvas edges.
  const traceLeft = -Math.max(guard * 2, W * 0.06);
  const traceRight = W - traceLeft;
  const traceWidth = traceRight - traceLeft;

  const topSafe = full
    ? Math.max(230 * sizeScale, number(safe.top, 0))
    : overlay
      ? Math.max(H * 0.12, 40 * sizeScale)
      : Math.max(
        32 * sizeScale,
        Math.min(56 * sizeScale, number(safe.top, 0)),
      );

  const bottomSafe = full
    ? Math.max(300 * sizeScale, number(safe.bottom, 0))
    : overlay
      ? Math.max(H * 0.13, 40 * sizeScale)
      : Math.max(
        32 * sizeScale,
        Math.min(56 * sizeScale, number(safe.bottom, 0)),
      );

  const activeBottom = H - bottomSafe;
  const activeHeight = Math.max(1, activeBottom - topSafe);
  const centerOffset = (number(V.baseline, 980) - 980) / 1920;
  const requestedCenter = full
    ? number(V.baseline, 980) * H / 1920
    : H * (L.center + centerOffset);

  const centerLow = topSafe + guard;
  const centerHigh = Math.max(centerLow, activeBottom - guard);
  const signalCenter = clamp(requestedCenter, centerLow, centerHigh);
  const verticalRoom = Math.max(
    1,
    Math.min(signalCenter - topSafe, activeBottom - signalCenter) - guard,
  );

  const requestedLetterHeight = full
    ? number(V.letterHeight, 216)
    : overlay
      ? number(V.overlayLetterHeight, 192)
      : number(V.topLetterHeight, 208);

  const availableTextHeight = Math.max(
    1,
    activeHeight - readoutReserve - guard * 2,
  );
  const heightRequest = Math.min(
    Math.max(minimumText, requestedLetterHeight * sizeScale),
    availableTextHeight / (1 + overshoot),
  );

  // Width and height are fitted together. A long phrase cannot retain
  // a tall cap height while its counters collapse into narrow slits.
  const unitX = Math.min(
    heightRequest,
    textRoom / Math.max(0.01, units),
  );
  const capHeight = Math.min(heightRequest, unitX * L.maxAspect);
  const wordWidth = units * unitX;
  const baselineLow = topSafe + guard + capHeight * (1 + overshoot);
  const baselineHigh = Math.max(
    baselineLow,
    activeBottom - guard - readoutReserve,
  );
  const wordBaseline = clamp(signalCenter, baselineLow, baselineHigh);
  const textCenter = wordBaseline - capHeight * 0.5;

  const waveAmplitude = Math.min(
    Math.max(0, number(V.waveAmplitude, 580)) * L.wave * sizeScale,
    verticalRoom * 0.965,
  );
  const cycles = clamp(number(V.waveCycles, 2.3), 1, 4);

  let figureRX = Math.max(
    1,
    Math.min(
      Math.max(0, number(V.figureWidth, 920)) * 0.5 * sizeScale,
      signalWidth * 0.5,
    ),
  );
  let figureRY = Math.max(
    1,
    Math.min(
      Math.max(0, number(V.figureHeight, 1160)) *
        0.5 * L.figureY * sizeScale,
      verticalRoom,
    ),
  );

  const turnMargin = Math.sin(L.turn);
  const figureFit = Math.min(
    1,
    signalWidth * 0.48 / (figureRX + figureRY * turnMargin),
    verticalRoom * 0.96 / (figureRY + figureRX * turnMargin),
  );
  figureRX *= figureFit;
  figureRY *= figureFit;

  const prepareCanvas = (canvas) => {
    canvas.width = Math.round(W * pixelRatio);
    canvas.height = Math.round(H * pixelRatio);
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) throw new Error("Oscilloscope needs a 2D canvas context");
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    return context;
  };

  const gridCanvas = $("osc-grid");
  const traceCanvas = $("osc-trace");
  const grid = prepareCanvas(gridCanvas);
  const beam = prepareCanvas(traceCanvas);

  traceCanvas.setAttribute(
    "aria-label",
    words ? "Oscilloscope trace forming " + words : "Oscilloscope trace",
  );

  function drawGrid() {
    const step = Math.max(
      36 * sizeScale,
      number(V.gridSpacing, 108) * L.grid * sizeScale,
    );
    const cx = W / 2;
    const left = side / 2;
    const right = W - left;

    grid.clearRect(0, 0, W, H);
    grid.save();
    grid.beginPath();
    grid.rect(left, topSafe, right - left, activeHeight);
    grid.clip();
    grid.strokeStyle = V.graticule;
    grid.lineWidth = 1.5 * sizeScale;
    grid.beginPath();

    const firstX = cx - Math.ceil((cx - left) / step) * step;
    for (let x = firstX; x <= right; x += step) {
      if (Math.abs(x - cx) < 0.1) continue;
      grid.moveTo(x, topSafe);
      grid.lineTo(x, activeBottom);
    }

    const firstY =
      signalCenter - Math.ceil((signalCenter - topSafe) / step) * step;
    for (let y = firstY; y <= activeBottom; y += step) {
      if (Math.abs(y - signalCenter) < 0.1) continue;
      grid.moveTo(left, y);
      grid.lineTo(right, y);
    }
    grid.stroke();

    grid.lineWidth = 1.8 * sizeScale;
    grid.beginPath();
    grid.moveTo(cx, topSafe);
    grid.lineTo(cx, activeBottom);
    grid.moveTo(left, signalCenter);
    grid.lineTo(right, signalCenter);
    grid.stroke();

    const tick = step / 5;
    grid.lineWidth = 1.4 * sizeScale;
    grid.beginPath();

    const firstTickX = cx - Math.ceil((cx - left) / tick) * tick;
    for (let x = firstTickX; x <= right; x += tick) {
      const major = Math.abs(
        (x - cx) / step - Math.round((x - cx) / step),
      ) < 0.01;
      const length = (major ? 9 : 4) * sizeScale;
      grid.moveTo(x, signalCenter - length);
      grid.lineTo(x, signalCenter + length);
    }

    const firstTickY =
      signalCenter - Math.ceil((signalCenter - topSafe) / tick) * tick;
    for (let y = firstTickY; y <= activeBottom; y += tick) {
      const major = Math.abs(
        (y - signalCenter) / step -
        Math.round((y - signalCenter) / step),
      ) < 0.01;
      const length = (major ? 9 : 4) * sizeScale;
      grid.moveTo(cx - length, y);
      grid.lineTo(cx + length, y);
    }
    grid.stroke();

    grid.globalCompositeOperation = "destination-in";

    const horizontal = grid.createLinearGradient(left, 0, right, 0);
    horizontal.addColorStop(0, "rgba(0,0,0,0)");
    horizontal.addColorStop(0.14, "rgba(0,0,0,0.65)");
    horizontal.addColorStop(0.5, "rgba(0,0,0,1)");
    horizontal.addColorStop(0.86, "rgba(0,0,0,0.65)");
    horizontal.addColorStop(1, "rgba(0,0,0,0)");
    grid.fillStyle = horizontal;
    grid.fillRect(left, topSafe, right - left, activeHeight);

    const vertical =
      grid.createLinearGradient(0, topSafe, 0, activeBottom);
    vertical.addColorStop(0, "rgba(0,0,0,0)");
    vertical.addColorStop(0.16, "rgba(0,0,0,0.55)");
    vertical.addColorStop(0.5, "rgba(0,0,0,1)");
    vertical.addColorStop(0.84, "rgba(0,0,0,0.65)");
    vertical.addColorStop(1, "rgba(0,0,0,0)");
    grid.fillStyle = vertical;
    grid.fillRect(left, topSafe, right - left, activeHeight);
    grid.restore();
  }

  let cursor = (W - wordWidth) / 2;
  let glyphIndex = 0;
  const raw = [{ x: traceLeft, h: 0, g: -1 }];
  const push = (x, h, g = -1) => raw.push({ x, h, g });
  push(cursor, 0);

  characters.forEach((ch, index) => {
    if (ch === " ") {
      cursor += spaceWidth * unitX;
      push(cursor, 0);
    } else {
      const glyph = FONT[ch];
      const origin = cursor;
      const g = glyphIndex++;
      push(origin, 0, g);

      glyph.p.forEach(([x, y]) => {
        push(origin + x * unitX, y * capHeight, g);
      });

      const last = glyph.p[glyph.p.length - 1];
      if (Math.abs(last[1]) > 0.0001) {
        for (let i = glyph.p.length - 2; i >= 0; i--) {
          const [x, y] = glyph.p[i];
          push(origin + x * unitX, y * capHeight, g);
        }
      }

      cursor = origin + glyph.w * unitX;
      push(cursor, 0, g);
    }

    if (index < characters.length - 1) {
      cursor += tracking * unitX;
      push(cursor, 0);
    }
  });
  push(traceRight, 0);

  const cumulative = [0];
  for (let i = 1; i < raw.length; i++) {
    cumulative[i] = cumulative[i - 1] + Math.hypot(
      raw[i].x - raw[i - 1].x,
      raw[i].h - raw[i - 1].h,
    );
  }

  const totalLength = cumulative[cumulative.length - 1];
  const pointCount = Math.round(
    clamp(Math.ceil(totalLength / 3), 1400, 4200),
  );
  const wordPoints = [];
  let segment = 1;

  for (let i = 0; i < pointCount; i++) {
    const distance = totalLength * i / (pointCount - 1);
    while (
      segment < raw.length - 1 &&
      cumulative[segment] < distance
    ) segment++;

    const a = raw[segment - 1];
    const b = raw[segment];
    const span = cumulative[segment] - cumulative[segment - 1];
    const p = span > 0
      ? clamp((distance - cumulative[segment - 1]) / span)
      : 0;

    wordPoints.push({
      x: lerp(a.x, b.x, p),
      h: lerp(a.h, b.h, p),
      g: b.g >= 0 ? b.g : a.g,
    });
  }

  const letterTimings = Array.from({ length: glyphCount }, (_, index) => {
    const order = glyphCount > 1 ? index / (glyphCount - 1) : 1;
    const startFrame = 83 + 11 * order;
    return {
      start: K * startFrame / 105,
      peak: K * (startFrame + 11) / 105,
    };
  });
  const letterRises = new Float32Array(glyphCount);

  function frameAt(t) {
    return clamp(t / K) * 105;
  }

  function impactAt(t) {
    return t < K ? 0 : Math.exp(-(t - K) / 0.075);
  }

  function letterRise(t, timing) {
    if (t <= timing.start) return 0;
    if (t < timing.peak) {
      const p = clamp(
        (t - timing.start) / Math.max(0.001, timing.peak - timing.start),
      );
      return (1 + overshoot) * (1 - Math.pow(1 - p, 3));
    }

    // One peak, followed by one short, monotonic return to final height.
    return 1 + overshoot * (1 - smooth((t - timing.peak) / 0.12));
  }

  function geometry(realTime, out) {
    const t = Math.max(0, realTime);
    const frame = frameAt(t);
    const designTime = t <= K ? t / timeScale : D + t - K;
    const lock = clamp(frame / 14);
    const phase =
      -Math.PI * 1.5 * Math.pow(1 - lock, 3) +
      0.025 * lock * Math.sin(designTime * TAU * 0.4);

    const foldProgress = clamp((frame - 22) / 12);
    const fold = 1 - Math.pow(1 - foldProgress, 3);
    const release = smooth((frame - 60) / 12);
    const figureMix = fold * (1 - release);

    const contraction = smooth((frame - 40) / 24);
    const radiusX = figureRX * (1 - contraction * 0.66);
    const radiusY = figureRY * (1 - contraction * 0.76);
    const rotation = L.turn *
      Math.sin(-0.8 + clamp((frame - 22) / 50) * 3.6);
    const cosR = Math.cos(rotation);
    const sinR = Math.sin(rotation);
    const drift = 0.11 *
      Math.sin(clamp((frame - 32) / 40) * Math.PI * 1.4);

    let amplitude = waveAmplitude *
      (1 + 0.032 * Math.sin(designTime * TAU * 0.8));

    if (frame >= 60) {
      const ring = clamp((frame - 64) / 15);
      amplitude = waveAmplitude * 0.32 *
        Math.pow(1 - ring, 1.5) * Math.cos(Math.PI * ring);
    }

    const wordMix = smooth((frame - 76) / 7);
    const zeroLine = lerp(
      signalCenter,
      wordBaseline,
      smooth((frame - 74) / 9),
    );

    for (let g = 0; g < glyphCount; g++) {
      letterRises[g] = letterRise(t, letterTimings[g]);
    }

    for (let i = 0; i < pointCount; i++) {
      const u = i / (pointCount - 1);
      let x = traceLeft + traceWidth * u;
      let y = zeroLine -
        amplitude * Math.sin(TAU * cycles * u + phase);

      if (figureMix > 0) {
        // The entire beam folds into the closed 2:3 curve. There are
        // no lead-in segments joining its center to the screen edges.
        const theta = u * TAU;
        const a = radiusX * Math.sin(2 * theta);
        const b = radiusY * Math.sin(3 * theta + drift);
        const lx = W / 2 + a * cosR - b * sinR;
        const ly = signalCenter + a * sinR + b * cosR;
        x = lerp(x, lx, figureMix);
        y = lerp(y, ly, figureMix);
      }

      if (wordMix > 0) {
        const word = wordPoints[i];
        const rise = word.g >= 0 ? letterRises[word.g] : 0;
        x = lerp(x, word.x, wordMix);
        y = lerp(y, wordBaseline - word.h * rise, wordMix);
      }

      out[i * 2] = x;
      out[i * 2 + 1] = y;
    }

    return out;
  }

  const current = new Float32Array(pointCount * 2);
  const trailBuffers = Array.from(
    { length: persistenceFrames },
    () => new Float32Array(pointCount * 2),
  );

  function stroke(
    points, width, color, alpha, blur = 0,
    start = 0, end = pointCount,
  ) {
    if (alpha <= 0 || end - start < 2) return;
    beam.globalAlpha = clamp(alpha);
    beam.lineWidth = width;
    beam.strokeStyle = color;
    beam.shadowColor = color;
    beam.shadowBlur = blur;
    beam.lineCap = "round";
    beam.lineJoin = "round";
    beam.beginPath();
    beam.moveTo(points[start * 2], points[start * 2 + 1]);

    for (let i = start + 1; i < end; i++) {
      beam.lineTo(points[i * 2], points[i * 2 + 1]);
    }
    beam.stroke();
  }

  function hotSection(start, end, width) {
    stroke(
      current,
      width * 1.18,
      V.phosphor,
      0.76,
      strokeWidth,
      start,
      end,
    );
    stroke(
      current,
      width * 0.78,
      V.beamCore,
      1,
      0,
      start,
      end,
    );
  }

  function renderAt(realTime) {
    const t = clamp(number(realTime, 0), 0, duration);
    const frame = frameAt(t);
    const landed = t >= K;
    const impact = impactAt(t);
    const foldHit = frame >= 34 && frame < 42
      ? Math.exp(-(frame - 34) / 2)
      : 0;
    const lockHit = frame >= 14 && frame < 22
      ? Math.exp(-(frame - 14) / 1.8)
      : 0;
    const energy =
      impact * (0.72 + keyPunch * 2) +
      foldHit * 0.14 +
      lockHit * 0.06;

    beam.clearRect(0, 0, W, H);
    beam.save();
    beam.beginPath();
    beam.rect(0, topSafe, W, activeHeight);
    beam.clip();

    if (impact > 0.001) {
      beam.save();
      beam.translate(W / 2, textCenter);
      beam.scale(W * 0.56, Math.max(capHeight * 1.1, H * 0.16));
      const exposure = beam.createRadialGradient(0, 0, 0, 0, 0, 1);
      exposure.addColorStop(0, V.phosphor);
      exposure.addColorStop(1, "rgba(0,0,0,0)");
      beam.globalAlpha = impact * (0.08 + keyPunch * 0.35);
      beam.fillStyle = exposure;
      beam.fillRect(-1, -1, 2, 2);
      beam.restore();
    }

    // Persistence follows the contraction and ring-down, then clears
    // before the first readable letter. No former figure crosses text.
    const trailGain = 1 - smooth((frame - 79) / 4);
    if (trailGain > 0) {
      for (let k = persistenceFrames; k >= 1; k--) {
        const past = t - k / fps;
        if (past < 0) continue;

        stroke(
          geometry(past, trailBuffers[k - 1]),
          strokeWidth * (1 + k * 0.12),
          V.phosphor,
          persistenceStrength * trailGain * Math.pow(0.48, k - 1),
        );
      }
    }

    geometry(t, current);

    const lasting = landed ? 1.16 : 1;
    const breathing = 0.97 + 0.03 * Math.sin(t * TAU * scanSpeed);
    const width = strokeWidth * lasting * (1 + energy * 0.42);

    stroke(
      current,
      width * 1.03,
      V.phosphor,
      glowStrength * (0.5 + impact * 0.18) * breathing,
      strokeWidth * (1.05 + impact * 0.12),
    );
    stroke(current, width, V.phosphor, 0.94 * breathing);
    stroke(
      current,
      width * (0.5 + impact * 0.14),
      V.beamCore,
      landed ? 0.96 : 0.86,
    );

    // Geometry stays fixed through the hold; beam energy keeps moving.
    const progress = ((t * scanSpeed) % 1 + 1) % 1;
    const windowPoints = Math.max(4, Math.floor(pointCount * 0.13));
    const start = Math.floor(progress * pointCount);
    const unwrappedEnd = start + windowPoints;

    hotSection(start, Math.min(pointCount, unwrappedEnd), width);
    if (unwrappedEnd > pointCount) {
      hotSection(0, unwrappedEnd - pointCount, width);
    }

    const head = (unwrappedEnd - 1) % pointCount;
    beam.globalAlpha = 1;
    beam.fillStyle = V.beamCore;
    beam.shadowColor = V.phosphor;
    beam.shadowBlur = strokeWidth;
    beam.beginPath();
    beam.arc(
      current[head * 2],
      current[head * 2 + 1],
      width * 0.54,
      0,
      TAU,
    );
    beam.fill();

    beam.restore();
  }

  drawGrid();

  const readoutMask = $("osc-readout-mask");
  const readout = $("osc-readout");
  readout.textContent = readoutText;
  readout.style.fontSize = readoutSize + "px";

  if (readoutText) {
    fit(readout, textRoom, minimumText);
    const measuredSize = parseFloat(getComputedStyle(readout).fontSize);
    const readoutHeight = Math.ceil(measuredSize * 1.4);
    readoutMask.style.height = readoutHeight + "px";
    readoutMask.style.top = Math.min(
      wordBaseline + readoutGap,
      activeBottom - readoutHeight - guard,
    ) + "px";
  } else {
    readoutMask.style.display = "none";
  }

  gsap.set(readoutMask, { autoAlpha: 0 });

  const tl = gsap.timeline({ paused: true });
  const build = gsap.timeline();
  const clock = { time: 0 };

  build.fromTo(
    clock,
    { time: 0 },
    {
      time: D,
      duration: D,
      ease: "none",
      modifiers: {
        time(value) {
          renderAt(Number(value) * timeScale);
          return value;
        },
      },
    },
    0,
  );

  build.timeScale(1 / timeScale);
  tl.add(build, 0);

  const post = Math.max(0, duration - K);
  if (post > 0) {
    tl.fromTo(
      clock,
      { time: D },
      {
        time: D + post,
        duration: post,
        ease: "none",
        immediateRender: false,
        modifiers: {
          time(value) {
            renderAt(K + Number(value) - D);
            return value;
          },
        },
      },
      K,
    );
  }

  if (readoutText && hold >= 0.4) {
    const at = K + 0.16;
    tl.set(readoutMask, { autoAlpha: 1 }, at);
    tl.fromTo(
      readout,
      { yPercent: 110 },
      {
        yPercent: 0,
        duration: 0.14,
        ease: "power3.out",
        immediateRender: false,
      },
      at,
    );
  }

  const axisPercent = signalCenter / H * 100;
  const closed =
    `polygon(0% ${axisPercent}%,100% ${axisPercent}%,` +
    `100% ${axisPercent}%,0% ${axisPercent}%)`;
  const open = "polygon(0% 0%,100% 0%,100% 100%,0% 100%)";

  gsap.set(stageEl, { clipPath: overlay ? closed : open });

  if (overlay) {
    tl.fromTo(
      stageEl,
      { clipPath: closed },
      {
        clipPath: open,
        duration: Math.min(0.18, K * 0.1),
        ease: "power4.out",
        immediateRender: false,
      },
      0,
    );
  }

  if (exit > 0) {
    tl.fromTo(
      stageEl,
      { clipPath: open },
      {
        clipPath: closed,
        duration: Math.max(0, exit - 1 / fps),
        ease: "power3.in",
        immediateRender: false,
      },
      K + hold,
    );
  }

  window.addEventListener("hf-seek", (event) => {
    const time = Number(event.detail && event.detail.time);
    if (Number.isFinite(time)) renderAt(time);
  });

  window.__timelines = window.__timelines || {};
  window.__timelines["block"] = tl;
  renderAt(window.__hfThreeTime || 0);
});