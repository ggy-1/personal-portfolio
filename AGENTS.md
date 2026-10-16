# AGENTS.md

> 本文件是**所有 AI 编码助手（Cursor / Claude Code / Copilot 等）在本仓库工作时的强制规范**。
> 每次开始任务前必须先读本文件，并按第 12 节的检查清单自检。
> 与 `docs/PRD.md`、`docs/TECH_DESIGN.md` 冲突时，以本文件的约束为准（本文件是执行层规范），但**必须在同一次改动中同步更新那两份文档**。

---

## 1. 项目概述

**这是一个单作者的个人展示网站**：个人介绍、技能展示、项目作品集、技术博客。深色主题 + 星空背景，适配移动端到桌面端，简洁现代风格。网站本身就是作者的前端能力作品，因此**代码质量、性能、可访问性与视觉细节同等重要**。

| 项 | 内容 |
| --- | --- |
| 定位 | 单作者、只读为主、内容周级更新的展示型站点 |
| 技术栈 | Next.js 16（App Router）+ React 19 + TypeScript（`strict`）+ Tailwind CSS 4 + MDX |
| 内容源 | 仓库内 `content/**/*.mdx` 与 `src/config/*.ts` —— **前台渲染的唯一来源，没有 CMS** |
| 后台 | `src/app/admin/**`，**仅本地模拟**：数据存在浏览器 localStorage，不是后端，不影响前台产物 |
| 数据存储 | **无数据库**。构建期 SSG，产物为静态文件 |
| 后端 | **无**。禁止新增 `app/api/**/route.ts`，除非用户在当次任务中明确要求（见 9.1） |
| 部署 | 静态产物部署到 Vercel / Cloudflare Pages，push 即发布 |
| 核心指标 | LCP ≤ 2.0s、CLS < 0.1、首屏 JS < 150KB（gzip）、Lighthouse 四项 ≥ 95 |

**三条不可动摇的产品约束**

1. 星空是氛围，不是主角。任何装饰都不得降低文字对比度或阅读流畅度。
2. 每个页面在 320px 宽度下都必须可用（无横向滚动、文字可读、按钮可点）。
3. 新增一篇博客 = 新增一个 `.mdx` 文件 + 一次 push。任何破坏这一点的设计都要被拒绝。

---

## 2. 文档索引（按需查阅，不要凭记忆猜）

| 想知道什么 | 去读 |
| --- | --- |
| 产品要做什么、功能清单与优先级、验收标准 | `docs/PRD.md` |
| 技术选型理由、目录结构、数据模型、技术难点对策 | `docs/TECH_DESIGN.md` |
| 设计 token、色彩、字号、断点、动效参数 | `docs/PRD.md` 第 5 节 + `src/styles/tokens.css` |
| AI 协作规范 | 本文件 |

**权威顺序**：本文件（执行约束）> `docs/TECH_DESIGN.md`（技术方案）> `docs/PRD.md`（产品定义）> 既有代码的既有写法。

---

## 3. 常用命令

> 脚手架建立后，下列命令名必须**与 `docs/TECH_DESIGN.md` 附录 A 完全一致**。若发现实际命令与本表不符，先修本表，不要临时臆造新命令。

| 命令 | 用途 | 何时必须运行 |
| --- | --- | --- |
| `pnpm dev` | 本地开发 | 开发时 |
| `pnpm build` | 生产构建（内含内容校验） | 提交前 |
| `pnpm typecheck` | `tsc --noEmit` | **每次改动后** |
| `pnpm lint` | Lint + 格式检查 | **每次改动后** |
| `pnpm validate:content` | 校验 frontmatter、图片路径、slug 引用 | 改动 `content/**` 或 `src/config/**` 后**必须** |
| `pnpm build:search-index` | 生成搜索索引 | 改动内容后构建流程会自动调用 |
| `pnpm check:links` | 检查站内死链 | 改动内容后 |
| `pnpm new:post` | 按模板生成新文章文件 | 新增文章时（不要手写空文件） |
| `pnpm test` | Vitest 单元/组件测试 | 改动 `src/lib/**` 或 `src/components/**` 后 |
| `pnpm test:e2e` | Playwright 端到端测试 | 改动布局、导航、响应式、星空、搜索后 |
| `pnpm lhci` | Lighthouse CI | 涉及性能、图片、字体的改动后 |

