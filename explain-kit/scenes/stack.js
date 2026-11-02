// Cross-section: labelled layers, top first, that ease apart so each one reads, with leader lines.
// A finger or stylus can touch the top and send a glow down to one layer. A layer can grow over
// the scene or fill with trapped particles.
function faceTexture(THREE, look, color, accent) {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 128;
  const g = c.getContext("2d");
  g.fillStyle = color;
  g.fillRect(0, 0, 512, 128);
  let seed = 11;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  if (look === "grid") {
    g.strokeStyle = "rgba(255,255,255,0.5)";
    g.lineWidth = 3;
    for (let x = 10; x < 512; x += 26) {
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x, 128);
      g.stroke();
    }
  } else if (look === "crust") {
    for (let i = 0; i < 900; i++) {
      g.fillStyle = `rgba(${200 + rnd() * 55},${110 + rnd() * 70},${40 + rnd() * 30},${0.25 + rnd() * 0.5})`;
      const r = 2 + rnd() * 7;
      g.beginPath();
      g.arc(rnd() * 512, rnd() * 128, r, 0, Math.PI * 2);
      g.fill();
    }
  } else if (look === "porous") {
    g.fillStyle = "rgba(0,0,0,0.18)";
    for (let i = 0; i < 500; i++) {
      g.beginPath();
      g.arc(rnd() * 512, rnd() * 128, 1.5 + rnd() * 3, 0, Math.PI * 2);
      g.fill();
    }
  } else if (look === "metal" || look === "solid") {
    g.fillStyle = "rgba(255,255,255,0.07)";
    for (let y = 0; y < 128; y += 4) g.fillRect(0, y, 512, 1);
  } else if (look === "layers") {
    g.fillStyle = "rgba(255,255,255,0.14)";
    for (let y = 4; y < 128; y += 11) g.fillRect(0, y, 512, 4);
  } else if (look === "dots") {
    g.fillStyle = "rgba(170,205,255,0.5)";
    for (let y = 8; y < 128; y += 17) {
      for (let x = (y / 17) % 2 ? 14 : 5; x < 512; x += 17) {
        g.beginPath();
        g.arc(x, y, 4.5, 0, Math.PI * 2);
        g.fill();
      }
    }
  }
  void accent;
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const DEFAULT_COLORS = { glass: "#1a2230", metal: "#9aa3ad", grid: "#2a3140", crust: "#b8662a", solid: "#596270", porous: "#dfe3e8", film: "#e4b04a", layers: "#2c2f36", dots: "#3e5f86" };

