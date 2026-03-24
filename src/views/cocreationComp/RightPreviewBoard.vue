<template>
  <div class="render-content">
    <!-- 如果对应项尚未生成，显示待生成骨架屏占位图 -->
    <transition name="fade-scale" mode="out-in">
      <div v-if="!cocreationStore.generatedOptions.includes(activeTab)" :key="'empty-' + activeTab" class="skeleton-wrapper">
        <div class="ppt-placeholder">
          <h2>等待生成相应内容</h2>
          <p>在“课程大纲”中勾选并确认生成该部分内容</p>
        </div>
      </div>
      
      <!-- 否则显示真正的插件/预览区 -->
      <div v-else :key="'preview-' + activeTab" class="preview-wrapper">
        <vue-office-pptx v-if="activeTab === 'ppt'" :src="pptUrl" :style="`zoom: ${zoomLevels['ppt']}; width: 100%; height: 100%;`" />
        
        <vue-office-docx v-else-if="activeTab === 'doc'" :src="docUrl" :style="`zoom: ${zoomLevels['doc']}; width: 100%; height: 100%;`" />
        
        <video v-else-if="activeTab === 'video'" controls :src="videoUrl" :style="`zoom: ${zoomLevels['video']}; width: 100%; height: 100%; background: #000; border-radius: 8px;`"></video>
        
        <iframe v-else-if="activeTab === 'html'" :src="htmlUrl" :style="`zoom: ${zoomLevels['html']}; width: 100%; height: 100%; border: none; border-radius: 8px;`"></iframe>
      </div>
    </transition>

    <!-- 大屏/PPT教案模拟全屏编辑器 -->
    <a-modal :open="isFullscreenEdit" @update:open="$emit('update:isFullscreenEdit', $event)" 
      :title="activeTab === 'doc' ? '教案在线编辑 (模拟)' : 'PPT在线编辑 (模拟)'" 
      width="100%"
      style="top: 0; padding: 0; margin: 0; max-width: 100vw; height: 100vh;"
      :bodyStyle="{ height: 'calc(100vh - 108px)', padding: '0', display: 'flex', flexDirection: 'column', background: '#f5f5f5' }"
      @ok="handleSaveEdit" okText="保存并同步至大屏" cancelText="取消" :destroyOnClose="true">
      <div class="mock-editor-toolbar">
        <a-space>
          <a-button type="text"><strong>B</strong></a-button>
          <a-button type="text"><i>I</i></a-button>
          <a-button type="text"><u>U</u></a-button>
          <a-divider type="vertical" />
          <a-button type="text"><AlignLeftOutlined /></a-button>
          <a-button type="text"><AlignCenterOutlined /></a-button>
          <a-button type="text"><AlignRightOutlined /></a-button>
        </a-space>
      </div>
      <div class="mock-editor-content">
        <div class="mock-page">
          <h2>编辑内容</h2>
          <p>（模拟可编辑区域）</p>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
/**
 * 组件：RightPreviewBoard
 * 功能：多模态内容（PPT、Doc、视频、H5）的阅读与预览视图容器
 * 包含：各文件格式的兼容渲染组件调用、未生成态的兜底 UI，以及模拟在线编辑的全屏 Modal 实现。
 */
import { AlignLeftOutlined, AlignCenterOutlined, AlignRightOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import VueOfficePptx from '@vue-office/pptx';
import VueOfficeDocx from '@vue-office/docx';
import { useCocreationStore } from '../../stores/cocreationStore';

const cocreationStore = useCocreationStore();

defineProps<{
  activeTab: string; // 当前活动的页签
  zoomLevels: Record<string, number>; // 动态的视图缩放值
  pptUrl: string;    // PPT地址
  docUrl: string;    // 文档地址
  videoUrl: string;  // 视频地址
  htmlUrl: string;   // H5互动地址
  isFullscreenEdit: boolean; // 是否处于全屏编辑模式
}>();

const emit = defineEmits(['update:isFullscreenEdit']);

// 触发用户点击“保存同步至大屏”
const handleSaveEdit = () => {
  message.success('文档修改已保存并同步');
  emit('update:isFullscreenEdit', false);
};
</script>

<style scoped>
.render-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  background: var(--app-bg);
}

.skeleton-wrapper {
  width: 100%;
  max-width: 800px;
  background: var(--app-panel);
  padding: 32px;
  border-radius: 12px;
  /* 更突出的投影以增强板块分离感 */
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  display: flex;
  justify-content: center;
  transition: box-shadow 0.3s ease;
}

:global(.dark-theme) .skeleton-wrapper {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.ppt-placeholder {
  width: 100%;
  aspect-ratio: 16/9;
  background: var(--app-bg);
  border: 2px dashed var(--app-border);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--app-text-sub);
}

.preview-wrapper {
  width: 100%;
  height: 100%;
  overflow: auto;
  display: flex;
  justify-content: center;
  align-items: center;
}

.mock-editor-toolbar {
  background: var(--app-panel);
  padding: 8px 16px;
  border-bottom: 1px solid var(--app-border);
  box-shadow: var(--shadow-sm);
  z-index: 10;
}

.mock-editor-content {
  flex: 1;
  overflow-y: auto;
  padding: 32px;
  display: flex;
  justify-content: center;
}

.mock-page {
  background: var(--app-panel);
  width: 21cm;
  min-height: 29.7cm;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  padding: 96px;
  border-radius: 4px;
  outline: none;
}

/* 预览视图切换动画 */
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.2s ease;
}

.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.98);
}
</style>
