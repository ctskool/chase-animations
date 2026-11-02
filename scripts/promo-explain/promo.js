// The promo's timeline: one paused GSAP timeline, every state set from the beat sheet in
// window.PROMO, so any frame can be drawn on its own.
function buildPromo() {
  const P = JSON.parse(document.getElementById("promo-data").textContent);
  const vars = Object.assign({ cta: P.cta, ctaSub: P.ctaSub }, window.__hyperframes && window.__hyperframes.getVariables ? window.__hyperframes.getVariables() : {});
  const K = CA.claude;
  const C = K.colors;
  const $ = (id) => document.getElementById(id);
  const el = (tag, cls, parent, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  };
  const svg = (html, parent) => {
    const wrap = el("span", "", parent);
    wrap.innerHTML = html;
    wrap.style.display = "inline-flex";
    return wrap;
  };

  // ---------------------------------------------------------------- phone
  const S = P.scale;
  const G = P.phone;
  const phone = $("phone");
  Object.assign(phone.style, { left: G.x + "px", top: G.y + "px", width: G.w + "px", height: G.h + "px" });
  for (const [side, top, h] of [["l", 300, 110], ["l", 440, 110], ["l", 230, 50], ["r", 360, 170]]) {
    const b = el("div", "side-btn", phone);
    Object.assign(b.style, { top: top + "px", height: h + "px", [side === "l" ? "left" : "right"]: "-4px" });
  }
  const wrap = $("screen-wrap");
  Object.assign(wrap.style, { left: G.bezel + "px", top: G.bezel + "px", width: 390 * S + "px", height: 844 * S + "px", borderRadius: G.screenRadius + "px" });
  const screen = $("screen");
  screen.style.transform = `scale(${S})`;

  // status bar
  const status = el("div", "status", screen);
  el("div", "time", status, "9:41");
  el("div", "camera", screen);
  svg(
    `<svg width="18" height="12" viewBox="0 0 18 12"><rect x="0" y="8" width="3" height="4" rx="1" fill="#fff"/><rect x="5" y="5.5" width="3" height="6.5" rx="1" fill="#fff"/><rect x="10" y="3" width="3" height="9" rx="1" fill="#fff"/><rect x="15" y="0" width="3" height="12" rx="1" fill="#fff"/></svg>` +
      `<svg width="17" height="12" viewBox="0 0 17 12" style="margin-left:6px"><path d="M8.5 2.2c2.6 0 5 1 6.8 2.7l1.2-1.3C14.4 1.6 11.6.4 8.5.4S2.6 1.6.5 3.6l1.2 1.3C3.5 3.2 5.9 2.2 8.5 2.2zm0 3.6c1.6 0 3.1.6 4.3 1.7l1.2-1.3C12.5 4.8 10.6 4 8.5 4s-4 .8-5.5 2.2l1.2 1.3c1.2-1.1 2.7-1.7 4.3-1.7zm0 3.6c.7 0 1.3.3 1.8.7L8.5 12 6.7 10.1c.5-.4 1.1-.7 1.8-.7z" fill="#fff"/></svg>` +
      `<svg width="27" height="13" viewBox="0 0 27 13" style="margin-left:6px"><rect x="0.5" y="0.5" width="22" height="12" rx="3.5" fill="none" stroke="rgba(255,255,255,0.45)"/><rect x="2" y="2" width="16" height="9" rx="2" fill="#fff"/><path d="M24.5 4.5v4c.8-.3 1.3-1.1 1.3-2s-.5-1.7-1.3-2z" fill="rgba(255,255,255,0.45)"/></svg>`,
    el("div", "icons", status),
  );

  // header
  const header = el("div", "header", screen);
  const menuIco = el("div", "menu-ico", header);
  for (let i = 0; i < 3; i++) el("i", "", menuIco).style.width = i === 1 ? "14px" : "20px";
  const toggle = el("div", "toggle", header);
  el("span", "", toggle, "Chat");
  el("span", "on", toggle, "Code");
  const counter = el("div", "counter", header);
  const counts = P.demos.map((_, i) => el("span", "", counter, `${i + 1}/${P.demos.length}`));
  el("div", "hairline", screen);

  // empty chat
  const welcome = el("div", "welcome", screen);
  const slot = el("div", "mascot-slot", welcome);
  const mascot = K.mascot(slot, 5.2);
  el("h2", "", welcome, "What should we explain?");
  el("p", "", welcome, "Claude Code");

  // one conversation per demo
  const convos = P.demos.map((d, i) => {
    const c = el("div", "convo", screen);
    c.style.display = "none";
    const bubble = el("div", "bubble", c);
    const name = d.command.split(" ")[0];
    el("span", "cmd", bubble, name);
    bubble.appendChild(document.createTextNode(d.command.slice(name.length)));
    const line = el("div", "statusline", c);
    const busy = el("div", "busy", line);
    const spin = K.spinner(busy, 16, C.claude);
    const words = el("span", "shimmer", busy, `Animating with ${name}…`);
    const done = el("div", "done", line);
    K.glyph(done, "tick", 13, C.success);
    el("span", "", done, `${d.slug}.mp4`);
    const card = el("div", "card", c);
    const ph = el("div", "ph", card);
    const lines = el("div", "ph-lines", ph);
    [70, 92, 54].forEach((w) => (el("i", "", lines).style.width = w + "%"));
    // The video is authored in index.html, so HyperFrames finds and extracts it; it moves in here.
    card.appendChild($(`demo-video-${i}`));
    const flash = el("div", "flash", card);
    const cap = el("div", "caption", c);
    el("div", "t", cap, d.title);
    el("div", "pill", cap, d.line);
    el("div", "w", cap, "with Claude Code");
    return { c, bubble, busy, spin, words, done, card, ph, flash, cap };
  });

  // dock: slash menu, message box, keyboard
  const dock = el("div", "dock", screen);
  dock.style.height = "844px";
  const menu = el("div", "slashmenu", dock);
  const ico = el("div", "ico", menu);
  K.logo(ico, 22, C.claude);
  const menuText = el("div", "", menu);
  el("div", "name", menuText, "/explain");
  el("div", "desc", menuText, "Narrated 3D explainer");
  el("div", "kbd", menu, "tab");
  const box = el("div", "inputbox", dock);
  const placeholder = el("span", "placeholder", box, "Reply to Claude…");
  const typedEls = P.demos.map((d) => {
    const t = el("span", "typed", box);
    const name = d.command.split(" ")[0];
    return [...d.command].map((ch, k) => {
      const s = el("span", k < name.length ? "cmd" : "", t, ch);
      return s;
    });
  });
  const caret = el("span", "caret", box);
  const send = el("div", "sendbtn", box);
  const sendOn = el("div", "on", send);
  svg(`<svg width="16" height="16" viewBox="0 0 16 16"><path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`, send);

  const kb = el("div", "keyboard", dock);
  const keys = {};
  const rows = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
  const kw = 32.4;
  const gap = 6;
  rows.forEach((r, ri) => {
    const row = el("div", "krow", kb);
    row.style.top = 8 + ri * 54 + "px";
    const width = r.length * kw + (r.length - 1) * gap;
    const x0 = (390 - width) / 2;
    [...r].forEach((ch, i) => {
      const k = el("div", "key", row, ch);
      k.style.left = x0 + i * (kw + gap) + "px";
      k.style.width = kw + "px";
      keys[ch] = { el: k, x: x0 + i * (kw + gap), y: 8 + ri * 54 };
    });
    if (ri === 2) {
      const shift = el("div", "key fn", row);
      Object.assign(shift.style, { left: "3px", width: "42px" });
      svg(`<svg width="18" height="18" viewBox="0 0 18 18"><path d="M9 2 2 9h4v6h6V9h4z" fill="none" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>`, shift);
      const del = el("div", "key fn", row);
      Object.assign(del.style, { right: "3px", width: "42px" });
      svg(`<svg width="22" height="16" viewBox="0 0 22 16"><path d="M7 1h13v14H7L1 8z" fill="none" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/><path d="m10 5 6 6m0-6-6 6" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/></svg>`, del);
    }
  });
  const last = el("div", "krow", kb);
  last.style.top = 8 + 3 * 54 + "px";
  const k123 = el("div", "key fn", last, "123");
  Object.assign(k123.style, { left: "3px", width: "42px" });
  const kEmoji = el("div", "key fn", last);
  Object.assign(kEmoji.style, { left: "51px", width: "42px" });
  svg(`<svg width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8.2" fill="none" stroke="#fff" stroke-width="1.5"/><circle cx="7.2" cy="8" r="1.1" fill="#fff"/><circle cx="12.8" cy="8" r="1.1" fill="#fff"/><path d="M6.3 11.8c1 1.6 2.2 2.3 3.7 2.3s2.7-.7 3.7-2.3" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/></svg>`, kEmoji);
  const space = el("div", "key", last, "space");
  Object.assign(space.style, { left: "99px", width: "192px", fontSize: "15.5px" });
  keys[" "] = { el: space };
  const ret = el("div", "key fn", last, "return");
  Object.assign(ret.style, { left: "297px", width: "90px" });
  el("div", "homebar", kb);
  // the home indicator stays when the keyboard is down
  el("div", "homebar", screen).style.zIndex = "5";
  const pops = {};
  for (const ch of "abcdefghijklmnopqrstuvwxyz") {
    const k = keys[ch];
    const pop = el("div", "pop", kb);
    Object.assign(pop.style, { left: k.x + kw / 2 - 27 + "px", top: k.y - 58 + "px" });
    el("div", "stem", pop);
    el("div", "cap", pop, ch);
    pops[ch] = pop;
  }

  // ---------------------------------------------------------------- end card
  const end = $("end");
  const cta = el("div", "", end);
  cta.id = "cta";
  const tag = el("div", "tag", cta);
  K.logo(tag, 34, C.claude);
  el("span", "", tag, "/explain");
  const h1 = el("h1", "", cta, String(vars.cta));
  const sub = el("div", "sub", cta, String(vars.ctaSub));
  const row = el("div", "", end);
  row.id = "row";
  const tiles = P.carousel.map((c, i) => {
    const t = el("div", "tile", row);
    t.style.left = i * 445 + "px";
    t.appendChild($(`end-video-${i}`));

    return t;
  });
  // fit a long CTA: each line given in the text stays on one line
  const lines = String(vars.cta).split("\n").length;
  h1.style.fontSize = "112px";
  let px = 112;
  while ((h1.scrollWidth > 960 || h1.offsetHeight > px * 1.08 * lines) && px > 56) {
    px -= 2;
    h1.style.fontSize = px + "px";
  }

  // ---------------------------------------------------------------- timeline
  const tl = gsap.timeline({ paused: true });
  const T = P.timeline;
  const stage = $("stage");
  const set = (target, vars, at) => tl.set(target, { ...vars, immediateRender: false }, at);

  // Intro: the phone rises into place.
  tl.fromTo(stage, { y: 90, scale: 0.94, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.55, ease: "power3.out" }, 0);
  K.mascot && mascot.blink(tl, 0.9);

  const kbOpen = 0;
  const kbClosed = 262;
  const SCROLL = 70;
  const origin = (i) => {
    const cx = G.x + G.bezel + (35 + 160) * S;
    // the result card's centre once the chat has scrolled up
    const cy = G.y + G.bezel + (104 + 106 - SCROLL + 277.5) * S;
    return `${cx}px ${cy}px`;
  };
  stage.style.transformOrigin = origin(0);

  T.demos.forEach((d, i) => {
    const cv = convos[i];
    const chars = typedEls[i];
    // counter and a fresh chat
    counts.forEach((c, j) => set(c, { display: j === i ? "inline" : "none" }, d.start));
    if (i > 0) {
      set(convos[i - 1].c, { display: "none" }, d.start);
      tl.fromTo(welcome, { opacity: 0 }, { opacity: 1, duration: 0.2, immediateRender: false }, d.start);
      tl.to(dock, { y: kbOpen, duration: 0.28, ease: "power3.out" }, d.start);
      tl.to(kb, { y: 0, opacity: 1, duration: 0.24, ease: "power3.out" }, d.start);
      tl.to(stage, { y: 0, scale: 1, duration: 0.3, ease: "power2.inOut" }, d.start);
    }
    set(placeholder, { display: "inline" }, d.start);
    set(caret, { display: "inline-block", opacity: 1 }, d.start);
    set(sendOn, { opacity: 0 }, d.start);
    // caret blinks while idle before the first key
    for (let b = d.start + 0.25; b < d.chars[0].at - 0.05; b += 0.5) {
      set(caret, { opacity: 0 }, b);
      set(caret, { opacity: 1 }, Math.min(b + 0.25, d.chars[0].at - 0.01));
    }
    set(placeholder, { display: "none" }, d.chars[0].at);
    set(sendOn, { opacity: 1 }, d.chars[0].at);
    d.chars.forEach((c, k) => {
      set(chars[k], { display: "inline" }, c.at);
      const key = keys[c.ch.toLowerCase()];
      const next = d.chars[k + 1] ? d.chars[k + 1].at : c.at + 0.1;
      const up = Math.min(c.at + 0.09, next - 0.005);
      if (key) {
        set(key.el, { backgroundColor: c.ch === " " ? "#8c8b90" : "#8c8b90" }, c.at);
        set(key.el, { backgroundColor: c.ch === " " ? "#6b6a6f" : "#6b6a6f" }, up);
      }
      const pop = pops[c.ch.toLowerCase()];
      if (pop) {
        set(pop, { display: "block" }, c.at);
        set(pop, { display: "none" }, up);
      }
    });
    // the slash menu
    tl.fromTo(menu, { opacity: 0, scale: 0.92, y: 8 }, { opacity: 1, scale: 1, y: 0, duration: 0.16, ease: "back.out(2)", immediateRender: false }, d.menuOn + 0.03);
    tl.to(menu, { opacity: 0, scale: 0.96, duration: 0.1 }, d.menuOff);
    // send
    tl.fromTo(send, { scale: 1 }, { scale: 0.82, duration: 0.06, yoyo: true, repeat: 1, immediateRender: false }, d.send - 0.06);
    chars.forEach((s) => set(s, { display: "none" }, d.send));
    set(placeholder, { display: "inline" }, d.send);
    set(sendOn, { opacity: 0 }, d.send);
    set(caret, { display: "none" }, d.send);
    tl.to(dock, { y: kbClosed, duration: 0.32, ease: "power3.inOut" }, d.send);
    tl.to(stage, { y: P.camera.waitY, duration: 0.4, ease: "power2.inOut" }, d.send);
    tl.to(kb, { y: 90, opacity: 0, duration: 0.3, ease: "power2.in" }, d.send);
    tl.to(welcome, { opacity: 0, duration: 0.15 }, d.send);
    set(cv.c, { display: "block" }, d.send);
    tl.fromTo(cv.bubble, { opacity: 0, y: 26, scale: 0.94 }, { opacity: 1, y: 0, scale: 1, duration: 0.26, ease: "back.out(1.6)", immediateRender: false }, d.send + 0.04);
    // working
    set(cv.busy, { display: "none" }, 0);
    set(cv.done, { display: "none" }, 0);
    set(cv.busy, { display: "flex" }, d.status);
    cv.spin.run(tl, d.status, d.result, 0.08);
    tl.fromTo(cv.words, { backgroundPosition: "100% 0" }, { backgroundPosition: "-100% 0", duration: 0.9, ease: "none", repeat: Math.max(0, Math.floor((d.result - d.status) / 0.9)), immediateRender: false }, d.status);
    tl.fromTo(cv.card, { opacity: 0, y: 18, scale: 0.97 }, { opacity: 1, y: 0, scale: 0.97, duration: 0.25, ease: "power2.out", immediateRender: false }, d.status + 0.05);
    tl.fromTo(cv.ph, { backgroundPosition: "130% 0" }, { backgroundPosition: "-30% 0", duration: 0.8, ease: "none", repeat: Math.max(0, Math.floor((d.result - d.status) / 0.8)), immediateRender: false }, d.status);
    set(cv.cap, { opacity: 0 }, 0);
    // the result
    set(cv.busy, { display: "none" }, d.result);
    set(cv.done, { display: "flex" }, d.result);
    set(cv.ph, { display: "none" }, d.result);
    tl.fromTo(cv.flash, { opacity: 0.25 }, { opacity: 0, duration: 0.2, ease: "power2.out", immediateRender: false }, d.result);
    tl.fromTo(cv.card, { scale: 0.97 }, { scale: 1, duration: 0.4, ease: "back.out(1.8)", immediateRender: false }, d.result);
    tl.fromTo(cv.cap, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.3, ease: "power2.out", immediateRender: false }, d.result + 0.15);
    // the chat scrolls the new card up as it appears, and the camera pushes in on the result
    tl.to(cv.c, { y: -SCROLL, duration: 0.45, ease: "power3.out" }, d.result);
    tl.to(stage, { y: P.camera.resultY, scale: P.camera.resultScale, duration: Math.min(0.8, d.seconds * 0.35), ease: "power2.out" }, d.result);
  });
  // first chat starts on the welcome screen, with no menu up
  set(welcome, { opacity: 1 }, 0);
  set(menu, { opacity: 0 }, 0);

  // End card.
  tl.to(stage, { scale: 0.86, y: 120, opacity: 0, duration: 0.45, ease: "power2.in" }, T.endStart - 0.05);
  tl.to(end, { opacity: 1, duration: 0.35, ease: "power2.out" }, T.endStart + 0.1);
  tl.fromTo(cta, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power3.out", immediateRender: false }, T.endStart + 0.15);
  // the row drifts left through its middle tile, which is centred halfway through the card
  const rowW = P.carousel.length * 445 - 40;
  const mid = 540 - rowW / 2;
  tl.fromTo(row, { x: mid + 170 }, { x: mid - 170, duration: T.duration - T.endStart, ease: "none", immediateRender: false }, T.endStart);
  tiles.forEach((t, i) => tl.fromTo(t, { y: 80, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: "power3.out", immediateRender: false }, T.endStart + 0.2 + i * 0.07));
  tl.fromTo(sub, { opacity: 0 }, { opacity: 1, duration: 0.4, immediateRender: false }, T.endStart + 0.45);
  tl.set({}, {}, T.duration);

  window.__timelines["promo"] = tl;
}

// Fonts first: the CTA is measured to fit. The timeline is registered when the build is done.
window.__hf = window.__hf || {};
window.__hf.buildReady = window.__hf.buildReady || {};
window.__hf.buildReady.promo = Promise.all(["800 112px 'Inter Tight'", "400 22px Inter", "500 22px Inter", "600 22px Inter", "italic 400 22px Inter", "500 34px 'JetBrains Mono'"].map((f) => document.fonts.load(f)))
  .then(() => document.fonts.ready)
  .then(buildPromo)
  .catch((err) => {
    console.error("Promo failed to build:", err);
    throw err;
  });
