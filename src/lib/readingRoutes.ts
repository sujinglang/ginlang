import type { CollectionEntry } from 'astro:content';

export const readingThemeLabels = {
  philosophy: '想法与选择',
  life: '日常与时间',
  love: '人与人之间',
  freedom: '自由与边界',
  direction: '路与方向',
} as const;

type Theme = keyof typeof readingThemeLabels;
type Post = CollectionEntry<'posts'>;

// The routes are made only from published posts carrying an explicit theme.
// Wait until the archive is substantial enough to offer a different way in.
export function buildReadingRoutes(posts: Post[]) {
  if (posts.length < 8) return [];
  const candidates = (Object.keys(readingThemeLabels) as Theme[])
    .map((theme) => ({
      theme,
      posts: posts.filter((post) => post.data.themes.includes(theme))
        .sort((a, b) => a.data.date.getTime() - b.data.date.getTime()),
    }))
    .filter((route) => route.posts.length >= 3)
    .sort((a, b) => b.posts.length - a.posts.length);
  const used = new Set<string>();
  const routes: { theme: Theme; posts: Post[] }[] = [];
  for (const candidate of candidates) {
    const distinct = candidate.posts.filter((post) => !used.has(post.id));
    if (distinct.length < 3) continue;
    const selection = distinct.slice(0, 3);
    selection.forEach((post) => used.add(post.id));
    routes.push({ theme: candidate.theme, posts: selection });
    if (routes.length === 2) break;
  }
  return routes;
}
