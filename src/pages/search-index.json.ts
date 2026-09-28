import { getCollection } from 'astro:content';
import { categoryLabel } from '../lib/categories';
import { formatDate } from '../lib/date';

const base = import.meta.env.BASE_URL.replace(/\/$/, '');

export async function GET() {
  const posts = (await getCollection('posts', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime(),
  );
  const authors = new Map((await getCollection('authors')).map((author) => [author.id, author]));
  const index = posts.map((post) => {
    const author = authors.get(post.data.author.id);
    if (!author) throw new Error(`作品 ${post.id} 引用了不存在的作者`);
    return {
      title: post.data.title,
      excerpt: post.data.excerpt,
      body: (post.body ?? '')
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/<[^>]+>/g, ' ')
        .replace(/[#*_`>~]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim(),
      category: categoryLabel(post.data.category),
      author: author.data.name,
      date: formatDate(post.data.date),
      url: base + '/posts/' + post.id + '/',
    };
  });

  return new Response(JSON.stringify(index), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
