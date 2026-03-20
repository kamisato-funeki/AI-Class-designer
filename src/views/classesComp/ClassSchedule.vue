<template>
  <a-table :dataSource="classesStore.currentSchedule" :columns="scheduleColumns" size="small" :pagination="false" bordered />
</template>

<script setup lang="ts">
import { useClassesStore } from '../../stores/classesStore';

const classesStore = useClassesStore();

const scheduleColumns = [
  { title: '日期', dataIndex: 'day', key: 'day' },
  { title: '时间', dataIndex: 'timeStr', key: 'timeStr' },
  { title: '科目', dataIndex: 'subject', key: 'subject' },
  { title: '教师', dataIndex: 'teacher', key: 'teacher' }
];
</script>
