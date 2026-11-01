CA.ready(() => {
  const {
    vars: V, stage: S, safe, time: T, variant,
    make, fit, rgba, grainUrl, seeded,
  } = CA;
  const KIT = CA.claude;
  const $ = (id) => document.getElementById(id);
  const stageEl = $("stage");
  const W = S.w;
  const H = S.h;
  const D = T.design;
  const compact = variant !== "full";
  const minText = compact ? 32 : 40;
  const hasPal = V.showMascot !== false;
  const hasLogo = V.showLogo !== false;
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const rad = (angle) => angle * Math.PI / 180;
  const rnd = seeded(47);
  const rawAttempts = Number(V.attempts);
  const attempts = Number.isFinite(rawAttempts)
    ? clamp(Math.round(rawAttempts), 1, 8)
    : 4;
  const tl = gsap.timeline({ paused: true });
  const build = gsap.timeline();
  const entryDesign = 0.22;

  const layouts = {
    full: {
      side: 50, top: 230, bottom: 300, rim: 18,
      logo: 72, title: 72, headerGap: 18,
      radius: 478, track: 88, crownGap: 16,
      nodeW: 284, nodeH: 112, nodeFont: 66, checkFont: 56,
      nodePad: 18, nodeBorder: 3, nodeSide: 28,
      nodeGap: 18, drop: 12, glyph: 44,
      cell: 26, label: 54, number: 430, countGap: 14,
      countLift: 8, pass: 280, stat: 58, statGap: 24,
      line: 64, footerGap: 32, resultDrop: 60, resultGap: 24,
      trail: 58, gap: 40, pulse: 172, bounce: 34, pixel: 14,
      step: 0.19,
    },
    top: {
      side: 36, top: 28, bottom: 24, rim: 22,
      logo: 56, title: 56, headerGap: 14,
      radius: 420, track: 72, crownGap: 8,
      nodeW: 244, nodeH: 92, nodeFont: 52, checkFont: 46,
      nodePad: 14, nodeBorder: 3, nodeSide: 24,
      nodeGap: 14, drop: 0, glyph: 36,
      cell: 20, label: 44, number: 320, countGap: 10,
      countLift: 0, pass: 238, stat: 48, statGap: 16,
      line: 50, footerGap: 18, resultDrop: 28, resultGap: 18,
      trail: 48, gap: 43, pulse: 146, bounce: 32, pixel: 11,
      step: 0.20,
    },
    overlay: {
      side: 38, top: 30, bottom: 28, rim: 24,
      logo: 56, title: 58, headerGap: 16,
      radius: 416, track: 76, crownGap: 8,
      nodeW: 252, nodeH: 94, nodeFont: 54, checkFont: 48,
      nodePad: 14, nodeBorder: 3, nodeSide: 26,
      nodeGap: 16, drop: 0, glyph: 38,
      cell: 21, label: 44, number: 324, countGap: 10,
      countLift: 0, pass: 242, stat: 48, statGap: 18,
      line: 50, footerGap: 18, resultDrop: 28, resultGap: 20,
      trail: 50, gap: 44, pulse: 152, bounce: 34, pixel: 12,
      step: 0.195,
    },
  };
  const M = { ...(layouts[variant] || layouts.full) };

  if (compact) {
    const f = clamp(H / 960, 0.62, 1.12);
    [
      "title", "nodeFont", "checkFont", "label", "stat", "line",
    ].forEach((key) => {
      M[key] = Math.max(minText, M[key] * f);
    });
    M.logo = Math.max(40, M.logo * f);
    M.nodeH = Math.max(66, M.nodeH * f);
    M.glyph = Math.max(30, M.glyph * f);
    M.cell = Math.max(12, M.cell * f);
    M.track = Math.max(48, M.track * f);
    M.trail = Math.max(30, M.trail * f);
    M.number *= f;
    M.pass *= f;
    M.statGap = Math.max(12, M.statGap * f);
    M.footerGap = Math.max(12, M.footerGap * f);
    M.nodeGap = Math.max(10, M.nodeGap * f);
    M.resultDrop *= f;
    M.resultGap = Math.max(12, M.resultGap * f);
    M.pixel = Math.max(8, M.pixel * f);
  }

  const inner = W - M.side * 2;
  const top = compact ? M.top : Math.max(M.top, Number(safe.top) || 0);
  const bottom = H - (
    compact ? M.bottom : Math.max(M.bottom, Number(safe.bottom) || 0)
  );

  stageEl.style.background = V.ground;
  stageEl.style.setProperty("--al-ground", V.ground);
  stageEl.style.setProperty("--al-track", V.track);
  $("al-ground").style.background = V.ground;
  $("al-glow").style.background =
    `radial-gradient(circle at 50% 50%, ${rgba(V.accent, 0.18)}, transparent 69%)`;
  $("al-grain").style.backgroundImage = grainUrl(180, 0.45, 31);

  const header = $("al-header");
  header.style.cssText +=
    `;left:${M.side}px;top:${top}px;width:max-content;max-width:${inner}px;height:${M.logo}px`;

  if (hasLogo) {
    KIT.logo($("al-logo"), M.logo, V.accent);
  } else {
    $("al-logo").style.display = "none";
  }

  const title = $("al-title");
  title.textContent = String(V.title || "");
  title.style.cssText +=
    `;font-size:${M.title}px;color:${V.ink};margin-left:${hasLogo ? M.headerGap : 0}px`;
  fit(title, inner - (hasLogo ? M.logo + M.headerGap : 0), minText);
  if (!V.title) title.style.display = "none";

  const hasHeader = Boolean(hasLogo || V.title);
  const headerH = hasHeader ? M.logo : 0;
  if (!hasHeader) header.style.display = "none";

  const line = $("al-line");
  const lineCopy = $("al-line-copy");
  const lineText = String(V.line || "");
  const focusText = String(V.lineFocus || "");
  const focusAt = focusText ? lineText.indexOf(focusText) : -1;
  let focus = null;

  if (focusAt >= 0) {
    lineCopy.appendChild(document.createTextNode(lineText.slice(0, focusAt)));
    focus = make("span", "al-line-focus", lineCopy, focusText);
    focus.style.color = V.accent;
    lineCopy.appendChild(
      document.createTextNode(lineText.slice(focusAt + focusText.length))
    );
  } else {
    lineCopy.textContent = lineText;
  }

  line.style.cssText +=
    `;left:${M.side}px;width:${inner}px;font-size:${M.line}px;color:${V.ink}`;
  lineCopy.style.whiteSpace = "nowrap";
  lineCopy.style.maxWidth = "none";
  fit(lineCopy, inner, minText);
  lineCopy.style.whiteSpace = "normal";
  lineCopy.style.maxWidth = inner + "px";
  if (!lineText) line.style.display = "none";

  const lineH = lineText ? line.offsetHeight : 0;
  const lineTop = bottom - lineH;
  line.style.top = lineTop + "px";

  const pal = $("al-pal");
  const body = $("al-pal-body");
  const clawd = KIT.mascot(body, M.cell, { color: V.accent });
  pal.style.width = clawd.width + "px";
  pal.style.height = clawd.height + "px";
  body.style.overflow = "visible";
  if (!hasPal) pal.style.display = "none";

  const cx = W / 2;
  const ringTop = compact
    ? top + clawd.height - M.track / 2 + M.crownGap
    : top + headerH + M.crownGap + clawd.height - M.track / 2;
  const ringBottom = compact
    ? lineTop - M.footerGap - M.track / 2
    : lineTop - M.footerGap - M.nodeH + M.track / 2 - M.drop;
  const radius = Math.max(90, Math.min(
    M.radius,
    (W - M.track) / 2 - M.rim,
    (ringBottom - ringTop) / 2
  ));
  const cy = (ringTop + ringBottom) / 2;
  const planAngle = 90;
  const actAngle = 210;

  const point = (angle) => ({
    x: cx + radius * Math.cos(rad(angle)),
    y: cy + radius * Math.sin(rad(angle)),
  });
  const normalAt = (angle) => ({
    x: Math.cos(rad(angle)),
    y: Math.sin(rad(angle)),
  });
  const tangentAt = (angle) => ({
    x: -Math.sin(rad(angle)),
    y: Math.cos(rad(angle)),
  });

  // Compact runners use the circular inside lane. The portrait runner
  // comes inward only as far as its full, unstretched silhouette requires.
  const footRy = Math.max(40, radius - M.track / 2);
  const footRx = Math.max(40, Math.min(
    footRy,
    W / 2 - clawd.width / 2 - M.rim - M.cell * 0.4
  ));
  const runnerPoint = (angle, lift = 0) => ({
    x: cx + footRx * Math.cos(rad(angle)),
    y: cy + footRy * Math.sin(rad(angle)) - lift,
  });
  const palPoint = (angle, lift = 0) => {
    const p = runnerPoint(angle, lift);
    return { x: p.x - clawd.width / 2, y: p.y - clawd.height };
  };

  const desiredCheckLeft = W - M.nodeSide - M.nodeW;
  const contactOverlap = M.cell * 0.45;
  const desiredContactX =
    desiredCheckLeft - clawd.width / 2 + contactOverlap;
  const checkCos = clamp((desiredContactX - cx) / footRx, 0.18, 0.82);
  const checkAngle = 360 - Math.acos(checkCos) * 180 / Math.PI;
  const checkFoot = runnerPoint(checkAngle);
  const checkMark = point(checkAngle);

  const pathFrom = (points) => points.map((p, i) =>
    `${i ? "L" : "M"}${p.x.toFixed(3)},${p.y.toFixed(3)}`
  ).join(" ");

  function arcPoints(from, to, runner = false, lift = 0) {
    const steps = Math.max(8, Math.ceil(Math.abs(to - from) / 2));
    return Array.from({ length: steps + 1 }, (_, i) => {
      const angle = from + (to - from) * i / steps;
      return runner ? runnerPoint(angle, lift) : point(angle);
    });
  }

  function arc(from, to, runner = false, lift = 0) {
    return pathFrom(arcPoints(from, to, runner, lift));
  }

  function pathLength(points) {
    let length = 0;
    for (let i = 1; i < points.length; i++) {
      length += Math.hypot(
        points[i].x - points[i - 1].x,
        points[i].y - points[i - 1].y
      );
    }
    return length;
  }

  function fractureFace(angle, outsideToInside) {
    const p = point(angle);
    const n = normalAt(angle);
    const t = tangentAt(angle);
    const across = outsideToInside
      ? [1, 0.62, 0.16, -0.24, -0.65, -1]
      : [-1, -0.58, -0.18, 0.30, 0.64, 1];
    const along = [0, -0.14, 0.13, -0.15, 0.08, 0];
    return across.map((value, i) => ({
      x: p.x + n.x * M.track / 2 * value + t.x * M.track * along[i],
      y: p.y + n.y * M.track / 2 * value + t.y * M.track * along[i],
    }));
  }

  function bandD(from, to) {
    const steps = Math.max(6, Math.ceil(Math.abs(to - from) / 2));
    const outer = [];
    const inside = [];
    for (let i = 0; i <= steps; i++) {
      const angle = from + (to - from) * i / steps;
      const p = point(angle);
      const n = normalAt(angle);
      outer.push({
        x: p.x + n.x * M.track / 2,
        y: p.y + n.y * M.track / 2,
      });
      inside.push({
        x: p.x - n.x * M.track / 2,
        y: p.y - n.y * M.track / 2,
      });
    }
    return pathFrom([
      ...outer,
      ...fractureFace(to, true).slice(1),
      ...inside.reverse().slice(1),
      ...fractureFace(from, false).slice(1),
    ]) + " Z";
  }

  const svg = $("al-svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);

  function svgPath(before) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", "path");
    el.setAttribute("pathLength", "1000");
    if (before) svg.insertBefore(el, before);
    else svg.appendChild(el);
    return el;
  }

  const mainTrack = $("al-track-main");
  const gate = $("al-track-gate");
  const edge = $("al-edge");
  const softTrail = $("al-trail-soft");
  const coreTrail = $("al-trail-core");
  const holdRunner = $("al-hold-runner");
  const stop = $("al-stop");
  const skid = $("al-skid");
  const impactLines = $("al-impact-lines");
  const blast = $("al-blast");
  const burstSoft = $("al-burst-soft");
  const burstPath = $("al-burst-path");
  const bursts = [burstSoft, burstPath];
  const chunks = ["a", "b", "c", "d", "e", "f"].map(
    (suffix) => $("al-gate-" + suffix)
  );
  const sectors = [
    $("al-plan-sector"), $("al-act-sector"), $("al-check-sector"),
  ];
  const actLink = $("al-act-link");
  const checkLink = $("al-check-link");
  const links = [actLink, checkLink];
  const mainFrom = checkAngle + M.gap;
  const mainTo = checkAngle + 360 - M.gap;
  const mainD = arc(mainFrom, mainTo);
  const loopPoints = arcPoints(planAngle, planAngle + 360, true);
  const loopD = pathFrom(loopPoints);
  const loopLength = pathLength(loopPoints);

  mainTrack.setAttribute("d", bandD(mainFrom, mainTo));
  mainTrack.style.fill = V.track;
  gate.setAttribute("d", bandD(
    checkAngle - M.gap - 1,
    checkAngle + M.gap + 1
  ));
  gate.style.fill = V.track;

  edge.setAttribute("d", mainD);
  edge.style.stroke = V.success;
  edge.style.strokeWidth = (compact ? 13 : 16) + "px";
  holdRunner.setAttribute("d", mainD);
  holdRunner.style.stroke = V.success;
  holdRunner.style.strokeWidth = (compact ? 22 : 28) + "px";

  // Nested strokes share one moving endpoint. Their progressively longer,
  // thinner tails form a pointed ribbon without gradients or blur bands.
  const ribbon = [];
  const softSpecs = [
    { factor: 1, width: M.trail * 0.18, alpha: 0.12 },
    { factor: 0.52, width: M.trail * 0.82, alpha: 0.13 },
    { factor: 0.17, width: M.trail * 1.85, alpha: 0.13 },
  ];
  softSpecs.forEach((spec, i) => {
    const path = i === softSpecs.length - 1
      ? softTrail
      : svgPath(softTrail);
    ribbon.push({ path, ...spec });
  });

  const taperLayers = 14;
  for (let i = 0; i < taperLayers; i++) {
    ribbon.push({
      path: i === taperLayers - 1 ? coreTrail : svgPath(coreTrail),
      factor: Math.pow(1 - i / taperLayers, 1.05),
      width: M.trail * (
        0.035 + 0.965 * Math.pow((i + 1) / taperLayers, 0.82)
      ),
      alpha: 1,
    });
  }

  ribbon.forEach((layer) => {
    layer.path.setAttribute("d", loopD);
    layer.path.style.stroke = V.accent;
    layer.path.style.strokeWidth = layer.width + "px";
    layer.path.style.strokeLinecap = "round";
    const span = 30 * layer.factor;
    gsap.set(layer.path, {
      autoAlpha: layer.alpha,
      strokeDasharray: `${span} ${1000 - span}`,
      strokeDashoffset: span,
    });
  });
  const trails = ribbon.map((layer) => layer.path);

  [planAngle, actAngle, checkAngle].forEach((angle, i) => {
    sectors[i].setAttribute("d", arc(angle - 13, angle + 13));
    sectors[i].style.stroke = V.accent;
    sectors[i].style.strokeWidth = (M.track + 8) + "px";
  });

  chunks.forEach((chunk, i) => {
    const from = checkAngle - M.gap + i * M.gap * 2 / chunks.length;
    const to = from + M.gap * 2 / chunks.length;
    chunk.setAttribute("d", bandD(from, to));
    chunk.style.fill = V.track;
    chunk.style.stroke = V.accent;
    chunk.style.strokeWidth = "4px";
  });

  function station(label, left, nodeTop, isCheck) {
    const node = make("div", "al-node", $("al-nodes"));
    node.style.cssText +=
      `;left:${left}px;top:${nodeTop}px;width:${M.nodeW}px;height:${M.nodeH}px;background:${V.plate};border:${M.nodeBorder}px solid ${V.plateBorder};color:${V.ink}`;
    if (!String(label || "").trim()) node.style.display = "none";

    if (!isCheck) {
      const text = make("span", "al-node-label", node, String(label || ""));
      text.style.fontSize = M.nodeFont + "px";
      fit(text, M.nodeW - M.nodePad * 2, minText);
      return { node, text, left, top: nodeTop };
    }

    const icon = make("div", "al-node-icon", node);
    icon.style.cssText +=
      `;width:${M.glyph}px;height:${M.glyph}px;margin-right:10px`;
    const idle = KIT.glyph(icon, "bullet", M.glyph, V.muted);
    const cross = KIT.glyph(icon, "cross", M.glyph, V.ground);
    const tick = KIT.glyph(icon, "tick", M.glyph, V.successInk);
    const slot = make("div", "al-check-slot", node);
    const room = M.nodeW - M.nodePad * 2 - M.glyph - 10;
    slot.style.width = room + "px";
    slot.style.height = M.checkFont * 1.16 + "px";
    const normal = make("span", "al-check-label", slot, String(label || ""));
    const failed = make("span", "al-check-fail", slot, String(V.failWord || ""));
    [normal, failed].forEach((el) => {
      el.style.fontSize = M.checkFont + "px";
      fit(el, room, minText);
    });
    gsap.set([failed, cross, tick], { autoAlpha: 0 });
    return { node, normal, failed, idle, cross, tick, left, top: nodeTop };
  }

  const planTop = compact
    ? cy + radius - M.track / 2 - M.nodeH / 2
    : cy + radius - M.track / 2 + M.drop;
  const actFoot = runnerPoint(actAngle);
  const actTop = Math.max(
    top + headerH + 12,
    actFoot.y - clawd.height - M.nodeH - M.nodeGap
  );
  const checkLeft = clamp(
    checkFoot.x + clawd.width / 2 - contactOverlap,
    M.nodeSide,
    W - M.nodeW - M.nodeSide
  );

  // Check is a toe-height barrier. Keeping its plate below the outgoing
  // ray also leaves the actual broken opening and orange jet visible.
  const checkTop = checkFoot.y - M.cell * 0.28;

  const plan = station(V.planLabel, cx - M.nodeW / 2, planTop, false);
  const act = station(V.actLabel, M.nodeSide, actTop, false);
  const check = station(V.checkLabel, checkLeft, checkTop, true);
  const stations = [plan, act, check];
  plan.sector = sectors[0];
  act.sector = sectors[1];
  check.sector = sectors[2];
  act.link = actLink;
  check.link = checkLink;

  const actMark = point(actAngle);
  actLink.setAttribute("d", pathFrom([
    { x: act.left + M.nodeW / 2, y: act.top + M.nodeH + 8 },
    { x: actMark.x, y: actMark.y },
  ]));
  checkLink.setAttribute("d", pathFrom([
    { x: check.left + 10, y: check.top + M.nodeH / 2 },
    { x: checkMark.x, y: checkMark.y },
  ]));
  links.forEach((link) => {
    link.style.stroke = V.plateBorder;
    link.style.strokeWidth = "3px";
  });
  if (!String(V.actLabel || "").trim()) actLink.style.display = "none";
  if (!String(V.checkLabel || "").trim()) checkLink.style.display = "none";

  const contact = {
    x: check.left + 2,
    y: checkFoot.y - M.cell * 0.06,
  };
  stop.setAttribute("d", pathFrom([
    { x: check.left, y: check.top + 3 },
    { x: check.left, y: check.top + M.nodeH - 10 },
  ]));
  stop.style.stroke = V.error;
  stop.style.strokeWidth = (compact ? 9 : 12) + "px";

  skid.setAttribute("d",
    arc(checkAngle - 24, checkAngle, true) + " " +
    arc(checkAngle - 20, checkAngle - 1, true, M.cell * 0.42)
  );
  skid.style.stroke = V.accent;
  skid.style.strokeWidth = Math.max(6, M.cell * 0.42) + "px";
  skid.style.strokeDasharray = "1000 1000";

  impactLines.setAttribute("d", [-1, 0, 1].map((side) => pathFrom([
    {
      x: contact.x - M.cell * 0.55,
      y: contact.y + side * M.cell * 0.65,
    },
    {
      x: contact.x - M.cell * 4.8,
      y: contact.y + side * M.cell * 2.4,
    },
  ])).join(" "));
  impactLines.style.stroke = V.error;
  impactLines.style.strokeWidth = (compact ? 8 : 11) + "px";

  const pulse = $("al-check-pulse");
  pulse.style.cssText +=
    `;left:${contact.x - M.pulse / 2}px;top:${contact.y - M.pulse / 2}px;width:${M.pulse}px;height:${M.pulse}px;border-width:${compact ? 7 : 9}px;border-color:${V.error}`;

  gsap.set([
    edge, holdRunner, stop, skid, impactLines, pulse,
    blast, ...bursts, ...chunks, ...sectors,
  ], { autoAlpha: 0 });

  const contentLeft = cx - inner / 2;
  const countGroup = $("al-count");
  countGroup.style.cssText += `;left:${contentLeft}px;width:${inner}px`;

  const attemptLabel = $("al-attempt-label");
  attemptLabel.textContent = String(V.attemptLabel || "");
  attemptLabel.style.cssText += `;font-size:${M.label}px;color:${V.muted}`;
  fit(attemptLabel, inner * 0.65, minText);
  if (!V.attemptLabel) attemptLabel.style.display = "none";

  const number = $("al-number");
  number.textContent = "1";
  const numberSize = Math.min(M.number, radius * (compact ? 0.80 : 1.08));
  number.style.cssText +=
    `;font-size:${numberSize}px;color:${V.ink};margin-top:${V.attemptLabel ? M.countGap : 0}px`;
  fit(number, Math.min(inner * 0.62, radius * 1.45), minText * 3);

  // In both compact compositions the label is below the upper running
  // lane, rather than tucked into the feet's path above the number.
  let countTop = compact
    ? cy - Math.min(radius * 0.34, M.label * 2.65)
    : cy - M.countLift - countGroup.offsetHeight / 2;

  if (compact && plan.node.style.display !== "none") {
    const availableNumberHeight = Math.max(
      minText * 2.7,
      plan.top - M.resultGap - countTop -
        attemptLabel.offsetHeight - (V.attemptLabel ? M.countGap : 0)
    );
    if (number.offsetHeight > availableNumberHeight) {
      number.style.fontSize = Math.max(
        minText * 3,
        parseFloat(number.style.fontSize) *
          availableNumberHeight / number.offsetHeight
      ) + "px";
    }
  }
  countGroup.style.top = countTop + "px";

  const result = $("al-result");
  result.style.cssText += `;left:${contentLeft}px;width:${inner}px`;
  const pass = $("al-pass");
  const passText = String(V.passWord || "");
  const hasPass = Boolean(passText.trim());
  const passLetters = Array.from(passText).map(
    (letter) => make("span", "al-pass-letter", pass, letter)
  );
  const passRoom = Math.max(
    minText * 3,
    Math.min(inner - 24, radius * 2 - M.track - 52)
  );
  pass.style.cssText +=
    `;font-size:${M.pass}px;color:${V.success};transform-origin:50% 100%;text-shadow:0 0 36px ${rgba(V.success, 0.12)}`;
  if (hasPass) fit(pass, passRoom, minText);
  else pass.style.display = "none";

  const stat = $("al-stat");
  stat.textContent = String(V.stat || "");
  stat.style.cssText +=
    `;font-size:${M.stat}px;color:${V.ink};margin-top:${hasPass && V.stat ? M.statGap : 0}px`;
  fit(stat, passRoom, minText);
  if (!V.stat) stat.style.display = "none";

  const measureCanvas = document.createElement("canvas");
  const measureContext = measureCanvas.getContext("2d");

  function inkTop(el) {
    const style = getComputedStyle(el);
    const px = parseFloat(style.fontSize);
    if (!measureContext || !px) return 0;
    measureContext.font = `${style.fontWeight} ${px}px ${style.fontFamily}`;
    const metrics = measureContext.measureText(el.textContent);
    const ascent = metrics.fontBoundingBoxAscent || px * 0.96;
    const descent = metrics.fontBoundingBoxDescent || px * 0.24;
    const inkAscent = metrics.actualBoundingBoxAscent || px * 0.73;
    const lineHeight = parseFloat(style.lineHeight) || px * 0.94;
    return (lineHeight - ascent - descent) / 2 + ascent - inkAscent;
  }

  let passTop = hasPass
    ? cy + M.resultDrop - inkTop(pass)
    : cy - result.offsetHeight / 2;

  if (plan.node.style.display !== "none") {
    const punchedBottom = result.offsetHeight * (0.45 + 0.55 * 1.12);
    passTop = Math.min(
      passTop,
      plan.top - M.resultGap - punchedBottom
    );
  }
  result.style.top = passTop + "px";

  const solidLetters = passLetters.filter((el) => el.textContent.trim());
  const supportLetters = solidLetters.length ? Array.from(new Set([
    solidLetters[Math.floor((solidLetters.length - 1) / 2)],
    solidLetters[Math.ceil((solidLetters.length - 1) / 2)],
  ])) : [];
  const landingX = supportLetters.length
    ? contentLeft + pass.offsetLeft + supportLetters.reduce(
      (sum, el) => sum + el.offsetLeft + el.offsetWidth / 2, 0
    ) / supportLetters.length
    : cx;
  const landingFoot = supportLetters.length
    ? passTop + pass.offsetTop + Math.max(
      ...supportLetters.map((el) => el.offsetTop + inkTop(el))
    ) - M.cell * 0.18
    : passTop - M.cell * 0.4;
  const landing = {
    x: landingX - clawd.width / 2,
    y: landingFoot - clawd.height,
  };
  gsap.set(result, { autoAlpha: 0 });

  // The character, ribbon and jet share this line. It passes through the
  // geometric centre of the missing gate, rather than a parallel opening.
  const gateDistance = Math.max(1, Math.hypot(
    checkMark.x - checkFoot.x,
    checkMark.y - checkFoot.y
  ));
  const exitDirection = {
    x: (checkMark.x - checkFoot.x) / gateDistance,
    y: (checkMark.y - checkFoot.y) / gateDistance,
  };
  const minFlightFootY = (
    compact ? M.cell * 0.5 : Math.max(0, top - M.logo * 0.55)
  ) + clawd.height + M.cell * 0.25;
  const maxFlightFootX =
    W - M.rim - clawd.width / 2 - M.cell * 0.2;
  const clearY = exitDirection.y < -0.001
    ? Math.max(0, (checkMark.y - minFlightFootY) / -exitDirection.y)
    : M.track * 1.9;
  const clearX = exitDirection.x > 0.001
    ? Math.max(0, (maxFlightFootX - checkMark.x) / exitDirection.x)
    : M.track * 1.9;
  const outsideDistance = Math.max(0, Math.min(
    M.track * 1.9, clearY, clearX
  ));
  const outsideFoot = {
    x: checkMark.x + exitDirection.x * outsideDistance,
    y: checkMark.y + exitDirection.y * outsideDistance,
  };
  const jetEnd = {
    x: checkMark.x + exitDirection.x * M.track * 6.4,
    y: checkMark.y + exitDirection.y * M.track * 6.4,
  };

  const quadratic = (a, b, c, u) =>
    (1 - u) * (1 - u) * a + 2 * (1 - u) * u * b + u * u * c;
  const quadraticPoint = (segment, u) => ({
    x: quadratic(segment.a.x, segment.b.x, segment.c.x, u),
    y: quadratic(segment.a.y, segment.b.y, segment.c.y, u),
  });

  const flight = [
    {
      a: checkFoot,
      b: checkMark,
      c: outsideFoot,
      fraction: 0.34,
      rotation: 10,
      ease: "power3.out",
    },
    {
      a: outsideFoot,
      b: {
        x: landingX + radius * 0.16,
        y: Math.max(
          clawd.height + M.cell * 0.8,
          outsideFoot.y - M.cell * 1.1
        ),
      },
      c: { x: landingX, y: landingFoot },
      fraction: 0.66,
      rotation: 0,
      ease: "power2.in",
    },
  ];

  const exitLoopPoints = arcPoints(
    checkAngle - 360, checkAngle, true
  );
  const exitLoopLength = pathLength(exitLoopPoints);
  const exitPoints = [...exitLoopPoints, checkMark, jetEnd];
  const exitD = pathFrom(exitPoints);
  const exitLength = pathLength(exitPoints);
  const keyJetAdvance = gateDistance + M.track * 0.78;
  const exitHeadStart = (
    exitLoopLength + keyJetAdvance
  ) / exitLength * 1000;

  const jetD = pathFrom([checkFoot, checkMark, jetEnd]);
  bursts.forEach((path, i) => {
    path.setAttribute("d", jetD);
    path.style.stroke = V.accent;
    path.style.strokeWidth = (
      i ? Math.max(7, M.trail * 0.22) : M.trail * 0.9
    ) + "px";
    path.style.strokeDasharray = "130 1600";
  });

  const exitTangent = {
    x: -exitDirection.y,
    y: exitDirection.x,
  };
  blast.setAttribute("d", [-1, 0, 1].map((side) => {
    const offset = side * M.cell * 1.15;
    return pathFrom([
      {
        x: checkFoot.x + exitTangent.x * offset,
        y: checkFoot.y + exitTangent.y * offset,
      },
      {
        x: checkMark.x + exitTangent.x * offset,
        y: checkMark.y + exitTangent.y * offset,
      },
      {
        x: jetEnd.x + exitTangent.x * offset * 1.4,
        y: jetEnd.y + exitTangent.y * offset * 1.4,
      },
    ]);
  }).join(" "));
  blast.style.stroke = V.accent;
  blast.style.strokeWidth = (compact ? 6 : 8) + "px";
  blast.style.strokeDasharray = "200 1800";

  const homeFoot = { x: cx, y: plan.top - 6 };
  const home = {
    x: homeFoot.x - clawd.width / 2,
    y: homeFoot.y - clawd.height,
  };
  gsap.set(pal, {
    x: home.x, y: home.y,
    rotation: -6, scaleX: 1, scaleY: 1,
    transformOrigin: "50% 100%",
  });

  const revealAt = (y) => variant === "overlay"
    ? entryDesign * (
      1 - Math.pow(clamp(y / H, 0, 1), 1 / 5)
    ) + 0.001
    : 0;

  [
    [header, top], [line, lineTop], [countGroup, countTop],
    [plan.node, plan.top], [act.node, act.top],
    [check.node, check.top], [pal, home.y],
  ].forEach(([el, y]) => {
    gsap.set(el, { autoAlpha: variant === "overlay" ? 0 : 1 });
    build.set(el, { autoAlpha: 1 }, revealAt(y));
  });

  build.fromTo(number, { scaleX: 1.10, scaleY: 0.84 }, {
    scaleX: 1, scaleY: 1,
    duration: 0.18, ease: "back.out(2.5)",
  }, revealAt(countTop));
  build.fromTo(header, { y: 12 }, {
    y: 0, duration: 0.18, ease: "power4.out",
  }, revealAt(top));
  build.fromTo(line, { y: 12 }, {
    y: 0, duration: 0.18, ease: "power4.out",
  }, revealAt(lineTop));

  function activateStation(item, at, color = V.accent) {
    build.set(stations.map((s) => s.node), {
      x: 0, backgroundColor: V.plate, borderColor: V.plateBorder,
      color: V.ink, scaleX: 1, scaleY: 1,
    }, at);
    build.set(sectors, { autoAlpha: 0 }, at);
    build.set(links, { stroke: V.plateBorder }, at);
    build.set(item.node, {
      backgroundColor: color, borderColor: color, color: V.ground,
    }, at);
    build.set(item.sector, { autoAlpha: 1, stroke: color }, at);
    if (item.link) build.set(item.link, { stroke: color }, at);
    build.fromTo(item.node, { scaleX: 1.08, scaleY: 0.84 }, {
      scaleX: 1, scaleY: 1,
      duration: Math.max(0.001, Math.min(0.18, D - at)),
      ease: "back.out(3)", immediateRender: false,
    }, at);
  }

  function resetCheck(at) {
    build.set([check.normal, check.idle], { autoAlpha: 1 }, at);
    build.set([check.failed, check.cross, check.tick], { autoAlpha: 0 }, at);
    build.set(gate, { fill: V.track }, at);
    build.set(stop, { autoAlpha: 0 }, at);
  }

  const distanceAt = (angle) => (angle - planAngle) / 360 * 1000;

  function animateTrail(from, to, at, duration, ease, startTail, endTail) {
    ribbon.forEach((layer) => {
      const a = Math.max(0.2, startTail * layer.factor);
      const b = Math.max(0.2, endTail * layer.factor);
      build.fromTo(layer.path, {
        strokeDashoffset: from,
        strokeDasharray: `${a} ${1000 - a}`,
      }, {
        strokeDashoffset: to,
        strokeDasharray: `${b} ${1000 - b}`,
        duration, ease, immediateRender: false,
        modifiers: {
          strokeDashoffset: (value) => {
            const angle = parseFloat(value);
            const u = clamp((angle - from) / (to - from), 0, 1);
            const tail = a + (b - a) * u;
            return String(tail - distanceAt(angle));
          },
        },
      }, at);
    });
  }

  resetCheck(0);
  activateStation(plan, 0);

  function makePixel(color, size) {
    const el = make("div", "al-pixel", $("al-pixels"));
    el.style.cssText += `;width:${size}px;height:${size}px;background:${color}`;
    gsap.set(el, { autoAlpha: 0 });
    return el;
  }

  function collisionPixels(at, duration, count) {
    for (let i = 0; i < count; i++) {
      const color = i % 5 === 0 ? V.ink : i % 2 ? V.error : V.accent;
      const pixel = makePixel(color, M.pixel * (0.7 + rnd() * 0.55));
      const x = contact.x - rnd() * M.cell;
      const y = contact.y + (rnd() - 0.5) * M.cell * 1.6;
      const endX = x - M.cell * (3.5 + rnd() * 7);
      const peakY = y - M.cell * (1 + rnd() * 4);
      gsap.set(pixel, { x, y });
      build.set(pixel, { autoAlpha: 1 }, at);
      build.to(pixel, {
        x: endX, duration, ease: "power3.out",
      }, at);
      build.to(pixel, {
        y: peakY, duration: duration * 0.42, ease: "power3.out",
      }, at);
      build.to(pixel, {
        y: peakY + M.cell * (1 + rnd() * 3),
        duration: duration * 0.58, ease: "power2.in",
      }, at + duration * 0.42);
      build.set(pixel, { autoAlpha: 0 }, at + duration);
    }
  }

  function footfall(angle, at, life, index) {
    if (!hasPal || life <= 0) return;
    const p = runnerPoint(angle);
    const direction = -Math.sin(rad(angle)) >= 0 ? 1 : -1;
    const side = index % 2 ? 1 : -1;
    const x = p.x + side * M.cell * 2.45;
    const y = p.y + M.cell * 0.04;
    const mark = svgPath(stop);
    mark.setAttribute("d", pathFrom([
      { x: x - M.cell * 0.58, y },
      { x: x + M.cell * 0.58, y },
    ]) + " " + pathFrom([
      { x: x - direction * M.cell * 0.45, y: y + M.cell * 0.32 },
      { x: x - direction * M.cell * 1.05, y: y + M.cell * 0.32 },
    ]));
    mark.style.stroke = V.accent;
    mark.style.strokeWidth = Math.max(4, M.cell * 0.24) + "px";
    mark.style.strokeLinecap = "butt";
    gsap.set(mark, { autoAlpha: 0, x: 0, y: 0 });
    build.set(mark, { autoAlpha: 0.85 }, at);
    build.to(mark, {
      x: -direction * M.cell * 1.4,
      y: M.cell * 0.22,
      duration: life, ease: "power3.out",
    }, at);
    build.set(mark, { autoAlpha: 0 }, at + life);
  }

  const runStart = 0.28;
  const launchAt = 0.025;
  const launchDuration = runStart - launchAt;
  const entryAngle = planAngle + 22;
  const entryFoot = runnerPoint(entryAngle);
  const launchControl = {
    x: homeFoot.x - M.cell * 4,
    y: Math.min(homeFoot.y, entryFoot.y) - M.cell * 2.2,
  };

  if (hasPal) {
    clawd.pose(build, 0, {
      arms: "left", eyes: "left", legs: "stand",
    });
    build.fromTo(pal, { x: 0, y: 0 }, {
      x: 1, y: 1, duration: launchDuration,
      ease: "power3.out", immediateRender: false,
      modifiers: {
        x: (value) => (
          quadratic(
            homeFoot.x, launchControl.x, entryFoot.x, parseFloat(value)
          ) - clawd.width / 2
        ) + "px",
        y: (value) => (
          quadratic(
            homeFoot.y, launchControl.y, entryFoot.y, parseFloat(value)
          ) - clawd.height
        ) + "px",
      },
    }, launchAt);
    build.to(pal, {
      rotation: -10, scaleX: 1, scaleY: 1,
      duration: launchDuration, ease: "power3.out",
    }, launchAt);
    clawd.pose(build, launchAt, {
      arms: "right", eyes: "left", legs: "right",
    });
    clawd.pose(build, launchAt + launchDuration * 0.52, {
      arms: "left", eyes: "left", legs: "left",
    });
  }
  animateTrail(
    planAngle, entryAngle, launchAt, launchDuration,
    "power3.out", 30, 65
  );

  for (let i = 0; i < 6; i++) {
    const pixel = makePixel(i % 2 ? V.ink : V.accent, M.pixel * 0.8);
    gsap.set(pixel, { x: homeFoot.x, y: homeFoot.y - 4 });
    build.set(pixel, { autoAlpha: 1 }, launchAt);
    build.to(pixel, {
      x: homeFoot.x + M.cell * (1 + rnd() * 4),
      y: homeFoot.y - M.cell * (0.5 + rnd() * 2),
      duration: 0.18, ease: "power3.out",
    }, launchAt);
    build.set(pixel, { autoAlpha: 0 }, launchAt + 0.18);
  }

  const runEase = (u) => 0.22 * u + 0.78 * u * u;
  const inverseRun = (u) =>
    (-0.22 + Math.sqrt(0.0484 + 3.12 * clamp(u, 0, 1))) / 1.56;

  function moveAround(
    from, to, at, duration, ease, startTail, endTail,
    step = 0, lean = 8, hop = 0
  ) {
    if (hasPal) {
      const motion = (value) => {
        const angle = parseFloat(value);
        const progress = clamp((angle - from) / (to - from), 0, 1);
        const elapsed = step ? inverseRun(progress) * duration : 0;
        const phase = step ? Math.PI * elapsed / step : 0;
        const lift = step
          ? hop * Math.pow(Math.sin(phase), 2)
          : hop * Math.sin(Math.PI * progress);
        return { angle, phase, lift };
      };
      build.fromTo(pal, { x: from, y: from, rotation: from }, {
        x: to, y: to, rotation: to,
        duration, ease, immediateRender: false,
        modifiers: {
          x: (value) => {
            const m = motion(value);
            return palPoint(m.angle, m.lift).x + "px";
          },
          y: (value) => {
            const m = motion(value);
            return palPoint(m.angle, m.lift).y + "px";
          },
          rotation: (value) => {
            const m = motion(value);
            const direction = (
              -Math.sin(rad(m.angle)) * Math.sign(to - from)
            ) >= 0 ? 1 : -1;
            return clamp(
              direction * lean + Math.sin(m.phase) * 1.4,
              -12, 12
            ) + "deg";
          },
        },
      }, at);
    }
    animateTrail(from, to, at, duration, ease, startTail, endTail);
  }

  function runningPose(from, to, at, duration, step) {
    if (!hasPal) return;
    const until = at + duration;
    let index = 0;
    for (let beat = at; beat < until - 0.001; beat += step) {
      const slice = Math.min(step, until - beat);
      const u = clamp((beat - at) / duration, 0, 1);
      const angle = from + (to - from) * runEase(u);
      const eyes = -Math.sin(rad(angle)) >= 0 ? "right" : "left";
      const leg = index % 2 ? "right" : "left";
      const arm = index % 2 ? "left" : "right";

      // A visible planted beat separates every alternating kick.
      // All positions, poses and contact marks are timeline-driven.
      clawd.pose(build, beat, {
        arms: arm, eyes, legs: "stand",
      });
      clawd.pose(build, beat + slice * 0.20, {
        arms: arm, eyes, legs: leg,
      });
      clawd.pose(build, beat + slice * 0.90, {
        arms: arm, eyes, legs: "stand",
      });
      footfall(angle, beat, Math.min(0.13, slice * 0.78), index);
      index++;
    }
  }

  const available = D - runStart;
  let dwells = Array.from(
    { length: Math.max(0, attempts - 1) },
    (_, i) => Math.max(0.16, 0.38 * Math.pow(0.80, i))
  );
  const requestedDwell = dwells.reduce((sum, n) => sum + n, 0);
  const dwellScale = requestedDwell
    ? Math.min(1, available * 0.40 / requestedDwell)
    : 1;
  dwells = dwells.map((n) => n * dwellScale);
  const dwellTotal = dwells.reduce((sum, n) => sum + n, 0);
  const acceleration = Math.min(
    0.72, 0.58 + Math.max(0, attempts - 4) * 0.035
  );
  const weights = Array.from(
    { length: attempts },
    (_, i) => Math.pow(acceleration, i)
  );
  const weightSum = weights.reduce((sum, n) => sum + n, 0);
  const travelTotal = available - dwellTotal;
  let at = runStart;
  let angle = entryAngle;
  let previousTail = 65;
  let finalTail = 940;

  for (let lap = 0; lap < attempts; lap++) {
    const last = lap === attempts - 1;
    const travel = last ? D - at : travelTotal * weights[lap] / weightSum;
    const target = checkAngle + lap * 360;
    const hit = last ? D : at + travel;
    const contactRun = last ? 0 : Math.min(0.085, travel * 0.16);
    const sprintDuration = travel - contactRun;
    const sprintTarget = last ? target : target - 18;
    const braceAt = at + sprintDuration;
    const progress = lap / Math.max(1, attempts - 1);
    const tail = last ? 940 : 110 + Math.pow(progress, 1.3) * 720;
    const step = Math.max(
      0.028,
      Math.min(M.step * Math.pow(0.74, lap), sprintDuration / 3)
    );
    const lapAt = at;
    const fromAngle = angle;
    const eventTime = (eventAngle) => lapAt + sprintDuration * inverseRun(
      (eventAngle - fromAngle) / (sprintTarget - fromAngle)
    );

    if (hasPal) {
      // The running silhouette always retains its native proportions.
      build.set(pal, {
        transformOrigin: "50% 100%",
        scaleX: 1, scaleY: 1,
      }, at);
    }

    moveAround(
      angle, sprintTarget, at, sprintDuration,
      runEase, previousTail, tail, step, last ? 10 : 8,
      M.cell * (lap === 0 ? 1.05 : lap === 1 ? 0.88 : 0.65)
    );
    runningPose(angle, sprintTarget, at, sprintDuration, step);

    [[planAngle, plan], [actAngle, act]].forEach(([base, item]) => {
      for (let cycle = 0; cycle <= attempts; cycle++) {
        const stationAngle = base + cycle * 360;
        if (stationAngle > angle + 0.001 && stationAngle < sprintTarget) {
          const arrival = eventTime(stationAngle);
          if (item === plan) resetCheck(arrival);
          activateStation(item, arrival);
        }
      }
    });

    if (last) {
      finalTail = tail;
      continue;
    }

    const dwell = dwells[lap];
    const bounce = M.bounce + Math.min(12, lap * 5);
    const recoil = dwell * 0.50;
    const compressed = Math.min(0.038, recoil * 0.26);
    const recover = Math.min(0.095, recoil - compressed);
    const gagAt = hit + recoil;

    // The final approach brakes instead of speeding into a frozen sprite.
    moveAround(
      sprintTarget, target, braceAt, contactRun,
      "power3.out", tail, tail, 0, 12
    );
    if (hasPal) {
      clawd.pose(build, braceAt, {
        arms: "right", eyes: "right",
        legs: lap % 2 ? "left" : "right",
      });
      clawd.pose(build, braceAt + contactRun * 0.68, {
        arms: "left", eyes: "right", legs: "stand",
      });
    }

    build.set(skid, { autoAlpha: 1, stroke: V.accent }, braceAt);
    build.fromTo(skid, { strokeDashoffset: 1000 }, {
      strokeDashoffset: 0, duration: contactRun,
      ease: "power3.out", immediateRender: false,
    }, braceAt);

    // The failed plate, flat body, recoil, debris and counter all hit
    // on this exact design frame.
    activateStation(check, hit, V.error);
    build.set([check.normal, check.idle, check.tick], { autoAlpha: 0 }, hit);
    build.set([check.failed, check.cross, stop, impactLines], {
      autoAlpha: 1,
    }, hit);
    build.set(gate, { fill: V.error }, hit);
    build.set(skid, { stroke: V.error }, hit);

    build.fromTo(check.node, {
      x: M.cell * 0.8, scaleX: 0.92, scaleY: 1.12,
    }, {
      x: 0, scaleX: 1, scaleY: 1,
      duration: dwell * 0.68, ease: "back.out(3.8)",
      immediateRender: false,
    }, hit);
    build.set(impactLines, { autoAlpha: 0 }, hit + dwell * 0.42);
    build.set(skid, { autoAlpha: 0 }, hit + dwell * 0.62);
    collisionPixels(hit, dwell * 0.94, 16 + lap * 3);

    build.set(number, {
      textContent: String(lap + 2), color: V.error,
    }, hit);
    build.fromTo(number, {
      y: 14, scaleX: 1.25, scaleY: 0.72,
    }, {
      y: 0, scaleX: 1, scaleY: 1,
      duration: Math.min(0.22, dwell * 0.84),
      ease: "back.out(3.6)", immediateRender: false,
    }, hit);
    build.to(number, {
      color: V.ink,
      duration: Math.min(0.10, dwell * 0.3),
      ease: "power2.out",
    }, hit + dwell * 0.28);

    build.fromTo(pulse, {
      autoAlpha: 1, scaleX: 0.35, scaleY: 0.35,
      borderColor: V.error,
    }, {
      autoAlpha: 0, scaleX: 1.85, scaleY: 1.85,
      duration: dwell * 0.82,
      ease: "power3.out", immediateRender: false,
    }, hit);
    build.set($("al-flash"), { backgroundColor: V.error }, hit);
    build.fromTo($("al-flash"), { opacity: 0.12 }, {
      opacity: 0, duration: dwell * 0.64,
      ease: "power2.out", immediateRender: false,
    }, hit);

    if (hasPal) {
      clawd.pose(build, hit, {
        arms: "left", eyes: "closed", legs: "stand",
      });
      build.set(pal, {
        x: checkFoot.x - clawd.width / 2,
        y: checkFoot.y - clawd.height,
        transformOrigin: "50% 100%",
        scaleX: 1.16, scaleY: 0.52,
      }, hit);
    }

    // No pause before recoil: its sharp outward ease starts with the slam.
    moveAround(
      target, target - bounce, hit, recoil,
      "power4.out", tail, tail * 0.72,
      0, 10, M.cell * 1.7
    );

    if (hasPal) {
      build.to(pal, {
        scaleX: 1, scaleY: 1,
        duration: recover, ease: "back.out(2.5)",
      }, hit + compressed);
      clawd.pose(build, hit + compressed, {
        arms: "right", eyes: "open",
        legs: lap % 2 ? "right" : "left",
      });
      clawd.pose(build, gagAt, {
        arms: lap < 2 ? "down" : "right",
        eyes: lap === 0 ? "left" : lap === 1 ? "closed" : "right",
        legs: "stand",
      });
      build.set(pal, {
        scaleX: 1, scaleY: 1,
      }, gagAt);
      build.to(pal, {
        rotation: lap === 0 ? -5 : lap === 1 ? -9 : 7,
        duration: Math.max(0.001, hit + dwell - gagAt),
        ease: "power2.out",
      }, gagAt);

      if (lap === 0) {
        // A double take at the number that just went up.
        clawd.pose(build, gagAt + dwell * 0.22, {
          arms: "left", eyes: "right", legs: "stand",
        });
      } else if (lap === 1) {
        clawd.pose(build, gagAt + dwell * 0.22, {
          arms: "left", eyes: "right", legs: "right",
        });
      }
    }

    angle = target - bounce;
    at = hit + dwell;
    previousTail = tail * 0.72;
  }

  build.timeScale(1 / T.scale);
  tl.add(build, 0);

  const key = T.key;
  const hold = Math.max(0, T.hold);
  const holdEnd = key + hold;
  const react = Math.max(0.001, Math.min(0.24, hold * 0.2));
  const fractureTime = Math.max(0.001, Math.min(0.48, hold * 0.32));
  const ribbonTime = Math.max(0.001, Math.min(0.36, hold * 0.25));
  const blastTime = Math.max(0.001, Math.min(0.28, hold * 0.2));
  const flightTime = hold > 0.2 ? Math.min(0.56, hold * 0.34) : 0;

  // The key itself contains the payoff: a missing gate, separated chunks,
  // an orange ribbon through its centre, a green tick and the exact result.
  tl.set(countGroup, { autoAlpha: 0 }, key);
  tl.set(result, { autoAlpha: 1 }, key);
  tl.set([
    check.failed, check.cross, check.idle, gate, stop,
    skid, impactLines, ...sectors,
  ], { autoAlpha: 0 }, key);
  tl.set([
    check.normal, check.tick, edge, holdRunner, ...chunks,
  ], { autoAlpha: 1 }, key);

  tl.set([plan.node, act.node], {
    x: 0, backgroundColor: V.plate, borderColor: V.plateBorder,
    color: V.ink, scaleX: 1, scaleY: 1,
  }, key);
  tl.set(links, { stroke: V.plateBorder }, key);
  tl.set(checkLink, { stroke: V.success }, key);
  tl.set(mainTrack, { fill: rgba(V.success, 0.38) }, key);
  tl.set(check.node, {
    x: 0, backgroundColor: V.success,
    borderColor: V.success, color: V.successInk,
  }, key);
  tl.set($("al-glow"), {
    background:
      `radial-gradient(circle at 50% 50%, ${rgba(V.success, 0.34)}, transparent 72%)`,
  }, key);
  if (focus) tl.set(focus, { color: V.success }, key);

  tl.fromTo(result, { scaleX: 1.12, scaleY: 1.10 }, {
    scaleX: 1, scaleY: 1,
    duration: react, ease: "back.out(2.2)", immediateRender: false,
  }, key);
  tl.fromTo(check.node, {
    x: M.cell * 0.65, scaleX: 1.18, scaleY: 0.80,
  }, {
    x: 0, scaleX: 1.04, scaleY: 1.04,
    duration: react, ease: "back.out(3.2)", immediateRender: false,
  }, key);
  tl.set($("al-flash"), { backgroundColor: V.success }, key);
  tl.fromTo($("al-flash"), { opacity: 0.27 }, {
    opacity: 0,
    duration: Math.max(0.001, Math.min(0.18, hold * 0.2)),
    ease: "power2.out", immediateRender: false,
  }, key);
  tl.fromTo(pulse, {
    autoAlpha: 1, scaleX: 0.5, scaleY: 0.5,
    borderColor: V.success,
  }, {
    autoAlpha: 0, scaleX: 2.8, scaleY: 2.8,
    duration: Math.max(0.001, Math.min(0.38, hold * 0.3)),
    ease: "power3.out", immediateRender: false,
  }, key);

  chunks.forEach((chunk, i) => {
    const mid = checkAngle - M.gap +
      (i + 0.5) * M.gap * 2 / chunks.length;
    const n = normalAt(mid);
    const tangent = tangentAt(mid);
    const side = i - (chunks.length - 1) / 2;
    const initial = M.track * (0.95 + (i % 3) * 0.13);
    const distance = M.track * (2.8 + (i % 3) * 0.9);

    tl.set(chunk, {
      x: n.x * initial + tangent.x * side * M.track * 0.26,
      y: n.y * initial + tangent.y * side * M.track * 0.26,
      rotation: (i % 2 ? 1 : -1) * (16 + i * 5),
    }, key);
    tl.to(chunk, {
      x: n.x * distance + tangent.x * side * M.track * 0.65,
      y: n.y * distance + tangent.y * side * M.track * 0.65,
      rotation: (i % 2 ? 1 : -1) * (78 + i * 19),
      duration: fractureTime, ease: "power3.out",
    }, key);
  });
  tl.set(chunks, { autoAlpha: 0 }, key + fractureTime);

  const maxExitTail = finalTail * loopLength / exitLength;
  const exitHeadEnd = 1000 + maxExitTail + 64;

  ribbon.forEach((layer) => {
    const span = Math.max(0.2, maxExitTail * layer.factor);
    tl.set(layer.path, {
      autoAlpha: layer.alpha,
      attr: { d: exitD },
    }, key);
    tl.fromTo(layer.path, {
      strokeDasharray: `${span} 2400`,
      strokeDashoffset: exitHeadStart,
    }, {
      strokeDashoffset: exitHeadEnd,
      duration: ribbonTime,
      ease: "power2.in",
      immediateRender: false,
      modifiers: {
        strokeDashoffset: (value) => String(span - parseFloat(value)),
      },
    }, key);
  });
  tl.set(trails, { autoAlpha: 0 }, key + ribbonTime);

  tl.set(burstSoft, { autoAlpha: 0.16 }, key);
  tl.set([burstPath, blast], { autoAlpha: 1 }, key);
  [...bursts, blast].forEach((path) => {
    tl.fromTo(path, { strokeDashoffset: 0 }, {
      strokeDashoffset: -1400,
      duration: blastTime, ease: "power2.in", immediateRender: false,
    }, key);
  });
  tl.set([...bursts, blast], { autoAlpha: 0 }, key + blastTime);

  if (hold > 0) {
    tl.fromTo(holdRunner, { strokeDashoffset: 0 }, {
      strokeDashoffset: -1450, duration: hold,
      ease: "sine.inOut", immediateRender: false,
    }, key);
    tl.fromTo($("al-glow"), { opacity: 1 }, {
      opacity: 0.78, duration: hold,
      ease: "sine.inOut", immediateRender: false,
    }, key);
  }

  if (hasPal && flightTime > 0) {
    tl.set(pal, {
      x: checkFoot.x - clawd.width / 2,
      y: checkFoot.y - clawd.height,
      transformOrigin: "50% 100%",
      rotation: 10, scaleX: 1, scaleY: 1,
    }, key);
    clawd.pose(tl, key, {
      arms: "left", eyes: "right", legs: "right",
    });

    let elapsed = 0;
    flight.forEach((segment, i) => {
      const duration = flightTime * segment.fraction;
      const start = key + elapsed;

      tl.fromTo(pal, { x: 0, y: 0 }, {
        x: 1, y: 1, duration,
        ease: segment.ease, immediateRender: false,
        modifiers: {
          x: (value) => (
            quadraticPoint(segment, parseFloat(value)).x - clawd.width / 2
          ) + "px",
          y: (value) => (
            quadraticPoint(segment, parseFloat(value)).y - clawd.height
          ) + "px",
        },
      }, start);
      tl.to(pal, {
        rotation: segment.rotation,
        scaleX: 1, scaleY: 1,
        duration, ease: segment.ease,
      }, start);

      if (i === 1) {
        clawd.pose(tl, start, {
          arms: "right", eyes: "open", legs: "left",
        });
        clawd.pose(tl, start + duration * 0.76, {
          arms: "up", eyes: "open", legs: "stand",
        });
      }
      elapsed += duration;
    });

    const landAt = key + flightTime;
    const room = Math.max(0.001, holdEnd - landAt);
    const unit = Math.min(1, room / 0.472);
    const press = 0.052 * unit;
    const rise = 0.13 * unit;
    const fall = 0.16 * unit;
    const secondPress = 0.045 * unit;
    const settle = 0.085 * unit;
    const reboundAt = landAt + press;
    const secondLand = reboundAt + rise + fall;
    const settledAt = secondLand + secondPress + settle;

    // The landing compresses at a fixed foot anchor. The whole word takes
    // the impact together; its letters never acquire separate baselines.
    tl.set(pal, {
      x: landing.x, y: landing.y,
      rotation: 0, scaleX: 1.22, scaleY: 0.54,
    }, landAt);
    clawd.pose(tl, landAt, {
      arms: "down", eyes: "closed", legs: "stand",
    });

    if (hasPass) {
      tl.fromTo(pass, {
        y: M.cell * 0.18, scaleX: 1.015, scaleY: 0.91,
      }, {
        y: 0, scaleX: 1, scaleY: 1,
        duration: Math.min(0.24, room * 0.45),
        ease: "back.out(2.2)", immediateRender: false,
      }, landAt);
      tl.set(pass, {
        textShadow: `0 0 40px ${rgba(V.success, 0.22)}`,
      }, landAt);
    }

    clawd.pose(tl, reboundAt, {
      arms: "up", eyes: "open", legs: "stand",
    });
    tl.to(pal, {
      y: landing.y - M.cell * 2.8,
      scaleX: 1, scaleY: 1,
      duration: rise, ease: "power3.out",
    }, reboundAt);
    tl.to(pal, {
      y: landing.y, scaleX: 1.12, scaleY: 0.80,
      duration: fall, ease: "power3.in",
    }, reboundAt + rise);
    clawd.pose(tl, secondLand, {
      arms: "up", eyes: "closed", legs: "stand",
    });
    clawd.pose(tl, secondLand + secondPress, {
      arms: "up", eyes: "open", legs: "stand",
    });
    tl.to(pal, {
      y: landing.y, scaleX: 1, scaleY: 1,
      duration: settle, ease: "back.out(2.4)",
    }, secondLand + secondPress);

    tl.fromTo(edge, { strokeWidth: compact ? 30 : 38 }, {
      strokeWidth: compact ? 13 : 16,
      duration: Math.min(0.24, room * 0.45),
      ease: "power3.out", immediateRender: false,
    }, landAt);

    let hopAt = settledAt + 0.035;
    let hopIndex = 0;
    while (holdEnd - hopAt > 0.24) {
      const duration = Math.min(0.44, holdEnd - hopAt - 0.035);
      const amplitude = M.cell * 1.7 * Math.min(1, duration / 0.36);
      const up = duration * 0.38;
      const down = duration * 0.38;
      const blink = Math.min(0.065, duration * 0.18);
      const recoverTime = duration - up - down - blink;

      clawd.pose(tl, hopAt, {
        arms: "up", eyes: "open",
        legs: hopIndex % 2 ? "left" : "right",
      });
      tl.to(pal, {
        y: landing.y - amplitude,
        rotation: hopIndex % 2 ? -4 : 4,
        scaleX: 1, scaleY: 1,
        duration: up, ease: "power3.out",
      }, hopAt);
      tl.to(pal, {
        y: landing.y, rotation: 0,
        scaleX: 1.10, scaleY: 0.82,
        duration: down, ease: "power3.in",
      }, hopAt + up);
      clawd.pose(tl, hopAt + up + down, {
        arms: "up", eyes: "closed", legs: "stand",
      });
      clawd.pose(tl, hopAt + up + down + blink, {
        arms: "up", eyes: "open", legs: "stand",
      });
      tl.to(pal, {
        y: landing.y, scaleX: 1, scaleY: 1,
        duration: recoverTime, ease: "power2.out",
      }, hopAt + up + down + blink);

      hopAt += duration + 0.055;
      hopIndex++;
    }

    const particleLife = Math.min(0.58, room);
    for (let i = 0; i < 18; i++) {
      const pixel = makePixel(
        i % 4 === 0 ? V.ink : i % 2 ? V.success : V.accent,
        M.pixel * (i % 3 === 0 ? 1.05 : 0.72)
      );
      const side = i % 2 ? 1 : -1;
      const startX = landingX + side * M.cell * (2 + rnd() * 2);
      const peakY = Math.max(
        top + headerH + 12,
        landingFoot - M.cell * (3 + rnd() * 5)
      );
      gsap.set(pixel, { x: startX, y: landingFoot - M.cell * 0.3 });
      tl.set(pixel, { autoAlpha: 1 }, landAt);
      tl.to(pixel, {
        x: clamp(
          startX + side * M.cell * (2 + rnd() * 5),
          M.side, W - M.side - M.pixel * 1.5
        ),
        duration: particleLife, ease: "power3.out",
      }, landAt);
      tl.to(pixel, {
        y: peakY, duration: particleLife * 0.42, ease: "power3.out",
      }, landAt);
      tl.to(pixel, {
        y: landingFoot - M.cell,
        duration: particleLife * 0.58, ease: "power2.in",
      }, landAt + particleLife * 0.42);
      tl.set(pixel, { autoAlpha: 0 }, landAt + particleLife);
    }
  } else if (hasPal) {
    tl.set(pal, {
      x: landing.x, y: landing.y,
      transformOrigin: "50% 100%",
      rotation: 0, scaleX: 1, scaleY: 1,
    }, key);
    clawd.pose(tl, key, {
      arms: "up", eyes: "open", legs: "stand",
    });
    if (hold > 0.06) {
      tl.to(pal, {
        y: landing.y - M.cell * 0.6,
        duration: hold / 2, repeat: 1, yoyo: true,
        ease: "sine.inOut",
      }, key);
    }
  }

  for (let i = 0; i < 26; i++) {
    const angle = checkAngle - M.gap * 0.85 + rnd() * M.gap * 1.7;
    const p = point(angle);
    const n = normalAt(angle);
    const tangent = tangentAt(angle);
    const pixel = makePixel(
      i % 5 === 0 ? V.ink : i % 2 ? V.accent : V.success,
      M.pixel * (0.65 + rnd() * 0.6)
    );
    const distance = M.track * (2.4 + rnd() * 3.2);
    const spread = (rnd() - 0.5) * M.track * 3.2;
    const duration = Math.max(0.001, Math.min(0.44, hold * 0.3));

    gsap.set(pixel, {
      x: p.x + n.x * M.track * 0.4,
      y: p.y + n.y * M.track * 0.4,
    });
    tl.set(pixel, { autoAlpha: 1 }, key);
    tl.to(pixel, {
      x: p.x + n.x * distance + tangent.x * spread,
      y: p.y + n.y * distance + tangent.y * spread,
      rotation: (rnd() - 0.5) * 160,
      duration, ease: "power3.out",
    }, key);
    tl.set(pixel, { autoAlpha: 0 }, key + duration);
  }

  const open = "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)";
  const entryClosed = "polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)";
  const exitClosed = "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)";

  if (variant === "overlay") {
    tl.fromTo(stageEl, { clipPath: entryClosed }, {
      clipPath: open,
      duration: entryDesign * T.scale, ease: "power4.out",
    }, 0);
  }

  if (T.exit > 0) {
    const exitAt = key + hold;
    const exitDuration = Math.max(0, T.exit - 1 / CA.fps);
    [
      [header, top + headerH + 8],
      [line, lineTop + lineH + 8],
      [result, passTop + result.offsetHeight + 12],
      [plan.node, plan.top + M.nodeH + 8],
      [act.node, act.top + M.nodeH + 8],
      [check.node, check.top + M.nodeH * 1.05 + 8],
    ].forEach(([el, lowerEdge]) => {
      const crossing = Math.pow(clamp(1 - lowerEdge / H, 0, 1), 1 / 4);
      tl.set(el, { autoAlpha: 0 }, exitAt + Math.max(
        0, exitDuration * crossing - 1 / CA.fps
      ));
    });
    tl.to(stageEl, {
      clipPath: exitClosed, duration: exitDuration, ease: "power3.in",
    }, exitAt);
    tl.set(stageEl, { clipPath: exitClosed }, exitAt + exitDuration);
  }

  window.__timelines["block"] = tl;
});