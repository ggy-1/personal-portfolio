import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/Button';
import { Tag } from '@/components/ui/Tag';
import { siteConfig } from '@/config/site';

/**
 * 首页首屏（PRD 4.3）
 *
 * 15 秒内让访客知道「你是谁、做什么、怎么联系」：
 * 姓名 + 定位 + 三个关键词 + 两个入口，其余一律不放。
 * 背景氛围由全站固定的星空层提供，这里不再叠加任何装饰元素。
 */
export function Hero() {
  return (
    <section className="pt-20 pb-16 md:pt-28 md:pb-24 lg:pt-32">
      <Container>
        <p className="text-sm text-fg-muted">你好，我是</p>

        <h1 className="hero-title mt-3 text-fg">{siteConfig.name}</h1>

        <p className="brand-text mt-4 text-lg font-semibold md:text-xl">{siteConfig.role}</p>

        <ul className="mt-6 flex flex-wrap gap-2">
          {siteConfig.keywords.map((keyword) => (
            <li key={keyword}>
              <Tag>{keyword}</Tag>
            </li>
          ))}
        </ul>

        <div className="mt-10 flex flex-wrap gap-3">
          <Button href="/projects" variant="primary" size="lg" icon="arrowRight">
            查看项目
          </Button>
          <Button href={siteConfig.resumeUrl} size="lg" icon="download" iconPosition="start">
            下载简历
          </Button>
        </div>

        <p className="mt-6 text-xs text-fg-muted">{siteConfig.meta.description}</p>
      </Container>
    </section>
  );
}