**最小验证门槛**：任何代码改动在交付前至少跑通 `pnpm typecheck && pnpm lint`；涉及内容跑 `pnpm validate:content`；涉及 `src/lib/**` 跑 `pnpm test`。**不要声称"已完成"而未运行这些命令，也不要在未运行时含糊其辞。**

---

## 4. 开发规范

### 4.1 架构边界（违反即不可合并）

```text
src/app  →  src/components  →  src/lib
   ↓              ↓
src/config ────────┘
content/**  ──（只被 lib 读取，不反向引用源码）
```

1. **依赖只能从上往下**。禁止 `lib` 引用 `components`、禁止组件引用页面。
2. **`src/lib/**` 内禁止 import React**，禁止读取 `process.env`（构建脚本除外）。它必须能作为纯函数被单测。
3. **`src/components/ui/**` 是无业务组件**：不得 import 内容 schema 或 `lib/content`，只接受 props。
4. **内容解析只在 `src/lib/content/**`**。页面与组件**禁止**直接 `fs.readFile` 或解析 frontmatter。
5. **数据模型只在 `src/lib/content/schema.ts` 定义一次**。其他位置的类型必须 `z.infer` 派生，**禁止手写重复的 interface**。
6. 默认使用 Server Component。需要交互时才加 `'use client'`，并且**尽量下沉到最小的叶子节点**（不要把整页标记为客户端组件）。已知的客户端组件只有：星空、搜索面板、筛选控件、主题切换、目录高亮、图片灯箱、后台界面（`src/app/admin/**`，登录态只在浏览器里，整块必然是客户端）。
7. **后台（`/admin`）与前台严格隔离**：前台页面住在路由组 `(site)`，后台住在 `admin`，两者不共享布局（后台自己有侧边栏 + 顶栏，不复用前台 `NavBar`）。
8. **`src/api/**` 是后台唯一的取数入口**。后台页面与组件**禁止**直接读写 `localStorage`；所有资源方法经 `src/api/client.ts` 的 `request()` 执行，那是将来替换成真实后端的唯一改动点。因此后台接口一律是 `async`（即使 localStorage 是同步的），否则换后端时所有调用点都要改。

**新增文件放哪**

| 情况 | 位置 |
| --- | --- |
| 纯函数 / 数据转换 | `src/lib/<domain>/` |
| 通用无业务 UI | `src/components/ui/` |
| 骨架（导航、页脚、容器） | `src/components/layout/` |
| 会被写进 MDX 的组件 | `src/components/mdx/`，并在 MDX 组件映射中注册 |
| 只服务单个页面的区块 | 与页面同级的 `_components/`（下划线前缀不进路由） |
| 后台页面 | `src/app/admin/(dashboard)/<name>/`；只服务该页的表单放同级 `_components/`。放进 `(dashboard)` 即自动获得登录守卫 |
| 后台跨页复用的 UI / hook / 工具 | `src/app/admin/_components/`、`src/app/admin/_hooks/`、`src/app/admin/_lib/` |
| 后台数据访问 | `src/api/**`。页面**禁止**直接碰 `localStorage`（见 4.1 第 8 条） |
| 可编辑的内容数据（技能、经历、社交链接） | `src/config/*.ts` |
| 长文 / 图文内容 | `content/**.mdx` |

### 4.2 样式与设计 token

