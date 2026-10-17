#!/usr/bin/env python3
"""
My eyes.

Looking at a film one frame at a time costs a render each and a great deal of
attention; looking at sixteen frames in one small picture costs one call and
shows the rhythm. This renders a spread of frames from a composition and lays
them out in a grid, so a change can be judged across the whole length of the
piece instead of at the moment it was written.

Usage:
    python3 tools/sheet.py                          # 16 frames of the film
    python3 tools/sheet.py --at 60,80,100           # specific seconds
    python3 tools/sheet.py --count 24 --scale 0.28  # more, smaller
    python3 tools/sheet.py --comp ParticleCore --count 12
"""

import argparse
import os
import subprocess
import sys
import tempfile

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".pylibs"))

from PIL import Image, ImageDraw, ImageFont  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FPS = 30


def label_font(size: int):
    for path in (
        "/System/Library/Fonts/Menlo.ttc",
        "/System/Library/Fonts/SFNSMono.ttf",
        "/Library/Fonts/Arial.ttf",
    ):
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            continue
    return ImageFont.load_default()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--comp", default="CatReincarnation")
    parser.add_argument("--count", type=int, default=16)
    parser.add_argument("--at", default="", help="comma separated seconds")
    parser.add_argument("--scale", type=float, default=0.3)
    parser.add_argument("--cols", type=int, default=4)
    parser.add_argument("--quality", type=int, default=72)
    parser.add_argument("--out", default="/tmp/sheet.jpg")
    parser.add_argument("--duration", type=float, default=168.0)
    args = parser.parse_args()

    if args.at:
        seconds = [float(s) for s in args.at.split(",") if s.strip()]
    else:
        step = args.duration / args.count
        seconds = [round(i * step + step / 2, 1) for i in range(args.count)]
    frames = [int(round(s * FPS)) for s in seconds]

    tmp = tempfile.mkdtemp(prefix="frames-")
    shots = []
    for frame in frames:
        path = os.path.join(tmp, f"{frame}.jpg")
        result = subprocess.run(
            [
                "npx",
                "remotion",
                "still",
                args.comp,
                path,
                f"--frame={frame}",
                f"--scale={args.scale}",
                "--image-format=jpeg",
                f"--jpeg-quality={args.quality}",
            ],
            cwd=ROOT,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.PIPE,
        )
        if result.returncode != 0 or not os.path.exists(path):
            print(f"  frame {frame} failed: {result.stderr.decode()[-200:]}")
            continue
        shots.append((frame, Image.open(path).convert("RGB")))

    if not shots:
        print("nothing rendered")
        return 1

    width, height = shots[0][1].size
    cols = args.cols
    rows = (len(shots) + cols - 1) // cols
    pad = 3
    sheet = Image.new(
        "RGB",
        (cols * (width + pad) + pad, rows * (height + pad + 14) + pad),
        (10, 12, 16),
    )
    draw = ImageDraw.Draw(sheet)
    font = label_font(12)
    for index, (frame, image) in enumerate(shots):
        x = pad + (index % cols) * (width + pad)
        y = pad + (index // cols) * (height + pad + 14)
        sheet.paste(image, (x, y))
        draw.text((x + 2, y + height + 2), f"{frame / FPS:6.1f}s", font=font, fill=(150, 190, 225))
    sheet.save(args.out, quality=args.quality + 4)
    print(f"{args.out}  {sheet.size[0]}x{sheet.size[1]}  {len(shots)} frames")
    return 0


if __name__ == "__main__":
    sys.exit(main())
