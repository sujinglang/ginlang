import type { CollectionEntry } from 'astro:content';
import { getCollection } from 'astro:content';
import { getPostShareCard, renderShareCard } from '../../lib/shareCard';

export async function getStaticPaths() {
  const posts = await getCollection('posts', ({ data }) => import.meta.env.DEV || !data.draft);
  return posts.map((post) => ({ params: { slug: post.id }, props: { post } }));
}

export async function GET({ props }: { props: { post: CollectionEntry<'posts'> } }) {
  const card = await getPostShareCard(props.post);
  return new Response(await renderShareCard(card), { headers: { 'Content-Type': 'image/png' } });
}