1. **禁止硬编码颜色、圆角、间距、动效时长**。一律使用 `src/styles/tokens.css` 中的 CSS 变量或 Tailwind 中映射好的语义类。看到 `#6EA8FE`、`16px`、`250ms` 这类字面值出现在组件里，就是错误。
2. **禁止行内 `style={{}}`**，除非值是运行时计算的（如星空视差的 transform）。
3. 语义 token 优先于 primitive token：写 `bg-surface-700`，不写 `bg-[#111722]`。
4. 主题为**深色单一主题**。可以读取 `data-theme`，但**不要自行实现浅色主题**（列为 v2，见 PRD）。
5. 新增任何视觉样式前，先确认 PRD 第 5 节是否已有对应规范；没有就先补规范，再写代码。

### 4.3 星空背景的硬约束

星空是本项目最容易写出性能事故的地方，改动 `src/components/stars/**` 时必须遵守：

1. **禁止引入任何绘图/3D 库**（Three.js、PixiJS、p5.js 等）。只用原生 Canvas 2D。
2. 星点位置、大小只计算一次并预渲染到离屏画布；**每帧只能做 `drawImage` 与有限的透明度调制**，禁止每帧重算坐标或重绘全部星点。
3. **禁止使用 `shadowBlur`、逐帧 `filter`、大面积 `backdrop-filter`** 做发光效果。
4. 必须实现的暂停条件：`document.visibilityState === 'hidden'`、`prefers-reduced-motion: reduce`、画布不在视口内。
5. 必须实现**掉帧自动降级**：连续 60 帧平均耗时 > 24ms 时依次关闭闪烁 → 视差 → 整体替换为静态星点。降级后不得再尝试恢复动画。
6. 星点数量必须随视口宽度自适应（移动 120 / 平板 220 / 桌面 320），Canvas 的 `devicePixelRatio` 上限为 2。
7. 星空层必须 `position: fixed`、`pointer-events: none`、`aria-hidden="true"`、`z-index` 使用 `--z-stars`。
8. **首帧不得依赖 JS**：Hero 背景必须由 CSS 先渲染出氛围，Canvas 在空闲时接管，禁止出现空白或闪白。
9. 星空逻辑的客户端开销预算为 **< 6KB（gzip）**。

### 4.4 内容与代码分离

1. 改文案、加文章、加项目**只能改 `content/**` 或 `src/config/**`**，不得为了加一条数据去改组件。
2. 页面上出现的所有站点级文案（姓名、定位、导航、社交链接）必须来自 `src/config/site.ts`，**禁止在 JSX 中写死**。
3. frontmatter 必填字段缺失时，构建必须失败并给出**文件名 + 字段名 + 期望格式**的报错。不要为了让构建通过而放宽 schema 或加默认空值。
4. 新增内容必须走 `pnpm new:post` 或对应模板，保证 frontmatter 结构一致。

**内容字段速查**

```yaml
# 博客（content/blog/YYYY-MM-DD-slug.mdx）
title:      必填，≤80 字
date:       必填，YYYY-MM-DD 字符串（不要写成 YYYY/MM/DD 或带时区）
summary:    必填，≤160 字，用于列表与 SEO
tags:       必填，1–5 个，必须来自既有标签词表
cover:      可选，相对 public/ 的路径
draft:      可选，true 则不参与构建与列表

# 项目（content/projects/<slug>/index.mdx）
title/year/role/stack/summary/cover:  必填
stack:      1–10 个，写法统一（用 React，不用 react / React.js）
featured:   是否首页精选
status:     active | completed | archived
demo/repo:  可选，必须是完整 URL
metrics:    ≤4 条成果数据，如 "首屏从 3.2s 优化到 1.1s"
```

**标签一致性**：新增标签前先搜索已有标签，避免产生 `react` / `React` / `React.js` 这类同义分裂。校验脚本会拦截，但不要依赖它。

### 4.5 图片与资源

