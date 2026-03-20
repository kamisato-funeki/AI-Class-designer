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

const classesStore = useClassesStore();
const router = useRouter();

const emit = defineEmits(['openDetails']);

const studentColumns = [
  { title: '头像', dataIndex: 'avatar', key: 'avatar', customRender: ({ record }: { record: StudentInfo }) => h('img', { src: record.avatar, style: 'width: 32px; height: 32px; border-radius: 50%;' }) },
  { title: '姓名', dataIndex: 'name', key: 'name' },
  { title: '学号', dataIndex: 'id', key: 'id' },
  { title: '学习进度', dataIndex: 'progress', key: 'progress' },
  { title: '操作', key: 'action' }
];

const openStudentDetails = (student: StudentInfo) => {
  emit('openDetails', student);
};

const handleDirectMessage = async (student: StudentInfo) => {
  if (!classesStore.currentClass) return;
  await classesStore.findOrCreateStudentChat(classesStore.currentClass.id, student);
  router.push({ name: 'class-chats', params: { classId: classesStore.currentClass.id } });
};
</script>
