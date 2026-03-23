<!--
  班级学生管理列表组件 (ClassStudents)
  业务逻辑：
  1. 展示班级内所有学生的档案信息及学习进度。
  2. 提供查看学生详情和快速私信的功能入口。
-->
<template>
  <a-table :dataSource="classesStore.students" :columns="studentColumns" size="small" :pagination="{ pageSize: 8 }">
    <template #bodyCell="{ column, record }">
      <template v-if="column.key === 'progress'">
        <span>{{ record.progress }}%</span>
      </template>
      <template v-if="column.key === 'action'">
        <a-space>
          <a-button type="primary" shape="round" size="small" @click="openStudentDetails(record)">详情</a-button>
          <a-button shape="round" size="small" @click="handleDirectMessage(record)">私信</a-button>
        </a-space>
      </template>
    </template>
  </a-table>
</template>

<script setup lang="ts">
import { h } from 'vue';
import { useRouter } from 'vue-router';
import { useClassesStore } from '../../stores/classesStore';
import type { StudentInfo } from '../../types/types';

/**
 * 常用工具与仓库初始化
 */
const classesStore = useClassesStore(); // 班级数据仓库
const router = useRouter();             // 路由实例，用于跳转到私信详情页

/**
 * 事件定义
 */
const emit = defineEmits(['openDetails']); // 向父组件发送“查看学生详细档案”的事件

/**
 * 【配置项】studentColumns
 * 作用：定义学生列表表格的列配置
 * 特殊处理：使用 Vue 的 h 函数自定义渲染头像列
 */
const studentColumns = [
  { 
    title: '头像', 
    dataIndex: 'avatar', 
    key: 'avatar', 
    customRender: ({ record }: { record: StudentInfo }) => h('img', { 
      src: record.avatar, 
      style: 'width: 32px; height: 32px; border-radius: 50%; object-fit: cover;' 
    }) 
  },
  { title: '姓名', dataIndex: 'name', key: 'name' },
  { title: '学号', dataIndex: 'id', key: 'id' },
  { title: '学习进度', dataIndex: 'progress', key: 'progress' },
  { title: '操作', key: 'action' }
];

/**
 * 【函数】openStudentDetails
 * 作用：点击“详情”按钮，触发展示该学生的详细信息面板（由父页面弹出 Modal）
 */
const openStudentDetails = (student: StudentInfo) => {
  emit('openDetails', student);
};

/**
 * 【异步函数】handleDirectMessage
 * 作用：点击“私信”按钮，快速开启 1 对 1 会话
 * 业务逻辑：
 * 1. 调用 store 逻辑，查找是否已有与该学生的会话，若无则创建一个。
 * 2. 路由跳转至班级群聊/私信 TAB 页展示对话。
 */
const handleDirectMessage = async (student: StudentInfo) => {
  if (!classesStore.currentClass) return;
  await classesStore.findOrCreateStudentChat(classesStore.currentClass.id, student);
  // 跳转至对应的路由页面
  router.push({ name: 'class-chats', params: { classId: classesStore.currentClass.id } });
};
</script>
