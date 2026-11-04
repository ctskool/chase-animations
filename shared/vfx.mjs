// /vfx: effects on the speaker's own shot. prep makes a 1080x1920 working copy and the words, once per video. Each
// effect cuts the speaker out of its own few seconds (cached), tracks the head from that cut-out, draws up to two
// transparent layers in HyperFrames, one behind the speaker and one in front, and FFmpeg stacks them: the shot, the
// back layer, the cut-out, the front layer. --4k stacks at 2160x3840: the shot and the speaker's pixels come from a 4K
// working copy, the matte and head track stay the 1080 ones (scaled 2x), and HyperFrames draws the layers at 2x density.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { PACK, UsageError, buildProject, hyperframes, loadBlock, renderProject, resolveVars } from "./build.mjs";
import { probe } from "./compose.mjs";
import { loadWords } from "./sync.mjs";

export const EFFECTS = path.join(PACK, "effects");
const W = 1080;
const H = 1920;
const FPS = 30;
const TRACK_FPS = 10;
// Split layouts: the speaker sits in a card that runs off the bottom edge, with the head breaking its top edge.
const CARD = { x: 36, y: 994, w: 1008, h: 926 + 60, r: 44, rise: 65 };

function run(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, { encoding: opts.binary ? "buffer" : "utf8", maxBuffer: 1 << 30, ...opts });
  if (res.error?.code === "ENOENT") throw new UsageError(`${cmd} isn't installed. See docs/INSTALL.md.`);
  if (res.status !== 0) throw new Error(`${cmd} failed:\n${String(res.stderr || "").slice(-1500)}`);
  return res.stdout;
}

export function listEffects() {
  if (!fs.existsSync(EFFECTS)) return [];
  return fs
    .readdirSync(EFFECTS, { withFileTypes: true })
    .filter((d) => d.isDirectory() && fs.existsSync(path.join(EFFECTS, d.name, "block.json")))
    .map((d) => d.name)
    .sort();
}

export function loadEffect(name) {
  const dir = path.join(EFFECTS, name);
  if (!fs.existsSync(path.join(dir, "block.json"))) {
    throw new UsageError(`No effect called "${name}". Available: ${listEffects().join(", ")}`);
  }
  const fx = { ...JSON.parse(fs.readFileSync(path.join(dir, "block.json"), "utf8")), dir };
  fx.layers ??= ["back"];
  fx.layout ??= "full";
  return fx;
}

// Which cut-out this machine uses, written by `npm run setup -- --vfx`. "hyperframes" is HyperFrames' own remover
// (Apache-2.0, any computer, CoreML on a Mac). "rvm" is Robust Video Matting on an NVIDIA card, installed by setup
// from its own GitHub, never shipped in this pack.
export const ENGINE_FILE = path.join(PACK, ".vfx", "engine.json");

export function loadEngine() {
  if (!fs.existsSync(ENGINE_FILE)) throw new UsageError("Effects need a cut-out model once. Run: npm run setup -- --vfx");
  return JSON.parse(fs.readFileSync(ENGINE_FILE, "utf8"));
}

// src -> a ProRes 4444 .mov of the same frames: the source pixels, with the speaker opaque and the room transparent.
function cutOut(src, out) {
  const engine = loadEngine();
  if (engine.engine === "rvm") {
    const script = path.join(PACK, "shared", "vfx-matte", "rvm.py");
    run(engine.python, [script, src, out, "--rvm", engine.rvm, "--weights", engine.weights], { stdio: ["ignore", "inherit", "inherit"] });
  } else {
    const res = hyperframes(["remove-background", src, "-o", out], { capture: true });
    if (res.status !== 0 || !fs.existsSync(out)) throw new Error(`The cut-out failed:\n${(res.stderr || res.stdout || "").slice(-1200)}`);
  }
}

