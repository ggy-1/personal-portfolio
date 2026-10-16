'use client';

import { useState } from 'react';
import { api, type SiteSettings } from '@/api';
import type { NavItem } from '@/lib/content/schema';
import {
  FieldGroup,
  NumberInput,
  Select,
  TextArea,
  TextInput,
} from '@/app/admin/_components/Field';
import { ListEditor } from '@/app/admin/_components/ListEditor';
import { FormPanel } from '@/app/admin/_components/FormPanel';
import { useSubmit } from '@/app/admin/_hooks/useSubmit';
import { hasErrors, isFullUrl, isLinkTarget, type FieldErrors } from '@/app/admin/_lib/validation';

/**
 * 站点设置表单。
 *
 * 这里的两类字段有本质区别，界面上必须说清楚：
 *  - siteUrl / description / ogImage 是**构建期常量**（来自 NEXT_PUBLIC_SITE_URL 与 site.ts），
 *    后台无论怎么改都不会影响前台的 canonical / OG / sitemap；
 *  - nav / postsPerPage / resumeUrl 是运行前台的展示配置。
 * 之所以还让前一类可编辑，是为了让这份表单完整覆盖站点级设置，将来接真实后端时
 * 它们会变成真正生效的服务端配置。
 */

/** 导航图标白名单：只列 src/components/ui/Icon.tsx 已登记、且适合作为导航的图标 */
const NAV_ICON_OPTIONS: readonly { value: string; label: string }[] = [
  { value: '', label: '不指定' },
  { value: 'home', label: '首页' },
  { value: 'projects', label: '项目' },
  { value: 'blog', label: '博客' },
  { value: 'about', label: '关于' },
  { value: 'search', label: '搜索' },
  { value: 'link', label: '通用' },
];

const DESCRIPTION_MAX = 160;

type FormState = {
  siteUrl: string;
  description: string;
  ogImage: string;
  resumeUrl: string;
  postsPerPage: number;
  nav: NavItem[];
};

function toFormState(settings: SiteSettings): FormState {
  return {
    siteUrl: settings.siteUrl,
    description: settings.description,
    ogImage: settings.ogImage,
    resumeUrl: settings.resumeUrl,
    postsPerPage: settings.postsPerPage,
    // 深拷贝：表单会就地改导航项对象
    nav: structuredClone(settings.nav),
  };
}

/** public/ 下的资源路径：必须以 / 开头（相对路径会让 next/image 与链接解析到当前路由下） */
function isPublicPath(value: string): boolean {
  return value.startsWith('/') && !value.startsWith('//');
}

function validate(form: FormState): FieldErrors {
  const errors: FieldErrors = {};

  if (!isFullUrl(form.siteUrl.trim())) {
    errors.siteUrl = '需要完整的站点地址（含 https://，例如 https://example.com）';
  }

  const description = form.description.trim();
  if (description.length === 0) {
    errors.description = '站点描述不能为空';
  } else if (description.length > DESCRIPTION_MAX) {
    errors.description = `站点描述不超过 ${DESCRIPTION_MAX} 字，当前 ${description.length} 字`;
  }

  const ogImage = form.ogImage.trim();
  if (ogImage.length === 0) {
    errors.ogImage = 'OG 分享图不能为空';
  } else if (!isPublicPath(ogImage)) {
    errors.ogImage = '需要 public/ 下的绝对路径，例如 /images/og-default.svg';
  }

  const resumeUrl = form.resumeUrl.trim();
  if (resumeUrl.length === 0) {
    errors.resumeUrl = '简历地址不能为空';
  } else if (!isLinkTarget(resumeUrl)) {
    errors.resumeUrl = '需要是站内路径（/resume.pdf）或完整地址（https://）';
  }

  if (form.postsPerPage < 1 || form.postsPerPage > 50) {
    errors.postsPerPage = '每页条数需在 1–50 之间（PRD F-068 建议 10）';
  }

  if (form.nav.length === 0) errors.nav = '至少保留 1 个导航项';
  form.nav.forEach((item, index) => {
    if (item.label.trim().length === 0) errors[`nav.${index}.label`] = '导航名称不能为空';
    if (!item.href.trim().startsWith('/')) {
      errors[`nav.${index}.href`] = '站内导航需要以 / 开头，例如 /projects';
    }
  });

  return errors;
}

