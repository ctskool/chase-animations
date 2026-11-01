import * as THREE from "three";

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
  const number = (value, fallback) =>
    Number.isFinite(Number(value)) ? Number(value) : fallback;
  const lerp = (a, b, p) => a + (b - a) * p;
  const segment = (t, start, duration) =>
    duration <= 0 ? (t >= start ? 1 : 0) : clamp((t - start) / duration);
  const smooth = (p) => p * p * (3 - 2 * p);
  const out = (p, power = 3) => 1 - Math.pow(1 - p, power);
  const inOut = (p) =>
    p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
  const back = (p, strength = 0.55) =>
    1 + (strength + 1) * Math.pow(p - 1, 3) +
    strength * Math.pow(p - 1, 2);

  const referenceKey = Math.max(1, number(V.keyFrame, 120));
  const frame = (n) => clamp(number(n, 0) / referenceKey) * K;
  const span = (n) => Math.max(0.001, n / referenceKey * K);
  const designTime = (time) =>
    time <= T.key
      ? time / Math.max(0.001, T.scale)
      : K + time - T.key;

  const B = {};
  B.openEnd = clamp(frame(V.orbitEndFrame), span(10), K * 0.42);
  B.wakeStart = clamp(
    frame(full ? V.wakeStartFrame : V.compactWakeStartFrame),
    0,
    B.openEnd - span(3)
  );
  B.wakeEnd = clamp(
    frame(V.wakeEndFrame),
    B.wakeStart + span(2),
    B.openEnd
  );
  B.scrollStart = clamp(
    frame(V.scrollStartFrame),
    B.openEnd + span(5),
    K - span(40)
  );
  B.scrollEnd = B.scrollStart + clamp(
    frame(V.scrollEndFrame) - B.scrollStart,
    span(3),
    span(8)
  );
  B.cursorStart = clamp(
    frame(V.cursorStartFrame),
    B.scrollEnd + span(4),
    K - span(20)
  );
  B.cursorEnd = clamp(
    frame(V.cursorEndFrame),
    B.cursorStart + span(3),
    K - span(8)
  );
  B.pressStart = clamp(
    frame(V.pressStartFrame),
    B.cursorEnd,
    K - span(2)
  );
  B.pressEnd = clamp(
    frame(V.pressEndFrame),
    B.pressStart + span(1),
    K
  );
  B.nameStart = clamp(
    frame(V.nameStartFrame),
    B.scrollEnd + span(8),
    K - span(7)
  );
  B.lineStart = clamp(
    frame(V.lineStartFrame),
    B.nameStart + span(2),
    K - span(3)
  );
  B.roomStart = Math.max(B.scrollEnd, B.nameStart - span(6));
  B.roomEnd = Math.min(K - span(4), B.nameStart + span(5));
  B.accentStart = Math.max(B.lineStart, K - span(4));

  const initialAngle = clamp(number(V.initialLidAngle, 26), 18, 55);
  const finalAngle = clamp(number(V.finalLidAngle, 104), 96, 110);
  const orbit = clamp(number(V.cameraOrbit, 32), -42, 42);
  const initialElevation = clamp(
    number(V.initialCameraElevation, 9), 7, 15
  );
  const finalElevation = clamp(number(
    full
      ? V.cameraElevation
      : overlay ? V.overlayCameraElevation : V.topCameraElevation,
    full ? 18 : overlay ? 16 : 14
  ), 11, 25);
  const scrollDistance = clamp(number(V.scrollPixels, 1000), 900, 1500);
  const initialBlur = clamp(number(V.screenBlur, 18), 0, 32);
  const brandImpact = clamp(number(V.brandImpact, 0.07), 0.02, 0.12);

  $("lr-background").style.background =
    `linear-gradient(180deg, ${V.bgTop}, ${V.bgBottom})`;
  $("lr-vignette").style.background =
    `radial-gradient(ellipse at 50% 46%, transparent 45%, ${rgba(V.nameInk, 0.045)} 100%)`;
  $("lr-grain").style.backgroundImage = CA.grainUrl(192, 0.17, 31);

  const side = Math.max(number(safe.side, 0), full ? 48 : 32);
  const textRoom = Math.max(160, W - side * 2);
  const usableTop = Math.max(number(safe.top, 0), full ? 230 : 22);
  const usableBottom = Math.min(
    H - number(safe.bottom, 0),
    H - (full ? 300 : 22)
  );
  const usableHeight = Math.max(240, usableBottom - usableTop);

  function pathRound(g, x, y, w, h, radius) {
    const r = Math.max(0, Math.min(radius, w / 2, h / 2));
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

  function panel(g, x, y, w, h, radius, color) {
    pathRound(g, x, y, w, h, radius);
    g.fillStyle = color;
    g.fill();
  }

  function font(g, size, weight) {
    const family = weight >= 700 ? '"Inter Tight"' : "Inter";
    g.font = `${weight} ${size}px ${family}`;
    g.textBaseline = "top";
  }

  const measureCanvas = document.createElement("canvas");
  const measure = measureCanvas.getContext("2d");

  // Balance whole words, including copy supplied with manual line breaks.
  // The last line cannot be a stranded word.
  function balancedLines(words, width, count) {
    const target = measure.measureText(words.join(" ")).width / count;
    const memo = new Map();

    function solve(start, remaining) {
      const key = `${start}:${remaining}`;
      if (memo.has(key)) return memo.get(key);
      if (remaining === 0) {
        return start === words.length ? { cost: 0, lines: [] } : null;
      }

      let best = null;
      const lastEnd = words.length - remaining + 1;
      for (let end = start + 1; end <= lastEnd; end++) {
        if (remaining === 1 && end !== words.length) continue;
        if (
          remaining === 1 &&
          count > 1 &&
          words.length - start < 2
        ) continue;

        const text = words.slice(start, end).join(" ");
        const lineWidth = measure.measureText(text).width;
        if (lineWidth > width) {
          if (remaining === 1) continue;
          break;
        }

        const tail = solve(end, remaining - 1);
        if (!tail) continue;

        const singleWordPenalty =
          end - start === 1 && count > 1 ? width * width * 0.12 : 0;
        const cost =
          Math.pow(lineWidth - target, 2) + singleWordPenalty + tail.cost;

        if (!best || cost < best.cost) {
          best = { cost, lines: [text, ...tail.lines] };
        }
      }

      memo.set(key, best);
      return best;
    }

    const result = solve(0, count);
    return result ? result.lines : null;
  }

  function prepare(text, width, height, preferred, minimum, weight, maxLines) {
    const words = String(text || "").trim().split(/\s+/).filter(Boolean);
    const leading = weight >= 700 ? 1.04 : 1.12;
    if (!words.length) {
      return { lines: [], size: preferred, lineHeight: 0, height: 0, weight };
    }

    const firstSize = Math.max(minimum, Math.round(preferred));
    for (let size = firstSize; size >= minimum; size--) {
      font(measure, size, weight);
      const lineHeight = size * leading;
      for (let count = 1; count <= maxLines; count++) {
        if (count * lineHeight > height) continue;
        const lines = balancedLines(words, width, count);
        if (lines) {
          return {
            lines, size, lineHeight,
            height: lines.length * lineHeight,
            weight
          };
        }
      }
    }

    // Overflow protection removes complete trailing words, never letters.
    font(measure, minimum, weight);
    const lineHeight = minimum * leading;
    const allowed = Math.max(
      1, Math.min(maxLines, Math.floor(height / lineHeight))
    );
    for (let length = words.length - 1; length > 0; length--) {
      const shortened = words.slice(0, length);
      shortened[shortened.length - 1] += "…";
      for (let count = 1; count <= allowed; count++) {
        const lines = balancedLines(shortened, width, count);
        if (lines) {
          return {
            lines, size: minimum, lineHeight,
            height: lines.length * lineHeight,
            weight
          };
        }
      }
    }
    return {
      lines: ["…"], size: minimum, lineHeight, height: lineHeight, weight
    };
  }

  function write(g, copy, x, y, color, align = "center") {
    font(g, copy.size, copy.weight);
    g.fillStyle = color;
    g.textAlign = align;
    copy.lines.forEach((line, index) => {
      g.fillText(line, x, y + index * copy.lineHeight);
    });
    g.textAlign = "left";
  }

  const headingMask = $("lr-heading-mask");
  const headingEl = $("lr-heading-first");
  let headingHeight = 0;
  const headingTop = usableTop + 52;

  if (full) {
    const heading = prepare(
      V.headline, textRoom, Math.min(280, usableHeight * 0.24),
      clamp(number(V.headlineSize, 128), 80, 160),
      64, 700, 2
    );
    headingEl.textContent = heading.lines.join("\n");
    headingEl.style.fontSize = heading.size + "px";
    headingEl.style.color = V.pageInk;
    headingHeight = Math.ceil(heading.height);
    headingMask.style.left = side + "px";
    headingMask.style.width = textRoom + "px";
    headingMask.style.top = headingTop + "px";
    headingMask.style.height = headingHeight + "px";
  } else {
    headingMask.style.display = "none";
    headingEl.textContent = "";
  }

  const nameEl = $("lr-name");
  const lineEl = $("lr-line");
  const nameMask = $("lr-name-mask");
  const lineMask = $("lr-line-mask");
  const accent = $("lr-accent");

  nameEl.textContent = V.productName;
  lineEl.textContent = String(V.shortLine || "")
    .trim()
    .replace(/\s+(\S+)$/, "\u00a0$1");
  nameEl.style.color = V.nameInk;
  lineEl.style.color = V.muted;

  const compactTypeScale = full ? 1 : clamp(usableHeight / 890, 0.8, 1);
  const nameSize = number(
    full ? V.nameSize : overlay ? V.overlayNameSize : V.topNameSize,
    full ? 240 : overlay ? 160 : 148
  ) * compactTypeScale;
  const lineSize = number(
    full ? V.taglineSize : overlay ? V.overlayTaglineSize : V.topTaglineSize,
    full ? 56 : overlay ? 44 : 40
  ) * compactTypeScale;

  nameEl.style.fontSize = clamp(nameSize, full ? 128 : 80, 280) + "px";
  lineEl.style.fontSize =
    clamp(lineSize, full ? 40 : 32, 80) + "px";

  fit(nameEl, textRoom / (1 + brandImpact), full ? 96 : 64);
  lineEl.style.whiteSpace = "nowrap";
  fit(lineEl, textRoom, full ? 40 : 32);
  lineEl.style.whiteSpace = "normal";
  lineEl.style.maxWidth = textRoom + "px";

  const nameTextHeight = Math.ceil(nameEl.getBoundingClientRect().height);
  const lineTextHeight = Math.ceil(lineEl.getBoundingClientRect().height);
  const namePad = full ? 20 : overlay ? 15 : 13;
  const linePad = 5;
  const nameHeight = nameTextHeight + namePad * 2;
  const lineHeight = lineTextHeight + linePad * 2;

  nameEl.style.top = namePad + "px";
  lineEl.style.top = linePad + "px";
  nameMask.style.height = nameHeight + "px";
  lineMask.style.height = lineHeight + "px";

  const deviceGap = full ? 18 : overlay ? 10 : 8;
  const lineGap = full ? -4 : -3;
  const accentGap = full ? 15 : overlay ? 12 : 10;
  const accentThickness = clamp(
    number(V.underlineThickness, 6) * (full ? 1 : 0.8), 3, 10
  );
  const accentWidth = Math.min(
    textRoom * 0.72,
    number(
      full ? V.underlineWidth
        : overlay ? V.overlayUnderlineWidth : V.topUnderlineWidth,
      full ? 440 : overlay ? 360 : 320
    )
  );
  const identityHeight =
    deviceGap + nameHeight + lineGap + lineHeight +
    accentGap + accentThickness;

  accent.style.left = (W - accentWidth) / 2 + "px";
  accent.style.width = accentWidth + "px";
  accent.style.height = accentThickness + "px";
  accent.style.background = V.buttonColor;

  const canvas = $("lr-gl");
  canvas.style.width = W + "px";
  canvas.style.height = H + "px";
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", `${V.product}. ${V.productDescription}`);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    preserveDrawingBuffer: true
  });
  renderer.setPixelRatio(2);
  renderer.setSize(W, H, false);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;

  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(V.studioLight, V.bgBottom, 0.85));

  const keyLight = new THREE.DirectionalLight(V.studioLight, 3);
  keyLight.position.set(-9, 14, 10);
  scene.add(keyLight);
  const fillLight = new THREE.DirectionalLight(V.studioLight, 1.3);
  fillLight.position.set(11, 7, 5);
  scene.add(fillLight);
  const rimLight = new THREE.DirectionalLight(V.studioLight, 2);
  rimLight.position.set(1, 12, -10);
  scene.add(rimLight);

  // Local studio geometry supplies actual softbox reflections.
  const studio = new THREE.Scene();
  studio.background = new THREE.Color(V.bgBottom);

  function softbox(w, h, position, intensity) {
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(V.studioLight).multiplyScalar(intensity),
      side: THREE.DoubleSide
    });
    const box = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
    box.position.set(...position);
    box.lookAt(0, 2, 0);
    studio.add(box);
  }

  softbox(19, 12, [-9, 10, 7], 2.7);
  softbox(11, 18, [11, 7, 3], 1.8);
  softbox(24, 7, [0, 14, -9], 3.1);
  softbox(16, 12, [0, 7, 19], 1.25);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(studio, 0.045, 0.1, 100);
  scene.environment = environment.texture;
  pmrem.dispose();
  studio.traverse((object) => {
    if (object.isMesh) {
      object.geometry.dispose();
      object.material.dispose();
    }
  });

  const aluminium = new THREE.MeshStandardMaterial({
    color: V.silver,
    metalness: 1,
    roughness: 0.25,
    envMapIntensity: 1.15
  });
  const edgeMetal = new THREE.MeshStandardMaterial({
    color: new THREE.Color(V.silver).multiplyScalar(0.82),
    metalness: 1,
    roughness: 0.3,
    envMapIntensity: 1
  });
  const padMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(V.silver).multiplyScalar(0.98),
    metalness: 0.85,
    roughness: 0.38
  });
  const blackGlass = new THREE.MeshStandardMaterial({
    color: V.bezel,
    metalness: 0.12,
    roughness: 0.2,
    envMapIntensity: 0.35
  });
  const keyMaterial = new THREE.MeshStandardMaterial({
    color: V.keys,
    metalness: 0.08,
    roughness: 0.58,
    envMapIntensity: 0.28
  });
  const wellMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(V.keys).multiplyScalar(0.75),
    roughness: 0.72,
    metalness: 0.05
  });

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

  // Planar corner radius is independent of panel thickness.
  function panelGeometry(w, h, depth, radius) {
    const bevel = Math.min(0.04, depth * 0.22, radius * 0.25);
    const geometry = new THREE.ExtrudeGeometry(
      outline(w - bevel * 2, h - bevel * 2, radius - bevel),
      {
        depth: depth - bevel * 2,
        bevelEnabled: true,
        bevelThickness: bevel,
        bevelSize: bevel,
        bevelSegments: 3,
        curveSegments: 12,
        steps: 1
      }
    );
    geometry.translate(0, 0, -depth / 2 + bevel);
    return geometry;
  }

  function horizontalPanel(w, depth, thickness, radius, material) {
    const geometry = panelGeometry(w, depth, thickness, radius);
    geometry.rotateX(-Math.PI / 2);
    return new THREE.Mesh(geometry, material);
  }

  function displayGeometry(w, h, radius) {
    const geometry = new THREE.ShapeGeometry(outline(w, h, radius), 12);
    const positions = geometry.attributes.position;
    const uv = new Float32Array(positions.count * 2);
    for (let i = 0; i < positions.count; i++) {
      uv[i * 2] = positions.getX(i) / w + 0.5;
      uv[i * 2 + 1] = positions.getY(i) / h + 0.5;
    }
    geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    return geometry;
  }

  const laptop = new THREE.Group();
  scene.add(laptop);

  const chassisGeometry = panelGeometry(14.8, 9.4, 0.32, 0.48);
  chassisGeometry.rotateX(-Math.PI / 2);
  const chassisPositions = chassisGeometry.attributes.position;
  for (let i = 0; i < chassisPositions.count; i++) {
    const front = clamp((chassisPositions.getZ(i) + 4.7) / 9.4);
    const y = chassisPositions.getY(i);
    chassisPositions.setY(i, 0.16 - (0.16 - y) * (1 - front * 0.27));
  }
  chassisGeometry.computeVertexNormals();
  const chassis = new THREE.Mesh(chassisGeometry, aluminium);
  chassis.position.y = 0.21;
  laptop.add(chassis);

  const deck = horizontalPanel(14.63, 9.22, 0.045, 0.44, aluminium);
  deck.position.y = 0.393;
  laptop.add(deck);

  const keyboardWell = horizontalPanel(
    12.1, 4.05, 0.014, 0.24, wellMaterial
  );
  keyboardWell.position.set(0, 0.423, -1.49);
  laptop.add(keyboardWell);

  const keyGeometry = panelGeometry(0.7, 0.55, 0.05, 0.085);
  keyGeometry.rotateX(-Math.PI / 2);
  const keyTransforms = [];

  function keyboardRow(widths, z, depth, gap) {
    const total =
      widths.reduce((sum, width) => sum + width, 0) +
      gap * (widths.length - 1);
    let x = -total / 2;
    widths.forEach((width) => {
      keyTransforms.push({ x: x + width / 2, z, width, depth });
      x += width + gap;
    });
  }

  keyboardRow(Array(15).fill(0.64), -3.13, 0.32, 0.14);
  keyboardRow([...Array(13).fill(0.7), 1.06], -2.56, 0.52, 0.11);
  keyboardRow([1.04, ...Array(12).fill(0.7), 1.04], -1.91, 0.52, 0.1);
  keyboardRow([1.22, ...Array(11).fill(0.7), 1.22], -1.26, 0.52, 0.11);
  keyboardRow([1.56, ...Array(10).fill(0.7), 1.56], -0.61, 0.52, 0.12);
  keyboardRow([1, 1, 1, 5, 1, 1, 1], 0.04, 0.52, 0.1);

  const dummy = new THREE.Object3D();
  const keys = new THREE.InstancedMesh(
    keyGeometry, keyMaterial, keyTransforms.length
  );
  keyTransforms.forEach((key, index) => {
    dummy.position.set(key.x, 0.459, key.z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(key.width / 0.7, 1, key.depth / 0.55);
    dummy.updateMatrix();
    keys.setMatrixAt(index, dummy.matrix);
  });
  keys.instanceMatrix.needsUpdate = true;
  laptop.add(keys);

  const padBorder = horizontalPanel(5.26, 2.66, 0.009, 0.2, edgeMetal);
  padBorder.position.set(0, 0.421, 2.36);
  const pad = horizontalPanel(5.21, 2.61, 0.009, 0.18, padMaterial);
  pad.position.set(0, 0.424, 2.36);
  laptop.add(padBorder, pad);

  const speakers = new THREE.InstancedMesh(
    new THREE.CircleGeometry(0.014, 6), wellMaterial, 120
  );
  let speakerIndex = 0;
  [-1, 1].forEach((sideSign) => {
    for (let row = 0; row < 20; row++) {
      for (let column = 0; column < 3; column++) {
        dummy.position.set(
          sideSign * (6.5 + column * 0.105),
          0.419,
          -3.12 + row * 0.18
        );
        dummy.rotation.set(-Math.PI / 2, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        speakers.setMatrixAt(speakerIndex++, dummy.matrix);
      }
    }
  });
  speakers.instanceMatrix.needsUpdate = true;
  laptop.add(speakers);

  const hingeY = 0.45;
  const hingeZ = -4.18;

  function hingeCylinder(x, length, radius, material) {
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, length, 28),
      material
    );
    mesh.rotation.z = Math.PI / 2;
    mesh.position.set(x, hingeY, hingeZ);
    laptop.add(mesh);
  }

  hingeCylinder(0, 7.55, 0.145, wellMaterial);
  hingeCylinder(-5.02, 1.86, 0.205, edgeMetal);
  hingeCylinder(5.02, 1.86, 0.205, edgeMetal);

  const hinge = new THREE.Group();
  hinge.position.set(0, hingeY, hingeZ);
  laptop.add(hinge);

  const lid = new THREE.Mesh(
    panelGeometry(14.28, 9.06, 0.24, 0.3),
    aluminium
  );
  lid.position.set(0, 4.46, 0);
  hinge.add(lid);

  const bezel = new THREE.Mesh(
    displayGeometry(14.12, 8.9, 0.25), blackGlass
  );
  bezel.position.set(0, 4.46, 0.132);
  hinge.add(bezel);

  const cameraDot = new THREE.Mesh(
    new THREE.CircleGeometry(0.027, 16),
    new THREE.MeshBasicMaterial({ color: V.keys })
  );
  cameraDot.position.set(0, 8.845, 0.145);
  hinge.add(cameraDot);

  const PW = 1600;
  const PH = 1000;
  const frameCanvas = document.createElement("canvas");
  frameCanvas.width = PW;
  frameCanvas.height = PH;
  const fg = frameCanvas.getContext("2d");

  const screenCanvas = document.createElement("canvas");
  screenCanvas.width = PW;
  screenCanvas.height = PH;
  const sg = screenCanvas.getContext("2d");

  const screenTexture = new THREE.CanvasTexture(screenCanvas);
  screenTexture.colorSpace = THREE.SRGBColorSpace;
  screenTexture.anisotropy = Math.min(
    8, renderer.capabilities.getMaxAnisotropy()
  );
  screenTexture.minFilter = THREE.LinearFilter;
  screenTexture.magFilter = THREE.LinearFilter;
  screenTexture.generateMipmaps = false;

  const display = new THREE.Mesh(
    displayGeometry(13.92, 8.7, 0.19),
    new THREE.MeshBasicMaterial({
      map: screenTexture,
      toneMapped: false
    })
  );
  display.position.set(0, 4.43, 0.145);
  hinge.add(display);

  const reflection = new THREE.Mesh(
    displayGeometry(13.92, 8.7, 0.19),
    new THREE.MeshPhysicalMaterial({
      color: V.studioLight,
      transparent: true,
      opacity: 0.028,
      roughness: 0.16,
      metalness: 0.1,
      clearcoat: 1,
      clearcoatRoughness: 0.13,
      envMapIntensity: 0.5,
      depthWrite: false
    })
  );
  reflection.position.set(0, 4.43, 0.155);
  reflection.renderOrder = 2;
  hinge.add(reflection);

  function contactShadow(width, depth, opacity, y) {
    const shadowCanvas = document.createElement("canvas");
    shadowCanvas.width = shadowCanvas.height = 256;
    const g = shadowCanvas.getContext("2d");
    const gradient = g.createRadialGradient(128, 128, 20, 128, 128, 128);
    gradient.addColorStop(0, rgba(V.nameInk, opacity));
    gradient.addColorStop(0.48, rgba(V.nameInk, opacity * 0.55));
    gradient.addColorStop(1, rgba(V.nameInk, 0));
    g.fillStyle = gradient;
    g.fillRect(0, 0, 256, 256);

    const texture = new THREE.CanvasTexture(shadowCanvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(width, depth),
      new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
        toneMapped: false
      })
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(0, y, 0.15);
    scene.add(mesh);
  }

  contactShadow(20, 12.8, 0.16, 0.002);
  contactShadow(15.7, 9.6, 0.17, 0.008);

  const padding = clamp(number(V.screenPadding, 96), 80, 144);
  const titleSize = clamp(number(V.screenTitleSize, 160), 132, 184);
  const bodySize = clamp(number(V.screenTextSize, 90), 84, 110);
  const ctaSize = clamp(number(V.screenButtonSize, 92), 84, 108);

  const buttonRect = {
    x: padding,
    y: PH - padding - 132,
    w: PW - padding * 2,
    h: 132
  };
  const contentTop = padding;
  const contentBottom = buttonRect.y - 48;
  const contentHeight = contentBottom - contentTop;
  const clipTop = 32;
  const clipBottom = buttonRect.y - 40;

  const openingCopy = prepare(
    V.headline, PW - padding * 2, contentHeight * 0.46,
    titleSize, 132, 700, 2
  );
  const preview = {
    x: padding,
    y: contentTop + openingCopy.height + 28,
    w: PW - padding * 2
  };
  preview.h = contentBottom - preview.y;

  const projectCopy = prepare(
    V.projectTitle, preview.w - 88, 128,
    clamp(number(V.projectTitleSize, 104), 84, 116),
    84, 700, 1
  );
  const projectDescription = prepare(
    V.projectDescription, preview.w - 88,
    Math.max(100, preview.h - 48 - projectCopy.height - 12 - 28),
    bodySize, 84, 500, 1
  );
  const projectTitleY = preview.y + 24;
  const projectDescriptionY = projectTitleY + projectCopy.height + 12;
  const openingTextBottom = projectDescriptionY + projectDescription.height;

  const sectionCopy = prepare(
    V.sectionHeadline, PW - padding * 2, contentHeight * 0.54,
    titleSize, 132, 700, 2
  );
  const sectionDescription = prepare(
    V.sectionDescription, PW - padding * 2, contentHeight * 0.4,
    bodySize, 84, 500, 2
  );
  const sectionHeight = sectionCopy.height + 32 + sectionDescription.height;
  const sectionTop =
    contentTop + Math.max(0, (contentHeight - sectionHeight) / 2);
  const sectionDescriptionY = sectionTop + sectionCopy.height + 32;
  const sectionBottom = sectionDescriptionY + sectionDescription.height;

  const buttonCopy = prepare(
    V.button, buttonRect.w - 240, buttonRect.h - 24,
    ctaSize, 84, 700, 1
  );

  const camera = new THREE.PerspectiveCamera(32, W / H, 0.5, 180);
  const look = new THREE.Vector3(0, 3.8, -0.15);

  function setLid(angle) {
    hinge.rotation.x = Math.PI / 2 - THREE.MathUtils.degToRad(angle);
    laptop.updateMatrixWorld(true);
  }

  function worldPoints() {
    const points = [];
    [-7.48, 7.48].forEach((x) => {
      [0.03, 0.65].forEach((y) => {
        [-4.78, 4.78].forEach((z) => {
          points.push(new THREE.Vector3(x, y, z));
        });
      });
    });
    [-7.16, 7.16].forEach((x) => {
      [-0.1, 9.02].forEach((y) => {
        [-0.14, 0.17].forEach((z) => {
          points.push(
            new THREE.Vector3(x, y, z).applyMatrix4(hinge.matrixWorld)
          );
        });
      });
    });
    return points;
  }

  function poseCamera(distance, azimuthDegrees, elevationDegrees) {
    if (camera.view) camera.view.enabled = false;
    camera.zoom = 1;
    const azimuth = THREE.MathUtils.degToRad(azimuthDegrees);
    const elevation = THREE.MathUtils.degToRad(elevationDegrees);
    camera.position.set(
      look.x + Math.sin(azimuth) * Math.cos(elevation) * distance,
      look.y + Math.sin(elevation) * distance,
      look.z + Math.cos(azimuth) * Math.cos(elevation) * distance
    );
    camera.lookAt(look);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld(true);
  }

  function projectedBounds(points) {
    let left = Infinity;
    let right = -Infinity;
    let top = Infinity;
    let bottom = -Infinity;
    points.forEach((point) => {
      const p = point.clone().project(camera);
      const x = (p.x + 1) * W / 2;
      const y = (1 - p.y) * H / 2;
      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
    });
    return { left, right, top, bottom, w: right - left, h: bottom - top };
  }

  function solveDistance(points, azimuth, elevation, width, height) {
    let low = 19;
    let high = 150;
    for (let i = 0; i < 18; i++) {
      const distance = (low + high) / 2;
      poseCamera(distance, azimuth, elevation);
      const bounds = projectedBounds(points);
      if (bounds.w > width || bounds.h > height) low = distance;
      else high = distance;
    }
    poseCamera(high, azimuth, elevation);
    return { distance: high, bounds: projectedBounds(points) };
  }

  const widthPercent = clamp(number(
    full ? V.fullLaptopWidth
      : overlay ? V.overlayLaptopWidth : V.topLaptopWidth,
    full ? 97 : 96
  ), 78, 98);
  const finalWidth = W * widthPercent / 100;
  const heroWidth = Math.min(W - 24, finalWidth + (full ? 8 : 20));

  setLid(finalAngle);
  const finalPoints = worldPoints();
  const finalFit = solveDistance(
    finalPoints, 0, finalElevation,
    finalWidth, Math.max(120, usableHeight - identityHeight)
  );
  const finalHeight = finalFit.bounds.h;
  const packedHeight = finalHeight + identityHeight;
  const finalTop =
    usableTop + Math.max(0, (usableHeight - packedHeight) / 2);
  const finalCenter = finalTop + finalHeight / 2;

  const nameTop = finalTop + finalHeight + deviceGap;
  const lineTop = nameTop + nameHeight + lineGap;
  nameMask.style.top = nameTop + "px";
  lineMask.style.top = lineTop + "px";
  accent.style.top = lineTop + lineHeight + accentGap + "px";

  const heroFit = solveDistance(
    finalPoints, 0, finalElevation,
    heroWidth, usableHeight * (full ? 0.91 : 0.97)
  );
  const heroCenter =
    usableTop + usableHeight / 2 + (full ? 28 : 0);

  setLid(initialAngle);
  const initialPoints = worldPoints();
  const initialRoomTop = full
    ? Math.min(
        headingTop + headingHeight + 44,
        usableTop + usableHeight * 0.48
      )
    : usableTop;
  const initialFit = solveDistance(
    initialPoints, orbit, initialElevation,
    heroWidth, Math.max(160, usableBottom - initialRoomTop - 20)
  );
  const initialCenter = full
    ? (initialRoomTop + usableBottom - 20) / 2
    : heroCenter;

  const blue = new THREE.Color(V.buttonColor);
  const pressedBlue = new THREE.Color(V.buttonPressedColor);
  const mixedBlue = new THREE.Color();

  function wholeTextFits(top, bottom, dy) {
    return top + dy >= clipTop && bottom + dy <= clipBottom;
  }

  function drawOpening(g, dy) {
    const y = preview.y + dy;
    panel(
      g, preview.x, y, preview.w, preview.h, 25, V.workspaceSurface
    );
    pathRound(g, preview.x, y, preview.w, preview.h, 25);
    g.lineWidth = 2;
    g.strokeStyle = rgba(V.pageInk, 0.075);
    g.stroke();

    panel(g, preview.x + 22, y + 27, 5, preview.h - 54, 2.5, V.buttonColor);

    // Quiet product-picture details; no miniature labels or duplicate copy.
    const barY = y + preview.h - 30;
    panel(
      g, preview.x + 44, barY, preview.w * 0.43, 9, 4.5,
      rgba(V.buttonColor, 0.2)
    );
    panel(
      g, preview.x + 44, barY, preview.w * 0.27, 9, 4.5,
      V.buttonColor
    );
    panel(
      g, preview.x + preview.w - 106, barY - 6, 58, 20, 10,
      rgba(V.pageInk, 0.08)
    );

    // Remove the entire reading group before any glyph reaches the bezel.
    if (wholeTextFits(contentTop, openingTextBottom, dy)) {
      write(g, openingCopy, PW / 2, contentTop + dy, V.pageInk);
      write(
        g, projectCopy, preview.x + 44,
        projectTitleY + dy, V.pageInk, "left"
      );
      write(
        g, projectDescription, preview.x + 44,
        projectDescriptionY + dy, V.muted, "left"
      );
    }
  }

  function drawSection(g, dy) {
    // Headline and supporting copy arrive together, fully inside their area.
    if (!wholeTextFits(sectionTop, sectionBottom, dy)) return;
    write(g, sectionCopy, PW / 2, sectionTop + dy, V.pageInk);
    write(
      g, sectionDescription, PW / 2,
      sectionDescriptionY + dy, V.muted
    );
  }

  function drawButton(g, pressed, complete, afterKey, pageSettle) {
    const centerX = buttonRect.x + buttonRect.w / 2;
    const centerY = buttonRect.y + buttonRect.h / 2 + pageSettle;

    if (complete && afterKey < 0.3) {
      const pulse = out(segment(afterKey, 0, 0.3));
      const expansion = 8 + 25 * pulse;
      pathRound(
        g,
        buttonRect.x - expansion,
        buttonRect.y + pageSettle - expansion,
        buttonRect.w + expansion * 2,
        buttonRect.h + expansion * 2,
        22 + expansion
      );
      g.strokeStyle = rgba(V.buttonColor, 0.7 * (1 - pulse));
      g.lineWidth = 5 * (1 - pulse) + 1;
      g.stroke();
    }

    g.save();
    g.translate(centerX, centerY + pressed * 5);
    const squeeze = 1 - pressed * 0.028;
    g.scale(squeeze, squeeze);
    mixedBlue.copy(blue).lerp(pressedBlue, clamp(pressed));
    panel(
      g, -buttonRect.w / 2, -buttonRect.h / 2,
      buttonRect.w, buttonRect.h, 22, mixedBlue.getStyle()
    );

    font(g, buttonCopy.size, 700);
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillStyle = V.buttonInk;

    const label = buttonCopy.lines[0] || "";
    const labelWidth = g.measureText(label).width;
    const textX = complete ? 31 : 0;
    g.fillText(label, textX, -2);

    if (complete) {
      const checkX = textX - labelWidth / 2 - 51;
      g.beginPath();
      g.moveTo(checkX - 20, -1);
      g.lineTo(checkX - 6, 13);
      g.lineTo(checkX + 23, -17);
      g.strokeStyle = V.buttonInk;
      g.lineWidth = 8;
      g.lineCap = "round";
      g.lineJoin = "round";
      g.stroke();
    }
    g.restore();
  }

  function drawCursor(g, t, complete, afterKey, pressed) {
    if (t < B.cursorStart || (complete && afterKey >= 0.16)) return;
    const move = out(segment(
      t, B.cursorStart, B.cursorEnd - B.cursorStart
    ));
    const leave = complete ? out(segment(afterKey, 0, 0.16)) : 0;
    const targetX = buttonRect.x + buttonRect.w * 0.81;
    const targetY = buttonRect.y + buttonRect.h * 0.55;
    const x = lerp(PW - padding - 30, targetX, move) + leave * 250;
    const y = lerp(buttonRect.y - 260, targetY, move) + leave * 80;

    // Withdraw the whole pointer rather than leaving a clipped arrowhead.
    if (x + 62 > PW - 14 || y + 86 > PH - 14) return;

    const arrival = out(segment(t, B.cursorStart, span(3)));
    const size = arrival * (1 - pressed * 0.09);
    g.save();
    g.translate(x, y + pressed * 3);
    g.scale(size, size);
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(0, 69);
    g.lineTo(18, 51);
    g.lineTo(31, 79);
    g.lineTo(43, 73);
    g.lineTo(30, 46);
    g.lineTo(56, 44);
    g.closePath();
    g.lineJoin = "round";
    g.lineWidth = 6;
    g.strokeStyle = V.buttonInk;
    g.stroke();
    g.fillStyle = V.pageInk;
    g.fill();
    g.restore();
  }

  function paintScreen(t, time) {
    const wake = smooth(segment(
      t, B.wakeStart, B.wakeEnd - B.wakeStart
    ));
    sg.clearRect(0, 0, PW, PH);
    sg.fillStyle = V.bezel;
    sg.fillRect(0, 0, PW, PH);

    // The exterior hook has already disappeared before this can draw copy.
    if (wake <= 0) {
      screenTexture.needsUpdate = true;
      return;
    }

    const complete = time >= T.key;
    const afterKey = Math.max(0, time - T.key);
    const scroll = inOut(segment(
      t, B.scrollStart, B.scrollEnd - B.scrollStart
    ));
    const pageSettle = (1 - out(wake)) * 20;

    let pressed = 0;
    if (complete) {
      pressed = 1 - out(segment(afterKey, 0, 0.18), 4);
    } else {
      pressed = smooth(segment(
        t, B.pressStart, B.pressEnd - B.pressStart
      ));
    }

    fg.clearRect(0, 0, PW, PH);
    fg.fillStyle = V.pageBackground;
    fg.fillRect(0, 0, PW, PH);

    fg.save();
    fg.beginPath();
    fg.rect(0, clipTop, PW, clipBottom - clipTop);
    fg.clip();
    if (scroll < 1) {
      drawOpening(fg, -scroll * scrollDistance + pageSettle);
    }
    if (scroll > 0) {
      drawSection(fg, (1 - scroll) * scrollDistance + pageSettle);
    }
    fg.restore();

    drawButton(fg, pressed, complete, afterKey, pageSettle);
    drawCursor(fg, t, complete, afterKey, pressed);

    // Brightness and softness change together across the entire screen.
    // The background remains black underneath, avoiding a white wake-up cut.
    sg.save();
    sg.globalAlpha = wake;
    const blur = initialBlur * Math.pow(1 - wake, 2);
    if (blur > 0.15) sg.filter = `blur(${blur.toFixed(3)}px)`;
    sg.drawImage(frameCanvas, 0, 0);
    sg.restore();
    screenTexture.needsUpdate = true;
  }

  function renderAt(inputTime) {
    const time = Math.max(0, number(inputTime, 0));
    const t = designTime(time);
    const complete = time >= T.key;
    const afterKey = Math.max(0, time - T.key);

    const opening = segment(t, 0, B.openEnd);
    const orbitProgress = out(opening, 3);
    setLid(lerp(initialAngle, finalAngle, back(opening)));

    const room = inOut(segment(
      t, B.roomStart, Math.max(span(1), B.roomEnd - B.roomStart)
    ));
    const distance = lerp(
      lerp(initialFit.distance, heroFit.distance, orbitProgress),
      finalFit.distance,
      room
    );
    const centerY = lerp(
      lerp(initialCenter, heroCenter, smooth(opening)),
      finalCenter,
      room
    );
    const azimuth = orbit * (1 - orbitProgress);
    const elevation = lerp(
      initialElevation, finalElevation, smooth(opening)
    );

    poseCamera(distance, azimuth, elevation);
    const bounds = projectedBounds(worldPoints());
    const guard = Math.min(
      1,
      (W - 24) / Math.max(1, bounds.w),
      usableHeight / Math.max(1, bounds.h)
    );
    const cameraResponse = complete && afterKey < 0.24
      ? 0.012 * Math.exp(-afterKey * 18)
      : 0;
    const zoom = guard * (1 + cameraResponse);
    const middleX =
      W / 2 + ((bounds.left + bounds.right) / 2 - W / 2) * zoom;
    const middleY =
      H / 2 + ((bounds.top + bounds.bottom) / 2 - H / 2) * zoom;

    camera.zoom = zoom;
    camera.setViewOffset(
      W, H, middleX - W / 2, middleY - centerY, W, H
    );
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld(true);

    if (full) {
      const visible = t < B.wakeStart;
      const depart = out(segment(
        t, Math.max(0, B.wakeStart - span(4)), span(4)
      ));
      headingMask.style.visibility = visible ? "visible" : "hidden";
      headingEl.style.visibility = visible ? "visible" : "hidden";
      headingEl.style.transform =
        `translateY(${(-36 * depart).toFixed(4)}px) scale(${(1 - depart * 0.045).toFixed(5)})`;
    }

    const nameEnterDuration = Math.max(
      span(1), Math.min(span(7), (K - B.nameStart) * 0.68)
    );
    const nameEnter = segment(t, B.nameStart, nameEnterDuration);
    const anticipation = complete ? 0 : smooth(
      segment(t, K - span(4), span(4))
    );
    let nameY =
      (1 - back(nameEnter, 0.4)) * (nameTextHeight + namePad) +
      anticipation * 6;
    let nameScale = 0.94 + 0.06 * out(nameEnter) - anticipation * 0.025;

    if (complete) {
      nameY = 0;
      nameScale = afterKey < 0.28
        ? 1 + brandImpact *
          Math.exp(-afterKey * 16) * Math.cos(afterKey * 24)
        : 1;
    }

    nameEl.style.visibility = t > B.nameStart ? "visible" : "hidden";
    nameEl.style.transform =
      `translateY(${nameY.toFixed(4)}px) scale(${nameScale.toFixed(5)})`;

    const lineEnter = out(segment(
      t, B.lineStart, Math.max(span(1), K - B.lineStart)
    ), 4);
    lineEl.style.visibility = t > B.lineStart ? "visible" : "hidden";
    lineEl.style.transform =
      `translateY(${((1 - lineEnter) * (lineTextHeight + linePad)).toFixed(4)}px)`;

    const draw = out(segment(
      t, B.accentStart, Math.max(span(1), K - B.accentStart)
    ), 3);
    accent.style.visibility = t > B.accentStart ? "visible" : "hidden";
    accent.style.transform = `scaleX(${draw.toFixed(6)})`;

    paintScreen(t, time);

    // Only the studio reflections travel during the final reading hold.
    keyLight.position.x = -9 + Math.sin(time * 0.65) * 3.8;
    keyLight.position.z = 10 + Math.sin(time * 0.47) * 1.6;
    fillLight.position.x = 11 + Math.sin(time * 0.52 + 0.7) * 2;
    rimLight.intensity = 2 + Math.sin(time * 0.72) * 0.15;
    if (scene.environmentRotation) {
      scene.environmentRotation.y = Math.sin(time * 0.48) * 0.075;
    }

    if (overlay || T.exit > 0) {
      const entry = overlay
        ? out(segment(time, 0, Math.min(0.22, T.key * 0.14)), 4)
        : 1;
      const exitDuration = Math.max(0, T.exit - 1 / CA.fps);
      const closing = T.exit > 0
        ? segment(time, T.key + T.hold, exitDuration)
        : 0;
      const aperture = entry * (1 - out(closing, 3));

      stageEl.style.clipPath = aperture >= 0.999999
        ? "none"
        : aperture <= 0
          ? "inset(50% 0 50% 0)"
          : `inset(${(50 * (1 - aperture)).toFixed(6)}% 0)`;
    }

    scene.updateMatrixWorld(true);
    renderer.render(scene, camera);
  }

  window.__timelines["block"] = gsap.timeline({ paused: true });
  window.addEventListener("hf-seek", (event) => renderAt(event.detail.time));
  renderAt(window.__hfThreeTime || 0);
});