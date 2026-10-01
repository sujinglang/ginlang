import { parseArgs } from 'node:util';
import { createHash, randomUUID } from 'node:crypto';
import { lstat, mkdir, readFile, writeFile, link, rename, unlink, open } from 'node:fs/promises';
import { basename, dirname, extname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const projectRoot = resolve(fileURLToPath(new URL('../', import.meta.url)));
const categories = ['essay', 'diary', 'book', 'short'];
const stringOption = { type: 'string' };
const commandOptions = {
  post: { title: stringOption, author: stringOption, anonymous: { type: 'boolean' }, category: stringOption, date: stringOption, excerpt: stringOption },
  author: { name: stringOption, tagline: stringOption },
  photo: { alt: stringOption, caption: stringOption, name: stringOption, date: stringOption },
  'profile-photo': { kind: stringOption, alt: stringOption, name: stringOption },
  'post-photo': { alt: stringOption, name: stringOption },
};

const help = `GINLANG 内容工具（从项目目录运行）

  npm run content -- help
  npm run content -- post <文章ID> --title "标题" [--author ginlang] [--anonymous] [--category essay] [--date YYYY-MM-DD] [--excerpt "摘要"]
  npm run content -- author <作者ID> --name "笔名" --tagline "一句话介绍"
  npm run content -- photo <作者ID> <源图片路径> --alt "图片内容" [--caption "说明"] [--name 照片ID] [--date YYYY-MM-DD]
  npm run content -- profile-photo <作者ID> <源图片路径> --kind portrait|cover --alt "图片内容" [--name 图片ID]
  npm run content -- post-photo <文章ID> <源图片路径> --alt "图片内容" [--name 图片ID]

ID 使用小写英文字母、数字和连字符，例如 september-wind、lin-mu。
文章ID决定文件名和网址，发布后保持稳定。新文章始终 draft: true。
post 默认作者 ginlang、分类 essay、日期为本机当天；分类也可为 diary、book、short。
--anonymous 仅隐藏对外署名，--author 仍填写真实作者供内部管理；文章正常生成公开阅读地址。
author 只使用提供的笔名和介绍，默认 guest、featured: false，并创建空相册。
图片自动转为 WebP，长边最多 1800 像素，不裁剪、不放大，尺寸自动登记。
原图保持不变，并备份到 source-art/albums/<作者ID>/ 或 source-art/authors/<作者ID>/。
post-photo 为已有文章生成 images/<文章ID>/ 内的配图和 source-art/posts/ 原图备份，返回可粘贴的 Markdown。
省略 --name 时由原文件名和内容摘要生成图片ID。所有图片文件均拒绝覆盖。
路径含空格时加双引号；替代文本必填。模板位于 templates/，不会直接发布。`;

function fail(message) { throw new Error(message); }

function textValue(value, label, required = true) {
  if (value === undefined && !required) return undefined;
  if (typeof value !== 'string' || !value.trim()) fail(`${label}不能为空。`);
  if (/[\u0000-\u001f\u007f]/u.test(value)) fail(`${label}必须是单行文字，不能含控制字符。`);
  return value.trim();
}

function idValue(value, label = 'ID') {
  if (typeof value !== 'string' || value.length > 100 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(value)) {
    fail(`${label}请使用小写英文字母、数字和连字符（最多 100 字符），例如 lin-mu。`);
  }
  if (/^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/iu.test(value)) fail(`${label}不能使用系统保留的文件名。`);
  return value;
}

function dateValue(value) {
  if (value === undefined) return undefined;
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value)) fail('日期请使用 YYYY-MM-DD，例如 2026-10-01。');
  const parsed = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) fail(`日期不存在：${value}。`);
  return value;
}

function today() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function inside(parent, path) {
  const rel = relative(parent, path);
  return rel !== '' && !isAbsolute(rel) && rel !== '..' && !rel.startsWith(`..${sep}`);
}

// The executable always uses this project. The override exists only for isolated
// verification fixtures under .astro/content-fixtures, never as a CLI flag.
function contentRoot(root = projectRoot) {
  const fullRoot = resolve(root);
  if (fullRoot !== projectRoot && !inside(join(projectRoot, '.astro', 'content-fixtures'), fullRoot)) {
    fail('验证目录必须位于本项目的 .astro/content-fixtures/ 下。');
  }
  return fullRoot;
}

async function safeDirectory(root, directory) {
  if (directory !== root && !inside(root, directory)) fail('目标路径超出了项目目录。');
  const rootInfo = await lstat(root);
  if (!rootInfo.isDirectory() || rootInfo.isSymbolicLink()) fail('项目目录必须是普通目录。');
  let current = root;
  for (const segment of relative(root, directory).split(sep).filter(Boolean)) {
    current = join(current, segment);
    try { await mkdir(current); } catch (error) { if (error.code !== 'EEXIST') throw error; }
    const info = await lstat(current);
    if (!info.isDirectory() || info.isSymbolicLink()) fail(`目标目录不能是符号链接或文件：${current}`);
  }
}

