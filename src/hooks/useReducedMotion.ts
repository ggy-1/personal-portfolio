'use client';

import { useSyncExternalStore } from 'react';

/**
 * 是否开启「减少动态效果」（AGENTS.md 4.3 第 4 条）。
 *
 * 用 useSyncExternalStore 而不是「useState + 在 effect 里 setState」：
 * 后者会在挂载后再触发一次渲染（级联渲染，eslint 的 react-hooks/set-state-in-effect 会拦截），
 * 而这里的结果在首帧就决定星空是否动画，晚一帧就会出现「先动画一帧再静止」的突兀感。
 *
 * 服务端没有 matchMedia，服务端快照固定返回 false：
 * 服务端与首次客户端渲染都用 false，因此不会产生水合不一致；真实值在订阅生效后同步。
 */

const QUERY = '(prefers-reduced-motion: reduce)';

/** 缓存 MediaQueryList：getSnapshot 会被频繁调用，每次新建对象只是白白增加开销 */
let cachedQuery: MediaQueryList | null = null;

function getMediaQuery(): MediaQueryList {
  cachedQuery ??= window.matchMedia(QUERY);
  return cachedQuery;
}

function subscribe(onStoreChange: () => void): () => void {
  const query = getMediaQuery();
  query.addEventListener('change', onStoreChange);
  return () => query.removeEventListener('change', onStoreChange);
}

function getSnapshot(): boolean {
  return getMediaQuery().matches;
}

function getServerSnapshot(): boolean {
  return false;
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
