"""Speaker cut-out with Robust Video Matting, for /vfx on a machine with an NVIDIA card.

  python rvm.py <in.mp4> <out.mov> --rvm <RVM checkout> --weights <rvm_resnet50.pth>

RVM itself is not part of this pack (it is GPL-3.0). `npm run setup -- --vfx --engine rvm` downloads it from its own
GitHub onto this machine and records where it went. Writes ProRes 4444 with alpha: the source pixels, the matte as
alpha, same size, rate and frame count as the input, so it lines up frame for frame.
"""
import argparse
import json
import queue
import subprocess
import sys
import threading

import numpy as np
import torch


def probe(path):
    s = json.loads(subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                                   "stream=width,height,r_frame_rate", "-of", "json", path],
                                  check=True, capture_output=True, text=True).stdout)["streams"][0]
    return s["width"], s["height"], s["r_frame_rate"]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("input")
    ap.add_argument("output")
    ap.add_argument("--rvm", required=True)
    ap.add_argument("--weights", required=True)
    ap.add_argument("--batch", type=int, default=8)
    a = ap.parse_args()
    if not torch.cuda.is_available():
        sys.exit("RVM needs an NVIDIA card with CUDA. Run: npm run setup -- --vfx --engine hyperframes")
    sys.path.insert(0, a.rvm)
    from model import MattingNetwork  # noqa: E402  (RVM's own code, from its checkout)

    w, h, fps = probe(a.input)
    ratio = min(1.0, 512 / max(w, h))  # RVM's recommended backbone size
    net = MattingNetwork("resnet50").eval().cuda()
    net.load_state_dict(torch.load(a.weights, map_location="cuda", weights_only=True))
    net = net.half()

    dec = subprocess.Popen(["ffmpeg", "-v", "error", "-i", a.input, "-fps_mode", "passthrough", "-f", "rawvideo",
                            "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
    # Only the matte comes from here; the colour stays the source's own YUV, so the cut-out matches the shot exactly.
    enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-i", a.input, "-f", "rawvideo", "-pix_fmt", "gray",
                            "-s", f"{w}x{h}", "-r", fps, "-i", "-", "-filter_complex", "[0:v][1:v]alphamerge",
                            "-c:v", "prores_ks", "-profile:v", "4444", "-pix_fmt", "yuva444p10le", a.output],
                           stdin=subprocess.PIPE)
    q = queue.Queue(maxsize=4)

    def writer():
        while (out := q.get()) is not None:
            enc.stdin.write(out.tobytes())

    wt = threading.Thread(target=writer)
    wt.start()
    size = w * h * 3
    rec = [None] * 4
    with torch.inference_mode():
        while True:
            buf = bytearray(dec.stdout.read(size * a.batch))
            k = len(buf) // size
            if k == 0:
                break
            src = np.frombuffer(buf, np.uint8, k * size).reshape(k, h, w, 3)
            x = torch.from_numpy(src).cuda().permute(0, 3, 1, 2).half().div(255).unsqueeze(0)
            _, pha, *rec = net(x, *rec, downsample_ratio=ratio)
            out = pha[0, :, 0].mul(255).round().byte().contiguous().cpu().numpy()
            q.put(out)
    q.put(None)
    wt.join()
    enc.stdin.close()
    enc.wait()
    dec.wait()


if __name__ == "__main__":
    main()
