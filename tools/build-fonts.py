#!/usr/bin/env python3
"""
Collect every character used anywhere in src/, download the three families the
film needs from Google Fonts, cut each one down to that character set and write
the result into public/fonts/ as woff2.

Loading the full Noto families from fonts.gstatic.com at render time costs
~900 requests per browser tab, which makes rendering unusable. Subsetting makes
it a single small file per weight, loaded from disk.

Re-run this after adding or changing any on-screen text.
"""

import io
import os
import re
import sys
import urllib.request

from fontTools.subset import Options, Subsetter
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "src")
OUT = os.path.join(ROOT, "public", "fonts")
CACHE = os.path.join(ROOT, "tools", ".font-cache")

RAW = "https://raw.githubusercontent.com/google/fonts/main/ofl"

# (output stem, source file, url, weights)
FAMILIES = [
    (
        "ShipporiMinchoB1",
        "ShipporiMinchoB1-Regular.ttf",
        f"{RAW}/shipporiminchob1/ShipporiMinchoB1-Regular.ttf",
        [400],
    ),
    (
        "ShipporiMinchoB1",
        "ShipporiMinchoB1-Bold.ttf",
        f"{RAW}/shipporiminchob1/ShipporiMinchoB1-Bold.ttf",
        [700],
    ),
    (
        "NotoSansSC",
        "NotoSansSC[wght].ttf",
        f"{RAW}/notosanssc/NotoSansSC%5Bwght%5D.ttf",
        [300, 400, 500],
    ),
    (
        "NotoSerifSC",
        "NotoSerifSC[wght].ttf",
        f"{RAW}/notoserifsc/NotoSerifSC%5Bwght%5D.ttf",
        [300, 400],
    ),
    (
        "CormorantGaramond",
        "CormorantGaramond[wght].ttf",
        f"{RAW}/cormorantgaramond/CormorantGaramond%5Bwght%5D.ttf",
        [300, 400],
    ),
    (
        "JetBrainsMono",
        "JetBrainsMono[wght].ttf",
        f"{RAW}/jetbrainsmono/JetBrainsMono%5Bwght%5D.ttf",
        [400],
    ),
]

# Always keep the basics so punctuation and digits never fall back.
BASE = (
    "".join(chr(c) for c in range(0x20, 0x7F))
    + "　、。，．・：；？！ー―‐〜「」『』（）〔〕［］｛｝…″′♪♭→←↑↓×÷±"
    + "→——‥※′″〇一二三四五六七八九十"
)


def collect_characters() -> str:
    chars = set(BASE)
    for folder, _dirs, files in os.walk(SRC):
        for name in files:
            if not name.endswith((".ts", ".tsx")):
                continue
            with open(os.path.join(folder, name), encoding="utf-8") as handle:
                text = handle.read()
            # only characters that actually reach the screen: those inside string
            # literals, which is where every piece of on-screen copy lives
            for literal in re.findall(r'"((?:[^"\\]|\\.)*)"', text):
                chars.update(literal)
            for literal in re.findall(r"'((?:[^'\\]|\\.)*)'", text):
                chars.update(literal)
            for literal in re.findall(r"`((?:[^`\\]|\\.)*)`", text):
                chars.update(literal)
    chars = {c for c in chars if c.isprintable()}
    return "".join(sorted(chars))


def download(url: str, filename: str) -> bytes:
    os.makedirs(CACHE, exist_ok=True)
    path = os.path.join(CACHE, filename)
    if os.path.exists(path) and os.path.getsize(path) > 1000:
        with open(path, "rb") as handle:
            return handle.read()
    print(f"  downloading {filename} ...")
    with urllib.request.urlopen(url, timeout=600) as response:
        data = response.read()
    with open(path, "wb") as handle:
        handle.write(data)
    return data


def subset(data: bytes, characters: str, weight: int) -> bytes:
    font = TTFont(io.BytesIO(data))
    options = Options()
    options.layout_features = ["*"]
    options.name_IDs = ["*"]
    options.name_legacy = True
    options.notdef_outline = True
    options.recalc_bounds = True
    options.drop_tables += ["DSIG"]
    subsetter = Subsetter(options=options)
    subsetter.populate(text=characters)
    subsetter.subset(font)
    # instance after subsetting: the glyph set is tiny by now, so pinning the
    # weight axis costs almost nothing
    if "fvar" in font:
        axes = {axis.axisTag for axis in font["fvar"].axes}
        if "wght" in axes:
            instantiateVariableFont(font, {"wght": weight}, inplace=True)
    font.flavor = "woff2"
    buffer = io.BytesIO()
    font.save(buffer)
    return buffer.getvalue()


def main() -> int:
    characters = collect_characters()
    print(f"character set: {len(characters)} glyphs")
    os.makedirs(OUT, exist_ok=True)

    written = []
    for file_stem, source_name, url, weights in FAMILIES:
        data = download(url, source_name)
        for weight in weights:
            payload = subset(data, characters, weight)
            name = f"{file_stem}-{weight}.woff2"
            path = os.path.join(OUT, name)
            with open(path, "wb") as handle:
                handle.write(payload)
            written.append((name, len(payload)))
            print(f"  {name}  {len(payload) / 1024:.1f} KB")

    print("\n".join(f"{n} {s}b" for n, s in written))
    return 0


if __name__ == "__main__":
    sys.exit(main())
