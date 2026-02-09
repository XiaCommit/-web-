<template>
  <div class="header-inner">
    <h1>{{ title }}</h1>
    <div class="partner-info">
      <span>伴侣昵称：</span>
      <div class="status-dot" :class="{ online: isOnline, offline: !isOnline }"></div>
      <span>{{ statusText }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ConnectStatus } from '@/types/chat';

const props = withDefaults(
  defineProps<{
    /** 标题文案 */
    title?: string;
    /** 连接状态，用于展示在线/连接中/重连中/失败等 */
    connectStatus: ConnectStatus;
  }>(),
  { title: '拾光语匣子' }
);

const isOnline = computed(() => props.connectStatus === '连接成功');

const statusText = computed(() => {
  switch (props.connectStatus) {
    case '连接成功':
      return '在线';
    case 'connecting':
      return '连接中…';
    case 'reconnecting':
      return '重连中…';
    case '连接失败':
      return '连接失败';
    default:
      return '离线';
  }
});
</script>

<style lang="less" scoped>
.header-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 5px 0;

  h1 {
    font-size: 25px;
    font-weight: bold;
    color: rgb(90, 74, 66);
    margin-bottom: 5px;
  }

  .partner-info {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }

  .status-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    transition: all 0.3s;

    &.online {
      background-color: #4ade80;
      box-shadow: 0 0 8px rgba(74, 222, 128, 0.6);
    }

    &.offline {
      background-color: #999;
    }
  }
}
</style>
