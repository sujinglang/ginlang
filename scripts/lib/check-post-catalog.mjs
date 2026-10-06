const decode = (text) => text.replace(/&#(?:x([\da-f]+)|(\d+));/gi, (_, hex, decimal) => String.fromCodePoint(parseInt(hex || decimal, hex ? 16 : 10)))
  .replaceAll('&quot;', '"').replaceAll('&#39;', "'").replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&amp;', '&');
const textOf = (html) => decode(html.replace(/<[^>]+>/g, '')).trim();
const attribute = (html, name) => decode(html.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1] ?? '');
const pathOf = (url) => { if (!url) return ''; try { return decodeURI(new URL(url, 'https://ginlang.vip').pathname); } catch { return ''; } };

// Check relationships in the built artifact, not just whether a URL resolves.
// A fake title in a non-link card otherwise passes ordinary link checking.
export function checkPostCatalog(search, pages) {
  if (!Array.isArray(search)) return ['搜索索引应为文章数组'];
  const failures = [];
  const articles = new Map([...pages].filter(([url]) => /^\/posts\/[^/]+\/$/.test(url)).map(([url, page]) => [decodeURI(url), page]));
  const catalog = new Map();
  for (const item of search) {
    const url = pathOf(item.url);
    if (!url || !articles.has(url)) { failures.push(`搜索索引: 作品页面不存在 ${item.url}`); continue; }
    if (catalog.has(url)) failures.push(`搜索索引: 作品重复 ${url}`);
    if (typeof item.title !== 'string' || !item.title.trim() || typeof item.excerpt !== 'string' || !item.excerpt.trim()
      || item.excerpt === '此处需要您亲自填写') failures.push(`${url}: 标题或摘要尚未填写`);
    catalog.set(url, item);
  }
  const ordered = [...catalog.keys()];
  for (const [url, { html }] of articles) {
    const item = catalog.get(url);
    if (!item) { failures.push(`${url}: 文章未进入公开目录`); continue; }
    const heading = textOf(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)?.[1] ?? '');
    if (heading !== item.title || attribute(html, 'data-post-title') !== item.title) failures.push(`${url}: 页面标题与搜索目录不一致`);
    const deck = textOf(html.match(/<p\b[^>]*class="article-deck"[^>]*>([\s\S]*?)<\/p>/)?.[1] ?? '');
    if (deck !== item.excerpt) failures.push(`${url}: 页面摘要与搜索目录不一致`);
    const index = ordered.indexOf(url);
    const previous = ordered[index + 1];
    const next = ordered[index - 1];
    const expected = [previous, next].filter(Boolean);
    const nav = html.match(/<nav\b[^>]*class="article-neighbors"[^>]*>([\s\S]*?)<\/nav>/)?.[1];
    const cards = [...(nav ?? '').matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)];
    if (cards.length !== expected.length || (nav !== undefined && !expected.length)) failures.push(`${url}: 相邻文章数量与公开目录不一致`);
    if (nav?.replace(/<a\b[^>]*>[\s\S]*?<\/a>/g, '').trim()) failures.push(`${url}: 相邻文章区含有无对应作品的占位内容`);
    cards.forEach((card, cardIndex) => {
      const target = pathOf(attribute(card[1], 'href'));
      const title = textOf(card[2].match(/<strong\b[^>]*>([\s\S]*?)<\/strong>/)?.[1] ?? '');
      if (target !== expected[cardIndex] || title !== catalog.get(target)?.title) failures.push(`${url}: 相邻文章的地址、顺序或标题不匹配 ${target}`);
    });
    if (pathOf(attribute(html, 'data-neighbor-prev')) !== (previous ?? '') || pathOf(attribute(html, 'data-neighbor-next')) !== (next ?? '')) failures.push(`${url}: 键盘相邻导航与可见入口不一致`);
    const schemas = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
      .map((match) => { try { return JSON.parse(match[1]); } catch { return undefined; } });
    const schema = schemas.find((value) => value?.['@type'] === 'BlogPosting');
    if (schema?.author?.name !== item.author) failures.push(`${url}: 作者元数据与公开署名不一致`);
    if (!item.author && /class="article-(?:byline|author)"/.test(html)) failures.push(`${url}: 匿名文章出现了作者模块`);
    const time = html.match(/class="post-meta article-meta"[^>]*>\s*<time\b[^>]*datetime="([^"]+)"/)?.[1];
    const later = ordered[index - 1] && articles.get(ordered[index - 1])?.html.match(/class="post-meta article-meta"[^>]*>\s*<time\b[^>]*datetime="([^"]+)"/)?.[1];
    if (time && later && new Date(time) > new Date(later)) failures.push(`${url}: 公开目录没有按日期从新到旧排列`);
  }
  const home = pages.get('/')?.html ?? '';
  const lastRead = home.match(/<p\b[^>]*\bdata-last-read\b[^>]*>/)?.[0];
  if (lastRead) {
    try {
      const records = JSON.parse(attribute(lastRead, 'data-posts'));
      if (!Array.isArray(records) || records.length !== catalog.size || new Set(records.map((record) => record.url)).size !== records.length
        || records.some((record) => catalog.get(pathOf(record.url))?.title !== record.title || !pathOf(record.url).endsWith('/posts/' + record.id + '/'))) failures.push('首页: 阅读记录目录包含失效作品或旧标题');
    } catch { failures.push('首页: 阅读记录缺少有效公开目录'); }
  }
  for (const [url, { html }] of pages) {
    if (/<a\b[^>]*href="[^"]*\/rss\.xml"/.test(html)) failures.push(`${url}: 页面出现了已移除的 RSS 订阅入口`);
    if (/^\/authors\/[^/]+\/$/.test(url)) {
      const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1] ?? '';
      for (const [postUrl, item] of catalog) {
        if (!item.author && main.includes(`href="${postUrl}"`)) failures.push(`${url}: 作者页推荐了匿名作品 ${postUrl}`);
      }
    }
    if (/class="(?:about-placeholder|[^"]*\bis-placeholder\b)|class="neighbor-card neighbor-placeholder/.test(html)) failures.push(`${url}: 公开页面含有编辑占位块`);
  }
  return failures;
}
