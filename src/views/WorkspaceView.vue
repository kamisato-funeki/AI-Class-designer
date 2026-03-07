<template>
  <a-spin :spinning="loading">
    <div class="workspace-container">
      <!-- Header Greeting -->
      <div class="greeting">
        <h2>早上好，{{ userStore.user?.name || '老师' }}！</h2>
        <p style="color: var(--color-text-sub-light)">开启下一堂课的精彩旅程</p>
      </div>

      <!-- Multi-modal input core -->
      <div class="input-core" @dragenter.prevent="handleDragEnter" @dragover.prevent
        @dragleave.prevent="handleDragLeave" @drop.prevent="handleDrop">
        <div v-show="isDragging" class="drag-mask">
          <span>释放以拖拽上传文件 (word、ppt、pdf、图片)</span>
        </div>
        <a-textarea v-model:value="inputValue" placeholder="输入课程主题，或拖拽上传参考文件 (word/ppt/pdf/图片)..." :bordered="false"
          :auto-size="{ minRows: 4, maxRows: 9 }" class="main-input" />

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

        <div style="display: flex; justify-content: space-between;">
          <a-space>
            <a-tooltip title="语音输入">
              <a-button shape="circle" size="large" @click="handleVoiceInput" :loading="isRecording">
                <template #icon>
                  <AudioOutlined v-if="!isRecording" />
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

    <!-- Quick Access Sections -->
    <div class="dashboard-grid">
      <div><!-- Recent Coursewares -->
        <div class="section-card">
          <div class="section-header">
            <h3>常用模板</h3>
            <a-button type="link" @click="$router.push('/courseware')">查看全部</a-button>
          </div>
          <div class="course-list">
            <a-card hoverable class="course-item" v-for="cw in coursewareStore.coursewares.slice(0, 3)" :key="cw.id"
              @click="router.push('/cocreation')">
              <template #cover>
                <div class="course-cover-placeholder"
                  :style="{ backgroundImage: `url(${cw.coverImage})`, backgroundSize: 'cover' }">
                  <div style="background: rgba(255,255,255,0.7); padding: 4px 8px; border-radius: 4px;">{{ cw.subject
                    }}·{{ cw.grade }}</div>
                </div>
              </template>
              <a-card-meta :title="cw.title" :description="`${cw.updateTime} 编辑`">
              </a-card-meta>
            </a-card>
            <a-empty v-if="coursewareStore.coursewares.length === 0" description="暂无课件"
              style="grid-column: span 3; margin: 24px 0;" />
          </div>
        </div>

        <div class="section-card">
          <div class="section-header">
            <h3>最近课件</h3>
            <a-button type="link" @click="$router.push('/courseware')">查看全部</a-button>
          </div>
          <div class="course-list">
            <a-card hoverable class="course-item" v-for="cw in coursewareStore.coursewares.slice(0, 3)" :key="cw.id"
              @click="router.push('/cocreation')">
              <template #cover>
                <div class="course-cover-placeholder"
                  :style="{ backgroundImage: `url(${cw.coverImage})`, backgroundSize: 'cover' }">
                  <div style="background: rgba(255,255,255,0.7); padding: 4px 8px; border-radius: 4px;">{{ cw.subject
                    }}·{{ cw.grade }}</div>
                </div>
              </template>
              <a-card-meta :title="cw.title" :description="`${cw.updateTime} 编辑`">
              </a-card-meta>
            </a-card>
            <a-empty v-if="coursewareStore.coursewares.length === 0" description="暂无课件"
              style="grid-column: span 3; margin: 24px 0;" />
          </div>
        </div>
      </div>

      <!-- Class Dynamics -->
      <div class="section-card">
        <div class="section-header">
          <h3>班级动态</h3>
        </div>
        <a-list item-layout="horizontal" :data-source="dynamics">
          <template #renderItem="{ item }">
            <a-list-item>
              <a-list-item-meta :description="item.time">
                <template #title>
                  <a-popover :title="item.title" trigger="hover" placement="left">
                    <template #content>
                      <p>{{ item.description }}</p>
                      <a-button type="link" size="small" @click="router.push('/classes')">前往查看</a-button>
                    </template>
                    <a style="cursor: pointer;">{{ item.title }}</a>
                  </a-popover>
                </template>
                <template #avatar>
                  <a-avatar style="background-color: var(--color-primary)">
                    <UserOutlined />
                  </a-avatar>
                </template>
              </a-list-item-meta>
            </a-list-item>
          </template>
        </a-list>
      </div>



    </div>
  </a-spin>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import {
  AudioOutlined,
  PaperClipOutlined,
  SendOutlined,
  UserOutlined,
  FileWordOutlined,
  FilePdfOutlined,
  FilePptOutlined,
  FileOutlined,
  DeleteOutlined
} from '@ant-design/icons-vue';
import { v4 as uuidv4 } from 'uuid';
import { useUserStore } from '../stores/userStore';
import { useWorkspaceStore } from '../stores/workspaceStore';
import { useCoursewareStore } from '../stores/coursewareStore';

