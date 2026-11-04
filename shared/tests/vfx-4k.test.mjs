// vfx --4k: the 4K working copy is made from the original video, never by scaling a small one up.
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { plate4k } from "../vfx.mjs";

const folder = () => fs.mkdtempSync(path.join(os.tmpdir(), "vfx4k-"));

test("a folder prepared before --4k is told to prep again", () => {
  assert.throws(() => plate4k(folder()), /prep again/);
});

test("a source under 2160 wide is refused, not upscaled", () => {
  const dir = folder();
  fs.writeFileSync(path.join(dir, "source.json"), JSON.stringify({ file: "phone.mp4", width: 1080, height: 1920 }));
  assert.throws(() => plate4k(dir), /at least 2160 wide/);
  assert.equal(fs.existsSync(path.join(dir, "plate4k.mp4")), false);
});

test("an existing 4K copy is reused", () => {
  const dir = folder();
  fs.writeFileSync(path.join(dir, "plate4k.mp4"), "");
  assert.equal(plate4k(dir), path.join(dir, "plate4k.mp4"));
});
