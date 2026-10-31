// Word timing: get every spoken word with its time, find the one asked for, and fit a block around it.
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { UsageError, hyperframes } from "./build.mjs";

const clean = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}']+/gu, "").replace(/'/g, "");

// HyperFrames writes [{text, start, end}, ...]. Whisper-style transcripts nest words under segments.
export function normaliseWords(data) {
  const raw = Array.isArray(data) ? data : data.words ?? (data.segments ?? []).flatMap((s) => s.words ?? []);
  return raw
    .map((w) => ({ word: String(w.text ?? w.word ?? "").trim(), start: Number(w.start), end: Number(w.end ?? w.start) }))
    .filter((w) => w.word && Number.isFinite(w.start));
}

export function loadWords(video, { workDir, model, language, transcript }) {
  if (transcript) {
    const file = path.resolve(transcript);
    if (!fs.existsSync(file)) throw new UsageError(`Can't find ${file}`);
    if (file.endsWith(".json")) return normaliseWords(JSON.parse(fs.readFileSync(file, "utf8")));
  }
  const stat = fs.statSync(path.resolve(video));
  const key = createHash("sha1")
    .update(`${path.resolve(video)}|${stat.size}|${stat.mtimeMs}|${model ?? ""}|${language ?? ""}|${transcript ?? ""}`)
    .digest("hex")
    .slice(0, 12);
  const dir = path.join(workDir, `words-${key}`);
  const cached = path.join(dir, "transcript.json");
  if (!fs.existsSync(cached)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(transcript ? "Reading transcript" : "Transcribing");
    const args = ["transcribe", path.resolve(transcript ?? video), "--dir", dir];
    if (model) args.push("--model", model);
    if (language) args.push("--language", language);
    const res = hyperframes(args, { capture: true });
    if (!fs.existsSync(cached)) {
      throw new UsageError(
        `Couldn't transcribe. Download the speech model once with: npm run setup -- --speech\n` +
          `Or pass a transcript with --transcript <file>, or a time with --at <seconds>.\n${(res.stderr || "").slice(-400)}`,
      );
    }
  }
  return normaliseWords(JSON.parse(fs.readFileSync(cached, "utf8")));
}

// Finds a word or a short phrase. Each match lands on the phrase's first word.
export function findWord(words, phrase) {
  const want = phrase.split(/\s+/).map(clean).filter(Boolean);
  if (!want.length) return [];
  const have = words.map((w) => clean(w.word));
  const hits = [];
  for (let i = 0; i + want.length <= have.length; i++) {
    if (want.every((w, j) => have[i + j] === w)) {
      hits.push({ index: i, start: words[i].start, end: words[i + want.length - 1].end, text: words.slice(i, i + want.length).map((w) => w.word).join(" ") });
    }
  }
  return hits;
}

// Speech models place a word's start well, but not exactly. Measured on four shorts, a word after a pause came out
// about 0.1s ahead of the sound. When there's a real pause before the word, the audio gives the true start, so use it.
export function soundStart(pcm, sampleRate, offset) {
  const hop = Math.round(sampleRate * 0.005);
  const levels = [];
  for (let i = 0; i + hop * 2 <= pcm.length; i += hop) {
    let sum = 0;
    for (let j = i; j < i + hop * 2; j++) sum += pcm[j] * pcm[j];
    levels.push(10 * Math.log10(sum / (hop * 2) + 1e-10));
  }
  if (!levels.length) return null;
  const peak = Math.max(...levels);
  const quiet = peak - 30;
  const loud = peak - 20;
  let run = 0;
  let paused = false;
  for (let i = 0; i < levels.length; i++) {
    if (paused && levels[i] > loud) return offset + (i * hop) / sampleRate - 0.015;
    run = levels[i] < quiet ? run + 1 : 0;
    if (run >= 14) paused = true; // 70ms of near silence
  }
  return null;
}

export function refineStart(video, word, previousEnd) {
  const from = Math.max(0, Math.min(previousEnd ?? 0, word.start) - 0.08);
  const to = word.start + 0.28;
  const rate = 16000;
  const res = spawnSync(
    "ffmpeg",
    ["-v", "error", "-ss", from.toFixed(3), "-t", (to - from).toFixed(3), "-i", video, "-vn", "-ac", "1", "-ar", String(rate), "-f", "f32le", "-"],
    { maxBuffer: 1 << 24 },
  );
  if (res.status !== 0 || !res.stdout?.length) return null;
  const bytes = res.stdout.subarray(0, res.stdout.length - (res.stdout.length % 4));
  const pcm = new Float32Array(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length));
  return soundStart(pcm, rate, from);
}

export function printMatches(matches, words) {
  matches.forEach((m, n) => {
    const before = words.slice(Math.max(0, m.index - 4), m.index).map((w) => w.word).join(" ");
    const after = words.slice(m.index + 1, m.index + 6).map((w) => w.word).join(" ");
    console.log(`${String(n + 1).padStart(3)}. ${m.start.toFixed(2).padStart(7)}s  ...${before} [${m.text}] ${after}...`);
  });
}

// Works out the block's lead-in and hold so the key moment lands on `at` and the block stays inside the video.
export function fitToWord(block, at, videoDuration, { keyAt, hold } = {}) {
  const t = block.timing;
  const notes = [];
  if (at < t.minKeyAt) {
    throw new UsageError(
      `That word is at ${at.toFixed(2)}s, and ${block.name} needs ${t.minKeyAt}s of build-up before it. Pick a later word.`,
    );
  }
  let lead = keyAt ?? t.keyAt;
  if (lead > at) {
    notes.push(`Word comes early: build-up shortened from ${lead.toFixed(2)}s to ${at.toFixed(2)}s.`);
    lead = at;
  }
  const room = videoDuration - at - t.exit;
  let after = hold ?? t.hold;
  if (after > room) {
    if (room < 0.4) {
      throw new UsageError(`That word is at ${at.toFixed(2)}s, too close to the end of the video to show the payoff.`);
    }
    notes.push(`Word comes late: hold shortened from ${after.toFixed(2)}s to ${room.toFixed(2)}s.`);
    after = room;
  }
  return { keyAt: lead, hold: after, notes };
}
