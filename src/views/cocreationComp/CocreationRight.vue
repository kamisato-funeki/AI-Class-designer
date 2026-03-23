<template>
  <div class="render-area">
    <div class="render-header" style="display: flex; justify-content: space-between; align-items: center;">
      <a-tabs v-model:activeKey="activeTab" style="flex: 1;">
        <a-tab-pane key="mindmap" tab="课程大纲" />
        <a-tab-pane key="ppt" tab="PPT 预览" />
        <a-tab-pane key="doc" tab="教案内容" />
        <a-tab-pane key="video" tab="相关视频" />
        <a-tab-pane key="html" tab="互动H5" />
      </a-tabs>

      <!-- Board Controls (Local Upload Removed) -->
      <div class="board-controls" v-if="cocreationStore.materialGenerated">
        <a-space>
          <a-button v-if="['ppt', 'doc'].includes(activeTab)" type="primary" size="small" @click="openFullscreenEdit">
            <EditOutlined /> 全屏编辑
          </a-button>
          <!-- Zoom Controls -->
          <a-button-group size="small">
            <a-button @click="zoomOut">
              <ZoomOutOutlined />
            </a-button>
            <a-button style="width: 60px; pointer-events: none;">{{ Math.round((zoomLevels[activeTab] || 1) * 100) }}%</a-button>
            <a-button @click="zoomIn">
              <ZoomInOutlined />
            </a-button>
          </a-button-group>
        </a-space>
      </div>
    </div>

    <div class="render-content">
      <div v-show="activeTab === 'mindmap'" style="width: 100%; height: 100%; display: flex; flex-direction: column;">
        <div id="mindMapContainer" style="flex: 1; min-height: 0; width: 100%;"></div>
        <div v-if="!cocreationStore.materialGenerated" class="generation-options" :class="{ 'dark-theme': settingsStore.theme === 'dark' }">
          <a-card size="small" title="需求与生成设置" class="generation-card">
            <a-checkbox-group v-model:value="generateOptions">
              <a-checkbox value="ppt">PPT演示</a-checkbox>
              <a-checkbox value="doc">教案文档</a-checkbox>
              <a-checkbox value="video">相关视频</a-checkbox>
              <a-checkbox value="html">互动H5</a-checkbox>
            </a-checkbox-group>
            <div style="margin-top: 16px; text-align: right;">
              <a-button type="primary" @click="handleConfirmSummary" :loading="isGeneratingMaterials">确认并生成</a-button>
            </div>
          </a-card>
        </div>
      </div>

      <template v-if="activeTab !== 'mindmap'">
        <div v-if="!cocreationStore.materialGenerated" class="skeleton-wrapper">
          <div class="ppt-placeholder">
            <h2>在此生成课件包</h2>
            <p>在左侧对话以生成大纲，确认大纲后生成</p>
          </div>
        </div>
        <div v-else class="preview-wrapper" style="width: 100%; height: 100%; overflow: auto; display: flex; justify-content: center; align-items: center;">
          <vue-office-pptx v-if="activeTab === 'ppt'" :src="pptUrl" :style="`zoom: ${zoomLevels['ppt']}; width: 100%; height: 100%;`" />

          <vue-office-docx v-else-if="activeTab === 'doc'" :src="docUrl" :style="`zoom: ${zoomLevels['doc']}; width: 100%; height: 100%;`" />

          <video v-else-if="activeTab === 'video'" controls :src="videoUrl" :style="`zoom: ${zoomLevels['video']}; width: 100%; height: 100%; background: #000; border-radius: 8px;`"></video>

          <iframe v-else-if="activeTab === 'html'" :src="htmlUrl" :style="`zoom: ${zoomLevels['html']}; width: 100%; height: 100%; border: none; border-radius: 8px;`"></iframe>
        </div>
      </template>
    </div>

    <!-- Independent AI Prompt for Board -->
    <div class="board-prompt-area" v-if="cocreationStore.materialGenerated">
      <a-input-search v-model:value="boardPrompt" placeholder="对当前页面内容的局部修改指令..." enter-button="发送修改" @search="handleBoardPrompt" />
    </div>

    <div class="render-footer" v-if="cocreationStore.materialGenerated">
      <a-space>
        <a-button @click="downloadMaterial">
          <DownloadOutlined /> 下载资料包
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

