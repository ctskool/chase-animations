// Scan: a face measured in 3D. Infrared dots spray across it, the depth map lifts from flat into
// relief, a stored map slides in and matches, and a padlock opens. "show" picks the stages:
// any of "dots", "depth", "match", "unlock", each timed by dotsAt, depthAt, matchAt, unlockAt.

// The face as a height field: u across (-1..1), v up (-1.3..1.3). Returns depth, 0 outside.
function faceDepth(u, v) {
  const e = (u / 0.82) ** 2 + (v / 1.15) ** 2;
  if (e >= 1) return { z: 0, e };
  const g = (x, y, sx, sy) => Math.exp(-((x * x) / sx + (y * y) / sy));
  const au = Math.abs(u);
  let z = 0.55 * Math.sqrt(1 - e);
  const fade = Math.min(1, Math.max(0, (1 - e) / 0.25));
  let f = 0;
  const bridge = Math.min(1, Math.max(0, (0.36 - v) / 0.5));
  f += 0.26 * Math.exp(-((u / 0.1) ** 2)) * bridge * (v > -0.24 ? 1 : Math.exp(-(((v + 0.24) / 0.06) ** 2)));
  f += 0.08 * g(u, v + 0.22, 0.012, 0.012);
  f += 0.045 * g(au - 0.1, v + 0.27, 0.005, 0.004);
  f -= 0.13 * g(au - 0.33, v - 0.18, 0.02, 0.008);
  f += 0.045 * g(au - 0.33, v - 0.18, 0.006, 0.004);
  f += 0.07 * g(au - 0.33, v - 0.34, 0.04, 0.004);
  f += 0.06 * g(au - 0.46, v + 0.05, 0.03, 0.02);
  f += 0.05 * g(u, v + 0.52, 0.03, 0.002);
  f += 0.05 * g(u, v + 0.62, 0.025, 0.002);
  f -= 0.03 * g(u, v + 0.575, 0.04, 0.0005);
  f += 0.06 * g(u, v + 0.92, 0.04, 0.015);
  z += f * fade;
  return { z, e };
}

