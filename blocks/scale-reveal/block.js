import * as THREE from "three";

CA.ready(() => {
  const { vars: V, stage: S, safe, time: T, variant, make, fit, rgba, seeded } = CA;

  const $ = (id) => document.getElementById(id);
  const W = S.w;
  const H = S.h;
  const K = T.design;
  const EPS = 0.000001;
  const stageEl = $("stage");
  const full = variant === "full";
  const minText = full ? 40 : 32;

  const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
  const lerp = (a, b, p) => a + (b - a) * p;
  const seg = (t, at, duration) =>
    duration <= 0 ? (t >= at ? 1 : 0) : clamp((t - at) / duration);
  const out = (p, power = 3) => 1 - Math.pow(1 - p, power);
  const smooth = (p) => p * p * (3 - 2 * p);
  const back = (p, s = 1.7) =>
    1 + (s + 1) * Math.pow(p - 1, 3) + s * Math.pow(p - 1, 2);
  const designTime = (time) =>
    time >= T.key - EPS ? K + Math.max(0, time - T.key) : time / T.scale;

  // sRGB colours exactly as typed, for the hand-written shaders.
  const raw = (hex) => {
    const h = hex.replace("#", "");
    const f = h.length === 3 ? h.replace(/./g, "$&$&") : h;
    const n = parseInt(f, 16);
    return new THREE.Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
  };
  const toHex = (v) =>
    "#" + [v.x, v.y, v.z]
      .map((c) => Math.round(clamp(c) * 255).toString(16).padStart(2, "0"))
      .join("");
  const blend = (a, b, p) => toHex(raw(a).lerp(raw(b), clamp(p)));

  // ---------------------------------------------------------------- facts
  // Every height here is a real one, in metres. Nothing below changes them.
  const hero = clamp(Number(V.heightMetres) || 1090, 3, 2000000);
  const imperial = V.units === "imperial";
  const EARTH = 6371000;
  const BUNDLE = 0.109; // 1,000 bills at 0.109 mm each

  const COMPARISONS = [
    { id: "person", h: 1.8, name: "A person" },
    { id: "bus", h: 3, name: "A city bus" },
    { id: "house", h: 9, name: "A house" },
    { id: "tree", h: 30, name: "A tall tree" },
    { id: "tower", h: 150, name: "A city tower" },
    { id: "tallest", h: 828, name: "World's tallest building" },
    { id: "alps", h: 4806, name: "Highest peak in the Alps" },
    { id: "everest", h: 8849, name: "World's highest mountain" },
    { id: "jet", h: 10700, name: "Jet cruising height" },
    { id: "balloon", h: 30000, name: "Weather balloon" },
    { id: "space", h: 100000, name: "Edge of space" },
    { id: "station", h: 400000, name: "Space station" },
  ];

  // Only things shorter than the hero, always the tallest of them, spaced
  // evenly on a log scale so each one fills the frame in its turn.
  function pickComparisons() {
    const pool = COMPARISONS.filter((c) => c.h <= hero * 0.92);
    if (pool.length < 2) return pool.slice();
    const first = pool[0];
    const last = pool[pool.length - 1];
    const span = Math.log10(last.h / first.h);
    const count = clamp(Math.round(span / 0.75) + 1, 2, 6);
    const chosen = [first];
    for (let i = 1; i < count - 1; i++) {
      const target = Math.log10(first.h) + (span * i) / (count - 1);
      const prev = chosen[chosen.length - 1];
      const options = pool.filter((c) => c.h > prev.h && c.h < last.h);
      if (!options.length) break;
      options.sort((a, b) =>
        Math.abs(Math.log10(a.h) - target) - Math.abs(Math.log10(b.h) - target));
      chosen.push(options[0]);
    }
    chosen.push(last);
    return chosen;
  }

  const comps = pickComparisons().map((c) => ({ ...c }));

  const sig = (n, digits) => {
    if (n === 0) return 0;
    const m = Math.pow(10, digits - Math.ceil(Math.log10(Math.abs(n))));
    return Math.round(n * m) / m;
  };
  const commas = (n) => n.toLocaleString("en-US");

  function formatHeight(metres) {
    if (imperial) {
      const ft = metres * 3.28084;
      if (ft < 1000) return Math.round(ft) + " ft";
      if (ft < 10000) return commas(Math.round(ft)) + " ft";
      if (ft < 52800) return commas(sig(ft, 3)) + " ft";
      return commas(sig(ft / 5280, 3)) + " mi";
    }
    if (metres < 10000) return commas(sig(metres, 4)) + " m";
    return commas(sig(metres / 1000, 3)) + " km";
  }

  function formatCounter(metres) {
    if (imperial) {
      const ft = metres * 3.28084;
      if (ft < 52800) return commas(Math.round(ft)) + " ft";
      return commas(Math.round(ft / 5280)) + " mi";
    }
    if (metres < 10) return metres.toFixed(1) + " m";
    if (metres < 1000) return Math.round(metres) + " m";
    if (metres < 100000) return (metres / 1000).toFixed(2) + " km";
    return commas(Math.round(metres / 1000)) + " km";
  }

  // --------------------------------------------------------------- layout
  const M = full
    ? {
        xs: 300, yb: 1552, stackA: 156, stackB: 134,
        sky0: 1060, sky1: 1402, personPx: 640,
        labelPx: 80, labelY: 232, heroPx: 340,
        tagValue: 112, tagName: 58, tagPadX: 26, tagPadY: 14, tagRadius: 26,
        counter: 132, chip: 46, caption: 54, tickMajor: 42, tickMinor: 20,
        shake: 30, bow: 170, airPx: 340, shadowSize: 4096,
      }
    : {
        xs: Math.round(W * 0.205), yb: H - Math.round(H * 0.085), stackA: 118, stackB: 104,
        sky0: H * 0.56, sky1: H * 0.78, personPx: H * 0.47,
        labelPx: 56, labelY: variant === "top" ? Math.min(safe.top, H * 0.11) : 44, heroPx: 250,
        tagValue: 76, tagName: 40, tagPadX: 18, tagPadY: 9, tagRadius: 18,
        counter: 88, chip: 36, caption: 40, tickMajor: 30, tickMinor: 14,
        shake: 18, bow: 130, airPx: 240, shadowSize: 2048,
      };

  const side = Math.max(safe.side, full ? 64 : 44);

  const heroLeft = full ? side : Math.round(M.xs + M.stackB / 2 + 30);
  const labelWidth = W - side - heroLeft;

  const labelEl = $("sr-label");
  labelEl.textContent = V.heroLabel;
  labelEl.style.cssText = `
    left:${heroLeft}px;top:${Math.round(M.labelY)}px;width:${labelWidth}px;
    font-size:${M.labelPx}px;color:${V.text};
    text-shadow:0 3px 0 ${rgba(V.ink, 0.45)}, 0 0 26px ${rgba(V.ink, 0.35)}`;

  // Long labels shrink first, then take a second line.
  (function fitLabel() {
    let px = M.labelPx;
    labelEl.style.whiteSpace = "nowrap";
    while (labelEl.scrollWidth > labelWidth && px > M.labelPx * 0.72) {
      px -= 1;
      labelEl.style.fontSize = px + "px";
    }
    if (labelEl.scrollWidth > labelWidth) {
      labelEl.style.whiteSpace = "normal";
      const maxH = px * 1.06 * 2 + 2;
      while (labelEl.scrollHeight > maxH && px > minText) {
        px -= 1;
        labelEl.style.fontSize = px + "px";
      }
    }
  })();
  const labelBottom = labelEl.offsetTop + labelEl.offsetHeight;

  const heroEl = $("sr-hero");
  heroEl.textContent = V.heroValue;
  const heroWidth = W - side - heroLeft;
  heroEl.style.fontSize = M.heroPx + "px";
  fit(heroEl, heroWidth / 1.1, full ? 150 : 96);
  const heroPx = parseFloat(heroEl.style.fontSize) || M.heroPx;
  const heroTop = labelBottom + (full ? 14 : 6);
  const heroBottom = heroTop + heroPx * 1.02;

  const captionEl = $("sr-caption");
  captionEl.textContent = V.caption || "";
  captionEl.style.cssText = `
    left:${heroLeft}px;top:${Math.round(heroBottom + (full ? 8 : -2))}px;
    width:${W - side - heroLeft}px;font-size:${M.caption}px;color:${V.text};
    text-shadow:0 3px 0 ${rgba(V.ink, 0.5)}, 0 0 20px ${rgba(V.ink, 0.45)}`;
  (function fitCaption() {
    let px = M.caption;
    while (captionEl.scrollHeight > px * 1.05 * 2 + 2 && px > minText) {
      px -= 1;
      captionEl.style.fontSize = px + "px";
    }
  })();
  const captionH = V.caption ? captionEl.offsetHeight + (full ? 10 : 4) : 0;
  heroEl.style.left = heroLeft + "px";
  heroEl.style.top = heroTop + "px";
  heroEl.style.color = V.text;

  // The top of the stack stops under the number on the tall output and
  // beside it on the shorter ones, and the last comparison clears the number.
  const lastComparison = comps.length ? comps[comps.length - 1].h : 0;
  const reach = lastComparison / hero;
  let stackPx;
  if (full) {
    stackPx = M.yb - (heroBottom + captionH + 26);
  } else {
    const roof = heroBottom + captionH + 6;
    stackPx = Math.min(M.yb - labelBottom + 8, reach > 0 ? (M.yb - roof) / reach : 1e9);
  }
  const topY = M.yb - stackPx;

  // Everything above this line, right of this edge, belongs to the text.
  const textLeft = full ? -9999 : heroLeft - 14;
  const textRoof = heroBottom + captionH + 2;

  const rhoEnd = stackPx / H;
  const vEnd = hero / rhoEnd;
  const v0 = Math.min((1.8 * H) / M.personPx, vEnd * 0.8);
  const h0 = Math.min(1.05, hero * 0.4);
  const CAM_K = 1.25; // camera distance in frame heights

  // -------------------------------------------------------------- timing
  function monotone(xs, ys, m0, mN) {
    const n = xs.length;
    const dx = [];
    const d = [];
    for (let i = 0; i < n - 1; i++) {
      dx[i] = xs[i + 1] - xs[i];
      d[i] = (ys[i + 1] - ys[i]) / dx[i];
    }
    const m = new Array(n).fill(0);
    m[0] = clamp(m0 ?? d[0], 0, 3 * d[0]);
    m[n - 1] = clamp(mN ?? d[n - 2], 0, 3 * d[n - 2]);
    for (let i = 1; i < n - 1; i++) {
      if (d[i - 1] * d[i] <= 0) continue;
      const w1 = 2 * dx[i] + dx[i - 1];
      const w2 = dx[i] + 2 * dx[i - 1];
      m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
    }
    return (x) => {
      if (x <= xs[0]) return ys[0];
      if (x >= xs[n - 1]) return ys[n - 1];
      let i = 0;
      while (i < n - 2 && x > xs[i + 1]) i++;
      const h = dx[i];
      const u = (x - xs[i]) / h;
      const u2 = u * u;
      const u3 = u2 * u;
      return (2 * u3 - 3 * u2 + 1) * ys[i] + (u3 - 2 * u2 + u) * h * m[i] +
        (-2 * u3 + 3 * u2) * ys[i + 1] + (u3 - u2) * h * m[i + 1];
    };
  }

  // Beats get closer together, so the pull-back feels like it is accelerating.
  const finalStretch = comps.length
    ? clamp(0.56 + 0.32 * Math.log10(hero / lastComparison), 0.56, 1.05)
    : 1;
  (function placeBeats() {
    const first = 0.64;
    const last = K - finalStretch;
    const n = comps.length;
    if (n === 1) comps[0].beat = Math.min(first, last);
    if (n < 2) return;
    const ratio = 0.86;
    let total = 0;
    for (let i = 0; i < n - 1; i++) total += Math.pow(ratio, i);
    let at = first;
    comps.forEach((c, i) => {
      c.beat = at;
      at += ((last - first) * Math.pow(ratio, i)) / total;
    });
  })();

  const heightT = [0];
  const heightY = [Math.log(h0)];
  const viewT = [0];
  const viewY = [Math.log(v0)];
  comps.forEach((c, i) => {
    heightT.push(c.beat);
    heightY.push(Math.log(c.h));
    const rho = lerp(0.3, rhoEnd * 0.86, comps.length > 1 ? i / (comps.length - 1) : 1);
    const v = Math.min(c.h / rho, vEnd * 0.95);
    viewT.push(c.beat);
    viewY.push(Math.max(viewY[viewY.length - 1] + 0.02, Math.log(v)));
    c.viewAtBeat = v;
  });
  heightT.push(K);
  heightY.push(Math.log(hero));
  viewT.push(K - 0.05);
  viewY.push(Math.max(viewY[viewY.length - 1] + 0.01, Math.log(vEnd)));

  const logHeight = monotone(heightT, heightY, undefined, Infinity);
  const logView = monotone(viewT, viewY, 0.12, 0);
  const stackFraction = (v) =>
    lerp(M.stackA, M.stackB, smooth(clamp(Math.log(v / v0) / Math.log(400 / v0)))) / H;
  const stackWidth = (v) => stackFraction(v) * v;

  // ------------------------------------------------------------- renderer
  const renderer = new THREE.WebGLRenderer({
    canvas: $("sr-gl"),
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true,
    logarithmicDepthBuffer: true,
  });
  const DPR = 2;
  renderer.setPixelRatio(DPR);
  renderer.setSize(W, H, false);
  renderer.setClearColor(V.skyTop, 1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(V.skyHorizon, 3000, 60000);
  const camera = new THREE.PerspectiveCamera(45, W / H, 0.05, 1e7);

  const sunElevation = THREE.MathUtils.degToRad(15);
  const sunDir = new THREE.Vector3(
    -0.91 * Math.cos(sunElevation),
    Math.sin(sunElevation),
    0.42 * Math.cos(sunElevation),
  ).normalize();

  const hemi = new THREE.HemisphereLight(blend(V.skyTop, "#FFFFFF", 0.62), blend(V.ground, V.skyHorizon, 0.4), 1.75);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(blend(V.skyHorizon, "#FFFFFF", 0.42), 3.1);
  sun.castShadow = true;
  sun.shadow.mapSize.set(M.shadowSize, M.shadowSize);
  sun.shadow.radius = 5;
  sun.shadow.bias = -0.0004;
  scene.add(sun);
  scene.add(sun.target);

  // ------------------------------------------------------------ textures
  function canvas2d(w, h) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return [c, c.getContext("2d")];
  }

  function texture(c, color = true) {
    const t = new THREE.CanvasTexture(c);
    if (color) t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 8;
    return t;
  }

  // A seamless patchwork. Red is light, green is the second ground colour,
  // blue is track. The sky shader tints it, so it reskins with the variables.
  function patchworkTile() {
    const size = 1024;
    const [c, g] = canvas2d(size, size);
    const r = seeded(41);
    const n = 28;
    const cell = size / n;
    const pts = [];
    for (let y = 0; y < n; y++) {
      pts[y] = [];
      for (let x = 0; x < n; x++) {
        pts[y][x] = [(r() - 0.5) * cell * 0.62, (r() - 0.5) * cell * 0.62];
      }
    }
    const p = (x, y) => {
      const o = pts[((y % n) + n) % n][((x % n) + n) % n];
      return [x * cell + o[0], y * cell + o[1]];
    };
    g.fillStyle = "#808000";
    g.fillRect(0, 0, size, size);
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const light = Math.round(70 + r() * 130);
        const field = r() < 0.42 ? Math.round(150 + r() * 105) : Math.round(r() * 60);
        g.fillStyle = `rgb(${light},${field},0)`;
        for (const ox of [-size, 0, size]) {
          for (const oy of [-size, 0, size]) {
            if ((ox && x > 2 && x < n - 3) || (oy && y > 2 && y < n - 3)) continue;
            const a = p(x, y);
            const b = p(x + 1, y);
            const d = p(x + 1, y + 1);
            const e = p(x, y + 1);
            g.beginPath();
            g.moveTo(a[0] + ox, a[1] + oy);
            g.lineTo(b[0] + ox, b[1] + oy);
            g.lineTo(d[0] + ox, d[1] + oy);
            g.lineTo(e[0] + ox, e[1] + oy);
            g.closePath();
            g.fill();
          }
        }
      }
    }
    g.globalCompositeOperation = "lighter";
    g.strokeStyle = "rgb(0,0,255)";
    g.lineWidth = 3;
    for (let i = 0; i < n; i += 5) {
      g.beginPath();
      for (let x = -1; x <= n + 1; x++) {
        const q = p(x, i);
        if (x === -1) g.moveTo(q[0], q[1]);
        else g.lineTo(q[0], q[1]);
      }
      g.stroke();
      g.beginPath();
      for (let y = -1; y <= n + 1; y++) {
        const q = p(i, y);
        if (y === -1) g.moveTo(q[0], q[1]);
        else g.lineTo(q[0], q[1]);
      }
      g.stroke();
    }
    g.globalCompositeOperation = "source-over";
    const t = texture(c, false);
    t.anisotropy = 16;
    return t;
  }

  // Land and cloud cover for the high end of the range. Red is land, green is cloud.
  function planetTile() {
    const size = 1024;
    const data = new Uint8Array(size * size * 4);
    const r = seeded(77);
    const grids = [5, 10, 20, 40, 80, 160, 320].map((n) => {
      const a = new Float32Array(n * n);
      for (let i = 0; i < a.length; i++) a[i] = r();
      return { n, a };
    });
    const r2 = seeded(303);
    const cloudGrids = [7, 14, 28, 56, 112, 224].map((n) => {
      const a = new Float32Array(n * n);
      for (let i = 0; i < a.length; i++) a[i] = r2();
      return { n, a };
    });
    const sample = ({ n, a }, u, v) => {
      const x = u * n;
      const y = v * n;
      const xi = Math.floor(x);
      const yi = Math.floor(y);
      const fx = smooth(x - xi);
      const fy = smooth(y - yi);
      const at = (i, j) => a[((j % n) + n) % n * n + ((i % n) + n) % n];
      return lerp(lerp(at(xi, yi), at(xi + 1, yi), fx), lerp(at(xi, yi + 1), at(xi + 1, yi + 1), fx), fy);
    };
    const fbm = (set, u, v) => {
      let sum = 0;
      let amp = 0.5;
      let norm = 0;
      for (const grid of set) {
        sum += sample(grid, u, v) * amp;
        norm += amp;
        amp *= 0.55;
      }
      return sum / norm;
    };
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const u = x / size;
        const v = y / size;
        const land = fbm(grids, u, v);
        const cloud = fbm(cloudGrids, u, v);
        const i = (y * size + x) * 4;
        data[i] = 255 * clamp((land - 0.47) / 0.05);
        data[i + 1] = 255 * clamp((cloud - 0.56) / 0.05);
        data[i + 2] = 255 * clamp(land);
        data[i + 3] = 255;
      }
    }
    const t = new THREE.DataTexture(data, size, size);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.magFilter = THREE.LinearFilter;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.generateMipmaps = true;
    t.needsUpdate = true;
    return t;
  }

  const paper = V.stackPaper;
  const stackDark = blend(V.stack, V.ink, 0.42);
  const stackLight = blend(V.stack, paper, 0.5);

  function paperLines(g, w, h, seed, strap) {
    const r = seeded(seed);
    g.fillStyle = V.stack;
    g.fillRect(0, 0, w, h);
    const rows = 22;
    for (let i = 0; i < rows; i++) {
      const y = (i / rows) * h;
      const tone = r();
      g.fillStyle = tone > 0.62 ? stackLight : tone > 0.26 ? blend(V.stack, paper, 0.22) : blend(V.stack, V.ink, 0.14);
      g.fillRect(0, y, w, h / rows - 1.2);
    }
    // The gap between bundles.
    g.fillStyle = stackDark;
    g.fillRect(0, 0, w, 7);
    if (strap) {
      const bw = w * 0.34;
      const x = (w - bw) / 2;
      g.fillStyle = paper;
      g.fillRect(x, 0, bw, h);
      g.fillStyle = blend(paper, V.stack, 0.5);
      g.fillRect(x + 7, 0, 5, h);
      g.fillRect(x + bw - 12, 0, 5, h);
      if (V.stackMark) {
        g.fillStyle = stackDark;
        g.font = `700 ${Math.round(h * 0.62)}px 'Barlow Condensed'`;
        g.textAlign = "center";
        g.textBaseline = "middle";
        const px = Math.round(h * 0.62);
        let size = px;
        while (g.measureText(V.stackMark).width > bw - 34 && size > 18) {
          size -= 2;
          g.font = `700 ${size}px 'Barlow Condensed'`;
        }
        g.fillText(V.stackMark, w / 2, h * 0.54);
      }
    }
  }

  function faceTextures() {
    const [a, ga] = canvas2d(640, 150);
    paperLines(ga, 640, 150, 5, true);
    const [b, gb] = canvas2d(280, 150);
    paperLines(gb, 280, 150, 9, false);
    const [c, g] = canvas2d(768, 324);
    g.fillStyle = blend(V.stack, paper, 0.72);
    g.fillRect(0, 0, 768, 324);
    g.strokeStyle = V.stack;
    g.lineWidth = 12;
    g.strokeRect(26, 26, 716, 272);
    g.lineWidth = 4;
    g.strokeRect(44, 44, 680, 236);
    g.fillStyle = blend(V.stack, paper, 0.45);
    g.beginPath();
    g.ellipse(384, 162, 86, 100, 0, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = V.stack;
    g.lineWidth = 6;
    g.stroke();
    if (V.stackMark) {
      g.fillStyle = stackDark;
      g.font = "700 62px 'Barlow Condensed'";
      g.textAlign = "left";
      g.textBaseline = "top";
      g.fillText(V.stackMark, 62, 60);
      g.textAlign = "right";
      g.textBaseline = "bottom";
      g.fillText(V.stackMark, 706, 266);
    }
    return { long: texture(a), end: texture(b), top: texture(c) };
  }

  function facadeTexture(seed, base) {
    const size = 256;
    const [c, g] = canvas2d(size, size);
    const r = seeded(seed);
    g.fillStyle = base;
    g.fillRect(0, 0, size, size);
    const n = 6;
    const cell = size / n;
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const lit = r();
        g.fillStyle = lit > 0.9
          ? "#FFE2A0"
          : blend(blend(V.skyTop, "#FFFFFF", 0.3 + r() * 0.16), V.skyHorizon, r() * 0.14);
        g.fillRect(x * cell + cell * 0.12, y * cell + cell * 0.16, cell * 0.76, cell * 0.68);
      }
    }
    return texture(c);
  }

  const tileTex = patchworkTile();
  const planetTex = planetTile();
  const planetHome = (() => {
    const size = planetTex.image.width;
    const data = planetTex.image.data;
    const land = (x, y) => data[(((y + size) % size) * size + ((x + size) % size)) * 4];
    let best = 0;
    const home = new THREE.Vector2();
    for (let y = 0; y < size; y += 16) {
      for (let x = 0; x < size; x += 16) {
        let score = 0;
        for (let a = 0; a < 12; a++) {
          const angle = (a / 12) * Math.PI * 2;
          for (const r of [0, 30, 60, 90]) {
            score += land(Math.round(x + Math.cos(angle) * r), Math.round(y + Math.sin(angle) * r));
          }
        }
        if (score > best) {
          best = score;
          home.set(x / size, y / size);
        }
      }
    }
    return home;
  })();
  const faces = faceTextures();

  // ------------------------------------------------------------ the world
  // Sky, atmosphere, the ground and the planet are one per-pixel pass, so the
  // range from 2 m to 400 km needs no depth buffer tricks. Rays are built from
  // the same numbers that place the meshes, in units of the frame height.
  const skyUniforms = {
    uRes: { value: new THREE.Vector2(W, H) },
    uDpr: { value: DPR },
    uXs: { value: M.xs },
    uYb: { value: M.yb },
    uCam: { value: new THREE.Vector3() },
    uUp: { value: new THREE.Vector3(0, 1, 0) },
    uA: { value: 0 },
    uRv: { value: 1 },
    uBow: { value: 0 },
    uSkyTop: { value: raw(V.skyTop) },
    uSkyLow: { value: raw(V.skyHorizon) },
    uSpace: { value: raw(V.space) },
    uGround: { value: raw(V.ground) },
    uGroundAlt: { value: raw(V.groundAlt) },
    uTrack: { value: raw(blend(V.groundAlt, V.building, 0.6)) },
    uOcean: { value: raw(blend(V.skyTop, V.space, 0.35)) },
    uCloud: { value: raw("#FFFFFF") },
    uAccent: { value: raw(V.accent) },
    uSunDir: { value: sunDir.clone() },
    uTile: { value: tileTex },
    uPlanet: { value: planetTex },
    uTileK: { value: new THREE.Vector3(1, 1, 1) },
    uTileW: { value: new THREE.Vector2(0, 0) },
    uPlanetK: { value: 1 },
    uHome: { value: planetHome },
    uHazeN: { value: 10 },
    uHazeF: { value: 100 },
    uAir: { value: 1 },
    uDusk: { value: 0 },
    uHigh: { value: 0 },
    uTrackAmt: { value: 0 },
    uHazeAmt: { value: 1 },
    uCloudAmt: { value: 0 },
    uStars: { value: 0 },
    uFlash: { value: 0 },
    uFlashAt: { value: new THREE.Vector2() },
    uFlashR: { value: 1 },
    uTime: { value: 0 },
  };

  const sky = new THREE.Mesh(
    new THREE.BufferGeometry().setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3),
    ),
    new THREE.ShaderMaterial({
      uniforms: skyUniforms,
      depthTest: false,
      depthWrite: false,
      fog: false,
      toneMapped: false,
      vertexShader: `void main(){ gl_Position = vec4(position.xy, 1.0, 1.0); }`,
      fragmentShader: `
        precision highp float;
        uniform vec2 uRes, uFlashAt, uTileW, uHome;
        uniform float uDpr, uXs, uYb, uA, uRv, uBow, uPlanetK, uHazeN, uHazeF;
        uniform float uAir, uDusk, uHigh, uStars, uFlash, uFlashR, uTime, uTrackAmt, uHazeAmt, uCloudAmt;
        uniform vec3 uCam, uUp, uSkyTop, uSkyLow, uSpace, uGround, uGroundAlt;
        uniform vec3 uTrack, uOcean, uCloud, uAccent, uSunDir, uTileK;
        uniform sampler2D uTile, uPlanet;

        float hash(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
        }

        vec3 skyColour(vec3 rd, float above) {
          float e = clamp(above, 0.0, 1.0);
          float warm = smoothstep(0.42, -0.34, rd.x);
          float band = mix(0.30, 0.46, warm) * (1.0 - 0.6 * uDusk);
          float t = pow(clamp(e / band, 0.0, 1.0), 0.72);
          vec3 low = mix(mix(uSkyLow, uSkyTop, 0.28), uSkyLow, 0.55 + 0.45 * warm);
          vec3 mid = mix(mix(uSkyLow, uSkyTop, 0.5), uSkyTop, uDusk);
          vec3 col = t < 0.5 ? mix(low, mid, t * 2.0) : mix(mid, uSkyTop, t * 2.0 - 1.0);
          col = mix(col, mix(uSkyTop, uSpace, 0.45), smoothstep(0.1, 0.9, e) * (0.45 + 0.4 * uDusk));
          // Thin air: the sky gives way to space above a bright thin limb.
          float limb = exp(-e / 0.05);
          vec3 thin = uSpace + (mix(uSkyTop * 1.25, uSkyLow, warm * 0.45)) * limb * 0.95;
          return mix(thin, col, uAir);
        }

        void main() {
          vec2 px = vec2(gl_FragCoord.x, uRes.y * uDpr - gl_FragCoord.y) / uDpr;
          float nx = (px.x - uXs) / (uRes.x * 0.5);
          float py = px.y - uBow * nx * nx;
          vec3 P = vec3((px.x - uXs) / uRes.y, (uYb - py) / uRes.y, 0.0);
          vec3 rd = normalize(P - uCam);

          float y = dot(rd, uUp);
          float rim = (1.0 + uA);
          float disc = rim * rim * y * y - uA * (2.0 + uA);
          float dip = sqrt(uA * (2.0 + uA)) / rim;
          vec3 col;

          if (y < 0.0 && disc > 0.0) {
            float d = uA * (2.0 + uA) / (-rim * y + sqrt(disc));
            float dv = d * uRv;
            vec3 p = uCam + rd * dv;
            vec2 g = p.xz;

            vec4 a = texture2D(uTile, g * uTileK.x);
            vec4 b = texture2D(uTile, g * uTileK.y);
            vec4 c = texture2D(uTile, g * uTileK.z);
            vec4 tile = (a * uTileW.x + b + c * uTileW.y) / (uTileW.x + 1.0 + uTileW.y);
            float light = clamp((tile.r - 0.5) * 3.2 + 0.5, 0.0, 1.0);
            float field = smoothstep(0.26, 0.5, tile.g);
            col = mix(uGround, uGroundAlt, field * 0.5);
            col *= 0.68 + 0.4 * light;
            col = mix(col, uTrack, clamp(tile.b * 1.5, 0.0, 1.0) * uTrackAmt);

            // Low sun: warm on the side facing it, cool away from it.
            float side = smoothstep(-40.0, 40.0, g.x);
            col *= mix(vec3(1.10, 1.02, 0.86), vec3(0.92, 0.94, 1.0), side);

            if (uHigh > 0.0) {
              vec2 uv = uHome + g * uPlanetK;
              vec4 pl = texture2D(uPlanet, uv);
              vec4 pc = texture2D(uPlanet, uv * 1.7 + vec2(uTime * 0.0016, 0.37));
              vec3 land = mix(uGround, uGroundAlt, 0.55 * smoothstep(0.5, 0.66, pl.b)) * (0.8 + 0.42 * light);
              vec3 world = mix(uOcean, land, pl.r);
              float cloudy = pc.g * 0.9 * uCloudAmt;
              world = mix(world, uCloud, cloudy * smoothstep(0.0, 0.1, -y - dip));
              vec3 n = normalize(vec3(p.x / uRv, 1.0 + p.y / uRv, p.z / uRv));
              float day = smoothstep(-0.14, 0.34, dot(n, uSunDir));
              world *= mix(0.22, 1.05, day);
              col = mix(col, world, uHigh);
            }

            float haze = clamp((dv - uHazeN) / (uHazeF - uHazeN), 0.0, 1.0);
            haze = 1.0 - (1.0 - haze) * (1.0 - haze);
            vec3 air = skyColour(rd, 0.0);
            col = mix(col, air, haze * uHazeAmt);
            float edge = exp(-max(-y - dip, 0.0) / 0.035);
            col = mix(col, air, edge * mix(0.8, 0.62, uHigh));
          } else {
            float above = max(y + dip, 0.0);
            col = skyColour(rd, above);
            if (uStars > 0.001) {
              vec2 sp = gl_FragCoord.xy / uDpr / 30.0;
              vec2 id = floor(sp);
              vec2 f = fract(sp) - 0.5;
              float h = hash(id);
              vec2 o = (vec2(hash(id + 7.1), hash(id + 3.7)) - 0.5) * 0.72;
              float d = length(f - o);
              float tw = 0.72 + 0.28 * sin(uTime * (1.2 + h * 3.0) + h * 40.0);
              float star = smoothstep(0.10 * (0.45 + h), 0.0, d) * step(0.56, h) * tw;
              col += vec3(0.95, 0.97, 1.0) * star * uStars;
            }
          }

          if (uFlash > 0.001) {
            float r = length(px - uFlashAt) / uFlashR;
            col += uAccent * uFlash * exp(-r * r);
          }

          gl_FragColor = vec4(col, 1.0);
        }
      `,
    }),
  );
  sky.frustumCulled = false;
  sky.renderOrder = -1000;
  scene.add(sky);

  // Catches the long shadows on the painted ground.
  const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.ShadowMaterial({ color: blend(V.ink, V.skyTop, 0.3), opacity: 0.5, fog: false }),
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.receiveShadow = true;
  scene.add(shadowPlane);

  const matte = (color, extra = {}) =>
    new THREE.MeshStandardMaterial({ color, roughness: 0.92, metalness: 0, flatShading: true, ...extra });

  const glowing = (color) => new THREE.MeshBasicMaterial({ color, toneMapped: false });

  function piece(group, geometry, material, x = 0, y = 0, z = 0, shadow = true) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = shadow;
    mesh.receiveShadow = shadow;
    group.add(mesh);
    return mesh;
  }

  const boxUV = (geometry, u, v) => {
    const uv = geometry.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * u, uv.getY(i) * v);
    return geometry;
  };

  // ------------------------------------------------------ comparison props
  function buildPerson() {
    const root = new THREE.Group();
    const skin = matte("#E8B48D");
    const top = matte(V.person);
    const legs = matte(blend(V.ink, V.skyTop, 0.3));
    const hair = matte(blend(V.ink, "#3A2418", 0.7));
    const shoe = matte(blend(V.ink, "#8A6A4F", 0.6));

    const leg = (x) => {
      const g = new THREE.Group();
      g.position.set(x, 0.92, 0);
      root.add(g);
      piece(g, new THREE.CylinderGeometry(0.098, 0.075, 0.47, 7), legs, 0, -0.235, 0);
      piece(g, new THREE.CylinderGeometry(0.075, 0.056, 0.43, 7), legs, 0, -0.665, 0);
      const foot = piece(g, new THREE.BoxGeometry(0.105, 0.075, 0.25), shoe, 0, -0.883, 0.045);
      foot.rotation.x = 0.02;
      return g;
    };
    const legL = leg(-0.105);
    const legR = leg(0.105);
    legL.rotation.z = -0.03;
    legR.rotation.z = 0.03;

    const body = new THREE.Group();
    body.position.y = 0.9;
    root.add(body);
    const torso = piece(body, new THREE.CylinderGeometry(0.205, 0.158, 0.6, 8), top, 0, 0.3, 0);
    torso.scale.z = 0.66;
    const waist = piece(body, new THREE.CylinderGeometry(0.16, 0.17, 0.09, 8), legs, 0, -0.01, 0);
    waist.scale.z = 0.68;
    piece(body, new THREE.CylinderGeometry(0.05, 0.058, 0.09, 6), skin, 0, 0.64, 0);

    const headPivot = new THREE.Group();
    headPivot.position.y = 0.68;
    body.add(headPivot);
    const head = piece(headPivot, new THREE.IcosahedronGeometry(0.108, 1), skin, 0, 0.095, 0.01);
    head.scale.set(0.92, 1.08, 1);
    const hairCap = piece(headPivot, new THREE.IcosahedronGeometry(0.114, 1), hair, 0, 0.125, -0.022);
    hairCap.scale.set(0.97, 0.86, 1.02);
    const nose = piece(headPivot, new THREE.ConeGeometry(0.018, 0.045, 5), skin, 0, 0.078, 0.118);
    nose.rotation.x = Math.PI / 2;
    const eye = new THREE.MeshBasicMaterial({ color: V.ink });
    piece(headPivot, new THREE.IcosahedronGeometry(0.0115, 0), eye, -0.04, 0.108, 0.1, false);
    piece(headPivot, new THREE.IcosahedronGeometry(0.0115, 0), eye, 0.04, 0.108, 0.1, false);

    const arm = (x) => {
      const g = new THREE.Group();
      g.position.set(x, 0.56, 0);
      body.add(g);
      piece(g, new THREE.CylinderGeometry(0.062, 0.052, 0.3, 6), top, 0, -0.15, 0);
      const fore = new THREE.Group();
      fore.position.y = -0.3;
      g.add(fore);
      piece(fore, new THREE.CylinderGeometry(0.05, 0.04, 0.26, 6), skin, 0, -0.13, 0);
      piece(fore, new THREE.IcosahedronGeometry(0.05, 0), skin, 0, -0.29, 0);
      return { g, fore };
    };
    const armL = arm(-0.235);
    const armR = arm(0.235);
    armL.g.rotation.z = -0.1;
    armR.g.rotation.z = 0.1;
    armL.fore.rotation.x = -0.2;
    armR.fore.rotation.x = -0.2;

    // Facing the stack, turned a little towards the camera.
    root.rotation.y = -0.98;
    root.userData = { headPivot, body, armL, armR };
    return { group: root, width: 0.62 };
  }

  function buildBus() {
    const root = new THREE.Group();
    const inner = new THREE.Group();
    root.add(inner);
    inner.rotation.y = -1.16;
    const shell = matte(blend(V.person, V.accent, 0.3));
    const glass = matte(blend(V.skyTop, V.ink, 0.5));
    piece(inner, new THREE.BoxGeometry(2.5, 2.55, 11), shell, 0, 1.73, 0);
    piece(inner, new THREE.BoxGeometry(2.54, 0.9, 10.4), glass, 0, 2.1, 0);
    piece(inner, new THREE.BoxGeometry(2.2, 1.2, 0.06), glass, 0, 1.95, 5.52);
    const wheel = matte(V.ink);
    [[-1.26, 3.6], [1.26, 3.6], [-1.26, -3.4], [1.26, -3.4]].forEach(([x, z]) => {
      const w = piece(inner, new THREE.CylinderGeometry(0.5, 0.5, 0.3, 10), wheel, x, 0.5, z);
      w.rotation.z = Math.PI / 2;
    });
    return { group: root, width: 6.2 };
  }

  function buildHouse() {
    const root = new THREE.Group();
    const inner = new THREE.Group();
    root.add(inner);
    inner.rotation.y = -0.5;
    const wall = matte(V.building);
    const roof = matte(blend(V.person, V.ink, 0.28));
    const trim = matte(blend(V.building, "#FFFFFF", 0.5));
    const w = 8;
    const d = 6.6;
    const wallH = 5.5;
    piece(inner, new THREE.BoxGeometry(w, wallH, d), wall, 0, wallH / 2, 0);
    const shape = new THREE.Shape();
    shape.moveTo(-w / 2 - 0.45, 0);
    shape.lineTo(w / 2 + 0.45, 0);
    shape.lineTo(0, 9 - wallH);
    shape.closePath();
    const gable = new THREE.ExtrudeGeometry(shape, { depth: d + 0.8, bevelEnabled: false });
    gable.translate(0, wallH, -(d + 0.8) / 2);
    piece(inner, gable, roof);
    piece(inner, new THREE.BoxGeometry(0.9, 2.6, 0.9), wall, 2.3, 7.1, -1);
    const pane = glowing("#FFDC93");
    [[-2.4, 3.9], [2.4, 3.9], [-2.4, 1.6], [0, 3.9]].forEach(([x, y]) => {
      piece(inner, new THREE.BoxGeometry(1.15, 1.25, 0.06), trim, x, y, d / 2 + 0.01, false);
      piece(inner, new THREE.BoxGeometry(0.95, 1.05, 0.08), pane, x, y, d / 2 + 0.02, false);
    });
    piece(inner, new THREE.BoxGeometry(1.1, 2.3, 0.08), matte(V.stack), 2.1, 1.15, d / 2 + 0.02, false);
    [[-1.3], [1.3]].forEach(([z]) => {
      piece(inner, new THREE.BoxGeometry(0.08, 1.15, 1.15), trim, w / 2 + 0.01, 3.9, z, false);
      piece(inner, new THREE.BoxGeometry(0.1, 0.95, 0.95), pane, w / 2 + 0.02, 3.9, z, false);
    });
    return { group: root, width: 9.6 };
  }

  function buildTree() {
    const root = new THREE.Group();
    const r = seeded(19);
    const green = matte(blend(V.ground, "#1E5A3C", 0.62));
    const green2 = matte(blend(V.ground, "#2C7349", 0.45));
    piece(root, new THREE.CylinderGeometry(0.6, 1.0, 9, 7), matte("#6B4A32"), 0, 4.5, 0);
    const tiers = [[6.4, 10, 11], [5.4, 10, 16], [4.2, 9.5, 21], [2.8, 8, 26]];
    tiers.forEach(([rad, h, y], i) => {
      const cone = new THREE.ConeGeometry(rad, h, 9, 1);
      const m = piece(root, cone, i % 2 ? green2 : green, 0, y, 0);
      m.rotation.y = r() * 3;
    });
    return { group: root, width: 12.4 };
  }

  function buildTower() {
    const root = new THREE.Group();
    const inner = new THREE.Group();
    root.add(inner);
    inner.rotation.y = -0.6;
    const tex = facadeTexture(11, blend(V.building, "#FFFFFF", 0.3));
    const face = matte("#FFFFFF", { map: tex });
    const cap = matte(blend(V.building, "#FFFFFF", 0.5));
    const tier = (w, h, y) => {
      const g = boxUV(new THREE.BoxGeometry(w, h, w), Math.max(1, Math.round(w / 21)), Math.max(1, Math.round(h / 21)));
      piece(inner, g, face, 0, y + h / 2, 0);
      piece(inner, new THREE.BoxGeometry(w + 0.8, 0.8, w + 0.8), cap, 0, y + h - 0.4, 0);
    };
    tier(30, 104, 0);
    tier(23, 30, 104);
    tier(15, 16, 134);
    return { group: root, width: 42 };
  }

  function buildTallest() {
    const root = new THREE.Group();
    const tex = facadeTexture(23, blend(V.building, "#FFFFFF", 0.42));
    const face = matte("#FFFFFF", { map: tex });
    const cap = matte(blend(V.building, "#FFFFFF", 0.55));
    const tiers = [
      [64, 150], [50, 150], [38, 130], [27, 110], [17, 90], [9, 70],
    ];
    let y = 0;
    tiers.forEach(([r, h], i) => {
      const g = boxUV(new THREE.CylinderGeometry(r * 0.9, r, h, 6, 1), 6, Math.max(1, Math.round(h / 42)));
      const m = piece(root, g, face, 0, y + h / 2, 0);
      m.rotation.y = i * 0.5 + 0.2;
      const lip = piece(root, new THREE.CylinderGeometry(r * 0.93, r * 0.93, 3, 6), cap, 0, y + h - 1.5, 0);
      lip.rotation.y = i * 0.5 + 0.2;
      y += h;
    });
    piece(root, new THREE.CylinderGeometry(0.5, 4.5, 828 - y, 6), cap, 0, y + (828 - y) / 2, 0);
    const beacon = piece(root, new THREE.IcosahedronGeometry(3.5, 1), glowing("#FF4A3A"), 0, 827, 0, false);
    root.userData = { beacon };
    return { group: root, width: 130 };
  }

  function buildMountain(height, seed) {
    const root = new THREE.Group();
    const r = seeded(seed);
    const radius = height * 0.56;
    const cone = new THREE.ConeGeometry(radius, height, 11, 6, true).toNonIndexed();
    const pos = cone.attributes.position;
    const jitter = new Map();
    const key = (x, y, z) => [x, y, z].map((n) => n.toFixed(2)).join();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      if (y >= height / 2 - 1) continue;
      const k = key(x, y, z);
      if (!jitter.has(k)) jitter.set(k, [(r() - 0.5) * radius * 0.17, (r() - 0.5) * height * 0.05, (r() - 0.5) * radius * 0.17]);
      const j = y <= -height / 2 + 1 ? [0, 0, 0] : jitter.get(k);
      pos.setXYZ(i, x + j[0], y + j[1], z + j[2]);
    }
    cone.translate(0, height / 2, 0);
    const rock = new THREE.Color(blend(V.building, V.ink, 0.55));
    const rock2 = new THREE.Color(blend(V.ground, V.building, 0.3));
    const snow = new THREE.Color(blend(paper, "#FFFFFF", 0.7));
    const colors = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i += 3) {
      const y = (pos.getY(i) + pos.getY(i + 1) + pos.getY(i + 2)) / 3 / height;
      const c = y > 0.56 + r() * 0.1 ? snow : y < 0.22 ? rock2 : rock;
      for (let j = 0; j < 3; j++) colors.set([c.r, c.g, c.b], (i + j) * 3);
    }
    cone.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    cone.computeVertexNormals();
    const m = piece(root, cone, matte("#FFFFFF", { vertexColors: true, side: THREE.DoubleSide }));
    m.rotation.y = 0.4;
    return { group: root, width: radius * 1.5 };
  }

  function buildJet() {
    const root = new THREE.Group();
    const inner = new THREE.Group();
    root.add(inner);
    inner.rotation.y = -0.34;
    inner.rotation.z = 0.05;
    const white = matte("#FFFFFF", { emissive: "#FFFFFF", emissiveIntensity: 0.34 });
    const tint = matte(V.person);
    const body = piece(inner, new THREE.CylinderGeometry(0.052, 0.052, 0.72, 10), white, 0, 0, 0, false);
    body.rotation.z = Math.PI / 2;
    const nose = piece(inner, new THREE.ConeGeometry(0.052, 0.13, 10), white, 0.425, 0, 0, false);
    nose.rotation.z = -Math.PI / 2;
    const tail = piece(inner, new THREE.ConeGeometry(0.052, 0.2, 10), white, -0.46, 0.012, 0, false);
    tail.rotation.z = Math.PI / 2;
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0.1, 0);
    wingShape.lineTo(-0.12, 0.52);
    wingShape.lineTo(-0.2, 0.52);
    wingShape.lineTo(-0.1, 0);
    wingShape.closePath();
    const wing = new THREE.ExtrudeGeometry(wingShape, { depth: 0.012, bevelEnabled: false });
    const w1 = piece(inner, wing, white, 0.04, -0.018, 0, false);
    w1.rotation.x = Math.PI / 2;
    const w2 = piece(inner, wing, white, 0.04, -0.03, 0, false);
    w2.rotation.x = -Math.PI / 2;
    const fin = new THREE.Shape();
    fin.moveTo(-0.02, 0);
    fin.lineTo(-0.11, 0.17);
    fin.lineTo(-0.16, 0.17);
    fin.lineTo(-0.13, 0);
    fin.closePath();
    piece(inner, new THREE.ExtrudeGeometry(fin, { depth: 0.01, bevelEnabled: false }), tint, -0.34, 0.04, -0.005, false);
    const trail = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.01, 0.9, 8),
      new THREE.MeshBasicMaterial({ color: "#FFFFFF", transparent: true, opacity: 0.5, depthWrite: false, fog: false }),
    );
    trail.rotation.z = Math.PI / 2;
    trail.position.set(-0.95, 0, 0);
    inner.add(trail);
    return { group: root, width: 0, air: true };
  }

  function buildBalloon() {
    const root = new THREE.Group();
    const skin = matte("#FFFFFF", { emissive: "#FFFFFF", emissiveIntensity: 0.3 });
    const b = piece(root, new THREE.IcosahedronGeometry(0.24, 2), skin, 0, 0.12, 0, false);
    b.scale.y = 1.12;
    piece(root, new THREE.CylinderGeometry(0.004, 0.004, 0.4, 4), matte(V.text), 0, -0.3, 0, false);
    piece(root, new THREE.BoxGeometry(0.07, 0.06, 0.07), matte(V.accent), 0, -0.52, 0, false);
    return { group: root, width: 0, air: true };
  }

  function buildStation() {
    const root = new THREE.Group();
    const inner = new THREE.Group();
    root.add(inner);
    inner.rotation.set(0.3, 0.5, 0.15);
    const metal = matte("#E7E4DC");
    const panel = matte(blend(V.skyTop, V.accent, 0.42), { metalness: 0.2, roughness: 0.5 });
    const truss = piece(inner, new THREE.BoxGeometry(1.5, 0.05, 0.05), metal, 0, 0, 0, false);
    truss.castShadow = false;
    const m1 = piece(inner, new THREE.CylinderGeometry(0.075, 0.075, 0.46, 8), metal, 0, 0, 0, false);
    m1.rotation.x = Math.PI / 2;
    const m2 = piece(inner, new THREE.CylinderGeometry(0.06, 0.06, 0.34, 8), metal, 0.16, 0, 0.05, false);
    m2.rotation.x = Math.PI / 2;
    [[-0.68, 0.34], [-0.68, -0.34], [0.68, 0.34], [0.68, -0.34], [-0.42, 0.34], [-0.42, -0.34], [0.42, 0.34], [0.42, -0.34]]
      .forEach(([x, z]) => piece(inner, new THREE.BoxGeometry(0.17, 0.008, 0.56), panel, x, 0, z, false));
    return { group: root, width: 0, air: true };
  }

  const BUILD = {
    person: buildPerson,
    bus: buildBus,
    house: buildHouse,
    tree: buildTree,
    tower: buildTower,
    tallest: buildTallest,
    alps: () => buildMountain(4806, 61),
    everest: () => buildMountain(8849, 62),
    jet: buildJet,
    balloon: buildBalloon,
    station: buildStation,
    space: () => ({ group: new THREE.Group(), width: 0, line: true }),
  };

  // Everything stands in the plane of the stack, so its height on screen is
  // directly comparable with the stack's. Each sits clear of the one before.
  let cursor = 0.34;
  comps.forEach((c, i) => {
    Object.assign(c, BUILD[c.id]());
    scene.add(c.group);
    c.group.visible = false;
    if (!c.air && !c.line) {
      c.x0 = cursor + c.width / 2;
      const frameRight = ((W - M.xs) / H) * c.viewAtBeat;
      const next = comps[i + 1];
      cursor = Math.max(
        cursor + c.width + Math.max(0.2, c.h * 0.075),
        next ? frameRight * 1.04 : 0,
      );
    }
  });

  const personComp = comps.find((c) => c.id === "person");

  // ------------------------------------------------------------- scenery
  function instanced(geometry, material, list, shadow = true) {
    const mesh = new THREE.InstancedMesh(geometry, material, list.length);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const color = new THREE.Color();
    list.forEach((it, i) => {
      e.set(it.rx || 0, it.ry || 0, it.rz || 0);
      q.setFromEuler(e);
      m.compose(
        new THREE.Vector3(it.x, it.y, it.z),
        q,
        new THREE.Vector3(it.sx, it.sy ?? it.sx, it.sz ?? it.sx),
      );
      mesh.setMatrixAt(i, m);
      if (it.color) mesh.setColorAt(i, color.set(it.color));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.frustumCulled = false;
    mesh.castShadow = shadow;
    mesh.receiveShadow = shadow;
    return mesh;
  }

  const unitBox = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
  const unitBlob = new THREE.IcosahedronGeometry(1, 1);
  const unitPrism = (() => {
    const s = new THREE.Shape();
    s.moveTo(-0.56, 0);
    s.lineTo(0.56, 0);
    s.lineTo(0, 1);
    s.closePath();
    return new THREE.ExtrudeGeometry(s, { depth: 1.1, bevelEnabled: false }).translate(0, 0, -0.55);
  })();

  const greens = [blend(V.ground, "#2F7D49", 0.55), blend(V.ground, "#3F9356", 0.5), blend(V.ground, "#256B40", 0.6)];
  const walls = [V.building, blend(V.building, "#FFFFFF", 0.4), blend(V.building, V.skyHorizon, 0.3), blend(V.building, V.ink, 0.12)];
  const roofs = [blend(V.person, V.ink, 0.35), blend(V.building, V.ink, 0.55), blend(V.person, V.building, 0.5)];

  // Close: a path, grass tufts, young trees and a garden wall.
  const near = new THREE.Group();
  scene.add(near);
  (function buildNear() {
    const r = seeded(201);
    const path = new THREE.Mesh(
      new THREE.PlaneGeometry(320, 2.6),
      matte(blend(V.groundAlt, V.building, 0.72)),
    );
    path.rotation.x = -Math.PI / 2;
    path.position.set(40, 0.004, 0.1);
    near.add(path);
    const kerb = new THREE.Mesh(new THREE.PlaneGeometry(320, 0.12), matte(blend(V.building, "#FFFFFF", 0.5)));
    kerb.rotation.x = -Math.PI / 2;
    kerb.position.set(40, 0.006, 1.42);
    near.add(kerb);
    const kerb2 = kerb.clone();
    kerb2.position.z = -1.22;
    near.add(kerb2);

    const tufts = [];
    for (let i = 0; i < 900; i++) {
      const z = r() < 0.34 ? 1.56 + r() * 2.2 : -1.34 - r() * 11;
      tufts.push({
        x: -12 + r() * 26, y: 0, z,
        sx: 0.08 + r() * 0.1, sy: 0.05 + r() * 0.1,
        ry: r() * 6, color: greens[Math.floor(r() * 3)],
      });
    }
    const tuft = new THREE.BufferGeometry();
    tuft.setAttribute("position", new THREE.BufferAttribute(new Float32Array([
      -0.5, 0, 0.1, -0.1, 0, -0.1, -0.62, 1, 0.3,
      -0.16, 0, 0.1, 0.18, 0, -0.1, 0.02, 1.34, -0.1,
      0.1, 0, 0.1, 0.5, 0, -0.1, 0.66, 0.92, 0.2,
    ]), 3));
    tuft.computeVertexNormals();
    near.add(instanced(tuft, matte("#FFFFFF", { side: THREE.DoubleSide }), tufts, false));

    const hedges = [];
    for (let x = -30; x < 46; x += 2.2) {
      if (r() < 0.22) continue;
      hedges.push({ x: x + r() * 0.3, y: 0, z: -15 - r() * 0.3, sx: 1.9, sy: 0.55 + r() * 0.3, sz: 0.9, color: greens[Math.floor(r() * 3)] });
    }
    near.add(instanced(unitBox, matte("#FFFFFF"), hedges));

    const young = [];
    [-19, -9, 6.5, 14, 23, 31].forEach((x, i) => {
      young.push({ x, z: -26 - (i % 3) * 5 });
    });
    near.add(instanced(unitBox, matte("#6B4A32"), young.map((t) => ({ x: t.x, y: 0, z: t.z, sx: 0.2, sy: 1.8 }))));
    near.add(instanced(unitBlob, matte("#FFFFFF"), young.map((t, i) => ({
      x: t.x, y: 3.2, z: t.z, sx: 1.5 + (i % 3) * 0.3, sy: 1.9, sz: 1.5, color: greens[i % 3],
    }))));
  })();

  // A town behind the plane of the comparisons.
  const town = new THREE.Group();
  scene.add(town);
  (function buildTown() {
    const r = seeded(305);
    const bodies = [];
    const roofsList = [];
    const treeTrunks = [];
    const crowns = [];
    for (let x = -700; x <= 1500; x += 26) {
      for (let z = -56; z >= -1300; z -= 34) {
        const pick = r();
        const jx = (r() - 0.5) * 10;
        const jz = (r() - 0.5) * 10;
        if (x > -40 && x < 26 && z > -150) continue;
        if (pick < 0.5) {
          const w = 9 + r() * 5;
          const d = 8 + r() * 4;
          const h = 5 + r() * 4;
          const ry = r() < 0.5 ? 0 : Math.PI / 2;
          bodies.push({ x: x + jx, y: 0, z: z + jz, sx: w, sy: h, sz: d, ry, color: walls[Math.floor(r() * 4)] });
          roofsList.push({ x: x + jx, y: h, z: z + jz, sx: w, sy: 3 + r() * 1.4, sz: d, ry, color: roofs[Math.floor(r() * 3)] });
        } else if (pick < 0.9) {
          const s = 6 + r() * 7;
          treeTrunks.push({ x: x + jx, y: 0, z: z + jz, sx: 0.5, sy: s * 0.7 });
          crowns.push({ x: x + jx, y: s * 0.86, z: z + jz, sx: s * 0.3, sy: s * 0.4, sz: s * 0.3, color: greens[Math.floor(r() * 3)] });
        }
      }
    }
    town.add(instanced(unitBox, matte("#FFFFFF"), bodies));
    town.add(instanced(unitPrism, matte("#FFFFFF"), roofsList));
    town.add(instanced(unitBox, matte("#6B4A32"), treeTrunks));
    town.add(instanced(unitBlob, matte("#FFFFFF"), crowns));
  })();

  // A city at the larger scale, thinning out into the far distance.
  const city = new THREE.Group();
  scene.add(city);
  (function buildCity() {
    const r = seeded(409);
    const list = [];
    const facade = facadeTexture(31, blend(V.building, "#FFFFFF", 0.3));
    for (let i = 0; i < 1500; i++) {
      const x = -5200 + r() * 13000;
      const z = -420 - Math.pow(r(), 1.6) * 11000;
      const near2 = Math.exp(-(Math.pow((x - 1400) / 3600, 2) + Math.pow((z + 2800) / 2600, 2)));
      const h = 14 + Math.pow(r(), 2.4) * (60 + 200 * near2);
      const w = 22 + r() * 44;
      list.push({ x, y: 0, z, sx: w, sy: h, sz: w * (0.7 + r() * 0.5), ry: 0, color: walls[Math.floor(r() * 4)] });
    }
    const g = boxUV(unitBox.clone(), 1, 2);
    city.add(instanced(g, matte("#FFFFFF", { map: facade }), list));
  })();

  // In front of the stack the town only exists once the camera has left it
  // behind, so the foreground has rooftops instead of bare ground.
  const front = new THREE.Group();
  const frontLayers = [];
  scene.add(front);
  (function buildFront() {
    const r = seeded(433);
    const body = [];
    const tops = [];
    const crowns = [];
    const park = (x, z) => Math.sin(x * 0.0031 + 1.3) * Math.cos(z * 0.0047 + 0.6) > 0.52;
    for (let gx = -2600; gx < 6400; gx += 78) {
      for (let gz = 170; gz < 3500; gz += 64) {
        const x = gx + (r() - 0.5) * 16;
        const z = gz + (r() - 0.5) * 12;
        if (park(x, z)) {
          for (let k = 0; k < 3; k++) {
            if (r() < 0.25) continue;
            const size = 7 + r() * 8;
            crowns.push({
              x: x + (r() - 0.5) * 60, y: size * 0.8, z: z + (r() - 0.5) * 50,
              sx: size, sy: size * 0.9, sz: size, color: greens[Math.floor(r() * 3)],
            });
          }
          continue;
        }
        if (r() < 0.14) continue;
        const w = 30 + r() * 26;
        const d = 24 + r() * 22;
        const hgt = 9 + Math.pow(r(), 2.2) * 26;
        const ry = r() < 0.5 ? 0 : Math.PI / 2;
        body.push({ x, y: 0, z, sx: w, sy: hgt, sz: d, ry, color: walls[Math.floor(r() * 4)] });
        tops.push({ x, y: hgt, z, sx: w, sy: 7 + r() * 8, sz: d, ry, color: roofs[Math.floor(r() * 3)] });
      }
    }
    [[unitBox, body], [unitPrism, tops], [unitBlob, crowns]].forEach(([geometry, list]) => {
      list.sort((a, b) => a.z - b.z);
      const mesh = instanced(geometry, matte("#FFFFFF"), list);
      front.add(mesh);
      frontLayers.push({ mesh, z: list.map((it) => it.z) });
    });
  })();

  // Two far ridges, for depth on the horizon.
  const ridges = new THREE.Group();
  scene.add(ridges);
  function ridge(seed, z, height, color) {
    const r = seeded(seed);
    const shape = new THREE.Shape();
    const span = Math.abs(z) * 5;
    shape.moveTo(-span, -height);
    const steps = 54;
    for (let i = 0; i <= steps; i++) {
      const u = i / steps;
      const up = 0.32 + r() * 0.68;
      shape.lineTo(-span + 2 * span * u, height * (i % 2 ? up : up * 0.55));
    }
    shape.lineTo(span, -height);
    shape.closePath();
    const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshBasicMaterial({ color, fog: true }));
    mesh.position.z = z;
    ridges.add(mesh);
  }
  ridge(501, -16000, 560, blend(blend(V.ground, V.skyHorizon, 0.5), V.skyTop, 0.22));
  ridge(502, -34000, 1400, blend(V.skyHorizon, V.skyTop, 0.42));

  // ------------------------------------------------------------ the stack
  const stackUniforms = {
    uBundle: { value: BUNDLE },
    uMapAmt: { value: 1 },
    uPxM: { value: 1 },
    uStrapAmt: { value: 1 },
    uMark: { value: 0 },
    uBand: { value: 1 },
    uBandFade: { value: 1 },
    uStackRaw: { value: new THREE.Color(V.stack) },
    uStackDark: { value: new THREE.Color(stackDark) },
    uPaperRaw: { value: new THREE.Color(V.stackPaper) },
    uAccentRaw: { value: new THREE.Color(V.accent) },
    uHeat: { value: 0 },
    uCrown: { value: 0 },
    uFlashAll: { value: 0 },
    uPulseY: { value: -1 },
    uPulseW: { value: 1 },
    uPulseAmt: { value: 0 },
    uTopY: { value: 1 },
  };

  function stackSide(map, strapFace) {
    const m = matte("#FFFFFF", { map });
    m.onBeforeCompile = (s) => {
      Object.assign(s.uniforms, stackUniforms);
      s.uniforms.uStrapFace = { value: strapFace ? 1 : 0 };
      s.vertexShader = s.vertexShader
        .replace("#include <common>", "#include <common>\nvarying float vH;")
        .replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
           vec4 hp = vec4(position, 1.0);
           #ifdef USE_INSTANCING
             hp = instanceMatrix * hp;
           #endif
           vH = (modelMatrix * hp).y;`,
        );
      s.fragmentShader = s.fragmentShader
        .replace(
          "#include <common>",
          `#include <common>
           varying float vH;
           uniform float uBundle, uMapAmt, uPxM, uStrapAmt, uStrapFace, uMark;
           uniform float uBand, uBandFade, uHeat, uCrown, uFlashAll;
           uniform float uPulseY, uPulseW, uPulseAmt, uTopY;
           uniform vec3 uStackRaw, uStackDark, uPaperRaw, uAccentRaw;`,
        )
        .replace(
          "#include <map_fragment>",
          `// Bands at three sizes hand over to each other as the camera pulls
           // back, so bundle lines keep streaming at a readable spacing.
           float f = uBandFade;
           float cellPx = uBand * uPxM;
           float p0 = fract(vH / uBand);
           float p1 = fract(vH / (uBand * 5.0));
           float p2 = fract(vH / (uBand * 25.0));
           float fineOn = smoothstep(9.0, 18.0, cellPx * 0.2);
           float fine = step(0.5, fract(vH / (uBand * 0.2))) * fineOn;
           float tone = 0.05 * fine + 0.055 * (f * step(0.5, p0) + step(0.5, p1) + (1.0 - f) * step(0.5, p2));
           vec3 stackBase = uStackRaw * (1.0 - tone);
           float strapX = abs(vMapUv.x - 0.5);
           float strap = uStrapFace * uStrapAmt * step(strapX, 0.17);
           stackBase = mix(stackBase, uPaperRaw, strap);
           float printed = step(abs(fract(p0 * 3.0) - 0.5), 0.2) * step(abs(p0 - 0.5), 0.3);
           float mark = strap * uMark * step(strapX, 0.1) * printed;
           stackBase = mix(stackBase, uStackRaw, 0.62 * mark);
           float gap = max(f * step(p0, 3.0 / cellPx), step(p1, 3.5 / (cellPx * 5.0)));
           stackBase *= 1.0 - 0.34 * gap;
           float pale = max(f * step(p1, 5.0 / (cellPx * 5.0)), (1.0 - f) * step(p2, 6.0 / (cellPx * 25.0)));
           stackBase = mix(stackBase, uPaperRaw, 0.6 * pale);
           if (uMapAmt > 0.001) {
             vec2 sUv = vec2(vMapUv.x, vH / uBundle);
             stackBase = mix(stackBase, texture2D(map, sUv).rgb, uMapAmt);
           }
           float rel = clamp(vH / uTopY, 0.0, 1.0);
           float crown = uCrown * step(0.5, step(0.905, rel) + step(0.865, rel) * step(rel, 0.885) + step(0.835, rel) * step(rel, 0.845));
           stackBase = mix(stackBase, uAccentRaw, max(uHeat, crown));
           diffuseColor.rgb = stackBase;`,
        )
        .replace(
          "#include <emissivemap_fragment>",
          `#include <emissivemap_fragment>
           float pulse = exp(-pow((vH - uPulseY) / uPulseW, 2.0)) * uPulseAmt;
           totalEmissiveRadiance += uAccentRaw * (pulse * 2.6 + uFlashAll);`,
        );
    };
    return m;
  }

  const sideLong = stackSide(faces.long, true);
  const sideEnd = stackSide(faces.end, false);
  const topFace = matte("#FFFFFF", { map: faces.top });
  topFace.flatShading = false;
  const stackFaces = [sideEnd, sideEnd, topFace, topFace, sideLong, sideLong];
  const stackRotation = -0.6;

  const column = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), stackFaces);
  column.rotation.y = stackRotation;
  column.castShadow = true;
  column.receiveShadow = true;
  column.frustumCulled = false;
  scene.add(column);

  // Close up the stack is real bundles, each a little out of true.
  const BUNDLE_COUNT = 150;
  const bundleOffsets = (() => {
    const r = seeded(811);
    return Array.from({ length: BUNDLE_COUNT }, () => ({
      x: (r() - 0.5) * 0.028,
      z: (r() - 0.5) * 0.05,
      rot: (r() - 0.5) * 0.045,
    }));
  })();
  const bundles = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0),
    stackFaces,
    BUNDLE_COUNT,
  );
  bundles.rotation.y = stackRotation;
  bundles.castShadow = true;
  bundles.receiveShadow = true;
  bundles.frustumCulled = false;
  scene.add(bundles);

  // The ring of light that climbs the stack, and the burst when it arrives.
  const textMask = { value: new THREE.Vector4(textLeft, textRoof, DPR, H * DPR) };
  const additive = (color, opacity = 1) => {
    const m = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
      fog: false,
      toneMapped: false,
    });
    // Light fades out before it reaches the text.
    m.onBeforeCompile = (s) => {
      s.uniforms.uTextMask = textMask;
      s.fragmentShader = s.fragmentShader
        .replace("#include <common>", "#include <common>\nuniform vec4 uTextMask;")
        .replace(
          "#include <alphamap_fragment>",
          `#include <alphamap_fragment>
           vec2 mp = vec2(gl_FragCoord.x, uTextMask.w - gl_FragCoord.y) / uTextMask.z;
           diffuseColor.a *= 1.0 - smoothstep(uTextMask.x - 56.0, uTextMask.x, mp.x) *
             (1.0 - smoothstep(uTextMask.y, uTextMask.y + 56.0, mp.y));`,
        );
    };
    return m;
  };

  const ringGeo = new THREE.RingGeometry(0.72, 1, 96).rotateX(-Math.PI / 2);
  const thinRingGeo = new THREE.RingGeometry(0.965, 1, 128).rotateX(-Math.PI / 2);
  const midRingGeo = new THREE.RingGeometry(0.9, 1, 128).rotateX(-Math.PI / 2);
  const climbRing = new THREE.Mesh(ringGeo, additive(V.accent, 0.9));
  const burstRings = [0, 1, 2].map((i) => {
    const m = new THREE.Mesh(i === 1 ? midRingGeo : thinRingGeo, additive(i === 2 ? V.text : V.accent, 0.9));
    m.visible = false;
    scene.add(m);
    return m;
  });
  climbRing.visible = false;
  scene.add(climbRing);

  // Loose sheets blown off the top at the key moment, drifting through the hold.
  const SHEETS = 110;
  const sheetFans = full
    ? [[-34, 4, 0.72], [176, 214, 1]]
    : [[112, 210, 0.58], [-34, 6, 1]];
  const sheetData = (() => {
    const r = seeded(977);
    return Array.from({ length: SHEETS }, () => {
      const pick = r();
      const fan = sheetFans.find((f) => pick <= f[2]);
      return {
        low: !full && fan === sheetFans[1],
        drop: r(),
        angle: THREE.MathUtils.degToRad(lerp(fan[0], fan[1], r())),
        speed: 0.14 + r() * 0.38,
        fall: 0.04 + r() * 0.1,
        spin: 1.5 + r() * 5,
        spin2: 1 + r() * 4,
        phase: r() * 6.28,
        size: 0.6 + r() * 0.8,
        sway: 0.006 + r() * 0.012,
      };
    });
  })();
  const sheetGeo = new THREE.PlaneGeometry(1, 0.43);
  const sheets = new THREE.InstancedMesh(
    sheetGeo,
    new THREE.MeshStandardMaterial({ color: "#FFFFFF", roughness: 0.8, side: THREE.DoubleSide, flatShading: true }),
    SHEETS,
  );
  (function tintSheets() {
    const r = seeded(13);
    const c = new THREE.Color();
    for (let i = 0; i < SHEETS; i++) {
      sheets.setColorAt(i, c.set(r() < 0.3 ? blend(paper, V.stack, 0.2) : blend(V.stack, paper, 0.25 + r() * 0.3)));
    }
    sheets.instanceColor.needsUpdate = true;
  })();
  sheets.frustumCulled = false;
  sheets.visible = false;
  scene.add(sheets);

  // -------------------------------------------------------------- clouds
  // Real heights: a cumulus layer at 0.8 to 2 km, cirrus at 8 to 10 km.
  const blobMaterial = new THREE.MeshStandardMaterial({
    color: "#FFFFFF", roughness: 1, metalness: 0, flatShading: true, fog: false,
    emissive: blend("#FFFFFF", V.skyHorizon, 0.34), emissiveIntensity: 0.46,
  });

  function cloudBand(seed, clusters, yLo, yHi, xSpan, zLo, zHi, sizeLo, sizeHi, flat, tintAmount) {
    const r = seeded(seed);
    const list = [];
    const tints = [
      "#FFFFFF",
      blend("#FFFFFF", V.skyHorizon, 0.2 * tintAmount),
      blend("#FFFFFF", V.skyTop, 0.14 * tintAmount),
    ];
    for (let i = 0; i < clusters; i++) {
      const cx = -xSpan + r() * xSpan * 2;
      const cz = lerp(zLo, zHi, r());
      const cy = lerp(yLo, yHi, r());
      const size = lerp(sizeLo, sizeHi, r());
      const puffs = 4 + Math.floor(r() * 4);
      const far = clamp(Math.abs(cz) / Math.abs(zLo));
      for (let j = 0; j < puffs; j++) {
        const s = size * (0.42 + r() * 0.58);
        list.push({
          x: cx + (j - puffs / 2) * size * 0.62 + (r() - 0.5) * size * 0.3,
          y: cy + (r() - 0.3) * size * 0.26,
          z: cz + (r() - 0.5) * size * 0.8,
          sx: s * 1.12, sy: s * flat, sz: s,
          ry: r() * 6,
          color: blend(tints[Math.floor(r() * 3)], V.skyHorizon, far * 0.62),
        });
      }
    }
    return instanced(unitBlob, blobMaterial, list, false);
  }

  const cloudsLow = new THREE.Group();
  cloudsLow.add(cloudBand(601, 110, 900, 1950, 60000, -62000, -7500, 300, 820, 0.5, 1));
  scene.add(cloudsLow);

  const cloudsHigh = new THREE.Group();
  cloudsHigh.add(cloudBand(602, 80, 8200, 10200, 120000, -120000, -30000, 1000, 2800, 0.16, 1));
  scene.add(cloudsHigh);

  // When the top of the stack ends up at cloud height, it ends up in the clouds.
  const heroClouds = new THREE.Group();
  let heroCloudList = null;
  let heroCloudMesh = null;
  if (hero > 500 && hero < 7000) {
    const r = seeded(603);
    const list = [];
    const clusters = [
      [0.26, 0.86, -0.34, 0.1], [0.54, 0.92, -0.5, 0.135], [0.7, 0.78, -0.3, 0.105],
      [0.16, 0.99, -0.62, 0.085], [-0.13, 0.9, -0.42, 0.11], [-0.2, 0.74, -0.2, 0.08],
      [0.42, 1.04, -0.75, 0.1],
    ];
    clusters.forEach(([fx, fy, fz, fs]) => {
      const size = fs * vEnd;
      const ceiling = ((M.yb - textRoof - 40) / H) * vEnd - size * 0.5;
      const puffs = 6;
      for (let j = 0; j < puffs; j++) {
        const s = size * (0.45 + r() * 0.55);
        list.push({
          x: fx * vEnd + (j - puffs / 2) * size * 0.56,
          y: Math.min(fy * hero, ceiling) + (r() - 0.3) * size * 0.22,
          z: fz * vEnd + (r() - 0.5) * size * 0.6,
          sx: s * 1.15, sy: s * 0.52, sz: s,
          ry: r() * 6,
          color: j % 2 ? "#FFFFFF" : blend("#FFFFFF", V.skyHorizon, 0.16),
        });
      }
    });
    heroCloudList = list;
    heroCloudMesh = instanced(unitBlob, blobMaterial, list, false);
    heroClouds.add(heroCloudMesh);
    scene.add(heroClouds);
  }

  // ------------------------------------------------------------ overlays
  const svgEl = $("sr-svg");
  svgEl.setAttribute("viewBox", `0 0 ${W} ${H}`);
  const minorEl = $("sr-minor");
  const majorEl = $("sr-major");
  minorEl.setAttribute("stroke", V.text);
  minorEl.setAttribute("stroke-width", full ? 3 : 2.4);
  majorEl.setAttribute("stroke", V.text);
  majorEl.setAttribute("stroke-width", full ? 5 : 4);
  const ticksEl = $("sr-ticks");

  const tagsEl = $("sr-tags");
  const chipsEl = $("sr-chips");
  comps.forEach((c) => {
    const tag = make("div", "sr-tag", tagsEl);
    tag.style.cssText = `
      padding:${M.tagPadY}px ${M.tagPadX}px;
      border-radius:${M.tagRadius}px;
      background:${V.text};
      box-shadow:0 8px 0 ${rgba(V.ink, 0.3)};`;
    const value = make("div", "sr-tag-value", tag, formatHeight(c.h));
    value.style.fontSize = M.tagValue + "px";
    value.style.color = V.ink;
    const words = c.name.split(" ");
    let nameText = c.name;
    if (c.name.length > 15 && words.length > 1) {
      let best = 1;
      let bestGap = Infinity;
      for (let j = 1; j < words.length; j++) {
        const gap = Math.abs(words.slice(0, j).join(" ").length - words.slice(j).join(" ").length);
        if (gap < bestGap) {
          bestGap = gap;
          best = j;
        }
      }
      nameText = words.slice(0, best).join(" ") + "\n" + words.slice(best).join(" ");
    }
    const name = make("div", "sr-tag-name", tag, nameText);
    name.style.whiteSpace = "pre";
    name.style.fontSize = M.tagName + "px";
    name.style.color = blend(V.ink, V.skyTop, 0.42);
    c.tag = tag;
    c.tagW = tag.offsetWidth;
    c.tagH = tag.offsetHeight;

    const chip = make("div", "sr-chip", chipsEl, formatHeight(c.h));
    chip.style.fontSize = M.chip + "px";
    chip.style.color = V.text;
    chip.style.textShadow = `0 2px 0 ${rgba(V.ink, 0.5)}, 0 0 14px ${rgba(V.ink, 0.45)}`;
    c.chip = chip;
    c.chipW = chip.offsetWidth;
    c.chipH = chip.offsetHeight;

    const line = document.createElementNS("http://www.w3.org/2000/svg", c.line ? "path" : "line");
    line.setAttribute("stroke", V.text);
    line.setAttribute("stroke-width", full ? 5 : 4);
    line.setAttribute("stroke-linecap", "round");
    line.setAttribute("fill", "none");
    if (!c.line) line.setAttribute("stroke-dasharray", full ? "4 16" : "3 13");
    ticksEl.appendChild(line);
    c.lineEl = line;
  });

  const counterEl = $("sr-counter");
  counterEl.style.fontSize = M.counter + "px";
  counterEl.style.color = V.text;
  counterEl.style.textShadow = `0 5px 0 ${rgba(V.ink, 0.42)}, 0 0 30px ${rgba(V.ink, 0.3)}`;

  heroEl.style.textShadow = `0 ${full ? 12 : 8}px 0 ${rgba(V.ink, 0.5)}`;

  const flashEl = $("sr-flash");
  flashEl.style.background = V.text;

  // -------------------------------------------------------------- render
  const tmpMatrix = new THREE.Matrix4();
  const tmpQuat = new THREE.Quaternion();
  const tmpEuler = new THREE.Euler();
  const tmpPos = new THREE.Vector3();
  const tmpScale = new THREE.Vector3();

  const logRange = Math.log(vEnd / v0);

  function renderAt(inputTime) {
    const time = Math.max(0, Number(inputTime) || 0);
    const t = designTime(time);
    const arrived = time >= T.key - EPS;
    const hold = Math.max(0, time - T.key);
    const energy = arrived ? Math.exp(-hold * 4.6) : 0;
    const kick = arrived ? Math.exp(-hold * 8.5) * Math.cos(hold * 21) : 0;

    let v = Math.exp(logView(t));
    let h = arrived ? hero : Math.min(hero, Math.exp(logHeight(t)));
    if (arrived) v = vEnd * (1 - 0.028 * kick + 0.013 * (1 - Math.exp(-hold * 0.8)));

    const yb = M.yb + kick * M.shake;
    const pm = H / v;
    const sx = (x) => M.xs + x * pm;
    const sy = (y) => yb - y * pm;
    const w = stackWidth(v);
    const depth = w * 0.42;
    const progress = clamp(Math.log(v / v0) / logRange);

    // Camera. It never pitches, so verticals stay vertical and heights read true.
    const skyLine = lerp(
      M.sky0, M.sky1,
      smooth(clamp(Math.log(v / v0) / Math.log(Math.max(v0 * 8, 90) / v0))),
    );
    const D = CAM_K * v;
    const drift = arrived ? hold * 0.012 : 0;
    const cx = (Math.sin(time * 0.5) * 0.012 + drift) * v;
    const cy = Math.max((M.yb - skyLine) / H * v, (1.3 * D * D) / EARTH);
    const near = Math.max(0.05, 0.02 * v);
    const far = Math.max(3e6, 300 * v);
    camera.position.set(cx, cy, D);
    camera.near = near;
    camera.far = far;
    camera.updateMatrixWorld();
    const n = near / D;
    camera.projectionMatrix.makePerspective(
      (-M.xs / pm - cx) * n, ((W - M.xs) / pm - cx) * n,
      (yb / pm - cy) * n, ((yb - H) / pm - cy) * n,
      near, far, camera.coordinateSystem,
    );
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();

    // Sky uniforms, all relative to the frame height so nothing loses precision.
    const rcY = cy + EARTH;
    const rc = Math.sqrt(cx * cx + rcY * rcY + D * D);
    const altitude = (cx * cx + cy * cy + D * D + 2 * cy * EARTH) / (rc + EARTH);
    const u = skyUniforms;
    u.uCam.value.set(cx / v, cy / v, D / v);
    u.uUp.value.set(cx / rc, rcY / rc, D / rc);
    u.uA.value = altitude / EARTH;
    u.uRv.value = EARTH / v;
    u.uYb.value = yb;
    u.uTime.value = time;

    const bowAmount = smooth(clamp((Math.log10(v) - 2.1) / 3.7));
    const bow = M.bow * bowAmount;
    u.uBow.value = bow;
    const sag = (px) => bow * Math.pow((px - M.xs) / (W * 0.5), 2);

    const zoom = Math.log(v) / Math.log(8);
    const level = Math.floor(zoom);
    const frac = zoom - level;
    const base = Math.pow(8, level + 2) * 0.5;
    u.uTileK.value.set(v / base, (v / base) * 8, (v / base) * 64);
    u.uTileW.value.set(frac, 1 - frac);
    u.uPlanetK.value = v / 1100000;
    u.uTrackAmt.value = smooth(clamp((v - 26) / 180)) *
      (1 - smooth(clamp((Math.log10(v) - 3.8) / 0.6)));

    const hazeLength = Math.max(14000, 7 * v);
    u.uHazeN.value = (hazeLength * 0.16) / v;
    u.uHazeF.value = (hazeLength * 3) / v;
    scene.fog.near = hazeLength * 0.16;
    scene.fog.far = hazeLength * 3;

    const topAltitude = Math.max(h, v * 0.45);
    const air = Math.exp(-topAltitude / 17000);
    u.uAir.value = air;
    const dusk = clamp(progress * 0.62 + Math.log10(Math.max(1, v / 5)) * 0.05);
    u.uDusk.value = arrived ? Math.min(1, dusk + 0.12 * (1 - Math.exp(-hold * 3))) : dusk;
    u.uHigh.value = smooth(clamp((Math.log10(v) - 4.72) / 0.3));
    u.uHazeAmt.value = 1 - smooth(clamp((Math.log10(v) - 3.9) / 0.6));
    u.uCloudAmt.value = smooth(clamp((Math.log10(v) - 5.45) / 0.35));
    u.uStars.value = smooth(clamp((0.32 - air) / 0.3));

    // The shadow box follows the frame, so shadows hold up at every scale.
    const sunSize = 3.4 * v;
    tmpPos.set(sunDir.x, sunDir.y, sunDir.z).multiplyScalar(sunSize * 1.4);
    sun.target.position.set(0.5 * v, 0, -0.5 * v);
    sun.position.copy(sun.target.position).add(tmpPos);
    Object.assign(sun.shadow.camera, {
      left: -sunSize * 0.5, right: sunSize * 0.5,
      top: sunSize * 0.42, bottom: -sunSize * 0.42,
      near: sunSize * 0.1, far: sunSize * 3,
    });
    sun.shadow.camera.updateProjectionMatrix();
    sun.shadow.normalBias = 0.0012 * v;

    shadowPlane.scale.set(v * 60, v * 60, 1);
    shadowPlane.position.set(0, Math.max(0.008, 0.0004 * v), -v * 8);
    shadowPlane.visible = v < 90000;
    shadowPlane.material.opacity = 0.52 * (1 - smooth(clamp((Math.log10(v) - 3.6) / 1.2)));

    showLayers(v);

    // Stack.
    column.scale.set(w, h, depth);
    bundles.visible = v < 15;
    if (bundles.visible) {
      const count = Math.min(BUNDLE_COUNT, Math.ceil(h / BUNDLE));
      const loose = 1 - smooth(clamp((v - 6) / 8));
      bundles.count = count;
      for (let i = 0; i < count; i++) {
        const off = bundleOffsets[i];
        const y = i * BUNDLE;
        const top = Math.min(h - y, BUNDLE);
        tmpEuler.set(0, off.rot * loose, 0);
        tmpQuat.setFromEuler(tmpEuler);
        tmpPos.set(off.x * w * loose, y, off.z * depth * loose);
        tmpScale.set(w, Math.max(top, 0.001), depth);
        tmpMatrix.compose(tmpPos, tmpQuat, tmpScale);
        bundles.setMatrixAt(i, tmpMatrix);
      }
      bundles.instanceMatrix.needsUpdate = true;
    }

    const su = stackUniforms;
    su.uMapAmt.value = 1 - smooth(clamp((v - 10) / 26));
    su.uPxM.value = pm;
    su.uStrapAmt.value = 1 - smooth(clamp(Math.log(v / 260) / Math.log(1500 / 260)));
    const bandExp = Math.log((30 / pm) / BUNDLE) / Math.log(5);
    const bandStep = Math.ceil(bandExp);
    su.uBand.value = BUNDLE * Math.pow(5, bandStep);
    su.uBandFade.value = smooth(clamp((bandStep - bandExp) / 0.5));
    su.uMark.value = V.stackMark ? Math.pow(Math.sin(Math.PI * clamp(bandStep - bandExp)), 0.6) : 0;

    const climbing = !arrived && t >= K - 0.46;
    const climbQ = seg(t, K - 0.46, 0.46);
    const glintPhase = arrived ? ((hold + 0.45) / 1.15) % 1 : 0;
    const glintOn = arrived && hold > 0.4;
    su.uHeat.value = arrived ? Math.exp(-hold * 9) * 0.86 : 0;
    su.uCrown.value = arrived ? 0.86 : climbing ? 0.86 * climbQ * climbQ : 0;
    su.uTopY.value = h;
    su.uFlashAll.value = arrived ? Math.exp(-hold * 9) * 0.5 : 0;
    su.uPulseW.value = (climbing ? 0.045 * h : 0.012 * h) + 0.012 * v;
    if (climbing) {
      su.uPulseY.value = h * climbQ * climbQ;
      su.uPulseAmt.value = 1;
    } else if (glintOn) {
      su.uPulseY.value = hero * smooth(glintPhase);
      su.uPulseAmt.value = 0.3 * Math.sin(glintPhase * Math.PI);
    } else {
      su.uPulseAmt.value = 0;
    }

    climbRing.visible = climbing;
    if (climbing) {
      const y = h * climbQ * climbQ;
      const r = w * (0.95 + 0.4 * climbQ);
      climbRing.position.set(0, y, 0);
      climbRing.scale.set(r, 1, r);
      climbRing.material.opacity = 0.9;
    }

    burstRings.forEach((ring, i) => {
      const age = hold - i * 0.05;
      ring.visible = arrived && age >= -EPS && age < 0.72;
      if (!ring.visible) return;
      const p = out(clamp((age + 0.05) / 0.72), 3);
      const r = v * (full ? 0.09 + p * (0.62 + i * 0.16) : 0.07 + p * (0.3 + i * 0.07));
      ring.position.set(0, hero, 0);
      ring.scale.set(r, 1, r * (full ? 0.6 : 0.42));
      ring.material.opacity = (0.95 - i * 0.2) * Math.pow(1 - clamp(age / 0.72), 1.5);
    });

    u.uFlash.value = arrived ? energy * 0.85 : 0;
    u.uFlashAt.value.set(M.xs, sy(hero));
    u.uFlashR.value = H * (0.22 + 0.2 * (1 - energy));

    // Sheets.
    sheets.visible = arrived;
    if (arrived) {
      const q = hold + 0.16;
      sheetData.forEach((s, i) => {
        const travel = (1 - Math.exp(-q * 2.6)) * s.speed * v * (full ? 0.62 : 0.46);
        const startX = s.low ? w * 0.5 : 0;
        const startY = s.low ? (yb - textRoof - 34) / pm - s.drop * 0.2 * v : hero * (1 - 0.012);
        const x = startX + Math.cos(s.angle) * travel + Math.sin(q * 2 + s.phase) * s.sway * v;
        const y = startY + Math.sin(s.angle) * travel -
          (q * 0.42 + q * q * 0.5) * s.fall * v;
        const z = Math.sin(s.phase) * 0.035 * v;
        const px = sx(x);
        const py = sy(y);
        // Anything drifting towards the text shrinks away instead of crossing it.
        const clear = clamp(Math.max(textLeft - px, py - textRoof) / 44);
        tmpEuler.set(q * s.spin + s.phase, q * s.spin2, s.phase * 2);
        tmpQuat.setFromEuler(tmpEuler);
        tmpPos.set(x, y, z);
        const size = Math.max(0.0001 * v, s.size * v * (full ? 0.03 : 0.04) * smooth(clear));
        tmpScale.set(size, size, size);
        tmpMatrix.compose(tmpPos, tmpQuat, tmpScale);
        sheets.setMatrixAt(i, tmpMatrix);
      });
      sheets.instanceMatrix.needsUpdate = true;
    }

    // Clouds drift all the time, faster the further out we are.
    cloudsLow.position.x = time * (6 + v * 0.012);
    cloudsHigh.position.x = -time * (12 + v * 0.016);
    heroClouds.position.x = time * 0.012 * vEnd;
    if (heroCloudMesh) {
      const swell = smooth(seg(t, K - 0.62, 0.56));
      heroCloudMesh.visible = swell > 0;
      if (swell > 0) {
        heroCloudList.forEach((c, i) => {
          tmpEuler.set(0, c.ry, 0);
          tmpQuat.setFromEuler(tmpEuler);
          tmpPos.set(c.x, c.y, c.z);
          tmpScale.set(c.sx * swell, c.sy * swell, c.sz * swell);
          tmpMatrix.compose(tmpPos, tmpQuat, tmpScale);
          heroCloudMesh.setMatrixAt(i, tmpMatrix);
        });
        heroCloudMesh.instanceMatrix.needsUpdate = true;
      }
      // The shock pushes the clouds out from the stack.
      const push = arrived ? 0.1 * (1 - Math.exp(-hold * 5)) : 0;
      heroClouds.scale.set(1 + push, 1, 1 + push);
    }
    cloudsLow.visible = v < 150000;
    cloudsHigh.visible = v < 900000;

    // Comparisons.
    const holdPulse = arrived ? Math.sin(hold * 3.2) : 0;
    const stackRight = sx(w * 0.56);
    const stackLeft = sx(-w * 0.56);
    let lastChipY = Infinity;

    comps.forEach((c, i) => {
      const heightPx = c.h * pm;
      const pushed = w * 0.62;
      const x = pushed + c.x0;

      if (c.air) {
        const beatPx = H / c.viewAtBeat;
        const size = (M.airPx / beatPx) * Math.pow(v / c.viewAtBeat, 0.42);
        const px = c.id === "jet" ? 0.3 : 0.26;
        const glide = c.id === "jet" ? (time - c.beat) * 0.05 * v : 0;
        c.group.position.set(px * c.viewAtBeat + glide, c.h, 0);
        c.group.scale.setScalar(size);
        c.group.visible = sy(c.h) > -M.airPx && sy(c.h) < yb - 20;
        if (c.id === "station") c.group.rotation.y = time * 0.2;
        if (c.id === "balloon") c.group.rotation.z = Math.sin(time * 1.3) * 0.06;
      } else if (!c.line) {
        c.group.position.set(x, -sag(sx(x)) / pm, 0);
        c.group.visible = heightPx > 3;
      }

      const anchorX = c.line ? W - side - 6 : sx(c.group.position.x);
      const anchorY = sy(c.h);
      const retire = i < comps.length - 1 ? comps[i + 1].beat - 0.28 : Infinity;
      const landed = t >= c.beat - 0.04;
      const pop = back(seg(t, c.beat - 0.04, 0.2), 1.6);
      const going = seg(t, retire, 0.15);
      const tagOn = landed && going < 1;

      c.tag.style.visibility = tagOn ? "visible" : "hidden";
      if (tagOn) {
        const settle = retire < Infinity ? seg(t, c.beat + 0.16, retire - c.beat - 0.16) : 0;
        const scale = (0.55 + 0.45 * pop) * (1 - 0.2 * settle - 0.14 * going) * (arrived ? 1 + kick * 0.09 : 1);
        const rightEdge = c.line || c.air
          ? anchorX + 40
          : sx(c.group.position.x + c.width / 2);
        let tx;
        let ty;
        if (full) {
          const counterRight = arrived ? 0 : counterEl.offsetWidth * 0.68 + M.xs + 22;
          tx = clamp(anchorX - c.tagW * 0.3, Math.max(stackRight + 20, counterRight), W - side - c.tagW);
          ty = anchorY - c.tagH - 22;
          const roof = heroBottom + captionH + 16;
          if (ty < roof) {
            ty = roof;
            tx = clamp(rightEdge + 14, stackRight + 20, W - side - c.tagW);
          }
        } else {
          tx = clamp(rightEdge + 14, stackRight + 18, W - side - c.tagW);
          ty = Math.max(heroBottom + captionH + 8, anchorY - c.tagH * 0.28);
        }
        if (c.air) ty = anchorY + 46;
        ty = Math.min(ty, yb - c.tagH - 20);
        const fly = smooth(going);
        tx = lerp(tx, stackLeft - M.tickMajor - 12 - c.chipW, fly);
        ty = lerp(ty, anchorY - c.tagH * 0.75, fly);
        c.tag.style.transformOrigin = "0% 100%";
        c.tag.style.transform =
          `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${(scale * lerp(1, 0.4, fly)).toFixed(4)})`;
        c.tag.style.opacity = (1 - seg(going, 0.5, 0.5)).toFixed(3);
      }

      const lineOn = tagOn && anchorY > -10;
      c.lineEl.style.visibility = lineOn ? "visible" : "hidden";
      if (lineOn) {
        const opacity = (1 - going) * clamp((t - c.beat + 0.06) / 0.1);
        if (c.line) {
          let d = "";
          for (let px = -10; px <= W + 10; px += 40) {
            d += `${d ? "L" : "M"}${px} ${(anchorY + sag(px)).toFixed(2)}`;
          }
          c.lineEl.setAttribute("d", d);
          c.lineEl.setAttribute("stroke-width", full ? 6 : 5);
        } else {
          c.lineEl.setAttribute("x1", stackRight.toFixed(2));
          c.lineEl.setAttribute("y1", anchorY.toFixed(2));
          c.lineEl.setAttribute("x2", anchorX.toFixed(2));
          c.lineEl.setAttribute("y2", anchorY.toFixed(2));
        }
        c.lineEl.style.opacity = opacity.toFixed(3);
      }

      // Once retired, the height stays on the ruler for as long as it fits.
      const chipIn = seg(t, retire + 0.09, 0.08);
      const fits = anchorY < yb - c.chipH - 10 && lastChipY - anchorY > c.chipH + 6;
      const chipOn = chipIn > 0 && fits;
      c.chip.style.visibility = chipOn ? "visible" : "hidden";
      if (chipOn) {
        const scale = arrived ? 1 + kick * 0.12 : 1;
        c.chip.style.transform =
          `translate(${(stackLeft - M.tickMajor - 12 - c.chipW).toFixed(2)}px, ${(anchorY - c.chipH * 0.52).toFixed(2)}px) scale(${scale.toFixed(4)})`;
        c.chip.style.opacity = chipIn.toFixed(3);
        c.chip.style.color = arrived && energy > 0.05
          ? blend(V.text, V.accent, energy * 1.4)
          : V.text;
        lastChipY = anchorY;
      }
    });

    if (personComp) {
      const { headPivot, body, armL } = personComp.group.userData;
      const look = clamp(Math.atan2(Math.max(0, h - 1.5), 0.9), 0, 0.95);
      headPivot.rotation.x = -look * 0.72;
      body.rotation.x = -look * 0.07 + Math.sin(time * 2.2) * 0.008;
      const raise = smooth(seg(t, 0.28, 0.6));
      armL.g.rotation.x = -raise * 2.45;
      armL.fore.rotation.x = -0.2 + raise * 0.12;
    }

    const tallest = comps.find((c) => c.id === "tallest");
    if (tallest) {
      const blink = Math.sin(time * 5) > 0.2 ? 1 : 0.15;
      tallest.group.userData.beacon.scale.setScalar(blink);
    }

    // Ruler, on the shaded side of the stack.
    const ruleX = stackLeft - 6;
    const minorStep = Math.pow(10, Math.ceil(Math.log10(13 / pm)));
    const minorPx = minorStep * pm;
    const majorStep = minorStep * 10;
    let minorD = "";
    let majorD = "";
    const steps = Math.min(240, Math.ceil(h / minorStep));
    for (let i = 1; i <= steps; i++) {
      const y = i * minorStep;
      const py = sy(y);
      if (py < -10 || py > yb) continue;
      if (i % 10 === 0) {
        majorD += `M${ruleX.toFixed(1)} ${py.toFixed(1)}h${-M.tickMajor}`;
      } else {
        minorD += `M${ruleX.toFixed(1)} ${py.toFixed(1)}h${-M.tickMinor}`;
      }
    }
    minorEl.setAttribute("d", minorD);
    majorEl.setAttribute("d", majorD);
    minorEl.style.opacity = (smooth(clamp((minorPx - 13) / 24)) * 0.82).toFixed(3);
    majorEl.style.opacity = "0.95";
    const tickColor = arrived && energy > 0.04 ? blend(V.text, V.accent, energy * 1.3) : V.text;
    minorEl.setAttribute("stroke", tickColor);
    majorEl.setAttribute("stroke", tickColor);

    // Running height, riding the top of the stack.
    counterEl.style.visibility = arrived ? "hidden" : "visible";
    if (!arrived) {
      const text = formatCounter(h);
      if (counterEl.textContent !== text) counterEl.textContent = text;
      const cw = counterEl.offsetWidth;
      const y = Math.max(full ? labelBottom + 6 : 56, sy(h) - M.counter * 1.16);
      const x = Math.max(side * 0.5, M.xs - cw * 0.32);
      const scale = 0.82 + 0.18 * progress;
      counterEl.style.transform =
        `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) scale(${scale.toFixed(4)})`;
    }

    // The number.
    heroEl.style.visibility = arrived ? "visible" : "hidden";
    if (arrived) {
      const punch = 1 + 0.09 * Math.exp(-hold * 11) * Math.cos(hold * 17) + 0.006 * holdPulse * (1 - energy);
      heroEl.style.transformOrigin = "0% 60%";
      heroEl.style.transform = `scale(${punch.toFixed(5)})`;
      heroEl.style.color = blend(V.text, V.accent, 0.22 + energy * 0.78);
    }

    captionEl.style.visibility = arrived && V.caption ? "visible" : "hidden";
    if (arrived) {
      captionEl.style.opacity = seg(hold, 0.04, 0.14).toFixed(3);
      captionEl.style.transform = `translateY(${((1 - out(seg(hold, 0.04, 0.2))) * 14).toFixed(2)}px)`;
    }

    flashEl.style.visibility = arrived && hold < 0.14 ? "visible" : "hidden";
    if (arrived) flashEl.style.opacity = (0.16 * (1 - hold / 0.14)).toFixed(3);

    const open = variant === "overlay" ? out(seg(time, 0, 0.26), 3) : 1;
    const exitDuration = Math.max(0, T.exit - 1 / CA.fps);
    let closed = T.exit > 0 ? seg(time, T.key + T.hold, exitDuration) : 0;
    if (closed > 1 - 0.0000001) closed = 1;
    if (open >= 0.999999 && closed === 0) {
      stageEl.style.clipPath = "none";
    } else {
      const cxp = M.xs;
      const cyp = closed > 0 ? sy(hero) : M.yb;
      const radius = Math.hypot(W, H) * open * (1 - closed * closed);
      stageEl.style.clipPath =
        `circle(${Math.max(0, radius).toFixed(3)}px at ${cxp.toFixed(2)}px ${cyp.toFixed(2)}px)`;
    }

    renderer.render(scene, camera);
  }

  function showLayers(v) {
    near.visible = v < 130;
    town.visible = v < 5200;
    city.visible = v > 60 && v < 42000;
    ridges.visible = v < 70000;
    front.visible = v > 760 && v < 42000;
    if (front.visible) {
      // Only what is already past the bottom edge of the frame exists.
      const limit = 0.6 * CAM_K * v;
      frontLayers.forEach(({ mesh, z }) => {
        let lo = 0;
        let hi = z.length;
        while (lo < hi) {
          const mid = (lo + hi) >> 1;
          if (z[mid] < limit) lo = mid + 1;
          else hi = mid;
        }
        mesh.count = lo;
      });
    }
  }

  window.addEventListener("hf-seek", (event) => renderAt(event.detail.time));
  renderAt(window.__hfThreeTime || 0);
  window.__timelines = window.__timelines || {};
  window.__timelines["block"] = gsap.timeline({ paused: true });
});
