<template>
  <div class="bg">
    <div class="login" v-if="!isregister">
      <div class="logo">
        <h1 class="title">拾光集</h1>
        <p>创建你们的专属空间</p>
      </div>
      <el-form
        class="form"
        label-width="auto"
        :model="rulesform"
        ref="formRef"
        :rules="rules"
      >
        <el-form-item label="性别：" class="item" prop="gender">
          <el-radio-group v-model="rulesform.gender">
            <el-radio value="1">男</el-radio>
            <el-radio value="2">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="生日：" class="item" prop="birthday">
          <el-date-picker
            type="date"
            placeholder="请选择你的出生日期"
            v-model="rulesform.birthday"
          />
        </el-form-item>
        <el-form-item label="账号：" class="item" prop="username">
          <el-input
            class="input"
            placeholder="请输入用户名或账号"
            v-model="rulesform.username"
          />
        </el-form-item>
        <el-form-item label="密码：" class="item" prop="password">
          <el-input
            class="input"
            placeholder="请输入密码"
            v-model="rulesform.password"
          />
        </el-form-item>
        <el-form-item>
          <el-button class="btn" @click="handleregister">点击注册</el-button>
        </el-form-item>
      </el-form>
    </div>
    <div class="message" v-else>
      <h1>恭喜注册成功！</h1>
      <p>
        你的邀请码：<br /><span>{{ inviteCode }}</span>
      </p>
      <button @click="router.push('/login')" class="btn">返回首页登录</button>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { ref, reactive } from "vue";
import type { FormRules, FormInstance } from "element-plus";

import { useRouter } from "vue-router";
import { useUserStore } from "../store/user";
const useStore = useUserStore();
const { register } = useStore;
const router = useRouter();
const inviteCode = ref("");
const isregister = ref<boolean>();
interface RulesForm {
  gender: string;
  birthday: Date | null;
  username: string;
  password: string;
}
const rulesform: RulesForm = reactive({
  gender: "",
  birthday: null,
  username: "",
  password: "",
});
const rules = ref<FormRules<RulesForm>>({
  gender: [{ required: true, message: "请选择你的性别", trigger: "blur" }],
  birthday: [
    { required: true, message: "请选择你的出生日期", trigger: "blur" },
  ],
  username: [
    { required: true, message: "用户名或账号不能为空", trigger: "blur" },
    { min: 4, max: 8, message: "请输入4-8数字字母组合", trigger: "blur" },
  ],
  password: [{ required: true, message: "密码不能为空", trigger: "blur" }],
});
const formRef = ref<FormInstance>();
const handleregister = () => {
  formRef.value!.validate(async (valid: boolean) => {
    if (valid) {
      const code = await register(rulesform);
      inviteCode.value = code;
      isregister.value = true;
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
  }
  .message {
    position: absolute;
    width: 500px;
    height: 300px;
    background-color: white;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    border-radius: 8px;
    text-align: center;
    padding: 20px;
    h1 {
      margin-top: 20px;
      margin-bottom: 20px;
      color: rgb(255, 107, 139);
    }
    p {
      font-size: 20px;
      color: rgb(107, 114, 128);
      span {
        color: black;
        margin-top: 40px;
        text-align: center;
        font-size: 40px;
      }
    }
    .btn {
      text-align: center;
      width: 90%;
      height: 40px;
      font-size: large;
      font-weight: 700;
      letter-spacing: 20px;
      color: white;
      border-radius: 10px;
      margin-top: 40px;
      border: 0;
      background-color: rgb(255, 107, 139);
    }
  }
}
</style>
