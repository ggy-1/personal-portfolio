import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';
import { Icon, type IconName } from './Icon';

/**
 * 按钮（PRD 5.8）
 *
 * 统一约束：
 *  - 最小高度 44px，满足触摸目标要求（AGENTS.md 第 8 节）；
 *  - 只有四种变体，避免全站出现随手写的按钮样式；
 *  - 传了 href 渲染为链接，外链自动补 target / rel，防止 window.opener 劫持。
 *
 * v1.5 起支持 onClick / disabled / danger：后台有大量「保存、删除、退出登录」这类
 * 纯行为按钮，若不给这些能力，后台只能各自写一套 <button>，四种变体的约束就形同虚设。
 */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'md' | 'lg';

type CommonProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** 图标名来自 Icon 的登记表，组件内不直接引 lucide */
  icon?: IconName;
  iconPosition?: 'start' | 'end';
  className?: string;
};

type LinkProps = CommonProps & { href: string };
type NativeButtonProps = CommonProps & {
  href?: undefined;
  type?: 'button' | 'submit';
  onClick?: () => void;
  disabled?: boolean;
  /** 无文字或文字不足以说明用途时的无障碍名称 */
  'aria-label'?: string;
};

export type ButtonProps = LinkProps | NativeButtonProps;

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors duration-hover ease-out-quint disabled:cursor-not-allowed disabled:opacity-50';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-space-900 hover:bg-accent-2',
  secondary:
    'border border-line bg-surface text-fg hover:border-line-strong hover:bg-surface-hover',
  ghost: 'text-fg-secondary hover:bg-surface hover:text-fg',
  danger: 'border border-danger/50 bg-danger/10 text-danger hover:bg-danger/20',
};

const SIZES: Record<ButtonSize, string> = {
  md: 'min-h-11 px-4 text-sm',
  lg: 'min-h-12 px-5 text-base',
};

const EXTERNAL_PATTERN = /^(https?:|mailto:|tel:)/;
/** public/ 下的静态文件（简历 PDF、压缩包等）必须走原生 <a>，否则会被当成路由跳转 */
const DOWNLOADABLE_PATTERN = /\.(pdf|zip|png|jpe?g|webp|svg|txt|md)$/i;

export function Button(props: ButtonProps) {
  const {
    children,
    variant = 'secondary',
    size = 'md',
    icon,
    iconPosition = 'end',
    className,
  } = props;

  const classes = cn(BASE, VARIANTS[variant], SIZES[size], className);

  const content = (
    <>
      {icon && iconPosition === 'start' ? <Icon name={icon} /> : null}
      <span>{children}</span>
      {icon && iconPosition === 'end' ? <Icon name={icon} /> : null}
    </>
  );

  if (props.href !== undefined) {
    // 外链与文件下载都用原生 <a>：前者要 target/rel，后者不能走客户端路由
    if (EXTERNAL_PATTERN.test(props.href) || DOWNLOADABLE_PATTERN.test(props.href)) {
      return (
        <a href={props.href} className={classes} target="_blank" rel="noopener noreferrer">
          {content}
        </a>
      );
    }
    return (
      <Link href={props.href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type={props.type ?? 'button'}
      onClick={props.onClick}
      disabled={props.disabled}
      aria-label={props['aria-label']}
      className={classes}
    >
      {content}
    </button>
  );
}
