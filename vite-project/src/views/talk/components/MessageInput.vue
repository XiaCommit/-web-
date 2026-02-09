<template>
  <div class="input-wrapper">
    <div class="extra-options">
      <el-button class="extra-btn" title="发送图片">
        <el-icon><Picture /></el-icon>
      </el-button>
      <el-button class="extra-btn" title="发送表情" @click="toggleEmojiPicker">
        <el-icon><Orange /></el-icon>
      </el-button>
      <el-button class="extra-btn" title="发送文件">
        <el-icon><Paperclip /></el-icon>
      </el-button>
      <div
        v-if="showEmojiPicker"
        ref="emojiPickerWrapperRef"
        class="emoji-picker-wrapper"
        @click.stop
      >
        <EmojiPicker
          :native="true"
          :hide-search="false"
          :display-recent="true"
          :theme="theme"
          @select="handleEmojiSelect"
        />
      </div>
    </div>
    <div class="input-container">
      <textarea
        ref="textareaRef"
        class="message-input"
        id="messageInput"
        placeholder="输入消息... (按Enter发送, Shift+Enter换行)"
        rows="1"
        v-model="message"
        @input="adjustHeight"
        @keydown.enter.exact.prevent="onSend"
        @keydown.shift.enter.prevent
      />
      <el-button
        class="send-btn"
        :disabled="!canSend"
        :loading="isSending"
        @click="onSend"
      >
        <el-icon v-if="!isSending"><Promotion /></el-icon>
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { Picture, Orange, Paperclip, Promotion } from '@element-plus/icons-vue';
import { storeToRefs } from 'pinia';
import { useChatStore } from '@/store/chat';
import EmojiPicker from 'vue3-emoji-picker'
import 'vue3-emoji-picker/css'

// 定义 emoji 类型
interface EmojiData {
  i: string; // emoji 字符
  n?: string[]; // 名称数组
  r?: string; // 原生 emoji
  t?: string; // 文本表示
  [key: string]: any;
}

const MIN_H = 44;
const MAX_H = 120;

const chatStore = useChatStore();
const { connectStatus, isSending } = storeToRefs(chatStore);

const message = ref('');
const textareaRef = ref<HTMLTextAreaElement | null>(null);
const emojiPickerWrapperRef = ref<HTMLElement | null>(null);

const theme = ref<'light' | 'dark' | 'auto'>('light');
const showEmojiPicker = ref(false);

// 处理表情选择
const handleEmojiSelect = (emoji: EmojiData) => {
  if (!textareaRef.value) return;
  
  const textarea = textareaRef.value;
  const start = textarea.selectionStart || 0;
  const end = textarea.selectionEnd || 0;
  const textBefore = message.value.substring(0, start);
  const textAfter = message.value.substring(end);
  
  // 使用 emoji.i 或 emoji.r 或 emoji.emoji（根据实际库返回的字段）
  const emojiChar = emoji.i || emoji.r || emoji.emoji || '';
  message.value = textBefore + emojiChar + textAfter;
  
  // 更新光标位置
  nextTick(() => {
    textarea.focus();
    const newPosition = start + emojiChar.length;
    textarea.setSelectionRange(newPosition, newPosition);
    adjustHeight();
  });
  
  // 选择表情后关闭面板
  showEmojiPicker.value = false;
};

// 切换表情选择器显示状态
const toggleEmojiPicker = () => {
  showEmojiPicker.value = !showEmojiPicker.value;
  
  // 切换时重置输入框焦点
  nextTick(() => {
    if (showEmojiPicker.value) {
      // 打开面板时，保持输入框焦点（可选）
      // textareaRef.value?.focus();
    } else {
      // 关闭面板时，确保输入框获得焦点
      textareaRef.value?.focus();
    }
  });
};

