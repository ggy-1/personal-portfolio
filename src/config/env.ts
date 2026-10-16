/**
 * 环境变量的唯一读取点。
 *
 * 为什么单独一个文件：AGENTS.md 4.1 第 2 条禁止 src/lib/** 直接读 process.env，
 * 以保证 lib 可被纯函数单测；环境相关的一切集中在这里，lib 通过 import 获取。
 * 本文件是所有内容的「配置源头」，不依赖除 schema 之外的任何模块。
 */

import type { SiteConfig } from '@/lib/content/schema';

/** 站点绝对地址，用于 canonical / sitemap / RSS / OG 图。禁止在代码里硬编码域名。 */
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(
  /\/$/,
  '',
);

/**
 * 是否把 draft: true 的内容也纳入构建。
 * 生产环境必须为 false；本地与 Preview 环境可设为 true 预览草稿。
 */
export const includeDrafts = process.env.CONTENT_INCLUDE_DRAFTS === 'true';

/** 站点名称：优先取环境变量，未配置时回退到站点配置里的姓名 */
export const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? '';

/** 无 Cookie 分析平台的站点 ID，留空则不上报 */
export const analyticsId = process.env.NEXT_PUBLIC_ANALYTICS_ID ?? '';

export function resolveSiteName(config: SiteConfig): string {
  return siteName || config.name;
}
