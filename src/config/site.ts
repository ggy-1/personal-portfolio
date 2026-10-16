import type { SiteConfig } from '@/lib/content/schema';

/**
 * 站点配置 —— 页面上出现的一切站点级文案都来自这里（AGENTS.md 4.4 第 2 条）。
 *
 * TODO(待你替换)：name / role / keywords / email / socials 目前是占位内容，
 * 请替换成你自己的信息后再上线；meta.description 会用于 SEO 与社交分享。
 */
export const siteConfig: SiteConfig = {
  name: '你的名字',
  role: '前端开发 / 全栈爱好者',
  keywords: ['React', 'TypeScript', 'Node.js'],
  email: 'hello@example.com',
  resumeUrl: '/resume.pdf',
  avatar: '/images/avatar.svg',
  socials: [
    {
      id: 'github',
      label: 'GitHub',
      href: 'https://github.com/your-name',
      icon: 'github',
      handle: '@your-name',
    },
    {
      id: 'mail',
      label: '邮箱',
      href: 'mailto:hello@example.com',
      icon: 'mail',
      handle: 'hello@example.com',
    },
    {
      id: 'rss',
      label: 'RSS',
      href: '/rss.xml',
      icon: 'rss',
    },
  ],
  nav: [
    { href: '/', label: '首页', icon: 'home' },
    { href: '/projects', label: '项目', icon: 'projects' },
    { href: '/blog', label: '博客', icon: 'blog' },
    { href: '/about', label: '关于', icon: 'about' },
  ],
  meta: {
    description:
      '个人作品集与技术博客：前端开发、TypeScript、性能优化与工程化。记录项目、沉淀思考。',
    ogImage: '/images/og-default.svg',
    locale: 'zh-CN',
  },
};
