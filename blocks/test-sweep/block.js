CA.ready(() => {
  const {
    vars: V, stage: S, safe, time: T, variant,
    make, fit, rgba, seeded
  } = CA;
  const KIT = CA.claude;
  const $ = (id) => document.getElementById(id);
  const stageEl = $("stage");
  const W = S.w;
  const H = S.h;
  const D = Math.max(0.001, Number(T.design) || 4);
  const compact = variant !== "full";
  const minText = compact ? 32 : 40;
  const fps = Math.max(1, Number(CA.fps) || 30);
  const timeScale = Math.max(0.001, Number(T.scale) || 1);
  const designFrame = 1 / (fps * timeScale);
  const text = (value) => String(value == null ? "" : value);
  const clamp = (value, lo, hi) => Math.max(lo, Math.min(hi, value));
  const mix = (a, b, amount) => a + (b - a) * amount;
  const tl = gsap.timeline({ paused: true });
  const build = gsap.timeline();

  const layouts = {
    full: {
      top: 230, bottom: 300,
      wallInset: 24, gap: 12, cols: 8, rows: 12,
      minTile: 96, icon: 56, tileRadius: 19,
      plateSide: 48, plateH: 624, plateRadius: 38,
      plateBorder: 5, plateBias: 0.5, pad: 40,
      plateEdge: 16, plateDepth: 12,
      headerY: 30, headerH: 64, suitePx: 52,
      badge: 64, logo: 48, logoGap: 18,
      countY: 128, countPx: 236,
      captionY: 376, captionPx: 48,
      progressY: 450, progressH: 10,
      stateY: 482, stateH: 100,
      failStatePx: 82, passStatePx: 104,
      stateIcon: 66, stateGap: 18,
      palCell: 26, headroom: 180,
      victoryHop: 180, idleHop: 18,
      openingLift: 18,
      spark: 22, burstCount: 88,
      burstLift: 400, burstSpread: 900
    },
    top: {
      top: 44, bottom: 36,
      wallInset: 20, gap: 10, cols: 8, rows: 6,
      minTile: 82, icon: 46, tileRadius: 16,
      plateSide: 48, plateH: 344, plateRadius: 28,
      plateBorder: 4, plateBias: 0.68, pad: 30,
      plateEdge: 12, plateDepth: 9,
      headerY: 14, headerH: 42, suitePx: 40,
      badge: 44, logo: 34, logoGap: 14,
      countY: 70, countPx: 152,
      captionY: 226, captionPx: 32,
      progressY: 266, progressH: 6,
      stateY: 282, stateH: 46,
      failStatePx: 42, passStatePx: 56,
      stateIcon: 40, stateGap: 14,
      palCell: 16, headroom: 152,
      victoryHop: 160, idleHop: 14,
      openingLift: 12,
      spark: 20, burstCount: 72,
      burstLift: 320, burstSpread: 820
    },
    overlay: {
      top: 40, bottom: 36,
      wallInset: 18, gap: 10, cols: 8, rows: 6,
      minTile: 82, icon: 46, tileRadius: 17,
      plateSide: 44, plateH: 360, plateRadius: 30,
      plateBorder: 4, plateBias: 0.66, pad: 30,
      plateEdge: 13, plateDepth: 10,
      headerY: 16, headerH: 44, suitePx: 40,
      badge: 46, logo: 36, logoGap: 14,
      countY: 74, countPx: 160,
      captionY: 240, captionPx: 32,
      progressY: 282, progressH: 7,
      stateY: 300, stateH: 44,
      failStatePx: 42, passStatePx: 56,
      stateIcon: 40, stateGap: 14,
      palCell: 16, headroom: 164,
      victoryHop: 166, idleHop: 14,
      openingLift: 12,
      spark: 20, burstCount: 78,
      burstLift: 340, burstSpread: 860
    }
  };
  const M = layouts[variant] || layouts.full;
  const palCell = compact && H < 700 ? 12 : M.palCell;
  const palW = palCell * 11;
  const palH = palCell * 8;
  const plateEdge = compact && H < 700 ? 10 : M.plateEdge;

  const requestedTotal = Number(V.total);
  const total = Number.isFinite(requestedTotal)
    ? clamp(Math.round(requestedTotal), 1, Number.MAX_SAFE_INTEGER)
    : 1;
  const separator = text(V.countSeparator);
  const countText = (passed) => `${passed}${separator}${total}`;
  const contentTop = Math.max(M.top, Number(safe.top) || 0);
  const contentBottom = H - Math.max(M.bottom, Number(safe.bottom) || 0);
  const usableH = Math.max(1, contentBottom - contentTop);
  const plateSide = Math.max(M.plateSide, Number(safe.side) || 0);
  const plateW = Math.max(1, W - plateSide * 2);
  const innerW = Math.max(1, plateW - M.pad * 2);

  stageEl.style.background = V.ground;

  const wall = $("wall");
  const wallW = Math.max(1, W - M.wallInset * 2);
  const wallH = Math.max(1, H - M.wallInset * 2);
  wall.style.cssText +=
    `;left:${M.wallInset}px;top:${M.wallInset}px;` +
    `width:${wallW}px;height:${wallH}px`;

  const maxCols = Math.max(
    1,
    Math.min(M.cols, Math.floor((wallW + M.gap) / (M.minTile + M.gap)))
  );
  const maxRows = Math.max(
    1,
    Math.min(M.rows, Math.floor((wallH + M.gap) / (M.minTile + M.gap)))
  );
  const capacity = maxCols * maxRows;
  const desired = Math.min(total, capacity);
  const cols = desired >= capacity
    ? maxCols
    : clamp(Math.round(Math.sqrt(desired * maxCols / maxRows)), 1, maxCols);
  const rows = clamp(Math.floor(desired / cols), 1, maxRows);
  const tileW = (wallW - (cols - 1) * M.gap) / cols;
  const tileH = (wallH - (rows - 1) * M.gap) / rows;
  const iconPx = Math.round(Math.min(M.icon, tileW * 0.52, tileH * 0.52));

  const performanceSpace = V.showMascot
    ? Math.min(
        palH + M.headroom + plateEdge,
        Math.max(
          palH + palCell + plateEdge,
          usableH - (compact ? 240 : 520)
        )
      )
    : 0;
  const plateH = Math.max(
    1,
    Math.min(M.plateH, usableH - performanceSpace)
  );
  const minPlateTop = contentTop + performanceSpace;
  const maxPlateTop = contentBottom - plateH;
  const idealPlateTop = clamp(
    contentTop + (usableH - plateH) * M.plateBias,
    Math.min(minPlateTop, maxPlateTop),
    maxPlateTop
  );

  const tileBottom = (r) =>
    M.wallInset + r * (tileH + M.gap) + tileH;
  const candidates = [];
  for (let r = 0; r < rows; r++) {
    const bottom = tileBottom(r);
    if (bottom >= minPlateTop && bottom <= maxPlateTop) {
      candidates.push({ r, bottom });
    }
  }
  candidates.sort((a, b) =>
    Math.abs(a.bottom - idealPlateTop) - Math.abs(b.bottom - idealPlateTop)
  );
  const plateTop = Math.round(
    candidates.length ? candidates[0].bottom : idealPlateTop
  );

  let finalRow = 0;
  for (let r = 0; r < rows; r++) {
    const top = M.wallInset + r * (tileH + M.gap);
    if (
      top + iconPx + 16 <= plateTop - plateEdge &&
      top + tileH >= contentTop + iconPx
    ) {
      finalRow = r;
    }
  }

  const vertical = plateH / M.plateH;
  const vy = (value) => Math.round(value * vertical);
  const L = {
    headerY: vy(M.headerY),
    headerH: Math.max(minText, vy(M.headerH)),
    suitePx: Math.max(minText, vy(M.suitePx)),
    badge: Math.max(minText, vy(M.badge)),
    countY: vy(M.countY),
    countPx: Math.max(minText, vy(M.countPx)),
    captionY: vy(M.captionY),
    captionPx: Math.max(minText, vy(M.captionPx)),
    progressY: vy(M.progressY),
    progressH: M.progressH,
    stateY: vy(M.stateY),
    stateH: Math.max(minText, vy(M.stateH)),
    failStatePx: Math.max(minText, vy(M.failStatePx)),
    passStatePx: Math.max(minText, vy(M.passStatePx)),
    stateIcon: Math.max(32, vy(M.stateIcon))
  };

  if (compact && plateH < M.plateH - 1) {
    Object.assign(L, {
      headerY: 12,
      headerH: 36,
      suitePx: 32,
      badge: 36,
      countY: 56,
      countPx: Math.max(40, plateH - 174),
      captionY: plateH - 110,
      captionPx: 32,
      progressY: plateH - 65,
      progressH: 6,
      stateY: plateH - 50,
      stateH: 36,
      failStatePx: 36,
      passStatePx: 40,
      stateIcon: 32
    });
  }

  if (compact && plateH < 208) {
    Object.assign(L, {
      headerY: 8,
      headerH: 32,
      badge: 32,
      countY: 48,
      countPx: Math.max(32, plateH - 144),
      captionY: plateH - 94,
      progressY: plateH - 54,
      progressH: 5,
      stateY: plateH - 43,
      stateH: 32,
      failStatePx: 32,
      passStatePx: 34,
      stateIcon: 32
    });
  }

  const tiles = [];
  const rowEls = [];

  for (let r = 0; r < rows; r++) {
    const row = make("div", "wall-row", wall);
    row.style.top = r * (tileH + M.gap) + "px";
    row.style.height = tileH + "px";
    rowEls.push(row);

    for (let c = 0; c < cols; c++) {
      const slot = make("div", "tile-slot", row);
      slot.style.cssText +=
        `;left:${c * (tileW + M.gap)}px;` +
        `width:${tileW}px;height:${tileH}px`;
      slot.style.setProperty("--tile-radius", M.tileRadius + "px");
      slot.style.setProperty("--tile-shadow", rgba(V.ground, 0.75));

      const tile = make("div", "test-tile", slot);
      tile.style.background = V.failColor;
      tile.style.borderColor = rgba(V.failInk, 0.2);
      tile.style.borderRadius = M.tileRadius + "px";

      // This separate spine is visible only while the face is edge-on.
      // It cannot leave a dark strip on a fully opened green card.
      const edge = make("div", "tile-edge", slot);
      edge.style.background = V.failInk;
      edge.style.borderColor = rgba(V.highlightColor, 0.6);

      const bad = make("div", "tile-symbol", tile);
      const good = make("div", "tile-symbol", tile);
      const shade = make("div", "tile-shade", tile);
      shade.style.background = V.failInk;

      const top = M.wallInset + r * (tileH + M.gap);
      const left = M.wallInset + c * (tileW + M.gap);
      const centerX = left + tileW / 2;
      const isFinal = r === finalRow && c === cols - 1;
      let markY = tileH / 2;

      if (
        centerX > plateSide &&
        centerX < plateSide + plateW &&
        top + markY > plateTop - plateEdge &&
        top + markY < plateTop + plateH + plateEdge
      ) {
        const above = plateTop - plateEdge - top;
        const below = top + tileH - plateTop - plateH - plateEdge;
        if (Math.max(above, below) >= iconPx + 20) {
          markY = above >= below ? above / 2 : tileH - below / 2;
        }
      }

      if (isFinal) {
        markY = Math.min(
          markY,
          plateTop - plateEdge - top - iconPx / 2 - 12
        );
        markY = Math.max(
          markY,
          contentTop - top + iconPx / 2 + 8
        );
      }

      markY = clamp(
        markY,
        iconPx / 2 + 8,
        Math.max(iconPx / 2 + 8, tileH - iconPx / 2 - 8)
      );

      [bad, good].forEach((mark) => {
        mark.style.width = mark.style.height = iconPx + "px";
        mark.style.top = markY + "px";
        mark.style.marginLeft = mark.style.marginTop = -iconPx / 2 + "px";
      });

      KIT.glyph(bad, "cross", iconPx, V.failInk);
      KIT.glyph(good, "tick", iconPx, V.passInk);
      gsap.set(good, { autoAlpha: 0 });
      gsap.set(edge, { autoAlpha: 0 });
      gsap.set(tile, {
        scaleX: 1, scaleY: 1,
        rotationX: 0, rotationY: 0,
        y: 0, z: 0,
        filter: "brightness(1)",
        force3D: true
      });

      // Whole diagonals share a hinge beat, making a readable narrow front.
      const rank = c + r;
      tiles.push({
        slot, tile, edge, bad, good, shade,
        r, c, top, left, centerX, markY, rank, isFinal
      });
    }
  }

  const finalTile = tiles.find((item) => item.isFinal);
  const bulk = tiles
    .filter((item) => !item.isFinal)
    .sort((a, b) => a.rank - b.rank || b.r - a.r);
  const ordered = bulk.concat(finalTile);
  const n = ordered.length;

  const openingEnd = Math.min(0.105, D * 0.028);
  const plateOpeningEnd = openingEnd * 1.15;
  const firstHit = Math.ceil(D * 0.06 / designFrame) * designFrame;
  const chaseAt = D * 0.38;
  const runEnd = D * 0.86;
  const finalGuard = Math.min(D * 0.12, Math.max(0.18, designFrame * 3));
  const bulkEnd = Math.max(
    firstHit,
    Math.floor((D - finalGuard) / designFrame) * designFrame
  );
  const breakProgress = 0.22;
  const maxRank = bulk.length
    ? Math.max(1, bulk[bulk.length - 1].rank)
    : 1;
  const wallMaxRank = Math.max(1, cols + rows - 2);

  function waveTime(progress) {
    if (progress <= breakProgress) {
      return mix(firstHit, chaseAt, progress / breakProgress);
    }
    const u = (progress - breakProgress) / (1 - breakProgress);
    return mix(chaseAt, bulkEnd, 1.85 * u - 0.85 * u * u);
  }

  const ranks = [...new Set(bulk.map((item) => item.rank))];
  const bands = new Map();

  ranks.forEach((rank, index) => {
    const raw = waveTime(clamp(rank / maxRank, 0, 1));
    const hit = clamp(
      Math.round(raw / designFrame) * designFrame,
      firstHit,
      bulkEnd
    );
    const previous = index > 0 ? bands.get(ranks[index - 1]).hit : 0;
    const gap = index > 0 ? Math.max(designFrame, hit - previous) : firstHit;
    const span = index === 0
      ? Math.min(0.16, firstHit * 0.6)
      : Math.min(0.44, Math.max(designFrame * 2.4, gap * 1.12));

    bands.set(rank, {
      hit,
      span: Math.min(span, Math.max(designFrame, hit - openingEnd))
    });
  });

  bulk.forEach((item, i) => {
    const band = bands.get(item.rank);
    item.hit = band.hit;
    item.span = band.span;
    item.passed = Math.floor(
      (i + 1) * (total - 1) / Math.max(1, n - 1)
    );
  });
  finalTile.hit = D;
  finalTile.passed = total;

  function indexAt(time) {
    let lo = 0;
    let hi = n - 1;
    let found = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (ordered[mid].hit <= time + 0.000001) {
        found = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    return found;
  }

  function pulseAt(time) {
    const index = indexAt(time);
    if (index < 0) return 0;
    const at = ordered[index].hit;
    let next = D + 0.15;
    for (let i = index + 1; i < n; i++) {
      if (ordered[i].hit > at + 0.000001) {
        next = ordered[i].hit;
        break;
      }
    }
    const life = Math.min(
      0.14,
      Math.max(designFrame * 1.4, (next - at) * 0.75)
    );
    const remaining = Math.max(0, 1 - (time - at) / life);
    return remaining * remaining;
  }

  const plate = $("plate");
  plate.style.cssText +=
    `;left:${plateSide}px;top:${plateTop}px;` +
    `width:${plateW}px;height:${plateH}px;` +
    `border-radius:${M.plateRadius}px;border-width:${M.plateBorder}px;` +
    `border-color:${V.borderColor};background:${V.plateColor};color:${V.ink}`;
  plate.style.setProperty("--plate-edge", plateEdge + "px");
  plate.style.setProperty("--plate-depth", M.plateDepth + "px");
  plate.style.setProperty("--plate-backing", V.ground);

  const rim = $("plate-rim");
  rim.style.borderRadius = Math.max(8, M.plateRadius - 11) + "px";
  rim.style.borderColor = V.highlightColor;
  if (plateH < 208) {
    rim.style.inset = "6px";
    rim.style.borderWidth = "2px";
  }

  const aura = $("plate-aura");
  const shock = $("plate-shock");
  const ringOutset = plateEdge + 6;
  [aura, shock].forEach((element) => {
    element.style.cssText +=
      `;left:${plateSide - ringOutset}px;top:${plateTop - ringOutset}px;` +
      `width:${plateW + ringOutset * 2}px;` +
      `height:${plateH + ringOutset * 2}px;` +
      `border-radius:${M.plateRadius + ringOutset}px;` +
      `border-color:${V.highlightColor}`;
    gsap.set(element, { autoAlpha: 0, scaleX: 1, scaleY: 1 });
  });

  $("suite-line").style.cssText +=
    `;left:${M.pad}px;top:${L.headerY}px;` +
    `width:${innerW}px;height:${L.headerH}px`;

  const badge = $("logo-badge");
  badge.style.cssText +=
    `;width:${L.badge}px;height:${L.badge}px;` +
    `border-radius:${Math.round(L.badge * 0.24)}px;background:${V.ground}`;

  if (V.showLogo) {
    KIT.logo($("logo"), Math.min(M.logo, L.badge - 10), V.accent);
    badge.style.marginRight = M.logoGap + "px";
  } else {
    badge.style.display = "none";
  }

  const suiteName = $("suite-name");
  suiteName.textContent = text(V.suiteName);
  suiteName.style.fontSize = L.suitePx + "px";
  fit(
    suiteName,
    innerW - (V.showLogo ? L.badge + M.logoGap : 0),
    minText
  );
  if (!text(V.suiteName).trim()) {
    suiteName.style.display = "none";
    badge.style.marginRight = "0px";
  }

  $("counter-wrap").style.cssText +=
    `;left:${M.pad}px;top:${L.countY}px;width:${innerW}px`;

  const counter = $("counter");
  counter.style.fontSize = L.countPx + "px";
  const widest = "8".repeat(text(total).length);
  counter.textContent = widest + separator + widest;
  fit(counter, innerW * 0.9, minText);
  counter.textContent = countText(0);
  gsap.set(counter, { scaleX: 1, scaleY: 1 });

  $("caption-wrap").style.cssText +=
    `;left:${M.pad}px;top:${L.captionY}px;width:${innerW}px`;
  const caption = $("counter-label");
  caption.textContent = text(V.countLabel);
  caption.style.fontSize = L.captionPx + "px";
  caption.style.color = V.muted;
  fit(caption, innerW, minText);
  if (!text(V.countLabel).trim()) caption.style.display = "none";

  const progress = $("progress");
  progress.style.cssText +=
    `;left:${M.pad}px;top:${L.progressY}px;` +
    `width:${innerW}px;height:${L.progressH}px;` +
    `background:${rgba(V.ink, 0.14)}`;

  const fill = $("progress-fill");
  fill.style.background = V.passColor;
  gsap.set(fill, { scaleX: 0, scaleY: 1 });

  const stateLine = $("state-line");
  stateLine.style.cssText +=
    `;left:${M.pad}px;top:${L.stateY}px;` +
    `width:${innerW}px;height:${L.stateH}px;color:${V.failColor}`;

  const stateIcon = $("state-icon");
  stateIcon.style.width = stateIcon.style.height = L.stateIcon + "px";
  stateIcon.style.marginRight =
    (text(V.failWord).trim() ? M.stateGap : 0) + "px";
  KIT.glyph($("state-fail"), "cross", L.stateIcon, V.failColor);
  KIT.glyph($("state-pass"), "tick", L.stateIcon, V.passInk);
  gsap.set($("state-pass"), { autoAlpha: 0 });

  const stateText = $("state-text");
  const stateTextW = (innerW - L.stateIcon - M.stateGap) * 0.88;

  stateText.textContent = text(V.passWord);
  stateText.style.fontSize = L.passStatePx + "px";
  fit(stateText, stateTextW, minText);
  const passPx = parseFloat(stateText.style.fontSize) || minText;

  stateText.textContent = text(V.failWord);
  stateText.style.fontSize = L.failStatePx + "px";
  fit(stateText, stateTextW, minText);

  build.fromTo(plate, {
    y: M.openingLift,
    scaleX: 1.025,
    scaleY: 0.94
  }, {
    y: 0,
    scaleX: 1,
    scaleY: 1,
    duration: plateOpeningEnd,
    ease: "back.out(1.7)"
  }, 0);

  // Every row is present in the first pose. Only its short impact is staggered.
  const rowSlam = openingEnd * 0.72;
  const rowStagger = rows > 1
    ? (openingEnd - rowSlam) / (rows - 1)
    : 0;
  rowEls.forEach((row, i) => {
    gsap.set(row, {
      autoAlpha: 1,
      x: (i % 2 ? -1 : 1) * tileW * 0.035,
      y: -6,
      scaleX: 0.99,
      scaleY: 0.94
    });
    build.to(row, {
      x: 0, y: 0,
      scaleX: 1, scaleY: 1,
      duration: rowSlam,
      ease: "back.out(1.5)"
    }, i * rowStagger);
  });

  function flip(item, hit, span, final) {
    const start = Math.max(0, hit - span);
    const closeAt = start + span * 0.28;
    const swapAt = start + span * 0.5;
    const openAt = start + span * 0.62;

    build.to(item.tile, {
      scaleX: 0,
      scaleY: 1,
      rotationY: -62,
      rotationX: 0,
      y: final ? -6 : -3,
      z: final ? 30 : 16,
      duration: closeAt - start,
      ease: "power4.in"
    }, start);
    build.to(item.shade, {
      opacity: 0.56,
      duration: closeAt - start,
      ease: "power3.in"
    }, start);
    build.set(item.edge, {
      autoAlpha: 1,
      backgroundColor: V.failInk
    }, Math.max(start, closeAt - Math.min(designFrame * 0.3, span * 0.04)));

    build.set(item.bad, { autoAlpha: 0 }, swapAt);
    build.set(item.good, { autoAlpha: 1 }, swapAt);
    build.set(item.tile, {
      backgroundColor: V.passColor,
      borderColor: V.highlightColor,
      rotationY: 62,
      scaleX: 0
    }, swapAt);
    build.set(item.edge, { backgroundColor: V.passInk }, swapAt);
    build.set(item.shade, { opacity: 0 }, swapAt);

    build.to(item.tile, {
      scaleX: 1, scaleY: 1,
      rotationY: 0, rotationX: 0,
      y: 0, z: 0,
      duration: hit - openAt,
      ease: final ? "power4.out" : "power3.out"
    }, openAt);
    build.set(item.edge, {
      autoAlpha: 0
    }, openAt + (hit - openAt) * 0.16);

    // The count changes on the completed green landing, never at the hinge.
    build.set(item.tile, {
      scaleX: 1, scaleY: 1,
      rotationY: 0, rotationX: 0,
      y: 0, z: 0
    }, hit);
    build.set(item.edge, { autoAlpha: 0 }, hit);

    if (!final) {
      build.set(counter, {
        textContent: countText(item.passed)
      }, hit);
      build.set(fill, { scaleX: item.passed / total }, hit);
      build.to(item.tile, {
        borderColor: rgba(V.passInk, 0.22),
        duration: Math.min(0.1, Math.max(0.001, D - hit)),
        ease: "power3.out"
      }, hit);
    }
  }

  bulk.forEach((item) => flip(item, item.hit, item.span, false));

  const finalHalo = make("div", "tile-halo", finalTile.slot);
  finalHalo.style.borderRadius = Math.max(8, M.tileRadius - 3) + "px";
  finalHalo.style.borderColor = V.highlightColor;
  gsap.set(finalHalo, { autoAlpha: 0, scaleX: 1, scaleY: 1 });

  const finalSpan = Math.min(0.2, D * 0.07);
  const chargeAt = Math.max(runEnd, D - finalSpan - 0.12);
  build.set(finalHalo, { autoAlpha: 1, opacity: 0.65 }, chargeAt);
  build.to(finalHalo, {
    opacity: 1,
    duration: Math.max(0.001, D - chargeAt),
    ease: "power3.in"
  }, chargeAt);
  flip(finalTile, D, finalSpan, true);

  // Modifiers keep the event-suppressed motion-blur samples deterministic.
  const driveStart = plateOpeningEnd;
  const driveSpan = Math.max(0.001, D - driveStart);
  const clockTime = (value) =>
    driveStart + clamp(Number(value) - 1, 0, 1) * driveSpan;

  build.fromTo(counter, { scaleX: 1, scaleY: 1 }, {
    scaleX: 2, scaleY: 2,
    duration: driveSpan,
    ease: "none",
    immediateRender: false,
    modifiers: {
      scaleX(value) {
        return 1 + pulseAt(clockTime(value)) * 0.03;
      },
      scaleY(value) {
        return 1 + pulseAt(clockTime(value)) * 0.03;
      }
    }
  }, driveStart);

  build.fromTo(plate, { scaleX: 1, scaleY: 1 }, {
    scaleX: 2, scaleY: 2,
    duration: driveSpan,
    ease: "none",
    immediateRender: false,
    modifiers: {
      scaleX(value) {
        return 1 + pulseAt(clockTime(value)) * 0.007;
      },
      scaleY(value) {
        return 1 + pulseAt(clockTime(value)) * 0.012;
      }
    }
  }, driveStart);

  const pal = $("pal");
  const palBody = $("pal-body");
  const sparks = $("sparks");
  let clawd = null;
  let landingX = W / 2 - palW / 2;
  let landingY = plateTop - plateEdge - palH;
  let victoryLift = 0;
  let sparkOriginX = W / 2;
  let sparkOriginY = plateTop - plateEdge - palCell;

  if (V.showMascot) {
    clawd = KIT.mascot(palBody, palCell, { color: V.accent });
    pal.style.width = palBody.style.width = clawd.width + "px";
    pal.style.height = palBody.style.height = clawd.height + "px";

    const quantum = palCell / 4;
    const pixel = (value) => Math.round(value / quantum) * quantum;
    const snapX = (value) => pixel(parseFloat(value)) + "px";
    const runMin = Math.max(
      plateSide + palCell * 0.5,
      Number(safe.side) || 0
    );
    const runMax = Math.max(
      runMin,
      plateSide + plateW - clawd.width - palCell
    );

    // Leave the final test's glyph exposed beside the character.
    const finalMarkLeft = finalTile.centerX - iconPx / 2;
    landingX = pixel(clamp(
      finalMarkLeft - clawd.width - palCell * 0.6,
      runMin,
      runMax
    ));
    landingY = plateTop - plateEdge - clawd.height;
    const runStartX = pixel(Math.min(runMin, landingX));
    const routeWidth = Math.max(0, landingX - runStartX);
    const footY = landingY + clawd.height;
    const prepEnd = D * 0.06;
    const glanceAt = D * 0.30;

    sparkOriginX = landingX + clawd.width / 2;
    sparkOriginY = footY - palCell;
    victoryLift = Math.max(0, Math.min(
      M.victoryHop,
      landingY - contentTop - palCell * 0.35
    ));

    gsap.set(pal, {
      x: runStartX + palCell,
      y: landingY,
      scaleX: 1, scaleY: 1
    });
    gsap.set(palBody, {
      y: 0, rotation: 0,
      scaleX: 1, scaleY: 1
    });
    clawd.pose(build, 0, {
      eyes: "right", arms: "down", legs: "stand"
    });
    clawd.pose(build, D * 0.01, {
      eyes: "left", arms: "left", legs: "right"
    });
    build.to(pal, {
      x: runStartX,
      duration: prepEnd - D * 0.01,
      ease: "power2.in",
      modifiers: { x: snapX }
    }, D * 0.01);
    build.to(palBody, {
      rotation: -8,
      duration: prepEnd - D * 0.01,
      ease: "power2.in"
    }, D * 0.01);
    build.set(palBody, {
      rotation: 6, scaleX: 1, scaleY: 1
    }, prepEnd);

    const stops = [
      { at: prepEnd, fraction: 0, running: false },
      { at: D * 0.14, fraction: 0.09, running: false },
      { at: D * 0.22, fraction: 0.20, running: false },
      { at: glanceAt, fraction: 0.32, running: false },
      { at: chaseAt, fraction: 0.32, running: true }
    ];
    const runSteps = compact ? 14 : 13;
    for (let i = 1; i <= runSteps; i++) {
      const u = i / runSteps;
      stops.push({
        at: mix(chaseAt, runEnd, 1.35 * u - 0.35 * u * u),
        fraction: mix(0.32, 1, u),
        running: true
      });
    }
    stops.forEach((stop) => {
      stop.x = pixel(runStartX + routeWidth * stop.fraction);
    });

    stops.forEach((stop, i) => {
      const next = stops[i + 1];
      const left = i % 2 === 0;
      const span = next ? next.at - stop.at : D * 0.03;
      const stationary = next && Math.abs(next.x - stop.x) < quantum;
      const plant = Math.min(
        stop.running ? 0.035 : 0.065,
        span * 0.24
      );

      clawd.pose(build, stop.at, {
        eyes: "right",
        arms: left ? "right" : "left",
        legs: left ? "left" : "right"
      });
      build.set(pal, { x: stop.x, y: landingY }, stop.at);
      build.set(palBody, { scaleX: 1, scaleY: 1 }, stop.at);

      if (next && !stationary) {
        const takeoff = stop.at + plant;
        const air = next.at - takeoff;
        const rise = air * 0.43;
        const hop = palCell * (stop.running ? 1.1 : 0.55);

        build.to(pal, {
          x: next.x,
          duration: air,
          ease: "power2.inOut",
          modifiers: { x: snapX }
        }, takeoff);
        build.to(pal, {
          y: landingY - hop,
          duration: rise,
          ease: "power3.out"
        }, takeoff);
        build.to(pal, {
          y: landingY,
          duration: air - rise,
          ease: "power3.in"
        }, takeoff + rise);
      }

      if (i === 0 || stop.fraction !== stops[i - 1].fraction) {
        for (let p = 0; p < 2; p++) {
          const dust = make("div", "spark", sparks);
          const size = Math.max(8, palCell * 0.5);
          const x = stop.x + clawd.width * (left ? 0.34 : 0.66);
          const y = footY - size;
          const life = Math.min(0.14, span * 0.7);
          dust.style.cssText +=
            `;width:${size}px;height:${size}px;background:${V.accent}`;
          gsap.set(dust, { x, y, autoAlpha: 0 });
          build.set(dust, { autoAlpha: 1 }, stop.at);
          build.fromTo(dust, {
            x, y, scaleX: 1, scaleY: 1
          }, {
            x: x - palCell * (p ? 2 : 1),
            y: y - palCell * (p ? 0.7 : 1.2),
            scaleX: 0, scaleY: 0,
            duration: life,
            ease: "power3.out",
            immediateRender: false
          }, stop.at);
          build.set(dust, { autoAlpha: 0 }, stop.at + life);
        }
      }
    });

    // The wall catches up while the mascot looks back and freezes one foot.
    clawd.pose(build, glanceAt, {
      eyes: "left", arms: "down", legs: "stand"
    });
    build.to(palBody, {
      rotation: -8,
      duration: D * 0.022,
      ease: "power3.out"
    }, glanceAt);
    clawd.pose(build, D * 0.345, {
      eyes: "closed", arms: "left", legs: "stand"
    });
    clawd.pose(build, D * 0.36, {
      eyes: "left", arms: "left", legs: "stand"
    });
    clawd.pose(build, chaseAt, {
      eyes: "right", arms: "right", legs: "left"
    });
    build.set(palBody, {
      rotation: 8, scaleX: 1, scaleY: 1
    }, chaseAt);

    // Stop, plant, then compress deeply without widening the character.
    build.set(pal, { x: landingX, y: landingY }, runEnd);
    build.set(palBody, {
      rotation: 0, scaleX: 1, scaleY: 1
    }, runEnd);
    clawd.pose(build, runEnd, {
      eyes: "right", arms: "down", legs: "stand"
    });
    build.to(palBody, {
      scaleY: 0.56,
      duration: D * 0.085,
      ease: "power3.in"
    }, D * 0.89);
    clawd.pose(build, D * 0.95, {
      eyes: "closed", arms: "down", legs: "stand"
    });
  } else {
    pal.style.display = "none";
  }

  build.timeScale(1 / timeScale);
  tl.add(build, 0);

  const key = T.key;
  const hold = Math.max(0, T.hold);
  const reaction = Math.min(0.34, hold);
  const impactDown = reaction * 0.28;
  const passDelay = hold > 0 ? Math.min(0.11, hold * 0.18) : 0;
  const passAt = key + passDelay;
  const platePunchX = compact ? 1.035 : 1.045;
  const platePunchY = compact ? 1.07 : 1.085;
  const countPunch = compact ? 1.075 : 1.09;
  const statePunch = compact ? 1.08 : 1.12;

  // These are terminal poses, not the start of another tile settlement.
  // Nothing can remain edge-on when the counter first reads the total.
  tl.set(tiles.map((item) => item.tile), {
    scaleX: 1, scaleY: 1,
    rotationX: 0, rotationY: 0,
    x: 0, y: 0, z: 0,
    backgroundColor: V.passColor,
    borderColor: rgba(V.passInk, 0.22),
    filter: "brightness(1)"
  }, key);
  tl.set(tiles.map((item) => item.bad), { autoAlpha: 0 }, key);
  tl.set(tiles.map((item) => item.good), { autoAlpha: 1 }, key);
  tl.set(tiles.map((item) => item.edge), { autoAlpha: 0 }, key);
  tl.set(tiles.map((item) => item.shade), { opacity: 0 }, key);
  tl.set(finalTile.tile, {
    borderColor: V.highlightColor,
    borderWidth: 5
  }, key);
  tl.set(finalHalo, {
    autoAlpha: 1, opacity: 1, scaleX: 1, scaleY: 1
  }, key);

  tl.set(counter, {
    textContent: countText(total),
    scaleX: hold > 0 ? countPunch : 1,
    scaleY: hold > 0 ? countPunch : 1
  }, key);
  tl.set(fill, { scaleX: 1, backgroundColor: V.passInk }, key);
  tl.set(plate, {
    backgroundColor: V.passColor,
    borderColor: V.passInk,
    color: V.passInk,
    scaleX: hold > 0 ? platePunchX : 1,
    scaleY: hold > 0 ? platePunchY : 1
  }, key);
  tl.set(caption, { color: V.passInk }, key);
  tl.set(progress, { backgroundColor: rgba(V.passInk, 0.2) }, key);

  // Remove the failing state on the total hit. The larger success line
  // has its own sharp landing a beat later, with no duplicate wording.
  tl.set(stateLine, {
    autoAlpha: 0,
    color: V.passInk,
    x: 0, y: 0,
    scaleX: 1, scaleY: 1
  }, key);
  tl.set(stateIcon, {
    marginRight: text(V.passWord).trim() ? M.stateGap : 0
  }, key);
  tl.set($("state-fail"), { autoAlpha: 0 }, key);
  tl.set($("state-pass"), { autoAlpha: 1 }, key);
  tl.set(stateText, {
    textContent: text(V.passWord),
    fontSize: passPx
  }, key);
  tl.set(stateLine, {
    autoAlpha: 1,
    scaleX: hold > 0 ? statePunch : 1,
    scaleY: hold > 0 ? statePunch : 1
  }, passAt);
  tl.set(rim, { opacity: 1 }, key);
  tl.set(aura, { autoAlpha: 1, opacity: 0.85 }, key);
  tl.set(wall, { filter: hold > 0 ? "brightness(1.3)" : "brightness(1)" }, key);

  if (clawd) {
    clawd.pose(tl, key, {
      arms: "up", eyes: "open", legs: "left"
    });
    tl.set(pal, {
      x: landingX,
      y: hold > 0 ? landingY - palCell * 0.45 : landingY,
      scaleX: 1, scaleY: 1
    }, key);
    tl.set(palBody, {
      y: 0, rotation: 0,
      scaleX: 1,
      scaleY: hold > 0 ? 1.16 : 1
    }, key);
  }

  if (hold > 0) {
    tl.to(wall, {
      filter: "brightness(1)",
      duration: Math.min(0.22, hold),
      ease: "power3.out"
    }, key);
    tl.to(finalTile.tile, {
      borderWidth: 2,
      duration: Math.min(0.18, hold),
      ease: "power3.out"
    }, key);
    tl.to(finalHalo, {
      opacity: 0.55,
      duration: reaction,
      ease: "power3.out"
    }, key);

    tl.to(plate, {
      scaleX: 0.994, scaleY: 0.98,
      duration: impactDown,
      ease: "power3.out"
    }, key);
    tl.to(plate, {
      scaleX: 1, scaleY: 1,
      duration: reaction - impactDown,
      ease: "back.out(1.8)"
    }, key + impactDown);
    tl.to(counter, {
      scaleX: 0.99, scaleY: 0.99,
      duration: impactDown,
      ease: "power3.out"
    }, key);
    tl.to(counter, {
      scaleX: 1, scaleY: 1,
      duration: reaction - impactDown,
      ease: "back.out(1.8)"
    }, key + impactDown);
    tl.to(stateLine, {
      scaleX: 1, scaleY: 1,
      duration: Math.min(0.24, hold - passDelay),
      ease: "back.out(1.7)"
    }, passAt);

    tl.set(shock, {
      autoAlpha: 1, opacity: 1,
      scaleX: 0.99, scaleY: 0.99
    }, key);
    tl.to(shock, {
      scaleX: compact ? 1.08 : 1.1,
      scaleY: compact ? 1.2 : 1.16,
      opacity: 0,
      duration: Math.min(0.32, hold),
      ease: "power3.out"
    }, key);
    tl.to(aura, {
      opacity: 0.3,
      duration: reaction,
      ease: "power3.out"
    }, key);
    tl.to(rim, {
      opacity: 0.65,
      duration: reaction,
      ease: "power3.out"
    }, key);

    if (hold > reaction) {
      tl.to(aura, {
        opacity: 0.48,
        duration: (hold - reaction) / 2,
        repeat: 1,
        yoyo: true,
        ease: "sine.inOut"
      }, key + reaction);
    }

    // Hold movement changes brightness only. Card transforms stay exact.
    const shimmerStart = Math.min(0.28, hold * 0.2);
    const shimmerSpan = Math.min(0.5, hold - shimmerStart);
    const shimmerTravel = Math.max(0, hold - shimmerStart - shimmerSpan);
    tiles.forEach((item) => {
      const at = key + shimmerStart +
        shimmerTravel * item.rank / wallMaxRank;
      tl.to(item.tile, {
        filter: "brightness(1.17)",
        duration: shimmerSpan * 0.45,
        ease: "sine.inOut"
      }, at);
      tl.to(item.tile, {
        filter: "brightness(1)",
        duration: shimmerSpan * 0.55,
        ease: "sine.inOut"
      }, at + shimmerSpan * 0.45);
    });

    if (clawd) {
      const celebration = Math.min(0.78, hold);
      const rise = celebration * 0.28;
      const apex = celebration * 0.08;
      const fall = celebration * 0.38;
      const compression = celebration * 0.09;
      const recover = celebration * 0.17;
      const fallAt = key + rise + apex;
      const landAt = fallAt + fall;

      tl.to(pal, {
        y: landingY - victoryLift,
        duration: rise,
        ease: "power3.out"
      }, key);
      tl.to(palBody, {
        rotation: -5,
        scaleX: 1, scaleY: 1,
        duration: rise,
        ease: "power3.out"
      }, key);
      clawd.pose(tl, key + rise, {
        arms: "up", eyes: "open", legs: "right"
      });
      tl.to(palBody, {
        rotation: 4,
        duration: apex + fall,
        ease: "power2.inOut"
      }, key + rise);
      tl.to(pal, {
        y: landingY,
        duration: fall,
        ease: "power3.in"
      }, fallAt);
      clawd.pose(tl, landAt, {
        arms: "up", eyes: "closed", legs: "stand"
      });
      tl.to(palBody, {
        rotation: 0,
        scaleX: 1, scaleY: 0.76,
        duration: compression,
        ease: "power3.out"
      }, landAt);
      tl.to(palBody, {
        scaleX: 1, scaleY: 1,
        duration: recover,
        ease: "back.out(1.7)"
      }, landAt + compression);
      clawd.pose(tl, key + celebration, {
        arms: "up", eyes: "open", legs: "stand"
      });

      let elapsed = celebration;
      let hopIndex = 0;
      while (hold - elapsed >= 0.36) {
        const cycle = Math.min(0.64, hold - elapsed);
        const at = key + elapsed;
        const plant = cycle * 0.2;
        const up = cycle * 0.25;
        const down = cycle * 0.3;
        const settle = cycle - plant - up - down;
        const lift = Math.min(M.idleHop, victoryLift * 0.25);
        const takeoff = at + plant;
        const contact = takeoff + up + down;

        tl.to(palBody, {
          scaleX: 1, scaleY: 0.92,
          duration: plant,
          ease: "power2.in"
        }, at);
        clawd.pose(tl, takeoff, {
          arms: "up",
          legs: hopIndex % 2 ? "right" : "left"
        });
        tl.to(palBody, {
          scaleX: 1, scaleY: 1,
          duration: up,
          ease: "power2.out"
        }, takeoff);
        tl.to(pal, {
          y: landingY - lift,
          duration: up,
          ease: "power3.out"
        }, takeoff);
        tl.to(pal, {
          y: landingY,
          duration: down,
          ease: "power3.in"
        }, takeoff + up);
        clawd.pose(tl, contact, {
          arms: "up", legs: "stand"
        });
        tl.set(palBody, { scaleX: 1, scaleY: 0.94 }, contact);
        tl.to(palBody, {
          scaleX: 1, scaleY: 1,
          duration: settle,
          ease: "back.out(1.4)"
        }, contact);

        elapsed += cycle;
        hopIndex++;
      }

      if (hold > 1.2) {
        clawd.pose(tl, key + 0.84, { eyes: "left" });
        clawd.pose(tl, key + 0.98, { eyes: "open" });
        clawd.blink(tl, key + 1.04);
      }
      if (hold > 1.7) clawd.blink(tl, key + 1.48);
    }

    const sparkRandom = seeded(97);
    const palette = [
      V.accent, V.highlightColor, V.highlightColor, V.passInk
    ];

    // Large square pixels remain above the plate's dark backing.
    // Their size, spread and lifetime are designed for phone playback.
    for (let i = 0; i < M.burstCount; i++) {
      const particle = make("div", "spark", sparks);
      const sizeRoll = sparkRandom();
      const size = Math.round(M.spark * (
        sizeRoll > 0.9 ? 3 :
        sizeRoll > 0.66 ? 2 :
        sizeRoll > 0.3 ? 1.5 : 1
      ));
      particle.style.cssText +=
        `;width:${size}px;height:${size}px;` +
        `background:${palette[i % palette.length]}`;

      const startSpread = clawd ? clawd.width * 0.9 : plateW * 0.6;
      const ceilingY = plateTop - plateEdge - size - 6;
      const x = clamp(
        sparkOriginX + (sparkRandom() - 0.5) * startSpread,
        M.wallInset,
        W - M.wallInset - size
      );
      const y = Math.min(
        ceilingY,
        Math.max(
          contentTop + 8,
          sparkOriginY - sparkRandom() * (clawd ? clawd.height * 0.7 : 50)
        )
      );
      const towardCenter = (W / 2 - x) * 0.34;
      const endX = clamp(
        x + towardCenter + (sparkRandom() - 0.5) * M.burstSpread,
        M.wallInset,
        W - M.wallInset - size
      );
      const availableRise = Math.max(0, y - contentTop - 8);
      const lift = Math.min(
        M.burstLift * (0.5 + sparkRandom() * 0.75),
        availableRise * (0.62 + sparkRandom() * 0.36)
      );
      const apexY = y - lift;
      const life = Math.min(hold, 0.76 + sparkRandom() * 0.38);
      const rise = life * 0.42;
      const shrink = life * 0.2;
      const returnY = Math.min(
        ceilingY,
        apexY + palCell * (2.5 + sparkRandom() * 5)
      );

      gsap.set(particle, {
        x, y, autoAlpha: 0,
        scaleX: 1, scaleY: 1
      });
      tl.set(particle, { autoAlpha: 1 }, key);
      tl.to(particle, {
        x: endX,
        duration: life,
        ease: "power3.out"
      }, key);
      tl.to(particle, {
        y: apexY,
        duration: rise,
        ease: "power4.out"
      }, key);
      tl.to(particle, {
        y: returnY,
        duration: life - rise,
        ease: "power2.in"
      }, key + rise);
      tl.to(particle, {
        scaleX: 0, scaleY: 0,
        duration: shrink,
        ease: "power3.in"
      }, key + life - shrink);
      tl.set(particle, { autoAlpha: 0 }, key + life);
    }
  }

  const open = "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)";
  const enterShut = "polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)";
  const exitShut = "polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)";

  if (variant === "overlay") {
    tl.fromTo(stageEl, { clipPath: enterShut }, {
      clipPath: open,
      duration: Math.min(0.09, T.key * 0.035),
      ease: "power4.out"
    }, 0);
  }

  if (T.exit > 0) {
    tl.to(stageEl, {
      clipPath: exitShut,
      duration: Math.max(0, T.exit - 1 / fps),
      ease: "power3.in"
    }, key + hold);
  }

  window.__timelines["block"] = tl;
});