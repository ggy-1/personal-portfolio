'use client';

import { useState } from 'react';
import { api, type Profile } from '@/api';
import type { SocialLink } from '@/lib/content/schema';
import { FieldGroup, ListInput, Select, TextArea, TextInput } from '@/app/admin/_components/Field';
import { FormPanel } from '@/app/admin/_components/FormPanel';
import { ListEditor } from '@/app/admin/_components/ListEditor';
import { useSubmit } from '@/app/admin/_hooks/useSubmit';
import { hasErrors, isLinkTarget, type FieldErrors } from '@/app/admin/_lib/validation';

/**
 * 个人信息表单。
 *
 * 校验规则对齐 PRD：自述 200–400 字（F-030）、现状必填（F-035）。
 *
 * 为什么这里不引 Zod：schema.ts 里的 Profile 是普通 TS 类型（它是 site.ts 配置的形状，
 * 不是内容 frontmatter），为它单独造一份 schema 只会多出一处需要与配置同步的规则。
 * 因此按 validation.ts 的说明，这类「没有 schema 的实体」直接在表单里写必填判断。
 */

const BIO_MIN = 200;
const BIO_MAX = 400;

/**
 * 可选的图标集合。
 *
 * 刻意只列出 src/components/ui/Icon.tsx 里**已登记**的名字：前台渲染社交链接时用的是
 * `isIconName()` 守卫，选了未登记的图标不会报错，只会静默地不显示图标 —— 那是最难排查的一类问题。
 * 要新增可选图标，先在图标表里登记，再回到这里补一行。
 */
const SOCIAL_ICON_OPTIONS: readonly { value: SocialLink['icon']; label: string }[] = [
  { value: 'github', label: 'GitHub' },
  { value: 'mail', label: '邮箱' },
  { value: 'rss', label: 'RSS' },
  { value: 'link', label: '通用链接' },
];

type FormState = {
  name: string;
  role: string;
  location: string;
  bio: string;
  email: string;
  avatar: string;
  keywords: string[];
  socials: SocialLink[];
};

function toFormState(profile: Profile): FormState {
  return {
    name: profile.name,
    role: profile.role,
    location: profile.location,
    bio: profile.bio,
    email: profile.email,
    avatar: profile.avatar,
    keywords: [...profile.keywords],
    // 深拷贝：表单里会就地改社交链接对象，不能改到接口层缓存的那份数据
    socials: structuredClone(profile.socials),
  };
}

/** 归一化：去掉「一行一条」输入里的空行与首尾空格 —— 只能在提交时做，否则用户敲不进第二个关键词 */
function normalizeKeywords(values: readonly string[]): string[] {
  return values.map((value) => value.trim()).filter((value) => value.length > 0);
}

function validate(form: FormState): FieldErrors {
  const errors: FieldErrors = {};

  if (form.name.trim().length === 0) errors.name = '姓名不能为空';
  if (form.role.trim().length === 0) errors.role = '一句话定位不能为空';
  if (form.location.trim().length === 0) errors.location = '现状不能为空（PRD F-035）';

  const bioLength = form.bio.trim().length;
  if (bioLength === 0) {
    errors.bio = '自述不能为空';
  } else if (bioLength < BIO_MIN || bioLength > BIO_MAX) {
    errors.bio = `自述需要 ${BIO_MIN}–${BIO_MAX} 字，当前 ${bioLength} 字`;
  }

  if (!form.email.trim().includes('@')) errors.email = '邮箱格式不正确';

  if (normalizeKeywords(form.keywords).length === 0) errors.keywords = '至少填 1 个首屏关键词';

  if (form.socials.length === 0) errors.socials = '至少保留 1 条社交链接';
  form.socials.forEach((social, index) => {
    if (social.label.trim().length === 0) errors[`social.${index}.label`] = '展示名不能为空';
    if (social.href.trim().length === 0) {
      errors[`social.${index}.href`] = '地址不能为空';
    } else if (!isLinkTarget(social.href.trim())) {
      errors[`social.${index}.href`] = '需要是完整地址（https://）或 mailto: 或站内路径（/rss.xml）';
    }
  });

  return errors;
}

