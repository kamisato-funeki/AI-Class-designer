<!--
  班级课表显示组件 (ClassSchedule)
  业务逻辑：
  1. 以表格形式渲染当前班级的排课计划。
  2. 展示日期、时间段、科目以及任课教师。
-->
<template>
  <a-table :dataSource="classesStore.currentSchedule" :columns="scheduleColumns" size="small" :pagination="false" bordered />
</template>

<script setup lang="ts">
import { useClassesStore } from '../../stores/classesStore';

/**
 * 状态仓库
 */
const classesStore = useClassesStore(); // 班级仓库，提供当前班级的课程排期数据 (currentSchedule)

/**
 * 【配置项】scheduleColumns
 * 作用：定义 Ant Design Vue 表格的列元数据
 * 字段说明：
 * - day: 星期几 / 日期
 * - timeStr: 具体时间段 (如 08:00 - 09:30)
 * - subject: 课程名称
 * - teacher: 授课教师姓名
 */
const scheduleColumns = [
  { title: '日期', dataIndex: 'day', key: 'day' },
  { title: '时间', dataIndex: 'timeStr', key: 'timeStr' },
  { title: '科目', dataIndex: 'subject', key: 'subject' },
  { title: '教师', dataIndex: 'teacher', key: 'teacher' }
];
</script>
