import { stripFencedCodeBlocks } from './text';

/**
 * 阅读时长估算（PRD 4.3）
 *
 * 中文 350 字/分钟、英文 200 词/分钟，分别累计后相加；向上取整，最小 1 分钟。
 * 代码块默认不计入——读代码与读散文的耗时完全不同，混在一起会让数字失去意义。
 */

const CJK_CHARS_PER_MINUTE = 350;
const LATIN_WORDS_PER_MINUTE = 200;

/** 中日韩统一表意文字 + 假名 + 谚文 */
const CJK_PATTERN = /[\u3400-\u4dbf\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/g;
/** 英文单词与数字（允许内部的连字符与撇号，如 don't、open-source） */
const LATIN_WORD_PATTERN = /[A-Za-z0-9][A-Za-z0-9'’_-]*/g;

export function readingMinutes(markdown: string, options: { stripCode?: boolean } = {}): number {
  const { stripCode = true } = options;
  const text = stripCode ? stripFencedCodeBlocks(markdown) : markdown;

  const cjkCount = text.match(CJK_PATTERN)?.length ?? 0;
  const latinWordCount = text.match(LATIN_WORD_PATTERN)?.length ?? 0;

  const minutes = cjkCount / CJK_CHARS_PER_MINUTE + latinWordCount / LATIN_WORDS_PER_MINUTE;
  return Math.max(1, Math.ceil(minutes));
}
