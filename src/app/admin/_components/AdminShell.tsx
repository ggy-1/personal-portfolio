'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { siteConfig } from '@/config/site';
import { useAdminSession } from '../_hooks/useAdminSession';
import { AdminNav, findAdminNavItem } from './AdminNav';

/**
 * 后台外壳：路由守卫 + 侧边栏 + 顶栏。
 *
 * **为什么守卫在客户端**：登录态存在 localStorage，而 localStorage 只存在于浏览器。
 * 服务端渲染时无法得知是否已登录，因此 middleware 或服务端重定向都做不到
 * （总不能把「没登录」当成服务端结论 —— 那会把已登录的用户也踢出去）。
 * 代价是首次渲染会先显示一帧「正在检查登录状态」，换来的是不需要任何后端。
 *
 * **为什么不复用前台 NavBar**：前台导航承担的是「访客读内容」的任务，
 * 后台需要的是「站长改数据」的入口与当前所在位置的指示，两者的信息架构完全不同。
 * 更实际的理由是：把前台的星空 + 顶栏 + 页脚带进后台，等于给工具页加了一层无用的负担。
 *
 * 未登录时子节点根本不会被渲染（这里直接返回占位屏），因此不存在「页面已经取到数据
 * 才发现没登录」的情况。
 */
export function AdminShell({ children }: { children: ReactNode }) {
  const { state, signOut } = useAdminSession();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (state.status !== 'anonymous') return;

    // 带上 next：登录后回到原来想去的页面，而不是一律回仪表盘
    router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
  }, [state.status, pathname, router]);

  if (state.status !== 'authenticated') {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center px-4">
        <p role="status" className="text-sm text-fg-muted">
          {state.status === 'anonymous' ? '登录状态已失效，正在跳转到登录页…' : '正在检查登录状态…'}
        </p>
      </div>
    );
  }

  const current = findAdminNavItem(pathname);

  return (
    <div className="lg:grid lg:min-h-[100dvh] lg:grid-cols-[15rem_minmax(0,1fr)]">
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[var(--z-toast)] focus:rounded-md focus:border focus:border-line focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:text-fg"
      >
        跳到主要内容
      </a>

      <aside className="border-b border-line bg-subtle/50 lg:sticky lg:top-0 lg:h-[100dvh] lg:overflow-y-auto lg:border-r lg:border-b-0">
        <div className="px-3 pt-4 pb-2 lg:px-4 lg:pt-5">
          <Link
            href="/admin"
            className="flex min-h-11 items-center gap-2 rounded-md px-1 text-sm font-semibold text-fg transition-colors duration-hover ease-out-quint hover:text-accent"
          >
            <Icon name="dashboard" />
            <span className="min-w-0 truncate">
              {siteConfig.name}
              <span className="font-normal text-fg-muted"> · 后台</span>
            </span>
          </Link>
        </div>

        <div className="px-3 pb-4 lg:pb-6">
          <AdminNav />
        </div>

        <div className="hidden px-4 pb-6 lg:block">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-2 rounded-md text-sm text-fg-secondary transition-colors duration-hover ease-out-quint hover:text-accent"
          >
            <Icon name="external" />
            返回前台
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="no-print sticky top-0 z-[var(--z-sticky)] flex flex-wrap items-center justify-between gap-3 border-b border-line bg-page/90 px-4 py-2.5 backdrop-blur-md md:px-6 lg:px-8">
          <p className="text-sm font-medium text-fg">{current?.label ?? '后台管理'}</p>

          <div className="flex items-center gap-2">
            <p
              className="hidden max-w-[16rem] truncate text-xs text-fg-muted md:block"
              title={state.session.email}
            >
              {state.session.email}
            </p>
            <Link
              href="/"
              className="inline-flex min-h-11 items-center rounded-md px-3 text-sm text-fg-secondary transition-colors duration-hover ease-out-quint hover:bg-surface hover:text-fg lg:hidden"
            >
              前台
            </Link>
            <Button
              variant="ghost"
              icon="logout"
              onClick={() => {
                void signOut();
              }}
            >
              退出登录
            </Button>
          </div>
        </header>

        <main id="admin-main" className="flex-1 px-4 py-6 md:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
