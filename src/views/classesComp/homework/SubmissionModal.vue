<template>
  <!-- 学生作业详情与批阅模态框 -->
  <a-modal 
    :open="open" 
    :title="`${submission?.name} 的作业提取与批阅`" 
    :footer="null" 
    :width="650" 
    @update:open="$emit('update:open', $event)"
    @cancel="cancelEditEvalMode"
  >
    <div v-if="submission" class="submission-detail-card">
      <!-- 上方：学生提交物展示区 -->
      <div class="submission-content-section" style="margin-bottom: 24px;">
        <h3 class="section-title">学生提交明细</h3>
        <div class="submitted-text">
          {{ submission.submittedContent || '该学生未留下任何文本内容提示。' }}
        </div>
        <!-- 学生上传的附件 -->
        <div v-if="submission.attachments && submission.attachments.length > 0">
          <strong class="attachment-label"><PaperClipOutlined /> 学生附带文件：</strong>
          <div class="attachment-tags">
            <a-tooltip title="点击下载该附件" v-for="(att, idx) in submission.attachments" :key="idx">
              <a-tag color="cyan" class="clickable-tag" @click.stop="$emit('download-attachment', att)">
                {{ att.name }}
              </a-tag>
            </a-tooltip>
          </div>
        </div>
      </div>

      <a-divider />

      <!-- 下方：教师批阅与反馈区 -->
      <div class="evaluation-section">
        <div class="evaluation-header">
          <h3 class="section-title">您的批改与反馈</h3>
          <a-button type="primary" ghost size="small" @click="toggleEditEvalMode" v-if="!editEvalMode">
            修改成绩与评价
          </a-button>
        </div>

        <!-- 查看模式：展示当前成绩和寄语 -->
        <div v-if="!editEvalMode" class="view-mode-card">
          <div class="grade-display">
            <span class="label">本次综合得分：</span>
            <span class="grade-value" :style="{ color: getGradeColor(submission.grade) }">
              {{ submission.grade }} 分
            </span>
          </div>
          <div class="evaluation-display">
            <div class="label">发送给学生的寄语：</div>
            <div class="evaluation-content">
              {{ submission.evaluation || '当前暂无针对该同学的具体评价' }}
            </div>
          </div>
        </div>

        <!-- 编辑模式：提供评分输入和评价文本域 -->
        <div v-else class="edit-mode-card">
          <a-form layout="vertical">
            <a-form-item label="学生最终得分 (0-100)" required>
              <a-input-number v-model:value="evalEditForm.grade" :min="0" :max="100" style="width: 150px;" />
            </a-form-item>
            <a-form-item label="补充详细评价寄语">
              <a-textarea v-model:value="evalEditForm.evaluation" :rows="3" placeholder="请输入对该学生作业的客观评价与指导..." />
            </a-form-item>
            <div class="form-actions">
              <a-button @click="cancelEditEvalMode">取消</a-button>
              <a-button type="primary" :loading="saving" @click="handleSave">保存批阅结果</a-button>
            </div>
          </a-form>
        </div>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
/**
 * 学生提交物详情与批阅组件
 * 功能：
 * 1. 展示学生提交的文本和附件
 * 2. 提供教师在线批改功能（修改分数和评价）
 * 3. 封装本地编辑状态，保存后通过事件通知父级更新
 */

