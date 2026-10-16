'use client';

import { useState } from 'react';
import { api, type AdminProject } from '@/api';
import {
  CheckboxField,
  FieldGroup,
  ListInput,
  NumberInput,
  Select,
  TextArea,
  TextInput,
} from '@/app/admin/_components/Field';
import { FormPanel } from '@/app/admin/_components/FormPanel';
import { useSubmit } from '@/app/admin/_hooks/useSubmit';
import { toFieldErrors, type FieldErrors } from '@/app/admin/_lib/validation';
import { ProjectFrontmatterSchema, type ProjectFrontmatter } from '@/lib/content/schema';

/**
 * 项目表单（新建 / 编辑共用）。
 *
 * 校验直接跑 src/lib/content/schema.ts 的 ProjectFrontmatterSchema —— 不另写一套规则。
 * 这样「后台能存进去」与「构建能通过」是同一个判断：字段长度上限、技术栈数量、
 * 成果数据条数、URL 格式全部与内容校验脚本一致（AGENTS.md 4.1 第 5 条）。
 */

const STATUS_OPTIONS: readonly { value: ProjectFrontmatter['status']; label: string }[] = [
  { value: 'active', label: '进行中' },
  { value: 'completed', label: '已完成' },
  { value: 'archived', label: '已归档' },
];

export const PROJECT_STATUS_LABELS: Record<ProjectFrontmatter['status'], string> = {
  active: '进行中',
  completed: '已完成',
  archived: '已归档',
};

type FormState = {
  title: string;
  year: string;
  role: string;
  stack: string[];
  summary: string;
  cover: string;
  featured: boolean;
  status: ProjectFrontmatter['status'];
  demo: string;
  repo: string;
  metrics: string[];
  order: number;
};

function toFormState(project: AdminProject | null): FormState {
  if (!project) {
    return {
      title: '',
      // 年份刻意不预填「今年」：取当前时间会在渲染期引入 Date，
      // 而 AGENTS.md 5 禁止渲染期使用时间函数（水合不一致的来源）。
      // 留空交给 schema 校验，报错信息本身就会告诉用户期望格式。
      year: '',
      role: '',
      stack: [],
      summary: '',
      cover: '',
      featured: false,
      status: 'completed',
      demo: '',
      repo: '',
      metrics: [],
      order: 0,
    };
  }

  return {
    title: project.title,
    year: project.year,
    role: project.role,
    stack: [...project.stack],
    summary: project.summary,
    cover: project.cover,
    featured: project.featured,
    status: project.status,
    demo: project.demo ?? '',
    repo: project.repo ?? '',
    metrics: [...project.metrics],
    order: project.order,
  };
}

function normalizeList(values: readonly string[]): string[] {
  return values.map((value) => value.trim()).filter((value) => value.length > 0);
}

