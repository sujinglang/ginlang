# 山水分界图

由内置 `imagegen` 重新绘制。网页资源为 `public/section-shanshui-v3.webp`，本地原图为 `source-art/section-shanshui-v3.png`。

画面改为中国古典山水的淡墨手卷：远山、空水、少量岸树，小舟与寺庙仅作极小的点景。灰墨为主，带极淡的青色和赭色。绘图阶段将山水画面的高度收至上一版约六成，不压扁已绘制的山、船或建筑。

原图为 2172 × 724，山水集中在中间的窄幅，其余为白色留白。网页只收起外侧空白，图片宽度随页面变化，高度自动按原比例计算。取消了固定图片高度与纵向拉伸。浅色页面通过正片叠底融入纸色；夜间页面通过灰度反相与滤色融入深色背景。

WebP 仅作格式转换与压缩，没有改动原画的几何比例。第一版资源仍保留为 `public/section-shanshui-v1.webp`。

## 当前生成提示词

```text
Use case: stylized-concept.
Draw a NEW quiet Chinese classical shanshui handscroll for a very slender website section divider.
Canvas: wide 2160 by 720, perfectly plain pure white background. This time use a clean WHITE background, not transparent alpha. All paint is in a single narrow central horizontal band, from y=270 to y=450 (180 pixels high maximum); everything above and below is unpainted pure white. This makes the painted scene 60 percent as tall as a previous 300 pixel high scene at equal width. The painting's proportions are naturally low and very wide; do not squash a taller landscape.
Composition and style: classical Chinese literati landscape, pale dry ink strokes and gently diluted ink washes. Two unequal sparse mountain groups and one low shore, arranged asymmetrically along a long sweep of EMPTY water and mist. Naturally low gentle mountains with a few textured ridge strokes; no large tall peaks. Long untouched empty water has no realistic reflections. Broad airy gaps and quiet soft endings. Each painted end dissolves naturally into the plain white paper.
Palette: very light warm gray ink, a delicate trace of blue-gray and celadon, a touch of pale earth. Sparse, calm, restrained, poetic, like a distant river in an old Chinese landscape handscroll. No strong outlines, no dark forest, no vivid colors, no photographic or western watercolor scenery.
Small details: ONE tiny flat wooden boat, no sail, just two small ink strokes on the open water. ONE tiny temple nestled in the far shore, its roofs merely a few fine strokes. Both extremely small, less than one percent of the picture width each. Only a few distant trees. No other buildings, people or birds.
Avoid: every form of neon edge, white glow, cyan or yellow outline, digital vignette, airbrushed fog, oval frame, colored paper background, lettering, calligraphy, seals, stamps, flowers, borders and decorative motifs.
The essential result is a naturally slender pale Chinese ink landscape with authentic classical empty space and subtle brush marks. The painted band itself must stay at most 180 pixels high on the 2160 pixel wide canvas.
```
