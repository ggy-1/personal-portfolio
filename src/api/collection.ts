import { request } from './client';
import type { WithId } from './types';
import { ensureSchemaVersion, readJson, writeJson } from './storage';

/**
 * 集合型资源的通用 CRUD。
 *
 * 为什么用工厂而不是给每个资源写一遍：四个资源的读写逻辑完全相同，
 * 差别只有「存到哪个键」和「初始数据是什么」。重复四遍只会让四处都有机会写错。
 *
 * 关于主键：内容文件里 slug 就是身份，但列表编辑需要一个稳定的数组定位符，
 * 也更贴近将来真实后端的主键（uuid）。slug 仍然保留并参与唯一性校验。
 */

/** 生成主键。crypto.randomUUID 在浏览器与 Node 18+ 都可用 */
function generateId(): string {
  const cryptoRef = (globalThis as unknown as { crypto?: Crypto }).crypto;
  if (cryptoRef?.randomUUID) return cryptoRef.randomUUID();

  // 兜底：不追求密码学强度，只要在本机唯一即可
  return `id-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}

export type Collection<T extends { id: string }> = {
  list: () => Promise<T[]>;
  get: (id: string) => Promise<T | null>;
  create: (input: Omit<T, 'id'>) => Promise<T>;
  update: (id: string, input: Omit<T, 'id'>) => Promise<T>;
  remove: (id: string) => Promise<void>;
  reset: () => Promise<void>;
};

export function createCollection<T extends WithId<unknown>>(options: {
  /** 存储键名，如 'projects' */
  resource: string;
  /** 首次使用时的初始数据（会被深拷贝，调用方后续改动不会污染它） */
  seed: readonly T[];
}): Collection<T> {
  const { resource, seed } = options;

  function load(): T[] {
    ensureSchemaVersion();
    return readJson<T[]>(resource, seed as unknown as T[]);
  }

  function save(items: T[]): void {
    writeJson(resource, items);
  }

  return {
    async list() {
      return request(() => load());
    },

    async get(id) {
      return request(() => load().find((item) => item.id === id) ?? null);
    },

    async create(input) {
      return request(() => {
        const items = load();
        const created = { ...input, id: generateId() } as T;
        // 新建的排在最前：后台列表按「最近改动」浏览更符合直觉
        save([created, ...items]);
        return created;
      });
    },

    async update(id, input) {
      return request(() => {
        const items = load();
        const index = items.findIndex((item) => item.id === id);
        if (index === -1) throw new Error('这条记录已不存在，可能已在其他标签页被删除。');

        const updated = { ...input, id } as T;
        const next = [...items];
        next[index] = updated;
        save(next);
        return updated;
      });
    },

    async remove(id) {
      await request(() => {
        const items = load();
        const next = items.filter((item) => item.id !== id);
        if (next.length === items.length) {
          throw new Error('这条记录已不存在，可能已在其他标签页被删除。');
        }
        save(next);
      });
    },

    /** 恢复到初始数据（后台「重置」用） */
    async reset() {
      await request(() => {
        ensureSchemaVersion();
        save(structuredClone(seed as unknown as T[]));
      });
    },
  };
}
