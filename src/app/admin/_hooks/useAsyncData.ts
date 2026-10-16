'use client';

import { useCallback, useEffect, useState } from 'react';
import { toErrorMessage } from '@/api';

/**
 * 异步取数的统一封装。
 *
 * 为什么需要它：后台每个页面都要「加载 → 渲染 / 报错 → 保存后刷新」这一套，
 * 各自手写一遍就会各自漏掉取消、漏掉错误归一。
 *
 * 两个必须遵守的约束：
 *
 *  1. **loader 必须是引用稳定的函数**（模块级对象上的方法，或 useCallback 包过的函数）。
 *     它出现在 useEffect 的依赖里，每次渲染都变的话会无限循环。
 *     本项目的 loader 全部来自 src/api 的模块级单例（如 api.projects.list），天然稳定。
 *
 *  2. **只在 await 之后 setState**。在 effect 里同步 setState 会触发级联渲染，
 *     被 react-hooks/set-state-in-effect 判为错误（见下）。因此「加载中」是 useState
 *     的初值，而不是 effect 里再写一次。
 *
 * reload() 刻意不把状态重置回 loading：刷新时保留旧数据、避免列表闪一下空白。
 * 所以它只能在事件处理器里调用（那里可以同步 setState）。
 */
export type AsyncDataStatus = 'loading' | 'ready' | 'error';

export type AsyncDataResult<T> = {
  data: T | null;
  error: string | null;
  status: AsyncDataStatus;
  /** 重新执行 loader；在保存 / 删除之后调用 */
  reload: () => void;
};

type AsyncDataState<T> = {
  data: T | null;
  error: string | null;
  status: AsyncDataStatus;
};

export function useAsyncData<T>(load: () => Promise<T>): AsyncDataResult<T> {
  const [state, setState] = useState<AsyncDataState<T>>({
    data: null,
    error: null,
    status: 'loading',
  });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    // 组件卸载（或依赖变化）后不再写入状态，避免「已消失的页面」被更新
    let active = true;

    void (async () => {
      try {
        const data = await load();
        if (active) setState({ data, error: null, status: 'ready' });
      } catch (error) {
        if (active) setState({ data: null, error: toErrorMessage(error), status: 'error' });
      }
    })();

    return () => {
      active = false;
    };
  }, [load, version]);

  const reload = useCallback(() => {
    setVersion((current) => current + 1);
  }, []);

  return { ...state, reload };
}
