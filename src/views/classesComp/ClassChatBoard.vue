<!--
  班级群聊看板组件 (ClassChatBoard)
  业务逻辑：
  1. 展示指定班级群聊的实时消息流。
  2. 支持多种消息类型渲染：文本、图片、文件（Word/PPT/PDF等）。
  3. 提供丰富的输入交互：文字输入、表情、点击上传文件/图片、拖拽上传。
  4. 消息滚动管理：新消息到达或切换群聊时自动滚动到底部。
-->
<template>
  <div class="class-chat-board">
    <!-- 顶部标题栏：包含返回按钮、群名和成员数 -->
    <div class="chat-header">
      <div class="chat-title">
        <a-button type="text" @click="$emit('back')" class="back-btn">&lt; 返回</a-button>
        <h3>{{ classesStore.activeGroupChat?.name }} <span class="member-count" v-if="classesStore.activeGroupChat">({{
          classesStore.activeGroupChat.memberCount }})</span></h3>
      </div>
    </div>

    <!-- 消息列表滚动区域 -->
    <div class="chat-messages" ref="chatScrollRef">
      <div v-for="msg in classesStore.currentGroupMessages" :key="msg.id" class="message-wrapper">
        <!-- 时间分割线 -->
        <div class="time-divider" v-if="msg.id === 'm1' || msg.id === 'm5' || msg.id === 'm7' || true">
          <span>{{ msg.createTime }}</span>
        </div>

        <!-- 消息行：根据发送方/接收方决定渲染方向 -->
        <div class="message-row" :class="msg.direction">
          <!-- 接收方头像 -->
          <div class="avatar-col" v-if="msg.direction === 'receive'">
            <a-avatar :src="msg.senderAvatar" />
          </div>

          <div class="message-content">
            <!-- 接收方用户信息 -->
            <div class="message-info" v-if="msg.direction === 'receive'">
              <span class="user-level" v-if="msg.senderLevel">LV{{ msg.senderLevel }}</span>
              <span class="user-role" v-if="msg.senderRole">{{ msg.senderRole }}</span>
              <span class="user-name">{{ msg.senderName }}</span>
            </div>

            <!-- 消息气泡内容区 -->
            <div class="bubble-wrapper">
              <!-- 文件类型消息渲染 -->
              <div v-if="(msg as any).msgType === 'file' || msg.content.endsWith('.rar')"
                class="chat-bubble file-bubble">
                <FileWordOutlined v-if="msg.content.includes('.doc')" class="file-icon word-icon" />
                <FilePptOutlined v-else-if="msg.content.includes('.ppt')" class="file-icon ppt-icon" />
                <FilePdfOutlined v-else-if="msg.content.includes('.pdf')" class="file-icon pdf-icon" />
                <FileOutlined v-else class="file-icon generic-icon" />
                <span class="file-name">{{ msg.content }}</span>
              </div>

              <!-- 图片类型消息渲染 -->
              <div v-else-if="(msg as any).msgType === 'image'" class="chat-bubble image-bubble">
                <img :src="(msg as any).fileData" class="chat-image" />
              </div>

              <!-- 普通文本内容渲染 -->
              <div v-else class="chat-bubble">
                {{ msg.content }}
              </div>
            </div>
          </div>

          <!-- 发送方头像 -->
          <div class="avatar-col" v-if="msg.direction === 'send'">
            <a-avatar :src="msg.senderAvatar" />
          </div>
        </div>
      </div>
    </div>

    <!-- Input Area with Drag & Drop -->
    <div class="chat-input-area" @dragenter.prevent="handleDragEnter" @dragover.prevent
      @dragleave.prevent="handleDragLeave" @drop.prevent="handleDrop">
      <!-- Drag Mask -->
      <div class="drag-mask" v-if="isDragging">
        <div class="drag-hint">
          <FileOutlined style="font-size: 32px; margin-bottom: 8px;" />
          <br />释放以拖拽上传文件
          <br /><span style="font-size: 12px; color: #666;">(word、ppt、pdf、图片)</span>
        </div>
      </div>

      <!-- Pending Files Preview -->
      <div class="pending-files-container" v-if="pendingFiles.length > 0">
        <div class="pending-file-item" v-for="(pf, idx) in pendingFiles" :key="idx">
          <div class="pf-delete" @click="removePendingFile(idx)">
            <CloseOutlined />
          </div>
          <template v-if="pf.fileType === 'image'">
            <img :src="pf.previewUrl" class="pf-image" />
          </template>
          <template v-else>
            <div class="pf-file-icon">
              <FileWordOutlined v-if="pf.extension === 'doc' || pf.extension === 'docx'" class="word-icon" />
              <FilePptOutlined v-else-if="pf.extension === 'ppt' || pf.extension === 'pptx'" class="ppt-icon" />
              <FilePdfOutlined v-else-if="pf.extension === 'pdf'" class="pdf-icon" />
              <FileOutlined v-else class="generic-icon" />
            </div>
            <div class="pf-filename" :title="pf.file.name">{{ pf.file.name }}</div>
          </template>
        </div>
      </div>

      <!-- Toolbar -->
      <div class="toolbar">
        <a-space :size="20">
          <smile-outlined class="toolbar-icon" title="选择表情" />
          <folder-outlined class="toolbar-icon" @click="triggerFileUpload(false)" title="选择文件" />
          <picture-outlined class="toolbar-icon" @click="triggerFileUpload(true)" title="选择图片" />
        </a-space>
      </div>

      <!-- Hidden Input for manual clicking -->
      <input type="file" ref="fileInput" style="display: none" @change="handleFileSelected" />
      <input type="file" ref="imageInput" style="display: none" accept="image/*" @change="handleFileSelected" />

      <div class="input-wrapper">
        <a-textarea v-model:value="inputValue" :auto-size="{ minRows: 3, maxRows: 6 }" placeholder="" :bordered="false"
          class="chat-textarea" @pressEnter.prevent="handleSend" />
      </div>
      <div class="send-footer">
        <a-button type="primary" class="send-btn" @click="handleSend">
          发送
        </a-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from 'vue';
