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
      :model="newDayForm"
      ref="dayFormRef"
      :rules="rules"
    >
      <el-form-item label="日子名称" prop="name">
        <el-input placeholder="例如：第一次约会" v-model="newDayForm.name" />
      </el-form-item>
      <el-form-item label="日期" prop="date">
        <el-date-picker
          v-model="newDayForm.date"
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
          v-model="newDayForm.remark"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button :type="primary" @click="handleConfirm">{{
        btncontent
      }}</el-button>
    </template>
  </el-dialog>
</template>
<script setup>
import { ref, reactive, watch } from "vue";
import { ElMessage } from "element-plus";
import { creatImportDateApi, updateImportantDateApi } from "@/api/importDate";
import { useimportDateStore } from "@/store/importDate";
import { storeToRefs } from "pinia";

const importStore = useimportDateStore();
const { importDay } = storeToRefs(importStore);

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

const dayFormRef = ref(null);
const newDayForm = ref({
  name: "",
  date: "",
  remark: "",
});
const rules = reactive({
  name: [
    { required: true, message: "请输入日子名称", trigger: "blur" },
    { min: 2, max: 20, message: "名称长度在 2 到 20 个字符", trigger: "blur" },
  ],
  date: [{ required: true, message: "请选择日期", trigger: "blur" }],
});

watch(
  [() => props.isadd, importDay],
  ([isAdd]) => {
    if (isAdd) {
      title.value = "添加重要日子";
      btncontent.value = "确认添加";
      newDayForm.value = { name: "", date: "", remark: "" };
    } else {
      title.value = "编辑重要日子";
      btncontent.value = "确认修改";
      if (importDay.value) {
        newDayForm.value = {
          name: importDay.value.name || "",
          date: importDay.value.date || "",
          remark: importDay.value.remark || "",
        };
      }
    }
  },
  { immediate: true }
);

const handleCancel = () => {
  emit("close");
  dayFormRef.value?.resetFields();
};

const handleConfirm = () => {
  dayFormRef.value?.validate(async (valid) => {
    if (valid) {
      if (props.isadd) {
        const res = await creatImportDateApi(newDayForm.value);
        if (res.code == "0000") {
          ElMessage({
            message: res.message,
            type: "success",
          });
          handleCancel();
          emit("reload");
        }
      } else {
        const res = await updateImportantDateApi(
          importDay.value.id,
          newDayForm.value
        );
        console.log(res);
        if (res.code == "0000") {
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
