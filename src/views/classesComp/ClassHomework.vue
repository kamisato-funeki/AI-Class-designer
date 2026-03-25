<!--
  班级作业组件
  实现业务逻辑：
  1. 列表展示班级内的所有作业，以布置日期分组显示。
  2. 点击具体作业，切换进入二级详情界面，列表和详情互斥显示。
  3. 详情包含图表展示完成人员分布与成绩数据，并提供修改和删除操作。
-->
<template>
  <div class="class-homework-container">
    <!-- 一级菜单：作业列表 -->
    <div v-if="!selectedHomework" class="homework-list-view">
      <div v-if="groupedHomeworks.length === 0" class="empty-state">
        <a-empty description="暂无班级作业" />
      </div>

      <div v-for="group in groupedHomeworks" :key="group.date" class="homework-group">
        <a-divider orientation="left" style="font-size: 14px; color: gray;">{{ group.date }}</a-divider>
        <a-list :dataSource="group.items" itemLayout="horizontal" class="custom-list">
          <template #renderItem="{ item }">
            <a-list-item class="homework-item" @click="viewDetail(item)">
              <a-list-item-meta :description="`截止时间: ${item.dueDate || '无'}`">
                <template #title>
                  <span class="homework-title">{{ item.title }}</span>
                </template>
                <template #avatar>
                  <a-avatar style="background-color: var(--color-primary);">
                    <template #icon><FileTextOutlined /></template>
                  </a-avatar>
                </template>
              </a-list-item-meta>
              <div class="homework-extra">
                <div class="status-badge" :class="{ 'all-completed': item.completedCount === item.totalCount }">
                  完成进度: {{ item.completedCount }} / {{ item.totalCount }}
                </div>
              </div>
            </a-list-item>
          </template>
        </a-list>
      </div>
    </div>

    <!-- 二级菜单：作业详情 -->
    <div v-else class="homework-detail-view">
      <!-- 顶部导航 -->
      <div class="detail-header">
        <a-button type="link" @click="backToList" style="padding-left: 0;">
          <template #icon><ArrowLeftOutlined /></template>
          返回列表
        </a-button>
        <a-space>
          <a-button size="small" @click="openEditModal">修改</a-button>
          <a-popconfirm title="确定要删除该作业吗？" @confirm="handleDelete">
            <a-button size="small" danger>删除</a-button>
          </a-popconfirm>
        </a-space>
      </div>

      <div class="detail-body">
        <div class="homework-overview">
          <h2 class="title">{{ selectedHomework.title }}</h2>
          <div class="meta-info">
            <a-tag color="blue">布置日期: {{ selectedHomework.createTime }}</a-tag>
            <a-tag color="volcano" v-if="selectedHomework.dueDate">截止日期: {{ selectedHomework.dueDate }}</a-tag>
          </div>
          <div class="description-box">
            <p>{{ selectedHomework.description }}</p>
          </div>
          <div class="attachments" v-if="selectedHomework.attachments && selectedHomework.attachments.length > 0">
            <strong><PaperClipOutlined /> 附件：</strong>
            <div class="attachment-list">
              <a-tooltip title="点击下载" v-for="(att, idx) in selectedHomework.attachments" :key="idx">
                <a-tag color="cyan" style="cursor: pointer;" @click.stop="handleDownloadAttachment(att)">
                  {{ att.name }}
                </a-tag>
              </a-tooltip>
            </div>
          </div>
        </div>

        <a-divider />

        <div class="completion-stats">
          <h3>完成情况统计</h3>
          <div class="stats-row">
            <!-- ECharts 图表展示 -->
            <div class="chart-container">
              <v-chart class="chart" :option="chartOption" autoresize />
            </div>

            <!-- 完成学生列表表格 -->
            <div class="students-table">
              <a-table :dataSource="selectedHomework.studentStats" :columns="columns" size="small" :pagination="{ pageSize: 5 }">
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'name'">
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <a-avatar :src="record.avatar" size="small" />
                      {{ record.name }}
                    </div>
                  </template>
                  <template v-if="column.key === 'grade'">
                    <span :style="{ color: record.grade >= 90 ? '#52c41a' : record.grade >= 60 ? '#1890ff' : '#f5222d' }">
                      {{ record.grade }} 分
                    </span>
                  </template>
                  <template v-if="column.key === 'action'">
                    <a-button type="link" size="small" @click="viewSubmission(record)">查看详情</a-button>
                  </template>
                </template>
              </a-table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 查看学生作业详情模态框 -->
    <a-modal v-model:open="submissionVisible" :title="`${selectedSubmission?.name} 的作业提取与批阅`" :footer="null" :width="650" @cancel="cancelEditEvalMode">
      <div v-if="selectedSubmission" class="submission-detail-card">
        <!-- 上方：学生提交物 -->
        <div class="submission-content-section" style="margin-bottom: 24px;">
          <h3 style="color: var(--app-text-main); font-weight: bold; margin-bottom: 12px;">学生提交明细</h3>
          <div style="background-color: var(--app-hover); padding: 16px; border-radius: 8px; color: var(--app-text-main); white-space: pre-wrap; line-height: 1.6; margin-bottom: 16px; border: 1px solid var(--app-border);">
            {{ selectedSubmission.submittedContent || '该学生未留下任何文本内容提示。' }}
          </div>
          <div v-if="selectedSubmission.attachments && selectedSubmission.attachments.length > 0">
            <strong style="color: var(--app-text-main);"><PaperClipOutlined /> 学生附带文件：</strong>
            <div style="margin-top: 8px; display: flex; gap: 8px; flex-wrap: wrap;">
              <a-tooltip title="点击下载该附件" v-for="(att, idx) in selectedSubmission.attachments" :key="idx">
                <a-tag color="cyan" style="cursor: pointer;" @click.stop="handleDownloadAttachment(att as { name: string, url: string })">
                  {{ att.name }}
                </a-tag>
              </a-tooltip>
            </div>
          </div>
        </div>

        <a-divider />

        <!-- 下方：教师批阅指引 -->
        <div class="evaluation-section">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3 style="color: var(--app-text-main); font-weight: bold; margin: 0;">您的批改与反馈</h3>
            <a-button type="primary" ghost size="small" @click="toggleEditEvalMode" v-if="!editEvalMode">修改成绩与评价</a-button>
          </div>

          <!-- 展示模式 -->
          <div v-if="!editEvalMode" style="background-color: var(--app-panel); border: 1px solid var(--app-border); padding: 16px; border-radius: 8px;">
            <div style="margin-bottom: 16px; font-size: 16px;">
              <span style="color: var(--app-text-sub);">本次综合得分：</span>
              <span :style="{ fontSize: '20px', fontWeight: 'bold', color: (selectedSubmission.grade as number) >= 90 ? '#52c41a' : (selectedSubmission.grade as number) >= 60 ? '#1890ff' : '#f5222d' }">
                {{ selectedSubmission.grade }} 分
              </span>
            </div>
            <div>
              <div style="color: var(--app-text-sub); margin-bottom: 8px;">发送给学生的寄语：</div>
              <div style="color: var(--color-primary); white-space: pre-wrap; line-height: 1.6; background: rgba(8, 145, 178, 0.05); padding: 12px; border-radius: 6px;">{{ selectedSubmission.evaluation || '当前暂无针对该同学的具体评价' }}</div>
            </div>
          </div>

          <!-- 编辑模式 -->
          <div v-else style="background-color: var(--app-panel); padding: 16px; border-radius: 8px; border: 1px solid var(--color-primary);">
            <a-form layout="vertical">
              <a-form-item label="学生最终得分 (0-100)" required>
                <a-input-number v-model:value="evalEditForm.grade" :min="0" :max="100" style="width: 150px;" />
              </a-form-item>
              <a-form-item label="补充详细评价寄语">
                <a-textarea v-model:value="evalEditForm.evaluation" :rows="3" placeholder="请输入对该学生作业的客观评价与指导..." />
              </a-form-item>
              <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px;">
                <a-button @click="cancelEditEvalMode">取消</a-button>
                <a-button type="primary" :loading="evalSaving" @click="saveEvaluation">保存批阅结果</a-button>
              </div>
            </a-form>
          </div>
        </div>
      </div>
    </a-modal>

    <!-- 修改作业模态框 -->
    <a-modal v-model:open="editVisible" title="修改作业" @ok="handleEditSave">
      <a-form layout="vertical">
        <a-form-item label="作业标题" required>
          <a-input v-model:value="editForm.title" />
        </a-form-item>
        <a-form-item label="截止日期" required>
          <a-date-picker v-model:value="editForm.dueDate" show-time format="YYYY-MM-DD HH:mm:ss" style="width: 100%;" />
        </a-form-item>
        <a-form-item label="附件管理 (选填)">
          <a-upload v-model:file-list="editFileList" name="file" :before-upload="() => false">
            <a-button>上传新附件</a-button>
          </a-upload>
        </a-form-item>
        <a-form-item label="作业描述" required>
          <a-textarea v-model:value="editForm.description" :rows="4" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useClassesStore } from '../../stores/classesStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { ArrowLeftOutlined, FileTextOutlined, PaperClipOutlined } from '@ant-design/icons-vue';
