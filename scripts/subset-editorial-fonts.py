"""Build local, page-sized web font subsets from upstream OFL fonts.

Inputs are downloaded separately from the official LXGW WenKai and Google Fonts
releases. This helper is only needed when updating the typography assets.
"""
from pathlib import Path
from tempfile import gettempdir

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "src/assets/fonts"


def make_subset(source: Path, target: Path, characters: set[str]) -> None:
    font = TTFont(source)
    options = subset.Options()
    options.flavor = "woff2"
    options.layout_features = ["*"]
    selection = subset.Subsetter(options=options)
    selection.populate(unicodes={ord(char) for char in characters})
    selection.subset(font)
    font.flavor = "woff2"
    font.save(target)
    print(f"{target.name}: {target.stat().st_size:,} bytes")


if __name__ == "__main__":
    # The WenKai face is an accent for short Chinese UI text and quotations.
    # Include every character currently used by the site to prevent mixed
    # fallback glyphs as content rotates.
    site_text = "".join(
        path.read_text(encoding="utf-8", errors="ignore")
        for path in (ROOT / "src").rglob("*")
        if path.suffix in {".astro", ".ts", ".md", ".json"} and path.is_file()
    )
    make_subset(
        Path(gettempdir()) / "GINLANG-WenKai.ttf",
        OUT / "lxgw-wenkai.woff2",
        set(site_text),
    )
    make_subset(
        Path(gettempdir()) / "GINLANG-Cormorant-Italic.ttf",
        OUT / "cormorant-garamond-italic.woff2",
        set("".join(chr(code) for code in range(32, 127))) | set("“”’—–éàèô"),
    )
