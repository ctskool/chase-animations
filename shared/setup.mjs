#!/usr/bin/env node
// Installs the pack's slash commands and checks what it needs. Safe to run again after an update.
//   npm run setup                 skills and the render browser
//   npm run setup -- --speech     also downloads the speech model used for word sync (about 640 MB)
//   npm run setup -- --skills-dir <folder>   install the skills somewhere other than ~/.claude/skills
//   npm run setup -- --vfx        the cut-out model /vfx needs, picked for this computer (see setupVfx)
//   npm run setup -- --vfx --check            say what this computer has and would use, install nothing
//   npm run setup -- --vfx --engine hyperframes|rvm [--python <exe> --rvm-dir <folder> --weights <file>]   choose, or reuse an RVM install
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { parseArgs } from "node:util";
import { PACK, hyperframes } from "./build.mjs";

const { values: o } = parseArgs({
  options: {
    speech: { type: "boolean" },
    "skills-dir": { type: "string" },
    vfx: { type: "boolean" },
    check: { type: "boolean" },
    engine: { type: "string" },
    python: { type: "string" },
    "rvm-dir": { type: "string" },
    weights: { type: "string" },
  },
});

function fail(message) {
  console.error(`\n${message}`);
  process.exit(1);
}

const major = Number(process.versions.node.split(".")[0]);
if (major < 22) fail(`Node 22 or newer is needed. You have ${process.versions.node}. Get it from https://nodejs.org`);
if (!fs.existsSync(path.join(PACK, "node_modules", "hyperframes"))) fail("Run npm install first.");
for (const tool of ["ffmpeg", "ffprobe"]) {
  if (spawnSync(tool, ["-version"], { stdio: "ignore" }).error) {
    fail(`${tool} isn't installed. See docs/INSTALL.md.`);
  }
}
// Homebrew's plain ffmpeg has no drawtext, which every contact sheet uses; ffmpeg-full has it.
const filters = spawnSync("ffmpeg", ["-hide_banner", "-filters"], { encoding: "utf8" }).stdout ?? "";
if (!/\bdrawtext\b/.test(filters)) {
  fail("Your FFmpeg has no drawtext filter, which the contact sheets need. On a Mac: brew install ffmpeg-full, then brew unlink ffmpeg and brew link --force ffmpeg-full. See docs/INSTALL.md.");
}
console.log("Node, FFmpeg: ok");

const target = path.resolve(o["skills-dir"] ?? path.join(os.homedir(), ".claude", "skills"));
const packPath = PACK.replace(/\\/g, "/");
const skills = fs.readdirSync(path.join(PACK, "skills"));
for (const name of skills) {
  const body = fs.readFileSync(path.join(PACK, "skills", name, "SKILL.md"), "utf8");
  fs.mkdirSync(path.join(target, name), { recursive: true });
  fs.writeFileSync(path.join(target, name, "SKILL.md"), body.replaceAll("{{PACK}}", packPath));
}
console.log(`Skills installed in ${target}: ${skills.map((s) => `/${s}`).join(", ")}`);

console.log("Checking the render browser (first run downloads it)");
if (hyperframes(["browser", "ensure"]).status !== 0) fail("Couldn't set up the render browser. See docs/INSTALL.md.");

if (o.speech) {
  console.log("Downloading the speech model for word sync (about 640 MB)");
  if (hyperframes(["models", "install", "parakeet"]).status !== 0) fail("The speech model didn't install. See docs/INSTALL.md.");
}

if (o.vfx) setupVfx();

console.log(`\nReady. In Claude Code type /animate${o.speech ? "" : "\nFor word sync, also run: npm run setup -- --speech"}`);

