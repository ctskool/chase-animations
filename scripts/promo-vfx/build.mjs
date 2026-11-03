#!/usr/bin/env node
// Builds and renders the effects promo: a phone running the effects skill on one clip, once per effect, with the
// speaker's own voice under each result, then an end card.
//   node scripts/promo-vfx/build.mjs [--cta "..."] [--cta-sub "..."] [--silent] [--draft] [--no-render]
// --silent leaves out the voice and the UI sounds, for adding music in the app.
// It needs the finished edit (promo.json "video") with every effect already on it.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { PACK, renderProject } from "../../shared/build.mjs";
import { contactSheet } from "../../shared/compose.mjs";
import { buildTimeline } from "./timeline.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const { values: o } = parseArgs({
  options: { cta: { type: "string" }, "cta-sub": { type: "string" }, draft: { type: "boolean" }, silent: { type: "boolean" }, "no-render": { type: "boolean" } },
});
const config = JSON.parse(fs.readFileSync(path.join(HERE, "promo.json"), "utf8"));
const OUT = path.join(PACK, "renders", "wip", "promo-vfx");
const PROJECT = path.join(OUT, ".work", "project");

function run(cmd, args) {
  const res = spawnSync(cmd, args, { encoding: "utf8", maxBuffer: 1 << 26 });
  if (res.status !== 0) throw new Error(`${cmd} failed:\n${(res.stderr || "").slice(-1200)}`);
  return res.stdout;
}

const VIDEO = path.resolve(PACK, config.video);

// A stretch of the finished edit, picture and voice as separate files (HyperFrames mixes <audio>). The voice gets
// a short fade at both ends so the cuts between demos don't click.
function excerpt(from, seconds, name, size, voice) {
  if (!fs.existsSync(VIDEO)) throw new Error(`Can't find ${VIDEO}. Assemble the edit first.`);
  const file = path.join(PROJECT, "assets", `${name}.mp4`);
  run("ffmpeg", [
    "-v", "error", "-y", "-ss", from.toFixed(3), "-i", VIDEO, "-t", seconds.toFixed(3),
    "-vf", `scale=${size}:-2:flags=lanczos,fps=30`, "-an", "-c:v", "libx264", "-crf", "14", "-preset", "slow", "-pix_fmt", "yuv420p", file,
  ]);
  if (voice) {
    run("ffmpeg", [
      "-v", "error", "-y", "-ss", from.toFixed(3), "-i", VIDEO, "-t", seconds.toFixed(3), "-vn",
      "-af", `afade=t=in:d=0.04,afade=t=out:st=${(seconds - 0.08).toFixed(3)}:d=0.08`, "-ar", "48000", "-ac", "2",
      path.join(PROJECT, "assets", `${name}.wav`),
    ]);
  }
  return { clip: `assets/${name}.mp4`, voice: voice ? `assets/${name}.wav` : null };
}

