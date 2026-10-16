import type { Metadata } from 'next';
import { siteUrl } from '@/config/env';
import { Footer } from '@/components/layout/Footer';
import { NavBar } from '@/components/layout/NavBar';
import { TabBar } from '@/components/layout/TabBar';
import { StarField } from '@/components/stars/StarField';
import { personJsonLd } from '@/lib/seo/jsonld';

/**
 * 前台布局 —— 星空 + 顶部导航 + 页脚 + 移动端 Tab Bar。
 *
 * 挂在路由组 (site) 上，因此只作用于面向访客的页面。
 * 后台（/admin）走自己的一套外壳，不继承这里的任何元素，见 src/app/admin/layout.tsx。
 *
 * 路由组不进 URL，把页面挪进 (site) 不会改变任何地址。
 */
export const metadata: Metadata = {
  alternates: {
    canonical: siteUrl,
    // 让阅读器与浏览器能自动发现 RSS
    types: { 'application/rss+xml': `${siteUrl}/rss.xml` },
  },
};

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* 键盘用户跳过导航直达正文（PRD F-009） */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[var(--z-toast)] focus:rounded-md focus:border focus:border-line focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:text-fg"
      >
        跳到主要内容
      </a>

      <StarField />
      <NavBar />

      {/* 底部留出 TabBar 的高度与安全区，避免内容与页脚被移动端导航压住 */}
      <div className="pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
        <main id="main" className="relative z-[var(--z-content)]">
          {children}
        </main>

        <Footer />
      </div>

      <TabBar />

      <script
        type="application/ld+json"
        // 内容来自本站配置，且 jsonld.ts 已对 `<` 做转义
        dangerouslySetInnerHTML={{ __html: personJsonLd() }}
      />
    </>
  );
}
