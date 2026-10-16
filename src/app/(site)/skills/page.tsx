import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { Section } from '@/components/layout/Section';
import { SectionHeader } from '@/components/layout/SectionHeader';
import { SkillLevelLabel } from '@/components/skills/SkillLevelLabel';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon, isIconName } from '@/components/ui/Icon';
import { skillCategories } from '@/config/skills';
import { getProjectSummariesByIds } from '@/lib/content/loader';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata = buildMetadata({
  title: '技能',
  description: '按方向分组的技能清单，用「熟练 / 熟悉 / 了解」三档标注，并关联到具体项目。',
  path: '/skills',
});

/**
 * 技能展示（PRD 4.5）
 *
 * 两条刻意的设计决定：
 *  1. 熟练度用三档文字而不是百分比进度条（F-041）——百分比无法自证，
 *     也很容易被追问「85% 是什么标准」；
 *  2. 每项技能都尽量关联到真实项目（F-042），让「会用」这件事可以被验证，
 *     而不是只能听我说。
 */
export default function SkillsPage() {
  const totalSkills = skillCategories.reduce((sum, category) => sum + category.skills.length, 0);

  return (
    <>
      <Section>
        <Container>
          <SectionHeader
            as="h1"
            title="技能"
            description={`${skillCategories.length} 个方向、${totalSkills} 项技能。点击分类可直接跳到对应分组。`}
          />

          {/* 分类快捷入口：用锚点而不是筛选控件，避免为一次跳转引入客户端状态 */}
          <nav aria-label="技能分类" className="mt-8">
            <ul className="flex flex-wrap gap-2">
              {skillCategories.map((category) => (
                <li key={category.id}>
                  <a
                    href={`#${category.id}`}
                    className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-subtle px-4 text-sm text-fg-secondary transition-colors duration-hover ease-out-quint hover:border-line-strong hover:text-fg"
                  >
                    {isIconName(category.icon) ? <Icon name={category.icon} /> : null}
                    {category.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {skillCategories.length === 0 ? (
            <div className="mt-10">
              <EmptyState
                title="还没有技能数据"
                description="在 src/config/skills.ts 里补充分类与技能。"
              />
            </div>
          ) : (
            <div className="mt-12 space-y-10">
              {skillCategories.map((category) => (
                <section
                  key={category.id}
                  id={category.id}
                  className="scroll-mt-[var(--header-offset)] rounded-lg border border-line bg-surface p-6 md:p-8"
                >
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-fg">
                    {isIconName(category.icon) ? (
                      <Icon name={category.icon} size={18} className="text-fg-muted" />
                    ) : null}
                    {category.label}
                  </h2>

                  <ul className="mt-6 space-y-5">
                    {category.skills.map((skill) => {
                      const related = getProjectSummariesByIds(skill.relatedProjects ?? []);

                      return (
                        <li key={skill.name}>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                            <p className="text-sm font-medium text-fg">{skill.name}</p>
                            <SkillLevelLabel level={skill.level} />
                          </div>

                          {skill.note ? (
                            <p className="mt-1.5 text-sm text-fg-muted">{skill.note}</p>
                          ) : null}

                          {related.length > 0 ? (
                            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                              <span className="text-fg-muted">相关项目</span>
                              {related.map((project) => (
                                <Link
                                  key={project.slug}
                                  href={`/projects/${project.slug}`}
                                  className="inline-flex min-h-11 items-center text-accent transition-colors duration-hover ease-out-quint hover:text-accent-2"
                                >
                                  {project.title}
                                </Link>
                              ))}
                            </p>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </Container>
      </Section>
    </>
  );
}
