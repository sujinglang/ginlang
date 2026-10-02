# 山水分界图

当前首页采用用户选定的淡墨图及两张新绘的小景，位置与生成提示词见 [首页淡墨分界图](./section-ink-dividers.md)。以下保留之前的素材记录。

## 上一版千里江山图局部

采用王希孟《千里江山图》的山水局部，图源为[故宫博物院藏品页面](https://www.dpm.org.cn/collection/paint/228354.html)。页面公开深度缩放图源为 img0065.xml，原图尺寸 41783 × 1673。当前选取第 14 层的中部山水切片，横向第 11 至 26 列、纵向第 0 至 1 行，去掉切片重叠边缘后按原坐标拼合为 4096 × 419 的局部图源。

原画局部保存在 `source-art/qianli-jiangshan-detail-v2.png`，网页压缩资源为 `public/section-qianli-jiangshan-detail-v2.webp`。该资源仅作原坐标拼合、取景与 WebP 格式转换，山体不变形。网页通过 `object-fit: cover` 适配上一版 2172 / 260 的分界容器比例，图像占满容器高度。页面实际展示约三分之一卷宽，山峰、岸线和水面拥有足够的显示尺寸。

显示参数按顺序为饱和度 0.42、亮度 1.85、对比度 1.15，透明度 0.72；上下与左右边缘淡出。部分分界使用不同的横向取景位置。夜间依次采用灰度、亮度 1.85、对比度 1.15 和反相，再通过滤色显示，透明度 0.55。图片保持静态及装饰性，不影响页面链接、阅读或匿名文章功能。

## 前一版生成记录

由内置 `imagegen` 重新绘制。网页资源为 `public/section-shanshui-v4.webp`，本地原图为 `source-art/section-shanshui-v4.png`。

这一版改为朴素的淡墨小景，只保留疏朗的低山轮廓、空水和极小的舟、寺庙。减少山石皴纹、岸树和建筑细节，使用稀释的灰绿色。山水在绘图阶段画成窄幅，网页按原画比例显示。

原图为 2172 × 724，山水集中在中间，其余为白色留白。网页只收起外侧空白，图片宽度随页面变化，高度自动按原比例计算。浅色页面通过正片叠底融入纸色；夜间页面通过灰度反相与滤色融入深色背景。

WebP 仅作格式转换与压缩，没有改动原画的几何比例。前一版资源保留为 `public/section-shanshui-v3.webp`。

## 淡墨山水生成提示词

```text
Use case: stylized-concept.
Asset type: an exceptionally slender and very faint Chinese ink landscape divider for GINLANG, a personal blog.
Primary request: redraw it as a PLAIN, modest, sparse Chinese ink sketch. The previous painting was too dark, too polished and too detailed. This one should feel like a few effortless diluted brush marks, with lots of unpainted space, rather than a precious finished landscape illustration.
Canvas and proportions: a wide 2160 by 720 pure white canvas. Confine ALL visible paint to a narrow horizontal strip centered between y=285 and y=435, at most 150 pixels high. Outside this strip leave pure white. The scene must be naturally low and slender at the drawing stage. Do not vertically squash a full landscape.
Composition: only two or three long, low, irregular hill shapes across the panorama, with broad gaps of blank water. The hills are made from very pale loose washes, a few simple brush contours and almost no interior detail. Most of the scene is empty. Give the shapes an ordinary human irregularity; do not repeat evenly spaced decorative peaks.
Tiny details: retain just one tiny flat wooden boat, two faint strokes without a sail, and one almost invisible temple roof, two faint strokes on a far hill. Less than one percent of the canvas width each. No detailed tree grove; at most two indistinct brush marks suggesting distant trees.
Color and values: extremely dilute warm gray ink and a very slight gray-green tint. Paint should be around #D2D5CE to #E7E8E1 on pure white, never darker than #BEC5BC. Desaturate almost completely, with just a trace of warm earth. No strong contrast and no black strokes. Keep it recognizable but soft, like watered-down ink left on a page.
Brush handling: understated classical Chinese literati sketch, simple boneless washes, a few sparse dry strokes, honest and unembellished. Avoid meticulous traditional engraving or an ornate polished handscroll. Edges fade into the white page without an oval outline.
Avoid: mountains packed with rock hatching, forest clusters, crisp buildings, photographic reflections, clouds drawn as objects, sky gradients, picturesque grandeur, realistic scenic detail, texture grain that makes it look antique, borders, glow, lettering, calligraphy, seals, stamps, flowers, birds, people or extra objects.
The result should be substantially lighter AND simpler than a full classical landscape painting. Plainness and restraint matter most.
```