import type { HomeworkInfo } from '../../types/types';
import dayjs from 'dayjs';
import { message } from 'ant-design-vue';
import type { Dayjs } from 'dayjs';
import { apiDownloadHomeworkAttachment } from '../../api/class';

// 按需引入 ECharts
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { PieChart, BarChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components';
import VChart from 'vue-echarts';

use([CanvasRenderer, PieChart, BarChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent]);

const classesStore = useClassesStore();
const settingsStore = useSettingsStore();

// 状态控制
const selectedHomework = ref<HomeworkInfo | null>(null);

// 表格列定义
const columns = [
  { title: '学生', dataIndex: 'name', key: 'name', width: 100 },
  { title: '成绩', dataIndex: 'grade', key: 'grade', width: 80, sorter: (a: { grade: number }, b: { grade: number }) => a.grade - b.grade },
  { title: '操作', key: 'action', width: 100, align: 'center' }
];

/**
 * 【计算属性】将作业列表按日期分组
 */
const groupedHomeworks = computed(() => {
  const homeworks = classesStore.currentHomeworks;
  const map = new Map<string, HomeworkInfo[]>();

  // 按照 createTime 排序（最新的在前）
  const sorted = [...homeworks].sort((a, b) => dayjs(b.createTime).valueOf() - dayjs(a.createTime).valueOf());

  sorted.forEach(hw => {
    // 提取日期部分作为分类 key
    const dateKey = dayjs(hw.createTime).format('YYYY-MM-DD');
    if (!map.has(dateKey)) {
      map.set(dateKey, []);
    }
    map.get(dateKey)!.push(hw);
  });

  const result: { date: string, items: HomeworkInfo[] }[] = [];
  map.forEach((items, date) => {
    result.push({ date, items });
  });

  return result;
});

/**
 * ECharts 配置项，响应式更新
 */
const chartOption = computed(() => {
  if (!selectedHomework.value) return {};

  const isDark = settingsStore.theme === 'dark';
  const textColor = isDark ? '#f9fafb' : '#1f2937';
  const borderColor = isDark ? '#1f2937' : '#fff';
  const uncompletedColor = isDark ? '#4b5563' : '#d9d9d9';

  const hw = selectedHomework.value;
  const uncompletedCount = hw.totalCount - hw.completedCount;

  return {
    tooltip: { trigger: 'item' },
    legend: { top: '5%', left: 'center', textStyle: { color: textColor } },
    series: [
      {
        name: '完成状态',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: borderColor,
          borderWidth: 2
        },
        label: { show: false, position: 'center' },
        emphasis: {
          label: { show: true, fontSize: 16, fontWeight: 'bold', color: textColor }
        },
        labelLine: { show: false },
        data: [
          { value: hw.completedCount, name: '已完成', itemStyle: { color: '#52c41a' } },
          { value: uncompletedCount, name: '未完成', itemStyle: { color: uncompletedColor } },
        ]
      }
    ]
  };
});

