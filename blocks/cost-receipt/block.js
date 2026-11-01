CA.ready(() => {
  const {
    vars: V, stage: S, safe, time: T, variant,
    make, fit, rgba, parseStat, formatStat, grainUrl, seeded
  } = CA;

  const KIT = CA.claude;
  const $ = (id) => document.getElementById(id);
  const NS = "http://www.w3.org/2000/svg";
  const stageEl = $("stage");
  const W = S.w;
  const H = S.h;
  const compact = variant !== "full";
  const shortCard = compact && H < 780;
  const minText = compact ? 32 : 40;
  const D = Math.max(0.001, T.design);
  const U = D / 4;
  const angle = Math.max(-14, Math.min(14, Number(V.stampAngle) || 0));
  const tl = gsap.timeline({ paused: true });
  const build = gsap.timeline();

  const layouts = {
    full: {
      side: 60, top: 230, bottom: 300,
      slotOffset: 224, noMascotOffset: 24,
      slotH: 46, slotInset: 8,
      padX: 36, padY: 26, bottomPad: 18,
      logo: 56, logoGap: 14, shop: 68, subtitle: 44, subGap: 4,
      ruleGap: 12, rule: 3,
      row: 82, label: 68, price: 70,
      leaderGap: 12, leader: 4,
      stampMargin: 12, stampWord: 96, stampValue: 342,
      stampLabel: 44, stampGap: 12,
      printValue: 104, printLabel: 42,
      counterLabel: 44, counterValue: 304,
      counterGap: 18, counterLabelGap: 10, counterBottom: 12,
      cell: 20, pull: 58, recoil: 10, tear: 30,
      edge: 46, feedTail: 12, impactRoom: 14,
      columnGap: 30
    },
    top: {
      side: 32, top: 10, bottom: 14,
      slotOffset: 142, noMascotOffset: 16,
      slotH: 38, slotInset: 8,
      padX: 30, padY: 18, bottomPad: 12,
      logo: 40, logoGap: 12, shop: 48, subtitle: 32, subGap: 2,
      ruleGap: 10, rule: 3,
      row: 52, label: 44, price: 46,
      leaderGap: 10, leader: 3,
      stampMargin: 12, stampWord: 64, stampValue: 278,
      stampLabel: 32, stampGap: 9,
      printValue: 76, printLabel: 32,
      counterLabel: 34, counterValue: 224,
      counterGap: 12, counterLabelGap: 8, counterBottom: 10,
      cell: 12, pull: 38, recoil: 8, tear: 24,
      edge: 30, feedTail: 10, impactRoom: 14,
      columnGap: 24
    },
    overlay: {
      side: 34, top: 8, bottom: 14,
      slotOffset: 148, noMascotOffset: 18,
      slotH: 40, slotInset: 8,
      padX: 32, padY: 20, bottomPad: 12,
      logo: 42, logoGap: 12, shop: 50, subtitle: 32, subGap: 2,
      ruleGap: 8, rule: 3,
      row: 52, label: 44, price: 46,
      leaderGap: 10, leader: 3,
      stampMargin: 12, stampWord: 64, stampValue: 280,
      stampLabel: 32, stampGap: 8,
      printValue: 78, printLabel: 32,
      counterLabel: 34, counterValue: 216,
      counterGap: 14, counterLabelGap: 8, counterBottom: 10,
      cell: 13, pull: 40, recoil: 9, tear: 24,
      edge: 32, feedTail: 10, impactRoom: 14,
      columnGap: 26
    }
  };

  const M = { ...(layouts[variant] || layouts.full) };

  if (shortCard) {
    Object.assign(M, {
      slotOffset: 112, noMascotOffset: 12,
      slotH: 32, slotInset: 7,
      padX: 24, padY: 12, bottomPad: 12,
      logo: 32, shop: 38, subtitle: 32, subGap: 0,
      ruleGap: 6, row: 44, label: 34, price: 36,
      leaderGap: 8, leader: 3,
      stampMargin: 12, stampWord: 48, stampValue: 220,
      stampLabel: 32, stampGap: 8,
      printValue: 60, printLabel: 32,
      counterLabel: 32, counterValue: 164,
      counterGap: 10, counterLabelGap: 6, counterBottom: 8,
      cell: 12, pull: 28, recoil: 6, tear: 20,
      edge: 24, feedTail: 8, impactRoom: 10,
      columnGap: 24
    });
  }

  const items = [1, 2, 3, 4].map((i) => ({
    label: String(V[`item${i}Label`] || "").trim(),
    price: String(V[`item${i}Price`] || "").trim()
  })).filter((item) => item.label);

  const n = items.length;
  const hasPal = Boolean(V.showMascot);
  const paperX = compact ? M.side : Math.max(M.side, safe.side || 0);
  const paperW = Math.max(1, W - paperX * 2);
  const innerW = Math.max(1, paperW - M.padX * 2);
  const topBound = compact ? M.top : Math.max(M.top, safe.top || 0);
  const bottomBound = compact
    ? H - M.bottom
    : Math.min(H - M.bottom, H - (safe.bottom || 0));

  function fitText(el, text, px, width, wrap = false) {
    el.textContent = String(text);
    el.style.fontSize = Math.max(minText, px) + "px";
    el.style.display = "inline-block";
    el.style.whiteSpace = "nowrap";
    el.style.width = "";
    el.style.maxWidth = "";
    fit(el, Math.max(1, width), minText);

    if (wrap && el.offsetWidth > width + 1) {
      el.style.whiteSpace = "normal";
      el.style.width = Math.max(1, width) + "px";
      el.style.maxWidth = Math.max(1, width) + "px";
      el.style.textWrap = "balance";
    }

    return parseFloat(el.style.fontSize);
  }

  function svgEl(tag, parent, attrs = {}) {
    const el = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([key, value]) => {
      el.setAttribute(key, String(value));
    });
    parent.appendChild(el);
    return el;
  }

  stageEl.style.background = V.ground;
  $("cr-ground").style.background = V.ground;
  $("cr-halo").style.background =
    `radial-gradient(ellipse at 50% 65%, ${rgba(V.accent, 0.24)}, transparent 73%)`;
  $("cr-grain").style.backgroundImage = grainUrl(180, 0.4, 71);
  $("cr-paper-grain").style.backgroundImage = grainUrl(160, 0.48, 19);
  $("cr-sweep").style.background =
    `linear-gradient(90deg, transparent, ${rgba(V.ink, 0.045)}, transparent)`;

  const pal = $("cr-pal");
  const clawd = hasPal
    ? KIT.mascot(pal, M.cell, { color: V.accent })
    : null;

  if (!hasPal) pal.style.display = "none";

  const palW = clawd ? clawd.width : 0;
  const palH = clawd ? clawd.height : 0;
  const slotTop = Math.round(
    topBound + (hasPal ? M.slotOffset : M.noMascotOffset)
  );
  const paperTop = slotTop + M.slotH - M.slotInset;
  const paperH = Math.max(
    1, Math.floor(bottomBound - paperTop - M.tear - M.impactRoom)
  );
  const homeX = hasPal
    ? Math.round(paperX + paperW - palW - (compact ? 12 : 16))
    : 0;
  const homeY = hasPal
    ? Math.round(slotTop + M.slotH * 0.12 - palH)
    : 0;

  if (hasPal) {
    pal.style.width = palW + "px";
    pal.style.height = palH + "px";
    gsap.set(pal, {
      x: homeX, y: homeY, rotation: 0, scaleX: 1, scaleY: 1
    });
  }

  const printer = $("cr-printer");
  const lip = $("cr-lip");
  const roller = $("cr-roller");

  printer.style.cssText +=
    `;left:${paperX - 8}px;top:${slotTop}px;width:${paperW + 16}px;height:${M.slotH}px;background:${V.slotColor}`;
  $("cr-mouth").style.background = V.mouthColor;
  lip.style.background = rgba(V.paper, 0.24);
  roller.style.background =
    `repeating-linear-gradient(90deg, ${rgba(V.accent, 0.58)} 0px, ${rgba(V.accent, 0.58)} 8px, ${V.mouthColor} 8px, ${V.mouthColor} 24px)`;

  const neck = $("cr-neck");
  neck.style.cssText +=
    `;left:${paperX}px;top:${slotTop + M.slotH - 4}px;width:${paperW}px;height:${M.pull + 38}px;background:${V.paper}`;

  const rig = $("cr-rig");
  rig.style.cssText +=
    `;left:${paperX}px;top:${paperTop}px;width:${paperW}px;height:${paperH}px`;

  const paper = $("cr-paper");
  paper.style.background = V.paper;
  paper.style.color = V.ink;

  const teeth = Math.max(24, Math.round(paperW / 22) * 2);
  const toothH = compact ? 8 : 11;

  function paperClip(tornTop) {
    const points = [];

    if (tornTop) {
      for (let i = 0; i <= teeth; i++) {
        points.push(
          `${(i / teeth * 100).toFixed(3)}% ${i % 2 ? 7 : 0}px`
        );
      }
    } else {
      points.push("0% 0%", "100% 0%");
    }

    points.push(`100% calc(100% - ${toothH}px)`);

    for (let i = teeth; i >= 0; i--) {
      points.push(
        `${(i / teeth * 100).toFixed(3)}% ${i % 2 ? "100%" : `calc(100% - ${toothH}px)`}`
      );
    }

    return `polygon(${points.join(",")})`;
  }

  paper.style.clipPath = paperClip(false);

  const stub = $("cr-stub");
  stub.style.cssText +=
    `;left:${paperX}px;top:${slotTop + M.slotH - 3}px;width:${paperW}px;height:${M.slotInset + 10}px;background:${V.paper};clip-path:${paperClip(false)}`;

  const curl = $("cr-curl");
  curl.style.cssText +=
    `;left:10px;width:${paperW - 20}px;height:${compact ? 38 : 54}px;background:radial-gradient(ellipse at 50% 0%, ${rgba(V.ink, 0.76)}, transparent 73%)`;

  const edge = $("cr-feed-edge");
  edge.style.height = M.edge + "px";
  edge.style.background =
    `linear-gradient(180deg, transparent 0%, ${rgba(V.ink, 0.04)} 40%, ${rgba(V.ink, 0.28)} 78%, ${rgba(V.paper, 0.95)} 100%)`;

  const header = $("cr-header");
  header.style.cssText +=
    `;left:${M.padX}px;top:${M.padY}px;width:${innerW}px`;

  const shop = $("cr-shop");
  const shopRow = $("cr-shop-row");
  const brand = $("cr-brand");
  const shopText = String(V.shopLine || "").trim();
  let logoEl = null;

  if (V.showLogo) {
    logoEl = KIT.logo(brand, M.logo, V.accent);
    brand.style.marginRight = shopText ? M.logoGap + "px" : "0px";
  } else {
    brand.style.display = "none";
  }

  fitText(
    shop, shopText, M.shop,
    innerW - (V.showLogo ? M.logo + M.logoGap : 0)
  );
  shop.style.color = V.ink;
  if (!shopText) shop.style.display = "none";

  const shopH = Math.ceil(Math.max(
    V.showLogo ? M.logo : 0,
    shopText ? parseFloat(shop.style.fontSize) * 1.05 : 0
  ));
  shopRow.style.height = shopH + "px";

  const subtitle = $("cr-subtitle");
  const subtitleText = String(V.subtitle || "").trim();
  fitText(subtitle, subtitleText, M.subtitle, innerW, true);
  subtitle.style.color = rgba(V.ink, 0.84);
  subtitle.style.marginTop = M.subGap + "px";
  const subH = subtitleText
    ? Math.ceil(M.subGap + subtitle.offsetHeight)
    : 0;

  if (!subtitleText) subtitle.style.display = "none";

  const rowsTop = M.padY + shopH + subH + M.ruleGap;
  const headerRule = $("cr-header-rule");
  headerRule.style.cssText +=
    `;left:${M.padX}px;top:${rowsTop - Math.round(M.ruleGap * 0.5)}px;width:${innerW}px;border-top-width:${M.rule}px;border-color:${rgba(V.ink, 0.46)}`;

  if (!shopH && !subH) headerRule.style.visibility = "hidden";

  // Short cards use two item columns, never a miniature stamp sidebar.
  const columns = shortCard && n > 1 ? 2 : 1;
  const rowAreaW = Math.floor(
    (innerW - (columns - 1) * M.columnGap) / columns
  );

  const rowsParent = $("cr-items");
  rowsParent.style.cssText +=
    `;left:${M.padX}px;top:${rowsTop}px;width:${innerW}px`;

  const rowEls = items.map((item) => {
    const row = make("div", "cr-item", rowsParent);
    const wash = make("div", "cr-item-wash", row);
    wash.style.background = rgba(V.accent, 0.3);

    const label = make("span", "cr-item-label", row);
    const leader = make("div", "cr-leader", row);
    leader.style.marginLeft = leader.style.marginRight =
      M.leaderGap + "px";
    leader.style.borderBottomWidth = M.leader + "px";
    leader.style.borderBottomColor = rgba(V.ink, 0.5);

    const price = make("span", "cr-item-price", row);
    fitText(price, item.price, M.price, rowAreaW * 0.35);

    return { row, wash, label, leader, price };
  });

  const pricePx = Math.min(
    M.price,
    ...rowEls.map((r) => parseFloat(r.price.style.fontSize))
  );

  rowEls.forEach((r) => {
    r.price.style.fontSize = pricePx + "px";
  });

  const priceW = Math.ceil(Math.max(
    0, ...rowEls.map((r) => r.price.offsetWidth)
  ));
  const labelW = Math.max(
    1, rowAreaW - priceW - M.leaderGap * 2 - 12
  );

  rowEls.forEach((r, i) => {
    r.price.style.width = priceW + "px";
    fitText(r.label, items[i].label, M.label, labelW, true);
    r.leader.style.marginTop = pricePx * 0.82 + "px";
  });

  const rowH = Math.max(
    M.row,
    Math.ceil(Math.max(
      pricePx * 1.06,
      0,
      ...rowEls.map((r) => r.label.offsetHeight)
    )) + 4
  );

  rowEls.forEach((r, i) => {
    r.row.style.cssText +=
      `;left:${(i % columns) * (rowAreaW + M.columnGap)}px;top:${Math.floor(i / columns) * rowH}px;width:${rowAreaW}px;height:${rowH}px`;
  });

  const physicalRows = Math.ceil(n / columns);
  const rowsEnd = rowsTop + physicalRows * rowH;
  rowsParent.style.height = physicalRows * rowH + "px";

  const totalTop = rowsEnd + M.ruleGap;
  const totalRule = $("cr-total-rule");
  totalRule.style.cssText +=
    `;left:${M.padX}px;top:${totalTop - Math.round(M.ruleGap * 0.5)}px;width:${innerW}px;border-top-width:${M.rule}px;border-color:${rgba(V.ink, 0.66)}`;

  // Reduce the ring by 12% and lower its top into the final item row.
  // The existing payoff type keeps its size; the lower ring bleeds off the sheet.
  const referenceSealD = Math.max(1, Math.floor(Math.min(
    paperW * 0.94,
    paperH - M.stampMargin * 2
  )));
  const referenceSealY = paperH - M.bottomPad - referenceSealD;
  const sealD = Math.max(1, Math.floor(referenceSealD * 0.88));
  const sealX = (paperW - sealD) / 2;
  const ringTouchTop = n
    ? rowsEnd - rowH * 0.7
    : rowsEnd + M.ruleGap;
  const sealY = Math.max(
    paperH - M.bottomPad - sealD,
    ringTouchTop - sealD * 0.025
  );

  const seal = $("cr-seal");
  seal.style.cssText +=
    `;left:${sealX}px;top:${sealY}px;width:${sealD}px;height:${sealD}px;color:${V.stampInk}`;

  const value = $("cr-total-value");
  const totalLabel = $("cr-total-label");
  const stampWord = $("cr-stamp-word");

  fitText(
    stampWord, String(V.stampWord),
    Math.min(M.stampWord, referenceSealD * 0.115),
    referenceSealD * 0.6
  );
  fitText(
    totalLabel, String(V.totalLabel),
    M.stampLabel, referenceSealD * 0.42
  );
  fitText(
    value, String(V.totalValue),
    Math.min(M.stampValue, referenceSealD * 0.38),
    referenceSealD * 0.9
  );

  const wordPx = parseFloat(stampWord.style.fontSize);
  const labelPx = parseFloat(totalLabel.style.fontSize);
  const stampTextTop = Math.max(
    rowsEnd + Math.min(8, M.ruleGap),
    referenceSealY + referenceSealD * 0.22
  );
  const stampTextBottom = Math.min(
    paperH - M.bottomPad,
    referenceSealY + referenceSealD * 0.955
  );
  const valueRoom = stampTextBottom - stampTextTop -
    wordPx - labelPx - M.stampGap * 2;

  let finalValuePx = Math.max(
    minText,
    Math.min(parseFloat(value.style.fontSize), valueRoom)
  );
  value.style.fontSize = finalValuePx + "px";

  const contactSeal = {
    sx: 1.08, sy: 1.045, rotation: angle * 0.55, y: 4
  };
  const reboundSeal = {
    sx: 0.985, sy: 1.025,
    rotation: angle + (angle <= 0 ? -2.5 : 2.5), y: -3
  };
  const finalSeal = { sx: 1, sy: 1, rotation: angle, y: 0 };

  function placeSealText() {
    const wordY = stampTextTop - sealY;
    const valueY = wordY + wordPx + M.stampGap;
    const labelY = valueY + finalValuePx + M.stampGap;

    stampWord.style.left = (sealD - stampWord.offsetWidth) / 2 + "px";
    stampWord.style.top = wordY + "px";
    value.style.left = (sealD - value.offsetWidth) / 2 + "px";
    value.style.top = valueY + "px";
    totalLabel.style.left = (sealD - totalLabel.offsetWidth) / 2 + "px";
    totalLabel.style.top = labelY + "px";
  }

  function stampTextFits() {
    const rects = [stampWord, value, totalLabel].map((el) => ({
      x: parseFloat(el.style.left),
      y: parseFloat(el.style.top),
      w: el.offsetWidth,
      h: el.offsetHeight
    }));

    return [contactSeal, reboundSeal, finalSeal].every((pose) => {
      const a = pose.rotation * Math.PI / 180;
      const c = Math.cos(a);
      const s = Math.sin(a);

      return rects.every((r) => {
        return [
          [r.x, r.y],
          [r.x + r.w, r.y],
          [r.x, r.y + r.h],
          [r.x + r.w, r.y + r.h]
        ].every(([x, y]) => {
          const dx = (x - sealD / 2) * pose.sx;
          const dy = (y - sealD / 2) * pose.sy;
          const px = sealX + sealD / 2 + dx * c - dy * s;
          const py = sealY + sealD / 2 + pose.y + dx * s + dy * c;
          return px >= 10 && px <= paperW - 10 &&
            py >= 9 && py <= paperH - toothH - 5;
        });
      });
    });
  }

  placeSealText();

  // Reserve room for the impact pose as well as the settled impression.
  for (let i = 0; i < 16 && !stampTextFits(); i++) {
    const nextPx = Math.max(minText, finalValuePx * 0.97);
    if (nextPx === finalValuePx) break;
    finalValuePx = nextPx;
    value.style.fontSize = finalValuePx + "px";
    placeSealText();
  }

  const finalValue = {
    left: parseFloat(value.style.left),
    top: parseFloat(value.style.top),
    fontSize: finalValuePx
  };
  const finalLabel = {
    left: parseFloat(totalLabel.style.left),
    top: parseFloat(totalLabel.style.top),
    fontSize: labelPx
  };

  stampWord.style.color = V.stampInk;

  // These same two nodes first print as a conventional total line.
  fitText(value, String(V.totalValue), M.printValue, innerW * 0.64);
  const printValuePx = parseFloat(value.style.fontSize);
  const printValueW = value.offsetWidth;

  fitText(
    totalLabel, String(V.totalLabel),
    M.printLabel, innerW * 0.32
  );
  const printLabelPx = parseFloat(totalLabel.style.fontSize);
  const printY = totalTop + 6;

  value.style.left = M.padX + innerW - printValueW - sealX + "px";
  value.style.top = printY - sealY + "px";
  value.style.color = V.ink;

  totalLabel.style.left = M.padX - sealX + "px";
  totalLabel.style.top =
    printY - sealY + (printValuePx - printLabelPx) * 0.78 + "px";
  totalLabel.style.color = V.ink;

  const buckle = make("div", "", paper);
  buckle.id = "cr-buckle";
  buckle.style.height = M.cell * 3 + "px";
  buckle.style.background =
    `linear-gradient(180deg, transparent 0%, ${rgba(V.ink, 0.34)} 40%, ${rgba(V.paper, 0.98)} 51%, ${rgba(V.ink, 0.1)} 63%, transparent 100%)`;

  const art = $("cr-stamp-art");
  const artPad = Math.ceil(sealD * 0.065);
  const artSize = sealD + artPad * 2;
  art.style.cssText +=
    `;left:${-artPad}px;top:${-artPad}px;width:${artSize}px;height:${artSize}px`;

  const svg = svgEl("svg", art, {
    viewBox: `0 0 ${artSize} ${artSize}`
  });
  const rings = svgEl("g", svg);
  const inkSpatter = svgEl("g", svg);
  const inkRnd = seeded(403);
  const center = artSize / 2;

  function inkDot(parent, x, y, radius, color) {
    return svgEl("circle", parent, {
      cx: x, cy: y, r: radius, fill: color
    });
  }

  function ring(radius, width, jitter) {
    const points = [];

    for (let i = 0; i < 160; i++) {
      const a = i / 160 * Math.PI * 2;
      const r = radius + (inkRnd() - 0.5) * jitter;
      points.push(
        `${i ? "L" : "M"}${(center + Math.cos(a) * r).toFixed(2)},${(center + Math.sin(a) * r).toFixed(2)}`
      );
    }

    svgEl("path", rings, {
      d: points.join(" ") + " Z",
      fill: "none",
      stroke: V.stampInk,
      "stroke-width": width,
      "stroke-linecap": "round",
      "stroke-linejoin": "round"
    });
  }

  ring(sealD * 0.475, compact ? 7 : 10, sealD * 0.006);
  ring(sealD * 0.439, compact ? 3 : 4, sealD * 0.003);

  for (let i = 0; i < 52; i++) {
    const a = inkRnd() * Math.PI * 2;
    const r = sealD * (0.487 + inkRnd() * 0.025);
    inkDot(
      inkSpatter,
      center + Math.cos(a) * r,
      center + Math.sin(a) * r,
      (compact ? 1.5 : 2) + inkRnd() * (compact ? 2.7 : 4),
      V.stampInk
    );
  }

  for (let i = 0; i < 64; i++) {
    const a = inkRnd() * Math.PI * 2;
    const r = sealD * (i % 2 ? 0.475 : 0.439);
    inkDot(
      rings,
      center + Math.cos(a) * r,
      center + Math.sin(a) * r,
      0.8 + inkRnd() * 1.8,
      V.paper
    );
  }

  const totalStat = parseStat(V.totalValue);
  const firstPriceStat = items
    .map((item) => parseStat(item.price))
    .find(Boolean);
  const subtotalFormat = totalStat || firstPriceStat;
  const subtotalText = (amount) => subtotalFormat
    ? formatStat(subtotalFormat, amount)
    : String(V.totalValue);

  let cumulative = 0;
  const subtotals = items.map((item) => {
    const stat = parseStat(item.price);
    if (stat && Number.isFinite(stat.value)) {
      cumulative = Math.round((cumulative + stat.value) * 1e9) / 1e9;
    }
    return subtotalText(cumulative);
  });

  const subtotal = $("cr-subtotal");
  const subtotalLabel = $("cr-subtotal-label");
  const subtotalValue = $("cr-subtotal-value");

  subtotal.style.left = paperX + "px";
  subtotal.style.width = paperW + "px";

  fitText(
    subtotalLabel, String(V.subtotalLabel || ""),
    M.counterLabel, paperW * 0.92
  );
  subtotalLabel.style.display = "block";
  subtotalLabel.style.color = V.muted;
  subtotalLabel.style.marginBottom = M.counterLabelGap + "px";

  const hasCounterLabel = Boolean(subtotalLabel.textContent.trim());
  if (!hasCounterLabel) subtotalLabel.style.display = "none";

  const captionH = hasCounterLabel
    ? Math.ceil(subtotalLabel.offsetHeight) + M.counterLabelGap
    : 0;
  const lastRowsH = Math.min(
    paperH, Math.ceil(rowsEnd + M.feedTail)
  );
  const counterRoom = bottomBound - M.counterBottom -
    paperTop - lastRowsH - M.counterGap - M.pull - captionH;

  // The later running-cost poses retain their existing size.
  let counterPx = Math.max(minText, Math.min(
    M.counterValue,
    finalValue.fontSize * 0.92,
    counterRoom / 1.04
  ));

  const counterSamples = subtotals.length
    ? subtotals
    : [String(V.totalValue)];

  counterSamples.forEach((text) => {
    fitText(subtotalValue, text, counterPx, paperW * 0.9);
    counterPx = Math.min(counterPx, parseFloat(subtotalValue.style.fontSize));
  });

  subtotalValue.style.fontSize = counterPx + "px";
  subtotalValue.style.color = V.paper;
  subtotalValue.textContent = counterSamples[0];

  // Enlarge the first-half typography without changing the final receipt.
  // Both type layouts are measured once and switched on an existing feed beat.
  const textProps = [
    "fontSize", "width", "maxWidth", "whiteSpace", "textWrap"
  ];
  const typeBindings = [
    [header, ["top"]],
    [shop, textProps],
    [shopRow, ["height"]],
    [subtitle, textProps],
    [headerRule, ["top"]],
    [rowsParent, ["top", "height"]],
    [subtotalLabel, textProps]
  ];

  rowEls.forEach((r) => {
    typeBindings.push(
      [r.row, ["top", "height"]],
      [r.label, textProps],
      [r.price, textProps],
      [r.leader, ["marginTop"]]
    );
  });

  function captureTypeState() {
    return typeBindings.map(([el, keys]) => {
      const style = getComputedStyle(el);
      const props = {};
      keys.forEach((key) => {
        props[key] = style[key];
      });
      return { el, props };
    });
  }

  const normalTypeState = captureTypeState();
  const typeBoost = compact ? 1.14 : 1.12;
  const earlyCount = Math.ceil(n * 0.5);
  const earlyPadY = M.padY + (compact ? 4 : 8);

  header.style.top = earlyPadY + "px";

  fitText(
    shop, shopText,
    parseFloat(shop.style.fontSize) * typeBoost,
    innerW - (V.showLogo ? M.logo + M.logoGap : 0)
  );
  if (!shopText) shop.style.display = "none";

  const earlyShopH = Math.ceil(Math.max(
    V.showLogo ? M.logo : 0,
    shopText ? parseFloat(shop.style.fontSize) * 1.05 : 0
  ));
  shopRow.style.height = earlyShopH + "px";

  fitText(
    subtitle, subtitleText,
    parseFloat(subtitle.style.fontSize) * typeBoost,
    innerW, true
  );
  if (!subtitleText) subtitle.style.display = "none";

  const earlySubH = subtitleText
    ? Math.ceil(M.subGap + subtitle.offsetHeight)
    : 0;
  const earlyRowsTop =
    earlyPadY + earlyShopH + earlySubH + M.ruleGap;

  headerRule.style.top =
    earlyRowsTop - Math.round(M.ruleGap * 0.5) + "px";
  rowsParent.style.top = earlyRowsTop + "px";

  rowEls.forEach((r, i) => {
    fitText(
      r.price, items[i].price,
      pricePx * typeBoost, rowAreaW * 0.35
    );
  });

  const earlyPricePx = Math.min(
    M.price * typeBoost,
    ...rowEls.map((r) => parseFloat(r.price.style.fontSize))
  );

  rowEls.forEach((r) => {
    r.price.style.fontSize = earlyPricePx + "px";
  });

  const earlyPriceW = Math.ceil(Math.max(
    0, ...rowEls.map((r) => r.price.offsetWidth)
  ));
  const earlyLabelW = Math.max(
    1, rowAreaW - earlyPriceW - M.leaderGap * 2 - 12
  );

  rowEls.forEach((r, i) => {
    r.price.style.width = earlyPriceW + "px";
    fitText(
      r.label, items[i].label,
      parseFloat(r.label.style.fontSize) * typeBoost,
      earlyLabelW, true
    );
    r.leader.style.marginTop = earlyPricePx * 0.82 + "px";
  });

  const earlyRowH = Math.max(
    Math.ceil(rowH * typeBoost),
    Math.ceil(Math.max(
      earlyPricePx * 1.06,
      0,
      ...rowEls.map((r) => r.label.offsetHeight)
    )) + 4
  );

  rowEls.forEach((r, i) => {
    r.row.style.top = Math.floor(i / columns) * earlyRowH + "px";
    r.row.style.height = earlyRowH + "px";
  });
  rowsParent.style.height = physicalRows * earlyRowH + "px";

  fitText(
    subtotalLabel, String(V.subtotalLabel || ""),
    M.counterLabel * typeBoost, paperW * 0.92
  );
  subtotalLabel.style.display = hasCounterLabel ? "block" : "none";

  const earlyCaptionH = hasCounterLabel
    ? Math.ceil(subtotalLabel.offsetHeight) + M.counterLabelGap
    : 0;
  const earlyTypeState = captureTypeState();
  const earlyLastRowsH = Math.min(
    paperH,
    Math.ceil(
      earlyRowsTop +
      Math.ceil(earlyCount / columns) * earlyRowH +
      M.feedTail
    )
  );
  const earlyCounterRoom = bottomBound - M.counterBottom -
    paperTop - earlyLastRowsH - M.counterGap - M.pull - earlyCaptionH;

  let earlyCounterPx = Math.max(minText, Math.min(
    counterPx * typeBoost,
    earlyCounterRoom / 1.04
  ));

  counterSamples.forEach((text) => {
    fitText(subtotalValue, text, earlyCounterPx, paperW * 0.96);
    earlyCounterPx = Math.min(
      earlyCounterPx, parseFloat(subtotalValue.style.fontSize)
    );
  });

  subtotalValue.style.fontSize = earlyCounterPx + "px";
  subtotalValue.textContent = counterSamples[0];

  earlyTypeState.forEach(({ el, props }) => {
    build.set(el, props, 0);
  });
  build.set(subtotalValue, { fontSize: earlyCounterPx }, 0);

  function restoreReceiptType(at) {
    normalTypeState.forEach(({ el, props }) => {
      build.set(el, props, at);
    });
    build.set(subtotalValue, { fontSize: counterPx }, at);
  }

  const initialH = Math.min(
    paperH,
    Math.ceil(earlyRowsTop + (n ? earlyRowH : 0) + M.feedTail)
  );
  subtotal.style.top = paperTop + initialH + M.counterGap + "px";

  gsap.set(paper, {
    height: initialH, rotationX: 0, skewX: 0,
    scaleX: 1, scaleY: 1, transformPerspective: 1800
  });
  gsap.set(curl, {
    top: initialH - 5, scaleX: 1, scaleY: 1, opacity: 0.8
  });
  gsap.set(edge, { scaleY: 0.75, opacity: 0.56 });
  gsap.set(buckle, { autoAlpha: 0, scaleY: 0.25 });
  gsap.set(subtotal, { y: 0, autoAlpha: 1 });
  gsap.set(rig, {
    x: 0, y: 0, rotation: 0, skewX: 0,
    scaleX: 1, scaleY: 1,
    transformOrigin: "50% 48%"
  });
  gsap.set(seal, {
    x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0
  });
  gsap.set(neck, { autoAlpha: 1 });
  gsap.set(stub, { autoAlpha: 0 });
  gsap.set($("cr-halo"), {
    opacity: 0.7, scaleX: 1, scaleY: 1
  });
  gsap.set($("cr-sweep"), { xPercent: -180 });

  if (rowEls.length) {
    gsap.set(rowEls.map((r) => r.row), { autoAlpha: 0 });
    gsap.set(rowEls.map((r) => r.wash), { opacity: 0 });
  }
  gsap.set(
    [totalRule, totalLabel, value, art, stampWord],
    { autoAlpha: 0 }
  );

  const restBody = { x: 0, y: 0, rotation: 0 };
  const restSheet = { x: 0, y: 0, rotation: 0, sx: 1, sy: 1 };
  let grips = null;
  let surpriseEyes = null;
  let sweat = null;

  function bodyPoint(lx, ly, pose) {
    const a = pose.rotation * Math.PI / 180;
    const dx = lx - palW / 2;
    const dy = ly - palH;
    return {
      x: homeX + palW / 2 + pose.x + dx * Math.cos(a) - dy * Math.sin(a),
      y: homeY + palH + pose.y + dx * Math.sin(a) + dy * Math.cos(a)
    };
  }

  function sheetPoint(lx, ly, pose) {
    const a = pose.rotation * Math.PI / 180;
    const ox = paperW / 2;
    const oy = paperH * 0.48;
    const dx = (lx - ox) * (pose.sx || 1);
    const dy = (ly - oy) * (pose.sy || 1);
    return {
      x: paperX + ox + pose.x + dx * Math.cos(a) - dy * Math.sin(a),
      y: paperTop + oy + pose.y + dx * Math.sin(a) + dy * Math.cos(a)
    };
  }

  function gripPose(body, sheet, mode = "grip") {
    return [0, 1].map((i) => {
      const shoulder = bodyPoint(
        M.cell * (i ? 9.5 : 0.9), M.cell * 4.2, body
      );
      let hand = sheetPoint(
        paperW - M.cell * (i ? 1.8 : 6.2), 2, sheet
      );
      let elbowY = hand.y - M.cell * 1.4;

      if (i === 1 && mode !== "grip") {
        hand = bodyPoint(
          M.cell * (mode === "wipeAcross" ? 4.7 : 7.3),
          M.cell * 1.5,
          body
        );
        elbowY = hand.y - M.cell * 0.5;
      }

      const sx = Math.round(shoulder.x);
      const sy = Math.round(shoulder.y);
      const hx = Math.round(hand.x);
      const hy = Math.round(hand.y);
      const ey = Math.round(elbowY);

      return {
        d: `M ${sx} ${sy} L ${sx} ${ey} L ${hx} ${ey} L ${hx} ${hy}`,
        x: Math.round(hx - M.cell * 1.25),
        y: Math.round(hy - M.cell * 0.6)
      };
    });
  }

  function moveGrips(line, at, duration, body, sheet, ease, mode = "grip") {
    if (!grips) return;

    gripPose(body, sheet, mode).forEach((pose, i) => {
      if (duration <= 0) {
        line.set(grips.arms[i], { attr: { d: pose.d } }, at);
        line.set(grips.hands[i], { x: pose.x, y: pose.y }, at);
      } else {
        line.to(grips.arms[i], {
          attr: { d: pose.d }, duration, ease
        }, at);
        line.to(grips.hands[i], {
          x: pose.x, y: pose.y, duration, ease
        }, at);
      }
    });
  }

  function moveBody(line, at, duration, pose, ease) {
    if (!hasPal) return;

    const props = {
      x: homeX + pose.x,
      y: homeY + pose.y,
      rotation: pose.rotation
    };

    if (duration <= 0) {
      line.set(pal, props, at);
    } else {
      line.to(pal, { ...props, duration, ease }, at);
    }
  }

  if (hasPal) {
    const holder = make("div", "cr-grips", $("cr-scene"));
    const armSvg = svgEl("svg", holder, { viewBox: `0 0 ${W} ${H}` });
    const arms = [];
    const hands = [];

    for (let i = 0; i < 2; i++) {
      const outline = svgEl("path", armSvg, {
        fill: "none",
        stroke: V.ink,
        "stroke-width": M.cell + 4,
        "stroke-linecap": "square",
        "stroke-linejoin": "miter"
      });
      const arm = svgEl("path", armSvg, {
        fill: "none",
        stroke: V.accent,
        "stroke-width": M.cell,
        "stroke-linecap": "square",
        "stroke-linejoin": "miter"
      });
      arms.push([outline, arm]);

      const hand = make("div", "cr-grip-hand", holder);
      hand.style.cssText +=
        `;width:${Math.round(M.cell * 2.5)}px;height:${Math.round(M.cell * 1.6)}px;background:${V.accent};box-shadow:0 ${Math.round(M.cell * 0.3)}px 0 ${rgba(V.ink, 0.4)},inset 0 ${-Math.round(M.cell * 0.3)}px 0 ${rgba(V.ink, 0.28)};clip-path:polygon(0% 0%,80% 0%,80% 20%,100% 20%,100% 100%,0% 100%)`;

      for (let j = 0; j < 3; j++) {
        const notch = make("div", "cr-grip-notch", hand);
        notch.style.cssText +=
          `;left:${Math.round(M.cell * (0.5 + j * 0.6))}px;bottom:0;width:${Math.max(2, Math.round(M.cell * 0.2))}px;height:${Math.round(M.cell * 0.65)}px;background:${rgba(V.ink, 0.58)}`;
      }

      hands.push(hand);
    }

    grips = { el: holder, arms, hands };

    gripPose(restBody, restSheet).forEach((pose, i) => {
      gsap.set(arms[i], { attr: { d: pose.d } });
      gsap.set(hands[i], { x: pose.x, y: pose.y });
    });

    surpriseEyes = make("div", "cr-eyes", pal);

    const mask = make("div", "cr-eye-mask", surpriseEyes);
    mask.style.cssText +=
      `;left:${Math.round(M.cell * 1.35)}px;top:${Math.round(M.cell * 1.3)}px;width:${Math.round(M.cell * 8.3)}px;height:${Math.round(M.cell * 3.15)}px;background:${V.accent}`;

    [2.1, 7.4].forEach((x) => {
      const eye = make("div", "cr-wide-eye", surpriseEyes);
      eye.style.cssText +=
        `;left:${Math.round(M.cell * x)}px;top:${Math.round(M.cell * 1.9)}px;width:${Math.round(M.cell * 1.5)}px;height:${Math.round(M.cell * 1.5)}px;background:${V.mouthColor}`;
    });

    sweat = make("div", "cr-sweat", pal);
    sweat.style.cssText +=
      `;left:${palW + Math.round(M.cell * 0.25)}px;top:${Math.round(M.cell * 0.5)}px;width:${Math.round(M.cell * 0.7)}px;height:${M.cell}px;background:${V.paper};clip-path:polygon(30% 0%,70% 0%,70% 25%,100% 25%,100% 75%,70% 75%,70% 100%,30% 100%,30% 75%,0% 75%,0% 25%,30% 25%)`;

    gsap.set(holder, { autoAlpha: 1 });
    gsap.set(surpriseEyes, { autoAlpha: 0 });
    gsap.set(sweat, { autoAlpha: 0 });

    clawd.pose(build, 0, {
      arms: "down", eyes: "left", legs: "stand"
    });
  }

  function feed(fromH, toH, at, strain, rowInfo = null, quick = false) {
    const pre = (quick ? 0.025 : 0.06) * U;
    const attack = (quick ? 0.07 : 0.11) * U;
    const stop = (quick ? 0.025 : 0.045) * U;
    const recoil = (quick ? 0.035 : 0.06) * U;
    const recover = (quick ? 0.045 : 0.095) * U;
    const pullAt = at + pre;
    const firstBite = pullAt + attack * 0.32;
    const hit = pullAt + attack;
    const recoilAt = hit + stop;
    const recoverAt = recoilAt + recoil;
    const end = recoverAt + recover;
    const pull = M.pull * (0.78 + strain * 0.22);

    if (
      (rowInfo && rowInfo.i === earlyCount) ||
      (!rowInfo && earlyCount === n)
    ) {
      restoreReceiptType(hit);
    }

    const windSheet = {
      x: 0, y: -Math.max(2, M.cell * 0.2), rotation: 0
    };
    const yankSheet = { x: 0, y: pull, rotation: 0 };
    const recoilSheet = { x: 0, y: -M.recoil, rotation: 0 };

    const windBody = {
      x: -M.cell * 0.2, y: -M.cell * 0.2, rotation: -2
    };
    const yankBody = {
      x: M.cell * (0.25 + strain * 0.8),
      y: pull * 0.72,
      rotation: 3 + strain * 5
    };
    const recoilBody = {
      x: -M.cell * 0.1, y: -M.cell * 0.2, rotation: -2
    };

    if (hasPal) {
      build.set(grips.el, { autoAlpha: 1 }, at);
      clawd.pose(build, at, {
        arms: "down",
        eyes: strain > 0.65 ? "closed" : "left",
        legs: strain > 0.65 ? "right" : "stand"
      });

      moveBody(build, at, pre, windBody, "power2.in");
      moveGrips(build, at, pre, windBody, windSheet, "power2.in");

      moveBody(build, pullAt, attack, yankBody, "power4.in");
      moveGrips(build, pullAt, attack, yankBody, yankSheet, "power4.in");

      moveBody(build, recoilAt, recoil, recoilBody, "power3.out");
      moveGrips(
        build, recoilAt, recoil, recoilBody, recoilSheet, "power3.out"
      );

      moveBody(build, recoverAt, recover, restBody, "power3.out");
      moveGrips(
        build, recoverAt, recover, restBody, restSheet, "power3.out"
      );

      clawd.pose(build, end, {
        arms: "down", eyes: "left", legs: "stand"
      });
    }

    [
      { at, duration: pre, pose: windSheet, ease: "power2.in" },
      { at: pullAt, duration: attack, pose: yankSheet, ease: "power4.in" },
      { at: recoilAt, duration: recoil, pose: recoilSheet, ease: "power3.out" },
      { at: recoverAt, duration: recover, pose: restSheet, ease: "power3.out" }
    ].forEach((step) => {
      build.to(rig, {
        x: step.pose.x,
        y: step.pose.y,
        rotation: step.pose.rotation,
        duration: step.duration,
        ease: step.ease
      }, step.at);

      build.to(subtotal, {
        y: step.pose.y,
        duration: step.duration,
        ease: step.ease
      }, step.at);
    });

    // Mechanical bites move the receipt and its running total together.
    [
      { t: firstBite, u: 0.46 },
      { t: pullAt + attack * 0.72, u: 0.84 },
      { t: hit, u: 1 }
    ].forEach((step) => {
      const height = Math.round(fromH + (toH - fromH) * step.u);
      build.set(paper, { height }, step.t);
      build.set(curl, { top: height - 5 }, step.t);
      build.set(subtotal, {
        top: paperTop + height + M.counterGap
      }, step.t);
      build.set(roller, {
        backgroundPositionX: Math.round(step.u * 72) + "px"
      }, step.t);
    });

    // The crease loads before the yank and snaps flat after the hard stop.
    build.to(paper, {
      rotationX: -5, scaleY: 0.99,
      duration: pre, ease: "power2.in"
    }, at);
    build.to(paper, {
      rotationX: 7, scaleY: 0.985,
      duration: attack, ease: "power4.in"
    }, pullAt);
    build.to(paper, {
      rotationX: -2, scaleY: 1.005,
      duration: recoil, ease: "power3.out"
    }, recoilAt);
    build.to(paper, {
      rotationX: 0, scaleY: 1,
      duration: recover, ease: "power3.out"
    }, recoverAt);

    build.set(buckle, {
      top: Math.min(rowsTop * 0.35, M.cell * 2),
      autoAlpha: 1,
      opacity: 0.9,
      scaleY: 0.25
    }, pullAt);
    build.to(buckle, {
      scaleY: 1.3,
      duration: attack,
      ease: "power4.in"
    }, pullAt);
    build.to(buckle, {
      scaleY: 0.12,
      duration: recoil + recover,
      ease: "power3.out"
    }, recoilAt);
    build.set(buckle, { autoAlpha: 0 }, end);

    build.fromTo(edge,
      { scaleY: 2.1, opacity: 1 },
      {
        scaleY: 0.75, opacity: 0.56,
        duration: end - pullAt,
        ease: "power3.out", immediateRender: false
      }, pullAt
    );
    build.fromTo(curl,
      { scaleX: 0.88, scaleY: 1.9, opacity: 1 },
      {
        scaleX: 1, scaleY: 1, opacity: 0.8,
        duration: end - pullAt,
        ease: "power3.out", immediateRender: false
      }, pullAt
    );
    build.fromTo(roller,
      { scaleY: 2.2 },
      {
        scaleY: 1,
        duration: end - pullAt,
        ease: "power3.out", immediateRender: false
      }, pullAt
    );
    build.fromTo(lip,
      { backgroundColor: V.accent },
      {
        backgroundColor: rgba(V.paper, 0.24),
        duration: end - pullAt,
        ease: "power3.out", immediateRender: false
      }, pullAt
    );

    if (rowInfo) {
      const { r, i } = rowInfo;
      const textAt = i === 0 ? at : hit;

      // A complete row and its exact subtotal arrive on the same frame.
      build.set(r.row, { autoAlpha: 1 }, textAt);
      build.set(subtotalValue, {
        textContent: subtotals[i]
      }, textAt);

      build.fromTo(subtotalValue,
        { scaleX: 1.08, scaleY: 1.08, color: V.accent },
        {
          scaleX: 1, scaleY: 1, color: V.paper,
          duration: 0.23 * U,
          ease: "power3.out", immediateRender: false
        }, textAt
      );
      build.fromTo(r.wash,
        { opacity: 0.65, scaleX: 0.04 },
        {
          opacity: 0, scaleX: 1,
          duration: 0.21 * U,
          ease: "power4.out", immediateRender: false
        }, textAt
      );
      build.fromTo(r.price,
        { color: V.stampInk },
        {
          color: V.ink,
          duration: 0.21 * U,
          ease: "power3.out", immediateRender: false
        }, textAt
      );
      build.fromTo($("cr-halo"),
        { opacity: 1 },
        {
          opacity: 0.7,
          duration: 0.28 * U,
          ease: "power3.out", immediateRender: false
        }, textAt
      );
    }

    return { firstBite, hit, end };
  }

  if (logoEl) {
    build.fromTo(logoEl,
      { rotation: -18, scaleX: 0.86, scaleY: 0.86 },
      {
        rotation: 0, scaleX: 1, scaleY: 1,
        duration: 0.24 * U,
        ease: "back.out(2.4)"
      }, 0
    );
  }

  build.to($("cr-grain"), {
    backgroundPosition: "21px -29px", duration: D, ease: "none"
  }, 0);
  build.to($("cr-halo"), {
    scaleX: 1.07, scaleY: 1.04, duration: D, ease: "sine.inOut"
  }, 0);

  let currentH = initialH;
  const lastRowAt = D * 0.68;
  const finalFeedAt = D - 0.6 * U;

  rowEls.forEach((r, i) => {
    const at = n > 1 ? lastRowAt * i / (n - 1) : 0;
    const feedRowsTop = i < earlyCount ? earlyRowsTop : rowsTop;
    const feedRowH = i < earlyCount ? earlyRowH : rowH;
    const nextH = Math.min(
      paperH,
      Math.ceil(
        feedRowsTop +
        (Math.floor(i / columns) + 1) * feedRowH +
        M.feedTail
      )
    );
    const strain = n > 1 ? 0.15 + 0.85 * i / (n - 1) : 0.5;
    const event = feed(currentH, nextH, at, strain, { r, i });
    currentH = nextH;

    const nextAt = i < n - 1
      ? lastRowAt * (i + 1) / Math.max(1, n - 1)
      : finalFeedAt;
    const restAt = event.end + 0.015 * U;
    const restSpan = nextAt - restAt - 0.025 * U;

    if (restSpan > 0.08 * U) {
      build.to(curl, {
        scaleY: 1.14, opacity: 0.7,
        duration: restSpan * 0.5, ease: "sine.inOut"
      }, restAt);
      build.to(curl, {
        scaleY: 1, opacity: 0.8,
        duration: restSpan * 0.5, ease: "sine.inOut"
      }, restAt + restSpan * 0.5);
    }
  });

  if (hasPal) {
    clawd.blink(build, D * 0.16);

    if (n >= 2) {
      const wipeAt = D - 0.88 * U;

      clawd.pose(build, wipeAt, {
        arms: "down", eyes: "closed", legs: "stand"
      });
      moveGrips(
        build, wipeAt, 0.065 * U,
        restBody, restSheet, "power3.out", "wipe"
      );
      moveGrips(
        build, wipeAt + 0.065 * U, 0.07 * U,
        restBody, restSheet, "power2.inOut", "wipeAcross"
      );
      moveGrips(
        build, wipeAt + 0.135 * U, 0.08 * U,
        restBody, restSheet, "power3.in", "grip"
      );

      build.set(sweat, {
        autoAlpha: 1, y: -M.cell * 0.25
      }, wipeAt);
      build.to(sweat, {
        y: M.cell * 0.8,
        duration: 0.2 * U, ease: "power2.in"
      }, wipeAt);
      build.set(sweat, { autoAlpha: 0 }, wipeAt + 0.215 * U);
      clawd.pose(build, wipeAt + 0.215 * U, {
        arms: "down", eyes: "left", legs: "stand"
      });
    }
  }

  const finalFeed = feed(
    currentH, paperH, finalFeedAt, 1, null, true
  );

  build.set(subtotal, { autoAlpha: 0 }, finalFeed.firstBite);
  build.set(
    [totalRule, totalLabel, value],
    { autoAlpha: 1 },
    finalFeed.hit
  );
  build.fromTo(totalRule,
    { scaleX: 0 },
    {
      scaleX: 1, duration: 0.055 * U,
      ease: "power4.out", immediateRender: false
    }, finalFeed.hit
  );

  const tearAt = D - 0.22 * U;
  const tearWind = tearAt - 0.1 * U;
  const tearBody = {
    x: M.cell * 1.1,
    y: M.cell * 1.2,
    rotation: 9
  };
  const tearSheet = {
    x: -12, y: M.tear + 22, rotation: -3.4
  };

  build.to(rig, {
    x: tearSheet.x,
    y: tearSheet.y,
    rotation: tearSheet.rotation,
    duration: 0.1 * U,
    ease: "power4.in"
  }, tearWind);
  build.to(paper, {
    rotationX: -8, skewX: 0.75,
    duration: 0.1 * U, ease: "power4.in"
  }, tearWind);
  build.set(buckle, {
    top: M.cell,
    autoAlpha: 1,
    opacity: 0.95,
    scaleY: 0.35
  }, tearWind);
  build.to(buckle, {
    scaleY: 1.5, duration: 0.1 * U, ease: "power4.in"
  }, tearWind);

  if (hasPal) {
    clawd.pose(build, tearWind, {
      arms: "down", eyes: "closed", legs: "right"
    });
    moveBody(build, tearWind, 0.1 * U, tearBody, "power4.in");
    moveGrips(
      build, tearWind, 0.1 * U,
      tearBody, tearSheet, "power4.in"
    );

    const releaseAt = tearAt + 0.012 * U;
    build.set(grips.el, { autoAlpha: 0 }, releaseAt);
    build.set(surpriseEyes, { autoAlpha: 1 }, releaseAt);
    clawd.pose(build, releaseAt, {
      arms: "up", eyes: "open", legs: "stand"
    });
    moveBody(
      build, releaseAt, 0.11 * U, restBody, "power3.out"
    );
  }

  build.set(neck, { autoAlpha: 0 }, tearAt);
  build.set(stub, { autoAlpha: 1 }, tearAt);
  build.set(paper, { clipPath: paperClip(true) }, tearAt);
  build.set(rig, { x: 12 }, tearAt);
  build.set(buckle, { autoAlpha: 0 }, tearAt);

  build.to(rig, {
    x: -6, y: M.tear - 8, rotation: 1.6,
    duration: 0.055 * U, ease: "power3.out"
  }, tearAt);
  build.to(rig, {
    x: 0, y: M.tear, rotation: 0,
    duration: 0.08 * U, ease: "power3.out"
  }, tearAt + 0.055 * U);
  build.to(paper, {
    rotationX: 0, skewX: 0, scaleY: 1,
    duration: 0.1 * U, ease: "power3.out"
  }, tearAt);

  build.timeScale(1 / Math.max(0.001, T.scale));
  tl.add(build, 0);

  const key = T.key;
  const hold = Math.max(0, T.hold);
  const impactSpan = Math.min(0.28, hold * 0.24);
  const contact = impactSpan > 0;
  const impactPose = {
    x: contact ? 4 : 0,
    y: M.tear + (contact ? 12 : 0),
    rotation: contact ? 2 : 0,
    sx: contact ? 1.005 : 1,
    sy: contact ? 0.94 : 1
  };

  tl.set(subtotal, { autoAlpha: 0 }, key);
  tl.set(totalRule, { autoAlpha: 0 }, key);
  tl.set(value, {
    ...finalValue,
    color: V.stampInk,
    autoAlpha: 1
  }, key);
  tl.set(totalLabel, {
    ...finalLabel,
    color: V.stampInk,
    autoAlpha: 1
  }, key);
  tl.set([art, stampWord], { autoAlpha: 1 }, key);

  // A cut to oversized contact: no fading stamp or early payoff.
  const firstSealPose = contact ? contactSeal : finalSeal;
  tl.set(seal, {
    y: firstSealPose.y,
    scaleX: firstSealPose.sx,
    scaleY: firstSealPose.sy,
    rotation: firstSealPose.rotation
  }, key);
  tl.set(rig, {
    x: impactPose.x,
    y: impactPose.y,
    rotation: impactPose.rotation,
    scaleX: impactPose.sx,
    scaleY: impactPose.sy,
    skewX: contact ? -0.5 : 0
  }, key);
  tl.set(paper, {
    height: paperH,
    clipPath: paperClip(true),
    rotationX: contact ? -5.5 : 0,
    skewX: contact ? 0.35 : 0,
    scaleX: 1,
    scaleY: 1
  }, key);

  if (contact) {
    const stop = Math.min(1 / CA.fps, impactSpan * 0.18);
    const bounce = impactSpan * 0.28;
    const recover = impactSpan - stop - bounce;
    const reboundAt = key + stop;
    const settleAt = reboundAt + bounce;

    tl.to(rig, {
      x: -3, y: M.tear - 6, rotation: -1,
      scaleX: 0.998, scaleY: 1.018, skewX: 0.15,
      duration: bounce, ease: "power3.out"
    }, reboundAt);
    tl.to(rig, {
      x: 0, y: M.tear, rotation: 0,
      scaleX: 1, scaleY: 1, skewX: 0,
      duration: recover, ease: "power3.out"
    }, settleAt);

    tl.to(seal, {
      y: reboundSeal.y,
      scaleX: reboundSeal.sx,
      scaleY: reboundSeal.sy,
      rotation: reboundSeal.rotation,
      duration: bounce, ease: "power3.out"
    }, reboundAt);
    tl.to(seal, {
      y: 0,
      scaleX: 1,
      scaleY: 1,
      rotation: angle,
      duration: recover, ease: "power3.out"
    }, settleAt);

    tl.to(paper, {
      rotationX: 2.5, skewX: -0.2,
      duration: bounce, ease: "power3.out"
    }, reboundAt);
    tl.to(paper, {
      rotationX: 0, skewX: 0,
      duration: recover, ease: "power3.out"
    }, settleAt);

    tl.set(buckle, {
      top: sealY + sealD * 0.56,
      autoAlpha: 1,
      opacity: 0.95,
      scaleY: 0.25
    }, key);
    tl.to(buckle, {
      scaleY: 1.4, duration: stop + bounce, ease: "power3.out"
    }, key);
    tl.to(buckle, {
      scaleY: 0.1, duration: recover, ease: "power3.out"
    }, settleAt);
    tl.set(buckle, { autoAlpha: 0 }, key + impactSpan);

    tl.fromTo(edge,
      { scaleY: 2.4, opacity: 1 },
      {
        scaleY: 0.75, opacity: 0.56,
        duration: impactSpan,
        ease: "power3.out", immediateRender: false
      }, key
    );
    tl.fromTo(curl,
      { scaleX: 0.86, scaleY: 2.2, opacity: 1 },
      {
        scaleX: 1, scaleY: 1, opacity: 0.8,
        duration: impactSpan,
        ease: "power3.out", immediateRender: false
      }, key
    );
  }

  if (hold > 0) {
    tl.fromTo($("cr-halo"),
      { opacity: 1.15 },
      {
        opacity: 0.84,
        duration: Math.min(0.32, hold),
        ease: "power3.out", immediateRender: false
      }, key
    );
    tl.to($("cr-halo"), {
      scaleX: 1.14, scaleY: 1.09,
      duration: hold, ease: "sine.inOut"
    }, key);
    tl.to($("cr-grain"), {
      backgroundPosition: "35px -48px",
      duration: hold, ease: "none"
    }, key);
  }

  if (hold > 0.08) {
    tl.fromTo($("cr-sweep"),
      { xPercent: -180 },
      {
        xPercent: 760,
        duration: hold - 0.04,
        ease: "sine.inOut", immediateRender: false
      }, key + 0.04
    );
  }

  if (hold > impactSpan) {
    const breatheAt = key + impactSpan;
    const breatheSpan = hold - impactSpan;
    tl.to(curl, {
      scaleX: 0.94, scaleY: 1.22, opacity: 0.68,
      duration: breatheSpan * 0.5, ease: "sine.inOut"
    }, breatheAt);
    tl.to(curl, {
      scaleX: 1, scaleY: 1, opacity: 0.8,
      duration: breatheSpan * 0.5, ease: "sine.inOut"
    }, breatheAt + breatheSpan * 0.5);
  }

  if (hasPal) {
    clawd.pose(tl, key, {
      arms: "up", eyes: "open", legs: "stand"
    });
    tl.set(grips.el, { autoAlpha: 0 }, key);
    tl.set(surpriseEyes, { autoAlpha: 1 }, key);
    tl.set(pal, {
      x: homeX + (contact ? M.cell * 0.2 : 0),
      y: homeY + (contact ? M.cell * 0.35 : 0),
      rotation: contact ? 2 : 0,
      scaleX: 1,
      scaleY: 1
    }, key);

    if (contact) {
      tl.to(pal, {
        x: homeX, y: homeY, rotation: 0,
        duration: Math.min(0.2, impactSpan), ease: "power3.out"
      }, key);
    }

    const jumpHeight = Math.max(0, Math.min(
      M.cell * 3,
      homeY - topBound - 8
    ));

    let cursor = Math.min(hold, impactSpan + 0.035);
    let jumpIndex = 0;

    while (hold - cursor > 0.34) {
      const span = Math.min(0.54, hold - cursor - 0.015);
      const at = key + cursor;
      const crouch = span * 0.11;
      const rise = span * 0.25;
      const hang = span * 0.05;
      const fall = span * 0.30;
      const landing = span * 0.12;
      const recover = span * 0.17;
      const launchAt = at + crouch;
      const fallAt = launchAt + rise + hang;
      const landAt = fallAt + fall;
      const recoverAt = landAt + landing;

      // The V stays raised throughout every jump, including the landing.
      clawd.pose(tl, at, {
        arms: "up", eyes: "open", legs: "stand"
      });
      tl.to(pal, {
        x: homeX,
        y: homeY + M.cell * 0.22,
        rotation: 0,
        duration: crouch,
        ease: "power3.in"
      }, at);

      clawd.pose(tl, launchAt, {
        arms: "up",
        eyes: "open",
        legs: jumpIndex % 2 ? "left" : "right"
      });
      tl.to(pal, {
        x: homeX,
        y: homeY - jumpHeight,
        rotation: jumpIndex % 2 ? 2 : -2,
        duration: rise,
        ease: "power3.out"
      }, launchAt);

      tl.to(pal, {
        x: homeX,
        y: homeY + M.cell * 0.18,
        rotation: 0,
        duration: fall,
        ease: "power3.in"
      }, fallAt);

      clawd.pose(tl, landAt, {
        arms: "up", eyes: "open", legs: "stand"
      });
      tl.to(pal, {
        y: homeY + M.cell * 0.26,
        rotation: 0,
        duration: landing,
        ease: "power2.out"
      }, landAt);
      tl.to(pal, {
        y: homeY,
        rotation: 0,
        duration: recover,
        ease: "power3.out"
      }, recoverAt);

      cursor += span;
      jumpIndex++;
    }

    if (hold > cursor) {
      tl.to(pal, {
        x: homeX,
        y: homeY - M.cell * 0.08,
        rotation: 0,
        duration: hold - cursor,
        ease: "sine.inOut"
      }, key + cursor);
    }

    if (hold > 0) {
      for (let i = 0; i < 3; i++) {
        const ray = make("div", "cr-ray", $("cr-rays"));
        ray.style.cssText +=
          `;width:${compact ? 7 : 10}px;height:${M.cell * 1.4}px;background:${V.accent}`;

        gsap.set(ray, {
          x: homeX + palW * (0.24 + i * 0.25),
          y: Math.max(topBound + 3, homeY - M.cell * 1.25),
          rotation: (i - 1) * 27,
          scaleX: 1,
          scaleY: 0.3,
          autoAlpha: 0
        });
        tl.set(ray, { autoAlpha: 1 }, key);
        tl.to(ray, {
          scaleY: 1,
          duration: Math.min(0.075, hold),
          ease: "power3.out"
        }, key);
        tl.set(ray, {
          autoAlpha: 0
        }, key + Math.min(0.18, hold));
      }
    }
  }

  if (hold > 0) {
    const rnd = seeded(913);
    const burstDuration = Math.min(0.34, hold);
    const sealPose = contact ? contactSeal : finalSeal;
    const sealAngle = sealPose.rotation * Math.PI / 180;

    for (let i = 0; i < 30; i++) {
      const p = make("div", "cr-spark", $("cr-sparks"));
      const size = Math.round(
        (compact ? 4 : 6) * (1 + Math.floor(rnd() * 2))
      );
      p.style.cssText +=
        `;width:${size}px;height:${size}px;background:${V.stampInk}`;

      const a = rnd() * Math.PI * 2;
      const dx = Math.cos(a) * sealD * 0.475 * sealPose.sx;
      const dy = Math.sin(a) * sealD * 0.475 * sealPose.sy;
      const localX = sealX + sealD / 2 +
        dx * Math.cos(sealAngle) - dy * Math.sin(sealAngle);
      const localY = sealY + sealD / 2 + sealPose.y +
        dx * Math.sin(sealAngle) + dy * Math.cos(sealAngle);
      const start = sheetPoint(localX, localY, impactPose);
      const distance = (compact ? 30 : 44) +
        rnd() * (compact ? 44 : 68);
      const endX = Math.max(
        12, Math.min(W - size - 12, start.x + Math.cos(a) * distance)
      );
      const endY = Math.max(
        topBound + 8,
        Math.min(
          bottomBound - size - 8,
          start.y + Math.sin(a) * distance + 18
        )
      );

      gsap.set(p, {
        x: start.x, y: start.y,
        scaleX: 1, scaleY: 1, autoAlpha: 0
      });
      tl.set(p, { autoAlpha: 1 }, key);
      tl.to(p, {
        x: endX,
        rotation: (rnd() - 0.5) * 100,
        duration: burstDuration,
        ease: "power3.out"
      }, key);
      tl.to(p, {
        y: start.y - M.cell - rnd() * 16,
        duration: burstDuration * 0.38,
        ease: "power3.out"
      }, key);
      tl.to(p, {
        y: endY,
        duration: burstDuration * 0.62,
        ease: "power2.in"
      }, key + burstDuration * 0.38);
      tl.to(p, {
        scaleX: 0, scaleY: 0,
        duration: burstDuration * 0.25,
        ease: "power3.in"
      }, key + burstDuration * 0.75);
      tl.set(p, { autoAlpha: 0 }, key + burstDuration);
    }
  }

  const open = "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)";
  const shut = "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)";

  gsap.set(stageEl, { clipPath: open });

  if (variant === "overlay") {
    tl.fromTo(stageEl,
      { clipPath: shut },
      {
        clipPath: open,
        duration: Math.min(0.14, T.key * 0.1),
        ease: "power4.out"
      }, 0
    );
  }

  if (T.exit > 0) {
    const exitDuration = Math.max(0, T.exit - 1 / CA.fps);

    if (exitDuration > 0) {
      tl.to(stageEl, {
        clipPath: shut,
        duration: exitDuration,
        ease: "power3.in"
      }, key + hold);
      tl.set(stageEl, {
        clipPath: shut
      }, key + hold + exitDuration);
    } else {
      tl.set(stageEl, { clipPath: shut }, key + hold);
    }
  }

  window.__timelines["block"] = tl;
});