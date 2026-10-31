import assert from "node:assert/strict";
import { test } from "node:test";
import { UsageError, resolveTiming, resolveVars } from "../build.mjs";
import { findWord, fitToWord, normaliseWords, soundStart } from "../sync.mjs";

const block = {
  name: "demo",
  timing: { keyAt: 3, hold: 1.5, exit: 0.3, minKeyAt: 1.5 },
  variables: [
    { id: "title", type: "string", default: "Hi" },
    { id: "accent", type: "color", default: "#123456" },
    { id: "side", type: "enum", default: "a", options: [{ value: "a" }, { value: "b" }] },
  ],
};

const words = normaliseWords([
  { text: "Claude", start: 1, end: 1.3 },
  { text: "Code,", start: 1.3, end: 1.6 },
  { text: "beats", start: 1.6, end: 1.9 },
  { text: "claude", start: 2, end: 2.2 },
  { text: "code.", start: 2.2, end: 2.5 },
]);

test("reads HyperFrames and Whisper transcript shapes", () => {
  assert.equal(words.length, 5);
  const nested = normaliseWords({ segments: [{ words: [{ word: " hello", start: 0.5, end: 0.9 }] }] });
  assert.deepEqual(nested, [{ word: "hello", start: 0.5, end: 0.9 }]);
});

test("finds words and phrases, ignoring case and punctuation", () => {
  assert.equal(findWord(words, "CODE").length, 2);
  const phrase = findWord(words, "claude code");
  assert.equal(phrase.length, 2);
  assert.equal(phrase[1].start, 2);
  assert.equal(findWord(words, "missing").length, 0);
});

test("a word in the normal range keeps the block's timing", () => {
  const fit = fitToWord(block, 10, 30);
  assert.deepEqual([fit.keyAt, fit.hold, fit.notes.length], [3, 1.5, 0]);
});

test("an early word shortens the build-up so the key moment still lands on it", () => {
  const fit = fitToWord(block, 2, 30);
  assert.equal(fit.keyAt, 2);
  assert.equal(fit.notes.length, 1);
});

test("a late word shortens the hold so the block stays inside the video", () => {
  const fit = fitToWord(block, 28.7, 30);
  assert.ok(Math.abs(fit.hold - 1) < 1e-9);
});

test("refuses words too close to either end", () => {
  assert.throws(() => fitToWord(block, 1, 30), UsageError);
  assert.throws(() => fitToWord(block, 29.5, 30), UsageError);
});

test("the block always stops before the end of the video", () => {
  const video = 30;
  const at = 28.7;
  const fit = fitToWord(block, at, video);
  const timing = resolveTiming(block, "top", { keyAt: fit.keyAt, hold: fit.hold, alpha: true, fps: 30 });
  assert.ok(at - timing.key + timing.duration <= video + 1 / 30);
});

test("exit time only exists when something can show through", () => {
  assert.equal(resolveTiming(block, "full").exit, 0);
  assert.equal(resolveTiming(block, "overlay").exit, 0.3);
  assert.equal(resolveTiming(block, "full", { alpha: true }).exit, 0.3);
});

test("finds the sound after a pause, and declines when there is no pause", () => {
  const rate = 16000;
  const tone = (n) => Float32Array.from({ length: n }, (_, i) => 0.3 * Math.sin(i * 0.2));
  const paused = new Float32Array(rate);
  paused.set(tone(1600), 0);
  paused.set(tone(4000), 8000); // silence from 0.1s, sound again at 0.5s
  const onset = soundStart(paused, rate, 10);
  assert.ok(Math.abs(onset - 10.5) < 0.03, `got ${onset}`);
  assert.equal(soundStart(tone(8000), rate, 0), null);
});

test("rejects unknown variables and bad colours with a useful message", () => {
  assert.throws(() => resolveVars(block, null, ["nope=1"]), /not a variable/);
  assert.throws(() => resolveVars(block, null, ["accent=blue"]), /hex colour/);
  assert.throws(() => resolveVars(block, null, ["side=c"]), /must be one of/);
  assert.equal(resolveVars(block, null, ["title=New"]).title, "New");
});
