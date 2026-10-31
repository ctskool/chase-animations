// Head to head. Beats are written in design seconds, then scaled so the payoff lands exactly on T.key.
CA.ready(() => {
  const { vars: V, stage: S, safe, time: T, variant, rgba, make, parseStat, formatStat, fit } = CA;
  const $ = (id) => document.getElementById(id);
  const W = S.w;
  const H = S.h;
  const cx = W / 2;
  const compact = variant !== "full";
  const stageEl = $("stage");
  stageEl.style.setProperty("--a", V.colorA);
  stageEl.style.setProperty("--b", V.colorB);

  // Layout, worked out once. Compact is the top half and the overlay card.
  const M = compact
    ? { name: 104, ruleGap: 8, rule: 6, subGap: 10, sub: 30, rowsGap: 22, label: 25, labelGap: 5, val: 52, valGap: 6, bar: 14,
        pLabel: 27, pVal: 76, pBar: 22, pPad: 14, chip: 38, pChip: 40, vs: 92, center: 26, rowsEnd: H - safe.bottom }
    : { name: 172, ruleGap: 16, rule: 8, subGap: 24, sub: 42, rowsGap: 58, label: 37, labelGap: 12, val: 92, valGap: 12, bar: 26,
        pLabel: 41, pVal: 122, pBar: 40, pPad: 30, chip: 62, pChip: 58, vs: 132, center: 42, rowsEnd: H - safe.bottom };
  const side = safe.side;
  const reach = cx - side;
  const nameY = safe.top;

  // Ground: two halves meeting on a slanted seam, coloured only by light from the outer edges.
  const lean = compact ? 22 : 44;
  $("half-a").style.cssText = `background:radial-gradient(90% 75% at 0% 42%, ${rgba(V.colorA, 0.15)}, transparent 72%), ${V.ground};
    clip-path:polygon(0 0, calc(50% + ${lean}px) 0, calc(50% - ${lean}px) 100%, 0 100%)`;
  $("half-b").style.cssText = `background:radial-gradient(90% 75% at 100% 42%, ${rgba(V.colorB, 0.13)}, transparent 72%), ${V.ground};
    clip-path:polygon(calc(50% + ${lean}px) 0, 100% 0, 100% 100%, calc(50% - ${lean}px) 100%)`;
  $("flash-a").style.background = `radial-gradient(110% 80% at 0% 62%, ${rgba(V.colorA, 0.42)}, transparent 75%)`;
  $("flash-b").style.background = `radial-gradient(110% 80% at 100% 62%, ${rgba(V.colorB, 0.42)}, transparent 75%)`;
  $("grain").style.backgroundImage = CA.grainUrl(220, 0.5, 11);
  gsap.set("#seam", { height: Math.hypot(H, lean * 2) + 40, top: -20, rotation: (Math.atan2(lean * 2, H) * 180) / Math.PI });

  // Names.
  const nameMax = reach - M.vs / 2 - 14;
  const nameA = $("name-a");
  const nameB = $("name-b");
  nameA.textContent = V.nameA;
  nameB.textContent = V.nameB;
  [nameA, nameB].forEach((el) => {
    el.style.fontSize = M.name + "px";
    el.style.color = V.ink;
    el.style.top = nameY + "px";
  });
  nameA.style.left = side + "px";
  nameB.style.right = side + "px";
  nameA.style.transformOrigin = "left center";
  nameB.style.transformOrigin = "right center";
  const fittedA = fit(nameA, nameMax, 56);
  const fittedB = fit(nameB, nameMax, 56);
  const fitted = Math.min(fittedA, fittedB);
  nameA.style.fontSize = nameB.style.fontSize = fitted + "px";

  const ruleY = nameY + M.name + M.ruleGap;
  const ruleStyle = (el, color, align) => {
    el.style.cssText = `top:${ruleY}px;height:${M.rule}px;width:${reach}px;background:${color};${align}:${side}px;`;
  };
  ruleStyle($("rule-a"), V.colorA, "left");
  ruleStyle($("rule-b"), V.colorB, "right");
  gsap.set("#rule-a", { transformOrigin: "right center" });
  gsap.set("#rule-b", { transformOrigin: "left center" });

  const subEl = $("subtitle");
  subEl.textContent = V.subtitle;
  subEl.style.top = ruleY + M.rule + M.subGap + "px";
  subEl.style.fontSize = M.sub + "px";
  subEl.style.color = V.muted;

  const vs = $("vs");
  vs.style.cssText = `left:${cx - M.vs / 2}px;top:${nameY + M.name / 2 - M.vs / 2}px;width:${M.vs}px;height:${M.vs}px`;
  $("vs-ring").style.background = `conic-gradient(from 180deg, ${V.colorA} 0 50%, ${V.colorB} 50% 100%)`;
  const coreInset = Math.round(M.vs * 0.075);
  $("vs-core").style.cssText = `inset:${coreInset}px;font-size:${Math.round(M.vs * 0.36)}px`;

  // Rows. A row with an empty label is left out, and the payoff is always the last row kept.
  const raw = [1, 2, 3, 4]
    .map((i) => ({ label: V[`row${i}Label`], a: V[`row${i}A`], b: V[`row${i}B`], winner: V[`row${i}Winner`] }))
    .filter((r) => r.label && r.label.trim());
  const rowsTop = ruleY + M.rule + M.subGap + M.sub + M.rowsGap;
  const normalH = M.label + M.labelGap + M.val + M.valGap + M.bar;
  const payoffH = M.pPad + M.pLabel + M.labelGap + M.pVal + M.valGap + M.pBar + M.pPad;
  const count = raw.length;
  const free = M.rowsEnd - rowsTop - normalH * (count - 1) - payoffH;
  const gap = Math.max(10, Math.min(free / Math.max(1, count - 1), compact ? 34 : 96));

  const check = `<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4.6 4.6L19 7.4"/></svg>`;
  const yes = /^(yes|y|true|✓)$/i;

  // A number's bar length is that number against the bigger one. Text rows give the winner a full bar.
  function lengths(r) {
    const a = parseStat(r.a);
    const b = parseStat(r.b);
    if (a && b) {
      const top = Math.max(Math.abs(a.value), Math.abs(b.value)) || 1;
      return { a: Math.abs(a.value) / top, b: Math.abs(b.value) / top, statA: a, statB: b };
    }
    if (r.winner === "tie") return { a: 1, b: 1, statA: a, statB: b };
    if (yes.test(r.a) || yes.test(r.b) || (!a && !b)) {
      return { a: r.winner === "a" ? 1 : 0, b: r.winner === "b" ? 1 : 0, statA: a, statB: b };
    }
    return { a: r.winner === "a" ? 1 : 0.5, b: r.winner === "b" ? 1 : 0.5, statA: a, statB: b };
  }

  function buildSide(rowEl, sideKey, r, len, stat, isPayoff, barY, valY) {
    const color = sideKey === "a" ? V.colorA : V.colorB;
    const barH = isPayoff ? M.pBar : M.bar;
    const valPx = isPayoff ? M.pVal : M.val;
    const chipPx = isPayoff ? M.pChip : M.chip;
    const anchor = sideKey === "a" ? "right" : "left";
    const inset = cx + M.center * (isPayoff ? 1.15 : 1);
    const track = make("div", "track", rowEl);
    track.style.cssText = `top:${barY}px;height:${barH}px;width:${reach}px;${anchor}:${cx}px`;
    const full = reach * len;
    const bar = make("div", `bar ${sideKey}`, rowEl);
    bar.style.cssText = `top:${barY}px;height:${barH}px;width:${full}px;${anchor}:${cx}px;background:${color}`;
    const sheen = isPayoff ? make("div", "sheen", bar) : null;
    if (sheen) gsap.set(sheen, { xPercent: -120 });
    const tip = make("div", "tip", rowEl);
    tip.style.cssText = `top:${barY}px;height:${barH}px;width:${isPayoff ? 12 : 8}px;${anchor}:${cx}px`;
    const val = make("div", `val ${sideKey}`, rowEl, r[sideKey]);
    val.style.cssText = `top:${valY}px;font-size:${valPx}px;color:${V.ink};${anchor}:${inset}px`;
    const room = W - inset - side - (isPayoff ? 34 : chipPx + 14);
    fit(val, room, valPx * 0.5);
    const chip = make("div", "chip", rowEl);
    chip.innerHTML = check;
    // The payoff's chip rides the label line at the outer edge, so the big number keeps all its width.
    const chipTop = isPayoff ? M.pPad - 3 : valY + (valPx - chipPx) / 2;
    const chipEdge = isPayoff ? W - side - chipPx : inset + val.getBoundingClientRect().width + 14;
    chip.style.cssText = `top:${chipTop}px;width:${chipPx}px;height:${chipPx}px;border-radius:${chipPx * 0.28}px;background:${color};${anchor}:${chipEdge}px`;
    return { bar, track, tip, val, chip, sheen, full, stat, sign: sideKey === "a" ? -1 : 1 };
  }

  let y = rowsTop;
  const rows = raw.map((r, i) => {
    const isPayoff = i === count - 1;
    const rowEl = make("div", "row", $("rows"));
    rowEl.style.top = y + "px";
    const pad = isPayoff ? M.pPad : 0;
    const labelPx = isPayoff ? M.pLabel : M.label;
    const valPx = isPayoff ? M.pVal : M.val;
    const h = isPayoff ? payoffH : normalH;
    rowEl.style.height = h + "px";

    let plate = null;
    if (isPayoff) {
      const color = r.winner === "b" ? V.colorB : V.colorA;
      plate = make("div", "plate", rowEl);
      plate.style.cssText = `top:-4px;left:${side - 22}px;right:${side - 22}px;height:${h + 8}px;border:3px solid ${color};
        border-radius:${compact ? 16 : 22}px;background:${rgba(color, 0.08)}`;
    }

    const mask = make("div", "label-mask", rowEl);
    mask.style.top = pad + "px";
    mask.style.height = labelPx * 1.25 + "px";
    const label = make("span", "label", mask, r.label);
    label.style.fontSize = labelPx + "px";
    label.style.color = V.muted;
    fit(label, W - side * 2 - 24, 16);

    const valY = pad + labelPx + M.labelGap;
    const barY = valY + valPx + M.valGap;
    const len = lengths(r);
    return {
      r,
      isPayoff,
      plate,
      label,
      a: buildSide(rowEl, "a", r, len.a, len.statA, isPayoff, barY, valY),
      b: buildSide(rowEl, "b", r, len.b, len.statB, isPayoff, barY, valY),
      top: ((y += h + gap), y - h - gap),
    };
  });

  // Motion.
  const tl = gsap.timeline({ paused: true });
  const build = gsap.timeline();
  const payoffRun = 0.85;
  const firstRow = 0.55;
  const lag = 0.05; // bars start this long after their label, so the payoff is timed to land on T.design
  const step = count > 1 ? (T.design - payoffRun - lag - firstRow) / (count - 1) : 0;

  // Frame one is already on screen, caught mid slam.
  build.fromTo(nameA, { x: -46, scale: 1.08 }, { x: 0, scale: 1, duration: 0.42, ease: "back.out(1.9)" }, 0);
  build.fromTo(nameB, { x: 46, scale: 1.08 }, { x: 0, scale: 1, duration: 0.42, ease: "back.out(1.9)" }, 0);
  build.fromTo(["#rule-a", "#rule-b"], { scaleX: 0 }, { scaleX: 1, duration: 0.4, ease: "power3.out" }, 0.06);
  build.fromTo(vs, { scale: 0.6, rotation: -24 }, { scale: 1, rotation: 0, duration: 0.36, ease: "back.out(2.4)" }, 0.2);
  build.fromTo(subEl, { yPercent: 70, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.22, ease: "power2.out" }, 0.26);

  function growSide(s, at, dur, ease) {
    if (s.full <= 1) return;
    build.fromTo(s.bar, { scaleX: 0 }, { scaleX: 1, duration: dur, ease }, at);
    build.fromTo(s.tip, { x: 0 }, { x: s.sign * (s.full - 4), duration: dur, ease }, at);
    build.set(s.tip, { opacity: 0.9 }, at);
    build.to(s.tip, { opacity: 0, duration: dur * 0.34, ease: "none" }, at + dur * 0.5);
  }

  function countSide(s, at, dur) {
    if (!s.stat) return;
    const proxy = { v: 0 };
    build.set(s.val, { opacity: 1 }, at);
    build.fromTo(
      proxy,
      { v: 0 },
      {
        v: s.stat.value,
        duration: dur,
        ease: "power3.out",
        onUpdate() {
          s.val.textContent = formatStat(s.stat, proxy.v);
        },
      },
      at,
    );
  }

  rows.forEach((row, i) => {
    const at = row.isPayoff ? T.design - payoffRun - lag : firstRow + i * step;
    const dur = row.isPayoff ? payoffRun : 0.42;
    const barEase = row.isPayoff ? "back.out(1.25)" : "back.out(1.5)";
    gsap.set([row.a.val, row.b.val], { opacity: 0 });
    gsap.set([row.a.chip, row.b.chip], { scale: 0 });
    build.fromTo(row.label, { yPercent: 115 }, { yPercent: 0, duration: 0.2, ease: "power3.out" }, at);
    growSide(row.a, at + lag, dur, barEase);
    growSide(row.b, at + lag, dur, barEase);
    countSide(row.a, at + lag, dur);
    countSide(row.b, at + lag, dur);
    if (!row.a.stat) build.set(row.a.val, { opacity: 1 }, at + 0.1);
    if (!row.b.stat) build.set(row.b.val, { opacity: 1 }, at + 0.1);

    if (!row.isPayoff && row.r.winner !== "tie") {
      const win = row.r.winner === "a" ? row.a : row.b;
      const lose = row.r.winner === "a" ? row.b : row.a;
      build.to(win.chip, { scale: 1, duration: 0.26, ease: "back.out(3)" }, at + dur * 0.92);
      build.to(lose.val, { color: V.muted, duration: 0.16, ease: "none" }, at + dur * 0.96);
    }
  });

  build.timeScale(1 / T.scale);
  tl.add(build, 0);
  build.duration(); // settles nested durations before anything reads them

  // The key moment and what follows it, in real seconds so a retimed block never rushes the payoff.
  const payoff = rows[rows.length - 1];
  const K = T.key;
  if (payoff.r.winner !== "tie") {
    const win = payoff.r.winner === "a" ? payoff.a : payoff.b;
    const lose = payoff.r.winner === "a" ? payoff.b : payoff.a;
    tl.fromTo(win.val, { scale: 1 }, { scale: 1.1, duration: 0.09, ease: "power2.out" }, K);
    tl.to(win.val, { scale: 1, duration: 0.34, ease: "back.out(2.6)" }, K + 0.09);
    tl.fromTo(win.chip, { scale: 0, rotation: -70 }, { scale: 1, rotation: 0, duration: 0.34, ease: "back.out(2.8)" }, K + 0.03);
    tl.to(lose.val, { color: V.muted, duration: 0.14, ease: "none" }, K + 0.03);
    const flash = payoff.r.winner === "a" ? "#flash-a" : "#flash-b";
    tl.set(flash, { opacity: 0 }, 0);
    tl.fromTo(flash, { opacity: 0 }, { opacity: 1, duration: 0.1, ease: "power2.out" }, K);
    tl.to(flash, { opacity: 0.26, duration: 0.6, ease: "power2.inOut" }, K + 0.1);
    const sweep = reachSheen(win);
    tl.fromTo(win.sheen, { xPercent: sweep.from }, { xPercent: sweep.to, duration: 0.55, ease: "power1.inOut", immediateRender: false }, K + 0.05);
    tl.fromTo(win.sheen, { xPercent: sweep.from }, { xPercent: sweep.to, duration: 0.8, ease: "power1.inOut", immediateRender: false }, K + Math.min(T.hold - 0.75, 1.0));
    tl.to(flash, { opacity: 0.4, duration: 0.7, ease: "sine.inOut", repeat: Math.max(0, Math.floor((T.hold - 0.7) / 0.7)), yoyo: true }, K + 0.7);
  }
  gsap.set(payoff.plate, { opacity: 1, scale: 0.9, transformOrigin: "50% 50%", autoAlpha: 0 });
  tl.set(payoff.plate, { autoAlpha: 1 }, K + 0.02);
  tl.fromTo(payoff.plate, { scale: 0.9 }, { scale: 1, duration: 0.42, ease: "back.out(2.2)", immediateRender: false }, K + 0.02);

  function reachSheen(s) {
    return s.sign < 0 ? { from: 400, to: -120 } : { from: -120, to: 400 };
  }

  // Never dead still mid-video: a slow push runs the whole way and the winner's light breathes until it leaves.
  tl.fromTo("#clip", { scale: 1 }, { scale: 1.022, duration: T.duration, ease: "none" }, 0);

  // The card opens from the seam and closes back onto it. Plain percentages, because GSAP can't tween calc().
  const l = (lean / W) * 100;
  const closed = `polygon(${50 + l}% -10%, ${50 + l}% -10%, ${50 - l}% 110%, ${50 - l}% 110%)`;
  const open = "polygon(-10% -10%, 110% -10%, 110% 110%, -10% 110%)";
  if (variant === "overlay") tl.fromTo(stageEl, { clipPath: closed }, { clipPath: open, duration: 0.24, ease: "power3.out" }, 0);
  if (T.exit > 0) tl.to(stageEl, { clipPath: closed, duration: T.exit - 1 / CA.fps, ease: "power3.in" }, T.key + T.hold);
  window.__timelines["block"] = tl;
});
