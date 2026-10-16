import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  images: {
    // 项目/文章封面使用自建 SVG 占位图与截图，Next 默认禁止 SVG 直通，
    // 这里显式开启；配套 contentDispositionType 防止 SVG 被当作可执行内容直接打开。
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [],
  },

  // 说明：v1 为纯静态 SSG，不设置 output: 'export'，
  // 以便将来引入 Route Handlers 时无需改造部署方式（见 docs/TECH_DESIGN.md 1.2）。
};

export default nextConfig;
