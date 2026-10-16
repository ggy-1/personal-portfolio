import { compileMDX } from 'next-mdx-remote/rsc';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';
import { mdxComponents } from './mdxComponents';

/**
 * MDX 正文渲染（构建期编译，客户端零 JS）
 *
 * 依赖两个插件，都是有明确用途的：
 *  - remark-gfm：表格、删除线、任务列表等 GitHub 风格语法的支持；
 *  - rehype-slug：给标题生成 id，且与 src/lib/content/toc.ts 用同一套 github-slugger
 *    规则，保证目录锚点能准确跳转（TECH_DESIGN T7）。
 *
 * 注意：源码中的 frontmatter 已由 src/lib/content/loader.ts 用 gray-matter 剥离，
 * 这里收到的只是正文，因此不开启 parseFrontmatter。
 *
 * 关于 blockJS: false —— 必须显式关闭，否则组件的表达式属性会被静默丢弃。
 *
 * next-mdx-remote v6 默认（blockJS: true）会移除 MDX 里所有的 JS 表达式属性，
 * 于是 `<Figure width={1280} height={800} />` 传到组件时 width / height 变成 undefined。
 * 后果有两层，且都很隐蔽：
 *   1. next/image 缺少尺寸会在**开发环境**直接抛错（页面 500）；
 *      而该校验被 NODE_ENV !== 'production' 包住，生产构建不会报错，
 *      只输出一个没有 width/height 的 <img>，加载完成时顶开正文 —— 即 AGENTS.md 4.5
 *      与 CLS < 0.1 红线要禁止的布局位移。
 *   2. 正文里裸写的 { } 会被当作表达式整段删除，等于静默吃掉作者写的内容。
 *
 * 之所以在这里可以关闭：本项目的 MDX 只来自仓库内经过 review 的 content/**（TECH_DESIGN T4 方案 1），
 * 威胁模型里没有「不可信 MDX」这一项 —— 能改这个文件的人本来就能改 next.config.ts。
 * 同时保留默认开启的 blockDangerousJS：它仍然拦下 eval / Function / require / process /
 * constructor / __proto__ 这类可用于读写构建环境的调用，是真正有价值的那一层。
 */
export async function MdxContent({ source }: { source: string }) {
  const { content } = await compileMDX({
    source,
    components: mdxComponents,
    options: {
      blockJS: false,
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug],
      },
    },
  });

  return <div className="mdx">{content}</div>;
}
