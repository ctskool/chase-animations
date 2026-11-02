// /explain: a short vertical explainer, narrated in the member's own voice.
//   new     makes the folder and an empty script.json for Claude to write
//   check   checks script.json and writes script.md, the words to record
//   build   lines the recording up with the script and assembles the HyperFrames project,
//           or with --preview, times it to a reading pace with no sound, to see before recording
//   render  renders the video and a contact sheet
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { PACK, UsageError, hyperframes, renderProject } from "./build.mjs";
import { contactSheet } from "./compose.mjs";
import { alignWords, paceWords, phraseWords, plainText, sceneTimes, scriptWords } from "./explain-align.mjs";
import { loadWords } from "./sync.mjs";

export const KIT = path.join(PACK, "explain-kit");
const kitInfo = () => JSON.parse(fs.readFileSync(path.join(KIT, "kit.json"), "utf8"));
const W = 1080;
const H = 1920;
const TITLE_HOLD = 2.6;

export const slugify = (s) =>
  String(s)
    .toLowerCase()
    .replace(/^how\s+(does\s+|do\s+|a\s+|an\s+|the\s+)*/, "")
    .replace(/\b(works?|work out)\b/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "explainer";

function run(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, { encoding: "utf8", maxBuffer: 1 << 26, ...opts });
  if (res.error?.code === "ENOENT") throw new UsageError(`${cmd} isn't installed. See docs/INSTALL.md.`);
  if (res.status !== 0) throw new Error(`${cmd} failed:\n${(res.stderr || res.stdout || "").slice(-1500)}`);
  return res.stdout;
}

function readScript(dir) {
  const text = fs.readFileSync(path.join(dir, "script.json"), "utf8").replace(/^﻿/, "");
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new UsageError(`script.json in ${dir} isn't valid JSON: ${err.message}`);
  }
}

const folderOf = (target) => {
  if (!target) throw new UsageError("Give the explainer's folder, for example: animate explain build explain/solar-panels-make-power --audio take1.m4a");
  const dir = path.resolve(target);
  const file = path.join(dir, "script.json");
  if (!fs.existsSync(file)) throw new UsageError(`No script.json in ${dir}. Start one with: animate explain new "how <thing> works"`);
  return dir;
};

// ---------------------------------------------------------------- script

export function validateScript(script) {
  const problems = [];
  const notes = [];
  const kit = kitInfo().scenes;
  if (!script.title) problems.push(`"title" is missing (the bold line on the end card).`);
  if (!Array.isArray(script.scenes) || !script.scenes.length) problems.push(`"scenes" is empty.`);
  const scenes = script.scenes ?? [];
  if (scenes.length && (scenes.length < 3 || scenes.length > 7)) notes.push(`${scenes.length} scenes. Four to six reads best.`);
  scenes.forEach((s, i) => {
    const n = i + 1;
    if (!s.text || !String(s.text).trim()) problems.push(`Scene ${n} has no text.`);
    const type = s.visual?.type;
    if (!type) problems.push(`Scene ${n} has no visual.type.`);
    else if (!kit[type]) problems.push(`Scene ${n}: "${type}" isn't in the kit. Use ${Object.keys(kit).join(", ")}.`);
    if (type === "custom" && !s.visual.module) problems.push(`Scene ${n} is custom but has no "module".`);
    if (type === "title" && i !== scenes.length - 1) problems.push(`Scene ${n}: a title card can only be the last scene.`);
  });
  if (!problems.length) {
    try {
      const words = scriptWords(scenes);
      const count = words.length;
      if (count < 40 || count > 75) notes.push(`${count} words. Aim for 45 to 70, about 15 to 25 seconds.`);
      const { phrases, notes: phraseNotes } = phraseWords(estimateTimes(words));
      notes.push(...phraseNotes);
      const long = phrases.filter((p) => p.words.length > 4);
      if (long.length) notes.push(`${long.length} phrases over four words.`);
    } catch (err) {
      problems.push(err.message);
    }
  }
  return { problems, notes };
}

// Rough speaking times, so the script can be checked before anything is recorded.
function estimateTimes(words) {
  let t = 0.3;
  return words.map((w) => {
    const d = 0.12 + w.text.length * 0.045;
    const out = { ...w, start: t, end: t + d };
    t += d + 0.06 + (w.sentenceEnd ? 0.35 : w.clauseEnd ? 0.15 : 0);
    return out;
  });
}

export function readAloud(script) {
  return script.scenes.map((s) => plainText(s.text)).join("\n\n");
}