async function missing(path) {
  try { await lstat(path); } catch (error) { if (error.code === 'ENOENT') return; throw error; }
  fail(`文件已存在，未覆盖：${path}`);
}

async function jsonFile(path, label) {
  let raw;
  try {
    const info = await lstat(path);
    if (!info.isFile() || info.isSymbolicLink()) fail(`${label}必须是普通 JSON 文件。`);
    raw = await readFile(path, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') fail(`${label}不存在：${path}`);
    throw error;
  }
  let data;
  try { data = JSON.parse(raw); } catch { fail(`${label}的 JSON 格式有误，请先修正。`); }
  if (!data || typeof data !== 'object' || Array.isArray(data)) fail(`${label}必须是 JSON 对象。`);
  return { data, raw };
}

function publicPath(asset) {
  if (typeof asset !== 'string' || /[\\:\u0000-\u001f]/u.test(asset) || asset.startsWith('/') || asset.split('/').some((part) => !part || part === '.' || part === '..')) {
    fail('图片路径必须相对 public/，不能写本机路径、网址或 ../。');
  }
}

function validateAuthor(data) {
  textValue(data.name, '作者笔名');
  textValue(data.tagline, '作者的一句话介绍');
  if (!['founder', 'guest'].includes(data.role)) fail('作者的 role 必须是 founder 或 guest。');
  for (const kind of ['portrait', 'cover']) if (data[kind] !== undefined) publicPath(data[kind]);
}

function validateAlbum(data) {
  if (!Array.isArray(data.photos)) fail('相册必须包含 photos 数组；空相册使用 { "photos": [] }。');
  for (const photo of data.photos) {
    if (!photo || typeof photo !== 'object') fail('相册照片登记格式有误。');
    publicPath(photo.src);
    textValue(photo.alt, '现有照片的替代文本');
    if (![photo.width, photo.height].every((value) => Number.isInteger(value) && value > 0)) fail('现有照片的宽高必须是正整数。');
  }
}

async function locks(root, paths, operation) {
  const acquired = [];
  try {
    for (const path of [...paths].sort()) {
      await safeDirectory(root, dirname(path));
      const lockPath = `${path}.lock`;
      let handle;
      try { handle = await open(lockPath, 'wx'); } catch (error) {
        if (error.code === 'EEXIST') fail(`文件正在被另一个内容命令编辑：${path}。若上次操作被中断，确认没有命令运行后删除对应 .lock 文件。`);
        throw error;
      }
      acquired.push({ lockPath, handle });
    }
    return await operation();
  } finally {
    for (const { lockPath, handle } of acquired.reverse()) {
      await handle.close();
      await unlink(lockPath);
    }
  }
}

async function cleanup(path) {
  try { await unlink(path); } catch (error) { if (error.code !== 'ENOENT') throw error; }
}

async function stage(root, target, bytes) {
  await safeDirectory(root, dirname(target));
  const temporary = join(dirname(target), `.${basename(target)}.${randomUUID()}.tmp`);
  try { await writeFile(temporary, bytes, { flag: 'wx' }); } catch (error) {
    if (error.code !== 'EEXIST') await cleanup(temporary);
    throw error;
  }
  return temporary;
}

function jsonBytes(data) { return `${JSON.stringify(data, null, 2)}\n`; }

// Stage every file first. Hard links publish new files without overwriting a
// competing output. JSON replacement is one rename after assets are complete.
async function commit(root, files, update) {
  const staged = [];
  const installed = [];
  let jsonStage;
  let committed = false;
  try {
    for (const file of files) await missing(file.path);
    for (const file of files) staged.push({ ...file, temporary: await stage(root, file.path, file.bytes) });
    if (update) jsonStage = await stage(root, update.path, jsonBytes(update.data));
    for (const file of staged) {
      await link(file.temporary, file.path);
      installed.push(file.path);
    }
    if (update) {
      if (await readFile(update.path, 'utf8') !== update.raw) fail('数据文件已被其他操作修改；请重新运行命令。');
      await rename(jsonStage, update.path);
    }
    committed = true;
  } finally {
    if (!committed) for (const path of installed.reverse()) await cleanup(path);
    for (const file of staged) await cleanup(file.temporary);
    if (jsonStage) await cleanup(jsonStage);
  }
}

async function imageInput(source, requestedName) {
  const sourcePath = resolve(textValue(source, '源图片路径'));
  let bytes;
  try {
    if (!(await lstat(sourcePath)).isFile()) fail('源图片路径必须指向一个文件。');
    bytes = await readFile(sourcePath);
  } catch (error) {
    if (error.code === 'ENOENT') fail(`源图片不存在：${sourcePath}`);
    throw error;
  }
  const hash = createHash('sha256').update(bytes).digest('hex').slice(0, 8);
  const originalExtension = extname(sourcePath);
  const stem = basename(sourcePath, originalExtension).normalize('NFKD').toLowerCase()
    .replace(/[\u0300-\u036f]/gu, '').replace(/[^a-z0-9]+/gu, '-').replace(/^-|-$/gu, '').slice(0, 70).replace(/-$/u, '');
  const name = requestedName === undefined ? `${stem || 'photo'}-${hash}` : idValue(requestedName, '图片ID');
  const extension = /^\.[a-z0-9]{1,10}$/iu.test(originalExtension) ? originalExtension.toLowerCase() : '.original';
  let optimized;
  try {
    optimized = await sharp(bytes).rotate()
      .resize({ width: 1800, height: 1800, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 }).toBuffer({ resolveWithObject: true });
  } catch (error) { fail(`无法处理这张图片，请提供 Sharp 支持的图片格式。${error.message}`); }
  return { name, extension, original: bytes, webp: optimized.data, width: optimized.info.width, height: optimized.info.height };
}

async function createPost(root, slug, values) {
  const title = textValue(values.title, '文章标题 --title');
  const author = idValue(values.author ?? 'ginlang', '作者ID');
  const category = values.category ?? 'essay';
  if (!categories.includes(category)) fail(`分类 --category 可选 ${categories.join('、')}。`);
  const date = dateValue(values.date) ?? today();
  const excerpt = textValue(values.excerpt, '摘要 --excerpt', false) ?? '待填写：用一句话介绍文章内容。';
  validateAuthor((await jsonFile(join(root, 'src', 'content', 'authors', `${author}.json`), `作者 ${author}`)).data);
  const path = join(root, 'src', 'content', 'posts', `${slug}.md`);
  const bytes = `---\ntitle: ${JSON.stringify(title)}\ndate: ${date}\ncategory: ${category}\nthemes: []\nauthor: ${author}\nanonymous: ${Boolean(values.anonymous)}\nexcerpt: ${JSON.stringify(excerpt)}\ndraft: true\n---\n\n待填写：从这里写正文。发布前请确认摘要、正文和署名，再将 draft 改为 false。\n`;
  await commit(root, [{ path, bytes }]);
  return `已创建草稿：src/content/posts/${slug}.md\n文章ID：${slug}；完成内容并确认后，再将 draft 改为 false。`;
}

async function createAuthor(root, id, values) {
  const name = textValue(values.name, '作者笔名 --name');
  const tagline = textValue(values.tagline, '一句话介绍 --tagline');
  const authorPath = join(root, 'src', 'content', 'authors', `${id}.json`);
  const albumPath = join(root, 'src', 'content', 'albums', `${id}.json`);
  await locks(root, [authorPath, albumPath], () => commit(root, [
    { path: authorPath, bytes: jsonBytes({ name, role: 'guest', tagline, featured: false, order: 100, links: [] }) },
    { path: albumPath, bytes: jsonBytes({ photos: [] }) },
  ]));
  return `已创建客席作者：src/content/authors/${id}.json\n已创建空相册：src/content/albums/${id}.json`;
}

async function addImage(root, command, id, source, values) {
  const alt = textValue(values.alt, '替代文本 --alt');
  const caption = textValue(values.caption, '照片说明 --caption', false);
  const date = dateValue(values.date);
  const profile = command === 'profile-photo';
  if (profile && !['portrait', 'cover'].includes(values.kind)) fail('--kind 必须是 portrait（头像）或 cover（作者背景）。');
  if (values.name !== undefined) idValue(values.name, '图片ID');
  const authorPath = join(root, 'src', 'content', 'authors', `${id}.json`);
  const albumPath = join(root, 'src', 'content', 'albums', `${id}.json`);
  const targetPath = profile ? authorPath : albumPath;
  return locks(root, profile ? [authorPath] : [authorPath, albumPath], async () => {
    const author = await jsonFile(authorPath, `作者 ${id}`);
    validateAuthor(author.data);
    const target = profile ? author : await jsonFile(albumPath, `相册 ${id}`);
    if (!profile) validateAlbum(target.data);
    const image = await imageInput(source, values.name);
    const imageName = profile ? `${values.kind}-${image.name}` : image.name;
    const folder = profile ? 'authors' : 'album';
    const asset = `${folder}/${id}/${imageName}.webp`;
    publicPath(asset);
    const webPath = join(root, 'public', folder, id, `${imageName}.webp`);
    const originalPath = join(root, 'source-art', profile ? 'authors' : 'albums', id, `${imageName}${image.extension}`);
    if (profile) {
      target.data[values.kind] = asset;
      target.data[`${values.kind}Alt`] = alt;
      target.data[`${values.kind}Width`] = image.width;
      target.data[`${values.kind}Height`] = image.height;
    } else {
      if (target.data.photos.some((photo) => photo.src === asset)) fail(`相册已登记 ${asset}，未重复添加。`);
      target.data.photos.push({ src: asset, width: image.width, height: image.height, alt, ...(caption ? { caption } : {}), ...(date ? { date } : {}) });
    }
    await commit(root, [{ path: webPath, bytes: image.webp }, { path: originalPath, bytes: image.original }], { path: targetPath, data: target.data, raw: target.raw });
    return `已登记${profile ? (values.kind === 'portrait' ? '头像' : '作者背景') : '相册照片'}：public/${asset}\n网页尺寸：${image.width} × ${image.height}\n原图备份：${relative(root, originalPath).split(sep).join('/')}\n请把网页图片和相应 JSON 一起提交；source-art/ 备份不进入 Git。`;
  });
}

async function addPostImage(root, id, source, values) {
  const alt = textValue(values.alt, '替代文本 --alt');
  if (values.name !== undefined) idValue(values.name, '图片ID');
  const postPath = join(root, 'src', 'content', 'posts', `${id}.md`);
  return locks(root, [postPath], async () => {
    try {
      const info = await lstat(postPath);
      if (!info.isFile() || info.isSymbolicLink()) fail('文章必须是普通 Markdown 文件。');
    } catch (error) {
      if (error.code === 'ENOENT') fail(`文章 ${id} 不存在，请先使用 post 命令创建。`);
      throw error;
    }
    const image = await imageInput(source, values.name);
    const webPath = join(root, 'src', 'content', 'posts', 'images', id, `${image.name}.webp`);
    const originalPath = join(root, 'source-art', 'posts', id, `${image.name}${image.extension}`);
    await commit(root, [{ path: webPath, bytes: image.webp }, { path: originalPath, bytes: image.original }]);
    const markdownAlt = alt.replace(/[\\[\]]/gu, '\\$&');
    return `已生成文章配图：src/content/posts/images/${id}/${image.name}.webp\n网页尺寸：${image.width} × ${image.height}\n原图备份：source-art/posts/${id}/${image.name}${image.extension}\n将下面这行粘贴到文章正文；构建时会处理网站路径：\n\n![${markdownAlt}](./images/${id}/${image.name}.webp)`;
  });
}

export async function runContent(args, { root } = {}) {
  const command = args[0];
  if (!command || ['help', '--help', '-h'].includes(command)) {
    if (args.length > 1) fail('查看帮助请使用 npm run content -- help。');
    return help;
  }
  if (!Object.hasOwn(commandOptions, command)) fail(`未知命令：${command}。使用 npm run content -- help 查看用法。`);
  let parsed;
  try {
    parsed = parseArgs({ args: args.slice(1), options: { ...commandOptions[command], help: { type: 'boolean', short: 'h' } }, allowPositionals: true, strict: true });
  } catch (error) {
    const argument = error.message.match(/'([^']+)'/u)?.[1];
    if (error.code === 'ERR_PARSE_ARGS_UNKNOWN_OPTION') fail(`未知参数${argument ? `：${argument}` : ''}。使用 npm run content -- help 查看用法。`);
    fail(`参数${argument ? ` ${argument}` : ''} 缺少值或格式有误。使用 npm run content -- help 查看用法。`);
  }
  if (parsed.values.help) return help;
  const expected = ['photo', 'profile-photo', 'post-photo'].includes(command) ? 2 : 1;
  if (parsed.positionals.length !== expected) fail(`${command} 需要${expected === 2 ? `${command === 'post-photo' ? '文章' : '作者'}ID和源图片路径` : '一个ID'}。使用 npm run content -- help 查看用法。`);
  const id = idValue(parsed.positionals[0], ['post', 'post-photo'].includes(command) ? '文章ID' : '作者ID');
  const fullRoot = contentRoot(root);
  if (command === 'post') return createPost(fullRoot, id, parsed.values);
  if (command === 'author') return createAuthor(fullRoot, id, parsed.values);
  if (command === 'post-photo') return addPostImage(fullRoot, id, parsed.positionals[1], parsed.values);
  return addImage(fullRoot, command, id, parsed.positionals[1], parsed.values);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log(await runContent(process.argv.slice(2))); } catch (error) {
    console.error(`错误：${error.message}`);
    process.exitCode = 1;
  }
}
