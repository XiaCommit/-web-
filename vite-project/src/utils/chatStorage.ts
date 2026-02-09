/**
 * 聊天缓存层
 * - localStorage: 会话基本信息（最后一条预览、未读数），不缓存消息内容
 * - localForage: 会话列表元数据、断线未发送队列（断线队列含 content 以便重试）
 */
import localforage from 'localforage';
import { reportError } from '@/utils/errorReport';
import type { SessionMeta, OfflineQueueItem } from '@/types/chat';

const LS_PREFIX = 'chat_session_';
const LF_SESSIONS = (uid: string) => `chat_sessions_${uid}`;
const LF_OFFLINE = (uid: string, pid: string) => `chat_offline_${uid}_${pid}`;
const EXPIRE_MS = 7 * 24 * 60 * 60 * 1000; // 7 天

// ---------------------------------------------------------------------------
// 会话基本信息（localStorage）
// ---------------------------------------------------------------------------
export function getSessionMeta(
  userId: string,
  partnerId: string
): SessionMeta | null {
  const raw = localStorage.getItem(LS_PREFIX + userId + '_' + partnerId);
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as SessionMeta;
    if (!v || typeof v.updatedAt !== 'number') return null;
    if (v.updatedAt < Date.now() - EXPIRE_MS) return null;
    return v;
  } catch {
    return null;
  }
}

export function setSessionMeta(
  userId: string,
  partnerId: string,
  meta: SessionMeta
): void {
  const payload = { ...meta, updatedAt: Date.now() };
  localStorage.setItem(
    LS_PREFIX + userId + '_' + partnerId,
    JSON.stringify(payload)
  );
}

// ---------------------------------------------------------------------------
// 会话列表元数据（localForage，不包含消息内容）
// ---------------------------------------------------------------------------
export async function getSessionList(
  userId: string
): Promise<Record<string, SessionMeta>> {
  const v = await localforage.getItem<Record<string, SessionMeta>>(
    LF_SESSIONS(userId)
  );
  return v || {};
}

export async function setSessionList(
  userId: string,
  list: Record<string, SessionMeta>
): Promise<void> {
  await localforage.setItem(LF_SESSIONS(userId), list);
}

/** 更新当前会话元数据，同时写入 localStorage 与 localForage 会话列表 */
export async function updateSessionMeta(
  userId: string,
  partnerId: string,
  meta: Partial<SessionMeta>
): Promise<void> {
  try {
    const full: SessionMeta = {
      lastMessagePreview: meta.lastMessagePreview ?? '',
      unreadCount: meta.unreadCount ?? 0,
      updatedAt: Date.now(),
    };
    setSessionMeta(userId, partnerId, full);
    const list = await getSessionList(userId);
    list[partnerId] = full;
    await setSessionList(userId, list);
  } catch (e) {
    reportError(e, 'Cache', '更新会话信息失败');
  }
}

// ---------------------------------------------------------------------------
// 断线未发送队列（localForage，含 content 以便重连重试）
// ---------------------------------------------------------------------------
export async function getOfflineQueue(
  userId: string,
  partnerId: string
): Promise<OfflineQueueItem[]> {
  try {
    const v = await localforage.getItem<{
      updatedAt: number;
      items: OfflineQueueItem[];
    }>(LF_OFFLINE(userId, partnerId));
    if (!v || !Array.isArray(v.items)) return [];
    return v.items;
  } catch (e) {
    reportError(e, 'Cache', '读取待发送队列失败');
    return [];
  }
}

export async function pushOfflineQueue(
  userId: string,
  partnerId: string,
  item: OfflineQueueItem
): Promise<void> {
  try {
    const key = LF_OFFLINE(userId, partnerId);
    const existing = await localforage.getItem<{
      updatedAt: number;
      items: OfflineQueueItem[];
    }>(key);
    const items = existing?.items ?? [];
    items.push(item);
    await localforage.setItem(key, { updatedAt: Date.now(), items });
  } catch (e) {
    reportError(e, 'Cache', '写入待发送队列失败');
    throw e; // 以便调用方可感知失败
  }
}

export async function clearOfflineQueue(
  userId: string,
  partnerId: string
): Promise<void> {
  try {
    await localforage.removeItem(LF_OFFLINE(userId, partnerId));
  } catch (e) {
    reportError(e, 'Cache', '清空待发送队列失败');
  }
}

// ---------------------------------------------------------------------------
// 清理过期缓存（页面卸载 / 切换会话时调用）
// ---------------------------------------------------------------------------
export async function cleanExpiredCache(): Promise<void> {
  try {
    const now = Date.now();
    const expire = now - EXPIRE_MS;

    const toDel: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(LS_PREFIX)) {
        try {
          const v = JSON.parse(localStorage.getItem(k)!) as { updatedAt?: number };
          if (v && typeof v.updatedAt === 'number' && v.updatedAt < expire) {
            toDel.push(k);
          }
        } catch {
          toDel.push(k);
        }
      }
    }
    toDel.forEach((k) => localStorage.removeItem(k));

    const keys = await localforage.keys();
    for (const k of keys) {
      if (k.startsWith('chat_sessions_')) {
        const v = await localforage.getItem<Record<string, SessionMeta>>(k);
        if (v) {
          const filtered: Record<string, SessionMeta> = {};
          for (const [p, m] of Object.entries(v)) {
            if (m && m.updatedAt >= expire) filtered[p] = m;
          }
          await localforage.setItem(k, filtered);
        }
      } else if (k.startsWith('chat_offline_')) {
        const v = await localforage.getItem<{ updatedAt: number }>(k);
        if (v && typeof v.updatedAt === 'number' && v.updatedAt < expire) {
          await localforage.removeItem(k);
        }
      }
    }
  } catch (e) {
    reportError(e, 'Cache', '清理过期缓存失败');
  }
}
