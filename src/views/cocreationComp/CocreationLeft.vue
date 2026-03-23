<!--
  课件共创页面 - 左侧对话区域 (CocreationLeft)
  业务逻辑：
  1. 提供与 AI (DeepSeek) 的交互界面，支持流式对话响应。
  2. 增强型输入：支持文字、语音、附件上传（点击或拖拽）以及快捷回复。
  3. 智能辅助：包含自动发送初始化话术、消息内容复制、对话重新生成等功能。
  4. 交互优化：通过自定义滚动节点（Scroll Nodes）实现长对话的快速定位导航。
-->
<template>
  <div class="dialogue-area">
    <!-- 顶部课程基本信息展示 -->
    <div class="course-header" v-if="currentCourse">
      <div class="course-title">{{ currentCourse.title }}</div>
      <div class="course-meta">{{ currentCourse.subject }} · {{ currentCourse.grade }}</div>
    </div>

    <div class="chat-area-wrapper" style="position: relative; flex: 1; display: flex; overflow: hidden;">
      <!-- 聊天历史记录滚动区 -->
      <div class="chat-history" ref="chatHistoryRef">
        <template v-for="(msg, index) in cocreationStore.chatHistory" :key="msg.id">
          <div class="chat-message-row" :class="msg.role">
            <!-- AI 头像 -->
            <a-avatar v-if="msg.role === 'assistant'" class="message-avatar ai-avatar"
              :src="'https://api.dicebear.com/7.x/bottts/svg?seed=deepseek'" />
            <div class="chat-bubble-container">
              <!-- 消息气泡：支持 Markdown 渲染 -->
              <div class="chat-bubble" :class="msg.role">
                <template v-if="msg.role === 'user'">{{ msg.content }}</template>
                <div v-else class="markdown-body" v-html="renderMarkdown(msg.content)"></div>
              </div>
              <!-- AI 建议回复按钮组 -->
              <div v-if="msg.role === 'assistant' && msg.suggestions && msg.suggestions.length > 0"
                class="suggestions-container">
                <a-button v-for="(suggestion, sIdx) in msg.suggestions" :key="sIdx" class="suggestion-btn" size="small"
                  shape="round" @click="handleSuggestedReply(suggestion)">
                  {{ suggestion }}
                </a-button>
              </div>
              <!-- Hover Actions for AI -->
              <div v-if="msg.role === 'assistant'" class="message-actions">
                <a-tooltip title="复制">
                  <a-button type="text" size="small" class="action-btn" @click="handleCopy(msg.content)">
                    <CopyOutlined />
                  </a-button>
                </a-tooltip>
                <a-tooltip title="重新生成"
                  v-if="index === cocreationStore.chatHistory.length - 1 && !cocreationStore.isGenerating">
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
      </div>

      <!-- 滚动条定位节点：在滚动条位置渲染用户消息的锚点 -->
      <div class="scrollbar-nodes-overlay">
        <template v-for="(node, index) in scrollNodes" :key="index">
          <a-tooltip placement="left" :title="node.text">
            <div class="scroll-node" :style="{ top: `${node.topPct}%` }" @click="scrollToNode(node.top)"></div>
          </a-tooltip>
        </template>
        <!-- 返回底部快捷节点 -->
        <a-tooltip placement="left" title="返回最新消息">
          <div class="scroll-node scroll-node-bottom" @click="scrollToBottom"></div>
        </a-tooltip>
      </div>
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
        <a-tooltip title="添加参考文件">
          <a-upload :showUploadList="false" :beforeUpload="handleUpload">
            <a-button type="link" :loading="uploading" style="padding: 0 8px; color: var(--color-text-sub-light)">
              <PaperClipOutlined />
            </a-button>
          </a-upload>
        </a-tooltip>
        <a-textarea v-model:value="inputVal" placeholder="与AI继续对话或拖拽上传资料..." :auto-size="{ minRows: 1, maxRows: 6 }"
          @pressEnter.prevent="handleSend" style="flex: 1; border: none; box-shadow: none;">
        </a-textarea>
        <div style="padding: 0 8px; display: flex; align-items: center;">
          <a-tooltip title="语音输入">
            <AudioOutlined v-if="!cocreationStore.isGenerating" class="cursor-pointer action-icon"
              @click="handleVoiceInput"
              :style="{ fontSize: '18px', color: isRecording ? 'var(--color-error)' : 'inherit' }" />
          </a-tooltip>
          <a-tooltip title="发送按钮">
            <SendOutlined v-if="!cocreationStore.isGenerating" class="cursor-pointer action-icon"
              style="color: var(--color-primary); margin-left:12px; font-size: 18px;" @click="handleSend" />
          </a-tooltip>
          <PauseCircleOutlined v-if="cocreationStore.isGenerating" class="cursor-pointer action-icon"
            style="color: var(--color-error); margin-left:12px; font-size: 18px;" @click="handleStopGeneration" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { message } from 'ant-design-vue';
