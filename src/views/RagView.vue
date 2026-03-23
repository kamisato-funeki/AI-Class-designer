<!--
  AI 专属知识库页面 (RagView)
  业务逻辑：
  1. 提供知识库素材的上传与管理功能（RAG 数据增强）。
  2. 支持多种文档格式（PDF、Office、图片等）的预览。
  3. 提供文件标签化管理，便于 AI 在生成内容时精确检索。
  4. 包含文件上传验证、重新上传错误处理和删除逻辑。
-->
<template>
  <a-spin :spinning="loading">
    <div class="rag-container">
      <div class="page-header">
        <h2>AI 专属知识库</h2>
        <!-- 上传按钮，限制上传前校验格式 -->
        <a-upload :showUploadList="false" :beforeUpload="handleUpload">
          <a-button type="primary" :loading="uploading">
            <template #icon>
              <UploadOutlined />
            </template>
            上传资料
          </a-button>
        </a-upload>
      </div>

      <!-- 搜索过滤区域 -->
      <div class="search-area">
        <a-input-search v-model:value="searchQuery" placeholder="搜索文件名称、标签..." size="large" style="max-width: 400px" />
      </div>

      <!-- 文件列表表格 -->
      <div class="table-area">
        <a-table :dataSource="dataSource" :columns="columns" :pagination="{ pageSize: 10 }"
          :row-selection="{ selectedRowKeys: selectedRowKeys, onChange: onSelectChange }" class="borderless-table"
          rowKey="id">
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'type'">
              <FilePdfOutlined v-if="record.type?.toLowerCase() === 'pdf'" style="color: #ff4d4f" />
              <FileWordOutlined v-else-if="['docx', 'doc', 'word'].includes(record.type?.toLowerCase() || '')" style="color: #1890ff" />
              <FileExcelOutlined v-else-if="['xlsx', 'xls'].includes(record.type?.toLowerCase() || '')" style="color: #52c41a" />
              <FileImageOutlined v-else-if="['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(record.type?.toLowerCase() || '')" style="color: #52c41a" />
              <FileOutlined v-else style="color: #595959" />
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
              <a-tooltip v-if="record.status === 'unuploaded'" title="点击后重新上传">
                <a-badge status="warning" text="未上传" style="cursor: pointer" @click="handleReupload(record)" />
              </a-tooltip>
              <a-badge v-else status="success" text="已完成" />
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

    <!-- 文件预览弹窗：集成 @vue-office 家族组件 -->
    <a-modal v-model:open="previewVisible" :title="previewFile?.name" width="80%" :footer="null" destroyOnClose>
      <div style="height: 70vh; overflow: auto; background: #f5f5f5; display: flex; justify-content: center;">
        <vue-office-docx v-if="previewFile?.type === 'docx' || previewFile?.type === 'word'" :src="previewFile?.url"
          style="width: 100%; height: 100%;" />
        <div v-else-if="previewFile?.type === 'doc'" style="display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 16px; height: 100%; width: 100%; color: gray; background: white; border-radius: 8px;">
          <span style="font-size: 16px;">由于浏览器限制，暂不支持直接预览旧版二进制 <b>.doc</b> 格式文件</span>
          <span style="font-size: 14px;">建议您在 Office/WPS 中将其另存为 <b>.docx</b> 格式后重新上传</span>
        </div>
        <vue-office-pptx v-else-if="previewFile?.type === 'pptx' || previewFile?.type === 'ppt'" :src="previewFile?.url"
          style="width: 100%; height: 100%;" />
        <vue-office-pdf v-else-if="previewFile?.type === 'pdf'" :src="previewFile?.url"
          style="width: 100%; height: 100%;" />
        <vue-office-excel v-else-if="previewFile?.type === 'xlsx' || previewFile?.type === 'xls'" :src="previewFile?.url"
          style="width: 100%; height: 100%;" />
        <img v-else-if="['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(previewFile?.type?.toLowerCase() || '')"
          :src="previewFile?.url" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
        <div v-else
          style="display: flex; align-items: center; border-radius: 8px; justify-content: center; height: 100%; width: 100%; color: gray; background: white;">
          暂不支持预览该格式 / 或文件不存在
        </div>
      </div>
    </a-modal>

    <!-- 标签管理弹窗 -->
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
  FileImageOutlined,
  FileExcelOutlined,
  FileOutlined
} from '@ant-design/icons-vue';
import { useRagStore } from '../stores/ragStore';
import type { RagFile } from '../types/types';

import VueOfficeDocx from '@vue-office/docx';
import '@vue-office/docx/lib/index.css';
import VueOfficePptx from '@vue-office/pptx';
import VueOfficePdf from '@vue-office/pdf';
import VueOfficeExcel from '@vue-office/excel';
import '@vue-office/excel/lib/index.css';

/**
 * RAG 知识库核心状态与仓库初始化
 */
const ragStore = useRagStore(); // 知识仓库：负责管控 PDF/Office 等文件的切片、索引及 AI 生成时的 RAG 关联
const loading = ref(true);       // 列表加载遮罩控制
const uploading = ref(false);     // 上传动作的竞态锁定器

