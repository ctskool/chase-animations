CA.ready(() => {
  const { vars: V, time: T, head, make } = CA;
  const $ = (id) => document.getElementById(id);
  const clamp = (n, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));
  const ease = (p) => 1 - Math.pow(1 - clamp(p), 3);
  // Lands a little past its rest and comes back: the "weight" on arrival.
  const settle = (p) => {
    const x = clamp(p) - 1;
    const s = 1.55;
    return 1 + (s + 1) * x * x * x + s * x * x;
  };

  const back = $("gw-back");
  const front = $("gw-front");
  if (CA.layer === "back") front.style.display = "none";
  if (CA.layer === "front") back.style.display = "none";

  const root = document.documentElement.style;
  root.setProperty("--gw-fill", clamp(Number(V.fill), 0.05, 0.6));
  root.setProperty("--gw-dot", V.dot);

  const h0 = head(0);
  const K = T.key;
  const end = T.duration;
  const follow = clamp(Number(V.follow), 0, 1);
  const STAR = '<svg viewBox="0 0 24 24"><path d="M12 2.2l2.9 6.1 6.7.8-4.9 4.6 1.2 6.6L12 17.1l-5.9 3.2 1.2-6.6-4.9-4.6 6.7-.8z"/></svg>';

  const items = [];
  // spec: where it rests at the start, which layer, which side its text hugs, when it starts dropping in.
  function add(el, layer, spec) {
    (layer === "front" ? front : back).appendChild(el);
    items.push({ el, ...spec, w: el.offsetWidth, h: el.offsetHeight });
  }
  function inkOf(kind) {
    return kind === "light" ? V.inkLight : V.inkDark;
  }

  function skill(text, side, ink) {
    const [name = "", by = "", stars = ""] = String(text || "").split("|").map((s) => s.trim());
    const el = make("div", `gw-card gw-skill gw-${side}${ink === "light" ? " gw-light" : ""}`);
    el.style.setProperty("--gw-ink", inkOf(ink));
    // Laid out like a repo widget: owner, name, stars.
    const b = make("div", "gw-by", el, by || " ");
    const n = make("div", "gw-name", el, name);
    const st = make("div", "gw-stars", el);
    st.innerHTML = STAR;
    make("span", "", st, stars);
    return { el, n, b };
  }

  const hw = h0.w;
  const cx = h0.cx;
  const top = h0.top;
  const fitX = (x, w) => clamp(x, 24, 1080 - 24 - w);

  // The stat card sits above his head; its lower middle goes behind his hair.
  const stat = make("div", "gw-card gw-stat gw-light");
  stat.style.setProperty("--gw-ink", V.inkLight);
  make("div", "gw-num", stat, String(V.stat || ""));
  make("div", "gw-lab", stat, String(V.statLabel || ""));
  back.appendChild(stat);
  add(stat, "back", { x: fitX(cx - stat.offsetWidth / 2, stat.offsetWidth), y: top - 158, rot: 0, at: 0.18 });

  // Four skills behind him, two each side, their inner edges tucked behind his head. Text hugs the outer edge.
  const inner = hw * 0.5 - 95;
  const backCards = [
    [V.card1, "l", "dark", top + 82, 0.3],
    [V.card2, "r", "light", top + 112, 0.42],
    [V.card3, "l", "dark", top + 300, 0.54],
    [V.card4, "r", "light", top + 330, 0.66],
  ];
  for (const [text, side, ink, y, at] of backCards) {
    const { el, n, b } = skill(text, side, ink);
    back.appendChild(el);
    CA.fit(n, 300, 36);
    CA.fit(b, 300, 34);
    const w = el.offsetWidth;
    const x = side === "l" ? cx - inner - w : cx + inner;
    add(el, "back", { x: fitX(x, w), y, rot: side === "l" ? -2.5 : 2.5, at });
  }

  // One in front, low on the left, clear of his face and the mic.
  {
    const { el, n } = skill(V.card5, "l", "light");
    front.appendChild(el);
    CA.fit(n, 372, 36);
    const w = el.offsetWidth;
    add(el, "front", { x: fitX(cx - 90 - w, w), y: h0.chin + 140, rot: -2.5, at: 0.78, follow: 1.4 });
  }

  // The pill lands on the key word.
  const pill = make("div", "gw-card gw-pill gw-light");
  pill.style.setProperty("--gw-ink", V.inkLight);
  make("div", "gw-dot", pill);
  make("span", "", pill, String(V.pill || ""));
  back.appendChild(pill);
  add(pill, "back", { x: fitX(cx - pill.offsetWidth / 2, pill.offsetWidth), y: top - 250, rot: 0, at: Math.max(0.9, K - 0.32) });

  // Earlier cards sit on top, so a later one dropping past them falls behind, not across their text.
  items.forEach((it, i) => {
    it.phase = i * 1.37;
    it.el.style.zIndex = String(items.length - i);
  });

  function draw(t) {
    const h = head(t);
    const out = ease((end - t) / 0.35);
    for (const it of items) {
      const p = (t - it.at) / 0.62;
      if (p <= 0) { it.el.style.opacity = "0"; continue; }
      const s = settle(p);
      const f = follow * (it.follow || 1);
      const fx = Math.cos(t * 1.9 + it.phase) * 3;
      const fy = Math.sin(t * 2.1 + it.phase) * 5;
      const x = it.x + (h.cx - h0.cx) * f + fx;
      const y = it.y + (h.top - h0.top) * f + fy - 90 * (1 - s) - (1 - out) * 26;
      const rot = it.rot * (1 - s);
      const sc = (0.95 + 0.05 * ease(p)) * (1 - (1 - out) * 0.03);
      it.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${rot.toFixed(2)}deg) scale(${sc.toFixed(4)})`;
      it.el.style.opacity = (ease((t - it.at) / 0.22) * out).toFixed(3);
    }
  }

  const tl = gsap.timeline({ paused: true });
  const clock = { t: 0 };
  tl.to(clock, { t: end, duration: end, ease: "none", onUpdate: () => draw(clock.t) });
  draw(0);
  window.__timelines["block"] = tl;
});
