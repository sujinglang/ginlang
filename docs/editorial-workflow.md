# GINLANG 编辑与发布手册

目前由创办人邀请作者、确认稿件，再统一通过 GitHub 发布。线上没有登录、上传或投稿后台。

## 需要创办人补充

- 创办人介绍：`src/content/authors/ginlang.json` 的 `bio`，以及 `src/data/author.ts` 的首页与关于页文字。
- 可公开的联系渠道：确认后更新 `src/pages/contribute.astro`。目前网站只说明流程，不接收在线稿件。
- 第一位客席作者的笔名、简介和作品：得到作者同意后再添加，不提前制作虚构档案。

## 新增作者

在 `src/content/authors/` 新建一个 JSON 文件。文件名就是长期稳定的作者 ID，例如 `lin-mu.json`。不要使用会频繁改变的展示名作文件名。可复制下面的结构并替换为真实资料：

```json
{
  "name": "作者确认的笔名",
  "role": "guest",
  "tagline": "作者确认的一句话介绍",
  "bio": "作者确认公开的简介",
  "featured": true,
  "order": 20,
  "featuredPost": "已发布的文章文件名，不带.md",
  "links": []
}
```

`bio`、`portrait`、`featuredPost` 和 `links` 都可省略。代表图放在 `public/`，`portrait` 填该目录下的相对路径，例如 `authors/lin-mu.webp`。图片和公开链接均须经作者确认。`featured` 控制首页是否推荐，作者目录仍展示所有作者。作品数量和作品列表由文章自动计算。

## 添加作品

在 `src/content/posts/` 新建 Markdown 文件。文件名就是文章 URL 的最后一段；已发布文章不要随意改名，以免旧链接失效。

```md
---
title: 作者确认的标题
date: 2026-10-01
category: essay
author: lin-mu
excerpt: 一句清楚的真实内容介绍。
draft: true
---

从这里写正文。
```

`category` 可填 `essay`、`diary`、`book` 或 `short`。`author` 必须与作者 JSON 文件名一致。写作与核稿时保留 `draft: true`；本地运行 `npm run dev` 预览。作者确认文字和署名后改为 `draft: false`，构建并推送到 `main`，GitHub Pages 将自动发布。撤下作品时先改回 `draft: true`，再发布一次；旧地址会停止生成。

作者数据中的 `featuredPost` 应填这位作者自己的、已经发布的文章 ID。作者页会验证这一关系。文章页、全部文章、分类、归档和搜索中的署名都自动引用作者数据，不需要手工复制简介。

## 编排专题

专题保存在 `src/content/topics.json`，初始值是空对象 `{}`。有真实作品和编辑导语后，再以稳定专题 ID 添加一项：

```json
{
  "autumn-reading": {
    "title": "经确认的专题标题",
    "introduction": "编辑导语，说明这些真实作品为什么放在一起。",
    "posts": ["已发布的文章 ID", "另一篇已发布的文章 ID"],
    "order": 20,
    "draft": true
  }
}
```

`posts` 的顺序就是专题页的阅读顺序。确认所有作品已发布后将 `draft` 改为 `false`。专题页不会复制文章正文；它通过文章 ID 生成链接。没有正式专题时，首页与导航不会显示专题入口。

## 发布前检查

运行 `npm run build`。构建时会检查文章作者、作者代表作和正式专题所引用的作品是否存在且可以发布。再查看手机与桌面页面、署名、作者链接、图片替代文本和 `/ginlang/` 资源路径。推送到 `main` 后，在 GitHub Actions 确认 Pages 发布成功。

客席作者作品的著作权仍归各自作者。请在发布、修改或转载前与作者确认使用范围。
