'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';
import type { SubmitFeedback } from '../_hooks/useSubmit';

/**
 * 后台的状态与提示基元。
 *
 * 抽出来的理由：后台大量出现「加载中 / 加载失败 / 列表为空 / 这条是草稿」这类反馈，
 * 各页面自己写就会出现四种不同的灰色和三种不同的红色；更要紧的是
 * 有的会漏掉 role="status" / role="alert"，屏幕阅读器用户就完全感知不到保存成功了没有。
 */

/* ==================== 徽标 ==================== */

type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: 'border-line bg-subtle text-fg-secondary',
  accent: 'border-accent bg-accent-soft text-accent',
  success: 'border-success bg-success/10 text-success',
  warning: 'border-warning bg-warning/10 text-warning',
  danger: 'border-danger bg-danger/10 text-danger',
};

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: BadgeTone;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs leading-5 whitespace-nowrap',
        BADGE_TONES[tone],
      )}
    >
      {children}
    </span>
  );
}

/* ==================== 说明块 ==================== */

/**
 * 常驻说明块。用于「数据只存在这台浏览器上」这类必须让人一眼看到的事实，
 * 不是可以点掉的提示条 —— 点掉之后用户就该忘了。
 */
export function InlineNotice({
  children,
  tone = 'neutral',
  icon,
}: {
  children: ReactNode;
  tone?: 'neutral' | 'warning';
  icon?: ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border px-4 py-3 text-sm',
        tone === 'warning'
          ? 'border-warning/40 bg-warning/5 text-fg-secondary'
          : 'border-line bg-subtle/60 text-fg-secondary',
      )}
    >
      {icon ? <span className="mt-0.5 shrink-0 text-fg-muted">{icon}</span> : null}
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/* ==================== 提交反馈 ==================== */

/**
 * 保存结果的反馈条。
 * 成功用 role="status"（礼貌播报），失败用 role="alert"（立即打断）——
 * 这两种语气差别对读屏用户是实质性的。
 */
export function StatusBanner({ feedback }: { feedback: SubmitFeedback | null }) {
  if (!feedback) return null;

  const isError = feedback.kind === 'error';

  return (
    <p
      role={isError ? 'alert' : 'status'}
      className={cn(
        'rounded-md border px-3 py-2 text-sm',
        isError
          ? 'border-danger/50 bg-danger/10 text-danger'
          : 'border-success/50 bg-success/10 text-success',
      )}
    >
      {feedback.message}
    </p>
  );
}

/* ==================== 列表状态 ==================== */

export function LoadingBlock({ label = '正在加载…' }: { label?: string }) {
  return (
    <p role="status" className="px-1 py-8 text-sm text-fg-muted">
      {label}
    </p>
  );
}

export function ErrorBlock({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-lg border border-danger/40 bg-danger/5 px-4 py-6">
      <p className="text-sm font-medium text-fg">数据没能读出来</p>
      <p className="mt-2 text-sm text-fg-secondary">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-md border border-line bg-surface px-3 py-2 text-sm text-fg transition-colors duration-hover ease-out-quint hover:border-line-strong hover:bg-surface-hover"
        >
          重新加载
        </button>
      ) : null}
    </div>
  );
}

export function EmptyBlock({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-lg border border-dashed border-line px-4 py-10 text-center">
      <p className="text-sm font-medium text-fg">{title}</p>
      {description ? <p className="mx-auto mt-2 max-w-[var(--prose-max)] text-sm text-fg-muted">{description}</p> : null}
    </div>
  );
}
