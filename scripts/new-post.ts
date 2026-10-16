import fs from 'node:fs';
import path from 'node:path';
import { todayInShanghai } from '@/lib/utils/date';

/**
 * 新文章脚手架（AGENTS.md 4.4 第 4 条：新增内容必须走模板，不要手写空文件）。
 *
 * 用法：
 *   pnpm new:post my-post-slug
 *   pnpm new:post my-post-slug "文章的正式标题"
 *   pnpm new:post my-post-slug "文章的正式标题" --date 2026-10-01
 *
 * 生成 content/blog/<日期>-<slug>.mdx，默认 draft: true，
 * 因此写完之前不会出现在列表与构建产物里（CONTENT_INCLUDE_DRAFTS=true 时可见）。
 */

const USAGE = [
  '用法：pnpm new:post <slug> [标题] [--date YYYY-MM-DD]',
  '',
  '  slug    必填，小写字母/数字/连字符，会成为文件名与访问路径',
  '  标题    可选，写入 frontmatter 的 title；缺省时用 slug',
  '  --date  可选，默认取中国时区的今天',
  '',
  '示例：pnpm new:post why-i-write "为什么我开始写技术博客"',
].join('\n');

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function fail(message: string): never {
  console.error(`✗ ${message}`);
  process.exit(1);
}

function parseArgs(argv: string[]): { slug: string; title?: string; date?: string } {
  const positional: string[] = [];
  let date: string | undefined;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--date') {
      date = argv[index + 1];
      if (date === undefined) fail('--date 后面要跟日期，例如 --date 2026-10-01');
      index += 1;
      continue;
    }
    if (arg !== undefined) positional.push(arg);
  }

  const [slug, title] = positional;
  if (slug === undefined) {
    console.error(USAGE);
    process.exit(1);
  }

  return { slug, title, date };
}

const { slug, title, date: dateOption } = parseArgs(process.argv.slice(2));

if (!SLUG_PATTERN.test(slug)) {
  fail(
    `slug「${slug}」不合法。\n` +
      '  期望格式：小写字母、数字与连字符，例如 why-i-write\n' +
      '  中文标题请作为第二个参数传入：pnpm new:post why-i-write "为什么我开始写技术博客"',
  );
}

const date = dateOption ?? todayInShanghai();
if (!DATE_PATTERN.test(date)) {
  fail(`日期「${date}」不合法，期望格式：YYYY-MM-DD（例如 2026-10-16）`);
}

const contentDir = path.join(process.cwd(), 'content', 'blog');
const fileName = `${date}-${slug}.mdx`;
const filePath = path.join(contentDir, fileName);

if (fs.existsSync(filePath)) {
  fail(`${path.relative(process.cwd(), filePath).replace(/\\/g, '/')} 已存在，请换一个 slug 或日期。`);
}

const frontmatterTitle = (title ?? slug).replace(/'/g, "''");

const template = `---
# summary 会出现在列表、搜索结果与社交分享里，请写成一句能独立看懂的话（≤160 字）
summary: '待补充：用一句话说明这篇文章解决了什么问题、结论是什么。'
title: '${frontmatterTitle}'
date: ${date}
# tags 从既有标签里选，避免出现 React / react / React.js 这类同义分裂；
# 校验脚本 pnpm validate:content 会拦截写法不一致的情况
tags: [待替换]
# 写完并本地预览通过后，把 draft 改成 false 才会发布
draft: true
---

## 先说结论

把结论放在最前面，读者可以先判断这篇文章是否值得读下去。

## 正文

正文从这里开始。

需要插图时用 \`<Figure>\`（宽高决定布局，alt 决定可访问性），需要提醒时用 \`<Callout>\`：

~~~mdx
<Figure src="/images/blog/example.svg" width={1280} height={720} alt="示例图" caption="可选说明" />

<Callout variant="warning">
  需要提醒读者的内容。
</Callout>
~~~
`;

fs.mkdirSync(contentDir, { recursive: true });
fs.writeFileSync(filePath, template, 'utf8');

const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');

console.log(`✓ 已创建 ${relativePath}`);
console.log('');
console.log('接下来：');
console.log('  1. 补全 frontmatter（title / summary / tags），并替换正文里的占位内容');
console.log('  2. pnpm validate:content  ← 本地先跑，避免 CI 来回');
console.log('  3. pnpm dev 预览，确认无误后把 frontmatter 里的 draft 改为 false');
console.log('  4. git commit && git push');
