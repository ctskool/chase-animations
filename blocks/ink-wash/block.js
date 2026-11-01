CA.ready(() => {
  const {
    vars: V, stage: S, safe, time: T, variant,
    make, rgba, seeded,
  } = CA;

  const $ = (id) => document.getElementById(id);
  const W = S.w;
  const H = S.h;
  const sx = W / 1080;
  const full = variant === "full";
  const minText = full ? 40 : 32;
  const stageEl = $("stage");

  const num = (key, fallback) => {
    const value = Number(V[key]);
    return Number.isFinite(value) ? value : fallback;
  };
  const clamp = (value, lo = 0, hi = 1) =>
    Math.max(lo, Math.min(hi, value));
  const mix = (a, b, p) => a + (b - a) * p;
  const smooth = (value) => {
    const p = clamp(value);
    return p * p * (3 - 2 * p);
  };
  const out = (value) => 1 - (1 - clamp(value)) ** 3;
  const progress = (frame, start, end) =>
    clamp((frame - start) / Math.max(0.001, end - start));
  const at = (frame) => frame / 119 * T.design;
  const designFrame = (time) => time <= T.key
    ? time / Math.max(0.0001, T.key) * 119
    : 119 + (time - T.key) * 30;

  const seed = Math.round(num("seed", 7));
  const side = Math.max(full ? 64 * sx : 32 * sx, safe.side);
  const topSafe = full
    ? Math.max(230, safe.top)
    : Math.max(18, Math.min(36, safe.top, H * 0.04));
  const contentBottom = full
    ? H - Math.max(300, safe.bottom) - 14
    : H - 28 * sx;
  const paintMargin = Math.max(16, 24 * sx);
  const landscapeInset = Math.max(28, 48 * sx);

  stageEl.style.background = V.paper;

  const compactSubtitle = Math.max(
    minText,
    Math.min(num("subtitleSize", 80), 76, H * 0.085),
  ) * sx;

  const layouts = {
    full: {
      titleX: num("titleX", 862) * sx,
      titleY: Math.max(
        topSafe + 24,
        num("titleY", 270) * H / 1920,
      ),
      titleMax: num("titleSize", 176) * sx,
      titleBudget: 820 * sx,
      subX: num("subtitleX", 84) * sx,
      subtitle: num("subtitleSize", 80) * sx,
      sealX: num("sealX", 812) * sx,
      sealY: num("sealY", 1320) * H / 1920,
      seal: num("sealSize", 108) * sx,
      sceneTop: num("landscapeTop", 552) * H / 1920,
      sceneBottom: num("landscapeBottom", 1450) * H / 1920,
      rightDrop: H * 0.22,
      sunScale: 1,
      treeStretch: 1,
      boatFactor: 1,
      boatX: W * 0.60,
      boatY: contentBottom - 122 * sx,
    },
    top: {
      titleX: W * 0.815 + (num("titleX", 862) - 862) * sx,
      titleY: topSafe + 8 * sx +
        (num("titleY", 270) - 270) * 0.25,
      titleMax: Math.min(num("titleSize", 176), 132) * sx,
      titleBudget: Math.min(520 * sx, H * 0.53),
      subX: Math.max(
        side + 14 * sx,
        num("subtitleX", 84) * 0.76 * sx,
      ),
      subtitle: compactSubtitle,
      sealX: W * 0.815 + (num("sealX", 812) - 812) * sx,
      sealY: H * 0.705 +
        (num("sealY", 1320) - 1320) * H / 1920,
      seal: num("sealSize", 108) * 0.88 * sx,
      sceneTop: H * 0.31 +
        (num("landscapeTop", 552) - 552) * H / 1920,
      sceneBottom: H * 0.82 +
        (num("landscapeBottom", 1450) - 1450) * H / 1920,
      rightDrop: H * 0.13,
      sunScale: Math.min(1, H / (900 * sx)),
      treeStretch: 1.24,
      boatFactor: 0.92 * Math.min(1, H / (820 * sx)),
      boatX: W * 0.59,
      boatY: H * 0.845,
    },
    overlay: {
      titleX: W * 0.81 + (num("titleX", 862) - 862) * sx,
      titleY: topSafe + 12 * sx +
        (num("titleY", 270) - 270) * 0.25,
      titleMax: Math.min(num("titleSize", 176), 130) * sx,
      titleBudget: Math.min(510 * sx, H * 0.525),
      subX: Math.max(
        side + 16 * sx,
        num("subtitleX", 84) * 0.78 * sx,
      ),
      subtitle: compactSubtitle,
      sealX: W * 0.805 + (num("sealX", 812) - 812) * sx,
      sealY: H * 0.72 +
        (num("sealY", 1320) - 1320) * H / 1920,
      seal: num("sealSize", 108) * 0.86 * sx,
      sceneTop: H * 0.30 +
        (num("landscapeTop", 552) - 552) * H / 1920,
      sceneBottom: H * 0.83 +
        (num("landscapeBottom", 1450) - 1450) * H / 1920,
      rightDrop: H * 0.14,
      sunScale: Math.min(1, H / (910 * sx)),
      treeStretch: 1.22,
      boatFactor: 0.91 * Math.min(1, H / (820 * sx)),
      boatX: W * 0.60,
      boatY: H * 0.85,
    },
  };

  const L = { ...(layouts[variant] || layouts.full) };
  L.sceneTop = Math.max(paintMargin + 24 * sx, L.sceneTop);
  L.sceneBottom = Math.max(
    L.sceneTop + H * 0.24,
    Math.min(L.sceneBottom, contentBottom - 70 * sx),
  );

  // Measure the finished lettering before constructing the mountain geometry.
  // Its reserved sky remains clear throughout the entire animation.
  const titleText = String(V.title || "")
    .trim().replace(/\s+/g, " ").toUpperCase();
  const words = titleText ? titleText.split(" ") : [];
  let columns = words;

  if (words.length > 1) {
    let best = 1;
    let difference = Infinity;

    for (let i = 1; i < words.length; i++) {
      const d = Math.abs(
        words.slice(0, i).join(" ").length -
        words.slice(i).join(" ").length,
      );

      if (d < difference) {
        best = i;
        difference = d;
      }
    }

    columns = [
      words.slice(0, best).join(" "),
      words.slice(best).join(" "),
    ];
  }

  const columnUnits = (text) => Math.max(
    1,
    Array.from(text).reduce(
      (sum, ch) => sum + (ch === " " ? 0.55 : 1.02), 0,
    ) - 0.04,
  );
  const longest = Math.max(1, ...columns.map(columnUnits));
  const titleRoom = Math.max(
    minText,
    Math.min(
      L.titleBudget,
      contentBottom - L.titleY - (full ? 350 * sx : H * 0.32),
    ),
  );
  const titlePx = Math.max(
    minText,
    Math.min(L.titleMax, titleRoom / longest),
  );
  const titlePitch = titlePx * 1.16;
  const titleColumns = [];
  const titleRight = Math.min(
    L.titleX,
    W - side - titlePx * 0.63,
  );
  const titleLeft = titleRight -
    Math.max(0, columns.length - 1) * titlePitch -
    titlePx * 0.6;
  const titleBottom = L.titleY + longest * titlePx;

  $("iw-title").setAttribute("aria-label", titleText);

  columns.forEach((text, columnIndex) => {
    const column = make("div", "iw-column", $("iw-title"));
    const centre = titleRight -
      (columns.length - 1 - columnIndex) * titlePitch;

    column.style.cssText = `
      left:${centre - titlePx * 0.6}px;
      top:${L.titleY}px;
      width:${titlePx * 1.2}px;
      font-size:${titlePx}px;
      color:${V.ink};
    `;

    const chars = Array.from(text);

    chars.forEach((ch, index) => {
      if (ch === " ") {
        const space = make("span", "iw-word-space", column);
        space.style.height = titlePx * 0.55 + "px";
        return;
      }

      const glyph = make("span", "iw-glyph", column, ch);
      glyph.setAttribute("aria-hidden", "true");
      glyph.style.height = titlePx * 0.98 + "px";
      glyph.style.marginBottom =
        (index === chars.length - 1 ? 0 : titlePx * 0.04) + "px";
    });

    titleColumns.push(column);
  });

  function sizeLine(element, size, maxWidth, floor = minText) {
    let px = Math.max(floor, size);
    element.style.fontSize = px + "px";
    const width = element.offsetWidth;

    if (width > maxWidth && width > 0) {
      px = Math.max(floor, Math.floor(px * maxWidth / width));
      element.style.fontSize = px + "px";
    }

    return px;
  }

  const sub = $("iw-subtitle");
  const subcopy = $("iw-subcopy");
  subcopy.textContent = String(V.subtitle || "").trim();

  const subX = Math.max(side, L.subX);
  const subWidth = Math.max(
    minText * 3,
    Math.min(
      W - subX - side,
      titleColumns.length ? titleLeft - subX - 24 * sx : W,
    ),
  );
  const subtitleFloor = Math.max(
    minText,
    Math.min((full ? 68 : 56) * sx, L.subtitle),
  );
  const actualSubPx = sizeLine(
    subcopy,
    L.subtitle,
    Math.max(minText * 2, subWidth - L.subtitle * 0.5),
    subtitleFloor,
  );

  sub.style.cssText += `
    left:${subX}px;
    top:${L.titleY}px;
    font-size:${actualSubPx}px;
    color:${V.ink};
    max-width:${subWidth}px;
  `;

  $("iw-sub-square").style.cssText = `
    width:${Math.max(7 * sx, actualSubPx * 0.14)}px;
    height:${Math.max(7 * sx, actualSubPx * 0.14)}px;
    background:${V.red};
  `;

  if (subcopy.offsetWidth > subWidth - actualSubPx * 0.5) {
    subcopy.style.whiteSpace = "normal";
    subcopy.style.maxWidth =
      Math.max(minText * 2, subWidth - actualSubPx * 0.5) + "px";
    subcopy.style.textWrap = "balance";
    subcopy.style.overflowWrap = "normal";
  }

  if (!subcopy.textContent) sub.style.display = "none";

  const chapter = $("iw-chapter");
  const chapterCopy = $("iw-chapter-copy");
  chapterCopy.textContent = String(V.chapter || "").trim();

  chapter.style.cssText += `
    left:${W - side}px;
    top:${L.titleY}px;
    font-size:${minText}px;
    color:${rgba(V.ink, 0.62)};
  `;

  if (chapterCopy.textContent) {
    sizeLine(chapterCopy, minText, titleRoom);
  } else {
    chapter.style.display = "none";
  }

  // The impression belongs to the lower landscape, independently of title size.
  L.seal = Math.max(
    minText * 2.2,
    Math.min(L.seal, H * (full ? 0.085 : 0.14)),
  );
  L.sealX = clamp(
    L.sealX,
    side,
    W - side - L.seal * 1.08,
  );

  const sealMaxY = contentBottom - L.seal - 34 * sx;
  const sealMinY = Math.min(
    titleBottom + (full ? 70 : 36) * sx,
    sealMaxY,
  );
  L.sealY = clamp(L.sealY, sealMinY, sealMaxY);

  const sy = (L.sceneBottom - L.sceneTop) / 736;
  const washStrength = clamp(num("washStrength", 1.3), 0.5, 1.6);
  const cliffScale = clamp(num("cliffScale", 1.12), 0.85, 1.25);
  const boatScale = clamp(num("boatScale", 2.05), 1, 2.6) *
    L.boatFactor;
  const skyFloor = titleBottom +
    Math.max(24 * sx, Math.min(48 * sx, H * 0.045));

  function basePoint(x, y) {
    const px = landscapeInset +
      x / 1080 * (W - landscapeInset * 2);
    const horizontal = smooth((px / W - 0.45) / 0.45);
    const depth = clamp((1740 - y) / 1000);

    return [
      px,
      L.sceneTop + (y - 800) * sy +
        L.rightDrop * horizontal * depth,
    ];
  }

  function point(x, y) {
    const p = basePoint(x, y);

    if (titleColumns.length) {
      const shoulder = smooth(
        (p[0] - (titleLeft - 170 * sx)) / (170 * sx),
      );
      const floor = skyFloor +
        Math.max(0, y - 800) * sy * 0.1 +
        Math.sin(p[0] * 0.012 + 0.7) * 5 * sx;

      p[1] += Math.max(0, floor - p[1]) * shoulder;
    }

    return p;
  }

  function hash(x, y, salt = 0) {
    let n = Math.imul(x | 0, 374761393) ^
      Math.imul(y | 0, 668265263) ^
      Math.imul((seed + salt) | 0, 1442695041);
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  }

  function noise(x, y, salt = 0) {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = smooth(x - ix);
    const fy = smooth(y - iy);

    return mix(
      mix(hash(ix, iy, salt), hash(ix + 1, iy, salt), fx),
      mix(hash(ix, iy + 1, salt), hash(ix + 1, iy + 1, salt), fx),
      fy,
    );
  }

  function rgb(hex) {
    let h = String(hex).replace("#", "");
    if (h.length === 3) h = h.replace(/./g, "$&$&");
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  const inkRGB = rgb(V.ink);
  const redRGB = rgb(V.red);
  const canvas = $("iw-scene");
  canvas.width = Math.round(W);
  canvas.height = Math.round(H);
  const ctx = canvas.getContext("2d", { alpha: false });

  const fibre = $("iw-fibre");
  fibre.width = Math.round(W);
  fibre.height = Math.round(H);
  const fg = fibre.getContext("2d");
  const textureStrength = clamp(num("paperTexture", 1), 0, 2);
  const tile = document.createElement("canvas");
  tile.width = tile.height = 192;
  const tg = tile.getContext("2d");
  const tileData = tg.createImageData(192, 192);
  const paperRnd = seeded(seed + 401);

  for (let i = 0; i < tileData.data.length; i += 4) {
    tileData.data[i] = inkRGB[0];
    tileData.data[i + 1] = inkRGB[1];
    tileData.data[i + 2] = inkRGB[2];
    tileData.data[i + 3] = Math.round(
      paperRnd() ** 3 * 14 * textureStrength,
    );
  }

  tg.putImageData(tileData, 0, 0);
  fg.save();
  fg.beginPath();
  fg.rect(
    paintMargin, paintMargin,
    W - paintMargin * 2, H - paintMargin * 2,
  );
  fg.clip();
  fg.fillStyle = fg.createPattern(tile, "repeat");
  fg.fillRect(0, 0, W, H);

  for (let i = 0; i < 1800; i++) {
    const x = paintMargin + paperRnd() * (W - paintMargin * 2);
    const y = paintMargin + paperRnd() * (H - paintMargin * 2);
    const length = (3 + paperRnd() * 18) * sx;

    fg.beginPath();
    fg.moveTo(x, y);
    fg.lineTo(x + length, y + (paperRnd() - 0.5) * 3 * sx);
    fg.strokeStyle = i % 3
      ? rgba(V.ink, 0.027 * textureStrength)
      : rgba(V.paper, 0.14 * textureStrength);
    fg.lineWidth = (0.45 + paperRnd() * 0.55) * sx;
    fg.stroke();
  }

  fg.restore();

  function ridgeAt(points, x, salt) {
    let i = 0;
    while (i < points.length - 2 && x > points[i + 1][0]) i++;
    const a = points[i];
    const b = points[i + 1];
    const p = clamp((x - a[0]) / Math.max(0.001, b[0] - a[0]));

    return mix(a[1], b[1], p) +
      (noise(x * 0.035, 1.7, salt) - 0.5) *
      Math.max(3 * sx, sy * 12);
  }

  function makeWash(source, depth, tone, salt) {
    const points = source.map(([x, y]) => point(x, y));
    const y0 = Math.floor(clamp(
      Math.min(...points.map((p) => p[1])) - 24 * sx,
      paintMargin,
      H - paintMargin - 2,
    ));
    const bottom = Math.min(
      H - paintMargin,
      Math.max(...points.map((p) => p[1])) + depth * sy + 24 * sx,
    );
    const step = 2;
    const image = document.createElement("canvas");
    image.width = Math.ceil(W / step);
    image.height = Math.max(1, Math.ceil((bottom - y0) / step));
    const g = image.getContext("2d");
    const data = g.createImageData(image.width, image.height);

    for (let x = 0; x < image.width; x++) {
      const px = x * step;
      const ridge = ridgeAt(points, px, salt);
      const border = smooth((px - paintMargin) / (44 * sx)) *
        smooth((W - paintMargin - px) / (44 * sx));
      if (border <= 0) continue;

      for (let y = 0; y < image.height; y++) {
        const py = y0 + y * step;
        const vertical = (py - ridge) / Math.max(1, depth * sy);
        if (vertical < -0.025 || vertical > 1.08) continue;

        const coarse = noise(px * 0.013, py * 0.018, salt);
        const medium = noise(px * 0.071, py * 0.065, salt + 13);
        const tooth = hash(x, y, salt + 29);
        const edge = smooth(
          (py - ridge + (medium - 0.5) * 7 * sx) / (5 * sx),
        );
        const fall = Math.max(
          0,
          1 - vertical + (coarse - 0.5) * 0.15,
        );
        const pigment = fall ** 1.8 *
          (0.48 + coarse * 0.66 + medium * 0.24);
        const broken = vertical > 0.6 && tooth > fall * 1.9 ? 0.12 : 1;
        const alpha = clamp(
          tone * washStrength * edge * pigment * broken * border,
        );
        const j = (y * image.width + x) * 4;

        data.data[j] = inkRGB[0];
        data.data[j + 1] = inkRGB[1];
        data.data[j + 2] = inkRGB[2];
        data.data[j + 3] = Math.round(alpha * 255);
      }
    }

    g.putImageData(data, 0, 0);
    return {
      canvas: image,
      x: 0,
      y: y0,
      w: W,
      h: image.height * step,
      salt,
    };
  }

  const far = makeWash([
    [-40, 1070], [65, 1018], [148, 938], [242, 1003],
    [360, 876], [456, 963], [562, 822], [652, 925],
    [761, 867], [852, 1002], [953, 946], [1120, 1060],
  ], 270, 0.15, 11);

  const middle = makeWash([
    [-40, 1240], [70, 1160], [178, 1195], [288, 1064],
    [380, 1148], [469, 1090], [580, 1190], [690, 1080],
    [788, 1167], [886, 1113], [1000, 1205], [1120, 1164],
  ], 235, 0.21, 31);

  const near = makeWash([
    [-40, 1430], [150, 1380], [290, 1440], [410, 1370],
    [520, 1397], [650, 1296], [770, 1370], [870, 1280],
    [980, 1340], [1120, 1328],
  ], 125, 0.27, 59);

  function insidePolygon(x, y, points) {
    let inside = false;

    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const a = points[i];
      const b = points[j];

      if (
        (a[1] > y) !== (b[1] > y) &&
        x < (b[0] - a[0]) * (y - a[1]) /
          (b[1] - a[1]) + a[0]
      ) inside = !inside;
    }

    return inside;
  }

  const cliffSource = [
    [27, 1510], [45, 1340], [89, 1297], [125, 1244],
    [202, 1252], [241, 1294], [263, 1407], [298, 1490],
    [312, 1551], [251, 1590], [60, 1581],
  ];
  const cliffPoints = cliffSource.map(([x, y]) => point(x, y));

  function makeCliff() {
    const x0 = Math.floor(Math.min(...cliffPoints.map((p) => p[0])) - 8);
    const y0 = Math.floor(Math.min(...cliffPoints.map((p) => p[1])) - 8);
    const x1 = Math.ceil(Math.max(...cliffPoints.map((p) => p[0])) + 8);
    const y1 = Math.ceil(Math.max(...cliffPoints.map((p) => p[1])) + 8);
    const image = document.createElement("canvas");
    image.width = Math.max(1, Math.ceil((x1 - x0) / 2));
    image.height = Math.max(1, Math.ceil((y1 - y0) / 2));
    const g = image.getContext("2d");
    const data = g.createImageData(image.width, image.height);

    for (let y = 0; y < image.height; y++) {
      for (let x = 0; x < image.width; x++) {
        const px = x0 + x * 2;
        const py = y0 + y * 2;
        if (!insidePolygon(px, py, cliffPoints)) continue;

        const coarse = noise(px * 0.025, py * 0.018, 83);
        const fibres = noise(
          px * 0.11 + py * 0.008,
          py * 0.019,
          97,
        );
        const tooth = hash(x, y, 103);
        const edge = (
          Number(insidePolygon(px - 3, py, cliffPoints)) +
          Number(insidePolygon(px + 3, py, cliffPoints)) +
          Number(insidePolygon(px, py - 3, cliffPoints)) +
          Number(insidePolygon(px, py + 3, cliffPoints))
        ) / 4;
        const dry = fibres > 0.78 || tooth > 0.98 ? 0.48 : 1;
        const foot = clamp(
          (y1 - py + (coarse - 0.5) * 22 * sx) /
          Math.max(1, 58 * sy),
        );
        const alpha = (0.3 + coarse * 0.34) *
          (0.5 + edge * 0.5) * dry * foot;
        const j = (y * image.width + x) * 4;

        data.data[j] = inkRGB[0];
        data.data[j + 1] = inkRGB[1];
        data.data[j + 2] = inkRGB[2];
        data.data[j + 3] = Math.round(clamp(alpha) * 255);
      }
    }

    g.putImageData(data, 0, 0);
    return {
      canvas: image,
      x: x0,
      y: y0,
      w: image.width * 2,
      h: image.height * 2,
      salt: 83,
    };
  }

  const cliff = makeCliff();

  function imageLayer(layer) {
    ctx.drawImage(layer.canvas, layer.x, layer.y, layer.w, layer.h);
  }

  function spreadPath(layer, p, vertical, band = 0) {
    const activity = Math.sin(Math.PI * clamp(p)) ** 0.65;
    const roughness = (vertical ? 7 : 12) * sx * activity;
    const front = vertical
      ? layer.y - 30 * sx + (layer.h + 60 * sx) * p
      : -42 * sx + (W + 84 * sx) * p;
    const limit = vertical ? W + 40 : H + 40;
    const edges = [];

    for (let q = -40; q <= limit + 18; q += 18) {
      const offset = (
        Math.sin(q * 0.023 + layer.salt) +
        Math.sin(q * 0.061 + layer.salt * 0.7) * 0.47 +
        (noise(q * 0.027, 0.5, layer.salt) - 0.5) * 1.8
      ) * roughness;

      edges.push([q, front + offset]);
    }

    ctx.beginPath();

    if (vertical) {
      ctx.moveTo(-40, band ? edges[0][1] - band : -40);
      edges.forEach(([x, y]) => ctx.lineTo(x, y));

      if (band) {
        for (let i = edges.length - 1; i >= 0; i--) {
          ctx.lineTo(edges[i][0], edges[i][1] - band);
        }
      } else {
        ctx.lineTo(W + 60, -40);
      }
    } else {
      ctx.moveTo(band ? edges[0][1] - band : -60, -40);
      edges.forEach(([y, x]) => ctx.lineTo(x, y));

      if (band) {
        for (let i = edges.length - 1; i >= 0; i--) {
          ctx.lineTo(edges[i][1] - band, edges[i][0]);
        }
      } else {
        ctx.lineTo(-60, H + 60);
      }
    }

    ctx.closePath();
  }

  function drawSpread(layer, p, vertical = false) {
    if (p <= 0) return;

    if (p >= 1) {
      imageLayer(layer);
      return;
    }

    ctx.save();
    spreadPath(layer, p, vertical);
    ctx.clip();
    imageLayer(layer);
    ctx.restore();

    const wetWidth = (vertical ? 28 : 62) * sx * Math.sin(Math.PI * p);

    if (wetWidth > 0.2) {
      ctx.save();
      spreadPath(layer, p, vertical, wetWidth);
      ctx.clip();
      ctx.globalAlpha *= 0.54;
      imageLayer(layer);
      ctx.restore();
    }
  }

  function makeBrush(
    source, width, alpha, salt, dry = true, project = point,
  ) {
    const controls = source.map(([x, y]) => project(x, y));
    const localRnd = seeded(seed + salt);
    const widthPx = width * sx;
    const samples = [controls[0]];

    for (let i = 1; i < controls.length; i++) {
      const a = controls[i - 1];
      const b = controls[i];
      const count = Math.max(
        2,
        Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / (7 * sx)),
      );

      for (let j = 1; j <= count; j++) {
        const p = j / count;
        samples.push([
          mix(a[0], b[0], p) + (localRnd() - 0.5) * widthPx * 0.3,
          mix(a[1], b[1], p) + (localRnd() - 0.5) * widthPx * 0.24,
        ]);
      }
    }

    const lengths = [0];

    for (let i = 1; i < samples.length; i++) {
      lengths.push(lengths[i - 1] + Math.hypot(
        samples[i][0] - samples[i - 1][0],
        samples[i][1] - samples[i - 1][1],
      ));
    }

    const strands = [];

    for (let k = 0; k < 3; k++) {
      const offset = (k - 1) * widthPx * 0.22;

      strands.push({
        points: samples.map(([x, y]) => [
          x + offset + (localRnd() - 0.5) * widthPx * 0.2,
          y + offset * 0.4 + (localRnd() - 0.5) * widthPx * 0.16,
        ]),
        gaps: samples.map(() =>
          dry && localRnd() > (k === 1 ? 0.97 : 0.85)),
        width: Math.max(
          0.55 * sx,
          widthPx * (k === 1 ? 0.6 : 0.26),
        ),
        alpha: alpha * (k === 1 ? 0.85 : 0.46),
      });
    }

    return {
      strands,
      lengths,
      length: lengths[lengths.length - 1],
    };
  }

  function drawBrush(brush, p, color = V.ink) {
    if (p <= 0) return;
    const end = brush.length * clamp(p);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    brush.strands.forEach((strand) => {
      const points = strand.points;
      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1]);

      for (let i = 1; i < points.length; i++) {
        if (brush.lengths[i - 1] >= end) break;

        const a = points[i - 1];
        const b = points[i];
        const part = clamp(
          (end - brush.lengths[i - 1]) /
          Math.max(0.001, brush.lengths[i] - brush.lengths[i - 1]),
        );
        const x = mix(a[0], b[0], part);
        const y = mix(a[1], b[1], part);

        if (strand.gaps[i]) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        if (part < 1) break;
      }

      ctx.strokeStyle = rgba(color, strand.alpha);
      ctx.lineWidth = strand.width;
      ctx.stroke();
    });
  }

  const cliffOutline = makeBrush(
    cliffSource.slice(0, 9), 3.1, 0.4, 281,
  );
  const cliffMarks = [];
  const cliffRnd = seeded(seed + 271);

  for (let i = 0; i < 38; i++) {
    const x = 48 + cliffRnd() * 222;
    const y = 1270 + cliffRnd() * 240;
    const length = 16 + cliffRnd() * 58;
    const endX = x + 2 + cliffRnd() * 7;
    const endY = y + length;
    const a = point(x, y);
    const b = point(endX, endY);

    if (!insidePolygon(a[0], a[1], cliffPoints) ||
        !insidePolygon(b[0], b[1], cliffPoints)) continue;

    cliffMarks.push(makeBrush([
      [x, y],
      [x + 1, y + length * 0.45],
      [endX, endY],
    ], 1.2 + cliffRnd() * 2.6, 0.2 + cliffRnd() * 0.25, 300 + i));
  }

  const pineTrunk = makeBrush([
    [171, 1252], [168, 1224], [157, 1197],
    [173, 1161], [183, 1114], [193, 1074],
  ], 8.5, 0.94, 501, false);

  const pineBranches = [
    [[167, 1221], [137, 1196], [96, 1190]],
    [[161, 1201], [201, 1180], [260, 1183]],
    [[171, 1173], [143, 1158], [106, 1164]],
    [[177, 1153], [221, 1136], [278, 1146]],
    [[183, 1124], [214, 1109], [255, 1119]],
    [[188, 1100], [208, 1089], [233, 1097]],
  ].map((points, i) =>
    makeBrush(points, 4.8 - i * 0.45, 0.9, 530 + i, false));

  const pineClusters = [
    [102, 1189], [142, 1184], [220, 1181], [257, 1181],
    [110, 1162], [148, 1157], [224, 1137], [272, 1144],
    [213, 1110], [252, 1118], [230, 1095],
  ];
  const needles = [];
  const pineRnd = seeded(seed + 571);

  pineClusters.forEach(([x, y], cluster) => {
    for (let j = 0; j < 12; j++) {
      const startX = x + (pineRnd() - 0.5) * 34;
      const startY = y + (pineRnd() - 0.5) * 13;
      const direction = j % 2 ? -1 : 1;

      needles.push({
        brush: makeBrush([
          [startX, startY],
          [
            startX + direction * (10 + pineRnd() * 21),
            startY - 3 - pineRnd() * 9,
          ],
        ], 2.2 + pineRnd() * 2.4, 0.64 + pineRnd() * 0.22,
        600 + cluster * 13 + j),
        start: 80 + cluster * 2.65 + j * 0.14,
      });
    }
  });

  const river = [];
  const riverRnd = seeded(seed + 751);
  const identity = (x, y) => [x, y];
  const riverTop = full
    ? L.sceneTop + (L.sceneBottom - L.sceneTop) * 0.82
    : H * 0.76;
  const riverBottom = contentBottom - 24 * sx;

  for (let i = 0; i < 21; i++) {
    const x = W * (0.34 + riverRnd() * 0.46);
    const y = mix(riverTop, riverBottom, riverRnd());
    const length = (22 + riverRnd() * 100) * sx;

    river.push(makeBrush([
      [x, y],
      [x + length * 0.5, y - riverRnd() * 1.4 * sx],
      [Math.min(W - paintMargin - 20 * sx, x + length), y],
    ], 0.9 + riverRnd() * 0.7, 0.08 + riverRnd() * 0.1,
    780 + i, true, identity));
  }

  // Keep the boat, its passenger and the oar in one level coordinate system.
  const boatProject = (x, y) => [x * sx, y * sx];
  const boatBrush = (points, width, alpha, salt, dry = false) =>
    makeBrush(points, width, alpha, salt, dry, boatProject);

  const boatHull = boatBrush([
    [-58, 1], [-41, 13], [-8, 16], [29, 13], [53, 1],
  ], 3.8, 0.95, 851);
  const boatRim = boatBrush([
    [-53, 1], [-12, 5], [19, 4], [49, 1],
  ], 1.9, 0.88, 852, true);
  const rowerBody = boatBrush([
    [4, 3], [-3, -12], [1, -26],
  ], 4.8, 0.96, 853);
  const rowerHead = boatBrush([
    [0, -31], [-3, -35], [0, -39], [5, -38],
    [7, -34], [4, -30], [0, -31],
  ], 3, 0.96, 854);
  const rowerArm = boatBrush([
    [-1, -18], [11, -13], [16, -7],
  ], 2.6, 0.94, 855);
  const oar = boatBrush([
    [16, -7], [35, 16], [65, 39],
  ], 2.2, 0.88, 856, true);

  const wakeBrushes = [
    boatBrush([
      [-62, 12], [-91, 14], [-126, 13], [-181, 16],
    ], 1.6, 0.3, 861, true),
    boatBrush([
      [-65, 19], [-102, 23], [-148, 23], [-209, 27],
    ], 1.3, 0.24, 862, true),
    boatBrush([
      [-73, 28], [-107, 32], [-151, 33], [-184, 36],
    ], 1.1, 0.19, 863, true),
  ];
  const landingStroke = boatBrush([
    [-86, 28], [-49, 33], [-6, 35], [39, 33], [73, 29],
  ], 2, 0.42, 864, true);
  const bladeMarks = [
    boatBrush([[59, 40], [68, 43], [81, 42]], 1.8, 0.46, 865, true),
    boatBrush([[65, 47], [78, 49], [91, 48]], 1.2, 0.3, 866, true),
  ];

  const boatExtent = 70 * sx * boatScale;
  const boatMaxX = Math.max(
    W * 0.48,
    W - side - boatExtent - 20 * sx,
  );
  const boatX = Math.min(L.boatX, boatMaxX - 28 * sx);
  const boatY = Math.min(
    L.boatY,
    contentBottom - 54 * sx * boatScale - 18 * sx,
  );
  const boatTravel = Math.max(
    60 * sx,
    Math.min(230 * sx, boatX - W * 0.38),
  );
  const driftRoom = Math.max(0, boatMaxX - boatX);

  const sunDiameter = Math.max(
    60 * sx,
    num("sunDiameter", 224) * sx * L.sunScale,
  );
  const sunPoint = basePoint(num("sunX", 394), num("sunY", 734));
  const sunImage = document.createElement("canvas");
  const sunSide = Math.max(2, Math.ceil(sunDiameter * 1.3));
  sunImage.width = sunImage.height = sunSide;
  const sg = sunImage.getContext("2d");
  const sunData = sg.createImageData(sunSide, sunSide);
  const coreRadius = Math.max(1, sunDiameter / 2);

  for (let y = 0; y < sunSide; y++) {
    for (let x = 0; x < sunSide; x++) {
      const dx = x - sunSide / 2;
      const dy = y - sunSide / 2;
      const angle = Math.atan2(dy, dx);
      const distance = Math.hypot(dx, dy) / coreRadius;
      const lump = Math.sin(angle * 7 + 0.4) * 0.021 +
        Math.sin(angle * 11 - 1.1) * 0.014;
      const edge = smooth(
        (1.035 + lump +
          (noise(x * 0.19, y * 0.19, 901) - 0.5) * 0.045 -
          distance) / 0.095,
      );
      const pigment = 0.76 + noise(x * 0.11, y * 0.11, 907) * 0.22;
      const j = (y * sunSide + x) * 4;

      sunData.data[j] = redRGB[0];
      sunData.data[j + 1] = redRGB[1];
      sunData.data[j + 2] = redRGB[2];
      sunData.data[j + 3] = Math.round(edge * pigment * 255);
    }
  }

  sg.putImageData(sunData, 0, 0);

  function drawSun(frame, time) {
    const p = progress(frame, 0, 13);
    let scale = p < 0.55
      ? mix(0.9, 1.1, out(p / 0.55))
      : mix(1.1, 1, smooth((p - 0.55) / 0.45));

    scale *= 1 + Math.sin(time * 0.8) * 0.0025;

    ctx.save();
    ctx.translate(sunPoint[0], sunPoint[1]);
    ctx.scale(scale, scale);
    ctx.drawImage(sunImage, -sunSide / 2, -sunSide / 2);
    ctx.restore();
  }

  function drawMist(referenceY, time, salt, thickness) {
    const drift = Math.sin(time * 0.42 + salt) * 26 * sx;
    const lift = Math.sin(time * 0.34 + salt * 0.1) * 3 * sx;

    ctx.save();
    ctx.translate(drift, lift);

    for (let k = 0; k < 7; k++) {
      const half = thickness * sy * (1 - k / 8);
      ctx.beginPath();

      for (let x = -60; x <= W + 60; x += 28) {
        const sourceX = (x - landscapeInset) /
          Math.max(1, W - landscapeInset * 2) * 1080;
        const p = point(sourceX, referenceY);
        const y = p[1] +
          Math.sin(x * 0.006 + salt) * 6 * sy +
          Math.sin(x * 0.016 + salt * 2) * 2 * sy;

        if (x === -60) ctx.moveTo(x, y - half);
        else ctx.lineTo(x, y - half);
      }

      for (let x = W + 60; x >= -60; x -= 28) {
        const sourceX = (x - landscapeInset) /
          Math.max(1, W - landscapeInset * 2) * 1080;
        const p = point(sourceX, referenceY);
        const y = p[1] +
          Math.sin(x * 0.006 + salt) * 6 * sy +
          Math.sin(x * 0.016 + salt * 2) * 2 * sy;
        ctx.lineTo(x, y + half);
      }

      ctx.closePath();
      ctx.fillStyle = rgba(V.paper, 0.052);
      ctx.fill();
    }

    ctx.restore();
  }

  // A small, filled, eroded impression replaces the large outlined initials box.
  const seal = $("iw-seal");
  const sealSize = L.seal;
  const sealMark = $("iw-seal-mark");
  const sealWord = $("iw-seal-word");
  const sealRnd = seeded(seed + 1001);
  const svgNS = "http://www.w3.org/2000/svg";

  seal.style.cssText += `
    left:${L.sealX}px;
    top:${L.sealY}px;
    width:${sealSize}px;
    height:${sealSize}px;
  `;
  sealMark.setAttribute("viewBox", "0 0 100 100");

  function svgElement(tag, attributes, parent) {
    const element = document.createElementNS(svgNS, tag);
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, String(value));
    });
    parent.appendChild(element);
    return element;
  }

  const sealPoints = [];

  for (let edge = 0; edge < 4; edge++) {
    for (let i = 0; i < 23; i++) {
      const p = i / 23;
      const rough = (sealRnd() - 0.5) * 3.1;

      if (edge === 0) sealPoints.push([mix(5, 95, p), 5 + rough]);
      if (edge === 1) sealPoints.push([95 + rough, mix(5, 95, p)]);
      if (edge === 2) sealPoints.push([mix(95, 5, p), 95 + rough]);
      if (edge === 3) sealPoints.push([5 + rough, mix(95, 5, p)]);
    }
  }

  const sealShape = "M" +
    sealPoints.map((p) => p.join(",")).join("L") + "Z";
  const defs = svgElement("defs", {}, sealMark);
  const impressionMask = svgElement("mask", {
    id: "iw-impression-mask",
    maskUnits: "userSpaceOnUse",
    x: 0,
    y: 0,
    width: 100,
    height: 100,
  }, defs);

  svgElement("path", {
    d: sealShape,
    fill: "white",
  }, impressionMask);

  for (let i = 0; i < 145; i++) {
    const x = 5 + sealRnd() * 90;
    const y = 5 + sealRnd() * 90;

    svgElement("path", {
      d: `M${x},${y}l${0.2 + sealRnd() * 2.1},${0.3 + sealRnd() * 1.8}`,
      fill: "none",
      stroke: "black",
      "stroke-width": 0.35 + sealRnd() * 1.05,
      "stroke-linecap": "round",
    }, impressionMask);
  }

  for (let i = 0; i < 28; i++) {
    const edge = i % 4;
    const along = 7 + sealRnd() * 86;
    const length = 1.5 + sealRnd() * 4;
    const x = edge === 0 ? 5 : edge === 1 ? 95 : along;
    const y = edge === 2 ? 5 : edge === 3 ? 95 : along;
    const dx = edge === 0 ? length : edge === 1 ? -length : 0.4;
    const dy = edge === 2 ? length : edge === 3 ? -length : 0.4;

    svgElement("path", {
      d: `M${x},${y}l${dx},${dy}`,
      fill: "none",
      stroke: "black",
      "stroke-width": 0.6 + sealRnd() * 1.2,
    }, impressionMask);
  }

  svgElement("path", {
    d: sealShape,
    fill: V.red,
    mask: "url(#iw-impression-mask)",
  }, sealMark);

  sealWord.textContent = String(V.sealInitials || "").trim().toUpperCase();
  sealWord.style.color = V.paper;
  sizeLine(sealWord, sealSize * 0.53, sealSize * 0.73);

  const cliffAnchor = point(171, 1252);
  const pineAnchor = point(171, 1252);
  const cliffLow = Math.max(...cliffPoints.map((p) => p[1]));
  const cliffLift = Math.min(
    0,
    contentBottom - 22 * sx -
      (cliffAnchor[1] + (cliffLow - cliffAnchor[1]) * cliffScale),
  );

  function drawWake(frame, time, arrival) {
    const reveal = out(progress(frame, 88, 108));
    if (reveal <= 0) return;

    const after = Math.max(0, time - T.key);
    const ripple = Math.sin(time * 0.9) * 0.7 * sx;

    ctx.save();
    ctx.translate(-62 * sx, ripple);
    ctx.scale(0.38 + arrival * 0.62, 1);
    ctx.translate(62 * sx, 0);

    wakeBrushes.forEach((brush, i) => {
      drawBrush(brush, out(progress(frame, 88 + i * 2, 103 + i * 2)));
    });

    ctx.restore();

    // The last broad water stroke finishes at the arrival, below the hull.
    const landing = progress(frame, 109, 119);
    drawBrush(landingStroke, out(landing));

    bladeMarks.forEach((brush, i) => {
      drawBrush(brush, out(progress(frame, 115 + i, 119)));
    });

    const contact = out(progress(frame, 113, 119));
    if (contact <= 0) return;

    const expansion = Math.min(after, 4) * 5 * sx;
    const wet = time >= T.key ? Math.exp(-after * 9) : contact;

    for (let i = 0; i < 3; i++) {
      const radius = (10 + i * 7) * sx * contact + expansion;
      const yRadius = (2.1 + i * 1.1) * sx * contact;

      ctx.beginPath();
      ctx.ellipse(
        (68 + i * 2) * sx,
        (42 + i * 4) * sx,
        Math.max(0.1, radius),
        Math.max(0.1, yRadius),
        0,
        (0.08 + i * 0.035) * Math.PI,
        (0.88 - i * 0.025) * Math.PI,
      );
      ctx.lineWidth = (1.05 + wet * 0.5) * sx;
      ctx.strokeStyle = rgba(
        V.ink,
        (0.24 - i * 0.045) + wet * 0.13,
      );
      ctx.stroke();
    }
  }

  function drawBoat(frame, time) {
    const entry = out(progress(frame, 78, 87));
    if (entry <= 0) return;

    const arrival = smooth(progress(frame, 78, 119));
    const after = Math.max(0, time - T.key);
    const travel = after * Math.max(0, num("boatDrift", 12)) * sx;
    const drift = driftRoom > 0
      ? driftRoom * (1 - Math.exp(-travel / driftRoom))
      : 0;
    const boatStart = at(78) * T.scale;
    const elapsed = Math.max(0, time - boatStart);
    const bob = Math.sin(elapsed * 1.3) * 1.1 * sx;

    ctx.save();
    ctx.translate(
      boatX - boatTravel * (1 - arrival) + drift,
      boatY + bob,
    );
    ctx.scale(boatScale, boatScale);

    drawWake(frame, time, arrival);

    ctx.save();

    if (entry < 1) {
      const front = (-100 + 210 * entry) * sx;
      const rough = Math.sin(entry * Math.PI) * 3 * sx;

      ctx.beginPath();
      ctx.moveTo(-110 * sx, -70 * sx);

      for (let y = -70; y <= 86; y += 13) {
        ctx.lineTo(
          front + Math.sin(y * 0.19 + 0.6) * rough,
          y * sx,
        );
      }

      ctx.lineTo(-110 * sx, 90 * sx);
      ctx.closePath();
      ctx.clip();
    }

    drawBrush(boatHull, 1);
    drawBrush(boatRim, 1);
    drawBrush(rowerBody, 1);
    drawBrush(rowerHead, 1);
    drawBrush(rowerArm, 1);

    // The driving stroke ends at the key moment. Hold motion starts from
    // precisely that pose, and the oar always pivots at the connected hand.
    const angle = time < T.key
      ? -0.24 * (1 - smooth(progress(frame, 96, 119)))
      : -Math.sin(after * 1.7) * 0.075;

    ctx.save();
    ctx.translate(16 * sx, -7 * sx);
    ctx.rotate(angle);
    ctx.translate(-16 * sx, 7 * sx);
    drawBrush(oar, 1);
    ctx.restore();

    ctx.restore();
    ctx.restore();
  }

  function renderAt(time) {
    const t = Math.max(0, Number(time) || 0);
    const frame = designFrame(t);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = V.paper;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.beginPath();
    ctx.rect(
      paintMargin, paintMargin,
      W - paintMargin * 2, H - paintMargin * 2,
    );
    ctx.clip();

    drawSun(frame, t);

    ctx.save();
    ctx.globalAlpha = 0.22;
    imageLayer(far);
    ctx.restore();

    drawSpread(far, Math.max(0.025, out(progress(frame, 0, 31))));
    drawMist(1112, t, 1.2, 28);

    drawSpread(middle, out(progress(frame, 12, 45)));
    drawMist(1261, t, 3.7, 31);

    drawSpread(near, out(progress(frame, 26, 60)));
    drawMist(1435, t, 6.3, 19);

    ctx.save();
    ctx.translate(Math.sin(t * 0.35) * 5 * sx, 0);

    river.forEach((brush, i) => {
      const start = 61 + i / Math.max(1, river.length - 1) * 16;
      drawBrush(brush, out(progress(frame, start, start + 7)));
    });

    ctx.restore();

    ctx.save();
    ctx.translate(cliffAnchor[0], cliffAnchor[1] + cliffLift);
    ctx.scale(cliffScale, cliffScale);
    ctx.translate(-cliffAnchor[0], -cliffAnchor[1]);

    drawBrush(cliffOutline, out(progress(frame, 34, 41)));
    drawSpread(cliff, out(progress(frame, 37, 49)), true);

    cliffMarks.forEach((brush, i) => {
      const start = 45 + i / Math.max(1, cliffMarks.length - 1) * 17;
      drawBrush(brush, out(progress(frame, start, start + 6)));
    });

    const wind = Math.sin(t * 1.05) * 0.008;

    ctx.save();
    ctx.translate(pineAnchor[0], pineAnchor[1]);
    ctx.rotate(wind);
    ctx.scale(1, L.treeStretch);
    ctx.translate(-pineAnchor[0], -pineAnchor[1]);

    drawBrush(pineTrunk, out(progress(frame, 57, 77)));

    pineBranches.forEach((brush, i) => {
      drawBrush(brush, out(progress(frame, 68 + i * 4, 78 + i * 4)));
    });

    needles.forEach(({ brush, start }) => {
      drawBrush(brush, out(progress(frame, start, start + 5)));
    });

    ctx.restore();
    ctx.restore();

    drawBoat(frame, t);
    ctx.restore();
  }

  function horizontalWipe(open) {
    const front = open ? 116 : -20;
    const rough = [0, -3, 2, -4, 1, -2, 0];
    const points = ["-20% -20%"];

    for (let i = 0; i < rough.length; i++) {
      points.push(
        `${front + (open ? rough[i] : 0)}% ${-20 + i * 24}%`,
      );
    }

    points.push("-20% 124%");
    return `polygon(${points.join(",")})`;
  }

  const tl = gsap.timeline({ paused: true });
  const build = gsap.timeline();
  const lineClosed = horizontalWipe(false);
  const lineOpen = horizontalWipe(true);

  if (titleColumns.length) {
    gsap.set(titleColumns, { autoAlpha: 1 });

    build.fromTo(titleColumns,
      { y: -6 * sx },
      {
        y: 0,
        duration: at(8),
        ease: "power3.out",
        immediateRender: false,
      }, 0);
  }

  gsap.set([sub, chapter], {
    autoAlpha: 0,
    clipPath: lineClosed,
  });
  gsap.set(seal, {
    autoAlpha: 0,
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
    y: 0,
  });

  if (subcopy.textContent) {
    build.set(sub, { autoAlpha: 1 }, at(3));
    build.to(sub, {
      clipPath: lineOpen,
      duration: at(9),
      ease: "power3.out",
    }, at(3));
  }

  if (chapterCopy.textContent) {
    build.set(chapter, { autoAlpha: 1 }, at(20));
    build.to(chapter, {
      clipPath: lineOpen,
      duration: at(8),
      ease: "power3.out",
    }, at(20));
  }

  // The final needle cluster finishes before this single stamp.
  // Nothing resembling an approaching initials card is visible beforehand.
  build.set(seal, {
    autoAlpha: 1,
    scaleX: 1.12,
    scaleY: 1.12,
    rotation: -1.2,
    y: 1.5 * sx,
  }, T.design);

  build.timeScale(1 / T.scale);
  tl.add(build, 0);

  if (T.hold > 0) {
    tl.fromTo(seal,
      {
        scaleX: 1.12,
        scaleY: 1.12,
        rotation: -1.2,
        y: 1.5 * sx,
      },
      {
        scaleX: 1,
        scaleY: 1,
        rotation: -0.35,
        y: 0,
        duration: Math.min(0.2, T.hold),
        ease: "power3.out",
        immediateRender: false,
      }, T.key);
  }

  // Property-driven painting also runs when seeks suppress callbacks.
  let clockValue = 0;
  const paintClock = {};

  Object.defineProperty(paintClock, "time", {
    enumerable: true,
    get() {
      return clockValue;
    },
    set(value) {
      clockValue = Number(value) || 0;
      renderAt(clockValue);
    },
  });

  tl.fromTo(paintClock,
    { time: 0 },
    {
      time: T.duration,
      duration: T.duration,
      ease: "none",
      immediateRender: false,
    }, 0);

  const wipeRnd = seeded(seed + 1101);
  const wipeRough = Array.from({ length: 20 }, () => wipeRnd() * 5);

  function stageWipe(open) {
    const points = ["-8% -8%"];

    wipeRough.forEach((rough, i) => {
      points.push(
        `${open ? 108 + rough : -8}% ${-8 + i / (wipeRough.length - 1) * 116}%`,
      );
    });

    points.push("-8% 108%");
    return `polygon(${points.join(",")})`;
  }

  const openStage = stageWipe(true);
  const closedStage = stageWipe(false);

  if (variant === "overlay") {
    tl.fromTo(stageEl,
      { clipPath: closedStage },
      {
        clipPath: openStage,
        duration: Math.min(0.24, T.key * 0.16),
        ease: "power3.out",
      }, 0);
  }

  if (T.exit > 0) {
    const exitDuration = Math.max(0, T.exit - 1 / CA.fps);

    if (exitDuration > 0) {
      tl.fromTo(stageEl,
        { clipPath: openStage },
        {
          clipPath: closedStage,
          duration: exitDuration,
          ease: "power3.in",
          immediateRender: false,
        }, T.key + T.hold);
    } else {
      tl.set(stageEl, { clipPath: closedStage }, T.key + T.hold);
    }
  }

  window.addEventListener("hf-seek", (event) => {
    renderAt(event.detail.time);
  });

  renderAt(window.__hfThreeTime || 0);
  window.__timelines["block"] = tl;
});