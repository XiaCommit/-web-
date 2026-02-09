<template>
  <div
    v-memo="[message._id, (message as TempChatMessage)._tempId, message.content, isOwn, tempStatus]"
    class="message"
    :class="{
      received: !isOwn,
      sent: isOwn,
      'is-pending': isOwn && tempStatus === 'pending',
      'is-failed': isOwn && tempStatus === 'failed',
    }"
    @click="onBubbleClick"
  >
    <div class="message-content">{{ escapeHtml(message.content) }}</div>
    <div class="message-meta">
      <span class="message-time">{{ formatTimestamp(message.timestamp) }}</span>
      <template v-if="isOwn && isTemp">
        <el-icon v-if="tempStatus === 'pending'" class="status-icon loading">
          <Loading />
        </el-icon>
        <el-icon
          v-else-if="tempStatus === 'failed'"
          class="status-icon failed"
          title="发送失败，点击重试"
        >
          <CircleClose />
        </el-icon>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Loading, CircleClose } from '@element-plus/icons-vue';
import { useChatStore } from '@/store/chat';
import { escapeHtml } from '@/utils/escapeHtml';
import type { ChatMessageItem, TempChatMessage } from '@/types/chat';

const props = withDefaults(
  defineProps<{
    /** 消息数据 */
    message: ChatMessageItem;
    /** 是否为本机用户发送 */
    isOwn: boolean;
  }>(),
  {
    isOwn: false,
  }
);

const chatStore = useChatStore();

const isTemp = computed(() => !!(props.message as TempChatMessage)._tempId);

const tempStatus = computed(() => {
  const t = props.message as TempChatMessage;
  if (t._isFailed) return 'failed';
  if (t._isPending) return 'pending';
  return null;
});

function formatTimestamp(ts: string | Date): string {
  if (!ts) return '';
  try {
    const d = typeof ts === 'string' ? new Date(ts) : ts;
    if (isNaN(d.getTime())) return typeof ts === 'string' ? ts : String(ts);
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  } catch {
    return typeof ts === 'string' ? ts : String(ts);
  }
}

function onBubbleClick() {
  const t = props.message as TempChatMessage;
  if (t._isFailed && t._tempId) {
    chatStore.retryFailedMessage(t._tempId);
  }
}
</script>

<style lang="less" scoped>
.message {
  padding: 10px 14px;
  border-radius: 8px;
  max-width: 75%;
  box-shadow: none;
  margin-bottom: 12px;

  .message-content {
    font-size: 14px;
    color: #333;
    line-height: 1.5;
    word-break: break-word;
    margin-bottom: 4px;
  }

  .message-meta {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 2px;
  }

  .message-time {
    font-size: 11px;
    color: #999;
  }

  .status-icon {
    font-size: 12px;

    &.loading {
      color: #999;
      animation: spin 1s linear infinite;
    }

    &.failed {
      color: #f56c6c;
      cursor: pointer;
    }
  }
}

.received {
  background-color: #e0e0e0;

  .message-meta {
    justify-content: flex-start;
  }
}

.sent {
  background-color: #fce4e4;

  .message-meta {
    justify-content: flex-end;
  }

  /* 临时消息加载动画：轻微透明度与渐变 */
  &.is-pending {
    animation: pulse 1.5s ease-in-out infinite;
  }

  &.is-failed {
    cursor: pointer;
    outline: 1px dashed rgba(245, 108, 108, 0.5);
    outline-offset: 2px;
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.85; }
}
</style>
