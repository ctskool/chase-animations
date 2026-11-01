CA.ready(async () => {
  const { vars: V, stage: S, safe, time: T, variant, make, rgba } = CA;
  const $ = (id) => document.getElementById(id);
  const clamp = (value, low, high) =>
    Math.min(high, Math.max(low, value));
  const number = (id, fallback) => {
    const value = Number(V[id]);
    return Number.isFinite(value) ? value : fallback;
  };
  const wording = (value) =>
    String(value == null ? "" : value).replace(/\s+/g, " ").trim();
  const weight = (id, fallback) =>
    clamp(Math.round(number(id, fallback) / 100) * 100, 500, 800);

  const mainWeight = weight("mainWeight", 800);
  const captionWeight = weight("captionWeight", 500);
  const extraWeights = [...new Set([mainWeight, captionWeight])]
    .filter((value) => value !== 500 && value !== 800);

  if (extraWeights.length && document.fonts) {
    await Promise.all(extraWeights.map((value) =>
      document.fonts.load(`${value} 40px "Public Sans"`),
    ));
  }

  const stageEl = $("stage");
  const clip = $("sg-clip");
  const field = $("sg-field");
  const circle = $("sg-circle");
  const type = $("sg-type");
  const W = S.w;
  const H = S.h;
  const full = variant === "full";
  const short = !full && H < W * 0.66;
  const minText = full ? 40 : 32;
  const D = Math.max(0.001, T.design);
  const fps = Math.max(1, CA.fps);

  stageEl.style.background = V.paper;
  stageEl.style.borderRadius = "0px";
  stageEl.style.boxShadow = "none";
  clip.style.setProperty("--sg-ink", V.ink);
  field.style.background = V.signalRed;
  circle.style.background = V.ink;

  const referenceW = Math.max(1, number("referenceWidth", 1080));
  const referenceH = Math.max(1, number("referenceHeight", 1920));
  const sourceColumns = clamp(Math.round(number("gridColumns", 4)), 3, 6);
  const sourceLeft = number("gridLeft", 64);
  const sourceRight = Math.max(
    sourceLeft + sourceColumns,
    number("gridRight", 1016),
  );
  const sourceTop = number("gridTop", 230);
  const sourcePitch = Math.max(1, number("gridRowPitch", 200));
  const sourceModule = (sourceRight - sourceLeft) / sourceColumns;
  const sourceFieldTop = number("fieldTop", 430);
  const sourceFieldBottom = number("fieldBottom", 1430);
  const sourceColumn = (value) =>
    Math.round((value - sourceLeft) / sourceModule);

  const sourceFieldLeft = clamp(
    sourceColumn(number("fieldLeft", 110)),
    0,
    sourceColumns - 1,
  );
  const sourceFieldRight = clamp(
    sourceColumn(number("fieldRight", 970)),
    sourceFieldLeft + 1,
    sourceColumns,
  );
  const sourceBaselines = [1, 2, 3].map((i) =>
    number(`mainBaseline${i}`, 430 + i * 200),
  );
  const sourceCaptionBaselines = [1, 2, 3].map((i) =>
    number(`captionBaseline${i}`, 468 + i * 200),
  );

  const extraColumns = clamp(
    Math.round(number("compactExtraColumns", 3)),
    0,
    4,
  );
  const columns = sourceColumns + (full ? 0 : extraColumns);
  const fieldLeftColumn = Math.round(
    sourceFieldLeft / sourceColumns * columns,
  );
  const fieldRightColumn = Math.max(
    fieldLeftColumn + 1,
    Math.round(sourceFieldRight / sourceColumns * columns),
  );

  const side = Math.max(32, Number(safe.side) || 48);
  const topPad = full
    ? Math.max(230, Number(safe.top) || 0, sourceTop * H / referenceH)
    : Math.max(24, Math.min(40, Number(safe.top) || 32));
  const bottomPad = full
    ? Math.max(300, Number(safe.bottom) || 0)
    : Math.max(24, Math.min(40, Number(safe.bottom) || 32));
  const leftGuide = full
    ? Math.max(side, sourceLeft * W / referenceW)
    : side;
  const rightGuide = full
    ? Math.min(W - side, sourceRight * W / referenceW)
    : W - side;

  const module = Math.max(1, (rightGuide - leftGuide) / columns);
  const xAt = (column) => leftGuide + column * module;
  const yAt = (row) => topPad + row * module;
  const F = {
    left: xAt(fieldLeftColumn),
    right: xAt(fieldRightColumn),
    top: topPad,
    bottom: Math.max(topPad + 1, H - bottomPad),
  };
  F.width = F.right - F.left;
  F.height = F.bottom - F.top;

  const lineWidth = clamp(number("gridLineWidth", 2), 1, 4);
  const gridOpacity = clamp(number("gridOpacity", 0.16), 0.1, 0.5);
  const stepOvershoot = clamp(number("stepOvershoot", 9) / 100, 0, 0.14);
  const typeOvershoot = clamp(number("typeOvershoot", 8) / 100, 0, 0.12);
  const windBack = clamp(number("circleWindBack", 10) / 100, 0, 0.2);
  const typePeak = 1 + typeOvershoot * 0.25;
  const finalTypeGain = 1 + typeOvershoot * 3;

  const finalModules = clamp(
    Math.round(number("finalCircleModules", 2)),
    1,
    Math.min(2, fieldRightColumn - fieldLeftColumn),
  );
  const finalDiameter = Math.min(
    finalModules * module,
    F.width,
    F.height * (short ? 0.84 : 0.72),
  );
  const finalRadius = finalDiameter / 2;
  const finalCenter = {
    x: F.right - finalRadius,
    y: F.bottom - finalRadius,
  };
  const circleGap = full
    ? Math.max(28, module * 0.13)
    : Math.max(22, module * 0.16);

  const textInset = clamp(
    (number("mainLeft", 128) - number("fieldLeft", 110)) *
      module / sourceModule,
    full ? 24 : 20,
    Math.max(full ? 24 : 20, module * 0.2),
  );
  const textLeft = F.left + textInset;
  const textRight = short
    ? F.right - finalDiameter - circleGap
    : F.right - textInset;
  const textRoom = Math.max(1, textRight - textLeft);
  const headlineRoom = Math.max(1, (textRoom - 8) / typePeak);
  const typeTop = F.top + (full
    ? Math.max(32, module * 0.17)
    : clamp(module * 0.17, 20, 28));
  const anchorHeight = Math.max(6, lineWidth * 4);
  const anchorGap = Math.max(10, module * 0.05);
  const slabPad = full ? 22 : 18;
  const typeBottom = short
    ? F.bottom - 16
    : F.bottom - finalDiameter - circleGap;
  const textHeight = Math.max(
    1,
    typeBottom - typeTop - anchorGap - anchorHeight,
  );

  const gridLines = [];
  const firstColumn = Math.ceil((lineWidth / 2 - leftGuide) / module);
  const lastColumn = Math.floor(
    (W - lineWidth / 2 - leftGuide) / module,
  );
  for (let column = firstColumn; column <= lastColumn; column++) {
    const el = make("div", "sg-grid-line vertical", $("sg-grid"));
    Object.assign(el.style, {
      left: xAt(column) - lineWidth / 2 + "px",
      width: lineWidth + "px",
      background: rgba(V.ink, gridOpacity),
    });
    gsap.set(el, { scaleY: 0.08 });
    gridLines.push({
      el,
      axis: "scaleY",
      order: column - firstColumn,
    });
  }

  const firstRow = Math.ceil((lineWidth / 2 - topPad) / module);
  const lastRow = Math.floor((H - lineWidth / 2 - topPad) / module);
  for (let row = firstRow; row <= lastRow; row++) {
    const el = make("div", "sg-grid-line horizontal", $("sg-grid"));
    Object.assign(el.style, {
      top: yAt(row) - lineWidth / 2 + "px",
      height: lineWidth + "px",
      background: rgba(V.ink, gridOpacity),
    });
    gsap.set(el, { scaleX: 0.08 });
    gridLines.push({
      el,
      axis: "scaleX",
      order: row - firstRow,
    });
  }

  const measureCanvas = document.createElement("canvas");
  const context = measureCanvas.getContext("2d");
  const textWidth = (text, size, fontWeight, tracking = 0) => {
    context.font = `${fontWeight} ${size}px "Public Sans"`;
    return context.measureText(text).width +
      Math.max(0, Array.from(text).length - 1) * tracking;
  };

  const wrap = (content, room, size, fontWeight, tracking = 0) => {
    const words = wording(content).split(" ").filter(Boolean);
    if (!words.length) return [];

    const rows = [];
    let row = "";
    words.forEach((word) => {
      const candidate = row ? row + " " + word : word;
      if (row && textWidth(candidate, size, fontWeight, tracking) > room) {
        rows.push(row);
        row = word;
      } else {
        row = candidate;
      }
    });
    if (row) rows.push(row);

    if (rows.length > 1) {
      const last = rows.length - 1;
      const previous = rows[last - 1].split(" ");
      if (rows[last].split(" ").length === 1 && previous.length > 1) {
        const candidate = previous[previous.length - 1] + " " + rows[last];
        if (textWidth(candidate, size, fontWeight, tracking) <= room) {
          previous.pop();
          rows[last - 1] = previous.join(" ");
          rows[last] = candidate;
        }
      }
    }
    return rows;
  };

  const captionOpacity = clamp(number("captionOpacity", 0.84), 0.65, 1);
  const captionInk = rgba(V.ink, captionOpacity);
  const captions = [1, 2, 3].map((i, index) => {
    const numeral = wording(V[`caption${i}Number`]);
    const content = [
      numeral,
      wording(V.captionSeparator),
      wording(V[`caption${i}Text`]),
    ].filter(Boolean).join(" ");

    // Compact outputs retain the selected caption size instead of
    // reducing it merely because the stage is shorter.
    const requested = Math.max(
      minText,
      number("captionFontSize", 44) * (full ? 1.09 : 1),
    );
    const naturalWidth = textWidth(content, requested, captionWeight);
    const fontSize = Math.max(
      minText,
      Math.min(requested, requested * textRoom / Math.max(1, naturalWidth)),
    );
    const rows = wrap(content, textRoom - 4, fontSize, captionWeight);
    const baseGap = rows.length ? clamp(
      Math.max(
        0,
        sourceCaptionBaselines[index] - sourceBaselines[index],
      ) / sourcePitch * module * 0.24,
      full ? 12 : 10,
      full ? 24 : 16,
    ) : 0;

    return {
      numeral,
      rows,
      fontSize,
      gap: baseGap + (index === 2 ? slabPad + 8 : 0),
      height: rows.length * fontSize * 1.12,
      width: Math.max(0, ...rows.map((row) =>
        textWidth(row, fontSize, captionWeight),
      )),
    };
  });

  const phrases = [1, 2, 3].map((i) => wording(V[`line${i}`]));
  const requestedMain = Math.max(minText, number("mainFontSize", 164));
  const requestedTracking = number("mainTracking", -4);
  const gainFor = (index) => index === 2 ? finalTypeGain : 1;
  const naturalMainWidth = Math.max(1, ...phrases.map((phrase, index) => {
    const size = requestedMain * gainFor(index);
    return textWidth(
      phrase,
      size,
      mainWeight,
      requestedTracking * size / requestedMain,
    );
  }));

  // The final ink band gets real clearance above and below its text.
  const minimumRowGap = Math.max(
    slabPad + 10,
    module * (full ? 0.14 : 0.12),
  );
  const captionTotal = captions.reduce(
    (sum, caption) => sum + caption.height + caption.gap,
    0,
  );
  const headlineBudget = Math.max(
    minText * (2 + finalTypeGain),
    textHeight - captionTotal - minimumRowGap * 2,
  );
  let mainSize = Math.max(minText, Math.min(
    requestedMain,
    requestedMain * headlineRoom / naturalMainWidth,
    headlineBudget / (2 + finalTypeGain),
  ));

  const layoutHeadlines = () => phrases.map((phrase, index) => {
    const fontSize = Math.max(minText, mainSize * gainFor(index));
    const tracking = requestedTracking * fontSize / requestedMain;
    const rows = wrap(
      phrase,
      headlineRoom,
      fontSize,
      mainWeight,
      tracking,
    );
    return {
      fontSize,
      tracking,
      rows,
      height: Math.max(1, rows.length) * fontSize,
    };
  });

  let headlineLayouts = layoutHeadlines();
  for (let pass = 0; pass < 4; pass++) {
    const total = headlineLayouts.reduce((sum, line) => sum + line.height, 0);
    if (total <= headlineBudget || mainSize <= minText) break;
    mainSize = Math.max(minText, mainSize * headlineBudget / total);
    headlineLayouts = layoutHeadlines();
  }

  const contentHeight = headlineLayouts.reduce(
    (sum, line) => sum + line.height,
    0,
  ) + captionTotal;
  const extraSpace = Math.max(
    0,
    textHeight - contentHeight - minimumRowGap * 2,
  );
  const gapWeights = [
    Math.max(1, sourceBaselines[1] - sourceBaselines[0]),
    Math.max(1, sourceBaselines[2] - sourceBaselines[1]),
  ];
  const totalGapWeight = gapWeights[0] + gapWeights[1];
  const rowGaps = gapWeights.map((value) =>
    minimumRowGap + extraSpace * value / totalGapWeight,
  );

  const slab = make("div", "sg-payoff", type);
  slab.setAttribute("aria-hidden", "true");
  slab.style.background = V.ink;
  gsap.set(slab, { autoAlpha: 0, scaleY: 0.06 });

  let cursor = typeTop;
  const lines = headlineLayouts.map((layout, index) => {
    const mask = make("div", "sg-line-window", type);
    const mover = make("div", "sg-line", mask);
    const headline = make("span", "sg-headline", mover);

    Object.assign(headline.style, {
      fontSize: layout.fontSize + "px",
      fontWeight: String(mainWeight),
      letterSpacing: layout.tracking + "px",
    });
    layout.rows.forEach((row) =>
      make("span", "sg-headline-row", headline, row),
    );
    Object.assign(mask.style, {
      left: textLeft + "px",
      top: cursor + "px",
      width: textRoom + "px",
      height: layout.height + "px",
    });

    if (index === 2) {
      // Give the text its own explicit contrast background as well
      // as the wider band behind it.
      mover.style.color = V.paper;
      mover.style.background = V.ink;
      Object.assign(slab.style, {
        left: F.left + "px",
        top: cursor - slabPad + "px",
        width: (short ? textRight + textInset - F.left : F.width) + "px",
        height: layout.height + slabPad * 2 + "px",
      });
    }

    gsap.set(mover, {
      autoAlpha: 0,
      y: full ? 20 : 14,
      scaleX: 1 - typeOvershoot,
      scaleY: 1 - typeOvershoot,
    });
    cursor += layout.height;

    const caption = captions[index];
    const captionMask = make("div", "sg-caption-window", type);
    caption.mover = make("div", "sg-caption", captionMask);
    Object.assign(caption.mover.style, {
      fontSize: caption.fontSize + "px",
      fontWeight: String(captionWeight),
      color: captionInk,
    });
    caption.rows.forEach((row, rowIndex) => {
      const rowEl = make("span", "sg-caption-row", caption.mover);
      if (rowIndex === 0 && caption.numeral && row.startsWith(caption.numeral)) {
        make("span", "sg-caption-number", rowEl, caption.numeral);
        make("span", "", rowEl, row.slice(caption.numeral.length));
      } else {
        rowEl.textContent = row;
      }
    });

    cursor += caption.gap;
    Object.assign(captionMask.style, {
      left: textLeft + "px",
      top: cursor + "px",
      width: textRoom + "px",
      height: caption.height + "px",
    });
    gsap.set(caption.mover, { autoAlpha: 0, y: 10 });
    cursor += caption.height;
    caption.bottom = cursor;
    if (index < 2) cursor += rowGaps[index];
    return { mover };
  });

  const anchor = make("div", "sg-anchor", type);
  anchor.setAttribute("aria-hidden", "true");
  Object.assign(anchor.style, {
    left: textLeft + "px",
    top: captions[2].bottom + anchorGap + "px",
    width: Math.min(
      textRoom,
      Math.max(textRoom * 0.58, captions[2].width),
    ) + "px",
    height: anchorHeight + "px",
    background: V.ink,
  });
  gsap.set(anchor, { autoAlpha: 0, scaleX: 0, scaleY: 1 });

  const sourceFieldTopRow = Math.round(
    (sourceFieldTop - sourceTop) / sourcePitch,
  );
  const guideRows = Math.max(
    4,
    Math.round((sourceFieldBottom - sourceFieldTop) / sourcePitch),
    Math.round((sourceBaselines[2] - sourceFieldTop) / sourcePitch) +
      finalModules + 1,
  );
  const maximumRouteRow = Math.max(
    0.5,
    Math.min(guideRows, F.height / module) - 0.5,
  );
  const points = [1, 2, 3, 4, 5].map((i) => {
    const sourceX = number(`circle${i}X`, sourceLeft + sourceModule / 2);
    const sourceY = number(`circle${i}Y`, sourceTop + sourcePitch / 2);
    const column = clamp(
      Math.round(
        (sourceX - sourceLeft) / sourceModule *
          columns / sourceColumns - 0.5,
      ) + 0.5,
      fieldLeftColumn + 0.5,
      fieldRightColumn - 0.5,
    );
    const row = clamp(
      Math.round(
        (sourceY - sourceTop) / sourcePitch -
          sourceFieldTopRow - 0.5,
      ) + 0.5,
      0.5,
      maximumRouteRow,
    );
    return { x: xAt(column), y: yAt(row), column, row };
  });

  // The travelling subject remains substantial on a phone.
  const circleDiameter = clamp(
    number("circleRadius", 44) * 2 * W / referenceW,
    Math.min(W * 0.14, module * 0.85),
    module * 0.9,
  );
  const travelScale = full ? 1.35 : 1.5;
  const finalScale = finalDiameter / circleDiameter;
  const heroDiameter = Math.min(F.width * 0.94, F.height * 0.88);
  Object.assign(circle.style, {
    left: -circleDiameter / 2 + "px",
    top: -circleDiameter / 2 + "px",
    width: circleDiameter + "px",
    height: circleDiameter + "px",
  });
  gsap.set(circle, {
    x: (F.left + F.right) / 2,
    y: (F.top + F.bottom) / 2,
    scaleX: heroDiameter / circleDiameter,
    scaleY: heroDiameter / circleDiameter,
  });

  const stop = points[4];
  const cellLeft = clamp(
    xAt(Math.floor(stop.column)),
    F.left,
    Math.max(F.left, F.right - module),
  );
  const cellTop = clamp(
    yAt(Math.floor(stop.row)),
    F.top,
    Math.max(F.top, F.bottom - module),
  );
  const cellHeight = Math.min(module, F.height);
  const cellBottom = cellTop + cellHeight;

  gsap.set(field, {
    left: cellLeft,
    top: cellTop,
    width: module,
    height: cellHeight,
    scaleX: 0,
    scaleY: 0,
    autoAlpha: 0,
  });

  const edgeOvershoot = Math.max(0, Math.min(
    module * stepOvershoot,
    F.left - lineWidth * 2,
    W - F.right - lineWidth * 2,
    F.top - lineWidth * 2,
    H - F.bottom - lineWidth * 2,
  ));

  const restingStroke = Math.max(full ? 10 : 8, lineWidth * 4);
  const track = $("sg-track");
  const energy = $("sg-energy");
  const trackInset = restingStroke / 2;
  track.setAttribute("viewBox", `0 0 ${W} ${H}`);
  energy.setAttribute(
    "d",
    `M ${F.left + trackInset} ${F.bottom - trackInset} ` +
    `H ${F.right - trackInset} V ${F.top + trackInset} ` +
    `H ${F.left + trackInset} Z`,
  );
  energy.setAttribute("stroke", V.ink);
  energy.setAttribute("stroke-width", String(restingStroke));
  const perimeter = Math.max(
    1,
    2 * (F.width + F.height - restingStroke * 2),
  );
  const dash = Math.min(perimeter * 0.16, F.width * 0.48);
  energy.setAttribute(
    "stroke-dasharray",
    `${dash} ${Math.max(1, perimeter - dash)}`,
  );

  const tl = gsap.timeline({ paused: true });
  const build = gsap.timeline();

  const gridStagger = clamp(number("gridStaggerFrames", 2), 1, 4) / fps;
  gridLines.forEach(({ el, axis, order }) => {
    build.to(el, {
      [axis]: 1,
      duration: D * 0.16,
      ease: "expo.out",
    }, Math.min(D * 0.14, order * gridStagger));
  });

  build.to(circle, {
    x: points[0].x,
    y: points[0].y,
    scaleX: travelScale,
    scaleY: travelScale,
    duration: D * 0.065,
    ease: "power4.out",
  }, 0);

  const legs = [];
  const current = { x: points[0].x, y: points[0].y };
  points.slice(1).forEach((point) => {
    if (Math.abs(point.x - current.x) > 0.01) {
      legs.push({ axis: "x", start: current.x, end: point.x });
      current.x = point.x;
    }
    if (Math.abs(point.y - current.y) > 0.01) {
      legs.push({ axis: "y", start: current.y, end: point.y });
      current.y = point.y;
    }
  });

  const legDuration = D * 0.175 / Math.max(1, legs.length);
  legs.forEach((leg, index) => {
    const at = D * 0.065 + index * legDuration;
    const radius = circleDiameter * travelScale / 2;
    const rawPeak = leg.end + (leg.end - leg.start) * stepOvershoot;
    const peak = leg.axis === "x"
      ? clamp(rawPeak, radius + lineWidth, W - radius - lineWidth)
      : clamp(rawPeak, radius + lineWidth, H - radius - lineWidth);

    build.to(circle, {
      [leg.axis]: peak,
      duration: legDuration * 0.64,
      ease: "power4.out",
    }, at);
    build.to(circle, {
      [leg.axis]: leg.end,
      duration: legDuration * 0.36,
      ease: "power3.out",
    }, at + legDuration * 0.64);
  });

  const fieldStart = D * 0.245;
  const fieldUnit = D * 0.038;
  build.set(field, { autoAlpha: 1 }, fieldStart);
  build.to(circle, {
    scaleX: 1,
    scaleY: 1,
    duration: fieldUnit,
    ease: "power4.out",
  }, fieldStart);
  build.to(field, {
    scaleX: 1 + stepOvershoot,
    scaleY: 1 + stepOvershoot,
    duration: fieldUnit * 0.64,
    ease: "power4.out",
  }, fieldStart);
  build.to(field, {
    scaleX: 1,
    scaleY: 1,
    duration: fieldUnit * 0.36,
    ease: "power3.out",
  }, fieldStart + fieldUnit * 0.64);

  const acrossAt = fieldStart + fieldUnit;
  build.to(field, {
    left: F.left - edgeOvershoot,
    width: F.width + edgeOvershoot * 2,
    duration: fieldUnit * 0.64,
    ease: "power4.out",
  }, acrossAt);
  build.to(field, {
    left: F.left,
    width: F.width,
    duration: fieldUnit * 0.36,
    ease: "power3.out",
  }, acrossAt + fieldUnit * 0.64);

  const upAt = acrossAt + fieldUnit;
  build.to(field, {
    top: F.top - edgeOvershoot,
    height: cellBottom - F.top + edgeOvershoot,
    duration: fieldUnit * 0.64,
    ease: "power4.out",
  }, upAt);
  build.to(field, {
    top: F.top,
    height: cellBottom - F.top,
    duration: fieldUnit * 0.36,
    ease: "power3.out",
  }, upAt + fieldUnit * 0.64);

  const downAt = upAt + fieldUnit;
  build.to(field, {
    height: F.height + edgeOvershoot,
    duration: fieldUnit * 0.64,
    ease: "power4.out",
  }, downAt);
  build.to(field, {
    height: F.height,
    duration: fieldUnit * 0.36,
    ease: "power3.out",
  }, downAt + fieldUnit * 0.64);

  build.to(circle, {
    x: finalCenter.x,
    y: finalCenter.y,
    duration: D * 0.075,
    ease: "power4.out",
  }, D * 0.37);

  const firstLineAt = D * 0.4;
  const lineStagger = clamp(
    Math.max(
      D * 0.22,
      clamp(number("lineStaggerFrames", 6), 3, 9) / fps,
    ),
    D * 0.2,
    D * 0.22,
  );
  const thirdLineAt = firstLineAt + lineStagger * 2;
  const bandRun = D * 0.045;

  // The band finishes opening before any reversed wording appears.
  build.set(slab, { autoAlpha: 1 }, thirdLineAt - bandRun);
  build.to(slab, {
    scaleY: 1,
    duration: bandRun,
    ease: "power4.out",
  }, thirdLineAt - bandRun);

  lines.forEach((line, index) => {
    const at = firstLineAt + index * lineStagger;
    const run = index === 2 ? D - at : D * 0.12;
    const attack = run * 0.62;
    const land = at + run;
    const captionRun = Math.min(D * 0.045, run * 0.4);

    build.set(line.mover, { autoAlpha: 1 }, at);
    build.to(line.mover, {
      y: 0,
      scaleX: typePeak,
      scaleY: typePeak,
      duration: attack,
      ease: "power4.out",
    }, at);
    build.to(line.mover, {
      scaleX: 1,
      scaleY: 1,
      duration: run - attack,
      ease: "power3.out",
    }, at + attack);

    build.set(captions[index].mover, { autoAlpha: 1 }, land - captionRun);
    build.to(captions[index].mover, {
      y: 0,
      duration: captionRun,
      ease: "power4.out",
    }, land - captionRun);

    if (index < 2) {
      build.to(circle, {
        scaleX: 1 + stepOvershoot * 2,
        scaleY: 1 + stepOvershoot * 2,
        duration: run * 0.16,
        ease: "power3.out",
      }, at + attack);
      build.to(circle, {
        scaleX: 1,
        scaleY: 1,
        duration: run * 0.22,
        ease: "power3.out",
      }, at + attack + run * 0.16);
    }
  });

  build.to(circle, {
    scaleX: 1 - windBack,
    scaleY: 1 - windBack,
    duration: D * 0.055,
    ease: "power3.in",
  }, thirdLineAt - D * 0.08);

  const growthOvershoot = Math.min(
    stepOvershoot,
    circleGap * 0.45 / Math.max(1, finalDiameter),
  );
  const peakDiameter = finalDiameter * (1 + growthOvershoot);
  const settleRun = D * 0.035;
  build.to(circle, {
    x: F.right - peakDiameter / 2,
    y: F.bottom - peakDiameter / 2,
    scaleX: finalScale * (1 + growthOvershoot),
    scaleY: finalScale * (1 + growthOvershoot),
    duration: D - settleRun - thirdLineAt,
    ease: "power4.out",
  }, thirdLineAt);
  build.to(circle, {
    x: finalCenter.x,
    y: finalCenter.y,
    scaleX: finalScale,
    scaleY: finalScale,
    duration: settleRun,
    ease: "power3.out",
  }, D - settleRun);

  // Preserve a one-frame paper cut when the build is retimed.
  const flashFrame = Math.min(
    D * 0.025,
    1 / (fps * Math.max(0.001, T.scale)),
  );
  build.set(field, { backgroundColor: V.paper }, D - flashFrame * 2);
  build.set(field, { backgroundColor: V.signalRed }, D - flashFrame);

  build.set(anchor, { autoAlpha: 1 }, D * 0.94);
  build.to(anchor, {
    scaleX: 1,
    duration: D * 0.06,
    ease: "power4.out",
  }, D * 0.94);

  build.timeScale(1 / T.scale);
  tl.add(build, 0);

  if (T.hold > 0) {
    const impactRun = Math.min(0.2, T.hold * 0.25);
    tl.fromTo(anchor,
      { scaleY: 2 },
      {
        scaleY: 1,
        duration: impactRun,
        ease: "power3.out",
        immediateRender: false,
      }, T.key);

    tl.set(energy, { autoAlpha: 1 }, T.key);
    tl.fromTo(energy,
      { strokeWidth: restingStroke * 2 },
      {
        strokeWidth: restingStroke,
        duration: impactRun,
        ease: "power3.out",
        immediateRender: false,
      }, T.key);
    tl.fromTo(energy,
      { strokeDashoffset: 0 },
      {
        strokeDashoffset: -perimeter * 0.42,
        duration: T.hold,
        ease: "sine.inOut",
        immediateRender: false,
      }, T.key);

    const breath = 0.955;
    const smallRadius = finalRadius * breath;
    tl.fromTo(circle,
      {
        x: finalCenter.x,
        y: finalCenter.y,
        scaleX: finalScale,
        scaleY: finalScale,
      },
      {
        x: F.right - smallRadius,
        y: F.bottom - smallRadius,
        scaleX: finalScale * breath,
        scaleY: finalScale * breath,
        duration: T.hold * 0.48,
        ease: "sine.inOut",
        immediateRender: false,
      }, T.key);
    tl.fromTo(circle,
      {
        x: F.right - smallRadius,
        y: F.bottom - smallRadius,
        scaleX: finalScale * breath,
        scaleY: finalScale * breath,
      },
      {
        x: finalCenter.x,
        y: finalCenter.y,
        scaleX: finalScale,
        scaleY: finalScale,
        duration: T.hold * 0.52,
        ease: "sine.inOut",
        immediateRender: false,
      }, T.key + T.hold * 0.48);
  }

  const seam = clamp(F.left / W * 100, 0, 100);
  const closed =
    `polygon(${seam}% 0%, ${seam}% 0%, ` +
    `${seam}% 100%, ${seam}% 100%)`;
  const open = "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)";

  if (variant === "overlay") {
    tl.fromTo(stageEl,
      { clipPath: closed },
      {
        clipPath: open,
        duration: Math.min(0.2, T.key * 0.16),
        ease: "power4.out",
      }, 0);
  }

  if (T.exit > 0) {
    tl.fromTo(stageEl,
      { clipPath: open },
      {
        clipPath: closed,
        duration: Math.max(0, T.exit - 1 / fps),
        ease: "power3.in",
        immediateRender: false,
      }, T.key + T.hold);
  }

  window.__timelines["block"] = tl;
});