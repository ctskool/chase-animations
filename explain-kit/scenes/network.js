// Network: a layered model of glowing nodes and connections. In "forward" mode, signals sweep left
// to right, carrying the input chips in and an output chip out. In "train" mode, each round makes a
// guess that flashes red or green, then an error sweeps back and the weights shift.
export default function network(kit, params, info) {
  const { THREE, theme } = kit;
  const scene = new THREE.Scene();
  const rng = kit.rng(12);
  kit.backdrop(scene, theme, { haze: 1.3, centre: [0.5, 0.42] });
  kit.floor(scene, theme, { radius: 12, contact: 0 });
  kit.lights(scene, theme, { rim: 2.4 });

  const mode = params.mode ?? "forward";
  const sizes = params.layers ?? [4, 6, 6, 6, 3];
  const L = sizes.length;
  const spanX = 2.4;
  const baseY = 1.75;
  const xs = sizes.map((_, i) => -spanX / 2 + (spanX * i) / (L - 1));
  const nodes = [];
  sizes.forEach((n, li) => {
    for (let k = 0; k < n; k++) {
      const y = baseY + (k - (n - 1) / 2) * 0.44;
      const z = (rng() - 0.5) * 0.5;
      nodes.push({ li, k, p: new THREE.Vector3(xs[li], y, z) });
    }
  });
  const layerStart = [];
  let acc = 0;
  sizes.forEach((n) => {
    layerStart.push(acc);
    acc += n;
  });

  // Glass panels behind each layer, so it reads as layers.
  sizes.forEach((n, li) => {
    const h = (n - 1) * 0.44 + 0.7;
    const panel = new THREE.Mesh(new kit.RoundedBox(0.08, h, 1.1, 3, 0.03), kit.glassMaterial("#9fd0ff", { opacity: 0.02, rim: 0.3 }));
    panel.position.set(xs[li], baseY, 0);
    scene.add(panel);
  });

  // Node bodies and their glow.
  const body = new THREE.InstancedMesh(new THREE.SphereGeometry(0.12, 24, 16), new THREE.MeshPhysicalMaterial({ color: "#1b1e26", metalness: 0.6, roughness: 0.25, clearcoat: 1 }), nodes.length);
  const m4 = new THREE.Matrix4();
  nodes.forEach((nd, i) => {
    m4.makeTranslation(nd.p.x, nd.p.y, nd.p.z);
    body.setMatrixAt(i, m4);
  });
  body.castShadow = true;
  scene.add(body);
  const glow = kit.glowPoints(nodes.length, { color: "#ffffff", size: 0.5, intensity: 3 });
  nodes.forEach((nd, i) => glow.geometry.attributes.position.setXYZ(i, nd.p.x, nd.p.y, nd.p.z));
  scene.add(glow);

  // Connections between neighbouring layers, each with its own weight.
  const edges = [];
  for (let li = 0; li < L - 1; li++) {
    for (let a = 0; a < sizes[li]; a++) {
      for (let b = 0; b < sizes[li + 1]; b++) {
        edges.push({ a: layerStart[li] + a, b: layerStart[li + 1] + b, li, w: rng() * 2 - 1, w2: rng() * 2 - 1, phase: rng() });
      }
    }
  }
  const epos = new Float32Array(edges.length * 6);
  const ecol = new Float32Array(edges.length * 6);
  edges.forEach((e, i) => {
    const A = nodes[e.a].p;
    const B = nodes[e.b].p;
    epos.set([A.x, A.y, A.z, B.x, B.y, B.z], i * 6);
  });
  const egeo = new THREE.BufferGeometry();
  egeo.setAttribute("position", new THREE.BufferAttribute(epos, 3));
  egeo.setAttribute("color", new THREE.BufferAttribute(ecol, 3));
  const lines = new THREE.LineSegments(egeo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  scene.add(lines);

  // Pulses that ride the connections.
  const PULSES = Math.min(edges.length, 90);
  const pulseEdges = Array.from({ length: PULSES }, () => edges[Math.floor(rng() * edges.length)]);
  const pulses = kit.glowPoints(PULSES, { color: "#ffffff", size: 0.12, intensity: 6 });
  scene.add(pulses);

  // Inputs and output as chips.
  const inputs = [].concat(params.inputs ?? []);
  const inChips = inputs.map((w, i) => {
    const c = kit.makeChip(w, { color: kit.TOKEN_COLORS[i % kit.TOKEN_COLORS.length], height: 0.34 });
    scene.add(c);
    return c;
  });
  const outChip = params.output ? kit.makeChip(params.output, { color: theme.accent, height: 0.42 }) : null;
  if (outChip) scene.add(outChip);

  // Verdict mark for training rounds.
  const verdict = new THREE.Mesh(new THREE.RingGeometry(0.26, 0.32, 48), new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  const outNode = nodes[layerStart[L - 1] + Math.floor(sizes[L - 1] / 2)];
  verdict.position.copy(outNode.p).add(new THREE.Vector3(0.62, 0, 0.1));
  scene.add(verdict);

  for (const l of params.labels ?? []) {
    const anchor = new THREE.Object3D();
    const li = Math.min(L - 1, Math.max(0, l.layer ?? 2));
    anchor.position.set(xs[li], baseY + ((sizes[li] - 1) / 2) * 0.44 + 0.35, 0);
    if (l.target === "weights") anchor.position.set((xs[1] + xs[2]) / 2, baseY - 0.2, 0.1);
    if (l.target === "output") anchor.position.copy(outNode.p).add(new THREE.Vector3(0.75, 0.35, 0));
    if (l.target === "input") anchor.position.set(xs[0] - 0.75, baseY + ((Math.max(1, inputs.length) - 1) / 2) * 0.55 + 0.35, 0.2);
    scene.add(anchor);
    kit.label({ text: l.text, anchor, side: l.side ?? "right", at: l.at ?? 0.5, dy: l.dy ?? -200, accentText: Boolean(l.accent) });
  }

  // Training meter: an example accuracy bar, always labelled as an example.
  let meter = null;
  if (params.meter) {
    meter = document.createElement("div");
    meter.className = "ex-meter";
    meter.innerHTML = `<div class="ex-meter-top"><span>${params.meter.label ?? "Accuracy"}</span><em>example</em></div><div class="ex-meter-track"><i></i></div>`;
    kit.layer.appendChild(meter);
  }

  const red = new THREE.Color("#ff4b4b");
  const green = new THREE.Color("#4EDB7A");
  const base = new THREE.Color(params.color ?? "#8fc1ff");
  const accent = kit.accent;
  const rounds = params.rounds ?? (mode === "train" ? 3 : 0);
  const startAt = params.startAt ?? 0.3;
  const roundLen = mode === "train" ? Math.max(0.9, (info.duration - startAt) / Math.max(1, rounds)) : 1.1;
  const outcome = params.outcome ?? "learn"; // learn: red, red... then green; wrong: always red; right: always green
  const tmp = new THREE.Color();

  const dust = kit.motes(scene, rng, { spread: 6, height: 5, count: 70 });
  const cam = kit.camera({ fov: 30, centerY: 1150 });
  // leave room on the right for the guess when training or showing an output
const look = new THREE.Vector3(mode === "train" || params.output ? 0.35 : 0.05, baseY - 0.1, 0);

  function roundState(t) {
    if (mode !== "train") {
      const f = ((t - startAt) / roundLen) % 1;
      return { r: Math.floor((t - startAt) / roundLen), f: t < startAt ? -1 : f, back: -1 };
    }
    const r = Math.floor((t - startAt) / roundLen);
    const u = ((t - startAt) / roundLen) % 1;
    return { r, f: t < startAt ? -1 : Math.min(1, u / 0.45), back: u > 0.55 ? (u - 0.55) / 0.4 : -1, u };
  }
  const verdictFor = (r) => {
    if (outcome === "wrong") return "red";
    if (outcome === "right") return "green";
    return r >= rounds - 1 ? "green" : "red";
  };

  function update(t) {
    const st = roundState(t);
    // the activation front: forward sweep, then (in training) the error sweeps back
    const fx = st.f >= 0 ? -spanX / 2 - 0.4 + st.f * (spanX + 0.8) : -99;
    const bx = st.back >= 0 && st.back <= 1 ? spanX / 2 + 0.4 - st.back * (spanX + 0.8) : -99;
    const v = st.r >= 0 && mode === "train" ? verdictFor(Math.min(st.r, rounds - 1)) : null;
    const errCol = v === "green" ? green : red;
    const ga = glow.geometry.attributes.aGlow;
    const gs = glow.geometry.attributes.aSize;
    nodes.forEach((nd, i) => {
      const hit = Math.exp(-Math.pow((nd.p.x - fx) * 2.2, 2));
      const err = bx > -90 ? Math.exp(-Math.pow((nd.p.x - bx) * 2.2, 2)) : 0;
      ga.setX(i, 0.5 + 1.4 * hit + 1.2 * err);
      gs.setX(i, 0.7 + 0.6 * hit + 0.4 * err);
    });
    ga.needsUpdate = true;
    gs.needsUpdate = true;
    glow.material.uniforms.uColor.value.copy(base).lerp(accent, 0.25).multiplyScalar(3);
    glow.material.uniforms.uScale.value = kit.pointScale(cam);
    // edges: brightness from weight and the sweeps; in training, weights drift between two values
    const nudge = mode === "train" && st.r >= 0 ? kit.clamp(st.r / Math.max(1, rounds - 1) + (st.back > 0 ? st.back / rounds : 0)) : 0;
    edges.forEach((e, i) => {
      const w = kit.mix(e.w, e.w2, nudge);
      const mx = (nodes[e.a].p.x + nodes[e.b].p.x) / 2;
      const hit = Math.exp(-Math.pow((mx - fx) * 1.8, 2));
      const err = bx > -90 ? Math.exp(-Math.pow((mx - bx) * 1.8, 2)) : 0;
      const flick = mode === "train" && st.back > 0 && st.back < 1 ? 0.5 + 0.5 * Math.sin(t * 30 + e.phase * 20) : 0;
      const k = 0.05 + 0.1 * Math.abs(w) + 0.9 * hit * Math.abs(w) + err * (0.6 + 0.6 * flick);
      tmp.copy(base).multiplyScalar(k);
      if (err > 0.01) tmp.lerp(tmp.clone().copy(errCol).multiplyScalar(k * 1.6), Math.min(1, err * 1.5));
      ecol.set([tmp.r, tmp.g, tmp.b, tmp.r, tmp.g, tmp.b], i * 6);
    });
    egeo.attributes.color.needsUpdate = true;
    // pulses ride the edges near the front
    const pa = pulses.geometry.attributes.position;
    const pg = pulses.geometry.attributes.aGlow;
    pulseEdges.forEach((e, i) => {
      const A = nodes[e.a].p;
      const B = nodes[e.b].p;
      const forward = st.f >= 0 && st.f < 1;
      const back = bx > -90;
      let s = forward ? kit.clamp((fx - A.x) / (B.x - A.x)) : back ? kit.clamp((B.x - bx) / (B.x - A.x)) : 0;
      if (back) s = 1 - s;
      pa.setXYZ(i, kit.mix(A.x, B.x, s), kit.mix(A.y, B.y, s), kit.mix(A.z, B.z, s));
      pg.setX(i, (forward || back) && s > 0.02 && s < 0.98 ? 1 : 0);
    });
    pa.needsUpdate = true;
    pg.needsUpdate = true;
    pulses.material.uniforms.uColor.value.copy(bx > -90 ? errCol : base).multiplyScalar(6);
    pulses.material.uniforms.uScale.value = kit.pointScale(cam);
    // input chips slide into the first layer as each sweep starts; a stream if there are many
    const cycle = st.r >= 0 ? st.r : -1;
    inChips.forEach((c, i) => {
      const slot = params.stream ? (i + Math.max(0, cycle)) % inChips.length : i;
      const local = st.f;
      const y = baseY + (slot - (inChips.length - 1) / 2) * 0.46;
      const inP = local < 0 ? 0 : kit.easeIn(kit.clamp(local / 0.3), 2);
      const appear = kit.easeOut(kit.clamp((t - 0.05 * i) / 0.5), 3);
      c.position.set(xs[0] - 0.78 + inP * 0.7, y, 0.2);
      c.scale.setScalar((0.7 + 0.3 * appear) * (1 - 0.6 * inP));
      c.visible = !(params.stream && inP > 0.97);
      c.userData.setGlow(inP);
    });
    if (outChip) {
      const o = st.f >= 0 ? kit.easeOut(kit.clamp((st.f - 0.75) / 0.25), 3) : 0;
      outChip.visible = o > 0.01 || t > startAt + roundLen;
      const shown = t > startAt + roundLen ? 1 : o;
      outChip.position.set(outNode.p.x + 0.3 + 0.42 * shown, outNode.p.y, 0.2);
      outChip.scale.setScalar(0.6 + 0.4 * shown);
      outChip.userData.setGlow(o * (1 - o) * 4);
    }
    // the verdict ring flashes red or green at the end of each forward sweep
    verdict.visible = mode === "train" && st.r >= 0 && st.u > 0.42 && st.u < 0.95;
    if (verdict.visible) {
      const k = (st.u - 0.42) / 0.53;
      verdict.scale.setScalar(1 + k * 1.5);
      verdict.material.color.copy(v === "green" ? green : red).multiplyScalar(5 * (1 - k));
    }
    if (meter) {
      const m = params.meter;
      const prog = mode === "train" ? kit.clamp((t - startAt) / Math.max(0.1, roundLen * rounds)) : kit.clamp(t / info.duration);
      const val = kit.mix(m.from ?? 0.3, m.to ?? 0.9, kit.easeInOut(prog));
      meter.querySelector("i").style.width = `${(val * 100).toFixed(1)}%`;
      meter.querySelector("i").style.background = `rgb(${Math.round(kit.mix(255, 78, prog))},${Math.round(kit.mix(75, 219, prog))},${Math.round(kit.mix(75, 122, prog))})`;
    }
    const p = kit.clamp(t / (info.duration + 0.4));
    const yaw = THREE.MathUtils.degToRad((params.angle ?? -24) + 16 * kit.easeInOut(p));
    const dist = 14.6 - 1.4 * kit.easeOut(p, 2);
    cam.position.set(Math.sin(yaw) * dist, baseY + 1.9, Math.cos(yaw) * dist);
    cam.lookAt(look);
    dust.points.material.uniforms.uScale.value = kit.pointScale(cam);
    dust.update(t);
  }

  function overlay(t, fade) {
    if (meter) meter.style.opacity = String(kit.clamp((t - 0.3) / 0.3) * fade);
  }

  return { scene, camera: cam, update, overlay };
}
