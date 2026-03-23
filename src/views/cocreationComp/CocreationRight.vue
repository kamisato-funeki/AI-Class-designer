<!--
  课件共创页面 - 右侧渲染区域 (CocreationRight)
  业务逻辑：
  1. 多模态内容预览：支持课程大纲（思维导图）、PPT、教案 (Doc)、视频及互动 H5 的切换。
  2. 思维导图交互：集成 simple-mind-map 实现可编辑的课程逻辑大纲。
  3. 资产生成管理：提供勾选框控制不同类型资料的生成，并支持异步生成进度展示。
  4. 辅助功能：提供内容缩放、全屏在线编辑（模拟）、单项或全量资料下载。
  5. 局部指令中心：在任何内容页均可发送局部修改指令，对当前看板内容进行精准调优。
-->
<template>
  <div class="render-area">
    <!-- 渲染区顶部：多维度页签导航 -->
    <div class="render-header" style="display: flex; justify-content: space-between; align-items: center;">
      <a-tabs v-model:activeKey="activeTab" style="flex: 1;">
        <a-tab-pane key="mindmap" tab="课程大纲" />
        <a-tab-pane key="ppt" tab="PPT 预览" />
        <a-tab-pane key="doc" tab="教案内容" />
        <a-tab-pane key="video" tab="相关视频" />
        <a-tab-pane key="html" tab="互动H5" />
      </a-tabs>

      <!-- 右上角工具栏：缩放与编辑 -->
      <div class="board-controls" v-if="cocreationStore.materialGenerated">
        <a-space>
          <a-button v-if="['ppt', 'doc'].includes(activeTab)" type="primary" size="small" @click="openFullscreenEdit">
            <EditOutlined /> 全屏编辑
          </a-button>
          <!-- 缩放控制组 -->
          <a-button-group size="small">
            <a-button @click="zoomOut">
              <ZoomOutOutlined />
            </a-button>
            <a-button style="width: 60px; pointer-events: none;">{{ Math.round((zoomLevels[activeTab] || 1) * 100)
              }}%</a-button>
            <a-button @click="zoomIn">
              <ZoomInOutlined />
            </a-button>
          </a-button-group>
        </a-space>
      </div>
    </div>

    <div class="render-content">
      <div v-show="activeTab === 'mindmap'" style="width: 100%; height: 100%; display: flex; flex-direction: column; position: relative;">
        <div id="mindMapContainer" style="flex: 1; min-height: 0; width: 100%;"></div>
        <div class="generation-options-floating"
          :class="{ 'dark-theme': settingsStore.theme === 'dark' }">
          <a-card size="small" class="generation-card">
            <template #title>
              <span>需求与生成设置</span>
              <a-tag v-if="cocreationStore.materialGenerated" color="green" style="margin-left: 8px; font-size: 11px;">已生成</a-tag>
            </template>
            <a-checkbox-group v-model:value="cocreationStore.generateOptions" style="display: flex; flex-direction: column; gap: 8px;">
              <a-checkbox value="ppt">PPT演示</a-checkbox>
              <a-checkbox value="doc">教案文档</a-checkbox>
              <a-checkbox value="video">相关视频</a-checkbox>
              <a-checkbox value="html">互动H5</a-checkbox>
            </a-checkbox-group>
            <div style="margin-top: 16px; text-align: right;">
              <a-button type="primary" @click="handleConfirmSummary" :loading="isGeneratingMaterials">
                {{ cocreationStore.materialGenerated ? '重新生成' : '确认并生成' }}
              </a-button>
            </div>
          </a-card>
        </div>
      </div>

      <template v-if="activeTab !== 'mindmap'">
        <div v-if="!cocreationStore.generatedOptions.includes(activeTab)" class="skeleton-wrapper">
          <div class="ppt-placeholder">
            <h2>等待生成相应内容</h2>
            <p>在“课程大纲”中勾选并确认生成该部分内容</p>
          </div>
        </div>
        <div v-else class="preview-wrapper"
          style="width: 100%; height: 100%; overflow: auto; display: flex; justify-content: center; align-items: center;">
          <vue-office-pptx v-if="activeTab === 'ppt'" :src="pptUrl"
            :style="`zoom: ${zoomLevels['ppt']}; width: 100%; height: 100%;`" />

          <vue-office-docx v-else-if="activeTab === 'doc'" :src="docUrl"
            :style="`zoom: ${zoomLevels['doc']}; width: 100%; height: 100%;`" />

          <video v-else-if="activeTab === 'video'" controls :src="videoUrl"
            :style="`zoom: ${zoomLevels['video']}; width: 100%; height: 100%; background: #000; border-radius: 8px;`"></video>

          <iframe v-else-if="activeTab === 'html'" :src="htmlUrl"
            :style="`zoom: ${zoomLevels['html']}; width: 100%; height: 100%; border: none; border-radius: 8px;`"></iframe>
        </div>
      </template>
    </div>

    <!-- 独立看板指令区：用于对当前内容进行局部微调 -->
    <div class="board-prompt-area" v-if="activeTab === 'mindmap' || cocreationStore.generatedOptions.includes(activeTab)">
      <a-input-search v-model:value="boardPrompt" placeholder="对当前页面内容的局部修改指令..." enter-button="发送修改"
        @search="handleBoardPrompt" />
    </div>

    <div class="render-footer" v-if="cocreationStore.generatedOptions.length > 0">
      <a-space>
        <a-button v-if="activeTab !== 'mindmap' && cocreationStore.generatedOptions.includes(activeTab)" @click="downloadSingleMaterial(activeTab)">
          <DownloadOutlined /> 下载{{ getMaterialName(activeTab) }}
        </a-button>
        <a-button @click="downloadMaterial">
          <DownloadOutlined /> 下载全部内容
        </a-button>
      </a-space>
    </div>

    <!-- Fullscreen Edit Modal -->
    <a-modal v-model:open="isFullscreenEdit" :title="activeTab === 'doc' ? '教案在线编辑 (模拟)' : 'PPT在线编辑 (模拟)'" width="100%"
      style="top: 0; padding: 0; margin: 0; max-width: 100vw; height: 100vh;"
      :bodyStyle="{ height: 'calc(100vh - 108px)', padding: '0', display: 'flex', flexDirection: 'column', background: '#f5f5f5' }"
      @ok="handleSaveEdit" okText="保存并同步至大屏" cancelText="取消" :destroyOnClose="true">
      <div class="mock-editor-toolbar">
        <a-space>
          <a-button type="text"><strong>B</strong></a-button>
          <a-button type="text"><i>I</i></a-button>
          <a-button type="text"><u>U</u></a-button>
          <a-divider type="vertical" />
          <a-button type="text">
            <AlignLeftOutlined />
          </a-button>
          <a-button type="text">
            <AlignCenterOutlined />
          </a-button>
          <a-button type="text">
            <AlignRightOutlined />
          </a-button>
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
import { ref, reactive, watch, nextTick, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import {
  DownloadOutlined, ZoomInOutlined, ZoomOutOutlined, EditOutlined,
  AlignLeftOutlined, AlignCenterOutlined, AlignRightOutlined
} from '@ant-design/icons-vue';
import VueOfficePptx from '@vue-office/pptx';
import VueOfficeDocx from '@vue-office/docx';
import MindMap from 'simple-mind-map';
import { useCocreationStore } from '../../stores/cocreationStore';
import { useSettingsStore } from '../../stores/settingsStore';

/**
 * 状态仓库
 */
const cocreationStore = useCocreationStore(); // 共创协作仓库：管理思维导图数据、已生成的资产、生成选项等
const settingsStore = useSettingsStore();     // 全局设置仓库：主要用于响应式切换思维导图的主题（深色/浅色）

/**
 * 【响应式变量】预览切换与资源路径
 * 业务逻辑：根据 `activeTab` 展示不同模态的内容，如课件大纲、PPT、文档等。
 */
const activeTab = ref<'mindmap' | 'ppt' | 'doc' | 'video' | 'html'>('mindmap'); // 当前激活的看板页签
const pptUrl = ref('https://docs.google.com/presentation/d/1iIU9QfGpr9F101KvhVCsd9RtpyOQM0KBUIcf1l6W63s/edit?usp=sharing');
const docUrl = ref('https://image2url.com/r2/default/files/1772455500887-fda7d267-b975-4a9a-abc9-d14489518cd5.docx');
const videoUrl = ref('https://www.w3schools.com/html/mov_bbb.mp4');
const htmlUrl = ref('https://bilibili.com');

/**
 * 【响应式变量】缩放级别管理
 * 作用：为每个看板页签独立维护一套缩放比例，增强预览体验
 */
const zoomLevels = reactive<Record<'mindmap' | 'ppt' | 'doc' | 'video' | 'html', number>>({
  mindmap: 1.0,
  ppt: 1.0,
  doc: 1.0,
  video: 1.0,
  html: 1.0
});

/**
 * 【UI 交互变量】
 */
const isGeneratingMaterials = ref(false); // 控制“确认并生成”按钮的 Loading 状态
const boardPrompt = ref('');               // 顶部看板专用修改指令输入值
const isFullscreenEdit = ref(false);       // 控制全屏模拟编辑器 Modal 的显隐

/**
 * 思维导图实例与交互逻辑 (simple-mind-map)
 */
let mindMapInstance: MindMap | null = null; // 存储思维导图核心类实例

/**
 * 【函数】zoomIn / zoomOut
 * 作用：调整当前活动看板的缩放比例，并同步触发思维导图的 API 调用
 */
const zoomIn = () => {
  if (zoomLevels[activeTab.value] < 2.0) {
    zoomLevels[activeTab.value] = parseFloat((zoomLevels[activeTab.value] + 0.1).toFixed(1));
    updateMindMapScale();
  }
};

const zoomOut = () => {
  if (zoomLevels[activeTab.value] > 0.3) {
    zoomLevels[activeTab.value] = parseFloat((zoomLevels[activeTab.value] - 0.1).toFixed(1));
    updateMindMapScale();
  }
};

/**
 * 【函数】updateMindMapScale
 * 作用：专门针对思维导图 canvas 进行视图缩放同步
 */
const updateMindMapScale = () => {
  if (activeTab.value === 'mindmap' && mindMapInstance) {
    // @ts-expect-error ignore simple-mind-map argument typings
    mindMapInstance.view.setScale(zoomLevels['mindmap']);
  }
};

/**
 * 【常量】思维导图兜底初始数据
 */
const DEFAULT_MINDMAP_DATA = {
  data: { text: "课程大纲" },
  children: [
    { data: { text: "知识点 1" } },
    { data: { text: "知识点 2" } },
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
    // @ts-expect-error simple-mind-map typings incomplete
    const data = mindMapInstance.getData();
    cocreationStore.mindmapData = data;
  } catch { /* ignore */ }
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

    // @ts-expect-error simple-mind-map has incomplete typings
    mindMapInstance = new MindMap({
      el: container,
      theme: settingsStore.theme === 'dark' ? 'dark' : 'default',
      data: savedData ?? DEFAULT_MINDMAP_DATA
    });
    // @ts-expect-error ignore simple-mind-map argument typings
    mindMapInstance.view.setScale(zoomLevels['mindmap']);

    // 监听数据变化并实时保存
    const mm = mindMapInstance as unknown as { on: (ev: string, fn: () => void) => void };
    mm.on('data_change', saveMindMapData);
    mm.on('node_text_edit_end', saveMindMapData);
  });
};

