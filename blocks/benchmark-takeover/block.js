CA.ready(() => {
  const {
    vars: V, stage: S, safe, time: T, variant,
    make, fit, rgba, parseStat, formatStat, grainUrl, seeded
  } = CA;

  const KIT = CA.claude;
  const $ = (id) => document.getElementById(id);
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const W = S.w;
  const H = S.h;
  const D = T.design;
  const timeScale = Math.max(0.001, Number(T.scale) || 1);
  const fps = Math.max(1, Number(CA.fps) || 30);
  const compact = variant !== "full";
  const minText = compact ? 32 : 40;
  const density = compact ? clamp(H / 960, 0.6, 1) : 1;
  const frames = (n) => n / (fps * timeScale);

  const layouts = {
    full: {
      side: 40, top: 230, bottom: 300,
      title: 88, headerGap: 14, boardGap: 20,
      roofPad: 10, hopReserve: 36,
      palMargin: 28, cell: 27, hop: 38,
      gap: 16, rowMin: 148,
      pad: 24, rankW: 108, rankPx: 104,
      name: 100, score: 112, scoreW: 280,
      barH: 30, barBottom: 10,
      heroH: 404, heroShare: 0.35,
      heroRankW: 250, stamp: 180,
      heroName: 84, heroScore: 216,
      brandTop: 24, brandGap: 16, scoreClear: 8,
      heroBarH: 40, heroBarBottom: 16,
      logo: 54, logoGap: 18,
      edge: 10, hitX: 16, recoil: 26,
      tension: 6, spark: 12
    },
    top: {
      side: 36, top: 16, bottom: 16,
      title: 68, headerGap: 10, boardGap: 14,
      roofPad: 6, hopReserve: 24,
      palMargin: 24, cell: 24, hop: 24,
      gap: 12, rowMin: 86,
      pad: 18, rankW: 82, rankPx: 78,
      name: 76, score: 86, scoreW: 224,
      barH: 18, barBottom: 6,
      heroH: 300, heroShare: 0.42,
      heroRankW: 236, stamp: 144,
      heroName: 60, heroScore: 174,
      brandTop: 16, brandGap: 12, scoreClear: 6,
      heroBarH: 26, heroBarBottom: 10,
      logo: 46, logoGap: 18,
      edge: 8, hitX: 12, recoil: 20,
      tension: 4, spark: 10
    },
    overlay: {
      side: 30, top: 18, bottom: 18,
      title: 70, headerGap: 12, boardGap: 14,
      roofPad: 8, hopReserve: 28,
      palMargin: 24, cell: 24, hop: 26,
      gap: 14, rowMin: 86,
      pad: 18, rankW: 84, rankPx: 80,
      name: 78, score: 88, scoreW: 228,
      barH: 20, barBottom: 6,
      heroH: 304, heroShare: 0.43,
      heroRankW: 240, stamp: 146,
      heroName: 62, heroScore: 178,
      brandTop: 18, brandGap: 12, scoreClear: 6,
      heroBarH: 28, heroBarBottom: 12,
      logo: 48, logoGap: 18,
      edge: 8, hitX: 12, recoil: 22,
      tension: 4, spark: 10
    }
  };

  const M = layouts[variant] || layouts.full;
  const left = compact ? M.side : Math.max(M.side, safe.side || 0);
  const rowW = W - left * 2;
  const pad = Math.max(12, Math.round(M.pad * density));
  const gap = Math.max(8, Math.round(M.gap * density));
  const rankW = Math.round(M.rankW * Math.max(0.78, density));
  const roofTop = compact
    ? Math.max(12, Math.round(M.top * density))
    : Math.max(M.top, safe.top || 0);
  const bottom = H - (compact
    ? Math.max(12, Math.round(M.bottom * density))
    : Math.max(M.bottom, safe.bottom || 0));

  const stageEl = $("stage");
  const header = $("bt-header");
  const title = $("bt-title");
  const rule = $("bt-header-rule");
  const arena = $("bt-arena");
  const incoming = $("bt-incoming");
  const hero = $("bt-hero");
  const stamp = $("bt-rank");
  const pal = $("bt-pal");
  const glow = $("bt-glow");
  const shock = $("bt-shock");
  const sheen = $("bt-sheen");
  const flash = $("bt-flash");
  const heroEdge = $("bt-hero-edge");
  const heroLine = $("bt-hero-line");
  const heroName = $("bt-hero-name");
  const heroScore = $("bt-hero-score");
  const heroScoreBox = $("bt-hero-score-box");
  const heroTrack = $("bt-hero-track");
  const heroFill = $("bt-hero-fill");
  const logoHolder = $("bt-logo");

  const tl = gsap.timeline({ paused: true });
  const build = gsap.timeline({ paused: true });
  const characterEvents = [];

  const entries = [1, 2, 3, 4, 5]
    .map((i) => ({
      name: String(V[`row${i}Name`] || "").trim(),
      score: String(V[`row${i}Score`] == null ? "" : V[`row${i}Score`])
    }))
    .filter((entry) => entry.name);

  const slots = Math.max(1, entries.length);
  const survivors = Math.max(0, entries.length - 1);
  const newScore = String(V.newScore == null ? "" : V.newScore);
  const newStat = parseStat(newScore);
  const rankStart = Number.isFinite(Number(V.rankStart))
    ? Math.round(Number(V.rankStart))
    : 1;

  const existingStats = entries
    .map((entry) => parseStat(entry.score))
    .filter((stat) => stat && Number.isFinite(stat.value));
  const allStats = existingStats.slice();

  if (newStat && Number.isFinite(newStat.value)) allStats.push(newStat);

  const scoreMax = Math.max(
    1,
    Number(V.scoreMax) || 100,
    ...allStats.map((stat) => Math.max(0, stat.value))
  );

  function fraction(text) {
    const stat = parseStat(text);
    return stat && Number.isFinite(stat.value)
      ? clamp(stat.value / scoreMax, 0, 1)
      : 1;
  }

  function lineTop(height, lineHeight, barHeight, barBottom) {
    const reserve = barHeight + barBottom + Math.max(5, height * 0.025);
    return Math.max(0, (height - reserve - lineHeight) / 2);
  }

  function sizePair(name, score, scoreBox, namePx, scorePx, width, scoreRoom) {
    name.style.fontSize = minText + "px";
    const minimumNameWidth = Math.ceil(name.getBoundingClientRect().width);

    score.style.fontSize = minText + "px";
    const minimumScoreWidth = Math.ceil(score.getBoundingClientRect().width);

    const scoreBudget = Math.max(
      minimumScoreWidth,
      Math.min(scoreRoom, width * 0.5, width - minimumNameWidth - pad)
    );

    score.style.fontSize = Math.max(minText, scorePx) + "px";
    fit(score, Math.max(1, scoreBudget), minText);

    const finalScorePx = parseFloat(score.style.fontSize);
    const scoreWidth = Math.ceil(score.getBoundingClientRect().width) + 4;
    scoreBox.style.width = scoreWidth + "px";

    name.style.fontSize =
      Math.max(minText, Math.min(namePx, finalScorePx)) + "px";
    fit(name, Math.max(1, width - scoreWidth - pad), minText);

    return Math.ceil(name.parentElement.getBoundingClientRect().height);
  }

  function poseAt(at, state) {
    if (clawd) characterEvents.push({ at, state });
  }

  function blinkAt(at) {
    if (clawd) characterEvents.push({ at, blink: true });
  }

  function shake(line, targets, at, x, y, duration) {
    const poses = [
      { x, y, weight: 0.10 },
      { x: -x * 0.65, y: -y * 0.5, weight: 0.17 },
      { x: x * 0.32, y: y * 0.25, weight: 0.20 },
      { x: -x * 0.12, y: -y * 0.08, weight: 0.23 },
      { x: 0, y: 0, weight: 0.30 }
    ];

    let cursor = at;
    poses.forEach((pose) => {
      const length = duration * pose.weight;
      line.to(targets, {
        x: pose.x,
        y: pose.y,
        duration: length,
        ease: "power3.out"
      }, cursor);
      cursor += length;
    });
  }

  stageEl.style.background = V.ground;
  $("bt-ground").style.background = V.ground;
  $("bt-grain").style.backgroundImage = grainUrl(220, 0.4, 31);
  rule.style.background = V.rule;
  flash.style.background = V.warmHighlight;

  const cell = compact ? Math.max(18, Math.round(M.cell * density)) : M.cell;
  const clawd = V.showMascot
    ? KIT.mascot(pal, cell, { color: V.accent })
    : null;
  const palH = clawd ? clawd.height : 0;
  const palX = clawd ? rowW - clawd.width - M.palMargin : rowW;
  const hopReserve = clawd ? Math.round(M.hopReserve * density) : 0;

  const titleRoom = clawd
    ? Math.max(rowW * 0.48, palX - cell * 0.8)
    : rowW;

  title.textContent = String(V.boardTitle || "");
  title.style.fontSize = Math.max(minText, M.title * density) + "px";
  title.style.color = V.ink;
  fit(title, titleRoom, minText);

  const headerH =
    Math.ceil(title.offsetHeight) + Math.round(M.headerGap * density);
  const openingY = roofTop + headerH + Math.round(M.boardGap * density);

  // The opening has no empty mascot parking space. Its tall rows start
  // immediately below the title. The final roof is occupied by the rider.
  const roofH = clawd
    ? Math.max(
        headerH + Math.round(M.boardGap * density),
        palH + hopReserve + Math.round(M.roofPad * density)
      )
    : headerH + Math.round(M.boardGap * density);

  const boardY = roofTop + roofH;
  const boardH = Math.max(1, bottom - boardY);
  const openingOffset = openingY - boardY;
  const openingH = Math.max(
    1,
    (bottom - openingY - (slots - 1) * gap) / slots
  );

  const heroShare = slots >= 4 ? M.heroShare : slots === 3 ? 0.55 : 0.66;
  const desiredHero = Math.max(M.heroH * density, boardH * heroShare);
  const rowFloor = Math.min(
    openingH,
    Math.max(
      minText * 1.05 + (compact ? 22 : 40),
      M.rowMin * density
    )
  );
  const heroCap = survivors
    ? Math.max(boardH * 0.32, boardH - survivors * (rowFloor + gap))
    : boardH;
  const heroH = survivors ? Math.max(1, Math.min(desiredHero, heroCap)) : boardH;
  const rowH = survivors
    ? Math.max(1, (boardH - heroH - survivors * gap) / survivors)
    : openingH;
  const openingPitch = openingH + gap;
  const typeScale = clamp(Math.sqrt(heroH / M.heroH), 0.82, 1.45);

  header.style.cssText +=
    `;left:${left}px;top:${roofTop}px;` +
    `width:${titleRoom}px;height:${headerH}px`;

  arena.style.cssText +=
    `;left:${left}px;top:${boardY}px;` +
    `width:${rowW}px;height:${boardH}px`;

  $("bt-entry-window").style.height = boardH + "px";
  incoming.style.cssText += `;top:0px;height:${heroH}px`;

  hero.style.cssText +=
    `;background:${V.accent};color:${V.accentInk};` +
    `border-color:${rgba(V.accentInk, 0.48)}`;

  if (clawd) {
    pal.style.cssText +=
      `;left:${palX}px;top:${-palH}px;` +
      `width:${clawd.width}px;height:${palH}px`;
  } else {
    pal.style.display = "none";
  }

  glow.style.background =
    `radial-gradient(ellipse at 50% ${((boardY + heroH / 2) / H) * 100}%, ` +
    `${rgba(V.accent, 0.15)}, transparent 58%)`;
  flash.style.top = boardY + heroH - 4 + "px";

  const smallestRow = Math.min(openingH, rowH);
  const barH = Math.max(
    compact ? 12 : 24,
    Math.min(M.barH * density, smallestRow * 0.23)
  );
  const barBottom = Math.max(
    compact ? 4 : 8,
    Math.min(M.barBottom * density, smallestRow * 0.075)
  );
  const rowScorePx = Math.max(
    minText,
    Math.min(
      M.score * density,
      (smallestRow - barH - barBottom - 8) / 1.05
    )
  );

  const rows = entries.map((entry, i) => {
    const row = make("div", "bt-row", $("bt-rows"));
    const initialTop = openingOffset + i * openingPitch;

    row.style.cssText +=
      `;top:${initialTop}px;width:${rowW}px;height:${openingH}px;` +
      `color:${V.ink};z-index:${entries.length - i}`;

    const slab = make("div", "bt-slab", row);
    slab.style.cssText +=
      `;background:${V.rowGround};` +
      `border-color:${rgba(i === 0 ? V.ink : V.rule, i === 0 ? 0.46 : 0.9)}`;

    const well = make("div", "bt-rank-well", row);
    well.style.width = rankW + "px";

    const oldFace = make("div", "bt-rank-face", well);
    const nextFace = make("div", "bt-rank-face bt-rank-face--next", well);
    const oldRank = make("div", "bt-rank", oldFace, String(rankStart + i));
    const nextRank = make("div", "bt-rank", nextFace, String(rankStart + i + 1));

    const rankPx = Math.max(
      minText,
      Math.min(M.rankPx * density, smallestRow * 0.68, rowScorePx)
    );

    oldRank.style.cssText +=
      `;font-size:${rankPx}px;color:${i === 0 ? V.ink : V.muted}`;
    nextRank.style.cssText +=
      `;font-size:${rankPx}px;color:${V.muted}`;
    fit(oldRank, rankW - 14, minText);
    fit(nextRank, rankW - 14, minText);

    const nameX = rankW + pad;
    const line = make("div", "bt-line", row);
    line.style.cssText +=
      `;left:${nameX}px;right:${pad}px;gap:${pad}px`;

    const name = make("div", "bt-name", line, entry.name);
    const scoreBox = make("div", "bt-score-box", line);
    const score = make("div", "bt-score", scoreBox, entry.score);

    const lineH = sizePair(
      name, score, scoreBox,
      M.name * density, rowScorePx,
      rowW - nameX - pad - 4, M.scoreW * density
    );

    const initialLineTop = lineTop(openingH, lineH, barH, barBottom);
    const finalLineTop = lineTop(rowH, lineH, barH, barBottom);
    line.style.top = finalLineTop + "px";

    const wellH = Math.ceil(Math.max(
      lineH, oldRank.offsetHeight, nextRank.offsetHeight
    )) + 4;
    well.style.height = wellH + "px";
    well.style.top = finalLineTop + (lineH - wellH) / 2 + "px";

    const track = make("div", "bt-track", row);
    track.style.cssText +=
      `;left:${nameX}px;right:${pad}px;bottom:${barBottom}px;` +
      `height:${barH}px;background:${V.trackColor}`;

    const fill = make("div", "bt-fill", track);
    fill.style.cssText +=
      `;width:${fraction(entry.score) * 100}%;background:${V.barColor}`;

    const hit = make("div", "bt-hit", row);
    hit.style.borderColor = V.ink;

    gsap.set(row, {
      autoAlpha: 1, x: 0, y: compact ? 18 : 28,
      rotation: 0, scaleX: 1, scaleY: 1
    });
    gsap.set([well, line], { y: initialLineTop - finalLineTop });
    gsap.set(fill, { scaleX: 0 });
    gsap.set(hit, { opacity: 0 });
    gsap.set(score, { scaleX: 1, scaleY: 1 });
    gsap.set([oldFace, nextFace], {
      transformPerspective: 520,
      transformOrigin: "50% 50%"
    });
    gsap.set(oldFace, { autoAlpha: 1, rotationX: 0 });
    gsap.set(nextFace, { autoAlpha: 0, rotationX: -90 });

    return {
      row, well, line, oldFace, nextFace, score, fill, hit, entry,
      initialTop,
      threshold: openingOffset + i * (openingH - rowH),
      finalY: heroH + gap + i * (rowH + gap) - initialTop
    };
  });

  // The winner has three distinct areas: a stamp column, a spacious
  // logo/name header, and a dominant score below that header.
  const heroRankW = Math.round(
    Math.min(rowW * 0.31, M.heroRankW * Math.max(0.8, density))
  );
  const contentX = heroRankW + pad * 2;
  const contentW = Math.max(1, rowW - contentX - pad - 4);
  const heroBarH = Math.max(
    compact ? 16 : 26,
    Math.min(M.heroBarH * density * typeScale, heroH * 0.13)
  );
  const heroBarBottom = Math.max(
    compact ? 6 : 12,
    Math.min(M.heroBarBottom * density, heroH * 0.06)
  );
  const brandTop = Math.max(10, M.brandTop * density);
  const brandGap = Math.max(8, M.brandGap * density);
  const nameTarget = Math.max(
    minText,
    Math.min(M.heroName * density * typeScale, heroH * 0.22)
  );
  const logoSize = Math.max(
    compact ? 24 : 32,
    Math.min(M.logo * density * typeScale, nameTarget * 0.85)
  );
  const logoGap = Math.max(12, M.logoGap * density);
  const logoReserve = V.showLogo ? logoSize + logoGap : 0;
  const brandH = Math.max(nameTarget * 1.05, V.showLogo ? logoSize : 0);
  const numberTop = brandTop + brandH + brandGap;
  const numberBottom =
    heroH - heroBarH - heroBarBottom - Math.max(4, M.scoreClear * density);

  heroLine.style.cssText +=
    `;left:${contentX}px;right:${pad}px`;

  heroName.textContent = String(V.newName || "");
  heroScore.textContent = newScore;
  heroScore.style.fontSize = Math.max(
    minText,
    Math.min(
      M.heroScore * density * typeScale,
      (numberBottom - numberTop) / 1.05
    )
  ) + "px";
  fit(heroScore, contentW, minText);

  const finalScorePx = parseFloat(heroScore.style.fontSize);
  heroName.style.fontSize = Math.max(
    minText,
    Math.min(nameTarget, finalScorePx)
  ) + "px";
  heroName.style.left = logoReserve + "px";
  heroName.style.top = brandTop + "px";
  fit(heroName, Math.max(1, contentW - logoReserve), minText);

  const actualBrandH = Math.max(
    heroName.offsetHeight,
    V.showLogo ? logoSize : 0
  );
  const actualNumberTop = brandTop + actualBrandH + brandGap;
  const scoreY = actualNumberTop +
    Math.max(0, (numberBottom - actualNumberTop - heroScore.offsetHeight) / 2);
  heroScoreBox.style.top = scoreY + "px";

  if (V.showLogo) {
    KIT.logo(logoHolder, logoSize, V.accentInk);
    logoHolder.style.cssText +=
      `;left:${contentX}px;` +
      `top:${brandTop + (actualBrandH - logoSize) / 2}px;` +
      `width:${logoSize}px;height:${logoSize}px`;
    heroName.style.top =
      brandTop + (actualBrandH - heroName.offsetHeight) / 2 + "px";
  } else {
    logoHolder.style.display = "none";
  }

  const stampPeak = 1.38;
  $("bt-rank-well").style.cssText +=
    `;left:${pad}px;width:${heroRankW}px;height:${heroH - M.edge}px`;
  stamp.textContent = String(V.rankWord || "");
  stamp.style.fontSize = Math.max(
    minText,
    Math.min(
      M.stamp * density * typeScale,
      finalScorePx * 0.94,
      (heroH - M.edge) * 0.64
    )
  ) + "px";
  fit(stamp, Math.max(1, heroRankW / stampPeak - 12), minText);

  const heroTrackW = Math.max(1, rowW - contentX - pad);
  const finalFraction = fraction(newScore);
  const heroFillW = heroTrackW * finalFraction;
  const sheenW = Math.max(12, Math.min(30, heroFillW * 0.035));

  heroTrack.style.cssText +=
    `;left:${contentX}px;right:${pad}px;` +
    `bottom:${heroBarBottom}px;height:${heroBarH}px;` +
    `background:${rgba(V.accentInk, 0.23)}`;
  heroFill.style.cssText +=
    `;width:${finalFraction * 100}%;background:${V.accentInk}`;
  sheen.style.cssText +=
    `;width:${sheenW}px;background:${V.warmHighlight};` +
    `clip-path:polygon(38% 0%,100% 0%,62% 100%,0% 100%)`;
  heroEdge.style.cssText +=
    `;height:${M.edge}px;background:${V.accentInk}`;
  shock.style.borderColor = V.warmHighlight;

  const numericWinner = newStat && Number.isFinite(newStat.value);
  const leaderValue = Math.max(0, ...existingStats.map((stat) => stat.value));
  const countStart = numericWinner
    ? Math.min(Math.max(0, newStat.value), leaderValue)
    : 0;

  function winnerText(progress) {
    if (!numericWinner || progress >= 1) return newScore;
    return formatStat(
      newStat,
      countStart + (newStat.value - countStart) * progress
    );
  }

  function winnerFill(progress) {
    if (!numericWinner || newStat.value <= 0) return 1;
    return clamp(
      (countStart + (newStat.value - countStart) * progress) / newStat.value,
      0, 1
    );
  }

  gsap.set(incoming, {
    autoAlpha: 0, x: 0, rotation: 0, scaleX: 1, scaleY: 1
  });
  gsap.set([heroLine, logoHolder, pal], { autoAlpha: 0 });
  gsap.set(pal, {
    x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1
  });
  gsap.set(stamp, {
    autoAlpha: 0, x: 0, y: 0,
    rotation: 0, scaleX: 1, scaleY: 1
  });
  gsap.set(heroScore, {
    textContent: winnerText(0), scaleX: 1, scaleY: 1
  });
  gsap.set(heroFill, { scaleX: winnerFill(0) });
  gsap.set(sheen, { autoAlpha: 0, x: -sheenW });
  gsap.set([glow, shock, flash], { opacity: 0 });
  gsap.set(rule, { scaleX: 0.7 });

  build.fromTo(header, { y: 18 }, {
    y: 0, duration: 0.18, ease: "power4.out",
    immediateRender: false
  }, 0);

  rows.forEach((r, i) => {
    const at = i * 0.055;
    const end = at + 0.20;
    build.to(r.row, {
      y: 0, duration: 0.20, ease: "power4.out"
    }, at);
    build.to(r.fill, {
      scaleX: 1, duration: 0.20, ease: "power3.out"
    }, at);
    build.fromTo(r.hit, { opacity: 0.65 }, {
      opacity: 0, duration: 0.13, ease: "power3.out",
      immediateRender: false
    }, end);
    build.to(r.score, {
      scaleX: 1.055, scaleY: 1.055,
      duration: 0.035, ease: "power4.out"
    }, end);
    build.to(r.score, {
      scaleX: 1, scaleY: 1,
      duration: 0.10, ease: "power3.out"
    }, end + 0.035);
  });

  // Reserve actual output frames for the fall, each rank flip and the
  // final approach. Compressing keyAt must not turn these into a swap.
  const chainStep = Math.max(0.085, frames(2.25));
  const flipLife = Math.max(0.18, frames(4.5));
  const ejectLife = Math.max(0.23, frames(5));
  const finalPush = Math.max(0.32, frames(10));
  const recovery = Math.max(0.30, frames(8));
  const seatLead = Math.max(0.20, frames(4));
  const chainSpan = Math.max(0, rows.length - 1) * chainStep;
  const plowLife = chainSpan + finalPush;

  const seatAt = D - seatLead;
  const impactAt = seatAt - recovery;
  const firstContact = impactAt - plowLife;
  const firstLead = openingOffset;
  const lastLead = rows.length
    ? rows[rows.length - 1].threshold
    : firstLead;
  const endLead = heroH + gap;
  const contactY = firstLead - heroH - gap;
  const dropMargin = Math.max(32, cell * 1.5);
  const fallStart = -boardY - heroH - dropMargin;
  const flightDistance = Math.max(1, contactY - fallStart);
  const visiblePart = Math.max(
    0.1,
    1 - Math.cbrt(clamp(dropMargin / flightDistance, 0, 0.999))
  );
  const flightLife = Math.max(0.66, frames(8) / visiblePart);
  const fallAt = firstContact - flightLife;
  const rattleAt = Math.max(0.56, fallAt - 0.22);
  const driftAt = Math.min(0.65, Math.max(0.46, rattleAt - 0.12));

  build.to(rule, {
    scaleX: 1,
    duration: Math.max(0.06, rattleAt - driftAt),
    ease: "power2.in"
  }, driftAt);
  build.to(arena, {
    y: -M.tension * density,
    duration: Math.max(0.06, rattleAt - driftAt),
    ease: "power2.in"
  }, driftAt);
  build.to(arena, {
    y: 0, duration: 0.10, ease: "power4.out"
  }, rattleAt);

  rows.forEach((r, i) => {
    const at = rattleAt + i * 0.012;
    build.to(r.row, {
      x: -M.hitX * 0.45,
      duration: 0.025, ease: "power3.in"
    }, at);
    build.to(r.row, {
      x: M.hitX * 0.35,
      duration: 0.035, ease: "power3.out"
    }, at + 0.025);
    build.to(r.row, {
      x: 0, duration: 0.055, ease: "power3.out"
    }, at + 0.060);
  });

  // The rider is a child of the slab. There is no independent entrance,
  // stationary preview, launch from the board or custom limb drawing.
  gsap.set(incoming, { y: fallStart });
  build.set(incoming, { autoAlpha: 1 }, fallAt);
  build.set(heroLine, { autoAlpha: 1 }, fallAt);
  if (V.showLogo) build.set(logoHolder, { autoAlpha: 1 }, fallAt);
  if (clawd) build.set(pal, { autoAlpha: 1 }, fallAt);
  build.set(header, { autoAlpha: 0 }, fallAt);

  build.to(incoming, {
    y: contactY,
    duration: flightLife,
    ease: "power2.in"
  }, fallAt);

  poseAt(fallAt * timeScale, {
    arms: "up", eyes: "closed", legs: "right"
  });
  poseAt(firstContact * timeScale, {
    arms: "up", eyes: "left", legs: "left"
  });
  poseAt((firstContact + chainSpan) * timeScale, {
    arms: "up", eyes: "closed", legs: "right"
  });
  poseAt((firstContact + chainSpan + finalPush * 0.46) * timeScale, {
    arms: "up", eyes: "open", legs: "stand"
  });

  // One shared leading edge keeps the slab and the struck stack in
  // physical contact. Unstruck rows remain in their opening positions.
  // These modifiers also run during motion-blur sampling.
  function leadAt(progress) {
    const elapsed = clamp(progress, 0, 1) * plowLife;

    if (chainSpan > 0 && elapsed < chainSpan) {
      const phase = Math.min(
        rows.length - 2,
        Math.floor(elapsed / chainStep)
      );
      const u = clamp((elapsed - phase * chainStep) / chainStep, 0, 1);
      const eased = 1 - Math.pow(1 - u, 2);
      const a = rows[phase].threshold;
      const b = rows[phase + 1].threshold;
      return a + (b - a) * eased;
    }

    const u = clamp((elapsed - chainSpan) / finalPush, 0, 1);

    // Drive most of the stack down sharply, then accelerate the final
    // short distance into impact. This gives the upright rider time
    // to become visible before the landing.
    const eased = u < 0.4
      ? 0.78 * (1 - Math.pow(1 - u / 0.4, 3))
      : 0.78 + 0.22 * Math.pow((u - 0.4) / 0.6, 3);

    return lastLead + (endLead - lastLead) * eased;
  }

  build.fromTo(incoming, { y: 0 }, {
    y: 1000,
    duration: plowLife,
    ease: "none",
    immediateRender: false,
    modifiers: {
      y(value) {
        const lead = leadAt(parseFloat(value) / 1000);
        return (lead - heroH - gap) + "px";
      }
    }
  }, firstContact);

  rows.slice(0, survivors).forEach((r) => {
    build.fromTo(r.row, { y: 0 }, {
      y: 1000,
      duration: plowLife,
      ease: "none",
      immediateRender: false,
      modifiers: {
        y(value) {
          const lead = leadAt(parseFloat(value) / 1000);
          return Math.max(0, lead - r.threshold) + "px";
        }
      }
    }, firstContact);
  });

  rows.forEach((r, i) => {
    const at = firstContact + i * chainStep;
    const last = i === rows.length - 1;
    const flipOut = flipLife * 0.42;
    const hitLife = Math.max(chainStep, flipLife * 0.8);
    const progress = (i + 1) / (rows.length + 1);

    build.to(r.row, {
      x: (i % 2 ? -1 : 1) * M.hitX,
      duration: chainStep * 0.28,
      ease: "power4.out"
    }, at);
    build.to(r.row, {
      x: 0,
      duration: chainStep * 0.72,
      ease: "power3.out"
    }, at + chainStep * 0.28);

    build.fromTo(r.hit, { opacity: 1 }, {
      opacity: 0, duration: hitLife, ease: "power3.out",
      immediateRender: false
    }, at);
    build.set(r.fill, { backgroundColor: V.ink }, at);
    build.to(r.fill, {
      backgroundColor: V.barColor,
      duration: hitLife, ease: "power3.out"
    }, at);

    // Whole faces flip around a single baseline. They never coexist.
    build.to(r.oldFace, {
      rotationX: 90,
      duration: flipOut,
      ease: "power2.in"
    }, at);
    build.set(r.oldFace, { autoAlpha: 0 }, at + flipOut);
    build.set(r.nextFace, {
      autoAlpha: 1, rotationX: -90
    }, at + flipOut);
    build.to(r.nextFace, {
      rotationX: 0,
      duration: flipLife - flipOut,
      ease: "power3.out"
    }, at + flipOut);

    build.to(r.score, {
      scaleX: 1.07, scaleY: 1.07,
      duration: chainStep * 0.28, ease: "power4.out"
    }, at);
    build.to(r.score, {
      scaleX: 1, scaleY: 1,
      duration: chainStep * 0.72, ease: "power3.out"
    }, at + chainStep * 0.28);

    // The challenger ticks on the exact frame of each collision.
    build.set(heroScore, { textContent: winnerText(progress) }, at);
    build.to(heroScore, {
      scaleX: 1.065, scaleY: 1.065,
      duration: chainStep * 0.28, ease: "power4.out"
    }, at);
    build.to(heroScore, {
      scaleX: 1, scaleY: 1,
      duration: chainStep * 0.72, ease: "power3.out"
    }, at + chainStep * 0.28);
    build.to(heroFill, {
      scaleX: winnerFill(progress),
      duration: chainStep * 0.65,
      ease: "power3.out"
    }, at);

    if (last) {
      const exitY =
        H - boardY - r.initialTop + openingH + rowW * 0.45 + 64;

      build.set(r.row, {
        transformOrigin: "28% 50%",
        zIndex: entries.length + 2
      }, at);
      build.to(r.row, {
        y: exitY,
        rotation: 72,
        duration: ejectLife,
        ease: "power2.in"
      }, at);
      build.to(r.row, {
        x: compact ? 150 : 210,
        duration: ejectLife,
        ease: "power2.in"
      }, at + chainStep);
      build.set(r.row, { autoAlpha: 0 }, at + ejectLife);
      return;
    }

    const compressLife = chainStep * 0.85;
    build.to(r.row, {
      height: rowH,
      duration: compressLife,
      ease: "power4.out"
    }, at);
    build.to([r.well, r.line], {
      y: 0,
      duration: compressLife,
      ease: "power4.out"
    }, at);
  });

  // Main impact precedes the key. The slab flattens, rebounds once
  // and seats completely before the rank gets its separate stamp.
  const crush = Math.max(0.055, frames(1.5));
  const rebound = (recovery - crush) * 0.43;
  const returnLife = (recovery - crush) * 0.37;
  const settleLife = recovery - crush - rebound - returnLife;

  build.set(incoming, { y: 0 }, impactAt);
  build.set(header, { autoAlpha: 1 }, impactAt);
  build.to(incoming, {
    scaleX: 1.035, scaleY: 0.92,
    duration: crush, ease: "power4.out"
  }, impactAt);
  build.to(incoming, {
    y: -M.recoil * density,
    scaleX: 0.992, scaleY: 1.025,
    duration: rebound, ease: "power3.out"
  }, impactAt + crush);
  build.to(incoming, {
    y: 0, scaleX: 1.009, scaleY: 0.99,
    duration: returnLife, ease: "power3.in"
  }, impactAt + crush + rebound);
  build.to(incoming, {
    y: 0, scaleX: 1, scaleY: 1,
    duration: settleLife, ease: "power4.out"
  }, impactAt + crush + rebound + returnLife);

  build.fromTo(shock, { opacity: 1 }, {
    opacity: 0, duration: Math.min(0.16, recovery),
    ease: "power4.out", immediateRender: false
  }, impactAt);
  build.fromTo(flash, { opacity: 1, scaleX: 1 }, {
    opacity: 0, duration: Math.min(0.10, recovery),
    ease: "power4.out", immediateRender: false
  }, impactAt);
  build.to(glow, {
    opacity: 0.32, duration: 0.12, ease: "power3.out"
  }, impactAt);

  shake(
    build, [header, arena], impactAt,
    M.hitX * 1.8, compact ? 10 : 15,
    Math.min(recovery, Math.max(0.20, frames(5)))
  );

  if (clawd) {
    poseAt(impactAt * timeScale, {
      arms: "down", eyes: "closed", legs: "stand"
    });
    build.to(pal, {
      scaleX: 1.12, scaleY: 0.84,
      duration: crush, ease: "power4.out"
    }, impactAt);
    poseAt((impactAt + crush) * timeScale, {
      arms: "up", eyes: "open", legs: "stand"
    });
    build.to(pal, {
      scaleX: 0.99, scaleY: 1.035,
      duration: rebound, ease: "power3.out"
    }, impactAt + crush);
    build.to(pal, {
      scaleX: 1, scaleY: 1,
      duration: returnLife + settleLife,
      ease: "power3.out"
    }, impactAt + crush + rebound);
    build.set(pal, {
      x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1
    }, seatAt);
    poseAt(seatAt * timeScale, {
      arms: "up", eyes: "left", legs: "stand"
    });
  }

  build.set(incoming, {
    y: 0, rotation: 0, scaleX: 1, scaleY: 1
  }, seatAt);
  build.set(heroScore, {
    textContent: newScore, scaleX: 1, scaleY: 1
  }, seatAt);
  build.set(heroFill, { scaleX: 1 }, seatAt);
  build.set(heroEdge, { backgroundColor: V.warmHighlight }, seatAt);
  build.to(heroEdge, {
    backgroundColor: V.accentInk,
    duration: Math.min(0.12, seatLead),
    ease: "power4.out"
  }, seatAt);

  rows.slice(0, survivors).forEach((r) => {
    build.set(r.row, {
      y: r.finalY, x: 0, height: rowH, rotation: 0
    }, impactAt);
    build.set([r.well, r.line], { y: 0 }, impactAt);
  });

  const rnd = seeded(83);
  const sparkCount = compact ? 14 : 20;
  const sparkLife = Math.min(recovery, Math.max(0.24, frames(6)));

  for (let i = 0; i < sparkCount; i++) {
    const p = make("div", "bt-spark", $("bt-sparks"));
    const side = i % 2 ? 1 : -1;
    const size = M.spark * (rnd() > 0.86 ? 2 : 1);
    const startX = side < 0
      ? Math.max(2, left - size - 3)
      : Math.min(W - size - 2, left + rowW + 3);
    const startY = boardY + heroH - size;
    const endX = side < 0
      ? clamp(startX - 10 - rnd() * 30, 2, Math.max(2, left - size - 2))
      : clamp(
          startX + 10 + rnd() * 30,
          Math.min(W - size - 2, left + rowW + 2),
          W - size - 2
        );
    const lift = 42 + rnd() * (compact ? 74 : 112);
    const up = sparkLife * 0.36;

    p.style.cssText +=
      `;width:${size}px;height:${size}px;` +
      `background:${i % 4 ? V.accent : V.warmHighlight}`;
    gsap.set(p, { x: startX, y: startY, autoAlpha: 0 });

    build.set(p, { autoAlpha: 1 }, impactAt);
    build.to(p, {
      x: endX,
      rotation: side * (90 + rnd() * 120),
      duration: sparkLife,
      ease: "power3.out"
    }, impactAt);
    build.to(p, {
      y: startY - lift,
      duration: up,
      ease: "power3.out"
    }, impactAt);
    build.to(p, {
      y: startY + lift * 1.6,
      duration: sparkLife - up,
      ease: "power3.in"
    }, impactAt + up);
    build.set(p, { autoAlpha: 0 }, impactAt + sparkLife);
  }

  build.set(rule, { scaleX: 1 }, D);
  build.timeScale(1 / timeScale);
  build.paused(false);
  tl.add(build, 0);

  const key = T.key;
  const hold = Math.max(0, T.hold);

  // At the key the score and seated board are already exact.
  // The rank arrives alone, at its oversized stamp pose.
  tl.set(incoming, {
    autoAlpha: 1, x: 0, y: 0,
    rotation: 0, scaleX: 1, scaleY: 1
  }, key);
  tl.set(heroLine, { autoAlpha: 1 }, key);
  if (V.showLogo) tl.set(logoHolder, { autoAlpha: 1 }, key);
  tl.set(heroScore, {
    textContent: newScore, scaleX: 1, scaleY: 1
  }, key);
  tl.set(heroFill, { scaleX: 1 }, key);
  tl.set(stamp, {
    autoAlpha: 1, x: 0, y: 0, rotation: 0,
    scaleX: stampPeak, scaleY: stampPeak
  }, key);
  tl.set(header, { autoAlpha: 1, x: 0, y: 0 }, key);
  tl.set(arena, { x: 0, y: 0 }, key);
  tl.set(shock, { opacity: 0.85 }, key);

  rows.forEach((r, i) => {
    if (i === rows.length - 1) {
      tl.set(r.row, { autoAlpha: 0 }, key);
      return;
    }

    tl.set(r.row, {
      autoAlpha: 1, x: 0, y: r.finalY, height: rowH,
      rotation: 0, scaleX: 1, scaleY: 1
    }, key);
    tl.set([r.well, r.line], { y: 0 }, key);
    tl.set(r.oldFace, { autoAlpha: 0, rotationX: 90 }, key);
    tl.set(r.nextFace, { autoAlpha: 1, rotationX: 0 }, key);
    tl.set(r.fill, { scaleX: 1, backgroundColor: V.barColor }, key);
    tl.set(r.hit, { opacity: 0 }, key);
    tl.set(r.score, {
      textContent: r.entry.score, scaleX: 1, scaleY: 1
    }, key);
  });

  if (clawd) {
    tl.set(pal, {
      autoAlpha: 1, x: 0, y: 0,
      rotation: 0, scaleX: 1, scaleY: 1
    }, key);
    poseAt(key, { arms: "up", eyes: "left", legs: "stand" });
  }

  if (hold > 0) {
    const peakHold = Math.min(2 / fps, hold * 0.22);
    const stampSettle = Math.min(0.12, Math.max(0.001, hold - peakHold));

    tl.to(stamp, {
      scaleX: 1, scaleY: 1,
      duration: stampSettle,
      ease: "power4.out"
    }, key + peakHold);
    tl.to(shock, {
      opacity: 0.12,
      duration: Math.min(0.16, hold),
      ease: "power4.out"
    }, key);

    shake(
      tl, [header, arena], key,
      M.hitX * 0.45, compact ? 3 : 4,
      Math.min(0.12, hold)
    );

    if (clawd) {
      const hop = Math.min(M.hop * density, hopReserve);

      // Upright victory hops. The landing is a small knee bend,
      // never the wide, flattened silhouette of the impact.
      for (let offset = 0.16; offset + 0.38 <= hold; offset += 0.64) {
        const at = key + offset;
        poseAt(at, { arms: "up", eyes: "left", legs: "stand" });
        tl.to(pal, {
          scaleX: 1.035, scaleY: 0.96,
          duration: 0.045, ease: "power3.in"
        }, at);
        poseAt(at + 0.045, { arms: "up", legs: "right" });
        tl.to(pal, {
          y: -hop, scaleX: 1, scaleY: 1.015,
          duration: 0.14, ease: "power3.out"
        }, at + 0.045);
        tl.to(pal, {
          y: 0, scaleX: 1.035, scaleY: 0.96,
          duration: 0.14, ease: "power3.in"
        }, at + 0.185);
        tl.to(pal, {
          y: 0, scaleX: 1, scaleY: 1,
          duration: 0.055, ease: "power3.out"
        }, at + 0.325);
        poseAt(at + 0.325, { arms: "up", legs: "stand" });
      }

      [0.64, 1.25].forEach((offset) => {
        if (offset + 0.18 >= hold) return;
        blinkAt(key + offset);
        poseAt(key + offset + 0.16, {
          arms: "up", eyes: "left", legs: "stand"
        });
      });
    }

    if (heroFillW > 0) {
      const sweepDelay = Math.min(0.12, hold * 0.12);
      tl.set(sheen, { autoAlpha: 1, x: -sheenW }, key + sweepDelay);
      tl.to(sheen, {
        x: heroFillW,
        duration: Math.max(0.001, hold - sweepDelay),
        ease: "sine.inOut"
      }, key + sweepDelay);
    }
  }

  // Kit poses live only on the root timeline, in real seconds.
  characterEvents
    .sort((a, b) => a.at - b.at)
    .forEach((event) => {
      if (event.blink) clawd.blink(tl, event.at);
      else clawd.pose(tl, event.at, event.state);
    });

  const open = "polygon(0% 0%,100% 0%,100% 100%,0% 100%)";
  const shut = V.overlayPosition === "bottom"
    ? "polygon(0% 100%,100% 100%,100% 100%,0% 100%)"
    : "polygon(0% 0%,100% 0%,100% 0%,0% 0%)";

  if (variant === "overlay") {
    tl.fromTo(stageEl, { clipPath: shut }, {
      clipPath: open,
      duration: 0.18,
      ease: "power4.out",
      immediateRender: false
    }, 0);
  }

  if (T.exit > 0) {
    const exitAt = key + hold;
    const exitLife = Math.max(0, T.exit - 1 / fps);
    tl.to(stageEl, {
      clipPath: shut,
      duration: exitLife,
      ease: "power3.in"
    }, exitAt);
    tl.set(stageEl, { clipPath: shut }, exitAt + exitLife);
  }

  window.__timelines["block"] = tl;
});