export default function stack(kit, params, info) {
  const { THREE, theme, M } = kit;
  const scene = new THREE.Scene();
  const rng = kit.rng(3);
  kit.backdrop(scene, theme, { haze: 1.1, centre: [0.5, 0.4] });
  kit.floor(scene, theme, { radius: 12, contact: 2.8 });
  kit.lights(scene, theme, { rim: 2.6 });

  const layersIn = (params.layers ?? [{ label: "TOP" }, { label: "MIDDLE" }, { label: "BOTTOM" }]).slice(0, 5);
  const Wd = 3.4;
  const D = 2.3;
  const accent = kit.accent;
  const stackGroup = new THREE.Group();
  scene.add(stackGroup);

  const layers = layersIn.map((L, i) => {
    const look = L.look ?? "solid";
    const color = L.color ?? DEFAULT_COLORS[look] ?? "#596270";
    const th = L.thickness ?? (look === "film" ? 0.1 : look === "glass" ? 0.26 : 0.24);
    const face = faceTexture(THREE, look, color, theme.accent);
    let mat;
    if (look === "glass") {
      mat = new THREE.MeshPhysicalMaterial({ color, metalness: 0, roughness: 0.05, clearcoat: 1, transparent: true, opacity: 0.62, map: face });
    } else if (look === "metal") {
      mat = new THREE.MeshPhysicalMaterial({ color: "#ffffff", map: face, metalness: 1, roughness: 0.3 });
    } else if (look === "crust") {
      mat = new THREE.MeshStandardMaterial({ color: "#ffffff", map: face, roughness: 0.85, metalness: 0, emissive: accent.clone(), emissiveIntensity: 0.0 });
    } else {
      mat = new THREE.MeshPhysicalMaterial({ color: "#ffffff", map: face, metalness: look === "grid" ? 0.5 : 0.1, roughness: look === "porous" ? 0.7 : 0.4, clearcoat: 0.3 });
    }
    if (!mat.emissive) mat.emissive = new THREE.Color(0, 0, 0);
    const mesh = new THREE.Mesh(new kit.RoundedBox(Wd, th, D, 3, Math.min(0.04, th / 3)), mat);
    mesh.castShadow = mesh.receiveShadow = true;
    const holder = new THREE.Group();
    holder.add(mesh);
    stackGroup.add(holder);
    // Wires on a grid layer glow.
    let lines = null;
    if (look === "grid") {
      lines = new THREE.Group();
      for (let k = 0; k < 9; k++) {
        const w = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.02, D * 0.96), M.glow(2.5, new THREE.Color(L.wire ?? "#8fc1ff")));
        w.position.set((k - 4) * (Wd / 9.5), th / 2 + 0.006, 0);
        lines.add(w);
      }
      holder.add(lines);
    }
    // Trapped particles sitting in the layer.
    let dots = null;
    if (L.particles) {
      dots = kit.glowPoints(70, { color: L.particleColor ?? theme.accent, size: 0.1, intensity: 5 });
      const pa = dots.geometry.attributes.position;
      const order = [];
      for (let k = 0; k < 70; k++) {
        pa.setXYZ(k, (rng() - 0.5) * Wd * 0.94, (rng() - 0.5) * th * 0.6, D / 2 - 0.02 - rng() * 0.05);
        order.push(rng());
      }
      dots.userData.order = order;
      holder.add(dots);
    }
    return { L, i, look, th, mesh, holder, mat, lines, dots, baseEmissive: mat.emissiveIntensity ?? 0 };
  });

  // Labels on the right, each on its own layer's front edge.
  layers.forEach((ly) => {
    kit.label({
      text: ly.L.label ?? "",
      anchor: ly.mesh,
      offset: new THREE.Vector3(Wd * 0.38, 0, D / 2),
      side: ly.L.side ?? "right",
      at: ly.L.at ?? 0.3 + ly.i * 0.38,
      dy: 0,
      accentText: Boolean(ly.L.glow),
    });
  });

  // The prop: a finger or a stylus that comes down and touches the top.
  let prop = null;
  if (params.prop && params.prop !== "none") {
    prop = kit.makeObject(params.prop);
    prop.rotation.z = -0.32;
    prop.rotation.x = 0.18;
    scene.add(prop);
  }
  const touchAt = params.touchAt ?? info.duration * 0.45;
  const ripple = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.24, 64), M.glow(6));
  ripple.rotation.x = -Math.PI / 2;
  ripple.visible = false;
  scene.add(ripple);

  // Rain: particles fall in from above and land in one layer (photons into a solar cell, drops into
  // soil). With "release", each landing frees a particle that runs out along the layer to the edge.
  const rain = params.rain ?? null;
  let rainPts = null;
  let freePts = null;
  let drops = [];
  if (rain) {
    const n = Math.min(60, rain.count ?? 28);
    rainPts = kit.glowPoints(n * 4, { color: rain.color ?? "#ffd76a", size: 0.13, intensity: 7 });
    scene.add(rainPts);
    if (rain.release) {
      freePts = kit.glowPoints(n, { color: rain.release.color ?? "#6fd0ff", size: 0.11, intensity: 7 });
      scene.add(freePts);
    }
    drops = Array.from({ length: n }, () => ({ x: (rng() - 0.5) * Wd * 0.8, z: (rng() - 0.5) * D * 0.7, phase: rng(), period: 1.1 + rng() * 0.6 }));
    if (rain.label) {
      const a = new THREE.Object3D();
      a.position.set(-0.6, 3.2, 0.3);
      scene.add(a);
      kit.label({ text: rain.label, anchor: a, side: "left", at: rain.labelAt ?? rain.at ?? 0.4, dy: -40, accentText: true });
    }
    if (rain.release?.label) {
      const a = new THREE.Object3D();
      a.position.set(Wd * 0.48, 0.9, D * 0.3);
      scene.add(a);
      kit.label({ text: rain.release.label, anchor: a, side: "right", at: rain.release.at ?? (rain.at ?? 0.4) + 0.8, dy: 240, accentText: false });
      rain.release.anchor = a;
    }
  }

  const dust = kit.motes(scene, rng, { spread: 6, height: 5, count: 60 });
  const cam = kit.camera({ fov: params.fov ?? 30, centerY: 1180 });
  const totalH = layers.reduce((a, l) => a + l.th, 0) + 0.32 * (layers.length - 1);
  const target = new THREE.Vector3(0.35, 0.5 + totalH / 2, 0);
  const hfov = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2) * cam.aspect);
  const fit = ((Wd * 0.62 + 1.2) / Math.tan(hfov / 2)) * 0.92;

  function update(t) {
    const p = kit.clamp(t / (info.duration + 0.4));
    // Layers ease apart over the first second and a half.
    const open = kit.easeInOut(kit.clamp(t / 1.5));
    const gap = 0.03 + 0.3 * open;
    let y = 0.45;
    const thick = layers.map((ly) => {
      if (!ly.L.grow) return ly.th;
      const g0 = ly.L.at ?? 0.6;
      return ly.th * (0.35 + 0.65 * kit.easeInOut(kit.clamp((t - g0) / Math.max(1, info.duration - g0))));
    });
    const tops = [];
    for (let i = layers.length - 1; i >= 0; i--) {
      const ly = layers[i];
      ly.holder.position.y = y + thick[i] / 2;
      ly.mesh.scale.y = thick[i] / ly.th;
      if (ly.lines) ly.lines.position.y = (thick[i] - ly.th) / 2;
      if (ly.dots) ly.dots.scale.y = thick[i] / ly.th;
      tops[i] = y + thick[i];
      y += thick[i] + gap;
    }
    // Touch: the prop comes down, and a glow runs to the highlighted layer.
    const h = t - touchAt;
    if (prop) {
      const down = kit.easeInOut(kit.clamp((t - (touchAt - 0.7)) / 0.7));
      const lift = kit.easeInOut(kit.clamp((t - (touchAt + 0.9)) / 0.6));
      const hover = 1.6 * (1 - down) + 0.5 * lift;
      prop.position.set(0.2, tops[0] + hover, 0.25);
    }
    ripple.visible = Boolean(prop) && h > 0 && h < 1.2;
    if (ripple.visible) {
      ripple.position.set(0.2, tops[0] + 0.01, 0.25);
      ripple.scale.setScalar(1 + h * 7);
      ripple.material.color.copy(accent).multiplyScalar(6 * Math.pow(1 - h / 1.2, 2));
    }
    layers.forEach((ly, i) => {
      let e = 0;
      if (ly.L.glow) {
        const reach = touchAt + i * 0.08;
        e = prop ? kit.clamp((t - reach) / 0.25) * (0.55 + 0.45 * Math.exp(-(t - reach) * 3)) : kit.clamp((t - (ly.L.at ?? 0.6)) / 0.4);
        e *= 1 + 0.12 * Math.sin(t * 6);
      }
      if (ly.look === "crust") {
        ly.mat.emissive.copy(accent);
        ly.mat.emissiveIntensity = 0.15 + 0.9 * e;
      } else {
        ly.mat.emissive.copy(accent).multiplyScalar(0.6 * e);
      }
      if (ly.lines) ly.lines.children.forEach((w, k) => w.material.color.set(ly.L.wire ?? "#8fc1ff").multiplyScalar(2 + 4 * e * (0.6 + 0.4 * Math.sin(t * 8 + k))));
      if (ly.dots) {
        const ga = ly.dots.geometry.attributes.aGlow;
        const shown = kit.clamp((t - (ly.L.at ?? 0.6)) / Math.max(1, info.duration * 0.7));
        ly.dots.userData.order.forEach((o, k) => ga.setX(k, o < shown ? 0.6 + 0.4 * Math.sin(t * 3 + k) : 0));
        ga.needsUpdate = true;
        ly.dots.material.uniforms.uScale.value = kit.pointScale(cam);
      }
    });
    if (rain) {
      const ti = Math.min(layers.length - 1, rain.layer ?? 1);
      const hitY = layers[ti].holder.position.y;
      const start = rain.at ?? 0.3;
      const pa = rainPts.geometry.attributes.position;
      const pg = rainPts.geometry.attributes.aGlow;
      const fa = freePts?.geometry.attributes.position;
      const fg = freePts?.geometry.attributes.aGlow;
      drops.forEach((d, i) => {
        const local = t - start - d.phase * d.period;
        const cyc = local >= 0 ? (local % d.period) / d.period : -1;
        const fallT = 0.55;
        for (let k = 0; k < 4; k++) {
          const u = cyc - k * 0.025;
          const fall = kit.clamp(u / fallT);
          const y = kit.mix(hitY + 3.4, hitY, fall * fall);
          pa.setXYZ(i * 4 + k, d.x - (1 - fall) * 0.6, y, d.z);
          pg.setX(i * 4 + k, u >= 0 && u < fallT ? (k === 0 ? 1 : 0.5 - k * 0.1) : 0);
        }
        if (freePts) {
          const r = (cyc - fallT) / (1 - fallT);
          const on = cyc >= fallT && r <= 1;
          // out to the front edge, where the cut shows it, then along the layer and out the side
          const ez = kit.mix(d.z, D / 2 + 0.12, kit.easeOut(kit.clamp(r / 0.35), 2));
          const ex = kit.mix(d.x, Wd / 2 + 0.3, kit.easeIn(kit.clamp((r - 0.25) / 0.75), 2));
          fa.setXYZ(i, ex, hitY + 0.02 + Math.sin(r * 18 + d.phase * 9) * 0.03, ez);
          fg.setX(i, on ? (r < 0.1 ? 2 : 1) * (1 - Math.max(0, r - 0.85) / 0.15) : 0);
        }
      });
      pa.needsUpdate = true;
      pg.needsUpdate = true;
      rainPts.material.uniforms.uScale.value = kit.pointScale(cam);
      if (freePts) {
        fa.needsUpdate = true;
        fg.needsUpdate = true;
        freePts.material.uniforms.uScale.value = kit.pointScale(cam);
        if (rain.release.anchor) rain.release.anchor.position.y = hitY;
      }
    }
    const yaw = THREE.MathUtils.degToRad((params.angle ?? -34) + (params.turn ?? 10) * kit.easeInOut(p));
    const el = THREE.MathUtils.degToRad(params.elevation ?? 24);
    const dist = fit * (1.15 - 0.15 * kit.easeOut(p, 2));
    cam.position.set(target.x + Math.sin(yaw) * Math.cos(el) * dist, target.y + Math.sin(el) * dist, Math.cos(yaw) * Math.cos(el) * dist);
    cam.lookAt(target);
    dust.points.material.uniforms.uScale.value = kit.pointScale(cam);
    dust.update(t);
  }

  return { scene, camera: cam, update };
}
