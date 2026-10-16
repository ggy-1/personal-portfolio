import { z } from 'zod';

/**
 * 内容数据模型 —— 全站唯一的事实来源（docs/TECH_DESIGN.md 第 4 节）
 *
 * 规则（AGENTS.md 4.1 第 5 条）：
 *   其他任何地方都不得重复定义这些类型，必须通过 z.infer 或显式 import 派生。
 *   本文件不得 import 任何本地模块，以保证 scripts/ 下的构建脚本能直接引用它。
 */

/* ==================== 共用 ==================== */

/** 标签：统一写法，避免 React / react / React.js 这类同义分裂 */
export const TagSchema = z.string().min(1).max(24);

/** 日期一律按 YYYY-MM-DD 字符串存储，避免构建期时区漂移（TECH_DESIGN T14） */
const DateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式必须是 YYYY-MM-DD（例如 2026-10-16）');

/* ==================== 博客 ==================== */

export const PostFrontmatterSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(80, '标题不超过 80 字'),
  date: DateStringSchema,
  updated: DateStringSchema.optional(),
  summary: z.string().min(1, '摘要不能为空').max(160, '摘要不超过 160 字'),
  tags: z.array(TagSchema).min(1, '至少 1 个标签').max(5, '最多 5 个标签'),
  cover: z.string().optional(),
  draft: z.boolean().default(false),
});

export type PostFrontmatter = z.infer<typeof PostFrontmatterSchema>;

/** 目录项：由正文标题派生，不接受手工编写 */
export type TocItem = {
  id: string;
  text: string;
  level: 2 | 3 | 4;
};

/** Post = frontmatter + 构建期派生字段 */
export type Post = PostFrontmatter & {
  slug: string;
  content: string;
  toc: TocItem[];
  readingMinutes: number;
};

/* ==================== 项目 ==================== */

export const ProjectFrontmatterSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(60, '标题不超过 60 字'),
  year: z
    .string()
    .regex(/^\d{4}$/, 'year 必须是 4 位年份（例如 2026）'),
  role: z.string().min(1, '必须填写我的角色').max(40),
  stack: z.array(z.string().min(1).max(24)).min(1, '至少 1 个技术栈标签').max(10),
  summary: z.string().min(1, '简介不能为空').max(120, '简介不超过 120 字（卡片上一行显示）'),
  cover: z.string().min(1, '项目封面必填'),
  featured: z.boolean().default(false),
  status: z.enum(['active', 'completed', 'archived']).default('completed'),
  demo: z.url('demo 必须是完整 URL（含 https://）').optional(),
  repo: z.url('repo 必须是完整 URL（含 https://）').optional(),
  metrics: z.array(z.string().min(1).max(60)).max(4, '成果数据最多 4 条').default([]),
  order: z.number().int().default(0),
});

export type ProjectFrontmatter = z.infer<typeof ProjectFrontmatterSchema>;

export type Project = ProjectFrontmatter & {
  slug: string;
  content: string;
  toc: TocItem[];
};

/**
 * 列表页使用的摘要类型：刻意不含 content / toc。
 * 防止把整篇正文当作 props 传给组件——列表页只需要元数据，
 * 且一旦未来引入客户端组件，正文会被整段序列化进 RSC payload。
 */
export type PostSummary = Omit<Post, 'content' | 'toc'>;
export type ProjectSummary = Omit<Project, 'content' | 'toc'>;

/** 标签 / 技术栈的聚合结果（由内容派生，不手工维护） */
export type TagSummary = {
  tag: string;
  count: number;
};

/* ==================== 校验报错格式化 ==================== */

/**
 * 把 Zod 的校验结果转成「文件名 + 字段名 + 期望格式」的可定位报错（TECH_DESIGN T12）。
 * 内容校验失败必须阻断构建，报错必须让人一眼看出改哪个文件的哪个字段。
 */
export function formatSchemaIssues(file: string, error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join('.') : '(根字段)';
      return `  - ${path}: ${issue.message}`;
    })
    .join('\n')
    .replace(/^/, `✗ ${file}\n`);
}

/* ==================== 站点配置（src/config/*.ts） ==================== */

export type SocialLink = {
  id: string;
  label: string;
  href: string;
  /** 图标标识，与 src/components/ui/Icon.tsx 中的图标表对应 */
  icon: 'github' | 'mail' | 'x' | 'juejin' | 'rss' | 'link';
  handle?: string;
};

export type NavItem = {
  href: string;
  label: string;
  /** 移动端底部导航的图标名，取值见 src/components/ui/Icon.tsx 的登记表 */
  icon?: string;
};

export type TimelineItem = {
  id: string;
  period: string;
  title: string;
  org?: string;
  description: string;
  tags?: string[];
  status?: 'ongoing' | 'done';
};

/** 三档熟练度，不使用百分比（PRD F-041） */
export type SkillLevel = 'proficient' | 'familiar' | 'learning';

export type Skill = {
  name: string;
  level: SkillLevel;
  /** 关联项目 slug；校验脚本会检查其是否存在（TECH_DESIGN T12） */
  relatedProjects?: string[];
  /** 悬浮说明：具体用它做过什么（PRD F-044） */
  note?: string;
};

export type SkillCategory = {
  id: string;
  label: string;
  /** 图标标识，与 src/components/ui/Icon.tsx 中的图标表对应 */
  icon: 'code' | 'server' | 'wrench' | 'palette';
  skills: Skill[];
};

export type SiteConfig = {
  /** 姓名或昵称，出现在 Hero 与页脚 */
  name: string;
  /** 一句话定位 */
  role: string;
  /** Hero 下方的 3 个关键词 */
  keywords: string[];
  email: string;
  /** 简历路径，放在 public/ 下 */
  resumeUrl: string;
  /** 头像路径，放在 public/ 下（PRD F-030） */
  avatar: string;
  socials: SocialLink[];
  nav: NavItem[];
  meta: {
    description: string;
    ogImage: string;
    locale: string;
  };
};
