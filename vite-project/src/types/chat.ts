/**
 * 聊天模块类型定义
 */

/**
 * 基础聊天消息
 * @property _id - 服务端主键，可选
 * @property sequenceId - 服务端递增序号，用于排序与去重
 * @property content - 文本内容
 * @property from - 发送方 ID
 * @property to - 接收方 ID
 * @property timestamp - 时间戳
 */
export interface ChatMessage {
  _id?: string;
  /** 服务端下发的递增序号，用于排序与去重 */
  sequenceId?: number;
  content: string;
  from: string;
  to: string;
  timestamp: string | Date;
}

/**
 * 临时消息，扩展 ChatMessage
 * 用于在消息发送成功前显示，支持 pending / failed 状态
 * @property _tempId - 前端临时 ID
 * @property _isPending - 是否发送中
 * @property _isFailed - 是否已失败
 */
export interface TempChatMessage extends ChatMessage {
  _tempId?: string;
  _isPending?: boolean;
  _isFailed?: boolean;
}

/** 消息列表项（正式或临时） */
export type ChatMessageItem = ChatMessage | TempChatMessage;

/**
 * 待发送队列项，管理超时与清理
 * @property tempId - 临时 ID
 * @property content - 内容
 * @property timestamp - 时间戳
 * @property timeoutId - 超时定时器 ID
 */
export interface PendingMessage {
  tempId: string;
  content: string;
  timestamp: string;
  timeoutId: ReturnType<typeof setTimeout>;
}

/**
 * 连接状态
 * - 未连接: 初始
 * - connecting: 首次连接中
 * - 连接成功: 已连接
 * - reconnecting: 断线后重连中
 * - 连接断开: 已断开（重试中）
 * - 连接失败: 连接失败或已达最大重试
 */
export type ConnectStatus =
  | '未连接'
  | 'connecting'
  | '连接成功'
  | 'reconnecting'
  | '连接断开'
  | '连接失败';

/**
 * 会话基本信息（仅元数据，不包含消息内容）
 * @property lastMessagePreview - 最后一条预览，如前 50 字
 * @property unreadCount - 未读数
 * @property updatedAt - 更新时间戳
 */
export interface SessionMeta {
  lastMessagePreview: string;
  unreadCount: number;
  updatedAt: number;
}

/**
 * 断线未发送消息项，用于 localForage 持久化与重连重试
 * @property content - 内容
 * @property timestamp - 时间戳
 * @property tempId - 临时 ID
 */
export interface OfflineQueueItem {
  content: string;
  timestamp: string;
  tempId: string;
}
