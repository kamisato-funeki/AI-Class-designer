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
          <a-card :bordered="false" class="detail-card">
            <div class="detail-header" v-show="!(activeTab === 'class-chats' && classesStore.activeGroupChat)">
              <h3>{{ classesStore.currentClass.name }} - {{ currentTabName }}</h3>
              <a-space>
                <a-button type="primary" @click="openCreateTask('material')">发布课件</a-button>
                <a-button @click="openCreateTask('homework')">布置作业</a-button>
                <a-button @click="openCreateTask('discussion')">发起讨论</a-button>
              </a-space>
            </div>

            <a-tabs :activeKey="activeTab" @change="handleTabChange" class="nav-tabs" v-show="!(activeTab === 'class-chats' && classesStore.activeGroupChat)">
              <a-tab-pane key="class-students" tab="学生名单" />
              <a-tab-pane key="class-schedule" tab="课程表" />
              <a-tab-pane key="class-dynamics" tab="班级动态" />
              <a-tab-pane key="class-chats" tab="班级消息" />
            </a-tabs>
            
            <div class="tab-content" :style="(activeTab === 'class-chats' && classesStore.activeGroupChat) ? 'padding-top: 0;' : ''">
              <router-view @openDetails="openStudentDetails" />
            </div>
          </a-card>
        </div>
        <div v-else
          style="flex: 1; display: flex; align-items: center; justify-content: center; background: var(--app-panel); border-radius: 12px;">
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
      :confirmLoading="loading" destroyOnClose>
      <a-form layout="vertical">
        <a-form-item label="标题">
          <a-input v-model:value="formStateTask.title" placeholder="请输入标题" />
        </a-form-item>
        
        <template v-if="taskType === 'material'">
          <a-form-item label="课件来源">
            <a-radio-group v-model:value="formStateTask.materialSource">
              <a-radio value="local">本地文件</a-radio>
              <a-radio value="generated">已生成的文档PPT</a-radio>
            </a-radio-group>
          </a-form-item>
          <a-form-item v-if="formStateTask.materialSource === 'local'" label="选择附件">
            <a-upload v-model:file-list="localFileList" name="file" action="" :before-upload="() => false">
              <a-button>点击上传文件</a-button>
            </a-upload>
          </a-form-item>
          <a-form-item v-else label="选择已生成的PPT">
            <a-select placeholder="请选择PPT" style="width: 100%;">
              <a-select-option value="ppt1">第一周教学课件.pptx</a-select-option>
              <a-select-option value="ppt2">第二周教学课件.pptx</a-select-option>
            </a-select>
          </a-form-item>
        </template>

        <a-form-item label="内容描述">
          <a-textarea v-model:value="formStateTask.description" placeholder="请输入详细内容" :rows="4" />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal v-model:open="studentStatsVisible" :title="`${activeStudentDetails?.name} 的学习详情`" :footer="null"
      width="700px" @cancel="studentStatsVisible = false">
      <div v-if="activeStudentDetails">
        <div style="display:flex; justify-content: space-around; margin-bottom: 20px;">
          <a-statistic title="学习进度" :value="activeStudentDetails.progress" suffix="%" />
          <a-statistic title="活跃发言" :value="activeStudentDetails.activeCount" suffix="次" />
          <a-statistic title="作业提交" :value="`${activeStudentDetails.homeworkCompleted} / ${activeStudentDetails.homeworkTotal}`" />
          <a-statistic title="平均成绩" :value="activeStudentDetails.averageGrade" suffix="分" />
        </div>
        <v-chart style="height: 300px; width: 100%" :option="chartOption" autoresize />
      </div>
    </a-modal>
  </a-spin>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { message } from 'ant-design-vue';
