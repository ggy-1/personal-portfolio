'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

/**
 * 导航链接 —— 全站唯一需要读取当前路径的组件，因此只有它被标记为客户端组件。
 *
 * AGENTS.md 4.1 第 6 条要求 'use client' 尽量下沉到最小叶子节点：
 * 导航图标由服务端渲染后作为 ReactNode 传进来，避免把图标表打进客户端包。
 */

type NavLinkProps = {
  href: string;
  label: string;
  /** 已渲染好的图标元素（服务端渲染，客户端只负责放置） */
  icon?: ReactNode;
  variant?: 'top' | 'tab';
};

function isActivePath(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavLink({ href, label, icon, variant = 'top' }: NavLinkProps) {
  const pathname = usePathname();
  const active = isActivePath(pathname, href);

  if (variant === 'tab') {
    return (
      <Link
        href={href}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'flex min-h-14 flex-col items-center justify-center gap-1 rounded-md text-xs transition-colors duration-hover ease-out-quint',
          active ? 'text-accent' : 'text-fg-muted hover:text-fg',
        )}
      >
        {icon}
        <span>{label}</span>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'relative inline-flex min-h-11 items-center rounded-md px-3 text-sm transition-colors duration-hover ease-out-quint',
        active ? 'text-fg' : 'text-fg-secondary hover:text-fg',
      )}
    >
      {label}
      {/* 当前页指示条：颜色之外还有形状，不把颜色作为唯一信息载体 */}
      <span
        aria-hidden="true"
        className={cn(
          'absolute inset-x-3 -bottom-px h-px',
          active ? 'bg-accent' : 'bg-transparent',
        )}
      />
    </Link>
  );
}
