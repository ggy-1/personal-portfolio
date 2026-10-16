import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  test: {
    // 单元测试只覆盖 src/lib 下的纯函数，因此使用 node 环境。
    // 组件测试接入 jsdom + Testing Library 时再按文件级 environment 覆盖（见 AGENTS.md 第 6 节）。
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    reporters: 'default',
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