// 操作方法
const viewDetail = (hw: HomeworkInfo) => {
  selectedHomework.value = hw;
};

// 下载附件
const handleDownloadAttachment = async (att: { name: string, url: string }) => {
  try {
    message.loading({ content: '准备下载中...', key: 'downloading' });
    const blob = await apiDownloadHomeworkAttachment(att.url, att.name);
    // 模拟下载过程
    const tempUrl = window.URL.createObjectURL(new Blob([blob as BlobPart]));
    const link = document.createElement('a');
    link.href = tempUrl;
    link.setAttribute('download', att.name);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(tempUrl);
    message.success({ content: '下载成功', key: 'downloading' });
  } catch (err) {
    console.error(err);
    message.error({ content: '下载失败或只支持模拟环境', key: 'downloading' });
  }
};

// 学生作业详情查看与编辑打分
const submissionVisible = ref(false);

interface SubmissionRecord {
  studentId: string;
  name: string;
  grade: number;
  submittedContent?: string;
  evaluation?: string;
  attachments?: { name: string; url: string }[];
  [key: string]: unknown;
}

const selectedSubmission = ref<SubmissionRecord | null>(null);

const viewSubmission = (record: unknown) => {
  selectedSubmission.value = record as SubmissionRecord;
  submissionVisible.value = true;
};

