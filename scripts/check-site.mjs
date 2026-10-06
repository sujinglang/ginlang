import { readdir, readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkPostCatalog } from './lib/check-post-catalog.mjs';
import { checkShareMetadata } from './lib/check-share-metadata.mjs';

// Verify the actual publish artifact, including URLs inside compiled stylesheets.
const project = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(project, 'dist');
const origin = 'https://ginlang.vip';
// A path with Chinese characters is percent-encoded in canonical links and href
// attributes, so both sides are decoded before they are compared.
const decodePath = (value) => {
  try { return decodeURI(value); } catch { return value; }
};
const files = [];
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(file);
    else files.push(file);
  }
}
try { await walk(output); }
catch { console.error('请先运行 npm run build，生成要检查的发布文件。'); process.exit(1); }

const pages = new Map();
for (const file of files.filter((file) => file.endsWith('.html'))) {
  const relative = path.relative(output, file).replaceAll(path.sep, '/');
  const url = '/' + relative.replace(/index\.html$/, '');
  const html = await readFile(file, 'utf8');
  pages.set(url, { file, html, ids: new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1])) });
}
const failures = [];
let references = 0;
const checked = new Set();
const decode = (value) => value.replaceAll('&amp;', '&').replaceAll('&#39;', "'").replaceAll('&quot;', '"');
async function checkReference(raw, from) {
  if (!raw || /^(data:|mailto:|tel:|javascript:)/i.test(raw)) return;
  let url;
  try { url = new URL(decode(raw), origin + from); }
  catch { failures.push(`${from}: 无效地址 ${raw}`); return; }
  if (url.origin !== origin) return;
  const target = decodeURIComponent(url.pathname);
  if (url.hash) {
    const page = pages.get(target);
    if (page && !page.ids.has(decodeURIComponent(url.hash.slice(1)))) failures.push(`${from}: 锚点不存在 ${raw}`);
  }
  if (checked.has(target)) return;
  checked.add(target);
  references += 1;
  const relative = target.replace(/^\//, '');
  const destination = path.resolve(output, relative, target.endsWith('/') ? 'index.html' : '');
  if (!destination.startsWith(output + path.sep)) { failures.push(`${from}: 地址超出站点目录 ${raw}`); return; }
  try { await access(destination); }
  catch { failures.push(`${from}: 文件不存在 ${raw}`); }
}

for (const [url, { html }] of pages) {
  if ((html.match(/<h1\b/g) || []).length !== 1) failures.push(`${url}: 主标题数量应为 1`);
  if (!html.includes('lang="zh-CN"')) failures.push(`${url}: 缺少页面语言`);
  if (!html.includes('href="#main-content"')) failures.push(`${url}: 缺少跳到正文入口`);
  const canonical = html.match(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/)?.[1];
  if (canonical === undefined || decodePath(canonical) !== decodePath(origin + url)) {
    failures.push(`${url}: canonical 不匹配正式地址`);
  }
  for (const match of html.matchAll(/\b(?:href|src|data-src)="([^"]+)"/g)) await checkReference(match[1], url);
  for (const match of html.matchAll(/\b(?:srcset|data-srcset)="([^"]+)"/g)) {
    for (const candidate of match[1].split(',')) await checkReference(candidate.trim().split(/\s+/)[0], url);
  }
  for (const match of html.matchAll(/<img\b[^>]*>/g)) {
    if (!/\salt(?:=|\s|>)/.test(match[0])) failures.push(`${url}: 图片缺少替代文字`);
    if (!/\bwidth=/.test(match[0]) || !/\bheight=/.test(match[0])) failures.push(`${url}: 图片缺少尺寸`);
  }
}
for (const file of files.filter((file) => file.endsWith('.css'))) {
  const url = '/' + path.relative(output, file).replaceAll(path.sep, '/');
  const css = await readFile(file, 'utf8');
  for (const match of css.matchAll(/url\(["']?([^"')]+)["']?\)/g)) await checkReference(match[1], url);
}
for (const required of ['/rss.xml', '/sitemap.xml', '/search-index.json', '/CNAME']) await checkReference(required, '/');
const cname = (await readFile(path.join(output, 'CNAME'), 'utf8')).trim();
if (cname !== 'ginlang.vip') failures.push('CNAME 应保留 ginlang.vip');
const search = JSON.parse(await readFile(path.join(output, 'search-index.json'), 'utf8'));
failures.push(...checkPostCatalog(search, pages));
failures.push(...await checkShareMetadata(pages, output, origin));
if (Array.isArray(search)) for (const item of search) await checkReference(item.url, '/search-index.json');
const rss = await readFile(path.join(output, 'rss.xml'), 'utf8');
for (const match of rss.matchAll(/<link>([^<]+)<\/link>/g)) await checkReference(match[1], '/rss.xml');
const sitemap = await readFile(path.join(output, 'sitemap.xml'), 'utf8');
for (const match of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) await checkReference(match[1], '/sitemap.xml');
if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; }
else console.log(`发布检查通过：${pages.size} 个页面，${references} 个内部地址与资源；文章目录、相邻标题与导航、匿名署名、阅读记录目录、主标题、锚点、图片、canonical、搜索、RSS、OG 分享元数据与 PNG 封面、域名配置正常。`);
