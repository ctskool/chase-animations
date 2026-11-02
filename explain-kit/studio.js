// The shared studio every explainer scene stands in: one renderer, a softbox environment for the
// reflections, a dark floor, HDR bloom, a vignette and seeded grain. Scenes only build their objects.
import * as THREE from "three";

export const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
export const mix = (a, b, p) => a + (b - a) * p;
export const seg = (t, at, d) => (d <= 0 ? (t >= at ? 1 : 0) : clamp((t - at) / d));
export const easeOut = (p, k = 3) => 1 - Math.pow(1 - clamp(p), k);
export const easeIn = (p, k = 3) => Math.pow(clamp(p), k);
export const easeInOut = (p) => {
  p = clamp(p);
  return p * p * p * (p * (p * 6 - 15) + 10);
};
export const back = (p, s = 1.7) => {
  p = clamp(p);
  return 1 + (s + 1) * Math.pow(p - 1, 3) + s * Math.pow(p - 1, 2);
};
// A damped spring from 0 to 1, for things that land.
export const spring = (p, bounce = 0.35) => {
  if (p <= 0) return 0;
  if (p >= 1) return 1;
  return 1 - Math.exp(-6 * p) * Math.cos(p * Math.PI * (2 + bounce * 6)) * (1 - p * 0.2);
};

