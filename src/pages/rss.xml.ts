import { getCollection } from 'astro:content';

const base = import.meta.env.BASE_URL.replace(/\/$/, '');
const site = import.meta.env.SITE ?? 'https://sujinglang.github.io';
const escapeXml = (value: string) =>
  value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');

export async function GET() {
  const homeUrl = new URL(base + '/', site).toString();
  const posts = (await getCollection('posts', ({ data }) => !data.draft))
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime())
    .slice(0, 30);

  const items = posts.map((post) => {
    const url = new URL(base + '/posts/' + encodeURIComponent(post.id) + '/', site).toString();
    return [
      '<item>',
      '<title>' + escapeXml(post.data.title) + '</title>',
      '<link>' + escapeXml(url) + '</link>',
      '<guid isPermaLink="true">' + escapeXml(url) + '</guid>',
      '<pubDate>' + post.data.date.toUTCString() + '</pubDate>',
      '<description>' + escapeXml(post.data.excerpt) + '</description>',
      '</item>',
    ].join('');
  }).join('');

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0"><channel>',
    '<title>GINLANG · 写一些迟到的文字</title>',
    '<link>' + escapeXml(homeUrl) + '</link>',
    '<description>随笔、日记、书摘与短句。给经过的日子留一页。</description>',
    '<language>zh-CN</language>',
    '<lastBuildDate>' + new Date().toUTCString() + '</lastBuildDate>',
    items,
    '</channel></rss>',
  ].join('');

  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
