import * as THREE from "three";

CA.ready(() => {
  // Colours are authored and blended in display space, so a picked hex is the hex on screen.
  THREE.ColorManagement.enabled = false;

  const { vars: V, stage: S, safe, time: T, variant, make, rgba, seeded } = CA;

  const $ = (id) => document.getElementById(id);
  const W = S.w;
  const H = S.h;
  const compact = variant !== "full";
  const K = T.design;
  const EPS = 0.000001;
  const TAU = Math.PI * 2;
  const stageEl = $("stage");

  const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
  const lerp = (a, b, p) => a + (b - a) * p;
  const seg = (t, at, duration) =>
    duration <= 0 ? (t >= at ? 1 : 0) : clamp((t - at) / duration);
  const out = (p, power = 3) => 1 - Math.pow(1 - p, power);
  const smooth = (p) => p * p * (3 - 2 * p);
  const designTime = (time) =>
    time >= T.key - EPS ? K + Math.max(0, time - T.key) : time / T.scale;

  const color = (hex) => new THREE.Color(hex);
  const mixed = (a, b, p) => color(a).lerp(color(b), clamp(p));
  const css = (c) => "#" + c.getHexString();
  const luma = (c) => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;

  // Monotone cubic through [time, value] pairs: no overshoot between keys, speed carries through them.
  function track(points) {
    const xs = points.map((p) => p[0]);
    const ys = points.map((p) => p[1]);
    const n = xs.length;
    const d = [];
    for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
    const m = new Array(n).fill(0);
    m[0] = d[0];
    m[n - 1] = d[n - 2];
    for (let i = 1; i < n - 1; i++) {
      m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
    }
    for (let i = 0; i < n - 1; i++) {
      if (d[i] === 0) {
        m[i] = 0;
        m[i + 1] = 0;
        continue;
      }
      const a = m[i] / d[i];
      const b = m[i + 1] / d[i];
      const s = a * a + b * b;
      if (s > 9) {
        const tau = 3 / Math.sqrt(s);
        m[i] = tau * a * d[i];
        m[i + 1] = tau * b * d[i];
      }
    }
    return (x) => {
      if (x <= xs[0]) return ys[0];
      if (x >= xs[n - 1]) return ys[n - 1];
      let i = 0;
      while (x > xs[i + 1]) i++;
      const h = xs[i + 1] - xs[i];
      const p = (x - xs[i]) / h;
      const p2 = p * p;
      const p3 = p2 * p;
      return (2 * p3 - 3 * p2 + 1) * ys[i] +
        (p3 - 2 * p2 + p) * h * m[i] +
        (-2 * p3 + 3 * p2) * ys[i + 1] +
        (p3 - p2) * h * m[i + 1];
    };
  }

  // ---------------------------------------------------------------- layout

  const BASE_Y = -56;
  const SEAMS = [0.8, -11, -22, -33, -44, BASE_Y];
  const LAYER_Y = [-5.5, -16.5, -27.5, -38.5];

  const side = Math.max(safe.side, compact ? 44 : 64);
  const top = compact ? Math.max(safe.top, 24) : safe.top;
  const bottom = compact ? Math.max(safe.bottom, 28) : safe.bottom;
  const minText = compact ? 32 : 40;

  const layouts = {
    full: {
      tip: 96, tipFinal: 0.5,
      layer: [46, 50, 56, 64], diveScale: 1.5,
      hero: 196, heroMin: 112, heroMaxH: 250, sub: 46,
      plateX: 22, plateY: 8,
      massTop: 372, massBottom: 1310, massX: W / 2,
      horizonOpen: 0.62, horizonDive: 0.34,
      fovOpen: 30, fovDive: 38, fovFinal: 30,
      distOpen: 62, distDive: 72,
      diveShift: 230,
      heroY: H - bottom - 18,
    },
    top: {
      tip: 74, tipFinal: 0.56,
      layer: [36, 38, 42, 46], diveScale: 1.3,
      hero: 150, heroMin: 88, heroMaxH: 190, sub: 34,
      plateX: 16, plateY: 5,
      massTop: 178, massBottom: 716, massX: 292,
      horizonOpen: 0.66, horizonDive: 0.4,
      fovOpen: 24, fovDive: 30, fovFinal: 28,
      distOpen: 58, distDive: 86,
      diveShift: 250,
      heroY: H - bottom - 8,
    },
    overlay: {
      tip: 76, tipFinal: 0.56,
      layer: [38, 40, 44, 48], diveScale: 1.3,
      hero: 156, heroMin: 92, heroMaxH: 200, sub: 36,
      plateX: 16, plateY: 5,
      massTop: 128, massBottom: 712, massX: 284,
      horizonOpen: 0.64, horizonDive: 0.4,
      fovOpen: 24, fovDive: 30, fovFinal: 28,
      distOpen: 58, distDive: 86,
      diveShift: 230,
      heroY: H - bottom - 14,
    },
  };

  const M = { ...(layouts[variant] || layouts.full) };

  // A shorter top output keeps its proportions.
  if (compact && H !== (variant === "top" ? 960 : 1000)) {
    const r = H / (variant === "top" ? 960 : 1000);
    M.massTop *= r;
    M.massBottom *= r;
    M.heroY = H - bottom - 8;
    M.hero = Math.max(96, M.hero * r);
    M.heroMaxH *= r;
  }

  // ---------------------------------------------------------------- palette

  const P = {
    skyTop: color(V.skyTop),
    skyLow: color(V.skyLow),
    surface: color(V.surfaceWater),
    mid: color(V.midWater),
    deep: color(V.deepWater),
    abyss: color(V.deepWater).multiplyScalar(0.62),
    glow: color(V.glow),
    hot: mixed(V.glow, "#FFF4DC", 0.72),
    shade: mixed(V.iceDeep, V.surfaceWater, 0.45),
  };

  const bandColors = [
    color(V.ice).lerp(color("#FFFFFF"), 0.45),
    mixed(V.ice, V.iceDeep, 0.1),
    mixed(V.ice, V.iceDeep, 0.38),
    mixed(V.ice, V.iceDeep, 0.68),
    mixed(V.ice, V.iceDeep, 1),
    mixed(V.iceDeep, V.deepWater, 0.38),
  ];

  // ---------------------------------------------------------------- iceberg geometry

  const seed = Math.round(Number(V.iceSeed)) || 1;
  const rng = seeded(seed * 7919 + 13);

  function flatMesh() {
    const positions = [];
    const normals = [];
    const bands = [];
    const seeds = [];
    const ab = new THREE.Vector3();
    const ac = new THREE.Vector3();
    const n = new THREE.Vector3();
    const hintV = new THREE.Vector3();

    return {
      // Winding follows the hint, so a face can never end up inside out.
      tri(a, b, c, band, hint) {
        ab.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
        ac.set(c[0] - a[0], c[1] - a[1], c[2] - a[2]);
        n.crossVectors(ab, ac);
        if (n.lengthSq() < EPS * EPS) return;
        n.normalize();
        hintV.set(hint[0], hint[1], hint[2]);
        let order = [a, b, c];
        if (n.dot(hintV) < 0) {
          n.negate();
          order = [a, c, b];
        }
        const s = rng();
        order.forEach((p) => {
          positions.push(p[0], p[1], p[2]);
          normals.push(n.x, n.y, n.z);
          bands.push(band);
          seeds.push(s);
        });
      },
      geometry() {
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
        g.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
        g.setAttribute("aBand", new THREE.Float32BufferAttribute(bands, 1));
        g.setAttribute("aSeed", new THREE.Float32BufferAttribute(seeds, 1));
        return g;
      },
    };
  }

  const profile = track([
    [BASE_Y - 0.8, 0.5], [-55, 2.6], [-52, 6], [-47, 10.2], [-41, 14.2],
    [-33, 19], [-26, 22.6], [-19, 24.4], [-13, 21], [-8, 14.6],
    [-4.5, 9.6], [-2, 6.6], [-0.6, 4.8], [0.8, 3.2], [2, 2],
  ]);

  const lobes = [rng() * TAU, rng() * TAU, rng() * TAU, rng() * TAU];
  const zig = (x) => Math.abs(((x / TAU) % 1 + 1) % 1 - 0.5) * 4 - 1;
  const shape = (theta, y) =>
    1 + 0.1 * Math.sin(2 * theta + lobes[0]) +
    0.1 * zig(3 * theta + lobes[1] + y * 0.06) +
    0.07 * zig(7 * theta + lobes[2] + y * 0.13) +
    0.05 * zig(11 * theta + lobes[3] - y * 0.2);

  // Each stratum sits slightly off the one above it, so the outline steps like broken rock.
  const bandShift = SEAMS.map((_, i) => {
    const reach = (i / SEAMS.length) * 3.6;
    return [(rng() - 0.35) * reach, (rng() - 0.5) * reach];
  });

  const seamPhases = SEAMS.map(() => [rng() * TAU, rng() * TAU, 0.8 + rng() * 1.1]);
  const seamAt = (i, theta) => {
    if (i === 0) return SEAMS[0];
    if (i === SEAMS.length - 1) return SEAMS[i];
    const [a, b, tilt] = seamPhases[i];
    return SEAMS[i] + tilt * Math.sin(theta + a) + 0.45 * Math.sin(2 * theta + b);
  };

  const lipRings = [];
  const bandRings = [];
  const MASS_ROWS = 5;
  const MASS_COLS = 26;

  function buildMass() {
    const mesh = flatMesh();
    const rows = MASS_ROWS;
    const cols = MASS_COLS;

    for (let band = 1; band < SEAMS.length; band++) {
      const last = band === SEAMS.length - 1;
      const step = (SEAMS[band - 1] - SEAMS[band]) / rows;
      const rings = [];

      for (let r = 0; r <= rows; r++) {
        const ring = [];
        for (let c = 0; c < cols; c++) {
          const theta = ((c + (rng() - 0.5) * 0.6) / cols) * TAU;
          const sTop = seamAt(band - 1, theta);
          const sBottom = seamAt(band, theta);
          const inner = r > 0 && r < rows;
          const y = lerp(sTop, sBottom, r / rows) +
            (inner ? (rng() - 0.5) * step * 0.7 : 0);
          let radius = profile(y) * shape(theta, y) *
            (1 + (rng() - 0.5) * (inner ? 0.13 : 0.05));
          if (r === 0 && band > 1) radius *= 0.94;
          if (r === rows && !last) radius *= 1.03;
          const [sx, sz] = bandShift[band];
          ring.push([sx + Math.cos(theta) * radius, y, sz + Math.sin(theta) * radius]);
        }
        rings.push(ring);
      }

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const a = rings[r][c];
          const b = rings[r][(c + 1) % cols];
          const d = rings[r + 1][c];
          const e = rings[r + 1][(c + 1) % cols];
          const hint = [a[0] + e[0], 0, a[2] + e[2]];
          if (rng() > 0.5) {
            mesh.tri(a, b, e, band, hint);
            mesh.tri(a, e, d, band, hint);
          } else {
            mesh.tri(a, b, d, band, hint);
            mesh.tri(b, e, d, band, hint);
          }
        }
      }

      bandRings[band] = rings;

      if (band > 1) {
        const [sx, sz] = bandShift[band];
        const lid = [sx, rings[0][0][1] + 0.4, sz];
        for (let c = 0; c < cols; c++) {
          mesh.tri(rings[0][c], rings[0][(c + 1) % cols], lid, band, [0, 1, 0]);
        }
      }

      const lowest = rings[rows];
      if (last) {
        const apex = [bandShift[band][0], BASE_Y - 0.8, bandShift[band][1]];
        for (let c = 0; c < cols; c++) {
          mesh.tri(lowest[c], lowest[(c + 1) % cols], apex, band, [0, -1, 0]);
        }
      } else {
        // The underside of the ledge that turns each stratum into a physical layer.
        lipRings[band] = lowest;
        const [sx, sz] = bandShift[band];
        const inner = lowest.map((p) => [
          sx + (p[0] - sx) * 0.7, p[1] + 0.5, sz + (p[2] - sz) * 0.7,
        ]);
        const hub = [sx, lowest[0][1] + 0.9, sz];
        for (let c = 0; c < cols; c++) {
          const a = lowest[c];
          const b = lowest[(c + 1) % cols];
          const d = inner[c];
          const e = inner[(c + 1) % cols];
          mesh.tri(a, b, e, band, [0, -1, 0]);
          mesh.tri(a, e, d, band, [0, -1, 0]);
          mesh.tri(d, e, hub, band, [0, -1, 0]);
        }
      }
    }
    return mesh.geometry();
  }

  function crag(mesh, cx, cz, radius, peak, floor, lean, cols, rows) {
    const rings = [];
    const phase = rng() * TAU;
    for (let r = 0; r <= rows; r++) {
      const s = r / rows;
      const ring = [];
      for (let c = 0; c < cols; c++) {
        const theta = ((c + (rng() - 0.5) * 0.5) / cols) * TAU;
        const wide = radius * Math.pow(1 - s, 0.82) *
          (1 + 0.22 * Math.sin(2 * theta + phase)) *
          (1 + (rng() - 0.5) * 0.2);
        const y = lerp(floor, peak, s) +
          (r > 0 ? (rng() - 0.5) * (peak - floor) * 0.08 : 0);
        ring.push([
          cx + lean * s + Math.cos(theta) * wide,
          y,
          cz + Math.sin(theta) * wide,
        ]);
      }
      rings.push(ring);
    }
    const apex = [cx + lean, peak + (peak - floor) * 0.12, cz];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const a = rings[r][c];
        const b = rings[r][(c + 1) % cols];
        const d = rings[r + 1][c];
        const e = rings[r + 1][(c + 1) % cols];
        const hint = [a[0] + e[0] - cx * 2, 0.4, a[2] + e[2] - cz * 2];
        mesh.tri(a, b, e, 0, hint);
        mesh.tri(a, e, d, 0, hint);
      }
    }
    for (let c = 0; c < cols; c++) {
      const a = rings[rows][c];
      const b = rings[rows][(c + 1) % cols];
      mesh.tri(a, b, apex, 0, [a[0] + b[0] - cx * 2, 1, a[2] + b[2] - cz * 2]);
    }
  }

  function buildTip() {
    const mesh = flatMesh();
    crag(mesh, -0.3, 0, 3.5, 5.6, -2.4, 0.5, 9, 4);
    crag(mesh, 2.3, 0.6, 2.3, 3, -2.2, 0.4, 8, 3);
    crag(mesh, -2.7, -0.3, 2, 2, -2, -0.3, 7, 2);
    return mesh.geometry();
  }

  const massGeometry = buildMass();
  const tipGeometry = buildTip();

  // ---------------------------------------------------------------- shared shader code

  const U = {
    uTime: { value: 0 },
    uSurf: { value: P.surface },
    uMid: { value: P.mid },
    uDeep: { value: P.deep },
    uAbyss: { value: P.abyss },
    uSkyTop: { value: P.skyTop },
    uSkyLow: { value: P.skyLow },
    uGlowCol: { value: P.glow },
    uHot: { value: P.hot },
    uShade: { value: P.shade },
    uBands: { value: bandColors },
    uSun: { value: new THREE.Vector3(0.55, 0.42, 0.72).normalize() },
    uSunDisc: { value: new THREE.Vector3(0.36, 0.1, -0.93).normalize() },
    uGlow: { value: 0 },
    uGlowWater: { value: 0 },
    uPulseY: { value: BASE_Y - 8 },
    uPulseAmp: { value: 0 },
    uTrail: { value: 0 },
    uFogNear: { value: 40 },
    uFogRange: { value: 60 },
    uBaseY: { value: BASE_Y },
    uPlane: { value: 60 },
    uSkySpan: { value: 16 },
    uInvVP: { value: new THREE.Matrix4() },
    uGlass: { value: 6 },
    uCeil: { value: 1 },
    uWaves: { value: 1 },
  };

  const WATER = /* glsl */ `
    uniform vec3 uSurf, uMid, uDeep, uAbyss, uGlowCol;
    uniform float uGlowWater, uBaseY;
    vec3 waterAt(float y) {
      float d = -y;
      vec3 c = mix(uSurf, uMid, smoothstep(0.0, 24.0, d));
      c = mix(c, uDeep, smoothstep(20.0, 62.0, d));
      return mix(c, uAbyss, smoothstep(58.0, 120.0, d));
    }
    vec3 glowWater(vec3 p) {
      float r = length(p - vec3(0.0, uBaseY + 2.0, 0.0));
      return uGlowCol * uGlowWater * exp(-r / 15.0);
    }
  `;

  const FULL_VERT = /* glsl */ `
    uniform mat4 uInvVP;
    varying vec3 vFar;
    void main() {
      vec4 far = uInvVP * vec4(position.xy, 1.0, 1.0);
      vFar = far.xyz / far.w;
      gl_Position = vec4(position.xy, 1.0, 1.0);
    }
  `;

  const backdropMaterial = (fragment) => new THREE.ShaderMaterial({
    uniforms: U,
    vertexShader: FULL_VERT,
    fragmentShader: fragment,
    depthTest: false,
    depthWrite: false,
  });

  const quad = new THREE.PlaneGeometry(2, 2);

  function backdrop(material) {
    const mesh = new THREE.Mesh(quad, material);
    mesh.frustumCulled = false;
    mesh.renderOrder = -10;
    return mesh;
  }

  const skyMaterial = backdropMaterial(/* glsl */ `
    uniform vec3 uSkyTop, uSkyLow, uSunDisc;
    uniform float uPlane, uSkySpan;
    varying vec3 vFar;
    void main() {
      vec3 dir = normalize(vFar - cameraPosition);
      float y = cameraPosition.y + dir.y / max(length(dir.xz), 0.001) * uPlane;
      float s = clamp(y / uSkySpan, 0.0, 1.0);
      vec3 c = mix(uSkyLow, uSkyTop, smoothstep(0.0, 1.0, pow(s, 0.8)));
      float sun = max(dot(dir, uSunDisc), 0.0);
      vec3 warm = mix(uSkyLow, vec3(1.0), 0.6);
      c = mix(c, warm, clamp(pow(sun, 1600.0) * 1.5 + pow(sun, 240.0) * 0.34, 0.0, 1.0));
      gl_FragColor = vec4(c, 0.0);
    }
  `);

  const waterMaterial = backdropMaterial(/* glsl */ `
    ${WATER}
    uniform float uPlane;
    varying vec3 vFar;
    void main() {
      vec3 dir = normalize(vFar - cameraPosition);
      float t = uPlane / max(length(dir.xz), 0.001);
      vec3 p = cameraPosition + dir * t;
      gl_FragColor = vec4(waterAt(p.y) + glowWater(p), 0.0);
    }
  `);

  const iceMaterial = (under) => new THREE.ShaderMaterial({
    uniforms: { ...U, uUnder: { value: under ? 1 : 0 } },
    vertexShader: /* glsl */ `
      attribute float aBand;
      attribute float aSeed;
      varying vec3 vW;
      varying vec3 vN;
      varying float vBand;
      varying float vSeed;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vW = w.xyz;
        vN = normalize(mat3(modelMatrix) * normal);
        vBand = aBand;
        vSeed = aSeed;
        gl_Position = projectionMatrix * viewMatrix * w;
      }
    `,
    fragmentShader: /* glsl */ `
      ${WATER}
      uniform vec3 uBands[6];
      uniform vec3 uHot, uShade, uSun;
      uniform float uUnder, uTime, uGlow, uPulseY, uPulseAmp, uTrail, uFogNear, uFogRange;
      varying vec3 vW;
      varying vec3 vN;
      varying float vBand;
      varying float vSeed;
      void main() {
        vec3 N = normalize(vN);
        vec3 toCam = cameraPosition - vW;
        float dist = length(toCam);
        toCam /= dist;
        vec3 base = uBands[int(vBand + 0.5)] * (1.0 + (vSeed - 0.5) * 0.2);
        float rim = pow(1.0 - max(dot(N, toCam), 0.0), 2.4);
        vec3 c;
        if (uUnder < 0.5) {
          float sun = max(dot(N, uSun), 0.0);
          float sky = N.y * 0.5 + 0.5;
          float lit = smoothstep(0.02, 0.72, sun * 0.92 + sky * 0.3);
          c = mix(uShade * (0.92 + vSeed * 0.2), base, lit);
          c += vec3(1.0, 0.88, 0.74) * pow(sun, 5.0) * 0.1;
        } else {
          float up = N.y * 0.5 + 0.5;
          float fill = max(dot(N, normalize(vec3(-0.5, 0.25, 0.83))), 0.0);
          float depth = clamp(-vW.y / 60.0, 0.0, 1.0);
          float light = 0.34 + 0.44 * pow(up, 1.8) + 0.3 * fill;
          float shim = sin(uTime * 2.1 + vSeed * 37.0) * 0.5 + 0.5;
          light += shim * shim * 0.14 * (1.0 - depth * 0.7);
          vec3 tint = mix(vec3(1.0), mix(uSurf, vec3(1.0), 0.45), 1.0 - depth * 0.6);
          c = base * tint * light;
          c += waterAt(vW.y + 10.0) * rim * 0.3;
          float under = smoothstep(-0.2, -0.8, N.y);
          c = mix(c, waterAt(vW.y - 24.0) * 0.72, under * 0.82);
        }
        float core = smoothstep(uBaseY + 21.0, uBaseY + 2.0, vW.y);
        float stain = 0.55 + 0.45 * sin(vSeed * 91.0 + uTime * 0.9);
        float e = uGlow * core * core * (0.5 + 0.75 * stain);
        float dy = vW.y - uPulseY;
        e += exp(-dy * dy / 42.0) * uPulseAmp * (0.55 + 0.6 * stain);
        e += uTrail * smoothstep(uBaseY + 34.0, uBaseY + 14.0, vW.y) * smoothstep(uPulseY + 2.0, uPulseY - 10.0, vW.y) * (0.03 + 0.12 * stain);
        vec3 hot = mix(uGlowCol, uHot, clamp(e - 0.7, 0.0, 1.0));
        c = mix(c, hot, clamp(e, 0.0, 1.0));
        if (uUnder > 0.5) {
          float fog = 1.0 - exp(-pow(max(dist - uFogNear, 0.0) / uFogRange, 1.5));
          c = mix(c, waterAt(vW.y) + glowWater(vW), fog);
        }
        gl_FragColor = vec4(c, clamp(e, 0.0, 1.0));
      }
    `,
  });

  const iceUnder = iceMaterial(true);
  const iceAbove = iceMaterial(false);

  // ---------------------------------------------------------------- sea

  function seaGeometry() {
    const n = 110;
    const span = 640;
    const centerZ = 18;
    const grid = (i) => {
      const u = (i / n) * 2 - 1;
      return Math.sign(u) * Math.pow(Math.abs(u), 1.7) * span;
    };
    const positions = [];
    const seeds = [];
    const r = seeded(seed * 31 + 5);
    const lattice = [];
    for (let i = 0; i <= n; i++) {
      const row = [];
      for (let j = 0; j <= n; j++) {
        const wide = (grid(Math.min(n, i + 1)) - grid(Math.max(0, i - 1))) / 2;
        const deep = (grid(Math.min(n, j + 1)) - grid(Math.max(0, j - 1))) / 2;
        row.push([
          grid(i) + wide * 0.6 * (r() - 0.5),
          grid(j) + centerZ + deep * 0.6 * (r() - 0.5),
        ]);
      }
      lattice.push(row);
    }
    const push = (a, b, c) => {
      const s = r();
      [a, b, c].forEach((p) => {
        positions.push(p[0], 0, p[1]);
        seeds.push(s);
      });
    };
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const a = lattice[i][j];
        const b = lattice[i + 1][j];
        const c = lattice[i][j + 1];
        const d = lattice[i + 1][j + 1];
        if (r() > 0.5) {
          push(a, c, b);
          push(b, c, d);
        } else {
          push(a, c, d);
          push(a, d, b);
        }
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    g.setAttribute("aSeed", new THREE.Float32BufferAttribute(seeds, 1));
    return g;
  }

  const SEA_VERT = /* glsl */ `
    uniform float uTime, uWaves;
    attribute float aSeed;
    varying vec3 vW;
    varying float vSeed;
    void main() {
      vec3 p = position;
      float t = uTime;
      p.y += (sin(p.x * 0.31 + t * 1.1) * 0.09 + sin(p.z * 0.43 - t * 1.3) * 0.08 +
        sin((p.x + p.z) * 0.83 + t * 1.7) * 0.05) * uWaves;
      vW = p;
      vSeed = aSeed;
      gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
    }
  `;

  const sharedSea = seaGeometry();

  const seaTop = new THREE.Mesh(sharedSea, new THREE.ShaderMaterial({
    uniforms: U,
    vertexShader: SEA_VERT,
    fragmentShader: /* glsl */ `
      uniform vec3 uSurf, uSkyLow, uSkyTop, uSun, uSunDisc, uMid;
      uniform float uGlass;
      varying vec3 vW;
      varying float vSeed;
      void main() {
        vec3 toCam = cameraPosition - vW;
        float dist = length(toCam);
        if (length(toCam.xz) < uGlass) discard;
        toCam /= dist;
        vec3 N = normalize(cross(dFdx(vW), dFdy(vW)));
        if (N.y < 0.0) N = -N;
        float slope = dot(N.xz, normalize(uSun.xz)) * 9.0 + (vSeed - 0.5) * 0.5;
        vec3 c = mix(mix(uSurf, uMid, 0.34), mix(uSurf, uSkyLow, 0.5), clamp(slope * 0.5 + 0.5, 0.0, 1.0));
        vec3 R = reflect(-toCam, N);
        float glint = pow(max(dot(R, uSunDisc), 0.0), 90.0);
        c += mix(uSkyLow, vec3(1.0), 0.5) * glint * 0.9;
        c = mix(c, uSkyLow, smoothstep(40.0, 420.0, dist) * 0.82);
        gl_FragColor = vec4(c, 0.0);
      }
    `,
  }));
  seaTop.frustumCulled = false;

  const ceiling = new THREE.Mesh(sharedSea, new THREE.ShaderMaterial({
    uniforms: U,
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
    blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.SrcAlphaFactor,
    blendDst: THREE.OneMinusSrcAlphaFactor,
    blendSrcAlpha: THREE.ZeroFactor,
    blendDstAlpha: THREE.OneFactor,
    vertexShader: SEA_VERT,
    fragmentShader: /* glsl */ `
      ${WATER}
      uniform float uTime, uCeil, uPlane;
      varying vec3 vW;
      varying float vSeed;
      void main() {
        if (uCeil < 0.001) discard;
        vec3 toCam = cameraPosition - vW;
        float dist = length(toCam);
        vec3 N = normalize(cross(dFdx(vW), dFdy(vW)));
        if (N.y > 0.0) N = -N;
        float slope = (N.x * 0.7 + N.z * 0.7) * 9.0;
        float shim = sin(uTime * 2.6 + vSeed * 41.0 + vW.x * 0.2) * 0.5 + 0.5;
        float near = exp(-length(toCam.xz) / 70.0);
        vec3 pale = mix(uSurf, vec3(1.0), 0.72);
        vec3 c = mix(uSurf, pale, clamp(0.42 + slope * 0.3 + shim * shim * 0.5, 0.0, 1.0));
        gl_FragColor = vec4(c, clamp(near * 1.5, 0.0, 1.0) * uCeil);
      }
    `,
  }));
  ceiling.frustumCulled = false;

  function foamGeometry(inner, outer, count, r) {
    const positions = [];
    for (let i = 0; i < count; i++) {
      const a0 = (i / count) * TAU;
      const a1 = ((i + 1) / count) * TAU;
      const w0 = outer * (0.72 + r() * 0.5);
      const in0 = inner * (0.94 + r() * 0.1);
      const in1 = inner * (0.94 + r() * 0.1);
      const mid = (a0 + a1) / 2;
      positions.push(
        Math.cos(a0) * in0, 0, Math.sin(a0) * in0,
        Math.cos(mid) * w0, 0, Math.sin(mid) * w0,
        Math.cos(a1) * in1, 0, Math.sin(a1) * in1,
      );
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    return g;
  }

  const foamRng = seeded(seed * 17 + 3);
  const foam = new THREE.Mesh(
    foamGeometry(3.2, 7, 30, foamRng),
    new THREE.MeshBasicMaterial({ color: mixed(V.ice, "#FFFFFF", 0.6), side: THREE.DoubleSide, toneMapped: false }),
  );
  foam.scale.set(1, 1, 0.82);

  // ---------------------------------------------------------------- light shafts

  function shaftGeometry() {
    const r = seeded(seed * 23 + 9);
    const count = compact ? 12 : 14;
    const pos = [];
    const topA = [];
    const bottomA = [];
    const widths = [];
    const coord = [];
    const phase = [];
    const fronts = [];
    for (let i = 0; i < count; i++) {
      const front = i % 3 !== 2;
      const x = lerp(-58, 58, (i + r()) / count);
      const z = front ? 26 + r() * 22 : -30 - r() * 22;
      const drift = -9 - r() * 12;
      const a = [x, 1, z];
      const b = [x + drift, -74 - r() * 24, z - 4];
      const w0 = 1.2 + r() * 2.6;
      const w1 = w0 * (2.8 + r() * 2.4);
      const p = r() * TAU;
      [[-1, 0], [1, 0], [1, 1], [-1, 0], [1, 1], [-1, 1]].forEach(([u, v]) => {
        pos.push(0, 0, 0);
        topA.push(...a);
        bottomA.push(...b);
        widths.push(w0, w1);
        coord.push(u, v);
        phase.push(p);
        fronts.push(front ? 1 : 0);
      });
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("aFront", new THREE.Float32BufferAttribute(fronts, 1));
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("aTop", new THREE.Float32BufferAttribute(topA, 3));
    g.setAttribute("aBottom", new THREE.Float32BufferAttribute(bottomA, 3));
    g.setAttribute("aWidth", new THREE.Float32BufferAttribute(widths, 2));
    g.setAttribute("aCoord", new THREE.Float32BufferAttribute(coord, 2));
    g.setAttribute("aPhase", new THREE.Float32BufferAttribute(phase, 1));
    return g;
  }

  // Everything additive leaves the alpha channel alone: alpha carries the bloom mask.
  const additive = {
    transparent: true,
    depthWrite: false,
    blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.SrcAlphaFactor,
    blendDst: THREE.OneFactor,
    blendSrcAlpha: THREE.ZeroFactor,
    blendDstAlpha: THREE.OneFactor,
  };

  const shafts = new THREE.Mesh(shaftGeometry(), new THREE.ShaderMaterial({
    uniforms: { ...U, uShaft: { value: 1 }, uShaftFront: { value: 1 } },
    ...additive,
    vertexShader: /* glsl */ `
      attribute vec3 aTop, aBottom;
      attribute vec2 aWidth, aCoord;
      attribute float aPhase;
      attribute float aFront;
      uniform float uShaftFront;
      varying vec2 vC;
      varying float vPhase;
      varying float vY;
      varying float vPower;
      void main() {
        vPower = mix(1.0, uShaftFront, aFront);
        vec3 p = mix(aTop, aBottom, aCoord.y);
        vec3 axis = normalize(aBottom - aTop);
        vec3 across = normalize(cross(axis, cameraPosition - p));
        p += across * aCoord.x * mix(aWidth.x, aWidth.y, aCoord.y);
        vC = aCoord;
        vPhase = aPhase;
        vY = p.y;
        gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime, uShaft;
      uniform vec3 uSurf;
      varying vec2 vC;
      varying float vPhase;
      varying float vY;
      varying float vPower;
      void main() {
        float edge = 1.0 - vC.x * vC.x;
        edge *= edge;
        float fall = pow(1.0 - vC.y, 1.5) * smoothstep(0.0, 0.14, vC.y);
        float ripple = 0.62 + 0.26 * sin(uTime * 1.3 + vPhase) +
          0.14 * sin(uTime * 3.1 + vPhase * 2.0 + vC.y * 5.0 + vC.x * 2.0);
        vec3 c = mix(uSurf, vec3(1.0), 0.62);
        gl_FragColor = vec4(c, edge * fall * ripple * 0.3 * uShaft * vPower);
      }
    `,
  }));
  shafts.frustumCulled = false;

  // ---------------------------------------------------------------- particles and bubbles

  function instancedQuad(count, fill) {
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(
      [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, 1, 1, 0, -1, 1, 0], 3,
    ));
    g.instanceCount = count;
    const aPos = new Float32Array(count * 3);
    const aInfo = new Float32Array(count * 2);
    for (let i = 0; i < count; i++) fill(i, aPos, aInfo);
    g.setAttribute("aPos", new THREE.InstancedBufferAttribute(aPos, 3));
    g.setAttribute("aInfo", new THREE.InstancedBufferAttribute(aInfo, 2));
    return g;
  }

  const PARTICLE_VERT = /* glsl */ `
    attribute vec3 aPos;
    attribute vec2 aInfo;
    uniform vec3 uCenter, uBox;
    uniform float uTime, uStreak, uFade;
    varying vec2 vQ;
    varying float vFade;
    varying float vStretch;
    void main() {
      vec3 p = aPos + vec3(
        sin(uTime * 0.31 + aInfo.y) * 0.8,
        uTime * (0.18 + 0.24 * fract(aInfo.y * 3.1)),
        cos(uTime * 0.23 + aInfo.y * 1.7) * 0.8
      );
      vec3 box = p - uCenter + uBox * 0.5;
      box = mod(box, uBox);
      vec3 q = box / uBox;
      vec3 edge = smoothstep(vec3(0.0), vec3(0.1), q) * smoothstep(vec3(1.0), vec3(0.9), q);
      p = box - uBox * 0.5 + uCenter;
      vec4 mv = viewMatrix * vec4(p, 1.0);
      float thin = aInfo.x / (1.0 + uStreak * 9.0);
      mv.x += position.x * thin;
      mv.y += position.y * (aInfo.x + uStreak);
      vQ = vec2(position.x, position.y * (aInfo.x + uStreak) / aInfo.x);
      vStretch = uStreak / aInfo.x;
      vFade = edge.x * edge.y * edge.z * uFade * (0.45 + 0.55 * fract(aInfo.y * 7.3)) *
        smoothstep(3.0, 9.0, -mv.z) * (aInfo.x / (aInfo.x + uStreak * 0.16));
      gl_Position = projectionMatrix * mv;
    }
  `;

  const particleMaterial = (fade) => new THREE.ShaderMaterial({
    uniforms: {
      ...U,
      uCenter: { value: new THREE.Vector3() },
      uBox: { value: new THREE.Vector3(1, 1, 1) },
      uStreak: { value: 0 },
      uFade: { value: fade },
    },
    ...additive,
    vertexShader: PARTICLE_VERT,
    fragmentShader: /* glsl */ `
      uniform vec3 uSurf;
      varying vec2 vQ;
      varying float vFade;
      varying float vStretch;
      void main() {
        vec2 q = vec2(vQ.x, max(abs(vQ.y) - vStretch, 0.0));
        float a = smoothstep(1.0, 0.25, length(q));
        vec3 c = mix(uSurf, vec3(1.0), 0.75);
        gl_FragColor = vec4(c, a * vFade);
      }
    `,
  });

  const snowRng = seeded(seed * 41 + 1);
  const nearBox = new THREE.Vector3(44, 60, 44);
  const nearCount = 340;
  const nearSnow = new THREE.Mesh(
    instancedQuad(nearCount, (i, p, info) => {
      p[i * 3] = snowRng() * nearBox.x;
      p[i * 3 + 1] = snowRng() * nearBox.y;
      p[i * 3 + 2] = snowRng() * nearBox.z;
      info[i * 2] = 0.035 + snowRng() * snowRng() * 0.1;
      info[i * 2 + 1] = snowRng() * 100;
    }),
    particleMaterial(0.8),
  );
  nearSnow.frustumCulled = false;
  nearSnow.material.uniforms.uBox.value.copy(nearBox);

  const farBox = new THREE.Vector3(150, 120, 90);
  const farCount = 520;
  const farSnow = new THREE.Mesh(
    instancedQuad(farCount, (i, p, info) => {
      p[i * 3] = snowRng() * farBox.x;
      p[i * 3 + 1] = snowRng() * farBox.y;
      p[i * 3 + 2] = snowRng() * farBox.z;
      info[i * 2] = 0.1 + snowRng() * snowRng() * 0.26;
      info[i * 2 + 1] = snowRng() * 100;
    }),
    particleMaterial(0.75),
  );
  farSnow.frustumCulled = false;
  farSnow.material.uniforms.uBox.value.copy(farBox);
  farSnow.material.uniforms.uCenter.value.set(0, -46, 8);

  const bubbleRng = seeded(seed * 53 + 2);
  const bubbleCount = 170;
  const bubbles = new THREE.Mesh(
    instancedQuad(bubbleCount, (i, p, info) => {
      const a = bubbleRng() * TAU;
      const r = Math.sqrt(bubbleRng()) * 6.2;
      p[i * 3] = Math.cos(a) * r * 1.3;
      p[i * 3 + 1] = -0.4 - bubbleRng() * 15;
      p[i * 3 + 2] = -3 - bubbleRng() * 16;
      info[i * 2] = 0.05 + bubbleRng() * bubbleRng() * 0.26;
      info[i * 2 + 1] = bubbleRng() * 100;
    }),
    new THREE.ShaderMaterial({
      uniforms: {
        ...U,
        uAge: { value: 0 },
        uAnchor: { value: new THREE.Vector3() },
        uOrbit: { value: 0 },
      },
      ...additive,
      vertexShader: /* glsl */ `
        attribute vec3 aPos;
        attribute vec2 aInfo;
        uniform vec3 uAnchor;
        uniform float uAge, uTime, uOrbit;
        varying vec2 vQ;
        varying float vFade;
        void main() {
          float speed = 2.4 + 5.0 * aInfo.x / 0.3;
          vec3 p = aPos;
          float c = cos(uOrbit);
          float s = sin(uOrbit);
          p = vec3(p.x * c + p.z * s, p.y, -p.x * s + p.z * c);
          p.y += uAge * speed;
          p.x += sin(uTime * 3.0 + aInfo.y) * 0.16;
          p += uAnchor;
          vec4 mv = viewMatrix * vec4(p, 1.0);
          mv.xy += position.xy * aInfo.x;
          vQ = position.xy;
          vFade = smoothstep(-0.2, -1.0, p.y) * smoothstep(0.3, 1.6, -mv.z);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec2 vQ;
        varying float vFade;
        void main() {
          float r = length(vQ);
          if (r > 1.0) discard;
          float ring = smoothstep(0.62, 0.92, r) * smoothstep(1.0, 0.92, r);
          float spot = smoothstep(0.26, 0.05, length(vQ - vec2(-0.32, 0.34)));
          gl_FragColor = vec4(vec3(1.0), (ring * 0.8 + spot * 0.9 + 0.05) * vFade);
        }
      `,
    }),
  );
  bubbles.frustumCulled = false;

  // ---------------------------------------------------------------- cracks

  // A flat strip laid over a path. Neighbouring pieces share corners, so a crack never breaks into dashes.
  function ribbonGeometry(paths) {
    const positions = [];
    const seeds = [];
    const r = seeded(seed * 61 + 4);
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    const tangent = new THREE.Vector3();
    const radial = new THREE.Vector3();
    const across = new THREE.Vector3();

    paths.forEach((path) => {
      const s = r();
      const n = path.points.length;
      const left = [];
      const right = [];
      path.points.forEach((point, i) => {
        a.fromArray(path.points[Math.max(0, i - 1)]);
        b.fromArray(path.points[Math.min(n - 1, i + 1)]);
        tangent.subVectors(b, a).normalize();
        if (path.flat) {
          across.set(0, 1, 0);
        } else {
          radial.set(point[0], 0, point[2]).normalize();
          across.crossVectors(radial, tangent).normalize();
        }
        const half = path.width(i / (n - 1));
        left.push([point[0] - across.x * half, point[1] - across.y * half, point[2] - across.z * half]);
        right.push([point[0] + across.x * half, point[1] + across.y * half, point[2] + across.z * half]);
      });
      for (let i = 0; i < n - 1; i++) {
        [left[i], left[i + 1], right[i + 1], left[i], right[i + 1], right[i]].forEach((p) => {
          positions.push(p[0], p[1], p[2]);
          seeds.push(s);
        });
      }
    });

    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    g.setAttribute("aSeed", new THREE.Float32BufferAttribute(seeds, 1));
    return g;
  }

  const crackMaterial = (rest) => new THREE.ShaderMaterial({
    uniforms: { ...U, uRest: { value: rest } },
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
    vertexShader: /* glsl */ `
      attribute float aSeed;
      varying vec3 vW;
      varying float vSeed;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vW = w.xyz;
        vSeed = aSeed;
        gl_Position = projectionMatrix * viewMatrix * w;
      }
    `,
    fragmentShader: /* glsl */ `
      ${WATER}
      uniform vec3 uHot;
      uniform float uPulseY, uPulseAmp, uGlow, uTime, uRest, uFogNear, uFogRange;
      varying vec3 vW;
      varying float vSeed;
      void main() {
        float passed = smoothstep(uPulseY + 1.5, uPulseY - 1.5, vW.y);
        float breathe = 0.82 + 0.18 * sin(uTime * 3.2 + vSeed * 20.0);
        float e = passed * (uGlow > 0.0 ? 1.0 : 0.0) * breathe;
        if (e < 0.01 && uRest < 0.5) discard;
        vec3 dark = waterAt(vW.y - 30.0) * 0.55;
        vec3 c = mix(dark, mix(uGlowCol, uHot, 0.55), e);
        float dist = length(cameraPosition - vW);
        float fog = 1.0 - exp(-pow(max(dist - uFogNear, 0.0) / uFogRange, 1.5));
        c = mix(c, waterAt(vW.y), fog * (1.0 - e));
        gl_FragColor = vec4(c, e);
      }
    `,
  });

  const seamPaths = [];
  lipRings.forEach((ring, band) => {
    if (!ring) return;
    const [sx, sz] = bandShift[band];
    const pts = ring.map((p) => [sx + (p[0] - sx) * 1.012, p[1], sz + (p[2] - sz) * 1.012]);
    pts.push(pts[0]);
    seamPaths.push({ points: pts, flat: true, width: () => 0.1 });
  });

  const crackRng = seeded(seed * 71 + 6);
  const verticalPaths = [];
  const frontColumns = [1, 3, 4, 5, 6, 7, 8, 9, 11, 12];
  frontColumns.forEach((start, i) => {
    let column = start;
    const stopBand = 2 + Math.floor(crackRng() * 2.4);
    const pts = [];
    for (let band = SEAMS.length - 1; band >= stopBand; band--) {
      const rings = bandRings[band];
      const [sx, sz] = bandShift[band];
      const from = band === SEAMS.length - 1 ? MASS_ROWS - 1 : MASS_ROWS;
      for (let row = from; row >= 1; row--) {
        column = (column + Math.round((crackRng() - 0.5) * 2.2) + MASS_COLS) % MASS_COLS;
        const p = rings[row][column];
        pts.push([sx + (p[0] - sx) * 1.014, p[1], sz + (p[2] - sz) * 1.014]);
      }
    }
    const thick = 0.2 + (i % 3) * 0.05;
    verticalPaths.push({ points: pts, width: (u) => lerp(thick, 0.05, u) });
  });

  const seamMesh = new THREE.Mesh(ribbonGeometry(seamPaths), crackMaterial(1));
  const crackMesh = new THREE.Mesh(ribbonGeometry(verticalPaths), crackMaterial(0));

  // ---------------------------------------------------------------- floating shards

  const shardRng = seeded(seed * 83 + 8);

  function shardGeometry(size, band) {
    const g = new THREE.IcosahedronGeometry(1, 0);
    const pos = g.attributes.position;
    const scaleX = 0.7 + shardRng() * 0.9;
    const scaleY = 0.5 + shardRng() * 0.7;
    const verts = new Map();
    const jitter = (x, y, z) => {
      const key = `${x.toFixed(3)},${y.toFixed(3)},${z.toFixed(3)}`;
      if (!verts.has(key)) {
        const k = 0.75 + shardRng() * 0.5;
        verts.set(key, [x * k * size * scaleX, y * k * size * scaleY, z * k * size]);
      }
      return verts.get(key);
    };
    const mesh = flatMesh();
    for (let i = 0; i < pos.count; i += 3) {
      const a = jitter(pos.getX(i), pos.getY(i), pos.getZ(i));
      const b = jitter(pos.getX(i + 1), pos.getY(i + 1), pos.getZ(i + 1));
      const c = jitter(pos.getX(i + 2), pos.getY(i + 2), pos.getZ(i + 2));
      mesh.tri(a, b, c, band, [a[0] + b[0] + c[0], a[1] + b[1] + c[1], a[2] + b[2] + c[2]]);
    }
    return mesh.geometry();
  }

  const sceneA = new THREE.Scene();
  const sceneB = new THREE.Scene();

  sceneA.add(backdrop(skyMaterial));
  sceneA.add(seaTop);
  sceneA.add(foam);
  sceneA.add(new THREE.Mesh(tipGeometry, iceAbove));

  sceneB.add(backdrop(waterMaterial));
  sceneB.add(ceiling);
  [massGeometry, tipGeometry].forEach((g) => {
    const mesh = new THREE.Mesh(g, iceUnder);
    mesh.frustumCulled = false;
    sceneB.add(mesh);
  });
  sceneB.add(seamMesh);
  sceneB.add(crackMesh);
  sceneB.add(shafts);
  sceneB.add(farSnow);
  sceneB.add(nearSnow);
  sceneB.add(bubbles);

  const shards = [];
  for (let i = 0; i < 14; i++) {
    const y = lerp(-5, -52, (i + shardRng()) / 14);
    const band = clamp(Math.floor((-y + 0.8) / 11) + 1, 1, 5);
    const size = 0.4 + shardRng() * 1.2;
    const mesh = new THREE.Mesh(shardGeometry(size, band), iceUnder);
    const angle = lerp(0.1, 0.95, shardRng()) * (i % 2 ? 1 : -1);
    const radius = 30 + shardRng() * 22;
    mesh.position.set(Math.sin(angle) * radius, y, Math.cos(angle) * radius);
    const spin = [shardRng() * TAU, shardRng() * TAU, 0.14 + shardRng() * 0.3];
    shards.push({ mesh, y, spin });
    sceneB.add(mesh);
  }

  // ---------------------------------------------------------------- renderer

  const canvas = $("ib-gl");
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    alpha: true,
    preserveDrawingBuffer: true,
  });
  const PIXEL = 2;
  renderer.setPixelRatio(PIXEL);
  renderer.setSize(W, H, false);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;

  const targetOptions = {
    samples: 4,
    depthBuffer: true,
    format: THREE.RGBAFormat,
    type: THREE.UnsignedByteType,
    colorSpace: THREE.NoColorSpace,
  };
  const rtA = new THREE.WebGLRenderTarget(W * PIXEL, H * PIXEL, targetOptions);
  const rtB = new THREE.WebGLRenderTarget(W * PIXEL, H * PIXEL, {
    ...targetOptions,
    generateMipmaps: true,
    minFilter: THREE.LinearMipmapLinearFilter,
    magFilter: THREE.LinearFilter,
  });

  const composite = new THREE.Mesh(quad, new THREE.ShaderMaterial({
    uniforms: {
      tA: { value: rtA.texture },
      tB: { value: rtB.texture },
      uLine: { value: -1 },
      uWave: { value: 0 },
      uWake: { value: 0 },
      uTime: U.uTime,
      uAspect: { value: W / H },
      uFlash: { value: 0 },
      uShockC: { value: new THREE.Vector2(0.5, 0.3) },
      uShockR: { value: 0 },
      uShockAmp: { value: 0 },
      uTipRipple: { value: 0 },
      uSkyOnly: { value: 0 },
      uGlowCol: U.uGlowCol,
      uHot: U.uHot,
      uSurf: U.uSurf,
    },
    depthTest: false,
    depthWrite: false,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = position.xy * 0.5 + 0.5;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D tA, tB;
      uniform float uLine, uWave, uWake, uTime, uAspect, uFlash, uShockR, uShockAmp, uTipRipple, uSkyOnly;
      uniform vec2 uShockC;
      uniform vec3 uGlowCol, uHot, uSurf;
      varying vec2 vUv;

      float ripple(float x, float t) {
        return sin(x * 5.3 + t * 2.3) * 0.5 + sin(x * 11.7 - t * 3.1) * 0.28 +
          sin(x * 23.1 + t * 4.7) * 0.14 + sin(x * 47.0 - t * 6.3) * 0.08;
      }

      float bloomAt(vec2 uv) {
        float g = 0.0;
        vec2 s = vec2(1.0, uAspect) * 0.006;
        g += textureLod(tB, uv, 3.0).a * 0.5;
        g += (textureLod(tB, uv + s, 4.0).a + textureLod(tB, uv - s, 4.0).a +
              textureLod(tB, uv + s * vec2(1.0, -1.0), 4.0).a + textureLod(tB, uv - s * vec2(1.0, -1.0), 4.0).a) * 0.25 * 0.6;
        s *= 2.4;
        g += (textureLod(tB, uv + s, 5.0).a + textureLod(tB, uv - s, 5.0).a +
              textureLod(tB, uv + s * vec2(1.0, -1.0), 5.0).a + textureLod(tB, uv - s * vec2(1.0, -1.0), 5.0).a) * 0.25 * 0.7;
        s *= 2.2;
        g += (textureLod(tB, uv + s, 6.0).a + textureLod(tB, uv - s, 6.0).a +
              textureLod(tB, uv + s * vec2(1.0, -1.0), 6.0).a + textureLod(tB, uv - s * vec2(1.0, -1.0), 6.0).a) * 0.25 * 0.42;
        return g;
      }

      void main() {
        if (uSkyOnly > 0.5) {
          gl_FragColor = vec4(texture2D(tA, vUv).rgb, 1.0);
          return;
        }
        vec2 uv = vUv;
        float shock = 0.0;
        if (uShockAmp > 0.001) {
          vec2 q = (uv - uShockC) * vec2(uAspect, 1.0);
          float r = length(q);
          float x = (r - uShockR) / 0.032;
          shock = exp(-x * x) * uShockAmp;
          uv -= normalize(q + 0.00001) * shock * 0.03 / vec2(uAspect, 1.0);
        }

        float wave = ripple(uv.x * uAspect * 1.6, uTime) * uWave;
        wave += ripple(uv.x * uAspect * 5.0 + 9.0, uTime * 1.6) * uTipRipple * 0.008;
        float d = uv.y - (uLine + wave);

        vec2 ub = uv;
        ub.x += uWake * 0.012 * sin(uv.y * 26.0 + uTime * 9.0);
        ub.y += uWake * 0.008 * sin(uv.x * 22.0 - uTime * 7.0);
        float nearLine = exp(min(d, 0.0) / 0.03);
        ub.x += nearLine * 0.018 * sin(uv.x * 60.0 + uTime * 5.0);
        ub.y += nearLine * 0.012;

        vec3 under = texture2D(tB, ub).rgb;
        vec3 c = under;
        float bloom = bloomAt(ub);

        if (uLine < 1.2 && uLine > -0.2) {
          vec2 ua = uv;
          float aboveNear = exp(-max(d, 0.0) / 0.012);
          ua.y -= aboveNear * 0.006;
          vec3 above = texture2D(tA, ua).rgb;
          float px = 0.0007;
          vec3 pale = mix(uSurf, vec3(1.0), 0.8);
          // Just under the skin the water goes bright, then a thin dark edge, then the air.
          vec3 lit = under + pale * (exp(min(d, 0.0) / 0.018) * 0.62 + exp(min(d, 0.0) / 0.075) * 0.2);
          float skin = exp(-d * d / 0.0000085);
          c = mix(lit, above, smoothstep(-px, px, d));
          c = mix(c, vec3(1.0), skin * 0.9);
          float shadow = exp(-pow((d - 0.0045) / 0.003, 2.0));
          c = mix(c, c * 0.8, shadow * 0.45);
        }

        float wet = 1.0 - smoothstep(-0.001, 0.001, d) * step(uLine, 1.2) * step(-0.2, uLine);
        c += uGlowCol * bloom * 0.42 * wet;
        vec3 ringCol = mix(uHot, mix(uSurf, vec3(1.0), 0.6), clamp(uShockR * 1.5, 0.0, 1.0));
        c += ringCol * shock * 0.42 * wet;
        c += uSurf * uFlash * 0.3 * wet;
        gl_FragColor = vec4(c, 1.0);
      }
    `,
  }));
  composite.frustumCulled = false;
  const compositeScene = new THREE.Scene();
  compositeScene.add(composite);
  const compositeCamera = new THREE.Camera();

  // ---------------------------------------------------------------- camera

  // The finished frame is a clean cutaway, so it is worked out from the rectangle the mass has to fill.
  const finalScale = (M.massBottom - M.massTop) / -BASE_Y;
  const finalDist = (H / finalScale) / (2 * Math.tan(THREE.MathUtils.degToRad(M.fovFinal / 2)));
  const finalY = BASE_Y * 0.46;
  const finalOY = H / 2 + finalY * finalScale - M.massTop;
  const finalOX = W / 2 - M.massX;
  const finalGlass = finalDist - 7;

  const PULL = 3.66;

  const yTrack = track([
    [0, 3.5], [0.55, 3.05], [0.84, 1.9], [1.04, 0.42], [1.2, -0.12], [1.34, -1.1],
    [1.55, -5.5], [1.83, -12.1], [2.11, -16.5], [2.36, -23.1], [2.61, -27.5],
    [2.83, -34.1], [3.05, -38.5], [3.3, -46], [3.52, -51], [PULL, -52.2],
    [3.92, -46], [4.2, finalY * 1.06], [K, finalY],
  ]);
  const distTrack = track([
    [0, M.distOpen], [0.7, M.distOpen - 2], [1.2, M.distOpen - 4], [1.7, M.distDive - 6],
    [3.0, M.distDive], [PULL, M.distDive + 2], [3.9, M.distDive + 30],
    [4.16, lerp(M.distDive, finalDist, 0.6)], [K, finalDist],
  ]);
  const fovTrack = track([
    [0, M.fovOpen], [1.1, M.fovOpen + 1], [1.7, M.fovDive], [PULL, M.fovDive],
    [K, M.fovFinal],
  ]);
  const orbitTrack = track([
    [0, -0.14], [1.2, -0.08], [2.2, 0.08], [3.4, 0.2], [PULL, 0.22], [K, 0.1],
  ]);
  const shiftXTrack = track([
    [0, 0], [1.25, 0], [1.9, M.diveShift], [PULL, M.diveShift], [4.08, M.diveShift * 0.5], [K, finalOX],
  ]);
  const shiftYTrack = track([
    [0, (0.5 - M.horizonOpen) * H],
    [0.5, (0.5 - M.horizonOpen) * H],
    [1.1, (0.5 - M.horizonDive) * H],
    [1.75, 0], [PULL, 0], [4.05, finalOY * 0.45], [K, finalOY],
  ]);

  function pose(t, into) {
    const h = Math.max(0, t - K);
    const settle = Math.exp(-h * 9) * Math.sin(h * 26);
    into.y = yTrack(Math.min(t, K));
    into.dist = distTrack(Math.min(t, K)) * (1 - settle * 0.022) * (1 + h * 0.016);
    into.fov = fovTrack(Math.min(t, K));
    into.orbit = orbitTrack(Math.min(t, K)) + h * 0.016;
    into.ox = shiftXTrack(Math.min(t, K));
    into.oy = shiftYTrack(Math.min(t, K));
    into.glass = t >= K
      ? finalGlass
      : lerp(5.6, finalGlass, Math.pow(smooth(seg(t, PULL, K - PULL)), 5));
    return into;
  }

  const camera = new THREE.PerspectiveCamera(M.fovOpen, W / H, 0.2, 1400);
  const lineProbe = new THREE.Vector3();
  const vp = new THREE.Matrix4();

  function setCamera(c) {
    camera.fov = c.fov;
    camera.position.set(Math.sin(c.orbit) * c.dist, c.y, Math.cos(c.orbit) * c.dist);
    camera.lookAt(0, c.y, 0);
    camera.setViewOffset(W, H, c.ox, c.oy, W, H);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
  }

  function project(x, y, z) {
    lineProbe.set(x, y, z).project(camera);
    return { x: (lineProbe.x + 1) * W / 2, y: (1 - lineProbe.y) * H / 2, z: lineProbe.z };
  }

  // Where the sea surface meets the lens, as a height in the frame. 0 is the bottom, 1 the top.
  function waterlineAt(c) {
    const fx = -Math.sin(c.orbit);
    const fz = -Math.cos(c.orbit);
    lineProbe.set(camera.position.x + fx * c.glass, 0, camera.position.z + fz * c.glass);
    lineProbe.project(camera);
    return (lineProbe.y + 1) / 2;
  }

  // ---------------------------------------------------------------- labels

  const labelBox = $("ib-labels");
  const finalAngle = orbitTrack(K);

  const anchorAt = (y) => {
    const radius = profile(y) * 0.7;
    return [Math.sin(finalAngle) * radius, y, Math.cos(finalAngle) * radius];
  };

  function fitBox(el, maxWidth, floor) {
    let px = parseFloat(el.style.fontSize);
    while (el.offsetWidth > maxWidth && px > floor) {
      px -= 1;
      el.style.fontSize = px + "px";
    }
    if (el.offsetWidth > maxWidth) {
      el.style.whiteSpace = "normal";
      el.style.width = maxWidth + "px";
      el.style.textWrap = "balance";
    }
    return px;
  }

  const plates = [
    { bg: color(V.ice), bar: color(V.surfaceWater) },
    { bg: mixed(V.surfaceWater, V.ice, 0.28), bar: color(V.midWater) },
    { bg: color(V.midWater), bar: mixed(V.ice, V.surfaceWater, 0.5) },
    { bg: color(V.deepWater), bar: color(V.glow) },
  ];

  const plateMax = compact ? W - M.massX - side : W - side * 2;
  const diveMax = compact ? W - M.massX - 60 : W - side * 2;

  const layers = [V.layer1, V.layer2, V.layer3, V.layer4].map((text, i) => {
    const el = make("div", "ib-label", labelBox, text);
    el.setAttribute("data-layout-allow-overflow", "");
    const plate = plates[i];
    el.style.fontSize = M.layer[i] + "px";
    el.style.padding = `${M.plateY}px ${M.plateX}px`;
    el.style.background = css(plate.bg);
    el.style.color = luma(plate.bg) > 0.5 ? V.textDark : V.text;
    el.style.borderLeft = `${compact ? 7 : 9}px solid ${css(plate.bar)}`;
    el.style.boxShadow = `0 10px 26px ${rgba(V.textDark, 0.34)}`;
    const px = fitBox(el, plateMax, minText);
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const scale = clamp(diveMax / w, 1, M.diveScale);
    const anchor = anchorAt(LAYER_Y[i]);
    return { el, w, h, px, scale, anchor, y: LAYER_Y[i], at: 0 };
  });

  const tipEl = make("div", "ib-label", labelBox, V.tipLabel);
  tipEl.setAttribute("data-layout-allow-overflow", "");
  tipEl.style.fontSize = M.tip + "px";
  tipEl.style.color = V.textDark;
  fitBox(tipEl, W - side * 2, minText);
  const tipPx = parseFloat(tipEl.style.fontSize);
  const tipW = tipEl.offsetWidth;
  const tipH = tipEl.offsetHeight;
  const tipFinal = clamp(M.tipFinal, minText / tipPx, 1);

  const leaderSvg = $("ib-leaders");
  leaderSvg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  const SVGNS = "http://www.w3.org/2000/svg";
  const leaders = layers.map((label) => {
    const line = document.createElementNS(SVGNS, "line");
    line.setAttribute("stroke", V.text);
    line.setAttribute("stroke-width", compact ? 3 : 4);
    const dot = document.createElementNS(SVGNS, "circle");
    dot.setAttribute("r", compact ? 7 : 9);
    dot.setAttribute("fill", V.text);
    leaderSvg.appendChild(line);
    leaderSvg.appendChild(dot);
    return { line, dot, label };
  });

  const heroEl = $("ib-hero");
  const heroLine = $("ib-hero-line");
  const heroSub = $("ib-hero-sub");
  const heroMax = W - side * 2;
  const HERO_PUNCH = 0.09;
  const heroFit = heroMax / (1 + HERO_PUNCH * 1.2);

  heroLine.textContent = V.finalLabel;
  heroLine.style.color = V.text;
  heroLine.style.fontSize = M.hero + "px";
  heroEl.style.width = heroMax + "px";
  heroLine.style.width = "max-content";
  heroLine.style.margin = "0 auto";

  (() => {
    let px = M.hero;
    while (heroLine.offsetWidth > heroFit && px > M.heroMin) {
      px -= 2;
      heroLine.style.fontSize = px + "px";
    }
    if (heroLine.offsetWidth > heroFit) {
      heroLine.style.whiteSpace = "normal";
      heroLine.style.width = heroFit + "px";
      heroLine.style.textWrap = "balance";
      while (heroLine.offsetHeight > M.heroMaxH && px > minText) {
        px -= 2;
        heroLine.style.fontSize = px + "px";
      }
    }
  })();

  if (V.finalSub) {
    heroSub.textContent = V.finalSub;
    heroSub.style.color = V.text;
    heroSub.style.fontSize = M.sub + "px";
    heroSub.style.width = heroFit + "px";
    heroSub.style.margin = `${compact ? 4 : 10}px auto 0`;
    let px = M.sub;
    while (heroSub.scrollWidth > heroFit && px > minText) {
      px -= 1;
      heroSub.style.fontSize = px + "px";
    }
    if (heroSub.scrollWidth > heroFit) {
      heroSub.style.whiteSpace = "normal";
      heroSub.style.textWrap = "balance";
    }
  } else {
    heroSub.style.display = "none";
  }

  const heroH = heroEl.offsetHeight;
  const heroTop = M.heroY - heroH;

  const LAYER_AT = [1.52, 2.08, 2.58, 3.02];
  layers.forEach((label, i) => { label.at = LAYER_AT[i]; });

  const shadowUnder = `0 4px 0 ${rgba(V.textDark, 0.5)}, 0 14px 44px ${rgba(V.textDark, 0.6)}`;
  heroLine.style.textShadow = shadowUnder;

  // ---------------------------------------------------------------- render

  const now = {};
  const prev = {};
  const PLUNGE = 1.24;

  function renderAt(inputTime) {
    const time = Math.max(0, Number(inputTime) || 0);
    const t = designTime(time);
    const arrived = time >= T.key - EPS;
    const h = Math.max(0, time - T.key);
    const energy = arrived ? Math.exp(-h * 5.5) : 0;
    const kick = arrived ? Math.exp(-h * 10) * Math.cos(h * 18) : 0;

    pose(t, now);
    pose(Math.max(0, t - 1 / 30), prev);
    setCamera(now);

    const uv = waterlineAt(now);
    const fullySky = uv < -0.08;
    const useA = (uv > -0.08 && uv < 1.08) || fullySky;
    const useB = !fullySky;

    const speed = (now.y - prev.y) * 30;
    const haveDepth = now.y < 1.2;

    // Numbers every shader shares.
    U.uTime.value = time;
    vp.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse).invert();
    U.uInvVP.value.copy(vp);
    U.uPlane.value = now.dist;
    U.uFogNear.value = now.dist * 0.9 - 8;
    U.uFogRange.value = 40 + now.dist * 0.34;
    U.uSkySpan.value = lerp(14, 26, seg(t, PULL, K - PULL));
    U.uGlass.value = now.glass;
    U.uWaves.value = clamp((Math.abs(now.y) - 0.1) / 1.6, 0, 1);
    U.uCeil.value = 1 - seg(-now.y, 7, 26);

    const pulseAge = arrived ? h : -1;
    const climb = pulseAge < 0 ? 0 : out(clamp(pulseAge / 0.95), 1.7);
    const pulseY = pulseAge < 0 ? BASE_Y - 12 : lerp(BASE_Y - 4, 9, climb);
    const glowBreath = arrived ? 0.86 + 0.14 * Math.sin(h * 3.4) : 0;

    U.uPulseY.value = pulseY;
    U.uPulseAmp.value = arrived ? 1.1 * (1 - smooth(seg(h, 0.62, 0.5))) : 0;
    U.uTrail.value = arrived ? 1 : 0;
    U.uGlow.value = arrived ? glowBreath + energy * 0.7 : 0;
    U.uGlowWater.value = arrived ? 0.5 * glowBreath + energy * 0.5 : 0;

    nearSnow.material.uniforms.uCenter.value.copy(camera.position);
    nearSnow.material.uniforms.uStreak.value = t < PULL
      ? clamp((Math.abs(speed) / T.scale) * 0.008, 0, 0.24)
      : 0;

    const bubbleAge = t - PLUNGE;
    bubbles.visible = bubbleAge > -0.05 && bubbleAge < 1.1;
    if (bubbles.visible) {
      const u = bubbles.material.uniforms;
      u.uAge.value = Math.max(0, bubbleAge);
      const anchorT = PLUNGE + 0.05;
      const anchor = pose(anchorT, {});
      u.uOrbit.value = anchor.orbit;
      u.uAnchor.value.set(
        Math.sin(anchor.orbit) * anchor.dist,
        0,
        Math.cos(anchor.orbit) * anchor.dist,
      );
    }

    shards.forEach(({ mesh, y, spin }) => {
      mesh.rotation.set(spin[0] + time * spin[2], spin[1] + time * spin[2] * 0.7, 0);
      mesh.position.y = y + Math.sin(time * 0.7 + spin[0]) * 0.3;
    });

    foam.scale.set(1 + Math.sin(time * 1.1) * 0.03, 1, 0.82 + Math.cos(time * 0.9) * 0.025);
    foam.position.y = 0.05 + Math.sin(time * 1.1) * 0.03;

    const su = shafts.material.uniforms;
    su.uShaft.value = arrived ? 0.9 + 0.1 * Math.sin(h * 2.2) : 1;
    su.uShaftFront.value = 1 - 0.86 * smooth(seg(t, PULL, K - PULL));

    // Two worlds, one lens: whichever side of the waterline each pixel is on.
    if (useA) {
      renderer.setRenderTarget(rtA);
      renderer.clear();
      renderer.render(sceneA, camera);
    }
    if (useB) {
      renderer.setRenderTarget(rtB);
      renderer.clear();
      renderer.render(sceneB, camera);
    }

    const c = composite.material.uniforms;
    const inFrame = 1 - Math.pow(Math.abs(uv - 0.5) * 2, 2) * 0.55;
    c.uWave.value = (arrived || t > 4 ? 0.0032 : 0.0085) * clamp(inFrame, 0.4, 1);
    c.uWake.value = t > PLUNGE ? Math.exp(-(t - PLUNGE) * 4.2) * (haveDepth ? 1 : 0) : 0;
    c.uFlash.value = arrived ? Math.exp(-h * 9) : 0;
    c.uTipRipple.value = arrived ? seg(h, 0.62, 0.1) * Math.exp(-Math.max(0, h - 0.7) * 3) : 0;

    if (arrived) {
      const base = project(0, BASE_Y + 3, 0);
      c.uShockC.value.set(base.x / W, 1 - base.y / H);
      c.uShockR.value = out(clamp(h / 0.9), 2) * 1.5;
      c.uShockAmp.value = Math.pow(1 - clamp(h / 0.9), 1.4);
    } else {
      c.uShockAmp.value = 0;
    }

    // While the lens is fully above water only the sky pass exists.
    c.uLine.value = fullySky ? -0.1 : uv;
    c.uSkyOnly.value = fullySky ? 1 : 0;

    renderer.setRenderTarget(null);
    renderer.render(compositeScene, compositeCamera);

    // Labels ride on their strata during the dive and settle into a stack for the cutaway.
    const pull = smooth(seg(t, PULL + 0.14, K - PULL - 0.14));

    layers.forEach((label, i) => {
      const { el, w, h: lh, anchor } = label;
      const seen = t >= label.at - 0.02;
      el.style.visibility = seen ? "visible" : "hidden";
      const leader = leaders[i];
      const showLeader = compact && seen;
      leader.line.style.visibility = showLeader ? "visible" : "hidden";
      leader.dot.style.visibility = showLeader ? "visible" : "hidden";
      if (!seen) return;

      const p = project(anchor[0], anchor[1], anchor[2]);
      const pop = 1 - Math.pow(1 - seg(t, label.at, 0.16), 3);
      const baseScale = lerp(label.scale, 1, pull);
      const pulseHit = arrived
        ? Math.exp(-Math.pow((pulseY - label.y) / 6, 2))
        : 0;
      const scale = baseScale * (1 + (1 - pop) * 0.34) * (1 + pulseHit * 0.08 + kick * 0.03);

      const cx = compact ? W - side - (w * baseScale) / 2 : W / 2;
      const x = cx - w / 2;
      const y = p.y - lh / 2;
      el.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) scale(${scale.toFixed(4)})`;
      el.style.outline = pulseHit > 0.02 ? `${(3 * pulseHit).toFixed(2)}px solid ${V.glow}` : "none";

      if (showLeader) {
        const endX = cx - (w * baseScale) / 2;
        const ax = clamp(p.x, 0, endX - 24);
        leader.line.setAttribute("x1", ax.toFixed(2));
        leader.line.setAttribute("y1", p.y.toFixed(2));
        leader.line.setAttribute("x2", endX.toFixed(2));
        leader.line.setAttribute("y2", p.y.toFixed(2));
        leader.dot.setAttribute("cx", ax.toFixed(2));
        leader.dot.setAttribute("cy", p.y.toFixed(2));
        const o = (seg(t, label.at + 0.04, 0.12)).toFixed(3);
        leader.line.style.opacity = o;
        leader.dot.style.opacity = o;
      }
    });

    // The tip's label: big above the tip at the start, small beside it once the scale is known.
    const tipAnchor = project(0, compact ? 7.4 : 7.8, 0);
    const tipSeen = t >= 0.08;
    tipEl.style.visibility = tipSeen ? "visible" : "hidden";
    if (tipSeen) {
      const pop = 1 - Math.pow(1 - seg(t, 0.08, 0.2), 3);
      const finalTip = seg(t, 3.7, 0.1) > 0;
      const scale = (finalTip ? tipFinal : 1) * (1 + (1 - pop) * 0.2);
      let x = tipAnchor.x - tipW / 2;
      let y = tipAnchor.y - tipH;
      if (finalTip) {
        const near = project(4.2, 3.2, 0);
        x = near.x + 18 - (tipW * (1 - tipFinal)) / 2;
        y = near.y - tipH / 2;
      }
      if (!finalTip) y -= smooth(seg(t, 1.12, 0.34)) * (y + tipH + 60);
      x = clamp(x, side - (tipW * (1 - scale)) / 2, W - side - tipW + (tipW * (1 - scale)) / 2);
      tipEl.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) scale(${scale.toFixed(4)})`;
    }

    // The hero line stamps on the key frame and not one frame before.
    heroEl.style.visibility = arrived ? "visible" : "hidden";
    if (arrived) {
      const stamp = 1 + Math.exp(-h * 15) * HERO_PUNCH + Math.max(0, kick) * HERO_PUNCH * 0.2;
      const drift = 1 + h * 0.012;
      heroEl.style.transform =
        `translate(${side}px, ${heroTop.toFixed(2)}px) scale(${(stamp * drift).toFixed(4)})`;
    }

    const open = variant === "overlay" ? out(seg(time, 0, 0.26), 3) : 1;
    const exitDuration = Math.max(0, T.exit - 1 / CA.fps);
    let closed = T.exit > 0 ? seg(time, T.key + T.hold, exitDuration) : 0;
    if (closed > 1 - 0.0000001) closed = 1;

    if (open >= 0.999999 && closed === 0) {
      stageEl.style.clipPath = "none";
    } else {
      const focus = closed > 0 ? project(0, BASE_Y + 4, 0) : { x: W / 2, y: H * 0.55 };
      const radius = Math.hypot(W, H) * (closed > 0 ? 0.8 : 0.58) * open * Math.pow(1 - closed, 1.3);
      stageEl.style.clipPath =
        `circle(${Math.max(0, radius).toFixed(3)}px at ${focus.x.toFixed(2)}px ${focus.y.toFixed(2)}px)`;
    }
  }

  window.addEventListener("hf-seek", (event) => renderAt(event.detail.time));
  renderAt(window.__hfThreeTime || 0);
  window.__timelines["block"] = gsap.timeline({ paused: true });
});
