// Generates the responsive copies used by the home gallery:
// 01-chongqing-night.webp → 01-chongqing-night-480w.webp / -800w.webp
// Run once after adding or replacing paintings in public/hero-watercolors/,
// then commit the generated files together with the originals.
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'public', 'hero-watercolors');
const WIDTHS = [480, 800];
const originals = readdirSync(dir).filter((file) => file.endsWith('.webp') && !/-\d+w\.webp$/.test(file)).sort();

for (const file of originals) {
  const stem = file.replace(/\.webp$/, '');
  for (const width of WIDTHS) {
    const out = path.join(dir, `${stem}-${width}w.webp`);
    await sharp(path.join(dir, file))
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(out);
    console.log('wrote', `${stem}-${width}w.webp`);
  }
}
console.log(`done: ${originals.length} originals × ${WIDTHS.length} sizes`);