// 批改打分相关状态
const editEvalMode = ref(false);
const evalSaving = ref(false);
const evalEditForm = ref({ grade: 0, evaluation: '' });

const toggleEditEvalMode = () => {
  if (selectedSubmission.value) {
    evalEditForm.value = {
      grade: selectedSubmission.value.grade as number,
      evaluation: selectedSubmission.value.evaluation as string || ''
    };
    editEvalMode.value = true;
  }
};

const cancelEditEvalMode = () => {
  editEvalMode.value = false;
};

const saveEvaluation = async () => {
  if (!selectedSubmission.value || !selectedHomework.value || !classesStore.currentClass) return;
  if (evalEditForm.value.grade === null || evalEditForm.value.grade === undefined) {
    return message.warning('评分不能为空');
  }
  
  evalSaving.value = true;
  try {
    const sId = selectedSubmission.value.studentId as string;
    await classesStore.updateStudentEvaluation(
      classesStore.currentClass.id, 
      selectedHomework.value.id, 
      sId, 
      { grade: evalEditForm.value.grade, evaluation: evalEditForm.value.evaluation }
    );
    // 更新本地视图状态
    selectedSubmission.value.grade = evalEditForm.value.grade;
    selectedSubmission.value.evaluation = evalEditForm.value.evaluation;
    editEvalMode.value = false;
    message.success('学生作业批阅结果已妥善保存！');
  } catch (error) {
    console.error(error);
    message.error('批阅保存失败');
  } finally {
    evalSaving.value = false;
  }
};

const backToList = () => {
  selectedHomework.value = null;
};

// 修改与删除
const editVisible = ref(false);
const editFileList = ref<{ uid: string; name: string; status: string; url?: string }[]>([]);
const editForm = ref<{ title: string; dueDate: Dayjs | null; description: string }>({ title: '', dueDate: null, description: '' });

const openEditModal = () => {
  if (selectedHomework.value) {
    editForm.value = {
      title: selectedHomework.value.title,
      dueDate: selectedHomework.value.dueDate ? dayjs(selectedHomework.value.dueDate) : null,
      description: selectedHomework.value.description
    };
    editFileList.value = (selectedHomework.value.attachments || []).map(att => ({
      uid: att.url,
      name: att.name,
      status: 'done',
      url: att.url,
    }));
    editVisible.value = true;
  }
};

const handleEditSave = async () => {
  if (!editForm.value.title || !editForm.value.dueDate || !editForm.value.description) {
    return message.warning('请填写所有必填项');
  }

  if (selectedHomework.value && classesStore.currentClass) {
    const finalAttachments = editFileList.value.map(f => ({ name: f.name, url: f.url || '#' }));
    await classesStore.updateHomework(selectedHomework.value.id, {
      title: editForm.value.title,
      dueDate: editForm.value.dueDate.format('YYYY-MM-DD HH:mm:ss'),
      description: editForm.value.description,
      attachments: finalAttachments
    });

    // 更新本地状态显示
    selectedHomework.value = {
      ...selectedHomework.value,
      title: editForm.value.title,
      dueDate: editForm.value.dueDate.format('YYYY-MM-DD HH:mm:ss'),
      description: editForm.value.description,
      attachments: finalAttachments
    };
    message.success('修改成功');
    editVisible.value = false;
  }
};

