import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { Card } from '@/components/ui/Card';
import { Tag } from '@/components/ui/Tag';
import type { PostSummary } from '@/lib/content/schema';
import { formatDateCompact } from '@/lib/utils/date';

/**
 * 文章卡片（PRD F-060）
 *
 * 链接语义用「标题即链接 + ::after 覆盖整张卡片」的写法：
 * 卡片整体可点击，但屏幕阅读器读到的可访问名称是文章标题本身，
 * 而不是「点击这里」这类无信息量的文本。
 * 因此卡片内的标签刻意不渲染为链接，避免出现嵌套可交互元素。
 */
export function PostCard({ post }: { post: PostSummary }) {
  return (
    <Card interactive className="p-5 md:p-6">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-fg-muted">
        <time dateTime={post.date}>{formatDateCompact(post.date)}</time>
        <span className="inline-flex items-center gap-1">
          <Icon name="clock" />
          约 {post.readingMinutes} 分钟
        </span>
      </div>

      <h3 className="mt-3 text-lg leading-snug font-semibold text-fg">
        <Link
          href={`/blog/${post.slug}`}
          className="transition-colors duration-hover ease-out-quint after:absolute after:inset-0 hover:text-accent"
        >
          {post.title}
        </Link>
      </h3>

      <p className="mt-2 line-clamp-3 text-sm text-fg-secondary">{post.summary}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {post.tags.map((tag) => (
          <Tag key={tag}>{tag}</Tag>
        ))}
      </div>
    </Card>
  );
}
