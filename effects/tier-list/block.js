CA.ready(() => {
  const { vars: V, time: T, card, fit, make } = CA;
  const $ = (id) => document.getElementById(id);
  const clamp = (n, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));
  const back = $("back");
  back.style.setProperty("--page", V.page);
  back.style.setProperty("--accent", V.accent);

  // The page is opaque except the card, where his shot shows through.
  const hole = $("tl-hole");
  Object.assign(hole.style, { left: card.x + "px", top: card.y + "px", width: card.w + "px", height: card.h + "px", borderRadius: card.r + "px" });

  const skills = [1, 2, 3, 4, 5]
    .map((i) => ({ i, name: String(V[`s${i}Name`] || "").trim(), by: String(V[`s${i}By`] || "").trim(), tier: V[`s${i}Tier`] }))
    .filter((s) => s.name);
  const find = (ref) => {
    const r = String(ref).trim().toLowerCase();
    if (!r) return null;
    return skills.find((s) => String(s.i) === r) || skills.find((s) => s.name.toLowerCase() === r)
      || skills.find((s) => s.name.toLowerCase().startsWith(r)) || null;
  };
  const placed = new Set(String(V.placed || "").split(",").map(find).filter(Boolean));
  const drop = find(V.drop || "");
  if (drop) placed.delete(drop);

  $("tl-title").textContent = V.title;
  if (drop) $("tl-num").innerHTML = `No. ${drop.i}<small>/ ${skills.length}</small>`;

  const TIERS = ["S", "A", "B", "C"];
  const COLORS = { S: V.accent, A: "#EF9C4A", B: "#E8C952", C: "#93BC78" };
  const TOP = 266;
  const ROW_H = 148;
  const GAP = 18;
  const rowsEl = $("tl-rows");
  const rows = {};
  TIERS.forEach((tier, r) => {
    const y = TOP + r * (ROW_H + GAP);
    const row = make("div", "tl-row", rowsEl);
    row.style.top = y + "px";
    const label = make("div", "tl-label", row, tier);
    label.style.background = COLORS[tier];
    const track = make("div", "tl-track", row);
    rows[tier] = { row, label, track, y };
  });

  // Every skill has a fixed home in its row (ordered by number), so the board reads the same from window to window.
  const tiles = new Map();
  const PAD = 14;
  const TRACK_W = 1008 - 160;
  for (const tier of TIERS) {
    const members = skills.filter((s) => s.tier === tier);
    const n = Math.max(2, members.length);
    const w = (TRACK_W - PAD * 2 - PAD * (n - 1)) / n;
    members.forEach((s, k) => {
      if (!placed.has(s) && s !== drop) return;
      const el = make("div", "tl-tile", rows[tier].track);
      el.style.left = PAD + k * (w + PAD) + "px";
      el.style.top = PAD + "px";
      el.style.width = w + "px";
      const nm = make("div", "tl-name", el, s.name);
      const by = make("div", "tl-by", el, s.by);
      fit(nm, w - 52, 34);
      fit(by, w - 52, 30);
      tiles.set(s, { el, homeY: rows[tier].y + PAD, tier });
    });
  }

  const K = T.key;
  const dropTile = drop ? tiles.get(drop) : null;
  // Falls from just above the frame, a touch longer the further it has to go, landing exactly on the word.
  // Starts high enough that its lifted shadow is off the frame too.
  const fallDist = dropTile ? dropTile.homeY + 230 : 0;
  const FALL = Math.min(0.26 + 0.14 * (fallDist / 1000), Math.max(0.12, K));
  const t0 = K - FALL;
  // A damped spring: starts at 0, swings to +amp, rings down.
  const ring = (dt, amp, freq, decay) => (dt <= 0 ? 0 : amp * Math.exp(-decay * dt) * Math.sin(freq * dt));
  const LIFTED = "0 2px 0 rgba(22,22,26,0.05), 0 26px 40px rgba(22,22,26,0.18)";

  function draw(t) {
    if (!dropTile) return;
    const el = dropTile.el;
    const r = rows[dropTile.tier];
    if (t < t0) {
      el.style.visibility = "hidden";
    } else if (t < K) {
      el.style.visibility = "visible";
      const p = clamp((t - t0) / FALL);
      const y = -fallDist * (1 - p * p);
      const rot = -5 * (1 - p);
      el.style.transform = `translateY(${y.toFixed(1)}px) rotate(${rot.toFixed(2)}deg) scale(1.04)`;
      el.style.boxShadow = LIFTED;
    } else {
      el.style.visibility = "visible";
      const dt = t - K;
      // Squash on impact, a little hop back up, settle.
      const squash = ring(dt, 0.08, 26, 10);
      const hop = -ring(dt - 0.04, 12, 20, 9);
      el.style.transform = `translateY(${hop.toFixed(1)}px) scale(${(1 + squash * 0.5).toFixed(3)}, ${(1 - squash).toFixed(3)})`;
      el.style.boxShadow = "";
    }
    // The row it hits takes a small jolt downward and springs back.
    const jolt = ring(t - K, 7, 30, 10);
    r.row.style.transform = `translateY(${jolt.toFixed(1)}px)`;
    const pulse = 1 + ring(t - K, 0.06, 18, 9);
    r.label.style.transform = `scale(${pulse.toFixed(3)})`;
  }

  const tl = gsap.timeline({ paused: true });
  const clock = { t: 0 };
  tl.to(clock, { t: T.duration, duration: T.duration, ease: "none", onUpdate: () => draw(clock.t) });
  draw(0);
  window.__timelines["block"] = tl;
});
