CA.ready(() => {
  const {
    vars: V, stage: S, safe, time: T, variant,
    make, fit, rgba, parseStat, formatStat,
  } = CA;

  const $ = (id) => document.getElementById(id);
  const compact = variant !== "full";
  const minText = compact ? 32 : 40;
  const W = S.w;
  const H = S.h;
  const cx = W / 2;
  const side = Math.max(safe.side, compact ? 40 : 56);
  const reach = cx - side;
  const top = Math.max(safe.top, compact ? 0 : 230) + (compact ? 8 : 10);
  const bottom = H - Math.max(safe.bottom, compact ? 0 : 300) -
    (compact ? 10 : 12);
  const availableHeight = Math.max(1, bottom - top);
  const stageEl = $("stage");

  stageEl.style.background = V.ground;
  stageEl.style.setProperty("--a", V.colorA);
  stageEl.style.setProperty("--b", V.colorB);

  const raw = [1, 2, 3, 4].map((i) => ({
    label: String(V[`row${i}Label`] || ""),
    a: String(V[`row${i}A`] || ""),
    b: String(V[`row${i}B`] || ""),
    winner: V[`row${i}Winner`],
  })).filter((r) => r.label.trim());

  const layouts = {
    full: {
      name: 224, vs: 116, sub: 44,
      rule: 8, ruleGap: 12, subGap: 12, headerGap: 28,
      label: 44, labelGap: 6, val: 120, valGap: 12,
      bar: 12, rowGap: 22, payoffGap: 30,
      pLabel: 44, pVal: 164, pTop: 30, pGap: 12,
      pValGap: 20, pBar: 36, pBottom: 30, pPad: 28,
      chip: 48, pChip: 60, center: 20, barGap: 14,
    },
    top: {
      name: 140, vs: 84, sub: 34,
      rule: 6, ruleGap: 8, subGap: 8, headerGap: 16,
      label: 34, labelGap: 2, val: 88, valGap: 6,
      bar: 8, rowGap: 8, payoffGap: 16,
      pLabel: 34, pVal: 120, pTop: 20, pGap: 8,
      pValGap: 14, pBar: 28, pBottom: 20, pPad: 24,
      chip: 36, pChip: 48, center: 18, barGap: 10,
    },
    overlay: {
      name: 146, vs: 88, sub: 36,
      rule: 6, ruleGap: 8, subGap: 8, headerGap: 18,
      label: 34, labelGap: 3, val: 90, valGap: 7,
      bar: 9, rowGap: 10, payoffGap: 18,
      pLabel: 34, pVal: 124, pTop: 22, pGap: 10,
      pValGap: 16, pBar: 30, pBottom: 22, pPad: 26,
      chip: 38, pChip: 50, center: 18, barGap: 10,
    },
  };
  const M = { ...(layouts[variant] || layouts.full) };
  const lean = compact ? 22 : 44;
  const normalCount = Math.max(0, raw.length - 1);

  $("half-a").style.cssText = `
    background:
      radial-gradient(95% 85% at 0% 42%, ${rgba(V.colorA, 0.13)}, transparent 74%),
      ${V.ground};
    clip-path:polygon(
      0 0, calc(50% + ${lean}px) 0,
      calc(50% - ${lean}px) 100%, 0 100%
    )`;
  $("half-b").style.cssText = `
    background:
      radial-gradient(95% 85% at 100% 42%, ${rgba(V.colorB, 0.045)}, transparent 74%),
      ${V.ground};
    clip-path:polygon(
      calc(50% + ${lean}px) 0, 100% 0,
      100% 100%, calc(50% - ${lean}px) 100%
    )`;
  $("flash-a").style.background =
    `radial-gradient(110% 90% at 0% 70%, ${rgba(V.colorA, 0.32)}, transparent 76%)`;
  $("flash-b").style.background =
    `radial-gradient(110% 90% at 100% 70%, ${rgba(V.colorB, 0.22)}, transparent 76%)`;
  $("grain").style.backgroundImage = CA.grainUrl(220, 0.5, 11);

  gsap.set("#seam", {
    height: Math.hypot(H, lean * 2) + 40,
    top: -20,
    rotation: Math.atan2(lean * 2, H) * 180 / Math.PI,
  });

  const nameA = $("name-a");
  const nameB = $("name-b");
  nameA.textContent = V.nameA;
  nameB.textContent = V.nameB;
  [nameA, nameB].forEach((el) => {
    el.style.fontSize = M.name + "px";
    el.style.color = V.ink;
  });
  nameA.style.left = side + "px";
  nameB.style.right = side + "px";
  nameA.style.transformOrigin = "left center";
  nameB.style.transformOrigin = "right center";

  // The two names and the badge are one line that fills the width,
  // so a short name never leaves a hole beside the badge.
  const nameGap = compact ? 10 : 14;
  const pairRoom = Math.max(1, (W - 2 * side - M.vs - 2 * nameGap) / 1.035);
  const pairWidth = nameA.offsetWidth + nameB.offsetWidth;
  let namePx = Math.max(
    minText,
    Math.floor(M.name * Math.min(1.3, pairRoom / Math.max(1, pairWidth))),
  );

  const subEl = $("subtitle");
  subEl.textContent = V.subtitle;
  subEl.style.fontSize = M.sub + "px";
  subEl.style.color = V.muted;
  M.sub = fit(subEl, W - 2 * side, minText);
  gsap.set(subEl, {
    autoAlpha: 0,
    clipPath: "inset(0 100% 0 0)",
  });

  function parsed(text) {
    if (!/[0-9]/.test(text)) return null;
    const stat = parseStat(text);
    return stat && Number.isFinite(stat.value) ? stat : null;
  }

  function lengths(r, a, b) {
    if (a && b) {
      const largest = Math.max(Math.abs(a.value), Math.abs(b.value)) || 1;
      return {
        a: Math.abs(a.value) / largest,
        b: Math.abs(b.value) / largest,
      };
    }
    if (r.winner === "tie") return { a: 1, b: 1 };
    if (!a && !b) {
      return {
        a: r.winner === "a" ? 1 : 0,
        b: r.winner === "b" ? 1 : 0,
      };
    }
    return {
      a: r.winner === "a" ? 1 : 0.5,
      b: r.winner === "b" ? 1 : 0.5,
    };
  }

  const rows = raw.map((r, i) => {
    const payoff = i === raw.length - 1;
    const el = make("div", payoff ? "row payoff" : "row", $("rows"));
    gsap.set(el, { autoAlpha: 0 });

    const labelMask = make("div", "label-mask", el);
    const label = make("span", "label", labelMask, r.label);
    const valueMask = make("div", "value-mask", el);
    const row = { r, payoff, el, labelMask, label, valueMask };
    const valueRoom = payoff
      ? reach - M.pPad - M.center
      : reach - M.center - M.chip - 14 - 12;
    const desiredFont = payoff ? M.pVal : M.val;

    ["a", "b"].forEach((key) => {
      const val = make("span", `val ${key}`, valueMask, r[key]);
      val.style.fontSize = desiredFont + "px";
      val.style.color = V.ink;
      val.style[key === "a" ? "right" : "left"] = cx + M.center + "px";
      row[key] = {
        val,
        text: r[key],
        stat: parsed(r[key]),
        color: key === "a" ? V.colorA : V.colorB,
        sign: key === "a" ? -1 : 1,
        anchor: key === "a" ? "right" : "left",
      };
      gsap.set(val, { autoAlpha: 0, yPercent: 112 });
    });

    // Fit the final strings together. Both columns keep one font size
    // and one baseline throughout the count and the final hold.
    row.font = Math.min(
      fit(row.a.val, valueRoom, minText),
      fit(row.b.val, valueRoom, minText),
    );
    row.ratios = lengths(r, row.a.stat, row.b.stat);
    gsap.set(label, { autoAlpha: 0, yPercent: 112 });
    return row;
  });

  const normalRows = rows.filter((row) => !row.payoff);
  const payoff = rows.find((row) => row.payoff);

  const labelHeight = () => Math.ceil(M.label * 1.18);
  const pLabelHeight = () => Math.ceil(M.pLabel * 1.18);
  const pLabelBand = () => Math.max(pLabelHeight(), M.pChip);
  const valueHeight = (row) => Math.ceil(row.font * 1.12);
  const headerBand = () => Math.max(namePx, M.vs);
  const headerHeight = () =>
    headerBand() + M.ruleGap + M.rule + M.subGap +
    Math.ceil(M.sub * 1.18) + M.headerGap;
  const rowHeight = (row) => row.payoff
    ? M.pTop + pLabelBand() + M.pGap + valueHeight(row) +
      M.pValGap + M.pBar + M.pBottom
    : labelHeight() + M.labelGap + valueHeight(row) + M.valGap + M.bar;
  const gapHeight = () =>
    Math.max(0, normalCount - 1) * M.rowGap +
    (normalCount ? M.payoffGap : 0);
  const usedHeight = () =>
    headerHeight() + rows.reduce((sum, row) => sum + rowHeight(row), 0) +
    gapHeight();
  const overflow = () => Math.max(0, usedHeight() - availableHeight);

  function trim(key, minimum, weight = 1) {
    if (weight <= 0 || overflow() <= 0) return;
    M[key] -= Math.min(
      Math.max(0, M[key] - minimum),
      overflow() / weight,
    );
  }

  function trimNormalFonts(minimum) {
    for (let pass = 0; pass < 4 && overflow() > 0; pass++) {
      const active = normalRows.filter((row) => row.font > minimum);
      if (!active.length) break;
      const reduction = overflow() / (active.length * 1.12) + 0.5;
      active.forEach((row) => {
        row.font -= Math.min(row.font - minimum, reduction);
      });
    }
  }

  function trimPayoffFont(minimum) {
    if (!payoff || overflow() <= 0) return;
    payoff.font -= Math.min(
      Math.max(0, payoff.font - minimum),
      overflow() / 1.12 + 0.5,
    );
  }

  // Each output starts with its own layout. Spend space before type,
  // and preserve a substantially larger payoff in compact outputs.
  namePx -= Math.min(
    overflow(),
    Math.max(0, namePx - Math.max(M.vs, compact ? 112 : 172)),
  );
  trim("headerGap", compact ? 8 : 18);
  trim("rowGap", compact ? 6 : 12, Math.max(0, normalCount - 1));
  trim("payoffGap", compact ? 10 : 18, normalCount ? 1 : 0);
  trim("pTop", compact ? 16 : 24, payoff ? 1 : 0);
  trim("pBottom", compact ? 16 : 24, payoff ? 1 : 0);
  trim("pGap", compact ? 6 : 10, payoff ? 1 : 0);
  trim("pValGap", compact ? 12 : 16, payoff ? 1 : 0);
  trim("valGap", compact ? 4 : 8, normalCount);
  trim("label", minText, normalCount * 1.18);
  trim("pLabel", minText, payoff ? 1.18 : 0);
  trim("sub", minText, 1.18);
  trimNormalFonts(compact ? 72 : 108);
  trimPayoffFont(compact ? 104 : 136);

  // Additional room for shorter stages, without shrinking readable text
  // below the pack's minimum.
  trim("ruleGap", compact ? 5 : 8);
  trim("subGap", compact ? 5 : 8);
  trimNormalFonts(compact ? 56 : 88);
  trimPayoffFont(compact ? 80 : 108);
  for (let pass = 0; pass < 3 && overflow() > 0; pass++) {
    trim("headerGap", 4);
    trim("rowGap", 4, Math.max(0, normalCount - 1));
    trim("payoffGap", 8, normalCount ? 1 : 0);
    trimNormalFonts(minText);
    trimPayoffFont(minText);
  }

  const band = headerBand();
  nameA.style.fontSize = nameB.style.fontSize = namePx + "px";
  nameA.style.top = nameB.style.top = top + (band - namePx) / 2 + "px";

  const ruleY = top + band + M.ruleGap;
  const widthA = nameA.offsetWidth;
  const widthB = nameB.offsetWidth;
  const pairLeft = Math.max(
    0,
    (W - widthA - widthB - M.vs - 2 * nameGap) / 2,
  );
  nameA.style.left = pairLeft + "px";
  nameB.style.right = pairLeft + "px";
  $("rule-a").style.cssText = `
    left:${pairLeft}px;top:${ruleY}px;
    width:${widthA}px;height:${M.rule}px;background:${V.colorA}`;
  $("rule-b").style.cssText = `
    right:${pairLeft}px;top:${ruleY}px;
    width:${widthB}px;height:${M.rule}px;background:${V.colorB}`;
  gsap.set("#rule-a", { scaleX: 0, transformOrigin: "right center" });
  gsap.set("#rule-b", { scaleX: 0, transformOrigin: "left center" });

  subEl.style.top = ruleY + M.rule + M.subGap + "px";
  subEl.style.fontSize = M.sub + "px";

  const vs = $("vs");
  vs.style.cssText = `
    left:${pairLeft + widthA + nameGap}px;top:${top + (band - M.vs) / 2}px;
    width:${M.vs}px;height:${M.vs}px`;
  $("vs-ring").style.background =
    `conic-gradient(from 180deg, ${V.colorA} 0 50%, ${V.colorB} 50% 100%)`;

  const vsCore = $("vs-core");
  vsCore.textContent = "";
  vsCore.style.cssText = `
    inset:${Math.round(M.vs * 0.075)}px;background:${V.ink}`;
  const vsWord = make("span", "vs-word", vsCore, V.vsLabel);
  vsWord.style.fontSize = Math.round(M.vs * 0.43) + "px";
  vsWord.style.color = V.ground;
  fit(vsWord, M.vs * 0.66, minText);

  const check = `
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"
      stroke="${V.ink}" stroke-width="3.6"
      stroke-linecap="round" stroke-linejoin="round">
      <path d="M5 13l4.6 4.6L19 7.4"/>
    </svg>`;

  const spare = Math.max(0, availableHeight - usedHeight());
  const extraGap = normalCount ? spare / normalCount : 0;
  let y = top + headerHeight() + (normalCount ? 0 : spare * 0.5);

  rows.forEach((row, i) => {
    const h = rowHeight(row);
    const p = row.payoff;
    const labelH = p ? pLabelHeight() : labelHeight();
    const labelTop = p ? M.pTop + (pLabelBand() - labelH) / 2 : 0;
    const valY = p
      ? M.pTop + pLabelBand() + M.pGap
      : labelH + M.labelGap;
    const barY = valY + valueHeight(row) + (p ? M.pValGap : M.valGap);
    const barH = p ? M.pBar : M.bar;
    const barGap = p ? 0 : M.barGap;
    const barAnchor = cx + barGap / 2;
    const barReach = Math.max(
      0,
      reach - (p ? M.pPad : 12) - barGap / 2,
    );

    row.el.style.top = y + "px";
    row.el.style.height = h + "px";
    row.el.style.transformOrigin = `${cx}px ${h / 2}px`;
    row.labelMask.style.top = labelTop + "px";
    row.labelMask.style.height = labelH + "px";
    row.label.style.fontSize = (p ? M.pLabel : M.label) + "px";
    row.label.style.color = V.muted;
    fit(
      row.label,
      W - 2 * side - (p ? 2 * M.pPad + 2 * M.pChip + 24 : 16),
      minText,
    );

    row.valueMask.style.top = valY + "px";
    row.valueMask.style.height = valueHeight(row) + "px";

    if (p) {
      const plateColor = row.r.winner === "tie"
        ? V.muted
        : row.r.winner === "a" ? V.colorA : V.colorB;
      row.plate = make("div", "plate", row.el);
      row.plate.style.cssText = `
        top:0;bottom:0;left:${side}px;right:${side}px;
        border:3px solid ${rgba(plateColor, 0.9)};
        border-radius:${compact ? 18 : 22}px;
        background:${rgba(plateColor, 0.055)}`;
      gsap.set(row.plate, {
        visibility: "hidden",
        clipPath: "inset(48% 0 48% 0)",
      });

      row.impacts = [];
      const winningKeys = row.r.winner === "tie"
        ? ["a", "b"]
        : [row.r.winner];

      winningKeys.forEach((key) => {
        const windowEl = make("div", "winner-window", row.el);
        windowEl.style.cssText = `
          top:4px;bottom:4px;
          left:${key === "a" ? side + 4 : cx}px;
          width:${Math.max(0, reach - 4)}px`;
        const sweep = make("div", "impact-sweep", windowEl);
        sweep.style.background = rgba(V.ink, 0.13);
        gsap.set(sweep, { skewX: -14 });
        row.impacts.push({ windowEl, sweep, key });
      });

      if (row.r.winner !== "tie") {
        const key = row.r.winner;
        row.accent = make("div", "result-accent", row.el);
        row.accent.style.cssText = `
          ${key === "a" ? "left" : "right"}:${side + 9}px;
          top:${M.pTop}px;bottom:${M.pBottom}px;
          width:${compact ? 6 : 8}px;
          background:${key === "a" ? V.colorA : V.colorB}`;
        gsap.set(row.accent, { autoAlpha: 0, scaleY: 0 });
      }
    }

    ["a", "b"].forEach((key) => {
      const s = row[key];
      s.val.style.fontSize = row.font + "px";

      // Measure only while the row and value are explicitly hidden.
      s.val.textContent = s.text;
      const finalWidth = s.val.getBoundingClientRect().width;

      // No final numeric string is left waiting behind the entrance.
      s.val.textContent = s.stat ? formatStat(s.stat, 0) : s.text;

      // The result bar is one two-colour bar split by each side's share.
      const both = row.ratios.a + row.ratios.b;
      const shareA = both ? row.ratios.a / both : 0.5;
      const splitX = cx - barReach + barReach * 2 * shareA;
      const anchorPx = !p ? barAnchor : key === "a" ? W - splitX : splitX;
      s.full = p
        ? barReach * 2 * (key === "a" ? shareA : 1 - shareA)
        : barReach * row.ratios[key];
      s.track = make("div", `track ${key}`, row.el);
      s.track.style.cssText = `
        top:${barY}px;height:${barH}px;width:${barReach}px;
        ${s.anchor}:${anchorPx}px;
        background:${p ? "transparent" : rgba(s.color, 0.13)}`;
      s.bar = make("div", `bar ${key}`, row.el);
      s.bar.style.cssText = `
        top:${barY}px;height:${barH}px;width:${s.full}px;
        ${s.anchor}:${anchorPx}px;background:${s.color}`;

      s.tipWidth = p ? 8 : 6;
      s.tip = make("div", "tip", row.el);
      s.tip.style.cssText = `
        top:${barY}px;height:${barH}px;width:${s.tipWidth}px;
        ${s.anchor}:${anchorPx}px;background:${V.ink}`;

      if (p) {
        s.sheen = make("div", "sheen", s.bar);
        s.sheen.style.background = rgba(V.ink, 0.27);
      }

      const chipPx = p ? M.pChip : M.chip;
      s.chip = make("div", "chip", row.el);
      s.chip.innerHTML = check;
      s.chip.style.cssText = `
        width:${chipPx}px;height:${chipPx}px;
        border-radius:${chipPx * (p ? 0.5 : 0.28)}px;
        background:${s.color}`;

      if (p) {
        s.chip.style.top = M.pTop + (pLabelBand() - chipPx) / 2 + "px";
        s.chip.style[key === "a" ? "left" : "right"] =
          side + M.pPad + "px";
      } else {
        s.chip.style.top = valY + (valueHeight(row) - chipPx) / 2 + "px";
        s.chip.style[s.anchor] = cx + M.center + finalWidth + 14 + "px";
      }

      gsap.set(s.track, { autoAlpha: 0 });
      gsap.set(s.bar, { scaleX: 0 });
      gsap.set(s.chip, { autoAlpha: 0, scaleX: 0, scaleY: 0 });
    });

    if (!p) {
      y += h + (i === normalCount - 1 ? M.payoffGap : M.rowGap) + extraGap;
    }
  });

  const tl = gsap.timeline({ paused: true });
  const build = gsap.timeline();

  build.fromTo(["#half-a", "#half-b"],
    { scaleX: 1.018, scaleY: 1.018 },
    {
      scaleX: 1, scaleY: 1,
      duration: 0.34, ease: "power3.out",
    }, 0);

  build.fromTo(nameA,
    { x: -14, y: 6, scaleX: 1.025, scaleY: 1.025 },
    {
      x: 0, y: 0, scaleX: 1, scaleY: 1,
      duration: 0.32, ease: "back.out(1.45)",
    }, 0);
  build.fromTo(nameB,
    { x: 14, y: 6, scaleX: 1.025, scaleY: 1.025 },
    {
      x: 0, y: 0, scaleX: 1, scaleY: 1,
      duration: 0.32, ease: "back.out(1.45)",
    }, 0);

  // The opening starts with a readable, oversized badge already in flight.
  build.fromTo(vs,
    { y: -12, scaleX: 1.14, scaleY: 1.14, rotation: -12 },
    {
      y: 0, scaleX: 1, scaleY: 1, rotation: 0,
      duration: 0.3, ease: "back.out(1.65)",
    }, 0);
  build.to(["#rule-a", "#rule-b"],
    { scaleX: 1, duration: 0.26, ease: "power4.out" }, 0.025);
  build.set(subEl, { autoAlpha: 1 }, 0.15);
  build.to(subEl,
    {
      clipPath: "inset(0 0% 0 0)",
      duration: 0.16, ease: "power4.out",
    }, 0.15);

  function revealLabel(row, at) {
    build.set(row.label, { autoAlpha: 1 }, at);
    build.to(row.label,
      { yPercent: 0, duration: 0.12, ease: "power4.out" }, at);
  }

  function revealAndCount(s, at, duration, ease) {
    build.set(s.val, { autoAlpha: 1 }, at);
    build.to(s.val,
      { yPercent: 0, duration: 0.13, ease: "power4.out" }, at);

    if (!s.stat) return;

    const goal = s.stat.value;
    build.fromTo(s.val,
      { textContent: 0 },
      {
        textContent: goal,
        duration,
        ease,
        immediateRender: false,
        modifiers: {
          textContent(value) {
            const n = Number(value);
            if (!Number.isFinite(n)) return formatStat(s.stat, 0);
            if (Math.abs(n - goal) < 0.0000001) return s.text;
            const low = Math.min(0, goal);
            const high = Math.max(0, goal);
            return formatStat(s.stat, Math.max(low, Math.min(high, n)));
          },
        },
      }, at);
  }

  function growSide(s, at, duration, isPayoff) {
    build.set(s.track, { autoAlpha: 1 }, at);
    if (s.full <= 0) return;

    const settle = isPayoff ? 0.12 : 0.1;
    const attack = Math.max(0.01, duration - settle);
    const overshoot = isPayoff ? 1.04 : 1.025;
    const tipEnd = s.sign * Math.max(0, s.full - s.tipWidth);

    build.to(s.bar,
      { scaleX: overshoot, duration: attack, ease: "power3.out" }, at);
    build.to(s.bar,
      { scaleX: 1, duration: settle, ease: "power2.out" }, at + attack);

    build.set(s.tip, { visibility: "visible" }, at);
    build.fromTo(s.tip,
      { x: 0 },
      {
        x: tipEnd * overshoot,
        duration: attack, ease: "power3.out", immediateRender: false,
      }, at);
    build.to(s.tip,
      { x: tipEnd, duration: settle, ease: "power2.out" }, at + attack);

    if (isPayoff) {
      build.set(s.tip, { visibility: "hidden" }, at + duration);
    } else {
      build.to(s.tip,
        { scaleY: 1.6, duration: 0.045, ease: "power3.out" }, at + duration);
      build.set(s.tip,
        { visibility: "hidden" }, at + duration + 0.1);
    }
  }

  function landWinner(row, land, popDuration) {
    if (row.r.winner === "tie") return;
    const win = row[row.r.winner];
    const lose = row[row.r.winner === "a" ? "b" : "a"];
    const popAt = land - popDuration;

    build.set(win.chip, { autoAlpha: 1 }, popAt);
    build.fromTo(win.chip,
      {
        scaleX: 0.24, scaleY: 0.24,
        rotation: row.payoff ? -28 : -12,
      },
      {
        scaleX: 1, scaleY: 1, rotation: 0,
        duration: popDuration,
        ease: "back.out(2.1)",
        immediateRender: false,
      }, popAt);

    // The number, bar and tick share one landing time.
    build.set(lose.val, { color: V.secondaryInk }, land);
  }

  const firstRow = 0.4;
  const finalStart = Math.max(firstRow, T.design - 0.76);
  const rowStep = normalCount
    ? (finalStart - firstRow) / normalCount
    : 0;

  normalRows.forEach((row, i) => {
    const at = firstRow + i * rowStep;
    const countAt = at + 0.04;
    const duration = 0.38;
    const land = countAt + duration;

    build.set(row.el, { autoAlpha: 1 }, at);
    build.fromTo(row.el,
      { y: compact ? 16 : 24, scaleX: 0.98, scaleY: 0.96 },
      {
        y: 0, scaleX: 1.012, scaleY: 1.012,
        duration: 0.12, ease: "expo.out", immediateRender: false,
      }, at);
    build.to(row.el,
      {
        scaleX: 1, scaleY: 1,
        duration: land - at - 0.12, ease: "power3.out",
      }, at + 0.12);

    revealLabel(row, at);
    [row.a, row.b].forEach((s) => {
      revealAndCount(s, countAt, duration, "power3.out");
      growSide(s, countAt, duration, false);
    });
    landWinner(row, land, 0.13);
  });

  const payoffPeak = 1.025;

  if (payoff) {
    const countAt = finalStart + 0.06;
    const countDuration = T.design - countAt;

    build.set(payoff.el, { autoAlpha: 1 }, finalStart);
    build.fromTo(payoff.el,
      { y: compact ? 20 : 30, scaleX: 0.95, scaleY: 0.9 },
      {
        y: 0, scaleX: 1, scaleY: 1,
        duration: 0.18, ease: "expo.out", immediateRender: false,
      }, finalStart);

    build.set(payoff.plate, { visibility: "visible" }, finalStart);
    build.to(payoff.plate,
      {
        clipPath: "inset(0% 0 0% 0)",
        duration: 0.17, ease: "expo.out",
      }, finalStart);
    revealLabel(payoff, finalStart + 0.02);

    [payoff.a, payoff.b].forEach((s) => {
      // The payoff has one reveal and one count, starting from zero.
      revealAndCount(s, countAt, countDuration, "power2.out");
      growSide(s, countAt, countDuration, true);
    });
    landWinner(payoff, T.design, 0.16);

    build.to(payoff.el,
      {
        scaleX: payoffPeak, scaleY: payoffPeak,
        duration: 0.075, ease: "power3.in",
      }, T.design - 0.075);

    if (payoff.accent) {
      build.set(payoff.accent, { autoAlpha: 1 }, T.design - 0.08);
      build.to(payoff.accent,
        { scaleY: 1, duration: 0.08, ease: "expo.out" }, T.design - 0.08);
    }

    const supportingBars = normalRows.flatMap((row) => [row.a.bar, row.b.bar]);
    if (supportingBars.length) {
      build.set(supportingBars, { opacity: 0.82 }, finalStart);
    }
  }

  build.timeScale(1 / T.scale);
  tl.add(build, 0);

  // Reactions use real seconds. After the landing settle, the words and
  // figures stay fixed while light and the bar sheen carry the hold.
  if (payoff && T.hold > 0) {
    const K = T.key;
    const tie = payoff.r.winner === "tie";
    const winningSides = tie
      ? [payoff.a, payoff.b]
      : [payoff[payoff.r.winner]];
    const flashes = tie
      ? [$("flash-a"), $("flash-b")]
      : [payoff.r.winner === "a" ? $("flash-a") : $("flash-b")];
    const settle = Math.min(0.22, T.hold * 0.35);
    const hit = Math.min(0.07, T.hold * 0.12);
    const plateSettle = Math.min(0.22, Math.max(0, T.hold - hit));
    const flashDuration = Math.min(0.3, T.hold * 0.45);
    const sweepDuration = Math.min(0.32, T.hold * 0.55);

    tl.fromTo(payoff.el,
      { scaleX: payoffPeak, scaleY: payoffPeak },
      {
        scaleX: 1, scaleY: 1,
        duration: settle, ease: "power3.out", immediateRender: false,
      }, K);

    tl.fromTo(payoff.plate,
      { scaleX: 1, scaleY: 1 },
      {
        scaleX: 1.012, scaleY: 1.035,
        duration: hit, ease: "power3.out", immediateRender: false,
      }, K);
    tl.to(payoff.plate,
      {
        scaleX: 1, scaleY: 1,
        duration: plateSettle, ease: "back.out(1.4)",
      }, K + hit);

    if (!tie) {
      const win = winningSides[0];
      tl.fromTo(win.chip,
        { scaleX: 1, scaleY: 1, rotation: 0 },
        {
          scaleX: 1.1, scaleY: 1.1, rotation: 6,
          duration: hit, ease: "power3.out", immediateRender: false,
        }, K);
      tl.to(win.chip,
        {
          scaleX: 1, scaleY: 1, rotation: 0,
          duration: plateSettle, ease: "back.out(1.7)",
        }, K + hit);
    }

    // An immediate light hit, then a low moving edge light.
    tl.set(flashes, { opacity: 0.95 }, K);
    tl.to(flashes,
      { opacity: 0.12, duration: flashDuration, ease: "power3.out" }, K);
    const remaining = T.hold - flashDuration;
    if (remaining > 0) {
      tl.to(flashes,
        { opacity: 0.23, duration: remaining, ease: "sine.inOut" },
        K + flashDuration);
    }
    tl.fromTo(flashes,
      { x: 0, y: 0 },
      {
        x: tie ? 0 : winningSides[0].sign * 18,
        y: -26,
        duration: T.hold, ease: "sine.inOut", immediateRender: false,
      }, K);

    payoff.impacts.forEach(({ windowEl, sweep, key }) => {
      tl.set(windowEl, { visibility: "visible" }, K);
      tl.fromTo(sweep,
        { xPercent: key === "a" ? 750 : -160 },
        {
          xPercent: key === "a" ? -160 : 750,
          duration: sweepDuration, ease: "power3.out",
          immediateRender: false,
        }, K);
      tl.set(windowEl, { visibility: "hidden" }, K + sweepDuration);
    });

    winningSides.forEach((s) => {
      if (s.full <= 0 || !s.sheen) return;
      tl.set(s.sheen, { visibility: "visible" }, K);
      tl.fromTo(s.sheen,
        { xPercent: s.sign < 0 ? 980 : -140 },
        {
          xPercent: s.sign < 0 ? -140 : 980,
          duration: T.hold, ease: "sine.inOut",
          immediateRender: false,
        }, K);
    });
  }

  const leanPercent = lean / W * 100;
  const closed = `polygon(
    ${50 + leanPercent}% -10%, ${50 + leanPercent}% -10%,
    ${50 - leanPercent}% 110%, ${50 - leanPercent}% 110%
  )`;
  const open = "polygon(-10% -10%, 110% -10%, 110% 110%, -10% 110%)";

  if (variant === "overlay") {
    tl.fromTo(stageEl,
      { clipPath: closed },
      {
        clipPath: open,
        duration: 0.18, ease: "power4.out",
      }, 0);
  }
  if (T.exit > 0) {
    tl.to(stageEl, {
      clipPath: closed,
      duration: Math.max(0, T.exit - 1 / CA.fps),
      ease: "power3.in",
    }, T.key + T.hold);
  }

  window.__timelines["block"] = tl;
});