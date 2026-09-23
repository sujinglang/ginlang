import { getCollection } from 'astro:content';
import { categories } from '../lib/categories';

const base = import.meta.env.BASE_URL.replace(/\/$/, '');
const site = import.meta.env.SITE ?? 'https://sujinglang.github.io';
const escapeXml = (value: string) =>
  value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

export async function GET() {
  const posts = await getCollection('posts', ({ data }) => !data.draft);
  const paths = [
    { path: '/', modified: undefined },
    { path: '/archive/', modified: undefined },
    { path: '/about/', modified: undefined },
    ...categories.map((category) => ({ path: '/category/' + category.slug + '/', modified: undefined })),
    ...posts.map((post) => ({
      path: '/posts/' + encodeURIComponent(post.id) + '/',
      modified: post.data.date.toISOString(),
    })),
  ];
  const entries = paths.map(({ path, modified }) => {
    const location = new URL(base + path, site).toString();
    return '<url><loc>' + escapeXml(location) + '</loc>' +
      (modified ? '<lastmod>' + modified + '</lastmod>' : '') + '</url>';
  }).join('');
  const xml = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
    entries + '</urlset>';

  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
