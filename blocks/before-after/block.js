CA.ready(() => {
  const {
    vars: V, stage: S, safe, time: T, variant,
    make, fit, rgba, grainUrl
  } = CA;

  const $ = (id) => document.getElementById(id);
  const stageEl = $("stage");
  const full = variant === "full";
  const overlay = variant === "overlay";
  const short = !full && S.h < 840;
  const minimum = full ? 40 : 32;
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const finite = (value, fallback) =>
    Number.isFinite(Number(value)) ? Number(value) : fallback;
  const put = (id, value) => {
    $(id).textContent = String(value ?? "");
  };
  const px = (key, value) => {
    stageEl.style.setProperty(key, `${value}px`);
  };

  stageEl.classList.toggle("ba-compact", !full);
  stageEl.classList.toggle("ba-overlay", overlay);
  stageEl.classList.toggle("ba-short", short);
  stageEl.setAttribute(
    "aria-label",
    `${V.businessType || ""}. ${V.changeDescription || ""}`
  );

  const M = full
    ? {
        side: 28,
        top: Math.max(230, safe.top),
        bottom: Math.max(300, safe.bottom),
        headline: 104,
        headlineGap: 10,
        bar: 56,
        pad: 24,
        label: 50,
        labelType: 40,
        header: 100,
        cardH: 108,
        gap: 20,
        heroGap: 28,
        copyGap: 28,
        cardGap: 12,
        cardPad: 14,
        cardInnerGap: 18,
        cardPictureW: 78,
        cardPictureH: 52,
        body: 40,
        price: 44,
        name: 58,
        heading: 90,
        handle: 92
      }
    : overlay
      ? {
          side: 20,
          top: short ? 10 : 12,
          bottom: 12,
          headline: short ? 46 : 58,
          headlineGap: 8,
          bar: 40,
          pad: short ? 16 : 18,
          label: 40,
          labelType: 32,
          header: short ? 68 : 78,
          cardH: short ? 70 : 80,
          gap: short ? 12 : 14,
          heroGap: short ? 16 : 22,
          copyGap: short ? 14 : 20,
          cardGap: short ? 8 : 10,
          cardPad: short ? 10 : 12,
          cardInnerGap: short ? 12 : 16,
          cardPictureW: short ? 56 : 64,
          cardPictureH: short ? 36 : 42,
          body: short ? 32 : 34,
          price: short ? 32 : 36,
          name: short ? 42 : 46,
          heading: short ? 60 : 72,
          handle: short ? 60 : 70
        }
      : {
          side: 24,
          top: short ? 10 : 16,
          bottom: short ? 12 : 16,
          headline: short ? 46 : 62,
          headlineGap: short ? 8 : 10,
          bar: short ? 40 : 44,
          pad: short ? 16 : 20,
          label: short ? 40 : 44,
          labelType: 32,
          header: short ? 70 : 84,
          cardH: short ? 70 : 82,
          gap: short ? 12 : 16,
          heroGap: short ? 18 : 24,
          copyGap: short ? 14 : 22,
          cardGap: short ? 8 : 10,
          cardPad: short ? 10 : 12,
          cardInnerGap: short ? 12 : 16,
          cardPictureW: short ? 56 : 64,
          cardPictureH: short ? 36 : 42,
          body: short ? 32 : 36,
          price: short ? 32 : 36,
          name: short ? 42 : 48,
          heading: short ? 60 : 76,
          handle: short ? 60 : 72
        };

  M.menu = M.cardH * 3 + M.cardGap * 2;

  const productNameSize = full
    ? clamp(finite(V.productNameSize, 46), 40, 60)
    : clamp(
        finite(V.compactProductNameSize, 38),
        32,
        short ? 36 : 48
      );

  const start = clamp(finite(V.startSplit, 97.5), 85, 99) / 100;
  const overshoot = clamp(finite(V.overshoot, 3.5), 0, 6) / 100;
  const lift = clamp(finite(V.cardLift, 12), 0, 30);
  const push = clamp(finite(V.push, 3), 0, 4) / 100;
  const press = clamp(finite(V.handlePress, 14), 6, 22) / 100;
  const payoffPulse = clamp(finite(V.payoffPulse, 2.5), 1, 4) / 100;
  const steamTravel =
    clamp(finite(V.steamTravel, 52), 16, 72) * (full ? 1 : 0.8);

  const rule = rgba(V.ink, 0.22);
  const arrivalRule = rgba(V.accent, 0.72);

  Object.entries({
    "--ba-ink": V.ink,
    "--ba-accent": V.accent,
    "--ba-modern": V.modernPage,
    "--ba-old-page": V.oldPage,
    "--ba-old-top": V.oldBannerTop,
    "--ba-old-bottom": V.oldBannerBottom,
    "--ba-old-link": V.oldLink,
    "--ba-chrome": V.chrome,
    "--ba-paper": V.paper,
    "--ba-button-grey": V.buttonGrey,
    "--ba-bread": V.bread,
    "--ba-bread-dark": V.breadDark,
    "--ba-rule": rule
  }).forEach(([key, value]) => {
    stageEl.style.setProperty(key, value);
  });

  Object.entries({
    "--ba-bar": M.bar,
    "--ba-pad": M.pad,
    "--ba-label-h": M.label,
    "--ba-label-type": M.labelType,
    "--ba-header-h": M.header,
    "--ba-menu-h": M.menu,
    "--ba-gap": M.gap,
    "--ba-hero-gap": M.heroGap,
    "--ba-copy-gap": M.copyGap,
    "--ba-card-gap": M.cardGap,
    "--ba-card-pad": M.cardPad,
    "--ba-card-inner-gap": M.cardInnerGap,
    "--ba-card-picture-w": M.cardPictureW,
    "--ba-card-picture-h": M.cardPictureH,
    "--ba-product-name": productNameSize,
    "--ba-body": M.body,
    "--ba-price": M.price,
    "--ba-name": M.name,
    "--ba-heading": M.heading,
    "--ba-handle": M.handle
  }).forEach(([key, value]) => px(key, value));

  $("ba-backdrop").style.background =
    `linear-gradient(180deg, ${V.backgroundTop}, ${V.background} 48%, ${V.backgroundBottom})`;
  $("ba-dither").style.backgroundImage = grainUrl(160, 0.18, 31);

  const fields = {
    "ba-address": "address",
    "ba-before-chip": "beforeLabel",
    "ba-after-chip": "afterLabel",
    "ba-old-name": "oldName",
    "ba-old-subtitle": "sidebarLine1",
    "ba-old-heading-1": "oldHeading1",
    "ba-old-heading-2": "oldHeading2",
    "ba-old-button": "oldButton",
    "ba-new-name": "newName",
    "ba-new-subtitle": "newNav1",
    "ba-right-heading-1": "rightHeading1",
    "ba-right-heading-2": "rightHeading2",
    "ba-new-button": "newButton"
  };

  Object.entries(fields).forEach(([id, variable]) => put(id, V[variable]));

  function headline(id, value) {
    const el = $(id);
    el.replaceChildren();

    String(value ?? "").split(/(\.)/).forEach((part) => {
      if (part === ".") {
        make("span", "ba-stop", el, part);
      } else {
        el.appendChild(document.createTextNode(part));
      }
    });
  }

  headline("ba-headline-1", V.headline1);
  headline("ba-headline-2", V.headline2);

  // The same loaf, scoring and flour marks survive the makeover.
  const loaf = `
    <svg class="ba-loaf" viewBox="0 0 400 310"
      preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <g class="ba-loaf-motion">
        <ellipse class="ba-loaf-shadow" cx="202" cy="261" rx="158" ry="13"/>
        <path class="ba-crust" d="M44 208C33 131 101 60 197 58c96-2 163 62 161 132-1 45-51 64-150 64S51 244 44 208Z"/>
        <g class="ba-flour">
          <ellipse cx="105" cy="189" rx="4" ry="2"/>
          <ellipse cx="151" cy="217" rx="5" ry="2"/>
          <ellipse cx="227" cy="195" rx="4" ry="2"/>
          <ellipse cx="286" cy="220" rx="5" ry="2"/>
          <ellipse cx="321" cy="170" rx="3" ry="2"/>
          <ellipse cx="179" cy="183" rx="3" ry="2"/>
          <ellipse cx="250" cy="234" rx="3" ry="2"/>
        </g>
        <path class="ba-score" d="M116 97c-23 21-35 47-37 74m99-97c-25 25-39 54-41 87m103-83c-25 25-37 53-39 85m99-63c-24 22-35 48-38 76"
          fill="none" stroke-width="16" stroke-linecap="round"/>
      </g>
    </svg>`;

  const steam = `
    <svg class="ba-steam" viewBox="0 0 300 160"
      preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <path class="ba-steam-strand" d="M80 140c-35-43 30-55 0-111"
        fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>
      <path class="ba-steam-strand" d="M150 145c-35-43 30-55 0-111"
        fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>
      <path class="ba-steam-strand" d="M220 140c-35-43 30-55 0-111"
        fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>
    </svg>`;

  const productPictures = [
    `<svg viewBox="0 0 100 60" aria-hidden="true">
      <path fill="currentColor" d="M7 43C2 28 13 9 31 8l8 10c7-3 15-3 22 0L69 8c18 1 29 20 24 35L77 52 64 42c-9 5-19 5-28 0L23 52Z"/>
      <path d="m32 17 6 23m12-20v24m18-27-6 23M16 24l8 17m60-17-8 17"
        fill="none" stroke="var(--ba-bread-dark)" stroke-width="4" stroke-linecap="round"/>
    </svg>`,
    `<svg viewBox="0 0 100 60" aria-hidden="true">
      <ellipse cx="50" cy="33" rx="43" ry="25" fill="currentColor"/>
      <path d="M72 40c17-18-4-33-26-28-25 6-26 30-5 34 18 4 30-13 15-21-10-5-22 4-13 10"
        fill="none" stroke="var(--ba-bread-dark)" stroke-width="4" stroke-linecap="round"/>
    </svg>`,
    `<svg viewBox="0 0 100 60" aria-hidden="true">
      <path fill="currentColor" d="M5 43C4 21 24 7 49 7s45 15 46 34c1 12-15 15-45 15S7 54 5 43Z"/>
      <path d="m29 18-6 18m26-22-6 20m26-16-6 18"
        fill="none" stroke="var(--ba-bread-dark)" stroke-width="4" stroke-linecap="round"/>
    </svg>`
  ];

  $("ba-old-art").innerHTML = loaf;
  $("ba-new-art").innerHTML = loaf + steam;

  const oldRows = [];
  const cards = [];

  for (let i = 1; i <= 3; i += 1) {
    const oldRow = make("div", "ba-menu-row", $("ba-old-menu"));
    make("span", "ba-item-name", oldRow, V[`oldItem${i}`]);
    make("span", "ba-item-price", oldRow, V[`oldPrice${i}`]);
    oldRows.push(oldRow);

    const card = make("article", "ba-menu-row", $("ba-cards"));
    const picture = make("span", "ba-card-picture", card);
    picture.setAttribute("aria-hidden", "true");
    picture.innerHTML = productPictures[i - 1];
    make("span", "ba-item-name", card, V[`card${i}Name`]);
    make("span", "ba-item-price", card, V[`card${i}Price`]);
    cards.push(card);
  }

  // Browser edges can extend past the text margin. Page content cannot.
  const side = Math.max(M.side, safe.side - M.pad);
  const headlineSide = Math.max(M.side, safe.side);
  const browserW = S.w - 2 * side;
  const headlineW = S.w - 2 * headlineSide;

  Object.assign($("ba-headline").style, {
    top: `${M.top}px`,
    left: `${headlineSide}px`,
    width: `${headlineW}px`
  });

  $("ba-headline-lines").style.fontSize = `${M.headline}px`;
  fit($("ba-headline-lines"), headlineW, minimum);

  const headlineH = $("ba-headline").getBoundingClientRect().height;
  const browserY = M.top + headlineH + M.headlineGap;
  const browserH = S.h - M.bottom - browserY;

  Object.assign($("ba-browser").style, {
    left: `${side}px`,
    top: `${browserY}px`,
    width: `${browserW}px`,
    height: `${browserH}px`
  });

  $("ba-address").style.fontSize = `${M.body}px`;
  fit($("ba-address"), browserW - 196, minimum);

  const pageRoom = browserW - 2 * M.pad;

  ["ba-before-chip", "ba-after-chip"].forEach((id) => {
    fit($(id), pageRoom, minimum);
  });

  $("ba-old-name").style.fontSize = `${M.name}px`;
  fit($("ba-old-name"), pageRoom - 34, minimum);

  $("ba-new-name").style.fontSize = `${M.name}px`;
  fit($("ba-new-subtitle"), pageRoom * 0.38, minimum);

  const navW = $("ba-new-subtitle").getBoundingClientRect().width;
  fit($("ba-new-name"), pageRoom - navW - 24, minimum);

  const oldBanner = $("ba-old-banner");
  const oldBannerStyle = getComputedStyle(oldBanner);
  const oldHeaderRequired = Math.ceil(
    $("ba-old-subtitle").getBoundingClientRect().bottom -
    oldBanner.getBoundingClientRect().top +
    parseFloat(oldBannerStyle.paddingBottom) +
    parseFloat(oldBannerStyle.borderBottomWidth)
  );

  if (oldHeaderRequired > M.header) {
    oldBanner.parentElement.style.gridTemplateRows =
      `var(--ba-label-h) ${oldHeaderRequired}px minmax(0, 1fr) var(--ba-menu-h)`;
  }

  cards.forEach((card) => {
    const name = card.querySelector(".ba-item-name");
    const price = card.querySelector(".ba-item-price");
    const style = getComputedStyle(card);
    const room =
      card.getBoundingClientRect().width -
      parseFloat(style.paddingLeft) -
      parseFloat(style.paddingRight) -
      M.cardPictureW -
      price.getBoundingClientRect().width -
      M.cardInnerGap * 2 -
      4;

    name.style.fontSize = `${productNameSize}px`;
    fit(name, Math.max(minimum, room), minimum);
  });

  const cardRequired = Math.max(...cards.map((card) => {
    const style = getComputedStyle(card);
    const heights = Array.from(card.children).map(
      (child) => child.getBoundingClientRect().height
    );

    return Math.ceil(
      Math.max(...heights) +
      parseFloat(style.paddingTop) +
      parseFloat(style.paddingBottom) +
      4
    );
  }));

  if (cardRequired > M.cardH) {
    px("--ba-menu-h", cardRequired * 3 + M.cardGap * 2);
  }

  ["ba-old-button", "ba-new-button"].forEach((id) => {
    fit(
      $(id),
      $(id).parentElement.getBoundingClientRect().width,
      minimum
    );
  });

  function fitHeading(parentId, firstId, secondId) {
    const parent = $(parentId);
    const copy = parent.parentElement;
    const room = copy.getBoundingClientRect().width;
    const first = $(firstId);
    const second = $(secondId);

    first.style.fontSize = `${M.heading}px`;
    second.style.fontSize = `${M.heading}px`;
    fit(first, room, minimum);
    fit(second, room, minimum);

    const buttonH = copy.querySelector(".ba-button")
      .getBoundingClientRect().height;
    const heightLimit =
      (copy.getBoundingClientRect().height - buttonH - M.copyGap) / 2.2;

    const size = Math.max(minimum, Math.min(
      parseFloat(getComputedStyle(first).fontSize),
      parseFloat(getComputedStyle(second).fontSize),
      heightLimit
    ));

    first.style.fontSize = `${size}px`;
    second.style.fontSize = `${size}px`;
    parent.style.fontSize = `${size}px`;
  }

  fitHeading("ba-old-heading", "ba-old-heading-1", "ba-old-heading-2");
  fitHeading("ba-right-heading", "ba-right-heading-1", "ba-right-heading-2");

  const tl = gsap.timeline({ paused: true });
  const build = gsap.timeline();
  const d = (fraction) => T.design * fraction;

  const dragStart = clamp(
    finite(V.beforeHold, 0.78),
    d(0.18),
    d(0.40)
  );
  const sweepDuration = d(0.74) - dragStart;
  const pressStart = Math.max(0, dragStart - d(0.08));
  const startX = browserW * start;
  const finishX = -M.handle * 0.7;
  const peakX = finishX - browserW * overshoot;
  const clipAt = (x) => `inset(0px 0px 0px ${x}px)`;

  // Monotone cubic segments: grab, fast drag, extended braking.
  // Their slopes match at the joins; there is no constant-speed section.
  function hermite(p, a, b, ya, yb, ma, mb) {
    const span = b - a;
    const u = (p - a) / span;
    const u2 = u * u;
    const u3 = u2 * u;

    return (
      (2 * u3 - 3 * u2 + 1) * ya +
      (u3 - 2 * u2 + u) * ma * span +
      (-2 * u3 + 3 * u2) * yb +
      (u3 - u2) * mb * span
    );
  }

  function driveEase(p) {
    if (p <= 0) return 0;
    if (p >= 1) return 1;
    if (p < 0.16) {
      return hermite(p, 0, 0.16, 0, 0.10, 0, 1.6);
    }
    if (p < 0.64) {
      return hermite(p, 0.16, 0.64, 0.10, 0.94, 1.6, 0.42);
    }
    return hermite(p, 0.64, 1, 0.94, 1, 0.42, 0);
  }

  function crossingTime(x) {
    if (x >= startX) return 0;

    const progress = clamp((startX - x) / (startX - peakX), 0, 1);
    let low = 0;
    let high = 1;

    for (let i = 0; i < 40; i += 1) {
      const middle = (low + high) / 2;
      if (driveEase(middle) < progress) {
        low = middle;
      } else {
        high = middle;
      }
    }

    return dragStart + sweepDuration * ((low + high) / 2);
  }

  const pagesRect = $("ba-pages").getBoundingClientRect();

  function handleMargin(rect, travel = 0) {
    const centerY = pagesRect.top + pagesRect.height / 2;
    const radius = M.handle * 0.58;
    const distanceY = Math.max(
      rect.top - travel - centerY,
      centerY - rect.bottom - travel,
      0
    );

    return Math.max(
      4,
      distanceY < radius
        ? Math.sqrt(radius * radius - distanceY * distanceY) + 2
        : 4
    );
  }

  function textRect(el) {
    const range = document.createRange();
    range.selectNodeContents(el);
    return range.getBoundingClientRect();
  }

  function clearTime(el, travel = 0, wholeBox = false) {
    const rect = wholeBox ? el.getBoundingClientRect() : textRect(el);
    return crossingTime(
      rect.left - pagesRect.left - handleMargin(rect, travel)
    );
  }

  gsap.set("#ba-new", { clipPath: clipAt(startX) });
  gsap.set("#ba-divider", { x: startX });
  gsap.set("#ba-grab-ring", {
    autoAlpha: 0,
    scaleX: 0.75,
    scaleY: 0.75
  });
  gsap.set("#ba-accent-rule", { scaleX: 0 });
  gsap.set("#ba-payoff", { autoAlpha: 0 });

  // Whole text runs switch visibility only after the edge and handle
  // have cleared them. These are timeline properties, not callbacks.
  function scheduleTextVisibility(pageId, modern) {
    const elements = Array.from($(pageId).querySelectorAll("*")).filter(
      (el) => Array.from(el.childNodes).some(
        (node) => node.nodeType === 3 && node.nodeValue.trim()
      )
    );

    elements.forEach((el) => {
      if (modern && (
        el.closest("#ba-right-heading, #ba-cards") ||
        el.id === "ba-new-button" ||
        el.id === "ba-new-subtitle"
      )) return;

      const rect = textRect(el);
      const margin = handleMargin(rect);
      const edge = modern
        ? rect.left - pagesRect.left - margin
        : rect.right - pagesRect.left + margin;
      const initiallyVisible = modern ? edge >= startX : edge < startX;
      const at = crossingTime(edge);

      gsap.set(el, {
        visibility: initiallyVisible ? "visible" : "hidden"
      });

      if (at > 0) {
        build.set(el, {
          visibility: modern ? "visible" : "hidden"
        }, at);
      }
    });
  }

  scheduleTextVisibility("ba-old", false);
  scheduleTextVisibility("ba-new", true);

  // The press happens while the blue page is still being read.
  build.to("#ba-handle", {
    scaleX: 1 - press,
    scaleY: 1 - press,
    duration: d(0.055),
    ease: "power3.out"
  }, pressStart);

  build.set("#ba-grab-ring", { autoAlpha: 1 }, pressStart);

  build.to("#ba-grab-ring", {
    scaleX: 1.4,
    scaleY: 1.4,
    autoAlpha: 0,
    duration: d(0.13),
    ease: "power2.out"
  }, pressStart);

  build.to("#ba-handle", {
    scaleX: 1 - press * 1.45,
    scaleY: 1 + press,
    duration: d(0.045),
    ease: "power3.out"
  }, dragStart);

  build.to("#ba-handle", {
    scaleX: 1,
    scaleY: 1,
    duration: d(0.13),
    ease: "back.out(1.8)"
  }, dragStart + d(0.045));

  // Matching direct tweens keep the wipe and blurred divider together
  // during ordinary seeks and event-free temporal sampling.
  build.to("#ba-new", {
    clipPath: clipAt(peakX),
    duration: sweepDuration,
    ease: driveEase
  }, dragStart);

  build.to("#ba-divider", {
    x: peakX,
    duration: sweepDuration,
    ease: driveEase
  }, dragStart);

  const brakeAt = dragStart + sweepDuration * 0.52;

  build.to("#ba-handle", {
    scaleX: 1 + press,
    scaleY: 1 - press * 0.8,
    duration: d(0.055),
    ease: "power2.out"
  }, brakeAt);

  // The overshoot and return remain fully outside the page.
  build.to("#ba-new", {
    clipPath: clipAt(finishX),
    duration: d(0.08),
    ease: "power3.out"
  }, d(0.74));

  build.to("#ba-divider", {
    x: finishX,
    duration: d(0.08),
    ease: "power3.out"
  }, d(0.74));

  build.to("#ba-handle", {
    scaleX: 1,
    scaleY: 1,
    duration: d(0.12),
    ease: "back.out(2)"
  }, d(0.74));

  // Artwork reacts first, where the wipe actually uncovers it.
  const artRect = $("ba-new-art").getBoundingClientRect();
  const artAt = crossingTime(artRect.left - pagesRect.left - 4);

  gsap.set("#ba-new-art", { scaleX: 0.96, scaleY: 0.96 });

  build.to("#ba-new-art", {
    scaleX: 1,
    scaleY: 1,
    duration: d(0.12),
    ease: "back.out(1.6)"
  }, artAt);

  const headingTravel = Math.max(12, lift * 1.5);
  const headingAt = Math.max(
    d(0.60),
    clearTime($("ba-right-heading"), headingTravel)
  );
  const buttonAt = Math.max(
    headingAt + d(0.035),
    clearTime($("ba-new-button"), lift)
  );

  gsap.set("#ba-right-heading", {
    autoAlpha: 0,
    y: headingTravel
  });
  gsap.set("#ba-new-button", { autoAlpha: 0, y: lift });

  build.set("#ba-right-heading", { autoAlpha: 1 }, headingAt);
  build.to("#ba-right-heading", {
    y: 0,
    duration: d(0.12),
    ease: "back.out(1.3)"
  }, headingAt);

  build.set("#ba-new-button", { autoAlpha: 1 }, buttonAt);
  build.to("#ba-new-button", {
    y: 0,
    duration: d(0.10),
    ease: "back.out(1.4)"
  }, buttonAt);

  // Remove the badge without leaving an empty label row.
  // The navigation takes its place only after the badge has gone.
  const revealAt = crossingTime(0);
  const badgeOutDuration = d(0.035);
  const navAt = Math.max(
    revealAt + badgeOutDuration,
    clearTime($("ba-new-subtitle"), 6)
  );

  build.to("#ba-after-chip", {
    y: -10,
    duration: badgeOutDuration,
    ease: "power3.in"
  }, revealAt);

  build.set("#ba-after-chip", { autoAlpha: 0 },
    revealAt + badgeOutDuration);

  gsap.set("#ba-new-subtitle", { autoAlpha: 0, y: 6 });
  build.set("#ba-new-subtitle", { autoAlpha: 1 }, navAt);
  build.to("#ba-new-subtitle", {
    y: 0,
    duration: d(0.06),
    ease: "power3.out"
  }, navAt);

  // Broad cards keep every sample product name on one readable line.
  // A cut-on, short spring, picture pop and price pop share each beat.
  cards.forEach((card, i) => {
    const picture = card.querySelector(".ba-card-picture");
    const price = card.querySelector(".ba-item-price");
    const plannedAt = d(0.72 + i * 0.07);
    const at = Math.max(plannedAt, clearTime(card, lift, true));
    const landDuration = Math.max(d(0.08), T.design - at);
    const duration = Math.min(d(0.14), landDuration);

    gsap.set(card, {
      autoAlpha: 0,
      y: lift,
      scaleX: 0.985,
      scaleY: 0.985
    });
    gsap.set(picture, { scaleX: 0.8, scaleY: 0.8 });
    gsap.set(price, { scaleX: 0.92, scaleY: 0.92 });

    build.set(oldRows[i], { autoAlpha: 0 }, at);
    build.set(card, {
      autoAlpha: 1,
      borderColor: arrivalRule
    }, at);

    build.to(card, {
      y: 0,
      scaleX: 1,
      scaleY: 1,
      duration,
      ease: "back.out(1.6)"
    }, at);

    build.to(picture, {
      scaleX: 1,
      scaleY: 1,
      duration,
      ease: "back.out(2)"
    }, at);

    build.to(price, {
      scaleX: 1,
      scaleY: 1,
      duration,
      ease: "back.out(1.7)"
    }, at);

    build.to(card, {
      borderColor: rule,
      duration: duration * 0.55,
      ease: "power2.out"
    }, at + duration * 0.45);
  });

  build.timeScale(1 / T.scale);
  tl.add(build, 0);

  // At the key frame the final card is home and the finished browser
  // gets a separate accent. Reading text does not move through the hold.
  tl.set("#ba-payoff", { autoAlpha: 1 }, T.key);

  if (T.hold > 0) {
    const flashDuration = Math.min(0.24, T.hold);
    const attack = Math.min(0.09, T.hold * 0.22);
    const recovery = Math.min(0.28, Math.max(0.001, T.hold - attack));

    tl.to("#ba-payoff", {
      autoAlpha: 0,
      duration: flashDuration,
      ease: "power2.out"
    }, T.key);

    tl.to("#ba-accent-rule", {
      scaleX: 1,
      duration: Math.min(0.16, T.hold),
      ease: "power4.out"
    }, T.key);

    tl.to("#ba-new-art", {
      scaleX: 1 + payoffPulse,
      scaleY: 1 + payoffPulse,
      duration: attack,
      ease: "power3.out"
    }, T.key);

    tl.to("#ba-new-art", {
      scaleX: 1,
      scaleY: 1,
      duration: recovery,
      ease: "back.out(1.5)"
    }, T.key + attack);
  } else {
    tl.set("#ba-accent-rule", { scaleX: 1 }, T.key);
  }

  const motionEnd = Math.max(
    0.001,
    finite(T.duration, T.key + T.hold + T.exit)
  );
  const breadTarget = "#ba-new-art .ba-loaf-motion";

  gsap.set(breadTarget, { transformOrigin: "50% 75%" });

  tl.fromTo(breadTarget,
    { scaleX: 1, scaleY: 1, y: 0 },
    {
      scaleX: 1 + push,
      scaleY: 1 + push,
      y: -steamTravel * 0.15,
      duration: motionEnd,
      ease: "none"
    }, 0);

  const strands = Array.from(
    $("ba-new-art").querySelectorAll(".ba-steam-strand")
  );

  strands.forEach((strand, i) => {
    const direction = i % 2 === 0 ? 1 : -1;
    const sway = 4 + i * 2;
    const period = 0.9 + i * 0.16;

    tl.fromTo(strand,
      { y: steamTravel * 0.4 },
      {
        y: -steamTravel * 0.6,
        duration: motionEnd,
        ease: "none"
      }, 0);

    gsap.set(strand, {
      x: -direction * sway,
      opacity: 0.56 + i * 0.1
    });

    let at = 0;
    let step = 0;

    while (at < motionEnd) {
      const duration = Math.min(period, motionEnd - at);
      const sign = step % 2 === 0 ? direction : -direction;

      tl.to(strand, {
        x: sign * sway,
        opacity: step % 2 === 0 ? 0.95 : 0.5,
        duration,
        ease: "sine.inOut"
      }, at);

      at += duration;
      step += 1;
    }
  });

  tl.fromTo("#ba-dither",
    { backgroundPosition: "0px 0px" },
    {
      backgroundPosition: "14px -10px",
      duration: motionEnd,
      ease: "none"
    }, 0);

  const open = "inset(0% 0% 0% 0%)";
  const closed = "inset(0% 50% 0% 50%)";

  if (overlay) {
    tl.fromTo(stageEl,
      { clipPath: closed },
      {
        clipPath: open,
        duration: Math.min(0.2, dragStart * T.scale * 0.25),
        ease: "power3.out"
      }, 0);
  }

  if (T.exit > 0) {
    tl.fromTo(stageEl,
      { clipPath: open },
      {
        clipPath: closed,
        duration: Math.max(0, T.exit - 1 / CA.fps),
        ease: "power3.in",
        immediateRender: false
      }, T.key + T.hold);
  }

  window.__timelines["block"] = tl;
});