export function ProjectForm({
  initial,
  onSaved,
  onCancel,
}: {
  /** null 表示新建 */
  initial: AdminProject | null;
  /** 保存成功回调。消息交给列表侧展示 —— 本表单随即被卸载，它自己的反馈条来不及被看到 */
  onSaved: (message: string) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<FormState>(() => toFormState(initial));
  const [errors, setErrors] = useState<FieldErrors>({});
  const { saving, feedback, submit } = useSubmit();

  function patch(next: Partial<FormState>) {
    setForm((current) => ({ ...current, ...next }));
  }

  function handleSubmit() {
    // 可选字段留空时传 undefined：schema 里 demo/repo 是 optional 的 URL，
    // 空字符串会被 z.url 判为非法格式
    const demo = form.demo.trim();
    const repo = form.repo.trim();

    const parsed = ProjectFrontmatterSchema.safeParse({
      title: form.title.trim(),
      year: form.year.trim(),
      role: form.role.trim(),
      stack: normalizeList(form.stack),
      summary: form.summary.trim(),
      cover: form.cover.trim(),
      featured: form.featured,
      status: form.status,
      demo: demo.length > 0 ? demo : undefined,
      repo: repo.length > 0 ? repo : undefined,
      metrics: normalizeList(form.metrics),
      order: form.order,
    });

    if (!parsed.success) {
      setErrors(toFieldErrors(parsed.error));
      return;
    }

    setErrors({});

    const successMessage = initial ? '项目已更新。' : '项目已添加。';

    void submit(async () => {
      if (initial) {
        await api.projects.update(initial.id, parsed.data);
      } else {
        await api.projects.create(parsed.data);
      }
      onSaved(successMessage);
    }, successMessage);
  }

  return (
    <FormPanel
      title={initial ? '编辑项目' : '新增项目'}
      description="对应 content/projects/<slug>/index.mdx 的 frontmatter 字段。"
      submitLabel={initial ? '保存修改' : '添加项目'}
      saving={saving}
      feedback={feedback}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      cancelLabel="返回列表"
    >
      <FieldGroup legend="基本信息" className="border-t-0 pt-0">
        <TextInput
          label="标题"
          value={form.title}
          error={errors.title}
          hint="不超过 60 字"
          onChange={(value) => patch({ title: value })}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="年份"
            value={form.year}
            error={errors.year}
            hint="4 位年份，例如 2026"
            onChange={(value) => patch({ year: value })}
          />
          <TextInput
            label="我的角色"
            value={form.role}
            error={errors.role}
            hint="例如「独立开发（设计 + 前端）」"
            onChange={(value) => patch({ role: value })}
          />
        </div>

        <TextArea
          label="一句话简介"
          rows={3}
          value={form.summary}
          error={errors.summary}
          hint="不超过 120 字，卡片上一行显示"
          onChange={(value) => patch({ summary: value })}
        />

        <TextInput
          label="封面路径"
          value={form.cover}
          error={errors.cover}
          hint="public/ 下的相对路径，比例 16:10，例如 /images/projects/starfolio.svg"
          onChange={(value) => patch({ cover: value })}
        />
      </FieldGroup>

      <FieldGroup legend="技术栈">
        <ListInput
          label="技术栈"
          rows={4}
          value={form.stack}
          error={errors.stack}
          hint="一行一个，1–10 项。写法统一：用 React，不要写 react / React.js"
          onChange={(value) => patch({ stack: value })}
        />
      </FieldGroup>

      <FieldGroup legend="展示与状态">
        <Select
          label="项目状态"
          value={form.status}
          options={STATUS_OPTIONS}
          onChange={(value) => patch({ status: value })}
        />

        <NumberInput
          label="排序权重"
          value={form.order}
          error={errors.order}
          hint="数字越小越靠前；精选项目会优先展示"
          onChange={(value) => patch({ order: value })}
        />

        <CheckboxField
          label="首页精选"
          description="勾选后出现在首页精选区（F-052「精选优先」）"
          checked={form.featured}
          onChange={(checked) => patch({ featured: checked })}
        />
      </FieldGroup>

      <FieldGroup legend="外链">
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="在线演示"
            type="url"
            value={form.demo}
            error={errors.demo}
            hint="可选，必须是完整地址（含 https://）"
            onChange={(value) => patch({ demo: value })}
          />
          <TextInput
            label="源码仓库"
            type="url"
            value={form.repo}
            error={errors.repo}
            hint="可选，必须是完整地址（含 https://）"
            onChange={(value) => patch({ repo: value })}
          />
        </div>
      </FieldGroup>

      <FieldGroup legend="成果数据">
        <ListInput
          label="成果数据"
          rows={4}
          value={form.metrics}
          error={errors.metrics}
          hint="一行一条，最多 4 条，每条不超过 60 字，例如「首屏从 3.2s 优化到 1.1s」"
          onChange={(value) => patch({ metrics: value })}
        />
      </FieldGroup>
    </FormPanel>
  );
}
