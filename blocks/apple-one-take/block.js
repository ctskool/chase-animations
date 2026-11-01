CA.ready(() => {
  const { vars: V, stage: S, safe, time: T, variant, make, fit, rgba } = CA;

  const $ = (id) => document.getElementById(id);
  const stage = $("stage");
  const world = $("world");
  const rig = $("carrier-rig");
  const carrier = $("carrier");
  const shadow = $("carrier-shadow");
  const screen = $("screen");
  const ui = $("ui");
  const groundCounter = $("counter-ground");
  const dot = $("hero-dot");
  const pointer = $("pointer");
  const buttonMask = $("button-mask");
  const buttonWord = $("button-word");
  const line = $("closing-line");
  const before = $("closing-before");
  const after = $("closing-after");
  const oSlot = $("o-slot");
  const periodSlot = $("period-slot");
  const closingRule = $("closing-rule");
  const speaker = $("speaker");
  const home = $("home-indicator");
  const nav = $("phone-nav");
  const product = $("product-name");
  const date = $("product-date");
  const focus = $("focus-line");
  const summary = $("priority-summary");
  const header = $("ui-header");
  const tile = $("focus-tile");

  const landingRing = make("div", "", world);
  landingRing.id = "landing-ring";
  landingRing.setAttribute("aria-hidden", "true");

  const W = S.w;
  const H = S.h;
  const compact = variant !== "full";
  const safeSide = Number(safe.side) || 0;
  const safeTop = Number(safe.top) || 0;
  const safeBottom = Number(safe.bottom) || 0;

  const side = compact
    ? Math.max(28, Math.min(safeSide, 44))
    : Math.max(52, safeSide);
  const top = compact
    ? Math.min(Math.max(24, safeTop), H * 0.06)
    : Math.max(230, safeTop);
  const bottomMargin = compact
    ? Math.min(Math.max(24, safeBottom), H * 0.06)
    : Math.max(300, safeBottom);
  const available = Math.max(160, H - top - bottomMargin);
  const cx = W / 2;
  const cy = top + available / 2;

  const columns = compact && available < 810;
  const tightColumns = columns && available < 520;
  const minText = compact ? (tightColumns ? 32 : 36) : 40;
  const D = T.design / 4;
  const at = (n) => n * D;
  const peak = 1.055;
  const dotPeak = 1.75;
  const smallDot = compact ? 28 : 34;

  const compactSpec = {
    cardR: 40,
    phoneR: 66,
    edge: 14,
    cardPad: 36,
    phonePad: 32,
    productC: 96,
    productP: 88,
    dateC: 40,
    dateP: 40,
    focusC: 64,
    focusP: 58,
    summaryC: 40,
    summaryP: 40,
    taskC: 60,
    taskP: 56,
    timeC: 42,
    timeP: 40,
    nav: 40,
    closing: 320,
    pointerW: 144,
    pointerH: 174,
  };

  const layouts = {
    full: {
      dot: 492,
      pillW: 988,
      pillH: 336,
      button: 184,
      cardW: 980,
      cardH: 1240,
      cardR: 48,
      phoneW: 880,
      phoneH: 1350,
      phoneR: 88,
      edge: 16,
      cardPad: 48,
      phonePad: 42,
      productC: 114,
      productP: 108,
      dateC: 46,
      dateP: 44,
      focusC: 82,
      focusP: 72,
      summaryC: 48,
      summaryP: 46,
      taskC: 78,
      taskP: 72,
      timeC: 52,
      timeP: 50,
      nav: 44,
      closing: 360,
      pointerW: 158,
      pointerH: 190,
    },
    top: {
      ...compactSpec,
      dot: 392,
      pillW: 980,
      pillH: 292,
      button: 156,
      cardW: 980,
      cardH: 840,
      phoneW: 804,
      phoneH: 860,
    },
    overlay: {
      ...compactSpec,
      dot: 384,
      pillW: 956,
      pillH: 284,
      button: 152,
      cardW: 956,
      cardH: 832,
      phoneW: 796,
      phoneH: 852,
    },
  };

  const M = { ...(layouts[variant] || layouts.full) };

  if (columns) {
    Object.assign(M, {
      cardW: 964,
      cardH: available - 16,
      phoneW: 944,
      phoneH: available - 16,
      cardR: 36,
      phoneR: 48,
      cardPad: tightColumns ? 24 : 32,
      phonePad: tightColumns ? 24 : 28,
      productC: tightColumns ? 54 : 76,
      productP: tightColumns ? 54 : 72,
      dateC: tightColumns ? 32 : 36,
      dateP: tightColumns ? 32 : 36,
      focusC: tightColumns ? 36 : 44,
      focusP: tightColumns ? 36 : 44,
      summaryC: tightColumns ? 32 : 36,
      summaryP: tightColumns ? 32 : 36,
      taskC: tightColumns ? 34 : 44,
      taskP: tightColumns ? 34 : 44,
      timeC: tightColumns ? 32 : 36,
      timeP: tightColumns ? 32 : 36,
      nav: tightColumns ? 32 : 36,
    });
  }

  M.dot = Math.min(M.dot, available * 0.72, W - side * 2);
  M.pillW = Math.min(M.pillW, W - side * 2);
  M.pillH = Math.min(M.pillH, available * 0.58);
  M.cardW = Math.min(M.cardW, W - side * 2);
  M.phoneW = Math.min(M.phoneW, W - side * 2);
  M.cardH = Math.min(M.cardH, available - 16);
  M.phoneH = Math.min(M.phoneH, available - 16);

  const card = {
    w: M.cardW,
    h: M.cardH,
    r: M.cardR,
    edge: 3,
  };
  const phone = {
    w: M.phoneW,
    h: M.phoneH,
    r: M.phoneR,
    edge: M.edge,
  };

  stage.style.setProperty("--ground", V.ground);
  stage.style.setProperty("--ink", V.ink);
  stage.style.setProperty("--paper", V.paper);
  stage.style.setProperty("--accent", V.accent);
  stage.style.setProperty("--rule", rgba(V.ink, 0.16));

  carrier.setAttribute(
    "aria-label",
    String(V.productName) + ". " + String(V.productPurpose),
  );

  buttonWord.textContent = V.buttonWord;
  buttonWord.style.fontSize =
    Math.max(minText, Math.min(M.button, M.pillH * 0.61)) + "px";
  fit(buttonWord, M.pillW - 170, minText);

  product.textContent = V.productName;
  date.textContent = V.dateLabel;
  focus.textContent = V.focusLine;
  summary.textContent = V.prioritySummary;

  const navLabels = [1, 2, 3].map((n) => {
    const el = $("nav-label-" + n);
    el.textContent = V["nav" + n];
    return el;
  });

  function splitPriority(value) {
    const text = String(value || "");
    const match = text.match(/^(.*?)\s+([—–])\s+(.+)$/);
    return match
      ? { name: match[1], time: match[2] + " " + match[3] }
      : { name: text, time: "" };
  }

  const rows = [1, 2, 3].map((n) => {
    const content = splitPriority(V["priority" + n]);
    const el = make("div", "priority-row", $("task-list"));
    const box = make("div", "task-box", el);
    const tick = make("div", "task-tick", box);
    box.setAttribute("aria-hidden", "true");
    tick.setAttribute("aria-hidden", "true");
    const name = make("span", "task-label", el, content.name);
    const time = make("span", "task-time", el, content.time);
    if (!content.time) gsap.set(time, { autoAlpha: 0 });
    return { el, box, tick, name, time, content };
  });

  function fitted(el, desired, room) {
    el.style.fontSize = Math.max(minText, desired) + "px";
    return fit(el, Math.max(1, room), minText);
  }

  function uiLayout(isPhone) {
    const box = isPhone ? phone : card;
    const sw = box.w - box.edge * 2;
    const sh = box.h - box.edge * 2;
    const pad = isPhone ? M.phonePad : M.cardPad;
    const innerW = sw - pad * 2;
    const columnGap = tightColumns ? 28 : 40;
    const headerW = columns
      ? innerW * (tightColumns ? 0.34 : 0.4)
      : innerW;
    const headerTop = tightColumns
      ? 18
      : columns
        ? 30
        : isPhone
          ? compact ? 30 : 66
          : compact ? 28 : 48;

    const productPx = fitted(
      product,
      isPhone ? M.productP : M.productC,
      headerW - smallDot - 22,
    );
    const datePx = fitted(
      date,
      isPhone ? M.dateP : M.dateC,
      headerW,
    );
    const dateY = productPx * 1.08 +
      (tightColumns ? 6 : compact ? 8 : 12);
    const headerH = dateY + datePx * 1.15;
    const tileTop = headerTop + headerH +
      (tightColumns ? 14 : compact ? 22 : 32);

    const navY = sh - (tightColumns ? 54 : compact ? 80 : 92);
    const inlineSummary = compact && !columns;
    const nominalTileH = tightColumns
      ? 112
      : columns
        ? 140
        : compact
          ? 104
          : isPhone ? 184 : 204;
    const leftBottom = isPhone && columns && !tightColumns
      ? navY - 18
      : sh - pad;
    const tileH = columns
      ? Math.min(nominalTileH, Math.max(96, leftBottom - tileTop))
      : nominalTileH;
    const tilePad = tightColumns ? 12 : compact ? 16 : 20;

    const summaryPx = fitted(
      summary,
      isPhone ? M.summaryP : M.summaryC,
      inlineSummary
        ? (headerW - tilePad * 2) * 0.38
        : headerW - tilePad * 2,
    );
    const summaryW = summary.offsetWidth;
    const focusPx = fitted(
      focus,
      isPhone ? M.focusP : M.focusC,
      headerW - tilePad * 2 -
        (inlineSummary ? summaryW + 24 : 0),
    );

    const taskLeft = columns ? pad + headerW + columnGap : pad;
    const taskW = sw - pad - taskLeft;
    const taskTop = tightColumns
      ? 22
      : columns
        ? 28
        : tileTop + tileH + (compact ? 24 : 44);
    const taskBottom = isPhone
      ? navY - (tightColumns ? 14 : compact ? 20 : 32)
      : sh - pad;
    const rowH = (taskBottom - taskTop) / 3;
    const checkSize = tightColumns ? 26 : compact ? 32 : 40;
    const textLeft = checkSize + (compact ? 12 : 18);
    const rowLineHeight = columns ? 1.08 : 1.15;
    const navLeft = tightColumns ? taskLeft : pad;
    const navWidth = tightColumns ? taskW : innerW;

    const items = [
      [header, { left: pad, top: headerTop, width: headerW }],
      [product, { fontSize: productPx }],
      [date, { top: dateY, fontSize: datePx }],
      [tile, {
        left: pad,
        top: tileTop,
        width: headerW,
        height: tileH,
        borderRadius: compact ? 22 : 30,
      }],
      [focus, {
        left: tilePad,
        top: inlineSummary
          ? (tileH - focusPx * 1.12) / 2
          : tilePad,
        fontSize: focusPx,
      }],
      [summary, {
        left: inlineSummary
          ? headerW - tilePad - summaryW
          : tilePad,
        top: inlineSummary
          ? (tileH - summaryPx * 1.12) / 2
          : tileH - tilePad - summaryPx * 1.12,
        fontSize: summaryPx,
      }],
      [nav, {
        left: navLeft,
        top: navY,
        width: navWidth,
      }],
    ];

    rows.forEach((row, i) => {
      let timePx = fitted(
        row.time,
        isPhone ? M.timeP : M.timeC,
        taskW - textLeft,
      );
      let timeWidth = row.content.time ? row.time.offsetWidth : 0;
      let nameRoom = taskW - textLeft -
        (tightColumns && timeWidth ? timeWidth + 14 : 0);
      let namePx = fitted(
        row.name,
        isPhone ? M.taskP : M.taskC,
        nameRoom,
      );
      const timeGap = compact ? 8 : 10;

      if (!tightColumns && row.content.time) {
        const needed =
          (namePx + timePx) * rowLineHeight + timeGap + 10;
        if (needed > rowH) {
          const ratio = Math.max(
            0,
            (rowH - timeGap - 10) /
              ((namePx + timePx) * rowLineHeight),
          );
          namePx = fitted(
            row.name,
            Math.max(minText, namePx * ratio),
            nameRoom,
          );
          timePx = fitted(
            row.time,
            Math.max(minText, timePx * ratio),
            taskW - textLeft,
          );
          timeWidth = row.time.offsetWidth;
        }
      }

      const nameH = namePx * rowLineHeight;
      items.push(
        [row.el, {
          left: taskLeft,
          top: taskTop + i * rowH,
          width: taskW,
          height: rowH,
        }],
        [row.box, {
          width: checkSize,
          height: checkSize,
          top: (nameH - checkSize) / 2,
        }],
        [row.tick, {
          borderLeftWidth: compact ? 3 : 4,
          borderBottomWidth: compact ? 3 : 4,
        }],
        [row.name, {
          left: textLeft,
          top: 0,
          fontSize: namePx,
          lineHeight: rowLineHeight,
        }],
        [row.time, {
          left: tightColumns ? taskW - timeWidth : textLeft,
          top: tightColumns ? 0 : nameH + timeGap,
          fontSize: timePx,
          lineHeight: rowLineHeight,
        }],
      );
    });

    navLabels.forEach((el) => {
      items.push([el, {
        fontSize: fitted(el, M.nav, navWidth / 3 - 12),
      }]);
    });

    return {
      items,
      dot: {
        x: cx - box.w / 2 + box.edge + pad + headerW - smallDot / 2,
        y: cy - box.h / 2 + box.edge + headerTop + productPx * 0.48,
      },
    };
  }

  const cardUI = uiLayout(false);
  const phoneUI = uiLayout(true);
  cardUI.items.forEach(([el, props]) => gsap.set(el, props));

  const closingBody = String(V.closingLine || "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\.+$/, "");
  const letterIndex = closingBody.search(/[Oo]/);
  const hasO = letterIndex >= 0;
  const outlineLetter = hasO ? closingBody.charAt(letterIndex) : "O";

  before.textContent = hasO ? closingBody.slice(0, letterIndex) : closingBody;
  after.textContent = hasO ? closingBody.slice(letterIndex + 1) : "";
  line.setAttribute("aria-label", closingBody + ".");

  const measure = document.createElement("canvas").getContext("2d");
  let closingPx = M.closing;
  let oMetrics;
  let glyphAscent;
  let glyphDescent;
  let periodAdvance;
  let finalDot;

  function sizeClosing(px) {
    line.style.fontSize = px + "px";
    measure.font = '700 ' + px + 'px "Inter Tight"';
    oMetrics = measure.measureText(outlineLetter);
    const periodMetrics = measure.measureText(".");
    const tracking = -0.04 * px;

    glyphAscent = oMetrics.actualBoundingBoxAscent || px * 0.73;
    glyphDescent = oMetrics.actualBoundingBoxDescent || 0;
    finalDot = Math.max(
      compact ? 30 : 36,
      px * 0.14,
      periodMetrics.actualBoundingBoxAscent || 0,
    );
    periodAdvance = Math.max(
      finalDot * dotPeak + 12,
      periodMetrics.width + tracking,
    );

    oSlot.style.width = hasO
      ? Math.max(1, oMetrics.width + tracking) + "px"
      : "0px";
    oSlot.style.height = hasO
      ? glyphAscent + glyphDescent + "px"
      : "0px";
    oSlot.style.verticalAlign = -glyphDescent + "px";
    periodSlot.style.width = periodAdvance + "px";
    periodSlot.style.height = finalDot + "px";
    periodSlot.style.verticalAlign =
      -(periodMetrics.actualBoundingBoxDescent || 0) + "px";
  }

  sizeClosing(closingPx);
  const closingRoom = (W - side * 2) / peak - 4;
  while (line.offsetWidth > closingRoom && closingPx > minText) {
    closingPx -= 1;
    sizeClosing(closingPx);
  }

  const lineLeft = Math.round((W - line.offsetWidth) / 2);
  const lineTop = Math.round(
    cy - line.offsetHeight / 2 - (compact ? 14 : 24),
  );
  line.style.left = lineLeft + "px";
  line.style.top = lineTop + "px";

  const glyphLeft = oMetrics.actualBoundingBoxLeft || 0;
  const glyphRight = oMetrics.actualBoundingBoxRight || oMetrics.width;
  const oW = Math.max(1, glyphLeft + glyphRight);
  const oH = Math.max(1, glyphAscent + glyphDescent);
  const finalX = hasO
    ? lineLeft + oSlot.offsetLeft - glyphLeft + oW / 2
    : cx;
  const finalY = hasO
    ? lineTop + oSlot.offsetTop + oH / 2
    : cy;
  const periodX = lineLeft + periodSlot.offsetLeft + periodAdvance / 2;
  const periodY = lineTop + periodSlot.offsetTop + finalDot / 2;
  const finalEdge = Math.min(
    closingPx * 0.12,
    oW * 0.22,
    oH * 0.22,
  );

  const leadingSpace = (after.textContent.match(/^\s+/) || [""])[0];
  const spaceWidth = measure.measureText(leadingSpace).width -
    closingPx * 0.04 * leadingSpace.length;
  const ruleStart = Math.max(
    0,
    hasO && after.textContent.trim() ? after.offsetLeft + spaceWidth : 0,
  );
  const ruleWidth = Math.max(
    1,
    periodSlot.offsetLeft - ruleStart - (compact ? 6 : 8),
  );

  gsap.set(closingRule, {
    left: lineLeft + ruleStart,
    top: lineTop + periodSlot.offsetTop + finalDot + (compact ? 20 : 28),
    width: ruleWidth,
    height: compact ? 12 : 16,
    scaleX: 0,
    autoAlpha: 0,
    backgroundColor: V.ink,
  });

  function shadowFor(width) {
    const k = width / 780;
    return [
      `0 ${5 * k}px ${10 * k}px ${rgba(V.ink, 0.12)}`,
      `0 ${20 * k}px ${40 * k}px ${rgba(V.ink, 0.085)}`,
      `0 ${44 * k}px ${88 * k}px ${rgba(V.ink, 0.045)}`,
    ].join(", ");
  }

  function rounding(w, h, r, edge) {
    return {
      "--rx": (r / w * 100) + "%",
      "--ry": (r / h * 100) + "%",
      "--irx": (Math.max(0, r - edge) / (w - edge * 2) * 100) + "%",
      "--iry": (Math.max(0, r - edge) / (h - edge * 2) * 100) + "%",
    };
  }

  const pillDotX = cx + M.pillW / 2 - (compact ? 50 : 58);

  gsap.set(stage, { backgroundColor: V.ground });
  gsap.set(carrier, { backgroundColor: V.ink });
  gsap.set(world, {
    scaleX: 1,
    scaleY: 1,
    transformOrigin: `${cx}px ${cy}px`,
  });
  gsap.set(rig, {
    x: cx,
    y: cy,
    xPercent: -50,
    yPercent: -50,
    width: M.dot,
    height: M.dot,
    "--rx": "50%",
    "--ry": "50%",
    "--irx": "50%",
    "--iry": "50%",
  });
  gsap.set(shadow, { boxShadow: shadowFor(M.dot), opacity: 1 });
  gsap.set(screen, {
    top: M.pillH / 2,
    right: M.pillH / 2,
    bottom: M.pillH / 2,
    left: M.pillH / 2,
    backgroundColor: V.paper,
    autoAlpha: 0,
  });
  gsap.set(ui, {
    autoAlpha: 0,
    clipPath: "inset(0% 0% 0% 0%)",
  });
  gsap.set(header, { autoAlpha: 0, y: 20 });
  gsap.set(tile, {
    autoAlpha: 0,
    y: 20,
    scaleX: 1,
    scaleY: 0.94,
    transformOrigin: "50% 0%",
  });
  rows.forEach((row) => {
    gsap.set(row.el, { autoAlpha: 0, y: 24 });
    gsap.set(row.box, {
      backgroundColor: "transparent",
      opacity: 0.55,
      scaleX: 1,
      scaleY: 1,
    });
    gsap.set(row.tick, {
      clipPath: "inset(0% 100% 0% 0%)",
    });
  });
  gsap.set(buttonMask, {
    autoAlpha: 0,
    clipPath: "inset(0% 100% 0% 0%)",
  });
  gsap.set(dot, {
    x: cx,
    y: cy,
    xPercent: -50,
    yPercent: -50,
    width: M.dot,
    height: M.dot,
    scaleX: 1,
    scaleY: 1,
  });
  gsap.set(landingRing, {
    x: periodX,
    y: periodY,
    xPercent: -50,
    yPercent: -50,
    width: finalDot * 2,
    height: finalDot * 2,
    borderWidth: Math.max(3, finalDot * 0.1),
    scaleX: 0.35,
    scaleY: 0.35,
    autoAlpha: 0,
  });
  gsap.set(pointer, {
    width: M.pointerW,
    height: M.pointerH,
    x: W + M.pointerW,
    y: cy + Math.min(available * 0.3, 300),
    autoAlpha: 0,
  });
  gsap.set(nav, {
    autoAlpha: 0,
    clipPath: "inset(100% 0% 0% 0%)",
  });
  gsap.set(speaker, {
    width: 0,
    height: compact ? 9 : 12,
    top: compact ? 8 : 11,
    autoAlpha: 0,
  });
  gsap.set(home, {
    width: 0,
    height: compact ? 5 : 6,
    bottom: compact ? 7 : 10,
    autoAlpha: 0,
  });
  gsap.set(groundCounter, {
    autoAlpha: 0,
    backgroundColor: V.ground,
    clipPath: "inset(0% 100% 0% 0%)",
  });
  gsap.set(line, { autoAlpha: 0, color: V.ink });
  gsap.set([before, after], {
    autoAlpha: 0,
    scaleY: 0.88,
    transformOrigin: "50% 80%",
  });

  const tl = gsap.timeline({ paused: true });
  const build = gsap.timeline();

  build.to(rig, {
    width: M.pillW,
    height: M.pillH,
    ...rounding(M.pillW, M.pillH, M.pillH / 2, 0),
    duration: at(0.28),
    ease: "back.out(1.15)",
  }, 0);
  build.to(shadow, {
    boxShadow: shadowFor(M.pillW),
    duration: at(0.28),
    ease: "power3.out",
  }, 0);
  build.to(dot, {
    x: pillDotX,
    width: smallDot,
    height: smallDot,
    duration: at(0.27),
    ease: "power3.out",
  }, at(0.02));
  build.set(buttonMask, { autoAlpha: 1 }, at(0.07));
  build.to(buttonMask, {
    clipPath: "inset(0% 0% 0% 0%)",
    duration: at(0.2),
    ease: "power4.out",
  }, at(0.07));

  build.set(pointer, { autoAlpha: 1 }, at(0.29));
  build.to(pointer, {
    x: cx + 88,
    y: cy + 18,
    rotation: -6,
    duration: at(0.2),
    ease: "power3.out",
  }, at(0.29));
  build.to(pointer, {
    scaleX: 0.86,
    scaleY: 0.86,
    duration: at(0.07),
    ease: "power3.in",
  }, at(0.49));
  build.to(rig, {
    scaleX: 0.955,
    scaleY: 0.93,
    duration: at(0.07),
    ease: "power3.in",
  }, at(0.49));
  build.to(dot, {
    scaleX: 0.86,
    scaleY: 0.86,
    duration: at(0.07),
    ease: "power3.in",
  }, at(0.49));
  build.to(rig, {
    scaleX: 1,
    scaleY: 1,
    duration: at(0.14),
    ease: "back.out(1.5)",
  }, at(0.56));
  build.to(dot, {
    scaleX: 1,
    scaleY: 1,
    duration: at(0.14),
    ease: "back.out(1.5)",
  }, at(0.56));
  build.to(pointer, {
    scaleX: 1,
    scaleY: 1,
    duration: at(0.1),
    ease: "power3.out",
  }, at(0.56));
  build.to(pointer, {
    x: W + M.pointerW,
    y: cy + Math.min(available * 0.24, 260),
    rotation: 12,
    duration: at(0.18),
    ease: "power3.in",
  }, at(0.62));
  build.set(pointer, { autoAlpha: 0 }, at(0.8));

  build.to(buttonMask, {
    clipPath: "inset(0% 0% 100% 0%)",
    duration: at(0.08),
    ease: "power3.in",
  }, at(0.61));
  build.set(buttonMask, { autoAlpha: 0 }, at(0.69));

  build.set(screen, { autoAlpha: 1 }, at(0.63));
  build.to(rig, {
    width: card.w,
    height: card.h,
    ...rounding(card.w, card.h, card.r, card.edge),
    duration: at(0.27),
    ease: "power4.out",
  }, at(0.63));
  build.to(screen, {
    top: card.edge,
    right: card.edge,
    bottom: card.edge,
    left: card.edge,
    duration: at(0.27),
    ease: "power4.out",
  }, at(0.63));
  build.to(shadow, {
    boxShadow: shadowFor(card.w),
    duration: at(0.27),
    ease: "power4.out",
  }, at(0.63));
  build.to(dot, {
    x: cardUI.dot.x,
    y: cardUI.dot.y,
    duration: at(0.27),
    ease: "power4.out",
  }, at(0.63));

  build.set(ui, { autoAlpha: 1 }, at(0.9));
  build.set(header, { autoAlpha: 1 }, at(0.9));
  build.to(header, {
    y: 0,
    duration: at(0.12),
    ease: "power4.out",
  }, at(0.9));
  build.set(tile, { autoAlpha: 1 }, at(0.94));
  build.to(tile, {
    y: 0,
    scaleY: 1,
    duration: at(0.14),
    ease: "power4.out",
  }, at(0.94));

  rows.forEach((row, i) => {
    const start = at(0.98 + i * 0.07);
    build.set(row.el, { autoAlpha: 1 }, start);
    build.to(row.el, {
      y: 0,
      duration: at(0.12),
      ease: "power4.out",
    }, start);
  });

  function completeRow(row, designTime) {
    const start = at(designTime);
    build.set(row.box, {
      backgroundColor: V.ink,
      opacity: 1,
    }, start);
    build.to(row.box, {
      scaleX: 1.3,
      scaleY: 1.3,
      duration: at(0.045),
      ease: "power3.out",
    }, start);
    build.to(row.tick, {
      clipPath: "inset(0% 0% 0% 0%)",
      duration: at(0.11),
      ease: "power4.out",
    }, start);
    build.to(row.box, {
      scaleX: 1,
      scaleY: 1,
      duration: at(0.13),
      ease: "back.out(1.3)",
    }, start + at(0.045));
    build.to(dot, {
      scaleX: 1.35,
      scaleY: 1.35,
      duration: at(0.045),
      ease: "power3.out",
    }, start);
    build.to(dot, {
      scaleX: 1,
      scaleY: 1,
      duration: at(0.14),
      ease: "power3.out",
    }, start + at(0.045));
  }

  completeRow(rows[0], 1.29);
  completeRow(rows[1], 1.55);
  completeRow(rows[2], 2.25);

  const phoneStart = at(1.66);
  const phoneDuration = at(0.46);

  build.to(rig, {
    width: phone.w,
    height: phone.h,
    ...rounding(phone.w, phone.h, phone.r, phone.edge),
    duration: phoneDuration,
    ease: "power3.inOut",
  }, phoneStart);
  build.to(screen, {
    top: phone.edge,
    right: phone.edge,
    bottom: phone.edge,
    left: phone.edge,
    duration: phoneDuration,
    ease: "power3.inOut",
  }, phoneStart);
  build.to(shadow, {
    boxShadow: shadowFor(phone.w),
    duration: phoneDuration,
    ease: "power3.inOut",
  }, phoneStart);
  build.to(dot, {
    x: phoneUI.dot.x,
    y: phoneUI.dot.y,
    duration: phoneDuration,
    ease: "power3.inOut",
  }, phoneStart);

  phoneUI.items.forEach(([el, props]) => {
    build.to(el, {
      ...props,
      duration: phoneDuration,
      ease: "power3.inOut",
    }, phoneStart);
  });

  build.set([nav, speaker, home], { autoAlpha: 1 }, at(1.96));
  build.to(nav, {
    clipPath: "inset(0% 0% 0% 0%)",
    duration: at(0.16),
    ease: "power4.out",
  }, at(1.96));
  build.to(speaker, {
    width: compact ? 80 : 108,
    duration: at(0.16),
    ease: "power3.out",
  }, at(1.96));
  build.to(home, {
    width: compact ? 100 : 136,
    duration: at(0.16),
    ease: "power3.out",
  }, at(1.96));

  // Clear the interface while the outline is already contracting.
  // There is no held empty-phone pose.
  const pullStart = at(2.6);
  const pullDuration = at(0.38);
  const letterArrival = at(2.98);

  build.set(groundCounter, { autoAlpha: 1 }, pullStart);
  build.to(groundCounter, {
    clipPath: "inset(0% 0% 0% 0%)",
    duration: at(0.08),
    ease: "power3.inOut",
  }, pullStart);
  build.to(ui, {
    clipPath: "inset(0% 0% 0% 100%)",
    duration: at(0.08),
    ease: "power3.inOut",
  }, pullStart);
  build.set([ui, nav, speaker, home], { autoAlpha: 0 }, at(2.68));

  build.to(rig, {
    width: hasO ? oW : 1,
    height: hasO ? oH : 1,
    x: finalX,
    y: finalY,
    "--rx": "50%",
    "--ry": "50%",
    "--irx": "50%",
    "--iry": "50%",
    duration: pullDuration,
    ease: "power4.inOut",
  }, pullStart);
  build.to(screen, {
    top: hasO ? finalEdge : 0,
    right: hasO ? finalEdge : 0,
    bottom: hasO ? finalEdge : 0,
    left: hasO ? finalEdge : 0,
    duration: pullDuration,
    ease: "power4.inOut",
  }, pullStart);
  build.to(shadow, {
    opacity: 0,
    duration: at(0.16),
    ease: "power3.out",
  }, pullStart);

  if (!hasO) {
    build.set(rig, { autoAlpha: 0 }, letterArrival);
  }

  // Reveal the surrounding words together once their O is in place.
  build.set(line, { autoAlpha: 1 }, letterArrival);
  build.set([before, after], { autoAlpha: 1 }, letterArrival);
  build.to([before, after], {
    scaleY: 1,
    duration: at(0.13),
    ease: "back.out(1.2)",
  }, letterArrival);
  build.set(closingRule, { autoAlpha: 1 }, letterArrival);
  build.to(closingRule, {
    scaleX: 0.68,
    duration: at(0.18),
    ease: "power4.out",
  }, letterArrival);

  const arcStart = phoneUI.dot;
  const arcEnd = { x: periodX, y: periodY };
  const arcControl = {
    x: Math.min(
      W - side - smallDot / 2,
      Math.max(periodX, phoneUI.dot.x) + (compact ? 76 : 112),
    ),
    y: Math.max(
      top + smallDot,
      Math.min(phoneUI.dot.y, periodY) - (compact ? 100 : 160),
    ),
  };

  function arc(p, axis) {
    return (1 - p) * (1 - p) * arcStart[axis] +
      2 * (1 - p) * p * arcControl[axis] +
      p * p * arcEnd[axis];
  }

  build.fromTo(dot,
    { x: 0, y: 0 },
    {
      x: 1,
      y: 1,
      duration: at(1.4),
      ease: "power2.inOut",
      immediateRender: false,
      modifiers: {
        x(value) {
          const p = Math.min(1, Math.max(0, parseFloat(value)));
          return arc(p, "x") + "px";
        },
        y(value) {
          const p = Math.min(1, Math.max(0, parseFloat(value)));
          return arc(p, "y") + "px";
        },
      },
    }, pullStart);
  build.to(dot, {
    width: finalDot,
    height: finalDot,
    duration: at(0.75),
    ease: "power3.out",
  }, pullStart);

  build.to(world, {
    scaleX: peak,
    scaleY: peak,
    duration: at(0.07),
    ease: "power3.in",
  }, T.design - at(0.07));
  build.to(dot, {
    scaleX: dotPeak,
    scaleY: dotPeak,
    duration: at(0.07),
    ease: "power3.in",
  }, T.design - at(0.07));

  build.timeScale(1 / T.scale);
  tl.add(build, 0);

  // The landing changes the existing palette on the exact key frame.
  // All geometry stays continuous; the dark payoff persists through the hold.
  tl.set(stage, { backgroundColor: V.ink }, T.key);
  tl.set(carrier, { backgroundColor: V.paper }, T.key);
  tl.set([screen, groundCounter], { backgroundColor: V.ink }, T.key);
  tl.set(line, { color: V.paper }, T.key);
  tl.set(closingRule, { backgroundColor: V.paper }, T.key);

  if (T.hold > 0) {
    const settle = Math.min(0.16, T.hold * 0.28);
    const dotSettle = Math.min(0.2, T.hold * 0.3);
    const ringDuration = Math.min(0.3, T.hold * 0.45);

    tl.fromTo(world,
      { scaleX: peak, scaleY: peak },
      {
        scaleX: 1,
        scaleY: 1,
        duration: settle,
        ease: "power3.out",
        immediateRender: false,
      }, T.key);
    tl.fromTo(dot,
      { scaleX: dotPeak, scaleY: dotPeak },
      {
        scaleX: 1.08,
        scaleY: 1.08,
        duration: dotSettle,
        ease: "back.out(1.4)",
        immediateRender: false,
      }, T.key);
    tl.fromTo(closingRule,
      { scaleX: 0.68 },
      {
        scaleX: 1,
        duration: T.hold,
        ease: "sine.inOut",
        immediateRender: false,
      }, T.key);

    tl.set(landingRing, { autoAlpha: 1 }, T.key);
    tl.to(landingRing, {
      scaleX: 3,
      scaleY: 3,
      borderWidth: 1,
      duration: ringDuration,
      ease: "power3.out",
    }, T.key);
    tl.set(landingRing, { autoAlpha: 0 }, T.key + ringDuration);

    const breathing = T.hold - dotSettle;
    if (breathing > 0) {
      tl.to(dot, {
        scaleX: 1.3,
        scaleY: 1.3,
        duration: breathing / 2,
        ease: "sine.inOut",
      }, T.key + dotSettle);
      tl.to(dot, {
        scaleX: 1.08,
        scaleY: 1.08,
        duration: breathing / 2,
        ease: "sine.inOut",
      }, T.key + dotSettle + breathing / 2);
    }
  }

  const open =
    `ellipse(150% 150% at ${cx / W * 100}% ${cy / H * 100}%)`;
  const enterClosed =
    `ellipse(0% 0% at ${cx / W * 100}% ${cy / H * 100}%)`;
  const exitClosed =
    `ellipse(0% 0% at ${finalX / W * 100}% ${finalY / H * 100}%)`;

  if (variant === "overlay") {
    tl.fromTo(stage,
      { clipPath: enterClosed },
      {
        clipPath: open,
        duration: 0.18,
        ease: "power4.out",
      }, 0);
  } else {
    gsap.set(stage, { clipPath: open });
  }

  if (T.exit > 0) {
    tl.to(stage, {
      clipPath: exitClosed,
      duration: Math.max(0, T.exit - 1 / CA.fps),
      ease: "power3.in",
    }, T.key + T.hold);
  }

  window.__timelines["block"] = tl;
});