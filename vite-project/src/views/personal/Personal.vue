<template>
  <div class="personal-center">
    <!-- 主体内容 -->
    <el-main class="main-container">
      <!-- 头像与基础信息卡片 -->
      <el-card class="base-info-card">
        <div class="base-info-content">
          <!-- 头像上传区域 -->
          <div class="avatar-wrapper">
            <el-upload
              ref="uploadRef"
              class="avatar-uploader"
              :auto-upload="false"
              :show-file-list="false"
              :on-change="handleAvatarChange"
              accept="image/*"
            >
              <img
                v-if="userInfo.avatar"
                :src="userInfo.avatar"
                class="avatar-img"
                alt="用户头像"
              />
              <el-icon v-else class="avatar-uploader-icon"><User /></el-icon>
            </el-upload>
            <el-button
              size="small"
              type="primary"
              class="avatar-edit-btn"
              icon="Camera"
              @click="triggerFileSelect"
            >
              更换头像
            </el-button>
          </div>

          <!-- 基础信息展示 -->
          <div class="info-content">
            <h2 class="info-title">我的信息</h2>
            <el-form :model="userInfo" label-width="80px" class="base-form">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="用户ID">
                    <el-input
                      v-model="userInfo.id"
                      disabled
                      class="info-input"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="用户名">
                    <el-input v-model="userInfo.username" class="info-input" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="性别">
                    <el-select
                      v-model="userInfo.gender"
                      class="info-input"
                      placeholder="请选择性别"
                    >
                      <el-option label="男" value="1" />
                      <el-option label="女" value="2" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="生日">
                    <el-date-picker
                      v-model="userInfo.birthday"
                      type="date"
                      placeholder="选择生日"
                      class="info-input"
                    />
                  </el-form-item>
                </el-col>
              </el-row>
            </el-form>
          </div>
        </div>
      </el-card>

      <!-- 账户与伴侣信息卡片 -->
      <el-card class="account-partner-card">
        <h2 class="card-title">账户与伴侣</h2>
        <el-row :gutter="40">
          <!-- 账户信息 -->
          <el-col :span="12">
            <h3 class="sub-title">我的账户</h3>
            <el-form
              :model="accountInfo"
              label-width="100px"
              class="account-form"
            >
              <el-form-item label="我的密码">
                <el-row :gutter="10">
                  <el-col :span="16">
                    <el-input
                      v-model="accountInfo.password"
                      type="password"
                      placeholder="••••••••"
                      class="info-input"
                    />
                  </el-col>
                  <el-col :span="8">
                    <el-button
                      type="text"
                      class="edit-btn"
                      @click="showPwdEdit = true"
                    >
                      修改
                    </el-button>
                  </el-col>
                </el-row>
              </el-form-item>
              <el-form-item label="我的邀请码">
                <el-row :gutter="10">
                  <el-col :span="16">
                    <el-input
                      v-model="accountInfo.inviteCode"
                      disabled
                      class="info-input"
                    />
                  </el-col>
                  <el-col :span="8">
                    <el-button
                      type="text"
                      class="copy-btn"
                      icon="CopyDocument"
                      @click="copyInviteCode('self')"
                    >
                      复制
                    </el-button>
                  </el-col>
                </el-row>
              </el-form-item>
            </el-form>
          </el-col>

          <!-- 伴侣信息 -->
          <el-col :span="12">
            <h3 class="sub-title">我的伴侣</h3>
            <el-form
              :model="partnerInfo"
              label-width="100px"
              class="partner-form"
            >
              <el-form-item label="伴侣ID">
                <el-input
                  v-model="partnerInfo.partnerId"
                  disabled
                  class="info-input"
                />
              </el-form-item>
              <el-form-item label="伴侣邀请码">
                <el-row :gutter="10">
                  <el-col :span="16">
                    <el-input
                      v-model="partnerInfo.partnerInviteCode"
                      disabled
                      class="info-input"
                    />
                  </el-col>
                  <el-col :span="8">
                    <el-button
                      type="text"
                      class="copy-btn"
                      icon="CopyDocument"
                      @click="copyInviteCode('partner')"
                    >
                      复制
                    </el-button>
                  </el-col>
                </el-row>
              </el-form-item>
              <el-form-item label="相识日期">
                <el-row :gutter="10">
                  <el-col :span="16">
                    <el-date-picker
                      v-model="partnerInfo.meetDate"
                      type="date"
                      class="info-input"
                    />
                  </el-col>
                  <el-col :span="8">
                    <el-button
                      type="primary"
                      size="small"
                      class="ml"
                      @click="saveMeetDate"
                    >
                      保存
                    </el-button>
                  </el-col>
                </el-row>
              </el-form-item>
            </el-form>
          </el-col>
        </el-row>
      </el-card>

      <!-- 操作按钮 -->
      <div class="btn-group">
        <el-button type="primary" class="save-btn" @click="saveAllChanges">
          保存所有修改
        </el-button>
        <el-button class="logout-btn" @click="handleLogout">
          退出登录
        </el-button>
      </div>
    </el-main>

    <!-- 页脚 -->
    <el-footer class="footer-container">
      <p class="copyright">© 2025 拾光集 - 记录我们的每一刻</p>
    </el-footer>

    <!-- 密码修改弹窗 -->
    <el-dialog
      v-model="showPwdEdit"
      title="修改密码"
      width="400px"
      @close="resetPwdForm"
    >
      <el-form
        :model="pwdForm"
        :rules="pwdRules"
        ref="pwdFormRef"
        label-width="100px"
      >
        <el-form-item label="原密码" prop="oldPwd">
          <el-input v-model="pwdForm.oldPwd" type="password" />
        </el-form-item>
        <el-form-item label="新密码" prop="newPwd">
          <el-input v-model="pwdForm.newPwd" type="password" />
        </el-form-item>
        <el-form-item label="确认新密码" prop="confirmPwd">
          <el-input v-model="pwdForm.confirmPwd" type="password" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPwdEdit = false">取消</el-button>
        <el-button type="primary" @click="submitPwdEdit">确认修改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import type { UploadInstance } from "element-plus";