const handleDelete = async () => {
  if (selectedHomework.value && classesStore.currentClass) {
    await classesStore.deleteHomework(classesStore.currentClass.id, selectedHomework.value.id);
    message.success('删除成功');
    backToList();
  }
};

// 如果班级被切换，自动回到列表视图
watch(() => classesStore.currentClass, () => {
  backToList();
});

</script>

<style scoped>
.class-homework-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.homework-list-view, .homework-detail-view {
  flex: 1;
  overflow-y: auto;
  padding: 0 16px;
}

.empty-state {
  margin-top: 100px;
}

.homework-group {
  margin-bottom: 10px;
}

.homework-item {
  cursor: pointer;
  padding: 10px;
  border-radius: 8px;
  transition: all 0.3s;
  background-color: var(--app-panel);
  margin-bottom: 12px;
  border: 1px solid var(--app-border) !important; /* 强制覆盖 a-list-item 默认的 border-block-end 以防止下边框被覆盖或遮挡 */
  overflow: hidden;
}

.homework-item:hover {
  background-color: var(--app-hover);
  border-color: var(--app-border);
}

.homework-title {
  font-weight: 600;
  font-size: 16px;
  color: var(--app-text-main);
}

.homework-extra {
  display: flex;
  align-items: center;
}

.status-badge {
  background-color: #e6f7ff;
  color: #1890ff;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 13px;
  border: 1px solid #91d5ff;
}

.status-badge.all-completed {
  background-color: #f6ffed;
  color: #52c41a;
  border-color: #b7eb8f;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--app-border);
  padding-bottom: 12px;
}

.detail-body {
  padding-bottom: 24px;
}

.title {
  font-size: 22px;
  font-weight: bold;
  margin-bottom: 12px;
  color: var(--app-text-main);
}

.meta-info {
  margin-bottom: 20px;
}

.description-box {
  background-color: var(--app-panel);
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  line-height: 1.6;
  white-space: pre-wrap;
  border: 1px solid var(--app-border);
  color: var(--app-text-main);
}

.attachments {
  margin-bottom: 20px;
}

.attachment-list {
  margin-top: 8px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.completion-stats {
  margin-top: 24px;
}

.stats-row {
  display: flex;
  gap: 24px;
  margin-top: 16px;
  align-items: flex-start;
}

.chart-container {
  flex: 0 0 280px;
  height: 300px;
  background-color: var(--app-panel);
  border-radius: 8px;
  padding: 16px;
  border: 1px solid var(--app-border);
}

.chart {
  width: 100%;
  height: 100%;
}

.students-table {
  flex: 1;
  background-color: var(--app-panel);
  border-radius: 8px;
  padding: 16px;
  overflow-y: auto;
  max-height: 400px;
  border: 1px solid var(--app-border);
}

/* 强制覆盖 Ant Design Vue 的组件默认白色背景，达到在暗色模式下的自适应适配 */
:deep(.ant-list-item-meta-title) {
  color: var(--app-text-main) !important;
}
:deep(.ant-list-item-meta-description) {
  color: var(--app-text-sub) !important;
}
:deep(.ant-empty-description) {
  color: var(--app-text-sub) !important;
}
:deep(.ant-table), :deep(.ant-table-wrapper), :deep(.ant-table-cell) {
  background-color: transparent !important;
  color: var(--app-text-main) !important;
  border-bottom-color: var(--app-border) !important;
}
:deep(.ant-table-thead > tr > th) {
  background-color: var(--app-hover) !important;
  color: var(--app-text-main) !important;
  border-bottom-color: var(--app-border) !important;
}
:deep(.ant-table-tbody > tr.ant-table-row:hover > td) {
  background-color: var(--app-hover) !important;
}

:deep(.ant-descriptions-item-label) {
  width: 100px;
  background-color: var(--app-hover) !important;
  color: var(--app-text-sub) !important;
}
:deep(.ant-descriptions-item-content) {
  background-color: var(--app-panel) !important;
  color: var(--app-text-main) !important;
}
</style>
