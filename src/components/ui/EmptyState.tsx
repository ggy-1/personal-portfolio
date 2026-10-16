import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/Button';

/**
 * 空状态（PRD F-006）
 *
 * 列表为空时必须给出「下一步做什么」，而不是留一片空白：
 * 骨架搭好但还没写内容时，这一屏是访客最先看到的东西。
 */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: { label: string; href: string };
}) {
  return (
    <Container>
      <div className="rounded-lg border border-dashed border-line bg-surface/50 px-6 py-12 text-center">
        <p className="text-sm font-semibold text-fg">{title}</p>
        {description ? (
          <p className="mx-auto mt-2 max-w-[var(--prose-max)] text-sm text-fg-muted">
            {description}
          </p>
        ) : null}
        {action ? (
          <div className="mt-6 flex justify-center">
            <Button href={action.href} icon="arrowRight">
              {action.label}
            </Button>
          </div>
        ) : null}
      </div>
    </Container>
  );
}
