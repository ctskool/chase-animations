// Runs inside every block. Gives block.js one object (window.CA) with the variables, the layout of the
// chosen output and the timing, so blocks never ask which output they are in except where the layout differs.
(function () {
  const meta = JSON.parse(document.getElementById("ca-meta").textContent);
  const hf = window.__hyperframes;
  const vars = Object.assign({}, meta.vars, hf && hf.getVariables ? hf.getVariables() : {});

  // Seeded so every render worker draws the same grain.
  function seeded(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function grainUrl(size, amount, seed) {
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const g = c.getContext("2d");
    const img = g.createImageData(size, size);
    const rnd = seeded(seed || 7);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = rnd() * 255;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = amount * 255;
    }
    g.putImageData(img, 0, 0);
    return "url(" + c.toDataURL("image/png") + ")";
  }

  // Shrinks a line of text until it fits. Called once at setup, never while animating.
  function fit(el, maxWidth, minPx) {
    let px = parseFloat(getComputedStyle(el).fontSize);
    const floor = minPx || px * 0.4;
    el.style.whiteSpace = "nowrap";
    while (el.scrollWidth > maxWidth && px > floor) {
      px -= 1;
      el.style.fontSize = px + "px";
    }
    return px;
  }

  // "$1,240" -> prefix "$", value 1240, suffix "", so a number can count up and still look like what was typed.
  function parseStat(text) {
    const m = String(text).trim().match(/^([^\d.-]*)(-?[\d,]*\.?\d+)(.*)$/);
    if (!m) return null;
    const raw = m[2];
    const dot = raw.indexOf(".");
    return {
      prefix: m[1],
      suffix: m[3],
      value: parseFloat(raw.replace(/,/g, "")),
      decimals: dot < 0 ? 0 : raw.length - dot - 1,
      commas: raw.includes(","),
    };
  }

  function formatStat(stat, value) {
    const n = stat.commas
      ? value.toLocaleString("en-US", {
          minimumFractionDigits: stat.decimals,
          maximumFractionDigits: stat.decimals,
        })
      : value.toFixed(stat.decimals);
    return stat.prefix + n + stat.suffix;
  }

  function hexToRgb(hex) {
    const h = hex.replace("#", "");
    const full = h.length === 3 ? h.replace(/./g, "$&$&") : h;
    const n = parseInt(full, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function rgba(hex, alpha) {
    return "rgba(" + hexToRgb(hex).join(",") + "," + alpha + ")";
  }

  function make(tag, cls, parent, text) {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (text !== undefined) el.textContent = text;
    if (parent) parent.appendChild(el);
    return el;
  }

  const stageEl = document.getElementById("stage");
  const s = meta.stage;
  stageEl.style.left = s.x + "px";
  stageEl.style.top = s.y + "px";
  stageEl.style.width = s.w + "px";
  stageEl.style.height = s.h + "px";
  if (s.radius) stageEl.style.borderRadius = s.radius + "px";
  document.documentElement.dataset.variant = meta.variant;

  window.CA = {
    vars,
    variant: meta.variant,
    frame: meta.frame,
    stage: s,
    safe: meta.safe,
    time: meta.time,
    alpha: meta.alpha,
    fps: meta.fps,
    seeded,
    grainUrl,
    fit,
    parseStat,
    formatStat,
    rgba,
    make,
    // Waits for the fonts, then runs the block's build function.
    ready(build) {
      const loads = meta.fonts.map((f) => document.fonts.load(f));
      window.__hf = window.__hf || {};
      window.__hf.buildReady = window.__hf.buildReady || {};
      window.__hf.buildReady.block = Promise.all(loads)
        .then(() => document.fonts.ready)
        .then(build)
        .catch((err) => {
          // A failed build otherwise renders as a silent black video.
          console.error("Block failed to build:", err);
          throw err;
        });
    },
  };
})();
