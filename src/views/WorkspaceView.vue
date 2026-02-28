<template>
  <div class="workspace-container">
    <!-- Header Greeting -->
    <div class="greeting">
      <h2>早上好，李老师！</h2>
      <p style="color: var(--color-text-sub-light)">今天想设计什么样的课程？</p>
    </div>

    <!-- Multi-modal input core -->
    <div class="input-core">
      <a-textarea v-model:value="inputValue" placeholder="输入课程主题，或拖拽上传参考文件 (PDF/图片)..." :bordered="false"
        :auto-size="{ minRows: 4, maxRows: 8 }" class="main-input" />
      <div class="input-actions">
        <a-space>
          <a-tooltip title="语音输入">
            <a-button shape="circle" size="large">
              <template #icon>
                <AudioOutlined />
              </template>
            </a-button>
          </a-tooltip>
          <a-tooltip title="上传文件">
            <a-button shape="circle" size="large">
              <template #icon>
                <PaperClipOutlined />
              </template>
            </a-button>
          </a-tooltip>
        </a-space>
        <a-button type="primary" size="large" class="send-btn" @click="handleSend">
          <template #icon>
            <SendOutlined />
          </template>
          生成课件
        </a-button>
      </div>
    </div>

    <!-- Quick Access Sections -->
    <div class="dashboard-grid">
      <div><!-- Recent Coursewares -->
        <div class="section-card">
          <div class="section-header">
            <h3>常用模板</h3>
            <a-button type="link" @click="$router.push('/courseware')">查看全部</a-button>
          </div>
          <div class="course-list">
            <a-card hoverable class="course-item" v-for="i in 3" :key="i">
              <template #cover>
                <div class="course-cover-placeholder">数学·复习课</div>
              </template>
              <a-card-meta title="勾股定理综合应用" description="2小时前编辑">
              </a-card-meta>
            </a-card>
          </div>
        </div>

        <div class="section-card">
          <div class="section-header">
            <h3>最近课件</h3>
            <a-button type="link" @click="$router.push('/courseware')">查看全部</a-button>
          </div>
          <div class="course-list">
            <a-card hoverable class="course-item" v-for="i in 3" :key="i">
              <template #cover>
                <div class="course-cover-placeholder">数学·复习课</div>
              </template>
              <a-card-meta title="勾股定理综合应用" description="2小时前编辑">
              </a-card-meta>
            </a-card>
          </div>
        </div>
      </div>

      <!-- Class Dynamics -->
      <div class="section-card">
        <div class="section-header">
          <h3>班级动态</h3>
        </div>
        <a-list item-layout="horizontal" :data-source="dynamics">
          <template #renderItem="{ item }">
            <a-list-item>
              <a-list-item-meta :description="item.time">
                <template #title>
                  <a>{{ item.title }}</a>
                </template>
                <template #avatar>
                  <a-avatar style="background-color: var(--color-primary)">
                    <UserOutlined />
                  </a-avatar>
                </template>
              </a-list-item-meta>
            </a-list-item>
          </template>
        </a-list>
      </div>



    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  AudioOutlined,
  PaperClipOutlined,
  SendOutlined,
  UserOutlined
} from '@ant-design/icons-vue';

const router = useRouter();
const inputValue = ref('');

const dynamics = [
  { title: '初二三班 提交了 5 份作业', time: '10分钟前' },
  { title: '李小明 同学提问了关于勾股定理的问题', time: '1小时前' },
  { title: '初二一班 单元测试平均分已出', time: '昨天' },
  { title: '初二三班 提交了 5 份作业', time: '10分钟前' },
  { title: '李小明 同学提问了关于勾股定理的问题', time: '1小时前' },
  { title: '初二一班 单元测试平均分已出', time: '昨天' },
];

const handleSend = () => {
  router.push('/cocreation');
};
</script>

<style scoped>
.workspace-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
  max-width: 1200px;
  margin: 0 auto;
}

.greeting h2 {
  margin: 0;
  font-weight: 600;
  font-size: 28px;
}

.input-core {
  background: white;
  border-radius: 16px;
  padding: 16px;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--color-border-light);
  transition: all 0.3s;
}

.input-core:focus-within {
  box-shadow: var(--shadow-lg);
  border-color: var(--color-primary);
}

.main-input {
  font-size: 16px;
  resize: none;
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border-light);
}

.send-btn {
  border-radius: 8px;
  padding: 0 32px;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
}

.section-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow-sm);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.course-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.course-item {
  border-radius: 8px;
  overflow: hidden;
}

.course-cover-placeholder {
  height: 120px;
  background: linear-gradient(135deg, #ECFEFF 0%, #CFFAFE 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
  font-weight: 500;
}

@media (max-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}
</style>
