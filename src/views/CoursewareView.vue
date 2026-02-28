<template>
  <div class="courseware-container">
    <div class="page-header">
      <h2>我的课件</h2>
      <a-space>
        <a-radio-group v-model:value="viewMode">
          <a-radio-button value="grid">
            <AppstoreOutlined />
          </a-radio-button>
          <a-radio-button value="list">
            <BarsOutlined />
          </a-radio-button>
        </a-radio-group>
        <a-button type="primary" @click="$router.push('/cocreation')">新建课件</a-button>
      </a-space>
    </div>

    <div class="filter-bar">
      <a-input-search placeholder="搜索课件名称..." style="width: 300px" />
      <a-select defaultValue="all" style="width: 120px; margin-left:16px">
        <a-select-option value="all">全部分类</a-select-option>
        <a-select-option value="math">数学</a-select-option>
        <a-select-option value="chinese">语文</a-select-option>
      </a-select>
      <a-select defaultValue="newest" style="width: 120px; margin-left:16px">
        <a-select-option value="newest">最新编辑</a-select-option>
        <a-select-option value="name">按名称排列</a-select-option>
      </a-select>
    </div>

    <!-- Grid View -->
    <div v-if="viewMode === 'grid'" class="grid-view">
      <a-card hoverable class="cw-card" v-for="i in 25" :key="i">
        <template #cover>
          <div class="cover-img">
            科目: 数学<br />封面缩略图
          </div>
        </template>
        <a-card-meta title="勾股定理综合应用" description="初二数学">
        </a-card-meta>
        <div class="tags-area">
          <a-tag color="blue">复习</a-tag>
          <a-tag color="purple">含互动</a-tag>
        </div>
        <div class="card-actions">
          <span>2小时前编辑</span>
          <a-dropdown>
            <a class="ant-dropdown-link" @click.prevent>
              <MoreOutlined />
            </a>
            <template #overlay>
              <a-menu>
                <a-menu-item>预览</a-menu-item>
                <a-menu-item>继续编辑</a-menu-item>
                <a-menu-divider />
                <a-menu-item danger>移至回收站</a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>
      </a-card>
    </div>

    <!-- List View -->
    <div v-else class="list-view">
      <a-table :dataSource="dataSource" :columns="columns" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
  AppstoreOutlined,
  BarsOutlined,
  MoreOutlined
} from '@ant-design/icons-vue';

const viewMode = ref('grid');

const columns = [
  { title: '标题', dataIndex: 'title', key: 'title' },
  { title: '科目/年级', dataIndex: 'subject', key: 'subject' },
  { title: '标签', dataIndex: 'tags', key: 'tags' },
  { title: '最后编辑', dataIndex: 'time', key: 'time' },
  { title: '操作', key: 'action' },
];

const dataSource = [
  { key: '1', title: '勾股定理综合应用', subject: '初二数学', time: '2小时前' }
];
</script>

<style scoped>
.courseware-container {
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
}

.filter-bar {
  display: flex;
  align-items: center;
  background: white;
  padding: 16px;
  border-radius: 12px;
}

.grid-view {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

.cw-card {
  border-radius: 12px;
  overflow: hidden;
}

.cover-img {
  height: 160px;
  background: #E0F2FE;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: var(--color-primary);
  font-weight: 500;
}

.tags-area {
  margin-top: 12px;
}

.card-actions {
  margin-top: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--color-text-sub-light);
  font-size: 13px;
  border-top: 1px solid var(--color-border-light);
  padding-top: 12px;
}

.list-view {
  background: white;
  padding: 24px;
  border-radius: 12px;
}
</style>
