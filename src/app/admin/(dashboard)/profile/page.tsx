'use client';

import { useCallback } from 'react';
import { api, type Profile } from '@/api';
import { AdminPageHeader } from '@/app/admin/_components/AdminPageHeader';
import { ErrorBlock, InlineNotice, LoadingBlock } from '@/app/admin/_components/Feedback';
import { useAsyncData } from '@/app/admin/_hooks/useAsyncData';
import { ProfileForm } from './_components/ProfileForm';

/**
 * 个人信息管理（/admin/profile）。
 *
 * 页面只负责「取数 + 加载/报错状态」，表单自己管本地状态、校验与保存。
 * 这样分工的结果是：表单拿到 initial 之后就是一个独立单元，
 * 页面不需要知道它有几个字段、也不需要为它维护 diff 状态。
 *
 * loader 用 useCallback 固定引用 —— useAsyncData 把它放进依赖里，
 * 每次渲染都新建函数会导致无限重新取数。
 */
export default function AdminProfilePage() {
  const load = useCallback((): Promise<Profile> => api.profile.get(), []);
  const { data, status, error, reload } = useAsyncData(load);

  return (
    <>
      <AdminPageHeader
        title="个人信息"
        description="姓名、定位、自述与社交链接。首页 Hero 与关于页的内容都来自这里。"
      />

      <div className="flex flex-col gap-6">
        <InlineNotice>
          这里的修改写入浏览器本地存储，只影响本后台的演示数据。前台页面读的是仓库里的{' '}
          <code className="text-fg">src/config/site.ts</code>，因此改动不会立刻反映到前台 ——
          接入真实后端后这两处才会合并成同一个数据源。
        </InlineNotice>

        {status === 'loading' ? <LoadingBlock label="正在读取个人信息…" /> : null}

        {status === 'error' ? (
          <ErrorBlock message={error ?? ''} onRetry={reload} />
        ) : null}

        {data ? <ProfileForm initial={data} /> : null}
      </div>
    </>
  );
}
