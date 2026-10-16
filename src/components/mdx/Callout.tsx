import type { ReactNode } from 'react';
import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/utils/cn';

/**
 * 正文提示块。MDX 里这样用：
 *
 *   <Callout variant="warning">这里的写法在开发模式下会执行两次</Callout>
 *
 * 变体不只靠颜色区分，同时带图标与 aria-label（颜色不作唯一信息载体）。
 */

type CalloutVariant = 'info' | 'warning';

const VARIANTS: Record<CalloutVariant, { icon: 'info' | 'warning'; label: string; className: string }> =
  {
    info: {
      icon: 'info',
      label: '提示',
      className: 'border-accent/40 bg-accent-soft text-fg-secondary',
    },
    warning: {
      icon: 'warning',
      label: '注意',
      className: 'border-warning/40 bg-subtle text-fg-secondary',
    },
  };

export function Callout({
  variant = 'info',
  children,
}: {
  variant?: CalloutVariant;
  children: ReactNode;
}) {
  const config = VARIANTS[variant];

  return (
    <div className={cn('my-6 flex gap-3 rounded-md border px-4 py-3 text-sm', config.className)}>
      <Icon name={config.icon} label={config.label} className="mt-0.5 shrink-0" />
      <div className="[&>*:first-child]:mt-0 [&>*:last-child]:mb-0">{children}</div>
    </div>
  );
}
