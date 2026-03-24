<template>
  <div class="render-header">
    <a-tabs :activeKey="activeTab" @update:activeKey="$emit('update:activeTab', $event)" style="flex: 1;">
      <a-tab-pane key="mindmap" tab="课程大纲" />
      <a-tab-pane key="ppt" tab="PPT 预览" />
      <a-tab-pane key="doc" tab="教案内容" />
      <a-tab-pane key="video" tab="相关视频" />
      <a-tab-pane key="html" tab="互动H5" />
    </a-tabs>

    <div class="board-controls" v-if="cocreationStore.materialGenerated">
      <a-space>
        <!-- 新增独立重新生成按钮：在资料初次生成后显示，对当前页面内容触发重新生成 -->
        <a-button type="primary" size="small" @click="$emit('regenerate')">
          <ReloadOutlined /> 重新生成当前内容
        </a-button>

        <!-- 编辑模式入口 -->
        <a-button v-if="['ppt', 'doc'].includes(activeTab)" type="primary" size="small" @click="$emit('openFullscreen')">
          <EditOutlined /> 全屏编辑
        </a-button>

        <!-- 视图缩放控制组 -->
        <a-button-group size="small">
          <a-button @click="$emit('zoomOut')">
            <ZoomOutOutlined />
          </a-button>
          <a-button style="width: 60px; pointer-events: none;">
            {{ Math.round((zoomLevels[activeTab] || 1) * 100) }}%
          </a-button>
          <a-button @click="$emit('zoomIn')">
            <ZoomInOutlined />
          </a-button>
        </a-button-group>
      </a-space>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 组件：RightBoardHeader
 * 功能：共创页面右侧内容的顶部导航及工具栏
 * 包含：多模态内容页签切换、重新生成功能、全屏编辑功能及缩放工具。
 */
import { EditOutlined, ZoomInOutlined, ZoomOutOutlined, ReloadOutlined } from '@ant-design/icons-vue';
import { useCocreationStore } from '../../stores/cocreationStore';

// 使用 Pinia 仓库，读取资产是否生成的标记
const cocreationStore = useCocreationStore();

// 接收父组件传入的状态
defineProps<{
  activeTab: string; // 当前激活的 Tab (mindmap, ppt, doc, 等)
  zoomLevels: Record<string, number>; // 保存各 Tab 视图独立缩放比例的对象
}>();

// 定义抛出给父组件处理的方法
defineEmits(['update:activeTab', 'zoomIn', 'zoomOut', 'openFullscreen', 'regenerate']);
</script>

<style scoped>
.render-header {
  padding: 0 24px;
  background: var(--app-panel);
  border-bottom: 1px solid var(--app-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  /* 增强明亮模式下的视觉区分度和立体感 */
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
  position: relative;
  z-index: 10;
}

/* 适配暗黑模式，弱化投影 */
:global(.dark-theme) .render-header {
  box-shadow: none;
}
</style>
