'use client';

import { useState } from 'react';
import { api, type AdminPost } from '@/api';
import {
  CheckboxField,
  FieldGroup,
  ListInput,
  TextArea,
  TextInput,
} from '@/app/admin/_components/Field';
import { FormPanel } from '@/app/admin/_components/FormPanel';
import { useSubmit } from '@/app/admin/_hooks/useSubmit';
import { toFieldErrors, type FieldErrors } from '@/app/admin/_lib/validation';
import { PostFrontmatterSchema } from '@/lib/content/schema';
import { isValidDateString } from '@/lib/utils/date';

/**
 * 博客表单（新建 / 编辑共用）。
 *
 * 日期用原生 date 输入：它的取值格式恒为 YYYY-MM-DD，从源头上避免用户敲出
 * 2026/10/16 这种与 schema 不符的写法（内容日期的格式铁律见 TECH_DESIGN T14）。
 * 格式之外还额外调用 isValidDateString 检查月份/日期范围 —— Zod 里的正则只校验形状，
 * 拦不住 2026-13-45 这种「形状对、日期不存在」的输入。
 */

type FormState = {
  title: string;
  date: string;
  updated: string;
  summary: string;
  tags: string[];
  cover: string;
  draft: boolean;
};

function toFormState(post: AdminPost | null): FormState {
  if (!post) {
    return {
      title: '',
      // 与项目年份同理：不在渲染期读当前时间，留空交给用户填写并校验
      date: '',
      updated: '',
      summary: '',
      tags: [],
      cover: '',
      draft: true,
    };
  }

  return {
    title: post.title,
    date: post.date,
    updated: post.updated ?? '',
    summary: post.summary,
    tags: [...post.tags],
    cover: post.cover ?? '',
    draft: post.draft,
  };
}

function normalizeList(values: readonly string[]): string[] {
  return values.map((value) => value.trim()).filter((value) => value.length > 0);
}

export function PostForm({
  initial,
  onSaved,
  onCancel,
}: {
  /** null 表示新建 */
  initial: AdminPost | null;
  /** 保存成功回调。消息由这里生成并交给列表侧展示 —— 本表单随即被卸载，
   *  它自己的反馈条来不及让人看到，所以提示必须挂到列表那一侧 */
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
    const date = form.date.trim();
    const updated = form.updated.trim();
    const cover = form.cover.trim();

    const parsed = PostFrontmatterSchema.safeParse({
      title: form.title.trim(),
      date,
      updated: updated.length > 0 ? updated : undefined,
      summary: form.summary.trim(),
      tags: normalizeList(form.tags),
      cover: cover.length > 0 ? cover : undefined,
      draft: form.draft,
    });

    const nextErrors: FieldErrors = parsed.success ? {} : toFieldErrors(parsed.error);

    // 用更具体的提示覆盖 schema 的泛化提示：schema 里的正则只校验形状，
    // 拦不住 2026-13-45 这种「形状对、日期不存在」的输入。
    // 两处都算完再一次性写入，这样空标题与坏日期会在同一次提交里一起标红，
    // 而不是让用户改一个、提交一次、再发现下一个。
    if (!isValidDateString(date)) {
      nextErrors.date = '日期格式必须是 YYYY-MM-DD（例如 2026-10-16）';
    }
    if (updated.length > 0 && !isValidDateString(updated)) {
      nextErrors.updated = '更新日期格式必须是 YYYY-MM-DD';
    }

    setErrors(nextErrors);
    if (!parsed.success) return;

    const successMessage = initial ? '文章已更新。' : '文章已添加。';

    void submit(async () => {
      if (initial) {
        await api.posts.update(initial.id, parsed.data);
      } else {
        await api.posts.create(parsed.data);
      }
      onSaved(successMessage);
    }, successMessage);
  }

  return (
    <FormPanel
      title={initial ? '编辑文章' : '新增文章'}
      description="字段与 content/blog/YYYY-MM-DD-slug.mdx 的 frontmatter 一致。"
      submitLabel={initial ? '保存修改' : '添加文章'}
      saving={saving}
      feedback={feedback}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      cancelLabel="返回列表"
    >
      <FieldGroup legend="文章信息" className="border-t-0 pt-0">
        <TextInput
          label="标题"
          value={form.title}
          error={errors.title}
          hint="不超过 80 字"
          onChange={(value) => patch({ title: value })}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="发布日期"
            type="date"
            value={form.date}
            error={errors.date}
            hint="决定列表顺序与 URL 前缀"
            onChange={(value) => patch({ date: value })}
          />
          <TextInput
            label="更新日期"
            type="date"
            value={form.updated}
            error={errors.updated}
            hint="可选，仅在文章被修订后填写"
            onChange={(value) => patch({ updated: value })}
          />
        </div>

        <TextArea
          label="摘要"
          rows={4}
          value={form.summary}
          error={errors.summary}
          hint="不超过 160 字，用于列表与 SEO 描述"
          onChange={(value) => patch({ summary: value })}
        />

        <TextInput
          label="封面路径"
          value={form.cover}
          error={errors.cover}
          hint="可选，public/ 下的相对路径，比例 16:9"
          onChange={(value) => patch({ cover: value })}
        />
      </FieldGroup>

      <FieldGroup legend="标签">
        <ListInput
          label="标签"
          rows={3}
          value={form.tags}
          error={errors.tags}
          hint="一行一个，1–5 个。先搜索已有标签再用，避免 react / React 这类同义分裂"
          onChange={(value) => patch({ tags: value })}
        />
      </FieldGroup>

      <FieldGroup legend="发布状态">
        <CheckboxField
          label="存为草稿"
          description="草稿不参与前台构建与列表展示（draft: true）"
          checked={form.draft}
          onChange={(checked) => patch({ draft: checked })}
        />
      </FieldGroup>
    </FormPanel>
  );
}
