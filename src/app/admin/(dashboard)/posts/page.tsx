'use client';

import { useCallback, useState } from 'react';
import { api, type AdminPost } from '@/api';
import { AdminPageHeader } from '@/app/admin/_components/AdminPageHeader';
import { Button } from '@/components/ui/Button';
import { ConfirmButton } from '@/app/admin/_components/ConfirmButton';
import {
  Badge,
  EmptyBlock,
  ErrorBlock,
  InlineNotice,
  LoadingBlock,
  StatusBanner,
} from '@/app/admin/_components/Feedback';
import { useAsyncData } from '@/app/admin/_hooks/useAsyncData';
import { useSubmit, type SubmitFeedback } from '@/app/admin/_hooks/useSubmit';
import { formatDate } from '@/lib/utils/date';
import { cn } from '@/lib/utils/cn';
import { PostForm } from './_components/PostForm';

type Filter = 'all' | 'published' | 'draft';

const FILTERS: readonly { value: Filter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'published', label: '已发布' },
  { value: 'draft', label: '草稿' },
];

type View = { mode: 'list' } | { mode: 'create' } | { mode: 'edit'; post: AdminPost };

/**
 * 博客管理（/admin/posts）。
 *
 * 排序按日期字符串倒序 —— 内容日期是 YYYY-MM-DD，ISO 格式天然可比，
 * 不做 Date 解析（AGENTS.md 5 的日期铁律）。
 *
 * 筛选用 aria-pressed 的按钮组而不是 <select>：三个选项都值得一眼看到数量趋势，
 * 下拉会把「有 3 篇草稿」这个信息藏起来。
 */
export default function AdminPostsPage() {
  const load = useCallback(async (): Promise<AdminPost[]> => {
    const items = await api.posts.list();
    // 直接比较 YYYY-MM-DD 字符串：等价于按时间排序，且不受构建机器时区影响
    return [...items].sort((a, b) => b.date.localeCompare(a.date));
  }, []);

  const { data, status, error, reload } = useAsyncData(load);
  const [view, setView] = useState<View>({ mode: 'list' });
  const [filter, setFilter] = useState<Filter>('all');
  const { saving, feedback, submit } = useSubmit();

  /**
   * 列表侧的一次性提示。
   *
   * 保存成功后表单会被卸载，它自己的成功反馈条来不及被人看到，因此改成把消息
   * 带回到列表这里显示。与删除的反馈共用同一个展示位，避免同时出现两条提示。
   */
  const [notice, setNotice] = useState<SubmitFeedback | null>(null);

  function handleDelete(post: AdminPost) {
    setNotice(null);
    void submit(async () => {
      await api.posts.remove(post.id);
      reload();
    }, `已删除文章「${post.title}」。`);
  }

  /** 进入表单前清掉旧提示：上一次的成功消息不该陪到新一次编辑里 */
  function openForm(next: View) {
    setNotice(null);
    setView(next);
  }

  function backToList() {
    setView({ mode: 'list' });
  }

  const posts = data ?? [];
  const visible = posts.filter((post) => {
    if (filter === 'draft') return post.draft;
    if (filter === 'published') return !post.draft;
    return true;
  });
  const draftCount = posts.filter((post) => post.draft).length;
  const editing = view.mode !== 'list';
  const banner = feedback ?? notice;

  return (
    <>
      <AdminPageHeader
        title="博客"
        description="维护文章元数据与发布状态。正文仍在仓库的 MDX 文件里。"
        actions={
          view.mode === 'list' ? (
            <Button variant="primary" icon="plus" onClick={() => openForm({ mode: 'create' })}>
              新增文章
            </Button>
          ) : null
        }
      />

      <div className="flex flex-col gap-6">
        <InlineNotice>
          后台只维护 frontmatter（标题、日期、标签、摘要等）。正文内容与 URL 里的 slug 来自{' '}
          <code className="text-fg">content/blog/YYYY-MM-DD-slug.mdx</code> 的文件名，
          因此这里的标题改动不会重命名文件。
        </InlineNotice>

        {editing ? (
          <PostForm
            key={view.mode === 'edit' ? view.post.id : 'new'}
            initial={view.mode === 'edit' ? view.post : null}
            onSaved={(message) => {
              setNotice({ kind: 'success', message });
              backToList();
              reload();
            }}
            onCancel={backToList}
          />
        ) : (
          <>
            {status === 'loading' ? <LoadingBlock label="正在读取文章…" /> : null}
            {status === 'error' ? <ErrorBlock message={error ?? ''} onRetry={reload} /> : null}

            {banner ? <StatusBanner feedback={banner} /> : null}

            {status === 'ready' ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-fg-muted">
                  共 {posts.length} 篇，其中草稿 {draftCount} 篇
                </p>

                <div role="group" aria-label="按发布状态筛选" className="flex gap-1">
                  {FILTERS.map((option) => {
                    const active = filter === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setFilter(option.value)}
                        className={cn(
                          'min-h-11 rounded-md px-3 text-sm transition-colors duration-hover ease-out-quint',
                          active
                            ? 'bg-accent-soft text-accent'
                            : 'text-fg-secondary hover:bg-surface hover:text-fg',
                        )}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {status === 'ready' && posts.length === 0 ? (
              <EmptyBlock title="还没有文章" description="点右上角「新增文章」开始添加。" />
            ) : null}

            {status === 'ready' && posts.length > 0 && visible.length === 0 ? (
              <EmptyBlock
                title={filter === 'draft' ? '没有草稿' : '没有已发布的文章'}
                description="换个筛选项看看。"
              />
            ) : null}

            {visible.length > 0 ? (
              <ul className="flex flex-col gap-3">
                {visible.map((post) => (
                  <li key={post.id} className="rounded-lg border border-line bg-surface p-4 md:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-base font-semibold text-fg">{post.title}</h2>
                          {post.draft ? <Badge tone="warning">草稿</Badge> : null}
                        </div>

                        <p className="mt-1 text-xs text-fg-muted tabular-nums">
                          {formatDate(post.date)}
                          {post.updated ? ` · 更新于 ${formatDate(post.updated)}` : ''}
                        </p>

                        <p className="mt-2 max-w-[var(--prose-max)] text-sm text-fg-secondary">
                          {post.summary}
                        </p>

                        {post.tags.length > 0 ? (
                          <ul className="mt-3 flex flex-wrap gap-2">
                            {post.tags.map((tag) => (
                              <li key={tag}>
                                <Badge>{tag}</Badge>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <Button
                          variant="secondary"
                          icon="edit"
                          onClick={() => openForm({ mode: 'edit', post })}
                        >
                          编辑
                        </Button>
                        <ConfirmButton
                          label="删除"
                          question={`确认删除「${post.title}」？`}
                          busy={saving}
                          onConfirm={() => handleDelete(post)}
                        />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        )}
      </div>
    </>
  );
}
