CA.ready(() => {
  const { vars: V, stage: S, safe, time: T, variant, make, fit, rgba, parseStat, formatStat, grainUrl, seeded } = CA;
  const KIT = CA.claude;
  const $ = (id) => document.getElementById(id);
  const stageEl = $("stage");
  const compact = variant !== "full";
  const W = S.w;
  const H = S.h;
  const D = T.design;

  const layouts = {
    full: {
      side: 56, top: 230, bottom: 300, gap: 26,
      logo: 76, title: 62, project: 42, promptPx: 56, promptMax: 3, boxPad: 26, chevron: 44, border: 4,
      call: 60, result: 48, mark: 38, rowGap: 30,
      statusCell: 18, word: 50, count: 60, bandH: 178,
      slabH: 520, donePx: 236, tick: 132, statsPx: 66, statsGap: 30, slabInset: 56, palCell: 18,
    },
    top: {
      side: 60, top: 44, bottom: 36, gap: 16,
      logo: 54, title: 44, project: 34, promptPx: 42, promptMax: 2, boxPad: 16, chevron: 32, border: 3,
      call: 42, result: 34, mark: 28, rowGap: 14,
      statusCell: 13, word: 38, count: 44, bandH: 118,
      slabH: 356, donePx: 176, tick: 104, statsPx: 46, statsGap: 14, slabInset: 60, palCell: 12,
    },
    overlay: {
      side: 44, top: 40, bottom: 36, gap: 18,
      logo: 56, title: 46, project: 34, promptPx: 44, promptMax: 2, boxPad: 18, chevron: 34, border: 3,
      call: 44, result: 36, mark: 28, rowGap: 16,
      statusCell: 13, word: 38, count: 46, bandH: 118,
      slabH: 380, donePx: 180, tick: 108, statsPx: 48, statsGap: 16, slabInset: 44, palCell: 13,
    },
  };
  const M = layouts[variant] || layouts.full;
  const minText = compact ? 32 : 40;
  const left = M.side;
  const inner = W - M.side * 2;
  const top = M.top;
  const bottom = H - M.bottom;

  const tl = gsap.timeline({ paused: true });
  const build = gsap.timeline();

  // Ground
  stageEl.style.background = V.ground;
  $("ground").style.background = V.ground;
  $("glow").style.background = `radial-gradient(90% 46% at 50% 100%, ${rgba(V.accent, 0.34)}, transparent 72%)`;
  $("grain").style.backgroundImage = grainUrl(220, 0.5, 11);

  // Header
  const header = $("header");
  header.style.cssText += `;left:${left}px;top:${top}px;width:${inner}px;height:${M.logo}px`;
  const logoEl = V.showLogo ? KIT.logo($("brand"), M.logo, V.accent) : null;
  if (!V.showLogo) $("brand").style.display = "none";
  const title = $("title");
  title.style.fontSize = M.title + "px";
  title.style.color = "#fff";
  title.style.marginLeft = (V.showLogo ? Math.round(M.logo * 0.26) : 0) + "px";
  const project = $("project");
  project.textContent = V.project;
  project.style.fontSize = M.project + "px";

  // Prompt box
  const box = $("box");
  const boxTop = top + M.logo + M.gap;
  box.style.cssText += `;left:${left}px;top:${boxTop}px;width:${inner}px;padding:${M.boxPad}px ${M.boxPad + 6}px`;
  const boxFill = $("box-fill");
  boxFill.style.borderWidth = M.border + "px";
  boxFill.style.borderColor = KIT.colors.promptBorder;
  boxFill.style.background = KIT.colors.ground;
  const chevron = $("chevron");
  chevron.style.width = M.chevron + "px";
  chevron.style.height = Math.round(M.promptPx * 1.22) + "px";
  chevron.style.marginRight = Math.round(M.chevron * 0.42) + "px";
  chevron.style.display = "flex";
  chevron.style.alignItems = "center";
  KIT.glyph(chevron, "chevron", Math.round(M.chevron * 0.86), "#fff");

  const prompt = $("prompt");
  const caret = $("caret");
  const chars = [...String(V.prompt)].map((ch) => make("span", "ch", prompt, ch));
  let promptPx = M.promptPx;
  prompt.style.fontSize = promptPx + "px";
  const maxPrompt = () => Math.ceil(M.promptMax * promptPx * 1.22) + 2;
  while (prompt.offsetHeight > maxPrompt() && promptPx > minText) {
    promptPx -= 1;
    prompt.style.fontSize = promptPx + "px";
  }
  prompt.appendChild(caret);
  caret.style.width = Math.round(promptPx * 0.56) + "px";
  caret.style.height = Math.round(promptPx * 1.08) + "px";
  const lineTop = Math.round(promptPx * 0.07);
  const caretAt = chars.map((c) => ({ x: c.offsetLeft + c.offsetWidth, y: c.offsetTop + lineTop }));
  const caretHome = { x: 0, y: lineTop };

  // Status band: the mascot works, the spinner runs, the counters climb
  const bandTop = bottom - M.bandH;
  const hasPal = V.showMascot;
  const pal = $("pal");
  const clawd = KIT.mascot(pal, M.statusCell, { color: V.accent });
  if (!hasPal) pal.style.display = "none";
  const homeX = left;
  const homeY = bandTop + (M.bandH - clawd.height) / 2;
  pal.style.left = "0px";
  pal.style.top = "0px";
  pal.style.width = clawd.width + "px";
  pal.style.height = clawd.height + "px";

  const statusX = left + (hasPal ? clawd.width + Math.round(M.statusCell * 2.4) : 0);
  const status = $("status");
  const statusW = W - M.side - statusX;
  status.style.cssText += `;left:${statusX}px;top:${bandTop}px;width:${statusW}px;height:${M.bandH}px;display:flex;flex-direction:column;justify-content:center`;
  const spin = KIT.spinner($("spin"), Math.round(M.word * 1.02), V.accent);
  $("spin").style.marginRight = Math.round(M.word * 0.34) + "px";
  const word = $("word");
  word.textContent = `${V.spinnerWord}…`;
  word.style.fontSize = M.word + "px";
  word.style.color = V.accent;
  fit(word, statusW - M.word * 1.4, minText);
  const count = $("count");
  count.style.fontSize = M.count + "px";
  count.style.marginTop = Math.round(M.word * 0.16) + "px";

  // Tool calls
  const steps = [1, 2, 3, 4, 5, 6]
    .map((i) => ({ tool: V[`step${i}Tool`], target: V[`step${i}Target`], result: V[`step${i}Result`] }))
    .filter((s) => String(s.tool || "").trim());
  const feed = $("feed");
  const rows = $("rows");
  const feedTop = boxTop + box.offsetHeight + M.gap;
  const feedRoom = bandTop - M.gap - feedTop;
  feed.style.cssText += `;left:${left}px;top:${feedTop}px;width:${inner}px`;
  const markBox = Math.round(M.mark * 1.5);
  const textRoom = inner - markBox;
  const rowEls = steps.map((s) => {
    const row = make("div", "row", rows);
    const call = make("div", "call", row);
    const mark = make("div", "mark", call);
    mark.style.width = mark.style.height = M.mark + "px";
    mark.style.marginRight = markBox - M.mark + "px";
    const dull = KIT.glyph(mark, "bullet", M.mark, KIT.colors.inactive);
    const good = KIT.glyph(mark, "bullet", M.mark, KIT.colors.success);
    gsap.set(good, { autoAlpha: 0, transformOrigin: "50% 50%" });
    gsap.set(dull, { transformOrigin: "50% 50%" });
    const text = make("span", "call-text", call);
    text.style.fontSize = M.call + "px";
    make("span", "tool", text, s.tool);
    make("span", "target", text, s.target ? `(${s.target})` : "");
    fit(text, textRoom, minText);
    const result = make("div", "result", row);
    const branch = make("div", "mark", result);
    branch.style.width = branch.style.height = M.mark + "px";
    branch.style.marginRight = markBox - M.mark + "px";
    branch.style.marginTop = -Math.round(M.result * 0.2) + "px";
    KIT.glyph(branch, "branch", M.mark, KIT.colors.promptBorder);
    const label = make("span", "result-text", result, s.result);
    label.style.fontSize = M.result + "px";
    fit(label, textRoom, minText);
    return { row, call, result, dull, good };
  });
  const rowH = Math.max(1, ...rowEls.map((r) => r.row.offsetHeight)) + M.rowGap;
  const visible = Math.max(1, Math.floor((feedRoom + M.rowGap) / rowH));
  rowEls.forEach((r, i) => { r.row.style.top = i * rowH + "px"; });
  feed.style.height = visible * rowH - M.rowGap + "px";
  rows.style.height = rowEls.length * rowH + "px";

  // Counters
  const filesStat = parseStat(V.filesStat);
  const timeMatch = String(V.timeStat).match(/^(?:(\d+)\s*m)?\s*(?:(\d+)\s*s)?$/i);
  const timeTotal = timeMatch && (timeMatch[1] || timeMatch[2]) ? Number(timeMatch[1] || 0) * 60 + Number(timeMatch[2] || 0) : null;
  const timeText = (sec) => {
    if (timeTotal === null) return String(V.timeStat);
    const whole = Math.round(sec);
    const m = Math.floor(whole / 60);
    return timeTotal >= 60 ? `${m}m ${String(whole % 60).padStart(2, "0")}s` : `${whole}s`;
  };
  const filesText = (u) => {
    if (!filesStat) return String(V.filesStat);
    return formatStat(filesStat, Math.round(filesStat.value * u));
  };
  const countText = (u) => (u >= 1 ? `${V.filesStat} · ${V.timeStat}` : `${filesText(u)} · ${timeText((timeTotal || 0) * u)}`);
  count.textContent = countText(1);
  fit(count, statusW, minText);
  count.textContent = countText(0);

  // Result slab
  const slab = $("slab");
  const slabW = W - M.slabInset * 2;
  const slabTop = bottom - M.slabH;
  slab.style.cssText += `;left:${M.slabInset}px;top:${slabTop}px;width:${slabW}px;height:${M.slabH}px;background:${V.doneColor};color:${V.doneInk}`;
  const doneTick = $("done-tick");
  KIT.glyph(doneTick, "tick", M.tick, V.doneInk);
  doneTick.style.marginRight = Math.round(M.tick * 0.2) + "px";
  doneTick.style.flex = "none";
  const done = $("done");
  done.textContent = V.doneWord;
  done.style.fontSize = M.donePx + "px";
  fit(done, slabW - M.tick * 1.2 - 64, 90);
  const stats = $("done-stats");
  stats.textContent = `${V.filesStat} · ${V.timeStat}`;
  stats.style.fontSize = M.statsPx + "px";
  stats.style.marginTop = M.statsGap + "px";
  stats.style.display = "inline-block";
  stats.style.alignSelf = "center";
  fit(stats, slabW - 64, minText);

  // Opening: the prompt is the whole picture until it's sent, with the mascot standing on it
  const boxH = box.offsetHeight;
  const lift = Math.round((bandTop - boxTop - boxH) * 0.5);
  const boxGrow = compact ? 1.03 : 1.06;
  const standX = W - M.side - clawd.width - M.boxPad * 2;
  const standY = boxTop + lift - (boxH * (boxGrow - 1)) / 2 - clawd.height + 2;
  gsap.set(pal, { x: standX, y: standY });
  gsap.set(box, { y: lift, scale: boxGrow });
  gsap.set(status, { autoAlpha: 0 });
  if (logoEl) {
    gsap.set(logoEl, { transformOrigin: "50% 50%" });
    build.fromTo(logoEl, { scale: 0.2, rotation: -110 }, { scale: 1, rotation: 0, duration: 0.42, ease: "back.out(2.2)" }, 0);
  }
  build.fromTo(title, { x: -44, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.22, ease: "power4.out" }, 0.05);
  build.fromTo(project, { x: 44, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.22, ease: "power4.out" }, 0.1);
  build.fromTo(box, { y: lift + 70, autoAlpha: 0 }, { y: lift, autoAlpha: 1, duration: 0.24, ease: "power4.out" }, 0.04);
  if (hasPal) {
    build.fromTo(pal, { y: standY - 560 }, { y: standY, duration: 0.28, ease: "power3.in" }, 0.02);
    build.fromTo(pal, { scaleX: 1.3, scaleY: 0.68 }, { scaleX: 1, scaleY: 1, duration: 0.32, ease: "elastic.out(1,0.4)", immediateRender: false }, 0.3);
  }

  // Typing
  const typeStart = 0.34;
  const typeEnd = 1.26;
  gsap.set(chars, { visibility: "hidden" });
  gsap.set(caret, { x: caretHome.x, y: caretHome.y });
  const each = (typeEnd - typeStart) / Math.max(1, chars.length);
  chars.forEach((c, i) => {
    const at = typeStart + each * i;
    build.set(c, { visibility: "visible" }, at);
    build.set(caret, { x: caretAt[i].x, y: caretAt[i].y }, at);
  });
  if (hasPal) {
    // The mascot leans over and watches the words appear under it.
    clawd.pose(build, typeStart, { eyes: "left" });
    clawd.blink(build, typeStart + 0.5);
  }

  // Enter: the box shoots up, fills like a sent message, and the mascot drops down to work
  const enter = typeEnd + 0.1;
  build.set(caret, { visibility: "hidden" }, enter);
  build.to(box, { y: 0, scale: 1, duration: 0.24, ease: "back.out(1.5)" }, enter);
  build.set(boxFill, { background: KIT.colors.userMessage, borderColor: KIT.colors.userMessage }, enter);
  build.set(status, { autoAlpha: 1 }, enter + 0.14);
  build.fromTo(status, { x: 50 }, { x: 0, duration: 0.2, ease: "power4.out", immediateRender: false }, enter + 0.14);
  if (hasPal) {
    clawd.pose(build, enter, { eyes: "open", arms: "up" });
    build.to(pal, { x: homeX, duration: 0.32, ease: "none" }, enter);
    build.to(pal, { y: Math.min(standY, homeY) - 40, duration: 0.09, ease: "power2.out" }, enter);
    build.to(pal, { y: homeY, duration: 0.23, ease: "power2.in" }, enter + 0.09);
    build.fromTo(pal, { scaleX: 1.26, scaleY: 0.74 }, { scaleX: 1, scaleY: 1, duration: 0.24, ease: "back.out(3)", immediateRender: false }, enter + 0.32);
    clawd.pose(build, enter + 0.32, { arms: "down" });
  }

  // Calls land faster and faster as the agent gets going
  const firstAt = enter + 0.34;
  const lastAt = D - 0.72;
  const n = steps.length;
  const times = steps.map((_, i) => firstAt + (lastAt - firstAt) * Math.pow(n > 1 ? i / (n - 1) : 1, 0.72));
  spin.run(build, enter, D - 0.08, 0.08);

  const landings = [];
  rowEls.forEach((r, i) => {
    const at = times[i];
    const next = i + 1 < n ? times[i + 1] : D - 0.42;
    const settle = Math.min(0.3, (next - at) * 0.58);
    const hit = at + settle;
    landings.push({ time: hit, value: (i + 1) / n * 0.93 });

    // The feed steps up by whole rows, so no half-cut row ever sits on screen.
    const over = i + 1 - visible;
    if (over > 0) {
      build.to(rows, { y: -over * rowH, duration: 0.2, ease: "back.out(1.5)" }, at);
      build.set(rowEls[over - 1].row, { autoAlpha: 0 }, at + 0.08);
    }
    gsap.set(r.row, { autoAlpha: 0 });
    gsap.set(r.result, { autoAlpha: 0 });
    build.set(r.row, { autoAlpha: 1 }, at);
    build.fromTo(r.call, { x: -56 }, { x: 0, duration: 0.2, ease: "power4.out", immediateRender: false }, at);
    build.fromTo(r.dull, { scale: 0 }, { scale: 1, duration: 0.16, ease: "back.out(3)", immediateRender: false }, at);

    // The result is the cause: bullet goes green, the counters tick, the mascot reacts, all on one frame.
    build.set(r.result, { autoAlpha: 1 }, hit);
    build.fromTo(r.result, { x: -30 }, { x: 0, duration: 0.16, ease: "power4.out", immediateRender: false }, hit);
    build.set(r.good, { autoAlpha: 1 }, hit);
    build.set(r.dull, { autoAlpha: 0 }, hit);
    build.fromTo(r.good, { scale: 1.9 }, { scale: 1, duration: 0.24, ease: "back.out(3)", immediateRender: false }, hit);
    build.fromTo(count, { scale: 1.09 }, { scale: 1, duration: 0.2, ease: "power3.out", immediateRender: false, transformOrigin: "0% 50%" }, hit);
    build.fromTo($("glow"), { opacity: 1 }, { opacity: 0.55, duration: Math.max(0.2, next - hit), ease: "power2.out", immediateRender: false }, hit);
    if (hasPal) {
      build.fromTo(pal, { y: homeY - M.statusCell * 1.6 }, { y: homeY, duration: 0.2, ease: "bounce.out", immediateRender: false }, hit);
      clawd.pose(build, hit, { arms: i % 2 ? "right" : "left", eyes: i % 2 ? "left" : "right" });
      clawd.pose(build, hit + 0.12, { arms: "down" });
    }
  });

  // One tween drives the counter, so any seek shows the same text.
  const countFrom = enter;
  const countTo = D;
  const countLen = countTo - countFrom;
  const points = [{ time: countFrom, value: 0 }, ...landings, { time: countTo, value: 1 }];
  build.fromTo(count, { textContent: 0 }, {
    textContent: 1000,
    duration: countLen,
    ease: "none",
    immediateRender: false,
    modifiers: {
      textContent(value) {
        const now = countFrom + (Number(value) / 1000) * countLen;
        let u = 0;
        for (let i = 0; i < points.length - 1; i++) {
          const a = points[i];
          const b = points[i + 1];
          if (now >= a.time) u = a.value + (b.value - a.value) * Math.min(1, (now - a.time) / (b.time - a.time));
        }
        return countText(u);
      },
    },
  }, countFrom);

  // The payoff: the mascot launches, the slab slams in under it, it lands on the key frame.
  const key = T.key;
  const slabGap = H - slabTop + 40;
  gsap.set(slab, { y: slabGap, autoAlpha: 0 });
  gsap.set($("slab-sheen"), { xPercent: -130 });
  gsap.set($("flash"), { opacity: 0 });
  build.to(status, { autoAlpha: 0, duration: 0.1, ease: "none" }, D - 0.3);

  // Rows the slab would cut through leave with it, so no half-hidden line sits behind it.
  const shift = Math.max(0, n - visible);
  rowEls.forEach((r, i) => {
    if (i < shift) return;
    const bottomEdge = feedTop + (i - shift) * rowH + r.row.offsetHeight;
    if (bottomEdge > slabTop - 8) build.set(r.row, { autoAlpha: 0 }, D - 0.14);
  });
  build.set(slab, { autoAlpha: 1 }, D - 0.2);
  build.to(slab, { y: 0, duration: 0.2, ease: "power4.in" }, D - 0.2);
  build.to(feed, { opacity: 0.3, duration: 0.2, ease: "power2.in" }, D - 0.2);
  build.to(box, { opacity: 0.3, duration: 0.2, ease: "power2.in" }, D - 0.2);

  const palX = W / 2 - clawd.width / 2;
  const palY = slabTop - clawd.height + 2;
  const apex = Math.min(palY, homeY) - (compact ? 90 : 170);
  if (hasPal) {
    build.to(pal, { scaleX: 1.2, scaleY: 0.72, duration: 0.14, ease: "power2.out" }, D - 0.64);
    clawd.pose(build, D - 0.64, { eyes: "closed" });
    build.to(pal, { scaleX: 0.9, scaleY: 1.14, duration: 0.1, ease: "power2.out" }, D - 0.5);
    clawd.pose(build, D - 0.5, { arms: "up", eyes: "open" });
    build.to(pal, { x: palX, duration: 0.5, ease: "none" }, D - 0.5);
    build.to(pal, { y: apex, duration: 0.3, ease: "power3.out" }, D - 0.5);
    build.to(pal, { y: palY, duration: 0.2, ease: "power3.in" }, D - 0.2);
    build.to(pal, { scaleX: 1, scaleY: 1, duration: 0.2, ease: "none" }, D - 0.2);
  }

  build.timeScale(1 / T.scale);
  tl.add(build, 0);

  // Reaction, in real seconds from the key frame
  const hold = T.hold;
  tl.fromTo(slab, { scale: 1.075 }, { scale: 1, duration: 0.42, ease: "elastic.out(1,0.5)", immediateRender: false }, key);
  tl.fromTo($("flash"), { opacity: 0.3 }, { opacity: 0, duration: 0.24, ease: "power2.out", immediateRender: false }, key);
  tl.fromTo($("scene"), { y: 24 }, { y: 0, duration: 0.4, ease: "back.out(2.4)", immediateRender: false }, key);
  tl.fromTo($("slab-sheen"), { xPercent: -130 }, { xPercent: 460, duration: 0.5, ease: "power2.out", immediateRender: false }, key + 0.03);
  tl.fromTo($("glow"), { opacity: 1 }, { opacity: 0.72, duration: hold, ease: "sine.inOut", immediateRender: false }, key);

  if (hasPal) {
    tl.fromTo(pal, { scaleX: 1.34, scaleY: 0.62 }, { scaleX: 1, scaleY: 1, duration: 0.42, ease: "elastic.out(1,0.42)", immediateRender: false }, key);
    clawd.pose(tl, key, { eyes: "closed", arms: "up" });
    clawd.pose(tl, key + 0.36, { eyes: "open" });
    const cell = M.palCell;
    [0.62, 1.16].forEach((off, i) => {
      if (off > hold - 0.2) return;
      tl.to(pal, { y: palY - cell * 3.4, duration: 0.15, ease: "power2.out" }, key + off);
      tl.to(pal, { y: palY, duration: 0.15, ease: "power2.in" }, key + off + 0.15);
      clawd.pose(tl, key + off, { arms: i ? "left" : "right" });
      clawd.pose(tl, key + off + 0.15, { arms: "up" });
    });
  }

  // Pixels fly out of the landing and keep drifting through the hold.
  const sparks = $("sparks");
  const rnd = seeded(23);
  const palette = [V.accent, KIT.colors.shimmer, V.doneColor, "#FFFFFF"];
  const originX = W / 2;
  const originY = slabTop;
  const fallRoom = H + 60 - originY;
  for (let i = 0; i < 34; i++) {
    const size = Math.round((compact ? 10 : 14) * (1 + Math.floor(rnd() * 2)));
    const p = make("div", "spark", sparks);
    p.style.cssText += `;width:${size}px;height:${size}px;background:${palette[i % palette.length]}`;
    gsap.set(p, { x: originX, y: originY, autoAlpha: 0 });
    const reach = (rnd() - 0.5) * W * 1.12;
    const lift = (compact ? 120 : 200) + rnd() * (compact ? 220 : 420);
    const up = 0.26 + rnd() * 0.16;
    tl.set(p, { autoAlpha: 1 }, key);
    tl.to(p, { x: originX + reach, duration: hold + 0.2, ease: "power3.out" }, key);
    tl.to(p, { y: originY - lift, duration: up, ease: "power3.out" }, key);
    tl.to(p, { y: originY + fallRoom, duration: hold + 0.3 - up, ease: "power1.in" }, key + up);
  }

  // Overlay enters and leaves through a wipe up the card
  const open = "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)";
  const shut = "polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)";
  if (variant === "overlay") {
    tl.fromTo(stageEl, { clipPath: shut }, { clipPath: open, duration: 0.2, ease: "power4.out" }, 0);
  }
  if (T.exit > 0) {
    tl.to(stageEl, { clipPath: shut, duration: Math.max(0, T.exit - 1 / CA.fps), ease: "power3.in" }, key + hold);
  }

  window.__timelines["block"] = tl;
});
