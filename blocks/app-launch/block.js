CA.ready(() => {
  const {
    vars: V, stage: S, safe, time: T, variant,
    make, fit, rgba, parseStat, formatStat,
  } = CA;

  const $ = (id) => document.getElementById(id);
  const stageEl = $("stage");
  const W = S.w;
  const H = S.h;
  const full = variant === "full";
  const overlay = variant === "overlay";
  const D = T.design;
  const minText = full ? 40 : 32;
  const clamp = (value, lo, hi) => Math.min(hi, Math.max(lo, value));
  const number = (value, fallback) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  };
  const hide = (el) => {
    el.style.display = "none";
    el.style.visibility = "hidden";
  };
  const lastWords = (text) =>
    String(text).trim().replace(/\s+(\S+)$/, "\u00a0$1");

  Object.entries({
    "--al-brand": V.brandColor,
    "--al-tint": V.brandTint,
    "--al-ink": V.ink,
    "--al-muted": V.muted,
    "--al-surface": V.surface,
    "--al-line": V.lineColor,
    "--al-metal": V.metalColor,
    "--al-metal-dark": V.metalDark,
    "--al-shadow-soft": rgba(V.ink, 0.12),
    "--al-shadow-near": rgba(V.ink, 0.08),
  }).forEach(([key, value]) => stageEl.style.setProperty(key, value));

  $("al-backdrop").style.background =
    `radial-gradient(ellipse at 48% 34%, ${V.backdropGlow} 0%, ` +
    `${rgba(V.backdropGlow, 0)} 66%), ` +
    `linear-gradient(180deg, ${V.backdropTop}, ${V.backdropBottom})`;
  $("al-floor").style.background =
    `linear-gradient(180deg, ${rgba(V.floorColor, 0)}, ${V.floorColor})`;
  $("al-grain").style.backgroundImage = CA.grainUrl(220, 0.6, 17);
  $("al-grain").style.opacity = V.grainOpacity;

  const topSafe = full
    ? Math.max(230, number(safe.top, 230))
    : clamp(number(safe.top, 24), 16, 28);
  const bottomSafe = full
    ? Math.max(300, number(safe.bottom, 300))
    : clamp(number(safe.bottom, 24), 16, 28);
  const availableH = H - topSafe - bottomSafe;
  const edge = full
    ? Math.max(40, number(safe.side, 40) - 28)
    : 24;
  const gap = 24;
  const widePayoff = full || availableH >= 760;

  const L = full ? {
    phoneW: Math.min(892, W - 160),
    phoneH: Math.min(1320, availableH - 64),
    phoneX: 0,
    phoneY: topSafe + 16,
    radius: 68,
    inset: 14,
    small: 44,
    app: 60,
    appLeft: 78,
    appH: 74,
    avatar: 76,
    balance: 146,
    bodyLeft: 34,
    cameraW: 112,
    cameraH: 28,
    appY: 68,
    greetingY: 148,
    labelY: 208,
    balanceY: 260,
    deltaY: 432,
    deltaH: 56,
    chartY: 514,
    chartH: 272,
    axisY: 802,
    recentY: 872,
    rowY: 934,
    rowH: 112,
    rowText: 74,
    rowDetailY: 56,
    rowIcon: 52,
    showGreeting: true,
    showLabel: true,
    showApp: true,
  } : {
    phoneW: Math.round(
      Math.min(660, (W - edge * 2 - gap) * (widePayoff ? 0.65 : 0.58)),
    ),
    phoneH: availableH,
    phoneX: edge,
    phoneY: topSafe,
    radius: overlay ? 50 : 48,
    inset: 14,
    small: 36,
    app: 46,
    appLeft: 70,
    appH: 56,
    avatar: 68,
    balance: 100,
    bodyLeft: 24,
    cameraW: 90,
    cameraH: 24,
    appY: 56,
    greetingY: 124,
    labelY: 174,
    balanceY: 228,
    deltaY: 350,
    deltaH: 46,
    chartY: 416,
    chartH: 228,
    axisY: 660,
    recentY: 724,
    rowY: 778,
    rowH: 94,
    rowText: 66,
    rowDetailY: 48,
    rowIcon: 46,
    showGreeting: widePayoff,
    showLabel: true,
    showApp: true,
  };

  if (full) L.phoneX = (W - L.phoneW) / 2;

  const screenW = L.phoneW - L.inset * 2;
  const screenH = L.phoneH - L.inset * 2;

  if (!full && !widePayoff) {
    Object.assign(L, {
      appY: 52,
      labelY: 116,
      balanceY: 166,
      balance: 96,
      deltaY: 280,
      deltaH: 44,
      chartY: 346,
      showGreeting: false,
    });
    L.chartH = Math.min(190, Math.max(0, screenH - L.chartY - 68));
    L.axisY = L.chartY + L.chartH + 16;
  }

  if (!full && screenH < 480) {
    Object.assign(L, {
      appY: 44,
      labelY: 104,
      balanceY: 152,
      balance: 84,
      deltaY: 254,
      chartY: 326,
      showGreeting: false,
    });
    L.chartH = Math.min(150, Math.max(0, screenH - L.chartY - 68));
    L.axisY = L.chartY + L.chartH + 16;
  }

  if (!full && screenH < 310) {
    Object.assign(L, {
      appY: 40,
      labelY: 100,
      balanceY: 146,
      balance: 76,
      deltaY: 240,
      chartH: 0,
      showGreeting: false,
    });
  }

  if (!full && screenH < 250) {
    Object.assign(L, {
      balanceY: 110,
      balance: 72,
      showLabel: false,
    });
  }

  if (!full && screenH < 190) {
    Object.assign(L, {
      balanceY: 56,
      balance: Math.max(
        minText,
        Math.min(64, Math.floor((screenH - 68) / 1.06)),
      ),
      showApp: false,
      showLabel: false,
    });
  }

  L.chartW = screenW - L.bodyLeft * 2;
  L.navY = screenH - 98;
  L.showApp = L.showApp && L.appY + L.appH <= screenH - 12;
  L.showGreeting = L.showGreeting &&
    L.greetingY + L.small * 1.18 <= screenH - 12;
  L.showLabel = L.showLabel &&
    L.labelY + L.small * 1.18 <= screenH - 12;
  L.showDelta = L.deltaY + L.deltaH <= screenH - 16;
  L.showChart = L.chartH >= 104 &&
    L.chartY + L.chartH <= screenH - 16;
  L.showAxis = L.showChart &&
    L.axisY + L.small * 1.18 <= screenH - 12;
  L.showActivity = (full || widePayoff) &&
    L.rowY + L.rowH <= screenH - 12;
  L.showNav = full &&
    L.navY >= L.rowY + L.rowH + 32;

  Object.entries({
    "--al-phone-radius": L.radius,
    "--al-screen-inset": L.inset,
    "--al-camera-w": L.cameraW,
    "--al-camera-h": L.cameraH,
    "--al-small": L.small,
    "--al-app-px": L.app,
    "--al-app-left": L.appLeft,
    "--al-app-h": L.appH,
    "--al-avatar-size": L.avatar,
    "--al-balance-px": L.balance,
    "--al-body-left": L.bodyLeft,
    "--al-delta-h": L.deltaH,
    "--al-chart-w": L.chartW,
    "--al-label-h": Math.ceil(L.small * 1.18),
    "--al-row-h": L.rowH,
    "--al-row-text": L.rowText,
    "--al-row-detail-y": L.rowDetailY,
    "--al-row-icon": L.rowIcon,
  }).forEach(([key, value]) => {
    stageEl.style.setProperty(key, value + "px");
  });

  Object.assign($("al-phone-float").style, {
    left: L.phoneX + "px",
    top: L.phoneY + "px",
    width: L.phoneW + "px",
    height: L.phoneH + "px",
  });
  $("al-phone-pose").setAttribute(
    "aria-label", V.appName + " — " + V.appType,
  );

  for (let i = 8; i >= 1; i--) {
    const layer = make("div", "al-metal-layer", $("al-metal-stack"));
    layer.style.transform = `translateZ(${-i * 2}px)`;
    layer.style.background = i % 3 === 0 ? V.metalDark : V.metalColor;
  }

  [
    ["al-clock", V.clockLabel],
    ["al-app-name", V.appName],
    ["al-avatar", V.avatarLabel],
    ["al-greeting", V.greeting],
    ["al-balance-label", V.balanceLabel],
    ["al-balance", V.mainNumber],
    ["al-delta-text", V.deltaLabel],
    ["al-chart-mon", V.chartLabelMonday],
    ["al-chart-wed", V.chartLabelWednesday],
    ["al-chart-sun", V.chartLabelSunday],
    ["al-recent-title", V.recentLabel],
    ["al-view-all", V.viewAllLabel],
    ["al-card1-title", V.card1Title],
    ["al-card1-value", V.card1Value],
    ["al-card1-caption", V.card1Caption],
    ["al-card2-title", V.card2Title],
    ["al-card2-value", V.card2Value],
    ["al-card2-change", V.card2Change],
    ["al-card3-title", V.card3PendingTitle],
    ["al-card3-value", V.card3Value],
    ["al-card3-caption", V.card3PendingCaption],
  ].forEach(([id, text]) => { $(id).textContent = text; });

  [
    ["al-app-head", L.appY],
    ["al-greeting", L.greetingY],
    ["al-balance-label", L.labelY],
    ["al-balance", L.balanceY],
    ["al-delta", L.deltaY],
    ["al-chart", L.chartY],
    ["al-chart-labels", L.axisY],
    ["al-recent", L.recentY],
    ["al-activities", L.rowY],
    ["al-nav", L.navY],
  ].forEach(([id, y]) => { $(id).style.top = y + "px"; });

  $("al-chart").style.height = L.chartH + "px";

  hide($("al-status"));
  hide($("al-home-indicator"));
  if (!L.showApp) hide($("al-app-head"));
  if (!L.showGreeting) hide($("al-greeting"));
  if (!L.showLabel) hide($("al-balance-label"));
  if (!L.showDelta) hide($("al-delta"));
  if (!L.showChart) hide($("al-chart"));
  if (!L.showAxis) hide($("al-chart-labels"));
  if (!L.showActivity) {
    hide($("al-recent"));
    hide($("al-activities"));
  }
  if (!L.showNav) hide($("al-nav"));

  function fitLine(el, width, minimum = minText) {
    el.style.display = "inline-block";
    el.style.whiteSpace = "nowrap";
    el.style.width = "auto";
    fit(el, Math.max(1, width), minimum);
  }

  function fitStrings(el, texts, width, minimum = minText) {
    const original = el.textContent;
    const startPx = parseFloat(getComputedStyle(el).fontSize);
    let chosenPx = startPx;
    texts.forEach((text) => {
      el.style.fontSize = startPx + "px";
      el.textContent = text;
      fitLine(el, width, minimum);
      chosenPx = Math.min(
        chosenPx,
        parseFloat(getComputedStyle(el).fontSize),
      );
    });
    el.style.fontSize = chosenPx + "px";
    el.textContent = original;
  }

  fitLine(
    $("al-app-name"),
    screenW - L.appLeft - L.avatar - 56,
  );
  fitLine($("al-greeting"), screenW - L.bodyLeft * 2);
  fitLine($("al-balance-label"), screenW - L.bodyLeft * 2);
  fitLine($("al-delta-text"), L.chartW - 64);
  fitLine($("al-view-all"), L.chartW * 0.35);
  fitLine(
    $("al-recent-title"),
    L.chartW - $("al-view-all").offsetWidth - 20,
  );

  fitLine($("al-avatar"), L.avatar - 12);
  Object.assign($("al-avatar").style, {
    display: "flex",
    width: L.avatar + "px",
    height: L.avatar + "px",
  });

  [
    $("al-chart-mon"),
    $("al-chart-wed"),
    $("al-chart-sun"),
  ].forEach((el) => fitLine(el, L.chartW * 0.29));

  const iconSvg = (path) =>
    `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" ` +
    `stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" ` +
    `aria-hidden="true">${path}</svg>`;

  const row = make("div", "al-activity", $("al-activities"));
  const rowContent = make("div", "al-activity-content", row);
  const rowIcon = make("span", "al-activity-icon", rowContent);
  rowIcon.innerHTML = iconSvg('<path d="M8 23L24 7M10 7h14v14"/>');
  const rowTitle = make(
    "span", "al-activity-title", rowContent, V.row1Title,
  );
  const rowDetail = make("div", "al-activity-detail", rowContent);
  const rowDate = make("span", "al-activity-date", rowDetail, V.row1Date);
  const rowAmount = make(
    "span",
    "al-activity-amount" +
      (String(V.row1Amount).startsWith("+") ? " positive" : ""),
    rowDetail,
    V.row1Amount,
  );
  const rowRoom = screenW - 48 - L.rowText;
  fitLine(rowTitle, rowRoom - 8);
  fitLine(rowDate, rowRoom * 0.36);
  fitLine(rowAmount, rowRoom - rowDate.offsetWidth - 22);

  const navItems = [V.navHome, V.navActivity, V.navGoals].map((text, i) => {
    const item = make(
      "div", "al-nav-item" + (i === 0 ? " active" : ""), $("al-nav"),
    );
    const label = make("span", "al-nav-label", item, text);
    fitLine(label, (screenW - 80) / 3);
    return item;
  });
  $("al-nav-pill").style.width =
    Math.max(0, navItems[0].offsetWidth) + "px";

  const balanceStat = parseStat(V.mainNumber);
  const incomingStat = parseStat(V.row1Amount);
  const validBalance = balanceStat && Number.isFinite(balanceStat.value);
  const validIncoming = incomingStat && Number.isFinite(incomingStat.value);
  const openingBalance = validBalance
    ? balanceStat.value - (validIncoming ? incomingStat.value : 0)
    : 0;
  const openingText = validBalance
    ? formatStat(balanceStat, openingBalance)
    : V.mainNumber;
  const balanceRoom = (screenW - L.bodyLeft * 2) / 1.045;

  fitStrings(
    $("al-balance"),
    [openingText, V.mainNumber],
    balanceRoom,
  );
  $("al-balance").style.width = Math.floor(balanceRoom) + "px";

  const dayNames = [
    "Monday", "Tuesday", "Wednesday", "Thursday",
    "Friday", "Saturday", "Sunday",
  ];
  const chartValues = dayNames.map((day) => {
    const stat = parseStat(V["chart" + day]);
    return stat && Number.isFinite(stat.value) ? stat.value : 0;
  });
  const low = Math.min(...chartValues);
  const high = Math.max(...chartValues);
  const valueSpan = Math.max(1, high - low);
  const tagH = full ? 60 : 48;
  const effectiveChartH = Math.max(104, L.chartH);
  const plotTop = Math.min(tagH + 18, effectiveChartH * 0.5);
  const plotBottom = effectiveChartH - 12;
  const points = chartValues.map((value, i) => ({
    x: 10 + i * (L.chartW - 24) / 6,
    y: plotBottom -
      (value - low) / valueSpan * (plotBottom - plotTop),
  }));

  let pathData = `M${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const dx = (b.x - a.x) * 0.42;
    pathData += ` C${a.x + dx},${a.y} ${b.x - dx},${b.y} ${b.x},${b.y}`;
  }

  $("al-chart-svg").setAttribute(
    "viewBox", `0 0 ${L.chartW} ${effectiveChartH}`,
  );
  const chartLine = $("al-chart-line");
  chartLine.setAttribute("d", pathData);
  chartLine.style.strokeWidth = full ? "8px" : "6px";
  const pathLength = chartLine.getTotalLength();
  chartLine.style.strokeDasharray = String(pathLength);
  chartLine.style.strokeDashoffset = String(pathLength);

  const area = $("al-chart-area");
  area.setAttribute(
    "d",
    pathData +
      ` L${points[6].x},${effectiveChartH}` +
      ` L${points[0].x},${effectiveChartH} Z`,
  );

  const endpoint = points[6];
  const chartTip = $("al-chart-tip");
  chartTip.setAttribute("cx", String(endpoint.x));
  chartTip.setAttribute("cy", String(endpoint.y));
  chartTip.setAttribute("r", full ? "10" : "8");

  const focusIndex = Math.max(
    0,
    dayNames.findIndex(
      (day) => day.toLowerCase() === String(V.chartFocus).toLowerCase(),
    ),
  );
  const focusPoint = points[focusIndex];
  const selected = $("al-chart-selected");
  selected.setAttribute("cx", String(focusPoint.x));
  selected.setAttribute("cy", String(focusPoint.y));
  selected.setAttribute("r", full ? "7" : "6");

  const tag = $("al-chart-tag");
  const tagW = Math.min(full ? 280 : 232, L.chartW - 16);
  Object.assign(tag.style, {
    width: tagW + "px",
    height: tagH + "px",
    left: clamp(focusPoint.x - tagW / 2, 8, L.chartW - tagW - 8) + "px",
    top: "0px",
  });
  $("al-chart-tag-text").textContent = V["chart" + dayNames[focusIndex]];
  fitLine($("al-chart-tag-text"), tagW - 28);

  Object.assign($("al-chart-halo").style, {
    left: endpoint.x - 18 + "px",
    top: endpoint.y - 18 + "px",
  });

  const heroH = full ? 368 : (
    widePayoff ? 280 : Math.min(360, L.phoneH)
  );
  const heroBottom = H - bottomSafe - (widePayoff ? 8 : 0);
  const heroY = widePayoff
    ? heroBottom - heroH
    : L.phoneY + (L.phoneH - heroH) / 2;
  const laneX = L.phoneX + L.phoneW + gap;
  const laneW = W - edge - laneX;
  const statH = full ? 312 : Math.min(312, L.phoneH);
  const statY = full
    ? heroBottom - statH
    : L.phoneY + Math.max(0, (L.phoneH - statH) / 2 - 56);

  const cards = [
    {
      id: 1,
      x: full ? edge : laneX,
      y: statY,
      w: full ? W - edge * 2 : laneW,
      h: statH,
    },
    {
      id: 2,
      x: full ? edge : laneX,
      y: statY,
      w: full ? W - edge * 2 : laneW,
      h: statH,
    },
    {
      id: 3,
      x: widePayoff ? edge : laneX,
      y: heroY,
      w: widePayoff ? W - edge * 2 : laneW,
      h: heroH,
    },
  ];

  cards.forEach((card) => {
    card.el = $("al-card" + card.id);
    card.shadow = $("al-card" + card.id + "-shadow");
    card.copy = $("al-card" + card.id + "-copy");
    card.drift = $("al-card" + card.id + "-drift");
    card.pair = [card.el, card.shadow];

    [card.el, card.shadow, card.copy].forEach((el) => {
      el.style.width = card.w + "px";
      el.style.height = card.h + "px";
    });

    gsap.set(card.pair, {
      x: card.x,
      y: card.y,
      rotation: 0,
      borderRadius: full ? 28 : 24,
      scaleX: 1,
      scaleY: 1,
    });
  });

  const [c1, c2, c3] = cards;
  const pad = full ? 32 : 20;

  function placeLine(id, x, y, px, width) {
    const el = $(id);
    Object.assign(el.style, {
      left: x + "px",
      top: y + "px",
      fontSize: px + "px",
    });
    fitLine(el, width);
    return el;
  }

  function placeCaption(id, texts, x, y, px, width, height) {
    const el = $(id);
    const samples = Array.isArray(texts) ? texts : [texts];
    Object.assign(el.style, {
      left: x + "px",
      top: y + "px",
      width: width + "px",
      fontSize: px + "px",
      whiteSpace: "normal",
      lineHeight: "1.18",
    });

    let chosenPx = px;
    samples.forEach((text) => {
      el.textContent = lastWords(text);
      el.style.fontSize = px + "px";
      let currentPx = px;
      while (el.offsetHeight > height && currentPx > minText) {
        currentPx--;
        el.style.fontSize = currentPx + "px";
      }
      chosenPx = Math.min(chosenPx, currentPx);
    });
    el.style.fontSize = chosenPx + "px";
    el.textContent = lastWords(samples[0]);
    return el;
  }

  const checkSize = full ? 108 : 40;

  placeLine(
    "al-card1-title", pad, full ? 24 : 20,
    full ? 44 : 36,
    c1.w - pad * 2 - (full ? 0 : checkSize + 12),
  );
  placeLine(
    "al-card1-value", pad, full ? 92 : 94,
    full ? 112 : 72,
    (c1.w - pad * 2 - (full ? 144 : 0)) / 1.035,
  );
  placeCaption(
    "al-card1-caption", V.card1Caption,
    pad, full ? 236 : 190,
    full ? 44 : 36,
    c1.w - pad * 2,
    c1.h - (full ? 236 : 190) - 16,
  );
  Object.assign($("al-card1-check").style, {
    right: pad + "px",
    top: (full ? 108 : 20) + "px",
    width: checkSize + "px",
    height: checkSize + "px",
  });

  placeLine(
    "al-card2-title", pad, full ? 24 : 20,
    full ? 44 : 36, c2.w - pad * 2,
  );
  placeLine(
    "al-card2-value", pad, full ? 90 : 94,
    full ? 124 : 76,
    (c2.w - pad * 2 - (full ? 240 : 0)) / 1.035,
  );
  placeCaption(
    "al-card2-change", V.card2Change,
    pad, full ? 242 : 190,
    full ? 40 : 36,
    c2.w - pad * 2,
    c2.h - (full ? 242 : 190) - 26,
  );

  const barsBox = $("al-mini-bars");
  Object.assign(barsBox.style, full ? {
    right: pad + "px",
    bottom: "90px",
    width: "200px",
    height: "104px",
  } : {
    left: pad + "px",
    right: pad + "px",
    bottom: "14px",
    height: "10px",
  });
  if (c2.h < 290) hide(barsBox);

  const bars = Array.from({ length: 5 }, (_, i) => {
    const bar = make("span", "al-mini-bar", barsBox);
    bar.style.height =
      clamp(number(V["miniBar" + (i + 1)], 50), 5, 100) + "%";
    gsap.set(bar, { scaleY: 0 });
    return bar;
  });

  if (!full && statH < 290) {
    const smallCard = statH < 240;
    ["al-card1-value", "al-card2-value"].forEach((id) => {
      $(id).style.top = (smallCard ? 74 : 86) + "px";
    });
    ["al-card1-caption", "al-card2-change"].forEach((id) => {
      $(id).style.top = (smallCard ? 156 : 178) + "px";
      $(id).style.fontSize = minText + "px";
      if (statH < 232) hide($(id));
    });
  }

  const chipW = Math.min(full ? 224 : 200, c2.w - pad * 2);
  const chipH = full ? 68 : 58;
  const chipSeed = $("al-card2-seed");
  const changeMatch = String(V.card2Change).match(/^.*?%/);
  chipSeed.textContent = changeMatch ? changeMatch[0] : V.card2Change;
  chipSeed.style.fontSize = L.small + "px";
  fitLine(chipSeed, chipW - 24);
  Object.assign(chipSeed.style, {
    display: "flex",
    width: chipW + "px",
    height: chipH + "px",
  });

  let ringSize;
  let ringX;
  let ringY;
  let transferRoom;
  let transferCaptionVisible = true;

  if (widePayoff) {
    const heroPad = full ? 32 : 24;
    ringSize = full ? 148 : 128;
    ringX = heroPad;
    ringY = full ? 108 : 84;
    const textX = heroPad + ringSize + (full ? 28 : 28);
    transferRoom = c3.w - textX - heroPad;

    placeLine(
      "al-card3-title", textX, full ? 28 : 18,
      full ? 44 : 36, transferRoom,
    );
    placeLine(
      "al-card3-value", textX, full ? 88 : 66,
      full ? 176 : 144, transferRoom / 1.08,
    );
    placeCaption(
      "al-card3-caption",
      [V.card3PendingCaption, V.card3Caption],
      textX, full ? 294 : 228,
      full ? 44 : 36,
      transferRoom,
      full ? 60 : 48,
    );
  } else {
    const compact = c3.h < 280;
    ringSize = compact ? 60 : 80;
    ringX = pad;
    ringY = compact ? 86 : 126;
    const textX = pad + ringSize + 18;
    transferRoom = c3.w - textX - pad;

    placeLine(
      "al-card3-title", pad, 20, 32, c3.w - pad * 2,
    );
    placeLine(
      "al-card3-value", textX, ringY + 2,
      compact ? 64 : 82, transferRoom / 1.08,
    );
    placeCaption(
      "al-card3-caption",
      [V.card3PendingCaption, V.card3Caption],
      pad, compact ? 174 : 248,
      32, c3.w - pad * 2,
      c3.h - (compact ? 174 : 248) - 16,
    );

    if (c3.h < 246) {
      transferCaptionVisible = false;
      hide($("al-card3-caption"));
    }
  }

  const transferTitle = $("al-card3-title");
  fitStrings(
    transferTitle,
    [V.card3PendingTitle, V.card3Title],
    widePayoff
      ? transferRoom
      : c3.w - pad * 2,
  );

  const transferNumber = $("al-card3-value");
  fitStrings(
    transferNumber,
    [V.card3Value],
    transferRoom / 1.08,
  );
  transferNumber.style.width =
    Math.floor(transferRoom / 1.08) + "px";

  const progress = $("al-progress");
  Object.assign(progress.style, {
    left: ringX + "px",
    top: ringY + "px",
    width: ringSize + "px",
    height: ringSize + "px",
  });

  const payoffGlint = make("div", "", c3.el);
  payoffGlint.id = "al-payoff-glint";

  const turn = clamp(number(V.phoneTurn, -8), -16, -4);
  const pitch = clamp(number(V.phonePitch, 3), 0, 6);
  const roll = clamp(number(V.phoneRoll, 0), -1, 1);
  const pose = $("al-phone-pose");

  gsap.set(pose, {
    rotationX: pitch,
    rotationY: turn,
    rotationZ: roll,
  });

  const rootBox = $("al-clip").getBoundingClientRect();
  const cameraBox = $("al-camera").getBoundingClientRect();
  const pill = {
    x: (cameraBox.left - rootBox.left) * W / rootBox.width,
    y: (cameraBox.top - rootBox.top) * H / rootBox.height,
    w: cameraBox.width * W / rootBox.width,
    h: cameraBox.height * H / rootBox.height,
  };

  Object.assign($("al-floor-shadow").style, {
    left: L.phoneX - L.phoneW * 0.025 + "px",
    top: L.phoneY + L.phoneH - 24 + "px",
    width: L.phoneW * 1.05 + "px",
    height: (full ? 64 : 42) + "px",
  });

  const tl = gsap.timeline({ paused: true });
  const build = gsap.timeline();

  build.fromTo(pose, {
    rotationX: pitch + 4,
    rotationY: turn - 10,
    rotationZ: 0,
  }, {
    rotationX: Math.max(0, pitch - 1),
    rotationY: turn + 2,
    rotationZ: roll,
    duration: D * 0.16,
    ease: "power3.out",
  }, 0);
  build.to(pose, {
    rotationX: pitch,
    rotationY: turn,
    rotationZ: roll,
    duration: D * 0.055,
    ease: "power2.inOut",
  }, D * 0.16);

  const centeredX = full ? 0 : (W - L.phoneW) / 2 - L.phoneX;

  build.fromTo("#al-phone-float", {
    x: centeredX + (full ? 20 : 0),
    y: 20,
  }, {
    x: centeredX,
    y: 0,
    duration: D * 0.115,
    ease: "power4.out",
  }, 0);

  build.fromTo("#al-floor-shadow", {
    x: centeredX + (full ? 20 : 0),
    scaleX: 0.86,
    scaleY: 0.72,
  }, {
    x: centeredX,
    scaleX: 1,
    scaleY: 1,
    duration: D * 0.115,
    ease: "power3.out",
  }, 0);

  if (!full) {
    build.to("#al-phone-float", {
      x: 0,
      duration: D * 0.10,
      ease: "power3.inOut",
    }, D * 0.115);
    build.to("#al-floor-shadow", {
      x: 0,
      duration: D * 0.10,
      ease: "power3.inOut",
    }, D * 0.115);
  }

  build.set("#al-edge-glint", { autoAlpha: 1 }, D * 0.02);
  build.fromTo("#al-edge-glint", { y: 30 }, {
    y: Math.max(40, L.phoneH - 170),
    duration: D * 0.17,
    ease: "power2.inOut",
    immediateRender: false,
  }, D * 0.02);
  build.set("#al-edge-glint", { autoAlpha: 0 }, D * 0.19);

  build.fromTo("#al-glass-band", { x: -150 }, {
    x: L.phoneW * 0.64,
    duration: D * 0.215,
    ease: "power2.inOut",
  }, 0);

  function countText(el, text, initial, at, duration, ease = "power2.out") {
    const stat = parseStat(text);
    if (!stat || !Number.isFinite(stat.value)) return;

    const decimals = String(text).match(/\.(\d+)(?:[^\d]*)$/);
    const quantum = decimals ? 10 ** -decimals[1].length : 1;
    const direction = Math.sign(stat.value - initial) || 1;

    el.textContent = formatStat(stat, initial);
    build.fromTo(el, {
      textContent: String(initial),
    }, {
      textContent: String(stat.value),
      duration,
      ease,
      immediateRender: false,
      modifiers: {
        textContent(raw) {
          const value = Number(raw);
          if (!Number.isFinite(value)) return text;
          if (Math.abs(value - stat.value) < 0.0000001) return text;

          const formatted = formatStat(stat, value);
          return formatted === text
            ? formatStat(stat, stat.value - direction * quantum)
            : formatted;
        },
      },
    }, at);
  }

  const transactionAt = D * 0.075;
  const screenLand = D * 0.19;

  countText(
    $("al-balance"), V.mainNumber, openingBalance,
    transactionAt, screenLand - transactionAt,
  );

  if (L.showActivity) {
    build.set(row, { autoAlpha: 1 }, transactionAt);
    build.fromTo(row, {
      x: 42,
      y: 12,
      backgroundColor: V.brandTint,
    }, {
      x: 0,
      y: 0,
      backgroundColor: V.surface,
      duration: D * 0.09,
      ease: "power4.out",
      immediateRender: false,
    }, transactionAt);
    build.fromTo(rowIcon, {
      scaleX: 1.2,
      scaleY: 1.2,
    }, {
      scaleX: 1,
      scaleY: 1,
      duration: D * 0.09,
      ease: "back.out(1.7)",
      immediateRender: false,
    }, transactionAt);
  }

  build.fromTo("#al-balance", {
    scaleX: 1.035,
    scaleY: 1.035,
    color: V.brandColor,
  }, {
    scaleX: 1,
    scaleY: 1,
    color: V.ink,
    duration: D * 0.065,
    ease: "power3.out",
    immediateRender: false,
  }, screenLand);

  if (L.showDelta) {
    build.set("#al-delta", { autoAlpha: 1 }, screenLand);
    build.fromTo("#al-delta", {
      scaleX: 0.88,
      scaleY: 0.88,
    }, {
      scaleX: 1,
      scaleY: 1,
      duration: D * 0.065,
      ease: "back.out(1.8)",
      immediateRender: false,
    }, screenLand);
  }

  gsap.set(area, { clipPath: "inset(0% 100% 0% 0%)" });

  if (L.showChart) {
    build.to(chartLine, {
      strokeDashoffset: 0,
      duration: screenLand - transactionAt,
      ease: "power3.out",
    }, transactionAt);
    build.to(area, {
      clipPath: "inset(0% 0% 0% 0%)",
      duration: screenLand - transactionAt,
      ease: "power3.out",
    }, transactionAt);
    build.set(
      [chartTip, selected, tag, $("al-chart-halo")],
      { autoAlpha: 1 },
      screenLand,
    );
    build.fromTo(tag, {
      scaleX: 0.88,
      scaleY: 0.88,
    }, {
      scaleX: 1,
      scaleY: 1,
      duration: D * 0.06,
      ease: "back.out(1.6)",
      immediateRender: false,
    }, screenLand);
    build.fromTo("#al-chart-halo", {
      scaleX: 0.65,
      scaleY: 0.65,
      opacity: 0.9,
    }, {
      scaleX: 1,
      scaleY: 1,
      opacity: 0.35,
      duration: D * 0.09,
      ease: "power3.out",
      immediateRender: false,
    }, screenLand);
  }

  /*
   * Only a small source shape travels. At impact, geometry and all copy
   * switch together to the complete card. No expanding blank panels.
   */
  function beginSource(card, source, at, color) {
    build.set(card.drift, { autoAlpha: 1 }, at);
    build.set(card.shadow, { autoAlpha: 0 }, at);
    build.set(card.copy, { autoAlpha: 0 }, at);
    build.set(card.el, {
      x: source.x,
      y: source.y,
      width: source.w,
      height: source.h,
      borderRadius: 999,
      backgroundColor: color,
      borderColor: color,
      scaleX: 1,
      scaleY: 1,
    }, at);
  }

  function landCard(card, at) {
    build.set(card.pair, {
      x: card.x,
      y: card.y,
      width: card.w,
      height: card.h,
      borderRadius: full ? 28 : 24,
    }, at);
    build.set(card.el, {
      backgroundColor: V.surface,
      borderColor: V.lineColor,
    }, at);
    build.set(card.shadow, { autoAlpha: 1 }, at);
    build.set(card.copy, { autoAlpha: 1 }, at);
    build.fromTo(card.pair, {
      scaleX: 1.025,
      scaleY: 1.025,
    }, {
      scaleX: 1,
      scaleY: 1,
      duration: D * 0.055,
      ease: "power3.out",
      immediateRender: false,
    }, at);
  }

  function retire(card, at) {
    build.set(card.drift, { autoAlpha: 0 }, at);
  }

  const clearedPhone = new Set();

  function clearPhone(id, at) {
    if (clearedPhone.has(id)) return;
    clearedPhone.add(id);
    build.set($(id), { autoAlpha: 0 }, at);
  }

  function clearLowerCopy(limit, at, chartShift = 0) {
    const screenTop = L.phoneY + L.inset;
    const labelBottom =
      screenTop + L.axisY + L.small * 1.18 - chartShift;

    if (L.showAxis && labelBottom > limit) {
      clearPhone("al-chart-labels", at);
    }

    if (
      L.showActivity &&
      screenTop + L.rowY + L.rowH + 24 > limit
    ) {
      clearPhone("al-recent", at);
      clearPhone("al-activities", at);
    }

    if (L.showNav && screenTop + L.navY + 58 > limit) {
      clearPhone("al-nav", at);
    }
  }

  const c1At = D * 0.22;
  const c1Land = D * 0.29;
  const liftRun = D * 0.012;
  const sweepRun = D * 0.026;
  const dropRun = c1Land - c1At - liftRun - sweepRun;
  const flightX = full ? edge + 16 : c1.x + 24;
  const flightY = full ? topSafe - 12 : Math.max(6, L.phoneY - 10);

  beginSource(c1, pill, c1At, V.ink);
  build.set("#al-camera", { autoAlpha: 0 }, c1At);
  build.to(c1.el, {
    y: flightY,
    width: full ? 88 : 76,
    height: full ? 22 : 20,
    duration: liftRun,
    ease: "power2.out",
  }, c1At);
  build.set("#al-camera", { autoAlpha: 1 }, c1At + liftRun);
  build.to(c1.el, {
    x: flightX,
    duration: sweepRun,
    ease: "power3.inOut",
  }, c1At + liftRun);
  build.to(c1.el, {
    y: c1.y + 24,
    duration: dropRun,
    ease: "power3.in",
  }, c1At + liftRun + sweepRun);

  landCard(c1, c1Land);
  build.fromTo("#al-card1-check", {
    scaleX: 1.25,
    scaleY: 1.25,
  }, {
    scaleX: 1,
    scaleY: 1,
    duration: D * 0.065,
    ease: "back.out(1.8)",
    immediateRender: false,
  }, c1Land);

  if (full) clearLowerCopy(c1.y - 12, c1Land);

  const c2At = D * 0.475;
  const c2Land = D * 0.515;

  retire(c1, c2At);
  beginSource(c2, {
    x: c2.x + c2.w - chipW - pad,
    y: c2.y + (c2.h - chipH) / 2,
    w: chipW,
    h: chipH,
  }, c2At, V.brandTint);
  build.set(chipSeed, { autoAlpha: 1 }, c2At);
  build.to(c2.el, {
    x: c2.x + (c2.w - chipW) / 2,
    y: c2.y + 28,
    duration: c2Land - c2At,
    ease: "power3.inOut",
  }, c2At);
  build.set(chipSeed, { autoAlpha: 0 }, c2Land);
  landCard(c2, c2Land);

  bars.forEach((bar, i) => {
    build.to(bar, {
      scaleY: 1,
      duration: D * 0.05,
      ease: "back.out(1.8)",
    }, c2Land + D * 0.007 * i);
  });

  const c3At = D * 0.735;
  const c3Land = D * 0.775;

  retire(c2, c3At);

  /*
   * Keep the curve visible above the transfer in short-form layouts.
   * Its tooltip leaves before the curve moves toward the change chip.
   * Copy under the band clears on the band's arrival, not beforehand.
   */
  if (widePayoff) {
    let chartShift = 0;

    if (!full && L.showChart) {
      const screenTop = L.phoneY + L.inset;
      const wantedShift = Math.max(
        0,
        screenTop + L.chartY + L.chartH - (c3.y - 26),
      );
      const topLimit = L.showDelta
        ? L.deltaY + L.deltaH + 20
        : L.balanceY + parseFloat(
          getComputedStyle($("al-balance")).fontSize,
        ) * 1.06 + 20;
      const maxShift = Math.max(
        0,
        L.chartY + plotTop - topLimit,
      );
      chartShift = Math.min(wantedShift, maxShift);

      if (chartShift > 0) {
        build.set([tag, selected], { autoAlpha: 0 }, c3At);
        build.to(
          [$("al-chart"), $("al-chart-labels")],
          {
            y: -chartShift,
            duration: c3Land - c3At,
            ease: "power3.inOut",
          },
          c3At,
        );
      }

      if (
        screenTop + L.chartY + L.chartH - chartShift >
        c3.y - 16
      ) {
        clearPhone("al-chart", c3Land);
      }
    }

    clearLowerCopy(c3.y - 16, c3Land, chartShift);
  }

  const discPad = 16;
  const discSize = ringSize + discPad * 2;

  beginSource(c3, {
    x: c3.x + ringX - discPad,
    y: c3.y + ringY - discPad,
    w: discSize,
    h: discSize,
  }, c3At, V.surface);

  build.set(c3.el, { borderColor: V.lineColor }, c3At);
  build.set(progress, {
    x: discPad - ringX,
    y: discPad - ringY,
  }, c3At);
  build.fromTo(c3.el, {
    scaleX: 0.78,
    scaleY: 0.78,
  }, {
    scaleX: 1,
    scaleY: 1,
    duration: c3Land - c3At,
    ease: "back.out(1.7)",
    immediateRender: false,
  }, c3At);

  landCard(c3, c3Land);
  build.set(progress, { x: 0, y: 0 }, c3Land);

  build.fromTo("#al-progress-line", {
    strokeDashoffset: 100,
  }, {
    strokeDashoffset: 0,
    duration: D - c3At,
    ease: "power2.inOut",
    immediateRender: false,
  }, c3At);

  countText(
    transferNumber, V.card3Value, 0,
    c3Land, D - c3Land, "power2.inOut",
  );

  build.timeScale(1 / T.scale);
  tl.add(build, 0);

  tl.set(transferNumber, { textContent: V.card3Value }, T.key);
  tl.set(transferTitle, { textContent: V.card3Title }, T.key);

  if (transferCaptionVisible) {
    tl.set("#al-card3-caption", {
      textContent: lastWords(V.card3Caption),
    }, T.key);
  }

  tl.set("#al-transfer-arrow", { autoAlpha: 0 }, T.key);
  tl.set("#al-transfer-check", { autoAlpha: 1 }, T.key);
  tl.set(c3.el, {
    backgroundColor: V.brandColor,
    borderColor: V.brandColor,
  }, T.key);
  tl.set(
    ["#al-card3-title", "#al-card3-value", "#al-card3-caption"],
    { color: V.surface },
    T.key,
  );
  tl.set("#al-progress-line", { stroke: V.surface }, T.key);
  tl.set("#al-progress-track", {
    stroke: rgba(V.surface, 0.25),
  }, T.key);
  tl.set("#al-progress-burst", { borderColor: V.surface }, T.key);
  tl.set("#al-progress-core", {
    backgroundColor: V.surface,
    color: V.brandColor,
  }, T.key);

  if (T.hold > 0) {
    const reaction = Math.min(0.32, T.hold);

    tl.fromTo(c3.pair, {
      scaleX: 1.035,
      scaleY: 1.035,
    }, {
      scaleX: 1,
      scaleY: 1,
      duration: reaction,
      ease: "back.out(1.5)",
      immediateRender: false,
    }, T.key);
    tl.fromTo(transferNumber, {
      scaleX: 1.04,
      scaleY: 1.04,
    }, {
      scaleX: 1,
      scaleY: 1,
      duration: reaction,
      ease: "power3.out",
      immediateRender: false,
    }, T.key);
    tl.fromTo("#al-progress-core", {
      scaleX: 1.25,
      scaleY: 1.25,
    }, {
      scaleX: 1,
      scaleY: 1,
      duration: reaction,
      ease: "back.out(1.8)",
      immediateRender: false,
    }, T.key);
    tl.fromTo("#al-progress-burst", {
      autoAlpha: 0.65,
      scaleX: 0.9,
      scaleY: 0.9,
    }, {
      autoAlpha: 0,
      scaleX: 1.65,
      scaleY: 1.65,
      duration: T.hold,
      ease: "power2.out",
      immediateRender: false,
    }, T.key);

    tl.set(payoffGlint, { autoAlpha: 0.12 }, T.key);
    tl.fromTo(payoffGlint, { x: 0 }, {
      x: c3.w + 320,
      duration: T.hold,
      ease: "sine.inOut",
      immediateRender: false,
    }, T.key);

    tl.fromTo("#al-glass-band", {
      x: L.phoneW * 0.64,
    }, {
      x: L.phoneW + 100,
      duration: T.hold,
      ease: "sine.inOut",
      immediateRender: false,
    }, T.key);

    tl.fromTo("#al-floor-shadow", {
      scaleX: 1,
      scaleY: 1,
    }, {
      scaleX: 1.04,
      scaleY: 0.92,
      duration: T.hold,
      ease: "sine.inOut",
      immediateRender: false,
    }, T.key);

    if (L.showChart && !clearedPhone.has("al-chart")) {
      tl.fromTo("#al-chart-halo", {
        scaleX: 1,
        scaleY: 1,
        opacity: 0.35,
      }, {
        scaleX: 1.65,
        scaleY: 1.65,
        opacity: 0.08,
        duration: T.hold,
        ease: "sine.out",
        immediateRender: false,
      }, T.key);
    }

    tl.fromTo("#al-backdrop", {
      scaleX: 1,
      scaleY: 1,
      x: 0,
      y: 0,
    }, {
      scaleX: 1.015,
      scaleY: 1.015,
      x: 4,
      y: -5,
      duration: T.hold,
      ease: "sine.inOut",
      immediateRender: false,
    }, T.key);
  }

  const radius = Math.hypot(W, H);
  const wipeX = (c3.x + ringX + ringSize / 2) / W * 100;
  const wipeY = (c3.y + ringY + ringSize / 2) / H * 100;
  const openClip = `circle(${radius}px at ${wipeX}% ${wipeY}%)`;
  const closedClip = `circle(0px at ${wipeX}% ${wipeY}%)`;

  if (overlay) {
    tl.fromTo(stageEl, { clipPath: closedClip }, {
      clipPath: openClip,
      duration: Math.min(0.2, T.key * 0.1),
      ease: "power3.out",
    }, 0);
  }

  if (T.exit > 0) {
    const fps = Math.max(1, number(CA.fps, 30));
    const exitDuration = Math.max(0, T.exit - 1 / fps);

    if (exitDuration > 0) {
      tl.fromTo(stageEl, { clipPath: openClip }, {
        clipPath: closedClip,
        duration: exitDuration,
        ease: "power3.in",
        immediateRender: false,
      }, T.key + T.hold);
    } else {
      tl.set(stageEl, { clipPath: closedClip }, T.key + T.hold);
    }
  }

  window.__timelines["block"] = tl;
});