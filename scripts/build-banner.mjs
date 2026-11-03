#!/usr/bin/env node
// Makes the README's banner, a tilted wall of real clips from the pack, and the demo of the three outputs.
// It needs the finished renders in renders/final.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { PACK, hyperframes, renderProject } from "../shared/build.mjs";

const OUT = path.join(PACK, "media");
const WORK = path.join(PACK, "renders", ".banner");
const SECONDS = 6;
const COLUMNS = 6;

// Left to right, then row by row. The strongest looks sit nearest the title.
const WALL = [
  "globe-arcs", "iceberg", "terminal-run", "notification-stack", "blue-editorial", "isometric-flow",
  "money-stat", "route-real-london", "cutaway", "campaign-map", "laptop-reveal", "swiss-grid",
  "head-to-head", "ranking-bars", "scale-reveal", "risograph", "retro-crt", "frosted-glass",
];

const { groups } = JSON.parse(fs.readFileSync(path.join(PACK, "gallery", "catalog.json"), "utf8"));
const items = new Map(groups.flatMap((group) => group.items).map((item) => [item.slug, item]));

const ffmpeg = (...args) => execFileSync("ffmpeg", ["-y", "-v", "error", ...args], { stdio: "inherit" });
const seconds = (file) =>
  Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file], { encoding: "utf8" }));

function clip(slug, index) {
  const item = items.get(slug);
  const source = path.join(PACK, item.source ?? `renders/final/${slug}-full.mp4`);
  const length = seconds(source);
  const key = JSON.parse(fs.readFileSync(path.join(PACK, "blocks", item.block ?? slug, "block.json"), "utf8")).timing.keyAt;
  // Every clip's payoff is timed so they ripple across the wall after the command is typed.
  const column = index % COLUMNS;
  const row = Math.floor(index / COLUMNS);
  const payoff = 2.5 + column * 0.42 + row * 0.3;
  const start = ((key - payoff) % length + length) % length;
  ffmpeg("-stream_loop", "3", "-i", source, "-ss", String(start), "-t", String(SECONDS), "-vf", "fps=24,scale=408:-2",
    "-c:v", "libx264", "-crf", "20", "-preset", "fast", "-pix_fmt", "yuv420p", "-an", path.join(WORK, "clips", `${slug}.mp4`));
}

function banner() {
  fs.rmSync(WORK, { recursive: true, force: true });
  for (const folder of ["clips", "vendor", "fonts"]) fs.mkdirSync(path.join(WORK, folder), { recursive: true });
  WALL.forEach(clip);

  fs.copyFileSync(path.join(PACK, "node_modules", "gsap", "dist", "gsap.min.js"), path.join(WORK, "vendor", "gsap.min.js"));
  const fonts = [
    ["blocks/risograph/assets/fonts/bricolage-grotesque-800.woff2", "bricolage-grotesque-800.woff2"],
    ["shared/fonts/inter-500.woff2", "inter-500.woff2"],
    [fontFile("ibm-plex-mono-500"), "ibm-plex-mono-500.woff2"],
  ];
  for (const [from, to] of fonts) fs.copyFileSync(path.join(PACK, from), path.join(WORK, "fonts", to));

  const phones = WALL.map((slug, i) =>
    `<div class="phone"><video id="v${i}" class="clip" data-start="0" data-duration="${SECONDS}" data-track-index="${i + 1}" src="clips/${slug}.mp4" muted playsinline></video></div>`,
  ).join("");
  const page = fs.readFileSync(path.join(PACK, "scripts", "banner-template.html"), "utf8")
    .replace("/*PHONES*/", phones)
    .replaceAll("/*SECONDS*/", String(SECONDS));
  fs.writeFileSync(path.join(WORK, "index.html"), page);
  fs.writeFileSync(path.join(WORK, "hyperframes.json"), JSON.stringify({ media: { autoProxy: true } }));
  fs.writeFileSync(path.join(WORK, "package.json"), JSON.stringify({ name: "banner", private: true, type: "module" }));

  const check = hyperframes(["lint", "."], { cwd: WORK, capture: true });
  if (check.status !== 0) throw new Error(check.stdout || check.stderr);
  const film = path.join(WORK, "banner.mp4");
  renderProject(WORK, film, { fps: 24 });
  ffmpeg("-i", film, "-vf", "fps=20,scale=1400:-2:flags=lanczos", "-c:v", "libwebp_anim", "-quality", "74",
    "-compression_level", "6", "-loop", "0", "-an", path.join(OUT, "banner.webp"));
}

function fontFile(stem) {
  const found = fs.readdirSync(path.join(PACK, "blocks"), { recursive: true }).map(String).find((file) => file.endsWith(`${stem}.woff2`));
  if (!found) throw new Error(`No font called ${stem}`);
  return path.join("blocks", found);
}

// The same trip as all three outputs, shown in a phone frame so the difference reads at a glance.
function outputs() {
  const source = path.join(PACK, "renders", "final", "real-routes");
  const encode = ["fps=14,scale=300:-2:flags=lanczos"];
  const webp = ["-c:v", "libwebp_anim", "-quality", "60", "-compression_level", "6", "-loop", "0", "-an"];
  const window = ["-ss", "1.4", "-t", "3.2"];
  ffmpeg(...window, "-i", path.join(source, "route-map-london-full.mp4"), "-vf", encode[0], ...webp, path.join(OUT, "output-full.webp"));
  ffmpeg(...window, "-i", path.join(source, "route-map-london-top.mp4"), "-vf",
    `pad=1080:1920:0:0:color=0x24272d,${encode[0]}`, ...webp, path.join(OUT, "output-top.webp"));
  ffmpeg("-f", "lavfi", "-i", "color=c=0x24272d:s=1080x1920:r=30", ...window, "-i", path.join(source, "route-map-london-overlay.mov"),
    "-filter_complex", `[0][1]overlay=shortest=1,${encode[0]}`, ...webp, path.join(OUT, "output-overlay.webp"));
}

// The first demo from the /explain promo: typing the command through to the explainer playing.
function explainDemo() {
  ffmpeg("-ss", "0.3", "-t", "6.4", "-i", path.join(PACK, "renders", "final", "explain", "explain-promo.mp4"),
    "-vf", "fps=14,scale=360:-2:flags=lanczos", "-c:v", "libwebp_anim", "-quality", "66", "-compression_level", "6",
    "-loop", "0", "-an", path.join(OUT, "explain-demo.webp"));
}

function vfxDemo() {
  ffmpeg("-ss", "0.3", "-t", "10.2", "-i", path.join(PACK, "renders", "final", "vfx", "vfx-promo.mp4"),
    "-vf", "fps=12,scale=360:-2:flags=lanczos", "-c:v", "libwebp_anim", "-quality", "64", "-compression_level", "6",
    "-loop", "0", "-an", path.join(OUT, "vfx-demo.webp"));
}

fs.mkdirSync(OUT, { recursive: true });
outputs();
explainDemo();
vfxDemo();
banner();
for (const name of ["banner.webp", "output-full.webp", "output-top.webp", "output-overlay.webp", "explain-demo.webp", "vfx-demo.webp"]) {
  console.log(`${name} ${(fs.statSync(path.join(OUT, name)).size / 1048576).toFixed(2)} MB`);
}
