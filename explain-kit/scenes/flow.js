// Flow: glowing particles travel between two or three labelled parts. Ions between electrodes,
// electrons round a circuit, data between chips, sound from a microphone to a speaker.
function patternTexture(THREE, kind, base, line) {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d");
  g.fillStyle = base;
  g.fillRect(0, 0, 256, 256);
  g.fillStyle = line;
  g.strokeStyle = line;
  if (kind === "layers") {
    for (let y = 6; y < 256; y += 14) {
      g.globalAlpha = 0.45;
      g.fillRect(0, y, 256, 5);
    }
  } else if (kind === "dots") {
    g.globalAlpha = 0.55;
    for (let y = 8; y < 256; y += 21) {
      for (let x = (y / 21) % 2 ? 18 : 8; x < 256; x += 21) {
        g.beginPath();
        g.arc(x, y, 5.5, 0, Math.PI * 2);
        g.fill();
      }
    }
  } else if (kind === "mesh") {
    g.globalAlpha = 0.5;
    g.lineWidth = 3;
    for (let i = 0; i < 256; i += 16) {
      g.beginPath();
      g.moveTo(i, 0);
      g.lineTo(i, 256);
      g.moveTo(0, i);
      g.lineTo(256, i);
      g.stroke();
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

export default function flow(kit, params, info) {
  const { THREE, theme, M } = kit;
  const scene = new THREE.Scene();
  const rng = kit.rng(2);
  kit.backdrop(scene, theme, { haze: 1.2, centre: [0.5, 0.4] });
  kit.floor(scene, theme, { radius: 12, contact: 3.4 });
  const rig = kit.lights(scene, theme, { rim: 3 });
  void rig;

  const nodesIn = (params.nodes ?? [{ label: "A", object: "electrode" }, { label: "B", object: "electrode" }]).slice(0, 3);
  const n = nodesIn.length;
  const spacing = n === 2 ? 3.3 : 2.45;
  const xs = nodesIn.map((_, i) => (i - (n - 1) / 2) * spacing);
  const pColor = new THREE.Color(params.particle?.color ?? theme.accent);

  const nodes = nodesIn.map((nd, i) => {
    const g = new THREE.Group();
    g.position.set(xs[i], 0, n === 3 ? (1 - i) * 1.3 : 0);
    let top = 1.6;
    if (!nd.object || nd.object === "electrode") {
      const tint = nd.color ?? (i === 0 ? "#3e5f86" : "#2b2e35");
      const pattern = nd.pattern ?? (i === 0 ? "dots" : "layers");
      const tex = patternTexture(THREE, pattern, tint, i === 0 ? "#9cc4ff" : "#6f7685");
      tex.repeat.set(1, 1.6);
      const slab = new THREE.Mesh(
        new kit.RoundedBox(0.62, 3.0, 2.3, 4, 0.05),
        new THREE.MeshPhysicalMaterial({ color: "#ffffff", map: tex, metalness: 0.55, roughness: 0.42, clearcoat: 0.5 }),
      );
      slab.position.y = 1.55;
      slab.castShadow = slab.receiveShadow = true;
      g.add(slab);
      // Metal foil on the outer face.
      const foil = new THREE.Mesh(new kit.RoundedBox(0.08, 3.08, 2.36, 2, 0.03), i === 0 ? M.aluminium : M.copper);
      foil.position.set(i === 0 ? -0.36 : 0.36, 1.55, 0);
      foil.castShadow = true;
      g.add(foil);
      const edge = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.025, 2.32), M.glow(3.5, pColor));
      edge.position.y = 3.06;
      g.add(edge);
      top = 3.1;
      g.userData.slab = slab;
      g.userData.face = new THREE.Vector3(i === 0 ? 0.31 : -0.31, 1.55, 0);
    } else {
      const obj = kit.makeObject(nd.object, nd.options ?? {});
      const size = obj.userData.size ?? new THREE.Vector3(2, 2, 2);
      const s = (n === 3 ? 2.05 : 2.3) / Math.max(size.x, size.y, size.z);
      obj.scale.setScalar(s);
      // Flat parts tip up towards the camera so they read.
      if (nd.object === "speaker" || nd.object === "chip") {
        obj.rotation.x = nd.object === "speaker" ? 1.1 : 0.5;
        obj.position.y = size.x * s * 0.5;
      }
      g.add(obj);
      top = Math.max(size.y * s, obj.position.y + size.x * s * 0.4);
      g.userData.face = new THREE.Vector3(0, top * 0.55, 0);
    }
    g.userData.top = top;
    scene.add(g);
    return g;
  });

  // An optional separator between two parts, like the membrane in a battery.
  if (params.separator) {
    const tex = patternTexture(THREE, "mesh", "#cfd3d9", "#ffffff");
    tex.repeat.set(3, 4);
    const sep = new THREE.Mesh(
      new THREE.PlaneGeometry(2.3, 3.0),
      new THREE.MeshStandardMaterial({ color: "#d8dde4", map: tex, transparent: true, opacity: 0.32, side: THREE.DoubleSide, roughness: 0.6, depthWrite: false }),
    );
    sep.rotation.y = Math.PI / 2;
    sep.position.set((xs[0] + xs[n - 1]) / 2, 1.55, 0);
    scene.add(sep);
    if (params.separator.label) {
      kit.label({ text: params.separator.label, anchor: sep, offset: new THREE.Vector3(0, -1.2, 0.9), side: "right", at: params.separator.at ?? 1.0, dy: 120 });
    }
  }

  // Particles: each one rides the path at its own phase and lane, with a short trail.
  const count = Math.min(90, params.particle?.count ?? 46);
  const TRAIL = 5;
  const pts = kit.glowPoints(count * TRAIL, { color: params.particle?.color ?? theme.accent, size: 0.15, intensity: 6 });
  scene.add(pts);
  const lanes = Array.from({ length: count }, () => ({
    phase: rng(),
    y: (rng() - 0.5) * 2.2,
    z: (rng() - 0.5) * 1.8,
    lift: 0.5 + rng() * 0.9,
    speed: 0.85 + rng() * 0.3,
  }));
  const ends = nodes.map((g) => g.position.clone().add(g.userData.face));
  const arc = params.path !== "straight";
  const tmp = new THREE.Vector3();
  function along(u, lane) {
    const seg = Math.min(n - 2, Math.floor(u * (n - 1)));
    const f = u * (n - 1) - seg;
    const a = ends[seg];
    const b = ends[seg + 1];
    tmp.lerpVectors(a, b, f);
    tmp.y += lane.y * 0.5 + (arc ? Math.sin(Math.PI * f) * lane.lift : 0);
    tmp.z += lane.z;
    return tmp;
  }

  const dir = params.direction ?? "forth";
  const turnAt = params.reverseAt ?? info.duration * 0.5;
  const speed = params.speed ?? 0.42;
  function travel(t) {
    if (dir === "back") return -t * speed;
    if (dir === "both") return t < turnAt ? t * speed : turnAt * speed - (t - turnAt) * speed;
    return t * speed;
  }

  // Labels.
  nodesIn.forEach((nd, i) => {
    if (!nd.label) return;
    const side = nd.side ?? (i < (n - 1) / 2 ? "left" : i > (n - 1) / 2 ? "right" : "right");
    kit.label({
      text: nd.label,
      anchor: nodes[i],
      offset: new THREE.Vector3(0, nodes[i].userData.top + 0.05, 0),
      side,
      at: nd.at ?? 0.35 + i * 0.35,
      dy: nd.dy ?? -130,
    });
  });
  if (params.particle?.label) {
    const probe = new THREE.Object3D();
    scene.add(probe);
    kit.label({ text: params.particle.label, anchor: probe, side: params.particle.side ?? "left", at: params.particle.at ?? 0.9, dy: 230, accentText: true });
    nodes.probe = probe;
  }

  const dust = kit.motes(scene, rng, { spread: 6, height: 5, count: 70 });
  const cam = kit.camera({ fov: params.fov ?? 30 });
  const target = new THREE.Vector3(0, 1.45, 0);
  const width = (n - 1) * spacing + 2.2;
  const hfov = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2) * cam.aspect);
  const fit = (width / 2 / Math.tan(hfov / 2)) * (n === 3 ? 0.98 : 1.08);
  const pos = pts.geometry.attributes.position;
  const glow = pts.geometry.attributes.aGlow;
  const size = pts.geometry.attributes.aSize;

  function update(t) {
    const p = kit.clamp(t / (info.duration + 0.5));
    const yaw = THREE.MathUtils.degToRad((params.angle ?? -22) + (params.turn ?? 12) * kit.easeInOut(p));
    const dist = fit * (1.12 - 0.12 * kit.easeOut(p, 2));
    const el = THREE.MathUtils.degToRad(params.elevation ?? 16);
    cam.position.set(Math.sin(yaw) * Math.cos(el) * dist, target.y + Math.sin(el) * dist, Math.cos(yaw) * Math.cos(el) * dist);
    cam.lookAt(target);
    const f = travel(t);
    const ramp = kit.clamp(t / 0.5);
    lanes.forEach((lane, i) => {
      for (let k = 0; k < TRAIL; k++) {
        const back = (dir === "back" || (dir === "both" && t >= turnAt) ? -1 : 1) * k * 0.022;
        let u = (f * lane.speed + lane.phase - back) % 1;
        if (u < 0) u += 1;
        const pt = along(u, lane);
        const idx = i * TRAIL + k;
        pos.setXYZ(idx, pt.x, pt.y, pt.z);
        const edge = Math.sin(Math.PI * u);
        glow.setX(idx, ramp * Math.pow(edge, 0.6) * (k === 0 ? 1 : 0.5 * (1 - k / TRAIL)));
        size.setX(idx, k === 0 ? 1 : 0.8 - k * 0.1);
      }
    });
    pos.needsUpdate = true;
    glow.needsUpdate = true;
    size.needsUpdate = true;
    pts.material.uniforms.uScale.value = kit.pointScale(cam);
    if (nodes.probe) {
      const lane = { y: 0, z: 0, lift: 1.05 };
      nodes.probe.position.copy(along(0.5, lane));
    }
    dust.points.material.uniforms.uScale.value = kit.pointScale(cam);
    dust.update(t);
  }

  return { scene, camera: cam, update };
}
