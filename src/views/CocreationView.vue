<template>
  <div class="cocreation-container">
    <splitpanes >
      <!-- Left Column: AI Dialogue Area (35%) -->
      <pane min-size="20" size="35" class="dialogue-area">
        <div class="chat-history" ref="chatHistoryRef">
          <template v-for="(msg, index) in cocreationStore.chatHistory" :key="msg.id">
            <div class="chat-message-row" :class="msg.role">
              <a-avatar v-if="msg.role === 'assistant'" class="message-avatar ai-avatar"
                :src="'https://api.dicebear.com/7.x/bottts/svg?seed=deepseek'" />
              <div class="chat-bubble-container">
                <div class="chat-bubble" :class="msg.role">
                  {{ msg.content }}
                </div>
                <!-- Hover Actions for AI -->
                <div v-if="msg.role === 'assistant'" class="message-actions">
                  <a-tooltip title="复制">
                    <a-button type="text" size="small" class="action-btn">
                      <CopyOutlined />
                    </a-button>
                  </a-tooltip>
                  <a-tooltip title="重新生成" v-if="index === cocreationStore.chatHistory.length - 1 && !isGenerating">
                    <a-button type="text" size="small" class="action-btn" @click="handleRegenerate">
                      <ReloadOutlined />
                    </a-button>
                  </a-tooltip>
                </div>
              </div>
              <a-avatar v-if="msg.role === 'user'" class="message-avatar user-avatar"
                :src="userStore.user?.avatar || 'https://api.dicebear.com/7.x/miniavs/svg?seed=1'" />
            </div>
          </template>

          <!-- Summary Card -->
          <a-card v-if="cocreationStore.chatHistory.length > 2 && !hideSummary" size="small" title="📝 需求确认卡"
            class="summary-card">
            <p><strong>科目：</strong> 初二数学</p>
            <p><strong>主题：</strong> 《勾股定理》复习课</p>
            <p><strong>重点：</strong> 实际生活应用题解析</p>
            <div style="text-align: right">
              <a-button type="primary" size="small" @click="handleConfirmSummary">确认并生成大纲</a-button>
            </div>
          </a-card>
        </div>

        <!-- Input Actions Bottom -->
        <div class="chat-input-area" @dragenter.prevent="handleDragEnter" @dragover.prevent
          @dragleave.prevent="handleDragLeave" @drop.prevent="handleDrop">

          <div v-show="isDragging" class="drag-mask">
            <span>释放以拖拽上传文件 (word、ppt、pdf、图片)</span>
          </div>

          <div v-if="uploadedFiles.length > 0" class="file-preview-list">
            <div v-for="file in uploadedFiles" :key="file.id" class="file-preview-item"
              :class="{ 'is-image': ['png', 'jpg', 'jpeg', 'gif'].includes(file.type) }">
              <template v-if="['png', 'jpg', 'jpeg', 'gif'].includes(file.type)">
                <img :src="file.dataUrl" class="image-preview" />
              </template>
              <template v-else>
                <FileWordOutlined v-if="file.type === 'doc' || file.type === 'docx'"
                  style="color: #1890ff; font-size: 24px" />
                <FilePptOutlined v-else-if="file.type === 'ppt' || file.type === 'pptx'"
                  style="color: #fa541c; font-size: 24px" />
                <FilePdfOutlined v-else-if="file.type === 'pdf'" style="color: #ff4d4f; font-size: 24px" />
                <FileOutlined v-else style="color: #aaa; font-size: 24px" />
                <div class="file-info">
                  <span class="file-name" :title="file.name">{{ file.name }}</span>
                </div>
              </template>
              <div class="file-delete-mask" @click="removeFile(file.id)">
                <DeleteOutlined />
              </div>
            </div>
          </div>

          <div style="display: flex; align-items: center; width: 100%;">
            <a-upload :showUploadList="false" :beforeUpload="handleUpload">
              <a-button type="link" :loading="uploading" style="padding: 0 8px; color: var(--color-text-sub-light)">
                <PaperClipOutlined />
              </a-button>
            </a-upload>
            <a-textarea v-model:value="inputVal" placeholder="与AI继续对话或拖拽上传资料..." :auto-size="{ minRows: 1, maxRows: 6 }"
              @pressEnter.prevent="handleSend" style="flex: 1; border: none; box-shadow: none;">
            </a-textarea>
            <div style="padding: 0 8px; display: flex; align-items: center;">
              <AudioOutlined v-if="!isGenerating" class="cursor-pointer action-icon" @click="handleVoiceInput"
                style="font-size: 18px;" />
              <SendOutlined v-if="!isGenerating" class="cursor-pointer action-icon"
                style="color: var(--color-primary); margin-left:12px; font-size: 18px;" @click="handleSend" />
              <PauseCircleOutlined v-else class="cursor-pointer action-icon"
                style="color: var(--color-error); margin-left:12px; font-size: 18px;" @click="handleStopGeneration" />
            </div>
          </div>
        </div>
      </pane>

      <!-- Right Column: Render Area (65%) -->
      <pane min-size="30" size="65" class="render-area">
        <div class="render-header" style="display: flex; justify-content: space-between; align-items: center;">
          <a-tabs v-model:activeKey="activeTab" style="flex: 1;">
            <a-tab-pane key="ppt" tab="PPT 预览" />
            <a-tab-pane key="doc" tab="教案内容" />
            <a-tab-pane key="mindmap" tab="思维导图" />
            <a-tab-pane key="video" tab="相关视频" />
            <a-tab-pane key="html" tab="互动H5" />
          </a-tabs>

          <!-- Board Controls -->
          <div class="board-controls" v-if="materialGenerated">
            <a-space>
              <!-- Specific Upload for PPT/Word/etc -->
              <a-upload :showUploadList="false" :beforeUpload="handleBoardUpload">
                <a-tooltip title="在此板块上传本地文件替换">
                  <a-button type="dashed" size="small">
                    <UploadOutlined /> 本地上传
                  </a-button>
                </a-tooltip>
              </a-upload>
              <!-- Fullscreen Edit for PPT/Word -->
              <a-button v-if="['ppt', 'doc'].includes(activeTab)" type="primary" size="small"
                @click="openFullscreenEdit">
                <EditOutlined /> 全屏编辑
              </a-button>
              <!-- Zoom Controls -->
              <a-button-group size="small">
                <a-button @click="zoomOut">
                  <ZoomOutOutlined />
                </a-button>
                <a-button style="width: 60px; pointer-events: none;">{{ Math.round(zoomLevel * 100) }}%</a-button>
                <a-button @click="zoomIn">
                  <ZoomInOutlined />
                </a-button>
              </a-button-group>
            </a-space>
          </div>
        </div>

        <div class="render-content">
          <div v-if="loading" class="skeleton-wrapper">
            <a-skeleton active :paragraph="{ rows: 10 }" />
          </div>
          <div v-else class="preview-wrapper"
            style="width: 100%; height: 100%; overflow: auto; display: flex; justify-content: center; align-items: center;">
            <div
              :style="`transform: scale(${zoomLevel}); transform-origin: center center; transition: transform 0.2s; width: 100%; height: 100%; display: flex; justify-content: center; align-items: center;`">
              <vue-office-pptx v-if="activeTab === 'ppt' && materialGenerated" :src="pptUrl"
                style="width: 100%; height: 100%;" />

              <vue-office-docx v-else-if="activeTab === 'doc' && materialGenerated" :src="docUrl"
                style="width: 100%; height: 100%;" />

              <div v-else-if="activeTab === 'mindmap' && materialGenerated" id="mindMapContainer"
                style="width: 100%; height: 100%;"></div>

              <video v-else-if="activeTab === 'video' && materialGenerated" controls :src="videoUrl"
                style="width: 100%; height: 100%; background: #000; border-radius: 8px;"></video>

              <iframe v-else-if="activeTab === 'html' && materialGenerated" :src="htmlUrl"
                style="width: 100%; height: 100%; border: none; border-radius: 8px;"></iframe>

              <div v-else class="ppt-placeholder">
                <h2 v-if="!materialGenerated">在此生成课件包</h2>
                <p v-if="!materialGenerated">在左侧对话以生成</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Independent AI Prompt for Board -->
        <div class="board-prompt-area" v-if="materialGenerated">
          <a-input-search v-model:value="boardPrompt" placeholder="对当前页面内容的局部修改指令..." enter-button="发送修改"
            @search="handleBoardPrompt" />
        </div>

        <div class="render-footer">
          <a-space>
            <a-button @click="downloadMaterial">
              <DownloadOutlined /> 下载资料包
            </a-button>
            <a-button @click="handleConfirmSummary">
              <ReloadOutlined /> 重新生成
            </a-button>
          </a-space>
        </div>
      </pane>
    </splitpanes>

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
          <h2>勾股定理</h2>
          <p>勾股定理，是一个基本的几何定理，指直角三角形的两条直角边的平方和等于斜边的平方。该定理在西方被称为毕达哥拉斯定理...</p>
          <br />
          <p><i>（模拟的富文本编辑器，内容可直接编辑）</i></p>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue';
