import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://ginlang.vip',
  base: '/',
  trailingSlash: 'always',
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
