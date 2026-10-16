'use client';

import { useCallback } from 'react';
import { api, type SiteSettings } from '@/api';
import { AdminPageHeader } from '@/app/admin/_components/AdminPageHeader';
import { ErrorBlock, InlineNotice, LoadingBlock } from '@/app/admin/_components/Feedback';
import { useAsyncData } from '@/app/admin/_hooks/useAsyncData';
import { SettingsForm } from './_components/SettingsForm';

/**
 * 站点设置（/admin/settings）。
 *
 * 与个人信息页同构：页面取数、表单自理。设置项里有构建期常量（站点地址、OG 图），
 * 因此顶部必须有一条说明，否则用户改了 siteUrl 却发现 canonical 没变，会以为保存失败。
 */
export default function AdminSettingsPage() {
  const load = useCallback((): Promise<SiteSettings> => api.settings.get(), []);
  const { data, status, error, reload } = useAsyncData(load);

  return (
    <>
      <AdminPageHeader
        title="站点设置"
        description="站点地址、SEO 元信息、简历入口、博客分页与导航结构。"
      />

      <div className="flex flex-col gap-6">
        <InlineNotice tone="warning">
          <p className="font-medium text-fg">部分字段只在后台生效</p>
          <p className="mt-1">
            站点地址、站点描述与 OG 分享图在前台是<strong>构建期常量</strong>（来自{' '}
            <code className="text-fg">NEXT_PUBLIC_SITE_URL</code> 与{' '}
            <code className="text-fg">src/config/site.ts</code>），改这里不会立刻改变前台的
            canonical / OG / sitemap。接入真实后端后，这些值才会成为唯一的配置来源。
          </p>
        </InlineNotice>

        {status === 'loading' ? <LoadingBlock label="正在读取站点设置…" /> : null}

        {status === 'error' ? <ErrorBlock message={error ?? ''} onRetry={reload} /> : null}

        {data ? <SettingsForm initial={data} /> : null}
      </div>
    </>
  );
}
