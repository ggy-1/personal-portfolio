import type { SkillCategory } from '@/lib/content/schema';

/**
 * 技能数据 —— 三档熟练度，不使用百分比进度条（PRD F-041）。
 *
 * TODO(待你替换)：以下为占位数据。
 * relatedProjects 中的值必须是真实存在的项目 slug，校验脚本会拦截不存在的引用。
 */
export const skillCategories: SkillCategory[] = [
  {
    id: 'frontend',
    label: '前端',
    icon: 'code',
    skills: [
      {
        name: 'React',
        level: 'proficient',
        relatedProjects: ['starfolio'],
        note: '用 Server Components 与流式渲染重做过内容型页面',
      },
      { name: 'TypeScript', level: 'proficient', note: '严格模式 + 运行时 schema 校验' },
      { name: 'CSS / Tailwind', level: 'proficient', note: '设计 token 化的深色主题与响应式布局' },
      { name: 'Next.js', level: 'familiar', note: 'App Router、静态生成与增量再生成' },
    ],
  },
  {
    id: 'backend',
    label: '后端',
    icon: 'server',
    skills: [
      { name: 'Node.js', level: 'familiar', note: '构建脚本与命令行工具' },
      { name: 'PostgreSQL', level: 'learning', note: '关系建模、索引与事务' },
    ],
  },
  {
    id: 'tooling',
    label: '工具链',
    icon: 'wrench',
    skills: [
      { name: 'Git', level: 'proficient', note: '分支策略、PR review 与冲突处理' },
      { name: 'Vite / 构建工具', level: 'familiar', note: '打包体积分析与按需加载' },
      { name: '测试（Vitest / Playwright）', level: 'familiar' },
    ],
  },
  {
    id: 'design',
    label: '设计',
    icon: 'palette',
    skills: [
      { name: 'Figma', level: 'familiar', note: '从设计稿落地到组件规范' },
      { name: '可访问性（a11y）', level: 'learning', note: '对比度、焦点管理与键盘操作' },
    ],
  },
];
