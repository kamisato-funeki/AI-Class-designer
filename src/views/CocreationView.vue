<template>
  <div class="cocreation-container">
    <!-- Left Column: AI Dialogue Area (35%) -->
    <div class="dialogue-area">
      <div class="chat-history">
        <!-- User Bubble -->
        <div class="chat-bubble user">
          帮我设计一份初二数学《勾股定理》的复习课讲义。
        </div>

        <!-- AI Bubble -->
        <div class="chat-bubble ai">
          没问题，我已经提取了《勾股定理》的核心考点。请问这节复习课的重点在于基础回顾，还是知识应用？
        </div>

        <!-- User Bubble -->
        <div class="chat-bubble user">
          注重应用，尤其是利用勾股定理解决实际生活的应用题。
        </div>

        <!-- Summary Card -->
        <a-card size="small" title="📝 需求确认卡" class="summary-card">
          <p><strong>科目：</strong> 初二数学</p>
          <p><strong>主题：</strong> 《勾股定理》复习课</p>
          <p><strong>重点：</strong> 实际生活应用题解析</p>
          <div style="text-align: right">
            <a-button type="primary" size="small">确认并生成大纲</a-button>
          </div>
        </a-card>
      </div>

      <!-- Input Actions Bottom -->
      <div class="chat-input-area">
        <a-input disabled placeholder="与AI继续对话或长传资料..." :v-model="inputVal">
          <template #prefix>
            <PaperClipOutlined class="cursor-pointer" />
          </template>
          <template #suffix>
            <AudioOutlined class="cursor-pointer" />
            <SendOutlined class="cursor-pointer" style="color: var(--color-primary); margin-left:8px;" />
          </template>
        </a-input>
      </div>
    </div>

    <!-- Right Column: Render Area (65%) -->
    <div class="render-area">
      <div class="render-header">
        <a-tabs v-model:activeKey="activeTab" style="width: 100%">
          <a-tab-pane key="ppt" tab="PPT 预览" />
          <a-tab-pane key="doc" tab="教案内容" />
          <a-tab-pane key="mindmap" tab="思维导图" />
          <a-tab-pane key="game" tab="课堂互动" />
        </a-tabs>
      </div>

      <div class="render-content">
        <div v-if="loading" class="skeleton-wrapper">
          <a-skeleton active :paragraph="{ rows: 10 }" />
        </div>
        <div v-else class="preview-wrapper">
          <div class="ppt-placeholder">
            <h2>勾股定理综合应用</h2>
            <p>生活中的应用实例解析</p>
          </div>
        </div>
      </div>

      <div class="render-footer">
        <a-space>
          <a-button><DownloadOutlined /> 下载资料包</a-button>
          <a-button><ReloadOutlined /> 重新生成</a-button>
        </a-space>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
  AudioOutlined,
  SendOutlined,
  PaperClipOutlined,
  DownloadOutlined,
  ReloadOutlined
} from '@ant-design/icons-vue';

const activeTab = ref('ppt');
const loading = ref(false); // Can toggle to show skeleton animation feature
const inputVal = ref('');
</script>

<style scoped>
.cocreation-container {
  display: flex;
  height: calc(100vh - 64px - 48px); /* Full height minus header / padding */
  margin: -24px; /* offset the layout padding */
}

/* Left Area: 35% */
.dialogue-area {
  flex: 0 0 35%;
  background: white;
  border-right: 1px solid var(--color-border-light);
  display: flex;
  flex-direction: column;
}

.chat-history {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.chat-bubble {
  max-width: 85%;
  padding: 12px 16px;
  border-radius: 12px;
  line-height: 1.5;
}

.chat-bubble.user {
  align-self: flex-end;
  background-color: var(--color-background-light); /* As per design:主色浅底 */
  border: 1px solid var(--color-primary);
  color: var(--color-text-main-light);
  border-bottom-right-radius: 4px;
}

.chat-bubble.ai {
  align-self: flex-start;
  background-color: #F3F4F6;
  color: var(--color-text-main-light);
  border-bottom-left-radius: 4px;
}

.summary-card {
  align-self: center;
  width: 90%;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-sm);
  margin-top: 16px;
}

.chat-input-area {
  padding: 16px;
  border-top: 1px solid var(--color-border-light);
  background: white;
}

/* Right Area: 65% */
.render-area {
  flex: 1;
  background: var(--color-background-light);
  display: flex;
  flex-direction: column;
}

.render-header {
  padding: 0 24px;
  background: white;
  border-bottom: 1px solid var(--color-border-light);
}

.render-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  display: flex;
  justify-content: center;
  align-items: center;
}

.skeleton-wrapper {
  width: 100%;
  max-width: 800px;
  background: white;
  padding: 32px;
  border-radius: 12px;
  box-shadow: var(--shadow-sm);
}

.preview-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ppt-placeholder {
  width: 800px;
  aspect-ratio: 16/9;
  background: white;
  box-shadow: var(--shadow-md);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
}

.render-footer {
  padding: 16px 24px;
  background: white;
  border-top: 1px solid var(--color-border-light);
  text-align: right;
}
</style>
