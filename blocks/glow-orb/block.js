CA.ready(() => {
  const {
    vars: V, stage: S, safe, time: T, variant,
    make, fit, rgba, grainUrl, seeded,
  } = CA;

  const $ = (id) => document.getElementById(id);
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const number = (value, fallback, lo, hi) => {
    const n = Number(value);
    return clamp(Number.isFinite(n) ? n : fallback, lo, hi);
  };
  const mix = (a, b, p) => a + (b - a) * p;
  const tau = Math.PI * 2;

  const smooth = (value) => {
    const p = clamp(value, 0, 1);
    return p * p * (3 - 2 * p);
  };

  const smoother = (value) => {
    const p = clamp(value, 0, 1);
    return p * p * p * (p * (p * 6 - 15) + 10);
  };

  const stageEl = $("stage");
  const W = S.w;
  const H = S.h;
  const full = variant === "full";
  const minText = full ? 40 : 32;
  const D = T.design;
  const K = T.key;
  const hold = Math.max(0, T.hold);
  const tail = Math.max(0, T.duration - K);

  const overshoot = number(V.breathOvershoot, 10, 5, 22) / 100;
  const breath = number(V.breathAmount, 2.5, 1, 3) / 100;
  const period = number(V.breathPeriod, 3, 2, 5);
  const initialScale = number(V.initialOrbScale, 0.88, 0.5, 0.94);
  const wordPulse = number(V.wordPulse, 1.6, 0, 6) / 100;
  const keyGap = number(V.keyRingGap, 8, 3, 20) / 100;
  const peak = 1 + overshoot;
  const rimPeak = peak + keyGap;
  const haloPeak = 1 + overshoot * 1.15;
  const orbit = number(V.orbitScale, 1.3, 1.3, 2.2);
  const flattening = number(V.orbitFlattening, 12, 0, 20) / 100;
  const orbitTurn = number(V.orbitTurn, -14, -30, 30);
  const releaseRun = number(V.ringReleaseDuration, 0.52, 0.3, 1.2);
  const haloSize = number(V.haloScale, 2.35, 1.8, 2.8);
  const hotspot = number(V.hotspotSize, 10, 4, 18);
  const rimWidth = number(V.rimWidth, 2, 1, 4);
  const keyRimWidth = Math.max(
    rimWidth,
    number(V.keyRimWidth, 8, 2, 12),
  );
  const strokeWidth = number(V.outlineWidth, 2.25, 0.75, 3);
  const grainAmount = number(V.grainAmount, 0.055, 0.02, 0.1);
  const push = number(V.parallaxPush, 12, 4, 20) / 100;
  const seed = Math.round(number(V.seed, 7, 1, 9999));
  const random = seeded(seed);
  const count = Math.round(number(V.outlineCircleCount, 7, 0, 12));
  const tracking = number(V.tracking, -0.03, -0.05, 0.02);

  const layouts = {
    full: {
      type: 1,
      typeHeight: 0.065,
      orbY: 0.42,
      side: 54,
      gap: 46,
      edge: 12,
      ringEdge: 20,
      circleSize: 1,
    },
    top: {
      type: 0.79,
      typeHeight: 0.15,
      orbY: 0.4,
      side: 40,
      gap: 28,
      edge: 8,
      ringEdge: 12,
      circleSize: 0.72,
    },
    overlay: {
      type: 0.76,
      typeHeight: 0.15,
      orbY: 0.4,
      side: 42,
      gap: 26,
      edge: 8,
      ringEdge: 12,
      circleSize: 0.68,
    },
  };
  const L = layouts[variant] || layouts.full;

  stageEl.style.background = V.ground;

  const side = Math.max(safe.side, L.side);
  const topSafe = Math.max(safe.top, full ? 230 : 28);
  const bottomSafe = Math.max(safe.bottom, full ? H * 0.2 : 28);
  const contentBottom = H - bottomSafe;
  const availableWidth = Math.max(1, W - side * 2);

  const line = $("go-line");
  const statement = String(V.line == null ? "" : V.line)
    .replace(/\s+/g, " ")
    .trim();
  const tokens = statement ? statement.split(" ") : [];

  line.setAttribute("aria-label", statement);
  line.style.color = V.ink;
  line.style.letterSpacing = tracking + "em";
  line.style.fontSize = Math.max(
    minText,
    Math.min(
      number(V.typeSize, 144, 40, 160) * L.type,
      H * L.typeHeight,
    ),
  ) + "px";

  // One line in every output. The closing pair is one reveal element,
  // so an isolated "for" cannot be left on screen during a seek.
  const beats = [];
  const finalPhraseStart = Math.max(0, tokens.length - 2);
  const rowEl = make("div", "go-row", line);
  let accent = null;
  let tokenIndex = 0;

  while (tokenIndex < tokens.length) {
    const final = tokenIndex === finalPhraseStart;
    const phrase = final
      ? tokens.slice(tokenIndex)
      : [tokens[tokenIndex]];

    if (beats.length) {
      rowEl.appendChild(document.createTextNode(" "));
    }

    const el = make("span", "go-word", rowEl);

    if (final) {
      if (phrase.length > 1) {
        el.appendChild(document.createTextNode(
          phrase.slice(0, -1).join(" ") + " ",
        ));
      }
      accent = make("span", "", el, phrase[phrase.length - 1]);
    } else {
      el.textContent = phrase[0];
    }

    beats.push({ el, final, offset: 0 });
    tokenIndex += phrase.length;
  }

  fit(line, availableWidth, minText);

  const fittedSize = parseFloat(getComputedStyle(line).fontSize);
  const wordTravel = Math.min(28, fittedSize * 0.24);
  const captionHeight = Math.ceil(line.offsetHeight);
  const captionTop = Math.max(
    topSafe,
    contentBottom - captionHeight - wordTravel - L.edge,
  );
  $("go-caption").style.top = captionTop + "px";

  const rowRect = rowEl.getBoundingClientRect();

  beats.forEach((item, i) => {
    const right = item.el.getBoundingClientRect().right - rowRect.left;
    item.offset = i === beats.length - 1
      ? 0
      : (rowRect.width - right) * 0.5;
  });

  // Bound the widest circular pose. Tipping the ring cannot enlarge
  // this envelope, so it remains clear of the caption in every output.
  const maxRingScale = Math.max(
    rimPeak,
    orbit + Math.abs(orbit - rimPeak) * 0.08,
  ) + breath * 0.9 + 0.04;
  const outerFactor = Math.max(
    maxRingScale,
    peak * (1 + wordPulse),
  ) * 0.5;
  const bodyFactor = peak * (1 + wordPulse) * 0.5;
  const bottomLimit = captionTop - L.gap - L.edge;

  const bodyHeightRoom =
    (bottomLimit - topSafe - L.edge) /
    (outerFactor + bodyFactor);
  const ringHeightRoom =
    (bottomLimit - L.ringEdge) / (outerFactor * 2);
  const widthRoom =
    (W - L.ringEdge * 2) / (outerFactor * 2);

  const diameter = Math.max(
    1,
    Math.min(
      number(V.orbDiameter, 760, 320, 820),
      Math.max(1, bodyHeightRoom),
      Math.max(1, ringHeightRoom),
      Math.max(1, widthRoom),
    ),
  );

  const cx = W / 2;
  const outerRadius = diameter * outerFactor;
  const minCy = Math.max(
    topSafe + L.edge + diameter * bodyFactor,
    L.ringEdge + outerRadius,
  );
  const maxCy = bottomLimit - outerRadius;
  const cy = maxCy >= minCy
    ? clamp(H * L.orbY, minCy, maxCy)
    : minCy;

  const core = $("go-core");
  const body = $("go-body");
  const rim = $("go-rim");
  const halo = $("go-halo");
  const haloRadius = diameter * haloSize * 0.5;

  Object.assign(core.style, {
    left: cx - diameter / 2 + "px",
    top: cy - diameter / 2 + "px",
    width: diameter + "px",
    height: diameter + "px",
  });

  halo.style.setProperty("--go-center-x", cx + "px");
  halo.style.setProperty("--go-center-y", cy + "px");
  halo.style.setProperty(
    "--go-halo-radius",
    haloRadius * initialScale + "px",
  );

  $("go-halo-light").style.background =
    `radial-gradient(circle var(--go-halo-radius) ` +
    `at var(--go-center-x) var(--go-center-y), ` +
    `${rgba(V.haloRose, 0.95)} 0%, ` +
    `${rgba(V.haloRose, 0.82)} 40%, ` +
    `${rgba(V.haloEdge, 0.82)} 70%, ` +
    `${rgba(V.haloEdge, 0.3)} 86%, ` +
    `${rgba(V.haloEdge, 0)} 100%)`;

  body.style.setProperty("--go-light-x", "38%");
  body.style.setProperty("--go-light-y", "33%");

  // A small highlight blends continuously into a shaded pink body.
  // There is no broad flat-white plateau, including at the key crest.
  body.style.background =
    `radial-gradient(circle ` +
    `at var(--go-light-x) var(--go-light-y), ` +
    `${V.orbWhite} 0%, ` +
    `${rgba(V.orbWhite, 0.94)} ${hotspot}%, ` +
    `${rgba(V.orbWhite, 0.68)} ${hotspot + 22}%, ` +
    `${rgba(V.orbWhite, 0.2)} ${hotspot + 48}%, ` +
    `${rgba(V.orbWhite, 0)} ${hotspot + 68}%), ` +
    `radial-gradient(circle at 50% 40%, ` +
    `${V.orbPink} 0%, ${V.orbPink} 62%, ${V.haloRose} 150%)`;

  body.style.boxShadow =
    `0 0 ${diameter * 0.055}px ${rgba(V.orbPink, 0.42)}, ` +
    `0 0 ${diameter * 0.16}px ${rgba(V.orbPink, 0.12)}`;

  rim.style.borderColor = rgba(V.ink, 0.88);
  rim.style.borderWidth = rimWidth / initialScale + "px";

  $("go-halo-grain").style.backgroundImage = grainUrl(192, 1, seed);
  $("go-halo-grain").style.opacity = String(grainAmount);
  $("go-body-grain").style.backgroundImage = grainUrl(192, 1, seed + 31);
  $("go-body-grain").style.opacity = String(grainAmount * 0.55);

  const anchors = [
    { x: -0.045, y: 0.27, r: 0.18, depth: 0.95 },
    { x: 0.97, y: 0.15, r: 0.17, depth: 0.85 },
    { x: 0.17, y: 0.08, r: 0.065, depth: 0.28 },
    { x: 0.75, y: 0.055, r: 0.055, depth: 0.18 },
    { x: 1.06, y: 0.49, r: 0.13, depth: 0.64 },
    { x: 0.04, y: 0.68, r: 0.09, depth: 0.52 },
    { x: 0.88, y: 0.71, r: 0.047, depth: 0.3 },
  ];

  const circles = Array.from({ length: count }, (_, i) => {
    const anchor = anchors[i % anchors.length];
    const extra = i >= anchors.length;
    const radius = W * anchor.r * L.circleSize *
      (0.96 + random() * 0.08) * (extra ? 0.65 : 1);
    const x = W * (
      anchor.x + (extra ? (random() - 0.5) * 0.055 : 0)
    );
    const proposedY = H * (
      anchor.y + (extra ? (random() - 0.5) * 0.045 : 0)
    );
    const y = Math.min(
      proposedY,
      captionTop - L.gap - radius * 1.2,
    );
    const depth = anchor.depth * (extra ? 0.7 : 1);
    const el = make("div", "go-circle", $("go-circles"));

    Object.assign(el.style, {
      left: x - radius + "px",
      top: y - radius + "px",
      width: radius * 2 + "px",
      height: radius * 2 + "px",
      borderWidth: strokeWidth * (0.8 + depth * 0.55) + "px",
      borderColor: rgba(V.ink, 0.14 + depth * 0.24),
    });

    return {
      el,
      depth,
      dx: (cx - x) * push * depth,
      dy: (cy - y) * push * depth,
      scale: 1 + push * depth * 0.55,
    };
  });

  const beatEls = beats.map((item) => item.el);
  gsap.set(core, { scaleX: 1, scaleY: 1 });
  gsap.set([body, rim], {
    scaleX: initialScale,
    scaleY: initialScale,
  });
  gsap.set(rim, { rotation: 0, x: 0, y: 0 });

  if (beatEls.length) {
    gsap.set(beatEls, {
      autoAlpha: 0,
      x: 0,
      y: wordTravel,
      scaleX: 1,
      scaleY: 1,
      color: V.ink,
    });
  }
  if (accent) {
    gsap.set(accent, { color: V.ink });
  }

  const tl = gsap.timeline({ paused: true });
  const build = gsap.timeline();

  const windDuration = Math.min(0.16, D * 0.08);
  const attack = Math.min(
    number(V.keyAttackDuration, 0.28, 0.1, 0.4),
    D * 0.2,
  );
  const gatherDuration = Math.min(0.34, D * 0.16);
  const releaseAt = D - attack;
  const gatherAt = releaseAt - gatherDuration;
  const warmAt = D * 0.36;
  const woundScale = initialScale * (1 - breath * 0.9);
  const gatheredScale = 1 - breath * 0.9;

  const poses = [
    {
      at: 0,
      duration: windDuration,
      body: woundScale,
      rim: woundScale,
      light: initialScale * (1 - breath * 0.35),
      stroke: rimWidth,
      ease: "sine.inOut",
    },
    {
      at: windDuration,
      duration: warmAt - windDuration,
      body: 1,
      rim: 1,
      light: 1,
      stroke: rimWidth,
      ease: "back.out(1.4)",
    },
    {
      at: warmAt,
      duration: gatherAt - warmAt,
      body: 1 + breath * 0.5,
      rim: 1 + breath * 0.5,
      light: 1 + breath * 0.7,
      stroke: rimWidth,
      ease: "sine.inOut",
    },
    {
      at: gatherAt,
      duration: gatherDuration,
      body: gatheredScale,
      rim: gatheredScale,
      light: 1 - breath * 0.25,
      stroke: rimWidth,
      ease: "sine.inOut",
    },
    {
      at: releaseAt,
      duration: attack,
      body: peak,
      rim: rimPeak,
      light: haloPeak,
      stroke: keyRimWidth,
      ease: "power2.out",
    },
  ];

  poses.forEach((pose) => {
    build.to(body, {
      scaleX: pose.body,
      scaleY: pose.body,
      duration: pose.duration,
      ease: pose.ease,
    }, pose.at);

    build.to(rim, {
      scaleX: pose.rim,
      scaleY: pose.rim,
      borderWidth: pose.stroke / pose.rim,
      duration: pose.duration,
      ease: pose.ease,
    }, pose.at);

    build.to(halo, {
      "--go-halo-radius": haloRadius * pose.light + "px",
      duration: pose.duration,
      ease: pose.ease,
    }, pose.at);
  });

  const keyBrightness = 1 + overshoot * 0.18;
  build.to(body, {
    filter: `brightness(${keyBrightness})`,
    duration: attack,
    ease: "power2.out",
  }, releaseAt);

  const recoil = 0.28;

  circles.forEach(({ el, dx, dy, scale }) => {
    build.fromTo(el,
      { x: 0, y: 0, scaleX: 1, scaleY: 1 },
      {
        x: dx,
        y: dy,
        scaleX: scale,
        scaleY: scale,
        duration: releaseAt,
        ease: "power3.out",
      }, 0);

    // The same release that detaches the rim pushes the edge circles
    // back out. Their depth controls distance, size and stroke.
    build.to(el, {
      x: dx * recoil,
      y: dy * recoil,
      scaleX: 1 + (scale - 1) * recoil,
      scaleY: 1 + (scale - 1) * recoil,
      duration: attack,
      ease: "power2.out",
    }, releaseAt);
  });

  if (beats.length) {
    const rise = Math.min(
      number(V.wordRiseDuration, 0.26, 0.12, 0.4),
      D * 0.18,
    );
    const requestedStep =
      number(V.wordStaggerFrames, 22, 3, 24) /
      Math.max(1, CA.fps);
    const step = beats.length > 1
      ? Math.min(requestedStep, releaseAt / (beats.length - 1))
      : 0;
    const textStart =
      releaseAt - step * Math.max(0, beats.length - 1);

    beats.forEach((item, i) => {
      const at = item.final ? releaseAt : textStart + i * step;
      const duration = item.final ? attack : Math.min(rise, step);
      const earlier = beats.slice(0, i).map((entry) => entry.el);

      if (earlier.length) {
        build.to(earlier, {
          x: item.offset,
          duration,
          ease: "power3.out",
        }, at);
      }

      build.set(item.el, {
        autoAlpha: 1,
        x: item.offset,
      }, at);

      build.fromTo(item.el,
        {
          y: wordTravel,
          scaleX: item.final ? 1.025 : 1,
          scaleY: item.final ? 1.025 : 1,
        },
        {
          y: 0,
          scaleX: 1,
          scaleY: 1,
          duration,
          ease: "back.out(1.05)",
          immediateRender: false,
        }, at);

      if (!item.final && wordPulse > 0) {
        const pulseAt = at + duration * 0.62;
        const punch = Math.min(0.075, duration * 0.3);
        const recover = Math.min(
          0.18,
          Math.max(0, gatherAt - pulseAt),
          step * 0.45,
        );

        if (recover > 0.04) {
          build.to(core, {
            scaleX: 1 + wordPulse,
            scaleY: 1 + wordPulse,
            duration: punch,
            ease: "power2.out",
          }, pulseAt - punch);

          build.to(core, {
            scaleX: 1,
            scaleY: 1,
            duration: recover,
            ease: "sine.inOut",
          }, pulseAt);
        }
      }
    });

    // Pink is present from the closing phrase's first visible frame.
    // Phrase arrival, rim detachment and circle recoil start together;
    // the complete statement and breath crest land exactly at T.key.
    if (accent) {
      build.set(accent, { color: V.orbPink }, releaseAt);
    }
  }

  build.timeScale(1 / T.scale);
  tl.add(build, 0);

  const wave = (t) =>
    0.5 * (1 - Math.cos(tau * Math.max(0, t) / period));
  const settleRun = Math.min(0.5, period * 0.18);
  const lightLag = Math.min(0.12, period * 0.04);

  function bodyScaleAt(t) {
    const q = Math.max(0, t);
    return 1 +
      overshoot * (1 - smoother(q / settleRun)) +
      breath * wave(q);
  }

  function haloScaleAt(t) {
    const q = Math.max(0, t);
    return 1 +
      (haloPeak - 1) *
        (1 - smoother(q / (settleRun + lightLag))) +
      breath * 1.65 * wave(Math.max(0, q - lightLag));
  }

  const backOut = (p) => {
    const q = p - 1;
    const strength = 1.12;
    return 1 + (strength + 1) * q * q * q + strength * q * q;
  };

  function rimScaleAt(t) {
    const q = Math.max(0, t);
    return mix(rimPeak, orbit, backOut(smooth(q / releaseRun))) +
      breath * 0.9 * wave(q);
  }

  function rimStrokeAt(t) {
    const q = Math.max(0, t);
    return rimWidth +
      (keyRimWidth - rimWidth) *
        (1 - smoother(q / (settleRun * 0.75)));
  }

  function orbitEnvelope(t) {
    return smoother(Math.max(0, t) / releaseRun);
  }

  function tipEnvelope(t) {
    const q = Math.max(0, t);
    return 1 - Math.exp(-Math.pow(q / (releaseRun + 0.26), 2));
  }

  function rimYScaleAt(t) {
    return rimScaleAt(t) * (1 - flattening * tipEnvelope(t));
  }

  function parallaxAt(t) {
    const q = Math.max(0, t);
    const p = 1 - Math.exp(-Math.pow(q / (period * 0.25), 2));
    return mix(recoil, -0.08, p);
  }

  if (tail > 0) {
    // Modifiers are deterministic during arbitrary seeks and during
    // event-suppressed motion-blur sampling.
    const drive = (el, property, start, sample, unit = "") => {
      const raw = (value) => unit ? value + unit : value;

      tl.fromTo(el,
        { [property]: raw(start) },
        {
          [property]: raw(start + tail),
          duration: tail,
          ease: "none",
          autoRound: false,
          immediateRender: false,
          modifiers: {
            [property]: (value) => {
              const q = clamp(parseFloat(value) - start, 0, tail);
              const result = sample(q);
              return unit ? result + unit : result;
            },
          },
        }, K);
    };

    drive(body, "scaleX", peak, bodyScaleAt);
    drive(body, "scaleY", peak, bodyScaleAt);

    tl.fromTo(body,
      { filter: `brightness(${keyBrightness})` },
      {
        filter: "brightness(1)",
        duration: Math.min(settleRun, tail),
        ease: "sine.inOut",
        immediateRender: false,
      }, K);

    drive(body, "--go-light-x", 38, (q) =>
      38 + Math.sin(q * tau / (period * 1.35)) *
        2.5 * smoother(q / (settleRun * 0.5)),
    "%");

    drive(body, "--go-light-y", 33, (q) =>
      33 + wave(q) * 1.8,
    "%");

    drive(
      halo,
      "--go-halo-radius",
      haloRadius * haloPeak,
      (q) => haloRadius * haloScaleAt(q),
      "px",
    );

    drive(rim, "scaleX", rimPeak, rimScaleAt);
    drive(rim, "scaleY", rimPeak, rimYScaleAt);

    // The single released rim becomes a gently tipped orbit while
    // the body recovers. The held silhouette keeps developing.
    drive(rim, "rotation", 0, (q) =>
      orbitTurn * (
        tipEnvelope(q) +
        Math.sin(q * tau / (period * 1.5)) *
          0.08 * orbitEnvelope(q)
      ),
    );

    drive(
      rim,
      "borderWidth",
      keyRimWidth / rimPeak,
      (q) => rimStrokeAt(q) / Math.max(0.1, rimScaleAt(q)),
      "px",
    );

    drive(rim, "x", 0, (q) =>
      Math.sin(q * tau / (period * 1.5)) *
        diameter * 0.01 * orbitEnvelope(q),
    "px");

    drive(rim, "y", 0, (q) =>
      (Math.cos(q * tau / (period * 1.5)) - 1) *
        diameter * 0.006 * orbitEnvelope(q),
    "px");

    circles.forEach(({ el, dx, dy, scale, depth }) => {
      const driftPhase = (q) =>
        q * tau / (period * (1.6 - depth * 0.3));

      drive(el, "x", dx * recoil, (q) =>
        dx * parallaxAt(q) +
          Math.sin(driftPhase(q)) *
          W * 0.003 * depth * orbitEnvelope(q),
      "px");

      drive(el, "y", dy * recoil, (q) =>
        dy * parallaxAt(q) +
          (Math.cos(driftPhase(q)) - 1) *
          W * 0.002 * depth * orbitEnvelope(q),
      "px");

      const scaleAt = (q) =>
        1 + (scale - 1) * parallaxAt(q) +
          breath * depth * 0.12 * wave(q);

      drive(el, "scaleX", 1 + (scale - 1) * recoil, scaleAt);
      drive(el, "scaleY", 1 + (scale - 1) * recoil, scaleAt);
    });
  }

  const duration = Math.max(0.001, T.duration);

  tl.fromTo("#go-halo-grain",
    { backgroundPosition: "0px 0px" },
    {
      backgroundPosition: "37px -23px",
      duration,
      ease: "none",
    }, 0);

  tl.fromTo("#go-body-grain",
    { backgroundPosition: "0px 0px" },
    {
      backgroundPosition: "-19px 29px",
      duration,
      ease: "none",
    }, 0);

  const radius = Math.hypot(W, H);
  const closed = `circle(0px at ${cx}px ${cy}px)`;
  const open = `circle(${radius}px at ${cx}px ${cy}px)`;

  if (variant === "overlay") {
    tl.fromTo(stageEl,
      { clipPath: closed },
      {
        clipPath: open,
        duration: Math.min(0.2, K * 0.16),
        ease: "power3.out",
      }, 0);
  }

  if (T.exit > 0) {
    const exitStart = K + hold;
    const exitDuration = Math.max(0, T.exit - 1 / CA.fps);

    tl.fromTo(stageEl,
      { clipPath: open },
      {
        clipPath: closed,
        duration: exitDuration,
        ease: "power3.in",
        immediateRender: false,
      }, exitStart);

    tl.set(stageEl, { clipPath: closed }, exitStart + exitDuration);
  }

  window.__timelines["block"] = tl;
});