function writeScriptMd(dir, script) {
  const words = scriptWords(script.scenes).length;
  const body = [
    `# ${script.title}${script.subtitle ? `: ${script.subtitle}` : ""}`,
    "",
    `Read this in one take, at your normal pace. About ${words} words, ${Math.round(words / 2.6)} to ${Math.round(words / 2.2)} seconds.`,
    "A small slip or a restart is fine: keep going and the timing will follow what you actually said.",
    "",
    "---",
    "",
    readAloud(script),
    "",
  ].join("\n");
  fs.writeFileSync(path.join(dir, "script.md"), body);
}

export function newExplainer(topic, o) {
  if (!topic) throw new UsageError('Say what to explain: animate explain new "how fiber internet carries light"');
  const dir = path.resolve(o.out ?? "explain", slugify(topic));
  const file = path.join(dir, "script.json");
  if (fs.existsSync(file)) throw new UsageError(`${file} already exists. Edit it, or pick another topic.`);
  fs.mkdirSync(dir, { recursive: true });
  const skeleton = {
    topic,
    title: "",
    subtitle: "",
    accent: "#FF7A2F",
    facts: [],
    scenes: [
      { text: "", visual: { type: "hero", object: "box" } },
      { text: "", visual: { type: "flow" } },
      { text: "", visual: { type: "stack" } },
      { text: "", visual: { type: "number" } },
    ],
  };
  fs.writeFileSync(file, JSON.stringify(skeleton, null, 2) + "\n");
  console.log(file);
  console.log("Write the script into it (see the explain skill), then run: animate explain check " + path.relative(process.cwd(), dir));
  return dir;
}

export function checkExplainer(target) {
  const dir = folderOf(target);
  const script = readScript(dir);
  const { problems, notes } = validateScript(script);
  for (const n of notes) console.log(`  note: ${n}`);
  if (problems.length) throw new UsageError(problems.map((p) => `  ${p}`).join("\n"));
  writeScriptMd(dir, script);
  console.log(`\n${readAloud(script)}\n`);
  console.log(`${scriptWords(script.scenes).length} words. Saved ${path.join(dir, "script.md")}`);
  return script;
}

// ---------------------------------------------------------------- build

function audioDuration(file) {
  const out = run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", file]);
  return Number(out.trim());
}

// Resolves "on": "word" (and "xOn") inside a scene's visual to local seconds ("at", "xAt").
function resolveCues(visual, words, sceneStart, report, n) {
  const find = (phrase) => {
    const want = String(phrase).toLowerCase().split(/\s+/).map((s) => s.replace(/[^\p{L}\p{N}%]/gu, ""));
    for (let i = 0; i + want.length <= words.length; i++) {
      if (want.every((w, k) => words[i + k].text.toLowerCase().replace(/[^\p{L}\p{N}%]/gu, "") === w)) return words[i].start - sceneStart;
    }
    return null;
  };
  const walk = (obj) => {
    if (Array.isArray(obj)) return obj.map(walk);
    if (!obj || typeof obj !== "object") return obj;
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      if ((k === "on" || /On$/.test(k)) && typeof v === "string") {
        const at = find(v);
        const atKey = k === "on" ? "at" : k.replace(/On$/, "At");
        if (at === null) report.push(`Scene ${n}: "${v}" (${k}) isn't in this scene's text, so it uses its default time.`);
        else if (obj[atKey] === undefined) out[atKey] = Math.max(0, at);
      }
      out[k] = walk(v);
    }
    return out;
  };
  return walk(visual);
}

const DEFAULT_THEME = { bgCenter: "#1b1e24", bgEdge: "#040506", ink: "#F6F3EE", muted: "#C9CCD1", floor: "#131518" };

