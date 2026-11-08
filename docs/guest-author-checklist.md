# 新增客席作者与上架作品：逐项清单

2026-11-07 实测流程（客席作者「愿为江水 / CYQ」与其作品《博斯普鲁斯海峡》），补上两次都漏掉的环节。
漏的共同点：**作者和文章都建好了，但某处页面不显示**，所以本清单按"可见性"逐处核对，而不是只写建文件的命令。

## 一、先收素材

- 作者自述：显示名、一句话简介（tagline）、中文引文与出处、可选的英文引文、个人链接
- 一张封面图（作者页顶部背景）、一张头像照
- 引文必须是本人原话并注明出处；出处不明就不放，不要替作者补出处

## 二、建作者与导图片

```powershell
npm run content -- author <作者ID> --name "显示名" --tagline "由本人确认的一句话"
npm run content -- profile-photo <作者ID> "封面.jpg" --kind cover --name <名字> --alt "客观描述画面"
npm run content -- profile-photo <作者ID> "头像.jpg" --kind portrait --name <名字> --alt "客观描述画面"
```

生成 `src/content/authors/<作者ID>.json`、`src/content/albums/<作者ID>.json`、`public/authors/<作者ID>/`；
原图备份在 `source-art/authors/<作者ID>/`，被 `.gitignore` 忽略，不提交。

## 三、补齐作者 JSON（工具不负责的部分）

| 字段 | 注意 |
| --- | --- |
| `role` | 工具默认 `guest`，不用改 |
| `featured` | **工具默认 `false`。不改 `true`，首页「客席作者」永远不会出现这个人** |
| `order` | 目录顺序，数值小的在前；GINLANG 作为创办人始终在主要位置 |
| `quote` | **不要自己写引号**，`ProfileQuote` 组件会自动加「“ ”」；有 `quote` 就必须有 `quoteSource`（schema 强校验） |
| `bio` | 保留作者原文，例如 `Hi! I am CYQ`；英文问候走 Marck Script，中文引文走 Zhi Mang Xing |
| `links` | 没有就留 `[]` |

## 四、写文章

`src/content/posts/<YYYY-MM-DD>-<slug>.md`，`author: <作者ID>`，先 `draft: true` 校对内容与排版。

## 五、可见性三处，逐个核对（最容易漏的一步）

| 位置 | 显示条件 | 出处 |
| --- | --- | --- |
| 首页「客席作者」块 | `role === 'guest' && author.data.featured`，最多 3 位 | `src/pages/index.astro` |
| `/authors/` 全部作者页 | 所有 `guest`，**不看** `featured` | `src/pages/authors/index.astro` |
| `/authors/<作者ID>/` 的「文章」区 | 取自 `publishedPosts`，**`draft` 一律不收** → 必须改成 `draft: false` | `src/pages/authors/[slug].astro` + `src/lib/content.ts` |

同理，首页「最近文章」、`/writing/`、`/archive/`、分类页、搜索与 RSS 都只收非草稿。
所以"作者和文章都在，但列表里看不到"只有两个原因：**`featured` 没开**，或**`draft` 没关**。

## 六、手写体子集（字体不统一的根源）

站内 `Zhi Mang Xing` 是**按字裁剪**的子集字体：`src/assets/fonts/zhi-mang-xing-site.woff2`。
新增中文内容里出现子集没有的字，会**逐字**掉回系统字体，看起来"一半手写一半印刷"。

- 判据：同段文字里字形风格混杂
- 处理：从 Google Fonts 取 `ZhiMangXing-Regular.ttf`（OFL 授权），按「`src/` 里出现过的全部字符 ∪ 旧子集字符」重切 woff2，覆盖同名文件，并核对新旧 cmap 无丢失
- 现状：2026-11-07 已扩到 1833 个码位（覆盖 `src/` 全部 1686 个汉字），体积 546 KB
- 每次新增较长中文（引文、问候语、首页文案）后，都要重新检查一遍

## 七、自检与交付

```powershell
npm run check:content-state
npm run build
npm run check:site
npm run check:library
```

本机预览固定用 dev 服务器 `http://127.0.0.1:4323/`（草稿只在 dev 渲染），逐处刷新核对：

1. 首页「客席作者」块里有没有这个人
2. `/authors/` 列表里有没有
3. `/authors/<作者ID>/` 的「文章」区有没有这篇
4. `/posts/<文章ID>/` 正文、署名、排版
5. `/writing/`、`/archive/`、RSS

没有用户明确说"发布/上线"，不 push、不上线。