export function prep(video, { out, k4 } = {}) {
  const src = path.resolve(video);
  if (!fs.existsSync(src)) throw new UsageError(`Can't find ${src}`);
  const info = probe(src);
  if (info.height <= info.width) throw new UsageError(`Effects need a vertical video. ${path.basename(src)} is ${info.width}x${info.height}.`);
  const dir = path.resolve(out ?? path.join(path.dirname(src), `${path.basename(src, path.extname(src))}.vfx`));
  fs.mkdirSync(dir, { recursive: true });
  const plate = path.join(dir, "plate.mp4");
  fs.writeFileSync(path.join(dir, "source.json"), JSON.stringify({ file: src, width: info.width, height: info.height }));

  if (!fs.existsSync(plate)) {
    console.log("Making the working copy");
    run("ffmpeg", [
      "-v", "error", "-y", "-i", src,
      "-vf", `scale=${W}:${H}:flags=lanczos,fps=${FPS},format=yuv420p`,
      "-c:v", "libx264", "-crf", "14", "-preset", "medium", "-g", String(FPS),
      "-c:a", "aac", "-b:a", "256k", plate,
    ]);
  }
  if (k4) plate4k(dir);
  const wordsFile = path.join(dir, "words.json");
  if (!fs.existsSync(wordsFile)) {
    const words = loadWords(plate, { workDir: path.join(dir, ".words") });
    fs.writeFileSync(wordsFile, JSON.stringify(words.map((w) => ({ w: w.word, t: w.start, e: w.end }))));
  }
  console.log(dir);
  return dir;
}

// Reads the cut-out's alpha small and finds, per sample: the top of the head, its centre, its width and the chin
// (where the outline widens into the shoulders). Smoothed, so things placed off it drift with the speaker, not jitter.
export function trackHead(cut) {
  const sw = 270;
  const sh = 480;
  const raw = run("ffmpeg", [
    "-v", "error", ...decoder(cut), "-i", cut,
    "-vf", `fps=${TRACK_FPS},alphaextract,scale=${sw}:${sh},format=gray`,
    "-f", "rawvideo", "-",
  ], { binary: true });
  const n = Math.floor(raw.length / (sw * sh));
  const rows = [];
  let last = null;
  for (let f = 0; f < n; f += 1) {
    const px = (x, y) => raw[f * sw * sh + y * sw + x] > 128;
    const width = [];
    const centre = [];
    for (let y = 0; y < sh; y += 1) {
      let c = 0;
      let sum = 0;
      for (let x = 0; x < sw; x += 1) if (px(x, y)) { c += 1; sum += x; }
      width.push(c);
      centre.push(c ? sum / c : 0);
    }
    const top = width.findIndex((c) => c > 3);
    if (top < 0) { rows.push(last); continue; }
    const band = width.slice(top + Math.round(sh * 0.04), top + Math.round(sh * 0.1)).sort((a, b) => a - b);
    const headW = band[Math.floor(band.length / 2)] || width[top];
    let chin = top + Math.round(headW * 1.3);
    for (let y = top + Math.round(headW * 0.9); y < Math.min(sh, top + headW * 2.2); y += 1) {
      if (width[y] > headW * 1.7) { chin = y; break; }
    }
    const cx = centre.slice(top, top + Math.round(headW * 0.8)).reduce((a, b) => a + b, 0) / Math.round(headW * 0.8);
    last = { top: top / sh * H, cx: cx / sw * W, w: headW / sw * W, chin: chin / sh * H };
    rows.push(last);
  }
  const filled = rows.map((r, i) => r ?? rows.slice(i).find(Boolean) ?? { top: H * 0.25, cx: W / 2, w: W * 0.33, chin: H * 0.55 });
  const smooth = filled.map((_, i) => {
    const win = filled.slice(Math.max(0, i - 3), i + 4);
    const out = {};
    for (const k of ["top", "cx", "w", "chin"]) out[k] = Math.round(win.reduce((a, r) => a + r[k], 0) / win.length);
    return out;
  });
  return { fps: TRACK_FPS, frames: smooth };
}

// FFmpeg's built-in VP9 decoder drops alpha; libvpx keeps it.
const decoder = (file) => (file.endsWith(".webm") ? ["-c:v", "libvpx-vp9"] : []);