import {
  AudioOutlined,
  SendOutlined,
  PaperClipOutlined,
  DownloadOutlined,
  ReloadOutlined,
  FileWordOutlined,
  FilePdfOutlined,
  FilePptOutlined,
  FileOutlined,
  DeleteOutlined,
  CopyOutlined,
  PauseCircleOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  UploadOutlined,
  EditOutlined,
  AlignLeftOutlined,
  AlignCenterOutlined,
  AlignRightOutlined
} from '@ant-design/icons-vue';
import { v4 as uuidv4 } from 'uuid';
import { useCocreationStore } from '../stores/cocreationStore';
import { useUserStore } from '../stores/userStore';
import { message } from 'ant-design-vue';

import { Splitpanes, Pane } from 'splitpanes';
import 'splitpanes/dist/splitpanes.css';
import VueOfficePptx from '@vue-office/pptx';
import VueOfficeDocx from '@vue-office/docx';
import MindMap from 'simple-mind-map';
import { streamChat, stopGeneration } from '../utils/chat';
import dayjs from 'dayjs';


const cocreationStore = useCocreationStore();
const userStore = useUserStore();
const activeTab = ref('ppt');
const loading = ref(false);
const inputVal = ref('');
const uploading = ref(false);
const chatHistoryRef = ref<HTMLElement | null>(null);
const hideSummary = ref(false);
const materialGenerated = ref(false);

