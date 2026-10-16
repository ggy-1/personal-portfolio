import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import type { Post } from '@/lib/content/schema';
import { formatDateCompact } from '@/lib/utils/date';

/**
 * 上一篇 / 下一篇（PRD F-067）
 *
 * prev = 更新的一篇，next = 更早的一篇，与列表排序方向一致，
 * 避免读者点「上一篇」却走到了未来。
 */
export function PostNavigation({ prev, next }: { prev: Post | null; next: Post | null }) {
  if (!prev && !next) return null;

  return (
    <nav aria-label="文章导航" className="mt-16 grid gap-4 border-t border-line pt-8 sm:grid-cols-2">
      {prev ? (
        <Link
          href={`/blog/${prev.slug}`}
          rel="prev"
          className="group rounded-md border border-line bg-surface p-4 transition-colors duration-expand ease-out-quint hover:border-line-strong hover:bg-surface-hover"
        >
          <span className="inline-flex items-center gap-1 text-xs text-fg-muted">
            <Icon name="arrowRight" className="rotate-180" />
            更新的一篇
          </span>
          <span className="mt-2 block text-sm font-medium text-fg transition-colors duration-hover ease-out-quint group-hover:text-accent">
            {prev.title}
          </span>
          <span className="mt-1 block text-xs text-fg-muted">{formatDateCompact(prev.date)}</span>
        </Link>
      ) : (
        <span />
      )}

      {next ? (
        <Link
          href={`/blog/${next.slug}`}
          rel="next"
          className="group rounded-md border border-line bg-surface p-4 transition-colors duration-expand ease-out-quint hover:border-line-strong hover:bg-surface-hover sm:text-right"
        >
          <span className="inline-flex items-center gap-1 text-xs text-fg-muted">
            更早的一篇
            <Icon name="arrowRight" />
          </span>
          <span className="mt-2 block text-sm font-medium text-fg transition-colors duration-hover ease-out-quint group-hover:text-accent">
            {next.title}
          </span>
          <span className="mt-1 block text-xs text-fg-muted">{formatDateCompact(next.date)}</span>
        </Link>
      ) : null}
    </nav>
  );
}