// The 4K working copy, made once from the original video that prep recorded. A source under 2160 wide is refused rather
// than scaled up: a 4K file of upscaled pixels is no sharper.
export function plate4k(dir) {
  const out = path.join(dir, "plate4k.mp4");
  if (fs.existsSync(out)) return out;
  const srcFile = path.join(dir, "source.json");
  if (!fs.existsSync(srcFile)) throw new UsageError(`${dir} was prepared before 4K. Run prep again: animate vfx prep <video> --4k`);
  const src = JSON.parse(fs.readFileSync(srcFile, "utf8"));
  if (src.width < W * 2) throw new UsageError(`4K needs a source at least ${W * 2} wide; ${path.basename(src.file)} is ${src.width}x${src.height}. Render without --4k.`);
  console.log("Making the 4K working copy");
  run("ffmpeg", [
    "-v", "error", "-y", "-i", src.file,
    "-vf", `scale=${W * 2}:${H * 2}:flags=lanczos,fps=${FPS},format=yuv420p`,
    "-c:v", "libx264", "-crf", "14", "-preset", "medium", "-g", String(FPS),
    "-c:a", "aac", "-b:a", "256k", out,
  ]);
  return out;
}

function loadPrep(dir) {
  for (const f of ["plate.mp4", "words.json"]) {
    if (!fs.existsSync(path.join(dir, f))) throw new UsageError(`${dir} isn't prepared. Run: animate vfx prep <video>`);
  }
  // A whole-video cut-out made earlier (cut.webm + head.json) is used as is.
  const whole = fs.existsSync(path.join(dir, "cut.webm")) && fs.existsSync(path.join(dir, "head.json"));
  return {
    dir,
    plate: path.join(dir, "plate.mp4"),
    plate4k: path.join(dir, "plate4k.mp4"),
    whole: whole ? { file: path.join(dir, "cut.webm"), head: JSON.parse(fs.readFileSync(path.join(dir, "head.json"), "utf8")) } : null,
    words: JSON.parse(fs.readFileSync(path.join(dir, "words.json"), "utf8")),
  };
}

// The speaker cut out of start..end only, cached, and the head track for that stretch (t = 0 at start). offset is
// where the cut-out file's first frame sits on the video's timeline.
function cutFor(P, start, end) {
  if (P.whole) {
    const i0 = Math.floor(start * P.whole.head.fps);
    const frames = P.whole.head.frames.slice(i0, Math.ceil(end * P.whole.head.fps) + 2);
    return { file: P.whole.file, offset: 0, head: { fps: P.whole.head.fps, frames } };
  }
  const dir = path.join(P.dir, "cuts");
  const stem = path.join(dir, `${start.toFixed(3)}-${end.toFixed(3)}`);
  if (!fs.existsSync(`${stem}.mov`)) {
    fs.mkdirSync(dir, { recursive: true });
    run("ffmpeg", [
      "-v", "error", "-y", "-i", P.plate, "-vf", `trim=start=${start.toFixed(4)}:end=${end.toFixed(4)},setpts=PTS-STARTPTS`,
      "-an", "-c:v", "libx264", "-crf", "10", "-preset", "veryfast", `${stem}.mp4`,
    ]);
    console.log(`Cutting the speaker out of ${start.toFixed(2)}-${end.toFixed(2)}s`);
    cutOut(`${stem}.mp4`, `${stem}.mov`);
    fs.rmSync(`${stem}.mp4`, { force: true });
  }
  if (!fs.existsSync(`${stem}.json`)) fs.writeFileSync(`${stem}.json`, JSON.stringify(trackHead(`${stem}.mov`)));
  return { file: `${stem}.mov`, offset: start, head: JSON.parse(fs.readFileSync(`${stem}.json`, "utf8")) };
}

