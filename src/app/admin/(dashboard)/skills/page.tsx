'use client';

import { useCallback, useState } from 'react';
import { api, type AdminSkill } from '@/api';
import { skillCategories } from '@/config/skills';
import type { SkillLevel } from '@/lib/content/schema';
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
import { SKILL_LEVEL_LABELS, SkillForm } from './_components/SkillForm';

/** 熟练度 → 徽标语气。越熟练越醒目，读列表时一眼能看出梯度 */
const LEVEL_TONES: Record<SkillLevel, 'success' | 'accent' | 'neutral'> = {
  proficient: 'success',
  familiar: 'accent',
  learning: 'neutral',
};

type View =
  | { mode: 'list' }
  | { mode: 'create'; categoryId: string }
  | { mode: 'edit'; skill: AdminSkill };

/**
 * 技能管理（/admin/skills）。
 *
 * 用「列表 ↔ 表单」互斥切换，而不是模态框：模态框要配焦点锁定、Esc 关闭、
 * 关闭后焦点归位（AGENTS.md 第 7 节），而表单有十来个字段、在手机上还要能滚动。
 * 就地切换没有这些问题，且刷新页面不会丢掉「正在编辑哪一条」的心智模型。
 *
 * 列表按 src/config/skills.ts 的分类分组展示：分类是信息架构，用户需要按它来定位技能，
 * 而不是看一个按创建时间排列的平铺长列表。
 */
export default function AdminSkillsPage() {
  const load = useCallback(() => api.skills.list(), []);
  const { data, status, error, reload } = useAsyncData(load);
  const [view, setView] = useState<View>({ mode: 'list' });
  const { saving, feedback, submit } = useSubmit();

  /**
   * 列表侧的一次性提示。保存成功后表单会被卸载，它自己的成功反馈条来不及被人看到，
   * 因此把消息带回列表显示；与删除反馈共用同一个展示位，避免出现两条提示。
   */
  const [notice, setNotice] = useState<SubmitFeedback | null>(null);

  function handleDelete(skill: AdminSkill) {
    setNotice(null);
    void submit(async () => {
      await api.skills.remove(skill.id);
      reload();
    }, `已删除技能「${skill.name}」。`);
  }

  /** 进入表单前清掉旧提示：上一次的成功消息不该陪到新一次编辑里 */
  function openForm(next: View) {
    setNotice(null);
    setView(next);
  }

  function backToList() {
    setView({ mode: 'list' });
  }

  const skills = data ?? [];
  const banner = feedback ?? notice;

  return (
    <>
      <AdminPageHeader
        title="技能"
        description="按分类维护技能、熟练度与关联项目。前台以三档标签展示，不使用百分比。"
        actions={
          view.mode === 'list' ? (
            <Button
              variant="primary"
              icon="plus"
              onClick={() =>
                openForm({ mode: 'create', categoryId: skillCategories.at(0)?.id ?? '' })
              }
            >
              新增技能
            </Button>
          ) : null
        }
      />

      <div className="flex flex-col gap-6">
        <InlineNotice>
          分类（前端 / 后端 / 工具链 / 设计）由 <code className="text-fg">src/config/skills.ts</code>{' '}
          定义，属于站点结构，后台只往已有分类里增删技能。
        </InlineNotice>

        {view.mode !== 'list' ? (
          <SkillForm
            // key 保证切换「新建 / 编辑不同条目」时表单状态被重建，不会串到上一条
            key={view.mode === 'edit' ? view.skill.id : `new-${view.categoryId}`}
            initial={view.mode === 'edit' ? view.skill : null}
            defaultCategoryId={view.mode === 'edit' ? view.skill.categoryId : view.categoryId}
            categories={skillCategories}
            onSaved={(message) => {
              setNotice({ kind: 'success', message });
              backToList();
              reload();
            }}
            onCancel={backToList}
          />
        ) : (
          <>
            {status === 'loading' ? <LoadingBlock label="正在读取技能…" /> : null}
            {status === 'error' ? <ErrorBlock message={error ?? ''} onRetry={reload} /> : null}

            {banner ? <StatusBanner feedback={banner} /> : null}

            {status === 'ready' && skills.length === 0 ? (
              <EmptyBlock
                title="还没有技能"
                description="点右上角「新增技能」开始添加。"
              />
            ) : null}

            {status === 'ready' && skills.length > 0 ? (
              <div className="flex flex-col gap-6">
                {skillCategories.map((category) => {
                  const items = skills.filter((skill) => skill.categoryId === category.id);

                  return (
                    <section
                      key={category.id}
                      className="rounded-lg border border-line bg-surface p-4 md:p-6"
                    >
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <h2 className="text-base font-semibold text-fg">
                          {category.label}
                          <span className="ml-2 text-sm font-normal text-fg-muted">
                            {items.length} 项
                          </span>
                        </h2>
                        <Button
                          variant="secondary"
                          icon="plus"
                          onClick={() => openForm({ mode: 'create', categoryId: category.id })}
                        >
                          在此分类新增
                        </Button>
                      </div>

                      {items.length === 0 ? (
                        <p className="text-sm text-fg-muted">该分类下暂无技能。</p>
                      ) : (
                        <ul className="flex flex-col divide-y divide-line">
                          {items.map((skill) => (
                            <li
                              key={skill.id}
                              className="flex flex-wrap items-start justify-between gap-3 py-3"
                            >
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-sm font-medium text-fg">{skill.name}</p>
                                  <Badge tone={LEVEL_TONES[skill.level]}>
                                    {SKILL_LEVEL_LABELS[skill.level]}
                                  </Badge>
                                  {skill.relatedProjects?.length ? (
                                    <span className="text-xs text-fg-muted">
                                      关联 {skill.relatedProjects.join('、')}
                                    </span>
                                  ) : null}
                                </div>
                                {skill.note ? (
                                  <p className="mt-1 max-w-[var(--prose-max)] text-xs leading-5 text-fg-muted">
                                    {skill.note}
                                  </p>
                                ) : null}
                              </div>

                              <div className="flex shrink-0 items-center gap-2">
                                <Button
                                  variant="secondary"
                                  icon="edit"
                                  onClick={() => openForm({ mode: 'edit', skill })}
                                >
                                  编辑
                                </Button>
                                <ConfirmButton
                                  label="删除"
                                  question={`确认删除「${skill.name}」？`}
                                  busy={saving}
                                  onConfirm={() => handleDelete(skill)}
                                />
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </section>
                  );
                })}
              </div>
            ) : null}
          </>
        )}
      </div>
    </>
  );
}