export function seeded(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createStudio({ canvas, W, H, pixelRatio = 1.5 }) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: false,
    antialias: false,
    preserveDrawingBuffer: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(W, H, false);
  renderer.autoClear = false;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Softboxes for reflections, built once.
  const studio = new THREE.Scene();
  studio.background = new THREE.Color(0.01, 0.011, 0.014);
  const featherCanvas = document.createElement("canvas");
  featherCanvas.width = featherCanvas.height = 256;
  {
    const g = featherCanvas.getContext("2d");
    g.fillStyle = "#000";
    g.fillRect(0, 0, 256, 256);
    g.filter = "blur(16px)";
    g.fillStyle = "#fff";
    g.fillRect(34, 34, 188, 188);
  }
  const featherMap = new THREE.CanvasTexture(featherCanvas);
  const softbox = (w, h, position, color, power) => {
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color).multiplyScalar(power),
      map: featherMap,
      side: THREE.DoubleSide,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const box = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    box.position.set(...position);
    box.lookAt(0, 0, 0);
    studio.add(box);
  };
  softbox(34, 26, [0, 18, 0], "#fff4e6", 0.45);
  softbox(30, 1.7, [-3, 15, 6.5], "#fff4e6", 10);
  softbox(4, 24, [-15, 4, 6], "#ffffff", 7);
  softbox(1.6, 24, [14, 3, 8], "#ffe6cc", 5);
  softbox(6, 24, [15, 2, -9], "#ffd2a8", 7);
  softbox(4, 20, [-13, 2, -11], "#a9c8ff", 5);
  softbox(36, 5, [0, -7, 14], "#c8d4e6", 0.6);
  softbox(32, 5, [0, 5, -17], "#ffcaa0", 1.6);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(studio, 0.006, 0.1, 100, { size: 512 }).texture;
  pmrem.dispose();

  // ---------------------------------------------------------------- post
  const size = renderer.getDrawingBufferSize(new THREE.Vector2());
  const hdrType =
    renderer.extensions.has("EXT_color_buffer_float") || renderer.extensions.has("EXT_color_buffer_half_float")
      ? THREE.HalfFloatType
      : THREE.UnsignedByteType;
  const target = (samples = 4, depth = true) =>
    new THREE.WebGLRenderTarget(size.x, size.y, { type: hdrType, samples, depthBuffer: depth });
  const rtA = target();
  const rtB = target();
  const rtMix = target(0, false);
  const mips = [];
  {
    let mw = size.x;
    let mh = size.y;
    for (let i = 0; i < 6; i++) {
      mw = Math.max(2, Math.round(mw / 2));
      mh = Math.max(2, Math.round(mh / 2));
      mips.push(new THREE.WebGLRenderTarget(mw, mh, { type: hdrType, depthBuffer: false }));
    }
  }
  const screenVertex = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
  const quadScene = new THREE.Scene();
  const quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
  quad.frustumCulled = false;
  quadScene.add(quad);
  const pass = (fragmentShader, uniforms, extra = {}) =>
    new THREE.ShaderMaterial({
      uniforms,
      vertexShader: screenVertex,
      fragmentShader,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
      ...extra,
    });

  // Joins two scenes during a cut: a crossfade that blows out through the light, with a push.
  const mixPass = pass(
    `varying vec2 vUv;
    uniform sampler2D a, b;
    uniform float p, flash;
    uniform vec3 tint;
    // A zoom blur towards the subject: the outgoing shot rushes in, the incoming one settles.
    vec3 grab(sampler2D t, vec2 uv, float zoom, float blur){
      vec2 c = vec2(0.5, 0.42);
      vec2 base = (uv - c) / zoom + c;
      vec3 acc = vec3(0.0);
      for (int i = 0; i < 10; i++) {
        float k = float(i) / 9.0;
        acc += texture2D(t, c + (base - c) * (1.0 - blur * k)).rgb;
      }
      return acc / 10.0;
    }
    void main(){
      float e = p * p * (3.0 - 2.0 * p);
      float s = sin(3.14159 * e);
      vec3 ca = grab(a, vUv, 1.0 + e * 0.16, 0.10 * s);
      vec3 cb = grab(b, vUv, 1.0 - (1.0 - e) * 0.08, 0.08 * s);
      vec3 c = mix(ca, cb, e);
      float d = distance(vUv * vec2(0.5625, 1.0), vec2(0.28, 0.42));
      c += tint * flash * 0.16 * s * exp(-d * d * 18.0);
      gl_FragColor = vec4(c, 1.0);
    }`,
    { a: { value: null }, b: { value: null }, p: { value: 0 }, flash: { value: 0 }, tint: { value: new THREE.Color() } },
  );
  const copyPass = pass(
    `varying vec2 vUv; uniform sampler2D tex; void main(){ gl_FragColor = vec4(texture2D(tex, vUv).rgb, 1.0); }`,
    { tex: { value: null } },
  );
  const brightPass = pass(
    `varying vec2 vUv; uniform sampler2D tex; uniform vec2 texel; uniform float knee0, knee1;
    void main(){
      vec3 c = vec3(0.0);
      c += texture2D(tex, vUv + texel * vec2(-1.0,-1.0)).rgb;
      c += texture2D(tex, vUv + texel * vec2( 1.0,-1.0)).rgb;
      c += texture2D(tex, vUv + texel * vec2(-1.0, 1.0)).rgb;
      c += texture2D(tex, vUv + texel * vec2( 1.0, 1.0)).rgb;
      c = min(c * 0.25, vec3(40.0));
      float l = max(max(c.r, c.g), c.b);
      gl_FragColor = vec4(c * smoothstep(knee0, knee1, l), 1.0);
    }`,
    { tex: { value: null }, texel: { value: new THREE.Vector2() }, knee0: { value: 1.5 }, knee1: { value: 3.4 } },
  );
  const downPass = pass(
    `varying vec2 vUv; uniform sampler2D tex; uniform vec2 texel;
    void main(){
      vec3 c = texture2D(tex, vUv).rgb * 4.0;
      c += texture2D(tex, vUv + texel * vec2(-1.0,-1.0)).rgb;
      c += texture2D(tex, vUv + texel * vec2( 1.0,-1.0)).rgb;
      c += texture2D(tex, vUv + texel * vec2(-1.0, 1.0)).rgb;
      c += texture2D(tex, vUv + texel * vec2( 1.0, 1.0)).rgb;
      gl_FragColor = vec4(c / 8.0, 1.0);
    }`,
    { tex: { value: null }, texel: { value: new THREE.Vector2() } },
  );
  const upPass = pass(
    `varying vec2 vUv; uniform sampler2D tex; uniform vec2 texel; uniform float gain;
    void main(){
      vec3 c = vec3(0.0);
      c += texture2D(tex, vUv + texel * vec2(-1.0, 0.0)).rgb * 2.0;
      c += texture2D(tex, vUv + texel * vec2( 1.0, 0.0)).rgb * 2.0;
      c += texture2D(tex, vUv + texel * vec2( 0.0, 1.0)).rgb * 2.0;
      c += texture2D(tex, vUv + texel * vec2( 0.0,-1.0)).rgb * 2.0;
      c += texture2D(tex, vUv + texel * vec2(-1.0,-1.0)).rgb;
      c += texture2D(tex, vUv + texel * vec2( 1.0,-1.0)).rgb;
      c += texture2D(tex, vUv + texel * vec2(-1.0, 1.0)).rgb;
      c += texture2D(tex, vUv + texel * vec2( 1.0, 1.0)).rgb;
      gl_FragColor = vec4(c / 12.0 * gain, 1.0);
    }`,
    { tex: { value: null }, texel: { value: new THREE.Vector2() }, gain: { value: 0.92 } },
    {
      transparent: true,
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneFactor,
    },
  );
  // ACES, a soft vignette, a little lens fringe at the edges, and grain that is seeded per frame.
  const present = pass(
    `varying vec2 vUv;
    uniform sampler2D tex, glowTex;
    uniform float glow, exposure, frame, grain, fade;
    uniform vec2 aspect;
    float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
    vec3 aces(vec3 x){ return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
    void main(){
      vec2 d = (vUv - 0.5) * aspect;
      float r = length(d);
      vec2 shift = (vUv - 0.5) * 0.0024 * smoothstep(0.25, 0.9, r);
      vec3 c;
      c.r = texture2D(tex, vUv + shift).r;
      c.g = texture2D(tex, vUv).g;
      c.b = texture2D(tex, vUv - shift).b;
      c += texture2D(glowTex, vUv).rgb * glow;
      c *= exposure;
      c *= mix(1.0, 0.42, smoothstep(0.32, 1.02, r));
      c = aces(c);
      c = pow(c, vec3(1.0 / 2.2));
      float n = hash(vUv * vec2(1080.0, 1920.0) + frame * 17.31) - 0.5;
      c += n * grain;
      c *= fade;
      gl_FragColor = vec4(c, 1.0);
    }`,
    {
      tex: { value: null },
      glowTex: { value: mips[0].texture },
      glow: { value: 0.9 },
      exposure: { value: 1 },
      frame: { value: 0 },
      grain: { value: 0.028 },
      fade: { value: 1 },
      aspect: { value: new THREE.Vector2(1, H / W) },
    },
  );

  function run(material, rt) {
    quad.material = material;
    renderer.setRenderTarget(rt);
    renderer.render(quadScene, quadCamera);
  }

  function renderScene(sc, rt) {
    renderer.setRenderTarget(rt);
    renderer.setClearColor(0x000000, 1);
    renderer.clear();
    sc.scene.environment = environment;
    renderer.render(sc.scene, sc.camera);
  }

  // a, b: built scenes. p: 0 shows a only, 1 shows b only.
  function composite({ a, b, p = 0, flash = 0, tint, frame = 0, glow = 0.9, exposure = 1, fade = 1 }) {
    let source;
    if (b && p > 0 && p < 1) {
      renderScene(a, rtA);
      renderScene(b, rtB);
      mixPass.uniforms.a.value = rtA.texture;
      mixPass.uniforms.b.value = rtB.texture;
      mixPass.uniforms.p.value = p;
      mixPass.uniforms.flash.value = flash;
      if (tint) mixPass.uniforms.tint.value.copy(tint);
      run(mixPass, rtMix);
      source = rtMix;
    } else {
      renderScene(b && p >= 1 ? b : a, rtA);
      copyPass.uniforms.tex.value = rtA.texture;
      run(copyPass, rtMix);
      source = rtMix;
    }
    brightPass.uniforms.tex.value = source.texture;
    brightPass.uniforms.texel.value.set(1 / size.x, 1 / size.y);
    run(brightPass, mips[0]);
    for (let i = 1; i < mips.length; i++) {
      downPass.uniforms.tex.value = mips[i - 1].texture;
      downPass.uniforms.texel.value.set(1 / mips[i - 1].width, 1 / mips[i - 1].height);
      run(downPass, mips[i]);
    }
    for (let i = mips.length - 1; i > 0; i--) {
      upPass.uniforms.tex.value = mips[i].texture;
      upPass.uniforms.texel.value.set(1 / mips[i].width, 1 / mips[i].height);
      run(upPass, mips[i - 1]);
    }
    present.uniforms.tex.value = source.texture;
    present.uniforms.glow.value = glow;
    present.uniforms.exposure.value = exposure;
    present.uniforms.frame.value = frame;
    present.uniforms.fade.value = fade;
    run(present, null);
  }

  return { renderer, environment, composite, pixelRatio };
}

