<template>
  <div class="render-area">
    <!-- 顶部导航及各类全局/当前资产控制集 -->
    <RightBoardHeader
      v-model:activeTab="activeTab"
      :zoomLevels="zoomLevels"
      @zoomIn="zoomIn"
      @zoomOut="zoomOut"
      @openFullscreen="openFullscreenEdit"
      @regenerate="handleRegenerateCurrent"
    />

    <div class="render-viewport">
      <!-- 中间渲染核心区：思维导图 -->
      <transition name="fade-slide">
        <div v-show="activeTab === 'mindmap'" class="tab-page">
          <RightMindMapBoard
            :isGeneratingMaterials="isGeneratingMaterials"
            @confirmSummary="handleConfirmSummary"
            @resetView="handleResetView"
          />
        </div>
      </transition>

      <!-- 中间渲染核心区：其余资产资源预览 -->
      <transition name="fade-slide">
        <div v-show="activeTab !== 'mindmap'" class="tab-page">
          <RightPreviewBoard
            :activeTab="activeTab"
            :zoomLevels="zoomLevels"
            :pptUrl="pptUrl"
            :docUrl="docUrl"
            :videoUrl="videoUrl"
            :htmlUrl="htmlUrl"
            v-model:isFullscreenEdit="isFullscreenEdit"
          />
        </div>
      </transition>
    </div>

    <!-- 底部微调指令及下载操作集 -->
    <RightBoardFooter
      :activeTab="activeTab"
      @boardPrompt="handleBoardPrompt"
      @downloadSingle="downloadSingleMaterial"
      @downloadAll="downloadMaterial"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * 课件共创页面 - 右侧渲染区域 (CocreationRight) 重构版
 * 业务逻辑：
 * 1. 作为容器，协调顶部导航 (RightBoardHeader) 与底部操作 (RightBoardFooter)。
 * 2. 挂载中间的主体渲染区，包括思维导图页 (RightMindMapBoard) 与资源预览页 (RightPreviewBoard)。
 * 3. 维护共用的上下文状态（如缩放、全屏变量等）和实例化第三方视图引擎（如 mindmap）。
 */
