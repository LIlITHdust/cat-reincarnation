#!/usr/bin/env python3
"""
Image generation through the Seedream API.

The film needs drawings of her in poses the one reference illustration does not
have — her back at the console, her standing up in the water, the moment she is
deleted. This is how those get made: text to image, and image to image with the
reference sheet kept as an input.

The key never lives in the repository. Every setting resolves in this order:

    command line flag  >  environment variable  >  ~/.config/seedream/env  >  <repo>/.env

So one file, written once, is enough:

    mkdir -p ~/.config/seedream
    printf 'SEEDREAM_API_KEY=%s\\n' '<key>' > ~/.config/seedream/env
    chmod 600 ~/.config/seedream/env

Usage:

    python3 tools/seedream.py check
    python3 tools/seedream.py generate "prompt" -o public/gen/console.png --size 2K
    python3 tools/seedream.py generate "prompt" --ref public/char/girl.png
    python3 tools/seedream.py generate "prompt" -n 4            # four connected frames
    python3 tools/seedream.py generate --prompt-file prompts.txt --outdir public/gen

Defaults point at Volcengine Ark (the official seller), where the account has
`doubao-seedream-5-0-flash-260915` activated; the 4.x models are retired or not
open on it. Anything else — a reseller, a proxy, a self-hosted gateway — works
too through
`SEEDREAM_BASE_URL` and `SEEDREAM_MODEL`, as long as it speaks the same
`POST {base}/images/generations` shape.

Pillow — already vendored in `tools/.pylibs` for the other tools — is used only
to put transparent references on white before they are sent. Everything else is
standard library: no requests, no SDK, nothing to install.
"""

import argparse
import base64
import io
import json
import mimetypes
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

sys.path.insert(0, str(Path(__file__).resolve().parent / ".pylibs"))
try:
    from PIL import Image  # only for flattening transparent references
except ImportError:
    Image = None

DEFAULT_BASE_URL = "https://ark.cn-beijing.volces.com/api/v3"
DEFAULT_MODEL = "doubao-seedream-5-0-flash-260915"

CONFIG_KEYS = ("SEEDREAM_API_KEY", "SEEDREAM_BASE_URL", "SEEDREAM_MODEL")

KEY_HELP = (
    "找不到 API key。请先写入一次（之后所有项目都能用）：\n"
    "  mkdir -p ~/.config/seedream\n"
    "  printf 'SEEDREAM_API_KEY=%s\\n' '<你的key>' > ~/.config/seedream/env\n"
    "  chmod 600 ~/.config/seedream/env\n"
    "或者临时用环境变量：export SEEDREAM_API_KEY=<你的key>"
)

# The two failures that are about the account rather than about the request.
# Both live in the console, so the least the tool can do is say where.
ACCOUNT_HINTS = (
    (
        "Safe Experience Mode",
        "这个模型还在「安全体验模式」下，免费额度已用完。"
        "去火山方舟控制台 →「开通管理」→ 找到这个模型 → 关闭「安全体验模式」，之后按量计费。",
    ),
    (
        "ModelNotOpen",
        "这个模型在账号里还没开通。去火山方舟控制台 →「开通管理」开通它，或换一个已开通的型号。",
    ),
)


def account_hint(body) -> str:
    """The whole error body, searched, because the useful phrase sits in `message`."""
    text = json.dumps(body, ensure_ascii=False)
    for needle, hint in ACCOUNT_HINTS:
        if needle in text:
            return hint
    return ""


def read_env_file(path: Path) -> dict:
    """Parse a KEY=VALUE file, ignoring blanks and comments."""
    values = {}
    try:
        text = path.read_text(encoding="utf-8")
    except OSError:
        return values
    for line in text.splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        name, _, value = line.partition("=")
        name = name.strip()
        if name.startswith("export "):
            name = name[len("export ") :].strip()
        values[name] = value.strip().strip("'\"")
    return values


