'use client';

import { useCallback, useState } from 'react';
import { api, type AdminProject } from '@/api';
import type { ProjectFrontmatter } from '@/lib/content/schema';
import { AdminPageHeader } from '@/app/admin/_components/AdminPageHeader';
import { Button } from '@/components/ui/Button';
import { ConfirmButton } from '@/app/admin/_components/ConfirmButton';
import {
  Badge,
  EmptyBlock,
  ErrorBlock,
  InlineNotice,
  LoadingBlock,
  StatusBanner,
} from '@/app/admin/_components/Feedback';
import { useAsyncData } from '@/app/admin/_hooks/useAsyncData';
import { useSubmit, type SubmitFeedback } from '@/app/admin/_hooks/useSubmit';
import { PROJECT_STATUS_LABELS, ProjectForm } from './_components/ProjectForm';

/** 项目状态 → 徽标语气：进行中用强调色，已完成用成功色，已归档退到中性 */
const STATUS_TONES: Record<ProjectFrontmatter['status'], 'accent' | 'success' | 'neutral'> = {
  active: 'accent',
  completed: 'success',
  archived: 'neutral',
};

type View = { mode: 'list' } | { mode: 'create' } | { mode: 'edit'; project: AdminProject };

/**
 * 项目管理（/admin/projects）。
 *
 * 列表按「精选在前、再按排序权重升序、最后按年份倒序」排列 —— 与前台项目列表的
 * 展示顺序保持一致，这样后台看到的顺序就是访客看到的顺序。
 * 排序在这里做（load 之后），不写进接口层：它是展示策略，不是数据存取职责。
 */
export default function AdminProjectsPage() {
  const load = useCallback(async (): Promise<AdminProject[]> => {
    const items = await api.projects.list();
    return [...items].sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      if (a.order !== b.order) return a.order - b.order;
      return b.year.localeCompare(a.year);
    });
  }, []);

  const { data, status, error, reload } = useAsyncData(load);
  const [view, setView] = useState<View>({ mode: 'list' });
  const { saving, feedback, submit } = useSubmit();

  /**
   * 列表侧的一次性提示。保存成功后表单会被卸载，它自己的成功反馈条来不及被人看到，
   * 因此把消息带回列表显示；与删除反馈共用同一个展示位，避免出现两条提示。
   */
  const [notice, setNotice] = useState<SubmitFeedback | null>(null);

  function handleDelete(project: AdminProject) {
    setNotice(null);
    void submit(async () => {
      await api.projects.remove(project.id);
      reload();
    }, `已删除项目「${project.title}」。`);
  }

  /** 进入表单前清掉旧提示：上一次的成功消息不该陪到新一次编辑里 */
  function openForm(next: View) {
    setNotice(null);
    setView(next);
  }

  function backToList() {
    setView({ mode: 'list' });
  }

  const editing = view.mode !== 'list';
  const projects = data ?? [];
  const banner = feedback ?? notice;

  return (
    <>
      <AdminPageHeader
        title="项目"
        description="维护作品集卡片与详情页元数据。字段与 content/projects/<slug>/index.mdx 的 frontmatter 一致。"
        actions={
          view.mode === 'list' ? (
            <Button variant="primary" icon="plus" onClick={() => openForm({ mode: 'create' })}>
              新增项目
            </Button>
          ) : null
        }
      />

      <div className="flex flex-col gap-6">
        <InlineNotice>
          这里的项目是内容文件的可编辑副本，改动只存在本机浏览器。前台项目页读的是{' '}
          <code className="text-fg">content/projects/</code> 下的 MDX，接入真实后端后才会打通。
        </InlineNotice>

        {editing ? (
          <ProjectForm
            key={view.mode === 'edit' ? view.project.id : 'new'}
            initial={view.mode === 'edit' ? view.project : null}
            onSaved={(message) => {
              setNotice({ kind: 'success', message });
              backToList();
              reload();
            }}
            onCancel={backToList}
          />
        ) : (
          <>
            {status === 'loading' ? <LoadingBlock label="正在读取项目…" /> : null}
            {status === 'error' ? <ErrorBlock message={error ?? ''} onRetry={reload} /> : null}

            {banner ? <StatusBanner feedback={banner} /> : null}

            {status === 'ready' && projects.length === 0 ? (
              <EmptyBlock title="还没有项目" description="点右上角「新增项目」开始添加。" />
            ) : null}

            {projects.length > 0 ? (
              <ul className="flex flex-col gap-4">
                {projects.map((project) => (
                  <li
                    key={project.id}
                    className="rounded-lg border border-line bg-surface p-4 md:p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-base font-semibold text-fg">{project.title}</h2>
                          {project.featured ? <Badge tone="accent">首页精选</Badge> : null}
                          <Badge tone={STATUS_TONES[project.status]}>
                            {PROJECT_STATUS_LABELS[project.status]}
                          </Badge>
                        </div>

                        <p className="mt-1 text-xs text-fg-muted">
                          {project.year} · {project.role}
                        </p>

                        <p className="mt-2 max-w-[var(--prose-max)] text-sm text-fg-secondary">
                          {project.summary}
                        </p>

                        {project.stack.length > 0 ? (
                          <ul className="mt-3 flex flex-wrap gap-2">
                            {project.stack.map((tech) => (
                              <li key={tech}>
                                <Badge>{tech}</Badge>
                              </li>
                            ))}
                          </ul>
                        ) : null}

                        {project.metrics.length > 0 ? (
                          <ul className="mt-3 flex list-disc flex-col gap-1 pl-5 text-xs leading-5 text-fg-muted">
                            {project.metrics.map((metric) => (
                              <li key={metric}>{metric}</li>
                            ))}
                          </ul>
                        ) : null}
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <Button
                          variant="secondary"
                          icon="edit"
                          onClick={() => openForm({ mode: 'edit', project })}
                        >
                          编辑
                        </Button>
                        <ConfirmButton
                          label="删除"
                          question={`确认删除「${project.title}」？`}
                          busy={saving}
                          onConfirm={() => handleDelete(project)}
                        />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        )}
      </div>
    </>
  );
}
