/**
 * 全局错误上报（模拟）
 * 统一处理：console.error + ElMessage，便于生产环境替换为真实上报
 */
import { ElMessage } from 'element-plus';

/**
 * 上报并展示错误
 * @param err - 错误对象或字符串
 * @param source - 来源标识，如 'API' | 'Socket' | 'Cache'
 * @param userTip - 可选，给用户的提示文案；不传则用默认「操作失败，请重试」
 */
export function reportError(
  err: unknown,
  source: string,
  userTip?: string
): void {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`[${source}]`, err);
  ElMessage.error(userTip ?? '操作失败，请重试');
}