1. 项目封面统一 `16:10`，文章封面统一 `16:9`。卡片容器必须用 `aspect-ratio` 锁定比例，图片 `object-fit: cover`。
2. 图片必须使用 `next/image` 并显式给出 `width/height` 或 `fill` + `sizes`，**禁止无尺寸的原生 `<img>`**（会造成 CLS）。
3. 单图 ≤ 200KB，格式优先 AVIF/WebP。
4. MDX 中的图片用 `<Figure>` 组件，`alt` 必填、`caption` 可选。**禁止省略 `alt`**。
5. 首屏以外的图片一律懒加载。
6. 项目截图放在 `content/projects/<slug>/images/`，站点级资源放 `public/images/`。

---

## 5. 代码风格

| 项 | 规范 |
| --- | --- |
| 语言 | TypeScript，`strict: true`。**禁止 `any`**（确实无法定型时用 `unknown` + 类型收窄）；**禁止 `@ts-ignore`**，必须用 `@ts-expect-error` 并写明原因 |
| 组件 | 函数组件 + 具名导出；文件 PascalCase，与组件同名 |
| 其他文件 | kebab-case（`reading-time.ts`） |
| Hook | `use` 前缀，放在 `src/hooks/` 或与使用它的组件同目录 |
| Props 类型 | `<组件名>Props`，就近定义；跨文件复用的放 `src/types/` |
| 导入顺序 | 外部依赖 → `@/lib`、`@/config` → `@/components` → 相对路径 → 类型导入；组与组之间空行 |
| 路径别名 | 跨目录一律用 `@/`，**禁止 `../../../`** 这种深层相对路径 |
| 类名合并 | 用 `cn()`（`src/lib/utils/cn.ts`），**禁止字符串拼接或三元表达式堆叠** |
| 格式化 | 交给 Prettier/Biome，**不要手工调整缩进与换行**；改完不要忘记跑 `pnpm lint` |
| 注释 | 解释"为什么这么做"与"约束边界"，不解释代码字面意思。涉及性能取舍、浏览器兼容、无障碍的地方**必须写注释说明原因** |
| 命名 | 语义化英文；布尔量用 `is/has/should/can` 前缀；事件处理函数用 `handleXxx` |
| 日期 | 内容日期一律 `YYYY-MM-DD` 字符串，**禁止 `new Date()` 解析后参与排序**；格式化显式指定 `timeZone: 'Asia/Shanghai'` |
| 随机数/时间 | 构建期代码中**禁止使用 `Date.now()` 或 `Math.random()`** 参与渲染（会导致水合不一致）；星空动画除外，且必须只在客户端执行 |
| 无障碍 | 语义标签优先（`nav/section/article`）；标题层级不跳级；交互元素必须可键盘操作且焦点可见；颜色不作唯一信息载体 |
| 提交信息 | Conventional Commits：`feat:` / `fix:` / `content:` / `style:` / `refactor:` / `perf:` / `test:` / `docs:` / `chore:`。内容改动用 `content:` |
| 文案语言 | 面向访客的界面文案用中文，代码标识符与注释主体用英文，注释中的复杂说明可用中文 |

**组件最少要处理的六个状态**：默认、悬停、聚焦、按下、禁用、加载。缺少聚焦样式的组件视为未完成。

---

## 6. 测试要求

### 6.1 分层要求

| 层次 | 覆盖对象 | 要求 |
| --- | --- | --- |
| 单元（Vitest） | `src/lib/**` 的纯函数：TOC 生成、阅读时长、日期格式化、标签聚合、排序、搜索分词与索引构建 | `src/lib/**` 行覆盖率 ≥ 80%；**新增或修改 `lib` 逻辑必须同时新增/更新测试**，且测试必须断言具体输出而非"不抛错" |
| 组件（Testing Library） | `ui/` 组件六种状态、CodeBlock 复制逻辑、SearchDialog 键盘交互、筛选控件 | 关键交互路径全覆盖；必须包含键盘操作用例 |
| 端到端（Playwright） | 320/375/768/1024/1440/1920 六个宽度、导航形态、标签筛选、搜索流程、TOC 跳转、`prefers-reduced-motion` 下无动画、禁 JS 后内容可读 | 见 6.2 的必测清单 |
| 性能与可访问性 | Lighthouse CI + axe-core | 四项 ≥ 95；axe 无严重级别问题 |
| 内容校验 | `scripts/validate-content.ts` | 见 4.4 |

