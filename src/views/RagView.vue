<template>
  <div class="rag-container">
    <div class="page-header">
      <h2>AI 专属知识库</h2>
      <a-button type="primary">
        <template #icon>
          <UploadOutlined />
        </template>
        上传资料
      </a-button>
    </div>

    <!-- Search Area -->
    <div class="search-area">
      <a-input-search v-model:value="searchQuery" placeholder="搜索文件名称、标签..." size="large" style="max-width: 400px" />
    </div>

    <!-- Data Table -->
    <div class="table-area">
      <a-table :dataSource="dataSource" :columns="columns" :pagination="{ pageSize: 10 }"
        :row-selection="{ selectedRowKeys: selectedRowKeys, onChange: onSelectChange }" class="borderless-table">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'type'">
            <FilePdfOutlined v-if="record.type === 'pdf'" style="color: #ff4d4f" />
            <FileWordOutlined v-else-if="record.type === 'word'" style="color: #1890ff" />
            <FileImageOutlined v-else-if="record.type === 'image'" style="color: #52c41a" />
          </template>

          <template v-else-if="column.key === 'tags'">
            <a-tag v-for="tag in record.tags" :key="tag" color="blue">{{ tag }}</a-tag>
          </template>

          <template v-else-if="column.key === 'status'">
            <span v-if="record.status === '解析中'">
              <a-badge status="processing" text="解析中" />
            </span>
            <span v-else>
              <a-badge status="success" text="已完成" />
            </span>
          </template>

          <template v-else-if="column.key === 'action'">
            <a-space>
              <a>打标签</a>
              <a-divider type="vertical" />
              <a class="danger-text">删除</a>
            </a-space>
          </template>
        </template>
      </a-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
  UploadOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileImageOutlined
} from '@ant-design/icons-vue';

const searchQuery = ref('');
const selectedRowKeys = ref<string[]>([]);

const onSelectChange = (keys: string[]) => {
  selectedRowKeys.value = keys;
};

const columns = [
  { title: '文件类型', dataIndex: 'type', key: 'type', width: 100 },
  { title: '文件名称', dataIndex: 'name', key: 'name' },
  { title: '大小', dataIndex: 'size', key: 'size', width: 120 },
  { title: '标签', dataIndex: 'tags', key: 'tags' },
  { title: '上传时间', dataIndex: 'time', key: 'time', width: 180 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 120 },
  { title: '操作', key: 'action', width: 150 },
];

const dataSource = [
  {
    key: '1',
    type: 'pdf',
    name: '初二下册数学教材.pdf',
    size: '15.2 MB',
    tags: ['教材', '数学', '初二'],
    time: '2023-10-25 14:30',
    status: '已完成',
  },
  {
    key: '2',
    type: 'word',
    name: '历年期末考试真题汇总.docx',
    size: '2.5 MB',
    tags: ['真题', '复习'],
    time: '2023-10-26 09:15',
    status: '解析中',
  },
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
