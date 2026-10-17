#!/usr/bin/env python3
"""
The daily scenes, rendered the way she would render them.

Photographs of ordinary things — a piano, rain on glass, a late shop, a train
window, a sea at dusk — are not used as photographs. They are crushed down to a
small grid of cells, mapped onto the film's own palette, and dithered, so what
appears in the middle of the console is a memory of a place at about the
resolution she would have of it.

Sources and licences are recorded in public/scenes/CREDITS.md.

Usage: python3 tools/scenes.py [source-dir]
"""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".pylibs"))

from PIL import Image, ImageFilter, ImageOps  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "scenes")
COLS = 60

# near black → deep water → ice → white, and one warm ramp for his side
COOL = [(3, 5, 10), (13, 32, 52), (36, 84, 126), (124, 186, 226), (232, 246, 255)]
WARM = [(6, 4, 8), (48, 24, 18), (120, 62, 32), (206, 132, 74), (255, 226, 190)]

# a 4x4 Bayer matrix: what makes it read as a screen instead of a photograph
BAYER = [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5],
]


def ramp(value: float, stops):
    value = max(0.0, min(1.0, value))
    span = 1.0 / (len(stops) - 1)
    i = min(len(stops) - 2, int(value / span))
    t = (value - i * span) / span
    a, b = stops[i], stops[i + 1]
    return tuple(round(a[k] + (b[k] - a[k]) * t) for k in range(3))


def render(path: str, stops, gain: float = 1.0) -> Image.Image:
    image = ImageOps.exif_transpose(Image.open(path).convert("RGB"))
    w, h = image.size
    if w / h > 16 / 9:
        new_w = int(h * 16 / 9)
        image = image.crop(((w - new_w) // 2, 0, (w - new_w) // 2 + new_w, h))
    else:
        new_h = int(w * 9 / 16)
        image = image.crop((0, (h - new_h) // 2, w, (h - new_h) // 2 + new_h))
    rows = int(round(COLS * 9 / 16))
    small = ImageOps.autocontrast(image.resize((COLS, rows), Image.LANCZOS), cutoff=1)
    px = small.load()
    out = Image.new("RGB", (COLS, rows))
    o = out.load()
    for y in range(rows):
        for x in range(COLS):
            r, g, b = px[x, y]
            value = (0.299 * r + 0.587 * g + 0.114 * b) / 255 * gain
            value = value ** 0.85
            value += (BAYER[y % 4][x % 4] / 16 - 0.47) * 0.055
            o[x, y] = ramp(value, stops)
    return out


# the generated set, in the order the prompt file lists them
NAMES = {
    "seedream-20261016-095828-1": ("piano", COOL, 1.0),
    "seedream-20261016-095828-2": ("window", COOL, 1.0),
    "seedream-20261016-095828-3": ("store", WARM, 1.0),
    "seedream-20261016-095828-4": ("train", COOL, 1.0),
    "seedream-20261016-095828-5": ("sea", COOL, 1.0),
    "seedream-20261016-095828-6": ("desk", WARM, 1.05),
    "seedream-20261016-095828-7": ("boat", WARM, 1.0),
    "seedream-20261016-095828-8": ("rain", COOL, 1.0),
}


def main() -> int:
    src = sys.argv[1] if len(sys.argv) > 1 else "public/gen/scenes"
    os.makedirs(OUT, exist_ok=True)
    written = []
    for stem, (name, stops, gain) in NAMES.items():
        path = os.path.join(src, stem + ".png")
        if not os.path.exists(path):
            continue
        img = render(path, stops, gain)
        big = img.resize((COLS * 8, img.height * 8), Image.NEAREST)
        # then blurred, so a place reads as something remembered rather than
        # something photographed
        big = big.filter(ImageFilter.GaussianBlur(2.6))
        target = os.path.join(OUT, name + ".png")
        big.save(target)
        written.append((name, big.size, os.path.getsize(target) // 1024))
    for name, size, kb in written:
        print(f"  {name:<8} {size[0]}x{size[1]}  {kb} KB")
    print(f"wrote {len(written)} scenes to {OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
