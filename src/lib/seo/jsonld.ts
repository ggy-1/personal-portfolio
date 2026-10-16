import { resolveSiteName, siteUrl } from '@/config/env';
import { siteConfig } from '@/config/site';
import type { Post, Project } from '@/lib/content/schema';

/**
 * 结构化数据（TECH_DESIGN T11）：首页输出 Person，文章页输出 BlogPosting。
 *
 * 注意：JSON.stringify 的结果要直接塞进 <script>，必须转义 `<`，
 * 否则内容里出现 `</script>` 就会提前闭合标签（XSS 与页面损坏双重风险）。
 */

function serialize(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

export function personJsonLd(): string {
  return serialize({
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: siteConfig.name,
    jobTitle: siteConfig.role,
    description: siteConfig.meta.description,
    url: siteUrl,
    email: `mailto:${siteConfig.email}`,
    knowsAbout: siteConfig.keywords,
    sameAs: siteConfig.socials
      .filter((social) => social.href.startsWith('http'))
      .map((social) => social.href),
  });
}

export function blogPostingJsonLd(post: Post): string {
  return serialize({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.summary,
    datePublished: post.date,
    ...(post.updated ? { dateModified: post.updated } : {}),
    keywords: post.tags.join(', '),
    url: `${siteUrl}/blog/${post.slug}`,
    ...(post.cover ? { image: `${siteUrl}${post.cover}` } : {}),
    author: {
      '@type': 'Person',
      name: siteConfig.name,
      url: siteUrl,
    },
  });
}

export function creativeWorkJsonLd(project: Project): string {
  return serialize({
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: project.title,
    description: project.summary,
    dateCreated: project.year,
    keywords: project.stack.join(', '),
    url: `${siteUrl}/projects/${project.slug}`,
    ...(project.cover ? { image: `${siteUrl}${project.cover}` } : {}),
    author: {
      '@type': 'Person',
      name: siteConfig.name,
      url: siteUrl,
    },
  });
}

/** 站点名取环境变量优先，供 layout 的 metadataBase 使用 */
export const structuredDataSiteName = resolveSiteName(siteConfig);
