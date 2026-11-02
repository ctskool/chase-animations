// Stylised objects built from primitives. Each builder returns a THREE.Group standing on y = 0,
// centred on x and z, about 3 units across, with named parts in group.userData.parts
// (for labels, glows and the burst). Nothing here loads a file.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

const C = (hex) => new THREE.Color(hex);

export function materials(theme) {
  const accent = C(theme.accent);
  return {
    aluminium: new THREE.MeshPhysicalMaterial({ color: "#c4c8cf", metalness: 1, roughness: 0.3, clearcoat: 0.2 }),
    spaceGrey: new THREE.MeshPhysicalMaterial({ color: "#5a5e66", metalness: 1, roughness: 0.34, clearcoat: 0.3 }),
    darkMetal: new THREE.MeshStandardMaterial({ color: "#26292f", metalness: 0.9, roughness: 0.38 }),
    graphite: new THREE.MeshStandardMaterial({ color: "#1b1d22", metalness: 0.4, roughness: 0.55 }),
    glossBlack: new THREE.MeshPhysicalMaterial({ color: "#0b0c0f", metalness: 0.1, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.08 }),
    rubber: new THREE.MeshStandardMaterial({ color: "#121316", metalness: 0, roughness: 0.75 }),
    plasticWhite: new THREE.MeshPhysicalMaterial({ color: "#e9e6e0", metalness: 0, roughness: 0.42, clearcoat: 0.4 }),
    foil: new THREE.MeshPhysicalMaterial({ color: "#b9bcc2", metalness: 1, roughness: 0.42, clearcoat: 0.5, clearcoatRoughness: 0.3 }),
    copper: new THREE.MeshStandardMaterial({ color: "#c27a45", metalness: 1, roughness: 0.32 }),
    gold: new THREE.MeshStandardMaterial({ color: "#d7a54a", metalness: 1, roughness: 0.28 }),
    glass: new THREE.MeshPhysicalMaterial({ color: "#0d1117", metalness: 0, roughness: 0.04, clearcoat: 1, clearcoatRoughness: 0.02, reflectivity: 0.6 }),
    skin: new THREE.MeshPhysicalMaterial({ color: "#d79a7c", metalness: 0, roughness: 0.48, sheen: 0.6, sheenColor: C("#ffcdb0"), clearcoat: 0.15 }),
    glow: (power = 6, color = accent) => new THREE.MeshBasicMaterial({ color: color.clone().multiplyScalar(power), toneMapped: false }),
    accent,
  };
}

const rbox = (w, h, d, r, mat, seg = 4) => {
  const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2, h / 2, d / 2)), mat);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
};
const shadowed = (m) => {
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
};

function canvasTexture(w, h, draw) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

// A screen that glows: a dark gradient wallpaper with a battery glyph or a soft accent bloom.
function screenMaterial(theme, { glyph = "none", level = 0.8, power = 1.6 } = {}) {
  const tex = canvasTexture(512, 340, (g, w, h) => {
    const grad = g.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, "#0b0f18");
    grad.addColorStop(0.6, "#151a26");
    grad.addColorStop(1, theme.accent);
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
    const r = g.createRadialGradient(w * 0.72, h * 0.8, 0, w * 0.72, h * 0.8, w * 0.6);
    r.addColorStop(0, theme.accent + "aa");
    r.addColorStop(1, "#00000000");
    g.fillStyle = r;
    g.fillRect(0, 0, w, h);
    if (glyph === "battery") {
      const bw = 150;
      const bh = 72;
      const x = w / 2 - bw / 2;
      const y = h / 2 - bh / 2;
      g.strokeStyle = "#f4f1ea";
      g.lineWidth = 7;
      g.beginPath();
      g.roundRect(x, y, bw, bh, 14);
      g.stroke();
      g.fillStyle = "#f4f1ea";
      g.fillRect(x + bw + 4, y + bh * 0.3, 10, bh * 0.4);
      g.fillStyle = theme.accent;
      g.beginPath();
      g.roundRect(x + 11, y + 11, (bw - 22) * level, bh - 22, 6);
      g.fill();
    }
  });
  return new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(power, power, power), toneMapped: false });
}

