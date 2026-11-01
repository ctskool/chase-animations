CA.ready(() => {
  const { vars: V, stage: S, safe, time: T, variant, make, fit, rgba } = CA;
  const $ = (id) => document.getElementById(id);
  const stageEl = $("stage");
  const W = S.w;
  const H = S.h;
  const full = variant === "full";
  const compact = !full && H < 880;
  const tiny = !full && H < 620;
  const minimum = full ? 40 : 32;
  const finite = (value, fallback) =>
    Number.isFinite(Number(value)) ? Number(value) : fallback;

  stageEl.style.setProperty("--ns-ground", V.ground);
  stageEl.style.setProperty("--ns-ink", V.ink);
  stageEl.style.setProperty("--ns-accent", V.accent);
  stageEl.style.setProperty("--ns-icon-ink", V.iconInk);

  function mix(a, b, p) {
    const rgb = (value) => {
      let hex = String(value).replace("#", "");
      if (hex.length === 3) {
        hex = hex.split("").map((c) => c + c).join("");
      }
      const n = parseInt(hex, 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    };
    const A = rgb(a);
    const B = rgb(b);
    return "rgb(" + A.map((v, i) =>
      Math.round(v + (B[i] - v) * p)
    ).join(",") + ")";
  }

  $("ns-wallpaper").style.background =
    `radial-gradient(ellipse 85% 62% at 12% 22%, ${V.blue}, transparent 78%),` +
    `radial-gradient(ellipse 80% 65% at 94% 73%, ${V.teal}, transparent 80%),${V.ground}`;
  $("ns-light").style.backgroundImage =
    `radial-gradient(ellipse 74% 57% at 60% 50%, ${rgba(V.teal, 0.48)}, transparent 80%)`;
  $("ns-grain").style.backgroundImage = CA.grainUrl(256, 0.48, 31);

  const M = full
    ? {
        date: 42, clock: 128, bar: 348, card: 180, minCard: 172,
        gap: 14, title: 48, body: 50, stamp: 40, icon: 82,
        titleY: 16, bodyY: 96,
        total: 196, totalY: 84, count: 44, label: 44, pill: 60
      }
    : variant === "top"
      ? {
          date: 32, clock: 64, bar: 216, card: 112, minCard: 104,
          gap: 10, title: 34, body: 36, stamp: 32, icon: 56,
          titleY: 8, bodyY: 56,
          total: 112, totalY: 60, count: 34, label: 34, pill: 48
        }
      : {
          date: 32, clock: 56, bar: 232, card: 116, minCard: 108,
          gap: 10, title: 36, body: 38, stamp: 32, icon: 60,
          titleY: 8, bodyY: 56,
          total: 128, totalY: 56, count: 34, label: 34, pill: 48
        };

  if (compact) {
    Object.assign(M, {
      date: 32, clock: 56, bar: 210, card: 112, minCard: 104,
      gap: 8, title: 34, body: 36, stamp: 32, icon: 56,
      titleY: 8, bodyY: 56,
      total: 110, totalY: 54, count: 32, label: 32, pill: 44
    });
  }
  if (tiny) {
    Object.assign(M, {
      bar: 196, total: 100, totalY: 52,
      card: 112, minCard: 104
    });
  }

  const side = Math.max(safe.side, full ? 56 : 48);
  const width = W - 2 * side;
  const bottomLimit = H - Math.max(safe.bottom, full ? 300 : 28);
  const headerTop = Math.max(safe.top, full ? 230 : 30);
  const horizontalHeader = !full && (variant === "top" || compact);

  let dateY;
  let timeY;
  let barY;

  if (horizontalHeader) {
    timeY = headerTop;
    dateY = headerTop + (M.clock * 1.08 - M.date * 1.2) / 2;
    barY = headerTop + M.clock * 1.08 + 8;
  } else {
    dateY = headerTop;
    timeY = dateY + M.date * 1.2 + 4;
    barY = timeY + M.clock * 1.08 + (full ? 18 : 10);
  }

  if (tiny) {
    barY = Math.max(20, safe.top);
  }

  const stackY = barY + M.bar + (full ? 20 : 12);
  const pillGap = 12;
  const availableStack = bottomLimit - stackY - pillGap - M.pill;
  const visibleSlots = Math.max(
    1,
    Math.min(
      4,
      Math.floor((availableStack + M.gap) / (M.minCard + M.gap))
    )
  );

  M.card = Math.min(
    M.card,
    Math.max(
      M.minCard,
      (availableStack - M.gap * (visibleSlots - 1)) / visibleSlots
    )
  );

  const step = M.card + M.gap;
  const stackH = visibleSlots * M.card + (visibleSlots - 1) * M.gap;
  const pillY = stackY + stackH + pillGap;

  $("ns-island").style.cssText =
    `top:${full ? 50 : 10}px;width:${full ? 178 : 112}px;height:${full ? 42 : 14}px`;
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
    `top:${dateY}px;font-size:${M.date}px;color:${rgba(V.ink, 0.86)}`;
  $("ns-time").style.cssText =
    `top:${timeY}px;font-size:${M.clock}px`;

  if (horizontalHeader) {
    const clockWidth = Math.min(260, width * 0.3);
    $("ns-date").style.left = side + "px";
    $("ns-date").style.right = "auto";
    $("ns-date").style.textAlign = "left";
    $("ns-time").style.left = "auto";
    $("ns-time").style.right = side + "px";
    $("ns-time").style.textAlign = "right";
    fit($("ns-date-text"), width - clockWidth - 28, minimum);
    fit($("ns-time-text"), clockWidth, minimum);
  } else {
    fit($("ns-date-text"), width, minimum);
    fit($("ns-time-text"), width, minimum);
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

  const cardBase = mix(V.ground, V.blue, 0.22);
  const face = (depth) => mix(cardBase, V.ink, 0.17 - depth * 0.012);
  const summary = $("ns-summary");
  const summaryRadius = full ? 34 : 26;

  summary.style.cssText =
    `left:${side}px;top:${barY}px;width:${width}px;height:${M.bar}px;` +
    `background:${mix(cardBase, V.ink, 0.16)};` +
    `border-color:${rgba(V.ink, 0.30)};border-radius:${summaryRadius}px`;

  // One complete perimeter is the entire finish reaction.
  // It lives outside the summary so its expansion cannot be clipped.
  const impact = make("div", "ns-impact", $("ns-clip"));
  impact.setAttribute("aria-hidden", "true");
  impact.style.cssText =
    `left:${side}px;top:${barY}px;width:${width}px;height:${M.bar}px;` +
    `border-radius:${summaryRadius}px`;

  const summaryIcon = $("ns-summary-icon");
  const summaryIconPx = full ? 62 : 42;
  summaryIcon.innerHTML = bag;
  summaryIcon.style.cssText =
    `left:24px;top:${full ? 22 : 14}px;` +
    `width:${summaryIconPx}px;height:${summaryIconPx}px`;

  const copyX = full ? 104 : 82;
  $("ns-summary-copy").style.cssText =
    `left:${copyX}px;right:${full ? 40 : 32}px;` +
    `top:${full ? 26 : 14}px;height:${M.label * 1.2}px`;
  $("ns-summary-label").textContent = V.summaryLabel;
  $("ns-summary-label").style.fontSize = M.label + "px";
  $("ns-count-label").textContent = V.countLabel;
  $("ns-count-line").style.cssText =
    `font-size:${M.count}px;color:${rgba(V.ink, 0.90)}`;
  fit($("ns-count-label"), 190, minimum);

  let money;
  try {
    money = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: String(V.currency).trim().toUpperCase(),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  } catch (_) {
    throw new Error("notification-stack: currency must be a valid three-letter currency code.");
  }

  const frames = [
    0, 9, 18, 27, 36, 40, 44, 48, 52, 56, 60,
    64, 68, 72, 76, 80, 84, 88, 92, 96, 100
  ];
  const orders = frames.map((frame, i) => ({
    frame,
    cents: Math.round(Math.max(0, finite(V[`order${i + 1}Amount`], 0)) * 100),
    items: Math.max(1, Math.round(finite(V[`order${i + 1}Items`], 1)))
  }));

  let cents = Math.round(Math.max(0, finite(V.startingTotal, 0)) * 100);
  const initialCount = Math.max(1, Math.round(finite(V.startingCount, 1)));
  const states = orders.map((order, i) => {
    if (i > 0) cents += order.cents;
    return {
      total: money.format(cents / 100),
      count: String(initialCount + i)
    };
  });

  const tl = gsap.timeline({ paused: true });
  const build = gsap.timeline();
  const designFrame = (frame) => frame / 110 * T.design;
  const arrivalDuration = (i) => i === orders.length - 1
    ? T.design - designFrame(frames[i])
    : Math.min(
        designFrame(8),
        designFrame(frames[i + 1] - frames[i]) * 0.88
      );

  function makeNumber(host, values, px, availableWidth, shrinkToContent) {
    const raw = values.map((value) => Array.from(value));
    const columnCount = Math.max(...raw.map((chars) => chars.length));
    const rows = raw.map((chars) =>
      Array(columnCount - chars.length).fill("\u00a0").concat(chars)
    );
    const probe = make("span", "ns-number-measure", host);
    probe.setAttribute("aria-hidden", "true");

    function measureAt(size) {
      host.style.fontSize = size + "px";
      const cache = new Map();
      const measure = (char) => {
        if (!cache.has(char)) {
          probe.textContent = char;
          cache.set(char, probe.getBoundingClientRect().width);
        }
        return cache.get(char);
      };
      const digitWidth = Math.max(
        ...Array.from("0123456789").map(measure)
      );
      const gutter = Math.max(1, size * 0.008);
      const widths = Array.from({ length: columnCount }, (_, column) => {
        const glyphWidth = Math.max(...rows.map((row) => {
          const char = row[column];
          return /^[0-9]$/.test(char) ? digitWidth : measure(char);
        }));
        return Math.ceil(glyphWidth + gutter * 2);
      });
      return {
        widths,
        width: widths.reduce((sum, item) => sum + item, 0)
      };
    }

    // Reserve the complete glyph widths before building the masks.
    // Every state shares these positions, widths and one fitted font size.
    let size = px;
    let metrics = measureAt(size);
    for (let pass = 0; pass < 4 && metrics.width > availableWidth; pass++) {
      const next = Math.max(
        minimum,
        Math.floor(size * (availableWidth - columnCount) / metrics.width)
      );
      if (next >= size) break;
      size = next;
      metrics = measureAt(size);
    }
    probe.remove();

    const rowHeight = Math.ceil(size * 1.2);
    host.style.height = rowHeight + "px";
    host.style.width =
      (shrinkToContent ? metrics.width : availableWidth) + "px";

    const tracks = [];
    let left = 0;

    for (let column = 0; column < columnCount; column++) {
      const mask = make("span", "ns-digit-column", host);
      mask.setAttribute("aria-hidden", "true");
      mask.style.cssText =
        `left:${left}px;width:${metrics.widths[column]}px;height:${rowHeight}px`;
      left += metrics.widths[column];

      const track = make("span", "ns-digit-track", mask);
      const sequence = [rows[0][column]];
      const changes = [];
      let previous = rows[0][column];

      // Unchanged columns never move. A changed column advances exactly
      // one row, regardless of the numerical distance between its digits.
      for (let i = 1; i < rows.length; i++) {
        const next = rows[i][column];
        if (next === previous) continue;
        sequence.push(next);
        changes.push({
          state: i,
          from: sequence.length - 2,
          to: sequence.length - 1
        });
        previous = next;
      }

      const cells = sequence.map((char, index) => {
        const cell = make("span", "ns-digit-cell", track, char);
        cell.style.cssText =
          `top:${index * rowHeight}px;height:${rowHeight}px;` +
          `visibility:${index === 0 ? "visible" : "hidden"}`;
        return cell;
      });

      // Hide rows that are wholly outside their mask. Drive this from
      // the transform modifier so it also runs during event-suppressed seeks.
      const syncVisibility = (value) => {
        const y = parseFloat(value);
        cells.forEach((cell, index) => {
          const top = index * rowHeight + y;
          cell.style.visibility =
            top < rowHeight - 0.000001 && top + rowHeight > 0.000001
              ? "visible"
              : "hidden";
        });
        return value;
      };

      track.style.height = sequence.length * rowHeight + "px";
      gsap.set(track, {
        y: 0,
        modifiers: { y: syncVisibility }
      });

      changes.forEach((change) => {
        const i = change.state;
        const duration = i === orders.length - 1
          ? arrivalDuration(i)
          : Math.min(arrivalDuration(i) * 0.82, designFrame(5));

        build.fromTo(track,
          { y: -change.from * rowHeight },
          {
            y: -change.to * rowHeight,
            duration,
            ease: "power2.inOut",
            immediateRender: false,
            modifiers: { y: syncVisibility }
          },
          designFrame(frames[i])
        );
      });

      tracks.push({
        element: track,
        finalY: -(sequence.length - 1) * rowHeight,
        syncVisibility
      });
    }

    return tracks;
  }

  const countTracks = makeNumber(
    $("ns-count"),
    states.map((state) => state.count),
    M.count,
    Math.max(112, width * 0.16),
    true
  );

  fit(
    $("ns-summary-label"),
    Math.max(
      minimum * 2,
      width - copyX - (full ? 40 : 32) -
        $("ns-count-line").offsetWidth - 24
    ),
    minimum
  );

  // The total has explicit inner padding on both sides in every output.
  // Its masks are fitted inside that region, never against the card edge.
  const totalLeft = full ? 36 : 28;
  const totalRight = full ? 48 : 36;
  const totalTracks = makeNumber(
    $("ns-total"),
    states.map((state) => state.total),
    M.total,
    width - totalLeft - totalRight,
    false
  );
  $("ns-total").style.left = totalLeft + "px";
  $("ns-total").style.top = M.totalY + "px";

  $("ns-stack-window").style.cssText =
    `left:${side}px;top:${stackY}px;width:${width}px;height:${stackH}px`;
  $("ns-stack-shadow").style.cssText =
    `left:${side + 18}px;top:${stackY + 10}px;` +
    `width:${width - 36}px;height:${M.card - 10}px`;

  function makeCard(parent, order, depth) {
    const shell = make("div", "ns-drop", parent);
    shell.style.top = depth * step + "px";
    shell.style.height = M.card + "px";
    shell.style.zIndex = String(visibleSlots + 2 - depth);

    const surface = make("div", "ns-card", shell);
    surface.style.cssText =
      `background:${face(depth)};border-color:${rgba(V.ink, 0.28 - depth * 0.025)};` +
      `border-radius:${full ? 30 : 23}px`;

    const icon = make("div", "ns-app-icon", surface);
    icon.innerHTML = bag;
    icon.style.cssText =
      `left:${full ? 24 : 18}px;top:${(M.card - M.icon) / 2}px;` +
      `width:${M.icon}px;height:${M.icon}px`;

    const textX = full ? 132 : 96;
    const right = full ? 26 : 20;

    const stamp = make("span", "ns-stamp", surface, V.timestamp);
    stamp.style.cssText =
      `right:${right}px;top:${M.titleY + 2}px;font-size:${M.stamp}px;` +
      `color:${rgba(V.ink, 0.80)}`;
    fit(stamp, width * 0.20, minimum);

    const title = make("span", "ns-title", surface, V.appName);
    title.style.cssText =
      `left:${textX}px;top:${M.titleY}px;font-size:${M.title}px`;
    fit(title, width - textX - stamp.offsetWidth - right - 24, minimum);

    const bodyText = String(V.cardFormat)
      .split("[AMOUNT]").join(money.format(order.cents / 100))
      .split("[N]").join(String(order.items));
    const body = make("span", "ns-body", surface, bodyText);
    body.style.cssText =
      `left:${textX}px;top:${M.bodyY}px;font-size:${M.body}px;` +
      `color:${rgba(V.ink, 0.96)}`;
    fit(body, width - textX - right, minimum);

    return { shell, surface };
  }

  const poses = orders.map((order, i) => {
    const group = make("div", "ns-state", $("ns-cards"));
    const cards = [];
    const count = Math.min(visibleSlots + 1, i + 1);

    for (let depth = 0; depth < count; depth++) {
      const card = makeCard(group, orders[i - depth], depth);
      if (depth === visibleSlots) {
        card.shell.style.display = "none";
      }
      cards.push(card);
    }
    return { group, cards };
  });

  gsap.set(poses[0].group, { visibility: "visible" });

  for (let i = 1; i < orders.length; i++) {
    const at = designFrame(frames[i]);
    const duration = arrivalDuration(i);
    const pose = poses[i];
    const incoming = pose.cards[0].shell;
    const trailing = pose.cards[visibleSlots];
    const dropDuration = duration * 0.72;
    const settleDuration = duration - dropDuration;
    const overshoot = Math.min(full ? 6 : 4, M.gap * 0.4);

    build.set(poses[i - 1].group, { visibility: "hidden" }, at);
    build.set(pose.group, { visibility: "visible" }, at);

    if (trailing) {
      build.set(trailing.shell, { display: "block" }, at);
    }

    // Existing cards begin at their previous positions and push together.
    // Their movement finishes before the arriving card completes its settle.
    pose.cards.slice(1).forEach((card) => {
      build.fromTo(card.shell,
        { y: -step, scaleX: 1, scaleY: 1 },
        {
          y: 0,
          duration: dropDuration,
          ease: "power2.out",
          immediateRender: false
        },
        at
      );
    });

    // The new card has its own drop and a bounded, explicit rebound.
    // The overshoot is smaller than the gap, so it cannot hit the next card.
    build.fromTo(incoming,
      { y: -step, scaleX: 0.975, scaleY: 0.975 },
      {
        y: overshoot,
        scaleX: 1,
        scaleY: 1,
        duration: dropDuration,
        ease: "power2.out",
        immediateRender: false
      },
      at
    );
    build.fromTo(incoming,
      { y: overshoot, scaleX: 1, scaleY: 1 },
      {
        y: 0,
        scaleX: 1,
        scaleY: 1,
        duration: settleDuration,
        ease: "power2.inOut",
        immediateRender: false
      },
      at + dropDuration
    );

    if (trailing) {
      build.set(trailing.shell, { display: "none" }, at + dropDuration);
    }

    const occupied = Math.min(visibleSlots, i + 1);
    build.to($("ns-stack-shadow"), {
      height: occupied * M.card + (occupied - 1) * M.gap - 10,
      duration: dropDuration,
      ease: "power2.out"
    }, at);

    build.fromTo(summaryIcon,
      { scaleX: 1.08, scaleY: 1.08 },
      {
        scaleX: 1,
        scaleY: 1,
        duration,
        ease: "power2.out",
        immediateRender: false
      },
      at
    );
  }

  const pill = $("ns-pill");
  $("ns-pill-text").textContent = V.pillText;
  pill.style.cssText =
    `top:${pillY}px;height:${M.pill}px;font-size:${full ? 42 : 34}px;` +
    `color:${rgba(V.ink, 0.96)};background:${mix(cardBase, V.ink, 0.14)};` +
    `border-color:${rgba(V.ink, 0.28)}`;
  fit($("ns-pill-text"), width - 100, minimum);
  gsap.set(pill, { xPercent: -50 });

  const finalArrival = designFrame(frames[frames.length - 1]);
  build.set(pill, { visibility: "visible" }, finalArrival);
  build.fromTo(pill,
    { scaleX: 0.78, scaleY: 0.78, y: 12 },
    {
      scaleX: 1,
      scaleY: 1,
      y: 0,
      duration: T.design - finalArrival,
      ease: "power3.out",
      immediateRender: false
    },
    finalArrival
  );

  build.timeScale(1 / T.scale);
  tl.add(build, 0);

  const finalPose = poses[poses.length - 1];

  // Explicit final transforms keep every digit and card exact at the key.
  [...countTracks, ...totalTracks].forEach((track) => {
    tl.set(track.element, {
      y: track.finalY,
      modifiers: { y: track.syncVisibility }
    }, T.key);
  });
  tl.set(
    poses.slice(0, -1).map((pose) => pose.group),
    { visibility: "hidden" },
    T.key
  );
  tl.set(finalPose.group, { visibility: "visible" }, T.key);
  tl.set(finalPose.cards.map((card) => card.shell), {
    y: 0, scaleX: 1, scaleY: 1
  }, T.key);
  if (finalPose.cards[visibleSlots]) {
    tl.set(finalPose.cards[visibleSlots].shell, { display: "none" }, T.key);
  }
  tl.set(summaryIcon, { scaleX: 1, scaleY: 1 }, T.key);
  tl.set(pill, {
    visibility: "visible", scaleX: 1, scaleY: 1, y: 0
  }, T.key);

  const pulseDuration = Math.min(0.44, Math.max(0, T.hold));
  if (pulseDuration > 0) {
    tl.set(impact, { visibility: "visible" }, T.key);
    tl.fromTo(impact,
      { scaleX: 1, scaleY: 1, opacity: 0.95 },
      {
        scaleX: full ? 1.035 : 1.025,
        scaleY: 1.075,
        opacity: 0,
        duration: pulseDuration,
        ease: "power2.out",
        immediateRender: false
      },
      T.key
    );
    tl.set(impact, { visibility: "hidden" }, T.key + pulseDuration);
  }

  // Only the wallpaper moves through the hold. Readable content stays fixed.
  tl.fromTo($("ns-light"),
    { backgroundPosition: "0% 100%" },
    {
      backgroundPosition: "100% 0%",
      duration: T.duration,
      ease: "sine.inOut"
    },
    0
  );

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

  const open = "inset(0% 0% 0% 0% round 0px)";
  const closed = "inset(50% 0% 50% 0% round 0px)";

  if (variant === "overlay") {
    tl.fromTo(stageEl,
      { clipPath: closed },
      { clipPath: open, duration: 0.24, ease: "power3.out" },
      0
    );
  }
  if (T.exit > 0) {
    tl.fromTo(stageEl,
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

  window.__timelines["block"] = tl;
});