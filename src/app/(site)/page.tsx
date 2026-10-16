import { Hero } from './_components/Hero';
import { PostCard } from '@/components/blog/PostCard';
import { Container } from '@/components/layout/Container';
import { Section } from '@/components/layout/Section';
import { SectionHeader } from '@/components/layout/SectionHeader';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Tag } from '@/components/ui/Tag';
import { siteConfig } from '@/config/site';
import { skillCategories } from '@/config/skills';
import { timeline } from '@/config/timeline';
import { getAllPosts, getFeaturedProjects, toPostSummary } from '@/lib/content/loader';

/**
 * 首页（PRD 4.3 / F-024）
 *
 * 结构：首屏 → 精选项目 → 最新文章 → 技能概览 → 关于摘要 → 联系。
 * 每个区块都只放「摘要 + 一个明确入口」，详细信息留给各自的独立页面，
 * 这样首页始终保持可扫读，也不会因为内容变多而无限变长。
 *
 * 数据全部来自内容层（loader）与配置（config）：页面里不出现任何写死的文案或列表。
 */
export default function HomePage() {
  const featuredProjects = getFeaturedProjects(3);
  const latestPosts = getAllPosts()
    .slice(0, 3)
    .map((post) => toPostSummary(post));
  const current = timeline.find((item) => item.status === 'ongoing');
  const totalSkills = skillCategories.reduce((sum, category) => sum + category.skills.length, 0);

  return (
    <>
      <Hero />

      <Section id="projects">
        <Container>
          <SectionHeader
            title="精选项目"
            description="从需求到上线的完整过程，包含技术选型与取舍。"
            action={
              <Button href="/projects" variant="ghost" icon="arrowRight">
                全部项目
              </Button>
            }
          />

          {featuredProjects.length > 0 ? (
            <ul className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featuredProjects.map((project) => (
                <li key={project.slug} className="flex">
                  <ProjectCard project={project} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-10">
              <EmptyState
                title="还没有精选项目"
                description="在 content/projects/<slug>/index.mdx 的 frontmatter 里把 featured 设为 true，项目就会出现在这里。"
              />
            </div>
          )}
        </Container>
      </Section>

      <Section id="blog" className="bg-subtle/40">
        <Container>
          <SectionHeader
            title="最新文章"
            description="把踩过的坑写下来，比记住它更可靠。"
            action={
              <Button href="/blog" variant="ghost" icon="arrowRight">
                全部文章
              </Button>
            }
          />

          {latestPosts.length > 0 ? (
            <ul className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {latestPosts.map((post) => (
                <li key={post.slug} className="flex">
                  <PostCard post={post} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-10">
              <EmptyState
                title="还没有文章"
                description="运行 pnpm new:post <slug> 「标题」生成第一篇，写完把 frontmatter 里的 draft 改成 false。"
              />
            </div>
          )}
        </Container>
      </Section>

      <Section id="skills">
        <Container>
          <SectionHeader
            title="技能概览"
            description={`${skillCategories.length} 个方向、${totalSkills} 项技能，按「熟练 / 熟悉 / 了解」三档标注。`}
            action={
              <Button href="/skills" variant="ghost" icon="arrowRight">
                技能详情
              </Button>
            }
          />

          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {skillCategories.map((category) => (
              <li key={category.id} className="rounded-lg border border-line bg-surface p-5">
                <p className="text-sm font-semibold text-fg">{category.label}</p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {category.skills.map((skill) => (
                    <li key={skill.name}>
                      <Tag>{skill.name}</Tag>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section id="about" className="bg-subtle/40">
        <Container>
          <SectionHeader
            title="关于我"
            description={siteConfig.meta.description}
            action={
              <Button href="/about" variant="ghost" icon="arrowRight">
                完整经历
              </Button>
            }
          />

          {current ? (
            <p className="mt-8 text-sm text-fg-muted md:text-base">
              当前：{current.title}
              {current.org ? ` · ${current.org}` : ''}（{current.period}）
            </p>
          ) : null}
        </Container>
      </Section>

      <Section id="contact">
        <Container>
          <div className="rounded-lg border border-line bg-surface p-6 md:p-10">
            <SectionHeader
              title="联系我"
              description="有合作、机会或技术问题，欢迎直接发邮件。"
            />

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button
                href={`mailto:${siteConfig.email}`}
                variant="primary"
                icon="mail"
                iconPosition="start"
              >
                {siteConfig.email}
              </Button>

              <ul className="flex flex-wrap gap-2">
                {siteConfig.socials
                  .filter((social) => social.icon !== 'mail')
                  .map((social) => (
                    <li key={social.id}>
                      <Button href={social.href} variant="ghost">
                        {social.label}
                      </Button>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
