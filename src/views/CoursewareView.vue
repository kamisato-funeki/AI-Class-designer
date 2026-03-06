<template>
  <a-spin :spinning="loading">
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
        <a-input-search v-model:value="searchKeyword" placeholder="搜索课件名称..." style="width: 300px" />
        <a-select v-model:value="filterSubject" style="width: 120px; margin-left:16px">
          <a-select-option value="all">全部分类</a-select-option>
          <a-select-option value="数学">数学</a-select-option>
          <a-select-option value="语文">语文</a-select-option>
          <a-select-option value="英语">英语</a-select-option>
        </a-select>
        <a-select v-model:value="sortOrder" style="width: 120px; margin-left:16px">
          <a-select-option value="newest">最新编辑</a-select-option>
          <a-select-option value="name">按名称排列</a-select-option>
        </a-select>
      </div>

      <!-- Grid View -->
      <div v-if="viewMode === 'grid'" class="grid-view">
        <a-card hoverable class="cw-card" v-for="cw in filteredCoursewares" :key="cw.id"
          @click="$router.push('/cocreation')">
          <template #cover>
            <div class="cover-img" :style="{ backgroundImage: `url(${cw.coverImage})`, backgroundSize: 'cover' }">
              <div
                style="background: rgba(255,255,255,0.7); padding: 4px 8px; border-radius: 4px; color: var(--color-primary)">
                {{ cw.subject }}·{{ cw.grade }}
              </div>
            </div>
          </template>
          <a-card-meta :title="cw.title" :description="cw.status === 'draft' ? '草稿' : '已发布'">
          </a-card-meta>
          <div class="tags-area" @click.stop>
            <a-tag v-for="tag in cw.tags" :key="tag" closable @close.prevent="handleRemoveTag(cw.id, tag)"
              color="blue">{{ tag
              }}</a-tag>
            <a-tag style="background: #fff; border-style: dashed; cursor: pointer;" @click="openTagModal(cw.id)">
              <PlusOutlined /> 新增标签
            </a-tag>
          </div>
          <div class="card-actions" @click.stop>
            <span>{{ cw.updateTime.split(' ')[0] }}编辑</span>
            <a-dropdown>
              <a class="ant-dropdown-link" @click.prevent>
                <MoreOutlined />
              </a>
              <template #overlay>
                <a-menu>
                  <a-menu-item @click="$router.push('/cocreation')">继续编辑</a-menu-item>
                  <a-menu-divider />
                  <a-menu-item danger>移至回收站</a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </div>
        </a-card>
        <a-empty v-if="filteredCoursewares.length === 0" description="没有找到课件" style="grid-column: span auto;" />
      </div>

      <!-- List View -->
      <div v-else class="list-view">
        <a-table :dataSource="listDataSource" :columns="columns">
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'tags'">
              <a-tag v-for="tag in record.tags" :key="tag" color="blue">{{ tag }}</a-tag>
            </template>
            <template v-else-if="column.key === 'action'">
              <a-button type="link" @click="$router.push('/cocreation')">编辑</a-button>
            </template>
          </template>
        </a-table>
      </div>

      <!-- Tag Modal -->
      <a-modal v-model:open="tagModalVisible" title="添加标签" :footer="null">
        <a-input-search v-model:value="newTagValue" placeholder="输入新标签" enter-button="添加" @search="handleAddTag" />
      </a-modal>
    </div>
  </a-spin>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import {
  AppstoreOutlined,
  BarsOutlined,
  MoreOutlined,
  PlusOutlined
} from '@ant-design/icons-vue';
import { useCoursewareStore } from '../stores/coursewareStore';

const coursewareStore = useCoursewareStore();
const viewMode = ref('grid');
const loading = ref(true);

const searchKeyword = ref('');
const filterSubject = ref('all');
const sortOrder = ref('newest');

onMounted(() => {
  loading.value = true;
  coursewareStore.loadCoursewares().finally(() => {
    loading.value = false;
  });
});

const filteredCoursewares = computed(() => {
  let list = coursewareStore.coursewares;
  if (filterSubject.value !== 'all') {
    list = list.filter(c => c.subject === filterSubject.value);
  }
  if (searchKeyword.value) {
    list = list.filter(c => c.title.toLowerCase().includes(searchKeyword.value.toLowerCase()));
  }
  const result = [...list];
  if (sortOrder.value === 'name') {
    result.sort((a, b) => a.title.localeCompare(b.title));
  } else {
    // mock sort by time
    result.sort((a, b) => new Date(b.updateTime).getTime() - new Date(a.updateTime).getTime());
  }
  return result;
});

const columns = [
  { title: '标题', dataIndex: 'title', key: 'title' },
  { title: '科目/年级', dataIndex: 'subject', key: 'subject' },
  { title: '标签', dataIndex: 'tags', key: 'tags' },
  { title: '最后编辑', dataIndex: 'time', key: 'time' },
  { title: '操作', key: 'action' },
];

const listDataSource = computed(() => {
  return filteredCoursewares.value.map(c => ({
    key: c.id,
    title: c.title,
    subject: c.subject + '·' + c.grade,
    tags: c.tags,
    time: c.updateTime
  }));
});

const tagModalVisible = ref(false);
const newTagValue = ref('');
const currentCwId = ref('');

const openTagModal = (id: string) => {
  currentCwId.value = id;
  newTagValue.value = '';
  tagModalVisible.value = true;
};

const handleAddTag = () => {
  if (newTagValue.value && currentCwId.value) {
    const cw = coursewareStore.coursewares.find(c => c.id === currentCwId.value);
    if (cw && !cw.tags.includes(newTagValue.value)) {
      cw.tags.push(newTagValue.value);
      message.success('标签添加成功');
    }
    newTagValue.value = '';
  }
};

const handleRemoveTag = (id: string, tag: string) => {
  const cw = coursewareStore.coursewares.find(c => c.id === id);
  if (cw) {
    cw.tags = cw.tags.filter(t => t !== tag);
  }
};
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
