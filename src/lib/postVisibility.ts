import type { CollectionEntry } from 'astro:content';

type Post = CollectionEntry<'posts'>;

/** The author reference stays in the source; only public attribution changes. */
export function hasPublicAuthor(post: Post) {
  return !post.data.anonymous;
}

/** Author pages and personal recommendations must not identify anonymous work. */
export function isPubliclyBy(post: Post, authorId: string) {
  return hasPublicAuthor(post) && post.data.author.id === authorId;
}
