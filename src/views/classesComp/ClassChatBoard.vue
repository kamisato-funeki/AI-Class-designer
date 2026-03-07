<template>
  <div class="class-chat-board">
    <!-- Header -->
    <div class="chat-header">
      <div class="chat-title">
        <a-button type="text" @click="$emit('back')" class="back-btn">&lt; 返回</a-button>
        <h3>{{ classesStore.activeGroupChat?.name }} <span class="member-count" v-if="classesStore.activeGroupChat">({{
          classesStore.activeGroupChat.memberCount }})</span></h3>
      </div>
    </div>

    <!-- Messages List -->
    <div class="chat-messages" ref="chatScrollRef">
      <div v-for="msg in classesStore.currentGroupMessages" :key="msg.id" class="message-wrapper">
        <div class="time-divider" v-if="msg.id === 'm1' || msg.id === 'm5' || msg.id === 'm7' || true">
          <span>{{ msg.createTime }}</span>
        </div>

        <div class="message-row" :class="msg.direction">
          <div class="avatar-col" v-if="msg.direction === 'receive'">
            <a-avatar :src="msg.senderAvatar" />
          </div>

          <div class="message-content">
            <div class="message-info" v-if="msg.direction === 'receive'">
              <span class="user-level" v-if="msg.senderLevel">LV{{ msg.senderLevel }}</span>
              <span class="user-role" v-if="msg.senderRole">{{ msg.senderRole }}</span>
              <span class="user-name">{{ msg.senderName }}</span>
            </div>

            <div class="bubble-wrapper">
              <!-- Render File -->
              <div v-if="(msg as any).msgType === 'file' || msg.content.endsWith('.rar')"
                class="chat-bubble file-bubble">
                <FileWordOutlined v-if="msg.content.includes('.doc')" class="file-icon word-icon" />
                <FilePptOutlined v-else-if="msg.content.includes('.ppt')" class="file-icon ppt-icon" />
                <FilePdfOutlined v-else-if="msg.content.includes('.pdf')" class="file-icon pdf-icon" />
                <FileOutlined v-else class="file-icon generic-icon" />
                <span class="file-name">{{ msg.content }}</span>
              </div>

              <!-- Render Image -->
              <div v-else-if="(msg as any).msgType === 'image'" class="chat-bubble image-bubble">
                <img :src="(msg as any).fileData" class="chat-image" />
              </div>

              <!-- Render Text -->
              <div v-else class="chat-bubble">
                {{ msg.content }}
              </div>
            </div>
          </div>

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

const classesStore = useClassesStore();
defineEmits(['back']);

const inputValue = ref('');
const chatScrollRef = ref<HTMLElement | null>(null);

// Drag & Drop State
const isDragging = ref(false);
const dragCounter = ref(0);
const fileInput = ref<HTMLInputElement | null>(null);
const imageInput = ref<HTMLInputElement | null>(null);

interface PendingFile {
  file: File;
  fileType: 'image' | 'file';
  extension?: string;
  previewUrl?: string; // used for images
}
const pendingFiles = ref<PendingFile[]>([]);

const scrollToBottom = () => {
  nextTick(() => {
    if (chatScrollRef.value) {
      chatScrollRef.value.scrollTop = chatScrollRef.value.scrollHeight;
    }
  });
};

watch(() => classesStore.currentGroupMessages.length, () => {
  scrollToBottom();
});

onMounted(() => {
  scrollToBottom();
});

// File Handling Methods
const triggerFileUpload = (isImage: boolean) => {
  if (isImage && imageInput.value) {
    imageInput.value.click();
  } else if (fileInput.value) {
    fileInput.value.click();
  }
};

const processFiles = (files: FileList | File[]) => {
  Array.from(files).forEach(file => {
    const isImage = file.type.startsWith('image/');
    const ext = file.name.split('.').pop()?.toLowerCase();

    let previewUrl = '';
    if (isImage) {
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

const handleFileSelected = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    processFiles(target.files);
  }
  target.value = ''; // reset
};

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

const removePendingFile = (idx: number) => {
  const pf = pendingFiles.value[idx];
  if (pf?.previewUrl) URL.revokeObjectURL(pf.previewUrl);
  pendingFiles.value.splice(idx, 1);
};

const handleSend = async () => {
  if (!classesStore.activeGroupChat) return;

  // Send attached files first
  if (pendingFiles.value.length > 0) {
    for (const pf of pendingFiles.value) {
      // Pass the file's name as content, type as specific, fileData as the base64 or object URL for mock
      const sendType = pf.fileType;
      await classesStore.sendGroupMessage(
        classesStore.activeGroupChat.id,
        pf.file.name,
        sendType,
        pf.previewUrl // Use preview URL as mock mock representation for local img render
      );
    }
    pendingFiles.value = [];
  }

  // Send Text
  if (inputValue.value.trim()) {
    const content = inputValue.value;
    inputValue.value = '';
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