import {
  AudioOutlined, SendOutlined, PaperClipOutlined, ReloadOutlined,
  FileWordOutlined, FilePdfOutlined, FilePptOutlined, FileOutlined,
  DeleteOutlined, CopyOutlined, PauseCircleOutlined
} from '@ant-design/icons-vue';
import { v4 as uuidv4 } from 'uuid';
import { useCocreationStore } from '../../stores/cocreationStore';
import { useUserStore } from '../../stores/userStore';
import { useCoursewareStore } from '../../stores/coursewareStore';
import { streamChat, stopGeneration } from '../../utils/chat';
import { startVoiceToText, type VttSession } from '../../utils/vTt';
import type { ChatMessage } from '../../types/types';
import dayjs from 'dayjs';
import { marked } from 'marked';

/**
 * 路由与状态仓库初始化
 */
const route = useRoute();
const cocreationStore = useCocreationStore(); // 共创对话与多模态资产状态
const userStore = useUserStore();             // 当前用户信息
const coursewareStore = useCoursewareStore(); // 课件元数据管理

/**
 * 【响应式变量】输入与 UI 状态
 */
const inputVal = ref('');                     // 底部对话框绑定的文本
const uploading = ref(false);                   // 控制上传按钮的 Loading 状态
const chatHistoryRef = ref<HTMLElement | null>(null); // 指向聊天消息滚动容器

/**
 * 【计算属性】currentCourse
 * 作用：从路由 Query 参数中获取课件 ID，并从 store 中提取对应的课件简报信息（标题、学科、年级）
 */
const currentCourse = computed(() => {
  const id = route.query.id as string;
  if (!id) return null;
  return coursewareStore.coursewares.find(c => c.id === id) || null;
});

/**
 * 【工具函数】renderMarkdown
 * 作用：将 Markdown 格式的文本 safe 地解析并渲染成 HTML 字符串
 */
const renderMarkdown = (text: string) => {
  return marked.parse(text) || '';
};

/**
 * 【响应式变量】滚动节点（Scroll Nodes）
 * 作用：存储用户消息在滚动条上的投影位置点
 */
const scrollNodes = ref<{ text: string, top: number, topPct: number }[]>([]);

/**
 * 【函数】calculateScrollNodes
 * 作用：动态计算所有用户消息条目相对于滚动条的高度比例
 * 业务逻辑：
 * 1. 遍历所有带 `.user` 类的消息元素。
 * 2. 计算其 `offsetTop` 与容器总高度的百分比。
 * 3. 用于侧边滚动条上的锚点渲染，方便用户快速回溯自己的指令。
 */
const calculateScrollNodes = () => {
  if (!chatHistoryRef.value) return;
  const container = chatHistoryRef.value;
  const containerHeight = container.scrollHeight;
  const nodes: { text: string, top: number, topPct: number }[] = [];

  const msgElements = container.querySelectorAll('.chat-message-row.user');
  msgElements.forEach((el, index) => {
    const userMsgs = cocreationStore.chatHistory.filter(m => m.role === 'user');
    const msg = userMsgs[index];
    if (msg) {
      const topOffset = (el as HTMLElement).offsetTop;
      const pct = (topOffset / containerHeight) * 100;
      nodes.push({
        text: msg.content.substring(0, 8) + (msg.content.length > 8 ? '...' : ''),
        top: topOffset,
        topPct: pct
      });
    }
  });
  scrollNodes.value = nodes;
};

