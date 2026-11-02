#!/usr/bin/env node
// The one command behind the pack. Run with no arguments for help.
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import {
  PACK,
  UsageError,
  VARIANTS,
  buildProject,
  hyperframes,
  listBlocks,
  loadBlock,
  renderProject,
  resolveTiming,
  resolveVars,
} from "./build.mjs";
import { contactSheet, placeOnVideo, probe } from "./compose.mjs";
import { explain } from "./explain.mjs";
import { makeCampaign, makeRoute } from "./route.mjs";
import { findWord, fitToWord, loadWords, printMatches, refineStart } from "./sync.mjs";

const HELP = `Chase Animations

  animate list                         the animations in this pack
  animate vars <name>                  every editable variable, with defaults
  animate render <name> [options]      render one output, or --output all
  animate place <name> --video <file> --word "<word>" [options]
                                       land the key moment on a spoken word, in your video
  animate words <video> [--find word]  transcribe a video and list or find words
  animate route --from "<place>" --to "<place>"
                                       fetch a real route and map for route-map
  animate campaign --move "<place> > <place>"
                                       fetch real places and a map for campaign-map
  animate preview <name> [options]     open it in HyperFrames Studio
  animate check <name> [options]       run HyperFrames' checks on every output
  animate sheet <video> [--times a,b]  contact sheet for checking frames by eye
  animate explain new "<topic>"        start a narrated explainer: explain/<topic>/script.json
  animate explain check <folder>       check the script and write script.md, the words to record
  animate explain build <folder> --audio <file>
                                       time the scenes and captions to your recording
  animate explain render <folder>      render it, with a contact sheet

Options
  --output full|top|overlay|all        9:16 full frame, top half of a split-screen, or transparent overlay
  --vars <file.json>                   your text, numbers and colours
  --set name=value                     change one variable (repeat as needed)
  --out <folder>                       where finished files go (default: ./renders)
  --key-at <seconds>                   seconds from the first frame to the key moment
  --hold <seconds>                     how long it stays up after the key moment
  --fps <n>                            frame rate (default 30; place matches your video)
  --height <px>                        height of the top-half output (default 960)
  --alpha                              render full or top with a transparent exit, as .mov
  --draft                              faster, lower-quality render

place options
  --word "<word or phrase>"            the spoken word to land on
  --occurrence <n>                     which one, when the word is said more than once
  --at <seconds>                       use a time instead of a word
  --nudge <seconds>                    move the key moment earlier (-) or later (+)
  --speaker-y <0-1>                    top output only: keep this height of your video visible below the block
  --model <name>                       whisper model: tiny.en, base.en, small.en (default), medium.en, large-v3
  --language <code>                    language, e.g. es
  --transcript <file>                  use an existing transcript instead (.json, .srt, .vtt)

route options
  --from, --to "<place or lat,lon>"    where the trip starts and ends
  --via "<place>"                      a stop or road to pass through (repeat as needed)
  --mode drive|bike|walk               how the route is worked out (default drive)
  --track <file>                       your own route as GPX or GeoJSON, instead of --from and --to
  --minutes <n>                        the real trip time, instead of the estimate
  --units mi|km                        distance units (default: by country)
  --save <file>                        where the map goes (default: route-map.json)
  --vars <file>                        where the trip details go (default: animate-vars.json)

campaign options
  --move "<place> > <place>"           one arrow, or a chain with more ">". Repeat as needed, up to five arrows
                                       add (east) or (west) after a place to go that way round the world
  --stage "<text>"                     the date or stage of each move, in order (repeat as needed)
  --units mi|km                        distance units (default: by country)
  --save <file>                        where the map goes (default: campaign-map.json)
  --vars <file>                        where the move details go (default: animate-vars.json)

explain options
  --audio <file>                       your narration, any audio or video file (build remembers it)
  --out <folder>                       new: where the explainer folder goes (default: ./explain)
  --force                              build even when the recording doesn't match the script
  --preview                            build or render silent, timed to a reading pace, before you record
  --draft                              render: faster, lower quality
  animate explain preview <folder>     open it in HyperFrames Studio
`;

