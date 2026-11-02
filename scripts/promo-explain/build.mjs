#!/usr/bin/env node
// Builds and renders the /explain promo: a phone running /explain three times, then an end card.
//   node scripts/promo-explain/build.mjs [--cta "Comment EXPLAIN"] [--cta-sub "..."] [--draft] [--no-render]
// It needs the three explainers rendered first with the preview build (silent, no voice):
//   animate explain render renders/wip/explain/<name> --preview
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
  options: { cta: { type: "string" }, "cta-sub": { type: "string" }, draft: { type: "boolean" }, "no-render": { type: "boolean" } },
});
const config = JSON.parse(fs.readFileSync(path.join(HERE, "promo.json"), "utf8"));
const OUT = path.join(PACK, "renders", "wip", "promo");
const PROJECT = path.join(OUT, ".work", "project");

function run(cmd, args) {
  const res = spawnSync(cmd, args, { encoding: "utf8", maxBuffer: 1 << 26 });
  if (res.status !== 0) throw new Error(`${cmd} failed:\n${(res.stderr || "").slice(-1200)}`);
  return res.stdout;
}

const plain = (s) => String(s).replace(/[[\]]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

// An excerpt starts on the frame its caption phrase appears, so every clip opens on a caption change.
function excerpt(folder, startPhrase, seconds, name, size) {
  const dir = path.resolve(PACK, folder);
  const timing = JSON.parse(fs.readFileSync(path.join(dir, "timing.json"), "utf8"));
  if (!timing.preview) throw new Error(`${folder} wasn't built with --preview. Run: animate explain render ${folder} --preview`);
  const video = path.join(dir, `${path.basename(dir)}-preview.mp4`);
  if (!fs.existsSync(video)) throw new Error(`Render it first: animate explain render ${folder} --preview`);
  const phrase = timing.phrases.find((p) => plain(p.text).startsWith(plain(startPhrase)));
  if (!phrase) throw new Error(`"${startPhrase}" isn't a caption phrase in ${folder}/timing.json`);
  let start = Math.max(0, phrase.start - 0.04);
  // A phrase that opens a scene sits on the explainer's cut, whose zoom-blur would open the clip
  // grey. Start just after the cut instead; the new caption is still up.
  const cut = timing.scenes.find((s) => s.start > start - 0.15 && s.start < start + 0.3);
  if (cut && cut.start > 0) start = cut.start + 0.27;
  if (start + seconds > timing.duration) throw new Error(`${folder}: ${seconds}s from "${startPhrase}" runs past the end`);
  const file = path.join(PROJECT, "assets", `${name}.mp4`);
  run("ffmpeg", [
    "-v", "error", "-y", "-ss", start.toFixed(3), "-i", video, "-t", seconds.toFixed(3),
    "-vf", `scale=${size}:-2:flags=lanczos,fps=30`, "-an", "-c:v", "libx264", "-crf", "14", "-preset", "slow", "-pix_fmt", "yuv420p", file,
  ]);
  return { clip: `assets/${name}.mp4`, slug: `explain/${path.basename(dir)}`, from: start };
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

  const demos = config.demos.map((d, i) => ({ ...d, ...excerpt(d.folder, d.startPhrase, d.seconds, `demo-${i}`, 1080) }));
  const carousel = config.carousel.map((c, i) => excerpt(c.folder, c.startPhrase, c.seconds, `end-${i}`, 540));
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
    scale,
    phone: { x: Math.round((1080 - w) / 2), y: -126, w, h, bezel, screenRadius: 162 },
    // camera: typing frames the header to the keyboard; waiting drops the header; a result centres the card
    camera: { waitY: -60, resultY: -89, resultScale: 1.06 },
    demos: demos.map(({ command, title, line, clip, slug, seconds }) => ({ command, title, line, clip, slug, seconds })),
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
    ...carousel.map((c, i) => `<video id="end-video-${i}" class="clip" src="${c.clip}" muted playsinline data-start="${timeline.endStart}" data-duration="${(D - timeline.endStart).toFixed(3)}" data-track-index="${6 + i}"></video>`),
  ].join("\n");
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
<title>/explain promo</title>
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
<audio id="promo-sfx" src="assets/sfx.wav" data-start="0" data-duration="${D}" data-track-index="20" data-volume="0.8"></audio>
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
  fs.writeFileSync(path.join(PROJECT, "package.json"), JSON.stringify({ name: "explain-promo", private: true, type: "module" }, null, 2));
  fs.writeFileSync(path.join(OUT, "timeline.json"), JSON.stringify(timeline, null, 2));
  return { timeline, demos };
}

const { timeline } = build();
console.log(`Built ${timeline.duration.toFixed(2)}s: ${PROJECT}`);
if (!o["no-render"]) {
  const file = path.join(OUT, `explain-promo${o.draft ? "-draft" : ""}.mp4`);
  renderProject(PROJECT, file, { fps: 30, quality: o.draft ? "draft" : "looks" });
  const times = [];
  for (const d of timeline.demos) {
    times.push(d.chars[Math.floor(d.chars.length * 0.25)].at, d.chars[d.chars.length - 1].at + 0.05, d.status + 0.3, d.result + 0.6);
  }
  times.push(timeline.endStart + 0.9, timeline.duration - 0.2);
  const sheet = path.join(OUT, `explain-promo${o.draft ? "-draft" : ""}-sheet.jpg`);
  contactSheet(file, sheet, times.map((t) => Number(t.toFixed(2))));
  console.log(file);
  console.log(sheet);
}
