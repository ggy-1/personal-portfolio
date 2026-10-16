import type { SkillLevel } from '@/lib/content/schema';
import { cn } from '@/lib/utils/cn';

/**
 * 技能熟练度标签（PRD F-041）
 *
 * 用「熟练 / 熟悉 / 了解」三档文字，而不是百分比进度条：
 * 百分比无法自证，也容易被面试官追问「85% 是什么标准」。
 * 三档之外还配了边框深浅，避免只靠颜色传达信息。
 */

const LEVELS: Record<SkillLevel, { label: string; className: string }> = {
  proficient: { label: '熟练', className: 'border-accent/50 text-accent' },
  familiar: { label: '熟悉', className: 'border-line-strong text-fg-secondary' },
  learning: { label: '了解', className: 'border-line text-fg-muted' },
};

export function SkillLevelLabel({ level }: { level: SkillLevel }) {
  const config = LEVELS[level];

  return (
    <span
      className={cn('shrink-0 rounded-full border px-2 py-0.5 text-xs leading-5', config.className)}
    >
      {config.label}
    </span>
  );
}
