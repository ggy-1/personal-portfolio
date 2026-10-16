/**
 * 日期工具。
 *
 * 铁律（TECH_DESIGN T14）：内容日期永远是 YYYY-MM-DD 字符串，
 * 不 `new Date()` 解析、不参与时区换算，排序直接按字符串比较（ISO 格式天然可比）。
 */

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** 2026-10-16 → 2026 年 10 月 16 日（纯字符串处理，不引入 Date） */
export function formatDate(iso: string): string {
  const matched = DATE_PATTERN.exec(iso);
  if (!matched) return iso;
  const [, year, month, day] = matched;
  return `${year} 年 ${Number(month)} 月 ${Number(day)} 日`;
}

/** 2026-10-16 → 2026.10.16，用于列表与元信息 */
export function formatDateCompact(iso: string): string {
  const matched = DATE_PATTERN.exec(iso);
  if (!matched) return iso;
  const [, year, month, day] = matched;
  return `${year}.${month}.${day}`;
}

/** 仅用于构建脚本与内容模板：取「今天」的中国时区日期，输出 YYYY-MM-DD */
export function todayInShanghai(): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const pick = (type: 'year' | 'month' | 'day'): string =>
    parts.find((part) => part.type === type)?.value ?? '';

  return `${pick('year')}-${pick('month')}-${pick('day')}`;
}

/**
 * 2026-09-18 → Tue, 18 Sep 2026 00:00:00 +0000（RSS 的 pubDate 需要的 RFC 822 格式）
 *
 * 用 Date.UTC 构造再取 UTC 表示：内容日期本身没有时刻，这样输出只由日期字符串决定，
 * 与构建机器的时区无关（T14 要避免的正是这种漂移）。时区标记写作 +0000，
 * 表示「该日期的 UTC 零点」，与 RSS 读者对纯日期的预期一致。
 */
export function toRfc822(iso: string): string {
  const matched = DATE_PATTERN.exec(iso);
  if (!matched) return iso;
  const [, year, month, day] = matched;
  const utc = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return utc.toUTCString().replace(/GMT$/, '+0000');
}

/**
 * 当前年份（中国时区）。
 * 仅供服务端组件与构建脚本使用：它在构建期求值一次并写进产物，不参与客户端水合，
 * 因此不违反「渲染期禁止 Date.now()」这条针对水合一致性的限制。
 */
export function currentYearInShanghai(): string {
  return new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Shanghai', year: 'numeric' })
    .format(new Date())
    .replace(/\D/g, '');
}

/** 判断是否为合法的 YYYY-MM-DD 且日期真实存在（不做时区换算，只校验月份/日期范围） */
export function isValidDateString(iso: string): boolean {
  const matched = DATE_PATTERN.exec(iso);
  if (!matched) return false;
  const month = Number(matched[2]);
  const day = Number(matched[3]);
  return month >= 1 && month <= 12 && day >= 1 && day <= 31;
}
