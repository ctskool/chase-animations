// Small labels on leader lines, pinned to points in a 3D scene: "CHARGE", "WIRES", "GLASS".
// The line draws out from the part, then the word rises from behind its rule.
import * as THREE from "three";

const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const easeOut = (p, k = 3) => 1 - Math.pow(1 - clamp(p), k);

export function createLabels(layer, { W, H, accent, ink = "#f4f1ea", muted = "#c9ccd1", minY = 700, maxY = 1700, side = 64 }) {
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.setAttribute("width", W);
  svg.setAttribute("height", H);
  svg.style.cssText = "position:absolute;left:0;top:0;overflow:visible;";
  layer.appendChild(svg);
  const items = [];
  const v = new THREE.Vector3();

  // anchor: an Object3D (its world position, plus offset) or a Vector3 in world space.
  // side: "left" or "right". y: screen height for the text, or null to follow the anchor.
  function add({ text, anchor, offset = null, side: s = "right", at = 0, y = null, dy = 0, size = 46, accentText = false }) {
    const el = document.createElement("div");
    el.className = "ex-label";
    el.style.fontSize = `${size}px`;
    el.style.color = accentText ? accent : ink;
    const inner = document.createElement("span");
    inner.textContent = text;
    el.appendChild(inner);
    layer.appendChild(el);
    const casing = document.createElementNS(svgNS, "path");
    casing.setAttribute("fill", "none");
    casing.setAttribute("stroke", "#000");
    casing.setAttribute("stroke-opacity", "0.5");
    casing.setAttribute("stroke-width", "6");
    casing.setAttribute("stroke-linecap", "round");
    casing.setAttribute("stroke-linejoin", "round");
    const line = document.createElementNS(svgNS, "path");
    line.setAttribute("fill", "none");
    line.setAttribute("stroke", muted);
    line.setAttribute("stroke-width", "2.6");
    line.setAttribute("stroke-linecap", "round");
    line.setAttribute("stroke-linejoin", "round");
    const dot = document.createElementNS(svgNS, "circle");
    dot.setAttribute("fill", ink);
    dot.setAttribute("stroke", "#000");
    dot.setAttribute("stroke-width", "2");
    const halo = document.createElementNS(svgNS, "circle");
    halo.setAttribute("fill", "none");
    halo.setAttribute("stroke", accent);
    halo.setAttribute("stroke-width", "3");
    svg.append(casing, line, halo, dot);
    const item = { text, anchor, offset, side: s, at, y, dy, el, inner, casing, line, dot, halo, width: 0 };
    items.push(item);
    return item;
  }

  function measure() {
    for (const it of items) {
      it.el.style.visibility = "hidden";
      it.width = it.inner.getBoundingClientRect().width;
      it.height = it.inner.getBoundingClientRect().height;
    }
  }

  function project(it, camera) {
    // The camera has moved since the last render; bring its inverse matrix up to date.
    camera.updateMatrixWorld();
    if (it.anchor && it.anchor.isObject3D) {
      it.anchor.updateWorldMatrix(true, false);
      v.copy(it.offset || new THREE.Vector3()).applyMatrix4(it.anchor.matrixWorld);
    } else v.copy(it.anchor);
    v.project(camera);
    return { x: (v.x * 0.5 + 0.5) * W, y: (-v.y * 0.5 + 0.5) * H, behind: v.z > 1 };
  }

  // local: seconds into the scene. fade: 0..1 opacity for the whole layer.
  function update(local, camera, fade = 1) {
    layer.style.opacity = String(fade);
    for (const it of items) {
      const on = local >= it.at;
      const vis = on ? "visible" : "hidden";
      it.el.style.visibility = vis;
      it.casing.style.visibility = vis;
      it.line.style.visibility = vis;
      it.dot.style.visibility = vis;
      it.halo.style.visibility = vis;
      if (!on) continue;
      const a = project(it, camera);
      const ty = clamp(it.y ?? a.y + it.dy, minY, maxY);
      const ruleY = ty + it.height * 0.5 + 8;
      const textX = it.side === "right" ? W - side - it.width : side;
      const ruleFar = it.side === "right" ? W - side : side;
      const ruleNear = it.side === "right" ? textX - 18 : textX + it.width + 18;
      const p = easeOut(clamp((local - it.at) / 0.34), 3);
      const d = `M ${a.x.toFixed(1)} ${a.y.toFixed(1)} L ${ruleNear.toFixed(1)} ${ruleY.toFixed(1)} L ${ruleFar.toFixed(1)} ${ruleY.toFixed(1)}`;
      const length = Math.hypot(ruleNear - a.x, ruleY - a.y) + Math.abs(ruleFar - ruleNear);
      for (const path of [it.casing, it.line]) {
        path.setAttribute("d", d);
        path.style.strokeDasharray = `${length.toFixed(1)} ${length.toFixed(1)}`;
        path.style.strokeDashoffset = (length * (1 - p)).toFixed(1);
      }
      it.dot.setAttribute("cx", a.x.toFixed(1));
      it.dot.setAttribute("cy", a.y.toFixed(1));
      it.dot.setAttribute("r", "7");
      const pulse = clamp((local - it.at) / 0.6);
      it.halo.setAttribute("cx", a.x.toFixed(1));
      it.halo.setAttribute("cy", a.y.toFixed(1));
      it.halo.setAttribute("r", (8 + pulse * 26).toFixed(1));
      it.halo.style.opacity = String((1 - pulse) * 0.9);
      const rise = easeOut(clamp((local - it.at - 0.12) / 0.3), 4);
      it.el.style.left = `${textX.toFixed(1)}px`;
      it.el.style.top = `${(ty - it.height * 0.5).toFixed(1)}px`;
      it.el.style.height = `${(it.height + 6).toFixed(1)}px`;
      it.inner.style.transform = `translateY(${((1 - rise) * (it.height + 6)).toFixed(1)}px)`;
    }
  }

  return { add, measure, update, items };
}
