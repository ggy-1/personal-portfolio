import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';

/**
 * 分页（PRD F-068）
 *
 * 只提供「上一页 / 下一页 + 当前位置」，不做页码窗口列表：
 * 博客总数在可预见的将来不会大到需要跳页，而页码列表需要处理省略号、
 * 首尾边界和手机端的横向滚动，成本远大于收益。
 *
 * hrefFor 由调用方提供，因此这个组件不关心分页状态存在 URL 的哪个参数里；
 * 两侧的不可用状态用 span 而不是禁用的 <a>，避免键盘用户把 Tab 停在跳不动的链接上。
 */
export function Pagination({
  currentPage,
  totalPages,
  hrefFor,
}: {
  currentPage: number;
  totalPages: number;
  hrefFor: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <nav aria-label="分页" className="mt-12 flex items-center justify-between gap-4">
      {hasPrev ? (
        <Link
          href={hrefFor(currentPage - 1)}
          rel="prev"
          className="inline-flex min-h-11 items-center gap-1 rounded-md border border-line bg-surface px-4 text-sm text-fg-secondary transition-colors duration-hover ease-out-quint hover:border-line-strong hover:text-fg"
        >
          <Icon name="arrowRight" className="rotate-180" />
          上一页
        </Link>
      ) : (
        <span aria-hidden="true" />
      )}

      <p className="text-sm text-fg-muted" aria-live="polite">
        第 {currentPage} / {totalPages} 页
      </p>

      {hasNext ? (
        <Link
          href={hrefFor(currentPage + 1)}
          rel="next"
          className="inline-flex min-h-11 items-center gap-1 rounded-md border border-line bg-surface px-4 text-sm text-fg-secondary transition-colors duration-hover ease-out-quint hover:border-line-strong hover:text-fg"
        >
          下一页
          <Icon name="arrowRight" />
        </Link>
      ) : (
        <span aria-hidden="true" />
      )}
    </nav>
  );
}