function label(text, theme, { w = 512, h = 128, bg = "#d9dadd", fg = "#16181c", stripe = true } = {}) {
  return canvasTexture(w, h, (g) => {
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    if (stripe) {
      g.fillStyle = theme.accent;
      g.fillRect(0, 0, 18, h);
    }
    g.fillStyle = fg;
    g.font = `700 ${Math.round(h * 0.34)}px Inter, sans-serif`;
    g.textBaseline = "middle";
    g.fillText(text, 40, h * 0.5);
  });
}

// ---------------------------------------------------------------- objects

function laptop(theme, M, opt) {
  const g = new THREE.Group();
  const W = 3.1;
  const D = 2.1;
  const T = 0.11;
  const base = rbox(W, T, D, 0.05, M.aluminium, 5);
  base.position.y = T / 2;
  g.add(base);
  // Keyboard well and keys.
  const well = rbox(W * 0.86, 0.02, D * 0.42, 0.02, M.graphite, 2);
  well.position.set(0, T + 0.002, -D * 0.12);
  g.add(well);
  const keyGeo = new RoundedBoxGeometry(0.16, 0.03, 0.15, 2, 0.02);
  const keyMat = new THREE.MeshStandardMaterial({ color: "#121317", roughness: 0.6, metalness: 0.2 });
  const cols = 14;
  const rows = 5;
  const keys = new THREE.InstancedMesh(keyGeo, keyMat, cols * rows);
  const m4 = new THREE.Matrix4();
  let k = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = (c - (cols - 1) / 2) * 0.185;
      const z = -D * 0.12 + (r - (rows - 1) / 2) * 0.17;
      m4.makeTranslation(x, T + 0.018, z);
      keys.setMatrixAt(k++, m4);
    }
  }
  keys.castShadow = true;
  g.add(keys);
  const pad = rbox(W * 0.34, 0.006, D * 0.27, 0.03, new THREE.MeshPhysicalMaterial({ color: "#b8bcc3", metalness: 1, roughness: 0.18 }), 2);
  pad.position.set(0, T + 0.001, D * 0.3);
  g.add(pad);
  // The lid, hinged at the back edge.
  const hinge = new THREE.Group();
  hinge.position.set(0, T, -D / 2 + 0.03);
  hinge.rotation.x = -THREE.MathUtils.degToRad(opt.lidAngle ?? 108) + Math.PI / 2;
  g.add(hinge);
  const lid = rbox(W, 0.07, D * 0.98, 0.04, M.aluminium, 5);
  lid.rotation.x = -Math.PI / 2;
  lid.position.set(0, D * 0.49, -0.035);
  hinge.add(lid);
  const bezel = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.97, D * 0.95), M.glossBlack);
  bezel.position.set(0, D * 0.49, 0.001);
  hinge.add(bezel);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.92, D * 0.86), screenMaterial(theme, { glyph: opt.screen ?? "battery", level: opt.level ?? 0.85 }));
  screen.position.set(0, D * 0.5, 0.004);
  hinge.add(screen);
  // A USB-C port on the left side.
  const port = rbox(0.03, 0.035, 0.11, 0.015, M.rubber, 2);
  port.position.set(-W / 2 - 0.002, T / 2, D * 0.05);
  g.add(port);
  g.userData.parts = { base, lid, screen, keys, port, portPoint: new THREE.Vector3(-W / 2, T / 2, D * 0.05) };
  g.userData.size = new THREE.Vector3(W, D, D);
  return g;
}

