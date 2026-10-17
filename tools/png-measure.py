#!/usr/bin/env python3
"""
Measure a reference picture instead of guessing at it.

主人给的参考图是一张 PNG（常常带透明棋盘格），我需要的不是「它大概长什么样」，
而是「墨占几个百分点、集中在哪个半径、有几条臂、圆点多大」。这些数字决定了
`SamplingSpiral` 该怎么重画，所以量一次比来回改十次便宜。

不需要 PIL：自己解 PNG（zlib + 反滤波），因为没有装 PIL 的解释器也能跑。

Usage:
    python3 tools/png-measure.py 参考图.png            # 墨量 / 径向分布 / 角向分布 / 颜色
    python3 tools/png-measure.py 参考图.png --deep      # 再加连通域：圆点尺寸、字块尺寸、臂的角向聚类
"""

import argparse
import math
import struct
import sys
import zlib
from collections import Counter


def load_png(path):
    """decode 8-bit RGB/RGBA PNG into (w, h, nch, bytes)"""
    data = open(path, "rb").read()
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        raise SystemExit("%s 不是 PNG" % path)
    i = 8
    idat = b""
    w = h = nch = None
    while i < len(data):
        length = struct.unpack(">I", data[i : i + 4])[0]
        kind = data[i + 4 : i + 8]
        body = data[i + 8 : i + 8 + length]
        i += 12 + length
        if kind == b"IHDR":
            w, h, depth, colour, _, _, _ = struct.unpack(">IIBBBBB", body)
            if depth != 8:
                raise SystemExit("只支持 8 位深，这张是 %d" % depth)
            nch = {0: 1, 2: 3, 3: 1, 4: 2, 6: 4}[colour]
        elif kind == b"IDAT":
            idat += body
        elif kind == b"IEND":
            break
    raw = zlib.decompress(idat)
    stride = w * nch
    out = bytearray(h * stride)
    prev = bytearray(stride)
    pos = 0
    for y in range(h):
        filt = raw[pos]
        pos += 1
        line = bytearray(raw[pos : pos + stride])
        pos += stride
        if filt == 1:
            for x in range(nch, stride):
                line[x] = (line[x] + line[x - nch]) & 255
        elif filt == 2:
            for x in range(stride):
                line[x] = (line[x] + prev[x]) & 255
        elif filt == 3:
            for x in range(stride):
                a = line[x - nch] if x >= nch else 0
                line[x] = (line[x] + ((a + prev[x]) >> 1)) & 255
        elif filt == 4:
            for x in range(stride):
                a = line[x - nch] if x >= nch else 0
                b = prev[x]
                c = prev[x - nch] if x >= nch else 0
                p = a + b - c
                pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                line[x] = (line[x] + pr) & 255
        out[y * stride : (y + 1) * stride] = line
        prev = line
    return w, h, nch, out


