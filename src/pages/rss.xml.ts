import { getCollection, render } from 'astro:content';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';

const base = import.meta.env.BASE_URL.replace(/\/$/, '');
const site = import.meta.env.SITE ?? 'https://sujinglang.github.io';
const origin = site.replace(/\/$/, '');
const escapeXml = (value: string) =>
  value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');

export async function GET() {
  const homeUrl = new URL(base + '/', site).toString();
  const posts = (await getCollection('posts', ({ data }) => !data.draft))
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime())
    .slice(0, 30);

  // Render each post through the same markdown pipeline the pages use.
  const container = await AstroContainer.create();
  const items: string[] = [];
  for (const post of posts) {
    const url = new URL(base + '/posts/' + encodeURIComponent(post.id) + '/', site).toString();
    let fullHtml = '';
    try {
      const { Content } = await render(post);
      const rawHtml = await container.renderToString(Content);
      fullHtml = rawHtml
        .replaceAll(' href="/', ' href="' + origin + '/')
        .replaceAll(' src="/', ' src="' + origin + '/');
    } catch (error) {
      console.warn('RSS 全文渲染失败，本期仅输出摘要：', post.id, error);
    }
    const encoded = fullHtml
      ? '<content:encoded><![CDATA[' + fullHtml.replaceAll(']]>', ']]]]><![CDATA[>') + ']]></content:encoded>'
      : '';
    items.push([
      '<item>',
      '<title>' + escapeXml(post.data.title) + '</title>',
      '<link>' + escapeXml(url) + '</link>',
      '<guid isPermaLink="true">' + escapeXml(url) + '</guid>',
      '<pubDate>' + post.data.date.toUTCString() + '</pubDate>',
      '<description>' + escapeXml(post.data.excerpt) + '</description>',
      encoded,
      '</item>',
    ].join(''));
  }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel>',
    '<title>GINLANG · 写一些迟到的句子</title>',
    '<link>' + escapeXml(homeUrl) + '</link>',
    '<description>随笔、日记、书摘与短句。给经过的日子留一页。</description>',
    '<language>zh-CN</language>',
    '<lastBuildDate>' + new Date().toUTCString() + '</lastBuildDate>',
    items.join(''),
    '</channel></rss>',
  ].join('');

  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
