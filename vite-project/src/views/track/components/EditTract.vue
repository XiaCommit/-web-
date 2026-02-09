<template>
  <div class="edit-tract">
    <!-- 用 el-form 包裹所有需要验证的表单元素 -->
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="0px"
      class="form-container"
    >
      <!-- 图片上传表单项 -->
      <el-form-item prop="fileList">
        <div class="upload-container">
          <el-upload
            v-model:file-list="formData.fileList"
            action="#"
            list-type="picture-card"
            :before-upload="beforeUpload"
            :auto-upload="false"
            :show-file-list="true"
            :on-change="handleFileChange"
            :limit="8"
            :on-exceed="handleExceed"
            :on-preview="handlePictureCardPreview"
            :on-remove="handleRemove"
            :class="`upload-${formData.fileList.length}`"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
        </div>
      </el-form-item>

      <!-- 文本域表单项 -->
      <el-form-item prop="description">
        <el-input
          v-model="formData.description"
          style="width: 100%"
          :autosize="{ minRows: 10, maxRows: 20 }"
          type="textarea"
          placeholder="生活中的小美好，都该留在拾光里"
        />
      </el-form-item>

      <!-- 按钮区域 -->
      <el-form-item>
        <el-button type="success" class="mt" @click="handleSave">保存</el-button>
        <el-button type="primary" @click="handleSubmit" class="mt">提交</el-button>
      </el-form-item>
    </el-form>

    <el-dialog v-model="dialogVisible" class="dialog-image">
      <img class="image-preview" :src="dialogImageUrl" alt="Preview Image" />
    </el-dialog>
  </div>
</template>
<script setup lang="ts">
import { ref, reactive } from 'vue';
import { ElMessage, ElLoading } from 'element-plus';
import type { UploadFile, UploadFiles, FormInstance, FormRules } from 'element-plus';
import compressImage, { CompressError, CompressErrorType } from '@/utils/compressImage';
import { createTrackApi } from '@/api/track';
import { useRouter } from 'vue-router';

const router = useRouter();
const formRef = ref<FormInstance>();
const dialogVisible = ref(false);
const dialogImageUrl = ref('');
const isCompressing = ref(false); // 压缩中状态

// 表单数据
const formData = ref<{
  fileList: UploadFiles;
  description: string;
}>({
  fileList: [],
  description: '',
});

// 表单验证规则
const formRules = reactive<FormRules>({
  description: [{ required: true, message: '请输入内容', trigger: 'blur' }],
  fileList: [
    {
      validator: (_rule, _value, callback) => {
        if (formData.value.fileList.length === 0) {
          callback(new Error('请至少上传一张图片'));
        } else {
          callback();
        }
      },
      trigger: ['change', 'submit'],
    },
  ],
});

/**
 * 格式化文件大小
 */
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * 图片预览
 */
const handlePictureCardPreview = (file: UploadFile) => {
  dialogImageUrl.value = file.url || '';
  dialogVisible.value = true;
};

/**
 * 删除图片
 */
const handleRemove = (file: UploadFile) => {
  formData.value.fileList = formData.value.fileList.filter((item) => item.uid !== file.uid);
  ElMessage.success('删除成功');
};

/**
 * 超出数量限制
 */
const handleExceed = () => {
  ElMessage.error('当前最多上传 8 张图片');
};

/**
 * 文件列表变化
 */
const handleFileChange = (_file: UploadFile, fileList: UploadFiles) => {
  formData.value.fileList = fileList;
  // 触发表单校验
  formRef.value?.validateField('fileList');
};

/**
 * 上传前校验
 */
const beforeUpload = (file: File): boolean => {
  // 校验文件类型
  const isImage = file.type.startsWith('image/');
  if (!isImage) {
    ElMessage.error('只能上传图片格式的文件！');
    return false;
  }

  // 校验文件大小（5MB）
  const isLt5M = file.size / 1024 / 1024 < 5;
  if (!isLt5M) {
    ElMessage.error('上传图片大小不能超过 5MB！');
    return false;
  }

  return true;
};

