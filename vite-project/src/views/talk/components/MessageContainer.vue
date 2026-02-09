<template>
  <div
    class="fixed-message-container"
    v-bind="containerProps"
    @scroll="handleScroll"
  >
    <div v-if="isLoadingMore" class="loading">加载更早的消息...</div>
    <div v-if="isInitializing" class="loading">正在加载消息...</div>
    <div v-bind="wrapperProps" class="message-wrapper">
      <div
        v-for="item in list"
        :key="(item.data as TempChatMessage)._tempId || (item.data as ChatMessageItem)._id || `msg_${item.index}`"
        class="message-item-slot"
        :class="{ 'is-own': isMyMessage(item.data as ChatMessageItem) }"
      >
        <MessageItem
          :message="item.data as ChatMessageItem"
          :is-own="isMyMessage(item.data as ChatMessageItem)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted, nextTick, onMounted } from 'vue';
import { useVirtualList } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { useChatStore } from '@/store/chat';
import { useUserStore } from '@/store/user';
import { debounce } from '@/utils';
import MessageItem from './MessageItem.vue';
import type { ChatMessageItem, TempChatMessage } from '@/types/chat';

const ITEM_HEIGHT = 100; // 增加默认高度，减少虚拟列表计算误差

const chatStore = useChatStore();
const userStore = useUserStore();
const { id } = storeToRefs(userStore);
const {
  messageList,
  isLoadingMore,
  isInitializing,
  isLoadingLock,
  hasMore,
  currentPage,
  shouldScrollToBottom,
} = storeToRefs(chatStore);

const scrollRef = ref<HTMLDivElement | null>(null);

const { list, containerProps, wrapperProps } = useVirtualList(messageList, {
  itemHeight: ITEM_HEIGHT,
  overscan: 5,
});

// 从 containerProps 中获取 ref 并同步到 scrollRef
onMounted(() => {
  const containerRef = (containerProps as { ref?: { value?: HTMLElement | null } }).ref;
  if (containerRef && 'value' in containerRef) {
    scrollRef.value = containerRef.value as HTMLDivElement;
  }
});

function isMyMessage(msg: ChatMessageItem): boolean {
  const from = typeof msg.from === 'string' ? msg.from : String(msg.from);
  return from === id.value?.toString();
}

function scrollToBottom() {
  const el = scrollRef.value;
  if (el) el.scrollTop = el.scrollHeight;
}

const handleScroll = debounce(() => {
  const el = scrollRef.value;
  if (!el) return;
  // 向上滚动加载更旧的消息：当滚动到顶部附近时触发
  if (
    el.scrollTop < 100 &&
    hasMore.value &&
    !isLoadingMore.value &&
    !isLoadingLock.value
  ) {
    const oldScrollTop = el.scrollTop;
    const oldScrollHeight = el.scrollHeight;
    const next = currentPage.value + 1;
    
    chatStore.loadHistoryMessages(next, true).then(() => {
      // 等待 DOM 更新后恢复滚动位置，避免抖动
      nextTick(() => {
        // 使用三重 requestAnimationFrame 确保虚拟列表完全更新
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              if (el) {
                const newScrollHeight = el.scrollHeight;
                const heightDiff = newScrollHeight - oldScrollHeight;
                // 保持用户看到的相对位置：旧位置 + 新增的高度
                if (heightDiff > 0) {
                  el.scrollTop = oldScrollTop + heightDiff;
                }
              }
            });
          });
        });
      });
    });
  }
}, 200);

watch(shouldScrollToBottom, (v) => {
  if (v) {
    nextTick(() => {
      scrollToBottom();
      chatStore.markScrolled();
    });
  }
});

onUnmounted(() => {
  if (handleScroll.cancel) handleScroll.cancel();
});
</script>

<style lang="less" scoped>
.fixed-message-container {
  height: 400px;
  overflow-y: auto;
  padding: 16px 20px;
  background-color: #fff;
}

.loading {
  text-align: center;
  color: #999;
  padding: 10px 0;
  font-size: 14px;
}

.message-wrapper {
  position: relative;
  min-height: min-content;
  display: flex;
  flex-direction: column;
}

.message-item-slot {
  box-sizing: border-box;
  display: flex;
  width: 100%;
  margin-bottom: 4px;

  &.is-own {
    justify-content: flex-end;
  }

  &:not(.is-own) {
    justify-content: flex-start;
  }
}
</style>
