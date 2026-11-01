CA.ready(() => {
  const {
    vars: V, stage: S, safe, time: T, variant,
    make, fit, rgba, grainUrl, seeded
  } = CA;
  const KIT = CA.claude;
  const $ = (id) => document.getElementById(id);
  const stage = $("stage");
  const W = S.w;
  const H = S.h;
  const D = T.design;
  const compact = variant !== "full";
  const minText = compact ? 32 : 40;
  const tl = gsap.timeline({ paused: true });
  const build = gsap.timeline();
  const rnd = seeded(61);

  const layouts = {
    full: {
      side: 56, top: 230, bottom: 300,
      prompt: 46, promptPad: 20,
      promptGap: 12, chevron: 32, logo: 46,
      treeGap: 44, gutter: 88, rowGap: 32,
      gridCountGap: 14, tilePad: 18,
      name: 76, status: 52, mark: 40,
      cell: 14, count: 144, countH: 148,
      progressH: 10, branchWidth: 16, trunkWidth: 20,
      node: 15, packet: 9,
      pileCell: 24, finalGap: 24,
      slabH: 680, slabPad: 32, textPad: 42,
      resultCount: 248, done: 144, stat: 60,
      doneGap: 20, statGap: 24, spark: 14
    },
    top: {
      side: 48, top: 32, bottom: 32,
      prompt: 40, promptPad: 14,
      promptGap: 12, chevron: 28, logo: 40,
      treeGap: 36, gutter: 72, rowGap: 24,
      gridCountGap: 10, tilePad: 14,
      name: 64, status: 48, mark: 32,
      cell: 12, count: 108, countH: 112,
      progressH: 8, branchWidth: 14, trunkWidth: 18,
      node: 13, packet: 8,
      pileCell: 16, finalGap: 20,
      slabH: 430, slabPad: 24, textPad: 32,
      resultCount: 176, done: 112, stat: 48,
      doneGap: 12, statGap: 16, spark: 10
    },
    overlay: {
      side: 44, top: 36, bottom: 32,
      prompt: 40, promptPad: 14,
      promptGap: 12, chevron: 30, logo: 40,
      treeGap: 36, gutter: 72, rowGap: 24,
      gridCountGap: 10, tilePad: 14,
      name: 64, status: 48, mark: 32,
      cell: 12, count: 108, countH: 112,
      progressH: 8, branchWidth: 14, trunkWidth: 18,
      node: 13, packet: 8,
      pileCell: 16, finalGap: 20,
      slabH: 430, slabPad: 24, textPad: 32,
      resultCount: 176, done: 112, stat: 48,
      doneGap: 12, statGap: 16, spark: 10
    }
  };

  const M = { ...(layouts[variant] || layouts.full) };

  if (compact && H < 800) {
    Object.assign(M, {
      side: 32, top: 24, bottom: 24,
      prompt: 36, promptPad: 12,
      promptGap: 10, chevron: 26, logo: 36,
      treeGap: 24, gutter: 72, rowGap: 16,
      gridCountGap: 8, tilePad: 10,
      name: 56, status: 44, mark: 28,
      count: 84, countH: 88,
      node: 11, packet: 7,
      pileCell: 14, finalGap: 16,
      slabH: 330, slabPad: 18, textPad: 26,
      resultCount: 140, done: 104, stat: 40,
      doneGap: 10, statGap: 12, spark: 8
    });
  }

  if (compact && H < 640) {
    Object.assign(M, {
      side: 28, top: 16, bottom: 16,
      prompt: 32, promptPad: 10,
      promptGap: 8, chevron: 24, logo: 32,
      treeGap: 22, gutter: 64, rowGap: 14,
      gridCountGap: 8, tilePad: 6,
      name: 48, status: 40, mark: 28,
      count: 72, countH: 78,
      branchWidth: 12, trunkWidth: 16,
      node: 10, packet: 6,
      pileCell: 12, finalGap: 12,
      slabH: Math.round(H * 0.46),
      slabPad: 14, textPad: 22,
      resultCount: 118, done: 88, stat: 36,
      doneGap: 8, statGap: 10
    });
  }

  const left = Math.max(M.side, Number(safe.side) || 0);
  const top = Math.max(M.top, Number(safe.top) || 0);
  const bottom = H - Math.max(M.bottom, Number(safe.bottom) || 0);
  const inner = W - left * 2;
  const rootX = W / 2;

  const data = [1, 2, 3, 4, 5, 6].map((i) => ({
    name: String(V[`agent${i}Name`] || "").trim(),
    color: V[`agent${i}Color`] || V.accent
  })).filter((a) => a.name);

  const n = data.length;
  const columns = n === 1 ? 1 : 2;
  const rows = Math.max(1, Math.ceil(n / columns));
  const hasPals = Boolean(V.showMascot && n);

  const countLabel = (value) => String(V.countTemplate || "")
    .split("{done}").join(String(value))
    .split("{total}").join(String(n));

  stage.style.background = V.ground;
  $("af-ground").style.background = V.ground;
  $("af-glow").style.background =
    `radial-gradient(ellipse at 50% 72%, ${rgba(V.accent, 0.12)}, transparent 72%)`;
  $("af-grain").style.backgroundImage = grainUrl(220, 0.45, 19);
  $("af-flash").style.background = V.ink;

  const prompt = $("af-prompt");
  const promptText = $("af-prompt-text");
  prompt.style.cssText +=
    `;left:${left}px;top:${top}px;width:${inner}px;` +
    `padding:${M.promptPad}px;gap:${M.promptGap}px;` +
    `border-width:3px;border-color:${V.accent};` +
    `background:${KIT.colors.userMessage}`;
  promptText.textContent = String(V.prompt || "");
  promptText.style.color = V.ink;

  $("af-chevron").style.width = M.chevron + "px";
  $("af-chevron").style.height = M.logo + "px";
  KIT.glyph($("af-chevron"), "chevron", M.chevron, V.ink);

  let logo = null;
  if (V.showLogo) {
    $("af-brand").style.width = M.logo + "px";
    $("af-brand").style.height = M.logo + "px";
    logo = KIT.logo($("af-brand"), M.logo, V.accent);
  } else {
    $("af-brand").style.display = "none";
  }

  let promptPx = M.prompt;
  promptText.style.fontSize = promptPx + "px";
  while (
    promptText.offsetHeight > promptPx * 1.18 * 2 + 2 &&
    promptPx > minText
  ) {
    promptText.style.fontSize = --promptPx + "px";
  }

  const promptH = Math.ceil(prompt.offsetHeight);
  const promptBottom = top + promptH;
  const countY = bottom - M.countH;
  const gridTop = promptBottom + M.treeGap;
  const gridRoom = Math.max(100, countY - M.gridCountGap - gridTop);
  const rowGap = rows > 1 ? M.rowGap : 0;
  const tileH = (gridRoom - rowGap * (rows - 1)) / rows;
  const tileW = columns === 1 ? inner : (inner - M.gutter) / 2;
  const branchRise = Math.min(M.rowGap / 2, M.treeGap / 2);
  const pad = M.tilePad;

  let cell = M.cell;
  if (n === 1) cell = compact ? 24 : 36;
  else if (!compact && rows === 1) cell = 28;
  else if (!compact && rows === 2) cell = 18;

  const palW = hasPals ? 11 * cell : 0;
  const palH = hasPals ? 8 * cell : 0;
  const pileCell = Math.max(M.pileCell, cell);
  const pileScale = pileCell / cell;
  const pileW = palW * pileScale;
  const pileH = palH * pileScale;

  const pileLayouts = {
    0: [],
    1: [
      { u: 0, v: 0, r: -5 }
    ],
    2: [
      { u: -0.42, v: 0, r: -10 },
      { u: 0.43, v: -0.16, r: 10 }
    ],
    3: [
      { u: -0.5, v: 0, r: -9 },
      { u: 0.52, v: 0.02, r: 6 },
      { u: 0.1, v: -0.65, r: 11 }
    ],
    4: [
      { u: -0.58, v: 0, r: -9 },
      { u: 0.58, v: 0.02, r: 6 },
      { u: -0.38, v: -0.6, r: -12 },
      { u: 0.35, v: -0.7, r: 11 }
    ],
    5: [
      { u: -0.82, v: 0, r: -9 },
      { u: 0.04, v: -0.02, r: 3 },
      { u: 0.88, v: 0.03, r: -6 },
      { u: -0.42, v: -0.59, r: -12 },
      { u: 0.47, v: -0.66, r: 11 }
    ],
    6: [
      { u: -0.82, v: 0, r: -9 },
      { u: 0.04, v: -0.02, r: 3 },
      { u: 0.88, v: 0.03, r: -6 },
      { u: -0.42, v: -0.59, r: -12 },
      { u: 0.47, v: -0.66, r: 10 },
      { u: 0.1, v: -1.2, r: 11 }
    ]
  };

  const pile = pileLayouts[n];
  const highest = pile.reduce((value, p) => Math.min(value, p.v), 0);
  const pileBand = hasPals
    ? pileH * (1 - highest) + pileCell * 1.6
    : 0;
  const slabH = Math.max(
    140,
    Math.min(
      M.slabH,
      bottom - promptBottom - pileBand - M.finalGap
    )
  );
  const slabTop = bottom - slabH;
  const highestFoot = slabTop + pileCell * 0.35 + highest * pileH;
  const hubY = hasPals
    ? Math.max(
      promptBottom + palH + cell * 0.8,
      highestFoot - pileH * 0.32
    )
    : slabTop - M.finalGap * 1.5;

  const count = $("af-count");
  const countText = $("af-count-text");
  count.style.cssText +=
    `;left:${left}px;top:${countY}px;width:${inner}px;` +
    `height:${M.countH}px;color:${V.ink}`;
  countText.textContent = countLabel(n);
  countText.style.fontSize = M.count + "px";
  const countPx = fit(countText, inner - 24, minText);
  countText.style.fontSize = M.resultCount + "px";
  let resultCountPx = fit(countText, inner - M.textPad * 2, minText);

  const slab = $("af-result");
  const foot = $("af-result-foot");
  slab.style.cssText +=
    `;left:${left}px;top:${slabTop}px;width:${inner}px;` +
    `height:${slabH}px;background:${V.panel};` +
    `border-color:${V.accent};color:${V.resultInk}`;
  foot.style.cssText +=
    `;left:${left + 12}px;top:${slabTop + 16}px;` +
    `width:${inner - 24}px;height:${slabH - 4}px;` +
    `background:${rgba(V.accent, 0.4)}`;
  $("af-result-sheen").style.background = rgba(V.ink, 0.14);
  $("af-result-edge").style.background = rgba(V.resultInk, 0.22);

  const done = $("af-done");
  const stat = $("af-stat");
  done.textContent = String(V.doneWord || "");
  stat.textContent = String(V.stat || "");
  done.style.fontSize = M.done + "px";
  stat.style.fontSize = M.stat + "px";

  let donePx = fit(done, inner - M.textPad * 2, minText);
  let statPx = fit(stat, inner - M.textPad * 2, minText);
  const doneGap = done.textContent ? M.doneGap : 0;
  const statGap = stat.textContent ? M.statGap : 0;
  const heightOf = (el) => el.textContent ? el.offsetHeight : 0;
  const groupHeight = () =>
    resultCountPx + doneGap + heightOf(done) + statGap + heightOf(stat);

  for (
    let i = 0;
    i < 100 && groupHeight() > slabH - M.slabPad * 2;
    i++
  ) {
    const nextCount = Math.max(minText, Math.floor(resultCountPx * 0.97));
    const nextDone = Math.max(minText, Math.floor(donePx * 0.97));
    const nextStat = Math.max(minText, Math.floor(statPx * 0.97));
    if (
      nextCount === resultCountPx &&
      nextDone === donePx &&
      nextStat === statPx
    ) break;
    resultCountPx = nextCount;
    donePx = nextDone;
    statPx = nextStat;
    done.style.fontSize = donePx + "px";
    stat.style.fontSize = statPx + "px";
  }

  const resultCountTop = Math.max(
    M.slabPad,
    (slabH - groupHeight()) / 2
  );
  const doneY = resultCountTop + resultCountPx + doneGap;
  done.style.top = Math.round(doneY) + "px";
  stat.style.top = Math.round(doneY + heightOf(done) + statGap) + "px";
  countText.style.fontSize = countPx + "px";
  countText.textContent = countLabel(0);

  const progress = $("af-progress");
  const progressFill = $("af-progress-fill");
  progress.style.cssText +=
    `;left:${left}px;top:${bottom - M.progressH}px;` +
    `width:${inner}px;height:${M.progressH}px;` +
    `background:${rgba(V.ink, 0.12)}`;
  progressFill.style.background = V.success;
  gsap.set(progressFill, { scaleX: 0 });

  // The final completion belongs only to the real key frame.
  const gatherAt = D - 0.78;
  const preFinishEnd = gatherAt - 0.42;
  const firstFinish = Math.min(1.05, preFinishEnd - 0.25);
  const preFinishCount = Math.max(0, n - 1);
  const finishTimes = data.map((_, i) => {
    if (i === n - 1) return D;
    if (preFinishCount === 1) return firstFinish;
    return firstFinish + (preFinishEnd - firstFinish) *
      Math.pow(i / (preFinishCount - 1), 1.16);
  });

  const svg = $("af-tree");
  const ns = "http://www.w3.org/2000/svg";
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.setAttribute("preserveAspectRatio", "none");

  function svgElement(tag, attributes) {
    const el = document.createElementNS(ns, tag);
    Object.entries(attributes).forEach(([key, value]) => {
      el.setAttribute(key, String(value));
    });
    svg.appendChild(el);
    return el;
  }

  function path(d, color, width) {
    const el = svgElement("path", {
      d, fill: "none", stroke: color,
      "stroke-width": width,
      "stroke-linecap": "round",
      "stroke-linejoin": "round"
    });
    const length = Math.max(1, el.getTotalLength());
    el.style.strokeDasharray = `${length} ${length}`;
    el.style.strokeDashoffset = String(length);
    return { el, length };
  }

  const finalJunctionY =
    gridTop + (rows - 1) * (tileH + rowGap) - branchRise;
  const trunk = n ? path(
    `M ${rootX} ${promptBottom - 2} L ${rootX} ${finalJunctionY}`,
    V.accent,
    M.trunkWidth
  ) : null;

  const junctions = Array.from({ length: n ? rows : 0 }, (_, row) => {
    const y = gridTop + row * (tileH + rowGap) - branchRise;
    const el = svgElement("circle", {
      cx: rootX, cy: y, r: M.node * 0.6,
      fill: V.accent,
      stroke: rgba(V.ink, 0.65),
      "stroke-width": 3
    });
    return { el, y };
  });

  const rootNode = n ? svgElement("circle", {
    cx: rootX, cy: promptBottom + 3, r: M.node * 0.75,
    fill: V.accent, stroke: V.ink, "stroke-width": 3
  }) : null;

  function toolFor(index, layer, x, y, color) {
    const prop = make("div", "af-work-prop", layer);
    const bits = [];
    const box = (px, py, w, h, fill, border) => {
      prop.style.cssText +=
        `;left:${px}px;top:${py}px;width:${w}px;height:${h}px;` +
        `background:${fill};` +
        (border ? `border:${Math.max(2, cell * 0.2)}px solid ${border};` : "");
    };
    const bit = (px, py, w, h, fill) => {
      const el = make("div", "af-tool-bit", prop);
      el.style.cssText +=
        `;left:${px}px;top:${py}px;width:${w}px;height:${h}px;` +
        `background:${fill}`;
      bits.push(el);
      return el;
    };

    if (index === 0) {
      // A shield with a scanning slot: the sentry peeks around it.
      box(
        x + cell * 5.8, y + cell * 1.4,
        cell * 3.4, cell * 5.3, V.panel, color
      );
      bit(cell * 0.35, cell * 1.2, cell * 2.25, cell * 0.4, color);
      bit(cell * 0.35, cell * 3.6, cell * 1.3, cell * 0.35, rgba(color, 0.5));
    } else if (index === 1) {
      // A chunky test pad visibly compresses under each stamp.
      box(
        x + cell * 2.3, y + palH - cell * 0.3,
        cell * 6.4, cell * 0.55, rgba(color, 0.8)
      );
      bit(cell * 0.8, 0, cell * 0.5, cell * 0.55, V.ink);
    } else if (index === 2) {
      // Four keys give the alternating hands something to type on.
      box(
        x + cell * 1.7, y + palH - cell * 1.8,
        cell * 7.6, cell * 1.25, V.panel, color
      );
      for (let k = 0; k < 4; k++) {
        bit(
          cell * (0.35 + k * 1.7), cell * 0.2,
          cell * 1.15, cell * 0.5, color
        );
      }
    } else if (index === 3) {
      // Two blocks are lifted, compared and put back in place.
      box(x, y, palW, palH, "transparent");
      bit(cell * 1.5, cell * 3.8, cell * 1.4, cell * 1.4, color);
      bit(cell * 7.7, cell * 3.8, cell * 1.4, cell * 1.4, V.ink);
    } else if (index === 4) {
      // UI shoves an outlined pixel frame into alignment.
      box(
        x + palW - cell * 3.7, y + palH - cell * 4.3,
        cell * 3.2, cell * 3.2, V.panel, color
      );
      bit(cell * 0.55, cell * 0.55, cell * 0.55, cell * 0.55, color);
    } else {
      // Short ground streaks reinforce the running feet.
      box(x, y + palH - cell * 0.25, palW, cell * 1.1, "transparent");
      [0, 2.7, 6.1].forEach((u, k) => {
        bit(
          cell * u, cell * k * 0.22,
          cell * (k === 1 ? 2 : 1.3), cell * 0.25,
          rgba(color, 0.8)
        );
      });
    }

    gsap.set(prop, { autoAlpha: 0 });
    return { prop, bits };
  }

  const agents = data.map((a, i) => {
    const row = Math.floor(i / columns);
    const oddLast = columns === 2 && n % 2 === 1 && i === n - 1;
    const x = columns === 1 || oddLast
      ? (W - tileW) / 2
      : left + (i % 2) * (tileW + M.gutter);
    const y = gridTop + row * (tileH + rowGap);

    const tile = make("div", "af-tile", $("af-grid"));
    tile.style.cssText +=
      `;left:${x}px;top:${y}px;width:${tileW}px;height:${tileH}px;` +
      `background:${V.panel};border-color:${rgba(a.color, 0.95)}`;
    const rail = make("div", "af-rail", tile);
    rail.style.background = a.color;

    // Compact outputs reserve the entire right column for the actor.
    // Full output reserves a middle strip between header and footer.
    const actorW = compact && hasPals
      ? palW + cell * 2
      : tileW - pad * 2;
    const textRoom = compact && hasPals
      ? tileW - pad * 2 - actorW - 12
      : tileW - pad * 2;
    const wordLeft = M.mark + 8;

    const status = make("div", "af-status", tile);
    status.style.cssText +=
      `;left:${pad}px;bottom:${pad}px;width:${textRoom}px`;

    const runningIcon = make("div", "af-running-icon", status);
    const doneIcon = make("div", "af-done-icon", status);
    [runningIcon, doneIcon].forEach((el) => {
      el.style.width = M.mark + "px";
      el.style.height = M.mark + "px";
    });

    const bars = [0.46, 0.72, 1].map((height) => {
      const bar = make("div", "af-work-bar", runningIcon);
      bar.style.height = height * 100 + "%";
      bar.style.background = a.color;
      gsap.set(bar, { scaleY: 0.25, opacity: 0.4 });
      return bar;
    });

    doneIcon.style.background = V.success;
    KIT.glyph(doneIcon, "tick", M.mark * 0.8, V.resultInk);

    const running = make(
      "span", "af-status-word", status, String(V.runningWord || "")
    );
    const finished = make(
      "span", "af-status-word", status, String(V.finishedWord || "")
    );

    const statusStart = compact
      ? Math.max(
        minText,
        Math.min(
          M.status,
          (tileH - pad * 2 - minText * 1.05 - 6) / 1.18
        )
      )
      : M.status;

    [running, finished].forEach((el) => {
      el.style.left = wordLeft + "px";
      el.style.fontSize = statusStart + "px";
    });

    const wordRoom = Math.max(minText, textRoom - wordLeft);
    const statusPx = Math.min(
      fit(running, wordRoom, minText),
      fit(finished, wordRoom, minText)
    );
    running.style.fontSize = finished.style.fontSize = statusPx + "px";
    running.style.color = V.muted;
    finished.style.color = V.success;

    const statusH = Math.max(M.mark, statusPx * 1.18);
    status.style.height = statusH + "px";
    runningIcon.style.top = doneIcon.style.top =
      (statusH - M.mark) / 2 + "px";

    const nameBudget = compact
      ? Math.max(minText * 1.05, tileH - pad * 2 - statusH - 8)
      : Math.max(
        minText * 1.05,
        tileH - pad * 2 - statusH - (hasPals ? palH + 12 : 8)
      );

    const name = make("div", "af-name", tile, a.name);
    name.style.cssText +=
      `;left:${pad}px;top:${pad}px;color:${V.ink};` +
      `font-size:${Math.max(
        minText,
        Math.min(M.name * (n === 1 ? 1.35 : 1), nameBudget / 1.05)
      )}px`;

    let namePx = fit(name, textRoom, minText);
    if (name.offsetWidth > textRoom + 1 && a.name.includes(" ")) {
      name.style.whiteSpace = "normal";
      name.style.textWrap = "balance";
      name.style.width = textRoom + "px";
    }
    while (name.offsetHeight > nameBudget + 1 && namePx > minText) {
      name.style.fontSize = --namePx + "px";
    }

    let actorX = x + pad;
    let actorY = y + pad + name.offsetHeight + 6;
    let actorH = tileH - pad * 2 - name.offsetHeight - statusH - 12;

    if (compact && hasPals) {
      actorX = x + tileW - pad - actorW;
      actorH = Math.max(palH + 4, tileH - pad * 2);
      actorY = y + (tileH - actorH) / 2;
    }

    const homeX = actorX + (actorW - palW) / 2;
    const homeY = actorY + (actorH - palH) / 2;
    const hop = hasPals
      ? Math.max(0, Math.min(cell * 0.55, (actorH - palH) * 0.35))
      : 0;

    let layer = null;
    let pal = null;
    let body = null;
    let mascot = null;
    let badge = null;
    let prop = null;
    let bits = [];

    if (hasPals) {
      layer = make("div", "af-agent-layer", $("af-pals"));
      layer.style.zIndex = String(10 + Math.round(-pile[i].v * 10));
      layer.style.clipPath =
        `polygon(${actorX}px ${actorY}px,` +
        `${actorX + actorW}px ${actorY}px,` +
        `${actorX + actorW}px ${actorY + actorH}px,` +
        `${actorX}px ${actorY + actorH}px)`;

      pal = make("div", "af-pal", layer);
      body = make("div", "af-body", pal);
      mascot = KIT.mascot(body, cell, { color: a.color });
      pal.style.width = mascot.width + "px";
      pal.style.height = mascot.height + "px";
      gsap.set(pal, { x: homeX, y: homeY, autoAlpha: 0 });

      const tool = toolFor(i, layer, homeX, homeY, a.color);
      prop = tool.prop;
      bits = tool.bits;

      if (i === n - 1) {
        const size = cell * 3;
        badge = make("div", "af-finish-badge", body);
        badge.style.cssText +=
          `;right:${-cell * 0.2}px;top:${cell * 0.15}px;` +
          `width:${size}px;height:${size}px;` +
          `border-color:${V.ground};background:${V.success}`;
        KIT.glyph(badge, "tick", size * 0.7, V.resultInk);
        gsap.set(badge, { autoAlpha: 0 });
      }
    }

    const centerX = x + tileW / 2;
    const branchY = junctions[row].y;
    const branch = path(
      `M ${rootX} ${branchY} ` +
      `L ${centerX} ${branchY} ` +
      `L ${centerX} ${y - 8} ` +
      `L ${centerX} ${y - 2}`,
      a.color,
      M.branchWidth
    );

    // Begin inside the burst: the first pair is already connected.
    gsap.set(branch.el, {
      strokeDashoffset: row === 0 ? 0 : branch.length * 0.82
    });

    const packet = svgElement("circle", {
      cx: centerX, cy: y - 2, r: M.packet,
      fill: V.ink, stroke: a.color, "stroke-width": 4
    });

    gsap.set(packet, { autoAlpha: 0 });
    gsap.set([tile, name, status], { autoAlpha: 0 });
    gsap.set([finished, doneIcon], { autoAlpha: 0 });

    return {
      ...a, row, x, y, centerX, branchY,
      tile, rail, name, status, running, finished,
      runningIcon, doneIcon, bars,
      layer, pal, body, mascot, badge, prop, bits,
      branch, packet, homeX, homeY, hop,
      finish: finishTimes[i]
    };
  });

  junctions.forEach((j) => svg.appendChild(j.el));
  if (rootNode) svg.appendChild(rootNode);

  const hubRing = n ? svgElement("circle", {
    cx: rootX, cy: hubY, r: M.node * 2,
    fill: "none", stroke: V.accent,
    "stroke-width": M.branchWidth * 0.6
  }) : null;
  if (hubRing) gsap.set(hubRing, { autoAlpha: 0 });

  gsap.set([count, progress, slab, foot, done, stat], { autoAlpha: 0 });
  gsap.set($("af-result-sheen"), { xPercent: -120, autoAlpha: 0 });

  build.set([count, progress], { autoAlpha: 1 }, 0);
  build.fromTo(prompt, {
    scaleX: 0.985, scaleY: 0.97
  }, {
    scaleX: 1, scaleY: 1,
    duration: 0.14, ease: "power4.out"
  }, 0);
  build.to(prompt, {
    borderColor: KIT.colors.userMessage,
    duration: 0.22, ease: "power3.out"
  }, 0.12);

  if (logo) {
    build.fromTo(logo, {
      rotation: -35, scaleX: 0.8, scaleY: 0.8,
      transformOrigin: "50% 50%"
    }, {
      rotation: 0, scaleX: 1, scaleY: 1,
      duration: 0.2, ease: "back.out(2.4)"
    }, 0);
  }

  if (trunk) {
    gsap.set(trunk.el, { strokeDashoffset: trunk.length * 0.6 });
    build.to(trunk.el, {
      strokeDashoffset: 0,
      duration: 0.18, ease: "power4.out"
    }, 0);
    build.to(rootNode, {
      attr: { r: M.node },
      duration: 0.12, ease: "back.out(2.5)"
    }, 0);
  }

  junctions.forEach((j, row) => {
    build.to(j.el, {
      attr: { r: M.node },
      duration: 0.12, ease: "back.out(2.5)"
    }, row * 0.035);
  });

  function work(a, index, land) {
    const until = Math.min(a.finish - 0.12, gatherAt - 0.1);
    a.bars.forEach((bar, k) => {
      build.to(bar, {
        scaleY: 1, opacity: 1,
        duration: 0.12, ease: "power4.out"
      }, land + Math.max(0.1, until - land) * [0.18, 0.48, 0.8][k]);
    });

    if (!a.pal) return;
    const cadence = [0.48, 0.52, 0.38, 0.56, 0.48, 0.24][index];
    let beat = 0;

    for (
      let at = land + 0.14;
      at + 0.27 < until;
      at += cadence
    ) {
      const direction = beat++ % 2 ? -1 : 1;
      const side = direction > 0 ? "right" : "left";
      const other = direction > 0 ? "left" : "right";

      if (index === 0) {
        a.mascot.pose(build, at, {
          arms: "down", eyes: side, legs: side
        });
        build.to(a.body, {
          x: -cell * 0.55, scaleY: 0.86,
          duration: 0.08, ease: "power4.out"
        }, at);
        build.to(a.body, {
          x: cell * 0.3, scaleY: 1,
          duration: 0.1, ease: "power3.out"
        }, at + 0.08);
        build.to(a.body, {
          x: 0, duration: 0.08, ease: "power2.inOut"
        }, at + 0.18);
        build.to(a.bits[0], {
          y: cell * 1.4,
          duration: 0.13, ease: "power2.inOut"
        }, at);
        build.to(a.bits[0], {
          y: 0, duration: 0.13, ease: "power2.inOut"
        }, at + 0.13);
      } else if (index === 1) {
        a.mascot.pose(build, at, {
          arms: "down", eyes: "closed", legs: side
        });
        build.to(a.body, {
          y: -a.hop, scaleX: 0.92, scaleY: 1.05,
          duration: 0.06, ease: "power3.out"
        }, at);
        build.to(a.body, {
          y: 0, scaleX: 1.15, scaleY: 0.76,
          duration: 0.055, ease: "power4.in"
        }, at + 0.06);
        build.to(a.prop, {
          scaleX: 1.16, scaleY: 0.45,
          duration: 0.045, ease: "power4.in"
        }, at + 0.07);
        build.to(a.prop, {
          scaleX: 1, scaleY: 1,
          duration: 0.12, ease: "back.out(2)"
        }, at + 0.115);
        build.to(a.body, {
          scaleX: 1, scaleY: 1,
          duration: 0.12, ease: "back.out(2)"
        }, at + 0.115);
        a.mascot.pose(build, at + 0.13, {
          eyes: "open", legs: "stand"
        });
      } else if (index === 2) {
        a.mascot.pose(build, at, {
          arms: side, eyes: "down" === side ? "open" : "right",
          legs: "stand"
        });
        build.to(a.body, {
          scaleY: 0.91, x: cell * 0.18,
          duration: 0.045, ease: "power4.out"
        }, at);
        build.to(a.body, {
          scaleY: 1, x: 0,
          duration: 0.065, ease: "power3.out"
        }, at + 0.045);
        a.mascot.pose(build, at + 0.12, { arms: other });
        build.to(a.body, {
          scaleY: 0.93, x: -cell * 0.18,
          duration: 0.04, ease: "power4.out"
        }, at + 0.12);
        build.to(a.body, {
          scaleY: 1, x: 0,
          duration: 0.07, ease: "power3.out"
        }, at + 0.16);
        a.bits.forEach((key, k) => {
          const tapAt = at + k * 0.035;
          build.to(key, {
            y: cell * 0.3, duration: 0.03, ease: "power4.in"
          }, tapAt);
          build.to(key, {
            y: 0, duration: 0.05, ease: "power3.out"
          }, tapAt + 0.03);
        });
      } else if (index === 3) {
        a.mascot.pose(build, at, {
          arms: side, eyes: side, legs: "stand"
        });
        build.to(a.body, {
          scaleY: 0.88, scaleX: 1.05,
          duration: 0.08, ease: "power3.in"
        }, at);
        build.to(a.body, {
          scaleY: 1, scaleX: 1,
          duration: 0.16, ease: "back.out(2)"
        }, at + 0.08);
        const lifted = a.bits[direction > 0 ? 1 : 0];
        build.to(lifted, {
          y: -cell * 1.8,
          x: direction * -cell * 0.8,
          duration: 0.1, ease: "power4.out"
        }, at);
        build.to(lifted, {
          y: 0, x: 0,
          duration: 0.14, ease: "power3.in"
        }, at + 0.1);
      } else if (index === 4) {
        a.mascot.pose(build, at, {
          arms: "right", eyes: "right", legs: "left"
        });
        build.to(a.body, {
          x: -cell * 0.45, scaleY: 0.92,
          duration: 0.07, ease: "power3.in"
        }, at);
        build.to(a.body, {
          x: cell * 0.45, scaleY: 1,
          duration: 0.08, ease: "power4.out"
        }, at + 0.07);
        build.to(a.body, {
          x: 0, duration: 0.1, ease: "power3.out"
        }, at + 0.15);
        build.fromTo(a.prop, {
          x: -cell * 0.7
        }, {
          x: 0, duration: 0.12, ease: "back.out(2.5)",
          immediateRender: false
        }, at + 0.07);
      } else {
        a.mascot.pose(build, at, {
          arms: other, eyes: "right", legs: side
        });
        build.to(a.body, {
          y: -a.hop * 0.75, x: cell * 0.2,
          scaleY: 1.04,
          duration: 0.06, ease: "power3.out"
        }, at);
        build.to(a.body, {
          y: 0, x: 0, scaleY: 0.94,
          duration: 0.06, ease: "power3.in"
        }, at + 0.06);
        build.to(a.body, {
          scaleY: 1, duration: 0.06, ease: "power3.out"
        }, at + 0.12);
        build.to(a.prop, {
          x: -cell * 0.8, duration: 0.08, ease: "power4.out"
        }, at);
        build.set(a.prop, { x: 0 }, at + 0.12);
      }
    }
  }

  function completeBeforeKey(a, index) {
    const at = a.finish;
    build.set([a.running, a.runningIcon], { autoAlpha: 0 }, at);
    build.set([a.finished, a.doneIcon], { autoAlpha: 1 }, at);
    if (a.prop) build.set(a.prop, { autoAlpha: 0 }, at);
    build.set(a.tile, {
      backgroundColor: rgba(V.success, 0.25),
      borderColor: V.success
    }, at);
    build.set(a.rail, { backgroundColor: V.success }, at);
    build.set(a.branch.el, { attr: { stroke: V.success } }, at);
    build.set(countText, { textContent: countLabel(index + 1) }, at);
    build.set(progressFill, {
      scaleX: (index + 1) / Math.max(1, n)
    }, at);

    build.fromTo(a.doneIcon, {
      scaleX: 1.5, scaleY: 1.5
    }, {
      scaleX: 1, scaleY: 1,
      duration: 0.2, ease: "back.out(2.8)",
      immediateRender: false
    }, at);
    build.fromTo(a.tile, {
      scaleX: 1.035, scaleY: 1.035
    }, {
      scaleX: 1, scaleY: 1,
      duration: 0.22, ease: "back.out(2.4)",
      immediateRender: false
    }, at);
    build.fromTo(countText, {
      scaleX: 1.13, scaleY: 1.13
    }, {
      scaleX: 1, scaleY: 1,
      duration: 0.2, ease: "power4.out",
      immediateRender: false
    }, at);
    build.fromTo(progressFill, {
      backgroundColor: V.ink
    }, {
      backgroundColor: V.success,
      duration: 0.16, ease: "power3.out",
      immediateRender: false
    }, at);
    build.fromTo(a.branch.el, {
      attr: { "stroke-width": M.branchWidth * 1.55 }
    }, {
      attr: { "stroke-width": M.branchWidth },
      duration: 0.2, ease: "power4.out",
      immediateRender: false
    }, at);

    const rowDone = agents
      .filter((agent) => agent.row === a.row)
      .every((agent) => agent.finish <= at + 0.001);
    build.set(junctions[a.row].el, {
      attr: { fill: rowDone ? V.success : V.accent }
    }, at);
    build.fromTo(junctions[a.row].el, {
      attr: { r: M.node * 1.5 }
    }, {
      attr: { r: M.node },
      duration: 0.2, ease: "power4.out",
      immediateRender: false
    }, at);

    if (!a.pal) return;
    build.set(a.body, {
      x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1
    }, at);
    a.mascot.pose(build, at, {
      arms: "up", eyes: "closed", legs: "stand"
    });
    a.mascot.pose(build, at + 0.12, { eyes: "open" });
    build.to(a.pal, {
      y: a.homeY - a.hop,
      duration: 0.07, ease: "power4.out"
    }, at);
    build.to(a.pal, {
      y: a.homeY,
      duration: 0.1, ease: "power3.in"
    }, at + 0.07);
    build.fromTo(a.body, {
      scaleX: 1.16, scaleY: 0.8
    }, {
      scaleX: 1, scaleY: 1,
      duration: 0.13, ease: "back.out(2.5)",
      immediateRender: false
    }, at + 0.17);
    // No idle tilt replaces this pose: raised arms stay raised.
  }

  agents.forEach((a, i) => {
    const branchAt = a.row * 0.045 + (i % columns) * 0.012;
    const land = a.row === 0 ? 0 : branchAt + 0.07;

    build.to(a.branch.el, {
      strokeDashoffset: 0,
      duration: 0.1, ease: "power4.out"
    }, branchAt);
    build.set([a.tile, a.name, a.status], { autoAlpha: 1 }, land);
    build.fromTo(a.tile, {
      y: 10, scaleX: 0.96, scaleY: 0.88
    }, {
      y: 0, scaleX: 1, scaleY: 1,
      duration: 0.18, ease: "back.out(2.4)",
      immediateRender: false
    }, land);

    if (a.pal) {
      build.set(a.pal, {
        autoAlpha: 1, x: a.homeX, y: a.homeY
      }, land);
      build.set(a.prop, { autoAlpha: 1 }, land);
      a.mascot.pose(build, land, {
        arms: "down",
        eyes: i % 2 ? "left" : "right",
        legs: "stand"
      });
      build.fromTo(a.body, {
        scaleX: 0.9, scaleY: 1.06
      }, {
        scaleX: 1, scaleY: 1,
        duration: 0.18, ease: "back.out(2.4)",
        immediateRender: false
      }, land);
    }

    work(a, i, land);
    if (i < n - 1) completeBeforeKey(a, i);
  });

  // A branch becomes a tether. Its endpoint and the mascot's feet
  // use matching destinations, timing and easing on every segment.
  // There are no callbacks, so blurred samples follow the same route.
  const rope = (x, y) =>
    `M ${rootX} ${hubY} L ${rootX} ${y} L ${x} ${y} L ${x} ${y}`;
  const openActor =
    `polygon(0px 0px,${W}px 0px,${W}px ${H}px,0px ${H}px)`;

  build.set([count, progress], { autoAlpha: 0 }, gatherAt);
  build.set(prompt, { borderColor: V.accent }, gatherAt);

  if (trunk) {
    build.set(trunk.el, {
      strokeDasharray: "none", strokeDashoffset: 0
    }, gatherAt);
    build.to(trunk.el, {
      attr: { d: `M ${rootX} ${hubY} L ${rootX} ${hubY}` },
      duration: 0.12, ease: "power4.in"
    }, gatherAt);
    build.to(rootNode, {
      attr: { cy: hubY, r: M.node * 1.1 },
      duration: 0.12, ease: "power4.in"
    }, gatherAt);
    build.set(trunk.el, { autoAlpha: 0 }, gatherAt + 0.12);
    build.set(hubRing, { autoAlpha: 1 }, gatherAt + 0.08);
    build.fromTo(hubRing, {
      attr: { r: M.node * 2.8 }
    }, {
      attr: { r: M.node * 1.35 },
      duration: 0.24, ease: "power3.in",
      immediateRender: false
    }, gatherAt + 0.08);
    build.to(rootNode, {
      attr: { r: M.node * 1.6 },
      duration: 0.22, ease: "power2.in"
    }, D - 0.4);
    build.to([rootNode, hubRing], {
      attr: { r: 0 },
      duration: 0.16, ease: "power4.in"
    }, D - 0.16);
  }

  junctions.forEach((j) => {
    build.to(j.el, {
      attr: { r: 0 }, duration: 0.08, ease: "power4.in"
    }, gatherAt);
  });

  agents.forEach((a, i) => {
    const anchorX = a.pal ? a.homeX + palW / 2 : a.centerX;
    const anchorY = a.pal ? a.homeY + palH : a.y + tileH * 0.56;
    const laneX = rootX + (i - (n - 1) / 2) * cell * 0.16;
    const laneY = hubY + (i % 2) * cell * 0.12;
    const enter = gatherAt + 0.08 + i * 0.01;
    const turnAt = enter + 0.15;
    const hubAt = turnAt + 0.2;
    const last = i === n - 1;
    const arrive = last
      ? D
      : D - 0.14 + (n > 2 ? i / (n - 2) * 0.08 : 0);
    const spreadTime = Math.max(0.08, arrive - hubAt);

    build.set([a.name, a.status], { autoAlpha: 0 }, gatherAt);
    if (a.prop) build.set(a.prop, { autoAlpha: 0 }, gatherAt);

    const tileShut = a.centerX <= rootX
      ? "polygon(100% 0%,100% 0%,100% 100%,100% 100%)"
      : "polygon(0% 0%,0% 0%,0% 100%,0% 100%)";
    build.to(a.tile, {
      clipPath: tileShut,
      duration: 0.1, ease: "power4.in"
    }, gatherAt);
    build.set(a.tile, { autoAlpha: 0 }, gatherAt + 0.1);

    build.set(a.branch.el, {
      strokeDasharray: "none", strokeDashoffset: 0
    }, gatherAt);
    build.to(a.branch.el, {
      attr: { d: rope(anchorX, anchorY) },
      duration: 0.08, ease: "power4.in"
    }, gatherAt);

    build.set(a.packet, {
      autoAlpha: 1,
      attr: { cx: anchorX, cy: anchorY }
    }, enter);
    build.to(a.branch.el, {
      attr: { d: rope(laneX, anchorY) },
      duration: 0.15, ease: "power3.in"
    }, enter);
    build.to(a.packet, {
      attr: { cx: laneX, cy: anchorY },
      duration: 0.15, ease: "power3.in"
    }, enter);
    build.to(a.branch.el, {
      attr: { d: rope(laneX, laneY) },
      duration: 0.2, ease: "power3.in"
    }, turnAt);
    build.to(a.packet, {
      attr: { cx: laneX, cy: laneY },
      duration: 0.2, ease: "power3.in"
    }, turnAt);
    build.set(a.branch.el, { autoAlpha: 0 }, hubAt);

    if (!a.pal) {
      build.to(a.packet, {
        attr: {
          cx: rootX + (i - (n - 1) / 2) * M.node * 1.6,
          cy: slabTop
        },
        duration: spreadTime, ease: "power4.in"
      }, hubAt);
      return;
    }

    build.set(a.layer, { clipPath: openActor }, gatherAt);
    build.set(a.pal, {
      x: a.homeX, y: a.homeY,
      rotation: 0, scaleX: 1, scaleY: 1
    }, gatherAt);
    build.set(a.body, {
      x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1
    }, gatherAt);
    a.mascot.pose(build, gatherAt, {
      arms: last ? "left" : "up",
      eyes: anchorX < rootX ? "right" : "left",
      legs: "stand"
    });

    build.to(a.pal, {
      x: laneX - palW / 2,
      duration: 0.15, ease: "power3.in"
    }, enter);
    build.to(a.body, {
      scaleX: 0.92, scaleY: 1.08,
      duration: 0.12, ease: "power3.in"
    }, enter);
    build.to(a.pal, {
      y: laneY - palH,
      duration: 0.2, ease: "power3.in"
    }, turnAt);
    build.set(a.packet, { autoAlpha: 0 }, hubAt);

    const spec = pile[i];
    const targetFoot = slabTop + pileCell * 0.35 + spec.v * pileH;
    const targetX = rootX - palW / 2 + spec.u * pileW;
    const targetY = targetFoot - palH;
    a.pileX = targetX;
    a.pileY = targetY;
    a.pileRotation = spec.r;

    a.mascot.pose(build, hubAt, {
      arms: last ? "down" : "up",
      eyes: last ? "closed" : "open",
      legs: last ? "left" : "stand"
    });

    build.to(a.pal, {
      x: targetX,
      rotation: spec.r,
      scaleX: pileScale, scaleY: pileScale,
      duration: spreadTime, ease: "power3.out"
    }, hubAt);
    build.to(a.pal, {
      y: targetY,
      duration: spreadTime, ease: "power3.in"
    }, hubAt);

    if (!last) {
      a.mascot.pose(build, arrive, {
        arms: "up", eyes: "open", legs: "stand"
      });
      build.fromTo(a.body, {
        scaleX: 1.22, scaleY: 0.72
      }, {
        scaleX: 1, scaleY: 1,
        duration: Math.min(0.1, D - arrive),
        ease: "back.out(2.2)",
        immediateRender: false
      }, arrive);
    }
  });

  build.set($("af-grid"), { autoAlpha: 0 }, gatherAt + 0.12);

  // A thin receiving plate arrives at the very end of the pull.
  // It has no result text or completed count before the impact.
  build.set([slab, foot], { autoAlpha: 1 }, D - 0.12);
  build.fromTo([slab, foot], {
    y: compact ? 60 : 100,
    scaleX: 0.94, scaleY: 0.06
  }, {
    y: 0, scaleX: 1, scaleY: 1,
    duration: 0.12, ease: "power4.in",
    immediateRender: false
  }, D - 0.12);

  build.timeScale(1 / T.scale);
  tl.add(build, 0);

  const key = T.key;
  const hold = T.hold;
  const lastAgent = agents[n - 1];

  // One atomic payoff: last tick, complete pile, green slab, full count.
  tl.set(svg, { autoAlpha: 0 }, key);
  tl.set([slab, foot], {
    autoAlpha: 1, y: 0, scaleX: 1, scaleY: 1
  }, key);
  tl.set(slab, {
    backgroundColor: V.success, borderColor: V.success
  }, key);
  tl.set(foot, { backgroundColor: rgba(V.success, 0.45) }, key);
  tl.set(count, {
    top: slabTop + resultCountTop,
    y: 0, color: V.resultInk, autoAlpha: 1
  }, key);
  tl.set(countText, {
    textContent: countLabel(n),
    fontSize: resultCountPx,
    scaleX: 1, scaleY: 1
  }, key);
  tl.set([done, stat], { autoAlpha: 1 }, key);
  tl.set(progress, {
    autoAlpha: 1,
    left: left + M.textPad,
    top: slabTop + slabH - M.slabPad,
    width: inner - M.textPad * 2,
    backgroundColor: rgba(V.resultInk, 0.14)
  }, key);
  tl.set(progressFill, {
    backgroundColor: V.resultInk,
    scaleX: n ? 1 : 0
  }, key);
  tl.set($("af-result-sheen"), { autoAlpha: 1 }, key);
  tl.set(prompt, { borderColor: V.success }, key);

  if (lastAgent) {
    tl.set([lastAgent.running, lastAgent.runningIcon], { autoAlpha: 0 }, key);
    tl.set([lastAgent.finished, lastAgent.doneIcon], { autoAlpha: 1 }, key);
    tl.set(lastAgent.tile, {
      backgroundColor: rgba(V.success, 0.25), borderColor: V.success
    }, key);
    if (lastAgent.badge) {
      tl.set(lastAgent.badge, { autoAlpha: 1 }, key);
    }
  }

  agents.forEach((a, i) => {
    if (!a.pal) return;
    tl.set(a.pal, {
      x: a.pileX, y: a.pileY,
      rotation: a.pileRotation,
      scaleX: pileScale, scaleY: pileScale
    }, key);
    tl.set(a.body, {
      x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1
    }, key);
    a.mascot.pose(tl, key, {
      arms: "up", legs: "stand",
      eyes: i === n - 1 ? "closed" : "open"
    });
  });

  if (hold > 0) {
    tl.fromTo([slab, foot], {
      y: 0, scaleX: 1.022, scaleY: 1.035
    }, {
      y: 0, scaleX: 1, scaleY: 1,
      duration: Math.min(0.34, hold),
      ease: "elastic.out(1,0.48)",
      immediateRender: false
    }, key);
    tl.fromTo(countText, {
      scaleX: 1.07, scaleY: 1.07
    }, {
      scaleX: 1, scaleY: 1,
      duration: Math.min(0.22, hold), ease: "power4.out",
      immediateRender: false
    }, key);
    tl.fromTo($("af-result-edge"), {
      scaleX: 0.2
    }, {
      scaleX: 1,
      duration: Math.min(0.18, hold), ease: "power4.out",
      immediateRender: false
    }, key);
    tl.fromTo($("af-flash"), {
      opacity: 0.14
    }, {
      opacity: 0,
      duration: Math.min(0.12, hold), ease: "power4.out",
      immediateRender: false
    }, key);
    tl.fromTo($("af-result-sheen"), {
      xPercent: -120
    }, {
      xPercent: 450,
      duration: hold, ease: "sine.inOut",
      immediateRender: false
    }, key);
    tl.to(prompt, {
      borderColor: KIT.colors.userMessage,
      duration: Math.min(0.28, hold), ease: "power3.out"
    }, key);

    if (lastAgent && lastAgent.badge) {
      tl.fromTo(lastAgent.badge, {
        scaleX: 1.6, scaleY: 1.6
      }, {
        scaleX: 1, scaleY: 1,
        duration: Math.min(0.24, hold),
        ease: "back.out(2.6)",
        immediateRender: false
      }, key);
    }

    agents.forEach((a, i) => {
      if (!a.pal) return;
      const last = i === n - 1;
      const delay = last ? 0 : (n - 1 - i) * 0.025;
      const available = hold - delay;
      if (available > 0) {
        tl.fromTo(a.body, {
          scaleX: last ? 1.36 : 1.12,
          scaleY: last ? 0.58 : 0.86
        }, {
          scaleX: 1, scaleY: 1,
          duration: Math.min(last ? 0.36 : 0.22, available),
          ease: last ? "elastic.out(1,0.44)" : "back.out(2.4)",
          immediateRender: false
        }, key + delay);
      }

      if (hold > 0.16) {
        a.mascot.pose(tl, key + 0.14, { eyes: "open" });
      }

      const blinkAt = key + 1.02 + i * 0.08;
      if (blinkAt + 0.16 < key + hold) a.mascot.blink(tl, blinkAt);

      const breatheAt = key + 0.86 + i * 0.02;
      const span = key + hold - breatheAt;
      if (span > 0.2) {
        tl.to(a.body, {
          y: -cell * (0.16 + (i % 3) * 0.03),
          duration: span / 2, ease: "sine.inOut"
        }, breatheAt);
        tl.to(a.body, {
          y: 0,
          duration: span / 2, ease: "sine.inOut"
        }, breatheAt + span / 2);
      }
    });

    // The last finisher overbalances; its neighbour catches the perch.
    if (lastAgent && lastAgent.pal && n > 1 && hold > 0.85) {
      const at = key + 0.44;
      lastAgent.mascot.pose(tl, at, { eyes: "right", arms: "up" });
      tl.to(lastAgent.body, {
        x: cell * 0.75, rotation: 10,
        duration: 0.13, ease: "power3.in"
      }, at);
      tl.to(lastAgent.body, {
        x: 0, rotation: 0,
        duration: 0.23, ease: "back.out(2.8)"
      }, at + 0.13);

      const catcher = agents[n - 2];
      catcher.mascot.pose(tl, at + 0.08, {
        arms: "up", eyes: "right"
      });
      tl.to(catcher.body, {
        rotation: -5, duration: 0.08, ease: "power4.out"
      }, at + 0.08);
      tl.to(catcher.body, {
        rotation: 0, duration: 0.18, ease: "back.out(2.2)"
      }, at + 0.16);
    }

    // Sparks sit behind the result slab, so they never cross its words.
    const palette = data.map((a) => a.color).concat([V.success, V.ink]);
    for (let i = 0; i < 22; i++) {
      const p = make("div", "af-spark", $("af-sparks"));
      const size = M.spark * (i % 3 === 0 ? 1.5 : 1);
      const direction = i % 2 ? -1 : 1;
      p.style.cssText +=
        `;width:${size}px;height:${size}px;` +
        `background:${palette[i % palette.length]}`;
      const originX = rootX + direction * inner * (0.24 + rnd() * 0.12);
      const originY = slabTop - 8;
      const reach = direction * inner * (0.26 + rnd() * 0.28);
      const lift = Math.max(
        0,
        Math.min(
          (compact ? 60 : 90) + rnd() * (compact ? 100 : 180),
          originY - promptBottom - size - 12
        )
      );
      const up = Math.min(hold * 0.4, 0.2 + rnd() * 0.12);

      gsap.set(p, { x: originX, y: originY, autoAlpha: 0 });
      tl.set(p, { autoAlpha: 1 }, key);
      tl.to(p, {
        x: originX + reach,
        duration: hold, ease: "power3.out"
      }, key);
      tl.to(p, {
        y: originY - lift,
        duration: up, ease: "power4.out"
      }, key);
      tl.to(p, {
        y: H + size * 2,
        duration: hold - up, ease: "power2.in"
      }, key + up);
      tl.set(p, { autoAlpha: 0 }, key + hold);
    }
  }

  const open = "polygon(0% 0%,100% 0%,100% 100%,0% 100%)";
  const shut = "polygon(50% 0%,50% 0%,50% 100%,50% 100%)";

  if (variant === "overlay") {
    tl.fromTo(stage, {
      clipPath: shut
    }, {
      clipPath: open,
      duration: 0.12, ease: "power4.out"
    }, 0);
  }

  if (T.exit > 0) {
    tl.to(stage, {
      clipPath: shut,
      duration: Math.max(0, T.exit - 1 / CA.fps),
      ease: "power3.in"
    }, key + hold);
  }

  window.__timelines["block"] = tl;
});