const pptUrl = ref('');
const docUrl = ref('');
const videoUrl = ref('');
const htmlUrl = ref('');
const isGenerating = ref(false);

const zoomLevel = ref(1.0);
const boardPrompt = ref('');
const isFullscreenEdit = ref(false);




let mindMapInstance: MindMap | null = null;

onMounted(() => {
  scrollToBottom();
});

const scrollToBottom = async () => {
  await nextTick();
  if (chatHistoryRef.value) {
    chatHistoryRef.value.scrollTop = chatHistoryRef.value.scrollHeight;
  }
};

const handleSend = async () => {
  if (!inputVal.value.trim() && uploadedFiles.value.length === 0) return;
  const val = inputVal.value;
  inputVal.value = '';
  // Convert files info to string context if needed
  let fileContext = '';
  if (uploadedFiles.value.length > 0) {
    fileContext = `[附带文件：${uploadedFiles.value.map(f => f.name).join(', ')}]`;
    uploadedFiles.value = []; // clear after send
  }

  // 1. Add user message
  const finalVal = fileContext ? `${fileContext}\n${val}` : val;
  cocreationStore.addMessage({
    id: uuidv4(),
    role: 'user',
    content: finalVal,
    type: 'text',
    time: dayjs().format('YYYY-MM-DD HH:mm:ss')
  });
  scrollToBottom();

  isGenerating.value = true;

  // 2. Add an empty assistant message that will be populated by stream
  cocreationStore.addMessage({
    id: uuidv4(),
    role: 'assistant',
    content: '',
    type: 'text',
    time: dayjs().format('YYYY-MM-DD HH:mm:ss')
  });

  // 3. Start streaming
  await streamChat(
    finalVal,
    (token) => {
      // Find the last assistant message and append
      if (cocreationStore.chatHistory.length > 0) {
        const lastMsg = cocreationStore.chatHistory[cocreationStore.chatHistory.length - 1];
        if (lastMsg && lastMsg.role === 'assistant') {
          cocreationStore.updateLastMessage(lastMsg.content + token);
          scrollToBottom();
        }
      }
    },
    () => {
      isGenerating.value = false;
    },
    (err) => {
      message.error('对话生成错误: ' + err.message);
      isGenerating.value = false;
    }
  );
};

const handleStopGeneration = () => {
  stopGeneration();
  isGenerating.value = false;
  message.info('已停止生成');
};

const handleRegenerate = async () => {
  isGenerating.value = true;
  // Mock regenerate logic
  setTimeout(() => {
    isGenerating.value = false;
    message.success('重新生成完毕');
  }, 2000);
}

