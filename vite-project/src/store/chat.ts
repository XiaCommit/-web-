import { defineStore } from 'pinia';
import { produce } from 'immer';
import { io, Socket } from 'socket.io-client';
import { ElMessage } from 'element-plus';
import { getMessageApi } from '@/api/message';
import { useUserStore } from '@/store/user';
import {
  updateSessionMeta,
  getOfflineQueue,
  pushOfflineQueue,
  clearOfflineQueue,
  cleanExpiredCache,
} from '@/utils/chatStorage';
import { reportError } from '@/utils/errorReport';
import type {
  ChatMessage,
  ChatMessageItem,
  TempChatMessage,
  ConnectStatus,
} from '@/types/chat';

// ---------------------------------------------------------------------------
// 常量
// ---------------------------------------------------------------------------
const PAGE_SIZE_DEFAULT = 20;
const SEND_TIMEOUT_MS = 5000;
const RECONNECT_DELAY = 1000;
const RECONNECT_DELAY_MAX = 8000; // 1s→2s→4s→8s 指数退避
const RECONNECT_ATTEMPTS = 10;

// ---------------------------------------------------------------------------
// 纯工具函数
// ---------------------------------------------------------------------------
function getTimestamp(ts: string | Date): number {
  try {
    const d = typeof ts === 'string' ? new Date(ts) : ts;
    const t = d.getTime();
    return isNaN(t) ? 0 : t;
  } catch {
    return 0;
  }
}

/** 消息唯一键：优先 sequenceId → _id → _tempId → 兜底 */
function getMessageKey(m: ChatMessageItem): string {
  const t = m as TempChatMessage;
  if (t._tempId) return t._tempId;
  if (m.sequenceId != null) return `seq_${m.sequenceId}`;
  if (m._id) return m._id;
  return `t_${String(m.content).slice(0, 20)}-${String(m.from)}-${getTimestamp(m.timestamp)}`;
}

/** 按 sequenceId 升序、其次 timestamp；无 sequenceId 视为 Infinity 排到末尾 */
function sortBySequenceIdAndTimestamp(
  list: ChatMessageItem[]
): ChatMessageItem[] {
  return [...list].sort((a, b) => {
    const sa = a.sequenceId ?? Infinity;
    const sb = b.sequenceId ?? Infinity;
    if (sa !== sb) return sa - sb;
    return getTimestamp(a.timestamp) - getTimestamp(b.timestamp);
  });
}

function deduplicateMessages(
  oldList: ChatMessageItem[],
  newList: ChatMessageItem[]
): ChatMessageItem[] {
  const map = new Map<string, ChatMessageItem>();
  // 加载更多时，newList 是更旧的消息，应该放在前面
  // 所以先遍历 newList，再遍历 oldList，确保更旧的消息在前面
  [...newList, ...oldList].forEach((msg) => {
    if (!msg?.content) return;
    const key = getMessageKey(msg);
    if (!map.has(key)) {
      map.set(key, msg);
    } else {
      // 去重策略：优先保留有 _id 的消息（更完整）
      const existing = map.get(key)!;
      // 如果新消息有 _id 而旧消息没有，则更新
      if (msg._id && !existing._id) {
        map.set(key, msg);
      }
      // 如果两个都有 _id，保留 sequenceId 更大的（更新的）
      else if (msg._id && existing._id) {
        const msgSeq = msg.sequenceId ?? 0;
        const existSeq = existing.sequenceId ?? 0;
        if (msgSeq > existSeq) {
          map.set(key, msg);
        }
      }
      // 如果两个都没有 _id，保留 sequenceId 更大的（更新的）
      else if (!msg._id && !existing._id) {
        const msgSeq = msg.sequenceId ?? 0;
        const existSeq = existing.sequenceId ?? 0;
        if (msgSeq > existSeq) {
          map.set(key, msg);
        }
      }
    }
  });
  // 排序确保顺序正确：sequenceId 小的（旧的）在前，大的（新的）在后
  return sortBySequenceIdAndTimestamp(Array.from(map.values()));
}

// ---------------------------------------------------------------------------
// PendingRecord（内存）
// ---------------------------------------------------------------------------
interface PendingRecord {
  tempId: string;
  content: string;
  timestamp: string;
  timeoutId: number;
}

