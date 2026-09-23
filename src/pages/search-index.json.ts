import { getCollection } from 'astro:content';
import { categoryLabel } from '../lib/categories';
import { formatDate } from '../lib/date';

const base = import.meta.env.BASE_URL.replace(/\/$/, '');

export async function GET() {
  const posts = (await getCollection('posts', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime(),
  );
  const index = posts.map((post) => ({
    title: post.data.title,
    excerpt: post.data.excerpt,
    category: categoryLabel(post.data.category),
    date: formatDate(post.data.date),
    url: base + '/posts/' + post.id + '/',
  }));

  return new Response(JSON.stringify(index), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
