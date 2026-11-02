// Narration captions: two to four words at a time in the upper third, each word appearing on the
// frame it is spoken, and the phrase's key word framed by a design-tool selection box.
// Everything is set from the time alone, so any frame can be drawn in any order.

const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const easeOut = (p, k = 3) => 1 - Math.pow(1 - clamp(p), k);
const back = (p, s = 2) => {
  p = clamp(p);
  return 1 + (s + 1) * Math.pow(p - 1, 3) + s * Math.pow(p - 1, 2);
};

export function createCaptions(root, phrases, { W = 1080, top = 300, height = 330, side = 70, size = 82, min = 56, accent = "#ff7a2f", ink = "#ffffff" } = {}) {
  const layer = document.createElement("div");
  layer.className = "ex-captions";
  layer.style.cssText = `position:absolute;left:0;top:${top}px;width:${W}px;height:${height}px;pointer-events:none;`;
  root.appendChild(layer);
  const maxW = W - side * 2;

  const built = phrases.map((p, index) => {
    // A phrase handing straight over to the next one swaps on the frame; only a phrase before a pause fades.
    const next = phrases[index + 1];
    p = { ...p, fades: !next || next.show - p.hide > 0.05 };
    const el = document.createElement("div");
    el.className = "ex-phrase";
    el.style.cssText = `position:absolute;left:${side}px;width:${maxW}px;top:0;height:${height}px;display:flex;align-items:center;justify-content:center;visibility:hidden;`;
    const line = document.createElement("div");
    line.className = "ex-line";
    line.style.fontSize = `${size}px`;
    el.appendChild(line);
    const words = p.words.map((w, i) => {
      const span = document.createElement("span");
      span.className = "ex-word" + (w.key ? " ex-key" : "");
      span.textContent = w.text;
      line.appendChild(span);
      if (i < p.words.length - 1) line.appendChild(document.createTextNode(" "));
      return { el: span, ...w };
    });
    layer.appendChild(el);
    // Fit: one line if it can be read at a good size, otherwise two lines.
    el.style.visibility = "hidden";
    let px = size;
    line.style.whiteSpace = "nowrap";
    // Shrink a little to stay on one line; past that, two lines at a bigger size read better.
    const floor = Math.max(min, Math.round(size * 0.82));
    while (line.scrollWidth > maxW && px > floor) {
      px -= 2;
      line.style.fontSize = `${px}px`;
    }
    if (line.scrollWidth > maxW) {
      line.style.whiteSpace = "normal";
      px = Math.max(min, Math.round(size * 0.9));
      line.style.fontSize = `${px}px`;
      while (line.scrollHeight > height && px > min) {
        px -= 2;
        line.style.fontSize = `${px}px`;
      }
    }
    // The selection box hugs the key word or words.
    const keyEls = words.filter((w) => w.key);
    let box = null;
    if (keyEls.length) {
      const lineRect = line.getBoundingClientRect();
      const rects = keyEls.map((w) => w.el.getBoundingClientRect());
      const l = Math.min(...rects.map((r) => r.left)) - lineRect.left;
      const r = Math.max(...rects.map((r) => r.right)) - lineRect.left;
      const t = Math.min(...rects.map((r) => r.top)) - lineRect.top;
      const b = Math.max(...rects.map((r) => r.bottom)) - lineRect.top;
      const padX = px * 0.16;
      const padTop = px * 0.02;
      const padBottom = px * 0.0;
      box = document.createElement("div");
      box.className = "ex-box";
      box.style.cssText = `left:${(l - padX).toFixed(1)}px;top:${(t - padTop).toFixed(1)}px;width:${(r - l + padX * 2).toFixed(1)}px;height:${(b - t + padTop + padBottom).toFixed(1)}px;border-color:${accent};`;
      for (const corner of ["tl", "tr", "bl", "br"]) {
        const h = document.createElement("i");
        h.className = `ex-handle ex-${corner}`;
        h.style.borderColor = accent;
        box.appendChild(h);
      }
      line.appendChild(box);
    }
    return { p, el, line, words, box, keyStart: keyEls.length ? keyEls[0].start : null };
  });

  function update(time) {
    for (const b of built) {
      const { p } = b;
      const on = time >= p.show && time < p.hide;
      // display, not visibility: a child set visible would show through a hidden parent.
      b.el.style.display = on ? "flex" : "none";
      if (!on) continue;
      const out = p.fades ? clamp((time - (p.hide - 0.1)) / 0.1) : 0;
      b.el.style.opacity = String(1 - out);
      for (const w of b.words) {
        const at = w.start - 0.03;
        const k = clamp((time - at) / 0.14);
        const visible = time >= at;
        w.el.style.visibility = visible ? "visible" : "hidden";
        if (!visible) continue;
        const s = 0.82 + 0.18 * back(k, 2.4);
        const y = (1 - easeOut(k, 3)) * 18;
        w.el.style.transform = `translateY(${y.toFixed(2)}px) scale(${s.toFixed(4)})`;
        w.el.style.opacity = String(clamp(k * 2.2));
      }
      if (b.box) {
        const at = b.keyStart - 0.03;
        const k = clamp((time - at) / 0.22);
        const visible = time >= at;
        b.box.style.visibility = visible ? "visible" : "hidden";
        if (visible) {
          const s = 1.18 - 0.18 * easeOut(k, 4);
          b.box.style.transform = `scale(${s.toFixed(4)})`;
          b.box.style.opacity = String(clamp(k * 3));
        }
      }
    }
  }

  return { update, layer };
}
