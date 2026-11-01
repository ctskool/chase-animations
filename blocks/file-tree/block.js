CA.ready(() => {
  const {
    vars: V, stage: S, safe, time: T, variant,
    make, fit, rgba, parseStat, formatStat, grainUrl, seeded
  } = CA;

  const KIT = CA.claude;
  const $ = (id) => document.getElementById(id);
  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
  const W = S.w;
  const H = S.h;
  const D = T.design;
  const compact = variant !== "full";
  const minText = compact ? 32 : 40;
  const stageEl = $("stage");
  const tl = gsap.timeline({ paused: true });
  const build = gsap.timeline();
  const rnd = seeded(47);

  const layouts = {
    full: {
      side: 56, top: 230, bottom: 300, gap: 16,
      logo: 48, headerPx: 40,
      rootH: 184, rootPx: 184, rootIcon: 104,
      finalRootH: 132, finalRootPx: 132, finalRootIcon: 84,
      rowH: 168, namePx: 124, folderPx: 116,
      icon: 46, dot: 26, indent: 54, labelGap: 18, line: 12,
      meterH: 296, countPx: 226, clockPx: 50, meterInset: 18,
      plateH: 324, finalPx: 278, finalTimePx: 48,
      platePad: 22, statGap: 10,
      palCell: 18, summaryPx: 96, summaryIndent: 48,
      summaryDot: 18, summaryLine: 10,
      jump: 150, perchPad: 24
    },
    top: {
      side: 40, top: 24, bottom: 24, gap: 12,
      logo: 44, headerPx: 34,
      rootH: 136, rootPx: 148, rootIcon: 88,
      finalRootH: 120, finalRootPx: 120, finalRootIcon: 72,
      rowH: 112, namePx: 100, folderPx: 94,
      icon: 40, dot: 22, indent: 42, labelGap: 16, line: 10,
      meterH: 266, countPx: 198, clockPx: 42, meterInset: 16,
      plateH: 300, finalPx: 264, finalTimePx: 42,
      platePad: 22, statGap: 10,
      palCell: 14, summaryPx: 80, summaryIndent: 26,
      summaryDot: 16, summaryLine: 8,
      jump: 100, perchPad: 24
    },
    overlay: {
      side: 36, top: 28, bottom: 26, gap: 10,
      logo: 44, headerPx: 34,
      rootH: 132, rootPx: 148, rootIcon: 84,
      finalRootH: 116, finalRootPx: 120, finalRootIcon: 72,
      rowH: 110, namePx: 98, folderPx: 92,
      icon: 40, dot: 22, indent: 40, labelGap: 16, line: 10,
      meterH: 264, countPx: 198, clockPx: 42, meterInset: 16,
      plateH: 296, finalPx: 262, finalTimePx: 42,
      platePad: 22, statGap: 10,
      palCell: 14, summaryPx: 80, summaryIndent: 26,
      summaryDot: 16, summaryLine: 8,
      jump: 104, perchPad: 24
    }
  };

  const M = { ...(layouts[variant] || layouts.full) };
  const pressure = compact ? clamp((960 - H) / 320, 0, 1) : 0;

  if (compact) {
    M.logo -= pressure * 8;
    M.headerPx -= pressure * 2;
    M.rootH -= pressure * 28;
    M.rootPx -= pressure * 24;
    M.rootIcon -= pressure * 12;
    M.finalRootH -= pressure * 36;
    M.finalRootPx -= pressure * 36;
    M.finalRootIcon -= pressure * 12;
    M.rowH -= pressure * 18;
    M.namePx -= pressure * 14;
    M.folderPx -= pressure * 14;
    M.icon -= pressure * 6;
    M.meterH -= pressure * 64;
    M.countPx -= pressure * 44;
    M.clockPx -= pressure * 8;
    M.plateH -= pressure * 100;
    M.platePad -= pressure * 6;
    M.statGap -= pressure * 2;
    M.finalTimePx -= pressure * 8;
    M.summaryPx -= pressure * 12;
    M.palCell = Math.max(12, Math.round(M.palCell - pressure * 2));
  }

  const side = M.side;
  const inner = W - side * 2;
  const gap = M.gap - pressure * 4;
  const top = compact
    ? M.top - pressure * 8
    : Math.max(M.top, safe.top || 0);
  const bottom = compact
    ? H - M.bottom
    : H - Math.max(M.bottom, safe.bottom || 0);

  const hasHeader = V.showLogo || String(V.headerLabel || "").trim().length > 0;
  const hasTime = String(V.timeStat || "").trim().length > 0;
  const headerH = hasHeader ? M.logo : 0;
  const headerLift = hasHeader ? headerH + gap : 0;
  const rootTop = top + headerLift;
  const rootH = M.rootH;
  const treeTop = rootTop + rootH + gap;
  const finalTreeTop = top + M.finalRootH + gap;
  const meterTop = bottom - M.meterH;
  const nodeH = Math.ceil(M.namePx * 1.08);
  const treeH = Math.max(nodeH + 24, meterTop - treeTop - gap);
  const plateH = M.plateH;
  const plateTop = bottom - plateH;
  const overviewH = Math.max(80, plateTop - finalTreeTop - gap);

  function svg(tag, attrs, parent) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
    Object.entries(attrs || {}).forEach(([key, value]) => {
      el.setAttribute(key, String(value));
    });
    if (parent) parent.appendChild(el);
    return el;
  }

  function folder(parent, size, color) {
    const el = svg("svg", {
      class: "folder-svg",
      width: size,
      height: size,
      viewBox: "0 0 64 64",
      "aria-hidden": "true"
    }, parent);

    svg("path", {
      d: "M5 15 Q5 10 10 10 H25 L32 18 H54 Q59 18 59 23 V49 Q59 54 54 54 H10 Q5 54 5 49 Z",
      fill: rgba(color, 0.55)
    }, el);

    const flap = svg("path", {
      d: "M5 27 Q5 23 10 23 H55 Q60 23 59 28 L56 49 Q55 54 50 54 H12 Q7 54 7 49 Z",
      fill: color
    }, el);

    gsap.set(flap, { transformOrigin: "50% 100%" });
    return { el, flap };
  }

  function fileColor(path) {
    const p = path.toLowerCase();
    if (/(^|\/)(__tests__|tests?|specs?)(\/|$)|\.(test|spec)\./.test(p)) {
      return V.testColor;
    }
    if (/\.(md|mdx|txt|rst)$/.test(p)) return V.docColor;
    if (/\.(tsx?|jsx?|css|scss|html|json|sql|py|rb|go|rs|sh|ya?ml)$/.test(p)) {
      return V.sourceColor;
    }
    return V.otherColor;
  }

  const rootNode = {
    name: String(V.root || ""),
    path: "",
    depth: 0,
    index: -1,
    folder: true,
    children: new Map()
  };

  String(V.paths || "").split(/\r?\n/).forEach((raw) => {
    const clean = raw.trim().replace(/\\/g, "/");
    if (!clean || clean.endsWith("/")) return;

    const parts = [];
    clean.split("/").forEach((part) => {
      if (!part || part === ".") return;
      if (part === "..") parts.pop();
      else parts.push(part);
    });

    if (parts[0] === rootNode.name) parts.shift();

    let parent = rootNode;
    parts.forEach((name) => {
      if (!parent.children.has(name)) {
        parent.children.set(name, {
          name,
          path: parent.path ? parent.path + "/" + name : name,
          depth: parent.depth + 1,
          parent,
          children: new Map()
        });
      }
      parent = parent.children.get(name);
    });
  });

  const nodes = [];

  function flatten(parent, group) {
    parent.children.forEach((node) => {
      node.folder = node.children.size > 0;
      node.index = nodes.length;
      node.group = group || node;
      nodes.push(node);
      flatten(node, node.group);
    });
  }

  flatten(rootNode, null);

  const files = nodes.filter((node) => !node.folder);
  const maxDepth = Math.max(1, ...nodes.map((node) => node.depth));
  const parsedCount = parseStat(V.filesStat);

  // A supplied filename can stand for a batch from the larger project.
  // Its counter increment gets that many visible arriving file rows.
  files.forEach((node, index) => {
    const before = parsedCount
      ? Math.round(parsedCount.value * index / files.length)
      : index;
    const after = parsedCount
      ? Math.round(parsedCount.value * (index + 1) / files.length)
      : index + 1;
    node.arrivalRows = Math.max(1, after - before);
  });

  const pal = $("pal");
  const palBody = $("pal-body");
  const seatLegs = $("pal-seat-legs");
  const clawd = KIT.mascot(palBody, M.palCell, { color: V.accent });

  const rootAnchor = M.rootIcon / 2 + M.line;
  const trunkBase = V.showMascot
    ? clawd.width + M.line
    : rootAnchor;

  const indent = Math.min(
    M.indent,
    Math.max(18, (inner - trunkBase - minText * 7) / (maxDepth + 2))
  );

  rootNode.anchor = trunkBase;

  nodes.forEach((node) => {
    node.anchor = trunkBase + node.depth * indent;
    node.labelX = node.anchor + M.icon / 2 + M.labelGap;
    node.color = node.folder ? V.accent : fileColor(node.path);
  });

  stageEl.style.background = V.ground;
  $("ground").style.background = V.ground;
  $("grain").style.backgroundImage = grainUrl(180, 0.35, 19);
  $("ambient").style.background =
    `radial-gradient(ellipse at 100% 50%,transparent 0%,transparent 43%,` +
    `${rgba(V.accent, 0.025)} 43%,${rgba(V.accent, 0.025)} 47%,transparent 47%)`;
  $("flash").style.background = V.plateColor;

  const header = $("header");
  header.style.cssText +=
    `;left:${side}px;top:${top}px;width:${inner}px;height:${headerH}px;gap:${gap}px`;

  const logo = V.showLogo ? KIT.logo($("brand"), M.logo, V.accent) : null;
  if (!V.showLogo) $("brand").style.display = "none";
  if (!hasHeader) header.style.display = "none";

  const headerLabel = $("header-label");
  headerLabel.textContent = V.headerLabel;
  headerLabel.style.cssText += `;font-size:${M.headerPx}px;color:${V.muted}`;
  if (headerLabel.textContent) {
    fit(headerLabel, inner - (V.showLogo ? M.logo + gap : 0), minText);
  }

  const rootHeading = $("root-heading");
  rootHeading.style.cssText +=
    `;left:${side}px;top:${rootTop}px;width:${inner}px;height:${rootH}px`;

  const rootIcon = $("root-icon");
  rootIcon.style.cssText +=
    `;left:${rootAnchor - M.rootIcon / 2}px;` +
    `top:${(rootH - M.rootIcon) / 2}px;` +
    `width:${M.rootIcon}px;height:${M.rootIcon}px`;

  const rootFolder = folder(rootIcon, M.rootIcon, V.accent);
  const rootName = $("root-name");
  const rootTextLeft = rootAnchor + M.rootIcon / 2 + gap;
  const finalRootTextLeft = rootAnchor + M.finalRootIcon / 2 + gap;

  rootName.textContent = V.root;
  rootName.style.cssText +=
    `;left:${rootTextLeft}px;font-size:${M.rootPx}px;color:${V.ink}`;

  if (rootName.textContent) fit(rootName, inner - rootTextLeft - 8, minText);
  const liveRootFont = parseFloat(getComputedStyle(rootName).fontSize);
  const liveRootNameTop = Math.max(0, (rootH - rootName.offsetHeight) / 2);

  rootName.style.fontSize = M.finalRootPx + "px";
  if (rootName.textContent) {
    fit(rootName, inner - finalRootTextLeft - 8, minText);
  }

  const finalRootFont = parseFloat(getComputedStyle(rootName).fontSize);
  const finalRootNameTop = Math.max(
    0,
    (M.finalRootH - rootName.offsetHeight) / 2
  );

  rootName.style.fontSize = liveRootFont + "px";
  rootName.style.top = liveRootNameTop + "px";

  const summaryLine = M.summaryLine;
  const beamY = summaryLine / 2 + 4;
  const rootTail = $("root-tail");
  const tailHeight = rootH + gap + M.line * 2;

  rootTail.style.cssText += `;width:${inner}px;height:${tailHeight}px`;

  const tailSvg = svg("svg", {
    width: inner,
    height: tailHeight,
    viewBox: `0 0 ${inner} ${tailHeight}`,
    "aria-hidden": "true"
  }, rootTail);

  const folderBottom =
    (rootH - M.rootIcon) / 2 + M.rootIcon * 54 / 64;
  const finalFolderBottom =
    (M.finalRootH - M.finalRootIcon) / 2 + M.finalRootIcon * 54 / 64;

  const rootLead = svg("path", {
    class: "tree-edge",
    d:
      `M ${rootAnchor} ${folderBottom} ` +
      `V ${rootH + gap / 2} H ${trunkBase} V ${rootH + gap + M.line / 2}`,
    stroke: V.branchColor,
    "stroke-width": M.line,
    pathLength: 1,
    "stroke-dasharray": 1,
    "stroke-dashoffset": 1
  }, tailSvg);

  const finalRootLead =
    `M ${rootAnchor} ${finalFolderBottom} ` +
    `V ${M.finalRootH + gap / 2} H ${rootAnchor} ` +
    `V ${M.finalRootH + gap + beamY}`;

  const treeWindow = $("tree-window");
  const rows = $("tree-rows");
  const lines = $("tree-lines");
  const overview = $("tree-overview");

  treeWindow.style.cssText +=
    `;left:${side}px;top:${treeTop}px;width:${inner}px;height:${treeH}px`;

  lines.setAttribute("width", String(inner));
  lines.setAttribute("height", String(treeH));
  lines.setAttribute("viewBox", `0 0 ${inner} ${treeH}`);

  const characterPad = V.showMascot
    ? clawd.height / 2 + M.palCell / 2 + M.line
    : 0;
  const rowPad = Math.max(nodeH / 2 + 10, characterPad);
  const capacity = Math.max(
    1,
    Math.floor((treeH - rowPad * 2) / M.rowH) + 1
  );
  const slots = Math.max(1, Math.min(capacity, nodes.length || 1));
  const pitch = slots > 1
    ? Math.max(0, treeH - rowPad * 2) / (slots - 1)
    : 0;
  const firstY = slots > 1 ? rowPad : treeH / 2;
  const rowY = (slot) => firstY + slot * pitch;

  function liveStem(node, start) {
    const childY = rowY(node.index - start);
    const parentY = node.parent.index >= start
      ? rowY(node.parent.index - start)
      : M.line / 2;
    return `M ${node.parent.anchor} ${parentY} V ${childY}`;
  }

  function liveBranch(node, start) {
    return `M ${node.parent.anchor} ${rowY(node.index - start)} H ${node.anchor}`;
  }

  const groups = Array.from(rootNode.children.values()).map((head) =>
    nodes.filter((node) => node.group === head)
  );

  let columns = [nodes];

  // Keep folder families intact. Both compact columns belong to one root.
  if ((compact || nodes.length > 18) && groups.length > 1) {
    let bestCut = 1;
    let bestPeak = Infinity;
    let leftSize = 0;

    for (let i = 1; i < groups.length; i++) {
      leftSize += groups[i - 1].length;
      const peak = Math.max(leftSize, nodes.length - leftSize);
      if (peak < bestPeak) {
        bestPeak = peak;
        bestCut = i;
      }
    }

    columns = [
      groups.slice(0, bestCut).flat(),
      groups.slice(bestCut).flat()
    ];
  }

  const columnGap = compact ? 32 : 36;
  const columnW =
    (inner - columnGap * (columns.length - 1)) / columns.length;
  const maxRows = Math.max(1, ...columns.map((column) => column.length));
  const overviewNamePx = Math.max(
    minText,
    Math.min(
      M.summaryPx,
      Math.floor((overviewH - summaryLine * 2) / ((maxRows - 1) * 0.9 + 1.24))
    )
  );

  // Half a line of room at each end, so a short tree can't spill out of the window.
  const summaryTop = overviewNamePx * 0.62 + summaryLine;
  const summaryBottom = summaryTop;
  const summaryPitch = maxRows > 1
    ? Math.max(1, overviewH - summaryTop - summaryBottom) / (maxRows - 1)
    : Math.max(minText * 1.2, overviewH / 2);

  const dotSize = Math.max(
    summaryLine + 2,
    Math.min(M.summaryDot, overviewNamePx * 0.35)
  );
  const summaryLabelGap = compact ? 12 : 14;
  const summaryIndent = M.summaryIndent;
  const columnRoots = columns.map((column, columnIndex) => ({
    summaryX: columnIndex === 0
      ? rootAnchor
      : columnIndex * (columnW + columnGap) + summaryLine + 6,
    summaryY: beamY
  }));

  columns.forEach((column, columnIndex) => {
    let columnPitch = summaryPitch;

    // Leave a clear seat above the plate in the final right-hand column.
    if (
      V.showMascot &&
      columns.length > 1 &&
      columnIndex === columns.length - 1 &&
      column.length > 1
    ) {
      const perchTop = overviewH + gap - M.palCell * 6;
      const lastCenter = perchTop - gap - overviewNamePx * 0.45;
      columnPitch = Math.min(
        summaryPitch,
        Math.max(1, (lastCenter - summaryTop) / (column.length - 1))
      );
    }

    column.forEach((node, rowIndex) => {
      node.column = columnIndex;
      node.summaryX =
        columnRoots[columnIndex].summaryX + node.depth * summaryIndent;
      node.summaryY = maxRows > 1
        ? summaryTop + rowIndex * columnPitch
        : Math.min(overviewH / 2, summaryTop + overviewNamePx);
      node.nameX = node.summaryX + dotSize / 2 + summaryLabelGap;
      node.summaryRoom = Math.max(
        minText,
        columnIndex * (columnW + columnGap) + columnW - node.nameX - 8
      );
      node.summaryParent = node.parent.index >= 0
        ? node.parent
        : columnRoots[columnIndex];
    });
  });

  const summaryRoot = make("div", "overview-root", overview);
  summaryRoot.style.cssText +=
    `;left:${rootAnchor - summaryLine / 2}px;` +
    `top:${beamY - summaryLine / 2}px;` +
    `width:${summaryLine}px;height:${summaryLine}px;background:${V.accent}`;

  if (!nodes.length) summaryRoot.style.display = "none";

  let bridge = null;
  if (columns.length > 1) {
    bridge = make("div", "overview-bridge", overview);
    bridge.style.cssText +=
      `;left:${rootAnchor - summaryLine / 2}px;` +
      `top:${beamY - summaryLine / 2}px;` +
      `width:${columnRoots[1].summaryX - rootAnchor + summaryLine}px;` +
      `height:${summaryLine}px;background:${V.branchColor}`;
    gsap.set(bridge, { scaleX: 0 });
  }

  function arrivalBatch(parent, amount, width, height, color, stroke) {
    const batch = make("div", "file-arrival-batch", parent);
    batch.setAttribute("aria-hidden", "true");
    batch.style.cssText +=
      `;position:absolute;left:0;top:50%;width:${width}px;height:${height}px;` +
      `pointer-events:none;transform-origin:50% 50%`;
    gsap.set(batch, { autoAlpha: 0, yPercent: -50 });

    const rowPitch = height / amount;
    const dot = Math.max(2, Math.min(width * 0.24, rowPitch * 0.55));
    const lineH = Math.max(2, Math.min(stroke, rowPitch * 0.32));
    const lineLeft = dot + Math.max(2, width * 0.1);

    for (let i = 0; i < amount; i++) {
      const row = make("div", "file-arrival-row", batch);
      row.style.cssText +=
        `;position:absolute;left:0;top:${i * rowPitch}px;` +
        `width:${width}px;height:${rowPitch}px`;

      const mark = make("div", "file-arrival-dot", row);
      mark.style.cssText +=
        `;position:absolute;left:0;top:${(rowPitch - dot) / 2}px;` +
        `width:${dot}px;height:${dot}px;border-radius:50%;background:${color}`;

      const line = make("div", "file-arrival-line", row);
      line.style.cssText +=
        `;position:absolute;left:${lineLeft}px;` +
        `top:${(rowPitch - lineH) / 2}px;` +
        `width:${Math.max(2, width - lineLeft)}px;height:${lineH}px;` +
        `background:${color}`;
    }

    return batch;
  }

  nodes.forEach((node) => {
    const edgeAttrs = {
      class: "tree-edge",
      stroke: V.branchColor,
      "stroke-width": M.line,
      pathLength: 1,
      "stroke-dasharray": 1,
      "stroke-dashoffset": 1
    };

    node.stem = svg("path", {
      ...edgeAttrs,
      d: `M ${node.parent.anchor} 0 V 0`
    }, lines);

    node.edge = svg("path", {
      ...edgeAttrs,
      d: `M ${node.parent.anchor} 0 H ${node.anchor}`
    }, lines);

    const rowLeft = node.anchor - M.icon / 2;
    node.row = make("div", "tree-node", rows);
    node.row.style.cssText +=
      `;left:${rowLeft}px;width:${inner - rowLeft - 8}px;` +
      `height:${nodeH}px;color:${V.ink}`;

    node.icon = make("div", "node-icon", node.row);
    node.icon.style.cssText +=
      `;width:${M.icon}px;height:${M.icon}px;margin-right:${M.labelGap}px`;

    if (node.folder) {
      node.folderArt = folder(node.icon, M.icon, V.accent);
    } else {
      node.fileDot = make("div", "file-dot", node.icon);
      node.fileDot.style.cssText +=
        `;width:${M.dot}px;height:${M.dot}px;background:${node.color}`;

      if (node.arrivalRows > 1) {
        node.liveBatch = arrivalBatch(
          node.icon,
          node.arrivalRows,
          M.icon,
          nodeH * 0.8,
          node.color,
          M.line * 0.5
        );
      }
    }

    node.label = make("span", "node-name", node.row, node.name);
    node.label.style.fontSize = (node.folder ? M.folderPx : M.namePx) + "px";
    fit(node.label, inner - node.labelX - 12, minText);

    node.overEdge = make("div", "overview-edge", overview);
    node.overV = make("div", "overview-segment", node.overEdge);
    node.overH = make("div", "overview-segment", node.overEdge);

    node.overV.style.cssText +=
      `;left:${node.summaryParent.summaryX - summaryLine / 2}px;` +
      `top:${node.summaryParent.summaryY - summaryLine / 2}px;` +
      `width:${summaryLine}px;` +
      `height:${node.summaryY - node.summaryParent.summaryY + summaryLine}px;` +
      `background:${V.branchColor}`;

    node.overH.style.cssText +=
      `;left:${node.summaryParent.summaryX - summaryLine / 2}px;` +
      `top:${node.summaryY - summaryLine / 2}px;` +
      `width:${node.summaryX - node.summaryParent.summaryX + summaryLine}px;` +
      `height:${summaryLine}px;background:${V.branchColor}`;

    node.overMark = make("div", "overview-mark", overview);
    node.overMark.style.cssText +=
      `;left:${node.summaryX - dotSize / 2}px;` +
      `top:${node.summaryY - dotSize / 2}px;` +
      `width:${dotSize}px;height:${dotSize}px;` +
      `border-radius:${node.folder ? 2 : dotSize / 2}px;background:${node.color}`;

    if (node.liveBatch) {
      node.overBatch = arrivalBatch(
        node.overMark,
        node.arrivalRows,
        dotSize + summaryLabelGap * 0.65,
        Math.min(overviewNamePx * 0.82, summaryPitch * 0.88),
        node.color,
        summaryLine * 0.45
      );
    }

    node.overName = make("span", "overview-name", overview, node.name);
    node.overName.style.cssText +=
      `;left:${node.nameX}px;font-size:${overviewNamePx}px;` +
      `line-height:0.9;color:${V.ink}`;
    fit(node.overName, node.summaryRoom, minText);
    node.overName.style.top =
      node.summaryY - node.overName.offsetHeight / 2 + "px";

    gsap.set(
      [node.row, node.stem, node.edge, node.overEdge, node.overMark, node.overName],
      { autoAlpha: 0 }
    );
    gsap.set(node.overV, { scaleY: 0 });
    gsap.set(node.overH, { scaleX: 0 });
  });

  function countText(fraction) {
    if (fraction >= 1 || !parsedCount) return String(V.filesStat);
    return formatStat(parsedCount, Math.round(parsedCount.value * fraction));
  }

  const meter = $("meter");
  const count = $("running-count");
  const clock = $("running-time");
  const meterFill = $("meter-fill");

  // This position never follows the growing tree.
  meter.style.cssText +=
    `;left:${side}px;top:${meterTop}px;width:${inner}px;height:${M.meterH}px;` +
    `background:${V.ground}`;

  [$("meter-rule"), meterFill].forEach((el) => {
    el.style.height = M.line + "px";
  });

  $("meter-rule").style.background = V.branchColor;
  meterFill.style.background = V.accent;
  gsap.set(meterFill, { scaleX: 0 });

  const clockSpace = hasTime ? M.clockPx + gap : 0;
  const countPx = Math.min(
    M.countPx,
    M.meterH - M.meterInset - clockSpace
  );

  count.textContent = V.filesStat;
  count.style.cssText +=
    `;top:${M.meterInset}px;font-size:${countPx}px;color:${V.ink}`;
  if (count.textContent) {
    fit(count, (inner - M.line) / 1.075, minText);
  }
  count.textContent = countText(0);

  clock.textContent = V.timeStat;
  clock.style.cssText += `;font-size:${M.clockPx}px;color:${V.muted}`;
  if (hasTime) fit(clock, inner - 16, minText);
  else clock.style.display = "none";

  const open = "polygon(0% 0%,100% 0%,100% 100%,0% 100%)";
  const plateClosed = "polygon(0% 100%,100% 100%,100% 100%,0% 100%)";
  const plate = $("plate");
  const borderH = compact ? 12 : 16;
  const platePad = M.platePad;

  plate.style.cssText +=
    `;left:${side}px;top:${plateTop}px;width:${inner}px;height:${plateH}px;` +
    `background:${V.plateColor};color:${V.plateInk};` +
    `border-top:${borderH}px solid ${V.accent};` +
    `padding:${platePad}px ${platePad}px ${platePad}px;` +
    `box-shadow:0 ${compact ? 8 : 12}px 0 ${V.accent}`;

  const finalCount = $("final-count");
  const finalTime = $("final-time");
  const timeSpace = hasTime ? M.finalTimePx * 1.15 + M.statGap : 0;
  const finalPx = Math.min(
    M.finalPx,
    (plateH - borderH - platePad * 2 - timeSpace) / 0.94
  );

  finalCount.textContent = V.filesStat;
  finalCount.style.fontSize = Math.max(minText, finalPx) + "px";
  if (finalCount.textContent) {
    fit(finalCount, (inner - platePad * 2) / 1.025, minText);
  }

  finalTime.textContent = V.timeStat;
  finalTime.style.cssText +=
    `;font-size:${M.finalTimePx}px;margin-top:${M.statGap}px`;

  if (hasTime) fit(finalTime, inner - platePad * 2, minText);
  else finalTime.style.display = "none";

  const sheen = $("plate-sheen");
  const sheenW = inner * 0.085;
  sheen.style.cssText +=
    `;width:${sheenW}px;background:${rgba(V.accent, 0.09)}`;

  const source = $("branch-source");
  const sourceSize = M.line * 2.6;
  source.style.cssText +=
    `;left:0;top:0;width:${sourceSize}px;height:${sourceSize}px;background:${V.accent}`;
  gsap.set(source, { autoAlpha: 0 });

  const mascotX = (node) => side + node.parent.anchor - clawd.width;
  const mascotY = (centerY) => treeTop + centerY - M.palCell * 4;
  const homeX = nodes.length ? mascotX(nodes[0]) : side;
  const homeY = treeTop + M.line;

  pal.style.cssText +=
    `;left:0;top:0;width:${clawd.width}px;height:${clawd.height}px`;
  gsap.set(pal, { x: homeX, y: homeY, zIndex: 4 });

  const contact = make("div", "pal-contact", pal);
  contact.style.cssText +=
    `;left:${M.palCell * 2}px;top:${clawd.height + M.palCell * 0.15}px;` +
    `width:${M.palCell * 7}px;height:${Math.max(4, M.palCell * 0.3)}px;` +
    `background:${rgba(V.accent, 0.3)}`;

  const seatBandTop = overviewH + gap - M.palCell * 6;
  const occupied = nodes
    .filter((node) =>
      node.summaryY + node.overName.offsetHeight / 2 > seatBandTop - gap
    )
    .map((node) => [
      Math.max(0, node.nameX - gap),
      Math.min(inner, node.nameX + node.overName.offsetWidth + gap)
    ])
    .sort((a, b) => a[0] - b[0]);

  const merged = [];
  occupied.forEach((range) => {
    const last = merged[merged.length - 1];
    if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1]);
    else merged.push(range.slice());
  });

  const spaces = [];
  let cursor = 0;
  merged.forEach((range) => {
    if (range[0] > cursor) spaces.push([cursor, range[0]]);
    cursor = Math.max(cursor, range[1]);
  });
  if (cursor < inner) spaces.push([cursor, inner]);

  const seatSpace = spaces
    .filter((range) => range[1] - range[0] >= clawd.width + M.line)
    .sort((a, b) => b[1] - a[1])[0];

  const seatLocalX = seatSpace
    ? seatSpace[1] - clawd.width -
      Math.min(M.perchPad, (seatSpace[1] - seatSpace[0] - clawd.width) / 2)
    : inner - clawd.width - M.perchPad;

  const seatX = side + seatLocalX;
  const seatY = plateTop - M.palCell * 6;
  const legParts = [];

  [3, 7].forEach((cellX) => {
    const leg = make("div", "seat-leg", seatLegs);
    leg.style.cssText +=
      `;left:${cellX * M.palCell}px;top:${M.palCell * 5.65}px;` +
      `width:${M.palCell * 3}px;height:${M.palCell * 2.8}px`;

    const thigh = make("div", "seat-thigh", leg);
    thigh.style.cssText +=
      `;position:absolute;left:0;top:0;` +
      `width:${M.palCell * 1.9}px;height:${M.palCell * 0.9}px;` +
      `background:${V.accent}`;

    const shin = make("div", "seat-shin", leg);
    shin.style.cssText +=
      `;left:${M.palCell * 0.8}px;` +
      `width:${M.palCell * 1.1}px;height:${M.palCell * 1.9}px;` +
      `background:${V.accent}`;

    const foot = make("div", "seat-foot", leg);
    foot.style.cssText +=
      `;left:${M.palCell * 0.7}px;top:${M.palCell * 1.55}px;` +
      `width:${M.palCell * 2.25}px;height:${M.palCell}px;background:${V.accent}`;

    legParts.push(leg);
  });

  gsap.set(seatLegs, { autoAlpha: 0 });
  if (!V.showMascot) pal.style.display = "none";

  gsap.set(overview, { autoAlpha: 0 });
  gsap.set(plate, { autoAlpha: 0, clipPath: plateClosed });
  gsap.set([finalCount, finalTime], { autoAlpha: 0 });

  build.fromTo(rootHeading,
    { y: 18 },
    { y: 0, duration: 0.16, ease: "power4.out" },
    0
  );

  build.fromTo(rootName,
    { x: -38 },
    { x: 0, duration: 0.16, ease: "power4.out" },
    0
  );

  build.fromTo(rootFolder.el,
    { scaleX: 0.65, scaleY: 0.65 },
    {
      scaleX: 1, scaleY: 1,
      duration: 0.18, ease: "back.out(2)"
    },
    0
  );

  build.fromTo(rootFolder.flap,
    { scaleY: 0.4 },
    {
      scaleY: 1, duration: 0.16,
      ease: "back.out(2.4)", immediateRender: false
    },
    0.025
  );

  if (hasHeader) {
    build.fromTo(header,
      { x: -18 },
      { x: 0, duration: 0.14, ease: "power4.out" },
      0
    );
  }

  if (logo) {
    build.fromTo(logo,
      { rotation: -55, scaleX: 0.6, scaleY: 0.6 },
      {
        rotation: 0, scaleX: 1, scaleY: 1,
        duration: 0.18, ease: "power4.out"
      },
      0
    );
  }

  if (V.showMascot) {
    clawd.pose(build, 0, {
      eyes: "right", arms: "right", legs: "stand"
    });
  }

  const firstFolderAt = Math.min(0.16, D * 0.055);
  const firstFileAt = Math.min(0.38, D * 0.13);

  const hits = nodes.map((node, index) => {
    if (nodes.length === 1) return D;
    if (index === 0) return firstFolderAt;
    if (nodes.length === 2) return D;
    if (index === 1) return firstFileAt;

    const u = (index - 1) / (nodes.length - 2);
    return firstFileAt +
      (D - firstFileAt) * (1 - Math.pow(1 - u, 1.55));
  });

  const pullAt = Math.max(0, D - 0.3);
  let lastWalkIndex = -1;

  hits.forEach((hit, index) => {
    if (hit <= pullAt - 0.09) lastWalkIndex = index;
  });

  const lastWalkHit = lastWalkIndex >= 0 ? hits[lastWalkIndex] : 0;
  const squatAt = Math.min(
    pullAt - 0.012,
    Math.max(lastWalkHit + 0.018, pullAt - 0.1)
  );
  const launchAt = pullAt + 0.015;

  let filesSeen = 0;
  let previousStart = 0;
  let lastWalkY = homeY;
  let lastWalkX = homeX;

  nodes.forEach((node, index) => {
    const hit = hits[index];
    const previous = index ? hits[index - 1] : 0;
    const next = index + 1 < nodes.length ? hits[index + 1] : D;
    const interval = Math.max(0.01, hit - previous);
    const drawDuration = Math.min(0.105, interval * 0.25);
    const plantDuration = Math.min(0.045, interval * 0.14);
    const stepDuration = Math.min(0.115, interval * 0.3);
    const prepDuration = Math.min(0.065, interval * 0.16);
    const lineAt = Math.max(0, hit - drawDuration);
    const plantAt = Math.max(0, lineAt - plantDuration);
    const stepAt = Math.max(0, plantAt - stepDuration);
    const scrollDuration = Math.min(0.065, plantAt - stepAt);
    const start = Math.max(0, index - slots + 1);
    const targetY = rowY(index - start);
    const reaction = Math.max(
      0,
      Math.min(0.14, (next - hit) * 0.45, D - hit)
    );

    if (!index) {
      build.to(rootLead, {
        attr: { "stroke-dashoffset": 0 },
        duration: Math.max(0.01, plantAt),
        ease: "power3.out"
      }, 0);
    }

    if (start !== previousStart) {
      const departed = nodes.slice(previousStart, start);

      if (departed.length) {
        build.set(
          departed.flatMap((item) => [item.row, item.stem, item.edge]),
          { autoAlpha: 0 },
          stepAt
        );
      }

      // One exact pitch, then a planted pause before the next branch draws.
      nodes.slice(start, index).forEach((item) => {
        build.to(item.row, {
          y: rowY(item.index - start) - nodeH / 2,
          duration: scrollDuration,
          ease: "power4.out"
        }, stepAt);

        build.to(item.stem, {
          attr: { d: liveStem(item, start) },
          duration: scrollDuration,
          ease: "power4.out"
        }, stepAt);

        build.to(item.edge, {
          attr: { d: liveBranch(item, start) },
          duration: scrollDuration,
          ease: "power4.out"
        }, stepAt);
      });

      previousStart = start;
    }

    build.set(node.row, { y: targetY - nodeH / 2 }, plantAt);
    build.set(node.stem, {
      autoAlpha: 1,
      attr: { d: liveStem(node, start) }
    }, plantAt);

    build.to(node.stem, {
      attr: { "stroke-dashoffset": 0 },
      duration: Math.max(0.001, lineAt - plantAt),
      ease: "power2.in"
    }, plantAt);

    build.set(node.edge, {
      autoAlpha: 1,
      attr: { d: liveBranch(node, start) }
    }, lineAt);

    build.to(node.edge, {
      attr: { "stroke-dashoffset": 0 },
      duration: drawDuration,
      ease: "power3.in"
    }, lineAt);

    build.set(node.overEdge, { autoAlpha: 1 }, plantAt);
    build.to(node.overV, {
      scaleY: 1,
      duration: Math.max(0.001, lineAt - plantAt),
      ease: "power2.in"
    }, plantAt);
    build.to(node.overH, {
      scaleX: 1,
      duration: drawDuration,
      ease: "power3.in"
    }, lineAt);

    if (bridge && node === columns[1][0]) {
      build.to(bridge, {
        scaleX: 1,
        duration: Math.max(0.001, hit - plantAt),
        ease: "power3.out"
      }, plantAt);
    }

    if (lineAt < pullAt) {
      build.set(source, {
        autoAlpha: 1,
        x: side + node.parent.anchor - sourceSize / 2,
        y: treeTop + targetY - sourceSize / 2,
        scaleX: 0.4,
        scaleY: 0.4,
        backgroundColor: node.color
      }, lineAt);

      build.to(source, {
        scaleX: 1,
        scaleY: 1,
        duration: drawDuration,
        ease: "power3.in"
      }, lineAt);

      const tail = Math.min(0.05, Math.max(0.008, (next - hit) * 0.25));
      build.to(source, {
        scaleX: 0,
        scaleY: 0,
        duration: tail,
        ease: "power3.in"
      }, hit);
      build.set(source, { autoAlpha: 0 }, hit + tail);
    }

    // Filename, visible batch rows, endpoint flash and count share one hit.
    build.set(
      [node.row, node.overMark, node.overName],
      { autoAlpha: 1 },
      hit
    );

    if (node.liveBatch) {
      build.set(node.fileDot, { autoAlpha: 0 }, hit);
      build.set(node.overMark, { backgroundColor: "transparent" }, hit);
      build.set(
        [node.liveBatch, node.overBatch],
        { autoAlpha: 1 },
        hit
      );

      if (hit < D) {
        const batchEnd = Math.min(
          D,
          hit + Math.min(0.22, Math.max(0.06, (next - hit) * 0.85))
        );

        build.set(
          [node.liveBatch, node.overBatch],
          { autoAlpha: 0 },
          batchEnd
        );
        build.set(node.fileDot, { autoAlpha: 1 }, batchEnd);
        build.set(node.overMark, { backgroundColor: node.color }, batchEnd);
      }
    }

    if (reaction > 0) {
      build.fromTo(node.label,
        { x: -M.labelGap * 2.7 },
        {
          x: 0, duration: reaction,
          ease: "power4.out", immediateRender: false
        },
        hit
      );

      build.fromTo(node.overName,
        { x: -16 },
        {
          x: 0, duration: reaction,
          ease: "power4.out", immediateRender: false
        },
        hit
      );

      build.fromTo([node.icon, node.overMark],
        { scaleX: 1.5, scaleY: 1.5 },
        {
          scaleX: 1, scaleY: 1,
          duration: reaction, ease: "power3.out",
          immediateRender: false
        },
        hit
      );

      build.fromTo(node.edge,
        { stroke: node.color },
        {
          stroke: V.branchColor,
          duration: reaction, ease: "power2.out",
          immediateRender: false
        },
        hit
      );

      build.fromTo([node.overV, node.overH],
        { backgroundColor: node.color },
        {
          backgroundColor: V.branchColor,
          duration: reaction, ease: "power2.out",
          immediateRender: false
        },
        hit
      );

      if (node.folder) {
        build.fromTo(node.folderArt.flap,
          { scaleY: 0.3 },
          {
            scaleY: 1,
            duration: reaction,
            ease: "back.out(2.8)",
            immediateRender: false
          },
          hit
        );
      }
    } else {
      build.set([node.label, node.overName], { x: 0 }, hit);
      build.set([node.icon, node.overMark], { scaleX: 1, scaleY: 1 }, hit);
    }

    if (!node.folder) {
      filesSeen += 1;
      const fraction = files.length ? filesSeen / files.length : 1;

      build.set(count, {
        textContent: countText(fraction),
        color: reaction > 0 ? node.color : V.ink
      }, hit);

      if (reaction > 0) {
        build.fromTo(count,
          { scaleX: 1.065, scaleY: 1.11 },
          {
            scaleX: 1, scaleY: 1,
            duration: reaction, ease: "power4.out",
            immediateRender: false
          },
          hit
        );

        build.to(count, {
          color: V.ink,
          duration: reaction,
          ease: "power2.out"
        }, hit);

        build.to(meterFill, {
          scaleX: fraction,
          duration: Math.min(0.045, reaction),
          ease: "power4.out"
        }, hit);
      } else {
        build.set(count, { scaleX: 1, scaleY: 1 }, hit);
        build.set(meterFill, { scaleX: fraction }, hit);
      }
    }

    if (V.showMascot && index <= lastWalkIndex) {
      const targetX = mascotX(node);
      const targetWalkY = Math.max(treeTop + M.line, mascotY(targetY));
      const walkDuration = Math.min(0.22, interval * 0.62);
      const walkAt = Math.max(previous, plantAt - walkDuration);
      const windAt = Math.max(previous, walkAt - prepDuration);
      const half = Math.max(0.001, (plantAt - walkAt) / 2);
      const middle = walkAt + half;
      const middleY =
        lastWalkY + (targetWalkY - lastWalkY) * 0.5 - M.palCell * 0.25;

      clawd.pose(build, windAt, {
        eyes: "right", arms: "right", legs: "stand"
      });
      build.to(pal, {
        scaleX: 1.08,
        scaleY: 0.9,
        duration: Math.max(0.001, walkAt - windAt),
        ease: "power2.in"
      }, windAt);

      build.set(contact, { autoAlpha: 0 }, walkAt);
      clawd.walk(
        build,
        walkAt,
        plantAt,
        Math.max(0.018, (plantAt - walkAt) / 4)
      );
      clawd.pose(build, walkAt, {
        eyes: "right", arms: "right"
      });

      build.to(pal, {
        x: lastWalkX + (targetX - lastWalkX) * 0.48,
        y: middleY,
        scaleX: 0.97,
        scaleY: 1.04,
        duration: half,
        ease: "power2.out"
      }, walkAt);

      build.to(pal, {
        x: targetX,
        y: targetWalkY,
        scaleX: 1.08,
        scaleY: 0.9,
        duration: half,
        ease: "power3.in"
      }, middle);

      clawd.pose(build, plantAt, {
        eyes: "right", arms: "right", legs: "stand"
      });
      build.set(contact, { autoAlpha: 1 }, plantAt);

      build.to(pal, {
        scaleX: 1,
        scaleY: 1,
        duration: Math.max(0.001, lineAt - plantAt),
        ease: "power3.out"
      }, plantAt);

      clawd.pose(build, lineAt, {
        eyes: "right", arms: "right", legs: "stand"
      });
      clawd.pose(build, hit, {
        eyes: "right",
        arms: node.folder ? "up" : "right",
        legs: "stand"
      });

      lastWalkX = targetX;
      lastWalkY = targetWalkY;
    }
  });

  // Switch complete poses; never show large and overview names together.
  build.set([rows, lines, meter, source], { autoAlpha: 0 }, pullAt);
  if (hasHeader) build.set(header, { autoAlpha: 0 }, pullAt);
  build.set(treeWindow, {
    height: Math.max(
      overviewH,
      ...nodes.map((node) =>
        Math.ceil(node.summaryY + node.overName.offsetHeight / 2) + 1
      )
    )
  }, pullAt);
  build.set(overview, { autoAlpha: 1 }, pullAt);

  // The travelling mascot stays hidden during the pull-back and plate rise.
  if (V.showMascot) build.set(pal, { autoAlpha: 0 }, pullAt);

  const pullDuration = D - pullAt;

  build.to(rootHeading, {
    y: -headerLift,
    duration: pullDuration,
    ease: "power4.out"
  }, pullAt);

  build.to(rootIcon, {
    y: (M.finalRootH - rootH) / 2,
    scaleX: M.finalRootIcon / M.rootIcon,
    scaleY: M.finalRootIcon / M.rootIcon,
    duration: pullDuration,
    ease: "power4.out"
  }, pullAt);

  build.to(rootName, {
    left: finalRootTextLeft,
    top: finalRootNameTop,
    fontSize: finalRootFont,
    duration: pullDuration,
    ease: "power4.out"
  }, pullAt);

  build.to(rootLead, {
    attr: { d: finalRootLead, "stroke-dashoffset": 0 },
    duration: pullDuration,
    ease: "power4.out"
  }, pullAt);

  build.to(treeWindow, {
    y: finalTreeTop - treeTop,
    duration: pullDuration,
    ease: "power4.out"
  }, pullAt);

  const overviewRight = Math.max(
    1,
    ...nodes.map((node) => node.nameX + node.overName.offsetWidth)
  );
  const overviewBottom = Math.max(
    1,
    ...nodes.map((node) => node.summaryY + node.overName.offsetHeight / 2)
  );
  const safePullScale = Math.max(
    1,
    Math.min(
      1.035,
      (inner - summaryLine) / overviewRight,
      (overviewH - summaryLine) / overviewBottom
    )
  );

  build.fromTo(overview,
    { scaleX: safePullScale, scaleY: safePullScale },
    {
      scaleX: 1, scaleY: 1,
      duration: pullDuration,
      ease: "power4.out",
      immediateRender: false
    },
    pullAt
  );

  const plateAt = D - 0.105;
  build.set(plate, { autoAlpha: 1, y: 42 }, plateAt);
  build.to(plate, {
    clipPath: open,
    y: 0,
    duration: D - plateAt,
    ease: "power4.in"
  }, plateAt);

  if (V.showMascot) {
    clawd.pose(build, squatAt, {
      eyes: "right", arms: "down", legs: "stand"
    });

    build.to(pal, {
      x: lastWalkX,
      y: lastWalkY,
      scaleX: 1.22,
      scaleY: 0.65,
      duration: Math.max(0.001, launchAt - squatAt),
      ease: "power3.in"
    }, squatAt);

    const flight = Math.max(0.001, D - launchAt);
    const apex = Math.max(top, Math.min(lastWalkY, seatY) - M.jump);

    build.set(contact, { autoAlpha: 0 }, launchAt);
    build.set(pal, { zIndex: 6 }, launchAt);
    clawd.pose(build, launchAt, {
      eyes: "open", arms: "up", legs: "right"
    });

    build.to(pal, {
      x: seatX,
      duration: flight,
      ease: "power2.inOut"
    }, launchAt);

    build.to(pal, {
      y: apex,
      scaleX: 0.83,
      scaleY: 1.2,
      duration: flight * 0.53,
      ease: "power3.out"
    }, launchAt);

    build.to(pal, {
      y: seatY - plateH * 0.05,
      scaleX: 1,
      scaleY: 1,
      duration: flight * 0.47,
      ease: "power3.in"
    }, launchAt + flight * 0.53);
  }

  build.timeScale(1 / T.scale);
  tl.add(build, 0);

  const key = T.key;
  const hold = T.hold;
  const settle = Math.max(0.001, Math.min(0.29, hold));
  const impact = settle * 0.22;
  const rebound = settle * 0.3;
  const recovery = settle - impact - rebound;
  const lastNode = nodes[nodes.length - 1];

  tl.set(plate, {
    autoAlpha: 1,
    clipPath: open,
    y: 0,
    scaleX: 1.045,
    scaleY: 1.1
  }, key);
  tl.set([finalCount, finalTime], { autoAlpha: 1 }, key);
  tl.set(count, { textContent: String(V.filesStat) }, key);
  tl.set(meterFill, { scaleX: 1 }, key);

  // Overshoot, hard compression, a smaller rebound, then a definite stop.
  tl.to(plate, {
    scaleX: 0.985,
    scaleY: 0.97,
    duration: impact,
    ease: "power3.out"
  }, key);
  tl.to(plate, {
    scaleX: 1.01,
    scaleY: 1.018,
    duration: rebound,
    ease: "power2.out"
  }, key + impact);
  tl.to(plate, {
    scaleX: 1,
    scaleY: 1,
    duration: recovery,
    ease: "power3.out"
  }, key + impact + rebound);

  tl.fromTo(finalCount,
    { scaleX: 1.025, scaleY: 1.025 },
    {
      scaleX: 1, scaleY: 1,
      duration: settle,
      ease: "power4.out",
      immediateRender: false
    },
    key
  );

  tl.fromTo($("flash"),
    { opacity: 0.13 },
    {
      opacity: 0,
      duration: Math.min(0.085, settle),
      ease: "power3.out",
      immediateRender: false
    },
    key
  );

  if (lastNode) {
    tl.set(
      [lastNode.overEdge, lastNode.overMark, lastNode.overName],
      { autoAlpha: 1 },
      key
    );
    tl.set(lastNode.overV, { scaleY: 1 }, key);
    tl.set(lastNode.overH, { scaleX: 1 }, key);
    tl.set(lastNode.overName, { x: 0 }, key);
    tl.set(lastNode.overMark, {
      backgroundColor: lastNode.overBatch ? "transparent" : V.accent
    }, key);

    if (lastNode.overBatch) {
      const batchEnd = key + Math.min(0.16, hold);
      tl.set(lastNode.overBatch, { autoAlpha: 1 }, key);
      tl.set(
        [lastNode.liveBatch, lastNode.overBatch],
        { autoAlpha: 0 },
        batchEnd
      );
      tl.set(lastNode.fileDot, { autoAlpha: 1 }, batchEnd);
      tl.set(lastNode.overMark, { backgroundColor: V.accent }, batchEnd);
    }

    tl.fromTo(lastNode.overMark,
      { scaleX: 1.8, scaleY: 1.8 },
      {
        scaleX: 1, scaleY: 1,
        duration: settle,
        ease: "power3.out",
        immediateRender: false
      },
      key
    );

    tl.fromTo(lastNode.overName,
      { color: V.accent },
      {
        color: V.ink,
        duration: settle,
        ease: "power2.out",
        immediateRender: false
      },
      key
    );
  }

  if (hold > 0) {
    tl.fromTo(sheen,
      { x: -sheenW },
      {
        x: inner,
        duration: hold,
        ease: "sine.inOut",
        immediateRender: false
      },
      key
    );
  }

  if (V.showMascot) {
    tl.set(contact, { autoAlpha: 0 }, key);
    tl.set(palBody, {
      clipPath: "polygon(0% 0%,100% 0%,100% 75%,0% 75%)"
    }, key);
    tl.set(seatLegs, { autoAlpha: 1 }, key);
    tl.set(pal, {
      autoAlpha: 1,
      x: seatX,
      y: seatY - plateH * 0.05,
      scaleX: 1.18,
      scaleY: 0.76,
      transformOrigin: "50% 75%",
      zIndex: 6
    }, key);

    tl.to(pal, {
      y: seatY + plateH * 0.015,
      scaleX: 0.97,
      scaleY: 1.06,
      duration: impact,
      ease: "power3.out"
    }, key);
    tl.to(pal, {
      y: seatY - plateH * 0.009,
      scaleX: 1.03,
      scaleY: 0.97,
      duration: rebound,
      ease: "power2.out"
    }, key + impact);
    tl.to(pal, {
      y: seatY,
      scaleX: 1,
      scaleY: 1,
      duration: recovery,
      ease: "power3.out"
    }, key + impact + rebound);

    tl.set(legParts[0], {
      rotation: -64,
      x: -M.palCell * 0.3,
      y: -M.palCell * 0.5,
      scaleY: 0.92
    }, key);
    tl.set(legParts[1], {
      rotation: 16,
      x: M.palCell * 0.1,
      y: M.palCell * 0.22,
      scaleY: 1.08
    }, key);

    clawd.pose(tl, key, {
      eyes: "closed", arms: "up", legs: "stand"
    });

    if (hold > 0.2) {
      clawd.pose(tl, key + 0.2, {
        eyes: "left", arms: "down"
      });
    }

    // Bent seated legs alternate between a forward kick and a hanging foot.
    for (let offset = 0.27, kick = 0; offset < hold; offset += 0.24, kick++) {
      const at = key + offset;
      const duration = Math.min(0.11, hold - offset);
      const leftUp = kick % 2 === 1;

      legParts.forEach((leg, legIndex) => {
        const up = legIndex === 0 ? leftUp : !leftUp;
        tl.to(leg, {
          rotation: up ? -66 : 16,
          x: up ? -M.palCell * 0.3 : M.palCell * 0.1,
          y: up ? -M.palCell * 0.55 : M.palCell * 0.22,
          scaleY: up ? 0.92 : 1.08,
          duration,
          ease: "power3.out"
        }, at);
      });

      tl.to(palBody, {
        y: kick % 2 ? 0 : -M.palCell * 0.18,
        duration: Math.min(0.16, hold - offset),
        ease: "sine.inOut"
      }, at);

      clawd.pose(tl, at, {
        eyes: kick % 4 === 3 ? "open" : "left"
      });
    }

    if (hold > 1.3) clawd.blink(tl, key + 0.96);
  }

  if (lastNode && hold > 0.1) {
    const traceSize = summaryLine;
    const trace = make("div", "overview-trace", overview);
    const underline = make("div", "overview-underline", overview);
    const underlineY = Math.min(
      overviewH - traceSize,
      lastNode.summaryY + lastNode.overName.offsetHeight / 2 + 3
    );

    trace.style.cssText +=
      `;width:${traceSize}px;height:${traceSize}px;background:${V.accent}`;
    underline.style.cssText +=
      `;left:${lastNode.nameX}px;top:${underlineY}px;` +
      `width:${lastNode.overName.offsetWidth}px;` +
      `height:${Math.max(4, summaryLine * 0.6)}px;background:${V.accent}`;

    gsap.set(trace, { autoAlpha: 0 });
    gsap.set(underline, { autoAlpha: 0, scaleX: 0 });

    tl.set(trace, {
      autoAlpha: 1,
      x: lastNode.summaryParent.summaryX - traceSize / 2,
      y: lastNode.summaryParent.summaryY - traceSize / 2
    }, key);

    tl.to(trace, {
      y: lastNode.summaryY - traceSize / 2,
      duration: hold * 0.4,
      ease: "sine.inOut"
    }, key);

    tl.to(trace, {
      x: lastNode.summaryX - traceSize / 2,
      duration: hold * 0.14,
      ease: "power2.out"
    }, key + hold * 0.4);

    tl.set(trace, {
      x: lastNode.nameX,
      y: underlineY
    }, key + hold * 0.54);

    tl.set(underline, { autoAlpha: 1 }, key + hold * 0.54);
    tl.to(underline, {
      scaleX: 1,
      duration: hold * 0.46,
      ease: "sine.inOut"
    }, key + hold * 0.54);

    tl.to(trace, {
      x: lastNode.nameX + lastNode.overName.offsetWidth - traceSize,
      duration: hold * 0.46,
      ease: "sine.inOut"
    }, key + hold * 0.54);
  }

  const palette = [V.accent, V.sourceColor, V.plateColor, V.ink];
  const originX = V.showMascot
    ? seatX + clawd.width / 2
    : side + inner * 0.8;
  const originY = plateTop - plateH * 0.05;
  const particleCount = compact ? 10 : 14;

  if (hold > 0.08) {
    const life = Math.min(0.58, hold);

    for (let i = 0; i < particleCount; i++) {
      const pixel = make("div", "pixel", $("sparks"));
      const size = (compact ? 10 : 12) * (rnd() > 0.85 ? 2 : 1);
      pixel.style.cssText +=
        `;width:${size}px;height:${size}px;background:${palette[i % palette.length]}`;

      const targetX = clamp(
        originX + (rnd() - 0.65) * inner * 0.58,
        side,
        W - side - size
      );
      const lift = (compact ? 50 : 80) + rnd() * (compact ? 90 : 130);
      const apexY = Math.max(finalTreeTop, originY - lift);
      const endY = Math.min(H - size - 2, bottom + M.palCell);
      const up = life * (0.25 + rnd() * 0.1);

      gsap.set(pixel, { autoAlpha: 0, x: originX, y: originY });
      tl.set(pixel, { autoAlpha: 1 }, key);

      tl.to(pixel, {
        x: targetX,
        duration: life,
        ease: "power3.out"
      }, key);
      tl.to(pixel, {
        y: apexY,
        duration: up,
        ease: "power3.out"
      }, key);
      tl.to(pixel, {
        y: endY,
        duration: life - up,
        ease: "power2.in"
      }, key + up);
      tl.set(pixel, { autoAlpha: 0 }, key + life);
    }
  }

  const closed = V.overlayPosition === "bottom"
    ? "polygon(0% 100%,100% 100%,100% 100%,0% 100%)"
    : "polygon(0% 0%,100% 0%,100% 0%,0% 0%)";

  if (variant === "overlay") {
    tl.fromTo(stageEl,
      { clipPath: closed },
      { clipPath: open, duration: 0.12, ease: "power4.out" },
      0
    );
  }

  if (T.exit > 0) {
    tl.to(stageEl, {
      clipPath: closed,
      duration: Math.max(0, T.exit - 1 / CA.fps),
      ease: "power3.in"
    }, key + hold);
  }

  window.__timelines["block"] = tl;
});