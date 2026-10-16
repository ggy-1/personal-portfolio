/**
 * frontmatter 归一化。
 *
 * 为什么需要这一步：YAML 把裸写的 `date: 2026-09-18` 当成时间戳类型，
 * gray-matter 底层的 js-yaml 会把它构造成 UTC 零点的 Date 对象。
 * 也就是说，作者完全按文档写下 `date: 2026-09-18` 时，schema 收到的是 Date 而不是
 * string，「日期一律存 YYYY-MM-DD 字符串」这条约定（TECH_DESIGN T14）当场就被破坏。
 *
 * 这里把这种 Date 还原成 YYYY-MM-DD 字符串。取 UTC 分量而不是本地分量：
 * YAML 的时间戳解析本身就是按 UTC 构造的，用 UTC 读回来与作者写下的日期逐字一致，
 * 不会因为构建机器的时区而漂移（这正是 T14 想避免的问题）。
 *
 * 这不是「放宽 schema」：schema.ts 仍要求 date 是 YYYY-MM-DD 字符串，
 * 本函数只把 YAML 的等价写法翻译成文档约定的形式。其余类型一律原样透传，
 * 写错类型照样报错；带具体时刻的写法（如 2026-09-18T10:00:00Z）也不做转换，
 * 因为那说明作者违反了「日期不要带时区」的约定，应当让校验直接报错。
 *
 * 约束：本文件只做数据转换，不得引入 React 或读取环境变量（AGENTS.md 4.1 第 2 条）。
 */

/** 只写日期时 YAML 给出 UTC 零点；只要时分秒毫秒不全为零，就说明原文带了具体时刻 */
function isPlainDate(value: Date): boolean {
  return (
    value.getUTCHours() === 0 &&
    value.getUTCMinutes() === 0 &&
    value.getUTCSeconds() === 0 &&
    value.getUTCMilliseconds() === 0
  );
}

function toDateString(value: Date): string {
  const year = String(value.getUTCFullYear()).padStart(4, '0');
  const month = String(value.getUTCMonth() + 1).padStart(2, '0');
  const day = String(value.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function normalizeFrontmatter(data: Record<string, unknown>): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    normalized[key] = value instanceof Date && isPlainDate(value) ? toDateString(value) : value;
  }

  return normalized;
}
