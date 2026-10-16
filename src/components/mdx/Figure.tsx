import Image from 'next/image';

/**
 * 正文配图。宽度与高度是必填项：
 * 只有知道原始尺寸，next/image 才能在构建期生成正确的响应式尺寸并锁定宽高比，
 * 否则图片加载完成时会顶开正文，直接产生 CLS（AGENTS.md 4.5 第 2 条）。
 *
 * MDX 用法：
 *   <Figure src="/images/blog/rsc/waterfall.png" width={1280} height={720} alt="请求瀑布图" caption="优化前的串行请求" />
 */
export function Figure({
  src,
  alt,
  width,
  height,
  caption,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  caption?: string;
}) {
  return (
    <figure className="my-8">
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes="(max-width: 767px) 100vw, var(--prose-max)"
        className="h-auto w-full rounded-md border border-line"
      />
      {caption ? (
        <figcaption className="mt-2 text-center text-xs text-fg-muted">{caption}</figcaption>
      ) : null}
    </figure>
  );
}
