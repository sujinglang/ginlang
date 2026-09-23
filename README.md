# GINLANG

一个安静的中文文学随笔站。使用 Astro 生成静态页面，发布在 GitHub Pages。

## 写一篇新文章

在 src/content/posts/ 新建 Markdown 文件，例如 2026-10-01-autumn-note.md：

    ---
    title: 秋天经过的时候
    date: 2026-10-01
    category: essay
    excerpt: 给文章写一句简短的介绍。
    draft: false
    ---

    从这里开始写正文。

category 可用 essay（随笔）、diary（日记）、book（书摘）或 short（短句）。写作中的文章将 draft 设为 true，发布前改成 false。

## 本地预览和构建

    npm install
    npm run dev
    npm run build

静态文件会生成到 dist/。推送到 GitHub 仓库的 main 分支后，GitHub Actions 会自动构建并发布。

## 站点功能

- 首页精选最新文章，并展示文章分类和归档入口。
- 首页有「随机翻一页」与「抽一张今日笺」两种轻量互动，另有淡蓝蝴蝶与夜窗纸艺画。原创插画保存在 public/，蝴蝶是站内 SVG 组件。
- 每个页面都有「页边札记」。src/data/whispers.ts 收录 144 条短句，刷新页面或点「换一句」会显示不同的一条；相邻两次不会重复。
- 文章支持阅读进度、阅读时间、相邻文章和复制链接。阅读书签能保存当前文章的大致阅读位置，并在再次打开时继续阅读；位置只保存在当前浏览器。
- 阅读设置可调整系统/浅色/夜间主题、字号、字体风格和正文宽度，偏好保存在当前浏览器。
- 搜索支持文章标题、摘要和分类，也可按 Ctrl+K 或 ⌘K 打开。
- 页面之间使用浏览器原生的轻量过渡动画，栏目进入视野时会轻轻显现，纸笺、图片与导航也有细小反馈；系统选择减少动态效果时会关闭动画。
- 页眉和页脚都能打开分享面板，一键复制公开网址；支持系统分享的设备也可直接转发。
- RSS 订阅位于 /rss.xml，站点地图位于 /sitemap.xml。
- 页面包含 canonical、Open Graph、Twitter 卡片和基础结构化数据。

站点使用项目 Pages 地址 https://sujinglang.github.io/ginlang/，对应配置在 astro.config.mjs。如果仓库或 GitHub 账号发生变化，请一并更新 site 与 base。

分享给朋友时使用上面的 HTTPS 地址。本地预览使用的 127.0.0.1 地址只能在自己的电脑上打开。线上站点是公开静态网页，无需登录，也不依赖第三方字体或脚本。