export function buildExplainer(target, o) {
  const dir = folderOf(target);
  const script = readScript(dir);
  const { problems } = validateScript(script);
  if (problems.length) throw new UsageError(problems.join("\n"));
  writeScriptMd(dir, script);

  const work = path.join(dir, ".work");
  fs.mkdirSync(work, { recursive: true });
  const stateFile = path.join(dir, "timing.json");
  const previous = fs.existsSync(stateFile) ? JSON.parse(fs.readFileSync(stateFile, "utf8")) : null;
  // A preview is timed to a natural reading pace and has no sound. A recording always wins:
  // --audio replaces a preview completely, and a plain rebuild keeps whichever was used last.
  if (o.preview && o.audio) throw new UsageError("Use --preview or --audio, not both. --audio builds to the recording.");
  const preview = Boolean(o.preview) || (!o.audio && previous?.preview === true);
  const audioIn = preview ? null : o.audio ? path.resolve(o.audio) : previous?.audio;
  if (!preview && !audioIn) {
    throw new UsageError("build needs the recording: --audio <file> (any audio or video file), or --preview to see it first, silent, at a reading pace");
  }
  if (audioIn && !fs.existsSync(audioIn)) throw new UsageError(`Can't find ${audioIn}`);

  const script0 = scriptWords(script.scenes);
  const lines = [];
  let aligned;
  let report;
  let voice = null;
  if (preview) {
    aligned = paceWords(script0);
    const span = aligned[aligned.length - 1].end - aligned[0].start;
    report = { quality: "preview", coverage: 1, missing: [], extra: [] };
    lines.push(`Preview: no recording, timed to a reading pace of ${(aligned.length / span).toFixed(2)} words a second (${span.toFixed(1)}s of speech). Silent.`);
    console.log(lines[0]);
  } else {
    // One clean, level copy of the voice. Phone recordings vary a lot in loudness.
    voice = path.join(work, "voice-full.wav");
    const stamp = `${audioIn}|${fs.statSync(audioIn).size}|${fs.statSync(audioIn).mtimeMs}`;
    const stampFile = path.join(work, "voice-full.txt");
    if (!fs.existsSync(voice) || !fs.existsSync(stampFile) || fs.readFileSync(stampFile, "utf8") !== stamp) {
      console.log("Preparing the recording");
      run("ffmpeg", ["-v", "error", "-y", "-i", audioIn, "-vn", "-af", "highpass=f=70,loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", "48000", "-ac", "1", voice]);
      fs.writeFileSync(stampFile, stamp);
    }
    const spoken = loadWords(voice, { workDir: work, model: o.model, language: o.language, transcript: o.transcript });
    if (!spoken.length) throw new UsageError("No speech was found in the recording.");
    ({ words: aligned, report } = alignWords(script0, spoken));
    lines.push(`Alignment: ${report.quality} (${Math.round(report.coverage * 100)}% of the script heard, ${report.spokenWords} words spoken)`);
    report.perScene.forEach((s, i) => lines.push(`  scene ${i + 1}: ${s.heard}/${s.words} words heard`));
    if (report.missing.length) lines.push(`  not heard, timed between their neighbours: ${report.missing.map((m) => m.text).join(", ")}`);
    for (const e of report.extra) lines.push(`  said but not in the script, no caption: "${e.text}" at ${e.start.toFixed(2)}s`);
    console.log(lines.join("\n"));
    if (report.quality === "failed" && !o.force) {
      throw new UsageError(
        "The recording doesn't match the script well enough to time it. Check it's the right take, or that the script matches what was said, then build again. Add --force to build anyway.",
      );
    }
    if (report.quality === "poor") console.log("  Timing may be off in places. Check the contact sheet, or re-record the scenes listed above.");
  }

  // Start the video just before the first word.
  const lead = Math.max(0, aligned[0].start - 0.35);
  const words = aligned.map((w) => ({ ...w, start: w.start - lead, end: w.end - lead }));
  const speechEnd = words[words.length - 1].end;
  const scenesIn = script.scenes.map((s) => ({ ...s }));
  const hasTitle = scenesIn[scenesIn.length - 1].visual.type === "title";
  const times = sceneTimes(words, scenesIn.length, { tail: hasTitle ? 2.2 : 0.55 });
  const notes = [];
  const scenes = scenesIn.map((s, i) => {
    const { type, module, ...params } = s.visual;
    const sceneWords = words.filter((w) => w.scene === i);
    const resolved = resolveCues(params, sceneWords, times[i].start, notes, i + 1);
    return {
      type,
      module: type === "custom" ? `../custom/${path.basename(module)}` : `./scenes/${type}.js`,
      customFrom: type === "custom" ? path.resolve(dir, module) : null,
      start: times[i].start,
      end: times[i].end,
      params: resolved,
      keys: sceneWords.filter((w) => w.key !== null).map((w) => w.start - times[i].start),
      words: sceneWords.map((w) => ({ text: w.text, start: w.start - times[i].start, end: w.end - times[i].start })),
    };
  });
  if (!hasTitle) {
    const last = scenes[scenes.length - 1];
    scenes.push({ type: "title", module: "./scenes/title.js", start: last.end, end: last.end + TITLE_HOLD, params: {}, keys: [], words: [] });
  }
  const title = scenes[scenes.length - 1];
  title.params = { ...(script.end ?? {}), ...title.params, title: script.title, subtitle: script.subtitle ?? "" };
  const duration = Math.ceil(scenes[scenes.length - 1].end * 30) / 30;
  scenes[scenes.length - 1].end = duration;
  for (const n of notes) console.log(`  note: ${n}`);

  const { phrases, notes: phraseNotes } = phraseWords(words);
  for (const n of phraseNotes) console.log(`  caption: ${n}`);

  const timing = {
    audio: audioIn,
    preview,
    lead,
    duration,
    report: { quality: report.quality, coverage: report.coverage, missing: report.missing, extra: report.extra },
    scenes: scenes.map(({ type, start, end }) => ({ type, start, end })),
    phrases: phrases.map((p) => ({ text: p.words.map((w) => (w.key ? `[${w.text}]` : w.text)).join(" "), start: p.start, end: p.end })),
  };
  fs.writeFileSync(stateFile, JSON.stringify(timing, null, 2) + "\n");
  fs.writeFileSync(path.join(dir, "alignment.txt"), lines.concat(notes.map((n) => `  note: ${n}`), phraseNotes.map((n) => `  caption: ${n}`)).join("\n") + "\n");

  const project = assemble({ dir, script, scenes, phrases, duration, voice, lead, speechEnd, o });
  console.log(`Built ${duration.toFixed(2)}s, ${scenes.length} scenes, ${phrases.length} caption phrases`);
  console.log(`  ${project}`);
  return { project, timing };
}