def ink_mask(w, h, nch, px):
    """把「有颜色的墨」和背景分开：棋盘格是灰的（r=g=b），墨是蓝／青的"""
    mask = bytearray(w * h)
    for y in range(h):
        row = y * w * nch
        for x in range(w):
            o = row + x * nch
            r, g, b = px[o], px[o + 1], px[o + 2]
            if nch == 4 and px[o + 3] < 40:
                continue
            if (b - r >= 25 and b >= 90) or (r + g + b < 330 and b >= r):
                mask[y * w + x] = 1
    return mask


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("path")
    ap.add_argument("--deep", action="store_true", help="连通域：圆点／字块／臂")
    args = ap.parse_args()

    w, h, nch, px = load_png(args.path)
    mask = ink_mask(w, h, nch, px)
    total = sum(mask)
    print("size %dx%d  ink %.2f%%" % (w, h, 100.0 * total / (w * h)))

    sx = sy = 0
    for y in range(h):
        for x in range(w):
            if mask[y * w + x]:
                sx += x
                sy += y
    cx, cy = sx / total, sy / total
    print("ink centroid (%.0f,%.0f)" % (cx, cy))

    print("\nradius   ink%   (from the ink centroid)")
    for r0 in range(0, 620, 40):
        c = n = 0
        for y in range(max(0, int(cy - r0 - 40)), min(h, int(cy + r0 + 40))):
            for x in range(max(0, int(cx - r0 - 40)), min(w, int(cx + r0 + 40))):
                if r0 <= math.hypot(x - cx, y - cy) < r0 + 40:
                    n += 1
                    c += mask[y * w + x]
        print("%5d  %5.1f  %s" % (r0, 100.0 * c / max(1, n), "#" * int(60 * c / max(1, n))))

    print("\nangle histogram, 24 bins of 15 deg")
    for R in (60, 120, 200, 280):
        bins = [0] * 24
        for y in range(h):
            for x in range(w):
                if not mask[y * w + x]:
                    continue
                dx, dy = x - cx, y - cy
                if abs(math.hypot(dx, dy) - R) < 20:
                    bins[int(((math.degrees(math.atan2(dy, dx)) + 360) % 360) // 15)] += 1
        print("r=%3d  %s" % (R, " ".join("%4d" % b for b in bins)))

    colours = Counter()
    for y in range(h):
        row = y * w * nch
        for x in range(w):
            if mask[y * w + x]:
                o = row + x * nch
                colours[(px[o] // 16 * 16, px[o + 1] // 16 * 16, px[o + 2] // 16 * 16)] += 1
    print("\ntop colours:", colours.most_common(6))

    if not args.deep:
        return

    label = [0] * (w * h)
    comps = []
    for y0 in range(h):
        for x0 in range(w):
            if not mask[y0 * w + x0] or label[y0 * w + x0]:
                continue
            index = len(comps) + 1
            stack = [(x0, y0)]
            label[y0 * w + x0] = index
            minx = maxx = x0
            miny = maxy = y0
            area = 0
            while stack:
                x, y = stack.pop()
                area += 1
                minx, maxx = min(minx, x), max(maxx, x)
                miny, maxy = min(miny, y), max(maxy, y)
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < w and 0 <= ny < h and mask[ny * w + nx] and not label[ny * w + nx]:
                        label[ny * w + nx] = index
                        stack.append((nx, ny))
            comps.append((area, minx, miny, maxx, maxy))
    print("\ncomponents: %d" % len(comps))
    dots, blocks = [], []
    for area, minx, miny, maxx, maxy in comps:
        bw, bh = maxx - minx + 1, maxy - miny + 1
        if area / (bw * bh) > 0.70 and 0.7 < bw / bh < 1.4:
            dots.append(bw)
        elif area < 400:
            blocks.append(bh)
    dots.sort()
    blocks.sort()
    if dots:
        print("drops: %d  diameters min/med/max = %d/%d/%d" % (
            len(dots), dots[0], dots[len(dots) // 2], dots[-1]))
    if blocks:
        print("character blocks: %d  bbox height p10/p50/p90 = %d/%d/%d" % (
            len(blocks), blocks[len(blocks) // 10], blocks[len(blocks) // 2],
            blocks[9 * len(blocks) // 10]))

    print("\nangular clusters of ink (how many arms)")
    for r0, r1 in ((200, 300), (300, 420), (420, 560)):
        angles = []
        for y in range(h):
            for x in range(w):
                if mask[y * w + x]:
                    d = math.hypot(x - cx, y - cy)
                    if r0 <= d < r1:
                        angles.append(math.degrees(math.atan2(y - cy, x - cx)) % 360)
        angles.sort()
        groups = []
        if angles:
            cur = [angles[0]]
            for a in angles[1:]:
                if a - cur[-1] <= 12:
                    cur.append(a)
                else:
                    groups.append(cur)
                    cur = [a]
            groups.append(cur)
            if len(groups) > 1 and groups[0][0] + 360 - groups[-1][-1] <= 12:
                groups[0] = groups[-1] + groups[0]
                groups.pop()
        print("annulus %d-%d: %d -> %s" % (r0, r1, len(groups), [int(sum(g) / len(g)) for g in groups]))


if __name__ == "__main__":
    sys.exit(main())
