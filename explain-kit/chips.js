// Glowing text chips in 3D: tokens, words, labels on things. Used by the tokens, network and rank
// scenes, and by any custom scene that needs a word as an object.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

export const TOKEN_COLORS = ["#7FB2FF", "#FF9E7A", "#8FE08A", "#E2A3FF", "#FFD36E", "#6FE3D6", "#FF8FB5"];

const measure = document.createElement("canvas").getContext("2d");

function textTexture(text, { font = "700 132px Inter", color = "#ffffff", pad = 40, h = 200 } = {}) {
  measure.font = font;
  const w = Math.ceil(measure.measureText(text).width + pad * 2);
  const c = document.createElement("canvas");
  c.width = Math.max(64, w);
  c.height = h;
  const g = c.getContext("2d");
  g.font = font;
  g.fillStyle = color;
  g.textBaseline = "middle";
  g.textAlign = "center";
  g.fillText(text, c.width / 2, h * 0.53);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return { texture: t, aspect: c.width / h };
}

// A chip: a dark glassy rounded block, the text on its face, and a glowing underline in its colour.
// Returns a Group with userData.width, and setGlow(0..1) / setColor(hex) for animating.
export function makeChip(text, { color = "#7FB2FF", height = 0.62, depth = 0.24, font, minWidth = 0.5 } = {}) {
  const g = new THREE.Group();
  const label = String(text).replace(/ /g, " ");
  const { texture, aspect } = textTexture(label.trim() ? label : "␣", { font });
  const textH = height * 0.62;
  const width = Math.max(minWidth, textH * aspect * 0.86 + height * 0.2);
  const tint = new THREE.Color(color);
  const body = new THREE.Mesh(
    new RoundedBoxGeometry(width, height, depth, 4, Math.min(0.1, height * 0.2)),
    new THREE.MeshPhysicalMaterial({ color: "#14161c", metalness: 0.3, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.15, emissive: tint.clone(), emissiveIntensity: 0.12 }),
  );
  body.castShadow = true;
  body.receiveShadow = true;
  g.add(body);
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(textH * aspect * 0.86, textH),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, toneMapped: false, color: new THREE.Color(1.6, 1.6, 1.6) }),
  );
  face.position.z = depth / 2 + 0.002;
  face.position.y = height * 0.04;
  g.add(face);
  const bar = new THREE.Mesh(new THREE.PlaneGeometry(width * 0.72, height * 0.055), new THREE.MeshBasicMaterial({ color: tint.clone().multiplyScalar(4), toneMapped: false }));
  bar.position.set(0, -height * 0.33, depth / 2 + 0.003);
  g.add(bar);
  const rim = new THREE.Mesh(
    new RoundedBoxGeometry(width + 0.04, height + 0.04, depth * 0.6, 4, Math.min(0.11, height * 0.22)),
    new THREE.MeshBasicMaterial({ color: tint.clone().multiplyScalar(2), transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }),
  );
  rim.position.z = -depth * 0.1;
  g.add(rim);
  g.userData.width = width;
  g.userData.height = height;
  g.userData.parts = { body, face, bar, rim };
  g.userData.setGlow = (k) => {
    body.material.emissiveIntensity = 0.12 + 0.6 * k;
    rim.material.opacity = 0.55 * k;
  };
  g.userData.setColor = (hex, k = 1) => {
    const c = new THREE.Color(hex);
    body.material.emissive.copy(c);
    bar.material.color.copy(c).multiplyScalar(4 * k);
    rim.material.color.copy(c).multiplyScalar(2);
  };
  return g;
}
