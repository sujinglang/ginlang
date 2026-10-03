# GINLANG

GINLANG 的中文个人博客。文章、作者资料和相册由内容文件自动生成，使用 Astro 构建，沿用 GitHub Pages 发布。

线上：[ginlang.vip](https://ginlang.vip/)

## 从这里开始

| 要做的事 | 文件或手册 |
| --- | --- |
| 写自己或客席作者的文章 | `src/content/posts/` · [文章步骤](docs/editorial-workflow.md#写文章) |
| 添加客席作者、修改个人资料 | `src/content/authors/` · [作者步骤](docs/editorial-workflow.md#作者资料) |
| 给某位作者添加照片 | `src/content/albums/` + `public/album/` · [相册步骤](docs/editorial-workflow.md#作者相册) |
| 给文章插图 | `src/content/posts/images/` · [正文配图](docs/editorial-workflow.md#正文配图) |
| 更换首页水彩 | `src/data/heroWatercolors.ts` + `public/hero-watercolors/` |
| 备份与恢复我的书桌 | 桌面「我的书桌」→ 备份为 JSON |
| 本机添加内容 | `npm run workbench`（本机表单，不上线） |
| 核对文库与今日笺 | `npm run check:library` |
| 核对构建后的页面与资源 | `npm run build` → `npm run check:site` |
| 了解代码和目录 | [项目地图](docs/project-map.md) |
| 查看已保留的功能 | [功能说明](docs/features.md) |
| 视觉与动效约定 | [ART_DIRECTION.md](ART_DIRECTION.md) |

## 常用命令

在本项目目录运行：

```powershell
npm install
npm run dev
npm run build
```

开发预览地址以终端输出为准，通常为 `http://localhost:4321/`。本机地址不能发给朋友使用，分享时使用线上 HTTPS 地址。

### 新建文章草稿

```powershell
npm run content -- post 2026-10-01-autumn-note --title "秋天经过的时候" --author ginlang
```

工具会创建 Markdown，默认 `draft: true`。写好正文、确认署名后，手动改成 `draft: false`。文件名就是长期 URL，发布后保留这个名字。

匿名文章在头部设置 `anonymous: true`，或在新建命令中加 `--anonymous`；`author` 仍保留真实作者 ID。详见[匿名文章说明](docs/editorial-workflow.md#匿名文章)。

### 添加客席作者

```powershell
npm run content -- author lin-mu --name "林木" --tagline "由作者本人确认的一句话介绍"
```

同时创建作者资料和空相册。随后填写真实简介；头像与背景可用 `profile-photo` 导入。首页推荐由作者 JSON 的 `featured` 控制，默认关闭，作者目录与独立页面仍可访问。

### 添加相册照片

```powershell
npm run content -- photo ginlang "C:\照片\湖边.jpg" --name lakeside --alt "湖面、小舟与远处的青山"
```

工具保留原图，另存不裁剪的 WebP 副本，读取尺寸并登记到该作者相册。它不会修改首页轮播，也不会向空相册填充示例照片。

完整参数与更多操作：

```powershell
npm run content -- help
npm run content -- list
npm run content -- update <文章ID> --tags "阅读, 独处" --excerpt "新的摘要" --no-draft
npm run images:hero
npm run images:art
```

`list` 输出当前文章与作者的 JSON；`update` 只改 Markdown 头部字段（标题、摘要、分类、日期、标签、草稿与匿名开关），不动正文，文章 ID 与网址保持不变。发布新草稿用 `--no-draft`，恢复匿名用 `--no-anonymous`。

更换首页水彩后运行 `images:hero`；更换 GINLANG 的头像、背景或「换一扇窗」插画后运行 `images:art`。两个命令保留原图，只生成按自然比例缩小的网页副本。

也可以从 `templates/` 复制模板，按手册手工编辑。模板与测试素材不会进入线上内容。

### 本机内容工作台

```powershell
npm run workbench
```

在 `http://127.0.0.1:4322/` 打开一个本机表单：新建文章草稿、修改已有文章头部、添加客席作者、导入照片、查看当前内容、运行文库核对。它只监听本机地址，不构建、不发布，也不进入线上网站。

工作台内部调用的是同一套 `npm run content` 命令，所以两边写出的文件完全一致。新文章始终建成 `draft: true`。

### 核对文库与今日笺

```powershell
npm run check:library
```

检查摘句是否有真实出处、是否重复、作者是否过度集中，并确认今日笺是陈述段落、不用问句、不与文库重复。有问题时以非零退出码结束。

## 发布

运行 `npm run build`、`npm run check:site` 与 `npm run check:library` 后检查本地页面，再提交并推送到 `main`。GitHub Actions 会自动构建、核对、发布；成功后用线上地址检查。

`astro.config.mjs` 保留当前 `site` 与 `/` 根路径。现有文章、作者、相册的 ID 与 URL 不变。搜索、书签、阅读设置、信笺草稿与卡片下载仍使用原有功能和浏览器存储键。

原图备份放在 `source-art/`，该目录不会提交到 GitHub；换电脑前自行备份。网站使用的副本放在内容资源目录或 `public/`，代码里不引用本机绝对路径。
