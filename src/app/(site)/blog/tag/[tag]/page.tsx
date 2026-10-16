import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PostCard } from '@/components/blog/PostCard';
import { Container } from '@/components/layout/Container';
import { Section } from '@/components/layout/Section';
import { SectionHeader } from '@/components/layout/SectionHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { getAllTags, getPostsByTag } from '@/lib/content/loader';
import { buildMetadata } from '@/lib/seo/metadata';

type TagPageProps = {
  params: Promise<{ tag: string }>;
};

/** 标签页为每个既有标签生成静态页面（PRD F-063） */
export function generateStaticParams() {
  return getAllTags().map((item) => ({ tag: item.tag }));
}

/** 不存在的标签直接 404，避免生成无数个空标签页 */
export const dynamicParams = false;

export async function generateMetadata({ params }: TagPageProps) {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);

  return buildMetadata({
    title: `标签：${decoded}`,
    description: `带有「${decoded}」标签的全部文章。`,
    path: `/blog/tag/${encodeURIComponent(decoded)}`,
  });
}

export default async function TagPage({ params }: TagPageProps) {
  const { tag } = await params;
  // Next 已对动态段做过一次解码，这里再解一次以兼容标签里含空格或中文的情况
  const decoded = decodeURIComponent(tag);
  const posts = getPostsByTag(decoded);

  if (posts.length === 0) notFound();

  return (
    <Section>
      <Container>
        <SectionHeader
          as="h1"
          title={`标签：${decoded}`}
          description={`共 ${posts.length} 篇文章。`}
        />

        <div className="mt-6">
          <Link
            href="/blog"
            className="inline-flex min-h-11 items-center gap-1 text-sm text-fg-muted transition-colors duration-hover ease-out-quint hover:text-fg"
          >
            <Icon name="arrowRight" className="rotate-180" />
            返回全部文章
          </Link>
        </div>

        {posts.length > 0 ? (
          <ul className="mt-6 grid gap-6 md:grid-cols-2">
            {posts.map((post) => (
              <li key={post.slug} className="flex">
                <PostCard post={post} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-10">
            <EmptyState
              title="这个标签下还没有文章"
              description="换一个标签，或回到全部文章列表。"
              action={{ label: '全部文章', href: '/blog' }}
            />
          </div>
        )}
      </Container>
    </Section>
  );
}
