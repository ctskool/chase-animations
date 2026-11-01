CA.ready(() => {
  const { vars: V, stage: S, safe, time: T, variant, seeded } = CA;
  const stageEl = document.getElementById("stage");
  const printEl = document.getElementById("riso-print");
  const surface = document.getElementById("riso-surface");
  const copyEls = {
    top: document.getElementById("riso-kicker"),
    event: document.getElementById("riso-event"),
    details: document.getElementById("riso-details"),
  };

  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const number = (id, fallback, lo, hi) => {
    const value = Number(V[id]);
    return clamp(Number.isFinite(value) ? value : fallback, lo, hi);
  };

  const W = Math.max(1, Math.round(S.w));
  const H = Math.max(1, Math.round(S.h));
  const u = W / 1080;
  const fps = Math.max(1, Number(CA.fps) || 30);
  const TWO = 2 / fps;
  const EPS = 0.00001;
  const full = variant === "full";
  const overlay = variant === "overlay";
  const compact = !full;
  const timeScale = Math.max(0.0001, T.scale);
  const seed = Math.round(number("seed", 18, 1, 9999)) >>> 0;

  const tracking = number("tracking", 0.05, 0, 0.1);
  const registration = number("registration", 3, 0, 7);
  const slipDistance = number("slipDistance", 16, 8, 18);
  const slipFrames = Math.round(number("slipFrames", 3, 2, 3));
  const impactShove = number("impactShove", 10, 8, 12) * u;
  const finishOvershoot = number("finishOvershoot", 1.03, 1.015, 1.03);
  const holdPush = number("holdPush", 1, 0.5, 1) / 100;
  const knockoutClearance = number("knockoutClearance", 8, 4, 14);
  const grainAmount = number("grainAmount", 0.7, 0.2, 1);
  const paperTexture = number("paperTexture", 0.65, 0.1, 1);
  const roughness = number("edgeRoughness", 1.4, 0.6, 3) * u;
  const cell = number("halftoneCell", 12, 8, 20) * u;
  const dotCount = Math.round(number("dotCount", 11, 7, 17));
  const stripeWidth = number("stripeWidth", 22, 10, 40) * u;
  const stripeCrawl = number("stripeCrawl", 18, 4, 36) * u;

  const words = {
    hero: String(V.headlineLine1 || "").toUpperCase(),
    knockout: String(V.headlineLine2 || "").toUpperCase(),
    top: String(V.topLine || "").toUpperCase(),
    event: String(V.footerLine1 || "").toUpperCase(),
    details: String(V.footerLine2 || "").toUpperCase(),
  };

  surface.width = W;
  surface.height = H;
  const output = surface.getContext("2d");

  function canvas(w = W, height = H) {
    const el = document.createElement("canvas");
    el.width = Math.max(1, Math.ceil(w));
    el.height = Math.max(1, Math.ceil(height));
    return { el, ctx: el.getContext("2d") };
  }

  const measure = canvas(8, 8).ctx;
  const paperPad = Math.ceil(16 * u);
  const paper = canvas(W + paperPad * 2, H + paperPad * 2);
  const plates = [V.pink, V.blue].map((color) => ({
    color,
    raw: canvas(),
    printed: canvas(),
  }));

  // Reserve room for the completed poster's three-percent impression.
  const side = Math.max(safe.side, (full ? 64 : 48) * u) + 18 * u;
  const room = Math.max(1, W - side * 2);
  const top = Math.max(
    safe.top,
    (full ? 238 : overlay ? 28 : 24) * u,
  ) + (full ? 32 : 20) * u;
  const bottom = H - Math.max(
    safe.bottom,
    full ? Math.max(H * 0.2, 300 * u) : 24 * u,
  ) - (full ? 24 : 20) * u;
  const available = Math.max(1, bottom - top);
  const minCopyPx = (full ? 60 : overlay ? 52 : 48) * u;

  function copyWidth(text, px) {
    measure.font = `600 ${px}px "Barlow Condensed"`;
    return measure.measureText(text).width +
      Math.max(0, Array.from(text).length - 1) * px * 0.015;
  }

  function balancedLines(text, width, px) {
    const list = text.split(/\s+/).filter(Boolean);
    if (list.length < 3) return [text];

    let best = null;
    const firstSplit = list.length === 3 ? 1 : 2;

    for (let i = firstSplit; i <= list.length - 2; i++) {
      if (list[i] === "/" || list[i - 1] === "/") continue;

      const lines = [
        list.slice(0, i).join(" "),
        list.slice(i).join(" "),
      ];
      const widths = lines.map((line) => copyWidth(line, px));
      const score = Math.max(...widths) +
        Math.abs(widths[0] - widths[1]) * 0.22 +
        Math.max(0, Math.max(...widths) - width) * 2;

      if (!best || score < best.score) best = { lines, score };
    }

    return best ? best.lines : [text];
  }

  function copyLayout(text, width, startPx, practical = false) {
    const explicit = text.split(/\r?\n|\s*\|\s*/)
      .map((line) => line.replace(/\s+/g, " ").trim())
      .filter(Boolean);

    if (!explicit.length) {
      return { lines: [], px: startPx, sx: 1, h: 0 };
    }

    let lines;

    if (explicit.length > 1) {
      lines = [explicit[0], explicit.slice(1).join(" ")];
    } else {
      const clean = explicit[0];
      const sections = practical
        ? clean.split(/\s*\/\s*/).filter(Boolean)
        : [];

      if (
        sections.length >= 3 &&
        sections[sections.length - 1].split(/\s+/).length >= 2
      ) {
        lines = [
          sections.slice(0, -1).join(" / "),
          sections[sections.length - 1],
        ];
      } else {
        lines = copyWidth(clean, startPx) <= width
          ? [clean]
          : balancedLines(clean, width, startPx);
      }
    }

    if (lines.length === 2) {
      const last = lines[1].split(/\s+/);
      const first = lines[0].split(/\s+/);

      if (last.length === 1 && first.length >= 3) {
        last.unshift(first.pop());
        lines = [first.join(" "), last.join(" ")];
      }
    }

    let px = startPx;
    let widest = Math.max(...lines.map((line) => copyWidth(line, px)));

    if (widest > width) {
      px = Math.max(minCopyPx, Math.floor(px * width / widest));
      widest = Math.max(...lines.map((line) => copyWidth(line, px)));
    }

    return {
      lines,
      px,
      sx: Math.min(1, (width - 2) / Math.max(1, widest)),
      h: lines.length * px * 1.08,
    };
  }

  const columnGap = 28 * u;
  const eventWidth = compact ? room * 0.43 : room;
  const detailsWidth = compact
    ? room - eventWidth - columnGap
    : room;

  const copy = {
    top: copyLayout(
      words.top, room, (full ? 68 : overlay ? 58 : 56) * u,
    ),
    event: copyLayout(
      words.event, eventWidth, (full ? 80 : overlay ? 70 : 66) * u,
    ),
    details: copyLayout(
      words.details,
      detailsWidth,
      (full ? 72 : overlay ? 64 : 60) * u,
      true,
    ),
  };

  const L = {
    top: { x: side, y: top, w: room, h: copy.top.h },
  };

  if (full) {
    L.details = {
      x: side,
      y: bottom - copy.details.h,
      w: room,
      h: copy.details.h,
    };
    L.event = {
      x: side,
      y: L.details.y - (copy.details.h ? 16 * u : 0) - copy.event.h,
      w: room,
      h: copy.event.h,
    };
  } else {
    const footerH = Math.max(copy.event.h, copy.details.h);
    const footerY = bottom - footerH;

    L.event = {
      x: side, y: footerY, w: eventWidth, h: footerH,
    };
    L.details = {
      x: side + eventWidth + columnGap,
      y: footerY,
      w: detailsWidth,
      h: footerH,
    };
  }

  const footerTop = Math.min(L.event.y, L.details.y);
  const rampH = clamp(
    available * 0.025,
    (full ? 30 : overlay ? 24 : 22) * u,
    (full ? 38 : overlay ? 30 : 28) * u,
  );

  L.ramp = {
    x: side + 8 * u,
    y: footerTop - (full ? 22 : 18) * u - rampH,
    w: room - 16 * u,
    h: rampH,
  };

  const bandH = clamp(
    available * (full ? 0.195 : 0.228),
    (full ? 224 : overlay ? 168 : 150) * u,
    (full ? 274 : overlay ? 220 : 204) * u,
  );

  L.band = {
    x: side + 8 * u,
    y: L.ramp.y - (full ? 20 : 18) * u - bandH,
    w: room - 16 * u,
    h: bandH,
  };

  const heroH = clamp(
    available * (full ? 0.178 : 0.195),
    (full ? 204 : overlay ? 150 : 140) * u,
    (full ? 260 : overlay ? 200 : 186) * u,
  );

  L.hero = {
    x: side + 8 * u,
    y: top + copy.top.h + (full ? 16 : 12) * u,
    w: room - 16 * u,
    h: heroH,
  };

  const artTop = L.hero.y + L.hero.h + (full ? 18 : 12) * u;

  // The banner crosses the lower part of the actual lens, rather
  // than landing below it. The separated arrival poses also fit.
  const circleBottom = L.band.y + L.band.h * 0.88;
  const circleD = Math.max(48 * u, Math.min(
    room / 1.62,
    circleBottom - artTop,
    (W - 32 * u) / 1.78,
  ));

  L.circles = [0, 1].map((index) => ({
    x: W / 2 + (index === 0 ? -1 : 1) * circleD * 0.31 -
      circleD / 2,
    y: circleBottom - circleD,
    w: circleD,
    h: circleD,
  }));

  const posterPivotY = (top + bottom) / 2;
  printEl.style.transformOrigin = `${W / 2}px ${posterPivotY}px`;

  // Author the build in 30-fps design frames, then put its drawings
  // on pairs of real frames after applying the requested key time.
  const buildFrame = (frame) =>
    Math.max(0, Math.round(frame / 30 * timeScale * fps / 2) * 2);

  const F = {
    pinkStart: buildFrame(4),
    pinkHit: buildFrame(8),
    blueStart: buildFrame(10),
    blueHit: buildFrame(14),
    converge: buildFrame(18),
    meet: buildFrame(20),
    bandStart: buildFrame(24),
    bandHit: buildFrame(26),
    ramp: buildFrame(30),
    eventStart: buildFrame(32),
    eventHit: buildFrame(36),
    detailsStart: buildFrame(36),
    detailsHit: buildFrame(40),
  };

  const impactFrames = [
    F.pinkHit, F.blueHit, F.bandHit, F.eventHit, F.detailsHit,
  ];

  function typeLayout(text, maxWidth, capHeight) {
    const chars = Array.from(text);
    const px = Math.max(40 * u, capHeight / 0.72);
    measure.font = `800 ${px}px "Bricolage Grotesque"`;

    const metrics = measure.measureText(text || "H");
    const ascent = metrics.actualBoundingBoxAscent || px * 0.74;
    const descent = metrics.actualBoundingBoxDescent || 0;
    const widths = chars.map((ch) => measure.measureText(ch).width);
    const gap = px * tracking;
    const width = widths.reduce((sum, value) => sum + value, 0) +
      Math.max(0, chars.length - 1) * gap;

    return {
      chars, widths, gap, ascent, descent,
      sx: maxWidth / Math.max(1, width),
      sy: capHeight / Math.max(1, ascent + descent),
      width: maxWidth,
      font: `800 ${px}px "Bricolage Grotesque"`,
    };
  }

  const types = {
    hero: typeLayout(words.hero, L.hero.w, L.hero.h * 0.96),
    knockout: typeLayout(
      words.knockout,
      L.band.w - (full ? 64 : 56) * u,
      L.band.h * 0.80,
    ),
  };

  function drawType(ctx, info, x, centerY, strokeWidth = 0) {
    if (!info.chars.length) return;

    ctx.save();
    ctx.font = info.font;
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";
    ctx.translate(
      x - info.width / 2,
      centerY + (info.ascent - info.descent) * info.sy / 2,
    );
    ctx.scale(info.sx, info.sy);

    if (strokeWidth > 0) {
      ctx.lineJoin = "round";
      ctx.miterLimit = 2;
      ctx.lineWidth = strokeWidth /
        Math.max(0.01, Math.min(info.sx, info.sy));
    }

    let cursor = 0;
    info.chars.forEach((ch, index) => {
      if (strokeWidth > 0) ctx.strokeText(ch, cursor, 0);
      else ctx.fillText(ch, cursor, 0);

      cursor += info.widths[index] + info.gap;
    });

    ctx.restore();
  }

  function makeTexture(textureSeed) {
    const tile = canvas(192, 192);
    const ctx = tile.ctx;
    const img = ctx.createImageData(192, 192);
    const rnd = seeded(textureSeed);
    const coarse = Array.from({ length: 13 * 13 }, () => rnd());

    function field(x, y) {
      const gx = x / 16;
      const gy = y / 16;
      const ix = Math.floor(gx);
      const iy = Math.floor(gy);
      const fx = gx - ix;
      const fy = gy - iy;
      const a = coarse[iy * 13 + ix];
      const b = coarse[iy * 13 + ix + 1];
      const c = coarse[(iy + 1) * 13 + ix];
      const d = coarse[(iy + 1) * 13 + ix + 1];

      return (a + (b - a) * fx) * (1 - fy) +
        (c + (d - c) * fx) * fy;
    }

    for (let y = 0; y < 192; y++) {
      for (let x = 0; x < 192; x++) {
        const i = (y * 192 + x) * 4;
        let alpha = 1 - grainAmount * (
          0.04 + (1 - field(x, y)) * 0.28 + rnd() * 0.17
        );

        if (rnd() < 0.012 + grainAmount * 0.034) alpha = 0;

        img.data[i] = 255;
        img.data[i + 1] = 255;
        img.data[i + 2] = 255;
        img.data[i + 3] = Math.round(clamp(alpha, 0, 1) * 255);
      }
    }

    ctx.putImageData(img, 0, 0);
    return tile.el;
  }

  const textures = [0, 1].map((ink) =>
    Array.from({ length: 8 }, (_, index) =>
      makeTexture((seed + ink * 104729 + index * 7919) >>> 0),
    ),
  );
  const copyMasks = textures[1].map((tile) =>
    `url("${tile.toDataURL()}")`,
  );

  Object.keys(copyEls).forEach((key) => {
    const el = copyEls[key];
    const info = copy[key];
    const box = L[key];

    el.textContent = "";
    el.style.left = `${box.x}px`;
    el.style.top = `${box.y}px`;
    el.style.width = `${box.w}px`;
    el.style.height = `${box.h}px`;
    el.style.fontSize = `${info.px}px`;
    el.style.color = V.blue;
    el.style.maskImage = copyMasks[0];
    el.style.webkitMaskImage = copyMasks[0];
    el.style.maskSize = "192px 192px";
    el.style.webkitMaskSize = "192px 192px";
    el.style.transformOrigin = "left center";
    el.style.visibility = "hidden";
    el.setAttribute("aria-label", info.lines.join(" "));

    info.lines.forEach((line) => {
      const span = document.createElement("span");
      span.className = "riso-copy-line";
      span.textContent = line;
      span.style.transform = `scaleX(${info.sx})`;
      el.appendChild(span);
    });
  });

  function drawPaper() {
    const ctx = paper.ctx;
    const rnd = seeded(seed ^ 0x7163a927);
    const pw = paper.el.width;
    const ph = paper.el.height;

    ctx.clearRect(0, 0, pw, ph);
    ctx.fillStyle = V.blue;
    ctx.globalAlpha = 0.007 * paperTexture;

    for (let i = 0; i < 180; i++) {
      ctx.beginPath();
      ctx.ellipse(
        rnd() * pw, rnd() * ph,
        (18 + rnd() * 112) * u,
        (12 + rnd() * 70) * u,
        rnd() * Math.PI, 0, Math.PI * 2,
      );
      ctx.fill();
    }

    ctx.strokeStyle = V.blue;
    ctx.lineWidth = 0.65 * u;
    ctx.globalAlpha = 0.045 * paperTexture;

    const fibres = Math.round(W * H / (340 * u * u));
    for (let i = 0; i < fibres; i++) {
      const x = rnd() * pw;
      const y = rnd() * ph;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(
        x + (1 + rnd() * 7) * u,
        y + (rnd() - 0.5) * 3 * u,
      );
      ctx.stroke();
    }

    ctx.globalAlpha = 0.16 * paperTexture;
    for (let i = 0; i < 38; i++) {
      ctx.fillStyle = i % 2 ? V.pink : V.blue;
      const r = (0.45 + rnd() * 0.8) * u;
      ctx.beginPath();
      ctx.arc(rnd() * pw, rnd() * ph, r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  }

  drawPaper();

  function element(ctx, box, pose, painter) {
    if (!pose) return;

    ctx.save();
    ctx.translate(
      box.x + box.w / 2 + pose.x,
      box.y + box.h / 2 + pose.y,
    );
    ctx.rotate(pose.angle * Math.PI / 180);
    ctx.scale(pose.sx, pose.sy);
    ctx.translate(-box.w / 2, -box.h / 2);
    painter(box.w, box.h);
    ctx.restore();
  }

  function raggedPolygon(ctx, points, drawingSeed) {
    const rnd = seeded(drawingSeed);
    ctx.beginPath();

    points.forEach((a, index) => {
      const b = points[(index + 1) % points.length];
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const length = Math.hypot(dx, dy);
      const pieces = Math.max(1, Math.ceil(length / (9 * u)));

      for (let j = 0; j < pieces; j++) {
        const p = j / pieces;
        const offset = j === 0 ? 0 : (rnd() - 0.5) * roughness;
        const x = a[0] + dx * p - dy / Math.max(1, length) * offset;
        const y = a[1] + dy * p + dx / Math.max(1, length) * offset;

        if (index === 0 && j === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
    });

    ctx.closePath();
  }

  function shoveAt(frame) {
    if (frame < F.bandHit) return 0;
    if (frame === F.bandHit) return impactShove;
    if (frame < F.bandHit + 3) return -impactShove * 0.4;
    if (frame < F.bandHit + 5) return impactShove * 0.15;
    return 0;
  }

  function heroPose(frame) {
    const step = Math.min(3, Math.floor(frame / 2));
    const scale = [1.10, 0.95, 1.018, 1][step];

    return {
      sx: scale,
      sy: scale,
      x: 0,
      y: [0, 3, -1, 0][step] * u + shoveAt(frame),
      angle: [-0.9, 0.25, -0.08, 0][step],
    };
  }

  function circlePose(index, frame) {
    const start = index === 0 ? F.pinkStart : F.blueStart;
    const hit = index === 0 ? F.pinkHit : F.blueHit;
    const sign = index === 0 ? -1 : 1;
    if (frame < start) return null;

    const pose = {
      sx: 0.86,
      sy: 0.86,
      x: sign * circleD * 0.15,
      y: 0,
      angle: 0,
    };

    if (frame < hit) {
      const elapsed = Math.floor((frame - start) / 2) * 2;
      const progress = clamp(elapsed / Math.max(2, hit - start), 0, 1);
      const remaining = Math.pow(1 - progress, 3);

      // Move the printed object itself. There is no reveal mask.
      pose.x += sign * (W + circleD) * remaining;
      pose.y = 4 * u * remaining;
      pose.angle = sign * 2.5 * remaining;
    } else if (frame === hit) {
      // A single exposed impact frame, then paired recovery drawings.
      pose.sx = 0.89;
      pose.sy = 0.83;
      pose.y = 2 * u;
    } else if (frame < hit + 3) {
      pose.sx = 0.85;
      pose.sy = 0.87;
      pose.y = -u;
    }

    if (frame >= F.converge && frame < F.meet) {
      // A visible paper gap remains between both screens here.
      pose.x = sign * circleD * 0.145;
      pose.sx = 0.90;
      pose.sy = 0.90;
      pose.y = 0;
      pose.angle = 0;
    } else if (frame >= F.meet) {
      const step = Math.min(3, Math.floor((frame - F.meet) / 2));
      const scale = [1.018, 0.985, 1.004, 1][step];

      pose.x = sign * circleD * [-0.018, 0.028, -0.007, 0][step];
      pose.sx = scale;
      pose.sy = scale;
      pose.y = [0, -2, 1, 0][step] * u;
      pose.angle = 0;
    }

    pose.y += shoveAt(frame);
    return pose;
  }

  function bandPose(frame) {
    if (frame < F.bandStart) return null;

    if (frame < F.bandHit) {
      return {
        sx: 1.14,
        sy: 1.14,
        x: 0,
        y: -Math.min(84 * u, circleD * 0.16),
        angle: -1.4,
      };
    }

    if (frame === F.bandHit) {
      return { sx: 1, sy: 0.96, x: 0, y: 0, angle: 0 };
    }

    const step = Math.min(
      2, Math.floor((frame - F.bandHit - 1) / 2),
    );

    return {
      sx: [0.91, 1.025, 1][step],
      sy: [0.91, 1.025, 1][step],
      x: 0,
      y: [3, -2, 0][step] * u,
      angle: [0.35, -0.1, 0][step],
    };
  }

  function drawCircle(ctx, index, frame, drawingSeed) {
    const pose = circlePose(index, frame);
    if (!pose) return;

    element(ctx, L.circles[index], pose, (w, height) => {
      const radius = Math.min(w, height) / 2 - 4 * u;
      const rnd = seeded(drawingSeed);

      ctx.translate(w / 2, height / 2);
      ctx.beginPath();

      for (let i = 0; i < 144; i++) {
        const angle = i / 144 * Math.PI * 2;
        const r = radius + (rnd() - 0.5) * roughness * 1.6;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      ctx.closePath();
      ctx.clip();

      // Both inward-facing areas are solid ink, so the lens is
      // made by multiplication only when the circles physically meet.
      if (index === 0) {
        ctx.fillRect(-radius * 0.4, -radius, radius * 1.4, radius * 2);
      } else {
        ctx.fillRect(-radius, -radius, radius * 1.4, radius * 2);
      }

      ctx.rotate((index === 0 ? 15 : 75) * Math.PI / 180);
      const extent = radius * 1.6 + cell * 2;
      ctx.beginPath();

      for (let y = -extent; y <= extent; y += cell) {
        for (let x = -extent; x <= extent; x += cell) {
          const r = cell * 0.33;
          ctx.moveTo(x + r, y);
          ctx.arc(x, y, r, 0, Math.PI * 2);
        }
      }

      ctx.fill();
    });
  }

  function drawBand(ctx, index, frame, time, drawingSeed) {
    const pose = bandPose(frame);
    if (!pose) return;

    element(ctx, L.band, pose, (w, height) => {
      ctx.save();
      raggedPolygon(ctx, [
        [0, 0],
        [w - 14 * u, 0],
        [w, height],
        [14 * u, height],
      ], drawingSeed);
      ctx.clip();

      if (index === 0) {
        const phase = (time * stripeCrawl) % (stripeWidth * 2);
        const lean = height * 0.7;
        ctx.beginPath();

        for (
          let x = -height * 2 - stripeWidth * 2;
          x < w + height * 2;
          x += stripeWidth * 2
        ) {
          ctx.moveTo(x + phase, 0);
          ctx.lineTo(x + stripeWidth + phase, 0);
          ctx.lineTo(x + stripeWidth + phase + lean, height);
          ctx.lineTo(x + phase + lean, height);
          ctx.closePath();
        }

        ctx.fill();
        drawType(
          ctx,
          types.knockout,
          w / 2,
          height / 2,
          knockoutClearance * 2 * u,
        );
      } else {
        ctx.fillRect(0, 0, w, height);
      }

      ctx.restore();

      // The same moving stencil knocks out this ink's circles too.
      // Only the current stamp pose exists; no stationary text copy.
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      drawType(ctx, types.knockout, w / 2, height / 2);
      ctx.restore();
    });
  }

  function drawRamp(ctx, index, frame, finished) {
    if (frame < F.ramp) return;

    const step = Math.max(0, Math.floor((frame - F.ramp) / 2));
    const count = Math.min(
      dotCount,
      Math.ceil(dotCount * [0.35, 0.7, 1][Math.min(2, step)]),
    );
    const box = L.ramp;
    const maxR = box.h * 0.33;
    const firstX = box.x + maxR + 8 * u;
    const lastX = box.x + box.w - maxR - 8 * u;
    const density = finished ? 1.12 : 1;

    ctx.beginPath();
    for (let i = 0; i < count; i++) {
      const p = i / Math.max(1, dotCount - 1);
      const x = firstX + (lastX - firstX) * p;
      const r = (2.5 * u + (maxR - 2.5 * u) * p) *
        (index === 0 ? 1 : 0.78) * density;

      ctx.moveTo(x + r, box.y + box.h / 2);
      ctx.arc(x, box.y + box.h / 2, r, 0, Math.PI * 2);
    }

    ctx.fill();
  }

  function inkTexture(plate, index, drawing) {
    const ctx = plate.raw.ctx;
    const rnd = seeded((
      seed + Math.imul(drawing + 16384, 374761393) + index * 668265263
    ) >>> 0);
    const bank = textures[index];
    const texture = bank[Math.abs(drawing * 5 + index * 3) % bank.length];
    const offsetX = Math.floor(rnd() * 192);
    const offsetY = Math.floor(rnd() * 192);

    ctx.save();
    ctx.globalCompositeOperation = "destination-in";
    ctx.fillStyle = ctx.createPattern(texture, "repeat");
    ctx.translate(offsetX, offsetY);
    ctx.fillRect(-offsetX, -offsetY, W, H);
    ctx.restore();

    const printed = plate.printed.ctx;
    printed.setTransform(1, 0, 0, 1, 0, 0);
    printed.globalCompositeOperation = "source-over";
    printed.clearRect(0, 0, W, H);

    const strip = Math.max(1, Math.round((full ? 4 : 3) * u));
    for (let y = 0; y < H; y += strip) {
      const height = Math.min(strip, H - y);
      const jitter = (rnd() - 0.5) * roughness;

      printed.drawImage(
        plate.raw.el,
        0, y, W, height,
        jitter, y, W, height,
      );
    }
  }

  function platePose(index, drawing, snapIndex, finished) {
    const sign = index === 0 ? -1 : 1;
    let separation = registration;
    let jitterX = 0;
    let jitterY = 0;

    if (snapIndex >= 0) {
      const amounts = slipFrames === 3 ? [1, 0.5, 0.2] : [1, 0.35];
      const amount = amounts[Math.min(amounts.length - 1, snapIndex)];
      separation = registration +
        (Math.max(registration, slipDistance) - registration) * amount;
    } else if (!finished) {
      const rnd = seeded((
        seed + Math.imul(drawing + 32768, 1103515245) + index * 123457
      ) >>> 0);
      jitterX = (rnd() - 0.5) * 0.7;
      jitterY = (rnd() - 0.5) * 0.5;
    }

    // slipDistance is the TOTAL separation, never each plate's travel.
    // The reading pose has a fixed fringe after the exact key moment.
    return {
      dx: (sign * separation / 2 + jitterX) * u,
      dy: (sign * 0.45 + jitterY) * u,
    };
  }

  function copyPose(key, frame) {
    if (key === "top") return { x: 0, y: 0, sy: 1 };

    const start = key === "event" ? F.eventStart : F.detailsStart;
    const hit = key === "event" ? F.eventHit : F.detailsHit;
    if (frame < start) return null;

    if (frame < hit) {
      const elapsed = Math.floor((frame - start) / 2) * 2;
      const progress = clamp(elapsed / Math.max(2, hit - start), 0, 1);
      return {
        x: (W + L[key].w) * Math.pow(1 - progress, 3),
        y: 0,
        sy: 1,
      };
    }

    if (frame === hit) return { x: 0, y: 2 * u, sy: 0.96 };
    if (frame < hit + 3) return { x: -3 * u, y: -u, sy: 1.01 };
    return { x: 0, y: 0, sy: 1 };
  }

  function renderCopy(key, frame, inkPose, drawing) {
    const el = copyEls[key];
    const pose = copyPose(key, frame);

    if (!pose || !copy[key].lines.length) {
      el.style.visibility = "hidden";
      return;
    }

    const maskPosition =
      `${drawing * 19 % 192}px ${drawing * 31 % 192}px`;
    const mask = copyMasks[Math.abs(drawing * 5 + 3) % copyMasks.length];

    el.style.visibility = "visible";
    el.style.transform =
      `translate(${pose.x + inkPose.dx}px, ${pose.y + inkPose.dy}px) ` +
      `scaleY(${pose.sy})`;
    el.style.maskImage = mask;
    el.style.webkitMaskImage = mask;
    el.style.maskPosition = maskPosition;
    el.style.webkitMaskPosition = maskPosition;
  }

  function posterScale(postDrawing, time) {
    const step = Math.min(4, postDrawing);
    if (step < 4) {
      return [
        finishOvershoot,
        0.996,
        1 + (finishOvershoot - 1) * 0.36,
        1 + (finishOvershoot - 1) * 0.1,
      ][step];
    }

    const settleTime = 8 / fps;
    const progress = clamp(
      (time - T.key - settleTime) /
        Math.max(1 / fps, T.hold - settleTime),
      0, 1,
    );
    return 1 + holdPush * progress;
  }

  let lastSample = "";

  function renderAt(realTime) {
    const time = clamp(Number(realTime) || 0, 0, T.duration);
    const actualFrame = Math.floor(time * fps + EPS);
    const finished = time + EPS >= T.key;
    const snapStart = T.key - slipFrames / fps;
    const snapIndex = !finished && time + EPS >= snapStart
      ? clamp(Math.floor((time - snapStart) * fps + EPS), 0, slipFrames - 1)
      : -1;
    const postDrawing = finished
      ? Math.max(0, Math.floor((time - T.key + EPS) * fps / 2))
      : 0;

    let frame = actualFrame - actualFrame % 2;

    // Impacts are deliberately one frame. Everything else holds on twos,
    // including the recovery drawing immediately after each impact.
    if (impactFrames.some((hit) =>
      actualFrame === hit || actualFrame === hit + 1
    )) {
      frame = actualFrame;
    }

    if (finished) frame = F.detailsHit + 20;

    const sample = finished
      ? `hold:${postDrawing}`
      : `build:${frame}:snap:${snapIndex}`;
    if (sample === lastSample) return;
    lastSample = sample;

    const sampledTime = finished
      ? T.key + postDrawing * TWO
      : snapIndex >= 0
        ? snapStart + snapIndex / fps
        : frame / fps;
    const drawing = finished
      ? 10000 + postDrawing
      : Math.floor(actualFrame / 2);
    const inkPoses = [0, 1].map((index) =>
      platePose(index, drawing, snapIndex, finished),
    );

    const scale = finished ? posterScale(postDrawing, sampledTime) : 1;
    printEl.style.transform = `scale(${scale})`;

    renderCopy("top", frame, inkPoses[1], drawing);
    renderCopy("event", frame, inkPoses[1], drawing);
    renderCopy("details", frame, inkPoses[1], drawing);

    surface.setAttribute("aria-label", [
      words.hero,
      frame >= F.bandStart ? words.knockout : "",
    ].filter(Boolean).join(". "));

    plates.forEach((plate, index) => {
      const ctx = plate.raw.ctx;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = plate.color;
      ctx.strokeStyle = plate.color;

      const drawingSeed = (
        seed +
        Math.imul(index + 1, 1597334677) +
        Math.imul(drawing + 16384, 1013904223)
      ) >>> 0;

      element(ctx, L.hero, heroPose(frame), (w, height) => {
        drawType(ctx, types.hero, w / 2, height / 2);
      });

      drawCircle(ctx, index, frame, drawingSeed);
      drawBand(
        ctx, index, frame, sampledTime,
        drawingSeed ^ 0x61c88647,
      );
      drawRamp(ctx, index, frame, finished);
      inkTexture(plate, index, drawing);
    });

    output.setTransform(1, 0, 0, 1, 0, 0);
    output.globalAlpha = 1;
    output.globalCompositeOperation = "source-over";
    output.clearRect(0, 0, W, H);
    output.fillStyle = V.paper;
    output.fillRect(0, 0, W, H);

    // Move only the faint paper field, with overscan so the card stays
    // completely opaque. This never translates an individual word.
    const paperX = Math.sin(sampledTime * 0.43) * 1.8 * u;
    const paperY = Math.sin(sampledTime * 0.31 + 0.7) * 1.2 * u;
    output.drawImage(
      paper.el,
      -paperPad + paperX,
      -paperPad + paperY,
    );

    output.globalCompositeOperation = "multiply";
    plates.forEach((plate, index) => {
      const pose = inkPoses[index];
      output.drawImage(plate.printed.el, pose.dx, pose.dy);
    });
    output.globalCompositeOperation = "source-over";
  }

  const tl = gsap.timeline({ paused: true });
  const build = gsap.timeline();
  const clock = { design: 0, real: T.key };

  build.fromTo(clock,
    { design: 0 },
    {
      design: T.design,
      duration: T.design,
      ease: "none",
      modifiers: {
        design(value) {
          renderAt(Number(value) * timeScale);
          return value;
        },
      },
    }, 0);

  build.timeScale(1 / timeScale);
  tl.add(build, 0);

  const tail = Math.max(0, T.duration - T.key);
  if (tail > 0) {
    tl.fromTo(clock,
      { real: T.key },
      {
        real: T.duration,
        duration: tail,
        ease: "none",
        immediateRender: false,
        modifiers: {
          real(value) {
            renderAt(Number(value));
            return value;
          },
        },
      }, T.key);
  }

  const closed = "inset(0% 0% 100% 0%)";
  const open = "inset(0% 0% 0% 0%)";
  const stepped = (duration) =>
    `steps(${Math.max(1, Math.round(duration * fps / 2))})`;

  if (overlay) {
    const entrance = Math.min(4 / fps, T.key * 0.08);
    tl.fromTo(stageEl,
      { clipPath: closed },
      {
        clipPath: open,
        duration: entrance,
        ease: stepped(entrance),
      }, 0);
  }

  if (T.exit > 0) {
    const duration = Math.max(0, T.exit - 1 / fps);

    if (duration > 0) {
      tl.to(stageEl, {
        clipPath: closed,
        duration,
        ease: stepped(duration),
      }, T.key + T.hold);
    } else {
      tl.set(stageEl, { clipPath: closed }, T.key + T.hold);
    }
  }

  window.addEventListener("hf-seek", (event) => {
    const time = Number(event.detail && event.detail.time);
    if (Number.isFinite(time)) renderAt(time);
  });

  window.__timelines["block"] = tl;
  renderAt(window.__hfThreeTime || 0);
});