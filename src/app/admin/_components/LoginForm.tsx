'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api, demoCredentials } from '@/api';
import { Button } from '@/components/ui/Button';
import { useSubmit } from '../_hooks/useSubmit';
import { InlineNotice } from './Feedback';
import { TextInput } from './Field';

/**
 * 登录表单。
 *
 * 这是本地模拟层的一部分，不是真实鉴权：账号密码写在 src/api/index.ts 里，
 * 判断发生在浏览器中，任何人打开 DevTools 都能绕过。它的作用只是
 * 「不让误入的访客直接看到后台界面」以及让整个后台流程完整可演示。
 * 接入真实后端时，这个组件只需要把 api.auth.login 换成真实请求，其余不动。
 */
export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  /**
   * 只接受以 /admin 开头的 next：否则 ?next=https://evil.example 会变成一个
   * 从本站跳出去的开放重定向。登录页尤其要注意这个 —— 攻击者最常利用的就是它。
   */
  const requested = searchParams.get('next');
  const next = requested && requested.startsWith('/admin') ? requested : '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { saving, feedback, submit, clearFeedback } = useSubmit();

  // 已经登录过就直接进去，不再要求重新输一遍密码
  useEffect(() => {
    let active = true;

    void (async () => {
      const session = await api.auth.getSession();
      if (active && session) router.replace(next);
    })();

    return () => {
      active = false;
    };
  }, [next, router]);

  function handleLogin() {
    void submit(async () => {
      await api.auth.login(email, password);
      router.replace(next);
    }, '登录成功，正在进入后台…');
  }

  function fillDemoCredentials() {
    setEmail(demoCredentials.email);
    setPassword(demoCredentials.password);
    clearFeedback();
  }

  return (
    <div className="w-full max-w-md rounded-xl border border-line bg-surface/90 p-6 backdrop-blur-md md:p-8">
      <h1 className="text-xl font-semibold text-fg">登录后台</h1>
      <p className="mt-2 text-sm text-fg-muted">
        管理个人信息、技能、项目与博客。登录态保存在这台浏览器上。
      </p>

      <form
        className="mt-6 flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!saving) handleLogin();
        }}
      >
        <TextInput
          label="邮箱"
          type="email"
          value={email}
          onChange={(value) => {
            setEmail(value);
            clearFeedback();
          }}
          autoComplete="username"
          placeholder={demoCredentials.email}
        />

        <TextInput
          label="密码"
          type="password"
          value={password}
          onChange={(value) => {
            setPassword(value);
            clearFeedback();
          }}
          autoComplete="current-password"
          placeholder="演示密码"
        />

        {feedback ? (
          <p
            role={feedback.kind === 'error' ? 'alert' : 'status'}
            className={
              feedback.kind === 'error'
                ? 'rounded-md border border-danger/50 bg-danger/10 px-3 py-2 text-sm text-danger'
                : 'rounded-md border border-success/50 bg-success/10 px-3 py-2 text-sm text-success'
            }
          >
            {feedback.message}
          </p>
        ) : null}

        <Button type="submit" variant="primary" size="lg" icon="lock" disabled={saving}>
          {saving ? '登录中…' : '登录'}
        </Button>
      </form>

      <div className="mt-6">
        <InlineNotice tone="warning">
          <p className="font-medium text-fg">这是演示账号，不是真实鉴权</p>
          <p className="mt-1">
            账号 <code className="text-fg">{demoCredentials.email}</code>，密码{' '}
            <code className="text-fg">{demoCredentials.password}</code>。
            读写的数据只存在这台浏览器的 localStorage 里，不会上传，也不会影响前台页面。
          </p>
          <Button
            variant="secondary"
            icon="lock"
            className="mt-3"
            onClick={fillDemoCredentials}
            disabled={saving}
          >
            填入演示账号
          </Button>
        </InlineNotice>
      </div>
    </div>
  );
}
