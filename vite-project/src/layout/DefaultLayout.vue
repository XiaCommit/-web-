<template>
  <div class="common-layout">
    <el-container>
      <el-header class="header" :class="{ isfixed: isfixed }"
        ><HeaderTab></HeaderTab
      ></el-header>
      <el-main><RouterView /></el-main>
    </el-container>
  </div>
</template>
<script setup>
import { RouterView } from "vue-router";
import { ref, onMounted, onUnmounted } from "vue";
import HeaderTab from "./HeaderTab.vue";
const isfixed = ref(false);
const isTabFixed = () => {
  isfixed.value = window.scrollY > 70;
};
onMounted(() => {
  window.addEventListener("scroll", isTabFixed);
});
onUnmounted(() => {
  window.removeEventListener("scroll", isTabFixed);
});
</script>
<style scoped lang="less">
.header {
  padding: 0;
  width: 100%;
  &.isfixed {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 99;
  }
}
</style>
