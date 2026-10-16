import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PostCard } from '@/components/blog/PostCard';
import { PostNavigation } from '@/components/blog/PostNavigation';
import { TableOfContents } from '@/components/blog/TableOfContents';
import { Container } from '@/components/layout/Container';
import { Section } from '@/components/layout/Section';
import { MdxContent } from '@/components/mdx/MdxContent';
import { Icon } from '@/components/ui/Icon';
import { Tag } from '@/components/ui/Tag';
import {
  getAllPosts,
  getAdjacentPosts,
  getPostBySlug,
  getRelatedPosts,
} from '@/lib/content/loader';
import { blogPostingJsonLd } from '@/lib/seo/jsonld';
import { buildMetadata } from '@/lib/seo/metadata';
import { formatDate } from '@/lib/utils/date';

type PostDetailProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

/** 未列出的 slug 直接 404，不做按需渲染 */
export const dynamicParams = false;

export async function generateMetadata({ params }: PostDetailProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return buildMetadata({ title: '文章不存在' });
  }

  return buildMetadata({
    title: post.title,
    description: post.summary,
    path: `/blog/${post.slug}`,
    cover: post.cover,
    type: 'article',
    publishedTime: post.date,
    tags: post.tags,
  });
}

/**
 * 文章详情（PRD 4.7）
 *
 * 版面：正文在左，目录在右（宽屏）。窄屏下不渲染侧栏，
 * 因为正文本身已经是单列，加一个固定目录只会挤掉阅读宽度。
 *
 * TODO(M5)：移动端目录抽屉（F-062）、滚动高亮当前章节（TECH_DESIGN T7）。
 */
export default async function PostDetailPage({ params }: PostDetailProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) notFound();

  const { prev, next } = getAdjacentPosts(post.slug);
  const related = getRelatedPosts(post.slug, 3);

  return (
    <>
      <Container className="pt-12 md:pt-16">
        <Link
          href="/blog"
          className="inline-flex min-h-11 items-center gap-1 text-sm text-fg-muted transition-colors duration-hover ease-out-quint hover:text-fg"
        >
          <Icon name="arrowRight" className="rotate-180" />
          全部文章
        </Link>

        <div className="mt-4 grid gap-10 lg:grid-cols-[minmax(0,1fr)_220px]">
          <article className="min-w-0">
            <header>
              <h1 className="text-3xl leading-tight font-semibold text-fg md:text-[2.5rem]">
                {post.title}
              </h1>

              <p className="mt-4 text-sm text-fg-muted">
                <time dateTime={post.date}>{formatDate(post.date)}</time>
                <span className="mx-2" aria-hidden="true">
                  ·
                </span>
                约 {post.readingMinutes} 分钟
                {post.updated ? (
                  <>
                    <span className="mx-2" aria-hidden="true">
                      ·
                    </span>
                    更新于 <time dateTime={post.updated}>{formatDate(post.updated)}</time>
                  </>
                ) : null}
              </p>

              <ul className="mt-4 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <li key={tag}>
                    <Tag href={`/blog/tag/${encodeURIComponent(tag)}`}>{tag}</Tag>
                  </li>
                ))}
              </ul>
            </header>

            <div className="mt-10">
              <MdxContent source={post.content} />
            </div>

            <PostNavigation prev={prev} next={next} />
          </article>

          <aside className="hidden lg:block">
            <div className="sticky top-[var(--header-offset)]">
              <TableOfContents items={post.toc} />
            </div>
          </aside>
        </div>
      </Container>

      {related.length > 0 ? (
        <Section className="mt-8 bg-subtle/40">
          <Container>
            <h2 className="text-2xl leading-tight font-semibold text-fg">相关文章</h2>
            <ul className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <li key={item.slug} className="flex">
                  <PostCard post={item} />
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      ) : null}

      <script
        type="application/ld+json"
        // 内容来自本站内容文件，且 jsonld.ts 已对 `<` 做转义
        dangerouslySetInnerHTML={{ __html: blogPostingJsonLd(post) }}
      />
    </>
  );
}