// One effect on one stretch, from..to seconds of the prepared video. key is the word or time the effect lands on.
export function renderEffect(prepDir, name, { from, to, key, varsFile, set = [], values, out, draft, k4 } = {}) {
  const P = loadPrep(path.resolve(prepDir));
  const S = k4 ? 2 : 1;
  if (k4) plate4k(P.dir);
  const fx = loadEffect(name);
  const vars = values ? { ...resolveVars(fx, undefined, []), ...values } : resolveVars(fx, varsFile, set);
  const start = Number(from);
  const end = Number(to);
  if (!(end > start)) throw new UsageError(`${name}: --to must come after --from`);
  const duration = Math.round((end - start) * FPS) / FPS;
  const keyAt = key === undefined ? Math.min(fx.timing?.keyAt ?? 0.6, duration / 2) : Number(key) - start;

  const cut = cutFor(P, start, end);
  const head = cut.head;
  // A freeze holds the picture from the key word to the end of the stretch, so the head holds too.
  if (fx.freeze) {
    const k = Math.min(Math.round(keyAt * head.fps), head.frames.length - 1);
    head.frames = head.frames.map((f, i) => (i > k ? head.frames[k] : f));
  }
  const words = P.words.filter((w) => w.t >= start - 0.05 && w.t < end).map((w) => ({ w: w.w, t: +(w.t - start).toFixed(3), e: +(w.e - start).toFixed(3) }));
  const timing = { key: keyAt, hold: duration - keyAt, exit: 0, duration, design: fx.timing?.keyAt ?? keyAt, scale: 1 };

  let card = null;
  let shift = 0;
  if (fx.layout === "split") {
    const tops = head.frames.map((f) => f.top).sort((a, b) => a - b);
    shift = Math.round(CARD.y - CARD.rise - tops[Math.floor(tops.length / 2)]);
    card = { ...CARD, shift };
  }

  const work = path.join(P.dir, ".effects");
  const layers = {};
  for (const layer of fx.layers) {
    const project = fx.backdrop && layer === "back"
      ? backdropProject(vars, keyAt, duration, work)
      : buildProject({ block: fx, variant: "full", vars, timing, workDir: work, fps: FPS, alpha: true, extra: { layer, head, words, card } });
    const file = path.join(work, `${name}-${start.toFixed(2)}-${layer}${k4 ? "-4k" : ""}.mov`);
    console.log(`Rendering ${name} ${layer} (${duration.toFixed(2)}s from ${start.toFixed(2)}s)`);
    renderProject(project, file, { format: "mov", fps: FPS, quality: draft ? "draft" : "looks", resolution: k4 ? "portrait-4k" : undefined });
    layers[layer] = file;
  }

  const file = path.resolve(out ?? path.join(P.dir, `${name}-${start.toFixed(2)}${k4 ? "-4k" : ""}.mp4`));
  stack(P, {
    start, duration, layers, card, file, draft, cut, S,
    camera: fx.camera && cameraMove(fx.camera, vars, head, keyAt, duration),
    freeze: fx.freeze ? { at: keyAt, mono: vars.mono !== false } : null,
    dim: fx.backdrop ? Number(vars.dim ?? 0) : 0,
    tight: Boolean(fx.backdrop),
  });
  console.log(`  ${file}`);
  return { file, start, duration };
}

// backdrop: one of the pack's /animate blocks becomes the room behind the speaker, its key moment on the key word.
// vars.animation names the block; vars.animationVars (an object) feeds it, as `animate vars <block>` lists.
function backdropProject(vars, keyAt, duration, work) {
  const block = loadBlock(String(vars.animation));
  const given = typeof vars.animationVars === "string" && vars.animationVars ? JSON.parse(vars.animationVars) : vars.animationVars ?? {};
  const values = { ...resolveVars(block, undefined, []), ...given };
  if (keyAt < block.timing.minKeyAt) {
    throw new UsageError(`${block.name} needs ${block.timing.minKeyAt}s before its key moment; start the stretch earlier or land later.`);
  }
  const timing = { key: keyAt, hold: duration - keyAt, exit: 0, duration, design: block.timing.keyAt, scale: keyAt / block.timing.keyAt };
  return buildProject({ block, variant: "full", vars: values, timing, workDir: work, fps: FPS, alpha: false });
}

// A camera move on the whole stacked frame, aimed at the middle of the face. snap: a hard punch-in on the key word that
// holds to the end of the stretch. push: a slow eased push across the stretch while the room behind goes soft.
function cameraMove(spec, vars, head, keyAt, duration) {
  const mid = (k) => head.frames.map((f) => f[k]).sort((a, b) => a - b)[Math.floor(head.frames.length / 2)];
  const cx = mid("cx") / W;
  const cy = ((mid("top") + mid("chin")) / 2) / H;
  const zoom = Number(vars.zoom ?? spec.zoom);
  if (spec.kind === "snap") {
    const k = keyAt.toFixed(3);
    return { cx, cy, z: `if(lt(t,${k}),1,1+${(zoom - 1).toFixed(3)}*min((t-${k})/0.08,1))`, soften: 0 };
  }
  const p = `min(t/${duration.toFixed(3)},1)`;
  return { cx, cy, z: `1+${(zoom - 1).toFixed(3)}*(${p})*(${p})*(3-2*(${p}))`, soften: Number(vars.soften ?? spec.soften ?? 0), duration };
}

