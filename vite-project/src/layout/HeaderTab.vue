<template>
  <div class="bg">
    <div class="left">
      <div class="logo">
        <h1>拾光集</h1>
      </div>
      <ul class="tab">
        <li>
          <RouterLink
            to="/dashboard"
            :class="{ active: $route.path === '/dashboard' }"
            >首页</RouterLink
          >
        </li>
        <li>
          <RouterLink
            to="/account"
            :class="{ active: $route.path === '/account' }"
          >
            拾光帐单簿
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/talk" :class="{ active: $route.path === '/talk' }">
            拾光语匣子
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/music" :class="{ active: $route.path === '/music' }">
            拾光音悦台
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/track" :class="{ active: $route.path === '/track' }">
            拾光轨迹墙
          </RouterLink>
        </li>
      </ul>
    </div>
    <div class="right">
      <el-badge is-dot class="item">
        <el-icon size="large"><Bell /></el-icon
      ></el-badge>

      <el-dropdown placement="bottom">
        <el-avatar
          :key="userInfo.avatar"
          :src="userInfo.avatar || 'https://picsum.photos/id/64/200/200'"
        />
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="personal">个人中心</el-dropdown-item>
            <el-dropdown-item @click="handlelogout">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>
<script setup>
import { RouterLink } from "vue-router";
import { useRoute, useRouter } from "vue-router";
import { useUserStore } from "@/store/user";
import { getAvatarApi } from "@/api/avatar";
import { ref, onMounted } from "vue";
const usersStore = useUserStore();  
const userInfo = ref({
  avatar: "",
});
const { logout } = usersStore;
const route = useRoute();
const router = useRouter();
const handlelogout = () => {
  logout();
  router.push("/login");
};
const personal = () => {
  router.push("/personal");
};
const getAvatar = async () => {
  const res = await getAvatarApi();
  if (res.code === "0000") {
    userInfo.value.avatar = res.data.avatar;
  }
};
onMounted(() => {
  getAvatar();
});
</script>
<style scoped lang="less">
.bg {
  width: 100%;
  height: 50px;
  background-color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0;
  padding: 0;

  .left {
    display: flex;
    align-items: center;
    height: 100%;

    .logo {
      width: 100px;
      padding: 0 20px;
      color: rgb(255, 107, 139);
    }

    .tab {
      display: flex;
      align-items: center;
      height: 100%;

      li {
        padding: 0 10px;
        a {
          font-size: 16px;
          font-weight: 500;
          color: rgb(107, 114, 128);
          padding: 5px 10px;
          text-decoration: none;
        }
        a.active {
          color: rgb(255, 107, 139);
          border-bottom: 2px solid rgb(255, 107, 139);
        }
      }
    }
  }

  .right {
    display: flex;
    align-items: center;
    padding-right: 20px;
    gap: 15px;
    .item {
      padding: 0 10px;
      margin-right: 20px;
      margin-top: 5px;
    }
    .el-avatar {
      margin-right: 20px;
    }
  }
}
</style>
