import { Icon, type IconName } from '@/components/ui/Icon';

/**
 * 仪表盘上的计数卡片。
 *
 * 数字是主角，所以字号最大、颜色最亮；标签与补充说明退到次级色。
 * 这里不做「迷你图表」：三个计数用不上图表，加了只会让一眼能读完的信息变难读。
 */
export function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: number;
  hint?: string;
  icon: IconName;
}) {
  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <div className="flex items-center gap-2 text-fg-muted">
        <Icon name={icon} />
        <p className="text-sm">{label}</p>
      </div>

      <p className="mt-3 text-2xl font-semibold text-fg tabular-nums">{value}</p>

      {hint ? <p className="mt-1 text-xs leading-5 text-fg-muted">{hint}</p> : null}
    </div>
  );
}