import { ref, watch } from 'vue';
import { PaperClipOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import { useClassesStore } from '../../../stores/classesStore';
import type { HomeworkInfo } from '../../../types/types';

// 定义属性
const props = defineProps<{
  /** 模态框是否开启 */
  open: boolean;
  /** 当前选中的学生提交记录 */
  submission: HomeworkInfo['studentStats'][number] | null;
  /** 所属作业 ID */
  homeworkId: string;
  /** 所属班级 ID */
  classId: string;
}>();

// 定义事件
const emit = defineEmits<{
  (e: 'update:open', val: boolean): void;
  (e: 'saved', data: { grade: number; evaluation: string }): void;
  (e: 'download-attachment', att: { name: string, url: string }): void;
}>();

const classesStore = useClassesStore();

// 内部交互状态
const editEvalMode = ref(false); // 是否处于编辑评价模式
const saving = ref(false); // 保存按钮 loading 状态
const evalEditForm = ref({ grade: 0, evaluation: '' }); // 评价表单数据

/**
 * 切换到编辑模式，并初始化表单数据为当前记录的值
 */
const toggleEditEvalMode = () => {
  if (props.submission) {
    evalEditForm.value = {
      grade: props.submission.grade,
      evaluation: props.submission.evaluation || ''
    };
    editEvalMode.value = true;
  }
};

/**
 * 取消编辑模式
 */
const cancelEditEvalMode = () => {
  editEvalMode.value = false;
};

/**
 * 根据成绩分值获取对应的显示颜色
 */
const getGradeColor = (grade: number) => {
  if (grade >= 90) return '#52c41a'; // 优秀-绿色
  if (grade >= 60) return '#1890ff'; // 及格-蓝色
  return '#f5222d'; // 不及格-红色
};

/**
 * 业务逻辑：保存评价结果
 * 1. 校验评分合法性
 * 2. 调用 store 更新接口
 * 3. 成功后触发 'saved' 事件并关闭编辑模式
 */
const handleSave = async () => {
  if (!props.submission || !props.homeworkId || !props.classId) return;
  if (evalEditForm.value.grade === null || evalEditForm.value.grade === undefined) {
    return message.warning('评分不能为空');
  }

  saving.value = true;
  try {
    await classesStore.updateStudentEvaluation(
      props.classId,
      props.homeworkId,
      props.submission.studentId,
      { grade: evalEditForm.value.grade, evaluation: evalEditForm.value.evaluation }
    );
    
    // 通知父组件数据已更新
    emit('saved', { 
      grade: evalEditForm.value.grade, 
      evaluation: evalEditForm.value.evaluation 
    });
    
    editEvalMode.value = false;
    message.success('学生作业批阅结果已妥善保存！');
  } catch (error) {
    console.error(error);
    message.error('批阅保存失败');
  } finally {
    saving.value = false;
  }
};

// 监听弹窗关闭，自动退出编辑模式
watch(() => props.open, (newVal) => {
  if (!newVal) {
    editEvalMode.value = false;
  }
});

</script>

<style scoped>
.section-title {
  color: var(--app-text-main); 
  font-weight: bold; 
  margin-bottom: 12px;
}

.submitted-text {
  background-color: var(--app-hover); 
  padding: 16px; 
  border-radius: 8px; 
  color: var(--app-text-main); 
  white-space: pre-wrap; 
  line-height: 1.6; 
  margin-bottom: 16px; 
  border: 1px solid var(--app-border);
}

.attachment-label {
  color: var(--app-text-main);
}

.attachment-tags {
  margin-top: 8px; 
  display: flex; 
  gap: 8px; 
  flex-wrap: wrap;
}

.clickable-tag {
  cursor: pointer;
}

.evaluation-header {
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  margin-bottom: 16px;
}

.view-mode-card {
  background-color: var(--app-panel); 
  border: 1px solid var(--app-border); 
  padding: 16px; 
  border-radius: 8px;
}

.grade-display {
  margin-bottom: 16px; 
  font-size: 16px;
}

.grade-value {
  font-size: 20px; 
  font-weight: bold;
}

.label {
  color: var(--app-text-sub); 
  margin-bottom: 8px;
}

.evaluation-content {
  color: var(--color-primary); 
  white-space: pre-wrap; 
  line-height: 1.6; 
  background: rgba(8, 145, 178, 0.05); 
  padding: 12px; 
  border-radius: 6px;
}

.edit-mode-card {
  background-color: var(--app-panel); 
  padding: 16px; 
  border-radius: 8px; 
  border: 1px solid var(--color-primary);
}

.form-actions {
  display: flex; 
  justify-content: flex-end; 
  gap: 8px; 
  margin-top: 16px;
}
</style>
