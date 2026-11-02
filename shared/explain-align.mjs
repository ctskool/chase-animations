// The timing half of /explain, with no files and no processes, so every rule here is tested.
// A script's words are lined up against what was really said, scenes take their times from the speech,
// and the caption phrases are cut from the word timings.

// ------------------------------------------------------------------ script words

const STOP = new Set(
  "a an the of to in on at by for from with and or but so as is are was were be been it its it's this that these those your my our their his her you we they i into onto than then".split(" "),
);

// Display text for a caption: sentence punctuation goes, the characters that are part of a word stay.
export const displayText = (raw) => raw.replace(/^[^\p{L}\p{N}$£€#@]+/u, "").replace(/[^\p{L}\p{N}%°'’+]+$/u, "");

// Splits "Your laptop [battery] is [wearing out] a little." into words. Words inside one pair of
// brackets are one key, and every key gets its own id.
export function parseSceneText(text, sceneIndex = 0, keyStart = 0) {
  const words = [];
  let keyId = keyStart;
  let open = null;
  for (const raw of String(text).trim().split(/\s+/).filter(Boolean)) {
    let token = raw;
    let opens = false;
    let closes = false;
    if (token.includes("[")) {
      opens = true;
      token = token.replace("[", "");
    }
    if (token.includes("]")) {
      closes = true;
      token = token.replace("]", "");
    }
    if (opens) {
      if (open !== null) throw new Error(`Scene ${sceneIndex + 1}: a "[" opens before the last one closed: "${text}"`);
      open = keyId++;
    }
    const display = displayText(token);
    if (display) {
      words.push({
        text: display,
        raw: token,
        scene: sceneIndex,
        key: open,
        sentenceEnd: /[.!?]["'”’)]*$/.test(token),
        clauseEnd: /[,;:—–-]["'”’)]*$/.test(token) && !/[.!?]["'”’)]*$/.test(token),
      });
    }
    if (closes) {
      if (open === null) throw new Error(`Scene ${sceneIndex + 1}: a "]" closes with nothing open: "${text}"`);
      open = null;
    }
  }
  if (open !== null) throw new Error(`Scene ${sceneIndex + 1}: a "[" is never closed: "${text}"`);
  if (words.length) words[words.length - 1].sentenceEnd = true;
  return { words, nextKey: keyId };
}

export function scriptWords(scenes) {
  const all = [];
  let key = 0;
  scenes.forEach((scene, i) => {
    const { words, nextKey } = parseSceneText(scene.text, i, key);
    key = nextKey;
    all.push(...words);
  });
  return all;
}

// The words to read out loud, with the brackets taken out.
export const plainText = (text) => String(text).replace(/[[\]]/g, "").replace(/\s+/g, " ").trim();

// ------------------------------------------------------------------ spoken tokens

const ONES = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split(" ");
const TENS = "_ _ twenty thirty forty fifty sixty seventy eighty ninety".split(" ");

export function numberWords(n) {
  if (!Number.isFinite(n) || n < 0) return [String(n)];
  if (!Number.isInteger(n)) {
    const [whole, frac] = String(n).split(".");
    return [...numberWords(Number(whole)), "point", ...frac.split("").map((d) => ONES[Number(d)])];
  }
  if (n < 20) return [ONES[n]];
  if (n < 100) return n % 10 ? [TENS[Math.floor(n / 10)], ONES[n % 10]] : [TENS[n / 10]];
  if (n < 1000) {
    const rest = n % 100;
    return [ONES[Math.floor(n / 100)], "hundred", ...(rest ? numberWords(rest) : [])];
  }
  for (const [size, name] of [[1e9, "billion"], [1e6, "million"], [1e3, "thousand"]]) {
    if (n >= size) {
      const rest = n % size;
      return [...numberWords(Math.floor(n / size)), name, ...(rest ? numberWords(rest) : [])];
    }
  }
  return [String(n)];
}

// What a word sounds like, as plain lowercase tokens: "100%" is ["one", "hundred", "percent"],
// "noise-cancelling" is ["noise", "cancelling"] and "don't" is ["dont"].
export function spokenTokens(word) {
  let s = String(word).toLowerCase().replace(/[’']/g, "");
  s = s.replace(/(\d),(?=\d{3}\b)/g, "$1");
  const out = [];
  for (const part of s.split(/[^\p{L}\p{N}%.$°]+/u).filter(Boolean)) {
    const m = part.match(/^\$?(\d+(?:\.\d+)?)(%|°|k|x)?$/);
    if (m) {
      if (part.startsWith("$")) out.push(...numberWords(Number(m[1])), "dollars");
      else out.push(...numberWords(Number(m[1])));
      if (m[2] === "%") out.push("percent");
      if (m[2] === "°") out.push("degrees");
      if (m[2] === "k") out.push("thousand");
      if (m[2] === "x") out.push("times");
      continue;
    }
    const clean = part.replace(/[^\p{L}\p{N}]+/gu, "");
    if (clean) out.push(clean);
  }
  return out;
}

function levenshtein(a, b) {
  if (a === b) return 0;
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return row[b.length];
}

// 1 for the same token, about 0.8 for "canceling" against "cancelling", 0 for unrelated words.
export function similarity(a, b) {
  if (a === b) return 1;
  const longest = Math.max(a.length, b.length);
  if (!longest) return 0;
  return 1 - levenshtein(a, b) / longest;
}

// ------------------------------------------------------------------ alignment

const GAP_SCRIPT = 1; // a script word that was never said
const GAP_SPOKEN = 0.75; // an ad-lib or a restart
const GAP_EDGE = 0.15; // talk before the first scripted word or after the last
const MATCH_AT = 0.72;

// script: [{text}] from scriptWords. spoken: [{word, start, end}] from loadWords.
// Returns every script word with a time, plus a report on how well they lined up.
export function alignWords(script, spoken) {
  const sTok = [];
  script.forEach((w, wi) => spokenTokens(w.text).forEach((t) => sTok.push({ t, wi })));
  const tTok = [];
  spoken.forEach((w, wi) => {
    const toks = spokenTokens(w.word);
    const span = Math.max(0.001, w.end - w.start);
    toks.forEach((t, k) => {
      tTok.push({ t, wi, start: w.start + (span * k) / toks.length, end: w.start + (span * (k + 1)) / toks.length });
    });
  });

  const n = sTok.length;
  const m = tTok.length;
  const cost = Array.from({ length: n + 1 }, () => new Float64Array(m + 1));
  const move = Array.from({ length: n + 1 }, () => new Uint8Array(m + 1)); // 1 diag, 2 up (skip script), 3 left (skip spoken)
  const skipSpoken = (i) => (i === 0 || i === n ? GAP_EDGE : GAP_SPOKEN);
  for (let j = 1; j <= m; j++) {
    cost[0][j] = cost[0][j - 1] + skipSpoken(0);
    move[0][j] = 3;
  }
  for (let i = 1; i <= n; i++) {
    cost[i][0] = cost[i - 1][0] + GAP_SCRIPT;
    move[i][0] = 2;
    for (let j = 1; j <= m; j++) {
      const sim = similarity(sTok[i - 1].t, tTok[j - 1].t);
      const sub = sim >= MATCH_AT ? (1 - sim) * 0.6 : 1.6;
      const d = cost[i - 1][j - 1] + sub;
      const u = cost[i - 1][j] + GAP_SCRIPT;
      const l = cost[i][j - 1] + skipSpoken(i);
      // On a tie the diagonal wins. Walking back from the end, that matches the later copy of a
      // repeated phrase, which is the take that was kept after a restart.
      if (d <= u && d <= l) {
        cost[i][j] = d;
        move[i][j] = 1;
      } else if (u <= l) {
        cost[i][j] = u;
        move[i][j] = 2;
      } else {
        cost[i][j] = l;
        move[i][j] = 3;
      }
    }
  }

  const pairOf = new Array(n).fill(-1);
  const usedSpoken = new Uint8Array(m);
  for (let i = n, j = m; i > 0 || j > 0; ) {
    const mv = move[i][j];
    if (mv === 1) {
      if (similarity(sTok[i - 1].t, tTok[j - 1].t) >= MATCH_AT) {
        pairOf[i - 1] = j - 1;
        usedSpoken[j - 1] = 1;
      }
      i--;
      j--;
    } else if (mv === 2) i--;
    else j--;
  }

  // Each script word takes its time from the tokens that matched.
  const words = script.map((w) => ({ ...w, start: null, end: null, matched: false }));
  sTok.forEach((tok, k) => {
    const p = pairOf[k];
    if (p < 0) return;
    const w = words[tok.wi];
    const t = tTok[p];
    w.start = w.start === null ? t.start : Math.min(w.start, t.start);
    w.end = w.end === null ? t.end : Math.max(w.end, t.end);
    w.matched = true;
  });

  // Words that were never heard are placed between their neighbours, by length.
  const firstHeard = words.findIndex((w) => w.matched);
  const speechEnd = spoken.length ? spoken[spoken.length - 1].end : 0;
  if (firstHeard < 0) {
    const per = Math.max(speechEnd, 1) / Math.max(1, words.length);
    words.forEach((w, i) => {
      w.start = i * per;
      w.end = (i + 0.9) * per;
    });
  } else {
    let i = 0;
    while (i < words.length) {
      if (words[i].matched) {
        i++;
        continue;
      }
      let j = i;
      while (j < words.length && !words[j].matched) j++;
      const prevEnd = i > 0 ? words[i - 1].end : Math.max(0, words[j]?.start - 0.4 * (j - i));
      const nextStart = j < words.length ? words[j].start : Math.max(prevEnd + 0.3 * (j - i), speechEnd);
      const lens = words.slice(i, j).map((w) => w.text.length + 2);
      const total = lens.reduce((a, b) => a + b, 0);
      let at = prevEnd;
      const span = Math.max(0, nextStart - prevEnd);
      for (let k = i; k < j; k++) {
        const share = (span * lens[k - i]) / total;
        words[k].start = at;
        words[k].end = at + share * 0.9;
        at += share;
      }
      i = j;
    }
  }
  for (let i = 1; i < words.length; i++) {
    if (words[i].start < words[i - 1].start) words[i].start = words[i - 1].start;
    if (words[i].end < words[i].start) words[i].end = words[i].start;
  }

  // The report.
  const missing = [];
  words.forEach((w, i) => {
    if (!w.matched) missing.push({ index: i, text: w.text, scene: w.scene });
  });
  const extra = [];
  let run = null;
  tTok.forEach((t, k) => {
    if (usedSpoken[k]) {
      run = null;
      return;
    }
    const word = spoken[t.wi];
    if (run && run.last === t.wi) return;
    if (run && run.last === t.wi - 1) {
      run.words.push(word.word);
      run.last = t.wi;
      run.end = word.end;
    } else {
      run = { start: word.start, end: word.end, words: [word.word], last: t.wi };
      extra.push(run);
    }
  });
  const matchedTokens = pairOf.filter((p) => p >= 0).length;
  const coverage = n ? matchedTokens / n : 0;
  const perScene = [];
  words.forEach((w) => {
    perScene[w.scene] = perScene[w.scene] || { words: 0, heard: 0 };
    perScene[w.scene].words += 1;
    if (w.matched) perScene[w.scene].heard += 1;
  });
  const extraWords = extra.reduce((a, r) => a + r.words.length, 0);
  let quality = "good";
  if (coverage < 0.6 || perScene.some((s) => s && s.heard === 0)) quality = "failed";
  else if (coverage < 0.85 || perScene.some((s) => s && s.heard / s.words < 0.6) || extraWords > script.length * 0.35) quality = "poor";
  return {
    words,
    report: {
      quality,
      coverage,
      missing,
      extra: extra.map(({ start, end, words: w }) => ({ start, end, text: w.join(" ") })),
      perScene: perScene.map((s) => s ?? { words: 0, heard: 0 }),
      spokenWords: spoken.length,
    },
  };
}

// ------------------------------------------------------------------ preview pacing

// Syllables in one spoken token, near enough for timing: vowel groups, less a silent final e.
export function syllables(token) {
  const t = String(token).toLowerCase().replace(/[^a-z]/g, "");
  if (!t) return 1;
  if (t.length <= 3) return 1;
  const groups = t.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, "").match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups ? groups.length : 1);
}

export const PACE = { wps: 2.75, gap: 0.05, comma: 0.24, stop: 0.42, scene: 0.55, start: 0.35 };

// Times every script word at a natural reading pace, with no recording: words take time by their
// syllables, commas and full stops add pauses, and the whole read averages `wps` words a second.
export function paceWords(script, opts = {}) {
  const p = { ...PACE, ...opts };
  const weight = script.map((w) => {
    const toks = spokenTokens(w.text);
    const syl = toks.reduce((a, t) => a + syllables(t), 0) || 1;
    return 0.55 + 0.45 * syl;
  });
  const pauses = script.map((w, i) => {
    const next = script[i + 1];
    if (!next) return 0;
    if (next.scene !== w.scene) return p.scene;
    if (w.sentenceEnd) return p.stop;
    if (w.clauseEnd) return p.comma;
    return p.gap;
  });
  // The read lasts words / wps seconds. Whatever the pauses don't use is shared by syllable weight.
  const total = script.length / p.wps;
  const talk = Math.max(total * 0.55, total - pauses.reduce((a, b) => a + b, 0));
  const unit = talk / weight.reduce((a, b) => a + b, 0);
  let t = p.start;
  return script.map((w, i) => {
    const d = weight[i] * unit;
    const out = { ...w, start: t, end: t + d, matched: true };
    t += d + pauses[i];
    return out;
  });
}

// ------------------------------------------------------------------ scenes

// Every scene starts a moment before its first word, so the picture changes as the sentence begins.
export function sceneTimes(words, sceneCount, { lead = 0.12, tail = 0.5 } = {}) {
  const first = [];
  const last = [];
  words.forEach((w) => {
    if (first[w.scene] === undefined) first[w.scene] = w.start;
    last[w.scene] = w.end;
  });
  const out = [];
  for (let i = 0; i < sceneCount; i++) {
    const start = i === 0 ? 0 : Math.max(last[i - 1] ?? 0, (first[i] ?? 0) - lead);
    out.push({ start, speechStart: first[i] ?? start, speechEnd: last[i] ?? start });
  }
  for (let i = 0; i < sceneCount; i++) {
    out[i].end = i + 1 < sceneCount ? out[i + 1].start : (last[i] ?? out[i].start) + tail;
    out[i].duration = out[i].end - out[i].start;
  }
  return out;
}

// ------------------------------------------------------------------ caption phrases

const isStop = (w) => STOP.has(w.text.toLowerCase().replace(/[’']/g, "'"));

function phraseCost(ws, nextWord) {
  const len = ws.length;
  let c = 0.35 * Math.abs(len - 3);
  const keys = new Set(ws.filter((w) => w.key !== null && w.key !== undefined).map((w) => w.key));
  if (keys.size === 0) c += 2.2;
  if (keys.size > 1) c += 3 * (keys.size - 1);
  const last = ws[len - 1];
  // A key split across two phrases is never right.
  if (nextWord && last.key !== null && last.key !== undefined && nextWord.key === last.key) c += 50;
  if (nextWord) {
    const gap = Math.max(0, nextWord.start - last.end);
    c -= Math.min(gap, 0.45) * 5;
    if (last.clauseEnd) c -= 1.5;
    if (isStop(last)) c += 1.6;
  }
  const span = last.end - ws[0].start;
  if (span > 2.2) c += (span - 2.2) * 2;
  return c;
}

// Cuts each sentence into phrases of two to four words, at natural pauses, with one key each.
export function phraseWords(words, { min = 2, max = 4 } = {}) {
  const phrases = [];
  const notes = [];
  let sentence = [];
  const flush = () => {
    if (!sentence.length) return;
    const ws = sentence;
    sentence = [];
    const n = ws.length;
    const best = new Array(n + 1).fill(Infinity);
    const from = new Array(n + 1).fill(-1);
    best[0] = 0;
    for (let i = 1; i <= n; i++) {
      for (let len = 1; len <= Math.min(max, i); len++) {
        if (len < min && n >= min) continue;
        const j = i - len;
        if (!Number.isFinite(best[j])) continue;
        const c = best[j] + phraseCost(ws.slice(j, i), ws[i]);
        if (c < best[i]) {
          best[i] = c;
          from[i] = j;
        }
      }
    }
    const cuts = [];
    for (let i = n; i > 0; i = from[i]) cuts.unshift([from[i], i]);
    for (const [a, b] of cuts) phrases.push(ws.slice(a, b));
  };
  for (const w of words) {
    if (sentence.length && sentence[sentence.length - 1].scene !== w.scene) flush();
    sentence.push(w);
    if (w.sentenceEnd) flush();
  }
  flush();

  const out = phrases.map((ws, i) => {
    const keys = [...new Set(ws.filter((w) => w.key !== null && w.key !== undefined).map((w) => w.key))];
    let key = keys[0] ?? null;
    let keyIndex = key === null ? [] : ws.map((w, k) => (w.key === key ? k : -1)).filter((k) => k >= 0);
    const text = ws.map((w) => w.text).join(" ");
    if (keys.length > 1) notes.push(`"${text}" has ${keys.length} key words; boxing the first.`);
    if (key === null) {
      const pick = ws.reduce((best, w, k) => (!isStop(w) && w.text.length > (best < 0 ? 0 : ws[best].text.length) ? k : best), -1);
      keyIndex = [pick >= 0 ? pick : ws.length - 1];
      notes.push(`"${text}" has no key word; boxing "${ws[keyIndex[0]].text}". Mark one with [brackets] to choose.`);
    }
    return {
      index: i,
      scene: ws[0].scene,
      words: ws.map((w, k) => ({ text: w.text, start: w.start, end: w.end, key: keyIndex.includes(k) })),
      start: ws[0].start,
      end: ws[ws.length - 1].end,
    };
  });

  // Each phrase stays up until the next one starts, unless there is a long pause.
  out.forEach((p, i) => {
    const next = out[i + 1];
    const hold = p.end + 0.7;
    p.show = Math.max(0, p.start - 0.06);
    p.hide = next ? Math.min(next.start - 0.06, Math.max(hold, p.end + 0.2)) : hold;
    if (next && next.start - 0.06 - p.end < 0.9) p.hide = next.start - 0.06;
  });
  return { phrases: out, notes };
}
