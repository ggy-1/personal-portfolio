import type {
  NavItem,
  PostFrontmatter,
  ProjectFrontmatter,
  SiteConfig,
  Skill,
} from '@/lib/content/schema';

/**
 * 后台接口层的数据类型。
 *
 * 规则（与 AGENTS.md 4.1 第 5 条一致）：领域实体的字段不在本文件重新定义，
 * 一律从 src/lib/content/schema.ts 派生 —— 那里是数据模型的唯一事实来源。
 * 本文件只新增「后台才需要、内容文件里没有」的东西：主键 id 与登录会话。
 */

/** 本地存储需要稳定主键；内容文件里 slug 就是标识，但列表编辑需要 id 来定位数组元素 */
export type WithId<T> = T & { id: string };

/* ==================== 登录会话 ==================== */

export type AdminSession = {
  email: string;
  /** ISO 时间字符串。仅供界面展示登录时间，不参与任何鉴权判断 */
  loginAt: string;
};

/* ==================== 个人信息（单例） ==================== */

/**
 * 前台目前从 src/config/site.ts 读取这些值；后台编辑的是同一份数据的「可编辑副本」。
 * bio / location 是 PRD F-030 / F-035 要求、但站点配置里尚未落位的字段。
 */
export type Profile = Pick<
  SiteConfig,
  'name' | 'role' | 'keywords' | 'email' | 'avatar' | 'socials'
> & {
  /** 一句话现状：「目前在做 / 寻找什么机会」（PRD F-035） */
  location: string;
  /** 200–400 字自述（PRD F-030） */
  bio: string;
};

/* ==================== 技能 ==================== */

/** 技能挂在分类下（分类来自 src/config/skills.ts，后台不新增分类） */
export type AdminSkill = WithId<Skill> & { categoryId: string };

/* ==================== 项目 / 博客 ==================== */

export type AdminProject = WithId<ProjectFrontmatter>;
export type AdminPost = WithId<PostFrontmatter>;

/* ==================== 站点设置（单例） ==================== */

export type SiteSettings = Pick<SiteConfig, 'resumeUrl' | 'nav'> & {
  /** 对应 NEXT_PUBLIC_SITE_URL，后台只展示与编辑，真正的构建期取值仍来自环境变量 */
  siteUrl: string;
  description: SiteConfig['meta']['description'];
  ogImage: SiteConfig['meta']['ogImage'];
  /** 博客列表每页条数（PRD F-068） */
  postsPerPage: number;
};

/** 站点设置里可编辑的导航项（与 SiteConfig['nav'] 同构，避免重复定义） */
export type { NavItem };

/* ==================== 仪表盘聚合 ==================== */

export type DashboardStats = {
  posts: { total: number; drafts: number; latestDate: string | null };
  projects: { total: number; featured: number };
  skills: { total: number };
  session: AdminSession | null;
};
