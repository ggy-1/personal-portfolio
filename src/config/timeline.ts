import type { TimelineItem } from '@/lib/content/schema';

/**
 * 经历时间线（PRD F-031）—— 按时间倒序，进行中的放最前并标记 status: 'ongoing'。
 *
 * TODO(待你替换)：以下为占位数据。
 */
export const timeline: TimelineItem[] = [
  {
    id: 'present',
    period: '2025.09 – 至今',
    title: '前端开发（实习）',
    org: '公司 / 团队名称',
    description:
      '负责中后台系统的前端开发与迭代，参与组件库建设，把首屏加载时间从 3.2s 优化到 1.1s。',
    tags: ['React', 'TypeScript', '性能优化'],
    status: 'ongoing',
  },
  {
    id: 'campus',
    period: '2023.09 – 2027.06',
    title: '计算机科学与技术 · 本科',
    org: '学校名称',
    description: '主修方向为软件工程与 Web 开发，参与过校级技术社团的前端项目。',
    tags: ['数据结构', '计算机网络'],
    status: 'ongoing',
  },
];
