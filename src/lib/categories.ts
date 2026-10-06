export const categories = [
  { slug: 'essay', label: '随笔', description: '随笔与日常记录。' },
  { slug: 'diary', label: '日记', description: '把经过的日子轻轻记下。' },
  { slug: 'book', label: '书摘', description: '读书时留下的片段与想法。' },
  { slug: 'short', label: '短句', description: '短一点，也值得留下的话。' },
] as const;

export function categoryLabel(slug: string): string {
  return categories.find((category) => category.slug === slug)?.label ?? '随笔';
}
