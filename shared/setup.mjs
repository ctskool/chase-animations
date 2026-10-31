#!/usr/bin/env node
// Installs the pack's slash commands and checks what it needs. Safe to run again after an update.
//   npm run setup                 skills and the render browser
//   npm run setup -- --speech     also downloads the speech model used for word sync (about 640 MB)
//   npm run setup -- --skills-dir <folder>   install the skills somewhere other than ~/.claude/skills
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { parseArgs } from "node:util";
import { PACK, hyperframes } from "./build.mjs";

const { values: o } = parseArgs({ options: { speech: { type: "boolean" }, "skills-dir": { type: "string" } } });

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

console.log(`\nReady. In Claude Code type /animate${o.speech ? "" : "\nFor word sync, also run: npm run setup -- --speech"}`);
