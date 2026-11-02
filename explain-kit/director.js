// Runs one explainer: reads the timed script, builds each scene from the kit, and draws the frame
// for any time it is asked for. Scenes are cut on the speech, joined by a short flash of light,
// with captions on top and the end card last.
import * as THREE from "three";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import * as studioLib from "./studio.js";
import { materials, makeObject, usbCable } from "./props.js";
import { createCaptions } from "./captions.js";
import { createLabels } from "./labels.js";
import { makeChip, TOKEN_COLORS } from "./chips.js";

const { clamp, easeInOut, seeded } = studioLib;
const data = JSON.parse(document.getElementById("explain-data").textContent);
const W = data.width;
const H = data.height;
const fps = data.fps;
const theme = data.theme;
const root = document.getElementById("ex-root");
const TRANSITION_BEFORE = 0.1;
const TRANSITION_AFTER = 0.24;

async function build() {
  await Promise.all(data.fonts.map((f) => document.fonts.load(f)));
  await document.fonts.ready;

  const canvas = document.getElementById("ex-gl");
  const studio = createStudio();
  function createStudio() {
    return studioLib.createStudio({ canvas, W, H, pixelRatio: data.pixelRatio ?? 1.5 });
  }
  const M = materials(theme);
  let font = null;
  if (data.scenes.some((s) => s.type === "number")) {
    const json = await fetch("vendor/fonts/helvetiker_bold.typeface.json").then((r) => r.json());
    font = new FontLoader().parse(json);
  }

  // The subject sits in the lower two thirds, clear of the captions.
  function camera({ fov = 30, centerY = data.subjectY ?? 1130, near = 0.1, far = 200 } = {}) {
    const cam = new THREE.PerspectiveCamera(fov, W / H, near, far);
    cam.setViewOffset(W, H, 0, -(centerY - H / 2), W, H);
    return cam;
  }
  const pointScale = (cam) => (H * studio.pixelRatio) / (2 * Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2));

  const built = [];
  for (const [index, s] of data.scenes.entries()) {
    const layer = document.createElement("div");
    layer.className = "ex-scene-layer";
    // Laid out while the scene builds, so text can be measured; hidden with display afterwards,
    // because a child set visible would show through a hidden parent.
    layer.style.visibility = "hidden";
    root.querySelector("#ex-overlays").appendChild(layer);
    const labels = createLabels(layer, { W, H, accent: theme.accent, ink: theme.ink, muted: theme.muted });
    const kit = {
      THREE,
      RoundedBox: RoundedBoxGeometry,
      TextGeometry,
      W,
      H,
      fps,
      theme,
      M,
      font,
      rng: (salt = 0) => seeded((data.seed ?? 7) * 7919 + index * 104729 + salt),
      ...studioLib,
      makeObject: (name, opt) => makeObject(name, theme, M, opt),
      usbCable: (opt) => usbCable(theme, M, opt),
      makeChip,
      TOKEN_COLORS,
      camera,
      pointScale,
      label: (opt) => labels.add(opt),
      layer,
      accent: new THREE.Color(theme.accent),
    };
    const mod = await import(s.module);
    const info = { index, duration: s.end - s.start, start: s.start, end: s.end, cues: s.cues ?? {}, keys: s.keys ?? [], words: s.words ?? [], last: index === data.scenes.length - 1 };
    const scene = mod.default(kit, s.params ?? {}, info);
    labels.measure();
    layer.style.display = "none";
    layer.style.visibility = "";
    built.push({ ...s, info, scene, layer, labels });
  }

  const captions = createCaptions(root.querySelector("#ex-captions"), data.phrases, {
    W,
    top: data.captions.top,
    height: data.captions.height,
    size: data.captions.size,
    min: data.captions.min,
    accent: theme.accent,
  });

  const tint = new THREE.Color(theme.accent).lerp(new THREE.Color("#ffffff"), 0.3).multiplyScalar(1.4);

  function sceneAt(time) {
    let i = built.findIndex((b) => time < b.end);
    if (i < 0) i = built.length - 1;
    return i;
  }

  function renderAt(time) {
    const t = Math.max(0, Math.min(Number(time) || 0, data.duration));
    const frame = Math.round(t * fps);
    const i = sceneAt(t);
    let a = built[i];
    let b = null;
    let p = 0;
    // Near a cut, draw both sides of it.
    const next = built[i + 1];
    const prev = built[i - 1];
    if (next && t >= next.start - TRANSITION_BEFORE) {
      b = next;
      p = (t - (next.start - TRANSITION_BEFORE)) / (TRANSITION_BEFORE + TRANSITION_AFTER);
    } else if (prev && t < a.start + TRANSITION_AFTER) {
      b = a;
      a = prev;
      p = (t - (b.start - TRANSITION_BEFORE)) / (TRANSITION_BEFORE + TRANSITION_AFTER);
    }
    p = easeInOut(clamp(p));
    const shown = b ? [a, b] : [a];
    for (const s of built) {
      if (!shown.includes(s)) s.layer.style.display = "none";
    }
    for (const s of shown) {
      const local = t - s.start;
      s.scene.update(local, t);
      s.layer.style.display = "block";
      const fade = !b ? 1 : s === a ? 1 - clamp(p * 1.6) : clamp(p * 1.4 - 0.2);
      s.labels.update(local, s.scene.camera, fade);
      if (s.scene.overlay) s.scene.overlay(local, fade);
    }
    const start = clamp(t / 0.18);
    const end = clamp((data.duration - t) / 0.35);
    studio.composite({
      a: a.scene,
      b: b?.scene,
      p,
      flash: b ? 1 : 0,
      tint,
      frame,
      glow: data.glow ?? 0.85,
      fade: Math.min(start * 0.6 + 0.4, end),
    });
    captions.update(t);
  }

  window.addEventListener("hf-seek", (event) => renderAt(event.detail.time));
  renderAt(window.__hfThreeTime || 0);
  window.__explainRender = renderAt;
}

// index.html calls this and registers the timeline once it resolves.
export function start() {
  return build().catch((err) => {
    console.error("Explainer failed to build:", err);
    throw err;
  });
}