def load_settings(args) -> dict:
    """Resolve every setting, with the command line winning over everything."""
    sources = []
    override = os.environ.get("SEEDREAM_ENV")
    if override:
        sources.append(Path(override).expanduser())
    sources.append(Path.home() / ".config" / "seedream" / "env")
    sources.append(ROOT / ".env")

    settings = {}
    for source in reversed(sources):  # earlier files win, so apply the last first
        for name, value in read_env_file(source).items():
            if name in CONFIG_KEYS:
                settings[name] = value

    for name in CONFIG_KEYS:
        if os.environ.get(name):
            settings[name] = os.environ[name]

    if getattr(args, "api_key", None):
        settings["SEEDREAM_API_KEY"] = args.api_key
    if getattr(args, "base_url", None):
        settings["SEEDREAM_BASE_URL"] = args.base_url
    if getattr(args, "model", None):
        settings["SEEDREAM_MODEL"] = args.model

    settings.setdefault("SEEDREAM_BASE_URL", DEFAULT_BASE_URL)
    settings.setdefault("SEEDREAM_MODEL", DEFAULT_MODEL)
    return settings


def post(settings: dict, payload: dict, timeout: int = 300):
    """One call to {base}/images/generations. Returns (status, body-as-json)."""
    url = settings["SEEDREAM_BASE_URL"].rstrip("/") + "/images/generations"
    body = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        url,
        data=body,
        headers={
            "Authorization": "Bearer " + settings["SEEDREAM_API_KEY"],
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            return response.status, json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        raw = error.read().decode("utf-8", "replace")
        try:
            return error.code, json.loads(raw)
        except json.JSONDecodeError:
            return error.code, {"raw": raw}


def error_text(body) -> str:
    """Pull the human-readable part out of an error body, whatever its shape."""
    if isinstance(body, dict):
        detail = body.get("error", body)
        if isinstance(detail, dict):
            return str(detail.get("message") or detail.get("code") or detail)
        return str(detail)
    return str(body)


def error_code(body) -> str:
    """The machine-readable half of the same error — this is what we branch on."""
    if isinstance(body, dict) and isinstance(body.get("error"), dict):
        return str(body["error"].get("code") or "")
    return ""


def seedream_catalog(settings: dict) -> list:
    """Every Seedream model the platform lists, with its state. Not every listed
    model is open on the account, so this is a menu, not a permission list."""
    url = settings["SEEDREAM_BASE_URL"].rstrip("/") + "/models"
    request = urllib.request.Request(
        url, headers={"Authorization": "Bearer " + settings["SEEDREAM_API_KEY"]}
    )
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            data = json.loads(response.read().decode("utf-8")).get("data") or []
    except (urllib.error.HTTPError, urllib.error.URLError, json.JSONDecodeError, OSError):
        return []
    return sorted(
        (m.get("id", ""), m.get("status") or "active")
        for m in data
        if "seedream" in str(m.get("id", ""))
    )


def on_white(path: Path):
    """A transparent cut-out, resolved onto white. Returns PNG bytes or None.

    Her canonical asset is a cut-out with an alpha channel, and an alpha channel
    read by a model that does not expect one comes back as black edges. White is
    what the illustration was drawn against, so white is what it goes back to.
    """
    if Image is None:
        return None
    try:
        with Image.open(path) as image:
            if image.mode not in ("RGBA", "LA", "P"):
                return None
            rgba = image.convert("RGBA")
    except Exception:
        return None
    if rgba.getchannel("A").getextrema()[0] == 255:  # already opaque throughout
        return None
    flat = Image.new("RGB", rgba.size, (255, 255, 255))
    flat.paste(rgba, (0, 0), rgba)
    buffer = io.BytesIO()
    flat.save(buffer, format="PNG")
    return buffer.getvalue()


def as_data_url(path: Path) -> str:
    """A local image, handed to the API inline — no upload step, no hosting."""
    flattened = on_white(path)
    if flattened is not None:
        mime, data = "image/png", flattened
    else:
        mime = mimetypes.guess_type(path.name)[0] or "image/png"
        data = path.read_bytes()
    return f"data:{mime};base64,{base64.b64encode(data).decode('ascii')}"


def fetch_one(item: dict) -> bytes:
    """Either a signed URL (valid ~24 h) or inline base64, depending on setup."""
    if item.get("b64_json"):
        return base64.b64decode(item["b64_json"])
    url = item.get("url")
    if not url:
        raise RuntimeError(f"返回里既没有 url 也没有 b64_json：{item}")
    with urllib.request.urlopen(url, timeout=600) as response:
        return response.read()


def out_paths(base: Path, count: int) -> list:
    """`out.png` with three frames becomes out-1.png, out-2.png, out-3.png."""
    if count == 1:
        return [base]
    return [base.with_name(f"{base.stem}-{i + 1}{base.suffix}") for i in range(count)]


def run_one(settings: dict, args, prompt: str, destination: Path) -> int:
    payload = {
        "model": settings["SEEDREAM_MODEL"],
        "prompt": prompt,
        "size": args.size,
        "response_format": args.response_format,
        "watermark": args.watermark,
    }
    if args.ref:
        payload["image"] = [as_data_url(Path(p)) for p in args.ref]
    if args.seed is not None:
        payload["seed"] = args.seed
    if args.n > 1:
        # Seedream's 4.0 series generates connected frames in one pass; that is
        # what this is, rather than repeated independent draws.
        payload["sequential_image_generation"] = "auto"
        payload["sequential_image_generation_options"] = {"max_images": args.n}

    print(f"→ {settings['SEEDREAM_MODEL']}  {args.size}  {len(prompt)} 字"
          + (f"  {len(payload.get('image', []))} 张参考图" if args.ref else ""))
    status, body = post(settings, payload)
    if status != 200:
        print(f"× HTTP {status}：{error_text(body)}", file=sys.stderr)
        hint = account_hint(body)
        if hint:
            print(f"  → {hint}", file=sys.stderr)
        return 1

    items = body.get("data") or []
    if not items:
        print(f"× 返回里没有图片：{json.dumps(body, ensure_ascii=False)[:400]}", file=sys.stderr)
        return 1

    usage = body.get("usage")
    if usage:
        print(f"  usage: {json.dumps(usage, ensure_ascii=False)}")

    saved = []
    for item, path in zip(items, out_paths(destination, len(items))):
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(fetch_one(item))
        saved.append(path)
    for path in saved:
        print(f"  saved {path}  {path.stat().st_size / 1024:.0f} KB")
    return 0


def prompts_from(args) -> list:
    if args.prompt_file:
        lines = Path(args.prompt_file).read_text(encoding="utf-8").splitlines()
        return [line.strip() for line in lines if line.strip() and not line.startswith("#")]
    return [args.prompt]


def command_check(settings: dict) -> int:
    """Two probes, neither of which draws anything.

    A nonsense model name isolates the key: 401 means the key is wrong, any
    other answer means it was accepted. Then the configured model is asked for
    a deliberately invalid `size`, which the platform rejects before it draws —
    so `ModelNotOpen`, `InvalidParameter` and `NotFound` separate the three ways
    a model can be unusable without a single 分 being spent.
    """
    print(f"endpoint {settings['SEEDREAM_BASE_URL']}")
    print(f"model    {settings['SEEDREAM_MODEL']}")
    key = settings["SEEDREAM_API_KEY"]
    print(f"key      {key[:4]}…{key[-4:]}  ({len(key)} 字符)")

    status, body = post(settings, {"model": "__key_check__", "prompt": "ping"})
    if status == 401:
        print(f"× key 被拒绝：{error_text(body)}", file=sys.stderr)
        return 1
    print("✓ key 通过认证")

    status, body = post(
        settings, {"model": settings["SEEDREAM_MODEL"], "prompt": "ping", "size": "notasize"}
    )
    code = error_code(body)
    if status == 200:
        print("？ 探测请求被当成正常请求接受了，本次可能真的生成了一张图")
        return 0
    if code == "InvalidParameter" and "size" in json.dumps(body, ensure_ascii=False):
        print("✓ 模型已开通、可调用（故意用非法 size 探测，不产生费用）")
        return 0
    if code == "ModelNotOpen":
        print(f"× 模型未开通：{error_text(body)}", file=sys.stderr)
        print("  去火山方舟控制台「开通管理」开通它，或从下面挑一个已开通的型号", file=sys.stderr)
    elif code == "InvalidEndpointOrModel.NotFound":
        print(f"× 模型名不可用：{error_text(body)}", file=sys.stderr)
    else:
        print(f"× HTTP {status}：{error_text(body)}", file=sys.stderr)

    catalog = seedream_catalog(settings)
    if catalog:
        print("  平台列出的 Seedream 型号（[active] 为在役）：")
        for model_id, state in catalog:
            print(f"    {model_id}  [{state}]")
    return 1


def main() -> int:
    try:  # keep the progress lines and the errors in the order they happened
        sys.stdout.reconfigure(line_buffering=True)
    except AttributeError:
        pass
    parser = argparse.ArgumentParser(
        description="用 Seedream 生成图片（key 放在 ~/.config/seedream/env）"
    )
    parser.add_argument("command", choices=("check", "generate"))
    parser.add_argument("prompt", nargs="?", help="画面描述；用 --prompt-file 时可以省略")
    parser.add_argument("--prompt-file", help="每行一条提示词，批量生成")
    parser.add_argument("-o", "--out", help="输出文件（默认 public/gen/<时间戳>.png）")
    parser.add_argument("--outdir", default=str(ROOT / "public" / "gen"), help="批量模式的输出目录")
    parser.add_argument("--size", default="2K", help="1K / 2K / 4K，或 2048x2048 这样的具体尺寸")
    parser.add_argument("-n", type=int, default=1, help="一次生成几张相互连贯的图（组图）")
    parser.add_argument("--ref", action="append", help="参考图，可重复；用来保持角色一致")
    parser.add_argument("--seed", type=int, help="固定随机种子，便于复现同一张图")
    parser.add_argument("--watermark", action="store_true", help="保留服务端水印（默认不加）")
    parser.add_argument(
        "--response-format", default="url", choices=("url", "b64_json"), help="一般不用改"
    )
    parser.add_argument("--api-key", help="临时指定 key（默认读配置文件）")
    parser.add_argument("--base-url", help=f"接口地址，默认 {DEFAULT_BASE_URL}")
    parser.add_argument("--model", help=f"模型名，默认 {DEFAULT_MODEL}")
    args = parser.parse_args()

    settings = load_settings(args)

    if args.command == "check":
        if not settings.get("SEEDREAM_API_KEY"):
            print(KEY_HELP, file=sys.stderr)
            return 2
        return command_check(settings)

    if not settings.get("SEEDREAM_API_KEY"):
        print(KEY_HELP, file=sys.stderr)
        return 2
    if not args.prompt and not args.prompt_file:
        parser.error("generate 需要一条提示词，或用 --prompt-file 指定文件")
    if args.n < 1:
        parser.error("-n 至少为 1")

    prompts = prompts_from(args)
    stamp = time.strftime("%Y%m%d-%H%M%S")
    failures = 0
    for index, prompt in enumerate(prompts):
        if args.out and len(prompts) == 1:
            destination = Path(args.out)
        else:
            tail = f"-{index + 1}" if len(prompts) > 1 else ""
            destination = Path(args.outdir) / f"seedream-{stamp}{tail}.png"
        failures += run_one(settings, args, prompt, destination)
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