/**
 * 【函数】scrollToNode
 * 作用：点击滚动条锚点，将对话视图平滑定位到该消息位置
 */
const scrollToNode = (top: number) => {
  if (chatHistoryRef.value) {
    chatHistoryRef.value.scrollTo({ top: top - 24, behavior: 'smooth' });
  }
};

/**
 * 【函数】checkAndSendInitialWelcome
 * 作用：自动注入首条欢迎指令
 * 业务逻辑：若对话历史为空且已明确课件背景，系统自动发送一段基于学科、年级、标题的初始化 Prompt。
 */
const checkAndSendInitialWelcome = () => {
  if (cocreationStore.chatHistory.length === 0 && currentCourse.value && cocreationStore.currentCoursewareId === currentCourse.value.id) {
    const promptMsg = `请作为老师，准备${currentCourse.value.subject}${currentCourse.value.grade}级的课程，主题是《${currentCourse.value.title}》。`;
    cocreationStore.addMessage({
      id: uuidv4(), role: 'user', content: promptMsg, type: 'text', time: dayjs().format('YYYY-MM-DD HH:mm:ss')
    });
    handleSendChat(promptMsg);
  }
};

/**
 * 生命周期与侦听逻辑
 */
onMounted(() => {
  scrollToBottom();
});

// 监听当前协作的课件 ID 变化，执行初始化 Logic
watch(
  () => [cocreationStore.currentCoursewareId, currentCourse.value?.id],
  ([storeId, courseId]) => {
    if (storeId && courseId && storeId === courseId) {
      nextTick(() => {
        checkAndSendInitialWelcome();
        scrollToBottom();
      });
    }
  },
  { immediate: true }
);

/**
 * 【异步函数】scrollToBottom
 * 作用：将对话列表强行拉至底端，并触发锚点重算
 */
const scrollToBottom = async () => {
  await nextTick();
  if (chatHistoryRef.value) {
    chatHistoryRef.value.scrollTop = chatHistoryRef.value.scrollHeight;
    calculateScrollNodes();
  }
};

/**
 * 【工具函数】handleCopy
 * 作用：复制文本到系统剪贴板
 */
const handleCopy = (text: string) => {
  navigator.clipboard.writeText(text).then(() => {
    message.success('已复制到剪贴板');
  }).catch(() => {
    message.error('复制失败');
  });
};

/**
 * 【函数】handleSuggestedReply
 * 作用：点击 AI 给出的建议回复按钮
 */
const handleSuggestedReply = (text: string) => {
  const finalVal = text;
  cocreationStore.addMessage({
    id: uuidv4(), role: 'user', content: finalVal, type: 'text', time: dayjs().format('YYYY-MM-DD HH:mm:ss')
  });
  scrollToBottom();
  handleSendChat(finalVal);
};

/**
 * 【函数】handleSend
 * 作用：处理用户主输入框的“发送”动作
 * 业务逻辑：混合正在录入的文本与已上传的文件上下文，并推入 store 对话流
 */
const handleSend = () => {
  if (!inputVal.value.trim() && uploadedFiles.value.length === 0) return;
  const val = inputVal.value;
  inputVal.value = '';
  let fileContext = '';
  if (uploadedFiles.value.length > 0) {
    // 文本化文件列表，作为 Prompt 的一部分
    fileContext = `[附带文件：${uploadedFiles.value.map(f => f.name).join(', ')}]`;
    uploadedFiles.value = [];
  }
  const finalVal = fileContext ? `${fileContext}\n${val}` : val;
  cocreationStore.addMessage({
    id: uuidv4(), role: 'user', content: finalVal, type: 'text', time: dayjs().format('YYYY-MM-DD HH:mm:ss')
  });
  scrollToBottom();
  handleSendChat(finalVal);
};

