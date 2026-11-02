// Big number: one stat that lands. Chrome 3D digits slam in at their true value on the word and
// punch; they never count up. A glowing arc gauge fills for a percentage, and a short line sits under it.
export default function number(kit, params, info) {
  const { THREE, theme, M } = kit;
  const scene = new THREE.Scene();
  const rng = kit.rng(7);
  const bg = kit.backdrop(scene, theme, { haze: 1.5, centre: [0.5, 0.45] });
  kit.floor(scene, theme, { radius: 12, contact: 0 });
  kit.lights(scene, theme, { rim: 3.2, key: 2.2 });

  const value = String(params.value ?? "80%");
  const parse = (v) => {
    const m = String(v).match(/^([^\d-]*)(-?[\d,]*\.?\d+)(.*)$/);
    if (!m) return null;
    const raw = m[2];
    const dot = raw.indexOf(".");
    return { pre: m[1], n: Number(raw.replace(/,/g, "")), post: m[3], dec: dot < 0 ? 0 : raw.length - dot - 1, commas: raw.includes(",") };
  };
  const target = parse(value);
  const landAt = params.landAt ?? Math.min(info.duration * 0.5, 1.6);
  const isPct = target && /%/.test(target.post);
  const gauge = params.gauge ?? isPct;

  const front = new THREE.MeshPhysicalMaterial({ color: "#e9ecf1", metalness: 1, roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.08 });
  const side = new THREE.MeshStandardMaterial({ color: "#2a2d33", metalness: 1, roughness: 0.3, emissive: kit.accent.clone(), emissiveIntensity: 0.55 });
  const cache = new Map();
  const size = params.size ?? 1.5;
  function geometryFor(text) {
    if (cache.has(text)) return cache.get(text);
    const geo = new kit.TextGeometry(text, {
      font: kit.font,
      size,
      depth: size * 0.28,
      curveSegments: 10,
      bevelEnabled: true,
      bevelThickness: size * 0.03,
      bevelSize: size * 0.022,
      bevelSegments: 4,
    });
    geo.computeBoundingBox();
    const b = geo.boundingBox;
    geo.translate(-(b.max.x + b.min.x) / 2, 0, -(b.max.z + b.min.z) / 2);
    cache.set(text, geo);
    return geo;
  }
  const digits = new THREE.Mesh(geometryFor(value), [front, side]);
  digits.castShadow = true;
  const holder = new THREE.Group();
  holder.position.y = 1.2;
  holder.add(digits);
  scene.add(holder);
  const widest = (() => {
    geometryFor(value).computeBoundingBox();
    const b = geometryFor(value).boundingBox;
    return b.max.x - b.min.x;
  })();
  // Fit the digits to the frame width.
  const fitScale = Math.min(1, (widest > 3.6 ? 2.6 : 2.9) / widest);
  holder.scale.setScalar(fitScale);

  // Arc gauge behind the number.
  let arcFill = null;
  let arcTrack = null;
  const arcR = Math.max(1.6, (widest * fitScale) / 2 + 0.15);
  if (gauge) {
    arcTrack = new THREE.Mesh(new THREE.TorusGeometry(arcR, 0.035, 12, 220, Math.PI * 1.5), new THREE.MeshStandardMaterial({ color: "#3a3d44", metalness: 0.8, roughness: 0.4 }));
    arcTrack.rotation.z = -Math.PI * 0.25;
    arcTrack.position.set(0, 1.2 + size * 0.36 * fitScale, -0.6);
    scene.add(arcTrack);
    arcFill = new THREE.Mesh(new THREE.TorusGeometry(arcR, 0.05, 12, 220, 0.001), M.glow(3.5));
    arcFill.position.copy(arcTrack.position);
    scene.add(arcFill);
  }
  const arcCache = new Map();
  const arcGeo = (f) => {
    const k = Math.round(f * 400);
    if (!arcCache.has(k)) arcCache.set(k, new THREE.TorusGeometry(arcR, 0.06, 12, 220, Math.max(0.001, Math.PI * 1.5 * (k / 400))));
    return arcCache.get(k);
  };

  // The line under it.
  const line = document.createElement("div");
  line.className = "ex-stat-line";
  line.style.fontSize = "54px";
  line.style.color = theme.ink;
  line.textContent = params.label ?? "";
  kit.layer.appendChild(line);

  const sparks = kit.glowPoints(60, { color: "#ffc48a", size: 0.06, intensity: 7 });
  scene.add(sparks);
  const sp = Array.from({ length: 60 }, () => {
    const a = rng() * Math.PI * 2;
    const s = 2 + rng() * 5;
    return { v: new THREE.Vector3(Math.cos(a) * s, Math.sin(a) * s * 0.8 + 1, (rng() - 0.3) * 2), life: 0.5 + rng() * 0.8 };
  });

  const dust = kit.motes(scene, rng, { spread: 6, height: 5, count: 80 });
  const cam = kit.camera({ fov: 30, centerY: 1190 });
  const look = new THREE.Vector3(0, 1.2 + size * 0.4 * fitScale, 0);
  const v = new THREE.Vector3();

  // The number never counts: a viewer who pauses must never read a wrong value. It is hidden until
  // a quick slam-in that is always the true value, then punches on its word. The gauge fills first.
  const SLAM = 0.22;
  function update(t) {
    const h = t - landAt;
    const c = kit.easeInOut(kit.clamp((t - (landAt - 0.7)) / 0.7));
    holder.visible = h >= -SLAM;
    const slam = kit.easeIn(kit.clamp((h + SLAM) / SLAM), 2);
    const punch = h >= 0 ? 1 + 0.08 * Math.exp(-h * 7) * Math.cos(h * 26) : 1.3 - 0.3 * slam;
    holder.scale.setScalar(fitScale * punch);
    holder.rotation.y = Math.sin(t * 0.6) * 0.12 - 0.1 + 0.1 * kit.easeOut(kit.clamp(t / info.duration), 2);
    side.emissiveIntensity = 0.5 + (h >= 0 ? 2.2 * Math.exp(-h * 3) : 1.5 * slam);
    if (arcFill) {
      const full = target ? kit.clamp(target.n / 100) : 1;
      arcFill.geometry = arcGeo(full * c);
      arcFill.material.color.copy(kit.accent).multiplyScalar(3.2 + (h >= 0 ? 5 * Math.exp(-h * 4) : 0));
      // Mirrored, so it fills clockwise from the lower left.
      arcFill.rotation.set(0, Math.PI, -Math.PI * 0.25);
    }
    bg.uniforms.uFlash.value = h >= 0 ? 0.25 * Math.exp(-h * 3.5) : 0;
    const pos = sparks.geometry.attributes.position;
    const g = sparks.geometry.attributes.aGlow;
    sp.forEach((s, i) => {
      const a = h;
      if (a < 0 || a > s.life) {
        g.setX(i, 0);
        pos.setXYZ(i, 0, -10, 0);
        return;
      }
      const st = a < 0.08 ? a : 0.08 + (a - 0.08) * 0.4;
      pos.setXYZ(i, s.v.x * st * 1.4, look.y + s.v.y * st - 4 * st * st, -0.9 + s.v.z * st * 0.3);
      g.setX(i, 1 - a / s.life);
    });
    pos.needsUpdate = true;
    g.needsUpdate = true;
    sparks.material.uniforms.uScale.value = kit.pointScale(cam);
    const p = kit.clamp(t / (info.duration + 0.4));
    const yaw = THREE.MathUtils.degToRad(-8 + 10 * kit.easeInOut(p));
    const dist = 13.5 - 1.6 * kit.easeOut(p, 2) - (h >= 0 ? 0.3 * Math.exp(-h * 5) : 0);
    cam.position.set(Math.sin(yaw) * dist, look.y + 1.2, Math.cos(yaw) * dist);
    cam.lookAt(look);
    dust.points.material.uniforms.uScale.value = kit.pointScale(cam);
    dust.update(t);
  }

  function overlay(t) {
    scene.updateMatrixWorld(true);
    cam.updateMatrixWorld();
    v.set(0, 0.95, 0).project(cam);
    const y = (-v.y * 0.5 + 0.5) * kit.H;
    line.style.top = `${(y + 20).toFixed(1)}px`;
    const s = kit.clamp((t - landAt - 0.1) / 0.4);
    line.style.opacity = String(kit.easeOut(s, 2));
    line.style.transform = `translateY(${((1 - kit.easeOut(s, 3)) * 20).toFixed(1)}px)`;
  }

  return { scene, camera: cam, update, overlay };
}