import { ElMessage, ElMessageBox } from "element-plus";
import { useUserStore } from "@/store/user";
import { updatepasswordApi } from "@/api/users";
import { useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import {saveMeetDateApi,getMeetDateApi} from '@/api/meetDate'
import { uploadAvatarApi,getAvatarApi } from "@/api/avatar";
import compressImage from "@/utils/compressImage";
const userStore = useUserStore();
const { logout } = userStore;
const router = useRouter();
const { updateUserInfo } = userStore;
const { username, id, gender, birthday, partnerId, partnerInviteCode, inviteCode } = storeToRefs(userStore);

// 基础用户信息
const userInfo = reactive({
  avatar: "",
  username,
  id,
  gender,
  birthday,
});

// 账户信息
const accountInfo = reactive({
  password: "",
  inviteCode,
});

// 伴侣信息
const partnerInfo = reactive({
  partnerId,
  partnerInviteCode,
  meetDate: "",
});

// 上传组件引用
const uploadRef = ref<UploadInstance>();

// 触发文件选择器
const triggerFileSelect = () => {
  // 通过 DOM 查找 el-upload 组件内部的 input 元素并触发点击
  const uploadEl = uploadRef.value?.$el || document.querySelector('.avatar-uploader');
  const input = uploadEl?.querySelector('input[type="file"]') as HTMLInputElement;
  if (input) {
    input.click();
  }
};

// 密码修改弹窗相关
const showPwdEdit = ref(false);
const pwdFormRef = ref();
const pwdForm = reactive({
  oldPwd: "",
  newPwd: "",
  confirmPwd: "",
});

// 密码校验规则
const pwdRules = reactive({
  oldPwd: [{ required: true, message: "请输入原密码", trigger: "blur" }],
  newPwd: [
    { required: true, message: "请输入新密码", trigger: "blur" },
  ],
  confirmPwd: [
    { required: true, message: "请确认新密码", trigger: "blur" },
    {
      validator: (rule: any, value: string, callback: any) => {
        if (value !== pwdForm.newPwd) {
          callback(new Error("两次输入的密码不一致"));
        } else {
          callback();
        }
      },
      trigger: "blur",
    },
  ],
});



// 头像上传处理
const handleAvatarChange = async (file: any) => {
  if (file.raw) {
    try {
      // 先压缩图片
      const result = await compressImage(file.raw, {
        maxWidth: 800,
        maxHeight: 800,
        quality: 0.8,
        outputFormat: 'base64',
      });
      
      // 上传压缩后的图片
      const res = await uploadAvatarApi({
        avatar: result.data as string,
      });
      
      if (res.code === "0000") {
        ElMessage.success(res.message);
        // 更新头像显示
        if (res.data && res.data.avatar) {
          userInfo.avatar = res.data.avatar;
        }
      } else {
        ElMessage.error(res.message);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '上传头像失败';
      ElMessage.error(errorMessage);
      console.error(error);
    }
  }
};
const getAvatar = async () => {
  try {
    const res = await getAvatarApi();
    if (res.data && res.data.avatar) {
      userInfo.avatar = res.data.avatar;
    }
    else{
      userInfo.avatar = "https://picsum.photos/id/64/200/200";
    }
  } catch (error) {
    console.error("获取头像失败", error);
  }
};

// 复制邀请码
const copyInviteCode = (type: "self" | "partner") => {
  const code =
    type === "self" ? accountInfo.inviteCode : partnerInfo.partnerInviteCode;
  navigator.clipboard
    .writeText(code)
    .then(() => {
      ElMessage.success("邀请码复制成功");
    })
    .catch(() => {
      ElMessage.error("邀请码复制失败");
    });
};
const getMeetDate=async()=>{
  const res= await getMeetDateApi()
  partnerInfo.meetDate=res.data.meetDate

}
function isMeetDate(meetDate: string){
  const today = new Date();
  today.setHours(0,0,0,0)
  const targetDate = new Date(meetDate);
  targetDate.setHours(0,0,0,0)
  return today.getTime() >= targetDate.getTime()
}

// 保存相识日期
const saveMeetDate = async () => {
  if(!isMeetDate(partnerInfo.meetDate)){
    ElMessage.error("相识日期不能小于今天");
    return;
  }
  const res = await saveMeetDateApi({
    meetDate: partnerInfo.meetDate as string,
  });
  if (res.code === "0000") {
        ElMessage.success(res.message);
      } else {
        ElMessage.error(res.message);
      }
};

const saveAllChanges = async () => {
    const res = await updateUserInfo({
    username: userInfo.username,
    gender: userInfo.gender as string,
    birthday: userInfo.birthday ? new Date(userInfo.birthday).toISOString() : "", 
  });
  if (res.code === "0000") {
    ElMessage.success(res.message);
  } else {
    ElMessage.error(res.message);
  }
};

// 退出登录
const handleLogout = () => {
  ElMessageBox.confirm("确定要退出登录吗？", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(() => {
      ElMessage.success("退出登录成功");
      logout();
      router.push("/login");
    })
    .catch(() => {
      ElMessage.info("已取消退出");
    });
};

// 重置密码表单
const resetPwdForm = () => {
  pwdFormRef.value?.resetFields();
  pwdForm.oldPwd = "";
  pwdForm.newPwd = "";
  pwdForm.confirmPwd = "";
};

// 提交密码修改
const submitPwdEdit = () => {
  pwdFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      const res = await updatepasswordApi({
        oldPassword: pwdForm.oldPwd as string,
        newPassword: pwdForm.newPwd as string,  
      });
      if (res.code === "0000") {
        ElMessage.success(res.message);
      } else {
        ElMessage.error(res.message);
      }
      showPwdEdit.value = false;
      resetPwdForm();
    } else {
      ElMessage.error("请填写正确的密码信息");
    }
  });
};

