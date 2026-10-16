import { ApiError } from './errors';
import { StorageError } from './storage';

/**
 * 模拟网络层 —— 这是整个接口层唯一的「替换点」。
 *
 * 现在所有资源方法都经由 request() 执行同步的 localStorage 操作；
 * 将来接入真实后端时，只需要把 request() 改成 fetch 调用（并让各资源方法保持同样的签名），
 * 页面与组件一行都不用动。这是本层存在的全部理由。
 *
 * 两个刻意的设计：
 *  1. **保持异步签名**：即使 localStorage 是同步的，也一律返回 Promise。
 *     否则将来换成真实网络请求时，所有调用点都要改（还会出现「本地能用、线上偶发 undefined」这类问题）。
 *  2. **保留一点模拟延迟**：让加载态、禁用态、重复提交在开发阶段就暴露出来，
 *     而不是等接了真后端才发现界面没处理 loading。
 */

/** 模拟延迟。取值很小，只用来让界面必须处理加载态，不影响手感 */
const SIMULATED_LATENCY_MS = 80;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * 所有资源方法的唯一出口。任何异常都会被归一成 ApiError，
 * 并保留可展示的中文消息（StorageError 的消息本身就是写给用户看的）。
 */
export async function request<T>(operation: () => T | Promise<T>): Promise<T> {
  await delay(SIMULATED_LATENCY_MS);

  try {
    return await operation();
  } catch (error) {
    if (error instanceof ApiError) throw error;

    if (error instanceof StorageError) {
      // 存储层的消息已经足够具体（隐私模式 / 配额满），直接透出
      throw new ApiError(error.message, error);
    }

    throw new ApiError('操作失败，请稍后重试。', error);
  }
}

/** 该接口层当前是否为本地模拟实现。界面据此提示「数据只存在这台浏览器上」 */
export const isMockImplementation = true;
