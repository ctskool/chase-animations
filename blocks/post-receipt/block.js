CA.ready(() => {
  const {
    vars: V, stage: S, safe, time: T, variant,
    make, fit, seeded, grainUrl, parseStat, formatStat,
  } = CA;

  const $ = (id) => document.getElementById(id);
  const stage = $("stage");
  const full = variant === "full";
  const W = S.w;
  const H = S.h;
  const minimum = full ? 40 : 32;
  const svgNS = "http://www.w3.org/2000/svg";
  const impactScale = 1.055;
  const keyImpactScale = 1.09;
  const integer = (n) => Math.max(0, Math.round(Number(n) || 0));
  const numberText = (n) => integer(n).toLocaleString("en-US");
  const normalized = (s) =>
    String(s || "").replace(/\s+/g, " ").trim().toLowerCase();

  const layouts = {
    full: {
      mainPad: 32, quotePad: 24, radius: 28,
      avatar: 96, quoteAvatar: 76, initials: 40,
      name: 48, quoteName: 44, small: 40,
      post: 88, keySize: 116, quotePost: 64, count: 40,
      check: 30, icon: 36, iconGap: 9,
      headGap: 20, quoteHeadGap: 16, quoteIdentityGap: 18,
      postGap: 24, paragraphGap: 22,
      timestampGap: 26, ruleGap: 16, metricGap: 18,
      quotePostGap: 12, embeddedGap: 12,
      gap: 24, offset: 12, markerHeight: 26,
      maxPost: 100, maxKey: 132, maxQuote: 72,
    },
    top: {
      mainPad: 22, quotePad: 18, radius: 23,
      avatar: 76, quoteAvatar: 56, initials: 32,
      name: 40, quoteName: 36, small: 32,
      post: 56, keySize: 76, quotePost: 46, count: 32,
      check: 24, icon: 28, iconGap: 7,
      headGap: 16, quoteHeadGap: 12, quoteIdentityGap: 14,
      postGap: 16, paragraphGap: 14,
      timestampGap: 20, ruleGap: 10, metricGap: 12,
      quotePostGap: 8, embeddedGap: 8,
      gap: 18, offset: 8, markerHeight: 20,
      maxPost: 64, maxKey: 86, maxQuote: 52,
    },
    overlay: {
      mainPad: 24, quotePad: 18, radius: 25,
      avatar: 80, quoteAvatar: 60, initials: 32,
      name: 42, quoteName: 36, small: 32,
      post: 60, keySize: 80, quotePost: 48, count: 34,
      check: 26, icon: 30, iconGap: 8,
      headGap: 16, quoteHeadGap: 12, quoteIdentityGap: 14,
      postGap: 18, paragraphGap: 16,
      timestampGap: 22, ruleGap: 12, metricGap: 14,
      quotePostGap: 10, embeddedGap: 9,
      gap: 20, offset: 10, markerHeight: 22,
      maxPost: 68, maxKey: 90, maxQuote: 54,
    },
  };
  const M = layouts[variant] || layouts.top;

  Object.entries({
    paper: V.paper,
    ink: V.ink,
    muted: V.muted,
    metric: V.metricInk,
    line: V.lineColor,
    blue: V.blue,
    "depth-color": V.depthColor,
  }).forEach(([key, value]) => {
    stage.style.setProperty("--pr-" + key, value);
  });

  const pixelVars = {
    "main-pad": M.mainPad,
    "quote-pad": M.quotePad,
    radius: M.radius,
    avatar: M.avatar,
    "quote-avatar": M.quoteAvatar,
    initials: M.initials,
    name: M.name,
    "quote-name": M.quoteName,
    small: M.small,
    post: M.post,
    "key-size": M.keySize,
    "quote-post": M.quotePost,
    count: M.count,
    check: M.check,
    icon: M.icon,
    "icon-gap": M.iconGap,
    "head-gap": M.headGap,
    "quote-head-gap": M.quoteHeadGap,
    "quote-identity-gap": M.quoteIdentityGap,
    "post-gap": M.postGap,
    "paragraph-gap": M.paragraphGap,
    "timestamp-gap": M.timestampGap,
    "rule-gap": M.ruleGap,
    "metric-gap": M.metricGap,
    "quote-post-gap": M.quotePostGap,
    "embedded-gap": M.embeddedGap,
    "marker-height": M.markerHeight,
  };

  const flexible = new Set([
    "main-pad", "quote-pad", "post-gap", "paragraph-gap",
    "timestamp-gap", "rule-gap", "metric-gap",
    "quote-post-gap", "embedded-gap",
  ]);

  function applySpacing(factor) {
    Object.entries(pixelVars).forEach(([key, value]) => {
      stage.style.setProperty(
        "--pr-" + key,
        (flexible.has(key) ? value * factor : value) + "px",
      );
    });
  }
  applySpacing(1);

  $("pr-field").style.backgroundImage =
    `linear-gradient(145deg, ${V.fieldTop}, ${V.fieldBottom})`;
  $("pr-depth").style.backgroundImage =
    `radial-gradient(ellipse at 75% 70%, ${V.depthColor} 0%, transparent 62%)`;
  $("pr-grain").style.backgroundImage = grainUrl(192, 0.5, 47);

  function svg(className, viewBox) {
    const el = document.createElementNS(svgNS, "svg");
    el.setAttribute("class", className);
    el.setAttribute("viewBox", viewBox);
    el.setAttribute("aria-hidden", "true");
    return el;
  }

  function path(parent, d, attributes = {}) {
    const el = document.createElementNS(svgNS, "path");
    el.setAttribute("d", d);
    Object.entries(attributes).forEach(([key, value]) => {
      el.setAttribute(key, String(value));
    });
    parent.appendChild(el);
    return el;
  }

  // Both the SVG and its strokes stay inside the actual stage.
  // Movement travels along the path rather than moving an oversized element.
  const orbit = svg("", "0 0 1080 1920");
  orbit.setAttribute("preserveAspectRatio", "none");
  const orbitD =
    "M540 100C810 100 1000 480 1000 960" +
    "C1000 1440 810 1820 540 1820" +
    "C270 1820 80 1440 80 960" +
    "C80 480 270 100 540 100Z";
  path(orbit, orbitD, { class: "pr-orbit-track" });
  const orbitTrace = path(orbit, orbitD, { class: "pr-orbit-trace" });
  $("pr-orbit").appendChild(orbit);

  function icon(kind, parent) {
    const el = svg("pr-icon", "0 0 32 32");
    el.setAttribute("fill", "none");
    el.setAttribute("stroke", "currentColor");
    el.setAttribute("stroke-width", "2.1");
    el.setAttribute("stroke-linecap", "round");
    el.setAttribute("stroke-linejoin", "round");

    const shapes = {
      replies: "M26 14.5c0 6-4.5 10-11 10H8l-5 4v-9c-1-1.6-1.5-3.1-1.5-5C1.5 8 7 4 14 4s12 4 12 10.5Z",
      reposts: "M6 11h18l-5-5M24 11V7M26 21H8l5 5M8 21v4M6 11v8M26 21v-8",
      likes: "M16 27S3 19 3 10.5C3 3 12 2 16 9c4-7 13-6 13 1.5C29 19 16 27 16 27Z",
      views: "M5 26V17M12 26V10M19 26V4M26 26V13",
    };
    const p = path(el, shapes[kind]);
    parent.appendChild(el);
    return { el, path: p };
  }

  function badge(parent) {
    const el = svg("pr-check", "0 0 28 28");
    path(el, "M14 1l3.2 2.1 3.8.2 1.6 3.5 3.1 2.3-.6 3.8.6 3.8-3.1 2.3-1.6 3.5-3.8.2L14 25l-3.2-2.1-3.8-.2-1.6-3.5-3.1-2.3.6-3.8-.6-3.8 3.1-2.3L7 3.5l3.8-.2Z", {
      fill: "currentColor",
    });
    path(el, "M8.4 13.2l3.7 3.7 7.5-7.5", {
      fill: "none",
      stroke: V.paper,
      "stroke-width": 2.8,
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    });
    parent.appendChild(el);
  }

  const fitJobs = [];

  function header(parent, data, quote) {
    const head = make("div", "pr-header", parent);
    const avatar = make("div", "pr-avatar", head);
    avatar.style.backgroundColor = data.color;
    const initials = make("span", "pr-initials", avatar, data.initials);
    const identity = make("div", "pr-identity", head);
    const nameRow = make("div", "pr-name-row", identity);
    const name = make("span", "pr-name", nameRow, data.author);
    if (data.verified) badge(nameRow);

    const meta = make("div", "pr-meta", identity);
    const handle = make("span", "pr-handle", meta, data.handle);
    const company = data.company
      ? make("span", "pr-company", meta, data.company)
      : null;

    fitJobs.push(() => {
      const avatarWidth = quote ? M.quoteAvatar : M.avatar;
      const needed = Math.ceil(initials.getBoundingClientRect().width + 8);
      avatar.style.width = Math.max(avatarWidth, needed) + "px";
      avatar.style.height = Math.max(avatarWidth, needed) + "px";

      name.style.fontSize = "";
      handle.style.fontSize = "";
      if (company) company.style.fontSize = "";

      const room = identity.clientWidth;
      fit(name, Math.max(minimum * 2, room - (data.verified ? M.check + 10 : 0)), minimum);
      fit(handle, Math.max(minimum * 2, room), minimum);
      if (company) fit(company, Math.max(minimum * 2, room - 18), minimum);
    });
  }

  const post = $("pr-main");
  header(post, {
    author: V.author,
    initials: V.initials,
    handle: V.handle,
    company: V.company,
    verified: V.verified,
    color: V.avatar1,
  }, false);

  const postBody = make("div", "pr-post", post);
  const key = String(V.keyLine || "");
  let highlighted = null;
  let marker = null;

  String(V.postText || "").split(/\n\s*\n/).forEach((paragraph) => {
    const p = make("p", "pr-paragraph", postBody);
    const index = key && !highlighted ? paragraph.indexOf(key) : -1;
    if (index < 0) {
      p.textContent = paragraph;
      return;
    }

    p.appendChild(document.createTextNode(paragraph.slice(0, index)));
    highlighted = make("span", "pr-key-line", p, key);
    p.appendChild(document.createTextNode(paragraph.slice(index + key.length)));

    marker = svg("pr-marker", "0 0 1000 24");
    marker.setAttribute("preserveAspectRatio", "none");

    const random = seeded(118);
    const upper = [];
    const lower = [];
    for (let i = 0; i <= 25; i++) {
      const x = i * 40;
      upper.push([x, 4 + Math.sin(i * 0.8) * 1.6 + random() * 2]);
      lower.push([x, 18 + Math.sin(i * 0.73) * 1.5 + random() * 2]);
    }
    path(
      marker,
      "M" + upper.map((point) => point.join(",")).join(" L") +
        " L" + lower.reverse().map((point) => point.join(",")).join(" L") + " Z",
      { fill: V.red },
    );
    highlighted.appendChild(marker);
  });

  const timestamp = make("span", "pr-timestamp", post, V.timestamp);
  make("div", "pr-rule", post);
  const metricRow = make("div", "pr-metrics", post);

  const metrics = ["replies", "reposts", "likes", "views"].map((kind) => {
    const row = make("div", "pr-metric", metricRow);
    const shape = icon(kind, row);
    const start = integer(V[kind + "Start"]);
    const end = integer(V[kind + "End"]);
    const count = make("span", "pr-count", row, numberText(start));
    return {
      kind, row, count, start, end,
      icon: shape.el,
      path: shape.path,
      finalText: numberText(end),
    };
  });

  const embeddedSeen = [];
  const originalText = normalized(V.postText);

  function makeQuote(index) {
    const card = $("pr-q" + index);
    header(card, {
      author: V[`quote${index}Author`],
      initials: V[`quote${index}Initials`],
      handle: V[`quote${index}Handle`],
      color: V["avatar" + (index + 1)],
    }, true);

    make("div", "pr-post", card, V[`quote${index}Text`]);

    const embedded = String(V[`quote${index}Embedded`] || "").trim();
    const attribution = String(V[`quote${index}Attribution`] || "").trim();
    const normalizedEmbedded = normalized(embedded);
    const repeatsOriginal = normalizedEmbedded &&
      originalText.includes(normalizedEmbedded);
    const repeatsQuote = normalizedEmbedded &&
      normalized(V[`quote${index}Text`]).includes(normalizedEmbedded);
    const repeatsOtherEmbed = embeddedSeen.includes(normalizedEmbedded);

    if (normalizedEmbedded && !repeatsOriginal && !repeatsQuote && !repeatsOtherEmbed) {
      const box = make("div", "pr-embedded", card);
      const authorText = normalized(V.author);
      const repeatsAuthor = authorText &&
        normalized(attribution).includes(authorText);

      if (attribution && !repeatsAuthor) {
        make("span", "pr-attribution", box, attribution);
      }
      make("span", "pr-embedded-text", box, embedded);
      embeddedSeen.push(normalizedEmbedded);
    }

    const likesText = String(V[`quote${index}Likes`] || "").trim();
    let likes = null;
    if (likesText) {
      const row = make("div", "pr-quote-likes", card);
      const heart = icon("likes", row);
      const count = make("span", "pr-count", row, likesText);
      likes = {
        count,
        heart: heart.el,
        stat: parseStat(likesText),
        text: likesText,
      };
    }

    return {
      card,
      motion: $("pr-q" + index + "-motion"),
      likes,
    };
  }

  const quotes = [makeQuote(1), makeQuote(2)];
  const side = full
    ? Math.max(56, safe.side)
    : Math.max(32, Math.min(40, safe.side));
  const cardWidth = Math.min(full ? 968 : 1016, W - side * 2);
  const quoteWidth = cardWidth - M.offset;
  const left = (W - cardWidth) / 2;

  post.style.width = cardWidth + "px";
  quotes.forEach((q) => {
    q.motion.style.width = quoteWidth + "px";
  });

  const setup = $("pr-setup");
  const setupText = String(V.setupLine || "").trim();
  let setupHeight = 0;

  if (setupText) {
    setup.textContent = setupText;
    setup.style.visibility = "visible";
    fit(setup, W - side * 2, minimum);
    setupHeight = setup.offsetHeight + (full ? 20 : 12);
  }

  const topLimit = full ? Math.max(242, safe.top + 12) : 24;
  const bottomMargin = full ? Math.max(300, safe.bottom) : 24;
  const available = Math.max(1, H - topLimit - bottomMargin - setupHeight);

  function fitReadingFields() {
    fitJobs.forEach((job) => job());

    const pad = parseFloat(
      getComputedStyle(stage).getPropertyValue("--pr-main-pad"),
    ) || 0;
    const room = cardWidth - pad * 2 - 6;

    timestamp.style.fontSize = "";
    fit(timestamp, room, minimum);

    if (highlighted) {
      highlighted.style.fontSize = "";
      fit(highlighted, room / (keyImpactScale + 0.015), minimum);
    }
  }

  function measure() {
    const mainH = post.offsetHeight;
    const quoteHeights = quotes.map((q) => q.card.offsetHeight);
    const total = mainH + quoteHeights[0] + quoteHeights[1] + M.gap * 2;
    const headroom = Math.ceil(mainH * (impactScale - 1)) + 4;
    return {
      mainH,
      quoteHeights,
      total,
      headroom,
      occupied: total + headroom,
    };
  }

  // Reserve complete grouped numbers before measuring the final stack.
  metrics.forEach((m) => {
    const digits = Math.max(String(m.start).length, String(m.end).length);
    const candidates = [
      numberText(m.start),
      numberText(m.end),
      numberText(Number("8".repeat(Math.min(15, digits)))),
    ];
    let width = 0;
    candidates.forEach((text) => {
      m.count.textContent = text;
      width = Math.max(width, m.count.getBoundingClientRect().width);
    });
    m.count.style.width = Math.ceil(width + 2) + "px";
    m.count.textContent = numberText(m.start);
  });

  quotes.forEach((q) => {
    if (!q.likes) return;
    q.likes.count.style.width =
      Math.ceil(q.likes.count.getBoundingClientRect().width + 3) + "px";
    if (q.likes.stat && Number.isFinite(q.likes.stat.value)) {
      q.likes.count.textContent = formatStat(q.likes.stat, 0);
    }
  });

  fitReadingFields();
  let geometry = measure();
  let spacing = 1;

  const growingKeys = [
    ["post", M.maxPost],
    ["key-size", M.maxKey],
    ["quote-post", M.maxQuote],
  ];

  for (let i = 0; i < 8 && geometry.occupied < available * 0.95; i++) {
    const previous = growingKeys.map(([name]) => pixelVars[name]);
    growingKeys.forEach(([name, maximum]) => {
      pixelVars[name] = Math.min(maximum, pixelVars[name] + 2);
    });

    applySpacing(spacing);
    fitReadingFields();
    const candidate = measure();

    if (candidate.occupied > available) {
      growingKeys.forEach(([name], index) => {
        pixelVars[name] = previous[index];
      });
      applySpacing(spacing);
      fitReadingFields();
      geometry = measure();
      break;
    }
    geometry = candidate;
  }

  for (let i = 1; i <= 10 && geometry.occupied > available; i++) {
    spacing = 1 - i * 0.05;
    applySpacing(spacing);
    fitReadingFields();
    geometry = measure();
  }

  for (let i = 0; i < 48 && geometry.occupied > available; i++) {
    const before = pixelVars.post + pixelVars["key-size"] + pixelVars["quote-post"];
    ["post", "key-size", "quote-post"].forEach((name) => {
      pixelVars[name] = Math.max(minimum, pixelVars[name] - 2);
    });
    applySpacing(spacing);
    fitReadingFields();
    geometry = measure();
    const after = pixelVars.post + pixelVars["key-size"] + pixelVars["quote-post"];
    if (before === after) break;
  }

  const spare = Math.max(0, available - geometry.occupied);
  const top = topLimit + setupHeight + geometry.headroom + spare * 0.35;

  setup.style.top = topLimit + spare * 0.35 + "px";
  gsap.set(setup, { xPercent: -50 });

  Object.assign(post.style, {
    left: left + "px",
    top: top + "px",
  });

  const mainShadow = $("pr-main-shadow");
  Object.assign(mainShadow.style, {
    left: left + "px",
    top: top + "px",
    width: cardWidth + "px",
    height: geometry.mainH + "px",
  });

  let y = top + geometry.mainH + M.gap;
  quotes.forEach((q, index) => {
    Object.assign(q.motion.style, {
      left: left + (index === 0 ? 0 : M.offset) + "px",
      top: y + "px",
      height: geometry.quoteHeights[index] + "px",
    });
    y += geometry.quoteHeights[index] + M.gap;
  });

  const tl = gsap.timeline({ paused: true });
  const build = gsap.timeline();
  const D = T.design;
  const mainTargets = [post, mainShadow];
  const firstLanding = D * 0.43;
  const secondLanding = D * 0.73;
  const arrivalRun = Math.min(0.3, D * 0.1);
  const firstArrival = firstLanding - arrivalRun;
  const entryDuration = Math.min(0.28, D * 0.085);
  const firstCountAt = Math.max(D * 0.12, entryDuration + 0.06);
  const liftEnd = firstArrival - Math.min(0.08, D * 0.02);
  const liftDuration = Math.min(0.3, D * 0.1);
  const initialDrop = Math.max(
    0,
    Math.min(full ? 260 : 150, (geometry.total - geometry.mainH) * 0.44),
  );
  const liked = metrics.find((m) => m.kind === "likes");

  gsap.set(quotes.map((q) => q.motion), { autoAlpha: 0 });
  if (marker) gsap.set(marker, { scaleX: 0, autoAlpha: 0 });

  // This scale tween ends before the first count punch begins.
  build.fromTo(mainTargets, {
    y: initialDrop + 48,
    scaleX: 0.97,
    scaleY: 0.97,
  }, {
    y: initialDrop,
    scaleX: 1,
    scaleY: 1,
    duration: entryDuration,
    ease: "back.out(1.25)",
  }, 0);

  // Complete the lift before any first-reply text becomes visible.
  build.to(mainTargets, {
    y: 0,
    duration: liftDuration,
    ease: "power4.out",
  }, liftEnd - liftDuration);

  function fraction(m, amount) {
    return integer(m.start + (m.end - m.start) * amount);
  }

  function countSegment(m, from, to, at, duration) {
    build.fromTo(m.count, {
      textContent: from,
    }, {
      textContent: to,
      duration,
      ease: "power4.out",
      immediateRender: false,
      modifiers: {
        textContent: (value) =>
          numberText(Number(String(value).replace(/,/g, ""))),
      },
    }, at);
    build.set(m.count, { textContent: numberText(to) }, at + duration);

    const endpointColor =
      m.kind === "likes" && at >= firstLanding ? V.red : V.ink;
    const restingColor =
      m.kind === "likes" && at >= firstLanding ? V.red : V.metricInk;
    build.set(m.count, { color: endpointColor }, at + duration);
    build.to(m.count, {
      color: restingColor,
      duration: Math.min(0.14, D * 0.04),
      ease: "power2.out",
    }, at + duration);
  }

  const finalAttack = Math.min(0.22, D * 0.065);
  const finalCountAt = D - finalAttack;

  metrics.forEach((m) => {
    countSegment(m, m.start, fraction(m, 0.38), firstCountAt, D * 0.09);
    countSegment(m, fraction(m, 0.38), fraction(m, 0.66), firstLanding, D * 0.045);
    countSegment(m, fraction(m, 0.66), fraction(m, 0.84), secondLanding, D * 0.045);

    // Final count has no trailing build tween beyond the key moment.
    build.fromTo(m.count, {
      textContent: fraction(m, 0.84),
    }, {
      textContent: m.end,
      duration: finalAttack,
      ease: "power4.out",
      immediateRender: false,
      modifiers: {
        textContent: (value) =>
          numberText(Number(String(value).replace(/,/g, ""))),
      },
    }, finalCountAt);
    build.set(m.count, {
      textContent: m.finalText,
      color: m.kind === "likes" ? V.red : V.ink,
    }, D);
  });

  build.set(liked.row, { color: V.red }, firstLanding);
  build.set(liked.path, { fill: V.red }, firstLanding);

  function pulse(target, at, strength, duration = 0.24) {
    const attack = Math.min(0.055, duration * 0.3);
    build.to(target, {
      scaleX: strength,
      scaleY: strength,
      duration: attack,
      ease: "power4.out",
    }, at);
    build.to(target, {
      scaleX: 1,
      scaleY: 1,
      duration: Math.max(0.001, duration - attack),
      ease: "back.out(1.5)",
    }, at + attack);
  }

  function cardResponse(at) {
    const duration = Math.min(0.24, D * 0.07);
    pulse(mainTargets, at, 1.012, duration);
    build.set(post, { borderColor: V.metricInk }, at);
    build.to(post, {
      borderColor: V.lineColor,
      duration: duration - 0.02,
      ease: "power2.out",
    }, at + 0.02);
  }

  cardResponse(firstCountAt);
  cardResponse(firstLanding);
  cardResponse(secondLanding);
  pulse(liked.icon, firstLanding, 1.4);
  pulse(metrics[0].icon, secondLanding, 1.32);
  pulse(liked.icon, secondLanding, 1.3);

  quotes.forEach((q, index) => {
    const landing = index === 0 ? firstLanding : secondLanding;
    const at = landing - arrivalRun;
    const direction = index === 0 ? -1 : 1;

    // The small offset fits inside the side and bottom margins.
    // No rotation can swing a reply into the preceding card.
    build.set(q.motion, { autoAlpha: 1 }, at);
    build.fromTo(q.motion, {
      x: direction * 24,
      y: 12,
      scaleX: 0.98,
      scaleY: 0.98,
    }, {
      x: 0,
      y: 0,
      scaleX: 1,
      scaleY: 1,
      duration: arrivalRun,
      ease: "power4.out",
      immediateRender: false,
    }, at);

    build.to(q.motion, {
      scaleX: 1.006,
      scaleY: 0.985,
      duration: 0.055,
      ease: "power3.out",
    }, landing);
    build.to(q.motion, {
      scaleX: 1,
      scaleY: 1,
      duration: 0.18,
      ease: "back.out(1.4)",
    }, landing + 0.055);

    if (!q.likes) return;
    const { count, heart, stat, text } = q.likes;
    if (stat && Number.isFinite(stat.value)) {
      build.fromTo(count, {
        textContent: 0,
      }, {
        textContent: stat.value,
        duration: D * 0.045,
        ease: "power4.out",
        immediateRender: false,
        modifiers: {
          textContent: (value) => formatStat(
            stat,
            Number(String(value).replace(/,/g, "")),
          ),
        },
      }, landing);
    }
    build.set(count, { textContent: text }, landing + D * 0.045);
    pulse(heart, landing, 1.25);
  });

  if (marker) {
    build.set(marker, { autoAlpha: 1 }, finalCountAt);
    build.to(marker, {
      scaleX: 1,
      duration: finalAttack,
      ease: "power3.inOut",
    }, finalCountAt);

    build.to(highlighted, {
      scaleX: keyImpactScale,
      scaleY: keyImpactScale,
      duration: finalAttack,
      ease: "power3.in",
    }, finalCountAt);
  }

  // The strongest expansion and a dark edge belong only to the payoff.
  build.to(mainTargets, {
    scaleX: impactScale,
    scaleY: impactScale,
    duration: finalAttack,
    ease: "power3.in",
  }, finalCountAt);
  build.to(liked.icon, {
    scaleX: 1.55,
    scaleY: 1.55,
    duration: finalAttack,
    ease: "power3.in",
  }, finalCountAt);
  build.set(post, { borderColor: V.ink }, D);

  build.fromTo(orbitTrace, {
    strokeDashoffset: 0,
  }, {
    strokeDashoffset: -160,
    duration: D,
    ease: "sine.inOut",
  }, 0);

  build.timeScale(1 / T.scale);
  tl.add(build, 0);

  const reaction = Math.min(0.26, T.hold);

  if (reaction > 0) {
    tl.to(mainTargets, {
      scaleX: 1,
      scaleY: 1,
      duration: reaction,
      ease: "power3.out",
    }, T.key);

    tl.to(liked.icon, {
      scaleX: 1,
      scaleY: 1,
      duration: reaction,
      ease: "back.out(1.5)",
    }, T.key);

    tl.to(post, {
      borderColor: V.metricInk,
      duration: reaction,
      ease: "power2.out",
    }, T.key);

    if (highlighted) {
      tl.to(highlighted, {
        scaleX: 1.025,
        scaleY: 1.025,
        duration: reaction,
        ease: "power3.out",
      }, T.key);
    }

    metrics.forEach((m) => {
      if (m.kind === "likes") return;
      tl.to(m.count, {
        color: V.metricInk,
        duration: reaction,
        ease: "power2.out",
      }, T.key);
    });
  }

  if (T.hold > 0) {
    tl.to(orbitTrace, {
      strokeDashoffset: -460,
      duration: T.hold,
      ease: "sine.inOut",
    }, T.key);

    tl.fromTo("#pr-depth", {
      backgroundPosition: "0% 25%",
    }, {
      backgroundPosition: "100% 75%",
      duration: T.hold,
      ease: "sine.inOut",
      immediateRender: false,
    }, T.key);

    tl.fromTo(".pr-shadow", {
      opacity: 1,
    }, {
      opacity: 0.76,
      duration: T.hold / 2,
      repeat: 1,
      yoyo: true,
      ease: "sine.inOut",
      immediateRender: false,
    }, T.key);

    const remaining = T.hold - reaction;
    if (remaining > 0.12) {
      const beatAt = T.key + reaction + remaining * 0.2;
      const beatDuration = remaining * 0.65;
      tl.to(liked.icon, {
        scaleX: 1.18,
        scaleY: 1.18,
        duration: beatDuration * 0.3,
        ease: "power2.out",
      }, beatAt);
      tl.to(liked.icon, {
        scaleX: 1,
        scaleY: 1,
        duration: beatDuration * 0.7,
        ease: "sine.inOut",
      }, beatAt + beatDuration * 0.3);
    }
  }

  const closed = "inset(0% 0% 100% 0% round 0px)";
  const open = "inset(0% 0% 0% 0% round 0px)";

  if (variant === "overlay") {
    tl.fromTo(stage, {
      clipPath: closed,
    }, {
      clipPath: open,
      duration: Math.min(0.22, T.key * 0.15),
      ease: "power3.out",
    }, 0);
  }

  if (T.exit > 0) {
    tl.to(stage, {
      clipPath: "inset(100% 0% 0% 0% round 0px)",
      duration: Math.max(0, T.exit - 1 / CA.fps),
      ease: "power3.in",
    }, T.key + T.hold);
  }

  window.__timelines["block"] = tl;
});