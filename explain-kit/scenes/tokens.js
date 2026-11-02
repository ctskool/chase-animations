// Tokens: a line of text as glowing chips. "split" shows a sentence breaking into tokens, each in
// its own colour. "append" shows new tokens stamping onto the end of the line, one after another.
// Tokens come from "sentence" (split on spaces, and on "|" inside a word for word pieces) or "tokens".
function splitSentence(s) {
  const out = [];
  String(s)
    .trim()
    .split(/\s+/)
    .forEach((w, i) => w.split("|").forEach((p, k) => out.push((i > 0 && k === 0 ? " " : "") + p)));
  return out;
}

export default function tokens(kit, params, info) {
  const { THREE, theme } = kit;
  const scene = new THREE.Scene();
  const rng = kit.rng(11);
  kit.backdrop(scene, theme, { haze: 1.3, centre: [0.5, 0.42] });
  kit.floor(scene, theme, { radius: 12, contact: 0 });
  kit.lights(scene, theme, { rim: 2.4 });

  const words = params.tokens ?? splitSentence(params.sentence ?? "Why is the sky");
  const next = [].concat(params.next ?? []);
  const mode = params.mode ?? (next.length ? "append" : "split");
  const colors = kit.TOKEN_COLORS;
  const neutral = "#9aa3b2";
  const H = 0.62;
  const make = (w, i) => {
    const c = kit.makeChip(w.trim(), { color: colors[i % colors.length], height: H });
    scene.add(c);
    return c;
  };
  const chips = words.map(make);
  const extra = next.map((w, k) => make(w, words.length + k));
  const all = [...chips, ...extra];

  const splitAt = params.splitAt ?? Math.min(0.9, info.duration * 0.3);
  const stampAt = next.map((_, k) => params[`stamp${k + 1}At`] ?? (k === 0 ? params.stampAt : null) ?? info.duration * (0.35 + 0.3 * k));
  const rowY = 1.15;
  const maxW = params.width ?? 3.1;

  // Where each chip sits for a given gap and number of chips shown, wrapping onto a second row.
  function layout(n, gap) {
    const pos = [];
    let x = 0;
    let row = 0;
    const rows = [[]];
    for (let i = 0; i < n; i++) {
      const w = all[i].userData.width;
      if (x > 0 && x + w > maxW) {
        row += 1;
        x = 0;
        rows.push([]);
      }
      rows[row].push({ i, x, w });
      x += w + gap;
    }
    rows.forEach((r, ri) => {
      const width = r.length ? r[r.length - 1].x + r[r.length - 1].w : 0;
      r.forEach((c) => pos[c.i] = { x: c.x - width / 2 + c.w / 2, y: rowY + (rows.length - 1 - ri) * (H + 0.28) - (rows.length - 1) * 0.1 });
    });
    return pos;
  }

  // The stamp: a ring and a few sparks where a new token lands.
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.47, 64), new THREE.MeshBasicMaterial({ color: kit.accent.clone(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  scene.add(ring);
  const sparks = kit.glowPoints(60, { color: "#ffffff", size: 0.05, intensity: 6 });
  scene.add(sparks);
  const sp = Array.from({ length: 60 }, () => {
    const a = rng() * Math.PI * 2;
    const s = 1.2 + rng() * 2.4;
    return [Math.cos(a) * s, Math.sin(a) * s * 0.8 + 0.6, 0.6 + rng() * 0.6];
  });
  const caret = new THREE.Mesh(new THREE.BoxGeometry(0.05, H * 0.8, 0.05), new THREE.MeshBasicMaterial({ color: kit.accent.clone().multiplyScalar(5), toneMapped: false }));
  scene.add(caret);

  for (const l of params.labels ?? []) {
    const anchor = new THREE.Object3D();
    anchor.position.set(l.x ?? 0, rowY + (l.y ?? 0.45), 0);
    scene.add(anchor);
    kit.label({ text: l.text, anchor, side: l.side ?? "right", at: l.at ?? splitAt + 0.3, dy: l.dy ?? -160 });
  }

  const dust = kit.motes(scene, rng, { spread: 6, height: 5, count: 70 });
  const cam = kit.camera({ fov: 30, centerY: 1120 });
  const look = new THREE.Vector3(0, rowY, 0);

  function update(t) {
    const shown = chips.length + stampAt.filter((s) => t >= s - 0.45).length;
    const open = mode === "split" ? kit.easeInOut(kit.clamp((t - splitAt) / 0.6)) : 1;
    const gap = 0.02 + 0.2 * open;
    // Keep the row centred as tokens join: lay it out with the arriving chip's slot in place.
    const pos = layout(Math.max(chips.length, shown), gap);
    all.forEach((c, i) => {
      const p = pos[i];
      if (i < chips.length) {
        c.visible = true;
        const stagger = mode === "split" ? kit.clamp((t - splitAt - i * 0.07) / 0.35) : 1;
        const hop = mode === "split" ? Math.sin(Math.PI * stagger) * 0.18 : 0;
        const intro = kit.easeOut(kit.clamp((t - i * 0.05) / 0.5), 3);
        c.position.set(p.x, p.y + hop + (1 - intro) * -0.4, (1 - intro) * -1);
        c.scale.setScalar(0.85 + 0.15 * intro);
        c.userData.setColor(mode === "split" && stagger < 0.5 ? neutral : colors[i % colors.length], mode === "split" ? 0.4 + 0.6 * stagger : 1);
        c.userData.setGlow(mode === "split" ? Math.sin(Math.PI * stagger) * 0.8 : 0.15);
        c.rotation.set(0, 0, 0);
      } else {
        const k = i - chips.length;
        const at = stampAt[k];
        const h = t - at;
        c.visible = t >= at - 0.45 && p !== undefined;
        if (!c.visible) return;
        const fall = kit.clamp((t - (at - 0.45)) / 0.45);
        const e = fall * fall;
        c.position.set(p.x, p.y + (1 - e) * 2.4, (1 - e) * 1.2);
        c.rotation.set((1 - e) * -0.6, (1 - e) * 0.4, 0);
        const punch = h >= 0 ? 1 + 0.16 * Math.exp(-h * 8) * Math.cos(h * 22) : 1;
        c.scale.setScalar(punch);
        c.userData.setGlow(h >= 0 ? Math.exp(-h * 2.5) : 0.4);
      }
    });
    // ring + sparks on the latest stamp
    let last = -1;
    stampAt.forEach((s, k) => {
      if (t >= s) last = k;
    });
    const h = last >= 0 ? t - stampAt[last] : 99;
    ring.visible = h < 0.6;
    const sg = sparks.geometry.attributes.aGlow;
    const sa = sparks.geometry.attributes.position;
    if (last >= 0) {
      const p = pos[chips.length + last];
      ring.position.set(p.x, p.y, 0.2);
      ring.scale.setScalar(1 + h * 2);
      ring.material.color.copy(kit.accent).multiplyScalar(5 * Math.pow(Math.max(0, 1 - h / 0.6), 2));
      sp.forEach((s, i) => {
        const live = h < s[2];
        const st = Math.min(h, 0.08) + Math.max(0, h - 0.08) * 0.4;
        sa.setXYZ(i, p.x + s[0] * st, p.y + s[1] * st - 2 * st * st, 0.3);
        sg.setX(i, live ? 1 - h / s[2] : 0);
      });
    } else for (let i = 0; i < 60; i++) sg.setX(i, 0);
    sa.needsUpdate = true;
    sg.needsUpdate = true;
    sparks.material.uniforms.uScale.value = kit.pointScale(cam);
    // caret after the last chip, blinking, in append mode
    caret.visible = mode === "append" && Math.floor(t * 2.2) % 2 === 0;
    if (caret.visible) {
      const lastShown = all[Math.max(chips.length, stampAt.filter((s) => t >= s).length + chips.length) - 1];
      caret.position.set(lastShown.position.x + lastShown.userData.width / 2 + 0.14, lastShown.position.y, 0);
    }
    const p = kit.clamp(t / (info.duration + 0.4));
    const yaw = THREE.MathUtils.degToRad(-10 + 14 * kit.easeInOut(p));
    const dist = 12.6 - 1.3 * kit.easeOut(p, 2);
    cam.position.set(Math.sin(yaw) * dist, rowY + 1.6, Math.cos(yaw) * dist);
    cam.lookAt(look);
    dust.points.material.uniforms.uScale.value = kit.pointScale(cam);
    dust.update(t);
  }

  return { scene, camera: cam, update };
}
