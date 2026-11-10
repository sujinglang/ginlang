import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://ginlang.vip',
  base: '/',
  trailingSlash: 'always',
  // 单页路由开着时 Astro 会顺带做链接预取。这里明确关掉：换页由 ClientRouter
  // 在点击时取一次 HTML，不想让鼠标扫过的每个链接都去下载一份。
  prefetch: false,
  image: {
    layout: 'constrained',
    breakpoints: [480, 800, 1200],
    // Article CSS already preserves natural proportions and reading widths.
    responsiveStyles: false,
  },
  markdown: {
    // Code blocks follow the reading theme instead of staying dark on paper.
    // `css-variables` emits every token colour as a custom property, which is
    // what lets reading.css repaint the whole block on theme change.
    // `themes` must stay unset: it would override `theme` and lose the tokens.
    syntaxHighlight: 'shiki',
    shikiConfig: {
      theme: 'css-variables',
      wrap: true,
    },
  },
});