/**
 * 【核心异步函数】handleSendChat
 * 作用：调用 DeepSeek (streamChat) 实现流式交互
 * 业务逻辑：
 * 1. 创建空的 AI 消息占位符。
 * 2. 传入当前课程的 Context 信息。
 * 3. 在 `onToken` 中逐字累加显示内容，并强制滚底。
 * 4. 结束后清理特定 XML 标签，并更新可能的课件标题。
 * @param text 发送的 Prompt 文本
 */
const handleSendChat = async (text: string) => {
  const activeCourseId = currentCourse.value?.id;
  cocreationStore.isGenerating = true;
  
  const assistantMsg: ChatMessage = {
    id: uuidv4(), role: 'assistant', content: '', type: 'text', time: dayjs().format('YYYY-MM-DD HH:mm:ss')
  };
  cocreationStore.addMessage(assistantMsg);

  await streamChat(
    text,
    (token) => {
      // 流式逐字响应
      assistantMsg.content += token;
      if (currentCourse.value?.id === activeCourseId) {
        scrollToBottom();
      }
    },
    (parsedCourseName) => {
      // 对话完成回调
      if (activeCourseId && cocreationStore.coursesData[activeCourseId]) {
        cocreationStore.coursesData[activeCourseId].isGenerating = false;
      }
      
      // 清洗不可见标签
      const cleanContent = assistantMsg.content.replace(/<course_name>.*?<\/course_name>/g, '').trim();
      assistantMsg.content = cleanContent;
      // 模拟生成的建议回复
      assistantMsg.suggestions = ['我觉得这个大纲不错', '能否再细化一下案例部分？'];
      
      if (currentCourse.value?.id === activeCourseId) {
        calculateScrollNodes();
      }

      // 同步可能的标题更新
      if (parsedCourseName && activeCourseId) {
        coursewareStore.updateCourseware(activeCourseId, { title: parsedCourseName });
      }
    },
    (err) => {
      if (currentCourse.value?.id === activeCourseId) {
        message.error('对话生成错误: ' + err.message);
      }
      if (activeCourseId && cocreationStore.coursesData[activeCourseId]) {
        cocreationStore.coursesData[activeCourseId].isGenerating = false;
      }
    },
    currentCourse.value ? {
      title: currentCourse.value.title,
      subject: currentCourse.value.subject,
      grade: currentCourse.value.grade
    } : undefined
  );
};

/**
 * 【函数】handleStopGeneration
 * 作用：手动切断 AI 对话流链接
 */
const handleStopGeneration = () => {
  stopGeneration();
  cocreationStore.isGenerating = false;
  message.info('已停止生成');
};

/**
 * 【函数】handleRegenerate
 * 作用：重新发送最后一次用户指令
 */
const handleRegenerate = () => {
  const lastUserMsg = [...cocreationStore.chatHistory].reverse().find(m => m.role === 'user');
  if (lastUserMsg) {
    handleSendChat(lastUserMsg.content);
  }
};

/**
 * 【语音输入(VTT)相关】
 */
const isRecording = ref(false);
let vttSession: VttSession | null = null;

const handleVoiceInput = async () => {
  if (isRecording.value) {
    vttSession?.stop();
    isRecording.value = false;
    return;
  }
  isRecording.value = true;
  message.loading({ content: '正在录音...再次点击结束', key: 'voice', duration: 0 });
  try {
    const originalInput = inputVal.value;
    vttSession = await startVoiceToText({
      onToken: (text) => {
        // 实时追加识别到的词到输入框
        inputVal.value = (originalInput + ' ' + text).trim();
      },
      onComplete: () => {
        isRecording.value = false;
        message.success({ content: '语音识别完成', key: 'voice', duration: 2 });
      },
      onError: (err) => {
        isRecording.value = false;
        message.error({ content: `录音识别失败: ${err}`, key: 'voice', duration: 3 });
      }
    });
  } catch {
    isRecording.value = false;
    message.error({ content: '启动麦克风失败', key: 'voice', duration: 2 });
  }
};

/**
 * 【拖拽上传与附件管理】
 */
const uploadedFiles = ref<{ id: string, name: string, type: string, raw: File, dataUrl?: string }[]>([]);
const isDragging = ref(false);
let dragCounter = 0;

