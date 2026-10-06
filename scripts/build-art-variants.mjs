import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
const root = fileURLToPath(new URL('../', import.meta.url));
const images = new Set([
  'authors/ginlang-forest.webp', 'authors/ginlang-avatar.webp',
  'sea-morning-animated.webp', 'forest-waterfall-animated.webp', 'diary-moon-animated.webp',
]);
const portraits = new Set(['authors/ginlang-avatar.webp']);
for (const file of await readdir(path.join(root, 'src/content/authors'))) {
  if (!file.endsWith('.json')) continue;
  const author = JSON.parse(await readFile(path.join(root, 'src/content/authors', file), 'utf8'));
  for (const key of ['portrait', 'cover']) {
    if (author[key]?.endsWith('.webp')) images.add(author[key].replace(/^\/+/, ''));
  }
  if (author.portrait) portraits.add(author.portrait.replace(/^\/+/, ''));
}
const manifest = {};
for (const file of images) {
  const source = path.join(root, 'public', file);
  const { width: originalWidth } = await sharp(source).metadata();
  const widths = portraits.has(file) ? [96, 240, 480, 640] : [480, 800];
  manifest[file] = [];
  for (const width of widths.filter((width) => width < originalWidth)) {
    const copy = file.replace(/\.webp$/, `-${width}w.webp`);
    await sharp(source).resize({ width }).webp({ quality: 84, effort: 5 }).toFile(path.join(root, 'public', copy));
    manifest[file].push({ file: copy, width });
  }
  manifest[file].push({ file, width: originalWidth });
}
await writeFile(path.join(root, 'src/data/artVariants.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`已生成 ${images.size} 组响应式插画，保留原图与自然比例。`);
