'use client';

import Link from 'next/link';
import { useCallback } from 'react';
import { api, type DashboardStats } from '@/api';
import { Icon } from '@/components/ui/Icon';
import { formatDate } from '@/lib/utils/date';
import { ADMIN_NAV } from '../_components/AdminNav';
import { AdminPageHeader } from '../_components/AdminPageHeader';
import { ConfirmButton } from '../_components/ConfirmButton';
import {
  ErrorBlock,
  InlineNotice,
  LoadingBlock,
  StatusBanner,
} from '../_components/Feedback';
import { useAsyncData } from '../_hooks/useAsyncData';
import { useSubmit } from '../_hooks/useSubmit';
import { formatTimestamp } from '../_lib/format';
import { StatCard } from './_components/StatCard';

/**
 * 仪表盘。
 *
 * 取值与格式化都在 loader 里完成（而不是在渲染中调 new Date / Intl）：
 * 渲染期必须保持纯粹，否则 React 编译器会按「渲染期间有副作用」报错，
 * 而这里的格式化的确依赖当前的时区与语言环境。
 */
type DashboardView = {
  stats: DashboardStats;
  loginLabel: string | null;
  latestLabel: string | null;
};

export default function AdminDashboardPage() {
  const load = useCallback(async (): Promise<DashboardView> => {
    const stats = await api.dashboard.stats();

    return {
      stats,
      loginLabel: stats.session ? formatTimestamp(stats.session.loginAt) : null,
      latestLabel: stats.posts.latestDate ? formatDate(stats.posts.latestDate) : null,
    };
  }, []);

  const { data, status, error, reload } = useAsyncData(load);
  const { saving, feedback, submit } = useSubmit();

  function handleReset() {
    void submit(async () => {
      await api.resetAll();
      reload();
    }, '已恢复成初始的演示数据。');
  }

  const shortcuts = ADMIN_NAV.filter((item) => item.href !== '/admin');

  return (
    <>
      <AdminPageHeader
        title="仪表盘"
        description="一览内容规模与登录状态，并快速跳到各个编辑入口。"
      />

      <div className="flex flex-col gap-6">
        <InlineNotice icon={<Icon name="info" />}>
          <p className="font-medium text-fg">这里改的是本地模拟数据</p>
          <p className="mt-1">
            当前接口层（<code className="text-fg">src/api</code>）用 localStorage 模拟后端，
            数据只存在这台浏览器上，且与前台页面互相独立 —— 前台读的是仓库里的
            <code className="text-fg">content/</code> 与 <code className="text-fg">src/config</code>。
            换成真实后端时只需要替换接口层的实现，这里的界面不用改。
          </p>
        </InlineNotice>

        {status === 'loading' ? <LoadingBlock label="正在读取本地数据…" /> : null}

        {status === 'error' ? <ErrorBlock message={error ?? ''} onRetry={reload} /> : null}

        {data ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                icon="blog"
                label="博客文章"
                value={data.stats.posts.total}
                hint={data.latestLabel ? `最近一篇 ${data.latestLabel}` : '还没有文章'}
              />
              <StatCard
                icon="edit"
                label="草稿"
                value={data.stats.posts.drafts}
                hint="draft: true，不参与前台构建"
              />
              <StatCard
                icon="projects"
                label="项目"
                value={data.stats.projects.total}
                hint={`其中 ${data.stats.projects.featured} 个首页精选`}
              />
              <StatCard
                icon="code"
                label="技能"
                value={data.stats.skills.total}
                hint="分类来自 src/config/skills.ts"
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <section className="rounded-lg border border-line bg-surface p-4 md:p-6">
                <h2 className="text-base font-semibold text-fg">快捷入口</h2>
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {shortcuts.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="flex min-h-11 items-center gap-2 rounded-md border border-line px-3 text-sm text-fg-secondary transition-colors duration-hover ease-out-quint hover:border-line-strong hover:bg-surface-hover hover:text-fg"
                      >
                        <Icon name={item.icon} />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="rounded-lg border border-line bg-surface p-4 md:p-6">
                <h2 className="text-base font-semibold text-fg">当前会话</h2>
                <dl className="mt-4 flex flex-col gap-3 text-sm">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <dt className="text-fg-muted">登录账号</dt>
                    <dd className="min-w-0 truncate text-fg">{data.stats.session?.email ?? '未登录'}</dd>
                  </div>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <dt className="text-fg-muted">本次登录时间</dt>
                    <dd className="text-fg tabular-nums">{data.loginLabel ?? '—'}</dd>
                  </div>
                </dl>
                <p className="mt-4 text-xs leading-5 text-fg-muted">
                  登录态存在 localStorage 的 <code>starfolio:admin:session</code> 键下，
                  在另一个标签页退出登录，本页也会同步退出。
                </p>
              </section>
            </div>

            <section className="rounded-lg border border-line bg-surface p-4 md:p-6">
              <h2 className="text-base font-semibold text-fg">重置演示数据</h2>
              <p className="mt-2 max-w-[var(--prose-max)] text-sm text-fg-muted">
                把所有资源恢复成初始种子数据（个人信息、站点设置、技能、项目、博客）。
                适合把界面改乱了之后快速恢复；这一步不影响登录状态。
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <ConfirmButton
                  label="重置全部数据"
                  question="确认把全部资源恢复成初始数据？"
                  onConfirm={handleReset}
                  busy={saving}
                />
                {saving ? <span className="text-sm text-fg-muted">正在重置…</span> : null}
              </div>
              {feedback ? (
                <div className="mt-4">
                  <StatusBanner feedback={feedback} />
                </div>
              ) : null}
            </section>
          </>
        ) : null}
      </div>
    </>
  );
}
