'use client';

import { useState } from 'react';
import { api, type AdminSkill } from '@/api';
import type { SkillCategory, SkillLevel } from '@/lib/content/schema';
import { FieldGroup, ListInput, Select, TextArea, TextInput } from '@/app/admin/_components/Field';
import { FormPanel } from '@/app/admin/_components/FormPanel';
import { useSubmit } from '@/app/admin/_hooks/useSubmit';
import { hasErrors, type FieldErrors } from '@/app/admin/_lib/validation';

/**
 * 技能表单（新建 / 编辑共用）。
 *
 * 「熟练 / 熟悉 / 了解」三档来自 PRD F-041 —— 刻意不做百分比进度条。
 * 这里也不提供「新建分类」：分类是 src/config/skills.ts 里的信息架构，
 * 属于站点结构而非内容数据，后台只允许把技能挂到已有分类下。
 */

export const SKILL_LEVEL_OPTIONS: readonly { value: SkillLevel; label: string }[] = [
  { value: 'proficient', label: '熟练' },
  { value: 'familiar', label: '熟悉' },
  { value: 'learning', label: '了解' },
];

/** 标签文案，列表里的徽标与下拉选项共用一份，避免两处各写一套中文 */
export const SKILL_LEVEL_LABELS: Record<SkillLevel, string> = {
  proficient: '熟练',
  familiar: '熟悉',
  learning: '了解',
};

/** relatedProjects 的取值形态：小写 slug（与 content/projects/<slug> 目录名一致） */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

type FormState = {
  categoryId: string;
  name: string;
  level: SkillLevel;
  note: string;
  relatedProjects: string[];
};

function toFormState(skill: AdminSkill | null, fallbackCategoryId: string): FormState {
  if (!skill) {
    return { categoryId: fallbackCategoryId, name: '', level: 'familiar', note: '', relatedProjects: [] };
  }

  return {
    categoryId: skill.categoryId,
    name: skill.name,
    level: skill.level,
    note: skill.note ?? '',
    relatedProjects: [...(skill.relatedProjects ?? [])],
  };
}

function normalizeList(values: readonly string[]): string[] {
  return values.map((value) => value.trim()).filter((value) => value.length > 0);
}

function validate(form: FormState, categories: readonly SkillCategory[]): FieldErrors {
  const errors: FieldErrors = {};

  if (form.name.trim().length === 0) errors.name = '技能名不能为空';
  if (form.name.trim().length > 24) errors.name = '技能名不超过 24 字';

  if (!categories.some((category) => category.id === form.categoryId)) {
    errors.categoryId = '请选择一个已存在的分类';
  }

  const projects = normalizeList(form.relatedProjects);
  const invalid = projects.find((slug) => !SLUG_PATTERN.test(slug));
  if (invalid) {
    errors.relatedProjects = `「${invalid}」不是合法的项目 slug（只能用小写字母、数字与连字符）`;
  }

  return errors;
}

export function SkillForm({
  initial,
  defaultCategoryId,
  categories,
  onSaved,
  onCancel,
}: {
  /** null 表示新建 */
  initial: AdminSkill | null;
  /** 新建时预选的分类（从「在此分类新增」进入时用） */
  defaultCategoryId: string;
  categories: readonly SkillCategory[];
  /** 保存成功回调。消息交给列表侧展示 —— 本表单随即被卸载，它自己的反馈条来不及被看到 */
  onSaved: (message: string) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<FormState>(() => toFormState(initial, defaultCategoryId));
  const [errors, setErrors] = useState<FieldErrors>({});
  const { saving, feedback, submit } = useSubmit();

  function patch(next: Partial<FormState>) {
    setForm((current) => ({ ...current, ...next }));
  }

  function handleSubmit() {
    const nextErrors = validate(form, categories);
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;

    const note = form.note.trim();
    const relatedProjects = normalizeList(form.relatedProjects);

    const payload: Omit<AdminSkill, 'id'> = {
      categoryId: form.categoryId,
      name: form.name.trim(),
      level: form.level,
      // 可选字段留空时存 undefined 而不是空字符串：schema 里它们是 optional，
      // 存空字符串会让「有没有填」这件事在数据上永远为真
      note: note.length > 0 ? note : undefined,
      relatedProjects: relatedProjects.length > 0 ? relatedProjects : undefined,
    };

    const successMessage = initial ? '技能已更新。' : '技能已添加。';

    void submit(async () => {
      if (initial) {
        await api.skills.update(initial.id, payload);
      } else {
        await api.skills.create(payload);
      }
      onSaved(successMessage);
    }, successMessage);
  }

  return (
    <FormPanel
      title={initial ? '编辑技能' : '新增技能'}
      description="技能按分类展示在前台「技能」页。"
      submitLabel={initial ? '保存修改' : '添加技能'}
      saving={saving}
      feedback={feedback}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      cancelLabel="返回列表"
    >
      <FieldGroup legend="技能信息" className="border-t-0 pt-0">
        <div className="grid gap-4 md:grid-cols-2">
          <Select
            label="所属分类"
            value={form.categoryId}
            error={errors.categoryId}
            hint="分类来自 src/config/skills.ts，后台不新增分类"
            options={categories.map((category) => ({ value: category.id, label: category.label }))}
            onChange={(value) => patch({ categoryId: value })}
          />
          <TextInput
            label="技能名"
            value={form.name}
            error={errors.name}
            hint="写法统一，例如用 React，不要写 react / React.js"
            onChange={(value) => patch({ name: value })}
          />
        </div>

        <Select
          label="熟练度"
          value={form.level}
          options={SKILL_LEVEL_OPTIONS}
          hint="三档文字标签，不使用百分比（PRD F-041）"
          onChange={(value) => patch({ level: value })}
        />

        <TextArea
          label="使用场景"
          rows={3}
          value={form.note}
          error={errors.note}
          hint="可选。悬停 / 聚焦时显示「具体用它做过什么」（PRD F-044）"
          onChange={(value) => patch({ note: value })}
        />
      </FieldGroup>

      <FieldGroup legend="关联项目">
        <ListInput
          label="项目 slug"
          rows={3}
          value={form.relatedProjects}
          error={errors.relatedProjects}
          hint="可选，一行一个。必须是 content/projects/<slug> 目录名，校验脚本会检查引用是否存在"
          onChange={(value) => patch({ relatedProjects: value })}
        />
      </FieldGroup>
    </FormPanel>
  );
}
