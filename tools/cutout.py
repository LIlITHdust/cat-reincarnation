#!/usr/bin/env python3
"""Lift an illustration off its flat white page and save it as RGBA PNGs.

Pillow lives in tools/.pylibs (installed there so the system interpreter is
left alone); numpy does the matting.

The matte is an *edge-connected* flood fill rather than a colour key: the
background of the artwork is one connected sheet of near-white, while her
apron, ruffles and socks are white too and would be destroyed by a plain key.

Usage:  python3 tools/cutout.py IN.jpg OUTDIR
"""

import sys
from collections import deque
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).with_name(".pylibs")))

from PIL import Image  # noqa: E402


def decode(path: Path) -> np.ndarray:
    return np.asarray(Image.open(path).convert("RGBA"), dtype=np.uint8).copy()


def encode(img: np.ndarray, path: Path) -> None:
    Image.fromarray(img, "RGBA").save(path)


def connected_background(seedable: np.ndarray) -> np.ndarray:
    """Flood fill `seedable` from every border pixel that is itself seedable."""
    h, w = seedable.shape
    flat = seedable.reshape(-1)
    seen = np.zeros(h * w, dtype=bool)
    stack: deque[int] = deque()
    for x in range(w):
        for i in (x, (h - 1) * w + x):
            if flat[i] and not seen[i]:
                seen[i] = True
                stack.append(i)
    for y in range(h):
        for i in (y * w, y * w + w - 1):
            if flat[i] and not seen[i]:
                seen[i] = True
                stack.append(i)
    while stack:
        i = stack.pop()
        x = i % w
        y = i // w
        if x > 0 and flat[i - 1] and not seen[i - 1]:
            seen[i - 1] = True
            stack.append(i - 1)
        if x < w - 1 and flat[i + 1] and not seen[i + 1]:
            seen[i + 1] = True
            stack.append(i + 1)
        if y > 0 and flat[i - w] and not seen[i - w]:
            seen[i - w] = True
            stack.append(i - w)
        if y < h - 1 and flat[i + w] and not seen[i + w]:
            seen[i + w] = True
            stack.append(i + w)
    return seen.reshape(h, w)


def box_blur(mask: np.ndarray, radius: int) -> np.ndarray:
    """Cheap separable box blur, good enough for feathering a matte."""
    if radius <= 0:
        return mask
    k = radius * 2 + 1
    pad = np.pad(mask, radius, mode="edge")
    c = np.cumsum(pad, axis=0)
    c = np.vstack([np.zeros((1, c.shape[1])), c])
    out = (c[k:] - c[:-k]) / k
    c = np.cumsum(out, axis=1)
    c = np.hstack([np.zeros((c.shape[0], 1)), c])
    out = (c[:, k:] - c[:, :-k]) / k
    return out


def lift(path: Path) -> np.ndarray:
    img = decode(path).astype(np.float32)

    mn = img[..., :3].min(axis=2)
    # the sheet of paper: near-white and (just as importantly) connected to
    # the edge of the frame, so her apron and ruffles survive
    paper = mn >= 224
    background = connected_background(paper)

    # the soft drop shadow under the drawing is a wide grey gradient; it is
    # connected to the background through the mid-greys, so grow the fill
    # through anything that is still very light and very unsaturated
    mx = img[..., :3].max(axis=2)
    shadowish = (mn >= 150) & ((mx - mn) <= 26)
    grow = connected_background(shadowish | paper)
    alpha = np.where(grow & (mn >= 150), 0.0, 1.0)
    # never let the fill eat into the dark linework
    alpha = np.where(mn < 120, 1.0, alpha)

    alpha = box_blur(alpha, 1)
    alpha = np.clip((alpha - 0.30) / 0.62, 0, 1)

    # un-premultiply the anti-aliased rim: it was blended against white, which
    # would otherwise leave a pale halo once she stands on black
    a = alpha[..., None]
    safe = np.where(a < 0.02, 1.0, a)
    fg = np.where(a > 0.02, (img[..., :3] - (1 - a) * 255.0) / safe, img[..., :3])
    fg = np.clip(fg, 0, 255)

    out = np.concatenate([fg, alpha[..., None] * 255.0], axis=2)
    return out.astype(np.uint8)