const handleVoiceInput = () => {
  message.loading({ content: '正在录音...', key: 'voice', duration: 2 });
  setTimeout(() => {
    inputVal.value += '（录音：需要增加互动环节）';
    message.success({ content: '录音已转换', key: 'voice' });
  }, 2000);
};

const uploadedFiles = ref<{ id: string, name: string, type: string, raw: File, dataUrl?: string }[]>([]);
const isDragging = ref(false);
let dragCounter = 0;

const handleDragEnter = () => {
  dragCounter++;
  isDragging.value = true;
};

const handleDragLeave = () => {
  dragCounter--;
  if (dragCounter === 0) {
    isDragging.value = false;
  }
};

const handleDrop = (e: DragEvent) => {
  dragCounter = 0;
  isDragging.value = false;
  const files = Array.from(e.dataTransfer?.files || []);
  handleFiles(files);
};

const handleUpload = (file: File) => {
  uploading.value = true;
  handleFiles([file]);
  setTimeout(() => uploading.value = false, 500);
  return false;
};

const handleFiles = (files: File[]) => {
  files.forEach(file => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!['doc', 'docx', 'ppt', 'pptx', 'pdf', 'png', 'jpg', 'jpeg', 'gif'].includes(ext)) {
      message.warning(`不支持的文件类型: ${file.name}`);
      return;
    }

    if (['png', 'jpg', 'jpeg', 'gif'].includes(ext)) {
      const reader = new FileReader();
      reader.onload = (e) => {
        uploadedFiles.value.push({
          id: uuidv4(),
          name: file.name,
          type: ext,
          raw: file,
          dataUrl: e.target?.result as string
        });
      };
      reader.readAsDataURL(file);
    } else {
      uploadedFiles.value.push({
        id: uuidv4(),
        name: file.name,
        type: ext,
        raw: file
      });
    }
  });
};

const removeFile = (id: string) => {
  uploadedFiles.value = uploadedFiles.value.filter(f => f.id !== id);
};

const handleConfirmSummary = () => {
  hideSummary.value = true;
  loading.value = true;
  setTimeout(() => {
    loading.value = false;
    materialGenerated.value = true;

    // Using simple mock URLs
    // In actual implementation these would be URLs returned from the backend based on generated material
    pptUrl.value = 'https://docs.google.com/presentation/d/1iIU9QfGpr9F101KvhVCsd9RtpyOQM0KBUIcf1l6W63s/edit?usp=sharing';
    docUrl.value = 'https://image2url.com/r2/default/files/1772455500887-fda7d267-b975-4a9a-abc9-d14489518cd5.docx';
    videoUrl.value = 'https://www.w3schools.com/html/mov_bbb.mp4';
    htmlUrl.value = 'https://bilibili.com';

    message.success('大纲与资料已生成');

    if (activeTab.value === 'mindmap') {
      initMindMap();
    }
  }, 2000);
};

const initMindMap = () => {
  nextTick(() => {
    const container = document.getElementById('mindMapContainer');
    if (!container) return;
    if (mindMapInstance) mindMapInstance.destroy();

    // @ts-expect-error simple-mind-map has incomplete typings
    mindMapInstance = new MindMap({
      el: container,
      data: {
        data: { text: "勾股定理" },
        children: [
          { data: { text: "概念" } },
          { data: { text: "公式: a²+b²=c²" } },
          { data: { text: "应用" }, children: [{ data: { text: "生活实例" } }, { data: { text: "历年真题" } }] }
        ]
      }

    });
  });
};

watch(activeTab, (val) => {
  if (val === 'mindmap' && materialGenerated.value) {
    initMindMap();
  }
});

const downloadMaterial = () => {
  message.success('开始下载资料包...');
};

const zoomIn = () => {
  if (zoomLevel.value < 2.0) {
    zoomLevel.value += 0.1;
  }
};

const zoomOut = () => {
  if (zoomLevel.value > 0.3) {
    zoomLevel.value -= 0.1;
  }
};

