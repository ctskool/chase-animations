// Rank: a short ranked list as glowing 3D bars, top choice first, each with its word and value.
// The top bar lights up on its word. Values are shares of 100 by default; set "example": true when
// the numbers are illustrative, and the list says so.
export default function rank(kit, params, info) {
  const { THREE, theme, M } = kit;
  const scene = new THREE.Scene();
  const rng = kit.rng(13);
  kit.backdrop(scene, theme, { haze: 1.3, centre: [0.5, 0.42] });
  kit.floor(scene, theme, { radius: 12, contact: 0 });
  kit.lights(scene, theme, { rim: 2.4 });

  // Always ranked: highest first, whatever order the script lists them in.
  const items = [...(params.items ?? [{ label: "first", value: 60 }, { label: "second", value: 25 }, { label: "third", value: 10 }])]
    .sort((a, b) => Number(b.value) - Number(a.value))
    .slice(0, 5);
  const maxV = Math.max(...items.map((i) => i.value));
  const unit = params.unit ?? "%";
  const n = items.length;
  const barH = 0.42;
  const gapY = 0.26;
  const maxLen = 2.3;
  const x0 = -1.2;
  const topY = 1.2 + ((n - 1) * (barH + gapY)) / 2 + 0.2;
  const pickAt = params.pickAt ?? info.duration * 0.6;
  const growAt = params.growAt ?? 0.25;

  const bars = items.map((it, i) => {
    const top = i === 0;
    const mat = top
      ? new THREE.MeshPhysicalMaterial({ color: "#2a1d18", metalness: 0.4, roughness: 0.3, clearcoat: 1, emissive: kit.accent.clone(), emissiveIntensity: 0.9 })
      : new THREE.MeshPhysicalMaterial({ color: "#3a3f4a", metalness: 0.7, roughness: 0.32, clearcoat: 0.8 });
    const mesh = new THREE.Mesh(new kit.RoundedBox(1, barH, 0.4, 4, 0.08), mat);
    mesh.geometry.translate(0.5, 0, 0);
    mesh.position.set(x0, topY - i * (barH + gapY), 0);
    mesh.castShadow = mesh.receiveShadow = true;
    scene.add(mesh);
    const track = new THREE.Mesh(new kit.RoundedBox(maxLen, barH * 0.92, 0.3, 4, 0.07), M.graphite);
    track.geometry.translate(maxLen / 2, 0, 0);
    track.position.set(x0, mesh.position.y, -0.12);
    scene.add(track);
    const label = document.createElement("div");
    label.className = "ex-rank-label";
    label.innerHTML = `<b></b><span></span>`;
    label.querySelector("b").textContent = it.label;
    kit.layer.appendChild(label);
    return { it, mesh, mat, label, len: (it.value / maxV) * maxLen };
  });

  let tag = null;
  if (params.example) {
    tag = document.createElement("div");
    tag.className = "ex-example-tag";
    tag.textContent = params.exampleText ?? "example";
    kit.layer.appendChild(tag);
  }
  if (params.title) {
    const anchor = new THREE.Object3D();
    anchor.position.set(x0, topY + 0.55, 0);
    scene.add(anchor);
    kit.label({ text: params.title, anchor, side: "left", at: params.titleAt ?? 0.2, dy: -60 });
  }

  const ring = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.34, 48), new THREE.MeshBasicMaterial({ color: kit.accent.clone(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  scene.add(ring);
  const dust = kit.motes(scene, rng, { spread: 6, height: 5, count: 70 });
  const cam = kit.camera({ fov: 30, centerY: 1130 });
  const look = new THREE.Vector3(0, topY - ((n - 1) * (barH + gapY)) / 2, 0);
  const v = new THREE.Vector3();
  const grown = (i, t) => kit.easeOut(kit.clamp((t - growAt - i * 0.08) / 0.45), 3);

  function update(t) {
    const h = t - pickAt;
    bars.forEach((b, i) => {
      const g = grown(i, t);
      b.mesh.scale.x = Math.max(0.001, b.len * g);
      if (i === 0) {
        const punch = h >= 0 ? 1 + 0.12 * Math.exp(-h * 7) : 1;
        b.mesh.scale.y = punch;
        b.mesh.scale.z = punch;
        b.mat.emissiveIntensity = 0.7 + (h >= 0 ? 1.6 * Math.exp(-h * 3) + 0.4 : 0.15 * Math.sin(t * 4));
      }
    });
    ring.visible = h >= 0 && h < 0.7;
    if (ring.visible) {
      ring.position.set(x0 + bars[0].len + 0.25, bars[0].mesh.position.y, 0.25);
      ring.scale.setScalar(1 + h * 5);
      ring.material.color.copy(kit.accent).multiplyScalar(5 * Math.pow(1 - h / 0.7, 2));
    }
    const p = kit.clamp(t / (info.duration + 0.4));
    const yaw = THREE.MathUtils.degToRad(-14 + 12 * kit.easeInOut(p));
    const dist = 13 - 1.2 * kit.easeOut(p, 2);
    cam.position.set(Math.sin(yaw) * dist + 0.3, look.y + 1.5, Math.cos(yaw) * dist);
    cam.lookAt(look.x + 0.3, look.y, look.z);
    dust.points.material.uniforms.uScale.value = kit.pointScale(cam);
    dust.update(t);
  }

  function overlay(t) {
    cam.updateMatrixWorld();
    scene.updateMatrixWorld(true);
    const h = t - pickAt;
    bars.forEach((b, i) => {
      const g = grown(i, t);
      v.set(x0, b.mesh.position.y, 0.2).project(cam);
      const lx = (v.x * 0.5 + 0.5) * kit.W;
      const ly = (-v.y * 0.5 + 0.5) * kit.H;
      v.set(x0 + b.len * g, b.mesh.position.y, 0.2).project(cam);
      const rx = (v.x * 0.5 + 0.5) * kit.W;
      b.label.style.left = `${lx.toFixed(1)}px`;
      b.label.style.top = `${(ly - 70).toFixed(1)}px`;
      b.label.style.width = `${Math.max(0, rx - lx).toFixed(1)}px`;
      // The value is only ever shown as itself: it fades in as its bar lands, it never counts.
      b.label.style.opacity = String(kit.clamp((g - 0.6) / 0.3));
      b.label.querySelector("span").textContent = `${b.it.value}${unit}`;
      b.label.classList.toggle("top", i === 0);
      b.label.style.color = i === 0 && h >= 0 ? theme.accent : "";
    });
    if (tag) {
      v.set(x0, bars[n - 1].mesh.position.y - 0.55, 0).project(cam);
      tag.style.left = `${((v.x * 0.5 + 0.5) * kit.W).toFixed(1)}px`;
      tag.style.top = `${((-v.y * 0.5 + 0.5) * kit.H).toFixed(1)}px`;
      tag.style.opacity = String(kit.clamp((t - growAt - 0.4) / 0.3));
    }
  }

  return { scene, camera: cam, update, overlay };
}