const OPTIONS = {
  output: { type: "string" },
  vars: { type: "string" },
  set: { type: "string", multiple: true },
  out: { type: "string" },
  "key-at": { type: "string" },
  hold: { type: "string" },
  fps: { type: "string" },
  height: { type: "string" },
  alpha: { type: "boolean" },
  draft: { type: "boolean" },
  format: { type: "string" },
  video: { type: "string" },
  word: { type: "string" },
  find: { type: "string" },
  occurrence: { type: "string" },
  at: { type: "string" },
  nudge: { type: "string" },
  "speaker-y": { type: "string" },
  model: { type: "string" },
  language: { type: "string" },
  transcript: { type: "string" },
  times: { type: "string" },
  from: { type: "string" },
  to: { type: "string" },
  via: { type: "string", multiple: true },
  mode: { type: "string" },
  track: { type: "string" },
  minutes: { type: "string" },
  units: { type: "string" },
  save: { type: "string" },
  move: { type: "string", multiple: true },
  stage: { type: "string", multiple: true },
  audio: { type: "string" },
  force: { type: "boolean" },
  preview: { type: "boolean" },
  help: { type: "boolean", short: "h" },
};

const num = (v) => (v === undefined ? undefined : Number(v));
const workDir = (out) => path.join(out, ".animate");
const outDir = (o) => path.resolve(o.out ?? "renders");

function outputs(o, fallback) {
  const pick = o.output ?? fallback;
  if (pick === "all") return Object.keys(VARIANTS);
  if (!VARIANTS[pick]) throw new UsageError(`--output must be full, top, overlay or all, got "${pick}"`);
  return [pick];
}

function list() {
  for (const name of listBlocks()) {
    const b = loadBlock(name);
    console.log(`${name.padEnd(18)} ${b.summary}`);
    console.log(`${"".padEnd(18)} Key moment: ${b.keyMoment}`);
  }
}

function vars(name) {
  const b = loadBlock(name);
  for (const v of b.variables) {
    const extra = v.options ? ` (${v.options.map((x) => x.value).join(" | ")})` : "";
    console.log(`${v.id.padEnd(20)} ${v.type.padEnd(7)} ${JSON.stringify(v.default)}${extra}  ${v.label}`);
  }
}

function render(name, o) {
  const block = loadBlock(name);
  const values = resolveVars(block, o.vars, o.set);
  const out = outDir(o);
  const fps = num(o.fps) ?? 30;
  const made = [];
  for (const variant of outputs(o, "full")) {
    const alpha = Boolean(o.alpha || VARIANTS[variant].alpha);
    const timing = resolveTiming(block, variant, { keyAt: num(o["key-at"]), hold: num(o.hold), alpha, fps });
    const dir = buildProject({ block, variant, vars: values, timing, workDir: workDir(out), fps, alpha, height: num(o.height) });
    const format = o.format ?? (alpha ? "mov" : "mp4");
    const file = path.join(out, `${name}-${variant}.${format}`);
    console.log(`Rendering ${name} ${variant} (${timing.duration.toFixed(2)}s, key moment at ${timing.key.toFixed(2)}s)`);
    renderProject(dir, file, { format, fps, quality: o.draft ? "draft" : "looks" });
    made.push(file);
    console.log(`  ${file}`);
  }
  return made;
}

function words(video, o) {
  const list = loadWords(video, { workDir: workDir(outDir(o)), model: o.model, language: o.language, transcript: o.transcript });
  if (o.find) printMatches(findWord(list, o.find), list);
  else console.log(list.map((w) => `${w.start.toFixed(2).padStart(7)}  ${w.word}`).join("\n"));
}

