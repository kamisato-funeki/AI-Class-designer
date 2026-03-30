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
            @exportPng="handleExportPng"
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

    <!-- 右键独立菜单 -->
    <div v-show="contextMenuState.visible"
         class="custom-context-menu"
         :class="{ 'dark-theme': settingsStore.theme === 'dark' }"
         :style="{ left: contextMenuState.x + 'px', top: contextMenuState.y + 'px' }"
         @click.stop>
      <a-menu mode="vertical" :theme="settingsStore.theme === 'dark' ? 'dark' : 'light'" :selectable="false" style="min-width: 140px; border-radius: 8px;">
        <a-menu-item key="sibling" @click="handleContextAction('INSERT_NODE')">添加同级节点</a-menu-item>
        <a-menu-item key="child" @click="handleContextAction('INSERT_CHILD_NODE')">添加子节点</a-menu-item>
        <a-menu-item key="delete" @click="handleContextAction('REMOVE_NODE')" danger>删除节点</a-menu-item>
      </a-menu>
    </div>
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
import { ref, reactive, watch, nextTick, onMounted, onUnmounted } from 'vue';
import { message } from 'ant-design-vue';
import MindMap from 'simple-mind-map';
// @ts-expect-error simple-mind-map typings uncomplete
import Export from 'simple-mind-map/src/plugins/Export.js';

MindMap.usePlugin(Export);

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

// 右键菜单状态
const contextMenuState = reactive({
  visible: false,
  x: 0,
  y: 0,
  node: null as unknown
});

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

const saveMindMapData = () => {
  if (!mindMapInstance) return;
  try {
    // @ts-expect-error typings
    const data = mindMapInstance.getData();
    // 简单防抖或判断避免频繁触发后端请求
    cocreationStore.mindmapData = data;
  } catch { /* ignore */ }
};

// 后端发起全量替换导致的数据变化，需同步给画布实例
// 为了避免循环触发，我们只有在深层结构确实不同时才 setData
watch(() => cocreationStore.mindmapData, (newVal) => {
  if (mindMapInstance && newVal) {
    try {
      // @ts-expect-error typings
      const currentDataStr = JSON.stringify(mindMapInstance.getData());
      const newDataStr = JSON.stringify(newVal);
      if (currentDataStr !== newDataStr) {
        mindMapInstance.setData(newVal);
      }
    } catch {}
  }
}, { deep: true });

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
        mindMapInstance.view.translateX(-150);
      }
    }, 100);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    const mm = mindMapInstance as unknown as { on: (ev: string, fn: Function) => void };
    mm.on('data_change', saveMindMapData);
    mm.on('node_text_edit_end', saveMindMapData);

    // 绑定右键及点击事件，实现自定义右键菜单逻辑
    mm.on('node_contextmenu', (e: MouseEvent, node: unknown) => {
      e.preventDefault();
      contextMenuState.visible = true;
      contextMenuState.x = e.clientX;
      contextMenuState.y = e.clientY;
      contextMenuState.node = node;
    });
    mm.on('node_click', () => { contextMenuState.visible = false; });
    mm.on('draw_click', () => { contextMenuState.visible = false; });
    mm.on('view_panned', () => { contextMenuState.visible = false; });
  });
};

const closeContextMenu = () => {
  if (contextMenuState.visible) {
    contextMenuState.visible = false;
  }
};

onMounted(() => {
  if (activeTab.value === 'mindmap') initMindMap();
  document.addEventListener('click', closeContextMenu);
});