import { useClassesStore } from '../../stores/classesStore';
import {
  SmileOutlined, FolderOutlined, PictureOutlined,
  FileWordOutlined, FilePptOutlined, FilePdfOutlined, FileOutlined, CloseOutlined
} from '@ant-design/icons-vue';

/**
 * 核心状态与事件定义
 */
const classesStore = useClassesStore(); // 班级业务仓库，管理当前选中的班级及群聊消息
defineEmits(['back']); // 向父组件发送“返回”事件

/**
 * 【响应式变量】基本交互
 */
const inputValue = ref('');            // 聊天输入框的双向绑定文本内容
const chatScrollRef = ref<HTMLElement | null>(null); // 指向消息滚动容器的 DOM 引用，用于滚动控制

/**
 * 【响应式变量】拖拽与文件上传状态
 */
const isDragging = ref(false);         // 当前是否有文件正悬停在聊天区域上方（控制拖拽蒙版）
const dragCounter = ref(0);            // 拖拽计数器，用于解决子元素触发 dragleave 导致的闪烁问题
const fileInput = ref<HTMLInputElement | null>(null);  // 隐藏的通用文件上传 input 引用
const imageInput = ref<HTMLInputElement | null>(null); // 隐藏的图片专用上传 input 引用

/**
 * 【接口定义】待发送文件单元
 */
interface PendingFile {
  file: File;
  fileType: 'image' | 'file';
  extension?: string;
  previewUrl?: string; // 图片文件的本地 Blob 预览地址
}
const pendingFiles = ref<PendingFile[]>([]); // 暂存在输入框上方的待发送文件队列

/**
 * 【函数】scrollToTop
 * 作用：将聊天消息列表平滑滚动至最底部
 * 业务逻辑：利用 nextTick 确保在 DOM 更新（如新消息插入）后执行滚动计算
 */
const scrollToBottom = () => {
  nextTick(() => {
    if (chatScrollRef.value) {
      chatScrollRef.value.scrollTop = chatScrollRef.value.scrollHeight;
    }
  });
};

/**
 * 【侦听器】消息列表长度
 * 作用：当 `currentGroupMessages` 数组长度发生变化（收到或发出新消息）时，立刻执行自动滚底
 */
watch(() => classesStore.currentGroupMessages.length, () => {
  scrollToBottom();
});

/**
 * 【生命周期钩子】onMounted
 * 作用：组件初始化时，确保首屏加载的消息展示在底部
 */
