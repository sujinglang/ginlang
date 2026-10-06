import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { getEntry, type CollectionEntry } from 'astro:content';
import sharp from 'sharp';
import { categoryLabel } from './categories';
import { formatDate } from './date';

// Template revisions, text changes, and image changes update the image URL.
// Article URLs and canonical addresses stay stable.
const REVISION = 'paper-watercolor-2026-10-06';
const W = 1200;
const H = 630;
const PAPER = '#f5f2eb';
const INK = '#292b27';
const MUTED = '#65685f';
const LINE = '#dad5cb';
const GREEN = '#40574a';
const CLAY = '#a66048';
const SERIF = "'Noto Serif CJK SC','Noto Serif SC','Source Han Serif SC','SimSun','Microsoft YaHei',serif";
const SANS = "'Noto Sans CJK SC','Noto Sans SC','Microsoft YaHei','Arial',sans-serif";

export type ShareCard = {
  title: string;
  description: string;
  details: string;
  home?: boolean;
  image?: Buffer;
  url: string;
  alt: string;
};

function cardUrl(path: string, card: Omit<ShareCard, 'url' | 'alt'>) {
  const fingerprint = createHash('sha256')
    .update(REVISION)
    .update(JSON.stringify([card.title, card.description, card.details, card.home]))
    .update(card.image ?? Buffer.alloc(0))
    .digest('hex').slice(0, 16);
  return `${path}?v=${fingerprint}`;
}

export async function getHomeShareCard(): Promise<ShareCard> {
  const card = {
    title: '吹箫凌极浦\n日暮送夫君\n湖上一回首\n青山卷白云',
    description: '',
    details: '随笔 · 日记 · 书摘 · 短句',
    home: true,
    image: await readFile(resolve('public/hero-watercolors/04-boat-under-clouds.webp')),
  };
  return { ...card, url: cardUrl('/social-card.png', card), alt: 'GINLANG 分享封面：四行诗句与云下小舟的水彩画。' };
}

export async function getPostShareCard(post: CollectionEntry<'posts'>): Promise<ShareCard> {
  // Use existing uploaded artwork. A text-only work gets a text-only cover.
  // Skip code blocks and remote images; never fetch arbitrary Markdown URLs.
  const body = (post.body ?? '').replace(/```[\s\S]*?```|~~~[\s\S]*?~~~/g, '');
  const imagePath = body.match(/!\[[^\]]*\]\(\s*(?:<)?(\.\/images\/[^\s)>]+)(?:>)?(?:\s+[^)]*)?\)/)?.[1];
  let image: Buffer | undefined;
  if (imagePath) {
    const imageRoot = resolve('src/content/posts/images');
    const file = resolve('src/content/posts', imagePath);
    if (!file.startsWith(imageRoot + sep)) throw new Error(`分享封面路径超出作品图片目录：${post.id}`);
    image = await readFile(file);
  }
  const author = post.data.anonymous ? undefined : await getEntry(post.data.author);
  const card = {
    title: post.data.title,
    description: post.data.excerpt,
    details: [categoryLabel(post.data.category), formatDate(post.data.date), author?.data.name].filter(Boolean).join(' · '),
    image,
  };
  return {
    ...card,
    url: cardUrl(`/og/${post.id}.png`, card),
    alt: `《${post.data.title}》分享封面：标题与摘要${image ? '，配作品中的图片' : '，纸白底色与灰绿细线'}。`,
  };
}

const xml = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
const isWide = (char: string) => /[\u2e80-\u9fff\uF900-\uFAFF\uFF00-\uFFEF\u3000-\u303F]/.test(char);
const width = (value: string, size: number) => [...value].reduce((sum, char) => sum + size * (isWide(char) ? 1 : /[MW@]/.test(char) ? .85 : .58), 0);

