import { Container } from '@/components/layout/Container';
import { Section } from '@/components/layout/Section';
import { SectionHeader } from '@/components/layout/SectionHeader';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { getAllProjects, getAllStacks, toProjectSummary } from '@/lib/content/loader';
import { buildMetadata } from '@/lib/seo/metadata';
import { cn } from '@/lib/utils/cn';

export const metadata = buildMetadata({
  title: '项目',
  description: '从需求到上线的完整记录：背景与目标、我的角色、技术选型理由、核心难点与成果数据。',
  path: '/projects',
});

/**
 * 项目列表（PRD 4.6）
 *
 * 筛选状态写在 URL query 里（F-051），因此：
 *  - 筛选结果可以直接分享给他人，也可以被浏览器前进/后退正确还原；
 *  - 筛选逻辑全部在服务端完成，不需要为这个交互引入任何客户端 JS。
 *
 * 多选语义是「或」：选中 React 与 TypeScript 时，展示用到任一项的项目。
 * 这与候选人筛选的实际用法一致——招聘方想看的是「这个技术栈相关的项目」，
 * 而不是「同时用到全部所选技术的项目」（那通常一个都不剩）。
 */

type ProjectsPageProps = {
  searchParams: Promise<{ stack?: string | string[] }>;
};

function toStackList(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return (Array.isArray(value) ? value : [value]).filter((item) => item.length > 0);
}

function buildFilterHref(active: ReadonlySet<string>, stack: string): string {
  const next = new Set(active);
  if (next.has(stack)) {
    next.delete(stack);
  } else {
    next.add(stack);
  }

  const query = [...next]
    .sort()
    .map((item) => `stack=${encodeURIComponent(item)}`)
    .join('&');

  return query ? `/projects?${query}` : '/projects';
}

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const params = await searchParams;
  const activeStacks = new Set(toStackList(params.stack));

  const allProjects = getAllProjects();
  const stacks = getAllStacks();
  const visibleProjects = allProjects
    .filter((project) => activeStacks.size === 0 || project.stack.some((item) => activeStacks.has(item)))
    .map(toProjectSummary);

  return (
    <Section>
      <Container>
        <SectionHeader
          as="h1"
          title="项目"
          description={`共 ${allProjects.length} 个项目。按技术栈筛选，筛选结果会写进地址栏，可以直接分享。`}
        />

        {stacks.length > 0 ? (
          <div className="mt-8">
            <h2 className="text-xs font-semibold tracking-wide text-fg-muted">按技术栈筛选</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {stacks.map((item) => {
                const isActive = activeStacks.has(item.tag);

                return (
                  <li key={item.tag}>
                    <a
                      href={buildFilterHref(activeStacks, item.tag)}
                      // 选中态同时用对勾图标与 aria-current 表达，不把颜色作为唯一信息载体
                      aria-current={isActive ? 'true' : undefined}
                      className={cn(
                        'inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-sm transition-colors duration-hover ease-out-quint',
                        isActive
                          ? 'border-accent/60 bg-accent-soft text-fg'
                          : 'border-line bg-subtle text-fg-secondary hover:border-line-strong hover:text-fg',
                      )}
                    >
                      {isActive ? <Icon name="check" /> : null}
                      {item.tag}
                      <span className="text-xs text-fg-muted">{item.count}</span>
                    </a>
                  </li>
                );
              })}
            </ul>

            {activeStacks.size > 0 ? (
              <div className="mt-4">
                <Button href="/projects" variant="ghost" size="md">
                  清除筛选（{activeStacks.size}）
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}

        {visibleProjects.length > 0 ? (
          <ul className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {visibleProjects.map((project) => (
              <li key={project.slug} className="flex">
                <ProjectCard project={project} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-10">
            <EmptyState
              title={allProjects.length === 0 ? '还没有项目' : '没有符合条件的项目'}
              description={
                allProjects.length === 0
                  ? '在 content/projects/<slug>/index.mdx 下新增一个目录即可，无需改动任何组件代码。'
                  : '当前技术栈组合没有匹配的项目，试试减少筛选条件。'
              }
              action={{ label: '查看全部项目', href: '/projects' }}
            />
          </div>
        )}
      </Container>
    </Section>
  );
}
