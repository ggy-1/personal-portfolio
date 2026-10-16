'use client';

import { useId, type ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';
import { fromListText, toListText } from '../_lib/format';

/**
 * 后台表单控件。
 *
 * 为什么统一在这里定义：后台有 5 个表单、几十个字段。各写各的 <input> 必然出现
 * 「有的标了 label、有的没标」「有的字段有错误提示、有的只在提交时才弹一句话」。
 * 这里把三件事绑成一体，漏不掉：
 *   1. label 与控件的 htmlFor/id 关联（点标签能聚焦，读屏能念出字段名）；
 *   2. 错误提示与 hint 通过 aria-describedby 关联到控件，并给控件 aria-invalid；
 *   3. 字号固定 16px（text-base）—— 低于 16px 时 iOS 聚焦输入框会自动放大页面（TECH_DESIGN T9）。
 */

const CONTROL = cn(
  'w-full rounded-md border border-line bg-page/60 px-3 py-2 text-base leading-6 text-fg',
  'transition-colors duration-hover ease-out-quint placeholder:text-fg-muted',
  'focus:border-focus disabled:cursor-not-allowed disabled:opacity-60',
);

const CONTROL_INVALID = 'border-danger focus:border-danger';

type FieldChrome = {
  label: string;
  hint?: string;
  error?: string;
  className?: string;
};

/** 生成 label / hint / error 三者的 id 关联，输入类组件共用 */
function useFieldA11y({ hint, error }: Pick<FieldChrome, 'hint' | 'error'>) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return {
    id,
    hintId,
    errorId,
    describedBy: [hintId, errorId].filter(Boolean).join(' ') || undefined,
    invalid: error ? true : undefined,
  };
}

function FieldMessages({
  hint,
  error,
  hintId,
  errorId,
}: {
  hint?: string;
  error?: string;
  hintId?: string;
  errorId?: string;
}) {
  return (
    <>
      {hint ? (
        <p id={hintId} className="text-xs leading-5 text-fg-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-xs leading-5 text-danger">
          {error}
        </p>
      ) : null}
    </>
  );
}

/* ==================== 单行文本 ==================== */

type TextInputProps = FieldChrome & {
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'url' | 'date' | 'password';
  placeholder?: string;
  autoComplete?: string;
  disabled?: boolean;
};

export function TextInput({
  label,
  hint,
  error,
  className,
  value,
  onChange,
  type = 'text',
  placeholder,
  autoComplete,
  disabled,
}: TextInputProps) {
  const a11y = useFieldA11y({ hint, error });

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={a11y.id} className="text-sm font-medium text-fg-secondary">
        {label}
      </label>
      <input
        id={a11y.id}
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        aria-invalid={a11y.invalid}
        aria-describedby={a11y.describedBy}
        onChange={(event) => onChange(event.target.value)}
        className={cn(CONTROL, error && CONTROL_INVALID)}
      />
      <FieldMessages hint={hint} error={error} hintId={a11y.hintId} errorId={a11y.errorId} />
    </div>
  );
}

/* ==================== 多行文本 ==================== */

type TextAreaProps = FieldChrome & {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
};

export function TextArea({
  label,
  hint,
  error,
  className,
  value,
  onChange,
  rows = 4,
  placeholder,
}: TextAreaProps) {
  const a11y = useFieldA11y({ hint, error });

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={a11y.id} className="text-sm font-medium text-fg-secondary">
        {label}
      </label>
      <textarea
        id={a11y.id}
        rows={rows}
        value={value}
        placeholder={placeholder}
        aria-invalid={a11y.invalid}
        aria-describedby={a11y.describedBy}
        onChange={(event) => onChange(event.target.value)}
        className={cn(CONTROL, 'resize-y leading-7', error && CONTROL_INVALID)}
      />
      <FieldMessages hint={hint} error={error} hintId={a11y.hintId} errorId={a11y.errorId} />
    </div>
  );
}

/* ==================== 列表（一行一条） ==================== */

type ListInputProps = FieldChrome & {
  value: readonly string[];
  onChange: (value: string[]) => void;
  rows?: number;
  placeholder?: string;
};

/**
 * 字符串列表的输入方式：一行一条。
 *
 * 为什么不用「逗号分隔」或标签输入器：成果数据这类字段本身可能带逗号，
 * 分隔符一旦与内容冲突就无法还原。一行一条没有歧义，且与 textarea 天然双向对应。
 * 归一化（去空行、去空格）放在提交时做，见 _lib/format.ts 的说明。
 */
