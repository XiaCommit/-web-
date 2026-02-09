<template>
  <div class="bg">
    <div class="login">
      <div class="logo">
        <h1 class="title">欢迎来到~ 拾光集</h1>
        <p>专属你们的爱情空间</p>
      </div>
      <el-form
        class="form"
        label-width="auto"
        :model="rulesform"
        :rules="rules"
        ref="formRef"
      >
        <el-form-item label="账号:" class="item" prop="username">
          <el-input
            class="input"
            placeholder="请输入用户名或账号"
            v-model="rulesform.username"
          />
        </el-form-item>
        <el-form-item label="密码:" class="item" prop="password">
          <el-input
            class="input"
            placeholder="请输入密码"
            v-model="rulesform.password"
          />
        </el-form-item>
        <el-form-item label="匹配码:" class="item" prop="code">
          <el-input
            class="input"
            placeholder="请输入对方匹配码"
            v-model="rulesform.code"
          />
        </el-form-item>
        <el-form-item>
          <el-button class="btn" @click="handlelogin">登录</el-button>
        </el-form-item>
      </el-form>
      <div class="register">
        <router-link to="/register">如果还没有账号，点击完成注册</router-link>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { RouterLink } from "vue-router";
import { reactive, ref } from "vue";
import type { FormRules, FormInstance } from "element-plus";
import { useUserStore } from "../store/user";
import { useRouter } from "vue-router";
const router = useRouter();
const userStore = useUserStore();
const { login } = userStore;
interface RulesForm {
  username: string;
  password: string;
  code: string;
}
const rulesform: RulesForm = reactive({
  username: "",
  password: "",
  code: "",
});
const rules = reactive<FormRules<RulesForm>>({
  username: [
    { required: true, message: "用户名不能为空", trigger: "blur" },
    { min: 4, max: 8, message: "用户名要求4-8位数字字母组合", trigger: "blur" },
  ],
  password: [{ required: true, message: "密码不能为空", trigger: "blur" }],
  code: [{ required: true, message: "邀请码不能为空", trigger: "blur" }],
});
const formRef = ref<FormInstance>();
const handlelogin = () => {
  formRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      login(rulesform);
      router.push("/");
    }
  });
};
</script>
<style scoped lang="less">
.bg {
  width: 100%;
  height: 100vh;
  background-color: rgb(246, 236, 239);
  position: absolute;
  .login {
    width: 500px;
    position: relative;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    box-shadow: 0 0 10px 10px #f4f4f4;
    padding: 20px;
    background-color: rgb(255, 255, 255);
    border-radius: 10px;
    .logo {
      text-align: center;
      margin-top: 20px;
      margin-bottom: 20px;
      color: rgb(255, 107, 139);
      font-size: 18px;
      p {
        color: rgb(107, 114, 128);
        margin-top: 10px;
      }
    }
    .form {
      .item {
        margin: 40px 20px;
      }
      ::v-deep .el-form-item__label {
        font-size: 16px;
        font-weight: 700;
      }
      .btn {
        text-align: center;
        width: 90%;
        height: 40px;
        margin: auto;
        font-size: large;
        font-weight: 700;
        letter-spacing: 20px;
        color: white;
        border-radius: 10px;
        border: 0;
        background-color: rgb(255, 107, 139);
      }
    }
    .register {
      margin-top: 40px;
      text-align: right;
      a {
        text-decoration: none;
        color: rgb(255, 107, 139);
      }
    }
  }
}
</style>