onUnmounted(() => {
  document.removeEventListener('click', closeContextMenu);
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

// 处理“确认并生成”大纲对应物料的真实的异步方法
const handleConfirmSummary = async () => {
  if (cocreationStore.generateOptions.length === 0) {
    message.warning('请至少选择一项需要生成的内容');
    return;
  }
  isGeneratingMaterials.value = true;
  message.loading({ content: '正在生成对应的资料...', key: 'gen', duration: 0 });
  
  try {
    await cocreationStore.generateMaterialsTarget([...cocreationStore.generateOptions]);
    cocreationStore.materialGenerated = true; // 解锁预览
    cocreationStore.generatedOptions = [...cocreationStore.generateOptions];
    message.success({ content: '对应部分资料生成成功', key: 'gen', duration: 2 });
  } catch {
    message.error({ content: '生成失败', key: 'gen', duration: 2 });
  } finally {
    isGeneratingMaterials.value = false;
  }
};

// 独立功能：重新生成当前激活页签的资料内容
const handleRegenerateCurrent = async () => {
  const tName = activeTab.value === 'mindmap' ? '思维导图大纲' : getMaterialName(activeTab.value);
  message.loading({ content: `正在重新生成 ${tName} ...`, key: 'regen', duration: 0 });
  
  try {
    if (activeTab.value === 'mindmap') {
      await cocreationStore.regenerateMindmap();
    } else {
      await cocreationStore.regenerateMaterialTarget(activeTab.value);
    }
    message.success({ content: `${tName} 重新生成成功`, key: 'regen', duration: 2 });
  } catch {
    message.error({ content: `${tName} 重新生成失败`, key: 'regen', duration: 2 });
  }
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

// 导出导图为 PNG 图片
const handleExportPng = () => {
  if (!mindMapInstance) return;
  message.loading({ content: '正在导出思维导图为图片...', key: 'export', duration: 0 });
  try {
    mindMapInstance.export('png', true, '课程大纲结构图');
    message.success({ content: '导出成功！', key: 'export', duration: 2 });
  } catch {
    message.error({ content: '导出失败！', key: 'export', duration: 2 });
  }
};

// 执行右键菜单指定操作
const handleContextAction = (action: string) => {
  if (!mindMapInstance || !contextMenuState.node) return;
  const mm = mindMapInstance as unknown as { execCommand: (cmd: string) => void, getData: () => unknown };
  
  // 执行画布操作
  if (action === 'INSERT_NODE') {
    mm.execCommand('INSERT_NODE');
  } else if (action === 'INSERT_CHILD_NODE') {
    mm.execCommand('INSERT_CHILD_NODE');
  } else if (action === 'REMOVE_NODE') {
    mm.execCommand('REMOVE_NODE');
  }
  
  contextMenuState.visible = false;
  
  // 发起对后端的 CRUD 通知。此处作为附加逻辑：
  // 等待绘图循环完成后提取最新数据。
  setTimeout(() => {
    try {
      const newData = mm.getData();
      let crudType: 'add' | 'update' | 'delete' | 'query' = 'update';
      if (action.includes('INSERT')) crudType = 'add';
      if (action.includes('REMOVE')) crudType = 'delete';
      cocreationStore.mindMapCrud(crudType, newData);
    } catch {}
  }, 100);
};

/**
 * 【回调】底部操作群
 */
const downloadMaterial = async () => {
  message.success('已发起全量下载请求...');
  if (cocreationStore.generatedOptions.length > 0) {
    for (const type of cocreationStore.generatedOptions) {
      await downloadSingleMaterial(type)
    }
  }
};
const downloadSingleMaterial = async (tab: string) => {
  message.loading({ content: `正在获取 ${getMaterialName(tab)} 下载链接...`, key: 'download' });
  const url = await cocreationStore.downloadMaterialByName(tab);
  if (url) {
    // 模拟文件下载流程
    const a = document.createElement('a');
    a.href = url;
    a.download = `课程资料_${getMaterialName(tab)}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    message.success({ content: `已开始下载 ${getMaterialName(tab)}`, key: 'download' });
  } else {
    message.error({ content: `获取 ${getMaterialName(tab)} 下载链接失败`, key: 'download' });
  }
};
const handleBoardPrompt = async (val: string) => {
  message.loading({ content: `正在发送局部修改指令...`, key: 'prompt' });
  if (activeTab.value === 'mindmap') {
    await cocreationStore.modifyMindmapPartial(val);
  } else {
    await cocreationStore.modifyMaterialPartial(activeTab.value, val);
  }
  message.success({ content: `局部修改执行完成`, key: 'prompt' });
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

/* 右键菜单 */
.custom-context-menu {
  position: fixed;
  z-index: 1050;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  min-width: 140px;
}
.dark-theme.custom-context-menu {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.45);
}
</style>
