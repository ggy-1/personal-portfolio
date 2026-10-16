import type { MetadataRoute } from 'next';
import { siteUrl } from '@/config/env';
import { getAllPosts, getAllProjects, getAllTags } from '@/lib/content/loader';

/**
 * 站点地图（PRD F-008 / TECH_DESIGN 4.3）
 *
 * 构建期生成，收录全部非草稿页面：四个固定页 + 项目详情 + 文章详情 + 标签页。
 * draft: true 的文章不在 getAllPosts() 的返回里（生产构建），因此天然被排除。
 */

/**
 * 把内容里的 YYYY-MM-DD 转成 UTC 零点。
 *
 * 不直接写 `new Date('2026-10-16')`：那会被当成 UTC 解析但输出随本地时区变化，
 * 同一个仓库在不同机器上会生成不同的 lastModified（T14）。
 * 这里显式指定 UTC，保证产物可复现。
 */
function toUtcDate(iso: string): Date {
  // 提供默认值以兼容 tsconfig 的 noUncheckedIndexedAccess：
  // 内容校验已保证 date / year 是合法的 YYYY-MM-DD，这里的默认值只是类型兜底。
  const [year = 1970, month = 1, day = 1] = iso.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts();
  const projects = getAllProjects();
  const tags = getAllTags();

  // 固定页面（首页/关于/技能/列表）的 lastModified 取全站最新内容日期：
  // 这些页面的内容来自 src/config 与内容聚合，最诚实的「最后变化时间」就是内容更新日。
  const latestDates = [
    ...posts.map((post) => post.updated ?? post.date),
    ...projects.map((project) => `${project.year}-01-01`),
  ].sort();
  const latest = latestDates.at(-1);

  const staticPage = (
    path: string,
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'],
    priority: number,
  ): MetadataRoute.Sitemap[number] => ({
    url: `${siteUrl}${path}`,
    ...(latest ? { lastModified: toUtcDate(latest) } : {}),
    changeFrequency,
    priority,
  });

  return [
    staticPage('/', 'weekly', 1),
    staticPage('/projects', 'monthly', 0.9),
    staticPage('/blog', 'weekly', 0.9),
    staticPage('/about', 'monthly', 0.7),
    staticPage('/skills', 'monthly', 0.7),

    ...projects.map((project) => ({
      url: `${siteUrl}/projects/${project.slug}`,
      lastModified: toUtcDate(`${project.year}-01-01`),
      changeFrequency: 'yearly' as const,
      priority: 0.8,
    })),

    ...posts.map((post) => ({
      url: `${siteUrl}/blog/${post.slug}`,
      lastModified: toUtcDate(post.updated ?? post.date),
      changeFrequency: 'yearly' as const,
      priority: 0.8,
    })),

    ...tags.map((tag) => ({
      url: `${siteUrl}/blog/tag/${encodeURIComponent(tag.tag)}`,
      ...(latest ? { lastModified: toUtcDate(latest) } : {}),
      changeFrequency: 'monthly' as const,
      priority: 0.4,
    })),
  ];
}
