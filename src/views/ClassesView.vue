<template>
  <a-spin :spinning="loading">
    <div class="classes-container">
      <div class="page-header">
        <h2>我的班级</h2>
        <a-button type="primary" @click="createClassVisible = true">新建班级</a-button>
      </div>

      <div class="content-split">
        <!-- Left: Class List -->
        <div class="class-list-area">
          <a-card hoverable class="class-card" v-for="cls in classesStore.classes" :key="cls.id"
            :class="{ active: classesStore.currentClass?.id === cls.id }" @click="handleClassSwitch(cls.id)">
            <template #title>
              <span>{{ cls.name }}</span>
            </template>
            <template #extra>
              <a-badge :count="`${cls.studentCount}人`"
                :number-style="{ backgroundColor: 'var(--color-background-light)', color: 'var(--color-text-main-light)' }" />
            </template>
            <p style="margin: 0; color: gray;">创立: {{ cls.createTime.split(' ')[0] }}</p>
          </a-card>
        </div>

        <!-- Right: Class Details -->
        <div class="class-detail-area" v-if="classesStore.currentClass">
          <a-card :bordered="false" class="detail-card">
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
                <a-table :dataSource="mockStudents" :columns="studentColumns" size="small"
                  :pagination="{ pageSize: 8 }" />
              </a-tab-pane>
              <a-tab-pane key="schedule" tab="课程表">
                <a-empty description="暂无课程排期" />
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
            </a-tabs>
          </a-card>
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
  </a-spin>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { useClassesStore } from '../stores/classesStore';

const classesStore = useClassesStore();
const activeTab = ref('students');
const loading = ref(true);

const createClassVisible = ref(false);
const createTaskVisible = ref(false);
const taskType = ref<'homework' | 'discussion' | 'material'>('homework');
const formStateClass = ref({ name: '', grade: '三年级', subject: '全部' });
const formStateTask = ref<{ title: string; description: string; type: 'homework' | 'discussion' | 'material' }>({ title: '', description: '', type: 'homework' });

onMounted(async () => {
  loading.value = true;
  await classesStore.loadClasses();
  if (classesStore.currentClass) {
    await classesStore.loadTasks(classesStore.currentClass.id);
  }
  loading.value = false;
});

const handleClassSwitch = async (id: string) => {
  loading.value = true;
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

const mockStudents = Array.from({ length: 45 }).map((_, i) => ({
  key: i,
  id: `2024${i.toString().padStart(3, '0')}`,
  name: `学生${i + 1}`,
  progress: `${Math.floor(Math.random() * 40 + 60)}%`
}));

const studentColumns = [
  { title: '姓名', dataIndex: 'name', key: 'name' },
  { title: '学号', dataIndex: 'id', key: 'id' },
  { title: '学习进度', dataIndex: 'progress', key: 'progress' },
];
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
  flex: 0 0 300px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
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
  overflow-y: auto;
}

.detail-card {
  height: 100%;
  border-radius: 12px;
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
</style>
