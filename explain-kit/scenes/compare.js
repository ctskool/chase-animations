// Compare: two states side by side, such as new against worn. Two upright glass cells fill with
// light to their values; the right one drops to its value on its word. A label and a value sit
// under each.
export default function compare(kit, params, info) {
  const { THREE, theme, M } = kit;
  const scene = new THREE.Scene();
  const rng = kit.rng(6);
  kit.backdrop(scene, theme, { haze: 1.2, centre: [0.5, 0.38] });
  kit.floor(scene, theme, { radius: 12, contact: 3.6 });
  kit.lights(scene, theme, { rim: 2.8 });

  const sides = [
    { label: "BEFORE", value: "100%", fill: 1, ...(params.left ?? {}) },
    { label: "AFTER", value: "50%", fill: 0.5, ...(params.right ?? {}) },
  ];
  const H = 3.0;
  const R = 0.52;
  const fillAt = params.fillAt ?? info.duration * 0.45;

  const cells = sides.map((s, i) => {
    const g = new THREE.Group();
    g.position.x = (i === 0 ? -1 : 1) * 1.2;
    scene.add(g);
    const color = new THREE.Color(s.color ?? (s.worn ? "#ff5a2a" : theme.accent));
    // Glass tube.
    const glass = new THREE.Mesh(
      new THREE.CylinderGeometry(R, R, H, 64, 1, true),
      new THREE.MeshPhysicalMaterial({ color: "#ffffff", metalness: 0, roughness: 0.04, transparent: true, opacity: 0.16, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false }),
    );
    glass.position.y = H / 2 + 0.2;
    g.add(glass);
    // Caps.
    for (const [y, h] of [[0.1, 0.2], [H + 0.3, 0.2]]) {
      const cap = new THREE.Mesh(new kit.RoundedBox(R * 2.15, h, R * 2.15, 4, 0.06), M.aluminium);
      cap.position.y = y;
      cap.castShadow = cap.receiveShadow = true;
      g.add(cap);
    }
    const nub = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.4, R * 0.4, 0.14, 40), M.aluminium);
    nub.position.y = H + 0.47;
    g.add(nub);
    // Light inside, as a column that fills.
    const fillMat = new THREE.MeshBasicMaterial({ color: color.clone().multiplyScalar(3.2), transparent: true, opacity: 0.92, toneMapped: false });
    const fillMesh = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.88, R * 0.88, 1, 64), fillMat);
    fillMesh.geometry.translate(0, 0.5, 0);
    fillMesh.position.y = 0.2;
    g.add(fillMesh);
    const surface = new THREE.Mesh(new THREE.CircleGeometry(R * 0.88, 64), new THREE.MeshBasicMaterial({ color: color.clone().multiplyScalar(3.5), toneMapped: false }));
    surface.rotation.x = -Math.PI / 2;
    g.add(surface);
    // A worn cell has a dull crust at the bottom.
    if (s.worn) {
      const crust = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.9, R * 0.9, 0.35, 64), new THREE.MeshStandardMaterial({ color: "#5a3a26", roughness: 0.9 }));
      crust.position.y = 0.38;
      g.add(crust);
    }
    // Tick marks on the glass.
    for (let k = 1; k < 10; k++) {
      const tick = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.012, 0.012), M.glow(1.4, new THREE.Color("#ffffff")));
      tick.position.set(0, 0.2 + (H * k) / 10, R + 0.01);
      g.add(tick);
    }
    const light = new THREE.PointLight(color, 0, 5, 1.6);
    light.position.y = 1.2;
    g.add(light);
    return { s, g, fillMesh, surface, light, color };
  });

  // Type under each cell, placed from the 3D positions.
  const texts = cells.map((c) => {
    const box = document.createElement("div");
    box.className = "ex-title";
    box.style.left = "0px";
    box.style.right = "auto";
    box.style.width = "440px";
    const value = document.createElement("span");
    value.className = "ex-title-main";
    value.style.fontSize = "112px";
    const lab = document.createElement("span");
    lab.className = "ex-stat-line";
    lab.style.position = "static";
    lab.style.display = "block";
    lab.style.fontSize = "50px";
    lab.style.color = c.s.worn ? "#ff8a5a" : theme.ink;
    lab.textContent = c.s.label;
    box.append(lab, value);
    kit.layer.appendChild(box);
    return { box, value, lab };
  });
  const parse = (v) => {
    const m = String(v).match(/^([^\d-]*)(-?\d+(?:\.\d+)?)(.*)$/);
    return m ? { pre: m[1], n: Number(m[2]), post: m[3] } : null;
  };

  const dust = kit.motes(scene, rng, { spread: 6, height: 5, count: 60 });
  const cam = kit.camera({ fov: 30, centerY: 1060 });
  const target = new THREE.Vector3(0, 1.75, 0);
  const v = new THREE.Vector3();
  const startLevel = params.startFill ?? 1;

  function level(c, t) {
    const up = kit.easeOut(kit.clamp((t - 0.1) / 0.9), 3) * startLevel;
    if (c.s === sides[0]) return Math.min(up, c.s.fill);
    const drop = kit.easeInOut(kit.clamp((t - fillAt) / 0.9));
    return Math.min(up, startLevel + (c.s.fill - startLevel) * drop);
  }

  function update(t) {
    const p = kit.clamp(t / (info.duration + 0.4));
    const yaw = THREE.MathUtils.degToRad(-14 + 14 * kit.easeInOut(p));
    const dist = 19 - 1.5 * kit.easeOut(p, 2);
    cam.position.set(Math.sin(yaw) * dist, 3.2, Math.cos(yaw) * dist);
    cam.lookAt(target);
    for (const c of cells) {
      const L = level(c, t);
      const flicker = c.s.worn && t > fillAt && t < fillAt + 0.9 ? 0.75 + 0.25 * Math.sin(t * 70) : 1;
      c.fillMesh.scale.y = Math.max(0.001, L * H * 0.96);
      c.surface.position.y = 0.2 + Math.max(0.001, L * H * 0.96) + 0.002;
      c.fillMesh.material.color.copy(c.color).multiplyScalar(1.25 * flicker);
      c.light.intensity = 6 * L * flicker;
    }
    dust.points.material.uniforms.uScale.value = kit.pointScale(cam);
    dust.update(t);
  }

  function overlay(t) {
    scene.updateMatrixWorld(true);
    cam.updateMatrixWorld();
    cells.forEach((c, i) => {
      v.set(0, 0, 0).applyMatrix4(c.g.matrixWorld).project(cam);
      const x = (v.x * 0.5 + 0.5) * kit.W;
      const y = (-v.y * 0.5 + 0.5) * kit.H;
      const tx = texts[i];
      tx.box.style.left = `${(x - 220).toFixed(1)}px`;
      tx.box.style.top = `${(y + 40).toFixed(1)}px`;
      const show = kit.clamp((t - 0.35 - i * 0.15) / 0.35);
      tx.box.style.opacity = String(show);
      tx.box.style.transform = `translateY(${((1 - kit.easeOut(show, 3)) * 24).toFixed(1)}px)`;
      const pv = parse(c.s.value);
      if (pv) {
        const L = level(c, t);
        let n;
        if (i === 0) n = pv.n * kit.clamp(L / (c.s.fill || 1));
        else {
          const first = parse(sides[0].value);
          const top = first ? first.n : pv.n;
          const drop = kit.easeInOut(kit.clamp((t - fillAt) / 0.9));
          n = t < fillAt ? top * kit.clamp(L / startLevel) : top + (pv.n - top) * drop;
        }
        const dec = (String(pv.n).split(".")[1] ?? "").length;
        tx.value.textContent = `${pv.pre}${n.toFixed(dec)}${pv.post}`;
      } else tx.value.textContent = c.s.value;
      tx.value.style.color = c.s.worn && t > fillAt ? "#ffffff" : theme.ink;
    });
  }

  return { scene, camera: cam, update, overlay };
}
