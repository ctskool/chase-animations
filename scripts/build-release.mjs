#!/usr/bin/env node
// Builds the zip members download. It packs tracked files only, then refuses to finish if anything looks private.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
const NAME = `chase-animations-v${pkg.version}`;

// Paths inside the repo that are for building the pack, not using it.
const LEAVE_OUT = [
  /^scripts\//,
  /^\.github\//,
  /^\.gitignore$/,
  /^\.gitattributes$/,
  /^CLAUDE\.md$/,
  /^docs\/internal\//,
  /^docs\/PACK-README\.md$/,
  /^gallery\//,
  /^media\//,
];
// The repo's README shows off the banner and cards, which the zip leaves out, so the zip gets a plain one.
const ZIP_COPY = { "README.md": "docs/PACK-README.md" };
const sourceOf = (file) => path.join(ROOT, ZIP_COPY[file] ?? file);
const BANNED_FILES = /\.(mp4|mov|webm|mkv|m4a|wav|mp3|pcm|env|pem|key)$/i;
const TEXT = /\.(md|json|js|mjs|css|html|txt|yml|yaml)$/i;

const PRIVATE = [
  [/[A-Za-z]:[\\/]+Users[\\/]/, "an absolute Windows path"],
  [/\/(Users|home)\/[a-z]/, "an absolute home path"],
  [/\bgh[opusr]_[A-Za-z0-9]{20,}/, "a GitHub token"],
  [/\bsk-[A-Za-z0-9_-]{20,}/, "an API key"],
  [/\bAKIA[0-9A-Z]{16}\b/, "an AWS key"],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, "a private key"],
  [/\b(api[_-]?key|secret|password|token)["']?\s*[:=]\s*["'][^"'\s]{12,}/i, "a secret"],
  [/hanneganc@|@gmail\.com/i, "a personal email"],
];

// Third-party files keep their own text, so private-info rules don't apply to the licence files.
const trusted = (file) => file.startsWith("shared/fonts/licenses/") || file === "shared/vendor/motion-blur.js" || /^blocks\/[^/]+\/assets\//.test(file);

function scan(files) {
  const problems = [];
  for (const file of files) {
    if (BANNED_FILES.test(file)) problems.push(`${file}: media or secret file`);
    if (!TEXT.test(file) || trusted(file)) continue;
    const text = fs.readFileSync(sourceOf(file), "utf8");
    for (const [pattern, what] of PRIVATE) {
      if (pattern.test(text)) problems.push(`${file}: contains ${what}`);
    }
  }
  return problems;
}

// Just enough of the zip format to need no extra dependency and to work the same on any computer.
function writeZip(out, prefix, files) {
  const chunks = [];
  const central = [];
  let offset = 0;
  const stamp = { time: 0, date: (46 << 9) | (1 << 5) | 1 }; // fixed date, so the same files make the same zip
  for (const file of files) {
    const data = fs.readFileSync(sourceOf(file));
    const packed = zlib.deflateRawSync(data, { level: 9 });
    const name = Buffer.from(`${prefix}/${file}`);
    const crc = zlib.crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(8, 8);
    local.writeUInt16LE(stamp.time, 10);
    local.writeUInt16LE(stamp.date, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(packed.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    chunks.push(local, name, packed);
    const head = Buffer.alloc(46);
    head.writeUInt32LE(0x02014b50, 0);
    head.writeUInt16LE(20, 4);
    head.writeUInt16LE(20, 6);
    head.writeUInt16LE(0x0800, 8);
    head.writeUInt16LE(8, 10);
    head.writeUInt16LE(stamp.time, 12);
    head.writeUInt16LE(stamp.date, 14);
    head.writeUInt32LE(crc, 16);
    head.writeUInt32LE(packed.length, 20);
    head.writeUInt32LE(data.length, 24);
    head.writeUInt16LE(name.length, 28);
    head.writeUInt32LE(offset, 42);
    central.push(head, name);
    offset += local.length + name.length + packed.length;
  }
  const dir = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(dir.length, 12);
  end.writeUInt32LE(offset, 16);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, Buffer.concat([...chunks, dir, end]));
}

const dirty = execFileSync("git", ["status", "--porcelain"], { cwd: ROOT, encoding: "utf8" }).trim();
if (dirty) console.warn("Note: uncommitted changes. The zip packs the files on disk, so commit before you ship it.\n");

const tracked = execFileSync("git", ["ls-files"], { cwd: ROOT, encoding: "utf8" }).split("\n").filter(Boolean);
const files = tracked.filter((f) => !LEAVE_OUT.some((p) => p.test(f)));

const problems = scan(files);
if (problems.length) {
  console.error("Release stopped. Nothing was written:\n" + problems.map((p) => `  ${p}`).join("\n"));
  process.exit(1);
}

const out = path.join(ROOT, "dist", `${NAME}.zip`);
writeZip(out, NAME, files);
console.log(`${out}`);
console.log(`${files.length} files, ${(fs.statSync(out).size / 1024).toFixed(0)} KB. Checked for media, secrets, personal details and machine paths.`);
