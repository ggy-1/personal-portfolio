import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TableOfContents } from '@/components/blog/TableOfContents';
import { Container } from '@/components/layout/Container';
import { MdxContent } from '@/components/mdx/MdxContent';
import { projectStatusLabel } from '@/components/projects/ProjectCard';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Tag } from '@/components/ui/Tag';
import { getAllProjects, getProjectBySlug } from '@/lib/content/loader';
import { creativeWorkJsonLd } from '@/lib/seo/jsonld';
import { buildMetadata } from '@/lib/seo/metadata';

type ProjectDetailProps = {
  params: Promise<{ slug: string }>;
};

/** 全部详情页在构建期生成（docs/TECH_DESIGN.md 2.1 的渲染策略矩阵） */
export function generateStaticParams() {
  return getAllProjects().map((project) => ({ slug: project.slug }));
}

/** 内容集合在构建期就已确定，未列出的 slug 直接判定为 404，不进入按需渲染 */
export const dynamicParams = false;

export async function generateMetadata({ params }: ProjectDetailProps) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    return buildMetadata({ title: '项目不存在' });
  }

  return buildMetadata({
    title: project.title,
    description: project.summary,
    path: `/projects/${project.slug}`,
    cover: project.cover,
  });
}

/**
 * 项目详情（PRD F-053）
 *
 * 正文用 MDX 编写，与博客共用同一套内容管线（F-054）。
 * 页面上方先给出「结论区」——角色、技术栈、成果数据，
 * 因为面试官最关心的三件事都在这里，正文再展开取舍与难点的过程。
 */
export default async function ProjectDetailPage({ params }: ProjectDetailProps) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) notFound();

  return (
    <>
      <article>
        <Container className="pt-12 md:pt-16">
          <Link
            href="/projects"
            className="inline-flex min-h-11 items-center gap-1 text-sm text-fg-muted transition-colors duration-hover ease-out-quint hover:text-fg"
          >
            <Icon name="arrowRight" className="rotate-180" />
            全部项目
          </Link>

          <h1 className="hero-title mt-4 text-fg">{project.title}</h1>

          <p className="mt-4 max-w-[var(--prose-max)] text-sm text-fg-secondary md:text-base">
            {project.summary}
          </p>

          <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm">
            <div className="flex items-center gap-2">
              <dt className="text-fg-muted">年份</dt>
              <dd className="text-fg">{project.year}</dd>
            </div>
            <div className="flex items-center gap-2">
              <dt className="text-fg-muted">状态</dt>
              <dd className="text-fg">{projectStatusLabel(project.status)}</dd>
            </div>
            <div className="flex items-center gap-2">
              <dt className="text-fg-muted">我的角色</dt>
              <dd className="text-fg">{project.role}</dd>
            </div>
          </dl>

          <ul className="mt-6 flex flex-wrap gap-2">
            {project.stack.map((item) => (
              <li key={item}>
                <Tag>{item}</Tag>
              </li>
            ))}
          </ul>

          {project.demo !== undefined || project.repo !== undefined ? (
            <div className="mt-8 flex flex-wrap gap-3">
              {project.demo ? (
                <Button
                  href={project.demo}
                  variant="primary"
                  icon="external"
                  iconPosition="start"
                >
                  在线预览
                </Button>
              ) : null}
              {project.repo ? (
                <Button href={project.repo} icon="github" iconPosition="start">
                  源码
                </Button>
              ) : null}
            </div>
          ) : null}
        </Container>

        <Container className="mt-12">
          <div className="relative aspect-[16/10] overflow-hidden rounded-lg border border-line bg-subtle">
            <Image
              src={project.cover}
              alt={`${project.title} 项目封面`}
              fill
              // 封面是详情页最大的一张图，但位于首屏之外，因此不设 priority
              sizes="(max-width: 1200px) 100vw, 1200px"
              className="object-cover"
            />
          </div>
        </Container>

        <Container className="mt-12 md:mt-16">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_220px]">
            <div className="min-w-0">
              {project.metrics.length > 0 ? (
                <section className="rounded-lg border border-line bg-surface p-6">
                  <h2 className="text-base font-semibold text-fg">成果数据</h2>
                  <ul className="mt-4 space-y-2">
                    {project.metrics.map((metric) => (
                      <li key={metric} className="flex gap-2 text-sm text-fg-secondary">
                        <Icon name="check" className="mt-1 shrink-0 text-accent" />
                        <span>{metric}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <div className="mt-8">
                <MdxContent source={project.content} />
              </div>
            </div>

            {/* 目录只在宽屏显示：窄屏下正文已足够窄，侧栏会把阅读区压到不适读的宽度 */}
            <aside className="hidden lg:block">
              <div className="sticky top-[var(--header-offset)]">
                <TableOfContents items={project.toc} />
              </div>
            </aside>
          </div>
        </Container>
      </article>

      <script
        type="application/ld+json"
        // 内容来自本站内容文件，且 jsonld.ts 已对 `<` 做转义
        dangerouslySetInnerHTML={{ __html: creativeWorkJsonLd(project) }}
      />
    </>
  );
}
