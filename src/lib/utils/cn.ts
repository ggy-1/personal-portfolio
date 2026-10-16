import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * 类名合并：clsx 负责条件拼接，tailwind-merge 负责消解冲突类
 * （例如同时出现 rounded-sm 与 rounded-lg 时保留后者）。
 * 组件里禁止用字符串拼接或三元表达式堆叠类名（AGENTS.md 第 5 节）。
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
