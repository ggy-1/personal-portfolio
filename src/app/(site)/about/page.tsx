import Image from 'next/image';
import { Container } from '@/components/layout/Container';
import { Section } from '@/components/layout/Section';
import { SectionHeader } from '@/components/layout/SectionHeader';
import { Button } from '@/components/ui/Button';
import { Icon, isIconName } from '@/components/ui/Icon';
import { Tag } from '@/components/ui/Tag';
import { siteConfig } from '@/config/site';
import { timeline } from '@/config/timeline';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata = buildMetadata({
  title: '关于',
  description: `${siteConfig.name} 的个人介绍、经历与联系方式。`,
  path: '/about',
});

/**
 * 个人介绍（PRD 4.4）
 *
 * 顺序刻意如此：先给「我是谁、现在做什么」，再给经历时间线，
 * 最后才是简历下载与联系方式 —— 招聘方最想先看到的是结论，不是履历。
 */
export default function AboutPage() {
  return (
    <>
      <Section>
        <Container>
          <SectionHeader
            as="h1"
            title="关于我"
            description={`${siteConfig.role} · 目前主要关注前端工程化与性能优化。`}
          />

          <div className="mt-10 grid gap-8 md:grid-cols-[minmax(0,1fr)_200px] md:items-start">
            {/* TODO(待你替换)：以下自述为占位文本，替换成你自己的经历与目标 */}
            <div className="prose-width space-y-4 text-sm text-fg-secondary md:text-base">
              <p>
                我是一名前端开发，日常和 React、TypeScript 与构建工具打交道。喜欢把复杂的交互拆成简单的状态，
                也喜欢为了让首屏快 300ms 折腾一整晚。
              </p>
              <p>
                这个网站是我的作品集与技术博客：项目页记录「做了什么、为什么这么做」，
                博客页记录「踩过哪些坑、怎么爬出来」。两者都是写给自己看的笔记，
                顺便希望能帮到遇到同样问题的人。
              </p>
              <p>
                目前在做的事、正在寻找的机会，都会写在下面。如果你觉得有可以合作的地方，欢迎直接发邮件。
              </p>
            </div>

            <Image
              src={siteConfig.avatar}
              alt={`${siteConfig.name} 的头像`}
              width={200}
              height={200}
              sizes="200px"
              className="h-auto w-full max-w-[200px] rounded-lg border border-line bg-surface md:justify-self-end"
            />
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Button
              href={siteConfig.resumeUrl}
              variant="primary"
              icon="download"
              iconPosition="start"
            >
              下载简历
            </Button>
            <Button href={`mailto:${siteConfig.email}`} icon="mail" iconPosition="start">
              {siteConfig.email}
            </Button>
          </div>
        </Container>
      </Section>

      <Section className="bg-subtle/40">
        <Container>
          <SectionHeader title="经历" description="按时间倒序，进行中的排在最前。" />

          {/* 时间线：用左边框和圆点表达顺序，不依赖颜色即可理解 */}
          <ol className="mt-10 space-y-8 border-l border-line pl-6">
            {timeline.map((item) => (
              <li key={item.id} className="relative">
                <span
                  aria-hidden="true"
                  className={`absolute top-2 -left-[1.8rem] size-2.5 rounded-full ${
                    item.status === 'ongoing' ? 'bg-accent' : 'bg-line-strong'
                  }`}
                />
                <p className="text-xs text-fg-muted">{item.period}</p>
                <h3 className="mt-1 text-base font-semibold text-fg">{item.title}</h3>
                {item.org ? <p className="mt-0.5 text-sm text-fg-secondary">{item.org}</p> : null}
                <p className="mt-2 text-sm text-fg-secondary">{item.description}</p>
                {item.tags && item.tags.length > 0 ? (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {item.tags.map((tag) => (
                      <li key={tag}>
                        <Tag>{tag}</Tag>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionHeader title="联系方式" description="邮件是最可靠的渠道，通常 24 小时内回复。" />

          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {siteConfig.socials.map((social) => (
              <li key={social.id}>
                <a
                  href={social.href}
                  target={social.href.startsWith('http') ? '_blank' : undefined}
                  rel={social.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="flex min-h-16 items-center gap-3 rounded-lg border border-line bg-surface px-4 py-3 transition-colors duration-expand ease-out-quint hover:border-line-strong hover:bg-surface-hover"
                >
                  {isIconName(social.icon) ? (
                    <Icon name={social.icon} size={18} className="shrink-0 text-fg-muted" />
                  ) : null}
                  <span className="min-w-0">
                    <span className="block text-xs text-fg-muted">{social.label}</span>
                    <span className="block truncate text-sm text-fg">
                      {social.handle ?? social.href}
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </Container>
      </Section>
    </>
  );
}
