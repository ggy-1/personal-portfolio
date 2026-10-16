'use client';

import { useId, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';

/**
 * 对象数组的编辑器（社交链接、导航项）。
 *
 * 为什么不做成「可拖拽排序」：社交链接与导航项最多五六条，顺序靠上移/下移或直接改数组
 * 都能解决；拖拽要么引库（违反依赖预算），要么手写指针事件 + 键盘可达的替代操作，
 * 成本远高于收益。这里只提供「增、改、删」。
 *
 * 用 index 作为 key：列表不涉及重排，删除后重建 DOM 的代价可以忽略；
 * 所有输入都是受控的，值不会串行。
 */
type ListEditorProps<T extends object> = {
  legend: string;
  hint?: string;
  items: readonly T[];
  onChange: (next: T[]) => void;
  createItem: () => T;
  /** 每项的小标题，让用户知道自己在改哪一条 */
  itemTitle: (item: T, index: number) => string;
  /** 渲染单项字段；patch 会与该项合并。index 用于把字段级错误对应回具体一条 */
  renderItem: (item: T, patch: (next: Partial<T>) => void, index: number) => ReactNode;
  addLabel: string;
  /** 最少保留几项（例如导航至少 1 项），达到下限后删除按钮禁用 */
  minItems?: number;
};

export function ListEditor<T extends object>({
  legend,
  hint,
  items,
  onChange,
  createItem,
  itemTitle,
  renderItem,
  addLabel,
  minItems = 0,
}: ListEditorProps<T>) {
  const legendId = useId();
  const canRemove = items.length > minItems;

  function replace(index: number, patch: Partial<T>) {
    onChange(items.map((item, current) => (current === index ? { ...item, ...patch } : item)));
  }

  function remove(index: number) {
    onChange(items.filter((_, current) => current !== index));
  }

  return (
    <div role="group" aria-labelledby={legendId} className="flex flex-col gap-3">
      <div>
        <p id={legendId} className="text-sm font-semibold text-fg">
          {legend}
        </p>
        {hint ? <p className="mt-1 text-xs leading-5 text-fg-muted">{hint}</p> : null}
      </div>

      <ul className="flex flex-col gap-3">
        {items.map((item, index) => (
          <li key={index} className="rounded-lg border border-line bg-subtle/40 p-3 md:p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="min-w-0 truncate text-xs font-medium text-fg-muted">
                {itemTitle(item, index)}
              </p>
              <Button
                variant="ghost"
                icon="trash"
                disabled={!canRemove}
                onClick={() => remove(index)}
                aria-label={`删除第 ${index + 1} 项`}
              >
                删除
              </Button>
            </div>
            <div className="flex flex-col gap-3">
              {renderItem(item, (patch) => replace(index, patch), index)}
            </div>
          </li>
        ))}
      </ul>

      <div>
        <Button variant="secondary" icon="plus" onClick={() => onChange([...items, createItem()])}>
          {addLabel}
        </Button>
      </div>
    </div>
  );
}
