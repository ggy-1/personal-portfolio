import Link from 'next/link';
import type { TocItem } from '@/lib/content/schema';
import { cn } from '@/lib/utils/cn';

/**
 * 文章目录（PRD F-062）
 *
 * v1 形态：锚点跳转。标题的 scroll-margin-top 由 globals.css 统一设置，
 * 因此跳转后不会被固定顶栏遮挡。
 *
 * TODO(M4)：滚动高亮。届时用 IntersectionObserver 取代 scroll 事件监听
 * （原因见 TECH_DESIGN T7：scroll 监听会造成滚动卡顿），并加 aria-current 标记当前章节。
 */

const INDENT: Record<TocItem['level'], string> = {
  2: 'pl-3',
  3: 'pl-6',
  4: 'pl-9',
};

export function TableOfContents({ items, className }: { items: TocItem[]; className?: string }) {
  // 少于两个标题时目录没有意义，不如把空间留给正文
  if (items.length < 2) return null;

  return (
    <nav aria-label="文章目录" className={cn('text-sm', className)}>
      <p className="text-xs font-semibold tracking-wide text-fg-muted">目录</p>
      <ul className="mt-3 space-y-1.5 border-l border-line">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={`#${item.id}`}
              className={cn(
                'block border-l border-transparent py-1 text-fg-muted transition-colors duration-hover ease-out-quint hover:border-accent hover:text-fg',
                INDENT[item.level],
              )}
            >
              {item.text}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
