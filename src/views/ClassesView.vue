<template>
  <a-spin :spinning="loading">
    <div class="classes-container">
      <div class="page-header">
        <h2>我的班级</h2>
      </div>

      <div class="content-split">
        <!-- Left: Class List -->
        <div class="class-list-area">
          <div class="class-list-scroll">
            <a-card hoverable class="class-card" size="small" v-for="cls in classesStore.classes" :key="cls.id"
              :class="{ active: classesStore.currentClass?.id === cls.id }" @click="handleClassSwitch(cls.id)">
              <template #title>
                <span style="font-size: 15px;">{{ cls.name }}</span>
              </template>
              <template #extra>
                <a-badge :count="`${cls.studentCount}人`"
                  :number-style="{ backgroundColor: 'var(--color-background-light)', color: 'var(--color-text-main-light)' }" />
              </template>
              <p style="margin: 0; color: gray;font-size: 10px;">创立: {{ cls.createTime.split(' ')[0] }}</p>
            </a-card>
          </div>
          <div class="class-list-footer">
            <a-button type="primary" block @click="createClassVisible = true">新建班级</a-button>
          </div>
        </div>

        <!-- Right: Class Details -->
        <div class="class-detail-area" v-if="classesStore.currentClass">
          <a-card :bordered="false" class="detail-card" v-show="!classesStore.activeGroupChat">
            <div class="detail-header">
              <h3>{{ classesStore.currentClass.name }} - 详情面板</h3>
              <a-space>
                <a-button type="primary" @click="openCreateTask('material')">发布课件</a-button>
                <a-button @click="openCreateTask('homework')">布置作业</a-button>
                <a-button @click="openCreateTask('discussion')">发起讨论</a-button>
              </a-space>
            </div>

            <a-tabs v-model:activeKey="activeTab">
              <a-tab-pane key="students" tab="学生名单">
                <a-table :dataSource="classesStore.students" :columns="studentColumns" size="small"
                  :pagination="{ pageSize: 8 }">
                  <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'action'">
                      <a-space>
                        <a-button type="link" size="small" @click="openStudentDetails(record)">详情</a-button>
                      </a-space>
                    </template>
                  </template>
                </a-table>
              </a-tab-pane>
              <a-tab-pane key="schedule" tab="课程表">
                <a-table :dataSource="classesStore.currentSchedule" :columns="scheduleColumns" size="small"
                  :pagination="false" bordered />
              </a-tab-pane>
              <a-tab-pane key="dynamics" tab="班级动态">
                <a-timeline>
                  <a-timeline-item v-for="task in classesStore.currentTasks" :key="task.id"
                    :color="task.type === 'homework' ? 'blue' : 'green'">
                    发布了{{ task.type === 'homework' ? '作业' : task.type === 'discussion' ? '讨论' : '课件' }}：《{{ task.title
                    }}》
                    <div style="font-size: 12px; color: gray; margin-top: 4px;">{{ task.createTime }}</div>
                  </a-timeline-item>
                  <a-timeline-item color="gray">班级创建完成</a-timeline-item>
                </a-timeline>
              </a-tab-pane>
              <a-tab-pane key="chats" tab="班级消息">
                <a-list item-layout="horizontal" :data-source="classesStore.groupChats" class="group-chat-list">
                  <template #renderItem="{ item }">
                    <a-list-item class="group-chat-item" @click="handleOpenGroupChat(item)">
                      <a-list-item-meta>
                        <template #avatar>
                          <a-avatar :src="item.avatar" :size="48" style="border-radius: 50%;" />
                        </template>
                        <template #title>
                          <div class="group-chat-title-row">
                            <span class="chat-name">{{ item.name }}</span>
                            <span class="chat-time">{{ item.lastMessageTime }}</span>
                          </div>
                        </template>
                        <template #description>
                          <div class="group-chat-desc-row">
                            <span class="chat-last-msg">
                              <span v-if="item.lastSender" class="chat-sender">{{ item.lastSender }}: </span>
                              {{ item.lastMessage }}
                            </span>
                            <a-badge v-if="item.unreadCount > 0"
                              :count="item.unreadCount > 99 ? '99+' : item.unreadCount" class="chat-badge" />
                          </div>
                        </template>
                      </a-list-item-meta>
                    </a-list-item>
                  </template>
                </a-list>
              </a-tab-pane>
            </a-tabs>
          </a-card>

          <!-- Group Chat 面板 -->
          <div class="chat-board-container" v-if="classesStore.activeGroupChat">
            <ClassChatBoard @back="classesStore.activeGroupChat = null" />
          </div>

        </div>
        <div v-else
          style="flex: 1; display: flex; align-items: center; justify-content: center; background: white; border-radius: 12px;">
          <a-empty description="请选择或创建班级" />
        </div>
      </div>
    </div>

    <!-- Modals -->
    <a-modal v-model:open="createClassVisible" title="新建班级" @ok="handleCreateClass" :confirmLoading="loading">
      <a-form layout="vertical">
        <a-form-item label="班级名称">
          <a-input v-model:value="formStateClass.name" placeholder="请输入班级名称" />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal v-model:open="createTaskVisible"
      :title="taskType === 'homework' ? '布置作业' : taskType === 'discussion' ? '发起讨论' : '发布课件'" @ok="handleCreateTask"
      :confirmLoading="loading">
      <a-form layout="vertical">
        <a-form-item label="标题">
          <a-input v-model:value="formStateTask.title" placeholder="请输入标题" />
        </a-form-item>
        <a-form-item label="内容描述">
          <a-textarea v-model:value="formStateTask.description" placeholder="请输入详细内容" :rows="4" />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal v-model:open="studentStatsVisible" :title="`${activeStudentDetails?.name} 的学习详情`" :footer="null"
      width="600px" @cancel="studentStatsVisible = false">
      <div v-if="activeStudentDetails">
        <div style="display:flex; justify-content: space-around; margin-bottom: 20px;">
          <a-statistic title="学习进度" :value="activeStudentDetails.progress" />
          <a-statistic title="活跃发言次数" :value="activeStudentDetails.activeCount" />
        </div>
        <v-chart style="height: 300px; width: 100%" :option="chartOption" autoresize />
      </div>
    </a-modal>
  </a-spin>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { useClassesStore } from '../stores/classesStore';