/**
 * 清空表单
 */
const clearForm = () => {
  formData.value.fileList = [];
  formData.value.description = '';
  formRef.value?.resetFields();
};

/**
 * 压缩图片（带错误处理和进度提示）
 * 使用串行压缩避免大文件内存溢出
 */
const compressImages = async (): Promise<string[]> => {
  if (formData.value.fileList.length === 0) {
    return [];
  }

  isCompressing.value = true;
  const loadingInstance = ElLoading.service({
    lock: true,
    text: '正在压缩图片...',
    background: 'rgba(0, 0, 0, 0.7)',
  });

  const compressedResults: string[] = [];
  const totalFiles = formData.value.fileList.length;

  try {
    // 串行压缩，避免大文件内存溢出
    for (let index = 0; index < totalFiles; index++) {
      const uploadFile = formData.value.fileList[index];
      
      // 检查 uploadFile 是否存在
      if (!uploadFile) {
        throw new Error(`文件列表索引 ${index} 处缺少文件数据`);
      }
      
      // 保存文件名用于错误处理
      const fileName = uploadFile.name || '未知文件';
      
      // 严谨的类型判断：UploadFile.raw 属性非空校验
      if (!uploadFile.raw) {
        throw new Error(`文件 ${fileName} 缺少原始文件数据`);
      }

      // 检查 raw 是否为 File 类型
      if (!(uploadFile.raw instanceof File)) {
        throw new Error(
          `文件 ${fileName} 的原始数据不是有效的 File 对象，类型：${typeof uploadFile.raw}`
        );
      }

      try {
        // 压缩图片，使用 Base64 输出格式
        const result = await compressImage(uploadFile.raw, {
          maxWidth: 800,
          maxHeight: 800,
          quality: 0.8,
          minCompressSize: 50 * 1024, // 50KB
          outputFormat: 'base64',
          onProgress: (progress) => {
            // 更新加载提示
            const totalProgress = Math.round(
              ((index * 100 + progress) / totalFiles)
            );
            loadingInstance.setText(`正在压缩图片... ${totalProgress}%`);
          },
          correctOrientation: true,
        });

        // 打印压缩对比信息（使用真实压缩体积）
        const originalSizeStr = formatFileSize(result.originalSize);
        const compressedSizeStr = formatFileSize(result.compressedSize);
        const ratio = ((1 - result.compressionRatio) * 100).toFixed(1);
        console.log(
          `图片 ${fileName}: 原始 ${originalSizeStr} → 压缩后 ${compressedSizeStr} (压缩率 ${ratio}%)`
        );

        compressedResults.push(result.data as string);
      } catch (error) {
        // 区分不同类型的错误
        if (error instanceof CompressError) {
          let errorMessage = '';
          switch (error.type) {
            case CompressErrorType.FILE_READ_ERROR:
              errorMessage = `文件读取失败：${fileName}`;
              break;
            case CompressErrorType.IMAGE_LOAD_ERROR:
              errorMessage = `图片加载失败：${fileName}，请确认文件格式是否正确`;
              break;
            case CompressErrorType.CANVAS_ERROR:
              errorMessage = `Canvas 绘制失败：${fileName}，浏览器可能不支持`;
              break;
            case CompressErrorType.COMPRESS_ERROR:
              errorMessage = `图片压缩失败：${fileName}`;
              break;
            default:
              errorMessage = `处理图片失败：${fileName}`;
          }
          throw new Error(errorMessage);
        }
        throw error;
      }
    }

    loadingInstance.close();
    isCompressing.value = false;
    return compressedResults;
  } catch (error) {
    loadingInstance.close();
    isCompressing.value = false;

    // 压缩失败，保留上传列表不清空
    const errorMessage =
      error instanceof Error ? error.message : '图片压缩失败，请重试';
    ElMessage.error(errorMessage);
    throw error;
  }
};

/**
 * 保存（仅压缩，不提交）
 */
