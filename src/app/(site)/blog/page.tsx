import { Pagination } from '@/components/blog/Pagination';
import { PostCard } from '@/components/blog/PostCard';
import { Container } from '@/components/layout/Container';
import { Section } from '@/components/layout/Section';
import { SectionHeader } from '@/components/layout/SectionHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { TagList } from '@/components/ui/Tag';
import { getAllPosts, getAllTags, toPostSummary } from '@/lib/content/loader';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata = buildMetadata({
  title: '博客',
  description: '技术笔记：踩过的坑、做过的取舍，以及可以复用的结论。',
  path: '/blog',
});

/** 每页文章数（PRD F-068：每页 10 篇） */
const POSTS_PER_PAGE = 10;

type BlogPageProps = {
  searchParams: Promise<{ page?: string | string[] }>;
};

/** 解析 ?page=N：非法值一律回落到第 1 页，而不是把错误抛给访客 */
function parsePage(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(raw ?? '1', 10);
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : 1;
}

function pageHref(page: number): string {
  return page <= 1 ? '/blog' : `/blog?page=${page}`;
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const params = await searchParams;
  const posts = getAllPosts().map((post) => toPostSummary(post));
  const tags = getAllTags();

  const totalPages = Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE));
  // 超出范围的页码（例如手动改 URL）夹回最后一页，避免出现一片空白
  const currentPage = Math.min(parsePage(params.page), totalPages);
  const visiblePosts = posts.slice(
    (currentPage - 1) * POSTS_PER_PAGE,
    currentPage * POSTS_PER_PAGE,
  );

  return (
    <Section>
      <Container>
        <SectionHeader
          as="h1"
          title="博客"
          description={`共 ${posts.length} 篇文章。把踩过的坑与做过的取舍写下来，方便自己回头查，也希望能帮到遇到同样问题的人。`}
        />

        {tags.length > 0 ? (
          <div className="mt-8">
            <h2 className="text-xs font-semibold tracking-wide text-fg-muted">按标签浏览</h2>
            <TagList
              items={tags.map((item) => item.tag)}
              hrefPrefix="/blog/tag/"
              className="mt-3"
            />
          </div>
        ) : null}

        {visiblePosts.length > 0 ? (
          <>
            <ul className="mt-10 grid gap-6 md:grid-cols-2">
              {visiblePosts.map((post) => (
                <li key={post.slug} className="flex">
                  <PostCard post={post} />
                </li>
              ))}
            </ul>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              hrefFor={pageHref}
            />
          </>
        ) : (
          <div className="mt-10">
            <EmptyState
              title="还没有文章"
              description="运行 pnpm new:post <slug> 「标题」生成第一篇；写完把 frontmatter 里的 draft 改成 false 就会出现在这里。"
            />
          </div>
        )}
      </Container>
    </Section>
  );
}