function place(name, o) {
  if (!o.video) throw new UsageError("place needs --video <file>");
  const video = path.resolve(o.video);
  if (!fs.existsSync(video)) throw new UsageError(`Can't find ${video}`);
  if (!o.word && o.at === undefined) throw new UsageError('place needs --word "<word>" or --at <seconds>');

  const block = loadBlock(name);
  const values = resolveVars(block, o.vars, o.set);
  const out = outDir(o);
  const info = probe(video);
  const fps = num(o.fps) ?? (info.fps > 45 ? 60 : 30);
  const variant = outputs(o, "top")[0];

  let at = num(o.at);
  if (o.word) {
    const list = loadWords(video, { workDir: workDir(out), model: o.model, language: o.language, transcript: o.transcript });
    const matches = findWord(list, o.word);
    if (!matches.length) throw new UsageError(`"${o.word}" isn't in the transcript. Run: animate words "${o.video}"`);
    const occurrence = num(o.occurrence);
    if (matches.length > 1 && !occurrence) {
      printMatches(matches, list);
      throw new UsageError(`"${o.word}" is said ${matches.length} times. Choose one with --occurrence <n>.`);
    }
    const hit = matches[(occurrence ?? 1) - 1];
    if (!hit) throw new UsageError(`Only ${matches.length} match(es) for "${o.word}".`);
    at = hit.start;
    const onset = refineStart(video, hit, list[hit.index - 1]?.end);
    if (onset !== null) {
      at = onset;
      console.log(`Landing on "${hit.text}" at ${at.toFixed(3)}s (read from the audio, it follows a pause)`);
    } else {
      console.log(`Landing on "${hit.text}" at ${at.toFixed(3)}s (transcript time, good to about 0.1s; adjust with --nudge)`);
    }
  }
  at += num(o.nudge) ?? 0;

  const fit = fitToWord(block, at, info.duration, { keyAt: num(o["key-at"]), hold: num(o.hold) });
  for (const note of fit.notes) console.log(`  ${note}`);
  const timing = resolveTiming(block, variant, { keyAt: fit.keyAt, hold: fit.hold, alpha: true, fps });
  const height = variant === "top" ? num(o.height) : undefined;
  const dir = buildProject({ block, variant, vars: values, timing, workDir: workDir(out), fps, alpha: true, height });
  const clip = path.join(workDir(out), `${name}-${variant}-placed.mov`);
  console.log(`Rendering ${name} ${variant} (${timing.duration.toFixed(2)}s, starts at ${(at - timing.key).toFixed(2)}s)`);
  renderProject(dir, clip, { format: "mov", fps, quality: o.draft ? "draft" : "looks" });

  const stem = path.basename(video, path.extname(video));
  const file = path.join(out, `${stem}-${name}-${variant}.mp4`);
  placeOnVideo({
    video,
    clip,
    out: file,
    start: at - timing.key,
    duration: timing.duration,
    variant,
    info,
    speakerY: num(o["speaker-y"]),
    draft: o.draft,
  });
  console.log(`  ${file}`);
  console.log(`  Key moment at ${at.toFixed(3)}s. Check it: animate sheet "${file}" --times ${at.toFixed(2)}`);
  return file;
}

function preview(name, o) {
  const block = loadBlock(name);
  const values = resolveVars(block, o.vars, o.set);
  const variant = outputs(o, "full")[0];
  const timing = resolveTiming(block, variant, { keyAt: num(o["key-at"]), hold: num(o.hold) });
  const dir = buildProject({ block, variant, vars: values, timing, workDir: workDir(outDir(o)), height: num(o.height) });
  hyperframes(["preview", "."], { cwd: dir });
}

function check(name, o) {
  const block = loadBlock(name);
  const values = resolveVars(block, o.vars, o.set);
  let failed = 0;
  for (const variant of outputs(o, "all")) {
    const timing = resolveTiming(block, variant, { keyAt: num(o["key-at"]), hold: num(o.hold) });
    const dir = buildProject({ block, variant, vars: values, timing, workDir: workDir(outDir(o)), height: num(o.height) });
    console.log(`--- ${name} ${variant}`);
    const res = hyperframes(["check", "."], { cwd: dir });
    if (res.status !== 0) failed += 1;
  }
  if (failed) process.exitCode = 1;
}

function sheet(video, o) {
  const out = outDir(o);
  const file = path.join(out, `${path.basename(video, path.extname(video))}-sheet.jpg`);
  contactSheet(path.resolve(video), file, o.times ? o.times.split(",").map(Number) : undefined);
  console.log(file);
}

async function main() {
  const { values: o, positionals: p } = parseArgs({ options: OPTIONS, allowPositionals: true });
  const [cmd, target] = p;
  if (!cmd || o.help) return console.log(HELP);
  if (!fs.existsSync(path.join(PACK, "node_modules", "hyperframes"))) {
    throw new UsageError("Dependencies aren't installed yet. Run: npm install");
  }
  const need = () => {
    if (!target) throw new UsageError(`${cmd} needs a name or a file. Run with no arguments for help.`);
    return target;
  };
  const commands = {
    list: () => list(),
    vars: () => vars(need()),
    render: () => render(need(), o),
    place: () => place(need(), o),
    words: () => words(need(), o),
    preview: () => preview(need(), o),
    check: () => check(need(), o),
    sheet: () => sheet(need(), o),
    route: () => makeRoute(o),
    campaign: () => makeCampaign(o),
    explain: () => explain(p.slice(1), o),
  };
  if (!commands[cmd]) throw new UsageError(`Unknown command "${cmd}". Run with no arguments for help.`);
  await commands[cmd]();
}

try {
  await main();
} catch (err) {
  console.error(err instanceof UsageError ? err.message : err.stack);
  process.exitCode = 1;
}