import type { StudentInfo, GroupChat } from '../types/types';
import ClassChatBoard from './classesComp/ClassChatBoard.vue';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { BarChart, LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import VChart from 'vue-echarts';

use([CanvasRenderer, BarChart, LineChart, GridComponent, TooltipComponent, LegendComponent]);

const classesStore = useClassesStore();
const activeTab = ref('chats'); // Default to chats for demonstration
const loading = ref(true);

const createClassVisible = ref(false);
const createTaskVisible = ref(false);
const studentStatsVisible = ref(false);

const taskType = ref<'homework' | 'discussion' | 'material'>('homework');
const formStateClass = ref({ name: '', grade: '三年级', subject: '全部' });
const formStateTask = ref<{ title: string; description: string; type: 'homework' | 'discussion' | 'material' }>({ title: '', description: '', type: 'homework' });

const activeStudentDetails = ref<StudentInfo | null>(null);
const chartOption = ref({});

onMounted(() => {
  loading.value = true;
  (async () => {
    await classesStore.loadClasses();
    await classesStore.loadGroupChats();
    if (classesStore.currentClass) {
      await classesStore.loadTasks(classesStore.currentClass.id);
    }
  })().finally(() => {
    loading.value = false;
  });
});

const handleClassSwitch = async (id: string) => {
  loading.value = true;
  classesStore.activeGroupChat = null;
  await classesStore.selectClass(id);
  loading.value = false;
};

const handleCreateClass = async () => {
  if (!formStateClass.value.name) return message.warning('请输入班级名称');
  loading.value = true;
  await classesStore.createClass(formStateClass.value);
  createClassVisible.value = false;
  formStateClass.value.name = '';
  loading.value = false;
  message.success('创建成功');
};

const openCreateTask = (type: 'homework' | 'discussion' | 'material') => {
  taskType.value = type;
  formStateTask.value = { title: '', description: '', type };
  createTaskVisible.value = true;
};

const handleCreateTask = async () => {
  if (!formStateTask.value.title) return message.warning('请输入标题');
  if (!classesStore.currentClass) return;
  loading.value = true;
  await classesStore.createTask({
    classId: classesStore.currentClass.id,
    ...formStateTask.value
  });
  createTaskVisible.value = false;
  loading.value = false;
  message.success('配置成功');
};

const handleOpenGroupChat = async (chat: GroupChat) => {
  loading.value = true;
  await classesStore.selectGroupChat(chat);
  loading.value = false;
};

const openStudentDetails = (student: StudentInfo) => {
  activeStudentDetails.value = student;
  chartOption.value = {
    tooltip: {},
    legend: { data: ['成绩'] },
    xAxis: { data: ['开学测试', '期中考试'] },
    yAxis: {},
    series: [
      {
        name: '成绩',
        type: 'bar',
        data: student.grades,
        itemStyle: { color: '#1677ff' }
      }
    ]
  };
  studentStatsVisible.value = true;
};

const studentColumns = [
  { title: '头像', dataIndex: 'avatar', key: 'avatar', customRender: ({ record }: { record: StudentInfo }) => h('img', { src: record.avatar, style: 'width: 32px; height: 32px; border-radius: 50%;' }) },
  { title: '姓名', dataIndex: 'name', key: 'name' },
  { title: '学号', dataIndex: 'id', key: 'id' },
  { title: '学习进度', dataIndex: 'progress', key: 'progress' },
  { title: '操作', key: 'action' }
];

const scheduleColumns = [
  { title: '日期', dataIndex: 'day', key: 'day' },
  { title: '时间', dataIndex: 'timeStr', key: 'timeStr' },
  { title: '科目', dataIndex: 'subject', key: 'subject' },
  { title: '教师', dataIndex: 'teacher', key: 'teacher' }
];

import { h } from 'vue';
</script>

<style scoped>
.classes-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
  height: calc(100vh - 64px - 48px);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
}

