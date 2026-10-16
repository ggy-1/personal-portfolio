import { ApiError, toErrorMessage } from './errors';
import { isMockImplementation, request } from './client';
import { createCollection, type Collection } from './collection';
import { createSingleton, type SingletonResource } from './singleton';
import { postsSeed, profileSeed, projectsSeed, settingsSeed, skillsSeed } from './seed';
import {
  SESSION_RESOURCE,
  isStorageAvailable,
  readJson,
  removeResource,
  storageKey,
  writeJson,
} from './storage';
import type {
  AdminPost,
  AdminProject,
  AdminSession,
  AdminSkill,
  DashboardStats,
  Profile,
  SiteSettings,
} from './types';

/**
 * 统一接口层 —— 界面唯一的取数入口。
 *
 * 为什么要有这一层（而不是让页面直接读写 localStorage）：
 *
 *  1. **一个替换点**：所有资源方法都经由 client.ts 的 request() 执行。
 *     将来接真实后端时，只改 request()（改成 fetch）并让方法保持同样的签名，
 *     页面与组件一行都不用动。
 *  2. **异步签名**：即使 localStorage 是同步的，也一律返回 Promise。
 *     否则换成真实网络请求时所有调用点都要改，还会出现「本地能用、线上偶发 undefined」。
 *  3. **与前台数据解耦**：前台是构建期的 MDX + src/config，后台写的是浏览器本地存储。
 *     两者刻意不共用同一份数据 —— 后台改完不会（也不该假装）自动影响静态产物。
 *     这条边界必须在界面上讲清楚，见各个页面的「本地模拟」提示。
 *
 * 替换真实后端的动作清单：改 client.ts 的 request → 删掉本文件里的 auth 演示账号与
 * seed.ts → 各资源方法改为对应 HTTP 调用。界面代码不需要改。
 */

/* ==================== 集合资源 ==================== */

const skills: Collection<AdminSkill> = createCollection<AdminSkill>({
  resource: 'skills',
  seed: skillsSeed,
});

const projects: Collection<AdminProject> = createCollection<AdminProject>({
  resource: 'projects',
  seed: projectsSeed,
});

const posts: Collection<AdminPost> = createCollection<AdminPost>({
  resource: 'posts',
  seed: postsSeed,
});

/* ==================== 单例资源 ==================== */

const profile: SingletonResource<Profile> = createSingleton<Profile>({
  resource: 'profile',
  seed: profileSeed,
});

const settings: SingletonResource<SiteSettings> = createSingleton<SiteSettings>({
  resource: 'settings',
  seed: settingsSeed,
});

/* ==================== 登录会话 ==================== */

/**
 * 'session' 的完整存储键；界面监听 storage 事件（跨标签页同步登录态）时用它比对。
 * 键名由 storage.ts 定义（它需要知道这个键在清空结构时被保留），这里只做换算。
 */
export const sessionStorageKey = storageKey(SESSION_RESOURCE);

/**
 * 演示账号 —— 只存在于本地模拟层。
 *
 * 这不是鉴权，只是一个「挡住误入访客」的界面闸门：真正的判断发生在浏览器里，
 * 密码也明文写在产物中，任何人都能绕过。接入真实后端时，本对象连同
 * api.auth 一并删除，改为向服务端换取会话票据。
 */
export const demoCredentials = {
  email: 'admin@starfolio.dev',
  password: 'starfolio',
};

const auth = {
  /** 读取当前会话；未登录返回 null（不抛错，未登录是正常状态） */
  async getSession(): Promise<AdminSession | null> {
    return request(() => readJson<AdminSession | null>(SESSION_RESOURCE, null));
  },

  /** 登录成功后把会话写入本地存储 */
  async login(email: string, password: string): Promise<AdminSession> {
    return request(() => {
      const normalized = email.trim().toLowerCase();
      if (normalized !== demoCredentials.email || password !== demoCredentials.password) {
        throw new ApiError('邮箱或密码不正确。演示账号见登录页下方提示。');
      }

      const session: AdminSession = { email: normalized, loginAt: new Date().toISOString() };
      writeJson(SESSION_RESOURCE, session);
      return session;
    });
  },

  async logout(): Promise<void> {
    await request(() => {
      removeResource(SESSION_RESOURCE);
    });
  },

  /**
   * 该 storage 事件是否与登录态有关。
   * key 为 null 表示「存储被整体清空」（clear()），同样需要重新读取会话。
   */
  isSessionEvent(event: StorageEvent): boolean {
    return event.key === null || event.key === sessionStorageKey;
  },
};

/* ==================== 仪表盘聚合 ==================== */

const dashboard = {
  /** 一次取回仪表盘需要的全部计数，避免页面里串起四次请求 */
  async stats(): Promise<DashboardStats> {
    const [allPosts, allProjects, allSkills, session] = await Promise.all([
      posts.list(),
      projects.list(),
      skills.list(),
      auth.getSession(),
    ]);

    // 日期是 YYYY-MM-DD 字符串，直接按字符串排序即可，不做 Date 解析（TECH_DESIGN T14）
    const latestDate = allPosts.map((post) => post.date).sort().at(-1) ?? null;

    return {
      posts: {
        total: allPosts.length,
        drafts: allPosts.filter((post) => post.draft).length,
        latestDate,
      },
      projects: {
        total: allProjects.length,
        featured: allProjects.filter((project) => project.featured).length,
      },
      skills: { total: allSkills.length },
      session,
    };
  },
};

/* ==================== 汇总出口 ==================== */

export const api = {
  auth,
  profile,
  settings,
  skills,
  projects,
  posts,
  dashboard,

  /** 把全部资源恢复成 seed 初始值（后台「重置演示数据」用） */
  async resetAll(): Promise<void> {
    await Promise.all([
      profile.reset(),
      settings.reset(),
      skills.reset(),
      projects.reset(),
      posts.reset(),
    ]);
  },
};

export { isMockImplementation, isStorageAvailable, toErrorMessage };
export type {
  AdminPost,
  AdminProject,
  AdminSession,
  AdminSkill,
  DashboardStats,
  Profile,
  SiteSettings,
};
