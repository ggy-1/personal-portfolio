import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

/**
 * 页面容器：最大宽度 1200px，内边距 移动 16 / 平板 24 / 桌面 32（PRD 5.5）。
 * 所有页面级内容都必须包在这里，禁止各页面自己写内边距。
 */
export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('mx-auto w-full max-w-[var(--content-max)] px-4 md:px-6 lg:px-8', className)}>
      {children}
    </div>
  );
}
