import type { Metadata } from 'next';
import { resolveSiteName, siteUrl } from '@/config/env';
import { siteConfig } from '@/config/site';

/**
 * 统一封装的页面元数据（TECH_DESIGN T11）
 *
 * 页面只传「不一样的字段」，canonical / og / twitter / keywords 全部在这里拼装。
 * 域名一律来自 NEXT_PUBLIC_SITE_URL，禁止在任何页面里硬编码域名。
 */

type MetadataInput = {
  /** 页面自身标题，会拼成「标题 | 站点名」 */
  title?: string;
  description?: string;
  /** 以 / 开头的站内路径，用于 canonical 与 og:url */
  path?: string;
  /** 封面图绝对路径，缺省时用站点默认 OG 图 */
  cover?: string;
  type?: 'website' | 'article';
  /** 文章首发日期（YYYY-MM-DD），仅 article 使用 */
  publishedTime?: string;
  /** 文章标签，输出为 meta keywords */
  tags?: string[];
};

const OG_IMAGE_SIZE = { width: 1200, height: 630 } as const;

export function buildMetadata(input: MetadataInput = {}): Metadata {
  const siteName = resolveSiteName(siteConfig);
  const title = input.title ? `${input.title} | ${siteName}` : `${siteConfig.name} · ${siteConfig.role}`;
  const description = input.description ?? siteConfig.meta.description;
  const url = input.path ? `${siteUrl}${input.path}` : siteUrl;
  const image = input.cover ?? siteConfig.meta.ogImage;
  const images = [{ url: image, ...OG_IMAGE_SIZE, alt: title }];

  const openGraph: Metadata['openGraph'] =
    input.type === 'article'
      ? {
          type: 'article',
          title,
          description,
          url,
          siteName,
          locale: siteConfig.meta.locale,
          images,
          ...(input.publishedTime ? { publishedTime: input.publishedTime } : {}),
          ...(input.tags ? { tags: input.tags } : {}),
        }
      : {
          type: 'website',
          title,
          description,
          url,
          siteName,
          locale: siteConfig.meta.locale,
          images,
        };

  return {
    title,
    description,
    alternates: { canonical: url },
    ...(input.tags ? { keywords: input.tags } : {}),
    openGraph,
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}
