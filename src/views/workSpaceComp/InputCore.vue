<!--
  工作台 - 核心 AI 指令输入入口 (InputCore)
  业务逻辑：
  1. 提供高颜值的磨砂玻璃风格输入框，作为课件创作的起点。
  2. 整合文字输入、拖拽上传参考文件、语音输入等多种交互形式。
  3. 联动科目与年级选择，快速初始化课件共创任务并跳转至生成页面。
-->
<template>
  <div class="input-core-container">
    <div class="marquee-border"></div>
    <div class="input-core-content" @dragenter.prevent="handleDragEnter" @dragover.prevent
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

      <a-textarea v-model:value="inputValue" placeholder="输入名称或课程主题，或拖拽上传参考文件 (word/ppt/pdf/图片)..." :bordered="false"
                  :auto-size="{ minRows: 4, maxRows: 9 }" class="main-input" />

      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
        <a-space>
          <a-tooltip title="语音输入">
            <a-button shape="circle" size="large" @click="handleVoiceInput" :danger="isRecording">
              <template #icon>
                <AudioOutlined />
              </template>
            </a-button>
          </a-tooltip>
          <a-upload :showUploadList="false" :beforeUpload="handleUpload">
            <a-tooltip title="上传参考文件">
              <a-button shape="circle" size="large">
                <template #icon>
                  <PaperClipOutlined />
                </template>
              </a-button>
            </a-tooltip>
          </a-upload>
          <a-select v-model:value="subject" show-search placeholder="科目" :options="options"
                    :filter-option="filterOption" style="width: 100px;" size="large">
          </a-select>
          <a-select v-model:value="grade" show-search placeholder="年级" :options="options2"
                    :filter-option="filterOption" style="width: 100px;" size="large">
          </a-select>
        </a-space>
        <a-button type="primary" size="large" class="send-btn" @click="handleSend">
          <template #icon>
            <SendOutlined />
          </template>
          生成课件
        </a-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import {
  AudioOutlined, PaperClipOutlined, SendOutlined,
  FileWordOutlined, FilePdfOutlined, FilePptOutlined, FileOutlined,
  DeleteOutlined
} from '@ant-design/icons-vue';
import { v4 as uuidv4 } from 'uuid';
import { useCoursewareStore } from '../../stores/coursewareStore';
import { startVoiceToText, type VttSession } from '../../utils/vTt';

/**
 * 状态仓库与路由初始化
 */
const router = useRouter();
const coursewareStore = useCoursewareStore(); // 课件资产管理仓库

/**
 * 【响应式变量】表单与 UI 状态
 */
const inputValue = ref('');       // 主输入框：咒语/课程主题
const subject = ref(null);        // 已选科目 ID
const grade = ref(null);          // 已选年级 ID
const isRecording = ref(false);   // 是否正在进行语音采集
const isDragging = ref(false);    // 拖拽上传遮罩开关
let dragCounter = 0;              // 抵消子组件触发的频繁 DragLeave

