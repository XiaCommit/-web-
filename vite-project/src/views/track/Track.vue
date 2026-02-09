<template>
    <div class="track-container">
      <div class="time-axis-header">
        <h2 class="page-title">我们的时光轴</h2>
        <el-button type="primary" round class="record-btn" @click="goToEditTract">
          <el-icon><Plus /></el-icon> 记录新事件
        </el-button>
      </div>
      <div class="timeline-wrapper">
        <el-timeline style="width: 100%;">
          <el-timeline-item 
            v-for="(item) in timelineData" 
            :key="item._id"
            :timestamp="new Date(item.createdTime).toLocaleString('zh-CN')" 
            placement="top"
          >
            <!-- 回忆卡片类型 -->
            <el-card  class="memory-card">
              <div class="user-info">
                <el-avatar class="user-avatar">
                  <img :src="userInfo.avatar || item.avatar" alt="用户头像" />
                </el-avatar>
                <div class="user-text">
                  <p class="user-name">{{ username }}</p>
                  <p class="user-content">{{ item.description }}</p>
                </div>
                <span class="moment">{{ new Date(item.createdTime).toLocaleString('zh-CN') }}</span>
              </div>
              <!-- 图片区域 -->
              <div class="images" v-if="item.images && item.images.length > 0">
                <img 
                  v-for="(img, imgIndex) in item.images" 
                  :key="imgIndex"
                  :src="item.images[imgIndex]" 
                  :alt="`图片${imgIndex + 1}`" 
                  class="memory-img" 
                />
              </div>
              <div class="delete-btn">
                <el-popconfirm width="220" title="确定要删除吗" ref="popconfirmRef">
            <template #reference>
              <el-button class="mt"
                ><el-icon><Delete /></el-icon
              ></el-button>
            </template>
            <template #actions="{ confirm, cancel }">
              <el-button size="small" @click="cancel">取消</el-button>
              <el-button type="danger" size="small" @click="deleteTrack(item); confirm()"
                >确定</el-button
              >
            </template>
          </el-popconfirm>
              </div>
            </el-card>
          </el-timeline-item>
        </el-timeline>
      </div>
    </div>
  </template>
  
  <script setup>
  import { useRouter } from 'vue-router';
  import { getAvatarApi } from "@/api/avatar";
  import { getTrackApi,deleteTrackApi } from "@/api/track";
  import {ref,onMounted} from 'vue'
  import { storeToRefs } from 'pinia';
  import {useUserStore} from '@/store/user'
  const userStore = useUserStore();
  const {username} = storeToRefs(userStore);
  const userInfo = ref({
    avatar: "",
  });
  const timelineData = ref([]);
  const getAvatar = async () => {
    const res = await getAvatarApi();
    if (res.code === "0000") {
      userInfo.value.avatar = res.data.avatar;
    }
  };
  const getTrack = async () => {
    const res = await getTrackApi();
    if (res.code === "0000") {
      timelineData.value = res.data;
    }
  };
  const deleteTrack = async (item) => {
    const res = await deleteTrackApi(item._id);
    if (res.code === "0000") {
      getTrack();
    }
  };
  onMounted(() => {
    getAvatar();
    getTrack();
  });

  const router = useRouter();
  const goToEditTract = () => {
    router.push('/track/detail');
  };
  </script>
  
  <style scoped lang="less">
  .track-container {
    padding: 20px;
  }

  .time-axis-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    margin-bottom: 20px;
  
    .page-title {
      font-size: 20px;
      font-weight: 600;
      color: #333;
      margin: 0;
    }

    .record-btn {
      --el-button-bg-color: #ff7a9c;
      --el-button-border-color: #ff7a9c;
      --el-button-hover-bg-color: #ff5d85;
      --el-button-hover-border-color: #ff5d85;
      --el-button-text-color: #fff;
      height: 40px;
      padding: 8px 20px;
      font-size: 14px;
    }
  }

  .timeline-wrapper {
    width: 100%;
  }

  .memory-card {
    border-radius: 8px;
    border: none;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    padding: 16px;
    margin-bottom: 20px;

    .user-info {
      display: flex;
      align-items: flex-start;
      margin-bottom: 12px;
      position: relative;
      padding-right: 80px;

      .user-avatar {
        margin-right: 12px;
        flex-shrink: 0;
        width: 40px;
        height: 40px;
      }

      .user-text {
        flex: 1;
        min-width: 0;

        .user-name {
          font-size: 16px;
          font-weight: 500;
          color: #333;
          margin: 0 0 4px 0;
        }

        .user-content {
          font-size: 14px;
          color: #666;
          margin: 0;
          line-height: 1.5;
          word-wrap: break-word;
        }
      }
      
      .moment {
        font-size: 12px;
        color: #999;
        position: absolute;
        top: 0;
        right: 0;
        white-space: nowrap;
      }
    }

    .images {
      display: flex;
      gap: 8px;
      margin-top: 12px;

      .memory-img {
        width: 300px;
        height: 300px;
        object-fit: cover;
        border-radius: 4px;
      }
    }
    .delete-btn {
      text-align: right;

    }
  }

  </style>