onMounted(() => {
  scrollToBottom();
});

/**
 * 【函数】triggerFileUpload
 * 作用：根据按钮类型，通过 JS 手动触发隐藏的 input 文件的点击事件
 * @param isImage 是否为图片上传模式
 */
const triggerFileUpload = (isImage: boolean) => {
  if (isImage && imageInput.value) {
    imageInput.value.click();
  } else if (fileInput.value) {
    fileInput.value.click();
  }
};

/**
 * 【函数】processFiles
 * 作用：集中处理获取到的 File 对象（无论是拖拽还是手动选择）
 * 业务逻辑：判断文件类型，若为图片则生成本地预览 Blob 地址，并推入待发送队列 `pendingFiles`
 */
const processFiles = (files: FileList | File[]) => {
  Array.from(files).forEach(file => {
    const isImage = file.type.startsWith('image/');
    const ext = file.name.split('.').pop()?.toLowerCase();

    let previewUrl = '';
    if (isImage) {
      // 生成用于界面预览的临时 URL
      previewUrl = URL.createObjectURL(file);
    }

    pendingFiles.value.push({
      file,
      fileType: isImage ? 'image' : 'file',
      extension: ext,
      previewUrl
    });
  });
};

/**
 * 【回调函数】handleFileSelected
 * 作用：手动选择文件 input 发生 change 事件后的响应逻辑
 */
const handleFileSelected = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    processFiles(target.files);
  }
  target.value = ''; // 清空 value 以允许连续选择同一个文件
};

/**
 * 【拖拽事件处理器组】
 * 作用：控制 `isDragging` 状态，实现美观的文件拖入覆盖层效果
 */
const handleDragEnter = () => {
  dragCounter.value++;
  isDragging.value = true;
};
const handleDragLeave = () => {
  dragCounter.value--;
  if (dragCounter.value === 0) {
    isDragging.value = false;
  }
};
const handleDrop = (e: DragEvent) => {
  dragCounter.value = 0;
  isDragging.value = false;
  if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
    processFiles(e.dataTransfer.files);
  }
};

/**
 * 【函数】removePendingFile
 * 作用：点击待发送文件右侧的 X，将其从队列移除
 * 业务逻辑：若为图片，需调用 revokeObjectURL 释放内存，防止内存泄漏
 */
const removePendingFile = (idx: number) => {
  const pf = pendingFiles.value[idx];
  if (pf?.previewUrl) URL.revokeObjectURL(pf.previewUrl);
  pendingFiles.value.splice(idx, 1);
};

/**
 * 【异步函数】handleSend
 * 作用：执行最终的消息发送逻辑
 * 业务逻辑：
 * 1. 优先遍历并发送已选中的附件文件（图片或文档）。
 * 2. 清空文件队列。
 * 3. 接着发送文本区输入的文字内容。
 * 4. 调用 store 的 `sendGroupMessage` 实现数据的持久化与同步。
 */
const handleSend = async () => {
  if (!classesStore.activeGroupChat) return;

  // 1. 发送待处理的附件队列
  if (pendingFiles.value.length > 0) {
    for (const pf of pendingFiles.value) {
      const sendType = pf.fileType;
      await classesStore.sendGroupMessage(
        classesStore.activeGroupChat.id,
        pf.file.name,
        sendType,
        pf.previewUrl // 携带预览 Data 用于展示
      );
    }
    pendingFiles.value = [];
  }

  // 2. 发送普通文字内容
  if (inputValue.value.trim()) {
    const content = inputValue.value;
    inputValue.value = ''; // 发送前清空输入框，提升体验
    await classesStore.sendGroupMessage(classesStore.activeGroupChat.id, content, 'text');
  }
};
</script>

<style scoped>
.class-chat-board {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--app-bg);
  color: var(--app-text-main);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: var(--app-shadow);
  border: 1px solid var(--app-border);
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--app-border);
  background-color: var(--app-panel);
}

.chat-title {
  display: flex;
  align-items: center;
}

.back-btn {
  color: var(--app-text-sub);
  margin-right: 12px;
  padding: 0;
}

.back-btn:hover {
  color: var(--color-primary);
}

.chat-title h3 {
  margin: 0;
  font-size: 16px;
  color: var(--app-text-main);
  font-weight: 500;
}