const handleDragEnter = () => { dragCounter++; isDragging.value = true; };
const handleDragLeave = () => { dragCounter--; if (dragCounter === 0) isDragging.value = false; };
const handleDrop = (e: DragEvent) => { 
  dragCounter = 0; 
  isDragging.value = false; 
  handleFiles(Array.from(e.dataTransfer?.files || [])); 
};

/**
 * 【函数】handleUpload
 * 作用：接管手动上传 input
 */
const handleUpload = (file: File) => {
  uploading.value = true;
  handleFiles([file]);
  setTimeout(() => uploading.value = false, 500);
  return false;
};

/**
 * 【函数】handleFiles
 * 作用：核心文件处理分发逻辑，支持图片本地预览与后缀校验
 */
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
          id: uuidv4(), name: file.name, type: ext, raw: file, dataUrl: e.target?.result as string
        });
      };
      reader.readAsDataURL(file);
    } else {
      uploadedFiles.value.push({ id: uuidv4(), name: file.name, type: ext, raw: file });
    }
  });
};

/**
 * 【函数】removeFile
 * 作用：移除已选择但未发送的文件
 */
const removeFile = (id: string) => {
  uploadedFiles.value = uploadedFiles.value.filter(f => f.id !== id);
};
</script>

<style scoped>
.dialogue-area {
  background: var(--app-panel);
  display: flex;
  flex-direction: column;
  height: 100%;
}

.course-header {
  padding: 12px 24px;
  background: var(--app-bg);
  border-bottom: 1px solid var(--app-border);
}

.course-header .course-title {
  font-weight: bold;
  font-size: 16px;
  color: var(--app-text-main);
}

.course-header .course-meta {
  font-size: 12px;
  color: var(--app-text-sub);
  margin-top: 4px;
}

.chat-history {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
  position: relative;
  scrollbar-width: none;
}

.chat-history::-webkit-scrollbar {
  display: none;
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
  background-color: var(--app-bg);
  border: 1px solid var(--color-primary);
  color: var(--app-text-main);
  border-top-right-radius: 4px;
}

.chat-bubble.assistant {
  background-color: var(--app-hover);
  border: 1px solid var(--app-border);
  color: var(--app-text-main);
  border-top-left-radius: 4px;
  font-size: 13px;
}

.suggestions-container {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.suggestion-btn {
  font-size: 12px;
  color: var(--color-primary);
  border-color: var(--color-primary);
  background: transparent;
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
  color: var(--app-text-sub);
}

.action-btn:hover {
  color: var(--color-primary);
  background-color: var(--app-bg);
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
  border-top: 1px solid var(--app-border);
  background: var(--app-panel);
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
  border: 1px solid var(--app-border);
  border-radius: 6px;
  background: var(--app-bg);
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
  color: var(--app-text-sub);
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

.markdown-body {
  font-family: inherit;
}

:deep(.markdown-body p) {
  margin-bottom: 8px;
}

:deep(.markdown-body p:last-child) {
  margin-bottom: 0;
}

:deep(.markdown-body ul, .markdown-body ol) {
  padding-left: 20px;
  margin-bottom: 8px;
}

:deep(.markdown-body li) {
  margin-bottom: 4px;
}

:deep(.markdown-body code) {
  background: rgba(120, 120, 120, 0.1);
  padding: 2px 4px;
  border-radius: 4px;
}

.scrollbar-nodes-overlay {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 8px;
  pointer-events: none;
  z-index: 10;
  margin: 8px 0;
}

.scroll-node {
  position: absolute;
  right: 6px;
  width: 10px;
  height: 10px;
  background: var(--color-primary);
  border-radius: 50%;
  cursor: pointer;
  pointer-events: auto;
  opacity: 0.6;
  transition: all 0.2s;
  transform: translateY(-50%);
}

.scroll-node:hover {
  opacity: 1;
  transform: translateY(-50%) scale(1.5);
}

.scroll-node-bottom {
  top: 100%;
  width: 14px;
  height: 14px;
  right: 4px;
  opacity: 0.8;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
}

.scroll-node-bottom:hover {
  opacity: 1;
  transform: translateY(-50%) scale(1.2);
}
</style>