// ---------------------------------------------------------------- shared scene pieces

export function radialTexture(stops, size = 256) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  stops.forEach(([at, value]) => {
    const v = Math.round(value * 255);
    grad.addColorStop(at, `rgb(${v},${v},${v})`);
  });
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(c);
}

// The dark studio backdrop, drawn in screen space: a pool of light behind the subject, near black
// at the edges, and a faint warm haze. centre is in 0..1 screen units, y up.
export function backdrop(scene, theme, { haze = 1, centre = [0.5, 0.42], pool = 5 } = {}) {
  const uniforms = {
    uCentre: { value: new THREE.Vector2(...centre) },
    uAspect: { value: 1080 / 1920 },
    uA: { value: new THREE.Color(theme.bgCenter) },
    uB: { value: new THREE.Color(theme.bgEdge) },
    uAccent: { value: new THREE.Color(theme.accent) },
    uHaze: { value: haze },
    uPool: { value: pool },
    uFlash: { value: 0 },
  };
  const tri = new THREE.BufferGeometry();
  tri.setAttribute("position", new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  const mesh = new THREE.Mesh(
    tri,
    new THREE.ShaderMaterial({
      uniforms,
      vertexShader: `varying vec2 vUv; void main(){ vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
      fragmentShader: `varying vec2 vUv; uniform vec2 uCentre; uniform float uAspect, uHaze, uPool, uFlash; uniform vec3 uA, uB, uAccent;
        void main(){
          vec2 p = (vUv - uCentre) * vec2(uAspect, 1.0);
          float d = length(p);
          vec3 c = mix(uB, uA, exp(-d * d * uPool));
          c += uAccent * exp(-d * d * 9.0) * 0.022 * uHaze;
          c += uAccent * exp(-d * d * 14.0) * uFlash;
          gl_FragColor = vec4(c, 1.0);
        }`,
      depthTest: false,
      depthWrite: false,
    }),
  );
  mesh.frustumCulled = false;
  mesh.renderOrder = -100;
  scene.add(mesh);
  return { mesh, uniforms };
}

// A dark floor that fades into the backdrop, takes the key light's shadow, and a contact shadow.
export function floor(scene, theme, { y = 0, radius = 12, contact = 2.2 } = {}) {
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(theme.bgCenter).multiplyScalar(0.5),
    metalness: 0,
    roughness: 0.6,
    transparent: true,
    opacity: 0.95,
    alphaMap: radialTexture([[0, 1], [0.15, 0.9], [0.32, 0.35], [0.5, 0], [1, 0]]),
    depthWrite: false,
    envMapIntensity: 0.04,
  });
  const mesh = new THREE.Mesh(new THREE.CircleGeometry(radius, 96), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = y;
  mesh.receiveShadow = true;
  mesh.renderOrder = 1;
  scene.add(mesh);
  let shadow = null;
  if (contact) {
    shadow = new THREE.Mesh(
      new THREE.CircleGeometry(contact, 64),
      new THREE.MeshBasicMaterial({ color: "#000", transparent: true, opacity: 0.75, alphaMap: radialTexture([[0, 1], [0.45, 0.8], [1, 0]]), depthWrite: false }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = y + 0.003;
    shadow.renderOrder = 2;
    scene.add(shadow);
  }
  return { mesh, shadow };
}

// Key, rim and fill. The key casts the shadow.
export function lights(scene, theme, { key = 2.4, rim = 3.2, fill = 0.35, shadowSize = 6 } = {}) {
  const keyLight = new THREE.DirectionalLight("#fff1e2", key);
  keyLight.position.set(-5, 10, 7);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(2048, 2048);
  keyLight.shadow.bias = -0.0003;
  keyLight.shadow.normalBias = 0.02;
  keyLight.shadow.radius = 6;
  Object.assign(keyLight.shadow.camera, { left: -shadowSize, right: shadowSize, top: shadowSize, bottom: -shadowSize, near: 1, far: 40 });
  scene.add(keyLight, keyLight.target);
  // Rims sit low and behind, so they edge the silhouette without glaring off flat tops.
  const rimLight = new THREE.DirectionalLight(new THREE.Color(theme.accent).lerp(new THREE.Color("#ffffff"), 0.35), rim);
  rimLight.position.set(9, 1.6, -7);
  scene.add(rimLight);
  const coolRim = new THREE.DirectionalLight("#9fc2ff", rim * 0.4);
  coolRim.position.set(-9, 1.4, -6);
  scene.add(coolRim);
  const hemi = new THREE.HemisphereLight("#ffffff", "#2a1c14", fill);
  scene.add(hemi);
  return { key: keyLight, rim: rimLight, coolRim, hemi };
}

// See-through glass that reads on a dark set: a faint tint, bright fresnel edges, no refraction.
export function glassMaterial(color = "#bfe6ff", { opacity = 0.18, rim = 1.6, side = THREE.FrontSide } = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(color) }, uOpacity: { value: opacity }, uRim: { value: rim } },
    vertexShader: `varying vec3 vN; varying vec3 vV;
      void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uColor; uniform float uOpacity, uRim; varying vec3 vN; varying vec3 vV;
      void main(){ float f = pow(1.0 - clamp(abs(dot(normalize(vN), normalize(vV))), 0.0, 1.0), 2.4);
        gl_FragColor = vec4(uColor * (uOpacity + f * uRim), 1.0); }`,
    transparent: true,
    depthWrite: false,
    side,
    blending: THREE.AdditiveBlending,
  });
}

// Dust in the light: slow, seeded motes around the subject. Returns update(time).
export function motes(scene, rng, { count = 90, spread = 5, height = 4, color = "#ffd9b8", size = 0.035, intensity = 2.2 } = {}) {
  const pts = glowPoints(count, { color, size, intensity });
  const base = [];
  for (let i = 0; i < count; i++) {
    base.push([(rng() - 0.5) * spread * 2, rng() * height, (rng() - 0.5) * spread * 2, rng() * Math.PI * 2, 0.4 + rng() * 0.8]);
  }
  const pos = pts.geometry.attributes.position;
  const glow = pts.geometry.attributes.aGlow;
  scene.add(pts);
  return {
    points: pts,
    update(t) {
      base.forEach(([x, y, z, ph, sp], i) => {
        pos.setXYZ(i, x + Math.sin(t * 0.3 * sp + ph) * 0.25, y + ((t * 0.08 * sp) % 1) * 0.6, z + Math.cos(t * 0.25 * sp + ph) * 0.25);
        glow.setX(i, 0.35 + 0.65 * Math.pow(0.5 + 0.5 * Math.sin(t * 1.3 * sp + ph * 3), 3));
      });
      pos.needsUpdate = true;
      glow.needsUpdate = true;
    },
  };
}

// Additive glowing points that stay round and soft at any size. positions: Float32Array.
export function glowPoints(count, { color = "#ffffff", size = 0.06, intensity = 4 } = {}) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  geo.setAttribute("aSize", new THREE.BufferAttribute(new Float32Array(count).fill(1), 1));
  geo.setAttribute("aGlow", new THREE.BufferAttribute(new Float32Array(count).fill(1), 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(color).multiplyScalar(intensity) }, uSize: { value: size }, uScale: { value: 1000 } },
    vertexShader: `attribute float aSize; attribute float aGlow; varying float vGlow; uniform float uSize, uScale;
      void main(){ vGlow = aGlow; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv;
        gl_PointSize = max(1.0, uSize * aSize * uScale / -mv.z); }`,
    fragmentShader: `uniform vec3 uColor; varying float vGlow;
      void main(){ vec2 d = gl_PointCoord - 0.5; float r = length(d) * 2.0; if (r > 1.0) discard;
        float a = exp(-r * r * 4.0); gl_FragColor = vec4(uColor * a * vGlow, 1.0); }`,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  return points;
}