.member-count {
  font-size: 14px;
  color: var(--app-text-sub);
  font-weight: normal;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background-color: var(--app-bg);
}

.time-divider {
  text-align: center;
  margin: 16px 0;
}

.time-divider span {
  background-color: var(--app-hover);
  color: var(--app-text-sub);
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 11px;
}

.message-row {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
  width: 100%;
}

.message-row.receive {
  justify-content: flex-start;
}

.message-row.send {
  justify-content: flex-end;
}

.avatar-col {
  flex-shrink: 0;
}

.message-content {
  display: flex;
  flex-direction: column;
  max-width: 65%;
}

.message-row.send .message-content {
  align-items: flex-end;
}

.message-info {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
  font-size: 12px;
  padding-left: 4px;
}

.user-level {
  color: #f59e0b;
  font-weight: bold;
}

.user-role {
  color: #10b981;
}

.user-name {
  color: var(--app-text-sub);
}

.bubble-wrapper {
  display: flex;
}

.chat-bubble {
  padding: 10px 14px;
  border-radius: 8px;
  background-color: var(--app-panel);
  color: var(--app-text-main);
  font-size: 14px;
  line-height: 1.5;
  word-wrap: break-word;
  box-shadow: var(--app-shadow);
  border: 1px solid var(--app-border);
}

.message-row.send .chat-bubble {
  background-color: var(--color-primary);
  color: #ffffff;
  border: none;
}

.message-row.receive .chat-bubble {
  border-top-left-radius: 2px;
}

.message-row.send .chat-bubble {
  border-top-right-radius: 2px;
}

/* File / Image Bubbles */
.file-bubble {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  cursor: pointer;
}

.file-icon {
  font-size: 32px;
}

.word-icon {
  color: #2b579a;
}

.ppt-icon {
  color: #d24726;
}

.pdf-icon {
  color: #e3242b;
}

.generic-icon {
  color: #9ca3af;
}

.message-row.send .file-bubble .word-icon,
.message-row.send .file-bubble .ppt-icon,
.message-row.send .file-bubble .pdf-icon,
.message-row.send .file-bubble .generic-icon {
  color: #fff;
  /* White icon when inside blue send bubble */
}

.image-bubble {
  padding: 4px !important;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

.chat-image {
  max-width: 250px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

/* Input Area */
.chat-input-area {
  border-top: 1px solid var(--app-border);
  padding: 12px 20px 20px;
  display: flex;
  flex-direction: column;
  background-color: var(--app-panel);
  position: relative;
}

.drag-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--app-panel);
  opacity: 0.95;
  z-index: 10;
  border: 2px dashed var(--color-primary);
  border-radius: 0 0 12px 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.drag-hint {
  text-align: center;
  color: var(--color-primary);
  font-size: 16px;
  font-weight: 500;
  pointer-events: none;
}

.pending-files-container {
  display: flex;
  gap: 12px;
  padding: 8px 0;
  margin-bottom: 8px;
  border-bottom: 1px solid var(--app-border);
  overflow-x: auto;
}

.pending-file-item {
  position: relative;
  width: 64px;
  height: 64px;
  border-radius: 8px;
  border: 1px solid var(--app-border);
  background: var(--app-hover);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pf-delete {
  position: absolute;
  top: -6px;
  right: -6px;
  background: #ff4d4f;
  color: white;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  cursor: pointer;
  z-index: 2;
}

.pf-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}

.pf-file-icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.pf-filename {
  font-size: 10px;
  color: var(--app-text-sub);
  width: 56px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
}


.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.toolbar-icon {
  font-size: 20px;
  color: var(--app-text-sub);
  cursor: pointer;
  transition: color 0.2s;
}

.toolbar-icon:hover {
  color: var(--color-primary);
}


.input-wrapper {
  margin-bottom: 12px;
}

.chat-textarea {
  color: var(--app-text-main) !important;
  font-size: 18px;
  padding: 0;
  resize: none;
  background-color: transparent !important;
}

.chat-textarea::placeholder {
  color: var(--app-text-sub);
  font-size: 14px;
}

.send-footer {
  display: flex;
  justify-content: flex-end;
}

.send-btn {
  display: flex;
  align-items: center;
  padding: 0 20px;
  border-radius: 6px;
  font-size: 14px;
}
</style>
