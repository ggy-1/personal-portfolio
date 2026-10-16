import { siteUrl } from '@/config/env';
import { siteConfig } from '@/config/site';
import { skillCategories } from '@/config/skills';
import type { AdminPost, AdminProject, AdminSkill, Profile, SiteSettings } from './types';

/**
 * 后台初始数据（种子）。
 *
 * 数据来源有两处，刻意保持一致：
 *  - 个人信息 / 站点设置：从 src/config/site.ts 复制，让后台一打开就是「站点当前的样子」，
 *    而不是一份无关的假数据；
 *  - 项目 / 文章：从 content/ 下已经存在的 MDX frontmatter 复制。
 *
 * 为什么不直接 import 真实内容：那会让「后台改数据 → 前台立即变」变成假象（前台读的是
 * content/ 与 src/config，后台写的是 localStorage），也会把 lib/content 拉进客户端包。
 * 这些是「可编辑的副本」，独立性是刻意的，理由见 src/api/index.ts 顶部说明。
 */

/* ==================== 个人信息（单例） ==================== */

export const profileSeed: Profile = {
  name: siteConfig.name,
  role: siteConfig.role,
  keywords: [...siteConfig.keywords],
  email: siteConfig.email,
  avatar: siteConfig.avatar,
  socials: structuredClone(siteConfig.socials),
  /** 现状：PRD F-035「目前在做 / 寻找什么机会」 */
  location: '目前开放远程全职机会，也接小范围的前端咨询与性能优化。',
  /** 自述：PRD F-030，200–400 字 */
  bio: '五年前端开发，主要做内容型站点与数据密集型界面。喜欢把「响应快、读得下去、能长期维护」这三件事同时做对，也因此对性能预算、设计 token 化和无障碍有近乎固执的要求。这个站点本身就是我的作品样本：没有数据库、没有后台的纯静态站，文章与项目都是一次 push 就上线。',
};

/* ==================== 站点设置（单例） ==================== */

export const settingsSeed: SiteSettings = {
  siteUrl,
  description: siteConfig.meta.description,
  ogImage: siteConfig.meta.ogImage,
  resumeUrl: siteConfig.resumeUrl,
  postsPerPage: 10,
  nav: structuredClone(siteConfig.nav),
};

/* ==================== 技能（集合） ==================== */

/**
 * 把 src/config/skills.ts 的嵌套结构拍平成带 categoryId 的列表。
 * 拍平是为了让后台列表能按行编辑；分类本身仍由配置文件定义，后台不新增分类。
 */
export const skillsSeed: AdminSkill[] = skillCategories.flatMap((category) =>
  category.skills.map((skill, index) => ({
    ...skill,
    // 合并名称与序号：同一分类下即使重名技能也不会撞 id
    id: `skill-${category.id}-${String(index + 1).padStart(2, '0')}`,
    categoryId: category.id,
  })),
);

/* ==================== 项目（集合） ==================== */

export const projectsSeed: AdminProject[] = [
  {
    id: 'project-001',
    title: 'starfolio · 个人作品集与技术博客',
    year: '2026',
    role: '独立开发（设计 + 前端 + 内容管线）',
    stack: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS'],
    summary:
      '包含基于 localStorage 模拟数据的纯前端无服务器管理后台，已为后续接入真实数据库预留统一 API 层。',
    cover: '/images/projects/starfolio.svg',
    featured: true,
    status: 'active',
    repo: 'https://github.com/your-name/starfolio',
    metrics: [
      '首屏 JS 从 210KB 压到 84KB（gzip）',
      'Lighthouse 四项均 ≥ 95',
      '新增文章 = 1 个 MDX 文件 + 1 次 push',
    ],
    order: 1,
  },
  {
    id: 'project-002',
    title: '数据看板的前端重构',
    year: '2025',
    role: '前端负责人（3 人）',
    stack: ['React', 'TypeScript', 'Vite', 'Tailwind CSS'],
    summary: '把一份 4 年历史的 jQuery 看板迁到 React，在不中断业务的前提下按模块灰度替换。',
    cover: '/images/projects/insight-dashboard.svg',
    featured: true,
    status: 'completed',
    metrics: ['首屏从 3.2s 优化到 1.1s', '单页代码拆分后首屏 JS 减少 62%', '灰度期间零业务中断'],
    order: 2,
  },
  {
    id: 'project-003',
    title: '离线优先的移动端阅读器',
    year: '2025',
    role: '独立开发',
    stack: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
    summary:
      '为通勤场景设计的阅读器：先下载后阅读，弱网和地铁里都能翻页，同步冲突靠版本向量解决。',
    cover: '/images/projects/pocket-reader.svg',
    featured: true,
    status: 'archived',
    repo: 'https://github.com/your-name/pocket-reader',
    metrics: ['弱网下翻页响应 < 80ms', '离线可用率 100%', '同步冲突自动解决率 97%'],
    order: 3,
  },
];

/* ==================== 博客（集合） ==================== */

/**
 * 三篇已发布 + 两篇草稿。
 * 草稿是刻意留的——否则仪表盘的「草稿数」永远是 0，没法验证这个统计到底通没通。
 */
export const postsSeed: AdminPost[] = [
  {
    id: 'post-001',
    title: '在 App Router 里正确使用 Server Components',
    date: '2026-09-18',
    summary:
      "把整页标记成 'use client' 是最省事也最贵的做法。这篇记录我如何把一个内容型页面拆回服务端渲染，并把客户端 JS 从 210KB 降到 84KB。",
    tags: ['React', 'Next.js', '性能优化'],
    cover: '/images/blog/server-components.svg',
    draft: false,
  },
  {
    id: 'post-002',
    title: '容器查询：让组件自己决定布局',
    date: '2026-08-02',
    summary:
      '媒体查询问的是「窗口多宽」，可组件真正关心的是「我被放在多宽的地方」。容器查询把断点从页面挪到了组件，这篇记录它在真实项目里省掉了什么。',
    tags: ['CSS', '前端工程'],
    cover: '/images/blog/container-queries.svg',
    draft: false,
  },
  {
    id: 'post-003',
    title: '给首屏 JS 定一个预算，然后守住它',
    date: '2026-06-24',
    summary:
      '性能优化最怕「这次先加上，以后再优化」。给首屏 JS 定一个数字写进 CI，比任何优化技巧都管用——这篇是预算表的制定过程与踩过的坑。',
    tags: ['性能优化', '构建工具'],
    cover: '/images/blog/performance-budget.svg',
    draft: false,
  },
  {
    id: 'post-004',
    title: '静态搜索的中文分词：bigram 够用吗',
    date: '2026-10-12',
    summary:
      '纯静态站没有服务端，搜索只能在浏览器里做。这篇对比 bigram 切分与 Intl.Segmenter，并给出索引体积的实测数字。',
    tags: ['性能优化', '前端工程'],
    cover: '/images/blog/search-tokenizer.svg',
    draft: true,
  },
  {
    id: 'post-005',
    title: '为什么这个站点没有数据库',
    date: '2026-10-05',
    summary:
      '单作者、只读为主、周级更新的展示型站点，引入后端和数据库不会让它变快，只会让它变慢、变贵、变难维护。',
    tags: ['前端工程'],
    draft: true,
  },
];
