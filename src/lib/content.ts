import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import topicRecords from '../content/topics.json';

type Author = CollectionEntry<'authors'>;
type Post = CollectionEntry<'posts'>;

/** Keep published lists in their existing newest-first order. Draft preview
 * routes in posts/ and og/ deliberately keep their separate DEV behavior. */
export function newestFirst(posts: Post[]) {
  return [...posts].sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

/** Directory order; the home guest selection only sorts by order. */
export function directoryOrder(authors: Author[]) {
  return [...authors].sort((a, b) => a.data.order - b.data.order || a.data.name.localeCompare(b.data.name, 'zh-CN'));
}

/** Read fresh content on each call so editing in astro dev never reuses a
 * stale module cache. This is the common place for cross-file validation. */
export async function loadEditorialContent() {
  const [allPosts, authors, albums, allTopics] = await Promise.all([
    getCollection('posts'),
    getCollection('authors'),
    getCollection('albums'),
    Object.keys(topicRecords).length ? getCollection('topics') : Promise.resolve([]),
  ]);
  const authorById = new Map(authors.map((author) => [author.id, author]));
  const postById = new Map(allPosts.map((post) => [post.id, post]));
  const albumById = new Map(albums.map((album) => [album.id, album]));

  for (const post of allPosts) {
    if (!authorById.has(post.data.author.id)) {
      throw new Error(`作品 ${post.id} 引用了不存在的作者 ${post.data.author.id}`);
    }
  }
  for (const author of authors) {
    if (!author.data.featuredPost) continue;
    const selected = postById.get(author.data.featuredPost.id);
    if (!selected || selected.data.author.id !== author.id || selected.data.draft) {
      throw new Error(`作者 ${author.id} 的代表作无效或尚未发布`);
    }
  }
  for (const topic of allTopics) {
    for (const reference of topic.data.posts) {
      const post = postById.get(reference.id);
      if (!post || (!topic.data.draft && post.data.draft)) {
        throw new Error(`专题 ${topic.id} 引用了不存在或未发布的作品 ${reference.id}`);
      }
    }
  }
  for (const album of albums) {
    if (!authorById.has(album.id)) throw new Error(`相册 ${album.id} 没有对应的作者`);
  }
  const founder = authors.find((author) => author.data.role === 'founder');
  const albumFounder = directoryOrder(authors).find((author) => author.data.role === 'founder');
  if (albumFounder && !albumById.has(albumFounder.id)) {
    throw new Error(`缺少 src/content/albums/${albumFounder.id}.json，创办人相册必须存在`);
  }

  return {
    allPosts,
    publishedPosts: newestFirst(allPosts.filter((post) => !post.data.draft)),
    authors,
    founder,
    albums,
    topics: allTopics.filter((topic) => !topic.data.draft).sort((a, b) => a.data.order - b.data.order),
    authorById,
    postById,
    albumById,
  };
}
