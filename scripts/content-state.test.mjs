import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import vm from 'node:vm';
import test from 'node:test';
import { checkPostCatalog } from './lib/check-post-catalog.mjs';

const newer = { title: '新文章', excerpt: '新文章的摘要', url: '/posts/newer/' };
const older = { title: '旧文章', excerpt: '旧文章的摘要', url: '/posts/older/' };
const link = (item) => `<a class="neighbor-card" href="${item.url}"><span>相邻文章</span><strong>${item.title}</strong></a>`;
const page = (item, previous, next, extra = '') => ({ html:
  `<article data-post-title="${item.title}"${previous ? ` data-neighbor-prev="${previous.url}"` : ''}${next ? ` data-neighbor-next="${next.url}"` : ''}>` +
  `<h1>${item.title}</h1><p class="article-deck">${item.excerpt}</p>` +
  (previous || next || extra ? `<nav class="article-neighbors">${previous ? link(previous) : ''}${next ? link(next) : ''}${extra}</nav>` : '') + '</article>' });

test('no articles and a single article have no invented neighbors', () => {
  assert.deepEqual(checkPostCatalog([], new Map()), []);
  assert.deepEqual(checkPostCatalog([newer], new Map([[newer.url, page(newer)]])), []);
});
test('both ends of a two-article archive link only to the other article', () => {
  assert.deepEqual(checkPostCatalog([newer, older], new Map([[newer.url, page(newer, older)], [older.url, page(older, undefined, newer)]])), []);
});
test('a fabricated unlinked title is rejected even if all real URLs are valid', () => {
  const pages = new Map([[newer.url, page(newer, older)], [older.url, page(older, undefined, newer, '<div class="neighbor-card"><strong>从第一封信开始</strong></div>')]]);
  assert.ok(checkPostCatalog([newer, older], pages).some((failure) => failure.includes('占位内容')));
});
test('old titles and deleted search entries are rejected', () => {
  const stale = { ...older, title: '过时标题' };
  const pages = new Map([[newer.url, page(newer, stale)], [older.url, page(older, undefined, newer)]]);
  assert.ok(checkPostCatalog([newer, older], pages).some((failure) => failure.includes('标题不匹配')));
  assert.ok(checkPostCatalog([newer, older], new Map([[newer.url, page(newer)]])).some((failure) => failure.includes('页面不存在')));
});
test('anonymous works must not appear in an author list or author module', () => {
  const pages = new Map([[newer.url, { html: page(newer).html + '<aside class="article-author">GINLANG</aside>' }], ['/authors/ginlang/', { html: `<main>${link(newer)}</main>` }]]);
  const failures = checkPostCatalog([newer], pages);
  assert.ok(failures.some((failure) => failure.includes('作者模块')));
  assert.ok(failures.some((failure) => failure.includes('推荐了匿名作品')));
});

// Execute the actual browser functions against a small DOM/storage harness.
// Fixtures do not modify the user's browser records or source manuscripts.
const homeSource = await readFile(new URL('../src/pages/index.astro', import.meta.url), 'utf8');
const lastReadFunction = stripTypeScriptTypes(homeSource.slice(homeSource.indexOf('  function initLastRead()'), homeSource.indexOf('  function initRandomPost()')));
const records = [{ id: 'older', title: '萧萧秋风', url: '/posts/older/' }];
function lastRead(raw, storageUnavailable = false) {
  const note = { dataset: { posts: JSON.stringify(records) }, hidden: true, textContent: '', children: [], append(child) { this.children.push(child); } };
  const context = vm.createContext({
    document: { querySelector: () => note, createElement: () => ({}) },
    localStorage: { getItem: () => { if (storageUnavailable) throw Error('unavailable'); return raw; }, setItem: () => assert.fail('private storage must not be changed') },
  });
  vm.runInContext(lastReadFunction + '\ninitLastRead();', context);
  return note;
}
test('reading history uses the current title and ignores removed/unpublished IDs', () => {
  const renamed = lastRead(JSON.stringify({ id: 'older', title: '于秋风中成长' }));
  assert.equal(renamed.hidden, false);
  assert.equal(renamed.children[0].textContent, '《萧萧秋风》');
  assert.equal(renamed.children[0].href, '/posts/older/');
  for (const id of ['removed', 'draft', '../../missing']) assert.equal(lastRead(JSON.stringify({ id, title: '旧缓存' })).hidden, true);
});
test('invalid or unavailable reading storage leaves the recommendation hidden', () => {
  for (const raw of ['', '{', 'null', '{}']) assert.equal(lastRead(raw).hidden, true);
  assert.equal(lastRead('', true).hidden, true);
});

const layoutSource = await readFile(new URL('../src/layouts/SiteLayout.astro', import.meta.url), 'utf8');
const loadFunction = layoutSource.slice(layoutSource.indexOf('      function getSearchItems()'), layoutSource.indexOf('      function highlighted('));
const searchFunction = layoutSource.slice(layoutSource.indexOf('      async function updateSearch()'), layoutSource.indexOf('      function openSearch()'));
function searchHarness(fetch) {
  const status = { textContent: '' };
  const found = [];
  const context = vm.createContext({ fetch, indexUrl: '/search-index.json', searchItemsPromise: undefined, searchRevision: 0,
    searchInput: { value: '关键词' }, searchResults: { replaceChildren: () => { found.length = 0; } }, searchStatus: status,
    searchDialog: { open: true }, showSearchResult: (item) => found.push(item) });
  vm.runInContext(stripTypeScriptTypes(loadFunction + searchFunction), context);
  return { status, found, update: () => vm.runInContext('updateSearch()', context) };
}
test('search distinguishes a failed fetch, an empty catalog, and no matches, and retries failures', async () => {
  let calls = 0;
  const retry = searchHarness(async () => { calls++; if (calls === 1) throw Error('offline'); return { ok: true, json: async () => [] }; });
  await retry.update();
  assert.match(retry.status.textContent, /加载失败.*重试/);
  await retry.update();
  assert.equal(calls, 2);
  assert.equal(retry.status.textContent, '暂无已发布文章。');
  const misses = searchHarness(async () => ({ ok: true, json: async () => [{ ...older, body: '', category: '', tags: [] }] }));
  await misses.update();
  assert.match(misses.status.textContent, /没有找到相关文章/);
});
test('search matches actual tag metadata even when the word is absent from the body', async () => {
  const tagged = { ...older, body: '', category: '', tags: ['关键词'] };
  const search = searchHarness(async () => ({ ok: true, json: async () => [tagged] }));
  await search.update();
  assert.deepEqual(search.found, [tagged]);
});
