#!/usr/bin/env node
// Rebuilds everything that shows the animations off: the gallery page, its clips, and the moving cards in the README.
// It reads gallery/catalog.json and the finished renders in renders/final, so run it after adding or changing a block.
//   node scripts/build-gallery.mjs          everything
//   node scripts/build-gallery.mjs --page   only the page and the README, when just the wording changed
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GALLERY = path.join(ROOT, "gallery");
const CARDS = path.join(ROOT, "media", "cards");
const PER_ROW = 4;
const pageOnly = process.argv.includes("--page");

const { groups } = JSON.parse(fs.readFileSync(path.join(GALLERY, "catalog.json"), "utf8"));
const items = groups.flatMap((group) => group.items);

const ffmpeg = (...args) => execFileSync("ffmpeg", ["-y", "-v", "error", ...args], { stdio: "inherit" });
const seconds = (file) =>
  Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file], { encoding: "utf8" }));
const sourceOf = (item) => path.join(ROOT, item.source ?? `renders/final/${item.slug}-full.mp4`);
const blockOf = (item) => item.block ?? item.slug;

function makeMedia(item) {
  const source = sourceOf(item);
  if (!fs.existsSync(source)) throw new Error(`No render for ${item.slug}: ${source}`);
  const length = seconds(source);
  // An explainer has no single key moment, so its catalogue entry says where its card should centre.
  const key = item.cardAt ?? JSON.parse(fs.readFileSync(path.join(ROOT, "blocks", blockOf(item), "block.json"), "utf8")).timing.keyAt;

  ffmpeg("-i", source, "-vf", "scale=540:-2", "-c:v", "libx264", "-crf", "25", "-preset", "medium", "-pix_fmt", "yuv420p",
    "-movflags", "+faststart", "-an", path.join(GALLERY, "clips", `${item.slug}.mp4`));
  ffmpeg("-ss", String(length * 0.72), "-i", source, "-frames:v", "1", "-vf", "scale=360:-2", "-q:v", "3",
    path.join(GALLERY, "posters", `${item.slug}.jpg`));

  // A card shows the run-up and the payoff, because that's the part that sells the animation.
  const start = Math.max(0, key - 1.8);
  const span = Math.min(2.9, length - start);
  ffmpeg("-ss", String(start), "-t", String(span), "-i", source, "-vf", "fps=12,scale=270:-2:flags=lanczos",
    "-c:v", "libwebp_anim", "-quality", "72", "-compression_level", "6", "-loop", "0", "-an",
    path.join(CARDS, `${item.slug}.webp`));
}

function writePage() {
  const data = groups.map((group) => ({
    name: group.name,
    items: group.items.map(({ source, block, ...item }) => ({ ...item, secs: Math.round(seconds(sourceOf({ ...item, source })) * 10) / 10 })),
  }));
  const template = fs.readFileSync(path.join(ROOT, "scripts", "gallery-template.html"), "utf8");
  fs.writeFileSync(path.join(GALLERY, "index.html"), template.replace("/*DATA*/null", JSON.stringify(data)));
}

const escape = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function card(item) {
  const link = item.link ?? `blocks/${blockOf(item)}/README.md`;
  const label = item.example ? `<b>${escape(item.name)}</b>` : `<b><a href="${link}"><code>${item.slug}</code></a></b>`;
  return [
    `<td width="25%" align="center" valign="top">`,
    `<a href="${link}"><img src="media/cards/${item.slug}.webp" width="100%" alt="${escape(`${item.name}: ${item.does}`)}"></a>`,
    `<br>${label}<br><sub>${escape(item.does)}</sub>`,
    `</td>`,
  ].join("\n");
}

// Groups go between the README marker named by their `section`, "animations" unless they say otherwise.
function writeCards() {
  const file = path.join(ROOT, "README.md");
  let readme = fs.readFileSync(file, "utf8");
  for (const section of new Set(groups.map((group) => group.section ?? "animations"))) {
    const lines = [];
    for (const group of groups.filter((g) => (g.section ?? "animations") === section)) {
      if (section === "animations") lines.push(`### ${group.name}`, "");
      if (group.note && section === "animations") lines.push(group.note, "");
      lines.push("<table>");
      for (let i = 0; i < group.items.length; i += PER_ROW) {
        lines.push("<tr>", ...group.items.slice(i, i + PER_ROW).map(card), "</tr>");
      }
      lines.push("</table>", "");
    }
    const block = new RegExp(`(<!-- ${section}:start -->\\n)[\\s\\S]*?(<!-- ${section}:end -->)`);
    if (!block.test(readme)) throw new Error(`README.md has lost its ${section} markers`);
    readme = readme.replace(block, `$1\n${lines.join("\n")}\n$2`);
  }
  fs.writeFileSync(file, readme);
}

if (!pageOnly) {
  for (const folder of [path.join(GALLERY, "clips"), path.join(GALLERY, "posters"), CARDS]) {
    fs.rmSync(folder, { recursive: true, force: true });
    fs.mkdirSync(folder, { recursive: true });
  }
  items.forEach((item, i) => {
    console.log(`${String(i + 1).padStart(2)}/${items.length} ${item.slug}`);
    makeMedia(item);
  });
}
writePage();
if (fs.readFileSync(path.join(ROOT, "README.md"), "utf8").includes("<!-- animations:start -->")) writeCards();

const size = (folder) => fs.readdirSync(folder).reduce((sum, name) => sum + fs.statSync(path.join(folder, name)).size, 0) / 1048576;
console.log(`${items.length} animations. Clips ${size(path.join(GALLERY, "clips")).toFixed(1)} MB, cards ${size(CARDS).toFixed(1)} MB.`);
