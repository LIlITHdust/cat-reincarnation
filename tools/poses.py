#!/usr/bin/env python3
"""
Her, at a resolution that keeps her a rumour.

The film has a character reference, but it must not show a mascot: what appears
in the console is the outline of a small figure about forty cells wide, kept as
a projection: the drawing itself, kept at full detail, pushed into the film's two
tones and given one bright edge, the way something being rendered rather than
something being shown.

Sources live in public/gen/poses (made with tools/seedream.py from the
character reference); the output is public/char/pose-N.png.

Usage: python3 tools/poses.py [source-dir]
"""

import glob
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".pylibs"))

from PIL import Image, ImageFilter, ImageOps  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "char")
COLS = 200

ICE = (168, 224, 255)
DEEP = (14, 30, 48)


def cutout(image: Image.Image) -> Image.Image:
    """Flood the white background away from the edges."""
    rgb = image.convert("RGB")
    w, h = rgb.size
    px = rgb.load()
    seen = bytearray(w * h)
    stack = []
    for x in range(w):
        stack.append((x, 0))
        stack.append((x, h - 1))
    for y in range(h):
        stack.append((0, y))
        stack.append((w - 1, y))
    while stack:
        x, y = stack.pop()
        if x < 0 or y < 0 or x >= w or y >= h:
            continue
        i = y * w + x
        if seen[i]:
            continue
        r, g, b = px[x, y]
        if r + g + b < 690:
            continue
        seen[i] = 1
        stack.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))
    return Image.frombytes(
        "L", (w, h), bytes(255 if not seen[i] else 0 for i in range(w * h))
    )


def render(source: str) -> Image.Image:
    image = ImageOps.exif_transpose(Image.open(source).convert("RGB"))
    mask = cutout(image)
    box = mask.getbbox()
    if box:
        image = image.crop(box)
        mask = mask.crop(box)
    rows = max(8, int(round(COLS * mask.height / mask.width)))
    small = mask.resize((COLS, rows), Image.LANCZOS)
    drawn = image.resize((COLS, rows), Image.LANCZOS)
    edge = small.filter(ImageFilter.MaxFilter(3))
    m = small.load()
    e = edge.load()
    d = drawn.load()
    out = Image.new("RGBA", (COLS, rows))
    o = out.load()
    for y in range(rows):
        for x in range(COLS):
            inside = m[x, y]
            if inside < 8:
                if e[x, y] < 8:
                    o[x, y] = (0, 0, 0, 0)
                else:
                    o[x, y] = (ICE[0], ICE[1], ICE[2], min(220, int(e[x, y] * 0.9)))
                continue
            # the drawing itself, mapped into ice and lavender: the light parts
            # of her stay light, the linework stays dark, the hue is hers
            r, g, b = d[x, y]
            lum = ((0.299 * r + 0.587 * g + 0.114 * b) / 255) ** 0.85
            o[x, y] = (
                int(16 + lum * 210),
                int(30 + lum * 208),
                int(56 + lum * 198),
                int(inside * (0.5 + lum * 0.5)),
            )
    return out


def main() -> int:
    src = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "public", "gen", "poses")
    os.makedirs(OUT, exist_ok=True)
    files = sorted(glob.glob(os.path.join(src, "*.png")))
    for i, path in enumerate(files, start=1):
        img = render(path)
        big = img.resize((img.width * 6, img.height * 6), Image.NEAREST)
        big = big.filter(ImageFilter.GaussianBlur(0.5))
        target = os.path.join(OUT, f"pose-{i}.png")
        big.save(target)
        print(f"  pose-{i}  {big.size[0]}x{big.size[1]}  {os.path.getsize(target) // 1024} KB")
    print(f"wrote {len(files)} poses")
    return 0


if __name__ == "__main__":
    sys.exit(main())
