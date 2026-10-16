import GithubSlugger from 'github-slugger';
import type { TocItem } from './schema';
import { stripFencedCodeBlocks, stripInlineMarkdown } from './text';

/**
 * 由 Markdown 正文生成目录树（PRD F-062 / TECH_DESIGN T7）
 *
 * 关键约束：这里的 id 必须与渲染后的标题 id 完全一致。
 * 渲染侧由 rehype-slug 生成 id，它内部同样使用 github-slugger；
 * 两边都按文档顺序处理同一批标题，因此重复标题得到的 -1 / -2 后缀也能对齐。
 * 详细说明见 docs/TECH_DESIGN.md 4.3 节。
 */

/** 只收 h2–h4：h1 是文章标题（由页面渲染），h5/h6 层级过深不进目录 */
const HEADING_PATTERN = /^(#{2,4})\s+(.+?)\s*#*\s*$/;

export function buildToc(markdown: string): TocItem[] {
  const slugger = new GithubSlugger();
  const toc: TocItem[] = [];

  for (const line of stripFencedCodeBlocks(markdown).split(/\r?\n/)) {
    const matched = HEADING_PATTERN.exec(line);
    if (!matched) continue;

    const hashes = matched[1];
    const rawText = matched[2];
    if (!hashes || !rawText) continue;

    const level = hashes.length;
    if (level !== 2 && level !== 3 && level !== 4) continue;

    const text = stripInlineMarkdown(rawText);
    if (!text) continue;

    toc.push({ id: slugger.slug(text), text, level });
  }

  return toc;
}
