import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://ginlang.vip',
  base: '/',
  trailingSlash: 'always',
  // 单页路由开着时，Astro 会自动给站内链接做预取。这里显式写清楚：
  // 鼠标停到链接上就先把那一页的 HTML 取回来，点击时就不用再等一个来回。
  // （纯触屏没有 hover，会退化成按下时才取；那种情况由换页本身的过渡盖住。）
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
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
