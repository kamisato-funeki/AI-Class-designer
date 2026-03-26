<template>
  <div class="class-homework-container">
    <!-- 业务逻辑说明：
         1. selectedHomework 为 null 时，展示作业列表视图 (HomeworkListView)
         2. selectedHomework 有值时，展示作业详情视图 (HomeworkDetailView)
    -->
    
    <!-- 一级展示：作业分组列表 -->
    <HomeworkListView
      v-if="!selectedHomework"
      :homeworks="classesStore.currentHomeworks"
      @view-detail="handleViewDetail"
    />

    <!-- 二级展示：具体作业详情 -->
    <HomeworkDetailView
      v-else
      :homework="selectedHomework"
      @back="backToList"
      @edit="openEditModal"
      @delete="handleDelete"
      @view-submission="handleViewSubmission"
      @download-attachment="handleDownloadAttachment"
    />

    <!-- 弹窗组件：查看/批阅学生提交记录 -->
    <SubmissionModal
      v-model:open="submissionVisible"
      :submission="selectedSubmission"
      :homeworkId="selectedHomework?.id || ''"
      :classId="classesStore.currentClass?.id || ''"
      @saved="handleSubmissionUpdated"
      @download-attachment="handleDownloadAttachment"
    />

    <!-- 弹窗组件：修改作业信息 -->
    <EditHomeworkModal
      v-model:open="editVisible"
      :homework="selectedHomework"
      @saved="handleHomeworkUpdated"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * 班级作业主控组件
 * 核心逻辑：
 * 1. 作为业务容器，协调 “列表视图” 与 “详情视图” 的切换。
 * 2. 管理全局选中的作业对象 (selectedHomework) 以及选中的学生提交记录。
 * 3. 封装通用的 API 交互，如删除作业、下载附件。
 * 4. 监听班级切换，自动重置视图状态。
 */

import { ref, watch } from 'vue';
import { useClassesStore } from '../../stores/classesStore';
import type { HomeworkInfo } from '../../types/types';
import { message } from 'ant-design-vue';
import { apiDownloadHomeworkAttachment } from '../../api/class';

// 引入拆分后的子组件
import HomeworkListView from './homework/HomeworkListView.vue';
import HomeworkDetailView from './homework/HomeworkDetailView.vue';
import SubmissionModal from './homework/SubmissionModal.vue';
import EditHomeworkModal from './homework/EditHomeworkModal.vue';

// --- 状态定义 (Variables) ---

const classesStore = useClassesStore();

/** 
 * 当前被选中的作业对象。如果为 null，则显示列表页；否则进入详情页。
 */
const selectedHomework = ref<HomeworkInfo | null>(null);

/** 
 * 学生提交详情弹窗的可见性控制
 */
const submissionVisible = ref(false);

/** 
 * 修改作业弹窗的可见性控制
 */
const editVisible = ref(false);

/** 
 * 当前正在查看的学生提交记录对象
 */
const selectedSubmission = ref<HomeworkInfo['studentStats'][number] | null>(null);

// --- 业务方法 (Functions) ---

/**
 * [函数含义] 进入作业详情页
 * [参数说明] hw: 点击的作业完整对象
 */
const handleViewDetail = (hw: HomeworkInfo) => {
  selectedHomework.value = hw;
};

/**
 * [函数含义] 返回作业列表页
 */
const backToList = () => {
  selectedHomework.value = null;
};

/**
 * [函数含义] 打开作业修改弹窗
 */
const openEditModal = () => {
  editVisible.value = true;
};

/**
 * [函数含义] 处理作业信息保存成功后的回调
 * [参数说明] updatedHw: 子组件传递回来的更新后的作业对象
 */
const handleHomeworkUpdated = (updatedHw: HomeworkInfo) => {
  selectedHomework.value = updatedHw;
};

/**
 * [函数含义] 获取并下载作业附件 (通用的下载逻辑)
 * [参数说明] att: 附件对象，包含文件名 (name) 和下载链接 (url)
 */
const handleDownloadAttachment = async (att: { name: string; url: string }) => {
  try {
    message.loading({ content: '准备下载中...', key: 'downloading' });
    const blob = await apiDownloadHomeworkAttachment(att.url, att.name);
    
    // 创建虚拟链接触发浏览器下载
    const tempUrl = window.URL.createObjectURL(new Blob([blob as BlobPart]));
    const link = document.createElement('a');
    link.href = tempUrl;
    link.setAttribute('download', att.name);
    document.body.appendChild(link);
    link.click();
    
    // 清理临时资源
    document.body.removeChild(link);
    window.URL.revokeObjectURL(tempUrl);
    
    message.success({ content: '下载成功', key: 'downloading' });
  } catch (err) {
    console.error('附件下载失败:', err);
    message.error({ content: '下载失败，链接可能已过期或无效', key: 'downloading' });
  }
};

/**
 * [函数含义] 查看特定学生的提交物详情
 * [参数说明] record: 表格行数据，包含学生姓名、分数、内容等
 */
const handleViewSubmission = (record: HomeworkInfo['studentStats'][number]) => {
  selectedSubmission.value = record;
  submissionVisible.value = true;
};

/**
 * [函数含义] 当学生批阅结果(成绩/评价)保存成功后的本地状态同步
 * [参数说明] data: 包含更新后的 grade 和 evaluation
 */
const handleSubmissionUpdated = (data: { grade: number; evaluation: string }) => {
  if (selectedSubmission.value) {
    selectedSubmission.value.grade = data.grade;
    selectedSubmission.value.evaluation = data.evaluation;
  }
};

/**
 * [函数含义] 删除当前选中的作业
 * [业务逻辑] 调用 store 删除接口，成功后清空选中状态回到列表。
 */
const handleDelete = async () => {
  if (selectedHomework.value && classesStore.currentClass) {
    try {
      await classesStore.deleteHomework(classesStore.currentClass.id, selectedHomework.value.id);
      message.success('该作业已从系统中移除');
      backToList();
    } catch (error) {
      console.error('删除作业失败:', error);
      message.error('删除操作遇到异常，请检查网络');
    }
  }
};

/**
 * [监听器] 如果班级被全局切换，自动重置到作业列表页，防止数据显示混乱。
 */
watch(() => classesStore.currentClass, () => {
  backToList();
});

</script>

<style scoped>
/* 容器采用 Flex 布局，撑满父级高度 */
.class-homework-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 0 16px;
}
</style>