// /vfx cuts the speaker out of each effect's few seconds. An NVIDIA card gets Robust Video Matting (best edges, no
// flicker, fast); RVM is GPL-3.0, so setup downloads it from its own GitHub onto this machine instead of the pack
// shipping it. Everything else (Macs, other Windows PCs) gets HyperFrames' own remover: Apache-2.0, already part of
// the pack, CoreML on a Mac.
function setupVfx() {
  const smi = spawnSync("nvidia-smi", ["-L"], { encoding: "utf8" });
  const nvidia = !smi.error && smi.status === 0;
  const engine = o.engine ?? (nvidia ? "rvm" : "hyperframes");
  if (!["rvm", "hyperframes"].includes(engine)) fail(`--engine must be rvm or hyperframes, got "${engine}"`);
  const system = { darwin: "Mac", win32: "Windows" }[process.platform] ?? "Linux";
  console.log(`This computer: ${system}, ${nvidia ? "NVIDIA card found" : "no NVIDIA card"}. Cut-out: ${engine === "rvm" ? "RVM" : "HyperFrames remover"}.`);
  const dir = path.join(PACK, ".vfx");
  if (o.check) {
    const file = path.join(dir, "engine.json");
    console.log(fs.existsSync(file) ? `Installed: ${fs.readFileSync(file, "utf8").trim()}` : "Nothing installed yet.");
    return;
  }
  if (engine === "rvm" && !nvidia) fail("RVM needs an NVIDIA card. Use: npm run setup -- --vfx --engine hyperframes");
  fs.mkdirSync(dir, { recursive: true });
  const record = engine === "rvm" ? installRvm(dir) : installRemover(dir);
  fs.writeFileSync(path.join(dir, "engine.json"), JSON.stringify(record, null, 2));
  console.log(`/vfx cut-out ready: ${engine}`);
}

function sh(cmd, args, what) {
  console.log(what);
  const res = spawnSync(cmd, args, { stdio: "inherit" });
  if (res.error || res.status !== 0) fail(`${what} failed. See docs/INSTALL.md (Effects).`);
}

function installRemover(dir) {
  // The model downloads on first use (about 170 MB); a tiny test clip does that now, not mid-edit.
  const probe = path.join(dir, "probe.mp4");
  sh("ffmpeg", ["-v", "error", "-y", "-f", "lavfi", "-i", "testsrc2=s=320x568:d=0.2:r=10", "-pix_fmt", "yuv420p", probe], "Making a test clip");
  console.log("Downloading the cut-out model (about 170 MB, first time only)");
  if (hyperframes(["remove-background", probe, "-o", path.join(dir, "probe.mov")]).status !== 0) fail("The cut-out model didn't install. See docs/INSTALL.md (Effects).");
  for (const f of ["probe.mp4", "probe.mov"]) fs.rmSync(path.join(dir, f), { force: true });
  return { engine: "hyperframes" };
}

function installRvm(dir) {
  // Reusing an RVM install that already works on this machine.
  if (o.python && o["rvm-dir"]) {
    const weights = path.resolve(o.weights ?? path.join(o["rvm-dir"], "rvm_resnet50.pth"));
    if (!fs.existsSync(weights)) fail(`Can't find RVM's weights at ${weights}. Pass --weights <rvm_resnet50.pth>`);
    return { engine: "rvm", python: path.resolve(o.python), rvm: path.resolve(o["rvm-dir"]), weights };
  }
  const py = ["python3", "python", "py"].find((p) => spawnSync(p, ["--version"]).status === 0);
  if (!py) fail("RVM needs Python 3.10 or newer from https://www.python.org");
  const venv = path.join(dir, "rvm-venv");
  const bin = path.join(venv, process.platform === "win32" ? "Scripts/python.exe" : "bin/python");
  if (!fs.existsSync(bin)) sh(py, ["-m", "venv", venv], "Making a private Python for RVM");
  sh(bin, ["-m", "pip", "install", "--quiet", "torch", "torchvision", "--index-url", "https://download.pytorch.org/whl/cu128"], "Installing PyTorch for NVIDIA (about 2.5 GB)");
  sh(bin, ["-m", "pip", "install", "--quiet", "numpy"], "Installing numpy");
  const src = path.join(dir, "RobustVideoMatting-master");
  if (!fs.existsSync(src)) {
    const zip = path.join(dir, "rvm.zip");
    sh("curl", ["-L", "-o", zip, "https://github.com/PeterL1n/RobustVideoMatting/archive/refs/heads/master.zip"], "Downloading RVM from its GitHub (GPL-3.0)");
    sh("tar", ["-xf", zip, "-C", dir], "Unpacking RVM");
    fs.rmSync(zip, { force: true });
  }
  const weights = path.join(src, "rvm_resnet50.pth");
  if (!fs.existsSync(weights)) {
    sh("curl", ["-L", "-o", weights, "https://github.com/PeterL1n/RobustVideoMatting/releases/download/v1.0.0/rvm_resnet50.pth"], "Downloading RVM's weights");
  }
  if (spawnSync(bin, ["-c", "import torch; assert torch.cuda.is_available()"]).status !== 0) {
    fail("PyTorch can't see the NVIDIA card. Update the NVIDIA driver, or use: npm run setup -- --vfx --engine hyperframes");
  }
  return { engine: "rvm", python: bin, rvm: src, weights };
}
