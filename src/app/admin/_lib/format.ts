/**
 * 后台的展示层格式化工具。
 *
 * 放在 app/admin/_lib 而不是 src/lib：这些函数只服务后台界面，且只有一处调用。
 * 放进 src/lib 会让它们看起来是全站通用能力，还要连带补一份单测（AGENTS.md 6.1）。
 */

/**
 * ISO 时间戳 → 北京时间可读文本。
 *
 * 与内容日期（YYYY-MM-DD 字符串、绝不做 Date 解析）不同：登录时间是一个真实时刻，
 * 必须解析。显式指定 Asia/Shanghai，避免用户的系统时区把「今天登录」显示成昨天。
 */
export function formatTimestamp(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;

  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(parsed);
}

/**
 * 归一化「一行一条」的列表输入：去首尾空格、丢掉空行。
 *
 * 只能在提交时调用，不能在输入的 onChange 里调用 —— 否则用户刚敲下的换行
 * 会被立刻删掉，永远输不进第二条。
 */
export function normalizeList(values: readonly string[]): string[] {
  return values.map((value) => value.trim()).filter((value) => value.length > 0);
}

/** 把列表拼成 textarea 的初值，与 normalizeList 互为逆操作 */
export function toListText(values: readonly string[]): string {
  return values.join('\n');
}

/** textarea 的值转回列表（不做归一化，保留用户的空行以便继续编辑） */
export function fromListText(text: string): string[] {
  return text.split('\n');
}
