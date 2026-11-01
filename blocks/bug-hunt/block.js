CA.ready(() => {
  const {
    vars: V, stage: S, safe, time: T, variant,
    make, fit, rgba, grainUrl, seeded
  } = CA;
  const KIT = CA.claude;
  const $ = (id) => document.getElementById(id);
  const stageEl = $("stage");
  const W = S.w;
  const H = S.h;
  const D = T.design;
  const compact = variant !== "full";
  const minText = compact ? 32 : 40;
  const clean = (value) =>
    String(value == null ? "" : value).replace(/[\r\n\t]+/g, " ");

  const layouts = {
    full: {
      side: 40, top: 230, bottom: 300,
      logo: 68, file: 54, headerGap: 32, logoGap: 24,
      source: 64, number: 40, numberGap: 16,
      palCell: 18, surf: 28, palGap: 12, hop: 112,
      rail: 10, halo: 48, tip: 24,
      lensSide: 32, lensGap: 24, pad: 32,
      panelH: 380, panelY: 28, gap: 24, headMin: 400,
      stamp: 320, stampShare: 0.64, headGap: 24,
      lineLabel: 44, labelGap: 16,
      found: 68, target: 60, targetGap: 16,
      lensCode: 108, mark: 24, markGap: 18, panelPad: 22
    },
    top: {
      side: 32, top: 44, bottom: 34,
      logo: 54, file: 44, headerGap: 22, logoGap: 18,
      source: 56, number: 34, numberGap: 16,
      palCell: 14, surf: 28, palGap: 14, hop: 76,
      rail: 8, halo: 36, tip: 22,
      lensSide: 28, lensGap: 18, pad: 24,
      panelH: 244, panelY: 20, gap: 18, headMin: 260,
      stamp: 216, stampShare: 0.57, headGap: 22,
      lineLabel: 34, labelGap: 12,
      found: 56, target: 48, targetGap: 16,
      lensCode: 96, mark: 24, markGap: 16, panelPad: 22
    },
    overlay: {
      side: 36, top: 40, bottom: 36,
      logo: 56, file: 44, headerGap: 22, logoGap: 18,
      source: 56, number: 34, numberGap: 16,
      palCell: 15, surf: 30, palGap: 14, hop: 84,
      rail: 8, halo: 40, tip: 22,
      lensSide: 28, lensGap: 20, pad: 24,
      panelH: 242, panelY: 20, gap: 18, headMin: 276,
      stamp: 216, stampShare: 0.57, headGap: 22,
      lineLabel: 34, labelGap: 12,
      found: 56, target: 48, targetGap: 16,
      lensCode: 96, mark: 24, markGap: 16, panelPad: 22
    }
  };
  const M = { ...(layouts[variant] || layouts.full) };

  if (compact && H < 800) {
    Object.assign(M, {
      top: 24, bottom: 22,
      logo: 46, file: 38, headerGap: 16,
      source: 50, number: 32,
      palCell: 12, surf: 24, palGap: 12, hop: 52,
      rail: 7, halo: 30, tip: 18,
      lensGap: 16, pad: 18,
      panelH: 180, panelY: 12, gap: 12, headMin: 210,
      stamp: 168, headGap: 18,
      lineLabel: 32, labelGap: 8,
      found: 44, target: 40, targetGap: 12,
      lensCode: 84, mark: 20, markGap: 12, panelPad: 16
    });
  }
  if (compact && H < 640) {
    Object.assign(M, {
      top: 24, bottom: 20,
      logo: 40, file: 34, headerGap: 14,
      source: 44,
      lensGap: 14, pad: 16, gap: 10,
      panelY: 10, headMin: 196,
      stamp: 144, found: 42, target: 36,
      labelGap: 6, hop: 44
    });
  }

  const top = compact ? M.top : Math.max(M.top, safe.top || 0);
  const bottom = compact ? M.bottom : Math.max(M.bottom, safe.bottom || 0);
  const innerW = W - M.side * 2;
  const headerBottom = top + M.logo;
  const viewTop = headerBottom + M.headerGap;
  const viewH = Math.max(1, H - bottom - viewTop);
  const tl = gsap.timeline({ paused: true });
  const build = gsap.timeline();

  const requestedLine = Number(V.foundLine);
  const foundLine = Number.isFinite(requestedLine)
    ? Math.max(1, Math.round(requestedLine))
    : 212;
  const bugText = clean(V.bugLine);
  const fixText = clean(V.fixLine);
  const context = Array.from(
    { length: 8 }, (_, i) => clean(V[`filler${i + 1}`])
  ).filter((text) =>
    text.trim() && text !== bugText && text !== fixText
  );
  const bugSlot = Math.min(4, context.length, foundLine - 1);
  const finalLines = context.slice();
  finalLines.splice(bugSlot, 0, bugText);

  // A finite excerpt: no recycled rows, changing statements or wrapped numbers.
  const suppliedScan = String(V.scanCode == null ? "" : V.scanCode)
    .split(/\r?\n/)
    .map(clean)
    .filter((text) =>
      text.trim() && text !== bugText && text !== fixText
    );
  const earlier = (suppliedScan.length ? suppliedScan : context)
    .slice(-Math.max(0, foundLine - bugSlot - 1));
  const sourceLines = earlier.concat(finalLines);
  const firstLine = foundLine - bugSlot - earlier.length;
  const visibleRows = 8;
  const rowH = Math.max(viewH / visibleRows, minText * 1.65);
  const finalOffset = (bugSlot + 0.5) * rowH - viewH * 0.5;
  const travel = earlier.length * rowH;
  const numberW = Math.ceil(
    String(Math.max(foundLine + finalLines.length, 999)).length *
    M.number * 0.6
  );
  const codeLeft = numberW + M.numberGap;
  const codeRoom = Math.max(
    minText * 5, innerW - codeLeft - 8
  );

  Object.entries({
    "--bh-keyword": V.keywordColor,
    "--bh-number": V.numberColor,
    "--bh-string": V.stringColor,
    "--bh-comment": V.commentColor,
    "--bh-bug": V.bugColor,
    "--bh-fix": V.fixColor
  }).forEach(([name, value]) => stageEl.style.setProperty(name, value));

  stageEl.style.background = V.ground;
  $("bh-ground").style.background = V.ground;
  $("bh-glow").style.background =
    `radial-gradient(100% 70% at 65% 54%, ${rgba(V.accent, 0.12)}, transparent 76%)`;
  $("bh-grain").style.backgroundImage = grainUrl(220, 0.42, foundLine);

  function syntax(parent, input) {
    const text = clean(input);
    const pattern = /(\/\/[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b(?:if|return|const|let|var|await|async|function|throw|new|else|true|false|null|undefined)\b|\b\d+(?:\.\d+)?\b)/g;
    let cursor = 0;
    let match;
    while ((match = pattern.exec(text))) {
      if (match.index > cursor) {
        parent.appendChild(document.createTextNode(text.slice(cursor, match.index)));
      }
      const token = match[0];
      let kind = "keyword";
      if (token.startsWith("//")) kind = "comment";
      else if (/^["']/.test(token)) kind = "string";
      else if (/^\d/.test(token)) kind = "number";
      make("span", `bh-token-${kind}`, parent, token);
      cursor = match.index + token.length;
    }
    if (cursor < text.length) {
      parent.appendChild(document.createTextNode(text.slice(cursor)));
    }
  }

  function editRanges(before, after) {
    const pattern = /\s+|[A-Za-z_$][\w$]*|\d+(?:\.\d+)?|===|!==|=>|==|!=|<=|>=|\+\+|--|\+=|-=|\*\*|&&|\|\||\?\?|[^\s]/g;
    const a = Array.from(before.matchAll(pattern));
    const b = Array.from(after.matchAll(pattern));
    let start = 0;
    let end = 0;
    while (start < a.length && start < b.length &&
      a[start][0] === b[start][0]) start++;
    while (end < a.length - start && end < b.length - start &&
      a[a.length - 1 - end][0] === b[b.length - 1 - end][0]) end++;
    function range(tokens, text) {
      const from = start < tokens.length ? tokens[start].index : text.length;
      const last = tokens.length - end - 1;
      return {
        from,
        to: last >= start
          ? tokens[last].index + tokens[last][0].length
          : from
      };
    }
    return [range(a, before), range(b, after)];
  }
  const [bugEdit, fixEdit] = editRanges(bugText, fixText);

  const header = $("bh-header");
  header.style.cssText +=
    `;left:${M.side}px;top:${top}px;width:${innerW}px;height:${M.logo}px`;
  let logo = null;
  if (V.showLogo) logo = KIT.logo($("bh-brand"), M.logo, V.accent);
  else $("bh-brand").style.display = "none";

  const file = $("bh-file");
  file.textContent = clean(V.fileName);
  file.style.color = V.ink;
  file.style.fontSize = M.file + "px";
  file.style.marginLeft = (V.showLogo ? M.logoGap : 0) + "px";
  fit(file, innerW - (V.showLogo ? M.logo + M.logoGap : 0), minText);

  const viewport = $("bh-viewport");
  viewport.style.cssText +=
    `;left:${M.side}px;top:${viewTop}px;width:${innerW}px;height:${viewH}px`;
  $("bh-gutter").style.cssText +=
    `;width:${numberW + M.numberGap * 0.5}px;` +
    `border-color:${rgba(V.muted, 0.22)};background:${rgba(V.ink, 0.025)}`;

  const measure = document.createElement("canvas").getContext("2d");
  measure.font = `500 ${M.source}px "JetBrains Mono"`;
  const widestSource = Math.max(
    1, ...sourceLines.map((text) => measure.measureText(text).width)
  );
  const sourcePx = Math.max(
    minText, Math.min(M.source, M.source * codeRoom / widestSource)
  );
  measure.font = `500 ${sourcePx}px "JetBrains Mono"`;

  function sourcePlan(text) {
    if (measure.measureText(text).width <= codeRoom) return [text];
    const words = text.trim().split(/\s+/);
    const lines = [];
    let line = "";
    words.forEach((word) => {
      const next = line ? line + " " + word : word;
      if (line && measure.measureText(next).width > codeRoom) {
        lines.push(line);
        line = word;
      } else line = next;
    });
    if (line || !lines.length) lines.push(line);
    return lines;
  }

  const rows = sourceLines.map((text, index) => {
    const row = make("div", "bh-code-row", $("bh-code-rows"));
    row.style.height = rowH + "px";
    row.style.color = V.ink;
    const number = make("span", "bh-row-number", row, String(firstLine + index));
    number.style.cssText +=
      `;width:${numberW}px;margin-right:${M.numberGap}px;` +
      `font-size:${M.number}px;color:${V.muted}`;
    const code = make("span", "bh-source-code", row);
    code.style.fontSize = sourcePx + "px";
    const lines = sourcePlan(text);
    lines.forEach((line) => syntax(make("span", "bh-code-line", code), line));
    return { row, index, lines: lines.length };
  });

  function placeRow(r, y) {
    const center = y + rowH * 0.5;
    const half = Math.max(sourcePx * r.lines * 1.18, M.number * 1.15) * 0.5 + 3;
    r.row.style.visibility =
      center - half >= 0 && center + half <= viewH ? "inherit" : "hidden";
    return y + "px";
  }
  rows.forEach((r) => gsap.set(r.row, {
    y: placeRow(r, r.index * rowH - finalOffset)
  }));

  const focus = $("bh-source-focus");
  focus.style.cssText +=
    `;top:${bugSlot * rowH - finalOffset + 4}px;` +
    `height:${rowH - 8}px;background:${rgba(V.accent, 0.16)};` +
    `border-color:${V.accent}`;
  gsap.set(focus, { autoAlpha: 0, scaleX: 0, transformOrigin: "0% 50%" });

  const scanY = viewTop + viewH * 0.42;
  const caughtCenterY = viewTop + viewH * 0.5;
  const lockY = caughtCenterY + sourcePx * 0.59;
  const beam = $("bh-beam");
  beam.style.width = W + "px";
  beam.style.height = M.halo + "px";
  $("bh-beam-halo").style.background = rgba(V.accent, 0.16);
  $("bh-beam-halo").style.boxShadow =
    `0 0 ${M.halo}px ${rgba(V.accent, 0.32)}`;
  $("bh-beam-rail").style.cssText +=
    `;left:${M.side}px;right:${M.side}px;` +
    `top:${(M.halo - M.rail) * 0.5}px;height:${M.rail}px;background:${V.accent}`;
  $("bh-beam-core").style.cssText +=
    `;left:${M.side}px;right:${M.side}px;` +
    `top:${M.halo * 0.5 - 1}px;height:2px;background:${V.ink}`;
  $("bh-beam-tip").style.cssText +=
    `;right:${M.side}px;top:${(M.halo - M.tip) * 0.5}px;` +
    `width:${M.tip}px;height:${M.tip}px;background:${V.ink}`;
  gsap.set(beam, { y: scanY - M.halo * 0.5 });

  const lens = $("bh-lens");
  const underplate = $("bh-underplate");
  const flash = $("bh-flash");
  const lensW = W - M.lensSide * 2;
  const lensTop = viewTop + M.lensGap;
  const lensH = Math.max(1, H - bottom - 16 - lensTop);
  const lensInner = lensW - M.pad * 2;
  const minPanelH = minText * 2 * 1.18 + 16;
  const desiredHead = Math.min(
    M.headMin,
    Math.max(minText * 3, lensH - M.pad * 2 - M.gap * 2 - minPanelH * 2)
  );
  const panelH = Math.max(
    minPanelH,
    Math.min(M.panelH, (lensH - M.pad * 2 - M.gap * 2 - desiredHead) * 0.5)
  );
  const headH = lensH - M.pad * 2 - panelH * 2 - M.gap * 2;
  const bugTop = M.pad + headH + M.gap;
  const fixTop = bugTop + panelH + M.gap;

  lens.style.cssText +=
    `;left:${M.lensSide}px;top:${lensTop}px;width:${lensW}px;height:${lensH}px;` +
    `background:${V.ground};border-color:${V.accent};color:${V.ink}`;
  underplate.style.cssText +=
    `;left:${M.lensSide + 6}px;top:${lensTop + 9}px;` +
    `width:${lensW - 6}px;height:${lensH}px;` +
    `background:${rgba(V.accent, 0.09)};border-color:${rgba(V.accent, 0.42)}`;
  flash.style.cssText +=
    `;left:${M.lensSide - 4}px;top:${lensTop - 4}px;` +
    `width:${lensW + 8}px;height:${lensH + 8}px;border-color:${V.accent};` +
    `box-shadow:0 0 40px ${rgba(V.accent, 0.22)}`;

  // Expansion is anchored to the actual caught line, with no upward travel.
  const originX = Math.max(
    lensW * 0.35,
    Math.min(lensW * 0.65, M.side + codeLeft + codeRoom * 0.5 - M.lensSide)
  );
  const originY = Math.max(0, Math.min(lensH, caughtCenterY - lensTop));
  lens.style.transformOrigin = `${originX}px ${originY}px`;
  underplate.style.transformOrigin = `${originX - 6}px ${originY - 9}px`;

  const head = $("bh-lens-head");
  head.style.cssText +=
    `;left:${M.pad}px;top:${M.pad}px;width:${lensInner}px;height:${headH}px`;
  const stampW = (lensInner - M.headGap) * M.stampShare;
  const discoveryW = lensInner - stampW - M.headGap;
  $("bh-stamp").style.width = stampW + "px";
  $("bh-discovery").style.width = discoveryW + "px";
  $("bh-discovery").style.gap = M.targetGap + "px";

  const lineLabel = $("bh-line-label");
  lineLabel.textContent = clean(V.lineLabel);
  lineLabel.style.cssText +=
    `;font-size:${M.lineLabel}px;color:${V.muted};margin-bottom:${M.labelGap}px`;
  fit(lineLabel, stampW, minText);
  const stamp = $("bh-line-number");
  stamp.textContent = String(foundLine);
  stamp.style.color = V.accent;
  stamp.style.fontSize = Math.min(
    M.stamp,
    Math.max(84, (headH - lineLabel.getBoundingClientRect().height - M.labelGap - 8) / 0.86)
  ) + "px";
  fit(stamp, stampW - 8, 84);

  const target = $("bh-target");
  target.style.width = target.style.height = M.target + "px";
  target.style.color = V.accent;
  const found = $("bh-found-label");
  found.textContent = clean(V.foundLabel);
  found.style.color = V.ink;
  found.style.fontSize = M.found + "px";
  fit(found, discoveryW - M.target - M.targetGap - 4, minText);

  const bugPanel = $("bh-bug-panel");
  const fixPanel = $("bh-fix-panel");
  [bugPanel, fixPanel].forEach((panel, i) => {
    panel.style.cssText +=
      `;left:${M.pad}px;top:${i ? fixTop : bugTop}px;` +
      `width:${lensInner}px;height:${panelH}px;` +
      `padding:0 ${M.panelPad}px`;
  });
  bugPanel.style.background = rgba(V.removedGround, 0.23);
  bugPanel.style.borderColor = rgba(V.bugColor, 0.28);
  bugPanel.style.borderLeftColor = rgba(V.bugColor, 0.76);
  fixPanel.style.background = rgba(V.addedGround, 0.26);
  fixPanel.style.borderColor = rgba(V.fixColor, 0.28);
  fixPanel.style.borderLeftColor = V.fixColor;
  [$("bh-minus"), $("bh-plus")].forEach((mark, i) => {
    mark.style.cssText +=
      `;width:${M.mark}px;height:${M.mark}px;margin-right:${M.markGap}px;` +
      `color:${i ? V.fixColor : V.bugColor}`;
  });

  const lensCodeRoom =
    lensInner - M.panelPad * 2 - M.mark - M.markGap - 14;
  const lensMeasure = document.createElement("canvas").getContext("2d");
  lensMeasure.font = `500 ${M.lensCode}px "JetBrains Mono"`;
  const wrapComparison = Math.max(
    lensMeasure.measureText(bugText).width,
    lensMeasure.measureText(fixText).width
  ) > lensCodeRoom * 0.94;

  function outsideParens(text, end) {
    let depth = 0;
    let quote = "";
    let escaped = false;
    for (let i = 0; i < end; i++) {
      const ch = text[i];
      if (quote) {
        if (escaped) escaped = false;
        else if (ch === "\\") escaped = true;
        else if (ch === quote) quote = "";
      } else if (ch === '"' || ch === "'" || ch === "`") quote = ch;
      else if (ch === "(" || ch === "[") depth++;
      else if (ch === ")" || ch === "]") depth--;
    }
    return depth === 0;
  }

  function lensPlan(text) {
    if (wrapComparison) {
      // Keep the entire condition together; move its following statement.
      const candidates = Array.from(text.matchAll(/\s+(?=(?:return|throw)\b)/g));
      const split = candidates.find((match) => outsideParens(text, match.index));
      if (split) {
        const from = split.index + split[0].length;
        return [
          { text: text.slice(0, split.index), from: 0, indent: false },
          { text: text.slice(from), from, indent: true }
        ];
      }
    }
    return [{ text, from: 0, indent: false }];
  }

  const bugPlan = lensPlan(bugText);
  const fixPlan = lensPlan(fixText);
  const strikeParts = [];
  const edits = { removed: [], added: [] };

  function codePiece(parent, text, strike) {
    if (!text) return;
    const piece = make("span", "bh-code-piece", parent);
    syntax(piece, text);
    if (strike) {
      const bar = make("i", "bh-strike", piece);
      bar.style.background = V.bugColor;
      bar.style.height = (compact ? 3 : 4) + "px";
      strikeParts.push(bar);
    }
  }

  function lensSyntax(parent, plan, range, kind) {
    plan.forEach((entry) => {
      const line = make("span", "bh-code-line", parent);
      if (entry.indent) line.style.paddingLeft = "1.2em";
      const from = Math.max(0, range.from - entry.from);
      const to = Math.min(entry.text.length, range.to - entry.from);
      if (to <= from || from >= entry.text.length) {
        codePiece(line, entry.text, kind === "removed");
        return;
      }
      codePiece(line, entry.text.slice(0, from), kind === "removed");
      const edit = make("span", `bh-edit bh-edit-${kind}`, line);
      syntax(edit, entry.text.slice(from, to));
      const color = kind === "added" ? V.fixColor : V.bugColor;
      edit.style.backgroundColor = rgba(color, 0.18);
      edit.style.boxShadow = `0 3px 0 ${rgba(color, 0.9)}`;
      edits[kind].push(edit);
      codePiece(line, entry.text.slice(to), kind === "removed");
    });
  }

  const bugCode = $("bh-bug-code");
  const fixCode = $("bh-fix-code");
  lensSyntax(bugCode, bugPlan, bugEdit, "removed");
  lensSyntax(fixCode, fixPlan, fixEdit, "added");
  const maxLines = Math.max(bugPlan.length, fixPlan.length);
  const lensFontMax = Math.max(
    minText,
    Math.min(M.lensCode, (panelH - M.panelY * 2) / (maxLines * 1.18))
  );
  [bugCode, fixCode].forEach((code) => {
    code.style.color = V.ink;
    code.style.fontSize = lensFontMax + "px";
  });
  const lensPx = Math.min(
    fit(bugCode, lensCodeRoom, minText),
    fit(fixCode, lensCodeRoom, minText)
  );
  bugCode.style.fontSize = fixCode.style.fontSize = lensPx + "px";
  $("bh-minus").style.marginBottom = lensPx * 1.18 * (bugPlan.length - 1) + "px";
  $("bh-plus").style.marginBottom = lensPx * 1.18 * (fixPlan.length - 1) + "px";
  const bugWidth = Math.max(1, bugCode.getBoundingClientRect().width);
  const keyCodePunch = Math.max(1, Math.min(1.12, (lensCodeRoom - 6) / bugWidth));

  const edge = $("bh-edge-light");
  const edgeW = compact ? 128 : 176;
  edge.style.width = edgeW + "px";
  edge.style.background = V.ink;
  gsap.set([lens, underplate], {
    autoAlpha: 0, y: 0, scaleX: 0.88,
    scaleY: Math.min(1, sourcePx * 1.18 / lensH)
  });
  gsap.set([head, bugPanel], { autoAlpha: 0 });
  gsap.set(stamp, { scaleX: 0.74, scaleY: 0.74 });
  gsap.set(bugCode, { scaleX: keyCodePunch, scaleY: keyCodePunch });
  gsap.set(fixPanel, { autoAlpha: 0, x: 72, y: 0 });
  gsap.set(strikeParts, { scaleX: 0 });
  gsap.set(edge, { x: 0 });

  const pal = $("bh-pal");
  const board = $("bh-surfboard");
  const eyeEls = Array.from($("bh-gaze").querySelectorAll(".bh-eye"));
  let mascot = null;
  let homeX = 0;
  let homeY = 0;
  let lockPalY = 0;
  let perchX = 0;
  let perchY = 0;
  let celebrationHop = M.hop;

  function bodyPose(timeline, at, pose) {
    if (mascot) mascot.pose(timeline, at, { ...pose, eyes: "closed" });
  }
  function gaze(timeline, at, mode, duration = 0) {
    const c = M.palCell;
    const poses = {
      left: { x: -c * 0.55, y: c * 0.12, scaleX: 1, scaleY: 0.9 },
      right: { x: c * 0.5, y: c * 0.2, scaleX: 1, scaleY: 0.9 },
      down: { x: -c * 0.2, y: c * 0.7, scaleX: 1, scaleY: 0.9 },
      lock: { x: -c * 0.58, y: c * 0.72, scaleX: 1.24, scaleY: 0.7 },
      joy: { x: 0, y: 0, scaleX: 1.08, scaleY: 1.12 }
    };
    if (duration) timeline.to(eyeEls, {
      ...poses[mode], duration, ease: "power3.out"
    }, at);
    else timeline.set(eyeEls, poses[mode], at);
  }

  if (V.showMascot) {
    const c = M.palCell;
    mascot = KIT.mascot($("bh-pal-body"), c, { color: V.accent });
    pal.style.width = mascot.width + "px";
    pal.style.height = mascot.height + "px";
    $("bh-gaze").style.cssText +=
      `;left:${c * 2}px;top:${c * 3}px;width:${c * 7}px;` +
      `height:${c * 2}px;background:${V.accent}`;
    eyeEls.forEach((eye, i) => {
      eye.style.cssText +=
        `;left:${c * (i ? 5 : 1)}px;top:0;width:${c * 0.82}px;` +
        `height:${c}px;background:${V.ground}`;
    });
    board.style.cssText +=
      `;left:${-c * 1.5}px;top:${mascot.height - 2}px;` +
      `width:${mascot.width + c * 3}px;height:${c * 0.65}px;` +
      `background:${V.accent};border-color:${V.ink}`;
    homeX = W - M.side - mascot.width - c * 1.5;
    homeY = scanY - mascot.height;
    lockPalY = lockY - mascot.height;
    perchX = W - M.lensSide - M.pad - mascot.width - c * 0.75;
    perchY = lensTop + bugTop - c * 0.65 - mascot.height;
    celebrationHop = Math.max(
      0,
      Math.min(M.hop, perchY - (lensTop + M.pad + M.found + 16))
    );
    gsap.set(pal, {
      x: homeX, y: homeY, rotation: -16, scaleX: 1.14, scaleY: 0.82
    });
    bodyPose(build, 0, { arms: "left", legs: "right" });
    gaze(build, 0, "left");
  } else pal.style.display = "none";

  if (logo) build.fromTo(
    logo,
    { rotation: -35, scaleX: 0.85, scaleY: 0.85 },
    { rotation: 0, scaleX: 1, scaleY: 1, duration: 0.16, ease: "power3.out" },
    0
  );
  build.fromTo(file, { x: 22 }, {
    x: 0, duration: 0.16, ease: "power4.out"
  }, 0);
  build.fromTo($("bh-beam-rail"), { scaleY: 2.5 }, {
    scaleY: 1, duration: 0.14, ease: "power4.out"
  }, 0);

  const burstEnd = D * 0.085;
  const coastEnd = D * 0.24;
  const surgeEnd = D * 0.31;
  const fastEnd = D - 0.7;
  const brakeEnd = D - 0.56;
  const stopAt = D - 0.5;
  const lensAt = D - 0.26;
  const overshoot = travel ? rowH * 0.34 : 0;
  const phases = [
    { at: 0, end: burstEnd, from: 0, to: travel * 0.16, ease: "power2.out" },
    { at: burstEnd, end: coastEnd, from: travel * 0.16, to: travel * 0.3, ease: "none" },
    { at: coastEnd, end: surgeEnd, from: travel * 0.3, to: travel * 0.4, ease: "power1.in" },
    { at: surgeEnd, end: fastEnd, from: travel * 0.4, to: travel * 0.99, ease: "none" },
    { at: fastEnd, end: brakeEnd, from: travel * 0.99, to: travel + overshoot, ease: "power2.out" },
    { at: brakeEnd, end: stopAt, from: travel + overshoot, to: travel, ease: "power3.out" }
  ];
  rows.forEach((r) => {
    const initial = r.index * rowH - finalOffset;
    phases.forEach((phase) => build.fromTo(
      r.row,
      { y: initial - phase.from },
      {
        y: initial - phase.to,
        duration: phase.end - phase.at,
        ease: phase.ease,
        immediateRender: false,
        modifiers: { y: (value) => placeRow(r, parseFloat(value)) }
      },
      phase.at
    ));
  });

  if (mascot) {
    const c = M.palCell;
    const balances = [
      { at: 0, x: -M.surf, y: -c * 0.6, r: -24, sx: 1.2, sy: 0.76, arms: "left", legs: "right" },
      { at: burstEnd, x: -c * 0.4, y: 0, r: 13, sx: 0.94, sy: 1.04, arms: "right", legs: "left" },
      { at: coastEnd, x: -M.surf * 1.7, y: -c * 0.3, r: -21, sx: 1.18, sy: 0.8, arms: "left", legs: "right" },
      { at: surgeEnd + 0.16, x: -c, y: 0, r: 9, sx: 0.98, sy: 1.02, arms: "right", legs: "left" },
      { at: D * 0.53, x: -M.surf * 0.8, y: -c * 0.25, r: -14, sx: 1.08, sy: 0.88, arms: "left", legs: "right" },
      { at: D * 0.64, x: -c * 0.3, y: 0, r: 7, sx: 0.98, sy: 1.02, arms: "right", legs: "left" }
    ];
    balances.forEach((b) => {
      bodyPose(build, b.at, { arms: b.arms, legs: b.legs });
      build.to(pal, {
        x: homeX + b.x, y: homeY + b.y, rotation: b.r,
        scaleX: b.sx, scaleY: b.sy,
        duration: 0.14, ease: "power3.out"
      }, b.at);
      build.to(board, {
        rotation: -b.r * 0.16, duration: 0.14, ease: "power3.out"
      }, b.at);
    });
    gaze(build, burstEnd + 0.05, "right", 0.08);
    gaze(build, coastEnd - 0.12, "down", 0.07);
    gaze(build, surgeEnd + 0.12, "left", 0.07);
    gaze(build, D * 0.5, "right", 0.08);
    gaze(build, D * 0.64, "down", 0.07);

    // Inertia throws the surfer forward; the pupils lock without easing.
    bodyPose(build, fastEnd, { arms: "right", legs: "left" });
    gaze(build, fastEnd, "lock");
    build.to(pal, {
      x: homeX - c * 3.2, y: lockPalY,
      rotation: -34, scaleX: 1.24, scaleY: 0.72,
      duration: 0.13, ease: "power4.out"
    }, fastEnd);
    build.to(board, {
      rotation: 16, duration: 0.1, ease: "power4.out"
    }, fastEnd);
    build.to(pal, {
      x: homeX - c, rotation: 6, scaleX: 0.94, scaleY: 1.04,
      duration: stopAt - brakeEnd, ease: "power3.out"
    }, brakeEnd);
    build.to(board, {
      rotation: -5, duration: stopAt - brakeEnd, ease: "power3.out"
    }, brakeEnd);
    bodyPose(build, stopAt, { arms: "down", legs: "stand" });
  }

  build.to(beam, {
    y: lockY - M.halo * 0.5, duration: 0.1, ease: "power4.out"
  }, fastEnd + 0.08);
  build.set(focus, { autoAlpha: 1 }, stopAt);
  build.to(focus, { scaleX: 1, duration: 0.065, ease: "power4.out" }, stopAt);
  build.fromTo($("bh-beam-tip"),
    { scaleX: 2.2, scaleY: 2.2 },
    {
      scaleX: 1, scaleY: 1, duration: 0.13,
      ease: "power3.out", immediateRender: false
    },
    stopAt
  );

  const peakScale = Math.min(
    1.065,
    1 + Math.max(0.02, lensTop - headerBottom - 8) / Math.max(1, originY),
    1 + (M.lensSide - 4) / Math.max(originX, lensW - originX)
  );
  const keyScale = Math.min(compact ? 1.032 : 1.035, peakScale);
  build.set([viewport, beam], { autoAlpha: 0 }, lensAt);
  build.set([lens, underplate, head, bugPanel], { autoAlpha: 1 }, lensAt);
  build.to([lens, underplate], {
    scaleX: peakScale, scaleY: peakScale,
    duration: 0.19, ease: "power4.out"
  }, lensAt);
  build.to(stamp, {
    scaleX: 1, scaleY: 1, duration: 0.14, ease: "back.out(1.8)"
  }, lensAt + 0.12);
  build.to([lens, underplate], {
    scaleX: keyScale, scaleY: keyScale,
    duration: 0.07, ease: "power2.in"
  }, D - 0.07);

  if (mascot) {
    build.to(pal, {
      x: perchX, y: perchY, rotation: -7,
      scaleX: 1.12, scaleY: 0.82,
      duration: D - lensAt, ease: "power4.out"
    }, lensAt);
    build.to(board, {
      rotation: 0, scaleX: 0.88,
      duration: D - lensAt, ease: "power4.out"
    }, lensAt);
  }

  build.timeScale(1 / T.scale);
  tl.add(build, 0);

  const key = T.key;
  const hold = Math.max(0, T.hold);
  const settle = Math.min(0.16, hold * 0.12);
  const fixHit = Math.min(0.66, hold * 0.34);
  const strikeAt = fixHit * 0.18;
  const splitAt = fixHit * 0.42;
  const splitDuration = fixHit * 0.38;
  const fixEnter = fixHit * 0.76;
  const fixMove = fixHit - fixEnter;
  const fixSettle = Math.min(0.18, Math.max(0, hold - fixHit) * 0.16);

  tl.to([lens, underplate], {
    scaleX: 1, scaleY: 1, duration: settle, ease: "power3.out"
  }, key);
  tl.fromTo(flash, { opacity: 1 }, {
    opacity: 0, duration: settle, ease: "power2.out", immediateRender: false
  }, key);
  if (mascot) {
    bodyPose(tl, key, { arms: "down", legs: "stand" });
    gaze(tl, key, "lock");
    tl.to(pal, {
      rotation: -4, scaleX: 1, scaleY: 1,
      duration: settle, ease: "power3.out"
    }, key);
  }

  strikeParts.forEach((bar, index) => {
    tl.to(bar, {
      scaleX: 1, duration: fixHit * 0.21, ease: "power3.out"
    }, key + strikeAt + index * Math.min(0.025, fixHit * 0.035));
  });
  tl.to(bugCode, {
    scaleX: 1, scaleY: 1, duration: splitDuration, ease: "power3.out"
  }, key + splitAt);
  tl.set(fixPanel, { autoAlpha: 1 }, key + fixEnter);
  tl.to(fixPanel, {
    x: 0, duration: fixMove, ease: "power4.out"
  }, key + fixEnter);

  // Correction, operator flash, outline and character all hit together.
  tl.set(lens, { borderColor: V.fixColor }, key + fixHit);
  tl.set(stamp, { color: V.fixColor }, key + fixHit);
  tl.set(target, { color: V.fixColor }, key + fixHit);
  tl.set(edge, { backgroundColor: V.fixColor }, key + fixHit);
  tl.set(underplate, {
    backgroundColor: rgba(V.fixColor, 0.09),
    borderColor: rgba(V.fixColor, 0.48)
  }, key + fixHit);
  if (edits.added.length) {
    tl.fromTo(edits.added,
      { backgroundColor: rgba(V.fixColor, 0.62) },
      {
        backgroundColor: rgba(V.fixColor, 0.18),
        duration: fixSettle, ease: "power3.out", immediateRender: false
      },
      key + fixHit
    );
  }
  tl.fromTo(fixPanel, { scaleX: 1.016, scaleY: 1.045 }, {
    scaleX: 1, scaleY: 1, duration: fixSettle,
    ease: "power3.out", immediateRender: false
  }, key + fixHit);
  tl.fromTo(target, { scaleX: 1.25, scaleY: 1.25 }, {
    scaleX: 1, scaleY: 1, duration: fixSettle,
    ease: "power3.out", immediateRender: false
  }, key + fixHit);
  tl.set(flash, { borderColor: V.fixColor }, key + fixHit);
  tl.fromTo(flash, { opacity: 0.88 }, {
    opacity: 0, duration: fixSettle,
    ease: "power2.out", immediateRender: false
  }, key + fixHit);

  if (mascot) {
    const available = Math.max(0, hold - fixHit);
    const up = Math.min(0.2, available * 0.22);
    const down = Math.min(0.16, available * 0.18);
    const land = Math.min(0.14, available * 0.15);
    const landAt = key + fixHit + up + down;
    tl.to(pal, {
      scaleX: 1.2, scaleY: 0.7, rotation: -8,
      duration: fixHit * 0.15, ease: "power3.in"
    }, key + fixHit * 0.85);
    bodyPose(tl, key + fixHit, { arms: "up", legs: "stand" });
    gaze(tl, key + fixHit, "joy");
    tl.set(board, { backgroundColor: V.fixColor }, key + fixHit);
    tl.to(pal, {
      y: perchY - celebrationHop, x: perchX,
      rotation: 0, scaleX: 0.9, scaleY: 1.12,
      duration: up, ease: "power3.out"
    }, key + fixHit);
    // Counter-travel leaves the parked board beneath the airborne mascot.
    tl.to(board, {
      y: celebrationHop, rotation: 0,
      duration: up, ease: "power3.out"
    }, key + fixHit);
    tl.to(pal, {
      y: perchY, x: perchX, rotation: 0,
      scaleX: 0.94, scaleY: 1.06,
      duration: down, ease: "power3.in"
    }, key + fixHit + up);
    tl.to(board, {
      y: 0, rotation: 0,
      duration: down, ease: "power3.in"
    }, key + fixHit + up);
    bodyPose(tl, landAt, { arms: "up", legs: "stand" });
    tl.set(pal, { scaleX: 1.22, scaleY: 0.74 }, landAt);
    tl.to(pal, {
      scaleX: 1, scaleY: 1, duration: land, ease: "power3.out"
    }, landAt);

    const breatheAt = fixHit + up + down + land;
    const remaining = hold - breatheAt;
    if (remaining > 0.1) {
      tl.fromTo(pal, { scaleX: 1, scaleY: 1 }, {
        scaleX: 1.015, scaleY: 0.985,
        duration: remaining * 0.5, repeat: 1, yoyo: true,
        ease: "sine.inOut", immediateRender: false
      }, key + breatheAt);
    }
    if (remaining > 0.5) {
      const blink = key + breatheAt + remaining * 0.58;
      tl.to(eyeEls, {
        scaleY: 0.1, duration: 0.045, ease: "power2.in"
      }, blink);
      tl.to(eyeEls, {
        scaleY: 1.12, duration: 0.06, ease: "power2.out"
      }, blink + 0.045);
    }
  }

  tl.fromTo(edge, { x: 0 }, {
    x: lensW - edgeW - 6, duration: hold,
    ease: "sine.inOut", immediateRender: false
  }, key);
  const dotAt = fixHit + fixSettle;
  if (hold - dotAt > 0.1) {
    tl.fromTo(target.querySelector("b"), { scaleX: 1, scaleY: 1 }, {
      scaleX: 0.55, scaleY: 0.55,
      duration: (hold - dotAt) * 0.5, repeat: 1, yoyo: true,
      ease: "sine.inOut", immediateRender: false
    }, key + dotAt);
  }

  const rnd = seeded(foundLine);
  const sparkX = mascot
    ? perchX + M.palCell * 5.5
    : M.lensSide + lensW * 0.78;
  const sparkY = lensTop + bugTop - M.palCell * 0.65;
  const maxLift = Math.min(
    compact ? 130 : 180,
    Math.max(24, sparkY - headerBottom - 20)
  );
  function burst(at, count, colors, available, spread) {
    if (available <= 0) return;
    for (let i = 0; i < count; i++) {
      const p = make("div", "bh-pixel", $("bh-pixels"));
      const size = (compact ? 8 : 12) * (1 + Math.floor(rnd() * 2));
      const x = sparkX + (rnd() - 0.5) * M.palCell * 3;
      const endX = Math.max(
        12, Math.min(W - size - 12, x + (rnd() - 0.5) * spread)
      );
      const lift = maxLift * (0.45 + rnd() * 0.55);
      const life = Math.min(available, 0.46 + rnd() * 0.16);
      const up = life * 0.4;
      p.style.cssText +=
        `;width:${size}px;height:${size}px;background:${colors[i % colors.length]}`;
      gsap.set(p, { x, y: sparkY, autoAlpha: 0 });
      tl.set(p, { autoAlpha: 1 }, at);
      tl.to(p, { x: endX, duration: life, ease: "power2.out" }, at);
      tl.to(p, { y: sparkY - lift, duration: up, ease: "power3.out" }, at);
      tl.to(p, {
        y: sparkY + 28, duration: life - up, ease: "power2.in"
      }, at + up);
      tl.set(p, { autoAlpha: 0 }, at + life);
    }
  }
  burst(key, 7, [V.accent, V.ink], hold, W * 0.3);
  burst(key + fixHit, 14, [V.fixColor, V.ink, V.fixColor],
    hold - fixHit, W * 0.46);

  const open = "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)";
  const shut = "polygon(0% 50%, 100% 50%, 100% 50%, 0% 50%)";
  gsap.set(stageEl, { clipPath: open });
  if (variant === "overlay") {
    tl.fromTo(stageEl, { clipPath: shut }, {
      clipPath: open, duration: 0.18, ease: "power4.out"
    }, 0);
  }
  if (T.exit > 0) {
    tl.to(stageEl, {
      clipPath: shut,
      duration: Math.max(0, T.exit - 1 / CA.fps),
      ease: "power3.in"
    }, key + hold);
  }
  window.__timelines["block"] = tl;
});