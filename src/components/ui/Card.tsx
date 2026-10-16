import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

/**
 * 卡片外壳（PRD 5.8）
 *
 * 只负责「表面 + 描边 + 圆角 + 动效」这一层契约，
 * 内容结构与链接语义交给 ProjectCard / PostCard 自行决定。
 */

type CardProps = {
  children: ReactNode;
  className?: string;
  /** 可交互卡片用 true：悬停时提亮描边与背景 */
  interactive?: boolean;
};

export function Card({ children, className, interactive = false }: CardProps) {
  return (
    <div
      className={cn(
        'relative flex flex-col overflow-hidden rounded-lg border border-line bg-surface',
        interactive &&
          'transition-colors duration-expand ease-out-quint hover:border-line-strong hover:bg-surface-hover',
        className,
      )}
    >
      {children}
    </div>
  );
}
