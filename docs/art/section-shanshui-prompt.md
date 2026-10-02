# 山水分界图

由内置 `imagegen` 生成并调整，保留透明背景。网页资源为 `public/section-shanshui-v1.webp`，本地原图为 `source-art/section-shanshui-v1.png`。

画面包含青蓝远山、绿岸、少量赭色，以及小舟和山间小寺庙。用于首页大板块之间的细长分界。

## 初始生成提示词

```text
Use case: stylized-concept.
Asset type: a small decorative section divider for GINLANG, a quiet personal blog with a warm cream paper background and watercolor illustrations.
Primary request: create an exceptionally long, slender Chinese shanshui watercolor landscape ribbon, genuinely painted, airy and refined.
Composition: use a wide landscape transparent PNG canvas, approximately 3:1. Paint ONLY a very narrow horizontal ribbon across the vertical center, occupying about 12 to 16 percent of the canvas height and 92 percent of its width. Keep large fully transparent padding above and below. The visible painted landscape itself must be roughly 16:1 in width to height, like a tiny distant landscape unfolding along a long sheet. This is a website divider, not a full-height landscape picture.
Subject: several low, gently uneven distant mountain ridges, a few smaller foreground foothills, pale open water with very subtle reflections, and thin translucent mist between layers. Mountains should be recognizably mountains, but small and low. Let the composition breathe, with varying density and natural gaps.
Style/medium: delicate traditional Chinese ink-and-watercolor washes, soft wet-on-wet pigment diffusion and visible, finely granulated watercolor texture. Restrained contemporary shanshui, elegant and natural.
Palette: muted sage gray-green around #596B5C, pale cool gray and diluted olive-green. Low saturation, medium-light tones, a few slightly stronger ridges to remain legible when displayed small. The site's paper will provide the background.
Transparency: TRUE transparent background with real alpha. Water, mist, and spaces around the ridges fade into transparency. Feather all four outer edges, especially the left and right ends. NO opaque white or beige rectangular background, no painted sky across the canvas, no simulated checkerboard.
Avoid: people, boats, trees as focal objects, buildings, birds, flowers, text, calligraphy, seals, red stamps, borders, frames, horizontal straight rules, photographic realism, large dark mountains, high contrast, cartoon icons, ornamental flourishes.
The essential result is a whisper-thin horizontal mountain-and-water painting that can separate two text sections gracefully.
```

## 最终调整提示词

```text
Use case: style-transfer.
Asset type: very slender panoramic watercolor shanshui divider for a personal blog.
Input image: the supplied landscape is the EDIT TARGET. Keep its delicate watercolor handling, distant layered mountains, reflective open water, and feathered transparent perimeter.
Primary change: make this a slimmer, more naturally colored landscape ribbon, with a tiny boat and a tiny hillside temple.
Composition: retain a wide transparent 3:1 canvas. Place the entire painted landscape in a very slender band at the EXACT vertical center: approximately 110 to 130 pixels high on a 2160 by 720 canvas. Top edge of visible paint around y=300; bottom edge around y=420. The complete landscape, mist, reflections, boat and temple must all fit within that slim band. The large canvas area above and below must be fully transparent. Spread the view out like a distant panoramic scroll, with low hills, not tall peaks. The paint itself is roughly 17:1 in width to height. Feather the left and right ends inward to transparency.
Color: introduce restrained but distinct natural colors: pale jade and moss green near hills, soft mineral-blue and blue-gray distant ridges, diluted turquoise water, a little warm ochre and earthy brown along the shore, a tiny warm clay-red roof accent. Let the colors remain visible at a small display size. Avoid an entirely gray-green monochrome image, but also avoid bright saturated digital colors.
Details: ONE small traditional wooden boat on the water, extremely small relative to the panorama, about 18 pixels wide on a 2160 pixel wide picture. ONE very small traditional hillside temple with two simple tiled roofs among the distant hills, about 24 pixels wide, blending into the landscape. Both are charming discoveries, never the focal point. Do not add large human figures, signs or foreground objects.
Medium: genuine delicate wet-on-wet Chinese ink and watercolor, translucent washes, finely granulated pigments, airy mist, varied organic painted edges.
Transparency: true PNG alpha, not a white or cream rectangle. Mist, sky, open water spaces and all outside margins should dissolve into transparency so the website's warm paper background shows through. No white edge halo, neon edge artifacts, checkerboard, border, frame, calligraphy, words, seal or watermark.
Keep the painting tiny in height and expansive in width. This is an understated section divider, not a hero banner.
```
