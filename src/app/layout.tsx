import type { Metadata, Viewport } from 'next';
import './globals.css';
import { siteUrl } from '@/config/env';
import { siteConfig } from '@/config/site';
import { buildMetadata } from '@/lib/seo/metadata';

/**
 * 根布局 —— 只负责「所有路由都必须有的东西」：<html>/<body>、全局样式、站点级 metadata。
 *
 * 为什么前台外壳不在这里：/admin 也是根布局的子节点，一旦把星空、顶栏、页脚放在这一层，
 * 后台页面就会连带着渲染前台导航 —— 而需求要求后台用自己的一套布局。
 * 因此前台外壳下沉到 src/app/(site)/layout.tsx，后台外壳在 src/app/admin/ 下各自实现。
 *
 * 路由组 (site) 不参与 URL：把页面放进 (site) 之后地址仍然是 /、/about、/blog/[slug]。
 */
export const metadata: Metadata = {
  // metadataBase 让所有相对路径（OG 图、canonical）自动补成绝对地址
  metadataBase: new URL(siteUrl),
  ...buildMetadata(),
};

export const viewport: Viewport = {
  colorScheme: 'dark',
  // 移动端浏览器地址栏配色。必须是字面量（浏览器读不到 CSS 变量），
  // 取值与 src/styles/tokens.css 的 --c-space-900 保持一致。
  themeColor: '#05070d',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // body 不加背景色：星空层是 z-index 负值的 fixed 元素，body 一旦有背景会把它完全遮住
  // （详见 src/app/globals.css 与 PRD 5.3）
  return (
    <html lang={siteConfig.meta.locale}>
      <body className="min-h-[100dvh]">{children}</body>
    </html>
  );
}
