import { getCollection } from 'astro:content';
import sharp from 'sharp';
import { categoryLabel } from '../../lib/categories';

// Per-post share images, rendered at build time from an SVG template with sharp
// (already available as Astro's image service dependency, so nothing new to install).
// Chinese text needs CJK fonts on the build machine; the deploy workflow installs
// fonts-noto-cjk before building.

const W = 1200;
const H = 630;
const PAPER = '#f5f2eb';
const INK = '#292b27';
const MUTED = '#65685f';
const LINE = '#dad5cb';
const ACCENT = '#596b5c';
const CLAY = '#a66048';
const SERIF = `'Noto Serif CJK SC','Noto Serif SC','Source Han Serif SC','Noto Sans CJK SC','Songti SC','SimSun','Microsoft YaHei',serif`;
const SANS_CJK = `'Noto Sans CJK SC','Noto Sans SC','Microsoft YaHei','PingFang SC',sans-serif`;

const escapeXml = (value: string) =>
  value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');

// Rough advance widths: CJK glyphs are full-width, everything else leans narrow.
const isWideChar = (char: string) => /[\u2e80-\u9fff\uF900-\uFAFF\uFF00-\uFFEF\u3000-\u303F]/.test(char);
const textWidth = (text: string, size: number) =>
  [...text].reduce((sum, char) => sum + (isWideChar(char) ? size : size * 0.58), 0);

function wrapTitle(title: string, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const char of Array.from(title)) {
    if (line && textWidth(line + char, size) > maxWidth) {
      lines.push(line);
      line = char;
    } else {
      line += char;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function titleLines(title: string): { lines: string[]; size: number } {
  const maxWidth = 720;
  for (const size of [64, 52, 44]) {
    const lines = wrapTitle(title, size, maxWidth);
    if (lines.length <= 3) return { lines, size };
  }
  return { lines: wrapTitle(title, 44, maxWidth).slice(0, 3), size: 44 };
}

function ornament(x: number, y: number): string {
  return [
    `<circle cx="${x}" cy="${y}" r="180" fill="none" stroke="${LINE}" stroke-width="2"/>`,
    `<circle cx="${x}" cy="${y}" r="157" fill="none" stroke="${LINE}" stroke-width="1" stroke-dasharray="3 8"/>`,
    `<circle cx="${x}" cy="${y}" r="132" fill="none" stroke="${CLAY}" stroke-opacity=".45"/>`,
    `<text x="${x}" y="${y + 25}" text-anchor="middle" font-family="Georgia,serif" font-size="100" fill="${ACCENT}">G</text>`,
    `<text x="${x - 2}" y="${y + 55}" text-anchor="middle" font-family="Arial,sans-serif" font-size="15" letter-spacing="7" fill="${MUTED}">LETTERS</text>`,
  ].join('');
}

function brandMark(x: number, y: number): string {
  return `<text x="${x}" y="${y}" font-family="Arial,sans-serif" font-size="20" font-weight="700" letter-spacing="6" fill="${INK}">GINLANG <tspan fill="${CLAY}">&#10035;</tspan></text>`;
}

function frame(): string {
  return [
    `<rect width="${W}" height="${H}" fill="${PAPER}"/>`,
    `<path d="M0 0h${W}v8H0z" fill="${ACCENT}"/>`,
  ].join('');
}

function postCardSvg(title: string, category: string, date: string): string {
  const { lines, size } = titleLines(title);
  const lineHeight = size * 1.34;
  const lastBaseline = 430;
  const titleText = lines
    .map((line, index) => `<text x="104" y="${(lastBaseline - (lines.length - 1 - index) * lineHeight).toFixed(1)}" font-family="${SERIF}" font-size="${size}" fill="${INK}">${escapeXml(line)}</text>`)
    .join('');
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + escapeXml(title) + '">',
    '<title>' + escapeXml(title) + '</title>',
    frame(),
    brandMark(102, 128),
    ornament(1010, 300),
    titleText,
    `<path d="M104 458h80" stroke="${CLAY}" stroke-width="2"/>`,
    `<text x="104" y="502" font-family="${SANS_CJK}" font-size="20" letter-spacing="2" fill="${MUTED}">${escapeXml(category)} · ${escapeXml(date)}</text>`,
    `<path d="M104 566h992" stroke="${LINE}" stroke-width="1"/>`,
    `<text x="104" y="598" font-family="${SANS_CJK}" font-size="13" letter-spacing="4" fill="${MUTED}">GINLANG · 写一些迟到的句子</text>`,
    '</svg>',
  ].join('');
}

// Shapes and Latin text only, for the rare case rasterization without CJK fonts fails.
function fallbackSvg(date: string): string {
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="GINLANG">',
    '<title>GINLANG</title>',
    frame(),
    brandMark(102, 128),
    ornament(1010, 300),
    `<text x="104" y="330" font-family="Georgia,serif" font-size="58" letter-spacing="10" fill="${INK}">A LETTER</text>`,
    `<path d="M104 458h80" stroke="${CLAY}" stroke-width="2"/>`,
    `<text x="104" y="502" font-family="Arial,sans-serif" font-size="20" letter-spacing="2" fill="${MUTED}">${escapeXml(date)}</text>`,
    `<path d="M104 566h992" stroke="${LINE}" stroke-width="1"/>`,
    `<text x="104" y="598" font-family="Arial,sans-serif" font-size="13" letter-spacing="4" fill="${MUTED}">GINLANG · A QUIET PLACE FOR WORDS</text>`,
    '</svg>',
  ].join('');
}

export async function getStaticPaths() {
  const posts = await getCollection('posts', ({ data }) => import.meta.env.DEV || !data.draft);
  return posts.map((post) => ({ params: { slug: post.id }, props: { post } }));
}

export async function GET({ props }: { props: { post: { data: { title: string; category: string; date: Date } } } }) {
  const { post } = props;
  const date = post.data.date.toISOString().slice(0, 10).replaceAll('-', '.');
  const svg = postCardSvg(post.data.title, categoryLabel(post.data.category), date);
  try {
    const png = await sharp(Buffer.from(svg), { density: 144 })
      .resize(W, H)
      .png({ compressionLevel: 9 })
      .toBuffer();
    return new Response(png, {
      headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=3600' },
    });
  } catch (error) {
    console.warn('OG 图生成失败，使用无中文的备用卡片：', error);
    const png = await sharp(Buffer.from(fallbackSvg(date)), { density: 144 })
      .resize(W, H)
      .png({ compressionLevel: 9 })
      .toBuffer();
    return new Response(png, { headers: { 'Content-Type': 'image/png' } });
  }
}
