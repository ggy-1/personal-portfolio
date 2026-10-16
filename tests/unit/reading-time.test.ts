import { describe, expect, it } from 'vitest';
import { readingMinutes } from '@/lib/content/reading-time';

/**
 * 阅读时长单测（PRD 4.3）
 *
 * 规则：中文 350 字/分钟、英文 200 词/分钟，分别累计后相加；
 * 向上取整且最小 1 分钟；代码块默认不计入。
 */
describe('readingMinutes', () => {
  it('空内容也算 1 分钟，不出现 0', () => {
    expect(readingMinutes('')).toBe(1);
    expect(readingMinutes('   \n\n  ')).toBe(1);
  });

  it('中文按 350 字/分钟计算并向上取整', () => {
    expect(readingMinutes('中'.repeat(350))).toBe(1);
    // 351 字刚过一分钟，向上取整为 2
    expect(readingMinutes('中'.repeat(351))).toBe(2);
    expect(readingMinutes('中'.repeat(700))).toBe(2);
  });

  it('英文按 200 词/分钟计算并向上取整', () => {
    expect(readingMinutes('word '.repeat(200))).toBe(1);
    expect(readingMinutes('word '.repeat(201))).toBe(2);
    expect(readingMinutes('word '.repeat(400))).toBe(2);
  });

  it('中英文混排时两种速度分别累计后相加', () => {
    // 175 字中文 = 0.5 分钟，100 个英文词 = 0.5 分钟，合计 1 分钟
    const markdown = `${'中'.repeat(175)} ${'word '.repeat(100)}`;
    expect(readingMinutes(markdown)).toBe(1);
  });

  it('默认不计入围栏代码块', () => {
    const markdown = ['```ts', '中'.repeat(2000), '```', '', '短正文'].join('\n');

    // 只剩「短正文」3 个字，不足 1 分钟
    expect(readingMinutes(markdown)).toBe(1);
    // 显式要求计入时，2003 个中文字约 6 分钟
    expect(readingMinutes(markdown, { stripCode: false })).toBe(6);
  });

  it('波浪号围栏的代码块同样被排除', () => {
    const markdown = ['~~~', '中'.repeat(1000), '~~~', '', '正文'].join('\n');

    expect(readingMinutes(markdown)).toBe(1);
  });
});