const searchQuery = ref('');      // 全局模糊检索词（文件名/标签）
const selectedRowKeys = ref<string[]>([]); // 暂存表格勾选的资源 ID 集（预留批量处理）

/**
 * 【计算属性】dataSource
 * 作用：实现多维度实时搜索响应渲染
 * 业务逻辑：深度扫描文件数组，匹配标题关键词或关联的显式标签
 */
const dataSource = computed(() => {
  if (!searchQuery.value) return ragStore.files;
  const q = searchQuery.value.toLowerCase();
  return ragStore.files.filter(f =>
    f.name.toLowerCase().includes(q) ||
    f.tags.some(t => t.toLowerCase().includes(q))
  );
});

/**
 * 【生命周期钩子】onMounted
 * 作用：组件挂载即从 Mock/后端拉取最新的知识库快照
 */
onMounted(() => {
  loading.value = true;
  ragStore.loadFiles().finally(() => {
    loading.value = false;
  });
});

/**
 * 【函数】onSelectChange
 * 作用：同步表格多选状态
 * @param keys 选中的行的 ID 集合
 */
const onSelectChange = (keys: string[]) => {
  selectedRowKeys.value = keys;
};

/**
 * 【异步业务函数】handleUpload
 * 作用：素材入库网关
 * @param file 选中的原始物理文件
 * 业务逻辑：
 * 1. 文件合法性嗅探：通过后缀白名单排除暂不支持预览或切片的格式。
 * 2. 交互 Store 触发上传流，完成后进行 UI 反馈。
 */
const handleUpload = async (file: File) => {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const supportedExts = ['pdf', 'docx', 'doc', 'xlsx', 'xls', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'txt', 'md', 'csv'];
  
  if (!supportedExts.includes(ext)) {
    message.warning(`格式不支持：平台暂无法处理 .${ext} 类型的文件`);
    return false;
  }

  uploading.value = true;
  await ragStore.uploadFile(file);
  uploading.value = false;
  message.success('文件已入库并准备好切片');
  return false; 
};

/**
 * 【异步业务函数】handleDelete
 * 作用：从仓库中物理销除选定素材
 * @param id 资源唯一 ID
 */
const handleDelete = async (id: string) => {
  loading.value = true;
  await ragStore.deleteFile(id);
  loading.value = false;
  message.success('素材已移除');
};

/**
 * 【异步业务函数】handleReupload
 * 作用：针对网络波动导致的上传失败项进行断点补发模拟
 * @param record 异常文件的 Record 对象
 */
const handleReupload = async (record: RagFile) => {
  if (record.status !== 'unuploaded') return;
  
  loading.value = true;
  try {
    await ragStore.reuploadFile(record.id);
    message.success('重试成功，状态已同步');
  } catch (error) {
    message.error(error instanceof Error ? error.message : '同步异常');
  } finally {
    loading.value = false;
  }
};

/**
 * 【标签管理功能模块】
 */
const currentTagFileId = ref('');    // 指向当前操作的文件的核心上下文
const tagModalVisible = ref(false);    // 标签管理器 UI 显隐
const newTagValue = ref('');           // 输入的新标签暂存项

/**
 * 【函数】openTagModal
 * 作用：唤起标签编辑空间
 */
const openTagModal = (id: string) => {
  currentTagFileId.value = id;
  newTagValue.value = '';
  tagModalVisible.value = true;
};

/**
 * 【异步函数】handleAddTag
 * 作用：执行标签的高斯分布/注入
 */
const handleAddTag = async () => {
  if (newTagValue.value && currentTagFileId.value) {
    loading.value = true;
    await ragStore.addTag(currentTagFileId.value, newTagValue.value.trim());
    newTagValue.value = '';
    loading.value = false;
  }
};

/**
 * 【异步函数】handleRemoveTag
 * 作用：清洗特定文件样本的标签
 * @param id 资源 ID
 * @param tag 被剥离的标签值
 */
const handleRemoveTag = async (id: string, tag: string) => {
  loading.value = true;
  await ragStore.removeTag(id, tag);
  loading.value = false;
};

/**
 * 【交互预览功能模块】
 */
const previewVisible = ref(false);             // 沉浸式预览弹窗状态
const previewFile = ref<RagFile | null>(null); // 指向当前预览的具体文件对象链

/**
 * 【函数】openPreview
 * 作用：调起格式感知预览插件
 * @param file 选中的文件记录
 */
const openPreview = (file: RagFile) => {
  previewFile.value = file;
  previewVisible.value = true;
};

/**
 * 【格式化辅助函数】formatSize
 * 作用：由于底层存储通常为 B，转化为更适合人类阅读的动态量级（KB/MB/GB）
 * @param bytes 原始位长度
 */
const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * 【表格列配置元数据】
 */
const columns = [
  { title: '类型', dataIndex: 'type', key: 'type', width: 80 },
  { title: '素材名称', dataIndex: 'name', key: 'name' },
  { title: '大小', dataIndex: 'size', key: 'size', width: 100 },
  { title: '业务标签', dataIndex: 'tags', key: 'tags' },
  { title: '收录时间', dataIndex: 'uploadTime', key: 'time', width: 180 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '交互操作', key: 'action', width: 160 },
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
  background: var(--app-panel);
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
