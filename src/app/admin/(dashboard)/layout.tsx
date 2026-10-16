import type { ReactNode } from 'react';
import { AdminShell } from '../_components/AdminShell';

/**
 * 需要登录的后台页面共用外壳。
 *
 * 把「需要登录」这件事绑定在路由组上，而不是靠每个页面自己检查：
 * 新增页面时只要放进 (dashboard)，就自动获得侧边栏、顶栏与登录守卫，
 * 也不存在「忘了加守卫」这种漏洞。
 */
export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
