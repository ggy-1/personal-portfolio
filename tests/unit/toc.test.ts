import { describe, expect, it } from 'vitest';
import { buildToc } from '@/lib/content/toc';

/**
 * 目录生成单测（PRD F-062 / TECH_DESIGN T7）
 *
 * 这些断言保护的核心不变量是「目录 id 与渲染后标题 id 一致」，
 * 一旦 id 规则变了，文章里的锚点会全部失效。
 */
describe('buildToc', () => {
  it('只收录 h2–h4，忽略 h1 与 h5/h6', () => {
    const toc = buildToc(
      ['# 文章标题', '## 二级', '### 三级', '#### 四级', '##### 五级', '###### 六级'].join('\n\n'),
    );

    expect(toc.map((item) => item.level)).toEqual([2, 3, 4]);
    expect(toc.map((item) => item.text)).toEqual(['二级', '三级', '四级']);
  });

  it('按文档顺序生成稳定 id', () => {
    const toc = buildToc('## Getting Started\n\n### Install Dependencies\n');

    expect(toc).toEqual([
      { id: 'getting-started', text: 'Getting Started', level: 2 },
      { id: 'install-dependencies', text: 'Install Dependencies', level: 3 },
    ]);
  });

  it('同名标题自动加 -1 后缀，保证 id 唯一', () => {
    const toc = buildToc('## Setup\n\n## Setup\n\n## Setup\n');

    expect(toc.map((item) => item.id)).toEqual(['setup', 'setup-1', 'setup-2']);
    expect(toc.map((item) => item.text)).toEqual(['Setup', 'Setup', 'Setup']);
  });

  it('围栏代码块里的 # 不被当成标题', () => {
    const markdown = ['## 真标题', '', '```bash', '## 注释里的井号', '```', '', '~~~', '## 波浪号围栏里的井号', '~~~'].join('\n');

    expect(buildToc(markdown).map((item) => item.text)).toEqual(['真标题']);
  });

  it('剥离标题里的行内 Markdown，只保留可见文字', () => {
    const toc = buildToc('## **加粗**的[链接](https://example.com)与`代码`\n');

    expect(toc).toHaveLength(1);
    expect(toc[0]?.text).toBe('加粗的链接与代码');
    // 纯文本化后不应残留 Markdown 标记字符
    expect(toc[0]?.id).not.toContain('*');
    expect(toc[0]?.id).not.toContain('`');
  });

  it('中文标题也能生成非空且互不相同的 id', () => {
    const toc = buildToc('## 性能优化\n\n## 性能优化\n');

    expect(toc).toHaveLength(2);
    expect(toc[0]?.id).toBeTruthy();
    expect(toc[0]?.id).not.toBe(toc[1]?.id);
  });

  it('没有标题时返回空数组', () => {
    expect(buildToc('只有正文，没有任何标题。')).toEqual([]);
  });
});
