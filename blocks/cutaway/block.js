import * as THREE from "three";

CA.ready(() => {
  const { vars: V, stage: S, safe, time: T, variant, make, fit, rgba, seeded } = CA;

  const $ = (id) => document.getElementById(id);
  const W = S.w;
  const H = S.h;
  const K = T.design;
  const EPS = 0.000001;
  const TAU = Math.PI * 2;
  const compact = variant !== "full";
  const minText = compact ? 32 : 40;
  const fps = Math.max(1, Number(CA.fps) || 30);
  const stageEl = $("stage");

  const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
  const mix = (a, b, p) => a + (b - a) * p;
  const seg = (t, at, duration) =>
    duration <= 0 ? (t >= at ? 1 : 0) : clamp((t - at) / duration);
  const out = (p, power = 3) => 1 - Math.pow(1 - p, power);
  const smooth = (p) => p * p * p * (p * (p * 6 - 15) + 10);
  const back = (p, s = 1.7) =>
    1 + (s + 1) * Math.pow(p - 1, 3) + s * Math.pow(p - 1, 2);
  const num = (id, fallback, lo, hi) => {
    const value = Number(V[id]);
    return clamp(Number.isFinite(value) ? value : fallback, lo, hi);
  };
  const designTime = (time) =>
    time >= T.key - EPS ? K + Math.max(0, time - T.key) : time / T.scale;

  // ---------------------------------------------------------------- schedule
  // Design seconds at the default 4.4s key. CA.time scales the build-up to fit.
  const unit = K / 4.4;
  const when = {
    bladeIn: 0.12 * unit,
    bladeSweep: 0.62 * unit,
    bladeEnd: 1.14 * unit,
    lift: 1.2 * unit,
    liftEnd: 2.2 * unit,
    pushFrom: 1.1 * unit,
    charge: K - 0.72 * unit,
  };
  const labelAt = [1.96, 2.52, 3.08, 3.64].map((v) => v * unit).concat(K);

  // ---------------------------------------------------------------- objects
  // Every object is five nested profiles in the (radius, height) half-plane, walked
  // from the bottom pole (t = 0) to the top pole (t = 1). The same builders turn any of
  // them into a body, a lifted section and capped cut faces.
  const linspace = (a, b, n) =>
    Array.from({ length: n + 1 }, (_, i) => a + (b - a) * i / n);

  function polyProfile(points, scales, centre) {
    const breaks = points.map((_, i) => i / (points.length - 1));
    const ts = [];
    for (let i = 0; i < points.length - 1; i++) {
      linspace(breaks[i], breaks[i + 1], 14).forEach((t) => ts.push(t));
    }
    return {
      ts,
      prof(i, t) {
        const span = points.length - 1;
        const at = Math.min(span - 1, Math.floor(t * span));
        const p = t * span - at;
        const a = points[at];
        const b = points[at + 1];
        return [
          mix(a[0], b[0], p) * scales[i],
          centre + (mix(a[1], b[1], p) - centre) * scales[i],
        ];
      },
    };
  }

  const shapes = {
    planet: {
      ts: linspace(0, 1, 160),
      prof(i, t) {
        const R = [1, 0.86, 0.665, 0.45, 0.225][i];
        const a = -Math.PI / 2 + Math.PI * t;
        return [R * Math.cos(a), R * Math.sin(a)];
      },
      halfW: 1, halfH: 1, facets: 0, baseY: 0, rise: 0.05,
      open: [50, 44, 38, 32], foot: 0.78,
    },
    capsule: (() => {
      const Rs = [0.72, 0.6, 0.465, 0.32, 0.17];
      const Ls = [0.66, 0.6, 0.52, 0.42, 0.28];
      return {
        ts: [...linspace(0, 0.3, 60), ...linspace(0.3, 0.7, 24), ...linspace(0.7, 1, 60)],
        prof(i, t) {
          const R = Rs[i];
          const L = Ls[i];
          if (t <= 0.3) {
            const a = -Math.PI / 2 + t / 0.3 * Math.PI / 2;
            return [R * Math.cos(a), -L + R * Math.sin(a)];
          }
          if (t >= 0.7) {
            const a = (t - 0.7) / 0.3 * Math.PI / 2;
            return [R * Math.cos(a), L + R * Math.sin(a)];
          }
          return [R, -L + 2 * L * (t - 0.3) / 0.4];
        },
        halfW: 0.72, halfH: 1.38, facets: 0, baseY: -0.2, rise: 0.05,
        open: [50, 44, 38, 32], foot: 0.66, zoom: 1.24, coreGain: 0.6,
      };
    })(),
    gem: {
      ...polyProfile(
        [[0, -1.12], [0.98, 0.1], [1.03, 0.19], [0.62, 0.66], [0, 0.66]],
        [1, 0.81, 0.62, 0.43, 0.22],
        -0.08,
      ),
      halfW: 1.03, halfH: 0.92, facets: 12, baseY: -0.08, rise: 0.05,
      open: [50, 44, 38, 32], foot: 0.68, zoom: 1.08, coreGain: 0.85, coreY: 0.02,
    },
  };

  const objectName = shapes[V.object] ? V.object : "planet";
  const shape = shapes[objectName];
  const prof = (i, t) => shape.prof(i, t);
  const ts = [...new Set(shape.ts)].sort((a, b) => a - b);
  const phiC = Math.PI / 2;
  const cuts = shape.open.map((deg, i) => ({
    a: THREE.MathUtils.degToRad(deg),
    y: shape.baseY + shape.rise * i,
  }));

  const plan = (phi) => {
    if (!shape.facets) return 1;
    const step = TAU / shape.facets;
    const x = ((phi % step) + step) % step - step / 2;
    return Math.cos(step / 2) / Math.cos(x);
  };

  function tAtY(i, y) {
    let lo = 0;
    let hi = 1;
    if (prof(i, 1)[1] <= y) return 1;
    for (let n = 0; n < 40; n++) {
      const m = (lo + hi) / 2;
      if (prof(i, m)[1] < y) lo = m;
      else hi = m;
    }
    return hi;
  }

  function normalAt(i, t) {
    const e = 0.0015;
    const a = prof(i, clamp(t - e));
    const b = prof(i, clamp(t + e));
    const dr = b[0] - a[0];
    const dy = b[1] - a[1];
    const l = Math.hypot(dr, dy) || 1;
    return [dy / l, -dr / l];
  }

  function phiList(a, b) {
    const n = Math.max(6, Math.ceil((b - a) / (TAU / 144)));
    const list = linspace(a, b, n);
    if (shape.facets) {
      const step = TAU / shape.facets;
      for (let k = Math.ceil(a / step); k * step < b; k++) list.push(k * step);
    }
    return [...new Set(list)].sort((p, q) => p - q);
  }

  function geometry(position, normal, index, extra) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(position, 3));
    geo.setAttribute("normal", new THREE.Float32BufferAttribute(normal, 3));
    for (const [name, size, data] of extra) {
      geo.setAttribute(name, new THREE.Float32BufferAttribute(data, size));
    }
    geo.setIndex(index);
    return geo;
  }

  function surfaceGeo(i, tA, tB, phiA, phiB) {
    const rows = [tA, ...ts.filter((t) => t > tA + 1e-6 && t < tB - 1e-6), tB];
    const phis = phiList(phiA, phiB);
    const position = [];
    const normal = [];
    const surf = [];
    const index = [];
    rows.forEach((t) => {
      const [r, y] = prof(i, t);
      const [nr, ny] = normalAt(i, t);
      for (const phi of phis) {
        const c = Math.cos(phi);
        const s = Math.sin(phi);
        const pf = plan(phi);
        position.push(r * pf * c, y, r * pf * s);
        normal.push(nr * c, ny, nr * s);
        surf.push(phi, t);
      }
    });
    const np = phis.length;
    for (let j = 0; j < rows.length - 1; j++) {
      for (let k = 0; k < np - 1; k++) {
        const a = j * np + k;
        const b = (j + 1) * np + k;
        const c = (j + 1) * np + k + 1;
        const d = j * np + k + 1;
        index.push(a, b, c, a, c, d);
      }
    }
    return geometry(position, normal, index, [["aSurf", 2, surf]]);
  }

  function orderedTri(index, position, a, b, c, n) {
    const p = (v) => new THREE.Vector3().fromArray(position, v * 3);
    const cross = p(b).sub(p(a)).cross(p(c).sub(p(a)));
    if (cross.dot(n) >= 0) index.push(a, b, c);
    else index.push(a, c, b);
  }

  // One exposed plane of a layer: a capped strip between its outer and inner profile.
  function wallGeo(i, phi, sign) {
    const y = cuts[i].y;
    const t0o = tAtY(i, y);
    const t0i = tAtY(i + 1, y);
    const floorT = Math.min(t0o, t0i);
    const grid = [...new Set([...ts, t0o, t0i])]
      .filter((t) => t >= floorT - 1e-9)
      .sort((a, b) => a - b);
    const c = Math.cos(phi);
    const s = Math.sin(phi);
    const pf = plan(phi);
    const n = new THREE.Vector3(-s * sign, 0, c * sign);
    const position = [];
    const normal = [];
    const face = [];
    const index = [];
    let u = 0;
    let last = null;
    grid.forEach((t, j) => {
      const O = prof(i, Math.max(t, t0o));
      const I = prof(i + 1, Math.max(t, t0i));
      if (last) u += Math.hypot(O[0] - last[0], O[1] - last[1]);
      last = O;
      const width = Math.hypot(O[0] - I[0], O[1] - I[1]);
      position.push(O[0] * pf * c, O[1], O[0] * pf * s);
      position.push(I[0] * pf * c, I[1], I[0] * pf * s);
      normal.push(n.x, n.y, n.z, n.x, n.y, n.z);
      face.push(u, 0, width, u, 1, width);
      if (j > 0) {
        const a = 2 * (j - 1);
        orderedTri(index, position, a, a + 2, a + 1, n);
        orderedTri(index, position, a + 1, a + 2, a + 3, n);
      }
    });
    return geometry(position, normal, index, [["aFace", 3, face]]);
  }

  function floorGeo(i) {
    const { a, y } = cuts[i];
    const ro = prof(i, tAtY(i, y))[0];
    const ri = prof(i + 1, tAtY(i + 1, y))[0];
    const phis = phiList(phiC - a, phiC + a);
    const n = new THREE.Vector3(0, 1, 0);
    const position = [];
    const normal = [];
    const face = [];
    const index = [];
    phis.forEach((phi, k) => {
      const c = Math.cos(phi);
      const s = Math.sin(phi);
      const pf = plan(phi);
      const u = ro * (phi - phiC + a);
      position.push(ro * pf * c, y, ro * pf * s, ri * pf * c, y, ri * pf * s);
      normal.push(0, 1, 0, 0, 1, 0);
      face.push(u, 0, ro - ri, u, 1, ro - ri);
      if (k > 0) {
        const p = 2 * (k - 1);
        orderedTri(index, position, p, p + 2, p + 1, n);
        orderedTri(index, position, p + 1, p + 2, p + 3, n);
      }
    });
    return geometry(position, normal, index, [["aFace", 3, face]]);
  }

  // ---------------------------------------------------------------- renderer
  const canvas = $("cw-gl");
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", String(V.title));

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: false,
    antialias: false,
    preserveDrawingBuffer: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(2);
  renderer.setSize(W, H, false);
  renderer.autoClear = false;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();

  // Softboxes for the reflections. Built once, so the studio is fixed and deterministic.
  const studio = new THREE.Scene();
  studio.background = new THREE.Color(0.012, 0.013, 0.016);
  const featherCanvas = document.createElement("canvas");
  featherCanvas.width = featherCanvas.height = 256;
  {
    const g = featherCanvas.getContext("2d");
    g.fillStyle = "#000";
    g.fillRect(0, 0, 256, 256);
    g.filter = "blur(16px)";
    g.fillStyle = "#fff";
    g.fillRect(34, 34, 188, 188);
  }
  const featherMap = new THREE.CanvasTexture(featherCanvas);
  function softbox(w, h, position, color, power) {
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color).multiplyScalar(power),
      map: featherMap,
      side: THREE.DoubleSide,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const box = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    box.position.set(...position);
    box.lookAt(0, 0, 0);
    studio.add(box);
    return box;
  }
  softbox(34, 26, [0, 18, 0], "#fff4e6", 0.5);
  softbox(30, 1.7, [-3, 15, 6.5], "#fff4e6", 11);
  softbox(4, 24, [-15, 4, 6], "#ffffff", 8);
  softbox(1.6, 24, [14, 3, 8], "#cfe2ff", 5);
  softbox(6, 24, [15, 2, -9], "#9fc4ff", 10);
  softbox(4, 20, [-13, 2, -11], "#ffd9b8", 5);
  softbox(36, 5, [0, -7, 14], "#c8d4e6", 0.8);
  softbox(32, 5, [0, 5, -17], "#bcd2ff", 2);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(studio, 0.006, 0.1, 100, { size: 1024 });
  scene.environment = environment.texture;
  pmrem.dispose();
  studio.traverse((o) => {
    if (o.isMesh) {
      o.geometry.dispose();
      o.material.dispose();
    }
  });

  const color = (hex) => new THREE.Color(hex);
  const accent = color(V.accent);

  const key = new THREE.DirectionalLight("#fff1e0", 2.2);
  key.castShadow = true;
  key.shadow.mapSize.set(4096, 4096);
  key.shadow.bias = -0.0002;
  key.shadow.normalBias = 0.012;
  key.shadow.radius = 5;
  Object.assign(key.shadow.camera, {
    left: -5, right: 5, top: 5, bottom: -5, near: 1, far: 40,
  });
  key.position.set(-5.5, 11, 8);
  scene.add(key, key.target);

  const rim = new THREE.DirectionalLight("#a9ccff", 2.6);
  rim.position.set(9, 4, -9);
  scene.add(rim);

  const glint = new THREE.DirectionalLight("#ffffff", 0);
  scene.add(glint, glint.target);

  const coreLight = new THREE.PointLight(accent, 0, Math.max(shape.halfW, shape.halfH) * 1.1, 1.4);
  scene.add(coreLight);

  // ---------------------------------------------------------------- materials
  const G = {
    uTime: { value: 0 },
    uFront: { value: 9 },
    uRip: { value: 0 },
    uHeat: { value: 0 },
    uInlay: { value: 0 },
    uTravel: { value: 0 },
    uBladeD: { value: -9 },
    uBladeN: { value: new THREE.Vector3(1, 0, 0) },
    uBladeAmp: { value: 0 },
    uSeam: { value: 0 },
    uAccent: { value: accent },
    uPhiC: { value: phiC },
    uA0: { value: cuts[0].a },
    uY0: { value: cuts[0].y },
    uGraticule: { value: objectName === "planet" ? 1 : 0 },
    uGem: { value: objectName === "gem" ? 1 : 0 },
  };

  const header = `
    uniform float uTime, uFront, uRip, uHeat, uInlay, uTravel, uBladeD, uBladeAmp;
    uniform float uSeam, uPhiC, uA0, uY0, uGraticule, uGem, uFocus;
    uniform vec3 uBladeN, uAccent, uTint;
    varying vec3 vFace;
    varying vec2 vSurf;
    varying vec3 vObj;
    varying vec3 vW;

    float cwHash(float x) { return fract(sin(x * 127.1) * 43758.5453); }
    float cwNoise(float x) {
      float i = floor(x);
      float f = fract(x);
      f = f * f * (3.0 - 2.0 * f);
      return mix(cwHash(i), cwHash(i + 1.0), f);
    }
    // A hairline of half-width hw, thinning instead of shimmering once it drops below a pixel.
    float cwLine(float x, float hw) {
      float fw = max(fwidth(x), 1e-6);
      float a = 1.0 - smoothstep(hw, hw + fw * 1.2, abs(x));
      return a * clamp((hw * 2.0 + fw * 0.4) / fw, 0.0, 1.0);
    }
    vec3 cwPerturb(vec3 pos, vec3 N, vec2 dH, float faceDir) {
      vec3 sx = dFdx(pos);
      vec3 sy = dFdy(pos);
      vec3 r1 = cross(sy, N);
      vec3 r2 = cross(N, sx);
      float det = dot(sx, r1) * faceDir;
      vec3 grad = sign(det) * (dH.x * r1 + dH.y * r2);
      return normalize(abs(det) * N - grad);
    }
  `;

  // Height, colour and light for each layer. Everything is measured in world units along
  // the layer, so the fine lines stay crisp when the camera arrives at the core.
  const pattern = `
    float pAlb = 1.0;
    float pRough = 0.0;
    float pMetal = 0.0;
    vec2 pGrad = vec2(0.0);
    vec3 pEmit = vec3(0.0);
    float cwDepth;

    #if CW_FACE == 1
      float v = clamp(vFace.y, 0.0, 1.0);
      float u = vFace.x;
      float wd = max(vFace.z, 0.0001);
      float d = v * wd;
      float di = (1.0 - v) * wd;
      vec2 dd = vec2(dFdx(d), dFdy(d));
      float pix = max(fwidth(d), 1e-6);
      cwDepth = 4.0 - float(CW_LAYER) + (1.0 - v);

      // Polished chamfer on the outer edge of every section.
      float chamfer = 1.0 - smoothstep(0.0, 0.011, d);
      pGrad += dd * chamfer * 1.1;
      pRough -= chamfer * 0.5;
      pAlb *= 1.0 + chamfer * 0.6;

      // A shadow line where the next, raised layer stands proud of this one.
      pAlb *= mix(1.0, 0.42, smoothstep(0.03, 0.0, di));

      float ticks = 0.0;
      #if CW_LAYER == 0
        float band = smoothstep(0.26, 0.3, v) * (1.0 - smoothstep(0.7, 0.74, v));
        float mark = cwLine(fract(u / 0.045 + 0.5) - 0.5, 0.075);
        float mark5 = cwLine(fract(u / 0.225 + 0.5) - 0.5, 0.018);
        pAlb *= 0.72;
        pEmit += uTint * 3.0 * band * mark * 0.0;
        ticks = band * max(mark, mark5);
        pAlb += ticks * 3.2;
        pRough += 0.08;
      #elif CW_LAYER == 1
        float fade = clamp(1.0 - pix * 500.0, 0.0, 1.0);
        float n1 = cwNoise(d * 1300.0) * 0.6 + cwNoise(d * 3100.0) * 0.4;
        float n2 = cwNoise(d * 420.0);
        pRough += (n1 - 0.5) * 0.26 * fade + (n2 - 0.5) * 0.08;
        pAlb *= 0.93 + 0.14 * mix(0.5, n1, fade);
        pGrad += dd * (n1 - 0.5) * 0.4 * fade;
        float ring = cwLine(v - 0.5, 0.008);
        pAlb *= 1.0 - ring * 0.75;
        pGrad += dd * ring * sign(v - 0.5) * 0.6;
      #elif CW_LAYER == 2
        float groove = cwLine(v - 0.34, 0.006);
        float groove2 = cwLine(v - 0.88, 0.006);
        float row = smoothstep(0.075, 0.09, v) * (1.0 - smoothstep(0.255, 0.27, v));
        float rowLong = smoothstep(0.075, 0.09, v) * (1.0 - smoothstep(0.3, 0.315, v));
        float m1 = cwLine(fract(u / 0.04 + 0.5) - 0.5, 0.05);
        float m5 = cwLine(fract(u / 0.2 + 0.5) - 0.5, 0.012);
        pAlb *= 1.0 - max(max(groove, groove2) * 0.7, max(row * m1, rowLong * m5) * 0.85);
        pGrad += dd * (groove * sign(v - 0.34) + groove2 * sign(v - 0.88)) * 0.5;
      #elif CW_LAYER == 3
        float x = v * 7.0;
        float f = fract(x);
        float tri = abs(f - 0.5) * 2.0;
        float slope = (f < 0.5 ? -1.0 : 1.0) * smoothstep(0.08, 0.2, abs(f - 0.5));
        float edge = smoothstep(0.34, 0.5, 1.0 - tri);
        pGrad += dd * slope * 0.62 * smoothstep(0.0, 0.16, v) * (1.0 - smoothstep(0.92, 1.0, v));
        pAlb *= 0.62 + 0.5 * tri;
        pRough += (1.0 - tri) * 0.16;
      #endif

      // Inlaid light between this layer and the next one in.
      float inlay = 1.0 - smoothstep(0.0, 0.0065 + pix, di);
      float comet = fract(u * 0.62 - uTime * 0.42 + float(CW_LAYER) * 0.37);
      comet = pow(comet, 9.0);
      pEmit += uAccent * inlay * (uInlay + uTravel * (0.3 + comet * 9.0));
      float sheet = dot(vObj, normalize(vec3(0.55, 0.82, -0.2)));
      float sheetBand = exp(-pow((sheet - (mod(uTime * 0.46, 2.6) - 1.3)) / 0.16, 2.0));
      pEmit += mix(uTint, uAccent, 0.35) * sheetBand * 0.1 * uTravel;
    #else
      float phi = vSurf.x;
      float t = vSurf.y;
      vec2 dt = vec2(dFdx(t), dFdy(t));
      cwDepth = 5.0 - float(CW_LAYER);
      float dRow = length(vObj.xz);

      #if CW_LAYER == 0
        if (uGraticule > 0.5) {
          float lat = cwLine(fract(t * 12.0 + 0.5) - 0.5, 0.012);
          float lon = cwLine(fract(phi / 6.2831853 * 24.0 + 0.5) - 0.5, 0.012) *
            smoothstep(0.02, 0.1, t) * (1.0 - smoothstep(0.9, 0.98, t));
          float major = cwLine(t - 0.5, 0.0016);
          pAlb *= 1.0 - max(lat, lon) * 0.5;
          pRough += max(lat, lon) * 0.25;
          pAlb += major * 4.0;
        } else if (uGem < 0.5) {
          float ringA = cwLine(t - 0.32, 0.0013) + cwLine(t - 0.335, 0.0013);
          float ringB = cwLine(t - 0.68, 0.0013) + cwLine(t - 0.665, 0.0013);
          float mark = cwLine(fract(phi / 6.2831853 * 36.0 + 0.5) - 0.5, 0.05) *
            smoothstep(0.336, 0.338, t) * (1.0 - smoothstep(0.35, 0.352, t));
          pAlb += (ringA + ringB) * 3.0 + mark * 2.5;
        } else {
          // Each facet has its own polish and a soft sheen across it, and the edges
          // are small bevels that catch the studio instead of drawn lines.
          float sector = phi / 6.2831853 * 12.0;
          float tier = t < 0.25 ? 0.0 : (t < 0.5 ? 1.0 : (t < 0.75 ? 2.0 : 3.0));
          float facet = cwHash(floor(sector) + tier * 13.0 + 3.0);
          pRough += (facet - 0.5) * 0.16 + 0.1;
          float across = fract(sector);
          float along = fract(t * 4.0);
          pAlb *= (0.66 + 0.5 * facet) * (0.74 + 0.5 * smoothstep(0.0, 1.0, across)) *
            (0.82 + 0.36 * along);
          float dSector = t < 0.75
            ? abs(fract(sector + 0.5) - 0.5) / 12.0 * 6.2831853 * max(dRow, 0.02)
            : 10.0;
          float dTier = min(min(abs(t - 0.25), abs(t - 0.5)), abs(t - 0.75)) * 2.4;
          float de = min(dSector, dTier);
          float bevel = 1.0 - smoothstep(0.0, 0.017, de);
          pGrad += vec2(dFdx(de), dFdy(de)) * bevel * 0.9;
          pRough -= bevel * 0.12;
          pAlb *= 1.0 + bevel * 0.5;
          float run = sin(vObj.x * 5.0 + vObj.y * 7.0 + vObj.z * 6.0 + uTime * 0.9);
          float glint = pow(0.5 + 0.5 * run, 7.0);
          pEmit += vec3(0.5, 0.54, 0.6) * exp(-de * de * 40000.0) * (0.035 + glint * 0.22);
        }

        // The seam: a hairline that shows where the section will part.
        float dphi = abs(mod(phi - uPhiC + 3.14159265, 6.2831853) - 3.14159265);
        float dWall = abs(dphi - uA0) * max(dRow, 0.03);
        float dFloor = abs(vObj.y - uY0);
        float seam = 10.0;
        if (vObj.y >= uY0 - 0.002) seam = min(seam, dWall);
        if (dphi <= uA0 + 0.002) seam = min(seam, dFloor);
        float seamLine = 1.0 - smoothstep(0.0035, 0.0065, seam);
        pAlb *= 1.0 - seamLine * 0.85;
        pRough += seamLine * 0.4;

        float along = dot(vW, uBladeN) - uBladeD;
        float swept = smoothstep(0.02, -0.02, along);
        float seamGlow = (seamLine * 3.4 + exp(-seam * seam * 2600.0) * 0.8) * swept;
        pEmit += uAccent * seamGlow * uSeam;
        float contour = exp(-along * along * 9000.0) * 7.0 + exp(-along * along * 500.0) * 0.45;
        pEmit += (uAccent + vec3(0.12)) * contour * uBladeAmp;
      #elif CW_LAYER == 1
        float s = t * 900.0;
        float fw1 = fwidth(s);
        float n1 = cwNoise(s) * 0.6 + cwNoise(s * 2.3) * 0.4;
        float fade = clamp(1.0 - fw1 * 0.5, 0.0, 1.0);
        pRough += (n1 - 0.5) * 0.24 * fade;
        pAlb *= 0.92 + 0.16 * mix(0.5, n1, fade);
        pGrad += dt * (n1 - 0.5) * 0.002 * fade;
      #elif CW_LAYER == 2
        float groove = cwLine(fract(t * 18.0 + 0.5) - 0.5, 0.02);
        pAlb *= 1.0 - groove * 0.5;
      #elif CW_LAYER == 3
        float x = t * 46.0;
        float f = fract(x);
        float tri = abs(f - 0.5) * 2.0;
        float slope = (f < 0.5 ? -1.0 : 1.0);
        pGrad += dt * slope * 0.022;
        pAlb *= 0.6 + 0.55 * tri;
      #endif
    #endif

    float cwRing = exp(-pow((cwDepth - uFront) / 0.2, 2.0));
    #if CW_FACE == 1 || CW_LAYER > 0
      pEmit += uAccent * cwRing * uRip;
      float cwBehind = smoothstep(uFront + 0.25, uFront - 1.1, cwDepth);
      pEmit += uAccent * cwBehind * uHeat * 0.09 * exp(-(cwDepth - 1.0) * 1.7);
      pEmit += mix(uTint, uAccent, 0.5) * uFocus * 0.2;
    #else
      pEmit += uAccent * cwRing * uRip * uHeat * 0.12;
    #endif
  `;

  function patch(mat, layer, isFace, uniforms) {
    mat.defines = { ...(mat.defines || {}), CW_LAYER: layer, CW_FACE: isFace ? 1 : 0 };
    mat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, G, uniforms);
      sh.vertexShader = sh.vertexShader
        .replace(
          "#include <common>",
          `#include <common>
           attribute vec3 aFace;
           attribute vec2 aSurf;
           varying vec3 vFace;
           varying vec2 vSurf;
           varying vec3 vObj;
           varying vec3 vW;`,
        )
        .replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
           vFace = aFace;
           vSurf = aSurf;
           vObj = position;
           vW = (modelMatrix * vec4(position, 1.0)).xyz;`,
        );
      sh.fragmentShader = sh.fragmentShader
        .replace("#include <common>", `#include <common>\n${header}`)
        .replace(
          "#include <color_fragment>",
          `#include <color_fragment>
           ${pattern}
           diffuseColor.rgb *= pAlb;`,
        )
        .replace(
          "#include <roughnessmap_fragment>",
          `#include <roughnessmap_fragment>
           roughnessFactor = clamp(roughnessFactor + pRough, 0.04, 1.0);`,
        )
        .replace(
          "#include <metalnessmap_fragment>",
          `#include <metalnessmap_fragment>
           metalnessFactor = clamp(metalnessFactor + pMetal, 0.0, 1.0);`,
        )
        .replace(
          "#include <normal_fragment_maps>",
          `#include <normal_fragment_maps>
           normal = cwPerturb(-vViewPosition, normal, pGrad, faceDirection);`,
        )
        .replace(
          "#include <emissivemap_fragment>",
          `#include <emissivemap_fragment>
           totalEmissiveRadiance += pEmit;`,
        )
        .replace(
          "#include <lights_fragment_end>",
          `#include <lights_fragment_end>
           #if CW_LAYER == 0 && CW_FACE == 0
             reflectedLight.directSpecular *= 0.0;
             #ifdef USE_CLEARCOAT
               clearcoatSpecularDirect *= 0.0;
             #endif
             // A flat facet is one big mirror: roll its reflection off before it fills white.
             if (uGem > 0.5) {
               vec3 mirror = reflectedLight.indirectSpecular;
               reflectedLight.indirectSpecular = mirror / (1.0 + mirror * 1.5);
               #ifdef USE_CLEARCOAT
                 clearcoatSpecularIndirect /= 1.0 + clearcoatSpecularIndirect * 2.0;
               #endif
             }
           #endif`,
        );
    };
    mat.customProgramCacheKey = () => `cutaway-${layer}-${isFace ? 1 : 0}`;
    return mat;
  }

  const layerColors = [V.layer1Color, V.layer2Color, V.layer3Color, V.layer4Color, V.layer5Color];
  const finish = [
    {
      surface: { metalness: 0.92, roughness: 0.15, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.5 },
      face: { metalness: 0.9, roughness: 0.34, envMapIntensity: 1.1 },
    },
    {
      surface: { metalness: 1, roughness: 0.34, envMapIntensity: 1.2 },
      face: { metalness: 0.62, roughness: 0.36, envMapIntensity: 1.6 },
    },
    {
      surface: { metalness: 0, roughness: 0.4, clearcoat: 0.7, clearcoatRoughness: 0.22, envMapIntensity: 0.8 },
      face: { metalness: 0, roughness: 0.46, clearcoat: 0.35, clearcoatRoughness: 0.3, envMapIntensity: 0.75 },
    },
    {
      surface: { metalness: 1, roughness: 0.27, envMapIntensity: 1.25 },
      face: { metalness: 1, roughness: 0.25, envMapIntensity: 1.3 },
    },
  ];

  const flat = Boolean(shape.facets);
  if (flat) {
    Object.assign(finish[0].surface, {
      roughness: 0.26, clearcoat: 0.7, clearcoatRoughness: 0.12, envMapIntensity: 1.1,
    });
  }
  const focus = [0, 1, 2, 3].map(() => ({ value: 0 }));
  const surfMat = [];
  const faceMat = [];
  for (let i = 0; i < 4; i++) {
    const uniforms = { uTint: { value: color(layerColors[i]) }, uFocus: focus[i] };
    surfMat.push(patch(new THREE.MeshPhysicalMaterial({
      color: layerColors[i], flatShading: flat, ...finish[i].surface,
    }), i, false, uniforms));
    faceMat.push(patch(new THREE.MeshPhysicalMaterial({
      color: layerColors[i], side: THREE.DoubleSide, ...finish[i].face,
    }), i, true, uniforms));
  }
  const backMat = new THREE.MeshStandardMaterial({
    color: "#15171b", metalness: 0.7, roughness: 0.55, side: THREE.DoubleSide,
  });

  const coreUniforms = {
    uTime: G.uTime,
    uPower: { value: 0 },
    uAccent: G.uAccent,
    uHot: { value: color(V.layer5Color) },
    uHeatUp: { value: 0 },
    uCentre: { value: new THREE.Vector3() },
    uRad: { value: 1 },
  };
  const coreMat = new THREE.ShaderMaterial({
    uniforms: coreUniforms,
    vertexShader: `
      varying vec3 vP;
      varying vec3 vN;
      varying vec3 vV;
      void main() {
        vP = position;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalMatrix * normal;
        vV = -mv.xyz;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      uniform float uTime, uPower, uHeatUp, uRad;
      uniform vec3 uCentre;
      uniform vec3 uAccent, uHot;
      varying vec3 vP;
      varying vec3 vN;
      varying vec3 vV;
      float h(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
      float n3(vec3 p) {
        vec3 i = floor(p);
        vec3 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(mix(h(i), h(i + vec3(1, 0, 0)), f.x), mix(h(i + vec3(0, 1, 0)), h(i + vec3(1, 1, 0)), f.x), f.y),
          mix(mix(h(i + vec3(0, 0, 1)), h(i + vec3(1, 0, 1)), f.x), mix(h(i + vec3(0, 1, 1)), h(i + vec3(1, 1, 1)), f.x), f.y),
          f.z);
      }
      void main() {
        vec3 N = normalize(vN);
        vec3 V = normalize(vV);
        float facing = clamp(dot(N, V), 0.0, 1.0);
        vec3 q = vP * 10.0;
        float a = n3(q + vec3(0.0, uTime * 0.9, uTime * 0.4));
        float b = n3(q * 2.2 - vec3(uTime * 0.6, 0.0, uTime * 0.8));
        float veinA = pow(1.0 - abs(2.0 * a - 1.0), 5.0);
        float veinB = pow(1.0 - abs(2.0 * b - 1.0), 7.0);
        float energy = clamp(veinA * 0.95 + veinB * 0.6, 0.0, 1.0);
        float centre = pow(facing, 1.6);
        vec3 base = uAccent * (0.42 + 0.7 * centre);
        vec3 fire = mix(uAccent * 1.8, uHot * 1.7, energy * energy) * energy;
        float rad = length(vP - uCentre) / uRad;
        vec3 heart = uHot * pow(centre, 2.0) * exp(-rad * rad * 3.2) * uHeatUp * 1.1;
        vec3 body = base + fire;
        vec3 hot = heart;
        float limb = mix(0.45, 1.0, smoothstep(0.0, 0.45, facing));
        gl_FragColor = vec4((body + hot) * uPower * limb, 1.0);
      }
    `,
  });

  // ---------------------------------------------------------------- the object
  const root = new THREE.Group();
  const body = new THREE.Group();
  const wedge = new THREE.Group();
  root.add(body);
  body.add(wedge);
  scene.add(root);

  const addMesh = (geo, mat, parent, shadow = true) => {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = shadow;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };

  for (let i = 0; i < 4; i++) {
    const { a, y } = cuts[i];
    const t0 = tAtY(i, y);
    addMesh(surfaceGeo(i, 0, t0, 0, TAU), surfMat[i], body);
    addMesh(surfaceGeo(i, t0, 1, phiC + a, phiC - a + TAU), surfMat[i], body);
    addMesh(surfaceGeo(i, t0, 1, phiC - a, phiC + a), surfMat[i], wedge);

    const right = wallGeo(i, phiC - a, 1);
    const left = wallGeo(i, phiC + a, -1);
    const floor = floorGeo(i);
    for (const geo of [right, left, floor]) {
      addMesh(geo, faceMat[i], body).userData.face = i;
      addMesh(geo, faceMat[i], wedge);
    }
    addMesh(
      surfaceGeo(i + 1, tAtY(i + 1, y), 1, phiC - a, phiC + a),
      backMat, wedge,
    );
  }
  const coreMesh = new THREE.Mesh(
    shape.facets ? new THREE.SphereGeometry(0.2, 96, 64) : surfaceGeo(4, 0, 1, 0, TAU),
    coreMat,
  );
  body.add(coreMesh);

  const corePoint = (() => {
    let top = -9;
    let bottom = 9;
    ts.forEach((t) => {
      top = Math.max(top, prof(4, t)[1]);
      bottom = Math.min(bottom, prof(4, t)[1]);
    });
    return new THREE.Vector3(0, shape.coreY ?? (top + bottom) / 2, 0);
  })();
  const coreSize = Math.max(...ts.map((t) => prof(4, t)[0]));
  if (shape.facets) coreMesh.position.copy(corePoint);
  else coreMesh.position.copy(corePoint).multiplyScalar(-0.3);
  coreMesh.scale.setScalar(1.3);
  coreUniforms.uCentre.value.copy(shape.facets ? new THREE.Vector3() : corePoint);
  coreUniforms.uRad.value = shape.facets ? 0.2 : coreSize;

  // Plinth and studio floor.
  const bottomY = Math.min(...ts.map((t) => prof(0, t)[1]));
  const seat = shape.foot * 0.42;
  const seatY = bottomY + 0.02 + (objectName === "planet" ? 0.09 : 0.06);
  const plinthH = 0.15;
  const floorY = seatY - plinthH - 0.09;
  const plinthMat = new THREE.MeshPhysicalMaterial({
    color: "#17191d", metalness: 0.95, roughness: 0.3, envMapIntensity: 1.1,
  });
  const plinthRing = new THREE.MeshBasicMaterial({ color: accent.clone() });
  const plinth = new THREE.Group();
  scene.add(plinth);
  {
    const f = shape.foot;
    const pts = [
      [0, seatY - 0.04], [seat * 0.9, seatY - 0.04], [seat, seatY], [seat + 0.03, seatY - 0.03],
      [seat + 0.05, seatY - 0.09], [f * 0.74, seatY - 0.14], [f * 0.76, seatY - plinthH],
      [f * 0.98, seatY - plinthH], [f, seatY - plinthH - 0.015], [f, floorY + 0.015],
      [f - 0.015, floorY],
    ].map(([r, y]) => new THREE.Vector2(r, y)).reverse();
    const mesh = new THREE.Mesh(new THREE.LatheGeometry(pts, 160), plinthMat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    plinth.add(mesh);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(f * 0.875, 0.0045, 8, 200), plinthRing,
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = seatY - plinthH + 0.002;
    plinth.add(ring);
  }

  const radial = (stops) => {
    const c = document.createElement("canvas");
    c.width = c.height = 512;
    const g = c.getContext("2d");
    const grad = g.createRadialGradient(256, 256, 0, 256, 256, 256);
    stops.forEach(([at, value]) => {
      const v = Math.round(value * 255);
      grad.addColorStop(at, `rgb(${v},${v},${v})`);
    });
    g.fillStyle = grad;
    g.fillRect(0, 0, 512, 512);
    return new THREE.CanvasTexture(c);
  };

  const floorMat = new THREE.MeshStandardMaterial({
    color: color(V.bgCenter).multiplyScalar(0.12),
    metalness: 0,
    roughness: 0.62,
    transparent: true,
    opacity: 0.93,
    alphaMap: radial([[0, 1], [0.12, 0.9], [0.3, 0.32], [0.5, 0], [1, 0]]),
    depthWrite: false,
    envMapIntensity: 0.03,
  });
  const floor = new THREE.Mesh(new THREE.CircleGeometry(15, 96), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = floorY;
  floor.receiveShadow = true;
  floor.renderOrder = 1;
  scene.add(floor);

  const contact = new THREE.Mesh(
    new THREE.CircleGeometry(shape.foot * 2.2, 64),
    new THREE.MeshBasicMaterial({
      color: "#000000",
      transparent: true,
      opacity: 0.8,
      alphaMap: radial([[0, 1], [0.42, 0.85], [1, 0]]),
      depthWrite: false,
    }),
  );
  contact.rotation.x = -Math.PI / 2;
  contact.position.y = floorY + 0.002;
  contact.renderOrder = 2;
  scene.add(contact);

  // Backdrop: a studio sweep with a pool of light behind the object.
  const fullscreen = new THREE.BufferGeometry();
  fullscreen.setAttribute(
    "position",
    new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3),
  );
  const screenVertex = `
    varying vec2 vUv;
    void main() {
      vUv = position.xy * 0.5 + 0.5;
      gl_Position = vec4(position.xy, 0.0, 1.0);
    }
  `;
  const bgUniforms = {
    uCentre: { value: new THREE.Vector2(0.5, 0.6) },
    uAspect: { value: W / H },
    uA: { value: color(V.bgCenter) },
    uB: { value: color(V.bgEdge) },
    uFlash: { value: 0 },
    uAccent: G.uAccent,
  };
  const backdrop = new THREE.Mesh(fullscreen, new THREE.ShaderMaterial({
    uniforms: bgUniforms,
    vertexShader: screenVertex,
    fragmentShader: `
      varying vec2 vUv;
      uniform vec2 uCentre;
      uniform float uAspect, uFlash;
      uniform vec3 uA, uB, uAccent;
      void main() {
        vec2 p = (vUv - uCentre) * vec2(uAspect, 1.0);
        float d = length(p);
        float pool = exp(-d * d * 5.5);
        vec3 c = mix(uB, uA, pool);
        c += uAccent * exp(-d * d * 14.0) * uFlash;
        gl_FragColor = vec4(c, 1.0);
      }
    `,
    depthTest: false,
    depthWrite: false,
  }));
  backdrop.frustumCulled = false;
  backdrop.renderOrder = -100;
  scene.add(backdrop);

  // ---------------------------------------------------------------- blade and sparks
  const reach = Math.max(shape.halfW, shape.halfH * 0.8);
  const bladeTilt = THREE.MathUtils.degToRad(-14);
  const bladeN = new THREE.Vector3(Math.cos(bladeTilt), Math.sin(bladeTilt), 0);
  G.uBladeN.value.copy(bladeN);
  const bladeNear = -reach * 1.25;
  const bladeFar = reach * 1.25;

  const bladeUniforms = {
    uAmp: { value: 0 },
    uAccent: G.uAccent,
  };
  const blade = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4, 26),
    new THREE.ShaderMaterial({
      uniforms: bladeUniforms,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uAmp;
        uniform vec3 uAccent;
        void main() {
          float x = (vUv.x - 0.5) * 2.4;
          float y = (vUv.y - 0.5) * 2.0;
          float core = exp(-x * x * 70000.0);
          float halo = exp(-x * x * 4000.0) * 0.5 + exp(-x * x * 120.0) * 0.02;
          float along = 1.0 - smoothstep(0.35, 1.0, abs(y));
          vec3 c = (uAccent * (halo + core * 5.0) + vec3(1.0) * core * 3.5) * along * uAmp;
          gl_FragColor = vec4(c, 1.0);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  blade.rotation.z = bladeTilt;
  blade.renderOrder = 10;
  scene.add(blade);

  let bladeFrom = -reach * 3;
  let bladeTo = reach * 3;
  const bladeAt = (t) => {
    if (t < when.bladeSweep) {
      return mix(bladeFrom, bladeNear, Math.pow(seg(t, when.bladeIn, when.bladeSweep - when.bladeIn), 2));
    }
    if (t < when.bladeEnd) {
      return mix(bladeNear, bladeFar, seg(t, when.bladeSweep, when.bladeEnd - when.bladeSweep));
    }
    return mix(bladeFar, bladeTo, Math.pow(seg(t, when.bladeEnd, 0.22 * unit), 1.6));
  };

  const yawEnd = THREE.MathUtils.degToRad(-15);
  const yawTurn = THREE.MathUtils.degToRad(68);
  const holdTurn = THREE.MathUtils.degToRad(num("holdTurn", 2, 0, 20));
  const yawAt = (t) => {
    const settle = out(seg(t, 0, when.lift + 0.1 * unit), 2.4);
    return yawEnd - yawTurn * (1 - settle) + holdTurn * Math.max(0, t - K);
  };

  const rnd = seeded(4117);
  const SPARKS = 620;
  const sparkPos = new Float32Array(SPARKS * 3);
  const sparkVel = new Float32Array(SPARKS * 3);
  const sparkLife = new Float32Array(SPARKS * 2);
  const sparkSize = new Float32Array(SPARKS);
  {
    const p = new THREE.Vector3();
    const firstCut = Math.floor(SPARKS * 0.42);
    for (let n = 0; n < SPARKS; n++) {
      let birth;
      let life;
      if (n < firstCut) {
        // Thrown off the seam as the blade crosses it.
        const pick = rnd();
        const a = cuts[0].a;
        if (pick < 0.34) {
          const phi = phiC + (rnd() * 2 - 1) * a;
          const t0 = tAtY(0, cuts[0].y);
          const [r, y] = prof(0, t0);
          p.set(r * plan(phi) * Math.cos(phi), y, r * plan(phi) * Math.sin(phi));
        } else {
          const t = mix(tAtY(0, cuts[0].y), 1, rnd());
          const [r, y] = prof(0, t);
          const phi = phiC + (pick < 0.67 ? a : -a);
          p.set(r * plan(phi) * Math.cos(phi), y, r * plan(phi) * Math.sin(phi));
        }
        let tc = when.bladeEnd;
        for (let s = 0; s <= 90; s++) {
          const probe = mix(when.bladeSweep, when.bladeEnd, s / 90);
          const q = p.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), yawAt(probe));
          if (q.dot(bladeN) <= bladeAt(probe)) {
            tc = probe;
            break;
          }
        }
        p.applyAxisAngle(new THREE.Vector3(0, 1, 0), yawAt(tc));
        birth = tc + rnd() * 0.05;
        life = 0.28 + rnd() * 0.42;
        const out3 = p.clone().normalize();
        sparkVel[n * 3] = out3.x * 0.7 + bladeN.x * (0.4 + rnd() * 1.5) + (rnd() - 0.5) * 0.9;
        sparkVel[n * 3 + 1] = out3.y * 0.7 + (rnd() - 0.2) * 1.4;
        sparkVel[n * 3 + 2] = out3.z * 0.7 + rnd() * 1.1;
      } else {
        // Thrown out of the core at ignition, then a slow drift of embers through the hold.
        const burst = n < firstCut + (SPARKS - firstCut) * 0.62;
        const dir = new THREE.Vector3(rnd() * 2 - 1, rnd() * 1.1, rnd() * 1.1 + 0.1).normalize();
        const speed = burst ? 0.9 + rnd() * 2.6 : 0.12 + rnd() * 0.3;
        p.copy(corePoint).addScaledVector(dir, coreSize * (0.6 + rnd() * 0.4));
        p.applyAxisAngle(new THREE.Vector3(0, 1, 0), yawEnd);
        dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), yawEnd);
        birth = burst ? K + rnd() * 0.06 : K + rnd() * Math.max(0.4, T.hold + T.exit);
        life = burst ? 0.35 + rnd() * 0.55 : 0.8 + rnd() * 0.7;
        sparkVel[n * 3] = dir.x * speed;
        sparkVel[n * 3 + 1] = dir.y * speed;
        sparkVel[n * 3 + 2] = dir.z * speed;
      }
      p.toArray(sparkPos, n * 3);
      sparkLife[n * 2] = birth;
      sparkLife[n * 2 + 1] = life;
      sparkSize[n] = 0.012 + rnd() * rnd() * 0.03;
    }
  }
  const sparkGeo = new THREE.BufferGeometry();
  sparkGeo.setAttribute("position", new THREE.BufferAttribute(sparkPos, 3));
  sparkGeo.setAttribute("aVel", new THREE.BufferAttribute(sparkVel, 3));
  sparkGeo.setAttribute("aLife", new THREE.BufferAttribute(sparkLife, 2));
  sparkGeo.setAttribute("aSize", new THREE.BufferAttribute(sparkSize, 1));
  const sparkUniforms = {
    uT: { value: 0 },
    uScale: { value: 1 },
    uAccent: G.uAccent,
  };
  const sparks = new THREE.Points(sparkGeo, new THREE.ShaderMaterial({
    uniforms: sparkUniforms,
    vertexShader: `
      attribute vec3 aVel;
      attribute vec2 aLife;
      attribute float aSize;
      uniform float uT, uScale;
      varying float vA;
      void main() {
        float age = uT - aLife.x;
        float a = age / aLife.y;
        vA = (a < 0.0 || a > 1.0) ? 0.0 : 1.0 - a;
        vec3 p = position + aVel * age * (1.0 - 0.3 * a);
        p.y -= 0.8 * age * age;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = vA > 0.0 ? max(1.5, aSize * uScale * (0.45 + 0.55 * vA) / -mv.z) : 0.0;
      }
    `,
    fragmentShader: `
      varying float vA;
      uniform vec3 uAccent;
      void main() {
        if (vA <= 0.0) discard;
        float d = length(gl_PointCoord - 0.5) * 2.0;
        float s = exp(-d * d * 4.5);
        vec3 c = mix(uAccent, vec3(1.0, 0.95, 0.85), vA * vA) * (2.0 + 9.0 * vA);
        gl_FragColor = vec4(c * s * vA, 1.0);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }));
  sparks.frustumCulled = false;
  sparks.renderOrder = 11;
  scene.add(sparks);

  const shockUniforms = { uP: { value: 0 }, uAmp: { value: 0 }, uAccent: G.uAccent };
  const shock = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.ShaderMaterial({
      uniforms: shockUniforms,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uP, uAmp;
        uniform vec3 uAccent;
        void main() {
          float d = length(vUv - 0.5) * 2.0;
          float w = mix(0.006, 0.02, uP);
          float ring = exp(-pow((d - uP) / w, 2.0)) + 0.14 * exp(-pow((d - uP) / (w * 6.0), 2.0));
          gl_FragColor = vec4(uAccent * 1.5 * ring * uAmp, 1.0);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
    }),
  );
  shock.renderOrder = 12;
  scene.add(shock);

  // ---------------------------------------------------------------- layout
  const side = compact ? (variant === "top" ? 60 : 44) : 64;
  const safeTop = compact ? Number(safe.top) || 40 : 230;
  const safeBottom = compact ? Number(safe.bottom) || 36 : 300;
  const titleEl = $("cw-title");
  function setTitle(x, y, size, width) {
    titleEl.textContent = String(V.title || "");
    titleEl.style.cssText =
      `left:${x}px;top:${y}px;color:${V.ink};font-size:${size}px;white-space:nowrap`;
    fit(titleEl, width, minText);
    if (titleEl.scrollWidth > width + 0.5) {
      titleEl.style.whiteSpace = "normal";
      titleEl.style.width = `${width}px`;
    }
    return titleEl.getBoundingClientRect().height;
  }

  const heroEl = $("cw-hero");
  const measure = document.createElement("canvas").getContext("2d");
  measure.font = "400 100px Anton";

  function splitLines(words, count) {
    let best = null;
    const walk = (start, left, lines) => {
      if (left === 1) {
        const all = [...lines, words.slice(start).join(" ")];
        const widest = Math.max(...all.map((l) => measure.measureText(l.toUpperCase()).width));
        if (!best || widest < best.widest) best = { all, widest };
        return;
      }
      for (let cut = start + 1; cut <= words.length - left + 1; cut++) {
        walk(cut, left - 1, [...lines, words.slice(start, cut).join(" ")]);
      }
    };
    walk(0, count, []);
    return best;
  }

  // The hero is sized for its peak stamp scale, so it never leaves the margins.
  const heroPeak = 1.06;
  const leading = 1.1;
  const heroWords = String(V.finalLabel || "").trim().split(/\s+/).filter(Boolean);
  function fitHero(width, height, max) {
    let best = null;
    for (let count = 1; count <= Math.min(3, heroWords.length); count++) {
      const split = splitLines(heroWords, count);
      if (!split) continue;
      const size = Math.min(
        max,
        width / heroPeak / split.widest * 100 * 0.99,
        height / heroPeak / (count * leading),
      );
      if (!best || size > best.size) best = { ...split, size };
    }
    return best;
  }

  let layout;
  let heroBest = null;

  if (!compact) {
    setTitle(side, safeTop, 86, W - side * 2);
    // Rows land large in the space under the object. A long hero takes some of it back,
    // because the hero always stays the biggest thing on screen.
    const rowTop = 975;
    const bottomLine = H - safeBottom;
    let rowStep = 96;
    for (const step of [96, 88, 80, 74]) {
      rowStep = step;
      const top = rowTop + 5 * step + 8;
      heroBest = fitHero(W - side * 2, bottomLine - top, 176);
      if (!heroBest || heroBest.size >= Math.round(step * 0.74) * 1.2) break;
    }
    const heroY = rowTop + 5 * rowStep + 8;
    layout = {
      kind: "under",
      titleY: safeTop,
      rowX: side, rowTop, rowStep, rowFont: Math.round(rowStep * 0.74), swatch: 34,
      heroX: side, heroY, heroW: W - side * 2, heroH: bottomLine - heroY,
      open: { sx: W / 2, sy: 800, scale: 0.68 },
      end: { sx: W / 2, sy: 575, scale: 1 },
    };
  } else {
    const colX = Math.round(W * 0.6);
    const heroH = Math.round(H * 0.21);
    const heroY = H - safeBottom - heroH;
    const titleSize = H < 780 ? 40 : 50;
    const titleY = variant === "top" ? Math.min(safeTop, H * 0.125) : safeTop;
    const titleH = setTitle(colX, titleY, titleSize, W - side - colX);
    const rowTop = titleY + titleH + 20;
    const rowStep = Math.floor((heroY - 16 - rowTop) / 5);
    heroBest = fitHero(W - side * 2, heroH, 170);
    layout = {
      kind: "side",
      titleY,
      rowX: colX, rowTop, rowStep, rowFont: clamp(rowStep * 0.56, 32, 54),
      swatch: 22, rowW: W - side - colX - 34,
      heroX: side, heroY, heroW: W - side * 2, heroH,
      open: { sx: colX * 0.5, sy: heroY * 0.54, scale: 0.68 },
      end: { sx: colX * 0.47, sy: heroY * 0.52, scale: 0.84 },
    };
  }

  // Pixels per world unit, set from the frame so each object fills the same space.
  const unitPx = !compact
    ? 520 / Math.max(shape.halfW, shape.halfH * 0.86)
    : Math.min(layout.heroY * 0.5, W * 0.3) / Math.max(shape.halfW, shape.halfH * 0.92) * 1.32;
  const edgeWorld = W / 2 / (unitPx * layout.open.scale);
  bladeFrom = -edgeWorld * 1.04;
  bladeTo = edgeWorld * 1.5;
  const focalPx = 2500 * (compact ? 0.86 : 1);
  const camera = new THREE.PerspectiveCamera(
    THREE.MathUtils.radToDeg(2 * Math.atan(H / (2 * focalPx))), W / H, 0.1, 80,
  );

  const target = new THREE.Vector3();
  const elevOpen = THREE.MathUtils.degToRad(9);
  const elevEnd = THREE.MathUtils.degToRad(compact ? 30 : 33);

  function push(t) {
    let stepped = 0;
    labelAt.forEach((at) => {
      stepped += smooth(seg(t, at - 0.16 * unit, 0.46 * unit));
    });
    return clamp(
      0.5 * smooth(seg(t, when.pushFrom, K - when.pushFrom)) + 0.5 * stepped / 5,
    );
  }

  const worldPoint = new THREE.Vector3();
  const axisY = new THREE.Vector3(0, 1, 0);
  let coreScreen = { x: W / 2, y: H / 2 };
  let frameTime = null;

  function project(point) {
    const p = worldPoint.copy(point).project(camera);
    return { x: (p.x + 1) * W / 2, y: (1 - p.y) * H / 2 };
  }

  function updateScene(time) {
    const t = designTime(time);
    const h = Math.max(0, time - T.key);
    const after = time >= T.key - EPS;
    const kick = after ? Math.exp(-h * 7.5) : 0;

    G.uTime.value = t;

    // Object.
    body.rotation.y = yawAt(t);
    const crack = out(seg(t, when.lift, 0.42 * unit), 3);
    const fly = Math.pow(seg(t, when.lift + 0.24 * unit, when.liftEnd - when.lift - 0.24 * unit), 2.5);
    wedge.visible = fly < 0.999;
    wedge.position.set(0, 0.05 * crack + 0.2 * crack + 4.6 * fly, 0.03 * crack + 2.6 * fly);
    wedge.rotation.set(fly * 1.05, 0, -fly * 0.35);
    root.scale.setScalar(1 + (num("keyPunch", 1.05, 1, 1.2) - 1) * kick);

    // Camera.
    const p = push(t);
    const open = layout.open;
    const end = layout.end;
    const ease = 0.55 * smooth(seg(t, when.lift - 0.2 * unit, 0.95 * unit)) +
      0.45 * smooth(seg(t, labelAt[0], K - labelAt[0]));
    const sx = mix(open.sx, end.sx, ease);
    const sy = mix(open.sy, end.sy, ease);
    const scale = mix(open.scale, end.scale * (shape.zoom || 1), p);
    const ppu = unitPx * scale * (1 + 0.035 * kick);
    const dist = focalPx / ppu;
    const elev = mix(elevOpen, elevEnd, smooth(seg(t, when.lift - 0.3 * unit, 1.5 * unit)));
    const az = THREE.MathUtils.degToRad(mix(-5, 0, smooth(seg(t, 0, K))));
    target.set(0, corePoint.y * smooth(p), 0);
    camera.position.set(
      target.x + Math.sin(az) * Math.cos(elev) * dist,
      target.y + Math.sin(elev) * dist,
      target.z + Math.cos(az) * Math.cos(elev) * dist,
    );
    camera.lookAt(target);
    camera.setViewOffset(W, H, W / 2 - sx, H / 2 - sy, W, H);
    camera.updateMatrixWorld();

    // Blade.
    // The blade stays a crisp line: it reads the frame's time, never the shutter's.
    const bladeT = designTime(frameTime === null ? time : frameTime);
    const bladeD = bladeAt(bladeT);
    const bladeOn = seg(bladeT, when.bladeIn, 0.14 * unit) *
      (1 - seg(bladeT, when.bladeEnd + 0.1 * unit, 0.12 * unit));
    G.uBladeD.value = bladeD;
    G.uBladeAmp.value = bladeOn;
    blade.position.copy(bladeN).multiplyScalar(bladeD);
    blade.position.z = 0;
    blade.visible = bladeOn > 0.001;
    bladeUniforms.uAmp.value = bladeOn;

    G.uSeam.value = 1 - seg(t, when.lift + 0.1 * unit, 0.6 * unit) * 0.92;

    // Light in the section.
    const lifted = seg(t, when.lift, 0.7 * unit);
    const charge = smooth(seg(t, when.charge, K - when.charge));
    const breath = 0.5 + 0.5 * Math.sin(h * 3.4);
    const held = after ? 1 : 0;

    let power = 0.34 * lifted + 0.5 * smooth(seg(t, when.lift, K - when.lift));
    power += charge * 0.5;
    if (after) power = (shape.coreGain || 1) * (1.15 + 0.42 * breath) + 6 * Math.exp(-h * 9);
    coreUniforms.uPower.value = power * mix(0.7, 1, lifted);
    coreUniforms.uHeatUp.value = Math.max(after ? 1 : 0, charge * 0.5);

    coreLight.position.copy(corePoint).applyAxisAngle(axisY, 0).multiplyScalar(root.scale.x);
    coreLight.position.y += coreSize * 0.5;
    coreLight.intensity = after
      ? 2.4 + 0.6 * breath + 16 * Math.exp(-h * 8)
      : (0.6 * lifted + 1.2 * charge);

    if (!after) {
      G.uFront.value = mix(5.5, 1.0, charge);
      G.uRip.value = charge > 0 ? 0.7 * Math.sin(Math.PI * clamp(charge * 1.02)) : 0;
      G.uHeat.value = 0;
    } else {
      G.uFront.value = 1 + h * 8.5;
      G.uRip.value = 2.6 * Math.exp(-h * 1.4);
      G.uHeat.value = 1;
    }
    G.uInlay.value = (0.25 * lifted) + held * (0.7 + 2.5 * Math.exp(-h * 3));
    G.uTravel.value = held * seg(h, 0.12, 0.3) * 1.1 + 0.25 * lifted;

    focus.forEach((f, i) => {
      const at = labelAt[i];
      f.value = t >= at ? Math.exp(-(t - at) * 3.6 / unit) * (1 - charge) : 0;
    });

    // Studio light drifts so highlights crawl over the machined faces.
    const drift = 0.32 * smooth(seg(t, when.lift, K - when.lift)) + (after ? h * 0.14 : 0);
    scene.environmentRotation.y = -0.45 + drift;
    glint.position.set(Math.cos(drift * 7) * 6, 7, Math.sin(drift * 7) * 3 + 8);
    glint.intensity = 0.8 * lifted;

    plinthRing.color.copy(accent).multiplyScalar(1 - seg(t, when.lift, 0.5 * unit));

    sparkUniforms.uT.value = t;
    sparkUniforms.uScale.value = renderer.getPixelRatio() * focalPx;

    shock.position.copy(corePoint).applyAxisAngle(axisY, body.rotation.y);
    shock.quaternion.copy(camera.quaternion);
    shock.scale.setScalar(Math.max(shape.halfW, shape.halfH * 0.8) * 2.3);
    shock.visible = after && h < 0.5;
    shockUniforms.uP.value = mix(0.1, 1, out(seg(h, 0, 0.5), 1.6));
    shockUniforms.uAmp.value = Math.pow(1 - seg(h, 0, 0.5), 2);

    scene.updateMatrixWorld(true);
    coreScreen = project(shock.position);
    bgUniforms.uCentre.value.set(coreScreen.x / W, 1 - coreScreen.y / H);
    bgUniforms.uFlash.value = kick * 0.1 + (after ? 0.02 + 0.008 * breath : 0);
  }

  // ---------------------------------------------------------------- post
  const sizeBuf = renderer.getDrawingBufferSize(new THREE.Vector2());
  const hdrType = renderer.extensions.has("EXT_color_buffer_float") ||
    renderer.extensions.has("EXT_color_buffer_half_float")
    ? THREE.HalfFloatType
    : THREE.UnsignedByteType;
  const sceneRT = new THREE.WebGLRenderTarget(sizeBuf.x, sizeBuf.y, {
    type: hdrType, samples: 4, depthBuffer: true,
  });
  const sumRT = new THREE.WebGLRenderTarget(sizeBuf.x, sizeBuf.y, {
    type: hdrType, depthBuffer: false,
  });
  const mips = [];
  {
    let mw = sizeBuf.x;
    let mh = sizeBuf.y;
    for (let i = 0; i < 6; i++) {
      mw = Math.max(2, Math.round(mw / 2));
      mh = Math.max(2, Math.round(mh / 2));
      mips.push(new THREE.WebGLRenderTarget(mw, mh, { type: hdrType, depthBuffer: false }));
    }
  }

  const quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quadScene = new THREE.Scene();
  const quad = new THREE.Mesh(fullscreen);
  quad.frustumCulled = false;
  quadScene.add(quad);

  const passMaterial = (fragmentShader, uniforms, extra = {}) =>
    new THREE.ShaderMaterial({
      uniforms,
      vertexShader: screenVertex,
      fragmentShader,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
      ...extra,
    });

  const accumulate = passMaterial(`
    varying vec2 vUv;
    uniform sampler2D tex;
    uniform float weight;
    void main() { gl_FragColor = vec4(texture2D(tex, vUv).rgb * weight, weight); }
  `, { tex: { value: sceneRT.texture }, weight: { value: 1 } }, {
    transparent: true,
    blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneFactor,
    blendEquationAlpha: THREE.AddEquation,
    blendSrcAlpha: THREE.OneFactor,
    blendDstAlpha: THREE.OneFactor,
  });

  const brightPass = passMaterial(`
    varying vec2 vUv;
    uniform sampler2D tex;
    uniform vec2 texel;
    void main() {
      vec3 c = vec3(0.0);
      c += texture2D(tex, vUv + texel * vec2(-1.0, -1.0)).rgb;
      c += texture2D(tex, vUv + texel * vec2(1.0, -1.0)).rgb;
      c += texture2D(tex, vUv + texel * vec2(-1.0, 1.0)).rgb;
      c += texture2D(tex, vUv + texel * vec2(1.0, 1.0)).rgb;
      c = min(c * 0.25, vec3(40.0));
      float l = max(max(c.r, c.g), c.b);
      float knee = smoothstep(1.5, 3.4, l);
      gl_FragColor = vec4(c * knee, 1.0);
    }
  `, { tex: { value: null }, texel: { value: new THREE.Vector2() } });

  const downPass = passMaterial(`
    varying vec2 vUv;
    uniform sampler2D tex;
    uniform vec2 texel;
    void main() {
      vec3 c = texture2D(tex, vUv).rgb * 4.0;
      c += texture2D(tex, vUv + texel * vec2(-1.0, -1.0)).rgb;
      c += texture2D(tex, vUv + texel * vec2(1.0, -1.0)).rgb;
      c += texture2D(tex, vUv + texel * vec2(-1.0, 1.0)).rgb;
      c += texture2D(tex, vUv + texel * vec2(1.0, 1.0)).rgb;
      gl_FragColor = vec4(c / 8.0, 1.0);
    }
  `, { tex: { value: null }, texel: { value: new THREE.Vector2() } });

  const upPass = passMaterial(`
    varying vec2 vUv;
    uniform sampler2D tex;
    uniform vec2 texel;
    uniform float gain;
    void main() {
      vec3 c = vec3(0.0);
      c += texture2D(tex, vUv + texel * vec2(-1.0, 0.0)).rgb * 2.0;
      c += texture2D(tex, vUv + texel * vec2(1.0, 0.0)).rgb * 2.0;
      c += texture2D(tex, vUv + texel * vec2(0.0, 1.0)).rgb * 2.0;
      c += texture2D(tex, vUv + texel * vec2(0.0, -1.0)).rgb * 2.0;
      c += texture2D(tex, vUv + texel * vec2(-1.0, -1.0)).rgb;
      c += texture2D(tex, vUv + texel * vec2(1.0, -1.0)).rgb;
      c += texture2D(tex, vUv + texel * vec2(-1.0, 1.0)).rgb;
      c += texture2D(tex, vUv + texel * vec2(1.0, 1.0)).rgb;
      gl_FragColor = vec4(c / 12.0 * gain, 1.0);
    }
  `, { tex: { value: null }, texel: { value: new THREE.Vector2() }, gain: { value: 1 } }, {
    transparent: true,
    blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneFactor,
  });

  const present = passMaterial(`
    varying vec2 vUv;
    uniform sampler2D tex;
    uniform sampler2D glowTex;
    uniform float glow;
    void main() {
      vec3 c = texture2D(tex, vUv).rgb + texture2D(glowTex, vUv).rgb * glow;
      gl_FragColor = vec4(c, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `, {
    tex: { value: sumRT.texture },
    glowTex: { value: mips[0].texture },
    glow: { value: 1 },
  }, { toneMapped: true });

  function runPass(material, targetRT) {
    quad.material = material;
    renderer.setRenderTarget(targetRT);
    renderer.render(quadScene, quadCamera);
  }

  const glowAmount = num("glow", 1, 0, 3);
  const requestedSamples = Math.round(num("temporalSamples", 8, 1, 16));
  const shutter = num("shutterAngle", 150, 0, 360) / 360 / fps;

  function renderFrame(time) {
    const t = designTime(time);
    const h = time - T.key;
    const fast =
      (t >= when.bladeSweep - 0.05 && t < when.lift + 1.1 * unit) ||
      (h >= -0.02 && h < 0.16);
    const samples = fast && shutter > 0 ? requestedSamples : 1;
    const isAfter = time >= T.key - EPS;
    frameTime = time;

    renderer.setRenderTarget(sumRT);
    renderer.setClearColor(0x000000, 0);
    renderer.clear();
    accumulate.uniforms.weight.value = 1 / samples;

    for (let i = 0; i < samples; i++) {
      let at = samples === 1
        ? time
        : Math.max(0, time + ((i + 0.5) / samples - 0.5) * shutter);
      // The shutter never reaches across the key moment, so it lands on one exact frame.
      if (isAfter) at = Math.max(at, T.key);
      else at = Math.min(at, T.key - 0.0005);
      updateScene(at);
      renderer.setRenderTarget(sceneRT);
      renderer.clear();
      renderer.render(scene, camera);
      accumulate.uniforms.tex.value = sceneRT.texture;
      quad.material = accumulate;
      renderer.setRenderTarget(sumRT);
      renderer.render(quadScene, quadCamera);
    }

    brightPass.uniforms.tex.value = sumRT.texture;
    brightPass.uniforms.texel.value.set(1 / sizeBuf.x, 1 / sizeBuf.y);
    runPass(brightPass, mips[0]);
    for (let i = 1; i < mips.length; i++) {
      downPass.uniforms.tex.value = mips[i - 1].texture;
      downPass.uniforms.texel.value.set(1 / mips[i - 1].width, 1 / mips[i - 1].height);
      runPass(downPass, mips[i]);
    }
    for (let i = mips.length - 1; i > 0; i--) {
      upPass.uniforms.tex.value = mips[i].texture;
      upPass.uniforms.texel.value.set(1 / mips[i].width, 1 / mips[i].height);
      upPass.uniforms.gain.value = 0.92;
      runPass(upPass, mips[i - 1]);
    }
    const key = isAfter ? Math.exp(-Math.max(0, h) * 6) : 0;
    present.uniforms.glow.value = glowAmount * (0.62 + key * 0.25);
    runPass(present, null);
    updateScene(time);
  }

  // ---------------------------------------------------------------- type
  const leaders = $("cw-leaders");
  leaders.setAttribute("viewBox", `0 0 ${W} ${H}`);
  const svgNS = "http://www.w3.org/2000/svg";
  const svgEl = (tag, attrs) => {
    const el = document.createElementNS(svgNS, tag);
    for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);
    leaders.appendChild(el);
    return el;
  };

  const anchorLocal = [];

  const rowsEl = $("cw-rows");
  const rows = [0, 1, 2, 3, 4].map((i) => {
    const y = layout.rowTop + i * layout.rowStep;
    const el = make("div", "cw-row", rowsEl);
    el.style.cssText =
      `left:${layout.rowX - 6}px;top:${y}px;width:${W - layout.rowX + 6 - (compact ? side - 6 : 0)}px;` +
      `height:${layout.rowStep}px;visibility:hidden`;
    const inner = make("div", "cw-row-inner", el);
    inner.setAttribute("data-layout-allow-overflow", "");
    inner.style.left = "6px";
    inner.style.bottom = `${Math.round(layout.rowStep * 0.1)}px`;
    const swatch = make("span", "cw-swatch", inner);
    swatch.style.cssText =
      `width:${layout.swatch}px;height:${layout.swatch}px;margin-right:${compact ? 12 : 18}px;` +
      `background:${i === 4 ? V.accent : layerColors[i]};` +
      `border:${compact ? 2 : 3}px solid ${rgba(V.ink, 0.85)}`;
    const name = make("span", "cw-name", inner, String(V[`layer${i + 1}`] || ""));
    name.style.color = V.ink;

    const casing = svgEl("path", {
      fill: "none", stroke: "#000000", "stroke-opacity": "0.55",
      "stroke-width": compact ? "5" : "6", "stroke-linecap": "round", "stroke-linejoin": "round",
    });
    const line = svgEl("path", {
      fill: "none", stroke: V.muted,
      "stroke-width": compact ? "2.4" : "2.8", "stroke-linecap": "round", "stroke-linejoin": "round",
    });
    const halo = svgEl("circle", { fill: "none", stroke: V.accent, "stroke-width": "3" });
    const dot = svgEl("circle", { fill: V.ink, stroke: "#000000", "stroke-width": "2" });
    return { i, y, el, inner, swatch, name, casing, line, halo, dot };
  });

  // Each label takes the size that fits it, so a long one shrinks alone. Its rule then
  // ends clear of its text, and each rule ends further out than the one above.
  updateScene(T.key);
  // The fan starts from the part of the core you can see: its surface above the last floor.
  const coreRadius = coreSize * 1.3;
  const fanLift = Math.max(cuts[3].y - corePoint.y, 0) + coreRadius * 0.25;
  const fanLocal = new THREE.Vector3(
    0,
    corePoint.y + fanLift,
    Math.sqrt(Math.max(coreRadius * coreRadius - fanLift * fanLift, 0)),
  );
  const fan = project(body.localToWorld(fanLocal.clone()));
  const ruleEnds = [];
  rows.forEach((row) => {
    const { i } = row;
    row.name.style.fontSize = `${layout.rowFont}px`;
    if (layout.kind !== "under") {
      fit(row.name, layout.rowW, minText);
      ruleEnds.push(layout.rowX - 14);
      return;
    }
    const textX = layout.rowX + layout.swatch + 18;
    const pad = 34;
    const furthest = W - 80 - (4 - i) * 74;
    fit(row.name, furthest - pad - textX, minText);
    const textEnd = textX + row.name.getBoundingClientRect().width;
    // Short labels spread the fan evenly: -6 degrees to 26.5 degrees either side of straight down.
    const fanAngle = THREE.MathUtils.degToRad(mix(-6, 26.5, i / 4));
    const base = fan.x + (row.y + layout.rowStep - 3 - fan.y) * Math.tan(fanAngle);
    const previous = i > 0 ? ruleEnds[i - 1] + 64 : 0;
    ruleEnds.push(Math.min(furthest, Math.max(base, textEnd + pad, previous)));
  });
  const ruleEnd = (i) => ruleEnds[i];

  // Every leader is a ray out of the core, so no two can cross, and each one crosses only
  // the rings outside its own, at the shortest path. The attach point is found by walking
  // that ray over the key frame until it is on the layer's own cut face.
  const caster = new THREE.Raycaster();
  const castAt = new THREE.Vector2();
  const faceMeshes = body.children.filter((o) => o.isMesh && o.userData.face !== undefined);
  const coreBall = new THREE.Sphere(shock.position.clone(), coreRadius);
  const ballHit = new THREE.Vector3();

  function castFrom(x, y) {
    castAt.set(x / W * 2 - 1, 1 - y / H * 2);
    caster.setFromCamera(castAt, camera);
    return caster;
  }

  rows.forEach((row) => {
    const { i } = row;
    if (i === 4) {
      anchorLocal[i] = fanLocal.clone();
      return;
    }
    const ex = ruleEnds[i];
    const ey = row.y + layout.rowStep - 3;
    const length = Math.hypot(ex - fan.x, ey - fan.y);
    const dx = (ex - fan.x) / length;
    const dy = (ey - fan.y) / length;
    const run = [];
    for (let s = 4; s < length; s += 3) {
      const c = castFrom(fan.x + dx * s, fan.y + dy * s);
      const hits = c.intersectObjects(faceMeshes, false);
      const ball = c.ray.intersectSphere(coreBall, ballHit);
      const coreInFront = ball && (!hits.length || ball.distanceTo(c.ray.origin) < hits[0].distance);
      if (!coreInFront && hits.length && hits[0].object.userData.face === i) {
        run.push(hits[0].point.clone());
      } else if (run.length) {
        break;
      }
    }
    if (run.length) {
      anchorLocal[i] = body.worldToLocal(run[Math.floor(run.length / 2)]);
    } else {
      const { y } = cuts[i];
      const r = (prof(i, tAtY(i, y))[0] + prof(i + 1, tAtY(i + 1, y))[0]) / 2;
      anchorLocal[i] = new THREE.Vector3(0, y, r * plan(phiC));
    }
  });

  heroEl.style.cssText =
    `left:${layout.heroX}px;top:${layout.heroY}px;width:${layout.heroW}px;height:${layout.heroH}px;` +
    `display:flex;flex-direction:column;justify-content:flex-end;visibility:hidden`;
  (heroBest ? heroBest.all : []).forEach((text) => {
    const line = make("span", "cw-hero-line", heroEl, text);
    line.style.fontSize = `${Math.floor(heroBest.size)}px`;
    line.style.lineHeight = String(leading);
  });

  const anchorWorld = new THREE.Vector3();

  function updateType(time) {
    const t = designTime(time);
    const h = Math.max(0, time - T.key);
    const after = time >= T.key - EPS;
    const kick = after ? Math.exp(-h * 7.5) : 0;

    rows.forEach((row) => {
      const { i } = row;
      const at = labelAt[i];
      const on = i === 4 ? after : t >= at;
      const vis = on ? "visible" : "hidden";
      row.el.style.visibility = vis;
      row.casing.style.visibility = vis;
      row.line.style.visibility = vis;
      row.dot.style.visibility = vis;
      row.halo.style.visibility = vis;
      if (!on) return;

      const elapsed = i === 4 ? 1 : seg(t, at, 0.26 * unit);
      const lineP = i === 4 ? 1 : out(seg(t, at, 0.3 * unit), 3);
      row.inner.style.transform =
        `translateY(${((1 - out(elapsed, 4)) * layout.rowStep).toFixed(2)}px)`;

      anchorWorld.copy(anchorLocal[i]).applyMatrix4(body.matrixWorld);
      const a = project(anchorWorld);
      const ruleY = row.y + layout.rowStep - 3;
      const px = compact ? W - side : layout.rowX;
      const ex = ruleEnd(i);
      const d = `M ${px} ${ruleY} L ${ex} ${ruleY} L ${a.x.toFixed(2)} ${a.y.toFixed(2)}`;
      const length = Math.abs(ex - px) + Math.hypot(a.x - ex, a.y - ruleY);
      for (const path of [row.casing, row.line]) {
        path.setAttribute("d", d);
        path.style.strokeDasharray = `${length} ${length}`;
        path.style.strokeDashoffset = String(length * (1 - lineP));
      }
      const landed = lineP > 0.92;
      row.dot.style.visibility = landed ? "visible" : "hidden";
      row.dot.setAttribute("cx", a.x.toFixed(2));
      row.dot.setAttribute("cy", a.y.toFixed(2));
      const pulse = Math.max(0, 1 - seg(t, at + 0.2 * unit, 0.4 * unit));
      row.dot.setAttribute("r", String((compact ? 6.5 : 8) + pulse * 3));
      row.halo.setAttribute("cx", a.x.toFixed(2));
      row.halo.setAttribute("cy", a.y.toFixed(2));
      row.halo.setAttribute("r", String(10 + (1 - pulse) * 26));
      row.halo.style.opacity = landed ? String(pulse * 0.9) : "0";

      // Each row answers the ripple as it passes through its ring.
      if (after) {
        const hit = (4 - i) * 0.07;
        const flash = h >= hit ? Math.exp(-(h - hit) * 7) : 0;
        row.name.style.color = flash > 0.3 ? V.accent : V.ink;
        row.swatch.style.transform = `scale(${(1 + flash * 0.45).toFixed(4)})`;
      } else {
        row.name.style.color = V.ink;
        row.swatch.style.transform = "scale(1)";
      }
    });

    heroEl.style.visibility = after ? "visible" : "hidden";
    if (after) {
      const land = back(seg(h, 0, 0.2), 2.2);
      const scale = mix(heroPeak, 1, land);
      heroEl.style.transform = `scale(${scale.toFixed(4)})`;
      heroEl.style.color = h < 0.14 ? V.accent : V.ink;
    }
    if (!compact) {
      const gone = Math.pow(seg(t, 1.3 * unit, 0.55 * unit), 2.4);
      titleEl.style.transform = `translateY(${(-gone * (layout.titleY + 160)).toFixed(2)}px)`;
      titleEl.style.visibility = gone >= 1 ? "hidden" : "visible";
    }
  }

  function updateAperture(time) {
    const open = variant === "overlay" ? out(seg(time, 0, 0.26), 3) : 1;
    const exitDuration = Math.max(0, T.exit - 1 / fps);
    let closed = T.exit > 0 ? seg(time, T.key + T.hold, exitDuration) : 0;
    if (closed > 1 - 0.0000001) closed = 1;
    if (open >= 0.999999 && closed === 0) {
      stageEl.style.clipPath = "none";
    } else {
      const radius = Math.hypot(W, H) * open * (1 - closed * closed);
      stageEl.style.clipPath =
        `circle(${Math.max(0, radius).toFixed(3)}px at ${coreScreen.x.toFixed(2)}px ${coreScreen.y.toFixed(2)}px)`;
    }
  }

  function renderAt(time) {
    const now = Math.max(0, Number(time) || 0);
    renderFrame(now);
    updateType(now);
    updateAperture(now);
  }

  window.addEventListener("hf-seek", (event) => renderAt(event.detail.time));
  renderAt(window.__hfThreeTime || 0);
  window.__timelines["block"] = gsap.timeline({ paused: true });
});
