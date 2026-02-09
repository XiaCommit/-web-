/**
 * XSS 防护：转义 HTML 特殊字符，渲染消息时强制过滤
 */
const HTML_ESCAPE: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

const HTML_ESCAPE_RE = /[&<>"']/g;

/**
 * 将字符串中的 HTML 特殊字符转义，防止 XSS
 */
export function escapeHtml(str: string): string {
  if (typeof str !== 'string') return '';
  return str.replace(HTML_ESCAPE_RE, (c) => HTML_ESCAPE[c] ?? c);
}