export function ProfileForm({ initial }: { initial: Profile }) {
  const [form, setForm] = useState<FormState>(() => toFormState(initial));
  const [errors, setErrors] = useState<FieldErrors>({});
  const { saving, feedback, submit } = useSubmit();

  function patch(next: Partial<FormState>) {
    setForm((current) => ({ ...current, ...next }));
  }

  function handleSubmit() {
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;

    const next: Profile = {
      name: form.name.trim(),
      role: form.role.trim(),
      location: form.location.trim(),
      bio: form.bio.trim(),
      email: form.email.trim(),
      avatar: form.avatar.trim(),
      keywords: normalizeKeywords(form.keywords),
      socials: form.socials.map((social) => ({
        ...social,
        label: social.label.trim(),
        href: social.href.trim(),
        handle: social.handle?.trim() || undefined,
      })),
    };

    void submit(async () => {
      // 保存成功后把表单重置为「已归一化」的值：用户不该在保存后又看到自己多敲的空格
      const saved = await api.profile.save(next);
      setForm(toFormState(saved));
      setErrors({});
    }, '个人信息已保存。');
  }

  const bioLength = form.bio.trim().length;

  return (
    <FormPanel
      title="个人信息"
      description="对应前台的 Hero、关于页与页脚。"
      submitLabel="保存个人信息"
      saving={saving}
      feedback={feedback}
      onSubmit={handleSubmit}
    >
      <FieldGroup legend="基本信息" className="border-t-0 pt-0">
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="姓名"
            value={form.name}
            error={errors.name}
            hint="出现在 Hero、导航与页脚"
            onChange={(value) => patch({ name: value })}
          />
          <TextInput
            label="一句话定位"
            value={form.role}
            error={errors.role}
            hint="例如「前端开发 / 全栈爱好者」"
            onChange={(value) => patch({ role: value })}
          />
        </div>

        <TextArea
          label="现状"
          rows={2}
          value={form.location}
          error={errors.location}
          hint="一句「目前在做 / 寻找什么机会」（PRD F-035）"
          onChange={(value) => patch({ location: value })}
        />

        <TextArea
          label="个人自述"
          rows={8}
          value={form.bio}
          error={errors.bio}
          hint={`${BIO_MIN}–${BIO_MAX} 字，当前 ${bioLength} 字`}
          onChange={(value) => patch({ bio: value })}
        />
      </FieldGroup>

      <FieldGroup legend="联系方式">
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="邮箱"
            type="email"
            value={form.email}
            error={errors.email}
            autoComplete="email"
            onChange={(value) => patch({ email: value })}
          />
          <TextInput
            label="头像路径"
            value={form.avatar}
            error={errors.avatar}
            hint="public/ 下的相对路径，例如 /images/avatar.svg"
            onChange={(value) => patch({ avatar: value })}
          />
        </div>
      </FieldGroup>

      <FieldGroup legend="首屏关键词">
        <ListInput
          label="关键词"
          rows={3}
          value={form.keywords}
          error={errors.keywords}
          hint="Hero 下方展示的核心技能，一行一个（建议 3 个）"
          onChange={(value) => patch({ keywords: value })}
        />
      </FieldGroup>

      <FieldGroup legend="社交链接">
        {errors.socials ? <p className="text-xs leading-5 text-danger">{errors.socials}</p> : null}

        <ListEditor
          legend="链接列表"
          hint="顺序即前台页脚与关于页的展示顺序。至少保留 1 条。"
          items={form.socials}
          minItems={1}
          onChange={(socials) => patch({ socials })}
          addLabel="添加链接"
          createItem={(): SocialLink => ({
            id: `social-${Date.now().toString(36)}`,
            label: '',
            href: '',
            icon: 'link',
          })}
          itemTitle={(item, index) => item.label.trim() || `第 ${index + 1} 条链接`}
          renderItem={(item, update, index) => (
            <>
              <div className="grid gap-3 md:grid-cols-2">
                <TextInput
                  label="展示名"
                  value={item.label}
                  error={errors[`social.${index}.label`]}
                  onChange={(value) => update({ label: value })}
                />
                <TextInput
                  label="地址"
                  value={item.href}
                  error={errors[`social.${index}.href`]}
                  onChange={(value) => update({ href: value })}
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <Select
                  label="图标"
                  value={item.icon}
                  options={SOCIAL_ICON_OPTIONS}
                  hint="只列出已在图标表登记的图标"
                  onChange={(value) => update({ icon: value })}
                />
                <TextInput
                  label="账号名"
                  value={item.handle ?? ''}
                  hint="可选，例如 @your-name"
                  onChange={(value) => update({ handle: value })}
                />
              </div>
            </>
          )}
        />
      </FieldGroup>
    </FormPanel>
  );
}
