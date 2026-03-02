<template>
  <div class="cocreation-container">
    <!-- Left Column: AI Dialogue Area (35%) -->
    <div class="dialogue-area">
      <div class="chat-history" ref="chatHistoryRef">
        <template v-for="msg in cocreationStore.chatHistory" :key="msg.id">
          <!-- Chat Bubble -->
          <div class="chat-bubble" :class="msg.role === 'user' ? 'user' : 'ai'">
            {{ msg.content }}
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
      <div class="chat-input-area" style="display: flex; align-items: center;">
        <a-upload :showUploadList="false" :beforeUpload="handleUpload">
          <a-button type="link" :loading="uploading" style="padding: 0 8px; color: var(--color-text-sub-light)">
            <PaperClipOutlined />
          </a-button>
        </a-upload>
        <a-input v-model:value="inputVal" placeholder="与AI继续对话或上传资料..." @pressEnter="handleSend">
          <template #suffix>
            <AudioOutlined class="cursor-pointer" @click="handleVoiceInput" />
            <SendOutlined class="cursor-pointer" style="color: var(--color-primary); margin-left:8px;"
              @click="handleSend" />
          </template>
        </a-input>
      </div>
    </div>

    <!-- Right Column: Render Area (65%) -->
    <div class="render-area">
      <div class="render-header">
        <a-tabs v-model:activeKey="activeTab" style="width: 100%">
          <a-tab-pane key="ppt" tab="PPT 预览" />
          <a-tab-pane key="doc" tab="教案内容" />
          <a-tab-pane key="mindmap" tab="思维导图" />
          <a-tab-pane key="video" tab="相关视频" />
          <a-tab-pane key="html" tab="互动H5" />
        </a-tabs>
      </div>
      |
      <div class="render-content">
        <div v-if="loading" class="skeleton-wrapper">
          <a-skeleton active :paragraph="{ rows: 10 }" />
        </div>
        <div v-else class="preview-wrapper" style="width: 100%; height: 100%;">
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue';
import {
  AudioOutlined,
  SendOutlined,
  PaperClipOutlined,
  DownloadOutlined,
  ReloadOutlined
} from '@ant-design/icons-vue';
import { useCocreationStore } from '../stores/cocreationStore';
import { message } from 'ant-design-vue';

import VueOfficePptx from '@vue-office/pptx';
import VueOfficeDocx from '@vue-office/docx';
import MindMap from 'simple-mind-map';


const cocreationStore = useCocreationStore();
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
  if (!inputVal.value.trim()) return;
  const val = inputVal.value;
  inputVal.value = '';
  await cocreationStore.sendChatMessage(val);
  scrollToBottom();
};

const handleVoiceInput = () => {
  message.loading({ content: '正在录音...', key: 'voice', duration: 2 });
  setTimeout(() => {
    inputVal.value += '（录音：需要增加互动环节）';
    message.success({ content: '录音已转换', key: 'voice' });
  }, 2000);
};

const handleUpload = (file: File) => {
  uploading.value = true;
  setTimeout(() => {
    inputVal.value += `[附件: ${file.name}] `;
    message.success('文件上传成功');
    uploading.value = false;
  }, 1000);
  return false;
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
</script>

<style scoped>
.cocreation-container {
  display: flex;
  height: calc(100vh - 64px - 48px);
  /* Full height minus header / padding */
  margin: -24px;
  /* offset the layout padding */
}

/* Left Area: 35% */
.dialogue-area {
  flex: 0 0 35%;
  background: white;
  border-right: 1px solid var(--color-border-light);
  display: flex;
  flex-direction: column;
}

.chat-history {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.chat-bubble {
  max-width: 85%;
  padding: 12px 16px;
  border-radius: 12px;
  line-height: 1.5;
}

.chat-bubble.user {
  align-self: flex-end;
  background-color: var(--color-background-light);
  /* As per design:主色浅底 */
  border: 1px solid var(--color-primary);
  color: var(--color-text-main-light);
  border-bottom-right-radius: 4px;
}

.chat-bubble.ai {
  align-self: flex-start;
  background-color: #F3F4F6;
  color: var(--color-text-main-light);
  border-bottom-left-radius: 4px;
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
}

/* Right Area: 65% */
.render-area {
  flex: 1;
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

.render-footer {
  padding: 16px 24px;
  background: white;
  border-top: 1px solid var(--color-border-light);
  text-align: right;
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
