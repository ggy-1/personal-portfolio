import {
  ArrowRight,
  ArrowUp,
  BookOpen,
  Calendar,
  Check,
  Clock,
  Code,
  Copy,
  Download,
  ExternalLink,
  FolderGit2,
  Home,
  Info,
  LayoutDashboard,
  Link as LinkIcon,
  Lock,
  LogOut,
  Mail,
  Palette,
  Pencil,
  Plus,
  RotateCcw,
  Rss,
  Save,
  Search,
  Server,
  Settings,
  Tag as TagIcon,
  Trash,
  TriangleAlert,
  User,
  Wrench,
  X,
} from 'lucide-react';
import type { ReactNode } from 'react';

/**
 * 图标表 —— 站点里出现的所有图标都在这里登记。
 *
 * 为什么不让配置文件直接引用图标组件：src/config 必须保持「数据」性质，
 * 一旦 import React 组件，配置就变成了代码，也破坏了 config 不依赖 UI 的边界。
 * 因此配置里存图标名，由这里统一映射成组件。
 *
 * 为什么把类型从 LucideIcon 放宽成 IconGlyph：lucide-react v1 起移除了品牌图标
 * （GitHub、X 等），这些只能自绘。若把表限定为 LucideIcon，自绘图标就无法登记，
 * 只能退化成 `as unknown as` 之类的强制转换。这里改为统一收敛到「接受同一组 SVG 属性」
 * 的调用签名，让 lucide 图标与自绘图标在同一张表里平级共存。
 */

type IconGlyphProps = {
  size?: number | string;
  className?: string;
  'aria-hidden'?: boolean;
  'aria-label'?: string;
  role?: 'img';
};

type IconGlyph = (props: IconGlyphProps) => ReactNode;

/** GitHub 标记：lucide 不再提供品牌图标，按 Simple Icons 的 24×24 路径自绘 */
function GithubMark({ size = 16, className, ...rest }: IconGlyphProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      className={className}
      {...rest}
    >
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

const ICONS = {
  // 社交与通用
  github: GithubMark,
  mail: Mail,
  rss: Rss,
  link: LinkIcon,
  // 导航
  home: Home,
  projects: FolderGit2,
  blog: BookOpen,
  about: User,
  // 技能分类
  code: Code,
  server: Server,
  wrench: Wrench,
  palette: Palette,
  // 内容元信息与操作
  tag: TagIcon,
  clock: Clock,
  calendar: Calendar,
  external: ExternalLink,
  download: Download,
  copy: Copy,
  check: Check,
  arrowRight: ArrowRight,
  arrowUp: ArrowUp,
  info: Info,
  warning: TriangleAlert,
  // 后台（/admin）
  dashboard: LayoutDashboard,
  settings: Settings,
  logout: LogOut,
  plus: Plus,
  trash: Trash,
  edit: Pencil,
  save: Save,
  close: X,
  search: Search,
  reset: RotateCcw,
  lock: Lock,
} satisfies Record<string, IconGlyph>;

export type IconName = keyof typeof ICONS;

export function isIconName(value: string): value is IconName {
  return value in ICONS;
}

type IconProps = {
  name: IconName;
  /** 装饰性图标默认对辅助技术隐藏；有语义时传 label */
  label?: string;
  className?: string;
  size?: number;
};

export function Icon({ name, label, className, size = 16 }: IconProps) {
  const Glyph = ICONS[name];
  const isDecorative = label === undefined;

  return (
    <Glyph
      size={size}
      className={className}
      aria-hidden={isDecorative || undefined}
      aria-label={label}
      role={isDecorative ? undefined : 'img'}
    />
  );
}
