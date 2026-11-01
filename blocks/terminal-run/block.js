CA.ready(() => {
  const {
    vars: V, stage: S, safe, time: T, variant,
    make, fit, rgba, parseStat, formatStat, grainUrl, seeded,
  } = CA;
  const KIT = CA.claude;
  const $ = (id) => document.getElementById(id);
  const stageEl = $("stage");
  const W = S.w;
  const H = S.h;
  const D = T.design;
  const compact = variant !== "full";
  const minText = compact ? 32 : 40;
  const hasPal = Boolean(V.showMascot);
  const targetColor = rgba(V.textColor, 0.83);

  const layouts = {
    full: {
      side: 48, top: 230, bottom: 300, gap: 24,
      logo: 80, title: 64, project: 42,
      openingPx: 128, openingLines: 4, openingPad: 40,
      sentPx: 80, sentLines: 2, boxPad: 26,
      chevron: 54, border: 4,
      call: 84, target: 68, result: 54, mark: 34,
      rowGap: 22, maxRows: 3,
      cell: 26, word: 58, count: 72, bandH: 232, bandGap: 22,
      slabH: 520, slabPad: 32, donePx: 248, tick: 142,
      statsPx: 66, statsGap: 24, slabInset: 48,
    },
    top: {
      side: 48, top: 40, bottom: 36, gap: 18,
      logo: 60, title: 50, project: 36,
      openingPx: 88, openingLines: 3, openingPad: 26,
      sentPx: 64, sentLines: 2, boxPad: 20,
      chevron: 44, border: 3,
      call: 60, target: 50, result: 40, mark: 28,
      rowGap: 18, maxRows: 2,
      cell: 17, word: 52, count: 64, bandH: 176, bandGap: 20,
      slabH: 356, slabPad: 24, donePx: 190, tick: 112,
      statsPx: 56, statsGap: 18, slabInset: 48,
    },
    overlay: {
      side: 44, top: 38, bottom: 36, gap: 18,
      logo: 64, title: 52, project: 36,
      openingPx: 90, openingLines: 3, openingPad: 28,
      sentPx: 64, sentLines: 2, boxPad: 20,
      chevron: 44, border: 3,
      call: 60, target: 50, result: 40, mark: 28,
      rowGap: 18, maxRows: 2,
      cell: 17, word: 52, count: 64, bandH: 176, bandGap: 20,
      slabH: 364, slabPad: 24, donePx: 194, tick: 114,
      statsPx: 56, statsGap: 18, slabInset: 44,
    },
  };
  const M = { ...(layouts[variant] || layouts.full) };

  if (compact && H < 840) {
    Object.assign(M, {
      side: 40, top: 28, bottom: 28, gap: 14,
      logo: 48, title: 42, project: 32,
      openingPx: 74, openingLines: 3, openingPad: 20,
      sentPx: 54, boxPad: 14, chevron: 36,
      call: 50, target: 44, result: 36, mark: 26,
      rowGap: 14, cell: 12,
      word: 42, count: 50, bandH: 132, bandGap: 16,
      slabH: 300, slabPad: 20, donePx: 160, tick: 94,
      statsPx: 46, statsGap: 14, slabInset: 40,
    });
  }
  if (compact && H < 640) {
    Object.assign(M, {
      side: 32, top: 20, bottom: 20, gap: 10,
      logo: 44, title: 38, project: 32,
      openingPx: 66, openingPad: 18,
      sentPx: 48, boxPad: 10, chevron: 34,
      call: 46, target: 40, result: 32, mark: 24,
      rowGap: 12, word: 38, count: 44,
      bandH: 120, bandGap: 12,
      slabPad: 18, donePx: 144, tick: 84,
      statsPx: 40, statsGap: 12, slabInset: 32,
    });
  }
  if (compact && H < 520) {
    Object.assign(M, {
      side: 28, top: 16, bottom: 16,
      logo: 40, title: 34,
      openingPx: 62, sentPx: 44, chevron: 30,
      call: 40, target: 36, mark: 22,
      rowGap: 10, word: 34, count: 40,
      bandH: 112, bandGap: 10,
      slabPad: 16, donePx: 134, tick: 78,
      statsPx: 36, slabInset: 28,
    });
  }

  const left = M.side;
  const inner = W - left * 2;
  const top = compact ? M.top : Math.max(M.top, safe.top || 0);
  const bottom = H - (compact ? M.bottom : Math.max(M.bottom, safe.bottom || 0));
  const tl = gsap.timeline({ paused: true });
  const build = gsap.timeline();

  const fitReadable = (el, room) => {
    fit(el, room, minText);
    if (el.scrollWidth > room + 1) {
      el.style.whiteSpace = "normal";
      el.style.maxWidth = Math.floor(room) + "px";
      el.style.textWrap = "balance";
    }
  };

  stageEl.style.background = V.ground;
  $("ground").style.background = V.ground;
  $("scene").style.color = V.textColor;
  $("glow").style.background =
    `radial-gradient(80% 65% at 50% 72%, ${rgba(V.accent, 0.14)}, transparent 72%),` +
    `radial-gradient(90% 44% at 50% 100%, ${rgba(V.accent, 0.3)}, transparent 72%)`;
  $("grain").style.backgroundImage = grainUrl(220, 0.5, 11);
  gsap.set($("glow"), { opacity: 0.7, transformOrigin: "50% 100%" });

  const header = $("header");
  header.style.cssText +=
    `;left:${left}px;top:${top}px;width:${inner}px;height:${M.logo}px`;
  const logoEl = V.showLogo ? KIT.logo($("brand"), M.logo, V.accent) : null;
  if (!V.showLogo) $("brand").style.display = "none";

  const title = $("title");
  title.textContent = String(V.headerLabel || "");
  title.style.fontSize = M.title + "px";
  title.style.color = V.textColor;
  title.style.marginLeft = (V.showLogo ? Math.round(M.logo * 0.22) : 0) + "px";

  const project = $("project");
  const projectValue = String(V.project || "");
  const projectRoom = inner * 0.4;
  project.textContent = projectValue;
  project.style.fontSize = M.project + "px";
  project.style.color = V.mutedColor;
  if (projectValue) {
    fit(project, projectRoom, minText);
    if (project.scrollWidth > projectRoom + 1) {
      project.textContent = "";
      projectValue.split(/([/\\])/).forEach((part) => {
        project.appendChild(document.createTextNode(part));
        if (/^[/\\]$/.test(part)) {
          project.appendChild(document.createElement("wbr"));
        }
      });
      project.style.whiteSpace = "normal";
      project.style.maxWidth = Math.floor(projectRoom) + "px";
    }
  } else {
    project.style.display = "none";
  }

  const brandRoom = V.showLogo ? M.logo * 1.22 : 0;
  fit(title, Math.max(minText, inner - brandRoom - project.offsetWidth - 20), minText);
  const headerH = Math.max(M.logo, title.offsetHeight, project.offsetHeight);
  header.style.height = headerH + "px";

  if (logoEl) {
    build.fromTo(logoEl, {
      rotation: -12, scaleX: 0.88, scaleY: 0.88,
      transformOrigin: "50% 50%",
    }, {
      rotation: 0, scaleX: 1, scaleY: 1,
      duration: 0.2, ease: "power4.out",
    }, 0);
  }

  const box = $("box");
  const boxTop = top + headerH + M.gap;
  box.style.cssText +=
    `;left:${left}px;top:${boxTop}px;width:${inner}px`;
  const boxFill = $("box-fill");
  boxFill.style.borderWidth = M.border + "px";
  boxFill.style.borderColor = V.accent;
  boxFill.style.background = V.ground;

  const chevron = $("chevron");
  chevron.style.width = M.chevron + "px";
  chevron.style.marginRight = Math.round(M.chevron * 0.28) + "px";
  KIT.glyph(chevron, "chevron", M.chevron, V.textColor);

  const prompt = $("prompt");
  prompt.style.color = V.textColor;
  const caret = $("caret");
  caret.style.background = V.textColor;
  const words = String(V.prompt || "").trim().split(/\s+/).filter(Boolean);
  const wordEls = words.map((text, i) => {
    if (i) prompt.appendChild(document.createTextNode(" "));
    return make("span", "prompt-word", prompt, text);
  });
  prompt.appendChild(caret);

  // Measure each pose at its own type size. Enter commits the compact pose
  // in one frame rather than leaving reflowing words between layouts.
  const measurePrompt = (startPx, maxLines, pad) => {
    let px = startPx;
    box.style.height = "auto";
    box.style.padding = `${pad}px ${pad + 6}px`;
    const apply = () => {
      prompt.style.fontSize = px + "px";
      chevron.style.height = Math.round(px * 1.16) + "px";
    };
    apply();
    while (
      px > minText &&
      (
        prompt.offsetHeight > Math.ceil(maxLines * px * 1.16) + 2 ||
        wordEls.some((el) => el.offsetWidth > prompt.clientWidth + 1)
      )
    ) {
      px--;
      apply();
    }
    return { px, height: box.offsetHeight };
  };

  const sent = measurePrompt(M.sentPx, M.sentLines, M.boxPad);
  const opening = measurePrompt(M.openingPx, M.openingLines, M.openingPad);
  box.style.height = opening.height + "px";
  caret.style.width = Math.round(opening.px * 0.46) + "px";
  caret.style.height = Math.round(opening.px * 1.02) + "px";

  const caretAt = (index) => {
    const el = wordEls[index];
    return el ? {
      x: el.offsetLeft + el.offsetWidth + 2,
      y: el.offsetTop + Math.round(opening.px * 0.07),
    } : { x: 0, y: Math.round(opening.px * 0.07) };
  };

  let openingWords = Math.min(
    words.length,
    Math.max(Math.min(3, words.length), Math.ceil(words.length * 0.52))
  );
  while (openingWords > 1 && openingWords < words.length) {
    const lastY = wordEls[openingWords - 1].offsetTop;
    let onLine = 0;
    for (let i = openingWords - 1; i >= 0 && wordEls[i].offsetTop === lastY; i--) {
      onLine++;
    }
    if (onLine > 1) break;
    openingWords++;
  }
  wordEls.forEach((el, i) => {
    gsap.set(el, { autoAlpha: i < openingWords ? 1 : 0 });
  });
  gsap.set(caret, { ...caretAt(openingWords - 1), autoAlpha: words.length ? 1 : 0 });

  const remaining = wordEls.length - openingWords;
  wordEls.slice(openingWords).forEach((el, i) => {
    const at = remaining === 1 ? 0.5 : 0.14 + 0.36 * i / (remaining - 1);
    build.set(el, { autoAlpha: 1 }, at);
    build.fromTo(el, { y: 6 }, {
      y: 0, duration: 0.075, ease: "power4.out", immediateRender: false,
    }, at);
    build.set(caret, { ...caretAt(openingWords + i), autoAlpha: 1 }, at);
  });

  const palTrack = $("pal-track");
  const pal = $("pal");
  const clawd = KIT.mascot(pal, M.cell, { color: V.accent });
  pal.style.width = palTrack.style.width = clawd.width + "px";
  pal.style.height = palTrack.style.height = clawd.height + "px";
  const palFootY =
    clawd.el.getBoundingClientRect().bottom - pal.getBoundingClientRect().top;
  pal.style.transformOrigin = `50% ${palFootY}px`;
  if (!hasPal) palTrack.style.display = "none";

  const steps = [1, 2, 3, 4, 5, 6].map((i) => ({
    tool: String(V[`step${i}Tool`] || "").trim(),
    target: String(V[`step${i}Target`] || "").trim(),
    result: String(V[`step${i}Result`] || "").trim(),
  })).filter((step) => step.tool);

  const feed = $("feed");
  const rows = $("rows");
  const feedTop = boxTop + sent.height + M.gap;
  const feedRoom = Math.max(0, bottom - M.bandH - M.bandGap - feedTop);
  feed.style.cssText +=
    `;left:${left}px;top:${feedTop}px;width:${inner}px;height:${feedRoom}px`;

  const markBox = Math.round(M.mark * 1.6);
  const textRoom = inner - markBox;

  // Keep each basename intact. Long paths may break only between directories.
  const fitTarget = (el, value) => {
    el.textContent = value;
    fit(el, textRoom, minText);
    if (el.scrollWidth <= textRoom + 1) return;

    const tokens = /[/\\]/.test(value)
      ? value.match(/[^/\\]*[/\\]|[^/\\]+$/g)
      : value.match(/\S+\s*/g);
    const lines = [];
    let line = "";
    (tokens || [value]).forEach((token) => {
      const candidate = line + token;
      el.textContent = candidate;
      if (line && el.scrollWidth > textRoom + 1) {
        lines.push(line.trimEnd());
        line = token.trimStart();
      } else {
        line = candidate;
      }
    });
    if (line) lines.push(line.trimEnd());
    el.style.whiteSpace = "pre";
    el.textContent = lines.join("\n");
  };

  const rowEls = steps.map((step) => {
    const row = make("div", "row", rows);
    const call = make("div", "call", row);
    const mark = make("div", "mark", call);
    mark.style.width = mark.style.height = M.mark + "px";
    mark.style.marginRight = markBox - M.mark + "px";
    mark.style.marginTop = Math.round(M.call * 0.26) + "px";

    const dull = KIT.glyph(mark, "bullet", M.mark, V.mutedColor);
    const good = KIT.glyph(mark, "bullet", M.mark, V.doneColor);
    gsap.set(good, {
      autoAlpha: 0, transformOrigin: "50% 50%",
    });
    gsap.set(dull, { transformOrigin: "50% 50%" });

    const text = make("div", "call-text", call);
    text.style.fontSize = M.call + "px";
    const tool = make("span", "tool", text, step.tool);
    tool.style.color = V.textColor;
    tool.style.fontSize = M.call + "px";
    const target = make(
      "span", "target", text,
      step.target ? `(${step.target})` : ""
    );
    target.style.color = targetColor;

    const splitTarget = Boolean(step.target) &&
      (/[/\\]/.test(step.target) || text.scrollWidth > textRoom + 1);
    if (splitTarget) {
      const targetLine = make("div", "target-line", text);
      targetLine.style.fontSize = M.target + "px";
      targetLine.appendChild(target);
      target.style.fontSize = M.target + "px";
      fitTarget(target, `(${step.target})`);
      fit(tool, textRoom, minText);
    } else {
      fit(text, textRoom, minText);
      tool.style.fontSize = "inherit";
    }

    const result = make("div", "result", row);
    result.style.color = V.mutedColor;
    const branch = make("div", "mark", result);
    branch.style.width = branch.style.height = M.mark + "px";
    branch.style.marginRight = markBox - M.mark + "px";
    branch.style.marginTop = Math.round(M.result * 0.06) + "px";
    KIT.glyph(branch, "branch", M.mark, V.mutedColor);

    const label = make("span", "result-text", result, step.result);
    label.style.fontSize = M.result + "px";
    if (step.result) fitReadable(label, textRoom);
    else result.style.display = "none";

    gsap.set(row, { autoAlpha: 0 });
    gsap.set(result, { autoAlpha: 0 });
    return {
      row, call, result, dull, good, target,
      height: Math.ceil(row.offsetHeight),
    };
  });

  // A suffix of complete rows occupies the feed. Nothing scrolls through a crop.
  let rowTop = 0;
  rowEls.forEach((item) => {
    item.top = rowTop;
    item.row.style.top = rowTop + "px";
    rowTop += item.height + M.rowGap;
  });
  rows.style.height = Math.max(0, rowTop - M.rowGap) + "px";

  let windowStart = 0;
  const windows = rowEls.map((item, i) => {
    while (
      windowStart < i &&
      (
        i - windowStart + 1 > M.maxRows ||
        item.top + item.height - rowEls[windowStart].top > feedRoom
      )
    ) {
      windowStart++;
    }
    const height = item.top + item.height - rowEls[windowStart].top;
    return {
      start: windowStart,
      shift: rowEls[windowStart].top,
      band: feedTop + height + M.bandGap,
    };
  });

  const firstBand = windows.length ? windows[0].band : feedTop + M.bandGap;
  const homeX = left;
  const palAt = (band) => band + (M.bandH - clawd.height) / 2;
  const statusX = left + (hasPal ? clawd.width + M.cell * 1.35 : 0);
  const statusW = W - M.side - statusX;
  const status = $("status");
  status.style.cssText +=
    `;left:${statusX}px;top:0;width:${statusW}px;height:${M.bandH}px`;
  gsap.set(status, { y: firstBand, autoAlpha: 0 });

  const spin = KIT.spinner($("spin"), M.word, V.accent);
  $("spin").style.marginRight = Math.round(M.word * 0.26) + "px";
  const word = $("word");
  word.textContent = V.spinnerWord ? `${V.spinnerWord}…` : "";
  word.style.fontSize = M.word + "px";
  word.style.color = V.accent;
  fit(word, statusW - M.word * 1.3, minText);

  const filesStat = parseStat(V.filesStat);
  const timeMatch = String(V.timeStat).match(/^(?:(\d+)\s*m)?\s*(?:(\d+)\s*s)?$/i);
  const timeTotal = timeMatch && (timeMatch[1] || timeMatch[2])
    ? Number(timeMatch[1] || 0) * 60 + Number(timeMatch[2] || 0)
    : null;
  const timeText = (seconds) => {
    if (timeTotal === null) return String(V.timeStat);
    const whole = Math.round(seconds);
    return timeTotal >= 60
      ? `${Math.floor(whole / 60)}m ${String(whole % 60).padStart(2, "0")}s`
      : `${whole}s`;
  };
  let countSeparator = " · ";
  const countText = (progress) => {
    if (progress >= 1) {
      return `${V.filesStat}${countSeparator}${V.timeStat}`;
    }
    const files = filesStat
      ? formatStat(filesStat, Math.round(filesStat.value * progress))
      : String(V.filesStat);
    return `${files}${countSeparator}${timeText((timeTotal || 0) * progress)}`;
  };

  const count = $("count");
  count.style.fontSize = M.count + "px";
  count.style.color = V.textColor;
  count.style.marginTop = Math.round(M.word * 0.12) + "px";
  count.textContent = countText(1);
  fit(count, statusW / 1.07, minText);
  if (count.scrollWidth > statusW / 1.07 + 1) {
    countSeparator = "\n";
    count.style.whiteSpace = "pre";
    count.style.fontSize = minText + "px";
    count.textContent = countText(1);
    fit(count, statusW / 1.07, minText);
  }
  count.textContent = countText(0);

  const slab = $("slab");
  const slabW = W - M.slabInset * 2;
  const slabH = Math.min(M.slabH, Math.round((bottom - top) * 0.43));
  const slabTop = bottom - slabH;
  slab.style.cssText +=
    `;left:${M.slabInset}px;top:${slabTop}px;width:${slabW}px;height:${slabH}px;` +
    `padding:${M.slabPad}px;background:${V.doneColor};color:${V.doneInk};` +
    `border:3px solid ${rgba(V.doneInk, 0.16)}`;

  const statsPx = Math.min(M.statsPx, Math.max(minText, slabH * 0.16));
  const donePx = Math.max(minText, Math.min(
    M.donePx,
    (slabH - M.slabPad * 2 - M.statsGap - statsPx * 1.2) / 0.96
  ));
  const tickPx = Math.min(M.tick, donePx * 0.62);
  const doneTick = $("done-tick");
  KIT.glyph(doneTick, "tick", tickPx, V.doneInk);
  doneTick.style.marginRight = Math.round(tickPx * 0.18) + "px";

  const done = $("done");
  done.textContent = V.doneWord;
  done.style.fontSize = donePx + "px";
  fit(done, slabW - M.slabPad * 2 - tickPx * 1.18 - 12, minText);

  const stats = $("done-stats");
  stats.textContent = `${V.filesStat} · ${V.timeStat}`;
  stats.style.fontSize = statsPx + "px";
  stats.style.marginTop = M.statsGap + "px";
  fit(stats, slabW - M.slabPad * 2 - 12, minText);

  const doneLine = $("done-line");
  gsap.set([doneLine, stats], { autoAlpha: 0 });
  const sheen = $("slab-sheen");
  sheen.style.background = rgba(V.doneInk, 0.1);
  gsap.set(sheen, { xPercent: -150 });
  $("flash").style.boxShadow =
    `inset 0 0 0 ${Math.round(W * 0.011)}px ${V.doneColor}`;

  // The full portrait gets a much larger opening than the compact outputs.
  const assemblyH = opening.height + (hasPal ? clawd.height : 0);
  const assemblyTop = boxTop + Math.max(
    M.gap,
    (bottom - boxTop - assemblyH) * 0.46
  );
  const openingTop = assemblyTop + (hasPal ? clawd.height : 0);
  const lift = openingTop - boxTop;
  const standX = W - M.side - clawd.width - M.openingPad;
  const standY = openingTop - clawd.height + 2;
  gsap.set(box, { y: lift, scaleX: 1, scaleY: 1 });
  gsap.set(palTrack, { x: standX, y: standY });
  gsap.set(pal, { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 });

  if (hasPal) {
    clawd.pose(build, 0, { eyes: "left", arms: "down", legs: "stand" });
    build.to(pal, {
      scaleX: 1.07, scaleY: 0.91,
      duration: 0.1, ease: "power2.in",
    }, 0.18);
    build.to(pal, {
      scaleX: 1, scaleY: 1,
      duration: 0.14, ease: "power3.out",
    }, 0.28);
    clawd.blink(build, 0.32);
  }

  const enter = 0.72;
  const enterLand = enter + 0.38;
  build.to(box, {
    scaleX: 1.018, scaleY: 0.94,
    duration: 0.065, ease: "power3.in",
  }, enter - 0.065);
  build.set(caret, { autoAlpha: 0 }, enter);
  build.set(prompt, { fontSize: sent.px }, enter);
  build.set(chevron, { height: Math.round(sent.px * 1.16) }, enter);
  build.set(box, {
    height: sent.height,
    padding: `${M.boxPad}px ${M.boxPad + 6}px`,
  }, enter);
  build.set(boxFill, {
    background: V.promptColor,
    borderColor: V.promptColor,
  }, enter);
  build.to(box, {
    y: -18, scaleX: 0.985, scaleY: 1.045,
    duration: 0.18, ease: "power4.in",
  }, enter);
  build.to(box, {
    y: 0, scaleX: 1, scaleY: 1,
    duration: 0.1, ease: "power4.out",
  }, enter + 0.18);

  build.set(status, { autoAlpha: 1 }, enterLand);
  build.fromTo(status, { x: 30 }, {
    x: 0, duration: 0.12, ease: "power4.out", immediateRender: false,
  }, enterLand);

  if (hasPal) {
    clawd.pose(build, enter, { eyes: "left", arms: "up", legs: "stand" });
    build.to(pal, {
      y: -M.cell * 0.5, scaleX: 0.94, scaleY: 1.08,
      duration: 0.08, ease: "power3.out",
    }, enter);
    build.to(palTrack, {
      x: homeX, duration: 0.3, ease: "power3.inOut",
    }, enter + 0.08);
    build.to(palTrack, {
      y: palAt(firstBand), duration: 0.28, ease: "power3.in",
    }, enter + 0.1);
    build.to(pal, {
      y: 0, scaleX: 0.88, scaleY: 1.16,
      duration: 0.2, ease: "power2.in",
    }, enter + 0.18);
    build.set(pal, { scaleX: 1.32, scaleY: 0.65 }, enterLand);
    clawd.pose(build, enterLand, {
      eyes: "closed", arms: "down", legs: "stand",
    });
    build.to(pal, {
      scaleX: 0.96, scaleY: 1.06,
      duration: 0.09, ease: "power3.out",
    }, enterLand);
    build.to(pal, {
      scaleX: 1, scaleY: 1,
      duration: 0.09, ease: "power3.out",
    }, enterLand + 0.09);
    clawd.pose(build, enterLand + 0.1, { eyes: "right", arms: "down" });
  }

  const n = steps.length;
  const firstAt = enterLand + 0.1;
  const lastAt = Math.max(firstAt, D - 0.94);
  const weights = Array.from({ length: Math.max(0, n - 1) }, (_, i) =>
    Math.pow(0.62, i)
  );
  const weightTotal = weights.reduce((sum, value) => sum + value, 0);
  let elapsedWeight = 0;
  const times = steps.map((_, i) => {
    if (i === 0) return firstAt;
    elapsedWeight += weights[i - 1];
    return firstAt + (lastAt - firstAt) * elapsedWeight / weightTotal;
  });
  const delays = times.map((at, i) => {
    const nextGap = i + 1 < n ? times[i + 1] - at : D - 0.66 - at;
    return Math.max(0.055, Math.min(
      0.34 * Math.pow(0.66, i),
      nextGap * 0.46
    ));
  });
  const hits = times.map((at, i) => at + delays[i]);

  spin.run(build, enterLand, D - 0.34, 0.065);
  spin.stop(build, D - 0.34);

  const tickCount = (progress, at, strong, duration) => {
    build.set(count, { textContent: countText(progress) }, at);
    build.fromTo(count, {
      scaleX: strong ? 1.065 : 1.025,
      scaleY: strong ? 1.12 : 1.035,
      color: strong ? V.doneColor : V.accent,
    }, {
      scaleX: 1, scaleY: 1, color: V.textColor,
      duration, ease: "power4.out", immediateRender: false,
    }, at);
  };

  let previousStart = 0;
  rowEls.forEach((item, i) => {
    const at = times[i];
    const hit = hits[i];
    const delay = delays[i];
    const nextAt = i + 1 < n ? times[i + 1] : D - 0.64;
    const nextHit = i + 1 < n ? hits[i + 1] : D - 0.64;
    const window = windows[i];

    for (let j = previousStart; j < window.start; j++) {
      build.set(rowEls[j].row, { autoAlpha: 0 }, at);
    }
    previousStart = window.start;
    build.set(rows, { y: -window.shift }, at);
    build.to(status, {
      y: window.band,
      duration: Math.min(0.14, Math.max(0.06, delay)),
      ease: "power4.out",
    }, at);
    if (hasPal) {
      build.to(palTrack, {
        y: palAt(window.band),
        duration: Math.min(0.14, Math.max(0.06, delay)),
        ease: "power4.out",
      }, at);
      clawd.pose(build, at, { eyes: "right", arms: "down", legs: "stand" });
    }

    build.set(item.row, { autoAlpha: 1 }, at);
    build.fromTo(item.call, {
      x: 24, scaleX: 0.985, scaleY: 0.95,
    }, {
      x: 0, scaleX: 1, scaleY: 1,
      duration: Math.min(0.15, delay * 0.8),
      ease: "power4.out", immediateRender: false,
    }, at);
    build.fromTo(item.dull, { scaleX: 0.35, scaleY: 0.35 }, {
      scaleX: 1, scaleY: 1,
      duration: Math.min(0.12, delay * 0.8),
      ease: "back.out(2)", immediateRender: false,
    }, at);

    const baseProgress = i / n * 0.93;
    const stepProgress = 0.93 / n;
    tickCount(
      baseProgress + stepProgress * 0.18,
      at, false, Math.min(0.08, delay * 0.4)
    );
    if (delay > 0.13) {
      tickCount(
        baseProgress + stepProgress * 0.58,
        at + delay * 0.52, false, Math.min(0.08, delay * 0.35)
      );
    }

    // Result, green bullet, endpoint count and takeoff share this frame.
    build.set(item.result, { autoAlpha: 1 }, hit);
    build.fromTo(item.result, { x: 18 }, {
      x: 0, duration: Math.min(0.12, nextAt - hit),
      ease: "power4.out", immediateRender: false,
    }, hit);
    build.set(item.good, { autoAlpha: 1 }, hit);
    build.set(item.dull, { autoAlpha: 0 }, hit);
    build.fromTo(item.good, { scaleX: 2, scaleY: 2 }, {
      scaleX: 1, scaleY: 1,
      duration: 0.14, ease: "power4.out", immediateRender: false,
    }, hit);
    tickCount(
      (i + 1) / n * 0.93,
      hit, true, Math.min(0.15, Math.max(0.055, nextAt - hit - 0.01))
    );
    build.fromTo(item.target, { color: V.doneColor }, {
      color: targetColor,
      duration: Math.min(0.18, Math.max(0.07, nextAt - hit)),
      ease: "power3.out", immediateRender: false,
    }, hit);
    build.fromTo($("glow"), { opacity: 1 }, {
      opacity: 0.7,
      duration: Math.min(0.18, Math.max(0.07, nextAt - hit)),
      ease: "power3.out", immediateRender: false,
    }, hit);

    if (!hasPal) return;
    const pre = Math.min(0.065, delay * 0.3);
    const q = Math.max(
      0.055,
      Math.min(0.32, nextHit - hit - 0.035, D - 0.64 - hit)
    );
    // Kept low so the mascot's head never reaches the result row above it.
    const jump = M.cell * 0.9;
    const land = hit + q * 0.72;

    clawd.pose(build, hit - pre, { eyes: "right", arms: "down", legs: "stand" });
    build.to(pal, {
      y: 0, scaleX: 1.17, scaleY: 0.78,
      duration: pre, ease: "power3.in",
    }, hit - pre);
    clawd.pose(build, hit, {
      eyes: "right", arms: "down", legs: "stand",
    });
    build.to(pal, {
      y: -jump, scaleX: 0.95, scaleY: 1.06,
      duration: q * 0.36, ease: "power2.out",
    }, hit);
    build.to(pal, {
      y: 0, scaleX: 1.24, scaleY: 0.72,
      duration: q * 0.36, ease: "power3.in",
    }, hit + q * 0.36);
    clawd.pose(build, land, { eyes: "closed", arms: "down", legs: "stand" });
    build.to(pal, {
      scaleX: 1, scaleY: 1,
      duration: q * 0.28, ease: "power3.out",
    }, land);
    clawd.pose(build, hit + q, {
      eyes: "right", arms: "down", legs: "stand",
    });
  });

  const lastHit = hits.length ? hits[hits.length - 1] : enterLand;
  if (hasPal) {
    for (let at = lastHit + 0.38, i = 0; at + 0.26 <= D - 0.66; at += 0.5, i++) {
      clawd.pose(build, at, {
        eyes: "right", arms: "down", legs: "stand",
      });
      build.to(pal, {
        scaleX: 1.06, scaleY: 0.94,
        duration: 0.08, ease: "power2.in",
      }, at);
      build.to(pal, {
        scaleX: 1, scaleY: 1,
        duration: 0.15, ease: "power3.out",
      }, at + 0.08);
      clawd.blink(build, at + 0.1);
      clawd.pose(build, at + 0.25, { arms: "down" });
    }
  }

  const key = T.key;
  const hold = T.hold;
  const palX = W / 2 - clawd.width / 2;
  const palY = slabTop - palFootY;
  const finalBand = windows.length ? windows[windows.length - 1].band : firstBand;
  const finalHomeY = palAt(finalBand);
  const apex = Math.min(palY, finalHomeY) - M.cell * (compact ? 3.2 : 3.5);

  build.set(status, { autoAlpha: 0 }, D - 0.34);
  build.set(feed, { autoAlpha: 0 }, D - 0.28);
  rowEls.forEach((item) => {
    build.set(item.row, { autoAlpha: 0 }, D - 0.28);
  });
  build.set(box, { opacity: 0.28 }, D - 0.28);
  build.set(count, { textContent: countText(1) }, D);

  // Blank green mass arrives first. The words cut on at the exact impact,
  // after the slab has cleared the stage edge.
  gsap.set(slab, {
    y: H - slabTop + 48,
    scaleX: 0.96, scaleY: 1.08, autoAlpha: 0,
  });
  build.set(slab, { autoAlpha: 1 }, D - 0.2);
  build.to(slab, {
    y: -34, scaleX: 0.985, scaleY: 1.055,
    duration: 0.145, ease: "power4.out",
  }, D - 0.2);
  build.to(slab, {
    y: 0, scaleX: 1.045, scaleY: 0.89,
    duration: 0.055, ease: "power4.in",
  }, D - 0.055);

  if (hasPal) {
    // Keep travel separate from body deformation: the feet have a real floor.
    clawd.pose(build, D - 0.62, {
      eyes: "closed", arms: "down", legs: "stand",
    });
    build.to(pal, {
      x: 0, y: 0, scaleX: 1.3, scaleY: 0.62,
      duration: 0.15, ease: "power3.in",
    }, D - 0.62);
    clawd.pose(build, D - 0.47, {
      eyes: "open", arms: "up", legs: "stand",
    });
    build.to(pal, {
      scaleX: 0.85, scaleY: 1.22,
      duration: 0.065, ease: "power4.out",
    }, D - 0.47);
    build.to(palTrack, {
      x: palX, duration: 0.47, ease: "power3.inOut",
    }, D - 0.47);
    build.to(palTrack, {
      y: apex, duration: 0.25, ease: "power2.out",
    }, D - 0.47);
    build.to(palTrack, {
      y: palY, duration: 0.22, ease: "power3.in",
    }, D - 0.22);
    build.to(pal, {
      scaleX: 1, scaleY: 1,
      duration: 0.12, ease: "power2.in",
    }, D - 0.12);
  }

  build.timeScale(1 / T.scale);
  tl.add(build, 0);

  tl.set([doneLine, stats], { autoAlpha: 1 }, key);
  tl.to(slab, {
    scaleX: 0.992, scaleY: 1.025,
    duration: 0.09, ease: "power4.out",
  }, key);
  tl.to(slab, {
    scaleX: 1, scaleY: 1,
    duration: 0.17, ease: "power3.out",
  }, key + 0.09);
  tl.fromTo($("flash"), { opacity: 0.95 }, {
    opacity: 0, duration: 0.14, ease: "power4.out", immediateRender: false,
  }, key);
  tl.fromTo($("scene"), { y: 10 }, {
    y: 0, duration: 0.16, ease: "power4.out", immediateRender: false,
  }, key);

  if (hold > 0) {
    tl.to($("glow"), {
      opacity: 0.94, y: -24, scaleX: 1.1, scaleY: 1.06,
      duration: hold, ease: "sine.inOut",
    }, key);
    tl.fromTo(sheen, { xPercent: -150 }, {
      xPercent: 520,
      duration: Math.max(0.01, hold - 0.04),
      ease: "sine.inOut", immediateRender: false,
    }, key + Math.min(0.04, hold * 0.1));
  }

  if (hasPal) {
    tl.set(palTrack, { x: palX, y: palY }, key);
    tl.set(pal, { x: 0, y: 0, scaleX: 1.36, scaleY: 0.62 }, key);
    clawd.pose(tl, key, { eyes: "closed", arms: "up", legs: "stand" });
    tl.to(pal, {
      scaleX: 0.95, scaleY: 1.07,
      duration: 0.12, ease: "power4.out",
    }, key);
    clawd.pose(tl, key + 0.1, { eyes: "open" });
    tl.to(pal, {
      scaleX: 1, scaleY: 1,
      duration: 0.14, ease: "power3.out",
    }, key + 0.12);

    // Vertical, planted cheers: crouch, push off, hang, land, recover.
    // No flips, tilt or sideways teleporting.
    let offset = 0.42;
    let hop = 0;
    while (offset + 0.7 <= hold - 0.025) {
      const tall = hop % 2 === 1;
      const at = key + offset;
      const crouch = tall ? 0.12 : 0.1;
      const rise = tall ? 0.19 : 0.16;
      const fall = tall ? 0.18 : 0.15;
      const launch = at + crouch;
      const peak = launch + rise;
      const land = peak + fall;
      const jump = M.cell * (tall ? 4.8 : 3.1);

      clawd.pose(tl, at, {
        eyes: "closed", arms: "down", legs: "stand",
      });
      tl.to(pal, {
        scaleX: tall ? 1.28 : 1.2,
        scaleY: tall ? 0.66 : 0.76,
        duration: crouch, ease: "power3.in",
      }, at);
      clawd.pose(tl, launch, {
        eyes: tall ? "right" : "open",
        arms: "up", legs: "stand",
      });
      tl.to(pal, {
        y: -jump, scaleX: 0.9, scaleY: tall ? 1.18 : 1.1,
        duration: rise, ease: "power2.out",
      }, launch);
      tl.to(pal, {
        y: 0, scaleX: tall ? 1.3 : 1.23, scaleY: tall ? 0.64 : 0.73,
        duration: fall, ease: "power3.in",
      }, peak);
      clawd.pose(tl, land, { eyes: "closed", arms: "up", legs: "stand" });
      tl.to(pal, {
        scaleX: 0.97, scaleY: 1.035,
        duration: 0.08, ease: "power3.out",
      }, land);
      tl.to(pal, {
        scaleX: 1, scaleY: 1,
        duration: 0.09, ease: "power3.out",
      }, land + 0.08);
      clawd.pose(tl, land + 0.09, { eyes: "open", arms: "up" });
      offset += tall ? 0.8 : 0.76;
      hop++;
    }
  }

  // All particles remain behind the opaque slab, including its text.
  const sparks = $("sparks");
  const rnd = seeded(23);
  const palette = [V.accent, KIT.colors.shimmer, V.doneColor, V.textColor];
  const life = Math.max(1 / CA.fps, hold);
  const particleCount = compact ? 36 : 48;
  for (let i = 0; i < particleCount; i++) {
    const size = Math.round((compact ? 10 : 14) * (1 + Math.floor(rnd() * 2)));
    const particle = make("div", "spark", sparks);
    particle.style.cssText +=
      `;width:${size}px;height:${size}px;background:${palette[i % palette.length]}`;
    const x = W / 2 + (rnd() - 0.5) * (hasPal ? clawd.width : W * 0.3);
    const reach = (rnd() - 0.5) * W * 1.1;
    const liftY = (compact ? 100 : 170) + rnd() * (compact ? 240 : 340);
    const up = Math.min(life * 0.42, 0.24 + rnd() * 0.16);
    gsap.set(particle, { x, y: slabTop, autoAlpha: 0 });
    tl.set(particle, { autoAlpha: 1 }, key);
    tl.to(particle, {
      x: x + reach, duration: life, ease: "power3.out",
    }, key);
    tl.to(particle, {
      y: slabTop - liftY, duration: up, ease: "power3.out",
    }, key);
    tl.to(particle, {
      y: H + 60, duration: life - up, ease: "power2.in",
    }, key + up);
    tl.set(particle, { autoAlpha: 0 }, key + life);
  }

  const open = "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)";
  const shut = "polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)";
  if (variant === "overlay") {
    tl.fromTo(stageEl, { clipPath: shut }, {
      clipPath: open, duration: 0.16, ease: "power4.out",
    }, 0);
  }
  if (T.exit > 0) {
    tl.to(stageEl, {
      clipPath: shut,
      duration: Math.max(0, T.exit - 1 / CA.fps),
      ease: "power3.in",
    }, key + hold);
  }

  window.__timelines["block"] = tl;
});