// A USB-C plug and its cable. The plug points along +x into `to`. The cable runs back along `path`.
export function usbCable(theme, M, { to = new THREE.Vector3(), from = new THREE.Vector3(-3.5, 0.03, 1.5), glow = 7 } = {}) {
  const g = new THREE.Group();
  const plug = new THREE.Group();
  const body = rbox(0.42, 0.11, 0.17, 0.05, M.plasticWhite, 3);
  body.position.x = -0.21 - 0.08;
  plug.add(body);
  const tip = rbox(0.1, 0.045, 0.1, 0.02, M.aluminium, 2);
  tip.position.x = -0.05;
  plug.add(tip);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.012, 12, 40), M.glow(glow));
  ring.rotation.y = Math.PI / 2;
  ring.position.x = -0.1;
  plug.add(ring);
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.018, 16, 12), M.glow(glow * 1.6));
  led.position.set(-0.32, 0.058, 0);
  plug.add(led);
  plug.position.copy(to);
  g.add(plug);
  const start = to.clone().add(new THREE.Vector3(-0.5, 0, 0));
  const curve = new THREE.CatmullRomCurve3([
    start,
    start.clone().add(new THREE.Vector3(-0.5, -0.02, 0.05)),
    new THREE.Vector3(mixN(start.x, from.x, 0.55), from.y + 0.02, mixN(start.z, from.z, 0.4) + 0.4),
    from,
  ]);
  const cable = shadowed(new THREE.Mesh(new THREE.TubeGeometry(curve, 120, 0.035, 12, false), M.plasticWhite));
  g.add(cable);
  g.userData.parts = { plug, ring, led, cable, curve };
  return g;
}
const mixN = (a, b, p) => a + (b - a) * p;

// A pouch cell, as inside a laptop: a foil slab with two tabs and a printed band.
function battery(theme, M, opt) {
  const g = new THREE.Group();
  const W = 2.6;
  const T = 0.32;
  const D = 1.7;
  const foil = M.foil.clone();
  const body = rbox(W, T, D, 0.12, foil, 6);
  body.position.y = T / 2;
  g.add(body);
  const band = new THREE.Mesh(
    new THREE.PlaneGeometry(W * 0.62, D * 0.32),
    new THREE.MeshStandardMaterial({ map: label(opt.text ?? "Li-ion  11.4V", theme), roughness: 0.5 }),
  );
  band.rotation.x = -Math.PI / 2;
  band.position.set(-W * 0.08, T + 0.002, D * 0.12);
  g.add(band);
  const tabMat = M.aluminium;
  for (const [x, mat] of [[-0.45, tabMat], [0.45, M.copper]]) {
    const tab = rbox(0.34, 0.03, 0.42, 0.01, mat, 2);
    tab.position.set(x, T * 0.5, -D / 2 - 0.16);
    g.add(tab);
  }
  // A charge bar under the foil that can glow through the band.
  const bar = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.55, 0.08), M.glow(5));
  bar.rotation.x = -Math.PI / 2;
  bar.position.set(-W * 0.08 - W * 0.275, T + 0.004, -D * 0.2);
  bar.geometry.translate(W * 0.275, 0, 0);
  g.add(bar);
  g.userData.parts = { body, band, bar, foil };
  g.userData.size = new THREE.Vector3(W, T, D);
  g.userData.slab = { w: W, h: T, d: D, material: foil };
  return g;
}

function phone(theme, M, opt) {
  const g = new THREE.Group();
  const W = 1.5;
  const T = 0.16;
  const D = 3.1;
  const body = rbox(W, T, D, 0.07, M.spaceGrey, 6);
  body.position.y = T / 2;
  g.add(body);
  const glass = rbox(W * 0.98, 0.012, D * 0.985, 0.05, M.glass, 3);
  glass.position.y = T + 0.002;
  g.add(glass);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.92, D * 0.94), screenMaterial(theme, { glyph: opt.screen ?? "none" }));
  screen.rotation.x = -Math.PI / 2;
  screen.position.y = T + 0.01;
  g.add(screen);
  g.userData.parts = { body, glass, screen };
  g.userData.size = new THREE.Vector3(W, T, D);
  g.userData.slab = { w: W, h: T, d: D, material: M.spaceGrey };
  return g;
}

