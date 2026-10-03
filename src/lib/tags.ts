export interface TagEntry {
  slug: string;
  label: string;
  count: number;
}

/**
 * Tags are written as free text in each post, so this keeps the display label
 * exactly as the author typed it and only normalizes the URL slug.
 */
export function tagSlug(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, '-');
}

export function collectTags(posts: { data: { tags: string[] } }[]): TagEntry[] {
  const bySlug = new Map<string, TagEntry>();
  for (const post of posts) {
    for (const raw of post.data.tags) {
      const label = raw.trim();
      const slug = tagSlug(label);
      if (!slug) continue;
      const existing = bySlug.get(slug);
      if (existing) existing.count += 1;
      else bySlug.set(slug, { slug, label, count: 1 });
    }
  }
  return [...bySlug.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'zh-CN'));
}