<template>
  <div class="classes-container">
    <div class="page-header">
      <h2>我的班级</h2>
      <a-button type="primary">新建班级</a-button>
    </div>

    <div class="content-split">
      <!-- Left: Class List -->
      <div class="class-list-area">
        <a-card hoverable class="class-card active">
          <template #title>
            <span>初二（3）班</span>
          </template>
          <template #extra>
            <a-badge count="45人"
              :number-style="{ backgroundColor: 'var(--color-background-light)', color: 'var(--color-text-main-light)' }" />
          </template>
          <p>最后活动: 刚刚</p>
        </a-card>

        <a-card hoverable class="class-card">
          <template #title>
            <span>初二（1）班</span>
          </template>
          <template #extra>
            <a-badge count="42人"
              :number-style="{ backgroundColor: 'var(--color-background-light)', color: 'var(--color-text-main-light)' }" />
          </template>
          <p>最后活动: 2小时前</p>
        </a-card>
      </div>

      <!-- Right: Class Details -->
      <div class="class-detail-area">
        <a-card :bordered="false" class="detail-card">
          <div class="detail-header">
            <h3>初二（3）班 - 详情面板</h3>
            <a-space>
              <a-button>布置作业</a-button>
              <a-button>发起讨论</a-button>
            </a-space>
          </div>

          <a-tabs v-model:activeKey="activeTab">
            <a-tab-pane key="students" tab="学生名单">
              <a-table :dataSource="[]" :columns="studentColumns" />
            </a-tab-pane>
            <a-tab-pane key="schedule" tab="课程表">
              <a-empty description="暂无课程排期" />
            </a-tab-pane>
            <a-tab-pane key="dynamics" tab="班级动态">
              <a-timeline>
                <a-timeline-item color="green">由于大家积极提交，作业完成率达到了95%</a-timeline-item>
                <a-timeline-item>发布了新作业《勾股定理应用》</a-timeline-item>
              </a-timeline>
            </a-tab-pane>
          </a-tabs>
        </a-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const activeTab = ref('students');

const studentColumns = [
  { title: '头像', key: 'avatar' },
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
