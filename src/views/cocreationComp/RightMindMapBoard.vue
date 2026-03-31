<template>
  <div class="mindmap-container"
    style="width: 100%; height: 100%; display: flex; flex-direction: column; position: relative;">
    <!-- Simple Mind Map 实例化挂载点 -->
    <div id="mindMapContainer" style="flex: 1; min-height: 0; width: 100%;"></div>

    <!-- 需求确认看板浮窗：支持折叠/展开功能以减少屏幕占用 -->
    <div class="generation-options-floating" :class="[
      settingsStore.theme === 'dark' ? 'dark-theme' : '',
      { 'is-collapsed': isBoardCollapsed }
    ]">
      <a-card size="small" class="generation-card"
      :bodyStyle="{ padding: isBoardCollapsed ? '0 12px' : '12px',
                    transition: 'padding 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)' }">
        <template #title>
          <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
            <div>
              <span>需求与生成设置</span>
            </div>
            <!-- 折叠与展开控制按钮 -->
            <a-button type="text" size="small" @click="toggleCollapse" style="padding: 0; margin-left: auto;">
              <UpOutlined v-if="!isBoardCollapsed" />
              <DownOutlined v-else />
            </a-button>
          </div>
        </template>

        <!-- 卡片内容区域：选定生成的资产类型 -->
        <transition name="slide-card">
          <div v-show="!isBoardCollapsed" class="generation-card-content">
            <a-checkbox-group v-model:value="cocreationStore.generateOptions" style="display: flex; flex-direction: column; gap: 4px;">
              <a-checkbox value="ppt">PPT演示</a-checkbox>
              <a-checkbox value="doc">教案文档</a-checkbox>
              <a-checkbox value="video">相关视频</a-checkbox>
              <a-checkbox value="html">互动H5</a-checkbox>
            </a-checkbox-group>

            <a-tag v-if="cocreationStore.materialGenerated" color="green" style="position: absolute; top: 45px; right: 0px; font-size: 8px;">已生成</a-tag>

            <div style="margin-top: 12px; text-align: right;display: flex; justify-content: center; align-items: center; flex-direction: column; gap: 8px;">
              <a-progress v-if="isGeneratingMaterials" :percent="cocreationStore.generationProgress" size="small" :status="cocreationStore.generationProgress === 100 ? 'success' : 'active'" />
              <!-- 这里依然保留原有逻辑：若已生成过资料，此处的文案变为【重新生成】作为批量重构入口 -->
              <a-button type="primary" size="small" @click="$emit('confirmSummary')" :loading="isGeneratingMaterials" :disabled="isGeneratingMaterials" style="width: 100%;">
                {{ cocreationStore.materialGenerated ? '重新生成' : '确认并生成' }}
              </a-button>
            </div>
          </div>
        </transition>
      </a-card>
    </div>

    <!-- 思维导图增强控件：回到中心根节点浮窗按钮 & 导出按钮 -->
    <div class="mindmap-tools">
      <a-tooltip title="导出为PNG图片">
        <a-button shape="circle" size="large" type="primary" class="reset-view-btn" @click="$emit('exportPng')">
          <ExportOutlined />
        </a-button>
      </a-tooltip>
      <a-tooltip title="回到根节点">
        <a-button shape="circle" size="large" type="primary" class="reset-view-btn" @click="$emit('resetView')">
          <AimOutlined />
        </a-button>
      </a-tooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 组件：RightMindMapBoard
 * 功能：承载思维导图画布（大纲编辑）及悬浮的需求生成看板
 * 业务逻辑：提供对大纲进行需求圈定（生成何种资料）的设置界面，支持折叠减少空间占用；并提供一键定位思维导图回原点的便捷功能。
 */
import { ref } from 'vue';
import { UpOutlined, DownOutlined, AimOutlined, ExportOutlined } from '@ant-design/icons-vue';
import { useCocreationStore } from '../../stores/cocreationStore';
import { useSettingsStore } from '../../stores/settingsStore';

/**
 * 状态仓库
 */
const cocreationStore = useCocreationStore(); // 共创协作状态管理
const settingsStore = useSettingsStore();     // 全局主题状态

/**
 * 【组件属性及事件】
 */
defineProps<{
  // 传入父组件控制是否正在执行“生成中”的 Loading 状态
  isGeneratingMaterials: boolean;
}>();

// `confirmSummary`: 用户确定生成资料清单请求
// `resetView`: 触发思维导图视角复位操作
// `exportPng`: 出发思维导图PNG导出操作
defineEmits(['confirmSummary', 'resetView', 'exportPng']);

/**
 * 【状态变量：需求确认看板】
 * 业务逻辑：控制右侧悬浮看板的折叠状态，折叠后隐藏内容体仅保留 Header，减少其面积干扰
 */
const isBoardCollapsed = ref(false);

const toggleCollapse = () => {
  isBoardCollapsed.value = !isBoardCollapsed.value;
};
</script>

<style scoped>
/* 悬浮面板的基础设置及过渡动画 */
.generation-options-floating {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
  width: 150px;
  border-radius: 8px;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

/* 折叠状态下缩小宽度占用 */
.generation-options-floating.is-collapsed {
  width: 150px;
}

.generation-card {
  border-color: var(--color-primary);
  /* 增加悬浮阴影，增强明亮模式的视觉层级区分度 */
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.generation-card-content {
  padding: 8px 0;
  overflow: hidden;
}

/* 卡片内容区展开收起动画 */
.slide-card-enter-active,
.slide-card-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  max-height: 200px; /* 足以容纳内容的数值 */
  opacity: 1;
}

.slide-card-enter-from,
.slide-card-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
  margin-top: 0;
  margin-bottom: 0;
}

/* 适配暗主题 */
.dark-theme .generation-card {
  background-color: var(--app-panel);
  border-color: var(--app-border);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

/* 回根节点按钮及工具栏样式 */
.mindmap-tools {
  position: absolute;
  bottom: 32px;
  right: 24px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.reset-view-btn {
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
}

:global(.dark-theme) .reset-view-btn {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
}
</style>
