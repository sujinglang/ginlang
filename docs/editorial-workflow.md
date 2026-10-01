# GINLANG 编辑与发布手册

内容由你整理后发布到 GitHub。客席作者不需要登录网站；名字、简介、文章、照片确认后，使用本机工具或模板添加。电话和微信已在现有「参与写作」页面填写，不另建联系页面。

## 先记住三个关系

- 文章里的 `author` 对应作者文件名。例如 `ginlang` 对应 `src/content/authors/ginlang.json`。
- 相册文件名也与作者 ID 相同。例如 `src/content/albums/ginlang.json`。
- 内容文件名与 ID 决定网址。已发布后更新内容即可，避免改名造成旧链接失效。

所有命令在项目根目录运行。工具拒绝覆盖已有内容和图片，出错会说明要修改哪一项。先运行 `npm run content -- help` 查看参数。

## 写文章

新建自己的草稿：

```powershell
npm run content -- post 2026-10-01-autumn-note --title "秋天经过的时候" --author ginlang --category essay --date 2026-10-01
```

为客席作者写草稿时，只把 `--author` 改成已创建的作者 ID。生成文件位于 `src/content/posts/`，用任意文本编辑器打开：

```md
---
title: 秋天经过的时候
date: 2026-10-01
category: essay
themes: []
author: ginlang
excerpt: 此处需要您亲自填写
draft: true
---

从这里写正文。
```

| 字段 | 填法 |
| --- | --- |
| `title` | 作者确认的标题 |
| `date` | 发布日期，格式 YYYY-MM-DD |
| `category` | essay 随笔 / diary 日记 / book 书摘 / short 短句 |
| `themes` | 可选数组：philosophy、life、love、freedom、direction |
| `author` | 已存在的作者 ID |
| `excerpt` | 一句准确的内容介绍，用于列表和搜索 |
| `draft` | true 为草稿，false 为公开 |

使用 Markdown 的 `## 小标题`、段落和引用即可。草稿不会进首页、目录、搜索或 RSS；开发模式可通过文章的固定地址预览。确认内容后把 `draft` 改成 `false`，运行构建。撤下文章可以改回 `true` 后发布；其旧地址将停止生成。

主题阅读路线只在公开文章足够时出现：全站至少八篇、同主题至少三篇，不把现有少量作品重复包装。专题中的文章仍按你登记的顺序阅读。

## 作者资料

### 添加客席作者

```powershell
npm run content -- author lin-mu --name "林木" --tagline "由本人确认的一句话介绍"
```

工具创建：

- `src/content/authors/lin-mu.json`：角色为 guest，首页推荐默认关闭。
- `src/content/albums/lin-mu.json`：空相册 `photos: []`。

填写真实 `bio`、个人链接等信息后，作者目录与 `/authors/lin-mu/` 自动生成。设 `featured: true` 才会在首页推荐。`order` 控制目录顺序，GINLANG 仍处在主要位置。不要复制其他人的经历或作品当作客席作者资料。

### 修改 GINLANG

编辑 `src/content/authors/ginlang.json`：名字、简介、地点、日期、头像、背景在这里。地点与日期只按填写的字样展示，不推断含义。关于页更详细的个人待填段落在 `src/data/author.ts`。

### 导入头像与背景

```powershell
npm run content -- profile-photo lin-mu "C:\照片\头像.png" --kind portrait --name portrait --alt "作者选用的插画头像"
npm run content -- profile-photo lin-mu "C:\照片\树林.jpg" --kind cover --name cover --alt "树林与一条小路"
```

工具自动读取图像尺寸，制作网页副本，并更新作者 JSON 中的 `portrait` / `cover`、宽高和替代文本。图片放在 `public/authors/<作者ID>/`；原图备份在 `source-art/authors/<作者ID>/`。不拉伸、不裁剪；页面头像仍按原有圆形容器展示。

手工登记时使用相对路径，例如 `authors/lin-mu/cover.webp`，不要写 `C:\...`、`/ginlang/...` 或网络图片地址。宽高填实际尺寸，`alt` 客观描述看得见的画面。

