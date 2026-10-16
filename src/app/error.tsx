'use client';

import { useEffect } from 'react';
import { Container } from '@/components/layout/Container';
import { Section } from '@/components/layout/Section';
import { Button } from '@/components/ui/Button';

/**
 * 路由级错误边界（PRD F-006 的「网络/渲染错误提示」部分）
 *
 * 必须是客户端组件：Error Boundary 依赖 React 的客户端错误捕获机制。
 * 这里只做「说明发生了什么事 + 给一个重试入口」，
 * 纯静态站没有错误上报服务，因此把错误打到控制台，便于本地与 Preview 排查。
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Section className="flex min-h-[60dvh] items-center">
      <Container>
        <h1 className="text-2xl font-semibold text-fg md:text-[2rem]">页面出错了</h1>
        <p className="mt-4 max-w-[var(--prose-max)] text-sm text-fg-secondary md:text-base">
          渲染这一页时发生了未预期的错误。可以先重试一次，如果问题持续出现，
          欢迎通过邮件告诉我。
        </p>

        {error.digest ? (
          <p className="mt-4 font-mono text-xs text-fg-muted">错误编号：{error.digest}</p>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-3">
          <Button href="/" variant="primary" icon="arrowRight">
            返回首页
          </Button>
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-line bg-surface px-4 text-sm font-medium text-fg transition-colors duration-hover ease-out-quint hover:border-line-strong hover:bg-surface-hover"
          >
            重试
          </button>
        </div>
      </Container>
    </Section>
  );
}