function copyKit(project) {
  const kitOut = path.join(project, "kit");
  fs.cpSync(KIT, kitOut, { recursive: true, filter: (p) => !/[\\/]examples([\\/]|$)/.test(p) });
  const nm = path.join(PACK, "node_modules");
  const v = path.join(project, "vendor");
  fs.mkdirSync(path.join(v, "three", "addons", "geometries"), { recursive: true });
  fs.mkdirSync(path.join(v, "three", "addons", "loaders"), { recursive: true });
  fs.mkdirSync(path.join(v, "fonts"), { recursive: true });
  fs.copyFileSync(path.join(nm, "gsap", "dist", "gsap.min.js"), path.join(v, "gsap.min.js"));
  for (const f of ["three.module.js", "three.core.js"]) fs.copyFileSync(path.join(nm, "three", "build", f), path.join(v, "three", f));
  const jsm = path.join(nm, "three", "examples", "jsm");
  for (const f of ["geometries/RoundedBoxGeometry.js", "geometries/TextGeometry.js", "loaders/FontLoader.js"]) {
    fs.copyFileSync(path.join(jsm, f), path.join(v, "three", "addons", f));
  }
  fs.copyFileSync(path.join(nm, "three", "examples", "fonts", "helvetiker_bold.typeface.json"), path.join(v, "fonts", "helvetiker_bold.typeface.json"));
  fs.cpSync(path.join(PACK, "shared", "fonts"), path.join(project, "fonts"), {
    recursive: true,
    filter: (p) => !p.endsWith("licenses") && !p.endsWith(".css") && !p.endsWith(".txt"),
  });
}

