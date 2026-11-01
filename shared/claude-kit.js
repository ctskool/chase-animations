// Claude Code look for the blocks that set "claudeKit": true in block.json. Adds CA.claude.
// The colours, spinner words and mascot pixels match Claude Code's own dark theme.
(function () {
  const SVG = "http://www.w3.org/2000/svg";
  const LOGO = "m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z";

  const colors = {
    claude: "#D77757",
    shimmer: "#EB9F7F",
    ground: "#0C0C0D",
    text: "#FFFFFF",
    inactive: "#999999",
    subtle: "#505050",
    success: "#4EBA65",
    error: "#FF6B80",
    warning: "#FFC107",
    permission: "#B1B9F9",
    userMessage: "#373737",
    promptBorder: "#888888",
    diffAdded: "#225C2B",
    diffRemoved: "#7A2936",
    diffAddedWord: "#38A660",
    diffRemovedWord: "#B3596B",
  };

  const spinnerWords = ["Tinkering", "Cooking", "Brewing", "Crafting", "Forging", "Noodling", "Pondering", "Simmering", "Vibing", "Whisking"];

  function svg(parent, w, h, viewBox, cls) {
    const el = document.createElementNS(SVG, "svg");
    el.setAttribute("viewBox", viewBox);
    el.setAttribute("width", w);
    el.setAttribute("height", h);
    if (cls) el.setAttribute("class", cls);
    el.style.display = "block";
    if (parent) parent.appendChild(el);
    return el;
  }

  function node(parent, tag, attrs) {
    const el = document.createElementNS(SVG, tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    parent.appendChild(el);
    return el;
  }

  function logo(parent, px, color) {
    const el = svg(parent, px, px, "0 0 24 24", "cc-logo");
    node(el, "path", { d: LOGO, fill: color || colors.claude });
    return el;
  }

  // The pixels of Claude Code's welcome-screen mascot. Each cell is one half-block in the terminal.
  const BODY = [
    ".#########.",
    ".#########.",
    ".#########.",
    ".#########.",
    ".#########.",
    ".#########.",
  ];
  const ARMS = {
    down: [[0, 2], [0, 3], [10, 2], [10, 3]],
    up: [[0, 2], [-1, 2], [-1, 1], [-1, 0], [-1, -1], [10, 2], [11, 2], [11, 1], [11, 0], [11, -1]],
    left: [[0, 2], [-1, 2], [-1, 1], [-1, 0], [-1, -1], [10, 2], [10, 3]],
    right: [[0, 2], [0, 3], [10, 2], [11, 2], [11, 1], [11, 0], [11, -1]],
  };
  const LEGS = {
    stand: [[1, 6], [1, 7], [3, 6], [3, 7], [7, 6], [7, 7], [9, 6], [9, 7]],
    left: [[0, 6], [1, 6], [3, 6], [3, 7], [6, 6], [7, 6], [9, 6], [9, 7]],
    right: [[1, 6], [1, 7], [3, 6], [4, 6], [7, 6], [7, 7], [9, 6], [10, 6]],
  };
  const EYES = {
    open: [[2, 2, 1, 1], [8, 2, 1, 1]],
    left: [[1, 2, 1, 1], [7, 2, 1, 1]],
    right: [[3, 2, 1, 1], [9, 2, 1, 1]],
    closed: [[2, 2.6, 1, 0.4], [8, 2.6, 1, 0.4]],
  };

  // A part per pose, all stacked, so a pose change is a tl.set that any seek lands on exactly.
  function mascot(parent, cell, opts) {
    const o = opts || {};
    const body = o.color || colors.claude;
    const eye = o.eyeColor || "#000000";
    const el = document.createElement("div");
    el.className = "cc-mascot";
    el.style.cssText = `position:relative;width:${11 * cell}px;height:${8 * cell}px`;
    if (parent) parent.appendChild(el);
    const art = svg(el, 11 * cell, 8 * cell, "0 0 11 8");
    art.setAttribute("shape-rendering", "crispEdges");
    art.style.overflow = "visible";
    const parts = { arms: {}, legs: {}, eyes: {} };
    const group = () => node(art, "g", {});
    const base = group();
    BODY.forEach((row, y) => {
      [...row].forEach((c, x) => {
        if (c === "#") node(base, "rect", { x, y, width: 1, height: 1, fill: body });
      });
    });
    const addPart = (kind, name, cells) => {
      const g = group();
      cells.forEach(([x, y, w, h]) => {
        const size = { width: w === undefined ? 1 : w, height: h === undefined ? 1 : h };
        node(g, "rect", { x, y, ...size, fill: kind === "eyes" ? eye : body });
      });
      g.style.visibility = "hidden";
      parts[kind][name] = g;
    };
    Object.entries(ARMS).forEach(([k, v]) => addPart("arms", k, v));
    Object.entries(LEGS).forEach(([k, v]) => addPart("legs", k, v));
    Object.entries(EYES).forEach(([k, v]) => addPart("eyes", k, v));
    parts.arms.down.style.visibility = "visible";
    parts.legs.stand.style.visibility = "visible";
    parts.eyes.open.style.visibility = "visible";

    function pose(tl, at, next) {
      for (const kind of Object.keys(next)) {
        for (const name of Object.keys(parts[kind])) {
          tl.set(parts[kind][name], { visibility: name === next[kind] ? "visible" : "hidden", immediateRender: false }, at);
        }
      }
    }
    function blink(tl, at) {
      pose(tl, at, { eyes: "closed" });
      pose(tl, at + 0.1, { eyes: "open" });
    }
    function walk(tl, from, to, step) {
      const beat = step || 0.14;
      let leg = "left";
      for (let t = from; t < to; t += beat) {
        pose(tl, t, { legs: leg });
        leg = leg === "left" ? "right" : "left";
      }
      pose(tl, to, { legs: "stand" });
    }
    return { el, pose, blink, walk, width: 11 * cell, height: 8 * cell };
  }

  // Claude Code's spinner glyphs and marks, drawn, because the pack's mono font doesn't carry them.
  const STARS = [
    { rays: 0 },
    { rays: 4, w: 2.6, inner: 0 },
    { rays: 8, w: 1.5, inner: 0 },
    { rays: 6, w: 2.2, inner: 0 },
    { rays: 8, w: 2.4, inner: 3 },
    { rays: 12, w: 1.6, inner: 2 },
  ];

  function star(parent, frame, color) {
    const g = node(parent, "g", {});
    const s = STARS[frame];
    if (!s.rays) {
      node(g, "circle", { cx: 12, cy: 12, r: 2.2, fill: color });
      return g;
    }
    for (let i = 0; i < s.rays; i++) {
      const a = (i / s.rays) * Math.PI * 2;
      node(g, "line", {
        x1: 12 + Math.cos(a) * s.inner,
        y1: 12 + Math.sin(a) * s.inner,
        x2: 12 + Math.cos(a) * 10.5,
        y2: 12 + Math.sin(a) * 10.5,
        stroke: color,
        "stroke-width": s.w,
        "stroke-linecap": "round",
      });
    }
    return g;
  }

  function spinner(parent, px, color) {
    const el = svg(parent, px, px, "0 0 24 24", "cc-spinner");
    const c = color || colors.claude;
    const frames = STARS.map((_, i) => star(el, i, c));
    frames.forEach((f, i) => { f.style.visibility = i === 4 ? "visible" : "hidden"; });
    const show = (tl, at, i) => {
      frames.forEach((f, j) => tl.set(f, { visibility: j === i ? "visible" : "hidden", immediateRender: false }, at));
    };
    // Up through the glyphs and back, as the real spinner does.
    function run(tl, from, to, step) {
      const beat = step || 0.09;
      const cycle = [0, 1, 2, 3, 4, 5, 5, 4, 3, 2, 1, 0];
      let i = 0;
      for (let t = from; t < to; t += beat) {
        show(tl, t, cycle[i % cycle.length]);
        i += 1;
      }
    }
    function stop(tl, at) { show(tl, at, 4); }
    return { el, run, stop };
  }

  function glyph(parent, name, px, color) {
    const c = color || colors.text;
    const el = svg(parent, px, px, "0 0 24 24", "cc-glyph");
    if (name === "bullet") node(el, "circle", { cx: 12, cy: 12, r: 9, fill: c });
    if (name === "branch") node(el, "path", { d: "M6 1 V13 H21", fill: "none", stroke: c, "stroke-width": 2.4 });
    if (name === "chevron") node(el, "path", { d: "M7 3 L18 12 L7 21", fill: "none", stroke: c, "stroke-width": 3.4 });
    if (name === "tick") node(el, "path", { d: "M3 13 L9.5 20 L21 5", fill: "none", stroke: c, "stroke-width": 4, "stroke-linecap": "square" });
    if (name === "cross") node(el, "path", { d: "M5 5 L19 19 M19 5 L5 19", fill: "none", stroke: c, "stroke-width": 4, "stroke-linecap": "square" });
    return el;
  }

  CA.claude = { colors, spinnerWords, logo, mascot, spinner, glyph };
})();