export function SettingsForm({ initial }: { initial: SiteSettings }) {
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

    const next: SiteSettings = {
      siteUrl: form.siteUrl.trim(),
      description: form.description.trim(),
      ogImage: form.ogImage.trim(),
      resumeUrl: form.resumeUrl.trim(),
      postsPerPage: form.postsPerPage,
      nav: form.nav.map((item) => ({
        href: item.href.trim(),
        label: item.label.trim(),
        icon: item.icon && item.icon.length > 0 ? item.icon : undefined,
      })),
    };

    void submit(async () => {
      const saved = await api.settings.save(next);
      setForm(toFormState(saved));
      setErrors({});
    }, '站点设置已保存。');
  }

  return (
    <FormPanel
      title="站点设置"
      description="站点地址、SEO 描述、简历入口、分页与导航结构。"
      submitLabel="保存设置"
      saving={saving}
      feedback={feedback}
      onSubmit={handleSubmit}
    >
      <FieldGroup legend="站点信息" className="border-t-0 pt-0">
        <TextInput
          label="站点地址"
          type="url"
          value={form.siteUrl}
          error={errors.siteUrl}
          hint="用于 canonical / sitemap / RSS / OG。真实构建期取值来自环境变量 NEXT_PUBLIC_SITE_URL"
          onChange={(value) => patch({ siteUrl: value })}
        />

        <TextArea
          label="站点描述"
          rows={3}
          value={form.description}
          error={errors.description}
          hint={`不超过 ${DESCRIPTION_MAX} 字，用于 SEO 与社交分享摘要`}
          onChange={(value) => patch({ description: value })}
        />

        <TextInput
          label="OG 分享图"
          value={form.ogImage}
          error={errors.ogImage}
          hint="public/ 下的路径，建议 1200×630，例如 /images/og-default.svg"
          onChange={(value) => patch({ ogImage: value })}
        />
      </FieldGroup>

      <FieldGroup legend="站点功能">
        <TextInput
          label="简历地址"
          value={form.resumeUrl}
          error={errors.resumeUrl}
          hint="放 public/ 下（如 /resume.pdf），或填外部完整地址"
          onChange={(value) => patch({ resumeUrl: value })}
        />

        <NumberInput
          label="博客每页条数"
          value={form.postsPerPage}
          error={errors.postsPerPage}
          min={1}
          max={50}
          hint="PRD F-068 建议 10 篇"
          onChange={(value) => patch({ postsPerPage: value })}
        />
      </FieldGroup>

      <FieldGroup legend="导航结构">
        {errors.nav ? <p className="text-xs leading-5 text-danger">{errors.nav}</p> : null}

        <ListEditor
          legend="导航项"
          hint="顺序即前台顶部导航与移动端 Tab Bar 的顺序（PRD F-002 / F-003）。至少保留 1 项。"
          items={form.nav}
          minItems={1}
          onChange={(nav) => patch({ nav })}
          addLabel="添加导航项"
          createItem={(): NavItem => ({ href: '/', label: '', icon: undefined })}
          itemTitle={(item, index) => item.label.trim() || `第 ${index + 1} 项`}
          renderItem={(item, update, index) => (
            <>
              <div className="grid gap-3 md:grid-cols-2">
                <TextInput
                  label="名称"
                  value={item.label}
                  error={errors[`nav.${index}.label`]}
                  onChange={(value) => update({ label: value })}
                />
                <TextInput
                  label="路径"
                  value={item.href}
                  error={errors[`nav.${index}.href`]}
                  hint="以 / 开头，例如 /projects"
                  onChange={(value) => update({ href: value })}
                />
              </div>

              <Select
                label="移动端图标"
                value={item.icon ?? ''}
                options={NAV_ICON_OPTIONS}
                hint="仅用于移动端底部导航"
                onChange={(value) => update({ icon: value.length > 0 ? value : undefined })}
              />
            </>
          )}
        />
      </FieldGroup>
    </FormPanel>
  );
}
