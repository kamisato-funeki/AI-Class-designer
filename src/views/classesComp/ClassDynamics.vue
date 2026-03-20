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

const classesStore = useClassesStore();
</script>