个人链接使用 `links: [{ "label": "个人主页", "url": "https://..." }]`。代表作 `featuredPost` 填本人已发布的文章 ID，不带 `.md`；不需要时省略。引文同时填写 `quoteSource` 供核对。

## 作者相册

首页水彩轮播和公开相册是两个入口。相册目前保持空白；只有你主动登记的照片才会出现。

```powershell
npm run content -- photo ginlang "C:\照片\湖边.jpg" --name lakeside --alt "湖面、小舟与远处的青山" --caption "湖边" --date 2026-10-01
```

将 `ginlang` 换成客席作者 ID，就会添加到那位作者的专属相册。工具会：

- 保留输入原图，另行备份到不发布的 `source-art/albums/<作者ID>/`。
- 生成长边不超过 1800px 的 WebP，不放大、不裁剪。
- 把副本放入 `public/album/<作者ID>/`。
- 自动把路径、实际宽高、替代文本和可选图注/日期写入对应相册 JSON。

同一份登记表供相簿首页、作者主页的照片推荐、专属相册读取，不需要在三个页面各加一次。`photos` 数组的顺序就是展示顺序，调整顺序可以移动数组项。移除公开照片时删除对应登记项即可；原始备份可继续保留。

手工相册格式：

```json
{
  "photos": [
    {
      "src": "album/ginlang/lakeside.webp",
      "width": 1600,
      "height": 1067,
      "alt": "湖面、小舟与远处的青山",
      "caption": "湖边",
      "date": "2026-10-01"
    }
  ]
}
```

`caption` 和 `date` 可省略；不要虚构地点、时间或人物身份。没有照片时保持 `{ "photos": [] }`。

## 正文配图

为已存在的文章准备配图：

```powershell
npm run content -- post-photo 2026-10-01-autumn-note "C:\照片\窗边.jpg" --name window --alt "窗边的书与一盆植物"
```

工具将优化副本放在 `src/content/posts/images/<文章ID>/`，原图备份在 `source-art/posts/<文章ID>/`，并输出可以粘贴到正文的 Markdown，例如：

```md
![窗边的书与一盆植物](./images/2026-10-01-autumn-note/window.webp)
```

图片相对文章引用，Astro 会生成正确的构建资源地址与尺寸；不用把 `/ginlang/` 写死在正文。工具只准备图片并输出插图语法，不改动已写好的正文。

## 首页水彩

继续维护 `src/data/heroWatercolors.ts` 与 `public/hero-watercolors/`。每张使用稳定 `id`，登记 `file`、实际宽高和准确 `alt`。这是首页画册，不是作者公开相册。

新增或更换主 WebP 后运行：

```powershell
npm run images:hero
```

把生成的 480w / 800w 副本一并提交。现有水彩文件和 ID 保持不变，以保留刷新更换首图、固定顺序循环及卡片制作的关联。

## 编排专题

数据在 `src/content/topics.json`，空对象不会显示专题入口。有真实作品后再登记：

```json
{
  "autumn-reading": {
    "title": "经确认的专题标题",
    "introduction": "说明这些作品为什么放在一起",
    "posts": ["第一篇文章ID", "第二篇文章ID"],
    "order": 20,
    "draft": true
  }
}
```

数组顺序就是阅读顺序；正式公开前确认作品已发布，并将专题的 `draft` 改成 `false`。可选封面仍填 `public/` 下真实存在的相对图片路径。

## 发布前检查

```powershell
npm run dev
npm run build
```

1. 核对作者名字、文章署名、照片描述和愿意公开的信息。
2. 打开新文章、作者页、相册与手机预览；草稿可用固定地址预览。
3. 构建会检查必填字段、作者关系、代表作、专题引用和图片是否存在。修正报错后再发布。
4. 提交并推送到 `main`，在 GitHub Actions 确认 Pages 成功。
5. 用线上 HTTPS 地址查看结果，再发给朋友。

生成文件 `dist/` 与缓存 `.astro/` 不手工编辑。原图备份 `source-art/` 不提交到仓库，换电脑前自行复制备份；用于网页的副本要一并提交。手工复制模板时，先替换所有待填内容，作者和相册模板用同一个文件名。