.content-split {
  display: flex;
  flex: 1;
  gap: 24px;
  overflow: hidden;
}

.class-list-area {
  flex: 0 0 150px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.class-list-scroll {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-right: 4px;
}

.class-list-footer {
  margin-top: 16px;
}

.class-card {
  border-radius: 12px;
  transition: all 0.2s;
}

.class-card.active {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-sm);
  background-color: var(--color-background-light);
}

.class-detail-area {
  flex: 1;
  overflow-y: hidden;
  display: flex;
  flex-direction: column;
}

.detail-card {
  flex: 1;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.detail-header h3 {
  margin: 0;
  font-size: 20px;
}

/* Chat list styles matching Image 1 layout */
.group-chat-list {
  background-color: #fafafa;
  border-radius: 8px;
  padding: 8px;
}

.group-chat-item {
  padding: 12px 16px;
  cursor: pointer;
  border-radius: 8px;
  transition: background-color 0.2s;
  border-bottom: 1px solid #f0f0f0 !important;
}

.group-chat-item:hover {
  background-color: #f0f0f0;
}

.group-chat-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.chat-time {
  font-size: 12px;
  color: #999;
}

.group-chat-desc-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 4px;
}

.chat-last-msg {
  font-size: 13px;
  color: #888;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 85%;
}

.chat-sender {
  color: #666;
}

.chat-badge {
  transform: scale(0.9);
}

.chat-board-container {
  flex: 1;
  height: 100%;
}
</style>
