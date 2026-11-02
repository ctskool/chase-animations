// A custom scene, for when nothing in the kit fits. Copy this file into the explainer's folder,
// rename it, and point a scene at it: { "type": "custom", "module": "my-scene.js", ...params }.
//
// The contract, the same one every kit scene follows:
//   export default function (kit, params, info) -> { scene, camera, update(t), overlay?(t, fade) }
//   kit     THREE, the studio helpers (backdrop, floor, lights, motes, glowPoints, eases, seeded rng),
//           makeObject(name, options), usbCable(), camera({ fov, centerY }), pointScale(camera),
//           label({ text, anchor, offset, side, at, dy }), layer (a DOM layer for this scene), theme, M (materials)
//   params  the scene's "visual" from script.json, with every "on": "word" turned into "at": seconds
//   info    { duration, keys (seconds of each key word), words: [{ text, start, end }] }, all scene-local
//   update  sets everything for scene time t. It is called for any t, in any order: no state between
//           frames, no clocks, no Math.random. Use kit.rng() for anything random.
//
// Keep the subject below the captions (the camera's centerY does that) and keep it dark and lit
// like the rest: backdrop + floor + lights + a little glow.
export default function custom(kit, params, info) {
  const { THREE, theme } = kit;
  const scene = new THREE.Scene();
  kit.backdrop(scene, theme);
  kit.floor(scene, theme);
  kit.lights(scene, theme);

  const obj = kit.makeObject(params.object ?? "sphere");
  scene.add(obj);
  if (params.label) kit.label({ text: params.label, anchor: obj, offset: new THREE.Vector3(0, 1.2, 0), at: params.labelAt ?? 0.5, side: "right" });

  const dust = kit.motes(scene, kit.rng(9));
  const cam = kit.camera({ fov: 30 });

  function update(t) {
    const p = kit.clamp(t / info.duration);
    const yaw = -0.4 + 0.3 * kit.easeInOut(p);
    const dist = 9 - 1.2 * kit.easeOut(p, 2);
    cam.position.set(Math.sin(yaw) * dist, 2.6, Math.cos(yaw) * dist);
    cam.lookAt(0, 1, 0);
    obj.rotation.y = t * 0.3;
    dust.points.material.uniforms.uScale.value = kit.pointScale(cam);
    dust.update(t);
  }

  return { scene, camera: cam, update };
}
