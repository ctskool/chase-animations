import * as THREE from "three";

CA.ready(() => {
  const { vars: V, stage: S, safe, time: T, variant, make, rgba } = CA;
  const $ = (id) => document.getElementById(id);
  const clamp = (n, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));
  const numeric = (value, fallback) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  };
  const clean = (value) => String(value || "").replace(/\s+/g, " ").trim();

  const W = S.w;
  const H = S.h;
  const full = variant === "full";
  const minText = full ? 40 : 32;
  const textScale = clamp(numeric(V.textScale, 1), 0.9, 1.1);
  const stageEl = $("stage");
  const bar = $("fg-bar");
  const panel = $("fg-panel");
  const queryCopy = $("fg-query-copy");
  const queryLine = $("fg-query-line");
  const caret = $("fg-caret");
  const highlight = $("fg-highlight");
  const selected = clamp(Math.round(numeric(V.selectedRow, 2)), 1, 3) - 1;
  const selectedMark = $("fg-selection-mark");
  const searchIcon = $("fg-search-icon");
  const seed = Math.round(numeric(V.seed, 17));
  const query = clean(V.query);
  const D = T.design;
  const K = T.key;

  stageEl.style.background = V.deepSky;

  Object.entries({
    "--fg-text": V.textColor,
    "--fg-label": V.labelColor,
    "--fg-deep": V.deepSky,
    "--fg-caret": V.caretColor,
    "--fg-coral": V.coral,
    "--fg-rim": V.rimColor,
    "--fg-rim-low": rgba(V.rimColor, 0.2),
    "--fg-rim-top": rgba(V.rimColor, 0.62),
    "--fg-rim-left": rgba(V.rimColor, 0.36),
    "--fg-rim-inner": rgba(V.rimColor, 0.14),
    "--fg-rim-faint": rgba(V.rimColor, 0.07),
    "--fg-shadow": rgba(V.shadowColor, 0.36),
    "--fg-shadow-soft": rgba(V.shadowColor, 0.24),
    "--fg-text-shadow": rgba(V.shadowColor, 0.65),
    "--fg-tile-rim": rgba(V.rimColor, 0.22),
    "--fg-tile-fill": rgba(V.glassTint, 0.32),
    "--fg-highlight-rim": rgba(V.rimColor, 0.26),
    "--fg-highlight-fill": rgba(V.rimColor, 0.1),
    "--fg-key-rim": rgba(V.coral, 0.75),
    "--fg-key-fill": rgba(V.coral, 0.24),
    "--fg-sheen": rgba(V.rimColor, 0.15),
  }).forEach(([name, value]) => stageEl.style.setProperty(name, value));

  const layouts = {
    full: {
      side: 44,
      barH: 360,
      heroH: 620,
      heroScale: 3.6,
      barPad: 36,
      barVPad: 26,
      query: 132,
      search: 72,
      queryGap: 28,
      row: 300,
      rowPad: 34,
      rowGap: 24,
      title: 104,
      winnerTitle: 132,
      focusGrowth: 0.24,
      label: 44,
      tile: 84,
      key: 72,
      panelPad: 24,
      contentPad: 34,
      gap: 24,
      barRadius: 46,
      panelRadius: 30,
      place: 0.4,
      heroPlace: 0.46,
    },
    top: {
      side: 36,
      barH: 180,
      heroH: 420,
      heroScale: 4.2,
      barPad: 32,
      barVPad: 24,
      query: 72,
      search: 56,
      queryGap: 24,
      row: 194,
      rowPad: 30,
      rowGap: 20,
      title: 76,
      winnerTitle: 104,
      focusGrowth: 0.4,
      label: 36,
      tile: 64,
      key: 60,
      panelPad: 22,
      contentPad: 30,
      gap: 20,
      barRadius: 38,
      panelRadius: 28,
      place: 0.38,
      heroPlace: 0.46,
    },
    overlay: {
      side: 28,
      barH: 176,
      heroH: 400,
      heroScale: 4.2,
      barPad: 30,
      barVPad: 22,
      query: 72,
      search: 54,
      queryGap: 22,
      row: 190,
      rowPad: 28,
      rowGap: 20,
      title: 76,
      winnerTitle: 104,
      focusGrowth: 0.4,
      label: 36,
      tile: 60,
      key: 56,
      panelPad: 22,
      contentPad: 30,
      gap: 18,
      barRadius: 36,
      panelRadius: 26,
      place: 0.44,
      heroPlace: 0.44,
    },
  };

  const M = { ...(layouts[variant] || layouts.full) };
  const topSafe = full
    ? Math.max(230, numeric(safe.top, 230))
    : Math.max(20, Math.min(36, numeric(safe.top, 28)));
  const bottomSafe = full
    ? Math.max(300, numeric(safe.bottom, 300))
    : Math.max(20, Math.min(36, numeric(safe.bottom, 28)));
  const availableH = Math.max(1, H - topSafe - bottomSafe);
  const side = Math.max(M.side, numeric(safe.side, M.side));
  const cardW = Math.max(1, W - side * 2);
  const cardX = (W - cardW) / 2;

  if (!full && H < 760) {
    Object.assign(M, {
      barH: 112,
      heroH: 286,
      heroScale: 4,
      barVPad: 16,
      query: 56,
      search: 46,
      row: 128,
      title: 56,
      winnerTitle: 76,
      focusGrowth: 0.5,
      label: 32,
      tile: 52,
      key: 48,
      panelPad: 16,
      contentPad: 20,
      gap: 14,
    });
  }

  Object.entries({
    "--fg-bar-pad": M.barPad,
    "--fg-query-gap": M.queryGap,
    "--fg-search-size": M.search,
    "--fg-row-pad": M.rowPad,
    "--fg-row-gap": M.rowGap,
    "--fg-tile-size": M.tile,
    "--fg-key-size": M.key,
  }).forEach(([name, value]) => {
    stageEl.style.setProperty(name, value + "px");
  });

  Object.assign(bar.style, {
    left: cardX + "px",
    width: cardW + "px",
    borderRadius: M.barRadius + "px",
  });
  Object.assign(panel.style, {
    left: cardX + "px",
    width: cardW + "px",
    borderRadius: M.panelRadius + "px",
  });
  highlight.style.borderRadius = Math.max(10, M.panelRadius - 12) + "px";

  const queryRoom = Math.max(
    1,
    cardW - M.barPad * 2 - M.search - M.queryGap - 18,
  );
  const titleRoom = Math.max(
    1,
    cardW - M.rowPad * 2 - M.tile - M.rowGap - M.key - 28,
  );
  queryLine.style.width = queryRoom + "px";

  const iconPaths = [
    '<path d="M6 30V13m0 11h36v12M6 30h36M11 23v-7h11v7m3 0v-7h12a5 5 0 0 1 5 5v3M6 36v4m36-4v4"/>',
    '<path d="M12 37c-1-15 6-25 26-27 1 19-7 29-22 25M12 39l19-20M21 29l-1-9m1 9 9 1"/>',
    '<path d="M7 39V17l11-7v29m12 0V10l11 7v22M7 39h34M18 21h12m-12 9h12M23 39v-7h3v7"/>',
  ];

  const iconSvg = (path) =>
    '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" ' +
    'stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" ' +
    'aria-hidden="true">' + path + "</svg>";

  const rows = [1, 2, 3].map((number, index) => {
    const row = make("div", "fg-row", $("fg-rows"));
    const icon = make("div", "fg-icon-tile", row);
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML = iconSvg(iconPaths[index]);

    const copy = make("div", "fg-row-copy", row);
    copy.style.width = titleRoom + "px";
    const title = make("span", "fg-row-title", copy);
    const labelLine = make("div", "fg-label-line", copy);
    const label = make("span", "fg-row-label", labelLine);
    const titleText = clean(V[`row${number}Title`]);
    const labelText = clean(V[`row${number}Label`]);
    labelLine.style.display = labelText ? "block" : "none";

    let keycap = null;
    let arrow = null;
    let check = null;

    if (index === selected) {
      keycap = make("div", "fg-return", row);
      keycap.setAttribute("aria-hidden", "true");
      keycap.innerHTML =
        '<svg class="fg-return-arrow" viewBox="0 0 36 36" fill="none" ' +
        'stroke="currentColor" stroke-width="2.5" stroke-linecap="round" ' +
        'stroke-linejoin="round" aria-hidden="true">' +
        '<path d="M28 8v11a4 4 0 0 1-4 4H8m7-7-7 7 7 7"/></svg>' +
        '<svg class="fg-return-check" viewBox="0 0 36 36" fill="none" ' +
        'stroke="currentColor" stroke-width="3.5" stroke-linecap="round" ' +
        'stroke-linejoin="round" aria-hidden="true">' +
        '<path d="M8 19l7 7L29 10"/></svg>';
      arrow = keycap.querySelector(".fg-return-arrow");
      check = keycap.querySelector(".fg-return-check");
    }

    return {
      row, icon, copy, title, label, labelLine, keycap, arrow, check,
      titleText, labelText, baseLayout: null,
    };
  });

  function layoutText(element, text, room, requestedSize, preferTwo = false) {
    const words = text ? text.split(" ") : [];
    const maximum = Math.max(minText, Math.round(requestedSize));
    element.style.height = "auto";
    element.style.width = "auto";
    element.style.maxWidth = "none";
    element.style.whiteSpace = "pre";

    const measure = (copy) => {
      element.textContent = copy;
      return element.getBoundingClientRect().width;
    };

    function commit(lines, size) {
      const copy = lines.join("\n");
      element.style.fontSize = size + "px";
      element.textContent = copy;
      return {
        text: copy,
        size,
        height: element.getBoundingClientRect().height,
      };
    }

    if (!words.length) return commit([""], maximum);

    if (!preferTwo) {
      const singleFloor = words.length < 3
        ? minText
        : Math.max(minText, Math.round(maximum * 0.88));

      for (let size = maximum; size >= singleFloor; size--) {
        element.style.fontSize = size + "px";
        if (measure(text) <= room) return commit([text], size);
      }
    }

    for (let size = maximum; size >= minText; size--) {
      element.style.fontSize = size + "px";
      const singleWidth = measure(text);

      if (!preferTwo && singleWidth <= room) {
        return commit([text], size);
      }

      let best = null;
      if (words.length >= 3) {
        for (let split = 1; split <= words.length - 2; split++) {
          if (preferTwo && words.length >= 4 && split < 2) continue;
          const first = words.slice(0, split).join(" ");
          const second = words.slice(split).join(" ");
          const a = measure(first);
          const b = measure(second);
          if (Math.max(a, b) > room) continue;

          const score = Math.max(a, b) + Math.abs(a - b) * 0.32;
          if (!best || score < best.score) {
            best = { lines: [first, second], score };
          }
        }
      }

      if (best) return commit(best.lines, size);
      if (singleWidth <= room) return commit([text], size);
    }

    element.style.fontSize = minText + "px";
    const lines = [];
    let current = [];

    words.forEach((word) => {
      const next = [...current, word];
      if (current.length && measure(next.join(" ")) > room) {
        lines.push(current);
        current = [word];
      } else {
        current = next;
      }
    });
    if (current.length) lines.push(current);

    if (lines.length > 1) {
      const last = lines[lines.length - 1];
      const previous = lines[lines.length - 2];
      if (last.length === 1 && previous.length >= 3) {
        const moved = previous[previous.length - 1];
        if (measure(moved + " " + last[0]) <= room) {
          previous.pop();
          last.unshift(moved);
        }
      }
    }

    return commit(lines.map((line) => line.join(" ")), minText);
  }

  let queryLayout;
  let rowH = M.row;
  let barH = M.barH;
  let panelH = 0;
  let groupH = 0;

  for (let pass = 0; pass <= 10; pass++) {
    const sizing = Math.max(0.6, 1 - pass * 0.04) * textScale;
    queryLayout = layoutText(
      queryCopy,
      query,
      queryRoom - 16,
      M.query * sizing,
      full && query.split(" ").length >= 4,
    );

    queryLine.style.fontSize = queryLayout.size + "px";
    barH = Math.max(
      M.barH,
      Math.ceil(queryLayout.height + M.barVPad * 2),
    );

    rows.forEach((item) => {
      item.baseLayout = layoutText(
        item.title,
        item.titleText,
        titleRoom,
        M.title * sizing,
        full && item.titleText.split(" ").length >= 3,
      );
      if (item.labelText) {
        layoutText(
          item.label,
          item.labelText,
          titleRoom,
          M.label * sizing,
        );
      }
    });

    const contentMin = Math.max(
      M.tile + M.contentPad,
      ...rows.map(({ copy }) => copy.offsetHeight + M.contentPad),
    );
    const rowBudget = (
      availableH - barH - M.gap - M.panelPad * 2
    ) / 3;

    rowH = Math.max(contentMin, Math.min(M.row, rowBudget));
    panelH = M.panelPad * 2 + rowH * 3;
    groupH = barH + M.gap + panelH;
    if (groupH <= availableH + 1) break;
  }

  const queryBlockH = Math.max(
    queryLayout.height,
    queryLayout.size * 1.18,
  );
  queryLine.style.height = Math.ceil(queryBlockH) + "px";
  queryCopy.style.height = "auto";

  const groupY = topSafe + Math.max(0, availableH - groupH) * M.place;
  const panelY = groupY + barH + M.gap;
  const heroBarH = Math.max(barH, Math.min(M.heroH, availableH));
  const heroBarY = topSafe +
    Math.max(0, availableH - heroBarH) * M.heroPlace;
  const barLift = Math.max(0, heroBarY - groupY);

  Object.assign(bar.style, {
    top: groupY + "px",
    height: barH + "px",
  });
  Object.assign(panel.style, {
    top: panelY + "px",
    height: panelH + "px",
  });

  rows.forEach(({ row }, index) => {
    row.style.top = M.panelPad + index * rowH + "px";
    row.style.height = rowH + "px";
  });

  // Give the choice more room without squeezing either other result's text.
  const otherMinH = Math.max(
    M.tile + M.contentPad,
    ...rows
      .filter((_, index) => index !== selected)
      .map(({ copy }) => copy.offsetHeight + M.contentPad),
  );
  const focusGrowth = Math.min(
    M.focusGrowth,
    Math.max(0, 2 * (1 - otherMinH / rowH)),
  );
  const quietRowH = rowH * (1 - focusGrowth / 2);
  const chosenRowH = rowH * (1 + focusGrowth);
  let focusCursor = M.panelPad;
  const focusRows = rows.map((_, index) => {
    const height = index === selected ? chosenRowH : quietRowH;
    const result = { top: focusCursor, height };
    focusCursor += height;
    return result;
  });

  const selectedRow = rows[selected];
  const keycap = selectedRow.keycap;
  const labelHeight = selectedRow.labelText
    ? selectedRow.labelLine.offsetHeight
    : 0;
  const winnerRoomH = Math.max(
    minText * 1.12,
    chosenRowH - M.contentPad - labelHeight - 4,
  );

  let winnerLayout = selectedRow.baseLayout;
  let winnerSize = M.winnerTitle * textScale;
  for (let attempt = 0; attempt <= 12; attempt++) {
    const candidate = layoutText(
      selectedRow.title,
      selectedRow.titleText,
      titleRoom,
      winnerSize,
      selectedRow.titleText.split(" ").length >= 3,
    );
    if (candidate.height <= winnerRoomH + 1) {
      winnerLayout = candidate;
      break;
    }
    winnerSize = Math.max(minText, winnerSize * 0.9);
  }
  selectedRow.title.textContent = selectedRow.baseLayout.text;
  selectedRow.title.style.fontSize = selectedRow.baseLayout.size + "px";

  const highlightH = rowH - 14;
  const chosenHighlightH = chosenRowH - 14;
  highlight.style.height = highlightH + "px";

  const edge = $("fg-edge");
  const edgeLine = $("fg-edge-line");
  edge.setAttribute("viewBox", `0 0 ${cardW} ${panelH}`);
  [
    ["x", 2],
    ["y", 2],
    ["width", cardW - 4],
    ["height", panelH - 4],
    ["rx", M.panelRadius - 2],
    ["stroke-width", 4],
    ["stroke-dasharray", "150 850"],
  ].forEach(([name, value]) => {
    edgeLine.setAttribute(name, String(value));
  });

  const measureCanvas = document.createElement("canvas");
  const measureContext = measureCanvas.getContext("2d");
  measureContext.font = `500 ${queryLayout.size}px "Plus Jakarta Sans"`;

  function queryWidth(copy) {
    return Math.max(
      0,
      measureContext.measureText(copy).width -
      queryLayout.size * 0.035 *
      Math.max(0, Array.from(copy).length - 1),
    );
  }

  // Complete-word typing prevents sampled frames from holding broken names.
  // Before each word arrives, the existing copy makes room for it.
  const typedQuery = queryLayout.text;
  const wordMatches = Array.from(typedQuery.matchAll(/\S+/g));
  const wordEnds = wordMatches.length
    ? wordMatches.map((match) => match.index + match[0].length)
    : [0];
  const queryPrefixes = wordEnds.map((end) => typedQuery.slice(0, end));
  const typingRandom = CA.seeded(seed + 101);
  const typeStart = D * 0.12;
  const typeEnd = D * (queryPrefixes.length > 1 ? 0.42 : 0.25);
  const wordWeights = wordMatches.slice(1).map((match) => (
    Math.sqrt(match[0].length) * (0.94 + typingRandom() * 0.12)
  ));
  const totalWeight = wordWeights.reduce((sum, value) => sum + value, 0);
  const wordTimes = [0];
  let wordClock = typeStart;

  wordWeights.forEach((weight) => {
    wordClock += (typeEnd - typeStart) *
      weight / Math.max(0.001, totalWeight);
    wordTimes.push(wordClock);
  });

  const queryPoses = queryPrefixes.map((copy, index) => {
    const lines = copy.split("\n");
    const width = Math.max(1, ...lines.map(queryWidth));
    const height = queryLayout.size * 1.18 * lines.length;
    const finalPose = queryPrefixes.length > 1 &&
      index === queryPrefixes.length - 1;
    const scale = finalPose ? 1 : Math.max(
      1,
      Math.min(
        M.heroScale,
        (queryRoom * 0.94 - 16) / width,
        (heroBarH - M.barVPad * 2) / height,
      ),
    );
    return {
      scale,
      y: (queryBlockH - height * scale) / 2,
    };
  });

  const wordPrepTimes = wordTimes.map((at, index) => {
    if (!index) return 0;
    const previous = wordTimes[index - 1];
    return at - Math.min(D * 0.075, (at - previous) * 0.76);
  });
  const wordEase = gsap.parseEase("power3.inOut");

  function queryState(d) {
    let index = 0;
    while (
      index + 1 < wordTimes.length &&
      d >= wordTimes[index + 1]
    ) {
      index++;
    }

    let scale = queryPoses[index].scale;
    let y = queryPoses[index].y;

    if (index + 1 < queryPoses.length) {
      const next = index + 1;
      const p = wordEase(clamp(
        (d - wordPrepTimes[next]) /
        Math.max(0.001, wordTimes[next] - wordPrepTimes[next]),
      ));
      scale += (queryPoses[next].scale - scale) * p;
      y += (queryPoses[next].y - y) * p;
    } else if (queryPoses.length === 1) {
      const p = wordEase(clamp(
        (d - typeStart) / Math.max(0.001, typeEnd - typeStart),
      ));
      scale += (1 - scale) * p;
      y += (0 - y) * p;
    }

    return { text: queryPrefixes[index], scale, y };
  }

  queryCopy.textContent = queryPrefixes[0];

  const rgb = (hex) => {
    let text = String(hex).replace("#", "");
    if (text.length === 3) text = text.replace(/./g, "$&$&");
    const value = parseInt(text, 16);
    return new THREE.Vector3(
      ((value >> 16) & 255) / 255,
      ((value >> 8) & 255) / 255,
      (value & 255) / 255,
    );
  };

  const random = CA.seeded(seed);
  const horizon = H - (panelY + panelH * 0.5);
  const lights = [];
  const lightColors = [];

  for (let index = 0; index < 16; index++) {
    const clusterX = index < 10
      ? W * (0.06 + random() * 0.4)
      : W * (0.63 + random() * 0.3);

    lights.push(new THREE.Vector4(
      clusterX,
      horizon + (random() - 0.5) * H * 0.035,
      3 + random() * 8,
      0.18 + random() * 0.38,
    ));
    lightColors.push(rgb(
      index % 5 === 0 ? V.textColor : index % 3 === 0 ? V.rose : V.coral,
    ));
  }

  const uniforms = {
    uResolution: { value: new THREE.Vector2(W, H) },
    uTime: { value: 0 },
    uDrift: { value: clamp(numeric(V.backgroundDrift, 8), 1, 18) },
    uHorizon: { value: horizon },
    uBlur: { value: clamp(numeric(V.glassBlur, 76), 40, 140) },
    uSmoke: { value: clamp(numeric(V.glassSmoke, 0.78), 0.65, 0.92) },
    uGrain: { value: clamp(numeric(V.grainAmount, 0.012), 0, 0.035) },
    uSeed: { value: seed },
    uConfirm: { value: 0 },
    uTeal: { value: rgb(V.teal) },
    uSky: { value: rgb(V.deepSky) },
    uCoral: { value: rgb(V.coral) },
    uRose: { value: rgb(V.rose) },
    uTint: { value: rgb(V.glassTint) },
    uLights: { value: lights },
    uLightColors: { value: lightColors },
    uBar: { value: new THREE.Vector4() },
    uPanel: { value: new THREE.Vector4() },
    uBarRadius: { value: M.barRadius },
    uPanelRadius: { value: M.panelRadius },
    uPanelVisible: { value: 0 },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    depthTest: false,
    depthWrite: false,
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      precision highp float;
      varying vec2 vUv;

      uniform vec2 uResolution;
      uniform float uTime;
      uniform float uDrift;
      uniform float uHorizon;
      uniform float uBlur;
      uniform float uSmoke;
      uniform float uGrain;
      uniform float uSeed;
      uniform float uConfirm;
      uniform vec3 uTeal;
      uniform vec3 uSky;
      uniform vec3 uCoral;
      uniform vec3 uRose;
      uniform vec3 uTint;
      uniform vec4 uLights[16];
      uniform vec3 uLightColors[16];
      uniform vec4 uBar;
      uniform vec4 uPanel;
      uniform float uBarRadius;
      uniform float uPanelRadius;
      uniform float uPanelVisible;

      vec3 linearColor(vec3 c) {
        return pow(max(c, vec3(0.0)), vec3(2.2));
      }

      float hash(vec2 p) {
        vec3 q = fract(vec3(p.xyx) * 0.1031);
        q += dot(q, q.yzx + 33.33 + uSeed * 0.001);
        return fract((q.x + q.y) * q.z);
      }

      float field(vec2 p, vec2 center, vec2 radius, float blur) {
        vec2 original = radius * radius;
        vec2 variance = original + vec2(blur * blur);
        vec2 delta = p - center;
        float energy = sqrt(
          (original.x * original.y) / (variance.x * variance.y)
        );
        return energy * exp(-0.5 * dot(delta * delta, 1.0 / variance));
      }

      float disc(vec2 p, vec2 center, float radius, float blur) {
        float feather = sqrt(22.0 * 22.0 + blur * blur);
        float distanceToCenter = length(p - center);
        return 1.0 - smoothstep(
          max(0.0, radius - feather),
          radius + feather,
          distanceToCenter
        );
      }

      vec3 photo(vec2 p, float blur) {
        float W = uResolution.x;
        float H = uResolution.y;
        vec3 sky = linearColor(uSky);
        vec3 teal = linearColor(uTeal);
        vec3 coral = linearColor(uCoral);
        vec3 rose = linearColor(uRose);

        float upper = smoothstep(H * 0.12, H * 0.93, p.y);
        vec3 color = mix(sky * 0.48, teal * 0.88, upper);

        color += teal * 0.32 * field(
          p, vec2(W * 0.18, H * 0.7),
          vec2(W * 0.38, H * 0.23), blur
        );
        color += coral * (0.28 + uConfirm * 0.7) * field(
          p, vec2(W * 0.76, uHorizon + H * 0.035),
          vec2(W * 0.34, H * 0.1), blur
        );
        color += rose * 0.13 * field(
          p, vec2(W * 0.19, uHorizon + H * 0.065),
          vec2(W * 0.26, H * 0.14), blur
        );
        color += coral * 0.055 * field(
          p, vec2(W * 0.48, uHorizon),
          vec2(W * 0.6, H * 0.025), blur
        );

        for (int i = 0; i < 16; i++) {
          vec4 light = uLights[i];
          float phase = float(i) * 1.73;
          vec2 center = light.xy + vec2(
            sin(uTime * 0.31 + phase) * 9.0,
            cos(uTime * 0.23 + phase) * 5.0
          );
          float radius = light.z;
          color += linearColor(uLightColors[i]) * light.w * field(
            p, center, vec2(radius * 1.7, radius), blur
          );
        }

        color += coral * 0.075 * disc(
          p, vec2(W * 0.91, uHorizon + H * 0.12), W * 0.053, blur
        );
        color += teal * 0.19 * disc(
          p, vec2(W * 0.075, H * 0.71), W * 0.076, blur
        );
        color += rose * 0.045 * disc(
          p, vec2(W * 0.39, uHorizon - H * 0.018), W * 0.034, blur
        );

        vec2 uv = p / uResolution;
        float sideShade = smoothstep(0.24, 0.72, abs(uv.x - 0.5));
        float cornerShade = smoothstep(
          0.36, 0.77, length((uv - vec2(0.5, 0.53)) * vec2(0.92, 1.0))
        );
        float lowerShade = 1.0 - smoothstep(0.08, 0.28, uv.y);
        color *= 1.0 - sideShade * 0.22 - cornerShade * 0.32;
        color = mix(color, sky * 0.3, lowerShade * 0.85);
        return max(color, vec3(0.0));
      }

      float glassMask(vec2 p, vec4 rect, float radius) {
        if (rect.z < 1.0 || rect.w < 1.0) return 0.0;
        vec2 halfSize = rect.zw * 0.5;
        float r = min(radius, min(halfSize.x, halfSize.y));
        vec2 q = abs(p - rect.xy - halfSize) - halfSize + vec2(r);
        float distanceToEdge =
          length(max(q, vec2(0.0))) +
          min(max(q.x, q.y), 0.0) - r;
        return 1.0 - smoothstep(-0.65, 0.65, distanceToEdge);
      }

      void main() {
        vec2 p = vUv * uResolution;
        vec2 drift = vec2(
          uTime * uDrift,
          sin(uTime * 0.19) * uDrift * 1.7
        );
        vec2 photoPoint = p + drift;
        vec3 color = photo(photoPoint, 9.0);

        float barMask = glassMask(p, uBar, uBarRadius);
        float panelMask =
          glassMask(p, uPanel, uPanelRadius) * uPanelVisible;
        float mask = max(barMask, panelMask);

        if (mask > 0.0) {
          vec3 blurred = photo(photoPoint, uBlur);
          float luminance = dot(blurred, vec3(0.2126, 0.7152, 0.0722));
          blurred = mix(blurred, vec3(luminance), 0.34);
          vec3 smoked = mix(blurred, linearColor(uTint), uSmoke);
          color = mix(color, smoked, mask);
        }

        color = pow(max(color, vec3(0.0)), vec3(1.0 / 2.2));

        float fineNoise = hash(floor(gl_FragCoord.xy));
        float softNoise = hash(floor(gl_FragCoord.xy * 0.5) + 71.0);
        color += (fineNoise - 0.5) * (1.6 / 255.0 + uGrain);
        color += (softNoise - 0.5) * uGrain * 0.18;

        gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
      }
    `,
  });

  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: false,
    preserveDrawingBuffer: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(2);
  renderer.setSize(W, H, false);
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.domElement.setAttribute("aria-hidden", "true");
  $("fg-photo").appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 2);
  camera.position.z = 1;
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

  const glideAt = typeEnd + D * 0.02;
  const glideRun = D * 0.14;
  const unfoldAt = glideAt + glideRun + 1 / CA.fps;
  const allRows = rows.map(({ row }) => row);
  const tl = gsap.timeline({ paused: true });
  const build = gsap.timeline();

  gsap.set(bar, {
    autoAlpha: 1,
    y: barLift,
    height: heroBarH,
    scaleX: 0.96,
    scaleY: 0.96,
  });
  gsap.set(queryCopy, {
    y: queryPoses[0].y,
    scaleX: queryPoses[0].scale,
    scaleY: queryPoses[0].scale,
  });
  gsap.set(searchIcon, { scaleX: 1.2, scaleY: 1.2 });
  gsap.set(panel, {
    autoAlpha: 0,
    clipPath: "none",
    y: 28,
    scaleX: 0.97,
    scaleY: 0.94,
  });
  gsap.set(allRows, {
    autoAlpha: 0,
    y: 8,
    scaleX: 0.99,
    scaleY: 0.99,
  });
  gsap.set(rows.map(({ icon }) => icon), {
    scaleX: 0.84,
    scaleY: 0.84,
  });
  gsap.set(highlight, { autoAlpha: 0, scaleX: 1 });
  gsap.set(selectedMark, { autoAlpha: 0, scaleY: 0 });
  gsap.set(keycap, {
    autoAlpha: 0,
    scaleX: 0.45,
    scaleY: 0.45,
    y: 10,
    rotation: -8,
  });
  gsap.set(selectedRow.check, { autoAlpha: 0 });
  gsap.set(["#fg-edge", "#fg-bar-sheen", "#fg-highlight-sheen"], {
    autoAlpha: 0,
  });

  build.to(bar, {
    scaleX: 1.018,
    scaleY: 1.018,
    duration: D * 0.065,
    ease: "power4.out",
  }, 0);
  build.to(bar, {
    scaleX: 1,
    scaleY: 1,
    duration: D * 0.065,
    ease: "power3.out",
  }, D * 0.065);

  build.to(searchIcon, {
    scaleX: 1,
    scaleY: 1,
    duration: typeEnd,
    ease: "power2.inOut",
  }, 0);

  build.to(bar, {
    y: 0,
    height: barH,
    duration: glideRun,
    ease: "power4.inOut",
  }, glideAt);

  // The complete result panel arrives in one attack. There is no empty
  // panel pose and no wipe cutting through a result's lettering.
  build.set(panel, { autoAlpha: 1 }, unfoldAt);
  build.set(allRows, { autoAlpha: 1 }, unfoldAt);
  build.to(panel, {
    y: -4,
    scaleX: 1.006,
    scaleY: 1.008,
    duration: D * 0.042,
    ease: "power4.out",
  }, unfoldAt);
  build.to(panel, {
    y: 0,
    scaleX: 1,
    scaleY: 1,
    duration: D * 0.05,
    ease: "power3.out",
  }, unfoldAt + D * 0.042);

  const rowTimes = rows.map((item, index) => {
    const at = unfoldAt + index * D * 0.008;

    build.to(item.row, {
      y: 0,
      scaleX: 1,
      scaleY: 1,
      duration: D * 0.055,
      ease: "power3.out",
    }, at);
    build.to(item.icon, {
      scaleX: 1.08,
      scaleY: 1.08,
      duration: D * 0.035,
      ease: "power4.out",
    }, at);
    build.to(item.icon, {
      scaleX: 1,
      scaleY: 1,
      duration: D * 0.045,
      ease: "power2.out",
    }, at + D * 0.035);

    return at;
  });

  const fromRow = selected === 0 ? 2 : 0;
  const startY = M.panelPad + fromRow * rowH + 7;
  const endY = focusRows[selected].top + 7;
  const highlightAt = Math.max(D * 0.72, rowTimes[2] + D * 0.1);
  const moveAt = Math.max(D * 0.81, highlightAt + D * 0.045);
  const moveRun = Math.max(0.001, D - moveAt);

  build.set(highlight, {
    autoAlpha: 1,
    scaleX: 0.95,
  }, highlightAt);
  build.to(highlight, {
    scaleX: 1,
    duration: D * 0.04,
    ease: "power3.out",
  }, highlightAt);

  rows.forEach((item, index) => {
    build.to(item.row, {
      top: focusRows[index].top,
      height: focusRows[index].height,
      duration: D * 0.1,
      ease: "power3.inOut",
    }, D * 0.9);
  });

  build.to(selectedRow.row, {
    scaleX: 0.982,
    scaleY: 0.982,
    duration: D * 0.025,
    ease: "power2.in",
  }, D * 0.94);
  build.to(selectedRow.row, {
    scaleX: 1.035,
    scaleY: 1.035,
    duration: D * 0.035,
    ease: "power4.out",
  }, D * 0.965);

  build.set(selectedMark, { autoAlpha: 1 }, D * 0.97);
  build.to(selectedMark, {
    scaleY: 1,
    duration: D * 0.03,
    ease: "expo.out",
  }, D * 0.97);

  build.set(keycap, { autoAlpha: 1 }, D * 0.955);
  build.to(keycap, {
    scaleX: 1.22,
    scaleY: 1.22,
    y: 0,
    rotation: 0,
    duration: D * 0.045,
    ease: "power4.out",
  }, D * 0.955);

  build.timeScale(1 / T.scale);
  tl.add(build, 0);

  const designTime = (time) => (
    time <= K ? time / T.scale : D + time - K
  );
  const smooth = (p) => p * p * (3 - 2 * p);

  function spring(progress, damping, frequency) {
    const p = clamp(progress);
    const response = (x) => 1 - Math.exp(-damping * x) * (
      Math.cos(frequency * x) +
      damping / frequency * Math.sin(frequency * x)
    );
    return response(p) + (1 - response(1)) * smooth(p);
  }

  function highlightEdges(time) {
    const p = clamp((designTime(time) - moveAt) / moveRun);
    if (p >= 1) return { y: endY, height: chosenHighlightH };

    const stiff = spring(p, 9, 12);
    const soft = spring(clamp((p - 0.08) / 0.92), 6.5, 8);
    const downward = endY + chosenHighlightH / 2 >=
      startY + highlightH / 2;
    const topProgress = downward ? soft : stiff;
    const bottomProgress = downward ? stiff : soft;

    let upper = startY + (endY - startY) * topProgress;
    let lower = startY + highlightH +
      (endY + chosenHighlightH - startY - highlightH) * bottomProgress;

    upper = clamp(upper, 8, panelH - 8 - highlightH * 0.65);
    lower = clamp(lower, upper + highlightH * 0.65, panelH - 8);
    return { y: upper, height: lower - upper };
  }

  tl.fromTo(highlight,
    { y: startY, scaleY: 1 },
    {
      y: startY + 1,
      scaleY: 1.001,
      duration: T.duration,
      ease: "none",
      modifiers: {
        y: () => highlightEdges(tl.time()).y + "px",
        scaleY: () => highlightEdges(tl.time()).height / highlightH,
      },
    }, 0);

  // The payoff changes the hierarchy as well as the colour. The chosen
  // title switches to its larger measured layout on this exact frame.
  tl.set(highlight, {
    backgroundColor: V.coral,
    borderColor: V.coral,
    boxShadow: `0 0 72px ${rgba(V.coral, 0.32)}`,
    scaleX: 1.025,
  }, K);
  tl.set(panel, { borderTopColor: V.coral }, K);
  tl.set(selectedRow.title, {
    color: V.deepSky,
    textShadow: "none",
  }, K);
  tl.set(selectedRow.label, {
    color: V.deepSky,
    textShadow: "none",
  }, K);
  tl.set(selectedRow.icon, {
    backgroundColor: V.deepSky,
    borderColor: V.deepSky,
    color: V.coral,
    scaleX: 1.18,
    scaleY: 1.18,
  }, K);
  tl.set(keycap, {
    backgroundColor: V.deepSky,
    borderColor: V.deepSky,
    color: V.coral,
  }, K);
  tl.set(selectedRow.arrow, { autoAlpha: 0 }, K);
  tl.set(selectedRow.check, { autoAlpha: 1 }, K);

  rows.forEach((item, index) => {
    if (index !== selected) {
      tl.set(item.title, { color: V.labelColor }, K);
    }
  });

  const settle = Math.min(0.24, T.hold);
  if (settle > 0) {
    tl.to(selectedRow.row, {
      scaleX: 1,
      scaleY: 1,
      duration: settle,
      ease: "back.out(1.4)",
    }, K);
    tl.to(selectedRow.icon, {
      scaleX: 1,
      scaleY: 1,
      duration: settle,
      ease: "back.out(1.5)",
    }, K);
    tl.to(keycap, {
      scaleX: 1,
      scaleY: 1,
      duration: settle,
      ease: "back.out(1.5)",
    }, K);
    tl.to(highlight, {
      scaleX: 1,
      backgroundColor: rgba(V.coral, 0.94),
      borderColor: rgba(V.coral, 0.96),
      boxShadow: `0 0 30px ${rgba(V.coral, 0.12)}`,
      duration: Math.min(0.34, T.hold),
      ease: "power3.out",
    }, K);
    tl.to(panel, {
      borderTopColor: rgba(V.rimColor, 0.62),
      duration: Math.min(0.34, T.hold),
      ease: "power3.out",
    }, K);
  }

  if (T.hold > 0) {
    tl.set(edge, { autoAlpha: 0.9 }, K);
    tl.fromTo(edgeLine,
      { strokeDashoffset: 125 },
      {
        strokeDashoffset: -825,
        duration: T.hold,
        ease: "sine.inOut",
        immediateRender: false,
      }, K);

    ["#fg-highlight-sheen", "#fg-bar-sheen"].forEach((target, index) => {
      const delay = Math.min(index * 0.12, T.hold * 0.15);
      tl.set(target, { autoAlpha: 1 }, K + delay);
      tl.fromTo(target,
        { backgroundPosition: "150% 0%" },
        {
          backgroundPosition: "-50% 0%",
          duration: Math.max(0.001, T.hold - delay),
          ease: "sine.inOut",
          immediateRender: false,
        }, K + delay);
    });
  }

  const open = "inset(0% 0% 0% 0% round 0px)";
  const closed = "inset(50% 0% 50% 0% round 48px)";

  if (variant === "overlay") {
    tl.fromTo(stageEl,
      { clipPath: closed },
      {
        clipPath: open,
        duration: Math.min(0.16, K * 0.12),
        ease: "power4.out",
      }, 0);
  }

  if (T.exit > 0) {
    const exitRun = Math.max(0, T.exit - 1 / CA.fps);
    tl.to(stageEl, {
      clipPath: closed,
      duration: exitRun,
      ease: "power3.in",
    }, K + T.hold);
    tl.set(stageEl, { clipPath: closed }, K + T.hold + exitRun);
  }

  window.__timelines["block"] = tl;

  function placeCaret(state) {
    const lines = state.text.split("\n");
    const lastLine = lines[lines.length - 1] || "";

    caret.style.left = Math.min(
      queryRoom - 5,
      queryWidth(lastLine) * state.scale + 7,
    ) + "px";
    caret.style.top = (
      state.y +
      ((lines.length - 1) * queryLayout.size * 1.18 +
        queryLayout.size * 0.13) * state.scale
    ) + "px";
    caret.style.height = queryLayout.size * 0.88 * state.scale + "px";
  }

  function copyRect(element, uniform, radiusUniform, baseRadius, stageBox) {
    const box = element.getBoundingClientRect();
    const scaleX = W / Math.max(1, stageBox.width);
    const scaleY = H / Math.max(1, stageBox.height);
    const x = (box.left - stageBox.left) * scaleX;
    const top = (box.top - stageBox.top) * scaleY;
    const width = box.width * scaleX;
    const height = box.height * scaleY;
    uniform.value.set(x, H - top - height, width, height);
    radiusUniform.value = baseRadius * width / Math.max(1, cardW);
  }

  function renderAt(rawTime) {
    const time = clamp(numeric(rawTime, 0), 0, T.duration);
    tl.time(time, true);

    const d = designTime(time);
    const state = queryState(d);
    queryCopy.textContent = state.text;
    gsap.set(queryCopy, {
      y: state.y,
      scaleX: state.scale,
      scaleY: state.scale,
    });
    placeCaret(state);

    const titleLayout = time >= K
      ? winnerLayout
      : selectedRow.baseLayout;
    selectedRow.title.textContent = titleLayout.text;
    selectedRow.title.style.fontSize = titleLayout.size + "px";

    const typing = d < typeEnd;
    const idleTime = Math.max(0, time - typeEnd * T.scale);
    caret.style.visibility = time >= K
      ? "hidden"
      : typing || Math.floor(idleTime / 0.48) % 2 === 0
        ? "visible"
        : "hidden";

    const stageBox = stageEl.getBoundingClientRect();
    copyRect(
      bar, uniforms.uBar, uniforms.uBarRadius, M.barRadius, stageBox,
    );
    copyRect(
      panel, uniforms.uPanel, uniforms.uPanelRadius, M.panelRadius, stageBox,
    );

    uniforms.uPanelVisible.value =
      getComputedStyle(panel).visibility === "hidden" ? 0 : 1;
    uniforms.uConfirm.value = time < K
      ? 0
      : Math.exp(-(time - K) * 8);
    uniforms.uTime.value = time;
    renderer.render(scene, camera);
  }

  window.addEventListener("hf-seek", (event) => {
    renderAt(event.detail.time);
  });
  renderAt(window.__hfThreeTime || 0);
});