function chip(theme, M, opt) {
  const g = new THREE.Group();
  const S = 2;
  const pkg = rbox(S, 0.16, S, 0.03, M.graphite, 3);
  pkg.position.y = 0.12;
  g.add(pkg);
  const die = rbox(S * 0.56, 0.06, S * 0.56, 0.02, new THREE.MeshPhysicalMaterial({ color: "#2f3540", metalness: 1, roughness: 0.15, clearcoat: 1, iridescence: 0.6 }), 2);
  die.position.y = 0.22;
  g.add(die);
  const pinGeo = new THREE.BoxGeometry(0.05, 0.03, 0.18);
  const pins = new THREE.InstancedMesh(pinGeo, M.gold, 64);
  const m4 = new THREE.Matrix4();
  let k = 0;
  for (let side = 0; side < 4; side++) {
    for (let i = 0; i < 16; i++) {
      const u = (i - 7.5) * 0.11;
      const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), (side * Math.PI) / 2);
      const p = new THREE.Vector3(u, 0.05, S / 2 + 0.06).applyQuaternion(q);
      m4.compose(p, q, new THREE.Vector3(1, 1, 1));
      pins.setMatrixAt(k++, m4);
    }
  }
  pins.castShadow = true;
  g.add(pins);
  const glowLine = new THREE.Mesh(new THREE.RingGeometry(S * 0.3, S * 0.31, 4, 1), M.glow(5));
  glowLine.rotation.x = -Math.PI / 2;
  glowLine.rotation.z = Math.PI / 4;
  glowLine.position.y = 0.255;
  g.add(glowLine);
  g.userData.parts = { pkg, die, glowLine };
  g.userData.size = new THREE.Vector3(S, 0.3, S);
  g.userData.slab = { w: S, h: 0.2, d: S, material: M.graphite };
  return g;
}

function headphones(theme, M, opt) {
  const g = new THREE.Group();
  const span = 1.25;
  // Headband: an arch in the x-y plane.
  const arch = new THREE.CatmullRomCurve3(
    Array.from({ length: 13 }, (_, i) => {
      const a = Math.PI * (i / 12);
      return new THREE.Vector3(-Math.cos(a) * span, 1.05 + Math.sin(a) * 1.45, 0);
    }),
  );
  const band = shadowed(new THREE.Mesh(new THREE.TubeGeometry(arch, 140, 0.075, 16, false), M.glossBlack));
  g.add(band);
  const pad = shadowed(
    new THREE.Mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(Array.from({ length: 7 }, (_, i) => {
          const a = Math.PI * (0.25 + 0.5 * (i / 6));
          return new THREE.Vector3(-Math.cos(a) * (span - 0.05), 1.05 + Math.sin(a) * 1.38, 0);
        })),
        80,
        0.11,
        14,
        false,
      ),
      M.rubber,
    ),
  );
  g.add(pad);
  const cups = [];
  for (const side of [-1, 1]) {
    const cup = new THREE.Group();
    cup.position.set(side * span, 0.95, 0);
    const shell = new THREE.Mesh(
      new THREE.LatheGeometry(
        [[0, -0.2], [0.5, -0.2], [0.62, -0.12], [0.66, 0.02], [0.6, 0.18], [0.0, 0.2]].map(([x, y]) => new THREE.Vector2(x, y)),
        64,
      ),
      M.aluminium,
    );
    shell.rotation.z = Math.PI / 2;
    shadowed(shell);
    cup.add(shell);
    const cushion = shadowed(new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.15, 20, 64), M.rubber));
    cushion.rotation.y = Math.PI / 2;
    cushion.position.x = -side * 0.27;
    cup.add(cushion);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.012, 10, 80), M.glow(5));
    ring.rotation.y = Math.PI / 2;
    ring.position.x = side * 0.05;
    cup.add(ring);
    const mic = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.03, 20), M.glow(3, C("#ffffff")));
    mic.rotation.z = Math.PI / 2;
    mic.position.set(side * 0.2, 0.3, 0.35);
    cup.add(mic);
    g.add(cup);
    cups.push({ cup, ring, mic });
  }
  g.userData.parts = { band, cups, leftCup: cups[0].cup, rightCup: cups[1].cup, mic: cups[1].mic };
  g.userData.size = new THREE.Vector3(span * 2 + 0.8, 2.6, 1.4);
  return g;
}

