<template>
  <div class="footer-container">
    <!-- 独立看板指令区：用于针对单个看板内容的局部调整或重写指示 -->
    <div class="board-prompt-area" v-if="activeTab === 'mindmap' || cocreationStore.generatedOptions.includes(activeTab)">
      <a-input-search 
        v-model:value="boardPrompt" 
        placeholder="对当前页面内容的局部修改指令..." 
        enter-button="发送修改"
        @search="handleSearch" 
      />
    </div>

    <!-- 渲染区底部操作：一键打包含部分与全局资产的下载 -->
    <div class="render-footer" v-if="cocreationStore.generatedOptions.length > 0">
      <a-space>
        <a-button 
          v-if="activeTab !== 'mindmap' && cocreationStore.generatedOptions.includes(activeTab)" 
          @click="$emit('downloadSingle', activeTab)"
        >
          <DownloadOutlined /> 下载当前{{ getMaterialName(activeTab) }}
        </a-button>
        <a-button type="primary" ghost @click="$emit('downloadAll')">
          <DownloadOutlined /> 下载全部内容
        </a-button>
      </a-space>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 组件：RightBoardFooter
 * 功能：页面底部指令发送区与资源下载集合区
 * 包含：对已有当前看板视图内容的局部重新生成指令、导出成品的下载按钮集。
 */
import { ref } from 'vue';
import { DownloadOutlined } from '@ant-design/icons-vue';
import { useCocreationStore } from '../../stores/cocreationStore';

const cocreationStore = useCocreationStore();

// 接收活动的 tab 来决定显示何种下载文字
defineProps<{
  activeTab: string;
}>();

const emit = defineEmits(['boardPrompt', 'downloadSingle', 'downloadAll']);

// 本地绑定的当前输入框内容
const boardPrompt = ref('');

// 触发局部修改指令的流转并置空
const handleSearch = () => {
  if (!boardPrompt.value.trim()) return;
  emit('boardPrompt', boardPrompt.value);
  boardPrompt.value = '';
};

// 工具函数：Tab key 映射可视中文字段
const getMaterialName = (tab: string) => {
  const map: Record<string, string> = {
    ppt: 'PPT', doc: '教案', video: '视频', html: 'H5'
  };
  return map[tab] || '资产';
};
</script>

<style scoped>
.footer-container {
  display: flex;
  flex-direction: column;
}

.board-prompt-area {
  padding: 12px 24px;
  background: var(--app-panel);
  border-top: 1px solid var(--app-border);
  /* 增强浅色模式分界线立体感，提升区隔度 */
  box-shadow: 0 -2px 10px rgba(0,0,0,0.03);
  position: relative;
  z-index: 5;
}

.render-footer {
  padding: 16px 24px;
  background: var(--app-panel);
  border-top: 1px solid var(--app-border);
  text-align: right;
}

/* 适配暗主题，去掉额外光影 */
:global(.dark-theme) .board-prompt-area {
  box-shadow: none;
}
</style>
