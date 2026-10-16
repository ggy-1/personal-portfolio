'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils/cn';

/**
 * 两步确认的删除按钮。
 *
 * 为什么不用 window.confirm 或模态框：
 *  - window.confirm 会阻塞主线程，样式不可控，且部分浏览器会直接屏蔽；
 *  - 模态框要做到位就必须处理焦点锁定、Esc 关闭、关闭后焦点归位（AGENTS.md 第 7 节），
 *    对「删除一条演示数据」这种操作属于高射炮打蚊子。
 *
 * 就地二段确认没有这些问题：第一次点击把按钮换成「确认 / 取消」，第二次点击才真正执行，
 * 并且天然可键盘操作、焦点不丢失。
 */
type ConfirmButtonProps = {
  /** 首次点击时显示的文案，例如「删除」 */
  label: string;
  /** 二段确认时的问句 */
  question?: string;
  onConfirm: () => void;
  busy?: boolean;
  className?: string;
};

export function ConfirmButton({
  label,
  question = '确认删除？',
  onConfirm,
  busy = false,
  className,
}: ConfirmButtonProps) {
  const [armed, setArmed] = useState(false);

  if (!armed) {
    return (
      <Button
        variant="danger"
        icon="trash"
        disabled={busy}
        onClick={() => setArmed(true)}
        className={className}
      >
        {label}
      </Button>
    );
  }

  return (
    <span
      role="group"
      aria-label={question}
      className={cn('inline-flex flex-wrap items-center gap-2', className)}
    >
      <span className="text-xs text-fg-secondary">{question}</span>
      <Button variant="danger" onClick={onConfirm} disabled={busy}>
        确认删除
      </Button>
      <Button variant="ghost" icon="close" onClick={() => setArmed(false)} disabled={busy}>
        取消
      </Button>
    </span>
  );
}