// 点击外部区域关闭表情选择器
const handleClickOutside = (event: MouseEvent) => {
  if (!showEmojiPicker.value) return;
  
  const target = event.target as HTMLElement;
  const emojiButton = document.querySelector('.extra-btn[title="发送表情"]');
  
  // 检查点击是否在表情选择器内部或表情按钮上
  if (
    emojiPickerWrapperRef.value &&
    !emojiPickerWrapperRef.value.contains(target) &&
    emojiButton &&
    !emojiButton.contains(target)
  ) {
    showEmojiPicker.value = false;
    // 关闭后恢复输入框焦点
    nextTick(() => {
      textareaRef.value?.focus();
    });
  }
};
const canSend = computed(() => {
  const t = message.value.trim();
  if (!t) return false;
  if (connectStatus.value === '连接成功') return !isSending.value;
  return true;
});

/** 根据内容行数自动调整输入框高度，最大 120px */
function adjustHeight() {
  nextTick(() => {
    const el = textareaRef.value;
    if (!el) return;
    el.style.height = 'auto';
    const h = Math.min(MAX_H, Math.max(MIN_H, el.scrollHeight));
    el.style.height = `${h}px`;
  });
}

onMounted(() => {
  adjustHeight();
  // 添加点击外部关闭表情选择器的事件监听
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  // 清理事件监听器
  document.removeEventListener('click', handleClickOutside);
});

function onSend() {
  const content = message.value.trim();
  if (!content) return;
  if (connectStatus.value === '连接成功' && isSending.value) return;
  chatStore.sendMessage(content);
  message.value = '';
  nextTick(adjustHeight);
}
</script>

<style lang="less" scoped>
.input-wrapper {
  display: flex;
  flex-direction: column;
}

.extra-options {
  display: flex;
  gap: 8px;
  padding: 10px 16px 6px 16px;
  align-items: center;
  position: relative;
}

.emoji-picker-wrapper {
  position: absolute;
  bottom: 100%;
  left: 16px;
  z-index: 1000;
  margin-bottom: 8px;
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  
  // 确保表情选择器有合适的尺寸
  :deep(.emoji-picker) {
    width: 100%;
    max-width: 400px;
  }
  
  // 适配 vue3-emoji-picker 的样式
  :deep(.epr-emoji-category-label) {
    font-size: 12px;
    color: #666;
  }
  
  :deep(.epr-emoji) {
    font-size: 24px;
    transition: transform 0.2s;
    
    &:hover {
      transform: scale(1.2);
    }
  }
}

.extra-btn {
  padding: 0;
  border: none;
  background: transparent;
  color: #d9779f;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  min-width: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  cursor: pointer;

  &:hover {
    background-color: rgba(217, 119, 159, 0.1);
    color: #c85d8a;
  }

  &:active {
    background-color: rgba(217, 119, 159, 0.15);
  }

  :deep(.el-icon) {
    font-size: 20px;
  }

  :deep(.el-button__inner) {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.input-container {
  display: flex;
  align-items: flex-end;
  padding: 0 16px 12px 16px;
  gap: 0;
}

.message-input {
  flex: 1;
  padding: 10px 16px;
  border: 1px solid #d9779f;
  border-radius: 20px;
  background-color: #fff;
  font-size: 14px;
  color: #333;
  resize: none;
  outline: none;
  box-shadow: none;
  transition: all 0.15s ease;
  font-family: inherit;
  line-height: 1.5;
  min-height: 40px;
  max-height: 120px;
  margin-right: 12px;

  &::placeholder {
    color: #b8a5a5;
  }

  &:focus {
    border-color: #d9779f;
    box-shadow: 0 0 0 2px rgba(217, 119, 159, 0.15);
  }
}

.send-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background-color: #d9779f;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  padding: 0;
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(217, 119, 159, 0.25);

  &:hover:not(:disabled) {
    background-color: #c85d8a;
    box-shadow: 0 3px 6px rgba(217, 119, 159, 0.35);
    transform: translateY(-1px);
  }

  &:active:not(:disabled) {
    background-color: #b84a7a;
    transform: translateY(0);
    box-shadow: 0 1px 3px rgba(217, 119, 159, 0.3);
  }

  :deep(.el-icon) {
    font-size: 18px;
    color: #fff;
  }

  :deep(.el-button__inner) {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
  }

  &:disabled {
    background-color: #f3d4e4;
    cursor: not-allowed;
    color: #e0b8d0;
    box-shadow: none;

    :deep(.el-icon) {
      color: #e0b8d0;
    }
  }
}
</style>