### 6.2 这些改动必须补 E2E 用例

改动以下任一内容，**必须在 `tests/e2e/` 中新增或更新用例**，否则不算完成：

- 布局、栅格、断点、间距 → 断言所有宽度下 `scrollWidth <= clientWidth`
- 导航、路由、Tab Bar → 断言各断点下的导航形态与当前页高亮
- 星空 → 断言 `prefers-reduced-motion` 下静止、切后台后暂停
- 搜索、筛选 → 断言关键词命中结果与 URL query 同步
- TOC、锚点 → 断言跳转后标题未被顶栏遮挡

### 6.3 测试纪律

1. **禁止为了让测试通过而修改断言**。测试失败先怀疑实现，确认断言本身有误后再改断言，并在 PR 中说明原因。
2. **禁止 mock 掉被验证的核心逻辑**。星空渲染、搜索匹配、内容解析这些必须真实执行。
3. **禁止提交 `test.only` / `describe.only` / `skip` 而未说明原因**。
4. 测试里的等待用 `expect.poll` 或 Playwright 的自动等待，**禁止 `waitForTimeout` 这类固定睡眠**。
5. 新增测试用中文描述行为（`it('在 320px 宽度下不出现横向滚动', ...)`），让人一眼看懂在验证什么。

---

## 7. 性能与可访问性红线

**性能预算（超限即视为缺陷）**

| 项 | 上限 |
| --- | --- |
| 首屏 JS（gzip） | 150KB |
| 星空客户端逻辑 | 6KB |
| 单页 CSS | 40KB |
| 单张图片 | 200KB |
| 搜索索引（gzip） | 150KB，且必须按需加载 |
| 新增运行时依赖 | 单包 10KB；超过必须说明不可替代的理由 |

**必须遵守**

1. **禁止整包引入**：`import { format } from 'date-fns'` 而非 `import * as dateFns`；动效库只 import 具体组件；图标只按需引入。
2. **禁止阻塞式第三方脚本**。分析脚本必须 `afterInteractive` 或 `lazyOnload`。
3. **禁止给每篇文章引入客户端 markdown 解析器或客户端高亮库**（Shiki 在构建期完成，客户端 0 字节）。
4. **禁止引入 Google Analytics、聊天挂件、社交平台嵌入脚本**。
5. 任何新增字体前先读 PRD 与 TECH_DESIGN：**中文字体一律走系统字体栈，禁止自托管全量中文字体**。
6. 新增依赖后必须评估体积并更新 `docs/TECH_DESIGN.md` 第 2.5 节的预算表。

**无障碍底线**

- 正文对比度 ≥ 7:1，辅助信息 ≥ 4.5:1，任何状态下不低于 4.5:1。
- 全站可键盘操作；弹窗/抽屉需焦点锁定 + Esc 关闭 + 关闭后焦点归位。
- 触摸目标 ≥ 44×44px。
- 所有动画必须遵循 `prefers-reduced-motion`。
- 输入框 `font-size ≥ 16px`（避免 iOS 聚焦缩放）。

---

## 8. 响应式与多端

1. 断点固定为 `480 / 768 / 1024 / 1280 / 1920`，**不要临时新增断点**。
2. 容器最大宽度 1200px，内边距 桌面 32px / 平板 24px / 移动 16px。
3. 高度用 `100dvh`，不使用 `100vh`。
4. 刘海屏相关区域使用 `env(safe-area-inset-*)`。
5. 内容宽度控制：正文 `max-width: 68ch`。
6. 依赖 `:hover` 传达的信息必须同时提供 `:focus` 或常驻展示（触摸设备没有 hover）。
7. 禁止用全局 `overflow-x: hidden` 掩盖横向滚动问题——它会破坏 sticky 定位。要找到真正溢出的元素。

