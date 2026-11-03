// Turns a block plus a member's variables into a HyperFrames project folder, then renders it.
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const PACK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const BLOCKS = path.join(PACK, "blocks");
const HF_BIN = path.join(PACK, "node_modules", "hyperframes", "bin", "hyperframes.mjs");

// HyperFrames refreshes global AI skills on some commands. A member running this pack never asked for that.
export const HF_ENV = { ...process.env, HYPERFRAMES_SKIP_SKILLS: "1" };

export const VARIANTS = {
  full: { w: 1080, h: 1920, safe: { top: 230, bottom: 300, side: 64 } },
  top: { w: 1080, h: 960, safe: { top: 120, bottom: 36, side: 60 } },
  overlay: { w: 1080, h: 1920, safe: { top: 40, bottom: 36, side: 44 }, alpha: true, inset: 40, radius: 40 },
};

export class UsageError extends Error {}

export function listBlocks() {
  return fs
    .readdirSync(BLOCKS, { withFileTypes: true })
    .filter((d) => d.isDirectory() && fs.existsSync(path.join(BLOCKS, d.name, "block.json")))
    .map((d) => d.name)
    .sort();
}

export function loadBlock(name) {
  const dir = path.join(BLOCKS, name);
  if (!fs.existsSync(path.join(dir, "block.json"))) {
    throw new UsageError(`No animation called "${name}". Available: ${listBlocks().join(", ")}`);
  }
  return { ...JSON.parse(fs.readFileSync(path.join(dir, "block.json"), "utf8")), dir };
}

export function resolveVars(block, file, sets = []) {
  const declared = new Map(block.variables.map((v) => [v.id, v]));
  const vars = Object.fromEntries(block.variables.map((v) => [v.id, v.default]));
  const input = file ? JSON.parse(fs.readFileSync(file, "utf8")) : {};
  for (const pair of sets) {
    const eq = pair.indexOf("=");
    if (eq < 1) throw new UsageError(`--set needs name=value, got "${pair}"`);
    input[pair.slice(0, eq)] = pair.slice(eq + 1);
  }
  for (const [id, raw] of Object.entries(input)) {
    const def = declared.get(id);
    if (!def) {
      throw new UsageError(`"${id}" is not a variable of ${block.name}. Run: animate vars ${block.name}`);
    }
    vars[id] = coerce(def, raw);
  }
  return vars;
}

function coerce(def, raw) {
  if (def.type === "number") {
    const n = Number(raw);
    if (!Number.isFinite(n)) throw new UsageError(`${def.id} needs a number, got "${raw}"`);
    return n;
  }
  if (def.type === "color") {
    if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(raw))) {
      throw new UsageError(`${def.id} needs a hex colour like #3D7BFF, got "${raw}"`);
    }
    return String(raw);
  }
  if (def.type === "enum") {
    const allowed = def.options.map((o) => o.value);
    if (!allowed.includes(raw)) throw new UsageError(`${def.id} must be one of ${allowed.join(", ")}, got "${raw}"`);
    return raw;
  }
  if (def.type === "boolean") return raw === true || raw === "true";
  return String(raw);
}

// keyAt: seconds from the block's first frame to its key moment. Blocks scale their build-up to fit it.
export function resolveTiming(block, variant, opts = {}) {
  const t = block.timing;
  const key = Number(opts.keyAt ?? t.keyAt);
  const hold = Number(opts.hold ?? t.hold);
  if (key < t.minKeyAt) {
    throw new UsageError(
      `${block.name} needs at least ${t.minKeyAt}s before its key moment to read properly (asked for ${key.toFixed(2)}s). ` +
        `Pick a later word, or use a shorter block.`,
    );
  }
  const alpha = Boolean(opts.alpha || VARIANTS[variant].alpha);
  const exit = alpha ? t.exit : 0;
  const fps = opts.fps ?? 30;
  const duration = Math.ceil((key + hold + exit) * fps) / fps;
  return { key, hold, exit, duration, design: t.keyAt, scale: key / t.keyAt };
}

