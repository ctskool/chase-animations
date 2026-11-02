// Fiber: light travelling down glass strands. "overview" shows a few glowing strands carrying pulses.
// "layers" shows one strand stripped back in steps with labelled layers (core, cladding, coating).
// "bounce" cuts the strand open lengthways and a pulse zig-zags down the core, flashing at each bounce.
export default function fiber(kit, params, info) {
  const { THREE, theme } = kit;
  const scene = new THREE.Scene();
  const rng = kit.rng(15);
  kit.backdrop(scene, theme, { haze: 1.4, centre: [0.5, 0.43] });
  kit.floor(scene, theme, { radius: 12, contact: 0 });
  kit.lights(scene, theme, { rim: 2.4 });

  const view = params.view ?? "overview";
  const light = new THREE.Color(params.color ?? theme.accent);
  const coatColor = params.coating ?? "#d9a441";
  const layerDefs = [
    { label: "Core", ...(params.layers?.[0] ?? {}) },
    { label: "Cladding", ...(params.layers?.[1] ?? {}) },
    { label: "Coating", ...(params.layers?.[2] ?? {}) },
  ];
  const glowMat = (k) => new THREE.MeshBasicMaterial({ color: light.clone().multiplyScalar(k), toneMapped: false });
  const y0 = 1.7;
  const anchors = [];
  let update = () => {};
  const cam = kit.camera({ fov: 30, centerY: 1150 });
  const look = new THREE.Vector3(0, y0, 0);
  const dust = kit.motes(scene, rng, { spread: 6, height: 5, count: 60 });

  if (view === "overview") {
    // A few strands sweeping across, each carrying pulses, with glowing cut ends.
    const strands = [];
    for (let s = 0; s < (params.strands ?? 4); s++) {
      const off = (s - 1.5) * 0.42;
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-6.2, y0 - 1.3 + off * 0.6, -2.5 + off),
        new THREE.Vector3(-3.2, y0 - 0.5 + off * 0.5, -0.6 + off * 0.6),
        new THREE.Vector3(-0.6, y0 + 0.1 + off * 0.5, 0.4 + off * 0.3),
        new THREE.Vector3(1.3, y0 + 0.4 + off * 0.45, 0.9 + off * 0.15),
      ]);
      const clad = new THREE.Mesh(new THREE.TubeGeometry(curve, 160, 0.13, 24, false), kit.glassMaterial("#bfe6ff", { opacity: 0.1, rim: 1.2 }));
      const core = new THREE.Mesh(new THREE.TubeGeometry(curve, 160, 0.03, 10, false), glowMat(0.6));
      const end = new THREE.Mesh(new THREE.CircleGeometry(0.13, 32), glowMat(4));
      const tip = curve.getPointAt(1);
      const tan = curve.getTangentAt(1);
      end.position.copy(tip);
      end.lookAt(tip.clone().add(tan));
      scene.add(clad, core, end);
      const pts = kit.glowPoints(5 * 14, { color: params.color ?? theme.accent, size: 0.16, intensity: 6 });
      scene.add(pts);
      strands.push({ curve, pts, end, phase: rng(), speed: 0.32 + rng() * 0.08 });
    }
    anchors.push(strands[1].end);
    update = (t) => {
      strands.forEach((st) => {
        const pa = st.pts.geometry.attributes.position;
        const pg = st.pts.geometry.attributes.aGlow;
        for (let k = 0; k < 5; k++) {
          for (let j = 0; j < 14; j++) {
            const u = (((t * st.speed + st.phase + k / 5 - j * 0.006) % 1) + 1) % 1;
            const p = st.curve.getPointAt(u);
            pa.setXYZ(k * 14 + j, p.x, p.y, p.z);
            pg.setX(k * 14 + j, (j === 0 ? 1 : 0.6 * (1 - j / 14)) * Math.min(1, u * 8));
          }
        }
        pa.needsUpdate = true;
        pg.needsUpdate = true;
        st.pts.material.uniforms.uScale.value = kit.pointScale(cam);
        st.end.material.color.copy(light).multiplyScalar(3 + 2 * Math.sin(t * 9 + st.phase * 6));
      });
      const p = kit.clamp(t / (info.duration + 0.4));
      const yaw = THREE.MathUtils.degToRad(-6 + 12 * kit.easeInOut(p));
      const dist = 12.5 - 1.3 * kit.easeOut(p, 2);
      cam.position.set(Math.sin(yaw) * dist, y0 + 1.3, Math.cos(yaw) * dist);
      cam.lookAt(look.x + 0.2, look.y, look.z);
    };
  } else if (view === "layers") {
    // One strand, stripped back in steps: coating, then cladding, then the bare core.
    const R = [0.13, 0.42, 0.66];
    const ends = [2.3, 0.9, -0.5];
    const startX = -5;
    const group = new THREE.Group();
    group.position.y = y0;
    group.rotation.y = -0.35;
    group.position.x = -0.6;
    scene.add(group);
    const seg = (r, x1, mat, open = false) => {
      const len = x1 - startX;
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 64, 1, open), mat);
      m.rotation.z = Math.PI / 2;
      m.position.x = startX + len / 2;
      group.add(m);
      const cap = new THREE.Mesh(new THREE.CircleGeometry(r, 64), mat);
      cap.position.x = x1;
      cap.rotation.y = Math.PI / 2;
      group.add(cap);
      return m;
    };
    const coat = new THREE.MeshPhysicalMaterial({ color: coatColor, roughness: 0.45, metalness: 0.1, clearcoat: 0.6 });
    seg(R[2], ends[2], coat);
    const cladMesh = seg(R[1], ends[1], kit.glassMaterial("#bfe6ff", { opacity: 0.12, rim: 1.4 }));
    void cladMesh;
    const coreMesh = seg(R[0], ends[0], glowMat(1.5));
    void coreMesh;
    // a ring of light at each step edge
    ends.forEach((x, i) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(R[i] + 0.004, 0.008, 8, 80), glowMat(i === 0 ? 4 : 1.6));
      ring.position.x = x;
      ring.rotation.y = Math.PI / 2;
      group.add(ring);
    });
    const head = kit.glowPoints(24, { color: params.color ?? theme.accent, size: 0.3, intensity: 7 });
    group.add(head);
    layerDefs.forEach((L, i) => {
      const a = new THREE.Object3D();
      a.position.set(ends[i] - 0.25, R[i] * 0.9, R[i] * 0.4);
      group.add(a);
      kit.label({ text: L.label, anchor: a, side: L.side ?? (i === 0 ? "right" : "left"), at: L.at ?? 0.4 + i * 0.4, dy: L.dy ?? [-170, -190, 150][i], accentText: i === 0 });
    });
    update = (t) => {
      const pa = head.geometry.attributes.position;
      const pg = head.geometry.attributes.aGlow;
      for (let j = 0; j < 24; j++) {
        const x = startX + (((t * 3.2 - j * 0.05) % 7.6) + 7.6) % 7.6;
        pa.setXYZ(j, Math.min(x, ends[0]), 0, 0);
        pg.setX(j, x < ends[0] ? (j === 0 ? 1 : 0.7 * (1 - j / 24)) : 0);
      }
      pa.needsUpdate = true;
      pg.needsUpdate = true;
      head.material.uniforms.uScale.value = kit.pointScale(cam);
      const p = kit.clamp(t / (info.duration + 0.4));
      const dist = 13 - 1.2 * kit.easeOut(p, 2);
      const yaw = THREE.MathUtils.degToRad(-14 + 10 * kit.easeInOut(p));
      cam.position.set(Math.sin(yaw) * dist, y0 + 1.4, Math.cos(yaw) * dist);
      cam.lookAt(0, y0 - 0.1, 0);
    };
  } else {
    // "bounce": the strand cut lengthways, as a section: coating outside, cladding, and the core in
    // the middle. The pulse zig-zags between the core's edges.
    const L = 9;
    const rc = 0.5;
    const rk = 0.95;
    const ro = 1.2;
    const group = new THREE.Group();
    group.position.y = y0;
    group.rotation.y = 0.12;
    scene.add(group);
    const band = (h, y, color, opacity, z) => {
      const m = new THREE.Mesh(new kit.RoundedBox(L, h, 0.24, 2, 0.02), new THREE.MeshPhysicalMaterial({ color, roughness: 0.25, metalness: 0.0, clearcoat: 1, transparent: opacity < 1, opacity }));
      m.position.set(0, y, z);
      group.add(m);
      return m;
    };
    // coating above and below, then cladding, then the core
    band(ro - rk, (ro + rk) / 2, coatColor, 1, -0.05);
    band(ro - rk, -(ro + rk) / 2, coatColor, 1, -0.05);
    band(rk - rc, (rk + rc) / 2, "#1d3550", 0.95, -0.02);
    band(rk - rc, -(rk + rc) / 2, "#1d3550", 0.95, -0.02);
    band(rc * 2, 0, "#0a1626", 0.95, -0.04);
    // the core-cladding boundary, where the light reflects
    for (const s of [-1, 1]) {
      const edge = new THREE.Mesh(new THREE.BoxGeometry(L, 0.018, 0.02), new THREE.MeshBasicMaterial({ color: new THREE.Color("#9fd8ff").multiplyScalar(1.6), toneMapped: false }));
      edge.position.set(0, s * rc, 0.1);
      group.add(edge);
    }
    const amp = rc * 0.92;
    const period = params.period ?? 1.6;
    const pathY = (x) => {
      const ph = (((x + L / 2) / period) % 1 + 1) % 1;
      return ph < 0.5 ? -amp + 4 * amp * ph : 3 * amp - 4 * amp * ph;
    };
    const TRAIL = 70;
    const trail = kit.glowPoints(TRAIL, { color: params.color ?? theme.accent, size: 0.13, intensity: 7 });
    group.add(trail);
    const flashes = kit.glowPoints(12, { color: "#ffffff", size: 0.5, intensity: 4 });
    group.add(flashes);
    const speed = params.speed ?? 1.6;
    layerDefs.slice(0, 2).forEach((Ld, i) => {
      const a = new THREE.Object3D();
      a.position.set(i === 0 ? 1.0 : 1.6, i === 0 ? -0.25 : -(rc + rk) / 2, 0.15);
      group.add(a);
      kit.label({ text: Ld.label, anchor: a, side: Ld.side ?? "right", at: Ld.at ?? 0.5 + i * 0.4, dy: Ld.dy ?? (i === 0 ? 300 : 360), accentText: i === 0 });
    });
    update = (t) => {
      // the pulse starts already inside the frame, so the zig-zag is on screen from the first moment
      const headX = -2.4 + ((t * speed) % (L + 2));
      const pa = trail.geometry.attributes.position;
      const pg = trail.geometry.attributes.aGlow;
      for (let j = 0; j < TRAIL; j++) {
        const x = headX - j * 0.06;
        const on = x > -L / 2 && x < L / 2;
        pa.setXYZ(j, x, pathY(x), 0.16);
        pg.setX(j, on ? (j === 0 ? 1.4 : 0.8 * Math.pow(1 - j / TRAIL, 1.5)) : 0);
      }
      pa.needsUpdate = true;
      pg.needsUpdate = true;
      trail.material.uniforms.uScale.value = kit.pointScale(cam);
      // flashes at the bounces just behind the head
      const fa = flashes.geometry.attributes.position;
      const fg = flashes.geometry.attributes.aGlow;
      for (let k = 0; k < 12; k++) {
        const bx = -L / 2 + (k + 0.5) * (period / 2);
        const age = (headX - bx) / speed;
        fa.setXYZ(k, bx, pathY(bx), 0.17);
        fg.setX(k, age >= 0 && age < 0.5 && bx < L / 2 ? Math.pow(1 - age / 0.5, 2) : 0);
      }
      fa.needsUpdate = true;
      fg.needsUpdate = true;
      flashes.material.uniforms.uScale.value = kit.pointScale(cam);
      const p = kit.clamp(t / (info.duration + 0.4));
      const dist = 9.5 - 0.8 * kit.easeOut(p, 2);
      const yaw = THREE.MathUtils.degToRad(-6 + 8 * kit.easeInOut(p));
      cam.position.set(Math.sin(yaw) * dist, y0 + 0.9, Math.cos(yaw) * dist);
      cam.lookAt(0.3, y0, 0);
    };
  }

  function frame(t) {
    update(t);
    dust.points.material.uniforms.uScale.value = kit.pointScale(cam);
    dust.update(t);
  }

  return { scene, camera: cam, update: frame };
}
