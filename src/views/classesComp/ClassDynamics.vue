<!--
  班级动态时间轴组件 (ClassDynamics)
  业务逻辑：
  1. 以时间轴形式展示班级内发布的各项任务（作业、讨论、课件等）。
  2. 根据任务类型自动匹配颜色和文案。
-->
<template>
  <a-timeline>
    <a-timeline-item v-for="task in classesStore.currentTasks" :key="task.id"
      :color="task.type === 'homework' ? 'blue' : 'green'">
      发布了{{ task.type === 'homework' ? '作业' : task.type === 'discussion' ? '讨论' : '课件' }}：《{{ task.title }}》
      <div style="font-size: 12px; color: gray; margin-top: 4px;">{{ task.createTime }}</div>
    </a-timeline-item>
    <a-timeline-item color="gray">班级创建完成</a-timeline-item>
  </a-timeline>
</template>

<script setup lang="ts">
import { useClassesStore } from '../../stores/classesStore';

/**
 * 状态仓库
 */
const classesStore = useClassesStore(); // 班级仓库，从中响应式获取 currentTasks 任务列表
</script>
