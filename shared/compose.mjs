// FFmpeg steps: read a video's facts, put a rendered block on top of it, and make contact sheets.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { UsageError } from "./build.mjs";

function run(cmd, args) {
  const res = spawnSync(cmd, args, { encoding: "utf8", maxBuffer: 1 << 26 });
  if (res.error?.code === "ENOENT") throw new UsageError(`${cmd} isn't installed. See docs/INSTALL.md.`);
  if (res.status !== 0) throw new Error(`${cmd} failed:\n${(res.stderr || "").slice(-1500)}`);
  return res.stdout;
}

export function probe(video) {
  const data = JSON.parse(
    run("ffprobe", [
      "-v", "error", "-select_streams", "v:0",
      "-show_entries", "stream=width,height,r_frame_rate:format=duration",
      "-of", "json", video,
    ]),
  );
  const s = data.streams[0];
  const [n, d] = s.r_frame_rate.split("/").map(Number);
  return { width: s.width, height: s.height, fps: n / (d || 1), duration: Number(data.format.duration) };
}

// The block's frames are placed by time, so its key frame sits on the word however the video's fps differs.
export function placeOnVideo({ video, clip, out, start, duration, variant, info, speakerY, draft }) {
  if (info.height <= info.width) {
    throw new UsageError(`This pack is vertical. ${path.basename(video)} is ${info.width}x${info.height}.`);
  }
  const scale = info.width / 1080;
  const end = start + duration;
  const on = `between(t,${start.toFixed(4)},${end.toFixed(4)})`;
  const chain = [`[1:v]scale=iw*${scale}:ih*${scale}:flags=lanczos,format=yuva444p,setpts=PTS-STARTPTS+${start.toFixed(4)}/TB[blk]`];
  let base = "[0:v]";

  if (variant === "top" && speakerY !== undefined) {
    // A full-frame talking head: while the block is up, slide the chosen strip of the video into the bottom half.
    const h = Math.round(info.height / 2);
    const y = Math.round(Math.min(Math.max(speakerY * info.height - h / 2, 0), info.height - h));
    chain.push(`[0:v]split[v0][v1]`, `[v1]crop=${info.width}:${h}:0:${y}[strip]`);
    chain.push(`[v0][strip]overlay=0:${info.height - h}:enable='${on}':eof_action=pass[base]`);
    base = "[base]";
  }
  chain.push(`${base}[blk]overlay=0:0:format=auto:enable='${on}':eof_action=pass,format=yuv420p[v]`);

  fs.mkdirSync(path.dirname(out), { recursive: true });
  run("ffmpeg", [
    "-v", "error", "-y",
    "-i", video,
    "-i", clip,
    "-filter_complex", chain.join(";"),
    "-map", "[v]", "-map", "0:a?",
    "-c:v", "libx264", "-crf", draft ? "23" : "16", "-preset", draft ? "veryfast" : "medium",
    "-c:a", "copy",
    "-movflags", "+faststart",
    out,
  ]);
  return out;
}

export function contactSheet(video, out, times) {
  const info = probe(video);
  const picks = times ?? Array.from({ length: 12 }, (_, i) => ((i + 0.5) / 12) * info.duration);
  const tmp = fs.mkdtempSync(path.join(path.dirname(out), ".sheet-"));
  fs.mkdirSync(path.dirname(out), { recursive: true });
  try {
    picks.forEach((t, i) => {
      run("ffmpeg", [
        "-v", "error", "-y", "-ss", t.toFixed(3), "-i", video, "-frames:v", "1",
        "-vf", `scale=360:-2,drawtext=text='${t.toFixed(2)}s':x=8:y=8:fontsize=22:fontcolor=white:box=1:boxcolor=black@0.6`,
        path.join(tmp, `f${String(i).padStart(3, "0")}.png`),
      ]);
    });
    const cols = Math.min(6, picks.length);
    const rows = Math.ceil(picks.length / cols);
    run("ffmpeg", ["-v", "error", "-y", "-i", path.join(tmp, "f%03d.png"), "-vf", `tile=${cols}x${rows}:padding=6`, "-frames:v", "1", "-q:v", "3", out]);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  return out;
}