import { useClassesStore } from '../stores/classesStore';
import type { StudentInfo } from '../types/types';
import { useRoute, useRouter } from 'vue-router';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { BarChart, LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import VChart from 'vue-echarts';

use([CanvasRenderer, BarChart, LineChart, GridComponent, TooltipComponent, LegendComponent]);

const classesStore = useClassesStore();
const route = useRoute();
const router = useRouter();

const activeTab = computed(() => {
  const name = route.name as string;
  if (!name) return 'class-chats';
  if (['class-students', 'class-schedule', 'class-dynamics', 'class-chats'].includes(name)) {
    return name;
  }
  return 'class-chats';
});

const currentTabName = computed(() => {
  const map: Record<string, string> = {
    'class-students': '学生名单',
    'class-schedule': '课程表',
    'class-dynamics': '班级动态',
    'class-chats': '班级消息',
  };
  return map[activeTab.value] || '详情面板';
});

const loading = ref(true);

const createClassVisible = ref(false);
const createTaskVisible = ref(false);
const studentStatsVisible = ref(false);

const taskType = ref<'homework' | 'discussion' | 'material'>('homework');
const formStateClass = ref({ name: '', grade: '三年级', subject: '全部' });
const formStateTask = ref<{ 
  title: string; 
  description: string; 
  type: 'homework' | 'discussion' | 'material';
  materialSource: 'local' | 'generated';
}>({ title: '', description: '', type: 'homework', materialSource: 'local' });

const localFileList = ref<unknown[]>([]);

const activeStudentDetails = ref<StudentInfo | null>(null);
const chartOption = ref({});

onMounted(() => {
  loading.value = true;
  (async () => {
    await classesStore.loadClasses();
    if (classesStore.classes.length > 0 && !classesStore.currentClass) {
      const initId = route.params.classId as string || classesStore.classes[0]!.id;
      await classesStore.selectClass(initId);
      if (!route.params.classId) {
        router.push({ name: 'class-chats', params: { classId: initId } });
      }
    } else if (classesStore.currentClass) {
      await classesStore.selectClass(classesStore.currentClass.id);
    }
  })().finally(() => {
    loading.value = false;
  });
});

const handleClassSwitch = async (id: string) => {
  loading.value = true;
  classesStore.activeGroupChat = null;
  await classesStore.selectClass(id);
  router.push({ name: activeTab.value || 'class-chats', params: { classId: id } });
  loading.value = false;
};

const handleTabChange = (key: string) => {
  if (classesStore.currentClass) {
    classesStore.activeGroupChat = null;
    router.push({ name: key, params: { classId: classesStore.currentClass.id } });
  }
};

const handleCreateClass = async () => {
  if (!formStateClass.value.name) return message.warning('请输入班级名称');
  loading.value = true;
  const newClass = await classesStore.createClass(formStateClass.value);
  createClassVisible.value = false;
  formStateClass.value.name = '';
  loading.value = false;
  message.success('创建成功');
  if (newClass) {
    handleClassSwitch(newClass.id);
  }
};

const openCreateTask = (type: 'homework' | 'discussion' | 'material') => {
  taskType.value = type;
  formStateTask.value = { title: '', description: '', type, materialSource: 'local' };
  localFileList.value = [];
  createTaskVisible.value = true;
};

const handleCreateTask = async () => {
  if (!formStateTask.value.title) return message.warning('请输入标题');
  if (!classesStore.currentClass) return;
  loading.value = true;
  const payload: Record<string, unknown> = {
    classId: classesStore.currentClass.id,
    ...formStateTask.value
  };
  if (taskType.value === 'material') {
    if (formStateTask.value.materialSource === 'local') {
      payload.description += ' [附件: 本地文件]';
    } else {
      payload.description += ' [附件: 已生成的文档PPT]';
    }
  }
  await classesStore.createTask(payload);
  createTaskVisible.value = false;
  loading.value = false;
  message.success('配置成功');
};

const openStudentDetails = (student: StudentInfo) => {
  const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim() || '#1677ff';
  
  activeStudentDetails.value = student;
  chartOption.value = {
    tooltip: {},
    legend: { data: ['成绩'] },
    xAxis: { data: ['开学考试', '小测一', '小测二', '期中考试'] },
    yAxis: { type: 'value', min: 0, max: 100 },
    series: [
      {
        name: '成绩',
        type: 'bar',
        barWidth: '40%',
        data: student.grades,
        itemStyle: { 
          color: primaryColor,
          borderRadius: [6, 6, 0, 0]
        },
        label: { show: true, position: 'top' }
      }
    ]
  };
  studentStatsVisible.value = true;
};

</script>

<style scoped>
.classes-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
  height: calc(100vh - 120px - 48px);
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
  box-shadow: var(--app-shadow);
  background-color: var(--app-bg);
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
  overflow-y: hidden;
  padding: 0;
}

:deep(.ant-card-body) {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0px;
}

.detail-header h3 {
  margin: 0;
  font-size: 20px;
}

.nav-tabs {
  margin-top: 16px;
}

/* We force the router view container to scroll */
.tab-content {
  flex: 1;
  overflow-y: auto;
  padding-top: 16px;
}
</style>
