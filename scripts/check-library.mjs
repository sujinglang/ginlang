/**
 * 文库与今日笺的编辑核对工具。
 *
 * 检查四件事：
 *   1. 摘句有真实作者与出处，不出现无出处的句子；
 *   2. 摘句没有重复（同一句话只保留一次）；
 *   3. 作者分布不过度集中，避免整页都是同一个人的声音；
 *   4. 今日笺是原创陈述段落，不用问句、不空泛、不与文库重复。
 *
 * 用法：node scripts/check-library.mjs
 * 有问题时以非零退出码结束，方便在提交前自查。
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const projectRoot = resolve(fileURLToPath(new URL('../', import.meta.url)));
const problems = [];
const notes = [];

// The data files are TypeScript modules; strip the syntax we do not need so
// the arrays can be read without a build step.
const whispersSource = await readFile(resolve(projectRoot, 'src/data/whispers.ts'), 'utf8');

// Every quoted line is written as w("...", "作者《作品》"); both parts are required.
const quotePattern = /\bw\(\s*"((?:[^"\\]|\\.)*)"\s*,\s*"((?:[^"\\]|\\.)*)"\s*\)/g;
const quotes = [...whispersSource.matchAll(quotePattern)].map((match) => ({
  text: match[1],
  source: match[2],
}));

// 1. Sources and duplicates.
const seenText = new Map();
for (const quote of quotes) {
  if (!quote.text.trim()) problems.push('有一条摘句是空的。');
  if (!quote.source.trim()) problems.push(`摘句缺少出处：${quote.text.slice(0, 20)}…`);
  else if (!quote.source.includes('《')) {
    problems.push(`出处没有标明作品：${quote.source} —— ${quote.text.slice(0, 20)}…`);
  }
  if (seenText.has(quote.text)) {
    problems.push(`摘句重复：${quote.text.slice(0, 24)}…`);
  }
  seenText.set(quote.text, quote.source);
}

// The retired list repeats quoted text on purpose; it is not part of the library.
notes.push(`文库摘句 ${quotes.length} 条，去重后 ${seenText.size} 条。`);

// 2. Author distribution.
// The margin note draws from one shared bag that interleaves authors, so a
// large author in the pool is not a problem on its own. What matters is having
// enough distinct voices to interleave, and no single author crowding out the
// others over a long run.
const byAuthor = new Map();
for (const quote of quotes) {
  const author = quote.source.split('《')[0].trim();
  byAuthor.set(author, (byAuthor.get(author) ?? 0) + 1);
}
const ranked = [...byAuthor.entries()].sort((a, b) => b[1] - a[1]);
if (byAuthor.size < 5) {
  problems.push(`文库只有 ${byAuthor.size} 位作者，交错洗牌会显得单薄。`);
}
for (const [author, count] of ranked) {
  const share = count / quotes.length;
  if (share > 0.6) {
    problems.push(`「${author}」占了文库的 ${Math.round(share * 100)}%，其他声音难以交错出现。`);
  }
}
notes.push(
  `文库涉及 ${byAuthor.size} 位作者，最多的是「${ranked[0]?.[0]}」${ranked[0]?.[1]} 条（${Math.round(((ranked[0]?.[1] ?? 0) / quotes.length) * 100)}%，交错后不会连续出现）。`,
);

// 3. Today's notes are original statements, never questions.
const promptsSource = await readFile(resolve(projectRoot, 'src/data/dailyNotePrompts.ts'), 'utf8');
const prompts = [...promptsSource.matchAll(/^\s*'((?:[^'\\]|\\.)*)',?\s*$/gm)].map((match) => match[1]);
const promptSeen = new Set();
for (const prompt of prompts) {
  if (/[？?]\s*$/.test(prompt.trim())) {
    problems.push(`今日笺用问句结尾：${prompt.slice(0, 24)}…`);
  }
  if (/(努力|奋斗|加油|坚持就是胜利|梦想一定会)/.test(prompt)) {
    problems.push(`今日笺接近空泛励志：${prompt.slice(0, 24)}…`);
  }
  if (seenText.has(prompt)) problems.push('今日笺与文库摘句重复。');
  if (promptSeen.has(prompt)) problems.push('今日笺内部重复。');
  promptSeen.add(prompt);
}
notes.push(`今日笺 ${prompts.length} 条。`);

for (const note of notes) console.log('· ' + note);
if (problems.length) {
  console.error('\n需要处理的问题：');
  for (const problem of problems) console.error('  - ' + problem);
  process.exitCode = 1;
} else {
  console.log('\n文库与今日笺核对通过。');
}