import { ref, reactive, watch, nextTick, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import MindMap from 'simple-mind-map';

import RightBoardHeader from './RightBoardHeader.vue';
import RightMindMapBoard from './RightMindMapBoard.vue';
import RightPreviewBoard from './RightPreviewBoard.vue';
import RightBoardFooter from './RightBoardFooter.vue';

import { useCocreationStore } from '../../stores/cocreationStore';
import { useSettingsStore } from '../../stores/settingsStore';

// 状态库
const cocreationStore = useCocreationStore();
const settingsStore = useSettingsStore();

/**
 * 【响应式变量：导航与预览资产地址】
 */
const activeTab = ref<'mindmap' | 'ppt' | 'doc' | 'video' | 'html'>('mindmap');
const pptUrl = ref('https://docs.google.com/presentation/d/1iIU9QfGpr9F101KvhVCsd9RtpyOQM0KBUIcf1l6W63s/edit?usp=sharing');
const docUrl = ref('https://image2url.com/r2/default/files/1772455500887-fda7d267-b975-4a9a-abc9-d14489518cd5.docx');
const videoUrl = ref('https://www.w3schools.com/html/mov_bbb.mp4');
const htmlUrl = ref('https://bilibili.com');

/**
 * 【响应式变量：UI 与缩放】
 */
const zoomLevels = reactive<Record<'mindmap' | 'ppt' | 'doc' | 'video' | 'html', number>>({
  mindmap: 1.0, ppt: 1.0, doc: 1.0, video: 1.0, html: 1.0
});
const isGeneratingMaterials = ref(false);
const isFullscreenEdit = ref(false);

let mindMapInstance: MindMap | null = null;

// 顶部 Toolbar 回调：视图放大
const zoomIn = () => {
  if (zoomLevels[activeTab.value] < 2.0) {
    zoomLevels[activeTab.value] = parseFloat((zoomLevels[activeTab.value] + 0.1).toFixed(1));
    updateMindMapScale();
  }
};

// 顶部 Toolbar 回调：视图缩小
const zoomOut = () => {
  if (zoomLevels[activeTab.value] > 0.3) {
    zoomLevels[activeTab.value] = parseFloat((zoomLevels[activeTab.value] - 0.1).toFixed(1));
    updateMindMapScale();
  }
};

// 同步 SimpleMindMap 比例
const updateMindMapScale = () => {
  if (activeTab.value === 'mindmap' && mindMapInstance) {
    // @ts-expect-error ignore simple-mind-map argument typings
    mindMapInstance.view.setScale(zoomLevels['mindmap']);
  }
};

/**
 * 思维导图生命周期管理
 */
const DEFAULT_MINDMAP_DATA = {
  data: { text: "课程大纲" },
  children: [
    { data: { text: "知识点 1" } }, { data: { text: "知识点 2" } },
    { data: { text: "应用" }, children: [{ data: { text: "案例" } }] }
  ]
};

/**
 * 【函数】saveMindMapData
 * 作用：暂存当前思维导图的 JSON 数据至 Pinia Store
 * 业务逻辑：确保用户在对话、预览 PPT 切换回思维导图时，其编辑结果不会丢失。
 */
const saveMindMapData = () => {
  if (!mindMapInstance) return;
  try {
    // @ts-expect-error typings
    const data = mindMapInstance.getData();
    cocreationStore.mindmapData = data;
  } catch { /* ignore */ }
};

// 动态获取配套的思维导图主题配置（重点为字体颜色与透明背景适应双主题）
const getCustomThemeConfig = (isDark: boolean) => {
  return {
    backgroundColor: 'transparent',
    lineColor: isDark ? '#434343' : '#d9d9d9',
    root: {
      fillColor: isDark ? '#177ddc' : '#1890ff',
      color: '#ffffff',
      borderColor: 'transparent',
    },
    second: {
      fillColor: isDark ? '#141414' : '#ffffff',
      color: isDark ? '#e5e7eb' : '#333333',
      borderColor: isDark ? '#434343' : '#d9d9d9',
    },
    node: {
      color: isDark ? '#e5e7eb' : '#333333',
    },
    generalization: {
      fillColor: isDark ? '#141414' : '#ffffff',
      color: isDark ? '#e5e7eb' : '#333333',
      borderColor: isDark ? '#434343' : '#d9d9d9',
    }
  };
};

/**
 * 【核心函数】initMindMap
 * 作用：挂载、销毁并初始化思维导图 DOM 节点
 * 业务逻辑：
 * 1. 查找 DOM 容器。
 * 2. 结合 settingsStore 主题色进行初始化。
 * 3. 注入 store 中持久化的大纲数据。
 * 4. 绑定数据变化监听，实时同步至仓库。
 */
const initMindMap = () => {
  nextTick(() => {
    const container = document.getElementById('mindMapContainer');
    if (!container) return;
    if (mindMapInstance) mindMapInstance.destroy();

    const savedData = cocreationStore.mindmapData;
    // @ts-expect-error typings
    mindMapInstance = new MindMap({
      el: container,
      theme: settingsStore.theme === 'dark' ? 'dark' : 'default',
      themeConfig: getCustomThemeConfig(settingsStore.theme === 'dark'),
      data: savedData ?? DEFAULT_MINDMAP_DATA
    });
    // @ts-expect-error typings
    mindMapInstance.view.setScale(zoomLevels['mindmap']);

    // 初始渲染时稍微向左偏移，以避开右侧浮窗
    setTimeout(() => {
      if (mindMapInstance) {
        mindMapInstance.view.translateX(-250);
      }
    }, 100);

    const mm = mindMapInstance as unknown as { on: (ev: string, fn: () => void) => void };
    mm.on('data_change', saveMindMapData);
    mm.on('node_text_edit_end', saveMindMapData);
  });
};

onMounted(() => {
  if (activeTab.value === 'mindmap') initMindMap();
});

watch(activeTab, (val) => {
  if (val === 'mindmap') initMindMap();
});

watch(() => cocreationStore.currentCoursewareId, () => {
  if (activeTab.value === 'mindmap') initMindMap();
});

watch(() => settingsStore.theme, (theme) => {
  if (mindMapInstance) {
    mindMapInstance.setTheme(theme === 'dark' ? 'dark' : 'default');
    mindMapInstance.setThemeConfig(getCustomThemeConfig(theme === 'dark'));
  }
});

// 处理“确认并生成”大纲对应物料的模拟异步方法
const handleConfirmSummary = () => {
  if (cocreationStore.generateOptions.length === 0) {
    message.warning('请至少选择一项需要生成的内容');
    return;
  }
  isGeneratingMaterials.value = true;
  message.loading({ content: '正在生成对应的资料...', key: 'gen', duration: 0 });
  setTimeout(() => {
    isGeneratingMaterials.value = false;
    cocreationStore.materialGenerated = true; // 解锁预览
    cocreationStore.generatedOptions = [...cocreationStore.generateOptions];
    message.success({ content: '对应部分资料生成成功', key: 'gen', duration: 2 });
  }, 2000);
};

// 独立功能：重新生成当前激活页签的资料内容
const handleRegenerateCurrent = () => {
  const tName = activeTab.value === 'mindmap' ? '思维导图大纲' : getMaterialName(activeTab.value);
  message.loading({ content: `正在重新生成 ${tName} ...`, key: 'regen', duration: 0 });
  setTimeout(() => {
    message.success({ content: `${tName} 重新生成成功`, key: 'regen', duration: 2 });
  }, 1500);
};

// 工具函数：Tab key 映射可视中文字段
const getMaterialName = (tab: string) => {
  const map: Record<string, string> = {
    ppt: 'PPT', doc: '教案', video: '视频', html: 'H5'
  };
  return map[tab] || '';
};

// 交互功能：重置（居中）思维导图视角，并稍微偏左避开右侧浮窗
const handleResetView = () => {
  if (mindMapInstance) {
    mindMapInstance.view.reset();
    setTimeout(() => {
      if (mindMapInstance) {
        mindMapInstance.view.translateX(-150);
      }
    }, 300);
  }
};

/**
 * 【回调】底部操作群
 */
const downloadMaterial = () => {
  message.success('开始下载全部资料包...');
};
const downloadSingleMaterial = (tab: string) => {
  message.success(`开始下载单项资料：${getMaterialName(tab)}...`);
};
const handleBoardPrompt = (val: string) => {
  message.success(`发送局部修改指令：${val}`);
};

/**
 * 【回调】全屏模拟编辑模式
 */
const openFullscreenEdit = () => {
  isFullscreenEdit.value = true;
};
</script>

<style scoped>
.render-area {
  background: var(--app-bg);
  display: flex;
  flex-direction: column;
  height: 100%;
}

.render-viewport {
  flex: 1;
  position: relative;
  overflow: hidden;
  display: flex;
}

.tab-page {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 页面切换动画 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
