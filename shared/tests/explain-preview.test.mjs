import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { paceWords, phraseWords, sceneTimes, scriptWords, syllables } from "../explain-align.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const example = (name) => JSON.parse(fs.readFileSync(path.join(here, "..", "..", "explain-kit", "examples", name), "utf8"));
const examples = fs
  .readdirSync(path.join(here, "..", "..", "explain-kit", "examples"))
  .filter((f) => f.endsWith(".json"))
  .map(example);

test("counts syllables well enough to time words", () => {
  assert.equal(syllables("day"), 1);
  assert.equal(syllables("battery"), 3);
  assert.equal(syllables("capacity"), 4);
  assert.equal(syllables("charge"), 1);
});

test("a preview reads at 2.6 to 2.9 words a second, for every example script", () => {
  for (const script of examples) {
    const words = paceWords(scriptWords(script.scenes));
    const span = words[words.length - 1].end - words[0].start;
    const wps = words.length / span;
    assert.ok(wps >= 2.6 && wps <= 2.9, `${script.title}: ${wps.toFixed(2)} words a second`);
  }
});

test("a preview pauses longest between scenes, then at full stops, then at commas", () => {
  const scenes = [{ text: "One two, three four. Five six seven." }, { text: "Eight nine ten." }];
  const w = paceWords(scriptWords(scenes));
  const gap = (i) => w[i + 1].start - w[i].end;
  assert.ok(gap(1) > gap(0), "comma longer than a plain gap");
  assert.ok(gap(3) > gap(1), "full stop longer than a comma");
  assert.ok(gap(6) > gap(3), "scene change longer than a full stop");
  for (let i = 1; i < w.length; i++) assert.ok(w[i].start >= w[i - 1].end);
});

test("longer words and numbers take longer to say", () => {
  const w = paceWords(scriptWords([{ text: "A capacity of 100% today." }]));
  const at = (t) => w.find((x) => x.text === t);
  assert.ok(at("capacity").end - at("capacity").start > at("of").end - at("of").start);
  assert.ok(at("100%").end - at("100%").start > at("capacity").end - at("capacity").start);
});

test("preview timing goes through the same phrasing and scene rules as a recording", () => {
  for (const script of examples) {
    const words = paceWords(scriptWords(script.scenes));
    const { phrases, notes } = phraseWords(words);
    assert.equal(notes.length, 0, `${script.title}: ${notes.join("; ")}`);
    for (const p of phrases) {
      assert.ok(p.words.length >= 2 && p.words.length <= 4);
      assert.equal(p.words.filter((x) => x.key).length >= 1, true);
    }
    const times = sceneTimes(words, script.scenes.length);
    for (let i = 1; i < times.length; i++) assert.equal(times[i].start, times[i - 1].end);
  }
});

test("the same script always gets the same preview timing", () => {
  const a = paceWords(scriptWords(examples[0].scenes));
  const b = paceWords(scriptWords(examples[0].scenes));
  assert.deepEqual(a, b);
});
