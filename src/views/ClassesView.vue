<!--
  班级管理页面 (ClassesView)
  业务逻辑：
  1. 展示教师名下的所有班级列表。
  2. 支持切换班级，查看对应班级的学生名单、课程表、班级动态和班级消息。
  3. 提供新建班级功能。
  4. 支持发布课件、布置作业和发起讨论等教学互动操作。
  5. 可查看单个学生的详细学习数据统计（图表展示）。
-->
<template>
  <a-spin :spinning="loading">
    <div class="classes-container">
      <div class="page-header">
        <h2>我的班级</h2>
      </div>

      <div class="content-split">
        <!-- 左侧：班级列表切换区域 -->
        <div class="class-list-area">
          <div class="class-list-scroll">
            <a-card hoverable class="class-card" size="small" v-for="cls in classesStore.classes" :key="cls.id"
              :class="{ active: classesStore.currentClass?.id === cls.id }" @click="handleClassSwitch(cls.id)">
              <template #title>
                <span style="font-size: 15px;">{{ cls.grade }}{{ cls.classNumber }}</span>
              </template>
              <template #extra>
                <a-badge :count="`${cls.studentCount}人`"
                  :number-style="{ backgroundColor: 'var(--color-background-light)', color: 'var(--color-text-main-light)' }" />
              </template>
              <p style="margin: 0; color: gray;font-size: 12px;">{{ cls.name }}</p>
            </a-card>
          </div>
          <div class="class-list-footer">
            <a-button type="primary" block @click="createClassVisible = true">新建班级</a-button>
          </div>
        </div>

        <!-- 右侧：选中班级的详细信息展示区域 -->
        <div class="class-detail-area" v-if="classesStore.currentClass">
          <a-card :bordered="false" class="detail-card">
            <div class="detail-header" v-show="!(activeTab === 'class-chats' && classesStore.activeGroupChat)">
              <h3>
                {{ classesStore.currentClass.grade }}{{ classesStore.currentClass.classNumber }}
                <span style="font-size: 14px; font-weight: normal; color: gray;">({{ classesStore.currentClass.name
                  }})</span>
                - {{ currentTabName }}
              </h3>
              <a-space>
                <a-button type="primary" @click="openCreateTask('material')">发布课件</a-button>
                <a-button @click="openCreateTask('homework')">布置作业</a-button>
              </a-space>
            </div>

            <a-tabs :activeKey="activeTab" @change="handleTabChange" class="nav-tabs"
              v-show="!(activeTab === 'class-chats' && classesStore.activeGroupChat)">
              <a-tab-pane key="class-students" tab="学生名单" />
              <a-tab-pane key="class-schedule" tab="课程表" />
              <a-tab-pane key="class-homework" tab="班级作业" />
              <a-tab-pane key="class-dynamics" tab="班级动态" />
              <a-tab-pane key="class-chats" tab="班级消息" />
            </a-tabs>

            <div class="tab-content"
              :style="(activeTab === 'class-chats' && classesStore.activeGroupChat) ? 'padding-top: 0;' : ''">
              <!-- 嵌套路由占位符，渲染 学生名单/课程表/班级动态/班级消息 对应的组件 -->
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

    <!-- 弹窗集锦：新建班级、发布任务、学生统计 -->
    <a-modal v-model:open="createClassVisible" title="新建班级" @ok="handleCreateClass" :confirmLoading="loading">
      <a-form layout="vertical">
        <a-form-item label="班级名称">
          <a-input v-model:value="formStateClass.name" placeholder="请输入班级名称" />
        </a-form-item>
        <a-form-item label="年级">
          <a-select v-model:value="formStateClass.grade" placeholder="请选择年级">
            <a-select-option value="一年级">一年级</a-select-option>
            <a-select-option value="二年级">二年级</a-select-option>
            <a-select-option value="三年级">三年级</a-select-option>
            <a-select-option value="四年级">四年级</a-select-option>
            <a-select-option value="五年级">五年级</a-select-option>
            <a-select-option value="六年级">六年级</a-select-option>
            <a-select-option value="初一">初一</a-select-option>
            <a-select-option value="初二">初二</a-select-option>
            <a-select-option value="初三">初三</a-select-option>
            <a-select-option value="高一">高一</a-select-option>
            <a-select-option value="高二">高二</a-select-option>
            <a-select-option value="高三">高三</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="班级">
          <a-select v-model:value="formStateClass.classNumber" placeholder="请选择班级">
            <a-select-option v-for="i in 20" :key="i" :value="i + '班'">{{ i }}班</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="班级人数">
          <a-input-number v-model:value="formStateClass.studentCount" placeholder="请填写班级人数" :min="1"
            style="width: 100%" />
        </a-form-item>
        <a-form-item label="班级简介">
          <a-textarea v-model:value="formStateClass.description" placeholder="请输入班级简介" :rows="3" />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal v-model:open="createTaskVisible" :title="taskType === 'homework' ? '布置作业' : '发布课件'" @ok="handleCreateTask"
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

        <!-- 针对布置作业，支持截止时间的必选项 -->
        <a-form-item v-if="taskType === 'homework'" label="截止时间" required>
          <a-date-picker v-model:value="formStateTask.dueDate" show-time format="YYYY-MM-DD HH:mm:ss"
            placeholder="请选择截止时间" style="width: 100%" />
        </a-form-item>

        <a-form-item v-if="taskType === 'homework'" label="添加附件(选填)">
          <a-upload v-model:file-list="localFileList" name="file" action="" :before-upload="() => false">
            <a-button>点击上传附件</a-button>
          </a-upload>
        </a-form-item>

        <a-form-item label="内容描述" required>
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
          <a-statistic title="作业提交"
            :value="`${activeStudentDetails.homeworkCompleted} / ${activeStudentDetails.homeworkTotal}`" />
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
import type { Dayjs } from 'dayjs';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { BarChart, LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import VChart from 'vue-echarts';

// 注册 ECharts 核心组件，支持柱状图、折线图及其相关组件
use([CanvasRenderer, BarChart, LineChart, GridComponent, TooltipComponent, LegendComponent]);

/**
 * 核心状态与路由管理
 */
const classesStore = useClassesStore(); // 班级数据管理仓库：封装了班级列表加载、班级切换、动态资产发布等核心逻辑
const route = useRoute();               // 路由对象：用于同步当前的页签 Tab 状态
const router = useRouter();             // 路由控制器：实现跨班级、跨功能的无缝跳转

/**
 * 【计算属性】activeTab
 * 作用：计算当前激活的 Tab 键值，确保 UI 状态与路由 (`route.name`) 实时同步
 * 业务逻辑：若当前所在的路由属于合法的班级详情子路由，则返回该名称，否则回退到“学生名单”默认页签
 */
const activeTab = computed(() => {
  const name = route.name as string;
  if (!name) return 'class-students';
  if (['class-students', 'class-schedule', 'class-homework', 'class-dynamics', 'class-chats'].includes(name)) {
    return name;
  }
  return 'class-students';
});

/**
 * 【计算属性】currentTabName
 * 作用：根据 activeTab 的值返回对应的中文名称，用于在右侧内容区标题处展示
 */
const currentTabName = computed(() => {
  const map: Record<string, string> = {
    'class-students': '学生名单',
    'class-schedule': '课程表',
    'class-homework': '班级作业',
    'class-dynamics': '班级动态',
    'class-chats': '班级消息',
  };
  return map[activeTab.value] || '详情面板';
});

/**
 * 【响应式变量】UI 模态框与加载控制
 */
const loading = ref(true);              // 全局 Spin 加载遮罩开关
const createClassVisible = ref(false);  // “新建班级”对话框显隐
const createTaskVisible = ref(false);   // “资源发布（作业/讨论/课件）”对话框显隐
const studentStatsVisible = ref(false); // “学生个体画像/成绩统计”对话框显隐

/**
 * 【表单业务状态】
 */
const taskType = ref<'homework' | 'material'>('homework'); // 资产发布的操作类型

// 班级创建表单暂存对象
const formStateClass = ref({
  name: '',         // 班级名称（如：特优班）
  grade: '三年级',   // 所在年级
  classNumber: '1班', // 班次
  description: '',   // 班级口号/简介
  studentCount: 45   // 核定人数
});

// 任务/作业发布表单暂存对象
const formStateTask = ref<{
  title: string;
  description: string;
  type: 'homework' | 'material';
  dueDate?: Dayjs | null;
  materialSource: 'local' | 'generated';
}>({
  title: '',
  description: '',
  type: 'homework',
  dueDate: null,
  materialSource: 'local' // 发布课件时选择引用本地文件或 AI 生成的存档
});

const localFileList = ref<Record<string, unknown>[]>([]); // 手动选择的文件队列（仅作为展示 placeholder）
const activeStudentDetails = ref<StudentInfo | null>(null); // 指向当前正在查看画像的学生数据
const chartOption = ref({}); // 存储学生成绩 BarChart 的 ECharts 配置项

/**
 * 【生命周期钩子】onMounted
 * 作用：页面初始化数据载入
 * 业务逻辑：
 * 1. 优先调用 store 加载物理班级列表。
 * 2. 检查路由参数，若 URL 带有班级 ID 则直接选中。
 * 3. 若无参数则默认选中列表第一项并跳转到对应详情路由。
 */
onMounted(() => {
  loading.value = true;
  (async () => {
    await classesStore.loadClasses();
    if (classesStore.classes.length > 0 && !classesStore.currentClass) {
      const initId = route.params.classId as string || classesStore.classes[0]!.id;
      await classesStore.selectClass(initId);
      // 若当前处于总入口，则自动下钻到子页签
      if (!route.params.classId || route.name === 'classes') {
        router.push({ name: 'class-students', params: { classId: initId } });
      }
    } else if (classesStore.currentClass) {
      await classesStore.selectClass(classesStore.currentClass.id);
      if (route.name === 'classes') {
        router.push({ name: 'class-students', params: { classId: classesStore.currentClass.id } });
      }
    }
  })().finally(() => {
    loading.value = false;
  });
});

/**
 * 【函数】handleClassSwitch
 * 作用：处理左侧边栏的班级物理切换
 * @param id 目标班级 ID
 * 业务逻辑：
 * 1. 同步销毁上个班级的局部状态（如群聊活跃 ID）。
 * 2. 在 store 中重建新班级的 Context。
 * 3. 触发路由更新，保持当前的 Tab 功能不变。
 */
const handleClassSwitch = async (id: string) => {
  loading.value = true;
  classesStore.activeGroupChat = null;
  await classesStore.selectClass(id);
  router.push({ name: activeTab.value || 'class-students', params: { classId: id } });
  loading.value = false;
};

/**
 * 【函数】handleTabChange
 * 作用：详情区顶级页签切换
 * @param key Ant Design Tabs 的 key
 */
const handleTabChange = (key: string) => {
  if (classesStore.currentClass) {
    classesStore.activeGroupChat = null; // 切换 Tab 强制退出临时私聊/群聊全屏模式
    router.push({ name: key, params: { classId: classesStore.currentClass.id } });
  }
};

/**
 * 【函数】handleCreateClass
 * 作用：提交并持久化新班级
 * 业务逻辑：提交至 Mock Service 后，自动将视图定位到新生成的班级。
 */
const handleCreateClass = async () => {
  if (!formStateClass.value.name) return message.warning('请输入班级名称');
  loading.value = true;
  const newClass = await classesStore.createClass(formStateClass.value);
  createClassVisible.value = false;
  // 重置表单状态
  formStateClass.value = { name: '', grade: '三年级', classNumber: '1班', description: '', studentCount: 45 };
  loading.value = false;
  message.success('创建成功');
  if (newClass) {
    handleClassSwitch(newClass.id);
  }
};

/**
 * 【函数】openCreateTask
 * 作用：根据传入的动作类型，唤起对应的发布模态框
 * @param type 'material' | 'homework'
 */
const openCreateTask = (type: 'homework' | 'material') => {
  taskType.value = type;
  formStateTask.value = { title: '', description: '', type, dueDate: null, materialSource: 'local' };
  localFileList.value = [];
  createTaskVisible.value = true;
};

/**
 * 【函数】handleCreateTask
 * 作用：正式发布教学资源/作业
 * 业务逻辑：将表单数据组装为 Payload 发送至仓库，模拟实时推送到学生端的业务流。
 */
const handleCreateTask = async () => {
  if (!formStateTask.value.title) return message.warning('请输入标题');
  if (!formStateTask.value.description) return message.warning('请输入内容描述');
  if (taskType.value === 'homework' && !formStateTask.value.dueDate) {
    return message.warning('请选择截止时间');
  }

  if (!classesStore.currentClass) return;
  loading.value = true;

  const payload: Record<string, unknown> = {
    classId: classesStore.currentClass.id,
    ...formStateTask.value,
    dueDate: formStateTask.value.dueDate ? formStateTask.value.dueDate.format('YYYY-MM-DD HH:mm:ss') : undefined,
  };

  // 注入附加元数据描述
  if (taskType.value === 'material') {
    const suffix = formStateTask.value.materialSource === 'local' ? ' [附件: 本地文件]' : ' [附件: AI共创仓库资源]';
    payload.description += suffix;
    await classesStore.createTask(payload);
  } else if (taskType.value === 'homework') {
    const fakeAttachments = localFileList.value.map((f: Record<string, unknown>) => ({ name: (f.name as string) || '附件', url: '#' }));
    payload.attachments = fakeAttachments;
    await classesStore.createHomework(payload);
  }

  createTaskVisible.value = false;
  loading.value = false;
  message.success('发布任务成功');
};

/**
 * 【函数】openStudentDetails
 * 作用：获取学生大数据画像并进行可视化渲染
 * @param student 学生基本信息对象
 * 业务逻辑：
 * 1. 动态读取当前页面的 CSS 变量作为图表主题色（适配深浅色切换）。
 * 2. 构造 ECharts 配置项，反映该学生在不同测试阶段的走势情况。
 */
const openStudentDetails = (student: StudentInfo) => {
  const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim() || '#1677ff';

  activeStudentDetails.value = student;

  chartOption.value = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { show: false },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: ['入学测试', '小测 01', '小测 02', '期中考'] },
    yAxis: { type: 'value', min: 0, max: 100 },
    series: [
      {
        name: '评估得分',
        type: 'bar',
        barWidth: '50%',
        data: student.grades,
        itemStyle: {
          color: primaryColor,
          borderRadius: [4, 4, 0, 0]
        },
        label: { show: true, position: 'top', formatter: '{c}分' }
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
  margin-top: -20px;
  /* 位置微上调 */
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
