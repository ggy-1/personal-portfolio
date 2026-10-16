import Link from 'next/link';
import { siteConfig } from '@/config/site';
import { getAllPosts } from '@/lib/content/loader';
import { currentYearInShanghai, formatDateCompact } from '@/lib/utils/date';
import { Icon, isIconName } from '@/components/ui/Icon';
import { Container } from './Container';

/**
 * 页脚（PRD F-002）
 *
 * 「最后更新」取自内容本身（最新一篇文章的 updated / date），而不是构建时间：
 * 构建时间每天都会变，读者无法从中判断内容是否还新鲜。
 */
export function Footer() {
  const posts = getAllPosts();
  const latest = posts[0];
  const lastUpdated = latest ? (latest.updated ?? latest.date) : null;

  return (
    <footer className="no-print relative z-[var(--z-content)] mt-24 border-t border-line">
      <Container className="py-12">
        <div className="grid gap-8 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <p className="text-sm font-semibold text-fg">{siteConfig.name}</p>
            <p className="mt-2 max-w-[42ch] text-sm text-fg-secondary">{siteConfig.role}</p>
            <p className="mt-4 text-xs text-fg-muted">
              {lastUpdated ? `内容最后更新于 ${formatDateCompact(lastUpdated)}` : '内容持续更新中'}
            </p>
          </div>

          <nav aria-label="页脚导航">
            <h2 className="text-sm font-semibold text-fg">站点</h2>
            <ul className="mt-3 space-y-2">
              {siteConfig.nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-fg-secondary transition-colors duration-hover ease-out-quint hover:text-fg"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="text-sm font-semibold text-fg">联系</h2>
            <ul className="mt-3 space-y-2">
              {siteConfig.socials.map((social) => (
                <li key={social.id}>
                  <a
                    href={social.href}
                    target={social.href.startsWith('http') ? '_blank' : undefined}
                    rel={social.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="inline-flex items-center gap-2 text-sm text-fg-secondary transition-colors duration-hover ease-out-quint hover:text-fg"
                  >
                    {isIconName(social.icon) ? <Icon name={social.icon} /> : null}
                    {social.handle ?? social.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="mt-10 border-t border-line pt-6 text-xs text-fg-muted">
          © {currentYearInShanghai()} {siteConfig.name} · 由 Next.js 构建
        </p>
      </Container>
    </footer>
  );
}
