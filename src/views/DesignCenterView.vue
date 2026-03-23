<!--
  课程设计中心页面 (DesignCenterView)
  业务逻辑：
  1. 作为设计素材和模板的集成中心。
  2. 包含两个主要页签：设计草稿（未完成的作品）和我的模板（可复用的资源）。
  3. 支持查看设计进度，并提供继续编辑或使用模版发起新设计的入口。
-->
<template>
  <div class="design-center-container">
    <div class="page-header">
      <h2>课程设计中心</h2>
    </div>

    <a-tabs v-model:activeKey="activeTab" class="bg-white-tabs">
      <!-- 页签一：设计草稿 -->
      <a-tab-pane key="drafts" tab="我的课程设计（草稿）">
        <div class="grid-view">
          <!-- 模拟渲染草稿卡片 -->
          <a-card hoverable class="design-card" v-for="i in 2" :key="i">
            <template #cover>
              <div class="cover-draft">设计草稿缩略图</div>
            </template>
            <a-card-meta title="抛物线的性质探索" description="保存于昨天 18:30" />
            <div class="progress-bar">
              <span class="progress-text">设计进度</span>
              <a-progress :percent="60" size="small" status="active" />
            </div>
            <template #actions>
              <span>继续编辑</span>
              <span>另存为模板</span>
            </template>
          </a-card>
        </div>
      </a-tab-pane>

      <!-- 页签二：模板库 -->
      <a-tab-pane key="templates" tab="我的模板">
        <div class="templates-filter">
          <a-space>
            <a-button type="primary" shape="round">PPT 模板</a-button>
            <a-button shape="round">教案模板</a-button>
            <a-button shape="round">互动游戏模板</a-button>
          </a-space>
        </div>

        <div class="grid-view mt-4">
          <!-- 模拟渲染模板卡片 -->
          <a-card hoverable class="template-card" v-for="i in 3" :key="i">
            <template #cover>
              <div class="cover-template">模板大图预览</div>
            </template>
            <a-card-meta title="经典深蓝复习课模板" description="使用次数: 15" />
            <div class="mt-2">
              <a-tag color="blue">PPT模板</a-tag>
            </div>
            <!-- 悬浮操作层 -->
            <div class="hover-overlay">
              <a-button type="primary">使用此模板</a-button>
              <a-button style="margin-top: 8px">预览</a-button>
            </div>
          </a-card>
        </div>
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

/**
 * 【响应式变量】当前选中的页签标识 (Tab Key)
 * 作用：控制页面内容在“我的课程设计（草稿）”和“我的模板”两大模块间进行切换
 * 业务逻辑：
 * - 'drafts': 展示用户正在设计中、未正式定稿的作品列表。
 * - 'templates': 展示教师沉淀的或系统预设的可复用课件/教案模板。
 */
const activeTab = ref('drafts');
</script>

<style scoped>
.design-center-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
}

.bg-white-tabs {
  background: var(--app-panel);
  padding: 0 24px 24px 24px;
  border-radius: 12px;
  min-height: 500px;
}

.grid-view {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

.cover-draft {
  height: 140px;
  background: var(--app-hover);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--app-text-sub);
}

.progress-bar {
  margin-top: 16px;
}

.progress-text {
  font-size: 12px;
  color: var(--app-text-sub);
  margin-bottom: 4px;
  display: block;
}

.templates-filter {
  margin-bottom: 24px;
}

.template-card {
  position: relative;
  overflow: hidden;
}

.cover-template {
  height: 150px;
  background: rgba(8, 145, 178, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
}

.hover-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
  backdrop-filter: blur(2px);
}

.template-card:hover .hover-overlay {
  opacity: 1;
}

.mt-2 {
  margin-top: 8px;
}

.mt-4 {
  margin-top: 16px;
}
</style>
