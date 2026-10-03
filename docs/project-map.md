# 项目目录与维护范围

GINLANG 是 Astro 静态个人博客。日常更新只需要维护内容和图片；页面模板会生成作者、分类、归档、相册和搜索。现有内容文件名就是已发布的 ID，不要为了整理而改名。

## 日常内容

| 目录或文件 | 放什么 | 更新后会影响哪里 |
| --- | --- | --- |
| `src/content/posts/*.md` | 自己与客席作者的文章，`author` 填作者 ID | 首页、文章页、分类、归档、作者作品、搜索、RSS |
| `src/content/authors/<作者ID>.json` | 名字、简介、头像、背景、地点、个人链接 | 作者目录、作者主页、署名；GINLANG 资料也出现在首页 |
| `src/content/albums/<作者ID>.json` | 作者公开的照片登记表，可选 `groups` 分组 | 作者相册、相簿目录、作者主页的照片推荐 |
| `src/data/dailyNotePrompts.ts` | 今日笺的原创段落 | 首页今日笺 |
| `src/data/whispers.ts` | 有出处的文库摘录 | 全站页边札记、卡片选句 |
| `src/content/topics.json` | 有真实内容后再编排专题 | 专题目录、首页与导航 |
| `src/content/posts/images/<文章ID>/` | Markdown 正文配图的网页副本 | 由 Astro 自动优化并生成兼容部署路径的图片地址 |
| `public/album/<作者ID>/` | 作者相册的网页图片 | 按相册 JSON 登记展示 |
| `public/authors/<作者ID>/` | 新增作者头像、背景的网页副本 | 按作者 JSON 登记展示 |
| `public/hero-watercolors/` + `src/data/heroWatercolors.ts` | 首页水彩轮播 | 与公开相册分开维护 |
| `source-art/` | 本机原图备份，不提交、不发布 | 网页不从这里加载资源 |
| `templates/` | 可复制的文章、作者、相册模板 | 不会被 Astro 当成真实内容 |

GINLANG 原有头像与背景继续留在 `public/authors/` 原地址。新增素材可使用作者子目录，无需移动现有文件。相册保持空白直到本人添加公开照片。

## 页面与代码

| 目录 | 职责 |
| --- | --- |
| `src/pages/` | 稳定 URL 与页面模板；不要为每篇文章手工添加页面 |
| `src/components/` | 画册、札记、信笺、卡片、书签与资料等可复用交互 |
| `src/layouts/SiteLayout.astro` | 页头、页脚、搜索、阅读设置和全站行为 |
| `src/lib/content.ts` | 内容索引、日期和目录排序、跨文件引用检查 |
| `src/content.config.ts` | 必填字段、图片相对路径与内容格式检查 |
| `src/lib/` | 日期、分类、阅读路线等共享逻辑 |
| `src/data/` | 文库、今日笺、首页水彩登记与个人待填信息 |
| `src/styles/global.css` | 全局样式入口，按原有顺序导入模块 |
| `scripts/content.mjs` | 新建草稿、改文章头部、新建作者、导入照片、列出内容的本机工具 |
| `scripts/workbench.mjs` | 复用上面命令的本机表单工作台，只监听 127.0.0.1，不上线 |
| `scripts/check-library.mjs` | 核对文库出处、重复、作者分布与今日笺语气 |
| `scripts/build-hero-variants.mjs` | 首页水彩的响应式图片副本 |
| `docs/` | 编辑步骤、项目结构与维护约定 |

## 样式模块

入口的导入顺序决定已有的覆盖关系，调整某个模块时不要随意更换顺序。

| 模块 | 范围 |
| --- | --- |
| `tokens-base.css` | 自托管字体、颜色、宽度、主题、基础元素 |
| `header.css` | 页头导航、阅读工具、进度 |
| `home.css` | 首页、水彩、风景与基础页脚 |
| `reading.css` | 文章、分类、归档、关于 |
| `controls-responsive.css` | 对话框、设置、基础手机与平板规则 |
| `editorial.css` | 精选、作者、专题、阅读索引 |
| `folio-motion.css` | 已有动效、作者画册、个人资料与响应规则 |
| `refinements.css` | 统一控件、细线动效、长标题与姓名适配 |

`dist/`、`.astro/`、`node_modules/`、`.codegraph/` 均由工具生成，不是写文章或放照片的位置。`dist/` 每次构建都会重新生成。

## 给下一位协作者

先读 README、编辑手册与本文件。保留文章 ID、作者 ID、资源地址、浏览器存储键、主题和现有交互。不要把首页水彩复制进公开相册，也不要添加虚构作者或示例文章到线上。文章与分享图在开发模式允许预览草稿，公开列表始终排除草稿；内容排序和这个区别不能因整理而改变。
