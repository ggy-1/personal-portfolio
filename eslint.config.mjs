import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';

/**
 * ESLint flat config（对应 docs/TECH_DESIGN.md 2.4「代码规范」）。
 *
 * 直接使用 Next 官方预设，不自建规则集：它已包含 @next/eslint-plugin-next、
 * react、react-hooks、jsx-a11y 与 typescript-eslint。AGENTS.md 第 7 节对可访问性的
 * 硬性要求（alt、aria、键盘可达）正是由 jsx-a11y 这部分覆盖的；
 * 另起一套规则只会多一处需要在 Next 升级时同步维护的地方。
 *
 * core-web-vitals 变体在基础预设之上启用了 LCP/CLS 相关的 Next 规则
 * （如禁用 <img>、要求 next/image 的尺寸声明），与第 7 节的性能红线一致。
 */
const config = [
  ...nextCoreWebVitals,
  {
    // 构建产物与生成文件不参与 lint；next-env.d.ts 由 Next 生成，不要手改也不要 lint
    ignores: ['.next/**', 'out/**', 'build/**', 'coverage/**', 'next-env.d.ts'],
  },
];

export default config;
