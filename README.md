# personal-portfolio（工作名 starfolio）

单作者的个人展示网站：个人介绍、技能展示、项目作品集、技术博客。深色主题 + 星空背景。

**v1 是纯静态站**：没有后端、没有数据库。内容是仓库里的 `.mdx` 文件与 `src/config/*.ts`，
`next build` 把一切编译成静态产物。新增一篇博客 = 新增一个 `.mdx` 文件 + 一次 push。

站点带一个 `/admin` 后台（见下文「后台管理」）。它同样是纯客户端的：数据存在浏览器
`localStorage` 里，不引入后端、数据库或服务端会话，因此上面对静态站的描述依然成立。

设计与技术方案的完整依据见 [`docs/PRD.md`](docs/PRD.md) 与 [`docs/TECH_DESIGN.md`](docs/TECH_DESIGN.md)；
**在本仓库做任何改动前，先读 [`AGENTS.md`](AGENTS.md)**，它是执行层规范。

---

## 环境要求

| 项 | 要求 |
| --- | --- |
| Node.js | 24（见 `.nvmrc`；`package.json` 的 `engines` 下限为 20.9） |
| 包管理器 | **pnpm**。禁止混用 npm / yarn，否则会产生多份锁文件 |

```bash
nvm use            # 或 fnm use，读取 .nvmrc
corepack enable    # 让 pnpm 版本跟随 package.json 的 packageManager 字段
pnpm install
```

## 本地开发

```bash
cp .env.example .env.local   # Windows: copy .env.example .env.local
pnpm dev                     # http://localhost:3000
```

`.env.local` 中 `NEXT_PUBLIC_SITE_URL` 必须填写正确的站点地址：
canonical / sitemap / RSS / OG 图全部由它拼装，**代码里不硬编码域名**。
本地预览草稿文章时把 `CONTENT_INCLUDE_DRAFTS` 设为 `true`，生产环境必须为 `false`。

## 命令一览

| 命令 | 用途 |
| --- | --- |
| `pnpm dev` | 本地开发服务器 |
| `pnpm build` | 生产构建（先跑内容校验，再 `next build`） |
| `pnpm start` | 以生产模式启动已构建的产物 |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | ESLint |
| `pnpm validate:content` | 校验 frontmatter、图片路径、slug 引用 |
| `pnpm test` / `pnpm test:watch` | Vitest 单元测试 |
| `pnpm format` / `pnpm format:check` | Prettier 格式化 |
| `pnpm new:post` | 按模板生成新文章文件（不要手写空文件） |

**最小验证门槛**：任何改动交付前至少跑通 `pnpm typecheck && pnpm lint`；
涉及 `content/**` 或 `src/config/**` 跑 `pnpm validate:content`；涉及 `src/lib/**` 跑 `pnpm test`。

## 目录结构

```text
content/            # ★ 内容源（唯一数据源）：blog/*.mdx 与 projects/<slug>/index.mdx
public/             # 静态资源：图片、resume.pdf、favicon
scripts/            # 构建脚本：内容校验、新文章脚手架
src/
├─ app/             # 路由与页面编排。前台在 (site) 路由组，后台在 admin/，两者不共享布局
│  ├─ (site)/       # / /about /skills /projects /blog + rss.xml / sitemap / robots
│  └─ admin/        # /admin 后台：login / dashboard / profile / skills / projects / posts / settings
├─ api/             # 后台统一接口层（localStorage 模拟后端），页面唯一的取数入口
├─ components/      # 表现层：ui / layout / stars / blog / projects / mdx
├─ lib/             # 纯逻辑，无 React 依赖，可单测：content / seo / utils
├─ config/          # 站点数据：site / skills / timeline / theme / env
├─ styles/          # tokens.css（设计 token 的唯一来源）
├─ hooks/           # useReducedMotion 等
└─ types/           # 跨文件复用的类型
tests/unit/         # Vitest，覆盖 src/lib/** 与 src/api/storage.ts
docs/               # PRD 与 TECH_DESIGN
```

**依赖方向铁律**：`app → components → lib`，`config` 可被 app 与 components 使用。
反向引用一律禁止；`src/lib/**` 内不允许 import React。
后台页面取数一律经 `src/api/**`，不得直接读写 `localStorage`。

## 写内容

新增文章走脚手架，保证 frontmatter 结构一致：

```bash
pnpm new:post
pnpm validate:content   # 本地先跑，避免 CI 来回
```

必填字段缺失时构建会直接失败，并给出「文件名 + 字段名 + 期望格式」的报错。
新增标签前先搜索已有标签，避免 `React` / `react` / `React.js` 这类同义分裂。

## 后台管理（/admin）

后台用于管理个人信息、技能、项目与博客，路由统一挂在 `/admin` 下，与前台在路由层面完全隔离
（前台在 `(site)` 路由组，后台在 `admin/`）。侧边栏 + 顶栏是后台自己的一套布局，不复用前台 `NavBar`。

| 路由 | 用途 |
| --- | --- |
| `/admin/login` | 登录页（唯一带星空的页面） |
| `/admin` | 仪表盘：内容规模、草稿数、登录状态、重置演示数据 |
| `/admin/profile` | 个人信息：姓名、定位、自述、社交链接 |
| `/admin/skills` | 技能：按分类维护熟练度 |
| `/admin/projects` | 项目：frontmatter 字段与精选状态 |
| `/admin/posts` | 博客：元数据与发布状态、按状态筛选 |
| `/admin/settings` | 站点设置：地址、描述、OG 图、导航、每页条数 |

演示账号：`admin@starfolio.dev` / `starfolio`。

**这是本地模拟，不是后端。** 数据经 `src/api/**` 写入浏览器的 `localStorage`
（键前缀 `starfolio:admin:`），只存在这台浏览器上，也不会影响前台页面 ——
前台读的始终是仓库里的 `content/` 与 `src/config`。登录态同样存在 localStorage，
由客户端路由守卫拦截未登录访问（`localStorage` 只存在于浏览器，服务端渲染无法判断，
因此没有 middleware 或服务端重定向）。演示密码明文写在产物里，任何人都能绕过，
它的作用只是挡住误入的访客。

接入真实后端时，只需要把 `src/api/client.ts` 的 `request()` 换成 `fetch` 并让各资源方法保持
同样的签名，后台界面代码一行都不用动；随后删除 `src/api/index.ts` 里的演示账号与 `seed.ts`。

## 安全约定

**只渲染仓库内经过 review 的 MDX。** 这是 v1 的安全边界：MDX 是「可执行内容的 Markdown」，
一旦接受外部来源（投稿、CMS、运行时上传）就等同于允许任意代码执行。
MDX 中可用的组件由白名单（`src/components/mdx/mdxComponents.tsx`）控制，不在表内的标签不会渲染。

## 不做什么（v1 明确排除）

后端接口（`app/api/**`）、数据库与 ORM、用户体系、评论/点赞/阅读量、CMS、
完整 UI 组件库、CSS-in-JS 运行时、Three.js 等 3D 库、自托管全量中文字体、浅色主题、多语言。
这些要么是产品非目标，要么列入 v2 并需要明确的需求触发（判据见 `docs/TECH_DESIGN.md` 2.2.2）。

`/admin` 后台**不在排除之列**，但它的边界要说清：它是纯客户端的本地模拟，
没有服务端会话、没有真实鉴权、也不写前台内容。它让管理流程在无后端的前提下完整可跑，
同时把「将来换成真实后端」收敛到 `src/api` 这一个替换点。
