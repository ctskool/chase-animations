// Wave: glowing signals. A wave, its mirror image, and what happens when they meet: in "cancel"
// mode they flatten into a quiet line, in "add" mode they stack into a bigger wave.
export default function wave(kit, params, info) {
  const { THREE, theme } = kit;
  const scene = new THREE.Scene();
  const rng = kit.rng(8);
  kit.backdrop(scene, theme, { haze: 1.3, centre: [0.5, 0.42] });
  kit.floor(scene, theme, { radius: 12, contact: 0 });
  kit.lights(scene, theme, { rim: 2 });

  const mode = params.mode ?? "cancel";
  const wavesIn = (params.waves ?? [{ label: "SIGNAL" }, { label: "MIRROR", invert: true }]).slice(0, 2);
  const sumAt = params.sumAt ?? info.duration * 0.62;
  const N = 240;
  const span = 4.4;
  const rows = [2.55, 1.15];
  const mid = 1.85;

  function ribbon(color, width, power) {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(N * 2 * 3);
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const idx = [];
    for (let i = 0; i < N - 1; i++) {
      const a = i * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    geo.setIndex(idx);
    const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(power), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;
    scene.add(mesh);
    // A wider, dimmer copy as a soft halo.
    const haloMat = mat.clone();
    haloMat.color = new THREE.Color(color).multiplyScalar(power * 0.18);
    const halo = new THREE.Mesh(geo.clone(), haloMat);
    halo.frustumCulled = false;
    scene.add(halo);
    return { mesh, halo, width, power, color: new THREE.Color(color) };
  }
  function setRibbon(r, ys, base, z, fade) {
    for (const [m, w] of [[r.mesh, r.width], [r.halo, r.width * 2.6]]) {
      const pos = m.geometry.attributes.position;
      for (let i = 0; i < N; i++) {
        const x = -span / 2 + (span * i) / (N - 1);
        const y = base + ys[i];
        // Width follows the slope, so steep parts don't thin out.
        const dy = (ys[Math.min(N - 1, i + 1)] - ys[Math.max(0, i - 1)]) / ((2 * span) / (N - 1));
        const k = w * Math.sqrt(1 + dy * dy);
        pos.setXYZ(i * 2, x, y + k / 2, z);
        pos.setXYZ(i * 2 + 1, x, y - k / 2, z);
      }
      pos.needsUpdate = true;
    }
    r.mesh.material.color.copy(r.color).multiplyScalar(r.power * fade);
    r.halo.material.color.copy(r.color).multiplyScalar(r.power * 0.12 * fade);
    r.mesh.visible = r.halo.visible = fade > 0.001;
  }
  const signal = (x, t) => 0.55 * Math.sin(2.3 * x - 3.1 * t) + 0.28 * Math.sin(5.1 * x - 4.7 * t + 1.3) + 0.12 * Math.sin(9.7 * x - 6.3 * t + 0.4);
  const env = (x) => Math.pow(Math.sin(Math.PI * kit.clamp((x + span / 2) / span)), 0.6);

  const colors = [wavesIn[0]?.color ?? theme.accent, wavesIn[1]?.color ?? "#5fb4ff"];
  const rA = ribbon(colors[0], 0.035, 5);
  const rB = ribbon(colors[1], 0.035, 5);
  const rS = ribbon(params.resultColor ?? "#ffffff", 0.026, 2.4);
  const anchors = [new THREE.Object3D(), new THREE.Object3D(), new THREE.Object3D()];
  anchors.forEach((a) => scene.add(a));
  anchors[0].position.set(span / 2 - 0.2, rows[0], 0);
  anchors[1].position.set(span / 2 - 0.2, rows[1], 0);
  anchors[2].position.set(-span / 2 + 0.5, mid, 0);
  const bAt = wavesIn[1]?.at ?? 0.9;
  wavesIn.forEach((w, i) => {
    if (w.label) kit.label({ text: w.label, anchor: anchors[i], side: "right", at: i === 0 ? w.at ?? 0.3 : bAt, dy: i === 0 ? -90 : 90 });
  });
  if (params.result && mode !== "single") kit.label({ text: params.result, anchor: anchors[2], side: "left", at: sumAt + 0.5, dy: 150 });

  // Faint grid on the floor for depth.
  const grid = new THREE.GridHelper(14, 28, new THREE.Color("#2a2d33"), new THREE.Color("#1a1c20"));
  grid.material.transparent = true;
  grid.material.opacity = 0.5;
  grid.position.y = 0.002;
  scene.add(grid);

  const dust = kit.motes(scene, rng, { spread: 6, height: 5, count: 70 });
  const cam = kit.camera({ fov: 30, centerY: 1150 });
  const look = new THREE.Vector3(0, mid, 0);
  const ysA = new Float32Array(N);
  const ysB = new Float32Array(N);
  const ysS = new Float32Array(N);

  function update(t) {
    const merge = mode === "single" ? 0 : kit.easeInOut(kit.clamp((t - sumAt) / 0.8));
    const grow = kit.easeOut(kit.clamp(t / 0.6), 3);
    const bIn = kit.easeOut(kit.clamp((t - bAt) / 0.5), 3);
    for (let i = 0; i < N; i++) {
      const x = -span / 2 + (span * i) / (N - 1);
      const s = signal(x, t) * env(x);
      // The wave draws on from the left.
      const reveal = kit.clamp(grow * 1.3 - (i / N) * 0.3);
      ysA[i] = s * reveal;
      const sb = wavesIn[1]?.invert ? -s : s;
      ysB[i] = sb * bIn;
      ysS[i] = mode === "add" ? 2 * s : s * (1 - merge) * 0.06;
    }
    const baseA = kit.mix(rows[0], mid, merge);
    const baseB = kit.mix(rows[1], mid, merge);
    setRibbon(rA, ysA, baseA, 0, 1 - kit.clamp((merge - 0.35) / 0.45));
    setRibbon(rB, ysB, baseB, 0.01, mode === "single" ? 0 : bIn * (1 - kit.clamp((merge - 0.35) / 0.45)));
    setRibbon(rS, ysS, mid, 0.02, kit.clamp((merge - 0.55) / 0.35));
    anchors[0].position.y = baseA;
    anchors[1].position.y = baseB;
    const p = kit.clamp(t / (info.duration + 0.4));
    const yaw = THREE.MathUtils.degToRad(-12 + 18 * kit.easeInOut(p));
    const dist = 13 - 1.3 * kit.easeOut(p, 2);
    cam.position.set(Math.sin(yaw) * dist, mid + 1.1, Math.cos(yaw) * dist);
    cam.lookAt(look);
    dust.points.material.uniforms.uScale.value = kit.pointScale(cam);
    dust.update(t);
  }

  return { scene, camera: cam, update };
}
