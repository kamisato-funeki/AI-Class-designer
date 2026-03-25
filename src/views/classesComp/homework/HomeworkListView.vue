<template>
  <div class="homework-list-view">
    <!-- 暂无作业时的展示状态 -->
    <div v-if="groupedHomeworks.length === 0" class="empty-state">
      <a-empty description="暂无班级作业" />
    </div>

    <!-- 按日期分组显示的作业列表 -->
    <div v-for="group in groupedHomeworks" :key="group.date" class="homework-group">
      <!-- 日期分割线 -->
      <a-divider orientation="left" class="date-divider">{{ group.date }}</a-divider>
      
      <!-- 每个日期的作业列表 -->
      <a-list :dataSource="group.items" itemLayout="horizontal" class="custom-list">
        <template #renderItem="{ item }">
          <a-list-item class="homework-item" @click="$emit('view-detail', item)">
            <a-list-item-meta :description="`截止时间: ${item.dueDate || '无'}`">
              <template #title>
                <span class="homework-title">{{ item.title }}</span>
              </template>
              <template #avatar>
                <!-- 作业图标头像 -->
                <a-avatar style="background-color: var(--color-primary);">
                  <template #icon><FileTextOutlined /></template>
                </a-avatar>
              </template>
            </a-list-item-meta>
            
            <!-- 右侧完成状态进度条/徽标 -->
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
</template>

<script setup lang="ts">
/**
 * 作业列表视图组件
 * 功能：
 * 1. 接收作业列表数据
 * 2. 内部处理按日期分组逻辑
 * 3. 渲染分组列表，并提供点击进入详情的事件回调
 */

import { computed } from 'vue';
import { FileTextOutlined } from '@ant-design/icons-vue';
import dayjs from 'dayjs';
import type { HomeworkInfo } from '../../../types/types';

// 定义组件接收的属性 (Props)
const props = defineProps<{
  /** 
   * 作业列表数组
   * 包含作业标题、截止时间、完成人数统计等信息
   */
  homeworks: HomeworkInfo[];
}>();

// 定义组件触发的事件 (Emits)
defineEmits<{
  /** 
   * 点击某个作业项进入详情时触发
   * @param {HomeworkInfo} hw 被点击的作业对象
   */
  (e: 'view-detail', hw: HomeworkInfo): void;
}>();

/**
 * 【计算属性】将原始作业列表按照创建日期进行分组
 * 业务逻辑说明：
 * 1. 先将列表按照创建时间降序排列（最新的在最上方）。
 * 2. 遍历排列后的列表，提取日期的 YYYY-MM-DD 部分作为 Map 的 Key。
 * 3. 最后转换为数组结构以供模板 v-for 渲染。
 */
const groupedHomeworks = computed(() => {
  const map = new Map<string, HomeworkInfo[]>();

  // 按照 createTime 排序（最新的在前）
  const sorted = [...props.homeworks].sort((a, b) => dayjs(b.createTime).valueOf() - dayjs(a.createTime).valueOf());

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
</script>

<style scoped>
.homework-list-view {
  flex: 1;
  overflow-y: auto;
}

.empty-state {
  margin-top: 100px;
}

.homework-group {
  margin-bottom: 10px;
}

.date-divider {
  font-size: 14px; 
  color: gray;
}

.homework-item {
  cursor: pointer;
  padding: 10px;
  border-radius: 8px;
  transition: all 0.3s;
  background-color: var(--app-panel);
  margin-bottom: 12px;
  border: 1px solid var(--app-border) !important;
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

/* 适配暗色模式的文字颜色 */
:deep(.ant-list-item-meta-title) {
  color: var(--app-text-main) !important;
}
:deep(.ant-list-item-meta-description) {
  color: var(--app-text-sub) !important;
}
:deep(.ant-empty-description) {
  color: var(--app-text-sub) !important;
}
</style>
