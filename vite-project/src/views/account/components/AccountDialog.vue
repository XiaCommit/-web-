<template>
  <el-dialog
    :model-value="dialogVisible"
    :title="title"
    width="400px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    @close="handleCancel"
  >
    <el-form
      label-width="80px"
      :model="newAccountForm"
      ref="accountFormRef"
      :rules="rules"
    >
      <el-form-item label="账单名称" prop="name">
        <el-input placeholder="例如：看电影" v-model="newAccountForm.name" />
      </el-form-item>
      <el-form-item label="账单金额" prop="account">
        <el-input placeholder="例如：50" v-model="newAccountForm.account" />
      </el-form-item>
      <el-form-item label="账单类型" prop="accountType">
        <el-select
          placeholder="请选择账单类型"
          v-model="newAccountForm.accountType"
        >
          <el-option label="购物" :value="1"></el-option>
          <el-option label="饮食" :value="2"></el-option>
          <el-option label="娱乐" :value="3"></el-option>
          <el-option label="交通" :value="4"></el-option>
          <el-option label="其他" :value="5"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="日期" prop="date">
        <el-date-picker
          v-model="newAccountForm.date"
          type="date"
          placeholder="选择日期"
          format="YYYY年MM月DD日"
          value-format="YYYY年MM月DD日"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input
          type="textarea"
          placeholder="可选：添加一些备注信息"
          :rows="3"
          v-model="newAccountForm.remark"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleConfirm">{{
        btncontent
      }}</el-button>
    </template>
  </el-dialog>
</template>
<script setup>
import { ref, reactive, watch } from "vue";
import { ElMessage } from "element-plus";
import { useAccountDateStore } from "@/store/accountDate";
import { storeToRefs } from "pinia";
import { createAccountApi,updateAccountApi } from "@/api/account";
const accountDateStore = useAccountDateStore();
const { accountDate } = storeToRefs(accountDateStore);

const props = defineProps({
  dialogVisible: {
    type: Boolean,
    required: true,
  },
  isadd: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits(["close", "reload"]);
const title = ref("");
const btncontent = ref("");

const accountFormRef = ref(null);
const newAccountForm = ref({
  name: "",
  account: null,
  accountType: null,
  date: "",
  remark: "",
});
const rules = reactive({
  name: [
    { required: true, message: "请输入账单名称", trigger: "blur" },
    { min: 2, max: 20, message: "名称长度在 2 到 20 个字符", trigger: "blur" },
  ],
  account: [{ required: true, message: "请输入账单金额", trigger: "blur" }],
  accountType: [{ required: true, message: "请选择账单类型", trigger: "blur" }],
  date: [{ required: true, message: "请选择日期", trigger: "blur" }],
});

watch(
  [() => props.isadd, accountDate],
  ([isAdd]) => {
    if (isAdd) {
      title.value = "添加重要日子";
      btncontent.value = "确认添加";
      newAccountForm.value = {
        name: "",
        account: null,
        accountType: null,
        date: "",
        remark: "",
      };
    } else {
      title.value = "编辑重要日子";
      btncontent.value = "确认修改";
      if (accountDate.value) {
        newAccountForm.value = {
          name: accountDate.value.name || "",
          account: accountDate.value.account || 0,
          accountType: accountDate.value.accountType || 1,
          date: accountDate.value.date || "",
          remark: accountDate.value.remark || "",
        };
      }
    }
  },
  { immediate: true }
);

const handleCancel = () => {
  emit("close");
  accountFormRef.value?.resetFields();
};

const handleConfirm = () => {
  accountFormRef.value?.validate(async (valid) => {
    if (valid) {
      if (props.isadd) {
        const res = await createAccountApi(newAccountForm.value);
        console.log(res);
        if (res.code === "0000") {
          ElMessage({
            message: res.message,
            type: "success",
          });
          handleCancel();
          emit("reload");
        }
      } else {
        const res = await updateAccountApi(accountDate.value.id, newAccountForm.value);
        if (res.code === "0000") {
          ElMessage({
            message: res.message,
            type: "success",
          });
          handleCancel();
          emit("reload");
        }
        
      }
    }
  });
};
</script>
