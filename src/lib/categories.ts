export const categories = [
  { slug: 'essay', label: '随笔', description: '随笔与日常记录。' },
  { slug: 'diary', label: '日记', description: '把经过的日子轻轻记下。' },
  { slug: 'book', label: '书摘', description: '读书时留下的片段与想法。' },
  { slug: 'short', label: '短句', description: '短一点，也值得留下的话。' },
  { slug: 'huiji', label: '汇记', description: '收集他人言语，记在本处。' },
] as const;

export function categoryLabel(slug: string): string {
  return categories.find((category) => category.slug === slug)?.label ?? '随笔';
}

/** 汇记有自己的入口页；其余分类走 /category/<slug>/。 */
export function categoryPath(slug: string): string {
  return slug === 'huiji' ? '/huiji/' : '/category/' + slug + '/';
}