export function ListInput({ value, onChange, hint, ...rest }: ListInputProps) {
  return (
    <TextArea
      {...rest}
      hint={hint ?? '一行一条，留空的行会被忽略'}
      value={toListText(value)}
      onChange={(text) => onChange(fromListText(text))}
    />
  );
}

/* ==================== 数字 ==================== */

type NumberInputProps = FieldChrome & {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
};

/**
 * 数字输入。
 *
 * 刻意不做「本地字符串状态」：本地状态需要在外部值变化时同步，而同步只能写在 effect 里，
 * 那会触发 react-hooks/set-state-in-effect。代价是清空输入框会立刻回落到 min（默认 0），
 * 换来的是「不会出现输入框里显示 12、实际提交 0」这类对不上的情况。
 */
export function NumberInput({
  label,
  hint,
  error,
  className,
  value,
  onChange,
  min = 0,
  max,
}: NumberInputProps) {
  const a11y = useFieldA11y({ hint, error });

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={a11y.id} className="text-sm font-medium text-fg-secondary">
        {label}
      </label>
      <input
        id={a11y.id}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={String(value)}
        aria-invalid={a11y.invalid}
        aria-describedby={a11y.describedBy}
        onChange={(event) => {
          const parsed = Number.parseInt(event.target.value, 10);
          onChange(Number.isNaN(parsed) ? min : parsed);
        }}
        className={cn(CONTROL, error && CONTROL_INVALID)}
      />
      <FieldMessages hint={hint} error={error} hintId={a11y.hintId} errorId={a11y.errorId} />
    </div>
  );
}

/* ==================== 下拉选择 ==================== */

type SelectProps<T extends string> = FieldChrome & {
  value: T;
  onChange: (value: T) => void;
  /** 值是受约束的字符串联合（如 SkillLevel / 项目状态），不是任意 string */
  options: readonly { value: T; label: string }[];
  disabled?: boolean;
};

export function Select<T extends string>({
  label,
  hint,
  error,
  className,
  value,
  onChange,
  options,
  disabled,
}: SelectProps<T>) {
  const a11y = useFieldA11y({ hint, error });

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={a11y.id} className="text-sm font-medium text-fg-secondary">
        {label}
      </label>
      <select
        id={a11y.id}
        value={value}
        disabled={disabled}
        aria-invalid={a11y.invalid}
        aria-describedby={a11y.describedBy}
        // 窄化断言有依据：<option> 的 value 只来自 T 型的 options，浏览器回填的值必然落在 T 里，
        // 而 DOM 只会给出 string，TS 无从得知这层约束。
        onChange={(event) => onChange(event.target.value as T)}
        className={cn(CONTROL, error && CONTROL_INVALID)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <FieldMessages hint={hint} error={error} hintId={a11y.hintId} errorId={a11y.errorId} />
    </div>
  );
}

/* ==================== 勾选 ==================== */

export function CheckboxField({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  const id = useId();

  return (
    <div className="flex items-start gap-3">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        // accent-color 只能通过这个 CSS 属性设置；取值仍是设计 token，不是字面量颜色
        className="mt-1 size-4 shrink-0 rounded-sm [accent-color:var(--brand)]"
      />
      <div className="flex flex-col gap-0.5">
        <label htmlFor={id} className="text-sm font-medium text-fg">
          {label}
        </label>
        {description ? <p className="text-xs leading-5 text-fg-muted">{description}</p> : null}
      </div>
    </div>
  );
}

/* ==================== 分组 ==================== */

/**
 * 表单里的字段分组。
 *
 * 用 role="group" + aria-labelledby 而不是 fieldset/legend：legend 在
 * display:flex 的 fieldset 里不参与正常布局（浏览器会把它挪到边框上），
 * 要让字段与标题对齐就得额外 hacks。group 的角色语义与播报效果一致，布局行为正常。
 *
 * 需要跨满两列时传 className="md:col-span-2"。
 */
export function FieldGroup({
  legend,
  children,
  className,
}: {
  legend: string;
  children: ReactNode;
  className?: string;
}) {
  const id = useId();

  return (
    <div
      role="group"
      aria-labelledby={id}
      className={cn('flex flex-col gap-4 border-t border-line pt-5', className)}
    >
      <p id={id} className="text-sm font-semibold text-fg">
        {legend}
      </p>
      {children}
    </div>
  );
}
