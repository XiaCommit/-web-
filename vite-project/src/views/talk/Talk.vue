<template>
  <el-card class="header-card">
    <ChatHeader :title="title" :connect-status="connectStatusTyped.value" />
    <el-divider />
    <MessageContainer />
    <el-divider />
    <div v-if="errorMsg" class="error-tip">
      <el-alert :title="errorMsg" type="error" :closable="false" show-icon />
    </div>
    <MessageInput />
  </el-card>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { onMounted, onUnmounted, watch } from 'vue';
import { useUserStore } from '@/store/user';
import { useChatStore } from '@/store/chat';
import ChatHeader from './components/ChatHeader.vue';
import MessageContainer from './components/MessageContainer.vue';
import MessageInput from './components/MessageInput.vue';
import type { ConnectStatus } from '@/types/chat';

const title = '拾光语匣子';

const userStore = useUserStore();
const { id, partnerId } = storeToRefs(userStore);

const chatStore = useChatStore();
const { connectStatus, errorMsg } = storeToRefs(chatStore);

// 确保 connectStatus 类型正确
const connectStatusTyped = connectStatus as { value: ConnectStatus };

onMounted(() => {
  if (!id.value || !partnerId.value) {
    chatStore.connectStatus = '连接失败';
    chatStore.errorMsg = '用户ID或伴侣ID为空';
    chatStore.isInitializing = false;
    return;
  }
  chatStore.initSocket();
  chatStore.loadHistoryMessages(1);
});

onUnmounted(() => {
  chatStore.cleanup();
});

watch([id, partnerId], ([newId, newPartnerId], [oldId, oldPartnerId]) => {
  if (newId !== oldId || newPartnerId !== oldPartnerId) {
    chatStore.resetForNewSession();
    if (newId && newPartnerId) {
      chatStore.initSocket();
      chatStore.loadHistoryMessages(1);
    }
  }
});
</script>

<style lang="less" scoped>
.header-card {
  margin-top: -10px;
  height: 95vh;
}

.el-divider {
  margin: 5px 0;
  border-width: 1px;
}

.error-tip {
  margin: 10px 20px;
}
</style>