CURVE = [
    (0.00, (6, 16, 38)),
    (0.24, (24, 66, 116)),
    (0.48, (86, 168, 224)),
    (0.72, (176, 224, 250)),
    (0.90, (232, 246, 255)),
    (1.00, (255, 255, 255)),
]


def to_light(rgba: np.ndarray) -> np.ndarray:
    """Re-light her as ice: keep the drawing, throw away its palette."""
    rgb = rgba[..., :3].astype(np.float32) / 255.0
    lum = (rgb * np.array([0.30, 0.59, 0.11])).sum(axis=2)
    lum = np.clip((lum - 0.035) / 0.86, 0, 1) ** 0.92
    stops = np.array([c for _, c in CURVE], dtype=np.float32)
    pos = np.array([p for p, _ in CURVE], dtype=np.float32)
    out = np.stack(
        [np.interp(lum, pos, stops[:, i]) for i in range(3)], axis=2
    )
    return np.concatenate([out, rgba[..., 3:]], axis=2).astype(np.uint8)


def to_deep(rgba: np.ndarray, gamma: float = 1.34) -> np.ndarray:
    """The same light, held back: her large pale areas stop shouting, so the
    edge and the highlights carry her instead of the apron."""
    rgb = rgba[..., :3].astype(np.float32) / 255.0
    lum = (rgb * np.array([0.30, 0.59, 0.11])).sum(axis=2)
    lum = np.clip((lum - 0.035) / 0.86, 0, 1)
    lum = np.clip(lum**gamma, 0, 1)
    # a colder curve that never reaches paper white: she is light, not ink
    deep = [
        (0.00, (4, 10, 26)),
        (0.30, (14, 40, 74)),
        (0.55, (40, 98, 154)),
        (0.75, (92, 160, 208)),
        (0.90, (150, 202, 236)),
        (1.00, (214, 236, 252)),
    ]
    stops = np.array([c for _, c in deep], dtype=np.float32)
    pos = np.array([p for p, _ in deep], dtype=np.float32)
    out = np.stack([np.interp(lum, pos, stops[:, i]) for i in range(3)], axis=2)
    return np.concatenate([out, rgba[..., 3:]], axis=2).astype(np.uint8)


def to_projection(rgba: np.ndarray) -> np.ndarray:
    """Her, as something being projected: lit, then broken by scan lines."""
    h = rgba.shape[0]
    light = to_light(rgba).astype(np.float32)
    rows = np.arange(h)[:, None, None]
    # every fourth line of her is simply missing, the way a projection misses
    line = np.where((rows % 4) == 3, 0.52, 1.0)
    light[..., :3] *= line
    out = light.copy()
    out[..., 3] = rgba[..., 3] * 0.94
    return np.clip(out, 0, 255).astype(np.uint8)


def to_pixels(rgba: np.ndarray, factor: int = 6) -> np.ndarray:
    """The same drawing, seen through a coarse raster — for the moments when
    part of her reads as data rather than as a body."""
    im = Image.fromarray(rgba, "RGBA")
    small = im.resize(
        (max(1, im.width // factor), max(1, im.height // factor)), Image.BILINEAR
    )
    return np.asarray(
        small.resize(im.size, Image.NEAREST), dtype=np.uint8
    ).copy()


def main() -> None:
    src = Path(sys.argv[1])
    outdir = Path(sys.argv[2])
    outdir.mkdir(parents=True, exist_ok=True)
    cut = lift(src)
    encode(cut, outdir / "girl.png")
    encode(to_light(cut), outdir / "girl-light.png")
    encode(to_deep(cut), outdir / "girl-light-deep.png")
    encode(to_projection(cut), outdir / "girl-light-scan.png")
    encode(to_pixels(to_light(cut)), outdir / "girl-light-pixels.png")
    opaque = (cut[..., 3] > 8).mean()
    print(f"{outdir/'girl.png'}  {cut.shape[1]}x{cut.shape[0]}  ink {opaque:.1%}")


if __name__ == "__main__":
    main()
