'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon, type IconName } from '@/components/ui/Icon';
import { cn } from '@/lib/utils/cn';

/**
 * 后台侧边栏导航。
 *
 * 只有它需要读取当前路径，所以只有它被标记为客户端组件（AGENTS.md 4.1 第 6 条）——
 * 外壳的其余部分保持为可复用的服务端结构。
 *
 * 移动端不折叠成抽屉：横向可滚动的一行就够用（6 个入口、触摸目标 44px），
 * 而抽屉要配焦点锁定、Esc 关闭、关闭后焦点归位，为一个导航条目列表做这些不划算。
 */
export type AdminNavItem = {
  href: string;
  label: string;
  icon: IconName;
};

/** 后台的全部入口。顺序即侧边栏顺序：概览在最前，设置在最末 */
export const ADMIN_NAV: readonly AdminNavItem[] = [
  { href: '/admin', label: '仪表盘', icon: 'dashboard' },
  { href: '/admin/profile', label: '个人信息', icon: 'about' },
  { href: '/admin/skills', label: '技能', icon: 'code' },
  { href: '/admin/projects', label: '项目', icon: 'projects' },
  { href: '/admin/posts', label: '博客', icon: 'blog' },
  { href: '/admin/settings', label: '站点设置', icon: 'settings' },
];

/**
 * /admin 必须精确匹配：否则它会同时点亮「仪表盘」和所有子页面。
 * 其余入口允许前缀匹配，这样未来的二级页面（如 /admin/projects/new）也能正确高亮。
 */
export function isAdminNavActive(pathname: string, href: string): boolean {
  if (href === '/admin') return pathname === '/admin';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function findAdminNavItem(pathname: string): AdminNavItem | null {
  return ADMIN_NAV.find((item) => isAdminNavActive(pathname, item.href)) ?? null;
}

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="后台导航">
      <ul className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:pb-0">
        {ADMIN_NAV.map((item) => {
          const active = isAdminNavActive(pathname, item.href);

          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-11 items-center gap-2 rounded-md px-3 text-sm whitespace-nowrap transition-colors duration-hover ease-out-quint',
                  active
                    ? 'bg-accent-soft text-accent'
                    : 'text-fg-secondary hover:bg-surface hover:text-fg',
                )}
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
