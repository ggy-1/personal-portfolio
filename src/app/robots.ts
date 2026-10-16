import type { MetadataRoute } from 'next';
import { siteUrl } from '@/config/env';

/**
 * robots.txt（PRD F-008）
 *
 * 前台全部放开，只屏蔽 /admin：后台是站长自己的工具页，被搜索引擎收录既无意义
 * 也会让「个人站点」的搜索结果里混进一个登录页。这里只挡住守规矩的爬虫，
 * 真正的访问控制是后台自己的登录态守卫（见根目录 README 的「后台管理」一节）。
 */
export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/admin/'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
