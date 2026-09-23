# GINLANG

一个以 Markdown 写作为主的中文文学随笔站，使用 Astro 生成静态页面并发布到 GitHub Pages。

## 写一篇新文章

在 src/content/posts/ 新建 .md 文件，添加 title、date、category、excerpt 和 draft 元数据，再写正文。

category 可填 essay（随笔）、diary（日记）、book（书摘）或 short（短句）。将 draft 设为 true 可先保存而不发布。

提交并推送到 main 后，GitHub Actions 会自动构建并更新网站。

## 本地预览

运行 npm install 后执行 npm run dev。本地构建命令为 npm run build，生成文件位于 dist/。
