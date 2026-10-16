import Link from 'next/link';
import { siteConfig } from '@/config/site';
import { Icon, isIconName } from '@/components/ui/Icon';
import { Container } from './Container';
import { NavLink } from './NavLink';

/**
 * 顶部导航（PRD F-001）
 *
 * 桌面端：姓名 + 四项导航 + 社交入口，滚动时保持固定并使用毛玻璃底。
 * 移动端：只保留姓名，导航交给底部 TabBar（见 TabBar.tsx），
 *        因此这里不需要抽屉与焦点管理，也就避免了一个额外的客户端组件。
 * 毛玻璃只用在导航、抽屉、正文遮罩三处（低端机上 backdrop-filter 很贵，见 TECH_DESIGN T9）。
 */
export function NavBar() {
  return (
    <header className="no-print sticky top-0 z-[var(--z-nav)] border-b border-line bg-page/85 backdrop-blur-md">
      <Container className="flex h-[var(--header-h)] items-center justify-between gap-4">
        <Link
          href="/"
          className="rounded-md text-sm font-semibold tracking-tight text-fg transition-colors duration-hover ease-out-quint hover:text-accent"
        >
          {siteConfig.name}
        </Link>

        <nav aria-label="主导航" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {siteConfig.nav.map((item) => (
              <li key={item.href}>
                <NavLink href={item.href} label={item.label} />
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden items-center gap-1 md:flex">
          {siteConfig.socials.map((social) => (
            <a
              key={social.id}
              href={social.href}
              target={social.href.startsWith('http') ? '_blank' : undefined}
              rel={social.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="inline-flex size-11 items-center justify-center rounded-md text-fg-muted transition-colors duration-hover ease-out-quint hover:text-fg"
            >
              {isIconName(social.icon) ? <Icon name={social.icon} label={social.label} /> : null}
            </a>
          ))}
        </div>
      </Container>
    </header>
  );
}
