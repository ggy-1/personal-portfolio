import { resolveSiteName, siteUrl } from '@/config/env';
import { siteConfig } from '@/config/site';
import { getAllPosts } from '@/lib/content/loader';
import { toRfc822 } from '@/lib/utils/date';

/**
 * RSS 2.0 订阅源（PRD F-070 / TECH_DESIGN 4.3）
 *
 * 构建期生成静态文件：route handler 里没有任何运行时查询，
 * 因此产物与页面一样是纯静态的，`force-static` 让 Next 在构建时执行它。
 *
 * 只输出摘要而不是全文：一是保证 feed 体积可控，
 * 二是让订阅者回到站点阅读，正文与目录高亮才有意义。
 */

const FEED_LIMIT = 20;

/** RSS 是 XML，正文与标题里的 & < > ' " 必须转义，否则 feed 会解析失败 */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** 站内相对路径（/images/...）补成绝对地址，feed 阅读器不认识相对路径 */
function absolute(pathname: string): string {
  return pathname.startsWith('http') ? pathname : `${siteUrl}${pathname}`;
}

export const dynamic = 'force-static';

export function GET(): Response {
  const siteName = resolveSiteName(siteConfig);
  const posts = getAllPosts().slice(0, FEED_LIMIT);
  const lastBuildDate = posts[0] ? toRfc822(posts[0].updated ?? posts[0].date) : null;

  const items = posts
    .map((post) => {
      const url = `${siteUrl}/blog/${post.slug}`;
      const categories = post.tags
        .map((tag) => `      <category>${escapeXml(tag)}</category>`)
        .join('\n');

      return [
        '    <item>',
        `      <title>${escapeXml(post.title)}</title>`,
        `      <link>${url}</link>`,
        // guid 用文章永久地址，isPermaLink="true" 让阅读器把它当作可点击链接
        `      <guid isPermaLink="true">${url}</guid>`,
        `      <pubDate>${toRfc822(post.date)}</pubDate>`,
        `      <description>${escapeXml(post.summary)}</description>`,
        categories,
        post.cover ? `      <enclosure url="${escapeXml(absolute(post.cover))}" type="image/svg+xml" />` : '',
        '    </item>',
      ]
        .filter((line) => line !== '')
        .join('\n');
    })
    .join('\n');

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    `    <title>${escapeXml(siteName)}</title>`,
    `    <link>${siteUrl}</link>`,
    `    <description>${escapeXml(siteConfig.meta.description)}</description>`,
    `    <language>${siteConfig.meta.locale}</language>`,
    // 自引用链接是 feed 校验器要求的字段
    `    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml" />`,
    lastBuildDate ? `    <lastBuildDate>${lastBuildDate}</lastBuildDate>` : '',
    items,
    '  </channel>',
    '</rss>',
    '',
  ]
    .filter((line) => line !== '')
    .join('\n');

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
    },
  });
}
