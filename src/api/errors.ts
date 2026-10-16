/**
 * 接口层的错误类型。
 *
 * 为什么要单独一个错误类：界面需要区分「网络/后端不可用」与「校验失败」两类情况，
 * 而 v1.5 的模拟实现只可能是前者或未知异常。把类型收窄到一处，
 * 将来换成真实后端时（fetch 会抛 TypeError、HTTP 会抛状态码）界面代码不用改。
 */
export class ApiError extends Error {
  /** 原始错误，便于在控制台定位，不面向访客展示 */
  readonly cause: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.cause = cause;
  }
}

/** 把任意抛出物归一成可展示的中文消息，避免界面出现 "undefined" 或英文堆栈 */
export function toErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return '发生了未知错误，请稍后重试。';
}