function wrap(value: string, size: number, maxWidth: number) {
  const lines: string[] = [];
  for (const paragraph of value.split('\n')) {
    let line = '';
    for (const char of [...paragraph]) {
      if (line && width(line + char, size) > maxWidth) {
        // Keep closing Chinese punctuation with the preceding character.
        if (/^[，。！？；：、）》”’]$/.test(char)) {
          lines.push(line.slice(0, -1));
          line = line.slice(-1) + char;
        } else { lines.push(line.trim()); line = char; }
      } else line += char;
    }
    if (line) lines.push(line.trim());
  }
  return lines;
}

function fitTitle(title: string, maxWidth: number, home: boolean) {
  for (const size of (home ? [48] : [76, 68, 60, 52, 44, 36])) {
    const lines = wrap(title, size, maxWidth);
    const fitsHeight = lines.length < 3 || 206 + (lines.length - 1) * size * 1.34 + 65 + 2 * 39 <= 515;
    if (lines.length <= (home ? 4 : 3) && (home || fitsHeight)) return { size, lines };
  }
  throw new Error(`分享封面标题过长，请检查：${title}`);
}

function text(value: string, x: number, y: number, size: number, color: string, serif = false) {
  return `<text x="${x}" y="${y}" font-family="${serif ? SERIF : SANS}" font-size="${size}" fill="${color}">${xml(value)}</text>`;
}

export async function renderShareCard(card: ShareCard): Promise<Buffer> {
  const maxWidth = card.image ? 536 : 1040;
  const title = fitTitle(card.title, maxWidth, Boolean(card.home));
  const lineHeight = title.size * 1.34;
  const firstBaseline = card.home ? 208 : title.lines.length === 1 ? 272 : 206;
  const lastBaseline = firstBaseline + (title.lines.length - 1) * lineHeight;
  const description = wrap(card.description, 27, maxWidth);
  if (description.length > 3) {
    description.length = 3;
    description[2] = description[2].slice(0, -1) + '…';
  }
  const pieces = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`,
    `<rect width="${W}" height="${H}" fill="${PAPER}"/>`,
    `<path d="M64 30h1072" stroke="${LINE}"/>`,
    `<path d="M64 30h132" stroke="${GREEN}" stroke-width="3"/>`,
    `<text x="64" y="95" font-family="Arial,sans-serif" font-size="30" font-weight="700" letter-spacing="6" fill="${INK}">GINLANG</text>`,
    `<g transform="translate(1118 84)" stroke="${CLAY}" stroke-width="1.8" stroke-linecap="round"><path d="M-12 0h24M0-12v24M-8.5-8.5l17 17M-8.5 8.5l17-17"/></g>`,
    ...title.lines.map((line, index) => text(line, 64, firstBaseline + index * lineHeight, title.size, card.home ? GREEN : INK, true)),
    ...description.map((line, index) => text(line, 64, lastBaseline + 65 + index * 39, 27, MUTED)),
    `<path d="M64 548h1072" stroke="${LINE}"/>`,
    text(card.details, 64, 590, 21, MUTED),
    `<text x="1136" y="590" text-anchor="end" font-family="Arial,sans-serif" font-size="23" fill="${GREEN}">ginlang.vip</text>`,
  ];
  if (card.image) {
    // Preserve the entire painting and its proportions inside a quiet paper frame.
    const painting = await sharp(card.image).rotate().resize({ width: 454, height: 362, fit: 'inside' }).png().toBuffer({ resolveWithObject: true });
    const x = 672 + (454 - painting.info.width) / 2;
    const y = 150 + (362 - painting.info.height) / 2;
    pieces.push(`<rect x="658" y="136" width="482" height="390" fill="#faf8f3" stroke="${LINE}"/>`);
    pieces.push(`<image x="${x}" y="${y}" width="${painting.info.width}" height="${painting.info.height}" href="data:image/png;base64,${painting.data.toString('base64')}"/>`);
  }
  pieces.push('</svg>');
  // A rasterization error fails the build rather than publishing a wrong title.
  return sharp(Buffer.from(pieces.join(''))).png({ compressionLevel: 9, palette: true, colours: 256, dither: .2 }).toBuffer();
}