// Quiet UI sound made in code: soft key clicks, a send pop, a chime for each result and a low
// swell for the end card. Seeded, so every build is the same.
function writeSfx(file, timeline) {
  const rate = 48000;
  const n = Math.ceil(timeline.duration * rate);
  const L = new Float32Array(n);
  const R = new Float32Array(n);
  let seed = 12345;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  const add = (at, len, fn, pan = 0) => {
    const i0 = Math.round(at * rate);
    for (let i = 0; i < len * rate && i0 + i < n; i++) {
      const v = fn(i / rate);
      L[i0 + i] += v * (1 - Math.max(0, pan));
      R[i0 + i] += v * (1 + Math.min(0, pan));
    }
  };
  for (const d of timeline.demos) {
    d.chars.forEach((c) => {
      const amp = 0.11 * (0.75 + rnd() * 0.4);
      const pan = (rnd() - 0.5) * 0.3;
      let last = 0;
      if (c.ch === " ") add(c.at, 0.05, (t) => (Math.sin(2 * Math.PI * 170 * t) * 0.6 + (rnd() - 0.5) * 0.5) * amp * Math.exp(-t * 90), pan);
      else
        add(c.at, 0.025, (t) => {
          const w = rnd() - 0.5;
          const hp = w - last;
          last = w;
          return hp * amp * Math.exp(-t * 260);
        }, pan);
    });
    add(d.send, 0.12, (t) => Math.sin(2 * Math.PI * (520 + 2600 * t) * t) * 0.12 * Math.exp(-t * 32));
    for (const [f, delay] of [[1318.5, 0], [1975.5, 0.07]]) {
      add(d.result + delay, 0.6, (t) => Math.sin(2 * Math.PI * f * t) * 0.05 * Math.exp(-t * 7) * Math.min(1, t * 400));
    }
  }
  let lp = 0;
  add(timeline.endStart - 0.1, 0.9, (t) => {
    lp += ((rnd() - 0.5) - lp) * 0.04;
    return lp * 0.9 * Math.sin(Math.PI * Math.min(1, t / 0.9));
  });
  // 16-bit stereo WAV.
  const data = Buffer.alloc(n * 4);
  for (let i = 0; i < n; i++) {
    data.writeInt16LE(Math.max(-1, Math.min(1, L[i])) * 32767, i * 4);
    data.writeInt16LE(Math.max(-1, Math.min(1, R[i])) * 32767, i * 4 + 2);
  }
  const head = Buffer.alloc(44);
  head.write("RIFF", 0);
  head.writeUInt32LE(36 + data.length, 4);
  head.write("WAVEfmt ", 8);
  head.writeUInt32LE(16, 16);
  head.writeUInt16LE(1, 20);
  head.writeUInt16LE(2, 22);
  head.writeUInt32LE(rate, 24);
  head.writeUInt32LE(rate * 4, 28);
  head.writeUInt16LE(4, 32);
  head.writeUInt16LE(16, 34);
  head.write("data", 36);
  head.writeUInt32LE(data.length, 40);
  fs.writeFileSync(file, Buffer.concat([head, data]));
}