function speaker(theme, M) {
  const g = new THREE.Group();
  const frame = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(1, 1.05, 0.25, 64), M.darkMetal));
  frame.position.y = 0.125;
  g.add(frame);
  const cone = shadowed(
    new THREE.Mesh(
      new THREE.LatheGeometry([[0.1, 0.0], [0.3, 0.06], [0.7, 0.2], [0.86, 0.26], [0.9, 0.24]].map(([x, y]) => new THREE.Vector2(x, y)), 64),
      new THREE.MeshStandardMaterial({ color: "#1d1f24", roughness: 0.7, side: THREE.DoubleSide }),
    ),
  );
  cone.position.y = 0.06;
  g.add(cone);
  const cap = shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.22, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), M.glossBlack));
  cap.position.y = 0.1;
  g.add(cap);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.93, 0.015, 10, 90), M.glow(5));
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.3;
  g.add(ring);
  g.userData.parts = { frame, cone, cap, ring };
  g.userData.size = new THREE.Vector3(2, 0.4, 2);
  return g;
}

function mic(theme, M) {
  const g = new THREE.Group();
  const body = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.9, 48), M.darkMetal));
  body.position.y = 0.45;
  g.add(body);
  const head = shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.42, 48, 24), new THREE.MeshStandardMaterial({ color: "#8d939c", metalness: 1, roughness: 0.55, wireframe: false })));
  head.position.y = 1.2;
  g.add(head);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.335, 0.014, 10, 60), M.glow(5));
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.88;
  g.add(ring);
  g.userData.parts = { body, head, ring };
  g.userData.size = new THREE.Vector3(0.9, 1.6, 0.9);
  return g;
}

function card(theme, M, opt) {
  const g = new THREE.Group();
  const W = 3;
  const D = 1.9;
  const T = 0.04;
  const mat = new THREE.MeshPhysicalMaterial({ color: opt.color ?? "#1d2028", metalness: 0.6, roughness: 0.25, clearcoat: 1 });
  const body = rbox(W, T, D, 0.012, mat, 4);
  body.position.y = T / 2 + 0.3;
  g.add(body);
  const chipPad = rbox(0.42, 0.012, 0.32, 0.03, M.gold, 2);
  chipPad.position.set(-W * 0.3, T + 0.31, -D * 0.05);
  g.add(chipPad);
  g.userData.parts = { body, chip: chipPad };
  g.userData.size = new THREE.Vector3(W, 0.4, D);
  g.userData.slab = { w: W, h: T, d: D, material: mat };
  return g;
}

function panel(theme, M, opt) {
  const g = new THREE.Group();
  const W = 3;
  const D = 2.2;
  const T = 0.1;
  const body = rbox(W, T, D, 0.03, M.glass, 3);
  body.position.y = T / 2;
  g.add(body);
  g.userData.parts = { body };
  g.userData.size = new THREE.Vector3(W, T, D);
  g.userData.slab = { w: W, h: T, d: D, material: M.glass };
  return g;
}

function box(theme, M, opt) {
  const g = new THREE.Group();
  const s = opt.size ?? [2, 1.6, 2];
  const body = rbox(s[0], s[1], s[2], 0.08, opt.material ? M[opt.material] ?? M.darkMetal : M.darkMetal, 4);
  body.position.y = s[1] / 2;
  g.add(body);
  const seam = new THREE.Mesh(new THREE.BoxGeometry(s[0] * 1.002, 0.02, s[2] * 1.002), M.glow(4));
  seam.position.y = s[1] * 0.62;
  g.add(seam);
  g.userData.parts = { body, seam };
  g.userData.size = new THREE.Vector3(...s);
  g.userData.slab = { w: s[0], h: s[1], d: s[2], material: body.material };
  return g;
}

