import * as THREE from "three";

CA.ready(() => {
  const { vars: V, stage: S, safe, time: T, variant, make, rgba } = CA;
  const $ = (id) => document.getElementById(id);
  const W = S.w;
  const H = S.h;
  const compact = variant !== "full";
  const minimum = compact ? 32 : 40;
  const K = T.design;
  const stageEl = $("stage");

  const clamp = (n, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, n));
  const seg = (t, at, duration) =>
    clamp((t - at) / Math.max(0.00001, duration));
  const out = (p, power = 3) => 1 - Math.pow(1 - p, power);
  const smooth = (p) => p * p * p * (p * (p * 6 - 15) + 10);
  const back = (p, amount = 1.5) => {
    const q = p - 1;
    return 1 + (amount + 1) * q * q * q + amount * q * q;
  };
  const designTime = (time) =>
    time <= T.key ? time / T.scale : K + time - T.key;
  const keepLastPair = (text) =>
    String(text).trim().replace(/\s+(\S+)$/, "\u00a0$1");

  const layouts = {
    full: {
      side: 56,
      top: 238,
      bottom: 300,
      kicker: 40,
      mark: 40,
      headline: 110,
      headerGap: 16,
      contentGap: 64,
      foot: 12,
      pad: 36,
      textGap: 24,
      artGap: 20,
      railHeight: 116,
      railGap: 24,
      nodeInset: 48,
      line: 11,
      dot: 16,
      pill: 40
    },
    top: {
      side: 40,
      top: 30,
      bottom: 28,
      kicker: 32,
      mark: 34,
      headline: H < 820 ? 72 : 88,
      headerGap: 12,
      contentGap: 40,
      foot: 8,
      pad: 28,
      textGap: 20,
      artGap: 18,
      railHeight: H < 700 ? 72 : 94,
      railGap: 18,
      nodeInset: 44,
      line: 10,
      dot: 14,
      pill: 34
    },
    overlay: {
      side: 36,
      top: 34,
      bottom: 30,
      kicker: 32,
      mark: 34,
      headline: H < 820 ? 70 : 86,
      headerGap: 12,
      contentGap: 40,
      foot: 8,
      pad: 28,
      textGap: 20,
      artGap: 18,
      railHeight: H < 700 ? 72 : 94,
      railGap: 18,
      nodeInset: 44,
      line: 10,
      dot: 14,
      pill: 34
    }
  };

  const M = layouts[variant] || layouts.full;
  const side = Math.max(safe.side || 0, M.side);
  const headerTop = Math.max(safe.top || 0, M.top);
  const bottom = H - Math.max(safe.bottom || 0, M.bottom);
  const header = $("timeline-header");
  const headline = $("timeline-headline");
  const kicker = $("timeline-kicker");
  const stems = $("timeline-stems");

  stems.setAttribute("viewBox", `0 0 ${W} ${H}`);

  if (variant === "overlay") stageEl.style.borderRadius = "32px";

  $("timeline-background").style.background =
    `linear-gradient(180deg, ${V.floorTop}, ${V.floorBottom})`;

  header.style.cssText =
    `left:${side}px;top:${headerTop}px;width:${W - side * 2}px;color:${V.ink}`;

  $("timeline-mark").style.cssText =
    `width:${M.mark}px;height:${M.mark}px;color:${V.accent}`;

  function fitText(el, room, preferred, smallest, allowWrap = true) {
    const width = Math.max(1, room);
    let size = Math.max(smallest, Math.round(preferred));

    el.style.width = "max-content";
    el.style.whiteSpace = "nowrap";
    el.style.fontSize = size + "px";

    while (size > smallest && el.scrollWidth > width + 0.5) {
      size -= 1;
      el.style.fontSize = size + "px";
    }

    if (allowWrap && el.scrollWidth > width + 0.5) {
      el.style.width = width + "px";
      el.style.whiteSpace = "normal";
      el.style.textWrap = "balance";
    }
  }

  kicker.textContent = String(V.kicker).trim() ||
    `${String(V.name).toUpperCase()} · ${V.startYear}–${V.nowYear}`;
  kicker.style.color = V.muted;
  fitText(kicker, W - side * 2 - M.mark - 14, M.kicker, minimum);

  const headingText = String(V.headline).trim();
  const highlightText = String(V.highlight);
  const highlightAt = highlightText
    ? headingText.lastIndexOf(highlightText)
    : -1;
  const lastHeadingSpace = headingText.lastIndexOf(" ");

  function headingPart(text, offset) {
    const local = lastHeadingSpace - offset;
    return local >= 0 && local < text.length
      ? text.slice(0, local) + "\u00a0" + text.slice(local + 1)
      : text;
  }

  if (highlightAt >= 0) {
    headline.appendChild(document.createTextNode(
      headingPart(headingText.slice(0, highlightAt), 0)
    ));
    const accent = make(
      "span", "", headline, headingPart(highlightText, highlightAt)
    );
    accent.style.color = V.accent;
    const after = highlightAt + highlightText.length;
    headline.appendChild(document.createTextNode(
      headingPart(headingText.slice(after), after)
    ));
  } else {
    headline.textContent = keepLastPair(headingText);
  }

  headline.style.cssText =
    `width:${W - side * 2}px;font-size:${M.headline}px;` +
    `margin-top:${M.headerGap}px;color:${V.ink}`;

  let headingSize = M.headline;
  const headingMinimum = compact ? 52 : 80;
  const desiredCardHeight = compact ? 320 : 740;
  const areaBottom = bottom - M.foot;

  while (
    areaBottom - M.railHeight - M.railGap -
      headerTop - header.offsetHeight - M.contentGap < desiredCardHeight &&
    headingSize > headingMinimum
  ) {
    headingSize -= 2;
    headline.style.fontSize = headingSize + "px";
  }

  const heroTop = headerTop + header.offsetHeight + M.contentGap;
  const heroBottom = areaBottom - M.railHeight - M.railGap;
  const heroHeight = Math.max(1, heroBottom - heroTop);
  const heroLeft = side;
  const heroWidth = W - side * 2;
  const heroCenter = heroLeft + heroWidth / 2;
  const railTop = heroBottom + M.railGap;
  const railBottom = areaBottom;
  const arrivalLead = Math.min(0.44, K * 0.16);

  const payoffScale = Math.min(
    0.06, Math.max(0, (M.contentGap - 10) / heroHeight)
  );
  const lastingScale = Math.min(0.008, payoffScale * 0.15);

  const items = [1, 2, 3, 4].map((n) => ({
    source: n,
    year: Number(V[`milestone${n}Year`]),
    title: String(V[`milestone${n}Title`]),
    detail: String(V[`milestone${n}Detail`])
  })).filter((item) => item.source === 4 || item.title.trim());

  const beatGap = items.length > 1
    ? (K - arrivalLead) / (items.length - 1)
    : K;

  function illustration(kind, reversed, wide) {
    const dark = reversed ? V.card : V.ink;
    const blue = reversed ? V.card : V.accent;
    const pale = reversed ? rgba(V.card, 0.16) : rgba(V.accent, 0.10);
    const secondary = reversed ? rgba(V.card, 0.70) : V.muted;
    const strokeWidth = wide ? 5 : 3.2;

    const D = (
      d, from, to, color = dark, width = strokeWidth, trace = false
    ) =>
      `<path d="${d}" fill="none" stroke="${color}" ` +
      `stroke-width="${width}" stroke-linecap="round" ` +
      `stroke-linejoin="round" data-draw data-from="${from}" ` +
      `data-to="${to}"${trace ? " data-pencil-trace" : ""}/>`;

    const action = (name, x, y, contents) =>
      `<g data-action="${name}" data-ox="${x}" data-oy="${y}">` +
      contents + "</g>";

    function pencil(x, y, minY, maxY) {
      const length = wide ? 158 : 45;
      const nib = wide ? 21 : 7;
      const half = wide ? 8 : 3;
      const stripe = length - (wide ? 15 : 5);

      return `<g data-pencil data-rest-x="${x}" data-rest-y="${y}"
        data-min-y="${minY}" data-max-y="${maxY}">
        <path d="M0 0L${nib} ${-half}H${length}V${half}H${nib}Z"
          fill="${blue}"/>
        <path d="M0 0L${nib} ${-half}V${half}Z" fill="${dark}"/>
        <path d="M${stripe} ${-half}V${half}"
          stroke="${V.card}" stroke-width="${wide ? 5 : 1.8}"/>
      </g>`;
    }

    let scene = "";
    let view = "0 0 108 108";

    if (wide) {
      const views = [
        "68 10 348 238",
        "34 17 412 226",
        "34 16 412 230",
        "30 20 420 224"
      ];
      view = views[kind - 1];

      if (kind === 1) {
        scene =
          `<path d="M112 20h240v220H112z" fill="${V.card}"
            stroke="${dark}" stroke-width="5"/>` +
          D("M140 195V50h184v145H140Z", 0.08, 0.33, dark, 5, true) +
          D("M140 130h184", 0.33, 0.44, dark, 5, true) +
          D("M224 50v80", 0.44, 0.54, dark, 5, true) +
          D("M140 88h84", 0.54, 0.64, dark, 5, true) +
          D("M270 130v65", 0.64, 0.73, dark, 5, true) +
          D("M153 207h110", 0.73, 0.81, secondary, 4, true) +
          D("M153 218h72", 0.81, 0.88, secondary, 4, true) +
          D("M76 235h330", 0, 0.16) +
          pencil(320, 234, 50, 218);
      }

      if (kind === 2) {
        scene =
          D("M45 231h390", 0, 0.12) +
          D("M66 231V40M66 92h88M66 146h88M66 198h88", 0.02, 0.42) +
          D(
            "M79 87V59h15v28M102 87V48h16v39M126 87V61h14v26",
            0.10, 0.34, dark, 3
          ) +
          D("M186 27h111v85H186zM242 27v85M186 70h111", 0.08, 0.46) +
          action("seat", 242, 215,
            `<path d="M186 143h111v66H186z" fill="${blue}"/>` +
            D("M173 161v54h137v-54M190 215v16M292 215v16M188 175h108",
              0.30, 0.72)
          ) +
          action("lamp", 382, 225,
            D("M382 224V72M355 72h54l-12-37h-30l-12 37ZM362 225h40",
              0.20, 0.75)
          ) +
          D("M335 196h34v28h-34zM352 224v7", 0.65, 0.92);
      }

      if (kind === 3) {
        scene =
          D("M57 26h366v85H57zM179 26v85M301 26v85M57 69h366",
            0, 0.36) +
          action("table", 47, 155,
            `<path d="M47 155h386v15H47z" fill="${blue}"/>`
          ) +
          D("M72 171v64M408 171v64M45 235h391", 0.30, 0.62) +
          action("plan", 112, 147,
            `<path d="m112 147 37-30 101 30H112Z"
              fill="${pale}" stroke="${dark}" stroke-width="4"/>` +
            D("M153 131l58 16M174 125l57 17", 0.52, 0.82, blue, 4)
          ) +
          D("M292 124h48v29h-48zM316 153v5", 0.46, 0.73) +
          action("chair", 316, 235,
            D("M278 194h77v29h-77zM293 223v12M341 223v12",
              0.60, 0.94)
          ) +
          D("M365 146v-22M351 124h28l-7-17h-14l-7 17Z",
            0.60, 0.93);
      }

      if (kind === 4) {
        scene =
          D("M40 235h402", 0.05, 0.24) +
          action("sofa", 223, 235,
            D("M95 153v-28c0-13 10-23 23-23h211c13 0 23 10 23 23v28",
              0.04, 0.44) +
            `<path d="M83 146h281v66H83z" fill="${pale}"/>` +
            D("M83 146h281v66H83z", 0.20, 0.58) +
            D("M176 105v40M267 105v40M105 213v22M341 213v22",
              0.36, 0.72)
          ) +
          action("picture", 217, 53,
            `<path d="M160 31h115v44H160z" fill="${pale}"/>` +
            D("M160 31h115v44H160z", 0.06, 0.45, dark, 4) +
            D("M178 60l25-15 20 11 32-15", 0.32, 0.64, dark, 4)
          ) +
          D("M410 188V94", 0.36, 0.83, secondary, 4) +
          action("leaf-left", 410, 122,
            `<path d="M410 122c-40 0-49-36-49-36 41-3 49 36 49 36Z"
              fill="${pale}" stroke="${secondary}" stroke-width="4"/>`
          ) +
          action("leaf-right", 410, 94,
            `<path d="M410 94c0-42 30-53 30-53s9 42-30 53Z"
              fill="${pale}" stroke="${secondary}" stroke-width="4"/>`
          ) +
          action("pot", 410, 235,
            `<path d="M389 188h43l-8 47h-27l-8-47Z" fill="${dark}"/>`
          );
      }
    } else {
      if (kind === 1) {
        scene =
          `<path d="M22 19h55v66H22z" fill="${V.card}"
            stroke="${dark}" stroke-width="3"/>` +
          D("M31 65V34h35v31H31Z", 0.08, 0.39, dark, 3.2, true) +
          D("M31 53h35", 0.39, 0.57, dark, 3.2, true) +
          D("M48 34v19", 0.57, 0.73, dark, 3.2, true) +
          D("M28 74h42", 0.73, 0.88, secondary, 2.8, true) +
          pencil(63, 83, 34, 74);
      }

      if (kind === 2) {
        scene =
          D("M15 85h78M19 85V22M19 46h69", 0, 0.40) +
          action("seat", 48, 77,
            `<path d="M29 47h37v26H29z" fill="${blue}"/>` +
            D("M24 62v15h48V62M31 77v8M65 77v8", 0.30, 0.76)
          ) +
          action("lamp", 83, 80,
            D("M83 79V34m-8 0h16l-4-13h-8l-4 13Zm2 46h12",
              0.20, 0.78)
          ) +
          D("M37 51h21v13H37z", 0.65, 0.93, V.card, 2.5);
      }

      if (kind === 3) {
        scene =
          D("M17 17h70v28H17zM52 17v28M17 31h70", 0, 0.36) +
          action("table", 16, 59,
            `<path d="M16 59h73v7H16z" fill="${blue}"/>`
          ) +
          D("M23 67v19M82 67v19", 0.30, 0.62) +
          action("plan", 33, 57,
            `<path d="m33 57 7-13 31 10-2 3"
              fill="${pale}" stroke="${dark}" stroke-width="2.8"/>` +
            D("M43 51l15 4M47 47l15 5", 0.52, 0.82, blue, 2.5)
          ) +
          action("chair", 52, 92,
            D("M42 78h20v9H42zM47 87v5M57 87v5", 0.60, 0.94)
          );
      }

      if (kind === 4) {
        scene =
          D("M13 87h82", 0.05, 0.24) +
          action("sofa", 51, 87,
            D("M20 65V48c0-5 4-8 9-8h43c5 0 9 3 9 8v17",
              0.04, 0.44) +
            `<path d="M18 59h66v21H18z" fill="${pale}"/>` +
            D("M18 59h66v21H18z", 0.20, 0.58) +
            D("M39 41v17M61 41v17M25 80v7M77 80v7", 0.36, 0.72)
          ) +
          D("M88 70V40", 0.36, 0.83, secondary, 2.8) +
          action("leaf-left", 88, 48,
            `<path d="M88 48c-15 0-17-13-17-13 15-1 17 13 17 13Z"
              fill="${pale}" stroke="${secondary}" stroke-width="2.8"/>`
          ) +
          action("leaf-right", 88, 39,
            `<path d="M88 39c0-15 10-18 10-18s3 15-10 18Z"
              fill="${pale}" stroke="${secondary}" stroke-width="2.8"/>`
          ) +
          action("pot", 88, 87,
            `<path d="M81 71h15l-3 16h-9l-3-16Z" fill="${dark}"/>`
          );
      }
    }

    return `<svg viewBox="${view}" aria-hidden="true">${scene}</svg>`;
  }

  function prepareArt(svg) {
    const draws = Array.from(svg.querySelectorAll("[data-draw]")).map((el) => {
      const length = Math.max(0.001, el.getTotalLength());
      el.style.strokeDasharray = `${length} ${length}`;
      return {
        el,
        length,
        from: Number(el.dataset.from),
        to: Number(el.dataset.to),
        trace: el.hasAttribute("data-pencil-trace")
      };
    });

    return {
      svg,
      draws,
      traces: draws.filter((draw) => draw.trace),
      pencil: svg.querySelector("[data-pencil]"),
      parts: Array.from(svg.querySelectorAll("[data-action]")).map((el) => ({
        el,
        action: el.dataset.action,
        x: Number(el.dataset.ox),
        y: Number(el.dataset.oy)
      }))
    };
  }

  function animateArt(art, p, post) {
    art.draws.forEach((draw) => {
      const q = out(seg(p, draw.from, draw.to - draw.from), 2);
      draw.el.style.strokeDashoffset = String(draw.length * (1 - q));
    });

    if (art.pencil && art.traces.length) {
      let trace = art.traces[0];

      for (const candidate of art.traces) {
        if (p >= candidate.from) trace = candidate;
      }

      const q = out(seg(p, trace.from, trace.to - trace.from), 2);
      const point = trace.el.getPointAtLength(trace.length * q);
      const last = art.traces[art.traces.length - 1];
      const park = smooth(seg(p, last.to, 1 - last.to));
      const pen = art.pencil;
      const restX = Number(pen.dataset.restX);
      const restY = Number(pen.dataset.restY);
      const minY = Number(pen.dataset.minY);
      const maxY = Number(pen.dataset.maxY);
      const x = point.x + (restX - point.x) * park;
      const y = point.y + (restY - point.y) * park;
      const drawingAngle =
        42 - 110 * clamp((point.y - minY) / Math.max(1, maxY - minY));
      const angle = drawingAngle + (-67 - drawingAngle) * park;
      const scale = 0.64 + park * 0.36;

      pen.setAttribute(
        "transform",
        `translate(${x.toFixed(3)} ${y.toFixed(3)}) ` +
        `rotate(${angle.toFixed(3)}) scale(${scale.toFixed(5)})`
      );
    }

    const breeze = post > 0.22
      ? Math.sin((post - 0.22) * 1.6) * 1.3
      : 0;

    art.parts.forEach((part) => {
      let sx = 1;
      let sy = 1;
      let angle = 0;
      let dy = 0;

      if (part.action === "seat") {
        const q = back(seg(p, 0.24, 0.45), 1.6);
        sy = Math.max(0.001, q);
        dy = (1 - q) * (compact ? 6 : 24);
      } else if (part.action === "lamp") {
        angle = -10 * (1 - back(seg(p, 0.12, 0.60), 1.7));
      } else if (part.action === "table") {
        sx = Math.max(0.001, out(seg(p, 0.26, 0.35), 3));
      } else if (part.action === "plan") {
        const q = back(seg(p, 0.46, 0.40), 1.2);
        sx = Math.max(0.001, q);
        angle = -3 * (1 - q);
      } else if (part.action === "chair") {
        const q = back(seg(p, 0.56, 0.40), 1.4);
        dy = (1 - q) * (compact ? 7 : 25);
      } else if (part.action === "sofa") {
        const q = back(seg(p, 0.10, 0.60), 1.5);
        sy = 0.90 + q * 0.10;
        dy = (1 - q) * (compact ? 5 : 18);
      } else if (part.action === "picture") {
        angle = -7 * (1 - back(seg(p, 0.02, 0.55), 1.6));
      } else if (
        part.action === "leaf-left" ||
        part.action === "leaf-right"
      ) {
        const q = back(seg(p, 0.40, 0.50), 1.1);
        sx = sy = Math.max(0.001, q);
        const direction = part.action === "leaf-left" ? -1 : 1;
        angle = direction * (1 - q) * 30 + direction * breeze;
      } else if (part.action === "pot") {
        sy = Math.max(0.001, out(seg(p, 0.50, 0.35), 3));
      }

      part.el.setAttribute(
        "transform",
        `translate(0 ${dy.toFixed(4)}) ` +
        `translate(${part.x} ${part.y}) rotate(${angle.toFixed(4)}) ` +
        `scale(${sx.toFixed(5)} ${sy.toFixed(5)}) ` +
        `translate(${-part.x} ${-part.y})`
      );
    });
  }

  const cards = items.map((item, i) => {
    const final = i === items.length - 1;
    const el = make("article", "timeline-milestone", $("timeline-cards"));
    el.style.width = heroWidth + "px";
    el.style.height = heroHeight + "px";
    el.style.transform = `translate(${heroLeft}px,${heroTop}px)`;

    const shadow = make("div", "timeline-card-shadow", el);
    shadow.setAttribute("aria-hidden", "true");
    shadow.style.boxShadow =
      `0 7px 12px ${rgba(V.ink, 0.06)},` +
      `0 20px 34px ${rgba(V.ink, 0.13)}`;

    const face = make("div", "timeline-card", el);
    face.style.background = V.card;
    face.style.color = V.ink;

    const sweep = make("div", "timeline-card-sweep", face);
    sweep.setAttribute("aria-hidden", "true");
    sweep.style.background = V.accent;
    sweep.style.visibility = "hidden";

    const year = make("span", "timeline-card-year", face, String(item.year));
    const thumb = make("div", "timeline-thumbnail", face);
    thumb.setAttribute("aria-hidden", "true");
    thumb.innerHTML = illustration(item.source, false, !compact);

    const neutralArt = thumb.firstElementChild;
    neutralArt.style.background = rgba(V.accent, 0.035);
    let finalArt = null;

    if (final) {
      thumb.insertAdjacentHTML(
        "beforeend", illustration(item.source, true, !compact)
      );
      finalArt = thumb.lastElementChild;
      finalArt.style.background = rgba(V.card, 0.11);
      finalArt.style.visibility = "hidden";
    }

    const title = make(
      "span", "timeline-card-title", face, keepLastPair(item.title)
    );
    const detail = make(
      "span", "timeline-card-detail", face, keepLastPair(item.detail)
    );

    let pill = null;

    if (final) {
      pill = make("span", "timeline-now-pill", face, String(V.nowPill));
      pill.style.background = V.ink;
      pill.style.color = V.card;
      fitText(pill, Math.min(250, heroWidth * 0.30), M.pill, minimum);
    }

    const glint = make("div", "timeline-card-glint", face);
    glint.setAttribute("aria-hidden", "true");
    const glintWidth = compact ? 136 : 160;
    glint.style.width = glintWidth + "px";
    glint.style.height = compact ? "5px" : "6px";

    const pad = heroHeight < 360 ? 20 : M.pad;
    const gap = heroHeight < 360 ? 14 : M.textGap;
    const room = Math.max(1, heroWidth - pad * 2 - 6);
    const badgeWidth = pill ? pill.offsetWidth : 0;
    const badgeHeight = pill ? pill.offsetHeight : 0;
    const detailRoom = compact && pill
      ? Math.max(1, room - badgeWidth - 22)
      : room;

    fitText(
      detail, detailRoom, compact ? 44 : 54, compact ? 36 : 40
    );
    fitText(title, room, compact ? 122 : 146, compact ? 68 : 80);

    const detailRowHeight = Math.max(
      detail.offsetHeight, compact ? badgeHeight : 0
    );
    const detailRowTop = heroHeight - pad - detailRowHeight - 3;
    const titleTop = detailRowTop - gap - title.offsetHeight;
    const upperHeight = Math.max(0, titleTop - gap - pad);
    const detailTop =
      detailRowTop + (detailRowHeight - detail.offsetHeight) / 2;

    detail.style.left = pad + "px";
    detail.style.top = detailTop + "px";
    title.style.left = pad + "px";
    title.style.top = titleTop + "px";
    year.style.left = pad + "px";
    year.style.top = pad + "px";

    if (compact) {
      let artSize = Math.min(room * 0.35, heroHeight * 0.57, upperHeight);
      if (artSize < 92) artSize = 0;

      const yearRoom = artSize > 0
        ? Math.max(1, room - artSize - 24)
        : room;

      fitText(
        year, yearRoom, Math.min(250, upperHeight / 1.08), minimum, false
      );

      thumb.style.left = heroWidth - pad - artSize - 3 + "px";
      thumb.style.top = pad + "px";
      thumb.style.width = artSize + "px";
      thumb.style.height = artSize + "px";
      thumb.hidden = artSize === 0;
    } else {
      const yearRoom = room - (pill ? badgeWidth + 24 : 0);

      fitText(
        year, Math.max(1, yearRoom),
        Math.min(224, upperHeight / 1.08), minimum, false
      );

      const artTop = pad + year.offsetHeight + M.artGap;
      const artHeight = Math.max(0, titleTop - M.artGap - artTop);

      thumb.style.left = pad + "px";
      thumb.style.top = artTop + "px";
      thumb.style.width = room + "px";
      thumb.style.height = artHeight + "px";
      thumb.hidden = artHeight < 90;
    }

    if (pill) {
      pill.style.right = pad + "px";
      pill.style.top = compact
        ? detailRowTop + (detailRowHeight - badgeHeight) / 2 + "px"
        : pad + "px";
      pill.hidden = true;
    }

    const stem = document.createElementNS(
      "http://www.w3.org/2000/svg", "path"
    );
    stem.setAttribute("fill", "none");
    stem.setAttribute("stroke", V.accent);
    stem.setAttribute("stroke-width", compact ? "4" : "5");
    stem.setAttribute("stroke-linecap", "round");
    stem.setAttribute("stroke-linejoin", "round");
    stem.style.display = "none";
    stems.appendChild(stem);

    const fraction = items.length === 1 ? 1 : i / (items.length - 1);
    const at = i === 0 ? 0 : (K - arrivalLead) * fraction;
    const artStates = [prepareArt(neutralArt)];
    if (finalArt) artStates.push(prepareArt(finalArt));

    const textPositions = [
      { el: year, x: pad, y: pad, neutral: V.ink },
      { el: title, x: pad, y: titleTop, neutral: V.ink },
      { el: detail, x: pad, y: detailTop, neutral: V.muted }
    ];

    el.hidden = true;

    return {
      item, final, el, face, shadow, sweep, year, thumb, title, detail,
      pill, glint, glintWidth, neutralArt, finalArt, artStates,
      textPositions, stem, at,
      handoff: i === 0 ? 0 : Math.min(0.34, beatGap * 0.36),
      hingeTime: Math.min(0.16, beatGap * 0.20),
      thumbX: parseFloat(thumb.style.left) || 0,
      thumbY: parseFloat(thumb.style.top) || 0,
      thumbW: Math.max(1, parseFloat(thumb.style.width) || 0),
      thumbH: Math.max(1, parseFloat(thumb.style.height) || 0),
      nodeX: side + M.nodeInset +
        Math.max(0, W - side * 2 - M.nodeInset * 2) * fraction,
      nodeY: railTop + M.railHeight * (0.70 - fraction * 0.28)
    };
  });

  const renderer = new THREE.WebGLRenderer({
    canvas: $("timeline-gl"),
    alpha: true,
    antialias: true,
    preserveDrawingBuffer: true
  });
  renderer.setPixelRatio(2);
  renderer.setSize(W, H, false);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, W / H, 0.1, 180);
  const origin = new THREE.Vector3();
  const centerY = (railTop + railBottom) / 2;

  scene.add(new THREE.AmbientLight(0xffffff, 1.4));
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
  keyLight.position.set(-8, 18, 12);
  scene.add(keyLight);

  function setCamera(elevation, azimuth) {
    const distance = 32;
    camera.position.set(
      Math.sin(azimuth) * Math.cos(elevation) * distance,
      Math.sin(elevation) * distance,
      Math.cos(azimuth) * Math.cos(elevation) * distance
    );
    camera.lookAt(origin);
    camera.updateProjectionMatrix();
    camera.projectionMatrix.elements[8] = 0;
    camera.projectionMatrix.elements[9] = 2 * centerY / H - 1;
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
    camera.updateMatrixWorld(true);
  }

  setCamera(54 * Math.PI / 180, 0);

  const raycaster = new THREE.Raycaster();
  const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

  function onFloor(x, y) {
    raycaster.setFromCamera(
      new THREE.Vector2(x / W * 2 - 1, 1 - y / H * 2), camera
    );
    const point = new THREE.Vector3();
    raycaster.ray.intersectPlane(floorPlane, point);
    return point;
  }

  function project(point) {
    const p = point.clone().project(camera);
    return { x: (p.x + 1) * W / 2, y: (1 - p.y) * H / 2 };
  }

  const nodes = cards.map((card) => onFloor(card.nodeX, card.nodeY));
  const first = cards[0];
  const last = cards[cards.length - 1];
  const lead = onFloor(first.nodeX - 26, first.nodeY + 8);
  const tail = onFloor(last.nodeX + 22, last.nodeY - 7);
  const curve = new THREE.CurvePath();
  const points = [lead, ...nodes, tail];

  for (let i = 0; i < points.length - 1; i++) {
    curve.add(new THREE.LineCurve3(points[i], points[i + 1]));
  }

  const lengths = curve.getCurveLengths();
  const totalLength = curve.getLength();
  const nodeU = nodes.map((point, i) => lengths[i] / totalLength);
  const middle = onFloor(W / 2, centerY);
  const unitX = onFloor(W / 2 + 1, centerY).distanceTo(middle);
  const lineRadius = M.line * unitX / 2;
  const dotRadius = M.dot * unitX;

  const floorCorners = [
    onFloor(side + 6, railTop + 3),
    onFloor(W - side - 6, railTop + 3),
    onFloor(W - side - 6, railBottom - 4),
    onFloor(side + 6, railBottom - 4)
  ];
  const floorGeometry = new THREE.BufferGeometry();
  floorGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
      floorCorners.flatMap((point) => [point.x, -unitX * 4, point.z]), 3
    )
  );
  floorGeometry.setIndex([0, 1, 2, 0, 2, 3]);

  scene.add(new THREE.Mesh(
    floorGeometry,
    new THREE.MeshBasicMaterial({
      color: V.grid,
      transparent: true,
      opacity: 0.10,
      depthWrite: false,
      side: THREE.DoubleSide
    })
  ));

  const resolution = 360;
  const radialSegments = 10;
  const rail = new THREE.Mesh(
    new THREE.TubeGeometry(
      curve, resolution, lineRadius, radialSegments, false
    ),
    new THREE.MeshStandardMaterial({
      color: V.future, roughness: 0.54, metalness: 0.08
    })
  );
  rail.renderOrder = 2;

  const fillGeometry = new THREE.TubeGeometry(
    curve, resolution, lineRadius * 1.025, radialSegments, false
  );
  const fill = new THREE.Mesh(
    fillGeometry,
    new THREE.MeshStandardMaterial({
      color: V.accent, roughness: 0.30, metalness: 0.12
    })
  );
  fill.renderOrder = 3;
  scene.add(rail, fill);

  const ticks = [];

  for (let i = 1; i < cards.length; i++) {
    const intervals = clamp(
      Math.round(cards[i].item.year - cards[i - 1].item.year), 1, 12
    );

    for (let j = 1; j < intervals; j++) {
      const u = nodeU[i - 1] +
        (nodeU[i] - nodeU[i - 1]) * j / intervals;
      const point = curve.getPointAt(u);
      const tangent = curve.getTangentAt(clamp(u, 0.00001, 0.99999));
      const direction = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const a = point.clone().addScaledVector(direction, -unitX * 10);
      const b = point.clone().addScaledVector(direction, unitX * 10);
      a.y = b.y = -unitX;

      const mesh = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([a, b]),
        new THREE.LineBasicMaterial({ color: V.future })
      );
      scene.add(mesh);
      ticks.push({ mesh, u });
    }
  }

  const dots = nodes.map((point) => {
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(dotRadius * 1.65, 40),
      new THREE.MeshBasicMaterial({
        color: V.ink,
        transparent: true,
        opacity: 0.11,
        depthWrite: false
      })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.copy(point);
    shadow.position.y = -unitX * 2;
    scene.add(shadow);

    const group = new THREE.Group();
    group.position.copy(point);

    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(
        dotRadius, dotRadius * 1.05, unitX * 9, 48
      ),
      new THREE.MeshStandardMaterial({
        color: V.future, roughness: 0.28, metalness: 0.14
      })
    );
    body.position.y = unitX * 5;
    group.add(body);

    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(dotRadius * 0.62, unitX * 1.4, 8, 48),
      new THREE.MeshBasicMaterial({ color: V.card })
    );
    rim.rotation.x = -Math.PI / 2;
    rim.position.y = unitX * 9.8;
    group.add(rim);
    scene.add(group);

    return { group, body, rim, shadow };
  });

  const playhead = new THREE.Mesh(
    new THREE.SphereGeometry(dotRadius * 0.70, 32, 24),
    new THREE.MeshStandardMaterial({
      color: V.accent, roughness: 0.18, metalness: 0.12
    })
  );
  playhead.renderOrder = 5;
  scene.add(playhead);

  const playheadShadow = new THREE.Mesh(
    new THREE.CircleGeometry(dotRadius * 0.95, 40),
    new THREE.MeshBasicMaterial({
      color: V.ink,
      transparent: true,
      opacity: 0.12,
      depthWrite: false
    })
  );
  playheadShadow.rotation.x = -Math.PI / 2;
  scene.add(playheadShadow);

  const softRing = new THREE.Mesh(
    new THREE.RingGeometry(dotRadius * 1.55, dotRadius * 2.05, 80),
    new THREE.MeshBasicMaterial({
      color: V.accent,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
      side: THREE.DoubleSide
    })
  );
  softRing.rotation.x = -Math.PI / 2;
  softRing.renderOrder = 6;
  scene.add(softRing);

  function travel(t) {
    if (t <= 0) return nodeU[0];

    for (let i = 1; i < cards.length; i++) {
      if (t <= cards[i].at) {
        const p = seg(
          t, cards[i - 1].at, cards[i].at - cards[i - 1].at
        );
        const eased = smooth(p) * 0.86 + p * 0.14;
        return nodeU[i - 1] + (nodeU[i] - nodeU[i - 1]) * eased;
      }
    }

    const finalU = nodeU[nodeU.length - 1];
    const p = out(seg(t, last.at, K - last.at), 2);
    return finalU + (1 - finalU) * p;
  }

  function aim(t) {
    const p = smooth(seg(t, 0, K + 0.28));
    setCamera(
      (50.8 + p * 3.2) * Math.PI / 180,
      (-3.5 * (1 - p)) * Math.PI / 180
    );
  }

  function colorSweep(card, p) {
    const coverage = out(p, 2);
    const slant = heroWidth * 0.15;
    const edge = heroWidth + slant -
      (heroWidth + slant * 2) * coverage;
    const edgeAt = (y) => edge + slant - slant * 2 * y / heroHeight;

    card.sweep.style.visibility = p > 0 ? "visible" : "hidden";
    card.sweep.style.clipPath = p >= 1
      ? "none"
      : `polygon(${edgeAt(0)}px 0,100% 0,100% 100%,` +
        `${edgeAt(heroHeight)}px 100%)`;

    card.textPositions.forEach((text) => {
      const reversed = p >= 1 || (p > 0 && edgeAt(text.y) <= text.x);
      text.el.style.color = reversed ? V.card : text.neutral;
    });

    if (!card.finalArt) return;

    const top = (edgeAt(card.thumbY) - card.thumbX) / card.thumbW * 100;
    const bottomEdge =
      (edgeAt(card.thumbY + card.thumbH) - card.thumbX) /
      card.thumbW * 100;

    card.neutralArt.style.visibility = p < 1 ? "visible" : "hidden";
    card.finalArt.style.visibility = p > 0 ? "visible" : "hidden";

    card.neutralArt.style.clipPath = p <= 0
      ? "none"
      : `polygon(0 0,${top}% 0,${bottomEdge}% 100%,0 100%)`;
    card.finalArt.style.clipPath = p >= 1
      ? "none"
      : `polygon(${top}% 0,100% 0,100% 100%,${bottomEdge}% 100%)`;
  }

  function renderAt(rawTime) {
    const time = Math.max(0, Number(rawTime) || 0);
    const t = designTime(time);
    const reaction = Math.max(0, t - K);
    const complete = t >= K;
    aim(t);

    const u = travel(t);
    let active = 0;

    cards.forEach((card, i) => {
      if (u + 0.0000001 >= nodeU[i]) active = i;
    });

    fillGeometry.setDrawRange(
      0,
      Math.min(resolution, Math.floor(u * resolution)) *
        radialSegments * 6
    );

    ticks.forEach((tick) => {
      tick.mesh.material.color.set(
        u + 0.0000001 >= tick.u ? V.accent : V.future
      );
    });

    dots.forEach((dot, i) => {
      const reached = u + 0.0000001 >= nodeU[i];
      const age = Math.max(0, t - cards[i].at);
      const hit = i > 0 && reached
        ? Math.sin(seg(age, 0, 0.24) * Math.PI) *
          (1 - seg(age, 0, 0.24))
        : 0;
      const lasting = i === cards.length - 1 && reached ? 0.12 : 0;

      dot.group.scale.setScalar(1 + hit * 0.52 + lasting);
      dot.body.material.color.set(reached ? V.accent : V.future);
      dot.rim.visible = reached;
      dot.shadow.scale.setScalar(1 + hit * 0.16 + lasting);
    });

    const point = curve.getPointAt(u);
    playhead.position.copy(point);
    playhead.position.y = unitX * 18;

    playheadShadow.position.copy(point);
    playheadShadow.position.y = -unitX * 1.5;

    softRing.position.copy(point);
    softRing.position.y = unitX * 0.3;

    cards.forEach((card, i) => {
      const next = cards[i + 1];
      const current = i === active;
      const outgoing = Boolean(
        i === active - 1 &&
        next &&
        t < next.at + next.handoff
      );
      const visible = current || outgoing;

      card.el.hidden = !visible;
      card.el.style.visibility = visible ? "visible" : "hidden";
      card.el.style.zIndex = current ? "2" : "1";
      card.el.setAttribute("aria-hidden", visible ? "false" : "true");
      card.stem.style.display = visible ? "block" : "none";

      if (!visible) {
        if (card.pill) {
          card.pill.hidden = true;
          card.pill.style.visibility = "hidden";
        }
        return;
      }

      const age = Math.max(0, t - card.at);
      const node = project(nodes[i]);
      const entry = i === 0 ? 1 : seg(age, 0, card.hingeTime);
      const hinge = back(entry, 1.55);
      const placement = i === 0
        ? 1
        : smooth(seg(age, 0, card.handoff * 0.82));
      const remaining = 1 - placement;

      // The previous card stays upright until the next card covers it.
      // The incoming face starts readable, never near an edge-on pose.
      let dx = Math.min(28, heroWidth * 0.028) * remaining;
      let dy = Math.min(
        compact ? 48 : 76,
        Math.max(18, node.y - heroBottom)
      ) * remaining;
      let rotateX = -32 * (1 - hinge);
      let scale = 0.94 + 0.06 * placement;

      if (outgoing) {
        const retire = out(
          seg(
            t,
            next.at + next.handoff * 0.36,
            next.handoff * 0.64
          ),
          3
        );

        dx = -Math.min(18, heroWidth * 0.018) * retire;
        dy = -Math.min(10, M.contentGap * 0.22) * retire;
        rotateX = 0;
        scale = 1 - 0.012 * retire;
      }

      const attackDuration = Math.min(0.10, arrivalLead * 0.25);
      const attack = seg(t, K - attackDuration, attackDuration);
      const settle = complete ? out(seg(reaction, 0, 0.24), 3) : 0;
      const punch = card.final
        ? complete
          ? 1 - settle
          : attack * attack
        : 0;

      if (card.final) {
        scale *= 1 + payoffScale * punch + lastingScale * settle;
      }

      card.face.style.visibility = "visible";
      card.face.style.transform =
        `translate(${dx.toFixed(3)}px,${dy.toFixed(3)}px) ` +
        `rotateX(${rotateX.toFixed(4)}deg) ` +
        `scaleX(${scale.toFixed(5)}) scaleY(${scale.toFixed(5)})`;

      // One shared scale accent keeps the year and all copy together.
      card.year.style.transform = "none";

      const sweepDuration = Math.min(0.18, arrivalLead * 0.5);
      const sweepP = card.final
        ? seg(t, K - sweepDuration, sweepDuration)
        : 0;
      colorSweep(card, sweepP);

      const borderPulse = i === 0
        ? 0
        : 1 - out(seg(age, 0, 0.38), 3);

      card.face.style.borderColor = sweepP >= 1
        ? rgba(V.card, 0.32)
        : rgba(V.accent, 0.13 + borderPulse * 0.58);
      card.face.style.boxShadow =
        `0 ${compact ? 5 : 7}px 0 ` +
        (sweepP >= 1 ? rgba(V.ink, 0.23) : rgba(V.future, 0.58));

      card.shadow.style.transform =
        `translate(${dx.toFixed(3)}px,${dy.toFixed(3)}px) ` +
        `scaleX(${scale.toFixed(5)}) scaleY(${scale.toFixed(5)})`;
      card.shadow.style.opacity = String(0.88 + punch * 0.12);

      const localAnchor = clamp(node.x - heroLeft, 26, heroWidth - 26);
      const localX = (localAnchor - heroWidth / 2) * scale;
      const anchorX = heroCenter + dx + localX;
      const anchorY = heroBottom + dy;

      card.stem.setAttribute(
        "d",
        `M${node.x.toFixed(3)},${node.y.toFixed(3)}` +
        `L${anchorX.toFixed(3)},${anchorY.toFixed(3)}`
      );

      const artDuration = card.final ? 0.34 : 0.60;
      const artAge = i === 0 ? t + 0.10 : age - 0.07;
      const artP = seg(artAge, 0, artDuration);
      card.artStates.forEach((art) => {
        animateArt(art, artP, card.final && complete ? reaction : 0);
      });

      if (card.pill) {
        const showPill = complete && reaction >= 0.07;
        card.pill.hidden = !showPill;
        card.pill.style.visibility = showPill ? "visible" : "hidden";

        const badgeP = out(seg(reaction, 0.07, 0.12), 4);
        const badgeScale = 0.94 + badgeP * 0.06;
        card.pill.style.transform =
          `translateY(${(4 * (1 - badgeP)).toFixed(3)}px) ` +
          `scaleX(${badgeScale.toFixed(5)}) ` +
          `scaleY(${badgeScale.toFixed(5)})`;
      }

      const glintP = card.final
        ? smooth(seg(t, K + 0.08, Math.max(0.4, T.hold)))
        : seg(
            age,
            0.10,
            Math.max(0.2, (next ? next.at - card.at : K) - 0.10)
          );
      const glintX = 24 +
        Math.max(0, heroWidth - card.glintWidth - 48) * glintP;

      card.glint.style.background = sweepP >= 1
        ? rgba(V.card, 0.88)
        : rgba(V.accent, 0.45);
      card.glint.style.transform = `translateX(${glintX.toFixed(3)}px)`;
    });

    if (variant === "overlay" || T.exit > 0) {
      const entry = variant === "overlay"
        ? out(seg(time, 0, Math.min(0.22, T.key * 0.16)), 4)
        : 1;

      let gone = 0;

      if (T.exit > 0) {
        const exitDuration = Math.max(0, T.exit - 1 / CA.fps);
        gone = exitDuration > 0
          ? seg(time, T.key + T.hold, exitDuration)
          : (time >= T.key + T.hold ? 1 : 0);
      }

      const open = entry * (1 - gone * gone * gone);

      if (open <= 0.000001) {
        stageEl.style.clipPath = "inset(0 100% 0 0)";
      } else if (open >= 0.999999) {
        stageEl.style.clipPath = "none";
      } else {
        const reach = 62 * open;
        stageEl.style.clipPath =
          `polygon(${48 - reach}% -4%,${48 + reach}% -4%,` +
          `${52 + reach}% 104%,${52 - reach}% 104%)`;
      }
    } else {
      stageEl.style.clipPath = "none";
    }

    renderer.render(scene, camera);
  }

  window.__timelines["block"] = gsap.timeline({ paused: true });
  window.addEventListener("hf-seek", (event) => renderAt(event.detail.time));
  renderAt(window.__hfThreeTime || 0);
});