/**
 * 【语音识别处理】
 */
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
    const originalInput = inputValue.value;
    vttSession = await startVoiceToText({
      onToken: (text) => {
        // 实时追加识别结果到输入框末尾
        inputValue.value = (originalInput + ' ' + text).trim();
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
 * 【文件附件管理】
 */
const uploadedFiles = ref<{ id: string, name: string, type: string, raw: File, dataUrl?: string }[]>([]);

const handleDragEnter = () => { dragCounter++; isDragging.value = true; };
const handleDragLeave = () => { dragCounter--; if (dragCounter === 0) isDragging.value = false; };
const handleDrop = (e: DragEvent) => {
  dragCounter = 0;
  isDragging.value = false;
  handleFiles(Array.from(e.dataTransfer?.files || []));
};

const handleUpload = (file: File) => {
  handleFiles([file]);
  return false; // 拦截默认上传动作
};

/**
 * 【函数】handleFiles
 * 作用：处理文件入队
 * 业务逻辑：校验后缀，如果是图片则通过 FileReader 生成 Base64/DataURL 以供本地实时预览。
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

const removeFile = (id: string) => {
  uploadedFiles.value = uploadedFiles.value.filter(f => f.id !== id);
};

/**
 * 【核心业务函数】handleSend
 * 作用：确认指令并生成课件
 * 业务逻辑：
 * 1. 非空校验（标题、科目、年级均为必填）。
 * 2. 调用 `coursewareStore.createCourseware` 全新创建一份课件元数据。
 * 3. 成功后携带课件 ID 跳转至 `/cocreation` 页面开启后续 AI 对话流。
 */
const handleSend = async () => {
  if (!inputValue.value.trim() || !subject.value || !grade.value) {
    message.warning('名称、科目和年级为必填项');
    return;
  }
  
  const subjectLabel = options.find(o => o.value === subject.value)?.label || '通用';
  const gradeLabel = options2.find(o => o.value === grade.value)?.label || '通用';
  
  try {
    const newCw = await coursewareStore.createCourseware({
      title: inputValue.value.trim(),
      subject: subjectLabel,
      grade: gradeLabel
    });
    router.push(`/cocreation?id=${newCw.id}`);
  } catch {
    message.error('创建失败');
  }
};

/**
 * 下拉选择配置
 */
const options = [
  { value: 'math', label: '数学' },
  { value: 'chinese', label: '语文' },
  { value: 'english', label: '英语' },
  { value: 'comprehensive', label: '综合' },
];

const options2 = [
  { value: '1', label: '一年级' }, { value: '2', label: '二年级' },
  { value: '3', label: '三年级' }, { value: '4', label: '四年级' },
  { value: '5', label: '五年级' }, { value: '6', label: '六年级' },
  { value: '7', label: '七年级' }, { value: '8', label: '八年级' },
  { value: '9', label: '九年级' }, { value: '10', label: '十年级' },
  { value: '11', label: '十一级' }, { value: '12', label: '十二级' },
];

const filterOption = (input: string, option: { label: string }) => {
  return option.label.toLowerCase().includes(input.toLowerCase());
};
</script>

<style scoped>
.input-core-container {
  position: relative;
  width: 90%;
  max-width: 1000px;
  margin: 0 auto;
  border-radius: 18px;
  padding: 3px; /* 留出边框距离 */
  overflow: visible;
  z-index: 10;
}

/* 动态跑马灯渐变边框 */
.marquee-border {
  box-sizing: border-box;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 18px;
  background: linear-gradient(90deg, var(--color-primary), #a855f7, #3b82f6, var(--color-primary));
  background-size: 300% 100%;
  animation: marqueeGrad 3s linear infinite;
  z-index: 0;
  opacity: 0.8;
  filter: blur(1px); /* 稍微增加模糊发光效果 */

  /* 镂空中间区域，使其仅保留边框效果从而不影响毛玻璃背景 */
  padding: 3px;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask-composite: exclude;
}

@keyframes marqueeGrad {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: 0 0;
  }
}

.input-core-content {
  position: relative;
  z-index: 1;
  background: color-mix(in srgb, var(--app-panel) 50%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 15px;
  padding: 20px;
  min-height: 150px;
  /* 阴影效果 */
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
}

.drag-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(24, 144, 255, 0.1);
  border: 2px dashed var(--color-primary);
  border-radius: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  font-size: 18px;
  color: var(--color-primary);
  font-weight: 500;
  pointer-events: none;
}

.main-input {
  font-size: 16px;
  resize: none;
  background: transparent;
  flex: 1;
}

/* File Previews */
.file-preview-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 12px;
  margin-bottom: 12px;
}

.file-preview-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  background: var(--app-bg);
  overflow: hidden;
  padding: 8px;
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
  margin-top: 4px;
  width: 100%;
  text-align: center;
}

.file-name {
  font-size: 12px;
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
  font-size: 20px;
}

.file-preview-item:hover .file-delete-mask {
  opacity: 1;
}

.send-btn {
  border-radius: 8px;
  padding: 0 32px;
  position: relative;
  overflow: hidden;
  border: none;
  background: linear-gradient(90deg, var(--color-primary), #8b5cf6, #3b82f6, var(--color-primary));
  background-size: 300% 100%;
  animation: sendBtnGradient 3s linear infinite;
  box-shadow: 0 4px 15px rgba(24, 144, 255, 0.3);
  transition: transform 0.3s ease;
}

@keyframes sendBtnGradient {
  0% { background-position: 100% 0; }
  100% { background-position: 0 0; }
}

.send-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(24, 144, 255, 0.5);
}
</style>
