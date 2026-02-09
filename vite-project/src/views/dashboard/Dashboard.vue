<template>
  <el-card class="time">
    <h1 class="title">我们在一起已经<span>{{ meetDate}}</span>天</h1>
  </el-card>
  <div class="card-container mt">
    <el-card class="card-item" @click="goToPage('/talk')">
      <el-icon size="25" class="icon"><ChatDotRound /></el-icon>
      拾光语匣子
    </el-card>
    <el-card class="card-item" @click="goToPage('/account')">
      <el-icon size="25" class="icon"><Notebook /></el-icon>
      拾光账单簿
    </el-card>
    <el-card class="card-item" @click="goToPage('/music')">
      <el-icon size="25" class="icon"><Service /></el-icon>
      拾光音悦台
    </el-card>
    <el-card class="card-item" @click="goToPage('/track')">
      <el-icon size="25" class="icon"><Film /></el-icon>
      拾光轨迹墙
    </el-card>
  </div>

  <div class="memory-section">
    <!-- 标题栏 -->
    <div class="section-header">
      <h3>最近回忆</h3>
      <el-button class="view-all" style="border: 0">查看全部</el-button>
    </div>

    <!-- 回忆卡片 -->
    <el-card class="memory-card">
      <div class="user-info">
        <el-avatar class="user-avatar">
          <!-- 替换为实际头像路径 -->
          <img :src="userInfo.avatar" alt="用户头像" />
        </el-avatar>
        <div class="user-text">
          <p class="user-name">亲爱的</p>
          <p class="user-content">今天一起看的电影太棒了！下次还要一起去~</p>
        </div>
        <span class="moment">昨天 19:30</span>
      </div>

      <!-- 图片区域 -->
      <div class="images">
        <img src="../../assets/cat1.jpg" alt="雪山" class="memory-img" />
        <img src="../../assets/cat2.jpg" alt="咖啡杯" class="memory-img" />
      </div>
    </el-card>
  </div>

  <div class="important-days-section">
    <!-- 标题栏 -->
    <div class="section-header">
      <h3>重要日子</h3>
      <el-button class="add-btn" @click="openAddDialog" style="border: 0"
        >添加 <el-icon><Plus /></el-icon
      ></el-button>
    </div>
    <!-- 重要日子列表部分 -->
    <el-card class="days-card">
      <el-row class="day-item" v-for="item in daysList" :key="item.id">
        <el-col :span="15">
          <div class="day-content">
            <p class="day-name">{{ item.name }}</p>
            <p class="day-date">{{ item.date }}</p>
          </div>
        </el-col>
        <el-col :span="6" class="countdown">
          <p class="countdown-text">还有</p>
          <p class="countdown-days">{{ item.days }}天</p>
        </el-col>
        <el-col :span="2">
          <el-button
            :round="true"
            class="mt ml"
            color="#ff6b9b"
            style="color: white"
            @click="edit(item)"
            >编辑</el-button
          >
        </el-col>
        <el-col :span="1">
          <el-popconfirm width="220" title="确定要删除吗" ref="popconfirmRef">
            <template #reference>
              <el-button class="mt"
                ><el-icon><Delete /></el-icon
              ></el-button>
            </template>
            <template #actions="{ cancel }">
              <el-button size="small" @click="cancel">取消</el-button>
              <el-button type="danger" size="small" @click="deleteday(item)"
                >确定</el-button
              >
            </template>
          </el-popconfirm>
        </el-col>
      </el-row>
    </el-card>
  </div>
  <Dialog
    :dialog-visible="visible"
    @close="visible = false"
    :isadd="isAdd"
    @reload="getimportDate"
  />
</template>