const cocreationStore = useCocreationStore();
const settingsStore = useSettingsStore();

const activeTab = ref<'mindmap' | 'ppt' | 'doc' | 'video' | 'html'>('mindmap');
const pptUrl = ref('https://docs.google.com/presentation/d/1iIU9QfGpr9F101KvhVCsd9RtpyOQM0KBUIcf1l6W63s/edit?usp=sharing');
const docUrl = ref('https://image2url.com/r2/default/files/1772455500887-fda7d267-b975-4a9a-abc9-d14489518cd5.docx');
const videoUrl = ref('https://www.w3schools.com/html/mov_bbb.mp4');
const htmlUrl = ref('https://bilibili.com');

const zoomLevels = reactive<Record<'mindmap' | 'ppt' | 'doc' | 'video' | 'html', number>>({
  mindmap: 1.0,
  ppt: 1.0,
  doc: 1.0,
  video: 1.0,
  html: 1.0
});

const generateOptions = ref(['ppt', 'doc', 'video', 'html']);
const isGeneratingMaterials = ref(false);
const boardPrompt = ref('');
const isFullscreenEdit = ref(false);

let mindMapInstance: MindMap | null = null;

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

const updateMindMapScale = () => {
  if (activeTab.value === 'mindmap' && mindMapInstance) {
    // @ts-expect-error ignore simple-mind-map argument typings
    mindMapInstance.view.setScale(zoomLevels['mindmap']);
  }
};

const initMindMap = () => {
  nextTick(() => {
    const container = document.getElementById('mindMapContainer');
    if (!container) return;
    if (mindMapInstance) mindMapInstance.destroy();
    
    // @ts-expect-error simple-mind-map has incomplete typings
    mindMapInstance = new MindMap({
      el: container,
      theme: settingsStore.theme === 'dark' ? 'dark' : 'default',
      data: {
        data: { text: "课程大纲" },
        children: [
          { data: { text: "知识点 1" } },
          { data: { text: "知识点 2" } },
          { data: { text: "应用" }, children: [{ data: { text: "案例" } }] }
        ]
      }
    });
    // @ts-expect-error ignore simple-mind-map argument typings
    mindMapInstance.view.setScale(zoomLevels['mindmap']);
  });
};

onMounted(() => {
  if (activeTab.value === 'mindmap') {
    initMindMap();
  }
});

watch(activeTab, (val) => {
  if (val === 'mindmap') {
    initMindMap();
  }
});

const handleConfirmSummary = () => {
  if (generateOptions.value.length === 0) {
    message.warning('请至少选择一项需要生成的内容');
    return;
  }
  isGeneratingMaterials.value = true;
  message.loading({ content: '正在生成资料包...', key: 'gen', duration: 0 });
  setTimeout(() => {
    isGeneratingMaterials.value = false;
    cocreationStore.materialGenerated = true;
    message.success({ content: '资料生成成功', key: 'gen', duration: 2 });
  }, 2000);
};

watch(() => settingsStore.theme, (theme) => {
  if (mindMapInstance) {
    mindMapInstance.setThemeConfig(theme === 'dark' ? { theme: 'dark' } : {});
    mindMapInstance.setTheme(theme === 'dark' ? 'dark' : 'default');
  }
});

const downloadMaterial = () => {
  message.success('开始下载资料包...');
};

const handleBoardPrompt = (value: string) => {
  if (!value.trim()) return;
  message.success(`发送局部修改指令：${value}`);
  boardPrompt.value = '';
};

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
.generation-options {
  padding: 16px;
  background: var(--app-bg);
  border-top: 1px solid var(--app-border);
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
