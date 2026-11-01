CA.ready(() => {
  const {
    vars: V, stage: S, safe, time: T, variant,
    make, fit, rgba, seeded,
  } = CA;

  const $ = (id) => document.getElementById(id);
  const number = (value, fallback) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  };
  const clamp = (n, low, high) => Math.max(low, Math.min(high, n));
  const full = variant === "full";
  const overlay = variant === "overlay";
  const W = S.w;
  const H = S.h;
  const minimum = full ? 40 : 32;
  const stage = $("stage");

  const M = full ? {
    padding: 30,
    masthead: 64,
    headline: Math.max(80, number(V.headlineSize, 72) * 1.11),
    body: Math.max(88, number(V.bodySize, 42) * 2.1),
    meta: 40,
    ruleGap: 10,
    headingGap: 8,
    sectionGap: 12,
    bylineGap: 8,
    bodyGap: 24,
    postPadding: 24,
    postSize: Math.max(46, number(V.postSize, 40) * 1.15),
    postName: 44,
    postTextGap: 18,
    avatar: 76,
    tick: 30,
    postGap: 22,
    side: Math.max(48, number(safe.side, 48)) + 8,
    top: Math.max(230, number(safe.top, 230)) + 12,
    bottom: Math.max(300, number(safe.bottom, 300)) + 12,
    perspective: 1900,
  } : overlay ? {
    padding: 24,
    masthead: 52,
    headline: Math.max(62, number(V.headlineSize, 72) * 0.86),
    body: Math.max(66, number(V.bodySize, 42) * 1.57),
    meta: 32,
    ruleGap: 8,
    headingGap: 6,
    sectionGap: 8,
    bylineGap: 6,
    bodyGap: 16,
    postPadding: 20,
    postSize: Math.max(40, number(V.postSize, 40)),
    postName: 36,
    postTextGap: 12,
    avatar: 64,
    tick: 26,
    postGap: 18,
    side: Math.max(32, number(safe.side, 32)) + 8,
    top: Math.max(20, number(safe.top, 20)) + 8,
    bottom: Math.max(20, number(safe.bottom, 20)) + 8,
    perspective: 1500,
  } : {
    padding: 24,
    masthead: 54,
    headline: Math.max(64, number(V.headlineSize, 72) * 0.89),
    body: Math.max(68, number(V.bodySize, 42) * 1.62),
    meta: 32,
    ruleGap: 8,
    headingGap: 6,
    sectionGap: 8,
    bylineGap: 6,
    bodyGap: 16,
    postPadding: 20,
    postSize: Math.max(40, number(V.postSize, 40)),
    postName: 36,
    postTextGap: 12,
    avatar: 64,
    tick: 26,
    postGap: 18,
    side: Math.max(40, number(safe.side, 40)) + 8,
    top: Math.max(24, number(safe.top, 24)) + 8,
    bottom: Math.max(24, number(safe.bottom, 24)) + 8,
    perspective: 1500,
  };

  const colors = {
    "--hh-background": V.background,
    "--hh-paper": V.paper,
    "--hh-headline-ink": V.headlineInk,
    "--hh-body-ink": V.bodyInk,
    "--hh-muted": V.muted,
    "--hh-rule": V.rule,
    "--hh-section": V.sectionRed,
    "--hh-highlighter": V.highlighter,
    "--hh-highlighter-deep": V.highlighterDeep,
    "--hh-post-paper": V.postPaper,
    "--hh-avatar": V.avatarColor,
    "--hh-blue": V.verifiedBlue,
    "--hh-vignette": rgba(V.shadow, 0.82),
    "--hh-shadow-heavy": rgba(V.shadow, 0.48),
    "--hh-shadow-light": rgba(V.shadow, 0.25),
  };

  Object.entries(colors).forEach(([name, value]) => {
    stage.style.setProperty(name, value);
  });

  const px = (name, value) => {
    stage.style.setProperty("--hh-" + name, value + "px");
  };

  [
    ["padding", M.padding],
    ["masthead-size", M.masthead],
    ["headline-size", M.headline],
    ["body-size", M.body],
    ["meta-size", M.meta],
    ["rule-gap", M.ruleGap],
    ["heading-gap", M.headingGap],
    ["section-gap", M.sectionGap],
    ["byline-gap", M.bylineGap],
    ["body-gap", M.bodyGap],
    ["post-padding", M.postPadding],
    ["post-size", M.postSize],
    ["post-name-size", M.postName],
    ["post-text-gap", M.postTextGap],
    ["avatar-size", M.avatar],
    ["tick-size", M.tick],
  ].forEach(([name, value]) => px(name, value));

  [
    ["hh-masthead", V.masthead],
    ["hh-strapline", V.strapline],
    ["hh-edition", V.edition],
    ["hh-article-date", V.articleDate],
    ["hh-navigation", V.navigation],
    ["hh-section", V.section],
    ["hh-headline", V.headline],
    ["hh-byline", V.byline],
    ["hh-reading-time", V.readingTime],
    ["hh-footer", V.footer],
    ["hh-avatar", V.postInitials],
    ["hh-post-name", V.postName],
    ["hh-post-handle", V.postHandle],
    ["hh-post-date", V.postDate],
    ["hh-post-text", V.post],
  ].forEach(([id, value]) => {
    $(id).textContent = String(value == null ? "" : value);
  });

  if (!V.verified) $("hh-verified").style.display = "none";
  if (!$("hh-section").textContent.trim()) {
    $("hh-section-row").style.display = "none";
  }
  if (
    !$("hh-byline").textContent.trim() &&
    !$("hh-reading-time").textContent.trim()
  ) {
    $("hh-byline-row").style.display = "none";
  }

  // Lime belongs to the passage, never to the page perimeter.
  $("hh-proof-line").style.display = "none";
  $("hh-margin-diamond").style.display = "none";
  $("hh-rail-glint").style.display = "none";

  const wallRandom = seeded(214);
  const ghosts = [];
  const wallInset = -30;
  const cellW = (W - wallInset * 2) / 3;
  const cellH = (H - wallInset * 2) / 3;
  const ghostW = Math.max(1, cellW - 24);
  const ghostH = Math.max(1, cellH - 24);

  const rect = (x, y, w, h, color, opacity = 1) =>
    `<rect x="${x}" y="${y}" width="${Math.max(0, w)}" ` +
    `height="${Math.max(0, h)}" fill="${color}" opacity="${opacity}"/>`;

  for (let i = 0; i < 9; i += 1) {
    const ghost = make("div", "hh-ghost", $("hh-wall"));
    Object.assign(ghost.style, {
      left: wallInset + 12 + (i % 3) * cellW + "px",
      top: wallInset + 12 + Math.floor(i / 3) * cellH + "px",
      width: ghostW + "px",
      height: ghostH + "px",
    });

    const inset = Math.min(22, ghostW * 0.08);
    const contentW = Math.max(1, ghostW - inset * 2);
    const length = String(V[`backgroundHeadline${i + 1}`] || "").length;
    let shapes = rect(0, 0, ghostW, ghostH, V.backgroundPaper);
    shapes += rect(inset, 20, contentW, 4, V.headlineInk, 0.6);

    let y = 42;
    const rows = 2 + length % 2;

    for (let r = 0; r < rows && y + 14 < ghostH - 16; r += 1) {
      shapes += rect(
        inset, y,
        contentW * (r === rows - 1 ? 0.58 + length % 9 / 30 : 0.94),
        full ? 18 : 12,
        V.headlineInk, 0.65,
      );
      y += full ? 28 : 20;
    }

    y += 16;
    const photoH = Math.max(0, Math.min(ghostH * 0.27, ghostH - y - 24));

    if (photoH > 0) {
      shapes += rect(inset, y, contentW, photoH, V.photoColor);
      for (let b = 0; b < 6; b += 1) {
        const height = photoH * (0.25 + wallRandom() * 0.6);
        shapes += rect(
          inset + b * contentW / 6,
          y + photoH - height,
          contentW / 7, height,
          V.headlineInk, 0.2,
        );
      }
      y += photoH + 18;
    }

    while (y + 4 < ghostH - 18) {
      shapes += rect(
        inset, y,
        contentW * (0.65 + wallRandom() * 0.35),
        4, V.muted, 0.45,
      );
      y += 14;
    }

    ghost.innerHTML =
      `<svg xmlns="http://www.w3.org/2000/svg" ` +
      `viewBox="0 0 ${ghostW} ${ghostH}" aria-hidden="true">` +
      shapes + "</svg>";

    ghosts.push({
      el: ghost,
      dx: 12 + wallRandom() * 10,
      dy: 16 + wallRandom() * 12,
      rotation: (wallRandom() - 0.5) * 8,
    });
  }

  const paper = $("hh-paper");
  const planes = [$("hh-flight"), $("hh-shadow-plane")];
  const camera = $("hh-camera");
  const scene = $("hh-scene");
  const body = $("hh-body");
  const headline = $("hh-headline");
  const postRig = $("hh-post-rig");
  const postCard = $("hh-post-card");
  const postText = $("hh-post-text");

  const paragraph = String(V.paragraph || "").trim();
  const sentence = String(V.keySentence || "").trim();
  const selected = sentence && paragraph.includes(sentence)
    ? sentence
    : paragraph;

  body.replaceChildren();
  const key = make("span", "hh-key", body, selected);

  const paperW = Math.max(160, W - M.side * 2);
  const postW = paperW - (full ? 20 : 12);
  const innerW = paperW - M.padding * 2;
  const postInnerW = postW - M.postPadding * 2 - 2;

  paper.style.width = paperW + "px";
  planes.forEach((el) => { el.style.width = paperW + "px"; });
  postRig.style.width = postW + "px";

  fit($("hh-masthead"), innerW, minimum);
  fit($("hh-section"), innerW, minimum);
  fit($("hh-byline"), (innerW - 20) * 0.57, minimum);
  fit($("hh-reading-time"), (innerW - 20) * 0.43, minimum);

  const identityW = postInnerW - M.avatar - 16;
  fit(
    $("hh-post-name"),
    identityW - (V.verified ? M.tick + 10 : 0),
    minimum,
  );
  fit($("hh-avatar"), M.avatar - 10, minimum);
  fit(
    $("hh-post-handle"),
    Math.max(minimum * 3, identityW - $("hh-post-date").offsetWidth - 16),
    minimum,
  );

  /*
   * Choose whole-word lines at setup, before any camera transforms.
   * The minimum line count keeps the passage compact; equal line weights
   * prevent a short orphan tail. No text is reflowed during animation.
   */
  const measureContext = document.createElement("canvas").getContext("2d");

  function balanceLines(el, source, width) {
    const words = String(source || "").replace(/\s+/g, " ").trim().split(" ");
    if (!words[0]) {
      el.textContent = "";
      return;
    }

    const style = getComputedStyle(el);
    measureContext.font =
      `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    measureContext.fontKerning = "normal";
    const tracking = parseFloat(style.letterSpacing) || 0;
    const limit = Math.max(1, width * 0.985);
    const widths = new Map();

    const measure = (a, b) => {
      const token = a + ":" + b;
      if (!widths.has(token)) {
        const text = words.slice(a, b).join(" ");
        widths.set(
          token,
          measureContext.measureText(text).width +
            Math.max(0, text.length - 1) * tracking,
        );
      }
      return widths.get(token);
    };

    let lineCount = 0;
    for (let start = 0; start < words.length;) {
      let end = start + 1;
      while (end < words.length && measure(start, end + 1) <= limit) end++;
      start = end;
      lineCount++;
    }

    const memo = new Map();
    const weakEnd = /^(a|an|the|and|or|to|of|with|for|in|on)$/i;

    function solve(start, remaining) {
      if (start === words.length) {
        return remaining === 0 ? { cost: 0, breaks: [] } : null;
      }
      if (remaining < 1 || words.length - start < remaining) return null;

      const token = start + ":" + remaining;
      if (memo.has(token)) return memo.get(token);
      let best = null;

      for (let end = start + 1; end <= words.length; end++) {
        const widthHere = measure(start, end);
        if (widthHere > limit && end > start + 1) break;
        const tail = solve(end, remaining - 1);
        if (!tail) continue;

        const empty = Math.max(0, 1 - widthHere / limit);
        let cost = empty * empty * (remaining === 1 ? 1.5 : 1);
        if (end - start === 1 && words.length > 2) cost += 8;
        if (remaining > 1 && weakEnd.test(words[end - 1])) cost += 0.12;
        cost += tail.cost;

        if (!best || cost < best.cost) {
          best = { cost, breaks: [end, ...tail.breaks] };
        }
      }

      memo.set(token, best);
      return best;
    }

    const solution = solve(0, lineCount);
    const lines = [];
    let start = 0;

    if (solution) {
      solution.breaks.forEach((end) => {
        lines.push(words.slice(start, end).join(" "));
        start = end;
      });
    } else {
      lines.push(words.join(" "));
    }

    el.style.whiteSpace = "pre-line";
    el.style.textWrap = "wrap";
    el.textContent = lines.join("\n");
  }

  const headlineCopy = String(V.headline || "");
  const postCopy = String(V.post || "");

  function reflow() {
    balanceLines(headline, headlineCopy, innerW);
    balanceLines(key, selected, innerW);
    balanceLines(postText, postCopy, postInnerW);
  }

  const availableH = Math.max(100, H - M.top - M.bottom);
  const stackHeight = () =>
    paper.offsetHeight + M.postGap + postCard.offsetHeight;

  reflow();

  // Start large, then reduce the three reading sizes together only as needed.
  let headlineSize = M.headline;
  let bodySize = M.body;
  let postSize = M.postSize;

  for (let i = 0; i < 90 && stackHeight() > availableH; i++) {
    const nextHeadline = Math.max(minimum, headlineSize - 1);
    const nextBody = Math.max(minimum, bodySize - 1);
    const nextPost = Math.max(minimum, postSize - 0.5);

    if (
      nextHeadline === headlineSize &&
      nextBody === bodySize &&
      nextPost === postSize
    ) break;

    headlineSize = nextHeadline;
    bodySize = nextBody;
    postSize = nextPost;

    headline.style.fontSize = headlineSize + "px";
    body.style.fontSize = bodySize + "px";
    postText.style.fontSize = postSize + "px";
    reflow();
  }

  if (stackHeight() > availableH) {
    $("hh-byline-row").style.display = "none";
  }
  if (stackHeight() > availableH) {
    $("hh-section-row").style.display = "none";
  }

  const separateReceipt = stackHeight() > availableH;
  const paperH = paper.offsetHeight;
  const postH = postCard.offsetHeight;
  const paperLeft = (W - paperW) / 2;
  const soloTop = M.top + Math.max(0, (availableH - paperH) / 2);
  const paperTop = separateReceipt
    ? soloTop
    : M.top + Math.max(0, (availableH - stackHeight()) / 2);
  const postTop = separateReceipt
    ? M.top + Math.max(0, (availableH - postH) / 2)
    : paperTop + paperH + M.postGap;
  const soloShift = Math.max(0, soloTop - paperTop);

  planes.forEach((el) => {
    Object.assign(el.style, {
      left: paperLeft + "px",
      top: paperTop + "px",
      height: paperH + "px",
    });
  });

  postRig.style.left = paperLeft + paperW - postW - 4 + "px";
  postRig.style.top = postTop + "px";

  const bodyBox = $("hh-body-wrap").getBoundingClientRect();
  const focusY = paperTop + $("hh-body-wrap").offsetTop +
    body.offsetHeight * 0.45;

  scene.style.perspective = M.perspective + "px";
  scene.style.perspectiveOrigin = `50% ${focusY}px`;
  camera.style.transformOrigin = `50% ${focusY}px`;

  const range = document.createRange();
  range.selectNodeContents(key);

  const bodySizeActual = parseFloat(getComputedStyle(body).fontSize);
  const fragments = Array.from(range.getClientRects())
    .filter((r) => r.width > 0.5 && r.height > 0.5)
    .map((r) => ({
      x: r.left - bodyBox.left,
      y: r.top - bodyBox.top,
      w: r.width,
      h: r.height,
    }))
    .sort((a, b) => a.y - b.y || a.x - b.x);

  range.detach();

  const lines = [];
  fragments.forEach((fragment) => {
    const previous = lines[lines.length - 1];
    if (
      previous &&
      Math.abs(previous.y - fragment.y) < bodySizeActual * 0.22
    ) {
      const right = Math.max(
        previous.x + previous.w,
        fragment.x + fragment.w,
      );
      previous.x = Math.min(previous.x, fragment.x);
      previous.w = right - previous.x;
      previous.h = Math.max(previous.h, fragment.h);
    } else {
      lines.push({ ...fragment });
    }
  });

  const inkRandom = seeded(1988);
  const strokes = lines.map((line, index) => {
    const width = line.w + 12;
    const height = Math.max(20, bodySizeActual * 0.86);
    const x = line.x - 6;
    const y = line.y + line.h * 0.16;
    const mark = make("div", "hh-mark", $("hh-marks"));

    Object.assign(mark.style, {
      left: x + "px",
      top: y + "px",
      width: width + "px",
      height: height + "px",
    });

    const top = [];
    const bottom = [];
    const steps = Math.max(8, Math.ceil(width / 17));

    for (let p = 0; p <= steps; p++) {
      const u = p / steps;
      top.push([5 + (width - 12) * u, 1 + inkRandom() * 3]);
      bottom.push([
        1 + (width - 12) * u,
        height - 1 - inkRandom() * 3.3,
      ]);
    }

    const polygon = top.concat(bottom.reverse())
      .map(([a, b]) => `${a.toFixed(2)},${b.toFixed(2)}`)
      .join(" ");

    let streaks = "";
    for (let s = 0; s < 4; s++) {
      const sy = height * (0.18 + s * 0.19);
      streaks +=
        `<path d="M8 ${sy} Q${width * 0.48} ${sy + 0.9} ` +
        `${width - 10} ${sy - 0.5}" fill="none" ` +
        `stroke="${V.highlighterDeep}" ` +
        `stroke-width="${s % 2 ? 0.8 : 1.4}" opacity="0.3"/>`;
    }

    mark.innerHTML =
      `<svg xmlns="http://www.w3.org/2000/svg" ` +
      `viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">` +
      `<polygon points="${polygon}" fill="${V.highlighter}" opacity="0.96"/>` +
      `<path d="M5 3 L19 1 L16 ${height - 3} L2 ${height - 1}Z" ` +
      `fill="${V.highlighterDeep}" opacity="0.48"/>` +
      `<path d="M4 ${height * 0.66} L${width - 7} ${height * 0.6} ` +
      `L${width - 12} ${height - 2} L2 ${height - 2}Z" ` +
      `fill="${V.highlighterDeep}" ` +
      `opacity="${index === lines.length - 1 ? 0.5 : 0.24}"/>` +
      streaks + "</svg>";

    const nib = make("div", "hh-nib", $("hh-marks"));
    nib.style.top = y + "px";
    nib.style.height = height + "px";

    return { mark, nib, x, width };
  });

  const margin = $("hh-margin-mark");
  margin.style.width = full ? "5px" : "4px";

  if (lines.length) {
    const first = lines[0];
    const last = lines[lines.length - 1];
    margin.style.left = full ? "-16px" : "-13px";
    margin.style.top = first.y + bodySizeActual * 0.17 + "px";
    margin.style.height =
      last.y - first.y + bodySizeActual * 0.88 + "px";
  }

  const D = T.design;
  const K = T.key;
  const requestedPush = clamp(number(V.pushIn, 1.14), 1.04, 1.3);
  const approach = 1 + (requestedPush - 1) * (full ? 0.65 : 0.5);
  const entranceY = Math.min(
    full ? 100 : 64,
    Math.max(24, (availableH - paperH) * 0.28),
  );
  const impactScale = Math.max(1, Math.min(
    1.016,
    (W - 2 * Math.max(24, number(safe.side, 24))) / paperW,
  ));
  const impactZ = M.perspective * (1 - 1 / impactScale);

  const tl = gsap.timeline({ paused: true });
  const build = gsap.timeline({ paused: true });

  gsap.set(planes, {
    autoAlpha: 1,
    x: Math.min(64, M.side * 0.8),
    y: entranceY,
    z: -36,
    rotationX: 16,
    rotationY: -8,
    rotationZ: -3.2,
  });

  gsap.set(camera, {
    z: -M.perspective * (approach - 1),
    y: soloShift,
  });
  gsap.set(postRig, { autoAlpha: 0 });
  gsap.set(margin, { visibility: "hidden", scaleY: 0 });

  strokes.forEach(({ mark, nib, x }) => {
    gsap.set(mark, {
      visibility: "hidden",
      clipPath: "inset(0 100% 0 0)",
    });
    gsap.set(nib, { visibility: "hidden", x });
  });

  // One directional attack, a restrained counter-swing, then a long dolly.
  build.to(planes, {
    x: -5,
    y: -10,
    z: 10,
    rotationX: -2.4,
    rotationY: 1.6,
    rotationZ: 0.65,
    duration: D * 0.19,
    ease: "power4.out",
  }, 0);

  build.to(planes, {
    x: 0,
    y: 0,
    z: 0,
    rotationX: 0.65,
    rotationY: -0.45,
    rotationZ: -0.3,
    duration: D * 0.19,
    ease: "power2.out",
  }, D * 0.19);

  build.to(camera, {
    z: 0,
    duration: D * 0.62,
    ease: "sine.inOut",
  }, D * 0.15);

  const sweepStart = D * 0.43;
  const sweepBudget = D - sweepStart;
  const count = strokes.length;

  if (count) {
    const pause = Math.min(0.065, sweepBudget / (count * 6));
    const run = (sweepBudget - pause * (count - 1)) / count;

    strokes.forEach((stroke, index) => {
      const at = sweepStart + index * (run + pause);

      build.set(stroke.mark, { visibility: "visible" }, at);
      build.to(stroke.mark, {
        clipPath: "inset(0 0% 0 0)",
        duration: run,
        ease: "power2.out",
      }, at);

      build.set(stroke.nib, { visibility: "visible" }, at);
      build.to(stroke.nib, {
        x: stroke.x + stroke.width - 10,
        duration: run,
        ease: "power2.out",
      }, at);
      build.set(stroke.nib, { visibility: "hidden" }, at + run);
    });

    const impactRun = Math.min(0.12, D * 0.055);
    build.set(margin, { visibility: "visible" }, D - impactRun);
    build.to(margin, {
      scaleY: 1,
      duration: impactRun,
      ease: "power3.out",
    }, D - impactRun);

    build.to(camera, {
      z: impactZ,
      duration: impactRun,
      ease: "power3.out",
    }, D - impactRun);
  }

  build.timeScale(1 / T.scale);
  build.paused(false);
  tl.add(build, 0);

  // The wall continues through the entire hold; reading text stays fixed.
  ghosts.forEach((ghost, index) => {
    const direction = index % 2 ? 1 : -1;
    tl.fromTo(ghost.el, {
      x: -ghost.dx * direction,
      y: ghost.dy,
      rotation: ghost.rotation,
    }, {
      x: ghost.dx * direction,
      y: -ghost.dy,
      rotation: ghost.rotation + direction * 0.8,
      duration: T.duration,
      ease: "none",
    }, 0);
  });

  if (T.hold > 0) {
    const q = Math.min(1, T.hold / 1.2);
    const settle = 0.18 * q;
    const dockAt = K + 0.06 * q;
    const dockDuration = 0.24 * q;
    const postAt = K + 0.4 * q;

    tl.to(camera, {
      z: 0,
      duration: settle,
      ease: "power3.out",
    }, K);

    if (!separateReceipt) {
      tl.to(camera, {
        y: 0,
        duration: dockDuration,
        ease: "power2.inOut",
      }, dockAt);
    } else {
      tl.set(planes, { autoAlpha: 0 }, postAt);
    }

    // A visible reading beat separates the completed ink from the receipt.
    tl.set(postRig, { autoAlpha: 1 }, postAt);
    tl.fromTo(postRig, {
      x: full ? 20 : 14,
      y: full ? 54 : 38,
      scaleX: 0.9,
      scaleY: 0.9,
      rotation: 2.8,
    }, {
      x: -2,
      y: -5,
      scaleX: 1.018,
      scaleY: 1.018,
      rotation: -1.1,
      duration: 0.16 * q,
      ease: "power4.out",
      immediateRender: false,
    }, postAt);

    // Scale lands first; the independent paper tilt finishes a beat later.
    tl.to(postRig, {
      x: 0,
      y: 0,
      scaleX: 1,
      scaleY: 1,
      duration: 0.14 * q,
      ease: "power2.out",
    }, postAt + 0.16 * q);

    tl.to(postRig, {
      rotation: 0.35,
      duration: 0.25 * q,
      ease: "power2.out",
    }, postAt + 0.16 * q);

    tl.to($("hh-paper-shadow"), {
      opacity: 0.88,
      duration: Math.max(0.01, T.hold - settle),
      ease: "sine.inOut",
    }, K + settle);
  }

  const open = "inset(0% 0% 0% 0%)";
  const closed = "inset(50% 0% 50% 0%)";

  if (overlay) {
    tl.fromTo(stage, {
      clipPath: closed,
    }, {
      clipPath: open,
      duration: Math.min(0.18, K * 0.16),
      ease: "power4.out",
    }, 0);
  }

  if (T.exit > 0) {
    const exitAt = K + T.hold;
    const exitDuration = Math.max(0, T.exit - 1 / CA.fps);

    if (exitDuration > 0) {
      tl.fromTo(stage, {
        clipPath: open,
      }, {
        clipPath: closed,
        duration: exitDuration,
        ease: "power3.in",
        immediateRender: false,
      }, exitAt);
    } else {
      tl.set(stage, { clipPath: closed }, exitAt);
    }
  }

  window.__timelines["block"] = tl;
});