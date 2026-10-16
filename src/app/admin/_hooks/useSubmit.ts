'use client';

import { useCallback, useState } from 'react';
import { toErrorMessage } from '@/api';

/**
 * 提交状态：一次「保存」涉及三件事——按钮进入 loading、成功提示、失败提示。
 * 三个页面各自写一遍必然会漏掉其中一项，因此收敛到这里。
 *
 * 只在事件处理器里调用（那里允许同步 setState），不放在 effect 中。
 */
export type SubmitFeedback = { kind: 'success' | 'error'; message: string };

export type SubmitResult = {
  saving: boolean;
  feedback: SubmitFeedback | null;
  /** action 抛错时自动转成可展示的中文提示，不需要调用方 try/catch */
  submit: (action: () => Promise<void>, successMessage: string) => Promise<void>;
  clearFeedback: () => void;
};

export function useSubmit(): SubmitResult {
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<SubmitFeedback | null>(null);

  const submit = useCallback(async (action: () => Promise<void>, successMessage: string) => {
    setSaving(true);
    setFeedback(null);

    try {
      await action();
      setFeedback({ kind: 'success', message: successMessage });
    } catch (error) {
      setFeedback({ kind: 'error', message: toErrorMessage(error) });
    } finally {
      setSaving(false);
    }
  }, []);

  const clearFeedback = useCallback(() => {
    setFeedback(null);
  }, []);

  return { saving, feedback, submit, clearFeedback };
}
