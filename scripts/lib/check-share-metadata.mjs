import { readFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const decode = (value = '') => value.replaceAll('&amp;', '&').replaceAll('&#39;', "'").replaceAll('&quot;', '"').replaceAll('&lt;', '<').replaceAll('&gt;', '>');

// Inspect the built HTML, so crawlers receive these fields without JavaScript.
export async function checkShareMetadata(pages, output, origin) {
  const failures = [];
  const images = new Set();
  for (const [url, { html }] of pages) {
    const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/)?.[1] ?? '';
    const meta = new Map();
    for (const tag of head.matchAll(/<meta\b[^>]*>/g)) {
      const name = tag[0].match(/\b(?:name|property)="([^"]+)"/)?.[1];
      const content = decode(tag[0].match(/\bcontent="([^"]*)"/)?.[1]);
      if (name) {
        if (meta.has(name)) failures.push(`${url}: 重复元数据 ${name}`);
        meta.set(name, content);
      }
    }
    const title = decode(head.match(/<title>([^<]+)<\/title>/)?.[1]);
    const required = ['og:site_name', 'og:title', 'og:description', 'og:type', 'og:url', 'og:image', 'og:image:secure_url', 'og:image:type', 'og:image:width', 'og:image:height', 'og:image:alt', 'twitter:card', 'twitter:title', 'twitter:description', 'twitter:image', 'twitter:image:alt'];
    for (const name of required) if (!meta.get(name)?.trim()) failures.push(`${url}: 缺少分享元数据 ${name}`);
    if (meta.get('og:title') !== title || meta.get('twitter:title') !== title) failures.push(`${url}: 分享标题与页面标题不一致`);
    if (meta.get('og:description') !== meta.get('description') || meta.get('twitter:description') !== meta.get('description')) failures.push(`${url}: 分享简介与页面简介不一致`);
    if (decodeURI(meta.get('og:url') ?? '') !== decodeURI(origin + url)) failures.push(`${url}: 分享网址应使用正式地址`);
    if (meta.get('og:image') !== meta.get('twitter:image') || meta.get('og:image') !== meta.get('og:image:secure_url')) failures.push(`${url}: 分享封面地址不一致`);
    if (meta.get('og:image:type') !== 'image/png' || meta.get('og:image:width') !== '1200' || meta.get('og:image:height') !== '630') failures.push(`${url}: 分享封面类型或尺寸不正确`);
    if (meta.get('twitter:card') !== 'summary_large_image') failures.push(`${url}: 应使用大图分享卡片`);
    if (/迟到的(?:句子|文字)/.test(head)) failures.push(`${url}: 分享元数据仍有已移除的旧文案`);
    if (url === '/' && (title !== 'GINLANG' || meta.get('og:site_name') !== 'GINLANG')) failures.push('首页标题应只保留 GINLANG');
    if (url.startsWith('/posts/')) {
      if (meta.get('og:type') !== 'article') failures.push(`${url}: 文章分享类型不正确`);
      if (!meta.get('article:published_time')) failures.push(`${url}: 缺少文章发布日期`);
      const article = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((match) => JSON.parse(match[1])).find((item) => item['@type'] === 'BlogPosting');
      if (article?.image !== meta.get('og:image')) failures.push(`${url}: 结构化数据与分享封面不一致`);
      if (article?.datePublished !== meta.get('article:published_time')) failures.push(`${url}: 分享发布日期与作品不一致`);
      if (!article?.author && (meta.has('article:author') || meta.has('author'))) failures.push(`${url}: 匿名作品不应输出作者元数据`);
    }
    try {
      const image = new URL(meta.get('og:image'));
      if (image.origin !== origin || image.protocol !== 'https:' || !image.pathname.endsWith('.png') || !/^[a-f0-9]{16}$/.test(image.searchParams.get('v') ?? '')) throw new Error('应为本站 HTTPS PNG，带内容版本');
      images.add(decodeURIComponent(image.pathname));
    } catch (error) { failures.push(`${url}: 无效分享封面地址（${error.message}）`); }
  }
  for (const image of images) {
    try {
      const file = path.resolve(output, image.replace(/^\//, ''));
      if (!file.startsWith(output + path.sep)) throw new Error('超出站点目录');
      const bytes = await readFile(file);
      const info = await sharp(bytes).metadata();
      if (info.format !== 'png' || info.width !== 1200 || info.height !== 630) throw new Error('实际图片不是 1200×630 PNG');
      if (bytes.length > 2 * 1024 * 1024) throw new Error('封面超过 2 MB');
    } catch (error) { failures.push(`${image}: 分享封面不可用（${error.message}）`); }
  }
  return failures;
}
