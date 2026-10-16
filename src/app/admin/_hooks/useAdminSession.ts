'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/api';
import type { AdminSession } from '@/api/types';

/**
 * 登录态。
 *
 * 三种状态而不是「有没有 session」两个值：首帧必须区分「还不知道」与「确定没登录」，
 * 否则会在检查完成前就把访客弹到登录页（刷新 /admin 时尤其明显）。
 *
 * 首帧固定为 checking —— 服务端没有 localStorage，服务端渲染与首次客户端渲染
 * 都是 checking，因此不存在水合不一致；真实状态在异步读取完成后写入。
 */
export type AdminSessionState =
  | { status: 'checking'; session: null }
  | { status: 'authenticated'; session: AdminSession }
  | { status: 'anonymous'; session: null };

export type AdminSessionResult = {
  state: AdminSessionState;
  /** 退出登录：清掉本地会话并把状态置为未登录，由外壳负责跳转 */
  signOut: () => Promise<void>;
};

export function useAdminSession(): AdminSessionResult {
  const [state, setState] = useState<AdminSessionState>({ status: 'checking', session: null });

  const applySession = useCallback((session: AdminSession | null) => {
    setState(
      session ? { status: 'authenticated', session } : { status: 'anonymous', session: null },
    );
  }, []);

  useEffect(() => {
    let active = true;

    void (async () => {
      const session = await api.auth.getSession();
      // setState 在 await 之后，不在 effect 体内同步调用
      if (active) applySession(session);
    })();

    return () => {
      active = false;
    };
  }, [applySession]);

  /**
   * 跨标签页同步：在另一个标签页退出登录后，本页也要跟着退出。
   * 用不上的话最多是多读一次存储，成本可以忽略；漏掉的后果是「一个窗口退出了、
   * 另一个窗口还显示着后台界面」这种让人怀疑数据到底存没存的状态。
   */
  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (!api.auth.isSessionEvent(event)) return;

      void (async () => {
        applySession(await api.auth.getSession());
      })();
    }

    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, [applySession]);

  const signOut = useCallback(async () => {
    await api.auth.logout();
    applySession(null);
  }, [applySession]);

  return { state, signOut };
}
