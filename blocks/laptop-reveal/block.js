import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/RoundedBoxGeometry.js";

CA.ready(() => {
  const { vars: V, stage: S, safe, time: T, variant, rgba, fit } = CA;
  const $ = (id) => document.getElementById(id);
  const W = S.w;
  const H = S.h;
  const full = variant === "full";
  const overlay = variant === "overlay";
  const stageEl = $("stage");
  const K = Math.max(0.001, T.design);

  const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n));
  const number = (n, fallback) =>
    Number.isFinite(Number(n)) ? Number(n) : fallback;
  const segment = (t, start, duration) =>
    duration <= 0 ? (t >= start ? 1 : 0) : clamp((t - start) / duration);
  const smooth = (p) => p * p * (3 - 2 * p);
  const out = (p, power = 3) => 1 - Math.pow(1 - p, power);
  const back = (p, strength = 0.72) =>
    1 + (strength + 1) * Math.pow(p - 1, 3) +
    strength * Math.pow(p - 1, 2);
  const lerp = (a, b, p) => a + (b - a) * p;

  const referenceKey = Math.max(1, number(V.keyFrame, 120));
  const frame = (n) => clamp(number(n, 0) / referenceKey) * K;
  const span = (n) => Math.max(0.001, n / referenceKey * K);
  const between = (a, b) => Math.max(span(1), b - a);
  const designTime = (time) =>
    time <= T.key ? time / Math.max(0.001, T.scale) : K + time - T.key;

  const B = {
    openEnd: Math.max(span(1), frame(V.orbitEndFrame)),
    wakeStart: frame(V.wakeStartFrame),
    wakeEnd: frame(V.wakeEndFrame),
    scrollStart: frame(V.scrollStartFrame),
    scrollEnd: frame(V.scrollEndFrame),
    cursorStart: frame(V.cursorStartFrame),
    cursorEnd: frame(V.cursorEndFrame),
    pressStart: frame(V.pressStartFrame),
    pressEnd: frame(V.pressEndFrame),
    nameStart: Math.min(frame(V.nameStartFrame), K - span(1)),
    lineStart: Math.min(frame(V.lineStartFrame), K - span(1))
  };

  const initialAngle = clamp(number(V.initialLidAngle, 26), 12, 65);
  const finalAngle = clamp(number(V.finalLidAngle, 100), 90, 112);
  const orbit = clamp(number(V.cameraOrbit, 30), -45, 45);
  const elevation = clamp(
    number(V.cameraElevation, 21) * (full ? 1 : 0.82), 17, 29
  );
  const scrollDistance = clamp(number(V.scrollPixels, 940), 900, 1500);
  const initialBlur = clamp(number(V.screenBlur, 14), 0, 32);
  const titleSize = clamp(number(V.screenTitleSize, 144), 100, 180);
  const bodySize = clamp(number(V.screenTextSize, 84), 84, 112);
  const ctaSize = clamp(number(V.screenButtonSize, 84), 84, 108);

  $("lr-background").style.background =
    `linear-gradient(180deg, ${V.bgTop}, ${V.bgBottom})`;
  $("lr-vignette").style.background =
    `radial-gradient(ellipse at 50% 45%, transparent 48%, ${rgba(V.nameInk, 0.035)} 100%)`;
  $("lr-grain").style.backgroundImage = CA.grainUrl(192, 0.17, 31);

  const canvas = $("lr-gl");
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", `${V.product}. ${V.productDescription}`);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    preserveDrawingBuffer: true
  });
  renderer.setPixelRatio(2);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;

  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(V.buttonInk, V.bgBottom, 2));

  const keyLight = new THREE.DirectionalLight(V.buttonInk, 2.6);
  keyLight.position.set(-10, 15, 11);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(V.buttonInk, 1.15);
  fillLight.position.set(10, 8, 5);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(V.buttonInk, 1.8);
  rimLight.position.set(0, 12, -12);
  scene.add(rimLight);

  function metal(color, shininess, specular = 0.8) {
    return new THREE.MeshPhongMaterial({
      color,
      shininess,
      specular: new THREE.Color(V.buttonInk).multiplyScalar(specular)
    });
  }

  const aluminium = metal(V.silver, 105);
  const edgeMetal = metal(
    new THREE.Color(V.silver).multiplyScalar(0.72), 80, 0.65
  );
  const trackpadMetal = metal(
    new THREE.Color(V.silver).multiplyScalar(0.94), 55, 0.42
  );
  const blackGlass = metal(V.bezel, 110, 0.5);
  const keyMaterial = metal(V.keys, 28, 0.22);

  function rounded(w, h, d, material, radius = 0.1) {
    return new THREE.Mesh(
      new RoundedBoxGeometry(
        w, h, d, 2,
        Math.min(radius, w * 0.45, h * 0.45, d * 0.45)
      ),
      material
    );
  }

  function outline(w, h, radius) {
    const x = -w / 2;
    const y = -h / 2;
    const r = Math.min(radius, w / 2, h / 2);
    const shape = new THREE.Shape();
    shape.moveTo(x + r, y);
    shape.lineTo(x + w - r, y);
    shape.quadraticCurveTo(x + w, y, x + w, y + r);
    shape.lineTo(x + w, y + h - r);
    shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    shape.lineTo(x + r, y + h);
    shape.quadraticCurveTo(x, y + h, x, y + h - r);
    shape.lineTo(x, y + r);
    shape.quadraticCurveTo(x, y, x + r, y);
    return shape;
  }

  const laptop = new THREE.Group();
  scene.add(laptop);

  const chassisGeometry = new THREE.ExtrudeGeometry(
    outline(14.4, 9.2, 0.48),
    {
      depth: 0.24,
      bevelEnabled: true,
      bevelThickness: 0.045,
      bevelSize: 0.045,
      bevelSegments: 2,
      curveSegments: 8,
      steps: 1
    }
  );
  chassisGeometry.rotateX(-Math.PI / 2);
  const chassisPositions = chassisGeometry.attributes.position;
  for (let i = 0; i < chassisPositions.count; i++) {
    const front = clamp((chassisPositions.getZ(i) + 4.6) / 9.2);
    chassisPositions.setY(
      i, chassisPositions.getY(i) * (1 - front * 0.37)
    );
  }
  chassisGeometry.computeVertexNormals();

  const chassis = new THREE.Mesh(chassisGeometry, [aluminium, edgeMetal]);
  chassis.position.y = 0.11;
  laptop.add(chassis);

  const deck = rounded(14.22, 0.07, 9.01, aluminium, 0.03);
  deck.position.set(0, 0.34, 0);
  laptop.add(deck);

  const keyboardWell = rounded(11.7, 0.045, 3.92, blackGlass, 0.02);
  keyboardWell.position.set(0, 0.385, -1.27);
  laptop.add(keyboardWell);

  const keyGeometry = new RoundedBoxGeometry(0.67, 0.075, 0.55, 2, 0.03);
  const keyTransforms = [];
  for (let row = 0; row < 4; row++) {
    for (let column = 0; column < 14; column++) {
      keyTransforms.push([(column - 6.5) * 0.79, -2.72 + row * 0.75]);
    }
  }
  for (let column = 0; column < 4; column++) {
    keyTransforms.push([-5.135 + column * 0.79, 0.28]);
    keyTransforms.push([2.765 + column * 0.79, 0.28]);
  }

  const dummy = new THREE.Object3D();
  const keys = new THREE.InstancedMesh(
    keyGeometry, keyMaterial, keyTransforms.length
  );
  keyTransforms.forEach(([x, z], i) => {
    dummy.position.set(x, 0.445, z);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    keys.setMatrixAt(i, dummy.matrix);
  });
  keys.instanceMatrix.needsUpdate = true;
  laptop.add(keys);

  const spacebar = rounded(4.45, 0.075, 0.55, keyMaterial, 0.03);
  spacebar.position.set(0, 0.445, 0.28);
  laptop.add(spacebar);

  const padBorder = rounded(4.95, 0.025, 2.57, edgeMetal, 0.01);
  padBorder.position.set(0, 0.388, 2.45);
  const pad = rounded(4.88, 0.026, 2.5, trackpadMetal, 0.01);
  pad.position.set(0, 0.405, 2.45);
  laptop.add(padBorder, pad);

  const speakers = new THREE.InstancedMesh(
    new THREE.CircleGeometry(0.025, 6), keyMaterial, 90
  );
  let speakerIndex = 0;
  [-1, 1].forEach((side) => {
    for (let row = 0; row < 15; row++) {
      for (let column = 0; column < 3; column++) {
        dummy.position.set(
          side * (6.28 + column * 0.14),
          0.385,
          -2.75 + row * 0.24
        );
        dummy.rotation.set(-Math.PI / 2, 0, 0);
        dummy.updateMatrix();
        speakers.setMatrixAt(speakerIndex++, dummy.matrix);
      }
    }
  });
  speakers.instanceMatrix.needsUpdate = true;
  laptop.add(speakers);

  const hingeBar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.16, 10.9, 20), edgeMetal
  );
  hingeBar.rotation.z = Math.PI / 2;
  hingeBar.position.set(0, 0.43, -4.11);
  laptop.add(hingeBar);

  const hinge = new THREE.Group();
  hinge.position.set(0, 0.43, -4.11);
  laptop.add(hinge);

  const lid = rounded(13.72, 8.68, 0.24, aluminium, 0.11);
  lid.position.set(0, 4.34, 0);
  hinge.add(lid);

  const bezel = rounded(13.4, 8.36, 0.045, blackGlass, 0.02);
  bezel.position.set(0, 4.34, 0.142);
  hinge.add(bezel);

  const cameraDot = new THREE.Mesh(
    new THREE.CircleGeometry(0.047, 12),
    new THREE.MeshBasicMaterial({ color: V.keys })
  );
  cameraDot.position.set(0, 8.43, 0.168);
  hinge.add(cameraDot);

  const PW = 1440;
  const PH = 900;
  const page = document.createElement("canvas");
  page.width = PW;
  page.height = Math.ceil(scrollDistance + PH + 4);
  const pg = page.getContext("2d");

  function pathRound(g, x, y, w, h, radius) {
    const r = Math.min(radius, w / 2, h / 2);
    g.beginPath();
    g.moveTo(x + r, y);
    g.lineTo(x + w - r, y);
    g.quadraticCurveTo(x + w, y, x + w, y + r);
    g.lineTo(x + w, y + h - r);
    g.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    g.lineTo(x + r, y + h);
    g.quadraticCurveTo(x, y + h, x, y + h - r);
    g.lineTo(x, y + r);
    g.quadraticCurveTo(x, y, x + r, y);
    g.closePath();
  }

  function panel(g, x, y, w, h, radius, fill) {
    pathRound(g, x, y, w, h, radius);
    g.fillStyle = fill;
    g.fill();
  }

  function font(g, size, bold) {
    g.font = bold
      ? `700 ${size}px "Inter Tight"`
      : `500 ${size}px Inter`;
    g.textBaseline = "top";
  }

  function wrap(g, text, width) {
    const lines = [];
    String(text).split("\n").forEach((paragraph) => {
      let line = "";
      paragraph.split(/\s+/).filter(Boolean).forEach((word) => {
        if (g.measureText(word).width > width) {
          if (line) lines.push(line);
          line = "";
          for (const letter of word) {
            if (line && g.measureText(line + letter).width > width) {
              lines.push(line);
              line = letter;
            } else {
              line += letter;
            }
          }
          return;
        }
        const proposed = line ? `${line} ${word}` : word;
        if (line && g.measureText(proposed).width > width) {
          lines.push(line);
          line = word;
        } else {
          line = proposed;
        }
      });
      lines.push(line);
    });
    return lines;
  }

  function prepare(text, width, height, preferred, minimum, bold) {
    let size = Math.max(minimum, preferred);
    let lines;
    let lineHeight;
    do {
      font(pg, size, bold);
      lines = wrap(pg, text, width);
      lineHeight = size * 1.08;
      if (lines.length * lineHeight <= height || size <= minimum) break;
      size -= 1;
    } while (true);

    const maxLines = Math.max(1, Math.floor(height / lineHeight));
    if (lines.length > maxLines) {
      lines = lines.slice(0, maxLines);
      let last = lines[maxLines - 1];
      while (last && pg.measureText(last + "…").width > width) {
        last = last.slice(0, -1);
      }
      lines[maxLines - 1] = last + "…";
    }
    return {
      lines,
      size,
      lineHeight,
      height: lines.length * lineHeight,
      bold
    };
  }

  function write(g, block, x, y, color, align = "center") {
    font(g, block.size, block.bold);
    g.textAlign = align;
    g.fillStyle = color;
    block.lines.forEach((line, i) => {
      g.fillText(line, x, y + i * block.lineHeight);
    });
    g.textAlign = "left";
  }

  const openingCopy = prepare(V.headline, 1260, 310, titleSize, 100, true);
  const projectCopy = prepare(V.projectTitle, 1216, 110, 100, 84, true);
  const projectDescription = prepare(
    V.projectDescription, 1216, 184, bodySize, 84, false
  );
  const sectionCopy = prepare(
    V.sectionHeadline, 1256, 340, titleSize, 100, true
  );
  const sectionDescription = prepare(
    V.sectionDescription, 1260, 292, bodySize, 84, false
  );
  const buttonCopy = prepare(V.button, 1110, 112, ctaSize, 84, true);

  pg.fillStyle = V.pageBackground;
  pg.fillRect(0, 0, page.width, page.height);
  write(pg, openingCopy, PW / 2, 44, V.pageInk);
  panel(pg, 64, 394, 1312, 320, 30, V.workspaceSurface);
  panel(pg, 64, 394, 10, 320, 5, V.buttonColor);
  write(pg, projectCopy, 112, 416, V.pageInk, "left");
  write(pg, projectDescription, 112, 530, V.muted, "left");

  const sectionY = scrollDistance;
  const sectionBlockHeight = sectionCopy.height + 28 + sectionDescription.height;
  const sectionTop = 36 + Math.max(0, (650 - sectionBlockHeight) / 2);
  write(pg, sectionCopy, PW / 2, sectionY + sectionTop, V.pageInk);
  write(
    pg,
    sectionDescription,
    PW / 2,
    sectionY + sectionTop + sectionCopy.height + 28,
    V.muted
  );

  const screenCanvas = document.createElement("canvas");
  screenCanvas.width = PW;
  screenCanvas.height = PH;
  const sg = screenCanvas.getContext("2d");
  const screenTexture = new THREE.CanvasTexture(screenCanvas);
  screenTexture.colorSpace = THREE.SRGBColorSpace;
  screenTexture.anisotropy = Math.min(
    4, renderer.capabilities.getMaxAnisotropy()
  );
  screenTexture.minFilter = THREE.LinearFilter;
  screenTexture.magFilter = THREE.LinearFilter;
  screenTexture.generateMipmaps = false;

  function displayGeometry(w, h, radius) {
    const geometry = new THREE.ShapeGeometry(outline(w, h, radius), 8);
    const positions = geometry.attributes.position;
    const uv = new Float32Array(positions.count * 2);
    for (let i = 0; i < positions.count; i++) {
      uv[i * 2] = positions.getX(i) / w + 0.5;
      uv[i * 2 + 1] = positions.getY(i) / h + 0.5;
    }
    geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    return geometry;
  }

  const display = new THREE.Mesh(
    displayGeometry(12.74, 7.96, 0.1),
    new THREE.MeshBasicMaterial({
      map: screenTexture,
      toneMapped: false
    })
  );
  display.position.set(0, 4.34, 0.169);
  hinge.add(display);

  const contactCanvas = document.createElement("canvas");
  contactCanvas.width = contactCanvas.height = 128;
  const cg = contactCanvas.getContext("2d");
  const gradient = cg.createRadialGradient(64, 64, 9, 64, 64, 64);
  gradient.addColorStop(0, rgba(V.nameInk, 0.23));
  gradient.addColorStop(0.48, rgba(V.nameInk, 0.1));
  gradient.addColorStop(1, rgba(V.nameInk, 0));
  cg.fillStyle = gradient;
  cg.fillRect(0, 0, 128, 128);

  const contactTexture = new THREE.CanvasTexture(contactCanvas);
  contactTexture.colorSpace = THREE.SRGBColorSpace;
  const contact = new THREE.Mesh(
    new THREE.PlaneGeometry(18.5, 12),
    new THREE.MeshBasicMaterial({
      map: contactTexture,
      transparent: true,
      depthWrite: false,
      toneMapped: false
    })
  );
  contact.rotation.x = -Math.PI / 2;
  contact.position.set(0, -0.025, 0.3);
  scene.add(contact);

  const side = Math.max(number(safe.side, 40), full ? 44 : 32);
  const textRoom = Math.max(120, W - side * 2);
  const usableTop = Math.max(number(safe.top, 0), full ? 230 : 24);
  const usableBottom = Math.min(
    H - number(safe.bottom, 0), H - (full ? 300 : 24)
  );
  const usableHeight = Math.max(240, usableBottom - usableTop);

  const nameEl = $("lr-name");
  const lineEl = $("lr-line");
  const nameMask = $("lr-name-mask");
  const lineMask = $("lr-line-mask");
  nameEl.textContent = V.productName;
  lineEl.textContent = V.shortLine;
  nameEl.style.color = V.nameInk;
  lineEl.style.color = V.muted;
  nameEl.style.fontSize =
    clamp(number(V.nameSize, 184) * (full ? 1 : 0.76), 64, 240) + "px";
  lineEl.style.fontSize =
    clamp(number(V.taglineSize, 56) * (full ? 1 : 0.82),
      full ? 40 : 32, 80) + "px";

  fit(nameEl, textRoom, full ? 64 : 48);
  fit(lineEl, textRoom, full ? 40 : 32);

  [nameEl, lineEl].forEach((el) => {
    el.style.maxWidth = textRoom + "px";
    el.style.whiteSpace = "normal";
    el.style.overflowWrap = "anywhere";
  });

  const nameHeight = Math.ceil(nameEl.getBoundingClientRect().height + 16);
  const lineHeight = Math.ceil(lineEl.getBoundingClientRect().height + 10);
  nameMask.style.height = nameHeight + "px";
  lineMask.style.height = lineHeight + "px";
  nameEl.style.top = "6px";
  lineEl.style.top = "3px";

  const headingMask = $("lr-heading-mask");
  const firstHeading = $("lr-heading-first");
  firstHeading.textContent = V.headline;
  $("lr-heading-second").textContent = V.sectionHeadline;
  headingMask.style.left = side + "px";
  headingMask.style.right = side + "px";
  headingMask.style.display = full ? "block" : "none";

  let headerHeight = 0;
  if (full) {
    const capacity = Math.min(260, usableHeight * 0.19);
    let size = clamp(number(V.headlineSize, 128), 64, 170);
    firstHeading.style.color = V.pageInk;
    firstHeading.style.fontSize = size + "px";
    while (
      firstHeading.getBoundingClientRect().height > capacity - 12 &&
      size > 40
    ) {
      size -= 1;
      firstHeading.style.fontSize = size + "px";
    }
    headerHeight = Math.ceil(firstHeading.getBoundingClientRect().height + 12);
  }
  headingMask.style.height = headerHeight + "px";

  const headerGap = full ? 24 : 0;
  const deviceGap = full ? 26 : 16;
  const lineGap = full ? 4 : 2;
  const accentGap = full ? 18 : 12;
  const textHeight =
    deviceGap + nameHeight + lineGap + lineHeight + accentGap + 6;

  let ppu = 1;
  let projectionCenterY = 0;
  let viewportTop = 0;
  let viewportHeight = H;

  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 130);
  const look = new THREE.Vector3(0, 3.7, 0);

  function aim(t, reaction = 0) {
    const p = smooth(segment(t, 0, B.openEnd));
    const azimuth = THREE.MathUtils.degToRad(orbit * (1 - p));
    const angle = THREE.MathUtils.degToRad(
      elevation + 2.5 * (1 - p)
    );
    const distance = 35;
    camera.position.set(
      Math.sin(azimuth) * Math.cos(angle) * distance,
      look.y + Math.sin(angle) * distance,
      Math.cos(azimuth) * Math.cos(angle) * distance
    );
    camera.lookAt(look);
    camera.left = -W / (2 * ppu);
    camera.right = W / (2 * ppu);
    camera.top = (projectionCenterY - viewportTop) / ppu;
    camera.bottom =
      -(viewportTop + viewportHeight - projectionCenterY) / ppu;
    camera.zoom = (0.94 + 0.06 * out(p)) * (1 + reaction);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
  }

  hinge.rotation.x = Math.PI / 2 - THREE.MathUtils.degToRad(finalAngle);
  laptop.updateMatrixWorld(true);
  aim(K);

  const finalPoints = [];
  [-7.3, 7.3].forEach((x) => {
    [-4.7, 4.7].forEach((z) => {
      finalPoints.push(new THREE.Vector3(x, 0.08, z));
      finalPoints.push(new THREE.Vector3(x, 0.45, z));
    });
  });
  [-6.95, 6.95].forEach((x) => {
    [0, 8.74].forEach((y) => {
      finalPoints.push(hinge.localToWorld(new THREE.Vector3(x, y, 0.18)));
    });
  });

  function deviceBounds() {
    const points = finalPoints.map((point) => point.clone().project(camera));
    const ys = points.map((point) => (1 - point.y) * H / 2);
    return { top: Math.min(...ys), bottom: Math.max(...ys) };
  }

  const unitBounds = deviceBounds();
  const unitHeight = unitBounds.bottom - unitBounds.top;
  const widthPPU = Math.max(1, (W - (full ? 52 : 48)) / 15.1);

  function layout(withHeading) {
    const headingSpace = withHeading ? headerHeight + headerGap : 0;
    const deviceRoom = Math.max(120, usableHeight - headingSpace - textHeight);
    const scale = Math.min(widthPPU, deviceRoom / unitHeight);
    const deviceHeight = unitHeight * scale;
    const totalHeight = headingSpace + deviceHeight + textHeight;
    const top = usableTop + Math.max(0, (usableHeight - totalHeight) / 2);
    const deviceTop = top + headingSpace;
    const center = deviceTop - unitBounds.top * scale;
    const bottom = deviceTop + deviceHeight;
    const nameTop = bottom + deviceGap;
    const lineTop = nameTop + nameHeight + lineGap;
    return {
      ppu: scale,
      center,
      headingTop: top,
      nameTop,
      lineTop,
      accentTop: lineTop + lineHeight + accentGap
    };
  }

  const openingLayout = layout(full);
  const finalLayout = layout(false);
  headingMask.style.top = openingLayout.headingTop + "px";

  // Allocate once, after layout. Include all opening poses rather than clipping
  // the model to the bounds of its final lid angle.
  const viewportPadding = full ? 72 : 40;
  viewportTop = Math.max(0, Math.floor(usableTop - viewportPadding));
  const viewportBottom = Math.min(H, Math.ceil(
    Math.max(openingLayout.nameTop, finalLayout.nameTop) - deviceGap + 28
  ));
  viewportHeight = Math.max(1, viewportBottom - viewportTop);
  canvas.style.top = viewportTop + "px";
  canvas.style.width = W + "px";
  canvas.style.height = viewportHeight + "px";
  renderer.setSize(W, viewportHeight, false);

  const accentWidth = Math.min(textRoom * 0.5, W * 0.43);
  const accent = $("lr-accent");
  const accentLight = $("lr-accent-light");
  accent.style.left = (W - accentWidth) / 2 + "px";
  accent.style.width = accentWidth + "px";
  accent.style.background = V.buttonColor;
  accentLight.style.background = V.buttonInk;

  const buttonRect = { x: 64, y: 752, w: 1312, h: 116 };
  const blue = new THREE.Color(V.buttonColor);
  const pressedBlue = new THREE.Color(V.buttonPressedColor);
  const mixedBlue = new THREE.Color();
  let lastPaintTime = null;

  function paintScreen(t, realTime) {
    if (realTime === lastPaintTime) return;
    lastPaintTime = realTime;

    const wake = smooth(segment(
      t, B.wakeStart, between(B.wakeStart, B.wakeEnd)
    ));
    const scroll = smooth(segment(
      t, B.scrollStart, between(B.scrollStart, B.scrollEnd)
    )) * scrollDistance;
    const complete = realTime >= T.key;
    const afterKey = Math.max(0, realTime - T.key);

    sg.clearRect(0, 0, PW, PH);
    sg.fillStyle = V.bezel;
    sg.fillRect(0, 0, PW, PH);

    if (t < B.wakeStart) {
      screenTexture.needsUpdate = true;
      return;
    }

    // Wake the entire display together. The old vertical shutter cut through
    // the opening headline and left a black band over readable content.
    sg.fillStyle = V.pageBackground;
    sg.fillRect(0, 0, PW, PH);
    const blur = initialBlur * Math.pow(1 - wake, 3);
    sg.save();
    if (blur > 0.2) sg.filter = `blur(${blur.toFixed(2)}px)`;
    sg.drawImage(page, 0, -scroll);
    sg.restore();

    sg.fillStyle = V.pageBackground;
    sg.fillRect(0, 728, PW, PH - 728);

    let pressed = 0;
    if (!complete && t >= B.pressStart) {
      pressed = smooth(segment(
        t, B.pressStart, between(B.pressStart, B.pressEnd)
      ));
    } else if (complete) {
      pressed = 1 - out(segment(afterKey, 0, 0.16));
    }

    if (complete && afterKey < 0.55) {
      const pulse = out(clamp(afterKey / 0.55));
      const padding = 8 + pulse * 56;
      pathRound(
        sg,
        buttonRect.x - padding,
        buttonRect.y - padding,
        buttonRect.w + padding * 2,
        buttonRect.h + padding * 2,
        24 + padding
      );
      sg.strokeStyle = rgba(V.buttonColor, (1 - pulse) * 0.65);
      sg.lineWidth = 10 * (1 - pulse) + 2;
      sg.stroke();
    }

    sg.save();
    sg.translate(
      buttonRect.x + buttonRect.w / 2,
      buttonRect.y + buttonRect.h / 2 + pressed * 5
    );
    const squeeze = 1 - pressed * 0.035;
    sg.scale(squeeze, squeeze);
    mixedBlue.copy(blue).lerp(pressedBlue, clamp(pressed));
    panel(
      sg,
      -buttonRect.w / 2,
      -buttonRect.h / 2,
      buttonRect.w,
      buttonRect.h,
      24,
      mixedBlue.getStyle()
    );

    font(sg, buttonCopy.size, true);
    sg.textAlign = "center";
    sg.textBaseline = "middle";
    sg.fillStyle = V.buttonInk;

    const buttonText = buttonCopy.lines[0] || "";
    const textWidth = sg.measureText(buttonText).width;
    const textX = complete ? 36 : 0;
    sg.fillText(buttonText, textX, -2);

    if (complete) {
      const checkX = textX - textWidth / 2 - 48;
      sg.save();
      sg.translate(checkX, 0);
      sg.beginPath();
      sg.moveTo(-22, -1);
      sg.lineTo(-7, 15);
      sg.lineTo(25, -18);
      sg.strokeStyle = V.buttonInk;
      sg.lineWidth = 9;
      sg.lineCap = "round";
      sg.lineJoin = "round";
      sg.stroke();
      sg.restore();

      const phase = (afterKey * 0.46) % 1;
      const lightX = -buttonRect.w / 2 + phase * (buttonRect.w - 110);
      sg.fillStyle = rgba(V.buttonInk, 0.24);
      sg.fillRect(lightX, buttonRect.h / 2 - 5, 110, 3);
    }
    sg.restore();

    if (t >= B.cursorStart && (!complete || afterKey < 0.24)) {
      const move = smooth(segment(
        t, B.cursorStart, between(B.cursorStart, B.cursorEnd)
      ));
      const arrival = out(segment(t, B.cursorStart, span(3)));
      const depart = complete ? out(clamp(afterKey / 0.24)) : 0;
      const x = 1260 - 110 * move + depart * 230;
      const y = 560 + 250 * move + depart * 140;
      const cursorScale = arrival * (1 - depart);

      sg.save();
      sg.translate(x, y);
      sg.scale(cursorScale, cursorScale);
      sg.beginPath();
      sg.moveTo(0, 0);
      sg.lineTo(0, 74);
      sg.lineTo(19, 55);
      sg.lineTo(32, 84);
      sg.lineTo(46, 77);
      sg.lineTo(32, 49);
      sg.lineTo(60, 47);
      sg.closePath();
      sg.lineJoin = "round";
      sg.lineWidth = 7;
      sg.strokeStyle = V.buttonInk;
      sg.stroke();
      sg.fillStyle = V.pageInk;
      sg.fill();
      sg.restore();
    }

    screenTexture.needsUpdate = true;
  }

  function riseText(el, t, start, distance) {
    const duration = Math.min(span(7), Math.max(span(1), K - start));
    const p = out(segment(t, start, duration), 4);
    el.style.visibility = t <= start ? "hidden" : "visible";
    el.style.transform = `translateY(${((1 - p) * distance).toFixed(4)}px)`;
  }

  function renderAt(inputTime) {
    const time = Math.max(0, number(inputTime, 0));
    const t = designTime(time);
    const opening = back(segment(t, 0, B.openEnd));
    const lidAngle = lerp(initialAngle, finalAngle, opening);
    hinge.rotation.x = Math.PI / 2 - THREE.MathUtils.degToRad(lidAngle);

    const reframe = full
      ? smooth(segment(t, B.scrollStart, between(B.scrollStart, B.scrollEnd)))
      : 1;
    ppu = lerp(openingLayout.ppu, finalLayout.ppu, reframe);
    projectionCenterY = lerp(
      openingLayout.center, finalLayout.center, reframe
    );

    const afterKey = Math.max(0, time - T.key);
    const reaction = time >= T.key && afterKey < 0.28
      ? Math.sin(Math.PI * afterKey / 0.28) * 0.012
      : 0;
    aim(t, reaction);
    paintScreen(t, time);

    if (full) {
      const leave = out(segment(
        t, B.scrollStart, Math.min(span(8), between(B.scrollStart, B.scrollEnd))
      ));
      headingMask.style.visibility = leave >= 1 ? "hidden" : "visible";
      firstHeading.style.visibility = "inherit";
      firstHeading.style.transform =
        `translateY(${(-leave * headerHeight).toFixed(4)}px)`;
    }

    nameMask.style.top =
      lerp(openingLayout.nameTop, finalLayout.nameTop, reframe) + "px";
    lineMask.style.top =
      lerp(openingLayout.lineTop, finalLayout.lineTop, reframe) + "px";
    accent.style.top =
      lerp(openingLayout.accentTop, finalLayout.accentTop, reframe) + "px";

    // Reveal complete words vertically; never hold a sliced product name.
    const nameStart = Math.max(
      B.nameStart, Math.min(B.scrollEnd, K - span(7))
    );
    const lineStart = Math.max(B.lineStart, nameStart);
    riseText(nameEl, t, nameStart, nameHeight);
    riseText(lineEl, t, lineStart, lineHeight);

    const draw = out(segment(
      t, lineStart, Math.max(span(1), K - lineStart)
    ));
    accent.style.transform = `scaleX(${draw.toFixed(5)})`;
    accent.style.visibility = t <= lineStart ? "hidden" : "visible";

    const lightPhase = (afterKey * 0.7) % 1;
    accentLight.style.transform =
      `translateX(${(lightPhase * 440).toFixed(4)}%)`;

    keyLight.position.x = -10 + Math.sin(time * 0.8) * 3.2;
    keyLight.position.z = 11 + Math.sin(time * 0.57) * 1.4;
    fillLight.position.x = 10 + Math.sin(time * 0.67 + 0.8) * 1.7;
    rimLight.intensity = 1.8 + Math.sin(time * 0.9) * 0.18;

    if (overlay || T.exit > 0) {
      const entry = overlay
        ? out(segment(time, 0, Math.min(0.22, T.key * 0.14)), 4)
        : 1;
      const exitDuration = Math.max(0, T.exit - 1 / CA.fps);
      const closing = T.exit > 0
        ? segment(time, T.key + T.hold, exitDuration)
        : 0;
      const aperture = entry * (1 - closing * closing * closing);

      if (aperture >= 0.999999) {
        stageEl.style.clipPath = "none";
      } else {
        const inset = 50 * (1 - aperture);
        stageEl.style.clipPath =
          `polygon(0% ${inset}%,100% ${inset}%,100% ${100 - inset}%,0% ${100 - inset}%)`;
      }
    }

    scene.updateMatrixWorld(true);
    renderer.render(scene, camera);
  }

  window.__timelines["block"] = gsap.timeline({ paused: true });
  window.addEventListener("hf-seek", (event) => renderAt(event.detail.time));
  renderAt(window.__hfThreeTime || 0);
});