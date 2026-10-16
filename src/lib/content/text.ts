/**
 * Markdown 纯文本工具。
 *
 * 这些函数同时服务于两处，必须保证结果一致：
 *  1. 构建期的目录生成（src/lib/content/toc.ts）—— 目录 id 由这里的文本派生；
 *  2. 阅读时长估算（src/lib/content/reading-time.ts）—— 代码块不应计入字数。
 *
 * 约束：本文件只做字符串处理，不得引入 React 或读取环境变量（AGENTS.md 4.1 第 2 条）。
 */

/** 行首最多 3 个空格后的 ``` 或 ~~~ 视为围栏代码块边界 */
const FENCE_PATTERN = /^\s{0,3}(`{3,}|~{3,})/;

/**
 * 去掉围栏代码块（``` ... ``` 与 ~~~ ... ~~~）内的全部内容。
 * 代码块的正文既不该进入目录，也不该计入阅读时长。
 */
export function stripFencedCodeBlocks(markdown: string): string {
  const kept: string[] = [];
  let openFence: '`' | '~' | null = null;

  for (const line of markdown.split(/\r?\n/)) {
    const matched = FENCE_PATTERN.exec(line);
    if (matched) {
      const marker = matched[1] ?? '';
      const markerChar: '`' | '~' = marker.startsWith('~') ? '~' : '`';

      if (openFence === null) {
        openFence = markerChar;
        continue;
      }
      if (openFence === markerChar) {
        openFence = null;
        continue;
      }
    }

    if (openFence === null) {
      kept.push(line);
    }
  }

  return kept.join('\n');
}

/**
 * 去掉行内 Markdown 语法，只保留可见文字。
 *
 * 结果必须与 rehype-slug 在渲染后取得的标题文本一致，否则目录锚点会点不动：
 * rehype-slug 拿到的已经是纯文本，所以这里也要把链接、行内代码、强调标记都剥掉。
 */
export function stripInlineMarkdown(text: string): string {
  return text
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1') // 图片 → alt 文本
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // 链接 → 链接文字
    .replace(/`([^`]*)`/g, '$1') // 行内代码 → 代码内容
    .replace(/(\*\*|__)(.*?)\1/g, '$2') // 加粗
    .replace(/(\*|_)(.*?)\1/g, '$2') // 斜体
    .replace(/~~(.*?)~~/g, '$1') // 删除线
    .replace(/<[^>]+>/g, '') // 原始 HTML 标签
    .replace(/\s+/g, ' ')
    .trim();
}
