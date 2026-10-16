import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

/**
 * 区块标题：全站标题层级与间距的唯一出处（PRD 5.4 / 5.5）。
 * 页面里不要自己写 <h2 className="text-2xl ...">，一律走这里。
 */

type SectionHeaderProps = {
  title: string;
  description?: string;
  /** 右侧动作区，例如「查看全部」链接 */
  action?: ReactNode;
  /** 作为区块的标题元素层级，默认 h2 */
  as?: 'h1' | 'h2';
  className?: string;
};

export function SectionHeader({
  title,
  description,
  action,
  as: Heading = 'h2',
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-4', className)}>
      <div className="max-w-[var(--prose-max)]">
        <Heading
          className={cn(
            'font-semibold text-fg',
            Heading === 'h1' ? 'hero-title' : 'text-2xl leading-tight md:text-[2rem]',
          )}
        >
          {title}
        </Heading>
        {description ? <p className="mt-3 text-sm text-fg-muted md:text-base">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
