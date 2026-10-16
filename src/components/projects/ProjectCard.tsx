import Image from 'next/image';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Tag } from '@/components/ui/Tag';
import type { ProjectSummary } from '@/lib/content/schema';

/**
 * 项目卡片（PRD F-050）
 *
 * 封面用 next/image 的 fill + 外层 aspect-ratio 锁定 16:10：
 * 图片尺寸未知也不会引起布局位移（TECH_DESIGN T8）。
 * 仓库 / 在线预览是卡片内的第二组交互元素，必须 relative z-10 抬到标题链接的
 * 覆盖层之上，否则会被覆盖层吞掉点击。
 */

const PROJECT_STATUS_LABEL: Record<ProjectSummary['status'], string> = {
  active: '进行中',
  completed: '已完成',
  archived: '已归档',
};

/** 详情页也要展示同样的状态文案，从组件导出以保证只有一处定义 */
export function projectStatusLabel(status: ProjectSummary['status']): string {
  return PROJECT_STATUS_LABEL[status];
}

export function ProjectCard({ project }: { project: ProjectSummary }) {
  const statusLabel = PROJECT_STATUS_LABEL[project.status];

  return (
    <Card interactive className="group">
      <div className="relative aspect-[16/10] overflow-hidden border-b border-line bg-subtle">
        <Image
          src={project.cover}
          alt={`${project.title} 项目封面`}
          fill
          sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw"
          className="object-cover transition-transform duration-enter ease-out-quint group-hover:scale-[1.02]"
        />
      </div>

      <div className="flex flex-1 flex-col p-5 md:p-6">
        <div className="flex items-center gap-3 text-xs text-fg-muted">
          <span>{project.year}</span>
          <span>{statusLabel}</span>
        </div>

        <h3 className="mt-3 text-lg leading-snug font-semibold text-fg">
          <Link
            href={`/projects/${project.slug}`}
            className="transition-colors duration-hover ease-out-quint after:absolute after:inset-0 hover:text-accent"
          >
            {project.title}
          </Link>
        </h3>

        <p className="mt-2 line-clamp-2 text-sm text-fg-secondary">{project.summary}</p>

        {project.metrics.length > 0 ? (
          <ul className="mt-3 space-y-1 text-xs text-fg-muted">
            {project.metrics.map((metric) => (
              <li key={metric} className="flex gap-2">
                <Icon name="check" className="mt-0.5 shrink-0" />
                <span>{metric}</span>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          {project.stack.map((item) => (
            <Tag key={item}>{item}</Tag>
          ))}
        </div>

        {project.demo !== undefined || project.repo !== undefined ? (
          <div className="relative z-10 mt-5 flex flex-wrap gap-4 text-sm">
            {project.demo ? (
              <a
                href={project.demo}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-1 text-accent transition-colors duration-hover ease-out-quint hover:text-accent-2"
              >
                在线预览
                <Icon name="external" />
                <span className="sr-only">（在新标签页打开）</span>
              </a>
            ) : null}
            {project.repo ? (
              <a
                href={project.repo}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-1 text-fg-secondary transition-colors duration-hover ease-out-quint hover:text-fg"
              >
                源码
                <Icon name="external" />
                <span className="sr-only">（在新标签页打开）</span>
              </a>
            ) : null}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