export default function scan(kit, params, info) {
  const { THREE, theme, M } = kit;
  const scene = new THREE.Scene();
  const rng = kit.rng(14);
  kit.backdrop(scene, theme, { haze: 1.4, centre: [0.5, 0.45] });
  kit.floor(scene, theme, { radius: 12, contact: 0 });
  kit.lights(scene, theme, { rim: 2 });

  const show = new Set([].concat(params.show ?? ["dots", "depth"]));
  const dotsAt = params.dotsAt ?? 0.15;
  const depthAt = params.depthAt ?? (show.has("depth") ? info.duration * 0.4 : 99);
  const matchAt = params.matchAt ?? (show.has("match") ? info.duration * 0.3 : 99);
  const unlockAt = params.unlockAt ?? (show.has("unlock") ? info.duration * 0.65 : 99);
  // If a scene starts after the depth stage, the relief is already up.
  const liftedFrom = show.has("depth") ? depthAt : show.has("dots") ? 99 : -1;
  const S = 1.0;
  const cy = 2.0;
  const face = new THREE.Group();
  face.position.y = cy;
  scene.add(face);

  // Depth mesh.
  const NU = 120;
  const NV = 160;
  const pos = [];
  const uv = [];
  const idx = [];
  const inside = [];
  for (let j = 0; j <= NV; j++) {
    for (let i = 0; i <= NU; i++) {
      const u = -1 + (2 * i) / NU;
      const v = -1.3 + (2.6 * j) / NV;
      const { z, e } = faceDepth(u, v);
      pos.push(u * S, v * S, z * S);
      uv.push(u, v);
      inside.push(e < 1);
    }
  }
  const at = (i, j) => j * (NU + 1) + i;
  for (let j = 0; j < NV; j++) {
    for (let i = 0; i < NU; i++) {
      const a = at(i, j), b = at(i + 1, j), c = at(i + 1, j + 1), d = at(i, j + 1);
      if (inside[a] && inside[b] && inside[c] && inside[d]) idx.push(a, b, c, a, c, d);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("aUv", new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const depthUniforms = { uLift: { value: 0 }, uOpacity: { value: 0 }, uTint: { value: new THREE.Color(params.color ?? "#4fc3ff") }, uMatch: { value: 0 }, uSweep: { value: -2 } };
  const depthMat = new THREE.ShaderMaterial({
    uniforms: depthUniforms,
    vertexShader: `attribute vec2 aUv; uniform float uLift; varying vec2 vUv; varying float vZ; varying vec3 vN; varying vec3 vV;
      void main(){ vUv = aUv; vec3 p = position; vZ = p.z; p.z *= uLift; vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float uOpacity, uMatch, uSweep; uniform vec3 uTint; varying vec2 vUv; varying float vZ; varying vec3 vN; varying vec3 vV;
      float line(float x, float w){ float d = abs(fract(x) - 0.5); float fw = fwidth(x); return 1.0 - smoothstep(0.5 - w - fw, 0.5 - w, d); }
      void main(){
        float e = (vUv.x / 0.82) * (vUv.x / 0.82) + (vUv.y / 1.15) * (vUv.y / 1.15);
        float edge = 1.0 - smoothstep(0.78, 0.97, e);
        float depth = clamp(vZ / 0.8, 0.0, 1.0);
        vec3 cold = vec3(0.05, 0.12, 0.45), mid = uTint, hot = vec3(1.0, 0.85, 0.55);
        vec3 c = depth < 0.6 ? mix(cold, mid, depth / 0.6) : mix(mid, hot, (depth - 0.6) / 0.4);
        float contour = line(vZ * 26.0, 0.42);
        float grid = max(line(vUv.x * 22.0, 0.46), line(vUv.y * 22.0, 0.46));
        float rim = pow(1.0 - clamp(abs(dot(normalize(vN), normalize(vV))), 0.0, 1.0), 2.0);
        vec3 green = vec3(0.3, 1.0, 0.5);
        c = mix(c, green * (0.4 + depth), uMatch * 0.85);
        float sweep = exp(-pow((vUv.y - uSweep) * 9.0, 2.0));
        vec3 col = c * (0.18 + 0.9 * contour + 0.55 * grid) + c * rim * 0.8 + green * sweep * 1.4 * uMatch;
        gl_FragColor = vec4(col * uOpacity * 1.6 * edge, 1.0);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  depthMat.extensions = { derivatives: true };
  const depthMesh = new THREE.Mesh(geo, depthMat);
  face.add(depthMesh);

  // The stored map: the same face as a wireframe that slides in to compare.
  const iso = [];
  const pushSeg = (a, b) => {
    if (inside[a] && inside[b]) iso.push(pos[a * 3], pos[a * 3 + 1], pos[a * 3 + 2], pos[b * 3], pos[b * 3 + 1], pos[b * 3 + 2]);
  };
  for (let j = 0; j <= NV; j += 8) for (let i = 0; i < NU; i++) pushSeg(at(i, j), at(i + 1, j));
  for (let i = 0; i <= NU; i += 6) for (let j = 0; j < NV; j++) pushSeg(at(i, j), at(i, j + 1));
  const isoGeo = new THREE.BufferGeometry();
  isoGeo.setAttribute("position", new THREE.Float32BufferAttribute(iso, 3));
  const stored = new THREE.LineSegments(isoGeo, new THREE.LineBasicMaterial({ color: kit.accent.clone(), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  face.add(stored);

  // Infrared dots: a seeded hex scatter across the face, sprayed from a projector above the camera.
  const dots = [];
  for (let v = -1.25; v <= 1.25; v += 0.034) {
    const row = Math.round((v + 1.25) / 0.034);
    for (let u = -0.85 + (row % 2) * 0.017; u <= 0.85; u += 0.034) {
      const ju = u + (rng() - 0.5) * 0.012;
      const jv = v + (rng() - 0.5) * 0.012;
      const { z, e } = faceDepth(ju, jv);
      if (e < 0.995) dots.push({ u: ju, v: jv, z, delay: (1.25 - jv) * 0.22 + rng() * 0.18 });
    }
  }
  const dotPts = kit.glowPoints(dots.length, { color: params.dotColor ?? "#ff3d6e", size: 0.022, intensity: 5 });
  face.add(dotPts);
  const emitter = new THREE.Vector3(0, 2.6, 6);

  // Padlock.
  const lock = new THREE.Group();
  lock.position.set(0, 0.6, 1.0);
  const lockBody = new THREE.Mesh(new kit.RoundedBox(0.62, 0.5, 0.24, 4, 0.08), new THREE.MeshPhysicalMaterial({ color: "#2b2e36", metalness: 0.9, roughness: 0.25, clearcoat: 1, emissive: new THREE.Color("#4EDB7A"), emissiveIntensity: 0 }));
  lockBody.castShadow = true;
  lock.add(lockBody);
  const shackle = new THREE.Group();
  shackle.position.set(-0.17, 0.25, 0);
  const arc = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.045, 16, 40, Math.PI), M.aluminium);
  arc.position.set(0.17, 0.2, 0);
  const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.24, 16), M.aluminium);
  legL.position.set(0, 0.08, 0);
  const legR = legL.clone();
  legR.position.set(0.34, 0.08, 0);
  shackle.add(arc, legL, legR);
  lock.add(shackle);
  const keyhole = new THREE.Mesh(new THREE.CircleGeometry(0.05, 24), new THREE.MeshBasicMaterial({ color: new THREE.Color("#4EDB7A").multiplyScalar(0.2), toneMapped: false }));
  keyhole.position.z = 0.125;
  lock.add(keyhole);
  lock.visible = show.has("unlock");
  scene.add(lock);
  const burst = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.56, 64), new THREE.MeshBasicMaterial({ color: "#4EDB7A", transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  burst.position.copy(lock.position);
  scene.add(burst);
  let chip = null;
  if (show.has("unlock") && params.unlockText !== "") {
    chip = document.createElement("div");
    chip.className = "ex-status-chip";
    chip.textContent = params.unlockText ?? "Unlocked";
    chip.style.background = "rgba(78, 219, 122, 0.16)";
    chip.style.border = "3px solid rgba(78, 219, 122, 0.8)";
    chip.style.color = "#bff5cf";
    kit.layer.appendChild(chip);
  }

  for (const l of params.labels ?? []) {
    const anchor = new THREE.Object3D();
    const target = { nose: [0, -0.22, 0.75], cheek: [0.5, -0.05, 0.5], brow: [-0.35, 0.36, 0.6], chin: [0, -0.95, 0.4], edge: [0.78, 0.2, 0.2] }[l.target ?? "cheek"] ?? [0.5, 0, 0.5];
    anchor.position.set(target[0] * S, target[1] * S, target[2] * S);
    face.add(anchor);
    kit.label({ text: l.text, anchor, side: l.side ?? "right", at: l.at ?? 0.6, dy: l.dy ?? 0, accentText: Boolean(l.accent) });
  }

  const dust = kit.motes(scene, rng, { spread: 6, height: 5, count: 50 });
  const cam = kit.camera({ fov: 30, centerY: 1130 });
  const look = new THREE.Vector3(0, cy - 0.35, 0);
  const da = dotPts.geometry.attributes.position;
  const dg = dotPts.geometry.attributes.aGlow;

  function update(t) {
    // Dots alone sit on a half-raised face, so the shape reads; the depth stage raises it fully.
    const lift = liftedFrom < 0 ? 1 : 0.55 + 0.45 * kit.easeInOut(kit.clamp((t - liftedFrom) / 0.9));
    depthUniforms.uLift.value = lift;
    const meshOn = liftedFrom < 0 ? 1 : kit.clamp((t - liftedFrom + 0.1) / 0.5);
    const faint = show.has("dots") ? 0.22 * kit.clamp((t - dotsAt - 0.4) / 0.6) : 0;
    depthUniforms.uOpacity.value = liftedFrom > 90 ? faint : Math.max(faint, meshOn);
    const m = kit.easeInOut(kit.clamp((t - matchAt) / 0.7));
    depthUniforms.uMatch.value = show.has("match") ? kit.clamp((t - matchAt - 0.55) / 0.3) : 0;
    depthUniforms.uSweep.value = show.has("match") ? kit.mix(1.4, -1.4, kit.clamp((t - matchAt - 0.5) / 0.7)) : -3;
    stored.visible = show.has("match") && t >= matchAt - 0.05;
    stored.position.x = (1 - m) * 3.2;
    stored.material.opacity = stored.visible ? 0.35 * kit.clamp((t - matchAt) / 0.2) * (1 - 0.6 * depthUniforms.uMatch.value) : 0;
    stored.scale.z = lift;
    // dots
    const dotsOn = show.has("dots") || (show.has("depth") && liftedFrom >= 0);
    dots.forEach((d, i) => {
      const k = show.has("dots") ? kit.clamp((t - dotsAt - d.delay) / 0.3) : 1;
      const tx = d.u * S;
      const ty = d.v * S;
      const tz = d.z * S * lift + 0.01;
      const e = kit.easeOut(k, 2);
      da.setXYZ(i, kit.mix(emitter.x, tx, e), kit.mix(emitter.y - cy, ty, e), kit.mix(emitter.z, tz, e));
      dg.setX(i, dotsOn && k > 0 ? (0.5 + 0.5 * Math.min(1, k * 1.5)) * (1 - 0.82 * (liftedFrom > 90 ? 0 : meshOn)) : 0);
    });
    da.needsUpdate = true;
    dg.needsUpdate = true;
    dotPts.material.uniforms.uScale.value = kit.pointScale(cam);
    // a gentle turn to show the depth
    face.rotation.y = Math.sin(t * 0.7 + 0.4) * 0.32 * (0.4 + 0.6 * lift);
    face.rotation.x = -0.04;
    // padlock
    if (show.has("unlock")) {
      const h = t - unlockAt;
      const open = kit.easeOut(kit.clamp(h / 0.35), 3);
      shackle.position.y = 0.25 + 0.16 * open;
      shackle.rotation.y = -0.9 * kit.easeInOut(kit.clamp((h - 0.15) / 0.4));
      lockBody.material.emissiveIntensity = h >= 0 ? 0.25 + 0.9 * Math.exp(-h * 3) : 0;
      keyhole.material.color.set("#4EDB7A").multiplyScalar(h >= 0 ? 4 : 0.2);
      const pop = kit.easeOut(kit.clamp((t - (unlockAt - 0.6)) / 0.4), 3);
      lock.scale.setScalar(0.4 + 0.6 * pop + (h >= 0 ? 0.08 * Math.exp(-h * 7) : 0));
      lock.position.y = 0.58 + 0.1 * pop;
      burst.visible = h >= 0 && h < 0.7;
      burst.scale.setScalar(1 + h * 5);
      burst.material.color.set("#4EDB7A").multiplyScalar(5 * Math.pow(Math.max(0, 1 - h / 0.7), 2));
    } else burst.visible = false;
    const p = kit.clamp(t / (info.duration + 0.4));
    const dist = 9.2 - 0.9 * kit.easeOut(p, 2);
    const yaw = THREE.MathUtils.degToRad(-8 + 10 * kit.easeInOut(p));
    cam.position.set(Math.sin(yaw) * dist, cy + 0.9, Math.cos(yaw) * dist);
    cam.lookAt(look);
    dust.points.material.uniforms.uScale.value = kit.pointScale(cam);
    dust.update(t);
  }

  function overlay(t, fade) {
    if (!chip) return;
    const h = t - unlockAt - 0.2;
    chip.style.top = "1600px";
    chip.style.opacity = String(kit.clamp(h / 0.25) * fade);
    chip.style.transform = `translateX(-50%) translateY(${((1 - kit.easeOut(kit.clamp(h / 0.3), 3)) * 24).toFixed(1)}px)`;
  }

  return { scene, camera: cam, update, overlay };
}
