import * as THREE from "three";

CA.ready(async () => {
  const {
    vars: V, stage: S, safe, time: T, variant,
    make, fit, rgba, parseStat, formatStat,
  } = CA;

  const $ = (id) => document.getElementById(id);
  const W = S.w;
  const H = S.h;
  const compact = variant !== "full";
  const shallow = compact && H < 720;
  const K = T.design;
  const EPS = 0.000001;
  const rad = Math.PI / 180;
  const stageEl = $("stage");
  const file = V.mapData && typeof V.mapData === "object" ? V.mapData : null;

  const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
  const lerp = (a, b, p) => a + (b - a) * p;
  const seg = (t, at, duration) =>
    duration <= 0 ? (t >= at ? 1 : 0) : clamp((t - at) / duration);
  const out = (p, power = 3) => 1 - Math.pow(1 - p, power);
  const smooth = (p) => p * p * p * (p * (p * 6 - 15) + 10);
  const back = (p, strength = 1.7) =>
    1 + (strength + 1) * Math.pow(p - 1, 3) + strength * Math.pow(p - 1, 2);
  const finite = (v, fallback) =>
    Number.isFinite(Number(v)) && String(v).trim() !== "" ? Number(v) : fallback;
  const designTime = (time) =>
    time >= T.key - EPS ? K + Math.max(0, time - T.key) : time / T.scale;

  const toRgb = (hex) => {
    const h = String(hex).replace("#", "");
    const full = h.length === 3 ? h.replace(/./g, "$&$&") : h;
    const n = parseInt(full, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const blend = (a, b, p) => {
    const x = toRgb(a);
    const y = toRgb(b);
    const c = x.map((v, i) => Math.round(lerp(v, y[i], clamp(p))));
    return `rgb(${c[0]},${c[1]},${c[2]})`;
  };
  const glColor = (hex) => new THREE.Vector3(...toRgb(hex).map((v) => v / 255));

  // Deep ink is a whole second palette. A colour the member set themselves always wins.
  const PARCHMENT = {
    land: "#EADBB8", landEdge: "#D2B37C", sea: "#8DB5B0", seaDeep: "#5D8E90",
    coast: "#2E2A22", grid: "#27464A", table: "#2A2019",
  };
  const INK = {
    land: "#2F4048", landEdge: "#476068", sea: "#17303B", seaDeep: "#0C1C25",
    coast: "#E4D5AE", grid: "#8FA6A6", table: "#05090D",
  };
  const C = { ...V };
  if (V.mapStyle === "ink") {
    for (const [id, value] of Object.entries(INK)) {
      if (String(V[id]).toUpperCase() === PARCHMENT[id]) C[id] = value;
    }
  }

  const layouts = {
    full: {
      arrow: 66, disc: 84, discText: 48, originDisc: 46, place: 46, stage: 40,
      platePadX: 20, platePadY: 11, plateMax: 430,
      title: 44, count: 56, countLabel: 42, barH: 92,
      heroValue: 196, heroLine: 60, heroPad: 26, ring: 150,
      fov: 28, gap: 44, atlasOcean: 46, atlasLand: 58,
    },
    top: {
      arrow: 50, disc: 66, discText: 38, originDisc: 36, place: 36, stage: 32,
      platePadX: 15, platePadY: 8, plateMax: 340,
      title: 34, count: 44, countLabel: 34, barH: 70,
      heroValue: 104, heroLine: 42, heroPad: 18, ring: 110,
      fov: 28, gap: 26, atlasOcean: 34, atlasLand: 42,
    },
    overlay: {
      arrow: 52, disc: 68, discText: 38, originDisc: 38, place: 36, stage: 32,
      platePadX: 15, platePadY: 8, plateMax: 350,
      title: 34, count: 44, countLabel: 34, barH: 70,
      heroValue: 110, heroLine: 42, heroPad: 20, ring: 115,
      fov: 28, gap: 28, atlasOcean: 34, atlasLand: 42,
    },
  };
  const M = { ...(layouts[variant] || layouts.full) };
  if (shallow) {
    Object.assign(M, { arrow: 40, disc: 54, discText: 32, originDisc: 30, heroValue: 84, heroLine: 36, heroPad: 14, ring: 90, gap: 18 });
  }

  const side = Math.max(safe.side, compact ? 40 : 60);
  const topY = shallow ? 16 : Math.max(safe.top, compact ? 24 : 230);
  const botY = H - Math.max(safe.bottom, compact ? 26 : 300);
  const minText = compact ? 32 : 40;

  function fitLabel(el, width, minimum) {
    fit(el, width, minimum);
    if (el.scrollWidth > width + 1) {
      el.style.whiteSpace = "normal";
      el.style.width = width + "px";
      el.style.textWrap = "balance";
    }
  }

  // ---------------------------------------------------------------- the moves

  const mercY = (lat) =>
    Math.asinh(Math.tan(clamp(lat, -85, 85) * rad)) / rad;

  const moves = (() => {
    if (file) {
      return file.moves.slice(0, 5).map((move, i) => {
        const n = i + 1;
        return {
          fx: move.from.lon, fy: mercY(move.from.lat),
          tx: move.to.lon, ty: mercY(move.to.lat),
          fromLabel: move.from.label,
          place: String(V[`place${n}`] ?? "").trim() || move.to.label,
          stage: String(V[`stage${n}`] ?? "").trim(),
          count: String(V[`count${n}`] ?? "").trim() || String(n),
          bend: finite(V[`bend${n}`], null),
        };
      });
    }
    const list = [];
    let lon = finite(V.originLon, 0);
    let lat = finite(V.originLat, 0);
    const homeLon = lon;
    const homeLat = lat;
    for (let n = 1; n <= 5; n++) {
      const place = String(V[`place${n}`] ?? "").trim();
      if (!place) continue;
      const hub = V.routeShape === "hub";
      const fromLon = hub ? homeLon : lon;
      const fromLat = hub ? homeLat : lat;
      const wanted = finite(V[`lon${n}`], 0);
      // The short way round, carrying on past 180 degrees so a line never breaks.
      const delta = ((((wanted - fromLon) % 360) + 540) % 360) - 180;
      const toLon = fromLon + delta;
      const toLat = finite(V[`lat${n}`], 0);
      list.push({
        fx: fromLon, fy: mercY(fromLat), tx: toLon, ty: mercY(toLat),
        fromLabel: V.origin,
        place,
        stage: String(V[`stage${n}`] ?? "").trim(),
        count: String(V[`count${n}`] ?? "").trim() || String(n),
        bend: finite(V[`bend${n}`], null),
      });
      lon = toLon;
      lat = toLat;
    }
    return list;
  })();

  if (!moves.length) throw new Error("campaign-map: no moves. Fill in place1 or pass a map file.");

  const centerX = moves.reduce((sum, m) => sum + m.fx + m.tx, 0) / (moves.length * 2);
  const centerY = moves.reduce((sum, m) => sum + m.fy + m.ty, 0) / (moves.length * 2);

  const SAMPLES = 72;
  const arrows = moves.map((move, index) => {
    const dx = move.tx - move.fx;
    const dy = move.ty - move.fy;
    const chord = Math.max(0.01, Math.hypot(dx, dy));
    const nx = -dy / chord;
    const ny = dx / chord;
    const midX = (move.fx + move.tx) / 2;
    const midY = (move.fy + move.ty) / 2;
    // By default every arrow bows away from the middle of the campaign, so the whole sweep reads as one curve.
    const outward = (midX - centerX) * nx + (midY - centerY) * ny >= 0 ? 1 : -1;
    const bend = clamp(move.bend ?? outward * 0.13, -0.42, 0.42);
    const cx = midX + nx * bend * chord * 2;
    const cy = midY + ny * bend * chord * 2;

    const curve = (p) => {
      const q = 1 - p;
      return [
        q * q * move.fx + 2 * q * p * cx + p * p * move.tx,
        q * q * move.fy + 2 * q * p * cy + p * p * move.ty,
      ];
    };
    const dense = [];
    let length = 0;
    let last = curve(0);
    for (let i = 0; i <= 400; i++) {
      const point = curve(i / 400);
      length += Math.hypot(point[0] - last[0], point[1] - last[1]);
      dense.push({ x: point[0], y: point[1], l: length });
      last = point;
    }
    const points = [];
    for (let i = 0, j = 0; i <= SAMPLES; i++) {
      const wanted = (i / SAMPLES) * length;
      while (j < dense.length - 1 && dense[j].l < wanted) j++;
      points.push({ x: dense[j].x, y: dense[j].y });
    }
    points.forEach((point, i) => {
      const a = points[Math.max(0, i - 1)];
      const b = points[Math.min(SAMPLES, i + 1)];
      const size = Math.max(1e-6, Math.hypot(b.x - a.x, b.y - a.y));
      point.tx = (b.x - a.x) / size;
      point.ty = (b.y - a.y) / size;
    });
    return { index, move, points, length };
  });

  const pointAt = (arrow, s) => {
    const position = clamp(s) * SAMPLES;
    const i = Math.min(SAMPLES - 1, Math.floor(position));
    const p = position - i;
    const a = arrow.points[i];
    const b = arrow.points[i + 1];
    return {
      x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p),
      tx: lerp(a.tx, b.tx, p), ty: lerp(a.ty, b.ty, p),
    };
  };

  // Each arrow is one beat. Fewer moves simply get longer beats, and the last one lands exactly on the key.
  const LEAD = K * 0.085;
  {
    const weights = arrows.map((arrow, i) =>
      Math.pow(arrow.length, 0.3) * (i === arrows.length - 1 ? 1.22 : 1));
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    let at = LEAD;
    arrows.forEach((arrow, i) => {
      const slot = (weights[i] / total) * (K - LEAD);
      arrow.at = at;
      arrow.land = i === arrows.length - 1 ? K : at + slot * 0.9;
      at += slot;
    });
  }

  // Places: where each arrow lands, plus any start that isn't already a landing.
  const stops = [];
  arrows.forEach((arrow) => {
    const { move } = arrow;
    const seen = stops.some((stop) =>
      Math.hypot(stop.x - move.fx, stop.y - move.fy) < 0.01);
    if (!seen) {
      stops.push({
        x: move.fx, y: move.fy, origin: true, at: -1, number: "",
        place: move.fromLabel,
        stage: stops.length ? "" : String(V.originStage ?? "").trim(),
      });
    }
    stops.push({
      x: move.tx, y: move.ty, origin: false, at: arrow.land,
      number: String(arrow.index + 1),
      place: move.place, stage: move.stage, arrow,
    });
  });
  const lastStop = stops[stops.length - 1];
  const firstStop = stops[0];

  // ---------------------------------------------------------------- the page furniture

  const barEl = $("cm-bar");
  const titleEl = $("cm-title");
  const countEl = $("cm-count");
  const countLabelEl = $("cm-count-label");
  const countValueEl = $("cm-count-value");
  const heroEl = $("cm-hero");
  const heroValueEl = $("cm-hero-value");
  const heroLineEl = $("cm-hero-line");
  const creditEl = $("cm-credit");

  const cardShadow = `0 ${compact ? 5 : 7}px 0 ${rgba(C.plateText, 0.34)}, 0 ${compact ? 10 : 14}px ${compact ? 18 : 26}px ${rgba(C.plateText, 0.32)}`;
  const paperCard = (el, padX, padY) => {
    el.style.background = C.plate;
    el.style.color = C.plateText;
    el.style.padding = `${padY}px ${padX}px`;
    el.style.borderRadius = "4px";
    el.style.boxShadow = `inset 0 0 0 2px ${C.plate}, inset 0 0 0 4px ${rgba(C.plateText, 0.78)}, ${cardShadow}`;
  };

  const barW = W - side * 2;
  barEl.style.cssText = `left:${side}px;top:${topY}px;width:${barW}px`;
  const hasTitle = String(V.title ?? "").trim() !== "" && !shallow;
  titleEl.textContent = V.title;
  titleEl.style.fontSize = M.title + "px";
  paperCard(titleEl, compact ? 18 : 24, 0);
  if (!hasTitle) titleEl.style.display = "none";

  countLabelEl.textContent = V.countLabel;
  countLabelEl.style.fontSize = M.countLabel + "px";
  countValueEl.style.fontSize = M.count + "px";
  countValueEl.style.color = C.stageText;
  paperCard(countEl, compact ? 16 : 22, 0);

  const countValues = [String(V.countStart ?? "").trim() || "0", ...moves.map((move) => move.count)];
  const countStats = countValues.map(parseStat);
  const countText = (index) => countValues[index];
  // Reserve the widest value so the plate never changes size as it ticks.
  {
    let widest = 0;
    countValues.forEach((value) => {
      countValueEl.textContent = value;
      widest = Math.max(widest, countValueEl.getBoundingClientRect().width);
    });
    countValueEl.style.minWidth = Math.ceil(widest) + "px";
    countValueEl.style.textAlign = "right";
    countValueEl.textContent = countValues[0];
  }
  countEl.style.height = M.barH + "px";
  if (countEl.offsetWidth > barW) fit(countLabelEl, barW * 0.62, minText);
  const countW = countEl.offsetWidth;
  if (hasTitle) {
    titleEl.style.height = M.barH + "px";
    const room = barW - countW - 18;
    fit(titleEl, room, minText);
    if (titleEl.scrollWidth > room + 1) {
      // Too much for one row, so the title takes its own row above the count.
      titleEl.style.fontSize = M.title + "px";
      titleEl.style.height = "auto";
      titleEl.style.padding = `${compact ? 8 : 12}px ${compact ? 18 : 24}px`;
      barEl.style.flexDirection = "column";
      barEl.style.alignItems = "flex-end";
      barEl.style.gap = "10px";
      titleEl.style.alignSelf = "stretch";
      titleEl.style.boxSizing = "border-box";
      titleEl.style.whiteSpace = "normal";
      titleEl.style.textWrap = "balance";
      titleEl.style.fontSize = minText + "px";
    }
  }
  M.barH = barEl.offsetHeight;

  const compactHero = compact;
  heroEl.style.cssText = `
    left:${side}px;width:${W - side * 2}px;
    background:${C.arrow};color:${C.heroText};
    padding:${M.heroPad}px ${M.heroPad + (compact ? 8 : 10)}px;
    border-radius:6px;
    box-shadow:inset 0 0 0 3px ${C.arrow}, inset 0 0 0 6px ${rgba(C.heroText, 0.9)},
      0 ${compact ? 7 : 10}px 0 ${rgba(C.plateText, 0.42)},
      0 ${compact ? 14 : 20}px ${compact ? 26 : 38}px ${rgba(C.plateText, 0.4)};
    flex-direction:${compactHero ? "row" : "column"};
    align-items:center;justify-content:center;text-align:center;
    gap:${compactHero ? 22 : 18}px`;
  const heroInner = W - side * 2 - (M.heroPad + (compact ? 8 : 10)) * 2;
  heroValueEl.textContent = V.heroValue;
  heroValueEl.style.fontSize = M.heroValue + "px";
  heroLineEl.textContent = V.heroLine;
  heroLineEl.style.fontSize = M.heroLine + "px";
  if (compactHero) {
    const lineW = heroLineEl.offsetWidth;
    fit(heroValueEl, heroInner * 0.62, Math.max(minText, 64));
    heroValueEl.style.flex = "0 0 auto";
    const room = heroInner - heroValueEl.offsetWidth - 22;
    if (lineW <= room * 1.9 && room >= heroInner * 0.3) {
      fitLabel(heroLineEl, room, minText);
    } else {
      heroEl.style.flexDirection = "column";
      heroEl.style.gap = "4px";
      heroValueEl.style.fontSize = M.heroValue + "px";
      fit(heroValueEl, heroInner, 56);
      fitLabel(heroLineEl, heroInner, minText);
    }
  } else {
    fit(heroValueEl, heroInner, 72);
    fitLabel(heroLineEl, heroInner, minText);
  }
  const heroH = heroEl.offsetHeight;
  // Both map licences ask for this on the finished video. It has its own strip at the foot of the safe area,
  // on its own small plate, and the hero stands far enough above it to clear its punch at the key moment.
  let floorY = botY;
  let heroFoot = botY;
  if (file) {
    creditEl.textContent = file.attribution;
    creditEl.style.cssText = `right:${side}px;background:${C.plate};color:${C.plateText};padding:3px 10px`;
    fit(creditEl, W - side * 2, 16);
    const creditTop = botY - creditEl.offsetHeight;
    creditEl.style.top = creditTop + "px";
    floorY = creditTop - 8;
    heroFoot = creditTop - Math.ceil(Math.max(20, heroH * 0.05 + 8));
  }
  const heroTop = heroFoot - heroH;
  heroEl.style.top = heroTop + "px";

  // ---------------------------------------------------------------- the camera

  const camera = new THREE.PerspectiveCamera(M.fov, W / H, 1, 8000);
  const tanFov = Math.tan((M.fov * rad) / 2);
  const scaleOf = (dist) => H / (2 * dist * tanFov);
  const distOf = (scale) => H / (2 * scale * tanFov);

  function pose(c) {
    const sinT = Math.sin(c.tilt);
    const cosT = Math.cos(c.tilt);
    const sinY = Math.sin(c.yaw);
    const cosY = Math.cos(c.yaw);
    camera.position.set(
      c.x + c.dist * sinT * sinY,
      c.y - c.dist * sinT * cosY,
      c.dist * cosT,
    );
    camera.up.set(-sinY, cosY, 0);
    camera.lookAt(c.x, c.y, 0);
    camera.near = c.dist * 0.05;
    camera.far = c.dist * 6;
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
  }

  const scratch = new THREE.Vector3();
  function project(x, y) {
    scratch.set(x, y, 0).project(camera);
    return [(scratch.x + 1) * W * 0.5, (1 - scratch.y) * H * 0.5];
  }

  function bounds(points) {
    let left = Infinity;
    let right = -Infinity;
    let high = Infinity;
    let low = -Infinity;
    points.forEach(([x, y]) => {
      const [px, py] = project(x, y);
      left = Math.min(left, px);
      right = Math.max(right, px);
      high = Math.min(high, py);
      low = Math.max(low, py);
    });
    return { w: right - left, h: low - high, cx: (left + right) / 2, cy: (high + low) / 2 };
  }

  // Finds the camera that holds these points inside this part of the frame.
  function frameOn(points, rect, tilt, yaw, maxScale = Infinity) {
    const xs = points.map((p) => p[0]);
    const ys = points.map((p) => p[1]);
    const c = {
      x: (Math.min(...xs) + Math.max(...xs)) / 2,
      y: (Math.min(...ys) + Math.max(...ys)) / 2,
      dist: 400, tilt, yaw,
    };
    const rw = rect.r - rect.l;
    const rh = rect.b - rect.t;
    const rcx = (rect.l + rect.r) / 2;
    const rcy = (rect.t + rect.b) / 2;
    const least = distOf(maxScale === Infinity ? 1000 : maxScale);
    for (let round = 0; round < 4; round++) {
      let lo = Math.max(0.5, least);
      let hi = 7000;
      for (let i = 0; i < 26; i++) {
        c.dist = Math.sqrt(lo * hi);
        pose(c);
        const b = bounds(points);
        if (b.w > rw || b.h > rh) lo = c.dist;
        else hi = c.dist;
      }
      c.dist = hi;
      pose(c);
      const b = bounds(points);
      const s = scaleOf(c.dist);
      const ex = (b.cx - rcx) / s;
      const ey = (b.cy - rcy) / s;
      const cosT = Math.cos(tilt);
      c.x += ex * Math.cos(yaw) + (ey * Math.sin(yaw)) / cosT;
      c.y += ex * Math.sin(yaw) - (ey * Math.cos(yaw)) / cosT;
    }
    return c;
  }

  const tiltDeg = clamp(finite(V.tilt, 24), 0, 42);
  const finalTilt = tiltDeg * 0.72 * rad;
  const closeTilt = tiltDeg * 1.32 * rad;
  const inset = M.disc * 0.62 + 6;

  const finalRect = {
    l: side + inset, r: W - side - inset,
    t: topY + M.barH + M.gap + inset * 0.6,
    b: heroTop - M.gap - inset * 0.6,
  };
  const shotRect = {
    l: side + inset, r: W - side - inset,
    t: topY + M.barH + M.gap + inset,
    b: floorY - M.gap - inset - (compact ? M.place * 1.2 : M.place * 2),
  };

  const allPoints = [];
  arrows.forEach((arrow) => {
    arrow.points.forEach((p, i) => {
      if (i % 4 === 0 || i === SAMPLES) allPoints.push([p.x, p.y]);
    });
  });

  const finalShot = frameOn(allPoints, finalRect, finalTilt, 0);
  const finalScale = scaleOf(finalShot.dist);
  const worldPerFinal = 1 / finalScale;

  const dataMaxScale = file ? (256 * 2 ** (file.zoom ?? 4) / 360) * 2.2 : 15;
  const maxShotScale = Math.max(finalScale * 1.02, Math.min(finalScale * 5.2, dataMaxScale));

  const direction = (arrow) => {
    const a = arrow.points[0];
    const b = arrow.points[SAMPLES];
    return Math.sign(b.x - a.x) || 1;
  };

  const shots = [];
  {
    const arrow = arrows[0];
    const opening = [0, 0.1, 0.22, 0.34].map((s) => {
      const p = pointAt(arrow, s);
      return [p.x, p.y];
    });
    shots.push(frameOn(opening, shotRect, closeTilt, -direction(arrow) * 5 * rad, maxShotScale));
    arrows.slice(0, -1).forEach((item) => {
      const points = item.points
        .filter((_, i) => i % 6 === 0)
        .map((p) => [p.x, p.y]);
      shots.push(frameOn(points, shotRect, closeTilt, -direction(item) * 5 * rad, maxShotScale));
    });
    shots.push(finalShot);
  }

  function cameraAt(t) {
    let from = shots[0];
    let to = shots[0];
    let e = 0;
    let fromIndex = 0;
    for (let i = 0; i < arrows.length; i++) {
      const arrow = arrows[i];
      const last = i === arrows.length - 1;
      const start = arrow.at - 0.14;
      const end = last ? K - 0.02 : arrow.at + (arrow.land - arrow.at) * 0.74;
      if (t < start) break;
      from = shots[i];
      to = shots[i + 1];
      fromIndex = i;
      e = smooth(seg(t, start, end - start));
    }
    const pan = Math.hypot(to.x - from.x, to.y - from.y);
    const view = W / Math.max(scaleOf(from.dist), scaleOf(to.dist));
    const hop = clamp(0.22 * Math.log(1 + pan / view), 0, 0.5);
    const dist = Math.min(
      finalShot.dist * 1.07,
      Math.exp(lerp(Math.log(from.dist), Math.log(to.dist), e)) * (1 + hop * 4 * e * (1 - e)),
    );
    return {
      x: lerp(from.x, to.x, e),
      y: lerp(from.y, to.y, e),
      dist,
      tilt: lerp(from.tilt, to.tilt, e),
      yaw: lerp(from.yaw, to.yaw, e),
      pulled: to === finalShot ? e : 0,
      fromIndex,
      e,
    };
  }

  // ---------------------------------------------------------------- the map sheet

  const footprint = (c, grow = 1) => {
    pose(c);
    const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
    return corners.map(([sx, sy]) => {
      const near = new THREE.Vector3(sx * grow, sy * grow, 0.5).unproject(camera);
      const dir = near.sub(camera.position);
      const k = -camera.position.z / dir.z;
      return [camera.position.x + dir.x * k, camera.position.y + dir.y * k];
    });
  };

  const seen = [...shots.flatMap((c) => footprint(c, 1.08)), ...footprint(finalShot, 1.2)];
  const sheet = file
    ? { minX: file.bounds[0], minY: file.bounds[1], maxX: file.bounds[2], maxY: file.bounds[3] }
    : { minX: -1e5, minY: mercY(-85), maxX: 1e5, maxY: mercY(85) };
  const dom = {
    minX: Math.max(sheet.minX, Math.min(...seen.map((p) => p[0]))),
    maxX: Math.min(sheet.maxX, Math.max(...seen.map((p) => p[0]))),
    minY: Math.max(sheet.minY, Math.min(...seen.map((p) => p[1]))),
    maxY: Math.min(sheet.maxY, Math.max(...seen.map((p) => p[1]))),
  };

  const renderer = new THREE.WebGLRenderer({
    canvas: $("cm-gl"),
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true,
  });
  renderer.setPixelRatio(2);
  renderer.setSize(W, H, false);
  renderer.setClearColor(C.table, 1);

  const domW = dom.maxX - dom.minX;
  const domH = dom.maxY - dom.minY;
  const budget = 9e6;
  const limit = Math.min(8192, renderer.capabilities.maxTextureSize);
  let texW = Math.sqrt((budget * domW) / domH);
  let texH = texW * (domH / domW);
  const shrink = Math.min(1, limit / texW, limit / texH);
  texW = Math.max(64, Math.round(texW * shrink));
  texH = Math.max(64, Math.round(texH * shrink));

  const mask = document.createElement("canvas");
  mask.width = texW;
  mask.height = texH;
  const ink = mask.getContext("2d", { willReadFrequently: true });
  const sx = texW / domW;
  const sy = texH / domH;
  const px = (x) => (x - dom.minX) * sx;
  const py = (y) => (dom.maxY - y) * sy;

  if (file) {
    // Real maps arrive as water, so start from solid land and cut the water out.
    ink.fillStyle = "#fff";
    ink.fillRect(0, 0, texW, texH);
    ink.globalCompositeOperation = "destination-out";
    file.water.forEach((rings) => {
      ink.beginPath();
      rings.forEach((flat) => {
        for (let i = 0; i < flat.length; i += 2) {
          if (i === 0) ink.moveTo(px(flat[i]), py(flat[i + 1]));
          else ink.lineTo(px(flat[i]), py(flat[i + 1]));
        }
        ink.closePath();
      });
      ink.fill("evenodd");
    });
    ink.globalCompositeOperation = "source-over";
  } else {
    const response = await fetch("assets/data/land-110m.json");
    if (!response.ok) throw new Error("campaign-map: bundled land outlines could not load.");
    const topology = await response.json();
    const { transform } = topology;
    const decoded = topology.arcs.map((arc) => {
      let x = 0;
      let y = 0;
      return arc.map((point) => {
        if (!transform) return [point[0], point[1]];
        x += point[0];
        y += point[1];
        return [
          x * transform.scale[0] + transform.translate[0],
          y * transform.scale[1] + transform.translate[1],
        ];
      });
    });
    const stitch = (indices) => {
      const points = [];
      indices.forEach((index) => {
        const arc = index < 0 ? decoded[~index].slice().reverse() : decoded[index];
        arc.forEach((point, i) => {
          if (!points.length || i > 0) points.push(point);
        });
      });
      return points;
    };
    const polygons = [];
    const collect = (geometry) => {
      if (geometry.type === "GeometryCollection") geometry.geometries.forEach(collect);
      if (geometry.type === "Polygon") polygons.push(geometry.arcs.map(stitch));
      if (geometry.type === "MultiPolygon") {
        geometry.arcs.forEach((polygon) => polygons.push(polygon.map(stitch)));
      }
    };
    Object.values(topology.objects).forEach(collect);

    ink.fillStyle = "#fff";
    ink.strokeStyle = "#fff";
    ink.lineWidth = 1.2;
    ink.lineJoin = "round";
    const firstTurn = Math.floor((dom.minX - 180) / 360);
    const lastTurn = Math.ceil((dom.maxX + 180) / 360);
    for (let turn = firstTurn; turn <= lastTurn; turn++) {
      polygons.forEach((polygon) => {
        ink.beginPath();
        polygon.forEach((ring) => {
          // A few islands straddle the 180th meridian, so each ring runs on from its last point.
          let previous = ring[0][0];
          ring.forEach(([lon, lat], i) => {
            let unwrapped = lon;
            while (unwrapped - previous > 180) unwrapped -= 360;
            while (unwrapped - previous < -180) unwrapped += 360;
            previous = unwrapped;
            const x = px(unwrapped + turn * 360);
            const y = py(mercY(lat));
            if (i === 0) ink.moveTo(x, y);
            else ink.lineTo(x, y);
          });
          ink.closePath();
        });
        ink.fill("evenodd");
        ink.stroke();
      });
    }
  }

  // One line of a distance transform (Felzenszwalb and Huttenlocher).
  function sweep(grid, offset, stride, length, f, v, z) {
    v[0] = 0;
    z[0] = -1e20;
    z[1] = 1e20;
    f[0] = grid[offset];
    for (let q = 1, k = 0, s = 0; q < length; q++) {
      f[q] = grid[offset + q * stride];
      const q2 = q * q;
      do {
        const r = v[k];
        s = (f[q] - f[r] + q2 - r * r) / (q - r) / 2;
      } while (s <= z[k] && --k > -1);
      k++;
      v[k] = q;
      z[k] = s;
      z[k + 1] = 1e20;
    }
    for (let q = 0, k = 0; q < length; q++) {
      while (z[k + 1] < q) k++;
      const r = v[k];
      const qr = q - r;
      grid[offset + q * stride] = f[r] + qr * qr;
    }
  }

  function distanceField(alpha, w, h) {
    const size = Math.max(w, h);
    const f = new Float64Array(size);
    const z = new Float64Array(size + 1);
    const v = new Uint32Array(size);
    const outer = new Float64Array(w * h);
    const inner = new Float64Array(w * h);
    for (let i = 0; i < w * h; i++) {
      const a = alpha[i * 4 + 3] / 255;
      if (a >= 1) {
        outer[i] = 0;
        inner[i] = 1e20;
      } else if (a <= 0) {
        outer[i] = 1e20;
        inner[i] = 0;
      } else {
        const d = 0.5 - a;
        outer[i] = d > 0 ? d * d : 0;
        inner[i] = d < 0 ? d * d : 0;
      }
    }
    for (const grid of [outer, inner]) {
      for (let x = 0; x < w; x++) sweep(grid, x, w, h, f, v, z);
      for (let y = 0; y < h; y++) sweep(grid, y * w, 1, w, f, v, z);
    }
    const field = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) field[i] = Math.sqrt(outer[i]) - Math.sqrt(inner[i]);
    return field;
  }

  const field = distanceField(ink.getImageData(0, 0, texW, texH).data, texW, texH);
  mask.width = mask.height = 1;

  // The field is stored in the pixels of the finished frame, so every map band keeps its size whatever the data.
  const texelsPerFinal = worldPerFinal * sx;
  const packed = new Uint16Array(texW * texH);
  for (let i = 0; i < field.length; i++) {
    packed[i] = THREE.DataUtils.toHalfFloat(clamp(field[i] / texelsPerFinal, -400, 400));
  }
  const sdfTexture = new THREE.DataTexture(packed, texW, texH, THREE.RedFormat, THREE.HalfFloatType);
  sdfTexture.minFilter = sdfTexture.magFilter = THREE.LinearFilter;
  sdfTexture.wrapS = sdfTexture.wrapT = THREE.ClampToEdgeWrapping;
  sdfTexture.generateMipmaps = false;
  sdfTexture.needsUpdate = true;

  // Smooth, tiling noise for the paper and the hand-drawn wobble in the coast.
  const noiseTexture = (() => {
    const size = 256;
    const random = CA.seeded(1519);
    const data = new Uint8Array(size * size * 4);
    const layer = (channel, passes) => {
      let grid = Float32Array.from({ length: size * size }, () => random());
      for (let pass = 0; pass < passes; pass++) {
        const next = new Float32Array(size * size);
        for (let y = 0; y < size; y++) {
          for (let x = 0; x < size; x++) {
            let sum = 0;
            for (let dy = -2; dy <= 2; dy++) {
              for (let dx = -2; dx <= 2; dx++) {
                sum += grid[((y + dy + size) % size) * size + ((x + dx + size) % size)];
              }
            }
            next[y * size + x] = sum / 25;
          }
        }
        grid = next;
      }
      let low = Infinity;
      let high = -Infinity;
      grid.forEach((value) => {
        low = Math.min(low, value);
        high = Math.max(high, value);
      });
      grid.forEach((value, i) => {
        data[i * 4 + channel] = Math.round(((value - low) / (high - low)) * 255);
      });
    };
    layer(0, 3);
    layer(1, 2);
    layer(2, 2);
    for (let i = 3; i < data.length; i += 4) data[i] = 255;
    const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;
    texture.needsUpdate = true;
    return texture;
  })();

  // When each patch of land near the campaign is reached. The shader tints it as the arrows pass.
  const reachScale = K * 1.25;
  const reachTexture = (() => {
    const fw = 320;
    const fh = Math.max(32, Math.round(fw * (domH / domW)));
    const data = new Uint8Array(fw * fh * 4);
    const radius = 58 * worldPerFinal;
    const probes = [];
    arrows.forEach((arrow) => {
      for (let i = 0; i <= 24; i++) {
        const p = pointAt(arrow, i / 24);
        probes.push([p.x, p.y, lerp(arrow.at, arrow.land, i / 24)]);
      }
    });
    for (let y = 0; y < fh; y++) {
      const wy = dom.maxY - ((y + 0.5) / fh) * domH;
      for (let x = 0; x < fw; x++) {
        const wx = dom.minX + ((x + 0.5) / fw) * domW;
        let best = Infinity;
        for (const [px0, py0, at] of probes) {
          const d = Math.hypot(wx - px0, wy - py0);
          if (d < radius) best = Math.min(best, at + (d / radius) * 0.34);
        }
        data[(y * fw + x) * 4] = best === Infinity ? 255 : Math.round(clamp(best / reachScale) * 254);
        data[(y * fw + x) * 4 + 3] = 255;
      }
    }
    const texture = new THREE.DataTexture(data, fw, fh, THREE.RGBAFormat);
    texture.minFilter = texture.magFilter = THREE.LinearFilter;
    texture.needsUpdate = true;
    return texture;
  })();

  const gridStep = [1, 2, 5, 10, 15, 30, 45].find((step) => step * finalScale >= (compact ? 92 : 112)) || 45;

  const RINGS = 12;
  const mapUniforms = {
    uSdf: { value: sdfTexture },
    uReach: { value: reachTexture },
    uNoise: { value: noiseTexture },
    uDom: { value: new THREE.Vector4(dom.minX, dom.minY, dom.maxX, dom.maxY) },
    uSheet: { value: new THREE.Vector4(sheet.minX, sheet.minY, sheet.maxX, sheet.maxY) },
    uPxW: { value: worldPerFinal },
    uStep: { value: gridStep },
    uLines: { value: V.mapStyle === "ink" ? 0.5 : 1 },
    uTerritory: { value: V.territory === "on" ? 1 : 0 },
    uTime: { value: 0 },
    uReachScale: { value: reachScale },
    uFlash: { value: 0 },
    uWash: { value: 0 },
    uWave: { value: new THREE.Vector4(0, 0, 0, 0) },
    uRings: { value: Array.from({ length: RINGS }, () => new THREE.Vector4()) },
    cSea: { value: glColor(C.sea) },
    cDeep: { value: glColor(C.seaDeep) },
    cLand: { value: glColor(C.land) },
    cEdge: { value: glColor(C.landEdge) },
    cCoast: { value: glColor(C.coast) },
    cGrid: { value: glColor(C.grid) },
    cTable: { value: glColor(C.table) },
    cArrow: { value: glColor(C.arrow) },
    cFlash: { value: glColor(C.flash) },
    cKey: { value: glColor(C.keyline) },
  };

  const scene = new THREE.Scene();

  const mapMaterial = new THREE.ShaderMaterial({
    uniforms: mapUniforms,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
    vertexShader: /* glsl */ `
      varying vec2 vW;
      void main() {
        vW = position.xy;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      varying vec2 vW;
      uniform sampler2D uSdf, uReach, uNoise;
      uniform vec4 uDom, uSheet, uWave;
      uniform vec4 uRings[${RINGS}];
      uniform float uPxW, uStep, uTime, uReachScale, uFlash, uWash, uLines, uTerritory;
      uniform vec3 cSea, cDeep, cLand, cEdge, cCoast, cGrid, cTable, cArrow, cFlash, cKey;

      vec2 domUv(vec2 w) {
        return vec2((w.x - uDom.x) / (uDom.z - uDom.x), (uDom.w - w.y) / (uDom.w - uDom.y));
      }
      float sdf(vec2 w) { return texture2D(uSdf, domUv(w)).r; }

      void main() {
        vec2 p = vW / uPxW;
        float edge = min(min(vW.x - uSheet.x, uSheet.z - vW.x), min(vW.y - uSheet.y, uSheet.w - vW.y)) / uPxW;

        if (edge < 0.0) {
          // The desk the sheet is lying on: a warm surface with the faintest long figure, a little brighter
          // beside the sheet, plus its cast shadow. It never drops below the table colour, so nothing fades to black.
          float shade = smoothstep(-34.0, 0.0, edge + 8.0);
          float figure = smoothstep(0.3, 0.72, texture2D(uNoise, vec2(p.x / 4200.0, p.y / 620.0)).r);
          vec3 warm = mix(cTable, cEdge, 0.2) * 1.2;
          vec3 under = mix(cTable, warm, 0.42 + figure * 0.22);
          under = mix(under, warm, 0.4 * exp(edge / 340.0));
          gl_FragColor = vec4(mix(under, cTable * 0.42, shade * 0.85), 1.0);
          return;
        }

        vec3 n1 = texture2D(uNoise, p / 1500.0).rgb;
        vec3 n2 = texture2D(uNoise, p / 300.0).rgb;
        vec3 n3 = texture2D(uNoise, p / 84.0).rgb;

        // A little hand-drawn life in the line, so low-detail outlines don't read as polygons.
        float d = sdf(vW) + (n2.g - 0.5) * 7.0 + (n3.b - 0.5) * 3.0;
        float aa = max(fwidth(d), 0.0001);
        float land = smoothstep(aa, -aa, d);

        // Sea: pale over the shallows, deepening offshore, with engraved lines following the coast.
        float dSea = max(d, 0.0);
        vec3 sea = mix(cDeep, cSea, exp(-dSea / 64.0));
        sea *= 0.965 + 0.07 * n1.r;
        float drift = sin(uTime * 0.9 + p.x * 0.004) * 0.9;
        float wl1 = 1.0 - smoothstep(0.9, 0.9 + aa * 1.4, abs(dSea - 13.0 - drift * 0.4));
        float wl2 = 1.0 - smoothstep(0.8, 0.8 + aa * 1.4, abs(dSea - 27.0 - drift * 0.7));
        float wl3 = 1.0 - smoothstep(0.7, 0.7 + aa * 1.4, abs(dSea - 46.0 - drift));
        vec3 pale = mix(cSea, cKey, 0.55);
        sea = mix(sea, pale, (wl1 * 0.62 + wl2 * 0.42 + wl3 * 0.26) * uLines);

        // The land sits on the sea like a sheet of cut paper.
        float behindLand = sdf(vW + vec2(-7.0, 8.0) * uPxW);
        sea = mix(sea, sea * 0.62, smoothstep(2.0, -6.0, behindLand));

        // Land: printed colour pooling toward the coast.
        float rim = exp(min(d, 0.0) / 30.0);
        vec3 ground = mix(cLand, cEdge, rim * 0.92);
        ground *= 0.95 + 0.1 * n1.g + 0.035 * (n2.r - 0.5);

        // Where the arrows have reached, the land takes a hatched tint.
        vec2 reachUv = domUv(vW);
        float reach = texture2D(uReach, reachUv).r;
        float front = uTime / uReachScale + (n2.b - 0.5) * 0.05;
        float taken = (1.0 - step(0.985, reach)) * smoothstep(0.0, 0.012, front - reach);
        float hatch = smoothstep(0.34, 0.46, abs(fract((p.x + p.y) / 9.0) - 0.5));
        ground = mix(ground, cArrow, uTerritory * taken * (0.12 + 0.2 * hatch));

        vec3 color = mix(sea, ground, land);

        // Latitude and longitude.
        float lat = degrees(atan(sinh(radians(vW.y))));
        float gx = abs(fract(vW.x / uStep + 0.5) - 0.5) * uStep / max(fwidth(vW.x), 0.00001);
        float gy = abs(fract(lat / uStep + 0.5) - 0.5) * uStep / max(fwidth(lat), 0.00001);
        float grid = 1.0 - smoothstep(0.9, 1.9, min(gx, gy));
        color = mix(color, cGrid, grid * mix(0.34, 0.2, land));

        // The coast itself.
        float coast = 1.0 - smoothstep(1.1, 1.1 + aa * 1.6, abs(d));
        color = mix(color, cCoast, coast * 0.92);

        // Arrival rings, and the wave that rolls out at the key moment.
        for (int i = 0; i < ${RINGS}; i++) {
          vec4 r = uRings[i];
          if (r.w <= 0.0) continue;
          float at = abs(length(vW - r.xy) - r.z) / uPxW;
          float a = (1.0 - smoothstep(4.0, 7.0, at)) * r.w;
          color = mix(color, cKey, a);
        }
        if (uWash > 0.0) {
          float dist = length(vW - uWave.xy);
          float behind = 1.0 - smoothstep(uWave.z - 90.0 * uPxW, uWave.z + 12.0 * uPxW, dist);
          color = mix(color, cFlash, behind * uWash * mix(0.05, 0.3, land));
          float crest = exp(-pow((dist - uWave.z) / (34.0 * uPxW), 2.0));
          color = mix(color, cFlash, crest * uWave.w);
        }
        color = mix(color, cFlash, uFlash * 0.22);

        // The sheet's printed border, only ever seen when the camera shows the whole sheet.
        if (edge < 40.0) {
          color = mix(vec3(0.0) + cLand, color, smoothstep(24.0, 25.5, edge));
          float rule = 1.0 - smoothstep(1.4, 2.4, abs(edge - 25.0));
          float rule2 = 1.0 - smoothstep(0.7, 1.5, abs(edge - 17.0));
          color = mix(color, cCoast, max(rule, rule2) * 0.86);
        }

        gl_FragColor = vec4(color, 1.0);
      }
    `,
  });

  {
    const cx = (dom.minX + dom.maxX) / 2;
    const cy = (dom.minY + dom.maxY) / 2;
    const size = Math.max(domW, domH) * 6;
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mapMaterial);
    plane.position.set(cx, cy, 0);
    plane.frustumCulled = false;
    plane.renderOrder = 0;
    // Clamp the vertex world position through the mesh's own offset.
    const positions = plane.geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      positions.setXY(i, positions.getX(i) + cx, positions.getY(i) + cy);
    }
    plane.position.set(0, 0, 0);
    scene.add(plane);
  }

  // Country borders stay the same thickness on screen however close the camera is.
  const borderUniforms = {
    uHalf: { value: 1 },
    uDash: { value: 20 },
    cBorder: { value: glColor(C.coast) },
  };
  if (file && file.borders && file.borders.length) {
    const positions = [];
    const normals = [];
    const along = [];
    const indices = [];
    file.borders.forEach(({ p }) => {
      let run = 0;
      for (let i = 2; i < p.length; i += 2) {
        const ax = p[i - 2];
        const ay = p[i - 1];
        const bx = p[i];
        const by = p[i + 1];
        const size = Math.hypot(bx - ax, by - ay);
        if (size === 0) continue;
        const nx = -(by - ay) / size;
        const ny = (bx - ax) / size;
        const base = positions.length / 3;
        positions.push(ax, ay, 0, ax, ay, 0, bx, by, 0, bx, by, 0);
        normals.push(nx, ny, -nx, -ny, nx, ny, -nx, -ny);
        along.push(run, run, run + size, run + size);
        indices.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
        run += size;
      }
    });
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("aNormal", new THREE.Float32BufferAttribute(normals, 2));
    geometry.setAttribute("aAlong", new THREE.Float32BufferAttribute(along, 1));
    geometry.setIndex(indices);
    const material = new THREE.ShaderMaterial({
      uniforms: borderUniforms,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
      side: THREE.DoubleSide,
      vertexShader: /* glsl */ `
        attribute vec2 aNormal;
        attribute float aAlong;
        uniform float uHalf;
        varying float vAlong;
        void main() {
          vAlong = aAlong;
          vec3 at = position + vec3(aNormal * uHalf, 0.0);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(at, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        precision highp float;
        varying float vAlong;
        uniform float uDash;
        uniform vec3 cBorder;
        void main() {
          if (fract(vAlong / uDash) > 0.62) discard;
          gl_FragColor = vec4(cBorder, 0.62);
        }
      `,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    mesh.renderOrder = 1;
    scene.add(mesh);
  }

  // ---------------------------------------------------------------- arrows

  const svg = $("cm-svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  const NS = "http://www.w3.org/2000/svg";
  const node = (tag, parent, attrs = {}) => {
    const el = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
    parent.appendChild(el);
    return el;
  };

  arrows.forEach((arrow) => {
    const group = node("g", $("cm-arrows"));
    const gradient = node("linearGradient", $("cm-defs"), {
      id: `cm-grad-${arrow.index}`, gradientUnits: "userSpaceOnUse",
    });
    arrow.gradient = gradient;
    arrow.stopA = node("stop", gradient, { offset: "0" });
    arrow.stopB = node("stop", gradient, { offset: "0.68" });
    arrow.stopC = node("stop", gradient, { offset: "1" });
    arrow.shadow = node("path", group, { fill: rgba(C.plateText, 0.42) });
    arrow.body = node("path", group, {
      fill: `url(#cm-grad-${arrow.index})`,
      stroke: C.keyline,
      "stroke-width": compact ? 5 : 6.5,
      "stroke-linejoin": "miter",
      "stroke-miterlimit": 6,
      "paint-order": "stroke",
    });
    arrow.sheen = [0.16, 0.2, 0.3].map((opacity) =>
      node("path", group, { fill: C.keyline, opacity, visibility: "hidden" }));
    group.style.visibility = "hidden";
    arrow.group = group;
  });

  // One arrow as an outline on the map: thick at the tail, narrowing to the neck, then a sharp swept head.
  function arrowOutline(arrow, reach, worldWidth, headBoost) {
    const length = arrow.length;
    const drawn = reach * length;
    const shaft = Math.min(worldWidth, length * 0.2);
    const headLength = Math.min(shaft * 1.95, drawn * 0.62);
    const headWidth = Math.min(shaft * 1.72, headLength * 1.35) * headBoost;
    const neck = Math.max(0.001, reach - headLength / length);
    const steps = Math.max(8, Math.ceil((neck / 1) * 56));
    const widthAt = (s) => shaft * lerp(1, 0.56, Math.pow(s / neck, 0.85));

    const left = [];
    const right = [];
    for (let i = 0; i <= steps; i++) {
      const s = (i / steps) * neck;
      const p = pointAt(arrow, s);
      const half = widthAt(s) / 2;
      left.push([p.x - p.ty * half, p.y + p.tx * half, s / reach]);
      right.push([p.x + p.ty * half, p.y - p.tx * half, s / reach]);
    }
    const n = pointAt(arrow, neck);
    const backSweep = pointAt(arrow, Math.max(0, neck - (headLength * 0.26) / length));
    const tip = pointAt(arrow, reach);
    const barbLeft = [
      backSweep.x - backSweep.ty * headWidth / 2,
      backSweep.y + backSweep.tx * headWidth / 2, neck / reach,
    ];
    const barbRight = [
      backSweep.x + backSweep.ty * headWidth / 2,
      backSweep.y - backSweep.tx * headWidth / 2, neck / reach,
    ];
    const tail = pointAt(arrow, Math.min(neck, (shaft * 0.3) / length));
    return {
      shaftWidth: widthAt,
      neck,
      points: [
        ...left, barbLeft, [tip.x, tip.y, 1], barbRight,
        ...right.reverse(), [tail.x, tail.y, 0],
      ],
      tip,
    };
  }

  function pathOf(points, offset) {
    let d = "";
    points.forEach((point, i) => {
      const [x, y] = project(point[0], point[1]);
      const lift = offset ? offset(point[2]) : null;
      const qx = lift ? x + lift[0] : x;
      const qy = lift ? y + lift[1] : y;
      d += `${i ? "L" : "M"}${qx.toFixed(2)},${qy.toFixed(2)}`;
    });
    return d + "Z";
  }

  function slicePath(arrow, shape, from, to) {
    const a = clamp(from, 0, shape.neck);
    const b = clamp(to, 0, shape.neck);
    if (b - a < 0.002) return "";
    const left = [];
    const right = [];
    for (let i = 0; i <= 8; i++) {
      const s = lerp(a, b, i / 8);
      const p = pointAt(arrow, s);
      const half = shape.shaftWidth(s) * 0.44;
      left.push([p.x - p.ty * half, p.y + p.tx * half]);
      right.push([p.x + p.ty * half, p.y - p.tx * half]);
    }
    return pathOf([...left, ...right.reverse()]);
  }

  const totalLength = arrows.reduce((sum, arrow) => sum + arrow.length, 0);
  {
    let run = 0;
    arrows.forEach((arrow) => {
      arrow.runFrom = run / totalLength;
      run += arrow.length;
      arrow.runTo = run / totalLength;
    });
  }

  // ---------------------------------------------------------------- markers and plates

  const markersEl = $("cm-markers");
  const platesEl = $("cm-plates");

  stops.forEach((stop, i) => {
    const size = stop.origin ? M.originDisc : M.disc;
    const final = stop === lastStop;
    const marker = make("div", "cm-marker", markersEl, stop.number);
    marker.setAttribute("data-layout-allow-overflow", "");
    marker.style.cssText = `
      width:${size}px;height:${size}px;
      background:${stop.origin ? C.plate : C.arrow};
      color:${C.keyline};
      font-size:${M.discText}px;
      border:${compact ? 5 : 6}px solid ${stop.origin ? C.arrow : C.keyline};
      box-shadow:0 ${compact ? 5 : 7}px 0 ${rgba(C.plateText, 0.4)}`;
    stop.marker = marker;
    stop.size = size;

    const plate = make("div", "cm-plate", platesEl);
    plate.setAttribute("data-layout-allow-overflow", "");
    plate.setAttribute("data-layout-allow-overlap", "");
    plate.setAttribute("data-layout-allow-occlusion", "");
    paperCard(plate, M.platePadX, M.platePadY);
    if (stop.stage) {
      const stage = make("div", "cm-stage", plate, stop.stage);
      stage.style.fontSize = M.stage + "px";
      stage.style.color = C.stageText;
      fit(stage, M.plateMax, minText);
      stop.stageEl = stage;
      stage.style.overflow = "hidden";
    }
    const place = make("div", "cm-place", plate, stop.place);
    place.style.fontSize = M.place + "px";
    fitLabel(place, M.plateMax, minText);
    stop.plate = plate;
    stop.placeEl = place;
    stop.tiltAngle = [-1.2, 0.9, -0.7, 1.1, -1, 0.8][i % 6];
    stop.plateW = plate.offsetWidth;
    stop.plateH = plate.offsetHeight;
    // In the finished frame the plates between the first and the last give up their dates to leave the sweep clear.
    stop.brief = Boolean(stop.stageEl) && !stop.origin && stop !== lastStop;
    stop.stageH = stop.stageEl ? stop.stageEl.offsetHeight : 0;
    stop.briefScale = minText / parseFloat(place.style.fontSize);
    stop.briefScale = stop.brief ? Math.min(1, stop.briefScale) : 1;
    const briefPlaceW = place.offsetWidth * stop.briefScale;
    const briefPlaceH = place.offsetHeight * stop.briefScale;
    stop.finalW = stop.brief ? Math.ceil(briefPlaceW + M.platePadX * 2) : stop.plateW;
    stop.finalH = stop.brief ? Math.ceil(briefPlaceH + M.platePadY * 2) : stop.plateH;
    if (stop.brief) {
      plate.style.overflow = "hidden";
      place.style.transformOrigin = "0 0";
    }
    stop.leader = node("path", $("cm-leaders"), {
      fill: "none", stroke: C.plateText, "stroke-width": compact ? 3 : 3.5,
      "stroke-linecap": "round", visibility: "hidden",
    });
  });

  const overlap = (a, b) =>
    Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) *
    Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));

  // Finds the spot beside a marker that stays clear of the arrows, the other markers and the other plates.
  function placePlate(stop, anchor, { rects, route, markers, floor, w, h, zoom = 1 }) {
    const clear = M.arrow * 0.46 * Math.pow(zoom, 0.42);
    let best = null;
    for (const reach of [10, 34, 70, 120, 180, 250, 330]) {
      for (let a = 0; a < 24; a++) {
        const angle = (a / 24) * Math.PI * 2 + 0.13;
        const ca = Math.cos(angle);
        const sa = Math.sin(angle);
        const cx = anchor.x + ca * (anchor.r + reach + (w / 2) * Math.abs(ca));
        const cy = anchor.y + sa * (anchor.r + reach + (h / 2) * Math.abs(sa));
        const rect = { x: cx - w / 2, y: cy - h / 2, w, h };
        const pad = 12;
        const roomy = { x: rect.x - pad, y: rect.y - pad, w: w + pad * 2, h: h + pad * 2 };
        let score = reach * 11;
        if (reach > 34) {
          const endX = clamp(anchor.x, rect.x, rect.x + w);
          const endY = clamp(anchor.y, rect.y, rect.y + h);
          for (let k = 1; k < 8; k++) {
            const qx = lerp(anchor.x, endX, k / 8);
            const qy = lerp(anchor.y, endY, k / 8);
            rects.forEach((other) => {
              if (qx > other.x && qx < other.x + other.w && qy > other.y && qy < other.y + other.h) score += 1600;
            });
            markers.forEach((other) => {
              if (other !== anchor && Math.hypot(qx - other.x, qy - other.y) < other.r + 6) score += 1600;
            });
          }
        }
        const spill =
          Math.max(0, side - rect.x) + Math.max(0, rect.x + w - (W - side)) +
          Math.max(0, topY + M.barH + 8 - rect.y) + Math.max(0, rect.y + h - floor);
        score += spill * 6000;
        rects.forEach((other) => { score += overlap(roomy, other) * 60; });
        route.forEach(([x, y]) => {
          if (x > rect.x - clear && x < rect.x + w + clear && y > rect.y - clear && y < rect.y + h + clear) {
            score += 420;
          }
        });
        markers.forEach((other) => {
          const box = { x: other.x - other.r - 8, y: other.y - other.r - 8, w: other.r * 2 + 16, h: other.r * 2 + 16 };
          score += overlap(roomy, box) * 80;
        });
        if (!best || score < best.score) best = { ...rect, score, reach };
      }
    }
    return best;
  }

  const routeOnScreen = (list, zoom = 1) => {
    const route = [];
    const wide = (M.arrow * Math.pow(zoom, 0.42)) / (zoom * finalScale);
    list.forEach((arrow) => {
      arrow.points.forEach((p) => route.push(project(p.x, p.y)));
      // The barbs reach well beyond the shaft.
      const shaft = Math.min(wide, arrow.length * 0.2);
      const barb = pointAt(arrow, Math.max(0, 1 - (shaft * 2.3) / arrow.length));
      const half = shaft * 0.86;
      route.push(project(barb.x - barb.ty * half, barb.y + barb.tx * half));
      route.push(project(barb.x + barb.ty * half, barb.y - barb.tx * half));
    });
    return route;
  };
  const markerOnScreen = (stop, zoom = 1) => {
    const [x, y] = project(stop.x, stop.y);
    return { x, y, r: (stop.size / 2) * Math.pow(zoom, 0.26) };
  };

  const reserved = [];
  let screenRoute = [];
  {
    // The finished frame, most important plate first.
    pose(finalShot);
    screenRoute = routeOnScreen(arrows);
    reserved.push({ x: side, y: heroTop, w: W - side * 2, h: heroH });
    reserved.push({ x: side, y: topY, w: W - side * 2, h: M.barH });
    const markers = stops.map((stop) => markerOnScreen(stop));
    const order = [lastStop, ...stops.filter((stop) => stop !== lastStop && !(shallow && stop.brief))];
    const taken = new Map();
    for (let round = 0; round < 4; round++) {
      order.forEach((stop) => {
        const anchor = markers[stops.indexOf(stop)];
        taken.delete(stop);
        const best = placePlate(stop, anchor, {
          rects: [...reserved, ...taken.values()],
          route: screenRoute, markers, floor: heroTop - 10, w: stop.finalW, h: stop.finalH,
        });
        stop.finalDx = best.x - anchor.x;
        stop.finalDy = best.y - anchor.y;
        taken.set(stop, best);
      });
    }
    reserved.push(...taken.values());

    // The close-up each place arrives in. Only that arrow and the next one matter there.
    stops.forEach((stop) => {
      const index = stop.origin ? 0 : stop.arrow.index + 1;
      if (stop === lastStop || index >= shots.length - 1 + (stop.origin ? 1 : 0)) {
        stop.closeDx = stop.finalDx ?? 0;
        stop.closeDy = stop.finalDy ?? 0;
        stop.finalDx = stop.closeDx;
        stop.finalDy = stop.closeDy;
        return;
      }
      pose(shots[index]);
      const near = arrows.slice(Math.max(0, index - 1), index + 1);
      const zoom = clamp(scaleOf(shots[index].dist) / finalScale, 1, 5);
      const best = placePlate(stop, markerOnScreen(stop, zoom), {
        rects: [],
        route: routeOnScreen(near, zoom),
        markers: stops.filter((other) => other !== stop).map((other) => markerOnScreen(other, zoom)),
        floor: floorY,
        w: stop.plateW,
        h: stop.plateH,
        zoom,
      });
      const [x, y] = project(stop.x, stop.y);
      stop.closeDx = best.x - x;
      stop.closeDy = best.y - y;
      stop.finalDx = stop.finalDx ?? stop.closeDx;
      stop.finalDy = stop.finalDy ?? stop.closeDy;
    });
  }

  // ---------------------------------------------------------------- printed names on the map

  const atlasNames = (() => {
    if (file) {
      return (file.names || [])
        .filter((item) => !["Americas", "Oceania"].includes(item.name))
        .filter((item) => item.kind === "continent" || (item.rank ?? 1) <= 3 || item.kind !== "country")
        .map((item) => ({
          text: item.kind === "continent" || item.kind === "country" ? item.name.toUpperCase() : item.name,
          x: item.x, y: item.y,
          sea: !(item.kind === "continent" || item.kind === "country"),
          big: item.kind === "continent",
        }));
    }
    const table = [
      ["PACIFIC OCEAN", 12, -150, true], ["ATLANTIC OCEAN", 28, -42, true],
      ["INDIAN OCEAN", -18, 80, true], ["ATLANTIC OCEAN", -32, -12, true],
      ["PACIFIC OCEAN", -30, -125, true],
      ["AFRICA", 12, 20, false], ["ASIA", 52, 92, false], ["EUROPE", 56, 28, false],
      ["NORTH AMERICA", 48, -102, false], ["SOUTH AMERICA", -8, -60, false],
      ["AUSTRALIA", -24, 134, false], ["ANTARCTICA", -77, 40, false],
      ["ANTARCTICA", -77, 150, false], ["ANTARCTICA", -77, -80, false],
    ];
    const list = [];
    table.forEach(([text, lat, lon, sea]) => {
      for (let turn = -2; turn <= 2; turn++) {
        list.push({ text, x: lon + turn * 360, y: mercY(lat), sea, big: !sea });
      }
    });
    return list;
  })();

  // Printed names belong to the close-ups. Each shot gets its own few, sized for that shot, and they fade on the way out.
  const printed = [];
  {
    const measure = document.createElement("canvas").getContext("2d");
    const closeShots = shots.slice(0, -1);
    closeShots.forEach((shot, index) => {
      pose(shot);
      const zoom = clamp(scaleOf(shot.dist) / finalScale, 1, 5);
      const shotScale = scaleOf(shot.dist);
      const taken = [{ x: side, y: topY, w: W - side * 2, h: M.barH }];
      const near = arrows.slice(Math.max(0, index - 1), index + 2);
      const route = routeOnScreen(near);
      const nearStops = stops.map((stop) => markerOnScreen(stop, zoom));
      stops.forEach((stop) => {
        const [x, y] = project(stop.x, stop.y);
        taken.push({ x: x + stop.closeDx - 10, y: y + stop.closeDy - 10, w: stop.plateW + 20, h: stop.plateH + 20 });
      });
      let count = 0;
      atlasNames.forEach((item) => {
        if (count >= 3) return;
        const fontPx = item.sea ? M.atlasOcean : M.atlasLand;
        const font = item.sea
          ? `italic 400 ${fontPx}px Newsreader`
          : `700 ${fontPx}px "Libre Caslon Text"`;
        const spacing = (item.sea ? 0.12 : 0.2) * fontPx;
        measure.font = font;
        measure.letterSpacing = `${spacing}px`;
        const textW = measure.measureText(item.text).width;
        const [cx, cy] = project(item.x, item.y);
        const rect = { x: cx - textW / 2, y: cy - fontPx * 0.72, w: textW, h: fontPx * 1.44 };
        if (rect.x < side * 0.5 || rect.x + rect.w > W - side * 0.5) return;
        if (rect.y < topY + M.barH || rect.y + rect.h > floorY) return;
        if (item.y > dom.maxY || item.y < dom.minY) return;
        if (taken.some((other) => overlap(rect, other) > 0)) return;
        // A sea name sits on the sea and a country on its land, or it isn't printed.
        let right = 0;
        for (let k = 0; k < 11; k++) {
          const wx = item.x + ((k / 10 - 0.5) * textW) / shotScale;
          const tx = Math.floor(px(wx));
          const ty = Math.floor(py(item.y));
          const wet = tx >= 0 && ty >= 0 && tx < texW && ty < texH && field[ty * texW + tx] > 0;
          if (wet === item.sea) right++;
        }
        if (right < 9) return;
        const clearance = M.arrow * Math.pow(zoom, 0.42) * 0.8;
        const blocked = route.some(([x, y]) =>
          x > rect.x - clearance && x < rect.x + rect.w + clearance &&
          y > rect.y - clearance && y < rect.y + rect.h + clearance) ||
          nearStops.some((m) => m.x > rect.x - m.r && m.x < rect.x + rect.w + m.r && m.y > rect.y - m.r && m.y < rect.y + rect.h + m.r);
        if (blocked) return;
        taken.push(rect);
        count++;

        const canvas = document.createElement("canvas");
        const pad = 8;
        const dpr = 2;
        const boxH = fontPx * 1.5 + pad * 2;
        canvas.width = Math.ceil((textW + pad * 2) * dpr);
        canvas.height = Math.ceil(boxH * dpr);
        const g = canvas.getContext("2d");
        g.scale(dpr, dpr);
        g.font = font;
        g.letterSpacing = `${spacing}px`;
        g.fillStyle = "#fff";
        g.textBaseline = "middle";
        g.fillText(item.text, pad, boxH / 2);
        const texture = new THREE.CanvasTexture(canvas);
        texture.anisotropy = 4;
        const uniforms = {
          uMap: { value: texture },
          uColor: { value: glColor(item.sea ? C.keyline : C.coast) },
          uAlpha: { value: 0 },
        };
        const material = new THREE.ShaderMaterial({
          uniforms,
          transparent: true,
          depthTest: false,
          depthWrite: false,
          toneMapped: false,
          vertexShader: /* glsl */ `
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: /* glsl */ `
            precision highp float;
            varying vec2 vUv;
            uniform sampler2D uMap;
            uniform vec3 uColor;
            uniform float uAlpha;
            void main() {
              gl_FragColor = vec4(uColor, texture2D(uMap, vUv).a * uAlpha);
            }
          `,
        });
        const worldPx = 1 / shotScale;
        const mesh = new THREE.Mesh(
          new THREE.PlaneGeometry((canvas.width / dpr) * worldPx, boxH * worldPx),
          material,
        );
        mesh.position.set(item.x, item.y, 0);
        mesh.renderOrder = 2;
        mesh.frustumCulled = false;
        mesh.visible = false;
        scene.add(mesh);
        printed.push({ mesh, uniforms, shot: index, strength: item.sea ? 0.74 : 0.42 });
      });
    });
  }

  // ---------------------------------------------------------------- one frame

  const stateOfArrow = (arrow, t) => {
    const u = seg(t, arrow.at, arrow.land - arrow.at);
    return Math.pow(smooth(u), 0.82);
  };

  function setRings(t, holdTime, arrived) {
    const rings = mapUniforms.uRings.value;
    let slot = 0;
    const put = (x, y, r, alpha) => {
      if (slot < RINGS) rings[slot++].set(x, y, r, alpha);
    };
    stops.forEach((stop, i) => {
      if (stop.origin) {
        const phase = (((t + i * 0.4) / 1.5) % 1 + 1) % 1;
        put(stop.x, stop.y, M.ring * 0.62 * out(phase, 2) * worldPerFinal, 0.5 * Math.pow(1 - phase, 2));
        return;
      }
      if (t < stop.at) return;
      const age = t - stop.at;
      if (age < 0.8) {
        const phase = age / 0.8;
        const big = stop === lastStop ? 2.4 : 1;
        put(stop.x, stop.y, M.ring * big * out(phase, 2.4) * worldPerFinal, 0.9 * Math.pow(1 - phase, 1.6));
      } else if (arrived) {
        const phase = ((holdTime / 1.7 + i * 0.19) % 1 + 1) % 1;
        put(stop.x, stop.y, M.ring * 0.7 * out(phase, 2) * worldPerFinal, 0.42 * Math.pow(1 - phase, 2));
      }
    });
    while (slot < RINGS) rings[slot++].set(0, 0, 0, 0);
  }

  function renderAt(inputTime) {
    const time = Math.max(0, Number(inputTime) || 0);
    const t = designTime(time);
    const arrived = time >= T.key - EPS;
    const holdTime = Math.max(0, time - T.key);
    const keyEnergy = arrived ? Math.exp(-holdTime * 5.5) : 0;
    const keyKick = arrived ? Math.exp(-holdTime * 9) * Math.cos(holdTime * 17) : 0;

    // Camera: it chases each arrow, then lands on the whole sweep with a punch.
    const c = cameraAt(arrived ? K : t);
    let bump = 0;
    arrows.forEach((arrow) => {
      if (arrow === arrows[arrows.length - 1]) return;
      const age = t - arrow.land;
      if (age >= 0 && age < 0.5) bump += Math.exp(-age * 12) * 0.018;
    });
    c.dist *= 1 - bump;
    if (arrived) {
      c.dist *= 1 - 0.06 * keyKick - 0.024 * (1 - Math.exp(-holdTime * 0.8));
      c.x += Math.sin(holdTime * 0.8) * 5 * worldPerFinal;
      c.y += (1 - Math.cos(holdTime * 0.6)) * 4 * worldPerFinal;
      c.yaw += Math.sin(holdTime * 0.55) * 0.012;
    }
    pose(c);

    // A long sweep can outrun the camera for a moment. Keep the head of the arrow in shot.
    if (!arrived) {
      const flying = arrows.find((arrow) => t >= arrow.at && t < arrow.land);
      if (flying) {
        const tip = pointAt(flying, stateOfArrow(flying, t));
        const [hx, hy] = project(tip.x, tip.y);
        const margin = M.disc;
        const ex = hx - clamp(hx, margin, W - margin);
        const ey = hy - clamp(hy, topY + margin, H - margin);
        if (ex || ey) {
          const s = scaleOf(c.dist);
          const cosT = Math.cos(c.tilt);
          c.x += (ex * Math.cos(c.yaw) + (ey * Math.sin(c.yaw)) / cosT) / s;
          c.y += (ex * Math.sin(c.yaw) - (ey * Math.cos(c.yaw)) / cosT) / s;
          pose(c);
        }
      }
    }

    const scaleNow = scaleOf(c.dist);
    const worldPerPx = 1 / scaleNow;

    // Map.
    mapUniforms.uTime.value = t;
    setRings(t, holdTime, arrived);
    mapUniforms.uFlash.value = keyEnergy;
    mapUniforms.uWash.value = arrived ? 1 : 0;
    if (arrived) {
      const r = (lerp(240, H * 2.3, out(seg(holdTime, 0, 1.25), 2.2))) * worldPerFinal;
      mapUniforms.uWave.value.set(lastStop.x, lastStop.y, r, 0.72 * Math.pow(1 - seg(holdTime, 0, 1.25), 2));
    }
    borderUniforms.uHalf.value = (compact ? 1.5 : 1.8) * worldPerPx;
    borderUniforms.uDash.value = 15 * worldPerPx;

    printed.forEach((item) => {
      const near = arrived ? 0
        : item.shot === c.fromIndex ? 1 - c.e
        : item.shot === c.fromIndex + 1 ? c.e
        : 0;
      const alpha = smooth(seg(near, 0.55, 0.35)) * item.strength;
      item.uniforms.uAlpha.value = alpha;
      item.mesh.visible = alpha > 0.001;
    });

    // Arrows.
    const widthPx = M.arrow * Math.pow(clamp(scaleNow / finalScale, 1, 5), 0.42);
    const sheenPhase = arrived ? ((holdTime * 0.62 + 0.72) % 1.28) - 0.14 : -1;

    arrows.forEach((arrow) => {
      const started = t >= arrow.at;
      arrow.group.style.visibility = started ? "visible" : "hidden";
      if (!started) return;

      const settled = t >= arrow.land - EPS;
      const stop = stops.find((item) => item.arrow === arrow);
      const end = Math.max(0.2, 1 - (stop.size * 0.44 * worldPerPx) / arrow.length);
      const raw = settled ? 1 : stateOfArrow(arrow, t);
      const reach = Math.max(0.03, raw * end);

      const age = t - arrow.land;
      const plant = settled ? Math.exp(-age * 11) : 0;
      const shape = arrowOutline(
        arrow, reach, widthPx * worldPerPx * (1 + keyEnergy * 0.12),
        1 + plant * 0.34,
      );

      // In flight the head rides high off the map, then slams flat as it lands.
      const flightLift = settled ? 0 : Math.sin(Math.PI * clamp(raw)) ;
      const lift = (compact ? 18 : 24) * flightLift;
      const base = compact ? 7 : 9;
      arrow.shadow.setAttribute("d", pathOf(shape.points, (u) => {
        const h = base + lift * u * u;
        return [h * 0.7, h];
      }));
      arrow.body.setAttribute("d", pathOf(shape.points));

      const [ax, ay] = project(arrow.points[0].x, arrow.points[0].y);
      const [bx, by] = project(shape.tip.x, shape.tip.y);
      arrow.gradient.setAttribute("x1", ax.toFixed(2));
      arrow.gradient.setAttribute("y1", ay.toFixed(2));
      arrow.gradient.setAttribute("x2", bx.toFixed(2));
      arrow.gradient.setAttribute("y2", by.toFixed(2));

      const flare = arrow === arrows[arrows.length - 1]
        ? Math.max(keyEnergy, plant * 0.5)
        : Math.max(keyEnergy, plant * 0.34);
      arrow.stopA.setAttribute("stop-color", blend(C.arrowTail, C.flash, flare));
      arrow.stopB.setAttribute("stop-color", blend(C.arrow, C.flash, flare));
      arrow.stopC.setAttribute("stop-color", blend(C.arrow, C.flash, flare * 0.8));

      if (arrived) {
        const local = (sheenPhase - arrow.runFrom) / (arrow.runTo - arrow.runFrom);
        const spread = 0.05 / (arrow.runTo - arrow.runFrom);
        [2.4, 1.5, 0.7].forEach((wide, i) => {
          const d = slicePath(arrow, shape, local - spread * wide, local + spread * wide);
          arrow.sheen[i].setAttribute("d", d);
          arrow.sheen[i].setAttribute("visibility", d ? "visible" : "hidden");
        });
      } else {
        arrow.sheen.forEach((el) => el.setAttribute("visibility", "hidden"));
      }
    });

    // Markers and plates.
    stops.forEach((stop) => {
      const visible = t + EPS >= stop.at;
      const plateAt = stop.at - 0.11;
      const plateVisible = t + EPS >= plateAt;
      stop.marker.style.visibility = visible ? "visible" : "hidden";
      stop.plate.style.visibility = plateVisible ? "visible" : "hidden";
      if (!plateVisible) {
        stop.leader.setAttribute("visibility", "hidden");
        return;
      }
      const [x, y] = project(stop.x, stop.y);
      const age = Math.max(0, t - Math.max(0, stop.at));
      const isLast = stop === lastStop;
      const stamp = stop.origin ? 1 : 1 + Math.pow(1 - seg(age, 0, 0.16), 2) * (isLast ? 0.85 : 0.55);
      const pulse = arrived ? 1 + keyKick * (isLast ? 0.2 : 0.12) : 1;
      const zoomed = Math.pow(clamp(scaleNow / finalScale, 1, 5), 0.26);
      const scale = zoomed * stamp * pulse;
      stop.marker.style.transform =
        `translate(${(x - stop.size / 2).toFixed(2)}px, ${(y - stop.size / 2).toFixed(2)}px) scale(${scale.toFixed(4)})`;
      stop.marker.style.background = stop.origin
        ? C.plate
        : blend(C.arrow, C.flash, isLast ? keyEnergy : keyEnergy * 0.5);
      // The number turns dark while the marker is gold, so it stays readable through the flash.
      stop.marker.style.color = blend(C.keyline, C.plateText, isLast ? clamp(keyEnergy * 3) : 0);

      const shrink = stop.brief ? (arrived ? 1 : smooth(seg(c.pulled, 0.25, 0.8))) : 0;
      const plateW = lerp(stop.plateW, stop.finalW, shrink);
      const plateH = lerp(stop.plateH, stop.finalH, shrink);
      if (stop.brief) {
        stop.plate.style.width = plateW.toFixed(2) + "px";
        stop.plate.style.height = plateH.toFixed(2) + "px";
        stop.stageEl.style.height = (stop.stageH * (1 - shrink)).toFixed(2) + "px";
        stop.stageEl.style.opacity = (1 - shrink).toFixed(3);
        stop.placeEl.style.transform = `scale(${lerp(1, stop.briefScale, shrink).toFixed(4)})`;
      }
      const settle = arrived ? 1 : smooth(seg(c.pulled, 0, 0.4));
      const wantX = x + lerp(stop.closeDx, stop.finalDx, settle);
      const wantY = y + lerp(stop.closeDy, stop.finalDy, settle);
      // A plate holds on at the edge of the frame only while its place is in shot, then leaves with it.
      const away = Math.max(-x, x - W, -y, y - H);
      const hold = 1 - smooth(seg(away, -40, 140));
      const plateX = lerp(wantX, clamp(wantX, side * 0.6, W - side * 0.6 - plateW), hold);
      const plateY = lerp(wantY, clamp(wantY, topY + M.barH + 8, floorY - plateH), hold);
      const plateIn = stop.origin ? 1 : back(seg(t, plateAt, 0.16), 1.6);
      const after = stops[stops.indexOf(stop) + 1];
      const retired = after && after.at > 0 ? seg(t, after.at + 0.06, 0.16) : 0;
      const returned = shallow && stop.brief ? 0 : arrived ? 1 : smooth(seg(c.pulled, 0.3, 0.72));
      const present = Math.max(1 - retired, returned);
      const plateScale = (0.72 + 0.28 * plateIn) * (arrived ? 1 + keyKick * (isLast ? 0.1 : 0.04) : 1);
      stop.plate.style.opacity = (clamp(plateIn * 1.6) * present).toFixed(3);
      stop.plate.style.transform =
        `translate(${plateX.toFixed(2)}px, ${plateY.toFixed(2)}px) rotate(${stop.tiltAngle}deg) scale(${plateScale.toFixed(4)})`;

      const nearX = clamp(x, plateX, plateX + plateW);
      const nearY = clamp(y, plateY, plateY + plateH);
      const gapAway = Math.hypot(nearX - x, nearY - y);
      if (gapAway > (stop.size / 2) * scale + 8 && visible && present > 0.5) {
        stop.leader.setAttribute("d", `M${x.toFixed(1)},${y.toFixed(1)}L${nearX.toFixed(1)},${nearY.toFixed(1)}`);
        stop.leader.setAttribute("visibility", "visible");
      } else {
        stop.leader.setAttribute("visibility", "hidden");
      }
    });

    // Title and count.
    barEl.style.visibility = "visible";
    const barIn = out(seg(t, 0, 0.14), 2);
    barEl.style.transform = `translateY(${((1 - barIn) * -14).toFixed(2)}px)`;

    let shown = 0;
    let rolling = null;
    arrows.forEach((arrow, i) => {
      if (t + EPS >= arrow.land) shown = i + 1;
      else if (t >= arrow.at && rolling === null) rolling = i;
    });
    let display = countText(shown);
    if (rolling !== null && !arrived) {
      const a = countStats[rolling];
      const b = countStats[rolling + 1];
      if (a && b && a.prefix === b.prefix && a.suffix === b.suffix) {
        const arrow = arrows[rolling];
        const p = out(seg(t, arrow.at, arrow.land - arrow.at), 2);
        const value = lerp(a.value, b.value, p);
        const rounded = Number(value.toFixed(b.decimals));
        display = formatStat(b, rounded);
      }
    }
    if (arrived) display = countText(arrows.length);
    if (countValueEl.textContent !== display) countValueEl.textContent = display;
    const lastLand = shown > 0 ? arrows[shown - 1].land : -10;
    const tick = t - lastLand;
    const tickKick = tick >= 0 ? Math.exp(-tick * 10) * Math.cos(tick * 20) : 0;
    countValueEl.style.transform = `scale(${(1 + tickKick * 0.3).toFixed(4)})`;
    countEl.style.transform = `scale(${(1 + keyKick * 0.08).toFixed(4)})`;

    // Hero.
    const heroAt = K - 0.13;
    const heroVisible = t >= heroAt;
    heroEl.style.visibility = heroVisible ? "visible" : "hidden";
    if (heroVisible) {
      const fall = arrived ? 1 : seg(t, heroAt, K - heroAt);
      const fly = lerp(1.7, 1, fall * fall);
      heroEl.style.opacity = clamp(fall * 3).toFixed(3);
      heroEl.style.background = blend(C.arrow, C.flash, keyEnergy * 0.55);
      heroEl.style.transform =
        `scale(${(fly * (1 + keyKick * 0.075)).toFixed(4)}) rotate(${(lerp(-3.4, -0.6, fall) + keyKick * 0.5).toFixed(3)}deg)`;
      heroValueEl.style.transform = `scale(${(1 + keyKick * 0.05).toFixed(4)})`;
      heroValueEl.style.transformOrigin = "50% 50%";
    }

    creditEl.style.visibility = file ? "visible" : "hidden";

    // Overlay open and close.
    const open = variant === "overlay" ? out(seg(time, 0, 0.26), 3) : 1;
    const exitDuration = Math.max(0, T.exit - 1 / CA.fps);
    let closed = T.exit > 0 ? seg(time, T.key + T.hold, exitDuration) : 0;
    if (closed > 1 - 0.0000001) closed = 1;
    if (open >= 0.999999 && closed === 0) {
      stageEl.style.clipPath = "none";
    } else {
      const point = closed > 0 ? lastStop : firstStop;
      const [cx, cy] = project(point.x, point.y);
      const radius = Math.hypot(W, H) * open * (1 - closed * closed);
      stageEl.style.clipPath =
        `circle(${Math.max(0, radius).toFixed(3)}px at ${cx.toFixed(2)}px ${cy.toFixed(2)}px)`;
    }

    renderer.render(scene, camera);
  }

  window.addEventListener("hf-seek", (event) => renderAt(event.detail.time));
  renderAt(window.__hfThreeTime || 0);
  window.__timelines["block"] = gsap.timeline({ paused: true });
});
