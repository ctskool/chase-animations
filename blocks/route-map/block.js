import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/RoundedBoxGeometry.js";

CA.ready(() => {
  const {
    vars: V, stage: S, safe, time: T, variant,
    make, fit, rgba, seeded, parseStat, formatStat,
  } = CA;

  const $ = (id) => document.getElementById(id);
  const W = S.w;
  const H = S.h;
  const compact = variant !== "full";
  const shallow = compact && H < 720;
  const K = T.design;
  const stageEl = $("stage");
  const EPS = 0.000001;
  const realMap = V.mapData && typeof V.mapData === "object"
    ? V.mapData
    : null;

  const clamp = (v, lo = 0, hi = 1) =>
    Math.min(hi, Math.max(lo, v));
  const lerp = (a, b, p) => a + (b - a) * p;
  const seg = (t, at, duration) =>
    duration <= 0 ? (t >= at ? 1 : 0) : clamp((t - at) / duration);
  const out = (p, power = 3) => 1 - Math.pow(1 - p, power);
  const smooth = (p) => p * p * p * (p * (p * 6 - 15) + 10);
  const back = (p, strength = 1.7) =>
    1 + (strength + 1) * Math.pow(p - 1, 3) +
    strength * Math.pow(p - 1, 2);
  const mixed = (a, b, amount) =>
    new THREE.Color(a).lerp(new THREE.Color(b), clamp(amount));
  const designTime = (time) =>
    time >= T.key - EPS
      ? K + Math.max(0, time - T.key)
      : time / T.scale;

  const layouts = {
    full: {
      cardH: 440, pad: 32, time: 210, detail: 52, fastest: 46,
      badgePadX: 18, badgePadY: 10,
      buttonW: 180, buttonH: 116, buttonText: 48, arrow: 36,
      dot: 104, dotRim: 9, route: 32, casing: 46, head: 64,
      pinW: 132, pinH: 180, drop: 250,
      place: 54, placeMax: 450, destination: 64, destinationMax: 490,
      labelPadX: 22, labelPadY: 12, mapGap: 86, fov: 43,
    },
    top: {
      cardH: 352, pad: 26, time: 156, detail: 42, fastest: 38,
      badgePadX: 14, badgePadY: 8,
      buttonW: 160, buttonH: 104, buttonText: 42, arrow: 32,
      dot: 84, dotRim: 8, route: 28, casing: 40, head: 54,
      pinW: 112, pinH: 150, drop: 190,
      place: 46, placeMax: 400, destination: 54, destinationMax: 420,
      labelPadX: 18, labelPadY: 10, mapGap: 72, fov: 45,
    },
    overlay: {
      cardH: 370, pad: 28, time: 168, detail: 44, fastest: 40,
      badgePadX: 14, badgePadY: 8,
      buttonW: 168, buttonH: 108, buttonText: 44, arrow: 34,
      dot: 88, dotRim: 8, route: 30, casing: 42, head: 56,
      pinW: 116, pinH: 156, drop: 200,
      place: 46, placeMax: 400, destination: 54, destinationMax: 430,
      labelPadX: 18, labelPadY: 10, mapGap: 74, fov: 45,
    },
  };

  const M = { ...(layouts[variant] || layouts.full) };

  if (compact && H < 850) {
    Object.assign(M, {
      cardH: 300, pad: 22, time: 120, detail: 38, fastest: 36,
      badgePadX: 12, badgePadY: 6,
      buttonW: 140, buttonH: 88, buttonText: 36, arrow: 28,
      dot: 70, dotRim: 7, route: 24, casing: 34, head: 48,
      pinW: 92, pinH: 124, drop: 160,
      place: 38, placeMax: 360, destination: 46, destinationMax: 380,
      mapGap: 62,
    });
  }

  if (shallow) {
    Object.assign(M, {
      cardH: 224, pad: 20, time: 112, detail: 36, fastest: 34,
      badgePadX: 12, badgePadY: 6,
      buttonW: 140, buttonH: 80, buttonText: 34, arrow: 28,
      dot: 64, dotRim: 6, route: 22, casing: 32, head: 44,
      pinW: 78, pinH: 104, drop: 140,
      place: 34, placeMax: 330, destination: 40, destinationMax: 360,
      labelPadX: 14, labelPadY: 8, mapGap: 54,
    });
  }

  const side = Math.max(safe.side, compact ? 44 : 60);
  const top = Math.max(safe.top, compact ? 24 : 230);
  const bottom = Math.max(safe.bottom, compact ? 28 : 300);
  const cardW = W - side * 2;
  const cardY = H - bottom - M.cardH;
  const minText = compact ? 32 : 40;
  const timeHeight = Math.ceil(M.time * 1.045);

  const availableMapHeight = Math.max(
    24,
    cardY - M.mapGap - top - M.pinH - 28,
  );
  const stretchZ = realMap
    ? 1
    : compact
    ? shallow
      ? clamp(availableMapHeight / 400, 0.08, 0.65)
      : clamp((H - M.cardH - top - bottom - 140) / 430, 0.28, 1)
    : 1;

  const P = (x, z, y = 0) => new THREE.Vector3(x, y, z * stretchZ);

  // Turns the map's metres into the block's world, sized and turned so the
  // route fills the same shape of frame the fictional route does.
  const realFrame = realMap ? (() => {
    const flat = realMap.route;
    const count = flat.length / 2;
    let meanX = 0;
    let meanY = 0;
    for (let i = 0; i < flat.length; i += 2) {
      meanX += flat[i] / count;
      meanY += flat[i + 1] / count;
    }

    let xx = 0;
    let yy = 0;
    let xy = 0;
    for (let i = 0; i < flat.length; i += 2) {
      const dx = flat[i] - meanX;
      const dy = flat[i + 1] - meanY;
      xx += dx * dx;
      yy += dy * dy;
      xy += dx * dy;
    }

    let axis = Math.atan2(2 * xy, xx - yy) / 2;
    const travelX = flat[flat.length - 2] - flat[0];
    const travelY = flat[flat.length - 1] - flat[1];
    if (Math.cos(axis) * travelX + Math.sin(axis) * travelY < 0) {
      axis += Math.PI;
    }

    const wanted = compact ? Math.atan2(12, 20) : Math.atan2(24, 16);
    const turn = V.mapOrientation === "north" ? 0 : wanted - axis;
    const cos = Math.cos(turn);
    const sin = Math.sin(turn);
    const spin = (x, y) => [x * cos - y * sin, x * sin + y * cos];

    let left = Infinity;
    let right = -Infinity;
    let low = Infinity;
    let high = -Infinity;
    for (let i = 0; i < flat.length; i += 2) {
      const [x, y] = spin(flat[i], flat[i + 1]);
      left = Math.min(left, x);
      right = Math.max(right, x);
      low = Math.min(low, y);
      high = Math.max(high, y);
    }

    const scale = 24 / Math.max(right - left, high - low, 1);
    const middleX = (left + right) / 2;
    const middleY = (low + high) / 2;

    return {
      scale,
      point(x, y) {
        const [rx, ry] = spin(x, y);
        return [(rx - middleX) * scale, -(ry - middleY) * scale];
      },
    };
  })() : null;

  let finalMinutes = Number(V.finalMinutes);
  if (!Number.isFinite(finalMinutes)) finalMinutes = 8;

  let countdown = String(V.countdown)
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map(Number)
    .filter(Number.isFinite)
    .slice(0, 12);

  countdown = countdown.filter((value, index, list) =>
    index === 0 || value !== list[index - 1]
  );

  if (!countdown.length) countdown = [finalMinutes];
  if (countdown[countdown.length - 1] !== finalMinutes) {
    countdown.push(finalMinutes);
  }

  const timeStat = parseStat(V.tripTime);
  const interimTime = (value) => timeStat
    ? formatStat(timeStat, value)
    : String(value);

  const B = {
    routeAt: 0.02,
    routeEnd: K,
    pinAt: K - 0.34,
    pinHit: K,
    destinationAt: K - 0.28,
    cardAt: K * 0.4,
    cardDuration: 0.26,
  };

  const renderer = new THREE.WebGLRenderer({
    canvas: $("map-gl"),
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true,
  });
  renderer.setPixelRatio(2);
  renderer.setSize(W, H, false);
  renderer.setClearColor(V.haze, 1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.01;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(V.haze, 65, 165);
  scene.add(new THREE.HemisphereLight(V.surface, V.land, 1.65));

  const sun = new THREE.DirectionalLight(V.surface, 2);
  sun.position.set(-24, 46, 28);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.00025;
  sun.shadow.normalBias = 0.035;
  sun.shadow.radius = 4;
  Object.assign(sun.shadow.camera, {
    left: -43, right: 43, top: 43, bottom: -43, near: 1, far: 125,
  });
  scene.add(sun);

  const matte = (color) => new THREE.MeshStandardMaterial({
    color,
    roughness: 1,
    metalness: 0,
  });

  const materials = {
    land: matte(V.land),
    streets: matte(V.streets),
    building: matte(V.building),
    tall: matte(V.buildingTall),
    roof: matte(mixed(V.building, V.surface, 0.38)),
    park: matte(V.park),
    square: matte(mixed(V.land, V.streets, 0.65)),
    tree: matte(V.tree),
    trunk: matte(mixed(V.tree, V.ink, 0.38)),
    water: matte(V.water),
    bank: matte(mixed(V.land, V.streets, 0.28)),
    mainRoad: matte(V.mainRoad),
    bridgeEdge: matte(mixed(V.buildingTall, V.land, 0.45)),
  };

  const unitBox = new RoundedBoxGeometry(1, 1, 1, 2, 0.045);
  const unitPlane = new THREE.PlaneGeometry(1, 1);
  const treeGeo = new THREE.SphereGeometry(0.38, 14, 12);
  const trunkGeo = new THREE.CylinderGeometry(0.045, 0.055, 0.34, 8);

  function box(w, h, d, material, x, z, y = h / 2) {
    const mesh = new THREE.Mesh(unitBox, material);
    mesh.scale.set(w, h, d * stretchZ);
    mesh.position.copy(P(x, z, y));
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
  }

  function plane(w, d, material, x, z, y) {
    const mesh = new THREE.Mesh(unitPlane, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.scale.set(w, d * stretchZ, 1);
    mesh.position.copy(P(x, z, y));
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
  }

  plane(
    realMap ? 900 : 180, realMap ? 900 : 180,
    materials.land, 0, 0, -0.08,
  );

  const currents = [];

  const riverCenter = (x) =>
    -0.8 + x * 0.08 + Math.sin(x * 0.22) * 0.18;

  const parkSpecs = compact
    ? [
        { x: -8, z: -4, square: false },
        { x: 0, z: 4, square: true },
        { x: 12, z: -4, square: false },
      ]
    : [
        { x: -8, z: -4, square: false },
        { x: 0, z: -8, square: true },
        { x: 8, z: 4, square: false },
      ];

  function buildCity() {
    for (let i = -12; i <= 12; i++) {
      const coordinate = -2 + i * 4;
      plane(1.08, 140, materials.streets, coordinate, 0, 0.002);
      plane(140, 1.08, materials.streets, 0, coordinate, 0.003);
    }

    plane(140, 1.36, materials.mainRoad, 0, 6, 0.012);

    function riverGeometry(halfWidth, y) {
      const positions = [];
      const indices = [];
      const count = 160;

      for (let i = 0; i <= count; i++) {
        const x = -80 + i;
        const z = riverCenter(x);
        positions.push(
          x, y, (z - halfWidth) * stretchZ,
          x, y, (z + halfWidth) * stretchZ,
        );
        if (i < count) {
          const a = i * 2;
          indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
        }
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(positions, 3),
      );
      geometry.setIndex(indices);
      geometry.computeVertexNormals();
      return geometry;
    }

    const banks = new THREE.Mesh(riverGeometry(1.13, 0.018), materials.bank);
    banks.receiveShadow = true;
    scene.add(banks);

    const river = new THREE.Mesh(riverGeometry(0.91, 0.028), materials.water);
    river.receiveShadow = true;
    scene.add(river);

    for (let i = -8; i <= 8; i++) {
      const x = -2 + i * 4;
      const z = riverCenter(x);
      box(1.22, 0.08, 3.3, materials.streets, x, z, 0.065);
      box(0.07, 0.12, 3.3, materials.bridgeEdge, x - 0.61, z, 0.12);
      box(0.07, 0.12, 3.3, materials.bridgeEdge, x + 0.61, z, 0.12);
    }

    const currentMaterial = new THREE.MeshBasicMaterial({
      color: mixed(V.water, V.surface, 0.32),
      depthWrite: false,
    });

    for (let i = 0; i < 19; i++) {
      const mesh = plane(
        0.72, 0.027, currentMaterial, -38 + i * 4, 0, 0.041,
      );
      currents.push({
        mesh,
        base: -38 + i * 4,
        lane: i % 2 ? -0.35 : 0.35,
      });
    }

    const contactTexture = (() => {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 96;
      const context = canvas.getContext("2d");
      const gradient = context.createRadialGradient(48, 48, 12, 48, 48, 48);
      gradient.addColorStop(0, rgba(V.ink, 0.18));
      gradient.addColorStop(0.58, rgba(V.ink, 0.075));
      gradient.addColorStop(1, rgba(V.ink, 0));
      context.fillStyle = gradient;
      context.fillRect(0, 0, 96, 96);

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      return texture;
    })();

    const contactMaterial = new THREE.MeshBasicMaterial({
      map: contactTexture,
      transparent: true,
      depthWrite: false,
      color: V.surface,
    });

    const random = seeded(117);

    for (let x = -36; x <= 36; x += 4) {
      for (let z = -40; z <= 32; z += 4) {
        if (Math.abs(z - riverCenter(x)) < 2.8) continue;
        if (parkSpecs.some((p) =>
          Math.abs(p.x - x) < 1.9 && Math.abs(p.z - z) < 1.9
        )) continue;
        if (random() > 0.91) continue;

        const floors = 1 + Math.floor(random() * 3);
        const h = 0.32 + floors * 0.31;
        const w = 2.25 + random() * 0.48;
        const d = 2.2 + random() * 0.52;
        const bx = x + (random() - 0.5) * 0.18;
        const bz = z + (random() - 0.5) * 0.18;

        plane(w * 1.38, d * 1.38, contactMaterial, bx, bz, 0.007);
        box(
          w, h, d,
          floors === 3 ? materials.tall : materials.building,
          bx, bz,
        );
        box(
          w * 0.94, 0.045, d * 0.94,
          materials.roof, bx, bz, h + 0.012,
        );

        if (random() > 0.65) {
          box(
            w * 0.34, 0.11, d * 0.3, materials.tall,
            bx - w * 0.15, bz + d * 0.12, h + 0.09,
          );
        }
      }
    }

    function tree(x, z, size) {
      const trunk = new THREE.Mesh(trunkGeo, materials.trunk);
      trunk.position.copy(P(x, z, 0.18 * size));
      trunk.scale.setScalar(size);
      trunk.castShadow = true;
      scene.add(trunk);

      const crown = new THREE.Mesh(treeGeo, materials.tree);
      crown.position.copy(P(x, z, 0.57 * size));
      crown.scale.set(size, size * 1.08, size);
      crown.castShadow = true;
      crown.receiveShadow = true;
      scene.add(crown);
    }

    parkSpecs.forEach((park) => {
      const ground = box(
        3.02, 0.045, 3.02,
        park.square ? materials.square : materials.park,
        park.x, park.z, 0.015,
      );
      ground.castShadow = false;

      [
        [-1.02, -1.02], [1.02, -1.02],
        [-1.02, 1.02], [1.02, 1.02],
      ].forEach(([dx, dz], index) => {
        tree(
          park.x + dx,
          park.z + dz,
          park.square ? 0.74 : 0.9 + index * 0.035,
        );
      });
    });

    [
      [-16, 12], [16, 12], [-16, -16], [16, -16],
    ].forEach(([x, z]) => {
      const patch = box(
        2.85, 0.035, 2.85, materials.park, x, z, 0.01,
      );
      patch.castShadow = false;
      tree(x - 0.8, z - 0.7, 0.85);
      tree(x + 0.85, z + 0.65, 0.95);
    });
  }

  if (!realMap) buildCity();

  const coordinates = realMap
    ? realMap.turns.map((i) => realFrame.point(
        realMap.route[i * 2],
        realMap.route[i * 2 + 1],
      ))
    : compact
    ? [
        [-10, 6], [-10, 2], [-2, 2], [-2, -2],
        [6, -2], [6, -6], [10, -6],
      ]
    : [
        [-6, 14], [-6, 10], [-2, 10], [-2, 2],
        [6, 2], [6, -6], [10, -6], [10, -10],
      ];

  const stops = coordinates.map(([x, z]) => P(x, z, 0.13));
  const route = new THREE.CurvePath();
  let from = stops[0];

  if (realMap) {
    for (let i = 2; i < realMap.route.length; i += 2) {
      const [x, z] = realFrame.point(
        realMap.route[i],
        realMap.route[i + 1],
      );
      const point = P(x, z, 0.13);
      if (point.distanceToSquared(from) < EPS) continue;
      route.add(new THREE.LineCurve3(from, point));
      from = point;
    }
  } else {
    for (let i = 1; i < stops.length; i++) {
      const corner = stops[i];
      const next = stops[i + 1];

      if (!next) {
        route.add(new THREE.LineCurve3(from, corner));
        break;
      }

      const bend = Math.min(
        0.8,
        from.distanceTo(corner) * 0.3,
        corner.distanceTo(next) * 0.3,
      );
      const before = corner.clone().add(
        from.clone().sub(corner).normalize().multiplyScalar(bend),
      );
      const after = corner.clone().add(
        next.clone().sub(corner).normalize().multiplyScalar(bend),
      );

      route.add(new THREE.LineCurve3(from, before));
      route.add(new THREE.QuadraticBezierCurve3(before, corner, after));
      from = after;
    }
  }

  const SAMPLE_COUNT = realMap ? 720 : 180;
  const worldRoute = Array.from(
    { length: SAMPLE_COUNT + 1 },
    (_, i) => route.getPointAt(i / SAMPLE_COUNT),
  );
  const sourcePoint = stops[0];
  const destinationPoint = stops[stops.length - 1];

  // On a real route each leg is the road between two turns, not a straight line.
  const roadLength = (a, b) => {
    let length = 0;
    for (let i = a + 1; i <= b; i++) {
      length += Math.hypot(
        realMap.route[i * 2] - realMap.route[i * 2 - 2],
        realMap.route[i * 2 + 1] - realMap.route[i * 2 - 1],
      );
    }
    return length;
  };
  const legLengths = stops.slice(1).map((point, i) => realMap
    ? roadLength(realMap.turns[i], realMap.turns[i + 1])
    : point.distanceTo(stops[i]));
  const totalLength = legLengths.reduce((sum, length) => sum + length, 0);
  const weights = legLengths.map((length) => Math.pow(length, 0.65));
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

  let accumulatedLength = 0;
  let accumulatedWeight = 0;

  const drawBeats = legLengths.map((length, i) => {
    const beat = {
      from: i === 0 ? 0.045 : accumulatedLength / totalLength,
      to: (accumulatedLength + length) / totalLength,
      at: B.routeAt +
        accumulatedWeight / totalWeight * (B.routeEnd - B.routeAt),
      duration: weights[i] / totalWeight * (B.routeEnd - B.routeAt),
    };
    accumulatedLength += length;
    accumulatedWeight += weights[i];
    return beat;
  });

  function drawProgress(t) {
    if (t <= B.routeAt) return 0.045;
    if (t >= B.routeEnd - EPS) return 1;

    for (const beat of drawBeats) {
      if (t <= beat.at + beat.duration) {
        return lerp(
          beat.from,
          beat.to,
          out(seg(t, beat.at, beat.duration), 2.6),
        );
      }
    }
    return 1;
  }

  // Default countdown changes happen on actual route beats. The last
  // street, final value and pin landing share the exact key frame.
  let countEvents;

  if (countdown.length === 1) {
    const at = K * 0.46;
    countEvents = [{ value: countdown[0], at, progress: drawProgress(at) }];
  } else if (countdown.length <= drawBeats.length) {
    const firstBeat = drawBeats.length - countdown.length;
    countEvents = countdown.map((value, i) => {
      const beat = drawBeats[firstBeat + i];
      return {
        value,
        at: i === countdown.length - 1
          ? K
          : beat.at + beat.duration,
        progress: beat.to,
      };
    });
  } else {
    const start = K * 0.34;
    countEvents = countdown.map((value, i) => {
      const at = lerp(start, K, i / (countdown.length - 1));
      return { value, at, progress: drawProgress(at) };
    });
  }

  // A real route can have a long first street, and the card can't wait for it.
  B.cardAt = realMap
    ? Math.min(countEvents[0].at, K * 0.4)
    : countEvents[0].at;

  const camera = new THREE.PerspectiveCamera(
    M.fov, W / H, realMap ? 1 : 0.1, realMap ? 420 : 240,
  );
  const azimuth = THREE.MathUtils.degToRad(shallow ? 0 : 10);
  const finalElevation = THREE.MathUtils.degToRad(58);
  const finalTarget = realMap
    ? new THREE.Vector3()
    : sourcePoint.clone().add(destinationPoint).multiplyScalar(0.5);
  finalTarget.y = 0;

  const direction = (elevation) => new THREE.Vector3(
    Math.sin(azimuth) * Math.cos(elevation),
    Math.sin(elevation),
    Math.cos(azimuth) * Math.cos(elevation),
  );

  function setCamera(
    target, distance, elevation, fov, offsetX = 0, offsetY = 0,
  ) {
    camera.fov = fov;
    camera.position.copy(target).add(
      direction(elevation).multiplyScalar(distance),
    );
    camera.lookAt(target);
    camera.setViewOffset(W, H, offsetX, offsetY, W, H);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
  }

  function project(point) {
    const p = point.clone().project(camera);
    return {
      x: (p.x + 1) * W / 2,
      y: (1 - p.y) * H / 2,
      z: p.z,
    };
  }

  function boundsOfRoute() {
    const points = worldRoute.map(project);
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const left = Math.min(...xs);
    const right = Math.max(...xs);
    const topEdge = Math.min(...ys);
    const bottomEdge = Math.max(...ys);

    return {
      w: right - left,
      h: bottomEdge - topEdge,
      cx: (left + right) / 2,
      cy: (topEdge + bottomEdge) / 2,
    };
  }

  const mapRect = {
    left: side + M.dot / 2 + 12,
    right: W - side - M.pinW / 2 - 12,
    top: top + M.pinH + 28,
    bottom: cardY - M.mapGap,
  };
  mapRect.bottom = Math.max(mapRect.top + 24, mapRect.bottom);

  let nearDistance = 12;
  let farDistance = 180;

  for (let i = 0; i < 28; i++) {
    const distance = (nearDistance + farDistance) / 2;
    setCamera(finalTarget, distance, finalElevation, M.fov);
    const bounds = boundsOfRoute();

    if (
      bounds.w > mapRect.right - mapRect.left ||
      bounds.h > mapRect.bottom - mapRect.top
    ) {
      nearDistance = distance;
    } else {
      farDistance = distance;
    }
  }

  const finalDistance = farDistance * 1.012;
  setCamera(finalTarget, finalDistance, finalElevation, M.fov);
  const finalBounds = boundsOfRoute();

  const finalOffset = {
    x: finalBounds.cx - (mapRect.left + mapRect.right) / 2,
    y: finalBounds.cy - (mapRect.top + mapRect.bottom) / 2,
  };

  setCamera(
    finalTarget, finalDistance, finalElevation, M.fov,
    finalOffset.x, finalOffset.y,
  );

  // Real streets, water and buildings from `animate route`. Their sizes depend on how large the finished shot
  // shows the map, so this runs once the camera is settled.
  function buildRealMap() {
    const origin = project(finalTarget);
    const nudged = project(finalTarget.clone().add(new THREE.Vector3(1, 0, 0)));
    const pixel = 1 / Math.max(1, Math.abs(nudged.x - origin.x));
    const metre = realFrame.scale;

    // A big route sits further from the camera, so the haze moves back with it.
    scene.fog.near = finalDistance * 1.5;
    scene.fog.far = finalDistance * 3.4;

    const toWorld = (flat) => {
      const points = [];
      for (let i = 0; i < flat.length; i += 2) {
        const [x, z] = realFrame.point(flat[i], flat[i + 1]);
        const last = points[points.length - 1];
        if (!last || last.x !== x || last.y !== z) {
          points.push(new THREE.Vector2(x, z));
        }
      }
      return points;
    };

    const surface = () => ({ positions: [], indices: [] });

    function corner(target, x, z, y) {
      target.positions.push(x, y, z);
      return target.positions.length / 3 - 1;
    }

    // Everything on the ground faces up, whichever way its source shape was wound.
    function triangle(target, a, b, c) {
      const p = target.positions;
      const up =
        (p[b * 3 + 2] - p[a * 3 + 2]) * (p[c * 3] - p[a * 3]) -
        (p[b * 3] - p[a * 3]) * (p[c * 3 + 2] - p[a * 3 + 2]);
      if (up >= 0) target.indices.push(a, b, c);
      else target.indices.push(a, c, b);
    }

    function addMesh(target, material) {
      if (!target.indices.length) return;
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(target.positions, 3),
      );
      const normals = new Float32Array(target.positions.length);
      for (let i = 1; i < normals.length; i += 3) normals[i] = 1;
      geometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
      geometry.setIndex(target.indices);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.receiveShadow = true;
      mesh.frustumCulled = false;
      scene.add(mesh);
    }

    function addDisc(target, point, radius, y) {
      const center = corner(target, point.x, point.y, y);
      const ring = [];
      for (let i = 0; i < 10; i++) {
        const angle = (i / 10) * Math.PI * 2;
        ring.push(corner(
          target,
          point.x + Math.cos(angle) * radius,
          point.y + Math.sin(angle) * radius,
          y,
        ));
      }
      ring.forEach((vertex, i) => {
        triangle(target, center, vertex, ring[(i + 1) % ring.length]);
      });
    }

    function addRibbon(target, points, half, y) {
      if (points.length < 2) return;
      let left = -1;
      let right = -1;

      points.forEach((point, i) => {
        const before = i > 0
          ? point.clone().sub(points[i - 1]).normalize()
          : null;
        const after = i < points.length - 1
          ? points[i + 1].clone().sub(point).normalize()
          : null;
        const a = before || after;
        const b = after || before;
        const bisector = new THREE.Vector2(a.x + b.x, a.y + b.y);
        if (bisector.lengthSq() < EPS) bisector.copy(a);
        bisector.normalize();
        const miter = Math.min(2, 1 / Math.max(0.5, bisector.dot(a)));
        const nx = -bisector.y * half * miter;
        const nz = bisector.x * half * miter;
        const nextLeft = corner(target, point.x + nx, point.y + nz, y);
        const nextRight = corner(target, point.x - nx, point.y - nz, y);

        if (i > 0) {
          triangle(target, left, right, nextLeft);
          triangle(target, right, nextRight, nextLeft);
        }
        left = nextLeft;
        right = nextRight;

        if (i === 0 || i === points.length - 1 || a.dot(b) < 0.55) {
          addDisc(target, point, half, y);
        }
      });
    }

    function addArea(target, rings, y) {
      const [contour, ...holes] = rings.map(toWorld);
      if (!contour || contour.length < 3) return;
      const usable = holes.filter((hole) => hole.length >= 3);
      const start = target.positions.length / 3;
      [contour, ...usable].flat().forEach((point) => {
        corner(target, point.x, point.y, y);
      });
      THREE.ShapeUtils.triangulateShape(contour, usable).forEach(([a, b, c]) => {
        triangle(target, start + a, start + b, start + c);
      });
    }

    const green = surface();
    realMap.green.forEach((rings) => addArea(green, rings, 0.004));
    addMesh(green, materials.park);

    const water = surface();
    realMap.water.forEach((rings) => addArea(water, rings, 0.008));
    realMap.streams.forEach((flat) => {
      addRibbon(
        water, toWorld(flat), Math.max(5 * metre, pixel * 1.6), 0.008,
      );
    });
    addMesh(water, materials.water);

    const roadStyles = [
      ["path", 3, 1.4, 0.012, materials.streets],
      ["service", 6, 2.2, 0.014, materials.streets],
      ["minor", 9, 3.2, 0.016, materials.streets],
      ["tertiary", 12, 4, 0.018, materials.streets],
      ["secondary", 14, 5, 0.02, materials.streets],
      ["primary", 17, 6, 0.022, materials.mainRoad],
      ["motorway", 24, 7.5, 0.024, materials.mainRoad],
    ];

    roadStyles.forEach(([tier, metres, pixels, y, material]) => {
      const roads = surface();
      const half = Math.max(metres * metre * 1.3, pixels * pixel) / 2;
      (realMap.roads[tier] || []).forEach((flat) => {
        addRibbon(roads, toWorld(flat), half, y);
      });
      addMesh(roads, material);
    });

    const shells = [
      { max: 50, material: materials.building, positions: [], normals: [] },
      { max: Infinity, material: materials.tall, positions: [], normals: [] },
    ];
    const roofs = surface();

    function wall(shell, a, b, low, high, nx, nz) {
      const quad = [
        [a, low], [b, low], [b, high],
        [a, low], [b, high], [a, high],
      ];
      const facing = (b.x - a.x) * nz - (b.y - a.y) * nx;
      const order = facing >= 0 ? quad : quad.slice().reverse();
      order.forEach(([point, y]) => {
        shell.positions.push(point.x, y, point.y);
        shell.normals.push(nx, 0, nz);
      });
    }

    realMap.buildings.forEach(({ h, b, p }) => {
      const high = clamp(h * metre * 1.5, 0.1, 3.4);
      const low = Math.min(high - 0.02, b * metre * 1.5);
      const shell = shells.find((item) => h < item.max);
      const [contour, ...holes] = p.map(toWorld);
      if (!contour || contour.length < 3) return;
      const usable = holes.filter((hole) => hole.length >= 3);

      [contour, ...usable].forEach((ring, index) => {
        const area = THREE.ShapeUtils.area(ring);
        const outward = (area > 0) === (index === 0) ? 1 : -1;
        ring.forEach((point, i) => {
          const next = ring[(i + 1) % ring.length];
          const edge = next.clone().sub(point);
          if (edge.lengthSq() < EPS) return;
          edge.normalize();
          wall(
            shell, point, next, low, high,
            edge.y * outward, -edge.x * outward,
          );
        });
      });

      const start = roofs.positions.length / 3;
      [contour, ...usable].flat().forEach((point) => {
        corner(roofs, point.x, point.y, high);
      });
      THREE.ShapeUtils.triangulateShape(contour, usable).forEach(([a, b2, c]) => {
        triangle(roofs, start + a, start + b2, start + c);
      });
    });

    shells.forEach(({ positions, normals, material }) => {
      if (!positions.length) return;
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(positions, 3),
      );
      geometry.setAttribute(
        "normal",
        new THREE.Float32BufferAttribute(normals, 3),
      );
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.frustumCulled = false;
      scene.add(mesh);
    });

    addMesh(roofs, materials.roof);
  }

  if (realMap) buildRealMap();

  const routeSvg = $("route-svg");
  routeSvg.setAttribute("viewBox", `0 0 ${W} ${H}`);

  const casingEl = $("route-casing");
  const routeEl = $("route-stroke");
  const impactEl = $("route-impact");
  const flowEl = $("route-flow");

  casingEl.setAttribute("stroke", V.surface);
  casingEl.setAttribute("stroke-width", M.casing);
  routeEl.setAttribute("stroke", V.route);
  routeEl.setAttribute("stroke-width", M.route);
  impactEl.setAttribute("stroke", V.fastest);
  impactEl.style.visibility = "hidden";
  flowEl.setAttribute("stroke", V.surface);
  flowEl.setAttribute("stroke-width", Math.max(4, M.route * 0.24));
  flowEl.style.visibility = "hidden";

  const checkpointEl = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "circle",
  );
  checkpointEl.setAttribute("fill", "none");
  checkpointEl.setAttribute("stroke", V.route);
  checkpointEl.setAttribute("stroke-width", compact ? 4 : 5);
  checkpointEl.style.visibility = "hidden";
  routeSvg.appendChild(checkpointEl);

  const dotEl = $("source-dot");
  dotEl.style.width = dotEl.style.height = M.dot + "px";

  $("source-core").style.cssText = `
    background:${V.route};
    border:${M.dotRim}px solid ${V.surface};
    box-shadow:0 5px 13px ${rgba(V.ink, 0.18)}`;

  const sourcePulses = Array.from(
    document.querySelectorAll(".source-pulse"),
  );
  sourcePulses.forEach((el) => {
    el.style.border = `3px solid ${rgba(V.route, 0.6)}`;
  });

  const headEl = $("route-head");
  headEl.style.width = headEl.style.height = M.head + "px";

  const headHalo = $("route-head-halo");
  headHalo.style.border = `3px solid ${V.route}`;

  $("route-head-core").style.cssText = `
    background:${V.surface};
    border:${compact ? 6 : 8}px solid ${V.route};
    box-shadow:0 3px 12px ${rgba(V.ink, 0.16)}`;

  const pinEl = $("destination");
  pinEl.style.width = M.pinW + "px";
  pinEl.style.height = M.pinH + "px";
  $("pin-shape").setAttribute("fill", V.pin);
  $("pin-shape").setAttribute("stroke", V.surface);
  $("pin-hole").setAttribute("fill", V.surface);

  const pinShadow = $("destination-shadow");
  const shadowW = M.pinW * 0.78;
  const shadowH = M.pinW * 0.23;

  pinShadow.style.cssText = `
    width:${shadowW}px;height:${shadowH}px;
    background:radial-gradient(ellipse, ${rgba(V.ink, 0.2)}, ${rgba(V.ink, 0)} 72%)`;

  const arrivalEl = $("arrival-rings");
  const arrivalSize = M.pinW * 0.78;
  arrivalEl.style.width = arrivalSize + "px";
  arrivalEl.style.height = arrivalSize * 0.5 + "px";

  const arrivalRings = Array.from(
    document.querySelectorAll(".arrival-ring"),
  );
  arrivalRings.forEach((el) => {
    el.style.border = `${compact ? 3 : 4}px solid ${V.fastest}`;
  });

  function fitLabel(el, width, minimum) {
    fit(el, width, minimum);
    if (el.scrollWidth > width + 1) {
      el.style.whiteSpace = "normal";
      el.style.width = width + "px";
      el.style.textWrap = "balance";
    }
  }

  const destinationLabel = $("destination-label");
  destinationLabel.textContent = V.destination;
  destinationLabel.style.cssText = `
    font-size:${M.destination}px;
    color:${V.pin};
    background:${V.surface};
    padding:${M.labelPadY}px ${M.labelPadX}px;
    box-shadow:0 4px 12px ${rgba(V.ink, 0.09)}`;

  fitLabel(destinationLabel, M.destinationMax, minText);

  const destinationLabelW = destinationLabel.offsetWidth;
  const destinationLabelH = destinationLabel.offsetHeight;

  function destinationLabelRect(point) {
    return {
      x: clamp(
        point.x - M.pinW / 2 - 22 - destinationLabelW,
        side,
        W - side - destinationLabelW,
      ),
      y: clamp(
        point.y - M.pinH * 0.68 - destinationLabelH / 2,
        top + 4,
        Math.max(top + 4, cardY - destinationLabelH - 30),
      ),
      w: destinationLabelW,
      h: destinationLabelH,
    };
  }

  const finalScreenRoute = worldRoute.map(project);
  const finalDestination = project(destinationPoint);
  const finalSource = project(sourcePoint);

  const reserved = [
    destinationLabelRect(finalDestination),
    {
      x: finalDestination.x - M.pinW / 2 - 16,
      y: finalDestination.y - M.pinH - 24,
      w: M.pinW + 32,
      h: M.pinH + 48,
    },
    {
      x: finalSource.x - M.dot * 0.8,
      y: finalSource.y - M.dot * 0.8,
      w: M.dot * 1.6,
      h: M.dot * 1.6,
    },
  ];

  const overlapArea = (a, b) =>
    Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) *
    Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));

  const creditEl = $("map-credit");

  if (realMap) {
    creditEl.textContent = realMap.attribution;
    creditEl.style.cssText = `
      right:${side}px;top:${cardY - 36}px;
      color:${V.muted};
      text-shadow:0 0 6px ${V.surface}, 0 0 2px ${V.surface}`;
    fit(creditEl, W - side * 2, 18);
    reserved.push({
      x: W - side - creditEl.offsetWidth - 8,
      y: cardY - 44,
      w: creditEl.offsetWidth + 16,
      h: creditEl.offsetHeight + 16,
    });
  }

  // The pin already names the destination, so a map label doesn't repeat it.
  const sameName = (a, b) => {
    const one = String(a).toLowerCase();
    const two = String(b).toLowerCase();
    return one.includes(two) || two.includes(one);
  };

  const labelSpots = realMap
    ? realMap.places
        .filter((place) => !sameName(place.name, V.destination))
        .map((place) => {
          const [x, z] = realFrame.point(place.x, place.y);
          return { x, z, text: place.name };
        })
    : parkSpecs.map((park, i) => ({
        x: park.x, z: park.z, text: V[`place${i + 1}`],
      }));

  let labelsShown = 0;

  const labels = labelSpots.map((park) => {
    if (realMap && labelsShown >= 3) return { active: false };

    const el = make(
      "div", "map-label", $("place-labels"), park.text,
    );
    el.style.fontSize = M.place + "px";
    el.style.color = V.muted;
    el.style.textShadow = [
      `0 0 10px ${V.surface}`,
      `3px 0 3px ${V.surface}`,
      `-3px 0 3px ${V.surface}`,
      `0 3px 3px ${V.surface}`,
      `0 -3px 3px ${V.surface}`,
    ].join(",");

    fitLabel(el, M.placeMax, minText);

    const anchor = project(P(park.x, park.z, 0.1));
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const candidates = [];
    const dxs = [0, -80, 80, -160, 160, -240, 240];
    const dys = [0, -1.7, 1.7, -3.2, 3.2, -4.8, 4.8];

    dys.forEach((dy) => {
      dxs.forEach((dx) => {
        candidates.push({
          x: anchor.x - w / 2 + dx,
          y: anchor.y - h / 2 + dy * M.place,
        });
      });
    });

    [top + 16, top + M.pinH + 38, cardY - h - 38].forEach((y) => {
      [side, (W - w) / 2, W - side - w].forEach((x) => {
        candidates.push({ x, y });
      });
    });

    let best = null;

    candidates.forEach((candidate) => {
      const rect = {
        x: clamp(candidate.x, side, W - side - w),
        y: clamp(
          candidate.y,
          top + 12,
          Math.max(top + 12, cardY - h - 38),
        ),
        w,
        h,
      };
      const pad = M.casing / 2 + 24;
      let hits = 0;

      finalScreenRoute.forEach((point) => {
        if (
          point.x > rect.x - pad && point.x < rect.x + w + pad &&
          point.y > rect.y - pad && point.y < rect.y + h + pad
        ) hits++;
      });

      const padded = {
        x: rect.x - 16,
        y: rect.y - 14,
        w: w + 32,
        h: h + 28,
      };
      const overlaps = reserved.reduce(
        (sum, other) => sum + overlapArea(padded, other),
        0,
      );
      const travel = Math.hypot(
        rect.x + w / 2 - anchor.x,
        rect.y + h / 2 - anchor.y,
      );
      const score = hits * 100000 + overlaps * 30 + travel;

      if (!best || score < best.score) {
        best = { ...rect, score, hits, overlaps, travel };
      }
    });

    // A real name stays beside the real place, or it isn't shown.
    const active = Boolean(
      best && best.hits === 0 && best.overlaps < 1 &&
      w <= W - side * 2 && h < cardY - top - 48 &&
      (!realMap || best.travel < M.place * 3),
    );

    if (active) {
      reserved.push({
        x: best.x - 8,
        y: best.y - 8,
        w: best.w + 16,
        h: best.h + 16,
      });
    }

    const at = K * 0.36 + labelsShown * 0.14;
    if (active) labelsShown++;

    return {
      el,
      active,
      x: best ? best.x : side,
      y: best ? best.y : top,
      at,
    };
  });

  const cardEl = $("trip-card");
  cardEl.style.cssText = `
    left:${side}px;top:${cardY}px;width:${cardW}px;height:${M.cardH}px;
    border-radius:${compact ? 32 : 42}px;
    background:${V.surface};
    border:2px solid ${rgba(V.route, 0.16)};
    box-shadow:0 20px 52px ${rgba(V.ink, 0.16)}, 0 3px 8px ${rgba(V.ink, 0.06)}`;

  const washEl = $("trip-wash");
  washEl.style.background = V.fastest;

  const edgeEl = $("trip-edge");
  edgeEl.style.width = (compact ? 12 : 18) + "px";
  edgeEl.style.background = V.fastest;

  const accentEl = $("trip-accent");
  accentEl.style.cssText = `
    left:${M.pad}px;right:${M.pad}px;height:6px;background:${V.route}`;

  const copyW = cardW - M.pad * 2 - M.buttonW - 28;
  const copyEl = $("trip-copy");
  copyEl.style.cssText = `
    left:${M.pad}px;top:${M.pad}px;width:${copyW}px`;

  const timeEl = $("trip-time");
  timeEl.style.cssText = `
    font-size:${M.time}px;color:${V.ink};
    height:${timeHeight}px`;

  const distanceEl = $("trip-distance");
  distanceEl.textContent = V.distance;
  distanceEl.style.cssText = `
    font-size:${M.detail}px;color:${V.muted};margin-top:8px`;

  const fastestEl = $("trip-fastest");
  fastestEl.style.cssText = `
    color:${V.fastest};
    background:${V.surface};
    border:1px solid ${rgba(V.fastest, 0.32)};
    padding:${M.badgePadY}px ${M.badgePadX}px;
    margin-top:12px`;

  const fastestText = $("fastest-text");
  fastestText.textContent = V.fastestLabel;
  fastestText.style.fontSize = M.fastest + "px";
  fastestText.style.fontWeight = "700";

  const fastestIcon = fastestEl.querySelector("svg");
  fastestIcon.style.width = M.fastest + "px";
  fastestIcon.style.height = M.fastest + "px";

  const badgeMaxW = shallow ? cardW * 0.48 : copyW / 1.1;

  fitLabel(
    fastestText,
    badgeMaxW - M.fastest - 12 - M.badgePadX * 2,
    minText,
  );

  if (shallow) {
    const badgeW = fastestEl.offsetWidth;
    fastestEl.style.position = "absolute";
    fastestEl.style.left =
      Math.max(0, cardW - M.pad * 2 - badgeW - 10) + "px";
    fastestEl.style.top = timeHeight + 8 + "px";
    fastestEl.style.marginTop = "0";
    fitLabel(
      distanceEl,
      Math.max(140, cardW - M.pad * 2 - badgeW - 40),
      minText,
    );
  } else {
    fitLabel(distanceEl, copyW, minText);
  }

  const goEl = $("go-button");
  goEl.style.cssText = `
    right:${M.pad}px;
    top:${Math.round(M.pad + (timeHeight - M.buttonH) / 2)}px;
    width:${M.buttonW}px;height:${M.buttonH}px;
    background:${V.route};color:${V.surface}`;

  const goText = $("go-text");
  goText.textContent = V.button;
  goText.style.fontSize = M.buttonText + "px";
  fit(goText, M.buttonW - M.arrow - 38, minText);

  const goArrow = $("go-arrow");
  goArrow.style.width = goArrow.style.height = M.arrow + "px";

  // Reserve the strongest time punch before measuring every whole value.
  [...countdown.map(interimTime), String(V.tripTime)].forEach((text) => {
    timeEl.textContent = text;
    fit(timeEl, copyW / 1.15, compact ? 88 : 112);
  });
  timeEl.textContent = V.tripTime;

  const startLook = sourcePoint.clone().add(new THREE.Vector3(
    -Math.sin(azimuth) * 2.2,
    0,
    -Math.cos(azimuth) * 2.2,
  ));
  startLook.y = 0.12;

  const initialElevation = THREE.MathUtils.degToRad(32);
  const initialDistance = compact ? 16.5 : 15;

  function aim(t) {
    const retreat = out(seg(t, 0, K * 0.3), 3);
    const rise = out(seg(t, 0, K * 0.28), 3);
    const pan = smooth(seg(t, K * 0.025, K * 0.295));
    const target = startLook.clone().lerp(finalTarget, pan);

    setCamera(
      target,
      lerp(initialDistance, finalDistance, retreat),
      lerp(initialElevation, finalElevation, rise),
      lerp(46, M.fov, pan),
      finalOffset.x * pan,
      finalOffset.y * pan,
    );
  }

  function screenPoint(points, progress) {
    const position = clamp(progress) * SAMPLE_COUNT;
    const whole = Math.floor(position);

    if (whole >= SAMPLE_COUNT) return points[SAMPLE_COUNT];

    const p = position - whole;
    return {
      x: lerp(points[whole].x, points[whole + 1].x, p),
      y: lerp(points[whole].y, points[whole + 1].y, p),
      z: lerp(points[whole].z, points[whole + 1].z, p),
    };
  }

  function screenPath(points, start = 0, end = 1) {
    const a = clamp(start);
    const b = Math.max(a, clamp(end));
    const first = screenPoint(points, a);
    const last = screenPoint(points, b);

    let path = `M${first.x.toFixed(2)},${first.y.toFixed(2)}`;

    for (
      let i = Math.floor(a * SAMPLE_COUNT) + 1;
      i < b * SAMPLE_COUNT;
      i++
    ) {
      path += `L${points[i].x.toFixed(2)},${points[i].y.toFixed(2)}`;
    }

    return path + `L${last.x.toFixed(2)},${last.y.toFixed(2)}`;
  }

  function renderAt(inputTime) {
    const time = Math.max(0, Number(inputTime) || 0);
    const t = designTime(time);
    const arrived = time >= T.key - EPS;
    const holdTime = Math.max(0, time - T.key);
    const keyEnergy = arrived ? Math.exp(-holdTime * 6.5) : 0;
    const keyKick = arrived
      ? Math.exp(-holdTime * 10) * Math.cos(holdTime * 18)
      : 0;

    aim(t);

    const screenRoute = worldRoute.map(project);
    const progress = arrived ? 1 : drawProgress(t);
    const path = screenPath(screenRoute, 0, progress);

    casingEl.setAttribute("d", path);
    casingEl.setAttribute(
      "stroke-width",
      (M.casing * (1 + keyEnergy * 0.15)).toFixed(3),
    );
    routeEl.setAttribute("d", path);
    routeEl.setAttribute(
      "stroke-width",
      (M.route * (1 + keyEnergy * 0.2)).toFixed(3),
    );
    routeEl.setAttribute(
      "stroke",
      arrived
        ? mixed(V.route, V.fastest, keyEnergy * 0.94).getStyle()
        : V.route,
    );

    impactEl.style.visibility = arrived ? "visible" : "hidden";
    impactEl.setAttribute("d", path);
    impactEl.setAttribute(
      "stroke-width",
      (M.casing + 18 + 46 * (1 - keyEnergy)).toFixed(3),
    );
    impactEl.style.opacity = (0.72 * keyEnergy).toFixed(4);

    flowEl.style.visibility = arrived ? "visible" : "hidden";

    if (arrived) {
      const phase = (holdTime / 1.85) % 1;
      const end = 0.14 + phase;
      flowEl.setAttribute("d", screenPath(screenRoute, end - 0.14, end));
      flowEl.style.opacity = "0.76";
    }

    let countIndex = 0;
    for (let i = 1; i < countEvents.length; i++) {
      if (t + EPS >= countEvents[i].at) countIndex = i;
      else break;
    }

    const countEvent = countEvents[countIndex];
    const tickAge = t - countEvent.at;
    const tickKick = !arrived && tickAge >= -EPS
      ? Math.exp(-Math.max(0, tickAge) * 17) *
        Math.cos(Math.max(0, tickAge) * 23)
      : 0;

    const showCheckpoint =
      !arrived && tickAge >= -EPS && tickAge < 0.42;
    checkpointEl.style.visibility =
      showCheckpoint ? "visible" : "hidden";

    if (showCheckpoint) {
      const checkpoint = screenPoint(screenRoute, countEvent.progress);
      const phase = clamp(Math.max(0, tickAge) / 0.42);
      checkpointEl.setAttribute("cx", checkpoint.x.toFixed(2));
      checkpointEl.setAttribute("cy", checkpoint.y.toFixed(2));
      checkpointEl.setAttribute(
        "r",
        (M.head * (0.48 + out(phase, 2) * 1.25)).toFixed(2),
      );
      checkpointEl.style.opacity =
        (0.7 * Math.pow(1 - phase, 2)).toFixed(4);
    }

    const source = project(sourcePoint);
    const openingDotScale = compact ? 1.95 : 2.2;
    const sourceScale =
      lerp(openingDotScale, 1, out(seg(t, 0, K * 0.3), 3)) *
      (1 + keyKick * 0.12);

    dotEl.style.visibility =
      source.z > -1 && source.z < 1 ? "visible" : "hidden";
    dotEl.style.transform =
      `translate(${(source.x - M.dot / 2).toFixed(2)}px, ${(source.y - M.dot / 2).toFixed(2)}px) scale(${sourceScale.toFixed(4)})`;

    sourcePulses.forEach((el, i) => {
      const phase = ((time / 1.65 + i * 0.5) % 1 + 1) % 1;
      el.style.transform = `scale(${(1 + phase * 1.12).toFixed(4)})`;
      el.style.opacity = (0.46 * Math.pow(1 - phase, 2)).toFixed(4);
    });

    const head = screenPoint(screenRoute, progress);
    headEl.style.visibility =
      !arrived && head.z > -1 && head.z < 1 ? "visible" : "hidden";
    headEl.style.transform =
      `translate(${(head.x - M.head / 2).toFixed(2)}px, ${(head.y - M.head / 2).toFixed(2)}px)`;

    const headPhase = (time / 0.72) % 1;
    headHalo.style.transform =
      `scale(${(1.1 + headPhase * 0.65).toFixed(4)})`;
    headHalo.style.opacity =
      (0.26 * Math.pow(1 - headPhase, 2)).toFixed(4);

    currents.forEach(({ mesh, base, lane }) => {
      const x = base + ((time * 0.42) % 4);
      mesh.position.copy(P(x, riverCenter(x) + lane, 0.041));
      mesh.rotation.z = Math.atan(0.08 * stretchZ);
    });

    labels.forEach((label) => {
      if (!label.el) return;
      const visible = label.active && t >= label.at;
      label.el.style.visibility = visible ? "visible" : "hidden";
      if (!visible) return;

      const pop = back(seg(t, label.at, 0.22), 1.5);
      const scale = 1 + (1 - pop) * 0.055;
      label.el.style.transform =
        `translate(${label.x.toFixed(2)}px, ${label.y.toFixed(2)}px) scale(${scale.toFixed(4)})`;
    });

    const destination = project(destinationPoint);
    const falling = seg(t, B.pinAt, B.pinHit - B.pinAt);
    const pinVisible = t >= B.pinAt;
    const impact = arrived
      ? Math.sin(seg(holdTime, 0, 0.14) * Math.PI)
      : 0;
    const rebound = holdTime >= 0.14
      ? Math.sin(seg(holdTime, 0.14, 0.16) * Math.PI)
      : 0;

    const drop = M.drop * (1 - falling * falling);
    const sx =
      1 + impact * 0.17 - rebound * 0.035 + keyKick * 0.13;
    const sy =
      1 - impact * 0.2 + rebound * 0.045 + keyKick * 0.13;

    pinEl.style.visibility = pinVisible ? "visible" : "hidden";
    pinEl.style.transform =
      `translate(${(destination.x - M.pinW / 2).toFixed(2)}px, ${(destination.y - M.pinH - drop).toFixed(2)}px) scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`;

    pinShadow.style.visibility = pinVisible ? "visible" : "hidden";
    pinShadow.style.transform =
      `translate(${(destination.x - shadowW / 2).toFixed(2)}px, ${(destination.y - shadowH / 2).toFixed(2)}px) scale(${lerp(0.4, 1, falling).toFixed(4)})`;
    pinShadow.style.opacity = lerp(0.25, 1, falling).toFixed(4);

    destinationLabel.style.visibility =
      t >= B.destinationAt ? "visible" : "hidden";

    if (t >= B.destinationAt) {
      const rect = destinationLabelRect(destination);
      const pop = back(seg(t, B.destinationAt, 0.22), 1.5);
      const scale = 0.94 + pop * 0.06;

      destinationLabel.style.transform =
        `translate(${(rect.x - (1 - pop) * 14).toFixed(2)}px, ${rect.y.toFixed(2)}px) scale(${scale.toFixed(4)})`;
    }

    arrivalEl.style.visibility = arrived ? "visible" : "hidden";
    arrivalEl.style.transform =
      `translate(${(destination.x - arrivalSize / 2).toFixed(2)}px, ${(destination.y - arrivalSize / 4).toFixed(2)}px)`;

    arrivalRings.forEach((el, i) => {
      if (!arrived) {
        el.style.opacity = "0";
        return;
      }

      const phase = (holdTime / 1.65 + i * 0.5) % 1;
      const scale = 1 + phase * 2.8 + keyEnergy * 0.7;
      el.style.transform = `scale(${scale.toFixed(4)})`;
      el.style.opacity = (
        0.5 * Math.pow(1 - phase, 2) + keyEnergy * 0.22
      ).toFixed(4);
    });

    const cardVisible = t + EPS >= B.cardAt;
    const cardProgress = seg(t, B.cardAt, B.cardDuration);
    const cardSpring = back(cardProgress, 0.9);
    const cardTravel = Math.min(30, bottom * 0.55);
    const cardDisplacement = (1 - cardSpring) * cardTravel;
    const introScale = 0.94 + cardSpring * 0.06;
    const cardScale =
      introScale * (1 + tickKick * 0.018 + keyKick * 0.065);

    cardEl.style.visibility = cardVisible ? "visible" : "hidden";
    cardEl.style.transform =
      `translateY(${(cardDisplacement - keyKick * 8).toFixed(2)}px) scale(${cardScale.toFixed(5)})`;

    copyEl.style.visibility = cardVisible ? "visible" : "hidden";
    goEl.style.visibility = cardVisible ? "visible" : "hidden";
    creditEl.style.visibility = cardVisible ? "visible" : "hidden";
    fastestEl.style.visibility =
      cardVisible && arrived ? "visible" : "hidden";

    const displayedTime = arrived
      ? String(V.tripTime)
      : interimTime(countEvent.value);
    if (timeEl.textContent !== displayedTime) {
      timeEl.textContent = displayedTime;
    }

    const timeScale = arrived
      ? 1.025 + keyKick * 0.105
      : 1 + tickKick * 0.045;

    timeEl.style.transform = `scale(${timeScale.toFixed(5)})`;
    timeEl.style.color = arrived
      ? mixed(V.ink, V.fastest, 0.48 + keyEnergy * 0.43).getStyle()
      : V.ink;

    accentEl.style.background = arrived ? V.fastest : V.route;
    accentEl.style.transform =
      `scaleX(${(arrived ? 1 : clamp(progress, 0.12, 1)).toFixed(4)})`;
    accentEl.style.height =
      (arrived ? 12 + keyEnergy * 8 : 6) + "px";

    washEl.style.visibility = arrived ? "visible" : "hidden";
    washEl.style.opacity = arrived
      ? (0.065 + keyEnergy * 0.17).toFixed(4)
      : "0";

    edgeEl.style.visibility = arrived ? "visible" : "hidden";
    edgeEl.style.width = (
      compact
        ? 12 + keyEnergy * 8
        : 18 + keyEnergy * 12
    ).toFixed(2) + "px";

    cardEl.style.borderColor = arrived
      ? rgba(V.fastest, 0.5 + keyEnergy * 0.4)
      : rgba(V.route, 0.16);

    fastestEl.style.transform =
      `scale(${(1 + keyKick * 0.08).toFixed(5)})`;

    const arrowMotion = arrived
      ? Math.sin(holdTime * 2) * 3 +
        keyEnergy * Math.sin(holdTime * 24) * 6
      : 0;

    goArrow.style.transform = `translateX(${arrowMotion.toFixed(2)}px)`;
    goEl.style.transform =
      `scale(${(1 + keyKick * 0.055).toFixed(5)})`;

    const open = variant === "overlay"
      ? out(seg(time, 0, 0.26), 3)
      : 1;
    const exitDuration = Math.max(0, T.exit - 1 / CA.fps);
    let closed = T.exit > 0
      ? seg(time, T.key + T.hold, exitDuration)
      : 0;

    if (closed > 1 - 0.0000001) closed = 1;

    if (open >= 0.999999 && closed === 0) {
      stageEl.style.clipPath = "none";
    } else {
      const center = closed > 0 ? destination : source;
      const radius = Math.hypot(W, H) * open * (1 - closed * closed);

      stageEl.style.clipPath =
        `circle(${Math.max(0, radius).toFixed(3)}px at ${center.x.toFixed(2)}px ${center.y.toFixed(2)}px)`;
    }

    renderer.render(scene, camera);
  }

  window.addEventListener("hf-seek", (event) => renderAt(event.detail.time));
  renderAt(window.__hfThreeTime || 0);
  window.__timelines["block"] = gsap.timeline({ paused: true });
});