function layout(block, variantName, vars, opts) {
  const v = VARIANTS[variantName];
  if (!v) throw new UsageError(`Output must be one of ${Object.keys(VARIANTS).join(", ")}, got "${variantName}"`);
  const height = variantName === "top" && opts.height ? even(opts.height) : v.h;
  const frame = { w: v.w, h: height };
  let stage = { x: 0, y: 0, w: frame.w, h: frame.h };
  if (variantName === "overlay") {
    const h = block.overlayHeight ?? 880;
    const y = vars.overlayPosition === "bottom" ? 1620 - h : VARIANTS.full.safe.top;
    stage = { x: v.inset, y, w: frame.w - v.inset * 2, h, radius: block.overlayCard === false ? 0 : v.radius };
  }
  return { frame, stage, safe: v.safe };
}

const even = (n) => Math.round(Number(n) / 2) * 2;

function copyMedia(block, vars, projectDir, baseDir) {
  const out = { ...vars };
  for (const def of block.variables) {
    if (!["image", "html", "data"].includes(def.type) || !vars[def.id]) continue;
    const src = path.resolve(baseDir, vars[def.id]);
    if (!fs.existsSync(src)) throw new UsageError(`${def.id}: can't find ${src}`);
    if (def.type === "data") {
      out[def.id] = JSON.parse(fs.readFileSync(src, "utf8"));
      continue;
    }
    if (def.type === "html") {
      out[def.id] = fs.readFileSync(src, "utf8");
      continue;
    }
    const name = `assets/${def.id}${path.extname(src).toLowerCase()}`;
    fs.mkdirSync(path.join(projectDir, "assets"), { recursive: true });
    fs.copyFileSync(src, path.join(projectDir, name));
    out[def.id] = name;
  }
  return out;
}

function compositionVariables(block, vars) {
  return block.variables
    .filter((v) => v.type !== "html" && v.type !== "data")
    .map(({ id, type, label, options, min, max, step }) => ({
      id,
      type,
      label,
      default: vars[id],
      ...(options ? { options } : {}),
      ...(min !== undefined ? { min, max, step } : {}),
    }));
}

