CA.ready(() => {
  const {
    vars: V, stage: S, safe, time: T, variant,
    make, fit, seeded, grainUrl,
  } = CA;

  const $ = (id) => document.getElementById(id);
  const NS = "http://www.w3.org/2000/svg";
  const svg = (tag, attrs, parent) => {
    const el = document.createElementNS(NS, tag);
    Object.entries(attrs || {}).forEach(([key, value]) => {
      el.setAttribute(key, String(value));
    });
    if (parent) parent.appendChild(el);
    return el;
  };
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const number = (value, fallback) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  };

  const W = S.w;
  const H = S.h;
  const full = variant === "full";
  const top = variant === "top";
  const short = !full && H < 780;
  const minText = full ? 40 : 32;
  const stageEl = $("stage");
  const seed = number(V.seed, 17);
  const random = seeded(seed);
  const D = T.design;
  const at = (seconds) => seconds * D / 2.9;

  // These are separate compositions, not a scaled portrait layout.
  const profile = full
    ? {
        side: 64,
        ruleTop: 230,
        bottom: 300,
        headline: number(V.headlineFontSize, 174),
        body: number(V.bodyFontSize, 52),
        note: number(V.noteFontSize, 240),
        photoPercent: number(V.photoWidthPercent, 60),
        sentences: number(V.excerptSentences, 2),
        gutterScale: 1,
        indentScale: 1,
        noteHeight: 280,
        noteGap: 32,
        headerGap: 24,
        circleScale: 1,
      }
    : top
      ? {
          side: 44,
          ruleTop: 24,
          bottom: 28,
          headline: number(V.compactHeadlineFontSize, 116),
          body: number(V.compactBodyFontSize, 44),
          note: number(V.compactNoteFontSize, 208),
          photoPercent: number(V.compactPhotoWidthPercent, 60),
          sentences: number(V.compactExcerptSentences, 1),
          gutterScale: 0.9,
          indentScale: 0.68,
          noteHeight: 222,
          noteGap: 24,
          headerGap: 18,
          circleScale: 0.82,
        }
      : {
          side: 36,
          ruleTop: 20,
          bottom: 28,
          headline: number(V.overlayHeadlineFontSize, 110),
          body: number(V.overlayBodyFontSize, 42),
          note: number(V.overlayNoteFontSize, 200),
          photoPercent: number(V.overlayPhotoWidthPercent, 63),
          sentences: number(V.overlayExcerptSentences, 1),
          gutterScale: 0.8,
          indentScale: 0.58,
          noteHeight: 210,
          noteGap: 22,
          headerGap: 16,
          circleScale: 0.78,
        };

  const side = Math.max(
    profile.side,
    Math.min(number(safe.side, 0), full ? 80 : profile.side + 8),
  );
  const innerW = W - side * 2;
  const ruleY = full
    ? Math.max(profile.ruleTop, number(safe.top, 0))
    : Math.max(
        profile.ruleTop,
        Math.min(number(safe.top, 0), profile.ruleTop + 6),
      );
  const bottom = full
    ? H - Math.max(profile.bottom, number(safe.bottom, 0))
    : H - Math.max(
        profile.bottom,
        Math.min(number(safe.bottom, 0), profile.bottom + 8),
      );

  Object.entries({
    "--ml-paper": V.paperColor,
    "--ml-ink": V.inkColor,
    "--ml-pen": V.penColor,
    "--ml-sea-dark": V.seaDark,
  }).forEach(([key, value]) => stageEl.style.setProperty(key, value));
  stageEl.style.background = V.paperColor;

  const grain = clamp(number(V.grainStrength, 0.09), 0, 0.25);
  [
    ["ml-paper-grain", 240, 0.6, 1, grain * 0.8],
    ["ml-tooth", 180, 0.65, 2, grain * 0.65],
    ["ml-film-grain", 190, 0.8, 3, grain * 1.5],
  ].forEach(([id, size, amount, offset, opacity]) => {
    $(id).style.backgroundImage = grainUrl(size, amount, seed + offset);
    $(id).style.opacity = opacity;
  });

  const fibres = $("ml-fibres");
  fibres.setAttribute("viewBox", `0 0 ${W} ${H}`);
  for (let i = 0; i < 135; i++) {
    const x = random() * W;
    const y = random() * H;
    const length = 18 + random() * 95;
    svg("path", {
      d: `M${x} ${y} q${length * 0.35} ${random() * 3 - 1.5} ${length} ${random() * 5 - 2.5}`,
      fill: "none",
      stroke: V.inkColor,
      "stroke-width": 0.45 + random() * 0.45,
      opacity: grain * (0.2 + random() * 0.25),
    }, fibres);
  }

  // Balance whole words. A lone last word is heavily penalized.
  const wrapText = (text, width, measureWidth) => {
    const words = String(text).trim().split(/\s+/).filter(Boolean);
    if (!words.length) return { lines: [], fits: true, orphan: false };

    const cache = new Map();
    const widthOf = (value) => {
      if (!cache.has(value)) cache.set(value, measureWidth(value));
      return cache.get(value);
    };
    const count = words.length;
    const costs = Array(count + 1).fill(Infinity);
    const next = Array(count).fill(count);
    costs[count] = 0;

    for (let i = count - 1; i >= 0; i--) {
      for (let j = i + 1; j <= count; j++) {
        const textWidth = widthOf(words.slice(i, j).join(" "));
        if (textWidth > width && j > i + 1) break;
        if (textWidth > width) continue;

        const last = j === count;
        const loneEnd = last && j - i === 1 && i > 0;
        const slack = width - textWidth;
        const cost =
          slack * slack * (last ? 0.22 : 1) +
          (loneEnd ? width * width * 100 : 0) +
          costs[j];

        if (cost < costs[i]) {
          costs[i] = cost;
          next[i] = j;
        }
      }
    }

    if (!Number.isFinite(costs[0])) {
      return { lines: [words.join(" ")], fits: false, orphan: false };
    }

    const lines = [];
    let cursor = 0;
    while (cursor < count) {
      const end = next[cursor];
      lines.push(words.slice(cursor, end).join(" "));
      cursor = end;
    }

    return {
      lines,
      fits: true,
      orphan: lines.length > 1 &&
        lines[lines.length - 1].split(/\s+/).length === 1,
    };
  };

  const h1 = $("ml-headline-1");
  const h2 = $("ml-headline-2");
  const title1 = String(V.headlineLine1 || "").replace(/\s+/g, " ").trim();
  const title2 = String(V.headlineLine2 || "").replace(/\s+/g, " ").trim();
  const indent = Math.min(
    innerW * 0.18,
    Math.max(0, number(V.headlineIndent, 91)) *
      (short ? 0.5 : profile.indentScale),
  );

  const requestedHeadline = Math.max(
    minText,
    short ? Math.min(profile.headline, H * 0.115) : profile.headline,
  );

  h1.textContent = title1;
  h2.textContent = title2;
  [h1, h2].forEach((el) => {
    el.style.fontSize = requestedHeadline + "px";
  });

  const headlineSizes = [requestedHeadline];
  if (title1) headlineSizes.push(fit(h1, innerW - 4, minText));
  if (title2) headlineSizes.push(fit(h2, innerW - indent - 4, minText));
  let headlinePx = Math.max(minText, Math.min(...headlineSizes));

  const composeHeadline = (px) => {
    const wrap = (el, text, width) => {
      el.style.fontSize = px + "px";
      const result = wrapText(text, width, (candidate) => {
        el.textContent = candidate;
        return el.getBoundingClientRect().width;
      });
      el.textContent = result.lines.join("\n");
      return result;
    };
    const first = wrap(h1, title1, innerW - 4);
    const second = wrap(h2, title2, innerW - indent - 4);
    return {
      first,
      second,
      height: (first.lines.length + second.lines.length) * px * 1.14,
    };
  };

  let heading = composeHeadline(headlinePx);
  const headingBudget = full
    ? (bottom - ruleY) * 0.31
    : H * 0.29;

  while (
    headlinePx > minText &&
    (
      heading.height > headingBudget ||
      !heading.first.fits ||
      !heading.second.fits ||
      heading.first.orphan ||
      heading.second.orphan
    )
  ) {
    headlinePx = Math.max(minText, headlinePx - 2);
    heading = composeHeadline(headlinePx);
  }

  const headlineY = ruleY + (full ? 22 : 18);
  const firstH = heading.first.lines.length * headlinePx * 1.14;
  const secondH = heading.second.lines.length * headlinePx * 1.14;

  const placeHeadline = (mask, x, y, width, height) => {
    Object.assign(mask.style, {
      left: x + "px",
      top: y - 12 + "px",
      width: width + "px",
      height: Math.max(1, height + 24) + "px",
      display: height ? "block" : "none",
    });
  };

  placeHeadline(
    $("ml-headline-mask-1"),
    side, headlineY, innerW, firstH,
  );
  placeHeadline(
    $("ml-headline-mask-2"),
    side + indent, headlineY + firstH, innerW - indent, secondH,
  );

  const photoY = headlineY + firstH + secondH + profile.headerGap;

  const rule = $("ml-rule");
  const ruleThickness = clamp(number(V.ruleThickness, 2), 1, 5);
  Object.assign(rule.style, {
    left: side + "px",
    top: ruleY + "px",
    width: innerW + "px",
    height: "8px",
  });
  rule.setAttribute("viewBox", `0 0 ${innerW} 8`);
  const ruleStroke = $("ml-rule-stroke");
  ruleStroke.setAttribute("d", `M0 4 H${innerW}`);
  ruleStroke.setAttribute("stroke-width", ruleThickness);

  const noteText = String(V.note || "").trim();
  const hasNote = Boolean(noteText);
  const penWidth = clamp(number(V.penWidth, 5.8), 1.5, 10);

  // [advance, actual pen strokes, late dots and crossbars].
  const glyphs = {
    a: [37, ["M0 60 C7 55 13 38 24 39 C33 40 26 61 17 67 C5 74 7 54 15 45 C21 36 28 37 27 44 L23 62 C21 73 31 70 37 60"]],
    b: [36, ["M0 60 C12 46 27 13 19 10 C9 7 7 60 12 67 C19 77 34 58 29 46 C24 36 14 44 14 55 C14 68 28 69 36 60"]],
    c: [33, ["M0 60 C9 55 13 37 25 39 C31 40 29 46 26 47 C21 38 7 46 9 61 C11 74 25 69 33 60"]],
    d: [39, ["M0 60 C8 52 16 36 26 40 C33 44 21 69 12 68 C3 67 12 44 25 41 C30 39 37 12 32 10 C25 7 22 54 25 65 C27 73 34 68 39 60"]],
    e: [33, ["M0 60 C11 55 28 49 22 41 C16 34 7 42 7 54 C6 73 24 73 33 60"]],
    f: [30, ["M0 60 C15 46 31 15 23 10 C13 4 11 29 13 56 C16 83 8 101 4 91 C1 82 20 63 30 60"], ["M5 43 Q16 39 29 40"]],
    g: [38, ["M0 60 C7 52 16 37 26 40 C33 45 22 69 13 67 C4 64 13 43 26 41 C28 52 25 82 17 93 C8 106 0 92 14 82 C22 76 32 70 38 60"]],
    h: [39, ["M0 60 C12 43 27 13 19 10 C10 6 8 50 8 68 C12 53 22 34 28 42 C34 49 21 66 29 68 C33 69 36 64 39 60"]],
    i: [22, ["M0 60 C6 55 12 45 13 41 C11 49 7 64 12 68 C15 70 19 65 22 60"], ["M15 27 l0.7 -0.6"]],
    j: [25, ["M0 60 C8 53 16 43 17 40 C15 58 14 85 6 94 C-1 103 -8 92 2 83 C11 76 21 67 25 60"], ["M19 26 l0.8 -0.6"]],
    k: [36, ["M0 60 C12 42 26 12 18 10 C10 8 8 50 8 68 M9 58 C17 43 29 35 28 44 C27 52 17 55 12 55 C25 53 18 70 28 68 C31 67 34 63 36 60"]],
    l: [26, ["M0 60 C12 43 27 15 19 10 C10 5 6 39 9 60 C11 75 20 68 26 60"]],
    m: [55, ["M0 60 C6 53 11 42 13 40 L9 68 C17 48 25 35 29 43 C32 49 26 62 25 68 C35 47 42 35 46 43 C49 51 37 67 46 68 C50 68 53 63 55 60"]],
    n: [39, ["M0 60 C6 54 11 43 13 40 L9 68 C17 49 25 34 30 43 C34 51 21 67 30 68 C34 68 37 63 39 60"]],
    o: [36, ["M0 60 C9 53 14 37 24 39 C35 42 26 68 16 69 C4 70 8 42 23 40 C21 53 28 61 36 60"]],
    p: [38, ["M0 60 C7 53 12 42 14 39 L5 96 M11 60 C19 39 30 34 32 46 C35 60 23 72 17 66 C14 60 24 58 38 60"]],
    q: [38, ["M0 60 C9 49 19 35 27 41 C34 47 22 71 13 67 C4 63 14 43 27 41 L21 96 M23 77 Q30 70 38 60"]],
    r: [31, ["M0 60 C7 52 12 41 14 38 C11 50 22 42 24 39 C29 40 18 58 23 66 C25 70 29 64 31 60"]],
    s: [35, ["M0 60 C11 57 27 50 28 43 C29 35 19 33 15 40 C7 52 35 49 29 61 C24 73 9 73 5 65 C13 70 27 68 35 60"]],
    t: [28, ["M0 60 C10 49 20 24 21 20 C18 35 10 58 13 66 C16 73 24 66 28 60"], ["M6 42 Q17 39 29 40"]],
    u: [39, ["M0 60 C7 53 13 43 14 40 C11 49 6 65 13 68 C20 71 28 52 30 41 C26 54 22 68 30 68 C34 67 37 63 39 60"]],
    v: [36, ["M0 60 C6 54 11 43 13 40 C10 52 9 67 15 68 C24 69 34 43 29 40 C24 38 25 58 36 60"]],
    w: [51, ["M0 60 C6 53 11 43 13 40 C9 54 9 67 15 68 C23 69 29 48 29 41 C24 54 25 67 31 68 C41 69 49 44 44 40 C39 37 39 58 51 60"]],
    x: [34, ["M0 60 C9 54 11 40 16 41 C22 43 17 65 26 67 C29 68 32 63 34 60", "M27 39 Q21 54 7 71"]],
    y: [39, ["M0 60 C7 53 12 43 13 40 C9 55 7 67 14 68 C23 69 29 48 30 41 C27 65 23 86 15 95 C6 103 0 91 12 82 C22 75 33 69 39 60"]],
    z: [35, ["M0 60 C10 50 17 38 28 41 C22 48 13 56 8 62 C24 55 32 60 26 70 C18 83 5 97 1 89 C-2 82 22 73 35 60"]],
    A: [56, ["M0 72 C13 48 28 14 36 10 L26 70 M12 49 Q29 43 47 46 M26 70 Q39 73 56 60"]],
    B: [53, ["M3 69 Q18 38 22 12 M7 15 C53 -1 55 30 25 40 C63 27 59 65 19 70 Q9 72 3 69"]],
    C: [54, ["M47 24 C48 4 27 7 15 25 C-5 53 5 78 28 69 Q43 64 54 51"]],
    D: [57, ["M6 70 Q18 39 22 13 M9 17 C48 -3 67 25 48 53 C37 69 18 75 6 70"]],
    E: [48, ["M43 19 C24 2 8 20 18 32 C24 39 32 36 36 32 C18 35 -2 55 9 67 C20 79 41 64 48 55"]],
    F: [49, ["M8 70 Q20 36 24 12 M5 19 Q28 8 49 15 M14 43 Q28 37 41 39"]],
    G: [58, ["M48 23 C43 1 20 15 10 36 C-4 64 10 79 31 66 Q45 56 48 41 L31 44 M48 41 Q42 71 58 60"]],
    H: [60, ["M5 70 Q17 35 23 11 M41 70 Q48 32 57 12 M13 44 Q34 37 52 40"]],
    I: [32, ["M4 18 Q20 11 31 15 M20 14 Q15 45 8 69 M0 72 Q15 66 27 69"]],
    J: [42, ["M7 19 Q27 10 41 14 M32 15 C30 45 21 81 6 72 C-2 66 4 55 10 53"]],
    K: [56, ["M4 70 Q14 37 23 12 M52 13 Q32 37 16 45 C37 38 30 73 56 61"]],
    L: [47, ["M1 63 C15 46 30 13 21 10 C10 6 11 36 13 53 C14 69 30 75 47 60 M3 72 Q20 62 38 69"]],
    M: [69, ["M2 71 Q11 38 24 12 L24 64 Q40 28 50 13 L43 68 Q57 43 69 17"]],
    N: [61, ["M2 71 Q13 36 24 13 C21 43 29 56 39 69 Q45 34 61 13"]],
    O: [57, ["M41 14 C20 2 -1 38 6 60 C14 84 46 65 51 39 C56 15 42 6 28 17"]],
    P: [51, ["M5 71 Q17 38 23 13 M9 17 C47 -2 61 21 40 38 Q29 46 18 43"]],
    Q: [60, ["M41 14 C20 2 -1 38 6 60 C14 84 46 65 51 39 C56 15 42 6 28 17", "M26 58 Q40 78 60 72"]],
    R: [57, ["M4 71 Q17 38 23 13 M9 17 C47 -2 61 21 40 38 Q29 46 18 43 C36 39 29 74 57 61"]],
    S: [49, ["M43 23 C52 4 25 6 16 22 C4 42 48 35 38 57 C29 79 3 74 6 58"]],
    T: [54, ["M1 20 Q28 8 54 15 M31 14 Q23 45 18 71"]],
    U: [60, ["M12 14 C4 39 -1 66 13 69 C30 74 44 37 49 13 C43 34 34 65 44 68 Q52 70 60 60"]],
    V: [55, ["M7 14 C3 34 6 56 13 70 Q39 43 55 13"]],
    W: [74, ["M9 14 C1 38 4 59 12 70 Q34 40 39 14 C31 40 32 61 40 70 Q63 44 74 14"]],
    X: [57, ["M9 16 C27 9 21 69 49 66 M54 12 Q27 43 3 73"]],
    Y: [56, ["M8 14 C1 48 16 60 34 36 Q43 25 49 13 C41 47 33 78 16 91 C3 100 -2 86 12 78"]],
    Z: [53, ["M4 20 Q27 9 51 15 Q27 43 4 70 Q31 61 53 68"]],
    "0": [39, ["M26 21 C8 15 -1 65 13 69 C31 75 44 23 26 21 Z"]],
    "1": [28, ["M4 35 L22 21 L12 70"]],
    "2": [38, ["M5 35 C13 11 43 20 28 40 L4 69 Q21 63 38 68"]],
    "3": [37, ["M6 28 C28 12 43 29 20 43 C46 38 35 76 7 66"]],
    "4": [39, ["M27 21 L3 52 L37 49 M30 22 L20 71"]],
    "5": [37, ["M36 22 L15 24 L10 44 C43 30 40 77 6 66"]],
    "6": [38, ["M33 22 C13 15 -1 67 15 70 C33 73 43 41 24 42 Q11 42 8 56"]],
    "7": [37, ["M3 25 L36 22 Q19 44 10 72"]],
    "8": [39, ["M25 43 C-3 32 20 11 31 25 C43 42 -2 46 8 65 C19 84 49 51 25 43 Z"]],
    "9": [38, ["M29 45 C13 66 0 39 16 25 C36 8 37 49 15 74"]],
    ".": [15, [], ["M6 68 l0.8 -0.7"]],
    ",": [16, ["M8 67 Q10 73 3 79"]],
    "!": [19, ["M15 20 L8 53"], ["M6 68 l0.8 -0.7"]],
    "?": [32, ["M4 32 C9 13 39 19 25 37 Q15 46 14 53"], ["M11 68 l0.8 -0.7"]],
    "'": [15, ["M11 22 L6 35"]],
    "\"": [23, ["M10 21 L5 34", "M21 21 L16 34"]],
    "-": [29, ["M4 49 Q15 46 26 47"]],
    ":": [17, [], ["M8 44 l0.8 -0.7", "M5 67 l0.8 -0.7"]],
    ";": [17, ["M6 66 Q8 73 1 79"], ["M9 43 l0.8 -0.7"]],
    "(": [23, ["M23 16 C6 31 0 62 9 81"]],
    ")": [23, ["M9 16 C25 32 18 62 0 81"]],
    "&": [49, ["M42 62 C27 81 -1 66 14 48 C26 35 39 24 29 18 C18 10 8 33 22 51 Q34 70 49 67 M35 47 L46 43"]],
    "/": [30, ["M29 18 L1 77"]],
  };

  const annotations = $("ml-annotations");
  annotations.setAttribute("viewBox", `0 0 ${W} ${H}`);
  annotations.setAttribute("role", "img");
  annotations.setAttribute("aria-label", noteText);
  if (!hasNote) annotations.setAttribute("aria-hidden", "true");

  const normalizedNote = noteText
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, "\"")
    .replace(/[–—]/g, "-")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");

  const noteChars = Array.from(normalizedNote);
  const noteGroup = $("ml-note");
  const mainStrokes = [];
  const lateStrokes = [];
  let cursor = 0;
  let pendingGap = 0;
  let lastWordStart = 0;

  noteChars.forEach((ch, index) => {
    if (ch === " ") {
      cursor += 24;
      lastWordStart = cursor;
      pendingGap += 0.075;
      return;
    }

    const glyph = glyphs[ch] || glyphs["?"];
    const group = svg("g", {
      transform: `translate(${cursor} ${Math.sin(index * 2.1) * 0.75})`,
    }, noteGroup);

    const addStroke = (d, late, strokeIndex) => {
      const path = svg("path", {
        d,
        class: "ml-pen-stroke",
        "stroke-width": penWidth,
      }, group);
      const record = {
        path,
        gap: late ? 0.018 : pendingGap + (strokeIndex ? 0.025 : 0.012),
        weight: Math.max(0.025, path.getTotalLength() / 650),
        widthFactor: late ? 1.06 : 1,
      };
      (late ? lateStrokes : mainStrokes).push(record);
      if (!late) pendingGap = 0;
    };

    (glyph[1] || []).forEach((d, i) => addStroke(d, false, i));
    (glyph[2] || []).forEach((d, i) => addStroke(d, true, i));
    cursor += glyph[0];
  });

  const underline = hasNote ? svg("path", {
    class: "ml-pen-stroke",
    "stroke-width": penWidth,
    d: `M${lastWordStart + 2} 99
        Q${lastWordStart + (cursor - lastWordStart) * 0.46} 92,
         ${cursor + 6} 95`,
  }, noteGroup) : null;

  const tilt = clamp(number(V.noteTilt, -7), -10, 0);
  const radians = tilt * Math.PI / 180;
  const cosine = Math.cos(radians);
  const sine = Math.sin(radians);
  const rawBox = hasNote
    ? noteGroup.getBBox()
    : { x: 0, y: 0, width: 1, height: 1 };

  const corners = [
    [rawBox.x, rawBox.y],
    [rawBox.x + rawBox.width, rawBox.y],
    [rawBox.x, rawBox.y + rawBox.height],
    [rawBox.x + rawBox.width, rawBox.y + rawBox.height],
  ].map(([x, y]) => ({
    x: x * cosine - y * sine,
    y: x * sine + y * cosine,
  }));

  const rotatedBox = {
    x: Math.min(...corners.map((p) => p.x)),
    y: Math.min(...corners.map((p) => p.y)),
    width: Math.max(...corners.map((p) => p.x)) -
      Math.min(...corners.map((p) => p.x)),
    height: Math.max(...corners.map((p) => p.y)) -
      Math.min(...corners.map((p) => p.y)),
  };

  const maxNoteH = full
    ? Math.min(profile.noteHeight, (bottom - ruleY) * 0.215)
    : Math.min(profile.noteHeight, Math.max(140, H * 0.24));

  const noteScale = Math.min(
    Math.max(96, profile.note) / 80,
    Math.max(1, innerW - 12) / Math.max(1, rotatedBox.width),
    maxNoteH / Math.max(1, rotatedBox.height),
  );

  const noteInkW = hasNote ? rotatedBox.width * noteScale : 0;
  const noteInkH = hasNote ? rotatedBox.height * noteScale : 0;
  const noteLeft = W - side - noteInkW - 4;
  const noteTop = bottom - (full ? 10 : 8) - noteInkH;
  const noteX = noteLeft - rotatedBox.x * noteScale;
  const noteY = noteTop - rotatedBox.y * noteScale;

  noteGroup.setAttribute(
    "transform",
    `translate(${noteX} ${noteY}) rotate(${tilt}) scale(${noteScale})`,
  );

  // Dash lengths remain in glyph coordinates; only pen width is compensated.
  [...mainStrokes, ...lateStrokes].forEach(({ path, widthFactor }) => {
    path.setAttribute("stroke-width", penWidth * widthFactor / noteScale);
  });
  if (underline) {
    underline.setAttribute("stroke-width", penWidth * 1.22 / noteScale);
  }

  const gutter = clamp(
    number(V.columnGutter, 60) * profile.gutterScale,
    36, 100,
  );
  const maxPhotoW = W - side - gutter - (full ? 280 : 270);
  const photoW = Math.round(Math.min(
    W * clamp(profile.photoPercent, 50, 68) / 100,
    maxPhotoW,
  ));
  const bodyX = photoW + gutter;
  const bodyW = W - side - bodyX;

  const measure = make("span", "ml-body-measure", $("ml-page"));
  const measuredWidth = (text) => {
    measure.textContent = text;
    return measure.getBoundingClientRect().width;
  };

  const captionText = String(V.caption || "").replace(/\s+/g, " ").trim();
  measure.style.fontSize = minText + "px";
  measure.style.fontStyle = "italic";
  const captionWrap = wrapText(
    captionText,
    Math.max(1, photoW - side - 12),
    measuredWidth,
  );
  const captionLineH = minText * 1.25;
  const captionLimit = full ? 3 : 2;
  const captionLines = captionWrap.fits &&
    !captionWrap.orphan &&
    captionWrap.lines.length <= captionLimit
      ? captionWrap.lines
      : [];
  const captionH = captionLines.length
    ? captionLines.length * captionLineH + 16
    : 0;

  const contentBottom = hasNote
    ? noteTop - profile.noteGap
    : bottom - 8;
  const photoH = Math.max(80, contentBottom - captionH - photoY);
  const photoBottom = photoY + photoH;

  Object.assign($("ml-photo").style, {
    left: "0px",
    top: photoY + "px",
    width: photoW + "px",
    height: photoH + "px",
  });
  $("ml-photo").setAttribute("aria-label", String(V.imageDescription || ""));

  const caption = $("ml-caption");
  caption.textContent = captionLines.join("\n");
  caption.style.fontSize = minText + "px";
  caption.style.lineHeight = captionLineH + "px";
  Object.assign($("ml-caption-mask").style, {
    left: side + "px",
    top: photoBottom + "px",
    width: Math.max(1, photoW - side) + "px",
    height: captionH + "px",
    display: captionH ? "block" : "none",
  });

  // Select a prefix of complete sentences ONCE. Unselected copy is never
  // mounted, paged, scrolled, or substituted later in the timeline.
  const paragraphs = String(V.bodyText || "")
    .replace(/\r/g, "")
    .trim()
    .split(/\n\s*\n/)
    .map((text) => text.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const sentences = [];
  const segmenter = typeof Intl.Segmenter === "function"
    ? new Intl.Segmenter("en", { granularity: "sentence" })
    : null;

  paragraphs.forEach((paragraph, paragraphIndex) => {
    const segments = segmenter
      ? Array.from(segmenter.segment(paragraph), (entry) => entry.segment)
      : paragraph.match(/[^.!?]+(?:[.!?]+["'’”)\]]*|$)/g) || [paragraph];

    segments.forEach((text) => {
      const clean = text.trim();
      if (clean) sentences.push({ text: clean, paragraph: paragraphIndex });
    });
  });

  const sentenceLimit = Math.round(clamp(profile.sentences, 1, 6));
  const requestedBody = Math.max(
    minText,
    short ? Math.min(profile.body, H * 0.055) : profile.body,
  );
  const baseBody = Math.max(40, number(V.bodyFontSize, 52));
  const bodyAvailable = photoH + Math.min(12, profile.noteGap * 0.5);
  const paragraphGap = Math.max(0, number(V.paragraphSpacing, 16)) *
    (full ? 1 : 0.8);

  const composeExcerpt = (selected, fontSize) => {
    measure.style.fontSize = fontSize + "px";
    measure.style.fontStyle = "normal";

    const lineHeight = Math.max(
      fontSize * 1.2,
      number(V.bodyLineSpacing, 64) * fontSize / baseBody,
    );
    const groups = [];
    selected.forEach((sentence) => {
      const previous = groups[groups.length - 1];
      if (previous && previous.paragraph === sentence.paragraph) {
        previous.text += " " + sentence.text;
      } else {
        groups.push({ ...sentence });
      }
    });

    const entries = [];
    let y = 0;
    let valid = true;
    groups.forEach((group, index) => {
      if (index) y += paragraphGap;
      const wrapped = wrapText(group.text, bodyW - 2, measuredWidth);
      valid = valid && wrapped.fits && !wrapped.orphan;
      wrapped.lines.forEach((text) => {
        entries.push({ text, y });
        y += lineHeight;
      });
    });

    return { entries, height: y, lineHeight, fontSize, valid, selected };
  };

  let excerpt = {
    entries: [],
    height: 0,
    lineHeight: requestedBody * 1.2,
    fontSize: requestedBody,
    valid: true,
    selected: [],
  };

  // Preserve the requested reading size whenever its first sentence fits.
  // Only reduce size, down to the output's readable floor, if that is needed
  // to retain the complete first sentence.
  for (let fontSize = requestedBody; fontSize >= minText; fontSize -= 1) {
    let best = null;
    for (
      let count = 1;
      count <= Math.min(sentenceLimit, sentences.length);
      count++
    ) {
      const candidate = composeExcerpt(sentences.slice(0, count), fontSize);
      if (!candidate.valid || candidate.height > bodyAvailable) break;
      best = candidate;
    }
    if (best) {
      excerpt = best;
      break;
    }
  }

  const body = $("ml-body");
  Object.assign(body.style, {
    left: bodyX + "px",
    top: photoY + "px",
    width: bodyW + "px",
    height: bodyAvailable + "px",
  });

  const bodyLines = [];
  excerpt.entries.forEach((entry) => {
    const mask = make("div", "ml-body-mask", body);
    Object.assign(mask.style, {
      left: "0px",
      top: entry.y - 10 + "px",
      width: bodyW + "px",
      height: excerpt.lineHeight + 20 + "px",
    });

    const line = make("span", "ml-body-line", mask, entry.text);
    Object.assign(line.style, {
      fontSize: excerpt.fontSize + "px",
      lineHeight: excerpt.lineHeight + "px",
    });
    bodyLines.push(line);
  });
  measure.remove();

  const sea = $("ml-sea");
  sea.setAttribute("viewBox", `0 0 ${photoW} ${photoH}`);
  sea.setAttribute("preserveAspectRatio", "none");

  const defs = svg("defs", {}, sea);
  const skyGradient = svg("linearGradient", {
    id: "ml-sky-gradient",
    x1: "0", y1: "0", x2: "0", y2: "1",
  }, defs);
  svg("stop", { offset: "0", "stop-color": V.skyColor }, skyGradient);
  svg("stop", { offset: "1", "stop-color": V.seaLight }, skyGradient);

  const horizon = photoH * 0.38;
  const sunX = photoW * 0.64;
  const sunR = Math.min(photoW * 0.13, photoH * 0.22);

  svg("rect", {
    width: photoW,
    height: photoH,
    fill: "url(#ml-sky-gradient)",
  }, sea);
  svg("circle", {
    cx: sunX,
    cy: horizon + sunR * 0.12,
    r: sunR,
    fill: V.seaLight,
    opacity: 0.96,
  }, sea);

  let cloud = `M-20 ${horizon - sunR * 0.27}`;
  for (let x = -20; x <= photoW + 30; x += 14) {
    cloud += ` L${x} ${horizon - sunR * 0.27 + (random() - 0.5) * 11}`;
  }
  for (let x = photoW + 30; x >= -20; x -= 14) {
    cloud += ` L${x} ${horizon - sunR * 0.05 + (random() - 0.5) * 6}`;
  }
  svg("path", {
    d: cloud + " Z",
    fill: V.seaDark,
    opacity: 0.23,
  }, sea);

  let highCloud = `M${-photoW * 0.08} ${horizon * 0.39}`;
  for (let x = -photoW * 0.08; x < photoW * 0.58; x += 19) {
    highCloud += ` L${x} ${horizon * 0.39 + Math.sin(x / 71) * 9 + random() * 7}`;
  }
  highCloud += ` L${photoW * 0.58} ${horizon * 0.47}`;
  for (let x = photoW * 0.58; x > -photoW * 0.08; x -= 19) {
    highCloud += ` L${x} ${horizon * 0.47 + Math.sin(x / 81) * 7 + random() * 6}`;
  }
  svg("path", {
    d: highCloud + " Z",
    fill: V.seaLight,
    opacity: 0.38,
  }, sea);

  svg("rect", {
    x: 0,
    y: horizon,
    width: photoW,
    height: photoH - horizon,
    fill: V.seaDark,
  }, sea);

  svg("path", {
    d: `M0 ${horizon + 1}
        L0 ${horizon - 14}
        L${photoW * 0.10} ${horizon - 21}
        L${photoW * 0.19} ${horizon - 11}
        L${photoW * 0.31} ${horizon - 6}
        L${photoW * 0.40} ${horizon + 1} Z`,
    fill: V.seaDark,
  }, sea);

  for (let i = 0; i < 13; i++) {
    const x = photoW * (0.025 + i * 0.021);
    const roof = horizon - 10 - random() * 12;
    const width = 4 + random() * 6;
    svg("path", {
      d: `M${x} ${horizon} V${roof} l${width / 2} -3 l${width / 2} 3 V${horizon} Z`,
      fill: V.seaDark,
    }, sea);
  }

  const waterMarks = svg("g", { id: "ml-water-marks" }, sea);
  for (let i = 0; i < 170; i++) {
    const depth = random();
    const y = horizon + 4 + depth * (photoH - horizon - 6);
    const x = random() * photoW;
    const length = 8 + random() * (14 + depth * 68);
    svg("path", {
      d: `M${x} ${y} q${length * 0.42} ${random() * 2 - 1} ${length} ${random() * 1.5 - 0.75}`,
      fill: "none",
      stroke: V.seaLight,
      "stroke-width": 0.8 + depth * 1.4,
      opacity: 0.04 + random() * 0.12,
    }, waterMarks);
  }

  const glimmerFar = svg("g", { id: "ml-glimmer-far" }, sea);
  const glimmerNear = svg("g", { id: "ml-glimmer-near" }, sea);

  for (let i = 0; i < 125; i++) {
    const depth = Math.pow(random(), 0.9);
    const y = horizon + 4 + depth * (photoH - horizon) * 0.96;
    const spread = 8 + depth * photoW * 0.21;
    const x = sunX + (random() - 0.5) * spread - depth * photoW * 0.055;
    const length = 3 + random() * (9 + depth * 48);
    svg("path", {
      d: `M${x - length / 2} ${y} q${length * 0.45} ${random() * 2 - 1} ${length} 0`,
      fill: "none",
      stroke: V.seaLight,
      "stroke-width": 1.1 + random() * 2.2,
      "stroke-linecap": "butt",
      opacity: 0.17 + random() * 0.55,
    }, i % 2 ? glimmerFar : glimmerNear);
  }

  // One deliberately recognizable reflection detail. All annotation geometry
  // is calculated from this same point, after the opening image push settles.
  const targetX = photoW * clamp(number(V.reflectionX, 61), 42, 76) / 100;
  const targetY = photoH * clamp(number(V.reflectionY, 73), 58, 85) / 100;
  const rx = clamp(
    number(V.focusRadius, 56) * profile.circleScale,
    28, photoW * 0.16,
  );
  const ry = rx * 0.62;

  const targetFlash = svg("g", { id: "ml-target-flash" }, sea);
  const targetFloat = svg("g", { id: "ml-target-float" }, targetFlash);
  const targetBars = [];

  [
    [-0.22, -0.25, 0.84, 0.72],
    [-0.08, 0, 1.12, 0.94],
    [0.14, 0.28, 0.66, 0.78],
  ].forEach(([dx, dy, lengthFactor, opacity], index) => {
    const length = rx * lengthFactor;
    const x = targetX + dx * rx;
    const y = targetY + dy * ry;
    const bar = svg("path", {
      d: `M${x - length / 2} ${y}
          q${length * 0.44} ${index % 2 ? -1.4 : 1.2} ${length} 0`,
      fill: "none",
      stroke: V.seaLight,
      "stroke-width": index === 1 ? 3.8 : 2.6,
      "stroke-linecap": "butt",
      opacity,
    }, targetFloat);
    targetBars.push(bar);
  });

  const focusX = targetX;
  const focusY = photoY + targetY;
  const focus = svg("g", { id: "ml-focus" }, annotations);

  const focusRing = svg("path", {
    id: "ml-focus-ring",
    "stroke-width": penWidth,
    d: `M${focusX + rx * 0.77} ${focusY - ry * 0.64}
        C${focusX + rx * 1.12} ${focusY - ry * 0.02},
         ${focusX + rx * 0.79} ${focusY + ry * 1.08},
         ${focusX - rx * 0.04} ${focusY + ry}
        C${focusX - rx * 1.19} ${focusY + ry * 0.86},
         ${focusX - rx * 1.08} ${focusY - ry * 0.88},
         ${focusX - rx * 0.04} ${focusY - ry}
        C${focusX + rx * 0.43} ${focusY - ry * 1.10},
         ${focusX + rx * 0.91} ${focusY - ry * 0.70},
         ${focusX + rx * 0.90} ${focusY - ry * 0.25}`,
  }, focus);

  // A short confirming retrace lands with the underline, without drawing
  // another circle or enlarging the target into a vague region of water.
  const ringAccent = svg("path", {
    class: "ml-pen-stroke",
    "stroke-width": penWidth * 1.3,
    d: `M${focusX + rx * 0.98} ${focusY + ry * 0.05}
        C${focusX + rx * 0.94} ${focusY + ry * 0.55},
         ${focusX + rx * 0.59} ${focusY + ry * 0.96},
         ${focusX + rx * 0.17} ${focusY + ry * 1.01}`,
  }, focus);

  const arrowEndX = focusX + rx * 0.9;
  const arrowEndY = focusY + ry * 0.32;
  const arrowStartX = noteLeft + noteInkW * 0.83;
  const arrowStartY = noteTop - 12;
  const elbowX = photoW + gutter * 0.35;
  const elbowY = noteTop - Math.max(14, profile.noteGap * 0.55);
  const loop = full ? 15 : 11;

  const arrow = svg("path", {
    class: "ml-pen-stroke",
    "stroke-width": penWidth * 0.9,
    d: `M${arrowStartX} ${arrowStartY}
        C${arrowStartX - 38} ${arrowStartY + 7},
         ${elbowX + loop * 3} ${elbowY + 3},
         ${elbowX + loop} ${elbowY}
        C${elbowX - loop} ${elbowY - loop * 0.2},
         ${elbowX - loop * 0.7} ${elbowY + loop * 1.3},
         ${elbowX + loop * 0.3} ${elbowY + loop}
        C${elbowX + loop * 1.3} ${elbowY + loop * 0.7},
         ${elbowX + loop * 0.8} ${elbowY - loop * 0.8},
         ${elbowX - loop * 0.4} ${elbowY - loop}
        C${photoW - gutter * 0.6} ${elbowY - loop * 3},
         ${arrowEndX + rx * 1.4} ${arrowEndY + ry * 1.2},
         ${arrowEndX} ${arrowEndY}`,
  }, annotations);

  const directionX = rx * 1.4;
  const directionY = ry * 1.2;
  const directionLength = Math.hypot(directionX, directionY);
  const ux = directionX / directionLength;
  const uy = directionY / directionLength;
  const headLength = full ? 20 : 17;
  const headWidth = headLength * 0.42;

  const arrowhead = svg("path", {
    class: "ml-pen-stroke",
    "stroke-width": penWidth,
    d: `M${arrowEndX + ux * headLength - uy * headWidth}
          ${arrowEndY + uy * headLength + ux * headWidth}
        L${arrowEndX} ${arrowEndY}
        L${arrowEndX + ux * headLength + uy * headWidth}
          ${arrowEndY + uy * headLength - ux * headWidth}`,
  }, annotations);

  const tl = gsap.timeline({ paused: true });
  const build = gsap.timeline();

  const prepareStroke = (path) => {
    const length = Math.max(0.1, path.getTotalLength());
    gsap.set(path, {
      autoAlpha: 0,
      strokeDasharray: `${length} ${length}`,
      strokeDashoffset: length,
    });
  };
  const draw = (path, start, duration, ease = "none") => {
    build.set(path, { autoAlpha: 1 }, start);
    build.to(path, {
      strokeDashoffset: 0,
      duration,
      ease,
    }, start);
  };

  [...mainStrokes, ...lateStrokes].forEach(({ path }) => prepareStroke(path));
  [focusRing, ringAccent, arrow, arrowhead].forEach(prepareStroke);
  if (underline) prepareStroke(underline);

  // The complete printed page is readable at frame zero. Small pressure
  // settles happen inside generously padded individual line masks.
  gsap.set(ruleStroke, { strokeDasharray: "none", strokeDashoffset: 0 });
  gsap.set(h1, { autoAlpha: title1 ? 1 : 0, y: 5 });
  gsap.set(h2, { autoAlpha: title2 ? 1 : 0, y: 7 });
  bodyLines.forEach((line) => gsap.set(line, { autoAlpha: 1, y: 4 }));
  gsap.set(caption, { autoAlpha: captionH ? 1 : 0, y: 3 });

  const settleLine = (el, start, overshoot) => {
    build.to(el, {
      y: -overshoot,
      duration: at(0.16),
      ease: "power3.out",
    }, start);
    build.to(el, {
      y: 0,
      duration: at(0.12),
      ease: "sine.out",
    }, start + at(0.16));
  };

  if (title1) settleLine(h1, 0, 0.5);
  if (title2) settleLine(h2, at(0.07), 0.7);
  bodyLines.forEach((line, index) => {
    settleLine(line, at(0.04 + Math.min(index, 5) * 0.067), 0.4);
  });
  if (captionH) settleLine(caption, at(0.18), 0.3);

  gsap.set("#ml-photo", {
    clipPath: "inset(8% 0% 0% 0%)",
  });

  const openingPush = clamp(number(V.photoPush, 1.065), 1.02, 1.2);
  const openingOffset = Math.min(
    Math.max(0, number(V.photoOffset, 6)),
    photoH * (openingPush - 1) * 0.35,
  );
  gsap.set("#ml-image", {
    scaleX: openingPush,
    scaleY: openingPush,
    x: 0,
    y: openingOffset,
  });

  build.to("#ml-photo", {
    clipPath: "inset(0% 0% 0% 0%)",
    duration: at(0.32),
    ease: "power4.out",
  }, 0);
  build.to("#ml-image", {
    scaleX: 1,
    scaleY: 1,
    x: 0,
    y: 0,
    duration: at(0.48),
    ease: "power3.out",
  }, 0);

  gsap.set(focus, {
    svgOrigin: `${focusX} ${focusY}`,
    scaleX: 1,
    scaleY: 1,
  });
  gsap.set(targetFlash, {
    svgOrigin: `${targetX} ${targetY}`,
    scaleX: 1,
    scaleY: 1,
  });

  if (hasNote) {
    // Locate the detail first, then write the thought it prompted.
    draw(focusRing, at(0.56), at(0.20), "power2.inOut");
    draw(arrow, at(0.80), at(0.18), "power2.inOut");
    draw(arrowhead, at(0.99), at(0.055), "power3.out");

    const strokes = [...mainStrokes, ...lateStrokes];
    const totalWeight = strokes.reduce(
      (sum, stroke) => sum + stroke.gap + stroke.weight, 0,
    );
    const letterCount = noteChars.filter((ch) => /[A-Za-z0-9]/.test(ch)).length;
    const spaces = noteChars.filter((ch) => ch === " ").length;
    const speed = clamp(number(V.handwritingSpeed, 8), 6, 14);
    const desiredRun = at(
      letterCount / speed + spaces * 0.075 + lateStrokes.length * 0.018,
    );
    const availableRun = Math.max(at(0.3), D - at(1.08) - at(0.21));
    const noteRun = Math.min(availableRun, Math.max(at(0.45), desiredRun));
    let penTime = Math.max(at(1.08), D - at(0.21) - noteRun);

    strokes.forEach((stroke) => {
      penTime += noteRun * stroke.gap / Math.max(0.001, totalWeight);
      const duration = noteRun * stroke.weight / Math.max(0.001, totalWeight);
      draw(stroke.path, penTime, duration);
      penTime += duration;
    });

    // Both endpoints land exactly at the key moment.
    draw(underline, D - at(0.17), at(0.17), "power3.out");
    draw(ringAccent, D - at(0.17), at(0.17), "power3.out");

    build.to(focus, {
      scaleX: 1.065,
      scaleY: 1.065,
      duration: at(0.085),
      ease: "power3.in",
    }, D - at(0.085));
    build.to(focusRing, {
      attr: { "stroke-width": penWidth * 1.35 },
      duration: at(0.085),
      ease: "power3.in",
    }, D - at(0.085));
    build.to(underline, {
      attr: { "stroke-width": penWidth * 1.42 / noteScale },
      duration: at(0.065),
      ease: "power3.in",
    }, D - at(0.065));
  }

  // Punch only the named reflection detail. The painting's crop and the
  // arrow's endpoint stay registered throughout the payoff and hold.
  const punch = clamp(number(V.payoffPunch, 1.48), 1.1, 1.8);
  build.to(targetFlash, {
    scaleX: punch,
    scaleY: punch,
    duration: at(0.085),
    ease: "power3.in",
  }, D - at(0.085));

  build.timeScale(1 / T.scale);
  tl.add(build, 0);

  const settle = Math.min(0.18, Math.max(0.01, T.hold));
  if (T.hold > 0) {
    tl.to(targetFlash, {
      scaleX: 1.1,
      scaleY: 1.1,
      duration: settle,
      ease: "power3.out",
    }, T.key);

    if (hasNote) {
      tl.to(focus, {
        scaleX: 1,
        scaleY: 1,
        duration: settle,
        ease: "power3.out",
      }, T.key);
      tl.to(focusRing, {
        attr: { "stroke-width": penWidth * 1.14 },
        duration: settle,
        ease: "power3.out",
      }, T.key);
      tl.to(underline, {
        attr: { "stroke-width": penWidth * 1.28 / noteScale },
        duration: settle,
        ease: "power3.out",
      }, T.key);
    }
  }

  // Independent water layers move throughout the read, including every
  // held frame. The selected text, handwriting and annotation anchors stay put.
  const aliveDuration = Math.max(0.01, T.key + T.hold + T.exit);
  const drift = clamp(number(V.holdDrift, 20), 4, 40);

  gsap.set(glimmerNear, { x: -drift * 0.18, y: drift * 0.12 });
  gsap.set(glimmerFar, { x: drift * 0.12, y: -drift * 0.08 });
  gsap.set(waterMarks, { x: -drift * 0.08, y: 0 });
  gsap.set(targetFloat, { x: -drift * 0.08, y: 0 });

  tl.to(glimmerNear, {
    x: drift * 0.28,
    y: -drift * 0.36,
    duration: aliveDuration,
    ease: "sine.inOut",
  }, 0);
  tl.to(glimmerFar, {
    x: -drift * 0.20,
    y: drift * 0.25,
    duration: aliveDuration,
    ease: "sine.inOut",
  }, 0);
  tl.to(waterMarks, {
    x: drift * 0.24,
    y: drift * 0.13,
    duration: aliveDuration,
    ease: "sine.inOut",
  }, 0);
  tl.to(targetFloat, {
    x: drift * 0.08,
    y: -drift * 0.055,
    duration: aliveDuration,
    ease: "sine.inOut",
  }, 0);
  tl.to(targetBars[0], {
    opacity: 0.98,
    duration: aliveDuration,
    ease: "sine.inOut",
  }, 0);
  tl.to(targetBars[2], {
    opacity: 0.48,
    duration: aliveDuration,
    ease: "sine.inOut",
  }, 0);

  const open = "inset(0% 0% 0% 0%)";
  const closed = "inset(0% 0% 100% 0%)";

  gsap.set(stageEl, { clipPath: open });

  if (variant === "overlay") {
    tl.fromTo(stageEl,
      { clipPath: closed },
      {
        clipPath: open,
        duration: Math.min(0.18, T.key * 0.1),
        ease: "power4.out",
      }, 0);
  }

  if (T.exit > 0) {
    const exitDuration = Math.max(0, T.exit - 1 / CA.fps);
    const exitStart = T.key + T.hold;
    tl.fromTo(stageEl,
      { clipPath: open },
      {
        clipPath: closed,
        duration: exitDuration,
        ease: "power3.in",
        immediateRender: false,
      }, exitStart);
    tl.set(stageEl, { clipPath: closed }, exitStart + exitDuration);
    tl.set(stageEl, { clipPath: closed }, exitStart + T.exit);
  }

  window.__timelines["block"] = tl;
});