/**
 * 生命周期与侦听器
 */
onMounted(() => {
  if (activeTab.value === 'mindmap') {
    initMindMap();
  }
});

// 监听标签页切换
watch(activeTab, (val) => {
  if (val === 'mindmap') {
    initMindMap();
  }
});

// 重置思维导图（当切换课件 ID 时）
watch(() => cocreationStore.currentCoursewareId, () => {
  if (activeTab.value === 'mindmap') {
    initMindMap();
  }
});

/**
 * 【异步模拟函数】handleConfirmSummary
 * 作用：执行“确认并生成”批量操作
 * 业务逻辑：根据用户在 mindmap 浮窗中勾选的 option，模拟异步生成 PPT、教案等过程。
 */
const handleConfirmSummary = () => {
  if (cocreationStore.generateOptions.length === 0) {
    message.warning('请至少选择一项需要生成的内容');
    return;
  }
  isGeneratingMaterials.value = true;
  message.loading({ content: '正在生成对应的资料...', key: 'gen', duration: 0 });
  setTimeout(() => {
    isGeneratingMaterials.value = false;
    cocreationStore.materialGenerated = true;
    cocreationStore.generatedOptions = [...cocreationStore.generateOptions];
    message.success({ content: '对应部分资料生成成功', key: 'gen', duration: 2 });
  }, 2000);
};

