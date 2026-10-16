/**
 * localStorage 读写封装 —— 模拟实现的存储底座。
 *
 * 三件必须处理好的事，缺一不可：
 *  1. **服务端安全**：本文件会被客户端组件引用，而 Next 在构建期也会求值这些模块。
 *     因此所有访问都发生在函数体内、并且先取 `globalThis.localStorage` 兜底，
 *     绝不在模块顶层碰浏览器 API（否则构建直接失败）。
 *  2. **不可用时的降级**：用户禁用 Cookie / 隐私模式 / 配额写满都会让 localStorage 抛异常。
 *     这里统一收敛成 StorageError，由上层给出可读提示，而不是让页面白屏。
 *  3. **命名空间**：所有键都带 `starfolio:admin:` 前缀，避免与同域其他脚本互相覆盖。
 */

const NAMESPACE = 'starfolio:admin';
const VERSION_RESOURCE = '__version';

/**
 * 数据结构版本。v1.5 没有迁移逻辑：版本不一致时直接清空内容数据（保留登录态，见 clearNamespace）。
 * 这是刻意选择的——模拟数据是可以重建的，半套旧结构反而会让人查半天。
 */
const SCHEMA_VERSION = '1';

/** 登录态的资源名。必须在 clearNamespace 里被保留，因此写在本文件中并导出给接口层使用 */
export const SESSION_RESOURCE = 'session';

/** 配额写满等存储故障。与「数据不存在」是两件事，不能混为一谈 */
export class StorageError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'StorageError';
    this.cause = cause;
  }
}

export function storageKey(resource: string): string {
  return `${NAMESPACE}:${resource}`;
}

/**
 * 取存储后端。取不到返回 null，由调用方决定是降级还是报错。
 * 用 try 包住：Safari 隐私模式下仅仅访问 localStorage 属性就会抛异常。
 */
function backend(): Storage | null {
  try {
    return (globalThis as unknown as { localStorage?: Storage }).localStorage ?? null;
  } catch {
    return null;
  }
}

export function isStorageAvailable(): boolean {
  const store = backend();
  if (!store) return false;
  try {
    // 只探测可写性：存在但只读（配额满）同样等于不可用
    const probe = `${NAMESPACE}:__probe`;
    store.setItem(probe, '1');
    store.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

/** 环境不可用时抛出统一错误，供上层转成可展示文案 */
function requireBackend(): Storage {
  const store = backend();
  if (!store) {
    throw new StorageError(
      '当前浏览器无法使用本地存储（可能处于隐私模式或已禁用 Cookie）。后台数据依赖本地存储，请调整浏览器设置后重试。',
    );
  }
  return store;
}

/** 深拷贝，避免调用方改到常量种子数据或缓存对象 */
function clone<T>(value: T): T {
  return structuredClone(value);
}

/**
 * 读取并反序列化。三种情况都回退到 fallback 而不是抛错：
 * 键不存在（正常）、JSON 损坏（可能被手动改过）、结构不是预期类型（同上）。
 * 之所以不抛错：一个坏掉的键不该让整个后台打不开。
 */
export function readJson<T>(resource: string, fallback: T): T {
  const store = backend();
  if (!store) return clone(fallback);

  let raw: string | null;
  try {
    raw = store.getItem(storageKey(resource));
  } catch (error) {
    throw new StorageError('读取本地存储失败。', error);
  }

  if (raw === null) return clone(fallback);

  try {
    return JSON.parse(raw) as T;
  } catch {
    return clone(fallback);
  }
}

export function writeJson(resource: string, value: unknown): void {
  const store = requireBackend();
  try {
    store.setItem(storageKey(resource), JSON.stringify(value));
  } catch (error) {
    // 配额超限会在这里抛出 QuotaExceededError
    throw new StorageError('写入本地存储失败，可能是浏览器存储空间已满。', error);
  }
}

export function removeResource(resource: string): void {
  const store = backend();
  if (!store) return;
  try {
    store.removeItem(storageKey(resource));
  } catch (error) {
    throw new StorageError('清除本地存储失败。', error);
  }
}

/** 列出本命名空间下的所有键，供「重置后台数据」使用 */
function namespacedKeys(store: Storage): string[] {
  const keys: string[] = [];
  for (let index = 0; index < store.length; index += 1) {
    const key = store.key(index);
    // 注意：前缀带冒号，避免误伤 starfolio:adminXxx 这类巧合命名
    if (key && key.startsWith(`${NAMESPACE}:`)) keys.push(key);
  }
  return keys;
}

/**
 * 版本清空时必须保留的键。
 *
 * 登录态是凭证，不是内容数据：内容结构变了可以重建，但把用户无声无息地踢下线，
 * 表现出来是「刚登录、刷新一下就掉线」——极难定位。这里把它排除在清空之外，
 * 是为了让「清空内容数据」这件事永远不会误伤会话。
 *
 * 注意：首次使用时版本标记还不存在，此时 ensureSchemaVersion 同样会走清空分支，
 * 而登录态可能已经写入（先登录、后触发第一次数据读取）。所以这不是一个仅为
 * 版本升级准备的保险，而是每次清空都必须成立的约束。
 */
const PRESERVED_KEYS: readonly string[] = [storageKey(SESSION_RESOURCE)];

/** 清空本命名空间下的内容数据（含版本标记，但保留 PRESERVED_KEYS） */
export function clearNamespace(): void {
  const store = backend();
  if (!store) return;
  try {
    for (const key of namespacedKeys(store)) {
      if (PRESERVED_KEYS.includes(key)) continue;
      store.removeItem(key);
    }
  } catch (error) {
    throw new StorageError('清空本地存储失败。', error);
  }
}

/**
 * 版本校验。返回 true 表示本次调用清空了旧版本数据（调用方通常需要重新播种）。
 * 在每次读写集合之前调用，成本是一次 getItem。
 */
export function ensureSchemaVersion(): boolean {
  const store = backend();
  if (!store) return false;

  let current: string | null;
  try {
    current = store.getItem(storageKey(VERSION_RESOURCE));
  } catch (error) {
    throw new StorageError('读取本地存储版本失败。', error);
  }

  if (current === SCHEMA_VERSION) return false;

  clearNamespace();
  const next = requireBackend();
  try {
    next.setItem(storageKey(VERSION_RESOURCE), SCHEMA_VERSION);
  } catch (error) {
    throw new StorageError('写入本地存储版本失败。', error);
  }
  return true;
}
