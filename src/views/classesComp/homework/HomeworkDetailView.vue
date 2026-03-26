<template>
  <div class="homework-detail-view">
    <!-- 顶部导航栏 -->
    <div class="detail-header">
      <!-- 返回按钮 -->
      <a-button type="link" @click="$emit('back')" style="padding-left: 0;">
        <template #icon><ArrowLeftOutlined /></template>
        返回列表
      </a-button>
      
      <!-- 修改/删除操作按钮组 -->
      <a-space>
        <a-button size="small" @click="$emit('edit')">修改</a-button>
        <a-popconfirm title="确定要删除该作业吗？" @confirm="$emit('delete')">
          <a-button size="small" danger>删除</a-button>
        </a-popconfirm>
      </a-space>
    </div>

    <div class="detail-body">
      <!-- 作业概览部分 -->
      <div class="homework-overview">
        <h2 class="title">{{ homework.title }}</h2>
        <div class="meta-info">
          <!-- 布置日期与截止时间标签 -->
          <a-tag color="blue">布置日期: {{ homework.createTime }}</a-tag>
          <a-tag color="volcano" v-if="homework.dueDate">截止日期: {{ homework.dueDate }}</a-tag>
        </div>
        <!-- 作业描述文字框 -->
        <div class="description-box">
          <p>{{ homework.description }}</p>
        </div>
        <!-- 附件列表展示区 -->
        <div class="attachments" v-if="homework.attachments && homework.attachments.length > 0">
          <strong><PaperClipOutlined /> 附件：</strong>
          <div class="attachment-list">
            <a-tooltip title="点击下载" v-for="(att, idx) in homework.attachments" :key="idx">
              <!-- 触发下载附件的回调 -->
              <a-tag color="cyan" style="cursor: pointer;" @click.stop="$emit('download-attachment', att)">
                {{ att.name }}
              </a-tag>
            </a-tooltip>
          </div>
        </div>
      </div>

      <a-divider />

      <!-- 完成情况统计部分 -->
      <div class="completion-stats">
        <h3>完成情况统计</h3>
        <div class="stats-row">
          <!-- ECharts 图表展示容器 -->
          <div class="chart-container">
            <v-chart class="chart" :option="chartOption" autoresize />
          </div>

          <!-- 完成学生列表表格 -->
          <div class="students-table">
            <a-table 
              :dataSource="homework.studentStats" 
              :columns="columns" 
              size="small" 
              :pagination="{ pageSize: 5 }"
            >
              <template #bodyCell="{ column, record }">
                <!-- 自定义头像和姓名列 -->
                <template v-if="column.key === 'name'">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <a-avatar :src="record.avatar" size="small" />
                    {{ record.name }}
                  </div>
                </template>
                <!-- 自定义成绩列渲染逻辑（根据分值变色） -->
                <template v-if="column.key === 'grade'">
                  <span :style="{ color: record.grade >= 90 ? '#52c41a' : record.grade >= 60 ? '#1890ff' : '#f5222d' }">
                    {{ record.grade }} 分
                  </span>
                </template>
                <!-- 操作列 -->
                <template v-if="column.key === 'action'">
                  <a-button type="link" size="small" @click="$emit('view-submission', record)">查看详情</a-button>
                </template>
              </template>
            </a-table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 作业详情视图组件
 * 功能：
 * 1. 展示作业的完整描述、标题和时间
 * 2. 渲染附件并提供下载交互
 * 3. 渲染已完成/未完成比例的饼状图 (ECharts)
 * 4. 展示包含成绩的学生完成情况表格
 */

import { computed } from 'vue';
import { ArrowLeftOutlined, PaperClipOutlined } from '@ant-design/icons-vue';
import { useSettingsStore } from '../../../stores/settingsStore';
import type { HomeworkInfo } from '../../../types/types';

// 按需引入 ECharts
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { PieChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components';
import VChart from 'vue-echarts';

// 注册 ECharts 核心组件
use([CanvasRenderer, PieChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent]);

const settingsStore = useSettingsStore();

// 定义组件接收的属性 (Props)
const props = defineProps<{
  /** 作业对象详情 */
  homework: HomeworkInfo;
}>();

// 定义组件触发的事件 (Emits)
defineEmits<{
  /** 点击返回按钮触发 */
  (e: 'back'): void;
  /** 点击修改按钮触发 */
  (e: 'edit'): void;
  /** 点击删除按钮确认后触发 */
  (e: 'delete'): void;
  /** 点击查看特定学生的提交明细触发 */
  (e: 'view-submission', record: HomeworkInfo['studentStats'][number]): void;
  /** 点击下载附件触发 */
  (e: 'download-attachment', att: { name: string, url: string }): void;
}>();

/**
 * 表格列配置定义
 * 包括学生、成绩和操作三个核心列
 */
const columns = [
  { title: '学生', dataIndex: 'name', key: 'name', width: 100 },
  { title: '成绩', dataIndex: 'grade', key: 'grade', width: 80, sorter: (a: HomeworkInfo['studentStats'][number], b: HomeworkInfo['studentStats'][number]) => a.grade - b.grade },
  { title: '操作', key: 'action', width: 100, align: 'center' }
];

/**
 * 【计算属性】ECharts 饼状图配置
 * 实现逻辑：
 * 1. 自动判断系统的暗色模式并调整配色方案。
 * 2. 计算已完成与未完成的学生人数比例。
 * 3. 配置 Tooltip 与 Legend。
 */
const chartOption = computed(() => {
  const isDark = settingsStore.theme === 'dark';
  const textColor = isDark ? '#f9fafb' : '#1f2937';
  const borderColor = isDark ? '#1f2937' : '#fff';
  const uncompletedColor = isDark ? '#4b5563' : '#d9d9d9';

  const hw = props.homework;
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
</script>

<style scoped>
.homework-detail-view {
  flex: 1;
  overflow-y: auto;
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

/* ECharts 渲染容器适配 */
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
  max-height: 480px;
  border: 1px solid var(--app-border);
}

/* 强制覆盖 Ant Design Vue 的组件表格背景适配暗色 */
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
</style>
