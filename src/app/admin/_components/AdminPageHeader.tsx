import type { ReactNode } from 'react';

/**
 * 后台页面标题区。
 *
 * 每个后台页面只允许有一个 h1（可访问性要求：标题层级不跳级），因此这里固定用 h1，
 * 页面内部的小节一律用 h2 —— FormPanel 的标题就是 h2。
 */
export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-[var(--prose-max)]">
        <h1 className="text-xl font-semibold text-fg md:text-2xl">{title}</h1>
        {description ? <p className="mt-2 text-sm text-fg-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
