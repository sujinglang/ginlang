import { getCollection } from 'astro:content';
import { categories } from '../lib/categories';
import topicRecords from '../content/topics.json';

const base = import.meta.env.BASE_URL.replace(/\/$/, '');
const site = import.meta.env.SITE ?? 'https://sujinglang.github.io';
const escapeXml = (value: string) =>
  value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

export async function GET() {
  const posts = await getCollection('posts', ({ data }) => !data.draft);
  const authors = await getCollection('authors');
  const topics = Object.keys(topicRecords).length ? await getCollection('topics', ({ data }) => !data.draft) : [];
  const paths = [
    { path: '/', modified: undefined },
    { path: '/writing/', modified: undefined },
    { path: '/authors/', modified: undefined },
    { path: '/contribute/', modified: undefined },
    { path: '/archive/', modified: undefined },
    { path: '/about/', modified: undefined },
    ...(topics.length ? [{ path: '/topics/', modified: undefined }] : []),
    ...categories.map((category) => ({ path: '/category/' + category.slug + '/', modified: undefined })),
    ...authors.map((author) => ({ path: '/authors/' + encodeURIComponent(author.id) + '/', modified: undefined })),
    ...topics.map((topic) => ({ path: '/topics/' + encodeURIComponent(topic.id) + '/', modified: undefined })),
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
