import { siteConfig } from '@/config/site';
import { Icon, isIconName } from '@/components/ui/Icon';
import { NavLink } from './NavLink';

/**
 * 移动端底部导航（PRD 5.7）
 *
 * 选它而不是汉堡抽屉的原因：
 *  - 四项导航正好放得下，点击一次即可到达，不需要先展开；
 *  - 底部区域更靠近拇指，触摸目标更容易做够 44px；
 *  - 省掉抽屉的焦点锁定 / Esc 关闭 / 焦点归位三件套，少一个客户端组件。
 * 底部留出 env(safe-area-inset-bottom)，避免被 iPhone 的 Home 指示条压住。
 */
export function TabBar() {
  return (
    <nav
      aria-label="移动端主导航"
      className="no-print fixed inset-x-0 bottom-0 z-[var(--z-nav)] border-t border-line bg-page/95 backdrop-blur-md md:hidden"
    >
      <ul className="flex items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {siteConfig.nav.map((item) => {
          const iconName = item.icon && isIconName(item.icon) ? item.icon : undefined;

          return (
            <li key={item.href} className="flex-1">
              <NavLink
                href={item.href}
                label={item.label}
                variant="tab"
                icon={iconName ? <Icon name={iconName} size={18} /> : undefined}
              />
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