function cylinder(theme, M, opt) {
  const g = new THREE.Group();
  const r = opt.radius ?? 0.8;
  const h = opt.height ?? 2.2;
  const body = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 64), opt.material ? M[opt.material] ?? M.aluminium : M.aluminium));
  body.position.y = h / 2;
  g.add(body);
  const cap = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(r * 0.35, r * 0.35, 0.08, 40), M.aluminium));
  cap.position.y = h + 0.04;
  g.add(cap);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.004, r * 1.004, h * 0.18, 64, 1, true), M.glow(3));
  band.position.y = h * 0.55;
  g.add(band);
  g.userData.parts = { body, cap, band };
  g.userData.size = new THREE.Vector3(r * 2, h, r * 2);
  return g;
}

function sphere(theme, M, opt) {
  const g = new THREE.Group();
  const r = opt.radius ?? 1.1;
  const body = shadowed(new THREE.Mesh(new THREE.SphereGeometry(r, 96, 48), M.glossBlack));
  body.position.y = r;
  g.add(body);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(r * 1.0, 0.012, 10, 120), M.glow(5));
  ring.position.y = r;
  ring.rotation.x = Math.PI / 2;
  g.add(ring);
  g.userData.parts = { body, ring };
  g.userData.size = new THREE.Vector3(r * 2, r * 2, r * 2);
  return g;
}

function finger(theme, M) {
  const g = new THREE.Group();
  const shaft = shadowed(new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 2.6, 12, 32), M.skin));
  shaft.position.y = 1.58;
  g.add(shaft);
  const nail = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2.4),
    new THREE.MeshPhysicalMaterial({ color: "#f0c4b0", roughness: 0.2, clearcoat: 1 }),
  );
  nail.scale.set(1, 0.35, 1.4);
  nail.rotation.x = Math.PI / 2;
  nail.position.set(0, 0.62, 0.22);
  g.add(nail);
  g.userData.parts = { tip: shaft };
  g.userData.tip = new THREE.Vector3(0, 0.0, 0);
  return g;
}

function stylus(theme, M) {
  const g = new THREE.Group();
  const body = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 3.2, 40), M.plasticWhite));
  body.position.y = 1.9;
  g.add(body);
  const cone = shadowed(new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.3, 40), M.plasticWhite));
  cone.rotation.x = Math.PI;
  cone.position.y = 0.15;
  g.add(cone);
  const nib = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 12), M.glow(6));
  nib.position.y = 0.0;
  g.add(nib);
  g.userData.parts = { body, nib };
  g.userData.tip = new THREE.Vector3(0, 0, 0);
  return g;
}

