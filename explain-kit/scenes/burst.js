// Burst: an object heats, swells and cracks, then shatters into glowing shards with sparks and a
// shockwave, and the pieces hang in slow motion. For failure, wear and destruction beats.

// Voronoi cells inside a rectangle, by clipping the rectangle with each bisector. Fine for ~40 seeds.
function voronoi(w, d, seeds) {
  const clip = (poly, nx, nz, c) => {
    const out = [];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i];
      const b = poly[(i + 1) % poly.length];
      const da = a[0] * nx + a[1] * nz - c;
      const db = b[0] * nx + b[1] * nz - c;
      if (da <= 0) out.push(a);
      if ((da <= 0) !== (db <= 0)) {
        const k = da / (da - db);
        out.push([a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]);
      }
    }
    return out;
  };
  return seeds.map((s, i) => {
    let poly = [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]];
    seeds.forEach((o, j) => {
      if (i === j || poly.length < 3) return;
      const nx = o[0] - s[0];
      const nz = o[1] - s[1];
      const mx = (o[0] + s[0]) / 2;
      const mz = (o[1] + s[1]) / 2;
      poly = clip(poly, nx, nz, mx * nx + mz * nz);
    });
    return poly;
  });
}

export default function burst(kit, params, info) {
  const { THREE, theme, M } = kit;
  const scene = new THREE.Scene();
  const rng = kit.rng(4);
  const bg = kit.backdrop(scene, theme, { haze: 1.3, centre: [0.5, 0.4] });
  const fl = kit.floor(scene, theme, { radius: 12, contact: 2.6 });
  const rig = kit.lights(scene, theme, { rim: 3 });

  const objName = params.object ?? "battery";
  const obj = kit.makeObject(objName, params.options ?? {});
  const slab = obj.userData.slab ?? { w: 2.6, h: 0.3, d: 1.7, material: M.foil };
  const lift = 0.35;
  obj.position.y = lift;
  scene.add(obj);
  // A low plinth so the shards have somewhere to fall from.
  const beat = params.beatAt ?? info.duration * 0.55;
  const heatOn = params.heat !== false;

  // Shards: the same slab, cut into Voronoi cells.
  const seeds = [];
  for (let i = 0; i < (params.pieces ?? 26); i++) {
    const r = Math.sqrt(rng());
    const a = rng() * Math.PI * 2;
    seeds.push([Math.cos(a) * r * slab.w * 0.52, Math.sin(a) * r * slab.d * 0.52]);
  }
  const cells = voronoi(slab.w, slab.d, seeds).filter((p) => p.length >= 3);
  const shardMat = slab.material.clone();
  shardMat.emissive = new THREE.Color(0, 0, 0);
  const innerMat = new THREE.MeshStandardMaterial({ color: "#14100e", roughness: 0.6, metalness: 0.3, emissive: new THREE.Color("#ff6a1a"), emissiveIntensity: 3 });
  const shards = cells.map((poly) => {
    let cx = 0;
    let cz = 0;
    poly.forEach(([x, z]) => {
      cx += x;
      cz += z;
    });
    cx /= poly.length;
    cz /= poly.length;
    const shape = new THREE.Shape(poly.map(([x, z]) => new THREE.Vector2(x - cx, -(z - cz))));
    const geo = new THREE.ExtrudeGeometry(shape, { depth: slab.h, bevelEnabled: false });
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, -slab.h / 2, 0);
    // Groups from ExtrudeGeometry: 0 = caps, 1 = sides. The broken sides glow.
    const mesh = new THREE.Mesh(geo, [shardMat, innerMat]);
    mesh.castShadow = true;
    const dist = Math.hypot(cx / slab.w, cz / slab.d);
    const out = new THREE.Vector3(cx, 0, cz).normalize();
    if (!Number.isFinite(out.x)) out.set(rng() - 0.5, 0, rng() - 0.5).normalize();
    const speed = 3 + rng() * 3.6 + (1 - dist) * 1.5;
    const shard = {
      mesh,
      home: new THREE.Vector3(cx, lift + slab.h / 2, cz),
      vel: new THREE.Vector3(out.x * speed, 3 + rng() * 4, out.z * speed * 0.7 + 0.8),
      axis: new THREE.Vector3(rng() - 0.5, rng() - 0.5, rng() - 0.5).normalize(),
      spin: (rng() - 0.5) * 9,
    };
    mesh.visible = false;
    scene.add(mesh);
    return shard;
  });

  // Cracks along the cell edges, drawn on the top face before it breaks.
  const crackPts = [];
  cells.forEach((poly) => {
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i];
      const b = poly[(i + 1) % poly.length];
      const onEdge = (p) => Math.abs(Math.abs(p[0]) - slab.w / 2) < 1e-4 || Math.abs(Math.abs(p[1]) - slab.d / 2) < 1e-4;
      if (onEdge(a) && onEdge(b)) continue;
      crackPts.push(a[0], 0, a[1], b[0], 0, b[1]);
    }
  });
  const crackGeo = new THREE.BufferGeometry();
  crackGeo.setAttribute("position", new THREE.Float32BufferAttribute(crackPts, 3));
  const crackMat = new THREE.LineBasicMaterial({ color: new THREE.Color("#ff7a2a"), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  const cracks = new THREE.LineSegments(crackGeo, crackMat);
  cracks.position.y = lift + (obj.userData.size?.y ?? slab.h) + 0.006;
  scene.add(cracks);

  // Sparks with short trails.
  const SPARKS = 220;
  const TR = 3;
  const sparks = kit.glowPoints(SPARKS * TR, { color: "#ffb36b", size: 0.07, intensity: 9 });
  scene.add(sparks);
  const sp = Array.from({ length: SPARKS }, () => {
    const a = rng() * Math.PI * 2;
    const up = rng();
    const s = 4 + rng() * 9;
    return { v: new THREE.Vector3(Math.cos(a) * s * (1 - up * 0.5), 2 + up * s * 0.8, Math.sin(a) * s * 0.7 + 1.0), life: 0.5 + rng() * 1.1, delay: rng() * 0.08 };
  });
  const shock = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.0, 96), new THREE.MeshBasicMaterial({ color: kit.accent.clone(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  shock.rotation.x = -Math.PI / 2;
  shock.position.y = 0.02;
  scene.add(shock);
  const flashLight = new THREE.PointLight(new THREE.Color("#ff8a3a"), 0, 12, 1.6);
  flashLight.position.set(0, lift + 0.6, 0);
  scene.add(flashLight);

  for (const l of params.labels ?? []) {
    kit.label({ text: l.text, anchor: obj, offset: l.offset ? new THREE.Vector3(...l.offset) : new THREE.Vector3(slab.w * 0.3, 0.3, slab.d * 0.3), side: l.side ?? "right", at: l.at ?? 0.4, dy: l.dy ?? -80 });
  }

  const parts = obj.userData.parts ?? {};
  const heatColor = new THREE.Color("#ff5a10");
  const hot = new THREE.Color("#ffc070");
  const dust = kit.motes(scene, rng, { spread: 6, height: 5, count: 60 });
  const cam = kit.camera({ fov: 30, centerY: 1170 });
  const target = new THREE.Vector3(0, lift + 0.4, 0);
  const hfov = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2) * cam.aspect);
  const fit = ((slab.w * 0.62) / Math.tan(hfov / 2)) * 0.98;
  const q = new THREE.Quaternion();
  const shake = kit.rng(44);
  const shakeTable = Array.from({ length: 64 }, () => [shake() - 0.5, shake() - 0.5]);

  function update(t) {
    const h = t - beat;
    const after = h >= 0;
    // Slow motion after the first instant of the burst.
    const tau = !after ? 0 : h < 0.12 ? h : 0.12 + (h - 0.12) * 0.42;
    const pre = kit.clamp(t / beat);
    const heat = heatOn ? Math.pow(pre, 1.6) : 0;
    obj.visible = !after;
    cracks.visible = !after && heat > 0.35;
    if (!after) {
      // It swells and trembles as it heats.
      const swell = 1 + 0.32 * Math.pow(pre, 2.2);
      obj.scale.set(1 + 0.03 * pre, swell, 1 + 0.03 * pre);
      const tremble = Math.pow(pre, 3) * 0.012;
      obj.position.x = Math.sin(t * 61) * tremble;
      obj.position.z = Math.cos(t * 47) * tremble;
      if (parts.foil) parts.foil.emissive.copy(heatColor).multiplyScalar(heat * 0.32);
      if (parts.body?.material?.emissive && !parts.foil) parts.body.material.emissive.copy(heatColor).multiplyScalar(heat * 0.4);
      crackMat.color.copy(heatColor).multiplyScalar(kit.clamp((heat - 0.35) / 0.5) * 8 * (0.8 + 0.2 * Math.sin(t * 30)));
      cracks.scale.set(1, 1, 1);
      cracks.position.y = lift + (obj.userData.size?.y ?? slab.h) * swell + 0.006;
    }
    for (const s of shards) {
      s.mesh.visible = after;
      if (!after) continue;
      const p = s.home.clone().addScaledVector(s.vel, tau);
      p.y += -0.5 * 7.5 * tau * tau;
      if (p.y < slab.h / 2) p.y = slab.h / 2;
      s.mesh.position.copy(p);
      q.setFromAxisAngle(s.axis, s.spin * tau);
      s.mesh.quaternion.copy(q);
      s.mesh.scale.set(1, 0.75, 1);
    }
    innerMat.emissiveIntensity = after ? 0.05 + 5.5 * Math.exp(-h * 2.4) : 2;
    innerMat.emissive.set("#ff3a0a").lerp(hot, after ? Math.exp(-h * 3) : 1);
    shardMat.emissive.copy(heatColor).multiplyScalar(after ? 0.18 * Math.exp(-h * 2) : 0);
    // Sparks.
    const pos = sparks.geometry.attributes.position;
    const g = sparks.geometry.attributes.aGlow;
    sp.forEach((s, i) => {
      for (let k = 0; k < TR; k++) {
        const idx = i * TR + k;
        const a = h - s.delay - k * 0.007;
        if (a < 0 || a > s.life) {
          g.setX(idx, 0);
          pos.setXYZ(idx, 0, -10, 0);
          continue;
        }
        const st = a < 0.1 ? a : 0.1 + (a - 0.1) * 0.45;
        pos.setXYZ(idx, s.v.x * st, lift + 0.3 + s.v.y * st - 0.5 * 9 * st * st, s.v.z * st);
        g.setX(idx, (1 - a / s.life) * (k === 0 ? 1 : 0.45));
      }
    });
    pos.needsUpdate = true;
    g.needsUpdate = true;
    sparks.material.uniforms.uScale.value = kit.pointScale(cam);
    shock.visible = after && h < 0.9;
    if (shock.visible) {
      const r = kit.easeOut(kit.clamp(h / 0.9), 2.4);
      shock.scale.setScalar(0.3 + r * 6.5);
      shock.material.color.copy(kit.accent).multiplyScalar(5 * Math.pow(1 - r, 2));
    }
    flashLight.intensity = after ? 45 * Math.exp(-h * 6) : heat * 1.5;
    bg.uniforms.uFlash.value = after ? 0.2 * Math.exp(-h * 5) : heat * 0.03;
    if (fl.shadow) fl.shadow.material.opacity = after ? 0.75 * kit.clamp(1 - h * 2) : 0.75;
    rig.key.intensity = 2.4;
    // Camera: a slow push, a kick on the burst and a fading shake.
    const p = kit.clamp(t / (info.duration + 0.4));
    const yaw = THREE.MathUtils.degToRad(-26 + 10 * kit.easeInOut(p));
    const el = THREE.MathUtils.degToRad(26);
    const kick = after ? Math.exp(-h * 3) : 0;
    const dist = fit * (1.32 - 0.14 * kit.easeInOut(kit.clamp(t / beat)) + 0.3 * (after ? kit.easeOut(kit.clamp(h / 1.2), 2) : 0));
    const fi = Math.floor((t * 30) % 64);
    const amp = (after ? 0.09 * Math.exp(-h * 4) : Math.pow(pre, 4) * 0.02) * fit * 0.2;
    cam.position.set(Math.sin(yaw) * Math.cos(el) * dist + shakeTable[fi][0] * amp, target.y + Math.sin(el) * dist + shakeTable[fi][1] * amp, Math.cos(yaw) * Math.cos(el) * dist);
    cam.lookAt(target.x, target.y + kick * 0.15, target.z);
    dust.points.material.uniforms.uScale.value = kit.pointScale(cam);
    dust.update(t);
  }

  return { scene, camera: cam, update };
}
