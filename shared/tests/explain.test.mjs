import assert from "node:assert/strict";
import { test } from "node:test";
import {
  alignWords,
  numberWords,
  parseSceneText,
  phraseWords,
  plainText,
  sceneTimes,
  scriptWords,
  spokenTokens,
} from "../explain-align.mjs";

const scenes = [
  { text: "Your laptop [battery] is [wearing out] a little every [day]." },
  { text: "[Heat] speeds that up. So does [sitting] at [100%] on the [charger]." },
];

// Fake speech: each spoken word gets 0.3s, with a pause after sentences.
function speak(text, { start = 0.4, pauseAfter = /[.!?]$/ } = {}) {
  let t = start;
  return text.split(/\s+/).map((word) => {
    const w = { word, start: t, end: t + 0.26 };
    t += 0.3 + (pauseAfter.test(word) ? 0.45 : 0);
    return w;
  });
}

test("reads keys, multi-word keys and punctuation out of a scene", () => {
  const { words } = parseSceneText(scenes[0].text);
  assert.deepEqual(
    words.map((w) => w.text),
    ["Your", "laptop", "battery", "is", "wearing", "out", "a", "little", "every", "day"],
  );
  assert.equal(words[2].key, 0);
  assert.equal(words[4].key, 1);
  assert.equal(words[5].key, 1);
  assert.equal(words[9].key, 2);
  assert.equal(words[9].sentenceEnd, true);
  assert.equal(words[3].key, null);
  assert.throws(() => parseSceneText("an [open key"), /never closed/);
  assert.equal(plainText(scenes[1].text), "Heat speeds that up. So does sitting at 100% on the charger.");
});

test("numbers and symbols turn into the words people say", () => {
  assert.deepEqual(spokenTokens("100%"), ["one", "hundred", "percent"]);
  assert.deepEqual(spokenTokens("noise-cancelling"), ["noise", "cancelling"]);
  assert.deepEqual(spokenTokens("Don't"), ["dont"]);
  assert.deepEqual(numberWords(1200), ["one", "thousand", "two", "hundred"]);
  assert.deepEqual(spokenTokens("$5"), ["five", "dollars"]);
});

test("a clean read lines up word for word", () => {
  const script = scriptWords(scenes);
  const spoken = speak(scenes.map((s) => plainText(s.text)).join(" ").replace("100%", "one hundred percent"));
  const { words, report } = alignWords(script, spoken);
  assert.equal(report.quality, "good");
  assert.equal(report.coverage, 1);
  const pct = words.find((w) => w.text === "100%");
  const one = spoken.find((w) => w.word === "one");
  const percent = spoken.find((w) => w.word === "percent");
  assert.equal(pct.start, one.start);
  assert.equal(pct.end, percent.end);
});

test("an ad-lib, a dropped word and a restart still line up, and are reported", () => {
  const script = scriptWords(scenes);
  // "um", a restart on "Your laptop", "little" dropped, digits for the number.
  const spoken = speak(
    "Okay so um Your laptop Your laptop battery is wearing out a every day. Heat speeds that up. So does sitting at 100% on the charger.",
  );
  const { words, report } = alignWords(script, spoken);
  assert.equal(report.quality, "good");
  assert.deepEqual(report.missing.map((m) => m.text), ["little"]);
  assert.ok(report.extra.some((e) => /um/.test(e.text)));
  // The restart: "Your" is taken from the second, kept take.
  const your = words[0];
  assert.equal(your.start, spoken[5].start);
  // The dropped word sits between its neighbours.
  const little = words.find((w) => w.text === "little");
  assert.ok(little.start >= words[6].end && little.end <= words[8].start + 1e-9);
  // Times always run forward.
  for (let i = 1; i < words.length; i++) assert.ok(words[i].start >= words[i - 1].start);
});

test("speech that doesn't match the script is reported as failed", () => {
  const script = scriptWords(scenes);
  const spoken = speak("this is a completely different recording about cooking pasta at home tonight");
  assert.equal(alignWords(script, spoken).report.quality, "failed");
});

test("scenes start just before their first word and run back to back", () => {
  const script = scriptWords(scenes);
  const spoken = speak(scenes.map((s) => plainText(s.text)).join(" "));
  const { words } = alignWords(script, spoken);
  const times = sceneTimes(words, 2);
  assert.equal(times[0].start, 0);
  const firstOfTwo = words.find((w) => w.scene === 1);
  assert.ok(times[1].start < firstOfTwo.start && times[1].start >= firstOfTwo.start - 0.13);
  assert.equal(times[0].end, times[1].start);
  assert.ok(times[1].end > words[words.length - 1].end);
});

test("phrases are two to four words, break at pauses, never split a key, and box one word", () => {
  const script = scriptWords(scenes);
  const spoken = speak(scenes.map((s) => plainText(s.text)).join(" "));
  const { words } = alignWords(script, spoken);
  const { phrases, notes } = phraseWords(words);
  for (const p of phrases) {
    assert.ok(p.words.length >= 2 && p.words.length <= 4, `${p.words.map((w) => w.text).join(" ")}`);
    assert.ok(p.words.some((w) => w.key));
  }
  const texts = phrases.map((p) => p.words.map((w) => w.text).join(" "));
  // "wearing out" is one key and stays in one phrase.
  assert.ok(texts.some((t) => /wearing out/.test(t)));
  // Sentences never share a phrase.
  assert.ok(texts.includes("Heat speeds that up"));
  // Every key is boxed exactly where it was marked.
  const boxed = phrases.flatMap((p) => p.words.filter((w) => w.key).map((w) => w.text));
  assert.deepEqual(boxed, ["battery", "wearing", "out", "day", "Heat", "sitting", "100%", "charger"]);
  assert.equal(notes.length, 0);
  // Phrases follow each other without overlapping.
  for (let i = 1; i < phrases.length; i++) assert.ok(phrases[i].show >= phrases[i - 1].hide - 1e-9);
});

test("a long pause wins over an even split, and a phrase without a key gets one picked", () => {
  const ws = [
    { text: "one", key: null, start: 0, end: 0.2 },
    { text: "two", key: 0, start: 0.3, end: 0.5 },
    { text: "three", key: null, start: 1.4, end: 1.6 },
    { text: "four", key: null, start: 1.7, end: 1.9 },
    { text: "five", key: null, start: 2, end: 2.2, sentenceEnd: true },
  ].map((w) => ({ scene: 0, ...w }));
  const { phrases, notes } = phraseWords(ws);
  assert.deepEqual(phrases.map((p) => p.words.length), [2, 3]);
  assert.equal(notes.length, 1);
  assert.equal(phrases[1].words.filter((w) => w.key).length, 1);
});