function build() {
  fs.rmSync(PROJECT, { recursive: true, force: true });
  fs.mkdirSync(path.join(PROJECT, "assets"), { recursive: true });
  fs.mkdirSync(path.join(PROJECT, "vendor"), { recursive: true });

  const demos = config.demos.map((d, i) => ({ ...d, ...excerpt(d.from, d.seconds, `demo-${i}`, 1080, true) }));
  const carousel = config.carousel.map((c, i) => excerpt(c.from, c.seconds, `end-${i}`, 540, false));
  // The clip "attached" to every message: a frame of the speaker's untouched shot.
  run("ffmpeg", ["-v", "error", "-y", "-ss", String(config.thumbAt), "-i", VIDEO, "-frames:v", "1", "-vf", "scale=216:-2", "-q:v", "3", path.join(PROJECT, "assets", "thumb.jpg")]);
  const timeline = buildTimeline(demos, { endHold: config.endHold ?? 2.4 });
  // The end tiles loop their clip if the card outlasts it.
  writeSfx(path.join(PROJECT, "assets", "sfx.wav"), timeline);

  // The screen fills the frame width; the phone runs off the top and bottom, as in the reference.
  const scale = 2.6;
  const bezel = 22;
  const w = Math.round(390 * scale + bezel * 2);
  const h = Math.round(844 * scale + bezel * 2);
  const data = {
    cta: o.cta ?? config.cta,
    ctaSub: o["cta-sub"] ?? config.ctaSub,
    skill: config.skill,
    skillDesc: config.skillDesc,
    welcome: config.welcome,
    scale,
    phone: { x: Math.round((1080 - w) / 2), y: -126, w, h, bezel, screenRadius: 162 },
    // camera: typing frames the header to the keyboard; waiting drops the header; a result centres the card
    camera: { waitY: -60, resultY: -89, resultScale: 1.06 },
    demos: demos.map(({ command, title, line, clip, seconds }) => ({ command, title, line, clip, seconds })),
    carousel,
    timeline,
  };

  fs.copyFileSync(path.join(PACK, "node_modules", "gsap", "dist", "gsap.min.js"), path.join(PROJECT, "vendor", "gsap.min.js"));
  fs.copyFileSync(path.join(PACK, "shared", "claude-kit.js"), path.join(PROJECT, "vendor", "claude-kit.js"));
  fs.cpSync(path.join(PACK, "shared", "fonts"), path.join(PROJECT, "fonts"), {
    recursive: true,
    filter: (p) => !p.endsWith("licenses") && !p.endsWith(".css") && !p.endsWith(".txt"),
  });
  const D = timeline.duration;
  const vids = [
    ...demos.map((d, i) => `<video id="demo-video-${i}" class="clip" src="${d.clip}" muted playsinline data-start="${timeline.demos[i].result}" data-duration="${d.seconds}" data-track-index="${2 + i}"></video>`),
    ...carousel.map((c, i) => `<video id="end-video-${i}" class="clip" src="${c.clip}" muted playsinline data-start="${timeline.endStart}" data-duration="${(D - timeline.endStart).toFixed(3)}" data-track-index="${10 + i}"></video>`),
  ].join("\n");
  const voices = demos
    .map((d, i) => `<audio id="demo-voice-${i}" src="${d.voice}" data-start="${timeline.demos[i].result}" data-duration="${d.seconds}" data-track-index="${21 + i}" data-volume="1"></audio>`)
    .join("\n");
  const variables = [
    { id: "cta", type: "string", label: "End card call to action", default: data.cta },
    { id: "ctaSub", type: "string", label: "Line under the call to action", default: data.ctaSub },
  ];
  const attr = (s) => s.replace(/&/g, "&amp;").replace(/'/g, "&#39;");
  const html = `<!doctype html>
<html lang="en" data-composition-variables='${attr(JSON.stringify(variables))}'>
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=1080, height=1920" />
<title>Effects promo</title>
<script type="application/json" id="promo-data">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>
<script src="vendor/gsap.min.js"></script>
<style>
${fs.readFileSync(path.join(PACK, "shared", "fonts", "fonts.css"), "utf8")}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1080px;height:1920px;overflow:hidden;background:#000}
${fs.readFileSync(path.join(HERE, "promo.css"), "utf8")}
</style>
</head>
<body>
<div id="root" data-composition-id="promo" data-start="0" data-duration="${D}" data-fps="30" data-width="1080" data-height="1920">
<div id="bg"></div>
<div id="glow"></div>
<div id="stage"><div id="phone"><div id="screen-wrap"><div id="screen"></div></div></div></div>
<div id="end"></div>
<div id="media" style="display:none">
${vids}
</div>
${o.silent ? "" : `<audio id="promo-sfx" src="assets/sfx.wav" data-start="0" data-duration="${D}" data-track-index="20" data-volume="0.8"></audio>
${voices}`}
</div>
<script>window.CA = {};</script>
<script src="vendor/claude-kit.js"></script>
<script>
${fs.readFileSync(path.join(HERE, "promo.js"), "utf8")}
</script>
</body>
</html>
`;
  fs.writeFileSync(path.join(PROJECT, "index.html"), html);
  fs.writeFileSync(path.join(PROJECT, "hyperframes.json"), JSON.stringify({ $schema: "https://hyperframes.heygen.com/schema/hyperframes.json", media: { autoProxy: true } }, null, 2));
  fs.writeFileSync(path.join(PROJECT, "package.json"), JSON.stringify({ name: "vfx-promo", private: true, type: "module" }, null, 2));
  fs.writeFileSync(path.join(OUT, "timeline.json"), JSON.stringify(timeline, null, 2));
  return { timeline, demos };
}

const { timeline } = build();
console.log(`Built ${timeline.duration.toFixed(2)}s: ${PROJECT}`);
if (!o["no-render"]) {
  const stem = `vfx-promo${o.silent ? "-silent" : ""}${o.draft ? "-draft" : ""}`;
  const file = path.join(OUT, `${stem}.mp4`);
  renderProject(PROJECT, file, { fps: 30, quality: o.draft ? "draft" : "looks" });
  const times = [];
  for (const d of timeline.demos) {
    times.push(d.chars[Math.floor(d.chars.length * 0.25)].at, d.chars[d.chars.length - 1].at + 0.05, d.status + 0.3, d.result + 0.6);
  }
  times.push(timeline.endStart + 0.9, timeline.duration - 0.2);
  const sheet = path.join(OUT, `${stem}-sheet.jpg`);
  contactSheet(file, sheet, times.map((t) => Number(t.toFixed(2))));
  console.log(file);
  console.log(sheet);
}
