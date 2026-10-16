import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

/**
 * 区块外壳：统一全站的纵向节奏（PRD 5.5：桌面 96–120px、移动 56–64px）。
 *
 * 放在 layout/ 而不是 ui/：它承担的是页面骨架的职责，与 Container / SectionHeader 同类；
 * ui/ 存放的是 Button、Tag 这类不含页面结构的原子组件。
 */
export function Section({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn('py-14 md:py-20 lg:py-24', className)}>
      {children}
    </section>
  );
}
