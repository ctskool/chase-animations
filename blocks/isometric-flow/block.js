import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/RoundedBoxGeometry.js";

CA.ready(() => {
  const { vars: V, stage: S, safe, time: T, variant, make } = CA;
  const $ = (id) => document.getElementById(id);
  const W = S.w;
  const H = S.h;
  const K = T.design;
  const DEG = Math.PI / 180;

  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const seg = (t, at, duration) => clamp((t - at) / duration);
  const out = (p, power = 3) => 1 - Math.pow(1 - p, power);
  const inOut = (p) => p < 0.5
    ? 4 * p * p * p
    : 1 - Math.pow(-2 * p + 2, 3) / 2;
  const lerp = (a, b, p) => a + (b - a) * p;
  const kick = (t, at, decay = 10, frequency = 23) => t < at
    ? 0
    : Math.exp(-decay * (t - at)) * Math.cos(frequency * (t - at));
  const ring = (t, at, decay = 8, frequency = 25) => t < at
    ? 0
    : Math.exp(-decay * (t - at)) * Math.sin(frequency * (t - at));
  const designTime = (time) => time <= T.key
    ? time / T.scale
    : K + time - T.key;
  const P = (x, z, y = 0) => new THREE.Vector3(x, y, z);
  const color = (hex) => new THREE.Color(hex);

  // Frame the complete platform from the opening. Larger buildings retain
  // the first stop's presence without relying on a cropped camera view.
  // Physical pill dimensions are unchanged in every output.
  const layouts = {
    full: {
      titleSize: 98,
      titleMin: 54,
      titleTop: Math.max(230, safe.top) + 150,
      titleGap: 46,
      edge: 12,
      openingZoom: 1.012,
      openingLift: 44,
      cameraSettle: 0.78,
      elevation: 40,
      minElevation: 40,
      labelGap: 26,
      middleLift: 144,
      labelEdge: 24,
      labelSeparation: 20,
      payoffScale: 1.34,
      payoffRest: 1.1,
      payoffDrop: 24,
      bottomMargin: Math.max(300, safe.bottom),
      pill: {
        height: 128.56, chip: 80, gap: 18,
        padY: 14, padRight: 34, padLeft: 16,
        number: 44, name: 54, time: 40,
        timeGap: 2, stem: 5, maxText: 330, minText: 40
      }
    },
    top: {
      titleSize: 62,
      titleMin: 40,
      titleTop: Math.max(18, safe.top - 8),
      titleGap: 20,
      edge: 12,
      openingZoom: 1.012,
      openingLift: 18,
      cameraSettle: 0.74,
      elevation: 36,
      minElevation: 32,
      labelGap: 26,
      middleLift: 108,
      labelEdge: 22,
      labelSeparation: 16,
      payoffScale: 1.32,
      payoffRest: 1.1,
      payoffDrop: 28,
      bottomMargin: 20,
      pill: {
        height: 108, chip: 67.2, gap: 15.12,
        padY: 11.76, padRight: 28.56, padLeft: 13.44,
        number: 36.96, name: 45.36, time: 33.6,
        timeGap: 1.68, stem: 4.2, maxText: 277.2, minText: 32
      }
    },
    overlay: {
      titleSize: 62,
      titleMin: 40,
      titleTop: 12,
      titleGap: 24,
      edge: 16,
      openingZoom: 1.014,
      openingLift: 20,
      cameraSettle: 0.74,
      elevation: 36,
      minElevation: 32,
      labelGap: 28,
      middleLift: 108,
      labelEdge: 28,
      labelSeparation: 18,
      payoffScale: 1.34,
      payoffRest: 1.1,
      payoffDrop: 28,
      bottomMargin: 18,
      pill: {
        height: 108, chip: 67.2, gap: 15.12,
        padY: 11.76, padRight: 28.56, padLeft: 13.44,
        number: 36.96, name: 45.36, time: 33.6,
        timeGap: 1.68, stem: 4.2, maxText: 277.2, minText: 32
      }
    }
  };
  const L = layouts[variant] || layouts.full;

  const B = {
    rise: [0, 0.32, 0.76],
    riseDuration: 0.34,
    vanGo: 1.12,
    sortAt: 1.96,
    sortGo: 2.16,
    arrive: K,
    dashEnd: 1.08
  };

  const rawParcelCount = Number(V.parcelCount);
  const parcelCount = clamp(
    Number.isFinite(rawParcelCount) ? Math.round(rawParcelCount) : 3,
    1,
    5
  );
  const parcelSpacing = parcelCount > 1 ? 0.56 / (parcelCount - 1) : 0.56;
  const parcelHits = Array.from(
    { length: parcelCount },
    (_, i) => 0.3 + i * parcelSpacing
  );
  const hopDuration = Math.min(0.17, parcelSpacing * 0.72);
  const beltDuration = Math.min(0.14, parcelSpacing * 0.65);

  const renderer = new THREE.WebGLRenderer({
    canvas: $("gl"),
    alpha: true,
    antialias: true,
    preserveDrawingBuffer: true
  });
  renderer.setPixelRatio(2);
  renderer.setSize(W, H, false);
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;

  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(V.white, V.bgBottom, 2));

  const sun = new THREE.DirectionalLight(V.white, 1.2);
  sun.position.set(-6.5, 15, 7.5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.radius = 5;
  sun.shadow.blurSamples = 16;
  sun.shadow.bias = -0.0006;
  Object.assign(sun.shadow.camera, {
    left: -11, right: 11, top: 11, bottom: -11, near: 1, far: 40
  });
  scene.add(sun);

  const mat = (hex, roughness = 0.78) => new THREE.MeshStandardMaterial({
    color: color(hex),
    roughness,
    metalness: 0
  });

  const box = (w, h, d, material, radius = 0.07) => {
    const mesh = new THREE.Mesh(
      new RoundedBoxGeometry(
        w, h, d, 4,
        Math.min(radius, w / 2.2, h / 2.2, d / 2.2)
      ),
      typeof material === "string" ? mat(material) : material
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  };

  const blobTexture = (() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 128;
    const context = canvas.getContext("2d");
    const gradient = context.createRadialGradient(64, 64, 8, 64, 64, 64);
    gradient.addColorStop(0, CA.rgba(V.ink, 0.34));
    gradient.addColorStop(0.55, CA.rgba(V.ink, 0.14));
    gradient.addColorStop(1, CA.rgba(V.ink, 0));
    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(canvas);
  })();

  const blob = (w, d) => {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(w, d),
      new THREE.MeshBasicMaterial({
        map: blobTexture,
        transparent: true,
        depthWrite: false
      })
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.03;
    mesh.renderOrder = 2;
    return mesh;
  };

  const slabShape = new THREE.Shape();
  const half = 5;
  const radius = 0.75;
  slabShape.moveTo(-half + radius, -half);
  slabShape.lineTo(half - radius, -half);
  slabShape.quadraticCurveTo(half, -half, half, -half + radius);
  slabShape.lineTo(half, half - radius);
  slabShape.quadraticCurveTo(half, half, half - radius, half);
  slabShape.lineTo(-half + radius, half);
  slabShape.quadraticCurveTo(-half, half, -half, half - radius);
  slabShape.lineTo(-half, -half + radius);
  slabShape.quadraticCurveTo(-half, -half, -half + radius, -half);

  const slabGeometry = new THREE.ExtrudeGeometry(slabShape, {
    depth: 0.55,
    bevelEnabled: true,
    bevelSize: 0.09,
    bevelThickness: 0.09,
    bevelSegments: 4,
    curveSegments: 16
  });
  slabGeometry.rotateX(Math.PI / 2);

  const slab = new THREE.Mesh(slabGeometry, [
    mat(V.slab, 0.92),
    new THREE.MeshStandardMaterial({
      color: color(V.slab).multiplyScalar(0.8),
      roughness: 0.9
    })
  ]);
  slab.position.y = -0.09;
  slab.receiveShadow = true;
  scene.add(slab);

  const stops = [
    [-5, 3.4], [-0.6, 3.4], [-0.6, 0.6],
    [2.4, 0.6], [2.4, -1.6], [5, -1.6]
  ].map(([x, z]) => P(x, z, 0.02));

  const road = new THREE.CurvePath();
  let roadFrom = stops[0];
  for (let i = 1; i < stops.length; i++) {
    const corner = stops[i];
    const next = stops[i + 1];
    if (!next) {
      road.add(new THREE.LineCurve3(roadFrom, corner));
      break;
    }
    const incoming = corner.clone().add(
      roadFrom.clone().sub(corner).setLength(0.85)
    );
    const outgoing = corner.clone().add(
      next.clone().sub(corner).setLength(0.85)
    );
    road.add(new THREE.LineCurve3(roadFrom, incoming));
    road.add(new THREE.QuadraticBezierCurve3(incoming, corner, outgoing));
    roadFrom = outgoing;
  }

  const ROAD_LENGTH = road.getLength();

  function ribbon(halfWidth, start, end, y, subdivisions) {
    const positions = [];
    const indices = [];
    for (let i = 0; i <= subdivisions; i++) {
      const u = lerp(start, end, i / subdivisions);
      const point = road.getPointAt(u);
      const tangent = road.getTangentAt(u);
      const side = new THREE.Vector3(-tangent.z, 0, tangent.x)
        .normalize().multiplyScalar(halfWidth);
      positions.push(
        point.x + side.x, y, point.z + side.z,
        point.x - side.x, y, point.z - side.z
      );
      if (i < subdivisions) {
        indices.push(
          2 * i, 2 * i + 2, 2 * i + 1,
          2 * i + 1, 2 * i + 2, 2 * i + 3
        );
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3)
    );
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }

  const roadMesh = new THREE.Mesh(
    ribbon(0.46, 0, 1, 0.025, 180),
    mat(V.road, 0.9)
  );
  roadMesh.receiveShadow = true;
  scene.add(roadMesh);

  const dashes = [];
  const dashMaterial = new THREE.MeshBasicMaterial({ color: V.white });
  for (let distance = 0.14; distance < ROAD_LENGTH - 0.34; distance += 0.52) {
    const start = distance / ROAD_LENGTH;
    const end = (distance + 0.28) / ROAD_LENGTH;
    const middle = road.getPointAt((start + end) / 2);
    const geometry = ribbon(0.05, start, end, 0.047, 5);
    geometry.translate(-middle.x, 0, -middle.z);
    const mesh = new THREE.Mesh(geometry, dashMaterial);
    mesh.position.set(middle.x, 0, middle.z);
    scene.add(mesh);
    dashes.push({ mesh, u: (start + end) / 2 });
  }

  function building(hex, x, z, kind) {
    const group = new THREE.Group();
    const dimensions = [
      { w: 2.35, d: 2.05, h: 1.72 },
      { w: 1.86, d: 1.84, h: 2.72 },
      { w: 2.3, d: 1.9, h: 1.65 }
    ][kind];
    const { w, d, h } = dimensions;

    const body = box(w, h, d, hex, 0.09);
    body.position.y = h / 2;
    group.add(body);

    const roof = box(w + 0.14, 0.17, d + 0.14, V.white, 0.07);
    roof.position.y = h + 0.06;
    group.add(roof);

    const doorHeight = kind === 0 ? 0.84 : 0.66;
    const door = box(0.54, doorHeight, 0.06, V.ink, 0.03);
    door.position.set(0, doorHeight / 2, d / 2 + 0.01);
    group.add(door);

    if (kind === 0) {
      [0.18, 0.36, 0.54].forEach((y) => {
        const line = box(0.46, 0.025, 0.02, V.white, 0.01);
        line.position.set(0, y, d / 2 + 0.045);
        group.add(line);
      });
      const vent = box(0.62, 0.26, 0.62, V.white, 0.06);
      vent.position.set(-0.3, h + 0.26, -0.2);
      group.add(vent);
    }

    const rows = kind === 1 ? 3 : 1;
    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < 2; column++) {
        const windowMesh = box(0.05, 0.32, 0.35, V.ink, 0.02);
        windowMesh.position.set(
          w / 2 + 0.005,
          kind === 1 ? 0.72 + row * 0.7 : 0.94,
          (column - 0.5) * 0.74
        );
        group.add(windowMesh);
      }
    }

    if (kind === 1) {
      for (let row = 1; row < 3; row++) {
        const windowMesh = box(0.9, 0.32, 0.05, V.ink, 0.02);
        windowMesh.position.set(0, 0.72 + row * 0.7, d / 2 + 0.005);
        group.add(windowMesh);
      }
    }

    if (kind === 2) {
      const awning = box(w * 0.8, 0.09, 0.42, V.white, 0.04);
      awning.position.set(0, 0.94, d / 2 + 0.2);
      group.add(awning);
    }

    group.position.copy(P(x, z));
    const shade = blob(w * 2.05, d * 2.05);
    shade.position.x = x;
    shade.position.z = z;
    scene.add(shade, group);
    return {
      group, shade, door, x, z, w, d, h,
      totalHeight: h + (kind === 0 ? 0.42 : 0.16)
    };
  }

  const buildings = [
    building(V.color1, -3, 1.75, 0),
    building(V.color2, 0.55, -1.25, 1),
    building(V.color3, 3.4, -3.25, 2)
  ];

  // No peripheral props: the three buildings and their handoff are the scene.
  const warehouse = buildings[0];
  const beltStart = P(
    warehouse.x - 0.1,
    warehouse.z + warehouse.d / 2 + 0.035
  );
  const beltEnd = P(warehouse.x - 0.1, 3.05);
  const belt = box(
    0.46,
    0.09,
    beltStart.distanceTo(beltEnd) + 0.13,
    V.ink,
    0.03
  );
  belt.position.copy(beltStart.clone().lerp(beltEnd, 0.5));
  belt.position.y = 0.09;
  scene.add(belt);

  const van = new THREE.Group();
  const vanBody = new THREE.Group();
  const cargo = box(0.92, 0.6, 0.62, V.white, 0.09);
  cargo.position.set(-0.17, 0.46, 0);
  const cab = box(0.42, 0.46, 0.6, V.white, 0.1);
  cab.position.set(0.44, 0.39, 0);
  const windshield = box(0.05, 0.2, 0.5, V.ink, 0.02);
  windshield.position.set(0.645, 0.48, 0);
  const sideGlass = box(0.22, 0.17, 0.62, V.ink, 0.02);
  sideGlass.position.set(0.46, 0.49, 0);
  const stripe = box(0.8, 0.07, 0.635, V.chip, 0.02);
  stripe.position.set(-0.16, 0.42, 0);
  vanBody.add(cargo, cab, windshield, sideGlass, stripe);
  van.add(vanBody);

  const wheels = [];
  [[0.42, 0.34], [0.42, -0.34], [-0.38, 0.34], [-0.38, -0.34]]
    .forEach(([x, z]) => {
      const axle = new THREE.Group();
      axle.position.set(x, 0.135, z);
      const tire = new THREE.Mesh(
        new THREE.CylinderGeometry(0.135, 0.135, 0.11, 18),
        mat(V.ink)
      );
      tire.rotation.x = Math.PI / 2;
      tire.castShadow = true;
      axle.add(tire);
      const hub = box(0.11, 0.035, 0.12, V.white, 0.012);
      hub.position.z = z > 0 ? 0.012 : -0.012;
      axle.add(hub);
      van.add(axle);
      wheels.push(axle);
    });

  van.scale.setScalar(1.22);
  const vanShade = blob(2.1, 1.5);
  scene.add(vanShade, van);

  function nearestOnRoad(point) {
    let best = 0;
    let bestDistance = Infinity;
    for (let i = 0; i <= 800; i++) {
      const u = i / 800;
      const distance = road.getPointAt(u).distanceToSquared(point);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = u;
      }
    }
    return best;
  }

  const fromU = nearestOnRoad(P(-2.6, 3.4));
  const sortU = nearestOnRoad(P(0.55, 0.6));
  const toU = nearestOnRoad(P(4.1, -1.6));

  function vanU(t) {
    if (t <= B.vanGo) return fromU;
    if (t < B.sortAt) {
      return lerp(
        fromU, sortU,
        inOut(seg(t, B.vanGo, B.sortAt - B.vanGo))
      );
    }
    if (t <= B.sortGo) return sortU;
    return lerp(
      sortU, toU,
      inOut(seg(t, B.sortGo, B.arrive - B.sortGo))
    );
  }

  const parcels = parcelHits.map(() => {
    const group = new THREE.Group();
    const parcel = box(0.31, 0.27, 0.31, V.color1, 0.045);
    const tape = box(0.055, 0.012, 0.32, V.white, 0.005);
    tape.position.y = 0.14;
    group.add(parcel, tape);
    group.visible = false;
    scene.add(group);
    return group;
  });

  const destination = buildings[2];
  const destinationPad = box(
    destination.w + 0.28,
    0.12,
    destination.d + 0.29,
    V.check,
    0.07
  );
  destinationPad.position.set(destination.x, 0.055, destination.z);
  destinationPad.visible = false;
  scene.add(destinationPad);

  const bay = new THREE.Mesh(
    ribbon(
      0.39,
      Math.max(fromU, toU - 0.04),
      Math.min(1, toU + 0.045),
      0.034,
      18
    ),
    new THREE.MeshBasicMaterial({ color: V.check })
  );
  bay.visible = false;
  scene.add(bay);

  const reversePulse = [];
  const pulseCount = 60;
  const pulseMaterial = new THREE.MeshBasicMaterial({ color: V.check });
  for (let i = 0; i < pulseCount; i++) {
    const start = lerp(fromU, toU, i / pulseCount);
    const end = lerp(fromU, toU, (i + 1) / pulseCount);
    const mesh = new THREE.Mesh(ribbon(0.405, start, end, 0.036, 4), pulseMaterial);
    mesh.visible = false;
    scene.add(mesh);
    reversePulse.push({
      mesh,
      delay: ((pulseCount - 1 - i) / (pulseCount - 1)) * 0.52
    });
  }

  // Measure the rounded silhouette itself. An axis-aligned bounding box
  // includes missing corners and unnecessarily shrinks the final diagram.
  scene.updateMatrixWorld(true);
  const slabVertices = slabGeometry.getAttribute("position");
  const slabPoints = [];
  for (let i = 0; i < slabVertices.count; i++) {
    slabPoints.push(
      new THREE.Vector3()
        .fromBufferAttribute(slabVertices, i)
        .applyMatrix4(slab.matrixWorld)
    );
  }

  function slabProjection(azimuth, elevation) {
    const sinA = Math.sin(azimuth);
    const cosA = Math.cos(azimuth);
    const sinE = Math.sin(elevation);
    const cosE = Math.cos(elevation);
    let minX = Infinity;
    let maxX = -Infinity;
    let minUp = Infinity;

    slabPoints.forEach((point) => {
      const x = point.x * cosA - point.z * sinA;
      const up = point.y * cosE
        - (point.x * sinA + point.z * cosA) * sinE;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minUp = Math.min(minUp, up);
    });

    return { minX, maxX, minUp };
  }

  const FINAL_AZIMUTH = 42 * DEG;
  let elevation = L.elevation * DEG;
  const initialProjection = slabProjection(FINAL_AZIMUTH, elevation);
  let ppu = (W - L.edge * 2)
    / (initialProjection.maxX - initialProjection.minX);
  let finalCenterY = 0;
  let openingCenterY = 0;

  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 80);

  function aim(t) {
    // The slight initial drift is already underway on frame one.
    // All camera motion ends before the van starts its first journey.
    const progress = inOut(seg(t, -0.06, L.cameraSettle + 0.06));
    const azimuth = lerp(48, 42, progress) * DEG;
    const centerY = lerp(openingCenterY, finalCenterY, progress);
    const pixelsPerUnit = ppu * lerp(L.openingZoom, 1, progress);

    // Apply the scale directly to the frustum so centerY remains an exact
    // screen-space anchor throughout the small opening pull-back.
    camera.zoom = 1;
    camera.left = -W / (2 * pixelsPerUnit);
    camera.right = W / (2 * pixelsPerUnit);
    camera.top = centerY / pixelsPerUnit;
    camera.bottom = -(H - centerY) / pixelsPerUnit;
    camera.position.set(
      Math.sin(azimuth) * Math.cos(elevation) * 30,
      Math.sin(elevation) * 30,
      Math.cos(azimuth) * Math.cos(elevation) * 30
    );
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
  }

  function toScreen(point) {
    const projected = point.clone().project(camera);
    return [
      (projected.x + 1) * W / 2,
      (1 - projected.y) * H / 2
    ];
  }

  const stageElement = $("stage");
  stageElement.style.setProperty("--flow-paper", V.white);
  stageElement.style.setProperty("--flow-muted", V.muted);
  stageElement.style.setProperty("--flow-shadow", CA.rgba(V.ink, 0.14));

  $("bg").style.background = `linear-gradient(180deg, ${V.bgTop}, ${V.bgBottom})`;
  $("grain").style.backgroundImage = CA.grainUrl(200, 1, 5);

  const title = $("title");
  const titleMask = $("title-mask");
  title.textContent = V.title;
  title.style.color = V.ink;
  title.style.fontSize = `${L.titleSize}px`;
  titleMask.style.top = `${L.titleTop}px`;
  const titleWidth = variant === "overlay"
    ? Math.min(W - safe.side * 2, W * 0.8 - 28)
    : W - Math.max(40, safe.side) * 2;
  CA.fit(title, titleWidth, L.titleMin);

  const labelRoot = $("labels");
  const pillProperties = {
    height: L.pill.height,
    chip: L.pill.chip,
    gap: L.pill.gap,
    "pad-y": L.pill.padY,
    "pad-right": L.pill.padRight,
    "pad-left": L.pill.padLeft,
    number: L.pill.number,
    name: L.pill.name,
    time: L.pill.time,
    "time-gap": L.pill.timeGap,
    stem: L.pill.stem
  };
  Object.entries(pillProperties).forEach(([name, value]) => {
    labelRoot.style.setProperty(`--pill-${name}`, `${value}px`);
  });

  const pills = [1, 2, 3].map((n) => {
    const stem = make("div", "stem", labelRoot);
    const element = make("div", "pill", labelRoot);
    const chip = make("div", "pill-chip", element);
    chip.style.background = V.chip;
    const numberValue = Number(V[`step${n}Number`]);
    const number = make(
      "span", "pill-number", chip,
      String(Number.isFinite(numberValue) ? Math.round(numberValue) : n)
    );
    const text = make("div", "pill-text", element);
    const name = make("div", "pill-name", text, V[`step${n}Name`]);
    name.style.color = V.ink;
    const time = make("div", "pill-time", text, V[`step${n}Time`]);
    CA.fit(name, L.pill.maxText, L.pill.minText);
    CA.fit(time, L.pill.maxText, L.pill.time);
    return {
      element, chip, number, stem,
      w: element.offsetWidth,
      h: element.offsetHeight
    };
  });

  const finalCheck = make("span", "pill-check", pills[2].chip);
  finalCheck.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4.6 4.6L19 7.4"/></svg>`;

  function pillPositions() {
    const reserveScales = [1.08, 1.17, L.payoffScale];
    const reserveDrops = [0, 10, L.payoffDrop];
    const positions = pills.map((pill, i) => {
      const building = buildings[i];
      const roof = toScreen(P(building.x, building.z, building.h + 0.2));
      const scale = reserveScales[i];
      const halfWidth = pill.w * scale / 2;
      const centerX = clamp(
        roof[0],
        L.labelEdge + halfWidth,
        W - L.labelEdge - halfWidth
      );
      const top = roof[1] - L.labelGap - pill.h
        - (i === 1 ? L.middleLift : 0);
      return { centerX, top, roof, scale };
    });

    const bounds = (i) => {
      const position = positions[i];
      const pill = pills[i];
      return {
        left: position.centerX - pill.w * position.scale / 2,
        right: position.centerX + pill.w * position.scale / 2,
        top: position.top + pill.h
          - pill.h * position.scale - reserveDrops[i],
        bottom: position.top + pill.h + 8
      };
    };
    const overlaps = (a, b) => {
      const gap = L.labelSeparation;
      return a.left < b.right + gap && a.right + gap > b.left
        && a.top < b.bottom + gap && a.bottom + gap > b.top;
    };

    if (overlaps(bounds(0), bounds(2))) {
      positions[0].centerX =
        L.labelEdge + pills[0].w * positions[0].scale / 2;
      positions[2].centerX =
        W - L.labelEdge - pills[2].w * positions[2].scale / 2;
      if (overlaps(bounds(0), bounds(2))) {
        positions[2].top -=
          bounds(2).bottom - bounds(0).top + L.labelSeparation;
      }
    }

    for (const other of [0, 2]) {
      if (overlaps(bounds(1), bounds(other))) {
        positions[1].top -=
          bounds(1).bottom - bounds(other).top + L.labelSeparation;
      }
    }

    return positions.map((position, i) => ({
      ...position,
      bounds: bounds(i)
    }));
  }

  const contentTop = L.titleTop + title.offsetHeight + L.titleGap;
  const contentBottom = H - L.bottomMargin;

  function anchorFrame() {
    const projection = slabProjection(FINAL_AZIMUTH, elevation);

    // The slab meets the lower safe edge. Do not re-center it upward and
    // reintroduce an empty band below the final diagram.
    finalCenterY = contentBottom + ppu * projection.minUp;
    openingCenterY = finalCenterY - L.openingLift;
    aim(K);
  }

  // Compact outputs first use their own viewing angle to keep the platform
  // wide and the pills unchanged. Only unusually short stages or long copy
  // require reducing the physical scene after that room has been used.
  for (let pass = 0; pass < 32; pass++) {
    anchorFrame();
    const positions = pillPositions();
    const top = Math.min(...positions.map((position) => position.bounds.top));
    if (top >= contentTop - 0.5) break;

    const minimumElevation = L.minElevation * DEG;
    if (elevation > minimumElevation + 0.000001) {
      elevation = Math.max(minimumElevation, elevation - DEG);
      continue;
    }

    const availableHeight = Math.max(1, contentBottom - contentTop);
    const occupiedHeight = Math.max(1, contentBottom - top);
    ppu *= clamp((availableHeight / occupiedHeight) * 0.995, 0.82, 0.985);
  }
  anchorFrame();

  const whiteColor = color(V.white);
  const inkColor = color(V.ink);
  const checkColor = color(V.check);
  const basePillShadow = `0 8px 18px ${CA.rgba(V.ink, 0.14)}`;

  function renderAt(time) {
    const t = designTime(time);
    const complete = time >= T.key;
    const arrivalAge = time - T.key;
    aim(t);

    buildings.forEach((building, i) => {
      let y = 0;
      let sx = 1;
      let sy = 1;
      let contact = 1;
      building.group.visible = i === 0 || t >= B.rise[i];

      if (i === 0) {
        const opening = kick(t, 0, 11, 22);
        y = 0.09 * Math.max(0, opening);
        sx += 0.055 * opening;
        sy += 0.04 * opening;
        parcelHits.forEach((at) => {
          const reaction = kick(t, at, 15, 28);
          sy += 0.018 * reaction;
          sx -= 0.01 * reaction;
        });
      } else {
        // Separate rise, crest and landing poses. The next entrance begins
        // after this building has landed, so the reveals read individually.
        const p = seg(t, B.rise[i], B.riseDuration);
        contact = seg(t, B.rise[i] + 0.08, 0.16);
        if (p < 0.52) {
          y = -building.totalHeight
            + (building.totalHeight + 0.2) * out(p / 0.52, 4);
        } else if (p < 0.76) {
          y = 0.2 * (1 - Math.pow((p - 0.52) / 0.24, 2));
        } else {
          sy = 1 - 0.09 * Math.sin(((p - 0.76) / 0.24) * Math.PI);
          sx = 1 + (1 - sy) * 0.7;
        }
      }

      if (i === 1) {
        const reaction = kick(t, B.sortAt, 11, 24);
        y += 0.16 * Math.max(0, reaction);
        sx *= 1 + 0.065 * reaction;
        sy *= 1 + 0.085 * reaction;
        building.door.material.color.copy(
          t >= B.sortAt && t < B.sortAt + 0.075 ? whiteColor : inkColor
        );
      }

      if (i === 2) {
        if (!complete) {
          const anticipation = seg(t, K - 0.12, 0.12);
          sx *= 1 + 0.045 * anticipation;
          sy *= 1 - 0.1 * anticipation;
        } else {
          const impact = kick(arrivalAge, 0, 9, 20);
          y = 0.115 + 0.4 * Math.max(0, impact);
          sx = 1.035 + 0.12 * impact;
          sy = 1 + 0.12 * impact;
        }
        building.door.material.color.copy(complete ? checkColor : inkColor);
      }

      building.group.position.y = y;
      building.group.scale.set(sx, sy, sx);
      building.shade.material.opacity = contact;
    });

    destinationPad.visible = complete;
    bay.visible = complete;
    const padPunch = 0.05 * Math.max(0, kick(arrivalAge, 0, 10, 24));
    destinationPad.scale.set(1 + padPunch, 1, 1 + padPunch);

    const drawn = out(seg(t, 0, B.dashEnd), 2);
    dashes.forEach((dash, i) => {
      dash.mesh.visible = i / dashes.length < drawn;
      let size = 1;
      if (complete && dash.u >= fromU && dash.u <= toU) {
        const delay = ((toU - dash.u) / (toU - fromU)) * 0.52;
        const age = arrivalAge - delay;
        if (age >= 0 && age <= 0.14) {
          size = 1 + 0.5 * Math.sin((age / 0.14) * Math.PI);
        }
      }
      dash.mesh.scale.set(size, 1, size);
    });

    reversePulse.forEach(({ mesh, delay }) => {
      const age = arrivalAge - delay;
      mesh.visible = complete && age >= 0 && age < 0.13;
    });

    const u = vanU(t);
    const point = road.getPointAt(u);
    const tangent = road.getTangentAt(u);
    van.position.set(point.x, 0.03, point.z);
    van.rotation.y = Math.atan2(-tangent.z, tangent.x);
    vanShade.position.x = point.x;
    vanShade.position.z = point.z;

    const sampleStep = 0.035;
    const acceleration = vanU(t + sampleStep)
      - 2 * vanU(t) + vanU(t - sampleStep);
    let loadingDip = 0;
    parcelHits.forEach((at) => {
      loadingDip += kick(t, at, 12, 28) * 0.045;
    });
    const sortBrake = kick(t, B.sortAt, 12, 25);
    const deliveryBrake = complete ? kick(arrivalAge, 0, 10, 24) : 0;
    const idleEnvelope = complete ? 1 - Math.exp(-arrivalAge * 7) : 0;
    const idle = complete
      ? Math.sin(arrivalAge * 4.2) * 0.024 * idleEnvelope
      : 0;
    const idleRock = complete
      ? Math.sin(arrivalAge * 3.2) * 0.006 * idleEnvelope
      : 0;

    // The parked van keeps a quiet engine idle through the hold.
    // Readable text, the camera and the route stay fixed.
    vanBody.position.y =
      idle - loadingDip - 0.035 * sortBrake - 0.085 * deliveryBrake;
    vanBody.rotation.z = -acceleration * 24
      - 0.075 * sortBrake
      - 0.17 * deliveryBrake
      + (complete ? ring(arrivalAge, 0.08, 10, 27) * 0.035 : 0)
      + idleRock;
    wheels.forEach((wheel) => {
      wheel.rotation.z = -((u - fromU) * ROAD_LENGTH) / (0.135 * 1.22);
    });

    const loadingTarget = road.getPointAt(fromU).clone()
      .add(new THREE.Vector3(-0.49, 0.64, 0));
    parcels.forEach((parcel, i) => {
      const hitAt = parcelHits[i];
      const hopAt = hitAt - hopDuration;
      const startAt = hopAt - beltDuration;
      parcel.visible = t >= startAt && t < hitAt;
      parcel.scale.setScalar(1);
      parcel.rotation.set(0, 0, 0);
      if (!parcel.visible) return;

      if (t < hopAt) {
        parcel.position.copy(
          beltStart.clone().lerp(beltEnd, out(seg(t, startAt, beltDuration), 2))
        );
        parcel.position.y = 0.27;
      } else {
        const p = seg(t, hopAt, hopDuration);
        parcel.position.copy(
          beltEnd.clone().setY(0.27).lerp(loadingTarget, p)
        );
        parcel.position.y += Math.sin(p * Math.PI) * 0.52;
        parcel.scale.setScalar(1 - 0.36 * p * p);
        parcel.rotation.z = -Math.sin(p * Math.PI) * 0.15;
      }
    });

    const positions = pillPositions();
    pills.forEach((pill, i) => {
      const shown = i === 0 || (i === 1 ? t >= B.sortAt : complete);
      const position = positions[i];
      let scale = 1;
      let drop = 0;

      if (i === 0) {
        scale += 0.07 * kick(t, 0, 12, 23);
      } else if (i === 1 && shown) {
        const impact = kick(t, B.sortAt, 12, 24);
        scale += 0.16 * impact;
        drop = -10 * impact;
      } else if (i === 2 && shown) {
        const impact = kick(arrivalAge, 0, 11, 23);
        scale = L.payoffRest + (L.payoffScale - L.payoffRest) * impact;
        drop = -L.payoffDrop * impact;
      }

      const left = position.centerX - pill.w / 2;
      const top = position.top + drop;
      pill.element.style.visibility = shown ? "visible" : "hidden";
      pill.element.style.transform =
        `translate(${left.toFixed(3)}px, ${top.toFixed(3)}px) scale(${scale.toFixed(5)})`;
      pill.element.style.boxShadow = i === 2 && complete
        ? `${basePillShadow}, inset 0 -6px 0 ${V.check}`
        : basePillShadow;

      pill.number.style.visibility = shown && !(i === 2 && complete)
        ? "visible"
        : "hidden";
      pill.chip.style.background = i === 2 && complete ? V.check : V.chip;
      pill.chip.style.transform = i === 2 && complete
        ? `scale(${(1 + 0.18 * kick(arrivalAge, 0, 12, 26)).toFixed(5)})`
        : "scale(1)";

      const startX = position.centerX;
      const startY = top + pill.h - 3;
      const dx = position.roof[0] - startX;
      const dy = position.roof[1] - startY;
      const length = Math.hypot(dx, dy);
      pill.stem.style.visibility = shown && dy > 4 ? "visible" : "hidden";
      pill.stem.style.height = `${length.toFixed(3)}px`;
      pill.stem.style.transform =
        `translate(${(startX - L.pill.stem / 2).toFixed(3)}px, ${startY.toFixed(3)}px) rotate(${(-Math.atan2(dx, dy)).toFixed(6)}rad)`;
    });

    finalCheck.style.visibility = complete ? "visible" : "hidden";

    if (T.exit > 0 || variant === "overlay") {
      // Keep the broad opening wipe outside the complete platform and words.
      // The previous narrow opening re-cropped the overlay's route.
      const entry = variant === "overlay"
        ? 1 - (8 / W) * (1 - out(seg(time, 0, 0.16), 3))
        : 1;
      const exitDuration = Math.max(0.001, T.exit - 1 / CA.fps);
      const exit = T.exit > 0
        ? seg(time, T.key + T.hold, exitDuration)
        : 0;
      const openness = entry * (1 - inOut(exit));
      const inset = (1 - openness) * 50;
      stageElement.style.clipPath = openness >= 0.999999
        ? "none"
        : `inset(0 ${inset.toFixed(6)}% 0 ${inset.toFixed(6)}%)`;
    } else {
      stageElement.style.clipPath = "none";
    }

    renderer.render(scene, camera);
  }

  window.addEventListener("hf-seek", (event) => renderAt(event.detail.time));
  renderAt(window.__hfThreeTime || 0);
  window.__timelines["block"] = gsap.timeline({ paused: true });
});