// A solar panel on a low stand: a grid of blue cells with silver busbars, under glass, in a frame.
function solar(theme, M, opt) {
  const g = new THREE.Group();
  const W = 3.2;
  const D = 2.0;
  const cols = opt.cols ?? 6;
  const rows = opt.rows ?? 4;
  const cellTex = canvasTexture(1024, 640, (c, w, h) => {
    c.fillStyle = "#0a0f1c";
    c.fillRect(0, 0, w, h);
    const cw = w / cols;
    const ch = h / rows;
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const x = i * cw + 5;
        const y = j * ch + 5;
        const grad = c.createLinearGradient(x, y, x + cw, y + ch);
        grad.addColorStop(0, "#1d3f82");
        grad.addColorStop(1, "#0f2350");
        c.fillStyle = grad;
        c.beginPath();
        c.roundRect(x, y, cw - 10, ch - 10, 10);
        c.fill();
        c.fillStyle = "rgba(200,215,235,0.75)";
        for (let b = 1; b <= 3; b++) c.fillRect(x + ((cw - 10) * b) / 4 - 1.5, y, 3, ch - 10);
        c.fillStyle = "rgba(200,215,235,0.16)";
        for (let f = 6; f < ch - 10; f += 8) c.fillRect(x, y + f, cw - 10, 1);
      }
    }
  });
  const panel = new THREE.Group();
  const frame = rbox(W, 0.09, D, 0.03, M.aluminium, 3);
  panel.add(frame);
  const cells = new THREE.Mesh(
    new THREE.PlaneGeometry(W * 0.95, D * 0.93),
    new THREE.MeshPhysicalMaterial({ map: cellTex, metalness: 0.2, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.05, emissive: new THREE.Color("#2a5bd7"), emissiveIntensity: 0.15 }),
  );
  cells.rotation.x = -Math.PI / 2;
  cells.position.y = 0.047;
  panel.add(cells);
  panel.rotation.x = 0.5;
  panel.position.y = 0.95;
  g.add(panel);
  for (const x of [-1.1, 1.1]) {
    const front = rbox(0.08, 0.7, 0.08, 0.02, M.darkMetal, 2);
    front.position.set(x, 0.35, 0.55);
    g.add(front);
    const back = rbox(0.08, 1.3, 0.08, 0.02, M.darkMetal, 2);
    back.position.set(x, 0.65, -0.55);
    g.add(back);
  }
  g.userData.parts = { panel, cells, frame };
  g.userData.size = new THREE.Vector3(W, 1.9, D);
  g.userData.slab = { w: W, h: 0.09, d: D, material: M.aluminium };
  return g;
}

// A light bulb: glass, a glowing filament and a screw base. options.on sets the glow (0..1).
function bulb(theme, M, opt) {
  const g = new THREE.Group();
  const glass = new THREE.Mesh(
    new THREE.LatheGeometry([[0.0, 1.95], [0.32, 1.92], [0.55, 1.75], [0.62, 1.5], [0.55, 1.22], [0.36, 0.98], [0.3, 0.8]].map(([x, y]) => new THREE.Vector2(x, y)), 64),
    new THREE.MeshPhysicalMaterial({ color: "#ffffff", transparent: true, opacity: 0.22, roughness: 0.05, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false }),
  );
  g.add(glass);
  const on = opt.on ?? 1;
  const filament = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3([[-0.18, 1.2], [-0.12, 1.42], [0, 1.36], [0.12, 1.42], [0.18, 1.2]].map(([x, y]) => new THREE.Vector3(x, y, 0))), 40, 0.018, 8),
    new THREE.MeshBasicMaterial({ color: new THREE.Color("#ffc46b").multiplyScalar(1 + 7 * on), toneMapped: false }),
  );
  g.add(filament);
  const base = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.26, 0.55, 40), M.aluminium));
  base.position.y = 0.55;
  g.add(base);
  for (let i = 0; i < 4; i++) {
    const ridge = new THREE.Mesh(new THREE.TorusGeometry(0.29 - i * 0.008, 0.02, 8, 40), M.aluminium);
    ridge.rotation.x = Math.PI / 2;
    ridge.position.y = 0.38 + i * 0.11;
    g.add(ridge);
  }
  const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.08, 0.14, 24), M.darkMetal);
  tip.position.y = 0.22;
  g.add(tip);
  const lamp = new THREE.PointLight("#ffc46b", 6 * on, 6, 1.6);
  lamp.position.y = 1.35;
  g.add(lamp);
  g.userData.parts = { glass, filament, base, lamp };
  g.userData.size = new THREE.Vector3(1.3, 2.0, 1.3);
  return g;
}

export const OBJECTS = {
  solar,
  bulb,
  laptop,
  battery,
  phone,
  chip,
  headphones,
  speaker,
  mic,
  card,
  panel,
  box,
  cylinder,
  sphere,
  finger,
  stylus,
};

export function makeObject(name, theme, M, opt = {}) {
  const build = OBJECTS[name];
  if (!build) throw new Error(`No object called "${name}". Choose from ${Object.keys(OBJECTS).join(", ")}.`);
  const g = build(theme, M, opt);
  g.name = name;
  return g;
}
