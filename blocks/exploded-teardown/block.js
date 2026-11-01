import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/RoundedBoxGeometry.js";

CA.ready(() => {
  const { vars: V, stage: S, safe, time: T, variant, make, fit } = CA;
  const $ = (id) => document.getElementById(id);
  const clamp = (value, lo = 0, hi = 1) =>
    Math.min(hi, Math.max(lo, value));
  const n = (id, fallback, lo, hi) => {
    const value = Number(V[id]);
    return clamp(Number.isFinite(value) ? value : fallback, lo, hi);
  };
  const seg = (t, at, duration) =>
    clamp((t - at) / Math.max(0.0001, duration));
  const out = (p, power = 3) => 1 - Math.pow(1 - p, power);
  const smooth = (p) => p * p * (3 - 2 * p);
  const mix = (a, b, p) => a + (b - a) * p;

  const W = S.w;
  const H = S.h;
  const compact = variant !== "full";
  const shortStage = compact && H < 780;
  const minText = compact ? 32 : 40;
  const referenceFps = n("referenceFps", 30, 1, 120);
  const outputFps = Math.max(1, Number(CA.fps) || 30);
  const frame = (value) => Number(value) / referenceFps;
  const designAt = (time) => Math.max(
    0,
    time <= T.key ? time / Math.max(0.0001, T.scale) : T.design
  );

  const side = Math.max(Number(safe.side) || 0, compact ? 40 : 56);
  const contentTop = compact
    ? Math.max(24, Math.min(Number(safe.top) || 32, 40))
    : Math.max(Number(safe.top) || 0, 230);
  const contentBottom = compact
    ? H - Math.max(24, Math.min(Number(safe.bottom) || 32, 40))
    : H - Math.max(Number(safe.bottom) || 0, 300);

  const layouts = {
    full: {
      name: 48, spec: 42, number: 42, numberW: 66,
      labelH: 168, labelGap: 14, headingGap: 12,
      activeName: 68, activeSpec: 44, activeNumber: 52,
      activeNumberW: 84, activeY: 24,
      header: 72, headerGap: 24,
      headline: 100, dimension: 42,
      buildFooterH: 208, finalFooterH: 208,
      headlineY: 26, dimensionY: 150,
      modelGap: 22, barW: 266, barH: 8
    },
    top: {
      name: 44, spec: 34, number: 36, numberW: 58,
      labelH: 108, labelGap: 22, headingGap: 10,
      activeName: 58, activeSpec: 36, activeNumber: 44,
      activeNumberW: 72, activeY: 18,
      header: 44, headerGap: 12,
      headline: 56, dimension: 32,
      buildFooterH: 146, finalFooterH: 92,
      headlineY: 23, dimensionY: 39,
      modelGap: 14, barW: 224, barH: 6
    },
    overlay: {
      name: 46, spec: 34, number: 36, numberW: 58,
      labelH: 110, labelGap: 22, headingGap: 10,
      activeName: 60, activeSpec: 38, activeNumber: 46,
      activeNumberW: 74, activeY: 18,
      header: 46, headerGap: 12,
      headline: 58, dimension: 32,
      buildFooterH: 152, finalFooterH: 94,
      headlineY: 23, dimensionY: 41,
      modelGap: 14, barW: 236, barH: 6
    }
  };
  const M = { ...(layouts[variant] || layouts.full) };

  if (shortStage) {
    Object.assign(M, {
      name: 40, spec: 32, number: 34, numberW: 54,
      labelH: 58, labelGap: 18,
      activeName: 48, activeSpec: 32, activeNumber: 38,
      activeNumberW: 64,
      header: 36, headerGap: 10,
      headline: 50, dimension: 32,
      buildFooterH: 132, finalFooterH: 86,
      headlineY: 22, dimensionY: 34
    });
  }

  const titleW = W - side * 2;
  const buildFooterY = contentBottom - M.buildFooterH;
  const finalFooterY = contentBottom - M.finalFooterH;
  const modelTop = contentTop + M.header + M.headerGap;
  const buildModelBottom = Math.max(
    modelTop + 180, buildFooterY - M.modelGap
  );
  const finalModelBottom = Math.max(
    modelTop + 180, finalFooterY - M.modelGap
  );
  const finalModelH = finalModelBottom - modelTop;

  const labelX = Math.round(W * (compact ? 0.515 : 0.52));
  const labelW = W - side - labelX;
  const modelRight = labelX - (compact ? 26 : 32);
  const productX = (side + modelRight) / 2;
  const finalProductW = Math.max(160, modelRight - side);

  const finalElev = THREE.MathUtils.degToRad(
    compact
      ? n("compactElevation", 10, 6, 28)
      : n("fullElevation", 14, 8, 32)
  );
  const initialElev = THREE.MathUtils.degToRad(compact ? 28 : 34);
  const orbit = THREE.MathUtils.degToRad(n("cameraOrbit", 10, -20, 20));
  const holdOrbit = THREE.MathUtils.degToRad(n("holdOrbit", 8, 0, 12));
  const impactScale = n("impactScale", 1.055, 1, 1.12);
  const finalAzimuth = Math.PI / 4;

  $("et-bg").style.background =
    `radial-gradient(ellipse at 36% 40%, ${V.bgCenter} 0%, ${V.bgEdge} 82%)`;
  $("et-grain").style.backgroundImage = CA.grainUrl(
    180, 1, n("grainSeed", 17, 0, 2147483647)
  );
  $("et-grain").style.opacity = n("grainAmount", 0.045, 0, 0.25);
  $("et-gl").setAttribute("role", "img");
  $("et-gl").setAttribute("aria-label", String(V.productName));

  const diameterMm = n("productDiameter", 92, 70, 120);
  const heightMm = n("productHeight", 55, 42, 80);
  const D = diameterMm / 10;
  const PH = heightMm / 10;
  const R = D / 2;
  const grilleT = n("grilleThickness", 0.8, 0.4, 2.5) / 10;
  const driverR = Math.min(
    n("driverDiameter", 45, 25, 65) / 20, R * 0.64
  );
  const shellH = PH - grilleT - 0.1;
  const driverH = Math.min(D * 0.16, PH * 0.29);
  const boardH = PH * 0.115;
  const batteryH = PH * 0.16;
  const baseLift = n("baseLiftMm", 3.2, 0.5, 8) / 10;
  const requestedGap = compact
    ? n("compactGapMm", 10, 8, 28) / 10
    : n("layerGapMm", 20, 16, 48) / 10;
  const projectedClearance =
    n("projectionClearanceMm", 3, 1, 12) / 10;

  const renderer = new THREE.WebGLRenderer({
    canvas: $("et-gl"),
    alpha: true,
    antialias: true,
    preserveDrawingBuffer: true,
    premultipliedAlpha: true
  });
  renderer.setPixelRatio(2);
  renderer.setSize(W, H, false);
  renderer.setClearColor(0x000000, 0);
  renderer.autoClear = false;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(V.ink, V.bgEdge, 0.95));

  const keyLight = new THREE.DirectionalLight(V.ink, 1.55);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(2048, 2048);
  keyLight.shadow.bias = -0.00035;
  keyLight.shadow.normalBias = 0.025;
  Object.assign(keyLight.shadow.camera, {
    left: -14, right: 14, top: 30, bottom: -30, near: 1, far: 100
  });
  scene.add(keyLight, keyLight.target);

  const fillLight = new THREE.DirectionalLight(V.muted, 0.75);
  fillLight.position.set(10, 12, -12);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(V.ink, 1.65);
  scene.add(rimLight);

  const studioFaces = Array.from({ length: 6 }, (_, index) => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = V.shellColor;
    ctx.fillRect(0, 0, 256, 256);

    const centers = [76, 180, 100, 156, 64, 190];
    const center = centers[index];
    const gradient = ctx.createLinearGradient(
      center - 150, 0, center + 150, 0
    );
    gradient.addColorStop(0, V.darkMetal);
    gradient.addColorStop(0.32, V.silverColor);
    gradient.addColorStop(0.5, V.ink);
    gradient.addColorStop(0.7, V.silverColor);
    gradient.addColorStop(1, V.darkMetal);
    ctx.globalAlpha = index === 3 ? 0.24 : 0.44;
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
    ctx.globalAlpha = 1;
    return canvas;
  });

  const studioCube = new THREE.CubeTexture(studioFaces);
  studioCube.mapping = THREE.CubeReflectionMapping;
  studioCube.colorSpace = THREE.SRGBColorSpace;
  studioCube.needsUpdate = true;

  const material = (color, metalness, roughness) =>
    new THREE.MeshPhongMaterial({
      color,
      emissive: new THREE.Color(color).multiplyScalar(0.018),
      specular: new THREE.Color(V.silverColor)
        .multiplyScalar(metalness > 0.5 ? 0.44 : 0.1),
      shininess: mix(60, 12, roughness),
      envMap: metalness > 0.5 ? studioCube : null,
      combine: THREE.MixOperation,
      reflectivity: metalness * 0.22
    });

  const mats = {
    grille: material(V.grilleColor, 0.82, 0.43),
    basket: material(V.darkMetal, 0.76, 0.4),
    cone: material(V.coneColor, 0.02, 0.96),
    rubber: material(V.rubberColor, 0.01, 0.88),
    board: material(V.boardColor, 0.05, 0.7),
    copper: material(V.copperColor, 0.8, 0.35),
    silver: material(V.silverColor, 0.85, 0.38),
    shell: material(V.shellColor, 0.8, 0.36),
    polymer: material(V.polymerColor, 0.02, 0.72),
    brass: material(V.brassColor, 0.8, 0.35),
    accent: material(V.accent, 0.05, 0.55)
  };
  mats.cone.side = THREE.DoubleSide;

  const mesh = (geo, mat, parent, x = 0, y = 0, z = 0) => {
    const object = new THREE.Mesh(geo, mat);
    object.position.set(x, y, z);
    object.castShadow = true;
    object.receiveShadow = true;
    parent.add(object);
    return object;
  };

  const cylinder = (radius, height, mat, parent, x = 0, y = 0, z = 0) =>
    mesh(
      new THREE.CylinderGeometry(radius, radius, height, 64),
      mat, parent, x, y, z
    );

  const rounded = (w, h, d, radius, mat, parent, x = 0, y = 0, z = 0) =>
    mesh(
      new RoundedBoxGeometry(
        w, h, d, 3, Math.min(radius, w / 3, h / 3, d / 3)
      ),
      mat, parent, x, y, z
    );

  const torus = (radius, tube, mat, parent, y = 0) => {
    const object = mesh(
      new THREE.TorusGeometry(radius, tube, 12, 96),
      mat, parent, 0, y, 0
    );
    object.rotation.x = Math.PI / 2;
    return object;
  };

  const lathe = (points, mat, parent) =>
    mesh(
      new THREE.LatheGeometry(
        points.map(([x, y]) => new THREE.Vector2(x, y)), 96
      ),
      mat, parent
    );

  const strut = (from, to, radius, mat, parent) => {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    const direction = b.clone().sub(a);
    const object = cylinder(radius, direction.length(), mat, parent);
    object.position.copy(a.add(b).multiplyScalar(0.5));
    object.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0), direction.normalize()
    );
    return object;
  };

  const root = new THREE.Group();
  scene.add(root);
  const groups = Array.from({ length: 5 }, () => {
    const group = new THREE.Group();
    root.add(group);
    return group;
  });

  // 01: perforated aluminum, including the walls of the holes.
  const grilleShape = new THREE.Shape();
  const grilleR = R * 0.978;
  grilleShape.absarc(0, 0, grilleR, 0, Math.PI * 2, false);
  const holePitch = D * 0.042;
  const holeR = holePitch * 0.23;

  for (let row = -13; row <= 13; row++) {
    const z = row * holePitch * Math.sqrt(3) / 2;
    for (let column = -13; column <= 13; column++) {
      const x = (column + (Math.abs(row) % 2) * 0.5) * holePitch;
      if (Math.hypot(x, z) > grilleR - holePitch * 0.8) continue;
      const hole = new THREE.Path();
      hole.absarc(x, z, holeR, 0, Math.PI * 2, true);
      grilleShape.holes.push(hole);
    }
  }

  const grilleGeometry = new THREE.ExtrudeGeometry(grilleShape, {
    depth: grilleT,
    bevelEnabled: false,
    curveSegments: 3,
    steps: 1
  });
  grilleGeometry.rotateX(-Math.PI / 2);
  mesh(grilleGeometry, mats.grille, groups[0]);
  torus(grilleR - 0.035, 0.035, mats.grille, groups[0], grilleT * 0.5);

  // 02: open basket, cone, dust cap, rubber roll and screws.
  const driver = groups[1];
  const flangeR = R * 0.83;
  lathe([
    [driverR * 1.04, driverH * 0.87],
    [flangeR, driverH * 0.87],
    [flangeR, driverH],
    [driverR * 1.04, driverH]
  ], mats.basket, driver);

  cylinder(
    driverR * 0.57, driverH * 0.3, mats.basket,
    driver, 0, driverH * 0.15
  );

  for (let i = 0; i < 6; i++) {
    const angle = i / 6 * Math.PI * 2;
    strut(
      [
        Math.cos(angle) * driverR * 0.56,
        driverH * 0.24,
        Math.sin(angle) * driverR * 0.56
      ],
      [
        Math.cos(angle) * flangeR * 0.86,
        driverH * 0.9,
        Math.sin(angle) * flangeR * 0.86
      ],
      D * 0.026, mats.basket, driver
    );
  }

  lathe([
    [driverR * 0.13, driverH * 0.3],
    [driverR * 0.28, driverH * 0.32],
    [driverR * 0.56, driverH * 0.54],
    [driverR * 0.83, driverH * 0.84],
    [driverR * 0.94, driverH * 0.91]
  ], mats.cone, driver);

  const dustCap = mesh(
    new THREE.SphereGeometry(driverR * 0.29, 40, 20),
    mats.cone, driver, 0, driverH * 0.37
  );
  dustCap.scale.y = 0.5;
  torus(
    driverR * 0.96, driverR * 0.085,
    mats.rubber, driver, driverH * 0.93
  );

  for (let i = 0; i < 4; i++) {
    const angle = Math.PI / 4 + i * Math.PI / 2;
    const sx = Math.cos(angle) * flangeR * 0.83;
    const sz = Math.sin(angle) * flangeR * 0.83;
    cylinder(
      D * 0.014, 0.07, mats.shell,
      driver, sx, driverH + 0.025, sz
    );
    rounded(
      D * 0.018, 0.012, 0.025, 0.004, mats.polymer,
      driver, sx, driverH + 0.066, sz
    );
  }

  // 03: copper traces, pads and raised components.
  const pcb = groups[2];
  const pcbR = R * 0.84;
  const pcbT = PH * 0.025;
  cylinder(pcbR, pcbT, mats.board, pcb, 0, pcbT / 2);

  const copperRoute = (points) => {
    const vectors = points.map(([x, z]) =>
      new THREE.Vector3(x, pcbT + 0.012, z)
    );
    for (let i = 0; i < vectors.length - 1; i++) {
      strut(
        vectors[i].toArray(), vectors[i + 1].toArray(),
        D * 0.003, mats.copper, pcb
      );
    }
  };

  for (let i = 0; i < 5; i++) {
    const z = (i - 2) * D * 0.07;
    copperRoute([
      [-D * 0.31, z],
      [-D * 0.17, z],
      [-D * 0.1, z + D * 0.055],
      [D * 0.21, z + D * 0.055]
    ]);
  }

  rounded(
    D * 0.22, boardH - pcbT, D * 0.18, 0.04,
    mats.polymer, pcb, -D * 0.04, (boardH + pcbT) / 2, 0
  );

  for (let i = 0; i < 8; i++) {
    const x = -D * 0.125 + i * D * 0.024;
    rounded(
      D * 0.013, 0.05, D * 0.037, 0.008,
      mats.silver, pcb, x, pcbT + 0.05, D * 0.115
    );
    rounded(
      D * 0.013, 0.05, D * 0.037, 0.008,
      mats.silver, pcb, x, pcbT + 0.05, -D * 0.115
    );
  }

  for (let i = 0; i < 4; i++) {
    rounded(
      D * 0.075, boardH * 0.45, D * 0.045, 0.025,
      mats.polymer, pcb, D * 0.23, pcbT + boardH * 0.225,
      (i - 1.5) * D * 0.11
    );
  }

  rounded(
    D * 0.14, boardH * 0.65, D * 0.08, 0.04,
    mats.accent, pcb, -D * 0.21, pcbT + boardH * 0.325, -D * 0.19
  );

  for (let i = 0; i < 3; i++) {
    const angle = i / 3 * Math.PI * 2;
    const x = Math.cos(angle) * pcbR * 0.83;
    const z = Math.sin(angle) * pcbR * 0.83;
    cylinder(D * 0.036, 0.045, mats.copper, pcb, x, pcbT + 0.024, z);
    cylinder(D * 0.017, 0.052, mats.polymer, pcb, x, pcbT + 0.027, z);
  }

  // 04: silver pouch cells and their circular carrier.
  const battery = groups[3];
  const holderR = R * 0.82;
  cylinder(
    holderR, batteryH * 0.16, mats.polymer,
    battery, 0, batteryH * 0.08
  );
  torus(
    holderR - D * 0.018, D * 0.018,
    mats.polymer, battery, batteryH * 0.18
  );

  const pouchW = D * 0.285;
  const pouchD = D * 0.51;
  for (const sign of [-1, 1]) {
    const x = sign * D * 0.154;
    rounded(
      pouchW, batteryH * 0.76, pouchD, batteryH * 0.11,
      mats.silver, battery, x, batteryH * 0.58, 0
    );
    rounded(
      pouchW * 0.96, batteryH * 0.055, pouchD * 0.96, 0.018,
      mats.silver, battery, x, batteryH * 0.985, 0
    );
    rounded(
      D * 0.066, 0.045, D * 0.12, 0.01,
      mats.copper, battery, x, batteryH * 0.7, -pouchD / 2
    );
  }

  rounded(
    D * 0.035, batteryH * 0.72, D * 0.53, 0.025,
    mats.polymer, battery, 0, batteryH * 0.5, 0
  );

  // 05: hollow shell, inner wall, posts and power button.
  const base = groups[4];
  const wall = D * 0.026;
  lathe([
    [0, 0],
    [R - 0.12, 0],
    [R, 0.12],
    [R, shellH - 0.1],
    [R - 0.06, shellH],
    [R - wall, shellH],
    [R - wall, 0.34],
    [0, 0.34]
  ], mats.shell, base);

  torus(R * 0.86, D * 0.023, mats.rubber, base, 0.015);
  torus(R - wall * 0.6, D * 0.012, mats.rubber, base, shellH - 0.025);

  for (let i = 0; i < 3; i++) {
    const angle = i / 3 * Math.PI * 2;
    const x = Math.cos(angle) * R * 0.73;
    const z = Math.sin(angle) * R * 0.73;
    cylinder(
      D * 0.047, shellH * 0.7, mats.brass,
      base, x, shellH * 0.35 + 0.34, z
    );
    cylinder(
      D * 0.019, 0.045, mats.polymer,
      base, x, shellH * 0.7 + 0.365, z
    );
  }

  const powerButton = cylinder(
    D * 0.041, 0.075, mats.polymer, base,
    0, PH * 0.39, R + 0.015
  );
  powerButton.rotation.x = Math.PI / 2;

  const heights = [grilleT, driverH, boardH, batteryH, shellH];
  const radii = [grilleR, flangeR, pcbR, holderR, R];
  const closedY = [
    PH - grilleT, PH * 0.68, PH * 0.41, PH * 0.13, 0
  ];
  const openY = [0, 0, 0, 0, baseLift];
  let topOfPrevious = baseLift + shellH;

  // Reserve visible space between projected silhouettes, not just mesh origins.
  // This prevents the grille from hiding the driver in compact outputs.
  for (let i = 3; i >= 0; i--) {
    const silhouetteGap =
      (radii[i] + radii[i + 1]) * Math.tan(finalElev) +
      projectedClearance / Math.cos(finalElev);
    const gap = Math.max(requestedGap, silhouetteGap);
    openY[i] = topOfPrevious + gap;
    topOfPrevious = openY[i] + heights[i];
  }
  const openHeight = topOfPrevious;

  const rawFirstLift = frame(n("firstLiftFrame", 10, 0, 60));
  const rawLiftInterval = frame(n("liftIntervalFrames", 20, 6, 36));
  const rawLeaderDelay = frame(n("leaderDelayFrames", 4, 0, 30));
  const scheduleScale = Math.min(
    1,
    Math.max(
      0.05,
      (T.design - 0.64) /
      Math.max(0.001, rawFirstLift + rawLiftInterval * 4 + rawLeaderDelay)
    )
  );
  const firstLift = rawFirstLift * scheduleScale;
  const liftInterval = rawLiftInterval * scheduleScale;
  const leaderDelay = rawLeaderDelay * scheduleScale;
  const liftStarts = groups.map((_, i) => firstLift + i * liftInterval);
  const labelStarts = liftStarts.map((at) => at + leaderDelay);

  const totalLifts = closedY.map((y, i) => openY[i] - y);
  const releaseLifts = totalLifts.map((lift, i) =>
    lift - (i < 4 ? totalLifts[i + 1] : 0)
  );

  const mass = n("springMass", 1, 0.1, 8);
  const stiffness = n("springStiffness", 600, 40, 1800);
  const damping = n("springDamping", 29, 3, 100);
  const omega = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));

  const spring = (elapsed) => {
    if (elapsed <= 0) return 0;
    const settleAt = Math.max(0.6, 8 / Math.max(1, zeta * omega));
    if (elapsed >= settleAt) return 1;

    if (zeta < 0.999) {
      const wd = omega * Math.sqrt(1 - zeta * zeta);
      return 1 - Math.exp(-zeta * omega * elapsed) *
        (Math.cos(wd * elapsed) +
          zeta * omega / wd * Math.sin(wd * elapsed));
    }
    if (zeta <= 1.001) {
      return 1 - Math.exp(-omega * elapsed) * (1 + omega * elapsed);
    }

    const rootValue = Math.sqrt(zeta * zeta - 1);
    const r1 = -omega * (zeta - rootValue);
    const r2 = -omega * (zeta + rootValue);
    return 1 + (
      r2 * Math.exp(r1 * elapsed) -
      r1 * Math.exp(r2 * elapsed)
    ) / (r1 - r2);
  };

  const dockDuration = Math.min(
    Math.max(0.18, frame(n("cameraPullFrames", 30, 6, 90))),
    T.design * 0.32
  );
  const dockStart = T.design - dockDuration;
  const finalLabelsStart = T.design - 0.24;
  const finalLabelStagger = 0.024;
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 180);

  const collarMaterial = new THREE.MeshBasicMaterial({ color: V.accent });
  const collarY = [
    grilleT * 0.5, driverH, pcbT + 0.025, batteryH * 0.2, shellH
  ];
  const collars = groups.map((group, i) => {
    const collar = torus(
      radii[i] * 0.995, D * 0.009, collarMaterial, group, collarY[i]
    );
    collar.castShadow = false;
    collar.receiveShadow = false;
    collar.visible = false;
    return collar;
  });

  function keyImpact(time) {
    if (time < T.key) {
      const p = seg(time, T.key - 2 / outputFps, 2 / outputFps);
      return p * p;
    }
    return Math.pow(1 - seg(time, T.key, 0.26), 3);
  }

  let viewBounds = {
    left: side, right: modelRight, top: modelTop, bottom: finalModelBottom
  };

  function updateScene(time) {
    const t = designAt(time);
    const dock = out(seg(t, dockStart, dockDuration), 3);
    const elev = mix(
      initialElev,
      finalElev,
      smooth(seg(t, firstLift, Math.max(0.1, T.design - firstLift)))
    );
    const az = finalAzimuth - orbit +
      orbit * smooth(seg(t, 0, T.design));
    const finalSettle = smooth(seg(t, T.design - 0.38, 0.24));
    const releaseAt = (index) =>
      mix(spring(t - liftStarts[index]), 1, finalSettle);

    for (let i = 0; i < groups.length; i++) {
      let y = closedY[i];
      for (let release = i; release < groups.length; release++) {
        y += releaseLifts[release] * releaseAt(release);
      }
      groups[i].position.y = y;
    }

    const held = Math.max(0, time - T.key);
    const holdTravel = (
      held - 0.08 * (1 - Math.exp(-held / 0.08))
    ) / Math.max(0.5, T.hold);
    root.rotation.y = holdOrbit * holdTravel;

    const allRims =
      time >= T.key - 1 / outputFps && time < T.key + 0.2;

    collars.forEach((collar, i) => {
      const p = seg(t, labelStarts[i], 0.2);
      const releasePulse = p > 0 && p < 1;
      const permanentBase = i === 4 && time >= T.key;
      collar.visible = releasePulse || allRims || permanentBase;
      const pulse = allRims
        ? keyImpact(time)
        : releasePulse ? Math.sin(Math.PI * p) : 0;
      collar.scale.setScalar(1 + pulse * 0.045);
    });

    const c = Math.cos(elev);
    const s = Math.sin(elev);
    let upper = -Infinity;
    let lower = Infinity;

    groups.forEach((group, i) => {
      upper = Math.max(
        upper, (group.position.y + heights[i]) * c + radii[i] * s
      );
      lower = Math.min(lower, group.position.y * c - radii[i] * s);
    });

    const modelBottom = mix(buildModelBottom, finalModelBottom, dock);
    const modelH = modelBottom - modelTop;
    const modelCenter = (modelTop + modelBottom) / 2;
    const centerX = mix(W / 2, productX, dock);
    const widthPpu = mix(
      (W - side * 2) / D,
      finalProductW / D,
      dock
    );
    const fitPpu = Math.min(
      widthPpu,
      modelH * 0.985 / Math.max(0.1, upper - lower)
    );

    // The key punch has reserved room on all sides.
    const ppu = fitPpu / impactScale *
      mix(1, impactScale, keyImpact(time));
    const targetY = (upper + lower) / (2 * c);

    camera.left = -centerX / ppu;
    camera.right = (W - centerX) / ppu;
    camera.top = modelCenter / ppu;
    camera.bottom = -(H - modelCenter) / ppu;
    camera.position.set(
      Math.sin(az) * c * 70,
      targetY + s * 70,
      Math.cos(az) * c * 70
    );
    camera.lookAt(0, targetY, 0);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();

    viewBounds = {
      left: centerX - R * ppu,
      right: centerX + R * ppu,
      top: modelCenter - (upper - lower) * ppu / 2,
      bottom: modelCenter + (upper - lower) * ppu / 2
    };

    const lightTravel =
      0.55 * smooth(seg(t, 0, T.design)) +
      0.35 * Math.sin(held * 0.65);
    keyLight.position.set(
      mix(-13, -3, lightTravel), openHeight + 10, 15
    );
    keyLight.target.position.set(0, openHeight * 0.45, 0);
    rimLight.position.set(
      mix(7, 15, lightTravel), openHeight * 0.72 + 8, -10
    );
    scene.updateMatrixWorld(true);
  }

  const bufferSize = renderer.getDrawingBufferSize(new THREE.Vector2());
  const targetType = renderer.extensions.has("EXT_color_buffer_float")
    ? THREE.HalfFloatType : THREE.UnsignedByteType;
  const sceneTarget = new THREE.WebGLRenderTarget(
    bufferSize.x, bufferSize.y, {
      type: targetType,
      depthBuffer: true,
      stencilBuffer: false
    }
  );
  const sumTarget = new THREE.WebGLRenderTarget(
    bufferSize.x, bufferSize.y, {
      type: targetType,
      depthBuffer: false,
      stencilBuffer: false
    }
  );
  const quadGeometry = new THREE.PlaneGeometry(2, 2);
  const quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 2);
  quadCamera.position.z = 1;

  const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position.xy, 0.0, 1.0);
    }
  `;

  const accumulateMaterial = new THREE.ShaderMaterial({
    uniforms: {
      source: { value: sceneTarget.texture },
      weight: { value: 1 }
    },
    vertexShader,
    fragmentShader: `
      uniform sampler2D source;
      uniform float weight;
      varying vec2 vUv;
      void main() {
        vec4 c = texture2D(source, vUv);
        gl_FragColor = vec4(c.rgb * c.a, c.a) * weight;
      }
    `,
    transparent: true,
    blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneFactor,
    blendEquationAlpha: THREE.AddEquation,
    blendSrcAlpha: THREE.OneFactor,
    blendDstAlpha: THREE.OneFactor,
    depthTest: false,
    depthWrite: false,
    toneMapped: false
  });

  const presentMaterial = new THREE.ShaderMaterial({
    uniforms: { source: { value: sumTarget.texture } },
    vertexShader,
    fragmentShader: `
      uniform sampler2D source;
      varying vec2 vUv;
      void main() {
        vec4 c = texture2D(source, vUv);
        gl_FragColor = vec4(
          c.a > 0.00001 ? c.rgb / c.a : vec3(0.0),
          c.a
        );
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <premultiplied_alpha_fragment>
      }
    `,
    premultipliedAlpha: true,
    blending: THREE.NoBlending,
    depthTest: false,
    depthWrite: false,
    toneMapped: true
  });

  const accumulateScene = new THREE.Scene();
  accumulateScene.add(new THREE.Mesh(quadGeometry, accumulateMaterial));
  const presentScene = new THREE.Scene();
  presentScene.add(new THREE.Mesh(quadGeometry, presentMaterial));

  const requestedSamples = Math.round(n("temporalSamples", 8, 1, 16));
  const shutter = n("shutterAngle", 120, 0, 360) / 360 / outputFps;

  function renderProduct(time) {
    const t = designAt(time);
    const fast = t < firstLift + 0.1 ||
      liftStarts.some((at) => t >= at - 0.03 && t < at + 0.6) ||
      (t >= dockStart && time < T.key + 0.3);
    const samples = fast && shutter > 0 ? requestedSamples : 1;

    renderer.setRenderTarget(sumTarget);
    renderer.clear();
    accumulateMaterial.uniforms.weight.value = 1 / samples;

    for (let i = 0; i < samples; i++) {
      const sampleTime = samples === 1
        ? time
        : Math.max(0, time + ((i + 0.5) / samples - 0.5) * shutter);
      updateScene(sampleTime);
      renderer.setRenderTarget(sceneTarget);
      renderer.clear();
      renderer.render(scene, camera);
      renderer.setRenderTarget(sumTarget);
      renderer.render(accumulateScene, quadCamera);
    }

    renderer.setRenderTarget(null);
    renderer.clear();
    renderer.render(presentScene, quadCamera);
    updateScene(time);
  }

  const svg = $("et-leaders");
  const svgNS = "http://www.w3.org/2000/svg";
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);

  const svgElement = (tag) => {
    const element = document.createElementNS(svgNS, tag);
    svg.appendChild(element);
    return element;
  };

  const anchorHeights = [
    grilleT + 0.012,
    driverH + 0.015,
    pcbT + 0.025,
    batteryH * 0.75,
    shellH - 0.07
  ];

  const toScreen = (point) => {
    const p = point.clone().project(camera);
    return [(p.x + 1) * W / 2, (1 - p.y) * H / 2];
  };

  const anchorFor = (index) => {
    const az = finalAzimuth - root.rotation.y;
    const right = new THREE.Vector3(Math.cos(az), 0, -Math.sin(az));
    const front = new THREE.Vector3(Math.sin(az), 0, Math.cos(az));
    const point = right.multiplyScalar(radii[index] * 0.96)
      .addScaledVector(front, radii[index] * 0.18);
    point.y = anchorHeights[index];
    return groups[index].localToWorld(point);
  };

  updateScene(T.key);
  const rowStep = Math.min(
    M.labelH + M.labelGap,
    (finalModelH - M.labelH) / 4
  );
  const maxTop = finalModelBottom - M.labelH;
  const labelTops = groups.map((_, i) => {
    const [, y] = toScreen(anchorFor(i));
    return clamp(
      y - M.name * 0.55,
      modelTop + i * rowStep,
      maxTop - (4 - i) * rowStep
    );
  });

  for (let i = 1; i < labelTops.length; i++) {
    labelTops[i] = Math.max(labelTops[i], labelTops[i - 1] + rowStep);
  }

  function fitCopy(element, text, size, width, allowSplit) {
    element.textContent = text;
    element.style.fontSize = `${size}px`;
    element.style.whiteSpace = "nowrap";
    element.style.width = "auto";
    element.style.maxWidth = "none";
    fit(element, width, minText);

    const fontSize = parseFloat(element.style.fontSize) || size;
    let displayed = text;
    let wrap = false;

    if (element.getBoundingClientRect().width > width + 0.25) {
      if (allowSplit && text.includes(" / ")) {
        displayed = text.split(" / ").map((part) => part.trim()).join("\n");
        element.textContent = displayed;
        element.style.whiteSpace = "pre-line";
      } else {
        element.style.whiteSpace = "normal";
      }
      element.style.width = `${width}px`;
      element.style.maxWidth = `${width}px`;
      wrap = true;
    }

    return { size: fontSize, text: displayed, wrap, width };
  }

  const labels = groups.map((_, i) => {
    const number = i + 1;
    const el = make("div", "et-label", $("et-labels"));
    const inner = make("div", "et-label-inner", el);
    const heading = make("div", "et-label-heading", inner);
    const num = make(
      "span", "et-number", heading, String(V[`layer${number}Number`])
    );
    const name = make("span", "et-part-name", heading);
    const spec = make("span", "et-spec", inner);
    const nameText = String(V[`layer${number}Name`] || "").trim();
    const specText = String(V[`layer${number}Spec`] || "").trim();

    el.style.cssText =
      `left:${labelX}px;top:${labelTops[i]}px;` +
      `width:${labelW}px;height:${M.labelH}px;visibility:hidden`;
    heading.style.gap = `${M.headingGap}px`;
    num.style.color = V.accent;
    name.style.color = V.ink;
    spec.style.color = V.muted;
    spec.style.marginTop = compact ? "6px" : "8px";

    // Measure the complete number at both sizes. Its reserved space never scales.
    num.style.fontSize = `${M.number}px`;
    num.style.width = "auto";
    const finalNumberW = Math.max(
      M.numberW, Math.ceil(num.getBoundingClientRect().width) + 8
    );
    num.style.fontSize = `${M.activeNumber}px`;
    const activeNumberW = Math.max(
      M.activeNumberW, Math.ceil(num.getBoundingClientRect().width) + 8
    );

    const finalUsableW = Math.max(80, labelW - 18);
    const activeUsableW = Math.max(80, titleW - 18);
    const finalName = fitCopy(
      name, nameText, M.name,
      Math.max(60, finalUsableW - finalNumberW - M.headingGap),
      false
    );
    const finalSpec = fitCopy(
      spec, specText, M.spec, finalUsableW, true
    );
    const activeName = fitCopy(
      name, nameText, M.activeName,
      Math.max(60, activeUsableW - activeNumberW - M.headingGap),
      false
    );
    const activeSpec = fitCopy(
      spec, specText, M.activeSpec, activeUsableW, true
    );

    const path = svgElement("path");
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", V.leader);
    path.setAttribute("stroke-width", compact ? "2.6" : "3");
    path.setAttribute("stroke-linecap", "round");
    path.style.visibility = "hidden";

    const dot = svgElement("circle");
    dot.setAttribute("fill", V.ink);
    dot.style.visibility = "hidden";

    return {
      el, inner, num, name, spec, path, dot,
      finalNumberW, activeNumberW,
      finalName, finalSpec, activeName, activeSpec,
      lineY: labelTops[i] + finalName.size * 0.58,
      mode: null
    };
  });

  const keyBrackets = svgElement("path");
  keyBrackets.setAttribute("fill", "none");
  keyBrackets.setAttribute("stroke", V.accent);
  keyBrackets.setAttribute("stroke-width", compact ? "4" : "5");
  keyBrackets.setAttribute("stroke-linecap", "square");
  keyBrackets.style.visibility = "hidden";

  function applyCopy(element, copy) {
    element.textContent = copy.text;
    element.style.fontSize = `${copy.size}px`;
    element.style.whiteSpace = copy.wrap
      ? copy.text.includes("\n") ? "pre-line" : "normal"
      : "nowrap";
    element.style.width = copy.wrap ? `${copy.width}px` : "auto";
    element.style.maxWidth = `${copy.width}px`;
  }

  function updateCallouts(time, t) {
    const finalMode = t >= finalLabelsStart;
    let active = -1;
    labelStarts.forEach((at, i) => {
      if (t > at) active = i;
    });

    labels.forEach((label, i) => {
      const start = finalMode
        ? finalLabelsStart + i * finalLabelStagger
        : labelStarts[i];
      const elapsed = t - start;
      const visible = elapsed > 0 && (finalMode || i === active);
      const textP = out(seg(elapsed, 0, finalMode ? 0.1 : 0.14), 4);
      const lineP = out(seg(elapsed, 0, finalMode ? 0.12 : 0.16), 3);
      const pulse = Math.sin(
        Math.PI * seg(elapsed, 0, finalMode ? 0.14 : 0.2)
      );

      if (label.mode !== finalMode) {
        label.mode = finalMode;
        label.el.style.left = `${finalMode ? labelX : side}px`;
        label.el.style.top =
          `${finalMode ? labelTops[i] : buildFooterY + M.activeY}px`;
        label.el.style.width = `${finalMode ? labelW : titleW}px`;
        label.el.style.height =
          `${finalMode ? M.labelH : M.buildFooterH - M.activeY}px`;
        label.num.style.width =
          `${finalMode ? label.finalNumberW : label.activeNumberW}px`;
        label.num.style.fontSize =
          `${finalMode ? M.number : M.activeNumber}px`;
        applyCopy(label.name, finalMode ? label.finalName : label.activeName);
        applyCopy(label.spec, finalMode ? label.finalSpec : label.activeSpec);
        label.spec.style.display =
          finalMode && shortStage ? "none" : "inline-block";
      }

      label.el.style.visibility = visible ? "visible" : "hidden";
      label.path.style.visibility = visible ? "visible" : "hidden";
      label.dot.style.visibility = visible ? "visible" : "hidden";

      // Text lands at its measured size; only the rim and dot overshoot.
      // The reserved right inset contains the entire entrance translation.
      const dx = (1 - textP) * (finalMode ? 12 : 18);
      label.inner.style.transform = `translateX(${dx.toFixed(3)}px)`;

      const [x, y] = toScreen(anchorFor(i));
      let length;
      if (finalMode) {
        const elbowX = labelX - 22;
        const endX = labelX - 8;
        length = Math.max(
          1, Math.hypot(elbowX - x, label.lineY - y) + endX - elbowX
        );
        label.path.setAttribute(
          "d",
          `M ${x} ${y} L ${elbowX} ${label.lineY} L ${endX} ${label.lineY}`
        );
      } else {
        const endX = Math.min(W - side, x + (compact ? 42 : 56));
        length = Math.max(1, endX - x);
        label.path.setAttribute("d", `M ${x} ${y} L ${endX} ${y}`);
      }

      label.path.style.strokeDasharray = `${length} ${length}`;
      label.path.style.strokeDashoffset = String(length * (1 - lineP));
      label.dot.setAttribute("cx", String(x));
      label.dot.setAttribute("cy", String(y));
      label.dot.setAttribute(
        "r", String((compact ? 5 : 5.5) * lineP + pulse * 3)
      );
      label.dot.setAttribute("fill", pulse > 0.08 ? V.accent : V.ink);
    });

    const burstVisible = time >= T.key && time < T.key + 0.26;
    keyBrackets.style.visibility = burstVisible ? "visible" : "hidden";
    if (burstVisible) {
      const p = out(seg(time, T.key, 0.26), 3);
      const spread = 10 + p * (compact ? 14 : 20);
      const length = (compact ? 28 : 42) * (1 - p * 0.3);
      const left = Math.max(side - 12, viewBounds.left - spread);
      const right = Math.min(labelX - 12, viewBounds.right + spread);
      const top = Math.max(modelTop - 8, viewBounds.top - spread);
      const bottom = Math.min(
        finalModelBottom + 8, viewBounds.bottom + spread
      );
      keyBrackets.setAttribute(
        "d",
        `M ${left} ${top + length} V ${top} H ${left + length} ` +
        `M ${right - length} ${top} H ${right} V ${top + length} ` +
        `M ${left} ${bottom - length} V ${bottom} H ${left + length} ` +
        `M ${right - length} ${bottom} H ${right} V ${bottom - length}`
      );
    }
  }

  const title = $("et-title");
  title.style.cssText =
    `left:${side}px;top:0;width:${titleW}px;height:${H}px`;

  const bar = $("et-title-bar");
  bar.style.cssText =
    `top:${buildFooterY}px;width:${titleW}px;height:${M.barH}px;` +
    `background:${V.accent};visibility:hidden`;

  const compactHeadlineW = titleW * 0.65;
  const compactDimensionW = titleW * 0.32;
  const titleLines = [1, 2].map((number) => {
    const line = $(`et-title-line-${number}`);
    const mask = $(`et-title-mask-${number}`);
    const size = number === 1 ? M.header : M.headline;
    const availableW = compact && number === 2
      ? compactHeadlineW : titleW;
    const y = number === 1
      ? contentTop : finalFooterY + M.headlineY;

    mask.style.cssText =
      `left:0;top:${y}px;width:${availableW}px;` +
      `height:${Math.ceil(size * 1.2)}px`;
    line.textContent = String(V[`titleLine${number}`] || "").trim();
    line.style.cssText =
      `color:${V.ink};font-size:${size}px;visibility:hidden`;
    fit(line, availableW / 1.025, minText);
    return line;
  });

  const dimensions = $("et-dimensions");
  dimensions.textContent =
    `${diameterMm} ${V.dimensionUnit} / ${heightMm} ${V.dimensionUnit}`;
  dimensions.style.cssText =
    `font-size:${M.dimension}px;color:${V.muted};visibility:hidden`;
  const dimensionMask = $("et-dimension-mask");
  dimensionMask.style.cssText = compact
    ? `right:0;top:${finalFooterY + M.dimensionY}px;` +
      `width:${compactDimensionW}px;height:${Math.ceil(M.dimension * 1.25)}px;` +
      `text-align:right`
    : `left:0;top:${finalFooterY + M.dimensionY}px;` +
      `width:${titleW}px;height:${Math.ceil(M.dimension * 1.25)}px`;
  fit(
    dimensions,
    compact ? compactDimensionW : titleW,
    minText
  );

  const riseDuration = frame(n("textRiseFrames", 6, 2, 18));
  const lineStarts = [
    Math.min(frame(n("titleLine1Frame", 0, 0, 240)), T.design - riseDuration),
    Math.min(frame(n("titleLine2Frame", 126, 0, 240)), T.design - riseDuration)
  ];
  const barStart = Math.min(
    frame(n("titleBarFrame", 0, 0, 240)), T.design - 0.15
  );
  const barDuration = frame(n("titleBarFrames", 8, 2, 30));
  const specDuration = 4 / referenceFps;
  const specStart = Math.min(
    frame(n("titleSpecFrame", 128, 0, 240)),
    T.design - specDuration
  );

  function updateTitle(time, t) {
    const dock = out(seg(t, dockStart, dockDuration), 3);
    bar.style.top = `${mix(buildFooterY, finalFooterY, dock)}px`;

    const barP = barStart <= 0 ? 1 : out(seg(t, barStart, barDuration), 4);
    const finalExtension = out(seg(t, T.design - 0.15, 0.15), 4);
    let released = 0;
    let releasePulse = 0;

    labelStarts.forEach((at) => {
      released += out(seg(t, at, 0.18), 3);
      releasePulse = Math.max(
        releasePulse, Math.sin(Math.PI * seg(t, at, 0.2))
      );
    });

    const shortFraction = M.barW / titleW;
    const progressWidth = shortFraction + released / 5 * 0.38;
    const barWidth = barP * mix(progressWidth, 1, finalExtension);
    const impact = keyImpact(time);
    const thickness = mix(1, 1.45, finalExtension) +
      releasePulse * 0.3 + impact * 0.9;

    bar.style.visibility = barP > 0 ? "visible" : "hidden";
    bar.style.transform =
      `scaleX(${barWidth.toFixed(5)}) scaleY(${thickness.toFixed(5)})`;

    titleLines.forEach((line, index) => {
      const immediateHeader = index === 0 && lineStarts[0] <= 0;
      const p = immediateHeader ? 1 : seg(t, lineStarts[index], riseDuration);
      const landed = out(p, 4);
      const scale = mix(index === 1 ? 0.9 : 0.97, 1, landed);
      const punch = index === 1 ? 1 + impact * 0.02 : 1;
      const allowed = index === 0 || t >= finalLabelsStart;

      line.style.visibility = allowed && p > 0 ? "visible" : "hidden";
      line.style.color = index === 1 &&
        time >= T.key && time < T.key + 0.14 ? V.accent : V.ink;
      line.style.transform =
        `translateY(${((1 - landed) * 18).toFixed(3)}px) ` +
        `scaleX(${(scale * punch).toFixed(5)}) ` +
        `scaleY(${(scale * punch).toFixed(5)})`;
    });

    const specP = out(seg(t, specStart, specDuration), 3);
    dimensions.style.visibility =
      t >= finalLabelsStart && specP > 0 ? "visible" : "hidden";
    dimensions.style.transform =
      `translateY(${((1 - specP) * 8).toFixed(3)}px)`;
  }

  const stage = $("stage");

  function updateWipe(time) {
    const enter = variant === "overlay" ? out(seg(time, 0, 0.22), 4) : 1;
    const exitDuration = Math.max(0.001, T.exit - 1 / outputFps);
    const leave = T.exit > 0
      ? seg(time, T.key + T.hold, exitDuration) : 0;
    const aperture = enter * (1 - Math.pow(leave, 3));

    if (aperture >= 0.999999) {
      stage.style.clipPath = "none";
    } else if (aperture <= 0.000001) {
      stage.style.clipPath = "inset(0 50% 0 50%)";
    } else {
      const half = aperture * 51;
      stage.style.clipPath =
        `polygon(${50 - half}% -1%,${50 + half}% -1%,` +
        `${50 + half}% 101%,${50 - half}% 101%)`;
    }

    return aperture > 0.000001;
  }

  function hideReadingContent() {
    labels.forEach((label) => {
      label.el.style.visibility = "hidden";
      label.path.style.visibility = "hidden";
      label.dot.style.visibility = "hidden";
    });
    titleLines.forEach((line) => {
      line.style.visibility = "hidden";
    });
    dimensions.style.visibility = "hidden";
    keyBrackets.style.visibility = "hidden";
  }

  function renderAt(time) {
    const actualTime = Math.max(0, Number(time) || 0);
    const t = designAt(actualTime);
    renderProduct(actualTime);
    updateCallouts(actualTime, t);
    updateTitle(actualTime, t);

    const open = updateWipe(actualTime);
    const entering = variant === "overlay" && actualTime < 0.22;
    const leaving = T.exit > 0 && actualTime >= T.key + T.hold;

    if (!open || entering || leaving) hideReadingContent();
    if (!open) bar.style.visibility = "hidden";
  }

  const tl = gsap.timeline({ paused: true });
  const build = gsap.timeline();
  const clock = { value: 0 };

  build.to(clock, {
    value: 1, duration: T.design, ease: "none"
  }, 0);
  build.timeScale(1 / T.scale);
  tl.add(build, 0);

  if (T.hold > 0) {
    tl.to(clock, {
      value: 2, duration: T.hold, ease: "none"
    }, T.key);
  }
  if (T.exit > 0) {
    tl.to(clock, {
      value: 3,
      duration: Math.max(0, T.exit - 1 / outputFps),
      ease: "none"
    }, T.key + T.hold);
  }

  window.__timelines["block"] = tl;
  window.addEventListener("hf-seek", (event) => renderAt(event.detail.time));
  renderAt(window.__hfThreeTime || 0);
});