function assemble({ dir, script, scenes, phrases, duration, voice, lead, o }) {
  const project = path.join(dir, ".work", "project");
  fs.rmSync(project, { recursive: true, force: true });
  fs.mkdirSync(path.join(project, "assets"), { recursive: true });
  copyKit(project);
  for (const s of scenes) {
    if (!s.customFrom) continue;
    if (!fs.existsSync(s.customFrom)) throw new UsageError(`Custom scene not found: ${s.customFrom}`);
    fs.mkdirSync(path.join(project, "custom"), { recursive: true });
    fs.copyFileSync(s.customFrom, path.join(project, "custom", path.basename(s.customFrom)));
  }
  // The voice, trimmed to start just before the first word, with a short fade so nothing clicks.
  // A preview has no voice and no audio track at all.
  if (voice) {
    run("ffmpeg", [
      "-v", "error", "-y", "-ss", lead.toFixed(3), "-i", voice,
      "-af", `afade=t=in:d=0.02,apad=pad_dur=${TITLE_HOLD + 1}`, "-t", duration.toFixed(3),
      "-ar", "48000", "-ac", "2", path.join(project, "assets", "voice.wav"),
    ]);
  }
  const theme = { ...DEFAULT_THEME, ...(script.theme ?? {}), accent: script.accent ?? "#FF7A2F" };
  const data = {
    width: W,
    height: H,
    fps: 30,
    duration,
    seed: script.seed ?? 7,
    pixelRatio: o.draft ? 1 : 1.5,
    subjectY: 1130,
    theme,
    fonts: ["800 84px 'Inter Tight'", "700 46px 'Barlow Condensed'", "600 46px 'Barlow Condensed'", "500 50px Inter", "italic 500 50px Inter", "700 50px Inter"],
    captions: { top: 290, height: 340, size: 84, min: 56 },
    scenes: scenes.map(({ customFrom, ...s }) => s),
    phrases: phrases.map((p) => ({ show: p.show, hide: p.hide, start: p.start, end: p.end, words: p.words })),
  };
  const fontsCss = fs.readFileSync(path.join(PACK, "shared", "fonts", "fonts.css"), "utf8");
  const kitCss = fs.readFileSync(path.join(KIT, "kit.css"), "utf8");
  const attr = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=${W}, height=${H}" />
<title>${attr(script.title)}</title>
<script type="application/json" id="explain-data">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>
<script type="importmap">{"imports":{"three":"./vendor/three/three.module.js","three/addons/":"./vendor/three/addons/"}}</script>
<script src="vendor/gsap.min.js"></script>
<style>
${fontsCss}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${W}px;height:${H}px;overflow:hidden;background:#000}
${kitCss}
</style>
</head>
<body>
<div id="ex-root" data-composition-id="explain" data-start="0" data-duration="${duration}" data-fps="30" data-width="${W}" data-height="${H}">
<canvas id="ex-gl" role="img" aria-label="${attr(script.title)}"></canvas>
<div id="ex-overlays"></div>
<div id="ex-captions"></div>
${voice ? `<audio id="ex-voice" src="assets/voice.wav" data-start="0" data-duration="${duration}" data-track-index="1" data-volume="1"></audio>` : ""}
</div>
<script type="module">
import { start } from "./kit/director.js";
window.__hf = window.__hf || {};
window.__hf.buildReady = window.__hf.buildReady || {};
window.__hf.buildReady.explain = start().then(() => {
  window.__timelines["explain"] = gsap.timeline({ paused: true });
});
</script>
</body>
</html>
`;
  fs.writeFileSync(path.join(project, "index.html"), html);
  fs.writeFileSync(
    path.join(project, "hyperframes.json"),
    JSON.stringify({ $schema: "https://hyperframes.heygen.com/schema/hyperframes.json", media: { autoProxy: true } }, null, 2),
  );
  fs.writeFileSync(path.join(project, "package.json"), JSON.stringify({ name: `explain-${path.basename(dir)}`, private: true, type: "module" }, null, 2));
  return project;
}

// ---------------------------------------------------------------- render

export function renderExplainer(target, o) {
  const dir = folderOf(target);
  const { project, timing } = buildExplainer(target, o);
  const name = path.basename(dir);
  const out = path.resolve(o.out ?? dir);
  const tag = `${timing.preview ? "-preview" : ""}${o.draft ? "-draft" : ""}`;
  const file = path.join(out, `${name}${tag}.mp4`);
  console.log(`Rendering ${name}${timing.preview ? " preview, silent," : ""} (${timing.duration.toFixed(2)}s)`);
  renderProject(project, file, { fps: 30, quality: o.draft ? "draft" : "looks" });
  // The sheet: the middle of each scene, the first word of each caption phrase, and the end card.
  const picks = new Set();
  for (const s of timing.scenes) picks.add(Number(((s.start + s.end) / 2).toFixed(2)));
  timing.phrases.forEach((p, i) => {
    if (i % 2 === 0) picks.add(Number((p.start + 0.35).toFixed(2)));
  });
  picks.add(Number((timing.duration - 0.5).toFixed(2)));
  const times = [...picks].sort((a, b) => a - b).slice(0, 24);
  const sheet = path.join(out, `${name}${tag}-sheet.jpg`);
  contactSheet(file, sheet, times);
  console.log(`  ${file}`);
  console.log(`  ${sheet}`);
  return { file, sheet };
}

export function previewExplainer(target, o) {
  const { project } = buildExplainer(target, o);
  hyperframes(["preview", "."], { cwd: project });
}

export async function explain(args, o) {
  const [sub, ...rest] = args;
  const actions = {
    new: () => newExplainer(rest.join(" "), o),
    check: () => checkExplainer(rest[0]),
    build: () => buildExplainer(rest[0], o),
    render: () => renderExplainer(rest[0], o),
    preview: () => previewExplainer(rest[0], o),
  };
  if (!actions[sub]) throw new UsageError(`explain needs one of: ${Object.keys(actions).join(", ")}. Run animate with no arguments for help.`);
  return actions[sub]();
}
