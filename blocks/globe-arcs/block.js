import * as THREE from "three";

CA.ready(async () => {
  const { vars: V, stage: S, safe, time: T, variant, make, rgba } = CA;
  const $ = (id) => document.getElementById(id);
  const W = S.w;
  const H = S.h;
  const isTop = variant === "top";
  const isOverlay = variant === "overlay";
  const compactTop = isTop && H < W * 0.68;
  const wideHeader = isOverlay || (isTop && !compactTop);
  const rad = Math.PI / 180;
  const clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, n));
  const finite = (n, fallback) =>
    Number.isFinite(Number(n)) ? Number(n) : fallback;
  const progress = (t, at, duration) =>
    clamp((t - at) / Math.max(0.0001, duration));
  const out = (p) => 1 - Math.pow(1 - p, 3);
  const smooth = (p) => p * p * (3 - 2 * p);
  const spring = (p) => {
    const q = p - 1;
    return 1 + 2.8 * q * q * q + 1.8 * q * q;
  };
  const designTime = (time) =>
    time <= T.key
      ? time / Math.max(0.0001, T.scale)
      : T.design + time - T.key;

  const vector = (latitude, longitude) => {
    const lat = clamp(finite(latitude, 0), -89.999, 89.999) * rad;
    const lon = finite(longitude, 0) * rad;
    return new THREE.Vector3(
      Math.cos(lat) * Math.sin(lon),
      Math.sin(lat),
      Math.cos(lat) * Math.cos(lon)
    );
  };

  const rawRoutes = [1, 2, 3, 4].map((i) => ({
    city: String(V[`destination${i}City`] || "").trim(),
    latitude: V[`destination${i}Latitude`],
    longitude: V[`destination${i}Longitude`],
    transfer: String(V[`destination${i}Transfer`] || "").trim(),
    cumulative: finite(V[`destination${i}Cumulative`], 0),
    departureFrame: finite(V[`destination${i}DepartureFrame`], 0),
    landingFrame: finite(V[`destination${i}LandingFrame`], 1)
  })).filter((route) => route.city);

  let previousFrame = -1;
  rawRoutes.forEach((route) => {
    route.departureFrame = Math.max(0, previousFrame + 1, route.departureFrame);
    route.landingFrame = Math.max(route.departureFrame + 1, route.landingFrame);
    previousFrame = route.landingFrame;
  });

  const sourceFps = Math.max(1, finite(V.sourceFps, 30));
  const finalFrame = rawRoutes.length
    ? rawRoutes[rawRoutes.length - 1].landingFrame
    : 108;
  const sourceScale = T.design / (finalFrame / sourceFps);
  const frameTime = (frame) => frame / sourceFps * sourceScale;

  rawRoutes.forEach((route, i) => {
    route.depart = frameTime(route.departureFrame);
    route.land = i === rawRoutes.length - 1
      ? T.design
      : frameTime(route.landingFrame);
    route.value = i === rawRoutes.length - 1
      ? finite(V.finalNumber, 128)
      : route.cumulative;
  });

  const stopAt = Math.max(
    T.design,
    frameTime(finite(V.motionStopFrame, 120))
  );
  const side = Math.max(finite(safe.side, 0), isTop || isOverlay ? 32 : 54);
  const minimumText = variant === "full" ? 40 : 32;
  const stageEl = $("stage");
  const copy = $("ga-copy");
  const heading = $("ga-heading");
  const stat = $("ga-stat");
  const number = $("ga-number");
  const unit = $("ga-unit");
  const caption = $("ga-caption");
  const headingMask = $("ga-heading-mask");
  const captionMask = $("ga-caption-mask");

  copy.classList.add(
    wideHeader ? "ga-layout-wide" : compactTop ? "ga-layout-side" : "ga-layout-full"
  );

  const copyWidth = compactTop ? W * 0.34 : W - side * 2;
  copy.style.left = side + "px";
  copy.style.width = Math.max(1, copyWidth) + "px";
  copy.style.top = "0px";

  heading.textContent = String(V.label);
  heading.style.color = V.labelColor;
  heading.style.fontSize =
    (compactTop ? 36 : isTop ? 40 : isOverlay ? 36 : 44) + "px";

  unit.textContent = String(V.unit);
  unit.style.color = V.muted;
  unit.style.fontSize =
    (compactTop ? 44 : isTop ? 54 : isOverlay ? 50 : 68) + "px";

  number.style.color = V.ink;
  caption.style.color = V.muted;
  caption.style.fontSize =
    (compactTop ? 38 : isTop ? 42 : isOverlay ? 40 : 48) + "px";

  const decimals = Math.round(clamp(finite(V.numberDecimals, 0), 0, 8));
  const format = (value) => finite(value, 0).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
  const values = [
    finite(V.startingNumber, 0),
    ...rawRoutes.map((route) => route.value),
    finite(V.finalNumber, 128)
  ];

  let numberPx = compactTop ? 192 : isTop ? 224 : isOverlay ? 224 : 312;
  const statWidth = stat.getBoundingClientRect().width;
  const unitWidth = unit.getBoundingClientRect().width;
  const gap = wideHeader || compactTop ? 12 : 16;
  const numberRoom = Math.max(
    minimumText,
    statWidth / 1.12 - unitWidth - gap - 8
  );

  const measureNumbers = () => {
    number.style.fontSize = numberPx + "px";
    let widest = 0;
    values.forEach((value) => {
      number.textContent = format(value);
      widest = Math.max(widest, number.getBoundingClientRect().width);
    });
    return widest;
  };

  let numberWidth = measureNumbers();
  while (numberWidth > numberRoom && numberPx > minimumText) {
    numberPx -= 1;
    numberWidth = measureNumbers();
  }
  number.style.fontSize = numberPx + "px";
  number.textContent = format(values[0]);

  const captions = [
    String(V.originCity),
    ...rawRoutes.map((route) =>
      route.city + (route.transfer ? " · " + route.transfer : "")
    )
  ];

  let captionHeight = 0;
  captions.forEach((text) => {
    caption.textContent = text;
    captionHeight = Math.max(captionHeight, caption.getBoundingClientRect().height);
  });
  captionMask.style.minHeight = Math.ceil(captionHeight) + "px";
  caption.textContent = String(V.originCity);
  headingMask.style.minHeight =
    Math.ceil(heading.getBoundingClientRect().height) + "px";

  const copyHeight = copy.getBoundingClientRect().height;
  let radiusPx;
  let centerX;
  let centerY;
  let copyTop;
  let globeTop;
  let bottomInset;

  // Reserve the complete silhouette, including the expanding payoff ring.
  // In particular, the half-height output must never crop the lower ocean.
  const silhouette = 1.10;

  if (compactTop) {
    const topInset = Math.max(28, finite(safe.top, 0));
    bottomInset = Math.max(28, finite(safe.bottom, 0));
    const availableHeight = Math.max(1, H - topInset - bottomInset);
    const mapLeft = side + copyWidth + 24;
    const availableWidth = Math.max(1, W - side - mapLeft);

    radiusPx = Math.min(
      availableWidth / (2 * silhouette),
      availableHeight / (2 * silhouette)
    );
    centerX = mapLeft + availableWidth / 2;
    centerY = topInset + availableHeight / 2;
    copyTop = clamp(
      topInset + (availableHeight - copyHeight) / 2,
      topInset,
      Math.max(topInset, H - bottomInset - copyHeight)
    );
    globeTop = topInset;
  } else if (isTop) {
    copyTop = Math.max(28, finite(safe.top, 0));
    bottomInset = Math.max(28, finite(safe.bottom, 0));
    globeTop = copyTop + copyHeight + 20;
    const availableHeight = Math.max(1, H - bottomInset - globeTop);

    radiusPx = Math.min(
      (W - side * 2) / (2 * silhouette),
      availableHeight / (2 * silhouette)
    );
    centerX = W / 2;
    centerY = globeTop + availableHeight / 2;
  } else if (isOverlay) {
    copyTop = Math.max(28, finite(safe.top, 0));
    bottomInset = Math.max(28, finite(safe.bottom, 0) * 0.35);
    globeTop = copyTop + copyHeight + 20;
    const availableHeight = Math.max(1, H - bottomInset - globeTop);

    radiusPx = Math.min(
      (W - side * 2) / (2 * silhouette),
      availableHeight / (2 * silhouette)
    );
    centerX = W / 2;
    centerY = globeTop + availableHeight / 2;
  } else {
    copyTop = Math.max(242, finite(safe.top, 0) + 12);
    bottomInset = Math.max(300, finite(safe.bottom, 0));
    globeTop = copyTop + copyHeight + 12;
    const availableHeight = Math.max(1, H - bottomInset - globeTop);

    radiusPx = Math.min(
      W * 0.46,
      availableHeight * 0.485
    );
    centerX = W / 2;
    centerY = globeTop + availableHeight / 2;
  }

  copy.style.top = copyTop + "px";

  const canvas = $("ga-gl");
  canvas.style.left = "0px";
  canvas.style.top = "0px";
  canvas.style.width = W + "px";
  canvas.style.height = H + "px";

  $("ga-bg").style.background =
    `radial-gradient(ellipse at ${centerX / W * 100}% ${centerY / H * 100}%, ` +
    `${V.bgCentre} 0%, ${V.bgEdge} 82%)`;
  $("ga-grain").style.backgroundImage =
    CA.grainUrl(220, 0.65, finite(V.seed, 19));

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

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(
    -centerX / radiusPx,
    (W - centerX) / radiusPx,
    centerY / radiusPx,
    (centerY - H) / radiusPx,
    0.1,
    30
  );
  camera.position.set(0, 0, 8);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();

  const tilt = new THREE.Group();
  const globe = new THREE.Group();
  tilt.rotation.x = clamp(finite(V.viewLatitude, 26), -75, 75) * rad;
  tilt.add(globe);
  scene.add(tilt);

  const baseRim = new THREE.Color(V.rim);
  const keyTint = new THREE.Color(V.route);
  const oceanMaterial = new THREE.ShaderMaterial({
    uniforms: {
      oceanColor: { value: new THREE.Color(V.ocean) },
      rimColor: { value: baseRim.clone() }
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        vec4 p = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vView = -p.xyz;
        gl_Position = projectionMatrix * p;
      }
    `,
    fragmentShader: `
      uniform vec3 oceanColor;
      uniform vec3 rimColor;
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        vec3 n = normalize(vNormal);
        float facing = max(0.0, dot(n, normalize(vView)));
        float edge = pow(1.0 - facing, 18.0);
        float shade = 0.76 + 0.24 *
          max(0.0, dot(n, normalize(vec3(-0.4, 0.6, 1.0))));
        vec3 color = mix(oceanColor * shade, rimColor, edge * 0.58);
        gl_FragColor = vec4(color, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `
  });
  globe.add(new THREE.Mesh(
    new THREE.SphereGeometry(1, 128, 80),
    oceanMaterial
  ));

  const response = await fetch("assets/data/land-110m.json");
  if (!response.ok) {
    throw new Error("globe-arcs: bundled land outlines could not load.");
  }
  const topology = await response.json();
  const transform = topology.transform;
  const decoded = topology.arcs.map((arc) => {
    let x = 0;
    let y = 0;
    return arc.map((point) => {
      if (!transform) return [point[0], point[1]];
      x += point[0];
      y += point[1];
      return [
        x * transform.scale[0] + transform.translate[0],
        y * transform.scale[1] + transform.translate[1]
      ];
    });
  });

  const stitch = (indices) => {
    const points = [];
    indices.forEach((index) => {
      const arc = index < 0 ? decoded[~index].slice().reverse() : decoded[index];
      arc.forEach((point, i) => {
        if (points.length && i === 0) return;
        points.push(point.slice());
      });
    });
    return points;
  };

  const polygons = [];
  const collect = (geometry) => {
    if (!geometry) return;
    if (geometry.type === "GeometryCollection") {
      geometry.geometries.forEach(collect);
    }
    if (geometry.type === "Polygon") {
      polygons.push(geometry.arcs.map(stitch));
    }
    if (geometry.type === "MultiPolygon") {
      geometry.arcs.forEach((polygon) => polygons.push(polygon.map(stitch)));
    }
  };
  Object.values(topology.objects).forEach(collect);

  const prepareRing = (ring) => {
    const points = [];
    let previous = ring.length ? ring[0][0] : 0;
    ring.forEach(([longitude, latitude]) => {
      let longitudeUnwrapped = longitude;
      while (longitudeUnwrapped - previous > 180) longitudeUnwrapped -= 360;
      while (longitudeUnwrapped - previous < -180) longitudeUnwrapped += 360;
      points.push([longitudeUnwrapped, latitude]);
      previous = longitudeUnwrapped;
    });
    const xs = points.map((point) => point[0]);
    const ys = points.map((point) => point[1]);
    return {
      points,
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys)
    };
  };
  const prepared = polygons.map((polygon) => polygon.map(prepareRing));

  const inRing = (longitude, latitude, ring) => {
    if (latitude < ring.minY || latitude > ring.maxY) return false;
    const middle = (ring.minX + ring.maxX) / 2;
    const x = longitude + Math.round((middle - longitude) / 360) * 360;
    if (x < ring.minX || x > ring.maxX) return false;
    let inside = false;
    const points = ring.points;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const a = points[i];
      const b = points[j];
      if (
        (a[1] > latitude) !== (b[1] > latitude) &&
        x < (b[0] - a[0]) * (latitude - a[1]) / (b[1] - a[1]) + a[0]
      ) {
        inside = !inside;
      }
    }
    return inside;
  };

  const onLand = (longitude, latitude) => prepared.some((polygon) =>
    polygon.length &&
    inRing(longitude, latitude, polygon[0]) &&
    !polygon.slice(1).some((hole) => inRing(longitude, latitude, hole))
  );

  const random = CA.seeded(finite(V.seed, 19));
  const samples = Math.round(
    clamp(finite(V.landSamples, 78000), 16000, 140000)
  );
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const landPoints = [];

  for (let i = 0; i < samples; i++) {
    const y = 1 - 2 * (i + 0.5) / samples;
    const latitude = Math.asin(y) / rad;
    const longitude = ((i * goldenAngle / rad + 180) % 360) - 180;
    if (onLand(longitude, latitude)) {
      landPoints.push({
        normal: vector(latitude, longitude),
        strength: 0.82 + random() * 0.18,
        size: 0.90 + random() * 0.20
      });
    }
  }
  if (!landPoints.length) {
    throw new Error("globe-arcs: no land dots were generated.");
  }

  const dotGeometry = new THREE.CircleGeometry(1, 8);
  dotGeometry.setAttribute(
    "strength",
    new THREE.InstancedBufferAttribute(
      new Float32Array(landPoints.map((point) => point.strength)),
      1
    )
  );
  const dotMaterial = new THREE.ShaderMaterial({
    uniforms: { dotColor: { value: new THREE.Color(V.land) } },
    vertexShader: `
      attribute float strength;
      varying float vStrength;
      varying float vFacing;
      void main() {
        mat4 world = modelMatrix * instanceMatrix;
        vec4 p = world * vec4(position, 1.0);
        vec3 n = normalize(mat3(world) * vec3(0.0, 0.0, 1.0));
        vFacing = dot(n, normalize(cameraPosition - p.xyz));
        vStrength = strength;
        gl_Position = projectionMatrix * viewMatrix * p;
      }
    `,
    fragmentShader: `
      uniform vec3 dotColor;
      varying float vStrength;
      varying float vFacing;
      void main() {
        if (vFacing < 0.025) discard;
        float limb = mix(0.34, 1.0, smoothstep(0.025, 0.86, vFacing));
        gl_FragColor = vec4(dotColor * vStrength * limb, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `
  });
  const dots = new THREE.InstancedMesh(
    dotGeometry, dotMaterial, landPoints.length
  );
  const dummy = new THREE.Object3D();
  const zAxis = new THREE.Vector3(0, 0, 1);
  const dotRadius = clamp(finite(V.landDotSize, 1.65), 0.5, 4) / 380;

  landPoints.forEach((point, i) => {
    dummy.position.copy(point.normal).multiplyScalar(1.002);
    dummy.quaternion.setFromUnitVectors(zAxis, point.normal);
    dummy.scale.setScalar(dotRadius * point.size);
    dummy.updateMatrix();
    dots.setMatrixAt(i, dummy.matrix);
  });
  dots.instanceMatrix.needsUpdate = true;
  dots.frustumCulled = false;
  globe.add(dots);

  const origin = vector(V.originLatitude, V.originLongitude);
  const pinMaterial = new THREE.MeshBasicMaterial({ color: V.ink });
  const pinRingMaterial = new THREE.MeshBasicMaterial({ color: V.pinRing });
  const pinGeometry = new THREE.SphereGeometry(0.022, 16, 12);
  const pinOutlineGeometry = new THREE.TorusGeometry(0.031, 0.007, 6, 24);

  const pinAt = (normal) => {
    const group = new THREE.Group();
    group.position.copy(normal).multiplyScalar(1.012);
    group.quaternion.setFromUnitVectors(zAxis, normal);
    const outline = new THREE.Mesh(pinOutlineGeometry, pinRingMaterial);
    const pin = new THREE.Mesh(pinGeometry, pinMaterial);
    pin.position.z = 0.018;
    group.add(outline, pin);
    globe.add(group);
    return group;
  };
  const originPin = pinAt(origin);

  const routeRadius = clamp(finite(V.routeWidth, 6), 2, 14) / 500;
  const routeMaterial = new THREE.MeshBasicMaterial({ color: V.route });
  const tipMaterial = new THREE.MeshBasicMaterial({ color: V.routeTip });
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: V.route,
    transparent: true,
    opacity: 0.14,
    depthWrite: false
  });
  const steps = 112;
  const radialSegments = 6;
  const indicesPerStep = radialSegments * 6;

  class GlobeRoute extends THREE.Curve {
    constructor(a, b, height) {
      super();
      this.a = a.clone();
      this.angle = Math.acos(clamp(a.dot(b), -1, 1));
      this.height = height;
      this.axis = new THREE.Vector3().crossVectors(a, b);
      if (this.axis.lengthSq() < 0.000001) {
        this.axis.crossVectors(a, new THREE.Vector3(0, 1, 0));
        if (this.axis.lengthSq() < 0.000001) this.axis.set(1, 0, 0);
      }
      this.axis.normalize();
    }

    getPoint(u, target = new THREE.Vector3()) {
      const n = this.a.clone().applyAxisAngle(this.axis, this.angle * u);
      return target.copy(n).multiplyScalar(
        1.014 + this.height * Math.sin(Math.PI * u)
      );
    }
  }

  const routes = rawRoutes.map((route, index) => {
    const destination = vector(route.latitude, route.longitude);
    const angle = Math.acos(clamp(origin.dot(destination), -1, 1));

    // Separate the arches vertically so nearby destinations still read
    // as distinct journeys at phone size.
    const height = clamp(
      0.14 + angle * 0.48 + index * 0.018,
      0.18,
      0.72
    ) * clamp(finite(V.arcLift, 1), 0.2, 2);
    const curve = new GlobeRoute(origin, destination, height);
    const geometry = new THREE.TubeGeometry(
      curve, steps, routeRadius, radialSegments, false
    );
    const glowGeometry = new THREE.TubeGeometry(
      curve, steps, routeRadius * 2.25, radialSegments, false
    );
    const mesh = new THREE.Mesh(geometry, routeMaterial);
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    const headGeometry = geometry.clone();
    const head = new THREE.Mesh(headGeometry, tipMaterial);
    const tip = new THREE.Mesh(
      new THREE.SphereGeometry(routeRadius * 1.40, 10, 8),
      tipMaterial
    );
    globe.add(glow, mesh, head, tip);

    const pin = pinAt(destination);
    const rippleMaterial = new THREE.MeshBasicMaterial({
      color: V.route,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    const ripple = new THREE.Mesh(
      new THREE.RingGeometry(0.88, 1, 64),
      rippleMaterial
    );
    ripple.position.copy(destination).multiplyScalar(1.010);
    ripple.quaternion.setFromUnitVectors(zAxis, destination);
    globe.add(ripple);

    return {
      ...route,
      destination,
      curve,
      geometry,
      glowGeometry,
      mesh,
      glow,
      headGeometry,
      head,
      tip,
      pin,
      ripple,
      rippleMaterial
    };
  });

  const keyRingMaterial = new THREE.MeshBasicMaterial({
    color: V.route,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const keyRing = new THREE.Mesh(
    new THREE.RingGeometry(1.007, 1.026, 160),
    keyRingMaterial
  );
  keyRing.position.z = 1.4;
  scene.add(keyRing);

  const svg = $("ga-leaders");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  const callouts = [];

  const addCallout = (text, normal, routeIndex, slot) => {
    const el = make("span", "ga-city", $("ga-city-labels"), text);
    el.style.fontSize = (compactTop ? 36 : isTop || isOverlay ? 40 : 48) + "px";
    el.style.color = V.muted;
    el.style.background = rgba(V.ocean, 0.96);

    const maxWidth = compactTop
      ? Math.min(240, radiusPx * 0.90)
      : isTop || isOverlay
        ? Math.min(300, W * 0.30)
        : Math.min(340, W * 0.34);
    el.style.maxWidth = maxWidth + "px";

    const width = el.offsetWidth;
    const height = el.offsetHeight;
    let left;
    let top;

    if (compactTop) {
      left = slot === "right"
        ? W - side - width
        : Math.max(side + copyWidth + 14, centerX - radiusPx - 12);
      top = slot === "origin"
        ? centerY - radiusPx * 0.98
        : slot === "first"
          ? centerY + radiusPx * 0.65
          : centerY + radiusPx * 0.22;
    } else if (isTop) {
      left = slot === "right" ? W - side - width : side;
      top = slot === "origin"
        ? centerY - radiusPx * 0.78
        : slot === "first"
          ? centerY + radiusPx * 0.60
          : centerY - radiusPx * 0.08;
    } else {
      left = slot === "right" ? W - side - width : side;
      top = slot === "origin"
        ? centerY - radiusPx * 0.79
        : slot === "first"
          ? centerY + radiusPx * 0.43
          : centerY - radiusPx * 0.24;
    }

    const labelFloor = compactTop
      ? Math.max(28, finite(safe.top, 0))
      : copyTop + copyHeight + 14;
    const labelBottom = H - bottomInset;

    left = clamp(left, side, Math.max(side, W - side - width));
    top = clamp(
      top,
      labelFloor,
      Math.max(labelFloor, labelBottom - height)
    );
    el.style.left = left + "px";
    el.style.top = top + "px";

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("class", "ga-leader");
    path.setAttribute("stroke", rgba(V.muted, 0.72));
    svg.appendChild(path);
    callouts.push({
      el, path, normal, routeIndex, left, top, width, height, slot
    });
  };

  addCallout(String(V.originCity), origin, -1, "origin");
  if (routes.length) {
    addCallout(routes[0].city, routes[0].destination, 0, "first");
  }
  if (routes.length > 1) {
    const lastIndex = routes.length - 1;
    addCallout(
      routes[lastIndex].city,
      routes[lastIndex].destination,
      lastIndex,
      "right"
    );
  }

  const project = (normal) => {
    const point = normal.clone().multiplyScalar(1.035);
    globe.localToWorld(point);
    const front = point.z > 0.04;
    point.project(camera);
    return {
      x: (point.x + 1) * W / 2,
      y: (1 - point.y) * H / 2,
      front
    };
  };

  function renderAt(realTime) {
    const time = Math.max(0, finite(realTime, 0));
    const t = designTime(time);
    const turn = out(progress(t, 0, stopAt));
    const afterStop = Math.max(0, t - stopAt);
    const drift = finite(V.holdDriftDegrees, 0.6) *
      (afterStop - 0.5 * (1 - Math.exp(-2 * afterStop)));

    globe.rotation.y = (
      -finite(V.viewLongitude, -115) -
      finite(V.rotationDegrees, 40) * turn -
      drift
    ) * rad;
    tilt.scale.setScalar(
      0.98 + 0.02 * turn + 0.002 * (1 - Math.exp(-afterStop))
    );
    originPin.scale.setScalar(1 + 0.06 * Math.sin(time * 3));
    scene.updateMatrixWorld(true);

    let value = finite(V.startingNumber, 0);
    let activeCaption = String(V.originCity);
    let latestLandingAge = -1;

    routes.forEach((route, routeIndex) => {
      const started = t >= route.depart;
      const landed = time >= T.key || t >= route.land;
      const p = landed
        ? 1
        : smooth(progress(t, route.depart, route.land - route.depart));
      const count = started || landed ? Math.ceil(p * steps) : 0;

      route.mesh.visible = started || landed;
      route.glow.visible = started || landed;
      route.geometry.setDrawRange(0, Math.min(steps, count) * indicesPerStep);
      route.glowGeometry.setDrawRange(0, Math.min(steps, count) * indicesPerStep);

      const holdPacket = landed && time > T.key + 0.18;
      const packetP = holdPacket
        ? ((time - T.key - 0.18) * 0.24 + routeIndex * 0.23) % 1
        : p;
      const packetStep = holdPacket
        ? Math.max(1, Math.min(steps, Math.ceil(packetP * steps)))
        : count;
      const headStart = Math.max(0, packetStep - (holdPacket ? 3 : 5));

      route.head.visible = (started && !landed) || holdPacket;
      route.headGeometry.setDrawRange(
        headStart * indicesPerStep,
        Math.max(0, packetStep - headStart) * indicesPerStep
      );
      route.tip.visible = (started && !landed) || holdPacket;
      route.tip.position.copy(route.curve.getPoint(packetP));
      route.tip.scale.setScalar(holdPacket ? 0.78 : 1);

      const landingAge = Math.max(0, t - route.land);
      route.pin.visible = landed;
      const pinProgress = progress(t, route.land, 0.27);
      const pinScale = landed ? 0.82 + 0.18 * spring(pinProgress) : 0;
      route.pin.scale.setScalar(Math.max(0.001, pinScale));

      const rippleProgress = clamp(landingAge / 0.68);
      route.ripple.visible = landed && rippleProgress < 1;
      route.ripple.scale.setScalar(0.035 + 0.16 * out(rippleProgress));
      route.rippleMaterial.opacity = landed
        ? (1 - rippleProgress) * 0.88
        : 0;

      if (started || landed) {
        activeCaption = route.city +
          (route.transfer ? " · " + route.transfer : "");
      }
      if (landed) {
        value = route.value;
        latestLandingAge = landingAge;
      }
    });

    if (time >= T.key) value = finite(V.finalNumber, 128);
    const numberText = format(value);
    if (number.textContent !== numberText) number.textContent = numberText;
    if (caption.textContent !== activeCaption) caption.textContent = activeCaption;

    const finalAge = time - T.key;
    const finalReaction = finalAge >= 0 && finalAge < 0.44
      ? Math.exp(-10 * finalAge) * (0.65 + 0.35 * Math.cos(20 * finalAge))
      : 0;
    const landingReaction = finalAge < 0 &&
      latestLandingAge >= 0 && latestLandingAge < 0.22
      ? Math.sin(Math.PI * latestLandingAge / 0.22) *
        Math.exp(-5 * latestLandingAge)
      : 0;
    const statScale = 1 + finalReaction * 0.10 + landingReaction * 0.035;
    stat.style.transform = `scale(${statScale})`;
    number.style.color = finalAge >= 0 && finalAge < 0.14
      ? V.routeTip
      : V.ink;

    const keyProgress = progress(time, T.key, 0.62);
    keyRing.visible = finalAge >= 0 && keyProgress < 1;
    keyRing.scale.setScalar(1 + out(keyProgress) * 0.045);
    keyRingMaterial.opacity = finalAge >= 0
      ? (1 - keyProgress) * 0.90
      : 0;
    oceanMaterial.uniforms.rimColor.value.copy(baseRim).lerp(
      keyTint,
      finalAge >= 0 ? (1 - keyProgress) * 0.78 : 0
    );

    callouts.forEach((callout) => {
      const at = callout.routeIndex < 0
        ? 0
        : routes[callout.routeIndex].land;
      const point = project(callout.normal);
      const visible = (t >= at || time >= T.key) && point.front;
      callout.el.style.visibility = visible ? "visible" : "hidden";
      callout.path.style.visibility = visible ? "visible" : "hidden";

      const p = out(progress(t, at, 0.22));
      const direction = callout.slot === "right" ? 1 : -1;
      const requestedShift = (1 - p) * direction * 14;
      const shift = clamp(
        requestedShift,
        side - callout.left,
        W - side - callout.width - callout.left
      );
      callout.el.style.transform = `translateX(${shift}px)`;

      const endX = callout.slot === "right"
        ? callout.left + shift
        : callout.left + callout.width + shift;
      const endY = callout.top + callout.height / 2;
      const elbowX = endX + (point.x - endX) * 0.3;
      callout.path.setAttribute(
        "d",
        `M ${point.x.toFixed(2)} ${point.y.toFixed(2)} ` +
        `L ${elbowX.toFixed(2)} ${endY.toFixed(2)} ` +
        `L ${endX.toFixed(2)} ${endY.toFixed(2)}`
      );
    });

    if (isOverlay || T.exit > 0) {
      const enter = isOverlay ? out(progress(time, 0, 0.25)) : 1;
      const exitDuration = Math.max(0.0001, T.exit - 1 / CA.fps);
      const leaving = T.exit > 0
        ? progress(time, T.key + T.hold, exitDuration)
        : 0;
      const openness = enter * (1 - leaving * leaving);

      if (openness <= 0.00001) {
        stageEl.style.clipPath = "inset(50% 0 50% 0)";
      } else if (openness >= 0.99999) {
        stageEl.style.clipPath = "none";
      } else {
        const inset = 50 * (1 - openness);
        stageEl.style.clipPath = `inset(${inset}% 0 ${inset}% 0)`;
      }
    } else {
      stageEl.style.clipPath = "none";
    }

    renderer.render(scene, camera);
  }

  window.addEventListener("hf-seek", (event) => renderAt(event.detail.time));
  renderAt(window.__hfThreeTime || 0);
  window.__timelines["block"] = gsap.timeline({ paused: true });
});