<script setup>
import { useRouter } from "vue-router";
import { ref, reactive, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { creatImportDateApi } from "@/api/importDate";
import Dialog from "./components/Dialog.vue";
import { useimportDateStore } from "@/store/importDate";
import { getImportantDateApi, deleteImportantDateApi } from "@/api/importDate";
import { formatDate } from "@/utils/dayUtil";
import { getAvatarApi } from "@/api/avatar";
import { getMeetDateApi } from "@/api/meetDate";
const meetDate = ref();
function calculateMeetDays(meetDateStr){
  const targetDate = new Date(meetDateStr);
  const today = new Date();
  today.setHours(0,0,0,0)
  targetDate.setHours(0,0,0,0)
  const diffTime = Math.max(Math.ceil((today.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24)), 0);
  return diffTime
}
const getMeetDate=async()=>{
  const res=await getMeetDateApi()
  if(res.code==='0000'){
    meetDate.value=calculateMeetDays(res.data.meetDate)
  }
}

const userInfo = ref({
  avatar: "",
});
const importStore = useimportDateStore();
const { setimportDate } = importStore;

const router = useRouter();
const goToPage = (path) => {
  router.push(path);
};

// 重要日子列表
let daysList = ref([]);
const visible = ref(false);
const isAdd = ref(false);

function calculateCountdown(dateStr) {
  const targetDate = new Date(dateStr);
  const today = new Date();

  if (isNaN(targetDate.getTime())) {
    console.error(`日期解析失败：${dateStr}`);
    return 0;
  }
  today.setHours(0, 0, 0, 0);

  const currentYearTarget = new Date(
    today.getFullYear(),
    targetDate.getMonth(),
    targetDate.getDate()
  );
  const nextYearTarget = new Date(
    today.getFullYear() + 1,
    targetDate.getMonth(),
    targetDate.getDate()
  );

  const finalTarget =
    currentYearTarget > today ? currentYearTarget : nextYearTarget;

  const diffTime = finalTarget - today;
  return Math.max(Math.ceil(diffTime / (1000 * 60 * 60 * 24)), 0);
}

const getimportDate = async () => {
  const res = await getImportantDateApi();
  if (res.code === "0000") {
    let formattedDate = res.data.map((item) => ({
      ...item,
      date: formatDate(item.date),
      days: calculateCountdown(item.date),
    }));
    daysList.value = formattedDate;
  }
};
const getAvatar = async () => {
  const res = await getAvatarApi();
  if (res.code === "0000") {
    userInfo.value.avatar = res.data.avatar;
  }
};
onMounted(() => {
  getimportDate();
  getAvatar();
  getMeetDate();
});

const openAddDialog = () => {
  setimportDate({
    name: "",
    date: "",
    remark: "",
    id: "",
  });
  visible.value = true;
  isAdd.value = true;
};
const edit = (item) => {
  setimportDate({
    name: item.name,
    date: item.date,
    remark: item.remark,
    id: item._id,
  });
  visible.value = true;
  isAdd.value = false;
};

const deleteday = async (item) => {
  const res = await deleteImportantDateApi(item._id);
  if (res.code == "0000") {
    ElMessage({
      message: res.message,
      type: "success",
    });
    getimportDate();
  }
};
</script>

<style lang="less" scoped>
.time {
  padding: 20px 20px;
  text-align: center;
  line-height: 60px;
  background: linear-gradient(to right, #ff6b9b, #6495ed);
  border-radius: 8px;
  height: 120px;
  color: white;
  font-size: 20px;
  span {
    color: rgb(219, 100, 100);
    font-size: 65px;
  }
}
.card-container {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  height: 80px;
  .card-item {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    font-weight: 800;
    color: #7e7b7e;
    padding-top: 5px;

    .icon {
      vertical-align: middle;
      margin-right: 8px;
    }
  }
}
.memory-section {
  padding: 20px;

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    h3 {
      font-size: 18px;
      font-weight: 600;
      color: #333;
      margin: 0;
    }
    .view-all {
      color: #ff6b9b;
      font-size: 14px;
    }
  }

  .memory-card {
    border-radius: 8px;
    border: none;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

    .user-info {
      display: flex;
      align-items: flex-start;
      margin-bottom: 12px;

      .user-avatar {
        margin-right: 12px;
      }

      .user-text {
        flex: 1;

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
        }
      }
      .moment {
        font-size: 12px;
        color: #999;
      }
    }

    .images {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;

      .memory-img {
        width: 300px;
        height: 300px;
        object-fit: cover;
        border-radius: 4px;
      }
    }
  }
}
.important-days-section {
  padding: 20px;

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    h3 {
      font-size: 18px;
      font-weight: 600;
      color: #333;
      margin: 0;
    }

    .add-btn {
      color: #ff6b9b;
      font-size: 14px;
    }
  }

  .days-card {
    border-radius: 8px;
    border: none;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    padding: 0; // 移除卡片默认内边距

    .day-item {
      padding: 16px; // 行内边距
      border-bottom: 1px solid #eee;
      display: flex;
      align-items: center;

      &:last-child {
        border-bottom: none;
      }

      .day-content {
        flex: 1;
      }

      .day-name {
        font-size: 16px;
        font-weight: 500;
        color: #333;
        margin: 0 0 4px 0;
      }

      .day-date {
        font-size: 14px;
        color: #999;
        margin: 0;
      }

      .countdown {
        text-align: right;

        .countdown-text {
          font-size: 14px;
          color: #999;
          margin: 0 0 4px 0;
        }

        .countdown-days {
          font-size: 18px;
          font-weight: 600;
          color: #ff6b9b;
          margin: 0;
        }
      }
    }
  }
}
</style>