// The shot, the back layer, the speaker, the front layer. In a split the shot and the speaker move down into the card,
// the back layer covers everything but the card, and only the head above the card's edge comes from the cut-out.
function stack(P, { start, duration, layers, card, file, draft, cut, camera, freeze, dim, tight, S = 1 }) {
  const w = W * S;
  const h = H * S;
  // A freeze plays up to the key word, then holds that frame for the rest of the stretch (the voice carries on).
  const trim = (at) => (freeze
    ? `trim=start=${at.toFixed(4)}:duration=${freeze.at.toFixed(4)},setpts=PTS-STARTPTS,tpad=stop_mode=clone:stop_duration=${(duration - freeze.at + 0.1).toFixed(4)},trim=duration=${duration.toFixed(4)}`
    : `trim=start=${at.toFixed(4)}:duration=${duration.toFixed(4)},setpts=PTS-STARTPTS`);
  const inputs = ["-i", S > 1 ? P.plate4k : P.plate, ...decoder(cut.file), "-i", cut.file];
  const chain = S > 1
    // The speaker's pixels from the 4K shot, through the 1080 matte scaled up: the same cut-out, at full sharpness.
    ? [`[0:v]${trim(start)},format=yuva444p,split[plate][pc]`, `[1:v]${trim(start - cut.offset)},alphaextract,scale=${w}:${h}:flags=bicubic[ca]`, `[pc][ca]alphamerge[cut]`]
    : [`[0:v]${trim(start)},format=yuva444p[plate]`, `[1:v]${trim(start - cut.offset)},format=yuva444p[cut]`];
  let base = "[plate]";
  let cutout = "[cut]";
  if (freeze?.mono) {
    // The room drops to black and white on the freeze; the speaker, from the cut-out, keeps their colour.
    chain.push(`${base}hue=s=0:enable='gte(t,${freeze.at.toFixed(3)})'[platem]`);
    base = "[platem]";
  }
  if (camera?.soften) {
    // The room softens as the push goes in; the speaker, drawn on top from the cut-out, stays sharp.
    chain.push(`[plate]split[pa][pb]`, `[pb]gblur=sigma=${camera.soften * S}[pbl]`);
    chain.push(`[pa][pbl]blend=all_expr='A+(B-A)*min(T/${camera.duration.toFixed(3)},1)'[plates]`);
    base = "[plates]";
  }
  if (card) {
    chain.push(`[plate]pad=${w}:${h + card.shift * S}:0:${card.shift * S}:black,crop=${w}:${h}:0:0[plate2]`);
    // Over a flat page the cut-out's soft hair edge shows the room as a grey halo, so the alpha is tightened.
    chain.push(`[cut]pad=${w}:${h + card.shift * S}:0:${card.shift * S}:black@0,crop=${w}:${h}:0:0,crop=${w}:${(card.y + 4) * S}:0:0,lut=a='clip((val-70)*1.45,0,255)'[cut2]`);
    base = "[plate2]";
    cutout = "[cut2]";
  }
  if (tight && !card) {
    // Over a new room the soft hair edge would carry the old room's colour as a fringe.
    chain.push(`[cut]lut=a='clip((val-70)*1.45,0,255)'[cutt]`);
    cutout = "[cutt]";
  }
  let n = 2;
  const over = (top, label) => {
    chain.push(`${base}${top}overlay=0:0:format=auto[${label}]`);
    base = `[${label}]`;
  };
  if (layers.back) {
    inputs.push("-i", layers.back);
    const darken = dim ? `,colorchannelmixer=rr=${1 - dim}:gg=${1 - dim}:bb=${1 - dim}` : "";
    chain.push(`[${n}:v]setpts=PTS-STARTPTS${darken},format=yuva444p[back]`);
    n += 1;
    over("[back]", "b1");
  }
  over(cutout, "b2");
  if (layers.front) {
    inputs.push("-i", layers.front);
    chain.push(`[${n}:v]setpts=PTS-STARTPTS,format=yuva444p[front]`);
    n += 1;
    over("[front]", "b3");
  }
  if (camera) {
    chain.push(`${base}scale=w='trunc(${w}*(${camera.z})/2)*2':h='trunc(${h}*(${camera.z})/2)*2':eval=frame:flags=bicubic,` +
      `crop=${w}:${h}:x='(in_w-${w})*${camera.cx.toFixed(4)}':y='(in_h-${h})*${camera.cy.toFixed(4)}'[cam]`);
    base = "[cam]";
  }
  chain.push(`${base}format=yuv420p[v]`);
  chain.push(`[0:a]atrim=start=${start.toFixed(4)}:duration=${duration.toFixed(4)},asetpts=PTS-STARTPTS[a]`);
  run("ffmpeg", [
    "-v", "error", "-y", ...inputs,
    "-filter_complex", chain.join(";"),
    "-map", "[v]", "-map", "[a]", "-r", String(FPS),
    "-c:v", "libx264", "-crf", draft ? "22" : "15", "-preset", draft ? "veryfast" : "medium",
    "-c:a", "aac", "-b:a", "256k", "-movflags", "+faststart", file,
  ]);
}

