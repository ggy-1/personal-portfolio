/**
 * 表单校验。
 *
 * 关键点：**复用 src/lib/content/schema.ts 里已有的 Zod schema**，不在这里另写一套规则。
 * 那是数据模型的唯一事实来源（AGENTS.md 4.1 第 5 条），项目与文章在入库前
 * 就该满足与构建期完全相同的约束 —— 否则后台能存进一份「构建会失败」的数据。
 *
 * 技能 / 个人信息 / 站点设置没有对应的 Zod schema（它们在 schema.ts 里是普通 TS 类型），
 * 这几处的必填校验写在各自的表单里，保持「一个字段一条 if」的可读形式。
 */

import type { z } from 'zod';

/** 字段路径 → 提示文案。键与表单里的字段名一一对应，便于按字段标红 */
export type FieldErrors = Record<string, string>;

/**
 * 把 Zod 的校验结果压平成字段级提示。
 *
 * 两个刻意的取舍：
 *  1. **按顶层字段归并**：数组项的 issue 路径是 `tags.0` / `metrics.2`，
 *     但表单里只有一个「标签」输入框，错误必须挂到 `tags` 上才显示得出来。
 *  2. **同一字段只留第一条**：表单里一行位置放不下两条，且用户改完一条再提交即可看到下一条。
 */
export function toFieldErrors(error: z.ZodError): FieldErrors {
  const errors: FieldErrors = {};

  for (const issue of error.issues) {
    const [head] = issue.path;
    if (typeof head !== 'string') continue;
    errors[head] ??= issue.message;
  }

  return errors;
}

export function hasErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

/** 完整 URL（含协议）。用于项目的 demo / repo —— PRD 要求它们是可直接点击的完整地址 */
export function isFullUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * 可接受的链接目标：站内相对路径 / mailto: / 完整 URL。
 * 社交链接里 RSS 用的是 `/rss.xml`，邮箱用的是 `mailto:`，因此不能只认 http(s)。
 */
export function isLinkTarget(value: string): boolean {
  if (value.startsWith('/')) return true;
  if (/^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return true;
  return isFullUrl(value);
}