const handleBoardUpload = (file: File) => {
  message.success(`本地文件 ${file.name} 上传成功, 立即解析预览`);
  return false;
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
.cocreation-container {
  display: flex;
  height: calc(100vh - 64px - 48px);
  margin: -24px;
}

:deep(.splitpanes--vertical > .splitpanes__splitter) {
  min-width: 6px;
  background-color: var(--color-border-light);
  cursor: col-resize;
  transition: background-color 0.2s;
}

:deep(.splitpanes--vertical > .splitpanes__splitter:hover) {
  background-color: var(--color-primary);
}

/* Left Area: 35% */
.dialogue-area {
  background: white;
  display: flex;
  flex-direction: column;
}

.chat-history {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.chat-message-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  width: 100%;
}

.chat-message-row.user {
  flex-direction: row;
  justify-content: flex-end;
}

.chat-message-row.assistant {
  flex-direction: row;
  justify-content: flex-start;
}

.message-avatar {
  flex-shrink: 0;
}

.chat-bubble-container {
  display: flex;
  flex-direction: column;
  max-width: 80%;
  position: relative;
}

.chat-bubble {
  padding: 12px 16px;
  border-radius: 12px;
  line-height: 1.6;
  font-size: 14px;
  word-break: break-word;
}

.chat-bubble.user {
  background-color: var(--color-background-light);
  border: 1px solid var(--color-primary);
  color: var(--color-text-main-light);
  border-top-right-radius: 4px;
}

.chat-bubble.assistant {
  background-color: #F8FAFC;
  border: 1px solid var(--color-border-light);
  color: var(--color-text-main-light);
  border-top-left-radius: 4px;
}

.message-actions {
  display: flex;
  gap: 4px;
  margin-top: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.chat-message-row:hover .message-actions {
  opacity: 1;
}

.action-btn {
  color: var(--color-text-sub-light);
}

.action-btn:hover {
  color: var(--color-primary);
  background-color: var(--color-background-light);
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
  position: relative;
  display: flex;
  flex-direction: column;
}

.action-icon {
  transition: opacity 0.2s;
}

.action-icon:hover {
  opacity: 0.7;
}

.drag-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(24, 144, 255, 0.1);
  border: 2px dashed var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  font-size: 16px;
  color: var(--color-primary);
  font-weight: 500;
  pointer-events: none;
}

.file-preview-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
  width: 100%;
}

.file-preview-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  border: 1px solid var(--color-border-light);
  border-radius: 6px;
  background: var(--color-background-light);
  overflow: hidden;
  padding: 4px;
}

.file-preview-item.is-image {
  padding: 0;
}

.image-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.file-info {
  margin-top: 2px;
  width: 100%;
  text-align: center;
}

.file-name {
  font-size: 10px;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--color-text-sub-light);
}

.file-delete-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
  cursor: pointer;
  font-size: 16px;
}

.file-preview-item:hover .file-delete-mask {
  opacity: 1;
}

/* Right Area: 65% */
.render-area {
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
  max-width: 100%;
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

.board-prompt-area {
  padding: 12px 24px;
  background: white;
  border-top: 1px solid var(--color-border-light);
}

.render-footer {
  padding: 16px 24px;
  background: white;
  border-top: 1px solid var(--color-border-light);
  text-align: right;
}

.mock-editor-toolbar {
  background: white;
  padding: 8px 16px;
  border-bottom: 1px solid var(--color-border-light);
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
  background: white;
  width: 21cm;
  /* A4 width */
  min-height: 29.7cm;
  /* A4 height */
  box-shadow: var(--shadow-md);
  padding: 96px;
  border-radius: 4px;
  outline: none;
}

.mock-page[contenteditable="true"]:empty:before {
  content: attr(placeholder);
  color: var(--color-text-sub-light);
}

/* Responsive Overrides */
@media (max-width: 768px) {
  .cocreation-container {
    flex-direction: column;
    height: calc(100vh - 64px - 32px);
    margin: -16px;
    /* offset the mobile layout padding */
  }

  .dialogue-area {
    flex: 0 0 3%;
    /* slightly less than half */
    border-right: none;
    border-bottom: 1px solid var(--color-border-light);
  }

  .chat-history {
    padding: 16px;
    gap: 12px;
  }

  .chat-bubble {
    max-width: 95%;
    padding: 10px 14px;
  }

  .summary-card {
    width: 100%;
  }

  .chat-input-area {
    padding: 12px;
  }

  .render-area {
    flex: 0 0 65%;
  }

  .render-header {
    padding: 0 16px;
  }

  .render-content {
    padding: 16px;
  }

  .skeleton-wrapper {
    padding: 24px;
  }

  .ppt-placeholder {
    width: 100%;
    height: auto;
  }

  .render-footer {
    padding: 12px 16px;
    text-align: center;
  }
}
</style>