export const useChatStore = defineStore('chat', {
  state: () => ({
    messageList: [] as ChatMessageItem[],
    currentSessionId: '' as string,
    connectStatus: '未连接' as ConnectStatus,
    pendingMap: {} as Record<string, PendingRecord>,
    isLoadingMore: false,
    isInitializing: true,
    isLoadingLock: false,
    hasMore: true,
    currentPage: 1,
    pageSize: PAGE_SIZE_DEFAULT,
    errorMsg: '' as string,
    socket: null as Socket | null,
    shouldScrollToBottom: false,
  }),

  getters: {
    isSending: (state): boolean => Object.keys(state.pendingMap).length > 0,
    isOnline: (state): boolean => state.connectStatus === '连接成功',
  },

  actions: {
    // ---------- 内部：pending 清理 ----------
    cleanupPendingMessage(tempId: string) {
      const ent = this.pendingMap[tempId];
      if (ent) {
        clearTimeout(ent.timeoutId);
        this.pendingMap = produce(this.pendingMap, (d) => {
          delete (d as Record<string, PendingRecord>)[tempId];
        });
      }
    },

    messageExists(msg: ChatMessage): boolean {
      // 优先使用 _id 检查（最准确）
      if (msg._id) {
        if (this.messageList.some((m) => m._id === msg._id)) return true;
      }
      // 其次使用 sequenceId 检查
      if (msg.sequenceId != null) {
        if (this.messageList.some((m) => m.sequenceId === msg.sequenceId)) return true;
      }
      // 最后使用内容+时间戳检查（用于临时消息去重）
      if (msg.content && msg.timestamp) {
        const msgTime = getTimestamp(msg.timestamp);
        if (this.messageList.some((m) => {
          if (m.content !== msg.content) return false;
          const mTime = getTimestamp(m.timestamp);
          return Math.abs(mTime - msgTime) < 1000; // 1秒内的相同内容视为重复
        })) return true;
      }
      return false;
    },

    // ---------- 更新临时消息为正式消息（含 sequenceId） ----------
    updateTempMessageById(tempId: string, server: ChatMessage): boolean {
      const i = this.messageList.findIndex(
        (m) => (m as TempChatMessage)._tempId === tempId
      );
      if (i === -1) return false;
      this.messageList = produce(this.messageList, (draft) => {
        const t = draft[i] as TempChatMessage;
        t._id = server._id;
        t.sequenceId = server.sequenceId;
        t.timestamp = server.timestamp;
        delete t._tempId;
        delete t._isPending;
      });
      this.cleanupPendingMessage(tempId);
      return true;
    },

    markTempMessageFailed(tempId: string) {
      const i = this.messageList.findIndex(
        (m) => (m as TempChatMessage)._tempId === tempId
      );
      if (i === -1) return;
      this.messageList = produce(this.messageList, (draft) => {
        const t = draft[i] as TempChatMessage;
        if (!t._id) {
          t._isFailed = true;
          t._isPending = false;
        }
      });
      this.cleanupPendingMessage(tempId);
    },

    removeLastPendingTempMessage() {
      for (let i = this.messageList.length - 1; i >= 0; i--) {
        const m = this.messageList[i] as TempChatMessage;
        if (m && !m._id && m._tempId) {
          this.messageList = produce(this.messageList, (d) => d.splice(i, 1));
          this.cleanupPendingMessage(m._tempId);
          return;
        }
      }
    },

    /**
     * 重发失败消息：从列表移除失败态，再按原内容重新发送
     * @param tempId - 临时消息 _tempId
     */
    retryFailedMessage(tempId: string) {
      const i = this.messageList.findIndex(
        (m) => (m as TempChatMessage)._tempId === tempId
      );
      if (i === -1) return;
      const t = this.messageList[i] as TempChatMessage;
      if (!t._isFailed || !t.content) return;
      const content = t.content;
      this.messageList = produce(this.messageList, (d) => d.splice(i, 1));
      this.sendMessage(content);
    },

    // ---------- 追加消息 + 更新会话元数据（不缓存消息内容） ----------
    appendMessage(msg: ChatMessageItem) {
      this.messageList = produce(this.messageList, (d) => {
        d.push(msg);
      });
      this.messageList = sortBySequenceIdAndTimestamp(this.messageList);
      this.shouldScrollToBottom = true;
      const u = useUserStore();
      const preview = (msg.content || '').slice(0, 50);
      updateSessionMeta(u.id, u.partnerId, {
        lastMessagePreview: preview,
        unreadCount: 0,
      }).catch((e) =>
        reportError(e, 'Cache', '更新会话信息失败')
      );
    },

    markScrolled() {
      this.shouldScrollToBottom = false;
    },

    /**
     * 加载历史消息
     * @param page - 页码，从 1 开始
     * @param isLoadMore - 是否为「加载更多」（向上翻页），true 时与现有列表合并去重
     */
    async loadHistoryMessages(page = 1, isLoadMore = false) {
      if (
        this.isLoadingLock ||
        this.isLoadingMore ||
        (isLoadMore && !this.hasMore)
      )
        return;

      this.isLoadingLock = true;
      this.isLoadingMore = true;

      try {
        const res = await getMessageApi({ page, size: this.pageSize });
        if (res.code === '0000') {
          const newMsgs = (res.data?.messages || []) as ChatMessage[];
          // 后端已返回 [旧消息, ..., 新消息] 的顺序（最新的在末尾），确保顺序正确
          if (isLoadMore) {
            // 加载更多时，newMsgs 是更旧的消息，应该放在列表前面
            // 合并后排序确保顺序：更旧的消息在前，较新的消息在后
            this.messageList = deduplicateMessages(
              newMsgs,
              this.messageList
            );
          } else {
            // 首次加载，后端返回的是最新的20条消息，顺序应该是 [第20新, ..., 最新]
            // 后端已按升序返回（sequenceId 小的在前，大的在后），直接排序确保顺序
            this.messageList = sortBySequenceIdAndTimestamp(newMsgs);
            // 验证顺序：确保第一个消息的 sequenceId 小于最后一个
            if (this.messageList.length > 1) {
              const firstSeq = this.messageList[0]?.sequenceId;
              const lastSeq = this.messageList[this.messageList.length - 1]?.sequenceId;
              // 如果顺序反了，反转列表
              if (firstSeq != null && lastSeq != null && firstSeq > lastSeq) {
                this.messageList = this.messageList.reverse();
              }
            }
            this.isInitializing = false;
          }
          this.hasMore = !!res.data?.hasMore;
          this.currentPage = page;
          if (!isLoadMore) this.shouldScrollToBottom = true;
          this.errorMsg = '';
        } else {
          // 接口返回业务错误（如 2009 伴侣不存在、2002 用户不存在等）
          if (this.isInitializing) this.isInitializing = false;
          this.errorMsg = res.message || '加载消息失败';
        }
      } catch (e) {
        reportError(e, 'API', '加载历史消息失败');
        this.errorMsg = '加载历史消息失败';
        if (this.isInitializing) this.isInitializing = false;
      } finally {
        this.isLoadingMore = false;
        this.isLoadingLock = false;
      }
    },

    /**
     * 发送消息：已连接时走 Socket，断线时写入 localForage 待发送队列
     * @param content - 文本内容，前后空白会被 trim，长度限制 1000
     */
    sendMessage(content: string) {
      const u = useUserStore();
      const id = u.id;
      const partnerId = u.partnerId;

      const raw = content.trim();
      if (!raw) {
        ElMessage.warning('消息内容不能为空');
        return;
      }
      if (raw.length > 1000) {
        ElMessage.warning('消息内容过长，最多1000个字符');
        return;
      }

      // 断线：写入离线队列，不发送
      if (!this.socket || this.connectStatus !== '连接成功') {
        const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
        pushOfflineQueue(id, partnerId, {
          content: raw,
          timestamp: new Date().toISOString(),
          tempId,
        }).catch(() => { /* chatStorage 已 reportError */ });
        ElMessage.info('已存入待发送，重连后将自动发送');
        return;
      }

      const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      const ts = new Date().toISOString();
      const temp: TempChatMessage = {
        _tempId: tempId,
        _isPending: true,
        content: raw,
        from: String(id),
        to: String(partnerId),
        timestamp: ts,
      };

      this.appendMessage(temp);
      this.socket.emit('send_couple_message', { content: raw });

      const timeoutId = setTimeout(() => {
        const idx = this.messageList.findIndex(
          (m) => (m as TempChatMessage)._tempId === tempId
        );
        if (idx !== -1) {
          const t = this.messageList[idx] as TempChatMessage;
          if (!t._id) {
            this.markTempMessageFailed(tempId);
            ElMessage.error('消息发送超时，请重试');
          }
        } else {
          this.cleanupPendingMessage(tempId);
        }
      }, SEND_TIMEOUT_MS) as unknown as number;

      this.pendingMap = produce(this.pendingMap, (d) => {
        (d as Record<string, PendingRecord>)[tempId] = {
          tempId,
          content: raw,
          timestamp: ts,
          timeoutId,
        };
      });
    },

    // ---------- 接收消息：校验 to/from 合法性，按 sequenceId+timestamp 排序 ----------
    handleReceivedMessage(data: ChatMessage) {
      const u = useUserStore();
      const myId = String(u.id ?? '');
      const partnerId = String(u.partnerId ?? '');
      const fromStr = typeof data.from === 'string' ? data.from : String(data.from);
      const toStr = typeof data.to === 'string' ? data.to : String(data.to);

      // 校验：仅接受 (from=我 to=伴侣) 或 (from=伴侣 to=我)
      const valid =
        (fromStr === myId && toStr === partnerId) ||
        (fromStr === partnerId && toStr === myId);
      if (!valid) return;

      const isOwn = fromStr === myId;

      // 先检查消息是否已存在（避免重复添加）
      if (this.messageExists(data)) {
        return;
      }

      // 如果是自己发送的消息，尝试匹配临时消息
      if (isOwn && (data._id || data.sequenceId != null)) {
        let matched = false;
        const entries = Object.entries(this.pendingMap);
        for (const [tid, p] of entries) {
          if (p.content !== data.content) continue;
          const pt = getTimestamp(p.timestamp);
          const dt = getTimestamp(data.timestamp);
          if (
            Math.abs(dt - pt) < 2000 &&
            this.updateTempMessageById(tid, data)
          ) {
            matched = true;
            break;
          }
        }
        if (matched) return;
      }

      // 如果消息不存在且未匹配到临时消息，则添加
      this.appendMessage({
        _id: data._id,
        sequenceId: data.sequenceId,
        content: data.content,
        from: fromStr,
        to: toStr,
        timestamp: data.timestamp,
      });
    },

    handleMsgSuccess(data: { data?: ChatMessage }) {
      const msg = data?.data;
      if (!msg?.content || Object.keys(this.pendingMap).length === 0) return;
      const entries = Object.entries(this.pendingMap);
      for (const [tid, p] of entries) {
        if (p.content !== msg.content) continue;
        const pt = getTimestamp(p.timestamp);
        const mt = getTimestamp(msg.timestamp);
        if (Math.abs(mt - pt) < 5000 && this.updateTempMessageById(tid, msg))
          break;
      }
    },

    /**
     * 断线队列：重连后自动重试，从 localForage 读出并逐条重发
     */
    async flushOfflineQueue() {
      const u = useUserStore();
      const id = u.id;
      const partnerId = u.partnerId;
      if (!id || !partnerId) return;

      try {
        const items = await getOfflineQueue(id, partnerId);
        if (items.length === 0) return;

        for (const it of items) {
          const temp: TempChatMessage = {
            _tempId: it.tempId,
            _isPending: true,
            content: it.content,
            from: String(id),
            to: String(partnerId),
            timestamp: it.timestamp,
          };
          this.appendMessage(temp);
          if (this.socket) {
            this.socket.emit('send_couple_message', { content: it.content });
            const timeoutId = setTimeout(() => {
              const idx = this.messageList.findIndex(
                (m) => (m as TempChatMessage)._tempId === it.tempId
              );
              if (idx !== -1) {
                const t = this.messageList[idx] as TempChatMessage;
                if (!t._id) this.markTempMessageFailed(it.tempId);
              } else {
                this.cleanupPendingMessage(it.tempId);
              }
            }, SEND_TIMEOUT_MS) as unknown as number;
            this.pendingMap = produce(this.pendingMap, (d) => {
              (d as Record<string, PendingRecord>)[it.tempId] = {
                tempId: it.tempId,
                content: it.content,
                timestamp: it.timestamp,
                timeoutId,
              };
            });
          }
        }
        await clearOfflineQueue(id, partnerId);
      } catch (e) {
        reportError(e, 'Cache', '重发待发送消息失败');
      }
    },

    // ---------- Socket：auth、心跳、指数退避、状态机 ----------
    setupSocketListeners() {
      const s = this.socket;
      if (!s) return;

      s.off('connection_error');
      s.off('connection_success');
      s.off('msg_error');
      s.off('receive_couple_message');
      s.off('msg_success');
      s.off('reconnect');
      s.off('reconnect_failed');
      s.off('disconnect');

      s.on('connection_error', (data: { message?: string }) => {
        this.connectStatus = '连接失败';
        this.errorMsg = data?.message || '';
        reportError(new Error(data?.message || '连接失败'), 'Socket', data?.message || '连接失败');
      });

      s.on('connection_success', (data: { coupleId?: string }) => {
        this.connectStatus = '连接成功';
        this.currentSessionId = data?.coupleId || '';
        this.errorMsg = '';
        ElMessage.success('连接成功');
        this.flushOfflineQueue();
      });

      s.on('msg_error', (data: { message?: string }) => {
        this.errorMsg = data?.message || '';
        reportError(new Error(data?.message || '消息发送失败'), 'Socket', data?.message || '消息发送失败');
        this.removeLastPendingTempMessage();
      });

      s.on('receive_couple_message', (data: ChatMessage) => {
        this.handleReceivedMessage(data);
      });

      s.on('msg_success', (data: { data?: ChatMessage }) => {
        this.handleMsgSuccess(data);
      });

      s.on('reconnect', () => {
        ElMessage.info('连接已恢复');
        this.connectStatus = '连接成功';
        this.errorMsg = '';
        this.flushOfflineQueue();
        this.loadHistoryMessages(1);
      });

      s.on('reconnect_failed', () => {
        this.connectStatus = '连接失败';
        this.errorMsg = '重连失败，已达最大重试次数';
        reportError(new Error('reconnect_failed'), 'Socket', '重连失败，请刷新页面重试');
      });

      s.on('disconnect', () => {
        this.connectStatus = 'reconnecting';
        ElMessage.warning('连接已断开，正在重连…');
      });
    },

    initSocket() {
      const u = useUserStore();
      const id = u.id;
      const partnerId = u.partnerId;
      const token = u.token;

      if (this.socket) {
        this.socket.removeAllListeners();
        this.socket.disconnect();
        this.socket = null;
      }

      this.connectStatus = 'connecting';
      this.errorMsg = '';

      this.socket = io('http://localhost:3000', {
        auth: { token: token || '' },
        query: { userId: id, partnerId },
        reconnection: true,
        reconnectionAttempts: RECONNECT_ATTEMPTS,
        reconnectionDelay: RECONNECT_DELAY,
        reconnectionDelayMax: RECONNECT_DELAY_MAX,
        transports: ['websocket', 'polling'],
      });
      this.setupSocketListeners();
    },

    cleanupSocketAndPending() {
      if (this.socket) {
        this.socket.removeAllListeners();
        this.socket.disconnect();
        this.socket = null;
      }
      Object.values(this.pendingMap).forEach((p) => clearTimeout(p.timeoutId));
      this.pendingMap = {};
    },

    cleanup() {
      this.cleanupSocketAndPending();
      cleanExpiredCache().catch((e) =>
        reportError(e, 'Cache', '清理过期缓存失败')
      );
    },

    resetForNewSession() {
      this.cleanupSocketAndPending();
      cleanExpiredCache().catch((e) =>
        reportError(e, 'Cache', '清理过期缓存失败')
      );
      this.messageList = [];
      this.isInitializing = true;
      this.hasMore = true;
      this.currentPage = 1;
      this.errorMsg = '';
    },
  },
});
