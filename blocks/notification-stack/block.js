CA.ready(() => {
  const { vars: V, stage: S, safe, time: T, variant, make, fit, rgba } = CA;
  const $ = (id) => document.getElementById(id);
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const finite = (value, fallback) =>
    Number.isFinite(Number(value)) ? Number(value) : fallback;
  const out3 = (p) => 1 - Math.pow(1 - clamp(p, 0, 1), 3);
  const smooth = (p) => {
    const q = clamp(p, 0, 1);
    return q * q * (3 - 2 * q);
  };
  const overlaps = (a, b) =>
    a.left < b.right &&
    a.right > b.left &&
    a.top < b.bottom &&
    a.bottom > b.top;

  const stageEl = $("stage");
  const clip = $("ns-clip");
  const phone = $("ns-phone");
  const screen = $("ns-screen");
  const summary = $("ns-summary");
  const summaryFace = $("ns-summary-face");
  const rim = $("ns-summary-rim");
  const flash = $("ns-summary-flash");
  const totalEl = $("ns-total");
  const countEl = $("ns-count");
  const stackWindow = $("ns-stack-window");
  const stackShadow = $("ns-stack-shadow");
  const pill = $("ns-pill");

  const W = S.w;
  const H = S.h;
  const full = variant === "full";
  const tiny = !full && H < 620;
  const minimum = full ? 40 : 32;
  const flashAccent = gsap.utils.interpolate(V.accent, V.ink, 0.35);

  stageEl.style.setProperty("--ns-ground", V.ground);
  stageEl.style.setProperty("--ns-ink", V.ink);
  stageEl.style.setProperty("--ns-accent", V.accent);
  stageEl.style.setProperty("--ns-icon-ink", V.iconInk);

  $("ns-wallpaper").style.background =
    `radial-gradient(ellipse 85% 62% at 12% 22%, ${V.blue}, transparent 78%),` +
    `radial-gradient(ellipse 80% 65% at 94% 73%, ${V.teal}, transparent 80%),${V.ground}`;
  $("ns-light").style.backgroundImage =
    `radial-gradient(ellipse 74% 57% at 60% 50%, ${rgba(V.teal, 0.48)}, transparent 80%)`;
  $("ns-grain").style.backgroundImage = CA.grainUrl(256, 0.48, 31);

  const M = full
    ? {
        date: 40, clock: 150, bar: 264,
        card: 164, minCard: 152, gap: 14,
        title: 44, body: 44, stamp: 40, icon: 76,
        titleY: 16, bodyY: 84,
        total: 174, totalY: 62, count: 40, label: 40,
        pill: 76, pillFont: 46, tail: 26
      }
    : variant === "top"
      ? {
          date: 32, clock: 72, bar: 208,
          card: 118, minCard: 104, gap: 10,
          title: 34, body: 36, stamp: 32, icon: 56,
          titleY: 8, bodyY: 54,
          total: 128, totalY: 54, count: 34, label: 34,
          pill: 64, pillFont: 36, tail: 20
        }
      : {
          date: 32, clock: 80, bar: 204,
          card: 116, minCard: 104, gap: 10,
          title: 36, body: 38, stamp: 32, icon: 58,
          titleY: 8, bodyY: 54,
          total: 124, totalY: 52, count: 34, label: 34,
          pill: 68, pillFont: 38, tail: 20
        };

  if (tiny) {
    Object.assign(M, {
      bar: 176, total: 108, totalY: 48,
      card: 112, minCard: 104,
      title: 34, body: 36, stamp: 32, icon: 56,
      count: 32, label: 32, pill: 60, pillFont: 34
    });
  }

  const side = Math.max(
    finite(safe.side, 0),
    full ? 64 : variant === "overlay" ? 56 : 48
  );
  const width = W - side * 2;
  const headerTop =
    Math.max(finite(safe.top, 0), full ? 230 : 32) +
    (full ? 20 : 8);
  const bottomLimit =
    H - Math.max(finite(safe.bottom, 0), full ? 300 : 24) -
    (full ? 20 : 12);
  const pillGap = 32;

  let dateY;
  let timeY;
  let barY;

  if (full) {
    dateY = headerTop;
    timeY = dateY + M.date * 1.2 + 4;
    barY = timeY + M.clock * 1.04 + 20;
  } else {
    timeY = headerTop;
    dateY = headerTop + (M.clock * 1.04 - M.date * 1.2) / 2;
    barY = timeY + M.clock * 1.04 + 12;
  }

  if (tiny) barY = Math.max(16, finite(safe.top, 0));

  const stackY = barY + M.bar + (full ? 20 : 14);
  const availableStack =
    bottomLimit - stackY - M.tail - pillGap - M.pill;
  const visibleSlots = clamp(
    Math.floor((availableStack + M.gap) / (M.minCard + M.gap)),
    1,
    4
  );

  M.card = Math.min(
    M.card,
    Math.max(
      M.minCard,
      (availableStack - (visibleSlots - 1) * M.gap) / visibleSlots
    )
  );

  const step = M.card + M.gap;
  const stackH = visibleSlots * M.card + (visibleSlots - 1) * M.gap;
  const windowH = stackH + M.tail;
  const lastSlotY = (visibleSlots - 1) * step;
  const tuckStep = M.tail / 2;
  const pillY = stackY + windowH + pillGap;

  function fitLine(el, maxWidth, label) {
    fit(el, maxWidth, minimum);
    if (el.getBoundingClientRect().width > maxWidth + 1) {
      throw new Error(
        `notification-stack: shorten ${label} to fit at the minimum readable size.`
      );
    }
  }

  function fitValues(host, values, px, maxWidth, reserveContentWidth) {
    host.style.fontSize = px + "px";
    let widest = values[0];
    let measured = -1;

    values.forEach((value) => {
      host.textContent = value;
      const w = host.getBoundingClientRect().width;
      if (w > measured) {
        measured = w;
        widest = value;
      }
    });

    host.textContent = widest;
    fitLine(host, maxWidth, host === totalEl ? "the total" : "the order count");
    const fittedWidth = Math.ceil(host.getBoundingClientRect().width);
    const fittedSize = parseFloat(getComputedStyle(host).fontSize);
    host.style.width =
      (reserveContentWidth ? fittedWidth : maxWidth) + "px";
    host.style.height = Math.ceil(fittedSize * 1.1 + 2) + "px";
    host.textContent = values[0];
  }

  $("ns-island").style.cssText =
    `top:${full ? 50 : 10}px;width:${full ? 178 : 112}px;` +
    `height:${full ? 42 : 14}px`;
  $("ns-status").style.cssText =
    `right:${side}px;top:${full ? 60 : 12}px;` +
    `width:${full ? 152 : 112}px;height:${full ? 32 : 24}px;` +
    `color:${rgba(V.ink, 0.85)}`;
  $("ns-lock").style.cssText = full
    ? `top:${dateY - 55}px;width:30px;height:38px;color:${rgba(V.ink, 0.85)}`
    : "display:none";

  $("ns-date-text").textContent = V.date;
  $("ns-time-text").textContent = V.clock;
  $("ns-date").style.cssText =
    `top:${dateY}px;font-size:${M.date}px;color:${rgba(V.ink, 0.75)}`;
  $("ns-time").style.cssText =
    `top:${timeY}px;font-size:${M.clock}px`;

  if (!full) {
    const clockWidth = Math.min(280, width * 0.3);
    $("ns-date").style.left = side + "px";
    $("ns-date").style.right = "auto";
    $("ns-date").style.textAlign = "left";
    $("ns-time").style.left = "auto";
    $("ns-time").style.right = side + "px";
    $("ns-time").style.textAlign = "right";
    fitLine($("ns-date-text"), width - clockWidth - 28, "the date");
    fitLine($("ns-time-text"), clockWidth, "the time");
  } else {
    fitLine($("ns-date-text"), width, "the date");
    fitLine($("ns-time-text"), width, "the time");
  }

  if (tiny) {
    $("ns-date").style.display = "none";
    $("ns-time").style.display = "none";
    $("ns-chrome").style.display = "none";
  }

  const bag =
    `<svg viewBox="0 0 64 64" fill="none" aria-hidden="true">` +
    `<path d="M13 22h38l4 34H9l4-34Z" fill="currentColor"/>` +
    `<path d="M22 24V17a10 10 0 0 1 20 0v7" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>` +
    `<path d="m23 39 6 6 13-14" stroke="${V.accent}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>` +
    `</svg>`;

  const radius = full ? 34 : 26;
  const summaryBox =
    `left:${side}px;top:${barY}px;width:${width}px;height:${M.bar}px;` +
    `border-radius:${radius}px`;
  summary.style.cssText = summaryBox;
  $("ns-summary-shadow").style.cssText = summaryBox;
  summaryFace.style.backgroundColor = rgba(V.ink, 0.155);
  summaryFace.style.borderColor = rgba(V.ink, 0.32);
  flash.style.backgroundColor = rgba(V.accent, 0.26);

  const summaryIcon = $("ns-summary-icon");
  const summaryIconPx = full ? 56 : 40;
  summaryIcon.innerHTML = bag;
  summaryIcon.style.cssText =
    `left:${full ? 24 : 20}px;top:${full ? 16 : 12}px;` +
    `width:${summaryIconPx}px;height:${summaryIconPx}px`;

  const copyX = full ? 98 : 76;
  const copyRight = full ? 32 : 24;
  $("ns-summary-copy").style.cssText =
    `left:${copyX}px;right:${copyRight}px;top:${full ? 20 : 12}px;` +
    `height:${M.label * 1.2}px`;
  $("ns-summary-label").textContent = V.summaryLabel;
  $("ns-summary-label").style.fontSize = M.label + "px";
  $("ns-count-label").textContent = V.countLabel;
  $("ns-count-line").style.cssText =
    `font-size:${M.count}px;color:${rgba(V.ink, 0.9)}`;
  fitLine($("ns-count-label"), width * 0.25, "the count label");

  let money;
  try {
    money = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: String(V.currency).trim().toUpperCase(),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  } catch (_) {
    throw new Error(
      "notification-stack: currency must be a valid three-letter currency code."
    );
  }

  // These are design-frame positions. The child timeline scales the
  // complete sequence to T.key, including the final whole-number count.
  const KEY_FRAME = 113;
  const landFrames = [
    0, 15, 27, 36, 43, 48, 52,
    56, 59, 63, 66, 70, 74, 77,
    81, 84, 88, 92, 95, 99, 106
  ];
  const COUNT_FRAMES = 4;
  const initialCount = Math.max(
    1,
    Math.round(finite(V.startingCount, 1))
  );
  let runningCents = Math.round(
    Math.max(0, finite(V.startingTotal, 0)) * 100
  );

  const orders = landFrames.map((land, i) => {
    const cents = Math.round(
      Math.max(0, finite(V[`order${i + 1}Amount`], 0)) * 100
    );
    const items = Math.max(
      1,
      Math.round(finite(V[`order${i + 1}Items`], 1))
    );
    if (i > 0) runningCents += cents;
    const gap = i ? land - landFrames[i - 1] : 0;
    return {
      land,
      enter: i ? land - Math.min(6, gap * 0.82) : 0,
      cents,
      items,
      total: runningCents,
      count: initialCount + i
    };
  });

  // Fast arrivals interrupt and retarget the same complete text value.
  // No character columns, duplicated numerals or competing count tweens.
  const countSegments = [];
  for (let i = 1; i < orders.length; i++) {
    let from = orders[0].total;
    const previous = countSegments[countSegments.length - 1];
    if (previous) {
      const p = out3(
        (orders[i].land - previous.start) / COUNT_FRAMES
      );
      from = previous.from + (previous.to - previous.from) * p;
    }
    countSegments.push({
      start: orders[i].land,
      from,
      to: orders[i].total
    });
  }

  fitValues(
    countEl,
    orders.map((order) => String(order.count)),
    M.count,
    width * 0.2,
    true
  );
  fitLine(
    $("ns-summary-label"),
    width - copyX - copyRight -
      $("ns-count-line").getBoundingClientRect().width - 24,
    "the summary label"
  );

  const totalLeft = full ? 32 : 24;
  const totalRight = full ? 38 : 28;
  const totalWidth = width - totalLeft - totalRight;
  const totalFont = Math.min(
    M.total,
    (M.bar - M.totalY - 14) / 1.1
  );

  fitValues(
    totalEl,
    orders.map((order) => money.format(order.total / 100)),
    totalFont,
    totalWidth,
    false
  );
  totalEl.style.left = totalLeft + "px";
  totalEl.style.top = M.totalY + "px";

  stackWindow.style.cssText =
    `left:${side}px;top:${stackY}px;width:${width}px;height:${windowH}px`;
  stackShadow.style.cssText =
    `left:${side + 18}px;top:${stackY + 10}px;` +
    `width:${width - 36}px;height:${M.card - 10}px`;

  function makeCard(order, index) {
    const shell = make("div", "ns-drop", $("ns-cards"));
    shell.style.height = M.card + "px";
    shell.style.zIndex = String(100 + index);

    const surface = make("div", "ns-card", shell);
    surface.style.borderRadius = (full ? 30 : 23) + "px";
    const shade = make("div", "ns-card-shade", surface);
    shade.setAttribute("aria-hidden", "true");
    const content = make("div", "ns-content", surface);

    const icon = make("div", "ns-app-icon", content);
    icon.innerHTML = bag;
    icon.style.cssText =
      `left:${full ? 24 : 18}px;top:${(M.card - M.icon) / 2}px;` +
      `width:${M.icon}px;height:${M.icon}px`;

    const textX = full ? 124 : 94;
    const right = full ? 26 : 20;
    const stamp = make("span", "ns-stamp", content, V.timestamp);
    stamp.style.cssText =
      `right:${right}px;top:${M.titleY + 2}px;font-size:${M.stamp}px;` +
      `color:${rgba(V.ink, 0.68)}`;
    fitLine(stamp, width * 0.2, "the timestamp");

    const title = make("span", "ns-title", content, V.appName);
    title.style.cssText =
      `left:${textX}px;top:${M.titleY}px;font-size:${M.title}px`;
    fitLine(
      title,
      width - textX - stamp.getBoundingClientRect().width - right - 24,
      "the app name"
    );

    const bodyText = String(V.cardFormat)
      .split("[AMOUNT]").join(money.format(order.cents / 100))
      .split("[N]").join(String(order.items));
    const body = make("span", "ns-body", content, bodyText);
    body.style.cssText =
      `left:${textX}px;top:${M.bodyY}px;font-size:${M.body}px;` +
      `color:${rgba(V.ink, 0.96)}`;
    fitLine(body, width - textX - right, "the notification body");

    return { shell, surface, shade, content, title, stamp, body };
  }

  const cards = orders.map(makeCard);

  $("ns-pill-text").textContent = V.pillText;
  pill.style.cssText =
    `top:${pillY}px;height:${M.pill}px;font-size:${M.pillFont}px;` +
    `color:${rgba(V.ink, 0.98)};background:${rgba(V.ink, 0.18)};` +
    `border-color:${rgba(V.ink, 0.36)};transform:translateX(-50%)`;
  fitLine($("ns-pill-text"), width - 100, "the more pill");

  if (full) {
    $("ns-bottom").style.cssText =
      `left:${side + 22}px;right:${side + 22}px;bottom:150px;` +
      `color:${rgba(V.ink, 0.82)}`;
    $("ns-home").style.bottom = "42px";
    $("ns-home").style.opacity = "0.78";
  } else {
    $("ns-bottom").style.display = "none";
    $("ns-home").style.cssText +=
      "bottom:10px;width:190px;height:5px;opacity:0.4";
    if (tiny) $("ns-home").style.display = "none";
  }
  document.querySelectorAll("#ns-bottom .ns-control").forEach((control) => {
    control.style.backgroundColor = rgba(V.ink, 0.09);
  });

  const textEntries = [
    { el: $("ns-date-text"), clips: [] },
    { el: $("ns-time-text"), clips: [] },
    { el: $("ns-summary-label"), clips: [summaryFace] },
    { el: countEl, clips: [summaryFace] },
    { el: $("ns-count-label"), clips: [summaryFace] },
    { el: totalEl, clips: [summaryFace] },
    { el: $("ns-pill-text"), clips: [pill] },
    ...cards.flatMap((card) =>
      [card.title, card.stamp, card.body].map((el) => ({
        el,
        clips: [stackWindow, card.surface]
      }))
    )
  ];

  function syncTextVisibility(seconds) {
    const stageRect = stageEl.getBoundingClientRect();
    const clipRect = clip.getBoundingClientRect();
    let inset = 0;

    // Match the wipe analytically so reverse seeks and modifier sampling
    // do not depend on whether GSAP has rendered the clip-path tween yet.
    if (variant === "overlay") {
      const duration = Math.min(0.24, T.key * 0.2);
      const p = clamp(seconds / duration, 0, 1);
      inset = 0.5 * Math.pow(1 - p, 4);
    }

    if (T.exit > 0 && seconds >= T.key + T.hold) {
      const duration = Math.max(0, T.exit - 1 / CA.fps);
      const p = duration > 0
        ? clamp((seconds - T.key - T.hold) / duration, 0, 1)
        : 1;
      inset = Math.max(inset, 0.5 * Math.pow(p, 4));
    }

    const bounds = {
      left: Math.max(stageRect.left, clipRect.left),
      right: Math.min(stageRect.right, clipRect.right),
      top: Math.max(
        stageRect.top + stageRect.height * inset,
        clipRect.top
      ),
      bottom: Math.min(
        stageRect.bottom - stageRect.height * inset,
        clipRect.bottom
      )
    };
    const inside = (rect, limit) =>
      rect.width > 0 &&
      rect.height > 0 &&
      limit.bottom > limit.top &&
      rect.left >= limit.left - 0.1 &&
      rect.right <= limit.right + 0.1 &&
      rect.top >= limit.top - 0.1 &&
      rect.bottom <= limit.bottom + 0.1;
    const clipRects = new Map();

    textEntries.forEach(({ el }) => {
      el.style.visibility = "";
    });

    textEntries.forEach(({ el, clips }) => {
      // Preserve the intentional visibility of the pill and card content.
      if (getComputedStyle(el).visibility !== "visible") return;

      const rect = el.getBoundingClientRect();
      const contained = inside(rect, bounds) && clips.every((parent) => {
        if (!clipRects.has(parent)) {
          clipRects.set(parent, parent.getBoundingClientRect());
        }
        return inside(rect, clipRects.get(parent));
      });

      if (!contained) el.style.visibility = "hidden";
    });
  }

  function arrivalRebound(age) {
    if (age <= 0 || age >= 5) return 0;
    return Math.sin(Math.PI * age / 5) *
      Math.exp(-0.22 * age) * (full ? 8 : 5);
  }

  let lastRenderedFrame = 0;

  function renderBuild(inputFrame) {
    const frame = clamp(inputFrame, 0, KEY_FRAME);
    lastRenderedFrame = frame;
    const exactFinal = frame >= KEY_FRAME - 0.000001;

    let landed = 0;
    let entered = 0;
    for (let i = 1; i < orders.length; i++) {
      if (frame >= orders[i].land) landed = i;
      if (frame >= orders[i].enter) entered = i;
    }

    let value = orders[0].total;
    if (landed > 0) {
      const segment = countSegments[landed - 1];
      value = segment.from + (segment.to - segment.from) *
        out3((frame - segment.start) / COUNT_FRAMES);
      // The landing frame already changes the value, even at an exact seek.
      if (segment.to > segment.from) {
        value = Math.max(Math.floor(segment.from) + 1, value);
      }
    }
    if (exactFinal) value = orders[orders.length - 1].total;

    totalEl.textContent = money.format(Math.round(value) / 100);
    countEl.textContent = String(orders[landed].count);
    totalEl.style.color = V.ink;
    summaryFace.style.borderColor = rgba(V.ink, 0.32);
    flash.style.visibility = "hidden";
    pill.style.visibility = "hidden";
    screen.style.transform = "translate3d(0,0,0)";
    phone.style.transform =
      `scale(${1 + 0.006 * frame / KEY_FRAME})`;

    let punch = 0;
    let rimStrength = 0;
    if (landed > 0) {
      const age = frame - orders[landed].land;
      if (age < 9) {
        punch = 0.03 * Math.exp(-age / 2.5) * Math.cos(age * 0.65);
        rimStrength = 0.88 * Math.exp(-age / 2);
      }
      const endpointAge = age - COUNT_FRAMES;
      if (endpointAge >= 0 && endpointAge < 5) {
        rimStrength = Math.max(
          rimStrength,
          0.38 * Math.exp(-endpointAge / 1.6)
        );
      }
    }
    summary.style.transform = `scale(${1 + punch})`;
    rim.style.opacity = String(rimStrength);

    const rebound = landed && !exactFinal
      ? arrivalRebound(frame - orders[landed].land)
      : 0;

    const poses = orders.map((order, j) => {
      const live =
        frame >= order.enter &&
        entered - j <= visibleSlots + 1;
      if (!live) {
        cards[j].shell.style.visibility = "hidden";
        cards[j].content.style.visibility = "hidden";
        return { live: false };
      }

      // The column moves as one rigid piece, starting when a card enters,
      // so a landing card never lands on top of the one below it.
      let rawY = 0;
      let squash = 0;
      let incomingScale = 1;
      let pop = 1;

      // A new card pops into the gap the column opens for it, so it never
      // crosses another card and no blank slab shows on the way in.
      for (let k = Math.max(j, 1); k <= entered; k++) {
        const p = out3(
          (frame - orders[k].enter) / (orders[k].land - orders[k].enter)
        );
        if (k === j) {
          pop = clamp((p - 0.8) / 0.15, 0, 1);
          incomingScale = 0.9 + 0.1 * pop;
        } else {
          rawY += step * p;
        }
      }

      if (frame >= order.land) {
        const ownAge = frame - order.land;
        if (j && ownAge < 7) {
          squash += 0.026 * Math.exp(-ownAge / 2.1);
        }
        for (let k = j + 1; k <= landed; k++) {
          const age = frame - orders[k].land;
          if (age >= 0 && age < 7) {
            squash += 0.024 * Math.exp(-age / 2);
          }
        }
      }

      if (exactFinal) {
        rawY = (orders.length - 1 - j) * step;
        squash = 0;
        incomingScale = 1;
        pop = 1;
      }

      // Past the last slot a card keeps moving with the column and fades out,
      // so the bottom of the stack never shows an empty slab.
      const depth = Math.max(0, rawY / step);
      const over = Math.max(0, (rawY - lastSlotY) / step);
      pop *= clamp(1 - over / 0.6, 0, 1);
      const y = rebound + rawY;
      squash = Math.min(squash, 0.045);

      const sx = incomingScale * (1 + squash * 0.38);
      const sy = incomingScale * (1 - squash);
      const card = cards[j];

      card.shell.style.visibility = "visible";
      card.shell.style.opacity = String(pop);
      card.shell.style.transform =
        `translate3d(0,${y.toFixed(3)}px,0) scale(${sx},${sy})`;
      card.surface.style.backgroundColor =
        rgba(V.ink, 0.18 - Math.min(depth, 5) * 0.012);
      card.surface.style.borderColor =
        rgba(V.ink, Math.max(0.12, 0.31 - depth * 0.028));
      card.shade.style.opacity =
        String(Math.min(0.3, depth * 0.025));

      return {
        live: true,
        y,
        sy,
        pop,
        // Keep the surface animation, but expose its text only once even
        // the muted timestamp has sufficient opacity to be read.
        readable: pop >= 0.8 && y >= -0.1
      };
    });

    // A tucked or temporarily covered card never exposes sliced words.
    // Its frosted surface remains, creating the physical backing layers.
    poses.forEach((pose, j) => {
      let readable = pose.live && pose.readable;
      if (readable) {
        const textTop = pose.y + M.titleY * pose.sy;
        const textBottom =
          pose.y + (M.bodyY + M.body * 1.2) * pose.sy;
        for (let k = j + 1; k < poses.length; k++) {
          const front = poses[k];
          if (
            front.live &&
            front.pop > 0 &&
            front.y < textBottom &&
            front.y + M.card * front.sy > textTop - 2
          ) {
            readable = false;
            break;
          }
        }
      }
      cards[j].content.style.visibility = readable ? "visible" : "hidden";
    });

    const occupied = Math.min(visibleSlots, landed + 1);
    const shadowHeight =
      occupied * M.card + (occupied - 1) * M.gap +
      (landed + 1 > visibleSlots ? M.tail : 0);
    stackShadow.style.height = Math.max(M.card - 10, shadowHeight - 10) + "px";

    syncTextVisibility(frame / KEY_FRAME * T.key);
  }

  function renderFinish(seconds) {
    if (seconds <= 0 && lastRenderedFrame < KEY_FRAME - 0.000001) return;

    renderBuild(KEY_FRAME);
    totalEl.textContent = money.format(orders[orders.length - 1].total / 100);
    countEl.textContent = String(orders[orders.length - 1].count);
    totalEl.style.color = V.accent;
    summaryFace.style.borderColor = rgba(V.accent, 0.65);

    const age = Math.max(0, seconds);
    const payoffScale = age < 0.5
      ? 1.008 + 0.072 * Math.exp(-11 * age) * Math.cos(17 * age)
      : 1.008;
    summary.style.transform = `scale(${payoffScale})`;
    rim.style.opacity = String(0.16 + 0.79 * Math.exp(-age * 9));

    const sweep = clamp(age / 0.38, 0, 1);
    flash.style.visibility = age < 0.38 ? "visible" : "hidden";
    flash.style.transform =
      `translateX(${-width * 0.3 + width * 1.6 * smooth(sweep)}px) skewX(-16deg)`;

    // Exactly three output frames of buzz; the text moves as one screen.
    const buzzFrame = Math.floor((age + 0.000001) * CA.fps);
    const buzz = [[-5, 1], [5, -1], [-3, 0]];
    const buzzScale = full ? 1 : 0.75;
    if (buzzFrame < buzz.length) {
      screen.style.transform =
        `translate3d(${buzz[buzzFrame][0] * buzzScale}px,` +
        `${buzz[buzzFrame][1] * buzzScale}px,0)`;
    }

    // A clean read through the entire hold, with a continuing global push.
    const holdProgress = clamp(age / Math.max(T.hold, 1 / CA.fps), 0, 1);
    phone.style.transform =
      `scale(${1.006 + 0.014 * holdProgress})`;

    const p = clamp(age / 0.3, 0, 1);
    const c1 = 1.70158;
    const back = 1 + (c1 + 1) * Math.pow(p - 1, 3) +
      c1 * Math.pow(p - 1, 2);
    const pillScale = 0.78 + 0.22 * back;
    pill.style.visibility = "visible";
    pill.style.transform =
      `translateX(-50%) translateY(${16 * (1 - out3(p))}px) ` +
      `scale(${pillScale})`;

    // The teal sweep raises the backdrop luminance. Lift only the total's
    // foreground during that overlap, then retain the original accent.
    if (
      age < 0.38 &&
      overlaps(totalEl.getBoundingClientRect(), flash.getBoundingClientRect())
    ) {
      totalEl.style.color = flashAccent;
    }

    syncTextVisibility(T.key + age);
  }

  const buildDriver = make("div", "ns-driver", clip);
  const finishDriver = make("div", "ns-driver", clip);
  buildDriver.setAttribute("aria-hidden", "true");
  finishDriver.setAttribute("aria-hidden", "true");

  const tl = gsap.timeline({ paused: true });
  const build = gsap.timeline();

  // Modifiers run during event-suppressed motion-blur sampling.
  // All poses and complete-number text are deterministic at arbitrary seeks.
  build.fromTo(
    buildDriver,
    { x: 0 },
    {
      x: KEY_FRAME,
      duration: T.design,
      ease: "none",
      immediateRender: false,
      modifiers: {
        x(value) {
          const frame = parseFloat(value);
          renderBuild(frame);
          return frame + "px";
        }
      }
    },
    0
  );
  build.timeScale(1 / T.scale);
  tl.add(build, 0);

  const finishDuration = Math.max(T.hold + T.exit, 1 / CA.fps);
  tl.fromTo(
    finishDriver,
    { x: 0 },
    {
      x: finishDuration * 1000,
      duration: finishDuration,
      ease: "none",
      immediateRender: false,
      modifiers: {
        x(value) {
          const milliseconds = parseFloat(value);
          renderFinish(milliseconds / 1000);
          return milliseconds + "px";
        }
      }
    },
    T.key
  );

  tl.fromTo(
    $("ns-light"),
    { backgroundPosition: "0% 100%" },
    {
      backgroundPosition: "100% 0%",
      duration: T.duration,
      ease: "sine.inOut",
      immediateRender: false
    },
    0
  );

  const open = "inset(0% 0% 0% 0% round 0px)";
  const closed = "inset(50% 0% 50% 0% round 0px)";

  if (variant === "overlay") {
    tl.fromTo(
      stageEl,
      { clipPath: closed },
      {
        clipPath: open,
        duration: Math.min(0.24, T.key * 0.2),
        ease: "power3.out"
      },
      0
    );
  }

  if (T.exit > 0) {
    tl.fromTo(
      stageEl,
      { clipPath: open },
      {
        clipPath: closed,
        duration: Math.max(0, T.exit - 1 / CA.fps),
        ease: "power3.in",
        immediateRender: false
      },
      T.key + T.hold
    );
  }

  renderBuild(0);
  window.__timelines["block"] = tl;
});