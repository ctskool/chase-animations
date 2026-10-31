// Isometric flow. A real 3D scene under an orthographic camera. Every frame is worked out from time alone,
// so a frame looks the same whichever render worker draws it.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/RoundedBoxGeometry.js";

CA.ready(() => {
  const { vars: V, stage: S, safe, time: T, variant, make } = CA;
  const $ = (id) => document.getElementById(id);
  const W = S.w;
  const H = S.h;
  const col = (hex) => new THREE.Color(hex);

  // Beats in design seconds. T.scale stretches or squeezes everything before the key moment to fit a chosen word.
  const B = { buildings: [0.12, 0.44, 0.76], labelLag: 0.2, dashStart: 0.2, dashEnd: 1.25, parcels: [1.2, 1.5, 1.8], vanGo: 2.05, vanStop: 3.08 };
  const design = (t) => (t <= T.key ? t / T.scale : T.design + (t - T.key));
  const K = T.design;

  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const seg = (t, t0, d) => clamp((t - t0) / d);
  const easeOut = (p, n = 3) => 1 - Math.pow(1 - p, n);
  const inOut = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
  const backOut = (p, s = 2.2) => 1 + (s + 1) * Math.pow(p - 1, 3) + s * Math.pow(p - 1, 2);
  const ring = (t, at, k = 6, f = 19) => (t < at ? 0 : Math.exp(-k * (t - at)) * Math.sin(f * (t - at)));

  const R2 = Math.SQRT2;
  const P = (x, z, y = 0) => new THREE.Vector3(x, y, z);

  const canvas = $("gl");
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(2);
  renderer.setSize(W, H, false);
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;

  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0xcfd9e6, 2.0));
  const sun = new THREE.DirectionalLight(0xffffff, 1.2);
  sun.position.set(-6.5, 15, 7.5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.radius = 5;
  sun.shadow.blurSamples = 16;
  sun.shadow.bias = -0.0006;
  Object.assign(sun.shadow.camera, { left: -11, right: 11, top: 11, bottom: -11, near: 1, far: 40 });
  scene.add(sun);

  const mat = (hex, rough = 0.78) => new THREE.MeshStandardMaterial({ color: col(hex), roughness: rough, metalness: 0 });
  const box = (w, h, d, hex, r = 0.07) => {
    const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 4, Math.min(r, w / 2.2, h / 2.2, d / 2.2)), typeof hex === "string" ? mat(hex) : hex);
    m.castShadow = m.receiveShadow = true;
    return m;
  };

  // Soft darkening where things meet the ground, painted once into a texture.
  const blobTex = (() => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d");
    const grad = g.createRadialGradient(64, 64, 8, 64, 64, 64);
    grad.addColorStop(0, "rgba(43,52,69,0.34)");
    grad.addColorStop(0.55, "rgba(43,52,69,0.14)");
    grad.addColorStop(1, "rgba(43,52,69,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  })();
  const blob = (w, d) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false }));
    m.rotation.x = -Math.PI / 2;
    m.position.y = 0.03;
    m.renderOrder = 2;
    return m;
  };

  // Slab.
  const slabShape = new THREE.Shape();
  const half = 5;
  const rad = 0.75;
  slabShape.moveTo(-half + rad, -half);
  slabShape.lineTo(half - rad, -half);
  slabShape.quadraticCurveTo(half, -half, half, -half + rad);
  slabShape.lineTo(half, half - rad);
  slabShape.quadraticCurveTo(half, half, half - rad, half);
  slabShape.lineTo(-half + rad, half);
  slabShape.quadraticCurveTo(-half, half, -half, half - rad);
  slabShape.lineTo(-half, -half + rad);
  slabShape.quadraticCurveTo(-half, -half, -half + rad, -half);
  const slabGeo = new THREE.ExtrudeGeometry(slabShape, { depth: 0.55, bevelEnabled: true, bevelSize: 0.09, bevelThickness: 0.09, bevelSegments: 4, curveSegments: 16 });
  slabGeo.rotateX(Math.PI / 2);
  const slabSide = new THREE.Color(V.slab).multiplyScalar(0.8);
  const slab = new THREE.Mesh(slabGeo, [mat(V.slab, 0.92), new THREE.MeshStandardMaterial({ color: slabSide, roughness: 0.9 })]);
  slab.position.y = -0.09;
  slab.receiveShadow = true;
  scene.add(slab);

  // Road: straight runs along the slab's own axes with rounded bends, so every door can face it.
  const stops = [[-5.0, 3.4], [-0.6, 3.4], [-0.6, 0.6], [2.4, 0.6], [2.4, -1.6], [5.0, -1.6]].map(([x, z]) => P(x, z, 0.02));
  const road = new THREE.CurvePath();
  const BEND = 0.85;
  let from = stops[0];
  for (let i = 1; i < stops.length; i++) {
    const here = stops[i];
    const next = stops[i + 1];
    if (!next) {
      road.add(new THREE.LineCurve3(from, here));
      break;
    }
    const inPoint = here.clone().add(from.clone().sub(here).setLength(BEND));
    const outPoint = here.clone().add(next.clone().sub(here).setLength(BEND));
    road.add(new THREE.LineCurve3(from, inPoint));
    road.add(new THREE.QuadraticBezierCurve3(inPoint, here, outPoint));
    from = outPoint;
  }
  const ROAD_LEN = road.getLength();
  const ribbon = (halfW, from, to, y, n) => {
    const pos = [];
    const idx = [];
    for (let i = 0; i <= n; i++) {
      const u = from + ((to - from) * i) / n;
      const p = road.getPointAt(u);
      const t = road.getTangentAt(u);
      const side = new THREE.Vector3(-t.z, 0, t.x).normalize().multiplyScalar(halfW);
      pos.push(p.x + side.x, y, p.z + side.z, p.x - side.x, y, p.z - side.z);
      if (i < n) idx.push(2 * i, 2 * i + 2, 2 * i + 1, 2 * i + 1, 2 * i + 2, 2 * i + 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  };
  const roadMesh = new THREE.Mesh(ribbon(0.46, 0, 1, 0.025, 180), mat(V.road, 0.9));
  roadMesh.receiveShadow = true;
  scene.add(roadMesh);

  const dashes = [];
  for (let d = 0.14; d < ROAD_LEN - 0.34; d += 0.52) {
    dashes.push(new THREE.Mesh(ribbon(0.05, d / ROAD_LEN, (d + 0.28) / ROAD_LEN, 0.04, 4), new THREE.MeshBasicMaterial({ color: 0xffffff })));
    scene.add(dashes[dashes.length - 1]);
  }

  // Each step's building. They differ in shape so the three steps read as three different places.
  function building(hex, bx, bz, kind) {
    const g = new THREE.Group();
    const roof = "#FFFFFF";
    const dark = V.ink;
    let w = 1.9;
    let d = 1.7;
    let h = 1.15;
    if (kind === 1) { w = 1.55; d = 1.55; h = 2.15; }
    if (kind === 2) { w = 1.95; d = 1.55; h = 1.3; }
    const body = box(w, h, d, hex, 0.09);
    body.position.y = h / 2;
    g.add(body);
    const top = box(w + 0.14, 0.17, d + 0.14, roof, 0.07);
    top.position.y = h + 0.06;
    g.add(top);
    const door = box(0.52, kind === 0 ? 0.72 : 0.58, 0.06, dark, 0.03);
    door.position.set(0, (kind === 0 ? 0.72 : 0.58) / 2, d / 2 + 0.01);
    g.add(door);
    if (kind === 0) {
      // Warehouse: a roller door and a low roof block.
      [0.16, 0.32, 0.48].forEach((y) => {
        const line = box(0.44, 0.025, 0.02, "#FFFFFF", 0.01);
        line.position.set(0, y, d / 2 + 0.045);
        g.add(line);
      });
      const vent = box(0.62, 0.26, 0.62, roof, 0.06);
      vent.position.set(-0.3, h + 0.26, -0.2);
      g.add(vent);
    }
    const rows = kind === 1 ? 3 : 1;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < 2; c++) {
        const win = box(0.05, 0.3, 0.34, dark, 0.02);
        win.position.set(w / 2 + 0.005, kind === 1 ? 0.62 + r * 0.56 : 0.72, (c - 0.5) * 0.72);
        g.add(win);
      }
    }
    if (kind === 1) {
      for (let r = 1; r < 3; r++) {
        const win = box(0.86, 0.3, 0.05, dark, 0.02);
        win.position.set(0, 0.62 + r * 0.56, d / 2 + 0.005);
        g.add(win);
      }
    }
    if (kind === 2) {
      const awning = box(w * 0.8, 0.09, 0.42, "#FFFFFF", 0.04);
      awning.position.set(0, 0.84, d / 2 + 0.2);
      g.add(awning);
    }
    const pos = P(bx, bz);
    g.position.copy(pos);
    const shade = blob(w * 2.2, d * 2.2);
    shade.position.x = pos.x;
    shade.position.z = pos.z;
    scene.add(shade);
    scene.add(g);
    return { g, h: h + 0.45, x: bx, z: bz, shade };
  }

  const buildings = [
    building(V.color1, -3.0, 1.75, 0),
    building(V.color2, 0.55, -1.25, 1),
    building(V.color3, 3.4, -3.25, 2),
  ];

  function tree(u, v, s) {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.3, 10), mat(V.ink));
    trunk.position.y = 0.15;
    trunk.castShadow = true;
    g.add(trunk);
    const crown = new THREE.Color(V.color1).lerp(new THREE.Color("#ffffff"), 0.18);
    const a = new THREE.Mesh(new THREE.SphereGeometry(0.34, 20, 16), new THREE.MeshStandardMaterial({ color: crown, roughness: 0.85 }));
    a.position.y = 0.5;
    a.scale.y = 0.92;
    a.castShadow = true;
    g.add(a);
    const b = a.clone();
    b.position.set(0.08, 0.76, 0.03);
    b.scale.setScalar(0.66);
    g.add(b);
    g.position.copy(P(u, v));
    g.scale.setScalar(s);
    const shade = blob(1.25 * s, 1.25 * s);
    shade.position.x = g.position.x;
    shade.position.z = g.position.z;
    scene.add(shade);
    scene.add(g);
  }
  [[0.95, 2.3, 1], [2.3, 3.2, 0.85], [3.6, 1.9, 1.1], [1.5, 4.1, 0.8], [3.9, 0.55, 0.8], [-3.7, -1.1, 0.95], [-1.6, -0.6, 0.8],
   [-2.1, -3.2, 1.05], [-4.1, -3.6, 0.9]].forEach((t) => tree(...t));

  // Conveyor from the first building down to the road.
  const beltStart = P(-3.0, 2.55);
  const beltEnd = P(-3.0, 3.02);
  const belt = box(0.46, 0.09, 0.56, V.ink, 0.03);
  belt.position.copy(beltStart.clone().lerp(beltEnd, 0.5)).setY(0.07);
  scene.add(belt);

  // Van, drawn facing +x.
  const van = new THREE.Group();
  const vanBody = new THREE.Group();
  const cargo = box(0.92, 0.6, 0.62, "#FFFFFF", 0.09);
  cargo.position.set(-0.17, 0.46, 0);
  const cab = box(0.42, 0.46, 0.6, "#FFFFFF", 0.1);
  cab.position.set(0.44, 0.39, 0);
  const glass = box(0.05, 0.2, 0.5, V.ink, 0.02);
  glass.position.set(0.645, 0.48, 0);
  const sideGlass = box(0.22, 0.17, 0.62, V.ink, 0.02);
  sideGlass.position.set(0.46, 0.49, 0);
  const stripe = box(0.8, 0.07, 0.635, V.chip, 0.02);
  stripe.position.set(-0.16, 0.42, 0);
  vanBody.add(cargo, cab, glass, sideGlass, stripe);
  van.add(vanBody);
  [[0.42, 0.34], [0.42, -0.34], [-0.38, 0.34], [-0.38, -0.34]].forEach(([x, z]) => {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.135, 0.135, 0.11, 18), mat(V.ink));
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(x, 0.135, z);
    wheel.castShadow = true;
    van.add(wheel);
  });
  const vanShade = blob(2.1, 1.5);
  scene.add(vanShade, van);
  van.scale.setScalar(1.22);

  const nearestOnRoad = (point) => {
    let best = 0;
    let dist = Infinity;
    for (let i = 0; i <= 400; i++) {
      const d = road.getPointAt(i / 400).distanceToSquared(point);
      if (d < dist) { dist = d; best = i / 400; }
    }
    return best;
  };
  const fromU = nearestOnRoad(P(-3.0, 3.4));
  const toU = nearestOnRoad(P(4.1, -1.6));

  const parcels = B.parcels.map(() => {
    const p = box(0.3, 0.26, 0.3, V.color1, 0.05);
    p.visible = false;
    scene.add(p);
    return p;
  });

  // Camera.
  const margin = variant === "overlay" ? 60 : 44;
  const ppu = (W - margin) / (10 * R2 + 0.5);
  const centerY = variant === "full" ? 1085 : variant === "top" ? H * 0.615 : H * 0.57;
  const cam = new THREE.OrthographicCamera(-W / 2 / ppu, W / 2 / ppu, centerY / ppu, -(H - centerY) / ppu, -60, 80);
  const ELEV = (37 * Math.PI) / 180;
  function aim(t) {
    const settle = easeOut(seg(t, 0, K + 0.5), 3);
    const az = (45 + 3 - 6 * settle - 0.5 * Math.max(0, t - K - 0.5)) * (Math.PI / 180);
    cam.zoom = 1.07 - 0.07 * settle + Math.max(0, t - K - 0.5) * 0.006;
    const r = 30;
    cam.position.set(Math.sin(az) * Math.cos(ELEV) * r, Math.sin(ELEV) * r, Math.cos(az) * Math.cos(ELEV) * r);
    cam.lookAt(0, 0, 0);
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld();
  }
  const toScreen = (v) => {
    const p = v.clone().project(cam);
    return [((p.x + 1) / 2) * W, ((1 - p.y) / 2) * H];
  };

  // Text.
  const titleEl = $("title");
  const mask = $("title-mask");
  const titlePx = variant === "full" ? 98 : 62;
  titleEl.textContent = V.title;
  titleEl.style.fontSize = titlePx + "px";
  titleEl.style.color = V.ink;
  mask.style.top = (variant === "full" ? 410 : variant === "top" ? safe.top - 8 : 0) + "px";
  CA.fit(titleEl, W - safe.side * 2, 34);

  $("bg").style.background = `linear-gradient(180deg, ${V.bgTop}, ${V.bgBottom})`;
  $("grain").style.backgroundImage = CA.grainUrl(200, 1, 5);

  const checkSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4.6 4.6L19 7.4"/></svg>`;
  const pills = [1, 2, 3].map((n) => {
    const el = make("div", "pill", $("labels"));
    const chip = make("div", "pill-chip", el);
    chip.style.background = V.chip;
    const num = make("span", "", chip, String(n));
    const text = make("div", "pill-text", el);
    const name = make("div", "pill-name", text, V[`step${n}Name`]);
    name.style.color = V.ink;
    make("div", "pill-time", text, V[`step${n}Time`]);
    return { el, chip, num, w: el.offsetWidth, h: el.offsetHeight, name };
  });
  const finalCheck = make("span", "", pills[2].chip);
  finalCheck.innerHTML = checkSvg;
  finalCheck.style.cssText = "position:absolute;inset:0;display:flex;align-items:center;justify-content:center";

  const stageEl = $("stage");
  const seenCenter = (centerY / H) * 100;
  const diamond = (p) => {
    const r = 170 * p;
    return `polygon(50% ${seenCenter - r}%, ${50 + r}% ${seenCenter}%, 50% ${seenCenter + r}%, ${50 - r}% ${seenCenter}%)`;
  };

  function renderAt(time) {
    const t = design(time);
    aim(t);

    buildings.forEach((b, i) => {
      const t0 = B.buildings[i];
      const p = seg(t, t0, 0.42);
      let y;
      let sy = 1;
      b.g.visible = t >= t0;
      if (p < 0.5) y = -b.h + (b.h + 0.34) * easeOut(p / 0.5);
      else if (p < 0.72) y = 0.34 * (1 - Math.pow((p - 0.5) / 0.22, 2));
      else {
        y = 0;
        sy = 1 - 0.1 * Math.sin(((p - 0.72) / 0.28) * Math.PI);
      }
      b.g.position.y = y;
      b.g.scale.set(2 - sy, sy, 2 - sy);
      b.shade.material.opacity = seg(t, t0 + 0.12, 0.16);
    });

    const drawn = seg(t, B.dashStart, B.dashEnd - B.dashStart);
    dashes.forEach((d, i) => { d.visible = i / dashes.length < drawn; });

    // Van position, with the body rocking on its springs from speed changes, parcels and the final stop.
    const travel = (x) => inOut(seg(x, B.vanGo, B.vanStop - B.vanGo));
    const u = fromU + (toU - fromU) * travel(t);
    const point = road.getPointAt(u);
    const tan = road.getTangentAt(u);
    van.position.set(point.x, 0.03, point.z);
    van.rotation.y = Math.atan2(-tan.z, tan.x);
    vanShade.position.x = point.x;
    vanShade.position.z = point.z;
    const dt = 0.05;
    const accel = travel(t + dt) - 2 * travel(t) + travel(t - dt);
    let dip = 0;
    B.parcels.forEach((at) => { dip += ring(t, at + 0.34, 7, 24) * 0.05; });
    dip += ring(t, B.vanStop, 5, 20) * 0.05;
    vanBody.position.y = -Math.abs(dip);
    vanBody.rotation.z = -accel * 18 - ring(t, B.vanStop, 5, 20) * 0.1;

    // Parcels ride the belt, then hop in through the back of the van.
    const vanAt = road.getPointAt(fromU).clone().add(new THREE.Vector3(0, 0.5, 0));
    parcels.forEach((p, i) => {
      const at = B.parcels[i];
      const q = seg(t, at - 0.3, 0.3);
      const hop = seg(t, at, 0.34);
      p.visible = t >= at - 0.3 && hop < 1;
      if (!p.visible) return;
      if (hop <= 0) p.position.copy(beltStart.clone().lerp(beltEnd, q).setY(0.24));
      else {
        p.position.copy(beltEnd.clone().setY(0.24).lerp(vanAt, hop));
        p.position.y += Math.sin(hop * Math.PI) * 0.62;
        p.scale.setScalar(1 - 0.5 * hop * hop);
      }
    });

    // Labels stay pinned to their buildings as the camera drifts.
    pills.forEach((pill, i) => {
      const b = buildings[i];
      const p = seg(t, B.buildings[i] + B.labelLag + 0.24, 0.26);
      const [x, y] = toScreen(P(b.x, b.z, b.h + 0.3));
      const left = clamp(x - pill.w / 2, safe.side - 20, W - safe.side + 20 - pill.w);
      const s = p <= 0 ? 0 : backOut(p, 2);
      pill.el.style.visibility = p <= 0 ? "hidden" : "visible";
      pill.el.style.transform = `translate(${left.toFixed(2)}px, ${(y - pill.h).toFixed(2)}px) scale(${s.toFixed(4)})`;
    });

    // The key moment: the last number pops into a check.
    const last = pills[2];
    const done = seg(t, K, 0.22);
    const swapped = t >= K;
    last.num.style.visibility = swapped ? "hidden" : "visible";
    finalCheck.style.visibility = swapped ? "visible" : "hidden";
    last.chip.style.background = swapped ? V.check : V.chip;
    const pulse = swapped ? 0.72 + 0.28 * backOut(done, 3.4) : 1 - 0.14 * seg(t, K - 0.08, 0.08);
    last.chip.style.transform = `scale(${pulse.toFixed(4)})`;

    const titleP = easeOut(seg(t, 0, 0.3), 4);
    titleEl.style.transform = `translateY(${((1 - titleP) * 105).toFixed(2)}%)`;

    // Enter and leave as a diamond closing on the slab. Mid-video it needs footage behind it, so it only runs with alpha.
    if (T.exit > 0 || variant === "overlay") {
      const open = variant === "overlay" ? easeOut(seg(time, 0, 0.3), 3) : 1;
      const gone = T.exit > 0 ? seg(time, T.key + T.hold, T.exit) : 0;
      const a = open * (1 - gone * gone * gone);
      stageEl.style.clipPath = a >= 0.999 ? "none" : diamond(a);
    }

    renderer.render(scene, cam);
  }

  window.addEventListener("hf-seek", (e) => renderAt(e.detail.time));
  renderAt(window.__hfThreeTime || 0);
  window.__timelines["block"] = gsap.timeline({ paused: true }); // HyperFrames' lint expects one; the scene runs from hf-seek
});
