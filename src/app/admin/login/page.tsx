import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { Icon } from '@/components/ui/Icon';
import { StarField } from '@/components/stars/StarField';
import { siteConfig } from '@/config/site';
import { LoginForm } from '../_components/LoginForm';

export const metadata: Metadata = {
  title: '登录',
};

/**
 * 登录页。
 *
 * 星空只出现在这一页：它是后台的「门口」，保留一点站点气质是值得的；
 * 进来之后的工具页面则一律用干净的纯色背景（改数据时不需要背景在动）。
 * 星空组件本身已处理降级、暂停与 reduced-motion，这里直接复用，不重复实现氛围。
 *
 * 之所以要 Suspense：LoginForm 用 useSearchParams 读 next 参数，
 * 而 Next 在静态预渲染时要求这类组件被 Suspense 包住，否则构建会直接报错。
 */
function LoginFallback() {
  return (
    <div className="w-full max-w-md rounded-xl border border-line bg-surface/90 p-6 md:p-8">
      <p role="status" className="text-sm text-fg-muted">
        正在加载登录表单…
      </p>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <>
      <StarField />

      <main className="relative z-[var(--z-content)] flex min-h-[100dvh] flex-col items-center justify-center gap-8 px-4 py-12">
        <div className="flex items-center gap-2 text-sm font-semibold text-fg">
          <Icon name="dashboard" />
          <span>
            {siteConfig.name}
            <span className="font-normal text-fg-muted"> · 后台</span>
          </span>
        </div>

        <Suspense fallback={<LoginFallback />}>
          <LoginForm />
        </Suspense>

        <Link
          href="/"
          className="text-sm text-fg-muted underline decoration-line underline-offset-4 transition-colors duration-hover ease-out-quint hover:text-accent"
        >
          返回前台
        </Link>
      </main>
    </>
  );
}
