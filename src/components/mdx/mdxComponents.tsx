import Link from 'next/link';
import type { ComponentPropsWithoutRef } from 'react';
import type { MDXRemoteProps } from 'next-mdx-remote/rsc';
import { Callout } from './Callout';
import { Figure } from './Figure';

/**
 * MDX 组件白名单（TECH_DESIGN T4）
 *
 * 正文里能使用的标签只有这里登记的这些，不在表内的组件写进 MDX 也不会被渲染。
 * 这里是内容与代码之间的接口：新增一个可用组件，必须同时在这里注册。
 *
 * 普通排版元素（h2/p/ul/code…）不在这里映射，统一由 globals.css 的 .mdx 规则负责，
 * 避免「样式一半在组件里、一半在 CSS 里」的双头维护。
 */

type MdxComponentMap = NonNullable<MDXRemoteProps['components']>;

type AnchorProps = ComponentPropsWithoutRef<'a'>;

/**
 * 链接策略：站内链接走 Next 的客户端路由，外链自动补 target 与 rel。
 * rel="noopener noreferrer" 是必需的：否则被打开的页面可以通过 window.opener 反向操作本站。
 */
function MdxAnchor({ href, children, ...rest }: AnchorProps) {
  if (typeof href === 'string' && href.startsWith('/')) {
    return (
      <Link href={href} {...rest}>
        {children}
      </Link>
    );
  }

  if (typeof href === 'string' && /^[a-z][a-z\d+.-]*:\/\//i.test(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>
        {children}
      </a>
    );
  }

  return (
    <a href={href} {...rest}>
      {children}
    </a>
  );
}

export const mdxComponents: MdxComponentMap = {
  a: MdxAnchor,
  Callout,
  Figure,
};
