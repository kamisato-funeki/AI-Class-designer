<template>
  <!-- 修改作业信息的模态框 -->
  <a-modal 
    :open="open" 
    title="修改作业" 
    @ok="handleSave" 
    @update:open="$emit('update:open', $event)"
    :confirmLoading="saving"
  >
    <a-form layout="vertical">
      <!-- 作业名称输入 -->
      <a-form-item label="作业标题" required>
        <a-input v-model:value="form.title" placeholder="请输入作业标题" />
      </a-form-item>
      
      <!-- 截止日期选择 -->
      <a-form-item label="截止日期" required>
        <a-date-picker 
          v-model:value="form.dueDate" 
          show-time 
          format="YYYY-MM-DD HH:mm:ss" 
          style="width: 100%;" 
          placeholder="请选择截止日期"
        />
      </a-form-item>
      
      <!-- 附件上传管理 -->
      <a-form-item label="附件管理 (选填)">
        <a-upload 
          v-model:file-list="fileList" 
          name="file" 
          :before-upload="() => false"
        >
          <a-button>
            <UploadOutlined /> 上传新附件
          </a-button>
        </a-upload>
      </a-form-item>
      
      <!-- 作业描述文本域 -->
      <a-form-item label="作业描述" required>
        <a-textarea v-model:value="form.description" :rows="4" placeholder="请输入作业的具体要求和描述" />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
/**
 * 修改作业信息弹窗组件
 * 功能：
 * 1. 初始加载时将当前作业数据同步至表单
 * 2. 处理表单校验逻辑
 * 3. 提交修改后的数据到服务器/Store
 * 4. 管理附件列表状态
 */

import { ref, watch } from 'vue';
import { UploadOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import type { HomeworkInfo } from '../../../types/types';
import { useClassesStore } from '../../../stores/classesStore';

// 定义属性
const props = defineProps<{
  /** 弹窗显隐状态 */
  open: boolean;
  /** 被修改的原始作业数据 */
  homework: HomeworkInfo | null;
}>();

// 定义事件
const emit = defineEmits<{
  (e: 'update:open', val: boolean): void;
  /** 成功保存后触发，携带更新后的完整数据 */
  (e: 'saved', updatedHw: HomeworkInfo): void;
}>();

const classesStore = useClassesStore();

// 内部表单状态
const saving = ref(false); // 提交时的 Loading 状态
const form = ref<{ title: string; dueDate: Dayjs | null; description: string }>({
  title: '',
  dueDate: null,
  description: ''
});

/**
 * 附件列表 state
 * 包含已经在服务器上的附件和本地新上传的附件
 */
const fileList = ref<{ uid: string; name: string; status: string; url?: string }[]>([]);

/**
 * 核心逻辑：侦听属性变化
 * 当弹窗打开且有作业数据时，同步数据到表单
 */
watch(() => props.open, (newVal) => {
  if (newVal && props.homework) {
    form.value = {
      title: props.homework.title,
      dueDate: props.homework.dueDate ? dayjs(props.homework.dueDate) : null,
      description: props.homework.description
    };
    
    // 初始化附件列表
    fileList.value = (props.homework.attachments || []).map(att => ({
      uid: att.url,
      name: att.name,
      status: 'done',
      url: att.url,
    }));
  }
}, { immediate: true });

/**
 * 业务逻辑：保存表单修改
 * 1. 校验必填项
 * 2. 格式化日期和附件数据
 * 3. 调用 store 更新作业接口
 * 4. 成功后触发 'saved' 并关闭弹窗
 */
const handleSave = async () => {
  if (!form.value.title || !form.value.dueDate || !form.value.description) {
    return message.warning('请填写所有必填项');
  }

  if (props.homework && classesStore.currentClass) {
    saving.value = true;
    try {
      // 处理附件列表，提取有效的文件信息
      const finalAttachments = fileList.value.map(f => ({ 
        name: f.name, 
        url: f.url || '#' 
      }));

      const updatedPayload = {
        title: form.value.title,
        dueDate: form.value.dueDate.format('YYYY-MM-DD HH:mm:ss'),
        description: form.value.description,
        attachments: finalAttachments
      };

      // 调用接口保存
      await classesStore.updateHomework(props.homework.id, updatedPayload);

      // 返回更新后的完整对象给父组件，以便更新本地状态
      const resultHw: HomeworkInfo = {
        ...props.homework,
        ...updatedPayload
      };

      message.success('作业信息修改成功');
      emit('saved', resultHw);
      emit('update:open', false);
    } catch (error) {
      console.error(error);
      message.error('修改作业失败，请稍后重试');
    } finally {
      saving.value = false;
    }
  }
};
</script>

<style scoped>
/* 弹窗内的上传按钮美化 */
:deep(.ant-upload-list-item-name) {
  color: var(--app-text-main) !important;
}
</style>
