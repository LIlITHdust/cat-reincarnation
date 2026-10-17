#!/usr/bin/env python3
"""
The conversation, out of the code and back into it.

主人要人工微调台词，但不想动结构。这个脚本把 `src/data/session.ts` 里的 `MESSAGES`
导出成一行一条的纯文本，**只把正文留给人改**：

    001 |  0.90 | him  | 4/12 21:04   | 你好
    002 |  1.60 | mono |              | 新的对话。\\n新的输入。

`import` 把同一份文本读回来，按序号替换**正文**，时间、说话人、气泡上的钟点原样保留，
再重写 `MESSAGES` 数组（文件其它部分一个字都不动）。

Usage:
    python3 tools/dialogue.py export 预览/对话文本-供微调.txt
    python3 tools/dialogue.py import 预览/对话文本-供微调.txt
"""

import argparse
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SESSION = os.path.join(ROOT, "src", "data", "session.ts")

# { t: 0.90, from: "him", text: "你好", time: "4/12 21:04" }
ENTRY = re.compile(
    r'\{\s*t:\s*([\d.]+),\s*from:\s*"(\w+)",\s*text:\s*"((?:[^"\\]|\\.)*)"'
    r'(?:,\s*time:\s*"((?:[^"\\]|\\.)*)")?\s*\}'
)


def parse():
    src = open(SESSION, encoding="utf-8").read()
    start = src.index("export const MESSAGES: Msg[] = [")
    end = src.index("\n];", start)
    rows = []
    for m in ENTRY.finditer(src[start:end]):
        rows.append(
            {
                "t": m.group(1),
                "from": m.group(2),
                "text": m.group(3),
                "time": m.group(4) or "",
            }
        )
    return src, start, end, rows


def sanitise(text):
    """
    The text comes back in the file's own escaping — a line break is already
    written `\\n` on the line, so it must not be escaped twice. Only a bare
    quote needs a backslash before it.
    """
    return text.replace('"', '\\"')


def export(path):
    _, _, _, rows = parse()
    head = [
        "# cat reincarnation · 对话文本（供人工微调）",
        "# 只改最后一列（正文）。前面四列是结构：序号 | 入场秒 | 角色 | 气泡上的钟点。",
        "# 角色：him = 他（用户）／her = 她（AI 对外回复）／mono = 她的内心／proc、sys = 系统的过程行。",
        "# 换行写 \\n，例如：新的对话。\\n新的输入。",
        "# 改完发回来，我这样写回代码（时间轴、结构都不会动）：",
        "#   python3 tools/dialogue.py import 预览/对话文本-供微调.txt",
        "",
    ]
    body = []
    for i, row in enumerate(rows, 1):
        body.append(
            "%03d | %5s | %-4s | %-12s | %s"
            % (i, row["t"], row["from"], row["time"], row["text"])
        )
    open(path, "w", encoding="utf-8").write("\n".join(head + body) + "\n")
    print("%d 条 -> %s" % (len(rows), path))
    return 0


def apply_import(path):
    src, start, end, rows = parse()
    edited = []
    for line in open(path, encoding="utf-8"):
        line = line.rstrip("\n")
        # only numbered rows are messages: the title and the column header of a
        # hand-edited file are not entries
        if not re.match(r"^\s*\d{3}\s*\|", line):
            continue
        parts = line.split(" | ", 4)
        if len(parts) < 5:
            print("跳过看不懂的一行：%s" % line[:60])
            continue
        edited.append((parts[3].strip(), parts[4]))
    if len(edited) != len(rows):
        print("条数对不上：文本 %d 条、代码 %d 条，先不写回" % (len(edited), len(rows)))
        return 1
    out = ["export const MESSAGES: Msg[] = ["]
    for row, (clock, text) in zip(rows, edited):
        field = '  { t: %s, from: "%s", text: "%s"' % (row["t"], row["from"], sanitise(text))
        # 钟点也照文本走：主人会顺手把它改成同一天里往后走的时间
        if clock:
            field += ', time: "%s"' % clock
        out.append(field + " },")
    open(SESSION, "w", encoding="utf-8").write(src[:start] + "\n".join(out) + src[end:])
    print("写回 %d 条 -> %s" % (len(edited), SESSION))
    return 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("mode", choices=["export", "import"])
    ap.add_argument("path")
    args = ap.parse_args()
    return export(args.path) if args.mode == "export" else apply_import(args.path)


if __name__ == "__main__":
    sys.exit(main())
