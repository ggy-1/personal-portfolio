import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

/**
 * 标签胶囊：用于技术栈、文章标签、技能关键词。
 * 传 href 时渲染为可点击的链接（标签页入口）。
 */

type TagProps = {
  children: ReactNode;
  href?: string;
  className?: string;
};

const BASE =
  'inline-flex items-center rounded-full border border-line bg-subtle px-2.5 py-0.5 text-xs leading-5 text-fg-secondary';

export function Tag({ children, href, className }: TagProps) {
  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          BASE,
          'transition-colors duration-hover ease-out-quint hover:border-line-strong hover:text-fg',
          className,
        )}
      >
        {children}
      </Link>
    );
  }

  return <span className={cn(BASE, className)}>{children}</span>;
}

type TagListProps = {
  items: readonly string[];
  /** 传入时把每个标签渲染成 /blog/tag/xxx 之类的链接 */
  hrefPrefix?: string;
  className?: string;
  max?: number;
};

export function TagList({ items, hrefPrefix, className, max }: TagListProps) {
  const visible = max === undefined ? items : items.slice(0, max);
  const overflow = max === undefined ? 0 : items.length - visible.length;

  return (
    <ul className={cn('flex flex-wrap gap-2', className)}>
      {visible.map((item) => (
        <li key={item}>
          <Tag href={hrefPrefix ? `${hrefPrefix}${encodeURIComponent(item)}` : undefined}>{item}</Tag>
        </li>
      ))}
      {overflow > 0 ? (
        <li>
          <Tag className="text-fg-muted">+{overflow}</Tag>
        </li>
      ) : null}
    </ul>
  );
}
