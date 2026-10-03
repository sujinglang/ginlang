/**
 * 本机内容工作台。
 *
 * 只在这台电脑上运行，不构建、不发布、不进入线上网站。
 * 它复用 scripts/content.mjs 的校验与写入规则，所以工作台能做的，
 * 命令行同样能做，两边不会写出不一致的内容。
 *
 * 用法：node scripts/workbench.mjs [--port 4322] [--open]
 */
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve, join } from 'node:path';
import { runContent } from './content.mjs';

const projectRoot = resolve(fileURLToPath(new URL('../', import.meta.url)));

const args = process.argv.slice(2);
const portIndex = args.indexOf('--port');
const port = portIndex === -1 ? 4322 : Number(args[portIndex + 1]) || 4322;
const shouldOpen = args.includes('--open');

const categories = [
  { value: 'essay', label: '随笔' },
  { value: 'diary', label: '日记' },
  { value: 'book', label: '书摘' },
  { value: 'short', label: '短句' },
];

/** Run a content command and return its message, so the UI shows the same text. */
async function run(...commandArgs) {
  try {
    return { ok: true, message: await runContent(commandArgs, { root: projectRoot }) };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

const page = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>GINLANG 内容工作台</title>
<style>
  :root { --paper:#F5F2EB; --card:#FCFAF6; --ink:#292B27; --muted:#65685F; --accent:#596B5C; --clay:#A66048; --line:#DAD5CB; }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--paper); color:var(--ink); font:15px/1.7 "Songti SC","Noto Serif CJK SC",Georgia,serif; }
  header { padding:34px 28px 20px; border-bottom:1px solid var(--line); }
  header h1 { margin:0 0 6px; font-size:28px; font-weight:500; }
  header p { margin:0; color:var(--muted); font-size:13px; }
  main { display:grid; grid-template-columns:repeat(auto-fit,minmax(320px,1fr)); gap:20px; padding:24px 28px 60px; align-items:stretch; }
  section { display:flex; flex-direction:column; background:var(--card); border:1px solid var(--line); padding:22px 24px 24px; }
  section > form { display:flex; flex-direction:column; flex:1; }
  h2 { margin:0 0 4px; font-size:19px; font-weight:500; }
  .hint { margin:0 0 18px; color:var(--muted); font-size:12.5px; }
  label { display:block; margin:14px 0 5px; color:var(--muted); font-size:12px; }
  input, select, textarea { width:100%; padding:9px 11px; border:1px solid var(--line); background:var(--paper); color:var(--ink); font:14px/1.6 inherit; }
  textarea { min-height:74px; resize:vertical; }
  .row { display:grid; grid-template-columns:1fr 1fr; gap:0 14px; }
  .check { display:flex; align-items:center; gap:9px; margin:16px 0; color:var(--ink); font-size:13.5px; min-height:32px; }
  .check input { width:18px; height:18px; flex:0 0 18px; accent-color:var(--accent); }
  button { margin-top:18px; min-height:44px; padding:10px 18px; border:1px solid var(--accent); background:var(--accent); color:#fff; cursor:pointer; font:14px/1.5 inherit; }
  button.ghost { background:transparent; color:var(--accent-deep,var(--accent)); }
  button:hover { border-bottom-color:var(--clay); }
  /* Keep the result area for feedback, but show nothing until there is a result. */
  output { display:block; margin-top:16px; padding:12px 14px; border-left:2px solid var(--line); background:var(--paper); color:var(--muted); font-size:12.5px; white-space:pre-wrap; word-break:break-all; }
  output:empty { display:none; }
  output.ok { border-left-color:var(--accent); color:var(--ink); }
  output.bad { border-left-color:var(--clay); color:var(--clay); }
  .list { margin:0; padding:0; list-style:none; font-size:12.5px; }
  .list li { display:flex; justify-content:space-between; gap:12px; padding:9px 0; border-top:1px solid var(--line); }
  .list b { font-weight:500; }
  .tag { color:var(--muted); }
</style>
</head>
<body>
<header>
  <h1>GINLANG 内容工作台</h1>
  <p>只在本机运行，不会上传或发布。新内容一律先建成草稿，网址保持不变。</p>
</header>
<main>
  <section>
    <h2>新建文章草稿</h2>
    <p class="hint">创建后是 draft: true，确认内容后再发布。</p>
    <form id="post-form">
      <label for="post-id">文章 ID（小写英文与连字符，决定网址）</label>
      <input id="post-id" name="id" placeholder="2026-10-01-autumn-note" required />
      <label for="post-title">标题</label>
      <input id="post-title" name="title" required />
      <div class="row">
        <div>
          <label for="post-author">作者</label>
          <select id="post-author" name="author"></select>
        </div>
        <div>
          <label for="post-category">分类</label>
          <select id="post-category" name="category">${categories.map((c) => `<option value="${c.value}">${c.label}</option>`).join('')}</select>
        </div>
      </div>
      <label for="post-excerpt">摘要</label>
      <textarea id="post-excerpt" name="excerpt"></textarea>
      <label for="post-tags">标签（逗号分隔，可留空）</label>
      <input id="post-tags" name="tags" placeholder="阅读, 独处" />
      <label class="check"><input type="checkbox" id="post-anonymous" /> 对外匿名（源文件仍保留真实作者）</label>
      <button type="submit">创建草稿</button>
      <output id="post-out" aria-live="polite"></output>
    </form>
  </section>

  <section>
    <h2>更新已有文章</h2>
    <p class="hint">只改头部字段，正文和网址不动。</p>
    <form id="update-form">
      <label for="update-id">选择文章</label>
      <select id="update-id" name="id"></select>
      <label for="update-title">标题（留空则不改）</label>
      <input id="update-title" name="title" />
      <label for="update-excerpt">摘要（留空则不改）</label>
      <textarea id="update-excerpt" name="excerpt"></textarea>
      <label for="update-tags">标签（逗号分隔）</label>
      <input id="update-tags" name="tags" />
      <label class="check"><input type="checkbox" id="update-draft" /> 设为草稿（不发布）</label>
      <label class="check"><input type="checkbox" id="update-anonymous" /> 对外匿名</label>
      <button type="submit">保存改动</button>
      <output id="update-out" aria-live="polite"></output>
    </form>
  </section>

  <section>
    <h2>添加客席作者</h2>
    <p class="hint">只填本人确认的笔名和介绍，同时创建空相册。</p>
    <form id="author-form">
      <label for="author-id">作者 ID</label>
      <input id="author-id" name="id" placeholder="lin-mu" required />
      <label for="author-name">笔名</label>
      <input id="author-name" name="name" required />
      <label for="author-tagline">一句话介绍</label>
      <input id="author-tagline" name="tagline" required />
      <button type="submit">创建作者</button>
      <output id="author-out" aria-live="polite"></output>
    </form>
  </section>

  <section>
    <h2>导入照片</h2>
    <p class="hint">自动转 WebP、不裁剪，原图备份到 source-art/。分组可留空。</p>
    <form id="photo-form">
      <label for="photo-command">类型</label>
      <select id="photo-command" name="command">
        <option value="photo">相册照片</option>
        <option value="post-photo">文章配图</option>
        <option value="profile-photo">作者头像 / 背景</option>
      </select>
      <label for="photo-owner">作者 ID 或文章 ID</label>
      <input id="photo-owner" name="owner" placeholder="ginlang" required />
      <label for="photo-kind">头像类型（仅作者头像/背景需要）</label>
      <select id="photo-kind" name="kind"><option value="portrait">头像 portrait</option><option value="cover">背景 cover</option></select>
      <label for="photo-file">源图片路径（本机绝对路径）</label>
      <input id="photo-file" name="file" placeholder="C:\\照片\\湖边.jpg" required />
      <label for="photo-alt">替代文本（客观描述画面）</label>
      <input id="photo-alt" name="alt" required />
      <label for="photo-caption">说明（可选）</label>
      <input id="photo-caption" name="caption" />
      <label for="photo-group">相册分组（可选）</label>
      <input id="photo-group" name="group" placeholder="一次出行" />
      <button type="submit">导入照片</button>
      <output id="photo-out" aria-live="polite"></output>
    </form>
  </section>

  <section>
    <h2>当前内容</h2>
    <p class="hint">来自 src/content，不含草稿外的隐藏内容。</p>
    <button type="button" class="ghost" id="refresh">刷新</button>
    <output id="catalog-out" aria-live="polite"></output>
    <ul class="list" id="catalog"></ul>
  </section>

  <section>
    <h2>发布前自查</h2>
    <p class="hint">核对文库出处、重复与今日笺语气。</p>
    <button type="button" class="ghost" id="check">运行核对</button>
    <output id="check-out" aria-live="polite"></output>
  </section>
</main>
<script>
// The workbench is a local tool: every action runs through the same content
// command the terminal uses, so both paths produce identical files.
window.workbench = {
  run: (command, data) => fetch('/api/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command, data }),
  }).then((response) => response.json()),
  check: () => fetch('/api/check', { method: 'POST' }).then((response) => response.json()),
  ready: Promise.resolve(),
};
// Latest posts, kept so the update form can fill itself without another request.
let catalog = [];
const form = (id, out) => {
  const el = document.getElementById(id);
    const target = document.getElementById(out);
    el.addEventListener('submit', async (event) => {
      event.preventDefault();
      target.className = '';
      target.textContent = '处理中…';
      const data = Object.fromEntries(new FormData(el));
      // Checkboxes must survive the empty-value filter so an author can clear
      // the draft or anonymous flag, not only set it.
      for (const box of el.querySelectorAll('input[type="checkbox"]')) {
        data[box.name] = box.checked ? 'on' : 'off';
      }
      const result = await window.workbench.run(el.dataset.command, data);
      target.className = result.ok ? 'ok' : 'bad';
      target.textContent = result.message;
      if (result.ok) window.workbench.refresh();
    });
    return el;
};
document.getElementById('post-form').dataset.command = 'post';
document.getElementById('update-form').dataset.command = 'update';
document.getElementById('author-form').dataset.command = 'author';
document.getElementById('photo-form').dataset.command = 'photo';
form('post-form', 'post-out');
form('update-form', 'update-out');
form('author-form', 'author-out');
form('photo-form', 'photo-out');

async function refresh() {
  const result = await window.workbench.run('list', {});
  if (!result.ok) return;
  const data = JSON.parse(result.message);
  catalog = data.posts;
  const authorSelect = document.getElementById('post-author');
  const current = authorSelect.value;
  authorSelect.innerHTML = data.authors.map((a) => '<option value="' + a.id + '">' + a.name + '</option>').join('');
  if (current) authorSelect.value = current;
  const updateSelect = document.getElementById('update-id');
  const chosen = updateSelect.value;
  updateSelect.innerHTML = data.posts.map((p) => '<option value="' + p.id + '">' + (p.draft ? '［草稿］' : '') + p.title + '</option>').join('');
  // Keep the chosen post so refreshing does not silently switch the selection.
  if (chosen && data.posts.some((p) => p.id === chosen)) updateSelect.value = chosen;
  fillUpdateForm();
  const list = document.getElementById('catalog');
  list.innerHTML = data.posts.map((p) => '<li><b>' + p.title + '</b><span class="tag">' + p.date + ' · ' + p.category + (p.draft ? ' · 草稿' : '') + (p.tags.length ? ' · ' + p.tags.join('、') : '') + '</span></li>').join('');
}
document.getElementById('refresh').addEventListener('click', refresh);

// Fill the update form from the already-loaded list, so choosing a post shows
// its current values instead of an empty form.
function fillUpdateForm() {
  const id = document.getElementById('update-id').value;
  const post = catalog.find((p) => p.id === id);
  if (!post) return;
  document.getElementById('update-title').value = post.title;
  document.getElementById('update-excerpt').value = post.excerpt;
  document.getElementById('update-tags').value = post.tags.join(', ');
  document.getElementById('update-draft').checked = post.draft;
  document.getElementById('update-anonymous').checked = post.anonymous;
}
document.getElementById('update-id').addEventListener('change', fillUpdateForm);

document.getElementById('check').addEventListener('click', async () => {
  const out = document.getElementById('check-out');
  out.className = '';
  out.textContent = '检查中…';
  const result = await window.workbench.check();
  out.className = result.ok ? 'ok' : 'bad';
  out.textContent = result.message;
});

window.workbench.refresh = refresh;
window.workbench.ready.then(refresh);
</script>
</body>
</html>`;

function readBody(request) {
  return new Promise((resolvePromise, rejectPromise) => {
    const chunks = [];
    request.on('data', (chunk) => chunks.push(chunk));
    request.on('end', () => {
      try { resolvePromise(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); }
      catch { rejectPromise(new Error('请求内容不是有效 JSON')); }
    });
    request.on('error', rejectPromise);
  });
}

function send(response, status, payload) {
  const body = JSON.stringify(payload);
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(body);
}

const server = createServer(async (request, response) => {
  if (request.method === 'GET' && request.url === '/') {
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    response.end(page);
    return;
  }
  if (request.method === 'POST' && request.url === '/api/run') {
    try {
      const { command, data } = await readBody(request);
      if (typeof command !== 'string') { send(response, 400, { ok: false, message: '缺少命令。' }); return; }
      const { id, owner, file, kind, ...rest } = data ?? {};
      const values = Object.fromEntries(
        Object.entries(rest).filter(([, value]) => value !== '' && value !== undefined && value !== null),
      );
      // A checkbox arrives as "on" or "off"; booleans map to the plain or negated
// flag because the content command treats them as switches, not values.
      for (const flag of ['anonymous', 'draft']) {
        if (values[flag] === undefined) continue;
        const on = values[flag] === true || values[flag] === 'on';
        values[flag] = undefined;
        values[on ? flag : 'no-' + flag] = true;
      }
      const flags = Object.entries(values)
        .filter(([, value]) => value !== undefined && value !== null && value !== '')
        .map(([key, value]) => (value === true ? `--${key}` : `--${key}=${value}`));
      if (command === 'list') {
        send(response, 200, await run('list'));
        return;
      }
      if (command === 'photo' || command === 'post-photo' || command === 'profile-photo') {
        const argv = [command, owner, file];
        if (command === 'profile-photo') argv.push('--kind', kind || 'portrait');
        send(response, 200, await run(...argv, ...flags));
        return;
      }
      send(response, 200, await run(command, id, ...flags));
    } catch (error) {
      send(response, 400, { ok: false, message: error instanceof Error ? error.message : String(error) });
    }
    return;
  }
  if (request.method === 'POST' && request.url === '/api/check') {
    const result = await new Promise((done) => {
      const child = spawn(process.execPath, [join(projectRoot, 'scripts', 'check-library.mjs')], { cwd: projectRoot });
      const chunks = [];
      child.stdout.on('data', (chunk) => chunks.push(chunk));
      child.stderr.on('data', (chunk) => chunks.push(chunk));
      child.on('close', (code) => done({ ok: code === 0, message: Buffer.concat(chunks).toString('utf8').trim() }));
    });
    send(response, 200, result);
    return;
  }
  send(response, 404, { ok: false, message: '没有这个地址。' });
});

server.listen(port, '127.0.0.1', () => {
  const url = `http://127.0.0.1:${port}/`;
  console.log(`GINLANG 内容工作台：${url}`);
  console.log('只在本机运行。按 Ctrl+C 结束。');
  if (shouldOpen) spawn('cmd', ['/c', 'start', '', url], { detached: true, stdio: 'ignore' }).unref();
});