export function vfxCommand(args, o) {
  const [sub, target] = args;
  const need = (what) => {
    if (!target) throw new UsageError(`vfx ${sub} needs ${what}`);
    return target;
  };
  if (sub === "list") {
    for (const name of listEffects()) console.log(`${name.padEnd(18)} ${loadEffect(name).summary}`);
    return;
  }
  if (sub === "vars") {
    for (const v of loadEffect(need("an effect name")).variables) {
      console.log(`${v.id.padEnd(20)} ${v.type.padEnd(7)} ${JSON.stringify(v.default)}  ${v.label}`);
    }
    return;
  }
  if (sub === "prep") return prep(need("a video"), { out: o.out, k4: o["4k"] });
  if (sub === "render") {
    if (!o.prep) throw new UsageError("vfx render needs --prep <folder> (from: animate vfx prep <video>)");
    return renderEffect(o.prep, need("an effect name"), {
      from: o.from, to: o.to, key: o.at, varsFile: o.vars, set: o.set, draft: o.draft, k4: o["4k"],
      out: o.save,
    });
  }
  if (sub === "plan") return renderPlan(need("a plan file"), { draft: o.draft, k4: o["4k"] });
  throw new UsageError("vfx commands: list, vars <effect>, prep <video>, render <effect> --prep <folder> --from <s> --to <s>, plan <plan.json>");
}

// A whole edit: every effect in plan.effects rendered on its stretch, then laid back over the working copy.
export function renderPlan(planFile, { draft, k4 } = {}) {
  const planPath = path.resolve(planFile);
  const plan = JSON.parse(fs.readFileSync(planPath, "utf8"));
  const prepDir = path.resolve(path.dirname(planPath), plan.prep);
  const P = loadPrep(prepDir);
  const made = plan.effects.map((e) =>
    renderEffect(prepDir, e.fx, { from: e.from, to: e.to, key: e.key, values: e.vars ?? {}, draft, k4 }),
  );
  const file = path.resolve(path.dirname(planPath), plan.out ?? "vfx-edit.mp4");
  const inputs = ["-i", k4 ? P.plate4k : P.plate];
  const chain = [];
  let base = "[0:v]";
  made.forEach((m, i) => {
    inputs.push("-i", m.file);
    chain.push(`[${i + 1}:v]setpts=PTS-STARTPTS+${m.start.toFixed(4)}/TB[e${i}]`);
    chain.push(`${base}[e${i}]overlay=0:0:enable='between(t,${m.start.toFixed(4)},${(m.start + m.duration - 0.001).toFixed(4)})':eof_action=pass[o${i}]`);
    base = `[o${i}]`;
  });
  chain.push(`${base}format=yuv420p[v]`);
  run("ffmpeg", [
    "-v", "error", "-y", ...inputs, "-filter_complex", chain.join(";"),
    "-map", "[v]", "-map", "0:a", "-c:v", "libx264", "-crf", draft ? "22" : "16", "-preset", draft ? "veryfast" : "medium",
    "-c:a", "copy", "-movflags", "+faststart", file,
  ]);
  console.log(file);
  return file;
}
