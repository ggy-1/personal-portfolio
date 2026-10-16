import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { siteConfig } from '@/config/site';

/**
 * /admin 的管理外壳。
 *
 * 这一层刻意「什么都不做」：不渲染星空、不渲染前台顶栏与页脚，只是给后台加一层
 * 不该被搜索引擎看到的 metadata，然后把 children 原样交出去。
 *
 * 为什么连侧边栏都不在这里：/admin/login 也在这一层下面，而登录页不该有侧边栏。
 * 需要侧边栏的页面放在路由组 (dashboard) 里，由那一层的布局套 AdminShell。
 * 路由组不参与 URL，所以 URL 仍然是 /admin、/admin/profile 这类。
 */
export const metadata: Metadata = {
  title: {
    default: `后台管理 · ${siteConfig.name}`,
    template: `%s · 后台 · ${siteConfig.name}`,
  },
  description: '站点后台：管理个人信息、技能、项目与博客。',
  // 后台不该出现在搜索结果里。robots.ts 里还额外 Disallow 了 /admin，
  // 这一条是给「已经抓取到的页面」兜底。
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return children;
}