---

## 9. 注意事项 / 禁止事项

### 9.1 明确不做的事（不要"顺手"加）

| 不要做 | 原因 |
| --- | --- |
| 新增后端接口（`app/api/**`） | v1 是纯静态站。**只有用户在当次任务中明确要求**某项动态能力时才可引入，并须同时更新两份文档 |
| 新增数据库、ORM、Supabase 客户端 | 同上，v1 无持久化层 |
| 做用户注册/登录/权限体系 | 产品非目标 |
| 做评论、点赞、阅读量统计 | 列入 v2，需用户明确要求 |
| 引入 CMS，或让后台改动影响前台内容 | 前台内容以 Git 中的 MDX 与 `src/config` 为准。`/admin` 是本地模拟（写浏览器存储），界面必须如实标注"只存在这台浏览器上"，不得让人以为已经发布到站点 |
| 给 `/admin` 加后端化的鉴权（换成真实登录、服务端会话） | 当前登录只是「挡住误入访客」的界面闸门，密钥明文在客户端产物里。要做真实鉴权必须先定后端方案，属于新需求 |
| 引入完整 UI 组件库（Ant Design、MUI、Chakra 等） | 与自有设计系统冲突，且体积不可接受 |
| 引入 CSS-in-JS 运行时 | 与 Tailwind + CSS 变量方案重复 |
| 引入 Three.js 或任何 3D 库 | 仅为星空不值得 |
| 自托管全量中文字体 | 单文件 3–10MB，会毁掉首屏 |
| 实现浅色主题 | 列为 v2；只保证 token 结构预留槽位 |
| 实现多语言 | 列为 v2；不要在组件里写 i18n 逻辑 |
| 做技能百分比的进度条 | 产品已明确用"熟练/熟悉/了解"三档（PRD F-041） |
| 重写整个文件来改一行 | 见 9.3 |

### 9.2 容易犯的错（写完自查）

| 陷阱 | 正确做法 |
| --- | --- |
| 在组件里写死域名 | 用 `NEXT_PUBLIC_SITE_URL` 拼 `canonical` / OG / sitemap |
| 把密钥写在 `NEXT_PUBLIC_` 变量里 | `NEXT_PUBLIC_` 会被编译进客户端产物，视为公开信息 |
| 用 `new Date()` 解析文章日期做排序 | 直接比较 `YYYY-MM-DD` 字符串 |
| 构建期使用 `Date.now()` / `Math.random()` | 会导致服务端与客户端渲染不一致 |
| 把整页标记 `'use client'` | 只把需要交互的最小节点标记为客户端组件 |
| 加了 `backdrop-filter` 到列表卡片 | 低端机昂贵，仅限导航、抽屉、正文遮罩 |
| 用 `!!` 做类型收窄 | 显式判空与类型守卫 |
| 直接 `fetch` 外部链接做校验 | CI 会偶发失败，外链检查只能告警不能阻断 |

### 9.3 关于 AI 协作本身

1. **改动要小且聚焦**。禁止在实现一个功能时顺带重构无关文件、调整全仓格式、升级依赖。发现无关问题请**指出**而不是**顺手改掉**。
2. **优先编辑而非重写**。能用局部替换完成的，不要整文件覆盖，否则会丢失既有注释与细节。
3. **不要发明不存在的 API、命令或文件路径**。不确定时先读 `docs/TECH_DESIGN.md` 与仓库实际内容，或直接说明不确定。
4. **不要编造验证结果**。没跑的命令说没跑，跑失败要贴出真实报错。
5. **改动内容或设计规范时同步更新文档**：改 frontmatter 字段 → 更新 `docs/TECH_DESIGN.md` 第 4 节与 `scripts/validate-content.ts`；改视觉规范 → 更新 `docs/PRD.md` 第 5 节与 `src/styles/tokens.css`；改目录结构 → 更新 `docs/TECH_DESIGN.md` 第 3 节。
6. **不确定用户意图时先问，不要猜着做**。尤其是涉及"是否引入后端/数据库/新依赖"这类不可逆决策。
7. 完成一项任务后，用一到两句话说明**改了什么、为什么、怎么验证的**，不要复述整份 diff。

