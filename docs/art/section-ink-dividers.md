# 首页淡墨分界图

## 使用位置与素材

三张图只用于首页的三处主要分界。其它分界保留较短留白，避免画面重复。图像均为静态装饰，鼠标与键盘操作继续由原有页面控件处理。

| 位置 | 图像 | 网页资源 | 本地原图 |
| --- | --- | --- | --- |
| 最近文章前 | 用户选定的淡墨山水、舟与远寺 | public/section-ink-landscape-v5.webp | source-art/section-ink-landscape-selected.png |
| 今日笺前 | 竹影、低书案与摊开的书 | public/section-ink-study-v1.webp | source-art/section-ink-study-v1.png |
| 分类阅读前 | 芦苇、空水与归鸟 | public/section-ink-reeds-v1.webp | source-art/section-ink-reeds-v1.png |

山水原图为用户本轮附件，保持原画不重绘。竹影书案与芦苇归鸟使用内置 imagegen，分别生成一张，以用户附件作为笔触、淡灰绿和留白的风格参考。

原图尺寸分别为 2172 × 724、2171 × 724、2172 × 724。WebP 只作格式转换与压缩，三张资源合计约 86 KiB。分界容器比例继续采用 2172 / 260。图像宽度随页面变化，高度按原比例计算，只收起画外空白。竹影书案的取景中心略向上移动，完整保留竹梢与书案。浅色通过正片叠底融入纸色，夜间通过灰度反相与滤色融入深色背景。

配置集中在 src/components/SectionDivider.astro，首页用 art="landscape"、art="study"、art="reeds" 明确指定位置。没有 art 参数时只显示留白。

## 竹影书案提示词

```text
Use case: stylized-concept.
Asset type: a static illustration used as a narrow section divider on GINLANG, a quiet Chinese personal blog.
Input image 1 is ONLY a style and composition reference. Create a different companion illustration, not the same mountains.
Primary request: a humble Chinese ink-wash vignette of bamboo shade beside a low, plain wooden writing table with a small open blank book. A suggestion of a quiet courtyard ground recedes horizontally into empty air. No person. Just a few sparse bamboo stems and leaves, a very small table and book, and two or three faint ground strokes.
Style: the SAME very pale grey-green ink, understated hand-painted wash, softness and unpolished brushwork as the reference. Traditional Chinese sketch-like artistic atmosphere, simple and calm, with generous unpainted space.
Composition: wide landscape canvas approximately 2172 by 724, 3:1. Like the reference, almost all the canvas is clean near-white paper. All painted objects must occupy ONLY a very shallow horizontal ribbon across the vertical CENTER of the canvas: within y=300..425 on a 724-high canvas. The whole scene ends softly into white toward both edges. Bamboo is miniature and fully visible, not tall plants clipped by the canvas. The open book is also miniature. Allow a generous long blank interval between subjects. The painted band itself is roughly 14:1 or wider, with sparse, legible brush shapes. Do not stretch any object.
Palette: dilute sage-grey ink, an almost imperceptible warm grey for the table, near-white paper. A little variation within the same subdued palette.
Constraints: no lettering, no signature, no seal, no visible border, no gold or aged silk, no big mountains, no saturated color, no ornamental flowers, no ink splash effects, no black outlines, no photorealism, no heavy grain. Do not fill the upper or lower blank margins. A single image, not a grid.
```

## 芦苇归鸟提示词

```text
Use case: stylized-concept.
Asset type: a static illustration used as a narrow section divider on GINLANG, a quiet Chinese personal blog.
Input image 1 is ONLY a style and composition reference. Create a different companion illustration.
Primary request: a simple reed shore in pale Chinese ink wash: two very sparse low clusters of reeds beside still water, a long stretch of empty mist between them, and three small returning birds represented by a few natural grey brush marks. A tiny suggestion of a distant bank, no mountain panorama. No house, no person, no boat.
Style: match the reference's very pale grey-green ink, loose humble brushwork, calm atmosphere, and soft white edges. Traditional Chinese sketch-like painting, airy and understated rather than detailed.
Composition: wide canvas approximately 2172 by 724, 3:1. Most of the canvas remains near-white paper. Confine EVERY painted element, including birds and reeds, to a shallow horizontal ribbon across the vertical CENTER, within y=300..425 on a 724-high canvas. The reeds are small and fully visible; leave plenty of open water across the middle, like the reference's silence. The narrow painted scene dissolves into white at both ends. Do not vertically compress objects. The painted band is roughly 14:1 or wider.
Palette: dilute sage-grey wash, a tiny trace of muted warm straw in a few reed tips, mostly soft grey ink, near-white paper.
Constraints: no lettering, no signature, no seal, no frame, no gold or aged silk, no dense foliage, no dense scenery, no ornamental flowers, no saturated colors, no black silhouettes, no dramatic sunset, no photorealism, no heavy paper grain, no floating unrelated objects. Keep upper and lower margins completely blank. Single image, not a grid.
```
