import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { skillCategories } from '@/config/skills';
import { normalizeFrontmatter } from '@/lib/content/frontmatter';
import {
  formatSchemaIssues,
  PostFrontmatterSchema,
  ProjectFrontmatterSchema,
} from '@/lib/content/schema';
import { stripFencedCodeBlocks } from '@/lib/content/text';
import { todayInShanghai } from '@/lib/utils/date';

/**
 * 内容校验（docs/TECH_DESIGN.md T12）。
 *
 * 为什么这里直接读文件、而不是复用 src/lib/content/loader.ts：
 * loader 是「构建期读取内容」的实现，它在遇到第一个非法 frontmatter 时就抛错，
 * 而校验脚本的价值恰恰在于**一次把所有问题都列出来**。
 * 两份实现共用同一组 Zod schema（src/lib/content/schema.ts），因此规则不会分叉。
 *
 * 任何一项不通过都以退出码 1 结束，从而阻断构建（package.json 的 build 前置了本脚本）。
 */

const ROOT_DIR = process.cwd();
const CONTENT_DIR = path.join(ROOT_DIR, 'content');
const BLOG_DIR = path.join(CONTENT_DIR, 'blog');
const PROJECTS_DIR = path.join(CONTENT_DIR, 'projects');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');

const MARKDOWN_EXTENSION = '.mdx';
const PROJECT_ENTRY_FILE = 'index.mdx';

/** 单图体积上限（AGENTS.md 4.5 第 3 条） */
const MAX_IMAGE_BYTES = 200 * 1024;

/** 博客文件名必须自带日期前缀：2026-10-16-hello-world.mdx */
const POST_FILENAME_PATTERN = /^(\d{4}-\d{2}-\d{2})-([a-z0-9]+(?:-[a-z0-9]+)*)\.mdx$/;
/** 项目目录名必须是小写连字符 slug */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Markdown 图片：![alt](/path/to.png) */
const MARKDOWN_IMAGE_PATTERN = /!\[[^\]]*\]\(([^)\s]+)/g;
/** MDX 中的 <Figure src="..." /> */
const FIGURE_SRC_PATTERN = /<Figure\b[^>]*\bsrc=["']([^"']+)["']/g;

const errors: string[] = [];
const warnings: string[] = [];

function fail(message: string): void {
  errors.push(message);
}

function warn(message: string): void {
  warnings.push(message);
}

function relative(absolutePath: string): string {
  return path.relative(ROOT_DIR, absolutePath).replace(/\\/g, '/');
}

function listMarkdownFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(MARKDOWN_EXTENSION))
    .sort();
}

