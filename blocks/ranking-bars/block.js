CA.ready(() => {
  const { vars: V, stage: S, safe, time: T, variant, make, fit } = CA;
  const $ = (id) => document.getElementById(id);
  const stageEl = $("stage");
  const W = S.w;
  const H = S.h;
  const full = variant === "full";
  const short = !full && H < 820;
  const minimumText = full ? 40 : 32;
  const clamp = (n, lo = 0, hi = 1) =>
    Math.max(lo, Math.min(hi, n));

  const ids = [0, 1, 2, 3, 4, 5];
  const names = ids.map((i) => String(V[`category${i + 1}`]).trim());
  const colors = ids.map((i) => V[`color${i + 1}`]);
  const hero = names.indexOf(String(V.heroCategory).trim());

  if (hero < 0) {
    throw new Error("heroCategory must exactly match a category name.");
  }
  if (names.some((name) => !name) || new Set(names).size !== 6) {
    throw new Error("Use six different, non-empty category names.");
  }

  const data = [];
  String(V.yearlyValues).trim().split(/\r?\n/).forEach((line) => {
    if (!line.trim()) return;
    const cells = line.split(/[,\t]/).map((cell) => cell.trim());
    if (data.length === 0 && /^year$/i.test(cells[0])) return;

    if (cells.length !== 7 || !/^\d{1,8}$/.test(cells[0])) {
      throw new Error("Each CSV row needs an integer year and six values.");
    }

    const values = cells.slice(1).map(Number);
    if (
      cells.slice(1).some((cell) => cell === "") ||
      values.some((n) => !Number.isFinite(n) || n < 0)
    ) {
      throw new Error("Ranking values must be finite and non-negative.");
    }
    data.push({ year: cells[0], values });
  });

  if (data.length < 2) {
    throw new Error("Ranking bars needs at least two years of data.");
  }

  const decimals = clamp(Math.round(Number(V.valueDecimals) || 0), 0, 2);
  const format = (n) => Math.max(0, n).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  const maximum = Math.max(
    1,
    Number(V.axisMax) || 1,
    ...data.flatMap((point) => point.values)
  );
  const sortValues = (values) => ids.slice().sort(
    (a, b) => values[b] - values[a] || a - b
  );
  const ranksFor = (order) => {
    const ranks = [];
    order.forEach((id, rank) => { ranks[id] = rank; });
    return ranks;
  };
  const initialRanks = ranksFor(sortValues(data[0].values));
  const finalPoint = data[data.length - 1];
  const finalRanks = ranksFor(sortValues(finalPoint.values));
  const interval = T.design / (data.length - 1);
  const delay = interval * 0.1;
  const run = interval - delay;
  const valueCurve = (p) => Math.pow(clamp(p), 2);
  const inverseCurve = (p) => Math.sqrt(clamp(p));

  const spring = (p) => {
    if (p <= 0) return 0;
    if (p >= 1) return 1;
    const response = (x) => 1 - Math.exp(-7 * x) *
      (Math.cos(7 * x) + Math.sin(7 * x));
    return response(p) / response(1);
  };
  const back = (p) => {
    const q = clamp(p) - 1;
    return 1 + 2.4 * q * q * q + 1.4 * q * q;
  };

  const events = [];
  let previousRanks = initialRanks.slice();

  for (let step = 0; step < data.length - 1; step += 1) {
    const a = data[step].values;
    const b = data[step + 1].values;
    const crossings = [];

    for (let i = 0; i < 6; i += 1) {
      for (let j = i + 1; j < 6; j += 1) {
        const difference = a[i] - a[j];
        const change = (b[i] - a[i]) - (b[j] - a[j]);
        if (Math.abs(change) < 1e-10) continue;
        const u = -difference / change;
        if (u >= -1e-9 && u <= 1 + 1e-9) {
          crossings.push(clamp(u));
        }
      }
    }

    const points = [...crossings, 1]
      .sort((a, b) => a - b)
      .filter((u, index, list) =>
        index === 0 || Math.abs(u - list[index - 1]) > 1e-7
      );

    points.forEach((u) => {
      const afterU = Math.min(1, u + 1e-6);
      const values = a.map((value, i) =>
        value + (b[i] - value) * afterU
      );
      const after = ranksFor(sortValues(values));
      const delta = after.map((rank, i) => rank - previousRanks[i]);
      if (!delta.some((change) => change !== 0)) return;

      const rising = ids.filter((i) => delta[i] < 0);
      const actor = rising.includes(hero)
        ? hero
        : rising.sort((i, j) => delta[i] - delta[j] || i - j)[0];
      const falling = ids.filter((i) => delta[i] > 0);
      const victim = falling.find((i) =>
        previousRanks[i] < previousRanks[actor]
      );
      const at = step * interval + delay + run * inverseCurve(u);

      events.push({
        at,
        duration: Math.max(
          0.001,
          Math.min(0.23, interval * 0.4, T.design - at)
        ),
        after: after.slice(),
        delta,
        actor,
        falling,
        victim: victim === undefined ? falling[0] : victim,
      });
      previousRanks = after.slice();
    });
  }

  const M = {
    full: {
      title: 126,
      sub: 40,
      name: 52,
      value: 72,
      heroValue: 88,
      year: 140,
      caption: 44,
      metric: 236,
      chip: 40,
      bar: 112,
      category: 248,
      axis: 40,
      headerGap: 20,
      subtitleGap: 16,
      axisGap: 14,
      footerGap: 24,
      footerColumnGap: 40,
      rightRoom: 164,
      side: 64,
      edge: 32,
    },
    top: {
      title: short ? 64 : 82,
      sub: 32,
      name: short ? 38 : 46,
      value: short ? 44 : 58,
      heroValue: short ? 50 : 70,
      year: short ? 88 : 106,
      caption: short ? 32 : 36,
      metric: short ? 124 : 170,
      chip: 32,
      bar: short ? 48 : 74,
      category: short ? 214 : 226,
      axis: 32,
      headerGap: short ? 10 : 14,
      subtitleGap: 10,
      axisGap: short ? 8 : 12,
      footerGap: short ? 10 : 14,
      footerColumnGap: 28,
      rightRoom: short ? 138 : 154,
      side: 48,
      edge: short ? 24 : 32,
    },
    overlay: {
      title: short ? 62 : 80,
      sub: 32,
      name: short ? 38 : 46,
      value: short ? 44 : 58,
      heroValue: short ? 50 : 70,
      year: short ? 88 : 106,
      caption: short ? 32 : 36,
      metric: short ? 124 : 170,
      chip: 32,
      bar: short ? 48 : 74,
      category: short ? 214 : 226,
      axis: 32,
      headerGap: short ? 10 : 14,
      subtitleGap: 10,
      axisGap: short ? 8 : 12,
      footerGap: short ? 10 : 14,
      footerColumnGap: 28,
      rightRoom: short ? 138 : 154,
      side: 44,
      edge: short ? 24 : 32,
    },
  }[variant];

  if (!M) throw new Error("Unknown ranking-bars output variant.");

  const side = Math.max(M.side, safe.side);
  const top = full ? Math.max(230, safe.top) : Math.max(M.edge, safe.top);
  const bottom = full
    ? Math.max(300, safe.bottom)
    : Math.max(M.edge, safe.bottom);
  const contentWidth = W - 2 * side;

  $("ranking-background").style.background =
    `linear-gradient(165deg, ${V.backgroundTop}, ${V.backgroundBottom})`;
  $("ranking-noise").style.backgroundImage =
    CA.grainUrl(180, 0.32, 26);

  const measure = document.createElement("canvas").getContext("2d");
  function widthOf(text, size, weight = 700) {
    measure.font = `${weight} ${size}px "Inter Tight"`;
    return measure.measureText(String(text)).width;
  }

  function balancedLines(text, size) {
    const words = String(text).trim().split(/\s+/).filter(Boolean);
    if (words.length < 2) return [words[0] || ""];
    let best = [String(text)];
    let score = Infinity;

    for (let i = 1; i < words.length; i += 1) {
      const left = words.slice(0, i).join(" ");
      const right = words.slice(i).join(" ");
      const a = widthOf(left, size);
      const b = widthOf(right, size);
      const candidate = Math.max(a, b) + Math.abs(a - b) * 0.25;
      if (candidate < score) {
        score = candidate;
        best = [left, right];
      }
    }
    return best;
  }

  function wrappedLines(text, size, width) {
    const words = String(text).trim().split(/\s+/).filter(Boolean);
    const lines = [];
    let line = "";
    words.forEach((word) => {
      const next = line ? `${line} ${word}` : word;
      if (line && widthOf(next, size) > width) {
        lines.push(line);
        line = word;
      } else {
        line = next;
      }
    });
    if (line) lines.push(line);
    return lines.length ? lines : [""];
  }

  const header = $("ranking-header");
  header.style.cssText =
    `left:${side}px;top:${top}px;width:${contentWidth}px`;

  const title = $("ranking-title");
  title.style.cssText = `font-size:${M.title}px;color:${V.ink}`;
  const titleLines = full
    ? balancedLines(V.title, M.title)
    : [String(V.title).trim()];
  const titleSpans = titleLines.filter(Boolean).map((text) => {
    const line = make("div", "ranking-title-line", title);
    return make("span", "ranking-title-text", line, text);
  });

  if (!titleSpans.length) throw new Error("Ranking bars needs a title.");

  const titlePx = Math.min(...titleSpans.map((span) =>
    fit(span, contentWidth, full ? 64 : 40)
  ));
  title.style.fontSize = titlePx + "px";
  titleSpans.forEach((span) => {
    span.style.fontSize = titlePx + "px";
  });

  const subtitle = $("ranking-subtitle");
  subtitle.textContent = V.subtitle;
  subtitle.style.cssText =
    `font-size:${M.sub}px;color:${V.muted};width:${contentWidth}px;` +
    `margin-top:${M.subtitleGap}px`;
  const headerHeight = header.getBoundingClientRect().height;

  const measuredYearWidth = Math.max(
    ...data.map((point) => widthOf(point.year, M.year, 800))
  );
  const yearPx = Math.max(
    minimumText,
    Math.min(
      M.year,
      Math.floor(M.year * contentWidth * 0.4 / Math.max(1, measuredYearWidth))
    )
  );
  const yearWidth = Math.ceil(Math.max(
    ...data.map((point) => widthOf(point.year, yearPx, 800))
  )) + 8;
  const yearHeight = Math.ceil(yearPx * 1.12);
  const captionWidth = contentWidth - yearWidth - M.footerColumnGap;

  if (captionWidth < minimumText * 4) {
    throw new Error("Use a shorter year or a wider ranking-bars stage.");
  }

  const captionEntries = [{
    at: 0,
    lines: balancedLines(V.openingCaption, M.caption),
  }];
  events.filter((event) => event.delta[hero] < 0).forEach((event) => {
    captionEntries.push({
      at: event.at,
      lines: [
        names[hero],
        event.after[hero] === 0
          ? String(V.leadingCaption)
          : String(V.passingTemplate).replace(
            /\{name\}/g,
            names[event.victim] || ""
          ),
      ],
    });
  });
  captionEntries.sort((a, b) => a.at - b.at);

  const widestCaption = Math.max(
    1,
    ...captionEntries.flatMap((entry) =>
      entry.lines.map((text) => widthOf(text, M.caption))
    )
  );
  const captionPx = Math.max(
    minimumText,
    Math.min(M.caption, Math.floor(M.caption * captionWidth / widestCaption))
  );
  const captionHeight = Math.ceil(captionPx * 2.4);

  const result = make("div", "ranking-result", $("ranking-clip"));
  result.style.cssText =
    `left:${side}px;width:${captionWidth}px;visibility:hidden;color:${V.ink}`;

  const resultLabel = make("div", "ranking-result-label", result);
  resultLabel.style.fontSize = M.caption + "px";
  wrappedLines(V.finalCaption, M.caption, captionWidth).forEach((text) => {
    const line = make("div", "ranking-result-label-line", resultLabel);
    const span = make("span", "ranking-result-label-text", line, text);
    fit(span, captionWidth, minimumText);
  });

  const resultNumberLine = make("div", "ranking-result-number-line", result);
  const resultNumber = make(
    "span",
    "ranking-result-number",
    resultNumberLine,
    format(finalPoint.values[hero])
  );
  resultNumber.style.fontSize = M.metric + "px";

  const resultUnit = make(
    "span",
    "ranking-result-unit",
    resultNumberLine,
    String(V.units)
  );
  resultUnit.style.cssText =
    `font-size:${minimumText}px;color:${V.muted}`;
  fit(resultUnit, Math.max(minimumText * 2, captionWidth * 0.28), minimumText);

  fit(
    resultNumber,
    captionWidth - resultUnit.getBoundingClientRect().width - 12,
    minimumText
  );

  const resultHeight = Math.ceil(result.getBoundingClientRect().height);
  const footerHeight = Math.max(yearHeight, captionHeight, resultHeight);
  const footerTop = H - bottom - footerHeight;
  result.style.top = footerTop + footerHeight - resultHeight + "px";

  const chartX = side + M.category + 18;
  const chartWidth = W - side - M.rightRoom - chartX;
  const axisTop = top + headerHeight + M.headerGap;
  const chartTop = axisTop + M.axis * 1.15 + M.axisGap;
  const chartBottom = footerTop - M.footerGap;
  const pitch = (chartBottom - chartTop) / 6;

  if (chartWidth <= 100 || pitch < minimumText * 1.4) {
    throw new Error(
      "Ranking bars needs more stage height or shorter title and captions."
    );
  }

  const barHeight = Math.min(M.bar, pitch * 0.82);
  const namePx = Math.max(minimumText, Math.min(M.name, barHeight * 0.78));
  const valuePx = Math.max(minimumText, Math.min(M.value, barHeight * 0.85));
  const heroValuePx = Math.max(
    minimumText,
    Math.min(M.heroValue, barHeight * 0.94)
  );

  const grid = $("ranking-grid");
  grid.style.cssText =
    `left:${chartX}px;top:${chartTop}px;width:${chartWidth}px;` +
    `height:${pitch * 6}px`;
  for (let i = 0; i <= 10; i += 1) {
    const line = make("div", "ranking-gridline", grid);
    line.style.cssText = `left:${i * 10}%;background:${V.gridColor}`;
  }

  const axis = $("ranking-axis");
  axis.style.cssText =
    `left:0;top:${axisTop}px;width:${W}px;height:${M.axis * 1.15}px`;
  [0, 0.5, 1].forEach((fraction) => {
    const label = make(
      "span",
      "ranking-axis-label",
      axis,
      format(maximum * fraction)
    );
    label.style.cssText =
      `left:${chartX + chartWidth * fraction}px;` +
      `font-size:${M.axis}px;color:${V.muted}`;
    fit(label, chartWidth * 0.42, minimumText);
    gsap.set(label, { xPercent: fraction === 0 ? 0 : -50 });
  });

  const unit = make("span", "ranking-unit", axis, V.units);
  unit.style.cssText =
    `right:${side}px;font-size:${M.axis}px;color:${V.muted}`;
  fit(unit, M.rightRoom - 20, minimumText);

  const year = $("ranking-year");
  year.style.cssText =
    `right:${side}px;top:${footerTop + footerHeight - yearHeight}px;` +
    `width:${yearWidth}px;height:${yearHeight}px;` +
    `font-size:${yearPx}px;color:${V.yearColor}`;
  const yearText = make("span", "ranking-year-text", year, data[0].year);

  const caption = $("ranking-caption");
  caption.style.cssText =
    `left:${side}px;top:${footerTop + footerHeight - captionHeight}px;` +
    `width:${captionWidth}px;height:${captionHeight}px;` +
    `font-size:${captionPx}px;color:${V.muted}`;
  const captionSpans = [0, 1].map((index) => {
    const line = make("div", "ranking-caption-line", caption);
    return make(
      "span",
      "ranking-caption-text",
      line,
      captionEntries[0].lines[index] || ""
    );
  });

  const rows = names.map((name, index) => {
    const row = make("div", "ranking-row", $("ranking-rows"));
    row.style.height = barHeight + "px";

    const label = make("span", "ranking-name", row, name);
    label.style.cssText =
      `left:${side}px;font-size:${namePx}px;` +
      `font-weight:${index === hero ? 800 : 700};` +
      `color:${index === hero ? V.ink : V.nameInk}`;
    const actualNamePx = fit(label, M.category, minimumText);
    label.style.top = (barHeight - actualNamePx * 1.12) / 2 + "px";

    const bar = make("div", "ranking-bar", row);
    bar.style.cssText =
      `left:${chartX}px;width:${chartWidth}px;` +
      `height:${barHeight}px;background:${colors[index]}`;

    let sweep = null;
    if (index === hero) {
      sweep = make("div", "ranking-sweep", bar);
      sweep.style.cssText =
        `width:${chartWidth * 0.12}px;background:${V.chipGround};` +
        `opacity:0.16;visibility:hidden`;
    }

    const largestValue = Math.max(
      ...data.map((point) => point.values[index])
    );
    const value = make("span", "ranking-value", row, format(largestValue));
    value.style.cssText =
      `font-size:${index === hero ? heroValuePx : valuePx}px;` +
      `color:${index === hero ? V.ink : V.nameInk};` +
      `font-weight:${index === hero ? 800 : 700}`;
    const actualValuePx = fit(value, M.rightRoom - 16, minimumText);
    const valueWidth = value.getBoundingClientRect().width;
    value.style.top = (barHeight - actualValuePx * 1.12) / 2 + "px";
    value.textContent = format(data[0].values[index]);

    let chip = null;
    let chipWidth = 0;
    if (index === hero) {
      chip = make("div", "ranking-chip", row);
      const chipHeight = Math.max(
        M.chip + 4,
        Math.min(barHeight - 8, M.chip * 1.35)
      );
      chipWidth = Math.ceil(Math.max(
        chipHeight * 1.4,
        widthOf(V.firstPlaceChip, M.chip, 800) + 18
      ));
      chip.style.cssText =
        `top:${(barHeight - chipHeight) / 2}px;` +
        `width:${chipWidth}px;height:${chipHeight}px;` +
        `font-size:${M.chip}px;color:${V.ink};background:${V.chipGround}`;
      const text = make("span", "ranking-chip-text", chip, V.firstPlaceChip);
      fit(text, chipWidth - 16, minimumText);
    }

    const y = chartTop + initialRanks[index] * pitch +
      (pitch - barHeight) / 2;
    const tip = chartX + chartWidth * data[0].values[index] / maximum;
    gsap.set(row, { y, zIndex: index === hero ? 30 : 10 });
    gsap.set(bar, {
      scaleX: data[0].values[index] / maximum,
      scaleY: 1,
    });
    gsap.set(value, { x: tip + 12 });

    if (chip) {
      gsap.set(chip, {
        x: tip - chipWidth - 10,
        scaleX: initialRanks[hero] === 0 ? 1 : 0,
        scaleY: initialRanks[hero] === 0 ? 1 : 0,
        visibility: initialRanks[hero] === 0 ? "visible" : "hidden",
      });
    }

    return {
      row,
      label,
      bar,
      value,
      chip,
      sweep,
      chipWidth,
      y,
      nameHeight: actualNamePx * 1.12,
      valueHeight: actualValuePx * 1.12,
      valueWidth,
    };
  });

  const tl = gsap.timeline({ paused: true });
  const build = gsap.timeline();
  const buildClock = { value: 0 };
  build.to(buildClock, {
    value: 1,
    duration: T.design,
    ease: "none",
  }, 0);
  build.timeScale(1 / T.scale);
  tl.add(build, 0);

  let cachedTime = NaN;
  let cachedState = null;

  function state() {
    const realTime = tl.time();
    if (realTime === cachedTime && cachedState) return cachedState;

    const d = clamp(realTime / T.scale, 0, T.design);
    const finished = realTime >= T.key - 1e-7;
    const step = Math.min(data.length - 2, Math.floor(d / interval));
    const u = valueCurve((d - step * interval - delay) / run);
    const values = data[step].values.map((value, i) =>
      finished
        ? finalPoint.values[i]
        : value + (data[step + 1].values[i] - value) * u
    );

    let positions = initialRanks.slice();
    const lift = Array(6).fill(0);
    const dim = Array(6).fill(0);
    let heroRank = initialRanks[hero];
    let leadingSince = heroRank === 0 ? -100 : Infinity;

    events.forEach((event) => {
      if (d < event.at) return;
      const q = clamp((d - event.at) / event.duration);
      const response = spring(q);
      event.delta.forEach((delta, i) => {
        positions[i] += delta * response;
      });

      if (!finished && q < 1 && event.actor !== undefined) {
        const pulse = Math.sin(Math.PI * q);
        lift[event.actor] = Math.max(lift[event.actor], pulse);
        event.falling.forEach((i) => {
          dim[i] = Math.max(dim[i], pulse);
        });
      }
      if (event.after[hero] === 0 && heroRank !== 0) {
        leadingSince = event.at;
      }
      heroRank = event.after[hero];
    });

    if (finished) {
      positions = finalRanks.slice();
      heroRank = finalRanks[hero];
    }

    const y = positions.map((rank) =>
      chartTop + rank * pitch + (pitch - barHeight) / 2
    );
    const priority = lift.map((amount, i) =>
      10 + Math.round(amount * 1000) + (i === hero ? 20 : 0) + (6 - i)
    );
    const nameVisible = Array(6).fill(true);
    const valueVisible = Array(6).fill(true);
    const valueX = values.map((value) =>
      chartX + chartWidth * value / maximum + 12
    );

    for (let i = 0; i < 6; i += 1) {
      for (let j = i + 1; j < 6; j += 1) {
        const distance = Math.abs(y[i] - y[j]);
        const loser = priority[i] >= priority[j] ? j : i;
        const nameDistance =
          (rows[i].nameHeight + rows[j].nameHeight) / 2 + 4;
        const valueDistance =
          (rows[i].valueHeight + rows[j].valueHeight) / 2 + 4;

        if (distance < nameDistance) nameVisible[loser] = false;

        const valuesOverlap =
          valueX[i] < valueX[j] + rows[j].valueWidth + 4 &&
          valueX[j] < valueX[i] + rows[i].valueWidth + 4;
        if (distance < valueDistance && valuesOverlap) {
          valueVisible[loser] = false;
        }

        const winner = loser === i ? j : i;
        const winnerTip = chartX + chartWidth * values[winner] / maximum;
        const barTextDistance =
          (barHeight * 1.12 + rows[loser].valueHeight) / 2 + 3;
        if (
          distance < barTextDistance &&
          valueX[loser] < winnerTip &&
          valueX[loser] + rows[loser].valueWidth > chartX
        ) {
          valueVisible[loser] = false;
        }
      }
    }

    let chipScale = 0;
    if (heroRank === 0) {
      chipScale = finished || leadingSince < 0
        ? 1
        : back(
          (d - leadingSince) /
          Math.min(0.24, Math.max(0.001, T.design - leadingSince))
        );
    }

    let captionIndex = 0;
    for (let i = 1; i < captionEntries.length; i += 1) {
      if (d >= captionEntries[i].at - 1e-7) captionIndex = i;
    }

    // A year lands at its data boundary. The final year is reserved
    // for the exact key frame instead of appearing halfway there.
    const yearIndex = finished ? data.length - 1 : step;
    const boundaryAge = d - step * interval;
    const yearCompression = finished || step === 0
      ? 1
      : 1 - 0.1 * Math.sin(
        Math.PI * clamp(boundaryAge / Math.min(0.12, interval * 0.2))
      );

    cachedTime = realTime;
    cachedState = {
      realTime,
      finished,
      values,
      y,
      lift,
      dim,
      priority,
      nameVisible,
      valueVisible,
      valueX,
      chipScale,
      captionIndex,
      year: data[yearIndex].year,
      yearCompression,
    };
    return cachedState;
  }

  // Modifiers also run when motion-blur seeks suppress events.
  function drive(target, property, start, end, compute) {
    tl.fromTo(target, { [property]: start }, {
      [property]: end,
      duration: T.duration,
      ease: "none",
      immediateRender: false,
      modifiers: { [property]: () => compute(state()) },
    }, 0);
  }

  rows.forEach((item, index) => {
    drive(item.row, "y", item.y, item.y + 1,
      (s) => s.y[index] + "px");
    drive(item.row, "zIndex", 10, 11,
      (s) => s.priority[index]);
    drive(item.bar, "scaleX", data[0].values[index] / maximum, 1,
      (s) => s.values[index] / maximum);
    drive(item.bar, "opacity", 1, 0.99,
      (s) => 1 - 0.18 * s.dim[index]);

    drive(item.bar, "scaleY", 1, 1.001, (s) => {
      if (index !== hero || !s.finished) {
        return 1 + 0.12 * s.lift[index];
      }
      const age = Math.max(0, s.realTime - T.key);
      const reaction = 0.1 * Math.sin(Math.PI * clamp(age / 0.32));
      const breathe = 0.025 * (1 - Math.cos(age * Math.PI * 2 / 2.4));
      return 1.06 + reaction + breathe;
    });

    drive(
      item.value,
      "x",
      chartX + chartWidth * data[0].values[index] / maximum + 12,
      chartX + 1,
      (s) => s.valueX[index] + "px"
    );
    drive(item.value, "textContent", format(data[0].values[index]), "1",
      (s) => format(s.values[index]));
    drive(item.label, "visibility", "visible", "visible",
      (s) => s.nameVisible[index] ? "visible" : "hidden");
    drive(item.value, "visibility", "visible", "visible",
      (s) => s.valueVisible[index] ? "visible" : "hidden");

    if (item.sweep) {
      drive(item.sweep, "visibility", "hidden", "visible",
        (s) => s.finished ? "visible" : "hidden");
      drive(item.sweep, "x", -chartWidth, chartWidth, (s) => {
        const age = Math.max(0, s.realTime - T.key);
        const progress = (age % 1.7) / 1.7;
        return (-0.14 + progress * 1.28) * chartWidth + "px";
      });
    }

    if (item.chip) {
      drive(item.chip, "x", 0, 1, (s) =>
        chartX + Math.max(
          item.chipWidth + 14,
          chartWidth * s.values[index] / maximum
        ) - item.chipWidth - 10 + "px"
      );
      drive(item.chip, "visibility", "hidden", "visible",
        (s) => s.chipScale > 0.001 &&
          s.nameVisible[index] &&
          s.valueVisible[index] ? "visible" : "hidden");

      ["scaleX", "scaleY"].forEach((property) => {
        drive(
          item.chip,
          property,
          initialRanks[hero] === 0 ? 1 : 0,
          1,
          (s) => {
            const age = s.realTime - T.key;
            const reaction = age >= 0 && age <= 0.32
              ? 0.16 * Math.sin(Math.PI * age / 0.32)
              : 0;
            return s.chipScale * (1 + reaction);
          }
        );
      });
    }
  });

  drive(yearText, "textContent", data[0].year, finalPoint.year,
    (s) => s.year);
  drive(yearText, "scaleY", 1, 0.999,
    (s) => s.yearCompression);
  drive(year, "color", V.yearColor, V.ink,
    (s) => s.finished ? V.ink : V.yearColor);

  captionSpans.forEach((span, index) => {
    drive(span, "textContent", captionEntries[0].lines[index] || "", "",
      (s) => captionEntries[s.captionIndex].lines[index] || "");
  });
  drive(caption, "visibility", "visible", "hidden",
    (s) => s.finished ? "hidden" : "visible");
  drive(result, "visibility", "hidden", "visible",
    (s) => s.finished ? "visible" : "hidden");

  const closed = "inset(0% 100% 0% 0%)";
  const open = "inset(0% 0% 0% 0%)";

  if (variant === "overlay") {
    tl.fromTo(stageEl, { clipPath: closed }, {
      clipPath: open,
      duration: Math.min(0.22, T.key * 0.16),
      ease: "power3.out",
    }, 0);
  }

  if (T.exit > 0) {
    tl.fromTo(stageEl, { clipPath: open }, {
      clipPath: "inset(0% 0% 0% 100%)",
      duration: Math.max(0, T.exit - 1 / CA.fps),
      ease: "power3.in",
      immediateRender: false,
    }, T.key + T.hold);
  }

  window.__timelines["block"] = tl;
});