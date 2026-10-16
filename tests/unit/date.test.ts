import { describe, expect, it } from 'vitest';
import {
  currentYearInShanghai,
  formatDate,
  formatDateCompact,
  isValidDateString,
  toRfc822,
  todayInShanghai,
} from '@/lib/utils/date';

/**
 * 日期工具单测（AGENTS.md 6.1：src/lib/** 的纯函数必须被覆盖）
 *
 * 重点验证 TECH_DESIGN T14 的约束：日期全程按字符串处理，
 * 输出不得随构建机器的时区变化。
 */
describe('formatDate', () => {
  it('把 YYYY-MM-DD 格式化成中文日期，且不补前导零', () => {
    expect(formatDate('2026-10-16')).toBe('2026 年 10 月 16 日');
    expect(formatDate('2026-01-05')).toBe('2026 年 1 月 5 日');
  });

  it('遇到不符合 YYYY-MM-DD 的输入时原样返回，不抛错', () => {
    expect(formatDate('2026/10/16')).toBe('2026/10/16');
    expect(formatDate('')).toBe('');
  });
});

describe('formatDateCompact', () => {
  it('把 YYYY-MM-DD 格式化成点分形式并保留前导零', () => {
    expect(formatDateCompact('2026-09-18')).toBe('2026.09.18');
    expect(formatDateCompact('2026-01-05')).toBe('2026.01.05');
  });

  it('遇到非法输入时原样返回', () => {
    expect(formatDateCompact('not-a-date')).toBe('not-a-date');
  });
});

describe('toRfc822', () => {
  it('输出 RSS 需要的 RFC 822 格式，星期与日期一致', () => {
    // 2026-09-18 是星期五，UTC 零点必须写成 +0000 而不是本地时区偏移
    expect(toRfc822('2026-09-18')).toBe('Fri, 18 Sep 2026 00:00:00 +0000');
  });

  it('同一个日期字符串在任何时区下都得到同一结果', () => {
    expect(toRfc822('2026-01-01')).toBe('Thu, 01 Jan 2026 00:00:00 +0000');
  });

  it('遇到非法输入时原样返回', () => {
    expect(toRfc822('2026-9-18')).toBe('2026-9-18');
  });
});

describe('isValidDateString', () => {
  it('接受合法的 YYYY-MM-DD', () => {
    expect(isValidDateString('2026-10-16')).toBe(true);
  });

  it('拒绝格式不符或月份越界的值', () => {
    expect(isValidDateString('2026-13-01')).toBe(false);
    expect(isValidDateString('2026-10-32')).toBe(false);
    expect(isValidDateString('20261016')).toBe(false);
  });
});

describe('当天日期', () => {
  it('todayInShanghai 输出 YYYY-MM-DD', () => {
    expect(todayInShanghai()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('currentYearInShanghai 输出 4 位年份', () => {
    expect(currentYearInShanghai()).toMatch(/^\d{4}$/);
  });
});