const attr = (s) => s.replace(/&/g, "&amp;").replace(/'/g, "&#39;");

// extra: more facts for CA (the /vfx effects pass the speaker's head track, the words and which layer to draw).
export function buildProject({ block, variant, vars, timing, workDir, baseDir = process.cwd(), fps = 30, alpha, height, extra = {} }) {
  const sources = ["block.js", "block.css", "block.html", "block.json"].map((f) => fs.readFileSync(path.join(block.dir, f), "utf8"));
  sources.push(fs.readFileSync(path.join(PACK, "shared", "runtime.js"), "utf8"));
  if (block.claudeKit) sources.push(fs.readFileSync(path.join(PACK, "shared", "claude-kit.js"), "utf8"));
  const hash = createHash("sha1")
    .update(JSON.stringify({ variant, vars, timing, fps, alpha, height, extra, sources }))
    .digest("hex")
    .slice(0, 10);
  const dir = path.join(workDir, `${block.name}-${extra.layer ?? variant}-${hash}`);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(path.join(dir, "vendor"), { recursive: true });

  const blockAssets = path.join(block.dir, "assets");
  if (fs.existsSync(blockAssets)) fs.cpSync(blockAssets, path.join(dir, "assets"), { recursive: true });
  const finalVars = copyMedia(block, vars, dir, baseDir);
  const { frame, stage, safe } = layout(block, variant, vars, { height });
  const usesAlpha = Boolean(alpha || VARIANTS[variant].alpha);

  fs.cpSync(path.join(PACK, "shared", "fonts"), path.join(dir, "fonts"), {
    recursive: true,
    filter: (p) => !p.endsWith("licenses") && !p.endsWith(".css") && !p.endsWith(".txt"),
  });
  const scripts = [];
  const nm = path.join(PACK, "node_modules");
  fs.copyFileSync(path.join(nm, "gsap", "dist", "gsap.min.js"), path.join(dir, "vendor", "gsap.min.js"));
  scripts.push(`<script src="vendor/gsap.min.js"></script>`);
  let importmap = "";
  if (block.three) {
    const threeDir = path.join(dir, "vendor", "three");
    fs.mkdirSync(path.join(threeDir, "addons"), { recursive: true });
    for (const f of ["three.module.js", "three.core.js"]) {
      fs.copyFileSync(path.join(nm, "three", "build", f), path.join(threeDir, f));
    }
    fs.copyFileSync(
      path.join(nm, "three", "examples", "jsm", "geometries", "RoundedBoxGeometry.js"),
      path.join(threeDir, "addons", "RoundedBoxGeometry.js"),
    );
    importmap = `<script type="importmap">{"imports":{"three":"./vendor/three/three.module.js","three/addons/":"./vendor/three/addons/"}}</script>`;
  }
  if (block.motionBlur) {
    fs.copyFileSync(path.join(PACK, "shared", "vendor", "motion-blur.js"), path.join(dir, "vendor", "motion-blur.js"));
  }

  const css = [
    fs.readFileSync(path.join(PACK, "shared", "fonts", "fonts.css"), "utf8"),
    `*{margin:0;padding:0;box-sizing:border-box}`,
    `html,body{width:${frame.w}px;height:${frame.h}px;overflow:hidden;background:${usesAlpha ? "transparent" : "#000"}}`,
    `#root{position:relative;width:100%;height:100%;overflow:hidden}`,
    `#stage{position:absolute;overflow:hidden}`,
    fs.readFileSync(path.join(block.dir, "block.css"), "utf8"),
  ].join("\n");

  const meta = {
    variant,
    frame,
    stage,
    safe,
    fps,
    alpha: usesAlpha,
    time: timing,
    fonts: block.fonts,
    vars: finalVars,
    ...extra,
  };

  const html = `<!doctype html>
<html lang="en" data-composition-variables='${attr(JSON.stringify(compositionVariables(block, finalVars)))}'>
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=${frame.w}, height=${frame.h}" />
<title>${block.title}</title>
<script type="application/json" id="ca-meta">${JSON.stringify(meta).replace(/</g, "\\u003c")}</script>
${importmap}
${scripts.join("\n")}
<style>
${css}
</style>
</head>
<body>
<div id="root" data-composition-id="block" data-start="0" data-duration="${timing.duration}" data-fps="${fps}" data-width="${frame.w}" data-height="${frame.h}">
<div id="stage">
${fs.readFileSync(path.join(block.dir, "block.html"), "utf8")}
</div>
</div>
<script>
${fs.readFileSync(path.join(PACK, "shared", "runtime.js"), "utf8")}
</script>
${block.claudeKit ? `<script>\n${fs.readFileSync(path.join(PACK, "shared", "claude-kit.js"), "utf8")}\n</script>` : ""}
${block.motionBlur ? `<script src="vendor/motion-blur.js"></script>` : ""}
<script${block.three ? ` type="module"` : ""}>
${fs.readFileSync(path.join(block.dir, "block.js"), "utf8")}
</script>
</body>
</html>
`;
  fs.writeFileSync(path.join(dir, "index.html"), html);
  fs.writeFileSync(
    path.join(dir, "hyperframes.json"),
    JSON.stringify({ $schema: "https://hyperframes.heygen.com/schema/hyperframes.json", media: { autoProxy: true } }, null, 2),
  );
  fs.writeFileSync(
    path.join(dir, "package.json"),
    JSON.stringify({ name: `${block.name}-${variant}`, private: true, type: "module" }, null, 2),
  );
  return dir;
}

export function hyperframes(args, { cwd, capture = false } = {}) {
  const res = spawnSync(process.execPath, [HF_BIN, ...args], {
    cwd,
    env: HF_ENV,
    encoding: "utf8",
    stdio: capture ? "pipe" : "inherit",
    maxBuffer: 1 << 28,
  });
  if (res.error) throw res.error;
  return res;
}

export function renderProject(dir, out, { format, quality = "looks", fps = 30, quiet = true } = {}) {
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const args = ["render", ".", "--output", out, "--quality", quality, "--fps", String(fps)];
  if (format && format !== "mp4") args.push("--format", format);
  if (quiet) args.push("--quiet");
  const res = hyperframes(args, { cwd: dir, capture: quiet });
  if (res.status !== 0) throw new Error(`Render failed for ${dir}\n${(res.stderr || res.stdout || "").slice(-1500)}`);
  if (!fs.existsSync(out) || fs.statSync(out).size === 0) throw new Error(`Render wrote nothing: ${out}`);
  return out;
}
