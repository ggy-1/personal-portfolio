'use client';

import type { FormEvent, ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils/cn';
import type { SubmitFeedback } from '../_hooks/useSubmit';
import { StatusBanner } from './Feedback';

/**
 * 表单外壳：标题 + 字段区 + 反馈条 + 操作区。
 *
 * 后台的 5 个表单共用它，为的是保证每张表单都长成同一个样子：
 * 有反馈条（而不是「点完没反应」）、有禁用态（而不是可以连点三次保存）、
 * 提交按钮在最下方且可被键盘 Enter 触发。
 */
type FormPanelProps = {
  title: string;
  description?: string;
  /** 由调用方处理；内部只负责 preventDefault 与阻止重复提交 */
  onSubmit: () => void;
  onCancel?: () => void;
  cancelLabel?: string;
  submitLabel?: string;
  saving: boolean;
  feedback: SubmitFeedback | null;
  children: ReactNode;
  /** 桌面端字段分两列；移动端始终单列 */
  columns?: 1 | 2;
  className?: string;
};

export function FormPanel({
  title,
  description,
  onSubmit,
  onCancel,
  cancelLabel = '取消',
  submitLabel = '保存',
  saving,
  feedback,
  children,
  columns = 1,
  className,
}: FormPanelProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    onSubmit();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('rounded-lg border border-line bg-surface p-4 md:p-6', className)}
    >
      <div className="mb-5">
        <h2 className="text-base font-semibold text-fg">{title}</h2>
        {description ? <p className="mt-1 text-sm text-fg-muted">{description}</p> : null}
      </div>

      <div className={cn('flex flex-col gap-4', columns === 2 && 'md:grid md:grid-cols-2 md:gap-6')}>
        {children}
      </div>

      {feedback ? (
        <div className="mt-5">
          <StatusBanner feedback={feedback} />
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-line pt-5">
        <Button type="submit" variant="primary" icon="save" disabled={saving}>
          {saving ? '保存中…' : submitLabel}
        </Button>
        {onCancel ? (
          <Button variant="secondary" icon="close" onClick={onCancel} disabled={saving}>
            {cancelLabel}
          </Button>
        ) : null}
      </div>
    </form>
  );
}
