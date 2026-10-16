import { beforeEach, describe, expect, it } from 'vitest';
import { clearNamespace, ensureSchemaVersion, readJson, storageKey, writeJson } from '@/api/storage';

/**
 * 存储底座的结构版本行为。
 *
 * 这里锁定的是一个真实踩过的坑：`ensureSchemaVersion()` 在版本标记缺失或过期时会清空
 * 整个命名空间，而登录态也存在同一个命名空间里。结果是「登录 → 仪表盘读取数据 →
 * 版本校验顺手把会话删掉 → 刷新后掉线」，而且掉线发生在一次看不见的写入里，极难排查。
 *
 * 因此本文件的核心断言只有一句：**内容数据可以清，登录态不能清**。
 * 任何一次改动只要破坏它，这里立刻会红。
 *
 * 测试环境是 node，没有 localStorage，所以在每个用例前装一个内存实现。
 * storage.ts 只在函数体内通过 globalThis 取后端，因此这个替身是有效的。
 */

const SESSION_KEY = storageKey('session');
const VERSION_KEY = storageKey('__version');

function createMemoryStorage(): Storage {
  const map = new Map<string, string>();

  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key: string) {
      return map.get(key) ?? null;
    },
    key(index: number) {
      return [...map.keys()][index] ?? null;
    },
    removeItem(key: string) {
      map.delete(key);
    },
    setItem(key: string, value: string) {
      map.set(key, value);
    },
  } as unknown as Storage;
}

/** 直接读原始键，绕开 storage.ts 的封装，避免用自己的逻辑验证自己 */
function readRaw(key: string): string | null {
  return (globalThis as unknown as { localStorage: Storage }).localStorage.getItem(key);
}

beforeEach(() => {
  (globalThis as unknown as { localStorage: Storage }).localStorage = createMemoryStorage();
});

describe('ensureSchemaVersion', () => {
  it('首次校验时写入版本标记，并保留此时已经存在的登录态', () => {
    writeJson('session', { email: 'admin@starfolio.dev' });

    expect(ensureSchemaVersion()).toBe(true);

    expect(readRaw(VERSION_KEY)).toBe('1');
    // 登录先于第一次数据读取发生，此时版本标记还不存在 —— 这条最容易被漏掉
    expect(readJson('session', null)).toEqual({ email: 'admin@starfolio.dev' });
  });

  it('版本标记已是最新时不重复清空，登录态与内容数据都还在', () => {
    ensureSchemaVersion();
    writeJson('session', { email: 'admin@starfolio.dev' });
    writeJson('projects', [{ id: 'p1' }]);

    expect(ensureSchemaVersion()).toBe(false);

    expect(readJson('session', null)).toEqual({ email: 'admin@starfolio.dev' });
    expect(readJson('projects', [])).toEqual([{ id: 'p1' }]);
  });

  it('结构版本过期时清空内容数据，但仍保留登录态', () => {
    writeJson('__version', '__stale__');
    writeJson('session', { email: 'admin@starfolio.dev' });
    writeJson('profile', { name: '你的名字' });

    expect(ensureSchemaVersion()).toBe(true);

    // 内容数据是模拟出来的，可以重建，清掉是对的
    expect(readJson('profile', null)).toBeNull();
    // 但把用户踢下线不是「重建」能解释的行为
    expect(readJson('session', null)).toEqual({ email: 'admin@starfolio.dev' });
    expect(readRaw(VERSION_KEY)).toBe('1');
  });
});

describe('clearNamespace', () => {
  it('清理内容数据与版本标记，但不动登录态', () => {
    writeJson('session', { email: 'admin@starfolio.dev' });
    writeJson('projects', []);
    writeJson('__version', '1');

    clearNamespace();

    expect(readRaw(SESSION_KEY)).not.toBeNull();
    expect(readRaw(storageKey('projects'))).toBeNull();
    expect(readRaw(VERSION_KEY)).toBeNull();
  });

  it('不会误伤同域其他应用的键', () => {
    const storage = (globalThis as unknown as { localStorage: Storage }).localStorage;
    storage.setItem('other-app:theme', 'dark');
    writeJson('projects', []);

    clearNamespace();

    expect(storage.getItem('other-app:theme')).toBe('dark');
  });
});