const router = useRouter();
const userStore = useUserStore();
const workspaceStore = useWorkspaceStore();
const coursewareStore = useCoursewareStore();

const loading = ref(true);
const inputValue = ref('');
const subject = ref(null);
const grade = ref(null);
const isRecording = ref(false);

const dynamics = [
  { title: '初二三班 提交了 5 份作业', time: '10分钟前', description: '关于勾股定理的课后练习已经全部收齐' },
  { title: '李小明 同学提问了关于勾股定理的问题', time: '1小时前', description: '他在讨论区发起了一个新帖' },
  { title: '初二一班 单元测试平均分已出', time: '昨天', description: '本次测试平均分 85，最高分 100' },
  { title: '初三四班 语文阅读理解打卡完成', time: '昨天', description: '全班完成打卡' },
];

onMounted(() => {
  loading.value = true;
  Promise.all([
    workspaceStore.loadStats(),
    coursewareStore.loadCoursewares()
  ]).finally(() => {
    loading.value = false;
  });
});

const handleVoiceInput = () => {
  if (isRecording.value) return;
  isRecording.value = true;
  message.loading({ content: '正在录音... 请说话 (模拟)', key: 'voice', duration: 2 });
  setTimeout(async () => {
    isRecording.value = false;
    const res = await workspaceStore.uploadVoice(new File([''], 'voice.wav'));
    inputValue.value += ` ${res.text} `;
    message.success({ content: '语音识别完成', key: 'voice', duration: 2 });
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
  handleFiles([file]);
  return false; // Prevent auto upload
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

const handleSend = () => {
  if (!inputValue.value.trim()) {
    message.warning('请输入课程主题或上传参考材料');
    return;
  }
  router.push('/cocreation');
};

const options = [
  { value: 'math', label: '数学' },
  { value: 'chinese', label: '语文' },
  { value: 'english', label: '英语' },
  { value: 'comprehensive', label: '综合' },
];
const filterOption = (input: string, option: { label: string }) => {
  return option.label.toLowerCase().includes(input.toLowerCase());
};

const options2 = [
  { value: '1', label: '一年级' },
  { value: '2', label: '二年级' },
  { value: '3', label: '三年级' },
  { value: '4', label: '四年级' },
  { value: '5', label: '五年级' },
  { value: '6', label: '六年级' },
  { value: '7', label: '七年级' },
  { value: '8', label: '八年级' },
  { value: '9', label: '九年级' },
  { value: '10', label: '十年级' },
  { value: '11', label: '十一级' },
  { value: '12', label: '十二级' },
];




</script>

<style scoped>
.workspace-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
  max-width: 1200px;
  margin: 0 auto;
}

.greeting h2 {
  margin: 0;
  font-weight: 600;
  font-size: 28px;
}

.input-core {
  position: relative;
  background: var(--app-panel);
  border-radius: 16px;
  padding: 16px;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--app-border);
  transition: all 0.3s;
}

.drag-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(24, 144, 255, 0.1);
  border: 2px dashed var(--color-primary);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  font-size: 18px;
  color: var(--color-primary);
  font-weight: 500;
  pointer-events: none;
}

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

.input-core:focus-within {
  box-shadow: var(--shadow-lg);
  border-color: var(--color-primary);
}

.main-input {
  font-size: 16px;
  resize: none;
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border-light);
}

.send-btn {
  border-radius: 8px;
  padding: 0 32px;

}

.dashboard-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  position: relative;
  top: 30px;
}

.section-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.3s ease;
}

.section-card:hover {
  box-shadow: var(--shadow-lg);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.course-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.course-item {
  border-radius: 8px;
  overflow: hidden;
}

.course-cover-placeholder {
  height: 120px;
  background: linear-gradient(135deg, #ECFEFF 0%, #CFFAFE 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
  font-weight: 500;
}

@media (max-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}
</style>
