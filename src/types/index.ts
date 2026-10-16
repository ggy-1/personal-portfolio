/**
 * 全站类型的统一出口。
 * 组件与页面从 '@/types' 引入类型；具体定义只在 src/lib/content/schema.ts 维护。
 */
export type {
  NavItem,
  Post,
  PostFrontmatter,
  Project,
  ProjectFrontmatter,
  SiteConfig,
  Skill,
  SkillCategory,
  SkillLevel,
  SocialLink,
  TimelineItem,
  TocItem,
} from '@/lib/content/schema';

export {
  PostFrontmatterSchema,
  ProjectFrontmatterSchema,
  TagSchema,
} from '@/lib/content/schema';