onMounted(() => {
  // 初始化密码占位符（模拟隐藏显示）
    accountInfo.password = "********";
    getMeetDate()
    getAvatar()
});
</script>

<style lang="less" scoped>
.personal-center {
  font-family: "Microsoft YaHei", sans-serif;

  .header-container {
    background-color: #fff;
    border-bottom: 1px solid #eee;
    padding: 0;

    .header-content {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 20px;
      height: 60px;

      .logo {
        .logo-text {
          font-size: 20px;
          font-weight: bold;
          color: #ff6b81;
          margin: 0;
        }
      }

      .nav-menu {
        flex: 1;
        margin: 0 20px;
        --el-menu-active-color: #ff6b81;
        --el-menu-underline-color: #ff6b81;

        .nav-active {
          border-bottom: 2px solid #ff6b81;
          color: #ff6b81;
        }
      }

      .user-actions {
        display: flex;
        align-items: center;
        gap: 15px;

        .icon-btn {
          font-size: 20px;
          color: #666;
          cursor: pointer;
        }

        .avatar-btn {
          cursor: pointer;
          background-color: #ffe6ea;
          color: #ff6b81;
        }
      }
    }
  }

  // 主体样式
  .main-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 30px 20px;

    .base-info-card {
      margin-bottom: 20px;
      border: none;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);

      .base-info-content {
        display: flex;
        flex-direction: column;
        gap: 20px;
        @media (min-width: 768px) {
          flex-direction: row;
          align-items: center;
        }

        .avatar-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;

          .avatar-uploader {
            .avatar-img {
              width: 128px;
              height: 128px;
              border-radius: 50%;
              border: 4px solid #ffe6ea;
              object-fit: cover;
            }

            .avatar-uploader-icon {
              width: 128px;
              height: 128px;
              line-height: 128px;
              border-radius: 50%;
              border: 4px solid #ffe6ea;
              background-color: #f8f8f8;
              font-size: 40px;
              color: #ff6b81;
            }
          }

          .avatar-edit-btn {
            background-color: #ff6b81;
            border: none;
            &:hover {
              background-color: #ff4757;
            }
          }
        }

        .info-content {
          flex: 1;

          .info-title {
            font-size: 18px;
            font-weight: bold;
            color: #333;
            margin-bottom: 20px;
          }

          .base-form {
            .info-input {
              --el-input-border-color: #e5e7eb;
              --el-input-focus-border-color: #ff6b81;
            }
          }
        }
      }
    }

    .account-partner-card {
      margin-bottom: 30px;
      border: none;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);

      .card-title {
        font-size: 18px;
        font-weight: bold;
        color: #333;
        margin-bottom: 20px;
        padding-bottom: 10px;
        border-bottom: 1px solid #eee;
      }

      .sub-title {
        font-size: 16px;
        font-weight: 600;
        color: #666;
        margin-bottom: 15px;
      }

      .account-form,
      .partner-form {
        .info-input {
          --el-input-border-color: #e5e7eb;
          --el-input-focus-border-color: #ff6b81;
        }

        .edit-btn,
        .copy-btn {
          color: #ff6b81;
          &:hover {
            color: #ff4757;
          }
        }
      }
    }

    .btn-group {
      display: flex;
      justify-content: center;
      gap: 20px;

      .save-btn {
        background-color: #ff6b81;
        border: none;
        padding: 10px 30px;
        &:hover {
          background-color: #ff4757;
        }
      }

      .logout-btn {
        border-color: #ddd;
        color: #666;
        padding: 10px 30px;
        &:hover {
          background-color: #f5f5f5;
        }
      }
    }
  }

  // 页脚样式
  .footer-container {
    background-color: #fff;
    border-top: 1px solid #eee;
    text-align: center;
    padding: 20px 0;

    .copyright {
      color: #999;
      font-size: 14px;
      margin: 0;
    }
  }
}
</style>
