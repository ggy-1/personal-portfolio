import { request } from './client';
import { ensureSchemaVersion, readJson, removeResource, writeJson } from './storage';

/**
 * 单例资源的读写（个人信息、站点设置）。
 *
 * 与集合型资源的区别：整份数据就是一个对象，没有增删，只有「读取」与「整体保存」。
 * 因此不做字段级合并 —— 表单提交的就是完整对象，合并反而会掩盖「表单漏了某个字段」这类问题。
 */

export type SingletonResource<T> = {
  get: () => Promise<T>;
  save: (value: T) => Promise<T>;
  /** 恢复到初始数据 */
  reset: () => Promise<T>;
};

export function createSingleton<T>(options: {
  /** 存储键名，如 'profile' */
  resource: string;
  seed: T;
}): SingletonResource<T> {
  const { resource, seed } = options;

  function load(): T {
    ensureSchemaVersion();
    return readJson<T>(resource, seed);
  }

  return {
    async get() {
      return request(() => load());
    },

    async save(value) {
      return request(() => {
        ensureSchemaVersion();
        writeJson(resource, value);
        return value;
      });
    },

    async reset() {
      return request(() => {
        ensureSchemaVersion();
        // 先删再落种子：直接写种子会留下旧值里多余的键
        removeResource(resource);
        const restored = structuredClone(seed);
        writeJson(resource, restored);
        return restored;
      });
    },
  };
}