### 9.4 环境与依赖

1. 包管理器统一使用 **pnpm**，禁止混用 npm/yarn 产生多份锁文件。
2. Node 版本以 `.nvmrc` / `package.json` 的 `engines` 为准，不要擅自升级。
3. 升级任何依赖前先说明理由与影响面；Next.js、React、Tailwind 的**大版本升级需要用户明确同意**。
4. 新增依赖后确认类型定义齐全（自带类型或 `@types/*`）。

---

## 10. 提交与 PR 规范

1. 一个 PR 只做一件事。内容更新与代码重构不要混在同一个 PR。
2. PR 描述必须包含：变更目的、影响范围、验证方式（跑了哪些命令）、是否有视觉变化（附截图或说明）。
3. **内容类改动**（`content/**`、`src/config/**`）走 `content:` 前缀，CI 只需过内容校验 + 构建。
4. **代码类改动**必须过完整 CI：内容校验 → 类型检查 → Lint → 单测 → 构建与体积断言 → E2E → Lighthouse CI。任何一项失败都不得合并。
5. PR 分支会自动生成 Preview 环境；视觉与响应式改动必须在 Preview 上**人工过一遍六个断点**，不要只看本地。
6. 合并前确认没有 `console.log`、调试用的注释代码、临时的 `TODO` 留在提交里。

---

## 11. 完成定义的补充说明

一个任务算"完成"，需要同时满足：

1. 功能与 PRD 中对应条目的描述一致（含边界情况与空状态）。
2. 第 3 节的验证命令全部通过，且真实运行过。
3. 第 6 节要求的测试已补齐并通过。
4. 第 7 节的性能与无障碍红线未被突破。
5. 六个断点下的表现符合预期（改动涉及布局时）。
6. 相关文档已同步更新（涉及规范、结构、数据模型时）。
7. 没有引入第 9.1 节禁止的内容。

---

## 12. 交付前自检清单

```text
[ ] 读过本文件，并确认任务不违反第 9.1 节的禁止事项
[ ] pnpm typecheck 通过
[ ] pnpm lint 通过
[ ] 涉及 content/** 或 src/config/** → pnpm validate:content 通过
[ ] 涉及 src/lib/** → pnpm test 通过，且新增/更新了对应测试
[ ] 涉及布局/导航/星空/搜索/筛选 → pnpm test:e2e 通过
[ ] 涉及性能/图片/字体 → pnpm lhci 达标
[ ] 没有硬编码颜色、间距、时长；样式全部来自 token
[ ] 没有新增 any、没有 @ts-ignore、没有遗留 console.log
[ ] 交互元素有聚焦样式，动画遵循 prefers-reduced-motion
[ ] 六个断点下无横向滚动（改动涉及布局时已实际验证）
[ ] 首屏 JS 与新增依赖未突破预算
[ ] 未擅自引入后端、数据库、CMS、3D 库、中文字体
[ ] 改动涉及 /admin 时：数据访问全部经 src/api（未直接碰 localStorage），且界面已标注"本地模拟"
[ ] 相关文档已同步更新
[ ] 交付说明写清了"改了什么、为什么、怎么验证"
```

---

**遇到本文件未覆盖的情况**：优先保持与既有代码风格一致、与 PRD/TECH_DESIGN 的原则一致，并在交付说明中明确指出这是一次规范外的判断，供用户确认后补充进本文件。

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
