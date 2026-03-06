<template>
  <a-spin :spinning="loading">
    <div class="rag-container">
      <div class="page-header">
        <h2>AI 专属知识库</h2>
        <a-upload :showUploadList="false" :beforeUpload="handleUpload">
          <a-button type="primary" :loading="uploading">
            <template #icon>
              <UploadOutlined />
            </template>
            上传资料
          </a-button>
        </a-upload>
      </div>

      <!-- Search Area -->
      <div class="search-area">
        <a-input-search v-model:value="searchQuery" placeholder="搜索文件名称、标签..." size="large" style="max-width: 400px" />
      </div>

      <!-- Data Table -->
      <div class="table-area">
        <a-table :dataSource="dataSource" :columns="columns" :pagination="{ pageSize: 10 }"
          :row-selection="{ selectedRowKeys: selectedRowKeys, onChange: onSelectChange }" class="borderless-table"
          rowKey="id">
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'type'">
              <FilePdfOutlined v-if="record.type === 'pdf'" style="color: #ff4d4f" />
              <FileWordOutlined v-else-if="record.type === 'docx' || record.type === 'word'" style="color: #1890ff" />
              <FileImageOutlined v-else style="color: #52c41a" />
            </template>

            <template v-else-if="column.key === 'name'">
              <a style="cursor: pointer;" @click="openPreview(record)">{{ record.name }}</a>
            </template>

            <template v-else-if="column.key === 'size'">
              {{ formatSize(record.size) }}
            </template>

            <template v-else-if="column.key === 'tags'">
              <a-tag v-for="tag in record.tags" :key="tag" closable @close.prevent="handleRemoveTag(record.id, tag)"
                color="blue">{{ tag }}</a-tag>
            </template>

            <template v-else-if="column.key === 'status'">
              <a-badge status="success" text="已完成" />
            </template>

            <template v-else-if="column.key === 'action'">
              <a-space>
                <a @click="openTagModal(record.id)">打标签</a>
                <a-divider type="vertical" />
                <a-popconfirm title="确定删除吗？" @confirm="handleDelete(record.id)">
                  <a class="danger-text">删除</a>
                </a-popconfirm>
              </a-space>
            </template>
          </template>
        </a-table>
      </div>
    </div>

    <!-- Preview Modal -->
    <a-modal v-model:open="previewVisible" :title="previewFile?.name" width="80%" :footer="null" destroyOnClose>
      <div style="height: 70vh; overflow: auto; background: #f5f5f5; display: flex; justify-content: center;">
        <vue-office-docx v-if="previewFile?.type === 'docx' || previewFile?.type === 'word'" :src="previewFile?.url"
          style="width: 100%; height: 100%;" />
        <vue-office-pptx v-else-if="previewFile?.type === 'pptx' || previewFile?.type === 'ppt'" :src="previewFile?.url"
          style="width: 100%; height: 100%;" />
        <vue-office-pdf v-else-if="previewFile?.type === 'pdf'" :src="previewFile?.url"
          style="width: 100%; height: 100%;" />
        <div v-else
          style="display: flex; align-items: center; border-radius: 8px; justify-content: center; height: 100%; width: 100%; color: gray; background: white;">
          暂不支持预览该格式 / 或文件不存在
        </div>
      </div>
    </a-modal>

    <!-- Tag Modal -->
    <a-modal v-model:open="tagModalVisible" title="管理标签" :footer="null">
      <a-space direction="vertical" style="width: 100%">
        <a-input-search v-model:value="newTagValue" placeholder="输入新标签" enter-button="添加" @search="handleAddTag"
          :loading="loading" />
        <div style="margin-top: 16px;">
          <a-tag v-for="tag in ragStore.files.find(f => f.id === currentTagFileId)?.tags" :key="tag" closable
            @close.prevent="handleRemoveTag(currentTagFileId, tag)" color="blue">
            {{ tag }}
          </a-tag>
        </div>
      </a-space>
    </a-modal>
  </a-spin>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import {
  UploadOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileImageOutlined
} from '@ant-design/icons-vue';
import { useRagStore } from '../stores/ragStore';
import type { RagFile } from '../types/types';

import VueOfficeDocx from '@vue-office/docx';
import '@vue-office/docx/lib/index.css';
import VueOfficePptx from '@vue-office/pptx';
import VueOfficePdf from '@vue-office/pdf';

const ragStore = useRagStore();
const loading = ref(true);
const uploading = ref(false);

const searchQuery = ref('');
const selectedRowKeys = ref<string[]>([]);

const dataSource = computed(() => {
  if (!searchQuery.value) return ragStore.files;
  const q = searchQuery.value.toLowerCase();
  return ragStore.files.filter(f =>
    f.name.toLowerCase().includes(q) ||
    f.tags.some(t => t.toLowerCase().includes(q))
  );
});

onMounted(() => {
  loading.value = true;
  ragStore.loadFiles().finally(() => {
    loading.value = false;
  });
});

const onSelectChange = (keys: string[]) => {
  selectedRowKeys.value = keys;
};

const handleUpload = async (file: File) => {
  uploading.value = true;
  await ragStore.uploadFile(file);
  uploading.value = false;
  message.success('文件上传成功');
  return false;
};

const handleDelete = async (id: string) => {
  loading.value = true;
  await ragStore.deleteFile(id);
  loading.value = false;
  message.success('已删除');
};

const currentTagFileId = ref('');
const tagModalVisible = ref(false);
const newTagValue = ref('');

const openTagModal = (id: string) => {
  currentTagFileId.value = id;
  newTagValue.value = '';
  tagModalVisible.value = true;
};

const handleAddTag = async () => {
  if (newTagValue.value && currentTagFileId.value) {
    loading.value = true;
    await ragStore.addTag(currentTagFileId.value, newTagValue.value.trim());
    newTagValue.value = '';
    loading.value = false;
  }
};

const handleRemoveTag = async (id: string, tag: string) => {
  loading.value = true;
  await ragStore.removeTag(id, tag);
  loading.value = false;
};

const previewVisible = ref(false);
const previewFile = ref<RagFile | null>(null);

const openPreview = (file: RagFile) => {
  previewFile.value = file;
  previewVisible.value = true;
};

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const columns = [
  { title: '文件类型', dataIndex: 'type', key: 'type', width: 100 },
  { title: '文件名称', dataIndex: 'name', key: 'name' },
  { title: '大小', dataIndex: 'size', key: 'size', width: 120 },
  { title: '标签', dataIndex: 'tags', key: 'tags' },
  { title: '上传时间', dataIndex: 'uploadTime', key: 'time', width: 180 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 120 },
  { title: '操作', key: 'action', width: 180 },
];
</script>

<style scoped>
.rag-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.search-area {
  margin-bottom: 8px;
}

.table-area {
  background: white;
  border-radius: 12px;
  padding: 24px;
}

.danger-text {
  color: #ff4d4f;
}

/* 彻底去除竖向边框 (Design spec requirement) */
:deep(.ant-table-thead > tr > th),
:deep(.ant-table-tbody > tr > td) {
  border-left: none !important;
  border-right: none !important;
}

:deep(.ant-table-wrapper .ant-table-container) {
  border-left: none !important;
  border-right: none !important;
}
</style>
