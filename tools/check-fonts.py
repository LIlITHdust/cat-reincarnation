#!/usr/bin/env python3
"""
Has the font subset gone stale?

Every piece of copy in the film is drawn with a subset font built from the
characters found in src/. Add a line of dialogue and forget to re-run
tools/build-fonts.py, and that line silently renders in a fallback face —
which looks close enough that you notice it three scenes later, or not at all.

This compares what src/ uses now against what public/fonts actually contains.
Exit code 1 means: run tools/build-fonts.py.
"""

import importlib.util
import os
import sys

from fontTools.ttLib import TTFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "fonts")


def load_builder():
    spec = importlib.util.spec_from_file_location(
        "build_fonts", os.path.join(ROOT, "tools", "build-fonts.py")
    )
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def main() -> int:
    builder = load_builder()
    wanted = set(builder.collect_characters())
    # emoji are drawn by the system's emoji face on purpose — she is allowed to
    # send one the way a person would
    wanted = {c for c in wanted if not (0x1F000 <= ord(c) <= 0x1FAFF or 0x2600 <= ord(c) <= 0x27BF)}

    # a character is fine as long as *some* loaded face can draw it. The Latin
    # families only carry ASCII; Noto Sans SC is what every Chinese glyph in the
    # interface is expected to come from, and the Japanese serif only has to
    # cover the lyric sheet.
    cmaps: dict[str, set] = {}
    for name in sorted(os.listdir(OUT)):
        if not name.endswith(".woff2"):
            continue
        cmaps[name] = set(TTFont(os.path.join(OUT, name)).getBestCmap())

    def covered(char: str, families: list[str]) -> bool:
        return any(
            ord(char) in cmaps[name] for name in cmaps if any(f in name for f in families)
        )

    uncovered = sorted(c for c in wanted if not covered(c, list(cmaps)))

    if not uncovered:
        print(f"fonts ok · {len(wanted)} characters in use, all present")
        return 0

    print(f"no face can draw: {''.join(uncovered)}")
    print("\nthe subsets are stale — run: python3 tools/build-fonts.py")
    return 1


if __name__ == "__main__":
    sys.exit(main())
