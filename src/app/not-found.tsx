import { Container } from '@/components/layout/Container';
import { Section } from '@/components/layout/Section';
import { StarField } from '@/components/stars/StarField';
import { Button } from '@/components/ui/Button';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata = buildMetadata({
  title: '页面不存在',
  description: '没有找到这个页面。',
});

/**
 * 自定义 404（PRD F-005）
 *
 * 这一层在路由组 (site) 之外，拿不到前台布局，因此自己渲染星空层。
 * 文案给出两个明确的出口，而不是只说「找不到」。
 */
export default function NotFound() {
  return (
    <>
      <StarField />

      <Section className="relative z-[var(--z-content)] flex min-h-[60dvh] items-center">
        <Container>
          <p className="text-sm text-fg-muted">404</p>
          <h1 className="hero-title mt-3 text-fg">这里没有你要找的东西</h1>
          <p className="mt-4 max-w-[var(--prose-max)] text-sm text-fg-secondary md:text-base">
            页面可能已经被移动或删除。星空还在，换一条路继续走。
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button href="/" variant="primary" icon="arrowRight">
              返回首页
            </Button>
            <Button href="/blog" icon="arrowRight">
              看看文章
            </Button>
          </div>
        </Container>
      </Section>
    </>
  );
}
