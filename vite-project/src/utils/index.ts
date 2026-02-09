/**
 * 通用工具：防抖、节流等，全局复用
 */

/**
 * 防抖：在 wait 毫秒内多次调用只执行最后一次
 * @param func - 待防抖函数
 * @param wait - 等待毫秒数
 * @returns 带 cancel 方法的防抖函数
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): T & { cancel?: () => void } {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  const debounced = function (this: unknown, ...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(this, args);
    }, wait);
  } as T & { cancel?: () => void };

  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };

  return debounced;
}

/**
 * 节流：在 wait 毫秒内最多执行一次
 * @param func - 待节流函数
 * @param wait - 间隔毫秒数
 * @returns 节流后的函数
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let last = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;

  return function (this: unknown, ...args: Parameters<T>) {
    const now = Date.now();
    const remain = wait - (now - last);
    if (remain <= 0 || remain > wait) {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      last = now;
      func.apply(this, args);
    } else if (!timer) {
      timer = setTimeout(() => {
        last = Date.now();
        timer = null;
        func.apply(this, args);
      }, remain);
    }
  };
}