// 响应全局主题色对思维导图颜色的冲击
watch(() => settingsStore.theme, (theme) => {
  if (mindMapInstance) {
    mindMapInstance.setThemeConfig(theme === 'dark' ? { theme: 'dark' } : {});
    mindMapInstance.setTheme(theme === 'dark' ? 'dark' : 'default');
  }
});

/**
 * 【函数】下载系统
 */
const downloadMaterial = () => {
  message.success('开始下载全部资料包...');
};

const getMaterialName = (tab: string) => {
  const map: Record<string, string> = {
    ppt: 'PPT', doc: '教案', video: '视频', html: 'H5'
  };
  return map[tab] || '';
};

const downloadSingleMaterial = (tab: string) => {
  message.success(`开始下载单项资料：${getMaterialName(tab)}...`);
};

/**
 * 【函数】handleBoardPrompt
 * 作用：处理针对“右侧看板内特定内容”的微调指令
 */
const handleBoardPrompt = (value: string) => {
  if (!value.trim()) return;
  message.success(`发送局部修改指令：${value}`);
  boardPrompt.value = '';
};

/**
 * 【模拟在线编辑】
 */
const openFullscreenEdit = () => {
  isFullscreenEdit.value = true;
};

const handleSaveEdit = () => {
  message.success('文档修改已保存并同步');
  isFullscreenEdit.value = false;
};
</script>

<style scoped>
.render-area {
  background: var(--app-bg);
  display: flex;
  flex-direction: column;
  height: 100%;
}

.render-header {
  padding: 0 24px;
  background: var(--app-panel);
  border-bottom: 1px solid var(--app-border);
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
  background: var(--app-panel);
  padding: 32px;
  border-radius: 12px;
  box-shadow: var(--app-shadow);
  display: flex;
  justify-content: center;
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

.board-prompt-area {
  padding: 12px 24px;
  background: var(--app-panel);
  border-top: 1px solid var(--app-border);
}

.render-footer {
  padding: 16px 24px;
  background: var(--app-panel);
  border-top: 1px solid var(--app-border);
  text-align: right;
}

.mock-editor-toolbar {
  background: var(--app-panel);
  padding: 8px 16px;
  border-bottom: 1px solid var(--app-border);
  box-shadow: var(--app-shadow);
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
  box-shadow: var(--app-shadow);
  padding: 96px;
  border-radius: 4px;
  outline: none;
}

.generation-options-floating {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
  width: 250px;
}

.generation-card {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}

.dark-theme .generation-card {
  background-color: var(--app-panel);
  border-color: var(--app-border);
}
</style>
