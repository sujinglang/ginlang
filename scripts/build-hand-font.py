"""把站内中文手写体切成几块，用 unicode-range 让浏览器只取需要的部分。

站点原来把 1833 个码位打成一个 534 KB 的 woff2，但它只服务几行手写体文案
（首页引言、作者签名、跋语），一页真正用到的字通常不到 250 个。按 unicode-range
分组后，浏览器只会下载「页面里真的出现过的字」所在的块，覆盖范围一点没变。

用法（在站点根目录）：

    python scripts/build-hand-font.py

输入：
  src/assets/fonts/zhi-mang-xing-site.woff2   当前全量手写体
  _hand-chars.json                            当前页面手写体元素里出现的字符
                                              （由 collect-hand-chars 脚本在无头浏览器里扫出来）

输出：
  src/assets/fonts/zhi-mang-xing-used.woff2    这些字单独一块，页面常态只拉这一块
  src/assets/fonts/zhi-mang-xing-rest-a.woff2  其余字两分，只有用到时才下载
  src/assets/fonts/zhi-mang-xing-rest-b.woff2
  scripts/hand-font-faces.css                 生成的三条 @font-face（贴进 tokens-base.css）
"""

from __future__ import annotations

import json
import pathlib
import subprocess
import sys

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = pathlib.Path(__file__).resolve().parent.parent
FONT_DIR = ROOT / "src" / "assets" / "fonts"
SOURCE = FONT_DIR / "zhi-mang-xing-site.woff2"
LIST = ROOT / "_hand-chars.json"
OUT_CSS = ROOT / "scripts" / "hand-font-faces.css"


def make_unicode_range(codepoints: list[int]) -> str:
    """把码位压成 unicode-range 文本，连续的合并成区间。"""
    codepoints = sorted(set(codepoints))
    parts: list[str] = []
    start = prev = codepoints[0]
    for cp in codepoints[1:]:
        if cp == prev + 1:
            prev = cp
            continue
        parts.append(f"U+{start:X}" if start == prev else f"U+{start:X}-{prev:X}")
        start = prev = cp
    parts.append(f"U+{start:X}" if start == prev else f"U+{start:X}-{prev:X}")
    return ", ".join(parts)


def write_subset(codepoints: list[int], out: pathlib.Path, options: subset.Options) -> int:
    font = subset.load_font(str(SOURCE), options)
    subsetter = subset.Subsetter(options)
    subsetter.populate(unicodes=codepoints)
    subsetter.subset(font)
    subset.save_font(font, str(out), options)
    return out.stat().st_size


def main() -> int:
    if not SOURCE.exists():
        print(f"找不到源字体 {SOURCE}", file=sys.stderr)
        return 1

    source = TTFont(str(SOURCE))
    cmap = set(source.getBestCmap())
    source.close()

    used_raw = json.loads(LIST.read_text(encoding="utf-8"))
    used = sorted({ord(ch) for ch in used_raw} & cmap)
    rest = sorted(cmap - set(used))
    if not used or not rest:
        print("分组结果为空，先确认 _hand-chars.json 是否是最新的", file=sys.stderr)
        return 1

    half = len(rest) // 2
    groups = [
        ("used", used),
        ("rest-a", rest[:half]),
        ("rest-b", rest[half:]),
    ]

    options = subset.Options()
    options.flavor = "woff2"
    options.layout_features = ["*"]
    options.name_IDs = ["*"]
    options.notdef_outline = True
    options.recommended_glyphs = True
    options.drop_tables += ["DSIG"]

    rules: list[str] = []
    total = 0
    for name, codepoints in groups:
        out = FONT_DIR / f"zhi-mang-xing-{name}.woff2"
        size = write_subset(codepoints, out, options)
        total += size
        print(f"{out.name:36s} {len(codepoints):5d} 字  {size / 1024:7.1f} KB")
        rules.append(
            "@font-face {\n"
            "  font-family: 'GINLANG Zhi Mang Xing';\n"
            f"  src: url('../assets/fonts/{out.name}') format('woff2');\n"
            "  font-style: normal;\n"
            "  font-weight: 400;\n"
            "  font-display: swap;\n"
            f"  unicode-range: {make_unicode_range(codepoints)};\n"
            "}"
        )

    # 覆盖校验：三块必须正好等于原字体的码位集合
    covered = set().union(*(set(c) for _, c in groups))
    if covered != cmap:
        print("切分后覆盖范围与原字体不一致", file=sys.stderr)
        return 1

    OUT_CSS.write_text(
        "/* 由 scripts/build-hand-font.py 生成，别手改。\n"
        "   同族名的三块按 unicode-range 分工，浏览器只下页面里出现过的字所在的块。 */\n"
        + "\n".join(rules)
        + "\n",
        encoding="utf-8",
    )
    print(f"合计 {total / 1024:.1f} KB（原来 534 KB），码位 {len(cmap)} 个，覆盖校验通过")
    print(f"@font-face 已写到 {OUT_CSS.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
