CA.ready(() => {
  const {
    vars: V, stage: S, safe, time: T, variant,
    make, fit, rgba, grainUrl
  } = CA;

  const $ = (id) => document.getElementById(id);
  const stageEl = $("stage");
  const full = variant === "full";
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
  stageEl.classList.toggle("ba-short", short);
  stageEl.setAttribute(
    "aria-label",
    `${V.businessType || ""}. ${V.changeDescription || ""}`
  );

  const M = full
    ? {
        side: 44,
        top: Math.max(230, safe.top),
        bottom: Math.max(300, safe.bottom),
        headline: 108,
        headlineGap: 28,
        bar: 56,
        pad: 30,
        label: 54,
        labelType: 40,
        header: 116,
        menu: 258,
        gap: 24,
        heroGap: 28,
        copyGap: 32,
        cardGap: 14,
        cardPad: 18,
        cardPicture: 40,
        body: 40,
        name: 58,
        heading: 90,
        handle: 92
      }
    : {
        side: variant === "overlay" ? 24 : 28,
        top: variant === "overlay" ? 18 : (short ? 10 : 16),
        bottom: short ? 12 : 18,
        headline: short ? 46 : 62,
        headlineGap: short ? 10 : 18,
        bar: short ? 40 : 44,
        pad: short ? 16 : 24,
        label: short ? 40 : 46,
        labelType: 32,
        header: short ? 80 : 88,
        menu: short ? 188 : 218,
        gap: short ? 12 : 18,
        heroGap: short ? 18 : 24,
        copyGap: short ? 14 : 24,
        cardGap: short ? 10 : 14,
        cardPad: short ? 12 : 16,
        cardPicture: short ? 28 : 34,
        body: short ? 32 : 36,
        name: short ? 42 : 48,
        heading: short ? 60 : 76,
        handle: short ? 60 : 72
      };

  const start = clamp(finite(V.startSplit, 97.5), 85, 99) / 100;
  const overshoot = clamp(finite(V.overshoot, 3.5), 0, 6) / 100;
  const lift = clamp(finite(V.cardLift, 12), 0, 30);
  const push = clamp(finite(V.push, 3), 0, 4) / 100;

  const properties = {
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
    "--ba-rule": rgba(V.ink, 0.22)
  };

  Object.entries(properties).forEach(([key, value]) => {
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
    "--ba-card-picture-h": M.cardPicture,
    "--ba-body": M.body,
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
      <g class="ba-steam-motion">
        <path d="M80 140c-35-43 30-55 0-111M150 145c-35-43 30-55 0-111M220 140c-35-43 30-55 0-111"
          fill="none" stroke="currentColor" stroke-width="5"
          stroke-linecap="round"/>
      </g>
    </svg>`;

  const cardPicture = `
    <svg viewBox="0 0 100 52" preserveAspectRatio="xMinYMid meet"
      aria-hidden="true">
      <path fill="currentColor"
        d="M5 37C4 16 24 4 49 4s45 13 46 31c1 12-15 15-45 15S7 48 5 37Z"/>
      <path d="m29 14-6 17m26-20-6 19m26-15-6 17"
        fill="none" stroke="var(--ba-bread-dark)" stroke-width="4"
        stroke-linecap="round"/>
    </svg>`;

  $("ba-old-art").innerHTML = loaf;
  $("ba-new-art").innerHTML = loaf + steam;

  for (let i = 1; i <= 3; i += 1) {
    const oldRow = make("div", "ba-menu-row", $("ba-old-menu"));
    make("span", "ba-item-name", oldRow, V[`oldItem${i}`]);
    make("span", "ba-item-price", oldRow, V[`oldPrice${i}`]);

    const newRow = make("article", "ba-menu-row", $("ba-cards"));
    const picture = make("span", "ba-card-picture", newRow);
    picture.setAttribute("aria-hidden", "true");
    picture.innerHTML = cardPicture;
    make("span", "ba-item-name", newRow, V[`card${i}Name`]);
    make("span", "ba-item-price", newRow, V[`card${i}Price`]);
  }

  const side = Math.max(M.side, safe.side);
  const browserW = S.w - 2 * side;

  Object.assign($("ba-headline").style, {
    top: `${M.top}px`,
    left: `${side}px`,
    width: `${browserW}px`
  });

  $("ba-headline-lines").style.fontSize = `${M.headline}px`;
  fit($("ba-headline-lines"), browserW, minimum);

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
  const navW = $("ba-new-subtitle").getBoundingClientRect().width;
  fit($("ba-new-name"), pageRoom - navW - 24, minimum);

  // Give the old banner enough height for both existing lines and its
  // padding. Only its own grid row needs the additional room.
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

  function fitHeading(parentId, firstId, secondId) {
    const parent = $(parentId);
    const room = parent.parentElement.getBoundingClientRect().width;
    const first = $(firstId);
    const second = $(secondId);

    first.style.fontSize = `${M.heading}px`;
    second.style.fontSize = `${M.heading}px`;
    fit(first, room, minimum);
    fit(second, room, minimum);

    let size = Math.min(
      parseFloat(getComputedStyle(first).fontSize),
      parseFloat(getComputedStyle(second).fontSize)
    );

    const copy = parent.parentElement;
    const button = copy.querySelector(".ba-button");
    const buttonH = button.getBoundingClientRect().height;
    const availableH = copy.getBoundingClientRect().height;
    const heightLimit = (availableH - buttonH - M.copyGap) / 2.2;
    size = Math.max(minimum, Math.min(size, heightLimit));

    first.style.fontSize = `${size}px`;
    second.style.fontSize = `${size}px`;
    parent.style.fontSize = `${size}px`;
  }

  ["ba-old-button", "ba-new-button"].forEach((id) => {
    const room = $(id).parentElement.getBoundingClientRect().width;
    fit($(id), room, minimum);
  });

  fitHeading("ba-old-heading", "ba-old-heading-1", "ba-old-heading-2");
  fitHeading("ba-right-heading", "ba-right-heading-1", "ba-right-heading-2");

  // Reserve card height from the final, fixed card widths. No dimensions
  // are measured again or changed in response to the divider.
  const cards = Array.from($("ba-cards").children);
  const cardRequired = Math.max(...cards.map((card) => {
    const name = card.querySelector(".ba-item-name");
    const price = card.querySelector(".ba-item-price");
    const picture = card.querySelector(".ba-card-picture");
    const style = getComputedStyle(card);
    const gap = parseFloat(style.gap) || 0;

    return Math.ceil(
      name.getBoundingClientRect().height +
      price.getBoundingClientRect().height +
      picture.getBoundingClientRect().height +
      2 * gap +
      2 * M.cardPad +
      6
    );
  }));

  if (cardRequired > M.menu) {
    px("--ba-menu-h", cardRequired);
    fitHeading("ba-old-heading", "ba-old-heading-1", "ba-old-heading-2");
    fitHeading("ba-right-heading", "ba-right-heading-1", "ba-right-heading-2");
  }

  const tl = gsap.timeline({ paused: true });
  const build = gsap.timeline();
  const d = (fraction) => T.design * fraction;

  const startX = browserW * start;

  // The divider finishes completely outside the browser. Its tiny
  // spring recovery also stays outside, so the old page never returns.
  const finishX = -M.handle * 0.7;
  const peakX = finishX - browserW * overshoot;
  const clipAt = (x) => `inset(0px 0px 0px ${x}px)`;

  gsap.set("#ba-new", { clipPath: clipAt(startX) });
  gsap.set("#ba-divider", { x: startX });

  // Text covered by either page or the moving divider must actually
  // be hidden. Schedule visibility directly on the same timeline so
  // ordinary seeks and event-free motion-blur seeks agree.
  const pagesRect = $("ba-pages").getBoundingClientRect();
  const sweepEase = gsap.parseEase("power3.inOut");

  function crossingTime(x) {
    if (x >= startX) return 0;

    const progress = clamp((startX - x) / (startX - peakX), 0, 1);
    let low = 0;
    let high = 1;

    for (let i = 0; i < 40; i += 1) {
      const middle = (low + high) / 2;
      if (sweepEase(middle) < progress) {
        low = middle;
      } else {
        high = middle;
      }
    }

    return d(0.12) + d(0.64) * ((low + high) / 2);
  }

  function scheduleTextVisibility(pageId, modern) {
    const elements = Array.from($(pageId).querySelectorAll("*")).filter(
      (el) => Array.from(el.childNodes).some(
        (node) => node.nodeType === 3 && node.nodeValue.trim()
      )
    );

    elements.forEach((el) => {
      // Measure the actual text, rather than unused space in a block.
      const range = document.createRange();
      range.selectNodeContents(el);
      const rect = range.getBoundingClientRect();

      const centerY = pagesRect.top + pagesRect.height / 2;
      const radius = M.handle * 0.56;
      // Include the cards' small vertical travel when checking whether
      // a text line can pass beneath the divider handle.
      const travel = el.closest("#ba-cards") ? lift * 1.5 : 0;
      const distanceY = Math.max(
        rect.top - travel - centerY,
        centerY - rect.bottom - travel,
        0
      );
      const handleMargin = distanceY < radius
        ? Math.sqrt(radius * radius - distanceY * distanceY)
        : 0;
      const margin = Math.max(3, handleMargin) + 1;

      const edge = modern
        ? rect.left - pagesRect.left - margin
        : rect.right - pagesRect.left + margin;
      const at = crossingTime(edge);
      const initiallyVisible = modern ? edge >= startX : edge < startX;

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

  // Direct GSAP properties stay synchronized under event-free sampling.
  // Only the clipping edge moves; both page layouts remain full width.
  build.to("#ba-new", {
    clipPath: clipAt(peakX),
    duration: d(0.64),
    ease: "power3.inOut"
  }, d(0.12));

  build.to("#ba-divider", {
    x: peakX,
    duration: d(0.64),
    ease: "power3.inOut"
  }, d(0.12));

  build.to("#ba-new", {
    clipPath: clipAt(finishX),
    duration: d(0.12),
    ease: "sine.out"
  }, d(0.76));

  build.to("#ba-divider", {
    x: finishX,
    duration: d(0.12),
    ease: "sine.out"
  }, d(0.76));

  build.to("#ba-handle", {
    scaleX: 0.88,
    scaleY: 1.12,
    duration: d(0.10),
    ease: "power2.out"
  }, d(0.12));

  build.to("#ba-handle", {
    scaleX: 1,
    scaleY: 1,
    duration: d(0.20),
    ease: "back.out(1.5)"
  }, d(0.22));

  build.fromTo("#ba-cards .ba-menu-row",
    { y: lift },
    {
      y: 0,
      duration: d(0.24),
      stagger: d(0.04),
      ease: "back.out(1.25)",
      immediateRender: false
    },
    d(0.68)
  );

  build.fromTo("#ba-cards .ba-card-picture",
    { y: lift * 0.5 },
    {
      y: 0,
      duration: d(0.18),
      stagger: d(0.04),
      ease: "back.out(1.4)",
      immediateRender: false
    },
    d(0.74)
  );

  build.timeScale(1 / T.scale);
  tl.add(build, 0);

  const visibleDuration = Math.max(0.001, T.key + T.hold);
  const breadTarget = "#ba-new-art .ba-loaf-motion";
  const steamTarget = "#ba-new-art .ba-steam-motion";

  gsap.set(breadTarget, { transformOrigin: "50% 75%" });

  // Uniform scale preserves the loaf's proportions. These motions stay
  // inside the artwork; the browser and all reading text remain fixed.
  tl.fromTo(breadTarget,
    { scaleX: 1, scaleY: 1, y: 0 },
    {
      scaleX: 1 + push,
      scaleY: 1 + push,
      y: -8,
      duration: visibleDuration,
      ease: "none"
    }, 0);

  tl.fromTo(steamTarget,
    { y: 10 },
    {
      y: -24,
      duration: visibleDuration,
      ease: "none"
    }, 0);

  tl.fromTo("#ba-dither",
    { backgroundPosition: "0px 0px" },
    {
      backgroundPosition: "14px -10px",
      duration: visibleDuration,
      ease: "none"
    }, 0);

  if (T.hold > 0) {
    const reaction = Math.min(0.10, T.hold * 0.2);
    const recovery = Math.min(0.26, T.hold - reaction);

    tl.fromTo("#ba-cards .ba-item-price",
      { scaleX: 1, scaleY: 1 },
      {
        scaleX: 1.08,
        scaleY: 1.08,
        duration: reaction,
        ease: "power2.out",
        immediateRender: false
      }, T.key);

    tl.to("#ba-cards .ba-item-price", {
      scaleX: 1,
      scaleY: 1,
      duration: Math.max(0.001, recovery),
      ease: "back.out(1.4)"
    }, T.key + reaction);
  }

  const open = "inset(0% 0% 0% 0%)";
  const closed = "inset(0% 50% 0% 50%)";

  if (variant === "overlay") {
    tl.fromTo(stageEl,
      { clipPath: closed },
      {
        clipPath: open,
        duration: Math.min(0.20, T.key * 0.10),
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