function listProjectSlugs(): string[] {
  if (!fs.existsSync(PROJECTS_DIR)) return [];
  return fs
    .readdirSync(PROJECTS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

type ParsedFile = {
  /** 用于报错的展示路径 */
  file: string;
  /** 图片相对路径的解析基准：以 / 开头时相对 public/，否则相对该文件所在目录 */
  baseDir: string;
  data: Record<string, unknown>;
  body: string;
};

function readFile(absolutePath: string): ParsedFile {
  const parsed = matter(fs.readFileSync(absolutePath, 'utf8'));
  return {
    file: relative(absolutePath),
    baseDir: path.dirname(absolutePath),
    // 与 src/lib/content/loader.ts 走同一套归一化，保证脚本的判定与真实构建一致
    data: normalizeFrontmatter(parsed.data as Record<string, unknown>),
    body: parsed.content,
  };
}

/* ==================== 1. 图片路径 ==================== */

function resolveAssetPath(reference: string, baseDir: string): string {
  return reference.startsWith('/')
    ? path.join(PUBLIC_DIR, reference.slice(1))
    : path.resolve(baseDir, reference);
}

function checkAsset(reference: string, baseDir: string, owner: string, field: string): void {
  // 外链图片与 data URI 不在校验范围内（内容里目前也应避免使用）
  if (/^[a-z][a-z\d+.-]*:/i.test(reference)) {
    warn(`${owner} 的 ${field} 指向站外地址，无法校验：${reference}`);
    return;
  }

  const absolute = resolveAssetPath(reference, baseDir);
  if (!fs.existsSync(absolute)) {
    fail(
      `✗ ${owner}\n  - ${field}: 引用的文件不存在：${reference}\n    期望位置：${relative(absolute)}`,
    );
    return;
  }

  const { size } = fs.statSync(absolute);
  if (size > MAX_IMAGE_BYTES) {
    fail(
      `✗ ${owner}\n  - ${field}: 图片体积 ${Math.round(size / 1024)}KB 超过上限 ${MAX_IMAGE_BYTES / 1024}KB`,
    );
  }
}

function collectBodyAssets(body: string): string[] {
  const references: string[] = [];
  // 先剥掉围栏代码块：示例代码里的 <Figure src="..."> 与 ![](...) 不该被当成真实引用
  const prose = stripFencedCodeBlocks(body);

  for (const pattern of [MARKDOWN_IMAGE_PATTERN, FIGURE_SRC_PATTERN]) {
    // 正则带 g 标志，复用前必须重置 lastIndex
    pattern.lastIndex = 0;
    let matched = pattern.exec(prose);
    while (matched !== null) {
      const reference = matched[1];
      if (reference) references.push(reference);
      matched = pattern.exec(prose);
    }
  }

  return references;
}

/* ==================== 2. 标签与技术栈的一致性 ==================== */

/**
 * 归一化写法，用于发现 React / react / React.js 这类同义分裂。
 *
 * 规则：小写 → 去掉空格与 . _ - → 去掉结尾的 js / ts 后缀。
 * 它抓不住所有同义词（Postgres 与 PostgreSQL 不在此列），
 * 但正好覆盖最常发生的那一类：同一个词的不同书写方式。
 */
function normalizeTerm(term: string): string {
  const compact = term.toLowerCase().replace(/[\s._-]/g, '');
  return compact.length > 3 ? compact.replace(/(js|ts)$/, '') : compact;
}

type TermUsage = { spelling: string; sources: string[] };

function checkTermConsistency(usages: Map<string, TermUsage>): void {
  for (const [normalized, usage] of usages) {
    const distinct = [...new Set(usage.sources.map((source) => source.split('|')[0]))];
    if (distinct.length <= 1) continue;

    const variants = [...new Set(usage.sources)].join('\n      ');
    fail(
      `✗ 标签/技术栈写法不一致（归一化后同为 "${normalized}"）\n` +
        `    ${variants}\n` +
        '    请在 content/** 与 src/config/** 中统一为同一种写法。',
    );
  }
}

function recordTerm(
  usages: Map<string, TermUsage>,
  term: string,
  source: string,
): void {
  const normalized = normalizeTerm(term);
  const existing = usages.get(normalized);
  if (existing) {
    if (existing.spelling !== term) existing.sources.push(`${source}: ${term}`);
    return;
  }
  usages.set(normalized, { spelling: term, sources: [`${source}: ${term}`] });
}

/* ==================== 主流程 ==================== */

const termUsages = new Map<string, TermUsage>();
const today = todayInShanghai();

/* ---------- 博客 ---------- */

const postSlugs = new Set<string>();
const blogFiles = listMarkdownFiles(BLOG_DIR);

if (blogFiles.length === 0) {
  warn('content/blog/ 下没有任何文章，博客列表会显示空状态');
}

for (const fileName of blogFiles) {
  const absolutePath = path.join(BLOG_DIR, fileName);
  const parsed = readFile(absolutePath);

  const nameMatched = POST_FILENAME_PATTERN.exec(fileName);
  if (!nameMatched) {
    fail(
      `✗ ${parsed.file}\n  - 文件名: 不符合规范\n    期望格式：YYYY-MM-DD-<小写连字符 slug>.mdx（例如 2026-10-16-hello-world.mdx）`,
    );
    continue;
  }

  const slug = fileName.slice(0, -MARKDOWN_EXTENSION.length);
  if (postSlugs.has(slug)) {
    fail(`✗ ${parsed.file}\n  - slug: 与已有文章重复：${slug}`);
  }
  postSlugs.add(slug);

  const result = PostFrontmatterSchema.safeParse(parsed.data);
  if (!result.success) {
    fail(formatSchemaIssues(parsed.file, result.error));
    continue;
  }

  const frontmatter = result.data;

  // 标题与文件名里的 slug 对不上属于常见笔误，只告警不阻断
  const dateInName = nameMatched[1] ?? '';
  if (frontmatter.date !== dateInName) {
    warn(
      `! ${parsed.file}: frontmatter 的 date（${frontmatter.date}）与文件名日期（${dateInName}）不一致`,
    );
  }

  if (frontmatter.date > today) {
    warn(`! ${parsed.file}: date（${frontmatter.date}）晚于今天（${today}）`);
  }
  if (frontmatter.updated && frontmatter.updated < frontmatter.date) {
    warn(`! ${parsed.file}: updated（${frontmatter.updated}）早于 date（${frontmatter.date}）`);
  }

  if (frontmatter.cover) {
    checkAsset(frontmatter.cover, parsed.baseDir, parsed.file, 'cover');
  }

  for (const tag of frontmatter.tags) {
    recordTerm(termUsages, tag, parsed.file);
  }

  for (const reference of collectBodyAssets(parsed.body)) {
    checkAsset(reference, parsed.baseDir, parsed.file, '正文图片');
  }
}

/* ---------- 项目 ---------- */

const projectSlugs = new Set<string>();
const projectDirs = listProjectSlugs();

if (projectDirs.length === 0) {
  warn('content/projects/ 下没有任何项目，作品集与首页精选区块会显示空状态');
}

for (const projectSlug of projectDirs) {
  const entryPath = path.join(PROJECTS_DIR, projectSlug, PROJECT_ENTRY_FILE);
  const displayPath = relative(entryPath);

  if (!SLUG_PATTERN.test(projectSlug)) {
    fail(
      `✗ content/projects/${projectSlug}\n  - 目录名: 必须是小写连字符 slug\n    期望格式：^[a-z0-9]+(-[a-z0-9]+)*$（例如 insight-dashboard）`,
    );
  }
  projectSlugs.add(projectSlug);

  if (!fs.existsSync(entryPath)) {
    fail(`✗ content/projects/${projectSlug}\n  - 缺少入口文件 ${PROJECT_ENTRY_FILE}`);
    continue;
  }

  const parsed = readFile(entryPath);
  const result = ProjectFrontmatterSchema.safeParse(parsed.data);
  if (!result.success) {
    fail(formatSchemaIssues(displayPath, result.error));
    continue;
  }

  const frontmatter = result.data;

  checkAsset(frontmatter.cover, parsed.baseDir, displayPath, 'cover');

  for (const item of frontmatter.stack) {
    recordTerm(termUsages, item, displayPath);
  }

  for (const reference of collectBodyAssets(parsed.body)) {
    checkAsset(reference, parsed.baseDir, displayPath, '正文图片');
  }
}

/* ---------- 技能引用的项目 slug ---------- */

for (const category of skillCategories) {
  for (const skill of category.skills) {
    for (const referenced of skill.relatedProjects ?? []) {
      if (projectSlugs.has(referenced)) continue;
      fail(
        `✗ src/config/skills.ts\n` +
          `  - relatedProjects: 技能「${skill.name}」引用了不存在的项目 slug「${referenced}」\n` +
          `    已存在的 slug：${[...projectSlugs].sort().join(', ') || '(无)'}`,
      );
    }
  }
}

/* ---------- 标签与术语一致性 ---------- */

checkTermConsistency(termUsages);

/* ==================== 输出 ==================== */

for (const warning of warnings) console.warn(warning);

if (errors.length > 0) {
  console.error('');
  for (const error of errors) console.error(error);
  console.error(`\n内容校验未通过：${errors.length} 个错误，${warnings.length} 个告警。`);
  process.exit(1);
}

console.log(
  `内容校验通过：${blogFiles.length} 篇文章、${projectDirs.length} 个项目` +
    `（${warnings.length} 个告警）。`,
);