const handleSave = async () => {
  // 防止重复点击
  if (isCompressing.value) {
    ElMessage.warning('正在压缩中，请稍候...');
    return;
  }

  formRef.value?.validate(async (valid) => {
    if (!valid) return;

    // 无图片时拦截（表单校验也会检查，这里作为双重保障）
    if (formData.value.fileList.length === 0) {
      ElMessage.warning('请至少上传一张图片');
      return;
    }

    try {
      await compressImages();
      ElMessage.success('图片压缩完成');
    } catch (error) {
      // 错误已在 compressImages 中处理
      console.error('保存失败:', error);
    }
  });
};

/**
 * 提交
 */
const handleSubmit = async () => {
  // 防止重复点击
  if (isCompressing.value) {
    ElMessage.warning('正在压缩中，请稍候...');
    return;
  }

  formRef.value?.validate(async (valid) => {
    if (!valid) return;

    // 无图片时拦截提交（表单校验也会检查，这里作为双重保障）
    if (formData.value.fileList.length === 0) {
      ElMessage.warning('请至少上传一张图片');
      return;
    }

    try {
      // 压缩图片
      const compressedImages = await compressImages();

      // 构建提交数据
      const submitData = {
        images: compressedImages, // 压缩后的 Base64 图片数组
        description: formData.value.description, // 文本内容
      };

      // 提交到服务器
      const res = await createTrackApi(submitData);
      if (res.code === '0000') {
        ElMessage.success(res.message);
        clearForm();
        router.push('/track');
      } else {
        ElMessage.error(res.message);
      }
    } catch (error) {
      // 压缩错误已在 compressImages 中处理
      // 这里处理提交错误
      if (error instanceof Error && error.message.includes('压缩')) {
        // 压缩错误已处理，不重复提示
        return;
      }
      console.error('提交失败:', error);
      const errorMessage =
        error instanceof Error ? error.message : '提交失败，请重试';
      ElMessage.error(errorMessage);
    }
  });
};
</script>
    <style lang="less" scoped>
    .edit-tract {
        height: 100vh;
        padding: 20px;
        background-color: white;
        border-radius: 10px;
        .dialog-image {
            .image-preview {
                width: 100%;
                height: 100%;
                object-fit: contain;
            }
        }
        
        // 新增：上传组件容器，控制弹性布局
        .upload-container {
          width: 100%;
          
          // 已上传图片列表容器：固定宽度，不铺满屏幕
          // 宽度 = 4 * 200px + 3 * 16px = 848px
          :deep(.el-upload-list--picture-card) {
            display: flex;          // 启用弹性布局
            flex-wrap: wrap;        // 自动换行
            gap: 16px;              // 图片之间的间距
            margin-bottom: 10px;    // 与加号按钮的间距
            width: 848px;           // 固定宽度：4 * 200px + 3 * 16px
          }
          
          // 控制加号按钮的位置，和图片对齐
          :deep(.el-upload--picture-card) {
            width: 200px;           // 固定宽度200px
            height: 200px;          // 固定高度200px
            flex: 0 0 200px;        // 固定宽度，不伸缩
            box-sizing: border-box;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          :deep(.upload-8 .el-upload--picture-card) {
            display: none !important;
          }
        }
        
        // 调整已上传图片的容器大小和布局
        :deep(.el-upload-list--picture-card .el-upload-list__item) {
            width: 200px;           // 固定宽度200px
            height: 200px;          // 固定高度200px
            flex: 0 0 200px;        // 固定宽度，确保一行4个
            margin: 0 !important;   // 清除默认margin
            box-sizing: border-box;
        }
        
        // 确保图片在容器内正确显示
        :deep(.el-upload-list__item-thumbnail) {
            width: 100%;
            height: 100%;
            object-fit: cover; // 保持图片比例，裁剪超出部分
            // 如果想要完整显示图片（不裁剪），可以使用：
            // object-fit: contain;
        }
        
        // 调整删除按钮的位置，使其适配新的容器大小
        :deep(.el-upload-list__item-delete) {
            font-size: 20px;
        }
    }
    </style>