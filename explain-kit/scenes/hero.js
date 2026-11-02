// Hero object: one stylised object on the dark studio floor, a slow cinematic push-in, a rim light,
// and optional labels on its parts. With "charger": true a USB-C cable is plugged in and charge runs along it.
export default function hero(kit, params, info) {
  const { THREE, theme, M } = kit;
  const scene = new THREE.Scene();
  const rng = kit.rng(1);
  kit.backdrop(scene, theme, { haze: 1.1 });
  kit.floor(scene, theme, { radius: 10 });
  const rig = kit.lights(scene, theme, { rim: params.rim ?? 3.4 });

  const obj = kit.makeObject(params.object ?? "laptop", params.options ?? {});
  scene.add(obj);
  const size = obj.userData.size ?? new THREE.Vector3(3, 2, 3);
  const parts = obj.userData.parts ?? {};
  const radius = Math.max(size.x, size.y, size.z) * 0.62;

  // Charger: plug into the object's port, or into its left side.
  let cable = null;
  if (params.charger) {
    const port = parts.portPoint ? parts.portPoint.clone() : new THREE.Vector3(-size.x / 2, 0.1, 0);
    cable = kit.usbCable({ to: port, from: new THREE.Vector3(port.x - 3.2, 0.035, port.z + 2.6), glow: 9 });
    scene.add(cable);
  }
  const charge = cable ? kit.glowPoints(7, { color: theme.accent, size: 0.16, intensity: 7 }) : null;
  if (charge) scene.add(charge);

  // A soft pool of accent light under the object.
  const pool = new THREE.Mesh(
    new THREE.CircleGeometry(radius * 1.6, 64),
    new THREE.MeshBasicMaterial({ color: kit.accent.clone().multiplyScalar(0.5), transparent: true, opacity: 0.0, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d");
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, "#fff");
    grad.addColorStop(1, "#000");
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    pool.material.alphaMap = new THREE.CanvasTexture(c);
  }
  pool.rotation.x = -Math.PI / 2;
  pool.position.y = 0.004;
  scene.add(pool);

  const dust = kit.motes(scene, rng, { spread: 5, height: 4.5 });

  const cam = kit.camera({ fov: params.fov ?? 28 });
  const target = new THREE.Vector3(0, size.y * (params.targetY ?? 0.42), 0);
  const hfov = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2) * cam.aspect);
  const fit = (radius / Math.tan(hfov / 2)) * (params.fit ?? 1.12);
  const yaw0 = THREE.MathUtils.degToRad(params.angle ?? -32);
  const turn = THREE.MathUtils.degToRad(params.turn ?? 16);
  const elev = THREE.MathUtils.degToRad(params.elevation ?? 20);
  const push = params.push ?? 0.22;

  // Labels on named parts.
  for (const l of params.labels ?? []) {
    const part = parts[l.part];
    kit.label({
      text: l.text,
      anchor: part && part.isObject3D ? part : obj,
      offset: l.offset ? new THREE.Vector3(...l.offset) : null,
      side: l.side ?? "right",
      at: l.at ?? 0.6,
      dy: l.dy ?? -60,
    });
  }

  const heat = params.heat ?? 0;
  const foil = parts.foil;
  const heatColor = new THREE.Color("#ff4a12");

  function update(t) {
    const d = info.duration + 0.4;
    const p = kit.clamp(t / d);
    const e = kit.easeOut(p, 2.2);
    const dist = fit * (1 + push * (1 - e));
    const yaw = yaw0 + turn * kit.easeInOut(p);
    const el = elev + 0.05 * (1 - e);
    cam.position.set(Math.sin(yaw) * Math.cos(el) * dist, target.y + Math.sin(el) * dist, Math.cos(yaw) * Math.cos(el) * dist);
    cam.lookAt(target);
    // The rim light sweeps a little, so highlights travel over the object.
    rig.rim.position.set(9 * Math.cos(t * 0.25), 1.6 + 0.4 * Math.sin(t * 0.5), -7);
    pool.material.opacity = cable ? 0.14 + 0.06 * Math.sin(t * 2.2) : 0.06;
    if (charge) {
      const curve = cable.userData.parts.curve;
      const pos = charge.geometry.attributes.position;
      const g = charge.geometry.attributes.aGlow;
      for (let i = 0; i < 7; i++) {
        const u = ((t * 0.55 + i / 7) % 1);
        const pt = curve.getPointAt(1 - u);
        pos.setXYZ(i, pt.x, pt.y + 0.02, pt.z);
        g.setX(i, Math.sin(Math.PI * u));
      }
      pos.needsUpdate = true;
      g.needsUpdate = true;
      charge.material.uniforms.uScale.value = kit.pointScale(cam);
      const ring = cable.userData.parts.ring;
      ring.material.color.copy(kit.accent).multiplyScalar(7 + 3 * Math.sin(t * 5));
    }
    if (foil && heat > 0) {
      const h = heat * kit.easeInOut(kit.clamp(t / (info.duration * 0.8)));
      foil.emissive.copy(heatColor).multiplyScalar(h * 0.9);
    }
    dust.points.material.uniforms.uScale.value = kit.pointScale(cam);
    dust.update(t);
  }

  return { scene, camera: cam, update };
}
