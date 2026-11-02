// The end card: the topic in bold, a smaller italic line, an accent rule, over a dim studio
// with a slowly turning halo and, optionally, the hero object.
export default function title(kit, params, info) {
  const { THREE, theme } = kit;
  const scene = new THREE.Scene();
  kit.backdrop(scene, theme, { haze: 1.4 });
  kit.floor(scene, theme, { radius: 12 });
  const rig = kit.lights(scene, theme, { key: 1.4, rim: 3 });

  let obj = null;
  if (params.object) {
    obj = kit.makeObject(params.object, params.options ?? {});
    scene.add(obj);
  }
  const size = obj?.userData.size ?? new THREE.Vector3(3, 1, 3);

  // Rings of light on the floor round the object.
  const halo = new THREE.Mesh(new THREE.TorusGeometry(2.3, 0.014, 12, 220), kit.M.glow(8));
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = 0.01;
  scene.add(halo);
  const halo2 = new THREE.Mesh(new THREE.TorusGeometry(2.75, 0.006, 8, 220), kit.M.glow(3));
  halo2.rotation.x = -Math.PI / 2;
  halo2.position.y = 0.01;
  scene.add(halo2);
  const dust = kit.motes(scene, kit.rng(5), { spread: 6, height: 5, count: 120 });

  const cam = kit.camera({ fov: 30, centerY: 1440 });
  const target = new THREE.Vector3(0, Math.max(0.6, size.y * 0.45), 0);

  // Type.
  const box = document.createElement("div");
  box.className = "ex-title";
  box.style.top = "760px";
  const main = document.createElement("span");
  main.className = "ex-title-main";
  main.textContent = params.title ?? "";
  const rule = document.createElement("div");
  rule.className = "ex-rule";
  rule.style.background = theme.accent;
  rule.style.boxShadow = `0 0 18px ${theme.accent}`;
  const sub = document.createElement("span");
  sub.className = "ex-title-sub";
  sub.textContent = params.subtitle ?? "";
  box.append(main, sub);
  kit.layer.append(box, rule);
  let px = 132;
  main.style.fontSize = `${px}px`;
  main.style.whiteSpace = "nowrap";
  while (main.scrollWidth > kit.W - 140 && px > 84) {
    px -= 2;
    main.style.fontSize = `${px}px`;
  }
  if (main.scrollWidth > kit.W - 140) main.style.whiteSpace = "normal";
  sub.style.fontSize = `${Math.max(46, Math.round(px * 0.42))}px`;
  const mainRect = main.getBoundingClientRect();
  const subRect = sub.getBoundingClientRect();
  const ruleW = Math.min(mainRect.width * 0.5, 320);
  const ruleY = 760 + mainRect.height + 4;
  rule.style.left = `${(kit.W - ruleW) / 2}px`;
  rule.style.width = `${ruleW}px`;
  rule.style.top = `${ruleY}px`;
  sub.style.marginTop = "30px";
  void subRect;

  // When there is speech over the card, it lands after the first phrase; otherwise straight away.
  const land = Math.min(info.keys?.[0] ?? 0.15, 0.5);

  function update(t) {
    const p = kit.clamp(t / Math.max(1, info.duration));
    const yaw = -0.3 + 0.35 * p;
    const dist = 15 - 1.2 * kit.easeOut(p, 2);
    cam.position.set(Math.sin(yaw) * dist, 3.6 + 0.3 * (1 - p), Math.cos(yaw) * dist);
    cam.lookAt(target.x, target.y, target.z);
    const grow = kit.easeOut(kit.clamp(t / 0.9), 3);
    halo.scale.setScalar(0.6 + 0.4 * grow);
    halo2.scale.setScalar(0.5 + 0.5 * kit.easeOut(kit.clamp((t - 0.15) / 1.1), 3));
    halo.material.color.copy(kit.accent).multiplyScalar(8 * (0.75 + 0.25 * Math.sin(t * 2.4)));
    if (obj) obj.rotation.y = -0.5 + t * 0.18;
    rig.rim.intensity = 3 + Math.sin(t * 1.2) * 0.6;
    dust.points.material.uniforms.uScale.value = kit.pointScale(cam);
    dust.update(t);
  }

  function overlay(t) {
    const a = t - land;
    const m = kit.clamp(a / 0.5);
    main.style.opacity = String(kit.clamp(a / 0.2));
    main.style.transform = `translateY(${((1 - kit.easeOut(m, 4)) * 40).toFixed(1)}px) scale(${(1.06 - 0.06 * kit.easeOut(m, 3)).toFixed(4)})`;
    main.style.letterSpacing = `${(-0.02 + 0.03 * (1 - kit.easeOut(m, 3))).toFixed(4)}em`;
    const r = kit.easeOut(kit.clamp((a - 0.18) / 0.45), 3);
    rule.style.transform = `scaleX(${r.toFixed(4)})`;
    rule.style.opacity = String(r > 0 ? 1 : 0);
    const s = kit.clamp((a - 0.3) / 0.45);
    sub.style.opacity = String(kit.easeOut(s, 2) * 0.88);
    sub.style.transform = `translateY(${((1 - kit.easeOut(s, 3)) * 18).toFixed(1)}px)`;
  }

  return { scene, camera: cam, update, overlay };
}
